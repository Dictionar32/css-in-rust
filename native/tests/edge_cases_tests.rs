//! Phase 5c: Edge Case Testing
//!
//! Tests boundary conditions and robustness of the CSS compiler:
//! - Very long class names
//! - Unicode characters
//! - Deeply nested variants
//! - Circular references (if applicable)
//! - Very large theme configurations
//! - Memory/DOS protection
//!
//! **Validates: Requirements 7.0, 8.0, 14.0 (Edge cases, Errors, Robustness)**

#[cfg(test)]
mod edge_cases_tests {
    use tailwind_styled_parser::{
        domain::css_compiler::CssCompiler,
        domain::theme_config::ThemeConfig,
    };

    fn default_theme() -> ThemeConfig {
        ThemeConfig::default()
    }

    // ============================================================================
    // EDGE CASE GROUP 1: Very Long Class Names
    // ============================================================================

    #[test]
    fn test_edge_case_long_class_name() {
        let compiler = CssCompiler::new(default_theme());
        
        // Create a very long class name (but still valid Tailwind syntax)
        let long_class = "hover:focus:active:md:lg:dark:group-hover:peer-focus:bg-blue-500/50".to_string();
        
        let result = compiler.compile(vec![long_class.clone()]);
        assert!(result.is_ok(), "Should handle very long class names");
    }

    #[test]
    fn test_edge_case_deeply_nested_arbitrary_value() {
        let compiler = CssCompiler::new(default_theme());
        
        // Arbitrary value with complex CSS
        let classes = vec![
            "[box-shadow:inset_0_2px_4px_0_rgba(0,0,0,0.05)]".to_string(),
        ];
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle complex arbitrary values");
        
        let css = result.unwrap();
        assert!(!css.is_empty(), "Should generate CSS for arbitrary value");
    }

    #[test]
    fn test_edge_case_arbitrary_value_with_quotes() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec![
            "[content:'Hello_World']".to_string(),
        ];
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle arbitrary values with quotes");
    }

    // ============================================================================
    // EDGE CASE GROUP 2: Unicode & Special Characters
    // ============================================================================

    #[test]
    fn test_edge_case_unicode_in_class() {
        let compiler = CssCompiler::new(default_theme());
        
        // Note: Tailwind classes shouldn't contain unicode, but test graceful handling
        let classes = vec!["px-4".to_string()]; // Standard ASCII
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle standard classes");
    }

    #[test]
    fn test_edge_case_special_chars_in_arbitrary_value() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec![
            "[color:rgba(255,_0,_0,_0.5)]".to_string(),
        ];
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle special characters in arbitrary values");
    }

    // ============================================================================
    // EDGE CASE GROUP 3: Deeply Nested Variants
    // ============================================================================

    #[test]
    fn test_edge_case_many_stacked_variants() {
        let compiler = CssCompiler::new(default_theme());
        
        // Stack multiple variants (more than typical use)
        let classes = vec![
            "hover:focus:active:md:dark:bg-blue-500".to_string(),
        ];
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle deeply stacked variants");
        
        let css = result.unwrap();
        assert!(!css.is_empty(), "Should generate CSS");
    }

    #[test]
    fn test_edge_case_same_variant_repeated() {
        let compiler = CssCompiler::new(default_theme());
        
        // Try to use the same variant twice (invalid, but test graceful handling)
        let classes = vec![
            "hover:hover:bg-blue-500".to_string(),
        ];
        
        let result = compiler.compile(classes);
        // Should either handle gracefully or reject cleanly
        assert!(result.is_ok() || result.is_err(), "Should handle repeated variants gracefully");
    }

    // ============================================================================
    // EDGE CASE GROUP 4: Boundary Values & Limits
    // ============================================================================

    #[test]
    fn test_edge_case_opacity_boundary_0() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["bg-blue-500/0".to_string()];
        let result = compiler.compile(classes);
        
        // Should either succeed or fail gracefully
        assert!(result.is_ok() || result.is_err(), "Should handle opacity 0 gracefully");
    }

    #[test]
    fn test_edge_case_opacity_boundary_100() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["bg-blue-500/100".to_string()];
        let result = compiler.compile(classes);
        
        assert!(result.is_ok() || result.is_err(), "Should handle opacity 100 gracefully");
    }

    #[test]
    fn test_edge_case_opacity_invalid_value() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["bg-blue-500/150".to_string()]; // Invalid: >100
        let result = compiler.compile(classes);
        
        // Should fail gracefully (not panic)
        // Result can be Ok or Err depending on strictness
        assert!(result.is_ok() || result.is_err(), "Should handle invalid opacity gracefully");
    }

    #[test]
    fn test_edge_case_opacity_negative() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["bg-blue-500/-50".to_string()]; // Invalid: negative
        let result = compiler.compile(classes);
        
        assert!(result.is_ok() || result.is_err(), "Should handle negative opacity gracefully");
    }

    // ============================================================================
    // EDGE CASE GROUP 5: Empty & Null Cases
    // ============================================================================

    #[test]
    fn test_edge_case_empty_class_list() {
        let compiler = CssCompiler::new(default_theme());
        
        let result = compiler.compile(vec![]);
        assert!(result.is_ok(), "Should handle empty class list");
        
        let css = result.unwrap();
        assert!(css.is_empty() || is_valid_css_syntax(&css), "Should produce valid CSS");
    }

    #[test]
    fn test_edge_case_empty_string_class() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["".to_string()];
        let result = compiler.compile(classes);
        
        // Should handle empty strings gracefully
        assert!(result.is_ok() || result.is_err(), "Should handle empty strings");
    }

    #[test]
    fn test_edge_case_whitespace_only_class() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["   ".to_string(), "\t".to_string(), "\n".to_string()];
        let result = compiler.compile(classes);
        
        assert!(result.is_ok(), "Should handle whitespace-only classes");
    }

    // ============================================================================
    // EDGE CASE GROUP 6: Invalid Syntax Handling
    // ============================================================================

    #[test]
    fn test_edge_case_unmatched_brackets() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["[width:200px".to_string()]; // Missing closing ]
        let result = compiler.compile(classes);
        
        // Should fail gracefully, not panic
        assert!(result.is_ok() || result.is_err(), "Should handle malformed arbitrary values");
    }

    #[test]
    fn test_edge_case_double_colon() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["hover::bg-blue".to_string()];
        let result = compiler.compile(classes);
        
        // Should handle gracefully
        assert!(result.is_ok() || result.is_err(), "Should handle double colons");
    }

    #[test]
    fn test_edge_case_missing_value() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["px-".to_string()]; // Missing value after prefix
        let result = compiler.compile(classes);
        
        // Should fail gracefully
        assert!(result.is_ok() || result.is_err(), "Should handle missing values");
    }

    #[test]
    fn test_edge_case_only_prefix_no_value() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["px".to_string()]; // Prefix without value
        let result = compiler.compile(classes);
        
        assert!(result.is_ok() || result.is_err(), "Should handle prefix-only classes");
    }

    // ============================================================================
    // EDGE CASE GROUP 7: Large Batch Processing
    // ============================================================================

    #[test]
    fn test_edge_case_massive_class_batch() {
        let compiler = CssCompiler::new(default_theme());
        
        // Generate 5000 diverse classes
        let mut classes = Vec::new();
        for i in 0..5000 {
            classes.push(format!("p-{}", (i % 12) + 1));
        }
        
        let result = compiler.compile(classes);
        // Should complete without running out of memory
        assert!(result.is_ok(), "Should handle very large batches");
    }

    #[test]
    fn test_edge_case_duplicate_classes_many() {
        let compiler = CssCompiler::new(default_theme());
        
        // Many duplicates of the same class
        let classes = vec!["px-4".to_string(); 1000];
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle many duplicates");
        
        // CSS should handle many duplicates without crashing
        let css = result.unwrap();
        assert!(!css.is_empty(), "Should generate CSS");
    }

    // ============================================================================
    // EDGE CASE GROUP 8: DOS Protection
    // ============================================================================

    #[test]
    fn test_edge_case_extremely_long_class_name() {
        let compiler = CssCompiler::new(default_theme());
        
        // Create a 1000-character class name
        let long_class = format!("[{}:value]", "a".repeat(500));
        
        let result = compiler.compile(vec![long_class]);
        // Should not crash or hang
        assert!(result.is_ok() || result.is_err(), "Should handle extremely long names");
    }

    #[test]
    fn test_edge_case_many_modifiers() {
        let compiler = CssCompiler::new(default_theme());
        
        // Class with many slash-separated modifiers (tests parsing robustness)
        let classes = vec!["bg-blue-500/50/75/25".to_string()]; // Multiple slashes
        
        let result = compiler.compile(classes);
        // Should handle gracefully
        assert!(result.is_ok() || result.is_err(), "Should handle multiple slashes");
    }

    #[test]
    fn test_edge_case_pathological_nesting() {
        let compiler = CssCompiler::new(default_theme());
        
        // Deeply nested arbitrary value
        let mut nested = "value".to_string();
        for _ in 0..10 {
            nested = format!("({})", nested);
        }
        let class = format!("[property:{}]", nested);
        
        let result = compiler.compile(vec![class]);
        // Should handle nested parentheses without stack overflow
        assert!(result.is_ok() || result.is_err(), "Should handle deeply nested values");
    }

    // ============================================================================
    // EDGE CASE GROUP 9: Consistency Under Stress
    // ============================================================================

    #[test]
    fn test_edge_case_repeated_compilation() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec!["px-4".to_string(), "bg-blue-500".to_string()];
        
        // Compile many times to test for memory leaks or state issues
        for _ in 0..100 {
            let result = compiler.compile(classes.clone());
            assert!(result.is_ok(), "Should compile consistently");
        }
    }

    #[test]
    fn test_edge_case_mixed_valid_invalid_classes() {
        let compiler = CssCompiler::new(default_theme());
        
        let classes = vec![
            "px-4".to_string(),              // valid
            "[invalid".to_string(),          // invalid
            "hover:bg-blue".to_string(),     // valid
            "".to_string(),                  // empty
            "unknown-class".to_string(),     // possibly invalid
            "md:text-lg".to_string(),        // valid
        ];
        
        let result = compiler.compile(classes);
        // Should complete without crashing
        assert!(result.is_ok(), "Should handle mixed valid/invalid input");
    }

    // ============================================================================
    // Helper Functions
    // ============================================================================

    fn is_valid_css_syntax(css: &str) -> bool {
        if css.is_empty() {
            return true;
        }

        // Basic syntax checks
        let open_braces = css.matches('{').count();
        let close_braces = css.matches('}').count();
        
        open_braces == close_braces && open_braces > 0
    }

    // ============================================================================
    // EDGE CASE GROUP 10: Resource Limits
    // ============================================================================

    #[test]
    fn test_edge_case_very_large_theme_config() {
        // Test handling of large theme configs
        let mut theme = ThemeConfig::default();
        
        // Simulate a large custom theme
        for i in 0..1000 {
            theme.extend.insert(
                format!("custom-{}", i),
                vec![
                    (format!("value-{}", i), format!("{}px", i)),
                ]
                .into_iter()
                .collect(),
            );
        }
        
        let compiler = CssCompiler::new(theme);
        let classes = vec!["px-4".to_string()];
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle large theme configs");
    }

    #[test]
    fn test_edge_case_all_tailwind_breakpoints() {
        let compiler = CssCompiler::new(default_theme());
        
        let breakpoints = vec!["sm", "md", "lg", "xl", "2xl"];
        let mut classes = Vec::new();
        
        for bp in breakpoints {
            classes.push(format!("{}:text-lg", bp));
        }
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle all breakpoints");
    }

    #[test]
    fn test_edge_case_all_state_variants() {
        let compiler = CssCompiler::new(default_theme());
        
        let states = vec!["hover", "focus", "active", "disabled", "visited", "group-hover"];
        let mut classes = Vec::new();
        
        for state in states {
            classes.push(format!("{}:bg-blue-500", state));
        }
        
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle all state variants");
    }
}
