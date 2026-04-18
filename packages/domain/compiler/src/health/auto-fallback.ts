/**
 * tailwind-styled-v5 — Auto-Fallback System
 * 
 * Automatically switches to JS fallback when native bridge is unhealthy.
 * Includes exponential backoff for recovery attempts.
 * 
 * Area 2: Auto-fallback Integration
 */

import { NativeBridgeHealthChecker, type BridgeHealthStatus, type HealthCheckConfig } from "./health-check"
import { HealthEventEmitter, type HealthEvent, type HealthEventType } from "./health-events"
import { getNativeBridge as originalGetNativeBridge } from "../nativeBridge"

export interface FallbackConfig {
  readonly maxFailures: number
  readonly fallbackDelay: number
  readonly retryInterval: number
  readonly exponentialBackoff: boolean
  readonly maxRetryDelay: number
}

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  maxFailures: 3,
  fallbackDelay: 1000,
  retryInterval: 30000,
  exponentialBackoff: true,
  maxRetryDelay: 300000, // 5 minutes max
}

const log = (...args: unknown[]) => {
  if (process.env.DEBUG?.includes("health:fallback")) {
    console.log("[health:fallback]", ...args)
  }
}

export class AutoFallbackManager {
  private currentMode: "native" | "fallback" = "native"
  private fallbackCount = 0
  private lastFallbackTime = 0
  private retryTimer?: ReturnType<typeof setTimeout>
  private isActive = false

  constructor(
    private healthChecker: NativeBridgeHealthChecker,
    private eventEmitter: HealthEventEmitter,
    private config: FallbackConfig = DEFAULT_FALLBACK_CONFIG
  ) {
    this.isActive = true
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.eventEmitter.on("unhealthy", (event) => {
      this.activateFallback(event)
    })

    this.eventEmitter.on("degraded", (event) => {
      if (this.healthChecker.shouldFallback()) {
        this.activateFallback(event)
      }
    })

    this.eventEmitter.on("healthy", () => {
      if (this.currentMode === "fallback") {
        this.deactivateFallback()
      }
    })
  }

  private async activateFallback(event: HealthEvent): Promise<void> {
    if (this.currentMode === "fallback" || !this.isActive) return

    log("Activating JS fallback mode")
    log("Reason:", event.currentStatus.lastError?.message)

    this.currentMode = "fallback"
    this.fallbackCount++
    this.lastFallbackTime = Date.now()

    this.eventEmitter.emit({
      type: "fallback_activated",
      timestamp: Date.now(),
      currentStatus: event.currentStatus,
      details: { reason: event.currentStatus.lastError?.message },
    })

    this.scheduleRetry()
  }

  private scheduleRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }

    let delay = this.config.retryInterval

    if (this.config.exponentialBackoff) {
      const backoffDelay = Math.min(
        this.config.retryInterval * Math.pow(2, this.fallbackCount - 1),
        this.config.maxRetryDelay
      )
      delay = backoffDelay
    }

    log(`Scheduling retry in ${delay}ms (attempt ${this.fallbackCount + 1})`)

    this.retryTimer = setTimeout(() => {
      this.trySwitchToNative()
    }, delay)
  }

  private async trySwitchToNative(): Promise<void> {
    if (this.currentMode === "native" || !this.isActive) return

    log("Attempting to switch back to native engine...")

    try {
      // Try to get native bridge (this will attempt to load it)
      const bridge = originalGetNativeBridge()

      // Check health
      const status = await this.healthChecker.check(bridge)

      if (status.status === "healthy") {
        this.currentMode = "native"
        this.fallbackCount = 0
        log("Successfully switched back to native engine")

        this.eventEmitter.emit({
          type: "fallback_deactivated",
          timestamp: Date.now(),
          currentStatus: status,
        })
      } else {
        throw new Error(`Health check failed: ${status.lastError?.message}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      log(`Failed to switch back: ${message}`)
      this.scheduleRetry()
    }
  }

  async getBridge(): Promise<unknown> {
    if (this.currentMode === "fallback") {
      return this.getJSFallbackBridge()
    }

    try {
      return originalGetNativeBridge()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      
      this.eventEmitter.emit({
        type: "unhealthy",
        timestamp: Date.now(),
        currentStatus: {
          status: "unhealthy",
          version: "unknown",
          uptime: 0,
          memoryUsage: { rust: 0, js: 0 },
          cacheStats: { hitRate: 0, size: 0, maxSize: 0 },
          lastError: { timestamp: Date.now(), message },
        },
        details: { reason: message },
      })

      return this.getJSFallbackBridge()
    }
  }

  private getJSFallbackBridge(): unknown {
    // Simple JS fallback - returns minimal bridge
    // Real implementation would load JS-based transformations
    return {
      transformSource: (source: string) => ({
        code: source,
        classes: [],
        changed: false,
      }),
      healthCheck: () => Promise.resolve({
        status: "healthy" as const,
        version: "js-fallback",
        uptime: Date.now(),
        memoryUsage: { rust: 0, js: 0 },
        cacheStats: { hitRate: 1, size: 0, maxSize: 0 },
      }),
    }
  }

  getMode(): "native" | "fallback" {
    return this.currentMode
  }

  isFallbackActive(): boolean {
    return this.currentMode === "fallback"
  }

  getFallbackCount(): number {
    return this.fallbackCount
  }

  deactivate(): void {
    this.isActive = false
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = undefined
    }
  }

  activate(): void {
    this.isActive = true
  }

  async forceSwitchToNative(): Promise<boolean> {
    try {
      const bridge = originalGetNativeBridge()
      const status = await this.healthChecker.check(bridge)
      
      if (status.status === "healthy") {
        this.currentMode = "native"
        this.fallbackCount = 0
        return true
      }
      return false
    } catch {
      return false
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalFallbackManager: AutoFallbackManager | null = null

export function getGlobalFallbackManager(): AutoFallbackManager {
  if (!globalFallbackManager) {
    const eventEmitter = getGlobalHealthEventEmitter()
    const healthChecker = getGlobalHealthChecker()
    
    globalFallbackManager = new AutoFallbackManager(
      healthChecker,
      eventEmitter,
      DEFAULT_FALLBACK_CONFIG
    )
  }
  return globalFallbackManager
}

export function resetGlobalFallbackManager(): void {
  if (globalFallbackManager) {
    globalFallbackManager.deactivate()
    globalFallbackManager = null
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getGlobalHealthEventEmitter(): HealthEventEmitter {
  // Lazy import to avoid circular dependency
  const { getGlobalHealthEventEmitter: fn } = require("./health-events")
  return fn()
}

function getGlobalHealthChecker(): NativeBridgeHealthChecker {
  const { getGlobalHealthChecker: fn } = require("./health-check")
  return fn()
}