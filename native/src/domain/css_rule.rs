//! CssRule and CssDeclaration - represents CSS rules and properties

use serde::{Deserialize, Serialize};

/// Represents a single CSS property-value pair
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CssDeclaration {
    /// CSS property name (e.g., "background-color", "padding-left")
    pub property: String,

    /// CSS property value (e.g., "#1e40af", "1rem")
    pub value: String,
}

impl CssDeclaration {
    /// Create a new CSS declaration
    pub fn new(property: String, value: String) -> Self {
        Self { property, value }
    }

    /// Format as CSS (e.g., "background-color: #1e40af;")
    pub fn to_css_string(&self) -> String {
        format!("{}: {};", self.property, self.value)
    }
}

/// Represents a complete CSS rule with selector and declarations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CssRule {
    /// CSS selector (e.g., ".hover\:bg-blue-600:hover")
    pub selector: String,

    /// CSS declarations (property-value pairs)
    pub declarations: Vec<CssDeclaration>,

    /// Media queries wrapping this rule (if responsive)
    /// Stored in reverse order for nesting (outer → inner)
    pub media_queries: Vec<String>,

    /// Specificity level (for deduplication/ordering)
    /// Calculated as: 100 * ids + 10 * classes + 1 * elements + 10 * pseudo-classes
    pub specificity: u32,
}

impl CssRule {
    /// Create a new CSS rule
    pub fn new(
        selector: String,
        declarations: Vec<CssDeclaration>,
        media_queries: Vec<String>,
        specificity: u32,
    ) -> Self {
        Self {
            selector,
            declarations,
            media_queries,
            specificity,
        }
    }

    /// Add a declaration to this rule
    pub fn add_declaration(&mut self, property: String, value: String) {
        self.declarations.push(CssDeclaration::new(property, value));
    }

    /// Add a media query to wrap this rule
    pub fn add_media_query(&mut self, media_query: String) {
        self.media_queries.push(media_query);
    }

    /// Generate CSS output with proper nesting and formatting
    ///
    /// # Examples
    /// Simple rule:
    /// ```text
    /// .px-4 {
    ///   padding-left: 1rem;
    ///   padding-right: 1rem;
    /// }
    /// ```
    ///
    /// With media query:
    /// ```text
    /// @media (min-width: 768px) {
    ///   .md\:px-4 {
    ///     padding-left: 1rem;
    ///     padding-right: 1rem;
    ///   }
    /// }
    /// ```
    pub fn to_css_string(&self) -> String {
        // Format declarations
        let declarations_str = self
            .declarations
            .iter()
            .map(|d| format!("  {}", d.to_css_string()))
            .collect::<Vec<_>>()
            .join("\n");

        // Build inner rule
        let inner = format!("{} {{\n{}\n}}", self.selector, declarations_str);

        // Nest within media queries if present (reverse order for proper nesting)
        self.media_queries
            .iter()
            .rev()
            .fold(inner, |acc, mq| format!("{} {{\n{}\n}}", mq, acc))
    }

    /// Get number of declarations
    pub fn declaration_count(&self) -> usize {
        self.declarations.len()
    }

    /// Check if this rule has no declarations
    pub fn is_empty(&self) -> bool {
        self.declarations.is_empty()
    }

    /// Get minified version (single line)
    pub fn to_minified_css(&self) -> String {
        let declarations_str = self
            .declarations
            .iter()
            .map(|d| d.to_css_string())
            .collect::<Vec<_>>()
            .join("");

        let inner = format!("{}{{{}}}", self.selector, declarations_str);

        // Nest within media queries if present
        self.media_queries
            .iter()
            .rev()
            .fold(inner, |acc, mq| format!("{}{{{}}}", mq, acc))
    }

    /// Calculate specificity from selector
    ///
    /// CSS specificity rules:
    /// - Each ID selector: 100 points
    /// - Each class selector or pseudo-class: 10 points
    /// - Each element selector: 1 point
    pub fn calculate_specificity(selector: &str) -> u32 {
        let id_count = selector.matches('#').count() as u32;
        let class_count = selector.matches('.').count() as u32;
        let pseudo_count = selector.matches(':').count() as u32;

        id_count * 100 + (class_count + pseudo_count) * 10
    }

    /// Update specificity based on current selector
    pub fn update_specificity(&mut self) {
        self.specificity = Self::calculate_specificity(&self.selector);
    }
}

impl Default for CssRule {
    fn default() -> Self {
        Self {
            selector: String::new(),
            declarations: Vec::new(),
            media_queries: Vec::new(),
            specificity: 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_css_declaration_new() {
        let decl = CssDeclaration::new("color".to_string(), "red".to_string());
        assert_eq!(decl.property, "color");
        assert_eq!(decl.value, "red");
    }

    #[test]
    fn test_css_declaration_to_string() {
        let decl = CssDeclaration::new("color".to_string(), "red".to_string());
        assert_eq!(decl.to_css_string(), "color: red;");
    }

    #[test]
    fn test_css_rule_new() {
        let rule = CssRule::new(
            ".test".to_string(),
            vec![CssDeclaration::new("color".to_string(), "red".to_string())],
            vec![],
            10,
        );
        assert_eq!(rule.selector, ".test");
        assert_eq!(rule.declaration_count(), 1);
    }

    #[test]
    fn test_css_rule_add_declaration() {
        let mut rule = CssRule::default();
        rule.selector = ".test".to_string();
        rule.add_declaration("color".to_string(), "red".to_string());
        assert_eq!(rule.declaration_count(), 1);
    }

    #[test]
    fn test_css_rule_to_css_string() {
        let mut rule = CssRule::default();
        rule.selector = ".px-4".to_string();
        rule.add_declaration("padding-left".to_string(), "1rem".to_string());
        rule.add_declaration("padding-right".to_string(), "1rem".to_string());

        let css = rule.to_css_string();
        assert!(css.contains(".px-4"));
        assert!(css.contains("padding-left: 1rem;"));
        assert!(css.contains("padding-right: 1rem;"));
    }

    #[test]
    fn test_css_rule_with_media_query() {
        let mut rule = CssRule::default();
        rule.selector = ".md\\:px-4".to_string();
        rule.add_declaration("padding-left".to_string(), "1rem".to_string());
        rule.add_media_query("@media (min-width: 768px)".to_string());

        let css = rule.to_css_string();
        assert!(css.contains("@media (min-width: 768px)"));
        assert!(css.contains(".md\\:px-4"));
    }

    #[test]
    fn test_css_rule_calculate_specificity() {
        let spec1 = CssRule::calculate_specificity(".class");
        assert_eq!(spec1, 10);

        let spec2 = CssRule::calculate_specificity(".class:hover");
        assert_eq!(spec2, 20); // 10 for class + 10 for pseudo-class

        let spec3 = CssRule::calculate_specificity("#id");
        assert_eq!(spec3, 100);
    }

    #[test]
    fn test_css_rule_is_empty() {
        let rule = CssRule::default();
        assert!(rule.is_empty());

        let mut rule = CssRule::default();
        rule.add_declaration("color".to_string(), "red".to_string());
        assert!(!rule.is_empty());
    }

    #[test]
    fn test_css_rule_minified() {
        let mut rule = CssRule::default();
        rule.selector = ".test".to_string();
        rule.add_declaration("color".to_string(), "red".to_string());

        let minified = rule.to_minified_css();
        assert!(!minified.contains("\n"));
        assert!(minified.contains(".test{color: red;}"));
    }
}
