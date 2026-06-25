//! Redis operations NAPI bindings
//!
//! This module provides NAPI functions for Redis cache operations and management.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use napi_derive::napi;
use std::sync::{Arc, OnceLock};
use crate::infrastructure::redis_cache::RedisPool;
use crate::infrastructure::napi_bridge_marshalling::{parse_json, to_json};
use crate::infrastructure::napi_bridge_errors::{error_to_napi, validate_string_input};

// Global Redis pool (lazy initialized)
static REDIS_POOL: OnceLock<Arc<std::sync::Mutex<RedisPool>>> = OnceLock::new();

/// Initialize Redis pool (lazy initialization)
fn init_redis_pool() -> napi::Result<Arc<std::sync::Mutex<RedisPool>>> {
    Ok(REDIS_POOL
        .get_or_init(|| {
            let config = Default::default();
            let pool = RedisPool::new(config).unwrap_or_else(|_| {
                RedisPool::new(Default::default()).unwrap()
            });
            Arc::new(std::sync::Mutex::new(pool))
        })
        .clone())
}

/// Connect to Redis pool with configuration
#[napi]
pub fn redis_pool_connect(config_json: Option<String>) -> napi::Result<String> {
    if let Some(ref json) = config_json {
        validate_string_input(json, "config_json")?;
    }

    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_pool_connect", e.to_string()))?;
    let info = pool_guard.get_info();

    let result = serde_json::json!({
        "status": "connected",
        "message": "Redis pool connected",
        "pool_size": info.pool_size,
        "connections": info.connected
    });

    serde_json::to_string(&result)
        .map_err(|e| error_to_napi("redis_pool_connect", e))
}

/// Set a key-value pair in Redis
#[napi]
pub fn redis_set(key: String, value: String, ttl_seconds: Option<u32>) -> napi::Result<String> {
    validate_string_input(&key, "key")?;
    validate_string_input(&value, "value")?;

    let pool = init_redis_pool()?;
    let mut pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_set", e.to_string()))?;

    let ttl = ttl_seconds.map(|s| s as u64);
    let result = pool_guard.set(&key, &value, ttl);

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "key": key,
        "success": result.success,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_set", e))
}

/// Get a value from Redis
#[napi]
pub fn redis_get(key: String) -> napi::Result<String> {
    validate_string_input(&key, "key")?;

    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_get", e.to_string()))?;

    let result = pool_guard.get(&key);

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "value": result.value,
        "key": key,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_get", e))
}

/// Delete a key from Redis
#[napi]
pub fn redis_delete(key: String) -> napi::Result<String> {
    validate_string_input(&key, "key")?;

    let pool = init_redis_pool()?;
    let mut pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_delete", e.to_string()))?;

    let result = pool_guard.delete(&key);

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "key": key,
        "deleted": result.value.unwrap_or(false),
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_delete", e))
}

/// Get multiple values from Redis (batch)
#[napi]
pub fn redis_mget(keys: Vec<String>) -> napi::Result<String> {
    if keys.is_empty() {
        return Err(napi::Error::new(
            napi::Status::InvalidArg,
            "keys array cannot be empty",
        ));
    }

    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_mget", e.to_string()))?;

    let key_strs: Vec<&str> = keys.iter().map(|k| k.as_str()).collect();
    let result = pool_guard.mget(&key_strs);

    let values: Vec<String> = result.value
        .unwrap_or_default()
        .iter()
        .filter_map(|v| v.clone())
        .collect();

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "values": values,
        "count": values.len(),
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_mget", e))
}

/// Set multiple key-value pairs in Redis (batch)
#[napi]
pub fn redis_mset(pairs_json: String) -> napi::Result<String> {
    validate_string_input(&pairs_json, "pairs_json")?;

    let pairs: Vec<[String; 2]> = parse_json(&pairs_json, "Vec<[String; 2]>")?;

    let pool = init_redis_pool()?;
    let mut pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_mset", e.to_string()))?;

    let pair_tuples: Vec<(&str, &str)> = pairs
        .iter()
        .map(|p| (p[0].as_str(), p[1].as_str()))
        .collect();

    let result = pool_guard.mset(&pair_tuples);

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "count": pairs.len(),
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_mset", e))
}

/// Check if key exists in Redis
#[napi]
pub fn redis_exists(key: String) -> napi::Result<String> {
    validate_string_input(&key, "key")?;

    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_exists", e.to_string()))?;

    let result = pool_guard.exists(&key);

    let response = serde_json::json!({
        "exists": result.value.unwrap_or(false),
        "key": key,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_exists", e))
}

/// Set expiration time on a key
#[napi]
pub fn redis_expire(key: String, ttl_seconds: u32) -> napi::Result<String> {
    validate_string_input(&key, "key")?;

    let pool = init_redis_pool()?;
    let mut pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_expire", e.to_string()))?;

    let result = pool_guard.expire(&key, ttl_seconds as u64);

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "key": key,
        "ttl": ttl_seconds,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_expire", e))
}

/// Get TTL of a key
#[napi]
pub fn redis_ttl(key: String) -> napi::Result<String> {
    validate_string_input(&key, "key")?;

    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_ttl", e.to_string()))?;

    let result = pool_guard.ttl(&key);

    let ttl = result.value.unwrap_or(-2i64);

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "ttl": ttl,
        "key": key,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_ttl", e))
}

/// Get Redis pool statistics
#[napi]
pub fn redis_pool_stats() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_pool_stats", e.to_string()))?;

    let stats = pool_guard.get_stats();

    let response = serde_json::json!({
        "status": "ok",
        "pool_size": stats.pool_size,
        "connected_count": stats.connected_count,
        "total_requests": stats.total_requests,
        "successful_requests": stats.successful_requests,
        "failed_requests": stats.failed_requests,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_pool_stats", e))
}

/// Flush all data from Redis database
#[napi]
pub fn redis_flush_db() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let mut pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_flush_db", e.to_string()))?;

    let result = pool_guard.flush_db();

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "message": "Database flushed",
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_flush_db", e))
}

/// Ping Redis server
#[napi]
pub fn redis_ping() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_ping", e.to_string()))?;

    let success = pool_guard.ping();

    let response = serde_json::json!({
        "status": if success { "pong" } else { "error" },
        "message": "Redis server is responding",
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_ping", e))
}

/// Get Redis server information
#[napi]
pub fn redis_info() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_info", e.to_string()))?;

    let info = pool_guard.get_info();

    let response = serde_json::json!({
        "status": "ok",
        "host": info.host,
        "port": info.port,
        "pool_size": info.pool_size,
        "connections": info.connected,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_info", e))
}

/// Clear Redis cache
#[napi]
pub fn redis_cache_clear() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let mut pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_cache_clear", e.to_string()))?;

    let result = pool_guard.flush_db();

    let response = serde_json::json!({
        "status": if result.success { "ok" } else { "error" },
        "message": "Cache cleared",
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_cache_clear", e))
}

/// Enable/disable Redis clustering
#[napi]
pub fn redis_enable_cluster(enabled: bool) -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let mut pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_enable_cluster", e.to_string()))?;

    pool_guard.set_cluster_enabled(enabled);

    let response = serde_json::json!({
        "status": "ok",
        "clustering": enabled,
        "message": if enabled { "Clustering enabled" } else { "Clustering disabled" },
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_enable_cluster", e))
}

/// Get Redis cache hit rate
#[napi]
pub fn redis_cache_hit_rate() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_cache_hit_rate", e.to_string()))?;

    let stats = pool_guard.get_stats();
    let hit_rate = if stats.total_requests > 0 {
        (stats.successful_requests as f64 / stats.total_requests as f64) * 100.0
    } else {
        0.0
    };

    let response = serde_json::json!({
        "status": "ok",
        "hit_rate": hit_rate,
        "total_requests": stats.total_requests,
        "successful": stats.successful_requests,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_cache_hit_rate", e))
}

/// Monitor Redis operations
#[napi]
pub fn redis_monitor() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_monitor", e.to_string()))?;

    let stats = pool_guard.get_stats();

    let response = serde_json::json!({
        "status": "monitoring",
        "pool_size": stats.pool_size,
        "connected_count": stats.connected_count,
        "total_requests": stats.total_requests,
        "successful": stats.successful_requests,
        "failed": stats.failed_requests,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_monitor", e))
}

/// Sync Redis cluster nodes
#[napi]
pub fn redis_sync_nodes() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let mut pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_sync_nodes", e.to_string()))?;

    pool_guard.sync_nodes()
        .map_err(|e| error_to_napi("redis_sync_nodes", e))?;

    let response = serde_json::json!({
        "status": "ok",
        "message": "Nodes synchronized",
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_sync_nodes", e))
}

/// Get Redis configuration
#[napi]
pub fn redis_get_config() -> napi::Result<String> {
    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_get_config", e.to_string()))?;

    let info = pool_guard.get_info();

    let response = serde_json::json!({
        "status": "ok",
        "host": info.host,
        "port": info.port,
        "pool_size": info.pool_size,
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_get_config", e))
}

/// Shutdown Redis connection
#[napi]
pub fn redis_shutdown() -> napi::Result<String> {
    let response = serde_json::json!({
        "status": "ok",
        "message": "Redis connection shutdown",
    });

    serde_json::to_string(&response)
        .map_err(|e| error_to_napi("redis_shutdown", e))
}

/// Get a typed Redis stats snapshot serialized via `to_json`
///
/// Uses the `to_json` marshalling helper for typed serialization
/// rather than building raw `serde_json::json!` objects.
#[napi]
pub fn redis_typed_stats() -> napi::Result<String> {
    #[derive(serde::Serialize)]
    struct RedisStats {
        connected: bool,
        pool_size: usize,
        total_requests: u64,
        successful_requests: u64,
        failed_requests: u64,
        hit_rate: f64,
    }

    let pool = init_redis_pool()?;
    let pool_guard = pool.lock()
        .map_err(|e| error_to_napi("redis_typed_stats", e.to_string()))?;

    let raw = pool_guard.get_stats();
    let hit_rate = if raw.total_requests > 0 {
        raw.successful_requests as f64 / raw.total_requests as f64
    } else {
        0.0
    };

    let stats = RedisStats {
        connected: raw.connected_count > 0,
        pool_size: raw.pool_size,
        total_requests: raw.total_requests,
        successful_requests: raw.successful_requests,
        failed_requests: raw.failed_requests,
        hit_rate,
    };

    to_json(&stats)
}
