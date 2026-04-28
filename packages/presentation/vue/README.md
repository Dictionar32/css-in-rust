# @tailwind-styled/vue

Vue 3 adapter for tailwind-styled — create type-safe styled components with variants.

## Installation

```bash
npm install @tailwind-styled/vue vue
# or
yarn add @tailwind-styled/vue vue
# or
pnpm add @tailwind-styled/vue vue
```

> **Note:** `@tailwind-styled/vue` requires a native Rust binding. Ensure you have built the native module: `npm run build:rust` at the monorepo root, or install a prebuilt binary from npm.

## Basic Usage

### tw() — Create components with variants

```vue
<script setup lang="ts">
import { tw } from '@tailwind-styled/vue'

const Button = tw('button', {
  base: 'px-4 py-2 rounded font-medium transition-colors',
  variants: {
    intent: {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      danger: 'bg-red-500 text-white hover:bg-red-600',
      ghost: 'bg-transparent border border-gray-300',
    },
    size: {
      sm: 'h-8 text-sm px-3',
      md: 'h-10 text-base px-4',
      lg: 'h-12 text-lg px-6',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
  },
})
</script>

<template>
  <Button>Default</Button>
  <Button intent="danger">Delete</Button>
  <Button size="lg" intent="ghost">Large Ghost</Button>
</template>
```

### cv() — Class variant helper (framework-agnostic)

```ts
import { cv } from '@tailwind-styled/vue'

const buttonStyles = cv({
  base: 'px-4 py-2 rounded',
  variants: {
    size: { sm: 'h-8', lg: 'h-12' },
  },
  defaultVariants: { size: 'sm' },
})

// Returns 'px-4 py-2 rounded h-8'
const className = buttonStyles({ size: 'lg' })
```

### extend() — Extend existing components

```vue
<script setup lang="ts">
import { tw, extend } from '@tailwind-styled/vue'

const Button = tw('button', {
  base: 'px-4 py-2 rounded',
  variants: { intent: { primary: 'bg-blue-500' } },
})

// Create primary variant
const PrimaryButton = extend(Button, 'ring-2 ring-blue-300')
</script>

<template>
  <PrimaryButton intent="primary">Extended</PrimaryButton>
</template>
```

### Vue Plugin — Global composable

```ts
// main.ts
import { createApp } from 'vue'
import { TailwindStyledPlugin } from '@tailwind-styled/vue'
import App from './App.vue'

createApp(App).use(TailwindStyledPlugin).mount('#app')
```

```vue
<!-- In any component -->
<script setup lang="ts">
import { inject } from 'vue'

const tw = inject('tw')
const Button = tw('button', { base: 'bg-red-500' })
</script>
```

## API Reference

### tw(tag, config)

Create Vue component with Tailwind classes.

| Param | Type | Description |
|-------|------|-------------|
| tag | `HtmlTagName \| Component` | HTML tag or Vue component |
| config | `VueComponentConfig` | Base, variants, defaultVariants config |

### cv(config)

Returns a function that accepts props and returns class string.

### extend(component, extraClasses)

Extend component with additional classes.

## TypeScript

All components are type-safe with variants:

```ts
const Button = tw('button', {
  base: 'px-4 py-2',
  variants: {
    intent: { primary: 'bg-blue-500', danger: 'bg-red-500' },
  },
  defaultVariants: { intent: 'primary' },
})

// TypeScript knows valid variants
;(<Button intent="danger" />)
```

## Troubleshooting

### "Native binding is required but not available"
Ensure the native Rust module is built:
```bash
# From monorepo root
npm run build:rust
```
Or reinstall the package to fetch prebuilt binaries:
```bash
npm install @tailwind-styled/vue --force
```

### Variant not applied
Make sure variant key in `variants` matches the props passed to component.
