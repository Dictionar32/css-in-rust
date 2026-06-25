//! Tailwind CSS v4 default theme constants and dynamic CSS parsing

use crate::domain::theme_config::{ThemeConfig, ThemeValue};
use std::collections::HashMap;

/// Build a minimal theme override map from a list of CSS variable key-value pairs.
/// Returns a HashMap suitable for merging into ThemeConfig.
pub fn build_theme_overrides(pairs: &[(&str, &str)]) -> HashMap<String, ThemeValue> {
    pairs
        .iter()
        .map(|(k, v)| (k.to_string(), ThemeValue::Simple(v.to_string())))
        .collect()
}

/// Embed Tailwind v4 default theme stylesheet at compile-time
const DEFAULT_TAILWIND_THEME_CSS: &str = include_str!("../../../node_modules/tailwindcss/theme.css");

/// Temukan file globals.css di dalam workspace secara dinamis
fn find_globals_css() -> Option<String> {
    let mut current = std::env::current_dir().ok()?;
    
    // Jika kita berada di subfolder native, naik ke root
    if current.ends_with("native") {
        current.pop();
    }
    
    let paths = vec![
        current.join("examples").join("next-js-app").join("src").join("app").join("globals.css"),
        current.join("examples").join("demo-subcomponents").join("src").join("app").join("globals.css"),
    ];
    
    for path in paths {
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(path) {
                return Some(content);
            }
        }
    }
    
    None
}

/// Helper to strip nested @keyframes blocks from CSS content to make it valid CSS inside :root
fn strip_keyframes(css: &str) -> String {
    let mut result = String::new();
    let mut remaining = css;
    
    while let Some(start_idx) = remaining.find("@keyframes") {
        result.push_str(&remaining[..start_idx]);
        
        let after_keyframes = &remaining[start_idx..];
        if let Some(brace_idx) = after_keyframes.find('{') {
            let mut depth = 1;
            let mut end_idx = brace_idx + 1;
            let bytes = after_keyframes.as_bytes();
            
            while end_idx < bytes.len() && depth > 0 {
                if bytes[end_idx] == b'{' {
                    depth += 1;
                } else if bytes[end_idx] == b'}' {
                    depth -= 1;
                }
                end_idx += 1;
            }
            
            remaining = &after_keyframes[end_idx..];
        } else {
            remaining = "";
        }
    }
    
    result.push_str(remaining);
    result
}

/// Helper untuk mem-parse CSS theme block menggunakan Lightning CSS
pub fn parse_theme_css_with_lightning(css_content: &str, mut theme: ThemeConfig) -> ThemeConfig {
    let css_stripped = strip_keyframes(css_content);
    let css_modified = css_stripped
        .replace("@theme default", ":root")
        .replace("@theme inline", ":root")
        .replace("@theme", ":root");

    use lightningcss::stylesheet::{StyleSheet, ParserOptions};
    use lightningcss::rules::CssRule;

    if let Ok(stylesheet) = StyleSheet::parse(&css_modified, ParserOptions::default()) {
        for rule in &stylesheet.rules.0 {
            if let CssRule::Style(style_rule) = rule {
                let mut buffer = String::new();
                let mut printer = lightningcss::printer::Printer::new(&mut buffer, lightningcss::printer::PrinterOptions::default());
                if lightningcss::traits::ToCss::to_css(&style_rule.declarations, &mut printer).is_ok() {
                    let css_str = buffer.trim();
                    for line in css_str.split(';') {
                        let line = line.trim();
                        if !line.is_empty() {
                            if let Some((name, val)) = line.split_once(':') {
                                let name = name.trim().to_string();
                                let val = val.trim().to_string();

                                if name.starts_with("--color-") {
                                    let key = name.trim_start_matches("--color-").to_string();
                                    theme.colors.insert(key, ThemeValue::Simple(val));
                                } else if name == "--spacing" {
                                    theme.spacing.insert("spacing".to_string(), val.clone());
                                    theme.spacing.insert("--spacing".to_string(), val);
                                } else if name.starts_with("--spacing-") {
                                    let key = name.trim_start_matches("--spacing-").to_string();
                                    theme.spacing.insert(key, val);
                                } else if name.starts_with("--breakpoint-") {
                                    let key = name.trim_start_matches("--breakpoint-").to_string();
                                    theme.breakpoints.insert(key, val);
                                } else if name.starts_with("--text-") && !name.contains("--line-height") && !name.contains("--letter-spacing") && !name.contains("--font-weight") {
                                    let key = name.trim_start_matches("--text-").to_string();
                                    theme.font_sizes.insert(key, vec![val]);
                                } else if name.starts_with("--opacity-") {
                                    let key = name.trim_start_matches("--opacity-").to_string();
                                    theme.opacity.insert(key, val);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    theme
}

/// Parsing Tailwind config dinamis dari CSS menggunakan Lightning CSS
pub fn parse_tailwind_config_with_lightning() -> ThemeConfig {
    let mut theme = default_theme();
    if let Some(user_css) = find_globals_css() {
        theme = parse_theme_css_with_lightning(&user_css, theme);
    }
    theme
}

/// Get the default Tailwind v4 theme configuration
pub fn default_theme() -> ThemeConfig {
    let theme = ThemeConfig::new();
    parse_theme_css_with_lightning(DEFAULT_TAILWIND_THEME_CSS, theme)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_theme() {
        let css_modified = DEFAULT_TAILWIND_THEME_CSS
            .replace("@theme default", ":root")
            .replace("@theme inline", ":root")
            .replace("@theme", ":root");
        
        println!("CSS modified starts with: {}", &css_modified[..100]);
        
        use lightningcss::stylesheet::{StyleSheet, ParserOptions};
        match StyleSheet::parse(&css_modified, ParserOptions::default()) {
            Ok(stylesheet) => {
                println!("Parse ok! Rule count: {}", stylesheet.rules.0.len());
                for (i, rule) in stylesheet.rules.0.iter().enumerate().take(5) {
                    println!("Rule {}: {:?}", i, rule);
                }
            }
            Err(e) => {
                println!("Parse error: {:?}", e);
            }
        }

        let theme = default_theme();
        assert!(!theme.colors.is_empty());
        assert!(!theme.breakpoints.is_empty());
    }

    #[test]
    fn test_parse_tailwind_config_with_lightning() {
        let theme = parse_tailwind_config_with_lightning();
        // globals.css di next-js-app memiliki `--color-background: var(--background);`
        assert!(theme.colors.get("background").is_some());
        // Default breakpoints md harus tetap termuat
        assert_eq!(theme.breakpoints.get("md"), Some(&"48rem".to_string()));
    }
}
