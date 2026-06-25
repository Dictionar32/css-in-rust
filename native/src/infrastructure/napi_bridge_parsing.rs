//! Class parsing NAPI bindings
//!
//! This module provides NAPI functions for parsing Tailwind classes.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use napi_derive::napi;
use std::sync::{Arc, OnceLock};
use std::sync::atomic::{AtomicU32, Ordering};
use crate::application::class_parser::ClassParser;
use crate::infrastructure::cache_backend::CacheFactory;
use crate::infrastructure::napi_bridge_marshalling::parse_json;
use crate::infrastructure::napi_bridge_errors::{error_to_napi, validate_string_input, validate_array_input};

// Parse cache
static PARSE_CACHE: OnceLock<Arc<dyn crate::infrastructure::cache_backend::CacheBackend>> = OnceLock::new();

// Parse statistics
static PARSE_HITS: AtomicU32 = AtomicU32::new(0);
static PARSE_MISSES: AtomicU32 = AtomicU32::new(0);

const PARSE_CACHE_SIZE: usize = 5000;

/// Initialize parse cache
fn init_parse_cache() {
    let _ = PARSE_CACHE.get_or_init(|| CacheFactory::lru(PARSE_CACHE_SIZE));
}

/// Track parse cache hit
pub fn track_parse_hit() {
    PARSE_HITS.fetch_add(1, Ordering::Relaxed);
}

/// Track parse cache miss
pub fn track_parse_miss() {
    PARSE_MISSES.fetch_add(1, Ordering::Relaxed);
}

/// Parse a single Tailwind class name
///
/// Extracts prefix, value, modifiers, and variants from a class name.
///
/// # Arguments
/// * `input` - Tailwind class string (e.g., "md:hover:bg-blue-600/50")
///
/// # Returns
/// JSON string containing parsed class components
///
/// # Example
/// ```js
/// const result = parseClass("md:hover:bg-blue-600/50");
/// // Returns: '{"prefix":"bg","value":"blue-600","variants":["md","hover"],...}'
/// ```
#[napi]
pub fn parse_class(input: String) -> napi::Result<String> {
    validate_string_input(&input, "input")?;
    
    init_parse_cache();
    let cache = PARSE_CACHE.get().unwrap();

    // Check cache first
    if let Some(cached) = cache.get(&input) {
        track_parse_hit();
        return Ok(cached);
    }

    track_parse_miss();

    // Parse the class
    let parser = ClassParser::new();
    let parsed = parser.parse(&input)
        .map_err(|e| error_to_napi("parse_class", e))?;

    // Serialize to JSON
    let result = serde_json::to_string(&parsed)
        .map_err(|e| error_to_napi("parse_class", e))?;

    // Store in cache
    cache.put(input, result.clone());

    Ok(result)
}

/// Parse multiple Tailwind class names (batch)
///
/// # Arguments
/// * `inputs` - Array of Tailwind class strings
///
/// # Returns
/// JSON array string containing parsed classes
///
/// # Example
/// ```js
/// const result = parseClasses(["bg-blue-600", "text-white", "p-4"]);
/// // Returns: '[{"prefix":"bg",...},{"prefix":"text",...},...]'
/// ```
#[napi]
pub fn parse_classes(inputs: Vec<String>) -> napi::Result<String> {
    validate_array_input(&inputs, "inputs", 10000)?;

    use rayon::prelude::*;

    let results: Result<Vec<String>, napi::Error> = inputs
        .par_iter()
        .map(|input| parse_class(input.clone()))
        .collect();

    let parsed_classes = results?;
    let combined = parsed_classes.join(",");
    Ok(format!("[{}]", combined))
}

/// Analyze classes for patterns and optimization opportunities
///
/// # Arguments
/// * `classes_json` - JSON array of class strings
///
/// # Returns
/// JSON object containing analysis results
///
/// # Example
/// ```js
/// const result = analyzeClasses('["bg-blue-600", "text-white", "bg-red-600"]');
/// // Returns: '{"total":3,"duplicates":0,"variants":["bg","text"],...}'
/// ```
#[napi]
pub fn analyze_classes(classes_json: String) -> napi::Result<String> {
    let classes: Vec<String> = parse_json(&classes_json, "Vec<String>")?;

    init_parse_cache();

    let mut total = 0;
    let mut unique_prefixes = std::collections::HashSet::new();
    let mut variant_count = std::collections::HashMap::new();
    let mut errors = Vec::new();

    for class in &classes {
        total += 1;

        let parser = ClassParser::new();
        match parser.parse(class) {
            Ok(parsed) => {
                unique_prefixes.insert(parsed.prefix.clone());
                for variant in &parsed.variants {
                    *variant_count.entry(variant.clone()).or_insert(0) += 1;
                }
            }
            Err(e) => {
                errors.push(format!("'{}': {:?}", class, e));
            }
        }
    }

    let analysis = serde_json::json!({
        "total": total,
        "unique_prefixes": unique_prefixes.len(),
        "prefixes": unique_prefixes.iter().collect::<Vec<_>>(),
        "variant_distribution": variant_count,
        "error_count": errors.len(),
        "errors": errors,
    });

    serde_json::to_string(&analysis)
        .map_err(|e| error_to_napi("analyze_classes", e))
}

/// Compile a class to CSS (full pipeline)
///
/// Full pipeline: parse → resolve → generate CSS
///
/// # Arguments
/// * `input` - Tailwind class string (e.g., "md:hover:bg-blue-600/50")
///
/// # Returns
/// JSON string containing CSS rule
#[napi]
pub fn compile_class_napi(input: String) -> napi::Result<String> {
    use crate::application::theme_resolver::ThemeResolver;

    let cache = PARSE_CACHE.get().unwrap();

    // Check cache first
    if let Some(cached) = cache.get(&input) {
        track_parse_hit();
        return Ok(cached);
    }

    track_parse_miss();

    // Parse the class
    let parser = ClassParser::new();
    let parsed = parser.parse(&input)
        .map_err(|e| error_to_napi("compile_class_napi", e))?;

    // Create resolver
    let resolver = ThemeResolver::default();

    // Resolve theme values
    let resolved_value = match parsed.prefix.as_str() {
        "bg" | "text" | "border" => resolver.resolve_color(&parsed.value)
            .map_err(|e| error_to_napi("compile_class_napi", e))?,
        "p" | "px" | "py" | "pt" | "pb" | "pl" | "pr" |
        "m" | "mx" | "my" | "mt" | "mb" | "ml" | "mr" |
        "w" | "h" | "min-w" | "min-h" | "max-w" | "max-h" |
        "gap" | "gap-x" | "gap-y" | "space-x" | "space-y" => {
            resolver.resolve_spacing(&parsed.value)
                .map_err(|e| error_to_napi("compile_class_napi", e))?
        },
        _ => parsed.value.clone(),
    };

    // Build result
    let result = serde_json::json!({
        "prefix": parsed.prefix,
        "value": parsed.value,
        "resolved": resolved_value,
        "variants": parsed.variants,
        "modifier": parsed.arbitrary_declaration,
    });

    let result_str = serde_json::to_string(&result)
        .map_err(|e| error_to_napi("compile_class_napi", e))?;

    // Store in cache
    cache.put(input, result_str.clone());

    Ok(result_str)
}

/// Get parsing statistics
#[napi]
pub fn get_parse_stats() -> napi::Result<String> {
    let hits = PARSE_HITS.load(Ordering::Relaxed);
    let misses = PARSE_MISSES.load(Ordering::Relaxed);
    let total = hits + misses;
    let hit_rate = if total > 0 {
        (hits as f64) / (total as f64)
    } else {
        0.0
    };

    let stats = serde_json::json!({
        "hits": hits,
        "misses": misses,
        "total": total,
        "hit_rate": hit_rate,
    });

    serde_json::to_string(&stats)
        .map_err(|e| error_to_napi("get_parse_stats", e))
}

/// Clear the parse cache
#[napi]
pub fn clear_parse_cache_napi() -> napi::Result<()> {
    init_parse_cache();
    let cache = PARSE_CACHE.get().unwrap();
    cache.clear();
    
    // Reset statistics
    PARSE_HITS.store(0, Ordering::Relaxed);
    PARSE_MISSES.store(0, Ordering::Relaxed);

    Ok(())
}
