/**
 * tailwind-styled-v5 — Telemetry Collector
 * 
 * Core collector for build metrics and performance tracking.
 * 
 * Area 3: Telemetry & Observability
 */

import { getGlobalTelemetry, resetGlobalTelemetry } from "../telemetry"

interface BuildContext {
  buildId: string
  startTime: number
  stages: {
    scan?: number
    extract?: number
    compile?: number
    write?: number
  }
  stageStartTimes: Map<string, number>
}

export class TelemetryCollector {
  private builds: Map<string, BuildContext> = new Map()
  private currentBuild: BuildContext | null = null
  private buildCount = 0
  private errorCount = 0

  startBuild(buildId?: string): string {
    const id = buildId ?? `build-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    this.buildCount++

    this.currentBuild = {
      buildId: id,
      startTime: Date.now(),
      stages: {},
      stageStartTimes: new Map(),
    }

    this.builds.set(id, this.currentBuild)

    if (process.env.TWS_DEBUG === "1") {
      console.debug(`[Telemetry] Build started: ${id}`)
    }

    return id
  }

  stageStart(stage: keyof BuildStageTiming): void {
    if (!this.currentBuild) {
      console.warn("[Telemetry] stageStart called without active build")
      return
    }

    this.currentBuild.stageStartTimes.set(stage, Date.now())
  }

  stageEnd(stage: keyof BuildStageTiming, metadata?: Record<string, unknown>): void {
    if (!this.currentBuild) {
      console.warn("[Telemetry] stageEnd called without active build")
      return
    }

    const startTime = this.currentBuild.stageStartTimes.get(stage)
    if (startTime === undefined) {
      console.warn(`[Telemetry] stageEnd called without stageStart: ${stage}`)
      return
    }

    const duration = Date.now() - startTime
    this.currentBuild.stages[stage] = duration
    this.currentBuild.stageStartTimes.delete(stage)

    if (process.env.TWS_DEBUG === "1") {
      console.debug(`[Telemetry] Stage ${stage}: ${duration}ms`, metadata ?? "")
    }
  }

  endBuild(options?: {
    success?: boolean
    error?: string
    cacheHits?: number
    cacheMisses?: number
    cssSize?: number
    classCount?: number
    fileCount?: number
    mode?: "build" | "watch" | "incremental"
  }): BuildMetrics {
    if (!this.currentBuild) {
      throw new Error("No active build to end")
    }

    const build = this.currentBuild
    const duration = Date.now() - build.startTime
    const success = options?.success ?? true

    if (!success) {
      this.errorCount++
    }

    const metrics: BuildMetrics = {
      buildId: build.buildId,
      timestamp: build.startTime,
      duration,
      stages: {
        scan: build.stages.scan ?? 0,
        extract: build.stages.extract ?? 0,
        compile: build.stages.compile ?? 0,
        write: build.stages.write ?? 0,
      },
      cache: {
        hitRate: this.calculateHitRate(options?.cacheHits ?? 0, options?.cacheMisses ?? 0),
        hits: options?.cacheHits ?? 0,
        misses: options?.cacheMisses ?? 0,
        size: 0,
        maxSize: 10000,
      },
      memory: { rust: 0, js: 0, total: 0 },
      output: {
        cssSize: options?.cssSize ?? 0,
        classCount: options?.classCount ?? 0,
        fileCount: options?.fileCount ?? 0,
        uniqueClasses: options?.classCount ?? 0,
      },
      mode: options?.mode ?? "build",
      success,
      error: options?.error,
    }

    if (process.env.TWS_DEBUG === "1") {
      console.debug(`[Telemetry] Build ${build.buildId} completed in ${duration}ms (${success ? "success" : "failed"})`)
    }

    this.currentBuild = null
    return metrics
  }

  recordError(error: string): void {
    this.errorCount++
    if (process.env.TWS_DEBUG === "1") {
      console.debug(`[Telemetry] Error recorded: ${error}`)
    }
  }

  getBuilds(limit = 100): BuildMetrics[] {
    const builds = Array.from(this.builds.values()).slice(-limit)
    return builds.map((b) => ({
      buildId: b.buildId,
      timestamp: b.startTime,
      duration: 0,
      stages: b.stages as BuildStageTiming,
      cache: { hitRate: 0, hits: 0, misses: 0, size: 0, maxSize: 0 },
      memory: { rust: 0, js: 0, total: 0 },
      output: { cssSize: 0, classCount: 0, fileCount: 0, uniqueClasses: 0 },
      mode: "build" as const,
      success: true,
    }))
  }

  getStats(): AggregatedStats {
    const buildValues = Array.from(this.builds.values())
    const durations = buildValues.map((b) => Date.now() - b.startTime).filter((d) => d > 0)

    return {
      totalBuilds: this.buildCount,
      successfulBuilds: this.buildCount - this.errorCount,
      failedBuilds: this.errorCount,
      avgDuration: this.average(durations),
      p50Duration: this.percentile(durations, 50),
      p90Duration: this.percentile(durations, 90),
      p99Duration: this.percentile(durations, 99),
      avgCacheHitRate: 0,
      avgCssSize: 0,
      avgClassCount: 0,
    }
  }

  clear(): void {
    this.builds.clear()
    this.currentBuild = null
    this.buildCount = 0
    this.errorCount = 0
  }

  private calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses
    return total > 0 ? hits / total : 0
  }

  private average(nums: number[]): number {
    if (nums.length === 0) return 0
    return nums.reduce((a, b) => a + b, 0) / nums.length
  }

  private percentile(nums: number[], p: number): number {
    if (nums.length === 0) return 0
    const sorted = [...nums].sort((a, b) => a - b)
    const idx = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, idx)] ?? 0
  }
}

import type { BuildStageTiming, BuildMetrics, AggregatedStats } from "./metrics"

let globalCollector: TelemetryCollector | null = null

export function getGlobalTelemetryCollector(): TelemetryCollector {
  if (!globalCollector) {
    globalCollector = new TelemetryCollector()
  }
  return globalCollector
}

export function resetGlobalTelemetryCollector(): void {
  globalCollector = null
}