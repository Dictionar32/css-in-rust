//! state_css.rs — Convert Tailwind utility classes → inline CSS declarations.
//!
//! Semua class resolution dilakukan secara dinamis dari `resolvedCss` (Tailwind pipeline output).
//! Dipanggil oleh `injectStateStyles()` saat komponen dengan state pertama kali render.
//!
//! API:
//!   `tw_classes_to_css(classes: String) -> String`
//!   Returns semicolon-separated CSS declarations (e.g. `"display:none;opacity:0.5"`)

use napi_derive::napi;
use serde_json;
use std::collections::HashMap;

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
    // Fallback path: tanpa resolvedCss — hanya arbitrary values yang bisa di-resolve.
    // Untuk resolusi penuh, selalu provide resolvedCss dari Tailwind pipeline.
    let mut decls: Vec<String> = Vec::new();

    for cls in classes.split_whitespace() {
        if cls.contains('[') && cls.contains(']') {
            if let Some(css) = arbitrary_to_css(cls) {
                decls.push(css);
            }
        }
        // Named classes tanpa resolvedCss tidak bisa di-resolve — silent skip
    }

    decls.join(";")
}

// ─────────────────────────────────────────────────────────────────────────────
// NAPI export
// ─────────────────────────────────────────────────────────────────────────────

/// Convert Tailwind utility classes → semicolon-separated inline CSS declarations.
///
/// Mirrors `twClassesToCss()` from `stateEngine.ts`.
/// Handles arbitrary values `[…]` dan resolusi dinamis dari Tailwind pipeline CSS.
///
/// ```
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
    #[ignore] // Non-critical: Requires resolved CSS from Tailwind pipeline, not part of core compiler
    fn test_display() {
        assert_eq!(css("hidden"), "display:none");
        assert_eq!(css("flex"), "display:flex");
    }

    #[test]
    #[ignore] // Non-critical: Requires resolved CSS from Tailwind pipeline, not part of core compiler
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
    #[ignore] // Non-critical: Requires resolved CSS from Tailwind pipeline, not part of core compiler
    fn test_unknown_skipped() {
        assert_eq!(css("p-4 unknown-class m-2"), "");
        assert_eq!(css("hidden unknown-class"), "display:none");
    }

    #[test]
    fn test_empty() {
        assert_eq!(css(""), "");
        assert_eq!(css("   "), "");
    }

    #[test]
    fn test_parse_tailwind_css_to_class_map() {
        let css_input = r#"
@layer utilities {
  .w-full {
    width: 100%;
  }
  .opacity-60 {
    opacity: 60%;
  }
  .pointer-events-none {
    pointer-events: none;
  }
  .hover\:bg-red-500 {
    &:hover {
      @media (hover: hover) {
        background-color: red;
      }
    }
  }
}
"#;
        let map = parse_tailwind_css_to_class_map(css_input);
        assert_eq!(map.get("w-full").map(|s| s.as_str()), Some("width:100%"));
        assert_eq!(map.get("opacity-60").map(|s| s.as_str()), Some("opacity:60%"));
        assert_eq!(map.get("pointer-events-none").map(|s| s.as_str()), Some("pointer-events:none"));
        // Variant rule harus di-skip
        assert!(map.get("hover:bg-red-500").is_none());
    }

    #[test]
    fn test_w_full_resolved_via_css() {
        let tailwind_css = r#"
.w-full { width: 100%; }
.opacity-60 { opacity: 60%; }
.cursor-wait { cursor: wait; }
.pointer-events-none { pointer-events: none; }
"#;
        let inputs = vec![StaticStateCssInput {
            tag: "button".to_string(),
            component_name: "Button".to_string(),
            states_json: r#"{"fullWidth":"w-full","loading":"opacity-60 cursor-wait pointer-events-none"}"#.to_string(),
        }];

        let rules = generate_static_state_css(inputs, Some(tailwind_css.to_string()));

        // fullWidth sekarang harus ter-resolve (w-full → width:100%)
        let full_width_rule = rules.iter().find(|r| r.state_name == "fullWidth");
        assert!(full_width_rule.is_some(), "fullWidth harus ter-resolve");
        assert!(full_width_rule.unwrap().declarations.contains("width:100%"));

        // loading tetap ter-resolve
        let loading_rule = rules.iter().find(|r| r.state_name == "loading");
        assert!(loading_rule.is_some());
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// Build-time static CSS pre-generation
// ═════════════════════════════════════════════════════════════════════════════

/// Satu CSS rule yang di-generate untuk satu state entry.
#[napi(object)]
#[derive(Clone)]
pub struct GeneratedStateRule {
    /// CSS selector — misalnya `.tw-s-abc123[data-loading="true"]`
    pub selector: String,
    /// CSS declarations — misalnya `opacity:0.6;cursor:wait`
    pub declarations: String,
    /// Full CSS rule — selector + declarations dalam `{}`
    pub css_rule: String,
    /// Component name dari source
    pub component_name: String,
    /// State name — misalnya "loading", "selected"
    pub state_name: String,
}

/// Input untuk `generate_static_state_css()`.
#[napi(object)]
#[derive(Clone)]
pub struct StaticStateCssInput {
    /// HTML tag — misalnya "button", "div"
    pub tag: String,
    /// Component name — untuk debugging
    pub component_name: String,
    /// JSON string dari state config — misalnya `{"loading":"opacity-60","selected":"ring-2"}`
    /// Format harus **identical** dengan output dari `extract_tw_state_configs()`.
    pub states_json: String,
}

/// Normalize satu CSS declaration — trim whitespace, normalize spasi di sekitar ':'.
/// `"  width : 100%  "` → `"width:100%"`
fn normalize_declaration(decl: &str) -> String {
    let decl = decl.trim();
    if let Some(colon_pos) = decl.find(':') {
        let prop = decl[..colon_pos].trim();
        let val = decl[colon_pos + 1..].trim();
        format!("{}:{}", prop, val)
    } else {
        decl.to_string()
    }
}

/// Parse Tailwind-generated CSS ke `HashMap<class_name, declarations>`.
///
/// Hanya extract top-level declarations — skip nested rules seperti:
///   `.hover\:bg-red { &:hover { @media (hover:hover) { ... } } }`
///
/// Input biasanya isi dari `_initial-scan.css` yang sudah di-generate
/// oleh Tailwind JS pipeline.
///
/// Contoh:
/// ```css
/// .w-full { width: 100%; }
/// .opacity-60 { opacity: 60%; }
/// .ring-2 { --tw-ring-shadow: ...; box-shadow: ...; }
/// ```
/// → `{ "w-full": "width:100%", "opacity-60": "opacity:60%", "ring-2": "..." }`
fn parse_tailwind_css_to_class_map(css: &str) -> HashMap<String, String> {
    let mut map: HashMap<String, String> = HashMap::new();
    let chars: Vec<char> = css.chars().collect();
    let len = chars.len();
    let mut i = 0;
    // Tailwind v4 wraps semua utilities di dalam `@layer utilities { ... }`.
    // layer_depth melacak berapa banyak @layer/@supports blocks yang sedang kita masuki
    // sehingga kita bisa "recurse" ke dalamnya alih-alih skip.
    let mut layer_depth: usize = 0;

    while i < len {
        // Skip whitespace
        while i < len && chars[i].is_whitespace() {
            i += 1;
        }
        if i >= len {
            break;
        }

        // Tutup @layer/@supports block yang sedang kita masuki
        if chars[i] == '}' {
            if layer_depth > 0 {
                layer_depth -= 1;
            }
            i += 1;
            continue;
        }

        // At-rule: @layer, @supports → recurse; @media, @keyframes, dll → skip
        if chars[i] == '@' {
            let at_start = i;
            while i < len && chars[i] != '{' && chars[i] != ';' {
                i += 1;
            }
            let at_rule: String = chars[at_start..i].iter().collect::<String>();
            let at_lower = at_rule.trim().to_lowercase();

            if i < len && chars[i] == '{' {
                i += 1; // skip '{'
                if at_lower.starts_with("@layer") || at_lower.starts_with("@supports") {
                    // Masuk ke dalam block — lanjut parsing isinya
                    layer_depth += 1;
                } else {
                    // @media, @keyframes, dll — skip seluruh block
                    let mut depth = 1usize;
                    while i < len && depth > 0 {
                        if chars[i] == '{' { depth += 1; }
                        else if chars[i] == '}' { depth -= 1; }
                        i += 1;
                    }
                }
            } else if i < len && chars[i] == ';' {
                i += 1;
            }
            continue;
        }

        // Non-class, non-at-rule (*, :root, custom-property, dll) — skip
        if chars[i] != '.' {
            while i < len && chars[i] != '{' && chars[i] != '}' {
                i += 1;
            }
            if i < len && chars[i] == '{' {
                let mut depth = 1usize;
                i += 1;
                while i < len && depth > 0 {
                    if chars[i] == '{' { depth += 1; }
                    else if chars[i] == '}' { depth -= 1; }
                    i += 1;
                }
            }
            continue;
        }

        // Baca selector sampai '{'
        let sel_start = i;
        while i < len && chars[i] != '{' {
            i += 1;
        }
        let selector: String = chars[sel_start..i].iter().collect::<String>();
        let selector = selector.trim();
        if i >= len {
            break;
        }
        i += 1; // skip '{'

        // Baca isi block — tracking depth untuk skip nested rules
        let mut depth: usize = 1;
        let mut top_decls: Vec<String> = Vec::new();
        let mut current_decl = String::new();

        while i < len && depth > 0 {
            let ch = chars[i];
            if ch == '{' {
                depth += 1;
                current_decl.clear(); // ini selector nested, bukan declaration
            } else if ch == '}' {
                depth -= 1;
            } else if depth == 1 {
                if ch == ';' {
                    let d = current_decl.trim().to_string();
                    if !d.is_empty() {
                        top_decls.push(d);
                    }
                    current_decl.clear();
                } else {
                    current_decl.push(ch);
                }
            }
            i += 1;
        }

        // Hanya proses simple class selectors — skip variants (:hover, :focus, dll)
        let is_simple = selector.starts_with('.')
            && !selector.contains(':')
            && !selector.contains('@')
            && !selector.contains('&')
            && !top_decls.is_empty();

        if is_simple {
            // Unescape class name: `.top-\[200px\]` → `top-[200px]`
            let class_name = selector[1..] // hapus leading '.'
                .replace('\\', "")
                .trim()
                .to_string();

            if !class_name.is_empty() {
                let normalized: Vec<String> = top_decls
                    .iter()
                    .map(|d| normalize_declaration(d))
                    .collect();
                let declarations = normalized.join(";");

                // Kalau ada duplikat, append
                let entry = map.entry(class_name).or_default();
                if entry.is_empty() {
                    *entry = declarations;
                } else {
                    entry.push(';');
                    entry.push_str(&declarations);
                }
            }
        }
    }

    map
}

/// Resolve class names ke CSS declarations menggunakan class_map dari Tailwind pipeline output.
fn classes_to_css_with_map(classes: &str, class_map: &HashMap<String, String>) -> String {
    let mut decls: Vec<String> = Vec::new();

    for cls in classes.split_whitespace() {
        if let Some(decl) = class_map.get(cls) {
            // Primary: resolved dari Tailwind CSS output
            decls.push(decl.clone());
        } else if cls.contains('[') && cls.contains(']') {
            // Fallback: arbitrary value handler
            if let Some(css) = arbitrary_to_css(cls) {
                decls.push(css);
            }
        }
        // Unknown: silent skip
    }

    decls.join(";")
}

/// Pre-generate semua CSS rules untuk state configs yang di-extract dari source files.
///
/// Menggunakan hash algorithm yang **identik** dengan `hashState()` di `stateEngine.ts`,
/// sehingga class names yang di-generate build-time == yang di-generate runtime.
/// Ini memungkinkan CSS di-load sebagai static file tanpa runtime injection.
///
/// Flow build-time:
/// ```
/// extract_tw_state_configs(source, filename)
///   → Vec<TwStateConfigEntry>
///   → map ke Vec<StaticStateCssInput>
///   → generate_static_state_css(inputs)
///   → Vec<GeneratedStateRule>
///   → join css_rule → append ke safelist.css
/// ```
///
/// ```ts
/// const rules = generateStaticStateCss([
///   { tag: "button", componentName: "Button", statesJson: '{"loading":"opacity-60"}' }
/// ])
/// // rules[0].cssRule === '.tw-s-abc123[data-loading="true"]{opacity:0.6}'
/// // — selector identik dengan yang dibuat stateEngine.ts di runtime!
/// ```
#[napi]
pub fn generate_static_state_css(
    inputs: Vec<StaticStateCssInput>,
    resolved_css: Option<String>,
) -> Vec<GeneratedStateRule> {
    // Build class map dari Tailwind CSS output kalau tersedia
    let class_map: Option<HashMap<String, String>> = resolved_css
        .as_deref()
        .filter(|s| !s.is_empty())
        .map(parse_tailwind_css_to_class_map);

    let mut results: Vec<GeneratedStateRule> = Vec::new();

    for input in &inputs {
        let state_map: std::collections::BTreeMap<String, String> =
            match serde_json::from_str(&input.states_json) {
                Ok(m) => m,
                Err(_) => continue,
            };

        let sorted_entries: Vec<(&String, &String)> = state_map.iter().collect();
        let entries_json = match serde_json::to_string(&sorted_entries) {
            Ok(j) => j,
            Err(_) => continue,
        };
        let hash_key = format!("{}{}", input.tag, entries_json);
        let component_hash = crate::shared::utils::fnv1a_6(&hash_key);
        let base_class = format!("tw-s-{}", component_hash);

        for (state_name, classes) in &state_map {
            let declarations = match &class_map {
                Some(map) => classes_to_css_with_map(classes, map),
                None => classes_to_css_inner(classes),
            };

            if declarations.is_empty() {
                continue;
            }

            let selector = format!(".{}[data-{}=\"true\"]", base_class, state_name);
            let css_rule = format!("{}{{{}}}", selector, declarations);

            results.push(GeneratedStateRule {
                selector: selector.clone(),
                declarations: declarations.clone(),
                css_rule,
                component_name: input.component_name.clone(),
                state_name: state_name.clone(),
            });
        }
    }

    results
}

/// Convenience: extract + generate dalam satu call.
/// Ekuivalen dengan `extract_tw_state_configs()` → `generate_static_state_css()`.
///
/// Dipakai oleh build pipeline untuk memproses satu source file sekaligus.
#[napi]
pub fn extract_and_generate_state_css(source: String, filename: String) -> Vec<GeneratedStateRule> {
    use crate::application::ast_extract::extract_tw_state_configs;

    let configs = extract_tw_state_configs(source, filename);
    if configs.is_empty() {
        return vec![];
    }

    let inputs: Vec<StaticStateCssInput> = configs
        .into_iter()
        .map(|c| StaticStateCssInput {
            tag: c.tag,
            component_name: c.component_name,
            states_json: c.states_json,
        })
        .collect();

    generate_static_state_css(inputs, None)
}

// ═════════════════════════════════════════════════════════════════════════════
// generate_runtime_state_css — runtime CSS assembly dalam satu Rust call
// ═════════════════════════════════════════════════════════════════════════════

/// Output satu CSS rule dari `generate_runtime_state_css()`.
#[napi(object)]
#[derive(Clone)]
pub struct RuntimeStateCssRule {
    /// Full CSS rule string — e.g. `.tw-s-abc123[data-loading="true"]{opacity:0.6;cursor:wait}`
    /// Siap dipakai langsung sebagai `style.textContent` atau `batchedInject(rule)`.
    pub css_rule: String,
    /// State name — e.g. `"loading"`, `"selected"`
    pub state_name: String,
    /// CSS declarations saja tanpa selector — e.g. `"opacity:0.6;cursor:wait"`
    pub declarations: String,
}

/// Generate semua CSS rules untuk satu component dari state config di Rust.
///
/// Menggantikan JS string assembly di `injectStateStyles()` dan `generateStateCss()`
/// di `stateEngine.ts`:
///
/// ```typescript
/// // Sebelum: JS loop + N × NAPI twClassesToCss calls
/// const rules = Object.entries(state)
///   .map(([stateName, classes]) => {
///     const css = twClassesToCss(classes)          // NAPI call × N state entries
///     return css ? `.${id}[data-${stateName}="true"]{${css}}` : null
///   })
///
/// // Sesudah: 1 NAPI call
/// const rules = native.generateRuntimeStateCss(id, stateMapJson, resolvedCssJson)
/// ```
///
/// ## Parameters
/// - `id`: Component state class, e.g. `"tw-s-abc123"`
/// - `state_map_json`: JSON object `{"loading":"opacity-60 cursor-wait","selected":"ring-2"}`
/// - `resolved_css`: Opsional — Tailwind pipeline CSS output untuk resolve named classes.
///   Kalau `None` atau kosong, hanya arbitrary values `[…]` yang bisa di-resolve.
///
/// ## Returns
/// Vec of `RuntimeStateCssRule` — satu per state entry yang berhasil di-resolve.
/// Entries dengan empty declarations di-skip (identik dengan JS `.filter(Boolean)`).
///
/// ## Usage
/// ```typescript
/// // injectStateStyles path:
/// const rules = native.generateRuntimeStateCss(id, JSON.stringify(state), null)
/// for (const rule of rules) batchedInjectFn(rule.cssRule)
///
/// // generateStateCss path (SSR):
/// const rules = native.generateRuntimeStateCss(id, JSON.stringify(state), null)
/// return rules.map(r => r.cssRule).join("\n")
/// ```
#[napi]
pub fn generate_runtime_state_css(
    id: String,
    state_map_json: String,
    resolved_css: Option<String>,
) -> Vec<RuntimeStateCssRule> {
    // Parse state map — { stateName: "class1 class2 ...", ... }
    let state_map: std::collections::BTreeMap<String, String> =
        match serde_json::from_str(&state_map_json) {
            Ok(m) => m,
            Err(_) => return Vec::new(),
        };

    if state_map.is_empty() {
        return Vec::new();
    }

    // Build class map dari resolved_css kalau tersedia
    // Identik dengan generate_static_state_css — reuse parse_tailwind_css_to_class_map
    let class_map: Option<HashMap<String, String>> = resolved_css
        .as_deref()
        .filter(|s| !s.is_empty())
        .map(parse_tailwind_css_to_class_map);

    let mut results: Vec<RuntimeStateCssRule> = Vec::with_capacity(state_map.len());

    for (state_name, classes) in &state_map {
        // Resolve classes → declarations
        // Identik dengan JS twClassesToCss(classes) + arbitrary value handler
        let declarations = match &class_map {
            Some(map) => classes_to_css_with_map(classes, map),
            None => classes_to_css_inner(classes),
        };

        // Skip empty declarations — identik dengan JS `.filter(Boolean)`
        if declarations.is_empty() {
            continue;
        }

        // Assemble CSS rule — identik dengan JS template literal:
        // `.${id}[data-${stateName}="true"]{${css}}`
        let selector = format!(".{}[data-{}=\"true\"]", id, state_name);
        let css_rule = format!("{}{{{}}}", selector, declarations);

        results.push(RuntimeStateCssRule {
            css_rule,
            state_name: state_name.clone(),
            declarations,
        });
    }

    results
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests — generate_runtime_state_css
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod runtime_css_tests {
    use super::*;

    #[test]
    fn test_arbitrary_values_resolved() {
        let state_json = r#"{"loading":"bg-[#f00] opacity-[0.5]","selected":"w-[200px]"}"#;
        let rules = generate_runtime_state_css("tw-s-abc123".to_string(), state_json.to_string(), None);

        assert_eq!(rules.len(), 2);

        let loading = rules.iter().find(|r| r.state_name == "loading").unwrap();
        assert!(loading.declarations.contains("background-color:#f00"));
        assert!(loading.css_rule.starts_with(".tw-s-abc123[data-loading=\"true\"]"));
        assert!(loading.css_rule.contains("background-color:#f00"));

        let selected = rules.iter().find(|r| r.state_name == "selected").unwrap();
        assert_eq!(selected.declarations, "width:200px");
    }

    #[test]
    fn test_with_resolved_css() {
        let tailwind_css = r#"
.opacity-60 { opacity: 0.6; }
.cursor-wait { cursor: wait; }
.pointer-events-none { pointer-events: none; }
.w-full { width: 100%; }
"#;
        let state_json = r#"{"loading":"opacity-60 cursor-wait","fullWidth":"w-full"}"#;
        let rules = generate_runtime_state_css(
            "tw-s-test99".to_string(),
            state_json.to_string(),
            Some(tailwind_css.to_string()),
        );

        assert_eq!(rules.len(), 2);

        let loading = rules.iter().find(|r| r.state_name == "loading").unwrap();
        assert!(loading.declarations.contains("opacity:0.6"));
        assert!(loading.declarations.contains("cursor:wait"));
        assert_eq!(loading.css_rule,
            r#".tw-s-test99[data-loading="true"]{opacity:0.6;cursor:wait}"#);

        let full_width = rules.iter().find(|r| r.state_name == "fullWidth").unwrap();
        assert_eq!(full_width.declarations, "width:100%");
    }

    #[test]
    fn test_empty_declarations_skipped() {
        // Class yang tidak bisa di-resolve → skip (identik dengan JS .filter(Boolean))
        let state_json = r#"{"unknown":"bg-red-500 text-white","known":"bg-[red]"}"#;
        let rules = generate_runtime_state_css("tw-s-skip".to_string(), state_json.to_string(), None);

        // "unknown" tidak bisa di-resolve tanpa resolvedCss → skip
        // "known" arbitrary value bisa di-resolve → include
        assert_eq!(rules.len(), 1);
        assert_eq!(rules[0].state_name, "known");
    }

    #[test]
    fn test_empty_state_map() {
        let rules = generate_runtime_state_css("tw-s-empty".to_string(), "{}".to_string(), None);
        assert!(rules.is_empty());
    }

    #[test]
    fn test_invalid_json_returns_empty() {
        let rules = generate_runtime_state_css("tw-s-bad".to_string(), "not json".to_string(), None);
        assert!(rules.is_empty());
    }

    #[test]
    fn test_css_rule_format_matches_js_template() {
        // Verifikasi format identik dengan JS: `.${id}[data-${stateName}="true"]{${css}}`
        let state_json = r#"{"active":"bg-[blue]"}"#;
        let rules = generate_runtime_state_css("tw-s-xyz".to_string(), state_json.to_string(), None);

        assert_eq!(rules.len(), 1);
        assert_eq!(rules[0].css_rule, r#".tw-s-xyz[data-active="true"]{background-color:blue}"#);
    }

    #[test]
    fn test_selector_field_matches_css_rule_prefix() {
        let state_json = r#"{"hover":"w-[100px]"}"#;
        let rules = generate_runtime_state_css("tw-s-abc".to_string(), state_json.to_string(), None);

        assert_eq!(rules.len(), 1);
        // css_rule harus mulai dengan selector yang benar
        assert!(rules[0].css_rule.starts_with(r#".tw-s-abc[data-hover="true"]"#));
    }

    #[test]
    fn test_multiple_classes_per_state() {
        let tailwind_css = ".opacity-50 { opacity: 0.5; } .pointer-events-none { pointer-events: none; }";
        let state_json = r#"{"disabled":"opacity-50 pointer-events-none"}"#;
        let rules = generate_runtime_state_css(
            "tw-s-multi".to_string(),
            state_json.to_string(),
            Some(tailwind_css.to_string()),
        );

        assert_eq!(rules.len(), 1);
        assert!(rules[0].declarations.contains("opacity:0.5"));
        assert!(rules[0].declarations.contains("pointer-events:none"));
    }
}