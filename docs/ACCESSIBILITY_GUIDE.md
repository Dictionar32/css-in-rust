# Accessibility Guide — tailwind-styled-v4

Panduan untuk membangun accessible components menggunakan tailwind-styled-v4 dengan build-time ARIA injection.

## Introduction

tailwind-styled-v4 includes build-time static ARIA attribute injection. Semua ARIA attributes di-compute pada build time dan di-inject ke component code—zero runtime overhead.

## WCAG 2.1 Compliance

Panduan ini aligned dengan WCAG 2.1 Level AA standards.

## Getting Started

### 1. Annotate Semantic Components

Tandai components dengan semantic metadata:

```typescript
import { tw } from 'tailwind-styled-v4'

const Button = tw.button({
  '@semantic': 'button',           // Semantic intent
  '@aria': { role: 'button' },     // Explicit ARIA (optional)
  '@state': {
    disabled: 'aria-disabled',     // State → ARIA property
    active: 'aria-pressed'
  }
})
```

### 2. ARIA Auto-Injection at Build Time

Build process automatically:
1. Analyzes semantic metadata
2. Computes ARIA attributes
3. Injects ke component code
4. Generates static output

```typescript
// Generated component (build-time):
const Button = (props) => {
  const computedAria = {
    role: 'button',
    'aria-pressed': false,
    'aria-disabled': false,
  }
  
  const mergedProps = { ...computedAria, ...props }
  return <button {...mergedProps}>{props.children}</button>
}
```

### 3. No Manual ARIA Management

User tidak perlu manually set ARIA attributes—semuanya automatic:

```typescript
// Just use like normal
<Button active={isActive} disabled={isDisabled}>
  Click me
</Button>

// ARIA automatically set based on state
// Equivalent to:
// <button 
//   role="button" 
//   aria-pressed={isActive} 
//   aria-disabled={isDisabled}
// >
```

## Semantic Component Types

### Button

```typescript
const Button = tw.button({
  '@semantic': 'button',
  '@state': {
    disabled: 'aria-disabled',
    active: 'aria-pressed'
  }
})

// Generated ARIA:
// role="button"
// aria-pressed={props.active}
// aria-disabled={props.disabled}
```

### Link

```typescript
const Link = tw.a({
  '@semantic': 'link',
  '@aria': {
    'aria-label': 'Navigate to page'
  }
})

// Generated ARIA:
// role="link"
// aria-label="Navigate to page"
```

### Form Input

```typescript
const TextInput = tw.input({
  '@semantic': 'input',
  '@aria': {
    'aria-label': 'Enter your name'
  },
  '@state': {
    required: 'aria-required',
    invalid: 'aria-invalid'
  }
})

// Generated ARIA:
// role="textbox"
// aria-label="Enter your name"
// aria-required={props.required}
// aria-invalid={props.invalid}
```

### Checkbox

```typescript
const Checkbox = tw.input({
  type: 'checkbox',
  '@semantic': 'checkbox',
  '@state': {
    checked: 'aria-checked',
    disabled: 'aria-disabled'
  }
})

// Generated ARIA:
// role="checkbox"
// aria-checked={props.checked}
// aria-disabled={props.disabled}
```

### Radio

```typescript
const RadioButton = tw.input({
  type: 'radio',
  '@semantic': 'radio',
  '@state': {
    checked: 'aria-checked',
    disabled: 'aria-disabled'
  }
})

// Generated ARIA:
// role="radio"
// aria-checked={props.checked}
// aria-disabled={props.disabled}
```

### Navigation

```typescript
const Nav = tw.nav({
  '@semantic': 'navigation',
  '@aria': {
    'aria-label': 'Main navigation'
  }
})

// Generated ARIA:
// role="navigation"
// aria-label="Main navigation"
```

### Heading

```typescript
const Heading = tw.h1({
  '@semantic': 'heading',
  '@aria': {
    'aria-level': '1'
  }
})

// Generated ARIA:
// role="heading"
// aria-level="1"
```

### Dialog

```typescript
const Dialog = tw.dialog({
  '@semantic': 'dialog',
  '@aria': {
    'aria-modal': 'true',
    'aria-labelledby': 'dialog-title'
  }
})

// Generated ARIA:
// role="dialog"
// aria-modal="true"
// aria-labelledby="dialog-title"
```

## Common Patterns

### Toggle Button

```typescript
const ToggleButton = tw.button({
  '@semantic': 'button',
  '@state': {
    active: 'aria-pressed'
  }
})

export function MyToggle() {
  const [active, setActive] = useState(false)
  
  return (
    <ToggleButton active={active} onClick={() => setActive(!active)}>
      {active ? 'On' : 'Off'}
    </ToggleButton>
  )
}

// Rendered with ARIA:
// <button role="button" aria-pressed={active}>
```

### Disabled Button

```typescript
const Button = tw.button({
  '@semantic': 'button',
  '@state': {
    disabled: 'aria-disabled'
  }
})

<Button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>

// With ARIA:
// <button aria-disabled={isLoading}>
```

### Form Field with Label

```typescript
const FormLabel = tw.label({})
const FormInput = tw.input({
  '@semantic': 'input',
  '@aria': {
    'aria-describedby': 'help-text'
  },
  '@state': {
    required: 'aria-required',
    invalid: 'aria-invalid'
  }
})

export function EmailField() {
  return (
    <>
      <FormLabel htmlFor="email">Email</FormLabel>
      <FormInput 
        id="email"
        type="email"
        required
        invalid={hasError}
      />
      <p id="help-text">Enter valid email address</p>
    </>
  )
}
```

### Accessible Tabs

```typescript
const TabList = tw.div({
  '@aria': {
    role: 'tablist',
    'aria-label': 'Content tabs'
  }
})

const Tab = tw.button({
  '@semantic': 'tab',
  '@state': {
    selected: 'aria-selected'
  }
})

const TabPanel = tw.div({
  '@aria': {
    role: 'tabpanel',
    'aria-labelledby': 'tab-1'
  }
})

export function Tabs() {
  const [active, setActive] = useState(0)
  
  return (
    <>
      <TabList>
        <Tab selected={active === 0} onClick={() => setActive(0)}>
          Tab 1
        </Tab>
        <Tab selected={active === 1} onClick={() => setActive(1)}>
          Tab 2
        </Tab>
      </TabList>
      
      <TabPanel id="tab-1" hidden={active !== 0}>
        Content 1
      </TabPanel>
      <TabPanel id="tab-2" hidden={active !== 1}>
        Content 2
      </TabPanel>
    </>
  )
}
```

### Alert Message

```typescript
const Alert = tw.div({
  '@semantic': 'alert',
  '@aria': {
    'aria-live': 'assertive',
    'aria-atomic': 'true'
  }
})

export function ErrorAlert({ message }) {
  return (
    <Alert role="alert">
      {message}
    </Alert>
  )
}

// Live region automatically announced to screen readers
```

## Best Practices

### 1. Always Annotate Interactive Elements

```typescript
// ✅ Good
const Button = tw.button({
  '@semantic': 'button'
})

// ❌ Bad - missing semantic annotation
const CustomButton = tw.div({
  onClick: handleClick
})
```

### 2. Map State to ARIA Properties

```typescript
// ✅ Good
const Checkbox = tw.input({
  type: 'checkbox',
  '@state': {
    checked: 'aria-checked'
  }
})

// ❌ Bad - state not mapped
const Checkbox = tw.input({
  type: 'checkbox'
})
```

### 3. Use Semantic HTML Tags

```typescript
// ✅ Good
const Button = tw.button({ '@semantic': 'button' })
const Link = tw.a({ '@semantic': 'link' })

// ❌ Bad - non-semantic elements
const Button = tw.div({ '@semantic': 'button' })
const Link = tw.span({ '@semantic': 'link' })
```

### 4. Respect User-Provided ARIA

```typescript
// ✅ Good - user ARIA takes precedence
<Button aria-label="Custom label">Action</Button>

// Component respects user-provided aria-label
```

### 5. Include Descriptive Labels

```typescript
// ✅ Good
<Button aria-label="Close dialog">×</Button>

// ❌ Bad - cryptic aria-label
<Button aria-label="X">×</Button>
```

## Testing Accessibility

### Manual Testing

1. **Keyboard Navigation**
   - Tab through interactive elements
   - Verify focus order

2. **Screen Reader**
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (macOS/iOS)

3. **Automated Tools**
   - axe DevTools
   - Wave
   - Lighthouse

### Code Example: Testing

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('button has correct ARIA attributes', () => {
  render(<Button active={true}>Toggle</Button>)
  
  const button = screen.getByRole('button')
  expect(button).toHaveAttribute('aria-pressed', 'true')
})

test('input shows required state', () => {
  render(<TextInput required />)
  
  const input = screen.getByRole('textbox')
  expect(input).toHaveAttribute('aria-required', 'true')
})
```

## Common Issues

### Issue: ARIA Role Not Applied

**Cause**: Missing `@semantic` annotation

```typescript
// ❌ Missing annotation
const MyButton = tw.button({})

// ✅ With annotation
const MyButton = tw.button({
  '@semantic': 'button'
})
```

### Issue: State Not Updating ARIA

**Cause**: State not mapped via `@state`

```typescript
// ❌ State not mapped
const Checkbox = tw.input({
  '@state': {
    checked: 'aria-checked'  // Missing this!
  }
})

// ✅ State properly mapped
const Checkbox = tw.input({
  '@state': {
    checked: 'aria-checked'
  }
})
```

### Issue: User ARIA Being Overridden

**Cause**: Plugin not respecting user ARIA (shouldn't happen with default settings)

```typescript
// User-provided aria-label should always win
<Button aria-label="My custom label">Action</Button>

// If not working, check plugin options
```

## Performance

Build-time ARIA injection has **zero runtime overhead**:

- ✅ No runtime imports
- ✅ No runtime computation
- ✅ All ARIA pre-computed at build time
- ✅ Generated code is 100% static

## Reference

- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)
- [WebAIM](https://webaim.org/)

## See Also

- [@tailwind-styled/plugin-accessibility](../packages/domain/plugin-accessibility/README.md)
- [Semantic Component Type Inference](../packages/domain/compiler/README.md#semantic-component-type-inference-build-time)
