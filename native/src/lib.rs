/*!
  * tailwind-styled-v4 ??? Native Rust Engine
 *
 * Exposes the following to Node.js via N-API:
 *   parse_classes           ??? tokenise + parse individual class tokens
 *   has_tw_usage            ??? fast pre-check before running the full transform
 *   is_already_transformed  ??? idempotency guard
 *   transform_source        ??? full compile: extract ??? normalise ??? generate component code
 *   analyze_rsc             ??? detect RSC / "use client" boundary
 *
 * Also exposes C ABI symbols for bindings/ (Go, Swift, ???):
 *   tailwind_compile, tailwind_compile_with_stats,
 *   tailwind_free, tailwind_version, tailwind_clear_cache
 */

mod application;
mod ast_optimizer;
mod domain;
mod infrastructure;
mod interface;
mod oxc_parser;
mod scan_cache;
mod shared;
mod watcher;

pub use application::analyzer::*;
pub use application::ast_extract::*;
pub use application::css_analysis::*;
pub use application::engine::*;
pub use application::insights::*;
pub use application::optimization::*;
pub use application::scanner::*;
pub use domain::animation::*;
pub use domain::css_compiler::*;
pub use domain::semantic::*;
pub use domain::theme::*;
pub use domain::transform::*;
pub use infrastructure::cache_store::*;
pub use infrastructure::oxc_api::*;
pub use infrastructure::scan_cache_api::*;
pub use infrastructure::watch_api::*;
pub use interface::ffi::*;

#[cfg(test)]
mod tests;
