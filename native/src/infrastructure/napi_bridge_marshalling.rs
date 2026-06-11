//! JSON marshalling utilities for NAPI bridge
//!
//! This module provides functions for serializing/deserializing data
//! to/from JSON for NAPI JavaScript interface.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use serde::{Deserialize, Serialize};
use crate::infrastructure::napi_bridge_types::JsonResponse;

/// Parse JSON string into a typed value
///
/// # Arguments
/// * `json_str` - The JSON string to parse
/// * `type_name` - Name of the type (for error context)
///
/// # Returns
/// * `Ok(T)` if parsing succeeds
/// * `Err(napi::Error)` if parsing fails with context
///
/// # Example
/// ```ignore
/// let css_rule: CssRule = parse_json(&json_string, "CssRule")?;
/// ```
pub fn parse_json<T: for<'de> Deserialize<'de>>(
    json_str: &str,
    type_name: &str,
) -> napi::Result<T> {
    serde_json::from_str(json_str).map_err(|e| {
        napi::Error::new(
            napi::Status::InvalidArg,
            format!("Failed to parse {} from JSON: {}", type_name, e),
        )
    })
}

/// Convert a typed value to JSON string
///
/// # Arguments
/// * `value` - The value to serialize
///
/// # Returns
/// * `Ok(String)` containing JSON representation
/// * `Err(napi::Error)` if serialization fails
///
/// # Example
/// ```ignore
/// let json_str: String = to_json(&css_rule)?;
/// ```
pub fn to_json<T: Serialize>(value: &T) -> napi::Result<String> {
    serde_json::to_string(value).map_err(|e| {
        napi::Error::new(
            napi::Status::InvalidArg,
            format!("Failed to serialize to JSON: {}", e),
        )
    })
}

/// Create a successful JSON response
pub fn response_ok<T: Serialize>(data: T) -> napi::Result<String> {
    let response = JsonResponse::ok(data);
    to_json(&response)
}

/// Create an error JSON response
pub fn response_err(error: String) -> String {
    match serde_json::to_string(&JsonResponse::<()>::err(error)) {
        Ok(s) => s,
        Err(_) => r#"{"status":"error","error":"Failed to serialize error response"}"#.to_string(),
    }
}

/// Parse config JSON into typed config
pub fn parse_config<T: for<'de> Deserialize<'de>>(
    config_json: &str,
) -> napi::Result<T> {
    serde_json::from_str(config_json).map_err(|e| {
        napi::Error::new(
            napi::Status::InvalidArg,
            format!("Invalid configuration JSON: {}", e),
        )
    })
}

/// Validate that a required string is not empty
pub fn validate_string(value: &str, field_name: &str) -> napi::Result<()> {
    if value.trim().is_empty() {
        return Err(napi::Error::new(
            napi::Status::InvalidArg,
            format!("{} cannot be empty", field_name),
        ));
    }
    Ok(())
}

/// Validate that a number is within range
pub fn validate_range(value: u32, min: u32, max: u32, field_name: &str) -> napi::Result<()> {
    if value < min || value > max {
        return Err(napi::Error::new(
            napi::Status::InvalidArg,
            format!("{} must be between {} and {}", field_name, min, max),
        ));
    }
    Ok(())
}

/// Extract field from JSON object with type safety
pub fn extract_field<'a, T: Deserialize<'a>>(
    obj: &'a serde_json::Value,
    field_name: &str,
) -> napi::Result<T> {
    obj.get(field_name)
        .ok_or_else(|| {
            napi::Error::new(
                napi::Status::InvalidArg,
                format!("Missing required field: {}", field_name),
            )
        })?
        .as_str()
        .ok_or_else(|| {
            napi::Error::new(
                napi::Status::InvalidArg,
                format!("Field {} must be a string", field_name),
            )
        })
        .and_then(|s| {
            serde_json::from_str(s).map_err(|e| {
                napi::Error::new(
                    napi::Status::InvalidArg,
                    format!("Failed to parse field {}: {}", field_name, e),
                )
            })
        })
}
