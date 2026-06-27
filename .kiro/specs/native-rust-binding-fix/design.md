# Native Rust Binding Fix — Bugfix Design

## Overview

Aplikasi Next.js example (`examples/next-js-app`) mengalami crash dan error saat dijalankan dengan `npm run dev`. Ada **5 bug yang berkaitan** yang perlu diperbaiki:

1. **Bug 1 — Duplicate React instance (hook null-stub):** `tailwind-styled-v4` di-externalize via `serverExternalPackages` sehingga Next.js me-resolve-nya lewat condition `react-server` yang me-load React dengan hooks yang di-null-stub.
2. **Bug 2 — `cn()` crash di browser:** `cn()` dalam `cx.ts` memanggil native binding `resolveClassNames` tanpa fallback, padahal native `.node` addon tidak bisa load di browser.
3. **Bug 3 — `resolveSimpleVariants` crash di browser:** `createComponent.ts` memanggil `resolveSimpleVariants` tanpa guard saat `server.div(...)` di-render client-side.
4. **Bug 4 — `tw.server.*` dirender di browser tanpa transform:** Turbopack dev mode melewati webpack transform sehingga `server.div(...)` melewati sebagai proxy object dan merender tanpa static resolution.
5. **Bug 5 — Sub-component tag HTML tidak valid:** Sub-component `<icon>`, `<text>`, `<badge>`, dll dirender sebagai unknown HTML element karena key name tidak di-map ke tag HTML yang valid.

**Prinsip desain kritis:** Native Rust binding **WAJIB tetap dipakai** di semua path Node.js/SSR/server. Pure-TS fallback **hanya** dibolehkan di browser path (saat `getNativeBinding()` return `null`). Tidak ada satu pun native binding call di server path yang boleh dihapus atau di-bypass.

---

## Glossary

- **Bug_Condition (C):** Kondisi yang memicu bug — misalnya, `isBrowserEnvironment = true AND nativeBinding = null AND tidak ada fallback`.
- **Property (P):** Perilaku yang diharapkan saat kondisi bug terpenuhi — fungsi TIDAK boleh throw, harus return hasil yang benar.
- **Preservation:** Perilaku existing di Node.js/SSR yang TIDAK boleh berubah setelah fix.
- **`getNativeBinding()`:** Fungsi di `packages/domain/core/src/native.ts` yang me-load native `.node` addon. Return `null` di browser (bukan throw), throw di Node.js jika addon tidak ditemukan.
- **`native.browser.ts`:** Stub browser — `getNativeBinding` selalu return `null`, tanpa `import node:*` apapun.
- **`index.browser.mjs`:** Entry point browser bundle yang di-resolve via `exports["."].browser` condition.
- **`serverExternalPackages`:** Config Next.js yang memerintahkan bundler untuk melewati bundling dan menggunakan Node.js `require()` langsung — membypass webpack/Turbopack resolution logic.
- **`isBrowserEnvironment`:** Flag internal yang mendeteksi runtime browser: `typeof window !== "undefined" || typeof document !== "undefined"`.
- **Turbopack:** Bundler baru default Next.js 15+ yang digunakan saat `next dev`; custom webpack loaders tidak dijalankan oleh Turbopack untuk file `.tsx`.

---

## Bug Details

### Bug Condition

**Bug 1 — Duplicate React instance:**

React hook crash terjadi karena `tailwind-styled-v4` masuk dalam `serverExternalPackages`, sehingga Next.js menggunakan Node.js native `require()` untuk me-resolve package ini. Di layer RSC Next.js, condition aktif adalah `react-server`. Karena di `package.json` exports kedua condition `react-server` dan `node` menunjuk ke `dist/index.mjs` yang sama, React yang di-import dari file tersebut ternyata adalah build `react-server` (dengan null-stub hooks), bukan React yang dipakai app.

**Bug 2 — `cn()` crash di browser:**

`cn()` di `cx.ts` memanggil `native.resolveClassNames(strings)` tanpa cek apakah native tersedia. Di browser, `getNativeBinding()` return `null` (ini perilaku yang benar dan diharapkan), tapi `cx.ts` langsung throw error tanpa ada fallback path.

**Bug 3 — `resolveSimpleVariants` crash di browser:**

`createComponent.ts` di `resolveVariants()` memanggil `binding.resolveSimpleVariants(...)` dengan guard `throw` jika binding null. Karena `server.div(...)` di `Avatar.tsx` digunakan di page `"use client"`, komponen tersebut ikut di-render di browser. `resolveSimpleVariants` adalah operasi pure (filter + join variant strings) yang bisa dilakukan tanpa Rust di browser.

**Bug 4 — Turbopack melewati webpack transform:**

`withTailwindStyled.ts` secara eksplisit skip webpack transform saat `webpackOptions.dev === true`. Ini desain yang benar untuk menghindari hydration mismatch, tapi akibatnya `tw.server.*` proxy object melewati ke runtime browser dan memunculkan warning.

**Bug 5 — Sub-component tag tidak valid:**

`parseSubKey()` di `createComponent.ts` mendeteksi semantic HTML tag dari nama key. Nama seperti `icon`, `text`, `badge`, `content`, `message` tidak ada di `SEMANTIC_HTML_TAGS` set, sehingga dirender sebagai tag nama literal yang tidak valid di HTML.

**Formal Specification (Bug 2 — cn() crash):**

```
FUNCTION isBugCondition_cn(X)
  INPUT: X of type CnCallContext
  OUTPUT: boolean

  RETURN X.isBrowserEnvironment = true
    AND X.nativeBinding = null         -- getNativeBinding() return null di browser
    AND X.hasFallbackPath = false      -- cx.ts throw Error, tidak ada fallback
    AND X.inputStrings.length > 0      -- ada input string yang harus di-proses
END FUNCTION
```

**Formal Specification (Bug 3 — resolveSimpleVariants crash):**

```
FUNCTION isBugCondition_resolveVariants(X)
  INPUT: X of type ResolveVariantsContext
  OUTPUT: boolean

  RETURN X.isBrowserEnvironment = true
    AND X.nativeBinding = null
    AND X.component.hasVariants = true    -- component punya variant config
    AND X.hasFallbackPath = false         -- createComponent.ts throw Error
END FUNCTION
```

**Formal Specification (Bug 1 — duplicate React):**

```
FUNCTION isBugCondition_reactDuplicate(X)
  INPUT: X of type NextJsImportContext
  OUTPUT: boolean

  RETURN X.packageName = "tailwind-styled-v4"
    AND X.isInServerExternalPackages = true
    AND X.activeCondition IN ["react-server", "node"]
    AND X.component.usesReactHooks = true
END FUNCTION
```

### Contoh Bug yang Nyata

- **Bug 2:** `Avatar.tsx` memanggil `cn(!src && color, className)` di browser → `cx.ts` memanggil `native.resolveClassNames(["bg-blue-100 text-blue-700"])` → `getNativeBinding()` return `null` → `throw Error("Native binding 'resolveClassNames' is required")` → halaman crash.
- **Bug 3:** `AvatarRoot = server.div({ variants: { size: {...} } })` dirender dengan prop `size="md"` di browser → `resolveVariants()` memanggil `binding.resolveSimpleVariants(...)` → `getNativeBinding()` return `null` → `throw Error("FATAL: Native binding 'resolveSimpleVariants' is required")`.
- **Bug 1:** `liveToken()` dan `createUseTokens()` di `LiveTokenDemo.tsx` menggunakan `useState` dari `tailwind-styled-v4` → package di-externalize → Next.js load lewat `react-server` condition → `useState` = null → crash `"Cannot read properties of null (reading 'useState')"`.
- **Bug 5:** `Button` dengan `sub: { icon: "...", text: "..." }` → `parseSubKey("icon")` → `"icon"` tidak ada di `SEMANTIC_HTML_TAGS` → `tag = "span"` (ini sebenarnya OK), tapi komponen lain yang pakai template literal `[icon] { ... }` tidak di-handle oleh `config.sub` sehingga `parseSubComponentBlocks` di-call dan tag fallback ke `"span"`. Masalah utama adalah sub-component yang di-render langsung sebagai JSX `<icon>` dari komponen yang dibuat manual (bukan via `createComponent`).

---

## Expected Behavior

### Preservation Requirements

**Perilaku yang WAJIB tidak berubah di Node.js/SSR/server context:**

- `cn()` DAN `cx()` di Node.js **WAJIB** tetap memanggil `native.resolveClassNames()` dan `native.twMergeMany()` — tidak ada perubahan di server path
- `resolveSimpleVariants()` di Node.js **WAJIB** tetap memanggil native Rust binding
- `twMerge()` di Node.js **WAJIB** tetap memanggil `native.twMergeRaw()` (merge.ts sudah benar, tidak diubah)
- `withTailwindStyled()` scan + `scanWorkspace()` **WAJIB** tetap menggunakan Rust native scanner
- `generateCssForClasses()` **WAJIB** tetap menggunakan native Rust CSS compiler
- `server.div(...)` components di RSC/SSR **WAJIB** tetap dirender tanpa warning dan tanpa memanggil native binding di browser
- Semua 63 fungsi native Rust yang sudah terdefinisi di `native.ts` **WAJIB** tetap dapat dipanggil di Node.js context

**Scope non-buggy input:**

Semua input yang TIDAK memenuhi kondisi bug (yaitu: dijalankan di Node.js dengan native binding tersedia) harus menghasilkan output identik sebelum dan setelah fix.

---

## Hypothesized Root Cause

### 1. `cx.ts` tidak punya fallback browser path

`cx.ts` ditulis sebagai "Pure Node.js — requires native Rust binding" (lihat komentar header file). Ini benar untuk server path. Tapi karena `index.browser.ts` meng-export `cn`, `cx`, `cxm` dari `cx.ts` yang sama, dan esbuild plugin `nativeBrowserPlugin` hanya meng-alias `./native` ke `native.browser.ts` (bukan `cx.ts`), maka `cx.ts` tetap ikut terbundle ke browser bundle. Saat `getNativeBinding()` return `null` (perilaku benar untuk browser), `cx.ts` throw error.

Bandingkan dengan `merge.ts` yang sudah benar: ada `mergeFallback.ts` sebagai pure-TS port dan `merge.ts` menggunakannya ketika `native?.twMergeRaw` tidak tersedia.

### 2. `createComponent.ts` — `resolveVariants` tidak punya fallback

`resolveVariants()` memanggil `binding.resolveSimpleVariants(null, variants, defaults, cleanProps)` dengan guard throw. Operasi ini secara semantik adalah: untuk setiap key variant yang aktif, lookup value-nya dari map, lalu join dengan spasi. Tidak ada logika yang secara inherent membutuhkan Rust — ini bisa dilakukan di pure-TS.

### 3. `serverExternalPackages` menginterferensi dengan `browser` export condition

Ketika `tailwind-styled-v4` ada di `serverExternalPackages`, Next.js tidak lewatkan package ini ke webpack/Turbopack untuk bundling. Sebagai gantinya, Node.js `require()` atau `import()` digunakan langsung. Di layer RSC, active condition adalah `react-server`, sehingga `dist/index.mjs` di-load. File ini meng-import React dari `react`, tapi di RSC context React yang tersedia adalah build khusus server (`react/react-server`) di mana `useState`, `useEffect`, dll adalah null-stub.

Fix: keluarkan `tailwind-styled-v4` dari `serverExternalPackages` sehingga Next.js bundler bisa mendeteksi directive `"use client"` dan me-resolve `browser` export condition untuk client components.

### 4. Turbopack melewati webpack transform di dev mode

Ini adalah desain yang disengaja di `withTailwindStyled.ts` (ada guard `if (webpackOptions.dev) return config`). Akibatnya, `tw.server.*` components tidak di-transform di dev mode. Ini **bukan bug yang perlu di-fix di withTailwindStyled.ts** — perilaku ini benar untuk Turbopack. Yang perlu di-fix adalah: `tw.server.*` harus bisa dirender di browser tanpa crash dan tanpa false-alarm warning.

### 5. Sub-component tag mapping tidak lengkap

`SEMANTIC_HTML_TAGS` set di `createComponent.ts` tidak mencakup nama-nama umum sub-component yang sering dipakai developer (`icon`, `text`, `badge`, `content`, `title`, `message`, `header`, `body`, `footer`). Akibatnya sub-component dengan nama tersebut dirender sebagai `<span>` (yang sebenarnya OK secara HTML) tapi versi manual dari komponen yang merender tag langsung bisa menyebabkan unknown HTML element.

---

## Correctness Properties

Property 1: Bug Condition — cn() Tidak Throw di Browser

_For any_ input dimana `isBugCondition_cn(X)` bernilai true (yaitu: runtime browser, `getNativeBinding()` return null, ada string input), fungsi `cn()` yang sudah difix **SHALL** mengembalikan string class yang sudah difilter dan digabung dengan spasi, tanpa melempar Error apapun. Hasilnya harus ekivalen dengan `inputs.filter(Boolean).join(" ")`.

**Validates: Requirements 2.3**

Property 2: Preservation — cn() Server Path Tidak Berubah

_For any_ input dimana `isBugCondition_cn(X)` bernilai false (yaitu: runtime Node.js, `getNativeBinding()` return binding valid), fungsi `cn()` yang sudah difix **SHALL** menghasilkan output yang identik dengan `cn()` original — tetap memanggil `native.resolveClassNames(strings)` dan hasilnya identik byte-per-byte.

**Validates: Requirements 3.1, 3.3**

Property 3: Bug Condition — resolveVariants Tidak Throw di Browser

_For any_ input dimana `isBugCondition_resolveVariants(X)` bernilai true (yaitu: runtime browser, native binding null, component dengan variants), fungsi `resolveVariants()` yang sudah difix **SHALL** mengembalikan variant class string yang benar menggunakan pure-TS lookup, tanpa melempar Error apapun.

**Validates: Requirements 2.2**

Property 4: Preservation — resolveVariants Server Path Tidak Berubah

_For any_ input dimana `isBugCondition_resolveVariants(X)` bernilai false (yaitu: runtime Node.js dengan native binding), fungsi `resolveVariants()` yang sudah difix **SHALL** menghasilkan output yang identik dengan sebelum fix — tetap memanggil `binding.resolveSimpleVariants(...)`.

**Validates: Requirements 3.1, 3.3**

Property 5: Bug Condition — React Hooks Tidak Crash

_For any_ import context dimana `isBugCondition_reactDuplicate(X)` bernilai true, komponen yang menggunakan React hooks dari `tailwind-styled-v4` **SHALL** me-resolve instance React yang sama dengan app (`examples/next-js-app/node_modules/react`) dan hooks berjalan tanpa Error.

**Validates: Requirements 2.1, 2.5**

Property 6: Preservation — SSR/RSC Native Path Tidak Berubah

_For any_ input yang dieksekusi di RSC atau SSR context (bukan client component), semua fungsi yang menggunakan native Rust binding — termasuk `twMerge`, class generation, scanner, `resolveSimpleVariants`, `hashContent`, dll — **SHALL** tetap memanggil native binding dan menghasilkan output yang identik.

**Validates: Requirements 3.1, 3.2, 3.3, 3.6, 3.7**

---

## Fix Implementation

### Perubahan yang Diperlukan

Asumsi root cause analysis benar:

---

**File: `packages/domain/core/src/cx.ts`**

**Fungsi:** `cn()`, `cx()`, `cxn()`

**Perubahan Spesifik:**

1. **Tambah pure-TS fallback untuk `cn()`** — ketika `getNativeBinding()` return null (browser), gunakan implementasi sederhana: filter falsy values + join dengan spasi. Ini ekivalen dengan semantik `resolveClassNames` dari Rust yang juga hanya filter + join.

2. **Tambah pure-TS fallback untuk `cx()`** — ketika native null, gunakan `twMergeRawJs` dari `mergeFallback.ts` (sudah ada, tinggal dipakai di sini juga). Semantik `cx()` = conflict-aware merge = sama dengan `twMerge`.

3. **Tambah pure-TS fallback untuk `cxn()`** — ketika native null, flatten nested array + filter + join.

4. **Pertahankan server path:** Semua `throw Error(...)` yang ada TIDAK diubah — mereka tetap dijalankan jika native null di Node.js (yang menandakan miskonfigurasi).

5. **Strategi guard:** Pattern yang dipakai sama seperti `merge.ts` yang sudah benar — cek `const native = getNativeBinding()` lalu gunakan native jika tersedia, fallback jika null (browser), warn sekali di fallback.

---

**File: `packages/domain/core/src/createComponent.ts`**

**Fungsi:** `resolveVariants()`

**Perubahan Spesifik:**

1. **Tambah pure-TS fallback untuk `resolveVariants()`** — ketika `getNativeBinding()` null, lakukan lookup manual: untuk setiap key variant yang ada di `cleanProps`, lookup value dari `variants[key][propValue]` lalu join semua hasil dengan spasi, apply defaults untuk key yang tidak ada di props.

2. **Pertahankan server path:** `binding.resolveSimpleVariants(...)` call **TIDAK dihapus** — tetap digunakan ketika native tersedia.

3. **`pregenerateStatesNapi` sudah ada fallback** — di `createComponent.ts` sudah ada `try/catch` dan fallback runtime untuk states, tidak perlu diubah.

---

**File: `examples/next-js-app/next.config.ts`**

**Fungsi:** `serverExternalPackages` config

**Perubahan Spesifik:**

1. **Keluarkan `tailwind-styled-v4` dari `serverExternalPackages`** — package utama ini harus di-bundle oleh Next.js bundler supaya `browser` export condition bisa dideteksi untuk client components.

2. **Pertahankan sub-package lainnya:** `@tailwind-styled/shared`, `@tailwind-styled/compiler`, `@tailwind-styled/scanner`, dll tetap boleh di-externalize karena mereka memang Node.js-only dan tidak pernah diimport dari client components.

---

**File: `examples/next-js-app/src/components/Avatar.tsx`** (opsional, sebagai workaround tambahan)

**Perubahan Spesifik:**

1. **Ganti `server.div` dengan `tw.div`** untuk `AvatarRoot` dan `Overflow` — karena `Avatar` digunakan dari halaman `"use client"`, menggunakan `server.div` menyebabkan komponen tersebut (yang didesain untuk RSC) ikut di-render di client. Ini adalah fix workaround yang lebih defensive; fix utamanya adalah di `cx.ts` dan `createComponent.ts`.

---

**File: `packages/domain/core/src/createComponent.ts`** (Bug 5 — sub-component tags)

**Fungsi:** `SEMANTIC_HTML_TAGS` set

**Perubahan Spesifik:**

1. **Perluas `SEMANTIC_HTML_TAGS`** untuk mencakup nama sub-component yang umum dipakai sebagai tag (`header`, `footer`, `main`, dll sudah ada). Pastikan tag-tag ini benar: `header`, `footer`, `main`, `nav`, `section` sudah ada. Tidak ada perubahan diperlukan di `SEMANTIC_HTML_TAGS` itu sendiri.

2. **Fix utama Bug 5:** Komponen manual yang merender `<icon>`, `<text>` langsung sebagai JSX tag perlu diganti dengan elemen HTML valid. Ini ada di komponen-komponen example, bukan di library. Gunakan `sub` config dengan `"tag:name"` syntax untuk mapping eksplisit.

---

### Bukan Termasuk dalam Fix Ini

- Menghapus atau mengubah logika native binding loading di `native.ts` — tidak diubah sama sekali
- Menambah polyfill Node.js built-ins di browser bundle — tidak diperlukan
- Mengubah Rust source code — tidak diperlukan
- Mengubah `tsup.config.ts` `nativeBrowserPlugin` — sudah benar, sudah alias `./native` ke `native.browser.ts`

---

## Testing Strategy

### Pendekatan Validasi

Strategi testing mengikuti dua fase: pertama, surface counterexample yang mendemonstrasikan bug di kode yang belum difix, kemudian verifikasi fix bekerja dengan benar dan preservasi perilaku existing tidak terganggu.

### Exploratory Bug Condition Checking

**Goal:** Surface counterexample yang mendemonstrasikan bug SEBELUM fix diimplementasi. Konfirmasi atau refutasi root cause analysis.

**Test Plan:** Buat test environment yang mensimulasikan browser runtime (mock `typeof window !== "undefined"` = true, `getNativeBinding()` return null) dan jalankan fungsi-fungsi yang buggy.

**Test Cases:**

1. **cn() browser crash test:** Simulasikan browser environment, panggil `cn("bg-blue-100", "text-blue-700")` — AKAN crash dengan `Error: Native binding 'resolveClassNames' is required` di kode yang belum difix.

2. **cx() browser crash test:** Simulasikan browser environment, panggil `cx("p-4", "p-8")` — AKAN crash dengan `Error: Native binding 'twMergeMany' is required`.

3. **resolveVariants browser crash test:** Simulasikan browser environment, buat component via `createComponent("div", { variants: { size: { sm: "h-8", md: "h-10" } } })` dengan `resolveSimpleVariants` di-null — AKAN crash dengan `Error: FATAL: Native binding 'resolveSimpleVariants' is required`.

4. **React hooks crash test:** Jalankan `next dev` dengan `tailwind-styled-v4` di `serverExternalPackages` — AKAN crash dengan `TypeError: Cannot read properties of null (reading 'useState')`.

**Expected Counterexamples:**
- `cn()` dan `cx()` throw Error alih-alih return string
- `createComponent` render throw Error untuk component dengan variants
- Hook call crash di client component yang menggunakan `liveToken()` / `createUseTokens()`

### Fix Checking

**Goal:** Verifikasi bahwa untuk semua input dimana kondisi bug terpenuhi, fungsi yang sudah difix menghasilkan perilaku yang benar.

**Pseudocode:**

```
FOR ALL X WHERE isBugCondition_cn(X) DO
  result ← cn_fixed(X.inputs)
  ASSERT no_throw(result)
  ASSERT result = X.inputs.filter(Boolean).join(" ")
END FOR

FOR ALL X WHERE isBugCondition_resolveVariants(X) DO
  result ← resolveVariants_fixed(X.variants, X.props, X.defaults)
  ASSERT no_throw(result)
  ASSERT result = pureTS_variantLookup(X.variants, X.props, X.defaults)
END FOR
```

### Preservation Checking

**Goal:** Verifikasi bahwa untuk semua input dimana kondisi bug TIDAK terpenuhi (Node.js runtime), fungsi yang sudah difix menghasilkan output yang identik dengan fungsi original.

**Pseudocode:**

```
FOR ALL X WHERE NOT isBugCondition_cn(X) DO
  -- Node.js, native tersedia
  ASSERT cn_original(X) = cn_fixed(X)   -- keduanya call native.resolveClassNames
END FOR

FOR ALL X WHERE NOT isBugCondition_resolveVariants(X) DO
  -- Node.js, native tersedia
  ASSERT resolveVariants_original(X) = resolveVariants_fixed(X)
END FOR
```

**Pendekatan Testing:** Property-based testing direkomendasikan untuk preservation checking karena:
- Menghasilkan banyak test case otomatis dari input domain yang luas
- Menangkap edge case yang mungkin terlewat test manual
- Memberikan jaminan kuat bahwa perilaku tidak berubah di semua input non-buggy

**Test Cases:**

1. **cn() Node.js preservation:** Verifikasi bahwa `cn("p-4", "m-2", false, "text-lg")` menghasilkan output identik sebelum dan setelah fix, dengan native binding aktif.
2. **cx() conflict resolution preservation:** Verifikasi bahwa `cx("p-4 p-8")` → `"p-8"` tetap benar di Node.js dengan native.
3. **resolveVariants Node.js preservation:** Verifikasi resolusi variant identik di Node.js sebelum dan setelah fix.
4. **twMerge tidak terpengaruh:** `merge.ts` tidak diubah — verifikasi twMerge tetap menggunakan native di server.

### Unit Tests

- Test `cn()` di mock browser environment (native = null) — harus return filtered join
- Test `cx()` di mock browser environment (native = null) — harus return conflict-resolved merge
- Test `cn()` di Node.js environment (native = tersedia) — harus tetap call native
- Test `resolveVariants()` browser fallback dengan berbagai kombinasi variants
- Test `resolveVariants()` server path tetap call `binding.resolveSimpleVariants`
- Test `cn("bg-red-100 text-red-700")` → `"bg-red-100 text-red-700"` (no-op, single input)
- Test `cn(false, undefined, null, "text-sm")` → `"text-sm"` (filter falsy)
- Test `cn()` dengan no args → `""` (empty string)

### Property-Based Tests

- **Generator:** Random arrays of class strings (0–20 items), with random falsy values interspersed
- **Property:** `cn_browser_fallback(inputs) === inputs.filter(Boolean).join(" ")` selalu benar di browser mode
- **Generator:** Random variant configs + random prop objects
- **Property:** `resolveVariants_browser_fallback(variants, props, defaults)` selalu menghasilkan subset dari values yang terdefinisi di `variants`, tidak pernah value yang tidak dikenal
- **Property:** Untuk Node.js runtime, `cn_fixed(inputs) === cn_original(inputs)` — native binding tetap dipakai

### Integration Tests

- Jalankan `next build` dengan fix diterapkan — harus berhasil tanpa error
- Verifikasi `AvatarRoot` merender di browser tanpa crash
- Verifikasi `LiveTokenDemo` hooks berjalan tanpa null error
- Verifikasi `twMerge` di SSR context tetap menggunakan native (tidak fallback ke JS)
- Verifikasi `withTailwindStyled` scan tetap menggunakan Rust scanner (`scanWorkspace`)
- Verifikasi produksi build menghasilkan static CSS yang benar

---

## Appendix: Analisis Dampak per File

| File | Perubahan | Sisi yang Berubah |
|------|-----------|-------------------|
| `packages/domain/core/src/cx.ts` | Tambah browser fallback untuk `cn()`, `cx()`, `cxn()` | Browser only |
| `packages/domain/core/src/createComponent.ts` | Tambah browser fallback untuk `resolveVariants()` | Browser only |
| `examples/next-js-app/next.config.ts` | Hapus `tailwind-styled-v4` dari `serverExternalPackages` | Build config |
| `examples/next-js-app/src/components/Avatar.tsx` | Ganti `server.div` dengan `tw.div` (opsional) | Example only |
| `packages/domain/core/src/native.ts` | **Tidak diubah** | — |
| `packages/domain/core/src/merge.ts` | **Tidak diubah** (sudah benar) | — |
| `tsup.config.ts` | **Tidak diubah** | — |
| Semua file Rust | **Tidak diubah** | — |
