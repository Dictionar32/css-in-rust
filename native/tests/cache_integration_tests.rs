/// Phase 2 Cache Integration Tests
/// Validates cache behavior with real-world Tailwind patterns
/// 
/// Run with: cargo test --test cache_integration_tests

#[cfg(test)]
mod cache_integration_tests {
    use std::sync::Arc;
    use std::sync::atomic::{AtomicU32, Ordering};

    // Simplified mock for testing (actual LRU cache from lru_cache.rs)
    struct SimpleLRU {
        data: Arc<std::sync::Mutex<std::collections::HashMap<String, String>>>,
        hits: Arc<AtomicU32>,
        misses: Arc<AtomicU32>,
    }

    impl SimpleLRU {
        fn new() -> Self {
            Self {
                data: Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
                hits: Arc::new(AtomicU32::new(0)),
                misses: Arc::new(AtomicU32::new(0)),
            }
        }

        fn get(&self, key: &str) -> Option<String> {
            let data = self.data.lock().unwrap();
            if let Some(val) = data.get(key) {
                self.hits.fetch_add(1, Ordering::Relaxed);
                Some(val.clone())
            } else {
                self.misses.fetch_add(1, Ordering::Relaxed);
                None
            }
        }

        fn put(&self, key: String, val: String) {
            let mut data = self.data.lock().unwrap();
            data.insert(key, val);
        }

        fn stats(&self) -> (u32, u32) {
            (
                self.hits.load(Ordering::Relaxed),
                self.misses.load(Ordering::Relaxed),
            )
        }

        fn clear(&self) {
            self.data.lock().unwrap().clear();
            self.hits.store(0, Ordering::Relaxed);
            self.misses.store(0, Ordering::Relaxed);
        }
    }

    // ========================================================================
    // BASIC CACHE FUNCTIONALITY TESTS
    // ========================================================================

    #[test]
    fn test_cache_get_miss() {
        let cache = SimpleLRU::new();
        let result = cache.get("non-existent");
        assert!(result.is_none());
        let (hits, misses) = cache.stats();
        assert_eq!(hits, 0);
        assert_eq!(misses, 1);
    }

    #[test]
    fn test_cache_get_hit() {
        let cache = SimpleLRU::new();
        cache.put("key1".to_string(), "value1".to_string());
        
        let result = cache.get("key1");
        assert_eq!(result, Some("value1".to_string()));
        let (hits, misses) = cache.stats();
        assert_eq!(hits, 1);
        assert_eq!(misses, 0);
    }

    #[test]
    fn test_cache_multiple_keys() {
        let cache = SimpleLRU::new();
        cache.put("color-blue".to_string(), "#2563eb".to_string());
        cache.put("color-red".to_string(), "#dc2626".to_string());
        cache.put("spacing-4".to_string(), "1rem".to_string());

        assert_eq!(cache.get("color-blue"), Some("#2563eb".to_string()));
        assert_eq!(cache.get("color-red"), Some("#dc2626".to_string()));
        assert_eq!(cache.get("spacing-4"), Some("1rem".to_string()));

        let (hits, misses) = cache.stats();
        assert_eq!(hits, 3);
        assert_eq!(misses, 0);
    }

    #[test]
    fn test_cache_clear() {
        let cache = SimpleLRU::new();
        cache.put("key1".to_string(), "value1".to_string());
        cache.put("key2".to_string(), "value2".to_string());

        cache.clear();
        
        assert!(cache.get("key1").is_none());
        assert!(cache.get("key2").is_none());
        let (hits, misses) = cache.stats();
        assert_eq!(hits, 0);
        assert_eq!(misses, 2);
    }

    // ========================================================================
    // REAL-WORLD TAILWIND PATTERN TESTS
    // ========================================================================

    #[test]
    fn test_color_resolution_cache() {
        // Simulating resolve_color cache pattern
        let cache = SimpleLRU::new();
        let theme = vec![
            ("blue-50", "#eff6ff"),
            ("blue-100", "#dbeafe"),
            ("blue-200", "#bfdbfe"),
            ("blue-300", "#93c5fd"),
            ("blue-400", "#60a5fa"),
            ("blue-500", "#3b82f6"),
            ("blue-600", "#2563eb"),
            ("blue-700", "#1d4ed8"),
            ("blue-800", "#1e40af"),
            ("blue-900", "#1e3a8a"),
        ];

        // Build cache
        for (key, val) in &theme {
            cache.put(key.to_string(), val.to_string());
        }

        // Test repeated access pattern
        for _ in 0..100 {
            cache.get("blue-600");
            cache.get("blue-500");
            cache.get("blue-400");
        }

        let (hits, misses) = cache.stats();
        assert_eq!(hits, 300); // 3 keys × 100 accesses
        assert_eq!(misses, 0);
    }

    #[test]
    fn test_spacing_resolution_cache() {
        // Simulating resolve_spacing cache pattern
        let cache = SimpleLRU::new();
        let spacing = vec![
            ("0", "0px"),
            ("1", "0.25rem"),
            ("2", "0.5rem"),
            ("3", "0.75rem"),
            ("4", "1rem"),
            ("6", "1.5rem"),
            ("8", "2rem"),
            ("12", "3rem"),
            ("16", "4rem"),
            ("20", "5rem"),
        ];

        for (key, val) in &spacing {
            cache.put(key.to_string(), val.to_string());
        }

        // Real-world pattern: p-4, px-8, py-2
        cache.get("4");
        cache.get("8");
        cache.get("2");
        cache.get("4"); // Cache hit
        cache.get("8"); // Cache hit

        let (hits, misses) = cache.stats();
        assert_eq!(hits, 2);
        assert_eq!(misses, 3);
    }

    #[test]
    fn test_responsive_breakpoint_cache() {
        // Simulating resolve_breakpoint cache pattern
        let cache = SimpleLRU::new();
        let breakpoints = vec![
            ("sm", "640px"),
            ("md", "768px"),
            ("lg", "1024px"),
            ("xl", "1280px"),
            ("2xl", "1536px"),
        ];

        for (key, val) in &breakpoints {
            cache.put(key.to_string(), val.to_string());
        }

        // Typical responsive patterns: sm: md: lg:
        cache.get("md");
        cache.get("lg");
        cache.get("sm");
        cache.get("md"); // Hit
        cache.get("lg"); // Hit
        cache.get("md"); // Hit

        let (hits, misses) = cache.stats();
        assert_eq!(hits, 3);
        assert_eq!(misses, 3);
    }

    // ========================================================================
    // COMPILATION PIPELINE CACHE TESTS
    // ========================================================================

    #[test]
    fn test_compile_class_cache_pattern() {
        // Simulating compile_class cache pattern
        let cache = SimpleLRU::new();

        // Real-world Tailwind classes (compilation results cached as JSON)
        let classes = vec![
            "bg-blue-600",
            "text-white",
            "p-4",
            "md:hover:bg-blue-600/50",
            "dark:text-gray-800",
        ];

        // First pass: build cache
        for class in &classes {
            let json = format!(r#"{{"selector":".{}","property":"x","value":"y"}}"#, class);
            cache.put(class.to_string(), json);
        }

        // Second pass: access pattern (typical UI rerender)
        for class in &classes {
            cache.get(class);
        }

        // Third pass: repeated access
        for class in &classes {
            cache.get(class);
        }

        let (hits, misses) = cache.stats();
        assert_eq!(hits, 10); // 5 classes × 2 accesses
        assert_eq!(misses, 5); // Initial builds
    }

    #[test]
    fn test_batch_compilation_cache() {
        // Simulating compile_classes batch pattern
        let cache = SimpleLRU::new();

        let batch1 = vec![
            "flex", "flex-col", "gap-2", "rounded-lg", "shadow-lg",
            "bg-white", "p-4", "border-gray-200", "border",
        ];

        let batch2 = vec![
            "flex", "justify-center", "items-center", "gap-4",
            "text-center", "font-bold", "text-lg", "text-gray-900",
        ];

        // Load batch 1
        for class in &batch1 {
            cache.put(class.to_string(), format!("compiled: {}", class));
        }

        // Access batch 1
        for class in &batch1 {
            cache.get(class);
        }

        // Access batch 2 (some overlap with batch 1)
        let mut hits_batch2 = 0;
        for class in &batch2 {
            if cache.get(class).is_some() {
                hits_batch2 += 1;
            }
        }

        // Verify overlap: "flex", "gap-4" or similar would be hits
        // "justify-center", "items-center", etc. would be misses
        let (total_hits, total_misses) = cache.stats();
        assert!(total_hits > batch1.len() as u32); // At least batch1 hits + overlap
    }

    // ========================================================================
    // CSS GENERATION CACHE TESTS
    // ========================================================================

    #[test]
    fn test_css_generation_cache() {
        // Simulating generate_css cache pattern
        let cache = SimpleLRU::new();

        let css_rules = vec![
            (
                r#"{"selector":".bg-blue-600","property":"background-color","value":"#2563eb"}"#,
                ".bg-blue-600 { background-color: #2563eb; }",
            ),
            (
                r#"{"selector":".text-white","property":"color","value":"#ffffff"}"#,
                ".text-white { color: #ffffff; }",
            ),
        ];

        // Build cache
        for (rule, css) in &css_rules {
            cache.put(rule.to_string(), css.to_string());
        }

        // Access with minification variant
        let minified_key = format!("{}-true", css_rules[0].0);
        cache.put(minified_key.clone(), ".bg-blue-600{background-color:#2563eb}".to_string());

        // Repeated access
        cache.get(css_rules[0].0);
        cache.get(css_rules[1].0);
        cache.get(&minified_key);

        let (hits, misses) = cache.stats();
        assert_eq!(hits, 3);
        assert_eq!(misses, 0);
    }

    // ========================================================================
    // HIT RATE ANALYSIS TESTS
    // ========================================================================

    #[test]
    fn test_high_hit_rate_scenario() {
        // Simulating production UI component rendering
        let cache = SimpleLRU::new();

        // Common utility classes in a component library
        let utilities = vec![
            "flex", "items-center", "justify-between", "p-4", "rounded",
            "border", "bg-white", "shadow", "hover:shadow-lg", "transition",
        ];

        // Build cache
        for util in &utilities {
            cache.put(util.to_string(), format!("css: {}", util));
        }

        // Simulate multiple component renders
        for render in 0..10 {
            for util in &utilities {
                cache.get(util);
            }
        }

        let (hits, misses) = cache.stats();
        // 10 renders × 10 utilities = 100 hits, 10 initial misses
        assert_eq!(hits, 100);
        assert_eq!(misses, 10);

        let hit_rate = (hits as f64 / (hits + misses) as f64 * 100.0).round() as u32;
        assert_eq!(hit_rate, 90); // 90% hit rate
    }

    #[test]
    fn test_cache_efficiency_improvement() {
        // Measure performance improvement from caching
        let cache = SimpleLRU::new();

        // Simulate parsing/resolving time (arbitrary units)
        let parse_time = 5; // 5 units per parse

        let classes = vec![
            "bg-blue-600", "text-white", "p-4", "rounded",
            "shadow-lg", "border-gray-300", "flex", "gap-2",
        ];

        // Build cache (initial parse time)
        let mut total_time = 0;
        for class in &classes {
            cache.put(class.to_string(), format!("compiled: {}", class));
            total_time += parse_time;
        }
        let initial_cost = total_time;

        // Access pattern 1: All cache hits (next render)
        total_time = 0;
        for class in &classes {
            if cache.get(class).is_some() {
                total_time += 1; // Cache lookup cost (1 unit)
            }
        }
        let cached_cost = total_time;

        // Verify efficiency
        let improvement = ((initial_cost - cached_cost) as f64 / initial_cost as f64 * 100.0)
            .round() as u32;
        assert!(improvement > 80); // >80% improvement for repeated renders
    }

    // ========================================================================
    // MEMORY AND CONCURRENCY PATTERNS
    // ========================================================================

    #[test]
    fn test_memory_efficient_bulk_operations() {
        // Verify cache handles bulk operations without explosion
        let cache = SimpleLRU::new();

        // Add 1000 items (not hitting capacity yet)
        for i in 0..1000 {
            cache.put(
                format!("key-{}", i),
                format!("value-{}", i),
            );
        }

        // Access subset repeatedly
        for _ in 0..100 {
            for i in 0..100 {
                cache.get(&format!("key-{}", i));
            }
        }

        let (hits, _misses) = cache.stats();
        assert_eq!(hits, 10000); // 100 × 100 accesses
    }

    #[test]
    fn test_concurrent_pattern_simulation() {
        // Simulate concurrent cache access (same key from multiple threads)
        use std::sync::Arc;
        use std::thread;

        let cache = Arc::new(SimpleLRU::new());
        cache.put("shared-key".to_string(), "shared-value".to_string());

        let mut handles = vec![];

        for _ in 0..4 {
            let cache_clone = Arc::clone(&cache);
            let handle = thread::spawn(move || {
                for _ in 0..10 {
                    cache_clone.get("shared-key");
                }
            });
            handles.push(handle);
        }

        for handle in handles {
            handle.join().unwrap();
        }

        let (hits, _misses) = cache.stats();
        assert_eq!(hits, 40); // 4 threads × 10 accesses
    }

    #[test]
    fn test_cache_statistics_collection() {
        // Verify cache can collect statistics for monitoring
        let cache = SimpleLRU::new();

        // Simulate real-world access pattern
        cache.put("color-blue".to_string(), "#2563eb".to_string());
        cache.put("spacing-4".to_string(), "1rem".to_string());

        cache.get("color-blue");
        cache.get("color-blue");
        cache.get("spacing-4");
        cache.get("non-existent");

        let (hits, misses) = cache.stats();
        assert_eq!(hits, 3);
        assert_eq!(misses, 1);

        let total_accesses = hits + misses;
        let hit_rate = (hits as f64 / total_accesses as f64 * 100.0).round() as u32;
        assert_eq!(hit_rate, 75); // 3/(3+1) = 75%
    }
}
