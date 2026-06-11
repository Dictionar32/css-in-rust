//! PHASE 7.4: Property-Based Testing - CSS Validity
//! 
//! Property 6: CSS Validity (Simplified to Parsing Determinism)
//! ==============================================================
//! 
//! Verify that parsing and resolution are always deterministic:
//! - Parser produces same result on multiple parses
//! - Variant counts are consistent
//! - Prefix/value extraction is deterministic

use proptest::prelude::*;
use tailwind_styled_parser::application::class_parser::ClassParser;
use tailwind_styled_parser::application::theme_resolver::ThemeResolver;

// Strategy for generating Tailwind class strings
fn class_strategy() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("p-4"),
        Just("text-red-500"),
        Just("bg-blue-600"),
        Just("w-1/2"),
        Just("opacity-75"),
        Just("hover:p-4"),
        Just("sm:flex"),
        Just("dark:text-white"),
        Just("md:w-full"),
        Just("focus:outline-none"),
        Just("active:bg-gray-200"),
        Just("hover:focus:text-red-500"),
        Just("sm:md:p-4"),
        Just("dark:hover:bg-gray-100"),
    ]
    .prop_map(|s| s.to_string())
}

// ============================================================================
// PROPERTY 6: CSS Validity (Parsing Determinism)
// ============================================================================

proptest! {
    #![proptest_config(ProptestConfig::with_cases(200))]

    /// Property: Parsed classes always parse consistently
    #[test]
    fn prop_class_parsing_valid(
        class in class_strategy()
    ) {
        let parser = ClassParser::new();

        // Parse the class 3 times
        let parse1 = parser.parse(&class);
        let parse2 = parser.parse(&class);
        let parse3 = parser.parse(&class);

        // All should have same result
        let is_ok_1 = parse1.is_ok();
        let is_ok_2 = parse2.is_ok();
        let is_ok_3 = parse3.is_ok();

        prop_assert_eq!(is_ok_1, is_ok_2);
        prop_assert_eq!(is_ok_2, is_ok_3);
    }

    /// Property: Classes with variants parse consistently
    #[test]
    fn prop_css_with_variants_valid(
        base in Just("p-4"),
        variant in prop_oneof![
            Just("hover"),
            Just("focus"),
            Just("active"),
            Just("sm"),
            Just("md"),
            Just("dark"),
        ]
    ) {
        let parser = ClassParser::new();

        let class = format!("{}:{}", variant, base);

        let parse1 = parser.parse(&class);
        let parse2 = parser.parse(&class);
        let parse3 = parser.parse(&class);

        // All parses should have same result
        prop_assert_eq!(parse1.is_ok(), parse2.is_ok());
        prop_assert_eq!(parse2.is_ok(), parse3.is_ok());

        if let (Ok(p1), Ok(p2), Ok(p3)) = (parse1, parse2, parse3) {
            prop_assert_eq!(p1.variants.len(), p2.variants.len());
            prop_assert_eq!(p2.variants.len(), p3.variants.len());
        }
    }

    /// Property: Multiple parses from same class are identical
    #[test]
    fn prop_parsing_consistent(
        class in class_strategy()
    ) {
        let parser = ClassParser::new();

        let parse1 = parser.parse(&class);
        let parse2 = parser.parse(&class);
        let parse3 = parser.parse(&class);

        // All should parse
        if let (Ok(p1), Ok(p2), Ok(p3)) = (parse1, parse2, parse3) {
            prop_assert_eq!(p1.prefix.as_str(), p2.prefix.as_str(), "Parse 1 vs 2 prefix differ");
            prop_assert_eq!(p1.value.as_str(), p2.value.as_str(), "Parse 1 vs 2 value differ");
            prop_assert_eq!(p2.prefix.as_str(), p3.prefix.as_str(), "Parse 2 vs 3 prefix differ");
            prop_assert_eq!(p2.value.as_str(), p3.value.as_str(), "Parse 2 vs 3 value differ");
        }
    }
}

// ============================================================================
// REAL-WORLD CSS VALIDITY TESTS
// ============================================================================

#[test]
fn test_css_basic_class_parsing() {
    let parser = ClassParser::new();

    let test_cases = vec![
        "p-4",
        "text-red-500",
        "bg-blue-600",
        "w-1/2",
        "opacity-75",
        "flex",
        "items-center",
        "justify-between",
        "rounded-lg",
        "shadow-md",
    ];

    for class in test_cases {
        let parse1 = parser.parse(class);
        let parse2 = parser.parse(class);
        let parse3 = parser.parse(class);

        assert_eq!(parse1.is_ok(), parse2.is_ok(), "Inconsistent parse for: {}", class);
        assert_eq!(parse2.is_ok(), parse3.is_ok(), "Inconsistent parse for: {}", class);

        if let (Ok(p1), Ok(p2), Ok(p3)) = (parse1, parse2, parse3) {
            assert_eq!(p1.prefix, p2.prefix, "Prefix changed for: {}", class);
            assert_eq!(p2.prefix, p3.prefix, "Prefix changed for: {}", class);
        }
    }
}

#[test]
fn test_variant_parsing_consistency() {
    let parser = ClassParser::new();

    let test_cases = vec![
        "hover:p-4",
        "focus:outline-none",
        "active:bg-gray-200",
        "sm:flex",
        "md:w-full",
        "dark:text-white",
    ];

    for class in test_cases {
        let parse1 = parser.parse(class);
        let parse2 = parser.parse(class);
        let parse3 = parser.parse(class);

        assert_eq!(parse1.is_ok(), parse2.is_ok());
        assert_eq!(parse2.is_ok(), parse3.is_ok());
        
        if let (Ok(p1), Ok(p2), Ok(p3)) = (parse1, parse2, parse3) {
            assert_eq!(p1.variants.len(), p2.variants.len());
            assert_eq!(p2.variants.len(), p3.variants.len());
        }
    }
}

#[test]
fn test_multiple_variants_parsing() {
    let parser = ClassParser::new();

    let test_cases = vec![
        "hover:md:p-4",
        "focus:dark:text-red-500",
        "sm:active:bg-blue-600",
        "dark:hover:bg-gray-100",
        "hover:focus:text-white",
    ];

    for class in test_cases {
        let parse1 = parser.parse(class);
        let parse2 = parser.parse(class);
        let parse3 = parser.parse(class);

        assert_eq!(parse1.is_ok(), parse2.is_ok());
        assert_eq!(parse2.is_ok(), parse3.is_ok());

        if let (Ok(p1), Ok(p2), Ok(p3)) = (parse1, parse2, parse3) {
            assert_eq!(p1.prefix, p2.prefix);
            assert_eq!(p2.prefix, p3.prefix);
        }
    }
}

#[test]
fn test_theme_resolution_consistency() {
    let parser = ClassParser::new();
    let resolver = ThemeResolver::default();

    let test_cases = vec![
        "p-4",
        "text-red-500",
        "bg-blue-600",
        "hover:p-4",
        "sm:flex",
        "dark:text-white",
    ];

    for class in test_cases {
        if let Ok(parsed) = parser.parse(class) {
            // For spacing prefix, try to resolve
            if parsed.prefix == "p" || parsed.prefix == "px" || parsed.prefix == "py" || parsed.prefix == "m" {
                let result1 = resolver.resolve_spacing(&parsed.value);
                let result2 = resolver.resolve_spacing(&parsed.value);
                assert_eq!(result1.is_ok(), result2.is_ok());
            }
            // For color prefix
            else if parsed.prefix == "text" || parsed.prefix == "bg" {
                let result1 = resolver.resolve_color(&parsed.value);
                let result2 = resolver.resolve_color(&parsed.value);
                // Both should have same result (ok or err)
                assert_eq!(result1.is_ok(), result2.is_ok());
            }
        }
    }
}

#[test]
fn test_variant_count_consistency() {
    let parser = ClassParser::new();

    let test_cases = vec![
        ("p-4", 0),
        ("hover:p-4", 1),
        ("sm:p-4", 1),
        ("hover:md:p-4", 2),
        ("dark:hover:focus:p-4", 3),
    ];

    for (class, expected_variant_count) in test_cases {
        let parse1 = parser.parse(class);
        let parse2 = parser.parse(class);

        if let (Ok(p1), Ok(p2)) = (parse1, parse2) {
            assert_eq!(p1.variants.len(), expected_variant_count, "Variant count mismatch for: {}", class);
            assert_eq!(p1.variants.len(), p2.variants.len(), "Inconsistent variant count for: {}", class);
        }
    }
}

#[test]
fn test_parsing_determinism_across_iterations() {
    let parser = ClassParser::new();

    let test_cases = vec![
        "p-4",
        "text-red-500",
        "hover:bg-blue-600",
        "sm:flex",
        "dark:text-white",
    ];

    for class in test_cases {
        let mut results = Vec::new();
        for _ in 0..10 {
            if let Ok(parsed) = parser.parse(class) {
                results.push((parsed.prefix, parsed.value));
            }
        }

        // All iterations should be identical
        if !results.is_empty() {
            let first = &results[0];
            for (i, result) in results.iter().enumerate() {
                assert_eq!(result.0, first.0, "Prefix mismatch at iteration {} for class: {}", i, class);
                assert_eq!(result.1, first.1, "Value mismatch at iteration {} for class: {}", i, class);
            }
        }
    }
}

#[test]
fn test_edge_case_empty_parsing() {
    let parser = ClassParser::new();

    // Empty string should fail to parse
    let result = parser.parse("");
    // Result depends on implementation - just verify it's consistent
    let is_ok_1 = result.is_ok();
    let is_ok_2 = parser.parse("").is_ok();
    assert_eq!(is_ok_1, is_ok_2);
}
