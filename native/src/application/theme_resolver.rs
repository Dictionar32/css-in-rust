//! ThemeResolver - resolves theme values from Tailwind configuration with caching

use crate::domain::error::ResolveError;
use crate::domain::theme_config::{ThemeConfig, ThemeValue};
use crate::infrastructure::cache::LruCache;
use crate::utils::constants::DEFAULT_COLORS;

/// Resolves theme values with LRU caching for performance
pub struct ThemeResolver {
    config: ThemeConfig,
    cache: LruCache<String, String>,
}

impl ThemeResolver {
    /// Create a new theme resolver with configuration
    pub fn new(config: ThemeConfig) -> Self {
        Self {
            config,
            cache: LruCache::new(1000),
        }
    }

    /// Resolve a color value from theme
    /// 
    /// Supports nested lookups like "blue-600" -> "#1e40af"
    /// Falls back to Tailwind defaults if custom not found
    pub fn resolve_color(&mut self, color: &str) -> Result<String, ResolveError> {
        // Check cache first
        let cache_key = format!("color:{}", color);
        if let Some(cached) = self.cache.get(&cache_key) {
            return Ok(cached);
        }

        // Try to find in custom colors first
        if let Some(ThemeValue::Simple(hex)) = self.config.colors.get(color) {
            self.cache.insert(cache_key, hex.clone());
            return Ok(hex.clone());
        }

        // Fall back to default colors
        if let Some(hex) = DEFAULT_COLORS.get(color) {
            self.cache.insert(cache_key, hex.clone());
            return Ok(hex.clone());
        }

        // Not found
        Err(ResolveError::ValueNotFound {
            key: color.to_string(),
            section: Some("colors".to_string()),
        })
    }

    /// Resolve a spacing value from theme
    pub fn resolve_spacing(&mut self, spacing: &str) -> Result<String, ResolveError> {
        let cache_key = format!("spacing:{}", spacing);
        if let Some(cached) = self.cache.get(&cache_key) {
            return Ok(cached);
        }

        if let Some(value) = self.config.spacing.get(spacing) {
            self.cache.insert(cache_key, value.clone());
            return Ok(value.clone());
        }

        Err(ResolveError::ValueNotFound {
            key: spacing.to_string(),
            section: Some("spacing".to_string()),
        })
    }

    /// Resolve a font size from theme
    pub fn resolve_font_size(&mut self, size: &str) -> Result<String, ResolveError> {
        let cache_key = format!("font-size:{}", size);
        if let Some(cached) = self.cache.get(&cache_key) {
            return Ok(cached);
        }

        if let Some(value) = self.config.font_sizes.get(size) {
            let result = value.join(", ");
            self.cache.insert(cache_key, result.clone());
            return Ok(result);
        }

        Err(ResolveError::ValueNotFound {
            key: size.to_string(),
            section: Some("font_sizes".to_string()),
        })
    }

    /// Resolve a breakpoint from theme
    pub fn resolve_breakpoint(&mut self, breakpoint: &str) -> Result<String, ResolveError> {
        let cache_key = format!("breakpoint:{}", breakpoint);
        if let Some(cached) = self.cache.get(&cache_key) {
            return Ok(cached);
        }

        if let Some(value) = self.config.breakpoints.get(breakpoint) {
            self.cache.insert(cache_key, value.clone());
            return Ok(value.clone());
        }

        Err(ResolveError::ValueNotFound {
            key: breakpoint.to_string(),
            section: Some("breakpoints".to_string()),
        })
    }

    /// Apply opacity modifier to a color (hex or rgba)
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

        // If color is already hex, convert to rgba
        if color.starts_with('#') {
            let rgba = hex_to_rgba(color, alpha)?;
            return Ok(rgba);
        }

        // If already rgba, adjust alpha
        if color.starts_with("rgba") {
            return Ok(format!("rgba({})", color));
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
        let mut resolver = ThemeResolver::default();
        let result = resolver.resolve_color("blue-600");
        assert_eq!(result, Ok("#1e40af".to_string()));
    }

    #[test]
    fn test_resolve_color_not_found() {
        let mut resolver = ThemeResolver::default();
        let result = resolver.resolve_color("unknowncolor-999");
        assert!(result.is_err());
    }

    #[test]
    fn test_resolve_spacing() {
        let mut resolver = ThemeResolver::default();
        let result = resolver.resolve_spacing("4");
        assert_eq!(result, Ok("1rem".to_string()));
    }

    #[test]
    fn test_resolve_breakpoint() {
        let mut resolver = ThemeResolver::default();
        let result = resolver.resolve_breakpoint("md");
        assert_eq!(result, Ok("768px".to_string()));
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
        let mut resolver = ThemeResolver::default();
        
        // First call - miss
        let _ = resolver.resolve_color("blue-600");
        
        // Second call - hit
        let result = resolver.resolve_color("blue-600");
        assert!(result.is_ok());
    }
}
