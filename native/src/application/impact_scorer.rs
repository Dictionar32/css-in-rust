//! Impact Scorer — migrated from `engine/src/impactTracker.ts`
//!
//! Fungsi yang dimigrate:
//!   - `calculateRisk(className, impact)`       → `calculate_risk(class_name, impact_json)`
//!   - `generateSuggestions(className, impact)` → `generate_suggestions(class_name, impact_json)`
//!   - `isCriticalClass(className)`             → `is_critical_class(class_name)`
//!   - `calculateSavings(bundleSize, count)`    → `calculate_savings(bundle_size, count)`
//!
//! Kenapa worth di-native:
//! - `calculateRisk` + `generateSuggestions` dipanggil untuk setiap class di `analyzeAll()`
//!   — bisa ratusan / ribuan class per workspace scan.
//! - `criticalPatterns` matching bisa jadi static &[str] di Rust, no allocation.

use napi_derive::napi;
use serde::Deserialize;

// ─────────────────────────────────────────────────────────────────────────────
// Critical patterns — mirrors `criticalPatterns` array di ImpactTracker
// ─────────────────────────────────────────────────────────────────────────────

static CRITICAL_PATTERNS: &[&str] = &[
    "fixed", "absolute", "sticky", "z-50", "z-index",
    "top-0", "right-0", "bottom-0", "left-0",
    "w-full", "h-full", "min-h-screen",
    "flex", "grid", "block", "inline", "hidden",
    "visible", "opacity", "pointer-events", "cursor",
];

// ─────────────────────────────────────────────────────────────────────────────
// Input type (subset of ImpactReport used for risk/suggestions calculation)
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImpactReportInput {
    total_components: u32,
    indirect_usage: u32,
    bundle_size_bytes: u32,
    estimated_savings: u32,
    risk_level: String,
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI exports
// ─────────────────────────────────────────────────────────────────────────────

/// Check whether a class name matches any critical positioning/display pattern.
///
/// Replaces `isCriticalClass(className)` in `ImpactTracker`.
#[napi]
pub fn is_critical_class(class_name: String) -> bool {
    let normalized = class_name.strip_prefix('.').unwrap_or(&class_name);
    CRITICAL_PATTERNS.iter().any(|pattern| {
        normalized == *pattern || normalized.starts_with(&format!("{}:", pattern))
    })
}

/// Estimate bundle savings from removing a class.
///
/// Replaces `calculateSavings(bundleSize, componentCount)` in `ImpactTracker`.
#[napi]
pub fn calculate_savings(bundle_size: u32, component_count: u32) -> u32 {
    let savings = bundle_size as i64 - component_count as i64 * 50;
    savings.max(0) as u32
}

/// Calculate risk level for a class based on usage count and critical patterns.
///
/// Replaces `calculateRisk(className, impact)` in `ImpactTracker`.
///
/// Input: class name + ImpactReport JSON.
/// Returns: `"low"` | `"medium"` | `"high"`
#[napi]
pub fn calculate_risk(class_name: String, impact_json: String) -> String {
    if class_name.trim().is_empty() {
        return "low".to_string();
    }

    let impact: ImpactReportInput = match serde_json::from_str(&impact_json) {
        Ok(i) => i,
        Err(_) => return "low".to_string(),
    };

    let normalized = class_name.strip_prefix('.').unwrap_or(&class_name);

    if impact.total_components > 10 {
        return "high".to_string();
    }
    if is_critical_class(normalized.to_string()) {
        return "high".to_string();
    }
    if impact.total_components >= 5 {
        return "medium".to_string();
    }
    "low".to_string()
}

/// Generate human-readable suggestions for a class based on impact analysis.
///
/// Replaces `generateSuggestions(className, impact)` in `ImpactTracker`.
///
/// Input: class name + ImpactReport JSON (with riskLevel already set).
/// Returns: list of suggestion strings.
#[napi]
pub fn generate_suggestions(class_name: String, impact_json: String) -> Vec<String> {
    if class_name.trim().is_empty() {
        return vec![];
    }

    let impact: ImpactReportInput = match serde_json::from_str(&impact_json) {
        Ok(i) => i,
        Err(_) => return vec![],
    };

    let normalized = class_name.strip_prefix('.').unwrap_or(&class_name);
    let mut suggestions: Vec<String> = Vec::new();

    match impact.risk_level.as_str() {
        "high" => {
            if impact.total_components > 10 {
                suggestions.push(format!(
                    "This class is used in {} components. Consider creating a utility component instead.",
                    impact.total_components
                ));
            }
            if is_critical_class(normalized.to_string()) {
                suggestions.push(
                    "This is a critical positioning/display class. Review all usages before removal.".into()
                );
            }
            suggestions.push("Manual code review recommended before removing this class.".into());
        }
        "medium" => {
            suggestions.push(format!(
                "This class is used in {} components. Test each component after removal.",
                impact.total_components
            ));
            if impact.indirect_usage > 0 {
                suggestions.push("Check for indirect usages via variants before removing.".into());
            }
        }
        _ => {
            suggestions.push(if impact.total_components > 0 {
                "Low risk: class is used in fewer than 5 components.".into()
            } else {
                "This class appears to be unused. Consider removing it.".into()
            });
        }
    }

    if impact.estimated_savings > 0 {
        suggestions.push(format!(
            "Estimated bundle size savings: ~{} bytes.",
            impact.estimated_savings
        ));
    }
    if impact.bundle_size_bytes > 100 {
        suggestions.push(
            "This class has significant CSS bundle contribution. Removal will improve load times.".into()
        );
    }

    suggestions
}

/// Compute full risk + suggestions in a single native call — avoids double JSON
/// serialization when called from `calculateImpact()` in JS.
///
/// Returns `{ riskLevel: string, suggestions: string[] }` as JSON.
#[napi]
pub fn compute_impact_metadata(class_name: String, impact_json: String) -> String {
    let risk = calculate_risk(class_name.clone(), impact_json.clone());

    // Re-parse with updated riskLevel for suggestion generation
    let updated_json = match serde_json::from_str::<serde_json::Value>(&impact_json) {
        Ok(mut v) => {
            v["riskLevel"] = serde_json::Value::String(risk.clone());
            v.to_string()
        }
        Err(_) => impact_json.clone(),
    };

    let suggestions = generate_suggestions(class_name, updated_json);

    serde_json::json!({
        "riskLevel": risk,
        "suggestions": suggestions
    })
    .to_string()
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn impact_json(total: u32, risk: &str, indirect: u32, bundle: u32, savings: u32) -> String {
        serde_json::json!({
            "totalComponents": total,
            "directUsage": total,
            "indirectUsage": indirect,
            "bundleSizeBytes": bundle,
            "estimatedSavings": savings,
            "riskLevel": risk
        }).to_string()
    }

    #[test]
    fn test_is_critical_class() {
        assert!(is_critical_class("flex".to_string()));
        assert!(is_critical_class("fixed".to_string()));
        assert!(is_critical_class("flex:hover".to_string()));
        assert!(!is_critical_class("bg-red-500".to_string()));
        assert!(!is_critical_class("p-4".to_string()));
    }

    #[test]
    fn test_calculate_savings() {
        assert_eq!(calculate_savings(1000, 5), 750);
        assert_eq!(calculate_savings(100, 10), 0); // max(0, 100-500)
    }

    #[test]
    fn test_risk_high_by_count() {
        let risk = calculate_risk("bg-blue-500".to_string(), impact_json(11, "low", 0, 0, 0));
        assert_eq!(risk, "high");
    }

    #[test]
    fn test_risk_high_by_critical() {
        let risk = calculate_risk("flex".to_string(), impact_json(2, "low", 0, 0, 0));
        assert_eq!(risk, "high");
    }

    #[test]
    fn test_risk_medium() {
        let risk = calculate_risk("bg-blue-500".to_string(), impact_json(5, "low", 0, 0, 0));
        assert_eq!(risk, "medium");
    }

    #[test]
    fn test_risk_low() {
        let risk = calculate_risk("bg-blue-500".to_string(), impact_json(1, "low", 0, 0, 0));
        assert_eq!(risk, "low");
    }

    #[test]
    fn test_generate_suggestions_high_count() {
        let s = generate_suggestions("bg-blue-500".to_string(), impact_json(15, "high", 0, 200, 500));
        assert!(s.iter().any(|x| x.contains("15 components")));
        assert!(s.iter().any(|x| x.contains("Manual code review")));
        assert!(s.iter().any(|x| x.contains("savings")));
        assert!(s.iter().any(|x| x.contains("bundle")));
    }

    #[test]
    fn test_generate_suggestions_unused() {
        let s = generate_suggestions("bg-blue-500".to_string(), impact_json(0, "low", 0, 0, 0));
        assert!(s.iter().any(|x| x.contains("unused")));
    }

    #[test]
    fn test_compute_impact_metadata_returns_json() {
        let meta = compute_impact_metadata("flex".to_string(), impact_json(3, "low", 0, 200, 100));
        let parsed: serde_json::Value = serde_json::from_str(&meta).unwrap();
        assert_eq!(parsed["riskLevel"], "high"); // flex is critical
        assert!(parsed["suggestions"].is_array());
    }
}