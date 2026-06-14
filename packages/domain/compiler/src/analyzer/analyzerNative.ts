/**
 * analyzerNative.ts
 *
 * Native Rust bindings for CSS analysis and optimization.
 */

import { getNativeBridge } from "../nativeBridge"
export type {
  DeadCodeResult,
  ClassUsageItem,
  ContainerConfig,
  HoistResult,
  VariantTableResult,
  ClassifyResult,
  MergeResult,
  ProcessedCssResult,
} from "../nativeBridge"

/**
 * Detect dead CSS selectors in generated CSS.
 */
export function detectDeadCode(scanResultJson: string, css: string) {
  const native = getNativeBridge()
  if (!native?.detectDeadCode) throw new Error("detectDeadCode not available")
  return native.detectDeadCode(scanResultJson, css)
}

/**
 * Analyze class usage across scanned files.
 */
export function analyzeClassUsageNative(classes: string[], scanResultJson: string, css: string) {
  const native = getNativeBridge()
  if (!native?.analyzeClassUsage) throw new Error("analyzeClassUsage not available")
  return native.analyzeClassUsage(classes, scanResultJson, css)
}

/**
 * Analyze entire class list and generate CSS.
 */
export function analyzeClassesNative(filesJson: string, cwd: string, flags?: number) {
  const native = getNativeBridge()
  if (!native?.analyzeClasses) throw new Error("analyzeClasses not available")
  return native.analyzeClasses(filesJson, cwd, flags ?? 0)
}

/**
 * Analyze React Server Component requirements.
 */
export function analyzeRscNative(source: string, filename: string) {
  const native = getNativeBridge()
  if (!native?.analyzeRsc) throw new Error("analyzeRsc not available")
  return native.analyzeRsc(source, filename)
}

/**
 * Optimize CSS by removing dead code and minifying.
 */
export function optimizeCssNative(css: string) {
  const native = getNativeBridge()
  if (!native?.processTailwindCssLightning) throw new Error("processTailwindCssLightning not available")
  const result = native.processTailwindCssLightning(css)
  return {
    css: result.css,
    originalSize: css.length,
    optimizedSize: result.size_bytes,
    reductionPercentage: ((css.length - result.size_bytes) / css.length) * 100,
  }
}

/**
 * Process Tailwind CSS with Lightning CSS post-processing.
 */
export function processTailwindCssLightning(css: string) {
  const native = getNativeBridge()
  if (!native?.processTailwindCssLightning) throw new Error("processTailwindCssLightning not available")
  return native.processTailwindCssLightning(css)
}

/**
 * Eliminate dead CSS selectors.
 */
export function eliminateDeadCssNative(css: string, deadClasses: string[]): string {
  const native = getNativeBridge()
  if (!native?.eliminateDeadCss) throw new Error("eliminateDeadCss not available")
  return native.eliminateDeadCss(css, deadClasses)
}

/**
 * Hoist components from source code.
 */
export function hoistComponentsNative(source: string) {
  const native = getNativeBridge()
  if (!native?.hoistComponents) throw new Error("hoistComponents not available")
  return native.hoistComponents(source)
}

/**
 * Compile variant configuration table.
 */
export function compileVariantTableNative(configJson: string) {
  const native = getNativeBridge()
  if (!native?.compileVariantTable) throw new Error("compileVariantTable not available")
  return native.compileVariantTable(configJson)
}

/**
 * Classify and sort classes by bucket.
 */
export function classifyAndSortClassesNative(classes: string[]) {
  const native = getNativeBridge()
  if (!native?.classifyAndSortClasses) throw new Error("classifyAndSortClasses not available")
  return native.classifyAndSortClasses(classes)
}

/**
 * Merge CSS declarations from multiple chunks.
 */
export function mergeCssDeclarationsNative(cssChunks: string[]) {
  const native = getNativeBridge()
  if (!native?.mergeCssDeclarations) throw new Error("mergeCssDeclarations not available")
  return native.mergeCssDeclarations(cssChunks)
}

// ── TYPE DEFINITIONS: Analysis & Memory Profiling ───────────────────────────

export interface MemoryStats {
  status: string
  memory: {
    allocated_bytes: number
    freed_bytes: number
    in_use_bytes: number
    allocated_mb: number
    freed_mb: number
    in_use_mb: number
  }
  system: {
    cache_entries: number
    active_operations: number
  }
}

export interface MemoryRecommendations {
  status: string
  current_memory_mb: number
  recommendation: string
  priority: string
  suggestions: string[]
}

export interface OptimalCacheConfigAnalysis {
  status: string
  workload_type: string
  expected_entries: number
  recommended_backend: string
  recommended_capacity: number
  estimated_memory_mb: number
  ttl_seconds: number
  details: {
    backend_explanation: string
    capacity_explanation: string
    memory_estimate: string
  }
}

export interface Week6FeaturesStatus {
  status: string
  week: number
  features: Record<string, {
    implemented: boolean
    status: string
    capacity?: string
    hit_rate_optimization?: boolean
    metrics?: string[]
  }>
  optimization_hints: Record<string, string>
}

// ── EXPORTED WRAPPERS ───────────────────────────────────────────────────────

/**
 * Get Week 6 features status.
 */
export function getWeek6FeaturesStatus(): Week6FeaturesStatus {
  const native = getNativeBridge()
  if (!native?.getWeek6FeaturesStatus) throw new Error("getWeek6FeaturesStatus not available")
  const resultJson = native.getWeek6FeaturesStatus()
  return JSON.parse(resultJson)
}

/**
 * Get current memory statistics from native Rust engine.
 */
export function getMemoryStatsNative(): MemoryStats {
  const native = getNativeBridge()
  if (!native?.getMemoryStatsNative) throw new Error("getMemoryStatsNative not available")
  const resultJson = native.getMemoryStatsNative()
  return JSON.parse(resultJson)
}

/**
 * Get memory recommendations based on current usage.
 */
export function getMemoryRecommendationsNative(): MemoryRecommendations {
  const native = getNativeBridge()
  if (!native?.getMemoryRecommendationsNative) throw new Error("getMemoryRecommendationsNative not available")
  const resultJson = native.getMemoryRecommendationsNative()
  return JSON.parse(resultJson)
}

/**
 * Estimate optimal cache config based on workload and entries count.
 */
export function estimateOptimalCacheConfigNative(workloadType: string, expectedEntries: number): OptimalCacheConfigAnalysis {
  const native = getNativeBridge()
  if (!native?.estimateOptimalCacheConfigNative) throw new Error("estimateOptimalCacheConfigNative not available")
  const resultJson = native.estimateOptimalCacheConfigNative(workloadType, expectedEntries)
  return JSON.parse(resultJson)
}

/**
 * Reset memory statistics tracking counters.
 */
export function resetMemoryStats(): void {
  const native = getNativeBridge()
  if (!native?.resetMemoryStats) throw new Error("resetMemoryStats not available")
  native.resetMemoryStats()
}
