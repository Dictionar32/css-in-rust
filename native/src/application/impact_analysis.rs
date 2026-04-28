//! Impact Analysis — Rust implementation
//!
//! Replaces JS dari `packages/domain/engine/src/impactTracker.ts`:
//!   - calculateRisk()         → calculate_risk()
//!   - calculateSavings()      → calculate_savings()
//!   - generateSuggestions()   → generate_suggestions()
//!   - calculateImpact()       → calculate_impact() (orchestrator)
//!
//! criticalPatterns (JS array) → static HashSet (O(1) lookup)

use napi_derive::napi;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

// ─────────────────────────────────────────────────────────────────────────────
// Critical patterns — mirrors JS `criticalPatterns` array
// ─────────────────────────────────────────────────────────────────────────────

static CRITICAL_PATTERNS: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    [
        "fixed", "absolute", "sticky", "z-50", "z-index",
        "top-0", "right-0", "bottom-0", "left-0",
        "w-full", "h-full", "min-h-screen",
        "flex", "grid", "block", "inline", "hidden",
        "visible", "opacity", "pointer-events", "cursor",
    ]
    .into_iter()
    .collect()
});

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct ImpactInput {
    #[serde(rename = "className")]
    class_name: String,
    #[serde(rename = "totalComponents")]
    total_components: u32,
    #[serde(rename = "indirectUsage")]
    indirect_usage: u32,
    #[serde(rename = "bundleSizeBytes")]
    bundle_size_bytes: u32,
}

#[derive(Debug, Serialize)]
struct ImpactOutput {
    #[serde(rename = "riskLevel")]
    risk_level: String,
    #[serde(rename = "estimatedSavings")]
    estimated_savings: u32,
    suggestions: Vec<String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Core logic
// ─────────────────────────────────────────────────────────────────────────────

fn normalize_class(class_name: &str) -> &str {
    class_name.strip_prefix('.').unwrap_or(class_name)
}

fn is_critical_class(class_name: &str) -> bool {
    let normalized = normalize_class(class_name);
    for pattern in CRITICAL_PATTERNS.iter() {
        if normalized == *pattern || normalized.starts_with(&format!("{}:", pattern)) {
            return true;
        }
    }
    false
}

/// JS: `Math.max(0, bundleSize - componentCount * 50)`
fn calculate_savings_inner(bundle_size: u32, component_count: u32) -> u32 {
    bundle_size.saturating_sub(component_count * 50)
}

/// JS: calculateRisk(className, impact) → "low" | "medium" | "high"
fn calculate_risk_inner(class_name: &str, total_components: u32) -> &'static str {
    if total_components > 10 {
        return "high";
    }
    if is_critical_class(class_name) {
        return "high";
    }
    if total_components >= 5 {
        return "medium";
    }
    "low"
}

/// JS: generateSuggestions(className, impact) → string[]
fn generate_suggestions_inner(
    class_name: &str,
    risk_level: &str,
    total_components: u32,
    indirect_usage: u32,
    estimated_savings: u32,
    bundle_size_bytes: u32,
) -> Vec<String> {
    let normalized = normalize_class(class_name);
    let mut suggestions: Vec<String> = Vec::new();

    match risk_level {
        "high" => {
            if total_components > 10 {
                suggestions.push(format!(
                    "This class is used in {} components. Consider creating a utility component instead.",
                    total_components
                ));
            }
            if is_critical_class(normalized) {
                suggestions.push(
                    "This is a critical positioning/display class. Review all usages before removal."
                        .to_string(),
                );
            }
            suggestions.push("Manual code review recommended before removing this class.".to_string());
        }
        "medium" => {
            suggestions.push(format!(
                "This class is used in {} components. Test each component after removal.",
                total_components
            ));
            if indirect_usage > 0 {
                suggestions.push(
                    "Check for indirect usages via variants before removing.".to_string(),
                );
            }
        }
        _ => {
            // low
            suggestions.push(if total_components > 0 {
                "Low risk: class is used in fewer than 5 components.".to_string()
            } else {
                "This class appears to be unused. Consider removing it.".to_string()
            });
        }
    }

    if estimated_savings > 0 {
        suggestions.push(format!(
            "Estimated bundle size savings: ~{} bytes.",
            estimated_savings
        ));
    }
    if bundle_size_bytes > 100 {
        suggestions.push(
            "This class has significant CSS bundle contribution. Removal will improve load times."
                .to_string(),
        );
    }

    suggestions
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI exports
// ─────────────────────────────────────────────────────────────────────────────

/// Calculate risk level for a single class.
///
/// JS equivalent: `calculateRisk(className, impact): "low" | "medium" | "high"`
#[napi]
pub fn calculate_risk(class_name: String, total_components: u32) -> String {
    calculate_risk_inner(&class_name, total_components).to_string()
}

/// Calculate estimated bundle savings.
///
/// JS equivalent: `calculateSavings(bundleSize, componentCount): number`
#[napi]
pub fn calculate_savings(bundle_size_bytes: u32, component_count: u32) -> u32 {
    calculate_savings_inner(bundle_size_bytes, component_count)
}

/// Full impact calculation: risk + savings + suggestions in one native call.
///
/// Input JSON: `{ className, totalComponents, indirectUsage, bundleSizeBytes }`
/// Output JSON: `{ riskLevel, estimatedSavings, suggestions }`
///
/// JS equivalent: three separate calls to calculateRisk + calculateSavings + generateSuggestions
#[napi]
pub fn calculate_impact(impact_json: String) -> String {
    let input: ImpactInput = match serde_json::from_str(&impact_json) {
        Ok(v) => v,
        Err(e) => {
            return format!(
                r#"{{"riskLevel":"low","estimatedSavings":0,"suggestions":["parse error: {}"]}}"#,
                e
            )
        }
    };

    let risk = calculate_risk_inner(&input.class_name, input.total_components);
    let savings = calculate_savings_inner(input.bundle_size_bytes, input.total_components);
    let suggestions = generate_suggestions_inner(
        &input.class_name,
        risk,
        input.total_components,
        input.indirect_usage,
        savings,
        input.bundle_size_bytes,
    );

    let output = ImpactOutput {
        risk_level: risk.to_string(),
        estimated_savings: savings,
        suggestions,
    };

    serde_json::to_string(&output).unwrap_or_else(|_| {
        r#"{"riskLevel":"low","estimatedSavings":0,"suggestions":[]}"#.to_string()
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_high_by_count() {
        assert_eq!(calculate_risk_inner("p-4", 11), "high");
    }

    #[test]
    fn test_risk_high_by_critical() {
        assert_eq!(calculate_risk_inner("fixed", 1), "high");
        assert_eq!(calculate_risk_inner("flex", 1), "high");
        assert_eq!(calculate_risk_inner("w-full", 2), "high");
    }

    #[test]
    fn test_risk_medium() {
        assert_eq!(calculate_risk_inner("p-4", 5), "medium");
        assert_eq!(calculate_risk_inner("p-4", 7), "medium");
    }

    #[test]
    fn test_risk_low() {
        assert_eq!(calculate_risk_inner("p-4", 0), "low");
        assert_eq!(calculate_risk_inner("p-4", 4), "low");
    }

    #[test]
    fn test_savings() {
        assert_eq!(calculate_savings_inner(1000, 5), 750);
        assert_eq!(calculate_savings_inner(100, 10), 0); // saturating_sub
        assert_eq!(calculate_savings_inner(0, 0), 0);
    }

    #[test]
    fn test_normalize_class() {
        assert_eq!(normalize_class(".flex"), "flex");
        assert_eq!(normalize_class("flex"), "flex");
    }

    #[test]
    fn test_suggestions_high_count() {
        let s = generate_suggestions_inner("p-4", "high", 15, 0, 0, 0);
        assert!(s.iter().any(|x| x.contains("15 components")));
        assert!(s.iter().any(|x| x.contains("Manual code review")));
    }

    #[test]
    fn test_suggestions_high_critical() {
        let s = generate_suggestions_inner("fixed", "high", 1, 0, 0, 0);
        assert!(s.iter().any(|x| x.contains("critical positioning")));
    }

    #[test]
    fn test_suggestions_unused() {
        let s = generate_suggestions_inner("p-4", "low", 0, 0, 0, 0);
        assert!(s.iter().any(|x| x.contains("unused")));
    }

    #[test]
    fn test_calculate_impact_json_roundtrip() {
        let input = r#"{"className":"fixed","totalComponents":1,"indirectUsage":0,"bundleSizeBytes":200}"#;
        let output = calculate_impact(input.to_string());
        let parsed: serde_json::Value = serde_json::from_str(&output).unwrap();
        assert_eq!(parsed["riskLevel"], "high");
        assert_eq!(parsed["estimatedSavings"], 150); // 200 - 1*50
        assert!(!parsed["suggestions"].as_array().unwrap().is_empty());
    }
}