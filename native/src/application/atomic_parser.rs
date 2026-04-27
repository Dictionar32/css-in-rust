//! Atomic CSS Parser — migrated from `atomic/src/index.ts`
//!
//! Fungsi yang dimigrate:
//!   - `parseAtomicClass(twClass)`  → `parse_atomic_class(tw_class)`
//!   - `generateAtomicCss(rules)`   → `generate_atomic_css(rules_json)`
//!   - `toAtomicClasses(twClasses)` → `to_atomic_classes(tw_classes)`
//!   - `clearAtomicRegistry()`      → `clear_atomic_registry()`
//!
//! Registry: DashMap global (same LRU semantics as JS Map, no size cap needed
//! because Tailwind class space is finite ~10k variants).

use dashmap::DashMap;
use napi_derive::napi;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

// ─────────────────────────────────────────────────────────────────────────────
// Static property map — mirrors TW_PROPERTY_MAP in index.ts
// ─────────────────────────────────────────────────────────────────────────────

struct PropMapping {
    prop: &'static str,
    transform: fn(&str) -> String,
}

fn identity(v: &str) -> String { v.to_string() }
fn spacing(v: &str) -> String {
    match v.parse::<f64>() {
        Ok(n) => format!("{}rem", n * 0.25),
        Err(_) => v.to_string(),
    }
}
fn size_value(v: &str) -> String {
    if let Ok(n) = v.parse::<f64>() { return format!("{}rem", n * 0.25); }
    match v {
        "full"   => "100%".into(),
        "screen" => "100vw".into(),
        "auto"   => "auto".into(),
        "min"    => "min-content".into(),
        "max"    => "max-content".into(),
        "fit"    => "fit-content".into(),
        "svw"    => "100svw".into(),
        "svh"    => "100svh".into(),
        _        => v.to_string(),
    }
}
fn text_size(v: &str) -> String {
    match v {
        "xs"  => "0.75rem",  "sm"  => "0.875rem", "base" => "1rem",
        "lg"  => "1.125rem", "xl"  => "1.25rem",  "2xl"  => "1.5rem",
        "3xl" => "1.875rem", "4xl" => "2.25rem",  "5xl"  => "3rem",
        "6xl" => "3.75rem",  "7xl" => "4.5rem",   "8xl"  => "6rem",
        "9xl" => "8rem",     _ => return v.to_string(),
    }.to_string()
}
fn font_weight(v: &str) -> String {
    match v {
        "thin" => "100", "extralight" => "200", "light"    => "300",
        "normal" => "400", "medium"  => "500", "semibold"  => "600",
        "bold" => "700",  "extrabold" => "800", "black"    => "900",
        _ => return v.to_string(),
    }.to_string()
}
fn leading_value(v: &str) -> String {
    match v {
        "none" => "1", "tight" => "1.25", "snug"    => "1.375",
        "normal" => "1.5", "relaxed" => "1.625", "loose" => "2",
        _ => return v.to_string(),
    }.to_string()
}
fn rounded_value(v: &str) -> String {
    match v {
        ""     => "0.25rem", "sm" => "0.125rem", "md"   => "0.375rem",
        "lg"   => "0.5rem",  "xl" => "0.75rem",  "2xl"  => "1rem",
        "3xl"  => "1.5rem",  "full" => "9999px", "none" => "0",
        _      => return format!("{}rem", v),
    }.to_string()
}
fn opacity_value(v: &str) -> String {
    match v.parse::<f64>() {
        Ok(n) => format!("{}", n / 100.0),
        Err(_) => v.to_string(),
    }
}

static PROP_MAP: Lazy<Vec<(&'static str, PropMapping)>> = Lazy::new(|| {
    vec![
        ("p",       PropMapping { prop: "padding",         transform: spacing }),
        ("px",      PropMapping { prop: "padding-inline",  transform: spacing }),
        ("py",      PropMapping { prop: "padding-block",   transform: spacing }),
        ("pt",      PropMapping { prop: "padding-top",     transform: spacing }),
        ("pb",      PropMapping { prop: "padding-bottom",  transform: spacing }),
        ("pl",      PropMapping { prop: "padding-left",    transform: spacing }),
        ("pr",      PropMapping { prop: "padding-right",   transform: spacing }),
        ("m",       PropMapping { prop: "margin",          transform: spacing }),
        ("mx",      PropMapping { prop: "margin-inline",   transform: spacing }),
        ("my",      PropMapping { prop: "margin-block",    transform: spacing }),
        ("mt",      PropMapping { prop: "margin-top",      transform: spacing }),
        ("mb",      PropMapping { prop: "margin-bottom",   transform: spacing }),
        ("ml",      PropMapping { prop: "margin-left",     transform: spacing }),
        ("mr",      PropMapping { prop: "margin-right",    transform: spacing }),
        ("gap",     PropMapping { prop: "gap",             transform: spacing }),
        ("w",       PropMapping { prop: "width",           transform: size_value }),
        ("h",       PropMapping { prop: "height",          transform: size_value }),
        ("text",    PropMapping { prop: "font-size",       transform: text_size }),
        ("font",    PropMapping { prop: "font-weight",     transform: font_weight }),
        ("leading", PropMapping { prop: "line-height",     transform: leading_value }),
        ("opacity", PropMapping { prop: "opacity",         transform: opacity_value }),
        ("z",       PropMapping { prop: "z-index",         transform: identity }),
        ("rounded", PropMapping { prop: "border-radius",   transform: rounded_value }),
    ]
});

/// Lookup prefix in static prop map — O(n) over ~23 entries, faster than HashMap
/// for this size due to cache locality.
fn lookup_prop(prefix: &str) -> Option<&'static PropMapping> {
    PROP_MAP.iter().find(|(k, _)| *k == prefix).map(|(_, v)| v)
}

// ─────────────────────────────────────────────────────────────────────────────
// Global DashMap registry — mirrors JS `const REGISTRY = new Map()`
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Clone)]
struct CachedAtomicRule {
    tw_class: String,
    atomic_name: String,
    property: String,
    value: String,
    modifier: Option<String>,
}

static ATOMIC_REGISTRY: Lazy<DashMap<String, CachedAtomicRule>> = Lazy::new(DashMap::new);

// ─────────────────────────────────────────────────────────────────────────────
// Output types
// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, Clone)]
pub struct AtomicRule {
    pub tw_class: String,
    pub atomic_name: String,
    pub property: String,
    pub value: String,
    pub modifier: Option<String>,
}

#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct ToAtomicClassesResult {
    pub atomic_classes: String,
    pub rules: Vec<AtomicRule>,
    pub unknown_classes: Vec<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

fn sanitize_class_name(cls: &str) -> String {
    cls.chars()
        .map(|c| if matches!(c, '/' | ':' | '[' | ']' | '.' | '!' | '%') { '_' } else { c })
        .collect()
}

fn parse_atomic_class_inner(tw_class: &str) -> Option<CachedAtomicRule> {
    // Check registry first
    if let Some(cached) = ATOMIC_REGISTRY.get(tw_class) {
        return Some(cached.clone());
    }

    // Split modifier (e.g. "hover:p-4" → modifier="hover", base="p-4")
    let (modifier, base) = if let Some(idx) = tw_class.rfind(':') {
        (Some(tw_class[..idx].to_string()), &tw_class[idx + 1..])
    } else {
        (None, tw_class)
    };

    // Split prefix and value (e.g. "p-4" → prefix="p", value="4")
    let dash_idx = base.find('-')?;
    let prefix = &base[..dash_idx];
    let value = &base[dash_idx + 1..];

    let mapping = lookup_prop(prefix)?;
    let css_value = (mapping.transform)(value);
    let atomic_name = format!("_tw_{}", sanitize_class_name(tw_class));

    let rule = CachedAtomicRule {
        tw_class: tw_class.to_string(),
        atomic_name,
        property: mapping.prop.to_string(),
        value: css_value,
        modifier,
    };

    ATOMIC_REGISTRY.insert(tw_class.to_string(), rule.clone());
    Some(rule)
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI exports
// ─────────────────────────────────────────────────────────────────────────────

/// Parse a single Tailwind class into an AtomicRule.
///
/// Replaces `parseAtomicClass(twClass)` in `atomic/src/index.ts`.
/// Uses DashMap global registry — subsequent calls for same class are O(1).
/// Returns `null` when the class prefix is not in the property map.
#[napi]
pub fn parse_atomic_class(tw_class: String) -> Option<AtomicRule> {
    parse_atomic_class_inner(&tw_class).map(|r| AtomicRule {
        tw_class: r.tw_class,
        atomic_name: r.atomic_name,
        property: r.property,
        value: r.value,
        modifier: r.modifier,
    })
}

/// Generate CSS string from a list of AtomicRules.
///
/// Replaces `generateAtomicCss(rules)` in `atomic/src/index.ts`.
/// Input JSON: `[{ twClass, atomicName, property, value, modifier? }, ...]`
#[napi]
pub fn generate_atomic_css(rules_json: String) -> String {
    let rules: Vec<AtomicRule> = match serde_json::from_str(&rules_json) {
        Ok(r) => r,
        Err(_) => return String::new(),
    };

    let breakpoints: &[(&str, &str)] = &[
        ("sm", "640px"), ("md", "768px"), ("lg", "1024px"),
        ("xl", "1280px"), ("2xl", "1536px"),
    ];

    let mut lines: Vec<String> = Vec::with_capacity(rules.len() * 2);

    for rule in &rules {
        let selector = format!(".{}", rule.atomic_name);

        if let Some(ref modifier) = rule.modifier {
            if let Some((_, bp)) = breakpoints.iter().find(|(k, _)| *k == modifier.as_str()) {
                lines.push(format!(
                    "@media (min-width: {bp}) {{\n  {selector} {{ {prop}: {value}; }}\n}}",
                    bp = bp, selector = selector,
                    prop = rule.property, value = rule.value
                ));
            } else {
                lines.push(format!(
                    "{selector}:{modifier} {{ {prop}: {value}; }}",
                    selector = selector, modifier = modifier,
                    prop = rule.property, value = rule.value
                ));
            }
        } else {
            lines.push(format!(
                "{selector} {{ {prop}: {value}; }}",
                selector = selector, prop = rule.property, value = rule.value
            ));
        }
    }

    lines.join("\n")
}

/// Parse a whitespace-separated class string into AtomicRules + unknown classes.
///
/// Replaces `toAtomicClasses(twClasses)` in `atomic/src/index.ts`.
/// Hot path — called per-component render.
#[napi]
pub fn to_atomic_classes(tw_classes: String) -> ToAtomicClassesResult {
    let parts: Vec<&str> = tw_classes.split_whitespace().collect();

    let mut atomic_names: Vec<String> = Vec::with_capacity(parts.len());
    let mut rules: Vec<AtomicRule> = Vec::new();
    let mut unknown_classes: Vec<String> = Vec::new();

    for cls in &parts {
        if let Some(rule) = parse_atomic_class_inner(cls) {
            atomic_names.push(rule.atomic_name.clone());
            rules.push(AtomicRule {
                tw_class: rule.tw_class,
                atomic_name: rule.atomic_name,
                property: rule.property,
                value: rule.value,
                modifier: rule.modifier,
            });
        } else {
            unknown_classes.push(cls.to_string());
            atomic_names.push(cls.to_string());
        }
    }

    ToAtomicClassesResult {
        atomic_classes: atomic_names.join(" "),
        rules,
        unknown_classes,
    }
}

/// Evict all entries from the atomic rule registry.
///
/// Replaces `clearAtomicRegistry()` in `atomic/src/index.ts`.
#[napi]
pub fn clear_atomic_registry() {
    ATOMIC_REGISTRY.clear();
}

/// Current registry size — for observability.
#[napi]
pub fn atomic_registry_size() -> u32 {
    ATOMIC_REGISTRY.len() as u32
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_padding() {
        let r = parse_atomic_class("p-4".to_string()).unwrap();
        assert_eq!(r.property, "padding");
        assert_eq!(r.value, "1rem"); // 4 * 0.25
        assert_eq!(r.atomic_name, "_tw_p-4");
        assert!(r.modifier.is_none());
    }

    #[test]
    fn test_parse_with_modifier() {
        let r = parse_atomic_class("hover:bg-".to_string());
        assert!(r.is_none(), "unknown prefix should return None");

        let r = parse_atomic_class("md:p-8".to_string()).unwrap();
        assert_eq!(r.modifier.as_deref(), Some("md"));
        assert_eq!(r.value, "2rem"); // 8 * 0.25
    }

    #[test]
    fn test_size_value_special() {
        let r = parse_atomic_class("w-full".to_string()).unwrap();
        assert_eq!(r.value, "100%");
    }

    #[test]
    fn test_text_size() {
        let r = parse_atomic_class("text-xl".to_string()).unwrap();
        assert_eq!(r.value, "1.25rem");
    }

    #[test]
    fn test_font_weight() {
        let r = parse_atomic_class("font-bold".to_string()).unwrap();
        assert_eq!(r.value, "700");
    }

    #[test]
    fn test_rounded() {
        let r = parse_atomic_class("rounded-full".to_string()).unwrap();
        assert_eq!(r.value, "9999px");
    }

    #[test]
    fn test_opacity() {
        let r = parse_atomic_class("opacity-50".to_string()).unwrap();
        assert_eq!(r.value, "0.5");
    }

    #[test]
    fn test_unknown_class_returns_none() {
        let r = parse_atomic_class("unknown-class".to_string());
        assert!(r.is_none());
    }

    #[test]
    fn test_to_atomic_classes() {
        clear_atomic_registry();
        let result = to_atomic_classes("p-4 text-xl unknown-class".to_string());
        assert_eq!(result.rules.len(), 2);
        assert_eq!(result.unknown_classes, vec!["unknown-class"]);
        assert!(result.atomic_classes.contains("_tw_p-4"));
        assert!(result.atomic_classes.contains("_tw_text-xl"));
        assert!(result.atomic_classes.contains("unknown-class"));
    }

    #[test]
    fn test_generate_atomic_css_basic() {
        let rules = r#"[{"twClass":"p-4","atomicName":"_tw_p-4","property":"padding","value":"1rem","modifier":null}]"#;
        let css = generate_atomic_css(rules.to_string());
        assert!(css.contains("._tw_p-4"));
        assert!(css.contains("padding: 1rem"));
    }

    #[test]
    fn test_generate_atomic_css_breakpoint() {
        let rules = r#"[{"twClass":"md:p-4","atomicName":"_tw_md_p-4","property":"padding","value":"1rem","modifier":"md"}]"#;
        let css = generate_atomic_css(rules.to_string());
        assert!(css.contains("@media (min-width: 768px)"));
    }

    #[test]
    fn test_registry_caches() {
        clear_atomic_registry();
        assert_eq!(atomic_registry_size(), 0);
        parse_atomic_class("p-4".to_string());
        assert_eq!(atomic_registry_size(), 1);
        // Second call hits cache
        parse_atomic_class("p-4".to_string());
        assert_eq!(atomic_registry_size(), 1);
        clear_atomic_registry();
        assert_eq!(atomic_registry_size(), 0);
    }
}