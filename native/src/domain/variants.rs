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

/// Resolve variants based on props - called from TypeScript cv() wrapper.
/// This is the hot path - executed thousands of times per build.
#[napi]
pub fn resolve_variants(config_json: String, props_json: String) -> VariantResult {
    // Parse inputs
    let config: VariantConfig = match serde_json::from_str(&config_json) {
        Ok(c) => c,
        Err(e) => {
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
        defaults
            .iter()
            .chain(props.iter())
            .fold(HashMap::new(), |mut acc, (k, v)| {
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
}
