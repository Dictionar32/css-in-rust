use once_cell::sync::Lazy;
use rayon::ThreadPoolBuilder;

/// Global thread pool for workspace scanning operations.
/// Size limited to CPU count to prevent oversubscription.
pub static SCAN_THREAD_POOL: Lazy<rayon::ThreadPool> = Lazy::new(|| {
    let num_threads = num_cpus::get();
    ThreadPoolBuilder::new()
        .num_threads(num_threads)
        .stack_size(4 * 1024 * 1024)
        .build()
        .expect("Failed to create thread pool")
});
