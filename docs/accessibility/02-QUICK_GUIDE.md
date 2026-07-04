# Quick ARIA Guide for tailwind-styled-v4

**TL;DR**: Variants = visual, ARIA = semantic. Use both together.

---

## Why ARIA?

Screen readers don't see CSS or visual styling. They need semantic HTML attributes to understand component meaning.

**Example**: 
```typescript
// Visual: User sees blue button
// Semantic: Screen reader hears "button"

// Visual + ARIA:
// - User: Sees blue toggle button (variant)
// - Screen reader: Hears "toggle button, pressed state: false" (ARIA)
```

---

## Quick Syntax

### Semantic Type
```typescript
'@semantic': 'button'  // or 'link', 'tab', 'checkbox', etc.
```

### ARIA Attributes
```typescript
'@aria': {
  role: 'button',
  'aria-label': 'My button',
}
```

### State Mapping
```typescript
'@state': {
  active: 'aria-pressed',      // active variant → aria-pressed="true"
  disabled: 'aria-disabled',   // disabled variant → aria-disabled="true"
}
```

---

## Common Pattern

```typescript
export const Button = tw.button({
  base: "px-4 py-2 rounded",
  
  // Visual variations
  variants: {
    intent: {
      primary: "bg-blue-500",
      secondary: "bg-gray-200",
    },
  },
  
  // Semantic info for accessibility
  '@semantic': 'button',
  '@aria': { role: 'button' },
  '@state': { disabled: 'aria-disabled' },
})
```

---

## Common Components

### Button
```typescript
'@semantic': 'button',
'@aria': { role: 'button' }
'@state': { disabled: 'aria-disabled' }
```

### Toggle Button
```typescript
'@semantic': 'button',
'@aria': { role: 'button' },
'@state': { active: 'aria-pressed' }
```

### Tab
```typescript
'@semantic': 'tab',
'@aria': { role: 'tab' },
'@state': { active: 'aria-selected' }
```

### Checkbox
```typescript
'@semantic': 'checkbox',
'@aria': { role: 'checkbox' },
'@state': { checked: 'aria-checked' }
```

### Input
```typescript
'@semantic': 'input',
'@aria': { role: 'textbox' },
'@state': { error: 'aria-invalid' }
```

---

## Usage Example

```typescript
// Define with semantic metadata
export const Button = tw.button({
  variants: { active: { true: "bg-blue", false: "bg-gray" } },
  '@semantic': 'button',
  '@state': { active: 'aria-pressed' }
})

// Use with both variant and ARIA
<Button 
  active={isActive}              // ← Variant (visual)
  aria-pressed={isActive}        // ← ARIA (semantic)
  onClick={toggle}
>
  Toggle
</Button>

// Result:
// - Visual: Blue/gray background based on active state
// - Semantic: Screen reader hears "Toggle button, pressed state: {isActive}"
```

---

## When to Use ARIA

✅ **Use ARIA for**:
- Button/toggle state (aria-pressed)
- Form validation (aria-invalid)
- Checkbox/radio state (aria-checked)
- Dropdown/menu state (aria-expanded)
- Tab state (aria-selected)
- Disabled state (aria-disabled)
- Loading state (aria-busy)
- Required fields (aria-required)

❌ **Don't Use ARIA for**:
- Visual styling (use variants instead)
- Colors, sizes, spacing
- Layout variations
- CSS pseudo-classes

---

## Accessibility Tree

```
Sighted User:
  "See": Blue button with text "Toggle"

Screen Reader User:
  "Hear": "Toggle, toggle button, pressed state false"

ARIA provides the "semantic meaning" that visual design can't convey.
```

---

## Build-Time Benefits

All ARIA is computed at build-time:
- ✅ Zero runtime overhead
- ✅ No JavaScript in bundle
- ✅ Pre-computed on page load
- ✅ Static, always correct

---

## Next Steps

1. Read: `docs/ACCESSIBILITY_GUIDE.md` for full guide
2. See: `examples/next-js-app/src/app/learn/high/accessibility-css/` for examples
3. Use: `@semantic`, `@aria`, `@state` in your components

---

**Remember**: Variants handle "how it looks", ARIA handles "what it means" 🎨 + ♿

Both together = accessible + beautiful! ✅
