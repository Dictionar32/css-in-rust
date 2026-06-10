//! Error types for CSS compiler

use serde::{Deserialize, Serialize};
use std::fmt;

/// Parse errors that occur when tokenizing Tailwind classes
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ParseError {
    /// Invalid class syntax at a specific position
    InvalidSyntax {
        class: String,
        position: usize,
        reason: Option<String>,
    },

    /// Unknown or invalid variant
    UnknownVariant {
        variant: String,
        suggestions: Vec<String>,
    },

    /// Malformed arbitrary value syntax
    MalformedArbitrary {
        value: String,
        reason: Option<String>,
    },

    /// Empty or whitespace-only input
    EmptyInput,
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseError::InvalidSyntax {
                class,
                position,
                reason,
            } => {
                write!(
                    f,
                    "Invalid class syntax '{}' at position {}: {}",
                    class,
                    position,
                    reason.as_deref().unwrap_or("unexpected characters")
                )
            }
            ParseError::UnknownVariant {
                variant,
                suggestions,
            } => {
                write!(f, "Unknown variant '{}'. ", variant)?;
                if !suggestions.is_empty() {
                    write!(f, "Did you mean: {}?", suggestions.join(", "))?;
                }
                Ok(())
            }
            ParseError::MalformedArbitrary { value, reason } => {
                write!(
                    f,
                    "Malformed arbitrary value '{}': {}",
                    value,
                    reason.as_deref().unwrap_or("invalid syntax")
                )
            }
            ParseError::EmptyInput => write!(f, "Empty class input"),
        }
    }
}

impl std::error::Error for ParseError {}

/// Errors that occur when resolving theme values
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ResolveError {
    /// Theme value not found
    ValueNotFound {
        key: String,
        section: Option<String>,
    },

    /// Invalid opacity modifier (not 0-100)
    InvalidOpacity {
        value: String,
    },

    /// Invalid color format
    InvalidColor {
        value: String,
        reason: Option<String>,
    },

    /// Theme configuration is invalid
    InvalidThemeConfig {
        reason: String,
    },
}

impl fmt::Display for ResolveError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ResolveError::ValueNotFound { key, section } => {
                if let Some(sect) = section {
                    write!(f, "Value '{}' not found in {} theme section", key, sect)
                } else {
                    write!(f, "Value '{}' not found in theme", key)
                }
            }
            ResolveError::InvalidOpacity { value } => {
                write!(f, "Invalid opacity value '{}': must be 0-100", value)
            }
            ResolveError::InvalidColor { value, reason } => {
                write!(
                    f,
                    "Invalid color '{}': {}",
                    value,
                    reason.as_deref().unwrap_or("unrecognized format")
                )
            }
            ResolveError::InvalidThemeConfig { reason } => {
                write!(f, "Invalid theme configuration: {}", reason)
            }
        }
    }
}

impl std::error::Error for ResolveError {}

/// CSS generation errors
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum GenerateError {
    /// Unknown CSS prefix
    UnknownPrefix {
        prefix: String,
    },

    /// Failed to generate CSS declarations
    DeclarationError {
        reason: String,
    },

    /// Selector generation failed
    SelectorError {
        reason: String,
    },

    /// Invalid CSS output
    InvalidCss {
        reason: String,
    },
}

impl fmt::Display for GenerateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            GenerateError::UnknownPrefix { prefix } => {
                write!(f, "Unknown CSS prefix: '{}'", prefix)
            }
            GenerateError::DeclarationError { reason } => {
                write!(f, "Failed to generate CSS declaration: {}", reason)
            }
            GenerateError::SelectorError { reason } => {
                write!(f, "Failed to generate selector: {}", reason)
            }
            GenerateError::InvalidCss { reason } => {
                write!(f, "Generated invalid CSS: {}", reason)
            }
        }
    }
}

impl std::error::Error for GenerateError {}

/// Variant resolution errors
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum VariantError {
    /// Unknown responsive variant
    UnknownResponsive {
        name: String,
    },

    /// Unknown state variant
    UnknownState {
        name: String,
    },

    /// Invalid variant combination
    InvalidCombination {
        reason: String,
    },

    /// Variant resolution failed
    ResolutionError {
        variant: String,
        reason: String,
    },
}

impl fmt::Display for VariantError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            VariantError::UnknownResponsive { name } => {
                write!(f, "Unknown responsive breakpoint: '{}'", name)
            }
            VariantError::UnknownState { name } => {
                write!(f, "Unknown state variant: '{}'", name)
            }
            VariantError::InvalidCombination { reason } => {
                write!(f, "Invalid variant combination: {}", reason)
            }
            VariantError::ResolutionError { variant, reason } => {
                write!(f, "Failed to resolve variant '{}': {}", variant, reason)
            }
        }
    }
}

impl std::error::Error for VariantError {}

/// Comprehensive compiler error type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CompileError {
    /// Parse error
    Parse(ParseError),

    /// Theme resolution error
    Resolve(ResolveError),

    /// CSS generation error
    Generate(GenerateError),

    /// Variant resolution error
    Variant(VariantError),

    /// No valid classes to compile
    NoValidClasses {
        tried: usize,
        reason: String,
    },

    /// Other error
    Other(String),
}

impl fmt::Display for CompileError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CompileError::Parse(e) => write!(f, "Parse error: {}", e),
            CompileError::Resolve(e) => write!(f, "Resolve error: {}", e),
            CompileError::Generate(e) => write!(f, "Generate error: {}", e),
            CompileError::Variant(e) => write!(f, "Variant error: {}", e),
            CompileError::NoValidClasses { tried, reason } => {
                write!(f, "No valid classes compiled (tried {}): {}", tried, reason)
            }
            CompileError::Other(msg) => write!(f, "Compiler error: {}", msg),
        }
    }
}

impl std::error::Error for CompileError {}

// Conversion implementations
impl From<ParseError> for CompileError {
    fn from(e: ParseError) -> Self {
        CompileError::Parse(e)
    }
}

impl From<ResolveError> for CompileError {
    fn from(e: ResolveError) -> Self {
        CompileError::Resolve(e)
    }
}

impl From<GenerateError> for CompileError {
    fn from(e: GenerateError) -> Self {
        CompileError::Generate(e)
    }
}

impl From<VariantError> for CompileError {
    fn from(e: VariantError) -> Self {
        CompileError::Variant(e)
    }
}

impl From<String> for CompileError {
    fn from(s: String) -> Self {
        CompileError::Other(s)
    }
}

impl From<&str> for CompileError {
    fn from(s: &str) -> Self {
        CompileError::Other(s.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_error_display() {
        let err = ParseError::InvalidSyntax {
            class: "invalid::class".to_string(),
            position: 8,
            reason: Some("double colon".to_string()),
        };
        assert!(err.to_string().contains("Invalid class syntax"));
    }

    #[test]
    fn test_resolve_error_display() {
        let err = ResolveError::ValueNotFound {
            key: "blue-999".to_string(),
            section: Some("colors".to_string()),
        };
        assert!(err.to_string().contains("not found"));
    }

    #[test]
    fn test_unknown_variant_with_suggestions() {
        let err = ParseError::UnknownVariant {
            variant: "hov".to_string(),
            suggestions: vec!["hover".to_string()],
        };
        assert!(err.to_string().contains("Did you mean"));
    }

    #[test]
    fn test_compile_error_from_parse() {
        let parse_err = ParseError::EmptyInput;
        let compile_err: CompileError = parse_err.into();
        assert!(compile_err.to_string().contains("Parse error"));
    }

    #[test]
    fn test_invalid_opacity_error() {
        let err = ResolveError::InvalidOpacity {
            value: "150".to_string(),
        };
        assert!(err.to_string().contains("0-100"));
    }
}
