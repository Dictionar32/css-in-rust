# Week 1, Day 5: CSS Rule Generation Design

**Date**: June 9, 2026  
**Phase**: Phase 1 - Week 1, Day 5  
**Task**: Design CSS rule generation engine  
**Duration**: 4 hours  
**Status**: 🚀 IN PROGRESS

---

## Part 1: CSS Rule Builder Architecture

### 1.1 Main RuleGenerator struct

```rust
// File: native/src/application/rule_generator.rs

pub struct RuleGenerator {
    theme: ThemeConfig,
    vendor_prefixes: HashMap<String, Vec<&'static str>>,
}

impl RuleGenerator {
    pub fn new(theme: ThemeConfig) -> Self {
        RuleGenerator {
            theme,
            vendor_prefixes: Self::init_prefixes(),
        }
    }
    
    /// Generate CSS rule from parsed class + resolved value
    pub fn generate(&self, parsed: &ParsedClass, resolved: &ResolvedValue) -> Result<CssRule, CssGeneratorError> {
        // 1. Build base selector
        let selector = self.build_selector(parsed);
        
        // 2. Create CSS rule
        let mut rule = CssRule::new(selector);
        
        // 3. Add declarations (with vendor prefixes)
        for (prop, val) in &resolved.resolved_declarations {
            rule.add_declaration(prop.clone(), val.clone());
            
            // Add vendor prefixes if needed
            if let Some(prefixes) = self.vendor_prefixes.get(prop.as_str()) {
                for prefix in prefixes {
                    let prefixed_prop = format!("{}{}", prefix, prop);
                    rule.add_declaration(prefixed_prop, val.clone());
                }
            }
        }
        
        // 4. Wrap in media query if responsive
        if let Some(media) = self.build_media_query(parsed) {
            rule = rule.with_media_query(media);
        }
        
        Ok(rule)
    }
    
    /// Build CSS selector with proper escaping
    fn build_selector(&self, parsed: &ParsedClass) -> String {
        let mut selector = String::from(".");
        
        // Add variant prefix if present
        if let Some(ref variant) = parsed.variant {
            selector.push_str(&self.escape_selector_part(variant));
            selector.push('\\');
            selector.push(':');
        }
        
        // Add prefix and value
        selector.push_str(&self.escape_selector_part(&parsed.prefix));
        selector.push('-');
        selector.push_str(&self.escape_selector_part(&parsed.value));
        
        // Add modifier if present
        if let Some(ref modifier) = parsed.modifier {
            selector.push('\\');
            selector.push('/');
            selector.push_str(&modifier);
        }
        
        selector
    }
    
    /// Escape CSS selector characters
    fn escape_selector_part(&self, part: &str) -> String {
        part.chars()
            .map(|c| match c {
                ':' => "\\:".to_string(),
                '/' => "\\/".to_string(),
                '[' => "\\[".to_string(),
                ']' => "\\]".to_string(),
                '(' => "\\(".to_string(),
                ')' => "\\)".to_string(),
                ' ' => "\\ ".to_string(),
                ',' => "\\,".to_string(),
                _ => c.to_string(),
            })
            .collect()
    }
    
    /// Build media query wrapper if responsive variant
    fn build_media_query(&self, parsed: &ParsedClass) -> Option<String> {
        if let Some(ref variant) = parsed.variant {
            match variant.as_str() {
                "sm" => Some("@media (min-width: 640px)".to_string()),
                "md" => Some("@media (min-width: 768px)".to_string()),
                "lg" => Some("@media (min-width: 1024px)".to_string()),
                "xl" => Some("@media (min-width: 1280px)".to_string()),
                "2xl" => Some("@media (min-width: 1536px)".to_string()),
                "dark" => Some("@media (prefers-color-scheme: dark)".to_string()),
                _ => None,
            }
        } else {
            None
        }
    }
    
    /// Initialize vendor prefixes map
    fn init_prefixes() -> HashMap<String, Vec<&'static str>> {
        let mut map = HashMap::new();
        
        // Properties that need -webkit- prefix
        map.insert("appearance".to_string(), vec!["-webkit-", "-moz-"]);
        map.insert("backface-visibility".to_string(), vec!["-webkit-", "-moz-"]);
        map.insert("box-sizing".to_string(), vec!["-webkit-", "-moz-"]);
        map.insert("user-select".to_string(), vec!["-webkit-", "-moz-", "-ms-"]);
        map.insert("transform".to_string(), vec!["-webkit-", "-moz-", "-ms-", "-o-"]);
        map.insert("transition".to_string(), vec!["-webkit-", "-moz-", "-ms-", "-o-"]);
        map.insert("animation".to_string(), vec!["-webkit-", "-moz-", "-ms-", "-o-"]);
        map.insert("filter".to_string(), vec!["-webkit-"]);
        map.insert("backdrop-filter".to_string(), vec!["-webkit-"]);
        
        map
    }
}
```

---

## Part 2: CSS Declaration Builder

### 2.1 Declaration Templates

```rust
// File: native/src/application/css_templates.rs

/// CSS declaration templates for each property type
pub struct CssTemplates;

impl CssTemplates {
    /// Spacing properties (padding, margin)
    pub fn spacing_template(property: &str, value: &str) -> String {
        format!("{}: {};", property, value)
    }
    
    /// Color properties (color, background-color, border-color)
    pub fn color_template(property: &str, color: &str, opacity: Option<&str>) -> String {
        let css = format!("{}: {};", property, color);
        
        if let Some(op) = opacity {
            let opacity_value = format!("opacity: {};", Self::parse_opacity(op));
            format!("{}\n  {}", css, opacity_value)
        } else {
            css
        }
    }
    
    /// Font properties
    pub fn font_template(property: &str, value: &str) -> String {
        format!("{}: {};", property, value)
    }
    
    /// Transform/transition templates
    pub fn transform_template(transforms: &[(&str, &str)]) -> String {
        let transform_str = transforms
            .iter()
            .map(|(func, value)| format!("{}({})", func, value))
            .collect::<Vec<_>>()
            .join(" ");
        format!("transform: {};", transform_str)
    }
    
    /// Shorthand property expansion
    pub fn expand_shorthand(property: &str, value: &str) -> Vec<(String, String)> {
        match property {
            "p" | "padding" => vec![
                ("padding-top".to_string(), value.to_string()),
                ("padding-right".to_string(), value.to_string()),
                ("padding-bottom".to_string(), value.to_string()),
                ("padding-left".to_string(), value.to_string()),
            ],
            "px" => vec![
                ("padding-left".to_string(), value.to_string()),
                ("padding-right".to_string(), value.to_string()),
            ],
            "py" => vec![
                ("padding-top".to_string(), value.to_string()),
                ("padding-bottom".to_string(), value.to_string()),
            ],
            // ... add more shorhand mappings
            _ => vec![(property.to_string(), value.to_string())],
        }
    }
    
    /// Parse opacity modifier (/50 -> 0.5)
    fn parse_opacity(modifier: &str) -> String {
        match modifier.parse::<u32>() {
            Ok(value) => {
                let opacity = value as f32 / 100.0;
                format!("{}", opacity)
            }
            Err(_) => "1".to_string(),
        }
    }
}
```

---

## Part 3: Pseudo-Class and Variant Handling

### 3.1 Variant CSS Generation

```rust
// File: native/src/application/variant_selector.rs

pub struct VariantSelector;

impl VariantSelector {
    /// Generate pseudo-class selector wrapper
    pub fn wrap_pseudo_class(base_selector: &str, pseudo: &str) -> String {
        format!("{}:{}", base_selector, pseudo)
    }
    
    /// Generate group variant wrapper
    pub fn wrap_group_variant(base_selector: &str, pseudo: &str) -> String {
        format!(".group:{} ~ {}", pseudo, base_selector)
    }
    
    /// Generate peer variant wrapper
    pub fn wrap_peer_variant(base_selector: &str, pseudo: &str) -> String {
        format!(".peer:{} ~ {}", pseudo, base_selector)
    }
    
    /// Build complete selector with variants
    pub fn build_with_variants(
        base_selector: &str,
        variants: &[String],
    ) -> String {
        let mut selector = base_selector.to_string();
        
        for variant in variants {
            selector = match variant.as_str() {
                "hover" => Self::wrap_pseudo_class(&selector, "hover"),
                "focus" => Self::wrap_pseudo_class(&selector, "focus"),
                "active" => Self::wrap_pseudo_class(&selector, "active"),
                "group-hover" => Self::wrap_group_variant(&selector, "hover"),
                "peer-checked" => Self::wrap_peer_variant(&selector, "checked"),
                _ => selector,
            };
        }
        
        selector
    }
}
```

---

## Part 4: Media Query Builder

### 4.1 Media Query Templates

```rust
// File: native/src/application/media_query_builder.rs

pub struct MediaQueryBuilder;

impl MediaQueryBuilder {
    /// Build responsive media query
    pub fn responsive_query(breakpoint: &str) -> String {
        match breakpoint {
            "sm" => "@media (min-width: 640px)".to_string(),
            "md" => "@media (min-width: 768px)".to_string(),
            "lg" => "@media (min-width: 1024px)".to_string(),
            "xl" => "@media (min-width: 1280px)".to_string(),
            "2xl" => "@media (min-width: 1536px)".to_string(),
            _ => String::new(),
        }
    }
    
    /// Build dark mode media query
    pub fn dark_mode_query() -> String {
        "@media (prefers-color-scheme: dark)".to_string()
    }
    
    /// Combine multiple media queries
    pub fn combine_queries(queries: &[String]) -> String {
        queries.join(" and ")
    }
    
    /// Wrap CSS rule in media query
    pub fn wrap_rule(rule: &str, query: &str) -> String {
        format!("{} {{\n  {}\n}}", query, rule)
    }
}
```

---

## Part 5: Complete CSS Rule Example

### 5.1 End-to-End Generation

```rust
// Example: Parse "md:hover:bg-blue-600/50" → CSS Rule

let parsed = ParsedClass {
    prefix: "bg".to_string(),
    value: "blue-600".to_string(),
    variant: Some("hover".to_string()),
    modifier: Some("50".to_string()),
    // ... other fields
};

let resolved = ResolvedValue {
    property: "background-color".to_string(),
    value: "#2563eb".to_string(),
    vendor_prefixes: vec![],
    // ... other fields
};

let generator = RuleGenerator::new(theme);
let rule = generator.generate(&parsed, &resolved)?;

// Output:
// .md:hover\:bg-blue-600\/50:hover {
//   background-color: #2563eb;
//   opacity: 0.5;
// }

// With media query:
// @media (min-width: 768px) {
//   .md:hover\:bg-blue-600\/50:hover {
//     background-color: #2563eb;
//     opacity: 0.5;
//   }
// }
```

---

## Part 6: Batch Rule Generation

### 6.1 Optimized Batch Processing

```rust
// File: native/src/application/batch_generator.rs

pub struct BatchRuleGenerator {
    rule_generator: RuleGenerator,
    dedup_cache: HashMap<String, CssRule>,
}

impl BatchRuleGenerator {
    pub fn new(theme: ThemeConfig) -> Self {
        BatchRuleGenerator {
            rule_generator: RuleGenerator::new(theme),
            dedup_cache: HashMap::new(),
        }
    }
    
    /// Generate rules for multiple classes with deduplication
    pub fn generate_batch(
        &mut self,
        parsed_list: &[ParsedClass],
        resolved_list: &[ResolvedValue],
    ) -> Result<String, CssGeneratorError> {
        let mut rules_map: HashMap<String, CssRule> = HashMap::new();
        
        // Generate rules and deduplicate
        for (parsed, resolved) in parsed_list.iter().zip(resolved_list.iter()) {
            let rule = self.rule_generator.generate(parsed, resolved)?;
            let css_str = rule.to_css_minified();
            rules_map.entry(css_str).or_insert(rule);
        }
        
        // Sort rules for deterministic output
        let mut rules: Vec<CssRule> = rules_map.into_values().collect();
        self.sort_rules(&mut rules);
        
        // Combine into final CSS
        let css = rules
            .iter()
            .map(|r| r.to_css_minified())
            .collect::<Vec<_>>()
            .join("\n");
        
        Ok(css)
    }
    
    /// Sort rules for consistent output
    fn sort_rules(&self, rules: &mut [CssRule]) {
        rules.sort_by(|a, b| {
            // Sort by: base rules first, then responsive, then variants
            let a_priority = self.rule_priority(&a.selector);
            let b_priority = self.rule_priority(&b.selector);
            a_priority.cmp(&b_priority)
                .then_with(|| a.selector.cmp(&b.selector))
        });
    }
    
    /// Determine sort priority
    fn rule_priority(&self, selector: &str) -> u32 {
        if selector.contains("@media") {
            2 // Responsive after base
        } else if selector.contains(":") {
            1 // Variants in middle
        } else {
            0 // Base rules first
        }
    }
}
```

---

## Summary: File Structure (Day 5)

```
native/src/application/
├─ rule_generator.rs (main RuleGenerator struct)
├─ css_templates.rs (CSS declaration templates)
├─ variant_selector.rs (pseudo-class/group/peer handling)
├─ media_query_builder.rs (media query generation)
└─ batch_generator.rs (batch processing + dedup)
```

---

## Next Steps: Days 6-7

**Day 6**: Test Strategy (parser + resolver tests)
**Day 7**: POC Setup (hello-world Rust example)

---

**Document Status**: Complete  
**Date**: June 9, 2026  
**Week 1 Progress**: 5/7 days complete
