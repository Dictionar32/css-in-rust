pub mod analyzer;
pub mod animate_utils;
pub mod ast_extract;
pub mod atomic;
pub mod atomic_parser;
pub mod cache_resolver;
pub mod cascade_resolver;
pub mod class_parser;  // ✅ Consolidated v2 parser (Phase 7.1: Parser Consolidation - R1)
pub mod class_utils;
pub mod compiler;  // ✅ Phase 3: End-to-end compilation pipeline
pub mod container_query;
pub mod css_analysis;
pub mod css_generator;  // ✅ CSS generation with variant and modifier support
pub mod engine;
pub mod hashing;
pub mod id_registry;
pub mod ir_assembler;
pub mod impact_analysis;
pub mod impact_scorer;
pub mod incremental;
pub mod insights;
pub mod legacy_part;
pub mod optimization;
pub mod plugin_registry;
pub mod scanner;
pub mod services;
pub mod state_css;
pub mod template_parser;
pub mod theme_resolver;  // ✅ Phase 2b: Comprehensive theme value resolution (80+ tests)
pub mod theme_resolver_pool;  // ✅ Phase 7.6: Theme Resolver Caching - Singleton Pool with DashMap (R6)
pub mod tw_merge;
pub mod variant_resolver;  // ✅ Phase 3: Variant to CSS selector/media query resolution
pub mod variant_system;  // ✅ Variant resolution and composition system