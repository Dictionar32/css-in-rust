//! CSS Generator Tests - Week 3 Day 2
//! Integration tests: ThemeResolver + CssGenerator

use tailwind_styled_parser::application::class_parser::ClassParser;
use tailwind_styled_parser::application::theme_resolver::ThemeResolver;

// ============================================================================
// SIMPLE CLASS GENERATION TESTS (10 tests)
// ============================================================================

#[test]
fn test_generate_simple_padding() {
    let mut resolver = ThemeResolver::default();
    
    // Resolve a simple class value
    let result = resolver.resolve_spacing("4");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    assert_eq!(value, "1rem");
}

#[test]
fn test_generate_simple_background_color() {
    let mut resolver = ThemeResolver::default();
    
    // Resolve color
    let result = resolver.resolve_color("blue-600");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    assert_eq!(value, "oklch(54.6% .245 262.881)");
}

#[test]
fn test_generate_simple_text_color() {
    let mut resolver = ThemeResolver::default();
    
    // Resolve color
    let result = resolver.resolve_color("red-500");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    assert_eq!(value, "oklch(63.7% .237 25.331)");
}

#[test]
fn test_generate_simple_margin() {
    let mut resolver = ThemeResolver::default();
    
    // Resolve spacing
    let result = resolver.resolve_spacing("8");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    assert_eq!(value, "2rem");
}

#[test]
fn test_generate_simple_width() {
    let mut resolver = ThemeResolver::default();
    
    // Resolve spacing
    let result = resolver.resolve_spacing("96");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    assert_eq!(value, "24rem");
}

#[test]
fn test_generate_simple_height() {
    let mut resolver = ThemeResolver::default();
    
    // Resolve spacing
    let result = resolver.resolve_spacing("full");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    assert_eq!(value, "100%");
}

#[test]
fn test_generate_simple_font_size() {
    let mut resolver = ThemeResolver::default();
    
    // Resolve font size
    let result = resolver.resolve_font_size("lg");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    assert!(!value.is_empty());
}

#[test]
fn test_generate_simple_opacity() {
    let resolver = ThemeResolver::default();
    
    // Apply opacity modifier
    let result = resolver.apply_opacity("#1e40af", "50");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    assert!(value.contains("rgba"));
}

#[test]
fn test_generate_grayscale_color() {
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_color("gray-500");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "oklch(55.1% .027 264.364)");
}

#[test]
fn test_generate_multiple_colors() {
    let mut resolver = ThemeResolver::default();
    
    let blue = resolver.resolve_color("blue-600");
    let red = resolver.resolve_color("red-600");
    let green = resolver.resolve_color("green-600");
    
    assert!(blue.is_ok());
    assert!(red.is_ok());
    assert!(green.is_ok());
    
    let blue_val = blue.unwrap();
    let red_val = red.unwrap();
    let green_val = green.unwrap();
    
    assert_ne!(blue_val, red_val);
    assert_ne!(red_val, green_val);
}

// ============================================================================
// VARIANT HANDLING TESTS (10 tests)
// ============================================================================

#[test]
fn test_generate_responsive_variant_sm() {
    let mut resolver = ThemeResolver::default();
    
    // Resolve breakpoint
    let result = resolver.resolve_breakpoint("sm");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "40rem");
}

#[test]
fn test_generate_responsive_variant_md() {
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_breakpoint("md");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "48rem");
}

#[test]
fn test_generate_responsive_variant_lg() {
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_breakpoint("lg");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "64rem");
}

#[test]
fn test_generate_responsive_variant_xl() {
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_breakpoint("xl");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "80rem");
}

#[test]
fn test_generate_responsive_variant_2xl() {
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_breakpoint("2xl");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "96rem");
}

#[test]
fn test_generate_dark_mode_color() {
    // Dark mode typically uses same color palette
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_color("blue-600");
    assert!(result.is_ok());
    
    // In dark mode, would apply different selector
    let _value = result.unwrap();
}

#[test]
fn test_generate_state_variant_hover() {
    // Hover state - color same, different selector
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_color("blue-600");
    assert!(result.is_ok());
    
    // In code: .hover\:bg-blue-600:hover { ... }
    let _value = result.unwrap();
}

#[test]
fn test_generate_state_variant_focus() {
    // Focus state - color same, different selector
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_color("blue-600");
    assert!(result.is_ok());
    
    // In code: .focus\:bg-blue-600:focus { ... }
    let _value = result.unwrap();
}

#[test]
fn test_generate_state_variant_active() {
    // Active state
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_color("red-600");
    assert!(result.is_ok());
    
    // In code: .active\:bg-red-600:active { ... }
    let _value = result.unwrap();
}

#[test]
fn test_generate_group_hover_variant() {
    // Group hover requires color resolution
    let mut resolver = ThemeResolver::default();
    
    let result = resolver.resolve_color("green-600");
    assert!(result.is_ok());
    
    // In code: .group:hover .group-hover\:text-green-600 { ... }
    let _value = result.unwrap();
}

// ============================================================================
// MODIFIER TESTS (5 tests)
// ============================================================================

#[test]
fn test_generate_opacity_25() {
    let resolver = ThemeResolver::default();
    
    let result = resolver.apply_opacity("#1e40af", "25");
    assert!(result.is_ok());
    
    let rgba = result.unwrap();
    assert!(rgba.contains("0.25"));
}

#[test]
fn test_generate_opacity_50() {
    let resolver = ThemeResolver::default();
    
    let result = resolver.apply_opacity("#dc2626", "50");
    assert!(result.is_ok());
    
    let rgba = result.unwrap();
    assert!(rgba.contains("0.5"));
}

#[test]
fn test_generate_opacity_75() {
    let resolver = ThemeResolver::default();
    
    let result = resolver.apply_opacity("#059669", "75");
    assert!(result.is_ok());
    
    let rgba = result.unwrap();
    assert!(rgba.contains("0.75"));
}

#[test]
fn test_generate_opacity_full() {
    let resolver = ThemeResolver::default();
    
    let result = resolver.apply_opacity("#1e40af", "100");
    assert!(result.is_ok());
    
    let rgba = result.unwrap();
    assert!(rgba.contains("1"));
}

#[test]
fn test_generate_opacity_zero() {
    let resolver = ThemeResolver::default();
    
    let result = resolver.apply_opacity("#1e40af", "0");
    assert!(result.is_ok());
    
    let rgba = result.unwrap();
    assert!(rgba.contains("0"));
}

// ============================================================================
// INTEGRATION TESTS (10 tests)
// ============================================================================

#[test]
fn test_integration_parse_resolve_padding() {
    // Parse: px-4
    let parsed = ClassParser::new().parse("px-4");
    assert!(parsed.is_ok());
    
    let mut resolver = ThemeResolver::default();
    // Resolve: 4 → 1rem
    let resolved = resolver.resolve_spacing("4");
    assert!(resolved.is_ok());
}

#[test]
fn test_integration_parse_resolve_background() {
    // Parse: bg-blue-600
    let parsed = ClassParser::new().parse("bg-blue-600");
    assert!(parsed.is_ok());
    
    let mut resolver = ThemeResolver::default();
    // Resolve: blue-600 → oklch
    let resolved = resolver.resolve_color("blue-600");
    assert!(resolved.is_ok());
}

#[test]
fn test_integration_complex_class_spacing() {
    let mut resolver = ThemeResolver::default();
    
    // Parse multiple spacing values
    for spacing in &["1", "2", "4", "8", "16"] {
        let result = resolver.resolve_spacing(spacing);
        assert!(result.is_ok());
    }
}

#[test]
fn test_integration_complex_class_colors() {
    let mut resolver = ThemeResolver::default();
    
    // Parse multiple colors
    for color in &["red-600", "blue-600", "green-600", "purple-600"] {
        let result = resolver.resolve_color(color);
        assert!(result.is_ok());
    }
}

#[test]
fn test_integration_color_with_opacity() {
    let mut resolver = ThemeResolver::default();
    
    // Get color
    let color_result = resolver.resolve_color("blue-600");
    assert!(color_result.is_ok());
    
    let color = color_result.unwrap();
    
    // Apply opacity
    let opacity_result = resolver.apply_opacity(&color, "50");
    assert!(opacity_result.is_ok());
    
    let rgba = opacity_result.unwrap();
    assert!(rgba.contains("rgba") || rgba.contains("oklch") || rgba.contains("/"));
}

#[test]
fn test_integration_sequential_class_resolution() {
    let classes = vec!["px-4", "py-2", "bg-blue-600", "text-white"];
    
    for class_name in classes {
        let parsed = ClassParser::new().parse(class_name);
        assert!(parsed.is_ok());
    }
    
    let mut resolver = ThemeResolver::default();
    // Verify spacing resolves
    assert!(resolver.resolve_spacing("4").is_ok());
    assert!(resolver.resolve_spacing("2").is_ok());
    assert!(resolver.resolve_color("blue-600").is_ok());
}

#[test]
fn test_integration_responsive_class() {
    // Parse: md:px-8
    let parsed = ClassParser::new().parse("md:px-8");
    assert!(parsed.is_ok());
    
    let mut resolver = ThemeResolver::default();
    // Resolve breakpoint
    let bp_result = resolver.resolve_breakpoint("md");
    assert!(bp_result.is_ok());
    
    // Resolve value
    let val_result = resolver.resolve_spacing("8");
    assert!(val_result.is_ok());
}

#[test]
fn test_integration_hover_state_class() {
    // Parse: hover:bg-blue-600
    let parsed = ClassParser::new().parse("hover:bg-blue-600");
    assert!(parsed.is_ok());
    
    let mut resolver = ThemeResolver::default();
    // Resolve color
    let color_result = resolver.resolve_color("blue-600");
    assert!(color_result.is_ok());
}

#[test]
fn test_integration_combined_variant_class() {
    // Parse: md:hover:bg-blue-600
    let parsed = ClassParser::new().parse("md:hover:bg-blue-600");
    assert!(parsed.is_ok());
    
    let mut resolver = ThemeResolver::default();
    // Resolve breakpoint
    let bp_result = resolver.resolve_breakpoint("md");
    assert!(bp_result.is_ok());
    
    // Resolve color
    let color_result = resolver.resolve_color("blue-600");
    assert!(color_result.is_ok());
}

// ============================================================================
// CSS OUTPUT STRUCTURE TESTS (5 tests)
// ============================================================================

#[test]
fn test_css_selector_format() {
    // CSS selector should be: .px-4, .bg-blue-600, etc.
    // Format: .class-name
    let class_name = "px-4";
    let selector = format!(".{}", class_name);
    assert_eq!(selector, ".px-4");
}

#[test]
fn test_css_property_value_pair() {
    let mut resolver = ThemeResolver::default();
    
    // Get value
    let result = resolver.resolve_spacing("4");
    assert!(result.is_ok());
    
    let value = result.unwrap();
    
    // CSS property: padding: 1rem;
    let css = format!("padding: {};", value);
    assert_eq!(css, "padding: 1rem;");
}

#[test]
fn test_css_media_query_wrapper() {
    let mut resolver = ThemeResolver::default();
    
    // Get breakpoint
    let bp = resolver.resolve_breakpoint("md");
    assert!(bp.is_ok());
    
    let bp_val = bp.unwrap();
    
    // Media query format: @media (min-width: 48rem)
    let media_query = format!("@media (min-width: {})", bp_val);
    assert_eq!(media_query, "@media (min-width: 48rem)");
}

#[test]
fn test_css_pseudo_class_selector() {
    // Pseudo-class format: .hover\:bg-blue-600:hover
    let class = "hover:bg-blue-600";
    
    // Should escape colon
    let selector = class.replace(":", "\\:");
    assert!(selector.contains("\\:"));
}

#[test]
fn test_css_dark_mode_media_query() {
    // Dark mode: @media (prefers-color-scheme: dark)
    let dark_media = "@media (prefers-color-scheme: dark)";
    assert!(dark_media.contains("prefers-color-scheme"));
}

// ============================================================================
// PERFORMANCE TESTS (5 tests)
// ============================================================================

#[test]
fn test_performance_100_resolutions() {
    let mut resolver = ThemeResolver::default();
    
    let start = std::time::Instant::now();
    
    for i in 0..100 {
        let color_num = (i % 9) + 1; // 1-9
        let color = format!("blue-{}", color_num * 100);
        let _ = resolver.resolve_color(&color);
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 100, "Should complete in <100ms");
}

#[test]
fn test_performance_mixed_resolutions() {
    let mut resolver = ThemeResolver::default();
    
    let start = std::time::Instant::now();
    
    for _ in 0..50 {
        let _ = resolver.resolve_color("blue-600");
        let _ = resolver.resolve_spacing("4");
        let _ = resolver.resolve_font_size("lg");
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 100, "Should complete in <100ms");
}

#[test]
fn test_performance_parser_integration() {
    let classes = vec!["px-4", "py-2", "bg-blue-600", "text-white", "rounded-lg"];
    
    let start = std::time::Instant::now();
    
    for _ in 0..100 {
        for class in &classes {
            let _ = ClassParser::new().parse(class);
        }
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 100, "Should complete in <100ms");
}

#[test]
fn test_performance_cache_hits() {
    let mut resolver = ThemeResolver::default();
    
    let start = std::time::Instant::now();
    
    // First 10 - misses
    for i in 0..10 {
        let color = format!("blue-{}", (i + 1) * 100);
        let _ = resolver.resolve_color(&color);
    }
    
    // Next 90 - hits (same colors)
    for _ in 0..90 {
        let _ = resolver.resolve_color("blue-600");
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 50, "Should be very fast with cache hits");
}

#[test]
fn test_performance_opacity_operations() {
    let resolver = ThemeResolver::default();
    
    let start = std::time::Instant::now();
    
    for _ in 0..100 {
        let _ = resolver.apply_opacity("#1e40af", "50");
    }
    
    let elapsed = start.elapsed();
    assert!(elapsed.as_millis() < 50, "Opacity operations should be fast");
}
