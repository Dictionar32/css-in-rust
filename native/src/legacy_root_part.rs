/*
 * tailwind-styled-v4 — Native Rust Engine
 *
 * Exposes the following to Node.js via N-API:
 *   parse_classes           — tokenise + parse individual class tokens
 *   has_tw_usage            — fast pre-check before running the full transform
 *   is_already_transformed  — idempotency guard
 *   transform_source        — full compile: extract → normalise → generate component code
 *   analyze_rsc             — detect RSC / "use client" boundary
 *
 * Also exposes C ABI symbols for bindings/ (Go, Swift, …):
 *   tailwind_compile, tailwind_compile_with_stats,
 *   tailwind_free, tailwind_version, tailwind_clear_cache
 *
 * Subcomponent block syntax supported by transform_source:
 *   const Button = tw.button`
 *     bg-blue-500 text-white
 *     icon { mr-2 w-5 h-5 }
 *     text { font-medium }
 *   `
 */

use dashmap::DashMap;
use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
// ─ OPTIMIZATION (Phase 2): Parallel iterators for workspace scanning
use rayon::prelude::*;

// Sub-modules ───────────────────────────────────────────────────────────────
mod oxc_parser;
mod scan_cache;
mod watcher;
// ─ OPTIMIZATION (Phase 3): AST-optimized template detection
mod ast_optimizer;

// ─ OPTIMIZATION (Phase 2.4): Thread pool configuration for parallelism control
mod thread_pool {
    use once_cell::sync::Lazy;
    use rayon::ThreadPoolBuilder;

    /// Global thread pool for workspace scanning operations.
    /// Size limited to CPU count to prevent oversubscription.
    pub static SCAN_THREAD_POOL: Lazy<rayon::ThreadPool> = Lazy::new(|| {
        let num_threads = num_cpus::get();
        ThreadPoolBuilder::new()
            .num_threads(num_threads)
            .stack_size(4 * 1024 * 1024) // 4MB per thread (reasonable for file I/O)
            .build()
            .expect("Failed to create thread pool")
    });
}

// ─── Lazy-compiled regexes (compiled once at first use, reused across calls) ──
static RE_TOKEN: Lazy<Regex> = Lazy::new(|| Regex::new(r"\S+").unwrap());
static RE_OPACITY: Lazy<Regex> = Lazy::new(|| Regex::new(r"^(.*)/(\d{1,3})$").unwrap());
static RE_ARBITRARY: Lazy<Regex> = Lazy::new(|| Regex::new(r"\((--[a-zA-Z0-9_-]+)\)").unwrap());
static RE_BLOCK: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?m)\b([a-z][a-zA-Z0-9_]*)\s*\{([^}]*)\}").unwrap());
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
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

fn short_hash(input: &str) -> String {
    let mut h: u64 = 5381;
    for b in input.bytes() {
        h = h.wrapping_mul(33).wrapping_add(b as u64);
    }
    format!("{:06x}", h & 0xFF_FFFF)
}

fn parse_classes_inner(input: &str) -> Vec<ParsedClass> {
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate vector based on whitespace token count estimates
    // Typical case: 10-15 classes per template, reducing realloc from ~5 to ~0 times
    let estimated_capacity = input.split_whitespace().count().max(1);
    let mut out: Vec<ParsedClass> = Vec::with_capacity(estimated_capacity);

    for m in RE_TOKEN.find_iter(input) {
        let token = m.as_str();
        let parts: Vec<&str> = token.split(':').collect();
        let variants = if parts.len() > 1 {
            parts[0..parts.len() - 1]
                .iter()
                .map(|s| s.to_string())
                .collect()
        } else {
            Vec::new()
        };
        let base: String = parts.last().unwrap_or(&"").to_string();

        let mut parsed = ParsedClass {
            raw: token.to_string(),
            base: base.clone(),
            variants,
            modifier_type: None,
            modifier_value: None,
        };

        if let Some(c) = RE_OPACITY.captures(&base) {
            parsed.base = c[1].to_string();
            parsed.modifier_type = Some("opacity".to_string());
            parsed.modifier_value = Some(c[2].to_string());
        } else if let Some(c) = RE_ARBITRARY.captures(&base) {
            parsed.modifier_type = Some("arbitrary".to_string());
            parsed.modifier_value = Some(c[1].to_string());
        }

        out.push(parsed);
    }
    out
}

fn normalise_classes(raw: &str) -> Vec<String> {
    let parsed = parse_classes_inner(raw);
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate with exact capacity
    let mut classes: Vec<String> = Vec::with_capacity(parsed.len());
    for p in parsed {
        classes.push(p.raw);
    }
    classes.sort();
    classes.dedup();
    classes
}

fn serde_json_string(s: &str) -> String {
    // ─ OPTIMIZATION (Phase 1.2): Use serde_json for proper escaping instead of manual string replace
    serde_json::to_string(s).unwrap_or_else(|_| format!("\"{}\"", s.replace('"', "\\\"")))
}

fn is_dynamic(content: &str) -> bool {
    content.contains("${")
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
// ─────────────────────────────────────────────────────────────────────────────

fn parse_subcomponent_blocks(template: &str, component_name: &str) -> (String, Vec<SubComponent>) {
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate sub_components vector
    let mut sub_components: Vec<SubComponent> = Vec::new();
    let mut stripped = template.to_string();

    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate matches vector with estimated capacity
    let mut matches: Vec<(String, String, String)> = Vec::new();
    for c in RE_BLOCK.captures_iter(template) {
        matches.push((c[0].to_string(), c[1].to_string(), c[2].to_string()));
    }

    for (full_match, sub_name, sub_classes_raw) in &matches {
        let sub_classes = sub_classes_raw.trim().to_string();
        if sub_classes.is_empty() {
            continue;
        }

        let sub_tag = match sub_name.as_str() {
            "label" => "label",
            "input" => "input",
            "img" | "image" => "img",
            "header" => "header",
            "footer" => "footer",
            _ => "span",
        };

        let hash_input = format!("{}_{}_{}", component_name, sub_name, sub_classes);
        let hash = short_hash(&hash_input);
        let scoped_class = format!("{}_{}_{}", component_name, sub_name, hash);

        sub_components.push(SubComponent {
            name: sub_name.clone(),
            tag: sub_tag.to_string(),
            classes: sub_classes.clone(),
            scoped_class,
        });

        stripped = stripped.replace(full_match.as_str(), "");
    }

    (stripped.trim().to_string(), sub_components)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component code generators
// ─────────────────────────────────────────────────────────────────────────────

fn render_static_component(tag: &str, classes: &str, fn_name: &str) -> String {
    format!(
        "React.forwardRef(function {fn_name}(props, ref) {{\n  var _c = props.className;\n  var _r = Object.assign({{}}, props);\n  delete _r.className;\n  return React.createElement(\"{tag}\", Object.assign({{ ref }}, _r, {{ className: [{classes_json}, _c].filter(Boolean).join(\" \") }}));\n}})",
        fn_name = fn_name,
        tag = tag,
        classes_json = serde_json_string(classes),
    )
}

fn render_compound_component(
    tag: &str,
    base_classes: &str,
    fn_name: &str,
    sub_components: &[SubComponent],
    component_name: &str,
) -> String {
    let base = format!(
        "React.forwardRef(function {fn_name}(props, ref) {{\n  var _c = props.className;\n  var _r = Object.assign({{}}, props);\n  delete _r.className;\n  return React.createElement(\"{tag}\", Object.assign({{ ref }}, _r, {{ className: [{base_json}, _c].filter(Boolean).join(\" \") }}));\n}})",
        fn_name = fn_name,
        tag = tag,
        base_json = serde_json_string(base_classes),
    );

    if sub_components.is_empty() {
        return base;
    }

    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate sub_assignments vector
    let mut sub_assignments: Vec<String> = Vec::with_capacity(sub_components.len());
    for sub in sub_components {
        let sub_fn = format!("_Tw_{}_{}", component_name, sub.name);
        sub_assignments.push(format!(
            "  _base.{sub_name} = React.forwardRef(function {sub_fn}(props, ref) {{\n    var _c = props.className;\n    var _r = Object.assign({{}}, props);\n    delete _r.className;\n    return React.createElement(\"{tag}\", Object.assign({{ ref }}, _r, {{ className: [{scoped}, _c].filter(Boolean).join(\" \") }}));\n  }});",
            sub_name = sub.name,
            sub_fn = sub_fn,
            tag = sub.tag,
            scoped = serde_json_string(&sub.scoped_class),
        ));
    }

    format!(
        "(function() {{\n  var _base = {base};\n{subs}\n  return _base;\n}})()",
        base = base,
        subs = sub_assignments.join("\n"),
    )
}

fn build_metadata_json(
    component_name: &str,
    tag: &str,
    base_class: &str,
    sub_components: &[SubComponent],
) -> String {
    // ─ OPTIMIZATION: Use serde_json for correct escaping + no manual format! strings
    use serde_json::{json, Value};

    let subs: serde_json::Map<String, Value> = sub_components
        .iter()
        .map(|s| {
            (s.name.clone(), json!({ "tag": s.tag, "class": s.scoped_class }))
        })
        .collect();

    let meta = json!({
        "component": component_name,
        "tag": tag,
        "baseClass": base_class,
        "subComponents": subs,
    });

    serde_json::to_string(&meta)
        .unwrap_or_else(|_| format!("{{\"component\":\"{component_name}\"}}"))
}

// ─────────────────────────────────────────────────────────────────────────────
// N-API exports
// ─────────────────────────────────────────────────────────────────────────────

const TRANSFORM_MARKER: &str = "/* @tw-transformed */";

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

        // Interactive Tailwind variants
        if RE_INTERACTIVE.is_match(&source) {
            patterns.push("tw:interactive-variants".to_string());
            reasons.push("uses interactive Tailwind variants (hover:, focus:, etc.)".to_string());
            confidence = confidence.max(60);
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

    if !changed {
        return TransformResult {
            code: source,
            classes: vec![],
            changed: false,
            rsc_json: None,
            metadata_json: None,
        };
    }

    // STEP 3: Ensure React import
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
// C ABI
// ─────────────────────────────────────────────────────────────────────────────

fn build_css_from_input(input: &str) -> (String, Vec<String>) {
    let mut classes = normalise_classes(input);
    classes.sort();
    classes.dedup();
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate CSS lines vector
    let mut css_parts: Vec<String> = Vec::with_capacity(classes.len());
    for c in &classes {
        css_parts.push(format!(".{} {{ @apply {}; }}", c, c));
    }
    let css = css_parts.join("\n");
    (css, classes)
}

fn escape_json_string(value: &str) -> String {
    // ─ OPTIMIZATION (Phase 1.2): Use serde_json for proper escaping
    serde_json::to_string(value).unwrap_or_else(|_| format!("\"{}\"", value.replace('"', "\\\"")))
}

fn build_compile_stats_json(input: &str) -> String {
    let t0 = std::time::Instant::now();
    let parsed = parse_classes_inner(input);
    let parse_ms = t0.elapsed().as_secs_f64() * 1000.0;
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate classes vector with exact capacity
    let mut classes: Vec<String> = Vec::with_capacity(parsed.len());
    for p in parsed {
        classes.push(p.raw);
    }
    classes.sort();
    classes.dedup();
    let t1 = std::time::Instant::now();
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate CSS lines vector
    let mut css_parts: Vec<String> = Vec::with_capacity(classes.len());
    for c in &classes {
        css_parts.push(format!(".{} {{ @apply {}; }}", c, c));
    }
    let css = css_parts.join("\n");
    let gen_ms = t1.elapsed().as_secs_f64() * 1000.0;
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate classes_json vector
    let mut classes_json_parts: Vec<String> = Vec::with_capacity(classes.len());
    for c in &classes {
        classes_json_parts.push(format!("\"{}\"", escape_json_string(c)));
    }
    let classes_json = classes_json_parts.join(",");
    format!(
        "{{\"css\":\"{}\",\"classes\":[{}],\"stats\":{{\"parse_time_ms\":{:.3},\"generate_time_ms\":{:.3},\"class_count\":{},\"css_size\":{}}}}}",
        escape_json_string(&css), classes_json, parse_ms, gen_ms, classes.len(), css.len()
    )
}

fn c_string_or_empty(value: String) -> *mut c_char {
    CString::new(value)
        .unwrap_or_else(|_| CString::new("").expect("empty"))
        .into_raw()
}

fn c_ptr_to_string(code: *const c_char) -> String {
    if code.is_null() {
        return String::new();
    }
    unsafe { CStr::from_ptr(code).to_string_lossy().into_owned() }
}

#[no_mangle]
pub extern "C" fn tailwind_compile(code: *const c_char) -> *mut c_char {
    let source = c_ptr_to_string(code);
    let (css, _) = build_css_from_input(&source);
    c_string_or_empty(css)
}

#[no_mangle]
pub extern "C" fn tailwind_compile_with_stats(code: *const c_char) -> *mut c_char {
    let source = c_ptr_to_string(code);
    c_string_or_empty(build_compile_stats_json(&source))
}

#[no_mangle]
pub extern "C" fn tailwind_free(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(CString::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn tailwind_version() -> *const c_char {
    concat!(env!("CARGO_PKG_VERSION"), "\0").as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn tailwind_clear_cache() {}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_classes_keeps_variants_and_modifiers() {
        let out = parse_classes("hover:bg-blue-500 text-white/80 bg-(--brand)".to_string());
        assert_eq!(out.len(), 3);
        assert_eq!(out[0].raw, "hover:bg-blue-500");
        assert_eq!(out[0].variants, vec!["hover"]);
        assert_eq!(out[1].modifier_type.as_deref(), Some("opacity"));
        assert_eq!(out[2].modifier_type.as_deref(), Some("arbitrary"));
    }

    #[test]
    fn has_tw_usage_detects_tw_dot() {
        assert_eq!(
            has_tw_usage("const X = tw.div`foo`".to_string()),
            Some(true)
        );
        assert_eq!(has_tw_usage("const X = 1".to_string()), Some(false));
    }

    #[test]
    fn is_already_transformed_detects_marker() {
        let marked = format!("{}\nconst X = 1;", TRANSFORM_MARKER);
        assert_eq!(is_already_transformed(marked), Some(true));
        assert_eq!(
            is_already_transformed("const X = 1;".to_string()),
            Some(false)
        );
    }

    #[test]
    fn parse_subcomponent_blocks_extracts_blocks() {
        let t = "bg-blue-500 text-white\n  icon { mr-2 w-5 h-5 }\n  text { font-medium }";
        let (stripped, subs) = parse_subcomponent_blocks(t, "Button");
        assert_eq!(subs.len(), 2);
        assert_eq!(subs[0].name, "icon");
        assert_eq!(subs[1].name, "text");
        assert!(!stripped.contains("icon {"));
        assert!(stripped.contains("bg-blue-500"));
    }

    #[test]
    fn parse_subcomponent_blocks_scoped_class_is_deterministic() {
        let t = "bg-blue-500\n  icon { mr-2 }";
        let (_, s1) = parse_subcomponent_blocks(t, "Button");
        let (_, s2) = parse_subcomponent_blocks(t, "Button");
        assert_eq!(s1[0].scoped_class, s2[0].scoped_class);
    }

    #[test]
    fn transform_source_handles_simple_template() {
        let src = "import { tw } from \"tailwind-styled-v4\";\nconst Button = tw.button`bg-blue-500 text-white px-4`;\n";
        let result = transform_source(src.to_string(), None);
        assert!(result.changed);
        assert!(result.code.contains(TRANSFORM_MARKER));
        assert!(result.code.contains("React.forwardRef"));
        assert!(result.classes.contains(&"bg-blue-500".to_string()));
    }

    #[test]
    fn transform_source_skips_already_transformed() {
        let src = format!("{}\nconst X = 1;", TRANSFORM_MARKER);
        let result = transform_source(src.clone(), None);
        assert!(!result.changed);
    }

    #[test]
    fn transform_source_skips_dynamic_templates() {
        let src = "import { tw } from \"tailwind-styled-v4\";\nconst B = tw.button`bg-blue-500 ${props => props.x && \"ring-2\"}`;\n";
        let result = transform_source(src.to_string(), None);
        assert!(!result.changed);
    }

    #[test]
    fn c_abi_compile_roundtrip() {
        let src = CString::new("bg-blue-500 text-white").expect("valid input");
        let ptr = tailwind_compile(src.as_ptr());
        assert!(!ptr.is_null());
        let css = unsafe { CStr::from_ptr(ptr) }
            .to_string_lossy()
            .into_owned();
        assert!(css.contains(".bg-blue-500"));
        tailwind_free(ptr);
    }

    #[test]
    fn build_metadata_json_output() {
        let subs = vec![SubComponent {
            name: "icon".to_string(),
            tag: "span".to_string(),
            classes: "mr-2 w-5".to_string(),
            scoped_class: "Button_icon_abc123".to_string(),
        }];
        let meta = build_metadata_json("Button", "button", "Button_abc123", &subs);
        assert!(meta.contains("\"component\":\"Button\""));
        assert!(meta.contains("\"icon\""));
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ANALYZER — class frequency analysis, duplicate detection, safelist generation
// ═════════════════════════════════════════════════════════════════════════════

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ClassCount {
    pub name: String,
    pub count: u32,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct AnalyzerReport {
    pub root: String,
    pub total_files: u32,
    pub unique_class_count: u32,
    pub total_class_occurrences: u32,
    pub top_classes: Vec<ClassCount>,
    pub duplicate_candidates: Vec<ClassCount>,
    /// Safelist: all classes that must be retained regardless of usage
    pub safelist: Vec<String>,
}

/// Analyse a list of (file, classes[]) pairs and return a full report.
///
/// `files_json` is a JSON string: `[{"file":"...","classes":["cls1","cls2"]},...]`
/// This mirrors the ScanWorkspaceResult shape from @tailwind-styled/scanner.
#[napi]
pub fn analyze_classes(files_json: String, root: String, top_n: u32) -> AnalyzerReport {
    // Parse input JSON — fallback to empty on any parse error
    let files: Vec<serde_json_classes::FileEntry> =
        serde_json_classes::parse_files_json(&files_json).unwrap_or_default();

    let mut counts: std::collections::HashMap<String, u32> = std::collections::HashMap::new();
    let mut total_occurrences: u32 = 0;

    for file in &files {
        for cls in &file.classes {
            *counts.entry(cls.clone()).or_insert(0) += 1;
            total_occurrences += 1;
        }
    }

    let mut sorted: Vec<(String, u32)> = counts.into_iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));

    let top_n = top_n as usize;
    let unique_count = sorted.len() as u32;

    let top_classes = sorted
        .iter()
        .take(top_n)
        .map(|(name, count)| ClassCount {
            name: name.clone(),
            count: *count,
        })
        .collect();

    let duplicate_candidates = sorted
        .iter()
        .filter(|(_, count)| *count > 1)
        .take(top_n)
        .map(|(name, count)| ClassCount {
            name: name.clone(),
            count: *count,
        })
        .collect();

    // Safelist: every class that appears in any file
    let mut safelist: Vec<String> = sorted.iter().map(|(name, _)| name.clone()).collect();
    safelist.sort();

    AnalyzerReport {
        root,
        total_files: files.len() as u32,
        unique_class_count: unique_count,
        total_class_occurrences: total_occurrences,
        top_classes,
        duplicate_candidates,
        safelist,
    }
}

/// Minimal JSON parser for the files array — avoids pulling in serde_json.
mod serde_json_classes {
    pub struct FileEntry {
        pub _file: String,
        pub classes: Vec<String>,
    }

    pub fn parse_files_json(input: &str) -> Option<Vec<FileEntry>> {
        // Quick-and-dirty extraction: find all "classes":[...] arrays
        // This is intentionally simple; production would use serde_json.
        let mut entries: Vec<FileEntry> = Vec::new();
        let input = input.trim();
        if !input.starts_with('[') {
            return Some(entries);
        }

        // Split by "file": to find each entry
        for chunk in input.split(r#""file":"#).skip(1) {
            let file_end = chunk.find('"')?;
            let file = chunk[..file_end].trim_matches('"').to_string();

            let classes = if let Some(cls_start) = chunk.find(r#""classes":["#) {
                let after = &chunk[cls_start + r#""classes":["#.len()..];
                let cls_end = after.find(']').unwrap_or(after.len());
                let cls_str = &after[..cls_end];
                cls_str
                    .split(',')
                    .map(|s| s.trim().trim_matches('"').to_string())
                    .filter(|s| !s.is_empty())
                    .collect()
            } else {
                Vec::new()
            };

            entries.push(FileEntry {
                _file: file,
                classes,
            });
        }

        Some(entries)
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// ANIMATE — compile-time animation DSL → @keyframes CSS
// ═════════════════════════════════════════════════════════════════════════════

/// Static map of Tailwind class → CSS property (subset used by animations)
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
fn classes_to_css(classes: &str) -> String {
    let mut transforms: Vec<String> = Vec::new();
    let mut others: Vec<String> = Vec::new();

    for cls in classes.split_whitespace() {
        if let Some(css) = tw_to_css(cls) {
            if css.starts_with("transform:") {
                transforms.push(css["transform:".len()..].trim().to_string());
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

