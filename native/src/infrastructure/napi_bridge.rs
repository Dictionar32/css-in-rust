//! NAPI bridge - Node.js bindings for native CSS compiler
//! 
//! PHASE 7.3: Modularized NAPI Bridge
//! 
//! This file serves as a facade for the modularized NAPI bridge.
//! The actual implementations are split across focused modules:
//! - napi_bridge_types: Shared type definitions
//! - napi_bridge_marshalling: JSON serialization utilities
//! - napi_bridge_errors: Error handling and validation
//! - napi_bridge_css: CSS generation functions (7 functions)
//! - napi_bridge_parsing: Class parsing functions (6 functions)
//! - napi_bridge_theme: Theme resolution functions (7 functions)
//! - napi_bridge_cache: Cache configuration and management (6 functions)
//! - napi_bridge_redis: Redis operations (17 functions)
//! - napi_bridge_analysis: Analysis and memory statistics (5 functions)
//! - napi_bridge_watch: File watch system operations (9 functions)
//!
//! Benefits of this modularization:
//! ✅ Easier to navigate and maintain
//! ✅ Clear separation of concerns
//! ✅ Smaller compilation units
//! ✅ Better code organization
//! ✅ Reduced cognitive load
//! ✅ Total: 57 NAPI functions organized into 7 feature modules

// Session 1: Utility and feature modules (CSS, Parsing, Theme, Cache)
pub use crate::infrastructure::napi_bridge_css::{
    generate_css_native, generate_css, generate_css_batch, 
    compile_to_css, compile_to_css_batch, minify_css,
    process_tailwind_css_lightning, process_tailwind_css_with_targets,
    eliminate_dead_css, optimize_css,
};

pub use crate::infrastructure::napi_bridge_parsing::{
    parse_class, parse_classes, analyze_classes, 
    compile_class_napi, get_parse_stats, clear_parse_cache_napi,
};

pub use crate::infrastructure::napi_bridge_theme::{
    resolve_color, resolve_spacing, resolve_font_size, resolve_breakpoint,
    apply_opacity, clear_theme_cache_napi, get_theme_cache_stats,
};

pub use crate::infrastructure::napi_bridge_cache::{
    configure_cache_backend, get_cache_stats, get_recommended_cache_config,
    clear_all_caches_napi, get_cache_optimization_hints, estimate_streaming_batch_size,
    get_resolver_pool_stats, clear_resolver_pool,
};

// Session 2: Redis, analysis, and watch modules
pub use crate::infrastructure::napi_bridge_redis::{
    redis_pool_connect, redis_set, redis_get, redis_delete,
    redis_mget, redis_mset, redis_exists, redis_expire, redis_ttl,
    redis_pool_stats, redis_flush_db, redis_ping, redis_info,
    redis_cache_clear, redis_enable_cluster, redis_cache_hit_rate,
    redis_monitor, redis_sync_nodes, redis_get_config, redis_shutdown,
};

pub use crate::infrastructure::napi_bridge_analysis::{
    get_week6_features_status, get_memory_stats_native,
    get_memory_recommendations_native, estimate_optimal_cache_config_native,
    reset_memory_stats,
};

pub use crate::infrastructure::napi_bridge_watch::{
    watch_files, stop_watching, get_watch_stats, clear_watch_stats,
    get_watch_events, set_watch_aggregation, get_active_watches,
    set_watch_metrics, get_watch_performance,
};

// Re-export types and utilities
pub use crate::infrastructure::napi_bridge_types::*;
pub use crate::infrastructure::napi_bridge_marshalling::*;
pub use crate::infrastructure::napi_bridge_errors::*;

// Legacy compatibility: maintain old function names
pub use crate::infrastructure::napi_bridge_theme::clear_theme_cache_napi as clear_theme_cache;
