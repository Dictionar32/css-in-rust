//! NAPI CSS Generation Tests - Week 4 Day 3
//! 
//! Tests CSS string generation: CssRule → CSS output

use tailwind_styled_parser::infrastructure::napi_bridge::{
    compile_class, generate_css, generate_css_batch,
    compile_to_css, compile_to_css_batch, minify_css
};

// ============================================================================
// GENERATE_CSS TESTS (15 tests)
// ============================================================================

#[test]
fn test_generate_simple_bg() {
    let rule_json = compile_class("bg-blue-600".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("background-color"));
    assert!(output.contains("#1e40af"));
}

#[test]
fn test_generate_with_hover() {
    let rule_json = compile_class("hover:bg-blue-600".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains(":hover"));
}

#[test]
fn test_generate_with_responsive() {
    let rule_json = compile_class("md:bg-blue-600".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("@media"));
    assert!(output.contains("768px"));
}

#[test]
fn test_generate_with_opacity() {
    let rule_json = compile_class("bg-blue-600/50".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("rgba"));
}

#[test]
fn test_generate_minified() {
    let rule_json = compile_class("bg-blue-600".to_string()).unwrap();
    let css = generate_css(rule_json, Some(true));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(!output.contains("\n")); // No newlines in minified
}

#[test]
fn test_generate_formatted() {
    let rule_json = compile_class("bg-blue-600".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("\n")); // Has newlines when formatted
}

#[test]
fn test_generate_padding() {
    let rule_json = compile_class("p-4".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("padding"));
    assert!(output.contains("1rem"));
}

#[test]
fn test_generate_margin() {
    let rule_json = compile_class("m-8".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("margin"));
}

#[test]
fn test_generate_text_color() {
    let rule_json = compile_class("text-white".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("color"));
    assert!(output.contains("#ffffff"));
}

#[test]
fn test_generate_border() {
    let rule_json = compile_class("border-gray-300".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_generate_complex() {
    let rule_json = compile_class("lg:hover:bg-indigo-600/75".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("@media"));
    assert!(output.contains(":hover"));
    assert!(output.contains("rgba"));
}

#[test]
fn test_generate_selector_format() {
    let rule_json = compile_class("bg-blue-600".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("."));
    assert!(output.contains("{"));
    assert!(output.contains("}"));
}

#[test]
fn test_generate_declaration() {
    let rule_json = compile_class("bg-blue-600".to_string()).unwrap();
    let css = generate_css(rule_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains(":"));
    assert!(output.contains(";"));
}

#[test]
fn test_generate_default_not_minified() {
    let rule_json = compile_class("bg-blue-600".to_string()).unwrap();
    let css = generate_css(rule_json, None);
    assert!(css.is_ok());
}

#[test]
fn test_generate_multiple_properties() {
    let classes = vec!["bg-blue-600", "text-white", "p-4"];
    for class in classes {
        let rule_json = compile_class(class.to_string()).unwrap();
        let css = generate_css(rule_json, Some(false));
        assert!(css.is_ok(), "Failed: {}", class);
    }
}

// ============================================================================
// GENERATE_CSS_BATCH TESTS (10 tests)
// ============================================================================

#[test]
fn test_batch_generate_simple() {
    let rules = compile_class("bg-blue-600".to_string()).unwrap();
    let batch_json = format!("[{}]", rules);
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_generate_multiple() {
    let rule1 = compile_class("bg-blue-600".to_string()).unwrap();
    let rule2 = compile_class("text-white".to_string()).unwrap();
    let batch_json = format!("[{},{}]", rule1, rule2);
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("background-color"));
    assert!(output.contains("color"));
}

#[test]
fn test_batch_generate_minified() {
    let rule1 = compile_class("bg-blue-600".to_string()).unwrap();
    let rule2 = compile_class("text-white".to_string()).unwrap();
    let batch_json = format!("[{},{}]", rule1, rule2);
    let css = generate_css_batch(batch_json, Some(true));
    assert!(css.is_ok());
}

#[test]
fn test_batch_generate_formatted() {
    let rule1 = compile_class("bg-blue-600".to_string()).unwrap();
    let rule2 = compile_class("text-white".to_string()).unwrap();
    let batch_json = format!("[{},{}]", rule1, rule2);
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("\n"));
}

#[test]
fn test_batch_generate_colors() {
    let rules: Vec<String> = vec!["bg-red-500", "bg-blue-600", "bg-green-400"]
        .iter()
        .map(|c| compile_class(c.to_string()).unwrap())
        .collect();
    let batch_json = format!("[{}]", rules.join(","));
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_generate_spacing() {
    let rules: Vec<String> = vec!["p-4", "m-8", "px-6"]
        .iter()
        .map(|c| compile_class(c.to_string()).unwrap())
        .collect();
    let batch_json = format!("[{}]", rules.join(","));
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_generate_variants() {
    let rules: Vec<String> = vec!["hover:bg-blue-600", "focus:text-red-500"]
        .iter()
        .map(|c| compile_class(c.to_string()).unwrap())
        .collect();
    let batch_json = format!("[{}]", rules.join(","));
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_generate_responsive() {
    let rules: Vec<String> = vec!["sm:p-2", "md:p-4", "lg:p-6"]
        .iter()
        .map(|c| compile_class(c.to_string()).unwrap())
        .collect();
    let batch_json = format!("[{}]", rules.join(","));
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_generate_empty() {
    let batch_json = "[]".to_string();
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_generate_complex() {
    let rules: Vec<String> = vec!["lg:hover:bg-blue-600/50", "dark:text-white"]
        .iter()
        .map(|c| compile_class(c.to_string()).unwrap())
        .collect();
    let batch_json = format!("[{}]", rules.join(","));
    let css = generate_css_batch(batch_json, Some(false));
    assert!(css.is_ok());
}

// ============================================================================
// COMPILE_TO_CSS TESTS (15 tests)
// ============================================================================

#[test]
fn test_compile_to_css_simple() {
    let css = compile_to_css("bg-blue-600".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains(".bg-blue-600"));
    assert!(output.contains("background-color"));
    assert!(output.contains("#1e40af"));
}

#[test]
fn test_compile_to_css_hover() {
    let css = compile_to_css("hover:bg-blue-600".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains(":hover"));
}

#[test]
fn test_compile_to_css_responsive() {
    let css = compile_to_css("md:bg-blue-600".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("@media"));
}

#[test]
fn test_compile_to_css_opacity() {
    let css = compile_to_css("bg-blue-600/50".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("rgba"));
}

#[test]
fn test_compile_to_css_minified() {
    let css = compile_to_css("bg-blue-600".to_string(), Some(true));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(!output.contains("\n"));
}

#[test]
fn test_compile_to_css_formatted() {
    let css = compile_to_css("bg-blue-600".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("\n"));
}

#[test]
fn test_compile_to_css_text_color() {
    let css = compile_to_css("text-white".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("color"));
}

#[test]
fn test_compile_to_css_padding() {
    let css = compile_to_css("p-4".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("padding"));
}

#[test]
fn test_compile_to_css_margin() {
    let css = compile_to_css("m-8".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("margin"));
}

#[test]
fn test_compile_to_css_complex() {
    let css = compile_to_css("lg:hover:bg-indigo-600/75".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("@media"));
    assert!(output.contains(":hover"));
    assert!(output.contains("rgba"));
}

#[test]
fn test_compile_to_css_dark_mode() {
    let css = compile_to_css("dark:bg-gray-900".to_string(), Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_compile_to_css_focus() {
    let css = compile_to_css("focus:ring-2".to_string(), Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_compile_to_css_active() {
    let css = compile_to_css("active:bg-red-700".to_string(), Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_compile_to_css_multi_variant() {
    let css = compile_to_css("md:hover:focus:bg-blue-600".to_string(), Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_compile_to_css_all_breakpoints() {
    let breakpoints = vec!["sm", "md", "lg", "xl", "2xl"];
    for bp in breakpoints {
        let class = format!("{}:p-4", bp);
        let css = compile_to_css(class, Some(false));
        assert!(css.is_ok());
    }
}

// ============================================================================
// COMPILE_TO_CSS_BATCH TESTS (10 tests)
// ============================================================================

#[test]
fn test_batch_compile_to_css_simple() {
    let classes = vec!["bg-blue-600".to_string(), "text-white".to_string()];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("background-color"));
    assert!(output.contains("color"));
}

#[test]
fn test_batch_compile_to_css_colors() {
    let classes = vec![
        "bg-red-500".to_string(),
        "bg-blue-600".to_string(),
        "bg-green-400".to_string(),
    ];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_compile_to_css_spacing() {
    let classes = vec!["p-4".to_string(), "m-8".to_string(), "px-6".to_string()];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_compile_to_css_variants() {
    let classes = vec![
        "hover:bg-blue-600".to_string(),
        "focus:text-red-500".to_string(),
    ];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_compile_to_css_responsive() {
    let classes = vec!["sm:p-2".to_string(), "md:p-4".to_string()];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_compile_to_css_minified() {
    let classes = vec!["bg-blue-600".to_string(), "text-white".to_string()];
    let css = compile_to_css_batch(classes, Some(true));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(!output.contains("\n"));
}

#[test]
fn test_batch_compile_to_css_formatted() {
    let classes = vec!["bg-blue-600".to_string(), "text-white".to_string()];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("\n"));
}

#[test]
fn test_batch_compile_to_css_empty() {
    let classes: Vec<String> = vec![];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_compile_to_css_complex() {
    let classes = vec![
        "lg:hover:bg-blue-600/50".to_string(),
        "dark:text-white".to_string(),
    ];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_batch_compile_to_css_button() {
    let classes = vec![
        "bg-blue-600".to_string(),
        "hover:bg-blue-700".to_string(),
        "text-white".to_string(),
        "px-4".to_string(),
        "py-2".to_string(),
    ];
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
}

// ============================================================================
// MINIFY_CSS TESTS (5 tests)
// ============================================================================

#[test]
fn test_minify_simple() {
    let css = ".bg-blue-600 {\n  background-color: #1e40af;\n}".to_string();
    let minified = minify_css(css);
    assert!(minified.is_ok());
    let output = minified.unwrap();
    assert!(!output.contains("\n"));
    assert!(!output.contains("  "));
}

#[test]
fn test_minify_with_media() {
    let css = "@media (min-width: 768px) {\n  .md\\:bg-blue-600 {\n    background-color: #1e40af;\n  }\n}".to_string();
    let minified = minify_css(css);
    assert!(minified.is_ok());
}

#[test]
fn test_minify_multiple_rules() {
    let css = ".bg-blue-600 { background-color: #1e40af; }\n.text-white { color: #ffffff; }".to_string();
    let minified = minify_css(css);
    assert!(minified.is_ok());
    let output = minified.unwrap();
    assert!(output.contains("background-color:#1e40af"));
}

#[test]
fn test_minify_empty() {
    let css = "".to_string();
    let minified = minify_css(css);
    assert!(minified.is_ok());
}

#[test]
fn test_minify_already_minified() {
    let css = ".bg-blue-600{background-color:#1e40af;}".to_string();
    let minified = minify_css(css);
    assert!(minified.is_ok());
}

// ============================================================================
// INTEGRATION TESTS (10 tests)
// ============================================================================

#[test]
fn test_full_pipeline_simple() {
    let css = compile_to_css("bg-blue-600".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains(".bg-blue-600"));
    assert!(output.contains("background-color: #1e40af"));
}

#[test]
fn test_full_pipeline_with_variant() {
    let css = compile_to_css("hover:bg-blue-600".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains(":hover"));
    assert!(output.contains("background-color"));
}

#[test]
fn test_full_pipeline_with_responsive() {
    let css = compile_to_css("md:bg-blue-600".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("@media (min-width: 768px)"));
}

#[test]
fn test_full_pipeline_complex() {
    let css = compile_to_css("lg:hover:bg-indigo-600/75".to_string(), Some(false));
    assert!(css.is_ok());
    let output = css.unwrap();
    assert!(output.contains("@media"));
    assert!(output.contains(":hover"));
    assert!(output.contains("rgba"));
}

#[test]
fn test_real_world_button() {
    let classes = vec![
        "bg-blue-600",
        "hover:bg-blue-700",
        "text-white",
        "px-4",
        "py-2",
    ];
    
    for class in classes {
        let css = compile_to_css(class.to_string(), Some(false));
        assert!(css.is_ok(), "Failed: {}", class);
    }
}

#[test]
fn test_real_world_card() {
    let classes = vec![
        "bg-white",
        "dark:bg-gray-800",
        "p-6",
        "shadow-lg",
    ];
    
    for class in classes {
        let css = compile_to_css(class.to_string(), Some(false));
        assert!(css.is_ok(), "Failed: {}", class);
    }
}

#[test]
fn test_batch_real_world() {
    let classes = vec![
        "bg-blue-600".to_string(),
        "hover:bg-blue-700".to_string(),
        "text-white".to_string(),
        "font-bold".to_string(),
        "py-2".to_string(),
        "px-4".to_string(),
        "rounded".to_string(),
    ];
    
    let css = compile_to_css_batch(classes, Some(false));
    assert!(css.is_ok());
}

#[test]
fn test_minification_reduces_size() {
    let css_formatted = compile_to_css("bg-blue-600".to_string(), Some(false)).unwrap();
    let css_minified = compile_to_css("bg-blue-600".to_string(), Some(true)).unwrap();
    
    assert!(css_minified.len() < css_formatted.len());
}

#[test]
fn test_format_consistency() {
    let classes = vec!["bg-blue-600", "text-white", "p-4"];
    
    for class in classes {
        let css = compile_to_css(class.to_string(), Some(false));
        assert!(css.is_ok());
        let output = css.unwrap();
        assert!(output.contains("{"));
        assert!(output.contains("}"));
        assert!(output.contains(":"));
        assert!(output.contains(";"));
    }
}

#[test]
fn test_end_to_end_performance() {
    let start = std::time::Instant::now();
    
    let classes = vec![
        "bg-blue-600",
        "text-white",
        "p-4",
        "m-8",
        "hover:bg-blue-700",
    ];
    
    for class in classes {
        let _ = compile_to_css(class.to_string(), Some(false));
    }
    
    let duration = start.elapsed();
    assert!(duration.as_millis() < 100); // Should be fast
}
