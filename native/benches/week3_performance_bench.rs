//! Week 3 Performance Benchmarks
//! End-to-end performance: Parser + Resolver + Generator

#![feature(test)]
extern crate test;

use tailwind_styled_parser::application::class_parser_v2::ClassParser;
use tailwind_styled_parser::application::theme_resolver::ThemeResolver;
use test::Bencher;

// ============================================================================
// PARSER BENCHMARKS
// ============================================================================

#[bench]
fn bench_parse_simple_class(b: &mut Bencher) {
    b.iter(|| {
        ClassParser::parse("px-4")
    });
}

#[bench]
fn bench_parse_color_class(b: &mut Bencher) {
    b.iter(|| {
        ClassParser::parse("bg-blue-600")
    });
}

#[bench]
fn bench_parse_responsive_class(b: &mut Bencher) {
    b.iter(|| {
        ClassParser::parse("md:px-4")
    });
}

#[bench]
fn bench_parse_variant_class(b: &mut Bencher) {
    b.iter(|| {
        ClassParser::parse("hover:bg-blue-600")
    });
}

#[bench]
fn bench_parse_complex_class(b: &mut Bencher) {
    b.iter(|| {
        ClassParser::parse("md:hover:bg-blue-600/50")
    });
}

// ============================================================================
// RESOLVER BENCHMARKS
// ============================================================================

#[bench]
fn bench_resolve_color_uncached(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        resolver.resolve_color("blue-600")
    });
}

#[bench]
fn bench_resolve_spacing_uncached(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        resolver.resolve_spacing("4")
    });
}

#[bench]
fn bench_resolve_font_size_uncached(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        resolver.resolve_font_size("lg")
    });
}

#[bench]
fn bench_resolve_breakpoint_uncached(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        resolver.resolve_breakpoint("md")
    });
}

#[bench]
fn bench_apply_opacity(b: &mut Bencher) {
    let resolver = ThemeResolver::default();
    b.iter(|| {
        resolver.apply_opacity("#1e40af", "50")
    });
}

// ============================================================================
// PIPELINE BENCHMARKS (End-to-End)
// ============================================================================

#[bench]
fn bench_pipeline_simple_class(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        let parsed = ClassParser::parse("px-4").unwrap();
        let _resolved = resolver.resolve_spacing(&parsed.value);
    });
}

#[bench]
fn bench_pipeline_color_class(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        let parsed = ClassParser::parse("bg-blue-600").unwrap();
        let _resolved = resolver.resolve_color(&parsed.value);
    });
}

#[bench]
fn bench_pipeline_variant_class(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        let parsed = ClassParser::parse("md:px-4").unwrap();
        let _bp = resolver.resolve_breakpoint("md");
        let _spacing = resolver.resolve_spacing(&parsed.value);
    });
}

#[bench]
fn bench_pipeline_complex_class(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        let parsed = ClassParser::parse("md:hover:bg-blue-600/50").unwrap();
        let _color = resolver.resolve_color(&parsed.value);
        let _opacity = resolver.apply_opacity("#1e40af", "50");
    });
}

// ============================================================================
// BATCH BENCHMARKS
// ============================================================================

#[bench]
fn bench_batch_10_classes(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    let classes = vec![
        "px-4", "py-2", "bg-blue-600", "text-white", "rounded-lg",
        "md:px-8", "hover:bg-blue-700", "dark:bg-gray-900", "flex", "justify-center"
    ];
    
    b.iter(|| {
        for class in &classes {
            let parsed = ClassParser::parse(class).unwrap();
            let _ = resolver.resolve_color(&parsed.value);
            let _ = resolver.resolve_spacing(&parsed.value);
        }
    });
}

#[bench]
fn bench_batch_100_classes_cached(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    
    // Pre-warm cache
    for i in 1..=10 {
        let _ = resolver.resolve_color("blue-600");
        let _ = resolver.resolve_spacing("4");
    }
    
    b.iter(|| {
        for _ in 0..100 {
            let _ = resolver.resolve_color("blue-600");
            let _ = resolver.resolve_spacing("4");
        }
    });
}

// ============================================================================
// CACHE EFFECTIVENESS BENCHMARKS
// ============================================================================

#[bench]
fn bench_cache_hit_rate(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    
    // Initial lookups (misses)
    for i in 0..10 {
        let color = format!("blue-{}", (i + 1) * 100);
        let _ = resolver.resolve_color(&color);
    }
    
    // Measure cache hits
    b.iter(|| {
        for _ in 0..100 {
            let _ = resolver.resolve_color("blue-600");
        }
    });
}

// ============================================================================
// COMPARISON BENCHMARKS
// ============================================================================

#[bench]
fn bench_parse_vs_resolve(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        let _parsed = ClassParser::parse("bg-blue-600");
        let _resolved = resolver.resolve_color("blue-600");
    });
}

#[bench]
fn bench_full_pipeline_vs_parts(b: &mut Bencher) {
    let mut resolver = ThemeResolver::default();
    b.iter(|| {
        // Full pipeline
        let parsed = ClassParser::parse("md:hover:bg-blue-600/50").unwrap();
        let _bp = resolver.resolve_breakpoint("md");
        let _color = resolver.resolve_color(&parsed.value);
        let _opacity = resolver.apply_opacity("#1e40af", "50");
    });
}
