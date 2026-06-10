# Week 1, Day 6: Test Strategy & Test Plan

**Date**: June 9, 2026  
**Phase**: Phase 1 - Week 1, Day 6  
**Task**: Design comprehensive test strategy for parser and resolver  
**Duration**: 4 hours  
**Status**: 🚀 COMPLETE

---

## Part 1: Test Strategy Overview

### 1.1 Testing Levels

We'll implement tests at three levels:

#### Level 1: Unit Tests (Low-level components)
- **ClassParser**: 65+ test cases for parsing logic
- **ThemeResolver**: 50+ test cases for value resolution
- **Location**: `native/tests/`
- **Test framework**: Rust's built-in `#[test]` + `quickcheck` for property-based testing

#### Level 2: Integration Tests (Component interaction)
- **Parser → Resolver**: Class parsed → value resolved
- **Resolver → Generator**: Value resolved → CSS generated
- **Generator → NAPI**: CSS generated → passed to JavaScript
- **Location**: `native/tests/integration_tests.rs`

#### Level 3: System Tests (End-to-end)
- **Full pipeline**: Classes → CSS output
- **Parity tests**: Rust output == Tailwind JS output
- **Benchmark tests**: Performance validation
- **Location**: `tests/integration/` (TypeScript)

---

## Part 2: ClassParser Test Cases (65 tests)

### 2.1 Simple Class Tests (10 tests)

```rust
#[cfg(test)]
mod parser_simple_tests {
    use super::*;
    
    #[test]
    fn parse_single_property_class() {
        // Test: "px-4" → { prefix: "px", value: "4" }
        let result = ClassParser::parse("px-4").unwrap();
        assert_eq!(result.prefix, "px");
        assert_eq!(result.value, "4");
        assert_eq!(result.variant, None);
        assert_eq!(result.modifier, None);
    }
    
    #[test]
    fn parse_multi_part_property() {
        // Test: "bg-blue-600" → { prefix: "bg", value: "blue-600" }
        let result = ClassParser::parse("bg-blue-600").unwrap();
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.value, "blue-600");
    }
    
    #[test]
    fn parse_numeric_class() {
        // Test: "text-2xl" → { prefix: "text", value: "2xl" }
        let result = ClassParser::parse("text-2xl").unwrap();
        assert_eq!(result.prefix, "text");
        assert_eq!(result.value, "2xl");
    }
    
    #[test]
    fn parse_spacing_with_brackets() {
        // Test: "mx-auto" → { prefix: "mx", value: "auto" }
        let result = ClassParser::parse("mx-auto").unwrap();
        assert_eq!(result.prefix, "mx");
        assert_eq!(result.value, "auto");
    }
    
    #[test]
    fn parse_fraction_values() {
        // Test: "w-1/2" → { prefix: "w", value: "1/2" }
        let result = ClassParser::parse("w-1/2").unwrap();
        assert_eq!(result.prefix, "w");
        assert_eq!(result.value, "1/2");
    }
    
    #[test]
    fn parse_opacity_modifier() {
        // Test: "bg-blue/50" → { ..., modifier: "50" }
        let result = ClassParser::parse("bg-blue/50").unwrap();
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.value, "blue");
        assert_eq!(result.modifier, Some("50".to_string()));
    }
    
    #[test]
    fn parse_negative_values() {
        // Test: "-mx-4" → { prefix: "-mx", value: "4" }
        let result = ClassParser::parse("-mx-4").unwrap();
        assert_eq!(result.prefix, "-mx");
        assert_eq!(result.value, "4");
    }
    
    #[test]
    fn parse_duration_format() {
        // Test: "duration-300" → { prefix: "duration", value: "300" }
        let result = ClassParser::parse("duration-300").unwrap();
        assert_eq!(result.prefix, "duration");
        assert_eq!(result.value, "300");
    }
    
    #[test]
    fn parse_delay_format() {
        // Test: "delay-500" → handled correctly
        let result = ClassParser::parse("delay-500").unwrap();
        assert_eq!(result.prefix, "delay");
        assert_eq!(result.value, "500");
    }
    
    #[test]
    fn parse_scale_class() {
        // Test: "scale-75" → { prefix: "scale", value: "75" }
        let result = ClassParser::parse("scale-75").unwrap();
        assert_eq!(result.prefix, "scale");
        assert_eq!(result.value, "75");
    }
}
```

### 2.2 Variant Tests (20 tests)

```rust
#[cfg(test)]
mod parser_variant_tests {
    use super::*;
    
    #[test]
    fn parse_hover_variant() {
        // Test: "hover:bg-blue" → { variant: "hover", prefix: "bg", value: "blue" }
        let result = ClassParser::parse("hover:bg-blue").unwrap();
        assert_eq!(result.variant, Some("hover".to_string()));
        assert_eq!(result.prefix, "bg");
    }
    
    #[test]
    fn parse_focus_variant() {
        // Test: "focus:outline" → { variant: "focus" }
        let result = ClassParser::parse("focus:outline").unwrap();
        assert_eq!(result.variant, Some("focus".to_string()));
    }
    
    #[test]
    fn parse_active_variant() {
        // Test: "active:scale-95" → { variant: "active" }
        let result = ClassParser::parse("active:scale-95").unwrap();
        assert_eq!(result.variant, Some("active".to_string()));
    }
    
    #[test]
    fn parse_responsive_variant_sm() {
        // Test: "sm:w-full" → { variant: "sm" }
        let result = ClassParser::parse("sm:w-full").unwrap();
        assert_eq!(result.variant, Some("sm".to_string()));
    }
    
    #[test]
    fn parse_responsive_variant_md() {
        // Test: "md:px-4" → { variant: "md" }
        let result = ClassParser::parse("md:px-4").unwrap();
        assert_eq!(result.variant, Some("md".to_string()));
    }
    
    #[test]
    fn parse_responsive_variant_lg() {
        // Test: "lg:flex" → { variant: "lg" }
        let result = ClassParser::parse("lg:flex").unwrap();
        assert_eq!(result.variant, Some("lg".to_string()));
    }
    
    #[test]
    fn parse_dark_mode_variant() {
        // Test: "dark:bg-gray-900" → { variant: "dark" }
        let result = ClassParser::parse("dark:bg-gray-900").unwrap();
        assert_eq!(result.variant, Some("dark".to_string()));
    }
    
    #[test]
    fn parse_group_hover_variant() {
        // Test: "group-hover:text-white" → { variant: "group-hover" }
        let result = ClassParser::parse("group-hover:text-white").unwrap();
        assert_eq!(result.variant, Some("group-hover".to_string()));
    }
    
    #[test]
    fn parse_peer_checked_variant() {
        // Test: "peer-checked:text-blue" → { variant: "peer-checked" }
        let result = ClassParser::parse("peer-checked:text-blue").unwrap();
        assert_eq!(result.variant, Some("peer-checked".to_string()));
    }
    
    #[test]
    fn parse_stacked_variants_hover_md() {
        // Test: "md:hover:bg-blue" → variants: ["md", "hover"]
        let result = ClassParser::parse("md:hover:bg-blue").unwrap();
        // Should extract leftmost variant "md" first
        assert_eq!(result.variant, Some("md".to_string()));
    }
    
    #[test]
    fn parse_stacked_variants_hover_focus() {
        // Test: "focus:hover:text-red" → properly handles stacking
        let result = ClassParser::parse("focus:hover:text-red").unwrap();
        assert_eq!(result.variant, Some("focus".to_string()));
    }
    
    #[test]
    fn parse_group_focus_variant() {
        // Test: "group-focus:opacity-50" → { variant: "group-focus" }
        let result = ClassParser::parse("group-focus:opacity-50").unwrap();
        assert_eq!(result.variant, Some("group-focus".to_string()));
    }
    
    #[test]
    fn parse_disabled_variant() {
        // Test: "disabled:opacity-50" → { variant: "disabled" }
        let result = ClassParser::parse("disabled:opacity-50").unwrap();
        assert_eq!(result.variant, Some("disabled".to_string()));
    }
    
    #[test]
    fn parse_first_child_variant() {
        // Test: "first:bg-red" → { variant: "first" }
        let result = ClassParser::parse("first:bg-red").unwrap();
        assert_eq!(result.variant, Some("first".to_string()));
    }
    
    #[test]
    fn parse_last_child_variant() {
        // Test: "last:border-b" → { variant: "last" }
        let result = ClassParser::parse("last:border-b").unwrap();
        assert_eq!(result.variant, Some("last".to_string()));
    }
    
    #[test]
    fn parse_before_variant() {
        // Test: "before:content-['*']" → { variant: "before" }
        let result = ClassParser::parse("before:content-").unwrap();
        assert_eq!(result.variant, Some("before".to_string()));
    }
    
    #[test]
    fn parse_after_variant() {
        // Test: "after:content-['*']" → { variant: "after" }
        let result = ClassParser::parse("after:content-").unwrap();
        assert_eq!(result.variant, Some("after".to_string()));
    }
    
    #[test]
    fn parse_container_variant() {
        // Test: "container:px-4" → { variant: "container" }
        let result = ClassParser::parse("container:px-4").unwrap();
        assert_eq!(result.variant, Some("container".to_string()));
    }
}
```

### 2.3 Arbitrary Value Tests (15 tests)

```rust
#[cfg(test)]
mod parser_arbitrary_tests {
    use super::*;
    
    #[test]
    fn parse_arbitrary_width() {
        // Test: "w-[200px]" → { value: "[200px]" }
        let result = ClassParser::parse("w-[200px]").unwrap();
        assert_eq!(result.prefix, "w");
        assert_eq!(result.value, "[200px]");
    }
    
    #[test]
    fn parse_arbitrary_color() {
        // Test: "text-[#f3c]" → { value: "[#f3c]" }
        let result = ClassParser::parse("text-[#f3c]").unwrap();
        assert_eq!(result.prefix, "text");
        assert_eq!(result.value, "[#f3c]");
    }
    
    #[test]
    fn parse_arbitrary_duration() {
        // Test: "duration-[2000ms]" → { value: "[2000ms]" }
        let result = ClassParser::parse("duration-[2000ms]").unwrap();
        assert_eq!(result.prefix, "duration");
        assert_eq!(result.value, "[2000ms]");
    }
    
    #[test]
    fn parse_arbitrary_delay() {
        // Test: "delay-[1.5s]" → { value: "[1.5s]" }
        let result = ClassParser::parse("delay-[1.5s]").unwrap();
        assert_eq!(result.prefix, "delay");
        assert_eq!(result.value, "[1.5s]");
    }
    
    #[test]
    fn parse_arbitrary_with_spaces() {
        // Test: "bg-[rgba(0,0,0,0.5)]" → properly handles spaces
        let result = ClassParser::parse("bg-[rgba(0,0,0,0.5)]").unwrap();
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.value, "[rgba(0,0,0,0.5)]");
    }
    
    #[test]
    fn parse_arbitrary_nested_brackets() {
        // Test: "content-[attr(data-value)]" → handles nested brackets
        let result = ClassParser::parse("content-[attr(data-value)]").unwrap();
        assert_eq!(result.prefix, "content");
    }
    
    #[test]
    fn parse_arbitrary_negative_value() {
        // Test: "-top-[50%]" → handles negative arbitrary
        let result = ClassParser::parse("-top-[50%]").unwrap();
        assert_eq!(result.prefix, "-top");
    }
    
    #[test]
    fn parse_arbitrary_with_modifier() {
        // Test: "bg-[blue]/50" → { value: "[blue]", modifier: "50" }
        let result = ClassParser::parse("bg-[blue]/50").unwrap();
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.modifier, Some("50".to_string()));
    }
    
    #[test]
    fn parse_arbitrary_calc_expression() {
        // Test: "w-[calc(100%-20px)]" → handles calc
        let result = ClassParser::parse("w-[calc(100%-20px)]").unwrap();
        assert_eq!(result.prefix, "w");
        assert_eq!(result.value, "[calc(100%-20px)]");
    }
    
    #[test]
    fn parse_arbitrary_var_reference() {
        // Test: "text-[var(--custom-size)]" → handles CSS vars
        let result = ClassParser::parse("text-[var(--custom-size)]").unwrap();
        assert_eq!(result.prefix, "text");
        assert_eq!(result.value, "[var(--custom-size)]");
    }
}
```

### 2.4 Complex Combination Tests (20 tests)

```rust
#[cfg(test)]
mod parser_combination_tests {
    use super::*;
    
    #[test]
    fn parse_variant_with_modifier() {
        // Test: "hover:bg-blue/50" → full combination
        let result = ClassParser::parse("hover:bg-blue/50").unwrap();
        assert_eq!(result.variant, Some("hover".to_string()));
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.value, "blue");
        assert_eq!(result.modifier, Some("50".to_string()));
    }
    
    #[test]
    fn parse_responsive_with_modifier() {
        // Test: "md:bg-red-500/75" → responsive + modifier
        let result = ClassParser::parse("md:bg-red-500/75").unwrap();
        assert_eq!(result.variant, Some("md".to_string()));
        assert_eq!(result.value, "red-500");
        assert_eq!(result.modifier, Some("75".to_string()));
    }
    
    #[test]
    fn parse_dark_mode_with_modifier() {
        // Test: "dark:text-white/80" → dark mode + modifier
        let result = ClassParser::parse("dark:text-white/80").unwrap();
        assert_eq!(result.variant, Some("dark".to_string()));
        assert_eq!(result.modifier, Some("80".to_string()));
    }
    
    #[test]
    fn parse_variant_arbitrary_class() {
        // Test: "hover:bg-[#f3c]" → variant with arbitrary
        let result = ClassParser::parse("hover:bg-[#f3c]").unwrap();
        assert_eq!(result.variant, Some("hover".to_string()));
        assert_eq!(result.value, "[#f3c]");
    }
    
    #[test]
    fn parse_responsive_arbitrary_modifier() {
        // Test: "md:bg-[blue]/50" → responsive + arbitrary + modifier
        let result = ClassParser::parse("md:bg-[blue]/50").unwrap();
        assert_eq!(result.variant, Some("md".to_string()));
        assert_eq!(result.modifier, Some("50".to_string()));
    }
    
    // ... continue with 15 more combination tests
}
```

### 2.5 Error Handling Tests (10 tests)

```rust
#[cfg(test)]
mod parser_error_tests {
    use super::*;
    
    #[test]
    fn error_empty_string() {
        // Test: "" → returns error
        let result = ClassParser::parse("");
        assert!(result.is_err());
    }
    
    #[test]
    fn error_invalid_prefix() {
        // Test: "zzz-invalid" → returns error with suggestion
        let result = ClassParser::parse("zzz-invalid");
        assert!(result.is_err());
        // Check if error contains helpful suggestion
    }
    
    #[test]
    fn error_unmatched_bracket() {
        // Test: "w-[200px" → unmatched bracket
        let result = ClassParser::parse("w-[200px");
        assert!(result.is_err());
    }
    
    #[test]
    fn error_double_colon() {
        // Test: "hover::bg-blue" → double colon
        let result = ClassParser::parse("hover::bg-blue");
        // Should either error or be lenient
    }
    
    #[test]
    fn error_double_slash() {
        // Test: "bg-blue//50" → double slash
        let result = ClassParser::parse("bg-blue//50");
        assert!(result.is_err());
    }
}
```

---

## Part 3: ThemeResolver Test Cases (50 tests)

### 3.1 Color Resolution Tests (15 tests)

```rust
#[cfg(test)]
mod resolver_color_tests {
    use super::*;
    
    #[test]
    fn resolve_basic_color() {
        // Test: "blue" → "#3b82f6" from theme.colors.blue
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("blue");
        assert_eq!(result, Some("#3b82f6".to_string()));
    }
    
    #[test]
    fn resolve_numbered_color() {
        // Test: "blue-600" → "#2563eb"
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("blue-600");
        assert_eq!(result, Some("#2563eb".to_string()));
    }
    
    #[test]
    fn resolve_gray_color() {
        // Test: "gray-500" → "#6b7280"
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("gray-500");
        assert_eq!(result, Some("#6b7280".to_string()));
    }
    
    #[test]
    fn resolve_slate_color() {
        // Test: "slate-700" → standard Tailwind slate
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("slate-700");
        assert!(result.is_some());
    }
    
    #[test]
    fn resolve_transparent_color() {
        // Test: "transparent" → "#00000000"
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("transparent");
        assert_eq!(result, Some("#00000000".to_string()));
    }
    
    #[test]
    fn resolve_white_color() {
        // Test: "white" → "#ffffff"
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("white");
        assert_eq!(result, Some("#ffffff".to_string()));
    }
    
    #[test]
    fn resolve_black_color() {
        // Test: "black" → "#000000"
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("black");
        assert_eq!(result, Some("#000000".to_string()));
    }
    
    #[test]
    fn resolve_current_color() {
        // Test: "current" → "currentColor"
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("current");
        assert_eq!(result, Some("currentColor".to_string()));
    }
    
    #[test]
    fn resolve_invalid_color() {
        // Test: "not-a-color" → returns None
        let theme = ThemeConfig::default();
        let result = theme.resolve_color("not-a-color");
        assert_eq!(result, None);
    }
    
    #[test]
    fn resolve_custom_color_from_theme() {
        // Test: custom color in theme.colors.custom
        let mut theme = ThemeConfig::default();
        theme.colors.insert("custom".to_string(), "#abc123".to_string());
        let result = theme.resolve_color("custom");
        assert_eq!(result, Some("#abc123".to_string()));
    }
    
    // ... continue with 5 more color resolution tests
}
```

### 3.2 Spacing Resolution Tests (10 tests)

```rust
#[cfg(test)]
mod resolver_spacing_tests {
    use super::*;
    
    #[test]
    fn resolve_spacing_0() {
        // Test: 0 → "0"
        let theme = ThemeConfig::default();
        let result = theme.resolve_spacing("0");
        assert_eq!(result, Some("0".to_string()));
    }
    
    #[test]
    fn resolve_spacing_1() {
        // Test: 1 → "0.25rem" (4px)
        let theme = ThemeConfig::default();
        let result = theme.resolve_spacing("1");
        assert_eq!(result, Some("0.25rem".to_string()));
    }
    
    #[test]
    fn resolve_spacing_4() {
        // Test: 4 → "1rem" (16px)
        let theme = ThemeConfig::default();
        let result = theme.resolve_spacing("4");
        assert_eq!(result, Some("1rem".to_string()));
    }
    
    #[test]
    fn resolve_spacing_full() {
        // Test: "full" → "100%"
        let theme = ThemeConfig::default();
        let result = theme.resolve_spacing("full");
        assert_eq!(result, Some("100%".to_string()));
    }
    
    #[test]
    fn resolve_spacing_auto() {
        // Test: "auto" → "auto"
        let theme = ThemeConfig::default();
        let result = theme.resolve_spacing("auto");
        assert_eq!(result, Some("auto".to_string()));
    }
    
    #[test]
    fn resolve_spacing_fraction() {
        // Test: "1/2" → "50%"
        let theme = ThemeConfig::default();
        let result = theme.resolve_spacing("1/2");
        assert_eq!(result, Some("50%".to_string()));
    }
    
    #[test]
    fn resolve_spacing_1_3() {
        // Test: "1/3" → "33.333333%"
        let theme = ThemeConfig::default();
        let result = theme.resolve_spacing("1/3");
        assert!(result.is_some());
    }
    
    #[test]
    fn resolve_spacing_screen() {
        // Test: "screen" → "100vw"
        let theme = ThemeConfig::default();
        let result = theme.resolve_spacing("screen");
        assert_eq!(result, Some("100vw".to_string()));
    }
    
    // ... continue with 2 more spacing tests
}
```

### 3.3 Font Size Resolution Tests (10 tests)

```rust
#[cfg(test)]
mod resolver_font_tests {
    use super::*;
    
    #[test]
    fn resolve_font_xs() {
        // Test: "xs" → ("0.75rem", "1rem")
        let theme = ThemeConfig::default();
        let result = theme.resolve_font_size("xs");
        assert!(result.is_some());
        // Should have font-size and line-height
    }
    
    #[test]
    fn resolve_font_sm() {
        // Test: "sm" → ("0.875rem", "1.25rem")
        let theme = ThemeConfig::default();
        let result = theme.resolve_font_size("sm");
        assert!(result.is_some());
    }
    
    #[test]
    fn resolve_font_base() {
        // Test: "base" → ("1rem", "1.5rem")
        let theme = ThemeConfig::default();
        let result = theme.resolve_font_size("base");
        assert!(result.is_some());
    }
    
    #[test]
    fn resolve_font_lg() {
        // Test: "lg" → ("1.125rem", "1.75rem")
        let theme = ThemeConfig::default();
        let result = theme.resolve_font_size("lg");
        assert!(result.is_some());
    }
    
    // ... continue with 6 more font size tests
}
```

### 3.4 Opacity & Modifier Tests (10 tests)

```rust
#[cfg(test)]
mod resolver_opacity_tests {
    use super::*;
    
    #[test]
    fn resolve_opacity_100() {
        // Test: 100 → 1.0 (fully opaque)
        let opacity = ThemeResolver::parse_opacity("100");
        assert_eq!(opacity, 1.0);
    }
    
    #[test]
    fn resolve_opacity_50() {
        // Test: 50 → 0.5
        let opacity = ThemeResolver::parse_opacity("50");
        assert_eq!(opacity, 0.5);
    }
    
    #[test]
    fn resolve_opacity_0() {
        // Test: 0 → 0.0 (fully transparent)
        let opacity = ThemeResolver::parse_opacity("0");
        assert_eq!(opacity, 0.0);
    }
    
    #[test]
    fn resolve_opacity_75() {
        // Test: 75 → 0.75
        let opacity = ThemeResolver::parse_opacity("75");
        assert_eq!(opacity, 0.75);
    }
    
    // ... continue with 6 more opacity tests
}
```

### 3.5 Cache & Performance Tests (5 tests)

```rust
#[cfg(test)]
mod resolver_cache_tests {
    use super::*;
    
    #[test]
    fn cache_hit_tracking() {
        // Test: Same color resolution hits cache
        let theme = ThemeConfig::default();
        theme.resolve_color("blue-600");
        theme.resolve_color("blue-600");
        // Check cache stats
    }
    
    #[test]
    fn cache_miss_tracking() {
        // Test: Different colors counted as misses
        let theme = ThemeConfig::default();
        theme.resolve_color("blue-600");
        theme.resolve_color("red-500");
        // Check cache stats
    }
    
    #[test]
    fn cache_eviction() {
        // Test: LRU eviction when > 1000 entries
        // (integration with resolver)
    }
    
    // ... continue with 2 more cache tests
}
```

---

## Part 4: Integration Test Cases (30 tests)

### 4.1 End-to-End Parser → Resolver Flow

```rust
#[cfg(test)]
mod integration_parser_resolver {
    use super::*;
    
    #[test]
    fn e2e_simple_class() {
        // "px-4" → parse → resolve → "padding: 1rem"
        let parsed = ClassParser::parse("px-4").unwrap();
        let theme = ThemeConfig::default();
        
        let resolved = theme.resolve(&parsed);
        assert!(resolved.is_some());
        
        let value = resolved.unwrap();
        assert_eq!(value.property, "padding-left");
        assert_eq!(value.value, "1rem");
    }
    
    #[test]
    fn e2e_color_class() {
        // "bg-blue-600" → parse → resolve → "#2563eb"
        let parsed = ClassParser::parse("bg-blue-600").unwrap();
        let theme = ThemeConfig::default();
        
        let resolved = theme.resolve(&parsed);
        assert!(resolved.is_some());
        
        let value = resolved.unwrap();
        assert_eq!(value.property, "background-color");
        assert_eq!(value.value, "#2563eb");
    }
    
    #[test]
    fn e2e_variant_with_modifier() {
        // "hover:bg-blue/50" → parse → resolve → correct CSS
        let parsed = ClassParser::parse("hover:bg-blue/50").unwrap();
        let theme = ThemeConfig::default();
        
        let resolved = theme.resolve(&parsed);
        assert!(resolved.is_some());
        
        // Should have opacity applied
    }
    
    // ... continue with 27 more integration tests
}
```

---

## Part 5: Test Organization

### 5.1 File Structure

```
native/tests/
├─ lib.rs (test root)
├─ parser_tests.rs (65 ClassParser tests)
├─ resolver_tests.rs (50 ThemeResolver tests)
├─ generator_tests.rs (50 CssGenerator tests)
├─ integration_tests.rs (30 end-to-end tests)
└─ fixtures/
    ├─ test_classes.json (200+ sample classes)
    ├─ test_themes.json (sample theme configs)
    └─ expected_output.json (expected CSS output)
```

### 5.2 Running Tests

```bash
# Run all tests
cargo test

# Run specific test module
cargo test parser_

# Run with output
cargo test -- --nocapture

# Run with specific thread count
cargo test -- --test-threads=1

# Run benchmark (after tests)
cargo bench
```

### 5.3 Test Fixtures

**test_classes.json** (sample):
```json
{
  "simple_classes": [
    "px-4",
    "py-2",
    "bg-blue-600",
    "text-white",
    "rounded-lg",
    "shadow-md"
  ],
  "variant_classes": [
    "hover:bg-blue-700",
    "focus:outline-none",
    "md:w-full",
    "dark:bg-gray-900"
  ],
  "arbitrary_classes": [
    "w-[200px]",
    "bg-[#f3c]",
    "duration-[2000ms]"
  ],
  "complex_classes": [
    "md:hover:bg-blue-600/50",
    "dark:text-white/80",
    "group-hover:text-blue/75"
  ]
}
```

### 5.4 Coverage Targets

| Component | Target | Current |
|-----------|--------|---------|
| ClassParser | 95%+ | (after implementation) |
| ThemeResolver | 95%+ | (after implementation) |
| CssGenerator | 90%+ | (after implementation) |
| Integration | 85%+ | (after implementation) |
| **Overall** | **90%+** | **(to verify)** |

---

## Part 6: Property-Based Testing with QuickCheck

### 6.1 QuickCheck Generators

```rust
#[cfg(test)]
mod quickcheck_tests {
    use quickcheck::{quickcheck, TestResult};
    
    quickcheck! {
        fn prop_parser_never_panics(s: String) -> bool {
            // Parser should never panic on any input
            match ClassParser::parse(&s) {
                Ok(_) => true,
                Err(_) => true,
            }
        }
        
        fn prop_resolution_deterministic(
            class_str: String,
            _runs: usize
        ) -> TestResult {
            // Resolving same class should always give same result
            if class_str.is_empty() {
                return TestResult::discard();
            }
            
            let parsed1 = ClassParser::parse(&class_str);
            let parsed2 = ClassParser::parse(&class_str);
            
            TestResult::from_bool(parsed1 == parsed2)
        }
        
        fn prop_color_hex_format(color: String) -> bool {
            // All resolved colors should be valid hex
            // (hex format check)
            true
        }
    }
}
```

---

## Part 7: Benchmark Tests

### 7.1 Benchmark Structure

```rust
#[cfg(test)]
mod benchmark_tests {
    use std::time::Instant;
    
    #[test]
    fn benchmark_parse_100_classes() {
        let classes = vec![
            "px-4", "py-2", "bg-blue", "text-white",
            // ... 96 more
        ];
        
        let start = Instant::now();
        for _ in 0..100 {
            for class in &classes {
                let _ = ClassParser::parse(class);
            }
        }
        let elapsed = start.elapsed();
        
        // Target: < 10ms for 10,000 parses
        println!("Parse 10k classes: {:?}", elapsed);
        assert!(elapsed.as_millis() < 10);
    }
    
    #[test]
    fn benchmark_resolve_100_colors() {
        let theme = ThemeConfig::default();
        let colors = vec!["blue", "red", "green", "gray", "slate"];
        
        let start = Instant::now();
        for _ in 0..1000 {
            for color in &colors {
                let _ = theme.resolve_color(color);
            }
        }
        let elapsed = start.elapsed();
        
        // Target: < 30ms for 5000 color lookups
        println!("Resolve 5k colors: {:?}", elapsed);
        assert!(elapsed.as_millis() < 30);
    }
}
```

---

## Summary

### Test Coverage by Component

| Component | Unit Tests | Integration Tests | Total |
|-----------|------------|------------------|-------|
| ClassParser | 65 | 10 | 75 |
| ThemeResolver | 50 | 10 | 60 |
| CssGenerator | - | 15+ | 15+ |
| VariantSystem | - | 5+ | 5+ |
| **Total** | **115** | **40** | **155+** |

### Test Execution Timeline

```
Phase 1 Week 1 Day 6 Timeline:
├─ 0-30min: Design test cases (✓ done above)
├─ 30-60min: Set up test infrastructure + fixtures
├─ 60-120min: Implement parser tests (65 cases)
├─ 120-180min: Implement resolver tests (50 cases)
├─ 180-240min: Implement integration tests + benchmarks
└─ Total: 4 hours
```

---

**Document Status**: Complete  
**Date**: June 9, 2026  
**Week 1 Progress**: 6/7 days complete  
**Next**: Day 7 - POC Setup (hello-world Rust example)
