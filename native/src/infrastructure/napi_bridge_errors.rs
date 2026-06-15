//! Error handling utilities for NAPI bridge
//!
//! This module provides standardized error handling, conversion, and context
//! for all NAPI bridge operations.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use std::fmt;

/// Error context for better diagnostics
#[derive(Clone, Debug)]
pub struct ErrorContext {
    /// The operation that failed
    pub operation: String,
    /// Additional context information
    pub context: String,
    /// The underlying error message
    pub message: String,
}

impl ErrorContext {
    /// Create new error context
    pub fn new(operation: impl Into<String>, context: impl Into<String>, message: impl Into<String>) -> Self {
        ErrorContext {
            operation: operation.into(),
            context: context.into(),
            message: message.into(),
        }
    }

    /// Convert to NAPI error
    pub fn to_napi_error(self) -> napi::Error {
        napi::Error::new(
            napi::Status::GenericFailure,
            self.to_string(),
        )
    }

    /// Convert to JSON error response
    pub fn to_json_error(&self) -> String {
        format!(
            r#"{{"status":"error","error":"{}","context":"{}","operation":"{}"}}"#,
            escape_json_string(&self.message),
            escape_json_string(&self.context),
            escape_json_string(&self.operation),
        )
    }
}

impl fmt::Display for ErrorContext {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "{} ({}): {}",
            self.operation, self.context, self.message
        )
    }
}

impl From<ErrorContext> for napi::Error {
    fn from(ctx: ErrorContext) -> Self {
        ctx.to_napi_error()
    }
}

impl From<serde_json::Error> for ErrorContext {
    fn from(err: serde_json::Error) -> Self {
        ErrorContext::new("JSON Operation", "Serialization", err.to_string())
    }
}

/// Escape a string for safe JSON embedding
fn escape_json_string(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
        .replace('\r', "\\r")
        .replace('\t', "\\t")
}

/// Convert a generic error to NAPI error with context
pub fn error_to_napi(operation: &str, error: impl fmt::Display) -> napi::Error {
    ErrorContext::new(operation, "Bridge", error.to_string()).to_napi_error()
}

/// Validate string input
pub fn validate_string_input(value: &str, param_name: &str) -> napi::Result<()> {
    if value.trim().is_empty() {
        return Err(ErrorContext::new(
            "Validation",
            "Input Validation",
            format!("Parameter '{}' cannot be empty", param_name),
        ).into());
    }

    if value.len() > 1_000_000 {
        return Err(ErrorContext::new(
            "Validation",
            "Input Size",
            format!("Parameter '{}' exceeds maximum length of 1MB", param_name),
        ).into());
    }

    Ok(())
}

/// Validate array input
pub fn validate_array_input<T>(values: &[T], param_name: &str, max_size: usize) -> napi::Result<()> {
    if values.is_empty() {
        return Err(ErrorContext::new(
            "Validation",
            "Input Validation",
            format!("Parameter '{}' cannot be empty", param_name),
        ).into());
    }

    if values.len() > max_size {
        return Err(ErrorContext::new(
            "Validation",
            "Array Size",
            format!("Parameter '{}' exceeds maximum size of {}", param_name, max_size),
        ).into());
    }

    Ok(())
}

/// Validate numeric input
pub fn validate_numeric_input(value: u32, min: u32, max: u32, param_name: &str) -> napi::Result<()> {
    if value < min || value > max {
        return Err(ErrorContext::new(
            "Validation",
            "Numeric Range",
            format!("Parameter '{}' must be between {} and {}", param_name, min, max),
        ).into());
    }

    Ok(())
}

/// Wrap a result with error context
pub fn with_context<T, E: fmt::Display>(
    result: Result<T, E>,
    operation: &str,
    context: &str,
) -> napi::Result<T> {
    result.map_err(|e| {
        ErrorContext::new(operation, context, e.to_string()).into()
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_context_display() {
        let ctx = ErrorContext::new("Parse", "ClassParser", "Invalid syntax");
        assert!(ctx.to_string().contains("Parse"));
        assert!(ctx.to_string().contains("ClassParser"));
        assert!(ctx.to_string().contains("Invalid syntax"));
    }

    #[test]
    fn test_escape_json_string() {
        let input = r#"test"value\with\quotes"#;
        let escaped = escape_json_string(input);
        assert_eq!(escaped, "test\\\"value\\\\with\\\\quotes");
    }

    #[test]
    fn test_validate_string_input() {
        assert!(validate_string_input("valid", "test").is_ok());
        assert!(validate_string_input("", "test").is_err());
        assert!(validate_string_input("   ", "test").is_err());
    }

    #[test]
    fn test_validate_numeric_input() {
        assert!(validate_numeric_input(5, 1, 10, "test").is_ok());
        assert!(validate_numeric_input(0, 1, 10, "test").is_err());
        assert!(validate_numeric_input(11, 1, 10, "test").is_err());
    }
}
