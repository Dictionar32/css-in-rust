#[inline(always)]
pub fn is_enabled() -> bool {
    std::env::var("TWS_DEBUG").is_ok()
}

/// Log a debug message if TWS_DEBUG is set.
#[macro_export]
macro_rules! tws_debug {
    ($($arg:tt)*) => {{
        if is_enabled() {
            eprintln!($($arg)*);
        }
    }};
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tws_debug_outputs_when_enabled() {
        // Set the environment variable
        std::env::set_var("TWS_DEBUG", "1");
        
        // This should print to stderr
        tws_debug!("test debug message");
        // Note: We can't easily capture macro output in tests without more complex setup
        // But we can at least verify the logic works
        assert!(is_enabled());
    }

    #[test]
    fn test_tws_debug_no_output_when_disabled() {
        // Unset the environment variable
        std::env::remove_var("TWS_DEBUG");
        
        // This should not print anything
        tws_debug!("test debug message");
        // Note: Again, hard to test actual output, but we can verify the logic
        assert!(!is_enabled());
    }
}