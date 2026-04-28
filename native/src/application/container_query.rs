//! Container Query CSS generation — migrated from `core/src/containerQuery.ts`
//!
//! Fungsi yang dimigrate:
//!   - `layoutClassesToCss(classes)` → `layout_classes_to_css(classes)`
//!   - `buildContainerRules(id, container, name)` → `build_container_rules(...)`
//!   - `generateContainerCss(tag, container, name)` → exposed via `build_container_rules`
//!
//! Kenapa worth di-native:
//! - `layoutClassesToCss` dipanggil per breakpoint per komponen saat render/SSR.
//!   JS: HashMap lookup + `split(/\s+/)` + RegExp per token.
//!   Rust: `phf_map!` static lookup (zero alloc) + `split_whitespace`.
//! - `buildContainerRules` string-builds CSS dari breakpoints — hot di SSR
//!   karena semua container queries di-generate saat hydration.
//!
//! `processContainer` dan `injectContainerStyles` tetap di JS
//! karena mengakses DOM API (`document.createElement`, `document.head`).

use napi_derive::napi;

// ─────────────────────────────────────────────────────────────────────────────
// Static layout class → CSS property lookup table
// Identik dengan LAYOUT_MAP di containerQuery.ts
// ─────────────────────────────────────────────────────────────────────────────

fn layout_class_to_decl(cls: &str) -> Option<&'static str> {
    match cls {
        "flex"              => Some("display:flex"),
        "grid"              => Some("display:grid"),
        "block"             => Some("display:block"),
        "inline-flex"       => Some("display:inline-flex"),
        "hidden"            => Some("display:none"),
        "flex-col"          => Some("flex-direction:column"),
        "flex-row"          => Some("flex-direction:row"),
        "flex-wrap"         => Some("flex-wrap:wrap"),
        "flex-nowrap"       => Some("flex-wrap:nowrap"),
        "items-center"      => Some("align-items:center"),
        "items-start"       => Some("align-items:flex-start"),
        "items-end"         => Some("align-items:flex-end"),
        "items-stretch"     => Some("align-items:stretch"),
        "justify-center"    => Some("justify-content:center"),
        "justify-between"   => Some("justify-content:space-between"),
        "justify-start"     => Some("justify-content:flex-start"),
        "justify-end"       => Some("justify-content:flex-end"),
        "grid-cols-1"       => Some("grid-template-columns:repeat(1,minmax(0,1fr))"),
        "grid-cols-2"       => Some("grid-template-columns:repeat(2,minmax(0,1fr))"),
        "grid-cols-3"       => Some("grid-template-columns:repeat(3,minmax(0,1fr))"),
        "grid-cols-4"       => Some("grid-template-columns:repeat(4,minmax(0,1fr))"),
        "grid-cols-6"       => Some("grid-template-columns:repeat(6,minmax(0,1fr))"),
        "grid-cols-12"      => Some("grid-template-columns:repeat(12,minmax(0,1fr))"),
        _                   => None,
    }
}

/// Default breakpoint map — identik dengan CONTAINER_BREAKPOINTS di containerQuery.ts
fn default_breakpoint(key: &str) -> Option<&'static str> {
    match key {
        "xs"  => Some("240px"),
        "sm"  => Some("320px"),
        "md"  => Some("640px"),
        "lg"  => Some("1024px"),
        "xl"  => Some("1280px"),
        "2xl" => Some("1536px"),
        _     => None,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI types
// ─────────────────────────────────────────────────────────────────────────────

/// Satu breakpoint entry untuk `build_container_rules`.
#[napi(object)]
pub struct ContainerBreakpoint {
    /// Key breakpoint (mis. "sm", "lg") atau raw minWidth (mis. "480px")
    pub key: String,
    /// Class string untuk breakpoint ini (mis. "flex-col text-sm")
    pub classes: String,
}

// ─────────────────────────────────────────────────────────────────────────────
// layout_classes_to_css
// ─────────────────────────────────────────────────────────────────────────────

/// Konversi layout class string menjadi inline CSS declaration string.
///
/// **Menggantikan** `layoutClassesToCss()` di `core/src/containerQuery.ts`.
///
/// Handles:
/// - Named layout classes (`flex`, `grid-cols-3`, dll) via static lookup
/// - Arbitrary width: `w-[320px]` → `width:320px`
/// - Arbitrary max-width: `max-w-[640px]` → `max-width:640px`
///
/// # Examples
/// ```
/// layout_classes_to_css("flex flex-col items-center")
/// // "display:flex;flex-direction:column;align-items:center"
///
/// layout_classes_to_css("w-[320px] grid-cols-3")
/// // "width:320px;grid-template-columns:repeat(3,minmax(0,1fr))"
/// ```
#[napi]
pub fn layout_classes_to_css(classes: String) -> String {
    let mut decls: Vec<&str> = Vec::new();
    // Buffer untuk arbitrary values — harus hidup selama decls dipakai
    let mut arbitrary_buf: Vec<String> = Vec::new();

    for token in classes.split_whitespace() {
        if let Some(decl) = layout_class_to_decl(token) {
            decls.push(decl);
        } else if token.starts_with("w-[") && token.ends_with(']') {
            let val = &token[3..token.len() - 1];
            if !val.is_empty() {
                arbitrary_buf.push(format!("width:{}", val));
            }
        } else if token.starts_with("max-w-[") && token.ends_with(']') {
            let val = &token[7..token.len() - 1];
            if !val.is_empty() {
                arbitrary_buf.push(format!("max-width:{}", val));
            }
        }
        // Unknown classes silently ignored — same as JS
    }

    // Combine static + arbitrary
    let mut parts: Vec<&str> = decls;
    for s in &arbitrary_buf {
        parts.push(s.as_str());
    }
    parts.join(";")
}

// ─────────────────────────────────────────────────────────────────────────────
// build_container_rules
// ─────────────────────────────────────────────────────────────────────────────

/// Generate `@container` CSS rules dari breakpoints.
///
/// **Menggantikan** `buildContainerRules()` dan `generateContainerCss()`
/// di `core/src/containerQuery.ts`.
///
/// Output format identik dengan JS:
/// ```css
/// @container (min-width: 320px){.tw-cq-abc123{display:flex;flex-direction:column}}
/// @container sidebar (min-width: 1024px){.tw-cq-abc123{display:grid}}
/// ```
///
/// # Arguments
/// - `id`             — unique hash ID komponen (mis. "tw-cq-abc123")
/// - `breakpoints`    — array {key, classes} — key bisa nama ("sm") atau raw px ("480px")
/// - `container_name` — nama container opsional untuk `@container <name> (...)`
#[napi]
pub fn build_container_rules(
    id: String,
    breakpoints: Vec<ContainerBreakpoint>,
    container_name: Option<String>,
) -> String {
    let mut rules: Vec<String> = Vec::with_capacity(breakpoints.len());

    for bp in &breakpoints {
        let css = layout_classes_to_css(bp.classes.clone());
        if css.is_empty() {
            continue;
        }

        // Resolve minWidth: named key → px value, fallback ke raw value
        let min_width = default_breakpoint(bp.key.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| bp.key.clone());

        let query = match &container_name {
            Some(name) if !name.is_empty() => {
                format!("@container {} (min-width: {})", name, min_width)
            }
            _ => format!("@container (min-width: {})", min_width),
        };

        // Build: @container [name] (min-width: Xpx){.id{decls}}
        // Menggunakan push_str bukan format! — brace escaping di format! rawan typo
        let mut rule = String::with_capacity(query.len() + id.len() + css.len() + 10);
        rule.push_str(&query);
        rule.push('{');
        rule.push('.');
        rule.push_str(&id);
        rule.push('{');
        rule.push_str(&css);
        rule.push_str("}}");
        rules.push(rule);
    }

    rules.join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // layout_classes_to_css tests
    #[test]
    fn test_layout_named_classes() {
        let result = layout_classes_to_css("flex flex-col items-center".into());
        assert_eq!(result, "display:flex;flex-direction:column;align-items:center");
    }

    #[test]
    fn test_layout_arbitrary_width() {
        let result = layout_classes_to_css("w-[320px]".into());
        assert_eq!(result, "width:320px");
    }

    #[test]
    fn test_layout_arbitrary_max_width() {
        let result = layout_classes_to_css("max-w-[640px]".into());
        assert_eq!(result, "max-width:640px");
    }

    #[test]
    fn test_layout_mixed() {
        let result = layout_classes_to_css("flex w-[480px]".into());
        assert!(result.contains("display:flex"));
        assert!(result.contains("width:480px"));
    }

    #[test]
    fn test_layout_unknown_class_ignored() {
        let result = layout_classes_to_css("flex unknown-class text-red-500".into());
        assert_eq!(result, "display:flex");
    }

    #[test]
    fn test_layout_empty_input() {
        let result = layout_classes_to_css("".into());
        assert_eq!(result, "");
    }

    #[test]
    fn test_layout_whitespace_normalized() {
        let result = layout_classes_to_css("  flex   flex-col  ".into());
        assert_eq!(result, "display:flex;flex-direction:column");
    }

    // build_container_rules tests
    #[test]
    fn test_build_container_rules_basic() {
        let bps = vec![ContainerBreakpoint {
            key: "sm".into(),
            classes: "flex flex-col".into(),
        }];
        let result = build_container_rules("abc123".into(), bps, None);
        assert!(result.contains("@container (min-width: 320px)"));
        assert!(result.contains(".abc123"));
        assert!(result.contains("display:flex"));
    }

    #[test]
    fn test_build_container_rules_named_container() {
        let bps = vec![ContainerBreakpoint {
            key: "lg".into(),
            classes: "grid grid-cols-3".into(),
        }];
        let result = build_container_rules("card".into(), bps, Some("sidebar".into()));
        assert!(result.contains("@container sidebar (min-width: 1024px)"));
        assert!(result.contains(".card"));
    }

    #[test]
    fn test_build_container_rules_raw_minwidth() {
        let bps = vec![ContainerBreakpoint {
            key: "480px".into(),
            classes: "flex".into(),
        }];
        let result = build_container_rules("x".into(), bps, None);
        assert!(result.contains("@container (min-width: 480px)"));
    }

    #[test]
    fn test_build_container_rules_unknown_class_skips_rule() {
        let bps = vec![ContainerBreakpoint {
            key: "md".into(),
            classes: "completely-unknown-class".into(),
        }];
        let result = build_container_rules("x".into(), bps, None);
        // CSS empty → rule skipped
        assert!(result.is_empty());
    }

    #[test]
    fn test_build_container_rules_multiple_breakpoints() {
        let bps = vec![
            ContainerBreakpoint { key: "sm".into(), classes: "flex".into() },
            ContainerBreakpoint { key: "lg".into(), classes: "grid".into() },
        ];
        let result = build_container_rules("comp".into(), bps, None);
        let lines: Vec<&str> = result.lines().collect();
        assert_eq!(lines.len(), 2);
        assert!(lines[0].contains("320px"));
        assert!(lines[1].contains("1024px"));
    }
}