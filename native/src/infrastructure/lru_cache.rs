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
use crate::infrastructure::cache_backend::{CacheBackend, CacheStats};

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
}

// PHASE 7.2: Implement CacheBackend trait for String-based LRU cache
impl CacheBackend for LruCache<String, String> {
    fn get(&self, key: &str) -> Option<String> {
        let result = {
            let mut data = self.data.lock().unwrap();
            let mut ts = self.timestamps.lock().unwrap();
            *ts += 1;

            if let Some(entry) = data.get_mut(key) {
                entry.last_accessed = *ts;
                Some(entry.value.clone())
            } else {
                None
            }
        };
        result
    }

    fn put(&self, key: String, value: String) {
        let mut data = self.data.lock().unwrap();
        let mut ts = self.timestamps.lock().unwrap();
        *ts += 1;

        if data.len() >= self.capacity && !data.contains_key(&key) {
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

    fn remove(&self, key: &str) -> bool {
        let mut data = self.data.lock().unwrap();
        data.remove(key).is_some()
    }

    fn clear(&self) {
        let mut data = self.data.lock().unwrap();
        data.clear();

        let mut ts = self.timestamps.lock().unwrap();
        *ts = 0;
    }

    fn stats(&self) -> CacheStats {
        let data = self.data.lock().unwrap();
        let size = data.len();
        
        crate::infrastructure::cache_backend::CacheStats {
            hits: 0,
            misses: 0,
            current_size: size as u64,
            capacity: self.capacity as u64,
            evictions: 0,
            hit_rate: 0.0,
        }
    }

    fn capacity(&self) -> usize {
        self.capacity
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ===== Generic LRU Cache Tests =====
    
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

    // ===== CacheBackend Trait Tests (PHASE 7.2) =====
    
    #[test]
    fn test_cache_backend_get_put_consistency() {
        // Property: Cache consistency - get after put returns same value
        let cache: LruCache<String, String> = LruCache::new(10);
        
        // Implement CacheBackend
        let backend: &dyn CacheBackend = &cache;
        
        backend.put("key1".to_string(), "value1".to_string());
        assert_eq!(backend.get("key1"), Some("value1".to_string()));
        
        backend.put("key2".to_string(), "value2".to_string());
        assert_eq!(backend.get("key2"), Some("value2".to_string()));
        
        // Verify other keys unchanged
        assert_eq!(backend.get("key1"), Some("value1".to_string()));
    }

    #[test]
    fn test_cache_backend_remove() {
        let cache: LruCache<String, String> = LruCache::new(10);
        let backend: &dyn CacheBackend = &cache;
        
        backend.put("key1".to_string(), "value1".to_string());
        assert_eq!(backend.get("key1"), Some("value1".to_string()));
        
        let removed = backend.remove("key1");
        assert_eq!(removed, true);
        assert_eq!(backend.get("key1"), None);
        
        // Remove non-existent key
        let removed = backend.remove("nonexistent");
        assert_eq!(removed, false);
    }

    #[test]
    fn test_cache_backend_clear() {
        let cache: LruCache<String, String> = LruCache::new(10);
        let backend: &dyn CacheBackend = &cache;
        
        backend.put("key1".to_string(), "value1".to_string());
        backend.put("key2".to_string(), "value2".to_string());
        backend.put("key3".to_string(), "value3".to_string());
        
        assert_eq!(backend.get("key1"), Some("value1".to_string()));
        assert_eq!(backend.get("key2"), Some("value2".to_string()));
        assert_eq!(backend.get("key3"), Some("value3".to_string()));
        
        backend.clear();
        
        assert_eq!(backend.get("key1"), None);
        assert_eq!(backend.get("key2"), None);
        assert_eq!(backend.get("key3"), None);
    }

    #[test]
    fn test_cache_backend_contains() {
        let cache: LruCache<String, String> = LruCache::new(10);
        let backend: &dyn CacheBackend = &cache;
        
        backend.put("key1".to_string(), "value1".to_string());
        
        assert_eq!(backend.contains("key1"), true);
        assert_eq!(backend.contains("key2"), false);
        
        backend.remove("key1");
        assert_eq!(backend.contains("key1"), false);
    }

    #[test]
    fn test_cache_backend_stats() {
        let cache: LruCache<String, String> = LruCache::new(10);
        let backend: &dyn CacheBackend = &cache;
        
        backend.put("key1".to_string(), "value1".to_string());
        backend.put("key2".to_string(), "value2".to_string());
        
        let stats = backend.stats();
        assert_eq!(stats.current_size, 2);
        assert_eq!(stats.capacity, 10);
        assert_eq!(stats.hits, 0);
        assert_eq!(stats.misses, 0);
    }

    #[test]
    fn test_cache_backend_capacity() {
        let cache: LruCache<String, String> = LruCache::new(50);
        let backend: &dyn CacheBackend = &cache;
        
        assert_eq!(backend.capacity(), 50);
    }

    #[test]
    fn test_cache_backend_size() {
        let cache: LruCache<String, String> = LruCache::new(10);
        let backend: &dyn CacheBackend = &cache;
        
        assert_eq!(backend.size(), 0);
        
        backend.put("key1".to_string(), "value1".to_string());
        assert_eq!(backend.size(), 1);
        
        backend.put("key2".to_string(), "value2".to_string());
        assert_eq!(backend.size(), 2);
        
        backend.remove("key1");
        assert_eq!(backend.size(), 1);
    }

    #[test]
    fn test_cache_backend_is_full() {
        let cache: LruCache<String, String> = LruCache::new(2);
        let backend: &dyn CacheBackend = &cache;
        
        assert_eq!(backend.is_full(), false);
        
        backend.put("key1".to_string(), "value1".to_string());
        assert_eq!(backend.is_full(), false);
        
        backend.put("key2".to_string(), "value2".to_string());
        assert_eq!(backend.is_full(), true);
    }

    #[test]
    fn test_cache_backend_eviction_behavior() {
        // Property: Cache eviction preserves recent items
        let cache: LruCache<String, String> = LruCache::new(3);
        let backend: &dyn CacheBackend = &cache;
        
        // Fill cache
        backend.put("key1".to_string(), "value1".to_string());
        backend.put("key2".to_string(), "value2".to_string());
        backend.put("key3".to_string(), "value3".to_string());
        
        // Access key1 to mark it as recently used
        let _ = backend.get("key1");
        
        // Add new key - should evict key2 (least recently used)
        backend.put("key4".to_string(), "value4".to_string());
        
        // Verify recent items still exist
        assert_eq!(backend.get("key1"), Some("value1".to_string()));
        assert_eq!(backend.get("key2"), None); // Should be evicted
        assert_eq!(backend.get("key3"), Some("value3".to_string()));
        assert_eq!(backend.get("key4"), Some("value4".to_string()));
    }

    #[test]
    fn test_cache_backend_multiple_operations() {
        // Test complex sequence of operations
        let cache: LruCache<String, String> = LruCache::new(5);
        let backend: &dyn CacheBackend = &cache;
        
        // Add items
        for i in 1..=5 {
            backend.put(format!("key{}", i), format!("value{}", i));
        }
        
        // All items present
        assert_eq!(backend.size(), 5);
        
        // Remove some items
        backend.remove("key2");
        backend.remove("key4");
        assert_eq!(backend.size(), 3);
        
        // Add new items (should not evict due to space)
        backend.put("key6".to_string(), "value6".to_string());
        backend.put("key7".to_string(), "value7".to_string());
        assert_eq!(backend.size(), 5);
        
        // Verify correct items
        assert_eq!(backend.get("key2"), None);
        assert_eq!(backend.get("key4"), None);
        assert_eq!(backend.get("key1"), Some("value1".to_string()));
        assert_eq!(backend.get("key6"), Some("value6".to_string()));
    }

    #[test]
    fn test_cache_backend_update_value() {
        // Test updating existing value
        let cache: LruCache<String, String> = LruCache::new(10);
        let backend: &dyn CacheBackend = &cache;
        
        backend.put("key1".to_string(), "old_value".to_string());
        assert_eq!(backend.get("key1"), Some("old_value".to_string()));
        
        // Update with new value
        backend.put("key1".to_string(), "new_value".to_string());
        assert_eq!(backend.get("key1"), Some("new_value".to_string()));
        
        // Size should not increase (replacement, not addition)
        assert_eq!(backend.size(), 1);
    }

    #[test]
    fn test_cache_backend_hit_rate_empty() {
        let cache: LruCache<String, String> = LruCache::new(10);
        let backend: &dyn CacheBackend = &cache;
        
        // Empty cache should have 0% hit rate
        assert_eq!(backend.hit_rate(), 0.0);
    }
}
