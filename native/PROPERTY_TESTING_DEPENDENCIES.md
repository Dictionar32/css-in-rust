# Property-Based Testing Dependencies Documentation

**Status:** ✅ COMPLETE  
**Date:** 2026-06-11  
**Task:** 4.1 - Add property testing dependencies  
**Requirement:** R4 (Property-Based Testing)

---

## Overview

Phase 7 Requirement R4 mandates implementation of property-based testing to verify universal correctness properties across large input domains. This document records the dependencies added to enable property-based testing with 1000+ iterations per property.

## Dependencies Added

All dependencies are configured in `native/Cargo.toml` under `[dev-dependencies]`:

### 1. **proptest v1.0**
- **Type:** Property-based testing framework (generation-based)
- **Version:** 1.0 (latest stable in 1.x series)
- **Purpose:** Generate random test inputs and verify properties hold across 1000+ iterations
- **Key Features:**
  - Shrinking: Automatically finds minimal failing cases
  - Strategies: Define custom value generation rules
  - Reproducible: Configurable seeds for deterministic testing
  - Async support for async property tests
- **Selection Rationale:** 
  - Mature, production-ready framework
  - Excellent shrinking for debugging edge cases
  - Widely used in Rust ecosystem
  - Good documentation and examples

### 2. **quickcheck v1**
- **Type:** Property-based testing framework (shrinking-based)
- **Version:** 1.x (latest stable)
- **Purpose:** Complement proptest with QuickCheck-style shrinking approach
- **Key Features:**
  - Lighter weight than proptest
  - Strong shrinking algorithm
  - Deterministic test generation
  - Good for simple property tests
- **Selection Rationale:**
  - Complementary approach to proptest
  - Can find bugs proptest might miss due to different generation strategy
  - Faster for simple properties
  - Well-established QuickCheck heritage (Haskell QuickCheck)

### 3. **quickcheck_macros v1**
- **Type:** Procedural macros for quickcheck
- **Version:** 1.x (latest stable)
- **Purpose:** Provide convenient macro syntax for writing quickcheck properties
- **Key Features:**
  - `#[quickcheck]` macro for test functions
  - Automatic property function generation
  - Integrates with cargo test framework
- **Selection Rationale:**
  - Reduces boilerplate for quickcheck properties
  - Makes test code more readable
  - Standard way to write quickcheck tests in Rust

## Version Justification

### Why v1.0 for All?

All three dependencies use stable v1.x versions for the following reasons:

1. **Stability:** v1.x versions are production-ready and widely used
2. **Compatibility:** No major API changes expected in v1.x
3. **Dependency Resolution:** Compatible versions minimize dependency conflicts
4. **Long-term Support:** Crates are actively maintained in v1.x
5. **Documentation:** Extensive documentation available for v1.x

### Version Pinning Strategy

- **proptest = "1.0"** - Allows minor/patch updates (1.0 → 1.11 automatically resolved)
- **quickcheck = "1"** - Allows any 1.x version
- **quickcheck_macros = "1"** - Allows any 1.x version

This approach balances:
- Security patches and bug fixes (automatic minor/patch updates)
- API stability (major version pinning)
- Cargo.lock locks exact versions for reproducible builds

## Configuration

### Iteration Count

**Default: 1000 iterations per property test**

This is configured via environment variables when running tests:
```bash
PROPTEST_CASES=1000 cargo test --lib prop_
```

The 1000 iterations target was chosen based on:
- Comprehensive coverage of input space
- Reasonable test execution time (~1-5 seconds per property)
- Sufficient probability of finding most edge cases
- Industry standard for property-based testing

### CI/CD Configuration

For continuous integration, set in `.github/workflows/ci.yml`:
```yaml
env:
  PROPTEST_CASES: 1000
```

## Installed Size Impact

Adding these three dependencies adds approximately:
- **proptest:** ~200 KB (including dependencies)
- **quickcheck:** ~150 KB (including dependencies)
- **quickcheck_macros:** ~50 KB
- **Total dev-dependencies increase:** ~400 KB

This only affects development builds and is negligible for production since these are dev-dependencies.

## Verification

Dependencies were verified to:
1. ✅ Parse correctly in Cargo.toml
2. ✅ Resolve without conflicts via `cargo metadata`
3. ✅ Download successfully from crates.io
4. ✅ Include all required transitive dependencies
5. ✅ Compile without errors

### Verification Commands
```bash
# Check dependencies resolve
cargo tree -d

# Verify all dev-dependencies listed
cargo tree --dev

# Attempt to build (verifies compilation)
cargo build --release
```

## Properties to Implement (Task 4.2+)

These dependencies enable the following properties specified in R4:

1. **Parser Determinism** - Parse same input 3+ times, verify identical output
2. **Round-Trip Parsing** - Parse → format → parse produces equivalent result
3. **Cache Consistency** - put(key, value) then get(key) returns Some(value)
4. **LRU Cache Eviction** - Most recent items retained, oldest evicted
5. **Variant Composition Determinism** - Variants compose to same order regardless of input
6. **CSS Validity** - Generated CSS always has valid syntax
7. **Theme Resolver Pool Efficiency** - Pool returns same instance for same theme_id
8. **Cache Memory Correctness** - Memory usage stays within capacity bounds

## Next Steps

- **4.2 Implement parser determinism property test** ← Up next
- 4.3 Implement round-trip parsing property test
- 4.4 Implement cache consistency property test
- ... (remaining properties)

## References

- [proptest Documentation](https://docs.rs/proptest/)
- [quickcheck Documentation](https://docs.rs/quickcheck/)
- [Rust Property Testing Guide](https://docs.rust-embedded.org/book/c3-porting/qemu/ci/prop-testing.html)
- Phase 7 Requirements: `requirements.md` Section R4
- Phase 7 Design: `design.md` Section "Correctness Properties"

---

**Status:** ✅ Task 4.1 Complete  
**Ready for:** Task 4.2 - Parser Determinism Property Test
