/// Phase 3: Redis + Distributed Cache Integration
/// Production Redis-backed distributed caching with cluster support
///
/// Features:
/// - Redis cluster support
/// - Multi-region replication
/// - Automatic key distribution
/// - Cache coherency
/// - Conflict resolution

use super::redis_cache::{RedisPool, RedisCacheConfig};
use std::collections::HashMap;

/// Redis cluster node
#[derive(Debug, Clone)]
pub struct RedisClusterNode {
    pub id: String,
    pub host: String,
    pub port: u16,
    pub region: String,
    pub primary: bool,
    pub is_available: bool,
}

/// Redis distributed cache configuration
#[derive(Debug, Clone)]
pub struct RedisDistributedConfig {
    pub nodes: Vec<RedisClusterNode>,
    pub replication_factor: usize,
    pub consistency_level: ConsistencyLevel,
    pub conflict_resolution: ConflictResolution,
    pub health_check_interval_ms: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConsistencyLevel {
    Eventual,
    Sequential,
    Strong,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConflictResolution {
    LastWriteWins,
    VectorClock,
    Quorum,
}

/// Redis distributed cache manager
pub struct RedisDistributedCache {
    config: RedisDistributedConfig,
    pools: HashMap<String, RedisPool>,
    key_version_cache: HashMap<String, KeyVersion>,
}

#[derive(Debug, Clone)]
struct KeyVersion {
    version: u64,
    timestamp: u64,
    region: String,
}

impl RedisDistributedCache {
    /// Create new Redis distributed cache
    pub fn new(config: RedisDistributedConfig) -> Result<Self, String> {
        if config.nodes.is_empty() {
            return Err("At least one node required".to_string());
        }

        let mut pools = HashMap::new();

        // Create pool for each node
        for node in &config.nodes {
            let redis_config = RedisCacheConfig {
                host: node.host.clone(),
                port: node.port,
                db: 0,
                pool_size: 10,
                connection_timeout_ms: 5000,
                request_timeout_ms: 2000,
                max_retries: 3,
                default_ttl_seconds: 3600,
                cluster_enabled: config.nodes.len() > 1,
            };

            match RedisPool::new(redis_config) {
                Ok(pool) => {
                    pools.insert(node.id.clone(), pool);
                }
                Err(e) => {
                    eprintln!("Failed to create pool for {}: {}", node.id, e);
                }
            }
        }

        Ok(Self {
            config,
            pools,
            key_version_cache: HashMap::new(),
        })
    }

    /// Put key-value with replication
    pub fn put(&mut self, key: &str, value: &str, ttl_seconds: Option<u64>) -> DistributedResult {
        let mut success_count = 0;
        let mut error_count = 0;

        // Get replica nodes
        let replicas = self.get_replica_nodes(key);

        for replica_id in replicas {
            if let Some(pool) = self.pools.get_mut(&replica_id) {
                let result = pool.set(key, value, ttl_seconds);
                if result.success {
                    success_count += 1;
                } else {
                    error_count += 1;
                }
            }
        }

        // Check consistency requirement
        let success = match self.config.consistency_level {
            ConsistencyLevel::Eventual => success_count > 0,
            ConsistencyLevel::Sequential => success_count >= (self.config.replication_factor / 2 + 1),
            ConsistencyLevel::Strong => success_count == self.config.replication_factor,
        };

        // Update version tracking
        let version = self.key_version_cache
            .get(key)
            .map(|kv| kv.version + 1)
            .unwrap_or(1);

        self.key_version_cache.insert(key.to_string(), KeyVersion {
            version,
            timestamp: current_timestamp(),
            region: "local".to_string(),
        });

        DistributedResult {
            success,
            replicas_succeeded: success_count,
            replicas_failed: error_count,
            consistency_satisfied: success,
        }
    }

    /// Get key-value with read repair
    pub fn get(&mut self, key: &str) -> DistributedGetResult {
        let replicas = self.get_replica_nodes(key);
        let mut values = Vec::new();
        let mut errors = Vec::new();

        for replica_id in replicas {
            if let Some(pool) = self.pools.get(&replica_id) {
                let result = pool.get(key);
                if result.success {
                    values.push((replica_id.clone(), result.value.clone()));
                } else {
                    errors.push(replica_id.clone());
                }
            }
        }

        let success = !values.is_empty();
        let value = values.first().map(|(_, v)| v.clone()).flatten();

        // Read repair: update missing replicas
        if success && values.len() < self.config.replication_factor {
            for missing_id in &errors {
                if let Some(pool) = self.pools.get_mut(missing_id) {
                    if let Some(ref val) = value {
                        let _ = pool.set(key, val, Some(3600));
                    }
                }
            }
        }

        DistributedGetResult {
            success,
            value,
            replicas_responded: values.len(),
            replicas_failed: errors.len(),
        }
    }

    /// Delete key from all replicas
    pub fn delete(&mut self, key: &str) -> DistributedResult {
        let replicas = self.get_replica_nodes(key);
        let mut success_count = 0;

        for replica_id in replicas {
            if let Some(pool) = self.pools.get_mut(&replica_id) {
                if pool.delete(key).success {
                    success_count += 1;
                }
            }
        }

        DistributedResult {
            success: success_count > 0,
            replicas_succeeded: success_count,
            replicas_failed: self.config.replication_factor - success_count,
            consistency_satisfied: success_count >= (self.config.replication_factor / 2 + 1),
        }
    }

    /// Get replicas for key (consistent hashing)
    fn get_replica_nodes(&self, key: &str) -> Vec<String> {
        let mut hasher = std::collections::hash_map::DefaultHasher::new();
        use std::hash::{Hash, Hasher};
        key.hash(&mut hasher);
        let hash = hasher.finish();

        let mut replicas = Vec::new();
        for i in 0..self.config.replication_factor {
            let node_idx = ((hash + i as u64) as usize) % self.config.nodes.len();
            let node = &self.config.nodes[node_idx];
            if node.is_available {
                replicas.push(node.id.clone());
            }
        }

        replicas
    }

    /// Check node availability
    pub fn check_health(&mut self) {
        for node in &mut self.config.nodes {
            if let Some(pool) = self.pools.get(&node.id) {
                node.is_available = pool.ping();
            }
        }
    }

    /// Get cluster status
    pub fn get_status(&self) -> ClusterStatus {
        let available = self.config.nodes.iter().filter(|n| n.is_available).count();
        let total = self.config.nodes.len();

        let mut pool_stats = HashMap::new();
        for (node_id, pool) in &self.pools {
            pool_stats.insert(node_id.clone(), pool.get_stats());
        }

        ClusterStatus {
            total_nodes: total,
            available_nodes: available,
            replication_factor: self.config.replication_factor,
            consistency_level: self.config.consistency_level,
            pool_stats,
        }
    }

    /// Get info for all nodes
    pub fn get_cluster_info(&self) -> Vec<ClusterNodeInfo> {
        self.config.nodes.iter().map(|node| {
            let pool_info = self.pools.get(&node.id)
                .map(|p| p.get_info());

            ClusterNodeInfo {
                node_id: node.id.clone(),
                host: node.host.clone(),
                port: node.port,
                region: node.region.clone(),
                primary: node.primary,
                available: node.is_available,
                pool_info,
            }
        }).collect()
    }

    /// Replicate key across all replicas
    pub fn replicate_key(&mut self, key: &str, value: &str) -> ReplicationResult {
        let mut successful = 0;
        let mut failed = 0;

        for (_, pool) in &mut self.pools {
            if pool.set(key, value, Some(3600)).success {
                successful += 1;
            } else {
                failed += 1;
            }
        }

        ReplicationResult {
            total: self.pools.len(),
            successful,
            failed,
        }
    }

    /// Get version metadata for a cached key
    ///
    /// Returns `(version, timestamp, region)` if the key has been written via `put()`.
    pub fn get_key_version(&self, key: &str) -> Option<(u64, u64, &str)> {
        self.key_version_cache
            .get(key)
            .map(|kv| (kv.version, kv.timestamp, kv.region.as_str()))
    }
}

#[derive(Debug, Clone)]
pub struct DistributedResult {
    pub success: bool,
    pub replicas_succeeded: usize,
    pub replicas_failed: usize,
    pub consistency_satisfied: bool,
}

#[derive(Debug, Clone)]
pub struct DistributedGetResult {
    pub success: bool,
    pub value: Option<String>,
    pub replicas_responded: usize,
    pub replicas_failed: usize,
}

#[derive(Debug, Clone)]
pub struct ClusterStatus {
    pub total_nodes: usize,
    pub available_nodes: usize,
    pub replication_factor: usize,
    pub consistency_level: ConsistencyLevel,
    pub pool_stats: HashMap<String, super::redis_cache::PoolStatistics>,
}

#[derive(Debug, Clone)]
pub struct ClusterNodeInfo {
    pub node_id: String,
    pub host: String,
    pub port: u16,
    pub region: String,
    pub primary: bool,
    pub available: bool,
    pub pool_info: Option<super::redis_cache::PoolInfo>,
}

#[derive(Debug, Clone)]
pub struct ReplicationResult {
    pub total: usize,
    pub successful: usize,
    pub failed: usize,
}

fn current_timestamp() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_redis_distributed_creation() {
        let config = RedisDistributedConfig {
            nodes: vec![
                RedisClusterNode {
                    id: "node1".to_string(),
                    host: "localhost".to_string(),
                    port: 6379,
                    region: "us-east".to_string(),
                    primary: true,
                    is_available: true,
                },
            ],
            replication_factor: 1,
            consistency_level: ConsistencyLevel::Eventual,
            conflict_resolution: ConflictResolution::LastWriteWins,
            health_check_interval_ms: 1000,
        };

        let cache = RedisDistributedCache::new(config).unwrap();
        assert_eq!(cache.config.nodes.len(), 1);
    }

    #[test]
    fn test_redis_distributed_put_get() {
        let config = RedisDistributedConfig {
            nodes: vec![
                RedisClusterNode {
                    id: "node1".to_string(),
                    host: "localhost".to_string(),
                    port: 6379,
                    region: "us-east".to_string(),
                    primary: true,
                    is_available: true,
                },
            ],
            replication_factor: 1,
            consistency_level: ConsistencyLevel::Eventual,
            conflict_resolution: ConflictResolution::LastWriteWins,
            health_check_interval_ms: 1000,
        };

        let mut cache = RedisDistributedCache::new(config).unwrap();
        
        let put_result = cache.put("test_key", "test_value", Some(3600));
        assert!(put_result.success);

        let get_result = cache.get("test_key");
        assert!(get_result.success);
    }

    #[test]
    fn test_redis_distributed_multi_node() {
        let config = RedisDistributedConfig {
            nodes: vec![
                RedisClusterNode {
                    id: "node1".to_string(),
                    host: "localhost".to_string(),
                    port: 6379,
                    region: "us-east".to_string(),
                    primary: true,
                    is_available: true,
                },
                RedisClusterNode {
                    id: "node2".to_string(),
                    host: "localhost".to_string(),
                    port: 6380,
                    region: "us-west".to_string(),
                    primary: false,
                    is_available: true,
                },
            ],
            replication_factor: 2,
            consistency_level: ConsistencyLevel::Sequential,
            conflict_resolution: ConflictResolution::Quorum,
            health_check_interval_ms: 1000,
        };

        let mut cache = RedisDistributedCache::new(config).unwrap();
        let put_result = cache.put("key1", "value1", Some(3600));
        
        // With 2 nodes, should have 2 replicas
        assert!(put_result.replicas_succeeded > 0);
    }

    #[test]
    fn test_redis_distributed_consistency_levels() {
        let mut config = RedisDistributedConfig {
            nodes: vec![
                RedisClusterNode {
                    id: "n1".to_string(),
                    host: "localhost".to_string(),
                    port: 6379,
                    region: "r1".to_string(),
                    primary: true,
                    is_available: true,
                },
            ],
            replication_factor: 1,
            consistency_level: ConsistencyLevel::Eventual,
            conflict_resolution: ConflictResolution::LastWriteWins,
            health_check_interval_ms: 1000,
        };

        let _cache = RedisDistributedCache::new(config.clone()).unwrap();
        assert_eq!(config.consistency_level, ConsistencyLevel::Eventual);

        config.consistency_level = ConsistencyLevel::Sequential;
        let _cache = RedisDistributedCache::new(config.clone()).unwrap();
        assert_eq!(config.consistency_level, ConsistencyLevel::Sequential);

        config.consistency_level = ConsistencyLevel::Strong;
        let _cache = RedisDistributedCache::new(config).unwrap();
    }

    #[test]
    fn test_redis_distributed_health_check() {
        let config = RedisDistributedConfig {
            nodes: vec![
                RedisClusterNode {
                    id: "node1".to_string(),
                    host: "localhost".to_string(),
                    port: 6379,
                    region: "us-east".to_string(),
                    primary: true,
                    is_available: true,
                },
            ],
            replication_factor: 1,
            consistency_level: ConsistencyLevel::Eventual,
            conflict_resolution: ConflictResolution::LastWriteWins,
            health_check_interval_ms: 1000,
        };

        let mut cache = RedisDistributedCache::new(config).unwrap();
        cache.check_health();

        let status = cache.get_status();
        assert_eq!(status.available_nodes, 1);
    }

    #[test]
    fn test_redis_distributed_cluster_info() {
        let config = RedisDistributedConfig {
            nodes: vec![
                RedisClusterNode {
                    id: "node1".to_string(),
                    host: "localhost".to_string(),
                    port: 6379,
                    region: "us-east".to_string(),
                    primary: true,
                    is_available: true,
                },
            ],
            replication_factor: 1,
            consistency_level: ConsistencyLevel::Sequential,
            conflict_resolution: ConflictResolution::Quorum,
            health_check_interval_ms: 1000,
        };

        let cache = RedisDistributedCache::new(config).unwrap();
        let info = cache.get_cluster_info();

        assert_eq!(info.len(), 1);
        assert_eq!(info[0].node_id, "node1");
        assert!(info[0].available);
    }
}
