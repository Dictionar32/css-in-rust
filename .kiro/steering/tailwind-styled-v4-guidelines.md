# tailwind-styled-v4 API Guidelines — Advanced

**Status**: Complete & Advanced  
**Version**: v5.0.12+  
**Applies to**: All JSX/TSX files in learn folder and example app  
**Recommended Pattern**: Object Config Syntax (for all but simplest components)

## The tw API — Overview

`tw` is the main factory function for creating styled components using tailwind-styled-v4. It combines the developer experience of styled-components with Tailwind CSS v4 performance.

### Core Principles

1. **NEVER use `className=` inline** — Creates code duplication, defeats reusability
2. **Prefer object-config syntax** — Better for variants, states, sub-components, ARIA
3. **Use template literals only for simple components** — No variants, states, or subs
4. **Leverage all config options** — variants, states, sub (with nested variants), ARIA

```typescript
// ❌ WRONG - Inline className (code duplication)
<div className="px-4 py-2 bg-blue-500 hover:bg-blue-600">Button</div>

// ⚠️ OK - Template literal (only for simple, reusable components)
const SimpleDiv = tw.div`px-4 py-2 bg-blue-500`

// ✅ BEST - Object config (recommended for ALL non-trivial components)
const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition-colors",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300"
    }
  },
  defaultVariants: { intent: "primary" }
})
<Button intent="primary">Click me</Button>
```

## API Methods — Object Config First

### ✅ RECOMMENDED: Object Config Syntax (Preferred for 90% of components)

Use object config for anything beyond trivial components. It enables variants, states, sub-components, and ARIA attributes.

```typescript
const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition-all cursor-pointer",
  
  // Variants — Type-safe props
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700 active:scale-95",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
      danger: "bg-red-600 text-white hover:bg-red-700"
    },
    size: {
      sm: "text-sm px-3 py-1",
      md: "text-base px-4 py-2",
      lg: "text-lg px-6 py-3"
    }
  },
  defaultVariants: { intent: "primary", size: "md" },
  
  // Boolean states (pre-generated at build time)
  states: {
    loading: "opacity-60 cursor-wait pointer-events-none",
    fullWidth: "w-full",
    disabled: "opacity-50 cursor-not-allowed"
  },
  
  // Sub-components for related elements
  sub: {
    icon: "w-4 h-4 mr-2",        // Bare key → <span>
    "span:label": "font-semibold", // Explicit tag
    "span:badge": {               // Nested with variants
      base: "ml-2 px-2 py-1 rounded text-xs",
      variants: { type: { success: "bg-green-100", error: "bg-red-100" } }
    }
  },
  
  // ARIA attributes for accessibility
  '@aria': {
    role: 'button',
    'aria-label': 'Action button'
  }
})

// Usage with full type safety:
<Button intent="danger" size="lg" loading fullWidth>
  <Button.icon>⚡</Button.icon>
  <Button.label>Processing...</Button.label>
</Button>
```

### ⚠️ Template Literal Syntax (Use only for simple, reusable components with NO variants/states)

Template literals are concise but limited — no type safety for variants.

```typescript
// Only use for simple components:
const Card = tw.div`p-6 bg-white rounded-lg shadow-md`
const Title = tw.h2`text-xl font-bold text-gray-900 mb-4`
const Container = tw.div`max-w-5xl mx-auto px-4 py-10`

// DON'T use for complex components:
// ❌ WRONG — Lost all variant type safety
const Button = tw.button`px-4 py-2 bg-blue-600 text-white`
// No way to accept props, no autocomplete for variants
```

## Utility Functions — Essential APIs

### cv() — Class Variant Resolver

Type-safe variant resolution with caching and native Rust bindings:

```typescript
import { cv } from "tailwind-styled-v4"

const Button = tw.button({
  base: "px-4 py-2 rounded-lg",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white",
      secondary: "bg-gray-200"
    },
    size: {
      sm: "text-sm",
      md: "text-base"
    }
  },
  defaultVariants: { intent: "primary", size: "md" }
})

// Extract variant resolver for reuse
const ButtonVariants = cv({
  base: "px-4 py-2 rounded-lg",
  variants: {
    intent: { primary: "...", secondary: "..." },
    size: { sm: "...", md: "..." }
  }
})

// Use in function: ButtonVariants({ intent: "secondary", size: "sm" })
```

### cx() / cn() — Class Merging

**cn()** — Simple class concatenation (no conflict resolution):
```typescript
import { cn } from "tailwind-styled-v4"

cn("p-4", "px-8")                    // → "p-4 px-8" (both kept)
cn("flex", isActive && "opacity-100") // → "flex opacity-100"
cn(["gap-2", "flex-col"], "items-center")  // → "gap-2 flex-col items-center"
```

**cx()** — Conflict-aware merging (uses Tailwind conflict resolution):
```typescript
import { cx } from "tailwind-styled-v4"

cx("p-4", "p-8")                     // → "p-8" (last wins)
cx("bg-red-500", "bg-blue-500")      // → "bg-blue-500"
cx(["flex", isActive && "gap-2"])    // → "flex gap-2" OR "flex"
```

**Use cx() for component composition, cn() for simple joining**

### createStyledSystem() — Design System Factory

Create a complete design system with tokens, components, and automatic CSS var injection:

```typescript
import { createStyledSystem } from "tailwind-styled-v4"

const ui = createStyledSystem({
  // Step 1: Define design tokens
  tokens: {
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      success: "#10b981",
      error: "#ef4444"
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem"
    },
    radius: {
      sm: "0.25rem",
      md: "0.5rem",
      full: "9999px"
    }
  },

  // Step 2: Define component presets
  components: {
    button: {
      base: "inline-flex items-center font-medium transition-colors cursor-pointer",
      variants: {
        variant: {
          primary: "bg-[var(--sys-colors-primary)] text-white hover:opacity-90",
          secondary: "bg-[var(--sys-colors-secondary)] text-white",
          outline: "border border-[var(--sys-colors-primary)] text-[var(--sys-colors-primary)]"
        },
        size: {
          sm: `h-8 px-[var(--sys-spacing-sm)] text-sm rounded-[var(--sys-radius-sm)]`,
          md: `h-10 px-[var(--sys-spacing-md)] text-base rounded-[var(--sys-radius-md)]`,
          lg: `h-12 px-[var(--sys-spacing-lg)] text-lg rounded-[var(--sys-radius-md)]`
        }
      },
      defaultVariants: { variant: "primary", size: "md" }
    },
    
    card: {
      base: `rounded-[var(--sys-radius-md)] bg-white border border-gray-200 p-[var(--sys-spacing-md)]`,
      variants: {
        elevated: {
          true: "shadow-lg",
          false: "shadow-sm"
        }
      }
    }
  },

  prefix: "sys",  // CSS vars: --sys-colors-primary, --sys-spacing-md, etc.
  injectTokens: true  // Auto-inject :root CSS variables
})

// Usage:
const Button = ui.button()
const Card = ui.card()

<Button variant="primary" size="lg">Click Me</Button>
<Card elevated>Content</Card>

// Token access:
ui.token("colors.primary")   // → "var(--sys-colors-primary)"
ui.cssVar("colors.primary")  // → "#6366f1"
```

### liveToken() — Reactive Theme Management

Create reactive tokens that update across entire app without re-rendering:

```typescript
import { liveToken, createUseTokens, setToken, subscribeTokens } from "tailwind-styled-v4"

// Initialize live tokens
const tokens = liveToken({
  colors: {
    primary: "#6366f1",
    background: "#ffffff",
    foreground: "#000000"
  },
  theme: {
    mode: "light"
  }
})

// Hook for components
const useTokens = createUseTokens()

export function ThemeToggle() {
  const currentTokens = useTokens()  // Subscribe to token changes

  const toggleTheme = () => {
    const newMode = currentTokens.theme.mode === "light" ? "dark" : "light"
    
    setToken("theme.mode", newMode)
    if (newMode === "dark") {
      setToken("colors.background", "#000000")
      setToken("colors.foreground", "#ffffff")
    } else {
      setToken("colors.background", "#ffffff")
      setToken("colors.foreground", "#000000")
    }
  }

  return (
    <button onClick={toggleTheme}>
      Toggle to {currentTokens.theme.mode === "light" ? "dark" : "light"} mode
    </button>
  )
}

// Programmatic access:
const primaryColor = getToken("colors.primary")  // → "#6366f1"
const allColors = getTokens("colors")             // → { primary: "#6366f1", ... }

// Subscribe to changes:
subscribeTokens("colors.primary", (newValue) => {
  console.log("Primary color changed to:", newValue)
})
```

### twMerge() — Advanced Class Merging

```typescript
import { twMerge, createTwMerge } from "tailwind-styled-v4"

// Built-in merge
twMerge("p-4 p-8", "m-4", "flex")  // → "p-8 m-4 flex"

// Custom merge with conflict rules
const customMerge = createTwMerge({
  corePlugins: {
    padding: true,
    margin: false  // Don't apply margin conflict rules
  }
})

customMerge("p-4 p-8", "m-4")  // → "p-8 m-4"
```

### styled() — Low-level Variant Resolution

```typescript
import { styled, resolveStyledClassName } from "tailwind-styled-v4"

const buttonStyle = styled({
  base: "px-4 py-2 rounded",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white",
      secondary: "bg-gray-200"
    }
  }
})

// Get className directly
const className = buttonStyle({ intent: "primary" })

// Or use resolver
const className2 = resolveStyledClassName(
  {
    base: "px-4 py-2",
    variants: { size: { sm: "text-sm", lg: "text-lg" } }
  },
  { size: "lg", className: "custom-class" }
)
```

## Advanced Features — Beyond Basics

### Sub-Components with Nested Variants

Sub-components can have their own variants — enabling deeply customizable component trees:

```typescript
const Card = tw.div({
  base: "bg-white rounded-xl shadow-md overflow-hidden",
  sub: {
    // Simple sub-component
    header: "px-6 py-4 border-b bg-gray-50",
    
    // Sub-component with variants (powerful!)
    actions: {
      base: "flex gap-2 px-6 py-4 border-t bg-gray-50",
      variants: {
        layout: {
          horizontal: "flex-row justify-end",
          vertical: "flex-col items-stretch",
          center: "flex-row justify-center"
        },
        spacing: {
          compact: "gap-1",
          normal: "gap-2",
          loose: "gap-4"
        }
      },
      defaultVariants: { layout: "horizontal", spacing: "normal" }
    }
  }
})

// Usage - sub-component variants work like parent variants:
<Card>
  <Card.header>Title</Card.header>
  <Card.actions layout="vertical" spacing="loose">
    <button>Cancel</button>
    <button>Save</button>
  </Card.actions>
</Card>
```

### ARIA Attributes — Accessibility First

Declare ARIA attributes in component config for semantic markup. Two patterns:

#### Pattern 1: Static ARIA (same for all instances)

```typescript
const Modal = tw.div({
  base: "fixed inset-0 z-50 bg-black/50 flex items-center justify-center",
  '@aria': {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'modal-title'
  },
  sub: {
    header: "px-6 py-4 border-b",
    title: "text-lg font-bold",
    body: "px-6 py-4 flex-1 overflow-auto",
    footer: "px-6 py-4 border-t flex gap-2 justify-end"
  }
})

<Modal>
  <Modal.header>
    <Modal.title id="modal-title">Confirm Action</Modal.title>
  </Modal.header>
  <Modal.body>Are you sure?</Modal.body>
</Modal>
```

#### Pattern 2: Dynamic ARIA (varies by prop/state)

Use `@state` mapping to bind component states to ARIA properties:

```typescript
const Disclosure = tw.div({
  base: "border rounded-lg",
  '@aria': {
    role: 'region',
    'aria-labelledby': 'disclosure-trigger'
  },
  '@state': {
    open: 'aria-expanded'  // When open={true} → aria-expanded="true"
  },
  sub: {
    trigger: {
      base: "w-full px-4 py-3 font-medium hover:bg-gray-50 text-left",
      '@aria': { role: 'button' }
    },
    content: "px-4 py-3 border-t"
  }
})

// Usage - state maps to ARIA automatically:
const [open, setOpen] = useState(false)
<Disclosure open={open}>
  <Disclosure.trigger onClick={() => setOpen(!open)} id="disclosure-trigger">
    Show Details
  </Disclosure.trigger>
  {open && <Disclosure.content>Content here</Disclosure.content>}
</Disclosure>
// Result: <div role="region" aria-expanded="true" aria-labelledby="disclosure-trigger">
```

### Semantic Components — Auto-ARIA Generation

Use `@semantic` to declare component type — the build system auto-injects ARIA:

```typescript
const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium",
  '@semantic': 'button',  // Auto-inject role="button" if needed
  variants: {
    intent: { primary: "...", secondary: "..." }
  }
})

const Checkbox = tw.input({
  base: "w-4 h-4 cursor-pointer",
  '@semantic': 'checkbox',  // Auto-inject role="checkbox" + aria-checked
  '@state': {
    checked: 'aria-checked'  // Bind checked state to ARIA
  }
})

const NavigationLink = tw.a({
  base: "px-4 py-2 text-blue-600 hover:underline",
  '@semantic': 'link'  // Auto-inject role="link"
})

const Tab = tw.button({
  base: "px-4 py-2 border-b-2",
  '@semantic': 'tab',
  '@state': {
    active: 'aria-selected'  // When active → aria-selected="true"
  }
})
```

### Compound Component Pattern with Shared State

For complex UIs, share state across sub-components:

```typescript
const Tabs = tw.div({
  base: "w-full",
  sub: {
    list: "flex border-b",
    trigger: {
      base: "px-4 py-2 font-medium text-sm cursor-pointer border-b-2 border-transparent hover:border-gray-300 transition-colors",
      variants: {
        active: {
          true: "text-blue-600 border-blue-600",
          false: "text-gray-600"
        }
      },
      '@aria': { role: 'tab' },
      '@state': { active: 'aria-selected' }
    },
    panels: "mt-4",
    panel: {
      base: "p-4",
      variants: {
        hidden: {
          true: "hidden",
          false: "block"
        }
      },
      '@aria': { role: 'tabpanel' }
    }
  }
})

// Usage:
const [activeTab, setActiveTab] = useState(0)
<Tabs>
  <Tabs.list>
    <Tabs.trigger active={activeTab === 0} onClick={() => setActiveTab(0)}>
      Tab 1
    </Tabs.trigger>
    <Tabs.trigger active={activeTab === 1} onClick={() => setActiveTab(1)}>
      Tab 2
    </Tabs.trigger>
  </Tabs.list>
  <Tabs.panels>
    <Tabs.panel hidden={activeTab !== 0}>Content 1</Tabs.panel>
    <Tabs.panel hidden={activeTab !== 1}>Content 2</Tabs.panel>
  </Tabs.panels>
</Tabs>
```

## Boolean, Number & String Variants — Type Safety

The library now fully supports **boolean**, **number**, and **string literal variants** with complete TypeScript type inference:

### ✅ Boolean Variants (Recommended for Toggle States)

```typescript
const Button = tw.button({
  variants: {
    disabled: {
      true: "opacity-50 cursor-not-allowed",
      false: "opacity-100 cursor-pointer"
    }
  },
  defaultVariants: { disabled: false }  // ✅ Boolean false, NOT "false"
})

// Usage — Type-safe!
<Button disabled={true} />     // ✅ Correct
<Button disabled={false} />    // ✅ Correct
<Button disabled={isLoading} /> // ✅ Correct
<Button disabled="true" />      // ❌ Type Error (caught at compile time)
```

### ✅ Number Variants (For Priority, Index, Severity)

```typescript
const Alert = tw.div({
  variants: {
    severity: {
      0: "bg-blue-100 text-blue-900",    // Info
      1: "bg-yellow-100 text-yellow-900", // Warning
      2: "bg-red-100 text-red-900"        // Error
    }
  },
  defaultVariants: { severity: 0 }  // ✅ Number, not string
})

// Usage
<Alert severity={0} />     // ✅ Info
<Alert severity={1} />     // ✅ Warning
<Alert severity={2} />     // ✅ Error
<Alert severity="1" />     // ❌ Type Error
```

### ✅ String Variants (For Named States)

```typescript
const Badge = tw.span({
  variants: {
    status: {
      "success": "bg-green-100 text-green-900",
      "pending": "bg-yellow-100 text-yellow-900",
      "error": "bg-red-100 text-red-900"
    }
  },
  defaultVariants: { status: "pending" }  // ✅ String literal
})

// Usage
<Badge status="success" />   // ✅ Correct
<Badge status="pending" />   // ✅ Correct
<Badge status="error" />     // ✅ Correct
<Badge status={true} />      // ❌ Type Error
```

### ❌ Common Mistakes to Avoid

```typescript
// WRONG — String "true"/"false" for boolean variants
const Button = tw.button({
  variants: {
    active: { true: "...", false: "..." }
  },
  defaultVariants: { active: "false" }  // ❌ ERROR: Should be boolean false
})

// WRONG — Passing string to boolean prop
<Button active="true" />  // ❌ ERROR: Should be boolean true
<Button active={isActive ? "true" : "false"} />  // ❌ ERROR: Strings!

// CORRECT
const Button = tw.button({
  variants: {
    active: { true: "...", false: "..." }
  },
  defaultVariants: { active: false }  // ✅ Boolean false
})

<Button active={true} />       // ✅ Correct
<Button active={false} />      // ✅ Correct
<Button active={isActive} />   // ✅ Correct
```

### Type Inference Table

| Variant Keys | Type | defaultVariants | Usage |
|---|---|---|---|
| `{ true: "...", false: "..." }` | Boolean | `active: false` | `<Comp active={true} />` |
| `{ 0: "...", 1: "...", 2: "..." }` | Number | `level: 1` | `<Comp level={2} />` |
| `{ "small": "...", "large": "..." }` | String | `size: "small"` | `<Comp size="large" />` |
| `{ primary: "...", secondary: "..." }` | String | `variant: "primary"` | `<Comp variant="secondary" />` |

### Why Type Safety Matters Here

1. **Compile-time errors**: Catch boolean/string mismatches before runtime
2. **IDE autocomplete**: Get correct suggestions for variant values
3. **No runtime bugs**: TypeScript prevents invalid prop combinations
4. **Better refactoring**: Change variant types safely with full validation

## Common Patterns

### 1. Page Layout — Object Config with Sub-Components

```typescript
// ✅ RECOMMENDED - Object config for all structural elements
const Page = tw.div({
  base: "min-h-screen bg-slate-50",
  sub: {
    header: "sticky top-0 z-50 h-12 bg-white border-b",
    body: "max-w-5xl mx-auto px-4 py-10 flex gap-10",
    content: "flex-1 min-w-0",
    sidebar: "w-64 shrink-0"
  }
})

// ⚠️ NOT RECOMMENDED - Template literals (no organization, no variants)
const Page = tw.div`min-h-screen bg-slate-50`
const Header = tw.nav`sticky top-0 z-50 h-12 bg-white border-b`

// Usage (cleaner with sub-components):
<Page>
  <Page.header>Navigation</Page.header>
  <Page.body>
    <Page.content>Main content</Page.content>
    <Page.sidebar>Sidebar</Page.sidebar>
  </Page.body>
</Page>
```

### 2. Buttons — Object Config with Full Variants & States

```typescript
const Button = tw.button({
  base: `
    px-4 py-2 rounded-lg font-medium
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700 active:scale-95",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
      ghost: "text-gray-700 hover:bg-gray-100",
      danger: "bg-red-600 text-white hover:bg-red-700"
    },
    size: {
      xs: "px-2 py-1 text-xs",
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    }
  },
  defaultVariants: { intent: "primary", size: "md" },
  states: {
    loading: "opacity-60 cursor-wait",
    fullWidth: "w-full"
  },
  sub: {
    icon: "w-4 h-4 mr-2 inline-block",
    "span:text": "font-medium"
  },
  '@semantic': 'button',
  '@aria': {
    'aria-label': 'Action button'
  }
})

// Usage with sub-components:
<Button intent="primary" size="lg">
  <Button.icon>✓</Button.icon>
  <Button.text>Save Changes</Button.text>
</Button>

<Button loading fullWidth intent="secondary">
  Processing...
</Button>
```

### 3. Form Controls — Object Config with ARIA & Sub-Components

```typescript
const FormGroup = tw.div({
  base: "mb-4",
  sub: {
    label: {
      base: "block text-sm font-medium text-gray-700 mb-1",
      '@aria': { 'aria-label': 'Form label' }
    },
    input: {
      base: `
        w-full px-3 py-2 border border-gray-300 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors
      `,
      variants: {
        error: {
          true: "border-red-500 focus:ring-red-500",
          false: "border-gray-300"
        },
        disabled: {
          true: "opacity-50 cursor-not-allowed",
          false: ""
        }
      },
      '@aria': { 'aria-invalid': 'error' }
    },
    error: "text-red-600 text-xs mt-1",
    hint: "text-gray-500 text-xs mt-1"
  },
  '@semantic': 'form'
})

// Usage:
const [email, setEmail] = useState("")
const [error, setError] = useState(false)

<FormGroup>
  <FormGroup.label htmlFor="email">Email Address</FormGroup.label>
  <FormGroup.input
    id="email"
    type="email"
    value={email}
    error={error}
    onChange={(e) => setEmail(e.target.value)}
    aria-describedby="email-hint"
  />
  {error && <FormGroup.error>Invalid email format</FormGroup.error>}
  <FormGroup.hint id="email-hint">We'll never share your email</FormGroup.hint>
</FormGroup>
```

### 4. Cards — Object Config with Sub-Component Variants

```typescript
const Card = tw.div({
  base: "bg-white rounded-xl shadow-md overflow-hidden",
  sub: {
    header: {
      base: "px-6 py-4 border-b bg-gray-50",
      variants: {
        featured: {
          true: "bg-blue-50 border-blue-200",
          false: "bg-gray-50 border-gray-200"
        }
      }
    },
    body: "px-6 py-4",
    footer: {
      base: "px-6 py-3 border-t bg-gray-50 flex gap-2 justify-end",
      variants: {
        layout: {
          horizontal: "flex-row",
          vertical: "flex-col items-stretch"
        }
      }
    }
  },
  '@semantic': 'section'
})

// Usage with sub-component variants:
<Card>
  <Card.header featured>
    <h3 className="font-bold">Premium Feature</h3>
  </Card.header>
  <Card.body>
    Your content goes here
  </Card.body>
  <Card.footer layout="horizontal">
    <Button intent="secondary">Cancel</Button>
    <Button intent="primary">Save</Button>
  </Card.footer>
</Card>
```

### 5. Form Controls — Input with Sub-Components and ARIA

```typescript
const NavLink = tw.a({
  base: `
    px-4 py-2 rounded-lg transition-colors
    text-gray-700 hover:text-gray-900 hover:bg-gray-100
  `,
  variants: {
    active: {
      true: "text-blue-600 font-semibold bg-blue-50",
      false: ""
    }
  }
})

// Usage:
<nav className="flex gap-2">
  <NavLink href="/home" active={pathname === "/home"}>Home</NavLink>
  <NavLink href="/about" active={pathname === "/about"}>About</NavLink>
</nav>
```

## Best Practices

### ✅ DO — Priority Order

1. **Use object-config syntax for 90% of components** — Best for variants, states, subs, and ARIA
2. **Match defaultVariants type to variant keys** — Boolean keys need boolean defaults, number keys need number, string needs string
3. **Use semantic boolean variants for toggle states** — `active: { true: "...", false: "..." }` is clearer than string variants
4. **Start with `@semantic` + `@aria`** — Accessibility first, semantics second
3. **Use sub-components for related elements** — Better organization and type safety
4. **Declare sub-component variants** — Enable prop control on nested elements
5. **Map states to ARIA with `@state`** — Automatically bind component state to accessibility attributes
6. **Create named components in styles.ts** — One file per feature/page
7. **Use meaningful names** — `Button`, `Card`, `Modal`, not `Box`, `Wrapper`, `Comp`
8. **Group related components** — Typography, Layout, Forms, Interactions in same file
9. **Document complex configs** — Especially compound components and state mappings
10. **Use semantic HTML tags** — `section`, `article`, `header`, `footer`, `nav`, `main`, `aside`, `button`, `form`, `label`
11. **Leverage template literals ONLY for trivial components** — No variants, no states, no subs
12. **Test ARIA attributes** — Use accessibility testing tools to verify your `@semantic` + `@aria` declarations

### ❌ DON'T — Avoid Anti-Patterns

1. **NEVER use string "true"/"false" for boolean variants** — Use boolean `true`/`false`
   ```typescript
   // ❌ WRONG
   defaultVariants: { active: "false" }  // String!
   
   // ✅ CORRECT
   defaultVariants: { active: false }  // Boolean
   ```

2. **NEVER pass string values to boolean props** — Use boolean expressions
   ```typescript
   // ❌ WRONG
   <Button active="true" />
   <Button active={isActive ? "true" : "false"} />
   
   // ✅ CORRECT
   <Button active={true} />
   <Button active={isActive} />
   ```

3. **Don't mix variant types** — Use boolean for toggles, string for named states, number for levels
3. **Don't hardcode ARIA attributes in JSX** — Declare in component config so they're consistent
4. **Don't forget to bind states to ARIA** — Use `@state` mapping so props automatically update aria-*
5. **Don't repeat classes across components** — Extract to a styled component immediately
6. **Don't mix styling patterns** — Pick object-config OR template literals per component, not both
7. **Don't use generic class names** — `Box`, `Div`, `Flex` — embrace semantic naming
8. **Don't hardcode colors** — Use Tailwind's theme variables (`text-[var(--foreground)]`)
9. **Don't put all components in one file** — Organize by feature (one styles.ts per page/feature)
10. **Don't skip accessibility** — Every interactive component needs `@semantic` + `@aria`
11. **Don't use arbitrary values excessively** — Stick to Tailwind scale unless absolutely necessary
12. **Don't assume server-only components work in browser** — Mark with `tw.server.` and test

## Migration Guide: Template Literal → Object Config

For existing components, use this upgrade path:

```typescript
// BEFORE (template literal — limited)
const Button = tw.button`px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700`

// AFTER (object config — full features)
const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition-all",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300"
    },
    size: { sm: "text-sm px-3 py-1", md: "text-base px-4 py-2" }
  },
  defaultVariants: { intent: "primary", size: "md" },
  states: { loading: "opacity-60 cursor-wait" },
  sub: { icon: "w-4 h-4 mr-2" },
  '@semantic': 'button',
  '@aria': { role: 'button' }
})
```

## File Organization

### Pattern: styles.ts per folder

```
learn/dasar-css/box-model/
  ├── page.tsx          # Just imports & renders components
  └── styles.ts         # ALL styled components (using object-config)
  
learn/advandced/anchor-positioning/
  ├── page.tsx          # Minimal JSX — just composition
  └── styles.ts         # AnchorDemo, AnchorTarget, AnchorPopup, etc.
```

### Example styles.ts structure (RECOMMENDED)

```typescript
// styles.ts
import { tw } from "tailwind-styled-v4"

// ==== LAYOUT SHELL ====
export const Page = tw.div({
  base: "min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans",
  sub: {
    topbar: "sticky top-0 z-50 h-12 bg-white border-b",
    body: "max-w-5xl mx-auto px-4 py-10 flex gap-10",
    content: "flex-1 min-w-0",
    sidebar: "w-64 shrink-0"
  }
})

// ==== TYPOGRAPHY ====
export const PageTitle = tw.h1`text-3xl font-bold tracking-tight mb-2`
export const Section = tw.section`scroll-mt-20 mb-10`

// ==== INTERACTIVE ====
export const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition-all",
  variants: { /* ... */ },
  '@semantic': 'button',
  '@aria': { role: 'button' }
})

// ==== FORMS ====
export const Input = tw.input({
  base: "w-full px-3 py-2 border border-gray-300 rounded-lg",
  '@aria': { 'aria-label': 'Input field' }
})

// ==== COMPOUND COMPONENTS ====
export const Card = tw.div({
  base: "bg-white rounded-xl shadow-md",
  sub: {
    header: { /* ... */ },
    footer: { /* ... */ }
  }
})
```

### Example page.tsx structure (MINIMAL)

```typescript
// page.tsx
import { tw } from "tailwind-styled-v4"

// Shell
export const Page = tw.div`min-h-screen bg-slate-50`
export const TopBar = tw.nav`sticky top-0 z-50 h-12 bg-white`
export const Body = tw.div`max-w-5xl mx-auto px-4 py-10`
export const Content = tw.main`flex-1`
export const Sidebar = tw.aside`w-64`

// Typography
export const Title = tw.h1`text-3xl font-bold`
export const Subtitle = tw.h2`text-xl font-semibold`
export const Text = tw.p`text-sm leading-relaxed`

// Components
export const Card = tw.div({
  base: "bg-white rounded-xl shadow-md p-6",
  variants: { /* ... */ }
})

// Buttons
export const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium",
  variants: { /* ... */ }
})
```

### Example page.tsx structure (MINIMAL)

```typescript
// page.tsx
"use client"
import { useState } from "react"
import {
  Page, Section, Title, Text, Card, Button, Form
} from "./styles"

export default function FeaturePage() {
  const [state, setState] = useState("")

  return (
    <Page>
      <Page.topbar>Navigation</Page.topbar>
      <Page.body>
        <Page.content>
          <Title>Page Title</Title>
          <Section>
            <Text>Description goes here</Text>
            <Card>
              <Card.header>Section Title</Card.header>
              <Card.body>
                <Form>
                  {/* Form content */}
                </Form>
              </Card.body>
              <Card.footer layout="horizontal">
                <Button intent="secondary">Cancel</Button>
                <Button intent="primary" onClick={() => setState("saved")}>
                  Save Changes
                </Button>
              </Card.footer>
            </Card>
          </Section>
        </Page.content>
        <Page.sidebar>
          {/* Sidebar content */}
        </Page.sidebar>
      </Page.body>
    </Page>
  )
}
```

## Complete API Export Map

All available APIs from `tailwind-styled-v4`:

```typescript
// === CORE COMPONENT FACTORY ===
export { tw, server }                // Main tw API + server-only variant
export { createComponent }            // Low-level component creator
export type { TwObject, TwStyledComponent, TwTagFactory }

// === VARIANT RESOLUTION ===
export { cv }                         // Class variant resolver (type-safe)
export { registerVariantTable }       // Register pre-computed variant tables

// === CLASS MERGING & JOINING ===
export { cn, cx }                     // cn=join, cx=conflict-aware merge
export { twMerge, createTwMerge }    // Advanced merging with custom rules
export { mergeWithRules }             // Merge with custom conflict rules

// === STYLED UTILITIES ===
export { styled, resolveStyledClassName }  // Low-level variant resolution

// === DESIGN SYSTEM ===
export { createStyledSystem }         // Design system factory with tokens
export type { StyledSystemConfig, StyledSystemInstance }

// === REACTIVE TOKENS ===
export { liveToken, createUseTokens, setToken, getToken, getTokens }
export { subscribeTokens, tokenVar, tokenRef }
export { applyTokenSet, generateTokenCssString }

// === THEME & CSS VARIABLES ===
export { createTheme, twVar, cssVar, t }
export { v4Tokens }

// === SUB-COMPONENTS ===
export { registerSubComponent, getSubComponent, getAllSubComponents, withSubComponents }

// === CONTAINER QUERIES ===
export { processContainer, generateContainerCss, getContainerRegistry }

// === STATE ENGINE ===
export { processState, generateStateCss, getStateRegistry }

// === NATIVE BINDINGS (Node.js only) ===
export { parseClassToken, parseTailwindClasses, parseThemeColors }
export { compileTheme, extractCssVars, detectDeadCode, classifyKnownClasses }
export { detectClassConflicts, normalizeThemeColor, sanitizeThemeColor, splitRgbaColor }

// === TYPES ===
export type { ComponentConfig, ContainerConfig, StateConfig }
export type { HtmlTagName, VariantProps, VariantValue }
export type { ParsedClass, ThemeConfig, LiveTokenSet, TokenMap }
```

## Key Takeaways

### Object Config is ALWAYS Better For:
- ✅ Components with **variants** (Button, Badge, Alert)
- ✅ Components with **states** (loading, disabled, error)
- ✅ Components with **sub-components** (Card, Tabs, Form)
- ✅ Components needing **ARIA attributes**
- ✅ **Any component used in multiple places**

### Template Literals ONLY For:
- ✅ Trivial utility classes (no variants, states, or subs)
- ⚠️ Style-only components with single responsibility
- ❌ Anything interactive or reusable

### ARIA Best Practice Pattern:
```typescript
const Component = tw.element({
  base: "...",
  '@semantic': 'component-type',      // Auto-role injection
  '@aria': { /* static attributes */ },
  '@state': { /* dynamic mappings */ },
  sub: { /* nested elements */ }
})
```

## References

- **Types**: `packages/domain/core/src/types.ts` (ComponentConfig, ARIA types)
- **Main API**: `packages/domain/core/src/twProxy.ts`
- **Component Creation**: `packages/domain/core/src/createComponent.ts`
- **Real Examples**: `examples/next-js-app/src/app/learn/dasar-css/box-model/styles.ts`
- **Advanced Examples**: `examples/next-js-app/src/app/learn/advandced/*/styles.ts`

---

**Last Updated**: July 3, 2026  
**Status**: Complete & Advanced  
**Recommended For**: All CSS-in-JS work with tailwind-styled-v4  
**Inclusion**: Manual (reference with #tailwind-styled-v4-guidelines.md)
