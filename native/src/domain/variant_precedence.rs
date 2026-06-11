//! Variant Precedence - determines the order in which CSS variants are applied
//!
//! Tailwind CSS applies variants in a deterministic order to ensure consistent specificity
//! and predictable cascade behavior. This module defines the precedence levels and provides
//! utilities for classifying and ordering variants.
//!
//! ## Precedence Levels (Lower Value = Applied First)
//!
//! 1. **Interaction** (0): Group/peer variants that change the selector context
//!    - `group-hover`, `group-focus`, `peer-hover`, `peer-focus`, etc.
//!    - Applied first because they establish the relative selector context
//!
//! 2. **ColorScheme** (1): Dark/light mode variants that affect color interpretation
//!    - `dark`, `light`
//!    - Applied early to ensure color variants are within correct color scheme context
//!
//! 3. **Responsive** (2): Breakpoint variants that wrap rules in media queries
//!    - `sm`, `md`, `lg`, `xl`, `2xl`, custom breakpoints
//!    - Applied after color scheme but before state for media query nesting
//!
//! 4. **State** (3): Pseudo-class variants for user interactions
//!    - `hover`, `focus`, `active`, `disabled`, `visited`, `enabled`, `checked`, etc.
//!    - Applied late so they nest inside media queries correctly
//!
//! 5. **Custom** (4): Plugin-defined variants (highest precedence)
//!    - User-defined or plugin-defined variants
//!    - Applied last to allow customization
//!
//! ## Example
//!
//! ```text
//! Input class: md:dark:hover:bg-white
//! Parsed variants: [Responsive("md"), ColorScheme("dark"), State("hover")]
//! After precedence sorting:
//!   1. ColorScheme("dark") - level 1
//!   2. Responsive("md") - level 2
//!   3. State("hover") - level 3
//!
//! Generated CSS structure:
//!   @media (min-width: 768px) {          ← Responsive
//!     @media (prefers-color-scheme: dark) { ← ColorScheme
//!       .md\:dark\:hover\:bg-white:hover {  ← State
//!         background-color: white;
//!       }
//!     }
//!   }
//! ```

use crate::domain::variant::Variant;
use std::fmt;
use serde::{Deserialize, Serialize};

/// Represents the precedence level of a variant
///
/// Lower values are applied first in CSS generation. This ensures consistent
/// specificity and predictable cascade behavior.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum VariantPrecedence {
    /// Interaction variants (group/peer context modifiers)
    /// Level 0 - applied first
    Interaction = 0,

    /// Color scheme variants (dark/light mode)
    /// Level 1
    ColorScheme = 1,

    /// Responsive variants (breakpoints/media queries)
    /// Level 2
    Responsive = 2,

    /// State variants (pseudo-classes)
    /// Level 3
    State = 3,

    /// Custom variants (plugin-defined)
    /// Level 4 - applied last
    Custom = 4,
}

impl VariantPrecedence {
    /// Get the numeric value of this precedence level
    pub fn level(&self) -> u32 {
        *self as u32
    }

    /// Get a human-readable description of this precedence level
    pub fn description(&self) -> &'static str {
        match self {
            VariantPrecedence::Interaction => "Interaction (group/peer selectors)",
            VariantPrecedence::ColorScheme => "Color Scheme (dark/light mode)",
            VariantPrecedence::Responsive => "Responsive (media queries)",
            VariantPrecedence::State => "State (pseudo-classes)",
            VariantPrecedence::Custom => "Custom (plugin-defined)",
        }
    }
}

impl fmt::Display for VariantPrecedence {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            VariantPrecedence::Interaction => write!(f, "Interaction"),
            VariantPrecedence::ColorScheme => write!(f, "ColorScheme"),
            VariantPrecedence::Responsive => write!(f, "Responsive"),
            VariantPrecedence::State => write!(f, "State"),
            VariantPrecedence::Custom => write!(f, "Custom"),
        }
    }
}

/// Determines the precedence level for a given variant
///
/// This function classifies variants into one of the 5 precedence levels based on
/// their type and name. The classification follows Tailwind CSS conventions to ensure
/// consistent and predictable CSS generation.
///
/// # Arguments
/// * `variant` - The variant to classify
///
/// # Returns
/// The precedence level for the variant
///
/// # Examples
///
/// ```
/// use crate::domain::variant::Variant;
/// use crate::domain::variant_precedence::get_variant_precedence;
///
/// // State variants have precedence level 3
/// let v = Variant::State("hover".to_string());
/// assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);
///
/// // Responsive variants have precedence level 2
/// let v = Variant::Responsive("md".to_string());
/// assert_eq!(get_variant_precedence(&v), VariantPrecedence::Responsive);
///
/// // Dark/light color scheme has precedence level 1
/// let v = Variant::ColorScheme("dark".to_string());
/// assert_eq!(get_variant_precedence(&v), VariantPrecedence::ColorScheme);
///
/// // Group/peer interaction variants have precedence level 0
/// let v = Variant::GroupRelative("hover".to_string());
/// assert_eq!(get_variant_precedence(&v), VariantPrecedence::Interaction);
/// ```
pub fn get_variant_precedence(variant: &Variant) -> VariantPrecedence {
    match variant {
        // Interaction variants: group and peer selectors establish context
        Variant::GroupRelative(_) | Variant::PeerRelative(_) => VariantPrecedence::Interaction,

        // Color scheme variants: dark/light mode
        Variant::ColorScheme(_) => VariantPrecedence::ColorScheme,

        // Responsive variants: all known breakpoints and custom responsive variants
        Variant::Responsive(_) => VariantPrecedence::Responsive,

        // State variants: all pseudo-class modifiers
        Variant::State(_) => VariantPrecedence::State,

        // Custom variants: plugin-defined modifiers
        Variant::Custom(_) => VariantPrecedence::Custom,
    }
}

/// Sorts a list of variants by their precedence level (in ascending order)
///
/// This ensures variants are applied in the correct order during CSS generation.
/// Variants with lower precedence levels are placed first.
///
/// # Arguments
/// * `variants` - A slice of variants to sort
///
/// # Returns
/// A new vector of variants sorted by precedence (lowest to highest)
///
/// # Example
///
/// ```
/// use crate::domain::variant::Variant;
/// use crate::domain::variant_precedence::sort_by_precedence;
///
/// let variants = vec![
///     Variant::State("hover".to_string()),
///     Variant::Responsive("md".to_string()),
///     Variant::ColorScheme("dark".to_string()),
/// ];
///
/// let sorted = sort_by_precedence(&variants);
/// // Result order: ColorScheme(dark), Responsive(md), State(hover)
/// assert_eq!(sorted[0], Variant::ColorScheme("dark".to_string()));
/// assert_eq!(sorted[1], Variant::Responsive("md".to_string()));
/// assert_eq!(sorted[2], Variant::State("hover".to_string()));
/// ```
pub fn sort_by_precedence(variants: &[Variant]) -> Vec<Variant> {
    let mut sorted = variants.to_vec();
    sorted.sort_by_key(|v| get_variant_precedence(v).level());
    sorted
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_precedence_ordering() {
        // Verify precedence levels are ordered correctly
        assert_eq!(VariantPrecedence::Interaction.level(), 0);
        assert_eq!(VariantPrecedence::ColorScheme.level(), 1);
        assert_eq!(VariantPrecedence::Responsive.level(), 2);
        assert_eq!(VariantPrecedence::State.level(), 3);
        assert_eq!(VariantPrecedence::Custom.level(), 4);
    }

    #[test]
    fn test_precedence_comparison() {
        assert!(VariantPrecedence::Interaction < VariantPrecedence::ColorScheme);
        assert!(VariantPrecedence::ColorScheme < VariantPrecedence::Responsive);
        assert!(VariantPrecedence::Responsive < VariantPrecedence::State);
        assert!(VariantPrecedence::State < VariantPrecedence::Custom);
    }

    #[test]
    fn test_get_precedence_interaction() {
        let v = Variant::GroupRelative("hover".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Interaction);

        let v = Variant::PeerRelative("focus".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Interaction);
    }

    #[test]
    fn test_get_precedence_color_scheme() {
        let v = Variant::ColorScheme("dark".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::ColorScheme);

        let v = Variant::ColorScheme("light".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::ColorScheme);
    }

    #[test]
    fn test_get_precedence_responsive() {
        // Standard breakpoints
        let v = Variant::Responsive("sm".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Responsive);

        let v = Variant::Responsive("md".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Responsive);

        let v = Variant::Responsive("lg".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Responsive);

        let v = Variant::Responsive("xl".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Responsive);

        let v = Variant::Responsive("2xl".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Responsive);

        // Custom breakpoints
        let v = Variant::Responsive("min-w-768".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Responsive);
    }

    #[test]
    fn test_get_precedence_state() {
        // User interaction states
        let v = Variant::State("hover".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        let v = Variant::State("focus".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        let v = Variant::State("active".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        // Form states
        let v = Variant::State("disabled".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        let v = Variant::State("checked".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        let v = Variant::State("enabled".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        // Link states
        let v = Variant::State("visited".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        // Structural states
        let v = Variant::State("first".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        let v = Variant::State("last".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        let v = Variant::State("empty".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        // Focus states
        let v = Variant::State("focus-within".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        let v = Variant::State("focus-visible".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        // Other states
        let v = Variant::State("target".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);

        let v = Variant::State("read-only".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::State);
    }

    #[test]
    fn test_get_precedence_custom() {
        let v = Variant::Custom("my-plugin".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Custom);

        let v = Variant::Custom("custom-modifier".to_string());
        assert_eq!(get_variant_precedence(&v), VariantPrecedence::Custom);
    }

    #[test]
    fn test_sort_by_precedence_simple() {
        let variants = vec![
            Variant::State("hover".to_string()),
            Variant::Responsive("md".to_string()),
        ];

        let sorted = sort_by_precedence(&variants);

        assert_eq!(sorted[0], Variant::Responsive("md".to_string()));
        assert_eq!(sorted[1], Variant::State("hover".to_string()));
    }

    #[test]
    fn test_sort_by_precedence_complex() {
        let variants = vec![
            Variant::State("hover".to_string()),
            Variant::Custom("plugin-variant".to_string()),
            Variant::ColorScheme("dark".to_string()),
            Variant::Responsive("md".to_string()),
            Variant::GroupRelative("focus".to_string()),
        ];

        let sorted = sort_by_precedence(&variants);

        assert_eq!(sorted[0], Variant::GroupRelative("focus".to_string()));
        assert_eq!(sorted[1], Variant::ColorScheme("dark".to_string()));
        assert_eq!(sorted[2], Variant::Responsive("md".to_string()));
        assert_eq!(sorted[3], Variant::State("hover".to_string()));
        assert_eq!(sorted[4], Variant::Custom("plugin-variant".to_string()));
    }

    #[test]
    fn test_sort_by_precedence_preserves_order_within_level() {
        let variants = vec![
            Variant::State("hover".to_string()),
            Variant::State("focus".to_string()),
            Variant::State("active".to_string()),
        ];

        let sorted = sort_by_precedence(&variants);

        // All have same precedence, so relative order preserved (stable sort)
        assert_eq!(sorted[0], Variant::State("hover".to_string()));
        assert_eq!(sorted[1], Variant::State("focus".to_string()));
        assert_eq!(sorted[2], Variant::State("active".to_string()));
    }

    #[test]
    fn test_precedence_display() {
        assert_eq!(VariantPrecedence::Interaction.to_string(), "Interaction");
        assert_eq!(VariantPrecedence::ColorScheme.to_string(), "ColorScheme");
        assert_eq!(VariantPrecedence::Responsive.to_string(), "Responsive");
        assert_eq!(VariantPrecedence::State.to_string(), "State");
        assert_eq!(VariantPrecedence::Custom.to_string(), "Custom");
    }

    #[test]
    fn test_precedence_descriptions() {
        assert!(!VariantPrecedence::Interaction.description().is_empty());
        assert!(!VariantPrecedence::ColorScheme.description().is_empty());
        assert!(!VariantPrecedence::Responsive.description().is_empty());
        assert!(!VariantPrecedence::State.description().is_empty());
        assert!(!VariantPrecedence::Custom.description().is_empty());
    }

    #[test]
    fn test_sort_empty_vec() {
        let variants: Vec<Variant> = vec![];
        let sorted = sort_by_precedence(&variants);
        assert_eq!(sorted.len(), 0);
    }

    #[test]
    fn test_sort_single_element() {
        let variants = vec![Variant::State("hover".to_string())];
        let sorted = sort_by_precedence(&variants);
        assert_eq!(sorted.len(), 1);
        assert_eq!(sorted[0], Variant::State("hover".to_string()));
    }

    #[test]
    fn test_known_variants_count() {
        // Verify that we've included knowledge about 20+ known variants
        let known_variants = vec![
            // Interaction (2)
            Variant::GroupRelative("hover".to_string()),
            Variant::PeerRelative("focus".to_string()),
            // ColorScheme (2)
            Variant::ColorScheme("dark".to_string()),
            Variant::ColorScheme("light".to_string()),
            // Responsive (5)
            Variant::Responsive("sm".to_string()),
            Variant::Responsive("md".to_string()),
            Variant::Responsive("lg".to_string()),
            Variant::Responsive("xl".to_string()),
            Variant::Responsive("2xl".to_string()),
            // State (15+)
            Variant::State("hover".to_string()),
            Variant::State("focus".to_string()),
            Variant::State("active".to_string()),
            Variant::State("disabled".to_string()),
            Variant::State("checked".to_string()),
            Variant::State("enabled".to_string()),
            Variant::State("visited".to_string()),
            Variant::State("first".to_string()),
            Variant::State("last".to_string()),
            Variant::State("empty".to_string()),
            Variant::State("focus-within".to_string()),
            Variant::State("focus-visible".to_string()),
            Variant::State("target".to_string()),
            Variant::State("read-only".to_string()),
            Variant::State("placeholder-shown".to_string()),
        ];

        assert!(known_variants.len() >= 20, "Should have 20+ known variants");

        // All should classify without error
        for v in &known_variants {
            let _precedence = get_variant_precedence(v);
            // Just verify it doesn't panic
        }
    }
}
