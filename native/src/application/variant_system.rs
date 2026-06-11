//! VariantSystem - resolves and composes Tailwind variant combinations
//!
//! This module provides functionality for composing variants in deterministic order
//! based on their precedence levels. Variants are ordered according to Tailwind CSS
//! conventions to ensure consistent CSS generation.

use crate::domain::error::VariantError;
use crate::domain::theme_config::ThemeConfig;
use crate::domain::variant::Variant;
use crate::domain::variant_precedence::{get_variant_precedence, sort_by_precedence, VariantPrecedence};

/// Manages variant resolution and composition
pub struct VariantSystem;

/// Represents a CSS component generated from a variant
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CssVariantComponent {
    /// Media query wrapping rule
    MediaQuery(String),
    /// Pseudo-class selector (e.g., ":hover")
    Selector(String),
}

/// Represents a variant with its resolved precedence level
///
/// This struct pairs a variant with its computed precedence to enable
/// deterministic ordering and composition of variants.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedVariant {
    /// The original variant
    pub variant: Variant,
    /// The computed precedence level for this variant
    pub precedence: VariantPrecedence,
}

impl ResolvedVariant {
    /// Create a new ResolvedVariant by resolving the precedence of the given variant
    ///
    /// # Arguments
    /// * `variant` - The variant to resolve
    ///
    /// # Returns
    /// A new ResolvedVariant with the variant and its determined precedence
    pub fn new(variant: Variant) -> Self {
        let precedence = get_variant_precedence(&variant);
        Self { variant, precedence }
    }

    /// Get the variant's name
    pub fn name(&self) -> &str {
        self.variant.name()
    }

    /// Get the precedence level as a numeric value
    pub fn level(&self) -> u32 {
        self.precedence.level()
    }
}

impl VariantSystem {
    /// Compose multiple variants into a deterministically ordered list
    ///
    /// This function takes a list of variants and sorts them by their precedence level,
    /// ensuring that the output is always in the same order regardless of input order.
    /// This determinism is crucial for CSS generation consistency.
    ///
    /// The ordering follows Tailwind CSS conventions:
    /// 1. Interaction (group/peer selectors)
    /// 2. ColorScheme (dark/light mode)
    /// 3. Responsive (media queries)
    /// 4. State (pseudo-classes)
    /// 5. Custom (plugin-defined)
    ///
    /// # Arguments
    /// * `variants` - A slice of unsorted variants
    ///
    /// # Returns
    /// A vector of ResolvedVariant structs sorted by precedence (lowest to highest)
    ///
    /// # Example
    ///
    /// ```
    /// use crate::domain::variant::Variant;
    /// use crate::application::variant_system::VariantSystem;
    ///
    /// let variants = vec![
    ///     Variant::State("hover".to_string()),
    ///     Variant::Responsive("md".to_string()),
    ///     Variant::ColorScheme("dark".to_string()),
    /// ];
    ///
    /// let composed = VariantSystem::compose_variants(&variants);
    ///
    /// // Order is deterministic regardless of input order
    /// assert_eq!(composed[0].variant, Variant::ColorScheme("dark".to_string()));
    /// assert_eq!(composed[1].variant, Variant::Responsive("md".to_string()));
    /// assert_eq!(composed[2].variant, Variant::State("hover".to_string()));
    /// ```
    pub fn compose_variants(variants: &[Variant]) -> Vec<ResolvedVariant> {
        // Sort variants by their precedence level
        let sorted = sort_by_precedence(variants);

        // Map to ResolvedVariant with precedence information
        sorted
            .into_iter()
            .map(ResolvedVariant::new)
            .collect()
    }

    /// Resolve all variants to their CSS components using precedence-ordered composition
    ///
    /// This function combines variant composition (precedence-based ordering) with
    /// CSS component generation. The variants are first composed into deterministic
    /// order, then converted to their CSS representations.
    ///
    /// # Arguments
    /// * `variants` - The variants to resolve
    /// * `config` - The theme configuration (for future color/spacing resolution)
    ///
    /// # Returns
    /// A Result containing VariantComponents with media queries and selectors in
    /// precedence order, or a VariantError if resolution fails
    pub fn resolve_variants(
        variants: &[Variant],
        _config: &ThemeConfig,
    ) -> Result<VariantComponents, VariantError> {
        // Compose variants into precedence-ordered list
        let composed = Self::compose_variants(variants);

        // Separate into media queries and selectors based on type
        let mut media_queries = Vec::new();
        let mut selectors = Vec::new();

        for resolved in composed {
            match &resolved.variant {
                Variant::Responsive(_) => {
                    // Responsive variants become media queries
                    let component = resolved.variant.to_css_component();
                    media_queries.push(component);
                }
                Variant::State(_) => {
                    // State variants become selectors
                    let component = resolved.variant.to_css_component();
                    selectors.push(component);
                }
                Variant::ColorScheme(_) => {
                    // Color scheme variants become selectors/media queries
                    let component = resolved.variant.to_css_component();
                    media_queries.push(component);
                }
                Variant::GroupRelative(_) => {
                    // Group variants become selectors
                    let component = resolved.variant.to_css_component();
                    selectors.push(component);
                }
                Variant::PeerRelative(_) => {
                    // Peer variants become selectors
                    let component = resolved.variant.to_css_component();
                    selectors.push(component);
                }
                Variant::Custom(_) => {
                    // Custom variants - treat as selector for now
                    let component = resolved.variant.to_css_component();
                    selectors.push(component);
                }
            }
        }

        Ok(VariantComponents {
            media_queries,
            selectors,
        })
    }
}

/// Resolved variant components with precedence-ordered variants
#[derive(Debug, Clone)]
pub struct VariantComponents {
    /// Media queries (in precedence order)
    pub media_queries: Vec<String>,
    /// Selectors (in precedence order)
    pub selectors: Vec<String>,
}

impl VariantComponents {
    /// Create new empty variant components
    pub fn new() -> Self {
        Self {
            media_queries: Vec::new(),
            selectors: Vec::new(),
        }
    }
}

impl Default for VariantComponents {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compose_variants_deterministic() {
        // Test that same variants in different order produce same result
        let variants1 = vec![
            Variant::State("hover".to_string()),
            Variant::Responsive("md".to_string()),
            Variant::ColorScheme("dark".to_string()),
        ];

        let variants2 = vec![
            Variant::ColorScheme("dark".to_string()),
            Variant::State("hover".to_string()),
            Variant::Responsive("md".to_string()),
        ];

        let composed1 = VariantSystem::compose_variants(&variants1);
        let composed2 = VariantSystem::compose_variants(&variants2);

        // Should be identical regardless of input order
        assert_eq!(composed1, composed2);

        // Verify order: ColorScheme(1) < Responsive(2) < State(3)
        assert_eq!(composed1[0].precedence, VariantPrecedence::ColorScheme);
        assert_eq!(composed1[1].precedence, VariantPrecedence::Responsive);
        assert_eq!(composed1[2].precedence, VariantPrecedence::State);
    }

    #[test]
    fn test_compose_variants_empty() {
        let variants: Vec<Variant> = vec![];
        let composed = VariantSystem::compose_variants(&variants);
        assert_eq!(composed.len(), 0);
    }

    #[test]
    fn test_compose_variants_single() {
        let variants = vec![Variant::State("hover".to_string())];
        let composed = VariantSystem::compose_variants(&variants);

        assert_eq!(composed.len(), 1);
        assert_eq!(composed[0].variant, Variant::State("hover".to_string()));
        assert_eq!(composed[0].precedence, VariantPrecedence::State);
    }

    #[test]
    fn test_compose_variants_complex() {
        let variants = vec![
            Variant::State("active".to_string()),
            Variant::GroupRelative("hover".to_string()),
            Variant::Custom("plugin".to_string()),
            Variant::Responsive("lg".to_string()),
            Variant::ColorScheme("light".to_string()),
        ];

        let composed = VariantSystem::compose_variants(&variants);

        // Verify precedence-ordered output
        assert_eq!(composed[0].precedence, VariantPrecedence::Interaction);
        assert_eq!(composed[1].precedence, VariantPrecedence::ColorScheme);
        assert_eq!(composed[2].precedence, VariantPrecedence::Responsive);
        assert_eq!(composed[3].precedence, VariantPrecedence::State);
        assert_eq!(composed[4].precedence, VariantPrecedence::Custom);
    }

    #[test]
    fn test_resolved_variant_new() {
        let v = Variant::State("hover".to_string());
        let resolved = ResolvedVariant::new(v.clone());

        assert_eq!(resolved.variant, v);
        assert_eq!(resolved.precedence, VariantPrecedence::State);
        assert_eq!(resolved.level(), 3);
    }

    #[test]
    fn test_resolve_variants_ordering() {
        let variants = vec![
            Variant::State("hover".to_string()),
            Variant::Responsive("md".to_string()),
        ];

        let components = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
            .expect("resolve_variants should succeed");

        // Media queries should come before selectors (media=2, state=3)
        assert_eq!(components.media_queries.len(), 1);
        assert_eq!(components.selectors.len(), 1);

        // Verify content
        assert_eq!(components.media_queries[0], "@media-md");
        assert_eq!(components.selectors[0], ":hover");
    }

    #[test]
    fn test_resolve_variants_empty() {
        let variants: Vec<Variant> = vec![];
        let components = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
            .expect("resolve_variants should succeed");

        assert_eq!(components.media_queries.len(), 0);
        assert_eq!(components.selectors.len(), 0);
    }

    #[test]
    fn test_resolve_variants_deterministic() {
        let config = ThemeConfig::default();

        let variants1 = vec![
            Variant::State("focus".to_string()),
            Variant::Responsive("sm".to_string()),
            Variant::ColorScheme("dark".to_string()),
        ];

        let variants2 = vec![
            Variant::ColorScheme("dark".to_string()),
            Variant::State("focus".to_string()),
            Variant::Responsive("sm".to_string()),
        ];

        let result1 = VariantSystem::resolve_variants(&variants1, &config)
            .expect("resolve_variants should succeed");
        let result2 = VariantSystem::resolve_variants(&variants2, &config)
            .expect("resolve_variants should succeed");

        // Should produce identical results regardless of input order
        assert_eq!(result1.media_queries, result2.media_queries);
        assert_eq!(result1.selectors, result2.selectors);
    }

    #[test]
    fn test_resolve_variants_color_scheme() {
        let variants = vec![Variant::ColorScheme("dark".to_string())];

        let components = VariantSystem::resolve_variants(&variants, &ThemeConfig::default())
            .expect("resolve_variants should succeed");

        // Color scheme should generate media query
        assert_eq!(components.media_queries.len(), 1);
        assert_eq!(components.media_queries[0], "@dark");
    }
}
