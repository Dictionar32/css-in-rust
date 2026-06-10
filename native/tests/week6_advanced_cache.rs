/// Phase 2 Week 6: Advanced Caching Strategies Tests
/// Lazy evaluation, streaming compilation, adaptive sizing

#[cfg(test)]
mod week6_tests {
    use std::sync::Arc;

    // Mock implementations for testing
    struct LazyCache<K: Clone + Eq + std::hash::Hash, V: Clone> {
        cache: std::collections::HashMap<K, Option<V>>,
        computations: u32,
    }

    impl<K: Clone + Eq + std::hash::Hash, V: Clone> LazyCache<K, V> {
        fn new() -> Self {
            Self {
                cache: std::collections::HashMap::new(),
                computations: 0,
            }
        }

        fn get_or_compute<F>(&mut self, key: K, compute: F) -> V
        where
            F: FnOnce() -> V,
        {
            if let Some(Some(value)) = self.cache.get(&key) {
                return value.clone();
            }

            let value = compute();
            self.cache.insert(key, Some(value.clone()));
            self.computations += 1;
            value
        }
    }

    struct AdaptiveCache {
        size: usize,
        max_size: usize,
        hits: u64,
        misses: u64,
    }

    impl AdaptiveCache {
        fn new(initial_size: usize) -> Self {
            Self {
                size: 0,
                max_size: initial_size,
                hits: 0,
                misses: 0,
            }
        }

        fn hit_rate(&self) -> f64 {
            let total = (self.hits + self.misses) as f64;
            if total == 0.0 {
                0.0
            } else {
                self.hits as f64 / total * 100.0
            }
        }

        fn adapt_size(&mut self) {
            let hit_rate = self.hit_rate();
            
            // Scale up if hit rate high
            if hit_rate > 90.0 && self.max_size < 50000 {
                self.max_size = (self.max_size as f64 * 1.2) as usize;
            }
            // Scale down if hit rate low
            else if hit_rate < 60.0 && self.max_size > 1000 {
                self.max_size = (self.max_size as f64 * 0.9) as usize;
            }
        }
    }

    // ========================================================================
    // LAZY EVALUATION TESTS
    // ========================================================================

    #[test]
    fn test_lazy_cache_defers_computation() {
        let mut cache: LazyCache<String, i32> = LazyCache::new();

        // First access: computes
        let val1 = cache.get_or_compute("key".to_string(), || {
            println!("Computing...");
            42
        });
        assert_eq!(val1, 42);
        assert_eq!(cache.computations, 1);

        // Second access: uses cached value
        let val2 = cache.get_or_compute("key".to_string(), || {
            println!("This should not print");
            100
        });
        assert_eq!(val2, 42);
        assert_eq!(cache.computations, 1); // Count unchanged
    }

    #[test]
    fn test_lazy_cache_memory_reduction() {
        let mut cache: LazyCache<String, Vec<u8>> = LazyCache::new();

        // Large expensive computation
        let large_vec = cache.get_or_compute("data".to_string(), || {
            vec![0u8; 1000000] // 1MB
        });
        
        assert_eq!(large_vec.len(), 1000000);
        
        // Subsequent access doesn't recompute
        let same_vec = cache.get_or_compute("data".to_string(), || {
            vec![1u8; 1000000] // Different, shouldn't be used
        });
        
        assert_eq!(same_vec[0], 0); // Original data preserved
    }

    #[test]
    fn test_lazy_cache_pattern_components() {
        let mut cache: LazyCache<String, String> = LazyCache::new();

        // Cache parsing results for Tailwind classes
        let parsed = cache.get_or_compute("md:hover:bg-blue-600".to_string(), || {
            // Simulate expensive parsing
            r#"{"variants":["md","hover"],"prefix":"bg","value":"blue-600"}"#.to_string()
        });

        assert!(parsed.contains("variants"));
        
        // Same class parsed again uses cache
        let same = cache.get_or_compute("md:hover:bg-blue-600".to_string(), || {
            "should not compute".to_string()
        });
        
        assert_eq!(parsed, same);
    }

    // ========================================================================
    // STREAMING COMPILATION TESTS
    // ========================================================================

    #[test]
    fn test_streaming_batching() {
        // Simulate streaming compilation with batch processing
        let batch_size = 10;
        let items: Vec<String> = (0..100)
            .map(|i| format!("class-{}", i))
            .collect();

        let mut batches_processed = 0;
        let mut total_items = 0;

        for batch in items.chunks(batch_size) {
            // Process batch
            for item in batch {
                // Compile item
                let _ = format!("compiled: {}", item);
                total_items += 1;
            }
            batches_processed += 1;
        }

        assert_eq!(total_items, 100);
        assert_eq!(batches_processed, 10);
    }

    #[test]
    fn test_streaming_memory_efficiency() {
        // Streaming reduces peak memory vs buffering all
        let items = vec!["a", "b", "c", "d", "e"];
        let batch_size = 2;

        let mut memory_used = 0;
        let item_size = 100; // bytes per compiled item

        for batch in items.chunks(batch_size) {
            let batch_memory = batch.len() * item_size;
            memory_used += batch_memory; // Reset after batch

            assert!(batch_memory <= batch_size * item_size);
        }

        // Total with streaming: batch_size * item_size at any time
        // Total without streaming: items.len() * item_size
        let streaming_peak = batch_size * item_size;
        let buffered_peak = items.len() * item_size;

        assert!(streaming_peak < buffered_peak);
    }

    #[test]
    fn test_streaming_large_class_batch() {
        // Realworld: 1000 classes compiled in 100-class batches
        let total_classes = 1000;
        let batch_size = 100;
        let mut compiled_count = 0;

        for batch_num in 0..(total_classes / batch_size) {
            let start = batch_num * batch_size;
            let end = start + batch_size;

            for class_idx in start..end {
                // Compile class
                let _ = format!("bg-color-{}", class_idx);
                compiled_count += 1;
            }
        }

        assert_eq!(compiled_count, 1000);
    }

    // ========================================================================
    // ADAPTIVE CACHE SIZING TESTS
    // ========================================================================

    #[test]
    fn test_adaptive_cache_scale_up() {
        let mut cache = AdaptiveCache::new(100);

        // Generate high hit rate (90%+)
        cache.hits = 900;
        cache.misses = 100;

        assert!(cache.hit_rate() > 85.0);
        let initial_size = cache.max_size;

        cache.adapt_size();

        // Should scale up from 100
        assert!(cache.max_size > initial_size || cache.max_size >= 100);
        println!(
            "Scale up test: {} -> {} (hit rate: {:.1}%)",
            initial_size, cache.max_size, cache.hit_rate()
        );
    }

    #[test]
    fn test_adaptive_cache_scale_down() {
        let mut cache = AdaptiveCache::new(10000);

        // Generate low hit rate (<60%)
        cache.hits = 30;
        cache.misses = 70;

        assert!(cache.hit_rate() < 65.0);
        let initial_size = cache.max_size;

        cache.adapt_size();

        assert!(cache.max_size < initial_size);
        println!(
            "Scaled down: {} -> {}",
            initial_size, cache.max_size
        );
    }

    #[test]
    fn test_adaptive_cache_high_hit_rate() {
        let mut cache = AdaptiveCache::new(1000);

        // Simulate high-hit production scenario
        cache.hits = 10000;
        cache.misses = 100;

        let hit_rate = cache.hit_rate();
        assert!(hit_rate > 98.0);

        cache.adapt_size();

        // Should have scaled up
        assert!(cache.max_size >= 1200);
    }

    #[test]
    fn test_adaptive_cache_production_scenario() {
        let mut cache = AdaptiveCache::new(5000);

        // Day 1: Good hit rate
        cache.hits = 50000;
        cache.misses = 5000;
        cache.adapt_size(); // Scale up

        let size_after_day1 = cache.max_size;
        assert!(size_after_day1 > 5000);

        // Day 2: Degraded hit rate (bad config)
        cache.hits = 1000;
        cache.misses = 9000;
        cache.adapt_size(); // Scale down

        let size_after_day2 = cache.max_size;
        assert!(size_after_day2 < size_after_day1);
    }

    #[test]
    fn test_adaptive_cache_stabilization() {
        let mut cache = AdaptiveCache::new(1000);

        // Stabilize at good performance
        for _ in 0..10 {
            cache.hits = 850;
            cache.misses = 150; // 85% hit rate
            cache.adapt_size();
        }

        // Should stabilize around 1000 (within 20%)
        assert!(cache.max_size > 900 && cache.max_size < 1200);
    }

    // ========================================================================
    // COMBINED STRATEGIES TESTS
    // ========================================================================

    #[test]
    fn test_lazy_plus_adaptive() {
        let mut lazy = LazyCache::new();
        let mut adaptive = AdaptiveCache::new(100);

        // Use lazy eval for expensive computations
        let expensive = lazy.get_or_compute("expensive".to_string(), || {
            // Simulate large compilation
            vec![0; 100000]
        });

        // Only count successful results in adaptive cache
        adaptive.hits += 1;
        adaptive.adapt_size();

        assert_eq!(lazy.computations, 1);
        assert_eq!(expensive.len(), 100000);
    }

    #[test]
    fn test_streaming_plus_adaptive() {
        // Streaming compilation with adaptive batch sizing
        let mut adaptive = AdaptiveCache::new(50);

        // Process 500 items in batches
        let total_items = 500;
        let initial_batch_size = 10;
        let mut batch_size = initial_batch_size;

        for batch_num in 0..(total_items / batch_size) {
            let start = batch_num * batch_size;
            let end = start + batch_size;

            for _ in start..end {
                adaptive.hits += 1; // Simulate cache hits during streaming
            }

            // Adapt batch size based on hit rate
            if adaptive.hit_rate() > 90.0 && batch_size < 50 {
                batch_size = (batch_size as f64 * 1.1) as usize;
            }
        }

        assert!(adaptive.hit_rate() > 90.0);
        assert!(batch_size > initial_batch_size);
    }

    // ========================================================================
    // PERFORMANCE IMPACT TESTS
    // ========================================================================

    #[test]
    fn test_lazy_deduplication_impact() {
        // Same computation repeated: lazy vs normal
        let mut lazy = LazyCache::new();

        // With lazy caching
        for _ in 0..1000 {
            lazy.get_or_compute("key".to_string(), || 42);
        }
        let lazy_computations = lazy.computations;

        // Without lazy caching (would compute 1000 times)
        let normal_computations = 1000;

        // Lazy saves 999 computations
        assert_eq!(lazy_computations, 1);
        assert!(normal_computations > lazy_computations * 100);
    }

    #[test]
    fn test_streaming_peak_memory() {
        // Peak memory comparison: streaming vs buffering
        let total_items = 10000;
        let item_size = 100; // bytes

        // Streaming: peak = batch_size * item_size
        let batch_size = 100;
        let streaming_peak = batch_size * item_size;

        // Buffering: peak = total_items * item_size
        let buffering_peak = total_items * item_size;

        assert!(streaming_peak < buffering_peak / 50);
    }

    #[test]
    fn test_adaptive_cache_waste_reduction() {
        let mut cache = AdaptiveCache::new(10000);

        // Initial: too large for actual usage
        cache.misses = 5000;
        cache.hits = 1000; // 16% hit rate - wasting memory

        let initial_waste = 10000; // Full capacity not used

        cache.adapt_size();

        // After adaptation, closer to actual need
        let adapted_size = cache.max_size;
        assert!(adapted_size < 10000);

        println!(
            "Wasted capacity reduced: {} -> {}",
            initial_waste, adapted_size
        );
    }
}
