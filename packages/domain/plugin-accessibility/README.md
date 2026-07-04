# @tailwind-styled/plugin-accessibility

Build-time ARIA injection plugin untuk tailwind-styled-v4. Automatically injects ARIA attributes berdasarkan semantic component metadata.

## Features

- 🏗️ **Build-Time Only**: Zero runtime overhead
- ♿ **WCAG 2.1 Compliant**: Semantic ARIA mappings
- 🎯 **Automatic Inference**: Semantic tag → ARIA role
- 🔧 **Customizable**: Explicit @aria metadata support
- 🚫 **Non-Invasive**: Respects user-provided ARIA

## Installation

```bash
npm install @tailwind-styled/plugin-accessibility
```

## Usage

### Basic Setup

Annotate components dengan semantic metadata:

```typescript
import { tw } from 'tailwind-styled-v4'

const Button = tw.button({
  '@semantic': 'button',
  '@state': {
    disabled: 'aria-disabled',
    active: 'aria-pressed'
  }
})
```

### ARIA Injection

ARIA attributes automatically injected at build-time:

```typescript
// Generated component includes:
const computedAria = {
  role: 'button',
  'aria-pressed': false,
}

const mergedProps = { ...computedAria, ...props }
return <button {...mergedProps}>{children}</button>
```

### API Reference

#### getAriaRoleForTag

Get ARIA role untuk HTML tag:

```typescript
import { getAriaRoleForTag } from '@tailwind-styled/plugin-accessibility'

const role = getAriaRoleForTag('button') // 'button'
const navRole = getAriaRoleForTag('nav')  // 'navigation'
```

#### buildAriaAttributes

Build ARIA attributes object dari semantic type:

```typescript
import { buildAriaAttributes } from '@tailwind-styled/plugin-accessibility'

const attrs = buildAriaAttributes('button', {
  disabled: true,
  active: false
})
// { role: 'button', 'aria-disabled': 'true', 'aria-pressed': 'false' }
```

#### createAriaPlugin

Create plugin untuk build-time system:

```typescript
import { createAriaPlugin } from '@tailwind-styled/plugin-accessibility'

const plugin = createAriaPlugin({
  verbose: true,
  respectUserAria: true
})
```

## Semantic Types

| Semantic | HTML Tag | ARIA Role | ARIA Attributes |
|----------|----------|-----------|-----------------|
| `button` | `button` | `button` | `aria-pressed`, `aria-disabled` |
| `link` | `a` | `link` | - |
| `checkbox` | `input[type=checkbox]` | `checkbox` | `aria-checked`, `aria-disabled` |
| `radio` | `input[type=radio]` | `radio` | `aria-checked`, `aria-disabled` |
| `textbox` | `input`, `textarea` | `textbox` | `aria-readonly`, `aria-required` |
| `dialog` | `dialog` | `dialog` | `aria-modal`, `aria-labelledby` |
| `navigation` | `nav` | `navigation` | - |
| `heading` | `h1-h6` | `heading` | `aria-level` |

## State Mappings

Component states automatically map to ARIA properties:

```typescript
'@state': {
  'disabled': 'aria-disabled',
  'checked': 'aria-checked',
  'pressed': 'aria-pressed',
  'expanded': 'aria-expanded',
  'required': 'aria-required',
}
```

## Examples

### Button with Toggle State

```typescript
const ToggleButton = tw.button({
  '@semantic': 'button',
  '@state': {
    active: 'aria-pressed'
  }
})

// Usage
<ToggleButton active={isActive}>Toggle</ToggleButton>

// Generated (build-time):
// <button role="button" aria-pressed={props.active}>Toggle</button>
```

### Accessible Form Input

```typescript
const FormInput = tw.input({
  '@semantic': 'input',
  '@aria': {
    'aria-label': 'Enter text'
  },
  '@state': {
    required: 'aria-required',
    invalid: 'aria-invalid'
  }
})
```

### Navigation

```typescript
const Nav = tw.nav({
  '@semantic': 'navigation',
  '@aria': {
    'aria-label': 'Main navigation'
  }
})
```

## Zero Runtime Overhead

All ARIA injection happens at build-time:

1. Component metadata analyzed
2. ARIA attributes computed
3. Injected into component code
4. Generated code is 100% static

**No runtime imports, no runtime execution.**

## Configuration

### Strict Semantic

Require explicit @semantic annotation:

```typescript
const plugin = createAriaPlugin({
  requireExplicitSemantic: true
})
```

### Respect User ARIA

Don't override user-provided ARIA (default: true):

```typescript
const plugin = createAriaPlugin({
  respectUserAria: true
})
```

### Verbose Logging

Enable build-time logging:

```typescript
const plugin = createAriaPlugin({
  verbose: true
})
```

## WCAG Compliance

Generated ARIA follows W3C ARIA Authoring Practices Guide:

- Role assignment based on semantic intent
- State management via aria-* properties
- No conflicting ARIA combinations
- Proper heading hierarchy (aria-level)

## See Also

- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [tailwind-styled-v4](https://tailwind-styled.dev)
