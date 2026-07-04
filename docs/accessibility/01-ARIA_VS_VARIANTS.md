# ARIA vs Variants: Clarification

**Question**: ARIA buat apa? Kan ada variant untuk handle visual states?

**Answer**: ARIA dan Variants adalah **dua layer berbeda** yang bekerja bersama!

---

## The Difference

### Variants = Visual/Behavioral States
```typescript
export const Button = tw.button({
  base: "px-4 py-2 rounded-lg",
  variants: {
    intent: {
      primary: "bg-blue-500 text-white",
      secondary: "bg-gray-200 text-gray-800",
    },
    size: {
      sm: "px-2 py-1 text-sm",
      lg: "px-6 py-3 text-lg",
    },
  },
})

// Usage — **Visual** styling
<Button intent="primary" size="lg">Click me</Button>
// → Rendered: blue background, large size
```

### ARIA = Semantic/Accessibility Information
```typescript
export const Button = tw.button({
  '@semantic': 'button',
  '@aria': {
    role: 'button',
    'aria-pressed': 'false',  // Toggle state for screen readers
  },
})

// Usage — **Semantic** meaning
<Button aria-pressed={isPressed} onClick={toggle}>
  Toggle feature
</Button>
// → Screen reader hears: "Toggle feature button, pressed state: false"
```

---

## Example: Toggle Button

### ❌ Variants Only (Visual but Not Accessible)
```typescript
export const ToggleButton = tw.button({
  variants: {
    active: {
      true: "bg-blue-500",      // ← Visual indicator
      false: "bg-gray-200",     // ← No semantic meaning
    },
  },
})

// Problem: Screen reader doesn't know it's a toggle!
<ToggleButton active={isActive} onClick={toggle}>
  Dark Mode
</ToggleButton>
// Screen reader says: "Dark Mode button" ← No indication of toggle state!
```

### ✅ Variants + ARIA (Visual + Accessible)
```typescript
export const ToggleButton = tw.button({
  variants: {
    active: {
      true: "bg-blue-500",
      false: "bg-gray-200",
    },
  },
  '@semantic': 'button',
  '@aria': {
    role: 'button',
  },
  '@state': {
    active: 'aria-pressed',  // ← Map active state to aria-pressed
  },
})

// Usage
<ToggleButton active={isActive} onClick={toggle} aria-pressed={isActive}>
  Dark Mode
</ToggleButton>
// Screen reader says: "Dark Mode button, toggle button, pressed"
// ← Screen reader user now knows it's a toggle AND current state!
```

---

## When to Use Each

### Use Variants For:
- Visual styling (colors, sizes, spacing)
- Layout variations (icon positions, flex directions)
- Different component appearances
- User preference styles

**Example**:
```typescript
variants: {
  size: { sm, md, lg },
  color: { primary, secondary, danger },
  alignment: { left, center, right },
}
```

### Use ARIA For:
- Semantic role information
- State information (pressed, checked, expanded)
- Accessibility hints (label, description)
- Live region updates
- Keyboard behavior hints

**Example**:
```typescript
'@aria': {
  role: 'tablist',
  'aria-label': 'Navigation tabs',
  'aria-live': 'polite',
}
```

---

## Real-World Scenario: Form Input

### Component Definition
```typescript
export const FormInput = tw.input({
  variants: {
    size: {
      sm: "px-2 py-1 text-sm",
      md: "px-3 py-2 text-base",
      lg: "px-4 py-3 text-lg",
    },
    error: {
      true: "border-red-500 bg-red-50",
      false: "border-gray-300",
    },
  },
  '@semantic': 'input',
  '@aria': {
    role: 'textbox',
    'aria-invalid': 'false',  // Will be toggled by @state
  },
  '@state': {
    error: 'aria-invalid',    // error variant → aria-invalid
    disabled: 'aria-disabled',
  },
})
```

### Usage in Form
```typescript
// Visual styling via **variants**
// Semantic info via **ARIA**
<FormInput
  size="md"           // ← Variant: visual size
  error={hasError}    // ← Variant: visual error indicator
  aria-label="Email" // ← ARIA: screen reader label
  aria-describedby={helpTextId}  // ← ARIA: help text reference
  aria-invalid={hasError}  // ← ARIA: error state for assistive tech
/>
```

**Result**:
- ✅ **Sighted users**: See medium-sized input, red border if error
- ✅ **Screen reader users**: Hear "Email text box, invalid" + help text

---

## Layering Model

```
┌─────────────────────────────────────────────────┐
│ Component Visual Appearance (Variants)          │
│ - Size, color, spacing, layout                  │
│ - Rendered via CSS classes                      │
└─────────────────────────────────────────────────┘
           ↓ (runs on top of)
┌─────────────────────────────────────────────────┐
│ Semantic/Accessibility Layer (ARIA)             │
│ - Role, state, hints for assistive tech         │
│ - Exposed to accessibility tree                 │
└─────────────────────────────────────────────────┘
           ↓ (used by)
┌─────────────────────────────────────────────────┐
│ Assistive Technology (Screen Readers, etc.)     │
│ - Conveys meaning to users with disabilities    │
└─────────────────────────────────────────────────┘
```

---

## Why Both Matter

### Without Variants (ARIA only)
```typescript
// ✅ Accessible to screen readers
// ❌ Ugly for sighted users
<Button role="button" aria-pressed="false">
  No styling!
</Button>
```

### Without ARIA (Variants only)
```typescript
// ✅ Pretty for sighted users
// ❌ Inaccessible to screen readers
<Button primary large>
  Screen reader can't tell it's a toggle!
</Button>
```

### With Both (Recommended)
```typescript
// ✅ Pretty for everyone
// ✅ Accessible for everyone
<Button intent="primary" size="large" role="button" aria-pressed="false">
  Perfect!
</Button>
```

---

## Component Example: Accessible Tabs

### Full Definition
```typescript
export const TabList = tw.div({
  '@semantic': 'tablist',
  '@aria': {
    role: 'tablist',
    'aria-label': 'Content tabs',
  },
})

export const Tab = tw.button({
  variants: {
    active: {
      true: "border-b-2 border-blue-500 text-blue-600",
      false: "border-b-2 border-transparent text-gray-600",
    },
  },
  '@semantic': 'tab',
  '@aria': {
    role: 'tab',
  },
  '@state': {
    active: 'aria-selected',  // active variant → aria-selected
  },
})

export const TabPanel = tw.div({
  '@semantic': 'tabpanel',
  '@aria': {
    role: 'tabpanel',
  },
})
```

### Usage
```typescript
<TabList>
  {/* Variant handles visual active state (blue border) */}
  {/* ARIA handles semantic active state (aria-selected) */}
  <Tab active={activeTab === 'home'} aria-selected={activeTab === 'home'}>
    Home
  </Tab>
  <Tab active={activeTab === 'about'} aria-selected={activeTab === 'about'}>
    About
  </Tab>
</TabList>

<TabPanel role="tabpanel" aria-labelledby="tab-home">
  Home content
</TabPanel>
```

**Result**:
- ✅ Sighted user: Sees active tab with blue border
- ✅ Screen reader user: Hears "Home tab, selected" + tab role

---

## Summary

| Aspect | Variants | ARIA |
|--------|----------|------|
| Purpose | Visual styling | Semantic meaning |
| User | Sighted users | Screen reader users |
| Example | `size: { sm, md, lg }` | `role: 'tab'` |
| Example | `color: { primary }` | `aria-pressed: 'true'` |
| Rendered | CSS classes | HTML attributes |
| Impact | Visual appearance | Accessibility tree |

---

## Best Practice

### Always Use Both Together:

```typescript
// ❌ Don't do variants only
<Button primary large>Click me</Button>

// ✅ Do variants + ARIA
<Button 
  intent="primary" 
  size="large"
  role="button"
  aria-pressed={isPressed}
>
  Click me
</Button>
```

---

## ARIA in tailwind-styled-v4

### Why We Add ARIA Support:

1. **Makes accessibility easier** - `@semantic` + `@state` automate ARIA
2. **Type-safe** - ComponentConfig now knows about ARIA
3. **Automatic** - Plugin can pre-compute ARIA at build-time
4. **No overhead** - Zero runtime cost (all build-time)

### Example:
```typescript
export const Button = tw.button({
  variants: {
    state: {
      pressed: "bg-blue-500",
      unpressed: "bg-gray-200",
    },
  },
  '@semantic': 'button',
  '@state': {
    state: 'aria-pressed',  // Automatically map state → aria-pressed
  },
})

// Result: When state="pressed", aria-pressed is auto-set to true
```

---

## Conclusion

**Variants** and **ARIA** are **complementary**, not competing:

- Variants = "How it looks"
- ARIA = "What it means"

Both are **essential** untuk mencapai **true accessibility**. Wave 3 (ARIA Injection) membuat keduanya mudah digunakan bersama di tailwind-styled-v4!

---

**Takeaway**: Gunakan variants untuk visual, gunakan ARIA untuk semantic. Keduanya together = accessible + beautiful component! ✅
