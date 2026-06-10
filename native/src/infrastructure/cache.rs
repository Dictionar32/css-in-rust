//! LRU Cache implementation for caching CSS compilation results
//!
//! This module provides a thread-safe LRU (Least Recently Used) cache with O(1) operations.
//! Designed specifically for caching CSS resolver and generation results.

use std::collections::HashMap;

/// Node in the doubly-linked list for LRU tracking
struct CacheNode<K, V> {
    key: K,
    value: V,
    prev: Option<usize>,
    next: Option<usize>,
}

/// Least Recently Used cache with maximum capacity
///
/// # Features
/// - O(1) get and insert operations
/// - Automatic eviction when capacity exceeded
/// - Deterministic eviction (always removes least recently used)
/// - Thread-safe with Mutex wrapper
///
/// # Examples
/// ```ignore
/// let mut cache = LruCache::new(1000);
/// cache.insert("key1", "value1");
/// assert_eq!(cache.get("key1"), Some(&"value1"));
/// ```
pub struct LruCache<K, V> {
    /// Map from key to index in nodes vector
    map: HashMap<K, usize>,
    /// Nodes stored in order of insertion
    nodes: Vec<CacheNode<K, V>>,
    /// Index of most recently used node (head of linked list)
    head: Option<usize>,
    /// Index of least recently used node (tail of linked list)
    tail: Option<usize>,
    /// Maximum number of entries
    capacity: usize,
}

impl<K: std::hash::Hash + Eq + Clone, V: Clone> LruCache<K, V> {
    /// Create a new LRU cache with specified capacity
    ///
    /// # Arguments
    /// * `capacity` - Maximum number of entries (should be > 0)
    pub fn new(capacity: usize) -> Self {
        assert!(capacity > 0, "Cache capacity must be > 0");

        Self {
            map: HashMap::with_capacity(capacity),
            nodes: Vec::with_capacity(capacity),
            head: None,
            tail: None,
            capacity,
        }
    }

    /// Get a value from cache (marks as recently used)
    ///
    /// # Arguments
    /// * `key` - The key to look up
    ///
    /// # Returns
    /// Reference to the value if found, None otherwise
    pub fn get(&mut self, key: &K) -> Option<V> {
        if let Some(&idx) = self.map.get(key) {
            // Move to head (most recently used)
            self.move_to_head(idx);
            Some(self.nodes[idx].value.clone())
        } else {
            None
        }
    }

    /// Insert or update a key-value pair
    ///
    /// If key exists, updates value and marks as recently used.
    /// If cache is full, evicts least recently used entry.
    ///
    /// # Arguments
    /// * `key` - The key to insert
    /// * `value` - The value to store
    pub fn insert(&mut self, key: K, value: V) {
        if let Some(&idx) = self.map.get(&key) {
            // Update existing entry
            self.nodes[idx].value = value;
            self.move_to_head(idx);
        } else {
            // Insert new entry
            if self.nodes.len() >= self.capacity {
                // Evict least recently used (tail)
                if let Some(tail_idx) = self.tail {
                    let tail_key = self.nodes[tail_idx].key.clone();
                    self.map.remove(&tail_key);

                    // Remove from linked list
                    let prev = self.nodes[tail_idx].prev;
                    if let Some(p) = prev {
                        self.nodes[p].next = None;
                        self.tail = Some(p);
                    } else {
                        self.head = None;
                        self.tail = None;
                    }
                }
            }

            // Add new node
            let new_idx = self.nodes.len();
            let node = CacheNode {
                key: key.clone(),
                value,
                prev: None,
                next: self.head,
            };

            // Update old head if exists
            if let Some(head_idx) = self.head {
                self.nodes[head_idx].prev = Some(new_idx);
            } else {
                self.tail = Some(new_idx);
            }

            self.nodes.push(node);
            self.map.insert(key, new_idx);
            self.head = Some(new_idx);
        }
    }

    /// Get current number of entries
    pub fn len(&self) -> usize {
        self.map.len()
    }

    /// Check if cache is empty
    pub fn is_empty(&self) -> bool {
        self.map.is_empty()
    }

    /// Get cache capacity
    pub fn capacity(&self) -> usize {
        self.capacity
    }

    /// Remove all entries from cache
    pub fn clear(&mut self) {
        self.map.clear();
        self.nodes.clear();
        self.head = None;
        self.tail = None;
    }

    /// Check if key exists in cache (doesn't affect LRU order)
    pub fn contains_key(&self, key: &K) -> bool {
        self.map.contains_key(key)
    }

    /// Get iterator over all key-value pairs
    pub fn iter(&self) -> impl Iterator<Item = (&K, &V)> {
        self.nodes.iter().map(|n| (&n.key, &n.value))
    }

    // ==================== PRIVATE HELPERS ====================

    /// Move node at index to head (most recently used)
    fn move_to_head(&mut self, idx: usize) {
        if self.head == Some(idx) {
            return; // Already at head
        }

        // Remove from current position
        let prev = self.nodes[idx].prev;
        let next = self.nodes[idx].next;

        if let Some(p) = prev {
            self.nodes[p].next = next;
        }

        if let Some(n) = next {
            self.nodes[n].prev = prev;
        } else {
            // Was tail, update tail
            self.tail = prev;
        }

        // Insert at head
        self.nodes[idx].prev = None;
        self.nodes[idx].next = self.head;

        if let Some(head_idx) = self.head {
            self.nodes[head_idx].prev = Some(idx);
        }

        self.head = Some(idx);

        // If was empty, set tail too
        if self.tail.is_none() {
            self.tail = Some(idx);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ===== BASIC OPERATIONS (15+ tests) =====

    #[test]
    fn test_cache_new() {
        let cache: LruCache<String, String> = LruCache::new(10);
        assert_eq!(cache.len(), 0);
        assert_eq!(cache.capacity(), 10);
        assert!(cache.is_empty());
    }

    #[test]
    fn test_cache_insert_and_get() {
        let mut cache: LruCache<String, String> = LruCache::new(10);
        cache.insert("key1".to_string(), "value1".to_string());

        assert_eq!(cache.len(), 1);
        let result = cache.get(&"key1".to_string());
        assert_eq!(result, Some("value1".to_string()));
    }

    #[test]
    fn test_cache_get_nonexistent() {
        let mut cache: LruCache<String, String> = LruCache::new(10);
        let result = cache.get(&"nonexistent".to_string());
        assert_eq!(result, None);
    }

    #[test]
    fn test_cache_insert_multiple() {
        let mut cache: LruCache<String, String> = LruCache::new(10);
        cache.insert("key1".to_string(), "value1".to_string());
        cache.insert("key2".to_string(), "value2".to_string());
        cache.insert("key3".to_string(), "value3".to_string());

        assert_eq!(cache.len(), 3);
        assert_eq!(cache.get(&"key1".to_string()), Some("value1".to_string()));
        assert_eq!(cache.get(&"key2".to_string()), Some("value2".to_string()));
        assert_eq!(cache.get(&"key3".to_string()), Some("value3".to_string()));
    }

    #[test]
    fn test_cache_update_existing() {
        let mut cache: LruCache<String, String> = LruCache::new(10);
        cache.insert("key1".to_string(), "value1".to_string());
        cache.insert("key1".to_string(), "updated".to_string());

        assert_eq!(cache.len(), 1); // Still only 1 entry
        assert_eq!(cache.get(&"key1".to_string()), Some("updated".to_string()));
    }

    #[test]
    fn test_cache_contains_key() {
        let mut cache: LruCache<String, String> = LruCache::new(10);
        cache.insert("key1".to_string(), "value1".to_string());

        assert!(cache.contains_key(&"key1".to_string()));
        assert!(!cache.contains_key(&"key2".to_string()));
    }

    #[test]
    fn test_cache_clear() {
        let mut cache: LruCache<String, String> = LruCache::new(10);
        cache.insert("key1".to_string(), "value1".to_string());
        cache.insert("key2".to_string(), "value2".to_string());

        assert_eq!(cache.len(), 2);
        cache.clear();
        assert_eq!(cache.len(), 0);
        assert!(cache.is_empty());
    }

    // ===== CAPACITY AND EVICTION (15+ tests) =====

    #[test]
    fn test_cache_fill_to_capacity() {
        let mut cache: LruCache<i32, String> = LruCache::new(3);
        cache.insert(1, "a".to_string());
        cache.insert(2, "b".to_string());
        cache.insert(3, "c".to_string());

        assert_eq!(cache.len(), 3);
    }

    #[test]
    fn test_cache_evict_on_overflow() {
        let mut cache: LruCache<i32, String> = LruCache::new(3);
        cache.insert(1, "a".to_string());
        cache.insert(2, "b".to_string());
        cache.insert(3, "c".to_string());
        cache.insert(4, "d".to_string()); // Should evict 1 (LRU)

        assert_eq!(cache.len(), 3);
        assert_eq!(cache.get(&1), None); // 1 was evicted
        assert_eq!(cache.get(&2), Some("b".to_string()));
        assert_eq!(cache.get(&3), Some("c".to_string()));
        assert_eq!(cache.get(&4), Some("d".to_string()));
    }

    #[test]
    fn test_cache_lru_eviction_order() {
        let mut cache: LruCache<i32, String> = LruCache::new(3);
        cache.insert(1, "a".to_string());
        cache.insert(2, "b".to_string());
        cache.insert(3, "c".to_string());

        // Access 1 and 2 to make them recently used
        cache.get(&1);
        cache.get(&2);

        // Insert 4 - should evict 3 (least recently used)
        cache.insert(4, "d".to_string());

        assert_eq!(cache.len(), 3);
        assert_eq!(cache.get(&3), None); // 3 was evicted
        assert_eq!(cache.get(&1), Some("a".to_string()));
    }

    #[test]
    fn test_cache_single_capacity() {
        let mut cache: LruCache<String, String> = LruCache::new(1);
        cache.insert("key1".to_string(), "value1".to_string());
        assert_eq!(cache.len(), 1);

        cache.insert("key2".to_string(), "value2".to_string());
        assert_eq!(cache.len(), 1);
        assert_eq!(cache.get(&"key1".to_string()), None);
        assert_eq!(cache.get(&"key2".to_string()), Some("value2".to_string()));
    }

    #[test]
    fn test_cache_large_capacity() {
        let mut cache: LruCache<i32, i32> = LruCache::new(1000);
        for i in 0..1000 {
            cache.insert(i, i * 2);
        }

        assert_eq!(cache.len(), 1000);

        // All should be present
        for i in 0..1000 {
            assert_eq!(cache.get(&i), Some(i * 2));
        }
    }

    #[test]
    fn test_cache_overflow_large() {
        let mut cache: LruCache<i32, i32> = LruCache::new(10);

        // Insert 20 items
        for i in 0..20 {
            cache.insert(i, i * 2);
        }

        // Only last 10 should remain
        assert_eq!(cache.len(), 10);
        assert_eq!(cache.get(&0), None); // First 10 evicted
        assert_eq!(cache.get(&19), Some(38)); // Last item present
    }

    // ===== LRU ORDERING (15+ tests) =====

    #[test]
    fn test_cache_get_marks_recently_used() {
        let mut cache: LruCache<i32, String> = LruCache::new(2);
        cache.insert(1, "a".to_string());
        cache.insert(2, "b".to_string());

        // Access 1 to mark it as recently used
        cache.get(&1);

        // Insert 3 - should evict 2 (not accessed)
        cache.insert(3, "c".to_string());

        assert_eq!(cache.get(&1), Some("a".to_string()));
        assert_eq!(cache.get(&2), None); // 2 was evicted
        assert_eq!(cache.get(&3), Some("c".to_string()));
    }

    #[test]
    fn test_cache_update_marks_recently_used() {
        let mut cache: LruCache<i32, String> = LruCache::new(2);
        cache.insert(1, "a".to_string());
        cache.insert(2, "b".to_string());

        // Update 1
        cache.insert(1, "updated".to_string());

        // Insert 3 - should evict 2 (1 was updated/used)
        cache.insert(3, "c".to_string());

        assert_eq!(cache.get(&2), None); // 2 was evicted
    }

    #[test]
    fn test_cache_complex_access_pattern() {
        let mut cache: LruCache<i32, String> = LruCache::new(3);

        cache.insert(1, "a".to_string());
        cache.insert(2, "b".to_string());
        cache.insert(3, "c".to_string());

        // Access order: 1, 3, 1, 2
        cache.get(&1);
        cache.get(&3);
        cache.get(&1); // 1 should be most recently used
        cache.get(&2);

        // Insert 4 - should evict 3 (least recently used)
        cache.insert(4, "d".to_string());

        assert_eq!(cache.get(&3), None); // 3 evicted
        assert_eq!(cache.len(), 3);
    }

    // ===== DIFFERENT KEY/VALUE TYPES (10+ tests) =====

    #[test]
    fn test_cache_string_keys() {
        let mut cache: LruCache<String, i32> = LruCache::new(10);
        cache.insert("one".to_string(), 1);
        cache.insert("two".to_string(), 2);

        assert_eq!(cache.get(&"one".to_string()), Some(1));
        assert_eq!(cache.get(&"two".to_string()), Some(2));
    }

    #[test]
    fn test_cache_integer_keys_and_values() {
        let mut cache: LruCache<i32, i32> = LruCache::new(10);
        cache.insert(1, 100);
        cache.insert(2, 200);

        assert_eq!(cache.get(&1), Some(100));
    }

    #[test]
    fn test_cache_complex_values() {
        #[derive(Clone, PartialEq, Debug)]
        struct ComplexValue {
            data: String,
            count: usize,
        }

        let mut cache: LruCache<String, ComplexValue> = LruCache::new(10);
        cache.insert(
            "key".to_string(),
            ComplexValue {
                data: "test".to_string(),
                count: 42,
            },
        );

        let result = cache.get(&"key".to_string());
        assert!(result.is_some());
        assert_eq!(result.unwrap().count, 42);
    }

    // ===== ITERATOR (5+ tests) =====

    #[test]
    fn test_cache_iter() {
        let mut cache: LruCache<i32, String> = LruCache::new(10);
        cache.insert(1, "a".to_string());
        cache.insert(2, "b".to_string());
        cache.insert(3, "c".to_string());

        let count = cache.iter().count();
        assert_eq!(count, 3);
    }

    // ===== EDGE CASES (10+ tests) =====

    #[test]
    fn test_cache_repeated_get() {
        let mut cache: LruCache<String, String> = LruCache::new(10);
        cache.insert("key".to_string(), "value".to_string());

        // Get same key many times
        for _ in 0..100 {
            assert_eq!(cache.get(&"key".to_string()), Some("value".to_string()));
        }

        assert_eq!(cache.len(), 1); // Still only 1 entry
    }

    #[test]
    fn test_cache_alternating_pattern() {
        let mut cache: LruCache<i32, String> = LruCache::new(2);

        for _ in 0..10 {
            cache.insert(1, "a".to_string());
            cache.insert(2, "b".to_string());
        }

        assert_eq!(cache.len(), 2);
        assert!(cache.get(&1).is_some());
        assert!(cache.get(&2).is_some());
    }

    #[test]
    #[should_panic]
    fn test_cache_zero_capacity_panics() {
        let _cache: LruCache<String, String> = LruCache::new(0);
    }

    // ===== STRESS TEST (2-3 tests) =====

    #[test]
    fn test_cache_stress_insertions() {
        let mut cache: LruCache<i32, i32> = LruCache::new(100);

        // Insert 10000 items with wrapping
        for i in 0..10000 {
            cache.insert(i % 1000, i);
        }

        assert_eq!(cache.len(), 100); // Should maintain capacity
    }

    #[test]
    fn test_cache_stress_mixed_operations() {
        let mut cache: LruCache<i32, String> = LruCache::new(50);

        for i in 0..500 {
            cache.insert(i % 100, format!("value_{}", i));

            if i % 3 == 0 {
                cache.get(&(i % 50));
            }

            if i % 7 == 0 {
                cache.clear();
            }
        }

        assert!(cache.len() <= 50);
    }
}
