//! ID Registry — migrated from `shared/src/schemas.ts`
//!
//! Fungsi yang dimigrate:
//!   - `generateId(gen, name)`  → `id_registry_generate(handle, name)`
//!   - `createIdGenerator()`    → `id_registry_create()`
//!   - IdGenerator struct       → opaque handle via global DashMap
//!
//! Kenapa worth di-native:
//! - Dipanggil ribuan kali saat parsing CSS — setiap rule, property, selector,
//!   layer, variant dapat unique numeric ID.
//! - JS object field access `gen.nextId++` tidak bisa di-JIT-optimize karena
//!   object is mutable and potentially aliased. Rust atomic is truly lock-free.
//! - DashMap handle approach: JS tidak perlu carry around IdGenerator object —
//!   hanya numeric handle, Rust manages state internally.

use dashmap::DashMap;
use napi_derive::napi;
use once_cell::sync::Lazy;
use std::sync::atomic::{AtomicU32, Ordering};

// ─────────────────────────────────────────────────────────────────────────────
// Global registry of all active ID generators
// Key: handle (u32) → (counter, name→id map)
// ─────────────────────────────────────────────────────────────────────────────

struct IdGen {
    next_id: AtomicU32,
    ids: DashMap<String, u32>,
}

static GENERATORS: Lazy<DashMap<u32, IdGen>> = Lazy::new(DashMap::new);
static NEXT_HANDLE: AtomicU32 = AtomicU32::new(1);

// ─────────────────────────────────────────────────────────────────────────────
// NAPI exports
// ─────────────────────────────────────────────────────────────────────────────

/// Create a new ID generator. Returns an opaque handle (u32).
///
/// Replaces `createIdGenerator()` in `shared/src/schemas.ts`.
/// The handle must be passed to `id_registry_generate` and `id_registry_destroy`.
#[napi]
pub fn id_registry_create() -> u32 {
    let handle = NEXT_HANDLE.fetch_add(1, Ordering::Relaxed);
    GENERATORS.insert(
        handle,
        IdGen {
            next_id: AtomicU32::new(0),
            ids: DashMap::new(),
        },
    );
    handle
}

/// Generate the next ID for `name` in the given generator.
///
/// Replaces `generateId(gen, name)` in `shared/src/schemas.ts`.
/// Returns the assigned numeric ID. Subsequent calls with the same name
/// still increment the counter but overwrite the mapping — same semantics
/// as the JS implementation.
#[napi]
pub fn id_registry_generate(handle: u32, name: String) -> u32 {
    let gen = match GENERATORS.get(&handle) {
        Some(g) => g,
        None => return 0,
    };
    let id = gen.next_id.fetch_add(1, Ordering::Relaxed);
    gen.ids.insert(name, id);
    id
}

/// Look up the ID previously assigned to `name`.
/// Returns -1 if not found or handle is invalid.
#[napi]
pub fn id_registry_lookup(handle: u32, name: String) -> i32 {
    match GENERATORS.get(&handle) {
        Some(gen) => gen.ids.get(&name).map(|id| *id as i32).unwrap_or(-1),
        None => -1,
    }
}

/// Get the current counter value (next ID that would be assigned).
#[napi]
pub fn id_registry_next(handle: u32) -> u32 {
    match GENERATORS.get(&handle) {
        Some(gen) => gen.next_id.load(Ordering::Relaxed),
        None => 0,
    }
}

/// Destroy the generator and free its memory.
///
/// Call when the generator is no longer needed (e.g. after CSS parse completes).
#[napi]
pub fn id_registry_destroy(handle: u32) {
    GENERATORS.remove(&handle);
}

/// Reset the generator to initial state (nextId=0, ids={}).
/// Cheaper than destroy+create for repeated use.
#[napi]
pub fn id_registry_reset(handle: u32) {
    if let Some(gen) = GENERATORS.get(&handle) {
        gen.next_id.store(0, Ordering::Relaxed);
        gen.ids.clear();
    }
}

/// Export all name→id mappings as JSON.
/// Useful for serialization / debugging.
#[napi]
pub fn id_registry_snapshot(handle: u32) -> String {
    match GENERATORS.get(&handle) {
        Some(gen) => {
            let map: std::collections::HashMap<String, u32> = gen
                .ids
                .iter()
                .map(|e| (e.key().clone(), *e.value()))
                .collect();
            serde_json::to_string(&map).unwrap_or_else(|_| "{}".to_string())
        }
        None => "{}".to_string(),
    }
}

/// Number of active generator handles.
#[napi]
pub fn id_registry_active_count() -> u32 {
    GENERATORS.len() as u32
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_generate() {
        let h = id_registry_create();
        assert_eq!(id_registry_generate(h, "RuleId".into()), 0);
        assert_eq!(id_registry_generate(h, "SelectorId".into()), 1);
        assert_eq!(id_registry_generate(h, "PropertyId".into()), 2);
        assert_eq!(id_registry_next(h), 3);
        id_registry_destroy(h);
    }

    #[test]
    fn test_lookup() {
        let h = id_registry_create();
        id_registry_generate(h, "foo".into());
        id_registry_generate(h, "bar".into());
        assert_eq!(id_registry_lookup(h, "foo".into()), 0);
        assert_eq!(id_registry_lookup(h, "bar".into()), 1);
        assert_eq!(id_registry_lookup(h, "missing".into()), -1);
        id_registry_destroy(h);
    }

    #[test]
    fn test_reset() {
        let h = id_registry_create();
        id_registry_generate(h, "a".into());
        id_registry_generate(h, "b".into());
        assert_eq!(id_registry_next(h), 2);
        id_registry_reset(h);
        assert_eq!(id_registry_next(h), 0);
        assert_eq!(id_registry_lookup(h, "a".into()), -1);
        id_registry_destroy(h);
    }

    #[test]
    fn test_invalid_handle_returns_safe_defaults() {
        assert_eq!(id_registry_generate(99999, "x".into()), 0);
        assert_eq!(id_registry_lookup(99999, "x".into()), -1);
        assert_eq!(id_registry_next(99999), 0);
        assert_eq!(id_registry_snapshot(99999), "{}");
    }

    #[test]
    fn test_snapshot_json() {
        let h = id_registry_create();
        id_registry_generate(h, "alpha".into());
        id_registry_generate(h, "beta".into());
        let snap = id_registry_snapshot(h);
        let parsed: std::collections::HashMap<String, u32> = serde_json::from_str(&snap).unwrap();
        assert_eq!(parsed["alpha"], 0);
        assert_eq!(parsed["beta"], 1);
        id_registry_destroy(h);
    }

    #[test]
    fn test_multiple_independent_handles() {
        let h1 = id_registry_create();
        let h2 = id_registry_create();
        id_registry_generate(h1, "a".into());
        id_registry_generate(h1, "b".into());
        id_registry_generate(h2, "a".into());
        assert_eq!(id_registry_next(h1), 2);
        assert_eq!(id_registry_next(h2), 1);
        id_registry_destroy(h1);
        id_registry_destroy(h2);
    }
}
