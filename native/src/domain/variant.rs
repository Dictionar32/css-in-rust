//! Variant - represents Tailwind class variants (responsive, state, dark mode, etc.)

use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

/// Represents a Tailwind class variant
///
/// Variants modify how CSS rules are generated:
/// - Responsive: media queries for different breakpoints
/// - State: pseudo-classes like :hover, :focus
/// - ColorScheme: dark mode or light mode
/// - GroupRelative: .group:hover & selector context
/// - PeerRelative: .peer:focus ~ & selector context
/// - Custom: plugin-defined variants
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Variant {
    /// Responsive breakpoint (sm, md, lg, xl, 2xl, etc.)
    Responsive(String),

    /// State/interaction (:hover, :focus, :active, :disabled, etc.)
    State(String),

    /// Color scheme (dark, light)
    ColorScheme(String),

    /// Group-relative variant (.group:hover & selector)
    GroupRelative(String),

    /// Peer-relative variant (.peer:focus ~ & selector)
    PeerRelative(String),

    /// Custom variant (plugin-defined)
    Custom(String),
}

impl Variant {
    /// Get the variant name as a string (e.g., "hover", "md", "dark")
    pub fn name(&self) -> &str {
        match self {
            Variant::Responsive(s) => s,
            Variant::State(s) => s,
            Variant::ColorScheme(s) => s,
            Variant::GroupRelative(s) => s,
            Variant::PeerRelative(s) => s,
            Variant::Custom(s) => s,
        }
    }

    /// Get the type of variant as a string (e.g., "Responsive", "State")
    pub fn variant_type(&self) -> &str {
        match self {
            Variant::Responsive(_) => "Responsive",
            Variant::State(_) => "State",
            Variant::ColorScheme(_) => "ColorScheme",
            Variant::GroupRelative(_) => "GroupRelative",
            Variant::PeerRelative(_) => "PeerRelative",
            Variant::Custom(_) => "Custom",
        }
    }

    /// Convert variant to CSS selector/media query component
    pub fn to_css_component(&self) -> String {
        match self {
            Variant::Responsive(name) => {
                // Will be converted to media query by CSS generator
                format!("@media-{}", name)
            }
            Variant::State(name) => format!(":{}", name),
            Variant::ColorScheme(scheme) => {
                if scheme == "dark" {
                    "@dark".to_string()
                } else {
                    "@light".to_string()
                }
            }
            Variant::GroupRelative(_) => ".group:hover &".to_string(),
            Variant::PeerRelative(_) => ".peer:focus ~ &".to_string(),
            Variant::Custom(name) => format!("@custom-{}", name),
        }
    }

    /// Check if this variant is a responsive variant
    pub fn is_responsive(&self) -> bool {
        matches!(self, Variant::Responsive(_))
    }

    /// Check if this variant is a state variant
    pub fn is_state(&self) -> bool {
        matches!(self, Variant::State(_))
    }

    /// Check if this variant is a color scheme variant
    pub fn is_color_scheme(&self) -> bool {
        matches!(self, Variant::ColorScheme(_))
    }

    /// Check if this variant is group-relative
    pub fn is_group_relative(&self) -> bool {
        matches!(self, Variant::GroupRelative(_))
    }

    /// Check if this variant is peer-relative
    pub fn is_peer_relative(&self) -> bool {
        matches!(self, Variant::PeerRelative(_))
    }
}

impl fmt::Display for Variant {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Variant::Responsive(s) => write!(f, "{}", s),
            Variant::State(s) => write!(f, "{}", s),
            Variant::ColorScheme(s) => write!(f, "{}", s),
            Variant::GroupRelative(s) => write!(f, "group-{}", s),
            Variant::PeerRelative(s) => write!(f, "peer-{}", s),
            Variant::Custom(s) => write!(f, "{}", s),
        }
    }
}

impl FromStr for Variant {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let lower = s.to_lowercase();

        // Check for known responsive variants
        match lower.as_str() {
            "sm" | "md" | "lg" | "xl" | "2xl" => return Ok(Variant::Responsive(lower)),
            _ => {}
        }

        // Check for known state variants
        match lower.as_str() {
            "hover" | "focus" | "active" | "disabled" | "focus-within" | "focus-visible"
            | "visited" | "target" | "enabled" | "read-only" | "placeholder-shown"
            | "checked" | "default" | "valid" | "invalid" | "in-range" | "out-of-range"
            | "required" | "optional" | "user-valid" | "user-invalid" | "first" | "last"
            | "only" | "odd" | "even" | "first-of-type" | "last-of-type" | "only-of-type"
            | "empty" | "root" | "where" | "any" | "is" | "has" => return Ok(Variant::State(lower)),
            _ => {}
        }

        // Check for color scheme variants
        match lower.as_str() {
            "dark" | "light" => return Ok(Variant::ColorScheme(lower)),
            _ => {}
        }

        // Check for group/peer variants
        if lower.starts_with("group-") {
            return Ok(Variant::GroupRelative(lower[6..].to_string()));
        }
        if lower.starts_with("peer-") {
            return Ok(Variant::PeerRelative(lower[5..].to_string()));
        }

        // Check for custom breakpoints or unknown - treat as custom
        if lower.contains("xl") || lower.contains("sm") || lower.contains("md") || lower.contains("lg")
        {
            return Ok(Variant::Responsive(lower));
        }

        // Default: treat as custom variant (plugin-defined)
        Ok(Variant::Custom(lower))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_variant_responsive() {
        let v = Variant::Responsive("md".to_string());
        assert_eq!(v.name(), "md");
        assert_eq!(v.variant_type(), "Responsive");
        assert!(v.is_responsive());
    }

    #[test]
    fn test_variant_state() {
        let v = Variant::State("hover".to_string());
        assert_eq!(v.name(), "hover");
        assert_eq!(v.variant_type(), "State");
        assert!(v.is_state());
        assert_eq!(v.to_css_component(), ":hover");
    }

    #[test]
    fn test_variant_color_scheme() {
        let v = Variant::ColorScheme("dark".to_string());
        assert!(v.is_color_scheme());
        assert_eq!(v.variant_type(), "ColorScheme");
    }

    #[test]
    fn test_variant_from_str() {
        let v: Variant = "hover".parse().unwrap();
        assert_eq!(v, Variant::State("hover".to_string()));

        let v: Variant = "md".parse().unwrap();
        assert_eq!(v, Variant::Responsive("md".to_string()));

        let v: Variant = "dark".parse().unwrap();
        assert_eq!(v, Variant::ColorScheme("dark".to_string()));
    }

    #[test]
    fn test_variant_group_relative() {
        let v: Variant = "group-hover".parse().unwrap();
        assert_eq!(v, Variant::GroupRelative("hover".to_string()));
    }

    #[test]
    fn test_variant_peer_relative() {
        let v: Variant = "peer-focus".parse().unwrap();
        assert_eq!(v, Variant::PeerRelative("focus".to_string()));
    }

    #[test]
    fn test_variant_display() {
        let v = Variant::State("hover".to_string());
        assert_eq!(v.to_string(), "hover");

        let v = Variant::GroupRelative("hover".to_string());
        assert_eq!(v.to_string(), "group-hover");
    }

    #[test]
    fn test_custom_variant() {
        let v: Variant = "custom-modifier".parse().unwrap();
        assert_eq!(v.variant_type(), "Custom");
    }
}
