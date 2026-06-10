# Design Document: Rust CSS Compiler Engine

## Overview

The Rust CSS Compiler Engine is a high-performance replacement for the Tailwind CSS v4 JavaScript engine. It transforms Tailwind class lists into valid CSS rules with 40-60% faster performance while maintaining 99% feature parity with Tailwind v4.

**Key Objectives**:
- Replace 150ms Tailwind JS compilation bottleneck with ~60-90ms Rust implementation
- Achieve 99% CSS output parity with Tailwind v4
- Provide seamless Node.js integration via NAPI bindings
- Support full Tailwind class syntax (variants, modifiers, arbitrary values)
- Enable incremental compilation and efficient caching
- Maintain graceful fallback to JavaScript for edge cases

**Performance Target**: 100 classes compiled in <100ms (40-60% improvement over Tailwind JS baseline)

---

## Architecture Overview

### High-Level Data Flow

```
Input: Class List + Theme Config
        ↓
   ┌────────────────────────────────┐
   │     CLASS PARSER               │  Parse "hover:md:bg-blue-600/50"
   │  • Tokenize variants           │  → Variants: [hover, md]
   │  • Extract prefix/value        │  → Prefix: bg
   │  • Parse modifiers             │  → Value: blue-600
   │  • Handle arbitrary values     │  → Modifier: 50
   └────────────────────────────────┘
        ↓
   ┌────────────────────────────────┐
   │    THEME RESOLVER              │  Lookup "bg-blue-600"
   │  • Traverse theme structure    │  → "#1e40af"
   │  • Apply custom themes         │  → Apply opacity: rgba(30, 64, 175, 0.5)
   │  • Handle arbitrary values     │
   └────────────────────────────────┘
        ↓
   ┌────────────────────────────────┐
   │   VARIANT SYSTEM               │  Resolve variants:
   │  • Responsive media queries    │  • md → "@media (min-width: 768px)"
   │  • State pseudo-classes        │  • hover → ":hover"
   │  • Dark mode selectors         │  • Compose: "&:hover"
   │  • Group/peer combinators      │
   └────────────────────────────────┘
        ↓
   ┌────────────────────────────────┐
   │    CSS GENERATOR               │  Generate CSS rule:
   │  • Build selectors             │  @media (min-width: 768px) {
   │  • Build declarations          │    .md\:hover\:bg-blue-600\/50:hover {
   │  • Nest media queries          │      background-color: rgba(30, 64, 175, 0.5);
   │  • Escape class names          │    }
   └────────────────────────────────┘  }
        ↓
   ┌────────────────────────────────┐
   │    CACHE MANAGER               │  Cache key: "hover,md,bg,blue-600,50"
   │  • LRU eviction policy         │  → Store CSS in memory
   │  • Deterministic key gen       │
   └────────────────────────────────┘
        ↓
Output: Valid CSS String + Cache Status
```

### Module Organization

```
rust-css-compiler-engine/
├── native/src/
│   ├── lib.rs                          # Rust crate root, NAPI exports
│   ├── domain/
│   │   ├── parsed_class.rs             # ParsedClass struct
│   │   ├── theme_config.rs             # ThemeConfig, theme resolution
│   │   ├── css_rule.rs                 # CssRule struct, CSS generation
│   │   ├── variant.rs                  # Variant types, composition logic
│   │   └── error.rs                    # Error types and handling
│   ├── application/
│   │   ├── class_parser.rs             # ClassParser implementation
│   │   ├── theme_resolver.rs           # ThemeResolver implementation
│   │   ├── css_generator.rs            # CssGenerator implementation
│   │   └── variant_system.rs           # VariantSystem implementation
│   ├── infrastructure/
│   │   ├── cache.rs                    # LRU cache implementation
│   │   └── napi_bridge.rs              # NAPI binding exports
│   ├── utils/
│   │   ├── string_utils.rs             # CSS escaping, string operations
│   │   ├── regex_patterns.rs           # Pre-compiled regex for parsing
│   │   └── constants.rs                # Magic numbers, default theme
│   └── Cargo.toml
├── packages/domain/compiler/src/
│   ├── cssGeneratorNative.ts           # TypeScript wrapper for NAPI
│   ├── nativeBridge.ts                 # NAPI binding interface
│   └── tailwindEngine.ts               # Integration with existing pipeline
├── tests/
│   ├── integration_tests.rs            # NAPI integration tests
│   ├── property_tests.rs               # Property-based tests
│   └── fixtures/
│       ├── test_classes.json           # Representative class test sets
│       ├── test_themes.json            # Custom theme configurations
│       └── expected_output.json        # Snapshot expectations
└── benches/
    ├── class_parser.rs                 # Parsing performance benchmarks
    ├── css_generation.rs               # Generation performance benchmarks
    └── end_to_end.rs                   # Full pipeline benchmarks
```

### Module Responsibilities

| Module | Responsibility | Input | Output |
|--------|-----------------|-------|--------|
| **ClassParser** | Tokenize & validate class syntax | String (e.g., "hover:bg-blue-600/50") | ParsedClass struct |
| **ThemeResolver** | Look up theme values, handle custom themes | ParsedClass + ThemeConfig | CssValue (hex/rgb string) |
| **CssGenerator** | Generate CSS selectors & declarations | ParsedClass + CssValue + Variants | CssRule string |
| **VariantSystem** | Resolve responsive/state/dark variants | Variants list | Media queries, pseudo-classes, selectors |
| **CacheManager** | Store/retrieve compiled results | Cache key + CSS result | Cached CSS string or miss signal |
| **NapiBridge** | Marshal Rust to Node.js | JavaScript types | JavaScript types |

---

## Core Data Structures

### ParsedClass Structure

```rust
/// Represents a fully parsed Tailwind class
#[derive(Debug, Clone)]
pub struct ParsedClass {
    /// Original input class string
    pub original: String,
    
    /// Variants applied (e.g., ["hover", "md", "dark"])
    pub variants: Vec<Variant>,
    
    /// Prefix/utility type (e.g., "bg", "px", "text")
    pub prefix: String,
    
    /// Base value (e.g., "blue", "600", "lg")
    pub value: String,
    
    /// Modifier (e.g., "50" for opacity in "bg-blue-600/50")
    pub modifier: Option<String>,
    
    /// Whether this is an arbitrary value (e.g., "[width:123px]")
    pub is_arbitrary: bool,
    
    /// Arbitrary CSS declaration if is_arbitrary=true
    pub arbitrary_declaration: Option<String>,
}

impl ParsedClass {
    /// Parse a single class string
    pub fn parse(class: &str) -> Result<Self, ParseError> {
        // Split by ":" to extract variants
        // Parse final segment: "prefix-value/modifier"
        // Handle arbitrary syntax: "[...]"
        // Validate against known patterns
        unimplemented!()
    }
}
```

### Variant Type

```rust
/// Represents a class variant
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Variant {
    /// Responsive breakpoint (sm, md, lg, xl, 2xl, etc.)
    Responsive(String),
    
    /// State/interaction (:hover, :focus, :active, :disabled, etc.)
    State(String),
    
    /// Color scheme (dark:, light:)
    ColorScheme(String),
    
    /// Group-relative variant (.group:hover & selector)
    GroupRelative(String),
    
    /// Peer-relative variant (.peer:focus ~ & selector)
    PeerRelative(String),
    
    /// Custom variant (plugin-defined)
    Custom(String),
}

impl Variant {
    /// Convert variant to CSS selector/media query component
    pub fn to_css(&self, config: &ThemeConfig) -> CssVariantComponent {
        match self {
            Variant::Responsive(name) => {
                let breakpoint = config.breakpoints.get(name)?;
                CssVariantComponent::MediaQuery(format!("@media (min-width: {})", breakpoint))
            },
            Variant::State(name) => {
                CssVariantComponent::Selector(format!(":{}",name))
            },
            Variant::ColorScheme(scheme) => {
                if config.dark_mode == DarkModeStrategy::Class {
                    CssVariantComponent::SelectorPrefix(".dark".to_string())
                } else {
                    CssVariantComponent::MediaQuery("@media (prefers-color-scheme: dark)".to_string())
                }
            },
            // ... other variants
        }
    }
}
```

### CssRule Structure

```rust
/// Represents a generated CSS rule
#[derive(Debug, Clone)]
pub struct CssRule {
    /// CSS selector (e.g., ".hover\:bg-blue-600:hover")
    pub selector: String,
    
    /// CSS declarations (e.g., "background-color: #1e40af;")
    pub declarations: Vec<CssDeclaration>,
    
    /// Media queries wrapping this rule (if responsive)
    pub media_queries: Vec<String>,
    
    /// Specificity level (for deduplication/ordering)
    pub specificity: u32,
}

pub struct CssDeclaration {
    pub property: String,
    pub value: String,
}

impl CssRule {
    /// Generate CSS output with proper nesting
    pub fn to_css_string(&self) -> String {
        let declarations = self.declarations
            .iter()
            .map(|d| format!("  {}: {};", d.property, d.value))
            .collect::<Vec<_>>()
            .join("\n");
        
        let inner = format!("{} {{\n{}\n}}", self.selector, declarations);
        
        // Nest within media queries if present
        self.media_queries.iter().rev().fold(inner, |acc, mq| {
            format!("{} {{\n{}\n}}", mq, acc)
        })
    }
}
```

### ThemeConfig Structure

```rust
/// Tailwind theme configuration (parsed from JSON)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeConfig {
    /// Color definitions: { "blue": { "50": "#f0f9ff", "600": "#1e40af" } }
    pub colors: HashMap<String, ThemeValue>,
    
    /// Spacing values: { "4": "1rem", "8": "2rem" }
    pub spacing: HashMap<String, String>,
    
    /// Font sizes: { "lg": ["1.125rem", "1.75rem"] }
    pub font_sizes: HashMap<String, Vec<String>>,
    
    /// Responsive breakpoints: { "md": "768px", "lg": "1024px" }
    pub breakpoints: HashMap<String, String>,
    
    /// Custom utilities defined by user
    pub extend: HashMap<String, HashMap<String, String>>,
    
    /// Dark mode strategy: "class" | "media"
    pub dark_mode: DarkModeStrategy,
}

pub enum ThemeValue {
    /// Simple value: "1rem"
    Simple(String),
    
    /// Nested object: { "50": "#...", "600": "#..." }
    Nested(HashMap<String, String>),
}

impl ThemeConfig {
    /// Resolve a class value from theme (e.g., "blue-600" → "#1e40af")
    pub fn resolve_value(&self, prefix: &str, value: &str) -> Result<String, ResolveError> {
        // Look up in appropriate section (colors, spacing, sizes, etc.)
        // Handle nested paths (e.g., "blue.600")
        // Fall back to Tailwind defaults if not in custom config
        unimplemented!()
    }
}
```

### Error Types

```rust
#[derive(Debug)]
pub enum ParseError {
    /// Invalid class syntax
    InvalidSyntax { class: String, position: usize },
    
    /// Unknown variant
    UnknownVariant { variant: String, suggestions: Vec<String> },
    
    /// Malformed arbitrary value
    MalformedArbitrary { value: String },
}

#[derive(Debug)]
pub enum ResolveError {
    /// Theme value not found
    ValueNotFound { key: String },
    
    /// Invalid opacity modifier
    InvalidOpacity { value: String },
    
    /// Theme config invalid
    InvalidThemeConfig { reason: String },
}

#[derive(Debug)]
pub enum CompileError {
    ParseError(ParseError),
    ResolveError(ResolveError),
    GenerateError(String),
}

impl std::fmt::Display for CompileError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            CompileError::ParseError(e) => 
                write!(f, "Parse error: {}", format_parse_error(e)),
            CompileError::ResolveError(e) => 
                write!(f, "Theme resolution error: {}", format_resolve_error(e)),
            CompileError::GenerateError(msg) => 
                write!(f, "Generation error: {}", msg),
        }
    }
}
```

---

## Algorithm Design

### Class Parsing Algorithm

**Strategy**: Manual tokenization with regex validation (not full regex-based parsing, for performance)

```rust
impl ClassParser {
    pub fn parse(&self, class: &str) -> Result<ParsedClass, ParseError> {
        // Step 1: Trim and validate non-empty
        let trimmed = class.trim();
        if trimmed.is_empty() {
            return Err(ParseError::InvalidSyntax { 
                class: class.to_string(), 
                position: 0 
            });
        }
        
        // Step 2: Handle arbitrary values first
        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            return self.parse_arbitrary(trimmed);
        }
        
        // Step 3: Split by ':' to extract variants
        let parts: Vec<&str> = trimmed.split(':').collect();
        let (variants, final_part) = parts.split_last().ok_or_else(|| 
            ParseError::InvalidSyntax { class: class.to_string(), position: 0 }
        )?;
        
        // Step 4: Parse variants
        let mut variant_list = Vec::new();
        for variant_str in *variants {
            let v = self.parse_variant(variant_str)?;
            variant_list.push(v);
        }
        
        // Step 5: Parse final part "prefix-value/modifier"
        let (prefix, value, modifier) = self.parse_final_segment(final_part)?;
        
        Ok(ParsedClass {
            original: class.to_string(),
            variants: variant_list,
            prefix,
            value,
            modifier,
            is_arbitrary: false,
            arbitrary_declaration: None,
        })
    }
    
    fn parse_final_segment(&self, segment: &str) -> Result<(String, String, Option<String>), ParseError> {
        // Pattern: "prefix-value[/modifier]"
        // Examples: "px-4", "bg-blue-600", "ring-2/75"
        
        // Check for modifier (after "/")
        let (main, modifier) = if let Some(pos) = segment.rfind('/') {
            let (m, mod_part) = segment.split_at(pos);
            (m, Some(mod_part[1..].to_string()))
        } else {
            (segment, None)
        };
        
        // Split by "-" to get prefix and value
        // But be careful: some values have multiple "-" (e.g., "blue-600")
        // Strategy: prefix is typically 1-4 chars (px, py, bg, text, etc.)
        let prefix_candidates = self.KNOWN_PREFIXES.get(main).cloned()
            .or_else(|| self.guess_prefix(main));
        
        if let Some(prefix) = prefix_candidates {
            let value = main[prefix.len()..].to_string();
            if value.is_empty() {
                return Err(ParseError::InvalidSyntax { 
                    class: segment.to_string(), 
                    position: 0 
                });
            }
            Ok((prefix, value, modifier))
        } else {
            Err(ParseError::InvalidSyntax {
                class: segment.to_string(),
                position: 0,
            })
        }
    }
    
    fn parse_arbitrary(&self, segment: &str) -> Result<ParsedClass, ParseError> {
        // Format: "[css-declaration]"
        // Examples: "[width:200px]", "[color:rgb(255,0,0)]"
        
        let content = &segment[1..segment.len()-1]; // Remove [ ]
        
        // Must contain at least one ":"
        if !content.contains(':') {
            return Err(ParseError::MalformedArbitrary { 
                value: segment.to_string() 
            });
        }
        
        Ok(ParsedClass {
            original: segment.to_string(),
            variants: vec![],
            prefix: "arbitrary".to_string(),
            value: String::new(),
            modifier: None,
            is_arbitrary: true,
            arbitrary_declaration: Some(content.replace('_', " ")), // Underscores → spaces
        })
    }
}

// Pre-compiled regex patterns for performance
lazy_static::lazy_static! {
    // Validate CSS property names
    static ref CSS_PROPERTY_PATTERN: regex::Regex = 
        regex::Regex::new(r"^[a-z-]+$").unwrap();
    
    // Validate CSS values (simplified)
    static ref CSS_VALUE_PATTERN: regex::Regex = 
        regex::Regex::new(r"^[a-z0-9#()._%\s-]+$").unwrap();
}
```

**Time Complexity**: O(n) where n = class string length (linear scan)
**Space Complexity**: O(1) for parsing, O(v) for variants vector (typically v < 5)

### Theme Resolution Algorithm

**Strategy**: Nested HashMap traversal with caching

```rust
impl ThemeResolver {
    pub fn resolve(&self, class: &ParsedClass, config: &ThemeConfig) -> Result<String, ResolveError> {
        // Step 1: If arbitrary value, return as-is
        if class.is_arbitrary {
            return Ok(class.arbitrary_declaration.as_ref().unwrap().clone());
        }
        
        // Step 2: Check cache first
        let cache_key = format!("{}-{}", class.prefix, class.value);
        if let Some(cached) = self.cache.get(&cache_key) {
            return Ok(cached.clone());
        }
        
        // Step 3: Route to appropriate theme section
        let resolved = match class.prefix.as_str() {
            "bg" | "text" | "border" | "ring" => 
                self.resolve_color(&class.value, &config.colors)?,
            "px" | "py" | "p" | "m" | "gap" | "w" | "h" => 
                self.resolve_spacing(&class.value, &config.spacing)?,
            "text" => 
                self.resolve_font_size(&class.value, &config.font_sizes)?,
            _ => {
                // Check extend section
                if let Some(extended) = config.extend.get(class.prefix) {
                    extended.get(&class.value)
                        .cloned()
                        .ok_or_else(|| ResolveError::ValueNotFound {
                            key: format!("{}.{}", class.prefix, class.value),
                        })?
                } else {
                    return Err(ResolveError::ValueNotFound {
                        key: format!("{}.{}", class.prefix, class.value),
                    });
                }
            }
        };
        
        // Step 4: Apply modifier (opacity) if present
        let final_value = if let Some(modifier) = &class.modifier {
            self.apply_opacity(&resolved, modifier)?
        } else {
            resolved
        };
        
        // Step 5: Cache result
        self.cache.insert(cache_key, final_value.clone());
        Ok(final_value)
    }
    
    fn resolve_color(&self, value: &str, colors: &HashMap<String, ThemeValue>) -> Result<String, ResolveError> {
        // Handle nested color paths: "blue-600" → colors["blue"]["600"]
        let parts: Vec<&str> = value.split('-').collect();
        
        let mut current = colors;
        for part in &parts {
            if let Some(ThemeValue::Nested(next)) = current.get(*part) {
                current = next;
            } else if let Some(ThemeValue::Simple(hex)) = current.get(*part) {
                return Ok(hex.clone());
            } else {
                return Err(ResolveError::ValueNotFound {
                    key: value.to_string(),
                });
            }
        }
        
        Err(ResolveError::ValueNotFound { key: value.to_string() })
    }
    
    fn apply_opacity(&self, color_hex: &str, opacity_str: &str) -> Result<String, ResolveError> {
        // Parse opacity: "50" → 0.5, "75" → 0.75
        let opacity_num: f32 = opacity_str.parse()
            .map_err(|_| ResolveError::InvalidOpacity { value: opacity_str.to_string() })?;
        
        if opacity_num < 0.0 || opacity_num > 100.0 {
            return Err(ResolveError::InvalidOpacity { value: opacity_str.to_string() });
        }
        
        let alpha = opacity_num / 100.0;
        
        // Convert hex to RGBA
        let (r, g, b) = self.parse_hex_color(color_hex)?;
        Ok(format!("rgba({}, {}, {}, {})", r, g, b, alpha))
    }
}
```

**Time Complexity**: O(d) where d = depth of theme nesting (typically d < 3)
**Space Complexity**: O(1) + cache size

### CSS Generation Algorithm

**Strategy**: Selector building + declaration mapping

```rust
impl CssGenerator {
    pub fn generate(&self, parsed: &ParsedClass, resolved_value: &str, config: &ThemeConfig) -> Result<CssRule, CompileError> {
        // Step 1: Build base selector
        let class_name = self.escape_class_name(&parsed.original);
        let base_selector = format!(".{}", class_name);
        
        // Step 2: Build CSS declaration(s) from prefix
        let declarations = self.declarations_for_prefix(&parsed.prefix, resolved_value)?;
        
        // Step 3: Resolve all variants to CSS components
        let mut media_queries = Vec::new();
        let mut selector_modifiers = Vec::new();
        
        for variant in &parsed.variants {
            match variant.to_css(config)? {
                CssVariantComponent::MediaQuery(mq) => media_queries.push(mq),
                CssVariantComponent::Selector(sel) => selector_modifiers.push(sel),
                CssVariantComponent::SelectorPrefix(prefix) => {
                    // For dark mode class strategy
                }
            }
        }
        
        // Step 4: Build final selector with all modifiers
        let final_selector = self.build_selector(&base_selector, &selector_modifiers);
        
        // Step 5: Calculate specificity
        let specificity = self.calculate_specificity(&final_selector);
        
        Ok(CssRule {
            selector: final_selector,
            declarations,
            media_queries,
            specificity,
        })
    }
    
    fn escape_class_name(&self, class: &str) -> String {
        // Escape special CSS characters
        // "hover:bg-blue-600/50" → "hover\:bg-blue-600\/50"
        class.chars()
            .map(|c| match c {
                ':' | '/' | '[' | ']' => format!("\\{}", c),
                _ => c.to_string(),
            })
            .collect()
    }
    
    fn declarations_for_prefix(&self, prefix: &str, value: &str) -> Result<Vec<CssDeclaration>, CompileError> {
        // Map Tailwind prefix to CSS properties
        match prefix {
            "px" => Ok(vec![
                CssDeclaration { property: "padding-left".to_string(), value: value.to_string() },
                CssDeclaration { property: "padding-right".to_string(), value: value.to_string() },
            ]),
            "py" => Ok(vec![
                CssDeclaration { property: "padding-top".to_string(), value: value.to_string() },
                CssDeclaration { property: "padding-bottom".to_string(), value: value.to_string() },
            ]),
            "bg" => Ok(vec![
                CssDeclaration { property: "background-color".to_string(), value: value.to_string() },
            ]),
            // ... map other prefixes
            _ => Err(CompileError::GenerateError(format!("Unknown prefix: {}", prefix))),
        }
    }
    
    fn build_selector(&self, base: &str, modifiers: &[String]) -> String {
        // Combine base selector with pseudo-classes
        // ".bg-blue-600" + [":hover", ":focus"] → ".bg-blue-600:hover:focus"
        let mut result = base.to_string();
        for modifier in modifiers {
            result.push_str(modifier);
        }
        result
    }
    
    fn calculate_specificity(&self, selector: &str) -> u32 {
        // CSS specificity calculation
        // Count: 100 * ids + 10 * classes + 1 * elements
        // ".class:hover" → 10 + 10 = 20
        let class_count = selector.matches('.').count() as u32;
        let pseudo_count = selector.matches(':').count() as u32;
        class_count * 10 + pseudo_count * 10
    }
}
```

**Time Complexity**: O(v + d) where v = number of variants, d = declaration properties
**Space Complexity**: O(s) where s = output selector string length

### Variant Composition Algorithm

**Strategy**: Variant validation + CSS component mapping

```rust
impl VariantSystem {
    pub fn compose_variants(&self, variants: &[Variant], config: &ThemeConfig) -> Result<Vec<CssVariantComponent>, CompileError> {
        let mut components = Vec::new();
        
        // Validate variant combination
        self.validate_combination(variants)?;
        
        // Apply variants in precedence order
        for variant in variants {
            let component = self.variant_to_css(variant, config)?;
            components.push(component);
        }
        
        Ok(components)
    }
    
    fn validate_combination(&self, variants: &[Variant]) -> Result<(), CompileError> {
        // Ensure no conflicting variants (e.g., sm: and lg: don't conflict, they nest)
        // But sm:sm: would be invalid
        
        let variant_strs: Vec<String> = variants.iter()
            .map(|v| v.to_string())
            .collect();
        
        let unique: std::collections::HashSet<_> = variant_strs.iter().cloned().collect();
        
        if unique.len() != variant_strs.len() {
            return Err(CompileError::GenerateError("Duplicate variants in class".to_string()));
        }
        
        Ok(())
    }
}
```

**Time Complexity**: O(v log v) where v = number of variants
**Space Complexity**: O(v) for variant components

---

## NAPI Bridge & TypeScript Integration

### Rust NAPI Export

```rust
// native/src/infrastructure/napi_bridge.rs

use napi::{CallContext, JsString, JsObject};
use napi_derive::napi;

#[napi]
pub fn generate_css_native(
    classes: Vec<String>,
    theme_json: String,
) -> napi::Result<String> {
    // Parse theme from JSON
    let theme: ThemeConfig = serde_json::from_str(&theme_json)
        .map_err(|e| napi::Error::new(
            napi::Status::InvalidArg,
            format!("Invalid theme JSON: {}", e),
        ))?;
    
    // Initialize parser, resolver, generator
    let parser = ClassParser::new();
    let resolver = ThemeResolver::new(&theme);
    let generator = CssGenerator::new();
    
    // Compile each class
    let mut css_rules = Vec::new();
    for class in classes {
        match parser.parse(&class) {
            Ok(parsed) => {
                match resolver.resolve(&parsed, &theme) {
                    Ok(value) => {
                        match generator.generate(&parsed, &value, &theme) {
                            Ok(rule) => css_rules.push(rule.to_css_string()),
                            Err(e) => {
                                // Log error but continue
                                eprintln!("Failed to generate CSS for {}: {}", class, e);
                            }
                        }
                    },
                    Err(e) => {
                        eprintln!("Failed to resolve {}: {}", class, e);
                    }
                }
            },
            Err(e) => {
                eprintln!("Failed to parse {}: {}", class, e);
            }
        }
    }
    
    Ok(css_rules.join("\n"))
}

#[napi]
pub fn get_cache_stats() -> napi::Result<JsObject> {
    // Return cache statistics for debugging
    unimplemented!()
}
```

### TypeScript Wrapper

```typescript
// packages/domain/compiler/src/cssGeneratorNative.ts

import { getNativeBinding } from './nativeBridge'

/**
 * Generate CSS from a list of Tailwind classes using the Rust compiler.
 * Falls back to JavaScript Tailwind if Rust binding unavailable.
 * 
 * @param classes - Array of Tailwind class strings (e.g., ["px-4", "hover:bg-blue-600"])
 * @param theme - Tailwind theme configuration object
 * @returns Promise resolving to CSS string
 * @throws Error if compilation fails (but with graceful fallback)
 */
export async function generateCssNative(
  classes: string[],
  theme: Record<string, unknown>
): Promise<string> {
  const native = getNativeBinding()
  
  if (!native?.generateCssNative) {
    // Fallback to JavaScript Tailwind
    console.warn('Rust CSS generator unavailable, falling back to JavaScript')
    return fallbackToJavaScript(classes, theme)
  }
  
  try {
    const themeJson = JSON.stringify(theme)
    return native.generateCssNative(classes, themeJson)
  } catch (error) {
    console.warn('Rust CSS generator failed:', error)
    return fallbackToJavaScript(classes, theme)
  }
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats() {
  const native = getNativeBinding()
  if (!native?.getCacheStats) {
    return { available: false }
  }
  
  try {
    return native.getCacheStats()
  } catch {
    return { error: 'Failed to retrieve cache stats' }
  }
}
```

### Integration with Existing Pipeline

```typescript
// packages/domain/compiler/src/tailwindEngine.ts

export async function runCssPipeline(
  classes: string[],
  cssEntryContent?: string,
  root?: string,
  minify = true
): Promise<CssPipelineResult> {
  const unique = [...new Set(classes.filter(Boolean))]
  
  if (unique.length === 0) {
    return { css: "", classes: [], sizeBytes: 0, optimized: false }
  }
  
  // Try Rust compiler first
  let rawCss: string
  try {
    const theme = getThemeConfig()
    rawCss = await generateCssNative(unique, theme)
  } catch (error) {
    // Fall back to JavaScript
    console.error('Rust compiler failed, using JavaScript:', error)
    rawCss = await generateRawCss(unique, cssEntryContent, root)
  }
  
  const finalCss = minify ? postProcessWithLightning(rawCss) : rawCss
  
  return {
    css: finalCss,
    classes: unique,
    sizeBytes: finalCss.length,
    optimized: minify,
  }
}
```

---

## Performance Strategy

### Why 40-60% Speedup?

**Current Bottleneck (JavaScript)**:
```
150ms breakdown:
├─ Tailwind compile() ............. 100ms (parsing, resolving, generating)
│  ├─ Class parsing ............... 20ms
│  ├─ Theme resolution ............ 40ms
│  ├─ CSS generation .............. 30ms
│  └─ Variant composition .......... 10ms
├─ LightningCSS postprocess ....... 40ms (minification, vendor prefixes)
└─ NAPI marshalling ............... 10ms
```

**Rust Implementation Advantages**:
```
~60-90ms breakdown:
├─ Class parsing ................. 3ms (compiled regex, O(n) scan)
├─ Theme resolution .............. 5ms (HashMap lookups, cached)
├─ CSS generation ................ 8ms (direct string building)
├─ Variant composition ............ 2ms (enum dispatch)
├─ LightningCSS postprocess ...... 30ms (same JS library, unavoidable)
└─ NAPI marshalling .............. 5ms (optimized serialization)
    ─────────────────────────────
    Total: ~53ms (vs 150ms JavaScript)
    = 65% speedup
```

**Key Optimizations**:
1. **No JSON parsing in hot path**: Rust works with native data structures
2. **Pre-compiled regex**: Regex patterns compiled once at startup
3. **HashMap-based theme lookup**: O(1) hash lookups vs JavaScript object traversal
4. **Direct CSS building**: No intermediate representations, build output string directly
5. **Lazy variant composition**: Only generate CSS for used variants

### Caching Strategy

```rust
// LRU cache in CacheManager
pub struct CacheManager {
    cache: LRUCache<String, String>,  // key → CSS string
    config_hash: u64,                  // invalidate on theme change
}

impl CacheManager {
    pub fn get(&mut self, classes: &[String]) -> Option<String> {
        let key = self.make_cache_key(classes);
        self.cache.get(&key).cloned()
    }
    
    pub fn put(&mut self, classes: &[String], css: String) {
        let key = self.make_cache_key(classes);
        self.cache.put(key, css);
    }
    
    fn make_cache_key(&self, classes: &[String]) -> String {
        // Deterministic key: sorted classes + config hash
        let mut sorted = classes.clone();
        sorted.sort();
        format!("{}:{}", sorted.join(","), self.config_hash)
    }
}

// Usage in pipeline
const CACHE: Lazy<Mutex<CacheManager>> = Lazy::new(|| {
    Mutex::new(CacheManager::new(100, 256 * 1024)) // 100 entries, 256KB max
});
```

**Expected Cache Hit Rates**:
- **Watch mode**: 60-70% hit rate (same classes recompiled multiple times)
- **Build pipeline**: 20-30% hit rate (incremental compilation)
- **Combined improvement**: 30-40% faster with cache + Rust

### Parallelization Opportunities

```rust
// Potential for parallel class compilation (future optimization)
pub fn generate_css_parallel(
    classes: Vec<String>,
    theme: &ThemeConfig,
) -> Result<String, CompileError> {
    use rayon::prelude::*;
    
    let rules: Result<Vec<_>, _> = classes
        .par_iter()  // Parallel iterator
        .map(|class| {
            let parsed = ClassParser::new().parse(class)?;
            let resolver = ThemeResolver::new(theme);
            let value = resolver.resolve(&parsed, theme)?;
            let generator = CssGenerator::new();
            generator.generate(&parsed, &value, theme)
        })
        .collect();
    
    Ok(rules?.into_iter()
        .map(|r| r.to_css_string())
        .collect::<Vec<_>>()
        .join("\n"))
}
```

**Profiling Points**:
- Class parsing: O(n) where n = total class char count
- Theme resolution: O(c) where c = number of classes (each O(1) with hash map)
- CSS generation: O(c × d) where c = classes, d = avg declarations per class (~3)
- Overall: O(n + c × d) ≈ O(n) for typical inputs

---

## Testing Strategy

### Property-Based Tests (Using proptest)

```rust
// tests/property_tests.rs

use proptest::prelude::*;

proptest! {
    /// Property 1: All generated CSS is syntactically valid
    #[test]
    fn prop_generated_css_is_valid(
        classes in generate_class_list(1..100)
    ) {
        let parser = ClassParser::new();
        let theme = ThemeConfig::default();
        
        for class in &classes {
            if let Ok(parsed) = parser.parse(class) {
                // CSS should parse without errors
                let css = generate_css_for(&parsed, &theme);
                prop_assert!(is_valid_css(&css));
            }
        }
    }
    
    /// Property 2: Same input always produces same output
    #[test]
    fn prop_deterministic_output(
        classes in generate_class_list(1..50)
    ) {
        let output1 = compile_classes(&classes);
        let output2 = compile_classes(&classes);
        
        prop_assert_eq!(output1, output2);
    }
    
    /// Property 3: Parsing round-trip preserves structure
    #[test]
    fn prop_parse_roundtrip(class_string in class_string_strategy()) {
        let parser = ClassParser::new();
        
        if let Ok(parsed) = parser.parse(&class_string) {
            let reconstructed = reconstruct_class_string(&parsed);
            // Parsing then reconstructing should yield same semantic structure
            prop_assert_eq!(parsed, parser.parse(&reconstructed).unwrap());
        }
    }
}

fn generate_class_list(size: impl Into<SizeRange>) -> impl Strategy<Value = Vec<String>> {
    prop::collection::vec(class_string_strategy(), size)
}

fn class_string_strategy() -> impl Strategy<Value = String> {
    // Generate valid Tailwind class strings
    prop_oneof![
        // Simple classes
        r"(px|py|bg|text|border)-([\d]+|[a-z]+-[\d]+)" ,
        // With variants
        r"(hover|focus|md|lg|dark):(px|py|bg)-([\d]+|[a-z]+-[\d]+)",
        // With modifiers
        r"(bg|text)-(blue|red|green)-[\d]+/(25|50|75)",
        // Arbitrary values
        r"\[.*\]",
    ]
    .prop_map(|s| s.to_string())
}
```

### Example-Based Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_simple_padding() {
        let parsed = ClassParser::new().parse("px-4").unwrap();
        assert_eq!(parsed.prefix, "px");
        assert_eq!(parsed.value, "4");
        assert!(parsed.variants.is_empty());
    }
    
    #[test]
    fn test_variant_with_modifier() {
        let parsed = ClassParser::new().parse("hover:bg-blue-600/50").unwrap();
        assert_eq!(parsed.prefix, "bg");
        assert_eq!(parsed.value, "blue-600");
        assert_eq!(parsed.modifier, Some("50".to_string()));
        assert_eq!(parsed.variants.len(), 1);
    }
    
    #[test]
    fn test_dark_mode_variant() {
        let parsed = ClassParser::new().parse("dark:bg-gray-900").unwrap();
        assert!(parsed.variants.iter().any(|v| matches!(v, Variant::ColorScheme(_))));
    }
}
```

### Integration Tests

```rust
#[test]
fn test_parity_with_tailwind_js() {
    // Compare against snapshot of Tailwind JS output
    let test_cases = vec![
        ("px-4", ".px-4 { padding-left: 1rem; padding-right: 1rem; }"),
        ("hover:bg-blue-600", ".hover\\:bg-blue-600:hover { background-color: #1e40af; }"),
        ("md:text-lg", "@media (min-width: 768px) { .md\\:text-lg { font-size: 1.125rem; } }"),
    ];
    
    for (class, expected_css) in test_cases {
        let output = compile_single_class(class);
        assert_eq!(normalize_css(&output), normalize_css(expected_css));
    }
}

#[test]
fn test_performance_100_classes() {
    use std::time::Instant;
    
    let classes = generate_representative_classes(100);
    let start = Instant::now();
    let _ = compile_classes(&classes);
    let elapsed = start.elapsed();
    
    assert!(elapsed.as_millis() < 100, "Compilation took {}ms, expected <100ms", elapsed.as_millis());
}
```

### Snapshot Testing

Store expected CSS output in JSON files:

```json
// tests/fixtures/expected_output.json
{
  "test_cases": [
    {
      "input": ["px-4", "py-2", "bg-blue-600"],
      "expected_css": ".px-4 { padding-left: 1rem; padding-right: 1rem; }\n.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }\n.bg-blue-600 { background-color: #1e40af; }",
      "description": "Simple utility classes"
    },
    {
      "input": ["hover:bg-red-500", "md:text-lg"],
      "expected_css": ".hover\\:bg-red-500:hover { background-color: #ef4444; }\n@media (min-width: 768px) { .md\\:text-lg { font-size: 1.125rem; } }",
      "description": "Variant classes"
    }
  ]
}
```

---

## Error Handling & Validation

### Error Recovery Strategy

```rust
pub fn compile_classes_with_recovery(
    classes: &[String],
    theme: &ThemeConfig,
) -> Result<CssResult, CriticalError> {
    let mut valid_css = Vec::new();
    let mut errors = Vec::new();
    
    for (idx, class) in classes.iter().enumerate() {
        match compile_single(&class, theme) {
            Ok(css) => valid_css.push(css),
            Err(e) => {
                errors.push(CompileErrorInfo {
                    class_index: idx,
                    class: class.clone(),
                    error: e,
                });
                // Continue processing other classes
            }
        }
    }
    
    if valid_css.is_empty() && !errors.is_empty() {
        // All classes failed
        return Err(CriticalError::AllClassesFailed(errors));
    }
    
    Ok(CssResult {
        css: valid_css.join("\n"),
        error_count: errors.len(),
        errors,
    })
}
```

### Validation Pipeline

```rust
pub fn validate_class(&self, class: &str) -> ValidationResult {
    let mut issues = Vec::new();
    
    // Check 1: Not empty
    if class.trim().is_empty() {
        issues.push(ValidationIssue::EmptyClass);
    }
    
    // Check 2: Valid syntax
    if !self.is_valid_syntax(class) {
        issues.push(ValidationIssue::InvalidSyntax);
    }
    
    // Check 3: Known prefix
    if let Some(prefix) = self.extract_prefix(class) {
        if !self.KNOWN_PREFIXES.contains(&prefix) {
            issues.push(ValidationIssue::UnknownPrefix(prefix));
        }
    }
    
    // Check 4: Theme value exists
    if let Some(value) = self.extract_value(class) {
        if !self.theme_has_value(&value) {
            issues.push(ValidationIssue::UnknownThemeValue(value));
        }
    }
    
    ValidationResult {
        valid: issues.is_empty(),
        issues,
    }
}
```

---

## File Structure & Module Organization

```
native/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── lib.rs                    # Crate root, module declarations
│   │
│   ├── domain/
│   │   ├── mod.rs
│   │   ├── parsed_class.rs       # ParsedClass, Variant enums
│   │   ├── theme_config.rs       # ThemeConfig, ThemeValue
│   │   ├── css_rule.rs           # CssRule, CssDeclaration
│   │   ├── variant.rs            # Variant impl, composition logic
│   │   └── error.rs              # Error types, Display impls
│   │
│   ├── application/
│   │   ├── mod.rs
│   │   ├── class_parser.rs       # ClassParser struct, parsing logic
│   │   ├── theme_resolver.rs     # ThemeResolver, value lookup
│   │   ├── css_generator.rs      # CssGenerator, CSS building
│   │   └── variant_system.rs     # VariantSystem, variant resolution
│   │
│   ├── infrastructure/
│   │   ├── mod.rs
│   │   ├── cache.rs              # LRUCache implementation
│   │   └── napi_bridge.rs        # NAPI exports, marshalling
│   │
│   └── utils/
│       ├── mod.rs
│       ├── string_utils.rs       # escape_css_selector, other utils
│       ├── regex_patterns.rs     # Pre-compiled regexes
│       └── constants.rs          # Magic numbers, default theme
│
├── tests/
│   ├── integration_tests.rs      # NAPI integration tests
│   ├── property_tests.rs         # Property-based tests
│   ├── performance_tests.rs      # Benchmark tests
│   └── fixtures/
│       ├── test_classes.json
│       ├── test_themes.json
│       └── expected_output.json
│
└── benches/
    ├── class_parser.rs           # Parser performance
    ├── css_generation.rs         # Generator performance
    └── end_to_end.rs             # Full pipeline

packages/domain/compiler/src/
├── index.ts                      # Main exports
├── nativeBridge.ts               # NAPI binding interface
├── cssGeneratorNative.ts         # TypeScript wrapper
├── tailwindEngine.ts             # Integration with pipeline
└── fallback.ts                   # JavaScript fallback
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: CSS Syntax Validity
*For any* set of valid Tailwind classes, the generated CSS SHALL be syntactically valid and parseable by standard CSS parsers.

**Validates: Requirements 3, 9, 16**

### Property 2: Output Determinism
*For any* identical input (class list + theme config), multiple invocations of the compiler SHALL produce identical CSS output byte-for-byte.

**Validates: Requirements 9, 13, 15**

### Property 3: Theme Resolution Accuracy
*For any* class with a theme-resolvable value, the resolved CSS value SHALL match Tailwind v4's resolution for the same input.

**Validates: Requirements 2, 9, 11**

### Property 4: Variant Composition Correctness
*For any* combination of valid variants, the composed CSS selectors and media queries SHALL follow Tailwind's precedence rules and produce valid CSS.

**Validates: Requirements 4, 5, 6, 12**

### Property 5: Cache Correctness
*For any* cached class list, retrieving the cached CSS result SHALL produce identical output to fresh compilation of the same classes.

**Validates: Requirement 15**

### Property 6: Round-Trip Parsing Preservation
*For any* valid parsed class, reconstructing the original class string and re-parsing SHALL yield an equivalent ParsedClass structure.

**Validates: Requirement 1**

### Property 7: Arbitrary Value Preservation
*For any* arbitrary CSS value specified with bracket notation, the generated CSS SHALL preserve the custom declaration exactly (with underscore-to-space conversion).

**Validates: Requirement 8**

### Property 8: Opacity Modifier Application
*For any* class with an opacity modifier, the generated CSS color value SHALL have the opacity correctly applied in the output declaration.

**Validates: Requirement 7**

### Property 9: Error Message Clarity
*For any* invalid class or configuration, the error message returned SHALL indicate the specific problem and suggest corrective actions when applicable.

**Validates: Requirement 14**

### Property 10: Performance Scalability
*For any* class list size up to 10,000 classes, compilation time SHALL scale linearly (not exponentially) with class count.

**Validates: Requirement 13**

---

## Testing Strategy

### Unit Tests
- **Class Parsing**: 50+ test cases covering all variant patterns, modifiers, arbitrary values
- **Theme Resolution**: 40+ test cases for color lookup, spacing, custom values, fallbacks
- **CSS Generation**: 60+ test cases for all utility prefixes and properties
- **Variant Handling**: 45+ test cases for responsive, state, dark mode, group/peer variants
- **Error Handling**: 30+ test cases for invalid inputs and error messages

### Property-Based Tests (Minimum 1000 iterations each)
- **CSS Validity**: Generate random class lists, verify output is valid CSS
- **Determinism**: Compile same classes multiple times, assert identical output
- **Roundtrip Parsing**: Parse → reconstruct → parse, assert structure equivalence
- **Theme Integration**: Generate random theme configs, verify all values resolve

### Integration Tests
- End-to-end compilation with real Tailwind theme configs
- NAPI binding performance and marshalling correctness
- Fallback to JavaScript when Rust binding unavailable
- Byte-level parity with Tailwind JS output on 200+ representative classes

### Performance Benchmarks
- Single class compilation: target < 1ms
- Batch compilation (100 classes): target < 100ms
- Cache hit latency: target < 0.5ms
- Memory usage: target < 50MB for 10,000 class compilation

---

## Implementation Roadmap

**Phase 1: Core Infrastructure (Week 1)**
- Set up Rust crate structure with NAPI bindings
- Implement data structures (ParsedClass, CssRule, ThemeConfig)
- Create TypeScript wrapper and integration layer
- Set up testing framework and CI/CD

**Phase 2: Core Modules (Weeks 2-3)**
- Implement ClassParser with comprehensive class syntax support
- Implement ThemeResolver with custom theme integration
- Implement CssGenerator with property mapping
- Add VariantSystem for responsive/state/dark mode

**Phase 3: Optimization & Polish (Week 4)**
- Add LRU caching layer
- Optimize hot paths (regex, hash lookups)
- Comprehensive property-based testing
- Performance benchmarking and tuning

**Phase 4: Production Ready (Week 5)**
- Integration with existing pipeline
- Fallback handling and error recovery
- Documentation and examples
- Release preparation

---

## Success Metrics

✅ **Functionality**:
- [ ] 99% CSS output parity with Tailwind v4
- [ ] All 18 requirements implemented
- [ ] 100+ test cases passing (90%+ coverage)
- [ ] Zero regressions vs existing Tailwind JS

✅ **Performance**:
- [ ] 100 classes compiled in < 100ms
- [ ] 40-60% improvement over Tailwind JS baseline
- [ ] < 5ms NAPI marshalling overhead
- [ ] Linear scaling with class count

✅ **Quality**:
- [ ] Property-based tests running 1000+ iterations
- [ ] Deterministic output verified
- [ ] Error messages clear and actionable
- [ ] Cache hit rates 60%+ in watch mode

✅ **Compatibility**:
- [ ] Seamless fallback to JavaScript
- [ ] Backward compatible with existing API
- [ ] Node.js 18+ support
- [ ] CommonJS + ESM support

