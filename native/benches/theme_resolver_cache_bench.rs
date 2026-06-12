//! Theme Resolver Caching Benchmark
//!
//! Compares performance of:
//! 1. Without pool: Create new ThemeResolver for each resolution operation
//! 2. With pool: Use get_or_create() from pool for theme resolution
//!
//! Target verification: 10-50x improvement on repeated compiles with same theme
//!
//! Run with: `cargo bench --bench theme_resolver_cache_bench`

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId, Throughput};
use tailwind_styled_parser::application::theme_resolver::ThemeResolver;
use tailwind_styled_parser::application::theme_resolver_pool::THEME_RESOLVER_POOL;
use tailwind_styled_parser::domain::theme_config::ThemeConfig;

// ==================== Benchmark 1: 1000 Repeated Resolutions (Same Theme) ====================

fn bench_repeated_resolutions_without_pool(c: &mut Criterion) {
    c.bench_function("repeated_resolutions_without_pool_1000x", |b| {
        b.iter(|| {
            let mut total_time = 0u64;
            
            for iteration in 0..1000 {
                // Create new resolver each time (no pooling)
                let resolver = ThemeResolver::new(ThemeConfig::default());
                
                // Perform color resolution
                let color_to_resolve = match iteration % 5 {
                    0 => "blue-600",
                    1 => "red-500",
                    2 => "green-400",
                    3 => "yellow-300",
                    _ => "purple-700",
                };
                
                if let Ok(_result) = resolver.resolve_color(black_box(color_to_resolve)) {
                    total_time += 1;
                }
            }
            
            black_box(total_time);
        });
    });
}

fn bench_repeated_resolutions_with_pool(c: &mut Criterion) {
    // Clear pool before benchmark
    THEME_RESOLVER_POOL.clear();
    THEME_RESOLVER_POOL.reset_stats();
    
    c.bench_function("repeated_resolutions_with_pool_1000x", |b| {
        b.iter(|| {
            let theme_id = 1u64;
            let config = ThemeConfig::default();
            let mut total_time = 0u64;
            
            for iteration in 0..1000 {
                // Get from pool (reuses resolver)
                let resolver = THEME_RESOLVER_POOL.get_or_create(
                    black_box(theme_id),
                    config.clone(),
                );
                
                // Perform color resolution
                let color_to_resolve = match iteration % 5 {
                    0 => "blue-600",
                    1 => "red-500",
                    2 => "green-400",
                    3 => "yellow-300",
                    _ => "purple-700",
                };
                
                if let Ok(_result) = resolver.resolve_color(black_box(color_to_resolve)) {
                    total_time += 1;
                }
            }
            
            black_box(total_time);
        });
    });
}

// ==================== Benchmark 2: 100 Resolutions with Different Themes ====================

fn bench_different_themes_without_pool(c: &mut Criterion) {
    c.bench_function("different_themes_without_pool_100x", |b| {
        b.iter(|| {
            let mut total_time = 0u64;
            
            for theme_num in 0..100 {
                // Create new resolver for each theme (no pooling)
                let resolver = ThemeResolver::new(ThemeConfig::default());
                
                // Resolve color from this theme
                let color_key = format!("blue-{}", 300 + (theme_num % 7) * 100);
                if let Ok(_result) = resolver.resolve_color(black_box(&color_key)) {
                    total_time += 1;
                }
            }
            
            black_box(total_time);
        });
    });
}

fn bench_different_themes_with_pool(c: &mut Criterion) {
    // Clear pool before benchmark
    THEME_RESOLVER_POOL.clear();
    THEME_RESOLVER_POOL.reset_stats();
    
    c.bench_function("different_themes_with_pool_100x", |b| {
        b.iter(|| {
            let config = ThemeConfig::default();
            let mut total_time = 0u64;
            
            for theme_num in 0..100 {
                // Get from pool - different theme_id each time
                let theme_id = theme_num as u64;
                let resolver = THEME_RESOLVER_POOL.get_or_create(
                    black_box(theme_id),
                    config.clone(),
                );
                
                // Resolve color from this theme
                let color_key = format!("blue-{}", 300 + (theme_num % 7) * 100);
                if let Ok(_result) = resolver.resolve_color(black_box(&color_key)) {
                    total_time += 1;
                }
            }
            
            black_box(total_time);
        });
    });
}

// ==================== Benchmark 3: Mixed Workload (80% Same Theme, 20% Different) ====================

fn bench_mixed_workload_without_pool(c: &mut Criterion) {
    c.bench_function("mixed_workload_without_pool", |b| {
        b.iter(|| {
            let mut total_time = 0u64;
            
            for iteration in 0..1000 {
                // 80% use same theme, 20% use different theme
                let _theme_id = if iteration % 100 < 80 { 1u64 } else { 2u64 };
                
                // Create new resolver each time (no pooling)
                let resolver = ThemeResolver::new(ThemeConfig::default());
                
                // Perform color resolution
                let color = match iteration % 3 {
                    0 => "blue-600",
                    1 => "red-500",
                    _ => "green-400",
                };
                
                if let Ok(_result) = resolver.resolve_color(black_box(color)) {
                    total_time += 1;
                }
            }
            
            black_box(total_time);
        });
    });
}

fn bench_mixed_workload_with_pool(c: &mut Criterion) {
    // Clear pool before benchmark
    THEME_RESOLVER_POOL.clear();
    THEME_RESOLVER_POOL.reset_stats();
    
    c.bench_function("mixed_workload_with_pool", |b| {
        b.iter(|| {
            let config = ThemeConfig::default();
            let mut total_time = 0u64;
            
            for iteration in 0..1000 {
                // 80% use same theme, 20% use different theme
                let theme_id = if iteration % 100 < 80 { 1u64 } else { 2u64 };
                
                // Get from pool
                let resolver = THEME_RESOLVER_POOL.get_or_create(
                    black_box(theme_id),
                    config.clone(),
                );
                
                // Perform color resolution
                let color = match iteration % 3 {
                    0 => "blue-600",
                    1 => "red-500",
                    _ => "green-400",
                };
                
                if let Ok(_result) = resolver.resolve_color(black_box(color)) {
                    total_time += 1;
                }
            }
            
            black_box(total_time);
        });
    });
}

// ==================== Benchmark 4: Scaling - Multiple Theme IDs ====================

fn bench_pool_scaling(c: &mut Criterion) {
    let mut group = c.benchmark_group("pool_scaling");
    
    for num_themes in [1, 5, 10, 50, 100].iter() {
        group.throughput(Throughput::Elements(1000));
        
        group.bench_with_input(
            BenchmarkId::from_parameter(format!("{}_themes", num_themes)),
            num_themes,
            |b, &num_themes| {
                THEME_RESOLVER_POOL.clear();
                THEME_RESOLVER_POOL.reset_stats();
                
                b.iter(|| {
                    let config = ThemeConfig::default();
                    let mut total = 0u64;
                    
                    // Perform 1000 resolutions distributed across N themes
                    for iteration in 0..1000 {
                        let theme_id = (iteration % num_themes) as u64;
                        let _resolver = THEME_RESOLVER_POOL.get_or_create(
                            black_box(theme_id),
                            config.clone(),
                        );
                        
                        total += 1;
                    }
                    
                    black_box(total);
                });
            },
        );
    }
    
    group.finish();
}

// ==================== Benchmark 5: Pool Statistics Tracking ====================

fn bench_pool_with_stats_tracking(c: &mut Criterion) {
    c.bench_function("pool_with_stats_tracking_1000_ops", |b| {
        b.iter(|| {
            THEME_RESOLVER_POOL.clear();
            THEME_RESOLVER_POOL.reset_stats();
            
            let config = ThemeConfig::default();
            
            // Perform operations and track stats
            for iteration in 0..1000 {
                let theme_id = (iteration % 10) as u64;
                let _resolver = THEME_RESOLVER_POOL.get_or_create(
                    black_box(theme_id),
                    config.clone(),
                );
            }
            
            // Get stats (this should be cheap)
            let stats = THEME_RESOLVER_POOL.stats();
            black_box(stats);
        });
    });
}

// ==================== Benchmark 6: Color Resolution Performance Comparison ====================

fn bench_color_resolution_comparison(c: &mut Criterion) {
    let mut group = c.benchmark_group("color_resolution");
    
    // Without pool
    group.bench_function("resolve_color_no_pool", |b| {
        b.iter(|| {
            let resolver = ThemeResolver::new(ThemeConfig::default());
            let colors = vec!["blue-600", "red-500", "green-400", "yellow-300", "purple-700"];
            
            let mut count = 0;
            for color in &colors {
                if let Ok(_) = resolver.resolve_color(black_box(color)) {
                    count += 1;
                }
            }
            black_box(count);
        });
    });
    
    // With pool
    group.bench_function("resolve_color_with_pool", |b| {
        THEME_RESOLVER_POOL.clear();
        THEME_RESOLVER_POOL.reset_stats();
        
        b.iter(|| {
            let resolver = THEME_RESOLVER_POOL.get_or_create(1, ThemeConfig::default());
            let colors = vec!["blue-600", "red-500", "green-400", "yellow-300", "purple-700"];
            
            let mut count = 0;
            for color in &colors {
                if let Ok(_) = resolver.resolve_color(black_box(color)) {
                    count += 1;
                }
            }
            black_box(count);
        });
    });
    
    group.finish();
}

// ==================== Benchmark 7: Spacing Resolution Comparison ====================

fn bench_spacing_resolution_comparison(c: &mut Criterion) {
    let mut group = c.benchmark_group("spacing_resolution");
    
    // Without pool
    group.bench_function("resolve_spacing_no_pool", |b| {
        b.iter(|| {
            let resolver = ThemeResolver::new(ThemeConfig::default());
            let spacings = vec!["1", "2", "4", "6", "8", "12", "16"];
            
            let mut count = 0;
            for spacing in &spacings {
                if let Ok(_) = resolver.resolve_spacing(black_box(spacing)) {
                    count += 1;
                }
            }
            black_box(count);
        });
    });
    
    // With pool
    group.bench_function("resolve_spacing_with_pool", |b| {
        THEME_RESOLVER_POOL.clear();
        THEME_RESOLVER_POOL.reset_stats();
        
        b.iter(|| {
            let resolver = THEME_RESOLVER_POOL.get_or_create(1, ThemeConfig::default());
            let spacings = vec!["1", "2", "4", "6", "8", "12", "16"];
            
            let mut count = 0;
            for spacing in &spacings {
                if let Ok(_) = resolver.resolve_spacing(black_box(spacing)) {
                    count += 1;
                }
            }
            black_box(count);
        });
    });
    
    group.finish();
}

// ==================== Benchmark 8: Concurrent Access Patterns ====================

fn bench_concurrent_access_pattern(c: &mut Criterion) {
    c.bench_function("pool_concurrent_same_theme_100_ops", |b| {
        THEME_RESOLVER_POOL.clear();
        THEME_RESOLVER_POOL.reset_stats();
        
        b.iter(|| {
            let config = ThemeConfig::default();
            
            // Simulate repeated access to same theme
            for _ in 0..100 {
                let resolver = THEME_RESOLVER_POOL.get_or_create(
                    black_box(1u64),
                    config.clone(),
                );
                let _ = resolver.resolve_color(black_box("blue-600"));
            }
        });
    });
}

// ==================== Benchmark 9: Real-World Compilation Scenario ====================

fn bench_realistic_compilation_scenario(c: &mut Criterion) {
    let mut group = c.benchmark_group("realistic_scenario");
    
    // Simulate a realistic compilation of 500 classes with same theme
    group.sample_size(10);
    
    group.bench_function("compile_500_classes_no_pool", |b| {
        b.iter(|| {
            // Create resolver once
            let resolver = ThemeResolver::new(ThemeConfig::default());
            
            // Simulate processing 500 classes
            let classes = generate_test_classes(500);
            let mut success_count = 0;
            
            for class in &classes {
                // Extract color from class name and resolve
                if let Some(color) = extract_color_from_class(class) {
                    if let Ok(_) = resolver.resolve_color(black_box(&color)) {
                        success_count += 1;
                    }
                }
            }
            
            black_box(success_count);
        });
    });
    
    group.bench_function("compile_500_classes_with_pool", |b| {
        THEME_RESOLVER_POOL.clear();
        THEME_RESOLVER_POOL.reset_stats();
        
        b.iter(|| {
            // Get resolver from pool
            let resolver = THEME_RESOLVER_POOL.get_or_create(
                1,
                ThemeConfig::default(),
            );
            
            // Simulate processing 500 classes
            let classes = generate_test_classes(500);
            let mut success_count = 0;
            
            for class in &classes {
                // Extract color from class name and resolve
                if let Some(color) = extract_color_from_class(class) {
                    if let Ok(_) = resolver.resolve_color(black_box(&color)) {
                        success_count += 1;
                    }
                }
            }
            
            black_box(success_count);
        });
    });
    
    group.finish();
}

// ==================== Criterion Benchmark Group Setup ====================

criterion_group!(
    benches,
    bench_repeated_resolutions_without_pool,
    bench_repeated_resolutions_with_pool,
    bench_different_themes_without_pool,
    bench_different_themes_with_pool,
    bench_mixed_workload_without_pool,
    bench_mixed_workload_with_pool,
    bench_pool_scaling,
    bench_pool_with_stats_tracking,
    bench_color_resolution_comparison,
    bench_spacing_resolution_comparison,
    bench_concurrent_access_pattern,
    bench_realistic_compilation_scenario,
);

criterion_main!(benches);

// ==================== Helper Functions ====================

fn generate_test_classes(count: usize) -> Vec<String> {
    let colors = vec![
        "blue", "red", "green", "yellow", "purple", 
        "pink", "orange", "teal", "indigo", "gray"
    ];
    let shades = vec!["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
    let prefixes = vec!["bg", "text", "border", "ring", "fill", "stroke"];
    
    let mut classes = Vec::new();
    
    for i in 0..count {
        let prefix = &prefixes[i % prefixes.len()];
        let color = &colors[i % colors.len()];
        let shade = &shades[(i / colors.len()) % shades.len()];
        
        classes.push(format!("{}-{}-{}", prefix, color, shade));
    }
    
    classes
}

fn extract_color_from_class(class: &str) -> Option<String> {
    // Simple extraction: "bg-blue-600" -> "blue-600"
    let parts: Vec<&str> = class.split('-').collect();
    
    if parts.len() >= 3 {
        // Join color name and shade
        let color_name = parts[1];
        let shade = parts[2];
        Some(format!("{}-{}", color_name, shade))
    } else {
        None
    }
}
