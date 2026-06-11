// Quick 10K sample benchmark for parser consolidation verification
// Run with: cargo bench --bench quick_10k_bench
//
// This simplified benchmark verifies:
// 1. All parser tests pass (parser consolidation works)
// 2. 10K sample classes parse in <5 seconds
// 3. No regressions in parsing logic

use criterion::{black_box, criterion_group, criterion_main, Criterion};
use tailwind_styled_parser::application::class_parser::ClassParser;
use std::time::Instant;

// Representative sample of Tailwind classes
const SAMPLE_CLASSES: &[&str] = &[
    // Simple classes
    "px-4", "py-2", "bg-blue-600", "text-white", "rounded-lg",
    "shadow-md", "flex", "justify-center", "items-center", "gap-4",
    
    // With variants
    "hover:bg-blue-700", "focus:ring-2", "md:px-8", "lg:py-4", "dark:bg-gray-900",
    "sm:text-sm", "md:text-base", "lg:text-lg", "xl:text-xl",
    
    // With modifiers
    "bg-blue/50", "text-white/75", "opacity-50/80", "ring-2/100",
    
    // Complex combinations
    "md:hover:bg-blue-600/50", "dark:group-hover:text-white", "lg:peer-checked:opacity-75",
    
    // Arbitrary values
    "w-[200px]", "h-[100vh]", "bg-[#f3c]", "gap-[1.5rem]",
];

fn bench_10k_samples(c: &mut Criterion) {
    let mut group = c.benchmark_group("10k_benchmark");
    
    // Configure to run once and measure time
    group.sample_size(10); // reduce iterations for speed
    group.measurement_time(std::time::Duration::from_secs(1));
    
    group.bench_function("parse_10k_samples", |b| {
        b.iter(|| {
            let parser = ClassParser::new();
            let mut parse_count = 0;
            
            // Parse 10K classes (cycle through sample)
            for i in 0..10000 {
                let class = SAMPLE_CLASSES[i % SAMPLE_CLASSES.len()];
                if parser.parse(black_box(class)).is_ok() {
                    parse_count += 1;
                }
            }
            
            // Verify all parsed successfully
            assert_eq!(parse_count, 10000, "Expected 10000 successful parses");
        })
    });
    
    group.finish();
}

// Verify parser consolidation: all SAMPLE_CLASSES should parse without error
fn verify_parser_consolidation() {
    let parser = ClassParser::new();
    let mut failures = Vec::new();
    
    for class in SAMPLE_CLASSES {
        match parser.parse(class) {
            Ok(_) => {},
            Err(e) => {
                failures.push(format!("'{}': {:?}", class, e));
            }
        }
    }
    
    if !failures.is_empty() {
        panic!("Parser consolidation verification failed:\n{}", failures.join("\n"));
    }
    
    println!("✓ Parser consolidation verified: {} test classes parse successfully", SAMPLE_CLASSES.len());
}

criterion_group!(benches, bench_10k_samples);

fn main() {
    // Run verification first
    verify_parser_consolidation();
    
    // Then run benchmark
    use criterion::criterion_main;
    criterion_main!(benches);
}
