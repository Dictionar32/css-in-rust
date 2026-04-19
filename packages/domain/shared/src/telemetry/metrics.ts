/**
 * tailwind-styled-v5 — Telemetry Metrics Types
 * 
 * Type definitions for build metrics and telemetry data.
 * 
 * Area 3: Telemetry & Observability
 */

export interface BuildStageTiming {
  readonly scan: number
  readonly extract: number
  readonly compile: number
  readonly write: number
}

export interface CacheMetrics {
  readonly hitRate: number
  readonly hits: number
  readonly misses: number
  readonly size: number
  readonly maxSize: number
}

export interface MemoryUsage {
  readonly rust: number
  readonly js: number
  readonly total: number
}

export interface OutputMetrics {
  readonly cssSize: number
  readonly classCount: number
  readonly fileCount: number
  readonly uniqueClasses: number
}

export interface BuildMetrics {
  readonly buildId: string
  readonly timestamp: number
  readonly duration: number
  readonly stages: BuildStageTiming
  readonly cache: CacheMetrics
  readonly memory: MemoryUsage
  readonly output: OutputMetrics
  readonly mode: "build" | "watch" | "incremental"
  readonly success: boolean
  readonly error?: string
}

export interface AggregatedStats {
  readonly totalBuilds: number
  readonly successfulBuilds: number
  readonly failedBuilds: number
  readonly avgDuration: number
  readonly p50Duration: number
  readonly p90Duration: number
  readonly p99Duration: number
  readonly avgCacheHitRate: number
  readonly avgCssSize: number
  readonly avgClassCount: number
  readonly totalFallbacks: number
}

export interface HealthEventMetrics {
  readonly totalHealthy: number
  readonly totalDegraded: number
  readonly totalUnhealthy: number
  readonly totalFallbacks: number
  readonly totalRecoveries: number
  readonly lastHealthyTime?: number
  readonly lastUnhealthyTime?: number
}

export interface TelemetryConfig {
  readonly enabled: boolean
  readonly flushIntervalMs: number
  readonly maxStoredBuilds: number
  readonly exportFormat: "json" | "console" | "prometheus" | "all"
  readonly exportPath?: string
  readonly includeSensitiveData: boolean
  readonly sampleRate: number
}

export const DEFAULT_TELEMETRY_CONFIG: TelemetryConfig = {
  enabled: process.env.TWS_TELEMETRY_ENABLED === "true",
  flushIntervalMs: 60000,
  maxStoredBuilds: 1000,
  exportFormat: process.env.NODE_ENV === "production" ? "prometheus" : "console",
  exportPath: process.env.TWS_TELEMETRY_PATH,
  includeSensitiveData: false,
  sampleRate: 1.0,
}

export interface StageContext {
  readonly stage: keyof BuildStageTiming
  readonly startTime: number
}

export interface TelemetryEvent {
  readonly type: "build_start" | "build_end" | "stage_start" | "stage_end" | "health_change" | "fallback" | "error"
  readonly timestamp: number
  readonly data: Record<string, unknown>
}