/// Phase 3: Persistent Cache Layer
/// Disk-based caching for cache warming and offline support
///
/// Features:
/// - Serialize cache to disk on shutdown
/// - Load cache on startup (warming)
/// - JSON-based storage format
/// - Configurable cache directory
/// - Automatic cleanup of old caches

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use std::error::Error;
use std::time::{SystemTime, UNIX_EPOCH};

/// Cache entry with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistentCacheEntry<V: Serialize> {
    pub key: String,
    pub value: V,
    pub created_at: u64,
    pub accessed_at: u64,
    pub hit_count: u32,
}

/// Persistent cache manager
pub struct PersistentCache<K: Clone + ToString, V: Clone + Serialize + for<'de> Deserialize<'de>> {
    cache_dir: PathBuf,
    cache_name: String,
    memory_cache: HashMap<K, PersistentCacheEntry<V>>,
    max_entries: usize,
}

impl<K: Clone + ToString + Eq + std::hash::Hash + for<'de> serde::Deserialize<'de>, V: Clone + Serialize + for<'de> Deserialize<'de>> PersistentCache<K, V> {
    /// Create new persistent cache
    pub fn new(cache_dir: impl AsRef<Path>, cache_name: &str, max_entries: usize) -> Result<Self, Box<dyn Error>> {
        let cache_dir = cache_dir.as_ref().to_path_buf();
        
        // Create cache directory if it doesn't exist
        fs::create_dir_all(&cache_dir)?;
        
        let mut cache = Self {
            cache_dir,
            cache_name: cache_name.to_string(),
            memory_cache: HashMap::new(),
            max_entries,
        };
        
        // Load from disk if available
        let _ = cache.load_from_disk();
        
        Ok(cache)
    }

    /// Get value from cache
    pub fn get(&mut self, key: &K) -> Option<V> {
        let _key_str = key.to_string();
        if let Some(entry) = self.memory_cache.get_mut(&key) {
            entry.accessed_at = current_timestamp();
            entry.hit_count += 1;
            return Some(entry.value.clone());
        }
        None
    }

    /// Put value into cache
    pub fn put(&mut self, key: K, value: V) -> Result<(), Box<dyn Error>> {
        let key_str = key.to_string();
        let now = current_timestamp();

        // Remove oldest entry if at capacity
        if self.memory_cache.len() >= self.max_entries {
            if let Some((oldest_key, _)) = self.memory_cache
                .iter()
                .min_by_key(|(_, entry)| entry.accessed_at)
                .map(|(k, e)| (k.clone(), e.clone()))
            {
                self.memory_cache.remove(&oldest_key);
            }
        }

        let entry = PersistentCacheEntry {
            key: key_str,
            value,
            created_at: now,
            accessed_at: now,
            hit_count: 0,
        };

        self.memory_cache.insert(key, entry);
        Ok(())
    }

    /// Save cache to disk
    pub fn save_to_disk(&self) -> Result<(), Box<dyn Error>> {
        let cache_file = self.cache_dir.join(format!("{}.cache.json", self.cache_name));
        let entries: Vec<_> = self.memory_cache.values().cloned().collect();
        let json = serde_json::to_string_pretty(&entries)?;
        fs::write(&cache_file, json)?;
        Ok(())
    }

    /// Load cache from disk
    pub fn load_from_disk(&mut self) -> Result<(), Box<dyn Error>> {
        let cache_file = self.cache_dir.join(format!("{}.cache.json", self.cache_name));
        
        if !cache_file.exists() {
            return Ok(());
        }

        let json = fs::read_to_string(&cache_file)?;
        let entries: Vec<PersistentCacheEntry<V>> = serde_json::from_str(&json)?;
        
        self.memory_cache.clear();
        for entry in entries.into_iter().take(self.max_entries) {
            // Reconstruct key from JSON
            if let Ok(key) = serde_json::from_str::<K>(&format!("\"{}\"", entry.key)) {
                self.memory_cache.insert(key, entry);
            }
        }

        Ok(())
    }

    /// Clear cache
    pub fn clear(&mut self) -> Result<(), Box<dyn Error>> {
        self.memory_cache.clear();
        let cache_file = self.cache_dir.join(format!("{}.cache.json", self.cache_name));
        if cache_file.exists() {
            fs::remove_file(&cache_file)?;
        }
        Ok(())
    }

    /// Get cache stats
    pub fn stats(&self) -> PersistentCacheStats {
        let entries = self.memory_cache.values();
        let total_hits: u32 = entries.clone().map(|e| e.hit_count).sum();
        let avg_age = if entries.clone().count() > 0 {
            let now = current_timestamp();
            let total_age: u64 = entries.clone().map(|e| now - e.created_at).sum();
            total_age / entries.clone().count() as u64
        } else {
            0
        };

        PersistentCacheStats {
            size: self.memory_cache.len(),
            max_entries: self.max_entries,
            total_hits,
            avg_age_seconds: avg_age,
            cache_file: self.cache_dir.join(format!("{}.cache.json", self.cache_name)),
        }
    }

    /// Get cache size in entries
    pub fn size(&self) -> usize {
        self.memory_cache.len()
    }

    /// Remove entry from cache
    pub fn remove(&mut self, key: &K) -> Option<V> {
        self.memory_cache.remove(key).map(|e| e.value)
    }
}

#[derive(Debug, Clone)]
pub struct PersistentCacheStats {
    pub size: usize,
    pub max_entries: usize,
    pub total_hits: u32,
    pub avg_age_seconds: u64,
    pub cache_file: PathBuf,
}

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_persistent_cache_save_and_load() {
        let temp_dir = TempDir::new().unwrap();
        
        // Create and populate cache
        let mut cache: PersistentCache<String, String> = 
            PersistentCache::new(temp_dir.path(), "test", 10).unwrap();
        
        cache.put("key1".to_string(), "value1".to_string()).unwrap();
        cache.put("key2".to_string(), "value2".to_string()).unwrap();
        cache.save_to_disk().unwrap();

        // Create new cache and load
        let mut cache2: PersistentCache<String, String> = 
            PersistentCache::new(temp_dir.path(), "test", 10).unwrap();
        
        assert_eq!(cache2.size(), 2);
    }

    #[test]
    fn test_persistent_cache_eviction() {
        let temp_dir = TempDir::new().unwrap();
        let mut cache: PersistentCache<i32, String> = 
            PersistentCache::new(temp_dir.path(), "evict_test", 3).unwrap();

        cache.put(1, "a".to_string()).unwrap();
        cache.put(2, "b".to_string()).unwrap();
        cache.put(3, "c".to_string()).unwrap();
        cache.put(4, "d".to_string()).unwrap(); // Should evict oldest

        assert_eq!(cache.size(), 3);
    }

    #[test]
    fn test_persistent_cache_stats() {
        let temp_dir = TempDir::new().unwrap();
        let mut cache: PersistentCache<String, String> = 
            PersistentCache::new(temp_dir.path(), "stats_test", 10).unwrap();

        cache.put("key1".to_string(), "value1".to_string()).unwrap();
        cache.get(&"key1".to_string());
        cache.get(&"key1".to_string());

        let stats = cache.stats();
        assert_eq!(stats.size, 1);
        assert_eq!(stats.total_hits, 2);
    }

    #[test]
    fn test_persistent_cache_clear() {
        let temp_dir = TempDir::new().unwrap();
        let mut cache: PersistentCache<String, String> = 
            PersistentCache::new(temp_dir.path(), "clear_test", 10).unwrap();

        cache.put("key1".to_string(), "value1".to_string()).unwrap();
        cache.save_to_disk().unwrap();
        
        cache.clear().unwrap();
        assert_eq!(cache.size(), 0);

        let cache_file = temp_dir.path().join("clear_test.cache.json");
        assert!(!cache_file.exists());
    }
}
