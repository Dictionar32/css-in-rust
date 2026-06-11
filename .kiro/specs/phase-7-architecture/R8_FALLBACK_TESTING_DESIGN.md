# Phase 7 R8 - Fallback Logic Testing Design

**Status:** Design Phase  
**Target:** Session 6  
**Effort:** 1-2 weeks | **Complexity:** Low | **Risk:** Low

---

## Overview

Test JavaScript fallback implementations for all 130+ exported functions when native binding is unavailable.

**Goal**: Ensure graceful degradation with complete fallback coverage

---

## Test Structure

### Category 1: Parsing Functions (20 tests)
- `parseClass()` fallback
- `parseClasses()` fallback  
- `parseClassesStream()` fallback
- Edge cases (invalid input, special chars)

**File**: `packages/domain/compiler/tests/fallback-parsing.test.ts`

### Category 2: CSS Generation (30 tests)
- `generateCss()` fallback
- `generateCssBatch()` fallback
- `generateCssStream()` fallback
- Minification fallback
- Edge cases (large inputs, special values)

**File**: `packages/domain/compiler/tests/fallback-generation.test.ts`

### Category 3: Theme Resolution (25 tests)
- `resolveColor()` fallback
- `resolveSpacing()` fallback
- `resolveFontSize()` fallback
- `resolveOpacity()` fallback
- Complex value resolution

**File**: `packages/domain/compiler/tests/fallback-resolution.test.ts`

### Category 4: Cache Operations (15 tests)
- `getStats()` fallback
- `clearCache()` fallback
- `configureCacheBackend()` fallback
- Stats structure without cache

**File**: `packages/domain/compiler/tests/fallback-cache.test.ts`

### Category 5: Watch System (10 tests)
- `watch()` fallback (no-op)
- `watchClose()` fallback (no-op)
- `getWatchStats()` fallback (empty)

**File**: `packages/domain/compiler/tests/fallback-watch.test.ts`

### Category 6: Analysis Functions (15 tests)
- `analyze()` fallback
- `getAnalysisStats()` fallback
- Memory profiling fallback

**File**: `packages/domain/compiler/tests/fallback-analysis.test.ts`

### Category 7: Redis Functions (10 tests)
- `configureRedis()` fallback (no-op)
- `getRedisCacheInfo()` fallback (empty)
- `flushRedisCache()` fallback (no-op)

**File**: `packages/domain/compiler/tests/fallback-redis.test.ts`

### Category 8: Error Handling (5 tests)
- Error messages when native unavailable
- Helpful suggestions provided
- Fallback graceful error handling

**File**: `packages/domain/compiler/tests/fallback-errors.test.ts`

---

## Implementation Approach

### Test Pattern
```typescript
describe('Fallback: parseClass', () => {
  beforeEach(() => {
    // Mock native binding to unavailable
    mockNativeUnavailable();
  });

  test('should parse class with fallback', () => {
    const result = parseClass('hover:p-4');
    
    // Should match native output
    expect(result.variants).toContain('hover');
    expect(result.utility).toBe('p-4');
  });

  test('should handle edge cases', () => {
    const result = parseClass('invalid::class');
    
    // Should not crash, provide error or empty result
    expect(result).toBeDefined();
  });

  test('error message helpful when native unavailable', () => {
    const result = parseClass('p-4');
    
    if (result.error) {
      expect(result.error).toContain('native');
      expect(result.error).toContain('fallback');
    }
  });
});
```

### Mock Strategy
```typescript
// Test utils
export function mockNativeUnavailable() {
  // Simulate native binding not loaded
  jest.doMock('../nativeBridge', () => ({
    parseClassNative: undefined,
    generateCssNative: undefined,
    // ... all native methods undefined
  }));
}

export function mockNativeAvailable() {
  jest.resetModules();
  // Native binding available again
}
```

---

## Task Breakdown

| Task | Tests | File | Effort |
|------|-------|------|--------|
| 8.1 - Analyze fallbacks | - | FALLBACK_ANALYSIS.md | 30 min |
| 8.2 - Create test suite | 130 | fallback-*.test.ts | 2 hours |
| 8.3 - Parse fallback | 20 | fallback-parsing.test.ts | 30 min |
| 8.4 - Generation fallback | 30 | fallback-generation.test.ts | 45 min |
| 8.5 - Resolution fallback | 25 | fallback-resolution.test.ts | 40 min |
| 8.6 - Cache fallback | 15 | fallback-cache.test.ts | 25 min |
| 8.7 - Error messages | 5 | fallback-errors.test.ts | 20 min |
| 8.8 - Run full suite | - | test execution | 30 min |

**Total: ~8 tasks, 4-5 hours**

---

## Coverage Goals

| Function Type | Coverage Target | Status |
|---|---|---|
| Parsing (10 funcs) | 100% with fallback | ✅ 20 tests |
| Generation (15 funcs) | 100% with fallback | ✅ 30 tests |
| Resolution (8 funcs) | 100% with fallback | ✅ 25 tests |
| Cache (6 funcs) | 100% with fallback | ✅ 15 tests |
| Watch (4 funcs) | 100% no-op | ✅ 10 tests |
| Analysis (5 funcs) | 100% with fallback | ✅ 15 tests |
| Redis (3 funcs) | 100% no-op | ✅ 10 tests |

**Total: 51 functions → 130 test cases**

---

## Success Criteria

✅ All 8 tasks complete when:
1. Fallback analysis document complete (all paths identified)
2. Test suite created (130+ tests)
3. Parsing fallback tests passing
4. Generation fallback tests passing
5. Resolution fallback tests passing
6. Cache fallback tests passing
7. Error messages improved
8. Full fallback suite passes (100%)

---

## Build & Test Verification

```bash
# Run all fallback tests
npm test -- fallback

# Expected output:
# ✅ 130+ tests passing
# ✅ Coverage: 85%+
# ✅ All fallback paths tested
```

