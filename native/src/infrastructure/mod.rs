pub mod adapters; // PHASE 7.2: Cache backend adapters
pub mod cache_store;
pub mod cache;
pub mod lru_cache;
pub mod lazy_cache;
pub mod streaming_compiler;
pub mod adaptive_cache;
pub mod week6_api;
pub mod week8_api;
pub mod napi_bridge;
pub mod oxc_api;
pub mod scan_cache_api;
pub mod watch_api;
pub mod memory_profiler;
pub mod persistent_cache;
pub mod distributed_cache;
pub mod cache_analytics;
pub mod redis_cache;
pub mod redis_distributed;

// PHASE 6 OPTIMIZATION: Lock-free atomic operations
pub mod atomic_watch_state;
pub mod atomic_cache_stats;

// PHASE 7.2: Unified cache abstraction layer
pub mod cache_backend;

// PHASE 7.3: NAPI Bridge Modularization - Utility modules
pub mod napi_bridge_types;
pub mod napi_bridge_marshalling;
pub mod napi_bridge_errors;

// PHASE 7.3: NAPI Bridge Modularization - Feature modules (Session 1)
pub mod napi_bridge_css;
pub mod napi_bridge_parsing;
pub mod napi_bridge_theme;
pub mod napi_bridge_cache;

// PHASE 7.3: NAPI Bridge Modularization - Feature modules (Session 2)
pub mod napi_bridge_redis;
pub mod napi_bridge_analysis;
pub mod napi_bridge_watch;

// Re-export for easy access
pub use atomic_watch_state::*;
pub use atomic_cache_stats::*;
pub use cache_backend::{CacheBackend, CacheFactory, CacheConfig, CacheStats};
pub use napi_bridge_types::{CssRule, ParseResult, ThemeValue, CacheStats as NapiBridgeCacheStats, JsonResponse, CacheConfig as NapiBridgeCacheConfig};
pub use napi_bridge_marshalling::*;
pub use napi_bridge_errors::*;
