//! File watcher using `notify` v6 — replaces Node.js fs.watch.
//!
//! Exposes a Rust-managed watcher that sends change events to JavaScript
//! via an N-API threadsafe function callback.

use notify::{Config, Event, EventKind, RecommendedWatcher, PollWatcher, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use std::collections::HashMap;
use std::fs;
use md5;

// Global file hash cache to prevent duplicate events on unchanged file content
lazy_static::lazy_static! {
    static ref FILE_HASHES: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

fn calculate_file_hash(path: &str) -> Option<String> {
    if let Ok(content) = fs::read(path) {
        let digest = md5::compute(content);
        Some(format!("{:x}", digest))
    } else {
        None
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Watch event types (mirrors engine/src/watch.ts contract)
// ─────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
pub enum WatchEventKind {
    Add,
    Change,
    Remove,
    #[allow(dead_code)]
    Rename,
}

impl WatchEventKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Add => "add",
            Self::Change => "change",
            Self::Remove => "unlink",
            Self::Rename => "rename",
        }
    }
}

#[derive(Debug, Clone)]
pub struct WatchEvent {
    pub kind: WatchEventKind,
    pub path: String,
}

// ─────────────────────────────────────────────────────────────────────────────
// Watcher handle (keeps the watcher alive)
// ─────────────────────────────────────────────────────────────────────────────

pub enum WatcherImpl {
    Recommended(RecommendedWatcher),
    Poll(PollWatcher),
}

pub struct WatcherHandle {
    _watcher: WatcherImpl,
}

impl WatcherImpl {
    fn watch(&mut self, path: &Path, recursive: RecursiveMode) -> Result<(), notify::Error> {
        match self {
            Self::Recommended(w) => w.watch(path, recursive),
            Self::Poll(w) => w.watch(path, recursive),
        }
    }

    #[allow(dead_code)]
    fn unwatch(&mut self, path: &Path) -> Result<(), notify::Error> {
        match self {
            Self::Recommended(w) => w.unwatch(path),
            Self::Poll(w) => w.unwatch(path),
        }
    }
}

/// Start watching `root_dir` recursively.
/// `on_event` is called on the notify thread for every relevant FS change.
///
/// Returns a `WatcherHandle` — dropping it stops the watcher.
pub fn start_watch<F>(root_dir: &str, on_event: F) -> Result<WatcherHandle, notify::Error>
where
    F: Fn(WatchEvent) + Send + 'static,
{
    let on_event = Arc::new(Mutex::new(on_event));

    let handler = {
        let on_event = Arc::clone(&on_event);
        move |res: Result<Event, notify::Error>| {
            let Ok(event) = res else { return };

            let kind = match &event.kind {
                EventKind::Create(_) => WatchEventKind::Add,
                EventKind::Modify(_) => WatchEventKind::Change,
                EventKind::Remove(_) => WatchEventKind::Remove,
                _ => return, // skip Access, Other, etc.
            };

            for path_buf in &event.paths {
                // Only watch JS/TS source files and CSS
                let ext = path_buf.extension().and_then(|e| e.to_str()).unwrap_or("");
                if !matches!(ext, "ts" | "tsx" | "js" | "jsx" | "mjs" | "cjs" | "css") {
                    continue;
                }
                // Skip node_modules, .git, dist, .next
                let path_str = path_buf.to_string_lossy();
                if path_str.contains("node_modules")
                    || path_str.contains("/.git/")
                    || path_str.contains("/dist/")
                    || path_str.contains("/.next/")
                {
                    continue;
                }

                // File Hashing check to ignore changes with identical content
                if kind == WatchEventKind::Change {
                    if let Some(new_hash) = calculate_file_hash(&path_str) {
                        let mut hashes = FILE_HASHES.lock().unwrap();
                        if let Some(old_hash) = hashes.get(&*path_str) {
                            if old_hash == &new_hash {
                                // Content has not changed, skip event
                                continue;
                            }
                        }
                        hashes.insert(path_str.to_string(), new_hash);
                    }
                } else if kind == WatchEventKind::Remove {
                    let mut hashes = FILE_HASHES.lock().unwrap();
                    hashes.remove(&*path_str);
                } else if kind == WatchEventKind::Add {
                    if let Some(new_hash) = calculate_file_hash(&path_str) {
                        let mut hashes = FILE_HASHES.lock().unwrap();
                        hashes.insert(path_str.to_string(), new_hash);
                    }
                }

                let ev = WatchEvent {
                    kind: kind.clone(),
                    path: path_str.to_string(),
                };

                if let Ok(cb) = on_event.lock() {
                    cb(ev);
                }
            }
        }
    };

    // Attempt to use RecommendedWatcher first (instant event-driven notifications)
    let watcher = match RecommendedWatcher::new(handler.clone(), Config::default()) {
        Ok(w) => WatcherImpl::Recommended(w),
        Err(_) => {
            // Fallback to PollWatcher with an optimized 50ms poll interval
            let poll_config = Config::default().with_poll_interval(Duration::from_millis(50));
            let w = PollWatcher::new(handler, poll_config)?;
            WatcherImpl::Poll(w)
        }
    };

    let mut handle = WatcherHandle { _watcher: watcher };
    handle._watcher.watch(Path::new(root_dir), RecursiveMode::Recursive)?;

    Ok(handle)
}
