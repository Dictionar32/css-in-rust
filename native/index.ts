/**
 * TypeScript wrapper for NAPI Rust bindings
 * Provides type-safe interfaces and utilities around native functions
 * Week 4 - NAPI Bridge & TypeScript Integration
 */

import * as nativeBase from './index.js'
import * as redisTypes from './index.redis'

// Type-extend the native module to include Redis functions
const native = nativeBase as typeof nativeBase & typeof redisTypes

/**
 * Week 4 Day 1 Exports: Parser & Resolver
 */

export interface ParsedClassResult {
  variants: string[]
  prefix: string
  value: string
  modifier?: string
}

/**
 * Parse a Tailwind class string into components
 * @param input - Tailwind class (e.g., "md:hover:bg-blue-600/50")
 * @returns Parsed class structure
 *
 * @example
 * const result = parseClass("md:hover:bg-blue-600/50")
 * // { variants: ["md", "hover"], prefix: "bg", value: "blue-600", modifier: "50" }
 */
export function parseClass(input: string): ParsedClassResult {
  const resultJson = native.parseClass(input) as unknown as string
  return JSON.parse(resultJson)
}

/**
 * Resolve a color value from theme
 * @param color - Color key (e.g., "blue-600")
 * @returns Hex color value (e.g., "#2563eb")
 */
export function resolveColor(color: string): string {
  return native.resolveColor(color)
}

/**
 * Resolve a spacing value from theme
 * @param spacing - Spacing key (e.g., "4")
 * @returns CSS spacing value (e.g., "1rem")
 */
export function resolveSpacing(spacing: string): string {
  return native.resolveSpacing(spacing)
}

/**
 * Resolve a font size value from theme
 * @param size - Font size key (e.g., "base")
 * @returns CSS font size value (e.g., "1rem")
 */
export function resolveFontSize(size: string): string {
  return native.resolveFontSize(size)
}

/**
 * Resolve a breakpoint value from theme
 * @param breakpoint - Breakpoint key (e.g., "md")
 * @returns Breakpoint value (e.g., "768px")
 */
export function resolveBreakpoint(breakpoint: string): string {
  return native.resolveBreakpoint(breakpoint)
}

/**
 * Apply opacity modifier to a color
 * @param color - Hex color (e.g., "#1e40af")
 * @param opacity - Opacity percentage (e.g., "50")
 * @returns RGBA color string (e.g., "rgba(30, 64, 175, 0.5)")
 */
export function applyOpacity(color: string, opacity: string): string {
  return native.applyOpacity(color, opacity)
}

/**
 * Week 4 Day 2 Exports: Compilation
 */

export interface CssRuleResult {
  selector: string
  property: string
  value: string
  variants: string[]
  mediaQuery?: string
  pseudoClass?: string
}

/**
 * Compile a single Tailwind class to CSS rule
 * Full pipeline: parse → resolve → generate
 * @param input - Tailwind class
 * @returns CSS rule structure
 *
 * @example
 * const rule = compileClass("md:hover:bg-blue-600/50")
 * // { selector: ".md\\:hover\\:bg-blue-600\\/50", ... }
 */
export function compileClass(input: string): CssRuleResult {
  const resultJson = native.compileClass(input) as unknown as string
  return JSON.parse(resultJson)
}

/**
 * Compile multiple Tailwind classes to CSS rules (batch mode)
 * @param inputs - Array of Tailwind classes
 * @returns Array of CSS rule structures
 *
 * @example
 * const rules = compileClasses(["bg-blue-600", "text-white"])
 * // [{ selector: ".bg-blue-600", ... }, { selector: ".text-white", ... }]
 */
export function compileClasses(inputs: string[]): CssRuleResult[] {
  const resultJson = native.compileClasses(inputs) as unknown as string
  return JSON.parse(resultJson)
}

/**
 * Week 4 Day 3 Exports: CSS Generation
 */

/**
 * Generate formatted CSS string from CSS rule
 * @param ruleJson - CSS rule as JSON string
 * @param minify - Whether to minify output (default: false)
 * @returns CSS string
 *
 * @example
 * const rule = { selector: ".bg-blue-600", property: "background-color", value: "#2563eb", variants: [] }
 * const css = generateCss(JSON.stringify(rule))
 * // ".bg-blue-600 { background-color: #2563eb; }"
 */
export function generateCss(ruleJson: string | CssRuleResult, minify?: boolean): string {
  const jsonStr = typeof ruleJson === 'string' ? ruleJson : JSON.stringify(ruleJson)
  return native.generateCss(jsonStr, minify ?? false)
}

/**
 * Generate CSS strings from multiple rules (batch mode)
 * @param rulesJson - Array of CSS rules or JSON string
 * @param minify - Whether to minify output (default: false)
 * @returns Combined CSS string
 */
export function generateCssBatch(rulesJson: string | CssRuleResult[], minify?: boolean): string {
  const jsonStr = typeof rulesJson === 'string' ? rulesJson : JSON.stringify(rulesJson)
  return native.generateCssBatch(jsonStr, minify ?? false)
}

/**
 * Complete pipeline: class → CSS string (one step)
 * @param input - Tailwind class
 * @param minify - Whether to minify output (default: false)
 * @returns CSS string
 *
 * @example
 * const css = compileToCss("md:hover:bg-blue-600/50")
 * // "@media (min-width: 768px) { .md\\:hover\\:bg-blue-600\\/50:hover { background-color: rgba(30, 64, 175, 0.5); } }"
 */
export function compileToCss(input: string, minify?: boolean): string {
  return native.compileToCss(input, minify ?? false)
}

/**
 * Batch compile to CSS strings (one step)
 * @param inputs - Array of Tailwind classes
 * @param minify - Whether to minify output (default: false)
 * @returns Combined CSS string
 *
 * @example
 * const css = compileToCssBatch(["bg-blue-600", "text-white"])
 * // ".bg-blue-600 { background-color: #2563eb; } .text-white { color: white; }"
 */
export function compileToCssBatch(inputs: string[], minify?: boolean): string {
  return native.compileToCssBatch(inputs, minify ?? false)
}

/**
 * Minify CSS string
 * @param css - CSS string
 * @returns Minified CSS
 *
 * @example
 * const minified = minifyCss(".bg-blue-600 { background-color: #2563eb; }")
 * // ".bg-blue-600{background-color:#2563eb}"
 */
export function minifyCss(css: string): string {
  return native.minifyCss(css)
}

/**
 * Utility: Compile and minify in one call
 * @param input - Tailwind class
 * @returns Minified CSS string
 */
export function compileToCssMinified(input: string): string {
  const css = compileToCss(input, false)
  return minifyCss(css)
}

/**
 * Utility: Batch compile and minify
 * @param inputs - Array of Tailwind classes
 * @returns Minified CSS string
 */
export function compileToCssBatchMinified(inputs: string[]): string {
  const css = compileToCssBatch(inputs, false)
  return minifyCss(css)
}

/**
 * Utility: Get all CSS properties from a class set
 * Useful for design system analysis
 * @param inputs - Array of Tailwind classes
 * @returns Set of unique CSS properties
 */
export function extractProperties(inputs: string[]): Set<string> {
  const rules = compileClasses(inputs)
  return new Set(rules.map(r => r.property))
}

/**
 * Utility: Get all selectors from a class set
 * @param inputs - Array of Tailwind classes
 * @returns Set of unique selectors
 */
export function extractSelectors(inputs: string[]): Set<string> {
  const rules = compileClasses(inputs)
  return new Set(rules.map(r => r.selector))
}

/**
 * Re-export native functions for advanced usage
 * (Direct access to JSON APIs when needed)
 */
export const native_api = {
  parseClass: native.parseClass,
  resolveColor: native.resolveColor,
  resolveSpacing: native.resolveSpacing,
  resolveFontSize: native.resolveFontSize,
  resolveBreakpoint: native.resolveBreakpoint,
  applyOpacity: native.applyOpacity,
  compileClass: native.compileClass,
  compileClasses: native.compileClasses,
  generateCss: native.generateCss,
  generateCssBatch: native.generateCssBatch,
  compileToCss: native.compileToCss,
  compileToCssBatch: native.compileToCssBatch,
  minifyCss: native.minifyCss,
  // Phase 4: Redis NAPI Functions (20 new functions)
  redisPoolConnect: native.redis_pool_connect,
  redisSet: native.redis_set,
  redisGet: native.redis_get,
  redisDelete: native.redis_delete,
  redisMget: native.redis_mget,
  redisMset: native.redis_mset,
  redisExists: native.redis_exists,
  redisExpire: native.redis_expire,
  redisTtl: native.redis_ttl,
  redisPoolStats: native.redis_pool_stats,
  redisFlushDb: native.redis_flush_db,
  redisPing: native.redis_ping,
  redisInfo: native.redis_info,
  redisCacheClear: native.redis_cache_clear,
  redisEnableCluster: native.redis_enable_cluster,
  redisCacheHitRate: native.redis_cache_hit_rate,
  redisMonitor: native.redis_monitor,
  redisSyncNodes: native.redis_sync_nodes,
  redisGetConfig: native.redis_get_config,
  redisShutdown: native.redis_shutdown,
}

/**
 * Type: Performance metrics for profiling
 */
export interface PerformanceMetrics {
  operation: string
  inputSize: number
  durationMs: number
  outputSize: number
}

/**
 * Utility: Time an operation for performance profiling
 * @param operation - Operation name
 * @param fn - Function to time
 * @returns [result, metrics]
 */
export function timeOperation<T>(
  operation: string,
  fn: () => T,
): [T, PerformanceMetrics] {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  
  const inputSize = typeof result === 'string' ? result.length : 
                    Array.isArray(result) ? JSON.stringify(result).length : 0
  
  return [result, {
    operation,
    inputSize,
    durationMs: duration,
    outputSize: 0,
  }]
}

export default {
  parseClass,
  resolveColor,
  resolveSpacing,
  resolveFontSize,
  resolveBreakpoint,
  applyOpacity,
  compileClass,
  compileClasses,
  generateCss,
  generateCssBatch,
  compileToCss,
  compileToCssBatch,
  minifyCss,
  compileToCssMinified,
  compileToCssBatchMinified,
  extractProperties,
  extractSelectors,
  timeOperation,
  native_api,
  // Phase 4: Redis Functions
  redis: {
    poolConnect: (host: string, port: number, poolSize?: number) =>
      JSON.parse(native.redis_pool_connect(host, port, poolSize)),
    set: (key: string, value: string, ttl?: number) =>
      JSON.parse(native.redis_set(key, value, ttl)),
    get: (key: string) =>
      JSON.parse(native.redis_get(key)),
    delete: (key: string) =>
      JSON.parse(native.redis_delete(key)),
    mget: (keys: string[]) =>
      JSON.parse(native.redis_mget(keys)),
    mset: (pairs: [string, string][]) =>
      JSON.parse(native.redis_mset(pairs)),
    exists: (key: string) =>
      JSON.parse(native.redis_exists(key)),
    expire: (key: string, ttl: number) =>
      JSON.parse(native.redis_expire(key, ttl)),
    ttl: (key: string) =>
      JSON.parse(native.redis_ttl(key)),
    poolStats: () =>
      JSON.parse(native.redis_pool_stats()),
    flushDb: () =>
      JSON.parse(native.redis_flush_db()),
    ping: () =>
      JSON.parse(native.redis_ping()),
    info: () =>
      JSON.parse(native.redis_info()),
    cacheClear: () =>
      JSON.parse(native.redis_cache_clear()),
    enableCluster: (enabled: boolean) =>
      JSON.parse(native.redis_enable_cluster(enabled)),
    cacheHitRate: () =>
      JSON.parse(native.redis_cache_hit_rate()),
    monitor: () =>
      JSON.parse(native.redis_monitor()),
    syncNodes: () =>
      JSON.parse(native.redis_sync_nodes()),
    getConfig: () =>
      JSON.parse(native.redis_get_config()),
    shutdown: () =>
      JSON.parse(native.redis_shutdown()),
  },
}
