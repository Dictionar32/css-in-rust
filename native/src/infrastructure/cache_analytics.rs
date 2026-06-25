/// Phase 3: Cache Analytics & Metrics Layer
/// Real-time performance monitoring and optimization recommendations
///
/// Features:
/// - Cache hit/miss rate tracking
/// - Performance metrics collection
/// - Bottleneck identification
/// - Optimization recommendations
/// - Historical data tracking

use std::collections::VecDeque;
use std::time::{SystemTime, UNIX_EPOCH};

/// Performance metrics snapshot
#[derive(Debug, Clone)]
pub struct PerformanceSnapshot {
    pub timestamp: u64,
    pub hit_rate: f64,
    pub miss_rate: f64,
    pub avg_latency_ms: f64,
    pub p95_latency_ms: f64,
    pub p99_latency_ms: f64,
    pub throughput_ops_sec: f64,
    pub memory_mb: f64,
    pub error_rate: f64,
}

/// Cache analytics engine
pub struct CacheAnalytics {
    snapshots: VecDeque<PerformanceSnapshot>,
    current_stats: CacheStatistics,
    max_history: usize,
    window_size_seconds: u64,
}

#[derive(Debug, Clone, Default)]
struct CacheStatistics {
    hits: u64,
    misses: u64,
    errors: u64,
    total_operations: u64,
    latencies: VecDeque<u64>, // in microseconds
    last_snapshot_time: u64,
}

impl CacheAnalytics {
    /// Create new analytics engine
    pub fn new(max_history: usize, window_size_seconds: u64) -> Self {
        Self {
            snapshots: VecDeque::with_capacity(max_history),
            current_stats: CacheStatistics::default(),
            max_history,
            window_size_seconds,
        }
    }

    /// Record cache hit
    pub fn record_hit(&mut self, latency_us: u64) {
        self.current_stats.hits += 1;
        self.current_stats.total_operations += 1;
        self.current_stats.latencies.push_back(latency_us);
        self.trim_latencies();
    }

    /// Record cache miss
    pub fn record_miss(&mut self, latency_us: u64) {
        self.current_stats.misses += 1;
        self.current_stats.total_operations += 1;
        self.current_stats.latencies.push_back(latency_us);
        self.trim_latencies();
    }

    /// Record error
    pub fn record_error(&mut self) {
        self.current_stats.errors += 1;
        self.current_stats.total_operations += 1;
    }

    /// Take performance snapshot
    pub fn snapshot(&mut self, memory_mb: f64) -> PerformanceSnapshot {
        let hits = self.current_stats.hits as f64;
        let misses = self.current_stats.misses as f64;
        let total = hits + misses;
        let errors = self.current_stats.errors as f64;
        let total_ops = self.current_stats.total_operations as f64;

        let hit_rate = if total > 0.0 { (hits / total) * 100.0 } else { 0.0 };
        let miss_rate = if total > 0.0 { (misses / total) * 100.0 } else { 0.0 };
        let error_rate = if total_ops > 0.0 { (errors / total_ops) * 100.0 } else { 0.0 };

        let (avg_latency_ms, p95_latency_ms, p99_latency_ms) = self.calculate_latencies();

        let now = current_timestamp_seconds();
        let elapsed = if self.current_stats.last_snapshot_time > 0 {
            now - self.current_stats.last_snapshot_time
        } else {
            1
        };

        let throughput = if elapsed > 0 {
            total_ops / elapsed as f64
        } else {
            0.0
        };

        let snapshot = PerformanceSnapshot {
            timestamp: now,
            hit_rate,
            miss_rate,
            avg_latency_ms,
            p95_latency_ms,
            p99_latency_ms,
            throughput_ops_sec: throughput,
            memory_mb,
            error_rate,
        };

        self.snapshots.push_back(snapshot.clone());
        if self.snapshots.len() > self.max_history {
            self.snapshots.pop_front();
        }

        // Evict snapshots older than the window
        let window_cutoff = now.saturating_sub(self.window_size_seconds);
        while self.snapshots.front().map_or(false, |s| s.timestamp < window_cutoff) {
            self.snapshots.pop_front();
        }

        self.current_stats.last_snapshot_time = now;
        snapshot
    }

    /// Get current metrics
    pub fn get_current_metrics(&self) -> CurrentMetrics {
        let hits = self.current_stats.hits as f64;
        let misses = self.current_stats.misses as f64;
        let total = hits + misses;

        CurrentMetrics {
            total_hits: self.current_stats.hits,
            total_misses: self.current_stats.misses,
            total_errors: self.current_stats.errors,
            hit_rate: if total > 0.0 { (hits / total) * 100.0 } else { 0.0 },
            operations_since_start: self.current_stats.total_operations,
        }
    }

    /// Get optimization recommendations
    pub fn get_recommendations(&self) -> Vec<OptimizationRecommendation> {
        let mut recommendations = Vec::new();

        if let Some(latest) = self.snapshots.back() {
            // Low hit rate recommendation
            if latest.hit_rate < 70.0 {
                recommendations.push(OptimizationRecommendation {
                    category: RecommendationCategory::CacheSize,
                    severity: Severity::High,
                    message: format!(
                        "Cache hit rate is {:.1}%. Consider increasing cache size.",
                        latest.hit_rate
                    ),
                    expected_improvement: "5-15% improvement".to_string(),
                });
            }

            // High latency recommendation
            if latest.p99_latency_ms > 100.0 {
                recommendations.push(OptimizationRecommendation {
                    category: RecommendationCategory::Performance,
                    severity: Severity::Medium,
                    message: format!(
                        "P99 latency is {:.1}ms. Consider cache warming or batch optimization.",
                        latest.p99_latency_ms
                    ),
                    expected_improvement: "20-30% latency reduction".to_string(),
                });
            }

            // Memory optimization recommendation
            if latest.memory_mb > 8.0 {
                recommendations.push(OptimizationRecommendation {
                    category: RecommendationCategory::Memory,
                    severity: Severity::Medium,
                    message: format!(
                        "Memory usage is {:.1}MB. Consider enabling cache eviction or compression.",
                        latest.memory_mb
                    ),
                    expected_improvement: "10-30% memory reduction".to_string(),
                });
            }

            // Error rate recommendation
            if latest.error_rate > 0.1 {
                recommendations.push(OptimizationRecommendation {
                    category: RecommendationCategory::Reliability,
                    severity: Severity::High,
                    message: format!(
                        "Error rate is {:.2}%. Check cache configuration and error handling.",
                        latest.error_rate
                    ),
                    expected_improvement: "Error resolution".to_string(),
                });
            }
        }

        recommendations
    }

    /// Get historical trends
    pub fn get_trends(&self) -> HistoricalTrends {
        if self.snapshots.is_empty() {
            return HistoricalTrends::default();
        }

        let hit_rates: Vec<f64> = self.snapshots.iter().map(|s| s.hit_rate).collect();
        let latencies: Vec<f64> = self.snapshots.iter().map(|s| s.avg_latency_ms).collect();
        let throughputs: Vec<f64> = self.snapshots.iter().map(|s| s.throughput_ops_sec).collect();

        let avg_hit_rate = hit_rates.iter().sum::<f64>() / hit_rates.len() as f64;
        let avg_latency = latencies.iter().sum::<f64>() / latencies.len() as f64;
        let avg_throughput = throughputs.iter().sum::<f64>() / throughputs.len() as f64;

        let trend_hit_rate = if hit_rates.len() >= 2 {
            hit_rates[hit_rates.len() - 1] - hit_rates[0]
        } else {
            0.0
        };

        let trend_latency = if latencies.len() >= 2 {
            latencies[latencies.len() - 1] - latencies[0]
        } else {
            0.0
        };

        HistoricalTrends {
            avg_hit_rate,
            avg_latency_ms: avg_latency,
            avg_throughput_ops_sec: avg_throughput,
            hit_rate_trend: trend_hit_rate,
            latency_trend_ms: trend_latency,
            snapshot_count: self.snapshots.len(),
        }
    }

    /// Calculate latency percentiles
    fn calculate_latencies(&self) -> (f64, f64, f64) {
        if self.current_stats.latencies.is_empty() {
            return (0.0, 0.0, 0.0);
        }

        let mut sorted: Vec<u64> = self.current_stats.latencies.iter().cloned().collect();
        sorted.sort_unstable();

        let avg = sorted.iter().sum::<u64>() as f64 / sorted.len() as f64 / 1000.0;
        let p95_idx = (sorted.len() * 95 / 100).max(0).min(sorted.len() - 1);
        let p99_idx = (sorted.len() * 99 / 100).max(0).min(sorted.len() - 1);

        let p95 = sorted[p95_idx] as f64 / 1000.0;
        let p99 = sorted[p99_idx] as f64 / 1000.0;

        (avg, p95, p99)
    }

    /// Trim old latencies to keep memory bounded
    fn trim_latencies(&mut self) {
        const MAX_LATENCIES: usize = 10000;
        while self.current_stats.latencies.len() > MAX_LATENCIES {
            self.current_stats.latencies.pop_front();
        }
    }
}

#[derive(Debug, Clone)]
pub struct CurrentMetrics {
    pub total_hits: u64,
    pub total_misses: u64,
    pub total_errors: u64,
    pub hit_rate: f64,
    pub operations_since_start: u64,
}

#[derive(Debug, Clone)]
pub struct OptimizationRecommendation {
    pub category: RecommendationCategory,
    pub severity: Severity,
    pub message: String,
    pub expected_improvement: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RecommendationCategory {
    CacheSize,
    Performance,
    Memory,
    Reliability,
    Batching,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Default)]
pub struct HistoricalTrends {
    pub avg_hit_rate: f64,
    pub avg_latency_ms: f64,
    pub avg_throughput_ops_sec: f64,
    pub hit_rate_trend: f64,
    pub latency_trend_ms: f64,
    pub snapshot_count: usize,
}

fn current_timestamp_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_analytics_hits_misses() {
        let mut analytics = CacheAnalytics::new(100, 60);

        analytics.record_hit(100);
        analytics.record_hit(150);
        analytics.record_miss(500);

        let metrics = analytics.get_current_metrics();
        assert_eq!(metrics.total_hits, 2);
        assert_eq!(metrics.total_misses, 1);
    }

    #[test]
    fn test_cache_analytics_snapshot() {
        let mut analytics = CacheAnalytics::new(100, 60);

        analytics.record_hit(100);
        analytics.record_hit(200);
        analytics.record_miss(500);

        let snapshot = analytics.snapshot(4.5);
        assert!(snapshot.hit_rate > 0.0);
        assert_eq!(snapshot.memory_mb, 4.5);
    }

    #[test]
    fn test_cache_analytics_recommendations() {
        let mut analytics = CacheAnalytics::new(100, 60);

        // Simulate low hit rate
        for _ in 0..30 {
            analytics.record_miss(500);
        }
        for _ in 0..10 {
            analytics.record_hit(100);
        }

        analytics.snapshot(9.5);
        let recommendations = analytics.get_recommendations();
        
        assert!(!recommendations.is_empty());
    }

    #[test]
    fn test_cache_analytics_trends() {
        let mut analytics = CacheAnalytics::new(100, 60);

        // First snapshot
        analytics.record_hit(100);
        analytics.snapshot(4.0);

        // Second snapshot
        analytics.record_hit(100);
        analytics.record_hit(100);
        analytics.snapshot(4.5);

        let trends = analytics.get_trends();
        assert_eq!(trends.snapshot_count, 2);
    }

    #[test]
    fn test_cache_analytics_error_tracking() {
        let mut analytics = CacheAnalytics::new(100, 60);

        analytics.record_hit(100);
        analytics.record_error();
        analytics.record_error();

        let metrics = analytics.get_current_metrics();
        assert_eq!(metrics.total_errors, 2);
    }
}
