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
