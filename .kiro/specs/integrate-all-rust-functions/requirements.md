# Requirements: Integrate All 110+ Rust Functions

**Status:** 🆕 NEW SPEC  
**Priority:** 🔴 CRITICAL  
**Timeline:** 8 weeks (Phase 1-4)  
**Objective:** Make all 110+ Rust NAPI functions actively used in TypeScript compiler pipeline

---

## Executive Summary

Saat ini ada **110+ fungsi Rust** yang:
- ✅ Sudah di-expose via NAPI Bridge
- ✅ Sudah dibungkus dalam TypeScript wrapper (`nativeBridgeWrappers.ts`)
- ❌ **BELUM diintegrasikan ke manager classes dan compiler pipeline**
- ❌ **BELUM digunakan dalam actual compilation**

Spec ini mendefinisikan strategi untuk **menggunakan semua 110+ fungsi** sehingga semua kapabilitas Rust terekspos sepenuhnya ke TypeScript/JavaScript.

---

## Current State vs Target State

### Current State ❌
```
Rust Functions (110+)
    ↓
NAPI Bridge (terexpose)
    ↓
TypeScript Wrappers (ada di nativeBridgeWrappers.ts)
    ↓
❌ TIDAK DIGUNAKAN
```

### Target State ✅
```
Rust Functions (110+)
    ↓
NAPI Bridge
    ↓
TypeScript Wrappers
    ↓
Manager Classes
    ↓
✅ COMPILER PIPELINE
    ↓
✅ ACTUAL USAGE
```

---

## Kategorisasi Fungsi & Integrasi Points

### 1. REDIS Integration (40 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/managers/RedisManager.ts`

**Fungsi yang harus digunakan:**
- Connection management: `redis_pool_connect()`, `redis_ping()`, `redis_info()`
- Cache operations: `redis_set()`, `redis_get()`, `redis_delete()`, `redis_mget()`, `redis_mset()`
- TTL management: `redis_expire()`, `redis_ttl()`
- Batch operations: `redis_flush_db()`, `redis_flush_all()`
- Analytics: `redis_pool_stats()`, `redis_cache_hit_rate()`, `redis_memory_stats()`
- Advanced: `redis_enable_cluster()`, `redis_enable_persistence()`, `redis_replicate()`
- Monitoring: `redis_monitor()`, `redis_diagnose()`

**Integration Strategy:**
1. Read Redis config dari `tailwind.config.js` atau env vars
2. Initialize connection pool di compiler startup
3. Implement cache key generation strategy
4. Use Redis untuk store compilation results
5. Add fallback ke LRU jika Redis unavailable
6. Implement automatic cache invalidation
7. Add Redis pool reconnection logic

---

### 2. WATCH System (20 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/managers/WatchManager.ts`

**Fungsi yang harus digunakan:**
- Watch management: `start_watch()`, `stop_watch()`, `watch_add_pattern()`, `watch_remove_pattern()`
- Event polling: `poll_watch_events()`, `get_watch_events()`, `get_watch_performance()`
- Pause/Resume: `watch_pause()`, `watch_resume()`
- Monitoring: `get_watch_stats()`, `is_watch_running()`, `watch_get_active_handles()`
- Plugin integration: `register_plugin_hook()`, `emit_plugin_hook()`, `get_plugin_hooks()`

**Integration Strategy:**
1. Start file watcher saat dev mode
2. Implement debouncing untuk rapid file changes
3. Setup plugin hooks untuk recompile triggers
4. Add .gitignore handling automatic
5. Measure file-change-to-recompile latency
6. Add error recovery & watch restart logic
7. Implement watch performance monitoring

---

### 3. ID Registry (16 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/idRegistryNative.ts`

**Fungsi yang harus digunakan:**
- Registry management: `id_registry_create()`, `id_registry_generate()`, `id_registry_lookup()`, `id_registry_next()`
- Cleanup: `id_registry_destroy()`, `id_registry_reset()`
- Inspection: `id_registry_snapshot()`, `id_registry_active_count()`
- Property/value tracking: `register_property_name()`, `register_value_name()`, `property_id_to_string()`, `value_id_to_string()`
- Lookup: `reverse_lookup_property()`, `reverse_lookup_value()`
- Serialization: `id_registry_export()`, `id_registry_import()`

**Integration Strategy:**
1. Create registry per compilation session
2. Generate stable IDs untuk components
3. Use IDs dalam CSS selector generation
4. Export registry untuk reproducible builds
5. Import registry untuk multi-machine consistency
6. Add ID collision detection
7. Implement registry validation

---

### 4. THEME Resolution (7 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/themeResolutionNative.ts`

**Fungsi yang harus digunakan:**
- Resolution: `resolve_color()`, `resolve_spacing()`, `resolve_font_size()`, `resolve_breakpoint()`, `resolve_font_family()`, `resolve_opacity()`, `resolve_line_height()`
- Advanced: `resolve_variants()`, `validate_variant_config()`, `resolve_cascade()`, `resolve_class_names()`, `resolve_conflict_group()`, `resolve_theme_value()`, `resolve_simple_variants()`

**Integration Strategy:**
1. Load theme dari Tailwind config
2. Implement theme caching untuk < 1ms lookups
3. Setup cascade merging (base + overrides)
4. Add theme validation before compilation
5. Cache theme tokens
6. Implement theme inheritance
7. Add custom theme support

---

### 5. INCREMENTAL Compilation (8 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/managers/IncrementalManager.ts`

**Fungsi yang harus digunakan:**
- File changes: `process_file_change()`, `compute_incremental_diff()`, `create_fingerprint()`
- CSS operations: `inject_state_hash()`, `prune_stale_entries()`, `rebuild_workspace_result()`
- Batch scanning: `scan_files_batch_native()`
- Optimization hints: `get_cache_optimization_hints()`, `estimate_streaming_batch_size()`

**Integration Strategy:**
1. Implement file fingerprinting
2. Compute incremental diffs
3. Skip full recompile untuk unchanged files
4. Batch process multiple file changes
5. Add state hash injection untuk cache invalidation
6. Prune stale CSS rules
7. Rebuild workspace incrementally

---

### 6. CSS Optimization (10 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/managers/OptimizationManager.ts`

**Fungsi yang harus digunakan:**
- CSS compilation: `compile_to_css()`, `compile_to_css_batch()`, `generate_css_native()`, `generate_css()`, `generate_css_batch()`
- Optimization: `detect_dead_code()`, `eliminate_dead_css()`, `optimize_css()`, `minify_css()`
- Pipeline: `process_tailwind_css_lightning()`, `process_tailwind_css_with_targets()`

**Integration Strategy:**
1. Implement dead code detection
2. Eliminate unused CSS rules
3. Integrate LightningCSS minification
4. Add optimization analysis reporting
5. Implement deterministic optimization
6. Add optimization caching
7. Measure CSS reduction %

---

### 7. ATOMIC CSS (5 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/managers/OptimizationManager.ts` (atomic mode)

**Fungsi yang harus digunakan:**
- Atomic conversion: `parse_atomic_class()`, `to_atomic_classes()`, `generate_atomic_css()`
- Registry: `clear_atomic_registry()`, `get_atomic_registry_size()`

**Integration Strategy:**
1. Add `--atomic` compilation mode option
2. Convert Tailwind classes ke atomic form
3. Deduplicate atomic properties
4. Measure atomic vs Tailwind CSS size reduction
5. Add atomic mode to compiler options

---

### 8. CACHE Management (12 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/managers/CacheManager.ts`

**Fungsi yang harus digunakan:**
- Configuration: `configure_cache_backend()`, `get_recommended_cache_config()`
- Stats: `get_cache_stats()`, `get_resolver_pool_stats()`, `get_cache_optimization_hints()`
- Clear operations: `clear_all_caches_napi()`, `clear_parse_cache_napi_inner()`, `clear_resolve_cache_napi()`, `clear_compile_cache_napi()`, `clear_css_gen_cache_napi()`, `clear_resolver_pool()`
- Streaming: `estimate_streaming_batch_size()`

**Integration Strategy:**
1. Auto-detect optimal cache backend
2. Configure cache backend saat startup
3. Implement multi-tier caching (LRU → Redis → Persistent)
4. Add cache statistics collection
5. Implement cache optimization hints
6. Add adaptive cache resizing
7. Implement cache invalidation strategies

---

### 9. ANALYSIS & Utilities (9 fungsi)

**Integrasi Point:** `packages/domain/compiler/src/analyzerNative.ts`

**Fungsi yang harus digunakan:**
- Memory tracking: `get_memory_stats_native()`, `get_memory_recommendations_native()`, `reset_memory_stats()`
- Optimization: `estimate_optimal_cache_config_native()`, `get_week6_features_status()`
- Component analysis: `analyze_class_usage()`, `calculate_impact()`, `calculate_risk()`, `calculate_savings()`

**Integration Strategy:**
1. Collect memory statistics selama compilation
2. Generate memory optimization recommendations
3. Analyze component usage patterns
4. Calculate bundle impact per component
5. Track compilation performance metrics
6. Generate diagnostics reports

---

## Integration Phases

### Phase 1: Foundation (Week 1-2) 🔴 CRITICAL
- **Redis Integration**
  - [ ] Setup connection pooling
  - [ ] Implement cache key generation
  - [ ] Add Redis config parsing
  - [ ] Fallback ke LRU
  - [ ] Test cache hit rate ≥ 75%

- **Watch System**
  - [ ] Setup file watching
  - [ ] Implement debouncing
  - [ ] Add plugin hooks
  - [ ] Test latency < 200ms

### Phase 2: Core Compiler (Week 3-4) 🔴 CRITICAL
- **ID Registry**
  - [ ] Create registry per session
  - [ ] Generate stable component IDs
  - [ ] Export/import untuk reproducibility
  - [ ] Test ID consistency

- **Theme Resolution**
  - [ ] Implement theme caching
  - [ ] Setup cascade merging
  - [ ] Add validation
  - [ ] Test dengan 1000+ tokens

### Phase 3: Performance (Week 5-6) 🟡 IMPORTANT
- **Incremental Compilation**
  - [ ] File fingerprinting
  - [ ] Incremental diffs
  - [ ] Batch processing
  - [ ] Test 100-file rebuild < 500ms

- **CSS Optimization**
  - [ ] Dead code elimination
  - [ ] LightningCSS integration
  - [ ] Optimization reporting
  - [ ] Test ~90% CSS reduction

### Phase 4: Advanced (Week 7-8) 🟢 NICE-TO-HAVE
- **Atomic CSS**
  - [ ] Atomic conversion
  - [ ] Property deduplication
  - [ ] Registry management

- **Analysis & Utilities**
  - [ ] Memory statistics
  - [ ] Component usage analytics
  - [ ] Performance recommendations

---

## Acceptance Criteria

### Criterion 1: All Functions Exposed in TypeScript
- WHEN a Rust function is di-NAPI-bridge
- THEN it SHALL have TypeScript wrapper
- THEN it SHALL be exported dari `nativeBridgeWrappers.ts`

### Criterion 2: All Functions Integrated in Pipeline
- WHEN all functions are wrapped
- THEN each SHALL be used oleh appropriate manager class
- THEN each SHALL be invoked during compilation

### Criterion 3: Configuration-Driven
- WHEN compiler starts
- THEN it SHALL read config dari `tailwind.config.js`
- THEN it SHALL enable/disable features berdasarkan config
- THEN it SHALL use sensible defaults

### Criterion 4: Performance Targets Met
- WHEN Redis caching is enabled: hit rate ≥ 75%
- WHEN watch system runs: latency < 200ms
- WHEN incremental compile runs: 100-file rebuild < 500ms
- WHEN theme resolution runs: cached lookups < 1ms
- WHEN CSS optimization runs: reduction ≥ 85%

### Criterion 5: Error Handling & Fallbacks
- WHEN Redis unavailable: fallback ke LRU
- WHEN watch fails: recover automatically
- WHEN theme invalid: clear error message
- WHEN optimization fails: graceful degradation

### Criterion 6: Backward Compatibility
- WHEN existing projects compile
- THEN behavior SHALL be identical or improved
- THEN no breaking changes
- THEN migration path clear if any

---

## Success Metrics

| Metric | Target | Owner |
|--------|--------|-------|
| All 110+ functions integrated | 100% | Phase 1-4 |
| Redis cache hit rate | ≥ 75% | Phase 1 |
| Watch system latency | < 200ms | Phase 1 |
| Incremental rebuild (100 files) | < 500ms | Phase 3 |
| Theme lookup (cached) | < 1ms | Phase 2 |
| CSS optimization reduction | ≥ 85% | Phase 3 |
| Test coverage | ≥ 80% | All phases |
| Documentation completeness | 100% | All phases |
| Zero regressions | 100% | All phases |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Redis connection fails | HIGH | Auto-fallback ke LRU cache |
| Watch system performance | HIGH | Implement debouncing & batching |
| Incremental diff bugs | HIGH | Comprehensive property testing |
| Theme resolution conflicts | MEDIUM | Validation & clear error messages |
| Performance regression | MEDIUM | Continuous benchmarking |
| Memory leaks | MEDIUM | Atomic counters & periodic profiling |
| Type mismatches | MEDIUM | Strict TypeScript mode |

---

## Implementation Notes

### Build Before Testing
```bash
npm run build      # Builds everything (Rust + TS)
npm run test:all   # Run tests setelah build
```

### Integration Strategy
1. Focus manager class per phase
2. Implement core functions first
3. Add optional features after
4. Test extensively per phase
5. Measure performance at each step

### Configuration Example
```json
{
  "compiler": {
    "cache": {
      "backend": "auto",  // auto-detect best backend
      "redis": {
        "enabled": true,
        "host": "localhost",
        "port": 6379,
        "poolSize": 10
      }
    },
    "watch": {
      "enabled": true,
      "debounce": 300,
      "ignore": [".git/**", "node_modules/**"]
    },
    "optimization": {
      "deadCodeElimination": true,
      "atomic": false
    }
  }
}
```

---

## Next Steps

1. ✅ Create spec (ini file)
2. ⏭️ Create tasks per phase
3. ⏭️ Setup performance benchmarks
4. ⏭️ Implement Phase 1 (Redis + Watch)
5. ⏭️ Measure & iterate
6. ⏭️ Move to Phase 2, 3, 4

**Ready untuk mulai Phase 1 ✅**
