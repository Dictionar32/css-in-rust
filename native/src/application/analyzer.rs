use napi_derive::napi;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

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

// ─────────────────────────────────────────────────────────────────────────────
// buildDistribution — migrated from analyzeWorkspace.ts
// ─────────────────────────────────────────────────────────────────────────────

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct ClassDistribution {
    /// Classes that appear exactly once
    pub once: u32,
    /// Classes that appear 2–3 times
    pub few: u32,
    /// Classes that appear 4–7 times
    pub moderate: u32,
    /// Classes that appear 8+ times
    pub frequent: u32,
}

/// Compute usage frequency distribution for a list of class usages.
///
/// Replaces `buildDistribution(usages: ClassUsage[])` in `analyzeWorkspace.ts`.
///
/// Input JSON: `[{ "name": "bg-red-500", "count": 3 }, ...]`
/// Output: `{ once, few, moderate, frequent }` — bucket counts.
///
/// Bucket semantics (same as JS original):
///   once     = count === 1
///   few      = count 2–3
///   moderate = count 4–7
///   frequent = count 8+
#[napi]
pub fn build_distribution(usages_json: String) -> ClassDistribution {
    #[derive(serde::Deserialize)]
    struct Usage {
        count: u32,
    }

    let usages: Vec<Usage> = match serde_json::from_str(&usages_json) {
        Ok(u) => u,
        Err(_) => {
            return ClassDistribution {
                once: 0,
                few: 0,
                moderate: 0,
                frequent: 0,
            }
        }
    };

    let mut once = 0u32;
    let mut few = 0u32;
    let mut moderate = 0u32;
    let mut frequent = 0u32;

    for usage in &usages {
        match usage.count {
            1 => once += 1,
            2..=3 => few += 1,
            4..=7 => moderate += 1,
            _ => frequent += 1,
        }
    }

    ClassDistribution { once, few, moderate, frequent }
}

/// Aggregate class counts from a list of (file, classes[]) scan entries.
///
/// Replaces `collectClassCounts(scan: ScanWorkspaceResult)` in `analyzeWorkspace.ts`.
///
/// Input JSON: `[{ "file": "...", "classes": ["cls1", "cls2"] }, ...]`
/// Output JSON: `[{ "name": "cls1", "count": 3 }, ...]` sorted by count desc, name asc.
#[napi]
pub fn collect_class_counts(files_json: String) -> Vec<ClassCount> {
    let files: Vec<serde_json_classes::FileEntry> =
        serde_json_classes::parse_files_json(&files_json).unwrap_or_default();

    let mut counts: std::collections::HashMap<String, u32> = std::collections::HashMap::new();

    for file in &files {
        for cls in &file.classes {
            *counts.entry(cls.clone()).or_insert(0) += 1;
        }
    }

    let mut sorted: Vec<ClassCount> = counts
        .into_iter()
        .map(|(name, count)| ClassCount { name, count })
        .collect();

    sorted.sort_by(|a, b| b.count.cmp(&a.count).then(a.name.cmp(&b.name)));
    sorted
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests — buildDistribution / collectClassCounts
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod distribution_tests {
    use super::*;

    #[test]
    fn test_build_distribution_buckets() {
        let json = r#"[
            {"name":"a","count":1},
            {"name":"b","count":2},
            {"name":"c","count":3},
            {"name":"d","count":5},
            {"name":"e","count":7},
            {"name":"f","count":8},
            {"name":"g","count":100}
        ]"#;
        let dist = build_distribution(json.to_string());
        assert_eq!(dist.once, 1);
        assert_eq!(dist.few, 2);
        assert_eq!(dist.moderate, 2);
        assert_eq!(dist.frequent, 2);
    }

    #[test]
    fn test_build_distribution_empty() {
        let dist = build_distribution("[]".to_string());
        assert_eq!(dist.once, 0);
        assert_eq!(dist.few, 0);
        assert_eq!(dist.moderate, 0);
        assert_eq!(dist.frequent, 0);
    }

    #[test]
    fn test_collect_class_counts_aggregates_across_files() {
        let json = r#"[
            {"file":"a.tsx","classes":["flex","p-4","text-white"]},
            {"file":"b.tsx","classes":["flex","p-4"]},
            {"file":"c.tsx","classes":["flex"]}
        ]"#;
        let counts = collect_class_counts(json.to_string());
        let flex = counts.iter().find(|c| c.name == "flex").unwrap();
        let p4 = counts.iter().find(|c| c.name == "p-4").unwrap();
        let tw = counts.iter().find(|c| c.name == "text-white").unwrap();
        assert_eq!(flex.count, 3);
        assert_eq!(p4.count, 2);
        assert_eq!(tw.count, 1);
        // Sorted: flex first (count 3)
        assert_eq!(counts[0].name, "flex");
    }

    #[test]
    fn test_collect_class_counts_empty() {
        let counts = collect_class_counts("[]".to_string());
        assert!(counts.is_empty());
    }
}