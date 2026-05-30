use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ThemeToken {
    pub key: String,
    pub css_var: String,
    pub value: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CompiledTheme {
    /// Theme name (e.g. "light", "dark", "brand")
    pub name: String,
    /// CSS selector for this theme (e.g. ":root", "[data-theme='dark']")
    pub selector: String,
    /// Full CSS block: selector { --token-name: value; ... }
    pub css: String,
    /// All tokens in this theme
    pub tokens: Vec<ThemeToken>,
}

/// Parse a token map JSON and compile it into a CSS variable block.
///
/// `tokens_json`: `{"color":{"primary":"#3b82f6","secondary":"#8b5cf6"},"spacing":{"sm":"0.5rem"}}`
/// `theme_name`:  "light" | "dark" | "brand" | etc.
/// `prefix`:      CSS variable prefix, e.g. "tw" → `--tw-color-primary`
#[napi]
pub fn compile_theme(tokens_json: String, theme_name: String, prefix: String) -> CompiledTheme {
    let selector = if theme_name == "light" || theme_name == "default" {
        ":root".to_string()
    } else {
        format!("[data-theme='{}']", theme_name)
    };

    let mut css_lines: Vec<String> = Vec::new();
    let mut tokens: Vec<ThemeToken> = Vec::new();

    static RE_CATEGORY: Lazy<Regex> = Lazy::new(|| Regex::new(r#""([^"]+)":\{([^}]+)\}"#).unwrap());
    static RE_KV: Lazy<Regex> = Lazy::new(|| Regex::new(r#""([^"]+)":"([^"]*)""#).unwrap());

    for cat_cap in RE_CATEGORY.captures_iter(&tokens_json) {
        let category = &cat_cap[1];
        let inner = &cat_cap[2];

        for kv_cap in RE_KV.captures_iter(inner) {
            let key = &kv_cap[1];
            let val = &kv_cap[2];

            let css_var = if prefix.is_empty() {
                format!("--{}-{}", category, key)
            } else {
                format!("--{}-{}-{}", prefix, category, key)
            };

            css_lines.push(format!("  {}: {};", css_var, val));
            tokens.push(ThemeToken {
                key: format!("{}.{}", category, key),
                css_var: css_var.clone(),
                value: val.to_string(),
            });
        }
    }

    let css = format!("{} {{\n{}\n}}", selector, css_lines.join("\n"));

    CompiledTheme {
        name: theme_name,
        selector,
        css,
        tokens,
    }
}

/// Extract CSS variables referenced in a source file.
/// Returns a list of `--var-name` strings found.
#[napi]
pub fn extract_css_vars(source: String) -> Vec<String> {
    static RE_VAR: Lazy<Regex> = Lazy::new(|| Regex::new(r"--[a-zA-Z][a-zA-Z0-9_-]*").unwrap());
    let mut vars: Vec<String> = RE_VAR
        .find_iter(&source)
        .map(|m| m.as_str().to_string())
        .collect();
    vars.sort();
    vars.dedup();
    vars
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CssThemeVar {
    /// Variable name without leading `--`, e.g. `color-primary`
    pub key: String,
    /// Raw value from CSS, e.g. `#3b82f6` or `var(--color-base)`
    pub value: String,
}

/// Parse `@theme { --key: value; }` blocks from a CSS string.
///
/// Returns all key-value pairs found inside `@theme` blocks.
/// Handles multiple `@theme` blocks and strips leading `--`.
///
/// Menggantikan JS regex di `themeReader.ts extractThemeFromCSS()`.
#[napi]
pub fn extract_theme_from_css(css: String) -> Vec<CssThemeVar> {
    static RE_BLOCK: Lazy<Regex> = Lazy::new(|| Regex::new(r"@theme\s*\{([\s\S]*?)\}").unwrap());
    static RE_VAR_KV: Lazy<Regex> =
        Lazy::new(|| Regex::new(r"--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);").unwrap());

    let mut result: Vec<CssThemeVar> = Vec::new();

    for block_cap in RE_BLOCK.captures_iter(&css) {
        let block = &block_cap[1];
        for kv_cap in RE_VAR_KV.captures_iter(block) {
            let key = kv_cap[1].trim().to_string();
            let value = kv_cap[2].trim().to_string();
            result.push(CssThemeVar { key, value });
        }
    }

    result
}

// ─────────────────────────────────────────────────────────────────────────────
// ClassifiedThemeConfig — output dari extract_theme_from_css_classified()
// Mirrors ThemeConfig interface di themeReader.ts
// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema, Default)]
pub struct ClassifiedThemeConfig {
    /// Tokens dengan prefix `color-` → key tanpa prefix
    /// e.g. `--color-primary: #3b82f6` → colors["primary"] = "#3b82f6"
    pub colors: HashMap<String, String>,

    /// Tokens dengan prefix `spacing-`
    /// e.g. `--spacing-sm: 0.5rem` → spacing["sm"] = "0.5rem"
    pub spacing: HashMap<String, String>,

    /// Tokens dengan prefix `font-`
    /// e.g. `--font-sans: Inter, sans-serif` → fonts["sans"] = "Inter, sans-serif"
    pub fonts: HashMap<String, String>,

    /// Tokens dengan prefix `breakpoint-`
    /// e.g. `--breakpoint-md: 768px` → breakpoints["md"] = "768px"
    pub breakpoints: HashMap<String, String>,

    /// Tokens dengan prefix `animate-`
    /// e.g. `--animate-spin: spin 1s linear infinite` → animations["spin"] = "..."
    pub animations: HashMap<String, String>,

    /// Semua token mentah, key tanpa `--`, value sudah di-resolve
    /// e.g. raw["color-primary"] = "#3b82f6"
    pub raw: HashMap<String, String>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers (non-NAPI)
// ─────────────────────────────────────────────────────────────────────────────

/// Resolve satu var() chain secara iteratif.
/// Identik dengan resolve_theme_value() tapi bekerja langsung pada HashMap
/// (tanpa JSON serialization round-trip).
fn resolve_var_chain(key: &str, raw: &HashMap<String, String>) -> String {
    let mut current = key.trim_start_matches("--").to_string();
    let mut visited = std::collections::HashSet::new();

    for _ in 0..32 {
        let value = match raw.get(&current) {
            Some(v) => v,
            None => return String::new(),
        };

        // Cek apakah value adalah `var(--token-name)`
        let trimmed = value.trim();
        if let Some(inner) = trimmed
            .strip_prefix("var(")
            .and_then(|s| s.strip_suffix(')'))
        {
            let next = inner.trim().trim_start_matches("--").to_string();
            if visited.contains(&current) {
                // Cycle detected — return raw value
                return value.clone();
            }
            visited.insert(current);
            current = next;
        } else {
            return value.clone();
        }
    }

    // Max hops exceeded
    raw.get(&current).cloned().unwrap_or_default()
}

/// Classify satu key ke bucket yang tepat di ClassifiedThemeConfig.
/// Juga strip prefix dari key untuk nilai di bucket.
/// Returns (bucket_name, stripped_key) — bucket_name = "colors"|"spacing"|...|"raw_only"
fn classify_key(key: &str) -> (&'static str, &str) {
    if let Some(k) = key.strip_prefix("color-") {
        return ("colors", k);
    }
    if let Some(k) = key.strip_prefix("spacing-") {
        return ("spacing", k);
    }
    if let Some(k) = key.strip_prefix("font-") {
        return ("fonts", k);
    }
    if let Some(k) = key.strip_prefix("breakpoint-") {
        return ("breakpoints", k);
    }
    if let Some(k) = key.strip_prefix("animate-") {
        return ("animations", k);
    }
    ("raw_only", key)
}

// ─────────────────────────────────────────────────────────────────────────────
// extract_theme_from_css_classified — fungsi utama baru
// Menggantikan 3 operasi JS terpisah:
//   1. binding.extractThemeFromCss(css)     → Vec<{key, value}>
//   2. for (key, value) of vars { setToken(theme, key, value) }  ← JS classify loop
//   3. for key of raw { resolveThemeValue(key, theme) }          ← N × NAPI calls
// Menjadi: 1 NAPI call yang return ThemeConfig sudah classified + resolved
// ─────────────────────────────────────────────────────────────────────────────

/// Parse `@theme { ... }` CSS blocks, classify tokens ke bucket (colors/spacing/fonts/etc),
/// dan resolve semua `var(--token)` references — semuanya dalam satu pass di Rust.
///
/// Menggantikan pola JS berikut di `themeReader.ts`:
/// ```typescript
/// const vars = binding.extractThemeFromCss(css)           // NAPI call 1
/// for (const { key, value } of vars) { setToken(...) }    // JS classify loop
/// for (const key of Object.keys(raw)) {
///   resolveThemeValue(`--${key}`, theme)                  // NAPI call × N tokens!
/// }
/// ```
///
/// Dengan fungsi ini: **1 NAPI call** → ClassifiedThemeConfig siap pakai.
///
/// ## Urutan operasi internal:
/// 1. Parse `@theme {}` blocks dengan regex (identik dengan `extract_theme_from_css`)
/// 2. Collect semua token ke `raw` HashMap
/// 3. Resolve semua `var()` chains secara iteratif (tanpa JSON serialization)
/// 4. Classify resolved values ke buckets (colors, spacing, fonts, breakpoints, animations)
/// 5. Return struct sekali — zero round-trips
#[napi]
pub fn extract_theme_from_css_classified(css: String) -> ClassifiedThemeConfig {
    static RE_BLOCK: Lazy<Regex> = Lazy::new(|| Regex::new(r"@theme\s*\{([\s\S]*?)\}").unwrap());
    static RE_VAR_KV: Lazy<Regex> =
        Lazy::new(|| Regex::new(r"--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);").unwrap());

    // ── Pass 1: Parse semua @theme blocks → raw HashMap ──────────────────────
    // Menggunakan HashMap dengan pre-allocation untuk avoid rehash.
    // Ukuran typical theme: 50-200 tokens.
    let mut raw: HashMap<String, String> = HashMap::with_capacity(128);

    for block_cap in RE_BLOCK.captures_iter(&css) {
        let block = &block_cap[1];
        for kv_cap in RE_VAR_KV.captures_iter(block) {
            let key = kv_cap[1].trim().to_string();
            let value = kv_cap[2].trim().to_string();
            raw.insert(key, value);
        }
    }

    if raw.is_empty() {
        return ClassifiedThemeConfig::default();
    }

    // ── Pass 2: Resolve var() chains ─────────────────────────────────────────
    // Resolve dulu ke HashMap baru agar tidak mutate saat iterasi.
    // Snapshot raw untuk resolusi (resolve_var_chain membaca dari snapshot).
    let raw_snapshot = raw.clone();
    let mut resolved: HashMap<String, String> = HashMap::with_capacity(raw.len());
    for key in raw.keys() {
        let value = resolve_var_chain(key, &raw_snapshot);
        resolved.insert(key.clone(), value);
    }

    // ── Pass 3: Classify resolved tokens ke buckets ───────────────────────────
    let mut config = ClassifiedThemeConfig {
        raw: resolved.clone(),
        ..Default::default()
    };

    for (key, value) in &resolved {
        let (bucket, stripped) = classify_key(key);
        match bucket {
            "colors" => {
                config.colors.insert(stripped.to_string(), value.clone());
            }
            "spacing" => {
                config.spacing.insert(stripped.to_string(), value.clone());
            }
            "fonts" => {
                config.fonts.insert(stripped.to_string(), value.clone());
            }
            "breakpoints" => {
                config.breakpoints.insert(stripped.to_string(), value.clone());
            }
            "animations" => {
                config.animations.insert(stripped.to_string(), value.clone());
            }
            _ => {
                // "raw_only" — sudah masuk config.raw di atas, tidak perlu ke bucket lain
            }
        }
    }

    config
}

// ─────────────────────────────────────────────────────────────────────────────
// resolve_theme_value — iterative var() chain resolver
// Mirrors resolveThemeValue() from themeReader.ts (recursive → iterative)
// Dipertahankan untuk backward-compat (JS fallback path di themeReader.ts)
// ─────────────────────────────────────────────────────────────────────────────

/// Resolve a CSS custom property chain like `var(--color-primary)` → concrete value.
///
/// `raw_map` is a JSON object string: `{"key": "value", ...}` (the `theme.raw` dict).
/// Cycles are broken after 32 hops. Returns empty string if key is not in the map.
#[napi]
pub fn resolve_theme_value(key: String, raw_map_json: String) -> String {
    let map: HashMap<String, String> = match serde_json::from_str(&raw_map_json) {
        Ok(m) => m,
        Err(_) => return String::new(),
    };

    resolve_var_chain(&key, &map)
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_css(vars: &[(&str, &str)]) -> String {
        let inner = vars
            .iter()
            .map(|(k, v)| format!("  --{}: {};", k, v))
            .collect::<Vec<_>>()
            .join("\n");
        format!("@theme {{\n{}\n}}", inner)
    }

    #[test]
    fn test_classify_basic_tokens() {
        let css = make_css(&[
            ("color-primary", "#3b82f6"),
            ("color-secondary", "#8b5cf6"),
            ("spacing-sm", "0.5rem"),
            ("spacing-md", "1rem"),
            ("font-sans", "Inter, sans-serif"),
            ("breakpoint-md", "768px"),
            ("animate-spin", "spin 1s linear infinite"),
            ("custom-token", "some-value"),
        ]);

        let result = extract_theme_from_css_classified(css);

        assert_eq!(result.colors.get("primary"), Some(&"#3b82f6".to_string()));
        assert_eq!(result.colors.get("secondary"), Some(&"#8b5cf6".to_string()));
        assert_eq!(result.spacing.get("sm"), Some(&"0.5rem".to_string()));
        assert_eq!(result.spacing.get("md"), Some(&"1rem".to_string()));
        assert_eq!(result.fonts.get("sans"), Some(&"Inter, sans-serif".to_string()));
        assert_eq!(result.breakpoints.get("md"), Some(&"768px".to_string()));
        assert_eq!(result.animations.get("spin"), Some(&"spin 1s linear infinite".to_string()));
        // custom-token tidak punya prefix → hanya ada di raw
        assert_eq!(result.raw.get("custom-token"), Some(&"some-value".to_string()));
        assert!(!result.colors.contains_key("custom-token"));
    }

    #[test]
    fn test_var_resolution_single_hop() {
        let css = make_css(&[
            ("color-base", "#3b82f6"),
            ("color-primary", "var(--color-base)"),
        ]);

        let result = extract_theme_from_css_classified(css);

        // color-primary harus resolve ke nilai konkret dari color-base
        assert_eq!(result.colors.get("primary"), Some(&"#3b82f6".to_string()));
        assert_eq!(result.raw.get("color-primary"), Some(&"#3b82f6".to_string()));
    }

    #[test]
    fn test_var_resolution_chain() {
        // A → B → C (multi-hop)
        let css = make_css(&[
            ("color-final", "#ff0000"),
            ("color-mid", "var(--color-final)"),
            ("color-primary", "var(--color-mid)"),
        ]);

        let result = extract_theme_from_css_classified(css);

        assert_eq!(result.colors.get("primary"), Some(&"#ff0000".to_string()));
        assert_eq!(result.colors.get("mid"), Some(&"#ff0000".to_string()));
        assert_eq!(result.colors.get("final"), Some(&"#ff0000".to_string()));
    }

    #[test]
    fn test_var_cycle_breaks_gracefully() {
        // A → B → A (cycle) — harus tidak infinite loop
        let css = make_css(&[
            ("color-a", "var(--color-b)"),
            ("color-b", "var(--color-a)"),
        ]);

        // Tidak boleh panic atau infinite loop
        let result = extract_theme_from_css_classified(css);

        // Salah satu akan resolve ke raw value dari titik cycle detection
        // yang penting tidak panic
        let _ = result.colors.get("a");
        let _ = result.colors.get("b");
    }

    #[test]
    fn test_empty_css_returns_default() {
        let result = extract_theme_from_css_classified(String::new());

        assert!(result.colors.is_empty());
        assert!(result.spacing.is_empty());
        assert!(result.raw.is_empty());
    }

    #[test]
    fn test_multiple_theme_blocks() {
        // Dua @theme block — harus di-merge
        let css = "@theme {\n  --color-primary: #3b82f6;\n}\n@theme {\n  --spacing-sm: 0.5rem;\n}";
        let result = extract_theme_from_css_classified(css.to_string());

        assert_eq!(result.colors.get("primary"), Some(&"#3b82f6".to_string()));
        assert_eq!(result.spacing.get("sm"), Some(&"0.5rem".to_string()));
    }

    #[test]
    fn test_raw_contains_all_tokens() {
        let css = make_css(&[
            ("color-primary", "#3b82f6"),
            ("spacing-sm", "0.5rem"),
            ("my-custom", "value"),
        ]);

        let result = extract_theme_from_css_classified(css);

        // raw harus punya semua token
        assert!(result.raw.contains_key("color-primary"));
        assert!(result.raw.contains_key("spacing-sm"));
        assert!(result.raw.contains_key("my-custom"));
    }

    #[test]
    fn test_resolve_var_chain_direct() {
        let mut raw = HashMap::new();
        raw.insert("color-base".to_string(), "#fff".to_string());
        raw.insert("color-primary".to_string(), "var(--color-base)".to_string());

        let resolved = resolve_var_chain("color-primary", &raw);
        assert_eq!(resolved, "#fff");

        // Key tidak ada → empty string
        let missing = resolve_var_chain("color-missing", &raw);
        assert_eq!(missing, "");
    }

    #[test]
    fn test_backward_compat_resolve_theme_value() {
        // resolve_theme_value (NAPI fn lama) harus tetap bekerja.
        // JSON dibangun dari slice concat — r#"..."# dengan '#hex' di dalamnya
        // menyebabkan konflik delimiter di Rust 2021.
        let hex_color = ["#", "3b82f6"].concat();
        let raw_json = [
            r#"{"color-base":""#,
            hex_color.as_str(),
            r#"","color-primary":"var(--color-base)"}"#,
        ].concat();
        let result = resolve_theme_value("--color-primary".to_string(), raw_json);
        assert_eq!(result, hex_color);
    }

    #[test]
    fn test_classify_key_helper() {
        assert_eq!(classify_key("color-primary"), ("colors", "primary"));
        assert_eq!(classify_key("spacing-sm"), ("spacing", "sm"));
        assert_eq!(classify_key("font-sans"), ("fonts", "sans"));
        assert_eq!(classify_key("breakpoint-md"), ("breakpoints", "md"));
        assert_eq!(classify_key("animate-spin"), ("animations", "spin"));
        assert_eq!(classify_key("custom-token"), ("raw_only", "custom-token"));
        assert_eq!(classify_key("colors"), ("raw_only", "colors")); // exact match saja
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// generate_type_definitions — build-time TypeScript codegen
// ═════════════════════════════════════════════════════════════════════════════

/// Generate TypeScript interface `TailwindStyledThemeTokens` dari classified theme config.
///
/// Menggantikan `generateTypeDefinitions()` di `themeReader.ts` untuk dipakai
/// di CLI (`tw generate-types`). Build-time only — bukan hot path.
///
/// ## Input
/// `theme_json`: JSON serialization dari `ClassifiedThemeConfig`:
/// ```json
/// {
///   "colors": { "primary": "#3b82f6", "secondary": "#8b5cf6" },
///   "spacing": { "sm": "0.5rem", "md": "1rem" },
///   "fonts": {}, "breakpoints": {}, "animations": {}, "raw": {}
/// }
/// ```
///
/// ## Output
/// TypeScript interface string siap ditulis ke `.d.ts`:
/// ```typescript
/// export interface TailwindStyledThemeTokens {
///   colors: {
///     "primary": string
///     "secondary": string
///   }
///   spacing: {
///     "sm": string
///     "md": string
///   }
///   fonts: Record<string, string>
///   breakpoints: Record<string, string>
///   animations: Record<string, string>
/// }
/// ```
///
/// Identik dengan output `generateTypeDefinitions()` JS — bisa dipakai sebagai
/// drop-in replacement untuk CLI codegen.
#[napi]
pub fn generate_type_definitions(theme_json: String) -> String {
    let theme: serde_json::Value = match serde_json::from_str(&theme_json) {
        Ok(v) => v,
        Err(_) => return String::from("// Error: invalid theme JSON\n"),
    };

    // Daftar bucket yang di-render (urutan identik dengan JS)
    let buckets = ["colors", "spacing", "fonts", "breakpoints", "animations"];

    let mut lines: Vec<String> = Vec::with_capacity(64);
    lines.push(String::from("export interface TailwindStyledThemeTokens {"));

    for bucket in &buckets {
        let field = to_record_type(bucket, theme.get(bucket));
        lines.push(field);
    }

    lines.push(String::from("}"));
    lines.push(String::new()); // trailing newline

    lines.join("\n")
}

/// Internal: render satu bucket ke TypeScript field declaration.
/// Identik dengan `toRecordType()` di JS:
/// ```typescript
/// const toRecordType = (name, obj) => {
///   if (keys.length === 0) return `  ${name}: Record<string, string>`
///   const mapped = keys.map(k => `    "${k}": string`).join("\n")
///   return `  ${name}: {\n${mapped}\n  }`
/// }
/// ```
fn to_record_type(name: &str, value: Option<&serde_json::Value>) -> String {
    let keys: Vec<String> = match value.and_then(|v| v.as_object()) {
        Some(obj) if !obj.is_empty() => {
            let mut keys: Vec<String> = obj.keys().cloned().collect();
            keys.sort(); // deterministic output
            keys
        }
        _ => {
            // Empty atau tidak ada → Record<string, string>
            return format!("  {}: Record<string, string>", name);
        }
    };

    let mapped: Vec<String> = keys.iter().map(|k| format!("    \"{}\": string", k)).collect();
    format!("  {}: {{\n{}\n  }}", name, mapped.join("\n"))
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests — generate_type_definitions
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod typegen_tests {
    use super::*;

    fn make_theme_json(
        colors: &[(&str, &str)],
        spacing: &[(&str, &str)],
    ) -> String {
        let colors_obj: String = colors
            .iter()
            .map(|(k, v)| format!("\"{}\":\"{}\"", k, v))
            .collect::<Vec<_>>()
            .join(",");
        let spacing_obj: String = spacing
            .iter()
            .map(|(k, v)| format!("\"{}\":\"{}\"", k, v))
            .collect::<Vec<_>>()
            .join(",");
        format!(
            r#"{{"colors":{{{colors}}},"spacing":{{{spacing}}},"fonts":{{}},"breakpoints":{{}},"animations":{{}},"raw":{{}}}}"#,
            colors = colors_obj,
            spacing = spacing_obj,
        )
    }

    #[test]
    fn test_basic_output_structure() {
        let json = make_theme_json(
            &[("primary", "blue"), ("secondary", "purple")],
            &[("sm", "0.5rem"), ("md", "1rem")],
        );
        let out = generate_type_definitions(json);

        assert!(out.starts_with("export interface TailwindStyledThemeTokens {"));
        assert!(out.ends_with("}\n"));
    }

    #[test]
    fn test_colors_bucket_typed_keys() {
        let json = make_theme_json(&[("primary", "blue"), ("secondary", "purple")], &[]);
        let out = generate_type_definitions(json);

        assert!(out.contains("  colors: {"));
        assert!(out.contains("    \"primary\": string"));
        assert!(out.contains("    \"secondary\": string"));
    }

    #[test]
    fn test_empty_bucket_becomes_record() {
        let json = make_theme_json(&[("primary", "blue")], &[]);
        let out = generate_type_definitions(json);

        // spacing kosong → Record<string, string>
        assert!(out.contains("  spacing: Record<string, string>"));
        assert!(out.contains("  fonts: Record<string, string>"));
        assert!(out.contains("  breakpoints: Record<string, string>"));
        assert!(out.contains("  animations: Record<string, string>"));
    }

    #[test]
    fn test_raw_bucket_not_in_output() {
        // raw tidak masuk ke interface (identik dengan JS)
        let json = make_theme_json(&[], &[]);
        let out = generate_type_definitions(json);

        assert!(!out.contains("raw"));
    }

    #[test]
    fn test_keys_sorted_deterministic() {
        // Key harus sorted agar output deterministic (diff-friendly)
        let json = make_theme_json(
            &[("zebra", "z"), ("alpha", "a"), ("middle", "m")],
            &[],
        );
        let out = generate_type_definitions(json);

        let alpha_pos = out.find("\"alpha\"").unwrap();
        let middle_pos = out.find("\"middle\"").unwrap();
        let zebra_pos = out.find("\"zebra\"").unwrap();

        assert!(alpha_pos < middle_pos && middle_pos < zebra_pos,
            "Keys harus diurutkan alphabetically");
    }

    #[test]
    fn test_trailing_newline() {
        let json = make_theme_json(&[], &[]);
        let out = generate_type_definitions(json);
        assert!(out.ends_with('\n'), "Output harus diakhiri newline");
    }

    #[test]
    fn test_invalid_json_returns_comment() {
        let out = generate_type_definitions("not valid json".to_string());
        assert!(out.contains("// Error:"));
    }

    #[test]
    fn test_full_output_matches_js_shape() {
        // Verifikasi output persis identik dengan JS generateTypeDefinitions()
        let json = make_theme_json(
            &[("primary", "#3b82f6")],
            &[("sm", "0.5rem")],
        );
        let out = generate_type_definitions(json);

        let expected = [
            "export interface TailwindStyledThemeTokens {",
            "  colors: {",
            "    \"primary\": string",
            "  }",
            "  spacing: {",
            "    \"sm\": string",
            "  }",
            "  fonts: Record<string, string>",
            "  breakpoints: Record<string, string>",
            "  animations: Record<string, string>",
            "}",
            "",
        ].join("\n");

        assert_eq!(out, expected);
    }

    #[test]
    fn test_to_record_type_empty() {
        let result = to_record_type("colors", None);
        assert_eq!(result, "  colors: Record<string, string>");
    }

    #[test]
    fn test_to_record_type_with_keys() {
        let val = serde_json::json!({"primary": "#3b82f6", "secondary": "#8b5cf6"});
        let result = to_record_type("colors", Some(&val));
        assert!(result.contains("  colors: {"));
        assert!(result.contains("    \"primary\": string"));
        assert!(result.contains("    \"secondary\": string"));
        assert!(result.ends_with("  }"));
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// generate_system_token_css — token CSS var block generator untuk styledSystem
// ═════════════════════════════════════════════════════════════════════════════

/// Generate `:root { --prefix-group-name: value; ... }` CSS block dari SystemTokenMap.
///
/// Menggantikan JS nested loop di `injectTokensToRoot()` dan `setTokens()` di `styledSystem.ts`:
///
/// ```typescript
/// // Sebelum: JS nested loop + string building
/// const lines: string[] = [":root {"]
/// for (const [group, map] of Object.entries(tokens)) {
///   for (const [name, value] of Object.entries(map)) {
///     lines.push(`  --${prefix}-${group}-${name}: ${value};`)
///   }
/// }
/// lines.push("}")
/// style.textContent = lines.join("\n")
///
/// // Sesudah: 1 NAPI call
/// style.textContent = native.generateSystemTokenCss(JSON.stringify(tokens), prefix)
/// ```
///
/// ## Input
/// `tokens_json`: JSON dari `SystemTokenMap`:
/// ```json
/// {
///   "colors":  { "primary": "#6366f1", "muted": "#71717a" },
///   "radius":  { "base": "0.5rem", "full": "9999px" },
///   "spacing": { "sm": "0.5rem", "md": "1rem" }
/// }
/// ```
/// `prefix`: CSS variable prefix, e.g. `"sys"` → `--sys-colors-primary`
///
/// ## Output
/// ```css
/// :root {
///   --sys-colors-muted: #71717a;
///   --sys-colors-primary: #6366f1;
///   --sys-radius-base: 0.5rem;
///   --sys-radius-full: 9999px;
/// }
/// ```
/// Keys di-sort per group untuk output yang deterministic.
#[napi]
pub fn generate_system_token_css(tokens_json: String, prefix: String) -> String {
    let tokens: serde_json::Map<String, serde_json::Value> =
        match serde_json::from_str(&tokens_json) {
            Ok(serde_json::Value::Object(m)) => m,
            _ => return String::from(":root {}\n"),
        };

    if tokens.is_empty() {
        return String::from(":root {}\n");
    }

    // Pre-allocate: rata-rata 30 chars per declaration
    let total_tokens: usize = tokens
        .values()
        .filter_map(|v| v.as_object())
        .map(|m| m.len())
        .sum();
    let mut lines: Vec<String> = Vec::with_capacity(total_tokens + 2);
    lines.push(String::from(":root {"));

    // Sort groups untuk deterministic output
    let mut groups: Vec<(&String, &serde_json::Value)> = tokens.iter().collect();
    groups.sort_by_key(|(k, _)| k.as_str());

    for (group, map_val) in &groups {
        let map = match map_val.as_object() {
            Some(m) if !m.is_empty() => m,
            _ => continue,
        };

        // Sort names dalam setiap group
        let mut entries: Vec<(&String, &serde_json::Value)> = map.iter().collect();
        entries.sort_by_key(|(k, _)| k.as_str());

        for (name, value) in &entries {
            let val_str = match value {
                serde_json::Value::String(s) => s.as_str(),
                _ => continue,
            };
            lines.push(format!("  --{}-{}-{}: {};", prefix, group, name, val_str));
        }
    }

    lines.push(String::from("}"));
    lines.join("\n") + "\n"
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests — generate_system_token_css
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod system_token_tests {
    use super::*;

    #[test]
    fn test_basic_token_output() {
        let hex1 = ["#", "6366f1"].concat();
        let hex2 = ["#", "71717a"].concat();
        let tokens = [
            r#"{"colors":{"primary":""#,
            hex1.as_str(),
            r#"","muted":""#,
            hex2.as_str(),
            r#""}}"#,
        ].concat();
        let out = generate_system_token_css(tokens, "sys".to_string());

        assert!(out.starts_with(":root {"));
        let expected1 = format!("  --sys-colors-primary: {};", hex1);
        let expected2 = format!("  --sys-colors-muted: {};", hex2);
        assert!(out.contains(&expected1));
        assert!(out.contains(&expected2));
    }

    #[test]
    fn test_multiple_groups() {
        let tokens = r#"{"colors":{"primary":"blue"},"radius":{"base":"0.5rem"},"spacing":{"sm":"0.5rem"}}"#;
        let out = generate_system_token_css(tokens.to_string(), "sys".to_string());

        assert!(out.contains("--sys-colors-primary: blue;"));
        assert!(out.contains("--sys-radius-base: 0.5rem;"));
        assert!(out.contains("--sys-spacing-sm: 0.5rem;"));
    }

    #[test]
    fn test_custom_prefix() {
        let tokens = r#"{"colors":{"primary":"red"}}"#;
        let out = generate_system_token_css(tokens.to_string(), "ui".to_string());

        assert!(out.contains("--ui-colors-primary: red;"));
        assert!(!out.contains("--sys-"));
    }

    #[test]
    fn test_groups_sorted_deterministic() {
        // Group order: colors < radius < spacing (alphabetical)
        let tokens = r#"{"spacing":{"sm":"0.5rem"},"colors":{"a":"red"},"radius":{"b":"4px"}}"#;
        let out = generate_system_token_css(tokens.to_string(), "sys".to_string());

        let colors_pos = out.find("--sys-colors-").unwrap();
        let radius_pos = out.find("--sys-radius-").unwrap();
        let spacing_pos = out.find("--sys-spacing-").unwrap();

        assert!(colors_pos < radius_pos, "colors harus sebelum radius");
        assert!(radius_pos < spacing_pos, "radius harus sebelum spacing");
    }

    #[test]
    fn test_names_sorted_within_group() {
        let tokens = r#"{"colors":{"zebra":"z","alpha":"a","middle":"m"}}"#;
        let out = generate_system_token_css(tokens.to_string(), "sys".to_string());

        let alpha_pos = out.find("--sys-colors-alpha").unwrap();
        let middle_pos = out.find("--sys-colors-middle").unwrap();
        let zebra_pos = out.find("--sys-colors-zebra").unwrap();

        assert!(alpha_pos < middle_pos && middle_pos < zebra_pos);
    }

    #[test]
    fn test_empty_tokens_returns_empty_root() {
        let out = generate_system_token_css("{}".to_string(), "sys".to_string());
        assert_eq!(out, ":root {}\n");
    }

    #[test]
    fn test_invalid_json_returns_empty_root() {
        let out = generate_system_token_css("not json".to_string(), "sys".to_string());
        assert_eq!(out, ":root {}\n");
    }

    #[test]
    fn test_output_format_matches_js_exactly() {
        // Verifikasi format identik dengan JS styledSystem.
        // JSON dibangun dari slice concat untuk menghindari konflik
        // delimiter r#"..."# dengan '#hex' di Rust 2021.
        let hex = ["#", "6366f1"].concat();
        let tokens = [
            r#"{"colors":{"primary":""#,
            hex.as_str(),
            r#""}}"#,
        ].concat();
        let out = generate_system_token_css(tokens, "sys".to_string());

        let expected = format!(":root {{\n  --sys-colors-primary: {};\n}}\n", hex);
        assert_eq!(out, expected);
    }
}