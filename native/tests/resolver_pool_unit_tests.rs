//! Comprehensive unit tests for ThemeResolverPool
//!
//! This test suite provides extensive coverage of the ThemeResolverPool singleton,
//! focusing on:
//! - Resolver instance caching by theme_id
//! - Cache hit/miss statistics tracking
//! - Thread-safe concurrent access patterns
//! - clear() and remove() operations
//! - Pool statistics accuracy
//! - Performance characteristics
//!
//! Tests are organized into logical sections for maintainability and clarity.

use std::sync::Arc;
use std::thread;
use std::sync::Barrier;
use std::time::Instant;

use tailwind_styled_parser::application::theme_resolver_pool::ThemeResolverPool;
use tailwind_styled_parser::domain::theme_config::ThemeConfig;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn create_test_config() -> ThemeConfig {
    ThemeConfig::new()
}

// ============================================================================
// SECTION 1: BASIC POOL FUNCTIONALITY
// ============================================================================
// Tests for basic operations using local pool

#[test]
fn test_pool_basic_access() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let resolver = pool.get_or_create(10001, config);
    
    assert_eq!(pool.len(), 1, "Pool should contain 1 resolver after first access");
    assert!(!pool.is_empty(), "Pool should not be empty");
    let _ = resolver;
}

#[test]
fn test_pool_multiple_resolvers() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r1 = pool.get_or_create(10101, config.clone());
    let _r2 = pool.get_or_create(10102, config.clone());
    let _r3 = pool.get_or_create(10103, config);
    
    assert_eq!(pool.len(), 3, "Pool should have 3 resolvers");
}

#[test]
fn test_get_or_create_first_access_is_miss() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _resolver = pool.get_or_create(11001, config);
    let stats = pool.stats();
    
    assert_eq!(stats.misses, 1, "First access should record a miss");
    assert_eq!(stats.hits, 0, "First access should have 0 hits");
    assert_eq!(stats.total, 1, "First access should have total of 1");
    assert_eq!(stats.hit_rate, 0.0, "Hit rate after first miss should be 0.0");
}

#[test]
fn test_get_or_create_second_access_is_hit() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let resolver1 = pool.get_or_create(11102, config.clone());
    let resolver2 = pool.get_or_create(11102, config);
    let stats = pool.stats();
    
    assert_eq!(stats.misses, 1, "Only first access should be a miss");
    assert_eq!(stats.hits, 1, "Second access should be a hit");
    assert_eq!(stats.total, 2, "Total should be 2");
    
    assert!(Arc::ptr_eq(&resolver1, &resolver2),
        "get_or_create should return same Arc instance for same theme_id");
}

#[test]
fn test_get_or_create_different_theme_ids_different_instances() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let resolver1 = pool.get_or_create(11204, config.clone());
    let resolver2 = pool.get_or_create(11205, config);
    
    assert!(!Arc::ptr_eq(&resolver1, &resolver2),
        "Different theme_ids should produce different Arc instances");
}

// ============================================================================
// SECTION 2: CACHE STATISTICS TRACKING
// ============================================================================

#[test]
fn test_hit_rate_calculation_single_hit() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _resolver1 = pool.get_or_create(12001, config.clone());
    let _resolver2 = pool.get_or_create(12001, config);
    
    let stats = pool.stats();
    assert_eq!(stats.hit_rate, 0.5, "Hit rate with 1 hit and 1 miss should be 0.5");
}

#[test]
fn test_hit_rate_calculation_multiple_hits() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r1 = pool.get_or_create(12101, config.clone());
    for _ in 0..3 {
        let _r = pool.get_or_create(12101, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(stats.misses, 1, "Should have 1 miss");
    assert_eq!(stats.hits, 3, "Should have 3 hits");
    assert_eq!(stats.hit_rate, 0.75, "Hit rate should be 3/(1+3) = 0.75");
}

#[test]
fn test_hit_rate_high_cache_effectiveness() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r = pool.get_or_create(12201, config.clone());
    for _ in 0..99 {
        let _r = pool.get_or_create(12201, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(stats.misses, 1, "Should have 1 miss");
    assert_eq!(stats.hits, 99, "Should have 99 hits");
    assert_eq!(stats.hit_rate, 0.99, "Hit rate should be 99/100 = 0.99");
}

#[test]
fn test_stats_total_calculation() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..5 {
        let _r1 = pool.get_or_create(12300 + i as u64, config.clone());
        let _r2 = pool.get_or_create(12300 + i as u64, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(stats.total, 10, "Total should be 10");
    assert_eq!(stats.total, stats.hits + stats.misses,
        "Total should equal hits + misses");
}

#[test]
fn test_stats_cached_resolvers_count() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..5 {
        let _r = pool.get_or_create(12400 + i as u64, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(stats.cached_resolvers, 5,
        "cached_resolvers should match number of unique theme_ids");
}

#[test]
fn test_stats_accuracy_with_multiple_theme_ids() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r1a = pool.get_or_create(12501, config.clone());
    let _r1b = pool.get_or_create(12501, config.clone());
    
    let _r2a = pool.get_or_create(12502, config.clone());
    let _r2b = pool.get_or_create(12502, config.clone());
    let _r2c = pool.get_or_create(12502, config);
    
    let stats = pool.stats();
    
    assert_eq!(stats.misses, 2, "Should have 2 misses (one per unique theme_id)");
    assert_eq!(stats.hits, 3, "Should have 3 hits");
    assert_eq!(stats.total, 5, "Total should be 5");
    assert_eq!(stats.cached_resolvers, 2, "Should have 2 cached resolvers");
    assert_eq!(stats.hit_rate, 0.6, "Hit rate should be 3/5 = 0.6");
}

// ============================================================================
// SECTION 3: CACHE OPERATIONS
// ============================================================================

#[test]
fn test_clear_removes_all_resolvers() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..10 {
        let _r = pool.get_or_create(13000 + i as u64, config.clone());
    }
    
    assert_eq!(pool.len(), 10, "Pool should have 10 resolvers");
    
    pool.clear();
    
    assert_eq!(pool.len(), 0, "Pool should be empty after clear");
    assert!(pool.is_empty(), "Pool should report is_empty as true");
}

#[test]
fn test_clear_resets_statistics() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..5 {
        let _r1 = pool.get_or_create(13100 + i as u64, config.clone());
        let _r2 = pool.get_or_create(13100 + i as u64, config.clone());
    }
    
    let stats_before = pool.stats();
    assert!(stats_before.hits > 0 || stats_before.misses > 0);
    
    pool.clear();
    
    let stats_after = pool.stats();
    assert_eq!(stats_after.hits, 0, "Hits should be 0 after clear");
    assert_eq!(stats_after.misses, 0, "Misses should be 0 after clear");
    assert_eq!(stats_after.total, 0, "Total should be 0 after clear");
    assert_eq!(stats_after.cached_resolvers, 0, "cached_resolvers should be 0");
}

#[test]
fn test_remove_single_resolver() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r1 = pool.get_or_create(13201, config.clone());
    let _r2 = pool.get_or_create(13202, config);
    
    assert_eq!(pool.len(), 2);
    
    pool.remove(13201);
    
    assert_eq!(pool.len(), 1, "Pool should have 1 resolver after removing 1");
}

#[test]
fn test_remove_specific_resolver_leaves_others() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let r1 = pool.get_or_create(13301, config.clone());
    let r2 = pool.get_or_create(13302, config.clone());
    
    pool.remove(13301);
    
    let r2_after = pool.get_or_create(13302, config);
    assert!(Arc::ptr_eq(&r2, &r2_after),
        "Remaining resolver should still be the same instance");
}

#[test]
fn test_remove_nonexistent_resolver() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r = pool.get_or_create(13401, config);
    let len_before = pool.len();
    
    pool.remove(19999);
    
    assert_eq!(pool.len(), len_before, "Removing nonexistent resolver should not change pool");
}

#[test]
fn test_remove_then_recreate_resolver() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let r1 = pool.get_or_create(13501, config.clone());
    pool.remove(13501);
    let r2 = pool.get_or_create(13501, config);
    
    assert!(!Arc::ptr_eq(&r1, &r2),
        "Recreated resolver should be different instance after remove");
    
    let stats = pool.stats();
    assert_eq!(stats.misses, 2, "Should have 2 misses (initial and after remove)");
}

#[test]
fn test_remove_does_not_reset_statistics() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r1 = pool.get_or_create(13601, config.clone());
    let _r2 = pool.get_or_create(13601, config.clone());
    
    let stats_before = pool.stats();
    assert_eq!(stats_before.misses, 1);
    assert_eq!(stats_before.hits, 1);
    
    pool.remove(13601);
    
    let stats_after = pool.stats();
    assert_eq!(stats_after.misses, 1, "Misses should not change on remove");
    assert_eq!(stats_after.hits, 1, "Hits should not change on remove");
}

#[test]
fn test_reset_stats_keeps_resolvers() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let r1 = pool.get_or_create(13701, config.clone());
    let _r2 = pool.get_or_create(13701, config.clone());
    
    let len_before = pool.len();
    pool.reset_stats();
    let len_after = pool.len();
    
    assert_eq!(len_before, len_after, "reset_stats should not remove resolvers");
    assert_eq!(len_after, 1, "Resolver should still be cached");
    
    let stats = pool.stats();
    assert_eq!(stats.hits, 0, "Hits should be reset");
    assert_eq!(stats.misses, 0, "Misses should be reset");
    assert_eq!(stats.cached_resolvers, 1, "Cached resolver count should not change");
    
    let r3 = pool.get_or_create(13701, config.clone());
    assert!(Arc::ptr_eq(&r1, &r3), "Original resolver should still be cached");
    
    let stats_after = pool.stats();
    assert_eq!(stats_after.hits, 1, "Next access should be a hit");
}

// ============================================================================
// SECTION 4: THREAD-SAFE CONCURRENT ACCESS
// ============================================================================

#[test]
fn test_concurrent_same_theme_id_all_threads_get_same_instance() {
    let pool = Arc::new(ThemeResolverPool::new());
    let config = Arc::new(create_test_config());
    
    let mut handles = vec![];
    
    for _ in 0..20 {
        let config_clone = Arc::clone(&config);
        let pool_clone = Arc::clone(&pool);
        
        let handle = thread::spawn(move || {
            pool_clone.get_or_create(14001, (*config_clone).clone())
        });
        
        handles.push(handle);
    }
    
    let resolvers: Vec<_> = handles.into_iter()
        .map(|h| h.join().unwrap())
        .collect();
    
    for i in 1..resolvers.len() {
        assert!(Arc::ptr_eq(&resolvers[0], &resolvers[i]),
            "Thread {} did not receive same Arc instance", i);
    }
}

#[test]
fn test_concurrent_same_theme_id_statistics_accuracy() {
    let pool = Arc::new(ThemeResolverPool::new());
    let config = Arc::new(create_test_config());
    
    let mut handles = vec![];
    
    for _ in 0..20 {
        let config_clone = Arc::clone(&config);
        let pool_clone = Arc::clone(&pool);
        
        let handle = thread::spawn(move || {
            pool_clone.get_or_create(14101, (*config_clone).clone())
        });
        
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.join().unwrap();
    }
    
    let stats = pool.stats();
    
    assert_eq!(stats.cached_resolvers, 1, "Should have 1 cached resolver");
    assert_eq!(stats.misses, 1, "Should have 1 miss");
    assert_eq!(stats.hits, 19, "Should have 19 hits");
}

#[test]
fn test_concurrent_different_theme_ids_all_cached() {
    let pool = Arc::new(ThemeResolverPool::new());
    let config = Arc::new(create_test_config());
    
    let mut handles = vec![];
    
    for i in 0..15 {
        let config_clone = Arc::clone(&config);
        let pool_clone = Arc::clone(&pool);
        
        let handle = thread::spawn(move || {
            pool_clone.get_or_create(14200 + i as u64, (*config_clone).clone())
        });
        
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.join().unwrap();
    }
    
    let stats = pool.stats();
    
    assert_eq!(stats.cached_resolvers, 15, "Should have 15 cached resolvers");
    assert_eq!(stats.misses, 15, "All should be misses (first access for each ID)");
    assert_eq!(stats.hits, 0, "Should have 0 hits");
}

#[test]
fn test_concurrent_mixed_pattern() {
    let pool = Arc::new(ThemeResolverPool::new());
    let config = Arc::new(create_test_config());
    
    let mut handles = vec![];
    
    for i in 0..30 {
        let config_clone = Arc::clone(&config);
        let pool_clone = Arc::clone(&pool);
        
        let handle = thread::spawn(move || {
            let theme_id = 14300 + (i % 5) as u64;
            pool_clone.get_or_create(theme_id, (*config_clone).clone())
        });
        
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.join().unwrap();
    }
    
    let stats = pool.stats();
    
    assert_eq!(stats.cached_resolvers, 5, "Should have 5 cached resolvers");
    assert_eq!(stats.misses, 5, "Should have 5 misses (one per unique ID)");
    assert_eq!(stats.hits, 25, "Should have 25 hits (30 - 5 misses)");
}

#[test]
fn test_concurrent_high_contention() {
    let pool = Arc::new(ThemeResolverPool::new());
    let config = Arc::new(create_test_config());
    
    let mut handles = vec![];
    
    for _ in 0..100 {
        let config_clone = Arc::clone(&config);
        let pool_clone = Arc::clone(&pool);
        
        let handle = thread::spawn(move || {
            pool_clone.get_or_create(14400, (*config_clone).clone())
        });
        
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.join().unwrap();
    }
    
    let stats = pool.stats();
    
    assert_eq!(stats.cached_resolvers, 1, "Should have 1 cached resolver under high contention");
    assert_eq!(stats.total, 100, "Should have 100 total accesses");
    assert_eq!(stats.misses, 1, "Should have exactly 1 miss");
    assert_eq!(stats.hits, 99, "Should have 99 hits");
}

#[test]
fn test_concurrent_clear_and_access() {
    let pool = Arc::new(ThemeResolverPool::new());
    let config = Arc::new(create_test_config());
    let barrier = Arc::new(Barrier::new(2));
    
    let _r = pool.get_or_create(14500, (*config).clone());
    
    let barrier_clone = Arc::clone(&barrier);
    let pool_clone = Arc::clone(&pool);
    
    let clear_handle = thread::spawn(move || {
        barrier_clone.wait();
        pool_clone.clear();
    });
    
    let config_clone = Arc::clone(&config);
    let pool_clone2 = Arc::clone(&pool);
    let access_handle = thread::spawn(move || {
        barrier.wait();
        pool_clone2.get_or_create(14500, (*config_clone).clone())
    });
    
    let _ = clear_handle.join().unwrap();
    let _ = access_handle.join().unwrap();
    
    let stats = pool.stats();
    assert!(stats.cached_resolvers <= 1, "Pool should have at most 1 resolver");
    assert_eq!(stats.total, stats.hits + stats.misses, "Statistics should be consistent");
}

#[test]
fn test_concurrent_stress_random_operations() {
    let pool = Arc::new(ThemeResolverPool::new());
    let config = Arc::new(create_test_config());
    
    for i in 0..10 {
        let _r = pool.get_or_create(14600 + i as u64, (*config).clone());
    }
    
    let mut handles = vec![];
    
    for i in 0..50 {
        let config_clone = Arc::clone(&config);
        let pool_clone = Arc::clone(&pool);
        
        let handle = thread::spawn(move || {
            let theme_id = 14600 + ((i * 7) % 10) as u64;
            pool_clone.get_or_create(theme_id, (*config_clone).clone())
        });
        
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.join().unwrap();
    }
    
    let stats = pool.stats();
    
    assert_eq!(stats.cached_resolvers, 10, "Should maintain 10 cached resolvers");
    assert_eq!(stats.total, 60, "Total should be 60");
    assert_eq!(stats.total, stats.hits + stats.misses, "Total should equal hits + misses");
}

// ============================================================================
// SECTION 5: PERFORMANCE CHARACTERISTICS
// ============================================================================

#[test]
fn test_first_access_performance_acceptable() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let start = Instant::now();
    let _r = pool.get_or_create(15001, config);
    let elapsed = start.elapsed();
    
    assert!(elapsed.as_millis() < 500,
        "First access took {}ms, should be < 500ms", elapsed.as_millis());
}

#[test]
fn test_cache_hit_performance_is_fast() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r = pool.get_or_create(15101, config.clone());
    
    let start = Instant::now();
    for _ in 0..1000 {
        let _r = pool.get_or_create(15101, config.clone());
    }
    let elapsed = start.elapsed();
    
    assert!(elapsed.as_millis() < 500,
        "1000 cache hits took {}ms, should be < 500ms", elapsed.as_millis());
}

#[test]
fn test_multiple_resolver_access_performance() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..10 {
        let _r = pool.get_or_create(15200 + i as u64, config.clone());
    }
    
    let start = Instant::now();
    for i in 0..1000 {
        let theme_id = 15200 + (i % 10) as u64;
        let _r = pool.get_or_create(theme_id, config.clone());
    }
    let elapsed = start.elapsed();
    
    assert!(elapsed.as_millis() < 500,
        "1000 accesses to 10 resolvers took {}ms, should be < 500ms", elapsed.as_millis());
}

#[test]
fn test_concurrent_access_performance() {
    let pool = Arc::new(ThemeResolverPool::new());
    let config = Arc::new(create_test_config());
    
    for i in 0..5 {
        let _r = pool.get_or_create(15300 + i as u64, (*config).clone());
    }
    
    let start = Instant::now();
    
    let mut handles = vec![];
    
    for thread_id in 0..20 {
        let config_clone = Arc::clone(&config);
        let pool_clone = Arc::clone(&pool);
        
        let handle = thread::spawn(move || {
            for i in 0..100 {
                let theme_id = 15300 + ((thread_id + i) % 5) as u64;
                let _r = pool_clone.get_or_create(theme_id, (*config_clone).clone());
            }
        });
        
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.join().unwrap();
    }
    
    let elapsed = start.elapsed();
    
    assert!(elapsed.as_secs() < 5,
        "2000 concurrent accesses took {}s, should be < 5s", elapsed.as_secs_f64());
}

// ============================================================================
// SECTION 6: EDGE CASES AND BOUNDARY CONDITIONS
// ============================================================================

#[test]
fn test_zero_hits_zero_misses_hit_rate_is_zero() {
    let pool = ThemeResolverPool::new();
    let stats = pool.stats();
    assert_eq!(stats.hit_rate, 0.0, "Hit rate should be 0.0 when no accesses");
}

#[test]
fn test_all_hits_no_misses_after_reset() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let _r = pool.get_or_create(16001, config.clone());
    pool.reset_stats();
    
    for _ in 0..100 {
        let _r = pool.get_or_create(16001, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(stats.misses, 0, "All should be hits after reset");
    assert_eq!(stats.hit_rate, 1.0, "Hit rate should be 1.0 (100%)");
}

#[test]
fn test_theme_id_zero_valid() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let r1 = pool.get_or_create(0, config.clone());
    let r2 = pool.get_or_create(0, config);
    
    assert!(Arc::ptr_eq(&r1, &r2), "theme_id = 0 should work correctly");
}

#[test]
fn test_large_theme_id_valid() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    let r1 = pool.get_or_create(u64::MAX, config.clone());
    let r2 = pool.get_or_create(u64::MAX, config);
    
    assert!(Arc::ptr_eq(&r1, &r2), "Very large theme_id should work correctly");
}

#[test]
fn test_large_number_of_unique_resolvers() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..1000 {
        let _r = pool.get_or_create(17000 + i as u64, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(stats.cached_resolvers, 1000, "Should support 1000 unique resolvers");
}

#[test]
fn test_clear_empty_pool() {
    let pool = ThemeResolverPool::new();
    pool.clear();
    assert_eq!(pool.len(), 0);
}

#[test]
fn test_remove_from_empty_pool() {
    let pool = ThemeResolverPool::new();
    pool.remove(29999);
    assert_eq!(pool.len(), 0);
}

#[test]
fn test_reset_stats_on_empty_pool() {
    let pool = ThemeResolverPool::new();
    pool.reset_stats();
    let stats = pool.stats();
    assert_eq!(stats.hits, 0);
    assert_eq!(stats.misses, 0);
}

// ============================================================================
// SECTION 7: STATISTICAL INVARIANTS
// ============================================================================

#[test]
fn test_invariant_total_equals_hits_plus_misses() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..10 {
        for _ in 0..5 {
            let _r = pool.get_or_create(18000 + i as u64, config.clone());
        }
    }
    
    let stats = pool.stats();
    assert_eq!(stats.total, stats.hits + stats.misses, "Invariant: total == hits + misses");
}

#[test]
fn test_invariant_cached_resolvers_matches_unique_ids() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    let mut accessed_ids = std::collections::HashSet::new();
    
    for i in 0..15 {
        let id = 18100 + (i % 8) as u64;
        accessed_ids.insert(id);
        let _r = pool.get_or_create(id, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(stats.cached_resolvers as usize, accessed_ids.len(),
        "Invariant: cached_resolvers == number of unique theme_ids");
}

#[test]
fn test_invariant_hit_rate_in_valid_range() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..20 {
        for _ in 0..10 {
            let _r = pool.get_or_create(18200 + i as u64, config.clone());
        }
    }
    
    let stats = pool.stats();
    assert!(stats.hit_rate >= 0.0 && stats.hit_rate <= 1.0,
        "Invariant: 0.0 <= hit_rate <= 1.0, got {}", stats.hit_rate);
}

#[test]
fn test_invariant_len_matches_stats_cached_resolvers() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..12 {
        let _r = pool.get_or_create(18300 + i as u64, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(pool.len(), stats.cached_resolvers,
        "Invariant: pool.len() == stats.cached_resolvers");
}

// ============================================================================
// SECTION 8: CONFIGURATION ISOLATION
// ============================================================================

#[test]
fn test_different_configs_with_same_theme_id() {
    let pool = ThemeResolverPool::new();
    let config1 = create_test_config();
    let config2 = create_test_config();
    
    let r1 = pool.get_or_create(19001, config1);
    let r2 = pool.get_or_create(19001, config2);
    
    assert!(Arc::ptr_eq(&r1, &r2), "Should return cached resolver regardless of config parameter");
}

#[test]
fn test_stats_consistency_after_multiple_operations() {
    let pool = ThemeResolverPool::new();
    let config = create_test_config();
    
    for i in 0..5 {
        let _r = pool.get_or_create(19100 + i as u64, config.clone());
    }
    
    pool.reset_stats();
    
    for _ in 0..20 {
        let _r = pool.get_or_create(19100, config.clone());
    }
    
    let stats = pool.stats();
    assert_eq!(stats.hits, 20, "Should have exactly 20 hits after reset and accesses");
    assert_eq!(stats.misses, 0, "Should have 0 misses after reset");
}
