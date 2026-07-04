# Wave 5: Integration Guide untuk Next.js App

Panduan lengkap untuk mengintegrasikan Wave 1-3 features ke dalam `examples/next-js-app`.

---

## Overview Wave 5

Wave 5 adalah fase integrasi di mana semua fitur Wave 1-3 dimasukkan ke dalam example application. Tujuan:

- ✅ Showcase semantic metadata usage di components
- ✅ Enable type generation dalam build pipeline
- ✅ Register build-time plugins
- ✅ Document advanced patterns
- ✅ Cover semua design gaps dari Wave 1-3 features

---

## Task 7.1: Add Semantic Metadata to Components ✅

**Status**: Implemented

### Done:
- Updated `accessibility-css/styles.ts` dengan semantic metadata:
  - `FocusDemo` → `@semantic: 'button'`, `@aria: { role: 'button' }`, `@state: { disabled: 'aria-disabled' }`
  - `ContrastSwatch` → `@semantic: 'section'`, `@aria: { role: 'region' }`
  - `SrOnlyDemo` → `@semantic: 'aside'`, `@aria: { 'aria-label': 'Screen reader only' }`
  - `WcagBadge` → `@semantic: 'status'`, `@aria: { role: 'status' }`

### How It Works:

```typescript
// Semantic metadata di-define di component config
export const FocusDemo = tw.button({
    base: "px-4 py-2 rounded-lg text-sm font-medium border transition-all",
    // ...
    '@semantic': 'button',      // Wave 3: Semantic type
    '@aria': {                   // Wave 3: Explicit ARIA
        role: 'button',
    },
    '@state': {                  // Wave 3: State → ARIA mapping
        disabled: 'aria-disabled',
    },
})
```

Saat build-time:
1. **Semantic Component Analyzer** (Wave 2) extract `@semantic`, `@aria`, `@state` metadata
2. **ARIA Injection Plugin** (Wave 3) injects ARIA attributes berdasarkan metadata
3. Generated code includes ARIA pre-computed (zero runtime overhead)

### Test Semantic Metadata:

```bash
# Build next-js-app untuk verify semantic metadata
cd examples/next-js-app
npm run build

# Check generated CSS/JS untuk ARIA attributes
grep -r "aria-" dist/
```

---

## Task 7.2: Enable Type Generation in Build

**Status**: In Progress

### Setup Type Generation Plugin

Type generation berjalan as part of build pipeline via Wave 2 type generation plugin.

#### Option 1: Standalone Type Generation (Manual)

```bash
# Generate .d.ts files dari component configs
npm run generate:types

# Output akan di-save ke dist/types/
```

#### Option 2: Integrated in tsup (Recommended)

Mari kita integrate type generation ke next-js-app build pipeline:

```typescript
// examples/next-js-app/next.config.ts
import { withTailwindStyled } from "tailwind-styled-v4/next"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Wave 5: Enable semantic type generation
  experimental: {
    // Enable any experimental Next.js features if needed
  }
}

export default withTailwindStyled({
  routeCss: true,
  // Wave 5: Type generation config
  typeGeneration: {
    enabled: true,      // Enable type stub generation
    outputDir: './.next/types/tw',  // Where to output .d.ts
    includeMetadata: true,  // Include semantic metadata in types
  },
})(nextConfig)
```

### How Type Generation Works:

1. **Semantic Analyzer** reads component configs
2. Extracts `@semantic`, `@aria`, `@state` metadata
3. Generates `.d.ts` files dengan semantic information
4. `.d.ts` files di-include dalam TypeScript compilation

### Verify Type Generation:

```bash
cd examples/next-js-app

# Build dengan type generation
npm run build

# Check generated types
ls -la .next/types/tw/

# Verify TypeScript recognizes generated types
npx tsc --noEmit
```

---

## Task 7.3: Integrate Build-Time Plugin System

**Status**: Design Phase

### Register ARIA Injection Plugin

Build-time plugins register via plugin system. ARIA injection plugin adalah built-in dari Wave 3:

```typescript
// examples/next-js-app/next.config.ts (extended)
import { withTailwindStyled } from "tailwind-styled-v4/next"
import { ariaPlugin } from "@tailwind-styled/plugin-accessibility"
import { createTypeGenerationPlugin } from "@tailwind-styled/compiler"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
}

export default withTailwindStyled({
  routeCss: true,
  // Wave 5: Register build-time plugins
  plugins: [
    // Wave 3: ARIA injection plugin (high priority)
    {
      name: 'aria-injection',
      plugin: ariaPlugin({
        requireExplicitSemantic: false,  // Inject untuk semua semantic
        respectUserAria: true,           // Don't override user props
        verbose: false,
      }),
      priority: 100,  // Run early (pre-component phase)
    },
    
    // Wave 2: Type generation plugin
    {
      name: 'semantic-type-gen',
      plugin: createTypeGenerationPlugin({
        outputDir: './.next/types/tw',
        includeMetadata: true,
      }),
      priority: 90,  // Run after ARIA injection
    },
  ],
})(nextConfig)
```

### How Plugin System Works:

1. **Pre-Component Phase**: Plugins hook sebelum code generation
   - ARIA plugin injects ARIA attributes
   - Modify component config before rendering

2. **Post-Component Phase**: Plugins hook sesudah code generation
   - Type generator creates .d.ts files
   - Any cleanup/optimization

3. **Plugin Execution**: Priority-based ordering (higher = earlier)

---

## Task 7.4: Type-Safe Event Handlers (Bugfix Spec)

**Status**: Ready to Document

### Event Handler Type Inference

Wave Bugfix-10 (Event Type Inference) sudah provide type-safe event handlers tanpa manual annotation.

#### Before (Manual Annotation):

```typescript
// ❌ Event type annotation manual
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    console.log(e.currentTarget.value)
}

// Usage
<FocusDemo onClick={handleClick} />
```

#### After (Type Inference):

```typescript
// ✅ Event type inferred automatically
const handleClick = (e) => {  // e is React.MouseEvent<HTMLButtonElement>
    e.preventDefault()        // Type-safe!
    console.log(e.currentTarget.value)
}

// Usage
<FocusDemo onClick={handleClick} />  // Type-safe!
```

### Example in accessibility-css:

Update `accessibility-css/page.tsx` untuk showcase type-safe handlers:

```typescript
import { FocusDemo, ContrastSwatch } from './styles'

export default function AccessibilityCssPage() {
  // Type-safe event handlers (no manual annotation needed)
  const handleFocusDemoClick = (e) => {  // e: React.MouseEvent<HTMLButtonElement>
    e.preventDefault()
    console.log('Focus demo clicked')
  }

  const handleChipClick = (chip: string) => (e) => {
    e.currentTarget.setAttribute('aria-pressed', 'true')
    console.log(`Chip selected: ${chip}`)
  }

  return (
    <div>
      <FocusDemo onClick={handleFocusDemoClick}>
        Try Tab key to navigate
      </FocusDemo>
      
      <ContrastSwatch>
        {/* ... */}
      </ContrastSwatch>
    </div>
  )
}
```

### Document Type Inference:

Reference: `.kiro/specs/styled-component-event-type-inference/bugfix.md`

---

## Task 7.5: Document Polymorphism Patterns

**Status**: Ready

### 3 Recommended Polymorphism Patterns

Wave 1.3 documented polymorphism patterns di `docs/POLYMORPHISM_GUIDE.md`. 

Update `accessibility-css/page.tsx` untuk showcase patterns:

```typescript
// ─── Pattern 1: Separate Components per Tag ───────────────────────────────────
export const LinkButton = tw.a`
  px-4 py-2 rounded-lg font-medium border transition-all
  [&:hover]:border-accent
`  // Has href prop (type-safe)

export const ActionButton = tw.button`
  px-4 py-2 rounded-lg font-medium border transition-all
  [&:hover]:border-accent
`  // Has onClick prop (type-safe)

// ─── Pattern 2: Conditional Rendering ─────────────────────────────────────────
type ButtonLinkProps = 
  | { as: 'button'; onClick: () => void }
  | { as: 'a'; href: string }

export const ConditionalButton = ({ as, ...props }: ButtonLinkProps) => {
  if (as === 'button') {
    return <ActionButton {...props} />
  }
  return <LinkButton {...props} />
}

// ─── Pattern 3: Component Wrapper ─────────────────────────────────────────────
export const NavButton = tw.a`
  flex flex-col gap-0.5 px-4 py-3 rounded-xl border
`  // Default tag: 'a' (has href)

// Type-safe wrapper untuk override defaults
type NavButtonProps = React.ComponentProps<typeof NavButton> & {
  onClick?: () => void
}

export const NavButtonWrapper = ({ onClick, ...props }: NavButtonProps) => {
  if (onClick) {
    return <button onClick={onClick} {...props} />
  }
  return <NavButton {...props} />
}
```

---

## Task 7.6: Integrate Figma Token Sync

**Status**: Setup Only

Figma sync CLI (Wave 1.1) siap pakai. Setup untuk next-js-app:

### Setup Environment Variables

```bash
# .env.local (jangan commit!)
FIGMA_TOKEN=your_figma_personal_token
FIGMA_FILE_KEY=your_figma_file_key
```

### Example Workflow

```bash
# Pull tokens dari Figma
npm run tw figma pull --dry-run

# Lihat changes
npm run tw figma diff

# Push tokens back (preview)
npm run tw figma push --dry-run
```

### Document Setup:

Tambah section ke `examples/next-js-app/README.md`:

```markdown
## Figma Token Sync

Sync design tokens dari Figma ke codebase menggunakan CLI:

```bash
# Setup environment
export FIGMA_TOKEN=your_token
export FIGMA_FILE_KEY=your_file_key

# Pull tokens
npm run tw figma pull

# See changes
npm run tw figma diff
```

Reference: `packages/infrastructure/cli/README.md` - Figma Sync CLI
```

---

## Task 7.7: Add Semantic Metadata to Theme Component

**Status**: Ready

Update `theme-and-cart-controls.tsx` untuk include semantic metadata:

```typescript
import { tw } from "tailwind-styled-v4"
import { useTheme } from "@/hooks/useTheme"

// Wave 3: Semantic metadata untuk theme button
export const ThemeButton = tw.button({
  base: "h-9 w-9 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] hover:border-[var(--accent)] transition-colors flex items-center justify-center text-xs font-medium",
  variants: {
    theme: {
      light: "bg-yellow-100 text-yellow-700",
      dark: "bg-slate-800 text-slate-100",
      system: "bg-gray-400 text-white",
    },
  },
  defaultVariants: { theme: "light" },
  // Wave 3: Semantic metadata
  '@semantic': 'button',
  '@aria': {
    role: 'button',
    'aria-label': 'Toggle theme',
    'aria-pressed': 'false',  // Will be updated dynamically
  },
  '@state': {
    active: 'aria-pressed',
  },
})

export function ThemeAndCartControls() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex items-center gap-2">
      {/* Wave 3: Type-safe ARIA attributes */}
      <ThemeButton
        theme={theme as 'light' | 'dark' | 'system'}
        onClick={toggleTheme}
        // aria-pressed akan auto-managed oleh semantic metadata
        aria-label={`Current theme: ${theme}`}
      >
        {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '⚙️'}
      </ThemeButton>
    </div>
  )
}
```

---

## Wave 5 Verification Checklist

### Build & TypeScript
- [ ] `npm run build` completes successfully
- [ ] `npm run check:types` passes (zero type errors)
- [ ] `npm run lint` passes
- [ ] No `any` types di Wave 5 code

### Type Generation
- [ ] `.d.ts` files generated di build output
- [ ] Type stubs include semantic metadata
- [ ] `npx tsc --noEmit` passes

### Semantic Metadata
- [ ] Components use `@semantic`, `@aria`, `@state` annotations
- [ ] ARIA attributes auto-injected saat build-time
- [ ] Manual ARIA props tidak di-override

### Plugin System
- [ ] Build-time plugins register tanpa errors
- [ ] Plugin execution order correct (ARIA → Type Gen)
- [ ] Generated code includes plugin output

### Event Handlers
- [ ] Event handlers use type inference (no manual annotations)
- [ ] TypeScript validates event handler props

### Documentation
- [ ] All Wave 5 features documented
- [ ] Examples runnable and correct
- [ ] Links valid dan tidak broken

---

## Files Modified for Wave 5

```
examples/next-js-app/
├── src/
│   ├── app/
│   │   └── learn/
│   │       └── high/
│   │           ├── accessibility-css/
│   │           │   ├── styles.ts          ✅ Semantic metadata added
│   │           │   └── page.tsx           📝 Event handlers + patterns docs
│   │           └── (other)
│   ├── components/
│   │   └── theme-and-cart-controls.tsx    ✅ Theme semantic metadata
│   └── (other)
├── next.config.ts                         📝 Plugin registration (optional)
└── README.md                              📝 Figma setup guide

packages/domain/core/
└── src/
    └── types.ts                           ✅ ComponentConfig updated with @semantic/@aria/@state

docs/
├── WAVE5_INTEGRATION_GUIDE.md             ✅ This file
├── DESIGN_GAPS_NEXTJS_APP.md              ✅ Referenced
├── ACCESSIBILITY_GUIDE.md                 ✅ Referenced (Wave 3)
├── POLYMORPHISM_GUIDE.md                  ✅ Referenced (Wave 1.3)
└── NEW_FEATURES_BUILDTIME.md              ✅ Referenced (Waves 1-3 overview)
```

---

## Quick Start

### 1. Build with Wave 5 Features

```bash
cd /home/annas-zen/Documents/css-in-rust
npm run build

# Should complete with zero errors
```

### 2. Build Next.js App

```bash
cd examples/next-js-app
npm install --ignore-scripts
npm run build

# Verify semantic metadata was applied
grep -r "@semantic" src/
grep -r "aria-" dist/
```

### 3. Verify TypeScript

```bash
npm run check:types
# Should pass with zero errors
```

### 4. Run Smoke Tests

```bash
npm run test:smoke
# Should pass all tests
```

---

## References

- **Wave 1.1**: Figma Sync CLI — `packages/infrastructure/cli/README.md`
- **Wave 2**: Type Inference — `packages/domain/compiler/README.md`
- **Wave 3**: ARIA Injection — `docs/ACCESSIBILITY_GUIDE.md`
- **Bugfix-10**: Event Type Inference — `.kiro/specs/styled-component-event-type-inference/bugfix.md`
- **Polymorphism**: Patterns Guide — `docs/POLYMORPHISM_GUIDE.md`
- **Design Gaps**: Analysis — `docs/DESIGN_GAPS_NEXTJS_APP.md`

---

## Notes

- Semua Wave 5 features bersifat **build-time only** (zero runtime overhead)
- Semantic metadata di ComponentConfig adalah **optional** (backward compatible)
- ARIA injection **respects user-provided** props (tidak override)
- Type generation dapat di-enable/disable via config

---

**Wave 5 Status**: 🚀 Ready for Integration

Semua high-priority gaps dari Wave 1-3 siap di-cover di example app. Next steps: deploy ke example dan verify all features working.
