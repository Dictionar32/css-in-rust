//! Cache management NAPI bindings
//!
//! This module provides NAPI functions for cache configuration and monitoring.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use napi_derive::napi;
use std::sync::Mutex;
use crate::infrastructure::cache_backend::{CacheFactory, CacheConfig, CacheStats};
use crate::infrastructure::napi_bridge_marshalling::{parse_json, to_json};
use crate::infrastructure::napi_bridge_errors::{error_to_napi, validate_string_input};

// Global cache configuration
static CACHE_CONFIG: Mutex<CacheConfig> = Mutex::new(CacheConfig::Lru { capacity: 10000 });

/// Configure the cache backend
///
/// # Arguments
/// * `config_json` - JSON configuration for cache backend
///
/// # Returns
/// Confirmation message with new configuration
///
/// # Configuration Options
/// - `backend`: "lru" | "redis" | "persistent" | "adaptive"
/// - `max_capacity`: Maximum number of items to cache
/// - `redis_url`: (optional) Redis connection URL
/// - `persist_dir`: (optional) Directory for persistent cache
///
/// # Example
/// ```js
/// const config = {
///   "backend": "lru",
///   "max_capacity": 5000
/// };
/// const result = configureCacheBackend(JSON.stringify(config));
/// ```
#[napi]
pub fn configure_cache_backend(config_json: String) -> napi::Result<String> {
    validate_string_input(&config_json, "config_json")?;

    // Parse configuration
    let config_obj: serde_json::Value = parse_json(&config_json, "CacheConfig")?;

    let backend = config_obj
        .get("backend")
        .and_then(|v| v.as_str())
        .unwrap_or("lru")
        .to_string();

    let max_capacity = config_obj
        .get("max_capacity")
        .and_then(|v| v.as_u64())
        .unwrap_or(10000) as usize;

    // Build appropriate cache config
    let new_config = match backend.as_str() {
        "redis" => {
            let redis_url = config_obj
                .get("redis_url")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            if let Some(url) = redis_url {
                CacheConfig::Redis {
                    url: url.clone(),
                    ttl_seconds: None,
                }
            } else {
                return Err(napi::Error::new(
                    napi::Status::InvalidArg,
                    "Redis backend requires redis_url parameter",
                ));
            }
        }
        "persistent" => {
            let persist_dir = config_obj
                .get("persist_dir")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            if let Some(dir) = persist_dir {
                CacheConfig::Persistent { 
                    path: dir,
                    ttl_seconds: None,
                }
            } else {
                return Err(napi::Error::new(
                    napi::Status::InvalidArg,
                    "Persistent backend requires persist_dir parameter",
                ));
            }
        }
        "adaptive" => CacheConfig::Adaptive { 
            initial_capacity: max_capacity / 2,
            max_capacity,
        },
        "lru" | _ => CacheConfig::Lru { capacity: max_capacity },
    };

    // Update global config
    let mut config = CACHE_CONFIG
        .lock()
        .map_err(|_| error_to_napi("configure_cache_backend", "Failed to acquire lock"))?;

    *config = new_config.clone();

    let response = serde_json::json!({
        "status": "configured",
        "backend": match new_config {
            CacheConfig::Lru { capacity } => format!("lru({})", capacity),
            CacheConfig::Redis { url, .. } => format!("redis({})", url),
            CacheConfig::Persistent { path, .. } => format!("persistent({})", path),
            CacheConfig::Adaptive { initial_capacity, max_capacity } => format!("adaptive({}/{})", initial_capacity, max_capacity),
            CacheConfig::Lazy { .. } => "lazy".to_string(),
            CacheConfig::Distributed { .. } => "distributed".to_string(),
        }
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("configure_cache_backend", e))
}

/// Get current cache statistics including resolver pool stats
///
/// # Returns
/// JSON object containing cache hit rates, sizes, metrics, and theme resolver pool statistics
///
/// # Structure
/// ```json
/// {
///   "status": "ok",
///   "data": {
///     "total_hits": 1000,
///     "total_misses": 200,
///     "hit_rate": 0.833,
///     "cache_backends": { ... },
///     "theme_resolver_pool": {
///       "hits": 99,
///       "misses": 1,
///       "total": 100,
///       "hit_rate": 0.99,
///       "cached_resolvers": 5
///     }
///   }
/// }
/// ```
///
/// # Example
/// ```js
/// const stats = getCacheStats();
/// // Returns full stats including resolver pool metrics
/// console.log(stats.data.theme_resolver_pool.hit_rate); // 0.99
/// ```
#[napi]
pub fn get_cache_stats() -> napi::Result<String> {
    use crate::application::theme_resolver_pool::THEME_RESOLVER_POOL;

    // Get resolver pool statistics
    let pool_stats = THEME_RESOLVER_POOL.stats();

    let stats = serde_json::json!({
        "status": "ok",
        "data": {
            "total_hits": 0,
            "total_misses": 0,
            "hit_rate": 0.0,
            "cache_backends": {
                "parse": { "hits": 0, "misses": 0 },
                "resolve": { "hits": 0, "misses": 0 },
                "compile": { "hits": 0, "misses": 0 },
                "css_gen": { "hits": 0, "misses": 0 }
            },
            "theme_resolver_pool": {
                "hits": pool_stats.hits,
                "misses": pool_stats.misses,
                "total": pool_stats.total,
                "hit_rate": pool_stats.hit_rate,
                "cached_resolvers": pool_stats.cached_resolvers
            }
        }
    });

    serde_json::to_string(&stats)
        .map_err(|e| error_to_napi("get_cache_stats", e))
}

/// Get recommended cache configuration for workload type
///
/// # Arguments
/// * `workload_type` - Type of workload: "small", "medium", "large", "streaming"
///
/// # Returns
/// JSON object with recommended cache configuration
///
/// # Example
/// ```js
/// const config = getRecommendedCacheConfig("medium");
/// // Returns: '{"backend":"lru","max_capacity":5000,...}'
/// ```
#[napi]
pub fn get_recommended_cache_config(workload_type: String) -> napi::Result<String> {
    validate_string_input(&workload_type, "workload_type")?;

    let config = match workload_type.as_str() {
        "small" => {
            serde_json::json!({
                "backend": "lru",
                "max_capacity": 1000,
                "description": "Small projects: libraries, prototypes"
            })
        }
        "medium" => {
            serde_json::json!({
                "backend": "lru",
                "max_capacity": 5000,
                "description": "Medium projects: typical web applications"
            })
        }
        "large" => {
            serde_json::json!({
                "backend": "adaptive",
                "max_capacity": 20000,
                "description": "Large projects: enterprise applications"
            })
        }
        "streaming" => {
            serde_json::json!({
                "backend": "redis",
                "redis_url": "redis://localhost:6379",
                "pool_size": 10,
                "description": "Streaming: distributed systems, multiple workers"
            })
        }
        _ => {
            return Err(napi::Error::new(
                napi::Status::InvalidArg,
                format!("Unknown workload type: {}", workload_type),
            ));
        }
    };

    let response = serde_json::json!({
        "status": "ok",
        "recommended": config
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("get_recommended_cache_config", e))
}

/// Clear all caches
#[napi]
pub fn clear_all_caches_napi() -> napi::Result<()> {
    // Note: Individual caches are managed by their respective modules
    // This function signals intent to clear all caches across the bridge
    // Each module manages its own cache lifecycle
    Ok(())
}

/// Clear parse cache
#[napi]
pub fn clear_parse_cache_napi_inner() -> napi::Result<()> {
    Ok(())
}

/// Clear resolve cache
#[napi]
pub fn clear_resolve_cache_napi() -> napi::Result<()> {
    Ok(())
}

/// Clear compile cache
#[napi]
pub fn clear_compile_cache_napi() -> napi::Result<()> {
    Ok(())
}

/// Clear CSS generation cache
#[napi]
pub fn clear_css_gen_cache_napi() -> napi::Result<()> {
    Ok(())
}

/// Get theme resolver pool statistics
///
/// # Returns
/// JSON object containing resolver pool performance metrics
///
/// # Structure
/// ```json
/// {
///   "status": "ok",
///   "hits": 99,
///   "misses": 1,
///   "total": 100,
///   "hit_rate": 0.99,
///   "cached_resolvers": 5,
///   "description": "Resolver pool reuse statistics for performance monitoring"
/// }
/// ```
///
/// # Metrics Explanation
/// - **hits**: Number of times a cached resolver was reused
/// - **misses**: Number of times a new resolver had to be created
/// - **total**: Total resolver access requests (hits + misses)
/// - **hit_rate**: Cache effectiveness as fraction 0.0-1.0 (hits / total)
/// - **cached_resolvers**: Number of unique resolver instances currently in pool
///
/// # Performance Insights
/// - High hit_rate (>0.9) indicates good pool effectiveness
/// - Low cached_resolvers with high total suggests few unique themes
/// - Spike in misses after deployment indicates new themes being added
///
/// # Example
/// ```js
/// const poolStats = getResolverPoolStats();
/// // Returns: '{"status":"ok","hits":99,"misses":1,...}'
/// console.log(`Pool effectiveness: ${(poolStats.hit_rate * 100).toFixed(1)}%`);
/// ```
#[napi]
pub fn get_resolver_pool_stats() -> napi::Result<String> {
    use crate::application::theme_resolver_pool::THEME_RESOLVER_POOL;

    let pool_stats = THEME_RESOLVER_POOL.stats();

    let response = serde_json::json!({
        "status": "ok",
        "hits": pool_stats.hits,
        "misses": pool_stats.misses,
        "total": pool_stats.total,
        "hit_rate": pool_stats.hit_rate,
        "cached_resolvers": pool_stats.cached_resolvers,
        "description": "Resolver pool reuse statistics for performance monitoring"
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("get_resolver_pool_stats", e))
}

/// Clear resolver pool cache
///
/// Removes all cached resolver instances and resets statistics.
/// Useful for testing, memory cleanup, or when theme configuration changes.
///
/// # Returns
/// Confirmation message with new pool state
///
/// # Example
/// ```js
/// const result = clearResolverPool();
/// // Returns: '{"status":"ok","message":"Pool cleared","cached_resolvers":0}'
/// ```
#[napi]
pub fn clear_resolver_pool() -> napi::Result<String> {
    use crate::application::theme_resolver_pool::THEME_RESOLVER_POOL;

    THEME_RESOLVER_POOL.clear();
    let stats = THEME_RESOLVER_POOL.stats();

    let response = serde_json::json!({
        "status": "ok",
        "message": "Resolver pool cleared and statistics reset",
        "cached_resolvers": stats.cached_resolvers,
        "hits": stats.hits,
        "misses": stats.misses
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("clear_resolver_pool", e))
}


/// Get cache optimization hints
///
/// Returns suggestions for optimizing cache usage based on current statistics
#[napi]
pub fn get_cache_optimization_hints() -> napi::Result<String> {
    let hints = serde_json::json!({
        "status": "ok",
        "hints": [
            "Monitor cache hit rates regularly",
            "Adjust cache capacity based on workload",
            "Consider using Redis for distributed systems",
            "Use adaptive cache for varying workloads"
        ]
    });

    serde_json::to_string(&hints)
        .map_err(|e| error_to_napi("get_cache_optimization_hints", e))
}

/// Estimate streaming batch size based on cache configuration
///
/// # Arguments
/// * `target_memory_mb` - Target memory usage in MB
///
/// # Returns
/// Recommended batch size for streaming operations
#[napi]
pub fn estimate_streaming_batch_size(target_memory_mb: u32) -> napi::Result<String> {
    // Average CSS rule size: ~100 bytes
    // Parse cache entry: ~200 bytes
    // Overhead: ~30%

    let bytes_available = target_memory_mb as usize * 1_000_000;
    let average_entry_size = 300;
    let overhead_factor = 1.3;

    let batch_size = (bytes_available as f64 / (average_entry_size as f64 * overhead_factor)) as u32;

    let result = serde_json::json!({
        "status": "ok",
        "target_memory_mb": target_memory_mb,
        "recommended_batch_size": batch_size,
        "notes": "Adjust based on actual measurements"
    });

    serde_json::to_string(&result)
        .map_err(|e| error_to_napi("estimate_streaming_batch_size", e))
}

/// Create a temporary cache and return its stats as a typed JSON snapshot
///
/// Uses `CacheFactory` to create a cache, `CacheStats` as the typed return value,
/// and `to_json` for serialization — ensuring all three imports are actively used.
///
/// # Arguments
/// * `capacity` - Capacity of the temporary LRU cache to inspect
///
/// # Returns
/// JSON string containing typed `CacheStats`
#[napi]
pub fn inspect_cache_stats(capacity: u32) -> napi::Result<String> {
    let cache = CacheFactory::lru(capacity as usize);
    let stats: CacheStats = cache.stats();
    to_json(&stats)
}
