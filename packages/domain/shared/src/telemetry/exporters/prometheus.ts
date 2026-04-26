/**
 * tailwind-styled-v5 — Prometheus Exporter
 * 
 * Export telemetry data in Prometheus format for monitoring.
 */

import type { BuildMetrics, AggregatedStats } from "../metrics"

export interface PrometheusMetric {
  readonly name: string
  readonly type: "gauge" | "counter" | "histogram" | "summary"
  readonly value: number
  readonly labels: Record<string, string>
  readonly help: string
}

export function metricsToPrometheus(
  metrics: BuildMetrics,
  stats: AggregatedStats
): string {
  const lines: string[] = []

  lines.push("# HELP tw_build_duration_ms Build duration in milliseconds")
  lines.push("# TYPE tw_build_duration_ms histogram")
  lines.push(`tw_build_duration_ms_bucket{le="${metrics.duration}"} 1`)
  lines.push(`tw_build_duration_ms_sum ${metrics.duration}`)
  lines.push(`tw_build_duration_ms_count 1`)

  lines.push("")
  lines.push("# HELP tw_build_total Total number of builds")
  lines.push("# TYPE tw_build_total counter")
  lines.push(`tw_build_total{status="${metrics.success ? "success" : "failure"}"} 1`)

  lines.push("")
  lines.push("# HELP tw_stage_duration_ms Duration of each build stage")
  lines.push("# TYPE tw_stage_duration_ms gauge")
  lines.push(`tw_stage_duration_ms{stage="scan"} ${metrics.stages.scan}`)
  lines.push(`tw_stage_duration_ms{stage="extract"} ${metrics.stages.extract}`)
  lines.push(`tw_stage_duration_ms{stage="compile"} ${metrics.stages.compile}`)
  lines.push(`tw_stage_duration_ms{stage="write"} ${metrics.stages.write}`)

  lines.push("")
  lines.push("# HELP tw_cache_hit_rate Cache hit rate")
  lines.push("# TYPE tw_cache_hit_rate gauge")
  lines.push(`tw_cache_hit_rate ${metrics.cache.hitRate.toFixed(4)}`)

  lines.push("")
  lines.push("# HELP tw_output_css_size_bytes CSS output size in bytes")
  lines.push("# TYPE tw_output_css_size_bytes gauge")
  lines.push(`tw_output_css_size_bytes ${metrics.output.cssSize}`)

  lines.push("")
  lines.push("# HELP tw_output_class_count Number of CSS classes")
  lines.push("# TYPE tw_output_class_count gauge")
  lines.push(`tw_output_class_count ${metrics.output.classCount}`)

  lines.push("")
  lines.push("# HELP tw_build_duration_avg_ms Average build duration")
  lines.push("# TYPE tw_build_duration_avg_ms gauge")
  lines.push(`tw_build_duration_avg_ms ${stats.avgDuration.toFixed(2)}`)

  lines.push("")
  lines.push("# HELP tw_build_duration_p90_ms P90 build duration")
  lines.push("# TYPE tw_build_duration_p90_ms gauge")
  lines.push(`tw_build_duration_p90_ms ${stats.p90Duration.toFixed(2)}`)

  lines.push("")
  lines.push("# HELP tw_build_duration_p99_ms P99 build duration")
  lines.push("# TYPE tw_build_duration_p99_ms gauge")
  lines.push(`tw_build_duration_p99_ms ${stats.p99Duration.toFixed(2)}`)

  return lines.join("\n")
}

export function createPrometheusEndpoint(metrics: BuildMetrics, stats: AggregatedStats): Response {
  const body = metricsToPrometheus(metrics, stats)
  
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  })
}

export const prometheusExporter = {
  export: metricsToPrometheus,
  createEndpoint: createPrometheusEndpoint,
}