/*!
 * Native Rust engine for tailwind-styled.
 *
 * Public API uses a DDD-style layout similar to the monorepo package layers:
 * - `ddd::domain`         => business/core rules
 * - `ddd::application`    => use-cases / orchestration
 * - `ddd::infrastructure` => adapters (parser/cache/watch)
 * - `ddd::interface`      => external boundary (FFI/N-API)
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

/// Domain-Driven Design public layout.
pub mod ddd {
    /// Domain layer: core business capabilities and rules.
    pub mod domain {
        pub use crate::domain::animation;
        pub use crate::domain::css_compiler;
        pub use crate::domain::semantic;
        pub use crate::domain::theme;
        pub use crate::domain::transform;
    }

    /// Application layer: use-case and orchestration services.
    pub mod application {
        pub use crate::application::analyzer;
        pub use crate::application::ast_extract;
        pub use crate::application::css_analysis;
        pub use crate::application::engine;
        pub use crate::application::insights;
        pub use crate::application::optimization;
        pub use crate::application::scanner;
    }

    /// Infrastructure layer: concrete adapter implementations.
    pub mod infrastructure {
        pub use crate::infrastructure::cache_store;
        pub use crate::infrastructure::oxc_api;
        pub use crate::infrastructure::scan_cache_api;
        pub use crate::infrastructure::watch_api;
    }

    /// Interface layer: integration boundaries (FFI / external entrypoints).
    pub mod interface {
        pub use crate::interface::ffi;
    }
}

/// Legacy flat API re-exports (incremental migration path).
///
/// Prefer the new namespaced DDD API above for new code.
pub mod legacy {
    pub use crate::application::analyzer::*;
    pub use crate::application::ast_extract::*;
    pub use crate::application::css_analysis::*;
    pub use crate::application::engine::*;
    pub use crate::application::insights::*;
    pub use crate::application::optimization::*;
    pub use crate::application::scanner::*;
    pub use crate::domain::animation::*;
    pub use crate::domain::css_compiler::*;
    pub use crate::domain::semantic::*;
    pub use crate::domain::theme::*;
    pub use crate::domain::transform::*;
    pub use crate::infrastructure::cache_store::*;
    pub use crate::infrastructure::oxc_api::*;
    pub use crate::infrastructure::scan_cache_api::*;
    pub use crate::infrastructure::watch_api::*;
    pub use crate::interface::ffi::*;
}

// Keep existing flat API surface for compatibility with existing tests/callers.
pub use legacy::*;

#[cfg(test)]
mod tests;
