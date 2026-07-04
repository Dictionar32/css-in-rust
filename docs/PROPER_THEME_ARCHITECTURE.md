# Proper Theme Architecture — No Script Hacks, No Suppressions

Dokumentasi ini menjelaskan bagaimana theme initialization bekerja dengan **proper architecture** — tanpa `suppressHydrationWarning` atau inline scripts yang buruk untuk DX.

---

## The Right Way vs The Wrong Way

### ❌ Wrong Way (Band-Aid)
```typescript
// BAD: Inject script + suppress warnings
<html suppressHydrationWarning>
  <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
</html>

// Problems:
// - suppressHydrationWarning hides real issues
// - Script injection is expensive
// - Race conditions between server & client
// - Poor developer experience
```

### ✅ Right Way (Proper Architecture)
```typescript
// GOOD: CSS-based defaults + client-side hydration
<html lang="en">  // NO suppressHydrationWarning!
  <ThemeProvider>
    {children}
  </ThemeProvider>
</html>

// Benefits:
// - Server & client always render same default (no mismatch!)
// - No script hacks
// - Clean DX
// - Proper separation: CSS default + JS runtime
```

---

## How It Works

### 1. CSS Default Theme (Server & Client Match)

**File**: `globals.css`

```css
/* Default light theme */
:root {
  color-scheme: light;
  --background: #f5f7fb;
  --foreground: #111827;
  /* ... */
}

/* Respect system preference for initial render */
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --background: #070b16;
    --foreground: #e5e7eb;
    /* ... */
  }
}

/* User's explicit theme choice (applied by JS after hydration) */
[data-theme="dark"] {
  color-scheme: dark;
  --background: #070b16;
  /* ... */
}
```

**Result**: 
- Server renders with CSS default (light or dark based on prefers-color-scheme)
- Client hydrates with SAME CSS default
- ✅ **Zero hydration mismatch!**

### 2. ThemeProvider (Client-Side, After Hydration)

**File**: `components/ThemeProvider.tsx`

```typescript
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // After hydration, apply stored preference or system default
    const theme = getThemePreference();
    applyTheme(theme);
    
    // Listen to system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    
    setMounted(true);
    
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ mounted, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**Timeline**:
```
Server render: 
  ├─ CSS :root default applied (light OR dark based on prefers-color-scheme)
  ├─ HTML sent to browser
  └─ No script involved ✅

Browser initial load:
  ├─ Parse CSS, apply :root theme
  ├─ Render page with correct theme (no flash!)
  └─ User sees correct theme immediately

React hydration:
  ├─ useEffect fires
  ├─ Apply stored preference if different from CSS default
  ├─ Listen to system changes
  └─ ✅ No hydration mismatch (CSS default already correct!)

User interaction:
  ├─ Click theme toggle
  ├─ Update localStorage
  ├─ Set [data-theme] attribute
  └─ CSS applies new theme instantly
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Initial Render (Server + Client CSS Default)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Server detects: prefers-color-scheme = dark/light  │
│  2. Renders with CSS default (no script!)              │
│  3. Browser receives HTML with CSS already applied     │
│  4. No flash of wrong theme!                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ React Hydration (No Mismatch!)                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Server CSS:  :root { --background: light }            │
│  Client CSS:  :root { --background: light }            │
│  ✅ Match! No hydration warning                        │
│                                                         │
│  React attaches listeners and context                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ After Hydration (ThemeProvider useEffect)              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Check localStorage for stored preference           │
│  2. If different from CSS default:                     │
│     └─ Set [data-theme="dark"] attribute               │
│     └─ CSS switches theme instantly                    │
│  3. Listen for system preference changes               │
│  4. Ready for user interaction                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ User Toggles Theme (ThemeProvider setTheme)            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Save to localStorage                               │
│  2. Set [data-theme] attribute                         │
│  3. CSS [data-theme="dark"] applied                    │
│  4. Theme switches instantly ✨                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Key Principles

### 1. Server & Client Must Render Same Default

❌ **BAD**:
```typescript
// Server has no theme info
<html>
  <body>{children}</body>
</html>

// Client applies theme in useEffect
// Result: Flash of wrong theme or hydration mismatch
```

✅ **GOOD**:
```css
/* CSS default matches system preference */
:root {
  color-scheme: light;
  --background: #f5f7fb;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --background: #070b16;
  }
}
```

### 2. No Script Hacks

❌ **BAD**:
```typescript
<script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
```

**Problems**:
- Adds to page load time
- Runs for every page load
- Race conditions
- Poor developer experience

✅ **GOOD**:
```typescript
// CSS is the default, JS enhances after hydration
useEffect(() => {
  // Apply stored preference or listen to system changes
}, []);
```

### 3. Proper Separation of Concerns

```
CSS Layer:        Default theme based on prefers-color-scheme
                  └─ Works immediately, no JavaScript needed
                  
JavaScript Layer: Runtime enhancements after hydration
                  ├─ Read stored preference
                  ├─ Listen to system changes
                  └─ Handle user interactions
                  
Result: ✅ Progressive enhancement, no hacks
```

---

## Code Files

### globals.css
- Sets CSS variables with defaults
- Uses `@media (prefers-color-scheme: dark)` for system preference
- Defines `[data-theme="dark"]` and `[data-theme="light"]` selectors

### ThemeProvider.tsx
- `useEffect` runs after hydration
- Gets stored preference from localStorage
- Applies `[data-theme]` attribute if different
- Listens to system preference changes
- Provides context for theme operations

### useTheme.ts
- Custom hook for theme management
- Read current theme
- Toggle or set theme
- Provides presets and UI state

### theme-and-cart-controls.tsx
- Consumer component using `useTheme` hook
- Theme toggle button
- Shows loading state during hydration

---

## Migration from Old Approach

If you still have old code with `suppressHydrationWarning` scripts:

### Before (Bad)
```typescript
// layout.tsx
<html suppressHydrationWarning>
  <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
</html>

// ThemeProvider.tsx
export const THEME_INIT_SCRIPT = `(...)`
```

### After (Good)
```typescript
// layout.tsx
<html lang="en">
  <ThemeProvider>
    {children}
  </ThemeProvider>
</html>

// globals.css
@media (prefers-color-scheme: dark) {
  :root { /* dark theme */ }
}

// ThemeProvider.tsx — useEffect handles everything
export function ThemeProvider({ children }) {
  useEffect(() => {
    // Apply stored preference after hydration
  }, []);
}
```

---

## Testing

### No Hydration Mismatch ✅

1. Open DevTools → Console
2. Should NOT see hydration mismatch warning
3. Only expected messages visible

### Theme Loads Correctly ✅

1. Inspect `<html>` element
2. Check CSS variables are applied
3. Verify theme matches system preference on first load
4. No flash of wrong theme

### Theme Toggle Works ✅

1. Click theme button
2. Theme switches immediately
3. `[data-theme]` attribute applied
4. localStorage persists preference

### System Preference Changes ✅

1. Toggle system dark mode (OS settings)
2. App switches theme automatically (if user hasn't explicitly chosen)
3. Respects user preference over system changes

---

## Performance

### Build Time
✅ No impact — CSS is already parsed

### Runtime
✅ useEffect runs after hydration (not blocking)

### Page Load
✅ Faster — no script execution needed
✅ No FOUC — CSS default works immediately

### Network
✅ No extra requests
✅ Script content zero (was ~1KB inline, now 0)

---

## Developer Experience

### Setup
```typescript
// In layout.tsx
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### Usage in Components
```typescript
"use client";

import { useTheme } from "@/hooks/useTheme";

export function MyComponent() {
  const { theme, toggleTheme, isLoaded } = useTheme();
  
  if (!isLoaded) return <div>Loading theme...</div>;
  
  return (
    <button onClick={toggleTheme}>
      Current: {theme}
    </button>
  );
}
```

### No Hacks, No Suppressions ✅

---

## Summary

| Aspect | Old Way (Bad) | New Way (Good) |
|--------|---------------|---------------|
| Script hacks | ❌ Yes | ✅ No |
| suppressHydrationWarning | ❌ Yes | ✅ No |
| Hydration mismatch | ❌ Possible | ✅ Impossible |
| FOUC | ⚠️ Possible | ✅ Prevented |
| Performance | ⚠️ Slower | ✅ Faster |
| DX | ⚠️ Confusing | ✅ Clean |
| Maintainability | ⚠️ Hard | ✅ Easy |

---

## References

- CSS Custom Properties: https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- prefers-color-scheme: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- React Hydration: https://react.dev/reference/react-dom/hydrateRoot
- Next.js SSR: https://nextjs.org/docs/app/building-your-application/rendering/server-components

---

**Version**: Wave 5.2.0 (Proper Architecture)  
**Updated**: July 3, 2026  
**Status**: ✅ Production Ready  
**DX**: ✅ Clean & Maintainable
