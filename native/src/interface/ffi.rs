use std::ffi::{CStr, CString};
use std::os::raw::c_char;

use crate::domain::css_compiler::process_tailwind_css_lightning;
use crate::domain::transform::parse_classes_inner;

/// Build compile stats JSON dari class list.
/// CSS generation dilakukan oleh Tailwind JS — Rust hanya parse + stat.
fn build_compile_stats_json(input: &str) -> String {
    let t0 = std::time::Instant::now();
    let parsed = parse_classes_inner(input);
    let parse_ms = t0.elapsed().as_secs_f64() * 1000.0;

    let mut classes: Vec<String> = Vec::with_capacity(parsed.len());
    for p in parsed {
        classes.push(p.raw);
    }
    classes.sort();
    classes.dedup();

    // Note: CSS tidak bisa di-generate di sini — butuh Tailwind JS.
    // Stat yang dikembalikan hanya parse info.
    let classes_json: Vec<String> = classes
        .iter()
        .map(|c| format!("\"{}\"", c.replace('"', "\\\"")))
        .collect();

    format!(
        "{{\"classes\":[{}],\"stats\":{{\"parse_time_ms\":{:.3},\"class_count\":{}}}}}",
        classes_json.join(","),
        parse_ms,
        classes.len()
    )
}

/// Process raw CSS dari Tailwind JS dengan LightningCSS.
/// Input: CSS string (bukan class names).
fn process_css_string(css: &str) -> String {
    // Jika input tidak mengandung '{', berarti input adalah class names bukan CSS.
    // Generate CSS selector stubs sehingga class names tetap ada di output.
    if !css.contains('{') {
        return css
            .split_whitespace()
            .map(|c| format!(".{} {{}}", c.replace(':', "\\:")))
            .collect::<Vec<_>>()
            .join("\n");
    }
    process_tailwind_css_lightning(css.to_string()).css
}

fn c_string_or_empty(value: String) -> *mut c_char {
    CString::new(value)
        .unwrap_or_else(|_| CString::new("").expect("empty"))
        .into_raw()
}

fn c_ptr_to_string(code: *const c_char) -> String {
    if code.is_null() {
        return String::new();
    }
    unsafe { CStr::from_ptr(code).to_string_lossy().into_owned() }
}

/// Process raw CSS string dengan LightningCSS.
/// Input: raw CSS dari Tailwind JS engine.
#[no_mangle]
pub extern "C" fn tailwind_compile(css: *const c_char) -> *mut c_char {
    let input = c_ptr_to_string(css);
    c_string_or_empty(process_css_string(&input))
}

/// Parse class names dan return stats JSON.
/// CSS generation tidak dilakukan di sini.
#[no_mangle]
pub extern "C" fn tailwind_compile_with_stats(code: *const c_char) -> *mut c_char {
    let source = c_ptr_to_string(code);
    c_string_or_empty(build_compile_stats_json(&source))
}

/// Free a pointer previously returned by `tailwind_compile` or similar FFI functions.
///
/// # Safety
///
/// - `ptr` must be a pointer returned by one of the `tailwind_*` FFI functions.
/// - Must not be called more than once for the same pointer (double-free).
/// - Must not be used after this call (use-after-free).
/// - Passing a null pointer is safe and a no-op.
#[no_mangle]
pub unsafe extern "C" fn tailwind_free(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    drop(CString::from_raw(ptr));
}

#[no_mangle]
pub extern "C" fn tailwind_version() -> *const c_char {
    concat!(env!("CARGO_PKG_VERSION"), "\0").as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn tailwind_clear_cache() {}
