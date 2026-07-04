# @tailwind-styled/theme

Multi-theme engine + live token management for tailwind-styled-v5.

## Features

- **Multiple Named Themes** - Support light, dark, brand, high-contrast themes
- **CSS Variables Output** - Tailwind v4 compatible CSS variable generation
- **Theme Contract** - TypeScript-safe theme definitions (missing tokens = TS error)
- **Per-Component Overrides** - Apply themes at any scope
- **Live Token Engine** - Runtime token state management with CSS sync
- **Theme Persistence** - localStorage + system preference auto-sync

## Installation

```bash
npm install @tailwind-styled/theme
```

## Usage

### 1. Multi-Theme Setup

Define themes with a contract:

```tsx
import { defineThemeContract, createMultiTheme } from '@tailwind-styled/theme'

// Define the shape of your theme (enforced by TypeScript)
const contract = defineThemeContract({
  colors: {
    bg: '',
    fg: '',
    primary: '',
    border: '',
  },
  font: {
    sans: '',
    mono: '',
  },
})

// Create light and dark themes
const { registry, vars, light, dark } = createMultiTheme({
  contract,
  light: {
    colors: {
      bg: '#ffffff',
      fg: '#09090b',
      primary: '#3b82f6',
      border: '#e5e7eb',
    },
    font: {
      sans: 'InterVariable, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
  },
  dark: {
    colors: {
      bg: '#09090b',
      fg: '#fafafa',
      primary: '#60a5fa',
      border: '#27272a',
    },
    font: {
      sans: 'InterVariable, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
  },
})

// Inject CSS into page
registry.inject()
```

### 2. Use Tokens in Components

```tsx
import tw from 'tailwind-styled-v4'
import { vars } from './theme'

// Use CSS variables directly
const Card = tw.div`
  bg-[${vars.colors.bg}]
  text-[${vars.colors.fg}]
  border border-[${vars.colors.border}]
  transition-colors duration-200
`

export function MyCard() {
  return (
    <Card>
      Card content that adapts to theme
    </Card>
  )
}
```

### 3. Theme Persistence (localStorage + System Preference)

Initialize theme persistence in your layout:

```tsx
// app/layout.tsx
import { ThemeInitScript } from '@tailwind-styled/theme'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Must be in <head> to prevent FOUC */}
        <ThemeInitScript
          storageKey="app-theme"
          defaultTheme="system"
          classNameDark="dark"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

Then use the `useTheme` hook to manage theme:

```tsx
'use client'

import tw from 'tailwind-styled-v4'
import { useTheme } from '@tailwind-styled/theme'

const Button = tw.button`
  px-4 py-2 rounded
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-white
  transition-colors duration-200
`

export function ThemeToggle() {
  const { theme, systemPreference, toggleTheme } = useTheme()

  return (
    <Button onClick={toggleTheme}>
      Theme: {theme}
      {theme === 'system' && ` (system: ${systemPreference})`}
    </Button>
  )
}
```

### 4. useTheme Hook API

```tsx
const {
  theme,              // 'light' | 'dark' | 'system'
  systemPreference,   // 'light' | 'dark' (detected from prefers-color-scheme)
  setTheme,           // (theme: ThemeValue) => void
  toggleTheme,        // () => void
  isInitialized,      // boolean
} = useTheme()
```

**Features:**
- Auto-saves to localStorage
- Syncs with system preference changes
- Prevents FOUC (flash of unstyled content)
- SSR-safe with inline script initialization
- No external dependencies

### 5. Advanced: Registry API

```tsx
const registry = createThemeRegistry()

// Register themes
registry.register(lightTheme, true) // true = default
registry.register(darkTheme)

// Generate CSS
const css = registry.generateCss()

// Switch active theme
registry.apply('dark')

// Get current theme
const current = registry.current()
```

### 6. Live Token Engine

Update tokens at runtime:

```tsx
import { createUseTokens, liveToken } from '@tailwind-styled/theme'

// Create hook for token updates
const useTokens = createUseTokens()

// Use in component
export function TokenTest() {
  const tokens = useTokens()

  return (
    <div
      style={{
        // Subscribe to token changes
        '--color-primary': tokens.get('colors.primary'),
      } as React.CSSProperties}
    >
      <button
        onClick={() => {
          // Update token at runtime
          tokens.set('colors.primary', '#ff0000')
        }}
      >
        Change Primary Color
      </button>
    </div>
  )
}
```

## Theme Persistence Configuration

The `ThemeInitScript` component accepts:

```tsx
interface ThemeInitScriptProps {
  /** Storage key for localStorage (default: 'theme-preference') */
  storageKey?: string

  /** Default theme if not set (default: 'system') */
  defaultTheme?: 'light' | 'dark' | 'system'

  /** CSS class for dark mode (default: 'dark') */
  classNameDark?: string
}
```

## How It Works

### Initialization Flow (SSR-Safe Hydration)

The theme persistence system is designed to **prevent hydration mismatches** without using `suppressHydrationWarning`:

1. **Server-side render**:
   - `ThemeInitScript` component runs on server
   - Inline script is generated but NOT executed (server has no localStorage or matchMedia)
   - HTML renders with default theme class (e.g., no class = light theme)
   - Server sends `<html>` with deterministic state

2. **Before React hydration**:
   - Inline script executes in `<head>`
   - Reads localStorage synchronously for user's stored preference
   - If stored value exists (e.g., 'dark' or 'system'), applies that immediately
   - If no stored value, uses `defaultTheme` config
   - Applies CSS class to `<html>` before React starts hydrating

3. **React hydration**:
   - `useTheme` hook initializes with SSR-safe state
   - On first render: matches what the inline script already applied
   - No hydration mismatch (server and client render identical HTML)
   - Component uses `mounted` ref to track post-hydration phase

4. **After hydration**:
   - `useEffect` runs and detects actual system preference from `prefers-color-scheme`
   - If theme is set to 'system', switches to actual preference smoothly
   - Listeners subscribe to system preference changes
   - All future changes sync to localStorage automatically

5. **On user theme change**:
   - Saves to localStorage immediately
   - Applies CSS class to `<html>` 
   - Persists across page reloads
   - Subscribes to system preference updates

### Key Properties

- **No FOUC**: Inline script runs before first paint
- **No hydration warnings**: Server/client render identically
- **SSR-safe**: All checks for `typeof window` and localStorage handle SSR
- **System preference sync**: Automatic when OS preference changes
- **Persistent**: Uses localStorage, survives page reload
- **Performant**: Minimal DOM updates, CSS class only

### Hydration Safety Technical Details

The `useTheme` hook uses a `mounted` ref to track post-hydration phase:

```tsx
const mounted = useRef(false)

useEffect(() => {
  mounted.current = true
  // Effects that read browser APIs now run safely
}, [])
```

This ensures:
- Initial state uses `getSystemPreferenceSSR()` which prefers stored value
- Browser API reads (system preference detection) happen in effects, not render
- No mismatch between server HTML and React's initial render
- System preference sync happens after hydration completes

## Best Practices

### SSR & Hydration

**Always place `ThemeInitScript` in `<head>`** to prevent flash of unstyled content and hydration mismatches:

```tsx
// ✅ Correct - prevents FOUC and hydration mismatch
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <ThemeInitScript 
          storageKey="app-theme"
          defaultTheme="system"
          classNameDark="dark"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

// ❌ Wrong - causes FOUC and hydration warnings
<html>
  <body>
    <ThemeInitScript />
    {children}
  </body>
</html>
```

**Why this works without `suppressHydrationWarning`:**

The system is designed to ensure server and client render identically:

1. **Deterministic server render**: Renders with safe default (light theme, no class)
2. **Inline script before hydration**: Reads stored preference and applies class before React starts
3. **Matching React state**: `useTheme` hook initializes with the same value the script applied
4. **No hydration mismatch**: Server HTML matches what React renders on client
5. **Clean system preference sync**: Happens in `useEffect`, after hydration completes

### General Best Practices

1. **Initialize once at app root** - Place `ThemeInitScript` exactly once in your root layout's `<head>`

2. **Use CSS Variables in Components**
   ```tsx
   // ✅ Good - changes automatically with theme
   const Card = tw.div`bg-[var(--colors-bg)]`

   // ❌ Avoid - won't change with theme
   const Card = tw.div`bg-white dark:bg-black`
   ```

3. **Toggle Theme via useTheme**
   ```tsx
   // ✅ Good - persists and syncs
   const { toggleTheme } = useTheme()

   // ❌ Avoid - doesn't persist
   element.classList.toggle('dark')
   ```

4. **Set System Preference as Default**
   ```tsx
   // ✅ Good - respects user's OS preference
   <ThemeInitScript defaultTheme="system" />

   // ⚠️ Consider - may surprise users
   <ThemeInitScript defaultTheme="light" />
   ```

## TypeScript Support

Full type safety for theme contracts:

```tsx
const contract = defineThemeContract({
  colors: { bg: '', fg: '' },
})

// ✅ Type-safe
const theme = createTheme(contract, 'light', {
  colors: { bg: '#fff', fg: '#000' },
})

// ❌ Error - missing 'fg'
const theme = createTheme(contract, 'light', {
  colors: { bg: '#fff' },
})
```

## API Reference

### `defineThemeContract<T>(shape: T): ThemeContract<T>`

Define the shape of your theme. Returns typed CSS variable references.

### `createTheme<T>(contract, name, values, asRoot?): Theme<T>`

Create a typed theme that satisfies a contract.

### `createMultiTheme<T>(config): { registry, vars, light, dark }`

Convenience helper for light/dark + optional extras.

### `useTheme(config?): UseThemeReturn`

Hook to manage theme state with localStorage persistence.

### `ThemeInitScript(props): JSX.Element`

Component that renders SSR-safe initialization script.

### Persistence Utilities

```tsx
getSystemPreference(): 'light' | 'dark'
getEffectiveTheme(theme, systemPref): 'light' | 'dark'
getStoredTheme(storageKey): ThemeValue | null
saveTheme(storageKey, theme): void
applyThemeToElement(theme, element, classNameDark): void
subscribeToSystemPreferenceChanges(callback): () => void
```

## License

MIT
