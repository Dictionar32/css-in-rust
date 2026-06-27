# Implementation Plan: Native Rust Binding Fix

## Overview

Bugfix ini memperbaiki 5 bug yang berkaitan di `examples/next-js-app`. **Prinsip tidak boleh dilanggar:** native Rust binding **WAJIB tetap dipakai** di semua path Node.js/SSR/server. Pure-TS fallback **hanya** diizinkan di browser path (saat `getNativeBinding()` return `null`).

## Tasks

- [x] 1. Tulis tes eksplorasi kondisi bug (Bug Condition Exploration Test)
  - **Property 1: Bug Condition** — cn() dan resolveVariants() Crash di Browser
  - **PENTING**: Tulis property-based test ini SEBELUM mengimplementasi fix
  - **TUJUAN**: Surface counterexample yang membuktikan bug ada di kode yang belum difix
  - **Pendekatan Scoped PBT**: Scope property ke kasus konkret yang gagal: runtime browser (`isBrowser = true`), `getNativeBinding()` di-mock return `null`, ada input string yang valid
  - Tes bahwa `cn("bg-blue-100", "text-blue-700")` **throw** `Error: Native binding 'resolveClassNames' is required` di mock browser environment (Bug 2)
  - Tes bahwa `cx("p-4", "p-8")` **throw** `Error: Native binding 'twMergeMany' is required` di mock browser environment (Bug 2)
  - Tes bahwa `createComponent("div", { variants: { size: { sm: "h-8", md: "h-10" } } })` yang kemudian di-render dengan `size="md"` **throw** `Error: FATAL: Native binding 'resolveSimpleVariants' is required` di mock browser environment (Bug 3)
  - Jalankan tes di kode **BELUM DIFIX** — ekspektasi: tes **GAGAL** (ini membuktikan bug ada)
  - Dokumentasikan counterexample yang ditemukan (mis. `cn("bg-blue-100")` throws alih-alih return `"bg-blue-100"`)
  - Tandai task selesai saat tes sudah ditulis, dijalankan, dan kegagalan terdokumentasi
  - _Requirements: 1.2, 1.3_

- [ ] 2. Tulis tes preservasi perilaku (Preservation Property Tests) — SEBELUM fix
  - **Property 2: Preservation** — Node.js/SSR Path Tidak Berubah
  - **PENTING**: Ikuti metodologi observation-first — amati perilaku di kode BELUM DIFIX dengan native binding aktif
  - Observasi: `cn("p-4", "m-2", false, "text-lg")` di Node.js dengan native → catat output eksak
  - Observasi: `cx("p-4 p-8")` di Node.js dengan native → catat hasilnya `"p-8"` (conflict resolution)
  - Observasi: `resolveVariants` dengan `{ size: { sm: "h-8", md: "h-10" } }` dan props `{ size: "md" }` di Node.js → catat output eksak
  - Tulis property-based test: untuk semua input string array non-kosong di Node.js dengan native tersedia, output `cn()` sebelum dan sesudah fix harus identik
  - Tulis property-based test: untuk semua input di Node.js, `twMerge()` harus tetap memanggil native (tidak fallback ke JS) — cek via spy/mock
  - Verifikasi tes **LULUS** di kode BELUM DIFIX (konfirmasi baseline behavior)
  - Tandai task selesai saat tes ditulis, dijalankan, dan semua passing di kode unfixed
  - _Requirements: 3.1, 3.3_

- [ ] 3. Implementasi fix untuk semua 5 bug

  - [ ] 3.1 Fix Bug 2 — Tambah pure-TS browser fallback di `packages/domain/core/src/cx.ts`
    - Tambah fallback untuk `cn()`: ketika `getNativeBinding()` return `null` (browser), gunakan `inputs.filter(Boolean).join(" ")` — semantik identik dengan `resolveClassNames` di Rust
    - Tambah fallback untuk `cx()`: ketika native null, gunakan `twMergeRawJs()` dari `mergeFallback.ts` yang sudah ada — semantik identik dengan `twMergeMany` di Rust
    - Tambah fallback untuk `cxn()`: ketika native null, flatten nested array + filter falsy + join dengan spasi
    - **Server path TIDAK DIUBAH**: semua `throw Error(...)` untuk non-browser tetap ada — dieksekusi jika native null di Node.js (menandakan miskonfigurasi)
    - Gunakan pola guard yang sama dengan `merge.ts`: cek `const native = getNativeBinding()`, gunakan native jika tersedia, fallback jika null (browser)
    - _Bug_Condition: `isBugCondition_cn(X)` — `X.isBrowserEnvironment = true AND X.nativeBinding = null AND X.hasFallbackPath = false`_
    - _Expected_Behavior: `cn()` return `inputs.filter(Boolean).join(" ")` tanpa throw di browser_
    - _Preservation: Node.js path tetap memanggil `native.resolveClassNames(strings)` dan `native.twMergeMany(filtered)` tanpa perubahan_
    - _Requirements: 2.3, 3.1, 3.3_

  - [ ] 3.2 Fix Bug 3 — Tambah pure-TS browser fallback di `packages/domain/core/src/createComponent.ts`
    - Modifikasi `resolveVariants()`: ketika `getNativeBinding()` return `null` (browser), lakukan lookup manual pure-TS
    - Pure-TS fallback logic: untuk setiap key variant yang ada di `cleanProps`, lookup `variants[key][propValue]`, apply `defaults` untuk key yang tidak ada di props, join semua hasil dengan spasi, trim
    - **Server path TIDAK DIUBAH**: `binding.resolveSimpleVariants(null, variants, defaults, cleanProps)` tetap digunakan saat native tersedia
    - `pregenerateStatesNapi` sudah punya `try/catch` fallback — tidak perlu diubah
    - _Bug_Condition: `isBugCondition_resolveVariants(X)` — `X.isBrowserEnvironment = true AND X.nativeBinding = null AND X.component.hasVariants = true AND X.hasFallbackPath = false`_
    - _Expected_Behavior: `resolveVariants()` return variant class string yang benar dari pure-TS lookup tanpa throw_
    - _Preservation: Node.js path tetap memanggil `binding.resolveSimpleVariants(...)` identik_
    - _Requirements: 2.2, 3.1, 3.3_

  - [ ] 3.3 Fix Bug 1 — Hapus `tailwind-styled-v4` dari `serverExternalPackages` di `examples/next-js-app/next.config.ts`
    - Keluarkan `"tailwind-styled-v4"` dari array `serverExternalPackages` — package ini harus di-bundle oleh Next.js agar condition `browser` bisa dideteksi untuk client components
    - Sub-package Node.js-only (`@tailwind-styled/shared`, `@tailwind-styled/compiler`, dll) tetap boleh di-externalize jika ada
    - Setelah perubahan ini, Next.js bundler mendeteksi direktif `"use client"` dan me-resolve `dist/index.browser.mjs` untuk client components
    - _Bug_Condition: `isBugCondition_reactDuplicate(X)` — package di `serverExternalPackages` → RSC condition aktif → React hooks null-stub_
    - _Expected_Behavior: hooks dari `tailwind-styled-v4` me-resolve React instance yang sama dengan app_
    - _Preservation: RSC/SSR path tetap menggunakan native Rust binding karena bundle server tidak berubah_
    - _Requirements: 2.1, 2.5, 3.1, 3.7_

  - [ ] 3.4 Fix Bug 5 — Perbaiki sub-component tag mapping di `examples/next-js-app`
    - Identifikasi semua komponen di `examples/next-js-app/src/components/` yang menggunakan sub-component dengan nama non-HTML (`icon`, `text`, `badge`, `content`, `title`, `message`, `body`)
    - Gunakan `sub` config dengan `"tag:name"` syntax untuk mapping eksplisit, mis. `"span:icon"`, `"span:text"`, `"span:badge"` agar render HTML element yang valid
    - Pastikan tidak ada `<icon>`, `<text>`, `<badge>` sebagai raw lowercase tag dalam output HTML browser
    - _Bug_Condition: sub-component key tidak ada di `SEMANTIC_HTML_TAGS` → dirender sebagai unknown HTML element_
    - _Expected_Behavior: semua sub-component render tag HTML yang valid (`<span>` atau tag via `"tag:name"`)_
    - _Requirements: 2.6_

  - [ ] 3.5 Fix Bug 4 — Ganti `server.div` dengan `tw.div` di `Avatar.tsx` (defensive fix)
    - Di `examples/next-js-app/src/components/Avatar.tsx`, ganti `server.div({...})` dengan `tw.div({...})` untuk `AvatarRoot` dan `Overflow`
    - `Avatar.tsx` digunakan dari halaman `"use client"` (`page.tsx`), sehingga `server.div` menyebabkan RSC-only component ikut di-render di browser
    - Fix ini adalah workaround defensive; fix utama ada di task 3.1, 3.2, dan 3.3
    - Verifikasi variant `size` tetap bekerja benar setelah perubahan
    - _Requirements: 2.2, 3.5, 3.7_

  - [ ] 3.6 Verifikasi tes kondisi bug (Property 1) sekarang LULUS
    - **Property 1: Expected Behavior** — cn() dan resolveVariants() Tidak Throw di Browser
    - **PENTING**: Jalankan ulang tes yang SAMA dari task 1 — JANGAN tulis tes baru
    - Tes dari task 1 sudah meng-encode expected behavior yang benar
    - Ketika tes ini lulus, artinya fix bekerja: `cn()` di mock browser return string yang benar, `resolveVariants()` return variant classes yang benar, tidak ada throw
    - **Hasil yang diharapkan**: Tes LULUS (membuktikan bug sudah difix)
    - _Requirements: 2.2, 2.3, 2.5_

  - [ ] 3.7 Verifikasi tes preservasi (Property 2) masih LULUS
    - **Property 2: Preservation** — Node.js/SSR Path Tidak Berubah
    - **PENTING**: Jalankan ulang tes yang SAMA dari task 2 — JANGAN tulis tes baru
    - Verifikasi: `twMerge` di SSR tetap memanggil `native.twMergeRaw()` (tidak fallback ke JS)
    - Verifikasi: `withTailwindStyled` scan tetap memanggil `scanWorkspace` via Rust scanner
    - **Hasil yang diharapkan**: Semua tes LULUS (tidak ada regresi di server path)

- [ ] 4. Checkpoint — Pastikan semua tes dan build berhasil
  - Jalankan `npm run test:all` dari root monorepo — semua tes harus lulus
  - Jalankan `cd examples/next-js-app && npm run build` — produksi build harus berhasil tanpa error
  - Verifikasi tidak ada `Error: Native binding 'resolveClassNames' is required` di browser console
  - Verifikasi tidak ada `Error: FATAL: Native binding 'resolveSimpleVariants' is required` di browser console
  - Verifikasi tidak ada `TypeError: Cannot read properties of null (reading 'useState')` di RSC/client
  - Verifikasi `twMerge` di SSR context masih menggunakan native (tidak fallback ke JS)
  - Verifikasi `generateCssForClasses()` dan `scanWorkspace` masih berjalan via Rust native di server
  - Jika ada pertanyaan atau ambiguitas, tanyakan ke user sebelum melanjutkan
  - _Requirements: semua requirement (1.1–1.6, 2.1–2.6, 3.1–3.8)_

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "description": "Tulis semua tes (exploration + preservation) sebelum fix dimulai"
    },
    {
      "wave": 2,
      "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"],
      "description": "Implementasi fix untuk semua 5 bug — dapat dikerjakan paralel"
    },
    {
      "wave": 3,
      "tasks": ["3.6", "3.7"],
      "description": "Verifikasi tes dari wave 1 sekarang menunjukkan hasil yang benar setelah fix"
    },
    {
      "wave": 4,
      "tasks": ["4"],
      "description": "Checkpoint final — semua tes dan build harus berhasil"
    }
  ]
}
```

## Notes

- **Native Rust binding di server path tidak boleh disentuh** — `native.ts` tidak diubah sama sekali
- `mergeFallback.ts` sudah tersedia dan bisa langsung digunakan sebagai fallback untuk `cx()` di browser
- Pattern fix yang benar mengikuti `merge.ts` yang sudah benar: cek `getNativeBinding()`, gunakan native jika ada, fallback jika null (browser only)
- Turbopack dev mode sengaja skip webpack transform — ini desain yang benar, bukan yang perlu difix di `withTailwindStyled.ts`
- File Rust tidak diubah sama sekali
