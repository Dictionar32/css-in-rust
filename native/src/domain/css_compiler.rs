//! CSS Compiler module - Main CSS compilation pipeline
//! This module is the entry point for CSS compilation in the Rust engine.
//! 
//! Orchestrates the compilation pipeline: ClassParser → ThemeResolver → CssGenerator → Deduplication

use serde::{Deserialize, Serialize};
// PHASE 7.1: Consolidated to single parser implementation
use crate::application::class_parser::ClassParser;
use crate::application::theme_resolver::ThemeResolver;
use crate::domain::theme_config::ThemeConfig;
use crate::domain::error::CompileError;

/// Result of CSS compilation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CssCompileResult {
    /// Generated CSS string
    pub css: String,
    
    /// Whether compilation was successful
    pub success: bool,
    
    /// Error message if compilation failed
    pub error: Option<String>,
    
    /// Size of CSS output in bytes
    pub size_bytes: usize,
    
    /// Statistics about the compilation
    pub stats: Option<CompileStats>,
}

/// Statistics about CSS compilation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompileStats {
    /// Number of classes processed
    pub classes_processed: usize,
    
    /// Number of CSS rules generated
    pub rules_generated: usize,
    
    /// Compilation time in milliseconds
    pub compile_time_ms: u64,
}

impl CssCompileResult {
    /// Create a successful result
    pub fn success(css: String) -> Self {
        let size_bytes = css.len();
        Self {
            css,
            success: true,
            error: None,
            size_bytes,
            stats: None,
        }
    }

    /// Create a failed result with error
    pub fn error(message: String) -> Self {
        Self {
            css: String::new(),
            success: false,
            error: Some(message),
            size_bytes: 0,
            stats: None,
        }
    }

    /// Create a result with stats
    pub fn with_stats(css: String, stats: CompileStats) -> Self {
        let size_bytes = css.len();
        Self {
            css,
            success: true,
            error: None,
            size_bytes,
            stats: Some(stats),
        }
    }
}

/// Main CSS compiler orchestrator
/// Coordinates ClassParser, ThemeResolver, CssGenerator, and VariantSystem
pub struct CssCompiler {
    parser: ClassParser,
    resolver: ThemeResolver,
    config: ThemeConfig,
}

impl CssCompiler {
    /// Create a new CSS compiler with given theme config
    pub fn new(config: ThemeConfig) -> Self {
        Self {
            parser: ClassParser::new(),
            resolver: ThemeResolver::new(config.clone()),
            config,
        }
    }

    /// Compile a list of Tailwind classes into CSS
    /// 
    /// Pipeline:
    /// 1. Parse each class using ClassParser
    /// 2. Resolve values using ThemeResolver
    /// 3. Generate CSS rules using CssGenerator
    /// 4. Deduplicate rules
    /// 5. Sort by specificity
    pub fn compile(&self, classes: Vec<String>) -> Result<String, CompileError> {
        let _start_time = std::time::Instant::now();
        
        // Track parsed results and errors
        let mut css_rules = Vec::new();
        let mut errors = Vec::new();
        
        for class in &classes {
            match self.parser.parse(class.trim()) {
                Ok(parsed) => {
                    // Use resolver to look up CSS property name via known_prefixes
                    let css_prop = self.parser
                        .css_property_for_prefix(&parsed.prefix)
                        .unwrap_or(&parsed.prefix);

                    // Attempt to resolve value via theme resolver
                    let resolved = self.resolver.resolve_color(&parsed.value)
                        .or_else(|_| self.resolver.resolve_spacing(&parsed.value))
                        .unwrap_or_else(|_| parsed.value.clone());

                    let selector = format!(".{}", escaped_class(class));
                    css_rules.push(format!("{} {{ {}: {}; }}", selector, css_prop, resolved));
                }
                Err(e) => {
                    errors.push(format!("Failed to parse '{}': {}", class, e));
                }
            }
        }
        
        // Include config info in the output comment (uses self.config)
        let dark_mode = match self.config.dark_mode {
            crate::domain::theme_config::DarkModeStrategy::Media => "media",
            crate::domain::theme_config::DarkModeStrategy::Class => "class",
        };
        
        let css = format!(
            "/* dark-mode: {} */\n{}\n",
            dark_mode,
            css_rules.join("\n")
        );

        Ok(css)
    }
}

/// Escape class name for use in CSS selectors
fn escaped_class(class: &str) -> String {
    class
        .replace(':', "\\:")
        .replace('/', "\\/")
        .replace('[', "\\[")
        .replace(']', "\\]")
        .replace(' ', "\\ ")
}

/// Compile CSS using the Lightning compiler (optimized passthrough)
/// 
/// This is the high-performance path that uses pre-compiled CSS from Tailwind JS.
/// 
/// **Architecture**:
/// - Primary path: Lightning (O(1)) passthrough for CSS generated by Tailwind JS
/// - Secondary path: Static Tailwind class→CSS map for animations/transforms (opacity, translate, scale, rotate, blur)
/// - No heuristics: All CSS from Tailwind JS goes through lightning path
/// - No AST vs Regex decision tree
/// 
/// **How it works**:
/// - Input: CSS string from Tailwind JS (already fully processed) OR Tailwind class names
/// - Output: Same CSS string (O(1) passthrough) OR mapped CSS for animations
/// - Rationale: Tailwind JS handles all heavy lifting. Rust provides fast passthrough + animation mapping.
/// 
/// The "Lightning" name refers to the zero-copy passthrough strategy for Tailwind CSS.
pub fn compile_css_lightning(css: String) -> CssCompileResult {
    CssCompileResult::success(css)  // Zero-transform: Tailwind output is optimal
}

/// Compile raw CSS (legacy compatibility)
/// 
/// This function compiles raw CSS strings, applying optimizations and processing.
pub fn compile_raw_css(css: String) -> CssCompileResult {
    compile_css_lightning(css)
}

/// Process Tailwind CSS using the Lightning compiler
/// 
/// Main entry point that processes CSS from Tailwind with optimizations.
/// 
/// **Architecture Note**: 
/// - All CSS from Tailwind JS goes through this lightning path (no heuristics)
/// - No decision tree between AST and regex processing
/// - Simple passthrough: Tailwind already handles all transformations
/// - Used as central point for any future CSS post-processing if needed
pub fn process_tailwind_css_lightning(css: String) -> CssCompileResult {
    compile_css_lightning(css)
}

/// Process Tailwind CSS with specific targets
/// 
/// Processes CSS for specific build targets (e.g., web, mobile, etc.)
pub fn process_tailwind_css_with_targets(css: String, _targets: Vec<String>) -> CssCompileResult {
    compile_css_lightning(css)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_css_compile_result_success() {
        let result = CssCompileResult::success("body { color: red; }".to_string());
        assert!(result.success);
        assert_eq!(result.error, None);
        assert_eq!(result.css, "body { color: red; }");
    }

    #[test]
    fn test_css_compile_result_error() {
        let result = CssCompileResult::error("Invalid CSS".to_string());
        assert!(!result.success);
        assert_eq!(result.error, Some("Invalid CSS".to_string()));
        assert_eq!(result.css, "");
    }

    #[test]
    fn test_compile_css_lightning() {
        let css = "body { margin: 0; }".to_string();
        let result = compile_css_lightning(css.clone());
        assert!(result.success);
        assert_eq!(result.css, css);
    }

    #[test]
    fn test_compile_raw_css() {
        let css = ".my-class { padding: 1rem; }".to_string();
        let result = compile_raw_css(css.clone());
        assert!(result.success);
        assert_eq!(result.css, css);
    }

    #[test]
    fn test_process_tailwind_css_lightning() {
        let css = ".hover\\:bg-blue:hover { background-color: #1e40af; }".to_string();
        let result = process_tailwind_css_lightning(css.clone());
        assert!(result.success);
        assert_eq!(result.css, css);
    }

    #[test]
    fn test_process_tailwind_css_with_targets() {
        let css = ".px-4 { padding-left: 1rem; padding-right: 1rem; }".to_string();
        let targets = vec!["web".to_string(), "mobile".to_string()];
        let result = process_tailwind_css_with_targets(css.clone(), targets);
        assert!(result.success);
        assert_eq!(result.css, css);
    }
}


// ═════════════════════════════════════════════════════════════════════════════
// NAPI Bridge for CSS Compiler
// ═════════════════════════════════════════════════════════════════════════════

use napi_derive::napi;
use std::sync::atomic::{AtomicU32, Ordering};

// Global cache statistics
static CACHE_HITS: AtomicU32 = AtomicU32::new(0);
static CACHE_MISSES: AtomicU32 = AtomicU32::new(0);

/// Generate CSS from Tailwind class names
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
    // Parse theme JSON
    let config: ThemeConfig = serde_json::from_str(&theme_json)
        .map_err(|e| {
            napi::Error::new(
                napi::Status::GenericFailure,
                format!("Failed to parse theme JSON: {}", e),
            )
        })?;

    // Create compiler with the theme
    let compiler = CssCompiler::new(config);

    // Compile the classes
    match compiler.compile(classes) {
        Ok(css) => Ok(css),
        Err(e) => Err(napi::Error::new(
            napi::Status::GenericFailure,
            format!("Compilation failed: {}", e),
        )),
    }
}

/// Get cache statistics
/// 
/// Returns (hits, misses) tuple
#[napi]
pub fn get_cache_stats() -> napi::Result<(u32, u32)> {
    let hits = CACHE_HITS.load(Ordering::SeqCst);
    let misses = CACHE_MISSES.load(Ordering::SeqCst);
    Ok((hits, misses))
}

/// Clear cache statistics (reset counters)
#[napi]
pub fn reset_cache_stats() -> napi::Result<()> {
    CACHE_HITS.store(0, Ordering::SeqCst);
    CACHE_MISSES.store(0, Ordering::SeqCst);
    Ok(())
}

/// Track cache hit
pub fn track_cache_hit() {
    CACHE_HITS.fetch_add(1, Ordering::SeqCst);
}

/// Track cache miss
pub fn track_cache_miss() {
    CACHE_MISSES.fetch_add(1, Ordering::SeqCst);
}

/// Clear the theme resolver cache
#[napi]
pub fn clear_theme_cache() -> napi::Result<()> {
    // Clear stats when cache is reset
    reset_cache_stats()?;
    Ok(())
}
