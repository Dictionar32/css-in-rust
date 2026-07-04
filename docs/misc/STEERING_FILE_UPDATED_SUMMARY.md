# Steering File Update Summary

**Date**: July 3, 2026  
**File**: `.kiro/steering/tailwind-styled-v4-guidelines.md`  
**Status**: ✅ Complete and Advanced

## Changes Made

### 1. **Elevated to Advanced Coverage**
- Title changed to "Advanced" to reflect comprehensive scope
- Added explicit recommendation: **Object Config Syntax for 90% of components**
- Introduced priority-based best practices

### 2. **New Advanced Features Sections**

#### A. Sub-Components with Nested Variants
Shows how sub-components can have their own variants for deep customization:
```typescript
Card.actions (layout='vertical' spacing='loose')
```

#### B. ARIA Attributes — Full Accessibility Support
- Pattern 1: Static ARIA (`@aria` object)
- Pattern 2: Dynamic ARIA (`@state` mapping)
- Semantic components with auto-ARIA injection (`@semantic`)

Example:
```typescript
const Disclosure = tw.div({
  '@aria': { role: 'region' },
  '@state': { open: 'aria-expanded' }
})
```

#### C. Compound Component Patterns
Real-world example (Tabs with shared state):
- Multiple sub-components (list, trigger, panels, panel)
- Variant control on sub-components
- ARIA mappings for accessibility

### 3. **Object Config First Philosophy**
- Explicit comparison: Object Config vs Template Literals
- Clear recommendation: "Use object config for 90% of components"
- When to use template literals (only trivial components)
- Migration guide from template literals → object config

### 4. **Enhanced Best Practices**

**✅ DO** (Priority Order):
1. Use object-config for 90% of components
2. Start with `@semantic` + `@aria`
3. Use sub-components for related elements
4. Declare sub-component variants
5. Map states to ARIA with `@state`
... (12 total practices)

**❌ DON'T** (Avoid Anti-Patterns):
1. NEVER use inline `className=`
2. Don't use template literals for complex components
3. Don't hardcode ARIA attributes in JSX
4. Don't forget to bind states to ARIA
5. Don't repeat classes across components
... (12 total anti-patterns)

### 5. **Updated Common Patterns**

Pattern 1: **Page Layout** — Object Config with Sub-Components
```typescript
const Page = tw.div({
  base: "min-h-screen bg-slate-50",
  sub: {
    header: "...",
    body: "...",
    content: "...",
    sidebar: "..."
  }
})

<Page>
  <Page.header>...</Page.header>
  <Page.body>...</Page.body>
</Page>
```

Pattern 2: **Buttons** — Full Variants, States, Subs & ARIA
```typescript
const Button = tw.button({
  base: "...",
  variants: { intent: {...}, size: {...} },
  states: { loading: "...", fullWidth: "..." },
  sub: { icon: "...", text: "..." },
  '@semantic': 'button',
  '@aria': { 'aria-label': 'Action button' }
})
```

Pattern 3: **Cards** — Sub-Component Variants
```typescript
const Card = tw.div({
  sub: {
    header: { base: "...", variants: { featured: {...} } },
    footer: { base: "...", variants: { layout: {...} } }
  }
})

<Card>
  <Card.header featured>Title</Card.header>
  <Card.footer layout="horizontal">Actions</Card.footer>
</Card>
```

Pattern 4: **Form Controls** — ARIA & Sub-Components
```typescript
const FormGroup = tw.div({
  sub: {
    label: { '@aria': { 'aria-label': '...' } },
    input: {
      variants: { error: {...} },
      '@aria': { 'aria-invalid': 'error' }
    },
    error: "...",
    hint: "..."
  }
})
```

### 6. **File Organization Guidance**

**Recommended Structure**:
```
learn/feature/
├── page.tsx      # Minimal — imports & renders components only
└── styles.ts     # ALL styled components (using object-config)
```

**styles.ts Organization**:
```typescript
// ==== LAYOUT SHELL ====
export const Page = tw.div({ sub: { /* ... */ } })

// ==== TYPOGRAPHY ====
export const PageTitle = tw.h1`...`

// ==== INTERACTIVE ====
export const Button = tw.button({ /* ... */ })

// ==== FORMS ====
export const Input = tw.input({ /* ... */ })

// ==== COMPOUND COMPONENTS ====
export const Card = tw.div({ sub: { /* ... */ } })
```

### 7. **Key Takeaways Section**

Clear decision matrix:
- **Object Config is ALWAYS Better For**: Variants, states, sub-components, ARIA, reusable components
- **Template Literals ONLY For**: Trivial utility classes with single responsibility
- **ARIA Best Practice Pattern**: `@semantic` + `@aria` + `@state` mapping

## Content Metrics

- **Status**: Complete
- **Advanced Coverage**: ✅ ARIA attributes, sub-component variants, compound patterns
- **Examples**: 15+ comprehensive examples with ARIA and state mappings
- **Best Practices**: 12 DOs + 12 DON'Ts with priority ordering
- **Migration Guides**: Template Literal → Object Config with examples
- **Real-World Patterns**: Tabs, Forms, Buttons, Cards with sub-components

## Why This Matters

This steering file now provides **comprehensive guidance** for:
1. **Beginners** — Clear patterns and examples
2. **Intermediate** — Sub-components, variants, states
3. **Advanced** — ARIA mapping, accessibility first, compound patterns
4. **Team Standards** — Object Config as recommended pattern

The emphasis on **Object Config syntax** means:
- ✅ Better type safety (TypeScript inference)
- ✅ Better reusability (variants + states)
- ✅ Better accessibility (ARIA declarations)
- ✅ Better organization (sub-components)
- ✅ Better consistency (team standard)

## Next Steps

Users should:
1. Reference this steering file when creating new components
2. Use `object-config` for all non-trivial components
3. Declare `@semantic` + `@aria` on interactive elements
4. Test ARIA attributes with accessibility tools
5. Use sub-components for better organization

---

**Status**: ✅ Ready for Production Use  
**Last Updated**: July 3, 2026  
**Version**: 1.0 (Advanced)
