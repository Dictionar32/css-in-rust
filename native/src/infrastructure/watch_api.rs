use napi_derive::napi;
use once_cell::sync::Lazy;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

use crate::watcher;

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
