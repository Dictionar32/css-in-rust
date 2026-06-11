//! Production ClassParser for Tailwind CSS classes
//! 
//! Handles parsing of Tailwind class syntax:
//! - Simple classes: "px-4", "bg-blue-600"
//! - Variants: "hover:px-4", "md:bg-blue"
//! - Multi-variants: "md:hover:bg-blue-600"
//! - Modifiers: "bg-blue/50"
//! - Arbitrary values: "w-[200px]", "bg-[#f3c]"
//! - Combinations: "md:hover:bg-blue-600/50"

use regex::Regex;
use lazy_static::lazy_static;
use serde::{Serialize, Deserialize};

/// Represents a parsed Tailwind class
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ParsedClass {
    pub prefix: String,           // "px", "bg", "text"
    pub value: String,            // "4", "blue-600", "[200px]"
    pub variants: Vec<String>,    // ["md", "hover"]
    pub modifier: Option<String>, // Some("50") for opacity
    pub is_arbitrary: bool,       // true if value contains [...]
}

impl ParsedClass {
    /// Create a new ParsedClass
    pub fn new(
        prefix: String,
        value: String,
        variants: Vec<String>,
        modifier: Option<String>,
    ) -> Self {
        let is_arbitrary = value.starts_with('[') && value.ends_with(']');
        ParsedClass {
            prefix,
            value,
            variants,
            modifier,
            is_arbitrary,
        }
    }

    /// Get all variants as a colon-separated string
    pub fn variants_str(&self) -> String {
        self.variants.join(":")
    }

    /// Build full class name for reference
    pub fn full_class_name(&self) -> String {
        let mut result = String::new();
        
        if !self.variants.is_empty() {
            result.push_str(&self.variants.join(":"));
            result.push(':');
        }
        
        result.push_str(&self.prefix);
        result.push('-');
        result.push_str(&self.value);
        
        if let Some(ref mod_) = self.modifier {
            result.push('/');
            result.push_str(mod_);
        }
        
        result
    }
}

/// Parser error types
#[derive(Debug, Clone, PartialEq)]
pub enum ParserError {
    EmptyClass,
    InvalidPrefix(String),
    UnmatchedBracket(String),
    UnknownVariant(String),
    MalformedValue(String),
}

impl std::fmt::Display for ParserError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParserError::EmptyClass => write!(f, "Empty class name"),
            ParserError::InvalidPrefix(p) => write!(f, "Invalid prefix: {}", p),
            ParserError::UnmatchedBracket(s) => write!(f, "Unmatched bracket in: {}", s),
            ParserError::UnknownVariant(v) => write!(f, "Unknown variant: {}", v),
            ParserError::MalformedValue(v) => write!(f, "Malformed value: {}", v),
        }
    }
}

lazy_static! {
    /// Known variant prefixes (state, responsive, dark mode, etc.)
    static ref KNOWN_VARIANTS: std::collections::HashSet<&'static str> = {
        let mut set = std::collections::HashSet::new();
        
        // State variants
        set.insert("hover");
        set.insert("focus");
        set.insert("active");
        set.insert("disabled");
        set.insert("visited");
        set.insert("target");
        set.insert("focus-visible");
        set.insert("focus-within");
        
        // Group/Peer variants
        set.insert("group-hover");
        set.insert("group-focus");
        set.insert("peer-hover");
        set.insert("peer-focus");
        set.insert("peer-checked");
        set.insert("peer-disabled");
        
        // Pseudo-element
        set.insert("before");
        set.insert("after");
        set.insert("first-line");
        set.insert("first-letter");
        set.insert("marker");
        set.insert("selection");
        
        // First/Last
        set.insert("first");
        set.insert("last");
        set.insert("only");
        set.insert("odd");
        set.insert("even");
        
        // Responsive
        set.insert("sm");
        set.insert("md");
        set.insert("lg");
        set.insert("xl");
        set.insert("2xl");
        set.insert("3xl");
        
        // Dark mode
        set.insert("dark");
        
        // Container
        set.insert("container");
        
        set
    };

    /// Regex for detecting arbitrary values
    static ref ARBITRARY_VALUE_REGEX: Regex = Regex::new(r"^\[.*\]$").unwrap();
    
    /// Regex for bracket matching
    static ref BRACKET_REGEX: Regex = Regex::new(r"^[^\[]*(\[[^\]]*\])(.*)$").unwrap();
}

/// Main ClassParser struct
pub struct ClassParser;

impl ClassParser {
    /// Create new parser instance (for compatibility with v1 interface)
    pub fn new() -> Self {
        Self
    }

    /// PHASE 7: Static parse for compatibility with test code and bench code
    /// This creates a new parser and parses, making it stateless
    pub fn parse(input: &str) -> Result<ParsedClass, ParserError> {
        let parser = ClassParser::new();
        parser.parse_internal(input)
    }

    /// Parse a Tailwind class string into components (internal method)
    fn parse_internal(&self, input: &str) -> Result<ParsedClass, ParserError> {
        let input = input.trim();
        
        // Step 1: Validate input
        if input.is_empty() {
            return Err(ParserError::EmptyClass);
        }
        
        // Step 2: Extract variants (e.g., "md:hover:" from "md:hover:bg-blue")
        let (variants, rest) = Self::extract_variants(input)?;
        
        // Step 3: Extract modifier (e.g., "/50" from "bg-blue/50")
        let (class_part, modifier) = Self::extract_modifier(&rest)?;
        
        // Step 4: Split prefix and value (e.g., "px-4" → "px" + "4")
        let (prefix, value) = Self::split_prefix_value(&class_part)?;
        
        Ok(ParsedClass::new(prefix, value, variants, modifier))
    }

    /// Extract all leading variants from the class string
    /// 
    /// Example: "md:hover:bg-blue" → (["md", "hover"], "bg-blue")
    fn extract_variants(input: &str) -> Result<(Vec<String>, String), ParserError> {
        let mut variants = Vec::new();
        let mut remaining = input;
        
        // Extract all colon-delimited prefixes that are known variants
        loop {
            match remaining.find(':') {
                Some(colon_idx) => {
                    let potential_variant = &remaining[..colon_idx];
                    
                    if Self::is_valid_variant(potential_variant) {
                        variants.push(potential_variant.to_string());
                        remaining = &remaining[colon_idx + 1..];
                    } else {
                        // Not a variant, stop extracting
                        break;
                    }
                }
                None => {
                    // No more colons
                    break;
                }
            }
        }
        
        Ok((variants, remaining.to_string()))
    }

    /// Check if a string is a known variant
    fn is_valid_variant(s: &str) -> bool {
        // Fast path: check known variants
        if KNOWN_VARIANTS.contains(s) {
            return true;
        }
        
        // Slow path: check for numeric responsive (e.g., "max-sm", "min-lg")
        if s.starts_with("min-") || s.starts_with("max-") {
            let suffix = &s[4..];
            return KNOWN_VARIANTS.contains(suffix);
        }
        
        false
    }

    /// Extract modifier from the end of a class part
    /// 
    /// Example: "bg-blue/50" → ("bg-blue", Some("50"))
    /// Note: Fractions like "1/2" stay as part of the value  
    fn extract_modifier(input: &str) -> Result<(String, Option<String>), ParserError> {
        // Check for double slash first
        if input.contains("//") {
            return Err(ParserError::MalformedValue(format!("Invalid double slash: {}", input)));
        }
        
        match input.rfind('/') {
            Some(slash_idx) => {
                let before_slash = &input[..slash_idx];
                let after_slash = &input[slash_idx + 1..];
                
                // Check for empty modifier
                if after_slash.is_empty() {
                    return Err(ParserError::MalformedValue(format!("Empty modifier: {}", input)));
                }
                
                // Special case: Check if this ends with a fraction like "/2" or "/3"
                // Fractions are single digit after slash with no modifier context
                let looks_like_fraction = 
                    after_slash.len() == 1 &&  // Single digit like "2", "3", "4"
                    after_slash.chars().all(|c| c.is_numeric());
                
                if looks_like_fraction {
                    // This is likely part of a fraction (e.g., "1/2"), not a modifier
                    // Leave it as part of the value
                    return Ok((input.to_string(), None));
                }
                
                // Not a simple fraction - check if it's a valid modifier
                if Self::is_valid_modifier(after_slash) {
                    Ok((before_slash.to_string(), Some(after_slash.to_string())))
                } else {
                    // Could be an invalid modifier, or could be something else
                    // For now, treat as invalid
                    Err(ParserError::MalformedValue(format!("Invalid modifier: {}", after_slash)))
                }
            }
            None => Ok((input.to_string(), None)),
        }
    }

    /// Check if a modifier is valid (opacity values or special keywords)
    fn is_valid_modifier(m: &str) -> bool {
        // Numeric opacity (0-100)
        if let Ok(num) = m.parse::<u32>() {
            return num <= 100;
        }
        
        // Special keywords
        matches!(m, "opacity" | "100" | "75" | "50" | "25" | "0")
    }

    /// Split prefix and value from class part
    /// 
    /// Example: "px-4" → ("px", "4")
    ///          "bg-blue-600" → ("bg", "blue-600")
    ///          "w-[200px]" → ("w", "[200px]")
    ///          "flex" → ("flex", "default") [special case for classes without dash]
    fn split_prefix_value(input: &str) -> Result<(String, String), ParserError> {
        // Special case: some Tailwind classes don't have a dash (e.g., "flex", "inline", "outline")
        if !input.contains('-') {
            // These are typically standalone classes
            return Ok((input.to_string(), "default".to_string()));
        }
        
        // Find first dash
        let dash_idx = match input.find('-') {
            Some(idx) => idx,
            None => {
                // No dash and we should have already returned above
                return Err(ParserError::MalformedValue(
                    format!("No dash found in: {}", input)
                ));
            }
        };
        
        let prefix = &input[..dash_idx];
        let value_part = &input[dash_idx + 1..];
        
        // Handle negative values (e.g., "-mx-4")
        if prefix.is_empty() {
            // This is a negative value like "-mx-4"
            // Need to find the real prefix after the second dash
            match value_part.find('-') {
                Some(idx) => {
                    let real_prefix = format!("-{}", &value_part[..idx]);
                    let real_value = &value_part[idx + 1..];
                    return Ok((real_prefix, real_value.to_string()));
                }
                None => {
                    return Err(ParserError::MalformedValue(
                        format!("Invalid negative class: {}", input)
                    ));
                }
            }
        }
        
        // Validate prefix contains only alphanumeric and hyphens
        if !Self::is_valid_prefix(prefix) {
            return Err(ParserError::InvalidPrefix(prefix.to_string()));
        }
        
        // Handle arbitrary values [...]
        if value_part.starts_with('[') {
            Self::extract_arbitrary_value(value_part)
                .map(|v| (prefix.to_string(), v))
        } else {
            Ok((prefix.to_string(), value_part.to_string()))
        }
    }

    /// Extract arbitrary value with balanced brackets
    /// 
    /// Example: "[200px]" → "[200px]"
    ///          "[rgba(0,0,0,0.5)]" → "[rgba(0,0,0,0.5)]"
    fn extract_arbitrary_value(input: &str) -> Result<String, ParserError> {
        if !input.starts_with('[') {
            return Err(ParserError::UnmatchedBracket(input.to_string()));
        }
        
        let mut depth = 0;
        let mut closing_idx = None;
        
        for (idx, ch) in input.chars().enumerate() {
            match ch {
                '[' => depth += 1,
                ']' => {
                    depth -= 1;
                    if depth == 0 {
                        closing_idx = Some(idx);
                        break;
                    }
                }
                '(' => { /* nested parenthesis, allow */ }
                ')' => { /* nested parenthesis, allow */ }
                _ => {}
            }
        }
        
        match closing_idx {
            Some(idx) => {
                // Return just the arbitrary value part [...]
                Ok(input[..=idx].to_string())
            }
            None => Err(ParserError::UnmatchedBracket(input.to_string())),
        }
    }

    /// Validate prefix format
    fn is_valid_prefix(prefix: &str) -> bool {
        if prefix.is_empty() {
            return false;
        }
        
        // Prefix can contain letters, numbers, and hyphens
        // Examples: "px", "bg", "text", "w", "min-w", "max-w"
        prefix.chars().all(|c| c.is_alphanumeric() || c == '-')
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Simple class tests
    #[test]
    fn test_parse_simple_spacing() {
        let result = ClassParser::parse("px-4").unwrap();
        assert_eq!(result.prefix, "px");
        assert_eq!(result.value, "4");
        assert!(result.variants.is_empty());
        assert_eq!(result.modifier, None);
    }

    #[test]
    fn test_parse_multi_part_value() {
        let result = ClassParser::parse("bg-blue-600").unwrap();
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.value, "blue-600");
    }

    #[test]
    fn test_parse_numeric_suffix() {
        let result = ClassParser::parse("text-2xl").unwrap();
        assert_eq!(result.prefix, "text");
        assert_eq!(result.value, "2xl");
    }

    // Variant tests
    #[test]
    fn test_parse_single_variant() {
        let result = ClassParser::parse("hover:bg-blue").unwrap();
        assert_eq!(result.variants, vec!["hover"]);
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.value, "blue");
    }

    #[test]
    fn test_parse_responsive_variant() {
        let result = ClassParser::parse("md:px-4").unwrap();
        assert_eq!(result.variants, vec!["md"]);
        assert_eq!(result.prefix, "px");
        assert_eq!(result.value, "4");
    }

    #[test]
    fn test_parse_multi_variants() {
        let result = ClassParser::parse("md:hover:bg-blue").unwrap();
        assert_eq!(result.variants, vec!["md", "hover"]);
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.value, "blue");
    }

    #[test]
    fn test_parse_dark_mode() {
        let result = ClassParser::parse("dark:bg-gray-900").unwrap();
        assert_eq!(result.variants, vec!["dark"]);
        assert_eq!(result.value, "gray-900");
    }

    // Modifier tests
    #[test]
    fn test_parse_opacity_modifier() {
        let result = ClassParser::parse("bg-blue/50").unwrap();
        assert_eq!(result.value, "blue");
        assert_eq!(result.modifier, Some("50".to_string()));
    }

    #[test]
    fn test_parse_variant_with_modifier() {
        let result = ClassParser::parse("hover:bg-blue/75").unwrap();
        assert_eq!(result.variants, vec!["hover"]);
        assert_eq!(result.modifier, Some("75".to_string()));
    }

    // Arbitrary value tests
    #[test]
    fn test_parse_arbitrary_width() {
        let result = ClassParser::parse("w-[200px]").unwrap();
        assert_eq!(result.value, "[200px]");
        assert!(result.is_arbitrary);
    }

    #[test]
    fn test_parse_arbitrary_color() {
        let result = ClassParser::parse("bg-[#f3c]").unwrap();
        assert_eq!(result.value, "[#f3c]");
        assert!(result.is_arbitrary);
    }

    #[test]
    fn test_parse_arbitrary_with_parens() {
        let result = ClassParser::parse("bg-[rgba(0,0,0,0.5)]").unwrap();
        assert_eq!(result.value, "[rgba(0,0,0,0.5)]");
        assert!(result.is_arbitrary);
    }

    // Error tests
    #[test]
    fn test_parse_empty_class() {
        let result = ClassParser::parse("");
        assert_eq!(result, Err(ParserError::EmptyClass));
    }

    #[test]
    fn test_parse_invalid_modifier() {
        let result = ClassParser::parse("bg-blue/999");
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_unmatched_bracket() {
        let result = ClassParser::parse("w-[200px");
        assert_eq!(result, Err(ParserError::UnmatchedBracket("[200px".to_string())));
    }

    // Complex combinations
    #[test]
    fn test_parse_full_combination() {
        let result = ClassParser::parse("md:hover:bg-blue-600/50").unwrap();
        assert_eq!(result.variants, vec!["md", "hover"]);
        assert_eq!(result.prefix, "bg");
        assert_eq!(result.value, "blue-600");
        assert_eq!(result.modifier, Some("50".to_string()));
    }
}
