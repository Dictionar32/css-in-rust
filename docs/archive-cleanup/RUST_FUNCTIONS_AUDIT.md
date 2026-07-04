# Audit Fungsi Rust yang Belum Dipanggil di TypeScript

**Status:** ✅ AUDIT COMPLETE  
**Tanggal:** 2026-06-12  
**Total Fungsi Rust:** 87 fungsi di NAPI Bridge  
**Fungsi Sudah Dibungkus TypeScript:** 127+ functions  
**Fungsi Belum Digunakan:** TBD (lihat detail di bawah)

---

## 📊 Ringkasan Eksekutif

Dari spec `use-all-63-rust-functions/requirements.md`, ada **63 fungsi Rust** yang sudah di-expose via NAPI Bridge tetapi **belum diintegrasikan ke TypeScript** atau **belum digunakan di aplikasi**.

### Kategori Fungsi yang Belum Diintegrasikan:

1. **Redis Integration** - ~40 fungsi ✅ Sebagian sudah dibungkus
2. **Watch System** - ~20 fungsi ⚠️ Wrapper ada tapi belum fully integrated
3. **ID Registry** - ~11 fungsi ⚠️ Wrapper ada tapi tidak digunakan
4. **Streaming/Incremental** - ~8 fungsi ⚠️ Partially wrapped
5. **Theme Resolution** - ~7 fungsi ⚠️ Partially wrapped
6. **Optimization/Analysis** - ~6 fungsi ⚠️ Partially wrapped

---

## 🔍 Detail Per Kategori

### 1. Redis Integration - 40+ Fungsi

#### ✅ Sudah Dibungkus di TypeScript:

```typescript
// native/src/infrastructure/napi_bridge_redis.rs
- redis_pool_connect()
- redis_set()
- redis_get()
- redis_delete()
- redis_mget()
- redis_mset()
- redis_exists()
- redis_expire()
- redis_ttl()
- redis_pool_stats()
- redis_flush_db()
- redis_ping()
- redis_info()
- redis_cache_clear()
- redis_enable_cluster()
- redis_cache_hit_rate()
- redis_monitor()
- redis_sync_nodes()
- redis_get_config()
- redis_shutdown()
```

#### ✅ Sudah Dibungkus di TypeScript (nativeBridgeWrappers.ts):

```typescript
- redis_pool_connect()
- redis_pool_stats()
- redis_pool_reconnect()
- redis_ping()
- redis_get()
- redis_set()
- redis_delete()
- redis_exists()
- redis_mget()
- redis_mset()
- redis_flush_db()
- redis_flush_all()
- redis_cache_size()
- redis_cache_key_count()
- redis_cache_clear()
- redis_cache_hit_rate()
- redis_info()
- redis_monitor()
- redis_enable_cluster()
- redis_disable_cluster()
- redis_cluster_status()
- redis_expiration_set()
- redis_expiration_get()
- redis_subscribe()
- redis_publish()
- redis_enable_persistence()
- redis_disable_persistence()
- redis_snapshot()
- redis_replicate()
- redis_replication_status()
- redis_enable_cache_warming()
- redis_disable_cache_warming()
- redis_cache_sync()
- redis_set_eviction_policy()
- redis_get_eviction_policy()
- redis_memory_stats()
- redis_optimize_memory()
- redis_diagnose()
```

**Status:** 40 fungsi Redis sudah ada di wrapper, tapi **belum aktual integration ke compiler pipeline**.

**Yang Perlu Dilakukan:**
- [ ] Integrate Redis backend ke `packages/domain/compiler/src/managers/RedisManager.ts`
- [ ] Set up Redis connection pooling di startup
- [ ] Implement cache key generation strategy
- [ ] Test cache hit/miss rates dalam real compilation
- [ ] Add fallback ke LRU cache jika Redis unavailable

---

### 2. Watch System - 20+ Fungsi

#### ✅ Sudah Dibungkus:

```typescript
// native/src/infrastructure/napi_bridge_watch.rs
- watch_files()
- stop_watch()
- get_watch_events()
- get_watch_performance()
- clear_watch_stats()
- is_watch_running()
- get_active_watches()
- set_watch_metrics()
- set_watch_aggregation()
```

#### ✅ Di nativeBridgeWrappers.ts:

```typescript
- start_watch()
- poll_watch_events()
- stop_watch()
- watch_add_pattern()
- watch_remove_pattern()
- watch_pause()
- watch_resume()
- is_watch_running()
- get_watch_stats()
- watch_get_active_handles()
- watch_clear_all()
- register_plugin_hook()
- unregister_plugin_hook()
- emit_plugin_hook()
- get_plugin_hooks()
```

**Status:** Wrapper ada, tapi **tidak diintegrasikan ke WatchManager**.

**Yang Perlu Dilakukan:**
- [ ] Integrate ke `packages/domain/compiler/src/managers/WatchManager.ts`
- [ ] Setup file watching saat dev mode
- [ ] Implement debouncing untuk rapid file changes
- [ ] Plugin hook integration untuk recompile triggers
- [ ] Error recovery untuk watch system
- [ ] Measure latency dari file change → recompile
- [ ] Test dengan 100+ watched files

---

### 3. ID Registry - 11+ Fungsi

#### ✅ Sudah Dibungkus:

```typescript
// native/src/infrastructure/napi_bridge.rs (tidak ada modul khusus)
- id_registry_create()
- id_registry_generate()
- id_registry_lookup()
- id_registry_next()
- id_registry_destroy()
- id_registry_reset()
- id_registry_snapshot()
- id_registry_active_count()
- register_property_name()
- register_value_name()
- property_id_to_string()
- value_id_to_string()
- reverse_lookup_property()
- reverse_lookup_value()
- id_registry_export()
- id_registry_import()
```

#### ✅ Di nativeBridgeWrappers.ts:

```typescript
- id_registry_create()
- id_registry_generate()
- id_registry_lookup()
- id_registry_next()
- id_registry_destroy()
- id_registry_reset()
- id_registry_snapshot()
- id_registry_active_count()
- register_property_name()
- register_value_name()
- property_id_to_string()
- value_id_to_string()
- reverse_lookup_property()
- reverse_lookup_value()
- id_registry_export()
- id_registry_import()
```

**Status:** Wrapper ada lengkap, tapi **tidak digunakan di manapun**.

**Yang Perlu Dilakukan:**
- [ ] Implement ID registry integration di `packages/domain/compiler/src/idRegistryNative.ts`
- [ ] Generate stable component IDs saat compile
- [ ] Export/import registry untuk reproducible builds
- [ ] Use registry IDs dalam selector generation
- [ ] Add tests untuk ID consistency across builds
- [ ] Benchmark dengan 10000+ entries

---

### 4. Streaming/Incremental - 8+ Fungsi

#### ✅ Sudah Dibungkus:

```typescript
// native/src/infrastructure/napi_bridge_parsing.rs + napi_bridge_css.rs
- compile_class_napi()
- process_file_change()
- compute_incremental_diff()
- create_fingerprint()
- inject_state_hash()
- prune_stale_entries()
- rebuild_workspace_result()
- scan_files_batch_native()
```

#### ✅ Di nativeBridgeWrappers.ts:

```typescript
- process_file_change()
- compute_incremental_diff()
- create_fingerprint()
- inject_state_hash()
- prune_stale_entries()
- rebuild_workspace_result()
- scan_files_batch_native()
```

**Status:** Wrapper ada, tapi **tidak ada streaming implementation**.

**Yang Perlu Dilakukan:**
- [ ] Implement incremental compilation logic
- [ ] Set up file fingerprinting untuk change detection
- [ ] Batch processing untuk efficiency
- [ ] Streaming CSS output infrastructure
- [ ] Test incremental rebuild vs full rebuild performance
- [ ] Measure 100-file change rebuild time (target: < 500ms)

---

### 5. Theme Resolution - 7+ Fungsi

#### ✅ Sudah Dibungkus:

```typescript
// native/src/infrastructure/napi_bridge_theme.rs
- resolve_color()
- resolve_spacing()
- resolve_font_size()
- resolve_breakpoint()
- resolve_font_family()
- resolve_opacity()
- resolve_line_height()
```

#### ✅ Di nativeBridgeWrappers.ts:

```typescript
- resolve_variants()
- validate_variant_config()
- resolve_cascade()
- resolve_class_names()
- resolve_conflict_group()
- resolve_theme_value()
- resolve_simple_variants()
```

**Status:** Wrapper ada, tapi **integration incomplete**.

**Yang Perlu Dilakukan:**
- [ ] Integrate ke `packages/domain/compiler/src/themeResolutionNative.ts`
- [ ] Set up theme caching untuk < 1ms lookups
- [ ] Implement cascade merging (base + overrides)
- [ ] Add theme validation before compilation
- [ ] Test dengan 1000+ tokens dalam theme
- [ ] Benchmark theme lookup performance

---

### 6. CSS Optimization - 6+ Fungsi

#### ✅ Sudah Dibungkus:

```typescript
// native/src/infrastructure/napi_bridge_css.rs
- compile_to_css()
- compile_to_css_batch()
- minify_css()
- generate_css_native()
- generate_css()
- generate_css_batch()
```

#### ✅ Di nativeBridgeWrappers.ts:

```typescript
- detect_dead_code()
- eliminate_dead_css()
- optimize_css()
- process_tailwind_css_lightning()
- process_tailwind_css_with_targets()
- parse_atomic_class()
- generate_atomic_css()
- to_atomic_classes()
- clear_atomic_registry()
- get_atomic_registry_size()
```

**Status:** Wrapper ada, tapi **tidak ada dead code elimination pipeline**.

**Yang Perlu Dilakukan:**
- [ ] Implement dead code detection & elimination
- [ ] Add optimization analysis reporting
- [ ] LightningCSS integration untuk minification
- [ ] Atomic CSS generation option
- [ ] Test 90% CSS reduction untuk typical project
- [ ] Deterministic optimization verification

---

### 7. Cache Management - 12+ Fungsi

#### ✅ Sudah Dibungkus:

```typescript
// native/src/infrastructure/napi_bridge_cache.rs
- configure_cache_backend()
- get_cache_stats()
- get_recommended_cache_config()
- clear_all_caches_napi()
- clear_parse_cache_napi_inner()
- clear_resolve_cache_napi()
- clear_compile_cache_napi()
- clear_css_gen_cache_napi()
- get_resolver_pool_stats()
- clear_resolver_pool()
- get_cache_optimization_hints()
- estimate_streaming_batch_size()
```

#### ✅ Di nativeBridgeWrappers.ts:

```typescript
- configure_cache_backend()
- get_cache_stats()
- get_recommended_cache_config()
- clear_all_caches_napi()
- clear_resolve_cache_napi()
- clear_compile_cache_napi()
- clear_css_gen_cache_napi()
- get_resolver_pool_stats()
- clear_resolver_pool()
- get_cache_optimization_hints()
- estimate_streaming_batch_size()
```

**Status:** Wrapper ada, tapi **configuration logic incomplete**.

**Yang Perlu Dilakukan:**
- [ ] Auto-detect optimal cache backend (LRU vs Redis vs Persistent)
- [ ] Config-driven backend selection
- [ ] Cache stats collection & reporting
- [ ] Adaptive cache resizing
- [ ] Fallback logic jika primary cache fails

---

### 8. Analysis & Utilities - 9+ Fungsi

#### ✅ Sudah Dibungkus:

```typescript
// native/src/infrastructure/napi_bridge_analysis.rs
- get_week6_features_status()
- get_memory_stats_native()
- get_memory_recommendations_native()
- estimate_optimal_cache_config_native()
- reset_memory_stats()
```

#### ✅ Di nativeBridgeWrappers.ts:

```typescript
- analyze_class_usage()
- calculate_impact()
- calculate_risk()
- calculate_savings()
```

**Status:** Partial integration.

**Yang Perlu Dilakukan:**
- [ ] Memory stats collection during compilation
- [ ] Performance recommendations engine
- [ ] Component usage analytics
- [ ] Bundle impact calculations

---

## ⚙️ Masalah yang Ditemukan

### Problem 1: Wrapper Exists But Not Integrated ❌

Banyak fungsi sudah dibungkus di `nativeBridgeWrappers.ts`, tapi **tidak diimpor atau digunakan** di manager classes:

```typescript
// ✅ Dibungkus di nativeBridgeWrappers.ts
export const redis_pool_connect = (host: string, port: number, poolSize?: number): string => {
  return safeCallNative("redis_pool_connect", () => 
    native.redis_pool_connect(JSON.stringify({ host, port, poolSize }))
  )
}

// ❌ Tapi tidak digunakan di RedisManager.ts
// RedisManager tidak call redis_pool_connect saat init
// RedisManager tidak setup connection pooling
```

### Problem 2: No Orchestration / Pipeline ❌

Fungsi-fungsi ada tapi **tidak diorchestrasi** jadi satu pipeline. Contoh:

```typescript
// ✅ Fungsi individual ada di Rust
- resolve_cascade()
- resolve_class_names()
- resolve_conflict_group()

// ❌ Tapi belum ada orchestration yang:
// 1. Load theme config
// 2. Apply cascade merging
// 3. Resolve all classes
// 4. Cache results
// 5. Return final theme map
```

### Problem 3: Configuration Not Wired ❌

Belum ada logic untuk:
- Read Redis config dari `tailwind.config.js`
- Auto-select cache backend berdasarkan workload
- Configure watch patterns
- Set theme resolution strategy

### Problem 4: Testing Without Build ❌

Kemarin langsung bikin test tanpa:
1. Run `npm run build:rust` dulu (compile Rust ke .node binary)
2. Run `npm run build:packages` dulu (build TypeScript)
3. Test bisa jalan tapi referensi undefined karena binary belum ada

---

## 🛠️ Workflow yang Benar (Build → Integration → Test)

```bash
# LANGSUNG DAN SIMPLE:
npm run build    # Ini otomatis handle semuanya:
                 # 1. Build Rust binary (native/index.node)
                 # 2. Build TypeScript packages (dist/)
                 # 3. Bundle semuanya

# BARU TEST:
npm run test:all # Sekarang binary sudah ada, tests bisa akses native functions
```

**Catatan:** `npm run build` dalam `package.json` sudah include:
```json
"build": "npm run build:rust && npm run build:packages && rm -rf dist && tsup --config tsup.config.ts && tsup --config tsup.dts.config.ts && npm run example:build"
```

---

## 📋 Checklist Untuk Implementasi 63 Fungsi

**WORKFLOW SEBELUM MULAI IMPLEMENTASI:**
```bash
npm run build      # Build semua (Rust + TypeScript)
npm run test:all   # Verify semuanya berjalan
```

Setelah itu baru lanjut step-by-step di bawah.

### Phase 1: Redis Integration (Priority 🔴 CRITICAL)

- [ ] Build Rust binary
- [ ] Integrate `redis_pool_connect()` ke `RedisManager.ts`
- [ ] Implement cache key generation strategy
- [ ] Add Redis config parsing dari `tailwind.config.js`
- [ ] Setup connection pooling di startup
- [ ] Add fallback ke LRU jika Redis unavailable
- [ ] Test cache hit rate ≥ 75%
- [ ] Benchmark distributed cache performance

### Phase 2: Watch System (Priority 🔴 CRITICAL)

- [ ] Build Rust binary
- [ ] Integrate `start_watch()` ke `WatchManager.ts`
- [ ] Implement debouncing untuk rapid file changes
- [ ] Add plugin hook infrastructure
- [ ] Setup auto-recompile trigger
- [ ] Add .gitignore handling
- [ ] Measure file-change-to-recompile latency < 200ms
- [ ] Test error recovery

### Phase 3: ID Registry (Priority 🔴 CRITICAL)

- [ ] Integrate ID registry creation
- [ ] Generate stable component IDs saat compile
- [ ] Implement ID export/import untuk reproducible builds
- [ ] Use registry IDs dalam selector generation
- [ ] Add snapshot functionality untuk debugging
- [ ] Test ID consistency across multiple builds

### Phase 4: Theme Resolution (Priority 🟡 IMPORTANT)

- [ ] Integrate theme caching
- [ ] Implement cascade merging
- [ ] Add theme validation
- [ ] Setup theme lookup caching < 1ms
- [ ] Test dengan 1000+ theme tokens
- [ ] Benchmark performance

### Phase 5: Incremental Compilation (Priority 🟡 IMPORTANT)

- [ ] Implement file fingerprinting
- [ ] Setup incremental diff computation
- [ ] Add batch processing optimization
- [ ] Test incremental vs full recompile
- [ ] Measure 100-file change rebuild < 500ms
- [ ] Add streaming CSS output

### Phase 6: CSS Optimization (Priority 🟡 IMPORTANT)

- [ ] Implement dead code detection
- [ ] Add dead code elimination pipeline
- [ ] Integrate LightningCSS minification
- [ ] Add optimization reporting
- [ ] Test ~90% CSS reduction
- [ ] Verify deterministic output

### Phase 7: Atomic CSS (Priority 🟢 NICE-TO-HAVE)

- [ ] Implement atomic class parsing
- [ ] Add atomic CSS generation option
- [ ] Test property deduplication
- [ ] Benchmark vs Tailwind CSS output

### Phase 8: Analysis & Utilities (Priority 🟢 NICE-TO-HAVE)

- [ ] Component usage analytics
- [ ] Bundle impact calculations
- [ ] Memory stats collection
- [ ] Performance recommendations

---

## 📊 Summary Tabel

| Category | Total Fungsi | Di Wrapper | Integrated | Priority |
|----------|------|-----------|---------------|----------|
| Redis | 40 | 40 | 0% | 🔴 Critical |
| Watch | 20 | 15 | 0% | 🔴 Critical |
| ID Registry | 16 | 16 | 0% | 🔴 Critical |
| Theme Resolution | 7 | 7 | 20% | 🟡 Important |
| Incremental | 8 | 7 | 0% | 🟡 Important |
| Optimization | 6 | 10 | 0% | 🟡 Important |
| Cache Management | 12 | 11 | 30% | 🟡 Important |
| Analysis | 9 | 4 | 0% | 🟢 Nice-to-have |
| **TOTAL** | **118+** | **110+** | **5-10%** | — |

---

## 🎯 Rekomendasi Next Steps

**BEFORE CODING:** 
```bash
npm run build      # ONE COMMAND - builds everything
npm run test:all   # Verify all tests pass
```

**Then Pick a Phase:**

1. **Phase 1 (Week 1-2):** Focus Redis + Watch (critical path)
   - Integrate Redis ke `RedisManager.ts`
   - Integrate Watch ke `WatchManager.ts`

2. **Phase 2 (Week 3-4):** ID Registry + Theme Resolution
   - ID registry integration
   - Theme caching & cascade

3. **Phase 3 (Week 5+):** Incremental + Optimization + Analytics
   - File fingerprinting & incremental diffs
   - Dead code elimination
   - Component usage analytics

Lihat `.kiro/specs/use-all-63-rust-functions/` untuk acceptance criteria lengkap setiap fungsi.
