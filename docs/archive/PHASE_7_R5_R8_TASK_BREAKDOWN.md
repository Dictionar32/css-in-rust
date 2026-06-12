# Phase 7: R5-R8 Detailed Task Breakdown

**Date:** June 11, 2026  
**Focus:** Execution plan for final 34 tasks (R5-R8 + Integration + Documentation)

---

## R5: Variant System Precedence (5 tasks, 2-3 weeks)

### Design Summary
Define deterministic ordering of CSS variants based on semantic categories (Interaction, ColorScheme, Responsive, State, Custom). Implemented via `VariantPrecedence` enum in the variant system.

### Tasks

**5.1 Define variant precedence rules and enum** ⏳ TODO
- **File:** Create `native/src/domain/variant_precedence.rs`
- **Scope:** ~150 LOC
- **Deliverables:**
  - `VariantPrecedence` enum with 5 levels
  - `get_variant_precedence()` function
  - Comprehensive documentation with examples
- **Complexity:** Low
- **Time Estimate:** 2-3 hours

**5.2 Implement variant composition with precedence ordering** ⏳ TODO
- **File:** Update `native/src/application/variant_system.rs`
- **Scope:** ~100 LOC changes
- **Deliverables:**
  - `ResolvedVariant` struct with precedence field
  - Updated `compose_variants()` with sorting
  - Updated `resolve_variants()` to use precedence
- **Dependencies:** 5.1
- **Time Estimate:** 3-4 hours

**5.3 Create unit tests for precedence levels** ⏳ TODO
- **File:** Create `native/tests/variant_precedence_unit_tests.rs`
- **Scope:** ~200 LOC
- **Deliverables:**
  - Tests for each variant classification
  - Tests for precedence comparison
  - Tests for edge cases
  - 100% coverage of precedence logic
- **Dependencies:** 5.1
- **Expected Tests:** 15-20
- **Time Estimate:** 3-4 hours

**5.4 Create integration tests for variant composition ordering** ⏳ TODO
- **File:** Same file as 5.3
- **Scope:** ~150 LOC
- **Deliverables:**
  - Multi-variant composition tests
  - Determinism verification
  - Complex stacking scenarios
  - CSS output consistency tests
- **Dependencies:** 5.2
- **Expected Tests:** 10-12
- **Time Estimate:** 3-4 hours

**5.5 Verify backward compatibility with variant system** ⏳ TODO
- **Scope:** Full test suite execution
- **Deliverables:**
  - Full test pass (545+ existing tests)
  - Benchmark results
  - Backward compatibility documentation
- **Dependencies:** 5.1-5.4
- **Time Estimate:** 2-3 hours
- **Acceptance:** All existing tests passing, no performance regression

---

## R6: Theme Resolver Caching - Singleton Pool (8 tasks, 2-3 weeks)

### Design Summary
Implement `ThemeResolverPool` singleton using DashMap for thread-safe caching of theme resolver instances. Expected to provide 10-50x improvement for repeated compilations with same theme.

### Tasks

**6.1 Design and implement ThemeResolverPool singleton** ⏳ TODO
- **File:** Create `native/src/application/theme_resolver_pool.rs`
- **Scope:** ~250 LOC
- **Deliverables:**
  - `ThemeResolverPool` struct with lazy_static
  - `get_or_create(theme_id)` method
  - `stats()` method returning pool statistics
  - `clear()` and `remove()` methods
  - Comprehensive module documentation
- **Complexity:** Medium
- **Time Estimate:** 4-5 hours

**6.2 Implement thread-safe caching with DashMap** ⏳ TODO
- **File:** Same as 6.1
- **Scope:** ~150 LOC additions
- **Deliverables:**
  - DashMap integration
  - AtomicU64 hit/miss tracking
  - Thread-safe stats aggregation
  - Concurrent access tests
- **Dependencies:** 6.1
- **Time Estimate:** 3-4 hours

**6.3 Update NAPI bridge to use resolver pool** ⏳ TODO
- **File:** Update `native/src/infrastructure/napi_bridge_theme.rs`
- **Scope:** ~100 LOC changes
- **Deliverables:**
  - `resolve_color_cached()` function
  - `resolve_spacing_cached()` function
  - `resolve_font_size_cached()` function
  - `get_resolver_pool_stats()` function
  - `clear_resolver_pool()` function
- **Dependencies:** 6.1-6.2
- **Time Estimate:** 3-4 hours

**6.4 Create unit tests for resolver pool** ⏳ TODO
- **File:** Create `native/tests/resolver_pool_unit_tests.rs`
- **Scope:** ~250 LOC
- **Deliverables:**
  - Cache instance reuse verification
  - Hit/miss statistics tests
  - Concurrent access safety tests
  - Clear/remove operation tests
  - Performance characteristic tests
- **Dependencies:** 6.1-6.3
- **Expected Tests:** 20-25
- **Time Estimate:** 4-5 hours

**6.5 Create benchmark comparing cached vs non-cached** ⏳ TODO
- **File:** Create `native/benches/resolver_pool_bench.rs`
- **Scope:** ~200 LOC
- **Deliverables:**
  - Benchmark without pool
  - Benchmark with pool
  - Time & memory measurements
  - Results showing 10-50x improvement
  - Documentation of results
- **Dependencies:** 6.1-6.4
- **Time Estimate:** 3-4 hours

**6.6 Write property test for resolver pool behavior** ⏳ TODO
- **File:** Create `native/tests/property_resolver_pool.rs`
- **Scope:** ~150 LOC
- **Deliverables:**
  - Property: Pool returns same instance for same theme_id
  - 100+ iterations with random theme_ids
  - Concurrent access property verification
- **Dependencies:** 6.1, R4 (property testing framework)
- **Expected Tests:** 3-5
- **Time Estimate:** 2-3 hours

**6.7 Integrate pool stats into monitoring** ⏳ TODO
- **File:** Update `native/src/infrastructure/napi_bridge_cache.rs`
- **Scope:** ~50 LOC changes
- **Deliverables:**
  - Pool stats included in `get_cache_statistics()`
  - JSON export format
  - Dashboard-friendly structure
- **Dependencies:** 6.3-6.6
- **Time Estimate:** 1-2 hours

**6.8 Verify backward compatibility and performance** ⏳ TODO
- **Scope:** Full test suite + benchmarking
- **Deliverables:**
  - All tests passing
  - Performance improvements documented
  - Real-world scenario testing
  - Backward compatibility guarantee
- **Dependencies:** 6.1-6.7
- **Time Estimate:** 2-3 hours
- **Acceptance:** 10-50x improvement verified, all tests passing

---

## R7: TypeScript Export Organization (8 tasks, 1-2 weeks)

### Design Summary
Reorganize TypeScript exports into modular sub-entry points to improve tree-shaking effectiveness and provide better API surface. Create separate exports for: compiler, parser, analyzer, cache, redis, watch.

### Tasks

**7.1 Define export structure and sub-entry points** ⏳ TODO
- **File:** Update `packages/domain/compiler/package.json`
- **Scope:** Configuration changes
- **Deliverables:**
  - Sub-entry points defined (6 entry points)
  - TypeScript type definitions
  - Backward compatibility maintained
  - Export documentation
- **Complexity:** Low
- **Time Estimate:** 1-2 hours

**7.2 Organize TypeScript source files into subdirectories** ⏳ TODO
- **Scope:** File restructuring
- **Deliverables:**
  - `src/compiler/` directory
  - `src/parser/` directory
  - `src/analyzer/` directory
  - `src/cache/` directory
  - `src/redis/` directory
  - `src/watch/` directory
  - Source files organized
- **Time Estimate:** 2-3 hours

**7.3 Create sub-entry point index files** ⏳ TODO
- **Scope:** ~50 LOC per file
- **Deliverables:**
  - `src/compiler/index.ts`
  - `src/parser/index.ts`
  - `src/analyzer/index.ts`
  - `src/cache/index.ts`
  - `src/redis/index.ts`
  - `src/watch/index.ts`
  - Each exports only relevant types/functions
- **Dependencies:** 7.2
- **Time Estimate:** 2-3 hours

**7.4 Update main entry point for backward compatibility** ⏳ TODO
- **File:** Update `packages/domain/compiler/src/index.ts`
- **Scope:** ~100 LOC
- **Deliverables:**
  - Re-exports all sub-entry points
  - Full backward compatibility
  - Deprecation notices if appropriate
  - Migration guidance
- **Dependencies:** 7.3
- **Time Estimate:** 1-2 hours

**7.5 Verify tree-shaking effectiveness** ⏳ TODO
- **Scope:** Build & analysis
- **Deliverables:**
  - Build with `npm run build`
  - Bundle size analysis
  - esbuild analysis results
  - Tree-shaking verification
  - Documentation of improvements
- **Dependencies:** 7.1-7.4
- **Time Estimate:** 2-3 hours

**7.6 Test sub-entry point imports** ⏳ TODO
- **File:** Create test files importing from sub-entries
- **Scope:** ~150 LOC test code
- **Deliverables:**
  - Tests for each sub-entry import
  - Type verification
  - Functionality verification
- **Dependencies:** 7.3-7.5
- **Expected Tests:** 10-15
- **Time Estimate:** 2-3 hours

**7.7 Update documentation for export organization** ⏳ TODO
- **Files:** README.md, new EXPORT_ORGANIZATION.md
- **Scope:** Documentation
- **Deliverables:**
  - Sub-entry point documentation
  - Migration guides
  - Usage examples
  - API documentation updates
- **Dependencies:** 7.1-7.6
- **Time Estimate:** 2-3 hours

**7.8 Verify bundle size reduction** ⏳ TODO
- **Scope:** Measurement & comparison
- **Deliverables:**
  - Bundle size before/after
  - Measurements for each sub-bundle
  - Total reduction percentage
  - BUNDLE_SIZE_ANALYSIS.md document
- **Dependencies:** 7.5-7.7
- **Time Estimate:** 2-3 hours

---

## R8: Fallback Logic Testing (8 tasks, 1-2 weeks)

### Design Summary
Comprehensive testing of JavaScript fallback paths for all NAPI functions. Ensures graceful degradation when native module unavailable, with 130+ test cases covering all exported functions.

### Tasks

**8.1 Analyze current fallback paths** ⏳ TODO
- **Scope:** Analysis & documentation
- **Deliverables:**
  - Document all fallback scenarios
  - Identify coverage gaps
  - Create FALLBACK_ANALYSIS.md
  - Map all fallback implementations
- **Complexity:** Low
- **Time Estimate:** 2-3 hours

**8.2 Create test suite for fallback paths** ⏳ TODO
- **File:** Create `packages/domain/compiler/tests/fallback.test.ts`
- **Scope:** ~500 LOC
- **Deliverables:**
  - 130+ test cases (1 per exported function)
  - Mock native bridge failures
  - Fallback behavior verification
  - Error handling verification
- **Dependencies:** 8.1
- **Expected Tests:** 130+
- **Time Estimate:** 4-5 hours

**8.3 Test JavaScript fallback for parsing** ⏳ TODO
- **Scope:** ~100 LOC test code
- **Deliverables:**
  - `parseClass()` fallback tests
  - `parseClasses()` fallback tests
  - Output matching verification
  - Edge case coverage
- **Dependencies:** 8.2
- **Expected Tests:** 20-25
- **Time Estimate:** 2-3 hours

**8.4 Test JavaScript fallback for CSS generation** ⏳ TODO
- **Scope:** ~100 LOC test code
- **Deliverables:**
  - `generateCss()` fallback tests
  - `generateCssBatch()` fallback tests
  - Output matching
  - Minification fallback
- **Dependencies:** 8.2
- **Expected Tests:** 20-25
- **Time Estimate:** 2-3 hours

**8.5 Test JavaScript fallback for theme resolution** ⏳ TODO
- **Scope:** ~100 LOC test code
- **Deliverables:**
  - `resolveColor()` fallback tests
  - `resolveSpacing()` fallback tests
  - `resolveFontSize()` fallback tests
  - Opacity application tests
- **Dependencies:** 8.2
- **Expected Tests:** 15-20
- **Time Estimate:** 2-3 hours

**8.6 Test JavaScript fallback for cache operations** ⏳ TODO
- **Scope:** ~50 LOC test code
- **Deliverables:**
  - `getStats()` fallback
  - `clearCache()` fallback
  - `configureCacheBackend()` fallback
  - Graceful degradation verification
- **Dependencies:** 8.2
- **Expected Tests:** 8-10
- **Time Estimate:** 1-2 hours

**8.7 Improve error messages for fallback paths** ⏳ TODO
- **Scope:** Code review & messaging
- **Deliverables:**
  - Enhanced error messages
  - Clear fallback indication
  - Helpful suggestions
  - Error message documentation
- **Dependencies:** 8.3-8.6
- **Time Estimate:** 1-2 hours

**8.8 Run comprehensive fallback test suite** ⏳ TODO
- **Scope:** Full test execution
- **Deliverables:**
  - All 130+ tests passing
  - Coverage report (85%+)
  - Results documented in PHASE_7_R8_COMPLETE.md
  - User experience verified
- **Dependencies:** 8.1-8.7
- **Acceptance:** All tests passing, 85%+ coverage
- **Time Estimate:** 1-2 hours

---

## Integration & Verification (5 tasks, 2-3 weeks)

**9.1 - 9.8 Cross-phase integration tests and verification**
- Verify R5 works with R3 (NAPI modularization)
- Verify R6 works with R3 cache module
- Verify R7 exports accessible via new modules
- Run full test suite (Rust + TypeScript)
- Benchmark all improvements
- Verify backward compatibility

---

## Documentation & Closure (5 tasks, 1-2 weeks)

**10.1 - 10.5 Final documentation and Phase 7 completion**
- Create PHASE_7_COMPLETE.md
- Update architecture documentation
- Create migration guides
- Update inline code documentation
- Prepare for Phase 8 transition

---

## Timeline Estimate

| Phase | Start | Duration | Tasks | Status |
|-------|-------|----------|-------|--------|
| R5 | Week 1 | 2-3 weeks | 5 | ⏳ Ready |
| R6 | Week 2 | 2-3 weeks | 8 | ⏳ Ready |
| R7 | Week 3 | 1-2 weeks | 8 | ⏳ Ready |
| R8 | Week 3 | 1-2 weeks | 8 | ⏳ Ready |
| Integration | Week 5 | 2-3 weeks | 5 | ⏳ Ready |
| Documentation | Week 6 | 1-2 weeks | 5 | ⏳ Ready |
| **Total** | - | **6-8 weeks** | **34** | ⏳ |

---

## Quality Gates

✅ Each requirement must pass:
- 100% test pass rate
- No performance regression
- Backward compatibility maintained
- Code organization ≤200 LOC per module (R5-R8 applicable)
- Documentation complete

---

**Prepared For:** Session 5+ Execution  
**Generated:** June 11, 2026
