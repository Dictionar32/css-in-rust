/**
 * tailwind-styled-v5 — JSON Exporter
 * 
 * Export telemetry data to JSON file for CI/CD.
 */

import type { BuildMetrics, AggregatedStats } from "./metrics"

export interface JsonExportOptions {
  pretty?: boolean
  includeMetadata?: boolean
  filePath?: string
}

export function exportToJson(
  metrics: BuildMetrics | BuildMetrics[],
  stats: AggregatedStats,
  options: JsonExportOptions = {}
): string {
  const { pretty = true, includeMetadata = true } = options

  const data: Record<string, unknown> = {
    ...(Array.isArray(metrics) ? { builds: metrics } : { build: metrics }),
    aggregated: stats,
  }

  if (includeMetadata) {
    data._metadata = {
      exportedAt: new Date().toISOString(),
      version: process.env.NATIVE_VERSION ?? "unknown",
      environment: process.env.NODE_ENV ?? "development",
    }
  }

  return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
}

export function saveToFile(content: string, filePath: string): boolean {
  try {
    const fs = require("node:fs")
    fs.writeFileSync(filePath, content, "utf-8")
    return true
  } catch (error) {
    console.error(`[Telemetry] Failed to save to ${filePath}:`, error)
    return false
  }
}

export function loadFromFile(filePath: string): string | null {
  try {
    const fs = require("node:fs")
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8")
    }
  } catch (error) {
    console.error(`[Telemetry] Failed to load from ${filePath}:`, error)
  }
  return null
}

export const jsonExporter = {
  export: exportToJson,
  saveToFile,
  loadFromFile,
}