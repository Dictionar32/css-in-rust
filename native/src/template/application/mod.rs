//! Template application module - re-exports template functionality

pub mod template;

pub use template::{
    parse_template_native,
    validate_component_config_native,
    ParsedTemplateResult,
    SubComponentEntry,
    ConfigValidationResult,
    ConfigValidationError,
};
