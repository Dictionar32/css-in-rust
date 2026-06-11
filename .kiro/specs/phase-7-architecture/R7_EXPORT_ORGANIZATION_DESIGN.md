# Phase 7 R7 - TypeScript Export Organization Design

**Status:** Design Phase  
**Target:** Session 6  
**Effort:** 1-2 weeks | **Complexity:** Low | **Risk:** Low

---

## Overview

Organize TypeScript exports into sub-entry points for better tree-shaking and bundle size reduction.

**Goal**: Split `packages/domain/compiler` exports into:
- `/compiler` - Main compilation (generateCss, compileCss)
- `/parser` - Parsing utilities (parseClass, parseClasses)
- `/analyzer` - Analysis functions (analyze, getStats)
- `/cache` - Cache operations (getStats, clearCache, configureCacheBackend)
- `/redis` - Redis operations (configureRedis, getRedisCacheInfo)
- `/watch` - File watching (watch, watchClose, getWatchStats)

**Expected Result**: 30-40% bundle size reduction for consumers using only specific functions

---

## Implementation Structure

### Phase 1: Create Sub-entry Directories
- `packages/domain/compiler/src/compiler/` → index.ts, types.ts
- `packages/domain/compiler/src/parser/` → index.ts, types.ts
- `packages/domain/compiler/src/analyzer/` → index.ts, types.ts
- `packages/domain/compiler/src/cache/` → index.ts, types.ts
- `packages/domain/compiler/src/redis/` → index.ts, types.ts
- `packages/domain/compiler/src/watch/` → index.ts, types.ts

### Phase 2: Organize Existing Files
- Move related files to subdirs (e.g., `cssGeneratorNative.ts` → `compiler/`)
- Consolidate types per feature
- Remove circular dependencies

### Phase 3: Create Sub-entry Point Exports
Each directory has `index.ts` exporting only its functions:

```typescript
// src/compiler/index.ts
export { generateCss, compileCss, generateCssBatch } from './cssGenerator';
export type { CssGenerationOptions, CompiledCss } from './types';

// src/parser/index.ts
export { parseClass, parseClasses } from './parser';
export type { ParsedClass, ParsingOptions } from './types';

// etc.
```

### Phase 4: Update Main Entry Point
```typescript
// src/index.ts (maintains backward compatibility)
export * from './compiler';
export * from './parser';
export * from './analyzer';
export * from './cache';
export * from './redis';
export * from './watch';
```

### Phase 5: Update package.json Exports
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./compiler": "./dist/compiler/index.js",
    "./parser": "./dist/parser/index.js",
    "./analyzer": "./dist/analyzer/index.js",
    "./cache": "./dist/cache/index.js",
    "./redis": "./dist/redis/index.js",
    "./watch": "./dist/watch/index.js"
  }
}
```

---

## Tasks Summary

| Task | Files | Effort |
|------|-------|--------|
| 7.1 - Define structure | package.json | 30 min |
| 7.2 - Organize files | src/** | 45 min |
| 7.3 - Create indices | 6 index.ts | 30 min |
| 7.4 - Update main entry | src/index.ts | 15 min |
| 7.5 - Verify tree-shaking | build output | 30 min |
| 7.6 - Test imports | test files | 30 min |
| 7.7 - Update docs | README, MIGRATION | 30 min |
| 7.8 - Verify bundle size | build sizes | 15 min |

**Total: ~8 tasks, 3-4 hours**

---

## Test Files Example

```typescript
// test/exports.test.ts

import { generateCss } from '@css-in-rust/compiler';
import { parseClass } from '@css-in-rust/parser';
import { getStats } from '@css-in-rust/cache';
import { configureRedis } from '@css-in-rust/redis';

test('compiler export works', () => {
  const css = generateCss('p-4');
  expect(css).toBeDefined();
});

test('parser export works', () => {
  const parsed = parseClass('hover:text-red-500');
  expect(parsed.variants).toBeDefined();
});

test('cache export works', () => {
  const stats = getStats();
  expect(stats.hits).toBeDefined();
});
```

---

## Success Criteria

✅ All 8 tasks complete when:
1. Sub-entry points defined in package.json
2. Files organized into feature directories
3. Index files export correct functions
4. Main entry point re-exports all
5. Tree-shaking verified (unused code removed)
6. All sub-entry imports work
7. Docs updated with migration guide
8. Bundle size reduced 30-40%

