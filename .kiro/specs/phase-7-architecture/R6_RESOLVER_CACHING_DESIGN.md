# Phase 7 R6 - Theme Resolver Caching Testing & Benchmarking Design

**Status:** Design Phase (Before Implementation)  
**Target:** Session 4-5  
**Current Status:** R6.1-R6.3 COMPLETE, need testing & benchmarks  

---

## Overview

Complete R6 (Theme Resolver Caching) by implementing tests and benchmarks for the ThemeResolverPool singleton.

**Already Completed:**
- ✅ R6.1: `native/src/application/theme_resolver_pool.rs` - ThemeResolverPool singleton
- ✅ R6.2: Thread-safe caching with DashMap
- ✅ R6.3: NAPI bridge updated to use resolver pool

**Need to Complete:**
- R6.4: Unit tests for resolver pool
- R6.5: Benchmark (cached vs non-cached)
- R6.6: Property test for pool behavior
- R6.7: Integrate pool stats into monitoring
- R6.8: Verify backward compatibility & performance

---

## R6.4: Unit Tests for Resolver Pool

**File:** NEW `native/tests/resolver_pool_unit_tests.rs`

**Purpose:** Test resolver pool caching, thread safety, and statistics

### Design: Test Structure

```rust
#[cfg(test)]
mod resolver_pool_tests {
    use theme_resolver_pool::*;
    use std::sync::Arc;
    use std::thread;
    
    // ========================================
    // TEST CATEGORY 1: Basic Caching
    // ========================================
    
    #[test]
    fn test_get_or_create_returns_resolver() {
        let pool = ThemeResolverPool::get();
        
        let theme_id = "default";
        let resolver1 = pool.get_or_create(theme_id)?;
        
        // Should return a valid resolver
        assert!(!resolver1.is_empty());
        assert_eq!(resolver1.theme_id, theme_id);
    }
    
    #[test]
    fn test_get_or_create_returns_same_instance() {
        let pool = ThemeResolverPool::get();
        
        let theme_id = "primary";
        let resolver1 = pool.get_or_create(theme_id)?;
        let resolver2 = pool.get_or_create(theme_id)?;
        
        // Should return same instance (same pointer)
        assert_eq!(Arc::as_ptr(&resolver1), Arc::as_ptr(&resolver2));
    }
    
    #[test]
    fn test_get_or_create_different_theme_ids() {
        let pool = ThemeResolverPool::get();
        
        let resolver_default = pool.get_or_create("default")?;
        let resolver_alt = pool.get_or_create("alternative")?;
        
        // Different theme IDs should return different instances
        assert_ne!(
            Arc::as_ptr(&resolver_default),
            Arc::as_ptr(&resolver_alt)
        );
    }
    
    // ========================================
    // TEST CATEGORY 2: Statistics Tracking
    // ========================================
    
    #[test]
    fn test_stats_tracks_hits_and_misses() {
        let pool = ThemeResolverPool::get();
        
        // Clear pool before test
        pool.clear();
        
        // First call: miss
        let _resolver1 = pool.get_or_create("stats-test")?;
        
        // Subsequent calls: hits
        let _resolver2 = pool.get_or_create("stats-test")?;
        let _resolver3 = pool.get_or_create("stats-test")?;
        
        let stats = pool.stats();
        
        // Verify stats
        assert_eq!(stats.misses, 1, "Expected 1 miss");
        assert_eq!(stats.hits, 2, "Expected 2 hits");
        assert_eq!(stats.size, 1, "Expected 1 cached resolver");
    }
    
    #[test]
    fn test_stats_cache_size() {
        let pool = ThemeResolverPool::get();
        pool.clear();
        
        // Create multiple resolvers
        pool.get_or_create("theme1")?;
        pool.get_or_create("theme2")?;
        pool.get_or_create("theme3")?;
        
        let stats = pool.stats();
        
        assert_eq!(stats.size, 3, "Expected 3 cached resolvers");
    }
    
    #[test]
    fn test_stats_hit_rate() {
        let pool = ThemeResolverPool::get();
        pool.clear();
        
        // Populate
        pool.get_or_create("t1")?;
        pool.get_or_create("t2")?;
        pool.get_or_create("t3")?;
        
        // Create hits
        pool.get_or_create("t1")?;  // hit
        pool.get_or_create("t1")?;  // hit
        pool.get_or_create("t2")?;  // hit
        
        let stats = pool.stats();
        
        // 3 misses (initial), 3 hits
        let hit_rate = stats.hits as f64 / (stats.hits + stats.misses) as f64;
        assert!(hit_rate > 0.5);  // > 50% hit rate
    }
    
    // ========================================
    // TEST CATEGORY 3: Clear & Remove Operations
    // ========================================
    
    #[test]
    fn test_clear_removes_all_resolvers() {
        let pool = ThemeResolverPool::get();
        
        // Populate
        pool.get_or_create("t1")?;
        pool.get_or_create("t2")?;
        
        let stats_before = pool.stats();
        assert!(stats_before.size > 0);
        
        // Clear
        pool.clear();
        
        let stats_after = pool.stats();
        assert_eq!(stats_after.size, 0, "Pool should be empty after clear");
    }
    
    #[test]
    fn test_remove_specific_resolver() {
        let pool = ThemeResolverPool::get();
        pool.clear();
        
        pool.get_or_create("keep")?;
        pool.get_or_create("remove")?;
        
        let size_before = pool.stats().size;
        
        pool.remove("remove");
        
        let size_after = pool.stats().size;
        assert_eq!(size_after, size_before - 1);
    }
    
    // ========================================
    // TEST CATEGORY 4: Thread Safety
    // ========================================
    
    #[test]
    fn test_concurrent_get_or_create() {
        let pool = Arc::new(ThemeResolverPool::get());
        
        let mut handles = vec![];
        
        // Spawn 10 threads, each accessing different theme_ids
        for i in 0..10 {
            let pool_clone = Arc::clone(&pool);
            let handle = thread::spawn(move || {
                let theme_id = format!("theme_{}", i);
                pool_clone.get_or_create(&theme_id)?;
                Ok::<_, Box<dyn std::error::Error>>(())
            });
            handles.push(handle);
        }
        
        // Wait for all threads
        for handle in handles {
            handle.join().unwrap().unwrap();
        }
        
        // Verify all resolvers cached
        let stats = pool.stats();
        assert_eq!(stats.size, 10);
    }
    
    #[test]
    fn test_concurrent_same_theme_id() {
        let pool = Arc::new(ThemeResolverPool::get());
        pool.clear();
        
        let mut handles = vec![];
        
        // Spawn 10 threads, all accessing same theme_id
        for _ in 0..10 {
            let pool_clone = Arc::clone(&pool);
            let handle = thread::spawn(move || {
                pool_clone.get_or_create("shared")?;
                Ok::<_, Box<dyn std::error::Error>>(())
            });
            handles.push(handle);
        }
        
        // Wait for all threads
        for handle in handles {
            handle.join().unwrap().unwrap();
        }
        
        // Verify only 1 resolver cached (deduped)
        let stats = pool.stats();
        assert_eq!(stats.size, 1);
        
        // Verify hits (9 concurrent threads getting same resolver)
        assert_eq!(stats.hits, 9);
    }
    
    // ========================================
    // TEST CATEGORY 5: Resolver Functionality
    // ========================================
    
    #[test]
    fn test_cached_resolver_resolves_colors() {
        let pool = ThemeResolverPool::get();
        
        let resolver = pool.get_or_create("default")?;
        let color = resolver.resolve_color("blue")?;
        
        assert!(!color.is_empty());
    }
    
    #[test]
    fn test_cached_resolver_resolves_spacing() {
        let pool = ThemeResolverPool::get();
        
        let resolver = pool.get_or_create("default")?;
        let spacing = resolver.resolve_spacing("4")?;
        
        assert!(!spacing.is_empty());
    }
    
    #[test]
    fn test_cached_resolver_resolves_font_size() {
        let pool = ThemeResolverPool::get();
        
        let resolver = pool.get_or_create("default")?;
        let size = resolver.resolve_font_size("lg")?;
        
        assert!(!size.is_empty());
    }
    
    // ========================================
    // TEST CATEGORY 6: Memory Management
    // ========================================
    
    #[test]
    fn test_pool_memory_bounded() {
        let pool = ThemeResolverPool::get();
        pool.clear();
        
        // Create many resolvers (should be bounded by config or OS)
        for i in 0..100 {
            let theme_id = format!("theme_{}", i);
            pool.get_or_create(&theme_id).ok();  // Ignore errors
        }
        
        let stats = pool.stats();
        
        // Memory should be bounded (at most 100, realistically configured lower)
        assert!(stats.size <= 100);
    }
    
    #[test]
    fn test_remove_frees_memory() {
        let pool = ThemeResolverPool::get();
        pool.clear();
        
        // Create resolver
        pool.get_or_create("memory_test")?;
        let before = pool.stats().size;
        
        // Remove
        pool.remove("memory_test");
        let after = pool.stats().size;
        
        assert!(after < before);
    }
}
```

**Test Count:** ~25 unit tests
**Coverage:** Caching, statistics, thread safety, functionality, memory

---

## R6.5: Benchmark (Cached vs Non-Cached)

**File:** NEW `native/benches/theme_resolver_cache_bench.rs`

**Purpose:** Measure performance improvement from resolver pool

### Design: Benchmark Structure

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use theme_resolver_pool::*;

fn benchmark_non_cached(c: &mut Criterion) {
    c.bench_function("resolver_non_cached_1000_ops", |b| {
        b.iter(|| {
            // Create new resolver each time (no caching)
            for i in 0..1000 {
                let theme_id = format!("theme_{}", i % 10);
                let resolver = create_resolver(&theme_id);  // Creates new instance
                
                // Do some work
                black_box(resolver.resolve_color("blue"));
                black_box(resolver.resolve_spacing("4"));
            }
        });
    });
}

fn benchmark_cached(c: &mut Criterion) {
    c.bench_function("resolver_cached_1000_ops", |b| {
        b.iter(|| {
            let pool = ThemeResolverPool::get();
            
            // Use pool (same resolvers reused for theme_0...theme_9)
            for i in 0..1000 {
                let theme_id = format!("theme_{}", i % 10);
                let resolver = pool.get_or_create(&theme_id).unwrap();
                
                // Same work
                black_box(resolver.resolve_color("blue"));
                black_box(resolver.resolve_spacing("4"));
            }
        });
    });
}

fn benchmark_repeated_compile(c: &mut Criterion) {
    // Simulate repeated compilations of same theme
    
    c.bench_function("compile_no_cache_10x", |b| {
        b.iter(|| {
            for _ in 0..10 {
                let resolver = create_resolver("default");  // New each time
                
                // Simulate compilation
                black_box(compile_classes(vec!["text-blue-500", "p-4", "hover:bg-red-500"], &resolver));
            }
        });
    });
    
    c.bench_function("compile_with_cache_10x", |b| {
        b.iter(|| {
            let pool = ThemeResolverPool::get();
            
            for _ in 0..10 {
                let resolver = pool.get_or_create("default").unwrap();
                
                // Simulate compilation
                black_box(compile_classes(vec!["text-blue-500", "p-4", "hover:bg-red-500"], &resolver));
            }
        });
    });
}

criterion_group!(benches, benchmark_non_cached, benchmark_cached, benchmark_repeated_compile);
criterion_main!(benches);
```

**Benchmark Scenarios:**
1. **Non-cached** (baseline): Create new resolver for each operation
2. **Cached** (optimized): Reuse resolver via pool
3. **Repeated compile**: 10x compilation of same theme

**Expected Results:**
- Cached: 10-50x faster than non-cached
- Memory: Lower memory usage with cache
- Startup: Pool lazy-initializes (first access is slow, rest are fast)

**Run Benchmark:**
```bash
cargo bench --bench theme_resolver_cache_bench -- --verbose
```

---

## R6.6: Property Test for Resolver Pool

**File:** NEW `native/tests/property_resolver_pool.rs`

**Purpose:** Use property-based testing to verify pool behavior

### Design: Property Test

```rust
#[cfg(test)]
mod property_resolver_pool {
    use proptest::prelude::*;
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(500))]
        
        fn prop_pool_returns_same_instance_for_same_id(
            theme_id in "[a-z0-9]{1,20}",
            accesses in 1..20usize
        ) {
            let pool = ThemeResolverPool::get();
            
            // Access same theme_id multiple times
            let mut instances = vec![];
            for _ in 0..accesses {
                let resolver = pool.get_or_create(&theme_id)?;
                instances.push(Arc::as_ptr(&resolver));
            }
            
            // All pointers should be identical
            for i in 1..instances.len() {
                prop_assert_eq!(instances[0], instances[i]);
            }
        }
        
        fn prop_pool_different_ids_different_instances(
            id1 in "[a-z0-9]{1,10}",
            id2 in "[a-z0-9]{1,10}"
        ) {
            prop_assume!(id1 != id2);
            
            let pool = ThemeResolverPool::get();
            let resolver1 = pool.get_or_create(&id1)?;
            let resolver2 = pool.get_or_create(&id2)?;
            
            // Different IDs should have different instances
            prop_assert_ne!(
                Arc::as_ptr(&resolver1),
                Arc::as_ptr(&resolver2)
            );
        }
        
        fn prop_pool_stats_consistent(
            num_unique in 1..50usize,
            num_accesses in 50..500usize
        ) {
            let pool = ThemeResolverPool::get();
            pool.clear();
            
            // Create random accesses
            for i in 0..num_accesses {
                let theme_id = format!("theme_{}", i % num_unique);
                pool.get_or_create(&theme_id).ok();
            }
            
            let stats = pool.stats();
            
            // Verify stats consistency
            prop_assert!(stats.size <= num_unique);
            prop_assert_eq!(stats.misses, num_unique);
            prop_assert_eq!(stats.hits, num_accesses - num_unique);
        }
    }
}
```

**Property Tests:**
1. Same theme_id returns same instance
2. Different theme_ids return different instances
3. Statistics tracking is accurate

**Test Count:** ~3 property tests
**Iterations:** 500 each

---

## R6.7: Integrate Pool Stats into Monitoring

**File:** Update existing `native/src/infrastructure/napi_bridge_cache.rs`

**Purpose:** Export pool statistics through NAPI

### Design: Integration

```rust
// In napi_bridge_cache.rs

#[napi]
pub fn get_resolver_pool_stats() -> napi::Result<ResolverPoolStats> {
    let pool = ThemeResolverPool::get();
    let stats = pool.stats();
    
    Ok(ResolverPoolStats {
        cache_size: stats.size as u32,
        hits: stats.hits as u64,
        misses: stats.misses as u64,
        hit_rate: if stats.hits + stats.misses > 0 {
            (stats.hits as f64) / ((stats.hits + stats.misses) as f64)
        } else {
            0.0
        },
    })
}

#[napi]
pub fn clear_resolver_pool() -> napi::Result<()> {
    let pool = ThemeResolverPool::get();
    pool.clear();
    Ok(())
}

// TypeScript types
#[napi(object)]
pub struct ResolverPoolStats {
    pub cache_size: u32,
    pub hits: u64,
    pub misses: u64,
    pub hit_rate: f64,
}
```

**NAPI Functions Added:**
- `get_resolver_pool_stats()` - Get pool statistics
- `clear_resolver_pool()` - Clear pool (for testing)

**TypeScript Binding:**
```typescript
// packages/domain/compiler/src/cacheNative.ts

export interface ResolverPoolStats {
  cache_size: number;
  hits: bigint;
  misses: bigint;
  hit_rate: number;
}

export function getResolverPoolStats(): ResolverPoolStats { ... }
export function clearResolverPool(): void { ... }
```

---

## R6.8: Verify Backward Compatibility & Performance

**File:** Existing test suite + new verification

### Design: Verification

```rust
#[cfg(test)]
mod backward_compatibility {
    use super::*;
    
    #[test]
    fn test_existing_resolver_api_unchanged() {
        // Old API should still work
        let resolver = create_resolver("default");
        
        assert!(!resolver.resolve_color("blue").unwrap().is_empty());
        assert!(!resolver.resolve_spacing("4").unwrap().is_empty());
    }
    
    #[test]
    fn test_cached_resolver_compatible_with_old_code() {
        let pool = ThemeResolverPool::get();
        let resolver = pool.get_or_create("default")?;
        
        // Old code expecting resolver should work
        let color = resolver.resolve_color("blue")?;
        assert_eq!(color, old_resolve_color("blue", "default")?);
    }
    
    #[test]
    fn test_no_performance_regression() {
        let start = std::time::Instant::now();
        
        for _ in 0..10000 {
            let pool = ThemeResolverPool::get();
            let _resolver = pool.get_or_create("default")?;
        }
        
        let elapsed = start.elapsed();
        
        // 10000 cached accesses should be very fast (< 100ms)
        assert!(elapsed.as_millis() < 100);
    }
    
    #[test]
    fn test_first_access_initializes_pool() {
        ThemeResolverPool::clear_global();  // Clear for test
        
        let start = std::time::Instant::now();
        let _resolver = ThemeResolverPool::get().get_or_create("default")?;
        let first_elapsed = start.elapsed();
        
        // Second access should be faster (no initialization)
        let start = std::time::Instant::now();
        let _resolver = ThemeResolverPool::get().get_or_create("default")?;
        let second_elapsed = start.elapsed();
        
        // Second should be significantly faster
        assert!(second_elapsed < first_elapsed);
    }
}
```

---

## Total Test Count & Deliverables

| Category | Count | File |
|----------|-------|------|
| Unit Tests | 25 | resolver_pool_unit_tests.rs |
| Benchmark Scenarios | 3 | theme_resolver_cache_bench.rs |
| Property Tests | 3 | property_resolver_pool.rs |
| Compatibility Tests | 5 | (integrated) |
| **TOTAL** | **36 items** | - |

---

## Expected Performance Improvements

**Scenario: Repeated Theme Compilation (10x)**

```
Without Pool:
- Time: 50-100ms per compilation
- Memory: High (new allocations per compile)
- Total: 500-1000ms for 10 compiles

With Pool:
- Time: 5-10ms per compilation (cached)
- Memory: Low (reused instances)
- Total: 50-100ms for 10 compiles

IMPROVEMENT: 5-10x faster, 80-90% memory reduction
```

---

## Implementation Order (Session 4-5)

1. **Unit Tests** (1-2 hours)
   - Create resolver_pool_unit_tests.rs
   - Implement ~25 unit tests
   - Run: `cargo test --test resolver_pool_unit_tests`

2. **Property Tests** (30 mins)
   - Create property_resolver_pool.rs
   - Implement ~3 property tests
   - Run: `cargo test --test property_resolver_pool`

3. **Benchmark** (1 hour)
   - Create theme_resolver_cache_bench.rs
   - Implement 3 benchmark scenarios
   - Run: `cargo bench --bench theme_resolver_cache_bench`

4. **Integration & Verification** (1-2 hours)
   - Add NAPI functions for pool stats
   - Create TypeScript bindings
   - Update monitoring integration
   - Run full test suite

---

## Success Criteria

✅ All R6 tasks complete when:
1. Unit tests: ~25 tests passing
2. Property tests: ~3 tests passing (500 iterations each)
3. Benchmark: Demonstrates 5-10x improvement
4. NAPI functions: Pool stats accessible from JavaScript
5. Build succeeds: `cargo build --release`
6. Full test suite passes: `cargo test --release`
7. Backward compatibility: All existing tests pass
8. Documentation: Results in PHASE_7_R6_COMPLETE.md

---

**Design Status:** ✅ READY FOR IMPLEMENTATION

Proceed with Session 4 after R4 (Property tests) completion.
