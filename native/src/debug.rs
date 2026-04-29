#[inline(always)]
pub fn is_enabled() -> bool {
    std::env::var("TWS_DEBUG").is_ok()
}

/// Log a debug message if TWS_DEBUG is set.
#[macro_export]
macro_rules! tws_debug {
    ($($arg:tt)*) => {{
        if crate::debug::is_enabled() {
            eprintln!($($arg)*);
        }
    }};
}