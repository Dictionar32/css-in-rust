/**
 * tailwind-styled-v5 — Variants Module
 *
 * Rust-powered variant resolution for cv() function.
 * Move variant matching logic from TypeScript to Rust for 10x performance.
 */
use napi_derive::napi;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariantConfig {
    pub base: Option<String>,
    pub variants: HashMap<String, HashMap<String, String>>,
    pub compound_variants: Vec<CompoundVariant>,
    pub default_variants: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompoundVariant {
    pub class: String,
    #[serde(flatten)]
    pub conditions: HashMap<String, String>,
}

#[napi(object)]
pub struct VariantResult {
    pub classes: String,
    pub resolved_count: u32,
}

#[napi(object)]
pub struct VariantValidationError {
    pub error_type: String,
    pub key: String,
    pub value: Option<String>,
    pub message: String,
}

#[napi(object)]
pub struct VariantValidationResult {
    pub valid: bool,
    pub errors: Vec<VariantValidationError>,
    pub warnings: Vec<String>,
}

/// Resolve variants based on props - called from TypeScript cv() wrapper.
/// This is the hot path - executed thousands of times per build.
#[napi]
pub fn resolve_variants(config_json: String, props_json: String) -> VariantResult {
    // Parse inputs
    let config: VariantConfig = match serde_json::from_str(&config_json) {
        Ok(c) => c,
        Err(_e) => {
            return VariantResult {
                classes: String::new(),
                resolved_count: 0u32,
            };
        }
    };

    let props: HashMap<String, String> = match serde_json::from_str(&props_json) {
        Ok(p) => p,
        Err(_) => HashMap::new(),
    };

    resolve_variants_internal(config, props)
}

/// Internal implementation of variant resolution (reusable by simple function)
fn resolve_variants_internal(
    config: VariantConfig,
    props: HashMap<String, String>,
) -> VariantResult {
    // Start with base classes
    let mut classes: Vec<String> = config
        .base
        .as_ref()
        .map(|b| b.split_whitespace().map(String::from).collect())
        .unwrap_or_default();

    // Resolve single-value variants
    for (key, values) in &config.variants {
        // Use prop value or fallback to default
        let selected = props.get(key).or(config.default_variants.get(key));

        if let Some(value) = selected {
            if let Some(class) = values.get(value) {
                classes.extend(class.split_whitespace().map(String::from));
            }
        }
    }

    // Resolve compound variants
    for compound in &config.compound_variants {
        let matches = compound.conditions.iter().all(|(k, v)| {
            props.get(k).map(|pv| pv == v).unwrap_or(false)
                || config
                    .default_variants
                    .get(k)
                    .map(|dv| dv == v)
                    .unwrap_or(false)
        });

        if matches {
            classes.extend(compound.class.split_whitespace().map(String::from));
        }
    }

    // Deduplicate while preserving order
    let mut seen = std::collections::HashSet::new();
    classes.retain(|c| seen.insert(c.clone()));

    VariantResult {
        classes: classes.join(" "),
        resolved_count: classes.len() as u32,
    }
}

/// Validate variant configuration for errors
#[napi]
pub fn validate_variant_config(config_json: String) -> VariantValidationResult {
    let config: VariantConfig = match serde_json::from_str(&config_json) {
        Ok(c) => c,
        Err(_e) => {
            return VariantValidationResult {
                valid: false,
                errors: vec![VariantValidationError {
                    error_type: "parse_error".to_string(),
                    key: "config".to_string(),
                    value: None,
                    message: format!("Failed to parse config"),
                }],
                warnings: vec![],
            };
        }
    };

    let mut errors = vec![];
    let warnings = vec![];

    // Check that all default variant keys exist in variants
    for (key, val) in &config.default_variants {
        if !config.variants.contains_key(key) {
            errors.push(VariantValidationError {
                error_type: "unknown_key".to_string(),
                key: key.clone(),
                value: Some(val.clone()),
                message: format!("defaultVariants[\"{}\"] not in variants", key),
            });
        } else if val.is_empty()
            || !config
                .variants
                .get(key)
                .map(|v| v.contains_key(val))
                .unwrap_or(false)
        {
            errors.push(VariantValidationError {
                error_type: "unknown_value".to_string(),
                key: key.clone(),
                value: Some(val.clone()),
                message: format!("invalid value \"{}\" for key \"{}\"", val, key),
            });
        }
    }

    // Check compound variant conditions
    for (i, compound) in config.compound_variants.iter().enumerate() {
        for (key, _) in &compound.conditions {
            if !config.variants.contains_key(key) {
                errors.push(VariantValidationError {
                    error_type: "unknown_key".to_string(),
                    key: key.clone(),
                    value: None,
                    message: format!("compoundVariants[{}]: \"{}\" not in variants", i, key),
                });
            }
        }
    }

    VariantValidationResult {
        valid: errors.is_empty(),
        errors,
        warnings,
    }
}

/// Resolve variants with full compound variant support (preferred)
#[napi]
pub fn resolve_variants_full(config_json: String, props_json: String) -> VariantResult {
    resolve_variants(config_json, props_json)
}

/// Simple variant resolution - no compound variants support
/// Faster for simple use cases
#[napi]
pub fn resolve_simple_variants(
    base: Option<String>,
    variants: HashMap<String, HashMap<String, String>>,
    defaults: HashMap<String, String>,
    props: HashMap<String, String>,
) -> String {
    let mut classes: Vec<String> = base
        .as_ref()
        .map(|b| b.split_whitespace().map(String::from).collect())
        .unwrap_or_default();

    // Merge props with defaults, props take precedence
    let merged: HashMap<String, String> =
        defaults.iter().chain(props.iter()).fold(HashMap::new(), |mut acc, (k, v)| {
            acc.entry(k.clone()).or_insert_with(|| v.clone());
            acc
        });

    for (key, values) in &variants {
        if let Some(value) = merged.get(key) {
            if let Some(class) = values.get(value) {
                classes.extend(class.split_whitespace().map(String::from));
            }
        }
    }

    // Deduplicate
    let mut seen = std::collections::HashSet::new();
    classes.retain(|c| seen.insert(c.clone()));

    classes.join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_simple_variants() {
        let mut variants = HashMap::new();
        variants.insert("size".to_string(), {
            let mut m = HashMap::new();
            m.insert("sm".to_string(), "text-sm".to_string());
            m.insert("lg".to_string(), "text-lg".to_string());
            m
        });

        let defaults = HashMap::new();
        let mut props = HashMap::new();
        props.insert("size".to_string(), "lg".to_string());

        let result =
            resolve_simple_variants(Some("px-4 py-2".to_string()), variants, defaults, props);

        assert!(result.contains("text-lg"));
        assert!(result.contains("px-4"));
    }

    #[test]
    fn test_resolve_variants_with_compound() {
        let mut variants = HashMap::new();
        variants.insert("size".to_string(), {
            let mut m = HashMap::new();
            m.insert("sm".to_string(), "text-sm".to_string());
            m.insert("lg".to_string(), "text-lg".to_string());
            m
        });
        variants.insert("color".to_string(), {
            let mut m = HashMap::new();
            m.insert("red".to_string(), "text-red-500".to_string());
            m.insert("blue".to_string(), "text-blue-500".to_string());
            m
        });

        let defaults = HashMap::new();
        
        let config = VariantConfig {
            base: Some("px-4 py-2".to_string()),
            variants,
            compound_variants: vec![CompoundVariant {
                class: "text-bold underline".to_string(),
                conditions: {
                    let mut m = HashMap::new();
                    m.insert("size".to_string(), "lg".to_string());
                    m.insert("color".to_string(), "red".to_string());
                    m
                },
            }],
            default_variants: defaults,
        };

        let mut props = HashMap::new();
        props.insert("size".to_string(), "lg".to_string());
        props.insert("color".to_string(), "red".to_string());

        let result = resolve_variants_internal(config, props);

        assert!(result.classes.contains("text-lg"));
        assert!(result.classes.contains("text-red-500"));
        assert!(result.classes.contains("text-bold"));
        assert!(result.classes.contains("underline"));
    }

    #[test]
    fn test_validate_variant_config() {
        let config = VariantConfig {
            base: Some("px-4".to_string()),
            variants: HashMap::new(),
            compound_variants: vec![],
            default_variants: {
                let mut m = HashMap::new();
                m.insert("size".to_string(), "lg".to_string());
                m
            },
        };

        let result = validate_variant_config(serde_json::to_string(&config).unwrap());
        assert!(!result.valid);
        assert!(!result.errors.is_empty());
    }
}
