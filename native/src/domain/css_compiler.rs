use napi_derive::napi;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::domain::css_resolver::{tw_class_to_css, variant_to_at_rule};

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct CssCompileResult {
    /// Generated CSS output
    pub css: String,
    /// Classes that were successfully resolved
    pub resolved_classes: Vec<String>,
    /// Classes that had no known mapping (passed through as @apply)
    pub unknown_classes: Vec<String>,
    /// Byte size of generated CSS
    pub size_bytes: u32,
}

/// Compile a list of Tailwind classes into atomic CSS.
/// This is the Rust implementation of LightningCSS-style compilation.
/// For classes without a known mapping, generates `@apply` fallback rules.
#[napi]
pub fn compile_css(classes: Vec<String>, prefix: Option<String>) -> CssCompileResult {
    let pfx = prefix.as_deref().unwrap_or(".");

    let mut css_rules: Vec<String> = Vec::new();
    let mut resolved: Vec<String> = Vec::new();
    let mut unknown: Vec<String> = Vec::new();

    for class in &classes {
        // Strip variant prefix(es) for CSS lookup, keep for selector wrapping
        let has_variant = class.contains(':');
        let (variants_str, base_class) = if has_variant {
            let mut parts = class.splitn(2, ':');
            let v = parts.next().unwrap_or("");
            let b = parts.next().unwrap_or(class);
            // Handle multi-variant: dark:hover:bg-blue-600 → "dark:hover" + "bg-blue-600"
            (v, b)
        } else {
            ("", class.as_str())
        };

        if let Some(rule) = tw_class_to_css(base_class) {
            // Escape class name for CSS selector
            let selector = class
                .replace(':', "\\:")
                .replace('[', "\\[")
                .replace(']', "\\]")
                .replace('/', "\\/")
                .replace('.', "\\.");

            let css_rule = if has_variant {
                // Last variant is the pseudo-class/at-rule wrapper
                let last_variant = variants_str.splitn(2, ':').next().unwrap_or(variants_str);
                let at_or_pseudo = variant_to_at_rule(last_variant);
                if at_or_pseudo.starts_with('@') {
                    // Responsive/media: @media (min-width: 768px) { .md\:flex { display: flex } }
                    format!(
                        "{} {{ {}{} {{ {} }} }}",
                        at_or_pseudo.trim(),
                        pfx,
                        selector,
                        rule
                    )
                } else {
                    // Pseudo-class: .hover\:bg-blue-600:hover { background-color: ... }
                    format!("{}{}{} {{ {} }}", pfx, selector, at_or_pseudo.trim(), rule)
                }
            } else {
                format!("{}{} {{ {} }}", pfx, selector, rule)
            };

            css_rules.push(css_rule);
            resolved.push(class.clone());
        } else {
            // Unknown class — generate @apply fallback
            let selector = class
                .replace(':', "\\:")
                .replace('[', "\\[")
                .replace(']', "\\]");
            css_rules.push(format!("{}{} {{ @apply {}; }}", pfx, selector, class));
            unknown.push(class.clone());
        }
    }

    let css = css_rules.join("\n");
    let size_bytes = css.len() as u32;

    CssCompileResult {
        css,
        resolved_classes: resolved,
        unknown_classes: unknown,
        size_bytes,
    }
}
