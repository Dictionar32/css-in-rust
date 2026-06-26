# Fix untuk "Invalid hook call" di LiveTokenDemo

## Diagnosis

**Root Cause:** `packages/domain/theme/src/liveTokenEngine.ts` export hook `createUseTokens()` yang menggunakan React hooks (`useState`, `useEffect`), tapi file-nya **tidak punya `"use client"` directive**.

Saat hook ini di-use di Client Component context (contoh: page.tsx dengan "use client" di top), hook definition dan React instance bisa ter-resolve ke context yang berbeda di saat SSR/prerendering → React dispatcher jadi null → "Invalid hook call" error.

## Fix Applied

**File:** `packages/domain/theme/src/liveTokenEngine.ts`

**Change:** Tambahkan `"use client"` di baris 1 (paling atas sebelum imports):

```typescript
"use client"

import React from "react"
import type { TokenMap } from '@tailwind-styled/shared'
// ... rest of file
```

## Mengapa Fix Ini Bekerja

1. **`"use client"` directive** explicitly mark file sebagai bagian dari Client Component boundary
2. Ketika hook di-bundle oleh Turbopack untuk SSR, Next.js tahu untuk set up React dispatcher correctly untuk file ini
3. React instance yang di-resolve dalam hook ini sekarang consistent dengan React instance yang di-pakai oleh render runtime

## Langkah Next

### Opsi A: Update Library & Rebuild (Recommended)

```bash
# 1. Apply fix ke file local
# File udah di-fixed di packages/domain/theme/src/liveTokenEngine.ts

# 2. Rebuild library
npm run build

# 3. Update examples/next-js-app dengan local monorepo link (optional)
# atau cukup reinstall dengan version baru yang di-publish

# 4. Test
cd examples/next-js-app
npm run dev
# Should NOT crash di LiveTokenDemo anymore
```

### Opsi B: Production Build Test (Verify Fix)

```bash
cd examples/next-js-app
npm run build    # Should prerender successfully now
npm run start    # Serve production build
```

## Files Provided

1. **`css-in-rust-fixed.tar.gz`** — Full monorepo dengan fix sudah applied
2. **`liveTokenEngine.ts`** — Fixed file saja (kalau mau patch manual)

## Related Context

Ini bukan masalah duplikasi React instance di level Node. Test yang saya jalanin:

```bash
node check-react.mjs
# Output: same instance? true
```

React singleton properly resolve di Node level. Masalahnya spesifik ke Next.js/Turbopack SSR bundling logic untuk Client Components, yang Turbopack handle differently dibanding Server Components (serverExternalPackages hanya berlaku ke Server Components/Route Handlers, not Client Components).

## Verifikasi Fix

Setelah rebuild/update, cek:

✅ `npm run dev` di examples/next-js-app tidak crash di LiveTokenDemo  
✅ `npm run build` prerender successfully  
✅ LiveTokenDemo bisa update tokens tanpa error  
✅ Other components (ExtendDemo, StateButton, etc.) tetap berfungsi  

## Technical Details

- **"use client" scope:** File ini dan semua yang di-import darinya jadi client-side-only
- **SSR compatibility:** React.useEffect di hook masih aman karena React supports SSR rendering dari hooks (SSR hanya skip client-specific logic)
- **No breaking changes:** Existing API tidak berubah, cuma internal directive yang ditambah

---

**Questions?** Kalau ada issue setelah apply fix, check:
- Node version (`node -v` — confirm v26.2.0 ✓)
- Clean build: `rm -rf .next node_modules/.cache && npm run build`
- Rebuild native bindings: `npm run build:rust` (jika ada changes ke native/)
