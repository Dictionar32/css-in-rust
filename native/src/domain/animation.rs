use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::shared::utils::short_hash;

fn tw_to_css(class: &str) -> Option<&'static str> {
    match class {
        // Opacity
        "opacity-0" => Some("opacity: 0"),
        "opacity-5" => Some("opacity: 0.05"),
        "opacity-10" => Some("opacity: 0.1"),
        "opacity-20" => Some("opacity: 0.2"),
        "opacity-25" => Some("opacity: 0.25"),
        "opacity-30" => Some("opacity: 0.3"),
        "opacity-40" => Some("opacity: 0.4"),
        "opacity-50" => Some("opacity: 0.5"),
        "opacity-60" => Some("opacity: 0.6"),
        "opacity-70" => Some("opacity: 0.7"),
        "opacity-75" => Some("opacity: 0.75"),
        "opacity-80" => Some("opacity: 0.8"),
        "opacity-90" => Some("opacity: 0.9"),
        "opacity-95" => Some("opacity: 0.95"),
        "opacity-100" => Some("opacity: 1"),
        // Translate Y
        "translate-y-0" => Some("transform:translateY(0px)"),
        "translate-y-0.5" => Some("transform:translateY(0.125rem)"),
        "translate-y-1" => Some("transform:translateY(0.25rem)"),
        "translate-y-2" => Some("transform:translateY(0.5rem)"),
        "translate-y-3" => Some("transform:translateY(0.75rem)"),
        "translate-y-4" => Some("transform:translateY(1rem)"),
        "translate-y-6" => Some("transform:translateY(1.5rem)"),
        "translate-y-8" => Some("transform:translateY(2rem)"),
        "-translate-y-1" => Some("transform:translateY(-0.25rem)"),
        "-translate-y-2" => Some("transform:translateY(-0.5rem)"),
        "-translate-y-4" => Some("transform:translateY(-1rem)"),
        "-translate-y-8" => Some("transform:translateY(-2rem)"),
        // Translate X
        "translate-x-0" => Some("transform:translateX(0px)"),
        "translate-x-1" => Some("transform:translateX(0.25rem)"),
        "translate-x-2" => Some("transform:translateX(0.5rem)"),
        "translate-x-4" => Some("transform:translateX(1rem)"),
        "-translate-x-1" => Some("transform:translateX(-0.25rem)"),
        "-translate-x-2" => Some("transform:translateX(-0.5rem)"),
        "-translate-x-4" => Some("transform:translateX(-1rem)"),
        // Scale
        "scale-0" => Some("transform:scale(0)"),
        "scale-50" => Some("transform:scale(0.5)"),
        "scale-75" => Some("transform:scale(0.75)"),
        "scale-90" => Some("transform:scale(0.9)"),
        "scale-95" => Some("transform:scale(0.95)"),
        "scale-100" => Some("transform:scale(1)"),
        "scale-105" => Some("transform:scale(1.05)"),
        "scale-110" => Some("transform:scale(1.1)"),
        "scale-125" => Some("transform:scale(1.25)"),
        "scale-150" => Some("transform:scale(1.5)"),
        // Rotate
        "rotate-0" => Some("transform:rotate(0deg)"),
        "rotate-1" => Some("transform:rotate(1deg)"),
        "rotate-2" => Some("transform:rotate(2deg)"),
        "rotate-3" => Some("transform:rotate(3deg)"),
        "rotate-6" => Some("transform:rotate(6deg)"),
        "rotate-12" => Some("transform:rotate(12deg)"),
        "rotate-45" => Some("transform:rotate(45deg)"),
        "rotate-90" => Some("transform:rotate(90deg)"),
        "rotate-180" => Some("transform:rotate(180deg)"),
        "-rotate-1" => Some("transform:rotate(-1deg)"),
        "-rotate-2" => Some("transform:rotate(-2deg)"),
        "-rotate-6" => Some("transform:rotate(-6deg)"),
        "-rotate-12" => Some("transform:rotate(-12deg)"),
        "-rotate-45" => Some("transform:rotate(-45deg)"),
        "-rotate-90" => Some("transform:rotate(-90deg)"),
        // Blur
        "blur-none" => Some("filter:blur(0)"),
        "blur-sm" => Some("filter:blur(4px)"),
        "blur" => Some("filter:blur(8px)"),
        "blur-md" => Some("filter:blur(12px)"),
        "blur-lg" => Some("filter:blur(16px)"),
        "blur-xl" => Some("filter:blur(24px)"),
        "blur-2xl" => Some("filter:blur(40px)"),
        "blur-3xl" => Some("filter:blur(64px)"),
        _ => None,
    }
}

/// Convert space-separated Tailwind classes → CSS declaration string.
/// Merges multiple transform: values into one.
pub(crate) fn classes_to_css(classes: &str) -> String {
        let mut transforms: Vec<String> = Vec::new();
        let mut others: Vec<String> = Vec::new();

        for cls in classes.split_whitespace() {
            if let Some(css) = tw_to_css(cls) {
                if let Some(rest) = css.strip_prefix("transform:") {
                    transforms.push(rest.trim().to_string());
                } else {
                    others.push(css.to_string());
                }
            }
        }

    let mut result = others;
    if !transforms.is_empty() {
        result.push(format!("transform: {}", transforms.join(" ")));
    }
    result.join("; ")
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CompiledAnimation {
    pub class_name: String,
    pub keyframes_css: String,
    pub animation_css: String,
}

/// Compile a from/to animation into @keyframes + animation CSS.
#[napi]
#[allow(clippy::too_many_arguments)]
pub fn compile_animation(
    from: String,
    to: String,
    name: Option<String>,
    duration_ms: Option<u32>,
    easing: Option<String>,
    delay_ms: Option<u32>,
    fill: Option<String>,
    iterations: Option<String>,
    direction: Option<String>,
) -> CompiledAnimation {
    let duration = duration_ms.unwrap_or(300);
    let easing = easing.as_deref().unwrap_or("ease-out");
    let delay = delay_ms.unwrap_or(0);
    let fill = fill.as_deref().unwrap_or("both");
    let iterations = iterations.as_deref().unwrap_or("1");
    let direction = direction.as_deref().unwrap_or("normal");

    // Generate animation ID
    let base = name.unwrap_or_else(|| {
        let combined = format!("{}-{}", from.replace(' ', "-"), to.replace(' ', "-"));
        combined.chars().take(30).collect()
    });
    let anim_id = format!(
        "tw-{}",
        base.replace(|c: char| !c.is_alphanumeric() && c != '-', "-")
    );
    let hash = short_hash(&format!("{}{}", from, to));
    let anim_id = format!("{}-{}", anim_id, &hash[..4]);

    let from_css = classes_to_css(&from);
    let to_css = classes_to_css(&to);

    let keyframes_css = format!(
        "@keyframes {id} {{\n  from {{ {from} }}\n  to   {{ {to} }}\n}}",
        id = anim_id,
        from = if from_css.is_empty() {
            String::new()
        } else {
            from_css
        },
        to = if to_css.is_empty() {
            String::new()
        } else {
            to_css
        },
    );

    let animation_css =
        format!(
        "animation-name: {id}; animation-duration: {dur}ms; animation-timing-function: {ease}; \
         animation-delay: {delay}ms; animation-fill-mode: {fill}; \
         animation-iteration-count: {iter}; animation-direction: {dir}",
        id = anim_id, dur = duration, ease = easing,
        delay = delay, fill = fill, iter = iterations, dir = direction,
    );

    CompiledAnimation {
        class_name: anim_id,
        keyframes_css,
        animation_css,
    }
}

/// Compile a custom multi-stop @keyframes definition.
///
/// `stops_json`: `[{"stop":"0%","classes":"opacity-0 scale-95"},...]`
#[napi]
pub fn compile_keyframes(name: String, stops_json: String) -> CompiledAnimation {
    let anim_id = format!("tw-{}", name.replace(|c: char| !c.is_alphanumeric(), "-"));

    // Regex-based parsing: find each {"stop":"...","classes":"..."} object
    static RE_STOP: Lazy<Regex> = Lazy::new(|| Regex::new(r#""stop"\s*:\s*"([^"]+)""#).unwrap());
    static RE_CLASSES_STOP: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#""classes"\s*:\s*"([^"]+)""#).unwrap());

    let mut stop_lines: Vec<String> = Vec::new();

    // Split on object boundaries — each element in the array
    // Split by `},{` to get individual stop objects
    let objects: Vec<&str> = stops_json
        .trim_start_matches('[')
        .trim_end_matches(']')
        .split("},")
        .collect();

    for obj in objects {
        let stop = RE_STOP
            .captures(obj)
            .map(|c| c[1].to_string())
            .unwrap_or_default();
        let classes = RE_CLASSES_STOP
            .captures(obj)
            .map(|c| c[1].to_string())
            .unwrap_or_default();

        if stop.is_empty() {
            continue;
        }

        let css = classes_to_css(&classes);
        if !css.is_empty() {
            stop_lines.push(format!("  {} {{ {} }}", stop, css));
        }
    }

    let keyframes_css = format!("@keyframes {} {{\n{}\n}}", anim_id, stop_lines.join("\n"));

    CompiledAnimation {
        class_name: anim_id.clone(),
        keyframes_css,
        animation_css: format!("animation-name: {}", anim_id),
    }
}

// ═════════════════════════════════════════════════════════════════════════════
