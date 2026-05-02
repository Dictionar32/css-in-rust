//! Cascade Resolver — Rust implementation
//!
//! Implements CSS cascade algorithm: origin → layer → importance → specificity → order.
//! Called from JS via `resolve_cascade(rules_json: String) -> String`.
//!
//! Replaces JS functions:
//!   - compareCascadeOrder (ir.ts)
//!   - resolveProperty / compareCascade / buildResolutionReason / determineCascadeStage (resolver.ts)
//!   - resolvePropertyTraced / compareCascadeTraced / ... (trace.ts)

use napi_derive::napi;
use serde::{Deserialize, Serialize};

// ─────────────────────────────────────────────────────────────────────────────
// Input / Output types (mirror TypeScript NativeRuleInput / NativeCascadeResult)
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct RuleInput {
    id: u32,
    property: u32,
    origin: u8,
    importance: u8,
    #[serde(rename = "layerOrder")]
    layer_order: i32,
    specificity: i32,
    #[serde(rename = "conditionResult")]
    condition_result: u8,
    #[serde(rename = "insertionOrder")]
    insertion_order: u32,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
enum ResolutionCause {
    LowerOrigin {
        #[serde(rename = "winnerOrigin")]
        winner_origin: u8,
        #[serde(rename = "loserOrigin")]
        loser_origin: u8,
    },
    LowerLayer {
        #[serde(rename = "winnerLayer")]
        winner_layer: String,
        #[serde(rename = "loserLayer")]
        loser_layer: String,
    },
    LowerImportance,
    LowerSpecificity {
        delta: i32,
    },
    EarlierOrder {
        delta: i32,
    },
    InactiveCondition {
        condition: String,
    },
}

#[derive(Debug, Serialize)]
struct CascadeResolution {
    id: u32,
    #[serde(rename = "propertyId")]
    property_id: u32,
    #[serde(rename = "winnerId")]
    winner_id: u32,
    #[serde(rename = "loserIds")]
    loser_ids: Vec<u32>,
    stage: u8,
    #[serde(rename = "finalDecision")]
    final_decision: String,
    causes: Vec<ResolutionCause>,
}

#[derive(Debug, Serialize)]
struct CascadeResult {
    resolutions: Vec<CascadeResolution>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Cascade stage constants (mirror TypeScript CascadeStage enum)
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_ORIGIN: u8 = 0;
const STAGE_LAYER: u8 = 1;
const STAGE_IMPORTANCE: u8 = 2;
const STAGE_SPECIFICITY: u8 = 3;
const STAGE_ORDER: u8 = 4;

// conditionResult: 1 = Inactive
const CONDITION_INACTIVE: u8 = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Core cascade algorithm
// ─────────────────────────────────────────────────────────────────────────────

/// Compare two rules by cascade priority (higher = wins).
/// Order: origin DESC → layerOrder DESC → importance DESC → specificity DESC → insertionOrder DESC
fn cascade_priority(a: &RuleInput, b: &RuleInput) -> std::cmp::Ordering {
    // Higher origin wins
    if a.origin != b.origin {
        return b.origin.cmp(&a.origin);
    }
    // Higher layer order wins
    if a.layer_order != b.layer_order {
        return b.layer_order.cmp(&a.layer_order);
    }
    // Higher importance wins
    if a.importance != b.importance {
        return b.importance.cmp(&a.importance);
    }
    // Higher specificity wins
    if a.specificity != b.specificity {
        return b.specificity.cmp(&a.specificity);
    }
    // Later insertion order wins
    b.insertion_order.cmp(&a.insertion_order)
}

fn determine_stage(winner: &RuleInput, loser: &RuleInput) -> u8 {
    if winner.origin != loser.origin {
        return STAGE_ORIGIN;
    }
    if winner.layer_order != loser.layer_order {
        return STAGE_LAYER;
    }
    if winner.importance != loser.importance {
        return STAGE_IMPORTANCE;
    }
    if winner.specificity != loser.specificity {
        return STAGE_SPECIFICITY;
    }
    STAGE_ORDER
}

fn build_causes(winner: &RuleInput, loser: &RuleInput) -> Vec<ResolutionCause> {
    let mut causes = Vec::new();

    if winner.origin != loser.origin {
        causes.push(ResolutionCause::LowerOrigin {
            winner_origin: winner.origin,
            loser_origin: loser.origin,
        });
    }

    if winner.layer_order != loser.layer_order {
        causes.push(ResolutionCause::LowerLayer {
            winner_layer: format!("L{}", winner.layer_order),
            loser_layer: format!("L{}", loser.layer_order),
        });
    }

    if winner.importance != loser.importance {
        causes.push(ResolutionCause::LowerImportance);
    }

    if winner.specificity != loser.specificity {
        causes.push(ResolutionCause::LowerSpecificity {
            delta: winner.specificity - loser.specificity,
        });
    }

    if winner.insertion_order != loser.insertion_order {
        causes.push(ResolutionCause::EarlierOrder {
            delta: winner.insertion_order as i32 - loser.insertion_order as i32,
        });
    }

    causes
}

fn format_cause(cause: &ResolutionCause) -> &'static str {
    match cause {
        ResolutionCause::LowerOrigin { .. } => "lower origin",
        ResolutionCause::LowerLayer { .. } => "lower layer",
        ResolutionCause::LowerImportance => "lower importance",
        ResolutionCause::LowerSpecificity { .. } => "lower specificity",
        ResolutionCause::EarlierOrder { .. } => "earlier order",
        ResolutionCause::InactiveCondition { .. } => "inactive condition",
    }
}

fn resolve_property_bucket(
    property_id: u32,
    rules: &mut Vec<&RuleInput>,
    resolution_id_counter: &mut u32,
) -> Option<CascadeResolution> {
    if rules.is_empty() {
        return None;
    }

    // Separate active and inactive rules
    let mut active: Vec<&RuleInput> = rules
        .iter()
        .filter(|r| r.condition_result != CONDITION_INACTIVE)
        .copied()
        .collect();

    let inactive: Vec<&RuleInput> = rules
        .iter()
        .filter(|r| r.condition_result == CONDITION_INACTIVE)
        .copied()
        .collect();

    // Need at least one active rule
    if active.is_empty() {
        return None;
    }

    // Sort active rules by cascade priority (winner first)
    active.sort_by(|a, b| cascade_priority(a, b));

    let winner = active[0];
    let losers: Vec<&RuleInput> = active[1..]
        .iter()
        .copied()
        .chain(inactive.iter().copied())
        .collect();

    let stage = if losers.is_empty() {
        STAGE_ORDER
    } else {
        determine_stage(winner, losers[0])
    };

    let causes = if losers.is_empty() {
        vec![]
    } else {
        let mut c = build_causes(winner, losers[0]);
        // Add inactive condition causes
        for loser in &inactive {
            c.push(ResolutionCause::InactiveCondition {
                condition: format!("C{}", loser.condition_result),
            });
        }
        c
    };

    let final_decision = causes
        .iter()
        .map(format_cause)
        .collect::<Vec<_>>()
        .join(", ");

    let id = *resolution_id_counter;
    *resolution_id_counter += 1;

    Some(CascadeResolution {
        id,
        property_id,
        winner_id: winner.id,
        loser_ids: losers.iter().map(|r| r.id).collect(),
        stage,
        final_decision,
        causes,
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI entry point
// ─────────────────────────────────────────────────────────────────────────────

/// Resolve CSS cascade for a set of rules.
///
/// Input JSON: `Array<{ id, property, origin, importance, layerOrder, specificity,
///              conditionResult, insertionOrder }>`
///
/// Output JSON: `{ resolutions: Array<{ id, propertyId, winnerId, loserIds,
///               stage, finalDecision, causes }> }`
///
/// Cascade priority: origin → layerOrder → importance → specificity → insertionOrder
#[napi]
pub fn resolve_cascade(rules_json: String) -> String {
    let rules: Vec<RuleInput> = match serde_json::from_str(&rules_json) {
        Ok(r) => r,
        Err(e) => {
            let err =
                serde_json::json!({ "error": format!("parse error: {}", e), "resolutions": [] });
            return err.to_string();
        }
    };

    // Group rules by property id
    let mut property_buckets: std::collections::HashMap<u32, Vec<&RuleInput>> =
        std::collections::HashMap::new();

    for rule in &rules {
        property_buckets
            .entry(rule.property)
            .or_default()
            .push(rule);
    }

    let mut resolutions: Vec<CascadeResolution> = Vec::new();
    let mut resolution_id_counter: u32 = 0;

    // Sort property IDs for deterministic output
    let mut property_ids: Vec<u32> = property_buckets.keys().copied().collect();
    property_ids.sort_unstable();

    for property_id in property_ids {
        let bucket = property_buckets.get_mut(&property_id).unwrap();
        if let Some(resolution) =
            resolve_property_bucket(property_id, bucket, &mut resolution_id_counter)
        {
            resolutions.push(resolution);
        }
    }

    let result = CascadeResult { resolutions };
    serde_json::to_string(&result)
        .unwrap_or_else(|e| format!("{{\"error\":\"{}\",\"resolutions\":[]}}", e))
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_rule(
        id: u32,
        property: u32,
        origin: u8,
        importance: u8,
        layer_order: i32,
        specificity: i32,
        insertion_order: u32,
    ) -> RuleInput {
        RuleInput {
            id,
            property,
            origin,
            importance,
            layer_order,
            specificity,
            condition_result: 0,
            insertion_order,
        }
    }

    #[test]
    fn test_higher_specificity_wins() {
        let a = make_rule(0, 1, 2, 0, 4, 20, 0);
        let b = make_rule(1, 1, 2, 0, 4, 10, 1);
        let mut rules = vec![&b, &a];
        let mut counter = 0u32;
        let res = resolve_property_bucket(1, &mut rules, &mut counter).unwrap();
        assert_eq!(res.winner_id, 0); // a wins (higher specificity)
        assert_eq!(res.stage, STAGE_SPECIFICITY);
    }

    #[test]
    fn test_higher_origin_wins() {
        let a = make_rule(0, 1, 3, 0, 4, 10, 0); // AuthorImportant
        let b = make_rule(1, 1, 2, 0, 4, 10, 1); // AuthorNormal
        let mut rules = vec![&b, &a];
        let mut counter = 0u32;
        let res = resolve_property_bucket(1, &mut rules, &mut counter).unwrap();
        assert_eq!(res.winner_id, 0);
        assert_eq!(res.stage, STAGE_ORIGIN);
    }

    #[test]
    fn test_later_insertion_order_wins() {
        let a = make_rule(0, 1, 2, 0, 4, 10, 5);
        let b = make_rule(1, 1, 2, 0, 4, 10, 10); // later
        let mut rules = vec![&a, &b];
        let mut counter = 0u32;
        let res = resolve_property_bucket(1, &mut rules, &mut counter).unwrap();
        assert_eq!(res.winner_id, 1);
        assert_eq!(res.stage, STAGE_ORDER);
    }

    #[test]
    fn test_inactive_rule_loses() {
        let active = RuleInput {
            id: 0,
            property: 1,
            origin: 2,
            importance: 0,
            layer_order: 4,
            specificity: 5,
            condition_result: 0,
            insertion_order: 0,
        };
        let inactive = RuleInput {
            id: 1,
            property: 1,
            origin: 2,
            importance: 0,
            layer_order: 4,
            specificity: 100,
            condition_result: 1,
            insertion_order: 1,
        };
        let mut rules = vec![&active, &inactive];
        let mut counter = 0u32;
        let res = resolve_property_bucket(1, &mut rules, &mut counter).unwrap();
        assert_eq!(res.winner_id, 0); // active wins despite lower specificity
    }

    #[test]
    fn test_resolve_cascade_json_roundtrip() {
        let input = r#"[
            {"id":0,"property":1,"origin":2,"importance":0,"layerOrder":4,"specificity":20,"conditionResult":0,"insertionOrder":0},
            {"id":1,"property":1,"origin":2,"importance":0,"layerOrder":4,"specificity":10,"conditionResult":0,"insertionOrder":1}
        ]"#;
        let output = resolve_cascade(input.to_string());
        let parsed: serde_json::Value = serde_json::from_str(&output).unwrap();
        assert_eq!(parsed["resolutions"][0]["winnerId"], 0);
        assert_eq!(parsed["resolutions"][0]["loserIds"][0], 1);
    }
}
