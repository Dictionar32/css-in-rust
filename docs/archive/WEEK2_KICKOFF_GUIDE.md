# Week 2 Kickoff Guide: Parser Implementation Starts Here

**Date**: June 10, 2026 (Monday, Week 2 Start)  
**Phase**: Phase 1 - Week 2  
**Task**: ClassParser production implementation  
**Duration**: 40 hours (1 week)  
**Status**: 🚀 READY TO START

---

## Quick Start: Monday Morning

### Before You Begin

1. **Read these in order** (30 minutes):
   - `WEEK1_DAY3_RUST_DATA_STRUCTURES.md` (ParsedClass definition)
   - `WEEK1_TAILWIND_PATTERNS_AUDIT.md` (what to parse)
   - `WEEK1_DAY6_TEST_STRATEGY.md` (65 test cases to implement)

2. **Verify POC works** (5 minutes):
   ```bash
   cd native
   cargo run --bin hello_world
   # Should show: ✅ POC successful!
   ```

3. **Set up Week 2** (10 minutes):
   ```bash
   # Create new branch for Week 2
   git checkout -b week2/parser-implementation
   
   # Build to ensure everything compiles
   cargo check
   ```

---

## Week 2 Overview

### What We're Building

**Full ClassParser** that handles:

```
Input:  "md:hover:bg-blue-600/50"
        ↓
Parse:  ParsedClass {
          variants: ["md", "hover"],
          prefix: "bg",
          value: "blue-600",
          modifier: Some("50"),
        }
```

### Why This Week Matters

- ClassParser is the **foundation** - everything depends on it
- Accounts for **8 out of 40 hours** of Week 2
- Must handle **90-95% of Tailwind syntax**
- Enables **Week 3-4** resolver and generator

### Success Criteria

- ✅ All 65 test cases passing
- ✅ <1ms per class parse (average)
- ✅ 100% error recovery
- ✅ No panics on malformed input

---

## Week 2 Task Breakdown

### Task 1: Setup & Scaffolding (2 hours)

**Goal**: Create empty modules and test structure

```bash
# 1. Create test file structure
mkdir -p native/tests/
touch native/tests/parser_tests.rs

# 2. Create test fixtures
touch native/tests/fixtures/test_classes.json
touch native/tests/fixtures/test_themes.json

# 3. Update Cargo.toml for tests
# (Already done, just verify)
```

**Test Root** (`native/tests/parser_tests.rs`):
```rust
//! Parser unit tests - 65 test cases

#[cfg(test)]
mod simple_class_tests {
    // 10 tests for: px-4, bg-blue-600, text-2xl, etc.
}

#[cfg(test)]
mod variant_tests {
    // 20 tests for: hover:, md:, dark:, etc.
}

#[cfg(test)]
mod arbitrary_tests {
    // 15 tests for: [200px], [#f3c], etc.
}

#[cfg(test)]
mod combination_tests {
    // 20 tests for: md:hover:bg-blue/50, etc.
}

#[cfg(test)]
mod error_tests {
    // 10 tests for: invalid input, error recovery
}
```

**Reference**: `WEEK1_DAY6_TEST_STRATEGY.md` Part 2 (all 65 tests specified)

---

### Task 2: Implement ClassParser Core (12 hours)

**Goal**: Parse simple and complex Tailwind classes

**File**: `native/src/application/class_parser.rs`

**Implementation phases**:

#### Phase 2a: Basic Parser (4 hours)
```rust
impl ClassParser {
    pub fn parse(input: &str) -> Result<ParsedClass, ParserError> {
        // 1. Trim and validate input
        let input = input.trim();
        if input.is_empty() {
            return Err(ParserError::EmptyClass);
        }

        // 2. Extract variant(s) - "hover:" or "md:hover:"
        let (variants, rest) = Self::extract_variants(input)?;

        // 3. Extract modifier - "/50"
        let (class_part, modifier) = Self::extract_modifier(rest)?;

        // 4. Split prefix and value - "px-4" → "px" + "4"
        let (prefix, value) = Self::split_prefix_value(class_part)?;

        Ok(ParsedClass {
            variants,
            prefix,
            value,
            modifier,
        })
    }

    // Helper methods
    fn extract_variants(input: &str) -> Result<(Vec<String>, &str), ParserError> { }
    fn extract_modifier(input: &str) -> Result<(&str, Option<String>), ParserError> { }
    fn split_prefix_value(input: &str) -> Result<(String, String), ParserError> { }
}
```

**Test as you go**:
```bash
# After each phase, run tests
cargo test parser_simple_tests
cargo test parser_variant_tests
# etc.
```

#### Phase 2b: Variant Handling (4 hours)
```rust
// Handle multi-variant stacking:
// "md:hover:bg-blue" → variants: ["md", "hover"]
// "hover:focus:active:text-red" → ["hover", "focus", "active"]

fn extract_variants(input: &str) -> Result<(Vec<String>, &str), ParserError> {
    let mut variants = Vec::new();
    let mut remaining = input;

    // Extract all variants (stop at first non-variant)
    while let Some(colon_idx) = remaining.find(':') {
        let potential_variant = &remaining[..colon_idx];
        
        // Check if it's a known variant
        if Self::is_valid_variant(potential_variant) {
            variants.push(potential_variant.to_string());
            remaining = &remaining[colon_idx + 1..];
        } else {
            break;
        }
    }

    Ok((variants, remaining))
}

fn is_valid_variant(s: &str) -> bool {
    matches!(s,
        "hover" | "focus" | "active" | "group-hover" | "peer-checked" |
        "sm" | "md" | "lg" | "xl" | "2xl" |
        "dark" | "first" | "last" | "disabled" | "before" | "after" |
        "group-focus" | "container" | // ... add all ~30 variants
    )
}
```

#### Phase 2c: Arbitrary Value Support (4 hours)
```rust
// Handle arbitrary values: "w-[200px]", "bg-[#f3c]", etc.
// Key: Balanced bracket matching

fn split_prefix_value(input: &str) -> Result<(String, String), ParserError> {
    // Find first dash
    let dash_idx = input.find('-')?;
    let prefix = &input[..dash_idx];
    let value_part = &input[dash_idx + 1..];

    // Check if value_part starts with bracket
    if value_part.starts_with('[') {
        // Handle arbitrary value
        let closing = value_part.find(']')?;
        let value = value_part[..=closing].to_string();
        Ok((prefix.to_string(), value))
    } else {
        // Normal value
        Ok((prefix.to_string(), value_part.to_string()))
    }
}
```

**Validation**: After implementing, run 12 parser tests:
```bash
cargo test parser_simple_tests
cargo test parser_variant_tests
cargo test parser_arbitrary_tests
# Should see: test result: ok. 47 passed
```

---

### Task 3: Error Handling & Recovery (6 hours)

**Goal**: No panics on bad input, helpful error messages

**Error Types** (from Day 3 design):
```rust
pub enum ParserError {
    EmptyClass,
    InvalidPrefix(String),
    UnmatchedBracket(String),
    UnknownVariant(String),
    MalformedModifier(String),
}

impl ParserError {
    pub fn suggestion(&self) -> Option<String> {
        // Use Levenshtein distance for suggestions
        // "hoevr:" → Did you mean "hover:"?
    }
}
```

**Implement**:
```rust
impl ClassParser {
    pub fn parse_with_recovery(input: &str) -> Result<ParsedClass, ParserError> {
        // Try parse
        match Self::parse(input) {
            Ok(parsed) => Ok(parsed),
            Err(ParserError::InvalidPrefix(p)) => {
                // Suggest similar prefixes
                let suggestion = Self::find_similar_prefix(&p);
                return Err(ParserError::InvalidPrefix(
                    format!("{} (did you mean '{}'?)", p, suggestion)
                ));
            }
            Err(e) => Err(e),
        }
    }
}
```

**Error Test Cases** (from Day 6):
```bash
cargo test parser_error_tests
# 10 tests for invalid input handling
```

---

### Task 4: Performance Optimization (4 hours)

**Goal**: <1ms average per class

**Current POC**: 2ms for 5 classes = 0.4ms each (already good!)

**Optimization targets**:

1. **Regex compilation** - Use lazy_static for regex patterns
   ```rust
   use lazy_static::lazy_static;
   use regex::Regex;

   lazy_static! {
       static ref VARIANT_REGEX: Regex = 
           Regex::new(r"^(hover|focus|active|...):").unwrap();
       static ref ARBITRARY_REGEX: Regex = 
           Regex::new(r"\[.*\]$").unwrap();
   }
   ```

2. **Avoid allocations** - Use &str where possible
   ```rust
   // Good: borrowed slices
   fn extract_variants(input: &str) -> (Vec<&str>, &str)

   // Avoid: excessive String clones
   ```

3. **Cache common variants** - Use phf (perfect hash function)
   ```rust
   use phf::phf_set;

   const KNOWN_VARIANTS: phf::Set<&'static str> = phf_set! {
       "hover", "focus", "active", "md", "lg", "dark", ...
   };

   fn is_valid_variant(s: &str) -> bool {
       KNOWN_VARIANTS.contains(s)
   }
   ```

**Benchmark during optimization**:
```bash
# After each optimization
cargo bench
# Look for: parse time decreasing
```

---

### Task 5: Testing & Validation (6 hours)

**Goal**: All 65 tests passing, 100% green

#### Phase 3a: Implement All 65 Tests

Reference: `WEEK1_DAY6_TEST_STRATEGY.md` Part 2

```bash
# Run tests incrementally
cargo test parser_simple_tests        # 10 tests
cargo test parser_variant_tests       # 20 tests
cargo test parser_arbitrary_tests     # 15 tests
cargo test parser_combination_tests   # 20 tests
cargo test parser_error_tests         # 10 tests

# Total: 65 tests
```

#### Phase 3b: Property-Based Tests

```bash
# QuickCheck: never panic on any input
cargo test quickcheck_

# Should show:
# test quickcheck_parser_never_panics ... ok (1000 tests)
```

#### Phase 3c: Integration Tests

```bash
# Full pipeline: parse → validate
cargo test integration_parser_

# Should show:
# test integration::parse_to_resolve ... ok
```

#### Phase 3d: Coverage Report

```bash
# Code coverage (optional but recommended)
cargo tarpaulin --out Html

# Target: >95% coverage for ClassParser
```

**Expected Result**:
```
test result: ok. 65 passed (from 70 total, 5 skipped)
Coverage: 97.2%
Benchmarks: avg 0.38ms per class ✅
```

---

## Week 2 Daily Schedule

### Monday (Day 1): Setup + Basic Parser
- [ ] 9:00-11:00 - Read Week 1 docs + verify POC
- [ ] 11:00-13:00 - Setup scaffolding + test structure
- [ ] 14:00-16:00 - Implement basic parser (Phase 2a)
- [ ] 16:00-17:00 - Run simple tests + debug
- **Deliverable**: Basic classes parsing (px-4, bg-blue)

### Tuesday (Day 2): Variant Handling
- [ ] 9:00-11:00 - Implement variant extraction (Phase 2b)
- [ ] 11:00-13:00 - Handle multi-variant stacking
- [ ] 14:00-16:00 - Test variant cases + refine
- [ ] 16:00-17:00 - Performance check
- **Deliverable**: All variant tests passing (20 tests)

### Wednesday (Day 3): Arbitrary Values + Modifiers
- [ ] 9:00-11:00 - Implement arbitrary value parsing
- [ ] 11:00-13:00 - Add modifier support (/50)
- [ ] 14:00-16:00 - Test arbitrary + combination cases
- [ ] 16:00-17:00 - Debug complex cases
- **Deliverable**: 55+ tests passing

### Thursday (Day 4): Error Handling + Optimization
- [ ] 9:00-11:00 - Implement error recovery
- [ ] 11:00-13:00 - Add helpful error messages
- [ ] 14:00-16:00 - Performance optimization
- [ ] 16:00-17:00 - Benchmark and profile
- **Deliverable**: Error tests passing, <1ms perf

### Friday (Day 5): Final Testing + Documentation
- [ ] 9:00-11:00 - Run all 65 tests
- [ ] 11:00-13:00 - Property-based testing
- [ ] 14:00-15:00 - Code review + refactor
- [ ] 15:00-16:00 - Documentation + comments
- [ ] 16:00-17:00 - Prepare for Week 3
- **Deliverable**: ✅ All tests passing, ready for Week 3

---

## Week 2 Deliverables

### Code Artifacts

```
native/src/application/
├─ class_parser.rs (270+ lines)
│  ├─ ClassParser struct
│  ├─ parse() method
│  ├─ Helper functions
│  └─ Error handling

native/tests/
├─ parser_tests.rs (600+ lines)
│  ├─ 10 simple class tests
│  ├─ 20 variant tests
│  ├─ 15 arbitrary value tests
│  ├─ 20 combination tests
│  └─ 10 error handling tests

native/tests/fixtures/
├─ test_classes.json
├─ test_themes.json
└─ expected_output.json
```

### Test Results

```
test result: ok. 65 passed; 5 skipped
Coverage: 97.2%
Performance: 0.38ms per class average
```

### Documentation

```
Week 2 Summary: ClassParser Complete
├─ Implementation notes
├─ Performance analysis
├─ Test coverage report
└─ Known limitations & future work
```

---

## Key Files to Reference

### Design Documents (Week 1)

| File | Use For |
|------|---------|
| `WEEK1_TAILWIND_PATTERNS_AUDIT.md` | What patterns to parse |
| `WEEK1_DAY3_RUST_DATA_STRUCTURES.md` | ParsedClass definition |
| `WEEK1_DAY6_TEST_STRATEGY.md` | All 65 test cases |
| `WEEK1_DAY7_POC_SETUP.md` | Reference implementation |

### Development Files (Week 2)

| File | Purpose |
|------|---------|
| `native/src/application/class_parser.rs` | Main implementation |
| `native/tests/parser_tests.rs` | Test suite |
| `Cargo.toml` | Dependencies |
| `.cargo/config.toml` | Build settings |

---

## Dependencies & Tools

### Already Installed

```
regex = "1"              # For pattern matching
lazy_static = "1.4"      # For lazy regex compilation
quickcheck = "1"         # For property-based testing
serde_json = "1"         # For test fixtures
```

### Optional (Recommended)

```
# For benchmarking
criterion = "0.5"

# For coverage report
cargo-tarpaulin = "0.20"

# For code formatting
rustfmt
```

---

## Common Issues & Solutions

### Issue: Tests failing on first run
**Solution**: 
```bash
cargo clean
cargo build
cargo test
```

### Issue: "expected 'lifetime parameter" error
**Solution**: This is common with new Rust code. Check:
- Are lifetimes properly annotated?
- Are borrowed references used correctly?
- Run: `cargo check` for detailed error messages

### Issue: Performance not meeting <1ms target
**Solution**:
```bash
# Profile with flamegraph
cargo flamegraph

# Look for: String allocations, regex recompilation
# Optimize: Use lazy_static, avoid clones
```

### Issue: Can't find ParsedClass type
**Solution**:
```rust
// Add to class_parser.rs or import
use crate::domain::parsed_class::ParsedClass;
```

---

## Code Review Checklist (Friday)

Before marking Week 2 complete:

- [ ] All 65 tests passing
- [ ] No compiler warnings
- [ ] No clippy warnings: `cargo clippy`
- [ ] Code formatted: `cargo fmt`
- [ ] Performance: <1ms average (measure with criterion)
- [ ] Error handling: No panics on bad input
- [ ] Documentation: All public functions documented
- [ ] Comments: Complex logic explained
- [ ] Git: Commits are logical and well-named

---

## Success Metrics

### Code Quality

| Metric | Target | Acceptance |
|--------|--------|-----------|
| Test pass rate | 100% | 65/65 ✅ |
| Code coverage | >95% | >95% ✅ |
| Compiler warnings | 0 | 0 ✅ |
| Clippy warnings | 0 | 0 ✅ |

### Performance

| Metric | Target | Acceptance |
|--------|--------|-----------|
| Single parse | <1ms | <0.5ms ✅ |
| 100 classes | <50ms | <40ms ✅ |
| Memory usage | <1MB | <500KB ✅ |

### Functionality

| Metric | Target | Acceptance |
|--------|--------|-----------|
| Tailwind patterns | 90%+ | 95%+ ✅ |
| Error recovery | 100% | 100% ✅ |
| Parity with POC | Yes | Yes ✅ |

---

## Week 3 Handoff

By end of Friday:

- ✅ ClassParser fully implemented (270 lines)
- ✅ All 65 tests passing (100% pass rate)
- ✅ Performance targets met (<1ms)
- ✅ Zero technical debt
- ✅ Ready for ThemeResolver (Week 3)

**Week 3 Starts With**: Theme resolution using ParsedClass from Week 2

---

## Getting Help

If stuck during Week 2:

1. **Check test failures first**: `cargo test -- --nocapture`
2. **Review POC implementation**: `native/src/bin/hello_world.rs`
3. **Reference Week 1 docs**: Especially `WEEK1_DAY6_TEST_STRATEGY.md`
4. **Measure performance**: Use cargo bench to identify bottlenecks
5. **Ask questions**: Document what's blocking

---

## Summary

### Week 2 Mission: ClassParser Production Implementation

**Start**: Monday 9:00 AM  
**End**: Friday 5:00 PM  
**Duration**: 40 hours  
**Outcome**: Full parser handling 90-95% of Tailwind syntax  

**Success Criteria**:
- ✅ 65 tests passing
- ✅ <1ms performance
- ✅ 0 panics
- ✅ Ready for Week 3

**You've got this! 🚀**

---

**Ready to Begin Week 2?**

```bash
# Quick start
cd native
git checkout -b week2/parser-implementation
cargo check

# Let's code! 💪
```

---

**Document**: Week 2 Kickoff Guide  
**Date**: June 10, 2026  
**Status**: Ready to Start  
**Next**: Week 2 Daily Progress Updates
