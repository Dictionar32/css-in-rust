use napi_derive::napi;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use crate::oxc_parser;

#[napi(object)]
#[derive(Serialize, Deserialize, JsonSchema)]
pub struct OxcExtractResult {
    pub classes: Vec<String>,
    pub component_names: Vec<String>,
    pub has_tw_usage: bool,
    pub has_use_client: bool,
    pub imports: Vec<String>,
    pub engine: String,
}

/// Extract Tailwind classes using real Oxc AST parser.
/// Handles: tw.tag``, tw(Comp)``, base:"", className="", cx()/cn()
/// More accurate than regex — understands JSX, TypeScript, template literals.
#[napi]
pub fn oxc_extract_classes(source: String, filename: String) -> OxcExtractResult {
    let r = oxc_parser::extract_classes_oxc(&source, &filename);
    OxcExtractResult {
        classes: r.classes,
        component_names: r.component_names,
        has_tw_usage: r.has_tw_usage,
        has_use_client: r.has_use_client,
        imports: r.imports,
        engine: "oxc".to_string(),
    }
}

// ═════════════════════════════════════════════════════════════════════════════
