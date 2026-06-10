/// Week 8: Memory Profiler & Optimization Analysis
/// Tracks heap allocations, memory hotspots, and provides optimization recommendations

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::collections::HashMap;

/// Memory allocation statistics
#[derive(Debug, Clone)]
pub struct MemoryStats {
    pub total_allocated: u64,
    pub total_freed: u64,
    pub peak_usage: u64,
    pub current_usage: u64,
    pub allocation_count: u64,
    pub deallocation_count: u64,
}

impl MemoryStats {
    pub fn new() -> Self {
        Self {
            total_allocated: 0,
            total_freed: 0,
            peak_usage: 0,
            current_usage: 0,
            allocation_count: 0,
            deallocation_count: 0,
        }
    }

    pub fn efficiency_percent(&self) -> f64 {
        if self.total_allocated == 0 {
            0.0
        } else {
            (self.total_freed as f64 / self.total_allocated as f64) * 100.0
        }
    }
}

/// Tracks memory usage per cache layer
#[derive(Debug, Clone)]
pub struct CacheMemoryProfile {
    pub parse_cache_bytes: u64,
    pub resolve_cache_bytes: u64,
    pub compile_cache_bytes: u64,
    pub lazy_cache_bytes: u64,
    pub streaming_buffer_bytes: u64,
    pub adaptive_metadata_bytes: u64,
    pub total_bytes: u64,
}

impl CacheMemoryProfile {
    pub fn new() -> Self {
        Self {
            parse_cache_bytes: 0,
            resolve_cache_bytes: 0,
            compile_cache_bytes: 0,
            lazy_cache_bytes: 0,
            streaming_buffer_bytes: 0,
            adaptive_metadata_bytes: 0,
            total_bytes: 0,
        }
    }

    pub fn calculate_total(&mut self) {
        self.total_bytes = self.parse_cache_bytes
            + self.resolve_cache_bytes
            + self.compile_cache_bytes
            + self.lazy_cache_bytes
            + self.streaming_buffer_bytes
            + self.adaptive_metadata_bytes;
    }

    pub fn to_mb(&self) -> f64 {
        self.total_bytes as f64 / 1_024.0 / 1_024.0
    }

    pub fn largest_component(&self) -> (&'static str, u64) {
        let components = vec![
            ("parse_cache", self.parse_cache_bytes),
            ("resolve_cache", self.resolve_cache_bytes),
            ("compile_cache", self.compile_cache_bytes),
            ("lazy_cache", self.lazy_cache_bytes),
            ("streaming_buffer", self.streaming_buffer_bytes),
            ("adaptive_metadata", self.adaptive_metadata_bytes),
        ];

        components
            .into_iter()
            .max_by_key(|(_, bytes)| *bytes)
            .unwrap_or(("unknown", 0))
    }
}

/// Memory profiler for the cache system
pub struct MemoryProfiler {
    stats: Arc<AtomicU64>,
    hotspots: HashMap<String, u64>,
    cache_profile: CacheMemoryProfile,
}

impl MemoryProfiler {
    pub fn new() -> Self {
        Self {
            stats: Arc::new(AtomicU64::new(0)),
            hotspots: HashMap::new(),
            cache_profile: CacheMemoryProfile::new(),
        }
    }

    /// Record a memory allocation
    pub fn record_allocation(&mut self, label: &str, bytes: u64) {
        self.hotspots
            .entry(label.to_string())
            .and_modify(|e| *e += bytes)
            .or_insert(bytes);

        let current = self.stats.load(Ordering::Relaxed);
        self.stats.store(current + bytes, Ordering::Relaxed);
    }

    /// Record a memory deallocation
    pub fn record_deallocation(&mut self, bytes: u64) {
        let current = self.stats.load(Ordering::Relaxed);
        let new_val = if current >= bytes { current - bytes } else { 0 };
        self.stats.store(new_val, Ordering::Relaxed);
    }

    /// Update cache layer memory profile
    pub fn update_cache_profile(
        &mut self,
        parse: u64,
        resolve: u64,
        compile: u64,
        lazy: u64,
        streaming: u64,
        adaptive: u64,
    ) {
        self.cache_profile.parse_cache_bytes = parse;
        self.cache_profile.resolve_cache_bytes = resolve;
        self.cache_profile.compile_cache_bytes = compile;
        self.cache_profile.lazy_cache_bytes = lazy;
        self.cache_profile.streaming_buffer_bytes = streaming;
        self.cache_profile.adaptive_metadata_bytes = adaptive;
        self.cache_profile.calculate_total();
    }

    /// Get current memory usage in bytes
    pub fn current_usage_bytes(&self) -> u64 {
        self.stats.load(Ordering::Relaxed)
    }

    /// Get current memory usage in MB
    pub fn current_usage_mb(&self) -> f64 {
        self.current_usage_bytes() as f64 / 1_024.0 / 1_024.0
    }

    /// Get top memory hotspots
    pub fn get_hotspots(&self, top_n: usize) -> Vec<(String, u64)> {
        let mut items: Vec<_> = self.hotspots.iter().collect();
        items.sort_by_key(|&(_, v)| std::cmp::Reverse(*v));
        items
            .into_iter()
            .take(top_n)
            .map(|(k, v)| (k.clone(), *v))
            .collect()
    }

    /// Get cache memory profile
    pub fn cache_profile(&self) -> &CacheMemoryProfile {
        &self.cache_profile
    }

    /// Check if memory usage exceeds target
    pub fn exceeds_target(&self, target_mb: f64) -> bool {
        self.current_usage_mb() > target_mb
    }

    /// Get optimization recommendations
    pub fn get_recommendations(&self) -> Vec<String> {
        let mut recommendations = Vec::new();
        let usage_mb = self.current_usage_mb();

        // Recommendation 1: Check if over target
        if usage_mb > 10.0 {
            recommendations.push(format!(
                "Memory usage ({:.2} MB) exceeds 10 MB target. Consider reducing cache sizes.",
                usage_mb
            ));
        }

        // Recommendation 2: Check largest component
        let (largest, largest_bytes) = self.cache_profile.largest_component();
        let largest_mb = largest_bytes as f64 / 1_024.0 / 1_024.0;
        if largest_mb > 5.0 {
            recommendations.push(format!(
                "{} is {} MB (largest component). Consider LRU eviction tuning.",
                largest, largest_mb
            ));
        }

        // Recommendation 3: Check for fragmentation
        if self.hotspots.len() > 50 {
            recommendations.push(format!(
                "High allocation fragmentation ({} hotspots). Consider memory pooling.",
                self.hotspots.len()
            ));
        }

        // Recommendation 4: Streaming efficiency
        let streaming_mb = self.cache_profile.streaming_buffer_bytes as f64 / 1_024.0 / 1_024.0;
        if streaming_mb > 2.0 {
            recommendations.push(format!(
                "Streaming buffer is {} MB. Reduce batch size for lower peak memory.",
                streaming_mb
            ));
        }

        // Recommendation 5: Adaptive cache sizing
        if self.cache_profile.adaptive_metadata_bytes > 1_000_000 {
            recommendations.push(
                "Adaptive cache overhead is high. Review scaling thresholds.".to_string(),
            );
        }

        if recommendations.is_empty() {
            recommendations.push("Memory usage is within targets. No optimization needed.".to_string());
        }

        recommendations
    }
}

/// Optimization strategy analyzer
pub struct OptimizationAnalyzer;

impl OptimizationAnalyzer {
    /// Estimate optimal cache sizes based on memory budget
    pub fn estimate_optimal_sizes(budget_mb: f64) -> HashMap<String, u64> {
        let budget_bytes = (budget_mb * 1_024.0 * 1_024.0) as u64;

        // Allocate budget: 40% parse, 35% resolve, 25% compile
        let mut sizes = HashMap::new();
        sizes.insert("parse_cache".to_string(), budget_bytes * 40 / 100);
        sizes.insert("resolve_cache".to_string(), budget_bytes * 35 / 100);
        sizes.insert("compile_cache".to_string(), budget_bytes * 25 / 100);

        sizes
    }

    /// Calculate effective batch size for streaming
    pub fn optimal_batch_size(available_memory_mb: f64, item_size_bytes: u64) -> u64 {
        let available_bytes = (available_memory_mb * 1_024.0 * 1_024.0) as u64;
        (available_bytes / item_size_bytes).max(10) // Minimum 10 items
    }

    /// Estimate peak memory for compilation
    pub fn estimate_peak_memory(num_classes: u64, avg_class_size: u64) -> f64 {
        let overhead_multiplier = 1.5; // 50% overhead for metadata
        ((num_classes * avg_class_size) as f64 * overhead_multiplier) / 1_024.0 / 1_024.0
    }

    /// Check if streaming is more efficient than buffering
    pub fn should_use_streaming(total_items: u64, item_size_bytes: u64, batch_size: u64) -> bool {
        let buffering_memory = (total_items * item_size_bytes) as f64 / 1_024.0 / 1_024.0;
        let streaming_memory = (batch_size * item_size_bytes) as f64 / 1_024.0 / 1_024.0;

        // Use streaming if it saves >20% memory
        streaming_memory < (buffering_memory * 0.8)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_stats_efficiency() {
        let mut stats = MemoryStats::new();
        stats.total_allocated = 1000;
        stats.total_freed = 800;

        let efficiency = stats.efficiency_percent();
        assert!(efficiency > 79.0 && efficiency < 81.0); // ~80%
    }

    #[test]
    fn test_cache_memory_profile_total() {
        let mut profile = CacheMemoryProfile::new();
        profile.parse_cache_bytes = 1_000_000;
        profile.resolve_cache_bytes = 500_000;
        profile.compile_cache_bytes = 500_000;
        profile.calculate_total();

        assert_eq!(profile.total_bytes, 2_000_000);
    }

    #[test]
    fn test_memory_profiler_allocation() {
        let mut profiler = MemoryProfiler::new();
        profiler.record_allocation("test", 1_000_000);
        profiler.record_allocation("test", 500_000);

        assert_eq!(profiler.current_usage_bytes(), 1_500_000);
    }

    #[test]
    fn test_largest_cache_component() {
        let mut profile = CacheMemoryProfile::new();
        profile.parse_cache_bytes = 5_000_000;
        profile.resolve_cache_bytes = 3_000_000;
        profile.compile_cache_bytes = 2_000_000;

        let (name, bytes) = profile.largest_component();
        assert_eq!(name, "parse_cache");
        assert_eq!(bytes, 5_000_000);
    }

    #[test]
    fn test_memory_exceeds_target() {
        let mut profiler = MemoryProfiler::new();
        profiler.record_allocation("cache", 11_534_336); // ~11 MB

        assert!(profiler.exceeds_target(10.0));
    }

    #[test]
    fn test_optimal_cache_sizes() {
        let sizes = OptimizationAnalyzer::estimate_optimal_sizes(10.0);

        let parse = sizes["parse_cache"];
        let resolve = sizes["resolve_cache"];
        let compile = sizes["compile_cache"];

        // Should allocate according to percentages
        assert!(parse > resolve); // 40% > 35%
        assert!(resolve > compile); // 35% > 25%

        // Total should be close to 10 MB
        let total_mb = (parse + resolve + compile) as f64 / 1_024.0 / 1_024.0;
        assert!(total_mb > 9.9 && total_mb < 10.1);
    }

    #[test]
    fn test_optimal_batch_size() {
        let batch_size = OptimizationAnalyzer::optimal_batch_size(5.0, 1024);

        // 5 MB / 1 KB per item = ~5120 items
        assert!(batch_size > 4000);
        assert!(batch_size < 6000);
    }

    #[test]
    fn test_should_use_streaming() {
        let should_stream = OptimizationAnalyzer::should_use_streaming(100_000, 1024, 1000);

        // 100K items * 1KB = ~100 MB buffering vs 1K * 1KB = ~1 MB streaming
        // Should definitely use streaming (saves >95%)
        assert!(should_stream);
    }

    #[test]
    fn test_streaming_not_needed() {
        let should_stream = OptimizationAnalyzer::should_use_streaming(100, 1024, 1000);

        // Small dataset, no benefit from streaming
        assert!(!should_stream);
    }

    #[test]
    fn test_peak_memory_estimation() {
        let peak_mb = OptimizationAnalyzer::estimate_peak_memory(10_000, 1024);

        // 10K * 1KB * 1.5 overhead = ~15 MB
        assert!(peak_mb > 14.0 && peak_mb < 16.0);
    }

    #[test]
    fn test_profiler_hotspots() {
        let mut profiler = MemoryProfiler::new();
        profiler.record_allocation("parse", 5_000_000);
        profiler.record_allocation("resolve", 3_000_000);
        profiler.record_allocation("compile", 2_000_000);

        let hotspots = profiler.get_hotspots(2);
        assert_eq!(hotspots.len(), 2);
        assert_eq!(hotspots[0].0, "parse"); // Largest first
    }

    #[test]
    fn test_recommendations_under_target() {
        let mut profiler = MemoryProfiler::new();
        profiler.record_allocation("cache", 5_242_880); // ~5 MB
        profiler.update_cache_profile(2_000_000, 1_500_000, 1_000_000, 200_000, 400_000, 100_000);

        let recommendations = profiler.get_recommendations();
        assert!(recommendations
            .iter()
            .any(|r| r.contains("within targets")));
    }

    #[test]
    fn test_recommendations_over_target() {
        let mut profiler = MemoryProfiler::new();
        profiler.record_allocation("cache", 12_582_912); // ~12 MB (over 10 MB target)
        profiler.update_cache_profile(6_000_000, 4_000_000, 2_000_000, 200_000, 400_000, 100_000);

        let recommendations = profiler.get_recommendations();
        assert!(recommendations.iter().any(|r| r.contains("exceeds")));
    }

    #[test]
    fn test_memory_profile_to_mb() {
        let mut profile = CacheMemoryProfile::new();
        profile.parse_cache_bytes = 2_097_152; // 2 MB
        profile.resolve_cache_bytes = 1_048_576; // 1 MB
        profile.compile_cache_bytes = 1_048_576; // 1 MB
        profile.calculate_total();

        let total_mb = profile.to_mb();
        assert!(total_mb > 3.99 && total_mb < 4.01);
    }
}
