use std::collections::HashMap;

use crate::application::services::{ClassApplicationService, TransformApplicationService};
use crate::domain::model::{ParsedClass, ScanResult};
use crate::domain::transform::{RscAnalysis, TransformResult};

/// Interface adapter untuk endpoint N-API / eksternal binding.
#[derive(Default)]
pub struct ExternalApiAdapter {
    pub class_app: ClassApplicationService,
    pub transform_app: TransformApplicationService,
}

impl ExternalApiAdapter {
    pub fn parse_classes(&self, input: String) -> Vec<ParsedClass> {
        self.class_app.parse_classes(input)
    }

    pub fn transform_source(
        &self,
        source: String,
        opts: Option<HashMap<String, String>>,
    ) -> TransformResult {
        self.transform_app.transform_source(source, opts)
    }

    pub fn analyze_rsc(&self, source: String, filename: String) -> RscAnalysis {
        self.transform_app.analyze_rsc(source, filename)
    }

    pub fn scan_workspace(
        &self,
        root: String,
        extensions: Option<Vec<String>>,
    ) -> napi::Result<ScanResult> {
        self.transform_app.scan_workspace(root, extensions)
    }
}
