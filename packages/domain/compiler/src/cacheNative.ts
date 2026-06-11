/**
 * cacheNative.ts
 *
 * Phase 5.1: Cache Management - Advanced caching strategies and optimization
 * Exposes 9 cache-related Rust functions for improved performance tuning
 */

import { getNativeBridge } from "./nativeBridge"

/**
 * Cache optimization hints and recommendations
 */
export interface CacheOptimizationHints {
  current_strategy: string
  recommended_strategy: string
  estimated_improvement_percent: number
  suggested_memory_mb: number
  notes: string[]
}

/**
 * Optimal cache configuration recommendations
 */
export interface OptimalCacheConfig {
  parse_cache_size: number
  resolve_cache_size: number
  compile_cache_size: number
  css_gen_cache_size: number
  recommended_eviction_policy: string
  ttl_seconds: number
  expected_hit_rate_percent: number
}

/**
 * Cache statistics from all layers
 */
export interface CacheStatistics {
  parse_cache: { hits: number; misses: number; size: number }
  resolve_cache: { hits: number; misses: number; size: number }
  compile_cache: { hits: number; misses: number; size: number }
  css_gen_cache: { hits: number; misses: number; size: number }
  overall_hit_rate: number
  total_memory_bytes: number
}

/**
 * Get comprehensive cache statistics across all layers
 * Useful for monitoring and optimization
 *
 * @returns Cache stats including hit rates, sizes, and recommendations
 * @example
 * ```ts
 * const stats = getCacheStatistics()
 * console.log(`Overall hit rate: ${stats.overall_hit_rate}%`)
 * console.log(`Total memory used: ${stats.total_memory_bytes / 1024}KB`)
 * ```
 */
export function getCacheStatistics(): CacheStatistics {
  const native = getNativeBridge()
  if (!native?.get_cache_statistics) throw new Error("get_cache_statistics not available")
  const statsJson = native.get_cache_statistics()
  try {
    return JSON.parse(statsJson)
  } catch {
    return {
      parse_cache: { hits: 0, misses: 0, size: 0 },
      resolve_cache: { hits: 0, misses: 0, size: 0 },
      compile_cache: { hits: 0, misses: 0, size: 0 },
      css_gen_cache: { hits: 0, misses: 0, size: 0 },
      overall_hit_rate: 0,
      total_memory_bytes: 0,
    }
  }
}

/**
 * Clear all caches (parse, resolve, compile, CSS generation)
 * Use when switching themes or major configuration changes
 *
 * @example
 * ```ts
 * // Clear before switching themes
 * clearAllCaches()
 * const css = await generateCssNative(classes, { theme: newTheme })
 * ```
 */
export function clearAllCaches(): void {
  const native = getNativeBridge()
  if (!native?.clear_all_caches) return
  try {
    native.clear_all_caches()
  } catch {
    // Silently ignore if not available
  }
}

/**
 * Clear only the parse cache
 * Useful when parser behavior changes or cache gets stale
 */
export function clearParseCache(): void {
  const native = getNativeBridge()
  if (!native?.clear_parse_cache) return
  try {
    native.clear_parse_cache()
  } catch {
    // Silently ignore
  }
}

/**
 * Clear only the resolve cache
 * Use when theme configuration changes
 */
export function clearResolveCache(): void {
  const native = getNativeBridge()
  if (!native?.clear_resolve_cache) return
  try {
    native.clear_resolve_cache()
  } catch {
    // Silently ignore
  }
}

/**
 * Clear only the compile cache
 * Use when Tailwind configuration changes
 */
export function clearCompileCache(): void {
  const native = getNativeBridge()
  if (!native?.clear_compile_cache) return
  try {
    native.clear_compile_cache()
  } catch {
    // Silently ignore
  }
}

/**
 * Clear only the CSS generation cache
 * Use when theme or layout changes
 */
export function clearCssGenCache(): void {
  const native = getNativeBridge()
  if (!native?.clear_css_gen_cache) return
  try {
    native.clear_css_gen_cache()
  } catch {
    // Silently ignore
  }
}

/**
 * Get optimization hints based on current cache performance
 * Analyzes hit rates and suggests improvements
 *
 * @param hitRatePercent - Current hit rate (0-100)
 * @param memoryUsedMb - Memory currently used in MB
 * @returns Optimization recommendations
 *
 * @example
 * ```ts
 * const stats = getCacheStatistics()
 * const hints = getCacheOptimizationHints(
 *   stats.overall_hit_rate,
 *   stats.total_memory_bytes / (1024 * 1024)
 * )
 * console.log(`Recommendation: ${hints.recommended_strategy}`)
 * console.log(`Potential improvement: ${hints.estimated_improvement_percent}%`)
 * ```
 */
export function getCacheOptimizationHints(
  hitRatePercent: number,
  memoryUsedMb: number
): CacheOptimizationHints {
  const native = getNativeBridge()
  if (!native?.get_cache_optimization_hints)
    throw new Error("get_cache_optimization_hints not available")
  const hintsJson = native.get_cache_optimization_hints(
    Math.min(100, Math.max(0, hitRatePercent)),
    Math.max(1, memoryUsedMb)
  )
  try {
    return JSON.parse(hintsJson)
  } catch {
    return {
      current_strategy: "unknown",
      recommended_strategy: "increase_size",
      estimated_improvement_percent: 0,
      suggested_memory_mb: 256,
      notes: ["Unable to analyze cache statistics"],
    }
  }
}

/**
 * Estimate optimal cache configuration for your workload
 * Analyzes typical patterns and recommends sizes
 *
 * @param totalBudgetMb - Maximum memory budget in MB
 * @param workloadType - "small" (< 100 files), "medium" (100-1000), "large" (1000+)
 * @returns Recommended cache configuration
 *
 * @example
 * ```ts
 * const config = estimateOptimalCacheConfig(512, 'large')
 * console.log(`Parse cache: ${config.parse_cache_size}MB`)
 * console.log(`Expected hit rate: ${config.expected_hit_rate_percent}%`)
 * ```
 */
export function estimateOptimalCacheConfig(
  totalBudgetMb: number,
  workloadType: "small" | "medium" | "large"
): OptimalCacheConfig {
  const native = getNativeBridge()
  if (!native?.estimate_optimal_cache_config_native)
    throw new Error("estimate_optimal_cache_config_native not available")
  const configJson = native.estimate_optimal_cache_config_native(
    Math.max(64, totalBudgetMb),
    workloadType
  )
  try {
    return JSON.parse(configJson)
  } catch {
    // Return sensible defaults
    return {
      parse_cache_size: 128,
      resolve_cache_size: 64,
      compile_cache_size: 256,
      css_gen_cache_size: 128,
      recommended_eviction_policy: "lru",
      ttl_seconds: 3600,
      expected_hit_rate_percent: 75,
    }
  }
}

/**
 * Read cache from disk (persistence)
 * Restores cached data from previous sessions
 *
 * @param cachePath - Path to cache file
 * @returns Entries loaded from disk
 *
 * @example
 * ```ts
 * const entries = cacheRead('./.tw-cache/scan.json')
 * // Warm up cache with persisted data
 * ```
 */
export function cacheRead(cachePath: string): Array<{
  file: string
  contentHash: string
  classes: string[]
  mtimeMs: number
  sizeBytes: number
}> {
  const native = getNativeBridge()
  if (!native?.cache_read) throw new Error("cache_read not available")
  const result = native.cache_read(cachePath)
  try {
    return JSON.parse(result.entries_json || "[]")
  } catch {
    return []
  }
}

/**
 * Write cache to disk (persistence)
 * Saves cached data for next session
 *
 * @param cachePath - Path where cache should be written
 * @param entries - Cache entries to persist
 * @returns Success status
 *
 * @example
 * ```ts
 * const stats = getCacheStatistics()
 * const success = cacheWrite(
 *   './.tw-cache/scan.json',
 *   // entries array from previous scan
 * )
 * ```
 */
export function cacheWrite(
  cachePath: string,
  entries: Array<{
    file: string
    contentHash: string
    classes: string[]
    mtimeMs: number
    sizeBytes: number
  }>
): boolean {
  const native = getNativeBridge()
  if (!native?.cache_write) throw new Error("cache_write not available")
  try {
    const result = native.cache_write(
      cachePath,
      entries.map((e) => ({
        file: e.file,
        content_hash: e.contentHash,
        classes: e.classes,
        mtime_ms: e.mtimeMs,
        size_bytes: e.sizeBytes,
      }))
    )
    return typeof result === "boolean" ? result : result === true
  } catch {
    return false
  }
}

/**
 * Calculate cache priority score for file ordering
 * Useful for prioritizing which files to scan first
 *
 * @param mtimeMs - File modification time in milliseconds
 * @param sizeBytes - File size in bytes
 * @param hitCount - Number of times this file was accessed from cache
 * @returns Priority score (higher = process first)
 *
 * @example
 * ```ts
 * const priority = cachePriority(Date.now(), 2048, 5)
 * // Use priority to sort files for scanning
 * ```
 */
export function cachePriority(mtimeMs: number, sizeBytes: number, hitCount: number): number {
  const native = getNativeBridge()
  if (!native?.cache_priority) throw new Error("cache_priority not available")
  return native.cache_priority(mtimeMs, sizeBytes, hitCount)
}
