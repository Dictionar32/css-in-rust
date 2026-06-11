//! PHASE 7.4: Property-Based Testing - Round-trip Parsing (SIMPLIFIED)
//! 
//! Property 2: Parser Determinism on Multiple Parses
//! ==================================================
//! 
//! Simplified test: Verify that parsing the same class multiple times
//! always produces the same ParsedClass output (no mutation/variation).
//!
//! This is a simpler variant of round-trip that focuses on parser stability.

use proptest::prelude::*;
use tailwind_styled_parser::application::class_parser::ClassParser;

// Strategy for generating valid Tailwind class strings
fn class_string_strategy() -> impl Strategy<Value = String> {
    prop_oneof![
        Just("p-4"),
        Just("m-2"),
        Just("w-1/2"),
        Just("h-auto"),
        Just("bg-blue-500"),
        Just("text-red-600"),
        Just("border-2"),
        Just("rounded-lg"),
        Just("hover:bg-blue-600"),
        Just("focus:outline-none"),
        Just("active:opacity-75"),
        Just("sm:p-4"),
        Just("md:w-1/3"),
        Just("lg:flex"),
        Just("xl:grid"),
        Just("dark:md:hover:text-white"),
        Just("sm:focus:ring-2"),
        Just("lg:group-hover:opacity-50"),
    ]
    .prop_map(|s| s.to_string())
}

// ============================================================================
// PROPERTY 2: Round-trip Stability
// ============================================================================

proptest! {
    #![proptest_config(ProptestConfig::with_cases(200))]

    /// Property: Multiple parses of same class produce identical results
    ///
    /// This verifies that ParsedClass output is stable and deterministic
    /// across multiple parse calls with same input.
    #[test]
    fn prop_parser_stability_multiple_parses(
        class in class_string_strategy()
    ) {
        let parser = ClassParser::new();

        // Parse the same class 5 times
        let parse_results: Vec<_> = (0..5)
            .map(|_| parser.parse(&class))
            .collect();

        // Count successes and failures
        let successes: Vec<_> = parse_results
            .iter()
            .filter_map(|r| r.as_ref().ok())
            .collect();

        let num_failures = parse_results
            .iter()
            .filter(|r| r.is_err())
            .count();

        // All should succeed or all should fail (consistency)
        if !successes.is_empty() {
            prop_assert_eq!(
                successes.len(),
                5,
                "Parse results inconsistent: {} successes, {} failures for '{}'",
                successes.len(),
                num_failures,
                class
            );

            // All successful parses should have identical raw output
            let first_raw = &successes[0].raw;
            for (idx, parsed) in successes.iter().enumerate() {
                prop_assert_eq!(
                    &parsed.raw,
                    first_raw,
                    "Parse {} produces different raw output",
                    idx
                );
            }

            // All should have identical prefix
            let first_prefix = &successes[0].prefix;
            for (idx, parsed) in successes.iter().enumerate() {
                prop_assert_eq!(
                    &parsed.prefix,
                    first_prefix,
                    "Parse {} produces different prefix",
                    idx
                );
            }

            // All should have identical value
            let first_value = &successes[0].value;
            for (idx, parsed) in successes.iter().enumerate() {
                prop_assert_eq!(
                    &parsed.value,
                    first_value,
                    "Parse {} produces different value",
                    idx
                );
            }

            // All should have same variant count
            let first_variant_count = successes[0].variants.len();
            for (idx, parsed) in successes.iter().enumerate() {
                prop_assert_eq!(
                    parsed.variants.len(),
                    first_variant_count,
                    "Parse {} produces different variant count",
                    idx
                );
            }
        } else if num_failures > 0 {
            // All should fail consistently
            prop_assert_eq!(
                num_failures,
                5,
                "Parse results inconsistent: {} successes, {} failures",
                5 - num_failures,
                num_failures
            );
        }
    }

    /// Property: Parser output components are all deterministic
    #[test]
    fn prop_parser_deterministic_components(
        class in class_string_strategy()
    ) {
        let parser = ClassParser::new();

        // Parse multiple times
        let parse1 = parser.parse(&class);
        let parse2 = parser.parse(&class);
        let parse3 = parser.parse(&class);

        // If all succeeded, verify component determinism
        if let (Ok(p1), Ok(p2), Ok(p3)) = (parse1, parse2, parse3) {

            // base should be identical
            prop_assert_eq!(&p1.base, &p2.base, "Base differs between parse 1 and 2");
            prop_assert_eq!(&p2.base, &p3.base, "Base differs between parse 2 and 3");

            // is_arbitrary should be identical
            prop_assert_eq!(p1.is_arbitrary, p2.is_arbitrary);
            prop_assert_eq!(p2.is_arbitrary, p3.is_arbitrary);

            // variants_str should be identical
            prop_assert_eq!(&p1.variants_str, &p2.variants_str);
            prop_assert_eq!(&p2.variants_str, &p3.variants_str);

            // All component strings should be non-empty for valid classes
            prop_assert!(!p1.raw.is_empty(), "Raw output should not be empty");
            prop_assert!(!p1.prefix.is_empty() || p1.is_arbitrary, 
                "Prefix should not be empty unless arbitrary");
        }
    }

    /// Property: Arbitrary values are parsed consistently
    #[test]
    fn prop_parser_arbitrary_consistency(
        value_suffix in "[a-z0-9]{1,10}"
    ) {
        let parser = ClassParser::new();
        let class = format!("w-[{}px]", value_suffix);

        let parse_results: Vec<_> = (0..3)
            .map(|_| parser.parse(&class))
            .collect();

        // All should have same result (success or failure)
        let first_is_ok = parse_results[0].is_ok();
        for (idx, result) in parse_results.iter().enumerate() {
            prop_assert_eq!(
                result.is_ok(),
                first_is_ok,
                "Parse {} has different success status",
                idx
            );
        }

        // If all succeeded, arbitrary flag should be identical
        if let (Some(Ok(p1)), Some(Ok(p2)), Some(Ok(p3))) = 
            (parse_results.get(0), parse_results.get(1), parse_results.get(2)) {
            prop_assert_eq!(p1.is_arbitrary, p2.is_arbitrary);
            prop_assert_eq!(p2.is_arbitrary, p3.is_arbitrary);
        }
    }
}

// ============================================================================
// REAL-WORLD ROUND-TRIP TESTS
// ============================================================================

#[test]
fn test_round_trip_basic_utilities() {
    let parser = ClassParser::new();

    let test_cases = vec![
        "p-4",
        "m-2",
        "w-1/2",
        "h-auto",
        "bg-blue-500",
        "text-red-600",
        "border-2",
        "rounded-lg",
    ];

    for class in test_cases {
        // Parse multiple times
        let results: Vec<_> = (0..3)
            .map(|_| parser.parse(class))
            .collect();

        // All should have same result
        if let (Some(Ok(p1)), Some(Ok(p2)), Some(Ok(p3))) = 
            (results.get(0), results.get(1), results.get(2)) {
            assert_eq!(p1.raw, p2.raw, "Parse 1 and 2 differ for {}", class);
            assert_eq!(p2.raw, p3.raw, "Parse 2 and 3 differ for {}", class);
            assert_eq!(p1.prefix, p2.prefix);
            assert_eq!(p1.value, p2.value);
        }
    }
}

#[test]
fn test_round_trip_responsive_variants() {
    let parser = ClassParser::new();

    let test_cases = vec![
        "sm:p-4",
        "md:w-1/3",
        "lg:flex",
        "xl:grid",
    ];

    for class in test_cases {
        let results: Vec<_> = (0..3)
            .map(|_| parser.parse(class))
            .collect();

        if let (Some(Ok(p1)), Some(Ok(p2)), Some(Ok(p3))) = 
            (results.get(0), results.get(1), results.get(2)) {
            assert_eq!(p1.variants.len(), p2.variants.len());
            assert_eq!(p2.variants.len(), p3.variants.len());
        }
    }
}

#[test]
fn test_round_trip_state_variants() {
    let parser = ClassParser::new();

    let test_cases = vec![
        "hover:bg-blue-600",
        "focus:outline-none",
        "active:opacity-75",
    ];

    for class in test_cases {
        let results: Vec<_> = (0..3)
            .map(|_| parser.parse(class))
            .collect();

        if let (Some(Ok(p1)), Some(Ok(p2)), Some(Ok(p3))) = 
            (results.get(0), results.get(1), results.get(2)) {
            assert_eq!(p1.base, p2.base);
            assert_eq!(p2.base, p3.base);
        }
    }
}

#[test]
fn test_round_trip_complex_variants() {
    let parser = ClassParser::new();

    let test_cases = vec![
        "dark:md:hover:text-white",
        "sm:focus:ring-2",
        "lg:group-hover:opacity-50",
    ];

    for class in test_cases {
        let results: Vec<_> = (0..3)
            .map(|_| parser.parse(class))
            .collect();

        // All should have same result
        let first_is_ok = results[0].is_ok();
        for (idx, result) in results.iter().enumerate() {
            assert_eq!(result.is_ok(), first_is_ok,
                "Parse {} has different result for {}", idx, class);
        }
    }
}

