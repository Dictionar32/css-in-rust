# Gap Analisis: Kekurangan Desain di Next.js App yang Bisa Di-Cover oleh tailwind-styled-v4

## Overview

File-file di `examples/next-js-app` sudah menggunakan `tw` dari tailwind-styled-v4, namun ada beberapa kekurangan desain/gap yang belum di-cover oleh fitur-fitur Wave 1-3:

---

## 1. **Semantic ARIA Injection Masih Manual**

### Current State (Kekurangan):

**File**: `accessibility-css/styles.ts` (dan file styles lainnya)

```typescript
// ❌ ARIA attributes harus diatur manual di component
export const AccordionTrigger = tw.button({
    base: "flex w-full items-center justify-between px-4 py-3 text-sm font-medium",
    variants: { dir: { prev: "items-start", next: "items-end" } },
})

// Usage di page:
// <AccordionTrigger aria-expanded={isOpen} aria-controls="content">
//   Trigger text
// </AccordionTrigger>
```

### Gap yang Teridentifikasi:

- **Problem**: Meskipun Wave 3 (ARIA Injection Plugin) sudah ada, component di next-js-app belum memanfaatkan metadata `@semantic`, `@aria`, `@state` untuk auto-inject ARIA attributes
- **Missing**: Tidak ada component yang menggunakan semantic metadata annotations untuk auto-generate type-safe ARIA

### Solusi (Future Enhancement):

```typescript
// ✅ Dengan Wave 3 ARIA Plugin (perlu diimplementasikan di component config)
export const AccordionTrigger = tw.button({
    base: "flex w-full items-center justify-between px-4 py-3 text-sm font-medium",
    '@semantic': 'dialog',  // atau 'accordion-trigger' custom
    '@aria': { role: 'tab' },
    '@state': { expanded: 'aria-expanded', disabled: 'aria-disabled' },
    variants: { dir: { prev: "items-start", next: "items-end" } },
})
// → ARIA attributes auto-injected saat build-time
```

---

## 2. **Type Safety untuk Event Handlers (Bugfix Spec)**

### Current State (Kekurangan):

**File**: Semua `.tsx` files yang menggunakan event handlers

```typescript
// ❌ Event parameter types masih loose (dari bugfix spec)
// Ini sudah diperbaiki di bugfix spec, tapi example belum di-update
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()  // Type-safe tapi manual annotation
}

// ✅ Setelah bugfix (event type inference) diterapkan:
const handleClick = (e) => {  // e automatically inferred as React.MouseEvent<HTMLButtonElement>
    e.preventDefault()  // Type-safe tanpa annotation
}
```

### Gap yang Teridentifikasi:

- **Problem**: File-file next-js-app belum memanfaatkan hasil bugfix spec (event type inference) sepenuhnya
- **Missing**: Contoh event handler yang menunjukkan type-safety improvement dari bugfix

### Solusi:

Update examples di next-js-app untuk showcase type-safe event handlers tanpa manual annotation.

---

## 3. **Type Generation Tidak Digunakan untuk Component Registry**

### Current State (Kekurangan):

**File**: `accessibility-css/styles.ts` dan semua styles files

```typescript
// ❌ Component config tidak generate type stubs
// Meski Wave 2 (Type Inference) ada, tidak digunakan di next-js-app
export const Button = tw.button({
    base: "px-4 py-2 rounded-lg font-medium",
    variants: { intent: { primary: "bg-blue-500", secondary: "bg-gray-500" } },
})

// Type definitions harus manual atau inferred dari tw() return type
```

### Gap yang Teridentifikasi:

- **Problem**: `semanticComponentAnalyzer` dan `typeGeneratorFromMetadata` dari Wave 2 tidak diintegrasikan ke build pipeline untuk next-js-app
- **Missing**: Auto-generated `.d.ts` files yang meng-expose semantic metadata + type definitions untuk components

### Solusi (Future Enhancement):

```typescript
// ✅ Setup Wave 2 type generation di next.config.ts
// atau tsup.config.ts untuk generate component type stubs
import { createTypeGenerationPlugin } from '@tailwind-styled/compiler'

// Build akan generate:
// - Button.d.ts dengan semantic information
// - Variant types automatically inferred
```

---

## 4. **No Polymorphic Type Safety (By Design - Wave 3 Polymorphism Docs)**

### Current State (Kekurangan):

**File**: `AccessibilityCssPage` component dan pattern yang ada

```typescript
// ❌ Polymorphic props dengan `as` tidak type-safe
const NavBtn = tw.a({
    base: "flex flex-col gap-0.5 px-4 py-3 rounded-xl",
    variants: { dir: { prev: "items-start", next: "items-end" } },
})

// Usage: dapat menggunakan as="button" tapi props tidak ter-narrow
// <NavBtn as="button" onClick={...} href="..." />  // ❌ href invalid untuk button
```

### Gap yang Teridentifikasi:

- **Problem**: Polymorphism sudah di-document di Wave 1.3 (Polymorphism Guide), tapi next-js-app belum showcase recommended patterns
- **Missing**: Contoh yang menunjukkan 3 recommended patterns dari `POLYMORPHISM_GUIDE.md`

### Solusi (Documentation/Pattern):

Update `accessibility-css/page.tsx` untuk showcase recommended patterns:
1. **Pattern 1**: Separate components per tag (Button vs Link)
2. **Pattern 2**: Conditional rendering dengan type guards
3. **Pattern 3**: Component wrapper dengan type-safe defaults

---

## 5. **Figma Design Token Sync CLI Tidak Diintegrasikan**

### Current State (Kekurangan):

**File**: Theme configuration di next-js-app

```typescript
// Theme tokens currently hardcoded
// ❌ Tidak ada integration dengan Figma untuk token sync
export const presets = {
    light: {
        // CSS variables manually defined
        colors: { accent: '#6366f1', ... }
    }
}
```

### Gap yang Teridentifikasi:

- **Problem**: Wave 1.1 (Figma Sync CLI) ada tapi tidak digunakan di next-js-app untuk pull/sync design tokens
- **Missing**: Setup documentation + example untuk `tw figma pull` workflow

### Solusi (Setup):

```bash
# Setup Figma sync di next-js-app
export FIGMA_TOKEN="..."
export FIGMA_FILE_KEY="..."

npm run tw figma pull              # Sync tokens dari Figma
npm run tw figma diff              # Lihat perubahan
npm run tw figma push --dry-run    # Push tokens back (preview)
```

---

## 6. **Theme Persistence Metadata Incomplete**

### Current State (Kekurangan):

**File**: `useTheme.ts` dan theme setup

```typescript
// Theme preferences stored di localStorage
// ❌ Metadata untuk semantic theme info tidak lengkap
export const presets = {
    light: { icon: '☀️', label: 'Light Mode', ... },
    dark: { icon: '🌙', label: 'Dark Mode', ... },
}
// Missing: @semantic, @aria metadata untuk theme selector component
```

### Gap yang Teridentifikasi:

- **Problem**: Theme component (`ThemeButton`) tidak menggunakan semantic metadata dari Wave 3 ARIA Injection
- **Missing**: `@semantic: 'button'`, `@aria: { role: 'button' }` metadata di theme-and-cart-controls component

---

## 7. **Build-Time Plugin System Not Utilized**

### Current State (Kekurangan):

**File**: `next.config.ts`

```typescript
// ❌ Plugin system dari Wave 2 tidak digunakan
// Build tidak memanfaatkan preComponent/postComponent hooks
export default defineConfig({
    // Existing Next.js + Tailwind config
    // No plugin registration for Wave 2 build-time plugins
})
```

### Gap yang Teridentifikasi:

- **Problem**: Build-time plugin system (Wave 2.4.3) sudah ada tapi tidak integrated ke next.config/tsup build
- **Missing**: Example plugin yang hook ke component code generation

### Solusi (Integration):

```typescript
// ✅ Setup build plugin di next.config.ts
const { withTailwindStyled } = require('@tailwind-styled/presentation/next')

module.exports = withTailwindStyled(nextConfig, {
    plugins: [
        // Wave 2 plugins
        { name: 'semantic-type-gen', ... },
        { name: 'aria-injection', ... },
    ]
})
```

---

## Summary: Gaps yang Teridentifikasi

| # | Gap | Wave | Status | Priority |
|---|-----|------|--------|----------|
| 1 | Semantic ARIA metadata tidak digunakan di components | Wave 3 | ❌ Not Used | HIGH |
| 2 | Event handler type inference contoh belum update | Bugfix | ⚠️ Partial | MEDIUM |
| 3 | Type generation tidak dijalankan untuk component registry | Wave 2 | ❌ Not Used | MEDIUM |
| 4 | Polymorphism patterns tidak showcase | Wave 1.3 | ⚠️ Documented | LOW |
| 5 | Figma sync CLI tidak integrated | Wave 1.1 | ❌ Not Used | LOW |
| 6 | Theme persistence metadata tidak semantic | Wave 3 | ❌ Not Used | LOW |
| 7 | Build-time plugin system not utilized | Wave 2 | ❌ Not Used | MEDIUM |

---

## Rekomendasi Tindakan

### High Priority:
1. **Add semantic metadata to next-js-app components** 
   - Update `accessibility-css/styles.ts` untuk menggunakan `@semantic`, `@aria`, `@state`
   - Showcase auto-injected ARIA attributes di page

### Medium Priority:
2. **Enable type generation in build pipeline**
   - Setup Wave 2 type generation di build config
   - Document `.d.ts` generation output

3. **Integrate build-time plugin system**
   - Register example plugins di build config
   - Document plugin lifecycle hooks

4. **Update event handler examples**
   - Showcase type-safe event handlers dari bugfix spec
   - Remove manual type annotations di example code

### Low Priority (Documentation Only):
5. **Document polymorphism patterns**
   - Link ke `POLYMORPHISM_GUIDE.md` dari accessibility page
   - Add section "Polymorphism in tw" dengan 3 patterns

6. **Integrate Figma sync workflow**
   - Add setup guide untuk `tw figma pull`
   - Document token sync workflow

---

## Files to Update for High Priority Gaps

```
examples/next-js-app/src/
├── app/
│   ├── learn/
│   │   ├── high/
│   │   │   ├── accessibility-css/
│   │   │   │   ├── styles.ts          ← Add @semantic, @aria, @state
│   │   │   │   └── page.tsx           ← Document semantic metadata usage
│   │   │   └── (other pages)
│   │   └── (other sections)
│   └── (other app structure)
├── components/
│   ├── theme-and-cart-controls.tsx   ← Add semantic metadata
│   └── (other components)
└── (other structure)

+ next.config.ts                        ← Enable type generation plugin
+ tsup.config.ts (if needed)           ← Register Wave 2 plugins
```

---

## Related Documentation

- **Wave 1.1**: `packages/infrastructure/cli/README.md` - Figma Sync CLI
- **Wave 1.3**: `docs/POLYMORPHISM_GUIDE.md` - Polymorphism patterns
- **Wave 2**: `packages/domain/compiler/README.md` - Type inference
- **Wave 2.4.3**: `packages/domain/plugin-api/` - Plugin system
- **Wave 3**: `docs/ACCESSIBILITY_GUIDE.md` - ARIA injection & semantic metadata
- **Bugfix**: `packages/domain/core/tests/` - Event type inference examples
