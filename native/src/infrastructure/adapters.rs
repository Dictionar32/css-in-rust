/// PHASE 7.2: Cache Backend Adapters
/// Implements CacheBackend trait for various cache implementations

use crate::infrastructure::cache_backend::{CacheBackend, CacheStats};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// ========== REDIS CACHE ADAPTER ==========
/// Wraps RedisPool to implement CacheBackend trait
pub struct RedisCacheAdapter {
    pool: Arc<Mutex<crate::infrastructure::redis_cache::RedisPool>>,
    stats: Arc<Mutex<CacheStats>>,
    ttl_seconds: Option<u64>,
}

impl RedisCacheAdapter {
    pub fn new(pool: Arc<Mutex<crate::infrastructure::redis_cache::RedisPool>>) -> Self {
        Self::new_with_ttl(pool, None)
    }

    pub fn new_with_ttl(
        pool: Arc<Mutex<crate::infrastructure::redis_cache::RedisPool>>,
        ttl_seconds: Option<u64>,
    ) -> Self {
        Self {
            pool,
            stats: Arc::new(Mutex::new(CacheStats {
                hits: 0,
                misses: 0,
                current_size: 0,
                capacity: 10000,
                evictions: 0,
                hit_rate: 0.0,
            })),
            ttl_seconds,
        }
    }
}

impl CacheBackend for RedisCacheAdapter {
    fn get(&self, key: &str) -> Option<String> {
        if let Ok(pool) = self.pool.lock() {
            let result = pool.get(key);
            if result.success && result.value.is_some() {
                if let Ok(mut stats) = self.stats.lock() {
                    stats.hits += 1;
                    stats.hit_rate = CacheStats::calculate_hit_rate(stats.hits, stats.misses);
                }
                return result.value;
            }
        }
        if let Ok(mut stats) = self.stats.lock() {
            stats.misses += 1;
            stats.hit_rate = CacheStats::calculate_hit_rate(stats.hits, stats.misses);
        }
        None
    }

    fn put(&self, key: String, value: String) {
        if let Ok(mut pool) = self.pool.lock() {
            let result = pool.set(&key, &value, self.ttl_seconds);
            if result.success {
                if let Ok(mut stats) = self.stats.lock() {
                    stats.current_size += 1;
                }
            }
        }
    }

    fn remove(&self, key: &str) -> bool {
        if let Ok(mut pool) = self.pool.lock() {
            let result = pool.delete(key);
            if result.success {
                if let Ok(mut stats) = self.stats.lock() {
                    stats.current_size = stats.current_size.saturating_sub(1);
                }
                return true;
            }
        }
        false
    }

    fn clear(&self) {
        if let Ok(mut pool) = self.pool.lock() {
            let _ = pool.flush_db();
            if let Ok(mut stats) = self.stats.lock() {
                stats.current_size = 0;
                stats.hits = 0;
                stats.misses = 0;
            }
        }
    }

    fn stats(&self) -> CacheStats {
        self.stats.lock().unwrap().clone()
    }

    fn capacity(&self) -> usize {
        self.stats.lock().unwrap().capacity as usize
    }
}

/// ========== PERSISTENT CACHE ADAPTER ==========
/// File-based cache that persists between sessions
pub struct PersistentCacheAdapter {
    path: String,
    cache: Arc<Mutex<HashMap<String, String>>>,
    stats: Arc<Mutex<CacheStats>>,
    capacity: usize,
}

impl PersistentCacheAdapter {
    pub fn new(path: String, capacity: usize) -> Self {
        let cache = Arc::new(Mutex::new(HashMap::new()));
        
        // Try to load from disk if file exists
        if std::path::Path::new(&path).exists() {
            if let Ok(content) = std::fs::read_to_string(&path) {
                if let Ok(loaded_cache) = serde_json::from_str::<HashMap<String, String>>(&content) {
                    if let Ok(mut c) = cache.lock() {
                        *c = loaded_cache;
                    }
                }
            }
        }

        Self {
            path,
            cache,
            stats: Arc::new(Mutex::new(CacheStats {
                hits: 0,
                misses: 0,
                current_size: 0,
                capacity: capacity as u64,
                evictions: 0,
                hit_rate: 0.0,
            })),
            capacity,
        }
    }

    fn save_to_disk(&self) {
        if let Ok(cache) = self.cache.lock() {
            if let Ok(json) = serde_json::to_string(&*cache) {
                let _ = std::fs::write(&self.path, json);
            }
        }
    }
}

impl CacheBackend for PersistentCacheAdapter {
    fn get(&self, key: &str) -> Option<String> {
        if let Ok(cache) = self.cache.lock() {
            if let Some(value) = cache.get(key) {
                if let Ok(mut stats) = self.stats.lock() {
                    stats.hits += 1;
                    stats.hit_rate = CacheStats::calculate_hit_rate(stats.hits, stats.misses);
                }
                return Some(value.clone());
            }
        }
        if let Ok(mut stats) = self.stats.lock() {
            stats.misses += 1;
            stats.hit_rate = CacheStats::calculate_hit_rate(stats.hits, stats.misses);
        }
        None
    }

    fn put(&self, key: String, value: String) {
        if let Ok(mut cache) = self.cache.lock() {
            if cache.len() >= self.capacity {
                // Remove first item if at capacity
                if let Some(first_key) = cache.keys().next().cloned() {
                    cache.remove(&first_key);
                    if let Ok(mut stats) = self.stats.lock() {
                        stats.evictions += 1;
                    }
                }
            }
            cache.insert(key, value);
            if let Ok(mut stats) = self.stats.lock() {
                stats.current_size = cache.len() as u64;
            }
        }
        self.save_to_disk();
    }

    fn remove(&self, key: &str) -> bool {
        let removed = if let Ok(mut cache) = self.cache.lock() {
            cache.remove(key).is_some()
        } else {
            false
        };

        if removed {
            if let Ok(mut stats) = self.stats.lock() {
                stats.current_size = stats.current_size.saturating_sub(1);
            }
            self.save_to_disk();
        }
        removed
    }

    fn clear(&self) {
        if let Ok(mut cache) = self.cache.lock() {
            cache.clear();
            if let Ok(mut stats) = self.stats.lock() {
                stats.current_size = 0;
                stats.hits = 0;
                stats.misses = 0;
            }
        }
        self.save_to_disk();
    }

    fn stats(&self) -> CacheStats {
        self.stats.lock().unwrap().clone()
    }

    fn capacity(&self) -> usize {
        self.capacity
    }
}

/// ========== ADAPTIVE CACHE ADAPTER ==========
/// Dynamically switches backend based on hit rate and performance
pub struct AdaptiveCacheAdapter {
    primary: Arc<Mutex<Box<dyn CacheBackend>>>,
    stats: Arc<Mutex<CacheStats>>,
    switch_threshold: f64, // Switch backends when hit_rate crosses this
}

impl AdaptiveCacheAdapter {
    pub fn new(initial_backend: Box<dyn CacheBackend>) -> Self {
        Self {
            primary: Arc::new(Mutex::new(initial_backend)),
            stats: Arc::new(Mutex::new(CacheStats {
                hits: 0,
                misses: 0,
                current_size: 0,
                capacity: 5000,
                evictions: 0,
                hit_rate: 0.0,
            })),
            switch_threshold: 0.7, // 70% hit rate threshold
        }
    }

    /// Update stats and return whether backend should be optimized
    fn check_optimization(&self) -> bool {
        if let Ok(stats) = self.stats.lock() {
            // If hit rate is too low, consider backend optimization
            stats.hit_rate < self.switch_threshold && (stats.hits + stats.misses) > 100
        } else {
            false
        }
    }
}

impl CacheBackend for AdaptiveCacheAdapter {
    fn get(&self, key: &str) -> Option<String> {
        let result = if let Ok(backend) = self.primary.lock() {
            backend.get(key)
        } else {
            None
        };

        if let Ok(mut stats) = self.stats.lock() {
            if result.is_some() {
                stats.hits += 1;
            } else {
                stats.misses += 1;
            }
            stats.hit_rate = CacheStats::calculate_hit_rate(stats.hits, stats.misses);
        }

        result
    }

    fn put(&self, key: String, value: String) {
        if let Ok(backend) = self.primary.lock() {
            backend.put(key, value);
        }
        self.check_optimization();
    }

    fn remove(&self, key: &str) -> bool {
        if let Ok(backend) = self.primary.lock() {
            backend.remove(key)
        } else {
            false
        }
    }

    fn clear(&self) {
        if let Ok(backend) = self.primary.lock() {
            backend.clear();
        }
        if let Ok(mut stats) = self.stats.lock() {
            stats.current_size = 0;
            stats.hits = 0;
            stats.misses = 0;
        }
    }

    fn stats(&self) -> CacheStats {
        self.stats.lock().unwrap().clone()
    }

    fn capacity(&self) -> usize {
        if let Ok(backend) = self.primary.lock() {
            backend.capacity()
        } else {
            5000
        }
    }
}

/// ========== LAZY CACHE ADAPTER ==========
/// Wraps LazyCache to implement CacheBackend trait
pub struct LazyCacheAdapter {
    cache: Arc<Mutex<HashMap<String, String>>>,
    stats: Arc<Mutex<CacheStats>>,
}

impl LazyCacheAdapter {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            stats: Arc::new(Mutex::new(CacheStats {
                hits: 0,
                misses: 0,
                current_size: 0,
                capacity: 1000,
                evictions: 0,
                hit_rate: 0.0,
            })),
        }
    }
}

impl CacheBackend for LazyCacheAdapter {
    fn get(&self, key: &str) -> Option<String> {
        if let Ok(cache) = self.cache.lock() {
            if let Some(value) = cache.get(key) {
                if let Ok(mut stats) = self.stats.lock() {
                    stats.hits += 1;
                    stats.hit_rate = CacheStats::calculate_hit_rate(stats.hits, stats.misses);
                }
                return Some(value.clone());
            }
        }
        if let Ok(mut stats) = self.stats.lock() {
            stats.misses += 1;
            stats.hit_rate = CacheStats::calculate_hit_rate(stats.hits, stats.misses);
        }
        None
    }

    fn put(&self, key: String, value: String) {
        if let Ok(mut cache) = self.cache.lock() {
            cache.insert(key, value);
            if let Ok(mut stats) = self.stats.lock() {
                stats.current_size = cache.len() as u64;
            }
        }
    }

    fn remove(&self, key: &str) -> bool {
        if let Ok(mut cache) = self.cache.lock() {
            cache.remove(key).is_some()
        } else {
            false
        }
    }

    fn clear(&self) {
        if let Ok(mut cache) = self.cache.lock() {
            cache.clear();
            if let Ok(mut stats) = self.stats.lock() {
                stats.current_size = 0;
            }
        }
    }

    fn stats(&self) -> CacheStats {
        self.stats.lock().unwrap().clone()
    }

    fn capacity(&self) -> usize {
        1000
    }
}
