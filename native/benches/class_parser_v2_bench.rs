//! Performance benchmarks for ClassParser v2
//! 
//! Run with: cargo bench --bench class_parser_v2_bench

use criterion::{black_box, criterion_group, criterion_main, Criterion, BenchmarkId};
use tailwind_styled_parser::application::class_parser::ClassParser;

// ============================================================================
// SIMPLE CLASS BENCHMARKS
// ============================================================================

fn bench_simple_classes(c: &mut Criterion) {
    let mut group = c.benchmark_group("simple_classes");
    
    let test_cases = vec![
        ("px-4", "simple_spacing"),
        ("bg-blue-600", "color_with_value"),
        ("text-2xl", "font_size"),
        ("w-full", "width_full"),
        ("mx-auto", "margin_auto"),
    ];
    
    for (class, name) in test_cases {
        group.bench_with_input(
            BenchmarkId::from_parameter(name),
            &class,
            |b, &class| {
                b.iter(|| ClassParser::parse(black_box(class)))
            },
        );
    }
    group.finish();
}

// ============================================================================
// VARIANT BENCHMARKS
// ============================================================================

fn bench_variants(c: &mut Criterion) {
    let mut group = c.benchmark_group("variants");
    
    let test_cases = vec![
        ("hover:bg-blue", "single_variant"),
        ("md:px-4", "responsive"),
        ("dark:bg-gray-900", "dark_mode"),
        ("md:hover:bg-blue", "two_variants"),
        ("md:hover:active:text-red", "three_variants"),
        ("group-hover:text-white", "group_variant"),
        ("peer-checked:opacity-50", "peer_variant"),
    ];
    
    for (class, name) in test_cases {
        group.bench_with_input(
            BenchmarkId::from_parameter(name),
            &class,
            |b, &class| {
                b.iter(|| ClassParser::parse(black_box(class)))
            },
        );
    }
    group.finish();
}

// ============================================================================
// MODIFIER BENCHMARKS
// ============================================================================

fn bench_modifiers(c: &mut Criterion) {
    let mut group = c.benchmark_group("modifiers");
    
    let test_cases = vec![
        ("bg-blue/50", "simple_opacity"),
        ("text-white/75", "text_opacity"),
        ("bg-gray-900/80", "complex_opacity"),
        ("hover:bg-blue/50", "variant_with_modifier"),
        ("md:text-white/80", "responsive_with_modifier"),
    ];
    
    for (class, name) in test_cases {
        group.bench_with_input(
            BenchmarkId::from_parameter(name),
            &class,
            |b, &class| {
                b.iter(|| ClassParser::parse(black_box(class)))
            },
        );
    }
    group.finish();
}

// ============================================================================
// ARBITRARY VALUE BENCHMARKS
// ============================================================================

fn bench_arbitrary_values(c: &mut Criterion) {
    let mut group = c.benchmark_group("arbitrary_values");
    
    let test_cases = vec![
        ("w-[200px]", "simple_width"),
        ("bg-[#f3c]", "hex_color"),
        ("duration-[2000ms]", "duration"),
        ("text-[var(--custom-size)]", "css_variable"),
        ("bg-[rgba(0,0,0,0.5)]", "rgba_function"),
        ("w-[calc(100%-20px)]", "calc_expression"),
    ];
    
    for (class, name) in test_cases {
        group.bench_with_input(
            BenchmarkId::from_parameter(name),
            &class,
            |b, &class| {
                b.iter(|| ClassParser::parse(black_box(class)))
            },
        );
    }
    group.finish();
}

// ============================================================================
// COMPLEX COMBINATION BENCHMARKS
// ============================================================================

fn bench_complex_combinations(c: &mut Criterion) {
    let mut group = c.benchmark_group("complex");
    
    let test_cases = vec![
        ("md:hover:bg-blue-600/50", "full_stack"),
        ("dark:group-hover:text-white/80", "dark_group"),
        ("lg:peer-checked:opacity-75", "responsive_peer"),
    ];
    
    for (class, name) in test_cases {
        group.bench_with_input(
            BenchmarkId::from_parameter(name),
            &class,
            |b, &class| {
                b.iter(|| ClassParser::parse(black_box(class)))
            },
        );
    }
    group.finish();
}

// ============================================================================
// BATCH PARSING BENCHMARK
// ============================================================================

fn bench_batch_parsing(c: &mut Criterion) {
    let mut group = c.benchmark_group("batch");
    
    // 10 classes
    let batch_10 = vec![
        "px-4", "py-2", "bg-blue-600", "text-white", "rounded-lg",
        "shadow-md", "hover:bg-blue-700", "md:px-8", "dark:bg-gray-900", "flex",
    ];
    
    // 50 classes (typical page)
    let batch_50: Vec<&str> = batch_10.iter()
        .cycle()
        .take(50)
        .copied()
        .collect();
    
    // 100 classes (large page)
    let batch_100: Vec<&str> = batch_10.iter()
        .cycle()
        .take(100)
        .copied()
        .collect();
    
    group.bench_function("parse_10_classes", |b| {
        b.iter(|| {
            for class in &batch_10 {
                ClassParser::parse(black_box(class)).ok();
            }
        })
    });
    
    group.bench_function("parse_50_classes", |b| {
        b.iter(|| {
            for class in &batch_50 {
                ClassParser::parse(black_box(class)).ok();
            }
        })
    });
    
    group.bench_function("parse_100_classes", |b| {
        b.iter(|| {
            for class in &batch_100 {
                ClassParser::parse(black_box(class)).ok();
            }
        })
    });
    
    group.finish();
}

// ============================================================================
// ERROR CASE BENCHMARKS
// ============================================================================

fn bench_error_cases(c: &mut Criterion) {
    let mut group = c.benchmark_group("errors");
    
    let test_cases = vec![
        ("invalid-prefix-xyz", "invalid_prefix"),
        ("w-[unmatched", "unmatched_bracket"),
        ("bg-blue//50", "double_slash"),
    ];
    
    for (class, name) in test_cases {
        group.bench_with_input(
            BenchmarkId::from_parameter(name),
            &class,
            |b, &class| {
                b.iter(|| ClassParser::parse(black_box(class)))
            },
        );
    }
    group.finish();
}

// ============================================================================
// CRITERION CONFIGURATION
// ============================================================================

criterion_group!(
    benches,
    bench_simple_classes,
    bench_variants,
    bench_modifiers,
    bench_arbitrary_values,
    bench_complex_combinations,
    bench_batch_parsing,
    bench_error_cases,
);

criterion_main!(benches);
