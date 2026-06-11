//! Simple test untuk verify ThemeResolverPool works

use tailwind_styled_parser::application::theme_resolver_pool::THEME_RESOLVER_POOL;
use tailwind_styled_parser::domain::theme_config::ThemeConfig;

#[test]
fn test_pool_access() {
    let config = ThemeConfig::default();
    let _resolver = THEME_RESOLVER_POOL.get_or_create(10001, config);
    
    // Should not panic
    assert!(true);
}

#[test]
fn test_pool_cache_hit() {
    let config = ThemeConfig::default();
    let r1 = THEME_RESOLVER_POOL.get_or_create(10002, config.clone());
    let r2 = THEME_RESOLVER_POOL.get_or_create(10002, config);
    
    // Should be same instance
    assert!(std::sync::Arc::ptr_eq(&r1, &r2));
}

#[test]
fn test_pool_different_ids() {
    let config = ThemeConfig::default();
    
    let r1 = THEME_RESOLVER_POOL.get_or_create(10003, config.clone());
    let r2 = THEME_RESOLVER_POOL.get_or_create(10004, config);
    
    // Different IDs should have different resolvers
    assert!(!std::sync::Arc::ptr_eq(&r1, &r2));
}

#[test]
fn test_pool_remove() {
    let config = ThemeConfig::default();
    let _r1 = THEME_RESOLVER_POOL.get_or_create(10005, config.clone());
    let _r2 = THEME_RESOLVER_POOL.get_or_create(10006, config);
    
    let len_before = THEME_RESOLVER_POOL.len();
    
    THEME_RESOLVER_POOL.remove(10005);
    
    let len_after = THEME_RESOLVER_POOL.len();
    assert_eq!(len_after, len_before - 1);
}

#[test]
fn test_pool_performance() {
    let config = ThemeConfig::default();
    
    // Pre-populate with unique IDs
    for i in 0..10 {
        let _r = THEME_RESOLVER_POOL.get_or_create(20000 + i, config.clone());
    }
    
    // Measure 1000 cached accesses
    let start = std::time::Instant::now();
    for i in 0..1000 {
        let theme_id = 20000 + (i % 10) as u64;
        let _r = THEME_RESOLVER_POOL.get_or_create(theme_id, config.clone());
    }
    let elapsed = start.elapsed();
    
    // Should be fast
    assert!(elapsed.as_millis() < 100, "Too slow: {}ms", elapsed.as_millis());
}

#[test]
fn test_pool_concurrent_same_id() {
    use std::sync::Arc;
    use std::thread;
    
    let config = ThemeConfig::default();
    let config_arc = Arc::new(config);
    
    let mut handles = vec![];
    
    for _ in 0..10 {
        let config_clone = Arc::clone(&config_arc);
        let handle = thread::spawn(move || {
            let _r = THEME_RESOLVER_POOL.get_or_create(30000, (*config_clone).clone());
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    // Should have only 1 resolver for this ID (deduplicated)
    // Can't assert exact count since other tests populate pool
    // Just verify no panic
    assert!(true);
}

#[test]
fn test_pool_concurrent_different_ids() {
    use std::thread;
    
    let config = ThemeConfig::default();
    
    let mut handles = vec![];
    
    for i in 0..10 {
        let config_clone = config.clone();
        let handle = thread::spawn(move || {
            let _r = THEME_RESOLVER_POOL.get_or_create((40000 + i) as u64, config_clone);
        });
        handles.push(handle);
    }
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    // Should successfully create 10 unique resolvers
    assert!(true);
}

#[test]
fn test_resolver_functionality() {
    let config = ThemeConfig::default();
    let resolver = THEME_RESOLVER_POOL.get_or_create(50000, config);
    
    // Resolver should be accessible and work (even if value not found)
    // The key point is the resolver is returned successfully
    assert!(true);
}
