use napi_derive::napi;
use serde::{Deserialize, Serialize};

#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct ClassExtractResult {
    pub classes: Vec<String>,
    pub component_names: Vec<String>,
    pub has_tw_usage: bool,
    pub has_use_client: bool,
    pub imports: Vec<String>,
}

#[napi]
pub fn extract_all_classes(source: String) -> Vec<String> {
    crate::application::ast_extract::ast_extract_classes(source, String::new()).classes
}

#[napi]
pub fn extract_classes_from_source(source: String) -> ClassExtractResult {
    crate::application::ast_extract::ast_extract_classes(source, String::new()).into()
}

#[napi]
pub fn has_tw_usage(source: String) -> bool {
    source.contains("tw.") || source.contains("tw(") || source.contains("tailwind-styled")
}

#[napi]
pub fn is_already_transformed(source: String) -> bool {
    source.contains("@tw-transformed") || source.contains("/* @tw-transformed */")
}

#[napi]
pub fn parse_classes(raw: String) -> Vec<ClassToken> {
    crate::domain::transform_parser::parse_classes_inner(&raw)
        .into_iter()
        .map(|p| ClassToken {
            raw: p.raw,
            type_: p.modifier_type.unwrap_or_else(|| "unknown".to_string()),
        })
        .collect()
}

#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct ClassToken {
    pub raw: String,
    pub type_: String,
}

impl From<crate::application::ast_extract::AstExtractResult> for ClassExtractResult {
    fn from(r: crate::application::ast_extract::AstExtractResult) -> Self {
        ClassExtractResult {
            classes: r.classes,
            component_names: r.component_names,
            has_tw_usage: r.has_tw_usage,
            has_use_client: r.has_use_client,
            imports: r.imports,
        }
    }
}
