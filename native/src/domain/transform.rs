use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::ast_optimizer;
pub(crate) use crate::domain::transform_components::{
    build_metadata_json, parse_subcomponent_blocks,
};
use crate::domain::transform_components::{render_compound_component, render_static_component};
pub use crate::domain::transform_parser::{normalise_classes, parse_classes_inner};
use crate::shared::utils::{serde_json_string, short_hash};

static RE_TEMPLATE: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"\btw\.(server\.)?(\w+)`((?:[^`\\]|\\.)*)`").unwrap());
static RE_WRAP: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"\btw\((\w+)\)`((?:[^`\\]|\\.)*)`").unwrap());
static RE_COMP_NAME: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?m)(?:const|let|var)\s+(\w+)\s*=\s*tw\.(?:server\.)?\w+`").unwrap());
static RE_INTERACTIVE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\b(hover:|focus:|active:|group-hover:|peer-|on[A-Z]|useState|useEffect|useRef)\b")
        .unwrap()
});
static RE_IMPORT_TW: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r#"import\s*\{[^}]*\btw\b[^}]*\}\s*from\s*["']tailwind-styled-v4["'];?\n?"#).unwrap()
});
static RE_STILL_TW: Lazy<Regex> = Lazy::new(|| Regex::new(r"\btw\.(server\.)?\w+[`(]").unwrap());
// STEP 3 — object config syntax: tw.tag({ base, variants, sizes, states })
static RE_OBJ_CONFIG_START: Lazy<Regex> = Lazy::new(|| Regex::new(r"\btw\.(\w+)\s*\(").unwrap());
static RE_OBJ_COMP_NAME: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?m)(?:const|let|var)\s+(\w+)\s*=\s*tw\.\w+\s*\(").unwrap());
/// Matches key: `...`, key: "...", or key: '...' — captures the string value in group 2/3/4.
static RE_FLAT_STRING: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r#"(\w[\w-]*)\s*:\s*(?:`([^`]*)`|"([^"]*)"|'([^']*)')"#).unwrap()
});

// ─────────────────────────────────────────────────────────────────────────────
// Types exposed to N-API
// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ParsedClass {
    pub raw: String,
    pub base: String,
    pub variants: Vec<String>,
    pub modifier_type: Option<String>,
    pub modifier_value: Option<String>,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct SubComponent {
    pub name: String,
    pub tag: String,
    pub classes: String,
    pub scoped_class: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct TransformResult {
    pub code: String,
    pub classes: Vec<String>,
    pub changed: bool,
    pub rsc_json: Option<String>,
    pub metadata_json: Option<String>,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct RscAnalysis {
    pub is_server: bool,
    pub needs_client_directive: bool,
    pub client_reasons: Vec<String>,
    /// QA #3: Pattern-level detail untuk debugging dan devtools
    pub detected_patterns: Vec<String>,
    /// QA #3: Confidence score 0-100 (100 = explicit directive found)
    pub confidence: u32,
}

// ─────────────────────────────────────────────────────────────────────────────

fn is_dynamic(content: &str) -> bool {
    content.contains("${")
}

// ─────────────────────────────────────────────────────────────────────────────
// Object config helpers (STEP 3)
// ─────────────────────────────────────────────────────────────────────────────

/// Find the matching `)` for a `(` at `start`, respecting backtick strings.
fn find_matching_paren_from(s: &str, start: usize) -> Option<usize> {
    let bytes = s.as_bytes();
    let mut depth = 0i32;
    let mut i = start;
    let mut in_backtick = false;
    while i < bytes.len() {
        if in_backtick {
            if bytes[i] == b'`' {
                in_backtick = false;
            }
            i += 1;
            continue;
        }
        match bytes[i] {
            b'`' => in_backtick = true,
            b'(' => depth += 1,
            b')' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

/// Extract the inner content of `{...}` where `inner_start` is the index
/// immediately after the opening `{`.  Respects nested braces and backtick strings.
fn extract_brace_inner(content: &str, inner_start: usize) -> Option<&str> {
    let s = &content[inner_start..];
    let bytes = s.as_bytes();
    let mut depth = 1i32;
    let mut i = 0;
    let mut in_backtick = false;
    while i < bytes.len() {
        if in_backtick {
            if bytes[i] == b'`' {
                in_backtick = false;
            }
            i += 1;
            continue;
        }
        match bytes[i] {
            b'`' => in_backtick = true,
            b'{' => depth += 1,
            b'}' => {
                depth -= 1;
                if depth == 0 {
                    return Some(&s[..i]);
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

/// Extract the string value for `key: \`...\``, `key: "..."`, or `key: '...'` inside an object literal.
fn extract_string_for_key(content: &str, key: &str) -> Option<String> {
    let search = format!("{}:", key);
    let pos = content.find(&search)?;
    let after = content[pos + search.len()..].trim_start();
    let (delim, inner) = if after.starts_with('`') {
        ('`', &after[1..])
    } else if after.starts_with('"') {
        ('"', &after[1..])
    } else if after.starts_with('\'') {
        ('\'', &after[1..])
    } else {
        return None;
    };
    let end = inner.find(delim)?;
    Some(inner[..end].to_string())
}

/// Return the inner content of `key: { ... }` inside an object literal.
fn find_obj_section<'a>(content: &'a str, key: &str) -> Option<&'a str> {
    let search = format!("{}:", key);
    let key_pos = content.find(&search)?;
    let after_colon = &content[key_pos + search.len()..];
    let ws_len = after_colon.len() - after_colon.trim_start().len();
    let trimmed = after_colon.trim_start();
    if !trimmed.starts_with('{') {
        return None;
    }
    let abs_after_brace = key_pos + search.len() + ws_len + 1; // +1 skips `{`
    extract_brace_inner(content, abs_after_brace)
}

/// Parse `{ key: \`classes\` }` (or regular quotes) → HashMap<key, normalised classes>.
fn parse_flat_string_map(content: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for cap in RE_FLAT_STRING.captures_iter(content) {
        // group 2 = backtick, 3 = double-quote, 4 = single-quote
        let value = cap.get(2).or(cap.get(3)).or(cap.get(4))
            .map(|m| m.as_str())
            .unwrap_or("");
        let classes = normalise_classes(value).join(" ");
        map.insert(cap[1].to_string(), classes);
    }
    map
}

/// Parse `{ outerKey: { innerKey: \`classes\` } }` (or regular quotes) → nested HashMap.
fn parse_nested_string_map(content: &str) -> HashMap<String, HashMap<String, String>> {
    let mut result = HashMap::new();
    // Walk top-level keys manually to find nested blocks.
    let re_key = Regex::new(r"(\w[\w-]*)\s*:\s*\{").expect("parse_nested_string_map regex");
    let mut search_from = 0usize;
    loop {
        let slice = &content[search_from..];
        let cap = match re_key.captures(slice) {
            Some(c) => c,
            None => break,
        };
        let outer_key = cap[1].to_string();
        let rel_end = cap.get(0).unwrap().end(); // position right after `{`
        let abs_inner_start = search_from + rel_end;
        match extract_brace_inner(content, abs_inner_start) {
            Some(inner) => {
                let flat = parse_flat_string_map(inner);
                let inner_len = inner.len();
                result.insert(outer_key, flat);
                search_from = abs_inner_start + inner_len + 1; // +1 for `}`
            }
            None => break,
        }
    }
    result
}

/// A single sub-component entry: `header: { tag: "header", base: \`...\` }`
struct SubEntry {
    tag: String,
    base: String,
}

/// Parse the `sub: { key: { tag: "...", base: \`...\` }, ... }` block.
fn parse_sub_map(content: &str) -> HashMap<String, SubEntry> {
    let mut result = HashMap::new();
    let re_key = Regex::new(r"(\w[\w-]*)\s*:\s*\{").expect("parse_sub_map regex");
    let mut search_from = 0usize;
    loop {
        let slice = &content[search_from..];
        let cap = match re_key.captures(slice) {
            Some(c) => c,
            None => break,
        };
        let sub_name = cap[1].to_string();
        let rel_end = cap.get(0).unwrap().end();
        let abs_inner_start = search_from + rel_end;
        match extract_brace_inner(content, abs_inner_start) {
            Some(inner) => {
                let inner_len = inner.len();
                let tag = extract_string_for_key(inner, "tag")
                    .unwrap_or_else(|| "div".to_string());
                let base_raw = extract_string_for_key(inner, "base").unwrap_or_default();
                let base = normalise_classes(&base_raw).join(" ");
                result.insert(sub_name, SubEntry { tag, base });
                search_from = abs_inner_start + inner_len + 1;
            }
            None => break,
        }
    }
    result
}


/// Emit a forwardRef component for `tw.tag({ base, variants, sizes, states, sub })`.
/// Variants: `props[variantName] === "value"` → apply classes.
/// Sizes:    `props.size === "sizeName"` → apply classes.
/// States:   `props[stateName]` (boolean) → apply classes.
/// Sub:      named child components attached via Object.assign (emits IIFE when non-empty).
fn render_object_config_component(
    tag: &str,
    fn_name: &str,
    comp_name: &str,
    base_classes: &str,
    variants: &HashMap<String, HashMap<String, String>>,
    default_variants: &HashMap<String, String>,
    sizes: &HashMap<String, String>,
    states: &HashMap<String, String>,
    sub: &HashMap<String, SubEntry>,
) -> String {
    // ── Build the forwardRef body lines ──────────────────────────────────────
    let mut body: Vec<String> = Vec::new();
    body.push(format!(
        "React.forwardRef(function {fn_name}(props, ref) {{"
    ));
    body.push(format!(
        "  var _cls = [{}];",
        serde_json_string(base_classes)
    ));

    // Variant prop checks — inject ?? "defaultValue" if defaultVariants is set
    let mut variant_keys: Vec<String> = Vec::new();
    let mut sorted_variants: Vec<_> = variants.iter().collect();
    sorted_variants.sort_by_key(|(k, _)| k.as_str());
    for (variant_name, variant_values) in &sorted_variants {
        variant_keys.push(variant_name.to_string());
        let mut sorted_values: Vec<_> = variant_values.iter().collect();
        sorted_values.sort_by_key(|(k, _)| k.as_str());
        // Use nullish coalescing if this variant has a default
        let prop_expr = if let Some(default_val) = default_variants.get(*variant_name) {
            format!("(props.{} ?? {})", variant_name, serde_json_string(default_val))
        } else {
            format!("props.{}", variant_name)
        };
        for (value, classes) in sorted_values {
            body.push(format!(
                "  if ({} === {}) _cls.push({});",
                prop_expr,
                serde_json_string(value),
                serde_json_string(classes),
            ));
        }
    }

    // Size prop checks — inject ?? "defaultSize" if present
    if !sizes.is_empty() {
        let default_size = default_variants.get("size");
        let size_expr = if let Some(default_val) = default_size {
            format!("(props.size ?? {})", serde_json_string(default_val))
        } else {
            "props.size".to_string()
        };
        let mut sorted_sizes: Vec<_> = sizes.iter().collect();
        sorted_sizes.sort_by_key(|(k, _)| k.as_str());
        for (size_name, classes) in sorted_sizes {
            body.push(format!(
                "  if ({} === {}) _cls.push({});",
                size_expr,
                serde_json_string(size_name),
                serde_json_string(classes),
            ));
        }
    }

    // Boolean state prop checks
    let mut state_keys: Vec<String> = Vec::new();
    let mut sorted_states: Vec<_> = states.iter().collect();
    sorted_states.sort_by_key(|(k, _)| k.as_str());
    for (state_name, classes) in sorted_states {
        state_keys.push(state_name.clone());
        body.push(format!(
            "  if (props.{}) _cls.push({});",
            state_name,
            serde_json_string(classes),
        ));
    }

    body.push("  if (props.className) _cls.push(props.className);".to_string());
    body.push("  var _p = Object.assign({}, props);".to_string());

    // Delete custom props so they don't reach the DOM element
    let mut deletes: Vec<String> = vec!["delete _p.className;".to_string()];
    for k in &variant_keys {
        deletes.push(format!("delete _p.{};", k));
    }
    if !sizes.is_empty() {
        deletes.push("delete _p.size;".to_string());
    }
    for k in &state_keys {
        deletes.push(format!("delete _p.{};", k));
    }
    body.push(format!("  {}", deletes.join(" ")));

    body.push(format!(
        "  return React.createElement(\"{tag}\", Object.assign({{ref: ref}}, _p, {{className: _cls.filter(Boolean).join(\" \")}}));",
        tag = tag,
    ));
    body.push("})".to_string());

    // ── If no sub-components, return the forwardRef directly ─────────────────
    if sub.is_empty() {
        return body.join("\n");
    }

    // ── Wrap in IIFE, attach sub-components via Object.assign ─────────────────
    // (function() {
    //   var _c = React.forwardRef(...);
    //   _c.header = React.forwardRef(function _Tw_Card_header(props, ref) { ... });
    //   return _c;
    // })()
    let mut iife: Vec<String> = Vec::new();
    iife.push("(function() {".to_string());
    iife.push(format!("  var _c = {};", body.join("\n  ")));

    let mut sorted_sub: Vec<_> = sub.iter().collect();
    sorted_sub.sort_by_key(|(k, _)| k.as_str());
    for (sub_name, entry) in sorted_sub {
        let sub_fn = format!("_Tw_{}_{}", comp_name, sub_name);
        iife.push(format!(
            "  _c.{sub_name} = React.forwardRef(function {sub_fn}(props, ref) {{\n    var _sc = [{base_json}];\n    if (props.className) _sc.push(props.className);\n    var _sp = Object.assign({{}}, props); delete _sp.className;\n    return React.createElement(\"{tag}\", Object.assign({{ref: ref}}, _sp, {{className: _sc.filter(Boolean).join(\" \")}}));\n  }});",
            sub_name = sub_name,
            sub_fn = sub_fn,
            base_json = serde_json_string(&entry.base),
            tag = entry.tag,
        ));
    }

    iife.push("  return _c;".to_string());
    iife.push("})()" .to_string());
    iife.join("\n")
}


// ─ OPTIMIZATION (Phase 1.3): Pre-compute component name index for O(1) lookups
// Replaces O(n×m) RE_COMP_NAME.captures_iter().find() pattern with HashMap
fn build_component_name_index(source: &str) -> HashMap<String, usize> {
    let mut index = HashMap::new();
    for cap in RE_COMP_NAME.captures_iter(source) {
        let pos = cap.get(0).map(|m| m.start()).unwrap_or(0);
        let name = cap[1].to_string();
        index.insert(name, pos);
    }
    index
}

// ─ OPTIMIZATION (Phase 3): Hybrid strategy for choosing AST vs Regex
// ─────────────────────────────────────────────────────────────────────────────
// Decides whether to use AST-based or regex-based template extraction
// based on file characteristics
fn should_use_ast_for_templates(source: &str) -> bool {
    // Use AST when:
    // 1. File is large enough to amortize parsing cost (>5KB)
    // 2. Multiple tw templates detected (>3) - TW patterns repeated
    // 3. File contains complex nesting patterns
    let template_count = source.matches("tw.").count();
    let file_size = source.len();

    // Heuristics: AST beneficial when template count * average_size > parsing_overhead
    (file_size > 5000 && template_count > 3) || (file_size > 10000 && template_count > 1)
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponent block parser

pub(crate) const TRANSFORM_MARKER: &str = "/* @tw-transformed */";

#[napi]
pub fn parse_classes(input: String) -> Vec<ParsedClass> {
    parse_classes_inner(&input)
}

#[napi]
pub fn has_tw_usage(source: String) -> Option<bool> {
    let has = source.contains("tw.")
        || source.contains("from \"tailwind-styled-v4\"")
        || source.contains("from 'tailwind-styled-v4'");
    Some(has)
}

#[napi]
pub fn is_already_transformed(source: String) -> Option<bool> {
    Some(source.contains(TRANSFORM_MARKER))
}

#[napi]
pub fn analyze_rsc(source: String, _filename: String) -> RscAnalysis {
    // OPTIMIZATION: pre-allocate for typical hook/event count (max ~20 patterns)
    let mut patterns: Vec<String> = Vec::with_capacity(10);
    let mut reasons: Vec<String> = Vec::with_capacity(8);
    let mut confidence: u32 = 50; // default: heuristic

    // Explicit directives (confidence 100)
    let has_use_client = source.contains("\"use client\"") || source.contains("'use client'");
    let has_use_server = source.contains("\"use server\"") || source.contains("'use server'");

    if has_use_client {
        patterns.push("explicit:use-client".to_string());
        confidence = 100;
    }
    if has_use_server {
        patterns.push("explicit:use-server".to_string());
        confidence = 100;
    }

    let is_server = !has_use_client;

    if is_server {
        // React hooks detection
        let hooks = [
            ("useState", "hooks:useState"),
            ("useEffect", "hooks:useEffect"),
            ("useRef", "hooks:useRef"),
            ("useCallback", "hooks:useCallback"),
            ("useMemo", "hooks:useMemo"),
            ("useContext", "hooks:useContext"),
            ("useReducer", "hooks:useReducer"),
            ("useLayoutEffect", "hooks:useLayoutEffect"),
            ("useTransition", "hooks:useTransition"),
            ("useId", "hooks:useId"),
        ];
        for (hook, pat) in &hooks {
            if source.contains(hook) {
                patterns.push(pat.to_string());
                reasons.push(format!("uses React hook: {}", hook));
                confidence = confidence.max(90);
            }
        }

        // Event handler props
        let events = [
            ("onClick", "event:onClick"),
            ("onChange", "event:onChange"),
            ("onSubmit", "event:onSubmit"),
            ("onKeyDown", "event:onKeyDown"),
            ("onKeyUp", "event:onKeyUp"),
            ("onMouseEnter", "event:onMouseEnter"),
            ("onFocus", "event:onFocus"),
            ("onBlur", "event:onBlur"),
            ("onInput", "event:onInput"),
            ("onScroll", "event:onScroll"),
            ("onTouchStart", "event:onTouchStart"),
            ("onPointerDown", "event:onPointerDown"),
        ];
        for (ev, pat) in &events {
            if source.contains(ev) {
                patterns.push(pat.to_string());
                reasons.push(format!("uses event handler: {}", ev));
                confidence = confidence.max(85);
            }
        }

        // Browser APIs
        let browser_apis = [
            ("window.", "browser:window"),
            ("document.", "browser:document"),
            ("localStorage", "browser:localStorage"),
            ("sessionStorage", "browser:sessionStorage"),
            ("navigator.", "browser:navigator"),
            ("location.", "browser:location"),
            ("history.", "browser:history"),
        ];
        for (api, pat) in &browser_apis {
            if source.contains(api) {
                patterns.push(pat.to_string());
                reasons.push(format!("uses browser API: {}", api.trim_end_matches('.')));
                confidence = confidence.max(80);
            }
        }

        // Dynamic imports with client-only packages
        if source.contains("import(") {
            patterns.push("dynamic-import".to_string());
        }

        // Interactive Tailwind variants — CSS only, NOT a reason for "use client"
        // hover:, focus:, active:, dll dikompilasi ke CSS class, tidak butuh client JS
        if RE_INTERACTIVE.is_match(&source) {
            patterns.push("tw:interactive-variants".to_string());
            // Sengaja TIDAK ditambahkan ke reasons — tidak perlu client boundary
        }
    }

    let needs_client = is_server && !reasons.is_empty();

    RscAnalysis {
        is_server,
        needs_client_directive: needs_client,
        client_reasons: reasons,
        detected_patterns: patterns,
        confidence,
    }
}

#[napi]
pub fn transform_source(source: String, opts: Option<HashMap<String, String>>) -> TransformResult {
    // Guard: already transformed
    if source.contains(TRANSFORM_MARKER) {
        return TransformResult {
            code: source,
            classes: vec![],
            changed: false,
            rsc_json: None,
            metadata_json: None,
        };
    }

    let _opts = opts.unwrap_or_default();
    let mut code = source.clone();
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate main vectors for transform_source
    let mut all_classes: Vec<String> = Vec::with_capacity(32);
    let mut changed = false;
    let mut needs_react = false;
    // OPTIMIZATION: pre-allocate metadata (max 1 per component found)
    let mut all_metadata: Vec<String> = Vec::with_capacity(8);

    // ─ OPTIMIZATION (Phase 1.3): Build component name index once, O(1) lookups in loop
    let comp_name_index = build_component_name_index(&source);

    // STEP 1: tw.tag`classes`  —  Hybrid AST/regex extraction
    {
        let snap = code.clone();
        // OPTIMIZATION: pre-allocate replacements (typical: 1-5 tw components per file)
        let mut replacements: Vec<(String, String)> = Vec::with_capacity(4);

        // ─ OPTIMIZATION (Phase 3): Hybrid AST/regex routing
        if should_use_ast_for_templates(&source) {
            // AST path: parse once, extract structurally
            let (ast_templates, _, had_error) = ast_optimizer::extract_templates_from_ast(&snap);
            if !had_error {
                for tmpl in ast_templates {
                    if is_dynamic(&tmpl.content) {
                        continue;
                    }

                    let comp_name = comp_name_index
                        .iter()
                        .filter(|(_, &pos)| pos < tmpl.position)
                        .max_by_key(|(_, &pos)| pos)
                        .map(|(name, _)| name.clone())
                        .unwrap_or_else(|| format!("Tw_{}", tmpl.tag));

                    let (base_content, sub_comps) =
                        parse_subcomponent_blocks(&tmpl.content, &comp_name);
                    let base_classes_vec = normalise_classes(&base_content);
                    let base_classes = base_classes_vec.join(" ");

                    all_classes.extend(base_classes_vec.clone());
                    for sub in &sub_comps {
                        all_classes.extend(normalise_classes(&sub.classes));
                    }

                    let hash = short_hash(&format!("{}_{}", comp_name, base_classes));
                    let base_scoped = format!("{}_{}", comp_name, hash);
                    let meta = build_metadata_json(&comp_name, &tmpl.tag, &base_scoped, &sub_comps);
                    all_metadata.push(meta);

                    let fn_name = format!("_Tw_{}", comp_name);
                    let replacement = if sub_comps.is_empty() {
                        render_static_component(&tmpl.tag, &base_classes, &fn_name)
                    } else {
                        render_compound_component(
                            &tmpl.tag,
                            &base_classes,
                            &fn_name,
                            &sub_comps,
                            &comp_name,
                        )
                    };

                    // Reconstruct the full match: tw.tag`content`
                    let full_match = format!("tw.{}`{}`", tmpl.tag, tmpl.content);
                    replacements.push((full_match, replacement));
                }
                if !replacements.is_empty() {
                    changed = true;
                    needs_react = true;
                }
            }
        }

        // Regex fallback (or primary path for small files / AST errors)
        if replacements.is_empty() {
            for cap in RE_TEMPLATE.captures_iter(&snap) {
                let full_match = cap[0].to_string();
                let tag = cap[2].to_string();
                let content = cap[3].to_string();

                if is_dynamic(&content) {
                    continue;
                }

                // ─ OPTIMIZATION (Phase 1.3): Use pre-built index instead of O(n×m) regex scan
                // Find nearest component name before this template by looking in index
                let comp_name = {
                    let template_pos = snap.find(&full_match).unwrap_or(0);
                    comp_name_index
                        .iter()
                        .filter(|(_, &pos)| pos < template_pos)
                        .max_by_key(|(_, &pos)| pos)
                        .map(|(name, _)| name.clone())
                        .unwrap_or_else(|| format!("Tw_{}", tag))
                };

                let (base_content, sub_comps) = parse_subcomponent_blocks(&content, &comp_name);

                let base_classes_vec = normalise_classes(&base_content);
                let base_classes = base_classes_vec.join(" ");

                all_classes.extend(base_classes_vec.clone());
                for sub in &sub_comps {
                    all_classes.extend(normalise_classes(&sub.classes));
                }

                let hash = short_hash(&format!("{}_{}", comp_name, base_classes));
                let base_scoped = format!("{}_{}", comp_name, hash);

                let meta = build_metadata_json(&comp_name, &tag, &base_scoped, &sub_comps);
                all_metadata.push(meta);

                let fn_name = format!("_Tw_{}", comp_name);
                let replacement = if sub_comps.is_empty() {
                    render_static_component(&tag, &base_classes, &fn_name)
                } else {
                    render_compound_component(&tag, &base_classes, &fn_name, &sub_comps, &comp_name)
                };

                replacements.push((full_match, replacement));
                changed = true;
                needs_react = true;
            }
        }

        for (from, to) in replacements {
            code = code.replacen(&from, &to, 1);
        }
    }

    // STEP 2: tw(Component)`classes`
    {
        let snap = code.clone();
        let mut replacements: Vec<(String, String)> = Vec::new();

        for cap in RE_WRAP.captures_iter(&snap) {
            let full_match = cap[0].to_string();
            let wrapped_comp = cap[1].to_string();
            let content = cap[2].to_string();

            if is_dynamic(&content) {
                continue;
            }

            let extra = normalise_classes(&content).join(" ");
            all_classes.extend(extra.split_whitespace().map(String::from));
            changed = true;
            needs_react = true;

            let fn_name = format!("_TwWrap_{}", wrapped_comp);
            let replacement = format!(
                "React.forwardRef(function {fn_name}(props, ref) {{\n  var _c = [{extra_json}, props.className].filter(Boolean).join(\" \");\n  return React.createElement({wrapped}, Object.assign({{}}, props, {{ ref, className: _c }}));\n}})",
                fn_name = fn_name,
                extra_json = serde_json_string(&extra),
                wrapped = wrapped_comp,
            );

            replacements.push((full_match, replacement));
        }

        for (from, to) in replacements {
            code = code.replacen(&from, &to, 1);
        }
    }

    // STEP 3: tw.tag({ base, variants, sizes, states }) — object config syntax
    //
    // Unlike STEP 1/2 (template literals), this syntax passes a plain JS object.
    // The Rust transformer parses the object fields at build time and emits a
    // static forwardRef component — no `tw` or native binding needed at runtime.
    //
    // Condition: only process if the inner paren starts with `{` (object literal).
    // Plain function calls like `tw(Component)` are already handled by STEP 2.
    {
        let snap = code.clone();

        // Build component name index for object config declarations:
        //   const Button = tw.button({ ... })  →  "Button"
        let obj_comp_index: HashMap<String, usize> = {
            let mut idx = HashMap::new();
            for cap in RE_OBJ_COMP_NAME.captures_iter(&snap) {
                let pos = cap.get(0).map(|m| m.start()).unwrap_or(0);
                idx.insert(cap[1].to_string(), pos);
            }
            idx
        };

        let mut replacements: Vec<(String, String)> = Vec::with_capacity(4);
        let mut search_from = 0usize;

        loop {
            let slice = &snap[search_from..];
            let cap = match RE_OBJ_CONFIG_START.captures(slice) {
                Some(c) => c,
                None => break,
            };

            let tag = cap[1].to_string();
            let rel_start = cap.get(0).unwrap().start();
            let rel_end = cap.get(0).unwrap().end(); // position right after `(`

            let abs_match_start = search_from + rel_start;
            let abs_paren_pos = search_from + rel_end - 1; // the `(`

            let paren_end = match find_matching_paren_from(&snap, abs_paren_pos) {
                Some(p) => p,
                None => {
                    search_from += rel_end;
                    continue;
                }
            };

            // Inner content between the parens
            let inner_paren = &snap[abs_paren_pos + 1..paren_end];
            let inner_trimmed = inner_paren.trim_start();

            // Guard: must be an object literal `{...}`, not a wrapped component
            if !inner_trimmed.starts_with('{') {
                search_from = paren_end + 1;
                continue;
            }

            // Extract the inner object content (skip outer `{`)
            let obj_content = match extract_brace_inner(inner_trimmed, 1) {
                Some(c) => c.to_string(),
                None => {
                    search_from = paren_end + 1;
                    continue;
                }
            };

            // Parse fields
            let base_raw = extract_string_for_key(&obj_content, "base").unwrap_or_default();
            let base_classes = normalise_classes(&base_raw).join(" ");

            let variants = find_obj_section(&obj_content, "variants")
                .map(parse_nested_string_map)
                .unwrap_or_default();

            let default_variants = find_obj_section(&obj_content, "defaultVariants")
                .map(parse_flat_string_map)
                .unwrap_or_default();

            let sizes = find_obj_section(&obj_content, "sizes")
                .map(parse_flat_string_map)
                .unwrap_or_default();

            let states = find_obj_section(&obj_content, "states")
                .map(parse_flat_string_map)
                .unwrap_or_default();

            let sub = find_obj_section(&obj_content, "sub")
                .map(|s| parse_sub_map(s))
                .unwrap_or_default();

            // Skip if the object is empty / not a TwConfig
            if base_classes.is_empty()
                && variants.is_empty()
                && sizes.is_empty()
                && states.is_empty()
                && sub.is_empty()
            {
                search_from = paren_end + 1;
                continue;
            }

            // Collect all Tailwind classes for content scanning
            all_classes.extend(normalise_classes(&base_classes));
            for inner_map in variants.values() {
                for cls in inner_map.values() {
                    all_classes.extend(normalise_classes(cls));
                }
            }
            for cls in sizes.values() {
                all_classes.extend(normalise_classes(cls));
            }
            for cls in states.values() {
                all_classes.extend(normalise_classes(cls));
            }
            for entry in sub.values() {
                all_classes.extend(normalise_classes(&entry.base));
            }

            // Resolve component name from declaration
            let comp_name = obj_comp_index
                .iter()
                .filter(|(_, &pos)| pos < abs_match_start)
                .max_by_key(|(_, &pos)| pos)
                .map(|(name, _)| name.clone())
                .unwrap_or_else(|| format!("Tw_{}", tag));

            let fn_name = format!("_Tw_{}", comp_name);
            let full_match = snap[abs_match_start..=paren_end].to_string();
            let replacement = render_object_config_component(
                &tag,
                &fn_name,
                &comp_name,
                &base_classes,
                &variants,
                &default_variants,
                &sizes,
                &states,
                &sub,
            );

            replacements.push((full_match, replacement));
            changed = true;
            needs_react = true;

            search_from = paren_end + 1;
        }

        for (from, to) in replacements {
            code = code.replacen(&from, &to, 1);
        }
    }

    if !changed {
        return TransformResult {
            code: source,
            classes: vec![],
            changed: false,
            rsc_json: None,
            metadata_json: None,
        };
    }
    if needs_react
        && !source.contains("import React")
        && !source.contains("from 'react'")
        && !source.contains("from \"react\"")
    {
        code = format!("import React from \"react\";\n{}", code);
    }

    // STEP 4: Strip tw import if no longer needed
    let still_uses_tw = RE_STILL_TW.is_match(&code);
    if !still_uses_tw {
        code = RE_IMPORT_TW.replace_all(&code, "").to_string();
    }

    // STEP 5: Inject transform marker
    code = format!("{}\n{}", TRANSFORM_MARKER, code);

    all_classes.sort();
    all_classes.dedup();

    let metadata_json = if all_metadata.is_empty() {
        None
    } else {
        Some(format!("[{}]", all_metadata.join(",")))
    };

    let rsc = analyze_rsc(source.clone(), String::new());
    let rsc_json = Some(format!(
        "{{\"isServer\":{},\"needsClientDirective\":{}}}",
        rsc.is_server, rsc.needs_client_directive
    ));

    TransformResult {
        code,
        classes: all_classes,
        changed: true,
        rsc_json,
        metadata_json,
    }
}

// ─────────────────────────────────────────────────────────────────────────────