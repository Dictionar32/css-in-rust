use once_cell::sync::Lazy;
use regex::Regex;

use crate::domain::transform::ParsedClass;

static RE_TOKEN: Lazy<Regex> = Lazy::new(|| Regex::new(r"\S+").unwrap());
static RE_OPACITY: Lazy<Regex> = Lazy::new(|| Regex::new(r"^(.*)/(\d{1,3})$").unwrap());
static RE_ARBITRARY: Lazy<Regex> = Lazy::new(|| Regex::new(r"\((--[a-zA-Z0-9_-]+)\)").unwrap());

pub fn parse_classes_inner(input: &str) -> Vec<ParsedClass> {
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate vector based on whitespace token count estimates
    // Typical case: 10-15 classes per template, reducing realloc from ~5 to ~0 times
    let estimated_capacity = input.split_whitespace().count().max(1);
    let mut out: Vec<ParsedClass> = Vec::with_capacity(estimated_capacity);

    for m in RE_TOKEN.find_iter(input) {
        let token = m.as_str();
        let parts: Vec<&str> = token.split(':').collect();
        let variants_str = if parts.len() > 1 {
            parts[0..parts.len() - 1]
                .iter()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
        } else {
            Vec::new()
        };
        let base: String = parts.last().unwrap_or(&"").to_string();

        let mut modifier_type = None;
        let mut modifier_value = None;

        if let Some(c) = RE_OPACITY.captures(&base) {
            modifier_type = Some("opacity".to_string());
            modifier_value = Some(c[2].to_string());
        } else if let Some(c) = RE_ARBITRARY.captures(&base) {
            modifier_type = Some("arbitrary".to_string());
            modifier_value = Some(c[1].to_string());
        }

        // Parse variants to Variant enum
        let mut variants = crate::domain::transform::VariantList::new();
        for var_str in &variants_str {
            if let Ok(variant) = var_str.parse::<crate::domain::variant::Variant>() {
                variants.push(variant);
            }
        }

        let parsed = ParsedClass {
            raw: token.to_string(),
            base: base.clone(),
            prefix: String::new(), // Will be parsed later
            value: base.clone(),
            variants,
            variants_str,
            modifier_type,
            modifier_value,
            is_arbitrary: false,
            arbitrary_declaration: None,
        };

        out.push(parsed);
    }
    out
}

pub fn normalise_classes(raw: &str) -> Vec<String> {
    let parsed = parse_classes_inner(raw);
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate with exact capacity
    let mut classes: Vec<String> = Vec::with_capacity(parsed.len());
    for p in parsed {
        classes.push(p.raw);
    }
    classes.sort();
    classes.dedup();
    classes
}
