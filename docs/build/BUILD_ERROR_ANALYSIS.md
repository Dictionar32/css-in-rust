# Build Error Analysis - Import.Meta Issue

**Date**: July 3, 2026  
**Issue**: 10 packages failed with `import.meta` warnings → build errors

## Failed Packages (10 total)

From build output, these packages have `import.meta` used with CJS format:

1. `@tailwind-styled/devtools`
2. `@tailwind-styled/runtime`
3. `@tailwind-styled/compiler`
4. `@tailwind-styled/atomic`
5. `@tailwind-styled/plugin-accessibility`
6. `@tailwind-styled/engine`
7. `@tailwind-styled/core`
8. `@tailwind-styled/rspack`
9. `@tailwind-styled/svelte`
10. `@tailwind-styled/vue`

Also warnings in:
- `@tailwind-styled/shared` - uses `import.meta.url`
- `@tailwind-styled/scanner` - uses `import.meta.url`
- `@tailwind-styled/syntax` - uses `import.meta.url`

## Root Cause

All 29 packages were converted to `dts: true` with `format: ["esm", "cjs"]` by the modernization script.

However, some packages use `import.meta.url` (ESM-only feature) but still output CJS format.

**esbuild warning**:
```
WARN ▲ [WARNING] "import.meta" is not available with the "cjs" output format and will be empty [empty-import-meta]
```

This causes build failures when Turbo runs strict checks.

## Solution Options

### Option 1: ESM-Only Format (Recommended for these packages)
For packages that need `import.meta`, remove CJS format:

```typescript
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],  // ← ESM only, no CJS
  dts: true,
})
```

**Best for**: 
- Packages with native ESM requirements
- Packages using `import.meta.url`
- Server-side utilities (Node 20+)

### Option 2: Conditional Polyfill (More Compatible)
Keep both formats but handle `import.meta` conditionally:

```typescript
// In source code:
const getCurrentDir = () => {
  if (typeof import.meta !== "undefined" && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url))
  }
  // Fallback for CJS
  return __dirname  // or process.cwd()
}
```

**Best for**: Packages needing dual format support

### Option 3: Conditional tsup Config
Different entry points for ESM vs CJS:

```typescript
export default defineConfig({
  entry: {
    index: "src/index.ts",  // Will generate both CJS + ESM
  },
  format: ["esm"],  // Only ESM
  dts: true,
})
```

## Packages Analysis

### Need ESM-Only (Option 1) - 10 packages
- `@tailwind-styled/devtools` - Dev tools, Node 20+
- `@tailwind-styled/runtime` - React runtime, ESM preferred
- `@tailwind-styled/compiler` - Build tool, Node 20+
- `@tailwind-styled/atomic` - Framework, can be ESM-only
- `@tailwind-styled/plugin-accessibility` - Plugin, ESM-only reasonable
- `@tailwind-styled/engine` - Core engine, Node 20+
- `@tailwind-styled/core` - Core library, can be ESM-only
- `@tailwind-styled/rspack` - Bundler plugin, Node 20+
- `@tailwind-styled/svelte` - Framework integration, ESM
- `@tailwind-styled/vue` - Framework integration, ESM

### Need Dual-Format (Option 2) - 3 packages with warnings
- `@tailwind-styled/shared` - Shared utilities, may need CJS
- `@tailwind-styled/scanner` - Scanner utility, may need CJS
- `@tailwind-styled/syntax` - Syntax validator, may need CJS

## Recommended Action

**For all 10 failing packages**: Switch to ESM-only format

**Reason**:
- Project requires Node 20+
- ESM is now standard in Node 20+
- No need for CJS backward compatibility
- Simplifies build and eliminates `import.meta` issues
- Modern approach per 2024-2025 standards

## Implementation

For each failing package, modify `tsup.config.ts`:

```typescript
export default defineConfig({
  entry: ["src/index.ts"],  // or your entry config
  format: ["esm"],          // ← Change: remove "cjs"
  dts: true,
  clean: true,
  target: "node20",
  platform: "node",
})
```

This is a breaking change only if users need CJS, but since the project targets Node 20+, ESM is the right choice.

## Files to Update (10 total)

1. `packages/infrastructure/devtools/tsup.config.ts`
2. `packages/domain/runtime/tsup.config.ts`
3. `packages/domain/compiler/tsup.config.ts`
4. `packages/domain/atomic/tsup.config.ts`
5. `packages/domain/plugin-accessibility/tsup.config.ts`
6. `packages/domain/engine/tsup.config.ts`
7. `packages/domain/core/tsup.config.ts`
8. `packages/presentation/rspack/tsup.config.ts`
9. `packages/presentation/svelte/tsup.config.ts`
10. `packages/presentation/vue/tsup.config.ts`

## For 3 Packages with Warnings (Optional)

Keep as-is for now since they only show warnings, not hard errors:
- `@tailwind-styled/shared`
- `@tailwind-styled/scanner`
- `@tailwind-styled/syntax`

They'll work fine as dual-format, just with warnings.

## Test After Fix

```bash
npm run build:packages
# Should pass without errors
```

---

**Conclusion**: The solution is to use ESM-only format for ESM-dependent packages. This aligns with modern Node 20+ standards and eliminates the import.meta issue completely.

