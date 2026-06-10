/// Lazy evaluation cache - compute values only when accessed
/// Reduces memory usage by deferring expensive computations

use std::sync::{Arc, Mutex};
use std::collections::HashMap;

pub struct LazyCache<K: Clone + Eq + std::hash::Hash, V: Clone> {
    cache: Arc<Mutex<HashMap<K, Option<V>>>>,
}

impl<K: Clone + Eq + std::hash::Hash, V: Clone> LazyCache<K, V> {
    pub fn new() -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn get_or_compute<F>(&self, key: K, compute: F) -> V
    where
        F: FnOnce() -> V,
    {
        let mut cache = self.cache.lock().unwrap();
        
        if let Some(Some(value)) = cache.get(&key) {
            return value.clone();
        }

        let value = compute();
        cache.insert(key, Some(value.clone()));
        value
    }

    pub fn clear(&self) {
        let mut cache = self.cache.lock().unwrap();
        cache.clear();
    }

    pub fn size(&self) -> usize {
        let cache = self.cache.lock().unwrap();
        cache.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    #[test]
    fn test_lazy_cache_computation() {
        let cache: LazyCache<String, i32> = LazyCache::new();
        let compute_count = AtomicU32::new(0);

        // First access: computes
        let result1 = cache.get_or_compute("key1".to_string(), || {
            compute_count.fetch_add(1, Ordering::SeqCst);
            42
        });
        assert_eq!(result1, 42);
        assert_eq!(compute_count.load(Ordering::SeqCst), 1);

        // Second access: uses cached value
        let result2 = cache.get_or_compute("key1".to_string(), || {
            compute_count.fetch_add(1, Ordering::SeqCst);
            100 // Should not be returned
        });
        assert_eq!(result2, 42);
        assert_eq!(compute_count.load(Ordering::SeqCst), 1); // Count unchanged
    }

    #[test]
    fn test_lazy_cache_different_keys() {
        let cache: LazyCache<String, String> = LazyCache::new();
        
        let v1 = cache.get_or_compute("a".to_string(), || "value-a".to_string());
        let v2 = cache.get_or_compute("b".to_string(), || "value-b".to_string());
        
        assert_eq!(v1, "value-a");
        assert_eq!(v2, "value-b");
        assert_eq!(cache.size(), 2);
    }

    #[test]
    fn test_lazy_cache_clear() {
        let cache: LazyCache<i32, String> = LazyCache::new();
        
        cache.get_or_compute(1, || "one".to_string());
        cache.get_or_compute(2, || "two".to_string());
        assert_eq!(cache.size(), 2);
        
        cache.clear();
        assert_eq!(cache.size(), 0);
    }
}
