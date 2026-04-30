/**
 * css_compiler.rs
 *
 * Rust HANYA bertanggung jawab untuk LightningCSS post-processing:
 * - Vendor prefix otomatis
 * - Minify
 * - Canonical output
 *
 * CSS generation (class → declaration) adalah tanggung jawab Tailwind JS engine.
 * Tidak ada hardcoded CSS mapping di sini.
 *
 * Pipeline:
 *   classes[] → [JS: Tailwind compile()] → raw CSS string
 *            → [Rust: process_tailwind_css_lightning()] → final CSS
 */
use lightningcss::stylesheet::{MinifyOptions, ParserOptions, PrinterOptions, StyleSheet};
use lightningcss::targets::{Browsers, Targets};
use napi_derive::napi;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Debug, Serialize, Deserialize, JsonSchema)]
pub struct CssCompileResult {
    pub css: String,
    pub size_bytes: u32,
    pub resolved_classes: Vec<String>,
    pub unknown_classes: Vec<String>,
}

/// Entry point utama — post-process raw CSS dari Tailwind JS dengan LightningCSS.
#[napi]
pub fn process_tailwind_css_lightning(css: String) -> CssCompileResult {
    let optimised = optimise_with_lightning(&css).unwrap_or_else(|| css.clone());
    CssCompileResult {
        size_bytes: optimised.len() as u32,
        css: optimised,
        resolved_classes: Vec::new(),
        unknown_classes: Vec::new(),
    }
}

/// Post-process dengan vendor prefix sesuai target browser.
#[napi]
pub fn process_tailwind_css_with_targets(
    css: String,
    _targets: Option<String>,
) -> CssCompileResult {
    let browser_targets = Targets {
        browsers: Some(Browsers {
            chrome: Some(80 << 16),
            firefox: Some(80 << 16),
            safari: Some((14 << 16) | (1 << 8)),
            edge: Some(80 << 16),
            ..Default::default()
        }),
        ..Default::default()
    };
    let optimised = optimise_with_targets(&css, browser_targets).unwrap_or_else(|| css.clone());
    CssCompileResult {
        size_bytes: optimised.len() as u32,
        css: optimised,
        resolved_classes: Vec::new(),
        unknown_classes: Vec::new(),
    }
}

/// Backward compat — sekarang input adalah raw CSS, bukan class names.
/// CSS harus datang dari Tailwind JS engine.
#[napi]
pub fn compile_css(css: String, _prefix: Option<String>) -> CssCompileResult {
    process_tailwind_css_lightning(css)
}

/// Alias untuk backward compat.
#[napi]
pub fn compile_css_lightning(css: String, _prefix: Option<String>) -> CssCompileResult {
    process_tailwind_css_lightning(css)
}

fn optimise_with_lightning(raw_css: &str) -> Option<String> {
    if raw_css.trim().is_empty() {
        return Some(String::new());
    }
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

fn optimise_with_targets(raw_css: &str, targets: Targets) -> Option<String> {
    if raw_css.trim().is_empty() {
        return Some(String::new());
    }
    let mut sheet = StyleSheet::parse(
        raw_css,
        ParserOptions {
            ..Default::default()
        },
    )
    .ok()?;
    sheet
        .minify(MinifyOptions {
            targets,
            ..Default::default()
        })
        .ok()?;
    let out = sheet
        .to_css(PrinterOptions {
            minify: true,
            targets,
            ..Default::default()
        })
        .ok()?;
    Some(out.code)
}
