/**
 * tailwind-styled-v5 — Health Event System
 * 
 * Event emitter untuk health status changes.
 * Used by auto-fallback system untuk monitoring.
 * 
 * Area 2: Event System (complements Health Check)
 */

export type HealthEventType = 
  | "healthy"
  | "degraded"
  | "unhealthy"
  | "recovered"
  | "fallback_activated"
  | "fallback_deactivated"

export interface HealthEvent {
  type: HealthEventType
  timestamp: number
  previousStatus?: BridgeHealthStatus
  currentStatus: BridgeHealthStatus
  details?: Record<string, unknown>
}

export interface BridgeHealthStatus {
  status: "healthy" | "degraded" | "unhealthy"
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

type EventHandler = (event: HealthEvent) => void

export class HealthEventEmitter {
  private listeners: Map<HealthEventType, Set<EventHandler>> = new Map()
  private allListeners: Set<EventHandler> = new Set()

  on(event: HealthEventType, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return () => this.listeners.get(event)?.delete(handler)
  }

  onAny(handler: EventHandler): () => void {
    this.allListeners.add(handler)
    return () => this.allListeners.delete(handler)
  }

  emit(event: HealthEvent): void {
    // Emit to specific event listeners
    const handlers = this.listeners.get(event.type)
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(event)
        } catch (err) {
          console.error(`[HealthEvent] Handler error:`, err)
        }
      })
    }

    // Emit to wildcard listeners
    this.allListeners.forEach((h) => {
      try {
        h(event)
      } catch (err) {
        console.error(`[HealthEvent] Wildcard handler error:`, err)
      }
    })

    // Log important events
    if (event.type === "unhealthy" || event.type === "fallback_activated") {
      console.warn(`[HealthEvent] ${event.type}:`, event.currentStatus.lastError?.message)
    }
  }

  removeAllListeners(event?: HealthEventType): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
      this.allListeners.clear()
    }
  }

  listenerCount(event?: HealthEventType): number {
    if (event) {
      return this.listeners.get(event)?.size ?? 0
    }
    return this.listeners.size + this.allListeners.size
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalEventEmitter: HealthEventEmitter | null = null

export function getGlobalHealthEventEmitter(): HealthEventEmitter {
  if (!globalEventEmitter) {
    globalEventEmitter = new HealthEventEmitter()
  }
  return globalEventEmitter
}

export function resetGlobalHealthEventEmitter(): void {
  globalEventEmitter = null
}