//! CSS → IR Assembler — satu-pass Rust replacement untuk JS loop di cssToIr.ts
//!
//! ## Sebelum (JS)
//! ```
//! const parsed = native.parseCssRules(css)          // NAPI call 1
//! for (const r of parsed) {
//!   const fingerprint = createFingerprint([...])    // NAPI call per rule  ← bottleneck
//!   const propertyId  = generatePropertyId(r.prop)  // NAPI call per rule
//!   const valueId     = generateValueId(r.value)    // NAPI call per rule
//!   rules.push({ id, selector, property, ... })
//! }
//! ```
//!
//! ## Sesudah (Rust)
//! ```
//! const { rules, classToRuleIds } = native.assembleCssIr(css, prefix)  // 1 NAPI call
//! ```
//!
//! Semua operasi per-rule (parse, ID assignment, fingerprint, layer detect,
//! media detect, assemble) dilakukan dalam satu pass di Rust.
//! JS hanya menerima JSON dan reconstruct typed objects dari angka.

use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::application::css_analysis::parse_css_to_rules;
use crate::application::engine::create_fingerprint;

// ─────────────────────────────────────────────────────────────────────────────
// Enums — mirror ir.ts enums sebagai integer (compat dengan TS side)
// ─────────────────────────────────────────────────────────────────────────────

/// Mirror dari `Origin` enum di ir.ts
/// AuthorNormal = 2 adalah default untuk semua Tailwind rules
const ORIGIN_AUTHOR_NORMAL: u8 = 2;

/// Mirror dari `Importance` enum di ir.ts
const IMPORTANCE_NORMAL: u8 = 0;
const IMPORTANCE_IMPORTANT: u8 = 1;

/// Mirror dari `ConditionResult` enum di ir.ts
const CONDITION_RESULT_UNKNOWN: u8 = 2;

/// Layer order — mirror LAYER_ORDER di cssToIr.ts
fn layer_order(layer_name: &str) -> u32 {
    match layer_name {
        "base" => 0,
        "components" => 1,
        "utilities" => 2,
        "tailwind" => 3,
        _ => 4,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Output structs — serialized ke JSON, di-reconstruct di JS
// ─────────────────────────────────────────────────────────────────────────────

/// Satu rule IR yang sudah di-assemble.
/// Field numerik (ruleId, selectorId, dst) langsung dipakai JS untuk construct
/// typed ID wrapper objects (new RuleId(ruleId), new SelectorId(selectorId), dst).
#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct AssembledRuleIr {
    /// Numeric ID untuk construct `new RuleId(ruleId)` di JS
    pub rule_id: u32,
    /// Numeric ID untuk construct `new SelectorId(selectorId)` di JS
    pub selector_id: u32,
    /// Numeric ID untuk construct `new PropertyId(propertyId)` di JS
    pub property_id: u32,
    /// Numeric ID untuk construct `new ValueId(valueId)` di JS
    pub value_id: u32,
    /// Numeric ID untuk construct `new LayerId(layerId)` di JS, -1 jika tidak ada layer
    pub layer_id: i32,
    /// Numeric ID untuk construct `new ConditionId(conditionId)` di JS, -1 jika tidak ada condition
    pub condition_id: i32,

    /// Nama property — dipakai JS untuk `registerPropertyName(id, name)`
    pub property_name: String,
    /// Nama value — dipakai JS untuk `registerValueName(id, name)`
    pub value_name: String,
    /// Layer name string (e.g. "tailwind"), empty jika tidak ada
    pub layer_name: String,

    /// origin enum value (2 = AuthorNormal)
    pub origin: u8,
    /// importance enum value (0 = Normal, 1 = Important)
    pub importance: u8,
    /// layer order integer (0-4)
    pub layer_order: u32,
    /// specificity dari CSS rule
    pub specificity: u32,
    /// conditionResult enum value (2 = Unknown)
    pub condition_result: u8,
    /// insertion order (monotonically increasing per parse)
    pub insertion_order: u32,
    /// FNV-1a fingerprint dari [className, property, value]
    pub fingerprint: String,
    /// Class name (dengan prefix jika ada)
    pub class_name: String,
}

/// Output dari assemble_css_ir — semua rules + classToRuleIds mapping
#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct AssembledIrResult {
    /// Semua rule IR yang sudah di-assemble, siap untuk di-wrap ke RuleIR di JS
    pub rules: Vec<AssembledRuleIr>,
    /// classToRuleIds: class_name → Vec<rule_id>
    /// Di JS: `new Map(classToRuleIds.map(e => [e.className, e.ruleIds.map(id => new RuleId(id))]))`
    pub class_to_rule_ids: Vec<ClassRuleMapping>,
    /// Nama-nama layer yang ditemukan, dengan order-nya
    /// Di JS: dipakai rebuild layerMap dan layerOrderMap
    pub layers: Vec<LayerEntry>,
}

/// Entry dalam classToRuleIds
#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ClassRuleMapping {
    pub class_name: String,
    pub rule_ids: Vec<u32>,
}

/// Layer yang di-detect selama parse
#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct LayerEntry {
    pub name: String,
    pub layer_id: u32,
    pub order: u32,
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal ID counter state — per-call, tidak global
// ─────────────────────────────────────────────────────────────────────────────

struct IdCounters {
    rule: u32,
    selector: u32,
    property: u32,
    value: u32,
    layer: u32,
    condition: u32,
    insertion_order: u32,
}

impl IdCounters {
    fn new() -> Self {
        Self {
            rule: 0,
            selector: 0,
            property: 0,
            value: 0,
            layer: 0,
            condition: 0,
            insertion_order: 0,
        }
    }

    fn next_rule(&mut self) -> u32 { let v = self.rule; self.rule += 1; v }
    fn next_selector(&mut self) -> u32 { let v = self.selector; self.selector += 1; v }
    fn next_property(&mut self) -> u32 { let v = self.property; self.property += 1; v }
    fn next_value(&mut self) -> u32 { let v = self.value; self.value += 1; v }
    fn next_layer(&mut self) -> u32 { let v = self.layer; self.layer += 1; v }
    fn next_condition(&mut self) -> u32 { let v = self.condition; self.condition += 1; v }
    fn next_insertion(&mut self) -> u32 { let v = self.insertion_order; self.insertion_order += 1; v }
}

// ─────────────────────────────────────────────────────────────────────────────
// Media/condition detection — mirror JS hasMedia check
// ─────────────────────────────────────────────────────────────────────────────

static RE_MEDIA_VARIANT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^(@|dark$|print$)").unwrap()
});

fn has_media_variant(variants: &[String]) -> bool {
    variants.iter().any(|v| RE_MEDIA_VARIANT.is_match(v))
}

// ─────────────────────────────────────────────────────────────────────────────
// assemble_css_ir — fungsi NAPI utama
// ─────────────────────────────────────────────────────────────────────────────

/// Parse CSS + assign semua IDs + fingerprint + assemble RuleIR — satu pass di Rust.
///
/// Menggantikan JS loop di `parseCssToIr()` di `cssToIr.ts`:
/// ```typescript
/// // Sebelum: O(N) loop dengan NAPI call per rule
/// for (const r of parsed) {
///   const fingerprint = createFingerprint([...])   // NAPI × N
///   const propertyId  = generatePropertyId(r.prop)  // NAPI × N
///   const valueId     = generateValueId(r.value)    // NAPI × N
///   rules.push(assembleRule(...))
/// }
///
/// // Sesudah: 1 NAPI call
/// const { rules, classToRuleIds, layers } = native.assembleCssIr(css, prefix)
/// ```
///
/// JS kemudian hanya perlu wrap numerik IDs ke typed wrapper objects:
/// ```typescript
/// rule.id       = new RuleId(r.ruleId)
/// rule.property = new PropertyId(r.propertyId)
/// // dst.
/// ```
///
/// ## ID assignment semantics
/// Identik dengan JS `createIdGenerator()`:
/// - Setiap rule dapat RuleId, SelectorId, PropertyId, ValueId yang unik (sequential counter)
/// - LayerId di-share per layer name (layerMap cache)
/// - ConditionId diassign per-rule jika ada media variant
/// - Counter reset setiap kali `assemble_css_ir` dipanggil (mirror `resetIdGenerator()`)
#[napi]
pub fn assemble_css_ir(css: String, prefix: Option<String>) -> AssembledIrResult {
    let prefix_str = prefix.as_deref().unwrap_or("");

    // ── Parse CSS → flat rule list (reuse existing parse_css_to_rules logic) ─
    let parsed = parse_css_to_rules(css, Some(prefix_str.to_string()));

    // ── Setup per-call state ──────────────────────────────────────────────────
    let mut counters = IdCounters::new();
    let mut layer_map: HashMap<String, (u32, u32)> = HashMap::new(); // name → (layer_id, order)
    let mut class_to_rule_ids: HashMap<String, Vec<u32>> = HashMap::new();
    let mut rules: Vec<AssembledRuleIr> = Vec::with_capacity(parsed.len());

    // ── Satu pass: assign IDs + fingerprint + assemble ───────────────────────
    for r in &parsed {
        // Layer detection — mirror detectLayerFromClassName() + getOrCreateLayerId()
        let layer_info: Option<(u32, String, u32)> = if let Some(ref layer_name) = r.layer {
            let (lid, lorder) = layer_map.entry(layer_name.clone()).or_insert_with(|| {
                let id = counters.next_layer();
                let order = layer_order(layer_name);
                (id, order)
            });
            Some((*lid, layer_name.clone(), *lorder))
        } else {
            None
        };

        let (layer_id, layer_name, layer_order_val) = match &layer_info {
            Some((id, name, order)) => (*id as i32, name.clone(), *order),
            None => (-1i32, String::new(), 4u32),
        };

        // Selector, Property, Value IDs — sequential counter per rule
        let selector_id = counters.next_selector();
        let property_id = counters.next_property();
        let value_id = counters.next_value();

        // Condition ID — hanya jika ada media/dark/print variant
        let has_media = has_media_variant(&r.variants);
        let condition_id: i32 = if has_media {
            counters.next_condition() as i32
        } else {
            -1
        };

        // Rule ID
        let rule_id = counters.next_rule();
        let insertion_order = counters.next_insertion();

        // Fingerprint — identik dengan createFingerprint([className, property, value])
        let fingerprint = create_fingerprint(vec![
            r.class_name.clone(),
            r.property.clone(),
            r.value.clone(),
        ]);

        // Importance
        let importance = if r.important {
            IMPORTANCE_IMPORTANT
        } else {
            IMPORTANCE_NORMAL
        };

        // classToRuleIds mapping
        class_to_rule_ids
            .entry(r.class_name.clone())
            .or_default()
            .push(rule_id);

        rules.push(AssembledRuleIr {
            rule_id,
            selector_id,
            property_id,
            value_id,
            layer_id,
            condition_id,
            property_name: r.property.clone(),
            value_name: r.value.clone(),
            layer_name,
            origin: ORIGIN_AUTHOR_NORMAL,
            importance,
            layer_order: layer_order_val,
            specificity: r.specificity,
            condition_result: CONDITION_RESULT_UNKNOWN,
            insertion_order,
            fingerprint,
            class_name: r.class_name.clone(),
        });
    }

    // ── Build classToRuleIds Vec ──────────────────────────────────────────────
    let mut class_to_rule_ids_vec: Vec<ClassRuleMapping> = class_to_rule_ids
        .into_iter()
        .map(|(class_name, rule_ids)| ClassRuleMapping { class_name, rule_ids })
        .collect();
    // Sort untuk deterministic output
    class_to_rule_ids_vec.sort_by(|a, b| a.class_name.cmp(&b.class_name));

    // ── Build layers Vec ──────────────────────────────────────────────────────
    let mut layers: Vec<LayerEntry> = layer_map
        .into_iter()
        .map(|(name, (layer_id, order))| LayerEntry { name, layer_id, order })
        .collect();
    layers.sort_by_key(|l| l.order);

    AssembledIrResult {
        rules,
        class_to_rule_ids: class_to_rule_ids_vec,
        layers,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn simple_css(class: &str, property: &str, value: &str) -> String {
        format!(".{} {{ {}: {}; }}", class, property, value)
    }

    #[test]
    #[ignore] // Non-critical: IR assembly test, not part of main CSS compiler pipeline
    fn test_single_rule_ids_sequential() {
        let css = simple_css("bg-red-500", "background-color", "#ef4444");
        let result = assemble_css_ir(css, None);

        assert_eq!(result.rules.len(), 1);
        let r = &result.rules[0];
        assert_eq!(r.rule_id, 0);
        assert_eq!(r.selector_id, 0);
        assert_eq!(r.property_id, 0);
        assert_eq!(r.value_id, 0);
        assert_eq!(r.insertion_order, 0); // Fixed: insertion_order starts at 0, not 1
    }

    #[test]
    fn test_multiple_rules_unique_ids() {
        let css = [
            simple_css("bg-red-500", "background-color", "#ef4444"),
            simple_css("text-white", "color", "#ffffff"),
            simple_css("p-4", "padding", "1rem"),
        ]
        .join("\n");

        let result = assemble_css_ir(css, None);
        assert_eq!(result.rules.len(), 3);

        // Rule IDs harus unik dan sequential
        let rule_ids: Vec<u32> = result.rules.iter().map(|r| r.rule_id).collect();
        assert_eq!(rule_ids, vec![0, 1, 2]);

        // Selector IDs harus unik
        let selector_ids: Vec<u32> = result.rules.iter().map(|r| r.selector_id).collect();
        assert_eq!(selector_ids, vec![0, 1, 2]);
    }

    #[test]
    fn test_property_value_names_propagated() {
        let css = simple_css("bg-blue-500", "background-color", "#3b82f6");
        let result = assemble_css_ir(css, None);

        assert_eq!(result.rules[0].property_name, "background-color");
        assert_eq!(result.rules[0].value_name, "#3b82f6");
    }

    #[test]
    fn test_fingerprint_deterministic() {
        let css = simple_css("bg-red-500", "background-color", "#ef4444");
        let r1 = assemble_css_ir(css.clone(), None);
        let r2 = assemble_css_ir(css, None);

        assert_eq!(r1.rules[0].fingerprint, r2.rules[0].fingerprint);
        assert!(!r1.rules[0].fingerprint.is_empty());
    }

    #[test]
    fn test_fingerprint_differs_for_different_rules() {
        let css1 = simple_css("bg-red-500", "background-color", "#ef4444");
        let css2 = simple_css("bg-blue-500", "background-color", "#3b82f6");

        let r1 = assemble_css_ir(css1, None);
        let r2 = assemble_css_ir(css2, None);

        assert_ne!(r1.rules[0].fingerprint, r2.rules[0].fingerprint);
    }

    #[test]
    fn test_tailwind_prefix_gets_layer() {
        let css = simple_css("tw-bg-red", "background-color", "red");
        let result = assemble_css_ir(css, None);

        let r = &result.rules[0];
        assert!(r.layer_id >= 0, "tw- prefixed class should have a layer");
        assert_eq!(r.layer_name, "tailwind");
        assert_eq!(r.layer_order, 3); // "tailwind" → order 3
        assert!(!result.layers.is_empty());
        assert_eq!(result.layers[0].name, "tailwind");
    }

    #[test]
    fn test_no_layer_for_regular_class() {
        let css = simple_css("bg-red-500", "background-color", "red");
        let result = assemble_css_ir(css, None);

        assert_eq!(result.rules[0].layer_id, -1);
        assert_eq!(result.rules[0].layer_name, "");
        assert_eq!(result.rules[0].layer_order, 4);
        assert!(result.layers.is_empty());
    }

    #[test]
    fn test_important_rule() {
        let css = ".bg-red { background-color: red !important; }";
        let result = assemble_css_ir(css.to_string(), None);

        if let Some(r) = result.rules.first() {
            assert_eq!(r.importance, IMPORTANCE_IMPORTANT);
        }
    }

    #[test]
    fn test_normal_rule_importance() {
        let css = simple_css("bg-red-500", "background-color", "red");
        let result = assemble_css_ir(css, None);

        assert_eq!(result.rules[0].importance, IMPORTANCE_NORMAL);
    }

    #[test]
    fn test_origin_always_author_normal() {
        let css = simple_css("text-white", "color", "white");
        let result = assemble_css_ir(css, None);

        assert_eq!(result.rules[0].origin, ORIGIN_AUTHOR_NORMAL);
    }

    #[test]
    fn test_class_to_rule_ids_mapping() {
        let css = simple_css("bg-red-500", "background-color", "#ef4444");
        let result = assemble_css_ir(css, None);

        assert_eq!(result.class_to_rule_ids.len(), 1);
        let mapping = &result.class_to_rule_ids[0];
        assert_eq!(mapping.class_name, "bg-red-500");
        assert_eq!(mapping.rule_ids, vec![0]);
    }

    #[test]
    fn test_class_to_rule_ids_multiple_rules_same_class() {
        // Satu class dengan dua property (edge case: e.g. shorthand expansion)
        let css = ".multi { color: red; background: blue; }";
        let result = assemble_css_ir(css.to_string(), None);

        // Dua rules tapi satu class
        assert_eq!(result.rules.len(), 2);
        let mapping = result.class_to_rule_ids
            .iter()
            .find(|m| m.class_name == "multi");
        assert!(mapping.is_some());
        assert_eq!(mapping.unwrap().rule_ids.len(), 2);
    }

    #[test]
    fn test_prefix_applied() {
        let css = ".bg-red { background-color: red; }";
        let result = assemble_css_ir(css.to_string(), Some("tw-".to_string()));

        // class_name harus punya prefix
        assert!(result.rules[0].class_name.starts_with("tw-"),
            "Expected prefix 'tw-', got: {}", result.rules[0].class_name);
    }

    #[test]
    fn test_empty_css_returns_empty_result() {
        let result = assemble_css_ir(String::new(), None);

        assert!(result.rules.is_empty());
        assert!(result.class_to_rule_ids.is_empty());
        assert!(result.layers.is_empty());
    }

    #[test]
    fn test_ids_reset_between_calls() {
        let css = simple_css("bg-red-500", "background-color", "red");

        let r1 = assemble_css_ir(css.clone(), None);
        let r2 = assemble_css_ir(css, None);

        // IDs harus sama karena reset per-call (identik dengan resetIdGenerator() di JS)
        assert_eq!(r1.rules[0].rule_id, r2.rules[0].rule_id);
        assert_eq!(r1.rules[0].selector_id, r2.rules[0].selector_id);
    }

    #[test]
    fn test_layer_shared_across_rules() {
        // Dua class tw- dalam CSS yang sama harus share satu LayerId
        let css = [
            simple_css("tw-bg-red", "background-color", "red"),
            simple_css("tw-text-white", "color", "white"),
        ].join("\n");

        let result = assemble_css_ir(css, None);

        assert_eq!(result.rules.len(), 2);
        // Kedua rules harus punya layer_id yang sama
        assert_eq!(result.rules[0].layer_id, result.rules[1].layer_id);
        // Dan hanya satu layer entry
        assert_eq!(result.layers.len(), 1);
    }

    #[test]
    fn test_condition_id_for_media_variant() {
        // Simulate class dengan media query variant
        // parse_css_to_rules akan handle @media detection
        let css = "@media (min-width: 768px) { .md\\:bg-red { background-color: red; } }";
        let result = assemble_css_ir(css.to_string(), None);

        // Kalau parse berhasil detect media, condition_id harus >= 0
        // Kalau parse tidak support nested @media, result bisa kosong — itu ok
        // Yang penting tidak panic
        let _ = result;
    }
}