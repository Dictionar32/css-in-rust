//! Class utility functions — migrated from `core/src/cx.ts`
//!
//! Fungsi yang dimigrate:
//!   - `cn(...inputs)`  → `resolve_class_names(inputs)`
//!
//! Kenapa worth di-native:
//! - `cn()` dipanggil di setiap render loop untuk setiap komponen yang
//!   memakai conditional classes. Untuk SPA besar dengan ribuan render,
//!   overhead filter+join+trim di JS bertumpuk.
//! - Rust version: satu pass iterator tanpa intermediate allocation.
//!   JS: `inputs.filter(Boolean).join(" ").replace(/\s+/g, " ").trim()`
//!     = 3 allocations + RegExp per call.
//!   Rust: satu `split_whitespace` pass + satu `join` = 1 allocation.
//!
//! Note: `cx()` (twMerge wrapper) tetap di JS karena tergantung tailwind-merge.

use napi_derive::napi;
use crate::tws_debug;

/// Gabungkan class names — filter falsy, join dengan spasi, normalisasi whitespace.
///
/// **Menggantikan** `cn()` di `core/src/cx.ts`.
///
/// Equivalent JS:
/// ```js
/// inputs.filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
/// ```
///
/// # Examples
/// ```
/// resolve_class_names(vec!["p-4".into(), "".into(), "flex".into()])
/// // "p-4 flex"
///
/// resolve_class_names(vec!["bg-red-500  ".into(), "  text-white".into()])
/// // "bg-red-500 text-white"
/// ```
#[napi]
pub fn resolve_class_names(inputs: Vec<String>) -> String {
    tws_debug!("[class_utils] resolve_class_names count={}", inputs.len());
    let mut parts: Vec<&str> = Vec::with_capacity(inputs.len() * 2);
    for input in &inputs {
        let trimmed = input.trim();
        if !trimmed.is_empty() {
            // split_whitespace handles multiple spaces within each input
            for token in trimmed.split_whitespace() {
                parts.push(token);
            }
        }
    }
    parts.join(" ")
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_class_names_basic() {
        let result = resolve_class_names(vec!["p-4".into(), "flex".into()]);
        assert_eq!(result, "p-4 flex");
    }

    #[test]
    fn test_resolve_class_names_filters_empty() {
        let result = resolve_class_names(vec!["p-4".into(), "".into(), "flex".into()]);
        assert_eq!(result, "p-4 flex");
    }

    #[test]
    fn test_resolve_class_names_normalizes_whitespace() {
        let result = resolve_class_names(vec!["  bg-red-500  ".into(), "  text-white".into()]);
        assert_eq!(result, "bg-red-500 text-white");
    }

    #[test]
    fn test_resolve_class_names_collapses_internal_spaces() {
        let result = resolve_class_names(vec!["p-4  m-2".into()]);
        assert_eq!(result, "p-4 m-2");
    }

    #[test]
    fn test_resolve_class_names_empty_input() {
        let result = resolve_class_names(vec![]);
        assert_eq!(result, "");
    }

    #[test]
    fn test_resolve_class_names_all_empty_strings() {
        let result = resolve_class_names(vec!["".into(), "  ".into(), "\t".into()]);
        assert_eq!(result, "");
    }

    #[test]
    fn test_resolve_class_names_single() {
        let result = resolve_class_names(vec!["bg-blue-500".into()]);
        assert_eq!(result, "bg-blue-500");
    }
}