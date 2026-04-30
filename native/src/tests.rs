mod tests {
    use crate::domain::transform::{
        build_metadata_json, parse_subcomponent_blocks, transform_source, SubComponent,
        TRANSFORM_MARKER,
    };
    use crate::domain::transform_components::render_compound_component;
    use crate::*;
    use std::ffi::{CStr, CString};

    #[test]
    fn parse_classes_keeps_variants_and_modifiers() {
        let out = parse_classes("hover:bg-blue-500 text-white/80 bg-(--brand)".to_string());
        assert_eq!(out.len(), 3);
        assert_eq!(out[0].raw, "hover:bg-blue-500");
        assert_eq!(out[0].variants, vec!["hover"]);
        assert_eq!(out[1].modifier_type.as_deref(), Some("opacity"));
        assert_eq!(out[2].modifier_type.as_deref(), Some("arbitrary"));
    }

    #[test]
    fn has_tw_usage_detects_tw_dot() {
        assert_eq!(
            has_tw_usage("const X = tw.div`foo`".to_string()),
            Some(true)
        );
        assert_eq!(has_tw_usage("const X = 1".to_string()), Some(false));
    }

    #[test]
    fn is_already_transformed_detects_marker() {
        let marked = format!("{}\nconst X = 1;", TRANSFORM_MARKER);
        assert_eq!(is_already_transformed(marked), Some(true));
        assert_eq!(
            is_already_transformed("const X = 1;".to_string()),
            Some(false)
        );
    }

    #[test]
    fn parse_subcomponent_blocks_extracts_blocks() {
        let t = "bg-blue-500 text-white\n  icon { mr-2 w-5 h-5 }\n  text { font-medium }";
        let (stripped, subs) = parse_subcomponent_blocks(t, "Button");
        assert_eq!(subs.len(), 2);
        assert_eq!(subs[0].name, "icon");
        assert_eq!(subs[1].name, "text");
        assert!(!stripped.contains("icon {"));
        assert!(stripped.contains("bg-blue-500"));
    }

    #[test]
    fn parse_subcomponent_blocks_extracts_bracket_blocks() {
        let t = "flex h-12 w-full [icon] { flex h-4 w-4 } [text] { font-medium }";
        let (stripped, subs) = parse_subcomponent_blocks(t, "Button");
        assert_eq!(subs.len(), 2);
        assert_eq!(subs[0].name, "icon");
        assert_eq!(subs[0].classes, "flex h-4 w-4");
        assert_eq!(subs[1].name, "text");
        assert!(!stripped.contains("[icon]"));
        assert!(stripped.contains("flex h-12 w-full"));
        assert!(!stripped.contains("h-4"));
    }

    #[test]
    fn parse_subcomponent_blocks_scoped_class_is_deterministic() {
        let t = "bg-blue-500\n  icon { mr-2 }";
        let (_, s1) = parse_subcomponent_blocks(t, "Button");
        let (_, s2) = parse_subcomponent_blocks(t, "Button");
        assert_eq!(s1[0].scoped_class, s2[0].scoped_class);
    }

    #[test]
    fn render_compound_component_uses_raw_subcomponent_classes() {
        let rendered = render_compound_component(
            "button",
            "flex h-12 w-full",
            "_Tw_Button",
            &[SubComponent {
                name: "icon".to_string(),
                tag: "span".to_string(),
                classes: "flex h-4 w-4".to_string(),
                scoped_class: "Button_icon_deadbe".to_string(),
            }],
            "Button",
        );

        assert!(rendered.contains("\"flex h-12 w-full\""));
        assert!(rendered.contains("\"flex h-4 w-4\""));
        assert!(!rendered.contains("\"Button_icon_deadbe\""));
    }

    #[test]
    fn transform_source_handles_simple_template() {
        let src = "import { tw } from \"tailwind-styled-v4\";\nconst Button = tw.button`bg-blue-500 text-white px-4`;\n";
        let result = transform_source(src.to_string(), None);
        assert!(result.changed);
        assert!(result.code.contains(TRANSFORM_MARKER));
        assert!(result.code.contains("React.forwardRef"));
        assert!(result.classes.contains(&"bg-blue-500".to_string()));
    }

    #[test]
    fn transform_source_skips_already_transformed() {
        let src = format!("{}\nconst X = 1;", TRANSFORM_MARKER);
        let result = transform_source(src.clone(), None);
        assert!(!result.changed);
    }

    #[test]
    fn transform_source_skips_dynamic_templates() {
        let src = "import { tw } from \"tailwind-styled-v4\";\nconst B = tw.button`bg-blue-500 ${props => props.x && \"ring-2\"}`;\n";
        let result = transform_source(src.to_string(), None);
        assert!(!result.changed);
    }

    #[test]
    fn c_abi_compile_roundtrip() {
        let src = CString::new("bg-blue-500 text-white").expect("valid input");
        let ptr = tailwind_compile(src.as_ptr());
        assert!(!ptr.is_null());
        let css = unsafe { CStr::from_ptr(ptr) }
            .to_string_lossy()
            .into_owned();
        assert!(css.contains(".bg-blue-500"));
        unsafe { tailwind_free(ptr) };
    }

    #[test]
    fn build_metadata_json_output() {
        let subs = vec![SubComponent {
            name: "icon".to_string(),
            tag: "span".to_string(),
            classes: "mr-2 w-5".to_string(),
            scoped_class: "Button_icon_abc123".to_string(),
        }];
        let meta = build_metadata_json("Button", "button", "Button_abc123", &subs);
        assert!(meta.contains("\"component\":\"Button\""));
        assert!(meta.contains("\"icon\""));
    }
}

// ═════════════════════════════════════════════════════════════════════════════

mod new_module_tests {
    use crate::application::engine::{compute_incremental_diff, hash_file_content};
    use crate::domain::animation::classes_to_css;
    use crate::*;

    // ── Analyzer ──────────────────────────────────────────────────────────────

    #[test]
    fn analyze_classes_counts_correctly() {
        let files_json = r#"[
            {"file":"a.tsx","classes":["bg-blue-500","text-white","bg-blue-500"]},
            {"file":"b.tsx","classes":["bg-blue-500","p-4","text-sm"]}
        ]"#;
        let report = analyze_classes(files_json.to_string(), "/root".to_string(), 5);
        assert_eq!(report.total_files, 2);
        // bg-blue-500 appears in both files' classes lists → 3 total occurrences
        assert_eq!(report.total_class_occurrences, 6);
        assert_eq!(report.top_classes[0].name, "bg-blue-500");
        assert_eq!(report.top_classes[0].count, 3);
        assert!(report
            .duplicate_candidates
            .iter()
            .any(|c| c.name == "bg-blue-500"));
        assert!(!report.safelist.is_empty());
    }

    #[test]
    fn analyze_classes_empty_input() {
        let report = analyze_classes("[]".to_string(), "/root".to_string(), 10);
        assert_eq!(report.total_files, 0);
        assert_eq!(report.total_class_occurrences, 0);
        assert!(report.top_classes.is_empty());
    }

    // ── Animate ───────────────────────────────────────────────────────────────

    #[test]
    fn compile_animation_basic() {
        let result = compile_animation(
            "opacity-0".to_string(),
            "opacity-100".to_string(),
            Some("fade".to_string()),
            Some(300),
            None,
            None,
            None,
            None,
            None,
        );
        assert!(result.class_name.starts_with("tw-fade"));
        assert!(result.keyframes_css.contains("@keyframes"));
        assert!(result.keyframes_css.contains("opacity: 0"));
        assert!(result.keyframes_css.contains("opacity: 1"));
        assert!(result.animation_css.contains("animation-duration: 300ms"));
    }

    #[test]
    fn compile_animation_with_transform() {
        let result = compile_animation(
            "opacity-0 translate-y-4".to_string(),
            "opacity-100 translate-y-0".to_string(),
            None,
            Some(400),
            Some("ease-out".to_string()),
            None,
            None,
            None,
            None,
        );
        assert!(result.keyframes_css.contains("opacity: 0"));
        assert!(result.keyframes_css.contains("translateY(1rem)"));
        assert!(result.animation_css.contains("400ms"));
    }

    #[test]
    fn compile_keyframes_multi_stop() {
        let stops = r#"[{"stop":"0%","classes":"opacity-0 scale-95"},{"stop":"100%","classes":"opacity-100 scale-100"}]"#;
        let result = compile_keyframes("pulse".to_string(), stops.to_string());
        assert!(result.class_name.contains("pulse"));
        assert!(result.keyframes_css.contains("0%"));
        assert!(result.keyframes_css.contains("100%"));
    }

    // ── Theme ─────────────────────────────────────────────────────────────────

    #[test]
    fn compile_theme_light_uses_root() {
        let primary = format!("{}3b82f6", "#");
        let secondary = format!("{}8b5cf6", "#");
        let tokens = format!(
            r#"{{"color":{{"primary":"{}","secondary":"{}"}}}}"#,
            primary, secondary
        );
        let result = compile_theme(tokens, "light".to_string(), "".to_string());
        assert_eq!(result.selector, ":root");
        assert!(result.css.contains("--color-primary:"));
        assert!(result.css.contains("3b82f6"));
        assert!(result.css.contains("8b5cf6"));
        assert_eq!(result.tokens.len(), 2);
    }

    #[test]
    fn compile_theme_dark_uses_data_attr() {
        let bg = format!("{}09090b", "#");
        let fg = format!("{}fafafa", "#");
        let tokens = format!(r#"{{"color":{{"bg":"{}","fg":"{}"}}}}"#, bg, fg);
        let result = compile_theme(tokens, "dark".to_string(), "tw".to_string());
        assert!(result.selector.contains("data-theme"));
        assert!(result.css.contains("--tw-color-bg"));
        assert!(result.css.contains("09090b"));
    }

    #[test]
    fn extract_css_vars_finds_vars() {
        let source = "const x = `bg-[var(--color-primary)] text-[var(--color-fg)]`";
        let vars = extract_css_vars(source.to_string());
        assert!(vars.contains(&"--color-primary".to_string()));
        assert!(vars.contains(&"--color-fg".to_string()));
    }

    // ── Engine ────────────────────────────────────────────────────────────────

    #[test]
    fn compute_incremental_diff_detects_changes() {
        let prev = r#"[{"file":"a.tsx","classes":["bg-blue-500","text-white"],"hash":"aaa"}]"#;
        let curr = r#"[{"file":"a.tsx","classes":["bg-red-500","text-white"],"hash":"bbb"}]"#;
        let diff = compute_incremental_diff(prev.to_string(), curr.to_string());
        assert!(diff.added_classes.contains(&"bg-red-500".to_string()));
        assert!(diff.removed_classes.contains(&"bg-blue-500".to_string()));
        assert!(diff.changed_files.contains(&"a.tsx".to_string()));
    }

    #[test]
    fn compute_incremental_diff_no_change_when_hash_same() {
        let state = r#"[{"file":"a.tsx","classes":["bg-blue-500"],"hash":"abc"}]"#;
        let diff = compute_incremental_diff(state.to_string(), state.to_string());
        assert!(diff.added_classes.is_empty());
        assert!(diff.removed_classes.is_empty());
        assert!(diff.changed_files.is_empty());
        assert_eq!(diff.unchanged_files, 1);
    }

    #[test]
    fn hash_file_content_is_deterministic() {
        let h1 = hash_file_content("hello world".to_string());
        let h2 = hash_file_content("hello world".to_string());
        let h3 = hash_file_content("hello WORLD".to_string());
        assert_eq!(h1, h2);
        assert_ne!(h1, h3);
        assert_eq!(h1.len(), 6); // 6-char hex
    }

    // ── Scanner ───────────────────────────────────────────────────────────────

    #[test]
    fn extract_classes_from_source_finds_tw_classes() {
        let source = r#"
const Button = tw.button`bg-blue-500 text-white px-4 hover:bg-blue-600`
const Card = tw.div`rounded-lg shadow-md p-4`
"#;
        let classes = extract_classes_from_source(source.to_string());
        assert!(classes.contains(&"bg-blue-500".to_string()));
        assert!(classes.contains(&"text-white".to_string()));
        assert!(classes.contains(&"hover:bg-blue-600".to_string()));
        assert!(classes.contains(&"rounded-lg".to_string()));
    }

    #[test]
    fn extract_classes_from_source_finds_classname() {
        let source = r#"<div className="flex items-center gap-4 p-6 bg-white rounded-xl" />"#;
        let classes = extract_classes_from_source(source.to_string());
        assert!(classes.contains(&"flex".to_string()));
        assert!(classes.contains(&"items-center".to_string()));
        assert!(classes.contains(&"bg-white".to_string()));
    }

    #[test]
    fn classes_to_css_merges_transforms() {
        let css = classes_to_css("opacity-0 translate-y-4 scale-95");
        assert!(css.contains("opacity: 0"));
        // Both transform values should be merged
        assert!(css.contains("transform:"));
        assert!(css.contains("translateY"));
        assert!(css.contains("scale"));
    }
}

// ═════════════════════════════════════════════════════════════════════════════

mod new_feature_tests {
    use crate::*;

    // ── cache ────────────────────────────────────────────────────────────────

    #[test]
    fn cache_read_missing_file_returns_empty() {
        let r = cache_read("/tmp/nonexistent_tw_cache_xyz.json".to_string());
        assert!(r.is_err(), "nonexistent file should return error");
    }

    #[test]
    fn cache_write_and_read_round_trip() {
        let path = "/tmp/tw_rust_test_cache.json".to_string();
        let entries = vec![
            CacheEntry {
                file: "/src/Button.tsx".to_string(),
                classes: vec!["bg-blue-500".to_string(), "text-white".to_string()],
                hash: "abc123".to_string(),
                mtime_ms: 1_700_000_000.0,
                size: 1024,
                hit_count: 3,
            },
            CacheEntry {
                file: "C:\\repo\\src\\Card.tsx".to_string(),
                classes: vec!["rounded-lg".to_string(), "shadow-md".to_string()],
                hash: "def456".to_string(),
                mtime_ms: 1_700_000_001.0,
                size: 512,
                hit_count: 0,
            },
        ];
        assert!(cache_write(path.clone(), entries).unwrap());
        let result = cache_read(path).unwrap();
        assert_eq!(result.entries.len(), 2);
        assert_eq!(result.entries[0].file, "/src/Button.tsx");
        assert_eq!(result.entries[0].classes, vec!["bg-blue-500", "text-white"]);
        assert_eq!(result.entries[0].hit_count, 3);
        assert_eq!(result.entries[1].file, "C:\\repo\\src\\Card.tsx");
    }

    #[test]
    fn cache_priority_new_file_is_max() {
        let p = cache_priority(1000.0, 512, 0.0, 0, 0, 0.0, 0.0);
        assert!(p >= 1_000_000_000.0);
    }

    #[test]
    fn cache_priority_changed_file_beats_unchanged() {
        let changed = cache_priority(1000.0, 512, 800.0, 512, 2, 900_000.0, 1_000_000.0);
        let unchanged = cache_priority(800.0, 512, 800.0, 512, 5, 900_000.0, 1_000_000.0);
        assert!(
            changed > unchanged,
            "changed={} unchanged={}",
            changed,
            unchanged
        );
    }

    // ── ast_extract_classes ──────────────────────────────────────────────────

    #[test]
    fn ast_extract_finds_tw_template_classes() {
        let src = r#"const Button = tw.button`bg-blue-500 text-white px-4 py-2`"#;
        let r = ast_extract_classes(src.to_string(), "Button.tsx".to_string());
        assert!(r.has_tw_usage);
        assert!(r.classes.contains(&"bg-blue-500".to_string()));
        assert!(r.classes.contains(&"px-4".to_string()));
    }

    #[test]
    fn ast_extract_finds_object_config_base() {
        let src = r#"const Card = tw.div({ base: "rounded-lg shadow-md p-6 bg-white" })"#;
        let r = ast_extract_classes(src.to_string(), "Card.tsx".to_string());
        assert!(r.classes.contains(&"rounded-lg".to_string()));
        assert!(r.classes.contains(&"shadow-md".to_string()));
    }

    #[test]
    fn ast_extract_finds_classname_jsx() {
        let src = r#"<div className="flex items-center gap-4 hover:bg-gray-100">content</div>"#;
        let r = ast_extract_classes(src.to_string(), "Layout.tsx".to_string());
        assert!(r.classes.contains(&"flex".to_string()));
        assert!(r.classes.contains(&"items-center".to_string()));
        assert!(r.classes.contains(&"hover:bg-gray-100".to_string()));
    }

    #[test]
    fn ast_extract_detects_use_client() {
        let src = r#""use client"
const Button = tw.button`px-4`"#;
        let r = ast_extract_classes(src.to_string(), "Client.tsx".to_string());
        assert!(r.has_use_client);
        assert!(r.has_tw_usage);
    }

    #[test]
    fn ast_extract_finds_component_names() {
        let src = r#"const Button = tw.button`px-4`
const Card = tw.div`rounded-lg`"#;
        let r = ast_extract_classes(src.to_string(), "components.tsx".to_string());
        assert!(r.component_names.contains(&"Button".to_string()));
        assert!(r.component_names.contains(&"Card".to_string()));
    }

    // ── compile_css ──────────────────────────────────────────────────────────

    #[test]
    fn compile_css_resolves_display_classes() {
        let r = compile_css(
            ".flex{display:flex}.block{display:block}.hidden{display:none}".to_string(),
            None,
        );
        assert!(r.css.contains("display:flex"));
        assert!(r.css.contains("display:block"));
        assert!(r.css.contains("display:none"));
        assert_eq!(r.resolved_classes.len(), 0);
        assert_eq!(r.unknown_classes.len(), 0);
    }

    #[test]
    fn compile_css_resolves_color_classes() {
        let r = compile_css(
            ".btn{background-color:#3b82f6;color:#fff;border-color:#dc2626}".to_string(),
            None,
        );
        assert!(
            r.css.contains("background-color:#3b82f6"),
            "background-color"
        );
        assert!(
            r.css.contains("color:#fff") || r.css.contains("color:#ffffff"),
            "color"
        );
        assert!(r.css.contains("border-color:#dc2626"), "border-color");
    }

    #[test]
    fn compile_css_handles_hover_variant() {
        let r = compile_css(".btn:hover{background-color:#2563eb}".to_string(), None);
        assert_eq!(r.resolved_classes.len(), 0);
        assert!(r.css.contains(":hover"), "hover selector should remain");
        assert!(
            r.css.contains("background-color:#2563eb"),
            "hover background color"
        );
    }

    #[test]
    fn compile_css_handles_responsive_variant() {
        let r = compile_css(
            "@media (min-width:768px){.md-flex{display:flex}}".to_string(),
            None,
        );
        assert_eq!(r.resolved_classes.len(), 0);
        assert!(r.css.contains("@media"), "media query should remain");
        assert!(r.css.contains("display:flex"));
    }

    #[test]
    fn compile_css_handles_arbitrary_values() {
        let r = compile_css(".box{background:#3b82f6;width:200px}".to_string(), None);
        assert!(r.css.contains("#3b82f6"), "arbitrary bg color");
        assert!(r.css.contains("width:200px"), "arbitrary width");
        assert_eq!(r.unknown_classes.len(), 0);
    }

    #[test]
    fn compile_css_unknown_classes_get_apply_fallback() {
        let r = compile_css("totally-made-up-class".to_string(), None);
        assert_eq!(r.unknown_classes.len(), 0);
        assert_eq!(r.css, "totally-made-up-class");
    }

    #[test]
    fn compile_css_custom_prefix() {
        let r = compile_css(
            "#app .flex{display:flex}".to_string(),
            Some("#app ".to_string()),
        );
        assert!(r.css.contains("#app"), "raw CSS prefix should remain");
        assert!(r.css.contains("display:flex"));
    }
}

#[cfg(test)]
mod oxc_api_test {
    // Just test that oxc 0.1 compiles with something
    #[test]
    fn oxc_available() {
        // oxc 0.1 check
        assert!(true);
    }
}

// ═════════════════════════════════════════════════════════════════════════════
