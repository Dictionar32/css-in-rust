use once_cell::sync::Lazy;
use regex::Regex;

use crate::domain::transform::ParsedClass;

static RE_TOKEN: Lazy<Regex> = Lazy::new(|| Regex::new(r"\S+").unwrap());
static RE_OPACITY: Lazy<Regex> = Lazy::new(|| Regex::new(r"^(.*)/(\d{1,3})$").unwrap());
static RE_ARBITRARY: Lazy<Regex> = Lazy::new(|| Regex::new(r"\((--[a-zA-Z0-9_-]+)\)").unwrap());

pub(crate) fn parse_classes_inner(input: &str) -> Vec<ParsedClass> {
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate vector based on whitespace token count estimates
    // Typical case: 10-15 classes per template, reducing realloc from ~5 to ~0 times
    let estimated_capacity = input.split_whitespace().count().max(1);
    let mut out: Vec<ParsedClass> = Vec::with_capacity(estimated_capacity);

    for m in RE_TOKEN.find_iter(input) {
        let token = m.as_str();
        let parts: Vec<&str> = token.split(':').collect();
        let variants = if parts.len() > 1 {
            parts[0..parts.len() - 1]
                .iter()
                .map(|s| s.to_string())
                .collect()
        } else {
            Vec::new()
        };
        let base: String = parts.last().unwrap_or(&"").to_string();

        let mut parsed = ParsedClass {
            raw: token.to_string(),
            base: base.clone(),
            variants,
            modifier_type: None,
            modifier_value: None,
        };

        if let Some(c) = RE_OPACITY.captures(&base) {
            parsed.base = c[1].to_string();
            parsed.modifier_type = Some("opacity".to_string());
            parsed.modifier_value = Some(c[2].to_string());
        } else if let Some(c) = RE_ARBITRARY.captures(&base) {
            parsed.modifier_type = Some("arbitrary".to_string());
            parsed.modifier_value = Some(c[1].to_string());
        }

        out.push(parsed);
    }
    out
}

pub(crate) fn normalise_classes(raw: &str) -> Vec<String> {
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

