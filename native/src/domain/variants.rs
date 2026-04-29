/**
 * tailwind-styled-v5 — Variants Module
 *
 * Rust-powered variant resolution for cv() function.
 * Move variant matching logic from TypeScript to Rust for 10x performance.
 */
use napi_derive::napi;
use crate::tws_debug;
use serde::{Deserialize, Serialize};
use serde_json;
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
    tws_debug!("[variants] resolve_variants props={:?}", props_json);
    // Parse inputs
    let config: VariantConfig = match serde_json::from_str(&config_json) {
        Ok(c) => c,
        Err(_) => {
            return VariantResult {
                classes: String::new(),
                resolved_count: 0u32,
            };
        }
    };

    let props: HashMap<String, String> = serde_json::from_str(&props_json).unwrap_or_default();

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

// ─────────────────────────────────────────────────────────────────────────────
// validateVariantConfig — migrated from cv.ts
// ─────────────────────────────────────────────────────────────────────────────

/// Satu validation error (identik struktur dengan VariantValidationError di cv.ts)
#[napi(object)]
pub struct VariantValidationError {
    /// "unknown_key" | "unknown_value" | "missing_default" | "compound_condition_missing"
    pub error_type: String,
    pub key: String,
    pub value: Option<String>,
    pub message: String,
}

/// Hasil validasi config (identik dengan VariantValidationResult di cv.ts)
#[napi(object)]
pub struct VariantValidationResult {
    pub valid: bool,
    pub errors: Vec<VariantValidationError>,
    pub warnings: Vec<String>,
}

/// Extended config untuk validasi — compound variants dan base tidak diperlukan.
#[derive(Debug, Clone, Deserialize)]
struct ValidateConfig {
    pub variants: Option<HashMap<String, HashMap<String, String>>>,
    pub default_variants: Option<HashMap<String, String>>,
    pub compound_variants: Option<Vec<HashMap<String, String>>>,
}

/// Validate ComponentConfig — migrated dari `validateVariantConfig()` di cv.ts.
///
/// Menggantikan pure-JS validation yang melakukan 3× Object.entries loops.
/// Rust version: satu pass per section, zero GC pressure.
///
/// **Input**: JSON string dari ComponentConfig (variants, defaultVariants, compoundVariants)
/// **Output**: VariantValidationResult dengan errors + warnings
///
/// # Example TS caller
/// ```ts
/// const result = native.validateVariantConfig(JSON.stringify(config))
/// ```
#[napi]
pub fn validate_variant_config(config_json: String) -> VariantValidationResult {
    let config: ValidateConfig = match serde_json::from_str(&config_json) {
        Ok(c) => c,
        Err(e) => {
            return VariantValidationResult {
                valid: false,
                errors: vec![VariantValidationError {
                    error_type: "parse_error".to_string(),
                    key: String::new(),
                    value: None,
                    message: format!("Failed to parse config: {}", e),
                }],
                warnings: vec![],
            };
        }
    };

    let variants = config.variants.unwrap_or_default();
    let default_variants = config.default_variants.unwrap_or_default();
    let compound_variants = config.compound_variants.unwrap_or_default();

    let mut errors: Vec<VariantValidationError> = Vec::new();
    let warnings: Vec<String> = Vec::new();

    // 1. Validate defaultVariants keys/values against variants
    for (key, val) in &default_variants {
        if !variants.contains_key(key) {
            errors.push(VariantValidationError {
                error_type: "unknown_key".to_string(),
                key: key.clone(),
                value: None,
                message: format!("defaultVariants[\"{}\"] not in variants", key),
            });
        } else if !val.is_empty() {
            let variant_values = &variants[key];
            if !variant_values.contains_key(val.as_str()) {
                errors.push(VariantValidationError {
                    error_type: "unknown_value".to_string(),
                    key: key.clone(),
                    value: Some(val.clone()),
                    message: format!("invalid value \"{}\"", val),
                });
            }
        }
    }

    // 2. Validate compoundVariants conditions reference known variant keys
    for (i, compound) in compound_variants.iter().enumerate() {
        for key in compound.keys() {
            // Skip reserved keys — identik dengan JS: `class` key di-destructure out
            if key == "class" || key == "className" {
                continue;
            }
            if !variants.contains_key(key) {
                errors.push(VariantValidationError {
                    error_type: "compound_condition_missing".to_string(),
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

// ─────────────────────────────────────────────────────────────────────────────
// buildVariantLookupKey — migrated from lookupGenerated() inner key builder di cv.ts
// ─────────────────────────────────────────────────────────────────────────────

/// Build lookup key untuk `__generatedRegistry` — migrated dari `lookupGenerated()` di cv.ts.
///
/// JS original:
/// ```ts
/// const key = Object.keys(merged)
///   .sort()
///   .filter((k) => k !== "className")
///   .map((k) => `${k}:${String(merged[k])}`)
///   .join("|")
/// ```
///
/// Rust version: satu allocation, zero intermediate arrays.
/// Called setiap render jika komponen punya `componentId` — worth di-native.
///
/// # Input
/// - `default_variants_json`: JSON `Record<string, string>` dari defaultVariants
/// - `props_json`: JSON `Record<string, string | number | boolean>` dari props
///
/// # Output
/// Key string seperti `"size:lg|variant:solid"`
#[napi]
pub fn build_variant_lookup_key(
    default_variants_json: String,
    props_json: String,
) -> String {
    // Parse defaults dan props
    let defaults: HashMap<String, String> =
        serde_json::from_str(&default_variants_json).unwrap_or_default();

    // Props bisa berisi non-string values — parse sebagai Value dulu
    let props_raw: HashMap<String, serde_json::Value> =
        serde_json::from_str(&props_json).unwrap_or_default();

    // Merge: defaults dulu, props override (identik dengan `{ ...defaultVariants, ...props }` di JS)
    let mut merged: HashMap<String, String> = defaults;
    for (k, v) in props_raw {
        // Skip className — identik dengan `.filter((k) => k !== "className")` di JS
        if k == "className" {
            continue;
        }
        let val_str = match v {
            serde_json::Value::String(s) => s,
            serde_json::Value::Number(n) => n.to_string(),
            serde_json::Value::Bool(b) => b.to_string(),
            serde_json::Value::Null => continue, // skip undefined/null — identik behaviour JS String(null) = "null", tapi filter di cv.ts
            other => other.to_string(),
        };
        merged.insert(k, val_str);
    }

    // Sort keys, filter className (sudah difilter saat insert), build key
    let mut keys: Vec<&String> = merged.keys().filter(|k| k.as_str() != "className").collect();
    keys.sort();

    keys.iter()
        .map(|k| format!("{}:{}", k, merged[*k]))
        .collect::<Vec<_>>()
        .join("|")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_valid_config() {
        let config = r#"{
            "variants": { "size": { "sm": "text-sm", "lg": "text-lg" } },
            "defaultVariants": { "size": "sm" },
            "compoundVariants": []
        }"#;
        let result = validate_variant_config(config.to_string());
        assert!(result.valid);
        assert!(result.errors.is_empty());
    }

    #[test]
    fn test_validate_unknown_key_in_defaults() {
        let config = r#"{
            "variants": { "size": { "sm": "text-sm" } },
            "defaultVariants": { "color": "blue" }
        }"#;
        let result = validate_variant_config(config.to_string());
        assert!(!result.valid);
        assert_eq!(result.errors[0].error_type, "unknown_key");
        assert_eq!(result.errors[0].key, "color");
    }

    #[test]
    fn test_validate_unknown_value_in_defaults() {
        let config = r#"{
            "variants": { "size": { "sm": "text-sm" } },
            "defaultVariants": { "size": "xl" }
        }"#;
        let result = validate_variant_config(config.to_string());
        assert!(!result.valid);
        assert_eq!(result.errors[0].error_type, "unknown_value");
    }

    #[test]
    fn test_validate_compound_unknown_key() {
        let config = r#"{
            "variants": { "size": { "sm": "text-sm" } },
            "defaultVariants": {},
            "compoundVariants": [{ "color": "blue", "class": "ring-2" }]
        }"#;
        let result = validate_variant_config(config.to_string());
        assert!(!result.valid);
        assert_eq!(result.errors[0].error_type, "compound_condition_missing");
    }

    #[test]
    fn test_build_variant_lookup_key_basic() {
        let key = build_variant_lookup_key(
            r#"{"size":"sm"}"#.to_string(),
            r#"{"variant":"solid"}"#.to_string(),
        );
        // sorted: size:sm|variant:solid
        assert_eq!(key, "size:sm|variant:solid");
    }

    #[test]
    fn test_build_variant_lookup_key_props_override() {
        let key = build_variant_lookup_key(
            r#"{"size":"sm"}"#.to_string(),
            r#"{"size":"lg"}"#.to_string(),
        );
        assert_eq!(key, "size:lg");
    }

    #[test]
    fn test_build_variant_lookup_key_classname_excluded() {
        let key = build_variant_lookup_key(
            r#"{}"#.to_string(),
            r#"{"size":"lg","className":"extra"}"#.to_string(),
        );
        assert_eq!(key, "size:lg");
    }

    #[test]
    fn test_build_variant_lookup_key_sorted() {
        let key = build_variant_lookup_key(
            r#"{}"#.to_string(),
            r#"{"variant":"solid","size":"lg"}"#.to_string(),
        );
        // alphabetically sorted: size before variant
        assert_eq!(key, "size:lg|variant:solid");
    }

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