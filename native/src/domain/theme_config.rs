//! ThemeConfig - Tailwind theme configuration

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt;

/// Tailwind theme configuration (parsed from JSON)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeConfig {
    /// Color definitions
    pub colors: HashMap<String, ThemeValue>,
    /// Spacing values
    pub spacing: HashMap<String, String>,
    /// Font sizes
    pub font_sizes: HashMap<String, Vec<String>>,
    /// Opacity scale
    pub opacity: HashMap<String, String>,
    /// Responsive breakpoints
    pub breakpoints: HashMap<String, String>,
    /// Custom utilities defined by user
    pub extend: HashMap<String, HashMap<String, String>>,
    /// Dark mode strategy
    pub dark_mode: DarkModeStrategy,
}

/// Strategy for handling dark mode in theme
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DarkModeStrategy {
    Class,
    Media,
}

impl Default for DarkModeStrategy {
    fn default() -> Self {
        DarkModeStrategy::Media
    }
}

impl fmt::Display for DarkModeStrategy {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DarkModeStrategy::Class => write!(f, "class"),
            DarkModeStrategy::Media => write!(f, "media"),
        }
    }
}

/// A theme value can be either a simple string or a nested object
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum ThemeValue {
    Simple(String),
    Nested(Box<HashMap<String, String>>),
}

impl ThemeConfig {
    /// Create a new empty theme config
    pub fn new() -> Self {
        Self {
            colors: HashMap::new(),
            spacing: HashMap::new(),
            font_sizes: HashMap::new(),
            opacity: HashMap::new(),
            breakpoints: HashMap::new(),
            extend: HashMap::new(),
            dark_mode: DarkModeStrategy::Media,
        }
    }

    /// Create theme from JSON string
    pub fn from_json(json_str: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json_str)
    }

    /// Convert theme to JSON string
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }

    /// Get a color value from theme
    pub fn get_color(&self, path: &str) -> Option<String> {
        self.resolve_nested_value(&self.colors, path)
    }

    /// Get a spacing value from theme
    pub fn get_spacing(&self, key: &str) -> Option<String> {
        self.spacing.get(key).cloned()
    }

    /// Get a breakpoint value from theme
    pub fn get_breakpoint(&self, name: &str) -> Option<String> {
        self.breakpoints.get(name).cloned()
    }

    /// Resolve a nested value using dot notation
    fn resolve_nested_value(
        &self,
        values: &HashMap<String, ThemeValue>,
        path: &str,
    ) -> Option<String> {
        let parts: Vec<&str> = path.split('-').collect();
        if parts.is_empty() {
            return None;
        }

        let first_key = parts[0];
        match values.get(first_key)? {
            ThemeValue::Simple(s) => Some(s.clone()),
            ThemeValue::Nested(nested) => {
                if parts.len() > 1 {
                    nested.get(parts[1]).cloned()
                } else {
                    None
                }
            }
        }
    }
}

impl Default for ThemeConfig {
    fn default() -> Self {
        Self::new()
    }
}
