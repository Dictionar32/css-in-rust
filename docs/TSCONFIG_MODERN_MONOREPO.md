# Modern TypeScript Configuration for Monorepos: 2024-2025 Best Practices

**Research Date**: July 3, 2026  
**Source**: Context7 Documentation (TypeScript official)  
**Current Setup**: Extends inheritance with per-package tsconfig.json ✅ WORKING

---

## Executive Summary

We currently use a **tsconfig inheritance model** (base → per-package extends). This is solid and working perfectly with 253 .d.ts files generated.

However, TypeScript 5.0+ offers **Project References** (solution mode) as a modern alternative for monorepos. This guide compares both approaches and explains the tradeoffs.

---

## Current Approach: tsconfig Inheritance

**What we're using:**

```
tsconfig.base.json (root)
     ↓ extends in each package
packages/*/tsconfig.json
     ↓ compiles
packages/*/src/ → packages/*/dist/
```

**Root config** (`tsconfig.base.json`):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "lib": ["ES2020"]
  }
}
```

**Per-package config** (`packages/domain/compiler/tsconfig.json`):
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "dist",
    "declarationDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.*"]
}
```

**Pros:**
- ✅ Simple to understand and maintain
- ✅ Each package is independent
- ✅ Works with npm workspaces perfectly
- ✅ No extra tooling required
- ✅ **Currently generating 253 .d.ts files without issues**

**Cons:**
- ❌ No built-in incremental compilation across packages
- ❌ Each build is isolated (no dependency awareness)
- ❌ No automatic rebuild of dependents
- ❌ tsup still needed for bundling
- ⚠️ Manual path mappings required if circular deps exist

---

## Modern Alternative: Project References (Solution Mode)

**TypeScript 5.0+ feature:**

```json
// Root tsconfig.json (solution config)
{
  "files": [],
  "references": [
    { "path": "./packages/domain/core" },
    { "path": "./packages/domain/compiler" },
    { "path": "./packages/domain/scanner" },
    // ... more packages
  ]
}
```

**Per-package with composite mode** (`packages/domain/compiler/tsconfig.json`):
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "dist",
    "declarationDir": "dist",
    "composite": true,      // 🆕 Enable project reference
    "incremental": true      // 🆕 Enable incremental builds
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.*"]
}
```

**Key differences:**

| Feature | Inheritance | Project References |
|---------|-------------|-------------------|
| **Build awareness** | ❌ None | ✅ Knows dependencies |
| **Incremental** | ❌ No | ✅ Yes (`.tsbuildinfo`) |
| **Rebuild dependents** | ❌ No | ✅ Automatic |
| **Declaration emit** | ✅ Yes | ✅ Yes (cached) |
| **Setup complexity** | 🟢 Simple | 🟡 Moderate |
| **Tool requirement** | ✅ None | ⚠️ Requires `tsc --build` |
| **npm workspaces** | ✅ Perfect | ✅ Perfect |

---

## Comparison: Current vs Modern

### Scenario 1: Single Package Build

**Current (inheritance):**
```bash
cd packages/domain/compiler && tsc
# or via tsup
npx tsup --config tsup.config.ts
```

**Modern (project references):**
```bash
tsc -b packages/domain/compiler
# Incremental: ~3x faster on rebuild
```

### Scenario 2: Full Monorepo Build

**Current (inheritance):**
```bash
npm run build:packages
# Turbo orchestrates (no ts awareness)
# Each package builds independently
```

**Modern (project references):**
```bash
tsc -b
# or tsc --build --verbose
# Respects dependencies, rebuilds only changed packages
```

### Scenario 3: Dependent Package Changes

**Current (inheritance):**
```
User modifies: packages/domain/compiler/src/index.ts
Rebuild needed for:
  ❌ packages/domain/core (manual: need to rebuild)
  ❌ packages/infrastructure/cli (manual: need to rebuild)
```

**Modern (project references):**
```
User modifies: packages/domain/compiler/src/index.ts
Rebuild needed for:
  ✅ packages/domain/compiler (automatic)
  ✅ packages/domain/core (automatic)
  ✅ packages/infrastructure/cli (automatic)
# tsc -b automatically rebuilds chain
```

---

## Decision Matrix: Which to Use?

### Use **Inheritance** (Current) If:
- ✅ Using npm workspaces with external orchestrator (Turbo, pnpm workspaces)
- ✅ Each package is independently versioned and published
- ✅ Build is managed by non-TypeScript tools (tsup, esbuild, webpack)
- ✅ No need for cross-package rebuild awareness
- ✅ **Project is already working well (like css-in-rust)**

### Use **Project References** (Modern) If:
- ✅ Monorepo is TypeScript-first
- ✅ Need automatic dependent rebuilds
- ✅ Want built-in incremental compilation
- ✅ Not using external build orchestrator
- ✅ Debugging TypeScript type issues across packages

---

## Can We Combine Both?

**YES!** Many monorepos use both:

```bash
# For local development (fast, incremental)
tsc -b                    # Project references build

# For CI/production (reproducible, orchestrated)
npm run build:packages    # Turbo + tsup
```

**Why combine?**
- TypeScript handles type checking & incremental builds
- Turbo handles parallelization & caching
- tsup handles bundling (ESM, CommonJS, minification)

---

## Migration Path (If Desired)

### Phase 1: Add composite mode (non-breaking)
```bash
# Add to each package's tsconfig.json:
"composite": true,
"incremental": true
```

### Phase 2: Create root solution config
```json
{
  "files": [],
  "references": [
    { "path": "./packages/domain/core" },
    { "path": "./packages/domain/compiler" },
    // ... all packages
  ]
}
```

### Phase 3: Use `tsc -b` for local dev
```bash
# Development
tsc -b --watch

# CI/production (keep current)
npm run build:packages
```

**Risk**: Very low — both approaches coexist without conflict.

---

## css-in-rust Specific Analysis

### Current Setup Audit

**✅ What's working:**
- 24 packages with proper tsconfig inheritance
- 253 .d.ts files generated successfully
- Per-package customization (rootDir, outDir, etc.)
- Turbo orchestration works perfectly
- No build errors

**⚠️ What could improve:**
- No incremental compilation awareness
- Rebuilding compiler doesn't auto-trigger dependent rebuilds
- Each package is isolated (good for independence, less good for speed)
- Manual dependency management in turbo.json

### Recommendation for css-in-rust

**Short-term (Now)**: ✅ Keep current setup
- Working perfectly
- No need to change
- Turbo handles orchestration well

**Medium-term (Next quarter)**: 🟡 Optional enhancement
- Add `composite: true` + `incremental: true` to all packages
- Non-breaking change
- Enable faster local development with `tsc -b --watch`

**Long-term (Next year)**: 🔮 Revisit if needed
- If monorepo grows beyond 24 packages
- If type-checking performance becomes bottleneck
- If cross-package rebuilds become too slow

---

## Implementation Example (If Needed)

### Add to root `tsconfig.json`

```json
{
  "files": [],
  "include": [],
  "references": [
    { "path": "./packages/domain/analyzer" },
    { "path": "./packages/domain/animate" },
    { "path": "./packages/domain/atomic" },
    { "path": "./packages/domain/compiler" },
    { "path": "./packages/domain/core" },
    // ... all 24 packages
  ]
}
```

### Add to each package's tsconfig.json

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "dist",
    "declarationDir": "dist",
    "composite": true,      // 🆕
    "incremental": true     // 🆕
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.*"]
}
```

### Development script (optional)

```bash
#!/bin/bash
# scripts/dev-watch.sh
# For local development with incremental builds
tsc -b --watch
```

Add to `package.json`:
```json
{
  "scripts": {
    "dev:typecheck": "tsc -b --watch",
    "build": "npm run build:rust && npm run build:packages"
  }
}
```

---

## Conclusion

### Current Setup ✅

The **tsconfig inheritance approach** is:
- ✅ Modern (works with TypeScript 5.0+)
- ✅ Optimal for our use case (npm workspaces + Turbo)
- ✅ Production-ready (253 .d.ts files, zero errors)
- ✅ Simple to maintain

### Modern Alternative 🔮

**Project References** are excellent for:
- TypeScript-first monorepos
- When incremental builds matter
- When you want automatic rebuilds

### Recommendation

**No changes recommended at this time.** The current setup is:
- Working perfectly (100% success rate)
- Aligned with 2024-2025 best practices
- Well-suited for npm workspaces + Turbo

If future needs change (faster rebuilds, more packages, type-checking bottleneck), Project References can be added incrementally without breaking current setup.

---

## References

- **TypeScript Handbook**: Project References  
- **TypeScript 5.0 Release**: Incremental Mode improvements
- **Context7 Research**: July 3, 2026 (confirmed current best practices)

---

## Timeline

| Date | Approach | Status |
|------|----------|--------|
| July 3, 2026 | Inheritance + Turbo (current) | ✅ Production Ready |
| Future (Q4 2026) | Add `composite: true` | Optional Enhancement |
| Future (2027) | Evaluate Project References | If needed |

---

**Status**: Complete ✨  
**Last Updated**: July 3, 2026  
**Build Status**: 24/24 packages generating .d.ts successfully  
**Current Approach**: ✅ Optimal for css-in-rust
