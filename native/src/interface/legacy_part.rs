#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ConflictDetectionResult {
    pub conflicts: Vec<ClassConflict>,
    pub conflicted_class_names: Vec<String>,
}

/// Split variant prefix dari base class.
/// "dark:hover:bg-blue-500" → { variantKey: "dark:hover", base: "bg-blue-500" }
fn split_variant_and_base(class_name: &str) -> (String, String) {
    let parts: Vec<&str> = class_name.split(':').collect();
    if parts.len() <= 1 {
        return (String::new(), class_name.to_string());
    }
    let base = parts.last().unwrap_or(&class_name).to_string();
    let variant_key = parts[..parts.len() - 1].join(":");
    (variant_key, base)
}

/// Resolve conflict group dari base class.
/// Menggantikan resolveConflictGroup() di semantic.ts.
fn resolve_conflict_group(base: &str) -> Option<&'static str> {
    // Arbitrary values tidak di-track conflict-nya
    if base.contains('[') && base.contains(']') {
        return None;
    }
    // Display utilities
    if ["block","inline","inline-block","inline-flex","flex","grid","hidden"].contains(&base) {
        return Some("display");
    }
    if base.starts_with("bg-")       { return Some("bg"); }
    if base.starts_with("text-")     { return Some("text"); }
    if base.starts_with("font-")     { return Some("font"); }
    if base.starts_with("rounded")   { return Some("rounded"); }
    if base.starts_with("shadow")    { return Some("shadow"); }
    if base.starts_with("border-")   { return Some("border"); }
    if base.starts_with("opacity-")  { return Some("opacity"); }
    if base.starts_with("w-") || base.starts_with("min-w-") || base.starts_with("max-w-") {
        return Some("width");
    }
    if base.starts_with("h-") || base.starts_with("min-h-") || base.starts_with("max-h-") {
        return Some("height");
    }
    if base.starts_with("p-") || base.starts_with("px-") || base.starts_with("py-") {
        return Some("padding");
    }
    if base.starts_with("m-") || base.starts_with("mx-") || base.starts_with("my-") {
        return Some("margin");
    }
    if base.starts_with("z-")        { return Some("z-index"); }
    if base.starts_with("gap-")      { return Some("gap"); }
    if base.starts_with("col-")      { return Some("grid-column"); }
    if base.starts_with("row-")      { return Some("grid-row"); }
    if base.starts_with("leading-")  { return Some("line-height"); }
    if base.starts_with("tracking-") { return Some("letter-spacing"); }
    if base.starts_with("ring-")     { return Some("ring"); }
    if base.starts_with("outline-")  { return Some("outline"); }
    if base.starts_with("cursor-")   { return Some("cursor"); }
    if base.starts_with("overflow-") { return Some("overflow"); }
    None
}

/// Deteksi konflik antara Tailwind classes yang di-pakai bersamaan.
///
/// Menggantikan `detectConflicts()` di semantic.ts.
/// Contoh: `["bg-red-500", "bg-blue-500"]` → conflict group "bg".
///
/// Input JSON: `[{ "name": "bg-red-500", "count": 3 }, ...]`
#[napi]
pub fn detect_class_conflicts(usages_json: String) -> ConflictDetectionResult {
    #[derive(Deserialize)]
    struct ClassUsage {
        name: String,
    }

    let usages: Vec<ClassUsage> = match serde_json::from_str(&usages_json) {
        Ok(u) => u,
        Err(_) => return ConflictDetectionResult { conflicts: vec![], conflicted_class_names: vec![] },
    };

    // bucket key → { variantKey, group, classes }
    let mut buckets: HashMap<String, (String, &'static str, HashSet<String>)> = HashMap::new();

    for usage in &usages {
        let (variant_key, base) = split_variant_and_base(&usage.name);
        let group = match resolve_conflict_group(&base) {
            Some(g) => g,
            None => continue,
        };

        let key = format!("{}::{}", variant_key, group);
        let entry = buckets.entry(key).or_insert_with(|| {
            (variant_key.clone(), group, HashSet::new())
        });
        entry.2.insert(usage.name.clone());
    }

    let mut conflicts: Vec<ClassConflict> = Vec::new();
    let mut conflicted: HashSet<String> = HashSet::new();

    for (variant_key, group, classes) in buckets.values() {
        if classes.len() <= 1 {
            continue;
        }
        let mut sorted_classes: Vec<String> = classes.iter().cloned().collect();
        sorted_classes.sort();

        for cls in &sorted_classes {
            conflicted.insert(cls.clone());
        }

        let variant_label = if variant_key.is_empty() { "base" } else { variant_key.as_str() };
        conflicts.push(ClassConflict {
            group: group.to_string(),
            variant_key: variant_key.clone(),
            classes: sorted_classes,
            message: format!(
                "Multiple {} utilities detected for \"{}\".",
                group, variant_label
            ),
        });
    }

    // Sort by conflict count desc, then group name asc
    conflicts.sort_by(|a, b| {
        b.classes.len().cmp(&a.classes.len())
            .then(a.group.cmp(&b.group))
    });

    let mut conflicted_names: Vec<String> = conflicted.into_iter().collect();
    conflicted_names.sort();

    ConflictDetectionResult {
        conflicts,
        conflicted_class_names: conflicted_names,
    }
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct KnownClassResult {
    pub class_name: String,
    pub is_known: bool,
    pub variant_key: String,
    pub base_class: String,
    pub utility_prefix: String,
    pub is_arbitrary: bool,
}

/// Classify classes sebagai known/unknown Tailwind utilities.
///
/// Menggantikan `isKnownTailwindClass()` + `utilityPrefix()` di semantic.ts.
/// Batch mode: process banyak classes sekaligus via HashSet lookups.
#[napi]
pub fn classify_known_classes(
    classes: Vec<String>,
    safelist: Vec<String>,
    custom_utilities: Vec<String>,
) -> Vec<KnownClassResult> {
    let safelist_set: HashSet<&str> = safelist.iter().map(|s| s.as_str()).collect();
    let custom_set: HashSet<&str> = custom_utilities.iter().map(|s| s.as_str()).collect();

    let known_prefixes: HashSet<&str> = [
        "absolute","align","animate","arbitrary","aspect","backdrop","basis",
        "bg","block","border","bottom","col","container","contents","cursor",
        "dark","display","divide","fill","fixed","flex","float","font","from",
        "gap","grid","grow","h","hidden","inset","inline","isolate","items",
        "justify","left","leading","line","list","m","max-h","max-w","mb",
        "min-h","min-w","ml","mr","mt","mx","my","object","opacity","order",
        "origin","outline","overflow","overscroll","p","pb","pe","perspective",
        "place","pl","pointer","position","pr","ps","pt","px","py","relative",
        "right","ring","rotate","rounded","row","scale","self","shadow",
        "shrink","size","skew","space","sr","start","static","sticky","stroke",
        "table","text","to","top","tracking","transform","transition","translate",
        "truncate","underline","uppercase","via","visible","w","whitespace","z",
    ].iter().cloned().collect();

    classes.into_iter().map(|cls| {
        let (variant_key, base) = split_variant_and_base(&cls);
        let is_arbitrary = base.contains('[') && base.contains(']');

        let utility_prefix = if is_arbitrary {
            "arbitrary".to_string()
        } else {
            let normalized = if base.starts_with('-') { &base[1..] } else { &base };
            // Find prefix: everything before first '-' that has value after it
            let prefix_end = normalized.find('-').map_or(normalized.len(), |i| i);
            normalized[..prefix_end].to_string()
        };

        let is_known = safelist_set.contains(cls.as_str())
            || custom_set.contains(cls.as_str())
            || custom_set.contains(base.as_str())
            || (is_arbitrary)
            || known_prefixes.contains(utility_prefix.as_str());

        KnownClassResult {
            class_name: cls,
            is_known,
            variant_key,
            base_class: base,
            utility_prefix,
            is_arbitrary,
        }
    }).collect()
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CssRuleLookup {
    pub class_name: String,
    pub property: String,
    pub value: String,
    pub is_important: bool,
    pub variants: Vec<String>,
    pub specificity: u32,
}

/// Parse CSS string dan buat reverse lookup index.
///
/// Menggantikan `parseCSS()` + `findByProperty()` di reverseLookup.ts.
/// Dipakai oleh `tw trace` CLI dan devtools untuk debug class → property mapping.
///
/// Input: raw CSS string dari Tailwind output.
/// Output: list of { className, property, value, ... } yang bisa difilter.
#[napi]
pub fn parse_css_rules(css: String) -> Vec<CssRuleLookup> {
    let mut rules: Vec<CssRuleLookup> = Vec::new();

    // Match: .class-name { property: value; ... }
    // Handle escaped characters in class names (e.g., .hover\:bg-blue)
    let selector_block_re = Regex::new(
        r"\.([a-zA-Z_][-a-zA-Z0-9_:\\./\[\]]+)\s*\{([^}]*)\}"
    ).unwrap();

    for cap in selector_block_re.captures_iter(&css) {
        let raw_class = match cap.get(1) {
            Some(m) => m.as_str(),
            None => continue,
        };
        let block_body = match cap.get(2) {
            Some(m) => m.as_str(),
            None => continue,
        };

        // Unescape CSS class name (e.g., "hover\:bg-blue" → "hover:bg-blue")
        let class_name = raw_class.replace("\\:", ":").replace("\\.", ".").replace("\\/", "/");

        // Extract variants from class name
        let (variant_key, _base) = split_variant_and_base(&class_name);
        let variants: Vec<String> = if variant_key.is_empty() {
            vec![]
        } else {
            variant_key.split(':').map(|s| s.to_string()).collect()
        };

        // Calculate specificity: 1 class = 10, each pseudo/variant adds
        let specificity = 10 + (variants.len() as u32 * 10);

        // Parse declarations
        for dec_match in RE_CSS_PROPERTY.captures_iter(block_body) {
            let property = match dec_match.get(1) {
                Some(m) => m.as_str().trim().to_string(),
                None => continue,
            };
            let value = match dec_match.get(2) {
                Some(m) => m.as_str().trim().to_string(),
                None => continue,
            };
            let is_important = dec_match.get(3).is_some();

            if property.is_empty() || value.is_empty() {
                continue;
            }

            rules.push(CssRuleLookup {
                class_name: class_name.clone(),
                property,
                value,
                is_important,
                variants: variants.clone(),
                specificity,
            });
        }
    }

    rules
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct VariantSplitResult {
    pub variant_key: String,
    pub base: String,
    pub variants: Vec<String>,
    pub is_arbitrary: bool,
    pub has_modifier: bool,
    pub modifier: Option<String>,
}

/// Split class menjadi komponen-komponen: variant, base, modifier.
///
/// Menggantikan splitVariantAndBase() di semantic.ts dan utilityPrefix() logic.
/// Batch mode untuk dipakai oleh CLI dan analyzer.
///
/// Contoh: "dark:hover:bg-blue-500/50"
///   → { variantKey: "dark:hover", base: "bg-blue-500", modifier: "50", ... }
#[napi]
pub fn batch_split_classes(classes: Vec<String>) -> Vec<VariantSplitResult> {
    classes.into_iter().map(|cls| {
        let (variant_key, base_with_modifier) = split_variant_and_base(&cls);
        let variants: Vec<String> = if variant_key.is_empty() {
            vec![]
        } else {
            variant_key.split(':').map(|s| s.to_string()).collect()
        };

        // Extract opacity modifier: "bg-blue-500/50" → base="bg-blue-500", mod="50"
        let (base, modifier) = if let Some(slash_idx) = base_with_modifier.rfind('/') {
            let b = base_with_modifier[..slash_idx].to_string();
            let m = base_with_modifier[slash_idx + 1..].to_string();
            (b, Some(m))
        } else {
            (base_with_modifier, None)
        };

        let is_arbitrary = base.contains('[') && base.contains(']');
        let has_modifier = modifier.is_some();

        VariantSplitResult {
            variant_key,
            base,
            variants,
            is_arbitrary,
            has_modifier,
            modifier,
        }
    }).collect()
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPANSION BATCH 4 — cssToIr, bundleAnalyzer full methods, impactTracker
// ─────────────────────────────────────────────────────────────────────────────

static RE_CSS_RULE_SELECTOR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"([^{}]+)\s*\{([^{}]*)\}").unwrap()
});
static RE_VARIANT_PREFIX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^(hover|focus|active|visited|checked|disabled|required|optional|first|last|odd|even|before|after|placeholder|file|selection|backdrop|group|peer)").unwrap()
});
static RE_CSS_CLASS_EXTRACT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\.([a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*)").unwrap()
});

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ParsedCssRule {
    pub class_name: String,
    pub property: String,
    pub value: String,
    pub important: bool,
    pub variants: Vec<String>,
    pub pseudo_classes: Vec<String>,
    pub media_query: Option<String>,
    pub specificity: u32,
    pub layer: Option<String>,
}

/// Parse CSS ke flat rule list — menggantikan parseRules() + parseSelector() di cssToIr.ts.
///
/// Lebih cepat dari JS karena:
/// - Regex Rust tidak perlu JIT warmup per-call
/// - Tidak ada prototype chain lookup overhead
/// - Zero allocation untuk borrowed string slices
///
/// Dipakai oleh engine trace, tw why, dan devtools inspector.
#[napi]
pub fn parse_css_to_rules(css: String, prefix: Option<String>) -> Vec<ParsedCssRule> {
    let prefix = prefix.as_deref().unwrap_or("");
    let mut rules: Vec<ParsedCssRule> = Vec::new();

    for cap in RE_CSS_RULE_SELECTOR.captures_iter(&css) {
        let selector_text = match cap.get(1) { Some(m) => m.as_str().trim(), None => continue };
        let decl_block   = match cap.get(2) { Some(m) => m.as_str().trim(), None => continue };

        // Skip at-rules (@media, @keyframes, etc.)
        if selector_text.starts_with('@') { continue; }

        // Parse selector
        let (class_name, variants, pseudo_classes, media_query, specificity) =
            parse_selector_str(selector_text, prefix);

        // Parse declarations
        for decl_cap in RE_CSS_PROPERTY.captures_iter(decl_block) {
            let property = match decl_cap.get(1) { Some(m) => m.as_str().trim().to_string(), None => continue };
            let value    = match decl_cap.get(2) { Some(m) => m.as_str().trim().to_string(), None => continue };
            let important = decl_cap.get(3).is_some();

            if property.is_empty() || value.is_empty() { continue; }

            // Detect layer
            let layer = if class_name.starts_with("tw-") || class_name.starts_with("tailwind-") {
                Some("tailwind".to_string())
            } else {
                None
            };

            rules.push(ParsedCssRule {
                class_name: class_name.clone(),
                property,
                value,
                important,
                variants: variants.clone(),
                pseudo_classes: pseudo_classes.clone(),
                media_query: media_query.clone(),
                specificity,
                layer,
            });
        }
    }

    rules
}

fn parse_selector_str(
    selector: &str,
    prefix: &str,
) -> (String, Vec<String>, Vec<String>, Option<String>, u32) {
    // Check for @media wrapping
    let (media_query, base_selector) = if selector.starts_with("@media") {
        (Some(selector.to_string()), selector)
    } else {
        (None, selector)
    };

    // Strip leading dot
    let base_no_dot = base_selector.trim_start_matches('.');

    // Replace escaped colons temporarily
    let unescaped = base_no_dot.replace("\\:", "\x00");
    let parts: Vec<&str> = unescaped.split(':').collect();

    let raw_class = parts.first().map_or("", |p| p).replace('\x00', ":");
    let class_name = format!("{}{}", prefix, raw_class);

    let mut variants: Vec<String> = Vec::new();
    let mut pseudo_classes: Vec<String> = Vec::new();

    for part in parts.iter().skip(1) {
        let p = part.replace('\x00', ":");
        if RE_VARIANT_PREFIX.is_match(&p) {
            variants.push(p);
        } else if p.starts_with(':') {
            pseudo_classes.push(p.clone());
        } else {
            variants.push(p);
        }
    }

    // Specificity: class = 10, variants add 10 each, media adds 1000
    let specificity = 10 + (variants.len() as u32 * 10) + if media_query.is_some() { 1000 } else { 0 };

    (class_name, variants, pseudo_classes, media_query, specificity)
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct BundleContribution {
    pub class_name: String,
    pub size_bytes: u32,
    pub variant_chains: Vec<String>,
    pub dependencies: Vec<String>,
    pub in_css: bool,
}

/// Hitung bundle contribution untuk satu atau banyak classes dari CSS.
///
/// Menggantikan calculateBundleContribution() + extractVariantChains() +
/// extractDependencies() di bundleAnalyzer.ts.
///
/// Batch mode: process semua classes sekaligus dengan satu CSS scan.
/// Lebih efisien dari JS yang scan CSS satu kali per class.
#[napi]
pub fn calculate_bundle_contributions(
    classes: Vec<String>,
    css: String,
) -> Vec<BundleContribution> {
    // Extract semua classes yang ada di CSS
    let css_classes: HashSet<String> = RE_CSS_CLASS_EXTRACT
        .captures_iter(&css)
        .filter_map(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .collect();

    // Pre-build line index untuk efisiensi
    let css_lines: Vec<&str> = css.lines().collect();

    classes.into_iter().map(|cls| {
        let normalized = cls.trim_start_matches('.').to_string();
        let in_css = css_classes.contains(&normalized);

        if !in_css {
            return BundleContribution {
                class_name: normalized,
                size_bytes: 0,
                variant_chains: vec![],
                dependencies: vec![],
                in_css: false,
            };
        }

        // Calculate size: sum length of lines containing this class selector
        let class_selector = format!(".{}", normalized);
        let escaped = regex::escape(&normalized);
        let variant_pattern = format!(r"([\w-]+:{}|{})", escaped, escaped);
        let variant_re = Regex::new(&variant_pattern).unwrap_or_else(|_| Regex::new(r"$^").unwrap());

        let mut size_bytes: u32 = 0;
        let mut variant_chains: HashSet<String> = HashSet::new();

        for line in &css_lines {
            if line.contains(&class_selector) {
                let decl_start = line.find('{').map_or(0, |i| i);
                size_bytes += (line.len() - decl_start + 1) as u32;

                // Extract variant chains from this line
                for m in variant_re.find_iter(line) {
                    let matched = m.as_str();
                    if matched.contains(':') {
                        variant_chains.insert(matched.to_string());
                    }
                }
            }
        }

        // Extract dependencies from class name itself (variant prefixes)
        let parts: Vec<&str> = normalized.split(':').collect();
        let dependencies: Vec<String> = (0..parts.len().saturating_sub(1))
            .map(|i| parts[..=i].join(":"))
            .collect();

        let mut sorted_chains: Vec<String> = variant_chains.into_iter().collect();
        sorted_chains.sort();

        BundleContribution {
            class_name: normalized,
            size_bytes,
            variant_chains: sorted_chains,
            dependencies,
            in_css: true,
        }
    }).collect()
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct DeadCodeResult {
    pub dead_in_css: Vec<String>,   // ada di CSS tapi tidak dipakai di source
    pub dead_in_source: Vec<String>, // ada di source tapi tidak ada di CSS
    pub live_classes: Vec<String>,   // ada di keduanya
    pub total_css_classes: u32,
    pub total_source_classes: u32,
}

/// Deteksi dead code antara CSS output dan source scan result.
///
/// Menggantikan detectDeadCode() + checkIsDeadCode() di bundleAnalyzer.ts.
/// Single O(n+m) pass via HashSet — jauh lebih efisien dari
/// JS yang scan CSS per-class: O(n*m).
#[napi]
pub fn detect_dead_code(
    scan_result_json: String,
    css: String,
) -> DeadCodeResult {
    #[derive(Deserialize)]
    struct ScanResult {
        #[serde(rename = "uniqueClasses")]
        unique_classes: Vec<String>,
    }

    let scan: ScanResult = match serde_json::from_str(&scan_result_json) {
        Ok(s) => s,
        Err(_) => return DeadCodeResult {
            dead_in_css: vec![], dead_in_source: vec![], live_classes: vec![],
            total_css_classes: 0, total_source_classes: 0,
        },
    };

    let source_classes: HashSet<String> = scan.unique_classes.into_iter().collect();
    let total_source = source_classes.len() as u32;

    let css_classes: HashSet<String> = RE_CSS_CLASS_EXTRACT
        .captures_iter(&css)
        .filter_map(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .collect();
    let total_css = css_classes.len() as u32;

    let mut dead_in_css: Vec<String> = css_classes.iter()
        .filter(|c| !source_classes.contains(*c))
        .cloned().collect();

    let mut dead_in_source: Vec<String> = source_classes.iter()
        .filter(|c| !css_classes.contains(*c))
        .cloned().collect();

    let mut live: Vec<String> = css_classes.iter()
        .filter(|c| source_classes.contains(*c))
        .cloned().collect();

    dead_in_css.sort();
    dead_in_source.sort();
    live.sort();

    DeadCodeResult {
        dead_in_css,
        dead_in_source,
        live_classes: live,
        total_css_classes: total_css,
        total_source_classes: total_source,
    }
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ImpactScore {
    pub class_name: String,
    /// 0.0–1.0: seberapa banyak class ini dipakai
    pub usage_score: f64,
    /// 0.0–1.0: seberapa besar kontribusi CSS size
    pub size_score: f64,
    /// Skor gabungan (weighted)
    pub impact_score: f64,
    pub usage_count: u32,
    pub size_bytes: u32,
}

/// Hitung impact score per class — usage × size weighted.
///
/// Menggantikan logic yang tersebar di impactTracker.ts + bundleAnalyzer.ts.
/// Dipakai oleh `tw analyze` untuk ranking class berdasarkan dampak ke bundle.
///
/// Formula: impact = (usage_weight * usage_score) + (size_weight * size_score)
#[napi]
pub fn calculate_impact_scores(
    classes: Vec<String>,
    scan_result_json: String,
    css: String,
    usage_weight: Option<f64>,
    size_weight: Option<f64>,
) -> Vec<ImpactScore> {
    #[derive(Deserialize)]
    struct ScanFile { classes: Vec<String> }
    #[derive(Deserialize)]
    struct ScanResult { files: Vec<ScanFile> }

    let uw = usage_weight.unwrap_or(0.6);
    let sw = size_weight.unwrap_or(0.4);

    let scan: ScanResult = match serde_json::from_str(&scan_result_json) {
        Ok(s) => s,
        Err(_) => return vec![],
    };

    // Count usage per class
    let mut usage_counts: HashMap<String, u32> = HashMap::new();
    for file in &scan.files {
        for cls in &file.classes {
            *usage_counts.entry(cls.clone()).or_insert(0) += 1;
        }
    }

    let max_usage = usage_counts.values().copied().max().unwrap_or(1) as f64;

    // Pre-calculate bundle sizes
    let css_lines: Vec<&str> = css.lines().collect();
    let contributions = calculate_bundle_contributions(
        classes.iter().map(|c| c.trim_start_matches('.').to_string()).collect(),
        css.clone(),
    );
    let size_map: HashMap<String, u32> = contributions.iter()
        .map(|c| (c.class_name.clone(), c.size_bytes))
        .collect();
    let max_size = size_map.values().copied().max().unwrap_or(1) as f64;
    let _ = css_lines; // suppress unused warning

    classes.into_iter().map(|cls| {
        let normalized = cls.trim_start_matches('.').to_string();
        let usage = usage_counts.get(&normalized).copied().unwrap_or(0);
        let size = size_map.get(&normalized).copied().unwrap_or(0);

        let usage_score = if max_usage > 0.0 { usage as f64 / max_usage } else { 0.0 };
        let size_score  = if max_size  > 0.0 { size  as f64 / max_size  } else { 0.0 };
        let impact_score = (uw * usage_score + sw * size_score).clamp(0.0, 1.0);

        ImpactScore {
            class_name: normalized,
            usage_score,
            size_score,
            impact_score,
            usage_count: usage,
            size_bytes: size,
        }
    }).collect()
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct RouteClassMap {
    /// Route path (e.g. "/dashboard", "/api/users")
    pub route: String,
    /// Unique classes dipakai di route ini
    pub classes: Vec<String>,
    /// Classes yang hanya dipakai di route ini (exclusive)
    pub exclusive_classes: Vec<String>,
    pub class_count: u32,
}

/// Analisis distribusi classes per route — untuk CSS code splitting.
///
/// Menggantikan routeCssCollector.ts logic.
/// Dipakai oleh `tw split` untuk generate per-route CSS bundles.
///
/// Input JSON: Record<route, string[]> — map route ke daftar file
/// files_json: JSON scan result dengan file-to-class mapping
#[napi]
pub fn analyze_route_class_distribution(
    route_files_json: String,
    scan_result_json: String,
) -> Vec<RouteClassMap> {
    #[derive(Deserialize)]
    struct ScanFile { file: String, classes: Vec<String> }
    #[derive(Deserialize)]
    struct ScanResult { files: Vec<ScanFile> }

    let routes: HashMap<String, Vec<String>> = match serde_json::from_str(&route_files_json) {
        Ok(r) => r,
        Err(_) => return vec![],
    };
    let scan: ScanResult = match serde_json::from_str(&scan_result_json) {
        Ok(s) => s,
        Err(_) => return vec![],
    };

    // Build file → classes index
    let file_class_map: HashMap<&str, &Vec<String>> = scan.files.iter()
        .map(|f| (f.file.as_str(), &f.classes))
        .collect();

    // Build route → classes
    let route_class_sets: HashMap<&str, HashSet<String>> = routes.iter().map(|(route, files)| {
        let classes: HashSet<String> = files.iter()
            .filter_map(|f| file_class_map.get(f.as_str()))
            .flat_map(|cls| cls.iter().cloned())
            .collect();
        (route.as_str(), classes)
    }).collect();

    // Find exclusive classes per route (not in any other route)
    route_class_sets.iter().map(|(route, classes)| {
        let exclusive: Vec<String> = classes.iter()
            .filter(|cls| {
                route_class_sets.iter()
                    .filter(|(r, _)| *r != route)
                    .all(|(_, other_classes)| !other_classes.contains(*cls))
            })
            .cloned()
            .collect::<std::collections::BTreeSet<_>>()
            .into_iter()
            .collect();

        let mut sorted_classes: Vec<String> = classes.iter().cloned().collect();
        sorted_classes.sort();
        let count = sorted_classes.len() as u32;

        RouteClassMap {
            route: route.to_string(),
            classes: sorted_classes,
            exclusive_classes: exclusive,
            class_count: count,
        }
    }).collect()
}

