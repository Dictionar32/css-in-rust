# Ringkasan perbaikan tailwind-styled-v4 (5.1.15 → 5.1.16)

Extract zip ini di root repo `css-in-rust` — strukturnya udah sama persis,
jadi tinggal overwrite 3 file di bawah.

## 1. `package.json` (root)
- **Bug #1 (build error `fs`/`module`)**: reorder `exports["."]` — `"browser"`
  dipindah sebelum `"node"`. Conditional exports itu order-sensitive; kalau
  resolver (Turbopack) bawa kondisi `node` + `browser` sekaligus, yang
  ditulis lebih dulu yang menang. Sebelumnya `node` duluan → client bundle
  ke-resolve ke `dist/index.mjs` (ada `import fs`/`import module` statis) →
  `Module not found: Can't resolve 'fs'`.
- **Bug #3 (mitigasi)**: tambah `"react-server"` + `"node"` ke
  `exports["./runtime-css"]` — paritas sama root `"."`, nunjuk file yang
  sama (`dist/runtime-css.mjs`), zero risk.
- Version bump `5.1.15` → `5.1.16` (perlu buat publish ulang, npm gak
  izinin republish versi sama).

## 2. `packages/domain/theme/src/liveTokenEngine.ts`
- **Bug #2 (hydration mismatch `--tw-token-*` di `<html>`)**: `liveToken()`
  yang dipanggil di module top-level (`LiveTokenDemo.tsx`) langsung nulis ke
  `document.documentElement.style` saat bundle client di-evaluasi — sebelum
  React selesai hydrate. Server gak pernah nyentuh `document`, jadi HTML
  hasil SSR beda sama DOM hasil mutasi imperative itu → mismatch.
- Fix: tambah flag `hydrated`. Semua write ke `document.documentElement` /
  `<style id="tw-live-tokens">` ditunda sampai komponen pertama selesai
  *mount* (dipicu `markHydrated()` di `useEffect` milik `useTokens()` hook),
  + fallback `requestAnimationFrame` buat consumer yang pakai API imperative
  tanpa hook. Setelah hydrated, `.set()`/`.setAll()` balik sinkron seperti
  semula — gak ada perubahan behavior buat interaksi user.
- ✅ Typecheck bersih (`tsc --noEmit`) + build bersih (`tsup`) lewat
  pipeline asli monorepo-nya.

## 3. `packages/domain/runtime-css/src/CssInjector.tsx`
- **DX fix**: `TwCssInjector` sebelumnya gagal *diam-diam total* kalau
  manifest CSS gak ketemu (biasanya karena lupa `routeCss: true` di
  `withTailwindStyled()`) atau gagal di-parse — user gak punya jejak sama
  sekali kenapa CSS-nya gak muncul.
- Fix: tambah `warnOnceDev()` — console.warn yang jelas & actionable,
  **cuma di non-production**, **cuma sekali per proses** (gak spam tiap
  request). Production tetap senyap total, zero overhead.
- ✅ Typecheck bersih + build bersih.

## Status Bug #3 (`Element type is invalid` di RootLayout)
Belum bisa dikonfirmasi 100% — sandbox ini gak bisa jalanin native binary
Rust-nya (`GLIBC_2.43` gak ada di container). Parity fix di atas adalah
mitigasi berbasis bukti tidak langsung, bukan fix yang udah diverifikasi
lewat repro nyata. Cara cepat konfirmasi: comment `<TwCssInjector />` di
`layout.tsx`, jalanin `next dev` lagi — kalau errornya hilang, itu
konfirmasi pemicunya, lanjut investigasi dari situ.

## Yang masih perlu dilakukan di mesin lo
1. `npm run build:rust` (butuh cargo — gak ada di sandbox ini)
2. `npm run build:publish`
3. Test manual `next dev` di `examples/next-js-app`
4. `npm publish`
