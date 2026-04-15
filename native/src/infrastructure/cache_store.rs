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
