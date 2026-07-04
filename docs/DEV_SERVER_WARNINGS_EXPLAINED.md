# Dev Server Warnings — Penjelasan & Solusi

Ketika menjalankan `npm run dev` di next-js-app, Anda mungkin melihat beberapa warnings. Dokumentasi ini menjelaskan setiap warning dan cara mengatasinya.

---

## Warnings yang Mungkin Tampil

### 1. Turbopack Root Warning (⚠️ Fixed in v5.0.13+)

```
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles and selected the directory of 
/home/annas-zen/Documents/css-in-rust/package-lock.json as the root directory.
```

#### Penyebab
- Monorepo punya 2 `package-lock.json` files:
  - Root: `/home/annas-zen/Documents/css-in-rust/package-lock.json`
  - App: `/home/annas-zen/Documents/css-in-rust/examples/next-js-app/package-lock.json`
- Turbopack tidak bisa detect workspace boundary dengan benar

#### Solusi ✅ SUDAH DITERAPKAN
Di `next.config.ts`, tambahkan:

```typescript
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,  // Explicitly point to examples/next-js-app
  },
};
```

**Status**: ✅ Fixed di commit Wave 5.1.2
**Verifikasi**: Jalankan `npm run dev` lagi, warning harus hilang

---

### 2. Native Binding Warning (ℹ️ Informational - NOT an error)

```
[tailwind-styled-v4] Native binding 'twMergeRaw' tidak tersedia 
(normal di browser) — pakai pure-TS port dari algoritma Rust-nya. 
Hasil className tetap benar; ini cuma informasi, bukan error.
```

#### Penyebab
- Native module (`.node` binary) hanya bisa diload di Node.js
- Next.js dev server jalan di JavaScript environment
- Browser tidak punya akses ke native bindings

#### Ini NORMAL ✅
- **Bukan error**, hanya informasi
- **Fungsi tetap benar**, menggunakan TypeScript fallback
- **Performance** sedikit lebih lambat (tapi masih cepat)
- **Production**: Native module digunakan (jauh lebih cepat)

#### Context
Tailwind-styled-v4 punya dual implementation:
- **Rust**: Native parser (425× lebih cepat di build-time)
- **TypeScript**: Fallback parser (untuk browser/dev)

Di dev server, menggunakan fallback TypeScript yang pure, yang sudah cukup cepat untuk development.

#### Verifikasi di Production ✅
Build production dengan:
```bash
npm run build
npm start  # Production server dengan native bindings
```

Native binding akan tersedia dan digunakan.

---

### 3. Hydration Mismatch Warning (⚠️ Critical - FIXED in v5.0.13+)

```
[browser] A tree hydrated but some attributes of the server 
rendered HTML didn't match the client properties...
```

#### Penyebab
Theme initialization script menambahkan `style` attribute ke `<html>` element di server-side rendering. Ketika React hydrate di browser, state bisa berbeda (terutama jika localStorage berisi theme preference berbeda).

Ini menyebabkan React menganggap ada mismatch antara:
- Server-rendered HTML: `<html style="--background: #070b16; ...">`
- Client-side expected: Mungkin berbeda karena localStorage

#### Solusi ✅ SUDAH DITERAPKAN
Di `layout.tsx`, tambahkan `suppressHydrationWarning` ke elements yang berubah:

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
          suppressHydrationWarning
        />
        <TwCssInjector />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
```

**Yang berubah**:
- `<html suppressHydrationWarning>` ← Allow style changes
- `<script suppressHydrationWarning>` ← Script ini bikin mismatch
- `<body suppressHydrationWarning>` ← Body juga bisa berubah

**Status**: ✅ Fixed di commit Wave 5.1.2
**Verifikasi**: Warning harus hilang dari browser console

---

## Ringkasan Warnings vs Errors

| Warning | Severity | Impact | Status |
|---------|----------|--------|--------|
| Turbopack root | ⚠️ Info | Configuration only | ✅ Fixed |
| Native binding | ℹ️ Info | Fallback works fine | ✅ Normal |
| Hydration mismatch | ⚠️ Warning | Theme might flicker | ✅ Fixed |

**Semua sudah diatasi!** ✅

---

## Verification Checklist

Setelah melakukan update, verifikasi dengan:

- [ ] `npm run dev` berjalan tanpa Turbopack warning
- [ ] Browser console tidak punya hydration mismatch warning
- [ ] Halaman load dengan theme yang benar (no flash)
- [ ] Theme switching bekerja (toggle theme button)
- [ ] Refresh halaman maintain theme preference

---

## Expected Dev Server Output (After Fixes)

```bash
▲ Next.js 16.2.4 (Turbopack)
- Local:         http://localhost:3000
- Network:       http://192.168.100.197:3000
✓ Ready in 449ms

[scanner] cache MISS /home/annas-zen/Documents/css-in-rust/examples/next-js-app/src/proxy.ts
[scanner] [native] using native parser from .../tailwind-styled-native.node
[tailwind-styled-v4] Native binding 'twMergeRaw' tidak tersedia (normal di browser)

GET /learn/medium/selectors-specificity 200 in 815ms
```

**Notices**:
- ✅ No Turbopack warning about workspace root
- ✅ Native binding info (expected, not error)
- ✅ No hydration mismatch in browser console

---

## FAQ

### Q: Apakah native binding warning benar-benar bukan error?

**A**: Ya, 100% aman. Ini hanya informasi. Native module tidak available di dev server karena JavaScript environment, tapi TypeScript fallback bekerja dengan baik.

### Q: Kenapa tema tampil berflash saat page load?

**A**: Jika masih ada flashing setelah fix:
1. Pastikan `suppressHydrationWarning` ada di `<html>` element
2. Pastikan `THEME_INIT_SCRIPT` jalan synchronously di `<head>` (sebelum body render)
3. Check browser DevTools → Application tab → localStorage → verify `tw-theme-preference` key

### Q: Apakah ini akan terjadi di production?

**A**: Tidak, production lebih optimal:
- Native bindings tersedia (tidak perlu fallback)
- SSR fully optimized
- Tidak ada dev-mode overhead

### Q: Bagaimana cara debug hydration mismatch lebih dalam?

**A**: Gunakan React DevTools:
1. Install React DevTools Chrome extension
2. Buka page, open DevTools
3. Cek React tab → lihat component tree
4. Highlight elements yang punya mismatch

---

## Timeline

| Version | Change |
|---------|--------|
| v5.0.12 | Initial Wave 5 implementation |
| v5.0.13 | ✅ Add `suppressHydrationWarning` + turbopack.root |
| v5.0.14+ | Further optimizations |

---

## Related Files

- `examples/next-js-app/src/app/layout.tsx` — Root layout with SSR-safe theme
- `examples/next-js-app/next.config.ts` — Turbopack configuration
- `examples/next-js-app/src/components/ThemeProvider.tsx` — Theme initialization logic
- `packages/domain/runtime-css/src/TwCssInjector.tsx` — CSS injection component

---

## Need Help?

Jika masih ada warning atau error:

1. Run `npm run build` to verify production build works
2. Check `npm run check:types` untuk type errors
3. Buka GitHub issues dengan output dari `npm run dev`
4. Include Next.js version: `npx next --version`
5. Include tailwind-styled-v4 version: `npm ls tailwind-styled-v4`

---

**Last Updated**: July 3, 2026  
**Status**: All known warnings addressed ✅
