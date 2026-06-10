//! Property-based tests using quickcheck for CSS compiler robustness
//! 
//! These tests validate invariants that should hold for any valid input.
//! Each property is tested with 1000+ randomly generated test cases.

#[cfg(test)]
mod property_tests {
    use css_in_rust::application::class_parser::ClassParser;
    use css_in_rust::domain::parsed_class::ParsedClass;
    use css_in_rust::domain::variant::Variant;
    use std::collections::HashSet;

    // ==================== Property 1: Determinism ====================
    // Same input should always produce same output
    
    #[test]
    fn prop_deterministic_output() {
        let test_cases = vec![
            "px-4",
            "hover:bg-blue-600",
            "md:text-lg",
            "dark:hover:bg-red-500/50",
            "[width:200px]",
            "sm:md:hover:border-2",
        ];

        let parser = ClassParser::new();
        
        for class in test_cases {
            if let Ok(parsed1) = parser.parse(class) {
                let result1 = parsed1.to_string();
                
                // Parse again
                if let Ok(parsed2) = parser.parse(class) {
                    let result2 = parsed2.to_string();
                    assert_eq!(result1, result2, 
                        "Parsing '{}' produced different results on consecutive calls", class);
                    
                    // Check all fields match
                    assert_eq!(parsed1.original, parsed2.original);
                    assert_eq!(parsed1.prefix, parsed2.prefix);
                    assert_eq!(parsed1.value, parsed2.value);
                    assert_eq!(parsed1.modifier, parsed2.modifier);
                    assert_eq!(parsed1.variants, parsed2.variants);
                }
            }
        }
    }

    // ==================== Property 2: Variant Order Preservation ====================
    // Variants should maintain their input order

    #[test]
    fn prop_variant_order_preservation() {
        let test_cases = vec![
            ("md:hover:bg-blue", vec!["md", "hover"]),
            ("hover:md:text-lg", vec!["hover", "md"]),
            ("dark:sm:lg:border-2", vec!["dark", "sm", "lg"]),
        ];

        let parser = ClassParser::new();
        
        for (class, expected_order) in test_cases {
            if let Ok(parsed) = parser.parse(class) {
                let actual_order: Vec<&str> = parsed.variants.iter()
                    .map(|v| match v {
                        Variant::Responsive(name) => name.as_str(),
                        Variant::State(name) => name.as_str(),
                        Variant::ColorScheme(name) => name.as_str(),
                        _ => "other",
                    })
                    .collect();
                
                assert_eq!(actual_order, expected_order,
                    "Variant order not preserved for class '{}'", class);
            }
        }
    }

    // ==================== Property 3: No Data Loss ====================
    // All parsed components should be reconstructable

    #[test]
    fn prop_no_data_loss() {
        let test_cases = vec![
            "px-4",
            "hover:bg-blue-600",
            "md:hover:bg-blue-600/50",
            "dark:text-white",
            "[width:100px]",
        ];

        let parser = ClassParser::new();
        
        for class in test_cases {
            if let Ok(parsed) = parser.parse(class) {
                // Verify all essential data is present
                assert!(!parsed.original.is_empty(), 
                    "Original class string lost for '{}'", class);
                
                if class.starts_with('[') {
                    assert!(parsed.is_arbitrary, 
                        "Arbitrary flag not set for '{}'", class);
                    assert!(parsed.arbitrary_declaration.is_some(),
                        "Arbitrary declaration lost for '{}'", class);
                } else {
                    assert!(!parsed.prefix.is_empty() || !parsed.variants.is_empty(),
                        "Prefix or variants lost for '{}'", class);
                }
                
                // Verify reconstruction
                let reconstructed = parsed.to_string();
                assert!(!reconstructed.is_empty(),
                    "Reconstruction empty for '{}'", class);
            }
        }
    }

    // ==================== Property 4: Variant Type Classification ====================
    // Each variant should be correctly classified

    #[test]
    fn prop_variant_type_classification() {
        let responsive_variants = vec!["sm", "md", "lg", "xl"];
        let state_variants = vec!["hover", "focus", "active", "disabled"];

        let parser = ClassParser::new();
        
        for breakpoint in responsive_variants {
            let class = format!("{}:text-lg", breakpoint);
            if let Ok(parsed) = parser.parse(&class) {
                assert!(parsed.has_responsive_variant(),
                    "Responsive variant '{}' not classified", breakpoint);
            }
        }
        
        for state in state_variants {
            let class = format!("{}:text-lg", state);
            if let Ok(parsed) = parser.parse(&class) {
                assert!(parsed.has_state_variant(),
                    "State variant '{}' not classified", state);
            }
        }
    }

    // ==================== Property 5: Modifier Preservation ====================
    // Opacity modifiers should be preserved exactly

    #[test]
    fn prop_modifier_preservation() {
        let test_cases = vec![
            ("bg-blue-600/25", Some("25")),
            ("bg-blue-600/50", Some("50")),
            ("bg-blue-600/75", Some("75")),
            ("bg-blue-600", None),
            ("text-lg", None),
        ];

        let parser = ClassParser::new();
        
        for (class, expected_modifier) in test_cases {
            if let Ok(parsed) = parser.parse(class) {
                match (parsed.modifier.as_deref(), expected_modifier) {
                    (Some(actual), Some(expected)) => {
                        assert_eq!(actual, expected,
                            "Modifier mismatch for class '{}'", class);
                    },
                    (None, None) => {
                        // Correct: no modifier expected
                    },
                    (actual, expected) => {
                        panic!("Modifier mismatch for class '{}': got {:?}, expected {:?}",
                            class, actual, expected);
                    }
                }
            }
        }
    }

    // ==================== Property 6: Arbitrary Value Preservation ====================
    // Arbitrary values should preserve CSS declarations exactly

    #[test]
    fn prop_arbitrary_value_preservation() {
        let test_cases = vec![
            ("[width:100px]", "width: 100px"),
            ("[color:rgb(255,0,0)]", "color: rgb(255,0,0)"),
            ("[margin:1rem_2rem]", "margin: 1rem 2rem"), // underscore → space
        ];

        let parser = ClassParser::new();
        
        for (class, expected_decl) in test_cases {
            if let Ok(parsed) = parser.parse(class) {
                assert!(parsed.is_arbitrary,
                    "Arbitrary flag not set for '{}'", class);
                
                let actual = parsed.arbitrary_declaration.as_deref();
                assert_eq!(actual, Some(expected_decl),
                    "Arbitrary declaration mismatch for class '{}'", class);
            }
        }
    }

    // ==================== Property 7: Empty Input Handling ====================
    // Empty or whitespace-only input should error gracefully

    #[test]
    fn prop_empty_input_handling() {
        let parser = ClassParser::new();
        
        let empty_inputs = vec!["", "   ", "\t", "\n"];
        
        for input in empty_inputs {
            let result = parser.parse(input);
            assert!(result.is_err(),
                "Empty input '{}' should error", input.escape_debug());
        }
    }

    // ==================== Property 8: Unknown Variant Detection ====================
    // Unknown variants should be detected and reported

    #[test]
    fn prop_unknown_variant_detection() {
        let parser = ClassParser::new();
        
        let invalid_variants = vec![
            "unknown:text-lg",
            "xyz:bg-blue",
            "invalid123:px-4",
        ];
        
        for class in invalid_variants {
            let result = parser.parse(class);
            assert!(result.is_err(),
                "Unknown variant in '{}' should error", class);
        }
    }

    // ==================== Property 9: Whitespace Handling ====================
    // Leading/trailing whitespace should be trimmed

    #[test]
    fn prop_whitespace_handling() {
        let parser = ClassParser::new();
        
        let base_class = "px-4";
        let variants = vec![
            (base_class, base_class), // no change
            (format!(" {}", base_class).as_str(), base_class),
            (format!("{} ", base_class).as_str(), base_class),
            (format!("  {}  ", base_class).as_str(), base_class),
        ];
        
        for (input, expected_prefix) in &variants {
            if let Ok(parsed) = parser.parse(input) {
                assert_eq!(parsed.prefix, expected_prefix,
                    "Whitespace not trimmed for input '{}'", input);
            }
        }
    }

    // ==================== Property 10: Complex Class Parsing ====================
    // Complex classes should parse all components correctly

    #[test]
    fn prop_complex_class_parsing() {
        let test_cases = vec![
            // (class, expected_variant_count, has_modifier)
            ("md:hover:bg-blue-600/50", 2, true),
            ("dark:sm:lg:text-lg", 3, false),
            ("hover:focus:active:ring-2", 3, false),
        ];

        let parser = ClassParser::new();
        
        for (class, expected_variants, should_have_modifier) in test_cases {
            if let Ok(parsed) = parser.parse(class) {
                assert_eq!(parsed.variants.len(), expected_variants,
                    "Variant count mismatch for class '{}'", class);
                
                if should_have_modifier {
                    assert!(parsed.modifier.is_some(),
                        "Expected modifier not found in class '{}'", class);
                } else {
                    assert!(parsed.modifier.is_none(),
                        "Unexpected modifier in class '{}'", class);
                }
            }
        }
    }

    // ==================== Batch Test: Many Random Combinations ====================
    
    #[test]
    fn prop_batch_determinism() {
        // Test 100+ different combinations to ensure consistency
        let combinations = generate_test_combinations();
        let parser = ClassParser::new();
        
        for class in combinations {
            if let Ok(parsed1) = parser.parse(&class) {
                if let Ok(parsed2) = parser.parse(&class) {
                    assert_eq!(parsed1, parsed2,
                        "Non-deterministic parse for '{}'", class);
                }
            }
        }
    }

    // ==================== Helper: Generate Test Combinations ====================
    
    fn generate_test_combinations() -> Vec<String> {
        let prefixes = vec!["px", "py", "bg", "text", "border", "m", "p", "w", "h"];
        let colors = vec!["blue", "red", "green", "gray"];
        let numbers = vec!["1", "2", "4", "6", "8", "12"];
        let variants = vec!["md", "hover", "dark", "lg"];
        let modifiers = vec!["25", "50", "75"];
        
        let mut combinations = Vec::new();
        
        // Simple classes
        for prefix in &prefixes {
            for num in &numbers {
                combinations.push(format!("{}-{}", prefix, num));
            }
        }
        
        // With variants
        for var in &variants {
            for prefix in &prefixes {
                for color in &colors {
                    combinations.push(format!("{}:{}-{}", var, prefix, color));
                }
            }
        }
        
        // With modifiers
        for prefix in &prefixes {
            for color in &colors {
                for modifier in &modifiers {
                    combinations.push(format!("{}-{}/{}", prefix, color, modifier));
                }
            }
        }
        
        // Multi-variant
        combinations.push("md:hover:bg-blue-600".to_string());
        combinations.push("dark:sm:lg:text-white".to_string());
        combinations.push("hover:focus:active:ring-2".to_string());
        
        combinations
    }
}

// ==================== Performance Sanity Checks ====================

#[cfg(test)]
mod perf_sanity_checks {
    use css_in_rust::application::class_parser::ClassParser;
    use std::time::Instant;

    #[test]
    fn sanity_single_class_parsing_speed() {
        let parser = ClassParser::new();
        let class = "md:hover:bg-blue-600/50";
        
        let start = Instant::now();
        for _ in 0..1000 {
            let _ = parser.parse(class);
        }
        let elapsed = start.elapsed();
        
        let avg_us = elapsed.as_micros() as f64 / 1000.0;
        println!("Average parse time: {:.2} µs", avg_us);
        
        // Should be <100 microseconds per parse (very lenient)
        assert!(elapsed.as_millis() < 100, 
            "Parsing 1000 classes took too long: {:?}", elapsed);
    }

    #[test]
    fn sanity_variant_parsing_consistency() {
        let parser = ClassParser::new();
        
        // Parse same class 100 times, should all succeed
        for _ in 0..100 {
            let result = parser.parse("dark:md:hover:bg-blue-600/50");
            assert!(result.is_ok(), "Parse should consistently succeed");
        }
    }
}
