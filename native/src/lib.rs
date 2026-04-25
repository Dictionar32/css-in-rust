//! Native Rust engine crate entrypoint.
//! Single Source of Truth (SOT) berada pada modul DDD per layer.

// Internal runtime modules
mod ast_optimizer;
mod oxc_parser;
mod scan_cache;
mod watcher;

// DDD layers
pub mod application;
pub mod domain;
pub mod infrastructure;
pub mod interface;
pub mod shared;

#[cfg(test)]
mod tests;

#[cfg(test)]
mod ast_optimizer_tests;
#[cfg(test)]
mod oxc_parser_tests;
#[cfg(test)]
mod scan_cache_tests;
#[cfg(test)]
mod watcher_tests;

// Core exports from various modules
pub use application::analyzer::analyze_classes;
pub use application::ast_extract::ast_extract_classes;
pub use application::css_analysis::{
    analyze_route_class_distribution, calculate_bundle_contributions, detect_dead_code,
    parse_css_to_rules,
};
pub use application::insights::{
    diff_class_lists, extract_component_usage, normalize_and_dedup_classes,
};
pub use application::optimization::{
    analyze_class_usage, classify_and_sort_classes, compile_variant_table, hoist_components,
    merge_css_declarations,
};
pub use application::scanner::{
    batch_extract_classes, check_against_safelist, extract_classes_from_source, scan_workspace,
};

// Domain exports
pub use domain::animation::*;
pub use domain::css_compiler::compile_css;
pub use domain::css_compiler::compile_css_lightning;
pub use domain::css_compiler::process_tailwind_css_lightning;
pub use domain::css_compiler::process_tailwind_css_with_targets;
pub use domain::theme::*;
pub use domain::transform::{
    has_tw_usage, is_already_transformed, normalise_classes, parse_classes,
};
pub use domain::variants::{resolve_simple_variants, resolve_variants};

// Infrastructure
pub use infrastructure::cache_store::*;

// Interface exports - class extractor
pub use interface::class_extractor::{
    extract_all_classes, has_tw_usage as class_extractor_has_tw,
    is_already_transformed as class_extractor_is_already,
    parse_classes as class_extractor_parse_classes,
};
pub use interface::ffi::*;
