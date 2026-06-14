# Phase 8: Performance & Distribution - Implementation Tasks

**Spec ID:** p8-dist-spec-001  
**Workflow:** Design-First  
**Status:** 🚀 Ready for Implementation  
**Priority:** Critical - Foundation for Cluster Invalidation & Watcher Performance

---

## Task List

- [/] Phase 8.1: Redis Cache Expiration (TTL)
  - [x] 1.1 Modifikasi `RedisCacheAdapter::put` di `adapters.rs` agar meneruskan parameter TTL opsional ke pool.
  - [x] 1.2 Sesuaikan `RedisPool::set` di `redis_cache.rs` agar memproses parameter `ttl_seconds` secara dinamis dan menyimpannya.
  - [x] 1.3 Tulis unit test untuk verifikasi expiration TTL di Redis adapter.
  - [ ] 1.4 Pengujian TTL menggunakan server Redis lokal/nyata (non-mock).

- [/] Phase 8.2: Cluster & Node Sync Support
  - [x] 2.1 Implementasikan pembaruan topologi klaster aktif `sync_nodes` di `RedisPool`.
  - [x] 2.2 Hubungkan NAPI bridge function `redis_sync_nodes` dengan method `sync_nodes` di `RedisPool`.
  - [x] 2.3 Hubungkan NAPI bridge function `redis_enable_cluster` dengan `set_cluster_enabled` di `RedisPool`.
  - [ ] 2.4 Integrasikan library `redis-rs` nyata untuk clustering multi-node secara live.
  - [ ] 2.5 Tulis pengujian integrasi klasterisasi dan sinkronisasi node Redis di level multi-region.

- [/] Phase 8.3: Watcher Optimizations (<100ms P99)
  - [x] 3.1 Integrasikan debounce event di watcher system Rust/TypeScript (sebesar 20ms).
  - [x] 3.2 Implementasikan fast file-hashing check sebelum kompilasi ulang dipicu.
  - [x] 3.3 Verifikasi latensi auto-recompile melalui instrumentasi monitoring atau log waktu secara presisi di monorepo berskala besar.

- [/] Phase 8.4: Verifikasi & Test Suite Integrasi
  - [x] 4.1 Rebuild native module Rust (`npm run build:rust`).
  - [x] 4.2 Rebuild paket TypeScript (`npm run build:packages`).
  - [x] 4.3 Jalankan seluruh test suite (`npm run test:ci`) untuk memastikan 100% kelulusan (409+ tests).
  - [ ] 4.4 Siapkan real-time metrics visualization pada developer dashboard untuk memonitor latensi P99.
