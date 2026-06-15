//! PHASE 7.6: Property-Based Testing - Resolver Pool Behavior
//! 
//! Property 7: Theme Resolver Pool Instance Reuse
//! ===============================================
//! 
//! Statement: For a given theme_id, get_or_create() MUST return the same Arc instance
//! on repeated calls within the same pool, achieving cache efficiency.
//! 
//! Formally: ∀ theme_id: u64, config: ThemeConfig, n > 1
//!   let resolver1 = pool.get_or_create(theme_id, config)
//!   let resolver2 = pool.get_or_create(theme_id, config)
//!   let resolver3 = pool.get_or_create(theme_id, config)
//!   → Arc::ptr_eq(resolver1, resolver2) ∧ Arc::ptr_eq(resolver2, resolver3)
//!   ∧ pool.stats().hits = n - 1
//!   ∧ pool.stats().misses = 1
//! 
//! This property ensures that:
//! - Pool correctly identifies duplicate theme_ids
//! - Instances are reused efficiently (no unnecessary allocations)
//! - Statistics accurately track hits and misses
//! - Concurrent access with same theme_id gets same instance
//! - Arc pointer identity proves instance reuse
//! 
//! Edge Cases to Discover:
//! - Random theme_ids (should get different instances)
//! - Concurrent access to same theme_id (all get same instance)
//! - Concurrent access to different theme_ids (get different instances)
//! - Large numbers of unique theme_ids
//! - Rapid repeated access patterns
//! - Statistics accuracy under load
//!
//! Test Strategy:
//! - Generate 100+ random theme_ids
//! - For each theme_id, call get_or_create() multiple times (2-50)
//! - Verify Arc::ptr_eq for all returned instances (same instance)
//! - Verify pool statistics match expectations (1 miss, n-1 hits)
//! - Test concurrent patterns with same and different theme_ids
//! - Use proptest shrinking to find minimal counterexamples
//! 

use proptest::prelude::*;
use std::sync::Arc;
use std::thread;

use tailwind_styled_parser::application::theme_resolver_pool::ThemeResolverPool;
use tailwind_styled_parser::domain::theme_config::ThemeConfig;

// Strategy for generating theme_ids (positive integers)
fn theme_id_strategy() -> impl Strategy<Value = u64> {
    1u64..1_000_000
}

// Helper to create a valid ThemeConfig for testing
fn create_test_theme_config() -> ThemeConfig {
    ThemeConfig::new()
}

// ============================================================================
// PROPERTY 7: Resolver Pool Returns Same Instance for Same Theme ID
// ============================================================================

proptest! {
    #![proptest_config(ProptestConfig::with_cases(100))]

    /// Property: Sequential access to same theme_id returns same Arc instance
    /// 
    /// Verifies the core pool behavior: multiple get_or_create() calls with the same
    /// theme_id MUST return the exact same Arc instance (pointer equality).
    /// This is crucial for pool efficiency - we reuse instances, not copy them.
    #[test]
    fn prop_pool_same_instance_sequential(
        theme_id in theme_id_strategy(),
        num_accesses in 2usize..50,
    ) {
        let pool = ThemeResolverPool::new();
        let config = create_test_theme_config();
        
        // First access - creates resolver
        let resolver1 = pool.get_or_create(theme_id, config.clone());
        let ptr1 = Arc::as_ptr(&resolver1);
        
        // Subsequent accesses - should return same Arc instance
        let mut all_same = true;
        for _ in 1..num_accesses {
            let resolver_n = pool.get_or_create(theme_id, config.clone());
            let ptr_n = Arc::as_ptr(&resolver_n);
            
            if ptr1 != ptr_n {
                all_same = false;
                break;
            }
        }
        
        prop_assert!(
            all_same,
            "Pool did not return same instance for repeated theme_id access"
        );
    }

    /// Property: Statistics reflect correct hit/miss ratio
    /// 
    /// Verifies that pool statistics accurately track access patterns.
    /// For n accesses to same theme_id: 1 miss (first creation) + (n-1) hits.
    #[test]
    fn prop_pool_stats_accuracy(
        theme_id in theme_id_strategy(),
        num_accesses in 2usize..50,
    ) {
        let pool = ThemeResolverPool::new();
        let config = create_test_theme_config();
        
        // Perform accesses
        for _ in 0..num_accesses {
            pool.get_or_create(theme_id, config.clone());
        }
        
        let stats = pool.stats();
        
        // Expected: 1 miss, (num_accesses - 1) hits
        prop_assert_eq!(
            stats.misses, 1,
            "Expected exactly 1 miss for first access"
        );
        prop_assert_eq!(
            stats.hits, (num_accesses - 1) as u64,
            "Expected {} hits for {} total accesses",
            num_accesses - 1,
            num_accesses
        );
        
        // Hit rate should be (n-1) / n
        let expected_hit_rate = (num_accesses - 1) as f64 / num_accesses as f64;
        prop_assert!((stats.hit_rate - expected_hit_rate).abs() < 0.0001);
    }

    /// Property: Different theme_ids get different instances
    /// 
    /// Ensures that the pool correctly distinguishes between theme_ids.
    /// Different theme_ids MUST result in different Arc instances.
    #[test]
    fn prop_pool_different_instances_for_different_ids(
        id1 in theme_id_strategy(),
        id2 in theme_id_strategy(),
    ) {
        prop_assume!(id1 != id2, "IDs must be different for this test");
        
        let pool = ThemeResolverPool::new();
        let config = create_test_theme_config();
        
        let resolver1 = pool.get_or_create(id1, config.clone());
        let resolver2 = pool.get_or_create(id2, config.clone());
        
        let ptr1 = Arc::as_ptr(&resolver1);
        let ptr2 = Arc::as_ptr(&resolver2);
        
        prop_assert_ne!(
            ptr1, ptr2,
            "Different theme_ids must result in different Arc instances"
        );
    }

    /// Property: Cache size reflects number of unique theme_ids
    /// 
    /// Verifies that the pool's cached_resolvers count matches the number
    /// of unique theme_ids that have been added.
    #[test]
    fn prop_pool_size_reflects_unique_ids(
        ids_vec in prop::collection::vec(theme_id_strategy(), 1..100)
    ) {
        let pool = ThemeResolverPool::new();
        let config = create_test_theme_config();
        let unique_count = ids_vec.iter().collect::<std::collections::HashSet<_>>().len();
        
        // Add all IDs to pool
        for id in ids_vec.iter() {
            pool.get_or_create(*id, config.clone());
        }
        
        let stats = pool.stats();
        
        prop_assert_eq!(
            stats.cached_resolvers, unique_count,
            "Cache size should match number of unique theme_ids"
        );
    }

    /// Property: Concurrent accesses with same theme_id all get same instance
    /// 
    /// This is a critical property for thread safety. When multiple threads
    /// simultaneously request the same theme_id, they MUST all get the same
    /// Arc instance (pointer equality).
    #[test]
    fn prop_pool_concurrent_same_id(
        theme_id in theme_id_strategy(),
        num_threads in 2usize..20,
    ) {
        let pool = Arc::new(ThemeResolverPool::new());
        let config = create_test_theme_config();
        let shared_config = Arc::new(config);
        
        // Collect pointers from all threads as usize
        let pointers = Arc::new(std::sync::Mutex::new(Vec::new()));
        let mut handles = vec![];
        
        for _ in 0..num_threads {
            let config_clone = Arc::clone(&shared_config);
            let ptrs_clone = Arc::clone(&pointers);
            let pool_clone = Arc::clone(&pool);
            
            let handle = thread::spawn(move || {
                let resolver = pool_clone.get_or_create(
                    theme_id,
                    (*config_clone).clone()
                );
                let ptr = Arc::as_ptr(&resolver) as usize;
                ptrs_clone.lock().unwrap().push(ptr);
            });
            
            handles.push(handle);
        }
        
        // Wait for all threads
        for handle in handles {
            handle.join().unwrap();
        }
        
        let ptrs = pointers.lock().unwrap();
        
        // All pointers should be identical
        if let Some(first_ptr) = ptrs.first() {
            for ptr in ptrs.iter() {
                prop_assert_eq!(
                    *ptr, *first_ptr,
                    "All concurrent accesses to same theme_id must return same Arc instance"
                );
            }
        }
    }

    /// Property: Concurrent accesses with different theme_ids get different instances
    /// 
    /// Ensures that concurrent access to different theme_ids correctly creates
    /// and maintains separate instances for each.
    #[test]
    fn prop_pool_concurrent_different_ids(
        ids_vec in prop::collection::vec(theme_id_strategy(), 2..20)
    ) {
        // Ensure all IDs are unique
        let ids: Vec<u64> = ids_vec.iter()
            .collect::<std::collections::HashSet<_>>()
            .iter()
            .map(|&&id| id)
            .collect();
        
        prop_assume!(ids.len() >= 2, "Need at least 2 unique IDs");
        
        let pool = Arc::new(ThemeResolverPool::new());
        let config = create_test_theme_config();
        let shared_config = Arc::new(config);
        let ids_shared = Arc::new(ids.clone());
        
        // Each thread accesses a different theme_id
        let pointers = Arc::new(std::sync::Mutex::new(Vec::new()));
        let mut handles = vec![];
        
        for (idx, &id) in ids_shared.iter().enumerate() {
            let config_clone = Arc::clone(&shared_config);
            let ptrs_clone = Arc::clone(&pointers);
            let pool_clone = Arc::clone(&pool);
            
            let handle = thread::spawn(move || {
                let resolver = pool_clone.get_or_create(id, (*config_clone).clone());
                let ptr = Arc::as_ptr(&resolver) as usize;
                ptrs_clone.lock().unwrap().push((idx, ptr));
            });
            
            handles.push(handle);
        }
        
        // Wait for all threads
        for handle in handles {
            handle.join().unwrap();
        }
        
        let ptrs = pointers.lock().unwrap();
        
        // All pointers should be different
        for i in 0..ptrs.len() {
            for j in (i + 1)..ptrs.len() {
                prop_assert_ne!(
                    ptrs[i].1, ptrs[j].1,
                    "Different theme_ids (at indices {} and {}) must have different instances",
                    ptrs[i].0, ptrs[j].0
                );
            }
        }
    }

    /// Property: Rapid sequential accesses maintain consistency
    /// 
    /// Verifies that the pool behaves correctly under rapid-fire access patterns,
    /// which might stress the synchronization mechanisms.
    #[test]
    fn prop_pool_rapid_access(
        theme_id in theme_id_strategy(),
        num_rapid in 10usize..1000,
    ) {
        let pool = ThemeResolverPool::new();
        let config = create_test_theme_config();
        let first_ptr = Arc::as_ptr(&pool.get_or_create(theme_id, config.clone()));
        
        // Rapid accesses
        let mut all_same = true;
        for _ in 0..num_rapid {
            let resolver = pool.get_or_create(theme_id, config.clone());
            if Arc::as_ptr(&resolver) != first_ptr {
                all_same = false;
                break;
            }
        }
        
        prop_assert!(all_same, "Rapid accesses should all return same instance");
        
        // Verify stats
        let stats = pool.stats();
        prop_assert_eq!(stats.misses, 1, "Should have exactly 1 miss");
        prop_assert_eq!(stats.hits, num_rapid as u64, "Should have {} hits", num_rapid);
    }
}

// ============================================================================
// TARGETED TESTS FOR EDGE CASES
// ============================================================================

#[test]
fn test_edge_case_zero_theme_id() {
    let pool = ThemeResolverPool::new();
    let config = create_test_theme_config();
    let resolver1 = pool.get_or_create(0, config.clone());
    let resolver2 = pool.get_or_create(0, config.clone());
    
    assert_eq!(
        Arc::as_ptr(&resolver1),
        Arc::as_ptr(&resolver2),
        "Theme ID 0 should return same instance"
    );
}

#[test]
fn test_edge_case_max_theme_id() {
    let pool = ThemeResolverPool::new();
    let config = create_test_theme_config();
    let max_id = u64::MAX;
    
    let resolver1 = pool.get_or_create(max_id, config.clone());
    let resolver2 = pool.get_or_create(max_id, config.clone());
    
    assert_eq!(
        Arc::as_ptr(&resolver1),
        Arc::as_ptr(&resolver2),
        "Max u64 theme_id should return same instance"
    );
}

#[test]
fn test_edge_case_sequential_ids() {
    let pool = ThemeResolverPool::new();
    let config = create_test_theme_config();
    
    // Access sequential IDs
    let resolver1 = pool.get_or_create(1, config.clone());
    let resolver2 = pool.get_or_create(2, config.clone());
    let resolver3 = pool.get_or_create(3, config.clone());
    
    // All should be different instances
    assert_ne!(Arc::as_ptr(&resolver1), Arc::as_ptr(&resolver2));
    assert_ne!(Arc::as_ptr(&resolver2), Arc::as_ptr(&resolver3));
    assert_ne!(Arc::as_ptr(&resolver1), Arc::as_ptr(&resolver3));
    
    // Accessing again should return same instances
    let resolver1_repeat = pool.get_or_create(1, config.clone());
    assert_eq!(Arc::as_ptr(&resolver1), Arc::as_ptr(&resolver1_repeat));
}

#[test]
fn test_hit_rate_precision() {
    let pool = ThemeResolverPool::new();
    let config = create_test_theme_config();
    
    // Create exact scenario: 1 miss, 9 hits = 90% hit rate
    for _ in 0..10 {
        pool.get_or_create(42, config.clone());
    }
    
    let stats = pool.stats();
    
    assert_eq!(stats.misses, 1);
    assert_eq!(stats.hits, 9);
    assert!((stats.hit_rate - 0.9).abs() < 0.0001);
}

#[test]
fn test_multiple_unique_ids_independent() {
    let pool = ThemeResolverPool::new();
    let config = create_test_theme_config();
    
    // Access three unique IDs multiple times each
    for _ in 0..5 {
        pool.get_or_create(100, config.clone());
        pool.get_or_create(200, config.clone());
        pool.get_or_create(300, config.clone());
    }
    
    let stats = pool.stats();
    
    // Expected: 3 misses (one per unique ID), 12 hits (5*3 - 3)
    assert_eq!(stats.misses, 3, "Should have 3 misses for 3 unique IDs");
    assert_eq!(stats.hits, 12, "Should have 12 hits (5 accesses each - 1 miss each)");
    assert_eq!(stats.cached_resolvers, 3);
}

// ============================================================================
// VALIDATES: Requirements R6
// ============================================================================
//
// **Validates: Requirements R6 (Theme Resolver Caching)**
// 
// This property test suite validates that the ThemeResolverPool correctly
// implements instance caching and reuse, achieving the core performance
// benefit of R6: 10-50x improvement for repeated compilations with cached themes.
//
// The properties tested are:
// 1. Sequential instance reuse (same theme_id → same instance)
// 2. Statistics accuracy (hits/misses correctly tracked)
// 3. Instance isolation (different theme_ids → different instances)
// 4. Pool sizing (cache size = unique theme_ids)
// 5. Concurrent consistency (multiple threads → same instance)
// 6. Concurrent isolation (multiple threads, different IDs → different instances)
// 7. Rapid access resilience (high-frequency access maintains consistency)
//
// All properties use 100+ iterations with automatically generated test cases,
// providing comprehensive coverage of the resolver pool behavior.
