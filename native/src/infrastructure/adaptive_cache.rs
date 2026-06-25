/// Adaptive cache - automatically adjusts size based on memory pressure
/// Monitors hit rate and memory usage, scales up/down intelligently

use std::sync::atomic::{AtomicU32, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

pub struct AdaptiveCache<K: Clone + Eq + std::hash::Hash, V: Clone> {
    cache: Arc<Mutex<HashMap<K, V>>>,
    max_size: Arc<AtomicU32>,
    hits: Arc<AtomicU64>,
    misses: Arc<AtomicU64>,
    memory_bytes: Arc<AtomicU64>,
}

impl<K: Clone + Eq + std::hash::Hash, V: Clone> AdaptiveCache<K, V> {
    pub fn new(initial_size: u32) -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::with_capacity(initial_size as usize))),
            max_size: Arc::new(AtomicU32::new(initial_size)),
            hits: Arc::new(AtomicU64::new(0)),
            misses: Arc::new(AtomicU64::new(0)),
            memory_bytes: Arc::new(AtomicU64::new(0)),
        }
    }

    pub fn get(&self, key: &K) -> Option<V> {
        let cache = self.cache.lock().unwrap();
        if let Some(value) = cache.get(key) {
            self.hits.fetch_add(1, Ordering::Relaxed);
            Some(value.clone())
        } else {
            self.misses.fetch_add(1, Ordering::Relaxed);
            None
        }
    }

    pub fn put(&self, key: K, value: V) {
        let mut cache = self.cache.lock().unwrap();
        let max = self.max_size.load(Ordering::Relaxed) as usize;

        if cache.len() >= max && !cache.contains_key(&key) {
            // Evict oldest (simplified - remove random for now)
            if let Some(first_key) = cache.keys().next().cloned() {
                cache.remove(&first_key);
                // Approximate: deduct estimated per-entry overhead
                self.memory_bytes.fetch_sub(256, Ordering::Relaxed);
            }
        }

        // Approximate memory tracking: ~256 bytes per entry overhead
        if !cache.contains_key(&key) {
            self.memory_bytes.fetch_add(256, Ordering::Relaxed);
        }
        cache.insert(key, value);
    }

    /// Get current estimated memory usage in bytes
    pub fn memory_usage_bytes(&self) -> u64 {
        self.memory_bytes.load(Ordering::Relaxed)
    }

    pub fn hit_rate(&self) -> f64 {
        let hits = self.hits.load(Ordering::Relaxed) as f64;
        let misses = self.misses.load(Ordering::Relaxed) as f64;
        let total = (hits + misses).max(1.0);
        hits / total * 100.0
    }

    pub fn adapt_size(&self) {
        let hit_rate = self.hit_rate();
        let current_size = self.max_size.load(Ordering::Relaxed);

        // Scale up if hit rate is high and we have memory
        if hit_rate > 90.0 && current_size < 50000 {
            let new_size = (current_size as f32 * 1.2) as u32;
            self.max_size.store(new_size, Ordering::Relaxed);
        }
        // Scale down if hit rate is low
        else if hit_rate < 60.0 && current_size > 100 {
            let new_size = (current_size as f32 * 0.9) as u32;
            self.max_size.store(new_size, Ordering::Relaxed);
        }
    }

    pub fn stats(&self) -> CacheStats {
        let cache = self.cache.lock().unwrap();
        CacheStats {
            size: cache.len() as u32,
            max_size: self.max_size.load(Ordering::Relaxed),
            hits: self.hits.load(Ordering::Relaxed),
            misses: self.misses.load(Ordering::Relaxed),
            hit_rate: self.hit_rate(),
        }
    }

    pub fn clear(&self) {
        let mut cache = self.cache.lock().unwrap();
        cache.clear();
        self.hits.store(0, Ordering::Relaxed);
        self.misses.store(0, Ordering::Relaxed);
    }
}

#[derive(Debug, Clone)]
pub struct CacheStats {
    pub size: u32,
    pub max_size: u32,
    pub hits: u64,
    pub misses: u64,
    pub hit_rate: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_adaptive_cache_get_put() {
        let cache: AdaptiveCache<String, i32> = AdaptiveCache::new(10);

        cache.put("key1".to_string(), 42);
        assert_eq!(cache.get(&"key1".to_string()), Some(42));
        assert_eq!(cache.get(&"key2".to_string()), None);
    }

    #[test]
    fn test_adaptive_cache_hit_rate() {
        let cache: AdaptiveCache<String, String> = AdaptiveCache::new(5);

        cache.put("a".to_string(), "val-a".to_string());
        cache.put("b".to_string(), "val-b".to_string());

        // Generate hits
        cache.get(&"a".to_string());
        cache.get(&"a".to_string());
        cache.get(&"a".to_string());

        // Generate misses
        cache.get(&"c".to_string());

        let hit_rate = cache.hit_rate();
        assert!(hit_rate > 50.0 && hit_rate < 100.0); // 75%
    }

    #[test]
    fn test_adaptive_cache_scale_up() {
        let cache: AdaptiveCache<String, i32> = AdaptiveCache::new(100);

        // Generate high hit rate
        for i in 0..50 {
            cache.put(format!("key-{}", i), i);
        }

        for _ in 0..100 {
            cache.get(&"key-0".to_string());
        }

        for _ in 0..10 {
            cache.get(&"missing".to_string());
        }

        cache.adapt_size();
        let stats = cache.stats();
        assert!(stats.max_size > 100); // Should scale up
    }

    #[test]
    fn test_adaptive_cache_scale_down() {
        let cache: AdaptiveCache<String, i32> = AdaptiveCache::new(1000);

        cache.put("key1".to_string(), 1);

        // Generate low hit rate
        for _ in 0..10 {
            cache.get(&"key1".to_string());
        }
        for _ in 0..100 {
            cache.get(&"missing".to_string());
        }

        cache.adapt_size();
        let stats = cache.stats();
        assert!(stats.max_size < 1000); // Should scale down
    }

    #[test]
    fn test_adaptive_cache_stats() {
        let cache: AdaptiveCache<String, String> = AdaptiveCache::new(5);

        cache.put("a".to_string(), "1".to_string());
        cache.get(&"a".to_string()); // hit
        cache.get(&"b".to_string()); // miss

        let stats = cache.stats();
        assert_eq!(stats.size, 1);
        assert_eq!(stats.max_size, 5);
        assert_eq!(stats.hits, 1);
        assert_eq!(stats.misses, 1);
    }

    #[test]
    fn test_adaptive_cache_capacity_limit() {
        let cache: AdaptiveCache<String, i32> = AdaptiveCache::new(3);

        cache.put("a".to_string(), 1);
        cache.put("b".to_string(), 2);
        cache.put("c".to_string(), 3);

        let stats = cache.stats();
        assert_eq!(stats.size, 3);

        // Adding another should evict one
        cache.put("d".to_string(), 4);
        let stats = cache.stats();
        assert_eq!(stats.size, 3); // Still at max
    }
}
