# ARIA Attributes + Dynamic Theme in Next.js with tw()

Comprehensive guide untuk menggunakan ARIA attributes dan dynamic theme switching bersama dengan tailwind-styled-v4 di Next.js.

## Overview

Mendemonstrasikan pattern untuk:
1. ✅ Declare ARIA attributes via tw() object config (`@aria`, `@semantic`, `@state`)
2. ✅ Dynamic theme switching dengan CSS variables dan data-theme attribute
3. ✅ Persistence (localStorage) untuk user preference
4. ✅ Type-safe component props
5. ✅ Accessibility-first development

## Architecture

### Theme System Flow

```
User clicks theme toggle
    ↓
useTheme() → setTheme("dark")
    ↓
localStorage.setItem("tw-theme-preference", "dark")
    ↓
document.documentElement.setAttribute("data-theme", "dark")
    ↓
CSS variables update (globals.css)
    ↓
All tw() components using CSS vars adapt automatically
```

### Component Layers

```
Page (main layout)
├── Section (region)
├── Card (article with ARIA)
│   ├── Subtitle
│   └── Text
├── Button (semantic button + @state)
├── TabList (tablist role)
│   ├── TabButton (tab role + @state)
│   └── TabPanel (tabpanel role)
├── Alert (live region with aria-live)
├── ToggleGroup (radiogroup)
└── Badge (theme variants)
```

## Key Patterns

### Pattern 1: ARIA via tw() Config

❌ **WRONG** - Hardcoded ARIA attributes in JSX:
```tsx
<Button
  role="button"
  aria-label="Save"
  aria-pressed="false"
  onClick={handleSave}
>
  Save Changes
</Button>
```

✅ **RIGHT** - Declare in tw() component:
```tsx
const Button = tw.button({
  base: "px-4 py-2 rounded-lg",
  "@semantic": "button",           // Auto-generate role="button"
  "@aria": {
    role: "button",                // Explicit role
    "aria-label": "Action button"  // Static ARIA
  },
  "@state": {
    pressed: "aria-pressed"        // Bind prop to aria-*
  },
  states: {
    pressed: "bg-blue-600"         // Visual state
  }
});

// Usage:
<Button pressed={isPressedState}>Save</Button>
// Automatically sets both visual class AND aria-pressed="true/false"
```

### Pattern 2: CSS Variables for Dynamic Theme

❌ **WRONG** - Inline styles that don't persist:
```tsx
<div style={{
  backgroundColor: theme === "dark" ? "#000" : "#fff",
  color: theme === "dark" ? "#fff" : "#000"
}}>
  Content
</div>
```

✅ **RIGHT** - CSS variables + tw():
```tsx
// globals.css
:root {
  --color-bg: #ffffff;
  --color-fg: #000000;
}

[data-theme="dark"] {
  --color-bg: #1f2937;
  --color-fg: #f9fafb;
}

// Component
const Card = tw.div({
  base: "bg-[var(--color-bg)] text-[var(--color-fg)] transition-colors duration-300"
});

// Usage - automatically adapts when theme changes
<Card>Content adapts to theme</Card>
```

### Pattern 3: Theme Persistence with useTheme()

```tsx
"use client";

import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
```

### Pattern 4: Combining ARIA + Theme

```tsx
const Alert = tw.div({
  base: "border-l-4 border-[var(--color-primary)] bg-[var(--color-alert-bg)] p-4",
  "@semantic": "aside",
  "@aria": {
    role: "alert",
    "aria-live": "polite",     // Screen readers announce changes
    "aria-atomic": "true"      // Announce entire region
  },
  sub: {
    title: "font-bold mb-2",
    description: "text-sm"
  }
});

// Usage
<Alert>
  <Alert.title>Success!</Alert.title>
  <Alert.description>Your changes were saved.</Alert.description>
</Alert>
```

## Implementation Checklist

### 1. Setup ThemeProvider

```tsx
// src/components/ThemeProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("tw-theme") || "light";
    setThemeState(stored);
    document.documentElement.setAttribute("data-theme", stored);
    setMounted(true);
  }, []);

  const setTheme = (newTheme) => {
    localStorage.setItem("tw-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: theme || "light", setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

### 2. Setup CSS Variables (globals.css)

```css
/* Light theme (default) */
:root {
  --color-bg: #ffffff;
  --color-fg: #000000;
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --color-border: #e5e7eb;
  --color-focus: #2563eb;
  --color-card-bg: #f9fafb;
  --color-alert-bg: #dbeafe;
  --color-panel-bg: #f3f4f6;
  --color-code-bg: #1f2937;
  --color-code-fg: #e5e7eb;
  --color-preview-bg: #f0f9ff;
  --color-fg-muted: #6b7280;
}

/* Dark theme */
[data-theme="dark"] {
  --color-bg: #1f2937;
  --color-fg: #f9fafb;
  --color-primary: #60a5fa;
  --color-secondary: #a78bfa;
  --color-border: #374151;
  --color-focus: #3b82f6;
  --color-card-bg: #111827;
  --color-alert-bg: #0c4a6e;
  --color-panel-bg: #0f172a;
  --color-code-bg: #0f172a;
  --color-code-fg: #d1d5db;
  --color-preview-bg: #051c2c;
  --color-fg-muted: #9ca3af;
}
```

### 3. Wrap App with ThemeProvider

```tsx
// src/app/layout.tsx
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4. Create Accessible Components with tw()

```tsx
// src/components/styles.ts
import { tw } from "tailwind-styled-v4";

export const Button = tw.button({
  base: "px-4 py-2 rounded-lg transition-all",
  "@semantic": "button",
  "@aria": {
    role: "button"
  },
  "@state": {
    disabled: "aria-disabled"
  },
  variants: {
    intent: {
      primary: "bg-[var(--color-primary)] text-white hover:opacity-90",
      secondary: "bg-[var(--color-secondary)] text-white"
    }
  },
  defaultVariants: { intent: "primary" },
  states: {
    disabled: "opacity-50 cursor-not-allowed"
  }
});
```

## Best Practices

### ✅ DO

- **Declare ARIA in tw() config**, not in JSX
- **Use CSS variables** for theme-switching colors
- **Check `mounted` state** before rendering to prevent hydration mismatch
- **Store theme preference** sa localStorage
- **Use semantic HTML tags** with appropriate roles
- **Combine `@aria` + `@state`** para sa reactive ARIA updates
- **Test with screen readers** (VoiceOver, NVDA, JAWS)
- **Provide `aria-label`** para sa icon-only buttons

### ❌ DON'T

- **Don't mix inline styles with tw()** - pick one approach
- **Don't hardcode theme colors** - use CSS variables
- **Don't forget `mounted` check** - causes hydration mismatch
- **Don't skip ARIA attributes** - affects accessibility
- **Don't repeat ARIA declarations** - centralize sa component
- **Don't forget focus indicators** - include focus:ring-* states
- **Don't use color alone** - combine with text/icons for meaning

## Testing Accessibility

### Automated Testing

```bash
# TypeScript type-checking
npm run check:types

# Linting
npm run lint

# Build verification
npm run build
```

### Manual Testing

```bash
# Test with browser DevTools
# 1. Open Accessibility Tree (F12 → Inspector → Accessibility)
# 2. Verify roles, names, states

# Test with screen reader
# macOS: VoiceOver (Cmd+F5)
# Windows: NVDA (free download)
# Linux: Orca

# Test theme switching
# 1. Toggle theme
# 2. Verify colors change
# 3. Check localStorage persistence
# 4. Refresh page - theme should persist
```

## Advanced Patterns

### Dynamic ARIA based on State

```tsx
const Disclosure = tw.div({
  base: "border rounded",
  "@aria": {
    role: "region",
    "aria-labelledby": "trigger-id"
  },
  "@state": {
    open: "aria-expanded"  // auto-sets to true/false
  },
  sub: {
    trigger: {
      base: "w-full p-4 font-medium",
      "@aria": { role: "button" }
    },
    content: "p-4 border-t"
  }
});

// Usage
const [open, setOpen] = useState(false);
<Disclosure open={open}>
  <Disclosure.trigger id="trigger-id" onClick={() => setOpen(!open)}>
    Show Details
  </Disclosure.trigger>
  {open && <Disclosure.content>Expanded content</Disclosure.content>}
</Disclosure>
```

### Live Region Updates

```tsx
const LiveStatus = tw.div({
  "@aria": {
    role: "status",
    "aria-live": "polite",      // Politely announces changes
    "aria-atomic": "true"       // Announce full region
  }
});

// Component
function NotificationCenter() {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    // Automatically announced to screen readers
    setMessages([...messages, "Task completed successfully"]);
  }, []);

  return (
    <LiveStatus>
      {messages.map((msg, i) => <div key={i}>{msg}</div>)}
    </LiveStatus>
  );
}
```

## Related Resources

- `.kiro/steering/tailwind-styled-v4-guidelines.md` - Full API guide
- `.kiro/steering/no-inline-styles.md` - Styling rules
- `docs/accessibility/01-ARIA_VS_VARIANTS.md` - ARIA deep dive
- MDN: [ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- MDN: [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)

## Summary

Combining ARIA attributes with dynamic theming sa tw() creates:
- ✅ Fully accessible components
- ✅ Runtime theme switching without reload
- ✅ Type-safe props
- ✅ Persistent user preferences
- ✅ Screen reader friendly
- ✅ Production-ready

Start with this pattern untuk all future component development!
