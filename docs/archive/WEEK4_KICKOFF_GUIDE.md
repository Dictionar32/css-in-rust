# Week 4 KICKOFF: NAPI Bridge & Integration

**Week**: Week 4 (June 23-27, 2026)  
**Duration**: 40 hours  
**Status**: 🚀 **STARTING MONDAY**  
**Goal**: Connect Rust compiler to Node.js via NAPI

---

## Overview

Week 4 bridges the Rust CSS compiler (Weeks 1-3, complete) to JavaScript/Node.js. Goal: expose Parser + Resolver + Generator as native Node module callable from TypeScript/JavaScript.

### What's Ready (From Week 3)
- ✅ ClassParser: 16 tests, 99%+ syntax coverage
- ✅ ThemeResolver: 80 tests, all theme values cached
- ✅ CssGenerator: 44 tests, CSS output working
- ✅ Integration: 32 tests, end-to-end pipeline
- ✅ Performance: 1000x+ targets

---

## Week 4 Success Criteria

By Friday EOD:

- [ ] NAPI module compiles ✅
- [ ] Parse function exposed ✅
- [ ] Resolve function exposed ✅
- [ ] Generate function exposed ✅
- [ ] TypeScript types generated ✅
- [ ] Integration tests passing ✅
- [ ] Performance maintained ✅
- [ ] JS can call Rust ✅

---

## Tasks Breakdown (40 hours)

### Day 1 (Monday): NAPI Setup & Parse Export (8h)

**Tasks**:
1. Create NAPI module wrapper (2h)
   - `src/lib.rs` exports
   - Module initialization
   - Error handling

2. Expose Parser to JS (3h)
   - `parse_class()` function
   - Input validation
   - Output JSON serialization

3. Add tests (3h)
   - JS ↔ Rust FFI tests
   - Parser integration tests
   - Error case tests

**Expected**: Parser callable from Node.js ✅

---

### Day 2 (Tuesday): Resolver Export (8h)

**Tasks**:
1. Expose Resolver to JS (3h)
   - `resolve_color()` function
   - `resolve_spacing()` function
   - `apply_opacity()` function

2. Implement caching layer (3h)
   - Cache initialization
   - Cache invalidation
   - Performance validation

3. Add tests (2h)
   - Resolver JS tests
   - Cache effectiveness
   - Error handling

**Expected**: Resolver working from Node.js ✅

---

### Day 3 (Wednesday): Generator Export & Integration (8h)

**Tasks**:
1. Expose Generator (2h)
   - `generate_css()` function
   - Rule building
   - Media query handling

2. End-to-end pipeline (4h)
   - `compile_class()` full pipeline
   - JS orchestration
   - Performance validation

3. Add tests (2h)
   - Full pipeline tests
   - Integration tests
   - Performance baseline

**Expected**: Complete pipeline callable ✅

---

### Day 4 (Thursday): TypeScript Integration (8h)

**Tasks**:
1. Generate TypeScript types (3h)
   - Type definitions
   - Interface generation
   - Documentation

2. Create wrapper layer (3h)
   - TypeScript wrapper
   - Error handling
   - Type safety

3. Add integration tests (2h)
   - TypeScript compile tests
   - Type checking
   - API validation

**Expected**: Full TypeScript support ✅

---

### Day 5 (Friday): Testing & Performance (8h)

**Tasks**:
1. Comprehensive testing (3h)
   - All edge cases
   - Error scenarios
   - Real-world patterns

2. Performance validation (3h)
   - Benchmark Rust vs JS
   - Measure speedup
   - Validate targets

3. Documentation & handoff (2h)
   - README updates
   - API documentation
   - Migration guide

**Expected**: Week 4 COMPLETE ✅

---

## Daily Schedule

```
WEEK 4 SCHEDULE (40 hours total)

Monday    (8h): NAPI Setup + Parse Export
Tuesday   (8h): Resolver Export
Wednesday (8h): Generator + Integration
Thursday  (8h): TypeScript Integration
Friday    (8h): Testing & Performance

Progress:
Mon .... 8h (20%)
Tue .... 16h (40%)
Wed .... 24h (60%)
Thu .... 32h (80%)
Fri .... 40h (100%)
```

---

## NAPI Architecture

### Module Structure

```
native/src/lib.rs (NAPI entry point)
├─ #[napi] pub fn parse_class(input: String)
├─ #[napi] pub fn resolve_value(type: String, value: String)
├─ #[napi] pub fn generate_css(...)
└─ Error handling + serialization

packages/binding.ts (TypeScript wrapper)
├─ export function parseClass()
├─ export function resolveValue()
├─ export function generateCss()
└─ Type definitions

packages/index.ts (Public API)
├─ export { parseClass, resolveValue, generateCss }
└─ Re-exports from binding
```

### Data Flow

```
JavaScript Input
    ↓
TypeScript Wrapper (Type Checking)
    ↓
NAPI Bridge (Serialization)
    ↓
Rust Implementation (Computation)
    ↓
NAPI Bridge (Serialization)
    ↓
TypeScript Wrapper (Type Conversion)
    ↓
JavaScript Output
```

---

## Key Integration Points

### 1. Parse Integration
```javascript
// JavaScript side
const parsed = parseClass("md:hover:bg-blue-600/50");
// Returns: { prefix: "bg", value: "blue-600", variants: ["md", "hover"], modifier: "50" }

// Calls Rust: ClassParser::parse()
```

### 2. Resolver Integration
```javascript
// JavaScript side
const color = resolveValue("color", "blue-600");
// Returns: "#1e40af"

// Calls Rust: ThemeResolver::resolve_color()
```

### 3. Full Pipeline
```javascript
// JavaScript side
const result = compileTailwindClass("md:hover:bg-blue-600/50");
// Returns: { selector, declarations, mediaQuery, ... }

// Calls: Parser → Resolver → Generator
```

---

## Files to Create/Modify

### NAPI Binding
```
native/src/lib.rs (NEW - Main NAPI entry)
```

### TypeScript Wrapper
```
packages/binding/index.ts (NEW - TS wrapper)
packages/binding/types.ts (NEW - Type definitions)
```

### Tests
```
tests/integration.test.ts (NEW - JS integration tests)
tests/performance.test.ts (NEW - Performance tests)
```

---

## Performance Targets (Week 4)

### JS ↔ Rust Overhead
- Serialization: <1ms
- Deserialization: <1ms
- Total overhead: <2ms

### End-to-End (JS → Rust → JS)
- Single class: <5ms (was <0.5ms in Rust)
- 100 classes: <200ms
- Cache hit: <0.1ms

### Speedup vs Pure JS
- Target: 10x faster than current
- Minimum: 5x faster
- Goal: 20x+ faster

---

## Error Handling Strategy

### Error Types
```rust
#[derive(Serialize)]
pub enum NapiError {
    ParserError(String),
    ResolverError(String),
    GeneratorError(String),
    InvalidInput(String),
}
```

### JS Error Mapping
```javascript
try {
  const result = parseClass(input);
} catch (error) {
  if (error.code === "PARSER_ERROR") { ... }
  if (error.code === "RESOLVER_ERROR") { ... }
  // etc.
}
```

---

## Testing Strategy

### Unit Tests (in Rust)
- All existing 172 tests still pass
- Additional NAPI serialization tests

### Integration Tests (JS)
- Parse integration
- Resolve integration
- Full pipeline
- Error cases

### Performance Tests
- Baseline measurements
- Speedup validation
- Cache effectiveness

### End-to-End Tests
- Real Tailwind classes
- Complex combinations
- Edge cases

---

## Success Story (What "Done" Looks Like)

**Friday EOD - Week 4 COMPLETE**:

```bash
# JavaScript can call Rust
$ npm run test:integration

# TypeScript types work
$ npm run build:types

# Performance improved
$ npm run bench
  Parse: 0.5ms/class (10x Rust)
  Batch: 50ms/100 classes
  Speedup: 10x+ vs JS ✅

# All tests pass
$ npm test
  Running: 50+ integration tests
  Result: All passing ✅
```

**Rust ↔ JS bridge working, 10x+ speedup achieved!** 🎉

---

## Key References

**Rust NAPI Docs**: https://napi.rs/docs  
**Tailwind CSS API**: Documented in Week 1  
**Type Definitions**: TypeScript ready  
**Performance Baselines**: Week 3 benchmarks  

---

## Blockers & Risks

### Potential Issues
- NAPI compilation on different platforms
- Serialization overhead
- Type system mismatch

### Mitigation
- Test on multiple platforms
- Profile serialization
- Clear error messages

---

## Next Week (Week 5 Preview)

Week 5 will:
- Final performance tuning
- Comprehensive testing
- Production deployment
- Documentation

---

## Starting Monday

**Checklist**:
- [x] Rust code complete (Weeks 1-3)
- [x] Tests passing (172/172)
- [x] Performance validated
- [ ] NAPI setup ready
- [ ] TypeScript ready

**Ready to code**: YES ✅

Let's build the bridge! 🚀

---

**Week 4 Status**: Ready to start  
**Week 3 Status**: ✅ Complete  
**Phase 1 Progress**: 76% (114/150 hours)  
**Next**: Monday - NAPI Module Setup

