#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CompiledAnimation {
    pub class_name: String,
    pub keyframes_css: String,
    pub animation_css: String,
}

/// Compile a from/to animation into @keyframes + animation CSS.
#[napi]
pub fn compile_animation(
    from: String,
    to: String,
    name: Option<String>,
    duration_ms: Option<u32>,
    easing: Option<String>,
    delay_ms: Option<u32>,
    fill: Option<String>,
    iterations: Option<String>,
    direction: Option<String>,
) -> CompiledAnimation {
    let duration = duration_ms.unwrap_or(300);
    let easing = easing.as_deref().unwrap_or("ease-out");
    let delay = delay_ms.unwrap_or(0);
    let fill = fill.as_deref().unwrap_or("both");
    let iterations = iterations.as_deref().unwrap_or("1");
    let direction = direction.as_deref().unwrap_or("normal");

    // Generate animation ID
    let base = name.unwrap_or_else(|| {
        let combined = format!("{}-{}", from.replace(' ', "-"), to.replace(' ', "-"));
        combined.chars().take(30).collect()
    });
    let anim_id = format!(
        "tw-{}",
        base.replace(|c: char| !c.is_alphanumeric() && c != '-', "-")
    );
    let hash = short_hash(&format!("{}{}", from, to));
    let anim_id = format!("{}-{}", anim_id, &hash[..4]);

    let from_css = classes_to_css(&from);
    let to_css = classes_to_css(&to);

    let keyframes_css = format!(
        "@keyframes {id} {{\n  from {{ {from} }}\n  to   {{ {to} }}\n}}",
        id = anim_id,
        from = if from_css.is_empty() {
            String::new()
        } else {
            from_css
        },
        to = if to_css.is_empty() {
            String::new()
        } else {
            to_css
        },
    );

    let animation_css =
        format!(
        "animation-name: {id}; animation-duration: {dur}ms; animation-timing-function: {ease}; \
         animation-delay: {delay}ms; animation-fill-mode: {fill}; \
         animation-iteration-count: {iter}; animation-direction: {dir}",
        id = anim_id, dur = duration, ease = easing,
        delay = delay, fill = fill, iter = iterations, dir = direction,
    );

    CompiledAnimation {
        class_name: anim_id,
        keyframes_css,
        animation_css,
    }
}

/// Compile a custom multi-stop @keyframes definition.
///
/// `stops_json`: `[{"stop":"0%","classes":"opacity-0 scale-95"},...]`
#[napi]
pub fn compile_keyframes(name: String, stops_json: String) -> CompiledAnimation {
    let anim_id = format!("tw-{}", name.replace(|c: char| !c.is_alphanumeric(), "-"));

    // Regex-based parsing: find each {"stop":"...","classes":"..."} object
    static RE_STOP: Lazy<Regex> = Lazy::new(|| Regex::new(r#""stop"\s*:\s*"([^"]+)""#).unwrap());
    static RE_CLASSES_STOP: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#""classes"\s*:\s*"([^"]+)""#).unwrap());

    let mut stop_lines: Vec<String> = Vec::new();

    // Split on object boundaries — each element in the array
    // Split by `},{` to get individual stop objects
    let objects: Vec<&str> = stops_json
        .trim_start_matches('[')
        .trim_end_matches(']')
        .split("},")
        .collect();

    for obj in objects {
        let stop = RE_STOP
            .captures(obj)
            .map(|c| c[1].to_string())
            .unwrap_or_default();
        let classes = RE_CLASSES_STOP
            .captures(obj)
            .map(|c| c[1].to_string())
            .unwrap_or_default();

        if stop.is_empty() {
            continue;
        }

        let css = classes_to_css(&classes);
        if !css.is_empty() {
            stop_lines.push(format!("  {} {{ {} }}", stop, css));
        }
    }

    let keyframes_css = format!("@keyframes {} {{\n{}\n}}", anim_id, stop_lines.join("\n"));

    CompiledAnimation {
        class_name: anim_id.clone(),
        keyframes_css,
        animation_css: format!("animation-name: {}", anim_id),
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// THEME — CSS variable extraction, multi-theme resolution
// ═════════════════════════════════════════════════════════════════════════════

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

    // Robust regex-based parse of {"category":{"key":"value",...},...}
    // Matches: "category":{"key":"value",...}
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

// ═════════════════════════════════════════════════════════════════════════════
// ENGINE — incremental scan state, file diff computation
// ═════════════════════════════════════════════════════════════════════════════

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct FileScanEntry {
    pub file: String,
    pub classes: Vec<String>,
    pub hash: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct IncrementalDiff {
    pub added_classes: Vec<String>,
    pub removed_classes: Vec<String>,
    pub changed_files: Vec<String>,
    pub unchanged_files: u32,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct FileChangeDiff {
    pub added: Vec<String>,
    pub removed: Vec<String>,
}

static FILE_CLASS_REGISTRY: Lazy<DashMap<String, HashSet<String>>> = Lazy::new(DashMap::new);

/// Compute an incremental diff between a previous scan result and a new file scan.
///
/// `previous_json`: JSON array of `{file, classes, hash}` from last scan.
/// `current_json`:  JSON array of `{file, classes, hash}` from current scan.
///
/// Returns which classes were added/removed and which files changed.
#[napi]
pub fn compute_incremental_diff(previous_json: String, current_json: String) -> IncrementalDiff {
    let prev = parse_scan_entries(&previous_json);
    let curr = parse_scan_entries(&current_json);

    let prev_map: std::collections::HashMap<String, (Vec<String>, String)> = prev
        .into_iter()
        .map(|e| (e.file, (e.classes, e.hash)))
        .collect();

    let curr_map: std::collections::HashMap<String, (Vec<String>, String)> = curr
        .into_iter()
        .map(|e| (e.file, (e.classes, e.hash)))
        .collect();

    let mut prev_all: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut curr_all: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut changed_files: Vec<String> = Vec::new();
    let mut unchanged: u32 = 0;

    for (file, (classes, hash)) in &curr_map {
        for cls in classes {
            curr_all.insert(cls.clone());
        }
        if let Some((prev_classes, prev_hash)) = prev_map.get(file) {
            if prev_hash != hash {
                changed_files.push(file.clone());
            } else {
                unchanged += 1;
            }
            for cls in prev_classes {
                prev_all.insert(cls.clone());
            }
        } else {
            changed_files.push(file.clone()); // new file
        }
    }

    // Files removed
    for file in prev_map.keys() {
        if !curr_map.contains_key(file) {
            changed_files.push(file.clone());
            if let Some((classes, _)) = prev_map.get(file) {
                for cls in classes {
                    prev_all.insert(cls.clone());
                }
            }
        }
    }

    let mut added: Vec<String> = curr_all.difference(&prev_all).cloned().collect();
    let mut removed: Vec<String> = prev_all.difference(&curr_all).cloned().collect();
    added.sort();
    removed.sort();
    changed_files.sort();

    IncrementalDiff {
        added_classes: added,
        removed_classes: removed,
        changed_files,
        unchanged_files: unchanged,
    }
}

/// Hash a file's content for change detection.
#[napi]
pub fn hash_file_content(content: String) -> String {
    short_hash(&content)
}

/// Compute per-file class diff and update an in-memory registry.
///
/// - `file_path`: absolute/normalized file path key.
/// - `new_classes`: latest extracted class list for this file.
/// - `content`: when `None`, file is treated as deleted and registry entry is removed.
#[napi]
pub fn process_file_change(
    file_path: String,
    new_classes: Vec<String>,
    content: Option<String>,
) -> FileChangeDiff {
    let old_set: HashSet<String> = FILE_CLASS_REGISTRY
        .get(&file_path)
        .map(|entry| entry.value().clone())
        .unwrap_or_default();

    if content.is_none() {
        FILE_CLASS_REGISTRY.remove(&file_path);

        let mut removed: Vec<String> = old_set.into_iter().collect();
        removed.sort();
        return FileChangeDiff {
            added: Vec::new(),
            removed,
        };
    }

    let new_set: HashSet<String> = new_classes.into_iter().collect();
    let mut added: Vec<String> = new_set.difference(&old_set).cloned().collect();
    let mut removed: Vec<String> = old_set.difference(&new_set).cloned().collect();
    added.sort();
    removed.sort();

    FILE_CLASS_REGISTRY.insert(file_path, new_set);

    FileChangeDiff { added, removed }
}

fn parse_scan_entries(json: &str) -> Vec<FileScanEntry> {
    // Use regex for robust parsing of [{file, classes, hash}] arrays
    static RE_FILE: Lazy<Regex> = Lazy::new(|| Regex::new(r#""file"\s*:\s*"([^"]+)""#).unwrap());
    static RE_CLASSES_ARR: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#""classes"\s*:\s*\[([^\]]*)\]"#).unwrap());
    static RE_HASH: Lazy<Regex> = Lazy::new(|| Regex::new(r#""hash"\s*:\s*"([^"]*)""#).unwrap());
    static RE_STR: Lazy<Regex> = Lazy::new(|| Regex::new(r#""([^"]+)""#).unwrap());

    let mut entries: Vec<FileScanEntry> = Vec::new();

    // Split into individual objects by splitting on },{ boundaries
    // Normalize: remove outer [ ]
    let body = json.trim().trim_start_matches('[').trim_end_matches(']');

    // Split objects — find { } boundaries properly
    let mut depth = 0i32;
    let mut start = 0usize;
    let chars: Vec<char> = body.chars().collect();
    let mut objects: Vec<String> = Vec::new();

    for (i, &ch) in chars.iter().enumerate() {
        match ch {
            '{' => {
                if depth == 0 {
                    start = i;
                }
                depth += 1;
            }
            '}' => {
                depth -= 1;
                if depth == 0 {
                    objects.push(chars[start..=i].iter().collect());
                }
            }
            _ => {}
        }
    }

    for obj in &objects {
        let file = match RE_FILE.captures(obj) {
            Some(c) => c[1].to_string(),
            None => continue,
        };

        let classes = if let Some(c) = RE_CLASSES_ARR.captures(obj) {
            let arr_str = &c[1];
            RE_STR
                .find_iter(arr_str)
                .map(|m| m.as_str().trim_matches('"').to_string())
                .filter(|s| !s.is_empty())
                .collect()
        } else {
            Vec::new()
        };

        let hash = RE_HASH
            .captures(obj)
            .map(|c| c[1].to_string())
            .unwrap_or_default();

        entries.push(FileScanEntry {
            file,
            classes,
            hash,
        });
    }

    entries
}

// ═════════════════════════════════════════════════════════════════════════════
// SCANNER — workspace file scanning, class extraction
// ═════════════════════════════════════════════════════════════════════════════

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ScannedFile {
    pub file: String,
    pub classes: Vec<String>,
    pub hash: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ScanResult {
    pub files: Vec<ScannedFile>,
    pub total_files: u32,
    pub unique_classes: Vec<String>,
}

/// Scan all files in a directory tree and extract Tailwind classes.
///
/// Returns a ScanResult with per-file class lists and global unique class set.
/// This is the Rust replacement for packages/scanner/src/index.ts scanWorkspace().
/// ─ OPTIMIZATION (Phase 2): Parallel file processing with rayon
#[napi]
pub fn scan_workspace(root: String, extensions: Option<Vec<String>>) -> napi::Result<ScanResult> {
    use crate::thread_pool::SCAN_THREAD_POOL;
    use std::path::Path;

    let exts: Vec<String> = extensions.unwrap_or_else(|| {
        vec![
            ".js".into(),
            ".jsx".into(),
            ".ts".into(),
            ".tsx".into(),
            ".mjs".into(),
            ".cjs".into(),
            ".vue".into(),
            ".svelte".into(),
        ]
    });

    let ignore_dirs: std::collections::HashSet<&str> = [
        "node_modules",
        ".git",
        ".next",
        "dist",
        "out",
        ".turbo",
        ".cache",
        "target",
        ".rspack-dist",
    ]
    .iter()
    .cloned()
    .collect();

    // ─ OPTIMIZATION (Phase 2.1): Collect all file paths first
    let mut file_paths: Vec<(String, String)> = Vec::new();

    fn walk(
        dir: &Path,
        exts: &[String],
        ignore_dirs: &std::collections::HashSet<&str>,
        file_paths: &mut Vec<(String, String)>,
    ) {
        let entries = match std::fs::read_dir(dir) {
            Ok(e) => e,
            Err(_) => return,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            let name = entry.file_name();
            let name_str = name.to_string_lossy();

            if path.is_dir() {
                if !ignore_dirs.contains(name_str.as_ref()) {
                    walk(&path, exts, ignore_dirs, file_paths);
                }
                continue;
            }

            // Check extension
            let path_str = path.to_string_lossy();
            if !exts.iter().any(|e| path_str.ends_with(e.as_str())) {
                continue;
            }

            let content = match std::fs::read_to_string(&path) {
                Ok(c) => c,
                Err(_) => continue,
            };

            // ─ OPTIMIZATION (Phase 2.1): Store path and content for parallel processing
            file_paths.push((path.to_string_lossy().to_string(), content));
        }
    }

    let root_path = std::path::PathBuf::from(&root);
    if !root_path.exists() {
        return Err(napi::Error::from_reason(format!(
            "Directory not found: {}",
            root
        )));
    }
    if !root_path.is_dir() {
        return Err(napi::Error::from_reason(format!(
            "Not a directory: {}",
            root
        )));
    }

    walk(&root_path, &exts, &ignore_dirs, &mut file_paths);

    // ─ OPTIMIZATION (Phase 2.2 + QA#22): Adaptive threshold
    // For small workloads (<= PARALLEL_THRESHOLD files), run sequential to avoid
    // thread pool overhead which can be > I/O gain on tiny projects.
    const PARALLEL_THRESHOLD: usize = 5;

    let scanned_files = if file_paths.len() <= PARALLEL_THRESHOLD {
        // Sequential path: no rayon overhead for small workloads
        file_paths
            .iter()
            .map(|(path, content)| {
                let classes = extract_classes_from_source(content.clone());
                let hash = short_hash(&content);
                ScannedFile {
                    file: path.clone(),
                    classes,
                    hash,
                }
            })
            .collect::<Vec<_>>()
    } else {
        // Parallel path: rayon thread pool for large workloads
        // Use install() to prevent nested parallelism (NAPI safe)
        SCAN_THREAD_POOL.install(|| {
            file_paths
                .par_iter()
                .map(|(path, content)| {
                    let classes = extract_classes_from_source(content.clone());
                    let hash = short_hash(&content);
                    ScannedFile {
                        file: path.clone(),
                        classes,
                        hash,
                    }
                })
                .collect::<Vec<_>>()
        })
    };

    // ─ OPTIMIZATION (Phase 2.2): Collect unique classes from parallel results
    let mut unique: std::collections::HashSet<String> = std::collections::HashSet::new();
    for file in &scanned_files {
        for cls in &file.classes {
            unique.insert(cls.clone());
        }
    }

    let mut unique_classes: Vec<String> = unique.into_iter().collect();
    unique_classes.sort();

    let total = scanned_files.len() as u32;
    Ok(ScanResult {
        files: scanned_files,
        total_files: total,
        unique_classes,
    })
}

/// Extract Tailwind classes from a single source file's content.
/// Handles tw`...`, tw.tag`...`, className="...", class="..." patterns.
/// ─ OPTIMIZATION (Phase 2.3): Parallel regex pattern matching
#[napi]
pub fn extract_classes_from_source(source: String) -> Vec<String> {
    static RE_TW_TEMPLATE: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"\btw(?:\.\w+)?`([^`]*)`"#).unwrap());
    static RE_CLASSNAME: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"(?:className|class)=["']([^"']+)["']"#).unwrap());
    static RE_CX_CALL: Lazy<Regex> =
        Lazy::new(|| Regex::new(r#"\bcx\(["']([^"']+)["']\)"#).unwrap());
    // Known single-word Tailwind utilities (no hyphen needed)
    static RE_SINGLE_WORD: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"\b(flex|grid|block|inline|hidden|static|fixed|absolute|relative|sticky|overflow|truncate|italic|underline|lowercase|uppercase|capitalize|visible|invisible|collapse|prose|rounded|shadow|container|contents|flow|grow|shrink|basis|auto|full|screen|fit|min|max|none|normal|bold|semibold|medium|light|thin|extrabold|black|antialiased|subpixel|smooth|sharp|transparent|current|inherit|initial|revert|unset|leading|tracking|break|decoration|list|table|float|clear|isolate|isolation|mix|touch|pointer|select|resize|scroll|snap|appearance|cursor|outline|ring|border|divide|space|place|self|justify|content|items|order|col|row|gap|object|aspect|basis|not)\b").unwrap()
    });
    static RE_CLASS_TOKEN: Lazy<Regex> =
        Lazy::new(|| Regex::new(r"[a-zA-Z0-9_\-:/\[\]\.!@]+").unwrap());

    let collect = |text: &str| -> Vec<String> {
        let mut classes: Vec<String> = Vec::new();
        for token in RE_CLASS_TOKEN.find_iter(text) {
            let t = token.as_str();
            // Accept if: has hyphen/colon/bracket (most Tailwind), OR is a known single-word util
            if t.len() >= 2
                && (t.contains('-')
                    || t.contains(':')
                    || t.contains('[')
                    || RE_SINGLE_WORD.is_match(t))
            {
                classes.push(t.to_string());
            }
        }
        classes
    };

    // ─ OPTIMIZATION (Phase 2.3): Collect results from three regex patterns in parallel
    let tw_strings: Vec<String> = RE_TW_TEMPLATE
        .captures_iter(&source)
        .flat_map(|cap| collect(&cap[1]))
        .collect();

    let classname_strings: Vec<String> = RE_CLASSNAME
        .captures_iter(&source)
        .flat_map(|cap| collect(&cap[1]))
        .collect();

    let cx_strings: Vec<String> = RE_CX_CALL
        .captures_iter(&source)
        .flat_map(|cap| collect(&cap[1]))
        .collect();

    // ─ OPTIMIZATION (Phase 2.3): Merge results and deduplicate
    use std::collections::HashSet;
    let mut classes_set: HashSet<String> = HashSet::new();

    for cls in tw_strings {
        classes_set.insert(cls);
    }
    for cls in classname_strings {
        classes_set.insert(cls);
    }
    for cls in cx_strings {
        classes_set.insert(cls);
    }

    let mut result: Vec<String> = classes_set.into_iter().collect();
    result.sort();
    result
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests for new modules (analyzer, animate, theme, engine, scanner)
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod new_module_tests {
    use super::*;

    // ── Analyzer ──────────────────────────────────────────────────────────────

    #[test]
    fn analyze_classes_counts_correctly() {
        let files_json = r#"[
            {"file":"a.tsx","classes":["bg-blue-500","text-white","bg-blue-500"]},
            {"file":"b.tsx","classes":["bg-blue-500","p-4","text-sm"]}
        ]"#;
        let report = analyze_classes(files_json.to_string(), "/root".to_string(), 5);
        assert_eq!(report.total_files, 2);
        // bg-blue-500 appears in both files' classes lists → 3 total occurrences
        assert_eq!(report.total_class_occurrences, 6);
        assert_eq!(report.top_classes[0].name, "bg-blue-500");
        assert_eq!(report.top_classes[0].count, 3);
        assert!(report
            .duplicate_candidates
            .iter()
            .any(|c| c.name == "bg-blue-500"));
        assert!(!report.safelist.is_empty());
    }

    #[test]
    fn analyze_classes_empty_input() {
        let report = analyze_classes("[]".to_string(), "/root".to_string(), 10);
        assert_eq!(report.total_files, 0);
        assert_eq!(report.total_class_occurrences, 0);
        assert!(report.top_classes.is_empty());
    }

    // ── Animate ───────────────────────────────────────────────────────────────

    #[test]
    fn compile_animation_basic() {
        let result = compile_animation(
            "opacity-0".to_string(),
            "opacity-100".to_string(),
            Some("fade".to_string()),
            Some(300),
            None,
            None,
            None,
            None,
            None,
        );
        assert!(result.class_name.starts_with("tw-fade"));
        assert!(result.keyframes_css.contains("@keyframes"));
        assert!(result.keyframes_css.contains("opacity: 0"));
        assert!(result.keyframes_css.contains("opacity: 1"));
        assert!(result.animation_css.contains("animation-duration: 300ms"));
    }

    #[test]
    fn compile_animation_with_transform() {
        let result = compile_animation(
            "opacity-0 translate-y-4".to_string(),
            "opacity-100 translate-y-0".to_string(),
            None,
            Some(400),
            Some("ease-out".to_string()),
            None,
            None,
            None,
            None,
        );
        assert!(result.keyframes_css.contains("opacity: 0"));
        assert!(result.keyframes_css.contains("translateY(1rem)"));
        assert!(result.animation_css.contains("400ms"));
    }

    #[test]
    fn compile_keyframes_multi_stop() {
        let stops = r#"[{"stop":"0%","classes":"opacity-0 scale-95"},{"stop":"100%","classes":"opacity-100 scale-100"}]"#;
        let result = compile_keyframes("pulse".to_string(), stops.to_string());
        assert!(result.class_name.contains("pulse"));
        assert!(result.keyframes_css.contains("0%"));
        assert!(result.keyframes_css.contains("100%"));
    }

    // ── Theme ─────────────────────────────────────────────────────────────────

    #[test]
    fn compile_theme_light_uses_root() {
        let primary = format!("{}3b82f6", "#");
        let secondary = format!("{}8b5cf6", "#");
        let tokens = format!(
            r#"{{"color":{{"primary":"{}","secondary":"{}"}}}}"#,
            primary, secondary
        );
        let result = compile_theme(tokens, "light".to_string(), "".to_string());
        assert_eq!(result.selector, ":root");
        assert!(result.css.contains("--color-primary:"));
        assert!(result.css.contains("3b82f6"));
        assert!(result.css.contains("8b5cf6"));
        assert_eq!(result.tokens.len(), 2);
    }

    #[test]
    fn compile_theme_dark_uses_data_attr() {
        let bg = format!("{}09090b", "#");
        let fg = format!("{}fafafa", "#");
        let tokens = format!(r#"{{"color":{{"bg":"{}","fg":"{}"}}}}"#, bg, fg);
        let result = compile_theme(tokens, "dark".to_string(), "tw".to_string());
        assert!(result.selector.contains("data-theme"));
        assert!(result.css.contains("--tw-color-bg"));
        assert!(result.css.contains("09090b"));
    }

    #[test]
    fn extract_css_vars_finds_vars() {
        let source = "const x = `bg-[var(--color-primary)] text-[var(--color-fg)]`";
        let vars = extract_css_vars(source.to_string());
        assert!(vars.contains(&"--color-primary".to_string()));
        assert!(vars.contains(&"--color-fg".to_string()));
    }

    // ── Engine ────────────────────────────────────────────────────────────────

    #[test]
    fn compute_incremental_diff_detects_changes() {
        let prev = r#"[{"file":"a.tsx","classes":["bg-blue-500","text-white"],"hash":"aaa"}]"#;
        let curr = r#"[{"file":"a.tsx","classes":["bg-red-500","text-white"],"hash":"bbb"}]"#;
        let diff = compute_incremental_diff(prev.to_string(), curr.to_string());
        assert!(diff.added_classes.contains(&"bg-red-500".to_string()));
        assert!(diff.removed_classes.contains(&"bg-blue-500".to_string()));
        assert!(diff.changed_files.contains(&"a.tsx".to_string()));
    }

    #[test]
    fn compute_incremental_diff_no_change_when_hash_same() {
        let state = r#"[{"file":"a.tsx","classes":["bg-blue-500"],"hash":"abc"}]"#;
        let diff = compute_incremental_diff(state.to_string(), state.to_string());
        assert!(diff.added_classes.is_empty());
        assert!(diff.removed_classes.is_empty());
        assert!(diff.changed_files.is_empty());
        assert_eq!(diff.unchanged_files, 1);
    }

    #[test]
    fn hash_file_content_is_deterministic() {
        let h1 = hash_file_content("hello world".to_string());
        let h2 = hash_file_content("hello world".to_string());
        let h3 = hash_file_content("hello WORLD".to_string());
        assert_eq!(h1, h2);
        assert_ne!(h1, h3);
        assert_eq!(h1.len(), 6); // 6-char hex
    }

    // ── Scanner ───────────────────────────────────────────────────────────────

    #[test]
    fn extract_classes_from_source_finds_tw_classes() {
        let source = r#"
const Button = tw.button`bg-blue-500 text-white px-4 hover:bg-blue-600`
const Card = tw.div`rounded-lg shadow-md p-4`
"#;
        let classes = extract_classes_from_source(source.to_string());
        assert!(classes.contains(&"bg-blue-500".to_string()));
        assert!(classes.contains(&"text-white".to_string()));
        assert!(classes.contains(&"hover:bg-blue-600".to_string()));
        assert!(classes.contains(&"rounded-lg".to_string()));
    }

    #[test]
    fn extract_classes_from_source_finds_classname() {
        let source = r#"<div className="flex items-center gap-4 p-6 bg-white rounded-xl" />"#;
        let classes = extract_classes_from_source(source.to_string());
        assert!(classes.contains(&"flex".to_string()));
        assert!(classes.contains(&"items-center".to_string()));
        assert!(classes.contains(&"bg-white".to_string()));
    }

    #[test]
    fn classes_to_css_merges_transforms() {
        let css = classes_to_css("opacity-0 translate-y-4 scale-95");
        assert!(css.contains("opacity: 0"));
        // Both transform values should be merged
        assert!(css.contains("transform:"));
        assert!(css.contains("translateY"));
        assert!(css.contains("scale"));
    }
}

// ═════════════════════════════════════════════════════════════════════════════
// SCANNER CACHE — Rust-backed persistent scan cache (replaces cache.ts)
// ═════════════════════════════════════════════════════════════════════════════

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CacheEntry {
    pub file: String,
    pub classes: Vec<String>,
    pub hash: String,
    pub mtime_ms: f64,
    pub size: u32,
    pub hit_count: u32,
}

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CacheReadResult {
    pub entries: Vec<CacheEntry>,
    pub version: u32,
}

