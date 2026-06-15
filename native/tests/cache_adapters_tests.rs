//! PHASE 7.2: Comprehensive Cache Adapter Tests
//! Tests for Redis, Persistent, Adaptive, and Lazy cache adapters

#[cfg(test)]
mod redis_adapter_tests {
    use tailwind_styled_parser::infrastructure::adapters::RedisCacheAdapter;
    use tailwind_styled_parser::infrastructure::cache_backend::CacheBackend;
    use std::sync::Arc;
    use std::sync::Mutex;

    #[test]
    fn test_redis_adapter_put_get() {
        // Create mock Redis pool
        let mut config = tailwind_styled_parser::infrastructure::redis_cache::RedisCacheConfig::default();
        config.db = 1;
        let pool = Arc::new(Mutex::new(
            tailwind_styled_parser::infrastructure::redis_cache::RedisPool::new(config).unwrap()
        ));
        
        let adapter = RedisCacheAdapter::new(pool);
        
        // Test put and get
        adapter.put("key1".to_string(), "value1".to_string());
        let result = adapter.get("key1");
        
        // RedisPool fallback returns the actual value stored
        assert!(result.is_some());
        assert_eq!(result, Some("value1".to_string()));
    }

    #[test]
    fn test_redis_adapter_remove() {
        let mut config = tailwind_styled_parser::infrastructure::redis_cache::RedisCacheConfig::default();
        config.db = 2;
        let pool = Arc::new(Mutex::new(
            tailwind_styled_parser::infrastructure::redis_cache::RedisPool::new(config).unwrap()
        ));
        
        let adapter = RedisCacheAdapter::new(pool);
        adapter.put("key1".to_string(), "value1".to_string());
        
        let removed = adapter.remove("key1");
        assert!(removed);
    }

    #[test]
    fn test_redis_adapter_stats() {
        let mut config = tailwind_styled_parser::infrastructure::redis_cache::RedisCacheConfig::default();
        config.db = 3;
        let pool = Arc::new(Mutex::new(
            tailwind_styled_parser::infrastructure::redis_cache::RedisPool::new(config).unwrap()
        ));
        
        let adapter = RedisCacheAdapter::new(pool);
        
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.get("key1"); // Will hit (returns value-key1)
        
        let stats = adapter.stats();
        assert_eq!(stats.capacity, 10000);
        assert!(stats.hits >= 1); // Should have at least 1 hit
    }

    #[test]
    fn test_redis_adapter_clear() {
        let mut config = tailwind_styled_parser::infrastructure::redis_cache::RedisCacheConfig::default();
        config.db = 4;
        let pool = Arc::new(Mutex::new(
            tailwind_styled_parser::infrastructure::redis_cache::RedisPool::new(config).unwrap()
        ));
        
        let adapter = RedisCacheAdapter::new(pool);
        
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.put("key2".to_string(), "value2".to_string());
        adapter.clear();
        
        let stats = adapter.stats();
        assert_eq!(stats.current_size, 0);
    }
}

#[cfg(test)]
mod persistent_adapter_tests {
    use tailwind_styled_parser::infrastructure::adapters::PersistentCacheAdapter;
    use tailwind_styled_parser::infrastructure::cache_backend::CacheBackend;
    use std::fs;
    use std::path::Path;

    fn cleanup_test_file(path: &str) {
        if Path::new(path).exists() {
            let _ = fs::remove_file(path);
        }
    }

    #[test]
    fn test_persistent_adapter_basic_operations() {
        let path = "./test_cache_basic.json";
        cleanup_test_file(path);
        
        let adapter = PersistentCacheAdapter::new(path.to_string(), 100);
        
        adapter.put("key1".to_string(), "value1".to_string());
        let result = adapter.get("key1");
        assert_eq!(result, Some("value1".to_string()));
        
        cleanup_test_file(path);
    }

    #[test]
    fn test_persistent_adapter_persistence() {
        let path = "./test_cache_persist.json";
        cleanup_test_file(path);
        
        {
            let adapter = PersistentCacheAdapter::new(path.to_string(), 100);
            adapter.put("key1".to_string(), "value1".to_string());
            adapter.put("key2".to_string(), "value2".to_string());
            // Adapter dropped, saves to disk
        }
        
        // Create new adapter instance, should load from disk
        let adapter2 = PersistentCacheAdapter::new(path.to_string(), 100);
        let result1 = adapter2.get("key1");
        let result2 = adapter2.get("key2");
        
        assert_eq!(result1, Some("value1".to_string()));
        assert_eq!(result2, Some("value2".to_string()));
        
        cleanup_test_file(path);
    }

    #[test]
    fn test_persistent_adapter_eviction() {
        let path = "./test_cache_evict.json";
        cleanup_test_file(path);
        
        let adapter = PersistentCacheAdapter::new(path.to_string(), 3);
        
        // Fill to capacity
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.put("key2".to_string(), "value2".to_string());
        adapter.put("key3".to_string(), "value3".to_string());
        
        let stats_before = adapter.stats();
        assert_eq!(stats_before.current_size, 3);
        
        // Add one more, should evict first
        adapter.put("key4".to_string(), "value4".to_string());
        
        let stats_after = adapter.stats();
        assert_eq!(stats_after.current_size, 3);
        assert_eq!(stats_after.evictions, 1);
        
        cleanup_test_file(path);
    }

    #[test]
    fn test_persistent_adapter_remove() {
        let path = "./test_cache_remove.json";
        cleanup_test_file(path);
        
        let adapter = PersistentCacheAdapter::new(path.to_string(), 100);
        
        adapter.put("key1".to_string(), "value1".to_string());
        let removed = adapter.remove("key1");
        assert!(removed);
        
        let result = adapter.get("key1");
        assert!(result.is_none());
        
        cleanup_test_file(path);
    }

    #[test]
    fn test_persistent_adapter_clear() {
        let path = "./test_cache_clear.json";
        cleanup_test_file(path);
        
        let adapter = PersistentCacheAdapter::new(path.to_string(), 100);
        
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.put("key2".to_string(), "value2".to_string());
        adapter.clear();
        
        let stats = adapter.stats();
        assert_eq!(stats.current_size, 0);
        
        cleanup_test_file(path);
    }

    #[test]
    fn test_persistent_adapter_stats() {
        let path = "./test_cache_stats.json";
        cleanup_test_file(path);
        
        let adapter = PersistentCacheAdapter::new(path.to_string(), 100);
        
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.get("key1"); // Hit
        adapter.get("key2"); // Miss
        
        let stats = adapter.stats();
        assert!(stats.hits >= 1);
        assert!(stats.misses >= 1);
        assert_eq!(stats.capacity as usize, 100);
        
        cleanup_test_file(path);
    }
}

#[cfg(test)]
mod adaptive_adapter_tests {
    use tailwind_styled_parser::infrastructure::adapters::AdaptiveCacheAdapter;
    use tailwind_styled_parser::infrastructure::cache_backend::CacheBackend;
    use tailwind_styled_parser::infrastructure::lru_cache::LruCache;

    #[test]
    fn test_adaptive_adapter_basic_operations() {
        let lru = Box::new(LruCache::new(100));
        let adapter = AdaptiveCacheAdapter::new(lru);
        
        adapter.put("key1".to_string(), "value1".to_string());
        let result = adapter.get("key1");
        
        assert_eq!(result, Some("value1".to_string()));
    }

    #[test]
    fn test_adaptive_adapter_hit_rate_tracking() {
        let lru = Box::new(LruCache::new(100));
        let adapter = AdaptiveCacheAdapter::new(lru);
        
        adapter.put("key1".to_string(), "value1".to_string());
        
        // Generate some hits
        adapter.get("key1");
        adapter.get("key1");
        
        // Generate some misses
        adapter.get("key2");
        adapter.get("key3");
        
        let stats = adapter.stats();
        assert!(stats.hits >= 2);
        assert!(stats.misses >= 2);
        assert!(stats.hit_rate > 0.0 && stats.hit_rate <= 1.0);
    }

    #[test]
    fn test_adaptive_adapter_remove() {
        let lru = Box::new(LruCache::new(100));
        let adapter = AdaptiveCacheAdapter::new(lru);
        
        adapter.put("key1".to_string(), "value1".to_string());
        let removed = adapter.remove("key1");
        
        assert!(removed);
        assert!(adapter.get("key1").is_none());
    }

    #[test]
    fn test_adaptive_adapter_clear() {
        let lru = Box::new(LruCache::new(100));
        let adapter = AdaptiveCacheAdapter::new(lru);
        
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.put("key2".to_string(), "value2".to_string());
        adapter.clear();
        
        let stats = adapter.stats();
        assert_eq!(stats.current_size, 0);
    }

    #[test]
    fn test_adaptive_adapter_capacity() {
        let lru = Box::new(LruCache::new(5000));
        let adapter = AdaptiveCacheAdapter::new(lru);
        
        let capacity = adapter.capacity();
        assert_eq!(capacity, 5000); // Delegates to wrapped backend
    }
}

#[cfg(test)]
mod lazy_adapter_tests {
    use tailwind_styled_parser::infrastructure::adapters::LazyCacheAdapter;
    use tailwind_styled_parser::infrastructure::cache_backend::CacheBackend;

    #[test]
    fn test_lazy_adapter_basic_operations() {
        let adapter = LazyCacheAdapter::new();
        
        adapter.put("key1".to_string(), "value1".to_string());
        let result = adapter.get("key1");
        
        assert_eq!(result, Some("value1".to_string()));
    }

    #[test]
    fn test_lazy_adapter_multiple_operations() {
        let adapter = LazyCacheAdapter::new();
        
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.put("key2".to_string(), "value2".to_string());
        adapter.put("key3".to_string(), "value3".to_string());
        
        assert_eq!(adapter.get("key1"), Some("value1".to_string()));
        assert_eq!(adapter.get("key2"), Some("value2".to_string()));
        assert_eq!(adapter.get("key3"), Some("value3".to_string()));
    }

    #[test]
    fn test_lazy_adapter_remove() {
        let adapter = LazyCacheAdapter::new();
        
        adapter.put("key1".to_string(), "value1".to_string());
        let removed = adapter.remove("key1");
        
        assert!(removed);
        assert!(adapter.get("key1").is_none());
    }

    #[test]
    fn test_lazy_adapter_clear() {
        let adapter = LazyCacheAdapter::new();
        
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.put("key2".to_string(), "value2".to_string());
        adapter.clear();
        
        let stats = adapter.stats();
        assert_eq!(stats.current_size, 0);
    }

    #[test]
    fn test_lazy_adapter_hit_miss_tracking() {
        let adapter = LazyCacheAdapter::new();
        
        adapter.put("key1".to_string(), "value1".to_string());
        adapter.get("key1"); // Hit
        adapter.get("key2"); // Miss
        
        let stats = adapter.stats();
        assert!(stats.hits >= 1);
        assert!(stats.misses >= 1);
    }

    #[test]
    fn test_lazy_adapter_capacity() {
        let adapter = LazyCacheAdapter::new();
        
        let capacity = adapter.capacity();
        assert_eq!(capacity, 1000);
    }

    #[test]
    fn test_lazy_adapter_contains() {
        let adapter = LazyCacheAdapter::new();
        
        adapter.put("key1".to_string(), "value1".to_string());
        assert!(adapter.contains("key1"));
        assert!(!adapter.contains("key2"));
    }
}

#[cfg(test)]
mod adapter_integration_tests {
    use tailwind_styled_parser::infrastructure::cache_backend::CacheFactory;

    #[test]
    fn test_factory_creates_lru() {
        let cache = CacheFactory::lru(1000);
        
        cache.put("key1".to_string(), "value1".to_string());
        let result = cache.get("key1");
        
        assert_eq!(result, Some("value1".to_string()));
    }

    #[test]
    fn test_factory_creates_adaptive() {
        let cache = CacheFactory::adaptive(1000, 5000);
        
        cache.put("key1".to_string(), "value1".to_string());
        let result = cache.get("key1");
        
        assert_eq!(result, Some("value1".to_string()));
    }

    #[test]
    fn test_factory_creates_persistent() {
        let cache = CacheFactory::persistent("./test_factory_persist.json".to_string());
        
        cache.put("key1".to_string(), "value1".to_string());
        let result = cache.get("key1");
        
        assert_eq!(result, Some("value1".to_string()));
        
        // Clean up
        let _ = std::fs::remove_file("./test_factory_persist.json");
    }

    #[test]
    fn test_adapter_trait_consistency() {
        let cache = CacheFactory::lru(100);
        
        // Test all trait methods
        cache.put("key1".to_string(), "value1".to_string());
        assert!(cache.contains("key1"));
        assert_eq!(cache.size(), 1);
        assert!(!cache.is_full());
        
        let stats = cache.stats();
        assert!(stats.capacity >= 100);
        
        let removed = cache.remove("key1");
        assert!(removed);
        
        cache.clear();
        assert_eq!(cache.size(), 0);
    }
}
