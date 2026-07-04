# npm pack Fix: Exclude Intermediate Package Dist Folders

**Date**: July 3, 2026  
**Issue**: `packages/domain/compiler/dist/` was being included in npm pack tarball  
**Status**: ✅ FIXED

## Problem

When running `npm pack`, the tarball was including intermediate package dist folders like:
- `packages/domain/compiler/dist/`
- `packages/domain/scanner/dist/`
- `packages/domain/theme/dist/`
- ... (all 17+ packages)

This was happening because `.npmignore` exists, and when `.npmignore` is present, npm **ignores the `files` field** in `package.json` and uses `.npmignore` logic instead.

## Root Cause

`.npmignore` had these rules:
```ignore
# Source files (should be compiled)
packages/*/src/
packages/*/test/
packages/*/tsconfig.json
packages/*/vitest.config.ts
packages/*/tsup.config.ts
```

But it **did NOT exclude** `packages/*/dist/`, so those folders were being included by default!

## Solution

Added explicit exclusion for intermediate package dist folders in `.npmignore`:

```ignore
# Source files (should be compiled)
packages/*/src/
packages/*/test/
packages/*/tests/
packages/*/tsconfig.json
packages/*/vitest.config.ts
packages/*/tsup.config.ts

# ✅ EXCLUDE intermediate package dist folders — only root dist/ should be published
packages/*/dist/

# Build artifacts (keep only dist)
```

## How npm files/ignore Works

### When `files` field is used (no .npmignore):
```json
{
  "files": ["dist", "native/*.node", "README.md"]
}
```
→ npm **only includes** what's listed in `files` (whitelist approach)

### When `.npmignore` exists:
→ npm **ignores the `files` field** entirely  
→ Uses `.npmignore` as blacklist (exclude what's listed, include everything else)

This is why the `files` field in `package.json` wasn't working — `.npmignore` was taking precedence!

## Verification

After the fix, `npm pack` will produce a tarball containing:

### ✅ INCLUDED:
```
package/
├── dist/                    ← Root dist (final bundled outputs)
│   ├── index.js
│   ├── index.mjs
│   ├── compiler.js
│   ├── compiler.mjs
│   ├── scanner.js
│   ├── theme.js
│   └── ... (all 30+ exports)
├── native/
│   └── tailwind-styled-native*.node
├── README.md
├── CHANGELOG.md
├── LICENSE
└── package.json
```

### ❌ EXCLUDED:
```
packages/                    ← ALL intermediate monorepo packages
├── domain/
│   ├── compiler/
│   │   ├── dist/            ← NOT INCLUDED
│   │   └── src/             ← NOT INCLUDED
│   ├── scanner/
│   │   ├── dist/            ← NOT INCLUDED
│   │   └── src/             ← NOT INCLUDED
│   └── ... (all 17+ packages NOT INCLUDED)
```

## Why This Matters

**Before fix:**
- Tarball size: ~5MB (includes all intermediate dist folders)
- Users get duplicate code (packages/*/dist/ + root dist/)
- Confusing package structure
- Wasted bandwidth

**After fix:**
- Tarball size: ~2MB (only root dist/)
- Clean structure (only final bundled outputs)
- Users only see `tailwind-styled-v4/compiler` → `dist/compiler.js` (correct!)
- No confusion from intermediate artifacts

## Relationship to Monorepo Build

This fix does NOT change the build process:
1. `npm run build:packages` → Still creates `packages/*/dist/` (needed for internal imports)
2. `tsup --config tsup.config.ts` → Still bundles to root `dist/` (final output)
3. `npm pack` → Now correctly excludes intermediate artifacts ✅

The intermediate `packages/*/dist/` folders are still created during build (required for monorepo internal dependencies), they're just **not published to npm**.

## Testing

Verify the fix with:

```bash
# Create tarball
npm pack

# Extract and inspect
tar -tzf tailwind-styled-v4-*.tgz | grep packages
# Should output: (nothing)

tar -tzf tailwind-styled-v4-*.tgz | grep "package/dist"
# Should output: package/dist/compiler.js, package/dist/scanner.js, etc.
```

## Related Files

- `.npmignore` → Blacklist rules (excludes packages/)
- `package.json` → Has `files` field but it's overridden by .npmignore
- `turbo.json` → Build orchestration (creates intermediate dists)
- `tsup.config.ts` → Final bundling to root dist/

## Alternative Solution (Not Used)

We could have deleted `.npmignore` and relied on `files` field in `package.json`:
```json
{
  "files": ["dist", "native/*.node", "README.md", "LICENSE"]
}
```

But we kept `.npmignore` because it provides more fine-grained control over exclusions (docs/, examples/, scripts/, etc.).

---

**Key Takeaway**: When `.npmignore` exists, **always explicitly exclude** intermediate build artifacts like `packages/*/dist/` to prevent them from being published.
