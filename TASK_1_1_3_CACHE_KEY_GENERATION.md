# Phase 1 - Task 1.1.3: Cache Key Generation

**Status:** 🆕 READY FOR IMPLEMENTATION  
**Duration:** 2-3 hours  
**Complexity:** Medium  
**Previous Task:** ✅ Task 1.1.2 (Config Parsing)

---

## Task Overview

Implementasi cache key generation strategy untuk CSS compilation caching di Redis. Cache key yang efisien, deterministic, dan collision-proof adalah fundamental untuk effective caching.

## Key Strategy

```
css-compiler:<file-hash>:<theme-id>:<variant-hash>

Components:
├── "css-compiler" → Prefix untuk semua keys
├── file-hash → Hash dari file content (SHA256 first 8 chars)
├── theme-id → Hash dari theme configuration
└── variant-hash → Hash dari CSS variants/modifiers
```

### Contoh Keys

```
css-compiler:a1b2c3d4:theme-001:var-base
css-compiler:a1b2c3d4:theme-001:var-hover
css-compiler:a1b2c3d4:theme-001:var-responsive
css-compiler:e5f6g7h8:theme-dark:var-base
```

## Requirements

### 1. Key Generation Function
```typescript
generateCacheKey(
  fileContent: string,
  themeConfig: ThemeConfig,
  variants: string[]
): string
```

**Inputs:**
- `fileContent` - Raw file content (Tailwind classes)
- `themeConfig` - Theme configuration object
- `variants` - Array of CSS variants/modifiers

**Output:**
- Deterministic cache key (string)
- Format: `css-compiler:<file-hash>:<theme-id>:<variant-hash>`

### 2. Hash Generation
- **File hash:** SHA256 dari file content → take first 8 chars
- **Theme hash:** SHA256 dari JSON.stringify(themeConfig) → take first 8 chars  
- **Variant hash:** SHA256 dari sorted variants join → use full or abbreviated

**Properties:**
- ✅ Deterministic (same input → same hash)
- ✅ Collision-resistant (SHA256)
- ✅ Compact (8 char hashes for prefix, abbreviated variants)
- ✅ Human-readable (can trace which file/theme/variant)

### 3. Key Validation
```typescript
validateCacheKey(key: string): boolean
```

**Validation Rules:**
- ✅ Must start with "css-compiler:"
- ✅ Must have exactly 4 parts separated by ":"
- ✅ File hash: 8 hex characters
- ✅ Theme ID: 8 hex characters or alphanumeric
- ✅ Variant hash: valid format
- ✅ Length: max 256 characters
- ✅ Only allowed chars: alphanumeric, dash, colon, underscore

### 4. Key Uniqueness Testing
```typescript
generateMultipleKeys(): string[]
```

**Test Scenarios:**
- ✅ Same file + same theme + same variants → same key (determinism)
- ✅ Different files + same theme → different keys
- ✅ Same file + different theme → different keys
- ✅ Same file + different variants → different keys
- ✅ 1000 random combinations → 0 collisions
- ✅ Whitespace handling (trim and normalize)
- ✅ Theme config deep equality (same content, different object reference)

### 5. Documentation
```
Cache Key Strategy
==================

Format: css-compiler:<file-hash>:<theme-id>:<variant-hash>

Example: css-compiler:a1b2c3d4:theme001:variant-base

Components:
- css-compiler: Fixed prefix for all cache entries
- file-hash: 8-char hash of file content (SHA256)
  - Changes when: CSS classes modified
  - Use: Invalidate cache on file edits
  
- theme-id: 8-char hash of theme config
  - Changes when: Theme configuration modified
  - Use: Support multiple themes simultaneously
  - Enables: Theme-aware caching
  
- variant-hash: Hash of CSS variants
  - Changes when: Modifiers/variants change
  - Use: Cache per-variant compilations
  - Enables: Incremental compilation

Uniqueness Guarantee:
- SHA256 hashing provides collision resistance
- Deterministic: identical inputs → identical keys
- Normalized: whitespace/formatting differences ignored

Performance:
- Key generation: < 1ms per key
- Redis lookup: O(1) with hashing
- Batch operations: support mget/mset for multiple keys

TTL Strategy:
- Default: 7 days (604800 seconds)
- Per-file: can override based on file importance
- Cache invalidation: automatic via TTL or manual flush
```

## Implementation Plan

### Phase 1: Core Functions (45 min)

**1. Create file** `packages/domain/compiler/src/utils/cacheKeyGenerator.ts`

```typescript
// Functions to implement:

// 1. Hash utility (SHA256)
export function sha256(input: string): string
  Input: any string
  Output: 64-char hex hash
  Use: base for all hash functions

// 2. File hash
export function generateFileHash(fileContent: string): string
  Input: CSS file content
  Output: 8-char hex (first 8 of SHA256)
  Handle: empty content, large files, encoding

// 3. Theme hash
export function generateThemeHash(themeConfig: ThemeConfig): string
  Input: theme configuration object
  Output: 8-char hex
  Handle: deep object comparison, undefined values

// 4. Variant hash
export function generateVariantHash(variants: string[]): string
  Input: array of variant names
  Output: hash of sorted variants
  Handle: empty array, duplicates

// 5. Main cache key generator
export function generateCacheKey(
  fileContent: string,
  themeConfig: ThemeConfig,
  variants: string[]
): string
  Input: all three components
  Output: "css-compiler:file:theme:variant"
  Compose: all hashes into final key

// 6. Key validator
export function validateCacheKey(key: string): boolean
  Input: cache key string
  Output: true/false
  Validate: format, length, characters
```

### Phase 2: Tests (90 min)

**Create file** `packages/domain/compiler/src/utils/cacheKeyGenerator.test.ts`

**Test Groups:**

1. **Hash Generation (8 tests)**
   - SHA256 consistency
   - File hash format
   - Theme hash with different configs
   - Variant hash with various inputs
   - Empty inputs
   - Large inputs (performance)
   - Unicode handling
   - Null/undefined handling

2. **Cache Key Generation (10 tests)**
   - Basic key format
   - Key structure validation
   - Special characters in content
   - Large theme configs
   - Many variants
   - Real-world CSS samples
   - Whitespace normalization
   - Concurrent key generation

3. **Key Validation (8 tests)**
   - Valid keys pass
   - Invalid prefix
   - Missing components
   - Invalid characters
   - Too long keys
   - Hex format validation
   - Boundary conditions
   - Edge cases

4. **Uniqueness & Determinism (12 tests)**
   - Same inputs → same key
   - Different file content → different key
   - Different theme → different key
   - Different variants → different key
   - No collisions in 1000 iterations
   - Variant order independence (sort before hash)
   - Theme deep equality (same values, diff refs)
   - Batch uniqueness

5. **Integration Tests (5 tests)**
   - Generate batch keys
   - Validate batch keys
   - Performance benchmark
   - Memory usage check
   - Concurrent generation safety

**Test Coverage Target:** 85%+ lines, 90%+ functions

### Phase 3: Documentation (15 min)

**Create doc** `packages/domain/compiler/src/utils/CACHE_KEY_STRATEGY.md`

```markdown
# Cache Key Generation Strategy

## Design Rationale
- Deterministic for reproducible caching
- Components enable granular invalidation
- SHA256 ensures collision resistance
- Readable format aids debugging

## Usage Examples
- Getting key for file
- Validating key format
- Batch operations
- Key expiration

## Performance Notes
- Generation time: < 1ms
- Redis compatibility
- Memory efficient

## Future Considerations
- Custom hash algorithms
- Compression for very long keys
- Key rotation strategy
- TTL optimization
```

---

## Definition of Done

- [ ] `cacheKeyGenerator.ts` implemented (6 functions)
- [ ] All functions pass JSDoc specification
- [ ] 43+ test cases pass
- [ ] 85%+ code coverage achieved
- [ ] Build succeeds: `npm run build`
- [ ] Tests run: `npm run test:all`
- [ ] Key format document created
- [ ] No TypeScript errors
- [ ] Performance verified (< 1ms per key)
- [ ] Backward compatible with existing code

## Success Criteria

✅ **Determinism:** Same inputs always produce same key
✅ **Collision-free:** 1000+ iterations with 0 collisions
✅ **Performance:** Key generation < 1ms per operation
✅ **Validation:** Comprehensive key format validation
✅ **Tests:** 43+ test cases, 85%+ coverage
✅ **Build:** npm run build succeeds

## Integration Points

**Used by:**
- Task 1.1.4 (Redis cache operations) - uses keys for get/set
- RedisManager - caching CSS compilation results
- WatchManager - invalidate cache on file changes

**Depends on:**
- Hash utilities (can use built-in `crypto`)
- Type definitions (ThemeConfig from types/redis.ts)

---

## Estimated Timeline

| Phase | Task | Est. Time |
|-------|------|-----------|
| 1 | Create generator functions | 45 min |
| 2 | Write comprehensive tests | 90 min |
| 3 | Documentation & cleanup | 15 min |
| - | **Total** | **2.5 hours** |

---

## Notes

- **Hash Algorithm:** Use Node.js built-in `crypto` module (no deps)
- **Format Choice:** Fixed separators enable easy parsing/validation
- **Collision Strategy:** SHA256 first 8 chars gives ~4B combinations (enough)
- **Future:** Could extend to support custom hash strategies if needed

**Next Task After Completion:** Task 1.1.4 (Redis Cache Operations)
