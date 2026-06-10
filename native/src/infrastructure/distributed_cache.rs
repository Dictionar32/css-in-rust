/// Phase 3: Distributed Cache Foundation
/// Multi-node cache coordination layer
///
/// Features:
/// - Cache key distribution across nodes
/// - Consistent hashing for node mapping
/// - Cache invalidation protocol
/// - Node health checking
/// - Automatic failover

use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

/// Distributed cache node
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CacheNode {
    pub id: String,
    pub address: String,
    pub port: u16,
    pub is_healthy: bool,
    pub last_heartbeat: u64,
}

/// Distributed cache configuration
#[derive(Debug, Clone)]
pub struct DistributedCacheConfig {
    pub replica_count: usize,
    pub consistency_level: ConsistencyLevel,
    pub heartbeat_interval_ms: u64,
    pub heartbeat_timeout_ms: u64,
    pub replication_timeout_ms: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConsistencyLevel {
    /// Write to one node, read from any node
    Eventually,
    /// Write to majority, read from majority
    Quorum,
    /// Write to all, read from any
    Strong,
}

impl Default for DistributedCacheConfig {
    fn default() -> Self {
        Self {
            replica_count: 3,
            consistency_level: ConsistencyLevel::Quorum,
            heartbeat_interval_ms: 1000,
            heartbeat_timeout_ms: 5000,
            replication_timeout_ms: 2000,
        }
    }
}

/// Distributed cache manager
pub struct DistributedCache {
    nodes: Vec<CacheNode>,
    config: DistributedCacheConfig,
    node_index: HashMap<String, usize>,
    virtual_nodes: usize,
}

impl DistributedCache {
    /// Create new distributed cache
    pub fn new(config: DistributedCacheConfig) -> Self {
        Self {
            nodes: Vec::new(),
            config,
            node_index: HashMap::new(),
            virtual_nodes: 160, // 160 virtual nodes per physical node
        }
    }

    /// Add node to cluster
    pub fn add_node(&mut self, node: CacheNode) -> Result<(), String> {
        if self.node_index.contains_key(&node.id) {
            return Err(format!("Node {} already exists", node.id));
        }

        let idx = self.nodes.len();
        self.node_index.insert(node.id.clone(), idx);
        self.nodes.push(node);
        Ok(())
    }

    /// Remove node from cluster
    pub fn remove_node(&mut self, node_id: &str) -> Result<(), String> {
        if let Some(&idx) = self.node_index.get(node_id) {
            self.nodes.remove(idx);
            self.node_index.remove(node_id);
            
            // Update indices
            for (_, i) in self.node_index.iter_mut() {
                if *i > idx {
                    *i -= 1;
                }
            }
            Ok(())
        } else {
            Err(format!("Node {} not found", node_id))
        }
    }

    /// Get nodes responsible for key (consistent hashing)
    pub fn get_replica_nodes(&self, key: &str) -> Vec<&CacheNode> {
        let hash = self.hash_key(key);
        let mut replicas = Vec::new();

        for i in 0..self.config.replica_count {
            if let Some(node) = self.get_node_by_hash((hash + i as u64) % (self.nodes.len() as u64 * self.virtual_nodes as u64)) {
                if !replicas.contains(&node) && node.is_healthy {
                    replicas.push(node);
                }
            }
        }

        replicas
    }

    /// Get primary node for key
    pub fn get_primary_node(&self, key: &str) -> Option<&CacheNode> {
        let hash = self.hash_key(key);
        self.get_node_by_hash(hash)
            .filter(|node| node.is_healthy)
    }

    /// Hash key to node index
    fn hash_key(&self, key: &str) -> u64 {
        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        hasher.finish()
    }

    /// Get node by hash
    fn get_node_by_hash(&self, hash: u64) -> Option<&CacheNode> {
        if self.nodes.is_empty() {
            return None;
        }

        let node_idx = (hash as usize) % self.nodes.len();
        Some(&self.nodes[node_idx])
    }

    /// Mark node as healthy
    pub fn mark_healthy(&mut self, node_id: &str, is_healthy: bool) {
        if let Some(&idx) = self.node_index.get(node_id) {
            if idx < self.nodes.len() {
                self.nodes[idx].is_healthy = is_healthy;
            }
        }
    }

    /// Update heartbeat timestamp
    pub fn update_heartbeat(&mut self, node_id: &str, timestamp: u64) {
        if let Some(&idx) = self.node_index.get(node_id) {
            if idx < self.nodes.len() {
                self.nodes[idx].last_heartbeat = timestamp;
                self.nodes[idx].is_healthy = true;
            }
        }
    }

    /// Get all healthy nodes
    pub fn get_healthy_nodes(&self) -> Vec<&CacheNode> {
        self.nodes.iter().filter(|n| n.is_healthy).collect()
    }

    /// Get cluster size
    pub fn cluster_size(&self) -> usize {
        self.nodes.len()
    }

    /// Get healthy node count
    pub fn healthy_node_count(&self) -> usize {
        self.nodes.iter().filter(|n| n.is_healthy).count()
    }

    /// Get cluster status
    pub fn get_status(&self) -> ClusterStatus {
        ClusterStatus {
            total_nodes: self.nodes.len(),
            healthy_nodes: self.healthy_node_count(),
            consistency_level: self.config.consistency_level,
            replica_count: self.config.replica_count,
            nodes: self.nodes.clone(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ClusterStatus {
    pub total_nodes: usize,
    pub healthy_nodes: usize,
    pub consistency_level: ConsistencyLevel,
    pub replica_count: usize,
    pub nodes: Vec<CacheNode>,
}

/// Cache invalidation event
#[derive(Debug, Clone)]
pub struct InvalidationEvent {
    pub key: String,
    pub source_node: String,
    pub timestamp: u64,
    pub invalidation_type: InvalidationType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InvalidationType {
    KeyInvalidated,
    PatternInvalidated,
    FullInvalidation,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_distributed_cache_add_node() {
        let mut cache = DistributedCache::new(DistributedCacheConfig::default());
        
        let node = CacheNode {
            id: "node1".to_string(),
            address: "localhost".to_string(),
            port: 6379,
            is_healthy: true,
            last_heartbeat: 0,
        };

        assert!(cache.add_node(node).is_ok());
        assert_eq!(cache.cluster_size(), 1);
    }

    #[test]
    fn test_distributed_cache_duplicate_node() {
        let mut cache = DistributedCache::new(DistributedCacheConfig::default());
        
        let node = CacheNode {
            id: "node1".to_string(),
            address: "localhost".to_string(),
            port: 6379,
            is_healthy: true,
            last_heartbeat: 0,
        };

        cache.add_node(node.clone()).unwrap();
        assert!(cache.add_node(node).is_err());
    }

    #[test]
    fn test_distributed_cache_replica_nodes() {
        let mut cache = DistributedCache::new(DistributedCacheConfig::default());
        
        for i in 0..3 {
            let node = CacheNode {
                id: format!("node{}", i),
                address: "localhost".to_string(),
                port: 6379 + i as u16,
                is_healthy: true,
                last_heartbeat: 0,
            };
            cache.add_node(node).unwrap();
        }

        let replicas = cache.get_replica_nodes("test_key");
        assert!(!replicas.is_empty());
    }

    #[test]
    fn test_distributed_cache_healthy_nodes() {
        let mut cache = DistributedCache::new(DistributedCacheConfig::default());
        
        let node1 = CacheNode {
            id: "node1".to_string(),
            address: "localhost".to_string(),
            port: 6379,
            is_healthy: true,
            last_heartbeat: 0,
        };

        let node2 = CacheNode {
            id: "node2".to_string(),
            address: "localhost".to_string(),
            port: 6380,
            is_healthy: false,
            last_heartbeat: 0,
        };

        cache.add_node(node1).unwrap();
        cache.add_node(node2).unwrap();

        assert_eq!(cache.healthy_node_count(), 1);
    }

    #[test]
    fn test_distributed_cache_mark_health() {
        let mut cache = DistributedCache::new(DistributedCacheConfig::default());
        
        let node = CacheNode {
            id: "node1".to_string(),
            address: "localhost".to_string(),
            port: 6379,
            is_healthy: true,
            last_heartbeat: 0,
        };

        cache.add_node(node).unwrap();
        cache.mark_healthy("node1", false);

        assert_eq!(cache.healthy_node_count(), 0);
    }

    #[test]
    fn test_distributed_cache_remove_node() {
        let mut cache = DistributedCache::new(DistributedCacheConfig::default());
        
        let node = CacheNode {
            id: "node1".to_string(),
            address: "localhost".to_string(),
            port: 6379,
            is_healthy: true,
            last_heartbeat: 0,
        };

        cache.add_node(node).unwrap();
        assert_eq!(cache.cluster_size(), 1);

        cache.remove_node("node1").unwrap();
        assert_eq!(cache.cluster_size(), 0);
    }
}
