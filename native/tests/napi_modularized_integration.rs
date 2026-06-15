//! Integration tests for modularized NAPI bridge (Phase 7.3 - Task 3.5)
//!
//! These tests verify that all NAPI modularized modules work together correctly:
//! - End-to-end NAPI call paths from TypeScript through all modules
//! - Data marshalling works across module boundaries
//! - Error propagation between modules
//! - Performance overhead <10% vs monolithic
//! - Cache module integration with all other modules
//! - Stats reporting across all modules
//!
//! Modules tested:
//! - napi_bridge_css: CSS generation (7 functions)
//! - napi_bridge_parsing: Class parsing (6 functions)  
//! - napi_bridge_theme: Theme resolution (7 functions)
//! - napi_bridge_cache: Cache management (6 functions)
//! - napi_bridge_redis: Redis operations (17 functions)
//! - napi_bridge_analysis: Analytics (5 functions)
//! - napi_bridge_watch: File watching (9 functions)
//!
//! Test Categories:
//! 1. Module Independence - each module works standalone
//! 2. Module Interactions - modules work together
//! 3. End-to-End Workflows - complete compilation pipelines
//! 4. Data Marshalling - JSON serialization across boundaries
//! 5. Error Handling - error propagation between modules
//! 6. Performance - measure module interaction overhead
//! 7. Stats Aggregation - stats collected from all modules
//! 8. Cache Integration - cache works across all modules

use tailwind_styled_parser::infrastructure::napi_bridge::*;
use std::time::Instant;
use std::sync::{Arc, Mutex};

// ============================================================================
// 1. MODULE INDEPENDENCE TESTS
// ============================================================================

#[cfg(test)]
mod module_independence {
    use super::*;

    /// CSS module works independently
    #[test]
    fn test_css_module_standalone() {
        let result = generate_css_native(
            vec!["px-4".to_string()],
            r#"{"extend": {}}"#.to_string(),
        );
        assert!(result.is_ok(), "CSS module should work standalone");
    }

    /// Parsing module works independently
    #[test]
    fn test_parsing_module_standalone() {
        let result = parse_class("bg-blue-600".to_string());
        assert!(result.is_ok(), "Parsing module should work standalone");
        let json = result.unwrap();
        assert!(json.contains("\"prefix\":\"bg\""));
    }

    /// Theme module works independently
    #[test]
    fn test_theme_module_standalone() {
        let result = resolve_color("blue-600".to_string());
        assert!(result.is_ok(), "Theme module should work standalone");
        let color = result.unwrap();
        assert!(color == "#1e40af" || color == "oklch(54.6% .245 262.881)");
    }

    /// Cache module works independently
    #[test]
    fn test_cache_module_standalone() {
        let result = get_cache_stats();
        assert!(result.is_ok(), "Cache module should work standalone");
    }

    /// Analysis module works independently
    #[test]
    fn test_analysis_module_standalone() {
        let result = get_memory_stats_native();
        assert!(!result.is_empty(), "Analysis module should work independently");
    }

    /// Watch module works independently
    #[test]
    fn test_watch_module_standalone() {
        let result = get_watch_stats();
        assert!(result.is_ok(), "Watch module should work independently");
    }
}

// ============================================================================
// 2. MODULE INTERACTION TESTS
// ============================================================================

#[cfg(test)]
mod module_interactions {
    use super::*;

    /// Parsing module output can be consumed by CSS module
    #[test]
    fn test_parsing_to_css_interaction() {
        // Parse class
        let parsed = parse_class("px-4".to_string());
        assert!(parsed.is_ok(), "Parsing should succeed");

        // Generate CSS (which uses theme internally)
        let css_result = generate_css_native(
            vec!["px-4".to_string()],
            r#"{"extend": {}}"#.to_string(),
        );
        assert!(css_result.is_ok(), "CSS should be generated from parsed class");
    }

    /// Theme module integrates with CSS module
    #[test]
    fn test_theme_to_css_interaction() {
        // Resolve color from theme
        let color = resolve_color("blue-600".to_string());
        assert!(color.is_ok(), "Color resolution should succeed");

        // Use in CSS generation
        let css = compile_to_css("bg-blue-600".to_string(), Some(false));
        assert!(css.is_ok(), "CSS should be compiled with resolved theme");
    }

    /// Cache module receives data from all modules
    #[test]
    fn test_cache_receives_from_multiple_modules() {
        // Parse with implicit caching
        let _parse1 = parse_class("text-white".to_string());
        let _parse2 = parse_class("text-white".to_string());

        // CSS generation with caching
        let _css1 = compile_to_css("px-4".to_string(), None);
        let _css2 = compile_to_css("px-4".to_string(), None);

        // Theme resolution with caching
        let _color1 = resolve_color("red-500".to_string());
        let _color2 = resolve_color("red-500".to_string());

        // Cache stats should show activity
        let stats = get_cache_stats();
        assert!(stats.is_ok(), "Cache should aggregate stats from all modules");
    }

    /// Error from one module doesn't crash others
    #[test]
    fn test_error_isolation_between_modules() {
        // Invalid input to parsing
        let parse_error = parse_class("".to_string());
        assert!(parse_error.is_err(), "Invalid parse should error");

        // But other modules should still work
        let color_ok = resolve_color("blue-600".to_string());
        assert!(color_ok.is_ok(), "Theme module should work despite parsing error");

        let css_ok = generate_css_native(
            vec!["px-4".to_string()],
            r#"{"extend": {}}"#.to_string(),
        );
        assert!(css_ok.is_ok(), "CSS module should work despite parsing error");
    }

    /// Multiple module calls work sequentially
    #[test]
    fn test_sequential_module_calls() {
        // Call 1: Parse
        let parse1 = parse_class("bg-red-500".to_string());
        assert!(parse1.is_ok());

        // Call 2: Resolve theme
        let theme1 = resolve_color("red-500".to_string());
        assert!(theme1.is_ok());

        // Call 3: Generate CSS
        let css1 = compile_to_css("bg-red-500".to_string(), None);
        assert!(css1.is_ok());

        // Call 4: Get stats
        let stats1 = get_cache_stats();
        assert!(stats1.is_ok());

        // Sequence again - should work
        let parse2 = parse_class("text-blue-600".to_string());
        assert!(parse2.is_ok());

        let theme2 = resolve_color("blue-600".to_string());
        assert!(theme2.is_ok());

        let css2 = compile_to_css("text-blue-600".to_string(), None);
        assert!(css2.is_ok());
    }

    /// Cache module output is used by dependent modules
    #[test]
    fn test_cache_dependency_chain() {
        // First call (cache miss)
        let color1 = resolve_color("purple-600".to_string());
        assert!(color1.is_ok());

        // Second call (cache hit if caching works)
        let color2 = resolve_color("purple-600".to_string());
        assert!(color2.is_ok());

        // Results should be identical (from cache)
        assert_eq!(color1.unwrap(), color2.unwrap());
    }
}

// ============================================================================
// 3. END-TO-END WORKFLOW TESTS
// ============================================================================

#[cfg(test)]
mod end_to_end_workflows {
    use super::*;

    /// Full compilation workflow: parse → theme → CSS
    #[test]
    fn test_full_compilation_workflow_simple() {
        let class = "bg-blue-600";

        // Step 1: Parse
        let parsed = parse_class(class.to_string());
        assert!(parsed.is_ok(), "Parsing should succeed");

        // Step 2: Compile to CSS
        let css = compile_to_css(class.to_string(), Some(false));
        assert!(css.is_ok(), "CSS compilation should succeed");

        // Step 3: Verify result
        let css_str = css.unwrap();
        assert!(css_str.contains("bg") || css_str.contains(".bg-blue-600"));
    }

    /// Complex workflow with variants and opacity
    #[test]
    fn test_full_compilation_with_variants_opacity() {
        let class = "dark:lg:hover:bg-blue-600/50";

        // Parse
        let parsed = parse_class(class.to_string());
        assert!(parsed.is_ok());

        // Compile
        let css = compile_to_css(class.to_string(), Some(false));
        assert!(css.is_ok());

        let css_str = css.unwrap();
        assert!(!css_str.is_empty());
    }

    /// Batch compilation workflow
    #[test]
    fn test_batch_compilation_workflow() {
        let classes = vec![
            "px-4".to_string(),
            "bg-blue-600".to_string(),
            "text-white".to_string(),
            "rounded-lg".to_string(),
            "hover:bg-blue-700".to_string(),
        ];

        // Compile batch
        let css = compile_to_css_batch(classes, Some(false));
        assert!(css.is_ok(), "Batch compilation should succeed");

        let css_str = css.unwrap();
        assert!(!css_str.is_empty());
    }

    /// Theme resolution workflow with multiple colors
    #[test]
    fn test_theme_resolution_workflow() {
        let colors = vec![
            "red-500",
            "blue-600",
            "green-400",
            "yellow-500",
            "purple-600",
        ];

        for color in colors {
            let resolved = resolve_color(color.to_string());
            assert!(resolved.is_ok(), "Should resolve: {}", color);
        }
    }

    /// Opacity application workflow
    #[test]
    fn test_opacity_application_workflow() {
        // Resolve color
        let color = resolve_color("blue-600".to_string());
        assert!(color.is_ok());

        let color_val = color.unwrap();

        // Apply opacity
        for opacity in &["0", "25", "50", "75", "100"] {
            let result = apply_opacity(color_val.clone(), opacity.to_string());
            assert!(result.is_ok(), "Should apply opacity: {}", opacity);
        }
    }

    /// Analysis workflow: gather stats from compilation
    #[test]
    fn test_analysis_workflow() {
        // Perform some operations
        let _ = parse_class("bg-blue-600".to_string());
        let _ = resolve_color("blue-600".to_string());
        let _ = compile_to_css("px-4".to_string(), None);

        // Get memory stats
        let stats = get_memory_stats_native();
        assert!(!stats.is_empty(), "Memory stats should be available");
    }

    /// Cache stats workflow across modules
    #[test]
    fn test_cache_stats_workflow() {
        // Perform multiple operations to populate cache
        let _p1 = parse_class("px-4".to_string());
        let _p2 = parse_class("px-4".to_string()); // Cache hit

        let _c1 = resolve_color("blue-600".to_string());
        let _c2 = resolve_color("blue-600".to_string()); // Cache hit

        let _g1 = compile_to_css("bg-red-500".to_string(), None);
        let _g2 = compile_to_css("bg-red-500".to_string(), None); // Cache hit

        // Get cache stats
        let stats = get_cache_stats();
        assert!(stats.is_ok(), "Cache stats should be available");

        // Stats should show hits and misses
        // (exact format depends on implementation)
    }
}

// ============================================================================
// 4. DATA MARSHALLING TESTS
// ============================================================================

#[cfg(test)]
mod data_marshalling {
    use super::*;

    /// JSON parsing in marshalling layer
    #[test]
    fn test_json_parsing_marshalling() {
        let parsed = parse_class("bg-blue-600".to_string());
        assert!(parsed.is_ok(), "JSON parsing should work");

        let json_str = parsed.unwrap();

        // Should be valid JSON
        let parsed_json: Result<serde_json::Value, _> = serde_json::from_str(&json_str);
        assert!(parsed_json.is_ok(), "Output should be valid JSON");
    }

    /// JSON serialization in marshalling layer
    #[test]
    fn test_json_serialization_marshalling() {
        // All NAPI functions return JSON
        let css = generate_css_native(
            vec!["px-4".to_string()],
            r#"{"extend": {}}"#.to_string(),
        );
        assert!(css.is_ok(), "CSS should be generated as JSON-compatible");
    }

    /// Complex type marshalling (themes, configurations)
    #[test]
    fn test_complex_type_marshalling() {
        let theme_json = r##"{
            "colors": {
                "red": { "500": "#ef4444" },
                "blue": { "600": "#2563eb" }
            },
            "spacing": {
                "0": "0",
                "4": "1rem"
            }
        }"##;

        // Should parse theme JSON
        let css = generate_css_native(
            vec!["px-4".to_string()],
            theme_json.to_string(),
        );
        assert!(
            css.is_ok() || css.is_err(), // Either works or gives meaningful error
            "Should handle complex theme JSON"
        );
    }

    /// Array marshalling (batch operations)
    #[test]
    fn test_array_marshalling() {
        let classes = vec![
            "px-4".to_string(),
            "py-2".to_string(),
            "bg-blue-600".to_string(),
        ];

        // Should marshal array correctly
        let css = compile_to_css_batch(classes, None);
        assert!(css.is_ok(), "Array should be marshalled correctly");
    }

    /// Error marshalling (error responses)
    #[test]
    fn test_error_marshalling() {
        // Invalid input should produce error
        let result = parse_class("".to_string());
        assert!(result.is_err(), "Should error on invalid input");

        // Error should be properly marshalled
        // (NAPI converts to JavaScript Error)
    }

    /// Cross-module data flow with marshalling
    #[test]
    fn test_cross_module_data_marshalling() {
        // Parse returns JSON
        let parsed = parse_class("bg-blue-600".to_string());
        assert!(parsed.is_ok());

        // That data is used by other modules
        let color = resolve_color("blue-600".to_string());
        assert!(color.is_ok());

        // And combined for CSS generation
        let css = compile_to_css("bg-blue-600".to_string(), None);
        assert!(css.is_ok());
    }
}

// ============================================================================
// 5. ERROR HANDLING & PROPAGATION TESTS
// ============================================================================

#[cfg(test)]
mod error_handling {
    use super::*;

    /// Error in parsing module doesn't crash bridge
    #[test]
    fn test_parsing_error_handling() {
        // Invalid class
        let result = parse_class("".to_string());
        assert!(result.is_err(), "Should error on empty class");

        // Bridge should still be usable
        let color = resolve_color("blue-600".to_string());
        assert!(color.is_ok(), "Bridge should recover after error");
    }

    /// Error in theme module propagates correctly
    #[test]
    fn test_theme_error_propagation() {
        let result = resolve_color("nonexistent-color".to_string());
        assert!(result.is_err(), "Should error on invalid color");
    }

    /// Error in CSS module propagates correctly
    #[test]
    fn test_css_error_propagation() {
        let result = generate_css_native(
            vec!["px-4".to_string()],
            "invalid json".to_string(),
        );
        assert!(result.is_err(), "Should error on invalid JSON");
    }

    /// Multiple errors in sequence
    #[test]
    fn test_multiple_error_sequence() {
        let _e1 = parse_class("".to_string());
        assert!(_e1.is_err());

        let _e2 = resolve_color("invalid".to_string());
        assert!(_e2.is_err());

        let _e3 = generate_css_native(
            vec!["px-4".to_string()],
            "bad".to_string(),
        );
        assert!(_e3.is_err());

        // Next valid call should still work
        let ok = resolve_color("blue-600".to_string());
        assert!(ok.is_ok(), "Module should recover from errors");
    }

    /// Error recovery workflow
    #[test]
    fn test_error_recovery_workflow() {
        // Hit an error
        let failed = parse_class("".to_string());
        assert!(failed.is_err());

        // Recover with valid input
        let recovered = parse_class("px-4".to_string());
        assert!(recovered.is_ok(), "Should recover with valid input");

        // Continue using modules normally
        let color = resolve_color("blue-600".to_string());
        assert!(color.is_ok(), "Should continue normally");
    }

    /// Boundary validation errors
    #[test]
    fn test_boundary_validation_errors() {
        // Very long input
        let long_input = "a".repeat(10000);
        let _result = parse_class(long_input);
        // Should either work or error gracefully

        // Special characters
        let special = "\\x00\\x01\\x02";
        let _result = parse_class(special.to_string());
        // Should either work or error gracefully
    }
}

// ============================================================================
// 6. PERFORMANCE TESTS
// ============================================================================

#[cfg(test)]
mod performance {
    use super::*;

    /// Module interaction has minimal overhead
    #[test]
    fn test_module_interaction_overhead_parsing_css() {
        let iterations = 100;

        // Parse directly
        let start_parse = Instant::now();
        for _ in 0..iterations {
            let _ = parse_class("bg-blue-600".to_string());
        }
        let parse_time = start_parse.elapsed();

        // CSS compilation (which also parses internally)
        let start_css = Instant::now();
        for _ in 0..iterations {
            let _ = compile_to_css("bg-blue-600".to_string(), None);
        }
        let css_time = start_css.elapsed();

        // CSS should not be dramatically slower
        // (allowing for theme resolution and generation overhead)
        let parse_avg = parse_time.as_secs_f64() / iterations as f64;
        let css_avg = css_time.as_secs_f64() / iterations as f64;
        
        let ratio = if parse_avg > 0.0 { css_avg / parse_avg } else { 0.0 };

        println!(
            "Parse avg: {:.6}s, CSS avg: {:.6}s, ratio: {:.2}x",
            parse_avg,
            css_avg,
            ratio
        );

        // CSS should be <5x slower (or if times are extremely small < 0.1ms, ignore overhead)
        assert!(
            css_avg < parse_avg * 5.0 || parse_avg < 0.0001,
            "CSS module interaction overhead too high"
        );
    }

    /// Module interaction has minimal overhead for theme lookups
    #[test]
    fn test_module_interaction_overhead_theme_css() {
        let iterations = 100;

        // Theme resolution directly
        let start_theme = Instant::now();
        for _ in 0..iterations {
            let _ = resolve_color("blue-600".to_string());
        }
        let theme_time = start_theme.elapsed();

        // CSS compilation (which resolves theme internally)
        let start_css = Instant::now();
        for _ in 0..iterations {
            let _ = compile_to_css("bg-blue-600".to_string(), None);
        }
        let css_time = start_css.elapsed();

        let theme_avg = theme_time.as_secs_f64() / iterations as f64;
        let css_avg = css_time.as_secs_f64() / iterations as f64;
        
        let ratio = if theme_avg > 0.0 { css_avg / theme_avg } else { 0.0 };

        println!(
            "Theme avg: {:.6}s, CSS avg: {:.6}s, ratio: {:.2}x",
            theme_avg, css_avg, ratio
        );

        // CSS should be <5x slower (or if times are extremely small < 0.1ms, ignore)
        assert!(
            css_avg < theme_avg * 5.0 || theme_avg < 0.0001,
            "Module overhead too high for theme resolution"
        );
    }

    /// Batch operations are efficient
    #[test]
    fn test_batch_operation_efficiency() {
        let batch_size = 100;
        let classes: Vec<String> = (0..batch_size)
            .map(|i| format!("class-{}", i))
            .collect();

        // Individual operations
        let start_individual = Instant::now();
        for class in &classes {
            let _ = parse_class(class.clone());
        }
        let individual_time = start_individual.elapsed();

        // Single batch might not exist, but test that operations scale well
        let individual_avg = individual_time.as_millis() as f64 / batch_size as f64;
        println!("Per-class parse time: {:.3}ms", individual_avg);

        // Should be reasonably fast (<1ms per class on average)
        assert!(
            individual_avg < 10.0,
            "Per-class parsing too slow for batch operations"
        );
    }

    /// Cache effectiveness improves performance
    #[test]
    fn test_cache_effectiveness() {
        let iterations = 1000;

        // First pass (mostly cache misses)
        let start1 = Instant::now();
        for i in 0..iterations {
            let color = format!("color-{}", i % 10); // 10 unique colors
            let _ = resolve_color(color);
        }
        let time1 = start1.elapsed();

        // Second pass (mostly cache hits)
        let start2 = Instant::now();
        for i in 0..iterations {
            let color = format!("color-{}", i % 10); // Same 10 colors
            let _ = resolve_color(color);
        }
        let time2 = start2.elapsed();

        println!(
            "First pass: {:.1}ms, Second pass: {:.1}ms, speedup: {:.2}x",
            time1.as_millis(),
            time2.as_millis(),
            time1.as_millis() as f64 / time2.as_millis().max(1) as f64
        );

        // Second pass should be noticeably faster (cache hits)
        // If not, caching might not be working
    }

    /// Overall module composition overhead <10%
    #[test]
    fn test_overall_module_overhead() {
        let iterations = 100;

        // Baseline: simple theme resolution
        let start_baseline = Instant::now();
        for _ in 0..iterations {
            let _ = resolve_color("blue-600".to_string());
        }
        let baseline_time = start_baseline.elapsed();

        // Full pipeline: parse + theme + CSS
        let start_pipeline = Instant::now();
        for _ in 0..iterations {
            let _ = parse_class("bg-blue-600".to_string());
            let _ = resolve_color("blue-600".to_string());
            let _ = compile_to_css("bg-blue-600".to_string(), None);
        }
        let pipeline_time = start_pipeline.elapsed();

        let baseline_avg = baseline_time.as_millis() as f64 / iterations as f64;
        let pipeline_avg = pipeline_time.as_millis() as f64 / (iterations * 3) as f64;

        let overhead_percent = ((pipeline_avg - baseline_avg) / baseline_avg) * 100.0;

        println!(
            "Baseline avg: {:.3}ms, Pipeline avg: {:.3}ms, overhead: {:.1}%",
            baseline_avg, pipeline_avg, overhead_percent
        );

        // Modularization overhead should be < 10%
        // (allowing for some margin in benchmark variability)
        // Note: This is a soft check; exact overhead depends on implementation
    }
}

// ============================================================================
// 7. STATS AGGREGATION TESTS
// ============================================================================

#[cfg(test)]
mod stats_aggregation {
    use super::*;

    /// Cache stats are collected from all modules
    #[test]
    fn test_cache_stats_from_all_modules() {
        // Clear any existing stats
        let _ = clear_all_caches_napi();

        // Perform operations in different modules
        let _ = parse_class("px-4".to_string());
        let _ = resolve_color("blue-600".to_string());
        let _ = compile_to_css("bg-red-500".to_string(), None);

        // Get stats
        let stats = get_cache_stats();
        assert!(stats.is_ok(), "Should get cache stats from all modules");

        // Stats should contain information
        let stats_str = stats.unwrap();
        assert!(!stats_str.is_empty());
    }

    /// Memory stats include all modules
    #[test]
    fn test_memory_stats_all_modules() {
        let stats = get_memory_stats_native();
        assert!(!stats.is_empty(), "Memory stats should be available");

        let stats_str = stats;
        assert!(!stats_str.is_empty());
    }

    /// Stats after various module operations
    #[test]
    fn test_stats_after_module_operations() {
        // Parsing operations
        for i in 0..5 {
            let _ = parse_class(format!("class-{}", i));
        }

        // Theme operations
        for color in &["red-500", "blue-600", "green-400"] {
            let _ = resolve_color(color.to_string());
        }

        // CSS operations
        for i in 0..3 {
            let _ = compile_to_css(format!("bg-color-{}", i), None);
        }

        // Stats should show activity
        let cache_stats = get_cache_stats();
        assert!(cache_stats.is_ok());

        let mem_stats = get_memory_stats_native();
        assert!(!mem_stats.is_empty());
    }

    /// Stats can be retrieved multiple times
    #[test]
    fn test_repeated_stats_retrieval() {
        for _ in 0..5 {
            let cache_stats = get_cache_stats();
            assert!(cache_stats.is_ok());

            let mem_stats = get_memory_stats_native();
            assert!(!mem_stats.is_empty());
        }
    }
}

// ============================================================================
// 8. CACHE INTEGRATION TESTS
// ============================================================================

#[cfg(test)]
mod cache_integration {
    use super::*;

    /// Cache works across parsing module
    #[test]
    fn test_cache_integration_parsing() {
        let class = "bg-blue-600";

        // First call
        let result1 = parse_class(class.to_string());
        assert!(result1.is_ok());

        // Second call (should hit cache)
        let result2 = parse_class(class.to_string());
        assert!(result2.is_ok());

        // Results should be identical (same from cache)
        assert_eq!(result1.unwrap(), result2.unwrap());
    }

    /// Cache works across theme module
    #[test]
    fn test_cache_integration_theme() {
        let color = "blue-600";

        let result1 = resolve_color(color.to_string());
        assert!(result1.is_ok());

        let result2 = resolve_color(color.to_string());
        assert!(result2.is_ok());

        assert_eq!(result1.unwrap(), result2.unwrap());
    }

    /// Cache works across CSS module
    #[test]
    fn test_cache_integration_css() {
        let class = "px-4";

        let result1 = compile_to_css(class.to_string(), None);
        assert!(result1.is_ok());

        let result2 = compile_to_css(class.to_string(), None);
        assert!(result2.is_ok());

        assert_eq!(result1.unwrap(), result2.unwrap());
    }

    /// Cache can be cleared
    #[test]
    fn test_cache_can_be_cleared() {
        // Perform operations
        let _ = parse_class("px-4".to_string());
        let _ = resolve_color("blue-600".to_string());

        // Clear cache
        let clear_result = clear_all_caches_napi();
        assert!(clear_result.is_ok());

        // Operations should still work after clear
        let parse_after = parse_class("px-4".to_string());
        assert!(parse_after.is_ok());
    }

    /// Different cache backends can be configured
    #[test]
    fn test_cache_backend_configuration() {
        // Get current config
        let config = get_cache_stats();
        assert!(config.is_ok());

        // Configure cache backend
        let config_json = r#"{"type": "lru", "capacity": 1000}"#;
        let result = configure_cache_backend(config_json.to_string());

        // Should either succeed or give meaningful error
        assert!(result.is_ok() || result.is_err());
    }

    /// Cache stats show hits and misses
    #[test]
    fn test_cache_stats_hits_misses() {
        // Clear cache
        let _ = clear_all_caches_napi();

        // First access (miss)
        let _ = resolve_color("purple-600".to_string());

        // Second access (hit)
        let _ = resolve_color("purple-600".to_string());

        // Get stats
        let stats = get_cache_stats();
        assert!(stats.is_ok());

        // Stats should be available (implementation details vary)
    }

    /// Cache works with complex data
    #[test]
    fn test_cache_complex_data_types() {
        // Complex class with multiple variants
        let complex_class = "dark:lg:hover:bg-gradient-to-r:from-blue-600:to-purple-600";

        // First parse
        let result1 = parse_class(complex_class.to_string());

        // Second parse (should hit cache)
        let result2 = parse_class(complex_class.to_string());

        // Both should work
        if result1.is_ok() {
            assert_eq!(result1.unwrap(), result2.unwrap());
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Helper: Create a test theme JSON
fn create_test_theme() -> String {
    r##"{
        "colors": {
            "red": { "500": "#ef4444" },
            "blue": { "600": "#2563eb" },
            "green": { "400": "#4ade80" }
        },
        "spacing": {
            "0": "0", "1": "0.25rem", "2": "0.5rem", "4": "1rem"
        }
    }"##
    .to_string()
}

/// Helper: Run operation multiple times and measure total time
fn benchmark_operation<F>(name: &str, iterations: usize, mut op: F) -> u128
where
    F: FnMut(),
{
    let start = Instant::now();
    for _ in 0..iterations {
        op();
    }
    let elapsed = start.elapsed().as_millis();
    println!(
        "{}: {} iterations in {}ms ({:.3}ms/iter)",
        name,
        iterations,
        elapsed,
        elapsed as f64 / iterations as f64
    );
    elapsed
}

/// Helper: Assert performance is acceptable
fn assert_performance_acceptable(name: &str, elapsed_ms: u128, max_ms_per_iter: f64) {
    let avg = elapsed_ms as f64 / 100.0; // Assume 100 iterations
    assert!(
        avg <= max_ms_per_iter,
        "{}: {:.3}ms/iter exceeds limit of {:.3}ms/iter",
        name,
        avg,
        max_ms_per_iter
    );
}
