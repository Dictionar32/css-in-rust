use dashmap::DashMap;
use napi_derive::napi;
use once_cell::sync::Lazy;
use regex::Regex;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

use crate::shared::utils::short_hash;

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
