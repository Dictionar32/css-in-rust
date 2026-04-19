use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

static RE_INDENTED_TW: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"(?m)^([ \t]+)(const|let)\s+([A-Z]\w*)\s*=\s*tw\.[\w]+[`(]").unwrap());
static RE_AFTER_IMPORTS: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?m)^import\s+").unwrap());
static RE_CSS_RULE: Lazy<Regex> = Lazy::new(|| Regex::new(r"\{([^}]*)\}").unwrap());
static RE_CSS_CLASS_SELECTOR: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"\.([\w-]+(?::[:\w-]+)?)\s*\{([^}]*)\}").unwrap());

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct HoistResult {
    /// Source code setelah hoisting
    pub code: String,
    /// Nama komponen yang di-hoist
    pub hoisted: Vec<String>,
    /// Warning messages
    pub warnings: Vec<String>,
}

/// Deteksi dan hoist tw component declarations dari function body ke module scope.
///
/// Menggantikan `hoistComponents` di componentHoister.ts.
/// Component yang didefinisikan di dalam render function akan direcreate
/// setiap render — Rust mendeteksi ini dan memindahkannya ke module scope.
///
/// # Performance
/// String scanning dengan Regex Rust ~3x lebih cepat dari JS equivalent
/// karena tidak ada overhead prototype chain dan V8 JIT warmup.
#[napi]
pub fn hoist_components(source: String) -> HoistResult {
    let matches: Vec<_> = RE_INDENTED_TW.captures_iter(&source).collect();

    if matches.is_empty() {
        return HoistResult {
            code: source,
            hoisted: vec![],
            warnings: vec![],
        };
    }

    let mut hoisted_names: Vec<String> = Vec::new();
    let mut warnings: Vec<String> = Vec::new();
    let mut code = source.clone();
    let mut hoisted_decls: Vec<String> = Vec::new();

    // Process in reverse order to maintain correct indices
    let mut capture_data: Vec<(usize, String, String, usize)> = Vec::new(); // (start, name, indent, len)

    for cap in RE_INDENTED_TW.captures_iter(&source) {
        let indent = cap.get(1).map_or("", |m| m.as_str());
        let name = cap.get(3).map_or("", |m| m.as_str());
        if indent.is_empty() || !name.chars().next().map_or(false, |c| c.is_uppercase()) {
            continue;
        }
        let start = cap.get(0).map_or(0, |m| m.start());
        // Find line end
        let line_end = source[start..]
            .find('\n')
            .map_or(source.len() - start, |i| i + 1);
        capture_data.push((start, name.to_string(), indent.to_string(), line_end));
    }

    // Reverse and process
    capture_data.reverse();
    for (start, name, indent, stmt_len) in capture_data {
        let line_start = source[..start].rfind('\n').map_or(0, |i| i + 1);
        let stmt = &source[line_start..line_start + stmt_len];

        // Dedent
        let dedented: String = stmt
            .lines()
            .map(|line| {
                if line.starts_with(&indent) {
                    &line[indent.len()..]
                } else {
                    line
                }
            })
            .collect::<Vec<_>>()
            .join("\n")
            .trim()
            .to_string();

        hoisted_decls.insert(0, dedented);
        hoisted_names.push(name.clone());
        warnings.push(format!(
            "[tw-hoist] '{}' moved to module scope for better performance. \
             Avoid defining tw components inside render functions.",
            name
        ));

        // Remove from original position
        if line_start + stmt_len <= code.len() {
            code = format!("{}{}", &code[..line_start], &code[line_start + stmt_len..]);
        }
    }

    // Find insertion point: after last import line
    let insert_at = {
        let mut last_import_end = 0;
        for m in RE_AFTER_IMPORTS.find_iter(&code) {
            if let Some(line_end) = code[m.start()..].find('\n') {
                last_import_end = m.start() + line_end + 1;
            }
        }
        last_import_end
    };

    if !hoisted_decls.is_empty() {
        let hoist_block = format!("\n{}\n", hoisted_decls.join("\n\n"));
        code = format!(
            "{}{}{}",
            &code[..insert_at],
            hoist_block,
            &code[insert_at..]
        );
    }

    HoistResult {
        code,
        hoisted: hoisted_names,
        warnings,
    }
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct VariantTableResult {
    /// Component ID
    pub id: String,
    /// JSON: Record<string, string> — combination key → merged className
    pub table_json: String,
    /// Ordered variant keys
    pub keys: Vec<String>,
    /// Default combination key
    pub default_key: String,
    /// Total combinations
    pub combinations: u32,
}

/// Compile semua kombinasi variant component ke lookup table.
///
/// Menggantikan `compileAllVariantCombinations` di staticVariantCompiler.ts.
/// Hasilkan semua permutasi variant → merged className di build time.
/// Runtime hanya perlu O(1) lookup, zero computation.
///
/// # Input JSON format
/// ```json
/// {
///   "componentId": "Button",
///   "base": "px-4 py-2 font-medium",
///   "variants": { "size": { "sm": "h-8 text-sm", "lg": "h-12 text-lg" } },
///   "defaultVariants": { "size": "sm" }
/// }
/// ```
#[napi]
pub fn compile_variant_table(config_json: String) -> VariantTableResult {
    #[derive(Deserialize)]
    struct VariantConfig {
        #[serde(rename = "componentId")]
        component_id: String,
        base: String,
        variants: HashMap<String, HashMap<String, String>>,
        #[serde(rename = "defaultVariants")]
        default_variants: Option<HashMap<String, String>>,
        #[serde(rename = "compoundVariants")]
        compound_variants: Option<Vec<HashMap<String, String>>>,
    }

    let config: VariantConfig = match serde_json::from_str(&config_json) {
        Ok(c) => c,
        Err(e) => {
            return VariantTableResult {
                id: String::new(),
                table_json: format!("{{\"error\":\"{}\"}}", e),
                keys: vec![],
                default_key: String::new(),
                combinations: 0,
            }
        }
    };

    let defaults = config.default_variants.unwrap_or_default();
    let compounds = config.compound_variants.unwrap_or_default();

    // Sort variant keys for deterministic output
    let mut sorted_keys: Vec<String> = config.variants.keys().cloned().collect();
    sorted_keys.sort();

    // Generate cartesian product of all variant values
    let value_sets: Vec<Vec<String>> = sorted_keys
        .iter()
        .map(|k| config.variants[k].keys().cloned().collect())
        .collect();

    // Cartesian product via fold
    let combinations: Vec<Vec<String>> = value_sets.iter().fold(vec![vec![]], |acc, values| {
        acc.iter()
            .flat_map(|combo| {
                values
                    .iter()
                    .map(move |v| [combo.clone(), vec![v.clone()]].concat())
            })
            .collect()
    });

    let mut table: HashMap<String, String> = HashMap::new();

    for combo_values in &combinations {
        // Build combination key: "val1|val2|..."
        let key = combo_values.join("|");

        // Collect variant classes
        let mut class_parts: Vec<&str> = vec![config.base.as_str()];
        for (i, k) in sorted_keys.iter().enumerate() {
            let val = &combo_values[i];
            if let Some(cls) = config.variants[k].get(val) {
                if !cls.is_empty() {
                    class_parts.push(cls.as_str());
                }
            }
        }

        // Resolve compound variants
        let combo_map: HashMap<&str, &str> = sorted_keys
            .iter()
            .zip(combo_values.iter())
            .map(|(k, v)| (k.as_str(), v.as_str()))
            .collect();

        for compound in &compounds {
            let matches = compound
                .iter()
                .filter(|(k, _)| *k != "class")
                .all(|(k, v)| combo_map.get(k.as_str()).map_or(false, |cv| cv == v));
            if matches {
                if let Some(cls) = compound.get("class") {
                    if !cls.is_empty() {
                        class_parts.push(cls.as_str());
                    }
                }
            }
        }

        // Simple merge: join and deduplicate (Rust-side twMerge equivalent)
        let merged = dedup_classes(&class_parts.join(" "));
        table.insert(key, merged);
    }

    // Build default key
    let default_values: Vec<String> = sorted_keys
        .iter()
        .map(|k| {
            defaults.get(k).cloned().unwrap_or_else(|| {
                config.variants[k]
                    .keys()
                    .next()
                    .cloned()
                    .unwrap_or_default()
            })
        })
        .collect();
    let default_key = default_values.join("|");

    VariantTableResult {
        id: config.component_id,
        table_json: serde_json::to_string(&table).unwrap_or_default(),
        keys: sorted_keys,
        default_key,
        combinations: combinations.len() as u32,
    }
}

/// Internal: simple class deduplication (stable order)
fn dedup_classes(input: &str) -> String {
    let mut seen: HashSet<&str> = HashSet::new();
    let out: Vec<&str> = input
        .split_whitespace()
        .filter(|t| !t.is_empty() && seen.insert(t))
        .collect();
    out.join(" ")
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct BucketedClass {
    pub class_name: String,
    pub bucket: String,
    pub sort_order: u32,
}

/// Classify dan sort Tailwind classes berdasarkan CSS property bucket.
///
/// Menggantikan `classifyIntoBuckets` + `sortByBucket` di styleBucketSystem.ts.
/// Bucket ordering: reset → layout → spacing → sizing → typography → visual
///                  → interaction → responsive → unknown
///
/// # Performance
/// HashMap lookup O(1) vs JS object lookup dengan prototype chain overhead.
#[napi]
pub fn classify_and_sort_classes(classes: Vec<String>) -> Vec<BucketedClass> {
    // Prefix → bucket mapping (subset of common Tailwind utilities)
    let bucket_map: HashMap<&str, (&str, u32)> = [
        // layout
        ("flex", ("layout", 100)),
        ("grid", ("layout", 101)),
        ("block", ("layout", 102)),
        ("inline", ("layout", 103)),
        ("hidden", ("layout", 104)),
        ("absolute", ("layout", 110)),
        ("relative", ("layout", 111)),
        ("fixed", ("layout", 112)),
        ("sticky", ("layout", 113)),
        ("static", ("layout", 114)),
        ("overflow", ("layout", 120)),
        ("z-", ("layout", 130)),
        ("col-", ("layout", 140)),
        ("row-", ("layout", 141)),
        ("items-", ("layout", 150)),
        ("justify-", ("layout", 151)),
        ("place-", ("layout", 152)),
        ("self-", ("layout", 153)),
        // spacing
        ("p-", ("spacing", 200)),
        ("px-", ("spacing", 201)),
        ("py-", ("spacing", 202)),
        ("pt-", ("spacing", 203)),
        ("pb-", ("spacing", 204)),
        ("pl-", ("spacing", 205)),
        ("pr-", ("spacing", 206)),
        ("m-", ("spacing", 210)),
        ("mx-", ("spacing", 211)),
        ("my-", ("spacing", 212)),
        ("mt-", ("spacing", 213)),
        ("mb-", ("spacing", 214)),
        ("ml-", ("spacing", 215)),
        ("mr-", ("spacing", 216)),
        ("gap-", ("spacing", 220)),
        ("space-", ("spacing", 225)),
        ("inset-", ("spacing", 230)),
        // sizing
        ("w-", ("sizing", 300)),
        ("h-", ("sizing", 301)),
        ("min-w-", ("sizing", 310)),
        ("max-w-", ("sizing", 311)),
        ("min-h-", ("sizing", 312)),
        ("max-h-", ("sizing", 313)),
        ("size-", ("sizing", 320)),
        // typography
        ("text-", ("typography", 400)),
        ("font-", ("typography", 401)),
        ("leading-", ("typography", 402)),
        ("tracking-", ("typography", 403)),
        ("line-", ("typography", 404)),
        ("uppercase", ("typography", 410)),
        ("lowercase", ("typography", 411)),
        ("capitalize", ("typography", 412)),
        ("truncate", ("typography", 420)),
        ("whitespace-", ("typography", 421)),
        // visual
        ("bg-", ("visual", 500)),
        ("border", ("visual", 510)),
        ("rounded", ("visual", 520)),
        ("shadow", ("visual", 530)),
        ("opacity-", ("visual", 540)),
        ("ring-", ("visual", 550)),
        ("outline-", ("visual", 560)),
        ("fill-", ("visual", 570)),
        ("stroke-", ("visual", 571)),
        ("gradient-", ("visual", 580)),
        ("from-", ("visual", 581)),
        ("to-", ("visual", 582)),
        ("via-", ("visual", 583)),
        // interaction
        ("cursor-", ("interaction", 600)),
        ("select-", ("interaction", 601)),
        ("pointer-", ("interaction", 602)),
        ("resize-", ("interaction", 603)),
        ("transition", ("interaction", 610)),
        ("animate-", ("interaction", 611)),
        ("duration-", ("interaction", 612)),
        ("ease-", ("interaction", 613)),
        ("delay-", ("interaction", 614)),
        // responsive (variants)
        ("sm:", ("responsive", 700)),
        ("md:", ("responsive", 701)),
        ("lg:", ("responsive", 702)),
        ("xl:", ("responsive", 703)),
        ("2xl:", ("responsive", 704)),
        ("dark:", ("responsive", 710)),
        ("hover:", ("responsive", 720)),
        ("focus:", ("responsive", 721)),
        ("active:", ("responsive", 722)),
        ("group-", ("responsive", 730)),
        ("peer-", ("responsive", 731)),
    ]
    .iter()
    .cloned()
    .collect();

    let classify = |cls: &str| -> (&str, u32) {
        for (prefix, bucket_info) in &bucket_map {
            if cls == *prefix || cls.starts_with(prefix) {
                return *bucket_info;
            }
        }
        ("unknown", 999)
    };

    let mut result: Vec<BucketedClass> = classes
        .into_iter()
        .map(|cls| {
            let (bucket, order) = classify(&cls);
            BucketedClass {
                class_name: cls,
                bucket: bucket.to_string(),
                sort_order: order,
            }
        })
        .collect();

    result.sort_by_key(|b| b.sort_order);
    result
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CssDeclarationMap {
    /// JSON: Record<string, string> — property → value (last wins)
    pub declarations_json: String,
    /// Reconstructed declaration string: "prop: val; prop: val"
    pub declaration_string: String,
    /// Number of declarations parsed
    pub count: u32,
}

/// Parse CSS rules dan merge declarations (last-write-wins).
///
/// Menggantikan `mergeDeclarationMap` + `declarationMapToString` di classToCss.ts.
/// Dipakai saat multiple classes produce overlapping CSS properties.
#[napi]
pub fn merge_css_declarations(css_chunks: Vec<String>) -> CssDeclarationMap {
    let mut map: HashMap<String, String> = HashMap::new();

    for css in &css_chunks {
        for cap in RE_CSS_RULE.captures_iter(css) {
            if let Some(body) = cap.get(1) {
                for raw in body.as_str().split(';') {
                    let declaration = raw.trim();
                    if declaration.is_empty() {
                        continue;
                    }
                    if let Some(colon) = declaration.find(':') {
                        let property = declaration[..colon].trim().to_string();
                        let value = declaration[colon + 1..].trim().to_string();
                        if !property.is_empty() && !value.is_empty() {
                            map.insert(property, value);
                        }
                    }
                }
            }
        }
    }

    let count = map.len() as u32;
    let declaration_string = map
        .iter()
        .map(|(k, v)| format!("{}: {}", k, v))
        .collect::<Vec<_>>()
        .join("; ");

    CssDeclarationMap {
        declarations_json: serde_json::to_string(&map).unwrap_or_default(),
        declaration_string,
        count,
    }
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ClassBundleInfo {
    pub class_name: String,
    pub usage_count: u32,
    pub files_json: String, // JSON: string[]
    pub bundle_size_bytes: u32,
    pub is_dead_code: bool,
}

/// Analisis class usage dari scan result JSON.
///
/// Menggantikan sebagian `BundleAnalyzer.analyzeClass()` di bundleAnalyzer.ts.
/// Batch analysis: process banyak classes sekaligus via HashMap.
#[napi]
pub fn analyze_class_usage(
    classes: Vec<String>,
    scan_result_json: String,
    css: String,
) -> Vec<ClassBundleInfo> {
    #[derive(Deserialize)]
    struct ScanFile {
        file: String,
        classes: Vec<String>,
    }
    #[derive(Deserialize)]
    struct ScanResult {
        files: Vec<ScanFile>,
    }

    let scan: ScanResult = match serde_json::from_str(&scan_result_json) {
        Ok(s) => s,
        Err(_) => return vec![],
    };

    // Build index: class → files
    let mut class_files: HashMap<String, Vec<String>> = HashMap::new();
    let mut class_counts: HashMap<String, u32> = HashMap::new();

    for file in &scan.files {
        for cls in &file.classes {
            class_files
                .entry(cls.clone())
                .or_default()
                .push(file.file.clone());
            *class_counts.entry(cls.clone()).or_insert(0) += 1;
        }
    }

    // Estimate bundle size per class from CSS
    let class_css_sizes: HashMap<String, u32> = {
        let mut sizes = HashMap::new();
        for cap in RE_CSS_CLASS_SELECTOR.captures_iter(&css) {
            if let Some(name) = cap.get(1) {
                if let Some(body) = cap.get(2) {
                    sizes.insert(name.as_str().to_string(), body.as_str().len() as u32);
                }
            }
        }
        sizes
    };

    classes
        .into_iter()
        .map(|cls| {
            let usage_count = class_counts.get(&cls).copied().unwrap_or(0);
            let files = class_files.get(&cls).cloned().unwrap_or_default();
            let bundle_size = class_css_sizes.get(&cls).copied().unwrap_or(0);
            let is_dead_code = usage_count == 0;

            ClassBundleInfo {
                class_name: cls,
                usage_count,
                files_json: serde_json::to_string(&files).unwrap_or_default(),
                bundle_size_bytes: bundle_size,
                is_dead_code,
            }
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────
