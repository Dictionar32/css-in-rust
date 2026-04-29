use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

pub(crate) static RE_CSS_PROPERTY: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"([a-zA-Z-]+)\s*:\s*([^;!\n]+)(!important)?").unwrap());
static RE_VALID_CLASS: Lazy<Regex> = Lazy::new(|| Regex::new(r"^[-a-z0-9:/\[\]!.()+%]+$").unwrap());

// ─────────────────────────────────────────────────────────────────────────────

/// Parse raw class string — menggantikan parseClasses() di syntax/src/index.ts.
/// Filter token kosong, validasi karakter, deduplicate.
///
/// Lebih cepat dari JS karena regex Rust tidak perlu JIT warmup
/// dan tidak ada prototype chain overhead.
#[napi]
pub fn parse_classes_from_string(raw: String) -> Vec<String> {
    raw.split_whitespace()
        .filter(|t| !t.is_empty() && RE_VALID_CLASS.is_match(t))
        .map(|t| t.to_string())
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ClassConflict {
    pub group: String,
    pub variant_key: String,
    pub classes: Vec<String>,
    pub message: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ConflictDetectionResult {
    pub conflicts: Vec<ClassConflict>,
    pub conflicted_class_names: Vec<String>,
}

/// Split variant prefix dari base class.
/// "dark:hover:bg-blue-500" → { variantKey: "dark:hover", base: "bg-blue-500" }
pub(crate) fn split_variant_and_base(class_name: &str) -> (String, String) {
    let parts: Vec<&str> = class_name.split(':').collect();
    if parts.len() <= 1 {
        return (String::new(), class_name.to_string());
    }
    let base = parts.last().unwrap_or(&class_name).to_string();
    let variant_key = parts[..parts.len() - 1].join(":");
    (variant_key, base)
}

/// Resolve conflict group dari base class.
/// Menggantikan resolveConflictGroup() di semantic.ts.
fn resolve_conflict_group(base: &str) -> Option<&'static str> {
    // Arbitrary values tidak di-track conflict-nya
    if base.contains('[') && base.contains(']') {
        return None;
    }
    // Display utilities
    if [
        "block",
        "inline",
        "inline-block",
        "inline-flex",
        "flex",
        "grid",
        "hidden",
    ]
    .contains(&base)
    {
        return Some("display");
    }
    if base.starts_with("bg-") {
        return Some("bg");
    }
    if base.starts_with("text-") {
        return Some("text");
    }
    if base.starts_with("font-") {
        return Some("font");
    }
    if base.starts_with("rounded") {
        return Some("rounded");
    }
    if base.starts_with("shadow") {
        return Some("shadow");
    }
    if base.starts_with("border-") {
        return Some("border");
    }
    if base.starts_with("opacity-") {
        return Some("opacity");
    }
    if base.starts_with("w-") || base.starts_with("min-w-") || base.starts_with("max-w-") {
        return Some("width");
    }
    if base.starts_with("h-") || base.starts_with("min-h-") || base.starts_with("max-h-") {
        return Some("height");
    }
    if base.starts_with("p-") || base.starts_with("px-") || base.starts_with("py-") {
        return Some("padding");
    }
    if base.starts_with("m-") || base.starts_with("mx-") || base.starts_with("my-") {
        return Some("margin");
    }
    if base.starts_with("z-") {
        return Some("z-index");
    }
    if base.starts_with("gap-") {
        return Some("gap");
    }
    if base.starts_with("col-") {
        return Some("grid-column");
    }
    if base.starts_with("row-") {
        return Some("grid-row");
    }
    if base.starts_with("leading-") {
        return Some("line-height");
    }
    if base.starts_with("tracking-") {
        return Some("letter-spacing");
    }
    if base.starts_with("ring-") {
        return Some("ring");
    }
    if base.starts_with("outline-") {
        return Some("outline");
    }
    if base.starts_with("cursor-") {
        return Some("cursor");
    }
    if base.starts_with("overflow-") {
        return Some("overflow");
    }
    None
}

/// Deteksi konflik antara Tailwind classes yang di-pakai bersamaan.
///
/// Menggantikan `detectConflicts()` di semantic.ts.
/// Contoh: `["bg-red-500", "bg-blue-500"]` → conflict group "bg".
///
/// Input JSON: `[{ "name": "bg-red-500", "count": 3 }, ...]`
#[napi]
pub fn detect_class_conflicts(usages_json: String) -> ConflictDetectionResult {
    #[derive(Deserialize)]
    struct ClassUsage {
        name: String,
    }

    let usages: Vec<ClassUsage> = match serde_json::from_str(&usages_json) {
        Ok(u) => u,
        Err(_) => {
            return ConflictDetectionResult {
                conflicts: vec![],
                conflicted_class_names: vec![],
            }
        }
    };

    // bucket key → { variantKey, group, classes }
    let mut buckets: HashMap<String, (String, &'static str, HashSet<String>)> = HashMap::new();

    for usage in &usages {
        let (variant_key, base) = split_variant_and_base(&usage.name);
        let group = match resolve_conflict_group(&base) {
            Some(g) => g,
            None => continue,
        };

        let key = format!("{}::{}", variant_key, group);
        let entry = buckets
            .entry(key)
            .or_insert_with(|| (variant_key.clone(), group, HashSet::new()));
        entry.2.insert(usage.name.clone());
    }

    let mut conflicts: Vec<ClassConflict> = Vec::new();
    let mut conflicted: HashSet<String> = HashSet::new();

    for (variant_key, group, classes) in buckets.values() {
        if classes.len() <= 1 {
            continue;
        }
        let mut sorted_classes: Vec<String> = classes.iter().cloned().collect();
        sorted_classes.sort();

        for cls in &sorted_classes {
            conflicted.insert(cls.clone());
        }

        let variant_label = if variant_key.is_empty() {
            "base"
        } else {
            variant_key.as_str()
        };
        conflicts.push(ClassConflict {
            group: group.to_string(),
            variant_key: variant_key.clone(),
            classes: sorted_classes,
            message: format!(
                "Multiple {} utilities detected for \"{}\".",
                group, variant_label
            ),
        });
    }

    // Sort by conflict count desc, then group name asc
    conflicts.sort_by(|a, b| {
        b.classes
            .len()
            .cmp(&a.classes.len())
            .then(a.group.cmp(&b.group))
    });

    let mut conflicted_names: Vec<String> = conflicted.into_iter().collect();
    conflicted_names.sort();

    ConflictDetectionResult {
        conflicts,
        conflicted_class_names: conflicted_names,
    }
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct KnownClassResult {
    pub class_name: String,
    pub is_known: bool,
    pub variant_key: String,
    pub base_class: String,
    pub utility_prefix: String,
    pub is_arbitrary: bool,
}

/// Classify classes sebagai known/unknown Tailwind utilities.
///
/// Menggantikan `isKnownTailwindClass()` + `utilityPrefix()` di semantic.ts.
/// Batch mode: process banyak classes sekaligus via HashSet lookups.
#[napi]
pub fn classify_known_classes(
    classes: Vec<String>,
    safelist: Vec<String>,
    custom_utilities: Vec<String>,
) -> Vec<KnownClassResult> {
    let safelist_set: HashSet<&str> = safelist.iter().map(|s| s.as_str()).collect();
    let custom_set: HashSet<&str> = custom_utilities.iter().map(|s| s.as_str()).collect();

    let known_prefixes: HashSet<&str> = [
        "absolute",
        "align",
        "animate",
        "arbitrary",
        "aspect",
        "backdrop",
        "basis",
        "bg",
        "block",
        "border",
        "bottom",
        "col",
        "container",
        "contents",
        "cursor",
        "dark",
        "display",
        "divide",
        "fill",
        "fixed",
        "flex",
        "float",
        "font",
        "from",
        "gap",
        "grid",
        "grow",
        "h",
        "hidden",
        "inset",
        "inline",
        "isolate",
        "items",
        "justify",
        "left",
        "leading",
        "line",
        "list",
        "m",
        "max-h",
        "max-w",
        "mb",
        "min-h",
        "min-w",
        "ml",
        "mr",
        "mt",
        "mx",
        "my",
        "object",
        "opacity",
        "order",
        "origin",
        "outline",
        "overflow",
        "overscroll",
        "p",
        "pb",
        "pe",
        "perspective",
        "place",
        "pl",
        "pointer",
        "position",
        "pr",
        "ps",
        "pt",
        "px",
        "py",
        "relative",
        "right",
        "ring",
        "rotate",
        "rounded",
        "row",
        "scale",
        "self",
        "shadow",
        "shrink",
        "size",
        "skew",
        "space",
        "sr",
        "start",
        "static",
        "sticky",
        "stroke",
        "table",
        "text",
        "to",
        "top",
        "tracking",
        "transform",
        "transition",
        "translate",
        "truncate",
        "underline",
        "uppercase",
        "via",
        "visible",
        "w",
        "whitespace",
        "z",
    ]
    .iter()
    .cloned()
    .collect();

    classes
        .into_iter()
        .map(|cls| {
            let (variant_key, base) = split_variant_and_base(&cls);
            let is_arbitrary = base.contains('[') && base.contains(']');

            let utility_prefix = if is_arbitrary {
                "arbitrary".to_string()
            } else {
                let normalized = base.strip_prefix('-').unwrap_or(&base);
                // Find prefix: everything before first '-' that has value after it
                let prefix_end = normalized.find('-').map_or(normalized.len(), |i| i);
                normalized[..prefix_end].to_string()
            };

            let is_known = safelist_set.contains(cls.as_str())
                || custom_set.contains(cls.as_str())
                || custom_set.contains(base.as_str())
                || (is_arbitrary)
                || known_prefixes.contains(utility_prefix.as_str());

            KnownClassResult {
                class_name: cls,
                is_known,
                variant_key,
                base_class: base,
                utility_prefix,
                is_arbitrary,
            }
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CssRuleLookup {
    pub class_name: String,
    pub property: String,
    pub value: String,
    pub is_important: bool,
    pub variants: Vec<String>,
    pub specificity: u32,
}

/// Parse CSS string dan buat reverse lookup index.
///
/// Menggantikan `parseCSS()` + `findByProperty()` di reverseLookup.ts.
/// Dipakai oleh `tw trace` CLI dan devtools untuk debug class → property mapping.
///
/// Input: raw CSS string dari Tailwind output.
/// Output: list of { className, property, value, ... } yang bisa difilter.
#[napi]
pub fn parse_css_rules(css: String) -> Vec<CssRuleLookup> {
    let mut rules: Vec<CssRuleLookup> = Vec::new();

    // Match: .class-name { property: value; ... }
    // Handle escaped characters in class names (e.g., .hover\:bg-blue)
    let selector_block_re =
        Regex::new(r"\.([a-zA-Z_][-a-zA-Z0-9_:\\./\[\]]+)\s*\{([^}]*)\}").unwrap();

    for cap in selector_block_re.captures_iter(&css) {
        let raw_class = match cap.get(1) {
            Some(m) => m.as_str(),
            None => continue,
        };
        let block_body = match cap.get(2) {
            Some(m) => m.as_str(),
            None => continue,
        };

        // Unescape CSS class name (e.g., "hover\:bg-blue" → "hover:bg-blue")
        let class_name = raw_class
            .replace("\\:", ":")
            .replace("\\.", ".")
            .replace("\\/", "/");

        // Extract variants from class name
        let (variant_key, _base) = split_variant_and_base(&class_name);
        let variants: Vec<String> = if variant_key.is_empty() {
            vec![]
        } else {
            variant_key.split(':').map(|s| s.to_string()).collect()
        };

        // Calculate specificity: 1 class = 10, each pseudo/variant adds
        let specificity = 10 + (variants.len() as u32 * 10);

        // Parse declarations
        for dec_match in RE_CSS_PROPERTY.captures_iter(block_body) {
            let property = match dec_match.get(1) {
                Some(m) => m.as_str().trim().to_string(),
                None => continue,
            };
            let value = match dec_match.get(2) {
                Some(m) => m.as_str().trim().to_string(),
                None => continue,
            };
            let is_important = dec_match.get(3).is_some();

            if property.is_empty() || value.is_empty() {
                continue;
            }

            rules.push(CssRuleLookup {
                class_name: class_name.clone(),
                property,
                value,
                is_important,
                variants: variants.clone(),
                specificity,
            });
        }
    }

    rules
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct VariantSplitResult {
    pub variant_key: String,
    pub base: String,
    pub variants: Vec<String>,
    pub is_arbitrary: bool,
    pub has_modifier: bool,
    pub modifier: Option<String>,
}

/// Split class menjadi komponen-komponen: variant, base, modifier.
///
/// Menggantikan splitVariantAndBase() di semantic.ts dan utilityPrefix() logic.
/// Batch mode untuk dipakai oleh CLI dan analyzer.
///
/// Contoh: "dark:hover:bg-blue-500/50"
///   → { variantKey: "dark:hover", base: "bg-blue-500", modifier: "50", ... }
#[napi]
pub fn batch_split_classes(classes: Vec<String>) -> Vec<VariantSplitResult> {
    classes
        .into_iter()
        .map(|cls| {
            let (variant_key, base_with_modifier) = split_variant_and_base(&cls);
            let variants: Vec<String> = if variant_key.is_empty() {
                vec![]
            } else {
                variant_key.split(':').map(|s| s.to_string()).collect()
            };

            // Extract opacity modifier: "bg-blue-500/50" → base="bg-blue-500", mod="50"
            let (base, modifier) = if let Some(slash_idx) = base_with_modifier.rfind('/') {
                let b = base_with_modifier[..slash_idx].to_string();
                let m = base_with_modifier[slash_idx + 1..].to_string();
                (b, Some(m))
            } else {
                (base_with_modifier, None)
            };

            let is_arbitrary = base.contains('[') && base.contains(']');
            let has_modifier = modifier.is_some();

            VariantSplitResult {
                variant_key,
                base,
                variants,
                is_arbitrary,
                has_modifier,
                modifier,
            }
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::application::tw_merge::split_variants;

    #[test]
    fn test_parse_classes_from_string_basic() {
        let result = parse_classes_from_string("p-4 m-2".to_string());
        assert_eq!(result, vec!["p-4", "m-2"]);
    }

    #[test]
    fn test_parse_classes_from_empty() {
        let result = parse_classes_from_string("".to_string());
        assert!(result.is_empty());
    }

    #[test]
    fn test_parse_classes_filters_invalid() {
        let result = parse_classes_from_string("p-4 @invalid".to_string());
        assert_eq!(result, vec!["p-4"]);
    }

    #[test]
    fn test_split_variant_and_base() {
        assert_eq!(split_variants("bg-red-500"), ("", "bg-red-500"));
        assert_eq!(split_variants("md:hover:bg-red"), ("md:hover:", "bg-red"));
        assert_eq!(split_variants("hover:focus:"), ("hover:focus:", ""));
    }

    #[test]
    fn test_classify_known_classes_safelist() {
        let classes = vec!["custom-tailwind".to_string()];
        let safelist = vec!["custom-tailwind".to_string()];
        let custom = vec![];
        let result = classify_known_classes(classes, safelist, custom);
        assert_eq!(result.len(), 1);
        assert!(result[0].is_known);
    }

    #[test]
    fn test_classify_known_classes_custom_utility() {
        let classes = vec!["my-custom-utility".to_string()];
        let safelist = vec![];
        let custom = vec!["my-custom-utility".to_string()];
        let result = classify_known_classes(classes, safelist, custom);
        assert_eq!(result.len(), 1);
        assert!(result[0].is_known);
    }

    #[test]
    fn test_classify_known_classes_unknown() {
        let classes = vec!["non-existing-utility-xyz".to_string()];
        let safelist = vec![];
        let custom = vec![];
        let result = classify_known_classes(classes, safelist, custom);
        assert_eq!(result.len(), 1);
        assert!(!result[0].is_known);
    }

    #[test]
    fn test_classify_known_classes_variant_aware() {
        let classes = vec!["hover:bg-red-500".to_string()];
        let safelist = vec![];
        let custom = vec![];
        let result = classify_known_classes(classes, safelist, custom);
        assert_eq!(result.len(), 1);
        assert!(result[0].is_known);
        assert_eq!(result[0].variant_key, "hover:");
        assert_eq!(result[0].base_class, "bg-red-500");
    }
}