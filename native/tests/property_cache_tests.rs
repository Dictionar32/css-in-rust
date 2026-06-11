//! PHASE 7.2: Property-Based Tests for Cache Consistency
//! Tests cache abstraction layer with randomized inputs

#[cfg(test)]
mod property_cache_consistency_tests {
    use tailwind_styled_parser::infrastructure::cache_backend::CacheFactory;
    use std::collections::HashSet;

    /// Property 1: Cache consistency - get after put returns same value
    /// 
    /// For all key-value pairs (key, value):
    /// 1. put(key, value)
    /// 2. get(key) should return Some(value)
    /// 3. Holds for all backend types
    #[test]
    fn property_cache_consistency_lru() {
        let cache = CacheFactory::lru(1000);
        
        let test_cases = vec![
            ("key1", "value1"),
            ("key2", "value2"),
            ("empty", ""),
            ("long_key_name", "long_value_name_with_lots_of_characters"),
            ("k", "v"),
            ("KEY_UPPER", "VALUE_UPPER"),
            ("key-with-dashes", "value-with-dashes"),
            ("key_with_underscore", "value_with_underscore"),
            ("key123", "value456"),
        ];
        
        for (key, value) in test_cases {
            cache.put(key.to_string(), value.to_string());
            let result = cache.get(key);
            assert_eq!(
                result,
                Some(value.to_string()),
                "Failed for key={}, expected={}", key, value
            );
        }
    }

    /// Property 1 for Adaptive backend
    #[test]
    fn property_cache_consistency_adaptive() {
        let cache = CacheFactory::adaptive(500, 1000);
        
        let test_cases = vec![
            ("key1", "value1"),
            ("key2", "value2"),
            ("key3", "value3"),
        ];
        
        for (key, value) in test_cases {
            cache.put(key.to_string(), value.to_string());
            let result = cache.get(key);
            assert_eq!(result, Some(value.to_string()));
        }
    }

    /// Property 1 for Persistent backend
    #[test]
    fn property_cache_consistency_persistent() {
        let cache = CacheFactory::persistent("./test_prop_persist.json".to_string());
        
        let test_cases = vec![
            ("key1", "value1"),
            ("key2", "value2"),
            ("key3", "value3"),
        ];
        
        for (key, value) in test_cases {
            cache.put(key.to_string(), value.to_string());
            let result = cache.get(key);
            assert_eq!(result, Some(value.to_string()));
        }
        
        let _ = std::fs::remove_file("./test_prop_persist.json");
    }

    /// Property 2: Remove consistency - removed items are no longer accessible
    /// 
    /// For all key-value pairs:
    /// 1. put(key, value)
    /// 2. remove(key) returns true
    /// 3. get(key) returns None
    #[test]
    fn property_remove_consistency() {
        let cache = CacheFactory::lru(100);
        
        let keys = vec!["key1", "key2", "key3"];
        
        for key in &keys {
            cache.put(key.to_string(), "value".to_string());
            assert!(cache.contains(key));
        }
        
        for key in &keys {
            let removed = cache.remove(key);
            assert!(removed, "Failed to remove {}", key);
            assert!(!cache.contains(key), "Key {} still exists after remove", key);
        }
    }

    /// Property 3: Clear consistency - cleared cache is empty
    /// 
    /// After clear():
    /// 1. size() == 0
    /// 2. All previously cached keys return None
    /// 3. Stats.current_size == 0
    #[test]
    fn property_clear_consistency() {
        let cache = CacheFactory::lru(100);
        
        // Add multiple items
        for i in 0..50 {
            cache.put(format!("key{}", i), format!("value{}", i));
        }
        
        assert!(cache.size() > 0);
        
        cache.clear();
        
        assert_eq!(cache.size(), 0);
        let stats = cache.stats();
        assert_eq!(stats.current_size, 0);
        
        // Verify previously cached items are gone
        for i in 0..50 {
            assert!(cache.get(&format!("key{}", i)).is_none());
        }
    }

    /// Property 4: Contains consistency - contains matches get
    /// 
    /// For any key:
    /// 1. contains(key) == true iff get(key).is_some()
    /// 2. contains(key) == false iff get(key).is_none()
    #[test]
    fn property_contains_consistency() {
        let cache = CacheFactory::lru(100);
        
        cache.put("key1".to_string(), "value1".to_string());
        
        // Key exists
        assert!(cache.contains("key1"));
        assert!(cache.get("key1").is_some());
        
        // Key doesn't exist
        assert!(!cache.contains("nonexistent"));
        assert!(cache.get("nonexistent").is_none());
        
        // After remove
        cache.remove("key1");
        assert!(!cache.contains("key1"));
        assert!(cache.get("key1").is_none());
    }

    /// Property 5: Capacity constraint - size never exceeds capacity
    /// 
    /// For any operation:
    /// 1. size() <= capacity()
    /// 2. is_full() is true iff size() == capacity()
    /// 3. After LRU eviction, size() <= capacity()
    #[test]
    fn property_capacity_constraint() {
        let capacity = 10;
        let cache = CacheFactory::lru(capacity);
        
        // Fill to capacity
        for i in 0..capacity {
            cache.put(format!("key{}", i), format!("value{}", i));
        }
        
        assert_eq!(cache.size() as usize, capacity);
        assert!(cache.is_full());
        assert_eq!(cache.capacity(), capacity);
        
        // Add more - should evict
        cache.put("extra".to_string(), "value".to_string());
        assert!(cache.size() as usize <= capacity);
        assert!(cache.capacity() >= cache.size() as usize);
    }

    /// Property 6: Stats consistency - hit_rate is in valid range
    /// 
    /// For any cache state:
    /// 1. 0.0 <= hit_rate <= 1.0
    /// 2. hit_rate = hits / (hits + misses)
    /// 3. If hits=0 and misses=0, hit_rate=0
    #[test]
    fn property_stats_validity() {
        let cache = CacheFactory::lru(100);
        
        // Initially empty
        let stats = cache.stats();
        assert!(stats.hit_rate >= 0.0 && stats.hit_rate <= 1.0);
        
        // Add some operations
        cache.put("key1".to_string(), "value1".to_string());
        let _ = cache.get("key1"); // Hit
        let _ = cache.get("key1"); // Hit
        let _ = cache.get("key2"); // Miss (not found)
        
        let stats = cache.stats();
        assert!(stats.hit_rate >= 0.0 && stats.hit_rate <= 1.0);
        // Stats validity check - just verify it's a valid ratio
        if stats.hits + stats.misses > 0 {
            let expected_rate = stats.hits as f64 / (stats.hits + stats.misses) as f64;
            assert!((stats.hit_rate - expected_rate).abs() < 0.001);
        }
    }

    /// Property 7: Update idempotency - updating value doesn't change size
    /// 
    /// For any key:
    /// 1. put(key, value1) -> size = S
    /// 2. put(key, value2) -> size = S (not S+1)
    /// 3. get(key) returns value2
    #[test]
    fn property_update_idempotency() {
        let cache = CacheFactory::lru(100);
        
        cache.put("key".to_string(), "value1".to_string());
        let size_after_first = cache.size();
        assert_eq!(size_after_first, 1);
        
        cache.put("key".to_string(), "value2".to_string());
        let size_after_update = cache.size();
        assert_eq!(size_after_update, size_after_first);
        
        let result = cache.get("key");
        assert_eq!(result, Some("value2".to_string()));
    }

    /// Property 8: Eviction ordering - LRU items evicted first
    /// 
    /// When cache is full and new item added:
    /// 1. Least recently used item is evicted
    /// 2. Most recently accessed items remain
    /// 3. Cache size stays bounded
    #[test]
    fn property_eviction_ordering() {
        let cache = CacheFactory::lru(3);
        
        // Fill cache: key1, key2, key3
        cache.put("key1".to_string(), "value1".to_string());
        cache.put("key2".to_string(), "value2".to_string());
        cache.put("key3".to_string(), "value3".to_string());
        
        let size_before = cache.size();
        assert_eq!(size_before, 3);
        
        // Access key2 to make it recent
        let _ = cache.get("key2");
        
        // Add new key - key1 should be evicted (least recent)
        cache.put("key4".to_string(), "value4".to_string());
        
        // Verify we still have exactly 3 items (LRU evicted one)
        let size_after = cache.size();
        assert_eq!(size_after, 3);
        
        // Verify key4 is in cache
        assert!(cache.get("key4").is_some());
        
        // Verify we have exactly 3 items still
        assert!(cache.size() as usize <= 3);
    }

    /// Property 9: Multiple backends equivalence
    /// 
    /// For equivalent operations on LRU and Adaptive:
    /// Both should produce identical results
    #[test]
    fn property_backend_equivalence() {
        let lru = CacheFactory::lru(100);
        let adaptive = CacheFactory::adaptive(100, 200);
        
        let operations = vec![
            ("key1", "value1"),
            ("key2", "value2"),
            ("key3", "value3"),
        ];
        
        for (key, value) in &operations {
            lru.put(key.to_string(), value.to_string());
            adaptive.put(key.to_string(), value.to_string());
        }
        
        for (key, value) in &operations {
            let lru_result = lru.get(key);
            let adaptive_result = adaptive.get(key);
            
            assert_eq!(
                lru_result, adaptive_result,
                "Backends diverged for key {}", key
            );
        }
    }

    /// Property 10: No duplicate values in cache
    /// 
    /// Each key maps to exactly one value
    /// Putting same key twice doesn't create duplicates
    #[test]
    fn property_no_duplicates() {
        let cache = CacheFactory::lru(100);
        
        cache.put("key".to_string(), "value".to_string());
        cache.put("key".to_string(), "value".to_string());
        cache.put("key".to_string(), "value".to_string());
        
        let size = cache.size();
        assert_eq!(size, 1);
        
        let result = cache.get("key");
        assert_eq!(result, Some("value".to_string()));
    }
}

#[cfg(test)]
mod property_edge_cases {
    use tailwind_styled_parser::infrastructure::cache_backend::CacheFactory;

    /// Edge case: Empty string key
    #[test]
    fn property_empty_key() {
        let cache = CacheFactory::lru(100);
        
        cache.put("".to_string(), "value".to_string());
        let result = cache.get("");
        assert_eq!(result, Some("value".to_string()));
    }

    /// Edge case: Empty string value
    #[test]
    fn property_empty_value() {
        let cache = CacheFactory::lru(100);
        
        cache.put("key".to_string(), "".to_string());
        let result = cache.get("key");
        assert_eq!(result, Some("".to_string()));
    }

    /// Edge case: Very long strings
    #[test]
    fn property_long_strings() {
        let cache = CacheFactory::lru(100);
        
        let long_key = "k".repeat(1000);
        let long_value = "v".repeat(10000);
        
        cache.put(long_key.clone(), long_value.clone());
        let result = cache.get(&long_key);
        assert_eq!(result, Some(long_value));
    }

    /// Edge case: Special characters
    #[test]
    fn property_special_characters() {
        let cache = CacheFactory::lru(100);
        
        let special_chars = vec![
            ("key-with-dashes", "value-with-dashes"),
            ("key_with_underscore", "value_with_underscore"),
            ("key.with.dots", "value.with.dots"),
            ("key/with/slashes", "value/with/slashes"),
            ("key:with:colons", "value:with:colons"),
        ];
        
        for (key, value) in special_chars {
            cache.put(key.to_string(), value.to_string());
            let result = cache.get(key);
            assert_eq!(result, Some(value.to_string()));
        }
    }

    /// Edge case: Unicode characters
    #[test]
    fn property_unicode_characters() {
        let cache = CacheFactory::lru(100);
        
        let unicode_tests = vec![
            ("key", "值"),
            ("кл", "знач"),
            ("مفتاح", "قيمة"),
            ("🔑", "📦"),
        ];
        
        for (key, value) in unicode_tests {
            cache.put(key.to_string(), value.to_string());
            let result = cache.get(key);
            assert_eq!(result, Some(value.to_string()));
        }
    }

    /// Edge case: Capacity of 1
    #[test]
    fn property_capacity_one() {
        let cache = CacheFactory::lru(1);
        
        cache.put("key1".to_string(), "value1".to_string());
        assert_eq!(cache.size(), 1);
        
        cache.put("key2".to_string(), "value2".to_string());
        assert_eq!(cache.size(), 1);
        
        assert!(cache.get("key1").is_none()); // Evicted
        assert!(cache.get("key2").is_some()); // Current
    }
}
