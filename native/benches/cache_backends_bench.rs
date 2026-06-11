//! PHASE 7.2: Cache Backend Performance Benchmarks
//! Compares performance of different cache backends

use std::time::Instant;

/// Benchmark: Basic operations (put/get) performance
fn bench_basic_operations() {
    println!("\n=== CACHE BACKENDS PERFORMANCE BENCHMARK ===\n");
    
    let backends = vec![
        ("LRU", "lru"),
        ("Adaptive", "adaptive"),
        ("Persistent", "persistent"),
    ];
    
    for (name, _backend) in backends {
        bench_backend_ops(name);
    }
}

fn bench_backend_ops(name: &str) {
    let operations = 10000;
    let cache = match name {
        "LRU" => tailwind_styled_parser::infrastructure::cache_backend::CacheFactory::lru(5000),
        "Adaptive" => tailwind_styled_parser::infrastructure::cache_backend::CacheFactory::adaptive(2500, 5000),
        "Persistent" => tailwind_styled_parser::infrastructure::cache_backend::CacheFactory::persistent(
            format!("./bench_{}.json", name.to_lowercase())
        ),
        _ => tailwind_styled_parser::infrastructure::cache_backend::CacheFactory::lru(5000),
    };
    
    // Warm up
    for i in 0..100 {
        cache.put(format!("warmup_{}", i), format!("value_{}", i));
    }
    
    // Benchmark put operations
    let start = Instant::now();
    for i in 0..operations {
        cache.put(
            format!("key_{}", i % 1000),
            format!("value_{}", i)
        );
    }
    let put_duration = start.elapsed();
    let put_ops_per_sec = operations as f64 / put_duration.as_secs_f64();
    
    // Benchmark get operations
    let start = Instant::now();
    for i in 0..operations {
        let _ = cache.get(&format!("key_{}", i % 500));
    }
    let get_duration = start.elapsed();
    let get_ops_per_sec = operations as f64 / get_duration.as_secs_f64();
    
    // Get stats
    let stats = cache.stats();
    
    println!("{} Backend Results:", name);
    println!("  PUT performance: {:.0} ops/sec ({:.3}ms for {} ops)",
             put_ops_per_sec, put_duration.as_millis(), operations);
    println!("  GET performance: {:.0} ops/sec ({:.3}ms for {} ops)",
             get_ops_per_sec, get_duration.as_millis(), operations);
    println!("  Cache hit rate: {:.1}%", stats.hit_rate * 100.0);
    println!("  Cache size: {}/{}", stats.current_size, stats.capacity);
    println!("  Evictions: {}", stats.evictions);
    println!();
    
    // Cleanup
    if name == "Persistent" {
        let _ = std::fs::remove_file(format!("./bench_{}.json", name.to_lowercase()));
    }
}

/// Benchmark: Memory usage comparison
fn bench_memory_usage() {
    println!("\n=== CACHE MEMORY USAGE BENCHMARK ===\n");
    
    let test_sizes = vec![100, 1000, 5000, 10000];
    
    for size in test_sizes {
        let cache = tailwind_styled_parser::infrastructure::cache_backend::CacheFactory::lru(size);
        
        // Fill cache
        for i in 0..size {
            let key = format!("key_{:0width$}", i, width = 8);
            let value = format!("value_{:0width$}_with_more_data", i, width = 8);
            cache.put(key, value);
        }
        
        let stats = cache.stats();
        println!("LRU Cache with {} entries:", size);
        println!("  Actual size: {}", stats.current_size);
        println!("  Hit rate: {:.1}%", stats.hit_rate * 100.0);
        println!("  Evictions: {}", stats.evictions);
        println!();
    }
}

/// Benchmark: Concurrent access patterns
fn bench_concurrent_access() {
    println!("\n=== CONCURRENT ACCESS PATTERN BENCHMARK ===\n");
    
    let cache = std::sync::Arc::new(
        tailwind_styled_parser::infrastructure::cache_backend::CacheFactory::lru(5000)
    );
    
    let operations_per_thread = 1000;
    let num_threads = 4;
    
    let start = Instant::now();
    let mut handles = vec![];
    
    for thread_id in 0..num_threads {
        let cache_clone = cache.clone();
        let handle = std::thread::spawn(move || {
            for i in 0..operations_per_thread {
                let key = format!("thread_{}_key_{}", thread_id, i % 100);
                let value = format!("thread_{}_value_{}", thread_id, i);
                cache_clone.put(key.clone(), value);
                let _ = cache_clone.get(&key);
            }
        });
        handles.push(handle);
    }
    
    for handle in handles {
        let _ = handle.join();
    }
    
    let duration = start.elapsed();
    let total_ops = operations_per_thread * num_threads;
    let ops_per_sec = total_ops as f64 / duration.as_secs_f64();
    
    println!("Concurrent Access Results:");
    println!("  Threads: {}", num_threads);
    println!("  Operations per thread: {}", operations_per_thread);
    println!("  Total operations: {}", total_ops);
    println!("  Duration: {:.3}s", duration.as_secs_f64());
    println!("  Throughput: {:.0} ops/sec", ops_per_sec);
    
    let stats = cache.stats();
    println!("  Final cache size: {}", stats.current_size);
    println!("  Hit rate: {:.1}%", stats.hit_rate * 100.0);
    println!();
}

/// Benchmark: Factory pattern overhead
fn bench_factory_overhead() {
    println!("\n=== FACTORY PATTERN OVERHEAD BENCHMARK ===\n");
    
    let iterations = 10000;
    
    // Direct cache creation
    let start = Instant::now();
    for _ in 0..iterations {
        let _cache: tailwind_styled_parser::infrastructure::lru_cache::LruCache<String, String> = 
            tailwind_styled_parser::infrastructure::lru_cache::LruCache::new(1000);
    }
    let direct_duration = start.elapsed();
    
    // Factory creation
    let start = Instant::now();
    for _ in 0..iterations {
        let _cache = tailwind_styled_parser::infrastructure::cache_backend::CacheFactory::lru(1000);
    }
    let factory_duration = start.elapsed();
    
    println!("Factory Pattern Overhead:");
    println!("  Direct creation: {:.3}ms for {} iterations", 
             direct_duration.as_millis(), iterations);
    println!("  Factory creation: {:.3}ms for {} iterations", 
             factory_duration.as_millis(), iterations);
    
    let overhead_percent = (factory_duration.as_nanos() as f64 / direct_duration.as_nanos() as f64 - 1.0) * 100.0;
    println!("  Overhead: {:.2}%", overhead_percent);
    println!();
}

fn main() {
    bench_basic_operations();
    bench_memory_usage();
    bench_concurrent_access();
    bench_factory_overhead();
    
    println!("\n=== BENCHMARK COMPLETE ===\n");
}

#[cfg(test)]
mod benchmarks {
    use super::*;
    
    #[test]
    fn test_bench_basic_operations() {
        bench_basic_operations();
    }
    
    #[test]
    fn test_bench_memory_usage() {
        bench_memory_usage();
    }
    
    #[test]
    fn test_bench_concurrent_access() {
        bench_concurrent_access();
    }
    
    #[test]
    fn test_bench_factory_overhead() {
        bench_factory_overhead();
    }
}
