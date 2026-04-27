//! Native animation compilation module.
//! Compiles animation definitions to optimized CSS keyframes and classes.

use napi_derive::napi;
use napi::bindgen_prelude::*;
use regex::Regex;
use std::collections::HashMap;
use once_cell::sync::Lazy;

static WHITESPACE_RE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\s+").unwrap()
});

#[napi(object)]
pub struct CompiledAnimation {
    pub class_name: String,
    pub keyframes_css: String,
    pub animation_css: String,
}

#[napi]
pub fn compile_animation(
    from_classes: String,
    to_classes: String,
    name: Option<String>,
    duration_ms: Option<i32>,
    easing: Option<String>,
    delay_ms: Option<i32>,
    fill_mode: Option<String>,
    iterations: Option<String>,
    direction: Option<String>,
) -> Result<CompiledAnimation> {
    let name = name.unwrap_or_else(|| format!("tw-anim-{}", generate_id()));
    let duration = duration_ms.unwrap_or(300);
    let easing = easing.unwrap_or_else(|| "ease-out".to_string());
    let delay = delay_ms.unwrap_or(0);
    let fill = fill_mode.unwrap_or_else(|| "both".to_string());
    let iterations_str = iterations.unwrap_or_else(|| "1".to_string());
    let direction = direction.unwrap_or_else(|| "normal".to_string());

    // Normalize classes: split by whitespace, deduplicate
    let from_normalized = normalize_classes(&from_classes);
    let to_normalized = normalize_classes(&to_classes);

    // Generate keyframes ID
    let keyframes_name = format!("{}-kf", name);

    // Build keyframes CSS
    let keyframes_css = build_keyframes(&keyframes_name, &from_normalized, &to_normalized);

    // Build animation CSS
    let animation_css = build_animation_css(
        &name,
        &keyframes_name,
        duration,
        &easing,
        delay,
        &fill,
        &iterations_str,
        &direction,
        &from_normalized,
    );

    Ok(CompiledAnimation {
        class_name: name,
        keyframes_css,
        animation_css,
    })
}

/// Compile keyframes directly from stop definitions
#[napi]
pub fn compile_keyframes(
    name: String,
    stops_json: String,
) -> Result<CompiledAnimation> {
    let stops: Vec<HashMap<String, String>> = match serde_json::from_str(&stops_json) {
        Ok(s) => s,
        Err(e) => {
            return Err(Error::from_reason(format!("Failed to parse stops JSON: {}", e)))
        }
    };

    let mut keyframes_css = format!("@keyframes {} {{\n", name);
    let mut from_classes = String::new();

    for stop in stops {
        let offset = stop.get("offset").cloned().unwrap_or_else(|| "0%".to_string());
        let classes = stop.get("classes").cloned().unwrap_or_default();

        if offset == "0%" {
            from_classes = classes.clone();
        }

        let normalized = normalize_classes(&classes);
        keyframes_css.push_str(&format!("  {} {{ {} }}\n", offset, normalized));
    }

    keyframes_css.push_str("}\n");

    // Generate a class name for the keyframes
    let class_name = format!("{}-kf", name);

    // Animation CSS that uses the keyframes
    let animation_css = format!(
        ".{} {{\n  animation-name: {};\n  animation-duration: 300ms;\n  animation-timing-function: ease-out;\n  animation-fill-mode: both;\n}}\n",
        class_name, name
    );

    Ok(CompiledAnimation {
        class_name: name,
        keyframes_css,
        animation_css,
    })
}

/// Split a class list string into individual class tokens.
/// Uses simple whitespace splitting - no regex overhead.
#[napi]
pub fn split_animate_classes(class_list: String) -> Vec<String> {
    WHITESPACE_RE
        .split(&class_list)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .collect()
}

fn normalize_classes(class_list: &str) -> String {
    let classes = split_animate_classes(class_list.to_string());
    let mut seen = std::collections::HashSet::new();
    let mut result = Vec::new();

    for class in classes {
        if !class.is_empty() && seen.insert(class.clone()) {
            result.push(class);
        }
    }

    result.join(" ")
}

fn build_keyframes(name: &str, from: &str, to: &str) -> String {
    format!(
        "@keyframes {} {{\n  from {{ {} }}\n  to {{ {} }}\n}}\n",
        name, from, to
    )
}

fn build_animation_css(
    name: &str,
    keyframes_name: &str,
    duration_ms: i32,
    easing: &str,
    delay_ms: i32,
    fill: &str,
    iterations: &str,
    direction: &str,
    base_classes: &str,
) -> String {
    let has_base = !base_classes.is_empty();
    format!(
        ".{} {{\n  {}{}\n  animation-name: {};\n  animation-duration: {}ms;\n  animation-timing-function: {};\n  animation-delay: {}ms;\n  animation-fill-mode: {};\n  animation-iteration-count: {};\n  animation-direction: {};\n}}\n",
        name,
        base_classes,
        if has_base { " " } else { "" },
        keyframes_name,
        duration_ms,
        easing,
        delay_ms,
        fill,
        iterations,
        direction
    )
}

fn generate_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    format!("{:x}", nanos)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_animate_classes() {
        let result = split_animate_classes("p-4 bg-blue-500   text-lg".to_string());
        assert_eq!(result, vec!["p-4", "bg-blue-500", "text-lg"]);
    }

    #[test]
    fn test_split_animate_classes_empty() {
        let result = split_animate_classes("".to_string());
        assert!(result.is_empty());
    }

    #[test]
    fn test_compile_animation_basic() {
        let result = compile_animation(
            "opacity-0".to_string(),
            "opacity-100".to_string(),
            Some("fade".to_string()),
            Some(300),
            Some("ease-out".to_string()),
            Some(0),
            Some("both".to_string()),
            Some("1".to_string()),
            Some("normal".to_string()),
        ).unwrap();

        assert_eq!(result.class_name, "fade");
        assert!(result.keyframes_css.contains("@keyframes fade-kf"));
        assert!(result.keyframes_css.contains("opacity-0"));
        assert!(result.keyframes_css.contains("opacity-100"));
        assert!(result.animation_css.contains("fade"));
    }

    #[test]
    fn test_compile_keyframes_basic() {
        let stops = vec![
            HashMap::from([
                ("offset".to_string(), "0%".to_string()),
                ("classes".to_string(), "opacity-0".to_string()),
            ]),
            HashMap::from([
                ("offset".to_string(), "100%".to_string()),
                ("classes".to_string(), "opacity-100".to_string()),
            ]),
        ];

        let result = compile_keyframes(
            "slide".to_string(),
            serde_json::to_string(&stops).unwrap(),
        ).unwrap();

        assert_eq!(result.class_name, "slide");
        assert!(result.keyframes_css.contains("@keyframes slide"));
        assert!(result.keyframes_css.contains("0%"));
        assert!(result.keyframes_css.contains("100%"));
    }

    #[test]
    fn test_normalize_classes_deduplicates() {
        let result = normalize_classes("p-4 p-4 bg-blue-500 bg-blue-500");
        assert_eq!(result, "p-4 bg-blue-500");
    }
}
