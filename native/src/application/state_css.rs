//! state_css.rs — Convert Tailwind utility classes → inline CSS declarations.
//!
//! Port of `TW_MAP` + `twClassesToCss()` dari `packages/domain/core/src/stateEngine.ts`.
//! Dipanggil oleh `injectStateStyles()` saat komponen dengan state pertama kali render.
//!
//! API:
//!   `tw_classes_to_css(classes: String) -> String`
//!   Returns semicolon-separated CSS declarations (e.g. `"display:none;opacity:0.5"`)

use napi_derive::napi;
use once_cell::sync::Lazy;
use std::collections::HashMap;

// ─────────────────────────────────────────────────────────────────────────────
// Static lookup map (mirrors JS TW_MAP)
// ─────────────────────────────────────────────────────────────────────────────

static TW_MAP: Lazy<HashMap<&'static str, &'static str>> = Lazy::new(|| {
    let mut m = HashMap::with_capacity(128);

    // Display
    m.insert("hidden", "display:none");
    m.insert("block", "display:block");
    m.insert("flex", "display:flex");
    m.insert("inline", "display:inline");
    m.insert("inline-flex", "display:inline-flex");
    m.insert("inline-block", "display:inline-block");
    m.insert("grid", "display:grid");
    m.insert("inline-grid", "display:inline-grid");
    m.insert("contents", "display:contents");
    m.insert("flow-root", "display:flow-root");

    // Opacity
    m.insert("opacity-0", "opacity:0");
    m.insert("opacity-5", "opacity:0.05");
    m.insert("opacity-10", "opacity:0.1");
    m.insert("opacity-20", "opacity:0.2");
    m.insert("opacity-25", "opacity:0.25");
    m.insert("opacity-30", "opacity:0.3");
    m.insert("opacity-40", "opacity:0.4");
    m.insert("opacity-50", "opacity:0.5");
    m.insert("opacity-60", "opacity:0.6");
    m.insert("opacity-70", "opacity:0.7");
    m.insert("opacity-75", "opacity:0.75");
    m.insert("opacity-80", "opacity:0.8");
    m.insert("opacity-90", "opacity:0.9");
    m.insert("opacity-95", "opacity:0.95");
    m.insert("opacity-100", "opacity:1");

    // Cursor
    m.insert("cursor-pointer", "cursor:pointer");
    m.insert("cursor-not-allowed", "cursor:not-allowed");
    m.insert("cursor-default", "cursor:default");
    m.insert("cursor-wait", "cursor:wait");
    m.insert("cursor-move", "cursor:move");
    m.insert("cursor-grab", "cursor:grab");
    m.insert("cursor-grabbing", "cursor:grabbing");
    m.insert("cursor-text", "cursor:text");
    m.insert("cursor-copy", "cursor:copy");
    m.insert("cursor-crosshair", "cursor:crosshair");
    m.insert("cursor-zoom-in", "cursor:zoom-in");
    m.insert("cursor-zoom-out", "cursor:zoom-out");

    // Pointer events
    m.insert("pointer-events-none", "pointer-events:none");
    m.insert("pointer-events-auto", "pointer-events:auto");

    // Scale
    m.insert("scale-0", "transform:scale(0)");
    m.insert("scale-50", "transform:scale(0.5)");
    m.insert("scale-75", "transform:scale(0.75)");
    m.insert("scale-90", "transform:scale(0.9)");
    m.insert("scale-95", "transform:scale(0.95)");
    m.insert("scale-100", "transform:scale(1)");
    m.insert("scale-105", "transform:scale(1.05)");
    m.insert("scale-110", "transform:scale(1.1)");
    m.insert("scale-125", "transform:scale(1.25)");
    m.insert("scale-150", "transform:scale(1.5)");

    // Translate
    m.insert("translate-x-0", "transform:translateX(0)");
    m.insert("translate-y-0", "transform:translateY(0)");
    m.insert("translate-x-px", "transform:translateX(1px)");
    m.insert("translate-y-px", "transform:translateY(1px)");
    m.insert("translate-x-1", "transform:translateX(0.25rem)");
    m.insert("translate-y-1", "transform:translateY(0.25rem)");
    m.insert("translate-x-2", "transform:translateX(0.5rem)");
    m.insert("translate-y-2", "transform:translateY(0.5rem)");
    m.insert("translate-x-4", "transform:translateX(1rem)");
    m.insert("translate-y-4", "transform:translateY(1rem)");
    m.insert("-translate-x-px", "transform:translateX(-1px)");
    m.insert("-translate-y-px", "transform:translateY(-1px)");
    m.insert("-translate-x-1", "transform:translateX(-0.25rem)");
    m.insert("-translate-y-1", "transform:translateY(-0.25rem)");
    m.insert("-translate-x-2", "transform:translateX(-0.5rem)");
    m.insert("-translate-y-2", "transform:translateY(-0.5rem)");
    m.insert("-translate-x-4", "transform:translateX(-1rem)");
    m.insert("-translate-y-4", "transform:translateY(-1rem)");
    m.insert("-translate-x-full", "transform:translateX(-100%)");
    m.insert("-translate-y-full", "transform:translateY(-100%)");
    m.insert("translate-x-full", "transform:translateX(100%)");
    m.insert("translate-y-full", "transform:translateY(100%)");

    // Rotate
    m.insert("rotate-0", "transform:rotate(0deg)");
    m.insert("rotate-1", "transform:rotate(1deg)");
    m.insert("rotate-2", "transform:rotate(2deg)");
    m.insert("rotate-3", "transform:rotate(3deg)");
    m.insert("rotate-6", "transform:rotate(6deg)");
    m.insert("rotate-12", "transform:rotate(12deg)");
    m.insert("rotate-45", "transform:rotate(45deg)");
    m.insert("rotate-90", "transform:rotate(90deg)");
    m.insert("rotate-180", "transform:rotate(180deg)");
    m.insert("-rotate-1", "transform:rotate(-1deg)");
    m.insert("-rotate-2", "transform:rotate(-2deg)");
    m.insert("-rotate-6", "transform:rotate(-6deg)");
    m.insert("-rotate-12", "transform:rotate(-12deg)");
    m.insert("-rotate-45", "transform:rotate(-45deg)");
    m.insert("-rotate-90", "transform:rotate(-90deg)");
    m.insert("-rotate-180", "transform:rotate(-180deg)");

    // Ring
    m.insert("ring", "box-shadow:0 0 0 3px rgba(59,130,246,0.5)");
    m.insert("ring-0", "box-shadow:0 0 0 0 rgba(59,130,246,0.5)");
    m.insert("ring-1", "box-shadow:0 0 0 1px rgba(59,130,246,0.5)");
    m.insert("ring-2", "box-shadow:0 0 0 2px rgba(59,130,246,0.5)");
    m.insert("ring-4", "box-shadow:0 0 0 4px rgba(59,130,246,0.5)");
    m.insert("ring-8", "box-shadow:0 0 0 8px rgba(59,130,246,0.5)");
    m.insert(
        "ring-inset",
        "box-shadow:inset 0 0 0 3px rgba(59,130,246,0.5)",
    );

    // Shadow
    m.insert("shadow-none", "box-shadow:none");
    m.insert("shadow-sm", "box-shadow:0 1px 2px 0 rgba(0,0,0,0.05)");
    m.insert(
        "shadow",
        "box-shadow:0 1px 3px 0 rgba(0,0,0,0.1),0 1px 2px -1px rgba(0,0,0,0.1)",
    );
    m.insert(
        "shadow-md",
        "box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)",
    );
    m.insert(
        "shadow-lg",
        "box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)",
    );
    m.insert(
        "shadow-xl",
        "box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 8px 10px -6px rgba(0,0,0,0.1)",
    );

    // Border
    m.insert("border", "border-width:1px");
    m.insert("border-0", "border-width:0px");
    m.insert("border-2", "border-width:2px");
    m.insert("border-4", "border-width:4px");
    m.insert("border-8", "border-width:8px");
    m.insert("border-transparent", "border-color:transparent");
    m.insert("border-none", "border-style:none");
    m.insert("border-solid", "border-style:solid");
    m.insert("border-dashed", "border-style:dashed");
    m.insert("border-dotted", "border-style:dotted");

    // Outline
    m.insert("outline", "outline:2px solid currentColor");
    m.insert(
        "outline-none",
        "outline:2px solid transparent;outline-offset:2px",
    );
    m.insert("outline-dashed", "outline-style:dashed");
    m.insert("outline-dotted", "outline-style:dotted");

    // Overflow
    m.insert("overflow-hidden", "overflow:hidden");
    m.insert("overflow-auto", "overflow:auto");
    m.insert("overflow-scroll", "overflow:scroll");
    m.insert("overflow-visible", "overflow:visible");
    m.insert("overflow-clip", "overflow:clip");
    m.insert("overflow-x-hidden", "overflow-x:hidden");
    m.insert("overflow-x-auto", "overflow-x:auto");
    m.insert("overflow-x-scroll", "overflow-x:scroll");
    m.insert("overflow-y-hidden", "overflow-y:hidden");
    m.insert("overflow-y-auto", "overflow-y:auto");
    m.insert("overflow-y-scroll", "overflow-y:scroll");

    // Text decoration
    m.insert("underline", "text-decoration-line:underline");
    m.insert("no-underline", "text-decoration-line:none");
    m.insert("line-through", "text-decoration-line:line-through");
    m.insert("overline", "text-decoration-line:overline");

    // Font weight
    m.insert("font-thin", "font-weight:100");
    m.insert("font-extralight", "font-weight:200");
    m.insert("font-light", "font-weight:300");
    m.insert("font-normal", "font-weight:400");
    m.insert("font-medium", "font-weight:500");
    m.insert("font-semibold", "font-weight:600");
    m.insert("font-bold", "font-weight:700");
    m.insert("font-extrabold", "font-weight:800");
    m.insert("font-black", "font-weight:900");

    // Font style
    m.insert("italic", "font-style:italic");
    m.insert("not-italic", "font-style:normal");

    // Text align
    m.insert("text-left", "text-align:left");
    m.insert("text-center", "text-align:center");
    m.insert("text-right", "text-align:right");
    m.insert("text-justify", "text-align:justify");

    // Visibility
    m.insert("visible", "visibility:visible");
    m.insert("invisible", "visibility:hidden");

    // User select
    m.insert("select-none", "user-select:none");
    m.insert("select-text", "user-select:text");
    m.insert("select-all", "user-select:all");
    m.insert("select-auto", "user-select:auto");

    // Truncate / whitespace
    m.insert(
        "truncate",
        "overflow:hidden;text-overflow:ellipsis;white-space:nowrap",
    );
    m.insert("whitespace-nowrap", "white-space:nowrap");
    m.insert("whitespace-normal", "white-space:normal");
    m.insert("whitespace-pre", "white-space:pre");
    m.insert("whitespace-pre-wrap", "white-space:pre-wrap");

    // Background colors (common)
    m.insert("bg-transparent", "background-color:transparent");
    m.insert("bg-white", "background-color:#fff");
    m.insert("bg-black", "background-color:#000");
    m.insert("bg-current", "background-color:currentColor");
    m.insert("bg-blue-500", "background-color:rgb(59,130,246)");
    m.insert("bg-blue-600", "background-color:rgb(37,99,235)");
    m.insert("bg-blue-700", "background-color:rgb(29,78,216)");
    m.insert("bg-red-500", "background-color:rgb(239,68,68)");
    m.insert("bg-red-600", "background-color:rgb(220,38,38)");
    m.insert("bg-green-500", "background-color:rgb(34,197,94)");
    m.insert("bg-green-600", "background-color:rgb(22,163,74)");
    m.insert("bg-yellow-500", "background-color:rgb(234,179,8)");
    m.insert("bg-orange-500", "background-color:rgb(249,115,22)");
    m.insert("bg-purple-500", "background-color:rgb(168,85,247)");
    m.insert("bg-pink-500", "background-color:rgb(236,72,153)");
    m.insert("bg-zinc-900", "background-color:rgb(24,24,27)");
    m.insert("bg-zinc-800", "background-color:rgb(39,39,42)");
    m.insert("bg-zinc-700", "background-color:rgb(63,63,70)");
    m.insert("bg-zinc-600", "background-color:rgb(82,82,91)");
    m.insert("bg-zinc-500", "background-color:rgb(113,113,122)");
    m.insert("bg-zinc-100", "background-color:rgb(244,244,245)");
    m.insert("bg-zinc-50", "background-color:rgb(250,250,250)");
    m.insert("bg-gray-900", "background-color:rgb(17,24,39)");
    m.insert("bg-gray-800", "background-color:rgb(31,41,55)");
    m.insert("bg-gray-700", "background-color:rgb(55,65,81)");
    m.insert("bg-gray-100", "background-color:rgb(243,244,246)");
    m.insert("bg-gray-50", "background-color:rgb(249,250,251)");
    m.insert("bg-slate-900", "background-color:rgb(15,23,42)");

    // Text colors
    m.insert("text-white", "color:#fff");
    m.insert("text-black", "color:#000");
    m.insert("text-current", "color:currentColor");
    m.insert("text-transparent", "color:transparent");
    m.insert("text-blue-500", "color:rgb(59,130,246)");
    m.insert("text-blue-600", "color:rgb(37,99,235)");
    m.insert("text-red-500", "color:rgb(239,68,68)");
    m.insert("text-red-600", "color:rgb(220,38,38)");
    m.insert("text-green-500", "color:rgb(34,197,94)");
    m.insert("text-yellow-500", "color:rgb(234,179,8)");
    m.insert("text-purple-500", "color:rgb(168,85,247)");
    m.insert("text-zinc-400", "color:rgb(161,161,170)");
    m.insert("text-zinc-500", "color:rgb(113,113,122)");
    m.insert("text-zinc-600", "color:rgb(82,82,91)");
    m.insert("text-zinc-900", "color:rgb(24,24,27)");
    m.insert("text-gray-400", "color:rgb(156,163,175)");
    m.insert("text-gray-500", "color:rgb(107,114,128)");
    m.insert("text-gray-600", "color:rgb(75,85,99)");
    m.insert("text-gray-900", "color:rgb(17,24,39)");

    m
});

// ─────────────────────────────────────────────────────────────────────────────
// Arbitrary value handlers
// ─────────────────────────────────────────────────────────────────────────────

/// Extract content inside `[…]` from a class like `bg-[#f00]` → `"#f00"`.
fn extract_arbitrary(cls: &str) -> Option<&str> {
    let start = cls.find('[')?;
    let end = cls.rfind(']')?;
    if end > start {
        Some(&cls[start + 1..end])
    } else {
        None
    }
}

fn arbitrary_to_css(cls: &str) -> Option<String> {
    let val = extract_arbitrary(cls)?;
    if cls.starts_with("bg-[") {
        return Some(format!("background-color:{val}"));
    }
    if cls.starts_with("text-[") {
        return Some(format!("color:{val}"));
    }
    if cls.starts_with("w-[") {
        return Some(format!("width:{val}"));
    }
    if cls.starts_with("h-[") {
        return Some(format!("height:{val}"));
    }
    if cls.starts_with("min-w-[") {
        return Some(format!("min-width:{val}"));
    }
    if cls.starts_with("max-w-[") {
        return Some(format!("max-width:{val}"));
    }
    if cls.starts_with("min-h-[") {
        return Some(format!("min-height:{val}"));
    }
    if cls.starts_with("max-h-[") {
        return Some(format!("max-height:{val}"));
    }
    if cls.starts_with("opacity-[") {
        return Some(format!("opacity:{val}"));
    }
    if cls.starts_with("p-[") {
        return Some(format!("padding:{val}"));
    }
    if cls.starts_with("m-[") {
        return Some(format!("margin:{val}"));
    }
    if cls.starts_with("top-[") {
        return Some(format!("top:{val}"));
    }
    if cls.starts_with("right-[") {
        return Some(format!("right:{val}"));
    }
    if cls.starts_with("bottom-[") {
        return Some(format!("bottom:{val}"));
    }
    if cls.starts_with("left-[") {
        return Some(format!("left:{val}"));
    }
    if cls.starts_with("z-[") {
        return Some(format!("z-index:{val}"));
    }
    if cls.starts_with("rotate-[") {
        return Some(format!("transform:rotate({val})"));
    }
    if cls.starts_with("translate-x-[") {
        return Some(format!("transform:translateX({val})"));
    }
    if cls.starts_with("translate-y-[") {
        return Some(format!("transform:translateY({val})"));
    }
    if cls.starts_with("scale-[") {
        return Some(format!("transform:scale({val})"));
    }
    if cls.starts_with("duration-[") {
        return Some(format!("transition-duration:{val}"));
    }
    if cls.starts_with("delay-[") {
        return Some(format!("transition-delay:{val}"));
    }
    None
}

// ─────────────────────────────────────────────────────────────────────────────
// Core logic
// ─────────────────────────────────────────────────────────────────────────────

fn classes_to_css_inner(classes: &str) -> String {
    let mut decls: Vec<String> = Vec::new();

    for cls in classes.split_whitespace() {
        if let Some(css) = TW_MAP.get(cls) {
            decls.push((*css).to_string());
        } else if cls.contains('[') && cls.contains(']') {
            if let Some(css) = arbitrary_to_css(cls) {
                decls.push(css);
            }
        }
        // Unknown classes are silently skipped (same as JS behavior)
    }

    decls.join(";")
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI export
// ─────────────────────────────────────────────────────────────────────────────

/// Convert Tailwind utility classes → semicolon-separated inline CSS declarations.
///
/// Mirrors `twClassesToCss()` from `stateEngine.ts`.
/// Handles static lookup (TW_MAP) and common arbitrary values `[…]`.
///
/// ```
/// tw_classes_to_css("hidden opacity-50")      // "display:none;opacity:0.5"
/// tw_classes_to_css("bg-[#f00] w-[200px]")   // "background-color:#f00;width:200px"
/// tw_classes_to_css("unknown-class")           // ""
/// ```
#[napi]
pub fn tw_classes_to_css(classes: String) -> String {
    classes_to_css_inner(&classes)
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn css(s: &str) -> String {
        classes_to_css_inner(s)
    }

    #[test]
    fn test_display() {
        assert_eq!(css("hidden"), "display:none");
        assert_eq!(css("flex"), "display:flex");
    }

    #[test]
    fn test_multiple() {
        assert_eq!(css("hidden opacity-50"), "display:none;opacity:0.5");
    }

    #[test]
    fn test_arbitrary_bg() {
        assert_eq!(css("bg-[#f00]"), "background-color:#f00");
        assert_eq!(
            css("bg-[rgba(0,0,0,0.5)]"),
            "background-color:rgba(0,0,0,0.5)"
        );
    }

    #[test]
    fn test_arbitrary_size() {
        assert_eq!(css("w-[200px]"), "width:200px");
        assert_eq!(css("h-[50vh]"), "height:50vh");
    }

    #[test]
    fn test_unknown_skipped() {
        assert_eq!(css("p-4 unknown-class m-2"), "");
        // p-4, m-2 are NOT in TW_MAP (only arbitrary values handled for spacing)
        assert_eq!(css("hidden unknown-class"), "display:none");
    }

    #[test]
    fn test_empty() {
        assert_eq!(css(""), "");
        assert_eq!(css("   "), "");
    }
}
