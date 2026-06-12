# 📋 Implementation Plan: 196 Unused Rust Functions
## tailwind-styled-v4 - Complete Strategy & Code Examples

**Status:** Planning Phase  
**Target:** Integrate all 196 functions into TypeScript layer  
**Estimated Effort:** 3-4 weeks (depends on priority)

---

## Executive Strategy

### Phase 1: Foundation (Week 1)
- [x] Analyze existing patterns in `nativeBridge.ts`, `nativeBridgeWrappers.ts`
- [ ] Create wrapper layer for all 196 functions
- [ ] Setup TypeScript interfaces for return types
- [ ] Create unit test skeleton

### Phase 2: Core Implementation (Weeks 2-3)
- [ ] Implement 6 main feature domains
- [ ] Integration tests
- [ ] Documentation

### Phase 3: Polish (Week 4)
- [ ] Performance optimization
- [ ] Error handling
- [ ] API stability

---

## Priority: 6 Main Feature Domains

### 🔴 CRITICAL (Deploy Week 1-2)
1. **Cache Analytics** (20 functions) — Essential for performance
2. **Class Analysis & Detection** (16 functions) — Core functionality
3. **Watch System** (10 functions) — Development experience

### 🟡 HIGH (Deploy Week 2-3)
4. **Parsing Utilities** (15 functions) — Build reliability
5. **Pool & Registry Management** (13 functions) — Resource management
6. **CSS Generation** (12 functions) — Output quality

### 🟢 MEDIUM (Deploy Week 3-4)
7. **Configuration & Optimization** (10 functions)
8. **Theme Handling** (10 functions)
9. **Conflict Resolution** (10 functions)
10. **Code Scanning** (8 functions)

---

## Implementation Pattern

### Existing Pattern (dari nativeBridge.ts):
```typescript
// 1. Load native binding
const native = require('@tailwind-styled/native')

// 2. Create TypeScript interfaces for return types
export interface CacheStats {
  entries: number
  size_bytes: number
  hit_rate: number
}

// 3. Create wrapper function with error handling
export async function getCacheStatistics(): Promise<CacheStats> {
  try {
    const result = native.get_cache_stats()
    return JSON.parse(result)
  } catch (error) {
    console.error('[Cache] Failed to get stats:', error)
    return { entries: 0, size_bytes: 0, hit_rate: 0 }
  }
}

// 4. Export in index.ts
export { getCacheStatistics, ... }
```

---

## Domain 1: CACHE ANALYTICS (20 functions)

**File:** `packages/domain/compiler/src/cacheAnalytics.ts` (NEW)

### Functions to Implement:
```
cache_read, cache_write, cache_priority, 
get_cache_stats, compute_cache_stats, 
clear_compile_cache_napi, clear_css_gen_cache_napi, 
clear_parse_cache_napi, clear_resolve_cache_napi,
get_parse_stats, reset_cache_stats,
scan_cache_get, scan_cache_put, scan_cache_invalidate, scan_cache_stats,
clear_all_caches_napi, clear_watch_stats,
get_cache_optimization_hints, configure_cache_backend,
recommend_caching_strategy
```

### Code Implementation:

```typescript
// packages/domain/compiler/src/cacheAnalytics.ts

import { resolveNativeBinary } from "@tailwind-styled/shared"

const _loadNative = (path: string): unknown => require(path)
const native = _loadNative(resolveNativeBinary())

/**
 * CACHE STATISTICS
 */

export interface CacheStats {
  total_entries: number
  total_size_bytes: number
  hit_rate: number
  miss_rate: number
  eviction_count: number
  avg_entry_size: number
  hit_count: number
  miss_count: number
}

export interface ParseCacheStats {
  cached_files: number
  total_size_bytes: number
  avg_parse_time_ms: number
}

export interface CacheScanResult {
  key: string
  size_bytes: number
  access_count: number
  last_access_ms: number
  ttl_ms?: number
}

/**
 * Get overall cache statistics
 */
export async function getCacheStatistics(): Promise<CacheStats> {
  try {
    const result = native.get_cache_stats()
    return JSON.parse(result)
  } catch (error) {
    console.error('[CacheAnalytics] Failed to get stats:', error)
    return {
      total_entries: 0,
      total_size_bytes: 0,
      hit_rate: 0,
      miss_rate: 1,
      eviction_count: 0,
      avg_entry_size: 0,
      hit_count: 0,
      miss_count: 0,
    }
  }
}

/**
 * Get parse cache statistics
 */
export async function getParseStatistics(): Promise<ParseCacheStats> {
  try {
    const result = native.get_parse_stats()
    return JSON.parse(result)
  } catch (error) {
    console.error('[CacheAnalytics] Failed to get parse stats:', error)
    return {
      cached_files: 0,
      total_size_bytes: 0,
      avg_parse_time_ms: 0,
    }
  }
}

/**
 * Scan all cache entries with key pattern
 */
export async function scanCacheEntries(pattern?: string): Promise<CacheScanResult[]> {
  try {
    const result = native.scan_cache_get(pattern || '*')
    return JSON.parse(result)
  } catch (error) {
    console.error('[CacheAnalytics] Failed to scan cache:', error)
    return []
  }
}

/**
 * Cache optimization recommendations
 */
export interface CacheOptimizationHint {
  type: 'memory' | 'performance' | 'ttl'
  severity: 'info' | 'warning' | 'critical'
  message: string
  suggestion: string
}

export async function getCacheOptimizationHints(): Promise<CacheOptimizationHint[]> {
  try {
    const result = native.get_cache_optimization_hints()
    return JSON.parse(result)
  } catch (error) {
    console.error('[CacheAnalytics] Failed to get hints:', error)
    return []
  }
}

/**
 * Clear specific cache types
 */
export async function clearCompileCache(): Promise<boolean> {
  try {
    native.clear_compile_cache_napi()
    return true
  } catch (error) {
    console.error('[CacheAnalytics] Failed to clear compile cache:', error)
    return false
  }
}

export async function clearParseCache(): Promise<boolean> {
  try {
    native.clear_parse_cache_napi()
    return true
  } catch (error) {
    console.error('[CacheAnalytics] Failed to clear parse cache:', error)
    return false
  }
}

export async function clearAllCaches(): Promise<boolean> {
  try {
    native.clear_all_caches_napi()
    return true
  } catch (error) {
    console.error('[CacheAnalytics] Failed to clear all caches:', error)
    return false
  }
}

/**
 * Cache priority settings
 */
export interface CachePriorityConfig {
  compile_weight: number
  parse_weight: number
  resolve_weight: number
  ttl_minutes: number
}

export async function configureCacheBackend(config: CachePriorityConfig): Promise<boolean> {
  try {
    native.configure_cache_backend(JSON.stringify(config))
    return true
  } catch (error) {
    console.error('[CacheAnalytics] Failed to configure cache:', error)
    return false
  }
}

/**
 * Get cache recommendation strategy
 */
export interface CacheStrategy {
  recommended_backend: 'memory' | 'disk' | 'redis'
  expected_memory_mb: number
  expected_hit_rate: number
  eviction_policy: string
}

export async function recommendCachingStrategy(): Promise<CacheStrategy> {
  try {
    const result = native.recommend_caching_strategy()
    return JSON.parse(result)
  } catch (error) {
    console.error('[CacheAnalytics] Failed to get strategy:', error)
    return {
      recommended_backend: 'memory',
      expected_memory_mb: 512,
      expected_hit_rate: 0.75,
      eviction_policy: 'lru',
    }
  }
}

// Export all for barrel export
export const cacheAnalytics = {
  getCacheStatistics,
  getParseStatistics,
  scanCacheEntries,
  getCacheOptimizationHints,
  clearCompileCache,
  clearParseCache,
  clearAllCaches,
  configureCacheBackend,
  recommendCachingStrategy,
}
```

---

## Domain 2: CLASS ANALYSIS & DETECTION (16 functions)

**File:** `packages/domain/compiler/src/classAnalysis.ts` (NEW)

### Functions:
```
analyze_classes, analyze_class_usage, detect_class_conflicts,
detect_dead_code, extract_all_classes, extract_classes_from_source,
has_tw_usage, classify_known_classes, classify_and_sort_classes,
diff_class_lists, are_class_sets_equal, parse_classes, 
oxc_extract_classes, ast_extract_classes, batch_extract_classes,
is_already_transformed
```

### Code Implementation:

```typescript
// packages/domain/compiler/src/classAnalysis.ts

import { resolveNativeBinary } from "@tailwind-styled/shared"

const native = require(resolveNativeBinary())

/**
 * CLASS ANALYSIS & DETECTION
 */

export interface ClassAnalysis {
  classes: string[]
  variants: string[]
  utilities: string[]
  components: string[]
  arbitrary: string[]
  total_count: number
}

export interface ClassConflict {
  class_a: string
  class_b: string
  conflict_type: 'cascade' | 'specificity' | 'property_overlap'
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

export interface DeadCodeResult {
  dead_in_css: string[]
  dead_in_source: string[]
  live_classes: string[]
  unused_percentage: number
}

export interface ClassDiff {
  added: string[]
  removed: string[]
  modified: string[]
  unchanged: string[]
}

/**
 * Analyze classes from source files/content
 */
export async function analyzeClasses(source: string): Promise<ClassAnalysis> {
  try {
    const result = native.analyze_classes(source)
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] Failed to analyze:', error)
    return {
      classes: [],
      variants: [],
      utilities: [],
      components: [],
      arbitrary: [],
      total_count: 0,
    }
  }
}

/**
 * Get usage statistics for each class
 */
export interface ClassUsage {
  class_name: string
  usage_count: number
  files: string[]
  first_seen_file: string
  last_seen_file: string
}

export async function analyzeClassUsage(
  patterns: string[],
  options?: { exclude_patterns?: string[] }
): Promise<ClassUsage[]> {
  try {
    const result = native.analyze_class_usage(JSON.stringify(patterns), JSON.stringify(options))
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] Failed to analyze usage:', error)
    return []
  }
}

/**
 * Detect conflicting class combinations
 */
export async function detectClassConflicts(classes: string[]): Promise<ClassConflict[]> {
  try {
    const result = native.detect_class_conflicts(JSON.stringify(classes))
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] Failed to detect conflicts:', error)
    return []
  }
}

/**
 * Detect dead code (classes in CSS but not used in source)
 */
export async function detectDeadCode(
  cssClasses: string[],
  sourceClasses: string[]
): Promise<DeadCodeResult> {
  try {
    const result = native.detect_dead_code(
      JSON.stringify(cssClasses),
      JSON.stringify(sourceClasses)
    )
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] Failed to detect dead code:', error)
    return {
      dead_in_css: [],
      dead_in_source: [],
      live_classes: sourceClasses,
      unused_percentage: 0,
    }
  }
}

/**
 * Extract all Tailwind classes from source
 */
export async function extractAllClasses(source: string): Promise<string[]> {
  try {
    const result = native.extract_all_classes(source)
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] Failed to extract classes:', error)
    return []
  }
}

/**
 * Extract classes from specific file source
 */
export async function extractClassesFromSource(
  source: string,
  filePath: string,
  language?: 'jsx' | 'tsx' | 'html' | 'vue'
): Promise<string[]> {
  try {
    const result = native.extract_classes_from_source(source, filePath, language)
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] Failed to extract:', error)
    return []
  }
}

/**
 * Check if file has Tailwind usage
 */
export async function hasTailwindUsage(source: string): Promise<boolean> {
  try {
    const result = native.has_tw_usage(source)
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] hasTailwindUsage check failed:', error)
    return false
  }
}

/**
 * Diff two class lists
 */
export async function diffClassLists(prev: string[], current: string[]): Promise<ClassDiff> {
  try {
    const result = native.diff_class_lists(JSON.stringify(prev), JSON.stringify(current))
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] Failed to diff:', error)
    return {
      added: [],
      removed: [],
      modified: [],
      unchanged: current,
    }
  }
}

/**
 * Check if two class sets are equal
 */
export async function areClassSetsEqual(a: string[], b: string[]): Promise<boolean> {
  try {
    const result = native.are_class_sets_equal(JSON.stringify(a), JSON.stringify(b))
    return JSON.parse(result)
  } catch (error) {
    console.error('[ClassAnalysis] Failed to compare:', error)
    return false
  }
}

// Export all
export const classAnalysis = {
  analyzeClasses,
  analyzeClassUsage,
  detectClassConflicts,
  detectDeadCode,
  extractAllClasses,
  extractClassesFromSource,
  hasTailwindUsage,
  diffClassLists,
  areClassSetsEqual,
}
```

---

## Domain 3: WATCH SYSTEM (10 functions)

**File:** `packages/infrastructure/watch/src/watchManager.ts` (NEW)

### Functions:
```
watch_files, get_watch_stats, get_watch_performance,
get_active_watches, set_watch_aggregation, set_watch_metrics,
start_watch, stop_watch, stop_watching, poll_watch_events
```

### Code Implementation:

```typescript
// packages/infrastructure/watch/src/watchManager.ts

import { resolveNativeBinary } from "@tailwind-styled/shared"
import { EventEmitter } from 'events'

const native = require(resolveNativeBinary())

export interface WatchStats {
  active_watches: number
  total_events: number
  events_per_second: number
  avg_latency_ms: number
  total_files_watched: number
}

export interface WatchPerformance {
  event_latency_p50: number
  event_latency_p95: number
  event_latency_p99: number
  batch_size_avg: number
  throughput_events_per_sec: number
}

export interface ActiveWatch {
  watch_id: string
  path: string
  recursive: boolean
  event_count: number
  start_time: number
}

export interface FileChangeEvent {
  type: 'add' | 'unlink' | 'change' | 'addDir' | 'unlinkDir'
  path: string
  timestamp: number
}

/**
 * Watch Manager for file system changes
 */
export class WatchManager extends EventEmitter {
  private watchId?: string

  /**
   * Start watching files in pattern
   */
  async watch(pattern: string, options?: { recursive?: boolean }): Promise<string> {
    try {
      const result = native.watch_files(pattern, options?.recursive ?? true)
      this.watchId = JSON.parse(result).watch_id
      return this.watchId
    } catch (error) {
      console.error('[Watch] Failed to start watch:', error)
      throw error
    }
  }

  /**
   * Stop watching
   */
  async stop(): Promise<boolean> {
    try {
      if (!this.watchId) return false
      native.stop_watch(this.watchId)
      this.watchId = undefined
      return true
    } catch (error) {
      console.error('[Watch] Failed to stop:', error)
      return false
    }
  }

  /**
   * Get watch statistics
   */
  async getStats(): Promise<WatchStats> {
    try {
      const result = native.get_watch_stats()
      return JSON.parse(result)
    } catch (error) {
      console.error('[Watch] Failed to get stats:', error)
      return {
        active_watches: 0,
        total_events: 0,
        events_per_second: 0,
        avg_latency_ms: 0,
        total_files_watched: 0,
      }
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformance(): Promise<WatchPerformance> {
    try {
      const result = native.get_watch_performance()
      return JSON.parse(result)
    } catch (error) {
      console.error('[Watch] Failed to get performance:', error)
      return {
        event_latency_p50: 0,
        event_latency_p95: 0,
        event_latency_p99: 0,
        batch_size_avg: 0,
        throughput_events_per_sec: 0,
      }
    }
  }

  /**
   * Poll for events
   */
  async pollEvents(): Promise<FileChangeEvent[]> {
    try {
      if (!this.watchId) return []
      const result = native.poll_watch_events(this.watchId)
      const events = JSON.parse(result)
      
      // Emit events
      events.forEach((event: FileChangeEvent) => {
        this.emit('change', event)
      })
      
      return events
    } catch (error) {
      console.error('[Watch] Failed to poll events:', error)
      return []
    }
  }

  /**
   * Get all active watches
   */
  static async getActiveWatches(): Promise<ActiveWatch[]> {
    try {
      const result = native.get_active_watches()
      return JSON.parse(result)
    } catch (error) {
      console.error('[Watch] Failed to get active watches:', error)
      return []
    }
  }

  /**
   * Configure watch aggregation
   */
  static async setAggregation(windowMs: number): Promise<boolean> {
    try {
      native.set_watch_aggregation(windowMs)
      return true
    } catch (error) {
      console.error('[Watch] Failed to set aggregation:', error)
      return false
    }
  }
}

// Export singleton
export const watchManager = new WatchManager()
```

---

## Domain 4: PARSING UTILITIES (15 functions)

**File:** `packages/domain/compiler/src/parsingUtilities.ts` (EXPAND)

### Functions to Add:
```
parse_classes, parse_atomic_class, parse_template,
parse_css_rules, parse_css_to_rules, normalize_class_input,
normalize_and_dedup_classes, parse_subcomponent_blocks_napi,
parse_classes_from_string, parse_template_native,
normalize_iterations, normalize_number, flatten_and_resolve,
validate_component_config_native, validate_variant_config
```

### Code Snippet:

```typescript
// Add to packages/domain/compiler/src/parsingUtilities.ts

/**
 * Parse Tailwind classes with detailed breakdown
 */
export async function parseClassesDetailed(input: string): Promise<ClassAnalysis> {
  try {
    const result = native.parse_classes(input)
    return JSON.parse(result)
  } catch (error) {
    console.error('[Parsing] Failed to parse:', error)
    return {
      classes: [],
      variants: [],
      utilities: [],
      components: [],
      arbitrary: [],
      total_count: 0,
    }
  }
}

/**
 * Parse CSS rules into structured format
 */
export interface CSSRule {
  selector: string
  declarations: Record<string, string>
  pseudo_classes: string[]
  media_queries: string[]
}

export async function parseCSSRules(css: string): Promise<CSSRule[]> {
  try {
    const result = native.parse_css_rules(css)
    return JSON.parse(result)
  } catch (error) {
    console.error('[Parsing] Failed to parse CSS:', error)
    return []
  }
}

/**
 * Parse subcomponent blocks from source
 */
export interface SubComponentBlock {
  name: string
  selectors: string[]
  classes: string[]
  is_styled: boolean
}

export async function parseSubComponentBlocks(
  source: string,
  language: string
): Promise<SubComponentBlock[]> {
  try {
    const result = native.parse_subcomponent_blocks_napi(source, language)
    return JSON.parse(result)
  } catch (error) {
    console.error('[Parsing] Failed to parse subcomponents:', error)
    return []
  }
}

/**
 * Validate component configuration
 */
export interface ValidationError {
  path: string
  message: string
  suggestion?: string
}

export async function validateComponentConfig(config: any): Promise<ValidationError[]> {
  try {
    const result = native.validate_component_config_native(JSON.stringify(config))
    return JSON.parse(result)
  } catch (error) {
    console.error('[Parsing] Validation failed:', error)
    return []
  }
}

/**
 * Normalize and deduplicate classes
 */
export async function normalizeAndDedupeClasses(classes: string[]): Promise<string[]> {
  try {
    const result = native.normalize_and_dedup_classes(JSON.stringify(classes))
    return JSON.parse(result)
  } catch (error) {
    console.error('[Parsing] Failed to normalize:', error)
    return classes
  }
}

/**
 * Flatten and resolve nested class configurations
 */
export async function flattenAndResolve(config: any): Promise<string[]> {
  try {
    const result = native.flatten_and_resolve(JSON.stringify(config))
    return JSON.parse(result)
  } catch (error) {
    console.error('[Parsing] Failed to flatten:', error)
    return []
  }
}
```

---

## Domain 5: POOL & REGISTRY (13 functions)

**File:** `packages/domain/compiler/src/idRegistry.ts` (EXPAND)

### Functions:
```
id_registry_create, id_registry_destroy, id_registry_generate,
id_registry_lookup, id_registry_next, id_registry_reset,
id_registry_snapshot, id_registry_active_count,
clear_resolver_pool, get_resolver_pool_stats,
reset_resolver_pool_stats, clear_atomic_registry,
atomic_registry_size
```

### Code Snippet:

```typescript
// Add to packages/domain/compiler/src/idRegistry.ts

export interface RegistrySnapshot {
  total_allocated: number
  active_ids: string[]
  available_ids: string[]
  allocation_map: Record<string, any>
}

export interface PoolStats {
  total_capacity: number
  active_tasks: number
  queued_tasks: number
  completed_tasks: number
  avg_task_time_ms: number
}

/**
 * Create new ID registry
 */
export async function createRegistry(capacity: number): Promise<string> {
  try {
    const result = native.id_registry_create(capacity)
    return JSON.parse(result).registry_id
  } catch (error) {
    console.error('[Registry] Failed to create:', error)
    throw error
  }
}

/**
 * Get next available ID
 */
export async function nextId(registryId: string): Promise<string> {
  try {
    const result = native.id_registry_next(registryId)
    return JSON.parse(result).id
  } catch (error) {
    console.error('[Registry] Failed to get next ID:', error)
    throw error
  }
}

/**
 * Get registry snapshot
 */
export async function getRegistrySnapshot(registryId: string): Promise<RegistrySnapshot> {
  try {
    const result = native.id_registry_snapshot(registryId)
    return JSON.parse(result)
  } catch (error) {
    console.error('[Registry] Failed to get snapshot:', error)
    return {
      total_allocated: 0,
      active_ids: [],
      available_ids: [],
      allocation_map: {},
    }
  }
}

/**
 * Get resolver pool statistics
 */
export async function getResolverPoolStats(): Promise<PoolStats> {
  try {
    const result = native.get_resolver_pool_stats()
    return JSON.parse(result)
  } catch (error) {
    console.error('[Registry] Failed to get pool stats:', error)
    return {
      total_capacity: 0,
      active_tasks: 0,
      queued_tasks: 0,
      completed_tasks: 0,
      avg_task_time_ms: 0,
    }
  }
}

/**
 * Get atomic registry size
 */
export async function getAtomicRegistrySize(): Promise<number> {
  try {
    const result = native.atomic_registry_size()
    return JSON.parse(result).size
  } catch (error) {
    console.error('[Registry] Failed to get size:', error)
    return 0
  }
}

/**
 * Clear resolver pool
 */
export async function clearResolverPool(): Promise<boolean> {
  try {
    native.clear_resolver_pool()
    return true
  } catch (error) {
    console.error('[Registry] Failed to clear pool:', error)
    return false
  }
}

export const registryManager = {
  createRegistry,
  nextId,
  getRegistrySnapshot,
  getResolverPoolStats,
  getAtomicRegistrySize,
  clearResolverPool,
}
```

---

## Domain 6: CSS GENERATION (12 functions)

**File:** `packages/domain/compiler/src/cssGeneratorNative.ts` (EXPAND)

### Code Snippet:

```typescript
// Add to packages/domain/compiler/src/cssGeneratorNative.ts

/**
 * Generate atomic CSS for classes
 */
export async function generateAtomicCss(classes: string[]): Promise<string> {
  try {
    const result = native.generate_atomic_css(JSON.stringify(classes))
    return JSON.parse(result).css
  } catch (error) {
    console.error('[CSSGen] Failed to generate atomic:', error)
    return ''
  }
}

/**
 * Generate runtime state CSS
 */
export async function generateRuntimeStateCSS(states: Record<string, any>): Promise<string> {
  try {
    const result = native.generate_runtime_state_css(JSON.stringify(states))
    return JSON.parse(result).css
  } catch (error) {
    console.error('[CSSGen] Failed to generate runtime states:', error)
    return ''
  }
}

/**
 * Generate static state CSS at build time
 */
export async function generateStaticStateCSS(config: any): Promise<string> {
  try {
    const result = native.generate_static_state_css(JSON.stringify(config))
    return JSON.parse(result).css
  } catch (error) {
    console.error('[CSSGen] Failed to generate static states:', error)
    return ''
  }
}

/**
 * Generate system token CSS (design tokens)
 */
export async function generateSystemTokenCSS(tokens: Record<string, any>): Promise<string> {
  try {
    const result = native.generate_system_token_css(JSON.stringify(tokens))
    return JSON.parse(result).css
  } catch (error) {
    console.error('[CSSGen] Failed to generate tokens:', error)
    return ''
  }
}

/**
 * Convert Tailwind classes to CSS
 */
export async function twClassesToCss(classes: string[]): Promise<string> {
  try {
    const result = native.tw_classes_to_css(JSON.stringify(classes))
    return JSON.parse(result).css
  } catch (error) {
    console.error('[CSSGen] Failed to convert classes:', error)
    return ''
  }
}

export const cssGenerator = {
  generateAtomicCss,
  generateRuntimeStateCSS,
  generateStaticStateCSS,
  generateSystemTokenCSS,
  twClassesToCss,
}
```

---

## Integration Points: Where to Use These

### 1. CLI Preflight Validation
```bash
# packages/infrastructure/cli/src/preflight.ts
tw preflight  # Uses: Cache Analytics, Class Analysis, Parsing Utils
```

### 2. Dashboard
```bash
# packages/infrastructure/dashboard/src/server.ts
GET /api/cache-analytics     # Uses: Cache Analytics
GET /api/class-analysis      # Uses: Class Analysis
GET /api/watch-stats         # Uses: Watch System
```

### 3. Compiler Workflow
```typescript
// packages/domain/compiler/src/compiler.ts
const compile = async (source: string) => {
  // 1. Check if has TW usage
  const hasTw = await hasTailwindUsage(source)
  
  // 2. Extract classes
  const classes = await extractAllClasses(source)
  
  // 3. Analyze for conflicts
  const conflicts = await detectClassConflicts(classes)
  
  // 4. Generate CSS
  const css = await generateAtomicCss(classes)
  
  return { hasTw, classes, conflicts, css }
}
```

### 4. Build Optimization
```typescript
// scripts/optimize.ts
const optimize = async () => {
  // Get cache hints
  const hints = await getCacheOptimizationHints()
  
  // Get watch performance
  const perf = await watchManager.getPerformance()
  
  // Apply recommendations
  await configureCacheBackend(cacheConfig)
}
```

### 5. Development Server
```typescript
// Watch files for changes
const watcher = new WatchManager()
await watcher.watch('src/**/*.{ts,tsx,jsx}')

watcher.on('change', async (event) => {
  const classes = await extractClassesFromSource(event.path)
  // Recompile incrementally
})
```

---

## Testing Strategy

```typescript
// packages/domain/compiler/__tests__/cacheAnalytics.test.ts

describe('Cache Analytics', () => {
  it('should get cache statistics', async () => {
    const stats = await getCacheStatistics()
    expect(stats).toHaveProperty('total_entries')
    expect(stats).toHaveProperty('hit_rate')
  })

  it('should clear cache', async () => {
    const cleared = await clearCompileCache()
    expect(cleared).toBe(true)
  })

  it('should recommend caching strategy', async () => {
    const strategy = await recommendCachingStrategy()
    expect(['memory', 'disk', 'redis']).toContain(strategy.recommended_backend)
  })
})

describe('Class Analysis', () => {
  it('should analyze classes', async () => {
    const analysis = await analyzeClasses('bg-red-500 hover:bg-blue-600')
    expect(analysis.classes).toContain('bg-red-500')
    expect(analysis.variants).toContain('hover')
  })

  it('should detect conflicts', async () => {
    const conflicts = await detectClassConflicts(['w-full', 'w-1/2'])
    expect(conflicts.length).toBeGreaterThan(0)
  })
})
```

---

## Export Strategy (index.ts)

```typescript
// packages/domain/compiler/src/index.ts

export {
  // Cache Analytics
  getCacheStatistics,
  getParseStatistics,
  scanCacheEntries,
  getCacheOptimizationHints,
  clearCompileCache,
  clearParseCache,
  clearAllCaches,
  configureCacheBackend,
  recommendCachingStrategy,
  cacheAnalytics,
  
  // Class Analysis
  analyzeClasses,
  analyzeClassUsage,
  detectClassConflicts,
  detectDeadCode,
  extractAllClasses,
  extractClassesFromSource,
  hasTailwindUsage,
  diffClassLists,
  areClassSetsEqual,
  classAnalysis,
  
  // Parsing
  parseClassesDetailed,
  parseCSSRules,
  parseSubComponentBlocks,
  validateComponentConfig,
  normalizeAndDedupeClasses,
  flattenAndResolve,
  
  // Registry
  createRegistry,
  nextId,
  getRegistrySnapshot,
  getResolverPoolStats,
  getAtomicRegistrySize,
  clearResolverPool,
  registryManager,
  
  // CSS Generation
  generateAtomicCss,
  generateRuntimeStateCSS,
  generateStaticStateCSS,
  generateSystemTokenCSS,
  twClassesToCss,
  cssGenerator,
  
  // Watch System
  WatchManager,
  watchManager,
} from './modules'
```

---

## Timeline & Checklist

### Week 1: Foundation
- [ ] Create all 6 domain files with TypeScript interfaces
- [ ] Add native binding imports
- [ ] Setup error handling patterns
- [ ] Deploy: Cache Analytics + Class Analysis

### Week 2: Core Features
- [ ] Implement Watch System
- [ ] Implement Parsing Utilities
- [ ] Implement Pool & Registry
- [ ] Deploy: Watch System + Parsing

### Week 3: Advanced
- [ ] Implement CSS Generation
- [ ] Implement Configuration & Optimization
- [ ] Implement Theme Handling
- [ ] Complete test coverage

### Week 4: Polish
- [ ] Performance optimization
- [ ] Documentation
- [ ] Examples & tutorials
- [ ] Release v5

---

## Benefits After Full Integration

✅ **100% function utilization** — All 269 NAPI functions used  
✅ **Rich TypeScript API** — 196+ new exported functions  
✅ **Better DX** — Cache insights, conflict detection, dead code detection  
✅ **Performance** — Native implementation for heavy operations  
✅ **Reliability** — Better validation and analysis  
✅ **Future-proof** — Infrastructure ready for advanced features

---

## Next Steps

1. **Start with Week 1 domains** (Cache + Class Analysis)
2. **Add integration tests** for each domain
3. **Create example usage** in docs/examples
4. **Measure performance** improvements
5. **Gather feedback** from community

**Estimated LOC to write:** ~3000-4000 (mostly boilerplate + interfaces)
