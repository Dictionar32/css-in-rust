# ⚠️ NO Inline Styles or className — Use tailwind-styled-v4 Only

**Status**: Mandatory  
**Applies to**: ALL `.tsx/.jsx` in project  
**Priority**: HIGH — Code quality, build-time optimization

## The Rule

❌ **JANGAN PERNAH GUNAKAN**:
```jsx
// ANTI-PATTERN 1: style={{}}
<div style={{ color: "red", padding: "1rem" }}>Content</div>
<AnchorPopup style={offsetMap[pos]}>Tooltip</AnchorPopup>

// ANTI-PATTERN 2: className=""
<div className="px-4 py-2 text-blue-600">Content</div>

// ANTI-PATTERN 3: Template strings
<div className={`px-4 ${isActive ? "bg-blue" : "bg-gray"}`}>Content</div>

// ANTI-PATTERN 4: cx/cn helpers (tempting, but breaks tw magic!)
<div className={cx("px-4", isActive && "bg-blue")}>Content</div>

// ANTI-PATTERN 5: Conditional classNames library
<div className={classnames("px-4", { "bg-blue": isActive })}>Content</div>
```

✅ **HANYA GUNAKAN**:
```jsx
// PATTERN 1: tw() dengan variants (RECOMMENDED)
const Button = tw.button({
  base: "px-4 py-2 rounded-lg",
  variants: {
    color: {
      red: "bg-red-500 text-white",
      blue: "bg-blue-500 text-white"
    }
  }
})

<Button color="red">Click me</Button>

// PATTERN 2: tw() dengan states
const Popup = tw.div({
  base: "fixed z-50 rounded-lg bg-white shadow-lg p-4",
  states: {
    isTop: "bottom-[calc(100%+8px)] left-[50%] translate-x-[-50%]",
    isBottom: "top-[calc(100%+8px)] left-[50%] translate-x-[-50%]",
    isLeft: "right-[calc(100%+8px)] top-[50%] translate-y-[-50%]",
    isRight: "left-[calc(100%+8px)] top-[50%] translate-y-[-50%]"
  }
})

<Popup isTop={pos === "top"} isBottom={pos === "bottom"} /* ... */>Content</Popup>

// PATTERN 3: tw.extend() untuk turunan
const PrimaryButton = Button.extend({
  variants: {
    size: {
      sm: "px-2 py-1 text-sm",
      lg: "px-6 py-3 text-lg"
    }
  }
})

<PrimaryButton color="blue" size="lg">Extended Button</PrimaryButton>

// PATTERN 4: Multiple styled components (sub-components)
const Card = tw.div({
  base: "bg-white rounded-xl shadow-md overflow-hidden",
  sub: {
    header: "px-6 py-4 border-b bg-gray-50",
    body: "px-6 py-4",
    footer: "px-6 py-3 border-t bg-gray-50"
  }
})

<Card>
  <Card.header>Title</Card.header>
  <Card.body>Content</Card.body>
  <Card.footer>Actions</Card.footer>
</Card>

// PATTERN 5: Dynamic prop via variants (NOT style object!)
const Tooltip = tw.div({
  base: "fixed z-[9999] px-2 py-1 rounded-md text-xs bg-gray-900 text-white",
  variants: {
    position: {
      top: "bottom-[calc(100%+8px)] left-[50%] translate-x-[-50%]",
      bottom: "top-[calc(100%+8px)] left-[50%] translate-x-[-50%]",
      left: "right-[calc(100%+8px)] top-[50%] translate-y-[-50%]",
      right: "left-[calc(100%+8px)] top-[50%] translate-y-[-50%]"
    }
  },
  defaultVariants: { position: "top" }
})

<Tooltip position={pos}>Tooltip content</Tooltip>

// PATTERN 6: Combining with @applying
const DynamicComponent = tw.div({
  base: [
    "px-4 py-2 rounded-lg",
    "[position-anchor:--my-anchor]",
    "[position-area:top]"
  ].join(" ")
})

// PATTERN 7: Using arbitrary values when needed
const SpecialBox = tw.div({
  base: "px-4 py-2 [font-weight:var(--font-weight,600)] [line-height:var(--line-height,1.5)]"
})
```

## WHY This Matters

### ❌ With inline styles/className

```jsx
function Playground() {
  const [pos, setPos] = useState("top")
  
  const offsetMap = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    // ... etc
  }

  return (
    // PROBLEM 1: No build-time optimization
    <div style={offsetMap[pos]}>Tooltip</div>
    
    // PROBLEM 2: style object re-created every render
    // PROBLEM 3: No type safety on keys
    // PROBLEM 4: CSS not extracted for CSS-in-JS
    // PROBLEM 5: SSR hydration mismatch risk
    // PROBLEM 6: Bundle size: style object included in JS
  )
}
```

**Performance Cost:**
- ❌ No CSS pre-generation
- ❌ Style object lives in JS (bloats bundle)
- ❌ Runtime style injection (slower)
- ❌ No CSSOM optimization
- ❌ Can't cache CSS rules

### ✅ With tailwind-styled-v4 variants

```jsx
const Tooltip = tw.div({
  base: "fixed z-50 px-2 py-1 rounded-md bg-gray-900 text-white text-xs",
  variants: {
    position: {
      top: "bottom-[calc(100%+8px)] left-[50%] translate-x-[-50%]",
      bottom: "top-[calc(100%+8px)] left-[50%] translate-x-[-50%]",
      left: "right-[calc(100%+8px)] top-[50%] translate-y-[-50%]",
      right: "left-[calc(100%+8px)] top-[50%] translate-y-[-50%]"
    }
  },
  defaultVariants: { position: "top" }
})

function Playground() {
  const [pos, setPos] = useState("top")
  
  return (
    // BENEFIT 1: Build-time CSS extraction
    // BENEFIT 2: Type-safe variant props
    // BENEFIT 3: No runtime style injection
    // BENEFIT 4: CSS cached at build time
    // BENEFIT 5: Deterministic output (same input = same CSS)
    // BENEFIT 6: Rust engine optimizations apply
    <Tooltip position={pos}>Tooltip</Tooltip>
  )
}
```

**Performance Win:**
- ✅ All CSS pre-generated at build time (~50ms Rust scan)
- ✅ CSS extracted to separate file (no JS bloat)
- ✅ Zero runtime overhead (just set attribute)
- ✅ CSSOM fully optimized
- ✅ Type-safe variant props
- ✅ Deterministic, reproducible output

---

## Migration Checklist

### Find Violations

```bash
# Search for inline styles
grep -r "style={{" examples/next-js-app/src --include="*.tsx" --include="*.jsx"

# Search for className=""
grep -r 'className="' examples/next-js-app/src --include="*.tsx" --include="*.jsx"

# Search for cx() or cn() helpers
grep -r "className={cx" examples/next-js-app/src --include="*.tsx" --include="*.jsx"
grep -r "className={cn" examples/next-js-app/src --include="*.tsx" --include="*.jsx"
```

### Fix Pattern

**BEFORE (WRONG):**
```jsx
function Modal({ isOpen, position }) {
  return (
    <div style={{
      display: isOpen ? "flex" : "none",
      position: "fixed",
      top: position.top,
      left: position.left,
      backgroundColor: "#fff",
      padding: "1rem",
      borderRadius: "0.5rem"
    }}>
      Modal content
    </div>
  )
}
```

**AFTER (RIGHT):**
```jsx
const Modal = tw.div({
  base: "flex flex-col items-start rounded-lg bg-white p-4 shadow-lg",
  states: {
    hidden: "hidden",
    visible: "flex"
  },
  sub: {
    title: "text-lg font-bold mb-4",
    body: "flex-1 w-full",
    footer: "mt-4 flex gap-2 justify-end"
  }
})

function ModalWrapper({ isOpen, position }) {
  const [pos, setPos] = useState(position)
  
  return (
    <Modal visible={isOpen}>
      <Modal.title>Title</Modal.title>
      <Modal.body>Content</Modal.body>
      <Modal.footer>
        <button>Cancel</button>
        <button>OK</button>
      </Modal.footer>
    </Modal>
  )
}
```

---

## Anti-Patterns to Avoid

### ❌ Pattern 1: Inline CSSProperties objects

```jsx
// WRONG
<div style={{ color: isError ? "red" : "black" }}>Message</div>

// RIGHT
const Message = tw.div({
  variants: {
    status: {
      error: "text-red-600",
      success: "text-green-600",
      warning: "text-yellow-600"
    }
  }
})

<Message status={status}>Message</Message>
```

### ❌ Pattern 2: className with inline ternaries

```jsx
// WRONG
<button className={isActive ? "px-4 py-2 bg-blue-600 text-white" : "px-4 py-2 bg-gray-200"}>
  Click
</button>

// RIGHT
const Button = tw.button({
  base: "px-4 py-2",
  variants: {
    state: {
      active: "bg-blue-600 text-white",
      inactive: "bg-gray-200"
    }
  }
})

<Button state={isActive ? "active" : "inactive"}>Click</Button>
```

### ❌ Pattern 3: cx() for class merging

```jsx
// WRONG
import { cx } from "classnames"

<div className={cx("px-4", "py-2", isActive && "bg-blue")}>Content</div>

// RIGHT
const Box = tw.div({
  base: "px-4 py-2",
  states: {
    active: "bg-blue-600"
  }
})

<Box active={isActive}>Content</Box>
```

### ❌ Pattern 4: Offset/position objects

```jsx
// WRONG (THIS IS THE BUG IN anchor-positioning/page.tsx!)
const offsetMap = {
  top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
  bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
  left: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
  right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }
}

<Tooltip style={offsetMap[pos]}>Content</Tooltip>

// RIGHT
const Tooltip = tw.div({
  base: "fixed z-50 px-2 py-1 rounded-md bg-gray-900 text-white",
  variants: {
    position: {
      top: "bottom-[calc(100%+8px)] left-[50%] -translate-x-2/4",
      bottom: "top-[calc(100%+8px)] left-[50%] -translate-x-2/4",
      left: "right-[calc(100%+8px)] top-[50%] -translate-y-2/4",
      right: "left-[calc(100%+8px)] top-[50%] -translate-y-2/4"
    }
  }
})

<Tooltip position={pos}>Content</Tooltip>
```

---

## Steering Integration

This rule is **part of the broader tailwind-styled-v4 guidelines**:

1. **Always use tailwind-styled-v4** (`tw()`)
2. **Never use inline styles** (`style={{}}`)
3. **Never use className=""** (except in special cases marked explicitly)
4. **Use variants** for all conditional styling
5. **Use states** for toggle-like behavior
6. **Use sub-components** for related elements
7. **Use ARIA attributes** in config (`@aria`, `@semantic`, `@state`)

---

## File Organization

Store all styled components in **`styles.ts`** per page/feature:

```
learn/dasar-css/box-model/
  ├── page.tsx      # Just imports & renders components
  └── styles.ts     # ALL styled components using tw()

learn/advandced/anchor-positioning/
  ├── page.tsx      # Minimal JSX
  └── styles.ts     # Popup, Tooltip, Demo, etc. all defined here
```

**page.tsx** should have ZERO inline `style={}` or `className=""`:

```jsx
// page.tsx — CLEAN
"use client"
import { useState } from "react"
import { Popup, Tooltip, Controls, Demo } from "./styles"

export default function Page() {
  const [pos, setPos] = useState("top")
  
  return (
    <Page>
      <Controls onPositionChange={setPos} />
      <Demo>
        <Tooltip position={pos}>Content</Tooltip>
      </Demo>
    </Page>
  )
}
```

```ts
// styles.ts — ALL STYLING
import { tw } from "tailwind-styled-v4"

export const Tooltip = tw.div({
  base: "fixed z-50 px-2 py-1 rounded-md bg-gray-900 text-white",
  variants: {
    position: {
      top: "bottom-[calc(100%+8px)] left-[50%] -translate-x-2/4",
      bottom: "top-[calc(100%+8px)] left-[50%] -translate-x-2/4",
      left: "right-[calc(100%+8px)] top-[50%] -translate-y-2/4",
      right: "left-[calc(100%+8px)] top-[50%] -translate-y-2/4"
    }
  }
})

export const Controls = tw.div({
  base: "flex gap-2 mb-4",
  sub: {
    btn: "px-3 py-1 rounded border hover:bg-gray-100"
  }
})

export const Demo = tw.div({
  base: "relative w-full h-64 border border-dashed border-gray-300 rounded-lg p-8"
})
```

---

## Git Hook Recommendation

Create pre-commit hook to catch violations:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for inline styles
if grep -r "style={{" src --include="*.tsx" --include="*.jsx" 2>/dev/null; then
  echo "❌ ERROR: Found inline styles (style={{}}). Use tailwind-styled-v4 instead!"
  exit 1
fi

# Check for className=""
if grep -r 'className="[^"]*p[xy]-\|px-\|py-\|text-\|bg-' src --include="*.tsx" --include="*.jsx" 2>/dev/null; then
  echo "❌ ERROR: Found inline className. Use tw() instead!"
  exit 1
fi

exit 0
```

---

## When You SEE a Violation

**Immediately:**
1. Mark with `// TODO: Convert to tw()` comment
2. Create issue or task
3. Don't commit the violation

**To fix:**
1. Extract all styles to `tw()` component
2. Move to `styles.ts`
3. Replace JSX with component usage
4. Test thoroughly

---

## Exceptions (RARE)

Only these are allowed:

### Exception 1: Third-party component

```jsx
// OK — wrapping external library
import { ExternalComponent } from "external-lib"

<ExternalComponent className="px-4" />  // Can't change external lib
```

### Exception 2: Explicit comment with reason

```jsx
// OK — with documented reason
<div style={{ "--custom-var": value } as React.CSSProperties}>
  {/* REASON: CSS variable must be dynamic, no way to do this with tw() currently */}
  Content
</div>
```

Mark clearly, don't hide!

---

## References

- **Steering**: `.kiro/steering/tailwind-styled-v4-guidelines.md`
- **Examples**: `examples/next-js-app/src/app/learn/*/styles.ts`
- **Product**: `.kiro/steering/product.md`

---

**Version**: 1.0.0  
**Created**: July 3, 2026  
**Status**: Active & Mandatory  
**Enforcement**: Code review + linting  

**TL;DR**: 🚫 `style={{}}` · 🚫 `className=""` · 🚫 `cx()` · ✅ `tw()` ONLY
