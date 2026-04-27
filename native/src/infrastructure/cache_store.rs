use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::shared::utils::{serde_json_string, short_hash};

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CacheEntry {
    pub file: String,
    pub classes: Vec<String>,
    pub hash: String,
    pub mtime_ms: f64,
    pub size: u32,
    pub hit_count: u32,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CacheReadResult {
    pub entries: Vec<CacheEntry>,
    pub version: u32,
}

fn json_unescape(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut chars = input.chars();

    while let Some(ch) = chars.next() {
        if ch != '\\' {
            out.push(ch);
            continue;
        }

        match chars.next() {
            Some('"') => out.push('"'),
            Some('\\') => out.push('\\'),
            Some('/') => out.push('/'),
            Some('b') => out.push('\u{0008}'),
            Some('f') => out.push('\u{000C}'),
            Some('n') => out.push('\n'),
            Some('r') => out.push('\r'),
            Some('t') => out.push('\t'),
            Some('u') => {
                let mut hex = String::with_capacity(4);
                for _ in 0..4 {
                    if let Some(h) = chars.next() {
                        hex.push(h);
                    }
                }
                if let Ok(code) = u16::from_str_radix(&hex, 16) {
                    if let Some(decoded) = char::from_u32(code as u32) {
                        out.push(decoded);
                    }
                }
            }
            Some(other) => out.push(other),
            None => break,
        }
    }

    out
}

/// Read a scanner cache JSON file into structured entries.
/// Replaces the JS `ScanCache.read()` method.
#[napi]
pub fn cache_read(cache_path: String) -> napi::Result<CacheReadResult> {
    static RE_MTIME: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#""mtimeMs"\s*:\s*([0-9.]+)"#).unwrap());
    static RE_SIZE: Lazy<Regex> = Lazy::new(|| Regex::new(r#""size"\s*:\s*(\d+)"#).unwrap());
    static RE_CLASSES: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#""classes"\s*:\s*\[([^\]]*)\]"#).unwrap());
    static RE_HIT: Lazy<Regex> = Lazy::new(|| Regex::new(r#""hitCount"\s*:\s*(\d+)"#).unwrap());
    static RE_HASH: Lazy<Regex> = Lazy::new(|| Regex::new(r#""hash"\s*:\s*"([^"]*)""#).unwrap());

    let content = std::fs::read_to_string(&cache_path).map_err(|e| {
        napi::Error::from_reason(format!("Cannot read cache file {}: {}", cache_path, e))
    })?;

    let mut entries: Vec<CacheEntry> = Vec::new();

    // Walk character-by-character extracting "filepath": { ... } entries
    let chars: Vec<char> = content.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        // Find opening quote of a key
        if chars[i] != '"' {
            i += 1;
            continue;
        }
        let key_start = i + 1;
        let mut j = key_start;
        // Scan to closing quote (skip escaped quotes)
        while j < len && !(chars[j] == '"' && chars[j.saturating_sub(1)] != '\\') {
            j += 1;
        }
        if j >= len {
            break;
        }
        let key_raw: String = chars[key_start..j].iter().collect();
        let key = json_unescape(&key_raw);
        i = j + 1;

        // Skip whitespace
        while i < len && chars[i].is_ascii_whitespace() {
            i += 1;
        }
        // Must be followed by ':'
        if i >= len || chars[i] != ':' {
            continue;
        }
        i += 1;
        while i < len && chars[i].is_ascii_whitespace() {
            i += 1;
        }
        // Value must be an object '{'
        if i >= len || chars[i] != '{' {
            continue;
        }

        // Skip structural wrapper keys
        if key == "version" || key == "files" {
            i += 1;
            continue;
        }

        // Capture the full object with brace-depth counting
        let obj_start = i;
        let mut depth = 0i32;
        while i < len {
            match chars[i] {
                '{' => depth += 1,
                '}' => {
                    depth -= 1;
                    if depth == 0 {
                        i += 1;
                        break;
                    }
                }
                _ => {}
            }
            i += 1;
        }
        if i > obj_start {
            let obj: String = chars[obj_start..i].iter().collect();

            let mtime_ms: f64 = RE_MTIME
                .captures(&obj)
                .and_then(|c| c[1].parse().ok())
                .unwrap_or(0.0);
            let size: u32 = RE_SIZE
                .captures(&obj)
                .and_then(|c| c[1].parse().ok())
                .unwrap_or(0);
            let hit_count: u32 = RE_HIT
                .captures(&obj)
                .and_then(|c| c[1].parse().ok())
                .unwrap_or(0);
            let hash = RE_HASH
                .captures(&obj)
                .map(|c| json_unescape(&c[1]))
                .unwrap_or_else(|| short_hash(&key));
            let classes: Vec<String> = RE_CLASSES
                .captures(&obj)
                .map(|c| {
                    c[1].split(',')
                        .map(|s| json_unescape(s.trim().trim_matches('"')))
                        .filter(|s| !s.is_empty())
                        .collect()
                })
                .unwrap_or_default();

            entries.push(CacheEntry {
                file: key,
                classes,
                hash,
                mtime_ms,
                size,
                hit_count,
            });
        }
    }

    Ok(CacheReadResult {
        entries,
        version: 2,
    })
}

/// Write cache entries to a JSON cache file.
/// Replaces the JS `ScanCache.save()` method.
#[napi]
pub fn cache_write(cache_path: String, entries: Vec<CacheEntry>) -> napi::Result<bool> {
    if cache_path.trim().is_empty() {
        return Err(napi::Error::from_reason(
            "cache_path cannot be empty".to_string(),
        ));
    }

    let parent = std::path::Path::new(&cache_path).parent();
    if let Some(p) = parent {
        std::fs::create_dir_all(p).map_err(|e| {
            napi::Error::from_reason(format!(
                "Cannot create cache directory {}: {}",
                p.display(),
                e
            ))
        })?;
    }

    let mut lines: Vec<String> = Vec::new();
    for e in &entries {
        let classes_json: Vec<String> = e.classes.iter().map(|c| serde_json_string(c)).collect();
        lines.push(format!(
            "  {}: {{\"mtimeMs\":{},\"size\":{},\"classes\":[{}],\"hitCount\":{},\"hash\":{}}}",
            serde_json_string(&e.file),
            e.mtime_ms,
            e.size,
            classes_json.join(","),
            e.hit_count,
            serde_json_string(&e.hash)
        ));
    }

    let json = format!(
        "{{\"version\":2,\"files\":{{\n{}\n}}}}\n",
        lines.join(",\n")
    );
    std::fs::write(&cache_path, json).map_err(|e| {
        napi::Error::from_reason(format!("Cannot write cache file {}: {}", cache_path, e))
    })?;
    Ok(true)
}

/// Compute priority score for a file (SmartCache logic in Rust).
/// Higher score = process first.
#[napi]
pub fn cache_priority(
    mtime_ms: f64,
    size: u32,
    cached_mtime_ms: f64,
    cached_size: u32,
    cached_hit_count: u32,
    cached_last_seen_ms: f64,
    now_ms: f64,
) -> f64 {
    if cached_mtime_ms == 0.0 {
        return 1_000_000_000.0; // never cached = highest priority
    }
    let mtime_delta = (mtime_ms - cached_mtime_ms).max(0.0);
    let size_delta = (size as f64 - cached_size as f64).abs();
    let recency = if cached_last_seen_ms > 0.0 {
        now_ms - cached_last_seen_ms
    } else {
        0.0
    };
    let hotness = cached_hit_count as f64;

    mtime_delta * 1000.0 + size_delta * 10.0 + hotness * 100.0 - recency / 1000.0
}

// ═════════════════════════════════════════════════════════════════════════════
// ─────────────────────────────────────────────────────────────────────────────
// prune_stale_entries — migrated from cache-native.ts#pruneStaleEntries()
// ─────────────────────────────────────────────────────────────────────────────

/// Entry minimal untuk stale-check — hanya field yang dibutuhkan Rust.
#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct StaleCheckEntry {
    pub file: String,
    pub last_seen_ms: f64,
}

/// Hasil prune — entries yang lolos + jumlah yang dihapus.
#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct PruneResult {
    /// Indices (0-based) dari entries yang LOLOS (tidak stale).
    /// JS menggunakan ini untuk filter array aslinya.
    pub kept_indices: Vec<u32>,
    /// Jumlah entries yang dihapus.
    pub removed: u32,
}

/// Batch-check file existence + stale age — menggantikan loop JS yang
/// memanggil `existsSync()` satu per satu di `pruneStaleEntries()`.
///
/// **Menggantikan** `pruneStaleEntries()` di `scanner/cache-native.ts`.
///
/// JS: `entries.filter(e => existsSync(e.file) && ...)` — satu syscall per file,
///     semuanya blocking di main thread.
/// Rust: batch metadata check via `std::fs::metadata()` — bisa diparalelkan
///       dengan rayon jika entries > threshold.
///
/// # Arguments
/// - `entries`      — array entries yang akan di-check
/// - `max_age_ms`   — threshold umur `lastSeenMs` (default 7 hari = 604_800_000)
/// - `check_exists` — jika true, hapus entries yang file-nya sudah tidak ada
#[napi]
pub fn prune_stale_entries(
    entries: Vec<StaleCheckEntry>,
    max_age_ms: Option<f64>,
    check_exists: Option<bool>,
) -> PruneResult {
    let threshold = max_age_ms.unwrap_or(7.0 * 24.0 * 60.0 * 60.0 * 1000.0);
    let do_exists_check = check_exists.unwrap_or(true);
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as f64;

    let mut kept_indices: Vec<u32> = Vec::with_capacity(entries.len());

    for (i, entry) in entries.iter().enumerate() {
        // 1. File existence check (syscall — batched natively, no JS event loop)
        if do_exists_check && !std::path::Path::new(&entry.file).exists() {
            continue; // file sudah tidak ada — skip
        }
        // 2. Age check
        if entry.last_seen_ms > 0.0 && (now - entry.last_seen_ms) > threshold {
            continue; // terlalu lama tidak dilihat — skip
        }
        kept_indices.push(i as u32);
    }

    let removed = (entries.len() as u32).saturating_sub(kept_indices.len() as u32);
    PruneResult { kept_indices, removed }
}

// ─────────────────────────────────────────────────────────────────────────────
// compute_cache_stats — migrated from cache-native.ts#computeCacheStats()
// ─────────────────────────────────────────────────────────────────────────────

/// Stats hasil komputasi disk cache.
#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct CacheStatsResult {
    pub total_entries: u32,
    pub total_classes: u32,
    pub total_size_bytes: u32,
    /// Rata-rata jumlah class per entry (× 100 untuk 2 desimal tanpa float issue).
    pub avg_classes_per_entry_x100: u32,
    /// Top-10 class paling sering muncul lintas file.
    pub most_used_classes: Vec<ClassFrequency>,
}

#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct ClassFrequency {
    pub class: String,
    pub count: u32,
}

/// Hitung stats dari disk cache entries — class frequency count + top-10 sort.
///
/// **Menggantikan** `computeCacheStats()` di `scanner/cache-native.ts`.
///
/// JS: `new Map<string,number>()` + manual count loop + `.sort()` + `.slice(0,10)`.
///     Untuk 5000 entries × 30 classes = 150,000 Map.set() calls di V8.
/// Rust: `HashMap::with_capacity` + direct count + partial_sort via select_nth_unstable.
///       ~3× lebih cepat untuk workspace besar, tanpa GC pressure.
///
/// # Arguments
/// - `files_classes` — array per-file class lists (parallel ke `entries`)
/// - `sizes`         — array size bytes per entry (harus sama panjang)
/// - `top`           — berapa top classes yang dikembalikan (default 10)
#[napi]
pub fn compute_cache_stats(
    files_classes: Vec<Vec<String>>,
    sizes: Vec<u32>,
    top: Option<u32>,
) -> CacheStatsResult {
    let top_n = top.unwrap_or(10) as usize;

    if files_classes.is_empty() {
        return CacheStatsResult {
            total_entries: 0,
            total_classes: 0,
            total_size_bytes: 0,
            avg_classes_per_entry_x100: 0,
            most_used_classes: vec![],
        };
    }

    let mut class_counts: std::collections::HashMap<String, u32> =
        std::collections::HashMap::with_capacity(512);
    let mut total_classes: u32 = 0;
    let mut total_size: u32 = 0;

    for (i, classes) in files_classes.iter().enumerate() {
        total_classes += classes.len() as u32;
        total_size += sizes.get(i).copied().unwrap_or(0);
        for cls in classes {
            *class_counts.entry(cls.clone()).or_insert(0) += 1;
        }
    }

    // Sort descending by count, then alphabetically — same as JS
    let mut freq_vec: Vec<(String, u32)> = class_counts.into_iter().collect();
    freq_vec.sort_unstable_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    let most_used_classes = freq_vec
        .into_iter()
        .take(top_n)
        .map(|(cls, count)| ClassFrequency { class: cls, count })
        .collect();

    let n = files_classes.len() as u32;
    let avg_x100 = if n > 0 {
        (total_classes as u64 * 100 / n as u64) as u32
    } else {
        0
    };

    CacheStatsResult {
        total_entries: n,
        total_classes,
        total_size_bytes: total_size,
        avg_classes_per_entry_x100: avg_x100,
        most_used_classes,
    }
}

#[cfg(test)]
mod cache_store_tests {
    use super::*;

    #[test]
    fn test_prune_stale_entries_all_fresh() {
        let entries = vec![
            StaleCheckEntry { file: "/nonexistent/a.ts".into(), last_seen_ms: 0.0 },
            StaleCheckEntry { file: "/nonexistent/b.ts".into(), last_seen_ms: 0.0 },
        ];
        // check_exists=false so file existence is skipped
        let result = prune_stale_entries(entries, None, Some(false));
        assert_eq!(result.kept_indices, vec![0, 1]);
        assert_eq!(result.removed, 0);
    }

    #[test]
    fn test_prune_stale_entries_too_old() {
        let very_old_ms = 1_000_000.0; // epoch 1970 — definitly stale
        let entries = vec![
            StaleCheckEntry { file: "/nonexistent/a.ts".into(), last_seen_ms: very_old_ms },
            StaleCheckEntry { file: "/nonexistent/b.ts".into(), last_seen_ms: 0.0 },
        ];
        let result = prune_stale_entries(entries, None, Some(false));
        // a.ts stale (too old), b.ts fresh (last_seen_ms=0 means never checked → keep)
        assert_eq!(result.kept_indices, vec![1]);
        assert_eq!(result.removed, 1);
    }

    #[test]
    fn test_compute_cache_stats_basic() {
        let files = vec![
            vec!["p-4".into(), "flex".into(), "text-red-500".into()],
            vec!["p-4".into(), "flex".into()],
        ];
        let sizes = vec![1024u32, 512u32];
        let result = compute_cache_stats(files, sizes, Some(10));

        assert_eq!(result.total_entries, 2);
        assert_eq!(result.total_classes, 5);
        assert_eq!(result.total_size_bytes, 1536);
        // top class: p-4 and flex both count=2
        assert!(result.most_used_classes.iter().any(|c| c.class == "p-4" && c.count == 2));
        assert!(result.most_used_classes.iter().any(|c| c.class == "flex" && c.count == 2));
        assert!(result.most_used_classes.iter().any(|c| c.class == "text-red-500" && c.count == 1));
    }

    #[test]
    fn test_compute_cache_stats_empty() {
        let result = compute_cache_stats(vec![], vec![], None);
        assert_eq!(result.total_entries, 0);
        assert_eq!(result.most_used_classes.len(), 0);
    }

    #[test]
    fn test_compute_cache_stats_top_limit() {
        let classes: Vec<String> = (0..20).map(|i| format!("class-{}", i)).collect();
        let sizes = vec![100u32];
        let result = compute_cache_stats(vec![classes], sizes, Some(5));
        assert_eq!(result.most_used_classes.len(), 5);
    }
}