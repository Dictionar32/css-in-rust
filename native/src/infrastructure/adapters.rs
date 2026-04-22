use crate::domain::css_compiler::CssCompileResult;
use crate::infrastructure::cache_store::{CacheEntry, CacheReadResult};
use crate::infrastructure::watch_api::{WatchChangeEvent, WatchStartResult};

/// Infrastructure adapter: repository untuk scan cache.
#[derive(Default)]
pub struct ScanCacheRepository;

impl ScanCacheRepository {
    pub fn read(&self, cache_path: String) -> napi::Result<CacheReadResult> {
        crate::infrastructure::cache_store::cache_read(cache_path)
    }

    pub fn write(&self, cache_path: String, entries: Vec<CacheEntry>) -> napi::Result<bool> {
        crate::infrastructure::cache_store::cache_write(cache_path, entries)
    }
}

/// Infrastructure adapter: scanner filesystem.
#[derive(Default)]
pub struct FileSystemScanner;

impl FileSystemScanner {
    pub fn scan_workspace(
        &self,
        root: String,
        extensions: Option<Vec<String>>,
    ) -> napi::Result<crate::application::scanner::ScanResult> {
        crate::application::scanner::scan_workspace(root, extensions)
    }
}

/// Infrastructure adapter: compiler CSS.
#[derive(Default)]
pub struct CssCompiler;

impl CssCompiler {
    pub fn compile_css(&self, css: String, _prefix: Option<String>) -> CssCompileResult {
        crate::domain::css_compiler::process_tailwind_css_lightning(css)
    }
}

/// Infrastructure adapter: file watcher.
#[derive(Default)]
pub struct FileWatcher;

impl FileWatcher {
    pub fn start_watch(&self, root_dir: String) -> WatchStartResult {
        crate::infrastructure::watch_api::start_watch(root_dir)
    }

    pub fn poll_watch_events(&self, handle_id: u32) -> Vec<WatchChangeEvent> {
        crate::infrastructure::watch_api::poll_watch_events(handle_id)
    }

    pub fn stop_watch(&self, handle_id: u32) -> bool {
        crate::infrastructure::watch_api::stop_watch(handle_id)
    }
}