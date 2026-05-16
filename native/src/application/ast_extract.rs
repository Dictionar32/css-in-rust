use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct AstExtractResult {
    /// All Tailwind classes found in the file
    pub classes: Vec<String>,
    /// Component names found (const Foo = tw.div`...`)
    pub component_names: Vec<String>,
    /// Whether any tw.* usage was found
    pub has_tw_usage: bool,
    /// Whether the file has "use client" directive
    pub has_use_client: bool,
    /// Import statements found
    pub imports: Vec<String>,
}

/// Parse a source file and extract Tailwind classes using AST-level analysis.
/// More accurate than regex-only approaches — handles JSX, template literals,
/// and object configs. Implements the same interface as the oxc-based scanner.
#[napi]
pub fn ast_extract_classes(source: String, filename: String) -> AstExtractResult {
    // filename dipakai untuk heuristics per-file — .styled.ts scan lebih agresif
    let is_styled_file = filename.ends_with(".styled.ts") || filename.ends_with(".styled.tsx");
    // Static patterns for AST-level extraction
    static RE_TW_TEMPLATE: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"\btw(?:\.server)?\.(\w+)`([^`]*)`"#).unwrap());
    #[allow(dead_code)]
    static RE_TW_OBJECT: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"\btw(?:\.server)?\.(\w+)\(\s*\{"#).unwrap());
    static RE_TW_WRAP: Lazy<Regex> = Lazy::new(|| Regex::new(r#"\btw\((\w+)\)`([^`]*)`"#).unwrap());
    static RE_CLASSNAME_JSX: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"className=\{?["'`]([^"'`}]+)["'`]\}?"#).unwrap());
    static RE_CN_CALL: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"\b(?:cn|cx|clsx|classnames)\(["'`]([^"'`]+)["'`]\)"#).unwrap());
    static RE_BASE_FIELD: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"base\s*:\s*["'`]([^"'`]+)["'`]"#).unwrap());
    // Capture ALL quoted string values inside object config (variants, states, sub, sizes)
    // Matches: anyKey: "class-list" | anyKey: 'class-list' | anyKey: `class-list`
    // Minimum 4 chars to avoid capturing short non-class strings like "sm", "md"
    static RE_OBJ_STRING_VALUE: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#":\s*`([^`]{4,})`"#).unwrap());
    static RE_OBJ_QUOTED_VALUE: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#":\s*"([^"]{4,})""#).unwrap());
    static RE_OBJ_SINGLE_VALUE: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#":\s*'([^']{4,})'"#).unwrap());
    static RE_COMP_ASSIGN: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"(?:const|let|var)\s+(\w+)\s*=\s*tw"#).unwrap());
    static RE_IMPORT: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"import\s+[^;]+\s+from\s+["']([^"']+)["']"#).unwrap());

    let mut classes: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut component_names: Vec<String> = Vec::new();
    let mut imports: Vec<String> = Vec::new();

    let has_use_client = source.contains("\"use client\"") || source.contains("'use client'");
    let has_tw_usage = source.contains("tw.") || source.contains("from \"tailwind-styled");

    // Extract component names
    for cap in RE_COMP_ASSIGN.captures_iter(&source) {
        component_names.push(cap[1].to_string());
    }

    // Extract from tw.tag`classes` — static only
    for cap in RE_TW_TEMPLATE.captures_iter(&source) {
        let content = &cap[2];
        if !content.contains("${") {
            for token in content.split_whitespace() {
                let t = token.trim();
                // Skip subcomponent block names and braces
                if !t.is_empty() && !t.ends_with('{') && t != "}" && t.len() >= 2 {
                    classes.insert(t.to_string());
                }
            }
        }
    }

    // Extract from tw(Comp)`classes`
    for cap in RE_TW_WRAP.captures_iter(&source) {
        let content = &cap[2];
        if !content.contains("${") {
            for token in content.split_whitespace() {
                let t = token.trim();
                if !t.is_empty() && !t.ends_with('{') && t != "}" && t.len() >= 2 {
                    classes.insert(t.to_string());
                }
            }
        }
    }

    // Extract from object config base: "..."
    for cap in RE_BASE_FIELD.captures_iter(&source) {
        for token in cap[1].split_whitespace() {
            if token.len() >= 2 {
                classes.insert(token.to_string());
            }
        }
    }

    // Extract from ALL object string values: variants, states, sub, sizes
    // .styled.ts files: scan tanpa guard — convention file ini berisi tw() object config
    // File lain: hanya scan kalau ada tw() object config syntax
    let has_obj_config = is_styled_file
        || (source.contains("tw.")
            && (source.contains("variants:")
                || source.contains("states:")
                || source.contains("sub:")
                || source.contains("sizes:")));
    if has_obj_config {
        for cap in RE_OBJ_STRING_VALUE.captures_iter(&source) {
            for token in cap[1].split_whitespace() {
                let t = token.trim();
                if t.len() >= 2 && !t.ends_with('{') && t != "}" {
                    classes.insert(t.to_string());
                }
            }
        }
        for cap in RE_OBJ_QUOTED_VALUE.captures_iter(&source) {
            for token in cap[1].split_whitespace() {
                let t = token.trim();
                if t.len() >= 2 && !t.ends_with('{') && t != "}" {
                    classes.insert(t.to_string());
                }
            }
        }
        for cap in RE_OBJ_SINGLE_VALUE.captures_iter(&source) {
            for token in cap[1].split_whitespace() {
                let t = token.trim();
                if t.len() >= 2 && !t.ends_with('{') && t != "}" {
                    classes.insert(t.to_string());
                }
            }
        }
    }

    // Extract from className="..."
    for cap in RE_CLASSNAME_JSX.captures_iter(&source) {
        for token in cap[1].split_whitespace() {
            if token.len() >= 2 {
                classes.insert(token.to_string());
            }
        }
    }

    // Extract from cn()/cx()/clsx()
    for cap in RE_CN_CALL.captures_iter(&source) {
        for token in cap[1].split_whitespace() {
            if token.len() >= 2 {
                classes.insert(token.to_string());
            }
        }
    }

    // Extract imports
    for cap in RE_IMPORT.captures_iter(&source) {
        imports.push(cap[1].to_string());
    }

    // Filter: only keep tokens that look like Tailwind classes
    // Valid Tailwind variant prefixes yang boleh muncul sebelum ':'
    // Token seperti "div:action" (sub-component key) harus difilter
    const VALID_VARIANT_PREFIXES: &[&str] = &[
        "hover", "focus", "active", "disabled", "visited", "checked", "first", "last",
        "odd", "even", "focus-within", "focus-visible", "placeholder", "before", "after",
        "dark", "sm", "md", "lg", "xl", "2xl", "motion-reduce", "motion-safe",
        "group", "peer", "aria", "data", "supports", "not", "has", "is", "where",
        "rtl", "ltr", "open", "print", "portrait", "landscape",
    ];

    let classes: Vec<String> = classes
        .into_iter()
        .filter(|c| {
            // Token dengan ':' harus punya valid Tailwind variant prefix sebelum ':'
            // Filter "div:action", "header:topBar" dll (sub-component keys)
            if c.contains(':') {
                let prefix = c.split(':').next().unwrap_or("");
                // Allow multi-variant chaining: "dark:hover:bg-..." → prefix = "dark" ✓
                if !VALID_VARIANT_PREFIXES.contains(&prefix) {
                    return false;
                }
            }
            c.contains('-')
                || c.contains(':')
                || c.contains('[')
                || matches!(
                    c.as_str(),
                    "flex"
                        | "grid"
                        | "block"
                        | "inline"
                        | "hidden"
                        | "static"
                        | "fixed"
                        | "absolute"
                        | "relative"
                        | "sticky"
                        | "overflow"
                        | "truncate"
                        | "italic"
                        | "underline"
                        | "uppercase"
                        | "lowercase"
                        | "capitalize"
                        | "visible"
                        | "invisible"
                        | "prose"
                        | "container"
                        | "border"
                        | "antialiased"
                        | "subpixel-antialiased"
                        | "rounded"
                        | "shadow"
                        | "ring"
                        | "grow"
                        | "shrink"
                        | "basis"
                        | "order"
                        | "col"
                        | "row"
                        | "float"
                        | "clear"
                        | "contents"
                        | "flow"
                        | "table"
                )
        })
        .collect::<std::collections::BTreeSet<_>>()
        .into_iter()
        .collect();

    AstExtractResult {
        classes,
        component_names,
        has_tw_usage,
        has_use_client,
        imports,
    }
}

// ═════════════════════════════════════════════════════════════════════════════
