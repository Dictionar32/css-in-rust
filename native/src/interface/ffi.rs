use std::ffi::{CStr, CString};
use std::os::raw::c_char;

use crate::domain::css_compiler::compile_css;
use crate::domain::transform::{normalise_classes, parse_classes_inner};

fn build_css_from_input(input: &str) -> (String, Vec<String>) {
    let mut classes = normalise_classes(input);
    classes.sort();
    classes.dedup();
    let compiled = compile_css(classes.clone(), None);
    (compiled.css, classes)
}

fn escape_json_string(value: &str) -> String {
    // ─ OPTIMIZATION (Phase 1.2): Use serde_json for proper escaping
    serde_json::to_string(value).unwrap_or_else(|_| format!("\"{}\"", value.replace('"', "\\\"")))
}

fn build_compile_stats_json(input: &str) -> String {
    let t0 = std::time::Instant::now();
    let parsed = parse_classes_inner(input);
    let parse_ms = t0.elapsed().as_secs_f64() * 1000.0;
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate classes vector with exact capacity
    let mut classes: Vec<String> = Vec::with_capacity(parsed.len());
    for p in parsed {
        classes.push(p.raw);
    }
    classes.sort();
    classes.dedup();
    let t1 = std::time::Instant::now();
    let css = compile_css(classes.clone(), None).css;
    let gen_ms = t1.elapsed().as_secs_f64() * 1000.0;
    // ─ OPTIMIZATION (Phase 1.1): Pre-allocate classes_json vector
    let mut classes_json_parts: Vec<String> = Vec::with_capacity(classes.len());
    for c in &classes {
        classes_json_parts.push(format!("\"{}\"", escape_json_string(c)));
    }
    let classes_json = classes_json_parts.join(",");
    format!(
        "{{\"css\":\"{}\",\"classes\":[{}],\"stats\":{{\"parse_time_ms\":{:.3},\"generate_time_ms\":{:.3},\"class_count\":{},\"css_size\":{}}}}}",
        escape_json_string(&css), classes_json, parse_ms, gen_ms, classes.len(), css.len()
    )
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

#[no_mangle]
pub extern "C" fn tailwind_compile(code: *const c_char) -> *mut c_char {
    let source = c_ptr_to_string(code);
    let (css, _) = build_css_from_input(&source);
    c_string_or_empty(css)
}

#[no_mangle]
pub extern "C" fn tailwind_compile_with_stats(code: *const c_char) -> *mut c_char {
    let source = c_ptr_to_string(code);
    c_string_or_empty(build_compile_stats_json(&source))
}

#[no_mangle]
pub extern "C" fn tailwind_free(ptr: *mut c_char) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        drop(CString::from_raw(ptr));
    }
}

#[no_mangle]
pub extern "C" fn tailwind_version() -> *const c_char {
    concat!(env!("CARGO_PKG_VERSION"), "\0").as_ptr() as *const c_char
}

#[no_mangle]
pub extern "C" fn tailwind_clear_cache() {}

// ─────────────────────────────────────────────────────────────────────────────
