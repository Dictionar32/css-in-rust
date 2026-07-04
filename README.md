<div align="center">

# tailwind-styled-v4

### ⚡ Rust-powered CSS-in-JS untuk React
**Build-time compiler · Zero runtime overhead · Type-safe variants · RSC-ready**

[![npm](https://img.shields.io/npm/v/tailwind-styled-v4?color=blue)](https://npmjs.com/package/tailwind-styled-v4)
[![license](https://img.shields.io/npm/l/tailwind-styled-v4)](LICENSE)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange?logo=rust)](https://rust-lang.org)
[![Node](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org)
[![tests](https://img.shields.io/badge/tests-545%2B%20passing-brightgreen)](#)
[![bundle](https://img.shields.io/badge/runtime-~4.5kb-green)](https://bundlephobia.com/package/tailwind-styled-v4)

</div>

---

`tailwind-styled-v4` adalah library styling React yang menggabungkan **DX styled-components** dengan **performa Tailwind CSS v4** — dikompilasi oleh engine Rust. Tulis komponen sekali dengan `tw.button({ variants })`, Rust extract dan optimasi seluruh CSS di build time.

**Perbandingan:**

| | tailwind-styled-v4 | styled-components | Tailwind biasa | Panda CSS |
|---|---|---|---|---|
| Build-time CSS | ✅ | ❌ runtime inject | ✅ | ✅ |
| Runtime JS | ~0 | ~15KB | ~0 | ~0 |
| Variants API | ✅ type-safe | terbatas | ❌ | ✅ |
| SSR / RSC | ✅ zero config | ⚠️ ServerStyleSheet | ✅ manual | ✅ |
| Hydration mismatch | ✅ tidak ada | ⚠️ hash drift | ✅ | ✅ |
| DevTools readable | ✅ | ❌ `sc-abc123` | ✅ | ✅ |
| Engine | 🦀 Rust | JS | JS | JS |
| TypeScript | ✅ full inference | partial | ✅ | ✅ |

---

## Instalasi

```bash
npm install tailwind-styled-v4
npx tw setup
```

`npx tw setup` mendeteksi bundler (Next.js / Vite / Rspack), meng-inject plugin ke config, dan membuat `tailwind-styled.config.json` secara otomatis.

---

## API

### 1. Template Literal

API paling sederhana — satu tag, satu string kelas.

```tsx
import { tw } from "tailwind-styled-v4"

const Button = tw.button`
  inline-flex items-center rounded-lg px-4 py-2
  bg-blue-600 text-white font-medium
  hover:bg-blue-700 transition
`

<Button onClick={handleClick}>Klik saya</Button>
```

---

### 2. Object Config *(direkomendasikan)*

API utama — mendukung `variants`, `states`, `sub`, `compoundVariants`, `container`, dan lebih. Semua di-resolve Rust di build time.

```tsx
const Button = tw.button({
  base: "inline-flex items-center rounded-lg font-medium transition-all",
  variants: {
    intent: {
      primary:   "bg-indigo-600 text-white hover:bg-indigo-700",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      danger:    "bg-red-600 text-white hover:bg-red-700",
      ghost:     "text-gray-600 hover:bg-gray-100",
    },
    size: {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-5 py-2.5 text-base",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
  compoundVariants: [
    // intent=primary + size=lg → tambah shadow
    { intent: "primary", size: "lg", class: "shadow-md shadow-indigo-200" },
  ],
})

// TypeScript tahu props yang valid — autocomplete penuh
<Button intent="primary" size="lg">Submit</Button>
<Button intent="danger">Hapus</Button>
<Button intent="invalid" />  // ❌ Type error
```

---

### 3. Sub-Components

Definisi slot anak langsung di config. Format `"tag:name"` untuk kontrol tag HTML — penting untuk SEO dan aksesibilitas.

```tsx
const Card = tw.article({
  base: "rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden",
  sub: {
    // "tag:name" → render tag HTML, akses via Card.name
    "header:header": "px-6 pt-5 pb-0 flex items-start justify-between",
    "h2:title":      "text-base font-semibold text-gray-900",
    "section:body":  "px-6 py-4 text-sm text-gray-500 leading-relaxed",
    "footer:footer": "px-6 pb-5 pt-0 flex items-center gap-2",
    "img:image":     "w-full aspect-video object-cover",
    // tanpa tag → render <span> (default)
    badge:           "rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700",
  },
})

// Penggunaan
<Card>
  <Card.header>
    <Card.title>Judul Card</Card.title>
    <Card.badge>New</Card.badge>
  </Card.header>
  <Card.body>Konten card di sini.</Card.body>
  <Card.footer>
    <Button size="sm">Detail</Button>
  </Card.footer>
</Card>
```

Tag prefix di-strip otomatis dari TypeScript inference — `Card.title` bukan `Card["h2:title"]`.

---

### 4. `cv()` — Class Variant Function

Untuk styling non-komponen (className string) — berguna di utility functions, dynamic class lists, dll.

```tsx
import { cv } from "tailwind-styled-v4"

const badge = cv({
  base: "inline-flex items-center gap-1.5 rounded-full font-medium",
  variants: {
    color: {
      gray:   "bg-gray-100 text-gray-700",
      blue:   "bg-blue-100 text-blue-700",
      green:  "bg-green-100 text-green-700",
      red:    "bg-red-100 text-red-700",
    },
    size: {
      sm: "px-2 py-0.5 text-[10px]",
      md: "px-2.5 py-0.5 text-xs",
      lg: "px-3 py-1 text-sm",
    },
  },
  defaultVariants: { color: "gray", size: "md" },
})

// Returns string className, bukan komponen
<span className={badge({ color: "blue", size: "lg" })}>Active</span>

// Merge className tambahan
<span className={badge({ color: "red", className: "opacity-75" })}>Error</span>
```

---

### 5. `states` — Boolean Props

Boolean props yang di-resolve via Rust bitmask lookup table. Tidak ada string comparison, tidak ada kondisional di render path.

```tsx
const Button = tw.button({
  base: "inline-flex items-center px-4 py-2 rounded-lg font-medium",
  variants: {
    intent: { primary: "bg-indigo-600 text-white", ghost: "text-gray-600" },
  },
  defaultVariants: { intent: "primary" },
  states: {
    loading:   "opacity-60 cursor-wait pointer-events-none",
    fullWidth: "w-full",
    disabled:  "opacity-50 cursor-not-allowed",
  },
})

// Boolean props langsung — tidak perlu className kondisional
<Button loading>Memproses...</Button>
<Button fullWidth>Submit</Button>
<Button loading fullWidth>Loading full width</Button>
```

Maksimal 16 states per komponen (2¹⁶ kombinasi pre-generated di build time).

---

### 6. `state` — CSS Data-Attribute (Zero JS State)

Untuk toggle style tanpa React re-render — cocok untuk animasi dan transisi.

```tsx
const Dropdown = tw.div({
  base: "overflow-hidden transition-all duration-200",
  state: {
    open: {
      true:  "max-h-96 opacity-100",
      false: "max-h-0 opacity-0",
    },
  },
})

// Set data attribute langsung — tidak butuh setState
dropdownRef.current?.setAttribute("data-open", "true")

// Atau via React state
<Dropdown data-open={isOpen.toString()}>
  {children}
</Dropdown>
```

---

### 7. `.extend()` — Inheritance

Extend komponen yang sudah ada tanpa duplikasi class.

```tsx
// Template literal extend
const PrimaryButton = Button.extend`
  bg-indigo-600 text-white hover:bg-indigo-700
`

// Object config extend — tambah variant sekaligus
const BigDangerButton = Button.extend({
  classes:  "text-lg px-8 shadow-lg",
  variants: { loading: { true: "animate-pulse" } },
  defaultVariants: { intent: "danger" },
})
```

---

### 8. `container` — Container Queries

Responsive berdasarkan ukuran container parent, bukan viewport.

```tsx
const Card = tw.div({
  base: "p-4 flex flex-col",
  container: {
    sm: "flex-col",   // @container (min-width: 320px)
    md: "flex-row",   // @container (min-width: 640px)
    lg: "grid-cols-3",// @container (min-width: 1024px)
  },
  containerName: "card", // opsional — named container
})

// Wrapper wajib punya @container
const CardWrapper = tw.div`@container`

<CardWrapper>
  <Card>{/* responsive berdasarkan lebar CardWrapper */}</Card>
</CardWrapper>
```

Breakpoint default: `xs=240px`, `sm=320px`, `md=640px`, `lg=1024px`, `xl=1280px`, `2xl=1536px`.

---

### 9. `server.` — Server Components Only

Komponen yang di-enforce hanya boleh render di server. Dev warning otomatis jika render di browser.

```tsx
import { server } from "tailwind-styled-v4"

// Sama persis API-nya dengan tw — tapi compiler enforce server-only
const PageHeader = server.header({
  base: "w-full border-b px-6 py-4 bg-white",
  sub: {
    "h1:title": "text-2xl font-bold",
    "p:subtitle": "text-sm text-gray-500",
  },
})

const AvatarRoot = server.div({
  base: "relative inline-flex rounded-full overflow-hidden",
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-14 w-14",
    },
  },
  defaultVariants: { size: "md" },
})
```

---

### 10. `createStyledSystem()` — Design System Factory

Untuk design system dengan token terpusat. Token di-inject sebagai CSS custom properties `--sys-{group}-{name}`.

```tsx
import { createStyledSystem } from "tailwind-styled-v4"

const ui = createStyledSystem({
  tokens: {
    colors: {
      primary: "#6366f1",
      danger:  "#ef4444",
      muted:   "#6b7280",
    },
    radius: {
      base: "0.5rem",
      full: "9999px",
    },
  },
  components: {
    button: {
      tag: "button",
      base: "inline-flex items-center font-medium transition-colors",
      variants: {
        intent: {
          primary: "bg-[var(--sys-colors-primary)] text-white",
          danger:  "bg-[var(--sys-colors-danger)] text-white",
          ghost:   "bg-transparent text-current hover:bg-black/5",
        },
        size: {
          sm: "h-8 px-3 text-sm",
          md: "h-10 px-4 text-base",
          lg: "h-12 px-6 text-lg",
        },
      },
      defaultVariants: { intent: "primary", size: "md" },
    },
  },
})

// Komponen dari sistem
const Button = ui.button()

// Token reference — "var(--sys-colors-primary)"
const primaryVar = ui.token("colors.primary")

// Update token runtime
ui.setTokens({ colors: { primary: "#8b5cf6" } })
```

---

### 11. `liveToken()` — Live Design Tokens

Token yang bisa diupdate runtime dan subscribe ke perubahannya.

```tsx
import { liveToken, tokenVar, createUseTokens } from "tailwind-styled-v4"

// Deklarasi token
const tokens = liveToken({
  primary: "#6366f1",
  surface: "#ffffff",
  text:    "#111827",
})

// CSS variable reference — dipakai di className
const Card = tw.div({
  base: `
    bg-[${tokenVar(tokens.surface)}]
    text-[${tokenVar(tokens.text)}]
    border-[${tokenVar(tokens.primary)}]
  `,
})

// Hook untuk subscribe token di React
const useTokens = createUseTokens(tokens)

function ThemePanel() {
  const { primary } = useTokens()
  return <div style={{ color: primary }}>Current primary: {primary}</div>
}

// Update token langsung — semua subscriber re-render
tokens.primary.set("#8b5cf6")
```

---

### 12. `cn()`, `cx()`, `twMerge`

Utility untuk merge dan deduplicate Tailwind classes.

```tsx
import { cn, cx, twMerge } from "tailwind-styled-v4"

// cn — merge dengan dedup (alias twMerge)
cn("px-4 py-2", isActive && "bg-blue-500", className)

// cx — conditional class join (tanpa dedup)
cx("base-class", { "active-class": isActive, "disabled-class": !enabled })

// twMerge — eksplisit Tailwind conflict resolution
twMerge("px-4 px-8")  // → "px-8" (konflik di-resolve, yang terakhir menang)
```

---

## Setup

### Next.js

**`next.config.ts`:**
```ts
import { withTailwindStyled } from "tailwind-styled-v4/next"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {}

export default withTailwindStyled({
  // routeCss: true — generate css-manifest.json yang dibutuhkan TwCssInjector.
  // Tanpa ini, TwCssInjector diam-diam return kosong (manifest tidak ada).
  routeCss: true,
})(nextConfig)
```

**`layout.tsx`:**
```tsx
import { TwCssInjector } from "tailwind-styled-v4/runtime-css"

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/*
         * TwCssInjector — opsional tapi direkomendasikan untuk production.
         *
         * Cara kerja:
         *   1. withTailwindStyled({ routeCss: true }) emit css-manifest.json
         *      ke .next/static/css/tw/ saat build
         *   2. Per request, TwCssInjector baca manifest di server dan inject CSS
         *      route-specific langsung sebagai <style> inline di HTML
         *
         * Tanpa TwCssInjector:
         *   CSS tetap jalan via globals.css — semua route dapat satu bundle
         *   CSS gabungan yang di-load browser via <link>.
         *
         * Dengan TwCssInjector:
         *   Hanya CSS yang dipakai route itu yang di-inline di HTML →
         *   tidak ada extra HTTP request, tidak ada FOUC, streaming-friendly.
         *
         * Kalau manifest belum ada (dev cold start), komponen ini
         * diam-diam return kosong — tidak breaking.
         */}
        <TwCssInjector />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**`globals.css`:**
```css
@import "tailwindcss";

:root {
  --background: #f5f7fb;
  --foreground: #111827;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
}
```

### Vite

```ts
// vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { tailwindStyled } from "tailwind-styled-v4/vite"

export default defineConfig({
  plugins: [react(), tailwindStyled()],
})
```

### Rspack

```js
// rspack.config.js
import { tailwindStyled } from "tailwind-styled-v4/rspack"

---

## Theme Management

Tailwind-styled-v4 automatic mengelola CSS custom properties via `@theme inline` directive. Compiler Rust pre-generate semua CSS state rules di build time — zero runtime overhead.

### Setup Tema

**globals.css — Define CSS Variables:**
```css
@import "tailwindcss";

:root {
  --background: #f5f7fb;
  --foreground: #111827;
  --surface: #ffffff;
  --accent: #2563eb;
}

[data-theme="dark"] {
  --background: #070b16;
  --foreground: #e5e7eb;
  --surface: #0f172a;
  --accent: #60a5fa;
}

/* Bridge to Tailwind */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-accent: var(--accent);
}
```

**ThemeProvider.tsx — Runtime Toggle:**
```tsx
"use client";

import { ReactNode, useEffect, useState, createContext, useContext } from "react";

const STORAGE_KEY = "app-theme";

function applyTheme(theme: "light" | "dark") {
  document.documentElement.setAttribute("data-theme", theme);
}

const ThemeContext = createContext<{
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || "light";
    setThemeState(stored as "light" | "dark");
    applyTheme(stored as "light" | "dark");
    setMounted(true);
  }, []);

  const setTheme = (newTheme: "light" | "dark") => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {mounted ? children : null}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be inside ThemeProvider");
  return context;
}
```

**layout.tsx — Wrap App:**
```tsx
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### Gunakan di Komponen

```tsx
import { useTheme } from "@/components/ThemeProvider";
import { tw } from "tailwind-styled-v4";

const ThemeButton = tw.button`
  px-4 py-2 rounded-lg
  bg-[var(--accent)] text-white
  hover:opacity-80 transition
`;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ThemeButton onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </ThemeButton>
  );
}
```

### Mengapa Ini Berbeda

Tailwind-styled-v4 tidak butuh library theme khusus — compiler Rust handle CSS optimization:

1. **Build-time state extraction**: Compiler scan 81 file, extract 182 komponen, generate 20 state rules
2. **CSS custom properties**: Tailwind bridge variabel ke design system via `@theme inline`
3. **Zero runtime**: Theme toggle hanya set `data-theme` attribute — CSS change instant
4. **localStorage + system preference**: ThemeProvider handle persistence dan auto-sync

**Hasil di `.next/tw-classes/_tw-state-static.css` (auto-generated):**
```css
/* Button component state rules — pre-generated di build time */
.tw-s-b35937[data-disabled="true"] { opacity: 50%; cursor: not-allowed; }
.tw-s-b35937[data-loading="true"] { opacity: 60%; cursor: wait; }

/* State selectors menggunakan CSS variables */
.tw-s-93c530[data-copied="true"] { 
  background-color: var(--color-emerald-500);
  color: var(--color-white);
}
```

Semua state rules di-generate Rust saat build — tidak ada string comparison atau kondisional di runtime! 🚀

export default {
  plugins: [tailwindStyled()],
}
```

---

## CLI

```bash
npx tw setup       # Setup otomatis: detect bundler, patch config, pre-warm cache
npx tw preflight   # Verifikasi setup
npx tw audit       # Analisis workspace — unused classes, missing variants
npx tw benchmark   # Benchmark performa scanner + compiler
```

---

## DevTools

```tsx
// Tambahkan ke layout untuk inspeksi komponen di browser
import { TwDevTools } from "tailwind-styled-v4/devtools"

// Atau pakai dynamic import untuk Next.js (ssr: false wajib)
import dynamic from "next/dynamic"
const DevTools = dynamic(
  () => import("tailwind-styled-v4/devtools").then(m => ({ default: m.TwDevTools })),
  { ssr: false }
)
```

DevTools menampilkan: daftar komponen terdaftar, resolved classes per variant, state registry, container registry, dan live token values.

---

## TypeScript

Semua API fully typed — tidak ada `any` di public API.

```tsx
// Variant type inference otomatis dari config
const Button = tw.button({
  variants: {
    intent: { primary: "...", ghost: "...", danger: "..." },
    size:   { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { intent: "primary", size: "md" },
})

type ButtonProps = React.ComponentProps<typeof Button>
// → { intent?: "primary" | "ghost" | "danger", size?: "sm" | "md" | "lg", ... }

// Sub-component inference — tag prefix otomatis di-strip
const Card = tw.article({
  sub: {
    "header:header":  "...",  // → Card.header (renders <header>)
    "h2:title":       "...",  // → Card.title  (renders <h2>)
    "section:body":   "...",  // → Card.body   (renders <section>)
    badge:            "...",  // → Card.badge  (renders <span>)
  },
})

Card.header  // ✅ autocomplete
Card.title   // ✅
Card.xyz     // ❌ TypeScript error

// .withSub<>() untuk template literal — strict mode manual
const Nav = tw.nav`
  flex items-center gap-4
`.withSub<"logo" | "links" | "actions">()

Nav.logo     // ✅
Nav.unknown  // ❌ TypeScript error
```

---

## Benchmark

Diukur di Node.js 22, Rust 1.75, M1 MacBook Pro.

| Operasi | tailwind-styled-v4 | Tailwind CSS (JS) | Speedup |
|---|---|---|---|
| Scan 1000 file | **0.8 ms** | ~340 ms | **~425×** |
| Compile 500 class | **0.02 ms** | ~1.2 ms | **~60×** |
| Parse class string | **0.010 ms** | ~0.8 ms | **~80×** |
| Cache read/write | **0.009 ms** | ~0.5 ms | **~55×** |
| Watch mode rebuild | **< 5 ms** | ~85 ms | **~17×** |

---

## Environment Variables

| Variable | Default | Deskripsi |
|---|---|---|
| `TWS_LOG_LEVEL` | `info` | `debug\|info\|warn\|error\|silent` |
| `TWS_DEBUG_SCANNER` | `0` | `1` = aktifkan scanner debug logs |
| `TWS_NO_NATIVE` | — | `1` = disable native module (fallback JS) |
| `TWS_NO_RUST` | — | `1` = disable Rust, gunakan JS fallback |

---

## Arsitektur

```
tailwind-styled-v4/
│
├── native/                     # 🦀 Rust engine (NAPI-RS)
│   ├── src/domain/             # Core logic: variants, CSS generation, theme
│   ├── src/application/        # Parser, scanner, resolver, variant system
│   └── src/infrastructure/     # 11 NAPI bridge modules, cache backends
│
├── packages/
│   ├── domain/
│   │   ├── core/               # tw, cv, cn, cx — core API
│   │   ├── compiler/           # Tailwind v4 + LightningCSS pipeline
│   │   ├── scanner/            # File scanner (Rust-backed, ~425× faster)
│   │   ├── theme/              # Theme token resolution
│   │   ├── shared/             # Types, utilities, generated schemas
│   │   └── runtime-css/        # Browser-safe CSS runtime (batched inject)
│   │
│   ├── presentation/
│   │   ├── next/               # Next.js plugin (withTailwindStyled)
│   │   ├── vite/               # Vite plugin
│   │   └── rspack/             # Rspack plugin
│   │
│   └── infrastructure/
│       └── cli/                # CLI (tw setup, audit, benchmark)
│
└── examples/
    └── next-js-app/            # Demo app: Next.js 16 + React 19
```

**NAPI Bridge Modules (11 modul terpisah):**

| Module | Fungsi |
|---|---|
| `napi_bridge_parsing.rs` | Class parsing (6 fungsi) |
| `napi_bridge_css.rs` | CSS generation (7 fungsi) |
| `napi_bridge_theme.rs` | Theme resolution (7 fungsi) |
| `napi_bridge_cache.rs` | Cache management (6 fungsi) |
| `napi_bridge_redis.rs` | Redis distributed cache (17 fungsi) |
| `napi_bridge_analysis.rs` | Performance metrics (5 fungsi) |
| `napi_bridge_watch.rs` | File watching (9 fungsi) |
| `napi_bridge_types.rs` | Type definitions |
| `napi_bridge_marshalling.rs` | JSON I/O |
| `napi_bridge_errors.rs` | Error handling |
| `napi_bridge.rs` | Facade (re-export semua) |

---

## 🪄 Build-Time Magic: Pelajari Lebih Lanjut

Tailwind-styled-v4 melakukan serangkaian operasi sophisticated di build time. Baca dokumentasi untuk understand:

- **[.next-MAGIC-EXPLAINED.md](.next-MAGIC-EXPLAINED.md)** — Complete breakdown dari semua yang terjadi di `.next/tw-classes/`
  - Phase 1-5 workflow
  - Rust engine scanning (425× lebih cepat)
  - State rule pre-generation
  - Route attribution & CSS splitting
  - Component hash determinism
  
- **[BUILD_TIME_FLOW_DIAGRAM.md](BUILD_TIME_FLOW_DIAGRAM.md)** — Visual flowchart & architecture
  - Complete flow dari `npm run dev` hingga browser
  - File dependency graph
  - Key decision points & tradeoffs
  - Performance comparison
  
- **[BUILD_ARTIFACTS_BREAKDOWN.md](BUILD_ARTIFACTS_BREAKDOWN.md)** — Apa yang actually di-generate
  - `_initial-scan.css` (3500 lines)
  - `_tw-state-static.css` (20 pre-generated rules)
  - `css-manifest.json` (route attribution)
  - Statistics & examples

**Highlight**: Engine melakukan ~370ms work di build time → runtime zero overhead ✨

---

## Development

```bash
git clone https://github.com/Dictionar32/tailwind-styled-v4.git
cd tailwind-styled-v4

npm install

# Build Rust binary dulu, baru packages
npm run build:rust
npm run build:packages

# Full build
npm run build

# Test
npm run test:all

# Dev mode (watch)
npm run dev

# Benchmark
npm run bench
```

**Requirements:** Node.js 20+, Rust 1.75+ (untuk build dari source)

---

## Build-Time Magic Documentation

Tailwind-styled-v4 performs 18+ layers of build-time optimization yang menghasilkan zero runtime overhead. Dokumentasi lengkap tersedia:

- **Quick Overview** (5 min): `MAGIC_QUICK_REFERENCE.md`
- **Architecture Flow** (15 min): `BUILD_TIME_FLOW_DIAGRAM.md`
- **Technical Deep Dive** (30 min): `.next-MAGIC-EXPLAINED.md`
- **Entire .next/ Folder** (30 min): `COMPLETE_NEXT_FOLDER_MAGIC.md`
- **Real Files Breakdown** (20 min): `BUILD_ARTIFACTS_BREAKDOWN.md`
- **All 18 Layers Explained** (45 min): `COMPLETE_MAGIC_LAYERS_NEXTJS_APP.md` ⭐

**Steering File** (for future agents): `.kiro/steering/build-time-magic.md`

Untuk development workflows dan advanced patterns, lihat:
- `PROPER_THEME_ARCHITECTURE.md` — Theme setup guide
- `ARIA_VS_VARIANTS_CLARIFICATION.md` — Accessibility patterns
- `FINAL_THEME_SOLUTION.md` — Complete theme solution
- `docs/WAVE5_INTEGRATION_GUIDE.md` — Wave 5 integration

---

## Build-Time Magic Documentation

Tailwind-styled-v4 performs 18+ layers of build-time optimization yang menghasilkan zero runtime overhead. Dokumentasi lengkap tersedia di `docs/` folder:

### 📚 Quick Navigation

**Main Documentation Folder**: 
- **`docs/README_BUILD_TIME_MAGIC.md`** - Main entry point
- **`docs/DOCUMENTATION_INDEX.md`** - Complete navigation guide
- **`docs/build-time-magic/`** - 18 layers documentation (6 files)
- **`docs/theme-architecture/`** - Theme setup patterns
- **`docs/accessibility/`** - ARIA & semantic components

### 🚀 Start Reading

1. **5-Minute Overview**: `docs/build-time-magic/01-QUICK_REFERENCE.md`
2. **15-Minute Architecture**: `docs/build-time-magic/02-FLOW_DIAGRAM.md`
3. **45-Minute Complete**: `docs/build-time-magic/06-ALL_18_LAYERS.md` ⭐

**All in**: `docs/build-time-magic/` folder with 6 comprehensive files.

---

## Contributing

PR dan issue sangat welcome. Prioritas saat ini:

- [ ] Pre-built binary untuk macOS arm64, x64, Linux, Windows
- [ ] Docs website (VitePress)
- [ ] Vue & Svelte adapter yang lebih matang
- [ ] Plugin API public docs

---

## License

[MIT](LICENSE) © Dictionar32
