//! Type definitions for NAPI bridge
//!
//! This module contains all shared types used across the NAPI bridge modules.
//! Extracted from monolithic napi_bridge.rs as part of Phase 7.3 modularization.

use serde::{Deserialize, Serialize};

/// Represents a CSS rule for generation
#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct CssRule {
    /// The CSS selector
    pub selector: String,
    /// The CSS property name
    pub property: String,
    /// The CSS property value
    pub value: String,
    /// Optional media query (for responsive rules)
    pub media: Option<String>,
    /// Optional pseudo-class (e.g., :hover, :focus)
    pub pseudo: Option<String>,
    /// Source location for debugging (file:line:column)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<SourceLocation>,
}

/// Result of class parsing operation
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ParseResult {
    /// The parsed class name
    pub class_name: String,
    /// The resolved CSS rules
    pub rules: Vec<CssRule>,
    /// Indicates if class was found in theme
    pub found: bool,
    /// Optional error message if parsing failed
    pub error: Option<String>,
}

/// Source location for debugging
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SourceLocation {
    /// Source file path
    pub file: String,
    /// Line number (1-indexed)
    pub line: u32,
    /// Column number (1-indexed)
    pub column: u32,
}

impl Default for SourceLocation {
    fn default() -> Self {
        SourceLocation {
            file: String::new(),
            line: 0,
            column: 0,
        }
    }
}

/// Theme configuration for resolution
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ThemeValue {
    /// The theme value key
    pub key: String,
    /// The resolved value
    pub value: String,
    /// Indicates if value was found in theme
    pub found: bool,
}

/// Cache statistics
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CacheStats {
    /// Total number of cache hits
    pub hits: u64,
    /// Total number of cache misses
    pub misses: u64,
    /// Current cache size in bytes
    pub size_bytes: u64,
    /// Maximum cache capacity
    pub max_capacity: u64,
    /// Number of items in cache
    pub item_count: u64,
    /// Cache hit rate (0.0 - 1.0)
    pub hit_rate: f64,
}

/// Response wrapper for JSON responses
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct JsonResponse<T> {
    /// Status of the operation (success/error)
    pub status: String,
    /// The actual data
    pub data: Option<T>,
    /// Optional error message
    pub error: Option<String>,
    /// Optional metadata
    pub meta: Option<serde_json::Value>,
}

impl<T> JsonResponse<T> {
    /// Create a successful response
    pub fn ok(data: T) -> Self {
        JsonResponse {
            status: "ok".to_string(),
            data: Some(data),
            error: None,
            meta: None,
        }
    }

    /// Create an error response
    pub fn err(error: String) -> JsonResponse<()> {
        JsonResponse {
            status: "error".to_string(),
            data: None,
            error: Some(error),
            meta: None,
        }
    }
}

/// Cache configuration for backend selection
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CacheConfig {
    /// Cache backend type (lru, redis, persistent, adaptive)
    pub backend: String,
    /// Maximum cache capacity
    pub max_capacity: usize,
    /// Enable statistics tracking
    pub enable_stats: bool,
    /// Optional Redis connection URL
    pub redis_url: Option<String>,
    /// Optional persistence directory
    pub persist_dir: Option<String>,
}

impl Default for CacheConfig {
    fn default() -> Self {
        CacheConfig {
            backend: "lru".to_string(),
            max_capacity: 10000,
            enable_stats: true,
            redis_url: None,
            persist_dir: None,
        }
    }
}
