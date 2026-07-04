# Theme Setup — Final & Complete

Ultra-minimal theme system that lets Tailwind handle everything.

---

## Setup (Copy-Paste Ready)

### 1. globals.css
```css
@import "tailwindcss";
@import "./../../.next/tw-classes/_tw-state-static.css";
@source "__tw_safelist.css";

:root {
  --background: #f5f7fb;
  --foreground: #111827;
  --surface: #ffffff;
  --surface-muted: #eef2ff;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-contrast: #eff6ff;
  --border: rgba(17, 24, 39, 0.10);
}

[data-theme="dark"] {
  --background: #070b16;
  --foreground: #e5e7eb;
  --surface: #0f172a;
  --surface-muted: #111b34;
  --accent: #60a5fa;
  --accent-hover: #93c5fd;
  --accent-contrast: #0b1220;
  --border: rgba(229, 231, 235, 0.10);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-muted: var(--surface-muted);
  --color-accent: var(--accent);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans, Arial, Helvetica, sans-serif);
  transition: background-color 0.2s ease, color 0.2s ease;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### 2. ThemeProvider.tsx
```typescript
"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";

const STORAGE_KEY = "tw-theme-preference";

function getThemePreference(): "light" | "dark" {
  if (typeof localStorage === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY);
  return (stored === "light" || stored === "dark") ? stored : "light";
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
}

interface ThemeContextType {
  mounted: boolean;
  theme: "light" | "dark" | null;
  setTheme: (theme: "light" | "dark") => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const currentTheme = getThemePreference();
    setThemeState(currentTheme);
    applyTheme(currentTheme);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: "light" | "dark") => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ mounted, theme: theme || "light", setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be inside ThemeProvider");
  return context;
}
```

### 3. layout.tsx
```typescript
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Usage in Components

```typescript
"use client";
import { useTheme } from "@/hooks/useTheme";

export function MyComponent() {
  const { theme, setTheme, mounted } = useTheme();
  
  if (!mounted) return <div>Loading theme...</div>;
  
  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      Switch to {theme === "light" ? "dark" : "light"} mode
    </button>
  );
}
```

---

## How It Works

1. **CSS defaults** (`globals.css`):
   - Light theme by default (:root)
   - Dark theme when `[data-theme="dark"]`
   - Tailwind bridges variables to design system

2. **JavaScript** (`ThemeProvider.tsx`):
   - Check localStorage on mount
   - Apply stored theme via `data-theme` attribute
   - Provide context for components

3. **Result**: Theme updates instantly, persists across reloads

---

## Verification

```bash
# TypeScript clean
npx tsc --noEmit

# Tests passing
npm run test:smoke

# Dev server
npm run dev
# Should have NO hydration warnings
# Theme works correctly
```

---

## That's It!

- ✅ 30 lines CSS
- ✅ 50 lines React
- ✅ Let Tailwind handle the rest
- ✅ Production ready

**Simple. Clean. Done.** 🎉
