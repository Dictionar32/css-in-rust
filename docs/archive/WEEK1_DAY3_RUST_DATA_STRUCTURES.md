# Week 1, Day 3: Rust Data Structures Design

**Date**: June 9, 2026  
**Phase**: Phase 1 - Week 1, Day 3  
**Task**: Design all core Rust data structures  
**Duration**: 4 hours  
**Status**: 🚀 IN PROGRESS

---

## Overview

Design optimal Rust data structures for:
1. Class parsing (`ParsedClass`)
2. Theme configuration (`ThemeConfig`)
3. Resolved values (`ResolvedValue`)
4. CSS rules (`CssRule`)
5. Error handling (`CssGeneratorError`)
6. Cache keys (`CacheKey`)

---

## Part 1: Core Domain Models

### 1.1 ParsedClass - Main Data Structure

**Purpose**: Represent a parsed Tailwind class

```rust
/// Represents a parsed Tailwind class
/// Example: "hover:bg-blue-600/50" →
/// ParsedClass {
///   prefix: "bg",
///   value: "blue-600",
///   variant: Some("hover"),
///   modifier: Some("50"),
///   arbitrary: false,
/// }
#[derive(Debug, Clone, Hash, Eq, PartialEq, Serialize, Deserialize)]
pub struct ParsedClass {
    /// Property prefix: "px", "bg", "text", "flex", etc.
    pub prefix: String,
    
    /// Value after prefix: "4", "blue-600", "center", etc.
    pub value: String,
    
    /// Optional variant: "hover", "md:", "dark:", "group-hover:", etc.
    pub variant: Option<String>,
    
    /// Optional modifier: "50" (for opacity), etc.
    pub modifier: Option<String>,
    
    /// Whether this is an arbitrary value: [width:100px]
    pub arbitrary: bool,
    
    /// Original class string (for error reporting)
    pub original: String,
}

impl ParsedClass {
    /// Create a new ParsedClass
    pub fn new(prefix: String, value: String) -> Self {
        ParsedClass {
            original: format!("{}-{}", prefix, value),
            prefix,
            value,
            variant: None,
            modifier: None,
            arbitrary: false,
        }
    }
    
    /// Builder method: set variant
    pub fn with_variant(mut self, variant: impl Into<String>) -> Self {
        self.variant = Some(variant.into());
        self
    }
    
    /// Builder method: set modifier
    pub fn with_modifier(mut self, modifier: impl Into<String>) -> Self {
        self.modifier = Some(modifier.into());
        self
    }
    
    /// Builder method: mark as arbitrary
    pub fn arbitrary(mut self) -> Self {
        self.arbitrary = true;
        self
    }
    
    /// Get cache key for this class (for caching)
    pub fn cache_key(&self) -> String {
        let mut key = format!("{}-{}", self.prefix, self.value);
        if let Some(ref v) = self.variant {
            key.push_str(&format!("_{}", v));
        }
        if let Some(ref m) = self.modifier {
            key.push_str(&format!("_{}", m));
        }
        key
    }
    
    /// Check if this class is a pseudo-class variant
    pub fn is_pseudo_class(&self) -> bool {
        matches!(self.variant.as_ref().map(|v| v.as_str()), 
            Some("hover" | "focus" | "active" | "disabled" | "visited" | 
                 "checked" | "indeterminate" | "placeholder" | "autofill"))
    }
    
    /// Check if this class is a responsive variant
    pub fn is_responsive(&self) -> bool {
        matches!(self.variant.as_ref().map(|v| v.as_str()), 
            Some("sm" | "md" | "lg" | "xl" | "2xl"))
    }
}
```

---

### 1.2 Variant Type - Strongly-Typed Variants

**Purpose**: Represent different Tailwind variant types

```rust
/// All possible Tailwind variants
#[derive(Debug, Clone, Hash, Eq, PartialEq, Serialize, Deserialize)]
pub enum Variant {
    /// Pseudo-class: hover, focus, active, etc.
    PseudoClass(PseudoClass),
    
    /// Responsive breakpoint: sm, md, lg, xl, 2xl
    Responsive(Breakpoint),
    
    /// Dark mode: dark
    Dark,
    
    /// Group variant: group-hover, group-focus, etc.
    Group(GroupVariant),
    
    /// Peer variant: peer-checked, peer-focus, etc.
    Peer(PeerVariant),
    
    /// Container query: @container, @container/name
    Container(Option<String>),
    
    /// Custom: any other variant
    Custom(String),
}

/// Pseudo-class variants
#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Serialize, Deserialize)]
pub enum PseudoClass {
    Hover,
    Focus,
    FocusVisible,
    Active,
    Disabled,
    Visited,
    Checked,
    Indeterminate,
    FirstChild,
    LastChild,
    OddChild,
    EvenChild,
}

/// Responsive breakpoints
#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Serialize, Deserialize)]
pub enum Breakpoint {
    Sm,   // 640px
    Md,   // 768px
    Lg,   // 1024px
    Xl,   // 1280px
    TwoXl, // 1536px
}

impl Breakpoint {
    pub fn min_width_px(&self) -> u32 {
        match self {
            Breakpoint::Sm => 640,
            Breakpoint::Md => 768,
            Breakpoint::Lg => 1024,
            Breakpoint::Xl => 1280,
            Breakpoint::TwoXl => 1536,
        }
    }
    
    pub fn media_query(&self) -> String {
        format!("@media (min-width: {}px)", self.min_width_px())
    }
}

/// Group variants
#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Serialize, Deserialize)]
pub enum GroupVariant {
    Hover,
    Focus,
}

/// Peer variants
#[derive(Debug, Clone, Copy, Hash, Eq, PartialEq, Serialize, Deserialize)]
pub enum PeerVariant {
    Checked,
    Focus,
}

impl Variant {
    /// Convert variant to CSS selector/rule
    pub fn to_css_selector(&self, original_selector: &str) -> String {
        match self {
            Variant::PseudoClass(pc) => format!("{}:{}", original_selector, pc.as_str()),
            Variant::Responsive(bp) => format!("{} {} {}", bp.media_query(), "{", original_selector),
            Variant::Dark => format!("@media (prefers-color-scheme: dark) {{ {} }}", original_selector),
            Variant::Group(_) => format!(".group:hover ~ {}", original_selector),
            Variant::Peer(_) => format!(".peer:checked ~ {}", original_selector),
            Variant::Container(name) => {
                match name {
                    Some(n) => format!("@container {} {{ {} }}", n, original_selector),
                    None => format!("@container {{ {} }}", original_selector),
                }
            }
            Variant::Custom(s) => format!("{} {}", s, original_selector),
        }
    }
}

impl PseudoClass {
    pub fn as_str(&self) -> &'static str {
        match self {
            PseudoClass::Hover => "hover",
            PseudoClass::Focus => "focus",
            PseudoClass::FocusVisible => "focus-visible",
            PseudoClass::Active => "active",
            PseudoClass::Disabled => "disabled",
            PseudoClass::Visited => "visited",
            PseudoClass::Checked => "checked",
            PseudoClass::Indeterminate => "indeterminate",
            PseudoClass::FirstChild => "first-child",
            PseudoClass::LastChild => "last-child",
            PseudoClass::OddChild => "nth-child(odd)",
            PseudoClass::EvenChild => "nth-child(even)",
        }
    }
}
```

---

### 1.3 ThemeConfig - Complete Theme Configuration

**Purpose**: Hold all Tailwind theme values

```rust
use std::collections::HashMap;

/// Complete Tailwind theme configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeConfig {
    /// Color palette: color_name -> (shade -> hex_value)
    /// Example: colors["blue"]["600"] = "#2563eb"
    pub colors: HashMap<String, HashMap<String, String>>,
    
    /// Spacing values: key -> value
    /// Example: spacing["4"] = "1rem"
    pub spacing: HashMap<String, String>,
    
    /// Font sizes: key -> (size, line-height)
    /// Example: fontSize["lg"] = ("1.125rem", "1.75rem")
    pub font_sizes: HashMap<String, (String, String)>,
    
    /// Font weights: key -> weight
    /// Example: fontWeight["bold"] = "700"
    pub font_weights: HashMap<String, String>,
    
    /// Line heights: key -> value
    /// Example: lineHeight["tight"] = "1.25"
    pub line_heights: HashMap<String, String>,
    
    /// Border radius: key -> value
    /// Example: borderRadius["lg"] = "0.5rem"
    pub border_radius: HashMap<String, String>,
    
    /// Width values: key -> value
    pub widths: HashMap<String, String>,
    
    /// Height values: key -> value
    pub heights: HashMap<String, String>,
    
    /// Z-index values: key -> value
    pub z_index: HashMap<String, String>,
    
    /// Opacity values: key -> value
    pub opacity: HashMap<String, String>,
    
    /// Shadow values: key -> value
    pub shadows: HashMap<String, String>,
    
    /// Breakpoints for responsive design
    pub breakpoints: HashMap<String, String>,
}

impl ThemeConfig {
    /// Create default Tailwind theme
    pub fn default() -> Self {
        ThemeConfig {
            colors: Self::default_colors(),
            spacing: Self::default_spacing(),
            font_sizes: Self::default_font_sizes(),
            font_weights: Self::default_font_weights(),
            line_heights: Self::default_line_heights(),
            border_radius: Self::default_border_radius(),
            widths: Self::default_widths(),
            heights: Self::default_heights(),
            z_index: Self::default_z_index(),
            opacity: Self::default_opacity(),
            shadows: Self::default_shadows(),
            breakpoints: Self::default_breakpoints(),
        }
    }
    
    /// Load theme from JSON string
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }
    
    /// Get color value: colors["blue"]["600"] = "#2563eb"
    pub fn get_color(&self, color: &str, shade: &str) -> Option<String> {
        self.colors
            .get(color)
            .and_then(|shades| shades.get(shade).cloned())
    }
    
    /// Get spacing value: spacing["4"] = "1rem"
    pub fn get_spacing(&self, key: &str) -> Option<String> {
        self.spacing.get(key).cloned()
    }
    
    /// Get font size: fontSize["lg"] = ("1.125rem", "1.75rem")
    pub fn get_font_size(&self, key: &str) -> Option<(String, String)> {
        self.font_sizes.get(key).cloned()
    }
    
    /// Get shadow value
    pub fn get_shadow(&self, key: &str) -> Option<String> {
        self.shadows.get(key).cloned()
    }
    
    // ... default_*() methods for each theme section
    
    fn default_colors() -> HashMap<String, HashMap<String, String>> {
        // Implement Tailwind default colors
        let mut colors = HashMap::new();
        
        // Blue color palette
        let mut blue = HashMap::new();
        blue.insert("50".to_string(), "#eff6ff".to_string());
        blue.insert("100".to_string(), "#dbeafe".to_string());
        blue.insert("200".to_string(), "#bfdbfe".to_string());
        blue.insert("300".to_string(), "#93c5fd".to_string());
        blue.insert("400".to_string(), "#60a5fa".to_string());
        blue.insert("500".to_string(), "#3b82f6".to_string());
        blue.insert("600".to_string(), "#2563eb".to_string());
        blue.insert("700".to_string(), "#1d4ed8".to_string());
        blue.insert("800".to_string(), "#1e40af".to_string());
        blue.insert("900".to_string(), "#1e3a8a".to_string());
        blue.insert("950".to_string(), "#172554".to_string());
        
        colors.insert("blue".to_string(), blue);
        
        // ... add other colors (slate, gray, red, green, etc.)
        
        colors
    }
    
    fn default_spacing() -> HashMap<String, String> {
        let mut spacing = HashMap::new();
        spacing.insert("0".to_string(), "0px".to_string());
        spacing.insert("1".to_string(), "0.25rem".to_string());
        spacing.insert("2".to_string(), "0.5rem".to_string());
        spacing.insert("3".to_string(), "0.75rem".to_string());
        spacing.insert("4".to_string(), "1rem".to_string());
        spacing.insert("5".to_string(), "1.25rem".to_string());
        spacing.insert("6".to_string(), "1.5rem".to_string());
        spacing.insert("8".to_string(), "2rem".to_string());
        spacing.insert("auto".to_string(), "auto".to_string());
        // ... etc
        spacing
    }
    
    // ... other default_*() methods
}
```

---

### 1.4 ResolvedValue - Compiled CSS Value

**Purpose**: Represent a resolved CSS value with all info

```rust
/// A resolved CSS value ready for CSS generation
#[derive(Debug, Clone)]
pub struct ResolvedValue {
    /// CSS property name: "background-color", "padding-left", etc.
    pub property: String,
    
    /// CSS value: "#2563eb", "1rem", "center", etc.
    pub value: String,
    
    /// Vendor prefixes needed: ["-webkit-", "-moz-"]
    pub vendor_prefixes: Vec<String>,
    
    /// Whether this is a shorthand property
    pub is_shorthand: bool,
    
    /// If shorthand, the expanded properties
    pub expanded_properties: Vec<(String, String)>,
}

impl ResolvedValue {
    pub fn new(property: String, value: String) -> Self {
        ResolvedValue {
            property,
            value,
            vendor_prefixes: vec![],
            is_shorthand: false,
            expanded_properties: vec![],
        }
    }
    
    /// Generate CSS declaration: "background-color: #2563eb;"
    pub fn to_css_declaration(&self) -> String {
        format!("{}: {};", self.property, self.value)
    }
    
    /// Generate CSS with all vendor prefixes
    pub fn to_css_with_prefixes(&self) -> Vec<String> {
        let mut declarations = vec![self.to_css_declaration()];
        
        for prefix in &self.vendor_prefixes {
            declarations.push(format!("{}{}: {};", prefix, self.property, self.value));
        }
        
        declarations
    }
}
```

---

### 1.5 CssRule - Complete CSS Rule

**Purpose**: Represent a complete CSS rule ready to emit

```rust
/// A complete CSS rule
#[derive(Debug, Clone)]
pub struct CssRule {
    /// CSS selector: ".px-4", ".hover\:bg-blue-600", etc.
    pub selector: String,
    
    /// CSS declarations: [("padding-left", "1rem"), ("padding-right", "1rem")]
    pub declarations: Vec<(String, String)>,
    
    /// Optional media query wrapper
    pub media_query: Option<String>,
    
    /// Whether to escape selector
    pub escaped: bool,
}

impl CssRule {
    pub fn new(selector: String) -> Self {
        CssRule {
            selector,
            declarations: vec![],
            media_query: None,
            escaped: false,
        }
    }
    
    /// Add a declaration
    pub fn add_declaration(&mut self, property: String, value: String) {
        self.declarations.push((property, value));
    }
    
    /// Wrap in media query
    pub fn with_media_query(mut self, query: String) -> Self {
        self.media_query = Some(query);
        self
    }
    
    /// Generate CSS rule string
    pub fn to_css_string(&self) -> String {
        let mut css = format!("{} {{\n", self.selector);
        
        for (prop, val) in &self.declarations {
            css.push_str(&format!("  {}: {};\n", prop, val));
        }
        
        css.push('}');
        
        if let Some(ref media) = self.media_query {
            css = format!("{} {{\n{}\n}}", media, css);
        }
        
        css
    }
    
    /// Generate minified CSS rule
    pub fn to_css_minified(&self) -> String {
        let mut css = format!("{} {{", self.selector);
        
        for (prop, val) in &self.declarations {
            css.push_str(&format!("{}:{};"
, prop, val));
        }
        
        css.push('}');
        
        if let Some(ref media) = self.media_query {
            css = format!("{} {{{}}}", media, css);
        }
        
        css
    }
}
```

---

### 1.6 Error Types - Comprehensive Error Handling

**Purpose**: All possible error types

```rust
use std::fmt;

/// All possible CSS generation errors
#[derive(Debug, Clone)]
pub enum CssGeneratorError {
    /// Invalid class syntax
    InvalidClass {
        class: String,
        reason: String,
    },
    
    /// Theme value not found
    ThemeValueNotFound {
        category: String, // "colors", "spacing", etc.
        key: String,
    },
    
    /// Invalid theme configuration
    InvalidTheme {
        reason: String,
    },
    
    /// Arbitrary value validation failed
    ArbitraryValueInvalid {
        value: String,
        reason: String,
    },
    
    /// Unsupported pattern (will fall back to JS)
    UnsupportedPattern {
        pattern: String,
    },
    
    /// Internal error
    InternalError {
        message: String,
    },
}

impl fmt::Display for CssGeneratorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CssGeneratorError::InvalidClass { class, reason } => {
                write!(f, "Invalid class '{}': {}", class, reason)
            }
            CssGeneratorError::ThemeValueNotFound { category, key } => {
                write!(f, "{} value not found: {}", category, key)
            }
            CssGeneratorError::InvalidTheme { reason } => {
                write!(f, "Invalid theme: {}", reason)
            }
            CssGeneratorError::ArbitraryValueInvalid { value, reason } => {
                write!(f, "Arbitrary value invalid '{}': {}", value, reason)
            }
            CssGeneratorError::UnsupportedPattern { pattern } => {
                write!(f, "Unsupported pattern: {}", pattern)
            }
            CssGeneratorError::InternalError { message } => {
                write!(f, "Internal error: {}", message)
            }
        }
    }
}

impl std::error::Error for CssGeneratorError {}

impl From<serde_json::Error> for CssGeneratorError {
    fn from(err: serde_json::Error) -> Self {
        CssGeneratorError::InvalidTheme {
            reason: err.to_string(),
        }
    }
}
```

---

### 1.7 CacheKey - For Result Caching

**Purpose**: Efficient cache key generation

```rust
use std::hash::{Hash, Hasher};
use std::collections::hash_map::DefaultHasher;

/// Cache key for CSS generation results
#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub struct CacheKey {
    /// Sorted, deduplicated classes
    classes: Vec<String>,
    
    /// Configuration flags (minify, etc.)
    flags: u8,
}

impl CacheKey {
    pub fn new(classes: &[String], minify: bool) -> Self {
        let mut sorted_classes = classes.to_vec();
        sorted_classes.sort();
        sorted_classes.dedup();
        
        let mut flags = 0u8;
        if minify {
            flags |= 0x01;
        }
        
        CacheKey {
            classes: sorted_classes,
            flags,
        }
    }
    
    /// Generate hash for fast lookups
    pub fn hash_value(&self) -> u64 {
        let mut hasher = DefaultHasher::new();
        self.hash(&mut hasher);
        hasher.finish()
    }
    
    /// Generate string key
    pub fn as_string(&self) -> String {
        format!("{}|{}", self.classes.join(","), self.flags)
    }
}
```

---

## Part 2: Trait Definitions

### 2.1 Parser Trait

**Purpose**: Define interface for class parsing

```rust
pub trait ClassParser {
    /// Parse a single class string
    fn parse(&self, class: &str) -> Result<ParsedClass, CssGeneratorError>;
    
    /// Parse multiple classes
    fn parse_batch(&self, classes: &[String]) -> Result<Vec<ParsedClass>, CssGeneratorError>;
    
    /// Validate if class syntax is supported
    fn is_supported(&self, class: &str) -> bool;
}
```

### 2.2 Resolver Trait

**Purpose**: Define interface for theme resolution

```rust
pub trait ThemeResolver {
    /// Resolve a parsed class to CSS value
    fn resolve(&self, parsed: &ParsedClass) -> Result<ResolvedValue, CssGeneratorError>;
    
    /// Batch resolve
    fn resolve_batch(&self, parsed: &[ParsedClass]) -> Result<Vec<ResolvedValue>, CssGeneratorError>;
}
```

### 2.3 RuleGenerator Trait

**Purpose**: Define interface for CSS rule generation

```rust
pub trait RuleGenerator {
    /// Generate CSS rule from parsed class and resolved value
    fn generate(&self, parsed: &ParsedClass, resolved: &ResolvedValue) -> Result<CssRule, CssGeneratorError>;
    
    /// Batch generate
    fn generate_batch(&self, parsed: &[ParsedClass], resolved: &[ResolvedValue]) -> Result<Vec<CssRule>, CssGeneratorError>;
}
```

---

## Part 3: Builder Pattern for Complex Objects

### 3.1 CssGeneratorBuilder

**Purpose**: Fluent API for creating CSS generator

```rust
pub struct CssGeneratorBuilder {
    theme: Option<ThemeConfig>,
    minify: bool,
    enable_cache: bool,
    cache_size: usize,
}

impl CssGeneratorBuilder {
    pub fn new() -> Self {
        CssGeneratorBuilder {
            theme: None,
            minify: true,
            enable_cache: true,
            cache_size: 100,
        }
    }
    
    pub fn with_theme(mut self, theme: ThemeConfig) -> Self {
        self.theme = Some(theme);
        self
    }
    
    pub fn minify(mut self, enabled: bool) -> Self {
        self.minify = enabled;
        self
    }
    
    pub fn cache(mut self, enabled: bool) -> Self {
        self.enable_cache = enabled;
        self
    }
    
    pub fn cache_size(mut self, size: usize) -> Self {
        self.cache_size = size;
        self
    }
    
    pub fn build(self) -> Result<CssGenerator, CssGeneratorError> {
        let theme = self.theme.ok_or_else(|| CssGeneratorError::InvalidTheme {
            reason: "Theme is required".to_string(),
        })?;
        
        Ok(CssGenerator {
            theme,
            minify: self.minify,
            enable_cache: self.enable_cache,
            cache: Default::default(),
        })
    }
}
```

---

## Summary: Data Structure Hierarchy

```
ParsedClass (input)
    ├─ String: prefix, value, variant, modifier
    ├─ bool: arbitrary
    └─ String: original

Variant (strongly-typed)
    ├─ PseudoClass
    ├─ Responsive(Breakpoint)
    ├─ Dark
    ├─ Group(GroupVariant)
    ├─ Peer(PeerVariant)
    └─ Container(Option<String>)

ThemeConfig (lookup table)
    ├─ colors: HashMap<String, HashMap<String, String>>
    ├─ spacing: HashMap<String, String>
    ├─ font_sizes: HashMap<String, (String, String)>
    └─ ... (more theme properties)

ResolvedValue (intermediate)
    ├─ String: property, value
    ├─ Vec<String>: vendor_prefixes
    └─ Vec<(String, String)>: expanded_properties

CssRule (output)
    ├─ String: selector
    ├─ Vec<(String, String)>: declarations
    ├─ Option<String>: media_query
    └─ bool: escaped

CacheKey (for optimization)
    ├─ Vec<String>: sorted classes
    └─ u8: flags
```

---

## Implementation Details

### File Structure

```
native/src/domain/
├─ mod.rs (exports)
├─ parsed_class.rs (ParsedClass)
├─ variant.rs (Variant, Breakpoint, etc.)
├─ theme_config.rs (ThemeConfig)
├─ resolved_value.rs (ResolvedValue)
├─ css_rule.rs (CssRule)
└─ error.rs (CssGeneratorError)

native/src/application/
├─ traits.rs (ClassParser, ThemeResolver, RuleGenerator)
└─ builder.rs (CssGeneratorBuilder)
```

### Key Design Decisions

1. **Strong Typing**: Use enums for variants/breakpoints instead of strings
   - Benefit: Type-safe, compile-time validation
   - Cost: More code upfront

2. **Builder Pattern**: Use for complex objects
   - Benefit: Fluent API, sensible defaults
   - Cost: Extra indirection

3. **Error Handling**: Use Result<T, CssGeneratorError>
   - Benefit: Explicit error handling
   - Cost: Requires error handling at call sites

4. **Traits**: Define interfaces for components
   - Benefit: Testable, pluggable
   - Cost: Extra abstraction

---

## Testing Strategy for These Structures

```rust
#[test]
fn test_parsed_class_creation() {
    let pc = ParsedClass::new("px".to_string(), "4".to_string())
        .with_variant("hover")
        .with_modifier("50");
    
    assert_eq!(pc.prefix, "px");
    assert_eq!(pc.value, "4");
    assert_eq!(pc.variant, Some("hover".to_string()));
    assert_eq!(pc.modifier, Some("50".to_string()));
}

#[test]
fn test_theme_color_lookup() {
    let theme = ThemeConfig::default();
    let color = theme.get_color("blue", "600");
    assert_eq!(color, Some("#2563eb".to_string()));
}

#[test]
fn test_css_rule_generation() {
    let mut rule = CssRule::new(".px-4".to_string());
    rule.add_declaration("padding-left".to_string(), "1rem".to_string());
    rule.add_declaration("padding-right".to_string(), "1rem".to_string());
    
    let css = rule.to_css_minified();
    assert!(css.contains("padding-left:1rem"));
    assert!(css.contains("padding-right:1rem"));
}

#[test]
fn test_cache_key_generation() {
    let classes = vec!["px-4".to_string(), "py-2".to_string()];
    let key = CacheKey::new(&classes, true);
    assert_eq!(key.as_string(), "px-4,py-2|1");
}
```

---

## Next Steps: Day 4

**NAPI FFI Bridge Design** (4 hours):
- Design TypeScript ↔ Rust marshalling
- Plan error serialization
- Plan async/await handling
- Design performance optimizations

---

## Deliverables: Day 3

✅ Complete Rust data structure design
✅ Type-safe enums and structs
✅ Error handling framework
✅ Builder pattern implementations
✅ Trait definitions
✅ Test strategy

**File**: `/native/src/domain/` (to be implemented Week 1, Day 6-7)

---

**Document Status**: Complete  
**Date**: June 9, 2026  
**Next**: Day 4 - NAPI FFI Bridge Design
