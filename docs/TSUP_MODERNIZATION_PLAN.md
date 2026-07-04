# tsup Modernization Plan: Hybrid Approach

**Date**: July 3, 2026  
**Status**: Planning phase  
**Goal**: Optimize 24 packages with modern tsup patterns

---

## Strategy: Hybrid Approach

Use **2 different patterns** optimized for each package type:

### Group A: Simple Packages → Native `dts: true` (11 packages)
**Criteria**: Single entry point, no special config needs

```typescript
// Pattern: Native tsup dts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,  // ✨ Native, no post-build hook
})
```

**Benefits**: 
- ✅ Single-stage build (faster)
- ✅ Simpler configuration
- ✅ Built-in dts support
- ✅ Official tsup recommendation

**Candidates (11 packages)**:
1. `@tailwind-styled/animate` - Single entry
2. `@tailwind-styled/atomic` - Single entry
3. `@tailwind-styled/plugin` - Single entry
4. `@tailwind-styled/plugin-api` - Single entry
5. `@tailwind-styled/plugin-registry` - Single entry
6. `@tailwind-styled/preset` - Single entry
7. `@tailwind-styled/runtime-css` - Single entry
8. `@tailwind-styled/shared` - Single entry
9. `@tailwind-styled/syntax` - Single entry
10. `@tailwind-styled/testing` - Single entry
11. `@tailwind-styled/devtools` - Single entry

---

### Group B: Complex Packages → Post-build Hook (13 packages)
**Criteria**: Multi-entry, custom tsconfig, or special needs

```typescript
// Pattern: Keep post-build hook (proven working)
export default defineConfig({
  entry: ["src/index.ts", "src/worker.ts"],  // Multiple entries
  format: ["cjs", "esm"],
  dts: false,
  
  async onSuccess() {
    execSync("tsc --emitDeclarationOnly --outDir dist")
  }
})
```

**Benefits**:
- ✅ Multi-entry support
- ✅ Full tsconfig control
- ✅ Monorepo-friendly
- ✅ Proven working (253 .d.ts files)

**Candidates (13 packages)**:
1. `@tailwind-styled/analyzer` - Depends on compiler
2. `@tailwind-styled/compiler` - Multi-entry, complex
3. `@tailwind-styled/core` - Multi-entry, complex
4. `@tailwind-styled/engine` - Multi-entry (index + internal)
5. `@tailwind-styled/plugin-accessibility` - Custom paths
6. `@tailwind-styled/runtime` - React-specific
7. `@tailwind-styled/scanner` - Multi-entry (index + worker)
8. `@tailwind-styled/theme` - Custom config
9. `create-tailwind-styled` (CLI) - Many entry points
10. `@tailwind-styled/next` - Framework-specific
11. `@tailwind-styled/vite` - Framework-specific
12. `@tailwind-styled/rspack` - Framework-specific
13. `@tailwind-styled/vue` - Framework-specific

---

## Implementation Plan

### Phase 1: Prepare & Test (15 min)
1. Create backup of current configs
2. Test Group A modernization on 1 package first
3. Verify build succeeds
4. Verify .d.ts files still generate

### Phase 2: Migrate Group A (30 min)
Migrate 11 simple packages to native `dts: true`:

**Per package:**
```bash
# Update tsup.config.ts
- Remove: async onSuccess() hook
- Remove: execSync("tsc --emitDeclarationOnly ...")
- Add: dts: true

# Keep tsconfig.json as-is (still needed for TS compilation)
```

### Phase 3: Verify & Test (20 min)
```bash
npm run build:packages
# Check: All 253 .d.ts files still generated
# Check: Zero errors
# Check: Build time recorded for comparison
```

### Phase 4: Documentation (10 min)
- Update each package's tsup.config.ts comment
- Create migration summary
- Document performance gains

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| .d.ts files missing | High | Test Group A first on 1 package |
| Build fails | High | Keep rollback plan (git revert ready) |
| Performance regression | Low | Unlikely (native is faster) |
| Type errors | Medium | Run full type check after changes |

---

## Performance Expectations

### Current (Post-build hook)
```
Group A (11 packages): ~20ms each × 11 = 220ms
Group B (13 packages): ~15ms each × 13 = 195ms
─────────────────────────────────────
Total: ~415ms
```

### After Modernization
```
Group A (11 native dts): ~8ms each × 11 = 88ms  ✨ 60% faster
Group B (13 post-hook): ~15ms each × 13 = 195ms (same)
─────────────────────────────────────
Total: ~283ms            ✨ 32% faster overall
```

**Estimated savings**: ~130ms per full build

---

## Files to Modify

### Group A (11 files to update)
- `packages/domain/animate/tsup.config.ts`
- `packages/domain/atomic/tsup.config.ts`
- `packages/domain/plugin/tsup.config.ts`
- `packages/domain/plugin-api/tsup.config.ts`
- `packages/domain/plugin-registry/tsup.config.ts`
- `packages/domain/preset/tsup.config.ts`
- `packages/domain/runtime-css/tsup.config.ts`
- `packages/domain/shared/tsup.config.ts`
- `packages/domain/syntax/tsup.config.ts`
- `packages/domain/testing/tsup.config.ts`
- `packages/infrastructure/devtools/tsup.config.ts`

### Group B (Keep as-is)
- 13 complex packages (no changes needed)

---

## Rollback Plan

If something goes wrong:
```bash
# Quick rollback
git checkout packages/domain/animate/tsup.config.ts  # etc

# Or full revert
git revert <commit-sha>

# Rebuild to confirm
npm run build:packages
```

---

## Success Criteria

✅ All 253 .d.ts files still generated  
✅ Zero build errors  
✅ All package types correct  
✅ Build time reduced by ~30%  
✅ No runtime regressions  

---

## Next Steps

1. Approve this plan
2. Start Phase 1 (backup + test)
3. Proceed with Group A migration if Phase 1 succeeds
4. Document results and performance gains

---

**Preparation**: Complete  
**Ready to execute**: YES  
**Estimated time**: 1.5 hours  
**Risk level**: LOW (with fallback plan)
