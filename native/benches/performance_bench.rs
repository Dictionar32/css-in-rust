//! Performance benchmarks for CSS compiler
//!
//! Run with: `cargo bench`
//! 
//! Measures:
//! - Single class parsing time
//! - Batch compilation time
//! - Cache hit vs miss performance
//! - Memory efficiency

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
// PHASE 7.1: Consolidated to single parser implementation
use css_in_rust::application::class_parser::ClassParser;
use css_in_rust::domain::theme_config::ThemeConfig;
use css_in_rust::application::theme_resolver::ThemeResolver;

// ==================== Benchmark 1: Single Class Parsing ====================

fn bench_single_class_parsing(c: &mut Criterion) {
    let parser = ClassParser::new();
    
    let classes = vec![
        ("px-4", "Simple spacing"),
        ("hover:bg-blue-600", "With variant"),
        ("md:hover:bg-blue-600/50", "Complex"),
        ("[width:200px]", "Arbitrary"),
    ];
    
    let mut group = c.benchmark_group("class_parsing");
    
    for (class, description) in classes {
        group.bench_with_input(
            BenchmarkId::from_parameter(description),
            &class,
            |b, &class| {
                b.iter(|| {
                    parser.parse(black_box(class))
                });
            },
        );
    }
    
    group.finish();
}

// ==================== Benchmark 2: Batch Parsing ====================

fn bench_batch_parsing(c: &mut Criterion) {
    let parser = ClassParser::new();
    let classes = generate_representative_classes(100);
    
    c.bench_function("parse_100_classes", |b| {
        b.iter(|| {
            let mut count = 0;
            for class in &classes {
                if parser.parse(class).is_ok() {
                    count += 1;
                }
            }
            black_box(count);
        });
    });
}

// ==================== Benchmark 3: Theme Resolution ====================

fn bench_theme_resolution(c: &mut Criterion) {
    let mut resolver = ThemeResolver::default();
    
    let colors = vec![
        ("blue-600", "Common color"),
        ("red-500", "Different color"),
        ("gray-900", "Neutral color"),
    ];
    
    let mut group = c.benchmark_group("theme_resolution");
    
    for (color, description) in colors {
        group.bench_with_input(
            BenchmarkId::from_parameter(description),
            &color,
            |b, &color| {
                b.iter(|| {
                    resolver.resolve_color(black_box(color))
                });
            },
        );
    }
    
    group.finish();
}

// ==================== Benchmark 4: Cache Efficiency ====================

fn bench_cache_performance(c: &mut Criterion) {
    let mut resolver = ThemeResolver::default();
    let color = "blue-600";
    
    // Warm up cache
    let _ = resolver.resolve_color(color);
    
    c.bench_function("theme_lookup_cached", |b| {
        b.iter(|| {
            resolver.resolve_color(black_box(color))
        });
    });
}

// ==================== Benchmark 5: End-to-End Compilation ====================

fn bench_end_to_end(c: &mut Criterion) {
    let parser = ClassParser::new();
    let mut resolver = ThemeResolver::default();
    
    // Simulate full pipeline
    c.bench_function("full_pipeline_single_class", |b| {
        b.iter(|| {
            let class = black_box("md:hover:bg-blue-600/50");
            
            // Parse
            if let Ok(parsed) = parser.parse(class) {
                // Resolve (simplified - just resolve color)
                let color_key = format!("{}-{}", parsed.prefix, parsed.value);
                if let Ok(_resolved) = resolver.resolve_color(&color_key) {
                    // In full implementation, would also generate CSS
                    black_box(true);
                }
            }
        });
    });
}

// ==================== Benchmark 6: Different Class Complexities ====================

fn bench_complexity_scaling(c: &mut Criterion) {
    let parser = ClassParser::new();
    
    let test_cases = vec![
        (1, vec!["px-4"]),
        (10, generate_representative_classes(10)),
        (50, generate_representative_classes(50)),
        (100, generate_representative_classes(100)),
    ];
    
    let mut group = c.benchmark_group("complexity_scaling");
    group.sample_size(10); // Reduce samples for larger benchmarks
    
    for (count, classes) in test_cases {
        group.bench_with_input(
            BenchmarkId::from_parameter(count),
            &count,
            |b, _| {
                b.iter(|| {
                    let mut success = 0;
                    for class in &classes {
                        if parser.parse(class).is_ok() {
                            success += 1;
                        }
                    }
                    black_box(success);
                });
            },
        );
    }
    
    group.finish();
}

// ==================== Benchmark 7: Memory Efficiency ====================

fn bench_memory_efficiency(c: &mut Criterion) {
    c.bench_function("memory_no_leak_1000_parses", |b| {
        let parser = ClassParser::new();
        b.iter(|| {
            for i in 0..1000 {
                let class = format!("class-{}", i);
                // Should not accumulate memory
                let _ = parser.parse(black_box(&class));
            }
        });
    });
}

// ==================== Benchmark 8: Arbitrary Value Parsing ====================

fn bench_arbitrary_values(c: &mut Criterion) {
    let parser = ClassParser::new();
    
    let arbitrary_classes = vec![
        "[width:200px]",
        "[color:rgb(255,0,0)]",
        "[margin:1rem_2rem]",
        "[padding:10px_20px_30px_40px]",
    ];
    
    c.bench_function("parse_arbitrary_values", |b| {
        b.iter(|| {
            let mut count = 0;
            for class in &arbitrary_classes {
                if parser.parse(class).is_ok() {
                    count += 1;
                }
            }
            black_box(count);
        });
    });
}

// ==================== Benchmark 9: Variant Parsing Overhead ====================

fn bench_variant_parsing(c: &mut Criterion) {
    let parser = ClassParser::new();
    
    let mut group = c.benchmark_group("variant_parsing");
    
    let test_cases = vec![
        ("px-4", 0, "No variants"),
        ("md:px-4", 1, "1 variant"),
        ("md:hover:px-4", 2, "2 variants"),
        ("dark:md:hover:px-4", 3, "3 variants"),
        ("dark:md:lg:hover:focus:px-4", 5, "5 variants"),
    ];
    
    for (class, variant_count, description) in test_cases {
        group.bench_with_input(
            BenchmarkId::from_parameter(description),
            &(class, variant_count),
            |b, &(class, _)| {
                b.iter(|| {
                    parser.parse(black_box(class))
                });
            },
        );
    }
    
    group.finish();
}

// ==================== Benchmark 10: Color Resolution at Scale ====================

fn bench_color_resolution_scale(c: &mut Criterion) {
    let mut resolver = ThemeResolver::default();
    
    let mut group = c.benchmark_group("color_resolution_scale");
    
    let color_counts = vec![1, 10, 50, 100];
    
    for count in color_counts {
        group.bench_with_input(
            BenchmarkId::from_parameter(count),
            &count,
            |b, &count| {
                let colors = generate_color_names(count);
                b.iter(|| {
                    let mut success = 0;
                    for color in &colors {
                        if resolver.resolve_color(color).is_ok() {
                            success += 1;
                        }
                    }
                    black_box(success);
                });
            },
        );
    }
    
    group.finish();
}

// ==================== Criterion Benchmark Group Setup ====================

criterion_group!(
    benches,
    bench_single_class_parsing,
    bench_batch_parsing,
    bench_theme_resolution,
    bench_cache_performance,
    bench_end_to_end,
    bench_complexity_scaling,
    bench_memory_efficiency,
    bench_arbitrary_values,
    bench_variant_parsing,
    bench_color_resolution_scale,
);

criterion_main!(benches);

// ==================== Helper Functions ====================

fn generate_representative_classes(count: usize) -> Vec<String> {
    let prefixes = vec!["px", "py", "bg", "text", "border", "m", "p"];
    let colors = vec!["blue", "red", "green", "gray"];
    let numbers = vec!["1", "2", "4", "6", "8"];
    let variants = vec!["md", "lg", "hover", "focus", "dark"];
    
    let mut classes = Vec::new();
    
    for i in 0..count {
        let prefix = &prefixes[i % prefixes.len()];
        let color = &colors[i % colors.len()];
        let num = &numbers[i % numbers.len()];
        let variant = &variants[i % variants.len()];
        
        if i % 4 == 0 {
            classes.push(format!("{}-{}", prefix, num));
        } else if i % 4 == 1 {
            classes.push(format!("{}:{}-{}", variant, prefix, color));
        } else if i % 4 == 2 {
            classes.push(format!("{}-{}/50", prefix, color));
        } else {
            classes.push(format!("dark:{}:{}:{}-{}", variant, prefix, variant, num));
        }
    }
    
    classes
}

fn generate_color_names(count: usize) -> Vec<String> {
    let color_families = vec![
        "red", "orange", "yellow", "green", "teal", "blue", 
        "indigo", "purple", "pink", "gray", "slate"
    ];
    let shades = vec!["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"];
    
    let mut colors = Vec::new();
    
    for i in 0..count {
        let family = &color_families[i % color_families.len()];
        let shade = &shades[i % shades.len()];
        colors.push(format!("{}-{}", family, shade));
    }
    
    colors
}
