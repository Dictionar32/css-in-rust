# Boolean, Number & String Variants — Type Safety Guide

**Status**: Active  
**Version**: 1.0  
**Applies to**: All `tw()` component definitions  
**Priority**: HIGH — Compile-time type safety  

---

## Quick Reference

### ✅ Correct Patterns

```typescript
// Boolean variant (for toggle states)
const Button = tw.button({
  variants: {
    disabled: { true: "opacity-50", false: "opacity-100" }
  },
  defaultVariants: { disabled: false }  // ✅ Boolean
})
<Button disabled={isLoading} />  // ✅ Boolean prop

// Number variant (for levels/priorities)
const Alert = tw.div({
  variants: {
    severity: { 0: "bg-blue", 1: "bg-yellow", 2: "bg-red" }
  },
  defaultVariants: { severity: 1 }  // ✅ Number
})
<Alert severity={2} />  // ✅ Number prop

// String variant (for named states)
const Badge = tw.span({
  variants: {
    status: { "success": "bg-green", "error": "bg-red" }
  },
  defaultVariants: { status: "success" }  // ✅ String
})
<Badge status="error" />  // ✅ String prop
```

### ❌ Common Mistakes

```typescript
// ❌ WRONG — String "false" for boolean variant
defaultVariants: { active: "false" }

// ❌ WRONG — Passing string to boolean prop
<Button active="true" />

// ❌ WRONG — Ternary that produces strings
<Button active={isLoading ? "true" : "false"} />

// ❌ WRONG — Missing type match
defaultVariants: { level: "1" }  // String! Should be number
```

---

## The Rule: Types Must Match

### Pattern 1: Boolean Variants

**When to use**: Toggle states, on/off, enabled/disabled, visible/hidden

**Definition**:
```typescript
const Component = tw.element({
  variants: {
    // Keys are boolean literals: true and false
    state: {
      true: "active-styles",
      false: "inactive-styles"
    }
  },
  // defaultVariants value must be boolean
  defaultVariants: { state: false }  // ✅ Boolean false
})
```

**Usage**:
```typescript
const [isActive, setIsActive] = useState(false)

// ✅ ALL CORRECT:
<Component state={true} />
<Component state={false} />
<Component state={isActive} />
<Component state={!isActive} />
<Component state={count > 0} />
<Component state={user?.verified ?? false} />

// ❌ ALL WRONG:
<Component state="true" />           // String
<Component state="false" />          // String
<Component state={true ? "true" : "false"} />  // Produces string
```

**Type Inference**:
```typescript
// TypeScript infers: state: boolean
// Prop accepts: true | false | undefined (with optional)
// ❌ Rejects: "true", "false", any string
```

### Pattern 2: Number Variants

**When to use**: Priority levels, severity codes, rating scales, numeric indices

**Definition**:
```typescript
const Component = tw.element({
  variants: {
    // Keys are numeric literals
    level: {
      0: "level-0-styles",
      1: "level-1-styles",
      2: "level-2-styles"
    }
  },
  // defaultVariants value must be number
  defaultVariants: { level: 0 }  // ✅ Number 0
})
```

**Usage**:
```typescript
const severity = 2

// ✅ ALL CORRECT:
<Component level={0} />
<Component level={1} />
<Component level={2} />
<Component level={severity} />
<Component level={Math.min(errors.length, 2)} />

// ❌ ALL WRONG:
<Component level="0" />    // String
<Component level="2" />    // String
<Component level={0 ? "1" : "0"} />  // Produces string
```

**Type Inference**:
```typescript
// TypeScript infers: level: 0 | 1 | 2
// Prop accepts: only 0, 1, or 2 (very strict!)
// ❌ Rejects: "0", "1", "2", any string
```

### Pattern 3: String Variants

**When to use**: Named states, theme names, button intents, semantic names

**Definition**:
```typescript
const Component = tw.element({
  variants: {
    // Keys are string literals
    variant: {
      "primary": "primary-styles",
      "secondary": "secondary-styles",
      "danger": "danger-styles"
    }
  },
  // defaultVariants value must be string
  defaultVariants: { variant: "primary" }  // ✅ String
})
```

**Usage**:
```typescript
const buttonIntent = "danger"

// ✅ ALL CORRECT:
<Component variant="primary" />
<Component variant="secondary" />
<Component variant="danger" />
<Component variant={buttonIntent} />

// ❌ ALL WRONG:
<Component variant={true} />      // Boolean
<Component variant={1} />         // Number
<Component variant={user?.role} /> // Could be undefined
```

**Type Inference**:
```typescript
// TypeScript infers: variant: "primary" | "secondary" | "danger"
// Prop accepts: only these exact strings (very strict!)
// ❌ Rejects: true, false, numbers, other strings
```

---

## Migration: Fixing Type Mismatches

### Scenario 1: String Default in Boolean Variant

**Before** (❌ Type Error):
```typescript
const Button = tw.button({
  variants: { active: { true: "...", false: "..." } },
  defaultVariants: { active: "false" }  // ❌ ERROR: string not boolean
})
```

**After** (✅ Fixed):
```typescript
const Button = tw.button({
  variants: { active: { true: "...", false: "..." } },
  defaultVariants: { active: false }  // ✅ Boolean false
})
```

### Scenario 2: String Values in JSX

**Before** (❌ Type Error):
```typescript
<Button active={isOpen ? "true" : "false"} />  // ❌ Strings
```

**After** (✅ Fixed):
```typescript
<Button active={isOpen} />  // ✅ Boolean prop
```

### Scenario 3: Number as String

**Before** (❌ Type Error):
```typescript
const Alert = tw.div({
  variants: { level: { 0: "...", 1: "..." } },
  defaultVariants: { level: "0" }  // ❌ String, not number
})
```

**After** (✅ Fixed):
```typescript
const Alert = tw.div({
  variants: { level: { 0: "...", 1: "..." } },
  defaultVariants: { level: 0 }  // ✅ Number 0
})
```

---

## Type Inference Examples

### Example 1: Multi-Variant Component

```typescript
const Button = tw.button({
  variants: {
    intent: {
      "primary": "bg-blue-600",
      "secondary": "bg-gray-200",
      "danger": "bg-red-600"
    },
    size: {
      "sm": "px-2 py-1",
      "md": "px-4 py-2",
      "lg": "px-6 py-3"
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed",
      false: "opacity-100 cursor-pointer"
    }
  },
  defaultVariants: {
    intent: "primary",    // ✅ String literal
    size: "md",           // ✅ String literal
    disabled: false       // ✅ Boolean
  }
})

// TypeScript infers full type safety:
// intent: "primary" | "secondary" | "danger"
// size: "sm" | "md" | "lg"
// disabled: boolean

// Usage
<Button intent="danger" size="lg" disabled={isLoading} />  // ✅ All correct
<Button intent={1} />  // ❌ Error: expected string
<Button disabled="true" />  // ❌ Error: expected boolean
```

### Example 2: Sub-Component Variants

```typescript
const Tabs = tw.div({
  base: "flex gap-4",
  sub: {
    trigger: {
      base: "px-4 py-2",
      variants: {
        active: {
          true: "border-b-2 border-blue-600 text-blue-600",
          false: "text-gray-600 hover:text-gray-900"
        }
      },
      defaultVariants: { active: false }  // ✅ Boolean
    },
    panel: {
      base: "p-4",
      variants: {
        hidden: {
          true: "hidden",
          false: "block"
        }
      },
      defaultVariants: { hidden: false }  // ✅ Boolean
    }
  }
})

// Usage
const [activeTab, setActiveTab] = useState(0)
<Tabs>
  <Tabs.trigger active={activeTab === 0} />
  <Tabs.trigger active={activeTab === 1} />
  <Tabs.panel hidden={activeTab !== 0} />
  <Tabs.panel hidden={activeTab !== 1} />
</Tabs>
```

---

## Why This Matters

### 1. Compile-Time Safety
```typescript
// ❌ Caught at build time (before shipping to users)
<Button active="true" />  // Type Error

// ✅ Runs correctly (no runtime surprises)
<Button active={true} />
```

### 2. IDE Support
- Autocomplete suggests correct type: `active={true | false}`
- Not: `active="true" | "false"` (magic strings)

### 3. Refactoring Confidence
```typescript
// Change variant type? Entire codebase gets checked:
// Before: active: { true: "...", false: "..." }
// After: active: { "on": "...", "off": "..." }
// Result: ❌ All JSX using true/false becomes error
// You fix it everywhere systematically
```

### 4. Better Semantics
```typescript
// Clear intent:
disabled={true}              // Boolean toggle
severity={2}                 // Numeric level
status="pending"             // Named state

// Confusing:
disabled="true"              // Magic string
severity="2"                 // Should be number?
```

---

## Checklist: Before Shipping Components

- [ ] All variants have matching type in `defaultVariants`
- [ ] Boolean variants use `true`/`false`, not `"true"`/`"false"`
- [ ] Number variants use numbers, not strings
- [ ] String variants use strings in both config and usage
- [ ] JSX passes correct type to each variant prop
- [ ] No ternary expressions that produce strings
- [ ] No conditional rendering with type mismatch
- [ ] IDE shows no type errors (red squiggles)
- [ ] `npx tsc --noEmit` passes with 0 errors

---

## Variant Type Reference Table

| Variant | Keys | Default | Usage | Example |
|---------|------|---------|-------|---------|
| Boolean | `true`, `false` | `false` | `<C active={bool} />` | `disabled` |
| Number | `0`, `1`, `2`, ... | `0` | `<C level={num} />` | `severity` |
| String | `"x"`, `"y"`, `"z"` | `"x"` | `<C mode="y" />` | `variant`, `size` |

---

## Real-World Example: Complete Component

```typescript
// ✅ CORRECT — All type-safe
const Dialog = tw.div({
  base: "fixed inset-0 z-50 bg-black/50 flex items-center justify-center",
  variants: {
    // Boolean: visible/hidden toggle
    open: {
      true: "opacity-100 pointer-events-auto",
      false: "opacity-0 pointer-events-none"
    },
    // Number: priority stacking
    zIndex: {
      10: "z-10",
      50: "z-50",
      100: "z-100"
    },
    // String: semantic position
    position: {
      "center": "items-center justify-center",
      "top": "items-start justify-center",
      "bottom": "items-end justify-center"
    }
  },
  defaultVariants: {
    open: false,           // ✅ Boolean
    zIndex: 50,            // ✅ Number
    position: "center"     // ✅ String
  },
  sub: {
    content: "bg-white rounded-lg shadow-xl p-6"
  }
})

// Usage — Type-safe!
const [isOpen, setIsOpen] = useState(false)
<Dialog open={isOpen} zIndex={100} position="center">
  <Dialog.content>Modal content</Dialog.content>
</Dialog>

// ❌ These would error:
<Dialog open="true" />           // String instead of boolean
<Dialog zIndex="50" />           // String instead of number
<Dialog position={1} />          // Number instead of string
```

---

## References

- Tailwind-styled-v4 Guidelines: `.kiro/steering/tailwind-styled-v4-guidelines.md`
- Type System: `packages/domain/core/src/types.ts`
- Example: `examples/next-js-app/src/app/learn/*/styles.ts`

---

**Last Updated**: July 4, 2026  
**Status**: Active & Essential  
**Enforcement**: TypeScript + IDE  

**TL;DR**: Match variant key types to `defaultVariants` types. Boolean keys → `false` or `true`. Number keys → numbers. String keys → strings.
