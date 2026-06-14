/**
 * tailwind-styled-v5 — Native Bridge Loader
 *
 * Uses @tailwind-styled/shared for native binding resolution.
 * All functions require native Rust binding - no JS fallback.
 */

import { resolveNativeBinary, resolveRuntimeDir } from "@tailwind-styled/shared"

// require() is safe here — tsup banner injects CJS-compatible require into ESM output.
// See tsup.config.ts esbuildOptions banner for how this is set up.
const _loadNative = (path: string): unknown => require(path)

export interface ComponentMetadata {
  component: string
  tag: string
  baseClass: string
  subComponents: Record<string, { tag?: string; class: string }>
}

export interface NativeRscResult {
  isServer: boolean
  needsClientDirective: boolean
  clientReasons: string[]
}

const log = (...args: unknown[]) => {
  if (process.env.DEBUG?.includes("compiler:native")) {
    console.log("[compiler:native]", ...args)
  }
}

// ── Structured Type Definitions ─────────────────────────────────────────────

export interface ScanWorkspaceResult {
  files: string[]
  total_files: number
  classes: string[]
  unique_classes: number
  duration_ms: number
  errors: string[]
}

export interface ScanFileResult {
  file: string
  classes: string[]
  class_count: number
  has_tw_usage: boolean
  size_bytes: number
  duration_ms: number
}

export interface BatchExtractResult {
  file: string
  classes: string[]
  contentHash: string
  ok: boolean
  error?: string
}

export interface SafelistCheckResult {
  matched: string[]
  unmatched: string[]
  safelistSize: number
}

export interface PrefilterFileResult {
  file: string
  has_tw_usage: boolean
  duration_ms: number
  size_bytes: number
  status: "processed" | "skipped" | "error"
  error?: string
}

export interface DeadCodeResult {
  deadInCss: string[]
  deadInSource: string[]
  liveClasses: string[]
  totalCssClasses: number
  totalSourceClasses: number
}

export interface ProcessedCssResult {
  css: string
  size_bytes: number
  resolved_classes: string[]
  unknown_classes: string[]
}

export interface ContainerConfig {
  tag: string
  containerJson: string
  containerName?: string
  breakpoints: Array<{ key: string; classes: string }>
}

export interface HoistResult {
  code: string
  hoisted: string[]
  warnings: string[]
}

export interface VariantTableResult {
  id: string
  tableJson: string
  keys: string[]
  defaultKey: string
  combinations: number
}

export interface ClassifyResult {
  className: string
  bucket: string
  sortOrder: number
}

export interface MergeResult {
  declarationsJson: string
  declarationString: string
  count: number
}

export interface ClassUsageItem {
  className: string
  usageCount: number
  filesJson: string
  bundleSizeBytes: number
  isDeadCode: boolean
}

export interface StateCssConfig {
  tag: string
  componentName: string
  statesJson: string
  sourceFile: string
}

export interface GeneratedStateCss {
  selector: string
  declarations: string
  cssRule: string
  componentName: string
  stateName: string
}

// ── Type Exports ────────────────────────────────────────────────────────────────

export interface NativeBridge {
  // CSS Compiler - New Rust implementation
  generateCssNative?: (classes: string[], theme_json: string) => string
  getCacheStats?: () => [number, number]
  clearThemeCache?: () => void
  // Core transform
  transformSource?: (source: string, opts?: Record<string, string>) => NativeTransformResult | null
  extractClassesFromSource?: (source: string) => string[]
  hasTwUsage?: (source: string) => boolean
  isAlreadyTransformed?: (source: string) => boolean
  // Phase 5: Scanner functions (snake_case from Rust)
  scan_workspace?: (root: string, extensions?: string[]) => ScanWorkspaceResult
  extract_classes_from_source?: (source: string) => string[]
  batch_extract_classes?: (filePaths: string[]) => BatchExtractResult[]
  check_against_safelist?: (classes: string[], safelist: string[]) => SafelistCheckResult
  scan_file?: (filePath: string) => ScanFileResult
  collect_files?: (root: string, extensions?: string[]) => string[]
  walk_and_prefilter_source_files?: (root: string, extensions?: string[]) => PrefilterFileResult[]
  generate_sub_component_types?: (root: string, outputPath?: string) => string
  // Class Extractor
  extractAllClasses?: (source: string) => string[]
  parseClasses?: (raw: string) => Array<{ raw: string; type: string }>
  // Application functions
  extractComponentUsage?: (source: string) => Array<{ component: string; propsJson: string }>
  normalizeAndDedupClasses?: (raw: string) => { normalized: string; duplicatesRemoved: number; uniqueCount: number }
  diffClassLists?: (previous: string[], current: string[]) => { added: string[]; removed: string[]; unchanged: string[]; hasChanges: boolean }
  batchExtractClasses?: (filePaths: string[]) => Array<{ file: string; classes: string[]; contentHash: string; ok: boolean; error?: string }>
  checkAgainstSafelist?: (classes: string[], safelist: string[]) => { matched: string[]; unmatched: string[]; safelistSize: number }
  // Batch 2
  hoistComponents?: (source: string) => HoistResult
  compileVariantTable?: (configJson: string) => VariantTableResult
  classifyAndSortClasses?: (classes: string[]) => ClassifyResult[]
  mergeCssDeclarations?: (cssChunks: string[]) => MergeResult
  analyzeClassUsage?: (classes: string[], scanResultJson: string, css: string) => ClassUsageItem[]
  analyzeRsc?: (source: string, filename: string) => {
    isServer: boolean
    needsClientDirective: boolean
    clientReasons: string[]
  }
  analyzeClasses?: (
    filesJson: string,
    cwd: string,
    flags: number
  ) => {
    css?: string
    code: string
    classes: string[]
    changed: boolean
    rscJson?: string
    metadataJson?: string
    safelist?: string[]
  } | null
  // CSS compilation
  compileCss?: (classes: string[], prefix?: string | null) => { css: string; classes: string[] }
  compileCssLightning?: (classes: string[]) => string
  /** Post-process raw Tailwind-generated CSS dengan LightningCSS di Rust */
  detectDeadCode?: (scanResultJson: string, css: string) => DeadCodeResult
  processTailwindCssLightning?: (css: string) => ProcessedCssResult
  processTailwindCssWithTargets?: (css: string, targets: string | null) => { css: string; size_bytes: number }
  // Atomic CSS (atomic.rs)
  parseAtomicClass?: (twClass: string) => string | null
  generateAtomicCss?: (rulesJson: string) => string
  toAtomicClasses?: (twClasses: string) => string
  clearAtomicRegistry?: () => void
  atomicRegistrySize?: () => number
  // Impact analysis (impact_analysis.rs)
  calculateImpact?: (impactJson: string) => string
  calculateRisk?: (className: string, totalComponents: number) => string
  calculateSavings?: (bundleSizeBytes: number, componentCount: number) => number
  // Static state CSS pre-generation (state_css.rs)
  extractTwStateConfigs?: (source: string, filename: string) => StateCssConfig[]
  generateStaticStateCss?: (inputs: Array<{
    tag: string
    componentName: string
    statesJson: string
  }>, resolvedCss: string | null) => GeneratedStateCss[]
  extractAndGenerateStateCss?: (source: string, filename: string) => GeneratedStateCss[]
  /**
   * Convert layout/utility class string ke CSS declarations.
   * Dipakai oleh extractContainerCssFromSource sebagai Rust-accelerated fallback.
   */
  layoutClassesToCss?: (classes: string) => string
  /**
   * Hash string dengan algoritma tertentu, return n karakter pertama.
   * Dipakai untuk generate deterministic container CSS IDs.
   */
  hashContent?: (input: string, algo: string, length: number) => string
  /** Hapus dead CSS selectors + minify via Lightning CSS. */
  eliminateDeadCss?: (css: string, deadClasses: string[]) => string
  /** Dead code detection + strip + Lightning CSS minify dalam satu call. */
  optimizeCss?: (css: string) => string
  /** Extract tw container configs dari source untuk static @container CSS generation. */
  extractTwContainerConfigs?: (source: string) => Array<{
    tag: string
    containerJson: string
    containerName?: string
    breakpoints: Array<{ key: string; classes: string }>
  }>
  
  // Phase 5.1: Cache Management (9 functions)
  get_cache_statistics?: () => string  // Returns JSON
  clear_all_caches?: () => void
  clear_parse_cache?: () => void
  clear_resolve_cache?: () => void
  clear_compile_cache?: () => void
  clear_css_gen_cache?: () => void
  get_cache_optimization_hints?: (hit_rate_percent: number, memory_used_mb: number) => string  // Returns JSON
  estimate_optimal_cache_config_native?: (total_budget_mb: number, workload_type: string) => string  // Returns JSON
  cache_read?: (cache_path: string) => { entries_json: string }
  cache_write?: (cache_path: string, entries: Array<{ file: string; content_hash: string; classes: string[]; mtime_ms: number; size_bytes: number }>) => boolean
  cache_priority?: (mtime_ms: number, size_bytes: number, hit_count: number) => number
  
  // Phase 5.1: Theme Resolution Extended (7 functions)
  resolve_variants?: (configJson: string) => string  // Returns JSON
  validate_variant_config?: (configJson: string) => string  // Returns JSON
  resolve_cascade?: (baseThemeJson: string, overridesJson: string) => string  // Returns JSON
  resolve_class_names?: (classNames: string[], themeJson: string) => string  // Returns JSON
  resolve_conflict_group?: (groupName: string, themeJson: string) => string  // Returns JSON
  resolve_theme_value?: (keyPath: string, themeJson: string) => string | null
  resolve_simple_variants?: (configJson: string) => string  // Returns JSON
  
  // Phase 5.1: Streaming & Incremental Processing (8 functions)
  process_file_change?: (fileChangeJson: string) => string  // Returns JSON
  compute_incremental_diff?: (oldScanJson: string, newScanJson: string) => string  // Returns JSON
  create_fingerprint?: (filePath: string, fileContent: string) => string  // Returns JSON
  inject_state_hash?: (css: string, stateHash: string) => string  // Returns JSON
  prune_stale_entries?: (maxAgeSeconds: number, maxEntries: number) => string  // Returns JSON
  rebuild_workspace_result?: (rootDir: string, extensions?: string[]) => string  // Returns JSON
  scan_file_native?: (filePath: string, fileContent: string) => string  // Returns JSON
  scan_files_batch_native?: (filesJson: string) => string  // Returns JSON
  
  // Phase 5.2: CSS Compilation (12 functions)
  generate_css?: (rule_json: string, minify?: boolean | null) => string
  generate_css_batch?: (rules_json: string, minify?: boolean | null) => string
  compile_class?: (input: string) => string  // Returns JSON
  compile_classes?: (inputs: string[]) => string  // Returns JSON
  compile_to_css?: (input: string, minify: boolean) => string
  compile_to_css_batch?: (inputs: string[], minify: boolean) => string
  minify_css?: (css: string) => string
  compile_animation?: (animationName: string, from: string, to: string) => string  // Returns JSON
  compile_keyframes?: (name: string, stopsJson: string) => string  // Returns JSON
  compile_theme?: (tokensJson: string, themeName: string, prefix: string) => string  // Returns JSON
  tw_merge?: (classString: string) => string
  tw_merge_many?: (classStrings: string[]) => string
  tw_merge_with_separator?: (classString: string, options: Record<string, unknown>) => string
  tw_merge_many_with_separator?: (classStrings: string[], options: Record<string, unknown>) => string
  tw_merge_raw?: (classLists: string[]) => string
  
  // Phase 5.2: ID Registry (16 functions)
  id_registry_create?: () => number
  id_registry_generate?: (handle: number, name: string) => number
  id_registry_lookup?: (handle: number, name: string) => number
  id_registry_next?: (handle: number) => number
  id_registry_destroy?: (handle: number) => void
  id_registry_reset?: (handle: number) => void
  id_registry_snapshot?: (handle: number) => string  // Returns JSON
  id_registry_active_count?: () => number
  register_property_name?: (propertyName: string) => number
  register_value_name?: (valueName: string) => number
  property_id_to_string?: (propertyId: number) => string
  value_id_to_string?: (valueId: number) => string
  reverse_lookup_property?: (propertyId: number) => string
  reverse_lookup_value?: (valueId: number) => string
  id_registry_export?: (handle: number) => string
  id_registry_import?: (importedData: string) => number
  
  // Phase 5.3: Redis Integration (40 functions)
  redis_ping?: () => string
  redis_get?: (key: string) => string
  redis_set?: (key: string, value: string, ttl_seconds?: number) => string
  redis_delete?: (key: string) => number
  redis_exists?: (key: string) => number
  redis_mget?: (keys: string[]) => string  // Returns JSON
  redis_mset?: (pairs: Array<[string, string]>) => string
  redis_flush_db?: () => number
  redis_flush_all?: () => number
  redis_pool_connect?: (host: string, port: number, pool_size?: number) => string
  redis_pool_stats?: () => string  // Returns JSON
  redis_pool_reconnect?: () => string
  redis_enable_cluster?: (initial_nodes: string[]) => string  // Returns JSON
  redis_disable_cluster?: () => string
  redis_cluster_status?: () => string  // Returns JSON
  redis_subscribe?: (channel: string) => string
  redis_publish?: (channel: string, message: string) => number
  redis_expiration_set?: (key: string, ttl_seconds: number) => number
  redis_expiration_get?: (key: string) => string  // Returns JSON
  redis_info?: () => string
  redis_monitor?: () => string
  redis_cache_size?: () => number
  redis_cache_key_count?: () => number
  redis_cache_clear?: () => number
  redis_cache_hit_rate?: () => number
  redis_enable_persistence?: (mode: string) => string
  redis_disable_persistence?: () => string
  redis_snapshot?: () => string
  redis_memory_stats?: () => string
  redis_optimize_memory?: () => number
  redis_set_eviction_policy?: (policy: string) => string
  redis_get_eviction_policy?: () => string
  redis_replicate?: (target_host: string, target_port: number) => number
  redis_replication_status?: () => string
  redis_cache_sync?: (peers: string[]) => number
  redis_enable_cache_warming?: (key_pattern: string) => string
  redis_disable_cache_warming?: () => string
  redis_diagnose?: () => string
  
  // Phase 5.4: Watch System & File Monitoring (20 functions)
  start_watch?: (root_path: string, patterns?: string[]) => number
  poll_watch_events?: (handle: number, timeout_ms?: number) => string  // Returns JSON
  stop_watch?: (handle: number) => number
  watch_add_pattern?: (handle: number, pattern: string) => string
  watch_remove_pattern?: (handle: number, pattern: string) => string
  watch_get_active_handles?: () => string  // Returns JSON
  watch_clear_all?: () => number
  watch_event_type_to_string?: (event_type_code: number) => string
  is_watch_running?: (handle: number) => boolean
  get_watch_stats?: () => string  // Returns JSON
  watch_pause?: (handle: number) => string
  watch_resume?: (handle: number) => string
  scan_cache_optimizations?: () => string  // Returns JSON
  get_plugin_hooks?: () => string  // Returns JSON
  register_plugin_hook?: (hook_name: string, handler_id: string) => string
  unregister_plugin_hook?: (hook_name: string, handler_id: string) => string
  emit_plugin_hook?: (hook_name: string, data_json: string) => string
  get_compilation_metrics?: () => string  // Returns JSON
  reset_compilation_metrics?: () => string
  validate_css_output?: (css: string) => string  // Returns JSON
  get_compiler_diagnostics?: () => string  // Returns JSON

  // ── Cache Management (napi_bridge_cache.rs) ────────────────────────────────
  configureCacheBackend?: (configJson: string) => string
  getRecommendedCacheConfig?: (workloadType: string) => string
  clearAllCachesNapi?: () => void
  clearResolveCacheNapi?: () => void
  clearCompileCacheNapi?: () => void
  clearCssGenCacheNapi?: () => void
  getResolverPoolStats?: () => string
  clearResolverPool?: () => string
  resolveColorCached?: (themeId: number, color: string, configJson: string) => string
  resolveSpacingCached?: (themeId: number, spacing: string, configJson: string) => string
  resolveFontSizeCached?: (themeId: number, size: string, configJson: string) => string
  resetResolverPoolStats?: () => void
  getCacheOptimizationHints?: () => string
  estimateStreamingBatchSize?: (targetMemoryMb: number) => string

  // ── Parsing (napi_bridge_parsing.rs) ──────────────────────────────────────
  parseClass?: (input: string) => string
  compileClassNapi?: (input: string) => string
  getParseStats?: () => string
  clearParseCacheNapi?: () => void

  // ── Theme Parsing (napi_bridge_theme_parsing.rs) ───────────────────────────
  parseColorsNapi?: (colorsJson: string) => string | Record<string, string>
  parseSpacingNapi?: (spacingJson: string) => string | Record<string, string>
  parseTransformNapi?: (transformJson: string) => string | Record<string, string>
  normalizeColorNapi?: (color: string, opacity: string) => string
  sanitizeColorNapi?: (color: string) => string
  splitRgbaNapi?: (color: string) => string | { r: number; g: number; b: number; a: number }
  validateColorsNapi?: (colorsJson: string) => boolean
  validateBreakpointsNapi?: (breakpointsJson: string) => boolean
  runHealthCheck?: () => void

  // ── Watch (napi_bridge_watch.rs) ───────────────────────────────────────────
  watchFiles?: (rootDir: string, optionsJson?: string | null) => string
  stopWatching?: (handleId: number) => string
  getWatchEvents?: (handleId: number, maxEvents?: number | null) => string
  getWatchPerformance?: () => string
  clearWatchStats?: () => string
  getActiveWatches?: () => number
  setWatchMetrics?: (metricName: string, value: string) => string
  setWatchAggregation?: (aggregationType: string) => string

  // ── Week 6 Optimization (week6_api.rs) ────────────────────────────────────
  getOptimizationRecommendations?: (hitRate: number, memoryMb: number, classCount: number) => string
  estimateOptimalBatchSize?: (totalClasses: number, memoryAvailableMb: number) => number
  predictMemoryUsage?: (uniqueClasses: number, avgClassSizeBytes: number) => number
  recommendCachingStrategy?: (isSsr: boolean, memoryConstraintMb: number) => string
  benchmarkStreamingVsBuffered?: (classCount: number) => string
  getWeek6OptimizationStatus?: () => string

  // ── Analysis & Memory Profiling (napi_bridge_analysis.rs) ──────────────────
  getWeek6FeaturesStatus?: () => string
  getMemoryStatsNative?: () => string
  getMemoryRecommendationsNative?: () => string
  estimateOptimalCacheConfigNative?: (workloadType: string, expectedEntries: number) => string
  resetMemoryStats?: () => void

  // ── Scan Cache (scan_cache_api.rs) ────────────────────────────────────────
  scanCacheGet?: (filePath: string, contentHash: string) => string[] | null
  scanCachePut?: (filePath: string, contentHash: string, classes: string[], mtimeMs: number, size: number) => void
  scanCacheInvalidate?: (filePath: string) => void
  scanCacheStats?: () => { size: number }

  // ── Missing Theme, Redis, and Utility Functions ──────────────────────────
  resolveColor?: (color: string) => string
  resolveSpacing?: (spacing: string) => string
  resolveFontSize?: (size: string) => string
  resolveBreakpoint?: (breakpoint: string) => string
  redisExpire?: (key: string, ttlSeconds: number) => string
  redisTtl?: (key: string) => string
  redisGetConfig?: () => string
  redisShutdown?: () => string
  redisSyncNodes?: () => string
  resetCacheStats?: () => void
}

export interface NativeTransformResult {
  code: string
  classes: string[]
  changed: boolean
  rscJson?: string
  metadataJson?: string
}

export interface ClassExtractResult {
  classes: string[]
  component_names: string[]
  has_tw_usage: boolean
  has_use_client: boolean
  imports: string[]
}

const NATIVE_UNAVAILABLE_MESSAGE =
  "[tailwind-styled/compiler v5] Native binding is required but not available.\n" +
  "This package requires native Rust bindings. There is no JavaScript fallback.\n" +
  "Please ensure:\n" +
  "  1. The native module is properly installed\n" +
  "  2. You have run: npm run build:rust (or use prebuilt binary)\n" +
  "\n" +
  "For help, see: https://tailwind-styled.dev/docs/install"

// ── Native Bridge - Factory Pattern
// ─────────────────────────────────────────────────────────────────────────────

let nativeBridge: NativeBridge | null = null
let bridgeLoadAttempted = false
let bridgeLoadError: Error | null = null

const isValidNativeBridge = (mod: unknown): mod is NativeBridge => {
  const m = mod as Partial<NativeBridge>
  return !!(
    typeof m.transformSource === "function" ||
    typeof m.extractAllClasses === "function" ||
    typeof m.hasTwUsage === "function"
  )
}

export const getNativeBridge = (): NativeBridge => {
  if (nativeBridge) {
    return nativeBridge
  }

  if (bridgeLoadAttempted) {
    if (bridgeLoadError) {
      throw bridgeLoadError
    }
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }

  bridgeLoadAttempted = true

  try {
    const runtimeDir = resolveRuntimeDir(undefined, import.meta.url)
    
    // Use shared's native resolution
    const result = resolveNativeBinary(runtimeDir)

    if (result.path && result.path.endsWith(".node")) {
      try {
        const binding = _loadNative(result.path) as NativeBridge
        if (isValidNativeBridge(binding)) {
          const toCamelCase = (str: string): string => {
            return str.replace(/_([a-z0-9])/g, (_, g) => g.toUpperCase())
          }
          nativeBridge = new Proxy(binding, {
            get(target, prop) {
              if (typeof prop === "string") {
                if (prop in target) {
                  return target[prop as keyof typeof target]
                }
                const camelKey = toCamelCase(prop)
                if (camelKey in target) {
                  const val = target[camelKey as keyof typeof target]
                  if (typeof val === "function") {
                    return (val as Function).bind(target)
                  }
                  return val
                }
                const napiKey = `${camelKey}Napi`
                if (napiKey in target) {
                  const val = target[napiKey as keyof typeof target]
                  if (typeof val === "function") {
                    return (val as Function).bind(target)
                  }
                  return val
                }
                const napiInnerKey = `${camelKey}NapiInner`
                if (napiInnerKey in target) {
                  const val = target[napiInnerKey as keyof typeof target]
                  if (typeof val === "function") {
                    return (val as Function).bind(target)
                  }
                  return val
                }
              }
              return target[prop as keyof typeof target]
            }
          }) as NativeBridge
          log("Native bridge loaded successfully and proxy-wrapped from:", result.path)
          return nativeBridge
        }
      } catch (e) {
        log("Failed to require native binding:", e)
      }
    }

    throw new Error(`${NATIVE_UNAVAILABLE_MESSAGE}\n\nTried paths: ${result.tried.join("\n")}`)
  } catch (err) {
    bridgeLoadError = err instanceof Error ? err : new Error(String(err))
    log("Failed to load native bridge:", bridgeLoadError.message)
    throw bridgeLoadError
  }
}

export const resetNativeBridgeCache = (): void => {
  nativeBridge = null
  bridgeLoadAttempted = false
  bridgeLoadError = null
  log("Native bridge cache reset")
}

// ── Adaptor for native results
// ─────────────────────────────────────────────────────────────────────────────

export const adaptNativeResult = (
  raw: NativeTransformResult
): {
  code: string
  classes: string[]
  changed: boolean
  rsc?: NativeRscResult
  metadata?: ComponentMetadata[]
} => {
  return {
    code: raw.code ?? "",
    classes: raw.classes ?? [],
    changed: raw.changed ?? false,
    rsc: raw.rscJson ? JSON.parse(raw.rscJson) : undefined,
    metadata: raw.metadataJson ? JSON.parse(raw.metadataJson) : undefined,
  }
}

// ── Eager init — load native bridge saat module dimuat, bukan saat request pertama
// Mencegah crash di Turbopack dev mode karena lazy init mid-request
// ─────────────────────────────────────────────────────────────────────────────
if (typeof process !== "undefined" && !bridgeLoadAttempted) {
  try {
    getNativeBridge()
  } catch {
    // Sudah di-capture di bridgeLoadError — akan di-throw saat dipanggil pertama kali
  }
}

// ── Re-export all 63 wrapper functions from nativeBridgeWrappers
// These provide complete type safety, error handling, and JSDoc documentation
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Redis Cache Functions (40)
  redis_pool_connect,
  redis_pool_stats,
  redis_pool_reconnect,
  redis_ping,
  redis_get,
  redis_set,
  redis_delete,
  redis_exists,
  redis_mget,
  redis_mset,
  redis_flush_db,
  redis_flush_all,
  redis_cache_size,
  redis_cache_key_count,
  redis_cache_clear,
  redis_cache_hit_rate,
  redis_info,
  redis_monitor,
  redis_enable_cluster,
  redis_disable_cluster,
  redis_cluster_status,
  redis_expiration_set,
  redis_expiration_get,
  redis_subscribe,
  redis_publish,
  redis_enable_persistence,
  redis_disable_persistence,
  redis_snapshot,
  redis_replicate,
  redis_replication_status,
  redis_enable_cache_warming,
  redis_disable_cache_warming,
  redis_cache_sync,
  redis_set_eviction_policy,
  redis_get_eviction_policy,
  redis_memory_stats,
  redis_optimize_memory,
  redis_diagnose,
  // Watch System Functions (20)
  start_watch,
  poll_watch_events,
  stop_watch,
  watch_add_pattern,
  watch_remove_pattern,
  watch_pause,
  watch_resume,
  is_watch_running,
  get_watch_stats,
  watch_get_active_handles,
  watch_clear_all,
  register_plugin_hook,
  unregister_plugin_hook,
  emit_plugin_hook,
  get_plugin_hooks,
  // ID Registry Functions (16)
  id_registry_create,
  id_registry_generate,
  id_registry_lookup,
  id_registry_next,
  id_registry_destroy,
  id_registry_reset,
  id_registry_snapshot,
  id_registry_active_count,
  register_property_name,
  register_value_name,
  property_id_to_string,
  value_id_to_string,
  reverse_lookup_property,
  reverse_lookup_value,
  id_registry_export,
  id_registry_import,
  // Incremental Compilation Functions (8)
  process_file_change,
  compute_incremental_diff,
  create_fingerprint,
  inject_state_hash,
  prune_stale_entries,
  rebuild_workspace_result,
  scan_files_batch_native,
  // Theme Resolution Functions (7)
  resolve_variants,
  validate_variant_config,
  resolve_cascade,
  resolve_class_names,
  resolve_conflict_group,
  resolve_theme_value,
  resolve_simple_variants,
  generate_css,
  generate_css_batch,
  resolve_color_cached,
  resolve_spacing_cached,
  resolve_font_size_cached,
  reset_resolver_pool_stats,
  get_week6_features_status,
  get_memory_stats_native,
  get_memory_recommendations_native,
  estimate_optimal_cache_config_native,
  reset_memory_stats,
} from "./nativeBridgeWrappers"