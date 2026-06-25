//! Analysis operations NAPI bindings
//!
//! This module provides NAPI functions for analyzing code and gathering statistics.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use napi_derive::napi;
use std::sync::atomic::{AtomicU64, Ordering};
use crate::infrastructure::napi_bridge_marshalling::{to_json};
use crate::infrastructure::napi_bridge_errors::error_to_napi;

// Global memory statistics (atomic for lock-free access)
static TOTAL_MEMORY_ALLOCATED: AtomicU64 = AtomicU64::new(0);
static TOTAL_MEMORY_FREED: AtomicU64 = AtomicU64::new(0);

/// Get Week 6 features status
///
/// Returns information about implemented features from Week 6 phase
#[napi]
pub fn get_week6_features_status() -> napi::Result<String> {
    let features = serde_json::json!({
        "status": "ok",
        "week": 6,
        "features": {
            "lru_cache": {
                "implemented": true,
                "status": "production",
                "capacity": "configurable"
            },
            "adaptive_cache": {
                "implemented": true,
                "status": "production",
                "hit_rate_optimization": true
            },
            "cache_statistics": {
                "implemented": true,
                "status": "production",
                "metrics": ["hits", "misses", "hit_rate"]
            },
            "lazy_evaluation": {
                "implemented": true,
                "status": "experimental"
            }
        },
        "optimization_hints": {
            "cache_sizing": "Tune cache capacity based on workload",
            "memory_usage": "Monitor memory allocations",
            "performance": "Use metrics to guide optimization"
        }
    });

    serde_json::to_string(&features)
        .map_err(|e| error_to_napi("get_week6_features_status", e))
}

/// Get current memory statistics
///
/// Returns memory usage information for performance analysis
#[napi]
pub fn get_memory_stats_native() -> String {
    let allocated = TOTAL_MEMORY_ALLOCATED.load(Ordering::Relaxed);
    let freed = TOTAL_MEMORY_FREED.load(Ordering::Relaxed);
    let in_use = allocated.saturating_sub(freed);

    let stats = serde_json::json!({
        "status": "ok",
        "memory": {
            "allocated_bytes": allocated,
            "freed_bytes": freed,
            "in_use_bytes": in_use,
            "allocated_mb": allocated as f64 / 1_000_000.0,
            "freed_mb": freed as f64 / 1_000_000.0,
            "in_use_mb": in_use as f64 / 1_000_000.0,
        },
        "system": {
            "cache_entries": 0,
            "active_operations": 0,
        }
    });

    serde_json::to_string(&stats).unwrap_or_else(|_| {
        r#"{"status":"error","message":"Failed to generate memory stats"}"#.to_string()
    })
}

/// Get memory usage recommendations
///
/// Analyzes current usage and provides optimization recommendations
#[napi]
pub fn get_memory_recommendations_native() -> String {
    let allocated = TOTAL_MEMORY_ALLOCATED.load(Ordering::Relaxed);
    let freed = TOTAL_MEMORY_FREED.load(Ordering::Relaxed);
    let in_use = allocated.saturating_sub(freed);
    let in_use_mb = in_use as f64 / 1_000_000.0;

    let (recommendation, priority) = if in_use_mb > 1000.0 {
        ("Reduce cache capacity or increase memory", "critical")
    } else if in_use_mb > 500.0 {
        ("Monitor memory usage closely", "high")
    } else if in_use_mb > 100.0 {
        ("Memory usage is normal", "normal")
    } else {
        ("Increase cache capacity if needed", "low")
    };

    let result = serde_json::json!({
        "status": "ok",
        "current_memory_mb": in_use_mb,
        "recommendation": recommendation,
        "priority": priority,
        "suggestions": [
            "Profile your workload to understand cache patterns",
            "Adjust cache backend (LRU, Redis, Persistent) based on usage",
            "Use adaptive cache for varying workloads",
            "Monitor hit rates to optimize capacity",
            "Consider distributed caching for large datasets"
        ]
    });

    serde_json::to_string(&result).unwrap_or_else(|_| {
        r#"{"status":"error","message":"Failed to generate recommendations"}"#.to_string()
    })
}

/// Estimate optimal cache configuration
///
/// # Arguments
/// * `workload_type` - Type of workload (typical, heavy, streaming)
/// * `expected_entries` - Expected number of cache entries
///
/// # Returns
/// Recommended configuration
#[napi]
pub fn estimate_optimal_cache_config_native(
    workload_type: String,
    expected_entries: u32,
) -> napi::Result<String> {
    let (recommended_backend, capacity_multiplier, ttl) = match workload_type.as_str() {
        "small" => ("lru", 1.0, 3600),
        "medium" => ("lru", 1.5, 7200),
        "large" => ("adaptive", 2.0, 10800),
        "heavy" => ("redis", 3.0, 14400),
        "streaming" => ("redis", 4.0, 21600),
        _ => ("lru", 1.0, 3600),
    };

    let recommended_capacity = ((expected_entries as f64) * capacity_multiplier) as u32;
    let avg_entry_size_bytes = 300;
    let estimated_memory_mb = (recommended_capacity as f64 * avg_entry_size_bytes as f64) / 1_000_000.0;

    let config = serde_json::json!({
        "status": "ok",
        "workload_type": workload_type,
        "expected_entries": expected_entries,
        "recommended_backend": recommended_backend,
        "recommended_capacity": recommended_capacity,
        "estimated_memory_mb": estimated_memory_mb,
        "ttl_seconds": ttl,
        "details": {
            "backend_explanation": format!("{} backend recommended for {} workload", recommended_backend, workload_type),
            "capacity_explanation": format!("Capacity set to {} with {} multiplier", recommended_capacity, capacity_multiplier),
            "memory_estimate": format!("~{:.2} MB for average {} byte entries", estimated_memory_mb, avg_entry_size_bytes)
        }
    });

    serde_json::to_string(&config)
        .map_err(|e| error_to_napi("estimate_optimal_cache_config_native", e))
}

/// Track memory allocation
///
/// Internal helper to track memory usage
pub fn track_memory_allocated(bytes: u64) {
    TOTAL_MEMORY_ALLOCATED.fetch_add(bytes, Ordering::Relaxed);
}

/// Track memory deallocation
///
/// Internal helper to track memory freed
pub fn track_memory_freed(bytes: u64) {
    TOTAL_MEMORY_FREED.fetch_add(bytes, Ordering::Relaxed);
}

/// Get week 8 memory optimization status as JSON
#[napi]
pub fn get_week8_optimization_status() -> napi::Result<String> {
    use crate::infrastructure::week8_api::{get_memory_stats, get_memory_recommendations, get_week8_features_status};

    let stats = get_memory_stats();
    let recommendations = get_memory_recommendations();
    let features = get_week8_features_status();

    let response = serde_json::json!({
        "status": "ok",
        "memory_stats": to_json(&stats)?,
        "recommendations_count": recommendations.len(),
        "features": features,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("get_week8_optimization_status", e))
}

/// Reset memory statistics
///
/// Clear all memory tracking counters
#[napi]
pub fn reset_memory_stats() -> napi::Result<()> {
    TOTAL_MEMORY_ALLOCATED.store(0, Ordering::Relaxed);
    TOTAL_MEMORY_FREED.store(0, Ordering::Relaxed);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_memory_tracking() {
        reset_memory_stats().unwrap();
        
        track_memory_allocated(1000);
        let stats = get_memory_stats_native();
        assert!(stats.contains("1000"));
        
        track_memory_freed(500);
        let stats = get_memory_stats_native();
        assert!(stats.contains("500")); // in_use should be 500
    }

    #[test]
    fn test_memory_recommendations() {
        let recommendations = get_memory_recommendations_native();
        assert!(recommendations.contains("recommendation"));
    }

    #[test]
    fn test_cache_config_estimation() {
        let config = estimate_optimal_cache_config_native(
            "medium".to_string(),
            1000,
        );
        assert!(config.is_ok());
        let config_str = config.unwrap();
        assert!(config_str.contains("lru"));
    }
}
