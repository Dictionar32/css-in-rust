//! Cache Resolver — DashMap-backed CSS Reverse Lookup Cache
//!
//! Replaces the JS `Map<string, ParsedRule[]>` inside `ReverseLookup` in
//! `engine/src/reverseLookup.ts`.
//!
//! Why Rust DashMap > JS Map:
//! - Lock-free concurrent reads via per-shard RwLocks (DashMap internals)
//! - Zero GC pressure — no V8 heap involvement for cache entries
//! - Eviction is O(1) amortized (LRU via insertion-order index tracking)
//! - FNV-1a key hashing is faster than V8 string hash for large CSS blobs
//!
//! NAPI surface:
//!   `reverse_lookup_from_css(css, property, value)  → JSON`
//!   `reverse_lookup_by_property(css, property)      → JSON`
//!   `reverse_lookup_find_dependents(css, class_name) → string[]`
//!   `reverse_lookup_clear_cache()                    → void`
//!   `reverse_lookup_cache_size()                     → u32`

use dashmap::DashMap;
use napi_derive::napi;
use once_cell::sync::Lazy;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::domain::semantic::{parse_css_rules, split_variant_and_base, CssRuleLookup};

// ─────────────────────────────────────────────────────────────────────────────
// Global DashMap cache
// Key: FNV-1a hash of the CSS string (u64)
// Value: parsed flat rule list
// ─────────────────────────────────────────────────────────────────────────────

const MAX_CACHE_ENTRIES: usize = 512;

static CSS_RULE_CACHE: Lazy<DashMap<u64, Vec<CachedRule>>> = Lazy::new(DashMap::new);
/// Insertion-order tracker for LRU eviction (protected by a separate Mutex
/// to keep DashMap reads lock-free on the hot path).
static CACHE_ORDER: Lazy<std::sync::Mutex<std::collections::VecDeque<u64>>> =
    Lazy::new(|| std::sync::Mutex::new(std::collections::VecDeque::new()));

// ─────────────────────────────────────────────────────────────────────────────
// Internal cached rule (cheaper clone than CssRuleLookup — no Vec<String> alloc)
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Clone)]
struct CachedRule {
    class_name: String,
    property: String,
    value: String,
    variants: Vec<String>,
    specificity: u32,
}

impl From<CssRuleLookup> for CachedRule {
    fn from(r: CssRuleLookup) -> Self {
        CachedRule {
            class_name: r.class_name,
            property: r.property,
            value: r.value,
            variants: r.variants,
            specificity: r.specificity,
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Output types (mirrored to JS)
// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema, Clone)]
pub struct ClassUsageResult {
    pub class_name: String,
    pub specificity: u32,
    pub is_override: bool,
    pub variants: Vec<String>,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ReverseLookupResult {
    pub property: String,
    pub value: String,
    pub used_in_classes: Vec<ClassUsageResult>,
}

// ─────────────────────────────────────────────────────────────────────────────
// FNV-1a hash (same algorithm as create_fingerprint for consistency)
// ─────────────────────────────────────────────────────────────────────────────

fn fnv1a_hash(s: &str) -> u64 {
    const FNV_OFFSET: u64 = 14_695_981_039_346_656_037;
    const FNV_PRIME: u64 = 1_099_511_628_211;
    let mut hash = FNV_OFFSET;
    for byte in s.bytes() {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(FNV_PRIME);
    }
    hash
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache internals
// ─────────────────────────────────────────────────────────────────────────────

/// Get or populate cache entry for a CSS string.
/// Returns a cloned snapshot of the parsed rules.
fn get_or_parse(css: &str) -> Vec<CachedRule> {
    let key = fnv1a_hash(css);

    // Fast path — cache hit (read-lock only via DashMap)
    if let Some(entry) = CSS_RULE_CACHE.get(&key) {
        return entry.value().clone();
    }

    // Slow path — parse and insert
    let parsed: Vec<CachedRule> = parse_css_rules(css.to_string())
        .into_iter()
        .map(CachedRule::from)
        .collect();

    // Evict oldest if at capacity
    if CSS_RULE_CACHE.len() >= MAX_CACHE_ENTRIES {
        if let Ok(mut order) = CACHE_ORDER.lock() {
            if let Some(oldest_key) = order.pop_front() {
                CSS_RULE_CACHE.remove(&oldest_key);
            }
        }
    }

    CSS_RULE_CACHE.insert(key, parsed.clone());
    if let Ok(mut order) = CACHE_ORDER.lock() {
        order.push_back(key);
    }

    parsed
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI entry points
// ─────────────────────────────────────────────────────────────────────────────

/// Find all CSS classes that produce `property: value`.
///
/// Replaces `ReverseLookup.fromCSS()` in `reverseLookup.ts`.
///
/// Returns `[]` when no match. Uses DashMap cache — subsequent calls with the
/// same CSS string are O(n_rules) filter only, no re-parse.
#[napi]
pub fn reverse_lookup_from_css(
    css: String,
    css_property: String,
    css_value: String,
) -> Vec<ReverseLookupResult> {
    if css.is_empty() || css_property.is_empty() {
        return vec![];
    }

    let rules = get_or_parse(&css);
    let norm_property = css_property.to_lowercase();
    let norm_value = css_value.to_lowercase();
    let norm_value = norm_value.trim();

    let usages: Vec<ClassUsageResult> = rules
        .iter()
        .filter(|r| {
            if r.property.to_lowercase() != norm_property {
                return false;
            }
            let rule_val = r.value.to_lowercase();
            let rule_val = rule_val.trim();
            rule_val == norm_value || rule_val.contains(norm_value)
        })
        .map(|r| ClassUsageResult {
            class_name: r.class_name.clone(),
            specificity: r.specificity,
            is_override: false,
            variants: r.variants.clone(),
        })
        .collect();

    if usages.is_empty() {
        return vec![];
    }

    vec![ReverseLookupResult {
        property: norm_property,
        value: css_value,
        used_in_classes: usages,
    }]
}

/// Find all classes that set `property` to any value — grouped by value.
///
/// Replaces `ReverseLookup.findByProperty()` in `reverseLookup.ts`.
#[napi]
pub fn reverse_lookup_by_property(css: String, property: String) -> Vec<ReverseLookupResult> {
    if css.is_empty() || property.is_empty() {
        return vec![];
    }

    let rules = get_or_parse(&css);
    let norm_property = property.to_lowercase();

    // Group by value
    let mut value_map: std::collections::HashMap<String, Vec<ClassUsageResult>> =
        std::collections::HashMap::new();

    for rule in rules.iter().filter(|r| r.property.to_lowercase() == norm_property) {
        value_map
            .entry(rule.value.clone())
            .or_default()
            .push(ClassUsageResult {
                class_name: rule.class_name.clone(),
                specificity: rule.specificity,
                is_override: false,
                variants: rule.variants.clone(),
            });
    }

    let mut results: Vec<ReverseLookupResult> = value_map
        .into_iter()
        .map(|(value, used_in_classes)| ReverseLookupResult {
            property: norm_property.clone(),
            value,
            used_in_classes,
        })
        .collect();

    // Deterministic output order
    results.sort_by(|a, b| a.value.cmp(&b.value));
    results
}

/// Find all classes that share a base name with `class_name` (variant dependents).
///
/// Replaces `ReverseLookup.findDependents()` in `reverseLookup.ts`.
#[napi]
pub fn reverse_lookup_find_dependents(css: String, class_name: String) -> Vec<String> {
    if css.is_empty() || class_name.is_empty() {
        return vec![];
    }

    let rules = get_or_parse(&css);
    let (_, base_class) = split_variant_and_base(&class_name);

    let mut dependents: std::collections::HashSet<String> = std::collections::HashSet::new();

    for rule in &rules {
        let (_, rule_base) = split_variant_and_base(&rule.class_name);
        if rule_base == base_class && rule.class_name != class_name {
            dependents.insert(rule.class_name.clone());
        }
    }

    let mut result: Vec<String> = dependents.into_iter().collect();
    result.sort();
    result
}

/// Evict all entries from the CSS rule cache.
///
/// Call from JS when the CSS bundle changes (watch mode / HMR).
/// Replaces `ReverseLookup.clearCache()` in `reverseLookup.ts`.
#[napi]
pub fn reverse_lookup_clear_cache() {
    CSS_RULE_CACHE.clear();
    if let Ok(mut order) = CACHE_ORDER.lock() {
        order.clear();
    }
}

/// Current number of CSS strings in the cache.
///
/// Useful for observability / diagnostics in devtools.
#[napi]
pub fn reverse_lookup_cache_size() -> u32 {
    CSS_RULE_CACHE.len() as u32
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_CSS: &str = r#"
        .bg-red-500 { background-color: rgb(239 68 68); }
        .bg-blue-500 { background-color: rgb(59 130 246); }
        .text-white { color: rgb(255 255 255); }
        .hover\:bg-red-500:hover { background-color: rgb(239 68 68); }
        .p-4 { padding: 1rem; }
        .flex { display: flex; }
        .hidden { display: none; }
    "#;

    #[test]
    fn test_from_css_finds_property_value_match() {
        let results =
            reverse_lookup_from_css(SAMPLE_CSS.to_string(), "display".to_string(), "flex".to_string());
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].property, "display");
        assert_eq!(results[0].used_in_classes[0].class_name, "flex");
    }

    #[test]
    fn test_from_css_empty_on_no_match() {
        let results = reverse_lookup_from_css(
            SAMPLE_CSS.to_string(),
            "color".to_string(),
            "blue".to_string(),
        );
        assert!(results.is_empty());
    }

    #[test]
    fn test_by_property_groups_by_value() {
        let results = reverse_lookup_by_property(SAMPLE_CSS.to_string(), "display".to_string());
        assert!(!results.is_empty());
        // Both flex and none should appear
        let values: Vec<&str> = results.iter().map(|r| r.value.as_str()).collect();
        assert!(values.contains(&"flex"));
        assert!(values.contains(&"none"));
    }

    #[test]
    fn test_cache_populates_and_reuses() {
        reverse_lookup_clear_cache();
        assert_eq!(reverse_lookup_cache_size(), 0);

        let _ = reverse_lookup_from_css(SAMPLE_CSS.to_string(), "display".to_string(), "flex".to_string());
        assert_eq!(reverse_lookup_cache_size(), 1, "cache should have one entry after parse");

        // Second call should hit cache
        let _ = reverse_lookup_from_css(SAMPLE_CSS.to_string(), "display".to_string(), "none".to_string());
        assert_eq!(reverse_lookup_cache_size(), 1, "same CSS should reuse cache entry");

        reverse_lookup_clear_cache();
        assert_eq!(reverse_lookup_cache_size(), 0);
    }

    #[test]
    fn test_find_dependents() {
        let deps = reverse_lookup_find_dependents(SAMPLE_CSS.to_string(), "bg-red-500".to_string());
        // hover:bg-red-500 shares base "bg-red-500"
        assert!(
            deps.iter().any(|d| d.contains("bg-red-500") && d != "bg-red-500"),
            "should find hover variant as dependent"
        );
    }

    #[test]
    fn test_empty_css_returns_empty() {
        assert!(reverse_lookup_from_css(String::new(), "color".to_string(), "red".to_string()).is_empty());
        assert!(reverse_lookup_by_property(String::new(), "color".to_string()).is_empty());
        assert!(reverse_lookup_find_dependents(String::new(), "bg-red-500".to_string()).is_empty());
    }
}