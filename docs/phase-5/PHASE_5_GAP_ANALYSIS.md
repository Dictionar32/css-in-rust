# Phase 5 Gap Analysis: Rust Functions Not Yet Exposed

**Analysis Date**: June 11, 2026
**Total Rust Functions**: 195
**Currently Exposed**: 83 (43%)
**Not Yet Exposed**: 112 (57%)

---

## Executive Summary

While Phase 5 successfully integrated **65+ core Rust functions**, this audit reveals **112 additional Rust functions** still waiting to be exposed to TypeScript. These functions provide:

- Advanced caching strategies
- Stream/incremental processing
- Theme resolution extensions
- CSS compilation variants
- ID registry management
- Redis distributed caching
- Plugin system
- Advanced performance analytics

---

## Integration Status by Category

### ✅ 100% Complete (24 functions)

**Atomic CSS Operations** (5/5)
- `parseAtomicClass` - Parse class to atomic CSS
- `generateAtomicCss` - Generate atomic CSS from rules
- `toAtomicClasses` - Convert to atomic format
- `clearAtomicRegistry` - Clear registry
- `atomicRegistrySize` - Get registry size

**Core Scanning** (8/8)
- `scanWorkspace` - Scan entire workspace
- `scan_file` - Scan single file
- `extract_classes_from_source` - Extract from source
- `batch_extract_classes` - Batch extraction
- `walk_and_prefilter_source_files` - Walk & filter
- `check_against_safelist` - Safelist checking
- `collect_files` - Collect files from dir
- `generate_sub_component_types` - Generate types

**State CSS** (3/3)
- `extractTwStateConfigs` - Extract configs
- `generateStaticStateCss` - Generate static CSS
- `extractAndGenerateStateCss` - Extract & generate

**Basic Utilities** (8/10)
- `hashContent` - Hash function
- `layoutClassesToCss` - Layout to CSS
- `mergeCssDeclarations` - Merge CSS
- `hoistComponents` - Hoist components
- `compileVariantTable` - Compile variants
- `classifyAndSortClasses` - Classify classes
- (+ 2 more in utilities)

---

### ⚠️ Partially Complete (59 functions - 53% exposed)

**Cache Management** (3/12) - 25% exposed
```rust
// ✅ EXPOSED
get_cache_stats()              // Get hit/miss stats
reset_cache_stats()            // Reset counters
clear_theme_cache()            // Clear theme cache

// ❌ NOT EXPOSED (9 missing)
clear_compile_cache()          // Clear compilation cache
clear_css_gen_cache()          // Clear CSS gen cache
clear_parse_cache()            // Clear parser cache
clear_resolve_cache()          // Clear resolver cache
compute_cache_stats()          // Compute optimization hints
get_cache_optimization_hints() // Get recommendations
cache_read()                   // Read from disk
cache_write()                  // Write to disk
cache_priority_score()         // Compute priority
```

**CSS Compilation** (8/20) - 40% exposed
```rust
// ✅ EXPOSED
generate_css_native()          // Generate CSS
compile_css()                  // Compile classes
compile_css_lightning()        // Lightning CSS
process_tailwind_css_lightning() // Process raw CSS
optimize_css()                 // Optimize CSS
detect_dead_code()             // Dead code detection
eliminate_dead_css()           // Remove dead CSS
classify_and_sort_classes()    // Classify classes

// ❌ NOT EXPOSED (12 missing)
compile_animation()            // Compile @keyframes
compile_keyframes()            // Keyframe handler
compile_theme()                // Compile theme
compile_class()                // Single class
compile_classes()              // Multiple classes
compile_to_css()               // To CSS string
compile_to_css_batch()         // Batch to CSS
compile_to_css_minified()      // Compile + minify
compile_to_css_batch_minified() // Batch + minify
tw_merge_simple()              // Simple merge
tw_merge_complex()             // Complex merge
tw_merge_with_config()         // With config
minify_css()                   // Minify CSS
```

**Theme Resolution** (8/15) - 53% exposed
```rust
// ✅ EXPOSED (implied in compilation)
resolve_color()                // Resolve color value
resolve_spacing()              // Resolve spacing
resolve_font_size()            // Resolve font size
resolve_breakpoint()           // Resolve breakpoint
apply_opacity()                // Apply opacity
(+ 3 more variants)

// ❌ NOT EXPOSED (7 missing)
resolve_cascade()              // Resolve cascade
resolve_class_names()          // Resolve names
resolve_conflict_group()       // Resolve conflicts
resolve_simple_variants()      // Resolve variants
resolve_theme_value()          // Resolve theme value
resolve_variants()             // Resolve all variants
validate_variant_config()      // Validate config
```

**Analysis & Dead Code** (12/20) - 60% exposed
```rust
// ✅ EXPOSED
detect_dead_code()             // Detect dead CSS
analyze_classes()              // Analyze classes
analyze_rsc()                  // Analyze RSC
classify_known_classes()       // Classify classes
calculate_impact_scores()      // Calculate impact
analyze_route_class_distribution() // Route analysis
calculate_bundle_contributions() // Bundle size
detect_class_conflicts()       // Detect conflicts
parse_css_rules()              // Parse CSS
batch_split_classes()          // Split classes
parse_css_to_rules()           // Parse to rules
analyze_class_usage()          // Usage analysis

// ❌ NOT EXPOSED (8 missing)
compute_class_stats()          // Compute stats
compute_impact_metadata()      // Compute metadata
get_memory_recommendations()   // Memory tips
estimate_optimal_cache_config() // Cache config
extract_css_vars()             // Extract variables
extract_theme_from_css()       // Extract theme
build_container_rules()        // Build containers
is_critical_class()            // Check if critical
```

---

### ❌ 0% Complete (Not Exposed - 49 functions)

**ID Registry Management** (16 functions) - 0% exposed
```rust
id_registry_create()           // Create registry
id_registry_destroy()          // Destroy registry
id_registry_generate_id()      // Generate ID
id_registry_lookup_id()        // Lookup by ID
id_registry_next_id()          // Get next ID
id_registry_reset()            // Reset registry
id_registry_snapshot()         // Snapshot state
id_registry_active_count()     // Count active
register_property_name()       // Register property
register_value_name()          // Register value
property_id_to_string()        // Convert to string
value_id_to_string()           // Convert value
reverse_lookup_property()      // Reverse lookup
reverse_lookup_value()         // Reverse lookup
id_registry_export()           // Export state
id_registry_import()           // Import state
```

**Stream/Incremental Processing** (8 functions) - 0% exposed
```rust
process_file_change()          // Process file change
scan_file_native()             // Scan with state
scan_files_batch_native()      // Batch scan
compute_incremental_diff()     // Compute diff
create_fingerprint()           // Create fingerprint
inject_state_hash()            // Inject hash
prune_stale_entries()          // Prune cache
rebuild_workspace_result()     // Rebuild state
```

**Advanced Caching - Redis** (40 functions) - 0% exposed
```rust
redis_ping()                   // Ping Redis
redis_get()                    // Get from Redis
redis_set()                    // Set in Redis
redis_delete()                 // Delete from Redis
redis_exists()                 // Check existence
redis_mget()                   // Get multiple
redis_mset()                   // Set multiple
redis_flush_db()               // Flush database
redis_flush_all()              // Flush all
redis_pool_connect()           // Connect pool
redis_pool_stats()             // Pool stats
redis_pool_reconnect()         // Reconnect
redis_enable_cluster()         // Enable clustering
redis_disable_cluster()        // Disable clustering
redis_cluster_status()         // Cluster status
redis_subscribe()              // Subscribe
redis_publish()                // Publish
redis_expiration_set()         // Set expiration
redis_expiration_get()         // Get expiration
(+ 20 more Redis operations)
```

**Plugin System** (5 functions) - 0% exposed
```rust
plugin_check_all_updates()     // Check updates
plugin_search()                // Search plugins
plugin_semver_has_update()     // Check version
plugin_validate_name()         // Validate name
plugin_verify_integrity()      // Verify integrity
```

**Watch/File Monitoring** (12 functions) - 0% exposed
```rust
start_watch()                  // Start watcher
poll_watch_events()            // Poll events
stop_watch()                   // Stop watcher
watch_add_pattern()            // Add pattern
watch_remove_pattern()         // Remove pattern
watch_get_active_handles()     // Get handles
watch_clear_all()              // Clear all
watch_event_type_to_string()   // Convert type
is_watch_running()             // Check if running
get_watch_stats()              // Get statistics
watch_pause()                  // Pause watching
watch_resume()                 // Resume watching
```

**Scan Cache API** (10 functions) - 0% exposed
```rust
scan_cache_get()               // Get cached
scan_cache_put()               // Put in cache
scan_cache_invalidate()        // Invalidate
scan_cache_stats()             // Get stats
scan_cache_clear()             // Clear cache
scan_cache_warm()              // Warm cache
scan_cache_evict_lru()         // Evict LRU
scan_cache_evict_by_age()      // Evict by age
scan_cache_dump()              // Dump to file
scan_cache_load()              // Load from file
```

**Advanced Utilities** (8 functions) - 0% exposed
```rust
export_class_definition()      // Export definition
import_class_definition()      // Import definition
get_class_stats()              // Get class stats
get_comprehensive_report()     // Get report
calculate_memory_impact()      // Calculate memory
format_diagnostic_info()       // Format diagnostic
export_diagnostic_report()     // Export report
import_diagnostic_data()       // Import data
```

---

## Priority Roadmap for Phase 5.1

### Phase 5.1 (High Priority) - 2-3 weeks

**Group A: Cache Management** (9 functions)
- Days 1-2: Expose cache control functions
  - `clear_compile_cache()`, `clear_css_gen_cache()`, `clear_parse_cache()`
- Days 3: Advanced cache optimization
  - `compute_cache_stats()`, `get_cache_optimization_hints()`
- Days 4-5: Persist cache to disk
  - `cache_read()`, `cache_write()`, `cache_priority_score()`

**Group B: Theme Resolution Extended** (7 functions)
- Days 1-2: Add variant resolution
  - `resolve_variants()`, `validate_variant_config()`
- Days 3-4: Cascade & conflict handling
  - `resolve_cascade()`, `resolve_conflict_group()`
- Day 5: Value resolution
  - `resolve_class_names()`, `resolve_theme_value()`

**Group C: Stream Processing** (8 functions)
- Days 1-3: File change processing
  - `process_file_change()`, `compute_incremental_diff()`, `create_fingerprint()`
- Days 4-5: State management
  - `inject_state_hash()`, `prune_stale_entries()`, `rebuild_workspace_result()`

### Phase 5.2 (Medium Priority) - 3-4 weeks

**Group D: Advanced CSS Compilation** (12 functions)
- Implement `tw_merge` variants
- Add animation/keyframe compilation
- Theme compilation support

**Group E: ID Registry Management** (16 functions)
- Full ID registry API
- Property/value registration
- Reverse lookup utilities

### Phase 5.3+ (Long Term) - 4+ weeks

**Group F: Redis Cache Operations** (40 functions)
- Distributed caching support
- Cluster management
- Pub/sub functionality

**Group G: Plugin System** (5 functions)
- Plugin discovery
- Version management
- Integrity verification

**Group H: Advanced Watch System** (12 functions)
- Enhanced file monitoring
- Pattern-based watching
- Event aggregation

**Group I: Scan Cache API** (10 functions)
- Advanced caching strategies
- LRU eviction
- Disk persistence

---

## Implementation Strategy for Phase 5.1

### Step 1: Create New Wrapper Modules

Create dedicated wrapper modules for each priority group:

```typescript
// scannerNative.ts (existing - update)
export { scan_cache_get, scan_cache_put, ... } // Add cache API

// cacheNative.ts (NEW)
export { 
  clear_compile_cache,
  clear_css_gen_cache,
  compute_cache_stats,
  // ... 9 cache functions
}

// themeResolutionNative.ts (NEW)
export {
  resolve_variants,
  validate_variant_config,
  resolve_cascade,
  // ... 7 theme functions
}

// streamingNative.ts (NEW)
export {
  process_file_change,
  compute_incremental_diff,
  create_fingerprint,
  // ... 8 stream functions
}
```

### Step 2: Extend nativeBridge.ts

Add 35+ new interface definitions and optional function signatures:

```typescript
// Add to NativeBridge interface
interface NativeBridge {
  // ... existing 83 functions ...
  
  // NEW: Cache Management API
  clear_compile_cache?: () => void
  clear_css_gen_cache?: () => void
  compute_cache_stats?: () => CacheOptimizationStats
  // ... 6 more
  
  // NEW: Theme Resolution Extended
  resolve_variants?: (configJson: string) => string[]
  validate_variant_config?: (configJson: string) => ValidationResult
  // ... 5 more
  
  // NEW: Stream Processing
  process_file_change?: (fileJson: string) => ProcessedFileChange
  compute_incremental_diff?: (oldJson: string, newJson: string) => FileDiff
  // ... 6 more
}
```

### Step 3: Add Type Definitions

Create corresponding TypeScript interfaces for all return types:

```typescript
export interface CacheOptimizationStats {
  current_hit_rate: number
  recommended_strategy: string
  estimated_savings: string
  memory_impact: string
}

export interface ProcessedFileChange {
  file: string
  old_classes: string[]
  new_classes: string[]
  added: string[]
  removed: string[]
  fingerprint: string
}

// ... 30+ more interfaces
```

### Step 4: Update index.ts Exports

Add all new functions to the main export:

```typescript
export {
  // Cache API
  clearCompileCache,
  clearCssGenCache,
  computeCacheStats,
  // ... all Phase 5.1 functions
} from "./cacheNative"
```

### Step 5: Documentation & JSDoc

Add comprehensive documentation:

```typescript
/**
 * Compute cache optimization statistics and recommendations.
 * 
 * @returns {CacheOptimizationStats} Optimization hints including hit rate,
 *          recommended strategy, and estimated memory savings
 * 
 * @example
 * ```ts
 * const stats = computeCacheStats()
 * console.log(`Current hit rate: ${stats.current_hit_rate}%`)
 * console.log(`Recommendation: ${stats.recommended_strategy}`)
 * ```
 */
export function computeCacheStats(): CacheOptimizationStats
```

---

## Estimated Effort

| Phase | Group | Functions | Effort | Timeline |
|-------|-------|-----------|--------|----------|
| 5.1 | Cache Management | 9 | 5 days | Week 1-2 |
| 5.1 | Theme Resolution | 7 | 5 days | Week 1-2 |
| 5.1 | Stream Processing | 8 | 4 days | Week 2 |
| 5.2 | CSS Compilation | 12 | 7 days | Week 3-4 |
| 5.2 | ID Registry | 16 | 6 days | Week 4-5 |
| 5.3 | Redis Cache | 40 | 15 days | Week 6-8 |
| 5.3 | Plugin System | 5 | 4 days | Week 9 |
| 5.3+ | Watch System | 12 | 5 days | Week 10 |
| 5.3+ | Scan Cache | 10 | 4 days | Week 11 |

**Total Estimated**: 24 days (5 weeks) to complete all 112 missing functions

---

## Decision Points

### For Phase 5.1 (Next Sprint)

**Q1: Should we expose Redis operations in Phase 5.1?**
- **Recommendation**: NO - defer to Phase 5.3
- **Reason**: Only needed for distributed setups; core functionality doesn't depend on it

**Q2: Should we implement ID Registry in 5.1?**
- **Recommendation**: NO - defer to Phase 5.2
- **Reason**: Advanced feature; core scanning/compilation works without it

**Q3: Priority for Phase 5.1?**
- **Recommendation**: Cache Management > Theme Resolution > Stream Processing
- **Reason**: Cache management provides immediate performance improvements

---

## Validation & Testing

Each Phase requires:

1. **Unit Tests** (~50 new tests per group)
2. **Integration Tests** (verify with existing Phase 5 functions)
3. **Performance Benchmarks** (compare before/after)
4. **Type Safety Checks** (0 `any` types)
5. **Documentation** (JSDoc + examples)

---

## Success Criteria

By end of Phase 5.1:
- ✅ 24 new functions exposed (24 + 83 = 107 total)
- ✅ Coverage increases from 43% → 55%
- ✅ All new functions 100% typed (no `any` types)
- ✅ Zero breaking changes to existing exports
- ✅ Production-ready builds with all tests passing
- ✅ Comprehensive documentation for all new functions

---

## Gap Summary

```
Phase 5 Current State:
  Total Rust Functions: 195
  Currently Exposed: 83 (43%)
  Gap: 112 (57%)

Phase 5.1 Plan (adds 24):
  Exposed: 107 (55%)
  Gap: 88 (45%)

Phase 5.2 Plan (adds 28):
  Exposed: 135 (69%)
  Gap: 60 (31%)

Phase 5.3+ Plan (adds remaining 60):
  Exposed: 195 (100%)
  Gap: 0 (0%)
```

---

**Next Action**: Review this gap analysis and prioritize Phase 5.1 work items for development sprint planning.
