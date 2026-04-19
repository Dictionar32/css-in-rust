use crate::domain::css_compiler::CssCompileResult;
use crate::domain::model::{ClassName, CssBundle, ParsedClass, ScanResult};
use crate::domain::transform::{RscAnalysis, TransformResult};

/// Domain Service: parsing + normalisasi class.
#[derive(Default)]
pub struct ClassParserService;

impl ClassParserService {
    pub fn parse(&self, input: String) -> Vec<ParsedClass> {
        crate::domain::transform::parse_classes(input)
    }

    pub fn normalize(&self, classes: &[String]) -> Vec<ClassName> {
        crate::domain::transform_parser::normalise_classes(&classes.join(" "))
            .into_iter()
            .map(ClassName)
            .collect()
    }
}

/// Domain Service: transformasi source ke output komponen.
#[derive(Default)]
pub struct ComponentTransformerService;

impl ComponentTransformerService {
    pub fn transform(
        &self,
        source: String,
        opts: Option<std::collections::HashMap<String, String>>,
    ) -> TransformResult {
        crate::domain::transform::transform_source(source, opts)
    }
}

/// Domain Service: generator CSS dari daftar class.
#[derive(Default)]
pub struct CssGeneratorService;

impl CssGeneratorService {
    pub fn generate(&self, classes: Vec<String>, prefix: Option<String>) -> CssCompileResult {
        crate::domain::css_compiler::compile_css(classes, prefix)
    }

    pub fn generate_bundle(&self, classes: Vec<String>, prefix: Option<String>) -> CssBundle {
        let result = self.generate(classes.clone(), prefix);
        CssBundle {
            css: result.css,
            classes: classes.into_iter().map(ClassName).collect(),
            size_bytes: result.size_bytes,
        }
    }
}

/// Domain Service: analisis React Server Components.
#[derive(Default)]
pub struct RscAnalysisService;

impl RscAnalysisService {
    pub fn analyze(&self, source: String, filename: String) -> RscAnalysis {
        crate::domain::transform::analyze_rsc(source, filename)
    }
}

/// Helper aggregate builder (domain murni untuk scan output).
pub fn build_scan_aggregate(scan: crate::application::scanner::ScanResult) -> ScanResult {
    ScanResult {
        total_files: scan.total_files,
        files: scan.files,
        unique_classes: scan.unique_classes.into_iter().map(ClassName).collect(),
    }
}
