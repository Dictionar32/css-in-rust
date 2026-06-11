pub mod animation;
pub mod css_compiler;
pub mod css_rule;
pub mod error;
pub mod model;
pub mod parsed_class;
pub mod semantic;
pub mod services;
pub mod theme;
pub mod theme_config;
pub mod transform;
pub mod transform_components;
pub(crate) mod transform_parser;
pub mod variant;
pub mod variant_precedence;
pub mod variants;

// Re-export commonly used types
pub use css_compiler::{CssCompileResult, CompileStats};
pub use css_rule::{CssDeclaration, CssRule};
pub use error::{CompileError, GenerateError, ParseError, ResolveError, VariantError};
pub use transform::ParsedClass;
pub use theme_config::{DarkModeStrategy, ThemeConfig, ThemeValue};
pub use variant::Variant;
pub use variant_precedence::{get_variant_precedence, sort_by_precedence, VariantPrecedence};
