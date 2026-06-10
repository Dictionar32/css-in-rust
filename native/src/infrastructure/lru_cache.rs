/// LRU Cache implementation for performance optimization
/// Phase 2 - Performance Layer
/// 
/// Used for caching:
/// - Parsed classes
/// - Resolved theme values
/// - Generated CSS rules
/// - Minified CSS output

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

/// Cache entry with access timestamp
#[derive(Clone, Debug)]
pub struct CacheEntry<V> {
    value: V,
    last_accessed: u64,
}

/// LRU Cache with configurable capacity
pub struct LruCache<K: Clone + Eq + std::hash::Hash, V: Clone> {
    data: Arc<Mutex<HashMap<K, CacheEntry<V>>>>,
    capacity: usize,
    timestamps: Arc<Mutex<u64>>,
}

impl<K: Clone + Eq + std::hash::Hash, V: Clone> LruCache<K, V> {
    /// Create new LRU cache with specified capacity
    pub fn new(capacity: usize) -> Self {
        Self {
            data: Arc::new(Mutex::new(HashMap::with_capacity(capacity))),
            capacity,
            timestamps: Arc::new(Mutex::new(0)),
        }
    }

    /// Get value from cache
    pub fn get(&self, key: &K) -> Option<V> {
        let mut data = self.data.lock().unwrap();
        let mut ts = self.timestamps.lock().unwrap();
        *ts += 1;

        if let Some(entry) = data.get_mut(key) {
            entry.last_accessed = *ts;
            return Some(entry.value.clone());
        }
        None
    }

    /// Put value into cache
    pub fn put(&self, key: K, value: V) {
        let mut data = self.data.lock().unwrap();
        let mut ts = self.timestamps.lock().unwrap();
        *ts += 1;

        if data.len() >= self.capacity {
            // Remove least recently used
            if let Some(lru_key) = data
                .iter()
                .min_by_key(|(_, entry)| entry.last_accessed)
                .map(|(k, _)| k.clone())
            {
                data.remove(&lru_key);
            }
        }

        data.insert(
            key,
            CacheEntry {
                value,
                last_accessed: *ts,
            },
        );
    }

    /// Clear cache
    pub fn clear(&self) {
        let mut data = self.data.lock().unwrap();
        data.clear();

        let mut ts = self.timestamps.lock().unwrap();
        *ts = 0;
    }

    /// Get cache size
    pub fn size(&self) -> usize {
        let data = self.data.lock().unwrap();
        data.len()
    }

    /// Get cache capacity
    pub fn capacity(&self) -> usize {
        self.capacity
    }

    /// Get hit/miss stats (approximate)
    pub fn stats(&self) -> CacheStats {
        let data = self.data.lock().unwrap();
        CacheStats {
            size: data.len(),
            capacity: self.capacity,
            entries: vec![], // Stats entries populated separately if needed
        }
    }
}

#[derive(Debug, Clone)]
pub struct CacheStats {
    pub size: usize,
    pub capacity: usize,
    pub entries: Vec<u64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lru_cache_basic() {
        let cache: LruCache<String, String> = LruCache::new(3);

        cache.put("a".to_string(), "value_a".to_string());
        cache.put("b".to_string(), "value_b".to_string());
        cache.put("c".to_string(), "value_c".to_string());

        assert_eq!(cache.get(&"a".to_string()), Some("value_a".to_string()));
        assert_eq!(cache.size(), 3);
    }

    #[test]
    fn test_lru_cache_eviction() {
        let cache: LruCache<i32, String> = LruCache::new(2);

        cache.put(1, "a".to_string());
        cache.put(2, "b".to_string());
        cache.put(3, "c".to_string()); // Evicts key 1

        assert_eq!(cache.get(&1), None); // Evicted
        assert_eq!(cache.get(&2), Some("b".to_string()));
        assert_eq!(cache.get(&3), Some("c".to_string()));
    }

    #[test]
    fn test_lru_cache_clear() {
        let cache: LruCache<String, i32> = LruCache::new(5);

        cache.put("key1".to_string(), 100);
        cache.put("key2".to_string(), 200);
        assert_eq!(cache.size(), 2);

        cache.clear();
        assert_eq!(cache.size(), 0);
        assert_eq!(cache.get(&"key1".to_string()), None);
    }

    #[test]
    fn test_lru_cache_access_order() {
        let cache: LruCache<i32, &str> = LruCache::new(3);

        cache.put(1, "a");
        cache.put(2, "b");
        cache.put(3, "c");

        // Access key 1 to make it recently used
        let _ = cache.get(&1);

        // Add new key, should evict key 2 (least recently used)
        cache.put(4, "d");

        assert_eq!(cache.get(&1), Some("a"));
        assert_eq!(cache.get(&2), None); // Evicted
        assert_eq!(cache.get(&3), Some("c"));
        assert_eq!(cache.get(&4), Some("d"));
    }
}
