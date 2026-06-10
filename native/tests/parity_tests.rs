//! Phase 5a: Parity Tests - CSS Compiler Validation
//! 
//! Tests that the CSS compiler generates valid output for all class types
//! and maintains deterministic behavior across compilations.

#[cfg(test)]
mod parity_tests {
    use tailwind_styled_parser::{
        domain::css_compiler::CssCompiler,
        domain::theme_config::ThemeConfig,
    };

    fn default_theme() -> ThemeConfig {
        ThemeConfig::default()
    }

    fn normalize_css(css: &str) -> String {
        css.lines()
            .map(|line| line.trim())
            .filter(|line| !line.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    }

    // ============================================================================
    // PARITY TEST GROUP 1: Simple Classes
    // ============================================================================

    #[test]
    fn test_simple_padding() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["px-4".to_string()]);
        assert!(result.is_ok(), "Should compile px-4");
    }

    #[test]
    fn test_simple_margin() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["m-0".to_string()]);
        assert!(result.is_ok(), "Should compile m-0");
    }

    #[test]
    fn test_simple_background() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["bg-white".to_string()]);
        assert!(result.is_ok(), "Should compile bg-white");
    }

    #[test]
    fn test_simple_flex() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["flex".to_string()]);
        assert!(result.is_ok(), "Should compile flex");
    }

    #[test]
    fn test_simple_width() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["w-full".to_string()]);
        assert!(result.is_ok(), "Should compile w-full");
    }

    // ============================================================================
    // PARITY TEST GROUP 2: Variant Classes
    // ============================================================================

    #[test]
    fn test_variant_hover() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["hover:bg-blue-500".to_string()]);
        assert!(result.is_ok(), "Should compile hover:bg-blue-500");
    }

    #[test]
    fn test_variant_focus() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["focus:ring-2".to_string()]);
        assert!(result.is_ok(), "Should compile focus:ring-2");
    }

    #[test]
    fn test_variant_responsive_md() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["md:text-xl".to_string()]);
        assert!(result.is_ok(), "Should compile md:text-xl");
    }

    #[test]
    fn test_variant_dark() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["dark:bg-gray-900".to_string()]);
        assert!(result.is_ok(), "Should compile dark:bg-gray-900");
    }

    // ============================================================================
    // PARITY TEST GROUP 3: Modifier Classes
    // ============================================================================

    #[test]
    fn test_modifier_opacity_50() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["bg-blue-600/50".to_string()]);
        assert!(result.is_ok(), "Should compile bg-blue-600/50");
    }

    #[test]
    fn test_modifier_opacity_75() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["text-red-500/75".to_string()]);
        assert!(result.is_ok(), "Should compile text-red-500/75");
    }

    // ============================================================================
    // PARITY TEST GROUP 4: Arbitrary Values
    // ============================================================================

    #[test]
    fn test_arbitrary_width() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["[width:200px]".to_string()]);
        assert!(result.is_ok(), "Should compile [width:200px]");
    }

    #[test]
    fn test_arbitrary_color() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["[color:rgb(255,0,0)]".to_string()]);
        assert!(result.is_ok(), "Should compile [color:rgb(255,0,0)]");
    }

    // ============================================================================
    // PARITY TEST GROUP 5: Complex Multi-Variant
    // ============================================================================

    #[test]
    fn test_complex_md_hover_bg() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["md:hover:bg-slate-900".to_string()]);
        assert!(result.is_ok(), "Should compile md:hover:bg-slate-900");
    }

    #[test]
    fn test_complex_dark_opacity() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec!["dark:bg-black/50".to_string()]);
        assert!(result.is_ok(), "Should compile dark:bg-black/50");
    }

    // ============================================================================
    // PARITY TEST GROUP 6: Multiple Classes
    // ============================================================================

    #[test]
    fn test_multiple_classes_simple() {
        let compiler = CssCompiler::new(default_theme());
        let classes = vec![
            "px-4".to_string(),
            "py-2".to_string(),
            "bg-white".to_string(),
        ];
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should compile multiple classes");
    }

    #[test]
    fn test_multiple_classes_with_variants() {
        let compiler = CssCompiler::new(default_theme());
        let classes = vec![
            "px-4".to_string(),
            "hover:bg-blue-500".to_string(),
            "md:text-lg".to_string(),
        ];
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should compile mixed classes");
    }

    #[test]
    fn test_large_class_batch() {
        let compiler = CssCompiler::new(default_theme());
        let mut classes = Vec::new();
        for i in 0..100 {
            classes.push(format!("p-{}", (i % 12) + 1));
        }
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should compile 100 classes");
    }

    // ============================================================================
    // PARITY TEST GROUP 7: Determinism
    // ============================================================================

    #[test]
    fn test_deterministic_simple() {
        let compiler = CssCompiler::new(default_theme());
        let classes = vec!["px-4".to_string(), "bg-blue-500".to_string()];
        
        let result1 = compiler.compile(classes.clone());
        let result2 = compiler.compile(classes);
        
        assert!(result1.is_ok() && result2.is_ok(), "Both should succeed");
        let norm1 = normalize_css(&result1.unwrap());
        let norm2 = normalize_css(&result2.unwrap());
        assert_eq!(norm1, norm2, "Same input should produce identical output");
    }

    #[test]
    fn test_deterministic_complex() {
        let compiler = CssCompiler::new(default_theme());
        let classes = vec![
            "md:hover:bg-slate-900".to_string(),
            "dark:text-white/50".to_string(),
        ];
        
        let result1 = compiler.compile(classes.clone());
        let result2 = compiler.compile(classes);
        
        assert!(result1.is_ok() && result2.is_ok(), "Both should succeed");
        let norm1 = normalize_css(&result1.unwrap());
        let norm2 = normalize_css(&result2.unwrap());
        assert_eq!(norm1, norm2, "Output should be deterministic");
    }

    // ============================================================================
    // PARITY TEST GROUP 8: Edge Cases
    // ============================================================================

    #[test]
    fn test_empty_input() {
        let compiler = CssCompiler::new(default_theme());
        let result = compiler.compile(vec![]);
        assert!(result.is_ok(), "Should handle empty input");
    }

    #[test]
    fn test_whitespace_normalization() {
        let compiler = CssCompiler::new(default_theme());
        let classes = vec![
            "  px-4  ".to_string(),
            "bg-white".to_string(),
        ];
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle whitespace");
    }

    #[test]
    fn test_duplicate_classes() {
        let compiler = CssCompiler::new(default_theme());
        let classes = vec!["px-4".to_string(), "px-4".to_string(), "py-2".to_string()];
        let result = compiler.compile(classes);
        assert!(result.is_ok(), "Should handle duplicates");
    }
}
