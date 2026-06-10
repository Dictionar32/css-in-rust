# Benchmarks for Rust CSS Compiler

This directory contains performance benchmarks for the CSS compiler engine.

## Benchmark Files

- `class_parser.rs` - Benchmarks for parsing Tailwind class syntax
- `css_generation.rs` - Benchmarks for CSS rule generation
- `end_to_end.rs` - Full pipeline performance benchmarks

## Running Benchmarks

```bash
cargo bench
```

## Performance Targets

- Single class parsing: < 1μs
- CSS generation per class: < 5μs  
- 100 classes compiled: < 100ms
- Warm cache performance: < 50ms for 100 classes

## Notes

Benchmarks use the built-in Rust bencher framework. Criterion.rs can be integrated in the future for more detailed analysis.
