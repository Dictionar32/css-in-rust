# Week 3 KICKOFF: ThemeResolver & CSS Generator

**Week**: Week 3 (June 16-20, 2026)  
**Duration**: 40 hours  
**Status**: 🚀 **STARTING MONDAY**  
**Goal**: Theme value resolution + CSS rule generation + 75+ tests passing

---

## Overview

Week 3 builds on Week 2's parser. We now implement:

1. **ThemeResolver** - Resolves theme values (colors, spacing, sizes)
2. **CssGenerator** - Converts resolved values to CSS rules
3. **VariantSystem** - Manages variant behavior and selectors

Combined: Input `bg-blue-600 md:hover:text-white` → Parse (Week 2) → Resolve (Week 3) → Generate (Week 3) → CSS output

---

## Week 3 Success Criteria

By Friday EOD:

- [ ] 50+ ThemeResolver tests passing ✅
- [ ] 25+ CssGenerator tests passing ✅
- [ ] Complete color resolution (30+ families) ✅
- [ ] Complete spacing resolution (0-96 scale) ✅
- [ ] Font size parsing working ✅
- [ ] LRU caching implemented ✅
- [ ] Zero compiler warnings ✅
- [ ] 100% code coverage ✅

---

## Tasks Breakdown (40 hours)

### Day 1 (Monday): ThemeResolver Core + Color Resolution (8h)

**Tasks**:
1. Complete ThemeResolver struct (2h)
   - LRU cache integration
   - Error handling
   - Theme config loading

2. Implement color resolution (3h)
   - All 30+ Tailwind color families
   - Opacity handling (blue/50, blue/75)
   - Custom color fallback

3. Add tests (3h)
   - 20+ color resolution tests
   - Cache hit/miss tests
   - Error cases

**Expected**: `resolve_color("blue-600")` → `#1e40af` ✅

**Deliverable**: ThemeResolver 60% complete

---

### Day 2 (Tuesday): Spacing + Font Sizes (8h)

**Tasks**:
1. Implement spacing resolution (3h)
   - 0, 0.5, 1, 1.5, 2, 3, 4, ... 96 scale
   - Negative values support
   - Custom spacing values

2. Implement font sizes (3h)
   - xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl, 7xl, 8xl, 9xl
   - Line height tuples
   - Letter spacing

3. Add tests (2h)
   - 15+ spacing tests
   - 15+ font size tests

**Expected**: Both resolvers 100% working

**Deliverable**: ThemeResolver 100% complete

---

### Day 3 (Wednesday): CSS Generator Integration (8h)

**Tasks**:
1. Complete CssGenerator (3h)
   - Selector building
   - Declaration generation
   - Media query wrapping

2. Implement variant handling (3h)
   - Responsive variants (sm, md, lg, xl, 2xl)
   - State variants (hover, focus, active)
   - Dark mode, group-hover, peer-checked

3. Add tests (2h)
   - 15+ generator tests
   - Variant handling tests

**Expected**: `bg-blue-600` → `.bg-blue-600 { background-color: #1e40af; }` ✅

**Deliverable**: CssGenerator 100% complete

---

### Day 4 (Thursday): LRU Caching + Optimization (8h)

**Tasks**:
1. LRU cache implementation (3h)
   - 1000-entry cache
   - Hit/miss tracking
   - Eviction policy

2. Performance testing (2h)
   - Benchmark resolver speed
   - Measure cache effectiveness
   - Target: <2ms per resolve

3. Optimization & polish (3h)
   - Early returns for common paths
   - Lazy-static initialization
   - Documentation

**Deliverable**: Performance benchmarks showing 50%+ improvement over uncached

---

### Day 5 (Friday): Final Testing + Handoff (8h)

**Tasks**:
1. Final test sweep (3h)
   - Run full test suite
   - Verify 75+ tests passing
   - Zero warnings/errors

2. Integration testing (2h)
   - Parser → Resolver → Generator pipeline
   - End-to-end smoke tests

3. Documentation + handoff (3h)
   - Module documentation
   - Performance report
   - Week 4 preparation

**Deliverable**: Week 3 COMPLETE with Week 4 ready

---

## Daily Schedule

```
WEEK 3 SCHEDULE (40 hours total)

Monday    (8h): ThemeResolver core + colors
Tuesday   (8h): Spacing + fonts
Wednesday (8h): CSS Generator
Thursday  (8h): Caching + optimization
Friday    (8h): Testing + handoff

Progress:
Mon .... 8h (20%)
Tue .... 16h (40%)
Wed .... 24h (60%)
Thu .... 32h (80%)
Fri .... 40h (100%)
```

---

## Key Design Principles

### 1. Performance First
- LRU cache for all theme lookups
- Early returns for common cases
- Zero clones where possible

### 2. Error Handling
- Clear error messages
- No panics on invalid input
- Graceful fallbacks

### 3. Test Coverage
- 75+ test cases across all modules
- Unit + integration tests
- Edge cases covered

### 4. Code Quality
- Zero compiler warnings
- 100% safe (no unsafe code)
- Comprehensive documentation

---

## Testing Strategy

### Unit Tests (By Module)

**ThemeResolver Tests**:
- Color resolution: 20 tests
  - All 30+ color families
  - Opacity handling
  - Custom colors
  - Error cases
- Spacing resolution: 15 tests
  - Standard scale (0-96)
  - Negative values
  - Custom spacing
- Font sizes: 15 tests
  - All size keywords
  - Line height tuples
  - Letter spacing

**CssGenerator Tests**:
- Selector generation: 10 tests
- Declaration building: 8 tests
- Variant handling: 7 tests

### Integration Tests (Resolver + Generator)

- End-to-end CSS generation: 5 tests
- Cache effectiveness: 3 tests
- Performance benchmarks: 2 tests

**Total**: 75+ tests

---

## Files to Create/Modify

### Files to Create
```
native/tests/theme_resolver_tests.rs       (500+ lines)
native/tests/css_generator_tests.rs        (400+ lines)
native/benches/theme_resolver_bench.rs     (150+ lines)
WEEK3_DAILY_STATUS.md                      (Track progress)
WEEK3_FINAL_REPORT.md                      (Summary)
```

### Files to Modify
```
native/src/application/theme_resolver.rs   (Complete 40%)
native/src/application/css_generator.rs    (Complete 50%)
native/src/application/variant_system.rs   (Update as needed)
native/src/application/mod.rs              (Update exports)
```

---

## Test Cases Reference

### ThemeResolver - Color Tests

```rust
// 30+ Tailwind color families
#[test]
fn test_resolve_slate_colors() { ... }      // slate-50 to slate-950
#[test]
fn test_resolve_gray_colors() { ... }       // gray-50 to gray-950
#[test]
fn test_resolve_zinc_colors() { ... }       // zinc-50 to zinc-950
#[test]
fn test_resolve_stone_colors() { ... }      // stone-50 to stone-950
#[test]
fn test_resolve_red_colors() { ... }        // red-50 to red-950
#[test]
fn test_resolve_orange_colors() { ... }     // orange-50 to orange-950
#[test]
fn test_resolve_amber_colors() { ... }      // amber-50 to amber-950
#[test]
fn test_resolve_yellow_colors() { ... }     // yellow-50 to yellow-950
#[test]
fn test_resolve_lime_colors() { ... }       // lime-50 to lime-950
#[test]
fn test_resolve_green_colors() { ... }      // green-50 to green-950
#[test]
fn test_resolve_emerald_colors() { ... }    // emerald-50 to emerald-950
#[test]
fn test_resolve_teal_colors() { ... }       // teal-50 to teal-950
#[test]
fn test_resolve_cyan_colors() { ... }       // cyan-50 to cyan-950
#[test]
fn test_resolve_sky_colors() { ... }        // sky-50 to sky-950
#[test]
fn test_resolve_blue_colors() { ... }       // blue-50 to blue-950
#[test]
fn test_resolve_indigo_colors() { ... }     // indigo-50 to indigo-950
#[test]
fn test_resolve_violet_colors() { ... }     // violet-50 to violet-950
#[test]
fn test_resolve_purple_colors() { ... }     // purple-50 to purple-950
#[test]
fn test_resolve_fuchsia_colors() { ... }    // fuchsia-50 to fuchsia-950
#[test]
fn test_resolve_pink_colors() { ... }       // pink-50 to pink-950
#[test]
fn test_resolve_rose_colors() { ... }       // rose-50 to rose-950

// Special colors
#[test]
fn test_resolve_black_white() { ... }       // black, white, transparent
#[test]
fn test_resolve_current() { ... }           // currentColor
#[test]
fn test_resolve_opacity_modifiers() { ... } // blue-600/50, red-500/75

// Error cases
#[test]
fn test_resolve_invalid_color() { ... }     // "invalid-color" → Error
#[test]
fn test_resolve_empty_string() { ... }      // "" → Error
```

### ThemeResolver - Spacing Tests

```rust
#[test]
fn test_resolve_spacing_zero() { ... }      // 0 → 0
#[test]
fn test_resolve_spacing_decimal() { ... }   // 0.5 → 0.125rem
#[test]
fn test_resolve_spacing_standard() { ... }  // 1-96, full scale
#[test]
fn test_resolve_spacing_negative() { ... }  // -m-1, -m-2, etc.
#[test]
fn test_resolve_spacing_custom() { ... }    // Custom theme values
#[test]
fn test_resolve_spacing_auto() { ... }      // auto value
#[test]
fn test_resolve_spacing_cache() { ... }     // Cache hit after first resolve
```

### CssGenerator Tests

```rust
#[test]
fn test_generate_simple_class() { ... }     // bg-blue-600 → CSS rule
#[test]
fn test_generate_with_variant() { ... }     // md:bg-blue-600 → @media query
#[test]
fn test_generate_with_hover() { ... }       // hover:bg-blue-600 → :hover selector
#[test]
fn test_generate_combined_variants() { ... } // md:hover:bg-blue-600
#[test]
fn test_generate_opacity_modifier() { ... }  // bg-blue-600/50 → rgba() value
#[test]
fn test_generate_arbitrary_value() { ... }   // w-[200px] → 200px
```

---

## Performance Targets

### ThemeResolver Performance
- Single resolve: <0.5ms (cached: <0.1ms)
- 100 resolves: <50ms
- Cache hit rate: >90% (after warmup)

### CssGenerator Performance
- Single generation: <0.5ms
- 100 generations: <50ms

### Combined Pipeline
- Parse + Resolve + Generate for 100 classes: <200ms

---

## Key References

**For implementation**:
- `native/src/application/class_parser_v2.rs` - Parser pattern reference
- `native/tests/class_parser_v2_tests.rs` - Test pattern reference
- `WEEK1_DAY3_RUST_DATA_STRUCTURES.md` - Type definitions
- `WEEK1_DAY5_CSS_RULE_GENERATION.md` - Generation algorithm

**For validation**:
- Tailwind CSS v4 default config
- 30+ color families with all shades
- Standard spacing scale (0, 0.5, 1, 1.5, 2, ... 96)
- All responsive breakpoints (sm, md, lg, xl, 2xl)

---

## Success Story (What "Done" Looks Like)

**Friday EOD - Week 3 COMPLETE**:

```bash
$ cargo test

running 75 tests

test result: ok. 75 passed; 0 failed

Theme Resolver Tests:
├─ Color resolution ............... 20/20 ✅
├─ Spacing resolution ............. 15/15 ✅
├─ Font size resolution ........... 15/15 ✅
└─ Error handling ................. 5/5 ✅

CSS Generator Tests:
├─ Simple classes ................. 10/10 ✅
├─ Variants ....................... 10/10 ✅
├─ Modifiers ...................... 5/5 ✅
└─ Integration .................... 5/5 ✅

Coverage: 100% ✅
Warnings: 0 ✅
Performance: <200ms/100 classes ✅
```

**Parser + Resolver + Generator = Complete Pipeline** 🎉

---

## Blockers & Risks

### None Currently Identified

✅ Parser (Week 2) complete and validated  
✅ Type system designed (Week 1)  
✅ Test strategy ready (Week 1)  
✅ All dependencies available  

---

## Next Week (Week 4 Preview)

Week 4 will integrate:
- NAPI FFI bridge to Node.js
- TypeScript type definitions
- Performance optimization
- Integration with existing JS codebase

Week 3 deliverables (Resolver + Generator) feed directly into Week 4.

---

## Starting Monday

**Checklist**:
- [x] Parser works (Week 2 ✅)
- [x] Design complete (Week 1 ✅)
- [x] Tests specified (Week 1 ✅)
- [x] Schedule ready (this doc)

**Ready to code**: YES ✅

Let's build! 🚀

---

**Week 3 Status**: Ready to start  
**Week 2 Status**: ✅ Complete  
**Phase 1 Progress**: 49% → moving to 82% (expected end of Friday)  
**Next**: Monday morning, start ThemeResolver implementation

