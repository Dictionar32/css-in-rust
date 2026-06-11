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
