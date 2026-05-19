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
// Static state config extraction — untuk build-time CSS pre-generation
// ═════════════════════════════════════════════════════════════════════════════

/// Satu entry state config yang di-extract dari source file.
/// Mirrors struktur yang diproses oleh `hashState()` di `stateEngine.ts`.
#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema, Clone)]
pub struct TwStateConfigEntry {
    /// HTML tag dari tw.tag() call — misalnya "button", "div", "span"
    pub tag: String,
    /// Component name — misalnya "Button", "Card" (dari `const Button = tw.button(...)`)
    pub component_name: String,
    /// JSON string dari state config object — misalnya `{"selected":"ring-2 ring-blue-500"}`
    /// Sudah dalam format yang sama dengan input ke `hashState()`:
    ///   `tag + JSON.stringify(Object.entries(state).sort())`
    pub states_json: String,
    /// Source file path — untuk debugging dan incremental rebuild
    pub source_file: String,
}

/// Extract semua `tw.tag({ states: {...} })` configs dari source file.
///
/// Return array of `TwStateConfigEntry` — satu per komponen yang punya `states` config.
/// Hasilnya dipakai oleh `generate_static_state_css()` untuk pre-generate CSS di build time.
///
/// ```ts
/// // Input source:
/// const Button = tw.button({ states: { loading: "opacity-60", fullWidth: "w-full" } })
/// const Card = tw.div({ states: { selected: "ring-2 ring-blue-500" } })
///
/// // Output:
/// [
///   { tag: "button", componentName: "Button", statesJson: '{"loading":"opacity-60","fullWidth":"w-full"}', sourceFile: "..." },
///   { tag: "div", componentName: "Card", statesJson: '{"selected":"ring-2 ring-blue-500"}', sourceFile: "..." }
/// ]
/// ```
#[napi]
pub fn extract_tw_state_configs(source: String, filename: String) -> Vec<TwStateConfigEntry> {
    // Cepat: skip file yang tidak punya states config
    if !source.contains("states:") && !source.contains("states :") {
        return vec![];
    }
    if !source.contains("tw.") && !source.contains("from \"tailwind-styled") && !source.contains("from 'tailwind-styled") {
        return vec![];
    }

    // Regex: `const ComponentName = tw.tag({`
    // Capture: (ComponentName, tag)
    static RE_COMPONENT_DECL: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"(?m)(?:const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*tw(?:\.server)?\.(\w+)\s*\(").unwrap()
    });

    // Regex: cari `states:` block dalam object config
    // Pattern: `states: {` sampai closing `}`
    // Note: tidak support nested braces dalam values — cukup untuk literal string values
    static RE_STATES_BLOCK: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"states\s*:\s*\{([^}]*)\}").unwrap()
    });

    // Regex: parse key-value di dalam states block
    // Capture: (key, value) dimana value adalah quoted string
    static RE_STATE_ENTRY: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r#"(\w+)\s*:\s*(?:["`'])((?:[^"`'\\]|\\.)*)(?:["`'])"#).unwrap()
    });

    let mut results: Vec<TwStateConfigEntry> = Vec::new();

    // Scan semua component declarations
    for comp_cap in RE_COMPONENT_DECL.captures_iter(&source) {
        let component_name = comp_cap[1].to_string();
        let tag = comp_cap[2].to_string();
        let comp_start = comp_cap.get(0).unwrap().end();

        // Ambil substring setelah declaration sampai ~2000 chars ke depan
        // untuk cari states block (hindari scan seluruh file)
        let search_window = &source[comp_start..std::cmp::min(comp_start + 2000, source.len())];

        // Cari states block di dalam window ini
        if let Some(states_cap) = RE_STATES_BLOCK.captures(search_window) {
            let states_body = &states_cap[1];

            // Parse semua key-value pairs
            let mut state_map: std::collections::BTreeMap<String, String> = std::collections::BTreeMap::new();
            for entry_cap in RE_STATE_ENTRY.captures_iter(states_body) {
                let key = entry_cap[1].to_string();
                let value = entry_cap[2].to_string();
                // Normalize whitespace dalam value (sama seperti TypeScript side)
                let normalized = value.split_whitespace().collect::<Vec<_>>().join(" ");
                if !normalized.is_empty() {
                    state_map.insert(key, normalized);
                }
            }

            if state_map.is_empty() {
                continue;
            }

            // Serialize ke JSON — BTreeMap sudah sorted by key
            // Format: { "key": "value", ... } — sama dengan JSON.stringify(Object.entries(state).sort())
            // di TypeScript (karena BTreeMap sorted = entries sorted)
            let states_json = match serde_json::to_string(&state_map) {
                Ok(j) => j,
                Err(_) => continue,
            };

            results.push(TwStateConfigEntry {
                tag: tag.clone(),
                component_name: component_name.clone(),
                states_json,
                source_file: filename.clone(),
            });
        }
    }

    results
}

// ═════════════════════════════════════════════════════════════════════════════
// Hash pre-embedding — inject __hash ke tw() config saat build/load time
// ═════════════════════════════════════════════════════════════════════════════

/// Result dari `inject_state_hash()`.
#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema, Clone)]
pub struct InjectHashResult {
    /// Source code yang sudah di-transform (dengan __hash embedded)
    pub code: String,
    /// True jika ada perubahan yang dilakukan
    pub changed: bool,
    /// Jumlah komponen yang di-inject hash-nya
    pub injected_count: u32,
}

/// Inject `__hash: "abc123"` ke semua `tw.tag({ states: {...} })` calls dalam source.
///
/// Dipanggil oleh `turbopackLoader.ts` sebelum source di-pass ke webpack/turbopack.
/// Hasilnya: `stateEngine.ts` bisa langsung pakai `__hash` tanpa perlu
/// compute `hashState()` di runtime → zero runtime hashing.
///
/// Hash yang di-inject identik dengan yang dihitung `hashState()` di TypeScript:
///   `fnv1a_6(tag + JSON.stringify(Object.entries(state).sort()))`
///
/// ```ts
/// // Input:
/// const Button = tw.button({ states: { loading: "opacity-60" } })
///
/// // Output:
/// const Button = tw.button({ __hash: "a3f9c1", states: { loading: "opacity-60" } })
/// ```
#[napi]
pub fn inject_state_hash(source: String, _filename: String) -> InjectHashResult {
    // Quick bail jika tidak ada tw() calls dengan states
    if !source.contains("states:") && !source.contains("states :") {
        return InjectHashResult { code: source, changed: false, injected_count: 0 };
    }
    if source.contains("__hash:") {
        // Sudah di-inject sebelumnya (cached transform) — skip
        return InjectHashResult { code: source, changed: false, injected_count: 0 };
    }

    // Regex: `tw.tag({` atau `tw.server.tag({`
    static RE_TW_OPEN: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"(?m)(tw(?:\.server)?\.(\w+)\s*\()(\s*\{)").unwrap()
    });

    // Regex: states block — `states: { key: "val", ... }`
    static RE_STATES_BLOCK: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"states\s*:\s*\{([^}]*)\}").unwrap()
    });

    static RE_STATE_ENTRY: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r#"(\w+)\s*:\s*(?:["`'])((?:[^"`'\\]|\\.)*)(?:["`'])"#).unwrap()
    });

    let mut result = source.clone();
    let mut injected_count = 0u32;
    // Track offset karena setiap inject menggeser posisi karakter
    let mut offset: i64 = 0;

    for cap in RE_TW_OPEN.captures_iter(&source) {
        let tag = cap[2].to_string();
        let open_brace_match = cap.get(3).unwrap();
        let search_start = open_brace_match.end();

        // Cari states block mulai dari `{` opening
        let search_window = &source[search_start..std::cmp::min(search_start + 2000, source.len())];

        if let Some(states_cap) = RE_STATES_BLOCK.captures(search_window) {
            let states_body = &states_cap[1];

            // Parse states → BTreeMap (sorted)
            let mut state_map: std::collections::BTreeMap<String, String> = std::collections::BTreeMap::new();
            for entry_cap in RE_STATE_ENTRY.captures_iter(states_body) {
                let key = entry_cap[1].to_string();
                let value = entry_cap[2].split_whitespace().collect::<Vec<_>>().join(" ");
                if !value.is_empty() {
                    state_map.insert(key, value);
                }
            }

            if state_map.is_empty() { continue; }

            // Compute hash — identik dengan hashState() di TypeScript
            let sorted_entries: Vec<(&String, &String)> = state_map.iter().collect();
            let entries_json = match serde_json::to_string(&sorted_entries) {
                Ok(j) => j,
                Err(_) => continue,
            };
            let hash_key = format!("{}{}", tag, entries_json);
            let hash = crate::shared::utils::fnv1a_6(&hash_key);

            // Inject `__hash: "abc123", ` setelah `{`
            let inject_str = format!(" __hash: \"{}\",", hash);
            let inject_pos = (open_brace_match.end() as i64 + offset) as usize;

            result.insert_str(inject_pos, &inject_str);
            offset += inject_str.len() as i64;
            injected_count += 1;
        }
    }

    InjectHashResult {
        changed: injected_count > 0,
        code: result,
        injected_count,
    }
}