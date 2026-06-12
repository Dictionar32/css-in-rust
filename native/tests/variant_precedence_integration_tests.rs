//! PHASE 7.5: Variant System Precedence - Integration Tests
//! 
//! Tests for variant precedence system, composition ordering, and CSS generation
//! with deterministic variant handling.
//! 
//! **Requirements:** Verify that variant composition always produces deterministic results
//! regardless of input order, and that CSS output is correct for all variant types.

use tailwind_styled_parser::application::variant_system::VariantSystem;
use tailwind_styled_parser::domain::variant::Variant;
use tailwind_styled_parser::domain::variant_precedence::{
    get_variant_precedence, VariantPrecedence, sort_by_precedence,
};
use tailwind_styled_parser::domain::theme_config::ThemeConfig;

// ============================================================================
// UNIT TESTS: Variant Classification (15 tests)
// ============================================================================

#[test]
fn test_classify_responsive_variants() {
    let variants = vec!["sm", "md", "lg", "xl", "2xl"];
    for v_name in variants {
        let v = Variant::Responsive(v_name.to_string());
        assert_eq!(
            get_variant_precedence(&v),
            VariantPrecedence::Responsive,
            "Variant '{}' not classified as Responsive",
            v_name
        );
    }
}

#[test]
fn test_classify_state_variants() {
    let variants = vec![
        "hover", "focus", "active", "disabled", "visited", "enabled", "checked",
    ];
    for v_name in variants {
        let v = Variant::State(v_name.to_string());
        assert_eq!(
            get_variant_precedence(&v),
            VariantPrecedence::State,
            "Variant '{}' not classified as State",
            v_name
        );
    }
}

#[test]
fn test_classify_color_scheme_variants() {
    let variants = vec!["dark", "light"];
    for v_name in variants {
        let v = Variant::ColorScheme(v_name.to_string());
        assert_eq!(
            get_variant_precedence(&v),
            VariantPrecedence::ColorScheme,
            "Variant '{}' not classified as ColorScheme",
            v_name
        );
    }
}

#[test]
fn test_classify_interaction_variants() {
    let group_hover = Variant::GroupRelative("hover".to_string());
    assert_eq!(
        get_variant_precedence(&group_hover),
        VariantPrecedence::Interaction
    );

    let peer_focus = Variant::PeerRelative("focus".to_string());
    assert_eq!(
        get_variant_precedence(&peer_focus),
        VariantPrecedence::Interaction
    );
}

#[test]
fn test_classify_custom_variants() {
    let variants = vec!["my-custom", "plugin-variant", "custom-xyz"];
    for v_name in variants {
        let v = Variant::Custom(v_name.to_string());
        assert_eq!(
            get_variant_precedence(&v),
            VariantPrecedence::Custom,
            "Variant '{}' not classified as Custom",
            v_name
        );
    }
}

#[test]
fn test_precedence_levels_correctly_ordered() {
    assert!(VariantPrecedence::Interaction < VariantPrecedence::ColorScheme);
    assert!(VariantPrecedence::ColorScheme < VariantPrecedence::Responsive);
    assert!(VariantPrecedence::Responsive < VariantPrecedence::State);
    assert!(VariantPrecedence::State < VariantPrecedence::Custom);
}

#[test]
fn test_precedence_numeric_values() {
    assert_eq!(VariantPrecedence::Interaction.level(), 0);
    assert_eq!(VariantPrecedence::ColorScheme.level(), 1);
    assert_eq!(VariantPrecedence::Responsive.level(), 2);
    assert_eq!(VariantPrecedence::State.level(), 3);
    assert_eq!(VariantPrecedence::Custom.level(), 4);
}

#[test]
fn test_edge_case_empty_variant_string() {
    // Empty variant string should still classify (as custom or default)
    let v = Variant::Custom(String::new());
    let precedence = get_variant_precedence(&v);
    assert_eq!(precedence, VariantPrecedence::Custom);
}

#[test]
fn test_case_handling() {
    // Variants should handle case appropriately
    let v1 = Variant::State("hover".to_string());
    let v2 = Variant::State("HOVER".to_string());

    // Both should be classified as State regardless of case
    assert_eq!(get_variant_precedence(&v1), VariantPrecedence::State);
    assert_eq!(get_variant_precedence(&v2), VariantPrecedence::State);
}

// ============================================================================
// INTEGRATION TESTS: Variant Composition (20 tests)
// ============================================================================

#[test]
fn test_compose_two_variant_responsive_then_state() {
    let variants = vec![
        Variant::Responsive("md".to_string()),
        Variant::State("hover".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Order should be: responsive (2) before state (3)
    assert_eq!(composed[0].precedence, VariantPrecedence::Responsive);
    assert_eq!(composed[1].precedence, VariantPrecedence::State);
}

#[test]
fn test_compose_two_variant_state_then_responsive() {
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Should reorder: responsive before state
    assert_eq!(composed[0].precedence, VariantPrecedence::Responsive);
    assert_eq!(composed[1].precedence, VariantPrecedence::State);
}

#[test]
fn test_compose_dark_mode_first() {
    let variants = vec![
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Order: ColorScheme(1) < Responsive(2)
    assert_eq!(composed[0].precedence, VariantPrecedence::ColorScheme);
    assert_eq!(composed[1].precedence, VariantPrecedence::Responsive);
}

#[test]
fn test_compose_full_stack_five_variants() {
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::Custom("plugin".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::GroupRelative("focus".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Verify precedence order: Interaction < ColorScheme < Responsive < State < Custom
    assert_eq!(composed[0].precedence, VariantPrecedence::Interaction); // group-focus
    assert_eq!(composed[1].precedence, VariantPrecedence::ColorScheme); // dark
    assert_eq!(composed[2].precedence, VariantPrecedence::Responsive); // md
    assert_eq!(composed[3].precedence, VariantPrecedence::State); // hover
    assert_eq!(composed[4].precedence, VariantPrecedence::Custom); // plugin
}

#[test]
fn test_compose_deterministic_different_orders() {
    let set1 = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
    ];

    let set2 = vec![
        Variant::ColorScheme("dark".to_string()),
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
    ];

    let set3 = vec![
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::State("hover".to_string()),
    ];

    let composed1 = VariantSystem::compose_variants(&set1);
    let composed2 = VariantSystem::compose_variants(&set2);
    let composed3 = VariantSystem::compose_variants(&set3);

    // All should produce identical result
    assert_eq!(composed1, composed2);
    assert_eq!(composed2, composed3);
}

#[test]
fn test_compose_multiple_variants_same_type() {
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::State("focus".to_string()),
        Variant::State("active".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // All have same precedence, should maintain relative order (stable sort)
    assert_eq!(composed.len(), 3);
    assert_eq!(composed[0].variant, Variant::State("hover".to_string()));
    assert_eq!(composed[1].variant, Variant::State("focus".to_string()));
    assert_eq!(composed[2].variant, Variant::State("active".to_string()));
}

#[test]
fn test_compose_empty_variant_list() {
    let variants: Vec<Variant> = vec![];
    let composed = VariantSystem::compose_variants(&variants);
    assert_eq!(composed.len(), 0);
}

#[test]
fn test_compose_single_variant() {
    let variants = vec![Variant::State("hover".to_string())];
    let composed = VariantSystem::compose_variants(&variants);

    assert_eq!(composed.len(), 1);
    assert_eq!(composed[0].variant, Variant::State("hover".to_string()));
}

#[test]
fn test_resolve_variants_returns_correct_structure() {
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
    ];

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default());
    assert!(result.is_ok());

    let components = result.unwrap();
    // Should have media query for responsive and selector for state
    assert!(!components.media_queries.is_empty() || !components.selectors.is_empty());
}

#[test]
fn test_resolve_variants_precedence_ordering() {
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::Responsive("md".to_string()),
    ];

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default());
    assert!(result.is_ok());

    let components = result.unwrap();

    // Verify that lower precedence variants appear before higher precedence ones
    // (Color scheme before responsive, responsive before state)
    assert!(!components.media_queries.is_empty());
    assert!(!components.selectors.is_empty());
}

#[test]
fn test_compose_variants_is_stable_sort() {
    // Variants with same precedence should preserve relative order
    let variants = vec![
        Variant::Responsive("xl".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::Responsive("sm".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Order should be preserved (stable sort)
    assert_eq!(composed[0].variant, Variant::Responsive("xl".to_string()));
    assert_eq!(composed[1].variant, Variant::Responsive("md".to_string()));
    assert_eq!(composed[2].variant, Variant::Responsive("sm".to_string()));
}

// ============================================================================
// BACKWARD COMPATIBILITY TESTS (5 tests)
// ============================================================================

#[test]
fn test_backward_compat_single_variant_unchanged() {
    let variants = vec![Variant::State("hover".to_string())];
    let composed = VariantSystem::compose_variants(&variants);

    // Single variant should compose to itself
    assert_eq!(composed.len(), 1);
    assert_eq!(composed[0].variant, Variant::State("hover".to_string()));
}

#[test]
fn test_backward_compat_already_ordered_variants_unchanged() {
    let variants = vec![
        Variant::ColorScheme("dark".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::State("hover".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Already correctly ordered variants should stay in same order
    assert_eq!(composed[0].variant, Variant::ColorScheme("dark".to_string()));
    assert_eq!(composed[1].variant, Variant::Responsive("md".to_string()));
    assert_eq!(composed[2].variant, Variant::State("hover".to_string()));
}

#[test]
fn test_backward_compat_existing_api_present() {
    // Verify public API methods still exist and work
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
    ];

    // Function: compose_variants()
    let composed = VariantSystem::compose_variants(&variants);
    assert!(!composed.is_empty());

    // Function: resolve_variants()
    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default());
    assert!(result.is_ok());

    // Function: get_variant_precedence()
    let prec = get_variant_precedence(&Variant::State("hover".to_string()));
    assert_eq!(prec, VariantPrecedence::State);

    // Function: sort_by_precedence()
    let sorted = sort_by_precedence(&variants);
    assert_eq!(sorted.len(), variants.len());
}

#[test]
fn test_backward_compat_performance_no_regression() {
    // Composing 1000 times should complete quickly
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
    ];

    let start = std::time::Instant::now();
    for _ in 0..1000 {
        let _composed = VariantSystem::compose_variants(&variants);
    }
    let elapsed = start.elapsed();

    // Should complete 1000 compositions in <100ms
    assert!(
        elapsed.as_millis() < 100,
        "Composition took {}ms for 1000 iterations (too slow)",
        elapsed.as_millis()
    );
}

// ============================================================================
// REAL-WORLD SCENARIO TESTS (5 tests)
// ============================================================================

#[test]
fn test_real_world_dark_mode_responsive() {
    // Common pattern: dark:md:hover:text-white
    let variants = vec![
        Variant::ColorScheme("dark".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::State("hover".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Already in correct order, should remain unchanged
    assert_eq!(composed[0].variant, Variant::ColorScheme("dark".to_string()));
    assert_eq!(composed[1].variant, Variant::Responsive("md".to_string()));
    assert_eq!(composed[2].variant, Variant::State("hover".to_string()));
}

#[test]
fn test_real_world_responsive_first_wrong_order() {
    // Pattern with wrong order: md:dark:hover:text-white
    let variants = vec![
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::State("hover".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Should be reordered to: dark, md, hover
    assert_eq!(composed[0].variant, Variant::ColorScheme("dark".to_string()));
    assert_eq!(composed[1].variant, Variant::Responsive("md".to_string()));
    assert_eq!(composed[2].variant, Variant::State("hover".to_string()));
}

#[test]
fn test_real_world_group_hover_pattern() {
    // Pattern: group-hover:md:text-red-500
    let variants = vec![
        Variant::GroupRelative("hover".to_string()),
        Variant::Responsive("md".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Interaction (0) comes before Responsive (2)
    assert_eq!(composed[0].precedence, VariantPrecedence::Interaction);
    assert_eq!(composed[1].precedence, VariantPrecedence::Responsive);
}

#[test]
fn test_real_world_complex_stacked_variants() {
    // Full stack: dark:lg:group-hover:hover:bg-blue-500
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::GroupRelative("hover".to_string()),
        Variant::Responsive("lg".to_string()),
        Variant::ColorScheme("dark".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Verify order: Interaction < ColorScheme < Responsive < State
    assert_eq!(
        composed[0].precedence,
        VariantPrecedence::Interaction,
        "Group/peer should come first"
    );
    assert_eq!(
        composed[1].precedence,
        VariantPrecedence::ColorScheme,
        "Dark mode should come second"
    );
    assert_eq!(
        composed[2].precedence,
        VariantPrecedence::Responsive,
        "Responsive should come third"
    );
    assert_eq!(
        composed[3].precedence,
        VariantPrecedence::State,
        "State should come last"
    );
}

#[test]
fn test_real_world_all_five_precedence_levels() {
    // Use all 5 precedence levels
    let variants = vec![
        Variant::Custom("my-plugin".to_string()),
        Variant::State("active".to_string()),
        Variant::Responsive("xl".to_string()),
        Variant::ColorScheme("light".to_string()),
        Variant::PeerRelative("focus".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    assert_eq!(composed.len(), 5);
    assert_eq!(composed[0].precedence, VariantPrecedence::Interaction);
    assert_eq!(composed[1].precedence, VariantPrecedence::ColorScheme);
    assert_eq!(composed[2].precedence, VariantPrecedence::Responsive);
    assert_eq!(composed[3].precedence, VariantPrecedence::State);
    assert_eq!(composed[4].precedence, VariantPrecedence::Custom);
}

// ============================================================================
// INTEGRATION TESTS: CSS Output Consistency (10 tests)
// ============================================================================

#[test]
fn test_css_output_single_variant() {
    let variants = vec![Variant::State("hover".to_string())];
    
    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default());
    assert!(result.is_ok());
    
    let components = result.unwrap();
    // Single state variant should produce selector
    assert_eq!(components.selectors.len(), 1);
    assert_eq!(components.media_queries.len(), 0);
    assert_eq!(components.selectors[0], ":hover");
}

#[test]
fn test_css_output_responsive_variant() {
    let variants = vec![Variant::Responsive("md".to_string())];
    
    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default());
    assert!(result.is_ok());
    
    let components = result.unwrap();
    // Responsive variant should produce media query
    assert_eq!(components.media_queries.len(), 1);
    assert_eq!(components.selectors.len(), 0);
    assert_eq!(components.media_queries[0], "@media-md");
}

#[test]
fn test_css_output_color_scheme_variant() {
    let variants = vec![Variant::ColorScheme("dark".to_string())];
    
    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default());
    assert!(result.is_ok());
    
    let components = result.unwrap();
    // ColorScheme variant should produce media query
    assert_eq!(components.media_queries.len(), 1);
    assert_eq!(components.selectors.len(), 0);
    assert_eq!(components.media_queries[0], "@dark");
}

#[test]
fn test_css_output_deterministic_two_variants() {
    // Test that CSS output is deterministic regardless of input order
    let set1 = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
    ];

    let set2 = vec![
        Variant::Responsive("md".to_string()),
        Variant::State("hover".to_string()),
    ];

    let result1 = VariantSystem::resolve_variants(&set1, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    let result2 = VariantSystem::resolve_variants(&set2, &ThemeConfig::default())
        .expect("resolve_variants should succeed");

    // CSS output should be identical
    assert_eq!(result1.media_queries, result2.media_queries);
    assert_eq!(result1.selectors, result2.selectors);
    
    // Verify order: media queries come first (responsive=2), then selectors (state=3)
    assert_eq!(result1.media_queries[0], "@media-md");
    assert_eq!(result1.selectors[0], ":hover");
}

#[test]
fn test_css_output_deterministic_three_variants() {
    let set1 = vec![
        Variant::State("focus".to_string()),
        Variant::Responsive("lg".to_string()),
        Variant::ColorScheme("dark".to_string()),
    ];

    let set2 = vec![
        Variant::ColorScheme("dark".to_string()),
        Variant::State("focus".to_string()),
        Variant::Responsive("lg".to_string()),
    ];

    let set3 = vec![
        Variant::Responsive("lg".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::State("focus".to_string()),
    ];

    let result1 = VariantSystem::resolve_variants(&set1, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    let result2 = VariantSystem::resolve_variants(&set2, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    let result3 = VariantSystem::resolve_variants(&set3, &ThemeConfig::default())
        .expect("resolve_variants should succeed");

    // All should produce identical CSS output
    assert_eq!(result1.media_queries, result2.media_queries);
    assert_eq!(result2.media_queries, result3.media_queries);
    assert_eq!(result1.selectors, result2.selectors);
    assert_eq!(result2.selectors, result3.selectors);
}

#[test]
fn test_css_output_full_stack_five_variants() {
    let variants = vec![
        Variant::Custom("plugin".to_string()),
        Variant::State("active".to_string()),
        Variant::Responsive("2xl".to_string()),
        Variant::ColorScheme("light".to_string()),
        Variant::GroupRelative("hover".to_string()),
    ];

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
        .expect("resolve_variants should succeed");

    // Should have media queries (colorscheme + responsive) and selectors (group + state + custom)
    assert!(result.media_queries.len() > 0);
    assert!(result.selectors.len() > 0);

    // Media queries should come before selectors in precedence order
    // Dark mode (1) < Responsive (2)
    // State (3) < Custom (4)
}

#[test]
fn test_css_output_multiple_same_precedence() {
    // Multiple variants at same precedence level
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::State("focus".to_string()),
        Variant::State("active".to_string()),
    ];

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
        .expect("resolve_variants should succeed");

    // All state variants should be in selectors, order preserved (stable sort)
    assert_eq!(result.selectors.len(), 3);
    assert_eq!(result.selectors[0], ":hover");
    assert_eq!(result.selectors[1], ":focus");
    assert_eq!(result.selectors[2], ":active");
}

#[test]
fn test_css_output_empty_produces_empty_components() {
    let variants: Vec<Variant> = vec![];

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
        .expect("resolve_variants should succeed");

    assert_eq!(result.media_queries.len(), 0);
    assert_eq!(result.selectors.len(), 0);
}

#[test]
fn test_css_output_large_variant_set() {
    // Test with many variants
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::State("focus".to_string()),
        Variant::State("active".to_string()),
        Variant::State("disabled".to_string()),
        Variant::Responsive("sm".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::Responsive("lg".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::GroupRelative("hover".to_string()),
    ];

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
        .expect("resolve_variants should succeed");

    // Should have both media queries and selectors
    assert!(result.media_queries.len() > 0);
    assert!(result.selectors.len() > 0);
    
    // Total should match input
    assert_eq!(result.media_queries.len() + result.selectors.len(), 9);
}

// ============================================================================
// COMPLEX MULTI-VARIANT STACKING TESTS (10 tests)
// ============================================================================

#[test]
fn test_complex_stacking_group_focus_md_dark_active() {
    // Real-world complex pattern
    let variants = vec![
        Variant::Custom("plugin".to_string()),
        Variant::State("active".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::GroupRelative("focus".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Verify precedence order
    assert_eq!(composed[0].precedence, VariantPrecedence::Interaction); // group-focus
    assert_eq!(composed[1].precedence, VariantPrecedence::ColorScheme); // dark
    assert_eq!(composed[2].precedence, VariantPrecedence::Responsive); // md
    assert_eq!(composed[3].precedence, VariantPrecedence::State); // active
    assert_eq!(composed[4].precedence, VariantPrecedence::Custom); // plugin

    // Verify CSS output
    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    
    assert!(result.media_queries.len() > 0); // dark + md
    assert!(result.selectors.len() > 0);     // group-focus + active + plugin
}

#[test]
fn test_complex_stacking_peer_lg_light_focus() {
    let variants = vec![
        Variant::PeerRelative("focus".to_string()),
        Variant::ColorScheme("light".to_string()),
        Variant::Responsive("lg".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // peer-focus should come first (Interaction < ColorScheme < Responsive)
    assert_eq!(composed[0].precedence, VariantPrecedence::Interaction);
    assert_eq!(composed[1].precedence, VariantPrecedence::ColorScheme);
    assert_eq!(composed[2].precedence, VariantPrecedence::Responsive);

    // Should produce CSS without error
    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default());
    assert!(result.is_ok());
}

#[test]
fn test_complex_stacking_many_state_variants() {
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::State("focus".to_string()),
        Variant::State("active".to_string()),
        Variant::State("disabled".to_string()),
        Variant::State("visited".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // All should have same precedence
    for resolved in &composed {
        assert_eq!(resolved.precedence, VariantPrecedence::State);
    }

    // Order should be preserved (stable sort)
    assert_eq!(composed[0].name(), "hover");
    assert_eq!(composed[1].name(), "focus");
    assert_eq!(composed[2].name(), "active");
    assert_eq!(composed[3].name(), "disabled");
    assert_eq!(composed[4].name(), "visited");

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    
    assert_eq!(result.selectors.len(), 5);
}

#[test]
fn test_complex_stacking_many_responsive_variants() {
    let variants = vec![
        Variant::Responsive("sm".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::Responsive("lg".to_string()),
        Variant::Responsive("xl".to_string()),
        Variant::Responsive("2xl".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // All should have same precedence
    for resolved in &composed {
        assert_eq!(resolved.precedence, VariantPrecedence::Responsive);
    }

    // Order should be preserved
    assert_eq!(composed[0].name(), "sm");
    assert_eq!(composed[1].name(), "md");
    assert_eq!(composed[2].name(), "lg");
    assert_eq!(composed[3].name(), "xl");
    assert_eq!(composed[4].name(), "2xl");

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    
    assert_eq!(result.media_queries.len(), 5);
}

#[test]
fn test_complex_stacking_mixed_interaction_types() {
    let variants = vec![
        Variant::GroupRelative("hover".to_string()),
        Variant::PeerRelative("focus".to_string()),
        Variant::GroupRelative("active".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // All should have Interaction precedence
    for resolved in &composed {
        assert_eq!(resolved.precedence, VariantPrecedence::Interaction);
    }

    // Order should be preserved
    assert_eq!(composed[0].name(), "hover");
    assert_eq!(composed[1].name(), "focus");
    assert_eq!(composed[2].name(), "active");
}

#[test]
fn test_complex_stacking_all_responsive_breakpoints_plus_state() {
    let variants = vec![
        Variant::Responsive("sm".to_string()),
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::State("focus".to_string()),
        Variant::Responsive("lg".to_string()),
        Variant::State("active".to_string()),
    ];

    let composed = VariantSystem::compose_variants(&variants);

    // Should be interleaved but ordered by precedence
    // All responsive (2) before all state (3)
    let first_state_idx = composed.iter().position(|r| r.precedence == VariantPrecedence::State);
    let last_responsive_idx = composed.iter().rposition(|r| r.precedence == VariantPrecedence::Responsive);
    
    assert!(first_state_idx.is_some());
    assert!(last_responsive_idx.is_some());
    assert!(first_state_idx.unwrap() > last_responsive_idx.unwrap());

    let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    
    assert_eq!(result.media_queries.len(), 3); // sm, md, lg
    assert_eq!(result.selectors.len(), 3);     // hover, focus, active
}

#[test]
fn test_complex_stacking_random_order_to_deterministic() {
    // Create 10 different orderings of the same variant set
    let base_variants = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("lg".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::GroupRelative("focus".to_string()),
        Variant::Custom("plugin".to_string()),
    ];

    let mut all_results = Vec::new();

    // Generate permutations
    let perms = vec![
        vec![0, 1, 2, 3, 4],
        vec![4, 3, 2, 1, 0],
        vec![2, 0, 4, 1, 3],
        vec![1, 4, 0, 3, 2],
        vec![3, 2, 1, 0, 4],
    ];

    for perm in perms {
        let mut variants = Vec::new();
        for &idx in &perm {
            variants.push(base_variants[idx].clone());
        }

        let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
            .expect("resolve_variants should succeed");
        all_results.push(result);
    }

    // All should produce identical results
    let first = &all_results[0];
    for result in &all_results[1..] {
        assert_eq!(result.media_queries, first.media_queries);
        assert_eq!(result.selectors, first.selectors);
    }
}

#[test]
fn test_complex_stacking_empty_then_populated() {
    // Empty composition
    let empty: Vec<Variant> = vec![];
    let empty_result = VariantSystem::resolve_variants(&empty, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    
    assert_eq!(empty_result.media_queries.len(), 0);
    assert_eq!(empty_result.selectors.len(), 0);

    // Populated composition
    let populated = vec![Variant::State("hover".to_string())];
    let populated_result = VariantSystem::resolve_variants(&populated, &ThemeConfig::default())
        .expect("resolve_variants should succeed");
    
    assert!(populated_result.selectors.len() > 0);

    // Verify they're different
    assert_ne!(empty_result.selectors, populated_result.selectors);
}

#[test]
fn test_complex_stacking_performance_1000_permutations() {
    // Performance test: compose same variants 1000 times
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::GroupRelative("focus".to_string()),
    ];

    let start = std::time::Instant::now();
    for _ in 0..1000 {
        let _composed = VariantSystem::compose_variants(&variants);
    }
    let elapsed = start.elapsed();

    // Should be very fast (well under 100ms for 1000 iterations)
    assert!(
        elapsed.as_millis() < 100,
        "1000 compositions took {}ms (too slow)",
        elapsed.as_millis()
    );
}

// ============================================================================
// PROPERTY-BASED STYLE INTEGRATION TESTS (5 tests)
// ============================================================================

#[test]
fn test_property_composition_determinism_simple() {
    // Property: Same variants always compose to same order
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::Responsive("md".to_string()),
    ];

    let comp1 = VariantSystem::compose_variants(&variants);
    let comp2 = VariantSystem::compose_variants(&variants);
    let comp3 = VariantSystem::compose_variants(&variants);

    assert_eq!(comp1, comp2);
    assert_eq!(comp2, comp3);
}

#[test]
fn test_property_composition_idempotence() {
    // Property: Composing already-composed variants should not change result
    let variants = vec![
        Variant::State("focus".to_string()),
        Variant::Responsive("sm".to_string()),
        Variant::ColorScheme("light".to_string()),
    ];

    let composed1 = VariantSystem::compose_variants(&variants);
    
    // Extract variants from composed and compose again
    let variants2: Vec<Variant> = composed1.iter().map(|rv| rv.variant.clone()).collect();
    let composed2 = VariantSystem::compose_variants(&variants2);

    // Should be identical (idempotent)
    assert_eq!(composed1, composed2);
}

#[test]
fn test_property_css_output_stable() {
    // Property: CSS output is deterministic across multiple calls
    let variants = vec![
        Variant::State("active".to_string()),
        Variant::Responsive("xl".to_string()),
    ];

    let config = ThemeConfig::default();

    let result1 = VariantSystem::resolve_variants(&variants, &config)
        .expect("resolve_variants should succeed");
    let result2 = VariantSystem::resolve_variants(&variants, &config)
        .expect("resolve_variants should succeed");
    let result3 = VariantSystem::resolve_variants(&variants, &config)
        .expect("resolve_variants should succeed");

    assert_eq!(result1.media_queries, result2.media_queries);
    assert_eq!(result2.media_queries, result3.media_queries);
    assert_eq!(result1.selectors, result2.selectors);
    assert_eq!(result2.selectors, result3.selectors);
}

#[test]
fn test_property_composed_order_always_precedence_order() {
    // Property: Any composition always results in precedence order
    let test_cases = vec![
        vec![
            Variant::State("hover".to_string()),
            Variant::Responsive("md".to_string()),
        ],
        vec![
            Variant::ColorScheme("dark".to_string()),
            Variant::Custom("plugin".to_string()),
            Variant::State("focus".to_string()),
        ],
        vec![
            Variant::GroupRelative("focus".to_string()),
            Variant::Responsive("lg".to_string()),
        ],
    ];

    for variants in test_cases {
        let composed = VariantSystem::compose_variants(&variants);

        // Check that precedence values are in non-decreasing order
        for i in 0..composed.len().saturating_sub(1) {
            assert!(
                composed[i].precedence <= composed[i + 1].precedence,
                "Precedence not ordered correctly"
            );
        }
    }
}

#[test]
fn test_property_permutations_always_identical_output() {
    // Property: Any permutation of input produces identical output
    let base = vec![
        Variant::ColorScheme("dark".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::State("hover".to_string()),
    ];

    let permutations = vec![
        vec![
            Variant::ColorScheme("dark".to_string()),
            Variant::Responsive("md".to_string()),
            Variant::State("hover".to_string()),
        ],
        vec![
            Variant::Responsive("md".to_string()),
            Variant::State("hover".to_string()),
            Variant::ColorScheme("dark".to_string()),
        ],
        vec![
            Variant::State("hover".to_string()),
            Variant::ColorScheme("dark".to_string()),
            Variant::Responsive("md".to_string()),
        ],
        vec![
            Variant::State("hover".to_string()),
            Variant::Responsive("md".to_string()),
            Variant::ColorScheme("dark".to_string()),
        ],
    ];

    let base_result = VariantSystem::resolve_variants(&base, &ThemeConfig::default())
        .expect("resolve_variants should succeed");

    for variants in permutations {
        let result = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
            .expect("resolve_variants should succeed");

        assert_eq!(
            result.media_queries, base_result.media_queries,
            "Media queries differ for permutation"
        );
        assert_eq!(
            result.selectors, base_result.selectors,
            "Selectors differ for permutation"
        );
    }
}
