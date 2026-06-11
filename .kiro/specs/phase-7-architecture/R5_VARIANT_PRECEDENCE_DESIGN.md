# Phase 7 R5 - Variant System Precedence Testing Design

**Status:** Design Phase (Before Implementation)  
**Target:** Session 4  
**Current Status:** R5.1-R5.2 COMPLETE, need tests  

---

## Overview

Complete R5 (Variant System Precedence) by implementing comprehensive unit and integration tests.

**Already Completed:**
- ✅ R5.1: `native/src/domain/variant_precedence.rs` - Precedence enum & rules
- ✅ R5.2: Updated `native/src/application/variant_system.rs` - Composition with ordering

**Need to Complete:**
- R5.3: Unit tests for precedence levels
- R5.4: Integration tests for variant composition ordering
- R5.5: Verify backward compatibility

---

## R5.3: Unit Tests for Precedence Levels

**File:** NEW `native/tests/variant_precedence_unit_tests.rs`

**Purpose:** Test each variant classification and precedence comparison independently

### Design: Test Structure

```rust
#[cfg(test)]
mod variant_precedence_tests {
    use variant_precedence::*;
    
    // ========================================
    // TEST CATEGORY 1: Variant Classification
    // ========================================
    
    #[test]
    fn test_classify_responsive_variants() {
        // Variants: sm, md, lg, xl, 2xl, 3xl
        assert_eq!(get_variant_precedence("sm"), VariantLevel::Responsive);
        assert_eq!(get_variant_precedence("md"), VariantLevel::Responsive);
        assert_eq!(get_variant_precedence("xl"), VariantLevel::Responsive);
    }
    
    #[test]
    fn test_classify_state_variants() {
        // Variants: hover, focus, active, disabled, visited, etc.
        assert_eq!(get_variant_precedence("hover"), VariantLevel::State);
        assert_eq!(get_variant_precedence("focus"), VariantLevel::State);
        assert_eq!(get_variant_precedence("active"), VariantLevel::State);
    }
    
    #[test]
    fn test_classify_color_scheme_variants() {
        // Variants: dark, light
        assert_eq!(get_variant_precedence("dark"), VariantLevel::ColorScheme);
        assert_eq!(get_variant_precedence("light"), VariantLevel::ColorScheme);
    }
    
    #[test]
    fn test_classify_interaction_variants() {
        // Variants: group-hover, peer-focus, parent-hover, etc.
        assert_eq!(get_variant_precedence("group-hover"), VariantLevel::Interaction);
        assert_eq!(get_variant_precedence("peer-focus"), VariantLevel::Interaction);
    }
    
    #[test]
    fn test_classify_custom_variants() {
        // Unknown variants default to Custom
        assert_eq!(get_variant_precedence("custom-xyz"), VariantLevel::Custom);
        assert_eq!(get_variant_precedence("my-variant"), VariantLevel::Custom);
    }
    
    // ========================================
    // TEST CATEGORY 2: Precedence Ordering
    // ========================================
    
    #[test]
    fn test_precedence_ordering_values() {
        // Lower numeric value = lower precedence (applied first)
        let color_scheme = get_variant_precedence("dark");
        let responsive = get_variant_precedence("md");
        let state = get_variant_precedence("hover");
        let interaction = get_variant_precedence("group-hover");
        
        // color_scheme < responsive < state < interaction
        assert!(color_scheme < responsive);
        assert!(responsive < state);
        assert!(state < interaction);
    }
    
    #[test]
    fn test_precedence_comparison() {
        let dark = VariantLevel::ColorScheme;
        let md = VariantLevel::Responsive;
        let hover = VariantLevel::State;
        
        assert!(dark < md);
        assert!(md < hover);
        assert!(dark < hover);
    }
    
    // ========================================
    // TEST CATEGORY 3: Edge Cases
    // ========================================
    
    #[test]
    fn test_empty_variant_string() {
        // Empty string should have some default precedence
        assert_eq!(get_variant_precedence(""), VariantLevel::Custom);
    }
    
    #[test]
    fn test_variant_with_prefix_colon() {
        // Variants can come with "variant:" prefix
        assert_eq!(get_variant_precedence("hover:"), VariantLevel::State);
        assert_eq!(get_variant_precedence("dark:"), VariantLevel::ColorScheme);
    }
    
    #[test]
    fn test_case_sensitivity() {
        // Variants should be case-insensitive
        assert_eq!(
            get_variant_precedence("hover"),
            get_variant_precedence("HOVER")
        );
        assert_eq!(
            get_variant_precedence("dark"),
            get_variant_precedence("Dark")
        );
    }
    
    #[test]
    fn test_compound_variants() {
        // Compound variants: "dark:hover" - should use highest precedence
        let precedence = get_variant_precedence("dark:hover");
        // Should be State (highest) since both dark and hover are present
        assert_eq!(precedence, VariantLevel::State);
    }
    
    // ========================================
    // TEST CATEGORY 4: All Known Variants
    // ========================================
    
    #[test]
    fn test_all_responsive_variants() {
        let responsive = vec!["sm", "md", "lg", "xl", "2xl", "3xl"];
        for v in responsive {
            assert_eq!(
                get_variant_precedence(v),
                VariantLevel::Responsive,
                "Variant '{}' not classified as Responsive",
                v
            );
        }
    }
    
    #[test]
    fn test_all_state_variants() {
        let states = vec!["hover", "focus", "active", "disabled", "visited"];
        for v in states {
            assert_eq!(
                get_variant_precedence(v),
                VariantLevel::State,
                "Variant '{}' not classified as State",
                v
            );
        }
    }
    
    #[test]
    fn test_all_color_scheme_variants() {
        let schemes = vec!["dark", "light"];
        for v in schemes {
            assert_eq!(
                get_variant_precedence(v),
                VariantLevel::ColorScheme,
                "Variant '{}' not classified as ColorScheme",
                v
            );
        }
    }
}
```

**Test Count:** ~25 unit tests
**Coverage:** 100% of precedence classification logic

---

## R5.4: Integration Tests for Variant Composition Ordering

**File:** Same file `native/tests/variant_precedence_unit_tests.rs` (or separate if large)

**Purpose:** Test variant composition with multiple variants in different orders

### Design: Test Structure

```rust
#[cfg(test)]
mod variant_composition_integration_tests {
    use variant_system::*;
    
    // ========================================
    // TEST CATEGORY 1: Two-Variant Combinations
    // ========================================
    
    #[test]
    fn test_compose_responsive_then_state() {
        // Input: "md:hover:text-red-500"
        // Should compose: responsive(md) → state(hover)
        
        let variants = vec!["md", "hover"];
        let composed = compose_variants(&variants);
        
        // Verify order: responsive before state
        assert_eq!(composed, vec!["md", "hover"]);
    }
    
    #[test]
    fn test_compose_state_then_responsive() {
        // Input: "hover:md:text-red-500" (wrong order)
        // Should reorder: responsive(md) → state(hover)
        
        let variants = vec!["hover", "md"];
        let composed = compose_variants(&variants);
        
        // Verify order corrected: md comes before hover
        assert_eq!(composed, vec!["md", "hover"]);
    }
    
    #[test]
    fn test_compose_dark_then_responsive() {
        // Input: "dark:md:text-red-500"
        // Should order: dark (color-scheme) → md (responsive)
        
        let variants = vec!["dark", "md"];
        let composed = compose_variants(&variants);
        
        assert_eq!(composed, vec!["dark", "md"]);
    }
    
    #[test]
    fn test_compose_responsive_then_dark() {
        // Input: "md:dark:text-red-500" (wrong order)
        // Should reorder: dark → md
        
        let variants = vec!["md", "dark"];
        let composed = compose_variants(&variants);
        
        assert_eq!(composed, vec!["dark", "md"]);
    }
    
    // ========================================
    // TEST CATEGORY 2: Three+ Variant Combinations
    // ========================================
    
    #[test]
    fn test_compose_full_stack() {
        // Input: "dark:md:hover:group-hover:text-red-500"
        // Correct order by precedence:
        // 1. dark (ColorScheme = 0)
        // 2. md (Responsive = 1)
        // 3. hover (State = 2)
        // 4. group-hover (Interaction = 3)
        
        let variants = vec!["group-hover", "hover", "dark", "md"];
        let composed = compose_variants(&variants);
        
        assert_eq!(
            composed,
            vec!["dark", "md", "hover", "group-hover"],
            "Variants not ordered by precedence"
        );
    }
    
    #[test]
    fn test_compose_random_order_yields_same() {
        // Different input orders should produce same output order
        let set1 = vec!["hover", "md", "dark"];
        let set2 = vec!["md", "dark", "hover"];
        
        let composed1 = compose_variants(&set1);
        let composed2 = compose_variants(&set2);
        
        assert_eq!(
            composed1, composed2,
            "Same variants in different order produced different composition"
        );
    }
    
    // ========================================
    // TEST CATEGORY 3: Duplicate Variants
    // ========================================
    
    #[test]
    fn test_compose_with_duplicates() {
        // Input: "md:md:hover:hover"
        // Should deduplicate
        
        let variants = vec!["md", "md", "hover", "hover"];
        let composed = compose_variants(&variants);
        
        // Deduplicates: md appears once, hover appears once
        assert_eq!(composed.len(), 2);
        assert_eq!(composed, vec!["md", "hover"]);
    }
    
    // ========================================
    // TEST CATEGORY 4: CSS Output Consistency
    // ========================================
    
    #[test]
    fn test_composed_css_identical_regardless_input_order() {
        // Generate CSS with different input orders
        let set1 = vec!["dark", "md", "hover"];
        let set2 = vec!["hover", "dark", "md"];
        
        let css1 = generate_css_with_variants("text-red-500", &set1)?;
        let css2 = generate_css_with_variants("text-red-500", &set2)?;
        
        // Both should produce identical CSS
        assert_eq!(normalize_css(&css1), normalize_css(&css2));
    }
    
    #[test]
    fn test_precedence_enforced_in_css_selectors() {
        // CSS selectors should respect precedence ordering
        let variants = vec!["group-hover", "dark", "md", "hover"];
        let css = generate_css_with_variants("text-red-500", &variants)?;
        
        // Extract selector order from CSS
        let selector_order = extract_variant_order_from_css(&css);
        
        // Verify precedence ordering in CSS
        assert!(selector_order.position("dark") < selector_order.position("md"));
        assert!(selector_order.position("md") < selector_order.position("hover"));
        assert!(selector_order.position("hover") < selector_order.position("group-hover"));
    }
    
    // ========================================
    // TEST CATEGORY 5: Real-World Scenarios
    // ========================================
    
    #[test]
    fn test_responsive_design_priority() {
        // Responsive variants should come before state/interaction
        let variants = vec!["group-hover", "hover", "xl", "md", "dark"];
        let css = generate_css_with_variants("w-full", &variants)?;
        
        // The CSS should apply media queries (responsive) before pseudo-selectors
        assert!(css.contains("@media"));
        
        // Verify CSS structure:
        // @media (min-width: ...) {
        //   .dark ... {
        //     .xl ... :hover { ... }
        //   }
        // }
    }
    
    #[test]
    fn test_dark_mode_lowest_priority() {
        // Dark mode (color-scheme) should be applied first (lowest specificity)
        let variants = vec!["dark", "md", "hover"];
        let css = generate_css_with_variants("text-blue-500", &variants)?;
        
        // Find positions in CSS
        let dark_pos = css.find("dark").unwrap_or(usize::MAX);
        let md_pos = css.find("@media").unwrap_or(usize::MAX);
        let hover_pos = css.find(":hover").unwrap_or(usize::MAX);
        
        // CSS structure should respect: dark first, then responsive, then state
        // (This depends on actual CSS generation structure)
    }
    
    // ========================================
    // TEST CATEGORY 6: Backward Compatibility
    // ========================================
    
    #[test]
    fn test_single_variant_unchanged() {
        // Single variants should compose to themselves
        let variants = vec!["md"];
        let composed = compose_variants(&variants);
        
        assert_eq!(composed, vec!["md"]);
    }
    
    #[test]
    fn test_already_ordered_variants_unchanged() {
        // Already-ordered variants should stay same
        let variants = vec!["dark", "md", "hover"];
        let composed = compose_variants(&variants);
        
        assert_eq!(composed, vec!["dark", "md", "hover"]);
    }
}
```

**Test Count:** ~20 integration tests
**Coverage:** Variant composition logic, CSS generation, real-world scenarios

---

## R5.5: Backward Compatibility Verification

**File:** Existing test suite + new compatibility tests

### Design: Compatibility Test Strategy

```rust
#[cfg(test)]
mod backward_compatibility_tests {
    use super::*;
    
    #[test]
    fn test_existing_variant_system_api() {
        // Public API should remain unchanged
        
        // Function: resolve_variants()
        let result = resolve_variants(&["md", "hover"])?;
        assert!(!result.is_empty());
        
        // Function: compose_variants()
        let result = compose_variants(&["md", "hover"]);
        assert!(!result.is_empty());
        
        // Function: get_variant_precedence()
        let prec = get_variant_precedence("md");
        assert!(prec >= 0);  // Valid precedence
    }
    
    #[test]
    fn test_existing_tests_still_pass() {
        // Run some existing variant tests to ensure no regression
        // (These should be run via full test suite)
        
        // Example: existing test that was already passing
        let input = "text-red-500";
        let parsed = parse_class(input)?;
        assert_eq!(parsed.base, "text-red-500");
    }
    
    #[test]
    fn test_css_generation_unchanged_for_no_variants() {
        // CSS generation without variants should be identical to before
        
        let css_before = "todo: old_generate_css(\"text-red-500\")";
        let css_after = generate_css("text-red-500")?;
        
        // Should produce same CSS
        assert_eq!(normalize_css(&css_before), normalize_css(&css_after));
    }
    
    #[test]
    fn test_performance_no_regression() {
        // Variant composition should not significantly slow down parsing
        // (Optional: benchmarking with criterion)
        
        let start = std::time::Instant::now();
        for _ in 0..1000 {
            compose_variants(&["dark", "md", "hover"])?;
        }
        let elapsed = start.elapsed();
        
        // Should complete 1000 compositions in <100ms
        assert!(elapsed.as_millis() < 100);
    }
}
```

**Test Count:** ~5 compatibility tests
**Coverage:** API stability, existing functionality, performance

---

## Total Test Count

| Category | Count | File |
|----------|-------|------|
| Unit Tests (Classification) | 12 | variant_precedence_unit_tests.rs |
| Unit Tests (Precedence) | 13 | variant_precedence_unit_tests.rs |
| Integration Tests (Composition) | 20 | variant_precedence_unit_tests.rs |
| Compatibility Tests | 5 | variant_precedence_unit_tests.rs |
| **TOTAL** | **~50 tests** | - |

---

## Implementation Dependencies

### What's Already Available
- ✅ `native/src/domain/variant_precedence.rs` - Precedence enum & functions
- ✅ `native/src/application/variant_system.rs` - Updated with precedence
- ✅ Existing variant resolution functions
- ✅ Existing CSS generation functions

### What Needs to be Implemented
- `compose_variants(&variants) → Vec<String>` - Sort by precedence
- `extract_variant_order_from_css(&css) → Vec<&str>` - Extract variant order from CSS
- `normalize_css(&css) → String` - Normalize CSS for comparison
- `generate_css_with_variants(&class, &variants) → String` - Generate CSS with variants

---

## Implementation Order (Session 4)

1. **Review existing code** (15 mins)
   - Read `variant_precedence.rs`
   - Read updated `variant_system.rs`
   - Understand current API

2. **Implement helper functions** (30 mins)
   - `compose_variants()`
   - `extract_variant_order_from_css()`
   - `normalize_css()`

3. **Create unit tests** (1 hour)
   - Variant classification tests
   - Precedence ordering tests
   - Edge case tests

4. **Create integration tests** (1.5 hours)
   - Variant composition ordering
   - CSS output consistency
   - Real-world scenarios
   - Backward compatibility

5. **Run full test suite** (30 mins)
   - `cargo test --test variant_precedence_unit_tests`
   - Verify ~50 tests passing
   - Verify no regressions in existing tests

---

## Success Criteria

✅ All R5 tasks complete when:
1. Unit tests: ~25 tests passing (classification & precedence)
2. Integration tests: ~20 tests passing (composition & ordering)
3. Compatibility tests: ~5 tests passing
4. Build succeeds: `cargo build --release`
5. Full test suite passes: `cargo test --release`
6. No performance regression detected
7. Backward compatibility verified

---

**Design Status:** ✅ READY FOR IMPLEMENTATION

Proceed with Session 4 after R4 (Property tests) completion.
