use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ThemeToken {
    pub key: String,
    pub css_var: String,
    pub value: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CompiledTheme {
    /// Theme name (e.g. "light", "dark", "brand")
    pub name: String,
    /// CSS selector for this theme (e.g. ":root", "[data-theme='dark']")
    pub selector: String,
    /// Full CSS block: selector { --token-name: value; ... }
    pub css: String,
    /// All tokens in this theme
    pub tokens: Vec<ThemeToken>,
}

/// Parse a token map JSON and compile it into a CSS variable block.
///
/// `tokens_json`: `{"color":{"primary":"#3b82f6","secondary":"#8b5cf6"},"spacing":{"sm":"0.5rem"}}`
/// `theme_name`:  "light" | "dark" | "brand" | etc.
/// `prefix`:      CSS variable prefix, e.g. "tw" → `--tw-color-primary`
#[napi]
pub fn compile_theme(tokens_json: String, theme_name: String, prefix: String) -> CompiledTheme {
    let selector = if theme_name == "light" || theme_name == "default" {
        ":root".to_string()
    } else {
        format!("[data-theme='{}']", theme_name)
    };

    let mut css_lines: Vec<String> = Vec::new();
    let mut tokens: Vec<ThemeToken> = Vec::new();

    // Robust regex-based parse of {"category":{"key":"value",...},...}
    // Matches: "category":{"key":"value",...}
    static RE_CATEGORY: Lazy<Regex> = Lazy::new(|| Regex::new(r#""([^"]+)":\{([^}]+)\}"#).unwrap());
    static RE_KV: Lazy<Regex> = Lazy::new(|| Regex::new(r#""([^"]+)":"([^"]*)""#).unwrap());

    for cat_cap in RE_CATEGORY.captures_iter(&tokens_json) {
        let category = &cat_cap[1];
        let inner = &cat_cap[2];

        for kv_cap in RE_KV.captures_iter(inner) {
            let key = &kv_cap[1];
            let val = &kv_cap[2];

            let css_var = if prefix.is_empty() {
                format!("--{}-{}", category, key)
            } else {
                format!("--{}-{}-{}", prefix, category, key)
            };

            css_lines.push(format!("  {}: {};", css_var, val));
            tokens.push(ThemeToken {
                key: format!("{}.{}", category, key),
                css_var: css_var.clone(),
                value: val.to_string(),
            });
        }
    }

    let css = format!("{} {{\n{}\n}}", selector, css_lines.join("\n"));

    CompiledTheme {
        name: theme_name,
        selector,
        css,
        tokens,
    }
}

/// Extract CSS variables referenced in a source file.
/// Returns a list of `--var-name` strings found.
#[napi]
pub fn extract_css_vars(source: String) -> Vec<String> {
    static RE_VAR: Lazy<Regex> = Lazy::new(|| Regex::new(r"--[a-zA-Z][a-zA-Z0-9_-]*").unwrap());
    let mut vars: Vec<String> = RE_VAR
        .find_iter(&source)
        .map(|m| m.as_str().to_string())
        .collect();
    vars.sort();
    vars.dedup();
    vars
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CssThemeVar {
    /// Variable name without leading `--`, e.g. `color-primary`
    pub key: String,
    /// Raw value from CSS, e.g. `#3b82f6` or `var(--color-base)`
    pub value: String,
}

/// Parse `@theme { --key: value; }` blocks from a CSS string.
///
/// Returns all key-value pairs found inside `@theme` blocks.
/// Handles multiple `@theme` blocks and strips leading `--`.
///
/// Menggantikan JS regex di `themeReader.ts extractThemeFromCSS()`.
#[napi]
pub fn extract_theme_from_css(css: String) -> Vec<CssThemeVar> {
    static RE_BLOCK: Lazy<Regex> =
        Lazy::new(|| Regex::new(r"@theme\s*\{([\s\S]*?)\}").unwrap());
    static RE_VAR_KV: Lazy<Regex> =
        Lazy::new(|| Regex::new(r"--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);").unwrap());

    let mut result: Vec<CssThemeVar> = Vec::new();

    for block_cap in RE_BLOCK.captures_iter(&css) {
        let block = &block_cap[1];
        for kv_cap in RE_VAR_KV.captures_iter(block) {
            let key = kv_cap[1].trim().to_string();
            let value = kv_cap[2].trim().to_string();
            result.push(CssThemeVar { key, value });
        }
    }

    result
}

// ═════════════════════════════════════════════════════════════════════════════