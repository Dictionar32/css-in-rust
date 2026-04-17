use std::collections::HashMap;

use crate::domain::model::{ClassName, CssBundle, ParsedClass, ScanResult};
use crate::domain::services::{
    build_scan_aggregate, ClassParserService, ComponentTransformerService, CssGeneratorService,
    RscAnalysisService,
};
use crate::domain::transform::{RscAnalysis, TransformResult};

/// Application service: orkestrasi use case level-class.
#[derive(Default)]
pub struct ClassApplicationService {
    parser: ClassParserService,
    css_generator: CssGeneratorService,
}

impl ClassApplicationService {
    pub fn new(parser: ClassParserService, css_generator: CssGeneratorService) -> Self {
        Self {
            parser,
            css_generator,
        }
    }

    pub fn parse_classes(&self, input: String) -> Vec<ParsedClass> {
        self.parser.parse(input)
    }

    pub fn normalize_classes(&self, classes: &[String]) -> Vec<ClassName> {
        self.parser.normalize(classes)
    }

    pub fn compile_css_bundle(&self, classes: Vec<String>, prefix: Option<String>) -> CssBundle {
        self.css_generator.generate_bundle(classes, prefix)
    }
}

/// Application service: orkestrasi transform source + analisis + scan.
#[derive(Default)]
pub struct TransformApplicationService {
    transformer: ComponentTransformerService,
    rsc: RscAnalysisService,
}

impl TransformApplicationService {
    pub fn new(transformer: ComponentTransformerService, rsc: RscAnalysisService) -> Self {
        Self { transformer, rsc }
    }

    pub fn transform_source(
        &self,
        source: String,
        opts: Option<HashMap<String, String>>,
    ) -> TransformResult {
        self.transformer.transform(source, opts)
    }

    pub fn analyze_rsc(&self, source: String, filename: String) -> RscAnalysis {
        self.rsc.analyze(source, filename)
    }

    pub fn scan_workspace(
        &self,
        root: String,
        extensions: Option<Vec<String>>,
    ) -> napi::Result<ScanResult> {
        let scan = crate::application::scanner::scan_workspace(root, extensions)?;
        Ok(build_scan_aggregate(scan))
    }
}
