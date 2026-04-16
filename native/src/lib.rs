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
mod oxc_parser_tests;
#[cfg(test)]
mod ast_optimizer_tests;
#[cfg(test)]
mod watcher_tests;
#[cfg(test)]
mod scan_cache_tests;

// Backward-compatible top-level API re-exports
pub use application::analyzer::*;
pub use application::ast_extract::*;
pub use application::engine::*;
pub use application::scanner::*;
pub use domain::animation::*;
pub use domain::css_compiler::*;
pub use domain::theme::*;
pub use domain::transform::*;
pub use infrastructure::cache_store::*;
pub use interface::ffi::*;
