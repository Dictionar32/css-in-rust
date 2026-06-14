# Design Document

## Phase 8: Performance & Distribution

**Version:** 1.0  
**Status:** 📋 DRAFT  
**Last Updated:** 2026-06-14  

---

## Architecture Overview

Arsitektur Phase 8 didesain untuk memperluas kapabilitas modular yang dibangun pada Phase 7 dengan fokus pada **skalabilitas terdistribusi** dan **latensi ultra-rendah**.

```
  ┌───────────────────────────────────────────────────────────┐
  │                   TypeScript Developer App                │
  └─────────────────────────────┬─────────────────────────────┘
                                │ Watcher Events (<100ms)
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │                 Native Watcher & Compiler                 │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │                    Cache Abstraction Layer                │
  │                     (AdaptiveCacheAdapter)                │
  └──────────────┬──────────────────────────────┬─────────────┘
                 │ (Cache Miss / Sync)          │ (Cache Hit)
                 ▼                              ▼
  ┌──────────────────────────────┐    ┌───────────────────────┐
  │      RedisCacheAdapter       │    │    LruCacheAdapter    │
  │     (Clustered & TTL)        │    │    (In-Memory Local)  │
  └──────────────┬───────────────┘    └───────────────────────┘
                 │
                 ├──────────────────────────────┐
                 ▼                              ▼
  ┌──────────────────────────────┐    ┌───────────────────────┐
  │     Redis Primary Node       │    │   Redis Replica Node  │
  │          (Region A)          │    │       (Region B)      │
  └──────────────────────────────┘    └───────────────────────┘
```

---

## Component Design

### 1. Redis Cache Adapter (Clustered & Expiration Support)

`RedisCacheAdapter` akan disempurnakan untuk mendukung expiration key-value secara native dan fungsionalitas clustering:
- **TTL (Time to Live)**: Saat menyimpan pasangan key-value melalui `put`, adapter akan meneruskan argumen TTL opsional ke driver Redis. Hal ini mencegah memory leak di sisi Redis cluster.
- **Clustering**: Saat cluster diaktifkan via `redis_enable_cluster`, adapter akan mendistribusikan request ke pool koneksi yang terhubung ke klaster Redis yang terfragmentasi (sharded).
- **Node Synchronization**: Mekanisme `sync_nodes` melakukan query topologi klaster (`CLUSTER NODES`) untuk memperbarui daftar koneksi aktif secara dinamis jika ada failover atau penambahan node baru.

### 2. Multi-Region Replication & Live Invalidation

Untuk memastikan konsistensi cache di berbagai region:
- **Pub/Sub Channel**: Setiap instance compiler mendengarkan channel invalidasi cache Redis (misalnya `tailwind:cache:invalidate`).
- **Live Invalidation**: Saat salah satu instance melakukan pembaruan tema atau pembersihan cache (`clear`), ia mempublikasikan event invalidasi ke channel tersebut. Instance di region lain yang berlangganan channel ini akan segera menghapus atau memperbarui cache LRU lokal mereka secara live.

### 3. High-Performance File Watcher

Optimasi file watcher difokuskan pada pemangkasan waktu overhead:
- **File Content Hashing**: Menggunakan algoritma hash non-kriptografis cepat (misal `ahash` atau `fnv`) untuk mengecek apakah konten berkas benar-benar berubah sebelum memicu proses compile ulang.
- **Debounce Mechanism**: Menerapkan debounce delay (misalnya 20ms) pada level file event listener untuk menggabungkan event perubahan berkas yang terjadi berurutan dengan cepat.
- **Incremental Ast Build**: Hanya men-scan ulang AST berkas yang terdeteksi berubah daripada mem-parsing ulang seluruh workspace monorepo.

---

## Key Interfaces & Rust APIs

### Redis Connection Pool Update

```rust
// Tambahan atau perubahan pada RedisPool di redis_cache.rs
impl RedisPool {
    // Memperbarui topologi klaster secara aktif
    pub fn sync_nodes(&mut self) -> Result<(), String> {
        // Query topo klaster dan update vector self.connections
        Ok(())
    }

    // Mengaktifkan cluster mode secara dinamis
    pub fn set_cluster_enabled(&mut self, enabled: bool) {
        self.config.cluster_enabled = enabled;
    }
}
```

### Redis Cache Adapter Expiration Integration

```rust
impl CacheBackend for RedisCacheAdapter {
    fn put(&self, key: String, value: String) {
        if let Ok(mut pool) = self.pool.lock() {
            // Meneruskan default_ttl_seconds jika tidak dispesifikasikan
            let result = pool.set(&key, &value, Some(self.stats.lock().unwrap().capacity));
            if result.success {
                if let Ok(mut stats) = self.stats.lock() {
                    stats.current_size += 1;
                }
            }
        }
    }
}
```
