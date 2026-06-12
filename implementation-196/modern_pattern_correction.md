# ✅ MODERN PATTERN (Yang Sebenarnya Dipakai)
## tailwind-styled-v4 - Corrected Implementation Guide

**Status:** Updated dengan pattern yang sedang dipakai di project

---

## ❌ OUTDATED Pattern (Yang saya berikan sebelumnya):

```typescript
const native = require(resolveNativeBinary())

export async function getCacheStats(): Promise<CacheStats> {
  try {
    const result = native.get_cache_stats()
    return JSON.parse(result)
  } catch (error) {
    return defaultValue
  }
}
```

**Masalah:**
- Direct require (tidak cached)
- Async (padahal Rust native sync)
- Error handling basic
- Tidak ada null checks
- Tidak type-safe

---

## ✅ MODERN Pattern (Yang sedang dipakai):

### 1. Helper Functions (di `nativeBridgeWrappers.ts`)

```typescript
import { getNativeBridge } from "./nativeBridge"

/**
 * Safe wrapper untuk calling native functions dengan error handling
 */
const safeCallNative = <T>(functionName: string, fn: () => T): T => {
  try {
    return fn()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`[nativeBridge.${functionName}] ${message}`)
  }
}

/**
 * Parse JSON dari native functions dengan type safety
 */
const parseNativeJson = <T>(jsonResult: string, context: string): T => {
  try {
    return JSON.parse(jsonResult) as T
  } catch (err) {
    throw new Error(`[nativeBridge.${context}] Failed to parse JSON: ${err}`)
  }
}
```

### 2. Wrapper Function Pattern

```typescript
// ✅ CORRECT PATTERN

/**
 * Get cache statistics with comprehensive type safety
 * @returns Cache stats with hit rate, size, entries
 */
export const getCacheStatistics = (): CacheStats => {
  // 1. Get bridge (cached singleton)
  const bridge = getNativeBridge()
  
  // 2. Type check - ensure function exists
  if (!bridge.get_cache_stats) {
    throw new Error("get_cache_stats not available")
  }
  
  // 3. Call with error handling
  const result = safeCallNative(
    "get_cache_stats",
    () => bridge.get_cache_stats!()  // ← ! (non-null assertion)
  )
  
  // 4. Parse JSON dengan type
  return parseNativeJson<CacheStats>(result, "get_cache_stats")
}

// Usage:
const stats = getCacheStatistics()  // ← Synchronous! Bukan async
console.log(stats.hit_rate)
```

---

## Full Modern Implementation

### Structure:

```
nativeBridge.ts (main)
  ├─ getNativeBridge() — cached singleton
  ├─ NativeBridge interface — all available functions
  ├─ isValidNativeBridge() — validation
  └─ Export all wrapper functions

nativeBridgeWrappers.ts (helpers + wrappers)
  ├─ safeCallNative<T>()
  ├─ parseNativeJson<T>()
  └─ export const function1 = () => { ... }
  └─ export const function2 = () => { ... }
  └─ ... (all wrappers)
```

---

## Code Examples (Modern Pattern)

### Example 1: Simple Return (No JSON Parsing)

```typescript
/**
 * Clear all caches
 * @returns Number of entries cleared
 */
export const clearAllCaches = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.clear_all_caches_napi) {
    throw new Error("clear_all_caches_napi not available")
  }
  return safeCallNative("clear_all_caches_napi", () => 
    bridge.clear_all_caches_napi!()
  )
}

// Usage:
const cleared = clearAllCaches()  // synchronous!
console.log(`Cleared ${cleared} entries`)
```

### Example 2: JSON Parsing with Type Safety

```typescript
export interface CacheStats {
  total_entries: number
  hit_rate: number
  total_size_bytes: number
}

/**
 * Get detailed cache statistics
 * @returns Typed cache stats object
 */
export const getCacheStatistics = (): CacheStats => {
  const bridge = getNativeBridge()
  if (!bridge.get_cache_stats) {
    throw new Error("get_cache_stats not available")
  }
  
  const result = safeCallNative("get_cache_stats", () => 
    bridge.get_cache_stats!()
  )
  
  return parseNativeJson<CacheStats>(result, "get_cache_stats")
}

// Usage:
const stats = getCacheStatistics()
console.log(`Hit rate: ${stats.hit_rate * 100}%`)
```

### Example 3: With Parameters

```typescript
/**
 * Configure cache backend
 * @param config Cache configuration
 * @returns Status message
 */
export const configureCacheBackend = (config: CacheBackendConfig): string => {
  const bridge = getNativeBridge()
  if (!bridge.configure_cache_backend) {
    throw new Error("configure_cache_backend not available")
  }
  
  return safeCallNative("configure_cache_backend", () =>
    bridge.configure_cache_backend!(JSON.stringify(config))
  )
}

// Usage:
const status = configureCacheBackend({
  backend: 'redis',
  max_size_mb: 1024,
  ttl_minutes: 120,
})
```

### Example 4: Complex Return Type

```typescript
export interface CacheOptimizationHint {
  type: 'memory' | 'performance' | 'ttl'
  severity: 'info' | 'warning' | 'critical'
  message: string
  suggestion: string
}

/**
 * Get cache optimization recommendations
 * @returns Array of optimization hints
 */
export const getCacheOptimizationHints = (): CacheOptimizationHint[] => {
  const bridge = getNativeBridge()
  if (!bridge.get_cache_optimization_hints) {
    throw new Error("get_cache_optimization_hints not available")
  }
  
  const result = safeCallNative("get_cache_optimization_hints", () =>
    bridge.get_cache_optimization_hints!()
  )
  
  return parseNativeJson<CacheOptimizationHint[]>(result, "get_cache_optimization_hints")
}

// Usage:
const hints = getCacheOptimizationHints()
hints.forEach(hint => {
  if (hint.severity === 'critical') {
    console.error(`[${hint.type}] ${hint.message}`)
  }
})
```

### Example 5: With Optional Returns

```typescript
/**
 * Get value from cache
 * @param key Cache key
 * @returns Cached value or null
 */
export const cacheGet = (key: string): string | null => {
  const bridge = getNativeBridge()
  if (!bridge.cache_get) {
    throw new Error("cache_get not available")
  }
  
  const result = safeCallNative("cache_get", () => 
    bridge.cache_get!(key)
  )
  
  return result || null
}

// Usage:
const value = cacheGet('my-key')
if (value) {
  console.log('Found:', value)
} else {
  console.log('Not in cache')
}
```

---

## Key Differences: Outdated vs Modern

| Aspect | ❌ Outdated | ✅ Modern |
|--------|-----------|---------|
| **Loading** | Direct `require()` | `getNativeBridge()` cached |
| **Async** | `async/await` | Synchronous |
| **Type Check** | None | `if (!bridge.fn) throw` |
| **Error Handler** | Try/catch | `safeCallNative<T>()` |
| **JSON Parse** | Manual `JSON.parse()` | `parseNativeJson<T>()` |
| **Return Type** | Generic Promise | Type-safe sync |
| **Null Safety** | No checks | Non-null assertion `!` |
| **Error Message** | Generic | Context-specific |
| **Overhead** | Re-require per call | Single cached instance |

---

## Why Modern Pattern is Better

✅ **Cached Bridge** — `getNativeBridge()` returns cached singleton  
✅ **Synchronous** — Native functions are sync, no need for async  
✅ **Type-Safe** — Generic type parameters for all returns  
✅ **Better Errors** — Context-specific error messages  
✅ **Null Safety** — Explicit checks before calling  
✅ **Performance** — No overhead from require/async  
✅ **Composable** — Helper functions reusable across all wrappers

---

## Implementation Checklist (Modern Way)

```typescript
// ✅ 1. Import helpers
import { getNativeBridge } from "./nativeBridge"

// ✅ 2. Define interfaces
export interface MyResult {
  field1: string
  field2: number
}

// ✅ 3. Implement wrapper
export const myFunction = (param: string): MyResult => {
  const bridge = getNativeBridge()
  
  if (!bridge.my_rust_function) {
    throw new Error("my_rust_function not available")
  }
  
  const result = safeCallNative("my_rust_function", () =>
    bridge.my_rust_function!(param)
  )
  
  return parseNativeJson<MyResult>(result, "my_rust_function")
}

// ✅ 4. Test
const result = myFunction("test")
console.log(result.field1, result.field2)
```

---

## Where to Find Existing Implementations

**Currently implemented (40+ functions):**
- `packages/domain/compiler/src/nativeBridgeWrappers.ts` — All Redis functions
- `packages/domain/compiler/src/nativeBridge.ts` — Bridge loader & interface

**Look at these for reference:**
```typescript
// Best examples:
redis_pool_stats() — PoolStats return
redis_get() — Nullable return
redis_mget() — Array/Record return
getCacheStatistics() — Complex parsed return
```

---

## Ready-to-Use Template (Modern)

```typescript
/**
 * [Description of what this does]
 * @param param1 - Description
 * @param param2 - Description
 * @returns Description of return
 */
export const myFunctionName = (param1: string, param2?: number): ReturnType => {
  const bridge = getNativeBridge()
  
  if (!bridge.rust_function_name) {
    throw new Error("rust_function_name not available")
  }
  
  const result = safeCallNative("rust_function_name", () =>
    bridge.rust_function_name!(param1, param2)
  )
  
  // If returns JSON:
  return parseNativeJson<ReturnType>(result, "rust_function_name")
  
  // If returns raw value:
  // return result
  
  // If returns nullable:
  // return result || null
}
```

---

## How to Apply This

1. **Remove old pattern** from my previous docs
2. **Use nativeBridgeWrappers.ts** as the ACTUAL template
3. **Follow the 5-step pattern:**
   ```
   1. getNativeBridge()
   2. if (!bridge.fn) throw
   3. safeCallNative("name", () => bridge.fn!(...))
   4. parseNativeJson<T>() if JSON return
   5. return typed result
   ```
4. **Add JSDoc** for IDE autocomplete
5. **Export** in nativeBridge.ts re-exports

---

## Testing (Modern Way)

```typescript
describe('Cache Wrappers', () => {
  it('should get cache statistics', () => {
    // ✅ Not async!
    const stats = getCacheStatistics()
    expect(stats).toBeDefined()
    expect(typeof stats.hit_rate).toBe('number')
  })

  it('should throw if function not available', () => {
    expect(() => {
      getNativeBridge().some_function // ← Won't exist
    }).toThrow()
  })
})
```

---

## Summary

**Old approach (mine):** ❌ Wrong pattern, outdated  
**Modern approach (actual code):** ✅ Type-safe, sync, cached, robust

Just follow the pattern in `nativeBridgeWrappers.ts` and you're golden! 🚀
