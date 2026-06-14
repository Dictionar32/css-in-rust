//! PHASE 7.2: Unified Cache Abstraction Layer
//! 
//! Provides a trait-based cache interface that supports multiple backends
//! (LRU, Redis, Persistent, Adaptive) with consistent API.

use std::sync::Arc;
use serde::{Serialize, Deserialize};

/// Cache statistics for monitoring and optimization
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize)]
pub struct CacheStats {
    /// Total number of cache hits
    pub hits: u64,
    /// Total number of cache misses
    pub misses: u64,
    /// Current number of entries in cache
    pub current_size: u64,
    /// Maximum capacity of cache
    pub capacity: u64,
    /// Total number of evictions
    pub evictions: u64,
    /// Hit rate (hits / (hits + misses))
    pub hit_rate: f64,
}

impl CacheStats {
    /// Calculate hit rate from hits and misses
    pub fn calculate_hit_rate(hits: u64, misses: u64) -> f64 {
        if hits + misses == 0 {
            0.0
        } else {
            hits as f64 / (hits + misses) as f64
        }
    }

    /// Create stats with calculated hit rate
    pub fn with_hit_rate(hits: u64, misses: u64, current_size: u64, capacity: u64, evictions: u64) -> Self {
        let hit_rate = Self::calculate_hit_rate(hits, misses);
        CacheStats {
            hits,
            misses,
            current_size,
            capacity,
            evictions,
            hit_rate,
        }
    }
}

/// Configuration options for different cache backends
#[derive(Debug, Clone)]
pub enum CacheConfig {
    /// LRU cache with fixed capacity
    Lru { capacity: usize },
    /// Lazy evaluation cache with timeout
    Lazy { timeout_ms: u64 },
    /// Adaptive cache that adjusts size based on hit rate
    Adaptive { initial_capacity: usize, max_capacity: usize },
    /// Persistent disk-based cache
    Persistent { path: String, ttl_seconds: Option<u64> },
    /// Redis distributed cache
    Redis { url: String, ttl_seconds: Option<u64> },
    /// Distributed cache across multiple instances
    Distributed { coordinator_url: String },
}

/// Trait for pluggable cache backends
/// 
/// All cache implementations must implement this trait to be usable
/// in the unified cache abstraction.
pub trait CacheBackend: Send + Sync {
    /// Get value from cache
    fn get(&self, key: &str) -> Option<String>;

    /// Put value into cache
    fn put(&self, key: String, value: String);

    /// Remove value from cache
    fn remove(&self, key: &str) -> bool;

    /// Clear entire cache
    fn clear(&self);

    /// Check if key exists in cache
    fn contains(&self, key: &str) -> bool {
        self.get(key).is_some()
    }

    /// Get current cache statistics
    fn stats(&self) -> CacheStats;

    /// Get cache capacity
    fn capacity(&self) -> usize;

    /// Get current cache size
    fn size(&self) -> u64 {
        self.stats().current_size
    }

    /// Get hit rate
    fn hit_rate(&self) -> f64 {
        self.stats().hit_rate
    }

    /// Is cache full?
    fn is_full(&self) -> bool {
        self.size() >= self.capacity() as u64
    }
}

/// Factory for creating cache backends based on configuration
pub struct CacheFactory;

impl CacheFactory {
    /// Create a new cache backend based on config
    pub fn create(config: CacheConfig) -> Arc<dyn CacheBackend> {
        match config {
            CacheConfig::Lru { capacity } => {
                Arc::new(crate::infrastructure::lru_cache::LruCache::new(capacity))
            }
            CacheConfig::Lazy { timeout_ms: _ } => {
                // Use LruCache as fallback for now
                Arc::new(crate::infrastructure::lru_cache::LruCache::new(1000))
            }
            CacheConfig::Adaptive { initial_capacity, max_capacity: _ } => {
                // Create LRU as initial backend, wrap in adaptive
                let initial = Box::new(crate::infrastructure::lru_cache::LruCache::new(initial_capacity)) as Box<dyn CacheBackend>;
                Arc::new(crate::infrastructure::adapters::AdaptiveCacheAdapter::new(initial))
            }
            CacheConfig::Persistent { path, ttl_seconds: _ } => {
                Arc::new(crate::infrastructure::adapters::PersistentCacheAdapter::new(path, 10000))
            }
            CacheConfig::Redis { url, ttl_seconds } => {
                let mut config = crate::infrastructure::redis_cache::RedisCacheConfig::default();
                if !url.is_empty() {
                    if let Some(host_port) = url.strip_prefix("redis://") {
                        let parts: Vec<&str> = host_port.split(':').collect();
                        if !parts.is_empty() {
                            config.host = parts[0].to_string();
                        }
                        if parts.len() > 1 {
                            if let Some(port_part) = parts[1].split('/').next() {
                                if let Ok(port) = port_part.parse::<u16>() {
                                    config.port = port;
                                }
                            }
                        }
                    }
                }
                if let Some(ttl) = ttl_seconds {
                    config.default_ttl_seconds = ttl;
                }
                if let Ok(pool) = crate::infrastructure::redis_cache::RedisPool::new(config) {
                    Arc::new(crate::infrastructure::adapters::RedisCacheAdapter::new_with_ttl(
                        Arc::new(std::sync::Mutex::new(pool)),
                        ttl_seconds,
                    ))
                } else {
                    Arc::new(crate::infrastructure::lru_cache::LruCache::new(10000))
                }
            }
            CacheConfig::Distributed { coordinator_url: _ } => {
                // Distributed backend requires coordinator connection
                // For now, return LRU cache as fallback
                // TODO: Implement DistributedCache adapter for CacheBackend
                Arc::new(crate::infrastructure::lru_cache::LruCache::new(10000))
            }
        }
    }

    /// Create LRU cache with default settings
    pub fn lru(capacity: usize) -> Arc<dyn CacheBackend> {
        Self::create(CacheConfig::Lru { capacity })
    }

    /// Create Redis cache with default settings
    pub fn redis(url: String) -> Arc<dyn CacheBackend> {
        Self::create(CacheConfig::Redis { url, ttl_seconds: None })
    }

    /// Create persistent cache with default settings
    pub fn persistent(path: String) -> Arc<dyn CacheBackend> {
        Self::create(CacheConfig::Persistent { path, ttl_seconds: None })
    }

    /// Create adaptive cache with default settings
    pub fn adaptive(initial: usize, max: usize) -> Arc<dyn CacheBackend> {
        Self::create(CacheConfig::Adaptive {
            initial_capacity: initial,
            max_capacity: max,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_stats_hit_rate() {
        let stats = CacheStats::with_hit_rate(100, 0, 50, 100, 10);
        assert_eq!(stats.hit_rate, 1.0); // 100%

        let stats = CacheStats::with_hit_rate(50, 50, 50, 100, 10);
        assert_eq!(stats.hit_rate, 0.5); // 50%

        let stats = CacheStats::with_hit_rate(0, 100, 0, 100, 0);
        assert_eq!(stats.hit_rate, 0.0); // 0%

        let stats = CacheStats::with_hit_rate(0, 0, 0, 100, 0);
        assert_eq!(stats.hit_rate, 0.0); // No operations
    }

    #[test]
    fn test_cache_factory_creation() {
        // Should not panic when creating different backends
        let _lru = CacheFactory::lru(1000);
        let _adaptive = CacheFactory::adaptive(500, 2000);
        // Other backends require external resources, so skipping
    }
}
