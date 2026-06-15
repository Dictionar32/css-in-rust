//! Simple test untuk verify ThemeResolverPool works
//! 

use tailwind_styled_parser::application::theme_resolver_pool::ThemeResolverPool;
use tailwind_styled_parser::domain::theme_config::ThemeConfig;
use std::sync::Arc;

#[test]
fn test_pool_access() {
    let pool = ThemeResolverPool::new();
    let config = ThemeConfig::new();
    let _resolver = pool.get_or_create(10001, config);
    
    // Should not panic
    assert!(true);
}

#[test]
fn test_pool_cache_hit() {
    let pool = ThemeResolverPool::new();
    let config = ThemeConfig::new();
    let r1 = pool.get_or_create(10002, config.clone());
    let r2 = pool.get_or_create(10002, config);
    
    // Should be same instance
    assert!(Arc::ptr_eq(&r1, &r2));
}

#[test]
fn test_pool_different_ids() {
    let pool = ThemeResolverPool::new();
    let config = ThemeConfig::new();
    
    let r1 = pool.get_or_create(10003, config.clone());
    let r2 = pool.get_or_create(10004, config);
    
    // Different IDs should have different resolvers
    assert!(!Arc::ptr_eq(&r1, &r2));
}

#[test]
fn test_pool_remove() {
    let pool = ThemeResolverPool::new();
    let config = ThemeConfig::new();
    let _r1 = pool.get_or_create(10005, config.clone());
    let _r2 = pool.get_or_create(10006, config);
    
    let len_before = pool.len();
    assert_eq!(len_before, 2);
    
    pool.remove(10005);
    
    let len_after = pool.len();
    assert_eq!(len_after, 1);
}

#[test]
fn test_pool_performance() {
    let pool = ThemeResolverPool::new();
    let config = ThemeConfig::new();
    
    // Pre-populate with unique IDs
    for i in 0..10 {
        let _r = pool.get_or_create(20000 + i, config.clone());
    }
    
    // Measure 1000 cached accesses
    let start = std::time::Instant::now();
    for i in 0..1000 {
        let theme_id = 20000 + (i % 10) as u64;
        let _r = pool.get_or_create(theme_id, config.clone());
    }
    let elapsed = start.elapsed();
    
    // Should be fast
    assert!(elapsed.as_millis() < 500, "Too slow: {}ms", elapsed.as_millis());
}

#[test]
fn test_pool_concurrent_same_id() {
    use std::thread;
    
    let pool = Arc::new(ThemeResolverPool::new());
    let config = ThemeConfig::new();
    let config_arc = Arc::new(config);
    
    let mut handles = vec![];
    
    for _ in 0..10 {
        let config_clone = Arc::clone(&config_arc);
        let pool_clone = Arc::clone(&pool);
        let handle = thread::spawn(move || {
            let _r = pool_clone.get_or_create(30000, (*config_clone).clone());
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    // Should have only 1 resolver for this ID (deduplicated)
    assert_eq!(pool.len(), 1);
}

#[test]
fn test_pool_concurrent_different_ids() {
    use std::thread;
    
    let pool = Arc::new(ThemeResolverPool::new());
    let config = ThemeConfig::new();
    let config_arc = Arc::new(config);
    
    let mut handles = vec![];
    
    for i in 0..10 {
        let config_clone = Arc::clone(&config_arc);
        let pool_clone = Arc::clone(&pool);
        let handle = thread::spawn(move || {
            let _r = pool_clone.get_or_create((40000 + i) as u64, (*config_clone).clone());
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    // Should successfully create 10 unique resolvers
    assert_eq!(pool.len(), 10);
}

#[test]
fn test_resolver_functionality() {
    let pool = ThemeResolverPool::new();
    let config = ThemeConfig::new();
    let resolver = pool.get_or_create(50000, config);
    
    // Resolver should be accessible and work
    let resolved = resolver.resolve_spacing("4");
    assert!(resolved.is_ok());
}
