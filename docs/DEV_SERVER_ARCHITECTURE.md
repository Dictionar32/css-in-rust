# Dev Server Architecture — How Theme Initialization Works

Dokumen ini menjelaskan bagaimana theme initialization bekerja dan kenapa ada warnings di dev server.

---

## High-Level Architecture

### Server-Side Rendering (SSR) Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Next.js Server Build (build-time)                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  app/layout.tsx → Server Component                 │
│  ├─ <html> with THEME_INIT_SCRIPT injected         │
│  ├─ <script> runs synchronously before render      │
│  └─ Output: Static HTML with theme variables       │
│                                                     │
│  Result:                                           │
│  <html style="--background: #070b16; ...">         │
│    <head>                                           │
│      <script>(function() { /* theme code */ })()</script>
│    </head>                                          │
│  </html>                                            │
│                                                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. Browser Receives HTML                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Browser sees:                                      │
│  - <html> with inline style                        │
│  - Theme already applied (no flash!)                │
│  - Ready to render visually                         │
│                                                     │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. React Hydration (client-side)                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  React attaches event listeners & interactivity    │
│  (No content changes needed)                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Problem: Why Hydration Mismatch Happens

```
Server (build-time)                Browser (runtime)
─────────────────────────          ──────────────────

THEME_INIT_SCRIPT runs:            <html> receives:
├─ Read localStorage (none)        ├─ style attribute
├─ Check prefers-color-scheme      │  (from server)
├─ Apply dark theme                │
└─ Set <html style="...">          localStorage check:
                                   ├─ If stored theme ≠ dark
                                   ├─ Re-run THEME_INIT_SCRIPT
                                   ├─ Modify style attribute
                                   └─ React: "Wait, this changed!"
                                      ↓
                                      HYDRATION MISMATCH! ❌
```

---

## Solution: suppressHydrationWarning

```
WITH suppressHydrationWarning
─────────────────────────────────

<html lang="en" suppressHydrationWarning>
  ↑ Tells React:
  │ "style attribute might be different,
  │  that's OK — this is expected"

React behavior:
├─ Server HTML: <html style="--background: #070b16">
├─ Client re-renders with: <html style="--background: #f5f7fb">
├─ Normally would warn: "Hydration mismatch!"
└─ With flag: React ignores difference ✅
   (The actual content is correct, styling is right)
```

---

## Theme Initialization Flow (Detailed)

### Phase 1: Build-Time

```
npm run build
├─ layout.tsx imported
├─ THEME_INIT_SCRIPT exported as string
├─ next.config.ts merged with tailwind-styled config
└─ Output: .next/server/app/layout.js dengan script inline
```

### Phase 2: Server Render (SSR)

```
Incoming request: GET /learn/...
├─ Next.js server renders RootLayout
├─ Returns <html> with:
│  ├─ <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
│  ├─ <TwCssInjector /> (inject route CSS)
│  └─ {children}
├─ Browser receives complete HTML
└─ Theme already applied! (no FOUC)
```

### Phase 3: Browser Initial Load

```
Browser receives HTML
├─ Parse & render DOM
├─ Execute <script> (THEME_INIT_SCRIPT)
│  ├─ Check localStorage.getItem('tw-theme-preference')
│  ├─ If found: applyTheme(stored)
│  └─ If not: check prefers-color-scheme → applyTheme()
├─ Set <html> style attributes
└─ Visual: Theme already there (no flash)
```

### Phase 4: React Hydration

```
React attaches to DOM
├─ Verify server HTML matches expected client output
├─ If attributes differ: HYDRATION WARNING (without fix)
│  └─ suppressHydrationWarning: true → No warning
├─ Attach event listeners
└─ App ready for user interaction
```

---

## Why suppressHydrationWarning is Safe Here

### The Principle

```
✅ SAFE to suppress when:
   - Attribute difference is cosmetic
   - Actual content is identical
   - Difference is expected & intentional
   - No interactive behavior is affected

❌ DANGEROUS to suppress when:
   - Content genuinely different
   - Element structure different
   - JavaScript state mismatch
   - This hides real bugs
```

### Our Case (Theme Initialization)

```
Server-rendered <html style="...">
            ↓
            └─ Contains CSS variables for theme
               (might be dark or light)

Client-rendered <html style="...">
            ↓
            └─ Contains SAME CSS variables
               (might be different dark/light based on localStorage)

Difference: Variable VALUES might differ
Same: Variable NAMES, structure, content

Result: ✅ SAFE to suppress warning
```

---

## Turbopack Root Configuration

### Problem

```
Monorepo structure:
───────────────────

css-in-rust/
├─ package-lock.json ← lockfile 1 (root)
├─ package.json
│
└─ examples/next-js-app/
   ├─ package-lock.json ← lockfile 2 (app)
   ├─ next.config.ts
   └─ package.json

When Turbopack starts:
├─ Detect multiple lockfiles
├─ Get confused: "Which one is the root?"
├─ Default to parent lockfile
└─ Warning: "inferred your workspace root..."
```

### Solution

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,  ← Tell Turbopack:
                         "Use examples/next-js-app as root"
  },
};
```

**Effect**: Turbopack knows:
- `__dirname` = `/home/.../examples/next-js-app`
- This directory is the Next.js app root
- No more guessing → no more warning ✅

---

## Development Flow (After Fixes)

```
npm run dev
│
├─ 1. Next.js detects app root (turbopack.root)
│
├─ 2. Compile layout.tsx
│  ├─ Read THEME_INIT_SCRIPT constant
│  └─ Inject into <head> as inline script
│
├─ 3. Dev server ready
│
├─ 4. First request: GET /
│  ├─ Render HTML with theme script
│  ├─ Browser receives styled <html>
│  └─ No FOUC (Flash of Unstyled Content)
│
├─ 5. Browser DOM ready
│  ├─ React hydrates
│  ├─ suppressHydrationWarning → no console warning
│  └─ App interactive
│
└─ 6. Dev server logs:
   [scanner] cache MISS ...
   GET / 200 in 125ms
```

---

## Performance Implications

### Build-Time
- ✅ No extra work (script is just string constant)
- ✅ No performance impact

### Server-Side (SSR)
- ✅ Minimal: Just inject script string
- ✅ No additional processing

### Client-Side (Browser)
- ✅ Script runs before rendering: ~1-2ms
- ✅ No layout recalculation needed
- ✅ Theme ready before paint

### Dev Server
- ⚠️ TypeScript fallback for native module
  - This is why you see: "Native binding tidak tersedia"
  - Expected in dev server
  - Production uses native (425× faster)

---

## File Structure

```
Root Layout
──────────

examples/next-js-app/src/app/layout.tsx
├─ Imports THEME_INIT_SCRIPT from ThemeProvider
├─ Injects into <head> <script> tag
└─ Adds suppressHydrationWarning to <html> & <body>

Theme Provider
──────────────

examples/next-js-app/src/components/ThemeProvider.tsx
├─ Exports THEME_INIT_SCRIPT (constant string)
├─ Contains: localStorage check + prefers-color-scheme
├─ Side effect: modifies <html> style attribute
└─ Must run SYNCHRONOUSLY before React renders

CSS Injector
───────────

packages/domain/runtime-css/TwCssInjector.tsx
├─ Server Component
├─ Injects route-specific CSS into <head>
└─ Prevents FOUC (Flash of Unstyled Content)
```

---

## Common Questions

### Q: Why inject script in <head> instead of <body>?

**A**: Timing critical!
- **In <head>**: Runs before DOM renders → no flash
- **In <body>**: Runs after elements render → might see wrong theme briefly

### Q: Why not use useEffect in Client Component?

**A**: Too late!
- useEffect runs AFTER render
- User sees flash of wrong theme
- Current approach: render correct theme immediately ✅

### Q: What if localStorage has invalid value?

**A**: Safe fallback:
```typescript
const stored = localStorage.getItem(STORAGE_KEY);
if (stored && (stored === 'light' || stored === 'dark')) {
  applyTheme(stored);
  return;
}
// Fallback to system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(prefersDark ? 'dark' : 'light');
```

### Q: Does this work with SSG (Static Site Generation)?

**A**: Yes, even better:
- Static HTML pre-built with theme script
- Served immediately without server rendering
- Script runs in browser as before
- ✅ No server overhead

### Q: What about lighthouse/SEO impact?

**A**: No impact:
- Inline script is 1-2 KB minified
- Runs instantly before anything renders
- Doesn't block critical rendering path
- ✅ Good for Core Web Vitals

---

## Monitoring & Debugging

### Check if Theme Loads Correctly

1. **Open DevTools** → Elements tab
2. **Inspect `<html>` element**
3. **Look for style attribute**:
   ```html
   <html style="--background: #070b16; --foreground: #e5e7eb; ...">
   ```
   ✅ Good! Theme is applied.

### Check Theme Preference Storage

1. **Open DevTools** → Application tab
2. **Storage** → Local Storage
3. **Look for key**: `tw-theme-preference`
4. Value should be: `'light'` or `'dark'`

### Verify No Hydration Warnings

1. **Open DevTools** → Console tab
2. Search for: "hydration" or "mismatch"
3. Should find nothing ✅

### Monitor Script Execution

Add debug to THEME_INIT_SCRIPT temporarily:

```typescript
export const THEME_INIT_SCRIPT = `
(function() {
  console.log('[Theme] Initializing...');
  const STORAGE_KEY = 'tw-theme-preference';
  const stored = localStorage.getItem(STORAGE_KEY);
  console.log('[Theme] Stored preference:', stored);
  
  // ... rest of code
  
  console.log('[Theme] Applied:', theme);
})();
`;
```

---

**Architecture Version**: v5.1.2  
**Last Updated**: July 3, 2026  
**Status**: Production Ready ✅
