//! Test-only module extracted from ast_optimizer.rs

use crate::ast_optimizer::extract_templates_from_ast;

#[cfg(test)]
#[allow(dead_code)]
pub fn benchmark_ast_vs_regex(source: &str) -> (usize, usize, bool) {
    let (ast_templates, _, ast_error) = extract_templates_from_ast(source);
    let regex_count = source.matches("tw.").count();

    // Return (AST count, regex count, had AST error)
    (ast_templates.len(), regex_count, ast_error)
}

#[cfg(test)]
mod tests {
    use crate::ast_optimizer::*;

    #[test]
    fn ast_extract_simple_template() {
        let source = r#"const Button = tw.button`bg-blue-500 text-white`;"#;
        let (templates, _, error) = extract_templates_from_ast(source);
        assert!(!error);
        assert_eq!(templates.len(), 1);
        assert_eq!(templates[0].tag, "button");
        assert!(templates[0].content.contains("bg-blue"));
    }

    #[test]
    fn ast_extract_multiple_templates() {
        let source = r#"
            const Button = tw.button`bg-blue-500`;
            const Card = tw.div`rounded-lg p-4`;
        "#;
        let (templates, _, _) = extract_templates_from_ast(source);
        assert_eq!(templates.len(), 2);
        assert_eq!(templates[0].tag, "button");
        assert_eq!(templates[1].tag, "div");
    }

    #[test]
    fn ast_extract_skips_dynamic_templates() {
        let source = r#"const Button = tw.button`bg-${color} text-white`;"#;
        let (templates, _, _) = extract_templates_from_ast(source);
        // Dynamic templates are skipped (contains ${)
        assert_eq!(templates.len(), 0);
    }

    #[test]
    fn ast_extract_detects_server_component() {
        let source = r#"const Card = tw.div`p-4`;"#;
        let (templates, is_server, _) = extract_templates_from_ast(source);
        assert!(is_server); // No 'use client' directive
        assert_eq!(templates.len(), 1);
    }

    #[test]
    fn ast_extract_detects_client_component() {
        let source = r#""use client"; const Button = tw.button`bg-blue`;"#;
        let (templates, is_server, _) = extract_templates_from_ast(source);
        assert!(!is_server); // Has 'use client' directive means not a server component
        assert_eq!(templates.len(), 1);
    }
}
