//! String utilities for CSS handling

/// Escape special CSS characters in class names
///
/// Escapes characters that have special meaning in CSS selectors:
/// - `:` (used for pseudo-classes)
/// - `/` (used for modifiers)
/// - `[` and `]` (used for arbitrary values)
/// - ` ` (spaces)
/// - `(` and `)` (parentheses)
///
/// # Examples
/// ```
/// assert_eq!(escape_css_selector("hover:bg-blue/50"), "hover\\:bg-blue\\/50");
/// ```
pub fn escape_css_selector(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            ':' | '/' | '[' | ']' | ' ' | '(' | ')' | '{' | '}' | '.' | '#' | ',' => {
                format!("\\{}", c)
            }
            _ => c.to_string(),
        })
        .collect()
}

/// Unescape CSS-escaped characters
///
/// Reverses the escaping done by `escape_css_selector`
pub fn unescape_css_selector(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars().peekable();

    while let Some(c) = chars.next() {
        if c == '\\' {
            // Consume the next character literally
            if let Some(next) = chars.next() {
                result.push(next);
            }
        } else {
            result.push(c);
        }
    }

    result
}

/// Normalize a class name (lowercase, trim whitespace)
pub fn normalize_class_name(s: &str) -> String {
    s.trim().to_lowercase()
}

/// Convert underscores to spaces (used in arbitrary values)
///
/// Tailwind uses underscores as space substitutes in arbitrary values:
/// `[margin:1rem_2rem]` → `margin: 1rem 2rem`
pub fn convert_underscores_to_spaces(s: &str) -> String {
    s.replace('_', " ")
}

/// Convert spaces to underscores (inverse operation)
pub fn convert_spaces_to_underscores(s: &str) -> String {
    s.replace(' ', "_")
}

/// Parse an arbitrary value string (e.g., "width:200px" → ("width", "200px"))
///
/// # Returns
/// Tuple of (property, value) if successful, or error if no colon found
pub fn parse_arbitrary_value(s: &str) -> Result<(String, String), String> {
    if !s.contains(':') {
        return Err("Arbitrary value must contain a colon".to_string());
    }

    let parts: Vec<&str> = s.splitn(2, ':').collect();
    if parts.len() != 2 {
        return Err("Invalid arbitrary value format".to_string());
    }

    Ok((parts[0].to_string(), parts[1].to_string()))
}

/// Check if a string is a valid CSS identifier
pub fn is_valid_css_identifier(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }

    // CSS identifiers must start with a letter, underscore, or escaped character
    let first = s.chars().next().unwrap();
    if !first.is_ascii_alphabetic() && first != '_' && first != '\\' {
        return false;
    }

    // Rest can be alphanumeric, hyphen, underscore, or escaped
    for c in s.chars().skip(1) {
        if !c.is_ascii_alphanumeric() && c != '_' && c != '-' && c != '\\' {
            return false;
        }
    }

    true
}

/// Extract variable name from CSS variable syntax
///
/// # Examples
/// ```
/// assert_eq!(extract_var_name("var(--color-primary)"), Some("--color-primary"));
/// ```
pub fn extract_var_name(s: &str) -> Option<String> {
    if !s.starts_with("var(") || !s.ends_with(')') {
        return None;
    }

    let var_part = &s[4..s.len() - 1];
    if var_part.is_empty() {
        return None;
    }

    Some(var_part.to_string())
}

/// Convert hex color to RGBA components
///
/// # Examples
/// ```
/// assert_eq!(hex_to_rgb("#1e40af"), Ok((30, 64, 175)));
/// ```
pub fn hex_to_rgb(hex: &str) -> Result<(u8, u8, u8), String> {
    let hex = hex.trim_start_matches('#');

    if hex.len() != 6 && hex.len() != 3 {
        return Err("Invalid hex color format".to_string());
    }

    if hex.len() == 3 {
        // Expand shorthand: #abc → #aabbcc
        let expanded = format!(
            "{}{}{}{}{}{}",
            &hex[0..1], &hex[0..1], &hex[1..2], &hex[1..2], &hex[2..3], &hex[2..3]
        );
        return hex_to_rgb(&format!("#{}", expanded));
    }

    let r = u8::from_str_radix(&hex[0..2], 16)
        .map_err(|_| "Invalid hex color".to_string())?;
    let g = u8::from_str_radix(&hex[2..4], 16)
        .map_err(|_| "Invalid hex color".to_string())?;
    let b = u8::from_str_radix(&hex[4..6], 16)
        .map_err(|_| "Invalid hex color".to_string())?;

    Ok((r, g, b))
}

/// Convert RGB components to hex color
pub fn rgb_to_hex(r: u8, g: u8, b: u8) -> String {
    format!("#{:02x}{:02x}{:02x}", r, g, b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escape_css_selector() {
        assert_eq!(escape_css_selector("hover:bg"), "hover\\:bg");
        assert_eq!(escape_css_selector("bg-blue/50"), "bg-blue\\/50");
        assert_eq!(
            escape_css_selector("hover:bg-blue/50"),
            "hover\\:bg-blue\\/50"
        );
    }

    #[test]
    fn test_unescape_css_selector() {
        assert_eq!(unescape_css_selector("hover\\:bg"), "hover:bg");
        assert_eq!(unescape_css_selector("bg-blue\\/50"), "bg-blue/50");
    }

    #[test]
    fn test_round_trip_escape() {
        let original = "hover:bg-blue/50";
        let escaped = escape_css_selector(original);
        let unescaped = unescape_css_selector(&escaped);
        assert_eq!(unescaped, original);
    }

    #[test]
    fn test_normalize_class_name() {
        assert_eq!(normalize_class_name("  PX-4  "), "px-4");
        assert_eq!(normalize_class_name("BG-BLUE"), "bg-blue");
    }

    #[test]
    fn test_convert_underscores_to_spaces() {
        assert_eq!(
            convert_underscores_to_spaces("margin:1rem_2rem"),
            "margin:1rem 2rem"
        );
    }

    #[test]
    fn test_parse_arbitrary_value() {
        let (prop, val) = parse_arbitrary_value("width:200px").unwrap();
        assert_eq!(prop, "width");
        assert_eq!(val, "200px");

        let (prop, val) = parse_arbitrary_value("color:rgb(255,0,0)").unwrap();
        assert_eq!(prop, "color");
        assert_eq!(val, "rgb(255,0,0)");
    }

    #[test]
    fn test_parse_arbitrary_value_error() {
        assert!(parse_arbitrary_value("no-colon").is_err());
    }

    #[test]
    fn test_is_valid_css_identifier() {
        assert!(is_valid_css_identifier("myClass"));
        assert!(is_valid_css_identifier("_private"));
        assert!(is_valid_css_identifier("my-class"));
        assert!(!is_valid_css_identifier("123invalid"));
        assert!(!is_valid_css_identifier(""));
    }

    #[test]
    fn test_extract_var_name() {
        assert_eq!(
            extract_var_name("var(--color-primary)"),
            Some("--color-primary".to_string())
        );
        assert_eq!(extract_var_name("var(--bg)"), Some("--bg".to_string()));
        assert_eq!(extract_var_name("color: red"), None);
    }

    #[test]
    fn test_hex_to_rgb() {
        let (r, g, b) = hex_to_rgb("#1e40af").unwrap();
        assert_eq!(r, 30);
        assert_eq!(g, 64);
        assert_eq!(b, 175);
    }

    #[test]
    fn test_hex_to_rgb_short() {
        let (r, g, b) = hex_to_rgb("#fff").unwrap();
        assert_eq!(r, 255);
        assert_eq!(g, 255);
        assert_eq!(b, 255);
    }

    #[test]
    fn test_rgb_to_hex() {
        assert_eq!(rgb_to_hex(30, 64, 175), "#1e40af");
        assert_eq!(rgb_to_hex(255, 0, 0), "#ff0000");
    }

    #[test]
    fn test_hex_rgb_round_trip() {
        let original = "#1e40af";
        let (r, g, b) = hex_to_rgb(original).unwrap();
        let converted = rgb_to_hex(r, g, b);
        assert_eq!(converted, original);
    }
}
