//! Native template literal parser for tw() calls.

use napi_derive::napi;
use regex::Regex;
use std::collections::HashMap;
use once_cell::sync::Lazy;

static SUB_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?:\[([a-zA-Z][a-zA-Z0-9_-]*)\]|([a-zA-Z][a-zA-Z0-9_-]*))\s*\{([^}]*)\}").unwrap()
});

static COMMENT_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"//[^\n]*").unwrap()
});

#[napi(object)]
pub struct ParsedTemplateResult {
    pub base: String,
    pub subs: Vec<SubComponentEntry>,
    pub has_subs: bool,
}

#[napi(object)]
#[derive(Debug, Clone)]
pub struct SubComponentEntry {
    pub name: String,
    pub classes: String,
}

#[napi]
pub fn parse_template_native(template_parts: Vec<String>, expr_values: Vec<String>) -> ParsedTemplateResult {
    let raw = template_parts.iter().enumerate().fold(String::new(), |mut acc, (i, part)| {
        acc.push_str(part);
        if i < expr_values.len() {
            let expr_str = &expr_values[i];
            if !expr_str.is_empty() {
                acc.push_str(expr_str);
            }
        }
        acc
    });

    let subs = extract_sub_components(&raw);
    let has_subs = !subs.is_empty();
    let base = remove_sub_components(&raw);

    ParsedTemplateResult {
        base,
        subs,
        has_subs,
    }
}

#[napi(object)]
pub struct ConfigValidationError {
    pub error_type: String,
    pub key: String,
    pub value: Option<String>,
    pub message: String,
}

#[napi(object)]
pub struct ConfigValidationResult {
    pub valid: bool,
    pub errors: Vec<ConfigValidationError>,
    pub warnings: Vec<String>,
}

#[napi]
pub fn validate_component_config_native(
    variants_json: String,
    default_variants_json: String,
    compound_variants_json: String,
) -> ConfigValidationResult {
    let variants: HashMap<String, HashMap<String, String>> = serde_json::from_str(&variants_json).unwrap_or_default();
    let default_variants: HashMap<String, String> = serde_json::from_str(&default_variants_json).unwrap_or_default();
    let compound_variants: Vec<HashMap<String, String>> = serde_json::from_str(&compound_variants_json).unwrap_or_default();

    let mut errors = vec![];
    let warnings = vec![];

    for (key, val) in &default_variants {
        if !variants.contains_key(key) {
            errors.push(ConfigValidationError {
                error_type: "unknown_key".to_string(),
                key: key.clone(),
                value: Some(val.clone()),
                message: format!("defaultVariants[\"{}\"] not in variants", key),
            });
        } else if !variants.get(key).map(|v| v.contains_key(val)).unwrap_or(false) {
            errors.push(ConfigValidationError {
                error_type: "unknown_value".to_string(),
                key: key.clone(),
                value: Some(val.clone()),
                message: format!("invalid value \"{}\" for key \"{}\"", val, key),
            });
        }
    }

    for (i, compound) in compound_variants.iter().enumerate() {
        for (key, _val) in compound {
            if key != "class" && key != "className" && !variants.contains_key(key) {
                errors.push(ConfigValidationError {
                    error_type: "unknown_key".to_string(),
                    key: key.clone(),
                    value: None,
                    message: format!("compoundVariants[{}]: \"{}\" not in variants", i, key),
                });
            }
        }
    }

    ConfigValidationResult {
        valid: errors.is_empty(),
        errors,
        warnings,
    }
}

fn extract_sub_components(raw: &str) -> Vec<SubComponentEntry> {
    let mut subs = Vec::new();
    for cap in SUB_RE.captures_iter(raw) {
        let name = cap.get(1).or_else(|| cap.get(2)).map(|m| m.as_str().to_string());
        let classes = cap.get(3).map(|m| m.as_str().to_string());

        if let (Some(name), Some(classes)) = (name, classes) {
            let cleaned = classes
                .lines()
                .map(|l| l.trim())
                .filter(|l| !l.is_empty())
                .collect::<Vec<_>>()
                .join(" ")
                .split_whitespace()
                .collect::<Vec<_>>()
                .join(" ");

            subs.push(SubComponentEntry { name, classes: cleaned });
        }
    }
    subs
}

fn remove_sub_components(raw: &str) -> String {
    let no_comments = COMMENT_RE.replace_all(raw, "");
    let no_subs = SUB_RE.replace_all(&no_comments, "");

    no_subs
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty())
        .collect::<Vec<_>>()
        .join(" ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_template_simple() {
        let result = parse_template_native(
            vec!["p-4 bg-zinc-900".to_string()],
            vec![],
        );
        assert_eq!(result.base, "p-4 bg-zinc-900");
        assert!(!result.has_subs);
    }

    #[test]
    fn test_validate_config_ok() {
        let variants = serde_json::json!({"size": {"sm": "text-sm"}}).to_string();
        let defaults = serde_json::json!({"size": "sm"}).to_string();
        let compounds = serde_json::json!([]).to_string();
        
        let result = validate_component_config_native(variants, defaults, compounds);
        assert!(result.valid);
    }
}
