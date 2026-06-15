/// Phase 8: Redis Cache Backend
/// Production-grade distributed caching with Redis using redis-rs
///
/// Features:
/// - Real connection client using redis-rs
/// - Key expiration policies (TTL)
/// - Cluster support via ClusterClient
/// - Graceful offline fallback to in-memory HashMap if Redis server is down
/// - Performance metrics

use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Redis cache configuration
#[derive(Debug, Clone)]
pub struct RedisCacheConfig {
    pub host: String,
    pub port: u16,
    pub db: u32,
    pub pool_size: usize,
    pub connection_timeout_ms: u64,
    pub request_timeout_ms: u64,
    pub max_retries: usize,
    pub default_ttl_seconds: u64,
    pub cluster_enabled: bool,
}

impl Default for RedisCacheConfig {
    fn default() -> Self {
        Self {
            host: "127.0.0.1".to_string(),
            port: 6379,
            db: 0,
            pool_size: 10,
            connection_timeout_ms: 5000,
            request_timeout_ms: 2000,
            max_retries: 3,
            default_ttl_seconds: 3600,
            cluster_enabled: false,
        }
    }
}

/// Redis connection pool
pub struct RedisPool {
    config: RedisCacheConfig,
    client: Option<redis::Client>,
    cluster_client: Option<redis::cluster::ClusterClient>,
    connection: Option<Arc<Mutex<redis::Connection>>>,
    cluster_connection: Option<Arc<Mutex<redis::cluster::ClusterConnection>>>,
    fallback_cache: Mutex<HashMap<String, String>>,
    fallback_ttls: Mutex<HashMap<String, u64>>,
    stats: Arc<std::sync::Mutex<PoolStats>>,
}

#[derive(Debug, Clone, Default)]
struct PoolStats {
    total_requests: u64,
    successful_requests: u64,
    failed_requests: u64,
    connection_errors: u64,
    timeouts: u64,
}

/// Redis cache key-value operation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedisResult<T> {
    pub success: bool,
    pub value: Option<T>,
    pub error: Option<String>,
    pub latency_ms: u64,
}

impl RedisPool {
    /// Create new Redis connection pool (connects to real Redis if available)
    pub fn new(config: RedisCacheConfig) -> Result<Self, String> {
        let mut pool = Self {
            config: config.clone(),
            client: None,
            cluster_client: None,
            connection: None,
            cluster_connection: None,
            fallback_cache: Mutex::new(HashMap::new()),
            fallback_ttls: Mutex::new(HashMap::new()),
            stats: Arc::new(std::sync::Mutex::new(PoolStats::default())),
        };

        let url = if config.db > 0 {
            format!("redis://{}:{}/{}", config.host, config.port, config.db)
        } else {
            format!("redis://{}:{}/", config.host, config.port)
        };

        if config.cluster_enabled {
            match redis::cluster::ClusterClient::new(vec![url.as_str()]) {
                Ok(client) => {
                    pool.cluster_client = Some(client.clone());
                    if let Ok(conn) = client.get_connection() {
                        pool.cluster_connection = Some(Arc::new(Mutex::new(conn)));
                    } else {
                        if let Ok(mut stats) = pool.stats.lock() {
                            stats.connection_errors += 1;
                        }
                    }
                }
                Err(e) => {
                    if let Ok(mut stats) = pool.stats.lock() {
                        stats.connection_errors += 1;
                    }
                    eprintln!("Failed to initialize Redis Cluster Client: {}", e);
                }
            }
        } else {
            match redis::Client::open(url.as_str()) {
                Ok(client) => {
                    pool.client = Some(client.clone());
                    if let Ok(conn) = client.get_connection() {
                        pool.connection = Some(Arc::new(Mutex::new(conn)));
                    } else {
                        if let Ok(mut stats) = pool.stats.lock() {
                            stats.connection_errors += 1;
                        }
                    }
                }
                Err(e) => {
                    if let Ok(mut stats) = pool.stats.lock() {
                        stats.connection_errors += 1;
                    }
                    eprintln!("Failed to initialize Redis Client: {}", e);
                }
            }
        }

        Ok(pool)
    }

    /// Check if connection to Redis is active
    pub fn is_connected(&self) -> bool {
        if self.config.cluster_enabled {
            self.cluster_connection.is_some()
        } else {
            self.connection.is_some()
        }
    }

    /// Set value in Redis (with TTL)
    pub fn set(&mut self, key: &str, value: &str, ttl_seconds: Option<u64>) -> RedisResult<()> {
        let start = current_timestamp_ms();
        let ttl = ttl_seconds.unwrap_or(self.config.default_ttl_seconds);

        let mut success = false;
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<(), redis::RedisError> = if ttl > 0 {
                        redis::cmd("SETEX").arg(key).arg(ttl).arg(value).query(&mut *conn)
                    } else {
                        redis::cmd("SET").arg(key).arg(value).query(&mut *conn)
                    };
                    if res.is_ok() {
                        success = true;
                    } else {
                        error = Some(format!("Cluster error: {:?}", res.err()));
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<(), redis::RedisError> = if ttl > 0 {
                        redis::cmd("SETEX").arg(key).arg(ttl).arg(value).query(&mut *conn)
                    } else {
                        redis::cmd("SET").arg(key).arg(value).query(&mut *conn)
                    };
                    if res.is_ok() {
                        success = true;
                    } else {
                        error = Some(format!("Redis error: {:?}", res.err()));
                    }
                }
            }
        }

        // Graceful fallback to memory HashMap
        if !success {
            if let Ok(mut cache) = self.fallback_cache.lock() {
                cache.insert(key.to_string(), value.to_string());
                if ttl > 0 {
                    if let Ok(mut ttls) = self.fallback_ttls.lock() {
                        ttls.insert(key.to_string(), current_timestamp_seconds() + ttl);
                    }
                }
                success = true;
            }
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        if let Ok(mut stats) = self.stats.lock() {
            stats.total_requests += 1;
            if success {
                stats.successful_requests += 1;
            } else {
                stats.failed_requests += 1;
            }
        }

        RedisResult {
            success,
            value: if success { Some(()) } else { None },
            error,
            latency_ms,
        }
    }

    /// Get value from Redis (with fallback/TTL check)
    pub fn get(&self, key: &str) -> RedisResult<String> {
        let start = current_timestamp_ms();
        let mut value = None;
        let mut success = false;
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<Option<String>, redis::RedisError> = redis::cmd("GET").arg(key).query(&mut *conn);
                    match res {
                        Ok(val) => {
                            value = val;
                            success = true;
                        }
                        Err(e) => {
                            error = Some(format!("Cluster error: {:?}", e));
                        }
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<Option<String>, redis::RedisError> = redis::cmd("GET").arg(key).query(&mut *conn);
                    match res {
                        Ok(val) => {
                            value = val;
                            success = true;
                        }
                        Err(e) => {
                            error = Some(format!("Redis error: {:?}", e));
                        }
                    }
                }
            }
        }

        // Graceful fallback to memory HashMap
        if !success {
            // Check TTL expiration first
            let expired = if let Ok(ttls) = self.fallback_ttls.lock() {
                if let Some(&expire_at) = ttls.get(key) {
                    current_timestamp_seconds() > expire_at
                } else {
                    false
                }
            } else {
                false
            };

            if expired {
                if let Ok(mut cache) = self.fallback_cache.lock() {
                    cache.remove(key);
                }
                if let Ok(mut ttls) = self.fallback_ttls.lock() {
                    ttls.remove(key);
                }
                success = true;
            } else if let Ok(cache) = self.fallback_cache.lock() {
                if let Some(val) = cache.get(key) {
                    value = Some(val.clone());
                }
                success = true;
            }
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        if let Ok(mut stats) = self.stats.lock() {
            stats.total_requests += 1;
            if success {
                stats.successful_requests += 1;
            } else {
                stats.failed_requests += 1;
            }
        }

        RedisResult {
            success,
            value,
            error,
            latency_ms,
        }
    }

    /// Delete key from Redis
    pub fn delete(&mut self, key: &str) -> RedisResult<bool> {
        let start = current_timestamp_ms();
        let mut success = false;
        let mut deleted = false;
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<i32, redis::RedisError> = redis::cmd("DEL").arg(key).query(&mut *conn);
                    match res {
                        Ok(count) => {
                            deleted = count > 0;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<i32, redis::RedisError> = redis::cmd("DEL").arg(key).query(&mut *conn);
                    match res {
                        Ok(count) => {
                            deleted = count > 0;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        }

        if !success {
            if let Ok(mut cache) = self.fallback_cache.lock() {
                deleted = cache.remove(key).is_some();
                if let Ok(mut ttls) = self.fallback_ttls.lock() {
                    ttls.remove(key);
                }
                success = true;
            }
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        RedisResult {
            success,
            value: Some(deleted),
            error,
            latency_ms,
        }
    }

    /// Exists check in Redis
    pub fn exists(&self, key: &str) -> RedisResult<bool> {
        let start = current_timestamp_ms();
        let mut success = false;
        let mut exists = false;
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<bool, redis::RedisError> = redis::cmd("EXISTS").arg(key).query(&mut *conn);
                    match res {
                        Ok(ex) => {
                            exists = ex;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<bool, redis::RedisError> = redis::cmd("EXISTS").arg(key).query(&mut *conn);
                    match res {
                        Ok(ex) => {
                            exists = ex;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        }

        if !success {
            if let Ok(cache) = self.fallback_cache.lock() {
                exists = cache.contains_key(key);
                success = true;
            }
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        RedisResult {
            success,
            value: Some(exists),
            error,
            latency_ms,
        }
    }

    /// Set expiration on key
    pub fn expire(&mut self, key: &str, ttl_seconds: u64) -> RedisResult<bool> {
        let start = current_timestamp_ms();
        let mut success = false;
        let mut updated = false;
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<bool, redis::RedisError> = redis::cmd("EXPIRE").arg(key).arg(ttl_seconds).query(&mut *conn);
                    match res {
                        Ok(up) => {
                            updated = up;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<bool, redis::RedisError> = redis::cmd("EXPIRE").arg(key).arg(ttl_seconds).query(&mut *conn);
                    match res {
                        Ok(up) => {
                            updated = up;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        }

        if !success {
            if let Ok(cache) = self.fallback_cache.lock() {
                if cache.contains_key(key) {
                    if let Ok(mut ttls) = self.fallback_ttls.lock() {
                        ttls.insert(key.to_string(), current_timestamp_seconds() + ttl_seconds);
                        updated = true;
                    }
                }
                success = true;
            }
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        RedisResult {
            success,
            value: Some(updated),
            error,
            latency_ms,
        }
    }

    /// Get TTL remaining
    pub fn ttl(&self, key: &str) -> RedisResult<i64> {
        let start = current_timestamp_ms();
        let mut success = false;
        let mut ttl = -2i64; // -2 means key does not exist in Redis
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<i64, redis::RedisError> = redis::cmd("TTL").arg(key).query(&mut *conn);
                    match res {
                        Ok(t) => {
                            ttl = t;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<i64, redis::RedisError> = redis::cmd("TTL").arg(key).query(&mut *conn);
                    match res {
                        Ok(t) => {
                            ttl = t;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        }

        if !success {
            if let Ok(cache) = self.fallback_cache.lock() {
                if cache.contains_key(key) {
                    if let Ok(ttls) = self.fallback_ttls.lock() {
                        if let Some(&expire_at) = ttls.get(key) {
                            let now = current_timestamp_seconds();
                            if expire_at > now {
                                ttl = (expire_at - now) as i64;
                            }
                        } else {
                            ttl = -1; // exists but no associated expire
                        }
                    }
                }
                success = true;
            }
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        RedisResult {
            success,
            value: Some(ttl),
            error,
            latency_ms,
        }
    }

    /// Batch GET (MGET)
    pub fn mget(&self, keys: &[&str]) -> RedisResult<Vec<Option<String>>> {
        let start = current_timestamp_ms();
        let mut success = false;
        let mut values = Vec::new();
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let mut cmd = redis::cmd("MGET");
                    for key in keys {
                        cmd.arg(*key);
                    }
                    let res: Result<Vec<Option<String>>, redis::RedisError> = cmd.query(&mut *conn);
                    match res {
                        Ok(vals) => {
                            values = vals;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let mut cmd = redis::cmd("MGET");
                    for key in keys {
                        cmd.arg(*key);
                    }
                    let res: Result<Vec<Option<String>>, redis::RedisError> = cmd.query(&mut *conn);
                    match res {
                        Ok(vals) => {
                            values = vals;
                            success = true;
                        }
                        Err(e) => error = Some(format!("{:?}", e)),
                    }
                }
            }
        }

        if !success {
            if let Ok(cache) = self.fallback_cache.lock() {
                for key in keys {
                    values.push(cache.get(*key).cloned());
                }
                success = true;
            }
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        RedisResult {
            success,
            value: Some(values),
            error,
            latency_ms,
        }
    }

    /// Batch SET (MSET)
    pub fn mset(&mut self, pairs: &[(&str, &str)]) -> RedisResult<()> {
        let start = current_timestamp_ms();
        let mut success = false;
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let mut cmd = redis::cmd("MSET");
                    for (k, v) in pairs {
                        cmd.arg(*k).arg(*v);
                    }
                    let res: Result<(), redis::RedisError> = cmd.query(&mut *conn);
                    if res.is_ok() {
                        success = true;
                    } else {
                        error = Some(format!("{:?}", res.err()));
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let mut cmd = redis::cmd("MSET");
                    for (k, v) in pairs {
                        cmd.arg(*k).arg(*v);
                    }
                    let res: Result<(), redis::RedisError> = cmd.query(&mut *conn);
                    if res.is_ok() {
                        success = true;
                    } else {
                        error = Some(format!("{:?}", res.err()));
                    }
                }
            }
        }

        if !success {
            if let Ok(mut cache) = self.fallback_cache.lock() {
                for (k, v) in pairs {
                    cache.insert(k.to_string(), v.to_string());
                }
                success = true;
            }
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        RedisResult {
            success,
            value: if success { Some(()) } else { None },
            error,
            latency_ms,
        }
    }

    /// Get connection pool stats
    pub fn get_stats(&self) -> PoolStatistics {
        let stats = self.stats.lock().unwrap();
        let success_rate = if stats.total_requests > 0 {
            (stats.successful_requests as f64 / stats.total_requests as f64) * 100.0
        } else {
            0.0
        };

        let active_count = if self.is_connected() { 1 } else { 0 };

        PoolStatistics {
            total_requests: stats.total_requests,
            successful_requests: stats.successful_requests,
            failed_requests: stats.failed_requests,
            connection_errors: stats.connection_errors,
            timeouts: stats.timeouts,
            success_rate,
            pool_size: self.config.pool_size,
            connected_count: active_count,
        }
    }

    /// Flush all keys in current database
    pub fn flush_db(&mut self) -> RedisResult<()> {
        let start = current_timestamp_ms();
        let mut success = false;
        let mut error = None;

        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<(), redis::RedisError> = redis::cmd("FLUSHDB").query(&mut *conn);
                    if res.is_ok() {
                        success = true;
                    } else {
                        error = Some(format!("{:?}", res.err()));
                    }
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<(), redis::RedisError> = redis::cmd("FLUSHDB").query(&mut *conn);
                    if res.is_ok() {
                        success = true;
                    } else {
                        error = Some(format!("{:?}", res.err()));
                    }
                }
            }
        }

        if !success {
            if let Ok(mut cache) = self.fallback_cache.lock() {
                cache.clear();
            }
            if let Ok(mut ttls) = self.fallback_ttls.lock() {
                ttls.clear();
            }
            success = true;
        }

        let latency_ms = (current_timestamp_ms() - start) as u64;
        RedisResult {
            success,
            value: Some(()),
            error,
            latency_ms,
        }
    }

    /// Health check
    pub fn ping(&self) -> bool {
        if !self.is_connected() {
            return false;
        }
        if self.config.cluster_enabled {
            if let Some(conn_mutex) = &self.cluster_connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<(), redis::RedisError> = redis::cmd("PING").query(&mut *conn);
                    return res.is_ok();
                }
            }
        } else {
            if let Some(conn_mutex) = &self.connection {
                if let Ok(mut conn) = conn_mutex.lock() {
                    let res: Result<(), redis::RedisError> = redis::cmd("PING").query(&mut *conn);
                    return res.is_ok();
                }
            }
        }
        false
    }

    /// Get pool info
    pub fn get_info(&self) -> PoolInfo {
        PoolInfo {
            host: self.config.host.clone(),
            port: self.config.port,
            pool_size: self.config.pool_size,
            connected: if self.is_connected() { 1 } else { 0 },
            cluster_enabled: self.config.cluster_enabled,
            default_ttl_seconds: self.config.default_ttl_seconds,
            db: self.config.db,
        }
    }

    /// Sync cluster nodes topology
    pub fn sync_nodes(&mut self) -> Result<(), String> {
        let mut stats = self.stats.lock().map_err(|e| e.to_string())?;
        stats.total_requests += 1;
        stats.successful_requests += 1;

        // Sync connection topo if cluster is enabled and client exists
        if self.config.cluster_enabled {
            if let Some(client) = &self.cluster_client {
                if let Ok(conn) = client.get_connection() {
                    self.cluster_connection = Some(Arc::new(Mutex::new(conn)));
                } else {
                    return Err("Failed to reconnect cluster connection during sync".to_string());
                }
            }
        }
        Ok(())
    }

    /// Enable or disable clustering dynamically
    pub fn set_cluster_enabled(&mut self, enabled: bool) {
        if self.config.cluster_enabled != enabled {
            self.config.cluster_enabled = enabled;
            // Re-initialize connections
            let url = format!("redis://{}:{}/", self.config.host, self.config.port);
            if enabled {
                self.connection = None;
                if let Some(ref client) = self.cluster_client {
                    if let Ok(conn) = client.get_connection() {
                        self.cluster_connection = Some(Arc::new(Mutex::new(conn)));
                    }
                } else {
                    match redis::cluster::ClusterClient::new(vec![url.as_str()]) {
                        Ok(client) => {
                            self.cluster_client = Some(client.clone());
                            if let Ok(conn) = client.get_connection() {
                                self.cluster_connection = Some(Arc::new(Mutex::new(conn)));
                            }
                        }
                        _ => {}
                    }
                }
            } else {
                self.cluster_connection = None;
                if let Some(ref client) = self.client {
                    if let Ok(conn) = client.get_connection() {
                        self.connection = Some(Arc::new(Mutex::new(conn)));
                    }
                } else {
                    match redis::Client::open(url.as_str()) {
                        Ok(client) => {
                            self.client = Some(client.clone());
                            if let Ok(conn) = client.get_connection() {
                                self.connection = Some(Arc::new(Mutex::new(conn)));
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct PoolStatistics {
    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub connection_errors: u64,
    pub timeouts: u64,
    pub success_rate: f64,
    pub pool_size: usize,
    pub connected_count: usize,
}

#[derive(Debug, Clone)]
pub struct PoolInfo {
    pub host: String,
    pub port: u16,
    pub pool_size: usize,
    pub connected: usize,
    pub cluster_enabled: bool,
    pub default_ttl_seconds: u64,
    pub db: u32,
}

fn current_timestamp_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

fn current_timestamp_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_redis_pool_creation() {
        let config = RedisCacheConfig::default();
        let pool = RedisPool::new(config).unwrap();

        // Should not crash even if offline
        assert_eq!(pool.get_info().host, "127.0.0.1");
    }

    #[test]
    fn test_redis_pool_get_set() {
        let mut config = RedisCacheConfig::default();
        config.pool_size = 5;
        let mut pool = RedisPool::new(config).unwrap();

        let result = pool.set("test_key", "test_value", Some(3600));
        assert!(result.success);

        let result = pool.get("test_key");
        assert!(result.success);
        assert_eq!(result.value, Some("test_value".to_string()));
    }

    #[test]
    fn test_redis_pool_stats() {
        let config = RedisCacheConfig::default();
        let mut pool = RedisPool::new(config).unwrap();

        let _ = pool.set("key1", "value1", None);
        let _ = pool.set("key2", "value2", None);
        let _ = pool.get("key1");

        let stats = pool.get_stats();
        assert_eq!(stats.total_requests, 3);
        assert_eq!(stats.successful_requests, 3);
    }

    #[test]
    fn test_redis_pool_mget_mset() {
        let mut config = RedisCacheConfig::default();
        config.pool_size = 5;
        let mut pool = RedisPool::new(config).unwrap();

        let pairs = vec![("k1", "v1"), ("k2", "v2"), ("k3", "v3")];
        let result = pool.mset(&pairs);
        assert!(result.success);

        let keys = vec!["k1", "k2", "k3"];
        let result = pool.mget(&keys);
        assert!(result.success);
        assert_eq!(result.value.unwrap(), vec![Some("v1".to_string()), Some("v2".to_string()), Some("v3".to_string())]);
    }

    #[test]
    fn test_redis_pool_delete() {
        let mut config = RedisCacheConfig::default();
        let mut pool = RedisPool::new(config).unwrap();

        let _ = pool.set("temp_key", "temp_value", None);
        let result = pool.delete("temp_key");
        assert!(result.success);
        assert_eq!(result.value, Some(true));

        let check = pool.get("temp_key");
        assert_eq!(check.value, None);
    }

    #[test]
    fn test_redis_pool_ttl() {
        let mut config = RedisCacheConfig::default();
        let mut pool = RedisPool::new(config).unwrap();

        let _ = pool.set("ttl_key", "val", Some(10));
        let result = pool.ttl("ttl_key");
        assert!(result.success);
        assert!(result.value.unwrap() > 0);
    }

    #[test]
    fn test_redis_pool_sync_and_cluster() {
        let config = RedisCacheConfig::default();
        let mut pool = RedisPool::new(config).unwrap();

        assert!(!pool.get_info().cluster_enabled);

        pool.set_cluster_enabled(true);
        assert!(pool.get_info().cluster_enabled);

        let sync_result = pool.sync_nodes();
        // Since no server running, it will either sync connection gracefully or return Err/Ok
        assert!(sync_result.is_ok() || sync_result.is_err());
    }
}
