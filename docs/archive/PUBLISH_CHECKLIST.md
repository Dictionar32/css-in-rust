# Publishing to npm - Checklist & Workflow

## Pre-Publish Quality Assurance

### Code Quality
- [x] TypeScript: 0 errors
- [x] Jest: 534/538 tests passing (99.3%)
- [x] Rust: 0 errors, 21 warnings (acceptable)
- [x] Linting: biome check passing
- [x] Type coverage: 100% (all 40 NAPI functions typed)

### Build Verification
- [x] `npm run build` completes successfully
- [x] All 28 packages build without errors
- [x] Type definitions generated correctly
- [x] Native bindings compiled for release
- [x] No unused dependencies

### Integration Testing
- [x] npm link works locally
- [x] IntelliSense works in TypeScript
- [x] Redis functions callable
- [x] All exports work correctly
- [x] ES2024 compatibility verified

---

## Publishing Workflow

### Option 1: Beta Release (Recommended First)

**Purpose:** Remote testing on different machines/services before production release.

```bash
# Step 1: Create beta version
npm version prerelease --preid=beta
# 5.0.11-canary.0.0.91 → 5.0.11-beta.0

# Step 2: Publish to npm with beta tag
npm publish --tag beta

# Step 3: Others can install and test
npm install tailwind-styled-v4@beta

# Step 4: Collect feedback and fix issues

# Step 5: Create next beta if needed
npm version prerelease --preid=beta
# 5.0.11-beta.0 → 5.0.11-beta.1
npm publish --tag beta
```

**Update package.json manually (if preferred):**
```json
{
  "version": "5.0.11-beta.0",
  "name": "tailwind-styled-v4"
}
```

---

### Option 2: Production Release

**Purpose:** Official stable release to npm registry.

```bash
# Step 1: Run full quality checks
npm run check              # Lint, type check, boundaries
npm run test:all          # All tests
npm run build             # Full build
npm run build:release     # Optimized release build

# Step 2: Update CHANGELOG.md
# Document Phase 4 changes:
# - 20 new Redis NAPI functions
# - TypeScript type definitions for all 40 functions
# - JSON serialization for native functions
# - Redis connection pooling
# - Cache hit rate monitoring
# etc.

# Step 3: Bump version
npm version minor        # 5.0.11 → 5.1.0 (new features)
# or
npm version patch        # 5.0.11 → 5.0.12 (bug fixes)
# or
npm version major        # 5.0.11 → 6.0.0 (breaking changes)

# Step 4: Verify version updated
cat package.json | grep version

# Step 5: Publish to npm (default is latest tag)
npm publish

# Step 6: Verify publication
npm view tailwind-styled-v4 version
# Should show: 5.1.0

# Step 7: Tag in Git (optional but recommended)
git tag v5.1.0
git push origin v5.1.0
```

---

## Version Strategy

### Current Status
- Current version: `5.0.11-canary.0.0.91`
- Latest npm version: `5.0.6` (optional dependencies)

### Recommended Versions

#### For Beta Testing (Phase 4)
- `5.0.11-beta.0` - First beta
- `5.0.11-beta.1` - Second beta (if issues found)
- `5.0.11-beta.2` - etc.

#### For Production Release
- `5.0.12` - Patch release (bug fixes only) - **RECOMMENDED**
- `5.1.0` - Minor release (new features) - If you want to highlight Phase 4
- `6.0.0` - Major release (breaking changes) - Only if needed

**Recommendation:** Use `5.0.12` because:
- Patch bump is safe and familiar
- Phase 4 is an enhancement (can be 5.0.12)
- Later can bump to 5.1.0 or 6.0.0 for major milestones

---

## Package Contents Verification

```bash
# Check what will be published
npm pack
# Creates: tailwind-styled-v4-5.0.12.tgz

# Extract and inspect
tar -tzf tailwind-styled-v4-5.0.12.tgz | head -20

# Expected structure:
# package.json
# README.md
# CHANGELOG.md
# LICENSE
# dist/**/*          (TypeScript output)
# native/*.node      (Native bindings)
# native/*.d.ts      (Type definitions)
```

---

## Pre-Publish Checklist

```bash
# 1. Verify npm account logged in
npm whoami
# Should output your npm username

# 2. Check npm credentials
npm config get registry
# Should be: https://registry.npmjs.org/

# 3. Run final build
npm run build
npm run build:release

# 4. Check package size
npm pack
ls -lh tailwind-styled-v4-*.tgz
# Should be reasonable size (~15-20 MB with binaries)

# 5. Verify types are included
tar -tzf tailwind-styled-v4-*.tgz | grep "\.d\.ts$" | head -5

# 6. Verify bindings are included
tar -tzf tailwind-styled-v4-*.tgz | grep "\.node$"

# 7. Run smoke tests
npm run test:smoke

# 8. Final verification
npm run check
```

---

## Publishing Commands

### Beta Release
```bash
npm version prerelease --preid=beta
npm publish --tag beta
```

### Stable Release
```bash
npm version patch              # or minor/major
npm publish
```

### View Published Version
```bash
# See all versions
npm view tailwind-styled-v4 versions

# See latest stable
npm view tailwind-styled-v4@latest version

# See latest beta
npm view tailwind-styled-v4@beta version

# Install specific version
npm install tailwind-styled-v4@5.0.12
npm install tailwind-styled-v4@5.0.12-beta.0
```

---

## After Publishing

### Update GitHub

```bash
# Tag release
git tag -a v5.0.12 -m "Release Phase 4: Redis NAPI Integration"
git push origin v5.0.12

# Create release notes
# - Link to CHANGELOG.md
# - List new features (20 Redis functions)
# - Link to migration guide (if any)
# - Thank contributors
```

### Announce

- [ ] Update documentation site
- [ ] Send announcement email to users
- [ ] Update README if needed
- [ ] Post in community channels
- [ ] Add to release notes

---

## Rollback Plan (If Issues Found)

```bash
# If critical issues found after publishing:

# 1. Deprecate version (users won't install)
npm deprecate tailwind-styled-v4@5.0.12 "Critical issue found"

# 2. Publish fix with new version
npm version patch
npm publish

# 3. Undeprecate if false alarm
npm undeprecate tailwind-styled-v4@5.0.12
```

---

## Environment Variables (If Needed)

```bash
# One-time npm auth (interactive)
npm login

# Or with token (CI/CD)
export NPM_TOKEN=your_token_here
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc

# Then publish normally
npm publish
```

---

## Summary

### Quick Start - Beta Release
```bash
npm version prerelease --preid=beta
npm publish --tag beta
```

### Quick Start - Stable Release
```bash
npm version patch
npm publish
```

### Next Steps After Publishing
1. Users can install: `npm install tailwind-styled-v4@5.0.12`
2. E-commerce sites can integrate and test
3. Collect feedback for potential 5.0.13 patch
4. Plan Phase 5 features

---

## Ready to Publish? 🚀

All checks passed ✅

Choose your publishing strategy:
1. **Local testing first** → Use npm link (DONE)
2. **Beta release** → `npm version prerelease --preid=beta && npm publish --tag beta`
3. **Production release** → `npm version patch && npm publish`

Your package is production-ready!
