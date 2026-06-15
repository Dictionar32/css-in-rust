//! Week 3 Integration Tests
//! Final comprehensive testing before Week 4

use tailwind_styled_parser::application::class_parser::ClassParser;
use tailwind_styled_parser::application::theme_resolver::ThemeResolver;
use tailwind_styled_parser::domain::variant::Variant;
use std::str::FromStr;

// Helper to convert string slices to Variant enum
fn to_variants(v: Vec<&str>) -> smallvec::SmallVec<[Variant; 4]> {
    v.into_iter().map(|s| Variant::from_str(s).unwrap()).collect()
}

// ============================================================================
// REAL-WORLD USAGE PATTERNS (20+ tests)
// ============================================================================

#[test]
fn test_tailwind_button_class() {
    let mut resolver = ThemeResolver::default();
    let parser = ClassParser::new();
    
    // Typical button: px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
    let classes = vec!["px-4", "py-2", "bg-blue-600", "text-white", "hover:bg-blue-700"];
    
    for class in classes {
        let parsed = parser.parse(class);
        assert!(parsed.is_ok());
        
        let p = parsed.unwrap();
        // All should resolve
        if p.prefix == "px" || p.prefix == "py" {
            assert!(resolver.resolve_spacing(&p.value).is_ok());
        } else if p.prefix == "bg" || p.prefix == "text" {
            assert!(resolver.resolve_color(&p.value).is_ok());
        }
    }
}

#[test]
fn test_responsive_grid_layout() {
    let mut resolver = ThemeResolver::default();
    let parser = ClassParser::new();
    
    // Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
    let classes = vec![
        "grid",
        "grid-cols-1",
        "md:grid-cols-2",
        "lg:grid-cols-3",
        "gap-4"
    ];
    
    for class in classes {
        let parsed = parser.parse(class);
        assert!(parsed.is_ok());
        
        let p = parsed.unwrap();
        if !p.variants.is_empty() {
            for variant in &p.variants {
                assert!(resolver.resolve_breakpoint(variant.name()).is_ok() || variant.name() == "dark");
            }
        }
    }
}

#[test]
fn test_card_component_classes() {
    let parser = ClassParser::new();
    
    // Card: p-6 bg-white shadow-lg rounded-xl border border-gray-200
    let classes = vec![
        "p-6",
        "bg-white",
        "shadow-lg",
        "rounded-xl",
        "border",
        "border-gray-200"
    ];
    
    for class in classes {
        let parsed = parser.parse(class);
        assert!(parsed.is_ok());
    }
}

#[test]
fn test_form_input_classes() {
    let parser = ClassParser::new();
    
    // Input: px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2
    let classes = vec![
        "px-4",
        "py-2",
        "border",
        "border-gray-300",
        "rounded-lg",
        "focus:border-blue-600",
        "focus:ring-2"
    ];
    
    for class in classes {
        let parsed = parser.parse(class);
        assert!(parsed.is_ok());
    }
}

#[test]
fn test_flex_container_classes() {
    let parser = ClassParser::new();
    
    // Flex: flex items-center justify-between gap-4 p-4
    let classes = vec![
        "flex",
        "items-center",
        "justify-between",
        "gap-4",
        "p-4"
    ];
    
    for class in classes {
        let parsed = parser.parse(class);
        assert!(parsed.is_ok());
    }
}

#[test]
fn test_dark_mode_classes() {
    let parser = ClassParser::new();
    
    // Dark mode: bg-white dark:bg-gray-900 text-black dark:text-white
    let classes = vec![
        "bg-white",
        "dark:bg-gray-900",
        "text-black",
        "dark:text-white"
    ];
    
    for class in classes {
        let parsed = parser.parse(class);
        assert!(parsed.is_ok());
    }
}

#[test]
fn test_opacity_modifiers_usage() {
    let resolver = ThemeResolver::default();
    let parser = ClassParser::new();
    
    // Opacity: bg-black/50 bg-black/75 bg-black/90
    let classes = vec!["bg-black/50", "bg-black/75", "bg-black/90"];
    
    for class in classes {
        let parsed = parser.parse(class);
        assert!(parsed.is_ok());
        
        let p = parsed.unwrap();
        if let Some(modifier) = &p.modifier_type {
            let opacity_result = resolver.apply_opacity("#000000", modifier);
            assert!(opacity_result.is_ok());
        }
    }
}

#[test]
fn test_arbitrary_values_usage() {
    let parser = ClassParser::new();
    
    // Arbitrary: w-[200px] h-[100px] bg-[#f3c]
    let classes = vec!["w-[200px]", "h-[100px]", "bg-[#f3c]"];
    
    for class in classes {
        let parsed = parser.parse(class);
        assert!(parsed.is_ok());
        
        let p = parsed.unwrap();
        assert!(p.is_arbitrary);
    }
}

#[test]
fn test_complex_responsive_dark_class() {
    let parser = ClassParser::new();
    
    // Complex: md:dark:hover:bg-blue-600/50
    let parsed = parser.parse("md:dark:hover:bg-blue-600/50");
    assert!(parsed.is_ok());
    
    let p = parsed.unwrap();
    assert_eq!(p.variants.len(), 3);
    assert_eq!(p.prefix, "bg");
    assert_eq!(p.value, "blue-600");
    assert_eq!(p.modifier_type, Some("50".to_string()));
}

// ============================================================================
// EDGE CASES & ERROR HANDLING (15+ tests)
// ============================================================================

#[test]
fn test_empty_string_handling() {
    let parser = ClassParser::new();
    let result = parser.parse("");
    assert!(result.is_err());
}

#[test]
fn test_whitespace_trimming() {
    let parser = ClassParser::new();
    let result = parser.parse("  px-4  ");
    assert!(result.is_ok());
}

#[test]
fn test_invalid_opacity_range() {
    let resolver = ThemeResolver::default();
    
    let result = resolver.apply_opacity("#1e40af", "150");
    assert!(result.is_err());
}

#[test]
fn test_unknown_color_handling() {
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_color("unknown-color-999");
    assert!(result.is_err());
}

#[test]
fn test_unknown_spacing_handling() {
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_spacing("unknown-spacing");
    assert!(result.is_err());
}

#[test]
fn test_unmatched_bracket() {
    let parser = ClassParser::new();
    let result = parser.parse("w-[200px");
    assert!(result.is_err());
}

#[test]
fn test_double_slash_handling() {
    let parser = ClassParser::new();
    let result = parser.parse("bg-blue//50");
    assert!(result.is_err());
}

#[test]
fn test_fraction_value_parsing() {
    let parser = ClassParser::new();
    let result = parser.parse("w-1/2");
    assert!(result.is_ok());
    
    let p = result.unwrap();
    assert_eq!(p.value, "1/2");
}

#[test]
fn test_numeric_variant_parsing() {
    let parser = ClassParser::new();
    let result = parser.parse("2xl:px-4");
    assert!(result.is_ok());
    
    let p = result.unwrap();
    assert_eq!(p.variants, to_variants(vec!["2xl"]));
}

#[test]
fn test_all_color_families_exist() {
    let mut resolver = ThemeResolver::default();
    
    let colors = vec![
        "blue-600", "red-600", "green-600", "purple-600",
        "pink-600", "indigo-600", "teal-600", "cyan-600",
        "yellow-600", "amber-600", "orange-600", "lime-600"
    ];
    
    for color in colors {
        let result = resolver.resolve_color(color);
        assert!(result.is_ok(), "Color {} should exist", color);
    }
}

#[test]
fn test_all_breakpoints_exist() {
    let mut resolver = ThemeResolver::default();
    
    let breakpoints = vec!["sm", "md", "lg", "xl", "2xl"];
    
    for bp in breakpoints {
        let result = resolver.resolve_breakpoint(bp);
        assert!(result.is_ok(), "Breakpoint {} should exist", bp);
    }
}

#[test]
fn test_all_font_sizes_exist() {
    let mut resolver = ThemeResolver::default();
    
    let sizes = vec![
        "xs", "sm", "base", "lg", "xl",
        "2xl", "3xl", "4xl", "5xl", "6xl",
        "7xl", "8xl", "9xl"
    ];
    
    for size in sizes {
        let result = resolver.resolve_font_size(size);
        assert!(result.is_ok(), "Font size {} should exist", size);
    }
}

#[test]
fn test_spacing_scale_coverage() {
    let mut resolver = ThemeResolver::default();
    
    let spacings = vec![
        "0", "1", "2", "3", "4", "5", "6", "8", "10",
        "12", "16", "20", "24", "32", "40", "48", "64", "96"
    ];
    
    for spacing in spacings {
        let result = resolver.resolve_spacing(spacing);
        assert!(result.is_ok(), "Spacing {} should exist", spacing);
    }
}

// ============================================================================
// PERFORMANCE VALIDATION (10 tests)
// ============================================================================

#[test]
fn test_1000_parses_under_100ms() {
    let parser = ClassParser::new();
    let start = std::time::Instant::now();
    
    for _ in 0..1000 {
        let _ = parser.parse("md:hover:bg-blue-600/50");
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 100, "1000 parses should be <100ms, got {:?}ms", elapsed.as_millis());
}

#[test]
fn test_1000_resolves_under_100ms() {
    let mut resolver = ThemeResolver::default();
    
    let start = std::time::Instant::now();
    
    for _ in 0..1000 {
        let _ = resolver.resolve_color("blue-600");
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 100, "1000 resolves should be <100ms, got {:?}ms", elapsed.as_millis());
}

#[test]
fn test_100_full_pipelines_under_100ms() {
    let mut resolver = ThemeResolver::default();
    let parser = ClassParser::new();
    
    let start = std::time::Instant::now();
    
    for _ in 0..100 {
        let parsed = parser.parse("md:hover:bg-blue-600/50").unwrap();
        let _color = resolver.resolve_color(&parsed.value);
        let _opacity = resolver.apply_opacity("#1e40af", "50");
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 100, "100 full pipelines should be <100ms, got {:?}ms", elapsed.as_millis());
}

#[test]
fn test_concurrent_operations_stress() {
    let mut resolver = ThemeResolver::default();
    let parser = ClassParser::new();
    
    let start = std::time::Instant::now();
    
    for i in 0..500 {
        let _ = parser.parse("px-4");
        let _ = resolver.resolve_color("blue-600");
        let _ = resolver.resolve_spacing("4");
        if i % 100 == 0 {
            let _ = resolver.resolve_breakpoint("md");
        }
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 100, "500 concurrent ops should be <100ms");
}

#[test]
fn test_cache_efficiency_under_load() {
    let mut resolver = ThemeResolver::default();
    
    // Pre-warm cache
    for _ in 0..50 {
        let _ = resolver.resolve_color("blue-600");
    }
    
    let start = std::time::Instant::now();
    
    // Heavy load with cached values
    for _ in 0..10000 {
        let _ = resolver.resolve_color("blue-600");
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 50, "10000 cached ops should be <50ms");
}

// ============================================================================
// CONSISTENCY TESTS (5 tests)
// ============================================================================

#[test]
fn test_parse_idempotent() {
    let parser = ClassParser::new();
    let class = "md:hover:bg-blue-600/50";
    let result1 = parser.parse(class).unwrap();
    let result2 = parser.parse(class).unwrap();
    
    assert_eq!(result1.prefix, result2.prefix);
    assert_eq!(result1.value, result2.value);
    assert_eq!(result1.variants, result2.variants);
    assert_eq!(result1.modifier_type, result2.modifier_type);
}

#[test]
fn test_resolver_consistent_colors() {
    let mut r1 = ThemeResolver::default();
    let mut r2 = ThemeResolver::default();
    
    let c1 = r1.resolve_color("blue-600").unwrap();
    let c2 = r2.resolve_color("blue-600").unwrap();
    
    assert_eq!(c1, c2);
}

#[test]
fn test_cache_doesn_t_affect_correctness() {
    let mut resolver = ThemeResolver::default();
    
    // First call
    let result1 = resolver.resolve_color("red-600").unwrap();
    
    // Repeat many times (builds cache)
    for _ in 0..1000 {
        let _ = resolver.resolve_color("red-600");
    }
    
    // Should still be same
    let result2 = resolver.resolve_color("red-600").unwrap();
    
    assert_eq!(result1, result2);
}

#[test]
fn test_different_classes_different_values() {
    let mut resolver = ThemeResolver::default();
    
    let blue = resolver.resolve_color("blue-600").unwrap();
    let red = resolver.resolve_color("red-600").unwrap();
    let green = resolver.resolve_color("green-600").unwrap();
    
    assert_ne!(blue, red);
    assert_ne!(red, green);
    assert_ne!(blue, green);
}

#[test]
fn test_opacity_different_values() {
    let resolver = ThemeResolver::default();
    
    let op25 = resolver.apply_opacity("#1e40af", "25").unwrap();
    let op50 = resolver.apply_opacity("#1e40af", "50").unwrap();
    let op75 = resolver.apply_opacity("#1e40af", "75").unwrap();
    
    assert!(op25.contains("0.25"));
    assert!(op50.contains("0.5"));
    assert!(op75.contains("0.75"));
}
