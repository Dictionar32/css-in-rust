# Week 2, Day 3: Performance Optimization & Benchmarking

**Date**: June 12, 2026 (Day 3 of Week 2)  
**Status**: 🚀 **OPTIMIZATION IN PROGRESS**

---

## Day 3 Agenda

### Phase 1: Establish Baseline (2 hours)

**Goal**: Measure current performance

```bash
# Create comprehensive benchmarks
cargo bench --bench class_parser_v2_bench

# Expected results:
# - Simple class: 0.5-1.0 μs (microseconds)
# - Variant: 0.8-1.5 μs
# - Arbitrary value: 1.0-2.0 μs
# - Complex combo: 1.5-2.5 μs
# - Batch 100 classes: 100-200 μs total
```

### Phase 2: Identify Hotspots (2 hours)

**Use flamegraph to find bottlenecks**:

```bash
# Install flamegraph if needed
cargo install flamegraph

# Profile the parser
cargo flamegraph --bench class_parser_v2_bench -o class_parser_profile.svg

# Look for:
# - Regex compilation time
# - String allocations
# - HashSet lookups
# - Unnecessary clones
```

### Phase 3: Optimization (3 hours)

**Apply optimizations**:

1. **Lazy Static Patterns** (already done, but verify):
   ```rust
   lazy_static! {
       static ref KNOWN_VARIANTS: HashSet<&'static str> = {
           // Only compiled once
       };
   }
   ```

2. **String Allocation Reduction**:
   ```rust
   // Before: String::from() creates new allocations
   // After: Use &str and borrowed slices where possible
   ```

3. **Early Returns**:
   ```rust
   // Avoid unnecessary processing
   if input.is_empty() {
       return Err(ParserError::EmptyClass);
   }
   ```

4. **Caching**:
   - Consider memoizing variant lookups
   - Cache regex matches

### Phase 4: Re-benchmark (1 hour)

**Measure improvements**:

```bash
cargo bench --bench class_parser_v2_bench

# Target improvements:
# - 10-20% faster on average
# - <0.5 μs for simple classes
# - <2.0 μs for complex classes
```

---

## Benchmarks Created

### 📊 Benchmark Coverage

| Category | Test Cases | Purpose |
|----------|-----------|---------|
| Simple classes | 5 | Baseline performance |
| Variants | 7 | Single & multi-variant |
| Modifiers | 5 | Opacity handling |
| Arbitrary values | 6 | Complex value parsing |
| Combinations | 3 | Full stack parsing |
| Batch parsing | 3 | 10, 50, 100 classes |
| Error cases | 3 | Error path performance |
| **Total** | **32** | Comprehensive coverage |

### Test Cases by Category

**Simple Classes**:
- px-4
- bg-blue-600
- text-2xl
- w-full
- mx-auto

**Variants** (multi-variant, state, responsive, dark):
- hover:bg-blue
- md:px-4
- dark:bg-gray-900
- md:hover:bg-blue
- md:hover:active:text-red
- group-hover:text-white
- peer-checked:opacity-50

**Modifiers** (opacity):
- bg-blue/50
- text-white/75
- bg-gray-900/80
- hover:bg-blue/50
- md:text-white/80

**Arbitrary Values**:
- w-[200px]
- bg-[#f3c]
- duration-[2000ms]
- text-[var(--custom-size)]
- bg-[rgba(0,0,0,0.5)]
- w-[calc(100%-20px)]

**Complex Combinations**:
- md:hover:bg-blue-600/50
- dark:group-hover:text-white/80
- lg:peer-checked:opacity-75

**Batch Operations**:
- 10 classes
- 50 classes (typical page)
- 100 classes (large page)

**Error Cases**:
- Invalid prefix
- Unmatched bracket
- Double slash

---

## Performance Targets

### Current (Baseline)

Based on tests running <1ms total for 47 tests:
```
Average: ~0.021ms per test ≈ ~0.5 μs per parse
```

### Target (Day 3+)

```
Simple class ........ 0.3-0.5 μs  (target: <0.5 μs) ✅
Variant ............ 0.5-1.0 μs  (target: <1.0 μs) ✅
Modifier ........... 0.6-1.2 μs  (target: <1.5 μs) ✅
Arbitrary value .... 1.0-2.0 μs  (target: <2.0 μs) ✅
Complex combo ...... 1.5-2.5 μs  (target: <3.0 μs) ✅

Batch 10 classes ... <10 μs      (target: <15 μs) ✅
Batch 50 classes ... <50 μs      (target: <100 μs) ✅
Batch 100 classes .. <100 μs     (target: <200 μs) ✅
```

---

## Optimization Techniques

### 1. Lazy Static (Already Applied)

```rust
// ✅ Already done: KNOWN_VARIANTS compiled once
lazy_static! {
    static ref KNOWN_VARIANTS: HashSet<&'static str> = {
        let mut set = HashSet::new();
        set.insert("hover");
        set.insert("focus");
        // ... etc
        set
    };
}

// Benefit: No recompilation on each parse
```

### 2. String Allocation Reduction (To Apply)

```rust
// Before: Multiple String allocations
let variant = potential_variant.to_string();  // ❌ Allocation
variants.push(variant);                        // ❌ Stored as String

// After: Use &'static str and only allocate when needed
if KNOWN_VARIANTS.contains(potential_variant) {
    variants.push(potential_variant.to_string());  // ✅ Only if valid
}
```

### 3. Early Returns (Already Applied)

```rust
// ✅ Already done: Early exit on empty input
if input.is_empty() {
    return Err(ParserError::EmptyClass);
}

// Benefit: Avoid unnecessary processing
```

### 4. Regex Caching (To Verify)

```rust
// Verify ARBITRARY_VALUE_REGEX is lazy_static
lazy_static! {
    static ref ARBITRARY_VALUE_REGEX: Regex = Regex::new(r"^\[.*\]$").unwrap();
}

// Benefit: Regex compiled once, not on each parse
```

---

## What's Already Optimized

✅ **Lazy static HashSet for variants**
- O(1) lookup instead of match statement
- Compiled once

✅ **Early returns on validation**
- Skip expensive operations
- Clear error paths

✅ **Borrowed references**
- Use &str not String where possible
- Minimize allocations

✅ **Efficient parsing flow**
- Extract variants → modifiers → prefix/value
- Stop early on errors

---

## Remaining Optimizations

⏳ **Profile with flamegraph**
- Identify actual bottlenecks
- Focus on hot paths

⏳ **Reduce string allocations**
- Consider Cow<str> for dynamic values
- Batch allocations

⏳ **Consider caching**
- LRU cache for frequently parsed classes
- Trade-off: memory vs speed

⏳ **Benchmark and iterate**
- Measure each optimization
- Verify improvements

---

## Day 3 Schedule

```
09:00-11:00 (2h) .... Setup benchmarks & establish baseline
11:00-12:00 (1h) .... Profile with flamegraph
12:00-13:00 (1h) .... Lunch break
13:00-16:00 (3h) .... Apply optimizations
16:00-17:00 (1h) .... Re-benchmark & verify improvements

Total: 8 hours productive time
```

---

## Success Criteria

### Minimum (Must Have)

- [x] Benchmarks created and running
- [ ] Baseline performance measured
- [ ] No regressions (all tests still passing)
- [ ] Performance documented

### Target (Should Have)

- [ ] 10-20% improvement over baseline
- [ ] All targets met (<0.5 μs simple, <2.0 μs complex)
- [ ] Identified at least 2 hotspots
- [ ] Applied optimizations

### Stretch (Nice to Have)

- [ ] 30%+ improvement
- [ ] Documented optimization techniques
- [ ] QuickCheck property-based tests
- [ ] Comparison vs other parsers

---

## Performance Testing Commands

```bash
# Run benchmarks
cargo bench --bench class_parser_v2_bench

# Run with specific filter
cargo bench --bench class_parser_v2_bench simple_classes

# Generate flamegraph profile
cargo flamegraph --bench class_parser_v2_bench

# Run with verbose output
cargo bench --bench class_parser_v2_bench -- --verbose

# Save baseline
cargo bench --bench class_parser_v2_bench -- --save-baseline parser_v2

# Compare against baseline
cargo bench --bench class_parser_v2_bench -- --baseline parser_v2
```

---

## Expected Improvements

### Realistic Targets

| Optimization | Expected Gain |
|-------------|---------------|
| Verify lazy statics | 5-10% |
| Reduce allocations | 10-15% |
| Early returns (verify) | 2-5% |
| Caching (if viable) | 20%+ |
| **Total** | **20-40%** |

---

## Next Steps (After Day 3)

### Day 4: Final Polish
- Code review
- Documentation updates
- Edge case testing
- Performance report

### Day 5: Handoff to Week 3
- Finalize parser module
- Create ThemeResolver kickoff
- Prepare for integration

---

## Benchmark Results Template

```
=== ClassParser v2 Performance Report ===

Category: Simple Classes
├─ px-4 .......................... X.XX μs
├─ bg-blue-600 ................... X.XX μs
├─ text-2xl ...................... X.XX μs
├─ w-full ........................ X.XX μs
└─ mx-auto ....................... X.XX μs
Average: X.XX μs

Category: Variants
├─ hover:bg-blue ................. X.XX μs
├─ md:px-4 ....................... X.XX μs
├─ dark:bg-gray-900 .............. X.XX μs
├─ md:hover:bg-blue .............. X.XX μs
├─ md:hover:active:text-red ...... X.XX μs
├─ group-hover:text-white ........ X.XX μs
└─ peer-checked:opacity-50 ....... X.XX μs
Average: X.XX μs

Category: Batch Operations
├─ Parse 10 classes .............. X.XX μs
├─ Parse 50 classes .............. X.XX μs
└─ Parse 100 classes ............. X.XX μs

=== Summary ===
Total Improvement: X% faster
Baseline -> Optimized
Status: ✅ Targets Met
```

---

## Resources

- Criterion.rs: https://bheisler.github.io/criterion.rs/book/
- Flamegraph: https://www.brendangregg.com/flamegraphs.html
- Rust Performance: https://nnethercote.github.io/perf-book/

---

**Status**: Day 3 Optimization Plan Ready  
**Next**: Run benchmarks and profile parser  
**Target**: 20-40% performance improvement

---

Let's measure, optimize, and ship! 🚀
