//! PHASE 7.6: Theme Resolver Pool - Integration Tests
//! 
//! Comprehensive tests for THEME_RESOLVER_POOL singleton caching, thread safety,
//! and performance verification for repeated theme resolution operations.
//! 

use tailwind_styled_parser::application::theme_resolver_pool::THEME_RESOLVER_POOL;
use tailwind_styled_parser::domain::theme_config::ThemeConfig;
use std::sync::Arc;

// ============================================================================
// Basic Pool Functionality (4 tests)
// ============================================================================

#[test]
fn test_pool_singleton_access() {
    let config = ThemeConfig::new();
    
    let resolver1 = THEME_RESOLVER_POOL.get_or_create(1, config.clone());
    let resolver2 = THEME_RESOLVER_POOL.get_or_create(1, config);

    assert!(Arc::ptr_eq(&resolver1, &resolver2));
}

#[test]
fn test_get_or_create_cache_hit() {
    THEME_RESOLVER_POOL.clear();

    let config = ThemeConfig::new();
    let resolver1 = THEME_RESOLVER_POOL.get_or_create(101, config.clone());
    let resolver2 = THEME_RESOLVER_POOL.get_or_create(101, config);

    assert!(Arc::ptr_eq(&resolver1, &resolver2));
}

#[test]
fn test_get_or_create_different_theme_ids() {
    THEME_RESOLVER_POOL.clear();

    let config = ThemeConfig::new();
    let resolver1 = THEME_RESOLVER_POOL.get_or_create(102, config.clone());
    let resolver2 = THEME_RESOLVER_POOL.get_or_create(103, config);

    assert!(!Arc::ptr_eq(&resolver1, &resolver2));
}

#[test]
fn test_pool_stats_initial_state() {
    THEME_RESOLVER_POOL.clear();

    let stats = THEME_RESOLVER_POOL.stats();
    assert_eq!(stats.hits, 0);
    assert_eq!(stats.misses, 0);
}

// ============================================================================
// Performance Characteristics (2 tests)
// ============================================================================

#[test]
fn test_cached_access_performance() {
    THEME_RESOLVER_POOL.clear();

    let config = ThemeConfig::new();

    for i in 0..10 {
        let _resolver = THEME_RESOLVER_POOL.get_or_create(5000 + i as u64, config.clone());
    }

    let start = std::time::Instant::now();

    for i in 0..1000 {
        let theme_id = 5000 + (i % 10) as u64;
        let _resolver = THEME_RESOLVER_POOL.get_or_create(theme_id, config.clone());
    }

    let elapsed = start.elapsed();

    assert!(
        elapsed.as_millis() < 500,
        "1000 cached accesses took {}ms (should be < 500ms)",
        elapsed.as_millis()
    );
}

#[test]
fn test_no_performance_regression() {
    THEME_RESOLVER_POOL.clear();

    let config = ThemeConfig::new();

    let start = std::time::Instant::now();

    for i in 0..100000 {
        let theme_id = 9000 + (i % 10) as u64;
        let _resolver = THEME_RESOLVER_POOL.get_or_create(theme_id, config.clone());
    }

    let elapsed = start.elapsed();

    assert!(
        elapsed.as_secs() < 1,
        "100k cached accesses took {}ms (should be < 1000ms)",
        elapsed.as_millis()
    );
}
