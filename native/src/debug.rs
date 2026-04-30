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

    #[test]
    fn test_is_enabled_when_set() {
        std::env::set_var("TWS_DEBUG", "1");
        assert!(is_enabled());
        std::env::remove_var("TWS_DEBUG");
    }

    #[test]
    fn test_is_enabled_when_not_set() {
        std::env::remove_var("TWS_DEBUG");
        assert!(!is_enabled());
    }
}
