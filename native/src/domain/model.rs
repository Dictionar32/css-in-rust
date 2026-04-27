use serde::{Deserialize, Serialize};

pub use crate::domain::transform::{ParsedClass, SubComponent};

/// Entity: representasi komponen hasil parsing/transformasi.
#[derive(Serialize, Deserialize)]
pub struct ComponentDefinition {
    pub name: String,
    pub tag: String,
    pub classes: Vec<ClassName>,
    pub sub_components: Vec<SubComponent>,
}

/// Value object: class atomik immutable.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ClassName(pub String);

/// Value object: rantai variant immutable (mis. md:hover).
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct VariantChain(pub Vec<String>);

/// Value object: deklarasi CSS immutable.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CssDeclaration {
    pub property: String,
    pub value: String,
}

/// Aggregate root untuk operasi transform komponen.
#[derive(Serialize, Deserialize)]
pub struct Component {
    pub definition: ComponentDefinition,
}

/// Aggregate root untuk hasil scanning workspace.
#[derive(Serialize, Deserialize)]
pub struct ScanResult {
    pub files: Vec<crate::application::scanner::ScannedFile>,
    pub unique_classes: Vec<ClassName>,
    pub total_files: u32,
}

/// Aggregate root untuk bundle CSS terkompilasi.
#[derive(Serialize, Deserialize)]
pub struct CssBundle {
    pub css: String,
    pub classes: Vec<ClassName>,
    pub size_bytes: u32,
}

// ─────────────────────────────────────────────────────────────────────────────
// Property / Value name registry — migrated from `engine/src/ir.ts`
// ─────────────────────────────────────────────────────────────────────────────

use dashmap::DashMap;
use napi_derive::napi;
use once_cell::sync::Lazy;

/// DashMap<id → name> untuk property names.
/// Thread-safe karena DashMap pakai shard-based locking.
static PROPERTY_NAMES: Lazy<DashMap<u32, String>> = Lazy::new(DashMap::new);

/// DashMap<id → name> untuk value names.
static VALUE_NAMES: Lazy<DashMap<u32, String>> = Lazy::new(DashMap::new);

/// Daftarkan nama untuk sebuah PropertyId.
///
/// **Menggantikan** `registerPropertyName(id, name)` di `engine/src/ir.ts`.
///
/// Menggunakan DashMap sehingga bisa dipanggil dari banyak thread tanpa Mutex.
#[napi]
pub fn register_property_name(id: u32, name: String) {
    PROPERTY_NAMES.insert(id, name);
}

/// Daftarkan nama untuk sebuah ValueId.
///
/// **Menggantikan** `registerValueName(id, name)` di `engine/src/ir.ts`.
#[napi]
pub fn register_value_name(id: u32, name: String) {
    VALUE_NAMES.insert(id, name);
}

/// Resolve PropertyId ke nama yang sudah terdaftar.
///
/// **Menggantikan** `propertyIdToString(id)` di `engine/src/ir.ts`.
/// Returns `"P{id}"` jika tidak ditemukan — identik dengan JS fallback.
#[napi]
pub fn property_id_to_string(id: u32) -> String {
    PROPERTY_NAMES
        .get(&id)
        .map(|v| v.clone())
        .unwrap_or_else(|| format!("P{}", id))
}

/// Resolve ValueId ke nama yang sudah terdaftar.
///
/// **Menggantikan** `valueIdToString(id)` di `engine/src/ir.ts`.
/// Returns `"V{id}"` jika tidak ditemukan — identik dengan JS fallback.
#[napi]
pub fn value_id_to_string(id: u32) -> String {
    VALUE_NAMES
        .get(&id)
        .map(|v| v.clone())
        .unwrap_or_else(|| format!("V{}", id))
}

/// Hapus semua entries dari kedua registry — useful untuk test isolation.
#[napi]
pub fn clear_name_registries() {
    PROPERTY_NAMES.clear();
    VALUE_NAMES.clear();
}
