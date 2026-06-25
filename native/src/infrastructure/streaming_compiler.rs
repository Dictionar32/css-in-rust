/// Streaming compilation - compile classes incrementally without buffering all
/// Reduces memory usage for large class batches

use std::sync::mpsc::{channel, Receiver};
use std::thread;

pub struct StreamingCompiler {
    batch_size: usize,
}

impl StreamingCompiler {
    pub fn new(batch_size: usize) -> Self {
        Self { batch_size }
    }

    /// Compile classes in streaming fashion
    /// Returns receiver channel to get results as they're computed
    pub fn compile_streaming<F, I>(&self, items: I, compiler: F) -> Receiver<String>
    where
        F: Fn(String) -> String + Send + 'static,
        I: IntoIterator<Item = String> + Send + 'static,
    {
        let (tx, rx) = channel();
        let batch_size = self.batch_size;

        thread::spawn(move || {
            let mut batch = Vec::with_capacity(batch_size);

            for item in items {
                batch.push(item);

                if batch.len() >= batch_size {
                    // Compile and send batch
                    for class in batch.drain(..) {
                        let result = compiler(class);
                        let _ = tx.send(result);
                    }
                }
            }

            // Compile remaining items
            for class in batch {
                let result = compiler(class);
                let _ = tx.send(result);
            }
        });

        rx
    }
}

/// Memory pool for class compilation
/// Reuses allocations to reduce GC pressure
pub struct CompilationPool {
    buffer_pool: Vec<Vec<u8>>,
}

impl CompilationPool {
    pub fn new(size: usize) -> Self {
        let mut pool = Vec::with_capacity(size);
        for _ in 0..size {
            pool.push(Vec::with_capacity(256));
        }
        Self {
            buffer_pool: pool,
        }
    }

    pub fn acquire(&mut self) -> Option<Vec<u8>> {
        self.buffer_pool.pop()
    }

    pub fn release(&mut self, mut buffer: Vec<u8>) {
        buffer.clear();
        if self.buffer_pool.len() < self.buffer_pool.capacity() {
            self.buffer_pool.push(buffer);
        }
    }

    pub fn size(&self) -> usize {
        self.buffer_pool.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_streaming_compiler() {
        let compiler = StreamingCompiler::new(5);
        let classes = vec![
            "bg-blue-600".to_string(),
            "text-white".to_string(),
            "p-4".to_string(),
        ];

        let rx = compiler.compile_streaming(classes, |class| {
            format!("compiled: {}", class)
        });

        let mut results = Vec::new();
        while let Ok(result) = rx.recv() {
            results.push(result);
        }

        assert_eq!(results.len(), 3);
        assert!(results.iter().all(|r| r.starts_with("compiled:")));
    }

    #[test]
    fn test_compilation_pool_acquire_release() {
        let mut pool = CompilationPool::new(3);
        assert_eq!(pool.size(), 3);

        let buf1 = pool.acquire();
        assert!(buf1.is_some());
        assert_eq!(pool.size(), 2);

        let buf2 = pool.acquire();
        assert!(buf2.is_some());
        assert_eq!(pool.size(), 1);

        pool.release(buf1.unwrap());
        assert_eq!(pool.size(), 2);

        pool.release(buf2.unwrap());
        assert_eq!(pool.size(), 3);
    }

    #[test]
    fn test_pool_capacity_limit() {
        let mut pool = CompilationPool::new(2);
        
        let buf1 = pool.acquire().unwrap();
        let buf2 = pool.acquire().unwrap();
        
        // Pool exhausted
        assert!(pool.acquire().is_none());
        
        // Release both
        pool.release(buf1);
        pool.release(buf2);
        
        // Can acquire again
        assert!(pool.acquire().is_some());
        assert!(pool.acquire().is_some());
    }

    #[test]
    fn test_streaming_batching() {
        let compiler = StreamingCompiler::new(2);
        let classes: Vec<String> = (0..5)
            .map(|i| format!("class-{}", i))
            .collect();

        let rx = compiler.compile_streaming(classes, |class| {
            format!("[{}]", class)
        });

        let results: Vec<String> = rx.iter().collect();
        assert_eq!(results.len(), 5);
    }
}
