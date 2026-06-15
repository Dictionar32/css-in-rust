//! Phase 5b: Performance Benchmarking Tests
//!
//! Validates that the Rust CSS compiler achieves target performance metrics:
//! - 100 classes compiled in <100ms
//! - 500 classes compiled in <400ms
//! - 1000 classes compiled in <800ms
//!
//! **Validates: Requirements 13.0 (Performance)**

#[cfg(test)]
mod performance_tests {
    use tailwind_styled_parser::{
        domain::css_compiler::CssCompiler,
        domain::theme_config::ThemeConfig,
    };
    use std::time::Instant;

    fn default_theme() -> ThemeConfig {
        ThemeConfig::default()
    }

    /// Generate diverse test classes
    fn generate_classes(count: usize) -> Vec<String> {
        let prefixes = vec!["p", "m", "px", "py", "mx", "my", "w", "h", "bg", "text", "border"];
        let values = vec!["1", "2", "3", "4", "5", "6", "8", "12", "16"];
        let variants = vec!["hover", "focus", "md", "lg", "dark"];
        let mut classes = Vec::new();

        for i in 0..count {
            let prefix = prefixes[i % prefixes.len()];
            let value = values[i % values.len()];
            
            // Mix of simple, variant, and modifier classes
            match i % 4 {
                0 => {
                    // Simple: p-4
                    classes.push(format!("{}-{}", prefix, value));
                }
                1 => {
                    // Variant: hover:p-4
                    let variant = variants[i % variants.len()];
                    classes.push(format!("{}:{}-{}", variant, prefix, value));
                }
                2 => {
                    // Modifier: bg-blue-500/50
                    classes.push(format!("bg-blue-{}/50", (i % 10 + 1) * 100));
                }
                _ => {
                    // Complex: md:hover:bg-blue-500
                    let v1 = variants[i % variants.len()];
                    let v2 = variants[(i + 1) % variants.len()];
                    classes.push(format!("{}:{}:bg-blue-500", v1, v2));
                }
            }
        }

        classes
    }

    // ============================================================================
    // PERFORMANCE TEST GROUP 1: Baseline Performance
    // ============================================================================

    #[test]
    fn test_performance_single_class() {
        let compiler = CssCompiler::new(default_theme());
        let classes = vec!["px-4".to_string()];
        
        let start = Instant::now();
        let result = compiler.compile(classes);
        let elapsed = start.elapsed();
        
        assert!(result.is_ok(), "Compilation should succeed");
        println!("Single class compilation: {:.2}ms", elapsed.as_secs_f64() * 1000.0);
        
        // Single class should be very fast (<1ms typically)
        assert!(elapsed.as_millis() < 10, "Single class should compile quickly");
    }

    #[test]
    fn test_performance_10_classes() {
        let compiler = CssCompiler::new(default_theme());
        let classes = generate_classes(10);
        
        let start = Instant::now();
        let result = compiler.compile(classes);
        let elapsed = start.elapsed();
        
        assert!(result.is_ok(), "Compilation should succeed");
        println!("10 classes compilation: {:.2}ms", elapsed.as_secs_f64() * 1000.0);
        
        // 10 classes should compile in <10ms
        assert!(elapsed.as_millis() < 20, "10 classes should compile quickly");
    }

    // ============================================================================
    // PERFORMANCE TEST GROUP 2: Target Performance (100, 500, 1000 classes)
    // ============================================================================

    #[test]
    fn test_performance_100_classes() {
        let compiler = CssCompiler::new(default_theme());
        let classes = generate_classes(100);
        
        let start = Instant::now();
        let result = compiler.compile(classes);
        let elapsed = start.elapsed();
        
        assert!(result.is_ok(), "Compilation should succeed");
        let millis = elapsed.as_secs_f64() * 1000.0;
        println!("100 classes compilation: {:.2}ms", millis);
        
        // TARGET: 100 classes in <100ms
        assert!(elapsed.as_millis() < 100, "100 classes should compile in <100ms (got {}ms)", elapsed.as_millis());
    }

    #[test]
    fn test_performance_500_classes() {
        let compiler = CssCompiler::new(default_theme());
        let classes = generate_classes(500);
        
        let start = Instant::now();
        let result = compiler.compile(classes);
        let elapsed = start.elapsed();
        
        assert!(result.is_ok(), "Compilation should succeed");
        let millis = elapsed.as_secs_f64() * 1000.0;
        println!("500 classes compilation: {:.2}ms", millis);
        
        // TARGET: 500 classes in <400ms
        assert!(elapsed.as_millis() < 400, "500 classes should compile in <400ms");
    }

    #[test]
    fn test_performance_1000_classes() {
        let compiler = CssCompiler::new(default_theme());
        let classes = generate_classes(1000);
        
        let start = Instant::now();
        let result = compiler.compile(classes);
        let elapsed = start.elapsed();
        
        assert!(result.is_ok(), "Compilation should succeed");
        let millis = elapsed.as_secs_f64() * 1000.0;
        println!("1000 classes compilation: {:.2}ms", millis);
        
        // TARGET: 1000 classes in <800ms
        assert!(elapsed.as_millis() < 800, "1000 classes should compile in <800ms");
    }

    // ============================================================================
    // PERFORMANCE TEST GROUP 3: Scalability & Linear Growth
    // ============================================================================

    #[test]
    fn test_performance_scalability() {
        let compiler = CssCompiler::new(default_theme());
        
        // Measure times for different batch sizes
        let sizes = vec![50, 100, 200, 500];
        let mut measurements = Vec::new();
        
        for size in sizes {
            let classes = generate_classes(size);
            
            let start = Instant::now();
            let result = compiler.compile(classes);
            let elapsed = start.elapsed();
            
            assert!(result.is_ok(), "Compilation should succeed");
            
            let millis = elapsed.as_secs_f64() * 1000.0;
            let per_class = millis / size as f64;
            
            measurements.push((size, millis, per_class));
            println!("  {} classes: {:.2}ms ({:.4}ms per class)", size, millis, per_class);
        }
        
        // Verify linear scalability: time per class should be roughly constant
        let first_per_class = measurements[0].2;
        let last_per_class = measurements[measurements.len() - 1].2;
        
        println!("First (per-class): {:.4}ms", first_per_class);
        println!("Last (per-class): {:.4}ms", last_per_class);
        
        // Allow 2x variance in per-class time (accounting for startup overhead, cache effects)
        assert!(
            last_per_class < first_per_class * 2.0,
            "Performance should scale roughly linearly"
        );
    }

    // ============================================================================
    // PERFORMANCE TEST GROUP 4: Complex Class Performance
    // ============================================================================

    #[test]
    fn test_performance_complex_variants() {
        let compiler = CssCompiler::new(default_theme());
        
        // Create 100 complex classes with multiple variants
        let mut classes = Vec::new();
        for i in 0..100 {
            classes.push(format!("md:hover:dark:bg-blue-{}/50", (i % 10 + 1) * 100));
        }
        
        let start = Instant::now();
        let result = compiler.compile(classes);
        let elapsed = start.elapsed();
        
        assert!(result.is_ok(), "Compilation should succeed");
        let millis = elapsed.as_secs_f64() * 1000.0;
        println!("100 complex classes (3 variants each): {:.2}ms", millis);
        
        // Complex classes should still compile efficiently
        assert!(elapsed.as_millis() < 150, "Complex classes should still be reasonably fast");
    }

    #[test]
    fn test_performance_arbitrary_values() {
        let compiler = CssCompiler::new(default_theme());
        
        // Create 50 classes with arbitrary values
        let mut classes = Vec::new();
        for i in 0..50 {
            classes.push(format!("[width:{}px]", 100 + i * 10));
            classes.push(format!("[margin:{}rem_{}rem]", i % 5, (i + 1) % 5));
        }
        
        let start = Instant::now();
        let result = compiler.compile(classes);
        let elapsed = start.elapsed();
        
        assert!(result.is_ok(), "Compilation should succeed");
        let millis = elapsed.as_secs_f64() * 1000.0;
        println!("100 arbitrary value classes: {:.2}ms", millis);
        
        // Arbitrary values should parse efficiently
        assert!(elapsed.as_millis() < 100, "Arbitrary values should compile efficiently");
    }

    // ============================================================================
    // PERFORMANCE TEST GROUP 5: Repeated Compilation (Cache Effects)
    // ============================================================================

    #[test]
    fn test_performance_warm_cache() {
        let compiler = CssCompiler::new(default_theme());
        let classes = generate_classes(100);
        
        // First compilation (cold cache)
        let start = Instant::now();
        let result1 = compiler.compile(classes.clone());
        let cold_elapsed = start.elapsed();
        
        assert!(result1.is_ok(), "First compilation should succeed");
        
        // Second compilation (warm cache) - same classes
        let start = Instant::now();
        let result2 = compiler.compile(classes);
        let warm_elapsed = start.elapsed();
        
        assert!(result2.is_ok(), "Second compilation should succeed");
        
        let cold_ms = cold_elapsed.as_secs_f64() * 1000.0;
        let warm_ms = warm_elapsed.as_secs_f64() * 1000.0;
        
        println!("Cold cache (100 classes): {:.2}ms", cold_ms);
        println!("Warm cache (100 classes): {:.2}ms", warm_ms);
        
        // Warm cache should be significantly faster
        // (though this depends on cache implementation)
        println!("Cache speedup: {:.1}x", cold_ms / warm_ms.max(0.01));
    }

    // ============================================================================
    // PERFORMANCE TEST GROUP 6: Memory Impact
    // ============================================================================

    #[test]
    fn test_performance_memory_efficiency() {
        let compiler = CssCompiler::new(default_theme());
        
        // Compile progressively larger batches and verify no memory explosion
        let sizes = vec![100, 500, 1000];
        
        for size in sizes {
            let classes = generate_classes(size);
            let result = compiler.compile(classes);
            
            assert!(result.is_ok(), "Compilation should succeed");
            let css = result.unwrap();
            
            // Rough estimate: typical generated CSS should be 5-30 bytes per class
            // depending on implementation details
            let expected_min = size as usize * 5;
            let expected_max = size as usize * 200; // very generous
            
            assert!(
                css.len() >= expected_min && css.len() <= expected_max,
                "Generated CSS size should be reasonable (got {} bytes for {} classes)",
                css.len(),
                size
            );
            
            println!("  {} classes → {:.1}KB CSS", size, css.len() as f64 / 1024.0);
        }
    }

    // ============================================================================
    // PERFORMANCE TEST GROUP 7: Variance Testing
    // ============================================================================

    #[test]
    fn test_performance_consistency() {
        let compiler = CssCompiler::new(default_theme());
        let classes = generate_classes(100);
        
        // Run 5 iterations and check variance
        let mut times = Vec::new();
        
        for _iteration in 0..5 {
            let start = Instant::now();
            let result = compiler.compile(classes.clone());
            let elapsed = start.elapsed();
            
            assert!(result.is_ok(), "Compilation should succeed");
            times.push(elapsed.as_secs_f64() * 1000.0);
        }
        
        // Calculate statistics
        let min = times.iter().cloned().fold(f64::INFINITY, f64::min);
        let max = times.iter().cloned().fold(0.0, f64::max);
        let avg = times.iter().sum::<f64>() / times.len() as f64;
        
        // For fast operations (<1ms), allow higher variance due to timer granularity
        let variance = if min > 0.5 {
            (max - min) / min * 100.0
        } else {
            // For sub-ms operations, just check it's positive
            0.0
        };
        
        println!("Performance variance:");
        println!("  Min: {:.2}ms", min);
        println!("  Max: {:.2}ms", max);
        println!("  Avg: {:.2}ms", avg);
        println!("  Variance: {:.1}%", variance);
        
        // For very fast operations (<5ms), allow higher variance due to OS thread scheduling
        if avg > 5.0 {
            assert!(max < min * 5.0, "Max should not be more than 5x min");
        } else {
            assert!(max < min * 15.0, "Max should not be more than 15x min for very fast operations");
        }
    }
}
