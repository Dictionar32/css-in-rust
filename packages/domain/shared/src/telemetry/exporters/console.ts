/**
 * tailwind-styled-v5 — Console Exporter
 * 
 * Export telemetry data to console for development.
 */

import type { BuildMetrics, AggregatedStats } from "../metrics"

export function exportToConsole(metrics: BuildMetrics, stats: AggregatedStats): void {
  const { duration, stages, cache, output, success } = metrics

  const status = success ? "✅" : "❌"
  console.log(`[Telemetry] Build ${status} completed in ${duration}ms`)
  console.log(`├─ Scan: ${stages.scan}ms`)
  console.log(`├─ Extract: ${stages.extract}ms`)
  console.log(`├─ Compile: ${stages.compile}ms`)
  console.log(`└─ Write: ${stages.write}ms`)

  if (cache.hits > 0 || cache.misses > 0) {
    console.log(`├─ Cache hit rate: ${(cache.hitRate * 100).toFixed(1)}% (${cache.hits}/${cache.hits + cache.misses})`)
  }

  if (output.cssSize > 0) {
    console.log(`└─ Output: ${formatBytes(output.cssSize)} CSS, ${output.classCount} classes, ${output.fileCount} files`)
  }

  if (stats.totalFallbacks > 0) {
    console.log(`⚠️ Fallback count: ${stats.totalFallbacks}`)
  }
}

export function logBuildStart(buildId: string): void {
  console.log(`[Telemetry] Build started: ${buildId}`)
}

export function logBuildError(buildId: string, error: string): void {
  console.error(`[Telemetry] Build failed: ${buildId}`, error)
}

export function logStage(stage: string, duration: number): void {
  console.debug(`[Telemetry] Stage ${stage}: ${duration}ms`)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export const consoleExporter = {
  export: exportToConsole,
  logBuildStart,
  logBuildError,
  logStage,
}