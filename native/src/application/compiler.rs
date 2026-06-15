//! Compiler - orchestrates the complete CSS compilation pipeline

use crate::application::class_parser::ClassParser;
use crate::application::css_generator::CssGenerator;
use crate::application::theme_resolver::ThemeResolver;
use crate::domain::error::CompileError;
use crate::domain::theme_config::ThemeConfig;
use std::collections::HashMap;

/// Result of CSS compilation
#[derive(Debug, Clone)]
pub struct CompileResult {
    pub css: String,
    pub rule_count: usize,
    pub errors: Vec<String>,
}

/// Compiles Tailwind classes to CSS
pub struct Compiler {
    parser: ClassParser,
    generator: CssGenerator,
    theme: ThemeConfig,
}

impl Compiler {
    /// Create a new compiler with theme configuration
    pub fn new(theme: ThemeConfig) -> Self {
        Self {
            parser: ClassParser::new(),
            generator: CssGenerator,
            theme,
        }
    }

    /// Compile a single class to CSS
    pub fn compile_class(&self, class: &str) -> Result<String, CompileError> {
        // Parse the class
        let parsed = self.parser.parse(class)?;

        // Resolve theme values
        let resolver = ThemeResolver::new(self.theme.clone());
        let resolved_value = match parsed.prefix.as_str() {
            "bg" | "text" => resolver.resolve_color(&parsed.value).ok(),
            "p" | "px" | "py" | "pt" | "pr" | "pb" | "pl" |
            "m" | "mx" | "my" | "mt" | "mr" | "mb" | "ml" => resolver.resolve_spacing(&parsed.value).ok(),
            _ => None,
        };

        // Build theme map for CSS generation
        let mut theme_map = HashMap::new();
        if let Some(val) = resolved_value {
            theme_map.insert(parsed.value.clone(), val);
        }

        // Add breakpoints to theme_map so responsive variants can extract media query min-widths
        for (key, val) in &self.theme.breakpoints {
            theme_map.insert(key.clone(), val.clone());
        }

        // Generate CSS
        let rule = self.generator.generate(&parsed, &theme_map)?;

        Ok(rule.to_css_string())
    }

    /// Compile multiple classes to CSS
    pub fn compile_classes(&self, classes: &[String]) -> CompileResult {
        let mut css_rules = Vec::new();
        let mut errors = Vec::new();

        for class in classes {
            match self.compile_class(class) {
                Ok(css) => {
                    css_rules.push(css);
                }
                Err(e) => {
                    errors.push(e.to_string());
                }
            }
        }

        let rule_count = css_rules.len();
        let css = css_rules.join("\n");

        CompileResult {
            css,
            rule_count,
            errors,
        }
    }

    /// Compile classes from a string (space-separated)
    pub fn compile_from_string(&self, class_string: &str) -> CompileResult {
        let classes: Vec<String> = class_string
            .split_whitespace()
            .map(|s| s.to_string())
            .collect();

        self.compile_classes(&classes)
    }
}

impl Default for Compiler {
    fn default() -> Self {
        Self::new(crate::utils::constants::parse_tailwind_config_with_lightning())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compile_simple_class() {
        let compiler = Compiler::default();
        let result = compiler.compile_class("px-4");
        assert!(result.is_ok());
        assert!(result.unwrap().contains("padding"));
    }

    #[test]
    fn test_compile_invalid_class() {
        let compiler = Compiler::default();
        let result = compiler.compile_class("invalid-class-xyz");
        assert!(result.is_err());
    }

    #[test]
    fn test_compile_multiple_classes() {
        let compiler = Compiler::default();
        let classes = vec!["px-4".to_string(), "py-2".to_string()];
        let result = compiler.compile_classes(&classes);
        assert_eq!(result.rule_count, 2);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_compile_from_string() {
        let compiler = Compiler::default();
        let result = compiler.compile_from_string("px-4 py-2");
        assert_eq!(result.rule_count, 2);
    }

    #[test]
    fn test_compile_with_errors() {
        let compiler = Compiler::default();
        let classes = vec!["px-4".to_string(), "invalid-xyz".to_string()];
        let result = compiler.compile_classes(&classes);
        assert_eq!(result.rule_count, 1);
        assert!(!result.errors.is_empty());
    }

    #[test]
    fn test_compile_responsive_class() {
        let compiler = Compiler::default();
        let result = compiler.compile_class("md:px-4");
        assert!(result.is_ok());
    }

    #[test]
    fn test_compile_state_class() {
        let compiler = Compiler::default();
        let result = compiler.compile_class("hover:bg-blue-600");
        assert!(result.is_ok());
    }
}
