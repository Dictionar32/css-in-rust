//! tw_merge — conflict-aware Tailwind class merger (Rust port of tailwind-merge).
//!
//! Algorithm:
//!   1. Split input into individual class tokens.
//!   2. For each token, parse variant prefix (e.g. `hover:`, `dark:md:`) + base class.
//!   3. Determine the *conflict group* of the base class (e.g. `bg-red-500` → `bg`).
//!   4. Group key = `"{variants}::{conflict_group}"`.
//!   5. Iterate left-to-right; last class for a group key wins (earlier one is evicted).
//!   6. Re-join surviving classes in original order.
//!
//! This matches tailwind-merge's "last wins" semantic.

use napi_derive::napi;
use std::collections::HashMap;
use smallvec::SmallVec;
use crate::tws_debug;

// ─────────────────────────────────────────────────────────────────────────────
// Conflict group resolution
// ─────────────────────────────────────────────────────────────────────────────

/// Known text-size suffixes (Tailwind v3 + v4).
const TEXT_SIZE_SUFFIXES: &[&str] = &[
    "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
];

fn is_text_size(suffix: &str) -> bool {
    // exact keyword match
    if TEXT_SIZE_SUFFIXES.contains(&suffix) {
        return true;
    }
    // arbitrary size value: text-[1.25rem]
    if suffix.starts_with('[') {
        return true;
    }
    false
}

/// Return the conflict group for a base Tailwind class (without variant prefix).
/// Returns `None` for classes that never conflict (e.g. `sr-only`, `not-sr-only`).
fn conflict_group(base: &str) -> Option<String> {
    // ── Arbitrary value — use everything before `[` as group ──────────────
    if let Some(bracket) = base.find('[') {
        let prefix = base[..bracket].trim_end_matches('-');
        if !prefix.is_empty() {
            return Some(prefix.to_string());
        }
        return Some("arbitrary".to_string());
    }

    // ── Display utilities ──────────────────────────────────────────────────
    let display_values = [
        "block",
        "inline-block",
        "inline",
        "flex",
        "inline-flex",
        "grid",
        "inline-grid",
        "table",
        "inline-table",
        "table-row",
        "table-cell",
        "table-column",
        "table-caption",
        "contents",
        "list-item",
        "hidden",
        "flow-root",
    ];
    if display_values.contains(&base) {
        return Some("display".to_string());
    }

    // ── Position ───────────────────────────────────────────────────────────
    if ["static", "relative", "absolute", "fixed", "sticky"].contains(&base) {
        return Some("position".to_string());
    }

    // ── Overflow ───────────────────────────────────────────────────────────
    if base.starts_with("overflow-x-") {
        return Some("overflow-x".to_string());
    }
    if base.starts_with("overflow-y-") {
        return Some("overflow-y".to_string());
    }
    if base.starts_with("overflow-") {
        return Some("overflow".to_string());
    }

    // ── Flex / Grid direction ──────────────────────────────────────────────
    if base.starts_with("flex-") {
        // flex-row, flex-col, flex-1, flex-auto, flex-none, flex-grow* — all conflict
        return Some("flex".to_string());
    }
    if base.starts_with("grid-cols-") {
        return Some("grid-cols".to_string());
    }
    if base.starts_with("grid-rows-") {
        return Some("grid-rows".to_string());
    }
    if base.starts_with("grid-flow-") {
        return Some("grid-flow".to_string());
    }
    if base.starts_with("col-") {
        return Some("col".to_string());
    }
    if base.starts_with("row-") {
        return Some("row".to_string());
    }
    if base == "grow" || base.starts_with("grow-") {
        return Some("grow".to_string());
    }
    if base == "shrink" || base.starts_with("shrink-") {
        return Some("shrink".to_string());
    }

    // ── Gap ───────────────────────────────────────────────────────────────
    if base.starts_with("gap-x-") {
        return Some("gap-x".to_string());
    }
    if base.starts_with("gap-y-") {
        return Some("gap-y".to_string());
    }
    if base.starts_with("gap-") {
        return Some("gap".to_string());
    }

    // ── Justify / Align / Place ────────────────────────────────────────────
    if base.starts_with("justify-items-") {
        return Some("justify-items".to_string());
    }
    if base.starts_with("justify-self-") {
        return Some("justify-self".to_string());
    }
    if base.starts_with("justify-") {
        return Some("justify".to_string());
    }
    if base.starts_with("items-") {
        return Some("items".to_string());
    }
    if base.starts_with("self-") {
        return Some("self".to_string());
    }
    if base.starts_with("place-content-") {
        return Some("place-content".to_string());
    }
    if base.starts_with("place-items-") {
        return Some("place-items".to_string());
    }
    if base.starts_with("place-self-") {
        return Some("place-self".to_string());
    }
    if base.starts_with("content-") {
        return Some("content".to_string());
    }

    // ── Spacing (padding) ─────────────────────────────────────────────────
    if base.starts_with("px-") {
        return Some("px".to_string());
    }
    if base.starts_with("py-") {
        return Some("py".to_string());
    }
    if base.starts_with("pt-") {
        return Some("pt".to_string());
    }
    if base.starts_with("pr-") {
        return Some("pr".to_string());
    }
    if base.starts_with("pb-") {
        return Some("pb".to_string());
    }
    if base.starts_with("pl-") {
        return Some("pl".to_string());
    }
    if base.starts_with("ps-") {
        return Some("ps".to_string());
    }
    if base.starts_with("pe-") {
        return Some("pe".to_string());
    }
    if base.starts_with("p-") {
        return Some("p".to_string());
    }

    // ── Spacing (margin) ──────────────────────────────────────────────────
    if base.starts_with("mx-") {
        return Some("mx".to_string());
    }
    if base.starts_with("my-") {
        return Some("my".to_string());
    }
    if base.starts_with("mt-") {
        return Some("mt".to_string());
    }
    if base.starts_with("mr-") {
        return Some("mr".to_string());
    }
    if base.starts_with("mb-") {
        return Some("mb".to_string());
    }
    if base.starts_with("ml-") {
        return Some("ml".to_string());
    }
    if base.starts_with("ms-") {
        return Some("ms".to_string());
    }
    if base.starts_with("me-") {
        return Some("me".to_string());
    }
    if base == "-m" || base.starts_with("m-") || base.starts_with("-m-") {
        return Some("m".to_string());
    }

    // ── Space between ─────────────────────────────────────────────────────
    if base.starts_with("space-x-") {
        return Some("space-x".to_string());
    }
    if base.starts_with("space-y-") {
        return Some("space-y".to_string());
    }

    // ── Size / Width / Height ─────────────────────────────────────────────
    if base.starts_with("size-") {
        return Some("size".to_string());
    }
    if base.starts_with("min-w-") {
        return Some("min-w".to_string());
    }
    if base.starts_with("max-w-") {
        return Some("max-w".to_string());
    }
    if base.starts_with("w-") {
        return Some("w".to_string());
    }
    if base.starts_with("min-h-") {
        return Some("min-h".to_string());
    }
    if base.starts_with("max-h-") {
        return Some("max-h".to_string());
    }
    if base.starts_with("h-") {
        return Some("h".to_string());
    }

    // ── Inset / Positioning ───────────────────────────────────────────────
    if base.starts_with("inset-x-") {
        return Some("inset-x".to_string());
    }
    if base.starts_with("inset-y-") {
        return Some("inset-y".to_string());
    }
    if base.starts_with("inset-") {
        return Some("inset".to_string());
    }
    if base.starts_with("top-") {
        return Some("top".to_string());
    }
    if base.starts_with("right-") || base.starts_with("end-") {
        return Some("right".to_string());
    }
    if base.starts_with("bottom-") {
        return Some("bottom".to_string());
    }
    if base.starts_with("left-") || base.starts_with("start-") {
        return Some("left".to_string());
    }

    // ── Z-index ───────────────────────────────────────────────────────────
    if base.starts_with("z-") {
        return Some("z".to_string());
    }

    // ── Opacity ───────────────────────────────────────────────────────────
    if base.starts_with("opacity-") {
        return Some("opacity".to_string());
    }

    // ── Background ────────────────────────────────────────────────────────
    if base.starts_with("bg-") {
        // bg-opacity-* is a separate group
        if base.starts_with("bg-opacity-") {
            return Some("bg-opacity".to_string());
        }
        return Some("bg".to_string());
    }
    if base.starts_with("from-") {
        return Some("from".to_string());
    }
    if base.starts_with("via-") {
        return Some("via".to_string());
    }
    if base.starts_with("to-") {
        return Some("to".to_string());
    }

    // ── Text ──────────────────────────────────────────────────────────────
    if let Some(suffix) = base.strip_prefix("text-") {
        if is_text_size(suffix) {
            return Some("text-size".to_string());
        }
        // text-opacity
        if suffix.starts_with("opacity-") {
            return Some("text-opacity".to_string());
        }
        // everything else (color, alignment, decoration…) → separate group per suffix prefix
        // text-left/center/right/justify → align
        if ["left", "center", "right", "justify", "start", "end"].contains(&suffix) {
            return Some("text-align".to_string());
        }
        return Some("text-color".to_string());
    }

    // ── Font ──────────────────────────────────────────────────────────────
    if let Some(suffix) = base.strip_prefix("font-") {
        // font-bold, font-semibold, etc. → weight
        let weight_names = [
            "thin",
            "extralight",
            "light",
            "normal",
            "medium",
            "semibold",
            "bold",
            "extrabold",
            "black",
        ];
        if weight_names.contains(&suffix) || suffix.chars().all(|c| c.is_ascii_digit()) {
            return Some("font-weight".to_string());
        }
        return Some("font-family".to_string());
    }

    // ── Leading (line-height) ─────────────────────────────────────────────
    if base.starts_with("leading-") {
        return Some("leading".to_string());
    }

    // ── Tracking (letter-spacing) ─────────────────────────────────────────
    if base.starts_with("tracking-") {
        return Some("tracking".to_string());
    }

    // ── Border ────────────────────────────────────────────────────────────
    if let Some(suffix) = base.strip_prefix("border-") {
        // border-t, border-r, border-b, border-l, border-x, border-y, border-s, border-e + width
        let side_prefixes = ["t-", "r-", "b-", "l-", "x-", "y-", "s-", "e-"];
        if side_prefixes.iter().any(|p| suffix.starts_with(p)) {
            let side = &suffix[..1];
            // if rest is numeric/size, it's width; if color name, it's color
            let rest = &suffix[2..];
            if rest.parse::<u32>().is_ok() || rest.is_empty() {
                return Some(format!("border-{}-width", side));
            }
            return Some(format!("border-{}-color", side));
        }
        // bare "border-0 border-2 border-4…" → width
        if suffix.parse::<u32>().is_ok() || suffix.is_empty() {
            return Some("border-width".to_string());
        }
        // border-opacity
        if suffix.starts_with("opacity-") {
            return Some("border-opacity".to_string());
        }
        // border-collapse, border-separate → collapse
        if ["collapse", "separate"].contains(&suffix) {
            return Some("border-collapse".to_string());
        }
        // border-solid, border-dashed, border-dotted → style
        if ["solid", "dashed", "dotted", "double", "hidden", "none"].contains(&suffix) {
            return Some("border-style".to_string());
        }
        return Some("border-color".to_string());
    }

    // bare `border` → border-width group
    if base == "border" {
        return Some("border-width".to_string());
    }

    // ── Outline ───────────────────────────────────────────────────────────
    if base.starts_with("outline-") {
        return Some("outline".to_string());
    }
    if base == "outline" {
        return Some("outline".to_string());
    }

    // ── Rounded ───────────────────────────────────────────────────────────
    if base.starts_with("rounded-t") || base.starts_with("rounded-r")
        || base.starts_with("rounded-b") || base.starts_with("rounded-l")
        || base.starts_with("rounded-s") || base.starts_with("rounded-e")
        || base.starts_with("rounded-tl") || base.starts_with("rounded-tr")
        || base.starts_with("rounded-br") || base.starts_with("rounded-bl")
    {
        return Some(format!("rounded-{}", &base["rounded-".len()..].chars().next().unwrap_or('x')));
    }
    if base == "rounded" || base.starts_with("rounded-") {
        return Some("rounded".to_string());
    }

    // ── Shadow ────────────────────────────────────────────────────────────
    if base == "shadow" || base.starts_with("shadow-") {
        return Some("shadow".to_string());
    }

    // ── Ring ──────────────────────────────────────────────────────────────
    if base.starts_with("ring-offset-") {
        return Some("ring-offset".to_string());
    }
    if base == "ring" || base.starts_with("ring-") {
        return Some("ring".to_string());
    }

    // ── Transform utilities ───────────────────────────────────────────────
    if base.starts_with("rotate-") {
        return Some("rotate".to_string());
    }
    if base.starts_with("scale-x-") {
        return Some("scale-x".to_string());
    }
    if base.starts_with("scale-y-") {
        return Some("scale-y".to_string());
    }
    if base.starts_with("scale-") {
        return Some("scale".to_string());
    }
    if base.starts_with("translate-x-") {
        return Some("translate-x".to_string());
    }
    if base.starts_with("translate-y-") {
        return Some("translate-y".to_string());
    }
    if base.starts_with("skew-x-") {
        return Some("skew-x".to_string());
    }
    if base.starts_with("skew-y-") {
        return Some("skew-y".to_string());
    }

    // ── Transition ────────────────────────────────────────────────────────
    if base == "transition" || base.starts_with("transition-") {
        return Some("transition".to_string());
    }
    if base.starts_with("duration-") {
        return Some("duration".to_string());
    }
    if base.starts_with("ease-") {
        return Some("ease".to_string());
    }
    if base.starts_with("delay-") {
        return Some("delay".to_string());
    }

    // ── Animation ─────────────────────────────────────────────────────────
    if base == "animate" || base.starts_with("animate-") {
        return Some("animate".to_string());
    }

    // ── Cursor ────────────────────────────────────────────────────────────
    if base.starts_with("cursor-") {
        return Some("cursor".to_string());
    }

    // ── Pointer events ────────────────────────────────────────────────────
    if base.starts_with("pointer-events-") {
        return Some("pointer-events".to_string());
    }

    // ── Select ────────────────────────────────────────────────────────────
    if base.starts_with("select-") {
        return Some("select".to_string());
    }

    // ── Visibility ────────────────────────────────────────────────────────
    if base == "visible" || base == "invisible" || base == "collapse" {
        return Some("visibility".to_string());
    }

    // ── Object fit / position ─────────────────────────────────────────────
    if base.starts_with("object-") {
        return Some("object".to_string());
    }

    // ── Aspect ratio ─────────────────────────────────────────────────────
    if base.starts_with("aspect-") {
        return Some("aspect".to_string());
    }

    // ── Order ─────────────────────────────────────────────────────────────
    if base.starts_with("order-") {
        return Some("order".to_string());
    }

    // ── Whitespace ────────────────────────────────────────────────────────
    if base.starts_with("whitespace-") {
        return Some("whitespace".to_string());
    }

    // ── List style ────────────────────────────────────────────────────────
    if base.starts_with("list-") {
        return Some("list".to_string());
    }

    // ── Fill / Stroke ─────────────────────────────────────────────────────
    if base.starts_with("fill-") {
        return Some("fill".to_string());
    }
    if base.starts_with("stroke-") {
        return Some("stroke".to_string());
    }

    // ── Backdrop ──────────────────────────────────────────────────────────
    if let Some(rest) = base.strip_prefix("backdrop-") {
        return Some(format!("backdrop-{}", rest.split('-').next().unwrap_or("x")));
    }

    // ── Scroll ────────────────────────────────────────────────────────────
    if base.starts_with("scroll-") {
        return Some("scroll".to_string());
    }
    if base.starts_with("snap-") {
        return Some("snap".to_string());
    }

    // ── Touch ─────────────────────────────────────────────────────────────
    if base.starts_with("touch-") {
        return Some("touch".to_string());
    }

    // ── Decoration ────────────────────────────────────────────────────────
    if base.starts_with("decoration-") {
        return Some("text-decoration".to_string());
    }

    // ── Caret ─────────────────────────────────────────────────────────────
    if base.starts_with("caret-") {
        return Some("caret".to_string());
    }

    // ── Accent ────────────────────────────────────────────────────────────
    if base.starts_with("accent-") {
        return Some("accent".to_string());
    }

    // ── Appearance ────────────────────────────────────────────────────────
    if base.starts_with("appearance-") {
        return Some("appearance".to_string());
    }

    // ── Isolate ───────────────────────────────────────────────────────────
    if base == "isolate" || base == "isolation-auto" {
        return Some("isolation".to_string());
    }

    // ── Mix blend / Background blend ──────────────────────────────────────
    if base.starts_with("mix-blend-") {
        return Some("mix-blend".to_string());
    }
    if base.starts_with("bg-blend-") {
        return Some("bg-blend".to_string());
    }

    // ── Float / Clear ─────────────────────────────────────────────────────
    if base.starts_with("float-") {
        return Some("float".to_string());
    }
    if base.starts_with("clear-") {
        return Some("clear".to_string());
    }

    // ── Break ─────────────────────────────────────────────────────────────
    if base.starts_with("break-") {
        return Some("break".to_string());
    }

    // ── Columns ───────────────────────────────────────────────────────────
    if base.starts_with("columns-") {
        return Some("columns".to_string());
    }

    // Default: no known conflict group → class is kept as-is
    None
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse variant prefix from a class token
// ─────────────────────────────────────────────────────────────────────────────

/// Splits `hover:dark:bg-red-500` into (`"hover:dark:"`, `"bg-red-500"`).
pub(crate) fn split_variants(class: &str) -> (&str, &str) {
    // Walk from the right to find the last `:` that isn't inside `[…]`
    let bytes = class.as_bytes();
    let mut depth = 0_usize;
    let mut last_colon = 0_usize;
    for (i, &b) in bytes.iter().enumerate() {
        match b {
            b'[' => depth += 1,
            b']' => depth = depth.saturating_sub(1),
            b':' if depth == 0 => last_colon = i + 1, // position after the colon
            _ => {}
        }
    }
    if last_colon == 0 {
        ("", class)
    } else {
        (&class[..last_colon], &class[last_colon..])
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core merge logic
// ─────────────────────────────────────────────────────────────────────────────

pub fn merge_class_string(input: &str) -> String {
    let tokens: SmallVec<[&str; 8]> = input.split_whitespace().collect();
    if tokens.is_empty() {
        return String::new();
    }
    if tokens.len() == 1 {
        return tokens[0].to_string();
    }

    let mut group_owner: HashMap<String, usize> = HashMap::with_capacity(tokens.len());
    let mut slots: SmallVec<[Option<&str>; 8]> = SmallVec::with_capacity(tokens.len());

    for token in &tokens {
        let (variants, base) = split_variants(token);
        if let Some(group) = conflict_group(base) {
            let key = format!("{}::{}", variants, group);
            if let Some(&prev_idx) = group_owner.get(&key) {
                slots[prev_idx] = None;
            }
            let new_idx = slots.len();
            group_owner.insert(key, new_idx);
            slots.push(Some(token));
        } else {
            slots.push(Some(token));
        }
    }

    slots.iter().filter_map(|&s| s).collect::<SmallVec<[&str; 8]>>().join(" ")
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI exports
// ─────────────────────────────────────────────────────────────────────────────

/// Conflict-aware Tailwind class merger.
///
/// Equivalent to `twMerge()` from the `tailwind-merge` JS package.
/// Later classes win; conflicting utilities in the same group are deduplicated.
///
/// ```
/// tw_merge("p-4 p-8")          // → "p-8"
/// tw_merge("bg-red-500 bg-blue-500")  // → "bg-blue-500"
/// tw_merge("hover:p-4 hover:p-8")     // → "hover:p-8"
/// tw_merge("p-4 hover:p-8")           // → "p-4 hover:p-8"  (different variant, no conflict)
/// ```
#[napi]
pub fn tw_merge(class_string: String) -> String {
    tws_debug!("[tw_merge] input: {:?}", class_string);
    merge_class_string(&class_string)
}

/// Merge multiple class strings (variadic convenience wrapper).
/// Joins all inputs with a space, then resolves conflicts.
#[napi]
pub fn tw_merge_many(class_strings: Vec<String>) -> String {
    let joined = class_strings
        .iter()
        .filter(|s| !s.is_empty())
        .map(|s| s.as_str())
        .collect::<Vec<_>>()
        .join(" ");
    merge_class_string(&joined)
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn m(s: &str) -> String {
        merge_class_string(s)
    }

    #[test]
    fn test_no_conflict() {
        assert_eq!(m("p-4 m-4"), "p-4 m-4");
    }

    #[test]
    fn test_padding_conflict() {
        assert_eq!(m("p-4 p-8"), "p-8");
    }

    #[test]
    fn test_bg_conflict() {
        assert_eq!(m("bg-red-500 bg-blue-500"), "bg-blue-500");
    }

    #[test]
    fn test_text_size_vs_color() {
        // text-lg (size) and text-red-500 (color) should NOT conflict
        assert_eq!(m("text-lg text-red-500"), "text-lg text-red-500");
        // two text sizes conflict
        assert_eq!(m("text-sm text-lg"), "text-lg");
        // two text colors conflict
        assert_eq!(m("text-red-500 text-blue-500"), "text-blue-500");
    }

    #[test]
    fn test_variant_isolation() {
        // different variant contexts → no conflict
        assert_eq!(m("p-4 hover:p-8"), "p-4 hover:p-8");
        // same variant → conflict
        assert_eq!(m("hover:p-4 hover:p-8"), "hover:p-8");
    }

    #[test]
    fn test_display_conflict() {
        assert_eq!(m("flex block"), "block");
    }

    #[test]
    fn test_width_conflict() {
        assert_eq!(m("w-4 w-8 w-full"), "w-full");
    }

    #[test]
    fn test_arbitrary_value() {
        assert_eq!(m("p-4 p-[1.5rem]"), "p-[1.5rem]");
    }

    #[test]
    fn test_preserve_order_no_conflict() {
        assert_eq!(m("sr-only not-sr-only"), "sr-only not-sr-only");
    }

    #[test]
    fn test_empty() {
        assert_eq!(m(""), "");
        assert_eq!(m("   "), "");
    }

    #[test]
    fn test_responsive_variants() {
        assert_eq!(m("md:p-4 md:p-8"), "md:p-8");
        assert_eq!(m("sm:text-sm lg:text-lg"), "sm:text-sm lg:text-lg");
    }

    #[test]
    fn test_compound_variants() {
        assert_eq!(m("dark:hover:bg-red-500 dark:hover:bg-blue-500"), "dark:hover:bg-blue-500");
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// build_dependency_chain — variant prefix chain builder
// Mirrors the JS: className.split(":").slice(0,-1).map((_, i, parts) => parts.slice(0,i+1).join(":"))
// ─────────────────────────────────────────────────────────────────────────────

/// Build the variant dependency chain for a Tailwind class.
///
/// `"md:hover:bg-red-500"` → `["md:", "md:hover:"]`
/// `"bg-red-500"`          → `[]`  (no variant prefix)
///
/// One-pass, zero regex, O(n) where n = number of variant segments.
#[napi]
pub fn build_dependency_chain(class_name: String) -> Vec<String> {
    // Walk the string collecting colon positions that are NOT inside [...] brackets
    let bytes = class_name.as_bytes();
    let mut colon_positions: Vec<usize> = Vec::new();
    let mut depth: usize = 0;

    for (i, &b) in bytes.iter().enumerate() {
        match b {
            b'[' => depth += 1,
            b']' => depth = depth.saturating_sub(1),
            b':' if depth == 0 => colon_positions.push(i),
            _ => {}
        }
    }

    if colon_positions.is_empty() {
        return vec![];
    }

    // The last colon separates the final variant from the base class.
    // We want all prefixes *before* the base class, i.e. colon_positions[..last].
    let prefix_colons = &colon_positions[..colon_positions.len() - 1];

    // Build cumulative prefix strings: up to each colon (inclusive)
    prefix_colons
        .iter()
        .enumerate()
        .map(|(i, &end_pos)| {
            let _ = i;
            class_name[..=end_pos].to_string()
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// parse_subcomponent_blocks — NAPI wrapper
// Wraps the pub(crate) impl in transform_components.rs
// ─────────────────────────────────────────────────────────────────────────────

/// Parse sub-component blocks from a tw`` template string.
///
/// Input:  `"flex gap-2 [icon] { w-4 h-4 } [label] { text-sm font-medium }"`
/// Output: JSON object string `{"icon":"w-4 h-4","label":"text-sm font-medium"}`
///
/// Returns both the base classes (blocks stripped) and sub-component map.
#[napi(object)]
pub struct SubcomponentParseResult {
    /// Base classes with all block syntax stripped
    pub base_classes: String,
    /// JSON string: Record<name, classes>
    pub sub_map_json: String,
}

#[napi]
pub fn parse_subcomponent_blocks_napi(
    template: String,
    component_name: String,
) -> SubcomponentParseResult {
    use crate::domain::transform_components::parse_subcomponent_blocks;

    let (base, subs) = parse_subcomponent_blocks(&template, &component_name);

    // Build { name: classes } map as JSON
    let mut entries: Vec<String> = subs
        .iter()
        .map(|s| {
            format!(
                "\"{}\":\"{}\"",
                s.name.replace('"', "\\\""),
                s.classes.replace('"', "\\\"")
            )
        })
        .collect();
    entries.sort(); // deterministic output
    let sub_map_json = format!("{{{}}}", entries.join(","));

    SubcomponentParseResult {
        base_classes: base.split_whitespace().collect::<Vec<_>>().join(" "),
        sub_map_json,
    }
}
// ─────────────────────────────────────────────────────────────────────────────
// tw_merge_with_separator — Batch G feature
// ─────────────────────────────────────────────────────────────────────────────

/// Options untuk tw_merge_with_separator
#[napi(object)]
pub struct TwMergeOptions {
    /// Separator antar class (default: " ")
    pub separator: Option<String>,
    /// Aktifkan debug logging (override TWS_DEBUG env)
    pub debug: Option<bool>,
}

/// tw_merge dengan custom separator.
///
/// ```ts
/// twMergeWithSeparator("p-4 p-8", { separator: "\n" })
/// // → "p-8"  (output dipisah newline, tapi conflict resolution tetap jalan)
///
/// twMergeWithSeparator("p-4 flex", { separator: " | " })
/// // → "p-4 | flex"
/// ```
#[napi]
pub fn tw_merge_with_separator(class_string: String, opts: TwMergeOptions) -> String {
    let sep = opts.separator.as_deref().unwrap_or(" ");
    let debug = opts.debug.unwrap_or(false);

    if debug || crate::debug::is_enabled() {
        eprintln!("[tw_merge_with_separator] input={:?} sep={:?}", class_string, sep);
    }

    // Conflict resolution tetap pakai spasi sebagai internal separator
    let resolved = merge_class_string(&class_string);

    // Ganti output separator jika bukan spasi
    if sep == " " {
        resolved
    } else {
        resolved.split_whitespace().collect::<Vec<_>>().join(sep)
    }
}

/// tw_merge_many dengan custom separator.
#[napi]
pub fn tw_merge_many_with_separator(class_strings: Vec<String>, opts: TwMergeOptions) -> String {
    let sep = opts.separator.as_deref().unwrap_or(" ");
    let joined = class_strings
        .iter()
        .filter(|s| !s.is_empty())
        .map(|s| s.as_str())
        .collect::<Vec<_>>()
        .join(" ");
    let resolved = merge_class_string(&joined);
    if sep == " " {
        resolved
    } else {
        resolved.split_whitespace().collect::<Vec<_>>().join(sep)
    }
}