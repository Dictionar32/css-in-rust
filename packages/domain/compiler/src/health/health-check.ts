/**
 * tailwind-styled-v5 — Health Check System
 * 
 * Implements health check protocol untuk native bridge monitoring
 * dan automatic fallback ke JS implementation jika needed.
 * 
 * Area 2: Health Check & Graceful Degradation
 */

import { z } from "zod"

// =============================================================================
// HEALTH STATUS TYPES
// =============================================================================

export type HealthStatusType = "healthy" | "degraded" | "unhealthy"

export interface BridgeHealthStatus {
  status: HealthStatusType
  version: string
  uptime: number
  memoryUsage: {
    rust: number
    js: number
  }
  cacheStats: {
    hitRate: number
    size: number
    maxSize: number
  }
  lastError?: {
    timestamp: number
    message: string
    stack?: string
  }
}

export interface HealthCheckConfig {
  readonly checkIntervalMs: number
  readonly maxConsecutiveFailures: number
  readonly recoveryTimeoutMs: number
  readonly enableAutoFallback: boolean
}

export const DEFAULT_HEALTH_CONFIG: HealthCheckConfig = {
  checkIntervalMs: 30000,      // 30 detik
  maxConsecutiveFailures: 3,    // 3x failure = unhealthy
  recoveryTimeoutMs: 60000,     // 60 detik timeout
  enableAutoFallback: true       // Auto-fallback enabled by default
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

export const BridgeHealthStatusSchema = z.object({
  status: z.enum(["healthy", "degraded", "unhealthy"]),
  version: z.string(),
  uptime: z.number(),
  memoryUsage: z.object({
    rust: z.number(),
    js: z.number(),
  }),
  cacheStats: z.object({
    hitRate: z.number(),
    size: z.number(),
    maxSize: z.number(),
  }),
  lastError: z.object({
    timestamp: z.number(),
    message: z.string(),
    stack: z.string().optional(),
  }).optional(),
})

export const HealthCheckConfigSchema = z.object({
  checkIntervalMs: z.number().min(1000).max(300000),
  maxConsecutiveFailures: z.number().min(1).max(10),
  recoveryTimeoutMs: z.number().min(1000).max(600000),
  enableAutoFallback: z.boolean(),
})

// =============================================================================
// HEALTH CHECKER CLASS
// =============================================================================

export class NativeBridgeHealthChecker {
  private lastHealthCheck: number = 0
  private consecutiveFailures: number = 0
  private currentStatus: BridgeHealthStatus | null = null
  private config: HealthCheckConfig
  private isChecking: boolean = false

  constructor(config: Partial<HealthCheckConfig> = {}) {
    const parsed = HealthCheckConfigSchema.parse({
      ...DEFAULT_HEALTH_CONFIG,
      ...config,
    })
    this.config = parsed
  }

  async check(bridge: unknown): Promise<BridgeHealthStatus> {
    if (this.isChecking) {
      return this.currentStatus ?? this.createUnhealthyStatus("Health check already in progress")
    }

    this.isChecking = true
    const startTime = Date.now()

    try {
      const healthCheckFn = (bridge as { healthCheck?: () => Promise<BridgeHealthStatus> }).healthCheck
      
      if (!healthCheckFn) {
        // No health check method - assume healthy
        this.consecutiveFailures = 0
        this.currentStatus = this.createHealthyStatus()
        this.lastHealthCheck = startTime
        return this.currentStatus
      }

      const status = await this.withTimeout(healthCheckFn(), this.config.recoveryTimeoutMs)
      
      // Validate response
      const validated = BridgeHealthStatusSchema.parse(status)
      
      this.consecutiveFailures = 0
      this.currentStatus = validated
      this.lastHealthCheck = startTime
      
      return validated
    } catch (error) {
      this.consecutiveFailures++
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.currentStatus = this.createDegradedStatus(errorMessage, error instanceof Error ? error.stack : undefined)
      
      // Check if should mark as unhealthy
      if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
        this.currentStatus = this.createUnhealthyStatus(
          `Max failures reached (${this.consecutiveFailures})`,
          errorMessage,
          error instanceof Error ? error.stack : undefined
        )
      }
      
      return this.currentStatus
    } finally {
      this.isChecking = false
    }
  }

  isHealthy(status?: BridgeHealthStatus): boolean {
    const checkStatus = status ?? this.currentStatus
    return checkStatus?.status === "healthy"
  }

  isDegraded(status?: BridgeHealthStatus): boolean {
    const checkStatus = status ?? this.currentStatus
    return checkStatus?.status === "degraded"
  }

  shouldFallback(status?: BridgeHealthStatus): boolean {
    const checkStatus = status ?? this.currentStatus
    if (!checkStatus) return this.config.enableAutoFallback
    
    return checkStatus.status === "unhealthy" || 
           (checkStatus.status === "degraded" && this.consecutiveFailures >= this.config.maxConsecutiveFailures)
  }

  shouldCheckAgain(): boolean {
    const timeSinceLastCheck = Date.now() - this.lastHealthCheck
    return timeSinceLastCheck >= this.config.checkIntervalMs
  }

  getCurrentStatus(): BridgeHealthStatus | null {
    return this.currentStatus
  }

  reset(): void {
    this.consecutiveFailures = 0
    this.lastHealthCheck = 0
    this.currentStatus = null
  }

  // Private helpers
  private createHealthyStatus(): BridgeHealthStatus {
    return {
      status: "healthy",
      version: process.env.NATIVE_VERSION ?? "unknown",
      uptime: Date.now(),
      memoryUsage: { rust: 0, js: 0 },
      cacheStats: { hitRate: 1.0, size: 0, maxSize: 10000 },
    }
  }

  private createDegradedStatus(message: string, stack?: string): BridgeHealthStatus {
    return {
      status: "degraded",
      version: process.env.NATIVE_VERSION ?? "unknown",
      uptime: 0,
      memoryUsage: { rust: 0, js: 0 },
      cacheStats: { hitRate: 0, size: 0, maxSize: 10000 },
      lastError: {
        timestamp: Date.now(),
        message,
        stack,
      },
    }
  }

  private createUnhealthyStatus(reason: string, message?: string, stack?: string): BridgeHealthStatus {
    return {
      status: "unhealthy",
      version: process.env.NATIVE_VERSION ?? "unknown",
      uptime: 0,
      memoryUsage: { rust: 0, js: 0 },
      cacheStats: { hitRate: 0, size: 0, maxSize: 10000 },
      lastError: {
        timestamp: Date.now(),
        message: message ?? reason,
        stack,
      },
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Health check timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ])
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalHealthChecker: NativeBridgeHealthChecker | null = null

export function getGlobalHealthChecker(config?: Partial<HealthCheckConfig>): NativeBridgeHealthChecker {
  if (!globalHealthChecker) {
    globalHealthChecker = new NativeBridgeHealthChecker(config)
  }
  return globalHealthChecker
}

export function resetGlobalHealthChecker(): void {
  globalHealthChecker = null
}

// =============================================================================
// RE-EXPORT FOR CONVENIENCE
// =============================================================================

export type { BridgeHealthStatus as HealthStatus } from "./health-events"