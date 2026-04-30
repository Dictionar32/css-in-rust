/// Check apakah TWS_DEBUG env var aktif.
#[inline(always)]
pub fn is_enabled() -> bool {
    std::env::var("TWS_DEBUG").is_ok()
}

/// Log debug message ke stderr jika TWS_DEBUG di-set.
///
/// Usage:
/// ```rust
/// tws_debug!("merge result: {} classes", count);
/// ```
#[macro_export]
macro_rules! tws_debug {
    ($($arg:tt)*) => {{
        if $crate::debug::is_enabled() {
            eprintln!($($arg)*);
        }
    }};
}

#[cfg(test)]
mod tests {
    use super::*;

    // These tests mutate env vars — must run serially to avoid race conditions
    // on Windows where parallel test threads share the same env space.

    #[test]
    fn test_is_enabled_when_set() {
        // Scope the env var to this test only
        std::env::set_var("TWS_DEBUG", "1");
        let result = is_enabled();
        std::env::remove_var("TWS_DEBUG");
        assert!(result);
    }

    #[test]
    fn test_is_enabled_when_not_set() {
        std::env::remove_var("TWS_DEBUG");
        // Re-check after removal to guard against parallel test pollution
        for _ in 0..3 {
            if std::env::var("TWS_DEBUG").is_err() {
                assert!(!is_enabled());
                return;
            }
            std::thread::sleep(std::time::Duration::from_millis(5));
        }
        panic!("TWS_DEBUG was set by another test — cannot verify is_enabled() == false");
    }
}