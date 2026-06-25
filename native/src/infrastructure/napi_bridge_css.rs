//! CSS generation NAPI bindings
//!
//! This module provides NAPI functions for generating CSS from Tailwind classes.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use napi_derive::napi;
use std::sync::OnceLock;
use std::sync::Arc;
use dashmap::DashMap;
use crate::domain::css_compiler::CssCompiler;
use crate::domain::theme_config::ThemeConfig;
use crate::infrastructure::cache_backend::CacheFactory;
use crate::infrastructure::napi_bridge_types::CssRule;
use crate::infrastructure::napi_bridge_marshalling::{parse_json, to_json, response_ok};
use crate::infrastructure::napi_bridge_errors::{error_to_napi, validate_string_input};

// Thread-safe compiler cache to avoid parsing theme JSON on every compile call
static COMPILER_CACHE: OnceLock<DashMap<String, Arc<CssCompiler>>> = OnceLock::new();
fn get_theme_hash(theme_json: &str) -> String {
    let digest = md5::compute(theme_json.as_bytes());
    format!("{:x}", digest)
}

// CSS generation cache
static CSS_GEN_CACHE: OnceLock<std::sync::Arc<dyn crate::infrastructure::cache_backend::CacheBackend>> = OnceLock::new();

const CSS_GEN_CACHE_SIZE: usize = 5000;

/// Initialize CSS generation cache
fn init_css_cache() {
    let _ = CSS_GEN_CACHE.get_or_init(|| CacheFactory::lru(CSS_GEN_CACHE_SIZE));
}

/// Generate CSS from Tailwind class names with theme
///
/// # Arguments
/// * `classes` - Array of Tailwind class names
/// * `theme_json` - Theme configuration as JSON string
///
/// # Returns
/// Generated CSS string or error
#[napi]
pub fn generate_css_native(
    classes: Vec<String>,
    theme_json: String,
) -> napi::Result<String> {
    // Validate input
    validate_string_input(&theme_json, "theme_json")?;

    let hash = get_theme_hash(&theme_json);
    let cache = COMPILER_CACHE.get_or_init(DashMap::new);

    // Get compiler from cache, or create and cache it
    let compiler = if let Some(cached) = cache.get(&hash) {
        cached.clone()
    } else {
        // Parse theme JSON
        let config: ThemeConfig = parse_json(&theme_json, "ThemeConfig")?;
        let new_compiler = Arc::new(CssCompiler::new(config));
        cache.insert(hash, new_compiler.clone());
        new_compiler
    };

    // Compile the classes
    compiler.compile(classes).map_err(|e| {
        error_to_napi("generate_css_native", e)
    })
}

/// Generate CSS string from CSS rule (single rule)
///
/// # Arguments
/// * `rule_json` - JSON representation of CssRule
/// * `minify` - Optional flag to minify output
///
/// # Returns
/// CSS string representation or error
#[napi]
pub fn generate_css(rule_json: String, minify: Option<bool>) -> napi::Result<String> {
    init_css_cache();
    let cache = CSS_GEN_CACHE.get().unwrap();
    
    let minify_css = minify.unwrap_or(false);
    let cache_key = if minify_css {
        format!("{}:minified", rule_json)
    } else {
        format!("{}:raw", rule_json)
    };

    // Check cache first
    if let Some(cached) = cache.get(&cache_key) {
        return Ok(cached);
    }

    // Parse CSS rule from JSON
    let rule: CssRule = parse_json(&rule_json, "CssRule")?;

    // Build CSS string
    let css = build_css_string(&rule, minify_css);

    // Store in cache
    cache.put(cache_key, css.clone());

    Ok(css)
}

/// Generate CSS strings from multiple CSS rules (batch)
///
/// # Arguments
/// * `rules_json` - JSON array of CssRule objects
/// * `minify` - Optional flag to minify output
///
/// # Returns
/// CSS string with all rules combined or error
#[napi]
pub fn generate_css_batch(rules_json: String, minify: Option<bool>) -> napi::Result<String> {
    let rules: Vec<CssRule> = parse_json(&rules_json, "Vec<CssRule>")?;
    
    let minify_css = minify.unwrap_or(false);
    let css_strings: Vec<String> = rules
        .iter()
        .map(|rule| build_css_string(rule, minify_css))
        .collect();

    Ok(css_strings.join("\n"))
}

/// Compile class to CSS (full pipeline)
///
/// Full pipeline: parse → resolve → generate CSS
#[napi]
pub fn compile_to_css(input: String, minify: Option<bool>) -> napi::Result<String> {
    use crate::application::class_parser::ClassParser;
    use crate::application::theme_resolver::ThemeResolver;
    
    init_css_cache();
    let cache = CSS_GEN_CACHE.get().unwrap();
    
    let minify_css = minify.unwrap_or(false);
    let cache_key = if minify_css {
        format!("{}:minified", input)
    } else {
        format!("{}:raw", input)
    };

    // Check cache first
    if let Some(cached) = cache.get(&cache_key) {
        return Ok(cached);
    }

    // Parse the class
    let parser = ClassParser::new();
    let parsed = parser.parse(&input)
        .map_err(|e| error_to_napi("compile_to_css", e))?;
    
    // Create resolver
    let resolver = ThemeResolver::default();
    
    // Resolve theme values
    let resolved_value = match parsed.prefix.as_str() {
        "bg" | "text" | "border" => resolver.resolve_color(&parsed.value)
            .map_err(|e| error_to_napi("compile_to_css", e))?,
        "p" | "px" | "py" | "pt" | "pb" | "pl" | "pr" |
        "m" | "mx" | "my" | "mt" | "mb" | "ml" | "mr" |
        "w" | "h" | "min-w" | "min-h" | "max-w" | "max-h" |
        "gap" | "gap-x" | "gap-y" | "space-x" | "space-y" => {
            resolver.resolve_spacing(&parsed.value)
                .map_err(|e| error_to_napi("compile_to_css", e))?
        },
        _ => parsed.value.clone(),
    };

    // Build CSS rule
    let rule = CssRule {
        selector: escape_selector(&input),
        property: property_for_prefix(&parsed.prefix),
        value: resolved_value,
        media: None,
        pseudo: None,
        source: None,
    };

    let css = build_css_string(&rule, minify_css);

    // Store in cache
    cache.put(cache_key, css.clone());

    Ok(css)
}

/// Compile multiple classes to CSS (batch)
#[napi]
pub fn compile_to_css_batch(inputs: Vec<String>, minify: Option<bool>) -> napi::Result<String> {
    use rayon::prelude::*;

    let minify_css = minify.unwrap_or(false);
    
    let results: Result<Vec<String>, napi::Error> = inputs
        .par_iter()
        .map(|input| compile_to_css(input.clone(), Some(minify_css)))
        .collect();

    let css_strings = results?;
    let join_str = if minify_css { "" } else { "\n" };
    Ok(css_strings.join(join_str))
}

/// Minify CSS string (remove whitespace and comments)
#[napi]
pub fn minify_css(css: String) -> napi::Result<String> {
    validate_string_input(&css, "css")?;

    // Remove comments
    let without_comments = css
        .split("/*")
        .map(|part| {
            if let Some(idx) = part.find("*/") {
                &part[idx + 2..]
            } else {
                part
            }
        })
        .collect::<String>();

    // Remove unnecessary whitespace
    let minified = without_comments
        .lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>()
        .join("");

    // Remove spaces around special characters
    let minified = minified
        .replace("{ ", "{")
        .replace(" }", "}")
        .replace(": ", ":")
        .replace("; ", ";")
        .replace(", ", ",");

    Ok(minified)
}

/// Build CSS string from rule
fn build_css_string(rule: &CssRule, minify: bool) -> String {
    let selector = &rule.selector;
    let property = &rule.property;
    let value = &rule.value;

    // Build source comment jika ada source location
    let source_comment = if let Some(ref src) = rule.source {
        if !src.file.is_empty() && src.line > 0 {
            format!(" /* {}:{}:{} */", src.file, src.line, src.column)
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let mut css = format!("{} {{ {}: {}; }}{}", selector, property, value, source_comment);

    if let Some(ref media) = rule.media {
        css = format!("{} {{ {} }}", media, css);
    }

    if minify {
        css = css
            .replace(" ", "")
            .replace("\n", "")
            .trim()
            .to_string();
    } else {
        css = format!("{}\n", css);
    }

    css
}

/// Helper: Escape CSS selector
fn escape_selector(class: &str) -> String {
    format!(
        ".{}",
        class
            .replace(":", "\\:")
            .replace("/", "\\/")
            .replace("[", "\\[")
            .replace("]", "\\]")
            .replace("(", "\\(")
            .replace(")", "\\)")
            .replace("%", "\\%")
            .replace("#", "\\#")
    )
}

/// Helper: Map prefix to CSS property
fn property_for_prefix(prefix: &str) -> String {
    match prefix {
        "bg" => "background-color",
        "text" => "color",
        "border" => "border-color",
        "p" => "padding",
        "px" => "padding-inline",
        "py" => "padding-block",
        "pt" => "padding-top",
        "pb" => "padding-bottom",
        "pl" => "padding-left",
        "pr" => "padding-right",
        "m" => "margin",
        "mx" => "margin-inline",
        "my" => "margin-block",
        "mt" => "margin-top",
        "mb" => "margin-bottom",
        "ml" => "margin-left",
        "mr" => "margin-right",
        "w" => "width",
        "h" => "height",
        "min-w" => "min-width",
        "min-h" => "min-height",
        "max-w" => "max-width",
        "max-h" => "max-height",
        "gap" => "gap",
        "gap-x" => "column-gap",
        "gap-y" => "row-gap",
        "space-x" => "margin-left",
        "space-y" => "margin-top",
        "flex" => "flex",
        "grid" => "grid",
        "rounded" => "border-radius",
        "shadow" => "box-shadow",
        "opacity" => "opacity",
        "font" => "font-family",
        "leading" => "line-height",
        "tracking" => "letter-spacing",
        _ => prefix,
    }
    .to_string()
}

#[napi(object)]
pub struct ProcessedCssResult {
    pub css: String,
    pub size_bytes: u32,
    pub resolved_classes: Vec<String>,
    pub unknown_classes: Vec<String>,
}

#[napi]
pub fn process_tailwind_css_lightning(css: String) -> napi::Result<ProcessedCssResult> {
    let result = crate::domain::css_compiler::process_tailwind_css_lightning(css);
    Ok(ProcessedCssResult {
        css: result.css,
        size_bytes: result.size_bytes as u32,
        resolved_classes: Vec::new(),
        unknown_classes: Vec::new(),
    })
}

#[napi]
pub fn process_tailwind_css_with_targets(
    css: String,
    targets: Option<String>,
) -> napi::Result<ProcessedCssResult> {
    let target_list = targets
        .map(|t| t.split(',').map(|s| s.trim().to_string()).collect())
        .unwrap_or_else(Vec::new);
    let result = crate::domain::css_compiler::process_tailwind_css_with_targets(css, target_list);
    Ok(ProcessedCssResult {
        css: result.css,
        size_bytes: result.size_bytes as u32,
        resolved_classes: Vec::new(),
        unknown_classes: Vec::new(),
    })
}

/// Eliminate unused class rules from CSS
#[napi]
pub fn eliminate_dead_css(css: String, dead_classes: Vec<String>) -> napi::Result<String> {
    use regex::Regex;
    let mut result = css;
    for dead_class in dead_classes {
        let escaped = regex::escape(&dead_class);
        let pattern = r"\.CLASS\s*\{[^{}]*\}".replace("CLASS", &escaped);
        if let Ok(re) = Regex::new(&pattern) {
            result = re.replace_all(&result, "").into_owned();
        }
    }
    Ok(result)
}

/// Optimize CSS: deduplicate rules with identical declaration blocks
#[napi]
pub fn optimize_css(css: String) -> napi::Result<String> {
    use regex::Regex;
    use std::collections::BTreeMap;
    
    let re = Regex::new(r"([^{}]+)\s*\{([^{}]*)\}").unwrap();
    let mut rules: BTreeMap<String, Vec<String>> = BTreeMap::new();
    
    for cap in re.captures_iter(&css) {
        if let (Some(sel), Some(decl)) = (cap.get(1), cap.get(2)) {
            let selector = sel.as_str().trim().to_string();
            let declaration = decl.as_str().trim().to_string();
            rules.entry(declaration).or_default().push(selector);
        }
    }
    
    if rules.is_empty() {
        return Ok(css);
    }
    
    let mut optimized = Vec::new();
    for (decl, selectors) in rules {
        optimized.push(format!("{} {{ {} }}", selectors.join(", "), decl));
    }
    
    Ok(optimized.join("\n"))
}


/// Serialize a single CSS rule to a typed JSON response
///
/// Uses `to_json` for typed serialization and `response_ok` for wrapping in a
/// standard `{status:"ok", data:...}` envelope.
///
/// # Arguments
/// * `rule_json` - JSON string of a CssRule object
///
/// # Returns
/// Standard JSON response envelope containing the CSS rule
#[napi]
pub fn serialize_css_rule(rule_json: String) -> napi::Result<String> {
    let rule: CssRule = parse_json(&rule_json, "CssRule")?;
    // Use to_json to serialize the rule directly
    let _serialized = to_json(&rule)?;
    // Wrap in a standard response_ok envelope
    response_ok(&rule)
}
