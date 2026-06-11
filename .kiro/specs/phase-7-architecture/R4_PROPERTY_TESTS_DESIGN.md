# Phase 7 R4 - Property-Based Testing Implementation Design

**Status:** Design Phase (Before Implementation)  
**Target:** Session 3  
**Framework:** proptest 1.0  

---

## Overview

Complete R4 (Property-Based Testing) by fixing existing issues and implementing 4 properties:
- Property 1: Parser Determinism (FIX compilation issue)
- Property 2: Round-trip Parsing (NEW)
- Property 5: Variant Composition Determinism (NEW)
- Property 6: CSS Validity (NEW)

Current Status:
- ✅ Property 3 (Cache Consistency): 15 tests PASSING
- ⏳ Property 4 (Cache Eviction): 30+ cases, not yet run
- ❌ Property 1: Compilation error (panic strategy)
- ⏳ Properties 2, 5, 6: Structure ready, need implementation

---

## Property 1: Parser Determinism Fix

**File:** `native/tests/property_parser_determinism.rs`

**Current Issue:**
```
Error: panic strategy conflict in proptest macro
Expected: proptest! { ... }
```

### Design: Root Cause & Fix

**Problem:** Proptest panic strategy handling with `thread` mode
- Current: Using default panic behavior
- Issue: panic strategy not properly configured for proptest
- Solution: Explicit strategy configuration

**Implementation Strategy:**

```rust
// BEFORE (Current - causes error)
proptest! {
    fn test_parser_determinism(class in ".*") {
        // test body
    }
}

// AFTER (Fixed)
#[cfg(test)]
mod property_tests {
    use proptest::prelude::*;
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(1000))]
        
        fn prop_parser_determinism(class in class_string_strategy()) {
            // Strategy: generate 1000+ random Tailwind class strings
            // Action: Parse each class 3 times
            // Assert: All 3 parses produce identical output
            
            let result1 = parse_class(&class);
            let result2 = parse_class(&class);
            let result3 = parse_class(&class);
            
            prop_assert_eq!(result1, result2);
            prop_assert_eq!(result2, result3);
        }
    }
}
```

**Strategy Function:**
```rust
fn class_string_strategy() -> impl Strategy<Value = String> {
    // Generate valid Tailwind class strings:
    // - Single classes: "text-blue-500", "px-4"
    // - With modifiers: "hover:text-red-600", "sm:w-full"
    // - Multiple variants: "dark:hover:bg-gray-100"
    // - Edge cases: empty prefix, max length classes
    
    prop::string::string_regex("[a-z0-9\\-/:]+")
        .unwrap()
        .prop_filter("valid class format", |s| {
            !s.is_empty() && s.len() < 256
        })
}
```

**Expected Outcomes:**
- ✅ Compilation succeeds
- ✅ 1000+ test cases generated
- ✅ All iterations deterministic
- ✅ Any failures shrunk to minimal example

---

## Property 2: Round-trip Parsing

**File:** NEW `native/tests/property_round_trip_parsing.rs`

**Goal:** Verify parse → compile → parse produces equivalent result

### Design: Test Flow

```
Input: Random Tailwind class string
  ↓
Parse 1: class → ParsedClass (internal AST)
  ↓
Compile: ParsedClass → CSS rules
  ↓
Parse 2: Reverse extract from CSS → ParsedClass (or equivalent)
  ↓
Compare: result1 semantically equivalent to result2
  ↓
Pass if: Both produce same CSS output when recompiled
```

### Implementation Structure

```rust
#[cfg(test)]
mod property_round_trip {
    use proptest::prelude::*;
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(1000))]
        
        fn prop_round_trip_parsing(
            class in class_string_strategy(),
            theme_id in "[a-z0-9]{1,20}"
        ) {
            // Step 1: Parse input class
            let parsed1 = parse_class(&class)?;
            let css1 = generate_css(&parsed1, &theme_id)?;
            
            // Step 2: Extract class from CSS output
            let extracted_class = extract_class_from_css(&css1);
            
            // Step 3: Re-parse extracted class
            let parsed2 = parse_class(&extracted_class)?;
            let css2 = generate_css(&parsed2, &theme_id)?;
            
            // Step 4: Verify semantic equivalence
            // (CSS output should be identical or functionally equivalent)
            prop_assert_eq!(
                normalize_css(&css1),
                normalize_css(&css2),
                "Round-trip parsing failed: CSS mismatch"
            );
        }
    }
    
    fn extract_class_from_css(css: &str) -> String {
        // Extract class name from CSS rule
        // E.g., ".text-blue-500 { color: #3b82f6; }" → "text-blue-500"
        regex::Regex::new(r"\.([a-z0-9\-]+)\s*\{")
            .unwrap()
            .captures(css)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_default()
    }
    
    fn normalize_css(css: &str) -> String {
        // Remove whitespace/comments for comparison
        css.trim()
            .lines()
            .map(|l| l.trim())
            .filter(|l| !l.is_empty() && !l.starts_with("/*"))
            .collect::<Vec<_>>()
            .join("\n")
    }
}
```

**Strategy Requirements:**
- Generate valid Tailwind classes with modifiers
- Include theme variations
- Include edge cases (max length, special chars, etc.)

**Expected Outcomes:**
- ✅ 1000+ test iterations
- ✅ All round-trips produce equivalent CSS
- ✅ Failures shrunk to minimal failing input

---

## Property 5: Variant Composition Determinism

**File:** NEW `native/tests/property_variant_composition.rs`

**Goal:** Verify variant composition is deterministic (order-independent, result-deterministic)

### Design: Test Flow

```
Input: Random set of variant combinations (responsive, state, color-scheme, etc.)
  ↓
Compose 1: Apply variants in order A → Result CSS
  ↓
Compose 2: Apply same variants in different order B → Result CSS
  ↓
Compare: Both produce identical CSS output
  ↓
Pass if: Composition is deterministic regardless of input order
```

### Implementation Structure

```rust
#[cfg(test)]
mod property_variant_composition {
    use proptest::prelude::*;
    
    #[derive(Debug, Clone)]
    struct VariantCombo {
        base_class: String,
        modifiers: Vec<String>,  // sm:, md:, hover:, dark:, etc.
    }
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(1000))]
        
        fn prop_variant_composition_deterministic(
            combo in variant_combo_strategy()
        ) {
            // Step 1: Compose variants in original order
            let css1 = compose_variants(&combo.base_class, &combo.modifiers)?;
            
            // Step 2: Shuffle modifiers
            let mut shuffled = combo.modifiers.clone();
            shuffled.sort();  // Different order
            
            // Step 3: Compose variants with shuffled order
            let css2 = compose_variants(&combo.base_class, &shuffled)?;
            
            // Step 4: Verify identical output (deterministic)
            prop_assert_eq!(
                normalize_css(&css1),
                normalize_css(&css2),
                "Variant composition not deterministic"
            );
            
            // Step 5: Verify precedence ordering applied correctly
            verify_precedence_order(&css1, &combo.modifiers)?;
        }
    }
    
    fn variant_combo_strategy() -> impl Strategy<Value = VariantCombo> {
        (
            "[a-z0-9\\-]+",  // base class like "text-blue"
            prop::collection::vec("[a-z]+:?", 1..8)  // 1-8 modifiers
        )
        .prop_map(|(base, modifiers)| VariantCombo {
            base_class: base.to_string(),
            modifiers: modifiers.iter()
                .filter(|m| is_valid_variant(m))
                .cloned()
                .collect(),
        })
    }
    
    fn is_valid_variant(v: &str) -> bool {
        // Check if variant is in known set
        matches!(v,
            "sm" | "md" | "lg" | "xl" | "2xl" |
            "hover" | "focus" | "active" |
            "dark" | "light" |
            "portrait" | "landscape"
        )
    }
    
    fn verify_precedence_order(css: &str, variants: &[String]) -> Result<()> {
        // Verify variants applied in correct precedence order
        // E.g., state modifiers after responsive, responsive after color-scheme
        let expected_order = sort_by_precedence(variants);
        // Extract variant order from CSS selectors
        let actual_order = extract_variant_order_from_css(css);
        
        prop_assert_eq!(expected_order, actual_order);
        Ok(())
    }
}
```

**Variant Precedence Levels (from earlier implementation):**
1. Color scheme (dark, light) - lowest
2. Responsive (sm, md, lg, xl) 
3. State (hover, focus, active, etc.)
4. Interaction (group-hover, peer-focus, etc.) - highest

**Expected Outcomes:**
- ✅ 1000+ test iterations with random variant combinations
- ✅ All compositions deterministic (order-independent)
- ✅ Precedence correctly applied
- ✅ Failures show minimal failing combo

---

## Property 6: CSS Validity

**File:** NEW `native/tests/property_css_validity.rs`

**Goal:** Verify generated CSS is always syntactically valid

### Design: Test Flow

```
Input: Random Tailwind class strings
  ↓
Generate: class → CSS output
  ↓
Validate: CSS syntax checking
  ↓
Pass if: All generated CSS is valid CSS
  ↓
Fail if: Any invalid CSS found (unmatched braces, invalid selectors, etc.)
```

### Implementation Structure

```rust
#[cfg(test)]
mod property_css_validity {
    use proptest::prelude::*;
    
    proptest! {
        #![proptest_config(ProptestConfig::with_cases(1000))]
        
        fn prop_generated_css_is_valid(
            class in class_string_strategy()
        ) {
            // Step 1: Generate CSS from class
            let css = generate_css(&class)?;
            
            // Step 2: Validate CSS structure
            prop_assert!(
                is_valid_css(&css),
                "Generated CSS is invalid:\n{}",
                css
            );
            
            // Step 3: Additional validity checks
            prop_assert!(!css.is_empty(), "CSS is empty");
            prop_assert!(css.contains('{'), "Missing opening brace");
            prop_assert!(css.contains('}'), "Missing closing brace");
            prop_assert_eq!(
                count_char(&css, '{'),
                count_char(&css, '}'),
                "Unmatched braces"
            );
        }
    }
    
    fn is_valid_css(css: &str) -> bool {
        // Check multiple validity criteria:
        
        // 1. Balanced braces
        let mut brace_count = 0;
        for ch in css.chars() {
            match ch {
                '{' => brace_count += 1,
                '}' => {
                    brace_count -= 1;
                    if brace_count < 0 {
                        return false;  // Closing brace without opening
                    }
                }
                _ => {}
            }
        }
        if brace_count != 0 {
            return false;  // Unmatched braces
        }
        
        // 2. Valid selectors (no empty selectors)
        if css.contains("{}") {
            return false;  // Empty rule
        }
        
        // 3. Valid property syntax (key: value;)
        for rule in css.split('}') {
            if let Some(start) = rule.find('{') {
                let body = &rule[start + 1..];
                if !body.trim().is_empty() {
                    // Check for property: value; pattern
                    for prop in body.split(';') {
                        let prop = prop.trim();
                        if !prop.is_empty() && !prop.contains(':') {
                            return false;  // Invalid property
                        }
                    }
                }
            }
        }
        
        true
    }
    
    fn count_char(s: &str, ch: char) -> usize {
        s.chars().filter(|c| *c == ch).count()
    }
}
```

**CSS Validation Checks:**
1. Balanced braces: `{` count == `}` count
2. No empty rules: `{}`
3. Valid selectors: must have content before `{`
4. Valid properties: `key: value;` format
5. No invalid characters in selectors/properties

**Edge Cases to Test:**
- Media queries: `@media (min-width: 640px) { ... }`
- Pseudo-elements: `::before`, `::after`
- Pseudo-classes: `:hover`, `:focus`
- Attribute selectors: `[data-...]`
- Multiple selectors: `.class1, .class2 { ... }`

**Expected Outcomes:**
- ✅ 1000+ test iterations
- ✅ All generated CSS validates
- ✅ Any invalid CSS caught immediately
- ✅ Failure shows invalid CSS for debugging

---

## Property 4: Cache Eviction (Already Implemented)

**File:** `native/tests/property_cache_eviction.rs`

**Status:** ✅ Implementation complete (30+ test cases)

**Design (for reference):**
- Strategy: Generate cache operations (get, put, remove, clear)
- Property: After cache full, oldest items evicted first
- Verify: Recent items retained, older items removed
- Validation: Cache stats reflect eviction correctly

---

## Implementation Priority & Dependencies

### Session 3 Roadmap

**Phase 1: Fix Property 1** (~30 mins)
1. Read current `property_parser_determinism.rs`
2. Identify panic strategy error
3. Fix proptest macro configuration
4. Add explicit config: `ProptestConfig::with_cases(1000)`
5. Add strategy function: `class_string_strategy()`
6. Build & verify compilation
7. Run: `cargo test --test property_parser_determinism`

**Phase 2: Implement Properties 2, 5, 6** (~3-4 hours)
1. Create `property_round_trip_parsing.rs` (~200 LOC)
   - Implement: extract_class_from_css, normalize_css
   - Test: 1000+ iterations
   
2. Create `property_variant_composition.rs` (~250 LOC)
   - Implement: variant_combo_strategy, verify_precedence_order
   - Test: 1000+ iterations
   
3. Create `property_css_validity.rs` (~150 LOC)
   - Implement: is_valid_css, count_char
   - Test: 1000+ iterations

**Phase 3: Run All Property Tests** (~30 mins)
```bash
cargo test --test property_* --release
# Expected: 3000+ total test cases, all passing
```

**Phase 4: Documentation & CI/CD** (~1 hour)
- Document each property
- Create PROPERTY_TESTS_RESULTS.md
- Add to CI/CD workflow
- Test on CI (reduced cases: 500 each)

---

## Testing Strategy

### Unit Testing Properties
- Each property tested independently
- Proptest handles 1000+ iterations automatically
- Shrinking enabled for failures
- Regression file: `.proptest-regressions` for failed cases

### Integration Testing
- All properties run together
- Verify no interference
- Verify consistent results across runs

### Performance Expectations
- Property 1: ~5-10 seconds (1000 parser iterations)
- Property 2: ~10-15 seconds (1000 round-trips)
- Property 5: ~15-20 seconds (1000 variant combos)
- Property 6: ~5-10 seconds (1000 CSS validations)
- **Total: ~40-60 seconds** for all 4000+ test cases

---

## Error Handling & Edge Cases

### For All Properties
- ✅ Graceful handling of invalid inputs
- ✅ Clear error messages with shrunk counterexamples
- ✅ Regression detection (saved failing cases)
- ✅ Deterministic random generation

### Specific Considerations
- **Parser**: UTF-8 handling, long class names
- **Round-trip**: Theme variations, CSS minification
- **Variants**: Precedence ordering, conflicting modifiers
- **CSS**: Media queries, nested rules, special characters

---

## Success Criteria

✅ All tasks complete when:
1. Property 1: Compiles & 1000+ tests pass
2. Property 2: Implemented & 1000+ tests pass
3. Property 5: Implemented & 1000+ tests pass
4. Property 6: Implemented & 1000+ tests pass
5. All properties: Build succeeds (`cargo build --release`)
6. All properties: Full test suite passes
7. Documentation: Complete with findings
8. CI/CD: Integrated and verified

---

## Next Steps After Session 3

1. Run properties 4.8-4.10 (documentation & CI/CD)
2. Move to R5 (Variant precedence unit/integration tests)
3. Move to R6 (Resolver pool testing & benchmarks)
4. Optional: R7 & R8 (Export org & Fallback testing)

---

**Design Status:** ✅ READY FOR IMPLEMENTATION

Proceed with Session 3 when ready.
