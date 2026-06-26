# Rebuild & Test Instructions

## Step 1: Apply Fix

**If using provided files:**

```bash
# Extract fixed archive
tar -xzf css-in-rust-fixed.tar.gz

# Or copy fixed file manually
cp liveTokenEngine.ts packages/domain/theme/src/liveTokenEngine.ts
```

**If applying manually:**

```bash
# Open file
nano packages/domain/theme/src/liveTokenEngine.ts

# Add "use client" at line 1, save
```

---

## Step 2: Clean & Rebuild

```bash
# Clean previous builds
rm -rf .next
rm -rf node_modules/.cache
rm -rf packages/domain/theme/dist

# Rebuild library
npm run build

# Or if you want to rebuild just theme package:
npm --prefix packages/domain/theme run build
```

---

## Step 3: Test Dev Mode

```bash
cd examples/next-js-app

# Fresh node_modules if needed
rm -rf node_modules
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
▲ Next.js 16.2.4 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.100.197:3000
✓ Ready in 312ms
[scanner] cache invalidated: native binary...
[scanner] cache MISS...
[scanner] using native parser...
```

**No errors at LiveTokenDemo** ✅

### Accessing the App

- Open http://localhost:3000 in browser
- Click through components to verify LiveTokenDemo works
- Try changing tokens (look for any interactive token controls)

---

## Step 4: Test Production Build

```bash
cd examples/next-js-app

# Production build (includes prerendering)
npm run build

# Should complete successfully without prerender errors

# Start production server
npm run start

# Open http://localhost:3000
```

**Expected:** No "Invalid hook call" in build output, page loads correctly ✅

---

## Step 5: Publish (If Updating Package)

```bash
# From root
npm run publish   # or your publish script

# This will:
# 1. Rebuild all packages
# 2. Bump versions
# 3. Publish to npm registry
# 4. Create git tags

# Then examples/next-js-app can update:
npm update tailwind-styled-v4
```

---

## Troubleshooting

### Still getting "Invalid hook call"?

```bash
# 1. Verify directive was added
grep -n "use client" packages/domain/theme/src/liveTokenEngine.ts
# Should show: 1:"use client"

# 2. Clear ALL caches
rm -rf .next node_modules/.cache packages/*/dist

# 3. Rebuild from scratch
npm run build

# 4. Check Turbopack cache
rm -rf examples/next-js-app/.next
cd examples/next-js-app && npm run dev
```

### Build fails with missing types?

```bash
# Rebuild type definitions
npm run build:dts

# Or just rebuild everything
npm run build
```

### Native binding errors persist?

```bash
# Rebuild Rust bindings
npm run build:rust

# Then rebuild JS
npm run build
```

---

## Verification Checklist

- [ ] File `packages/domain/theme/src/liveTokenEngine.ts` has `"use client"` at line 1
- [ ] `npm run build` completes without errors
- [ ] `npm run dev` in examples/next-js-app starts successfully
- [ ] Page at http://localhost:3000 loads without "Invalid hook call"
- [ ] LiveTokenDemo component renders without error
- [ ] Can interact with tokens (if UI has controls)
- [ ] `npm run build` in examples/next-js-app prerender succeeds
- [ ] Production server (`npm run start`) loads page correctly

---

## Timeline

- **5 min:** Apply fix
- **10 min:** Rebuild
- **2 min:** Dev test
- **5 min:** Prod build test

Total: ~20-25 minutes for full verification

---

## Need Help?

1. Check build output for specific errors
2. Verify `"use client"` directive is in place
3. Ensure you're testing after rebuild (not using old build artifacts)
4. Check Node version (`node -v` — should work fine on v26.2.0)
5. Try clean install: `rm -rf node_modules && npm install`
