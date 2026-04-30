//! Native Rust engine crate entrypoint.
//! Single Source of Truth (SOT) berada pada modul DDD per layer.

// Internal runtime modules
mod ast_optimizer;
mod debug;
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
pub use application::analyzer::{
    analyze_classes, build_distribution, collect_class_counts, compute_class_stats,
};
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
pub use application::class_utils::resolve_class_names;
pub use application::container_query::{
    build_container_rules, layout_classes_to_css, ContainerBreakpoint,
};
pub use application::css_analysis::{
    analyze_route_class_distribution, calculate_bundle_contributions, calculate_impact_scores,
    declaration_map_to_string, detect_dead_code, normalize_class_input, parse_css_to_rules,
    DeclarationEntry,
};
pub use application::engine::{
    compute_incremental_diff, create_fingerprint, hash_file_content, process_file_change,
};
pub use application::hashing::{hash_content, hash_file, scan_file_native, scan_files_batch};
pub use application::impact_analysis::{calculate_impact, calculate_risk, calculate_savings};
pub use application::impact_scorer::{
    calculate_risk as scorer_calculate_risk, calculate_savings as scorer_calculate_savings,
    compute_impact_metadata, generate_suggestions, is_critical_class,
};
pub use application::incremental::{
    apply_class_diff, are_class_sets_equal, rebuild_workspace_result,
};
pub use application::insights::{
    diff_class_lists, extract_component_usage, normalize_and_dedup_classes,
};
pub use application::optimization::{
    analyze_class_usage, classify_and_sort_classes, compile_variant_table, hoist_components,
    merge_css_declarations,
};
pub use application::plugin_registry::{
    plugin_check_all_updates, plugin_search, plugin_semver_has_update, plugin_validate_name,
    plugin_verify_integrity,
};
pub use application::scanner::{
    batch_extract_classes, check_against_safelist, collect_files, extract_classes_from_source,
    generate_sub_component_types, scan_file, scan_workspace,
};
pub use application::state_css::tw_classes_to_css;
pub use application::template_parser::parse_template;
pub use application::tw_merge::{
    build_dependency_chain, tw_merge, tw_merge_many, tw_merge_many_with_separator,
    tw_merge_with_separator,
};

// Domain exports
pub use domain::animation::*;
pub use domain::css_compiler::compile_css;
pub use domain::css_compiler::compile_css_lightning;
pub use domain::css_compiler::process_tailwind_css_lightning;
pub use domain::css_compiler::process_tailwind_css_with_targets;
pub use domain::model::{
    clear_name_registries, property_id_to_string, register_property_name, register_value_name,
    value_id_to_string,
};
pub use domain::theme::*;
pub use domain::transform::{
    has_tw_usage, is_already_transformed, normalise_classes, parse_classes,
};
pub use domain::transform_components::parse_subcomponent_blocks_napi;
pub use domain::variants::{
    build_variant_lookup_key, resolve_simple_variants, resolve_variants, validate_variant_config,
};

// Infrastructure
pub use infrastructure::cache_store::*;

// Interface exports - class extractor
pub use interface::class_extractor::{
    extract_all_classes, has_tw_usage as class_extractor_has_tw,
    is_already_transformed as class_extractor_is_already,
    parse_classes as class_extractor_parse_classes,
};
pub use interface::ffi::*;
