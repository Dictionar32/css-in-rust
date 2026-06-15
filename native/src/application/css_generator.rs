//! CssGenerator - generates CSS rules from parsed classes and theme

use crate::domain::css_rule::{CssDeclaration, CssRule};
use crate::domain::error::GenerateError;
use crate::domain::transform::ParsedClass;
use crate::domain::variant::Variant;
use std::collections::HashMap;

/// Maps Tailwind prefixes to CSS property-value pairs
pub struct PropMapping {
    pub properties: Vec<(String, String)>, // (property, value)
    pub media_queries: Vec<String>,
}

/// Generates CSS from parsed Tailwind classes
pub struct CssGenerator;

impl CssGenerator {
    /// Generate a complete CSS rule from a parsed class
    pub fn generate(&self, parsed: &ParsedClass, theme_values: &HashMap<String, String>) -> Result<CssRule, GenerateError> {
        // Generate base selector and declarations
        let (selector, declarations) = self.generate_declarations(parsed, theme_values)?;

        // Extract media queries from responsive variants
        let media_queries = self.extract_media_queries(parsed, theme_values)?;

        // Calculate specificity
        let specificity = CssRule::calculate_specificity(&selector);

        Ok(CssRule::new(selector, declarations, media_queries, specificity))
    }

    /// Generate CSS declarations from prefix and value
    fn generate_declarations(
        &self,
        parsed: &ParsedClass,
        theme_values: &HashMap<String, String>,
    ) -> Result<(String, Vec<CssDeclaration>), GenerateError> {
        if parsed.is_arbitrary {
            // Handle arbitrary values
            if let Some(decl) = &parsed.arbitrary_declaration {
                let selector = self.generate_selector(parsed)?;
                let (prop, val) = self.parse_css_declaration(decl)?;
                return Ok((selector, vec![CssDeclaration::new(prop, val)]));
            }
        }

        // Generate selector with variants
        let selector = self.generate_selector(parsed)?;

        // Map prefix to CSS properties
        let prop_mapping = self.map_prefix(&parsed.prefix, &parsed.value, theme_values)?;

        Ok((selector, prop_mapping.properties.into_iter().map(|(p, v)| CssDeclaration::new(p, v)).collect()))
    }

    /// Generate CSS selector with variants and escaping
    fn generate_selector(&self, parsed: &ParsedClass) -> Result<String, GenerateError> {
        let mut selector = String::new();

        // Add variant prefixes to selector
        for variant in &parsed.variants {
            match variant {
                Variant::State(state) => {
                    // State variants become pseudo-classes
                    selector.push_str(&format!("\\:{}", state));
                }
                Variant::Responsive(_) => {
                    // Responsive variants don't affect selector directly
                    // They're handled as media queries
                }
                Variant::ColorScheme(scheme) => {
                    // Dark/light mode prefixes
                    selector.push_str(&format!("\\[data-theme={}", scheme));
                }
                _ => {}
            }
        }

        // Add class name
        let class_name = if parsed.is_arbitrary {
            format!(".\\[{}\\]", parsed.arbitrary_declaration.as_ref().unwrap_or(&String::new()))
        } else {
            let variant_prefix = parsed
                .variants
                .iter()
                .map(|v| v.to_string())
                .collect::<Vec<_>>()
                .join(":");

            let prefix_value = if parsed.modifier_type.is_some() {
                format!("{}-{}/{}", parsed.prefix, parsed.value, parsed.modifier_type.as_ref().unwrap())
            } else {
                format!("{}-{}", parsed.prefix, parsed.value)
            };

            if !variant_prefix.is_empty() {
                format!(".\\{}{}", variant_prefix, Self::escape_class_name(&prefix_value))
            } else {
                format!(".\\{}", Self::escape_class_name(&prefix_value))
            }
        };

        Ok(format!("{}{}", selector, class_name))
    }

    /// Escape special characters in class names for CSS selectors
    fn escape_class_name(name: &str) -> String {
        name.chars()
            .map(|c| match c {
                ':' | '/' | '[' | ']' | '(' | ')' | ' ' | ',' => {
                    format!("\\{}", c)
                }
                _ => c.to_string(),
            })
            .collect()
    }

    /// Map Tailwind prefix to CSS property-value pairs
    fn map_prefix(
        &self,
        prefix: &str,
        value: &str,
        theme_values: &HashMap<String, String>,
    ) -> Result<PropMapping, GenerateError> {
        match prefix {
            // Spacing (padding, margin)
            "p" | "px" | "py" | "pt" | "pr" | "pb" | "pl" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                let properties = match prefix {
                    "p" => vec![
                        ("padding".to_string(), resolved_val.clone()),
                    ],
                    "px" => vec![
                        ("padding-left".to_string(), resolved_val.clone()),
                        ("padding-right".to_string(), resolved_val),
                    ],
                    "py" => vec![
                        ("padding-top".to_string(), resolved_val.clone()),
                        ("padding-bottom".to_string(), resolved_val),
                    ],
                    "pt" => vec![("padding-top".to_string(), resolved_val)],
                    "pr" => vec![("padding-right".to_string(), resolved_val)],
                    "pb" => vec![("padding-bottom".to_string(), resolved_val)],
                    "pl" => vec![("padding-left".to_string(), resolved_val)],
                    _ => vec![],
                };

                Ok(PropMapping {
                    properties,
                    media_queries: vec![],
                })
            }

            // Margin
            "m" | "mx" | "my" | "mt" | "mr" | "mb" | "ml" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                let properties = match prefix {
                    "m" => vec![
                        ("margin".to_string(), resolved_val.clone()),
                    ],
                    "mx" => vec![
                        ("margin-left".to_string(), resolved_val.clone()),
                        ("margin-right".to_string(), resolved_val),
                    ],
                    "my" => vec![
                        ("margin-top".to_string(), resolved_val.clone()),
                        ("margin-bottom".to_string(), resolved_val),
                    ],
                    "mt" => vec![("margin-top".to_string(), resolved_val)],
                    "mr" => vec![("margin-right".to_string(), resolved_val)],
                    "mb" => vec![("margin-bottom".to_string(), resolved_val)],
                    "ml" => vec![("margin-left".to_string(), resolved_val)],
                    _ => vec![],
                };

                Ok(PropMapping {
                    properties,
                    media_queries: vec![],
                })
            }

            // Background
            "bg" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                Ok(PropMapping {
                    properties: vec![("background-color".to_string(), resolved_val)],
                    media_queries: vec![],
                })
            }

            // Text color
            "text" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                Ok(PropMapping {
                    properties: vec![("color".to_string(), resolved_val)],
                    media_queries: vec![],
                })
            }

            // Width
            "w" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                Ok(PropMapping {
                    properties: vec![("width".to_string(), resolved_val)],
                    media_queries: vec![],
                })
            }

            // Height
            "h" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                Ok(PropMapping {
                    properties: vec![("height".to_string(), resolved_val)],
                    media_queries: vec![],
                })
            }

            // Border radius
            "rounded" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                Ok(PropMapping {
                    properties: vec![("border-radius".to_string(), resolved_val)],
                    media_queries: vec![],
                })
            }

            // Shadow
            "shadow" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                Ok(PropMapping {
                    properties: vec![("box-shadow".to_string(), resolved_val)],
                    media_queries: vec![],
                })
            }

            // Opacity
            "opacity" => {
                let resolved_val = theme_values
                    .get(value)
                    .cloned()
                    .unwrap_or_else(|| value.to_string());

                Ok(PropMapping {
                    properties: vec![("opacity".to_string(), resolved_val)],
                    media_queries: vec![],
                })
            }

            _ => Err(GenerateError::UnknownPrefix {
                prefix: prefix.to_string(),
            }),
        }
    }

    /// Extract media queries from responsive variants
    fn extract_media_queries(
        &self,
        parsed: &ParsedClass,
        theme_values: &HashMap<String, String>,
    ) -> Result<Vec<String>, GenerateError> {
        let mut media_queries = vec![];

        for variant in &parsed.variants {
            if let Variant::Responsive(breakpoint) = variant {
                let min_width = theme_values
                    .get(breakpoint)
                    .cloned()
                    .unwrap_or_else(|| format!("{}px", breakpoint));

                media_queries.push(format!("@media (min-width: {})", min_width));
            }
        }

        Ok(media_queries)
    }

    /// Parse CSS declaration string (property:value)
    fn parse_css_declaration(&self, decl: &str) -> Result<(String, String), GenerateError> {
        if let Some(pos) = decl.find(':') {
            let property = decl[..pos].trim().to_string();
            let value = decl[pos + 1..].trim().to_string();
            Ok((property, value))
        } else {
            Err(GenerateError::DeclarationError {
                reason: "missing colon in declaration".to_string(),
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escape_class_name() {
        assert_eq!(CssGenerator::escape_class_name("hover:bg-blue"), "hover\\:bg-blue");
        assert_eq!(CssGenerator::escape_class_name("bg-blue/50"), "bg-blue\\/50");
    }

    #[test]
    fn test_map_prefix_padding() {
        let gen = CssGenerator;
        let mut theme = HashMap::new();
        theme.insert("4".to_string(), "1rem".to_string());

        let result = gen.map_prefix("p", "4", &theme).unwrap();
        assert_eq!(result.properties[0].0, "padding");
        assert_eq!(result.properties[0].1, "1rem");
    }

    #[test]
    fn test_map_prefix_padding_x() {
        let gen = CssGenerator;
        let mut theme = HashMap::new();
        theme.insert("4".to_string(), "1rem".to_string());

        let result = gen.map_prefix("px", "4", &theme).unwrap();
        assert_eq!(result.properties.len(), 2);
        assert_eq!(result.properties[0].0, "padding-left");
        assert_eq!(result.properties[1].0, "padding-right");
    }

    #[test]
    fn test_map_prefix_background() {
        let gen = CssGenerator;
        let mut theme = HashMap::new();
        theme.insert("blue-600".to_string(), "#1e40af".to_string());

        let result = gen.map_prefix("bg", "blue-600", &theme).unwrap();
        assert_eq!(result.properties[0].0, "background-color");
        assert_eq!(result.properties[0].1, "#1e40af");
    }

    #[test]
    fn test_parse_css_declaration() {
        let gen = CssGenerator;
        let (prop, val) = gen.parse_css_declaration("width: 200px").unwrap();
        assert_eq!(prop, "width");
        assert_eq!(val, "200px");
    }

    #[test]
    fn test_extract_media_queries() {
        use smallvec::smallvec;
        let gen = CssGenerator;
        let parsed = ParsedClass::new(
            "md:px-4".to_string(),
            smallvec![Variant::Responsive("md".to_string())],
            "px".to_string(),
            "4".to_string(),
            None,
            false,
            None,
        );

        let mut theme = HashMap::new();
        theme.insert("md".to_string(), "768px".to_string());

        let result = gen.extract_media_queries(&parsed, &theme).unwrap();
        assert_eq!(result.len(), 1);
        assert!(result[0].contains("768px"));
    }
}
