use lightningcss::stylesheet::{MinifyOptions, ParserOptions, PrinterOptions, StyleSheet};
use napi_derive::napi;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};


#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CssCompileResult {
    /// Generated CSS output
    pub css: String,
    /// Classes that were successfully resolved
    pub resolved_classes: Vec<String>,
    /// Classes that had no known mapping (passed through as @apply)
    pub unknown_classes: Vec<String>,
    /// Byte size of generated CSS
    pub size_bytes: u32,
}

/// Compile a list of Tailwind classes into atomic CSS.
/// For classes without a known mapping, generates `@apply` fallback rules.
#[napi]
pub fn compile_css(classes: Vec<String>, prefix: Option<String>) -> CssCompileResult {
    compile_css_internal(classes, prefix)
}

/// Compile Tailwind classes and post-process with Lightning CSS in Rust.
/// This keeps Tailwind-like class resolution in Rust and delegates CSS optimisation
/// (minify + canonical print) to Lightning CSS.
#[napi]
pub fn compile_css_lightning(classes: Vec<String>, prefix: Option<String>) -> CssCompileResult {
    let mut result = compile_css_internal(classes, prefix);

    if let Some(optimised) = optimise_with_lightning(&result.css) {
        result.css = optimised;
        result.size_bytes = result.css.len() as u32;
    }

    result
}

fn compile_css_internal(classes: Vec<String>, prefix: Option<String>) -> CssCompileResult {
    let pfx = prefix.as_deref().unwrap_or(".");

    let mut css_rules: Vec<String> = Vec::new();
    let mut resolved: Vec<String> = Vec::new();

    // Tailwind is the source of truth for utility declarations.
    // Native Rust only emits @apply-based utility composition (no hardcoded CSS declarations).
    css_rules.push("@tailwind base;".to_string());
    css_rules.push("@tailwind components;".to_string());
    css_rules.push("@tailwind utilities;".to_string());
    css_rules.push("@layer utilities {".to_string());

    for class in &classes {
        let selector = class
            .replace(':', "\\:")
            .replace('[', "\\[")
            .replace(']', "\\]")
            .replace('/', "\\/")
            .replace('.', "\\.");

        css_rules.push(format!("  {}{} {{ @apply {}; }}", pfx, selector, class));
        resolved.push(class.clone());
    }

    css_rules.push("}".to_string());

    let css = css_rules.join("\n");
    let size_bytes = css.len() as u32;

    CssCompileResult {
        css,
        resolved_classes: resolved,
        unknown_classes: Vec::new(),
        size_bytes,
    }
}

/// Process final Tailwind-generated CSS with Lightning CSS in Rust.
/// Use this when Tailwind expansion already happened in external pipeline.
#[napi]
pub fn process_tailwind_css_lightning(css: String) -> CssCompileResult {
    let optimised = optimise_with_lightning(&css).unwrap_or(css);
    CssCompileResult {
        size_bytes: optimised.len() as u32,
        css: optimised,
        resolved_classes: Vec::new(),
        unknown_classes: Vec::new(),
    }
}

fn optimise_with_lightning(raw_css: &str) -> Option<String> {
    let mut sheet = StyleSheet::parse(raw_css, ParserOptions::default()).ok()?;
    sheet.minify(MinifyOptions::default()).ok()?;
    let out = sheet
        .to_css(PrinterOptions {
            minify: true,
            ..Default::default()
        })
        .ok()?;
    Some(out.code)
}
