//! Animate Utilities — migrated from `animate/src/registry.ts`
//!
//! Fungsi yang dimigrate:
//!   - `animationCacheKey(opts)`            → `animation_cache_key(json)`
//!   - `keyframesCacheKey(name, stops)`     → `keyframes_cache_key(name, stops_json)`
//!   - `stableKeyframesEntries(stops)`      → `stable_keyframes_entries(stops_json)`
//!   - `splitClasses(classList)`            → `split_classes(class_list)`
//!   - `normalizeNumber(v, fallback)`       → `normalize_number(v, fallback)`
//!   - `normalizeIterations(v)`             → `normalize_iterations(v)`
//!
//! Kenapa worth di-native:
//! - `animationCacheKey` dipanggil setiap kali `compileAnimation` dipanggil
//! - `stableKeyframesEntries` melakukan sort yang sebelumnya pakai `localeCompare`
//! - `splitClasses` dipanggil per class list validation (setiap frame)

use napi_derive::napi;
use serde::{Deserialize, Serialize};

// ─────────────────────────────────────────────────────────────────────────────
// Constants — mirrors defaults di registry.ts
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_DURATION: u32 = 300;
const DEFAULT_EASING: &str = "ease-out";
const DEFAULT_DELAY: u32 = 0;
const DEFAULT_FILL: &str = "both";
const DEFAULT_ITERATIONS: u32 = 1;
const DEFAULT_DIRECTION: &str = "normal";

// ─────────────────────────────────────────────────────────────────────────────
// Output types
// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, Clone)]
pub struct KeyframeEntry {
    pub offset: String,
    pub classes: String,
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

fn normalize_number_inner(value: f64, fallback: u32) -> u32 {
    if !value.is_finite() || value < 0.0 {
        return fallback;
    }
    value.trunc() as u32
}

fn normalize_iterations_inner(value: &str) -> String {
    if value == "infinite" {
        return "infinite".to_string();
    }
    match value.parse::<f64>() {
        Ok(n) if n.is_finite() && n >= 0.0 => (n.trunc() as u32).to_string(),
        _ => DEFAULT_ITERATIONS.to_string(),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI exports
// ─────────────────────────────────────────────────────────────────────────────

/// Split whitespace-separated class list into individual class strings.
///
/// Replaces `splitClasses(classList)` in `animate/src/registry.ts`.
/// Called on every animation validation pass.
#[napi]
pub fn split_animate_classes(class_list: String) -> Vec<String> {
    class_list
        .split_whitespace()
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect()
}

/// Normalize a numeric value with a fallback.
///
/// Replaces `normalizeNumber(value, fallback)` in `animate/src/registry.ts`.
#[napi]
pub fn normalize_number(value: f64, fallback: u32) -> u32 {
    normalize_number_inner(value, fallback)
}

/// Normalize an iterations value ("infinite" | number string).
///
/// Replaces `normalizeIterations(value)` in `animate/src/registry.ts`.
#[napi]
pub fn normalize_iterations(value: String) -> String {
    normalize_iterations_inner(&value)
}

/// Sort keyframe stops by offset key (locale-stable ASCII sort).
///
/// Replaces `stableKeyframesEntries(stops)` in `animate/src/registry.ts`.
///
/// Input JSON:  `{ "0%": "opacity-0", "100%": "opacity-100" }`
/// Output JSON: `[{ "offset": "0%", "classes": "opacity-0" }, ...]` sorted by offset.
#[napi]
pub fn stable_keyframes_entries(stops_json: String) -> Vec<KeyframeEntry> {
    let stops: std::collections::HashMap<String, String> = match serde_json::from_str(&stops_json) {
        Ok(m) => m,
        Err(_) => return vec![],
    };

    let mut entries: Vec<KeyframeEntry> = stops
        .into_iter()
        .map(|(offset, classes)| KeyframeEntry { offset, classes })
        .collect();

    // Locale-stable: simple byte-order sort matches JS `localeCompare` for ASCII keys
    entries.sort_by(|a, b| a.offset.cmp(&b.offset));
    entries
}

/// Generate a stable cache key for an animation options object.
///
/// Replaces `animationCacheKey(opts)` in `animate/src/registry.ts`.
///
/// Input JSON: `{ from, to, duration?, easing?, delay?, fill?, iterations?, direction?, name? }`
/// Output: deterministic JSON string suitable for Map key.
#[napi]
pub fn animation_cache_key(opts_json: String) -> String {
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct AnimateOpts {
        from: String,
        to: String,
        duration: Option<f64>,
        easing: Option<String>,
        delay: Option<f64>,
        fill: Option<String>,
        iterations: Option<serde_json::Value>,
        direction: Option<String>,
        name: Option<String>,
    }

    let opts: AnimateOpts = match serde_json::from_str(&opts_json) {
        Ok(o) => o,
        Err(_) => return opts_json,
    };

    let iterations_str = match &opts.iterations {
        Some(serde_json::Value::String(s)) => normalize_iterations_inner(s),
        Some(serde_json::Value::Number(n)) => normalize_iterations_inner(&n.to_string()),
        _ => DEFAULT_ITERATIONS.to_string(),
    };

    // Build normalized key deterministically
    let key = format!(
        r#"{{"from":{},"to":{},"duration":{},"easing":{},"delay":{},"fill":{},"iterations":{},"direction":{},"name":{}}}"#,
        serde_json_str(opts.from.trim()),
        serde_json_str(opts.to.trim()),
        normalize_number_inner(opts.duration.unwrap_or(f64::NAN), DEFAULT_DURATION),
        serde_json_str(opts.easing.as_deref().unwrap_or(DEFAULT_EASING).trim()),
        normalize_number_inner(opts.delay.unwrap_or(f64::NAN), DEFAULT_DELAY),
        serde_json_str(opts.fill.as_deref().unwrap_or(DEFAULT_FILL)),
        serde_json_str(&iterations_str),
        serde_json_str(opts.direction.as_deref().unwrap_or(DEFAULT_DIRECTION)),
        serde_json_str(opts.name.as_deref().unwrap_or("")),
    );
    key
}

/// Generate a stable cache key for a named keyframes definition.
///
/// Replaces `keyframesCacheKey(name, stops)` in `animate/src/registry.ts`.
///
/// Input: name string + stops JSON (`{ "0%": "...", "100%": "..." }`)
/// Output: `"name::[{offset,classes},...]"` string.
#[napi]
pub fn keyframes_cache_key(name: String, stops_json: String) -> String {
    let entries = stable_keyframes_entries(stops_json);
    let entries_json = serde_json::to_string(&entries).unwrap_or_default();
    format!("{}::{}", name, entries_json)
}

fn serde_json_str(s: &str) -> String {
    serde_json::to_string(s).unwrap_or_else(|_| format!("\"{}\"", s.replace('"', "\\\"")))
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_classes() {
        let result = split_animate_classes("  opacity-0   scale-95  ".to_string());
        assert_eq!(result, vec!["opacity-0", "scale-95"]);
    }

    #[test]
    fn test_split_classes_empty() {
        assert!(split_animate_classes("   ".to_string()).is_empty());
    }

    #[test]
    fn test_normalize_number() {
        assert_eq!(normalize_number(300.9, 100), 300);
        assert_eq!(normalize_number(f64::NAN, 100), 100);
        assert_eq!(normalize_number(-5.0, 100), 100);
    }

    #[test]
    fn test_normalize_iterations_infinite() {
        assert_eq!(normalize_iterations("infinite".to_string()), "infinite");
    }

    #[test]
    fn test_normalize_iterations_number() {
        assert_eq!(normalize_iterations("3.7".to_string()), "3");
        assert_eq!(normalize_iterations("bad".to_string()), "1");
    }

    #[test]
    fn test_stable_keyframes_entries_sorted() {
        let stops = r#"{"100%":"opacity-100","0%":"opacity-0","50%":"opacity-50"}"#;
        let entries = stable_keyframes_entries(stops.to_string());
        assert_eq!(entries[0].offset, "0%");
        assert_eq!(entries[1].offset, "100%");
        assert_eq!(entries[2].offset, "50%");
    }

    #[test]
    fn test_animation_cache_key_deterministic() {
        let opts = r#"{"from":"opacity-0","to":"opacity-100","duration":300}"#;
        let key1 = animation_cache_key(opts.to_string());
        let key2 = animation_cache_key(opts.to_string());
        assert_eq!(key1, key2);
    }

    #[test]
    fn test_animation_cache_key_fills_defaults() {
        let opts = r#"{"from":"scale-95","to":"scale-100"}"#;
        let key = animation_cache_key(opts.to_string());
        assert!(key.contains("ease-out")); // default easing
        assert!(key.contains("300")); // default duration
    }

    #[test]
    fn test_keyframes_cache_key() {
        let key = keyframes_cache_key(
            "fadeIn".to_string(),
            r#"{"100%":"opacity-100","0%":"opacity-0"}"#.to_string(),
        );
        assert!(key.starts_with("fadeIn::"));
        // Entries should be sorted
        let entry_part = key.strip_prefix("fadeIn::").unwrap();
        assert!(entry_part.find("0%").unwrap() < entry_part.find("100%").unwrap());
    }
}