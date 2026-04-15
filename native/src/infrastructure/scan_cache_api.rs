use napi_derive::napi;

use crate::scan_cache;

#[napi(object)]
pub struct ScanCacheStats {
    pub size: u32,
}

/// Get cached classes for a file by content hash. Returns null on miss.
#[napi]
pub fn scan_cache_get(file_path: String, content_hash: String) -> Option<Vec<String>> {
    scan_cache::cache_get(&file_path, &content_hash)
}

/// Store extraction result in the in-memory cache.
#[napi]
pub fn scan_cache_put(
    file_path: String,
    content_hash: String,
    classes: Vec<String>,
    mtime_ms: f64,
    size: u32,
) {
    scan_cache::cache_put(&file_path, &content_hash, classes, mtime_ms, size);
}

/// Invalidate a single cache entry (file deleted or renamed).
#[napi]
pub fn scan_cache_invalidate(file_path: String) {
    scan_cache::cache_invalidate(&file_path);
}

/// Return number of entries currently in the cache.
#[napi]
pub fn scan_cache_stats() -> ScanCacheStats {
    ScanCacheStats {
        size: scan_cache::cache_size() as u32,
    }
}

// ═════════════════════════════════════════════════════════════════════════════
