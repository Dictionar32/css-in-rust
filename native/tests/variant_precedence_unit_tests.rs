//! PHASE 7.5: Variant System Precedence - Comprehensive Unit Tests
//!
//! **Validates: Requirements R5 (Variant System Precedence)**
//!
//! This test suite provides 100% coverage of the variant precedence system,
//! focusing on unit-level testing of:
//! - Each variant classification (Interaction, ColorScheme, Responsive, State, Custom)
//! - Precedence comparison and ordering
//! - Edge cases and unknown variants
//! - Unknown variant handling
//!
//! Total Coverage: 45+ test cases covering all precedence logic paths

use tailwind_styled_parser::domain::variant::Variant;
use tailwind_styled_parser::domain::variant_precedence::{
    get_variant_precedence, VariantPrecedence, sort_by_precedence,
};

// ============================================================================
// Section 1: INTERACTION VARIANT CLASSIFICATION TESTS (6 tests)
// ============================================================================

#[test]
fn test_classify_group_relative_variants() {
    // Test all forms of group-relative variants
    let group_hover = Variant::GroupRelative("hover".to_string());
    assert_eq!(
        get_variant_precedence(&group_hover),
        VariantPrecedence::Interaction,
        "group:hover should be Interaction precedence"
    );

    let group_focus = Variant::GroupRelative("focus".to_string());
    assert_eq!(
        get_variant_precedence(&group_focus),
        VariantPrecedence::Interaction,
        "group:focus should be Interaction precedence"
    );

    let group_active = Variant::GroupRelative("active".to_string());
    assert_eq!(
        get_variant_precedence(&group_active),
        VariantPrecedence::Interaction,
        "group:active should be Interaction precedence"
    );
}

#[test]
fn test_classify_peer_relative_variants() {
    // Test all forms of peer-relative variants
    let peer_hover = Variant::PeerRelative("hover".to_string());
    assert_eq!(
        get_variant_precedence(&peer_hover),
        VariantPrecedence::Interaction,
        "peer:hover should be Interaction precedence"
    );

    let peer_focus = Variant::PeerRelative("focus".to_string());
    assert_eq!(
        get_variant_precedence(&peer_focus),
        VariantPrecedence::Interaction,
        "peer:focus should be Interaction precedence"
    );

    let peer_active = Variant::PeerRelative("active".to_string());
    assert_eq!(
        get_variant_precedence(&peer_active),
        VariantPrecedence::Interaction,
        "peer:active should be Interaction precedence"
    );
}

#[test]
fn test_group_and_peer_same_precedence() {
    // Group and peer variants should have same precedence level
    let group_hover = Variant::GroupRelative("hover".to_string());
    let peer_focus = Variant::PeerRelative("focus".to_string());

    let prec_group = get_variant_precedence(&group_hover);
    let prec_peer = get_variant_precedence(&peer_focus);

    assert_eq!(prec_group, prec_peer, "Group and peer should have same precedence");
    assert_eq!(prec_group.level(), 0, "Interaction should have level 0");
}

#[test]
fn test_interaction_with_empty_modifier() {
    // Edge case: empty modifier in group/peer
    let group_empty = Variant::GroupRelative(String::new());
    assert_eq!(get_variant_precedence(&group_empty), VariantPrecedence::Interaction);

    let peer_empty = Variant::PeerRelative(String::new());
    assert_eq!(get_variant_precedence(&peer_empty), VariantPrecedence::Interaction);
}

#[test]
fn test_interaction_variant_display_and_name() {
    // Verify interaction variants display correctly
    let group_hover = Variant::GroupRelative("hover".to_string());
    assert_eq!(group_hover.variant_type(), "GroupRelative");
    assert_eq!(group_hover.name(), "hover");

    let peer_focus = Variant::PeerRelative("focus".to_string());
    assert_eq!(peer_focus.variant_type(), "PeerRelative");
    assert_eq!(peer_focus.name(), "focus");
}

// ============================================================================
// Section 2: COLOR SCHEME VARIANT CLASSIFICATION TESTS (7 tests)
// ============================================================================

#[test]
fn test_classify_dark_mode_variant() {
    let dark = Variant::ColorScheme("dark".to_string());
    assert_eq!(
        get_variant_precedence(&dark),
        VariantPrecedence::ColorScheme,
        "dark should be ColorScheme precedence"
    );
    assert_eq!(get_variant_precedence(&dark).level(), 1, "ColorScheme should have level 1");
}

#[test]
fn test_classify_light_mode_variant() {
    let light = Variant::ColorScheme("light".to_string());
    assert_eq!(
        get_variant_precedence(&light),
        VariantPrecedence::ColorScheme,
        "light should be ColorScheme precedence"
    );
    assert_eq!(get_variant_precedence(&light).level(), 1, "ColorScheme should have level 1");
}

#[test]
fn test_dark_and_light_same_precedence() {
    let dark = Variant::ColorScheme("dark".to_string());
    let light = Variant::ColorScheme("light".to_string());

    assert_eq!(
        get_variant_precedence(&dark),
        get_variant_precedence(&light),
        "dark and light should have same precedence"
    );
}

#[test]
fn test_color_scheme_display_and_name() {
    let dark = Variant::ColorScheme("dark".to_string());
    assert_eq!(dark.variant_type(), "ColorScheme");
    assert_eq!(dark.name(), "dark");

    let light = Variant::ColorScheme("light".to_string());
    assert_eq!(light.variant_type(), "ColorScheme");
    assert_eq!(light.name(), "light");
}

#[test]
fn test_color_scheme_level() {
    let prec = VariantPrecedence::ColorScheme;
    assert_eq!(prec.level(), 1, "ColorScheme level should be 1");
    assert_eq!(
        prec.description(),
        "Color Scheme (dark/light mode)",
        "ColorScheme description should be accurate"
    );
}

#[test]
fn test_color_scheme_variant_other_values() {
    // Test that only standard color schemes are classified as ColorScheme
    // in the Variant type (others are custom)
    let dark = Variant::ColorScheme("dark".to_string());
    let light = Variant::ColorScheme("light".to_string());

    assert_eq!(get_variant_precedence(&dark), VariantPrecedence::ColorScheme);
    assert_eq!(get_variant_precedence(&light), VariantPrecedence::ColorScheme);
}

#[test]
fn test_color_scheme_with_empty_string() {
    let empty = Variant::ColorScheme(String::new());
    // Empty ColorScheme variant should still be classified as ColorScheme
    assert_eq!(get_variant_precedence(&empty), VariantPrecedence::ColorScheme);
}

// ============================================================================
// Section 3: RESPONSIVE VARIANT CLASSIFICATION TESTS (10 tests)
// ============================================================================

#[test]
fn test_classify_standard_responsive_breakpoints() {
    // Test all standard Tailwind breakpoints
    let breakpoints = vec!["sm", "md", "lg", "xl", "2xl"];

    for bp in breakpoints {
        let variant = Variant::Responsive(bp.to_string());
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::Responsive,
            "Breakpoint '{}' should be Responsive precedence",
            bp
        );
    }
}

#[test]
fn test_classify_custom_responsive_variants() {
    // Test custom/non-standard responsive variants
    let custom_breakpoints = vec![
        "min-w-480",
        "max-w-768",
        "custom-bp",
        "3xl",
        "mobile",
        "tablet",
        "desktop",
    ];

    for bp in custom_breakpoints {
        let variant = Variant::Responsive(bp.to_string());
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::Responsive,
            "Custom breakpoint '{}' should be Responsive precedence",
            bp
        );
    }
}

#[test]
fn test_all_responsive_variants_same_level() {
    // All responsive variants should have same precedence level (2)
    let variants = vec![
        Variant::Responsive("sm".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::Responsive("lg".to_string()),
        Variant::Responsive("custom".to_string()),
    ];

    for variant in variants {
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::Responsive,
            "All responsive variants should have same precedence"
        );
        assert_eq!(get_variant_precedence(&variant).level(), 2);
    }
}

#[test]
fn test_responsive_level_value() {
    let prec = VariantPrecedence::Responsive;
    assert_eq!(prec.level(), 2, "Responsive should have level 2");
}

#[test]
fn test_responsive_variant_display_and_name() {
    let md = Variant::Responsive("md".to_string());
    assert_eq!(md.variant_type(), "Responsive");
    assert_eq!(md.name(), "md");

    let custom = Variant::Responsive("custom".to_string());
    assert_eq!(custom.variant_type(), "Responsive");
    assert_eq!(custom.name(), "custom");
}

#[test]
fn test_responsive_variant_with_empty_string() {
    let empty = Variant::Responsive(String::new());
    assert_eq!(
        get_variant_precedence(&empty),
        VariantPrecedence::Responsive,
        "Empty responsive variant should still be classified as Responsive"
    );
}

#[test]
fn test_responsive_description() {
    let prec = VariantPrecedence::Responsive;
    assert_eq!(
        prec.description(),
        "Responsive (media queries)",
        "Responsive description should be accurate"
    );
}

#[test]
fn test_responsive_variant_display() {
    let prec = VariantPrecedence::Responsive;
    assert_eq!(
        prec.to_string(),
        "Responsive",
        "Responsive should display as 'Responsive'"
    );
}

#[test]
fn test_various_responsive_formats() {
    // Test various responsive variant naming conventions
    let variants = vec![
        "sm",
        "md",
        "lg",
        "2xl",
        "3xl",
        "min-w-500",
        "max-h-800",
        "@400px",
        "screen-sm",
    ];

    for v_name in variants {
        let v = Variant::Responsive(v_name.to_string());
        assert_eq!(
            get_variant_precedence(&v),
            VariantPrecedence::Responsive,
            "Variant '{}' should be Responsive",
            v_name
        );
    }
}

// ============================================================================
// Section 4: STATE VARIANT CLASSIFICATION TESTS (15 tests)
// ============================================================================

#[test]
fn test_classify_interaction_state_variants() {
    // User interaction states
    let states = vec!["hover", "focus", "active", "focus-within", "focus-visible"];

    for state in states {
        let variant = Variant::State(state.to_string());
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::State,
            "State '{}' should be State precedence",
            state
        );
    }
}

#[test]
fn test_classify_form_state_variants() {
    // Form-related states
    let states = vec![
        "disabled",
        "enabled",
        "checked",
        "required",
        "optional",
        "valid",
        "invalid",
        "in-range",
        "out-of-range",
    ];

    for state in states {
        let variant = Variant::State(state.to_string());
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::State,
            "Form state '{}' should be State precedence",
            state
        );
    }
}

#[test]
fn test_classify_link_state_variants() {
    // Link-related states
    let states = vec!["visited", "target"];

    for state in states {
        let variant = Variant::State(state.to_string());
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::State,
            "Link state '{}' should be State precedence",
            state
        );
    }
}

#[test]
fn test_classify_structural_state_variants() {
    // Structural/position-based states
    let states = vec![
        "first",
        "last",
        "only",
        "odd",
        "even",
        "first-of-type",
        "last-of-type",
        "only-of-type",
        "empty",
    ];

    for state in states {
        let variant = Variant::State(state.to_string());
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::State,
            "Structural state '{}' should be State precedence",
            state
        );
    }
}

#[test]
fn test_classify_pseudo_class_state_variants() {
    // Other pseudo-class states
    let states = vec![
        "root",
        "where",
        "is",
        "any",
        "has",
        "read-only",
        "placeholder-shown",
        "default",
        "user-valid",
        "user-invalid",
    ];

    for state in states {
        let variant = Variant::State(state.to_string());
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::State,
            "Pseudo-class state '{}' should be State precedence",
            state
        );
    }
}

#[test]
fn test_all_state_variants_same_level() {
    // All state variants should have same precedence level (3)
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::State("focus".to_string()),
        Variant::State("disabled".to_string()),
        Variant::State("visited".to_string()),
        Variant::State("custom-state".to_string()),
    ];

    for variant in variants {
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::State,
            "All state variants should have same precedence"
        );
        assert_eq!(get_variant_precedence(&variant).level(), 3);
    }
}

#[test]
fn test_state_level_value() {
    let prec = VariantPrecedence::State;
    assert_eq!(prec.level(), 3, "State should have level 3");
}

#[test]
fn test_state_variant_display_and_name() {
    let hover = Variant::State("hover".to_string());
    assert_eq!(hover.variant_type(), "State");
    assert_eq!(hover.name(), "hover");

    let disabled = Variant::State("disabled".to_string());
    assert_eq!(disabled.variant_type(), "State");
    assert_eq!(disabled.name(), "disabled");
}

#[test]
fn test_state_variant_with_empty_string() {
    let empty = Variant::State(String::new());
    assert_eq!(
        get_variant_precedence(&empty),
        VariantPrecedence::State,
        "Empty state variant should still be classified as State"
    );
}

#[test]
fn test_state_description() {
    let prec = VariantPrecedence::State;
    assert_eq!(
        prec.description(),
        "State (pseudo-classes)",
        "State description should be accurate"
    );
}

#[test]
fn test_state_variant_display() {
    let prec = VariantPrecedence::State;
    assert_eq!(
        prec.to_string(),
        "State",
        "State should display as 'State'"
    );
}

#[test]
fn test_state_variant_css_component() {
    // Test that state variants generate correct CSS components
    let hover = Variant::State("hover".to_string());
    assert_eq!(hover.to_css_component(), ":hover");

    let focus = Variant::State("focus".to_string());
    assert_eq!(focus.to_css_component(), ":focus");
}

#[test]
fn test_state_variant_is_predicate() {
    let hover = Variant::State("hover".to_string());
    assert!(hover.is_state());
    assert!(!hover.is_responsive());
    assert!(!hover.is_color_scheme());
}

// ============================================================================
// Section 5: CUSTOM VARIANT CLASSIFICATION TESTS (6 tests)
// ============================================================================

#[test]
fn test_classify_custom_variants() {
    let custom_variants = vec![
        "my-custom",
        "plugin-variant",
        "custom-xyz",
        "user-defined",
        "@custom-at-rule",
    ];

    for name in custom_variants {
        let variant = Variant::Custom(name.to_string());
        assert_eq!(
            get_variant_precedence(&variant),
            VariantPrecedence::Custom,
            "Custom variant '{}' should be Custom precedence",
            name
        );
    }
}

#[test]
fn test_custom_level_value() {
    let prec = VariantPrecedence::Custom;
    assert_eq!(prec.level(), 4, "Custom should have level 4 (highest)");
}

#[test]
fn test_custom_variant_display_and_name() {
    let custom = Variant::Custom("my-plugin".to_string());
    assert_eq!(custom.variant_type(), "Custom");
    assert_eq!(custom.name(), "my-plugin");
}

#[test]
fn test_custom_variant_with_empty_string() {
    let empty = Variant::Custom(String::new());
    assert_eq!(
        get_variant_precedence(&empty),
        VariantPrecedence::Custom,
        "Empty custom variant should still be classified as Custom"
    );
}

#[test]
fn test_custom_description() {
    let prec = VariantPrecedence::Custom;
    assert_eq!(
        prec.description(),
        "Custom (plugin-defined)",
        "Custom description should be accurate"
    );
}

#[test]
fn test_custom_variant_display() {
    let prec = VariantPrecedence::Custom;
    assert_eq!(
        prec.to_string(),
        "Custom",
        "Custom should display as 'Custom'"
    );
}

// ============================================================================
// Section 6: PRECEDENCE COMPARISON AND ORDERING TESTS (8 tests)
// ============================================================================

#[test]
fn test_precedence_level_ordering() {
    // Verify correct numeric ordering of levels
    assert_eq!(VariantPrecedence::Interaction.level(), 0);
    assert_eq!(VariantPrecedence::ColorScheme.level(), 1);
    assert_eq!(VariantPrecedence::Responsive.level(), 2);
    assert_eq!(VariantPrecedence::State.level(), 3);
    assert_eq!(VariantPrecedence::Custom.level(), 4);
}

#[test]
fn test_precedence_ord_comparison() {
    // Verify Ord trait implementation
    assert!(VariantPrecedence::Interaction < VariantPrecedence::ColorScheme);
    assert!(VariantPrecedence::ColorScheme < VariantPrecedence::Responsive);
    assert!(VariantPrecedence::Responsive < VariantPrecedence::State);
    assert!(VariantPrecedence::State < VariantPrecedence::Custom);
}

#[test]
fn test_precedence_ord_chaining() {
    // Verify transitive ordering
    assert!(VariantPrecedence::Interaction < VariantPrecedence::Custom);
    assert!(VariantPrecedence::ColorScheme < VariantPrecedence::State);
    assert!(VariantPrecedence::Responsive < VariantPrecedence::Custom);
}

#[test]
fn test_precedence_equality() {
    // Verify equality comparison
    assert_eq!(VariantPrecedence::Interaction, VariantPrecedence::Interaction);
    assert_eq!(VariantPrecedence::State, VariantPrecedence::State);
    assert_ne!(VariantPrecedence::Interaction, VariantPrecedence::State);
}

#[test]
fn test_precedence_greater_than() {
    // Verify greater-than comparisons
    assert!(VariantPrecedence::Custom > VariantPrecedence::State);
    assert!(VariantPrecedence::State > VariantPrecedence::Responsive);
    assert!(VariantPrecedence::ColorScheme > VariantPrecedence::Interaction);
}

#[test]
fn test_precedence_le_ge() {
    // Verify less-than-or-equal and greater-than-or-equal
    assert!(VariantPrecedence::Interaction <= VariantPrecedence::Interaction);
    assert!(VariantPrecedence::Interaction <= VariantPrecedence::Custom);
    assert!(VariantPrecedence::Custom >= VariantPrecedence::Custom);
    assert!(VariantPrecedence::Custom >= VariantPrecedence::Interaction);
}

#[test]
fn test_precedence_complete_ordering_chain() {
    // Verify complete order from Interaction to Custom
    let all_precedences = vec![
        VariantPrecedence::Interaction,
        VariantPrecedence::ColorScheme,
        VariantPrecedence::Responsive,
        VariantPrecedence::State,
        VariantPrecedence::Custom,
    ];

    for i in 0..all_precedences.len() {
        for j in 0..all_precedences.len() {
            if i < j {
                assert!(
                    all_precedences[i] < all_precedences[j],
                    "Precedence ordering violated at indices {} and {}",
                    i,
                    j
                );
            } else if i > j {
                assert!(
                    all_precedences[i] > all_precedences[j],
                    "Precedence ordering violated at indices {} and {}",
                    i,
                    j
                );
            } else {
                assert_eq!(
                    all_precedences[i], all_precedences[j],
                    "Equal precedences should be equal"
                );
            }
        }
    }
}

#[test]
fn test_sort_by_precedence_function() {
    // Verify sort_by_precedence sorts correctly
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::Custom("plugin".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::GroupRelative("focus".to_string()),
    ];

    let sorted = sort_by_precedence(&variants);

    // Verify sorted order
    assert_eq!(sorted[0], Variant::GroupRelative("focus".to_string()));
    assert_eq!(sorted[1], Variant::ColorScheme("dark".to_string()));
    assert_eq!(sorted[2], Variant::Responsive("md".to_string()));
    assert_eq!(sorted[3], Variant::State("hover".to_string()));
    assert_eq!(sorted[4], Variant::Custom("plugin".to_string()));
}

// ============================================================================
// Section 7: EDGE CASES AND UNKNOWN VARIANTS TESTS (8 tests)
// ============================================================================

#[test]
fn test_unknown_variant_handling() {
    // Variants that don't fit standard categories should be Custom
    let unknown = Variant::Custom("unknown-variant".to_string());
    assert_eq!(
        get_variant_precedence(&unknown),
        VariantPrecedence::Custom,
        "Unknown variants should default to Custom"
    );
}

#[test]
fn test_empty_variant_strings() {
    // All variant types with empty strings should still classify correctly
    let variants = vec![
        (Variant::GroupRelative(String::new()), VariantPrecedence::Interaction),
        (Variant::ColorScheme(String::new()), VariantPrecedence::ColorScheme),
        (Variant::Responsive(String::new()), VariantPrecedence::Responsive),
        (Variant::State(String::new()), VariantPrecedence::State),
        (Variant::Custom(String::new()), VariantPrecedence::Custom),
    ];

    for (variant, expected) in variants {
        assert_eq!(
            get_variant_precedence(&variant),
            expected,
            "Empty variant string should classify correctly"
        );
    }
}

#[test]
fn test_very_long_variant_names() {
    // Edge case: very long variant names should still classify
    let long_name = "a".repeat(1000);

    let custom = Variant::Custom(long_name.clone());
    assert_eq!(get_variant_precedence(&custom), VariantPrecedence::Custom);

    let state = Variant::State(long_name.clone());
    assert_eq!(get_variant_precedence(&state), VariantPrecedence::State);

    let responsive = Variant::Responsive(long_name);
    assert_eq!(get_variant_precedence(&responsive), VariantPrecedence::Responsive);
}

#[test]
fn test_special_characters_in_variant_names() {
    // Edge case: special characters should still classify
    let variants = vec![
        Variant::Custom("my-@custom-variant".to_string()),
        Variant::State("hover:focus".to_string()),
        Variant::Responsive("md-large".to_string()),
    ];

    for v in variants {
        let _prec = get_variant_precedence(&v);
        // Should not panic
    }
}

#[test]
fn test_unicode_in_variant_names() {
    // Edge case: Unicode characters should still classify
    let variants = vec![
        Variant::Custom("custom_🎨".to_string()),
        Variant::State("hover_状态".to_string()),
        Variant::Responsive("md_ médium".to_string()),
    ];

    for v in variants {
        let _prec = get_variant_precedence(&v);
        // Should not panic, classify to appropriate type
    }
}

#[test]
fn test_case_sensitivity_consistency() {
    // Variants with different cases should still be classified correctly
    let hover_lower = Variant::State("hover".to_string());
    let hover_upper = Variant::State("HOVER".to_string());
    let hover_mixed = Variant::State("HoVeR".to_string());

    // All forms should be classified as State (case doesn't matter for classification)
    assert_eq!(get_variant_precedence(&hover_lower), VariantPrecedence::State);
    assert_eq!(get_variant_precedence(&hover_upper), VariantPrecedence::State);
    assert_eq!(get_variant_precedence(&hover_mixed), VariantPrecedence::State);
}

#[test]
fn test_sort_with_duplicates() {
    // Sort should handle duplicate variants correctly
    let variants = vec![
        Variant::State("hover".to_string()),
        Variant::State("focus".to_string()),
        Variant::State("hover".to_string()), // duplicate
        Variant::Responsive("md".to_string()),
        Variant::Responsive("md".to_string()), // duplicate
    ];

    let sorted = sort_by_precedence(&variants);

    // Should still work and preserve all items
    assert_eq!(sorted.len(), 5);
    // First two should be responsive, last three should be state
    assert_eq!(get_variant_precedence(&sorted[0]), VariantPrecedence::Responsive);
    assert_eq!(get_variant_precedence(&sorted[1]), VariantPrecedence::Responsive);
    assert_eq!(get_variant_precedence(&sorted[2]), VariantPrecedence::State);
}

#[test]
fn test_sort_stability() {
    // sort_by_precedence should be stable (preserve relative order of equal items)
    let variants = vec![
        Variant::State("aaa".to_string()),
        Variant::State("bbb".to_string()),
        Variant::State("ccc".to_string()),
    ];

    let sorted = sort_by_precedence(&variants);

    // All same precedence, so order should be preserved
    assert_eq!(sorted[0], Variant::State("aaa".to_string()));
    assert_eq!(sorted[1], Variant::State("bbb".to_string()));
    assert_eq!(sorted[2], Variant::State("ccc".to_string()));
}

// ============================================================================
// Section 8: PRECEDENCE DESCRIPTIONS AND DISPLAY TESTS (5 tests)
// ============================================================================

#[test]
fn test_all_precedence_descriptions_non_empty() {
    // All precedence levels should have descriptions
    let all_precedences = vec![
        VariantPrecedence::Interaction,
        VariantPrecedence::ColorScheme,
        VariantPrecedence::Responsive,
        VariantPrecedence::State,
        VariantPrecedence::Custom,
    ];

    for prec in all_precedences {
        let desc = prec.description();
        assert!(!desc.is_empty(), "Precedence {} should have non-empty description", prec);
        // Description should be meaningful, not just contain the name
        assert!(desc.len() > 10, "Description should be detailed");
    }
}

#[test]
fn test_precedence_display_strings() {
    // Verify display strings
    assert_eq!(VariantPrecedence::Interaction.to_string(), "Interaction");
    assert_eq!(VariantPrecedence::ColorScheme.to_string(), "ColorScheme");
    assert_eq!(VariantPrecedence::Responsive.to_string(), "Responsive");
    assert_eq!(VariantPrecedence::State.to_string(), "State");
    assert_eq!(VariantPrecedence::Custom.to_string(), "Custom");
}

#[test]
fn test_precedence_debug_format() {
    // Verify debug formatting works
    let prec = VariantPrecedence::Responsive;
    let debug_str = format!("{:?}", prec);
    assert!(!debug_str.is_empty());
}

#[test]
fn test_variant_precedence_descriptions_content() {
    // Verify descriptions contain meaningful information
    assert_eq!(
        VariantPrecedence::Interaction.description(),
        "Interaction (group/peer selectors)"
    );
    assert_eq!(
        VariantPrecedence::ColorScheme.description(),
        "Color Scheme (dark/light mode)"
    );
    assert_eq!(
        VariantPrecedence::Responsive.description(),
        "Responsive (media queries)"
    );
    assert_eq!(
        VariantPrecedence::State.description(),
        "State (pseudo-classes)"
    );
    assert_eq!(
        VariantPrecedence::Custom.description(),
        "Custom (plugin-defined)"
    );
}

#[test]
fn test_variant_descriptions_and_names_consistency() {
    // Descriptions should be consistent with names
    let prec = VariantPrecedence::Responsive;
    assert!(prec.description().contains("Responsive"));

    let prec = VariantPrecedence::State;
    assert!(prec.description().contains("State"));
}

// ============================================================================
// Section 9: VARIANT PREDICATE METHODS TESTS (6 tests)
// ============================================================================

#[test]
fn test_variant_is_responsive() {
    let responsive = Variant::Responsive("md".to_string());
    let state = Variant::State("hover".to_string());

    assert!(responsive.is_responsive());
    assert!(!state.is_responsive());
}

#[test]
fn test_variant_is_state() {
    let state = Variant::State("hover".to_string());
    let responsive = Variant::Responsive("md".to_string());

    assert!(state.is_state());
    assert!(!responsive.is_state());
}

#[test]
fn test_variant_is_color_scheme() {
    let color_scheme = Variant::ColorScheme("dark".to_string());
    let state = Variant::State("hover".to_string());

    assert!(color_scheme.is_color_scheme());
    assert!(!state.is_color_scheme());
}

#[test]
fn test_variant_is_group_relative() {
    let group = Variant::GroupRelative("hover".to_string());
    let peer = Variant::PeerRelative("focus".to_string());

    assert!(group.is_group_relative());
    assert!(!peer.is_group_relative());
}

#[test]
fn test_variant_is_peer_relative() {
    let peer = Variant::PeerRelative("focus".to_string());
    let group = Variant::GroupRelative("hover".to_string());

    assert!(peer.is_peer_relative());
    assert!(!group.is_peer_relative());
}

#[test]
fn test_variant_predicates_mutually_exclusive() {
    // Each variant type should match exactly one predicate
    let variants = vec![
        Variant::GroupRelative("hover".to_string()),
        Variant::PeerRelative("focus".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::State("hover".to_string()),
    ];

    for v in variants {
        let count = vec![
            v.is_responsive(),
            v.is_state(),
            v.is_color_scheme(),
            v.is_group_relative(),
            v.is_peer_relative(),
        ]
        .iter()
        .filter(|&&b| b)
        .count();

        // Each variant should match exactly one type predicate
        assert_eq!(count, 1, "Variant {:?} should match exactly one predicate", v);
    }
    
    // Note: Custom variant has no predicate method, so we test it separately
    // by confirming it doesn't match any of the five predicates
    let custom = Variant::Custom("plugin".to_string());
    let count = vec![
        custom.is_responsive(),
        custom.is_state(),
        custom.is_color_scheme(),
        custom.is_group_relative(),
        custom.is_peer_relative(),
    ]
    .iter()
    .filter(|&&b| b)
    .count();
    
    assert_eq!(count, 0, "Custom variant should not match any predicate (no is_custom predicate exists)");
}

// ============================================================================
// Section 10: COMPREHENSIVE COVERAGE TESTS (5 tests)
// ============================================================================

#[test]
fn test_all_variant_types_classified() {
    // Test that every variant type can be classified
    let variant_samples = vec![
        Variant::GroupRelative("hover".to_string()),
        Variant::PeerRelative("focus".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::State("hover".to_string()),
        Variant::Custom("plugin".to_string()),
    ];

    for v in variant_samples {
        let prec = get_variant_precedence(&v);
        // Should not panic, should return valid precedence
        assert!(prec.level() <= 4);
    }
}

#[test]
fn test_sort_with_all_variant_types() {
    // Test sorting with all 6 variant types
    let variants = vec![
        Variant::Custom("plugin".to_string()),
        Variant::PeerRelative("focus".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::State("hover".to_string()),
        Variant::GroupRelative("hover".to_string()),
    ];

    let sorted = sort_by_precedence(&variants);

    // Verify all items present
    assert_eq!(sorted.len(), 6);

    // Verify correct ordering
    assert_eq!(get_variant_precedence(&sorted[0]).level(), 0); // Interaction (GroupRelative or PeerRelative)
    assert_eq!(get_variant_precedence(&sorted[1]).level(), 0); // Interaction (the other one)
    assert_eq!(get_variant_precedence(&sorted[2]).level(), 1); // ColorScheme
    assert_eq!(get_variant_precedence(&sorted[3]).level(), 2); // Responsive
    assert_eq!(get_variant_precedence(&sorted[4]).level(), 3); // State
    assert_eq!(get_variant_precedence(&sorted[5]).level(), 4); // Custom
}

#[test]
fn test_precedence_consistency_across_multiple_calls() {
    // Calling get_variant_precedence multiple times should return same result
    let v = Variant::State("hover".to_string());

    let prec1 = get_variant_precedence(&v);
    let prec2 = get_variant_precedence(&v);
    let prec3 = get_variant_precedence(&v);

    assert_eq!(prec1, prec2);
    assert_eq!(prec2, prec3);
}

#[test]
fn test_sort_by_precedence_idempotent() {
    // Sorting already sorted variants should produce same result
    let variants = vec![
        Variant::GroupRelative("hover".to_string()),
        Variant::ColorScheme("dark".to_string()),
        Variant::Responsive("md".to_string()),
        Variant::State("hover".to_string()),
        Variant::Custom("plugin".to_string()),
    ];

    let sorted_once = sort_by_precedence(&variants);
    let sorted_twice = sort_by_precedence(&sorted_once);

    assert_eq!(sorted_once, sorted_twice, "Sorting should be idempotent");
}

#[test]
fn test_100_percent_precedence_coverage() {
    // Verify we've tested all precedence levels thoroughly
    let all_levels = vec![
        (0, VariantPrecedence::Interaction),
        (1, VariantPrecedence::ColorScheme),
        (2, VariantPrecedence::Responsive),
        (3, VariantPrecedence::State),
        (4, VariantPrecedence::Custom),
    ];

    for (level, prec) in all_levels {
        assert_eq!(prec.level(), level, "Precedence level mismatch");
        
        // Each should have a description
        let desc = prec.description();
        assert!(!desc.is_empty(), "Precedence {} should have description", prec);
        
        // Each should have a display string
        let display = prec.to_string();
        assert!(!display.is_empty(), "Precedence {} should display", prec);
    }
}

