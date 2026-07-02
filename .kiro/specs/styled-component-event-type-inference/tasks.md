# Implementation Plan

## Overview

Rencana implementasi ini mengikuti exploratory bugfix workflow dengan metodologi bug condition. Fix bersifat murni type-level: menghapus `[key: string]: unknown` dari `StyledComponentProps` dan mengangkat parameter generic `Tag extends HtmlTagName` ke `TwStyledComponent`, `TwTemplateFactory`, dan `TwTagFactory`, sehingga TypeScript dapat meng-infer tipe event handler secara otomatis berdasarkan tag HTML yang digunakan.

## Tasks

- [x] 1. Tulis tes eksplorasi bug condition (SEBELUM mengimplementasi fix)
  - **Property 1: Bug Condition** - Index Signature Menelan Event Handler Types
  - **PENTING**: Tes ini HARUS GAGAL pada kode yang belum diperbaiki — kegagalan membuktikan bug ada
  - **JANGAN mencoba memperbaiki tes atau kode ketika tes gagal**
  - **CATATAN**: Tes ini meng-encode expected behavior — tes akan memvalidasi fix ketika lulus setelah implementasi
  - **TUJUAN**: Memunculkan counterexample yang membuktikan bug ada pada kode sebelum fix
  - **Pendekatan Scoped PBT**: Bug ini deterministik — scope property ke kasus konkret yang paling representatif untuk memastikan reprodusibilitas:
    - `tw.input` + `onChange`: buat `packages/domain/core/tests/event-type-inference.test.ts`, tulis test case yang mengakses `e.target.value` tanpa anotasi tipe manual — harus menghasilkan error `'e' is of type 'unknown'` pada kode buggy
    - `tw.button` + `onClick`: akses `e.preventDefault()` tanpa anotasi — harus error pada kode buggy
    - `tw.div` + `onKeyDown`: akses `e.key` tanpa anotasi — harus error pada kode buggy
    - `tw.button` + `type="invalid"`: harus error tapi TIDAK error pada kode buggy karena index signature
  - Dari `isBugCondition` di design: bug terpicu saat `X.component IS tw-styled-component AND X.prop IS callback-prop AND typeOf(X.prop parameter) = unknown`
  - Gunakan `@ts-expect-error` pada baris yang memang harus valid setelah fix — ini yang akan gagal pada kode buggy
  - Jalankan `npx tsc --noEmit --project packages/domain/core/tsconfig.json` pada kode yang BELUM diperbaiki
  - **HASIL YANG DIHARAPKAN**: Tes GAGAL (ini benar — membuktikan bug ada)
  - Dokumentasikan counterexample yang ditemukan untuk memahami root cause (contoh: `"(e) => e.target.value"` gagal karena `'e' is of type 'unknown'`)
  - Tandai task selesai ketika tes sudah ditulis, dijalankan, dan kegagalannya terdokumentasi
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Tulis tes preservasi dengan metodologi observation-first (SEBELUM mengimplementasi fix)
  - **Property 2: Preservation** - Perilaku Non-Callback Props Tidak Berubah
  - **PENTING**: Ikuti metodologi observation-first — observasi perilaku kode buggy dulu, baru tulis tes
  - **Langkah 1 — Observasi pada kode BELUM diperbaiki**: Verifikasi kasus-kasus berikut TIDAK menghasilkan error TypeScript (ini adalah baseline yang harus dipertahankan):
    - `data-testid="x"` pada `tw.div` → tidak ada error
    - `aria-label="tutup"` pada `tw.button` → tidak ada error
    - `className="extra"` dan `children={<span>isi</span>}` pada `tw.div` → tidak ada error
    - `as="a"` pada `tw.button` → tidak ada error
    - variant props `intent="primary"` pada komponen dengan variants config → tidak ada error; `intent="invalid"` → ada error
    - states props `loading` dan `fullWidth` (boolean) pada komponen dengan states config → tidak ada error
    - sub-component `Card.link` dengan `href="/target"` di mana link di-declare sebagai `"a:link"` → tidak ada error
    - `.extend()` chaining pada `tw.input`: komponen yang di-extend tetap menerima semua HTML input props yang valid
  - **Langkah 2 — Tulis tes**: Buat `packages/domain/core/tests/preservation.test.ts` — semua observasi di atas diekspresikan sebagai type assertions (compile-only, tanpa `@ts-expect-error` pada kasus yang harus valid)
  - **Langkah 3 — Verifikasi**: Jalankan `npx tsc --noEmit --project packages/domain/core/tsconfig.json`
  - **HASIL YANG DIHARAPKAN**: Tes LULUS (membuktikan baseline behavior sebelum perbaikan)
  - Property yang di-capture: untuk setiap X di mana `NOT isBugCondition(X)`, `typeCheck(sebelum fix)(X) = typeCheck(setelah fix)(X)` — dari Preservation Requirements di design
  - Tandai task selesai ketika tes ditulis, dijalankan, dan lulus pada kode yang belum diperbaiki
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 3. Implementasi fix: Hapus index signature dan tambah generic Tag ke TwStyledComponent

  - [x] 3.1 Hapus `[key: string]: unknown` dari `StyledComponentProps`
    - Buka `packages/domain/core/src/types.ts`
    - Hapus baris `[key: string]: unknown` dari interface `StyledComponentProps`
    - Interface yang tersisa: hanya `className?: string`, `as?: HtmlTagName`, `children?: React.ReactNode`
    - _Bug_Condition: isBugCondition(X) → X.component IS tw-styled-component AND X.prop IS callback-prop — index signature ini yang menyebabkan TypeScript tidak bisa mempersempit tipe callback parameter menjadi `unknown`_
    - _Expected_Behavior: expectedBehavior(result) dari design → setelah index signature dihapus, props spesifik dari `React.ComponentPropsWithoutRef<Tag>` tidak lagi di-override oleh `unknown`_
    - _Preservation: Menghapus index signature saja tidak cukup — langkah 3.2–3.5 diperlukan untuk menggantikan fungsionalitas forward props melalui generic Tag_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Tambah parameter generic `Tag extends HtmlTagName` ke `TwStyledComponent`
    - Tambah `Tag extends HtmlTagName = HtmlTagName` sebagai parameter generic ke-4: `TwStyledComponent<Config, S, TagMap, Tag>`
    - Update call signature — ubah props menjadi intersection yang menyertakan `React.ComponentPropsWithoutRef<Tag>`:
      ```typescript
      (props: React.ComponentPropsWithoutRef<Tag> & StyledComponentProps & InferVariantProps<Config> & InferSizeProps<Config> & InferStatesProps<Config>): React.ReactElement | null
      ```
    - Pola ini mengikuti referensi implementasi `TwSubComponentAccessor<Tag extends HtmlTagName>` yang sudah ada dan sudah benar di file yang sama
    - _Expected_Behavior: tipe parameter `e` pada callback adalah tipe yang didefinisikan di `React.ComponentPropsWithoutRef<Tag>` untuk event handler tersebut, bukan `unknown`_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Update `TwTemplateFactory` untuk propagate `Tag`
    - Tambah parameter generic `Tag extends HtmlTagName = HtmlTagName` ke interface: `TwTemplateFactory<Config, Tag>`
    - Update ketiga overload signature untuk meneruskan `Tag` ke `TwStyledComponent`:
      - Template literal single const: `TwStyledComponent<Config, ExtractSubNames<T>, Record<string, never>, Tag>`
      - Template literal TemplateStringsArray: `TwStyledComponent<Config, string, Record<string, never>, Tag>`
      - Config object: `TwStyledComponent<C, InferSubFromConfig<C>, InferSubTagsFromConfig<C> extends Record<string, string> ? InferSubTagsFromConfig<C> : Record<string, never>, Tag>`
    - _Requirements: 2.1, 2.2_

  - [x] 3.4 Update `TwTagFactory` untuk meneruskan `K` sebagai `Tag` ke `TwTemplateFactory`
    - Ubah `[K in HtmlTagName]: TwTemplateFactory` menjadi `[K in HtmlTagName]: TwTemplateFactory<ComponentConfig, K>`
    - Ini memastikan `tw.input` menghasilkan `TwTemplateFactory<ComponentConfig, "input">` → `TwStyledComponent<..., "input">` → `onChange` parameter ter-infer sebagai `React.ChangeEvent<HTMLInputElement>`
    - `tw.button` → `TwTemplateFactory<ComponentConfig, "button">` → `onClick` parameter ter-infer sebagai `React.MouseEvent<HTMLButtonElement>`
    - _Bug_Condition: Tanpa perubahan ini, informasi tag hilang setelah `TwTagFactory` — `tw.button` dan `tw.input` akan identik pada level `TwStyledComponent` (keduanya menggunakan default `HtmlTagName`)_
    - _Requirements: 2.1, 2.2_

  - [x] 3.5 Update semua method return type di `TwStyledComponent` untuk mempertahankan `Tag`
    - Update `.extend()`: kedua overload return `TwStyledComponent<Config, S, TagMap, Tag>`
    - Update `.withVariants()`: return `TwStyledComponent<Config, S, TagMap, Tag>`
    - Update `.withSub<NewS>()`: return `TwStyledComponent<Config, NewS, TagMap, Tag>`
    - Update `.animate()`: return `Promise<TwStyledComponent<Config, S, TagMap, Tag>>`
    - _Preservation: Method chaining harus mempertahankan Tag agar event handler inference tetap benar setelah `.extend()` atau `.withVariants()` — sesuai Preservation Requirements 3.4 dan 3.5 di design_
    - _Requirements: 2.1, 3.4, 3.5_

  - [x] 3.6 Verifikasi tes bug condition exploration kini lulus
    - **Property 1: Expected Behavior** - Event Handler Types Ter-Infer Benar
    - **PENTING**: Jalankan ulang TES YANG SAMA dari task 1 — JANGAN tulis tes baru
    - Tes dari task 1 meng-encode expected behavior — ketika tes ini lulus, bug dianggap fixed
    - Jalankan `npx tsc --noEmit --project packages/domain/core/tsconfig.json` pada kode yang sudah diperbaiki
    - **HASIL YANG DIHARAPKAN**: Tes LULUS (membuktikan bug sudah diperbaiki)
    - Verifikasi `e` pada `onChange` di `tw.input` kini bertipe `React.ChangeEvent<HTMLInputElement>`, bukan `unknown`
    - Verifikasi `e` pada `onClick` di `tw.button` kini bertipe `React.MouseEvent<HTMLButtonElement>`, bukan `unknown`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.7 Verifikasi tes preservasi masih lulus
    - **Property 2: Preservation** - Tidak Ada Regresi
    - **PENTING**: Jalankan ulang TES YANG SAMA dari task 2 — JANGAN tulis tes baru
    - Jalankan `npx tsc --noEmit --project packages/domain/core/tsconfig.json`
    - **HASIL YANG DIHARAPKAN**: Tes LULUS (membuktikan tidak ada regresi)
    - Konfirmasi semua kasus preservasi tetap bekerja: `data-*`, `aria-*`, `className`, `children`, `as`, variant props, states props, sub-components, dan `.extend()` chaining
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Checkpoint — Pastikan semua tes lulus
  - Update `packages/domain/core/tsconfig.json` (atau `tsconfig.typecheck.json` jika ada) untuk menyertakan file type fixture baru jika belum tercakup dalam `include` pattern yang sudah ada
  - Cari workaround anotasi tipe manual di `examples/next-js-app`: `grep -r "React\.ChangeEvent\|React\.MouseEvent\|React\.FormEvent\|React\.KeyboardEvent" examples/next-js-app/src` — hapus anotasi yang tidak lagi diperlukan setelah fix
  - Jalankan `npm run check:types` untuk final type checking di seluruh monorepo
  - Jalankan `npm run test:all` untuk memastikan tidak ada unit test yang rusak akibat perubahan type-level
  - Pastikan semua tes lulus; tanyakan ke user jika ada pertanyaan yang muncul

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"] },
    { "wave": 3, "tasks": ["3.6", "3.7"] },
    { "wave": 4, "tasks": ["4"] }
  ]
}
```

## Notes

- Semua perubahan bersifat **murni type-level** — tidak ada JavaScript yang diemit yang berubah
- Fix mengikuti pola `TwSubComponentAccessor<Tag extends HtmlTagName>` yang sudah ada dan sudah benar di file yang sama
- Parameter generic `Tag` dengan default value `HtmlTagName` memastikan backward compatibility untuk kode yang tidak menggunakan `tw.*` secara langsung (misalnya `TwTagFactoryAny`)
- TypeScript 6.0.2 mendukung penuh semua konstruksi yang digunakan (generic defaults, distributive conditional types)
- Batasan yang diketahui: prop `as` polymorphism tidak akan mendapat inferensi tipe yang lebih baik — ini trade-off yang disadari dan tidak dianggap regresi
