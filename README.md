<div align="center">

# tailwind-styled-v4

### ⚡ Rust-powered Tailwind CSS v4 untuk React
**Build-time compiler · Zero runtime overhead · RSC-aware · Next.js / Vite / Rspack**

[![npm](https://img.shields.io/npm/v/tailwind-styled-v4?color=blue)](https://npmjs.com/package/tailwind-styled-v4)
[![license](https://img.shields.io/npm/l/tailwind-styled-v4)](LICENSE)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange?logo=rust)](https://rust-lang.org)
[![Node](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org)
[![test](https://img.shields.io/badge/tests-84%2F86%20passing-brightgreen)](#)
[![bundle](https://img.shields.io/badge/runtime-~4.5kb-green)](https://bundlephobia.com/package/tailwind-styled-v4)

</div>

---

## Apa ini?

`tailwind-styled-v4` adalah library styling untuk React yang menggabungkan **DX styled-components** dengan **performa Tailwind CSS v4** dan **engine berbasis Rust**. Tulis komponen dengan `tw.button` atau `tw.div({ variants })` — compiler extract dan optimasi CSS di build time, bukan runtime.

**Perbandingan singkat:**

| | tailwind-styled-v4 | styled-components | Tailwind CSS biasa |
|---|---|---|---|
| Build-time CSS | ✅ | ❌ (runtime inject) | ✅ |
| Runtime overhead | ~0 | ~15KB | ~0 |
| Variants API | ✅ type-safe | terbatas | ❌ |
| SSR/RSC support | ✅ zero config | ⚠️ butuh ServerStyleSheet | ✅ manual |
| Hydration mismatch | ✅ tidak ada | ⚠️ hash bisa beda | ✅ tidak ada |
| DevTools readable | ✅ class name jelas | ❌ hash (`sc-abc123`) | ✅ |
| Engine | 🦀 Rust | JS | JS |
| Dark mode | ✅ `dark:` prefix | manual | ✅ |
| TypeScript | ✅ full inference | partial | ✅ |

---

## Instalasi

```bash
npm install tailwind-styled-v4

# Setup otomatis
npx tw setup
```

`npx tw setup` akan otomatis:
- Mendeteksi bundler (Next.js / Vite / Rspack)
- Meng-inject plugin ke `next.config.ts` / `vite.config.ts`
- Membuat `tailwind-styled.config.json` dengan CSS entry yang terdeteksi otomatis
- Menambahkan `@import "tailwindcss"` ke CSS entry
- Pre-warming scanner cache supaya dev pertama tidak cache miss

---

## Quick Start

### 1. Template Literal

```tsx
import { tw } from "tailwind-styled-v4"

const Button = tw.button`
  inline-flex items-center rounded-lg px-4 py-2
  bg-blue-600 text-white font-medium
  hover:bg-blue-700 transition
`

<Button onClick={handleClick}>Klik saya</Button>
```

### 2. Object Config + Variants

```tsx
const Button = tw.button({
  base: "inline-flex items-center rounded-full px-5 py-2 font-medium transition-all",
  variants: {
    intent: {
      primary:   "bg-foreground text-background hover:bg-[#383838]",
      secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
      outline:   "bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background",
      ghost:     "bg-transparent text-foreground hover:bg-gray-100",
    },
    size: {
      sm: "h-10 px-4 text-sm rounded-lg",
      md: "h-12 px-5 text-base rounded-full",
      lg: "h-14 px-6 text-lg rounded-full",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
  states: {
    loading:   "opacity-60 cursor-wait pointer-events-none",
    disabled:  "opacity-50 cursor-not-allowed",
    fullWidth: "w-full",
  },
})

// TypeScript tahu variant apa yang valid — autocomplete ✅
<Button intent="primary" size="lg">Submit</Button>
<Button intent="ghost">Batal</Button>
<Button intent="outline" size="sm">Edit</Button>
<Button loading>Memproses...</Button>
```

### 3. Sub-components

```tsx
const Card = tw.div({
  base: "rounded-xl bg-white shadow-md overflow-hidden",
  sub: {
    header:        "px-6 py-4 border-b font-semibold",
    main:          "px-6 py-4",
    footer:        "px-6 py-4 border-t text-sm text-gray-400",
    "div:action":  "px-6 py-4 flex gap-3",  // render <div>, akses Card.action
  },
  states: {
    selected: "ring-2 ring-blue-500",
    disabled: "opacity-50 pointer-events-none",
  },
})

// Penggunaan
<Card selected>
  <Card.header>Judul Card</Card.header>
  <Card.main>Konten card di sini.</Card.main>
  <Card.action>
    <Button>Lihat Detail</Button>
    <Button intent="ghost">Batal</Button>
  </Card.action>
  <Card.footer>Updated 2 hours ago</Card.footer>
</Card>
```

Format `"tag:name"` untuk sub-components — misalnya `"div:action"` render sebagai `<div>` dengan akses via `Card.action`. TypeScript otomatis strip prefix tag dari type inference.

### 4. `.extend()` — Inheritance

```tsx
const PrimaryButton = Button.extend`text-lg px-8`
const DangerButton = Button.extend({
  classes: "bg-red-600 hover:bg-red-700",
  defaultVariants: { intent: "primary" }
})
```

### 5. States — Boolean Props

```tsx
// states di-resolve via Rust bitmask lookup — O(1), tidak ada runtime overhead
const Badge = tw.span({
  base: "inline-flex px-2 py-1 rounded text-sm font-medium",
  states: {
    active:   "bg-green-100 text-green-800",
    warning:  "bg-yellow-100 text-yellow-800",
    error:    "bg-red-100 text-red-800",
  },
})

<Badge active>Online</Badge>
<Badge error>Error</Badge>
```

### 6. Dark Mode

Dark mode bekerja otomatis via `prefers-color-scheme` — tidak perlu konfigurasi tambahan:

```tsx
const Card = tw.div({
  base: "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100",
  sub: {
    header: "border-b border-gray-200 dark:border-gray-700",
  },
})
```

### 7. Compound Variants

```tsx
const Button = tw.button({
  base: "...",
  variants: {
    intent: { primary: "...", outline: "..." },
    size: { sm: "...", lg: "..." },
  },
  compoundVariants: [
    // Kalau intent=primary AND size=lg → tambah class ini
    { intent: "primary", size: "lg", class: "shadow-lg" },
  ],
})
```

### 8. .withSub — Strict TypeScript untuk Template Literals

```tsx
const Button = tw.button`
  flex h-12 px-5 rounded-full
  icon { flex h-4 w-4 }
  badge { absolute -top-1 -right-1 }
`.withSub<"icon" | "badge">()

Button.icon   // ✅ autocomplete
Button.badge  // ✅ autocomplete
Button.xyz    // ❌ TypeScript error
```

---

## Bagaimana CSS Di-generate?

Pipeline baru di v5 — tidak lagi pakai empty rules:

```
1. withTailwindStyled (Next.js startup)
   └─> scanWorkspace() via Rust scanner
         └─> ast_extract_classes() per file
               └─> extract semua classes dari variants, states, sub, base

2. generateCssForClasses(classes, globals.css)
   └─> Tailwind JS compile(globals.css, { loadStylesheet })
         └─> Tailwind baca @theme inline user (custom colors, fonts, dll)
               └─> Generate real CSS untuk semua classes
                     └─> LightningCSS post-process (production only)
                           └─> tulis .next/tw-classes/_initial-scan.css

3. globals.css: @source "../.next/tw-classes/**"
   └─> Tailwind scan class names dari _initial-scan.css
         └─> Generate CSS di bundle akhir
```

Hasilnya `_initial-scan.css` berisi real CSS (bukan empty rules):

```css
/* tw-classes: initial scan — auto-generated by withTailwindStyled */
@layer utilities {
  .bg-foreground {
    background-color: var(--foreground);
  }
  .text-foreground {
    color: var(--foreground);
  }
  .hover\:bg-foreground {
    &:hover {
      background-color: var(--foreground);
    }
  }
  /* ... */
}
```

Custom colors dari `@theme inline` di `globals.css` otomatis ter-generate — tidak perlu konfigurasi tambahan.

---

## Setup Next.js

### next.config.ts

```ts
import { withTailwindStyled } from "tailwind-styled-v4/next"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {}

export default withTailwindStyled({ verbose: true })(nextConfig)
```

### globals.css

```css
@import "tailwindcss";
@source "../.next/tw-classes/**";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

---

## Bundler Integration

### Vite

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tailwindStyled } from "tailwind-styled-v4/vite"

export default defineConfig({
  plugins: [react(), tailwindStyled()],
})
```

### Rspack

```js
import { defineConfig } from "@rspack/cli"
import { tailwindStyled } from "tailwind-styled-v4/rspack"

export default defineConfig({
  entry: "./src/index.ts",
  plugins: [tailwindStyled()],
})
```

---

## CLI

```bash
# Setup otomatis (detect bundler, patch config, pre-warm cache)
npx tw setup

# Verifikasi setup
npx tw preflight

# Analisis workspace
npx tw audit

# Benchmark performa
npx tw benchmark
```

---

## Kenapa Bukan styled-components?

styled-components inject `<style>` tag ke DOM saat runtime — setiap component punya hash class (`sc-abc123 dEfGhI`) yang di-generate di browser. Masalahnya:

- **Runtime overhead** — ~15KB JS untuk generate + inject CSS
- **SSR mismatch** — hash bisa berbeda antara server dan client → hydration warning
- **DevTools susah dibaca** — `sc-abc123` tidak informatif
- **Butuh setup khusus** — `ServerStyleSheet`, `StyledEngineProvider`, dll untuk Next.js App Router

`tailwind-styled-v4` tidak punya masalah ini karena CSS sudah di-bundle sebelum browser buka halaman. Class name readable, SSR dan CSR identik, tidak ada runtime overhead.

---

## Benchmark

Diukur di Node.js 22, Rust 1.75.

| Operasi | tailwind-styled-v4 | Tailwind CSS (JS) | Speedup |
|---|---|---|---|
| Scan 1000 file | **0.8 ms** | ~340 ms | **~425×** |
| Compile 500 class | **0.02 ms** | ~1.2 ms | **~60×** |
| Parse class string | **0.010 ms** | ~0.8 ms | **~80×** |
| Cache read/write | **0.009 ms** | ~0.5 ms | **~55×** |
| Watch mode rebuild | **< 5 ms** | ~85 ms | **~17×** |

---

## Arsitektur

```
tailwind-styled-v4/
├── native/                    # Rust engine (NAPI-RS)
│   ├── src/application/
│   │   └── ast_extract.rs     # Extract Tailwind classes dari source files
│   ├── src/domain/
│   │   ├── variants.rs        # Variant resolution (props override defaults)
│   │   └── transform.rs       # Transform object config → JS component
│   └── src/infrastructure/
│       └── cache_store.rs     # Persistent cache dengan bracket-aware parser
│
├── packages/
│   ├── domain/
│   │   ├── core/              # tw, cx, cv, cn — core API + createComponent
│   │   ├── compiler/          # Tailwind JS + LightningCSS pipeline
│   │   └── scanner/           # File scanner (Rust-backed)
│   ├── presentation/
│   │   └── next/              # Next.js plugin (withTailwindStyled)
│   └── infrastructure/
│       └── cli/               # CLI (tw setup, tw audit, dll)
```

---

## TypeScript

Library ini fully typed — tidak ada `any` di public API:

```tsx
// Type inference otomatis dari config
const Button = tw.button({
  variants: {
    intent: { primary: "...", ghost: "...", outline: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { intent: "primary", size: "md" },
})

// TypeScript tahu props yang valid
<Button intent="invalid" />  // ❌ Type error
<Button intent="primary" />  // ✅

// Sub-components — ExtractSubName type inference
const Card = tw.div({
  sub: {
    header: "font-bold",
    "div:action": "flex gap-3",  // → Card.action (tag prefix di-strip otomatis)
  },
})

Card.action  // ✅ autocomplete
Card.xyz     // ❌ TypeScript error
```

---

## Environment Variables

| Variable | Default | Deskripsi |
|---|---|---|
| `TWS_LOG_LEVEL` | `info` | `debug\|info\|warn\|error\|silent` |
| `TWS_DEBUG_SCANNER` | `0` | `1` = aktifkan scanner debug logs |
| `STUDIO_PORT` | `3030` | Port studio server |

---

## Development

```bash
git clone https://github.com/Dictionar32/tailwind-styled-v4.git
cd tailwind-styled-v4

npm install

# Build Rust binary + semua packages
npm run build

# Build Rust only
npm run build:rust

# Test
npm run test

# Dev mode
npm run dev

# Benchmark
npm run bench
```

**Requirements:**
- Node.js 20+
- Rust 1.75+ (untuk build dari source)

---

## Contributing

PR dan issue sangat welcome!

Prioritas saat ini:
- [ ] macOS & Windows pre-built binary
- [ ] Docs website (VitePress)
- [ ] More bundler adapters

---

## License

[MIT](LICENSE) © Dictionar32