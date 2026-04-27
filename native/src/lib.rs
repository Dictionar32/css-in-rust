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
pub use application::analyzer::{analyze_classes, build_distribution, collect_class_counts};
pub use application::animate_utils::{
    animation_cache_key, keyframes_cache_key, normalize_iterations, normalize_number,
    split_animate_classes, stable_keyframes_entries,
};
pub use application::ast_extract::ast_extract_classes;
pub use application::atomic::{
    atomic_registry_size, clear_atomic_registry, generate_atomic_css, parse_atomic_class,
    to_atomic_classes,
};
pub use application::cache_resolver::{
    reverse_lookup_by_property, reverse_lookup_cache_size, reverse_lookup_clear_cache,
    reverse_lookup_find_dependents, reverse_lookup_from_css,
};
pub use application::cascade_resolver::resolve_cascade;
pub use application::css_analysis::{
    analyze_route_class_distribution, calculate_bundle_contributions, calculate_impact_scores,
    detect_dead_code, parse_css_to_rules,
};
pub use application::engine::{
   compute_incremental_diff, create_fingerprint, hash_file_content, process_file_change,
};
pub use application::incremental::{apply_class_diff, are_class_sets_equal, rebuild_workspace_result};
pub use application::hashing::{hash_content, hash_file, scan_file_native, scan_files_batch};
pub use application::plugin_registry::{
    plugin_check_all_updates, plugin_search, plugin_semver_has_update, plugin_validate_name,
    plugin_verify_integrity,
};
pub use application::impact_analysis::{calculate_impact, calculate_risk, calculate_savings};
pub use application::impact_scorer::{
    compute_impact_metadata, generate_suggestions, is_critical_class,
    calculate_risk as scorer_calculate_risk, calculate_savings as scorer_calculate_savings,
};
pub use application::insights::{
    diff_class_lists, extract_component_usage, normalize_and_dedup_classes,
};
pub use application::optimization::{
    analyze_class_usage, classify_and_sort_classes, compile_variant_table, hoist_components,
    merge_css_declarations,
};
pub use application::scanner::{
    batch_extract_classes, check_against_safelist, extract_classes_from_source,
    generate_sub_component_types, scan_file, scan_workspace,
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