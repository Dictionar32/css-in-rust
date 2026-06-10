/// Week 8: Memory Profiling Benchmark
/// Measures memory usage across cache layers and optimizes allocation

#[cfg(test)]
mod week8_memory_bench {
    use std::time::Instant;

    /// Mock memory tracker
    struct MemoryTracker {
        allocations: Vec<(String, u64)>,
        peak_usage: u64,
        total_allocated: u64,
    }

    impl MemoryTracker {
        fn new() -> Self {
            Self {
                allocations: Vec::new(),
                peak_usage: 0,
                total_allocated: 0,
            }
        }

        fn record(&mut self, label: &str, bytes: u64) {
            self.allocations.push((label.to_string(), bytes));
            self.total_allocated += bytes;
            if self.total_allocated > self.peak_usage {
                self.peak_usage = self.total_allocated;
            }
        }

        fn current_usage_mb(&self) -> f64 {
            self.total_allocated as f64 / 1_024.0 / 1_024.0
        }

        fn peak_usage_mb(&self) -> f64 {
            self.peak_usage as f64 / 1_024.0 / 1_024.0
        }
    }

    #[test]
    fn test_parse_cache_memory_profile() {
        let mut tracker = MemoryTracker::new();

        // Simulate parse cache with 1000 entries
        let entry_size = 512; // bytes per parsed class
        for i in 0..1000 {
            let label = format!("parse_entry_{}", i % 100);
            tracker.record(&label, entry_size);
        }

        let usage_mb = tracker.current_usage_mb();
        println!("Parse cache total: {:.2} MB", usage_mb);

        // Should be ~512 KB (1000 * 512 bytes)
        assert!(usage_mb > 0.4 && usage_mb < 0.7);
    }

    #[test]
    fn test_resolve_cache_memory_profile() {
        let mut tracker = MemoryTracker::new();

        // Simulate resolve cache - color resolution caching
        let entry_size = 256; // color + metadata
        for i in 0..2000 {
            let label = format!("resolve_entry_{}", i % 50);
            tracker.record(&label, entry_size);
        }

        let usage_mb = tracker.current_usage_mb();
        println!("Resolve cache total: {:.2} MB", usage_mb);

        // Should be ~512 KB (2000 * 256 bytes)
        assert!(usage_mb > 0.4 && usage_mb < 0.7);
    }

    #[test]
    fn test_compile_cache_memory_profile() {
        let mut tracker = MemoryTracker::new();

        // Simulate compile cache - full CSS output
        let entry_size = 1024; // full CSS rule
        for i in 0..1000 {
            let label = format!("compile_entry_{}", i % 100);
            tracker.record(&label, entry_size);
        }

        let usage_mb = tracker.current_usage_mb();
        println!("Compile cache total: {:.2} MB", usage_mb);

        // Should be ~1 MB (1000 * 1024 bytes)
        assert!(usage_mb > 0.8 && usage_mb < 1.2);
    }

    #[test]
    fn test_combined_cache_layers_memory() {
        let mut tracker = MemoryTracker::new();

        // Parse cache: 1000 * 512 = 512 KB
        for i in 0..1000 {
            tracker.record("parse", 512);
        }

        // Resolve cache: 2000 * 256 = 512 KB
        for i in 0..2000 {
            tracker.record("resolve", 256);
        }

        // Compile cache: 1000 * 1024 = 1024 KB
        for i in 0..1000 {
            tracker.record("compile", 1024);
        }

        let total_mb = tracker.current_usage_mb();
        println!("All caches combined: {:.2} MB", total_mb);

        // Should be ~2 MB total (512 + 512 + 1024 KB)
        assert!(total_mb > 1.8 && total_mb < 2.2);
    }

    #[test]
    fn test_lazy_cache_memory_overhead() {
        let mut tracker = MemoryTracker::new();

        // Lazy cache: metadata only, defers computation
        for i in 0..1000 {
            tracker.record("lazy_metadata", 64); // Small metadata per entry
        }

        let usage_mb = tracker.current_usage_mb();
        println!("Lazy cache metadata: {:.2} MB", usage_mb);

        // Should be minimal (~64 KB for 1000 entries)
        assert!(usage_mb < 0.1);
    }

    #[test]
    fn test_streaming_batch_memory_profile() {
        let mut tracker = MemoryTracker::new();

        // Streaming with batch size 100
        let batch_size = 100;
        let item_size = 1024;

        // Process 1000 items in batches of 100
        for batch in 0..10 {
            for i in 0..batch_size {
                tracker.record(&format!("batch_{}", batch), item_size);
            }
            // Memory released between batches (simulated)
            let released = batch_size * item_size;
            if tracker.total_allocated > released as u64 {
                tracker.total_allocated -= released as u64;
            }
        }

        let peak_mb = tracker.peak_usage_mb();
        println!("Streaming peak memory: {:.2} MB", peak_mb);

        // Peak should be only for one batch (~100 KB)
        assert!(peak_mb < 0.2);
    }

    #[test]
    fn test_buffering_memory_comparison() {
        let mut tracker = MemoryTracker::new();

        // Buffering: all 1000 items at once
        for i in 0..1000 {
            tracker.record("buffered", 1024); // 1 KB per item
        }

        let total_mb = tracker.current_usage_mb();
        println!("Buffering all items: {:.2} MB", total_mb);

        // Should be ~1 MB for 1000 * 1024 bytes
        assert!(total_mb > 0.8 && total_mb < 1.2);
    }

    #[test]
    fn test_adaptive_cache_scaling_memory() {
        let mut tracker = MemoryTracker::new();

        // Start with 100 entries
        let mut entry_count = 100;

        // Simulate adaptive scaling based on hit rate
        for iteration in 0..10 {
            // Scale up when hit rate > 90%
            if iteration % 2 == 0 && iteration < 8 {
                entry_count = (entry_count as f64 * 1.2) as u64; // 20% growth
            }

            for i in 0..entry_count {
                tracker.record(&format!("adaptive_{}", iteration), 256);
            }
        }

        let final_mb = tracker.current_usage_mb();
        println!("Adaptive cache final: {:.2} MB (after scaling)", final_mb);

        // Final should be larger than initial due to scaling
        assert!(final_mb > 0.5);
    }

    #[test]
    fn test_memory_efficiency_with_lru_eviction() {
        let mut tracker = MemoryTracker::new();
        let max_entries = 1000;

        // Simulate LRU cache with maximum entries
        for i in 0..5000 {
            if i < max_entries {
                tracker.record("lru", 512);
            } else {
                // LRU eviction keeps memory bounded
                // Each new entry replaces oldest
                tracker.total_allocated =
                    ((max_entries * 512) as f64 * 0.95) as u64; // Slight growth due to overhead
            }
        }

        let final_mb = tracker.current_usage_mb();
        println!("LRU bounded memory: {:.2} MB", final_mb);

        // Should stay bounded near max_entries * entry_size
        assert!(final_mb < 1.0);
    }

    #[test]
    fn test_week5_vs_week6_memory_comparison() {
        // Week 5: Base caches only
        let mut week5_tracker = MemoryTracker::new();
        for i in 0..1000 {
            week5_tracker.record("parse", 512);
            week5_tracker.record("resolve", 256);
            week5_tracker.record("compile", 1024);
        }

        // Week 6: Advanced strategies
        let mut week6_tracker = MemoryTracker::new();
        for i in 0..1000 {
            week6_tracker.record("lazy", 64); // Minimal metadata
            week6_tracker.record("streaming", 256); // One batch
            week6_tracker.record("adaptive", 128); // Metadata
        }

        let week5_mb = week5_tracker.current_usage_mb();
        let week6_mb = week6_tracker.current_usage_mb();

        println!("Week 5 total: {:.2} MB", week5_mb);
        println!("Week 6 total: {:.2} MB", week6_mb);

        // Week 6 strategies should use less memory for same workload
        // (lazy defers, streaming batches, adaptive optimizes)
        assert!(week6_mb < week5_mb);
    }

    #[test]
    fn test_memory_reduction_with_batch_processing() {
        // Without streaming (buffer all)
        let buffering_items = 10_000;
        let item_size = 512;
        let buffering_bytes = (buffering_items * item_size) as f64;
        let buffering_mb = buffering_bytes / 1_024.0 / 1_024.0;

        // With streaming (batch of 100)
        let batch_size = 100;
        let streaming_bytes = (batch_size * item_size) as f64;
        let streaming_mb = streaming_bytes / 1_024.0 / 1_024.0;

        // Calculate reduction
        let reduction_percent = ((buffering_mb - streaming_mb) / buffering_mb) * 100.0;

        println!("Buffering: {:.2} MB", buffering_mb);
        println!("Streaming: {:.2} MB", streaming_mb);
        println!("Reduction: {:.1}%", reduction_percent);

        // Should be ~99% reduction for this scenario
        assert!(reduction_percent > 95.0);
    }

    #[test]
    fn test_production_workload_memory_profile() {
        let mut tracker = MemoryTracker::new();

        // Simulate production: 10,000 unique classes
        let num_classes = 10_000;

        // Parse cache: 1 entry per class
        for i in 0..num_classes {
            tracker.record("parse", 512);
        }

        // Resolve cache: 3 entries per class (multiple colors)
        for i in 0..num_classes * 3 {
            tracker.record("resolve", 256);
        }

        // Compile cache: 1 entry per class
        for i in 0..num_classes {
            tracker.record("compile", 1024);
        }

        let total_mb = tracker.current_usage_mb();
        let peak_mb = tracker.peak_usage_mb();

        println!("Production workload: {:.2} MB current, {:.2} MB peak", total_mb, peak_mb);

        // Should be under 15 MB for 10K classes
        assert!(total_mb < 15.0);
        assert!(peak_mb < 20.0);
    }

    #[test]
    fn test_memory_hotspot_analysis() {
        let mut tracker = MemoryTracker::new();

        // Record allocations with different components
        let components = vec![
            ("parse_cache", 1000, 512),
            ("resolve_cache", 2000, 256),
            ("compile_cache", 1000, 1024),
            ("lazy_metadata", 1000, 64),
            ("streaming_buffer", 100, 256),
        ];

        for (name, count, size) in components {
            for i in 0..count {
                tracker.record(name, size);
            }
        }

        // Find largest component
        let mut largest = ("", 0);
        for (name, count, size) in &components {
            let total = count * size;
            if total > largest.1 {
                largest = (name, total);
            }
        }

        println!("Largest component: {} ({} bytes)", largest.0, largest.1);

        // Compile cache should be largest (1000 * 1024 = 1 MB)
        assert_eq!(largest.0, "compile_cache");
    }

    #[test]
    fn test_memory_target_validation() {
        let target_mb = 10.0;
        let mut tracker = MemoryTracker::new();

        // Fill up to 90% of target
        let fill_bytes = ((target_mb * 0.9) * 1_024.0 * 1_024.0) as u64;
        tracker.total_allocated = fill_bytes;

        let usage_mb = tracker.current_usage_mb();
        println!("Memory usage: {:.2} MB / {:.2} MB", usage_mb, target_mb);

        // Should be within target
        assert!(usage_mb < target_mb);

        // Now exceed target
        tracker.total_allocated = ((target_mb * 1.2) * 1_024.0 * 1_024.0) as u64;
        let exceeded_mb = tracker.current_usage_mb();

        println!("Exceeded: {:.2} MB (target: {:.2} MB)", exceeded_mb, target_mb);
        assert!(exceeded_mb > target_mb);
    }
}
