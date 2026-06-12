# ⚡ Quick Start: Implement 196 Functions
## tailwind-styled-v4 - Practical Implementation Guide

---

## 5-Minute Overview

Semua 196 fungsi mengikuti **pattern yang sama**:

```typescript
// 1. Load native binding
const native = require(resolveNativeBinary())

// 2. Create TypeScript interface
export interface MyResult {
  field1: string
  field2: number
}

// 3. Wrap function with error handling
export async function myFunction(param: string): Promise<MyResult> {
  try {
    const result = native.my_rust_function(param)
    return JSON.parse(result)
  } catch (error) {
    console.error('[MyModule] Error:', error)
    return { field1: '', field2: 0 }  // fallback
  }
}

// 4. Export in barrel export
export const myModule = { myFunction }
```

---

## Step-by-Step Implementation (Pick ONE Domain)

### Step 1: Create Module File

```bash
# Pilih satu dari 6 domain ini:
# 1. packages/domain/compiler/src/cacheAnalytics.ts
# 2. packages/domain/compiler/src/classAnalysis.ts
# 3. packages/infrastructure/watch/src/watchManager.ts
# 4. packages/domain/compiler/src/parsingUtilities.ts
# 5. packages/domain/compiler/src/idRegistry.ts
# 6. packages/domain/compiler/src/cssGenerator.ts

touch packages/domain/compiler/src/cacheAnalytics.ts
```

### Step 2: Copy Template

```typescript
// packages/domain/compiler/src/cacheAnalytics.ts

import { resolveNativeBinary } from "@tailwind-styled/shared"

const native = require(resolveNativeBinary())

/**
 * INTERFACES
 */

export interface CacheStats {
  total_entries: number
  total_size_bytes: number
  hit_rate: number
  // ... add more fields
}

/**
 * FUNCTIONS
 */

export async function getCacheStatistics(): Promise<CacheStats> {
  try {
    const result = native.get_cache_stats()
    return JSON.parse(result)
  } catch (error) {
    console.error('[CacheAnalytics] Error:', error)
    return { total_entries: 0, total_size_bytes: 0, hit_rate: 0 }
  }
}

// ... repeat for each function
```

### Step 3: Add to Compiler Index

```typescript
// packages/domain/compiler/src/index.ts

export {
  getCacheStatistics,
  // ... other functions
  cacheAnalytics,
} from './cacheAnalytics'
```

### Step 4: Test

```typescript
// packages/domain/compiler/__tests__/cacheAnalytics.test.ts

import { getCacheStatistics } from '../src/cacheAnalytics'

describe('Cache Analytics', () => {
  it('should get cache stats', async () => {
    const stats = await getCacheStatistics()
    expect(stats).toHaveProperty('hit_rate')
  })
})
```

### Step 5: Run Test

```bash
npm test -- cacheAnalytics
```

---

## Mapping: Rust Function → TypeScript Wrapper

### CACHE (20 functions)
| Rust | TypeScript | File |
|------|-----------|------|
| `get_cache_stats` | `getCacheStatistics()` | cacheAnalytics.ts |
| `get_parse_stats` | `getParseStatistics()` | cacheAnalytics.ts |
| `clear_compile_cache_napi` | `clearCompileCache()` | cacheAnalytics.ts |
| `clear_all_caches_napi` | `clearAllCaches()` | cacheAnalytics.ts |
| `recommend_caching_strategy` | `recommendCachingStrategy()` | cacheAnalytics.ts |
| `configure_cache_backend` | `configureCacheBackend()` | cacheAnalytics.ts |
| `get_cache_optimization_hints` | `getCacheOptimizationHints()` | cacheAnalytics.ts |
| `scan_cache_get` | `scanCacheEntries()` | cacheAnalytics.ts |
| ... (13 more) | ... | cacheAnalytics.ts |

### CLASS ANALYSIS (16 functions)
| Rust | TypeScript | File |
|------|-----------|------|
| `analyze_classes` | `analyzeClasses()` | classAnalysis.ts |
| `detect_dead_code` | `detectDeadCode()` | classAnalysis.ts |
| `detect_class_conflicts` | `detectClassConflicts()` | classAnalysis.ts |
| `extract_all_classes` | `extractAllClasses()` | classAnalysis.ts |
| `has_tw_usage` | `hasTailwindUsage()` | classAnalysis.ts |
| `diff_class_lists` | `diffClassLists()` | classAnalysis.ts |
| ... (10 more) | ... | classAnalysis.ts |

### WATCH (10 functions)
| Rust | TypeScript | File |
|------|-----------|------|
| `watch_files` | `watchManager.watch()` | watchManager.ts |
| `get_watch_stats` | `watchManager.getStats()` | watchManager.ts |
| `get_watch_performance` | `watchManager.getPerformance()` | watchManager.ts |
| `poll_watch_events` | `watchManager.pollEvents()` | watchManager.ts |
| `stop_watch` | `watchManager.stop()` | watchManager.ts |
| `get_active_watches` | `WatchManager.getActiveWatches()` | watchManager.ts |
| `set_watch_aggregation` | `WatchManager.setAggregation()` | watchManager.ts |
| ... (3 more) | ... | watchManager.ts |

### PARSING (15 functions)
| Rust | TypeScript | File |
|------|-----------|------|
| `parse_classes` | `parseClassesDetailed()` | parsingUtilities.ts |
| `parse_css_rules` | `parseCSSRules()` | parsingUtilities.ts |
| `parse_subcomponent_blocks_napi` | `parseSubComponentBlocks()` | parsingUtilities.ts |
| `validate_component_config_native` | `validateComponentConfig()` | parsingUtilities.ts |
| `normalize_and_dedup_classes` | `normalizeAndDedupeClasses()` | parsingUtilities.ts |
| `flatten_and_resolve` | `flattenAndResolve()` | parsingUtilities.ts |
| ... (9 more) | ... | parsingUtilities.ts |

### REGISTRY (13 functions)
| Rust | TypeScript | File |
|------|-----------|------|
| `id_registry_create` | `createRegistry()` | idRegistry.ts |
| `id_registry_next` | `nextId()` | idRegistry.ts |
| `id_registry_snapshot` | `getRegistrySnapshot()` | idRegistry.ts |
| `get_resolver_pool_stats` | `getResolverPoolStats()` | idRegistry.ts |
| `atomic_registry_size` | `getAtomicRegistrySize()` | idRegistry.ts |
| `clear_resolver_pool` | `clearResolverPool()` | idRegistry.ts |
| ... (7 more) | ... | idRegistry.ts |

### CSS GENERATION (12 functions)
| Rust | TypeScript | File |
|------|-----------|------|
| `generate_atomic_css` | `generateAtomicCss()` | cssGenerator.ts |
| `generate_runtime_state_css` | `generateRuntimeStateCSS()` | cssGenerator.ts |
| `generate_static_state_css` | `generateStaticStateCSS()` | cssGenerator.ts |
| `generate_system_token_css` | `generateSystemTokenCSS()` | cssGenerator.ts |
| `tw_classes_to_css` | `twClassesToCss()` | cssGenerator.ts |
| ... (7 more) | ... | cssGenerator.ts |

---

## Code Template: Copy & Paste

### Template 1: Simple Function (No Complex Types)

```typescript
export async function simpleFunction(input: string): Promise<string> {
  try {
    const result = native.rust_function_name(input)
    return result
  } catch (error) {
    console.error('[Module] Error:', error)
    return ''
  }
}
```

### Template 2: Function with JSON Return

```typescript
export interface MyResult {
  key1: string
  key2: number
  key3: boolean
}

export async function jsonFunction(input: string): Promise<MyResult> {
  try {
    const result = native.rust_function_name(input)
    return JSON.parse(result)
  } catch (error) {
    console.error('[Module] Error:', error)
    return { key1: '', key2: 0, key3: false }
  }
}
```

### Template 3: Function with Array Return

```typescript
export interface Item {
  id: string
  name: string
  value: number
}

export async function arrayFunction(pattern: string): Promise<Item[]> {
  try {
    const result = native.rust_function_name(pattern)
    return JSON.parse(result)
  } catch (error) {
    console.error('[Module] Error:', error)
    return []
  }
}
```

### Template 4: Class Method

```typescript
export class MyClass {
  private state: string

  async doSomething(input: string): Promise<string> {
    try {
      const result = native.rust_function_name(input)
      this.state = result
      return result
    } catch (error) {
      console.error('[MyClass] Error:', error)
      throw error
    }
  }

  getState(): string {
    return this.state
  }
}
```

### Template 5: Singleton Export

```typescript
// Create instance
const myInstance = new MyClass()

// Export for use
export const myModule = {
  doSomething: (input: string) => myInstance.doSomething(input),
  getState: () => myInstance.getState(),
}
```

---

## Where to Use Each Module

### 1. Cache Analytics
```typescript
// CLI: Show cache stats
import { getCacheStatistics } from '@tailwind-styled/compiler'

const stats = await getCacheStatistics()
console.log(`Cache hit rate: ${stats.hit_rate * 100}%`)
```

### 2. Class Analysis
```typescript
// Build: Detect unused classes
import { detectDeadCode } from '@tailwind-styled/compiler'

const dead = await detectDeadCode(cssClasses, sourceClasses)
if (dead.dead_in_css.length > 0) {
  console.warn('Unused CSS:', dead.dead_in_css)
}
```

### 3. Watch System
```typescript
// Dev: Auto-rebuild on changes
import { WatchManager } from '@tailwind-styled/watch'

const watcher = new WatchManager()
await watcher.watch('src/**/*.tsx')

watcher.on('change', async (event) => {
  console.log('File changed:', event.path)
  // Recompile
})
```

### 4. Parsing
```typescript
// Build: Parse component config
import { validateComponentConfig } from '@tailwind-styled/compiler'

const errors = await validateComponentConfig(config)
if (errors.length > 0) {
  throw new Error(`Invalid config: ${errors[0].message}`)
}
```

### 5. Registry
```typescript
// Runtime: Manage IDs
import { registryManager } from '@tailwind-styled/compiler'

const stats = await registryManager.getResolverPoolStats()
console.log(`Active tasks: ${stats.active_tasks}`)
```

### 6. CSS Generator
```typescript
// Build: Generate CSS
import { generateAtomicCss } from '@tailwind-styled/compiler'

const css = await generateAtomicCss(['bg-red-500', 'text-white'])
console.log(css)
```

---

## Common Patterns

### Error Handling Pattern
```typescript
try {
  const result = native.some_function(param)
  return JSON.parse(result)
} catch (error) {
  console.error('[Module]', error)
  return defaultValue  // ← ALWAYS provide default
}
```

### Async Pattern
```typescript
// GOOD
export async function myFunc(): Promise<Result> {
  const result = await someNativeCall()
  return result
}

// BAD (sync native calls)
export function myFunc(): Result {
  const result = native.some_function()  // ← blocks thread
  return result
}
```

### JSON Parsing Pattern
```typescript
// All Rust NAPI functions return JSON strings
// ALWAYS parse before using:

const stringResult = native.function_name(input)
const parsed = JSON.parse(stringResult)  // ← REQUIRED
```

---

## Testing Pattern

```typescript
describe('Module Name', () => {
  // Test 1: Happy path
  it('should work with valid input', async () => {
    const result = await myFunction('valid')
    expect(result).toBeDefined()
    expect(result.key).toBeTruthy()
  })

  // Test 2: Error handling
  it('should handle errors gracefully', async () => {
    const result = await myFunction('')
    expect(result).toEqual(defaultValue)
  })

  // Test 3: Type safety
  it('should return correct type', async () => {
    const result = await myFunction('test')
    expect(typeof result.number_field).toBe('number')
    expect(Array.isArray(result.array_field)).toBe(true)
  })

  // Test 4: Edge cases
  it('should handle edge cases', async () => {
    const result = await myFunction(null)
    expect(result).toBeDefined()
  })
})
```

---

## Execution Plan

### Option A: Parallel Implementation (Fastest)
- Dev 1: Cache Analytics + Class Analysis (2 days)
- Dev 2: Watch + Parsing (2 days)
- Dev 3: Registry + CSS Gen (2 days)
- **Total: 3 days**

### Option B: Sequential Implementation (Safest)
1. Day 1: Implement Cache Analytics only
2. Day 2: Add Class Analysis
3. Day 3: Add Watch + Parsing
4. Day 4: Add Registry + CSS Gen
5. Day 5: Testing + Polish
- **Total: 5 days**

### Option C: Prioritized Implementation (Recommended)
**Week 1 (Critical):**
- Monday: Cache Analytics (20 fn)
- Tuesday: Class Analysis (16 fn)
- Wednesday-Friday: Testing + Integration

**Week 2 (High):**
- Watch System (10 fn)
- Parsing Utilities (15 fn)

**Week 3 (Medium):**
- Registry (13 fn)
- CSS Generation (12 fn)

**Week 4 (Nice-to-have):**
- Config & Optimization (10 fn)
- Theme Handling (10 fn)
- Conflict Resolution (10 fn)
- Code Scanning (8 fn)

---

## File Checklist

```
[ ] packages/domain/compiler/src/cacheAnalytics.ts
    [ ] CacheStats interface
    [ ] getCacheStatistics()
    [ ] getParseStatistics()
    [ ] scanCacheEntries()
    [ ] getCacheOptimizationHints()
    [ ] clearCompileCache()
    [ ] clearParseCache()
    [ ] clearAllCaches()
    [ ] configureCacheBackend()
    [ ] recommendCachingStrategy()

[ ] packages/domain/compiler/src/classAnalysis.ts
    [ ] ClassAnalysis interface
    [ ] analyzeClasses()
    [ ] analyzeClassUsage()
    [ ] detectClassConflicts()
    [ ] detectDeadCode()
    [ ] extractAllClasses()
    [ ] extractClassesFromSource()
    [ ] hasTailwindUsage()
    [ ] diffClassLists()
    [ ] areClassSetsEqual()

[ ] packages/infrastructure/watch/src/watchManager.ts
    [ ] WatchManager class
    [ ] watch() method
    [ ] getStats() method
    [ ] getPerformance() method
    [ ] pollEvents() method
    [ ] stop() method
    [ ] static methods

[ ] packages/domain/compiler/src/parsingUtilities.ts
    [ ] parseClassesDetailed()
    [ ] parseCSSRules()
    [ ] parseSubComponentBlocks()
    [ ] validateComponentConfig()
    [ ] normalizeAndDedupeClasses()
    [ ] flattenAndResolve()

[ ] packages/domain/compiler/src/idRegistry.ts
    [ ] createRegistry()
    [ ] nextId()
    [ ] getRegistrySnapshot()
    [ ] getResolverPoolStats()
    [ ] getAtomicRegistrySize()
    [ ] clearResolverPool()

[ ] packages/domain/compiler/src/cssGenerator.ts
    [ ] generateAtomicCss()
    [ ] generateRuntimeStateCSS()
    [ ] generateStaticStateCSS()
    [ ] generateSystemTokenCSS()
    [ ] twClassesToCss()

[ ] Update packages/domain/compiler/src/index.ts with exports

[ ] Create tests for each module
    [ ] cacheAnalytics.test.ts
    [ ] classAnalysis.test.ts
    [ ] watchManager.test.ts
    [ ] parsingUtilities.test.ts
    [ ] idRegistry.test.ts
    [ ] cssGenerator.test.ts

[ ] Update docs
    [ ] API documentation
    [ ] Usage examples
    [ ] Integration guide
```

---

## Pro Tips

1. **Use consistent naming**: `snake_case` (Rust) → `camelCase` (TS)
2. **Always provide defaults**: Handle native errors gracefully
3. **Type everything**: Strict TypeScript types for better DX
4. **Test edge cases**: Null, undefined, empty, invalid inputs
5. **Document return types**: JSDoc comments for IDE autocomplete
6. **Group related functions**: Create barrel exports per domain
7. **Performance first**: Measure native call overhead
8. **Error logging**: Always log errors with module prefix
9. **Fallbacks**: Return sensible defaults on error
10. **Keep sync**: Keep TypeScript types in sync with Rust NAPI

---

## Example: Complete Implementation

```typescript
// packages/domain/compiler/src/cacheAnalytics.ts - COMPLETE

import { resolveNativeBinary } from "@tailwind-styled/shared"

const native = require(resolveNativeBinary())

export interface CacheStats {
  total_entries: number
  total_size_bytes: number
  hit_rate: number
  miss_rate: number
  avg_entry_size: number
}

/**
 * Get current cache statistics
 * @example
 * const stats = await getCacheStatistics()
 * console.log(`Hit rate: ${stats.hit_rate * 100}%`)
 */
export async function getCacheStatistics(): Promise<CacheStats> {
  try {
    const result = native.get_cache_stats()
    return JSON.parse(result)
  } catch (error) {
    console.error('[CacheAnalytics] Error getting stats:', error)
    return {
      total_entries: 0,
      total_size_bytes: 0,
      hit_rate: 0,
      miss_rate: 1,
      avg_entry_size: 0,
    }
  }
}

/**
 * Clear all caches
 * @example
 * await clearAllCaches()
 */
export async function clearAllCaches(): Promise<boolean> {
  try {
    native.clear_all_caches_napi()
    return true
  } catch (error) {
    console.error('[CacheAnalytics] Error clearing cache:', error)
    return false
  }
}

// Export for consumption
export const cacheAnalytics = {
  getCacheStatistics,
  clearAllCaches,
}
```

That's it! Same pattern for all 196 functions.

---

## Resources

- `/mnt/user-data/outputs/implementation_plan_196_functions.md` — Full plan with code
- `/mnt/user-data/outputs/unused_rust_functions_report.md` — All 196 functions listed
- `packages/domain/compiler/src/nativeBridge.ts` — Existing patterns
- `packages/domain/compiler/src/nativeBridgeWrappers.ts` — Advanced examples
- `native/index.ts` — Current exports

**Start now. Pick ONE domain. Take 2 hours. Submit PR. Move to next domain.**

Good luck! 🚀
