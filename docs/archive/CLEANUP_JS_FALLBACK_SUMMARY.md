# JS Fallback Cleanup Summary

**Date**: June 12, 2026  
**Status**: ✅ Complete  
**Impact**: Removed 3 JavaScript fallback implementations, forcing Rust-only compilation path

---

## Changes Made

### 1. CSS Generation - cssGeneratorNative.ts ✅

**Removed**: JavaScript Tailwind fallback path  
**Before**: 
```typescript
try {
  // Rust compiler
  return native.generateCssNative(...)
} catch (error) {
  if (!fallbackToJs) throw error
  // Fallback to generateRawCss()
  return generateRawCss(classes)
}
```

**After**:
```typescript
const native = getNativeBridge()
if (!native?.generateCssNative) {
  throw new Error("FATAL: Rust CSS generator is required but not available")
}
return native.generateCssNative(classes, themeJson)
```

**Files Modified**:
- `packages/domain/compiler/src/compiler/cssGeneratorNative.ts` - Removed `fallbackToJs` and `logFallback` options
- Updated function signature and added fail-fast error handling

**Lines Removed**: ~30 lines

---

### 2. CSS Pipeline - tailwindEngine.ts ✅

**Removed**: Try/catch wrapper and entire JavaScript Tailwind engine  
**Before**: 
```typescript
try {
  rawCss = await generateCssNativeImpl(unique, { 
    theme, 
    fallbackToJs: true, 
    logFallback: process.env.DEBUG?.includes("compiler") 
  })
} catch (error) {
  console.warn("[Compiler] Rust compiler failed, using JavaScript Tailwind:", error)
  rawCss = await generateRawCss(unique, cssEntryContent, root)
}
```

**After**:
```typescript
const theme = getThemeConfig()
rawCss = await generateCssNativeImpl(unique, { theme })
usedRustCompiler = true
```

**Files Modified**:
- `packages/domain/compiler/src/compiler/tailwindEngine.ts`
  - Removed entire `loadTailwindEngine()` function (~40 lines)
  - Removed `generateRawCss()` function (~50 lines)
  - Removed TailwindV4Engine interface
  - Removed engine loader caching logic

**Lines Removed**: ~90+ lines

---

### 3. Hash Functions - hash.ts ✅

**Removed**: Node.js crypto fallback  
**Before**:
```typescript
export function hashContent(content: string, algorithm = "md5", length = 8): string {
  const native = getNativeHashBinding()
  if (native) {
    return native.hashContent(content, algorithm, length)
  }
  return nodeHashContent(content, algorithm, length)  // ← Fallback
}

function nodeHashContent(content: string, algorithm: string, length: number): string {
  return crypto.createHash(algorithm === "fnv" ? "md5" : algorithm)
    .update(content)
    .digest("hex")
    .slice(0, length)
}
```

**After**:
```typescript
export function hashContent(content: string, algorithm = "md5", length = 8): string {
  const native = getNativeHashBinding()
  if (!native) {
    throw new Error("FATAL: Rust hash binding is required but not available")
  }
  return native.hashContent(content, algorithm as "md5" | "sha256" | "fnv", length)
}
```

**Files Modified**:
- `packages/domain/shared/src/hash.ts`
  - Removed `nodeHashContent()` function
  - Removed `nodeHashFile()` function
  - Removed `crypto` import
  - Removed `fs` import

**Lines Removed**: ~30+ lines

---

### 4. Export Cleanup - internal.ts ✅

**Removed**: Export of deprecated `generateRawCss`  
**Before**:
```typescript
export { runCssPipeline, runCssPipelineSync, generateRawCss, getCacheStats, clearCache, ... }
```

**After**:
```typescript
export { runCssPipeline, runCssPipelineSync, getCacheStats, clearCache, ... }
```

**Files Modified**:
- `packages/domain/compiler/src/internal.ts` - Removed `generateRawCss` from re-exports

---

## Compilation Status

✅ **TypeScript Compilation**: PASS  
- `packages/domain/compiler` - ✅ No errors
- `packages/domain/shared` - ✅ No errors

⚠️ **Rust Compilation**: Currently has unrelated warnings (unused imports in Rust code)  
- These are pre-existing and not introduced by this cleanup

---

## Runtime Behavior Changes

### Before
- ✅ Rust compiler available → Use Rust (40-60% faster)
- ✅ Rust unavailable + fallbackToJs=true → Use JavaScript Tailwind
- ✅ Rust unavailable + fallbackToJs=false → Throw error

### After
- ✅ Rust compiler available → Use Rust (40-60% faster)
- ❌ Rust unavailable → **Throw error** (fail-fast)
  - Clear error messages indicate native binding requirement
  - No silent degradation to slow JavaScript path

---

## Performance Impact

- **Positive**: Eliminates ambiguity about which compiler path is active
- **Positive**: Fails fast if native binary missing (easier debugging)
- **Negative**: No JavaScript fallback (requires .node binary present)

---

## Migration Notes

If any code was relying on `generateRawCss()` or the JavaScript fallback:

1. ❌ Remove: `generateRawCss` import from tailwindEngine
2. ✅ Ensure: Native `.node` binary is available in deployment
3. ✅ Error handling: Catch thrown error when native binding unavailable

---

## Files Modified Summary

| File | Type | Lines Removed |
|------|------|---------------|
| cssGeneratorNative.ts | TS | ~30 |
| tailwindEngine.ts | TS | ~90+ |
| hash.ts | TS | ~30+ |
| internal.ts | TS | 1 |
| **Total** | | **~150+ lines** |

---

## Verification Checklist

- ✅ `packages/domain/compiler` TypeScript compiles
- ✅ `packages/domain/shared` TypeScript compiles
- ✅ No broken exports from `internal.ts`
- ✅ Hash functions enforce Rust requirement
- ✅ CSS generator enforces Rust requirement
- ✅ Tailwind engine pipeline simplified
- ✅ Clear fail-fast error messages added

---

## Next Steps

1. Verify runtime behavior when deployed
2. Monitor for any missing native binding errors in production
3. Confirm performance improvement (Rust-only path)
4. Consider removing deprecated `tailwindEngine.ts` legacy code in next major version

---

**Cleanup completed successfully!**  
All JavaScript fallback implementations removed. System now requires native Rust binding.
