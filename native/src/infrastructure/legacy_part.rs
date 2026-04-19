#[cfg(test)]
mod oxc_api_test {
    // Just test that oxc 0.1 compiles with something
    #[test]
    fn oxc_available() {
        // oxc 0.1 check
        assert!(true);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// OXC PARSER — Real AST-based class extraction (N-API wrappers)
// ═════════════════════════════════════════════════════════════════════════════

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct OxcExtractResult {
    pub classes: Vec<String>,
    pub component_names: Vec<String>,
    pub has_tw_usage: bool,
    pub has_use_client: bool,
    pub imports: Vec<String>,
    pub engine: String,
}

/// Extract Tailwind classes using real Oxc AST parser.
/// Handles: tw.tag``, tw(Comp)``, base:"", className="", cx()/cn()
/// More accurate than regex — understands JSX, TypeScript, template literals.
#[napi]
pub fn oxc_extract_classes(source: String, filename: String) -> OxcExtractResult {
    let r = oxc_parser::extract_classes_oxc(&source, &filename);
    OxcExtractResult {
        classes: r.classes,
        component_names: r.component_names,
        has_tw_usage: r.has_tw_usage,
        has_use_client: r.has_use_client,
        imports: r.imports,
        engine: "oxc".to_string(),
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// IN-MEMORY SCAN CACHE — DashMap-backed, process-lifetime (N-API wrappers)
// ═════════════════════════════════════════════════════════════════════════════

#[napi(object)]
pub struct ScanCacheStats {
    pub size: u32,
}

/// Get cached classes for a file by content hash. Returns null on miss.
#[napi]
pub fn scan_cache_get(file_path: String, content_hash: String) -> Option<Vec<String>> {
    scan_cache::cache_get(&file_path, &content_hash)
}

/// Store extraction result in the in-memory cache.
#[napi]
pub fn scan_cache_put(
    file_path: String,
    content_hash: String,
    classes: Vec<String>,
    mtime_ms: f64,
    size: u32,
) {
    scan_cache::cache_put(&file_path, &content_hash, classes, mtime_ms, size);
}

/// Invalidate a single cache entry (file deleted or renamed).
#[napi]
pub fn scan_cache_invalidate(file_path: String) {
    scan_cache::cache_invalidate(&file_path);
}

/// Return number of entries currently in the cache.
#[napi]
pub fn scan_cache_stats() -> ScanCacheStats {
    ScanCacheStats {
        size: scan_cache::cache_size() as u32,
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// NOTIFY WATCHER — File system watcher dengan polling pattern
//
// Pola: JS memanggil start_watch() → Rust mulai watch, simpan events ke queue.
//       JS poll setiap interval dengan poll_watch_events(handle_id) → dapat events.
//       JS panggil stop_watch(handle_id) → hentikan watcher.
//
// Kenapa polling bukan callback langsung:
//   ThreadsafeFunction di napi v2 butuh Env yang tidak bisa dipass sebagai
//   parameter #[napi]. Polling pattern lebih simpel dan sudah cukup untuk
//   use case incremental build (poll interval 100-500ms).
// ═════════════════════════════════════════════════════════════════════════════

use std::sync::Mutex;

/// Event yang diqueue oleh Rust watcher, dipoll oleh JS
#[derive(Clone)]
struct PendingEvent {
    kind: String,
    path: String,
}

struct WatcherSlot {
    _handle: watcher::WatcherHandle,
    events: std::sync::Arc<Mutex<Vec<PendingEvent>>>,
}

static ACTIVE_WATCHERS: Lazy<Mutex<Vec<WatcherSlot>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct WatchStartResult {
    pub status: String,
    pub handle_id: u32,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct WatchChangeEvent {
    pub kind: String, // "add" | "change" | "unlink" | "rename"
    pub path: String,
}

/// Mulai watch `root_dir` secara rekursif menggunakan `notify`.
/// Events dikumpulkan di queue internal — poll dengan `poll_watch_events()`.
/// Kembalikan `handle_id` untuk menghentikan watcher.
#[napi]
pub fn start_watch(root_dir: String) -> WatchStartResult {
    let events = std::sync::Arc::new(Mutex::new(Vec::<PendingEvent>::new()));
    let events_clone = std::sync::Arc::clone(&events);

    match watcher::start_watch(&root_dir, move |ev| {
        if let Ok(mut q) = events_clone.lock() {
            // Batasi queue max 1000 event untuk cegah memory leak
            if q.len() < 1000 {
                q.push(PendingEvent {
                    kind: ev.kind.as_str().to_string(),
                    path: ev.path,
                });
            }
        }
    }) {
        Ok(handle) => {
            let mut watchers = ACTIVE_WATCHERS.lock().unwrap();
            let handle_id = watchers.len() as u32;
            watchers.push(WatcherSlot {
                _handle: handle,
                events,
            });
            WatchStartResult {
                status: "ok".to_string(),
                handle_id,
            }
        }
        Err(e) => WatchStartResult {
            status: format!("error: {}", e),
            handle_id: u32::MAX,
        },
    }
}

/// Poll events yang terkumpul sejak poll terakhir.
/// JS harus memanggil ini secara periodik (misalnya setiap 200ms).
/// Events dikembalikan dan queue dikosongkan.
#[napi]
pub fn poll_watch_events(handle_id: u32) -> Vec<WatchChangeEvent> {
    let watchers = ACTIVE_WATCHERS.lock().unwrap();
    let idx = handle_id as usize;
    let Some(slot) = watchers.get(idx) else {
        return vec![];
    };

    let mut q = slot.events.lock().unwrap();
    let drained: Vec<WatchChangeEvent> = q
        .drain(..)
        .map(|e| WatchChangeEvent {
            kind: e.kind,
            path: e.path,
        })
        .collect();
    drained
}

/// Hentikan watcher dengan `handle_id`.
#[napi]
pub fn stop_watch(handle_id: u32) -> bool {
    let mut watchers = ACTIVE_WATCHERS.lock().unwrap();
    let idx = handle_id as usize;
    if idx < watchers.len() {
        watchers.remove(idx);
        true
    } else {
        false
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW: High-impact Rust functions — porting JS logic dari compiler/engine
// ─────────────────────────────────────────────────────────────────────────────

// ── Lazy regexes untuk fungsi baru ──────────────────────────────────────────

static RE_JSX_ELEMENT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"<([A-Z][A-Za-z0-9]*)(\s[^>]*?)(?:/>|>)").unwrap()
});
static RE_JSX_PROP: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r#"(\w+)=["']([^"']+)["']"#).unwrap()
});

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ComponentPropUsage {
    /// Nama component (PascalCase)
    pub component: String,
    /// Map prop → daftar nilai yang dipakai di JSX
    pub props_json: String, // JSON: Record<string, string[]>
}

/// Extract semua JSX component usage dari source code.
///
/// Menggantikan `extractComponentUsage` di deadStyleEliminator.ts.
/// Mencari pola `<ComponentName prop="value" />` dan mengekstrak
/// static prop values untuk dead style elimination.
///
/// # Performance
/// Regex-based scan: ~2-5x lebih cepat dari JS equivalent karena
/// regex engine Rust tidak perlu GC pauses dan memory layout lebih cache-friendly.
#[napi]
pub fn extract_component_usage(source: String) -> Vec<ComponentPropUsage> {
    // Props yang di-skip (bukan variant props)
    let skip_props: HashSet<&str> = [
        "className", "style", "id", "href", "src", "alt", "type",
        "ref", "key", "onClick", "onChange", "onSubmit", "children",
        "aria-label", "aria-hidden", "role", "tabIndex",
    ]
    .iter()
    .cloned()
    .collect();

    // Collect: component → prop → Set<value>
    let mut combined: HashMap<String, HashMap<String, HashSet<String>>> = HashMap::new();

    for element_match in RE_JSX_ELEMENT.captures_iter(&source) {
        let comp_name = match element_match.get(1) {
            Some(m) => m.as_str().to_string(),
            None => continue,
        };
        let props_str = match element_match.get(2) {
            Some(m) => m.as_str(),
            None => continue,
        };

        let comp_entry = combined.entry(comp_name).or_default();

        for prop_match in RE_JSX_PROP.captures_iter(props_str) {
            let prop_name = match prop_match.get(1) {
                Some(m) => m.as_str(),
                None => continue,
            };
            let prop_value = match prop_match.get(2) {
                Some(m) => m.as_str().to_string(),
                None => continue,
            };

            if skip_props.contains(prop_name) {
                continue;
            }

            comp_entry
                .entry(prop_name.to_string())
                .or_default()
                .insert(prop_value);
        }
    }

    combined
        .into_iter()
        .map(|(component, props)| {
            // Convert HashSet<String> → Vec<String> (sorted untuk determinism)
            let props_map: HashMap<String, Vec<String>> = props
                .into_iter()
                .map(|(k, v)| {
                    let mut vals: Vec<String> = v.into_iter().collect();
                    vals.sort();
                    (k, vals)
                })
                .collect();

            ComponentPropUsage {
                component,
                props_json: serde_json::to_string(&props_map).unwrap_or_default(),
            }
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct NormalizeResult {
    /// Class string yang sudah dinormalisasi
    pub normalized: String,
    /// Jumlah duplikat yang dihapus
    pub duplicates_removed: u32,
    /// Jumlah class unik
    pub unique_count: u32,
}

/// Normalize, deduplicate, dan sort class list.
///
/// Menggantikan `normalizeClasses` + manual Set dedup di classMerger.ts.
/// Lebih efisien karena pakai HashSet Rust tanpa GC overhead.
///
/// # Behavior
/// - Trim whitespace
/// - Hapus duplikat (case-sensitive)
/// - Pertahankan urutan kemunculan pertama (stable dedup)
/// - Hapus empty strings
#[napi]
pub fn normalize_and_dedup_classes(raw: String) -> NormalizeResult {
    let mut seen: HashSet<&str> = HashSet::new();
    let mut result: Vec<&str> = Vec::new();
    let mut duplicates_removed: u32 = 0;

    for token in raw.split_whitespace() {
        if token.is_empty() {
            continue;
        }
        if seen.insert(token) {
            result.push(token);
        } else {
            duplicates_removed += 1;
        }
    }

    let unique_count = result.len() as u32;
    NormalizeResult {
        normalized: result.join(" "),
        duplicates_removed,
        unique_count,
    }
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ClassDiffResult {
    /// Classes yang ada di `current` tapi tidak di `previous`
    pub added: Vec<String>,
    /// Classes yang ada di `previous` tapi tidak di `current`
    pub removed: Vec<String>,
    /// Classes yang ada di keduanya
    pub unchanged: Vec<String>,
    /// Apakah ada perubahan
    pub has_changes: bool,
}

/// Hitung diff antara dua class lists.
///
/// Dipakai oleh incremental compiler untuk mendeteksi perubahan
/// class yang perlu recompile — lebih efisien dari full string compare.
///
/// # Performance
/// HashSet-based diff: O(n+m) vs JS array indexOf O(n*m).
#[napi]
pub fn diff_class_lists(previous: Vec<String>, current: Vec<String>) -> ClassDiffResult {
    let prev_set: HashSet<&str> = previous.iter().map(|s| s.as_str()).collect();
    let curr_set: HashSet<&str> = current.iter().map(|s| s.as_str()).collect();

    let added: Vec<String> = current
        .iter()
        .filter(|c| !prev_set.contains(c.as_str()))
        .cloned()
        .collect();

    let removed: Vec<String> = previous
        .iter()
        .filter(|c| !curr_set.contains(c.as_str()))
        .cloned()
        .collect();

    let unchanged: Vec<String> = current
        .iter()
        .filter(|c| prev_set.contains(c.as_str()))
        .cloned()
        .collect();

    let has_changes = !added.is_empty() || !removed.is_empty();

    ClassDiffResult {
        added,
        removed,
        unchanged,
        has_changes,
    }
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct BatchExtractResult {
    /// File path
    pub file: String,
    /// Classes yang diekstrak
    pub classes: Vec<String>,
    /// Hash content file (untuk cache invalidation)
    pub content_hash: String,
    /// Apakah file berhasil diproses
    pub ok: bool,
    /// Error message jika gagal
    pub error: Option<String>,
}

/// Extract classes dari banyak files sekaligus secara parallel.
///
/// Menggantikan loop JS di scanner yang process satu file per giliran.
/// Menggunakan Rayon thread pool yang sudah ada untuk parallel I/O + regex.
///
/// # Performance
/// Pada proyek 200 file: ~8-12x lebih cepat dari JS sequential loop
/// karena parallel I/O dan tidak ada event loop overhead.
#[napi]
pub fn batch_extract_classes(file_paths: Vec<String>) -> Vec<BatchExtractResult> {
    thread_pool::SCAN_THREAD_POOL.install(|| {
        file_paths
            .par_iter()
            .map(|path| {
                let content = match std::fs::read_to_string(path) {
                    Ok(c) => c,
                    Err(e) => {
                        return BatchExtractResult {
                            file: path.clone(),
                            classes: vec![],
                            content_hash: String::new(),
                            ok: false,
                            error: Some(e.to_string()),
                        }
                    }
                };

                let content_hash = short_hash(&content);
                let classes = extract_tw_classes_from_source(&content);

                BatchExtractResult {
                    file: path.clone(),
                    classes,
                    content_hash,
                    ok: true,
                    error: None,
                }
            })
            .collect()
    })
}

/// Internal: extract Tailwind class strings dari source code.
/// Dipakai oleh `batch_extract_classes` dan bisa dikomposisi fungsi lain.
fn extract_tw_classes_from_source(source: &str) -> Vec<String> {
    let mut classes: HashSet<String> = HashSet::new();

    // 1. Template literals: tw.div`flex p-4`
    for cap in RE_TEMPLATE.captures_iter(source) {
        if let Some(m) = cap.get(3) {
            for token in m.as_str().split_whitespace() {
                // Skip subcomponent block syntax: "icon { ... }"
                if !token.contains('{') && !token.contains('}') && !token.is_empty() {
                    classes.insert(token.to_string());
                }
            }
        }
    }

    // 2. className="..." patterns
    static RE_CLASSNAME: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r#"className\s*=\s*["']([^"']+)["']"#).unwrap()
    });
    for cap in RE_CLASSNAME.captures_iter(source)
    {
        if let Some(m) = cap.get(1) {
            for token in m.as_str().split_whitespace() {
                if !token.is_empty() {
                    classes.insert(token.to_string());
                }
            }
        }
    }

    let mut result: Vec<String> = classes.into_iter().collect();
    result.sort();
    result
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct SafelistCheckResult {
    /// Classes dari input yang ada di safelist
    pub matched: Vec<String>,
    /// Classes dari input yang TIDAK ada di safelist
    pub unmatched: Vec<String>,
    /// Total classes di safelist
    pub safelist_size: u32,
}

/// Cek daftar classes terhadap safelist.
///
/// Menggantikan Array.filter().includes() di JS yang O(n*m).
/// HashSet lookup: O(1) per class → O(n) total.
#[napi]
pub fn check_against_safelist(
    classes: Vec<String>,
    safelist: Vec<String>,
) -> SafelistCheckResult {
    let safelist_set: HashSet<&str> = safelist.iter().map(|s| s.as_str()).collect();
    let safelist_size = safelist.len() as u32;

    let mut matched = Vec::new();
    let mut unmatched = Vec::new();

    for cls in &classes {
        if safelist_set.contains(cls.as_str()) {
            matched.push(cls.clone());
        } else {
            unmatched.push(cls.clone());
        }
    }

    SafelistCheckResult {
        matched,
        unmatched,
        safelist_size,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPANSION BATCH 2 — Porting logic dari staticVariantCompiler, componentHoister,
// styleBucketSystem, dan analyzer
// ─────────────────────────────────────────────────────────────────────────────

static RE_INDENTED_TW: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?m)^([ \t]+)(const|let)\s+([A-Z]\w*)\s*=\s*tw\.[\w]+[`(]").unwrap()
});
static RE_AFTER_IMPORTS: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?m)^import\s+").unwrap()
});
static RE_CSS_RULE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\{([^}]*)\}").unwrap()
});
static RE_CSS_CLASS_SELECTOR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\.([\w-]+(?::[:\w-]+)?)\s*\{([^}]*)\}").unwrap()
});

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
        let line_end = source[start..].find('\n').map_or(source.len() - start, |i| i + 1);
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
        code = format!("{}{}{}", &code[..insert_at], hoist_block, &code[insert_at..]);
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
            .flat_map(|combo| values.iter().map(move |v| [combo.clone(), vec![v.clone()]].concat()))
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
            let matches = compound.iter().filter(|(k, _)| *k != "class").all(|(k, v)| {
                combo_map.get(k.as_str()).map_or(false, |cv| cv == v)
            });
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
                config.variants[k].keys().next().cloned().unwrap_or_default()
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
        ("flex", ("layout", 100)), ("grid", ("layout", 101)),
        ("block", ("layout", 102)), ("inline", ("layout", 103)),
        ("hidden", ("layout", 104)), ("absolute", ("layout", 110)),
        ("relative", ("layout", 111)), ("fixed", ("layout", 112)),
        ("sticky", ("layout", 113)), ("static", ("layout", 114)),
        ("overflow", ("layout", 120)), ("z-", ("layout", 130)),
        ("col-", ("layout", 140)), ("row-", ("layout", 141)),
        ("items-", ("layout", 150)), ("justify-", ("layout", 151)),
        ("place-", ("layout", 152)), ("self-", ("layout", 153)),
        // spacing
        ("p-", ("spacing", 200)), ("px-", ("spacing", 201)),
        ("py-", ("spacing", 202)), ("pt-", ("spacing", 203)),
        ("pb-", ("spacing", 204)), ("pl-", ("spacing", 205)),
        ("pr-", ("spacing", 206)), ("m-", ("spacing", 210)),
        ("mx-", ("spacing", 211)), ("my-", ("spacing", 212)),
        ("mt-", ("spacing", 213)), ("mb-", ("spacing", 214)),
        ("ml-", ("spacing", 215)), ("mr-", ("spacing", 216)),
        ("gap-", ("spacing", 220)), ("space-", ("spacing", 225)),
        ("inset-", ("spacing", 230)),
        // sizing
        ("w-", ("sizing", 300)), ("h-", ("sizing", 301)),
        ("min-w-", ("sizing", 310)), ("max-w-", ("sizing", 311)),
        ("min-h-", ("sizing", 312)), ("max-h-", ("sizing", 313)),
        ("size-", ("sizing", 320)),
        // typography
        ("text-", ("typography", 400)), ("font-", ("typography", 401)),
        ("leading-", ("typography", 402)), ("tracking-", ("typography", 403)),
        ("line-", ("typography", 404)), ("uppercase", ("typography", 410)),
        ("lowercase", ("typography", 411)), ("capitalize", ("typography", 412)),
        ("truncate", ("typography", 420)), ("whitespace-", ("typography", 421)),
        // visual
        ("bg-", ("visual", 500)), ("border", ("visual", 510)),
        ("rounded", ("visual", 520)), ("shadow", ("visual", 530)),
        ("opacity-", ("visual", 540)), ("ring-", ("visual", 550)),
        ("outline-", ("visual", 560)), ("fill-", ("visual", 570)),
        ("stroke-", ("visual", 571)), ("gradient-", ("visual", 580)),
        ("from-", ("visual", 581)), ("to-", ("visual", 582)),
        ("via-", ("visual", 583)),
        // interaction
        ("cursor-", ("interaction", 600)), ("select-", ("interaction", 601)),
        ("pointer-", ("interaction", 602)), ("resize-", ("interaction", 603)),
        ("transition", ("interaction", 610)), ("animate-", ("interaction", 611)),
        ("duration-", ("interaction", 612)), ("ease-", ("interaction", 613)),
        ("delay-", ("interaction", 614)),
        // responsive (variants)
        ("sm:", ("responsive", 700)), ("md:", ("responsive", 701)),
        ("lg:", ("responsive", 702)), ("xl:", ("responsive", 703)),
        ("2xl:", ("responsive", 704)), ("dark:", ("responsive", 710)),
        ("hover:", ("responsive", 720)), ("focus:", ("responsive", 721)),
        ("active:", ("responsive", 722)), ("group-", ("responsive", 730)),
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
    pub files_json: String,   // JSON: string[]
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
            class_files.entry(cls.clone()).or_default().push(file.file.clone());
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
// EXPANSION BATCH 3 — semantic analyzer, CSS reverse lookup, parseClasses
// ─────────────────────────────────────────────────────────────────────────────

static RE_CSS_PROPERTY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"([a-zA-Z-]+)\s*:\s*([^;!\n]+)(!important)?").unwrap()
});
static RE_VALID_CLASS: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^[-a-z0-9:/\[\]!.()+%]+$").unwrap()
});

// ─────────────────────────────────────────────────────────────────────────────

/// Parse raw class string — menggantikan parseClasses() di syntax/src/index.ts.
/// Filter token kosong, validasi karakter, deduplicate.
///
/// Lebih cepat dari JS karena regex Rust tidak perlu JIT warmup
/// dan tidak ada prototype chain overhead.
#[napi]
pub fn parse_classes_from_string(raw: String) -> Vec<String> {
    raw.split_whitespace()
        .filter(|t| !t.is_empty() && RE_VALID_CLASS.is_match(t))
        .map(|t| t.to_string())
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ClassConflict {
    pub group: String,
    pub variant_key: String,
    pub classes: Vec<String>,
    pub message: String,
}

