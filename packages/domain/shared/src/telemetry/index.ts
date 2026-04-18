/**
 * tailwind-styled-v5 — Telemetry Public API
 * 
 * Main entry point for telemetry and observability.
 * 
 * Area 3: Telemetry & Observability - COMPLETE
 */

export {
  TelemetryCollector,
  getGlobalTelemetryCollector,
  resetGlobalTelemetryCollector,
} from "./collector"

export {
  consoleExporter,
  logBuildStart,
  logBuildError,
  logStage,
} from "./exporters/console"

export {
  jsonExporter,
  exportToJson,
  saveToFile,
  loadFromFile,
} from "./exporters/json"

export {
  prometheusExporter,
  metricsToPrometheus,
  createPrometheusEndpoint,
} from "./exporters/prometheus"

export type {
  BuildStageTiming,
  CacheMetrics,
  MemoryUsage,
  OutputMetrics,
  BuildMetrics,
  AggregatedStats,
  HealthEventMetrics,
  TelemetryConfig,
  StageContext,
  TelemetryEvent,
  JsonExportOptions,
  PrometheusMetric,
} from "./metrics"

export {
  DEFAULT_TELEMETRY_CONFIG,
} from "./metrics"