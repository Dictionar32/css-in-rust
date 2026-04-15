use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

use crate::domain::semantic::RE_CSS_PROPERTY;

static RE_CSS_RULE_SELECTOR: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"([^{}]+)\s*\{([^{}]*)\}").unwrap());
static RE_VARIANT_PREFIX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"^(hover|focus|active|visited|checked|disabled|required|optional|first|last|odd|even|before|after|placeholder|file|selection|backdrop|group|peer)").unwrap()
});
static RE_CSS_CLASS_EXTRACT: Lazy<Regex> =
    Lazy::new(|| Regex::new(r"\.([a-zA-Z0-9_-]+(?::[a-zA-Z0-9_-]+)*)").unwrap());

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
        let selector_text = match cap.get(1) {
            Some(m) => m.as_str().trim(),
            None => continue,
        };
        let decl_block = match cap.get(2) {
            Some(m) => m.as_str().trim(),
            None => continue,
        };

        // Skip at-rules (@media, @keyframes, etc.)
        if selector_text.starts_with('@') {
            continue;
        }

        // Parse selector
        let (class_name, variants, pseudo_classes, media_query, specificity) =
            parse_selector_str(selector_text, prefix);

        // Parse declarations
        for decl_cap in RE_CSS_PROPERTY.captures_iter(decl_block) {
            let property = match decl_cap.get(1) {
                Some(m) => m.as_str().trim().to_string(),
                None => continue,
            };
            let value = match decl_cap.get(2) {
                Some(m) => m.as_str().trim().to_string(),
                None => continue,
            };
            let important = decl_cap.get(3).is_some();

            if property.is_empty() || value.is_empty() {
                continue;
            }

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
    let specificity =
        10 + (variants.len() as u32 * 10) + if media_query.is_some() { 1000 } else { 0 };

    (
        class_name,
        variants,
        pseudo_classes,
        media_query,
        specificity,
    )
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

    classes
        .into_iter()
        .map(|cls| {
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
            let variant_re =
                Regex::new(&variant_pattern).unwrap_or_else(|_| Regex::new(r"$^").unwrap());

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
        })
        .collect()
}

// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct DeadCodeResult {
    pub dead_in_css: Vec<String>, // ada di CSS tapi tidak dipakai di source
    pub dead_in_source: Vec<String>, // ada di source tapi tidak ada di CSS
    pub live_classes: Vec<String>, // ada di keduanya
    pub total_css_classes: u32,
    pub total_source_classes: u32,
}

/// Deteksi dead code antara CSS output dan source scan result.
///
/// Menggantikan detectDeadCode() + checkIsDeadCode() di bundleAnalyzer.ts.
/// Single O(n+m) pass via HashSet — jauh lebih efisien dari
/// JS yang scan CSS per-class: O(n*m).
#[napi]
pub fn detect_dead_code(scan_result_json: String, css: String) -> DeadCodeResult {
    #[derive(Deserialize)]
    struct ScanResult {
        #[serde(rename = "uniqueClasses")]
        unique_classes: Vec<String>,
    }

    let scan: ScanResult = match serde_json::from_str(&scan_result_json) {
        Ok(s) => s,
        Err(_) => {
            return DeadCodeResult {
                dead_in_css: vec![],
                dead_in_source: vec![],
                live_classes: vec![],
                total_css_classes: 0,
                total_source_classes: 0,
            }
        }
    };

    let source_classes: HashSet<String> = scan.unique_classes.into_iter().collect();
    let total_source = source_classes.len() as u32;

    let css_classes: HashSet<String> = RE_CSS_CLASS_EXTRACT
        .captures_iter(&css)
        .filter_map(|c| c.get(1))
        .map(|m| m.as_str().to_string())
        .collect();
    let total_css = css_classes.len() as u32;

    let mut dead_in_css: Vec<String> = css_classes
        .iter()
        .filter(|c| !source_classes.contains(*c))
        .cloned()
        .collect();

    let mut dead_in_source: Vec<String> = source_classes
        .iter()
        .filter(|c| !css_classes.contains(*c))
        .cloned()
        .collect();

    let mut live: Vec<String> = css_classes
        .iter()
        .filter(|c| source_classes.contains(*c))
        .cloned()
        .collect();

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
    struct ScanFile {
        classes: Vec<String>,
    }
    #[derive(Deserialize)]
    struct ScanResult {
        files: Vec<ScanFile>,
    }

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
        classes
            .iter()
            .map(|c| c.trim_start_matches('.').to_string())
            .collect(),
        css.clone(),
    );
    let size_map: HashMap<String, u32> = contributions
        .iter()
        .map(|c| (c.class_name.clone(), c.size_bytes))
        .collect();
    let max_size = size_map.values().copied().max().unwrap_or(1) as f64;
    let _ = css_lines; // suppress unused warning

    classes
        .into_iter()
        .map(|cls| {
            let normalized = cls.trim_start_matches('.').to_string();
            let usage = usage_counts.get(&normalized).copied().unwrap_or(0);
            let size = size_map.get(&normalized).copied().unwrap_or(0);

            let usage_score = if max_usage > 0.0 {
                usage as f64 / max_usage
            } else {
                0.0
            };
            let size_score = if max_size > 0.0 {
                size as f64 / max_size
            } else {
                0.0
            };
            let impact_score = (uw * usage_score + sw * size_score).clamp(0.0, 1.0);

            ImpactScore {
                class_name: normalized,
                usage_score,
                size_score,
                impact_score,
                usage_count: usage,
                size_bytes: size,
            }
        })
        .collect()
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
    struct ScanFile {
        file: String,
        classes: Vec<String>,
    }
    #[derive(Deserialize)]
    struct ScanResult {
        files: Vec<ScanFile>,
    }

    let routes: HashMap<String, Vec<String>> = match serde_json::from_str(&route_files_json) {
        Ok(r) => r,
        Err(_) => return vec![],
    };
    let scan: ScanResult = match serde_json::from_str(&scan_result_json) {
        Ok(s) => s,
        Err(_) => return vec![],
    };

    // Build file → classes index
    let file_class_map: HashMap<&str, &Vec<String>> = scan
        .files
        .iter()
        .map(|f| (f.file.as_str(), &f.classes))
        .collect();

    // Build route → classes
    let route_class_sets: HashMap<&str, HashSet<String>> = routes
        .iter()
        .map(|(route, files)| {
            let classes: HashSet<String> = files
                .iter()
                .filter_map(|f| file_class_map.get(f.as_str()))
                .flat_map(|cls| cls.iter().cloned())
                .collect();
            (route.as_str(), classes)
        })
        .collect();

    // Find exclusive classes per route (not in any other route)
    route_class_sets
        .iter()
        .map(|(route, classes)| {
            let exclusive: Vec<String> = classes
                .iter()
                .filter(|cls| {
                    route_class_sets
                        .iter()
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
        })
        .collect()
}
