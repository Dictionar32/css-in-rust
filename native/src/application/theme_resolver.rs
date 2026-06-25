//! ThemeResolver - resolves theme values from Tailwind configuration with caching

use crate::domain::error::ResolveError;
use crate::domain::theme_config::ThemeConfig;
use crate::infrastructure::cache::LruCache;
use std::sync::Mutex;

/// Helper to multiply numeric spacing (e.g., "0.25rem" * 4 -> "1rem")
fn multiply_spacing(base_str: &str, multiplier: f64) -> Option<String> {
    let trim_base = base_str.trim();
    let unit_idx = trim_base.find(|c: char| !c.is_numeric() && c != '.' && c != '-');
    if let Some(idx) = unit_idx {
        let num_part = &trim_base[..idx];
        let unit_part = &trim_base[idx..];
        if let Ok(num) = num_part.parse::<f64>() {
            let result_num = num * multiplier;
            return Some(format!("{}{}", result_num, unit_part));
        }
    }
    None
}

/// Resolves theme values with LRU caching for performance
pub struct ThemeResolver {
    config: ThemeConfig,
    cache: Mutex<LruCache<String, String>>,
}

impl ThemeResolver {
    /// Create a new theme resolver with configuration
    pub fn new(config: ThemeConfig) -> Self {
        Self {
            config,
            cache: Mutex::new(LruCache::new(1000)),
        }
    }

    /// Resolve a color value from theme
    /// 
    /// Supports nested lookups like "blue-600" -> "oklch(54.6% 0.237 262.881)"
    pub fn resolve_color(&self, color: &str) -> Result<String, ResolveError> {
        // Check cache first
        let cache_key = format!("color:{}", color);
        if let Some(cached) = self.cache.lock().unwrap().get(&cache_key) {
            return Ok(cached);
        }

        // Special CSS color keywords
        if color == "current" || color == "transparent" || color == "inherit" {
            self.cache.lock().unwrap().insert(cache_key, color.to_string());
            return Ok(color.to_string());
        }

        // Try to find in custom colors first
        if let Some(val) = self.config.get_color(color) {
            self.cache.lock().unwrap().insert(cache_key, val.clone());
            return Ok(val);
        }

        // Not found
        Err(ResolveError::ValueNotFound {
            key: color.to_string(),
            section: Some("colors".to_string()),
        })
    }

    /// Resolve a spacing value from theme
    pub fn resolve_spacing(&self, spacing: &str) -> Result<String, ResolveError> {
        let cache_key = format!("spacing:{}", spacing);
        if let Some(cached) = self.cache.lock().unwrap().get(&cache_key) {
            return Ok(cached);
        }

        if let Some(value) = self.config.spacing.get(spacing) {
            self.cache.lock().unwrap().insert(cache_key, value.clone());
            return Ok(value.clone());
        }

        // Dynamic spacing multiplier
        let base_spacing = self.config.spacing.get("spacing")
            .or_else(|| self.config.spacing.get("--spacing"))
            .map(|s| s.as_str())
            .unwrap_or("0.25rem");

        if let Ok(multiplier) = spacing.parse::<f64>() {
            if let Some(resolved) = multiply_spacing(base_spacing, multiplier) {
                self.cache.lock().unwrap().insert(cache_key, resolved.clone());
                return Ok(resolved);
            }
        }

        // Special Tailwind spacing keys
        let special_value = match spacing {
            "px" => Some("1px".to_string()),
            "full" => Some("100%".to_string()),
            "screen" => Some("100vw".to_string()),
            "auto" => Some("auto".to_string()),
            _ => None,
        };

        if let Some(val) = special_value {
            self.cache.lock().unwrap().insert(cache_key, val.clone());
            return Ok(val);
        }

        Err(ResolveError::ValueNotFound {
            key: spacing.to_string(),
            section: Some("spacing".to_string()),
        })
    }

    /// Resolve a font size from theme
    pub fn resolve_font_size(&self, size: &str) -> Result<String, ResolveError> {
        let cache_key = format!("font-size:{}", size);
        if let Some(cached) = self.cache.lock().unwrap().get(&cache_key) {
            return Ok(cached);
        }

        if let Some(value) = self.config.font_sizes.get(size) {
            let result = value.join(", ");
            self.cache.lock().unwrap().insert(cache_key, result.clone());
            return Ok(result);
        }

        Err(ResolveError::ValueNotFound {
            key: size.to_string(),
            section: Some("font_sizes".to_string()),
        })
    }

    /// Resolve a breakpoint from theme
    pub fn resolve_breakpoint(&self, breakpoint: &str) -> Result<String, ResolveError> {
        let cache_key = format!("breakpoint:{}", breakpoint);
        if let Some(cached) = self.cache.lock().unwrap().get(&cache_key) {
            return Ok(cached);
        }

        if let Some(value) = self.config.breakpoints.get(breakpoint) {
            self.cache.lock().unwrap().insert(cache_key, value.clone());
            return Ok(value.clone());
        }

        Err(ResolveError::ValueNotFound {
            key: breakpoint.to_string(),
            section: Some("breakpoints".to_string()),
        })
    }

    /// Apply opacity modifier to a color (hex, oklch, or rgba)
    pub fn apply_opacity(&self, color: &str, opacity: &str) -> Result<String, ResolveError> {
        // Validate opacity is 0-100
        let opacity_val: u32 = opacity.parse().map_err(|_| ResolveError::InvalidOpacity {
            value: opacity.to_string(),
        })?;

        if opacity_val > 100 {
            return Err(ResolveError::InvalidOpacity {
                value: opacity.to_string(),
            });
        }

        // Convert opacity percentage to alpha (0-1)
        let alpha = opacity_val as f64 / 100.0;

        // If color is hex, convert to rgba
        if color.starts_with('#') {
            let rgba = hex_to_rgba(color, alpha)?;
            return Ok(rgba);
        }

        // If already rgba, adjust alpha
        if color.starts_with("rgba") {
            return Ok(format!("rgba({})", color));
        }

        // If oklch, format properly
        if color.starts_with("oklch(") && color.ends_with(')') {
            let inner = &color[6..color.len() - 1];
            return Ok(format!("oklch({} / {})", inner, alpha));
        }

        Ok(color.to_string())
    }
}

impl Default for ThemeResolver {
    fn default() -> Self {
        Self::new(crate::utils::constants::default_theme())
    }
}

/// Convert hex color to rgba with specified alpha
fn hex_to_rgba(hex: &str, alpha: f64) -> Result<String, ResolveError> {
    let hex = hex.trim_start_matches('#');

    // Support both 3-digit and 6-digit hex
    let (r, g, b) = if hex.len() == 6 {
        let r = u8::from_str_radix(&hex[0..2], 16).map_err(|_| ResolveError::InvalidColor {
            value: hex.to_string(),
            reason: Some("invalid hex format".to_string()),
        })?;
        let g = u8::from_str_radix(&hex[2..4], 16).map_err(|_| ResolveError::InvalidColor {
            value: hex.to_string(),
            reason: Some("invalid hex format".to_string()),
        })?;
        let b = u8::from_str_radix(&hex[4..6], 16).map_err(|_| ResolveError::InvalidColor {
            value: hex.to_string(),
            reason: Some("invalid hex format".to_string()),
        })?;
        (r, g, b)
    } else if hex.len() == 3 {
        let r = u8::from_str_radix(&hex[0..1], 16).map_err(|_| ResolveError::InvalidColor {
            value: hex.to_string(),
            reason: Some("invalid hex format".to_string()),
        })?;
        let g = u8::from_str_radix(&hex[1..2], 16).map_err(|_| ResolveError::InvalidColor {
            value: hex.to_string(),
            reason: Some("invalid hex format".to_string()),
        })?;
        let b = u8::from_str_radix(&hex[2..3], 16).map_err(|_| ResolveError::InvalidColor {
            value: hex.to_string(),
            reason: Some("invalid hex format".to_string()),
        })?;
        // Expand: #abc -> #aabbcc
        ((r << 4 | r), (g << 4 | g), (b << 4 | b))
    } else {
        return Err(ResolveError::InvalidColor {
            value: hex.to_string(),
            reason: Some("hex must be 3 or 6 digits".to_string()),
        });
    };

    Ok(format!("rgba({}, {}, {}, {})", r, g, b, alpha))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_color_default() {
        let resolver = ThemeResolver::default();
        let result = resolver.resolve_color("blue-600");
        assert_eq!(result, Ok("oklch(54.6% .245 262.881)".to_string()));
    }

    #[test]
    fn test_resolve_color_not_found() {
        let resolver = ThemeResolver::default();
        let result = resolver.resolve_color("unknowncolor-999");
        assert!(result.is_err());
    }

    #[test]
    fn test_resolve_spacing() {
        let resolver = ThemeResolver::default();
        let result = resolver.resolve_spacing("4");
        assert_eq!(result, Ok("1rem".to_string()));
    }

    #[test]
    fn test_resolve_breakpoint() {
        let resolver = ThemeResolver::default();
        let result = resolver.resolve_breakpoint("md");
        assert_eq!(result, Ok("48rem".to_string()));
    }

    #[test]
    fn test_apply_opacity_valid() {
        let resolver = ThemeResolver::default();
        let result = resolver.apply_opacity("#1e40af", "50");
        assert!(result.is_ok());
        assert!(result.unwrap().contains("rgba"));
    }

    #[test]
    fn test_apply_opacity_invalid() {
        let resolver = ThemeResolver::default();
        let result = resolver.apply_opacity("#1e40af", "150");
        assert!(result.is_err());
    }

    #[test]
    fn test_hex_to_rgba_six_digit() {
        let result = hex_to_rgba("#1e40af", 0.5);
        assert_eq!(result, Ok("rgba(30, 64, 175, 0.5)".to_string()));
    }

    #[test]
    fn test_hex_to_rgba_three_digit() {
        let result = hex_to_rgba("#fff", 1.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_cache_performance() {
        let resolver = ThemeResolver::default();
        let _ = resolver.resolve_color("blue-600");
        let result = resolver.resolve_color("blue-600");
        assert!(result.is_ok());
    }
}
