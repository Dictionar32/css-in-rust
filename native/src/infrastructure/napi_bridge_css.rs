//! CSS generation NAPI bindings
//!
//! This module provides NAPI functions for generating CSS from Tailwind classes.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use napi_derive::napi;
use std::sync::OnceLock;
use crate::domain::css_compiler::CssCompiler;
use crate::domain::theme_config::ThemeConfig;
use crate::infrastructure::cache_backend::CacheFactory;
use crate::infrastructure::napi_bridge_types::CssRule;
use crate::infrastructure::napi_bridge_marshalling::{parse_json, to_json, response_ok};
use crate::infrastructure::napi_bridge_errors::{error_to_napi, validate_string_input};

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

    // Parse theme JSON
    let config: ThemeConfig = parse_json(&theme_json, "ThemeConfig")?;

    // Create compiler with the theme
    let compiler = CssCompiler::new(config);

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
    
    // Check cache first
    if let Some(cached) = cache.get(&rule_json) {
        return Ok(cached);
    }

    // Parse CSS rule from JSON
    let rule: CssRule = parse_json(&rule_json, "CssRule")?;

    // Build CSS string
    let minify_css = minify.unwrap_or(false);
    let css = build_css_string(&rule, minify_css);

    // Store in cache
    cache.put(rule_json, css.clone());

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
    
    // Check cache first
    if let Some(cached) = cache.get(&input) {
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
    };

    let minify_css = minify.unwrap_or(false);
    let css = build_css_string(&rule, minify_css);

    // Store in cache
    cache.put(input, css.clone());

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
    Ok(css_strings.join("\n"))
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

    let mut css = format!("{} {{ {}: {}; }}", selector, property, value);

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
