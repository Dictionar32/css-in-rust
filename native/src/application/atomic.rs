//! Atomic CSS — Rust implementation
//!
//! Replaces JS dari `packages/domain/atomic/src/index.ts`:
//!   - parseAtomicClass()     → parse_atomic_class()
//!   - generateAtomicCss()    → generate_atomic_css()
//!   - toAtomicClasses()      → to_atomic_classes()
//!
//! Registry (JS Map) → DashMap (thread-safe, zero-copy lookup).
//! Value transforms (sizeValue, textSize, fontWeight, leadingValue, roundedValue)
//! match JS behavior 1:1.

use dashmap::DashMap;
use napi_derive::napi;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

// ─────────────────────────────────────────────────────────────────────────────
// Global registry (DashMap replaces JS `const REGISTRY = new Map<string, AtomicRule>()`)
// ─────────────────────────────────────────────────────────────────────────────

static REGISTRY: Lazy<DashMap<String, AtomicRule>> = Lazy::new(DashMap::new);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtomicRule {
    #[serde(rename = "twClass")]
    pub tw_class: String,
    #[serde(rename = "atomicName")]
    pub atomic_name: String,
    pub property: String,
    pub value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modifier: Option<String>,
}

#[derive(Debug, Serialize)]
struct ToAtomicResult {
    #[serde(rename = "atomicClasses")]
    atomic_classes: String,
    rules: Vec<AtomicRule>,
    #[serde(rename = "unknownClasses")]
    unknown_classes: Vec<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// TW_PROPERTY_MAP — mirrors JS const exactly
// ─────────────────────────────────────────────────────────────────────────────

struct PropMapping {
    prop: &'static str,
    transform: Option<fn(&str) -> String>,
}

fn tw_property_map(prefix: &str) -> Option<PropMapping> {
    match prefix {
        "p" => Some(PropMapping {
            prop: "padding",
            transform: Some(spacing),
        }),
        "px" => Some(PropMapping {
            prop: "padding-inline",
            transform: Some(spacing),
        }),
        "py" => Some(PropMapping {
            prop: "padding-block",
            transform: Some(spacing),
        }),
        "pt" => Some(PropMapping {
            prop: "padding-top",
            transform: Some(spacing),
        }),
        "pb" => Some(PropMapping {
            prop: "padding-bottom",
            transform: Some(spacing),
        }),
        "pl" => Some(PropMapping {
            prop: "padding-left",
            transform: Some(spacing),
        }),
        "pr" => Some(PropMapping {
            prop: "padding-right",
            transform: Some(spacing),
        }),
        "m" => Some(PropMapping {
            prop: "margin",
            transform: Some(spacing),
        }),
        "mx" => Some(PropMapping {
            prop: "margin-inline",
            transform: Some(spacing),
        }),
        "my" => Some(PropMapping {
            prop: "margin-block",
            transform: Some(spacing),
        }),
        "mt" => Some(PropMapping {
            prop: "margin-top",
            transform: Some(spacing),
        }),
        "mb" => Some(PropMapping {
            prop: "margin-bottom",
            transform: Some(spacing),
        }),
        "ml" => Some(PropMapping {
            prop: "margin-left",
            transform: Some(spacing),
        }),
        "mr" => Some(PropMapping {
            prop: "margin-right",
            transform: Some(spacing),
        }),
        "gap" => Some(PropMapping {
            prop: "gap",
            transform: Some(spacing),
        }),
        "w" => Some(PropMapping {
            prop: "width",
            transform: Some(size_value),
        }),
        "h" => Some(PropMapping {
            prop: "height",
            transform: Some(size_value),
        }),
        "text" => Some(PropMapping {
            prop: "font-size",
            transform: Some(text_size),
        }),
        "font" => Some(PropMapping {
            prop: "font-weight",
            transform: Some(font_weight),
        }),
        "leading" => Some(PropMapping {
            prop: "line-height",
            transform: Some(leading_value),
        }),
        "opacity" => Some(PropMapping {
            prop: "opacity",
            transform: Some(opacity_value),
        }),
        "z" => Some(PropMapping {
            prop: "z-index",
            transform: None,
        }),
        "rounded" => Some(PropMapping {
            prop: "border-radius",
            transform: Some(rounded_value),
        }),
        _ => None,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Value transform functions — match JS 1:1
// ─────────────────────────────────────────────────────────────────────────────

/// `transform: (v) => \`${Number(v) * 0.25}rem\``
fn spacing(v: &str) -> String {
    match v.parse::<f64>() {
        Ok(n) => format!("{}rem", n * 0.25),
        Err(_) => v.to_string(),
    }
}

/// sizeValue(v)
fn size_value(v: &str) -> String {
    if let Ok(n) = v.parse::<f64>() {
        return format!("{}rem", n * 0.25);
    }
    match v {
        "full" => "100%".to_string(),
        "screen" => "100vw".to_string(),
        "auto" => "auto".to_string(),
        "min" => "min-content".to_string(),
        "max" => "max-content".to_string(),
        "fit" => "fit-content".to_string(),
        "svw" => "100svw".to_string(),
        "svh" => "100svh".to_string(),
        other => other.to_string(),
    }
}

/// textSize(v)
fn text_size(v: &str) -> String {
    match v {
        "xs" => "0.75rem".to_string(),
        "sm" => "0.875rem".to_string(),
        "base" => "1rem".to_string(),
        "lg" => "1.125rem".to_string(),
        "xl" => "1.25rem".to_string(),
        "2xl" => "1.5rem".to_string(),
        "3xl" => "1.875rem".to_string(),
        "4xl" => "2.25rem".to_string(),
        "5xl" => "3rem".to_string(),
        "6xl" => "3.75rem".to_string(),
        "7xl" => "4.5rem".to_string(),
        "8xl" => "6rem".to_string(),
        "9xl" => "8rem".to_string(),
        other => other.to_string(),
    }
}

/// fontWeight(v)
fn font_weight(v: &str) -> String {
    match v {
        "thin" => "100".to_string(),
        "extralight" => "200".to_string(),
        "light" => "300".to_string(),
        "normal" => "400".to_string(),
        "medium" => "500".to_string(),
        "semibold" => "600".to_string(),
        "bold" => "700".to_string(),
        "extrabold" => "800".to_string(),
        "black" => "900".to_string(),
        other => other.to_string(),
    }
}

/// leadingValue(v)
fn leading_value(v: &str) -> String {
    match v {
        "none" => "1".to_string(),
        "tight" => "1.25".to_string(),
        "snug" => "1.375".to_string(),
        "normal" => "1.5".to_string(),
        "relaxed" => "1.625".to_string(),
        "loose" => "2".to_string(),
        other => other.to_string(),
    }
}

/// `transform: (v) => String(Number(v) / 100)`
fn opacity_value(v: &str) -> String {
    match v.parse::<f64>() {
        Ok(n) => format!("{}", n / 100.0),
        Err(_) => v.to_string(),
    }
}

/// roundedValue(v) — empty string key = no suffix after "rounded"
fn rounded_value(v: &str) -> String {
    match v {
        "" => "0.25rem".to_string(),
        "sm" => "0.125rem".to_string(),
        "md" => "0.375rem".to_string(),
        "lg" => "0.5rem".to_string(),
        "xl" => "0.75rem".to_string(),
        "2xl" => "1rem".to_string(),
        "3xl" => "1.5rem".to_string(),
        "full" => "9999px".to_string(),
        "none" => "0".to_string(),
        other => format!("{}rem", other),
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeClassName — mirrors JS `.replace(/[/:[\\].!%]/g, "_")`
// ─────────────────────────────────────────────────────────────────────────────

fn sanitize_class_name(cls: &str) -> String {
    cls.chars()
        .map(|c| match c {
            '/' | ':' | '[' | ']' | '.' | '!' | '%' => '_',
            other => other,
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// Core parse logic (shared between napi and internal)
// ─────────────────────────────────────────────────────────────────────────────

fn parse_atomic_class_inner(tw_class: &str) -> Option<AtomicRule> {
    // Check registry first
    if let Some(cached) = REGISTRY.get(tw_class) {
        return Some(cached.clone());
    }

    // Split modifier (everything before last `:`)
    let (modifier, base) = match tw_class.rfind(':') {
        Some(idx) => (Some(tw_class[..idx].to_string()), &tw_class[idx + 1..]),
        None => (None, tw_class),
    };

    // Need at least one `-`
    let dash_idx = base.find('-')?;
    let prefix = &base[..dash_idx];
    let value = &base[dash_idx + 1..];

    let mapping = tw_property_map(prefix)?;

    // Special case: `rounded` with no value → value is ""
    let css_value = if let Some(transform) = mapping.transform {
        transform(value)
    } else {
        value.to_string()
    };

    let atomic_name = format!("_tw_{}", sanitize_class_name(tw_class));

    let rule = AtomicRule {
        tw_class: tw_class.to_string(),
        atomic_name,
        property: mapping.prop.to_string(),
        value: css_value,
        modifier,
    };

    REGISTRY.insert(tw_class.to_string(), rule.clone());
    Some(rule)
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI exports
// ─────────────────────────────────────────────────────────────────────────────

/// Parse a single Tailwind class into an AtomicRule JSON string, or null string if unknown.
///
/// JS equivalent: `parseAtomicClass(twClass: string): AtomicRule | null`
#[napi]
pub fn parse_atomic_class(tw_class: String) -> Option<String> {
    parse_atomic_class_inner(&tw_class).and_then(|rule| serde_json::to_string(&rule).ok())
}

/// Generate CSS string from an array of AtomicRule JSON.
///
/// Input JSON: `Array<AtomicRule>`
/// Output: CSS string
///
/// JS equivalent: `generateAtomicCss(rules: AtomicRule[]): string`
#[napi]
pub fn generate_atomic_css(rules_json: String) -> String {
    let rules: Vec<AtomicRule> = match serde_json::from_str(&rules_json) {
        Ok(r) => r,
        Err(_) => return String::new(),
    };

    let breakpoints: &[(&str, &str)] = &[
        ("sm", "640px"),
        ("md", "768px"),
        ("lg", "1024px"),
        ("xl", "1280px"),
        ("2xl", "1536px"),
    ];

    let mut lines: Vec<String> = Vec::with_capacity(rules.len() * 2);

    for rule in &rules {
        let selector = format!(".{}", rule.atomic_name);

        match &rule.modifier {
            Some(modifier) => {
                // Check if it's a breakpoint modifier
                if let Some(bp) = breakpoints.iter().find(|(bp, _)| *bp == modifier.as_str()) {
                    lines.push(format!("@media (min-width: {}) {{", bp.1));
                    lines.push(format!(
                        "  {} {{ {}: {}; }}",
                        selector, rule.property, rule.value
                    ));
                    lines.push("}".to_string());
                } else {
                    lines.push(format!(
                        "{}:{} {{ {}: {}; }}",
                        selector, modifier, rule.property, rule.value
                    ));
                }
            }
            None => {
                lines.push(format!(
                    "{} {{ {}: {}; }}",
                    selector, rule.property, rule.value
                ));
            }
        }
    }

    lines.join("\n")
}

/// Convert a space-separated string of Tailwind classes into atomic equivalents.
///
/// Output JSON: `{ atomicClasses: string, rules: AtomicRule[], unknownClasses: string[] }`
///
/// JS equivalent: `toAtomicClasses(twClasses: string): { atomicClasses, rules, unknownClasses }`
#[napi]
pub fn to_atomic_classes(tw_classes: String) -> String {
    let parts: Vec<&str> = tw_classes.split_whitespace().collect();
    let mut atomic_names: Vec<String> = Vec::with_capacity(parts.len());
    let mut rules: Vec<AtomicRule> = Vec::new();
    let mut unknown_classes: Vec<String> = Vec::new();

    for cls in &parts {
        match parse_atomic_class_inner(cls) {
            Some(rule) => {
                atomic_names.push(rule.atomic_name.clone());
                rules.push(rule);
            }
            None => {
                unknown_classes.push(cls.to_string());
                atomic_names.push(cls.to_string());
            }
        }
    }

    let result = ToAtomicResult {
        atomic_classes: atomic_names.join(" "),
        rules,
        unknown_classes,
    };

    serde_json::to_string(&result)
        .unwrap_or_else(|_| r#"{"atomicClasses":"","rules":[],"unknownClasses":[]}"#.to_string())
}

/// Clear the global atomic registry.
/// JS equivalent: `clearAtomicRegistry()`
#[napi]
pub fn clear_atomic_registry() {
    REGISTRY.clear();
}

/// Get registry size for diagnostics.
#[napi]
pub fn atomic_registry_size() -> u32 {
    REGISTRY.len() as u32
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spacing_transform() {
        assert_eq!(spacing("4"), "1rem");
        assert_eq!(spacing("8"), "2rem");
        assert_eq!(spacing("0"), "0rem");
    }

    #[test]
    fn test_size_value() {
        assert_eq!(size_value("4"), "1rem");
        assert_eq!(size_value("full"), "100%");
        assert_eq!(size_value("screen"), "100vw");
        assert_eq!(size_value("fit"), "fit-content");
    }

    #[test]
    fn test_text_size() {
        assert_eq!(text_size("xs"), "0.75rem");
        assert_eq!(text_size("base"), "1rem");
        assert_eq!(text_size("9xl"), "8rem");
    }

    #[test]
    fn test_font_weight() {
        assert_eq!(font_weight("bold"), "700");
        assert_eq!(font_weight("thin"), "100");
        assert_eq!(font_weight("semibold"), "600");
    }

    #[test]
    fn test_parse_padding() {
        let result = parse_atomic_class_inner("p-4").unwrap();
        assert_eq!(result.property, "padding");
        assert_eq!(result.value, "1rem");
        assert_eq!(result.atomic_name, "_tw_p-4");
        assert!(result.modifier.is_none());
    }

    #[test]
    fn test_parse_with_modifier() {
        let result = parse_atomic_class_inner("md:p-4").unwrap();
        assert_eq!(result.modifier, Some("md".to_string()));
        assert_eq!(result.property, "padding");
        assert_eq!(result.value, "1rem");
    }

    #[test]
    fn test_parse_unknown_prefix() {
        assert!(parse_atomic_class_inner("flex").is_none());
        assert!(parse_atomic_class_inner("bg-red").is_none());
    }

    #[test]
    fn test_sanitize_class_name() {
        assert_eq!(sanitize_class_name("p-[10px]"), "p-_10px_");
        assert_eq!(sanitize_class_name("md:p-4"), "md_p-4");
    }

    #[test]
    fn test_to_atomic_classes() {
        let result = to_atomic_classes("p-4 text-lg unknown-class".to_string());
        let parsed: serde_json::Value = serde_json::from_str(&result).unwrap();
        assert!(parsed["atomicClasses"]
            .as_str()
            .unwrap()
            .contains("_tw_p-4"));
        assert!(parsed["unknownClasses"]
            .as_array()
            .unwrap()
            .contains(&serde_json::json!("unknown-class")));
    }

    #[test]
    fn test_generate_atomic_css_base() {
        let rules =
            r#"[{"twClass":"p-4","atomicName":"_tw_p-4","property":"padding","value":"1rem"}]"#;
        let css = generate_atomic_css(rules.to_string());
        assert_eq!(css, "._tw_p-4 { padding: 1rem; }");
    }

    #[test]
    fn test_generate_atomic_css_breakpoint() {
        let rules = r#"[{"twClass":"md:p-4","atomicName":"_tw_md_p-4","property":"padding","value":"1rem","modifier":"md"}]"#;
        let css = generate_atomic_css(rules.to_string());
        assert!(css.contains("@media (min-width: 768px)"));
        assert!(css.contains("._tw_md_p-4 { padding: 1rem; }"));
    }

    #[test]
    fn test_opacity_value() {
        assert_eq!(opacity_value("50"), "0.5");
        assert_eq!(opacity_value("100"), "1");
    }

    #[test]
    fn test_rounded_no_suffix() {
        // "rounded" → base = "rounded", dash_idx pada "rounded-..." tapi "rounded" sendiri tanpa dash
        // parseAtomicClass("rounded") → akan return None karena tidak ada dash
        // "rounded-lg" → prefix = "rounded", value = "lg"
        let result = parse_atomic_class_inner("rounded-lg").unwrap();
        assert_eq!(result.property, "border-radius");
        assert_eq!(result.value, "0.5rem");
    }
}
