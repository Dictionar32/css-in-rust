# Desain Bugfix: styled-component-event-type-inference

## Overview

Bug ini terjadi karena `StyledComponentProps` di `packages/domain/core/src/types.ts` mendefinisikan index signature `[key: string]: unknown`. Ketika TypeScript meng-intersect tipe ini dengan `React.ComponentPropsWithoutRef<Tag>`, index signature "menelan" semua definisi prop spesifik — termasuk event handler seperti `onChange`, `onClick`, `onKeyDown` — sehingga parameter callback menjadi `unknown` alih-alih tipe event React yang seharusnya.

Perbaikan yang dipilih adalah pendekatan **type-level murni**: menghapus index signature dari `StyledComponentProps` dan mengangkat `React.ComponentPropsWithoutRef<Tag>` langsung ke level `TwStyledComponent<Config, S, TagMap, Tag>` dengan menambahkan parameter generic `Tag extends HtmlTagName`. Dengan demikian, TypeScript dapat mempersempit tipe setiap prop — termasuk callback — berdasarkan tag HTML yang sebenarnya digunakan.

Tidak ada perubahan JavaScript yang diemit. Seluruh perbaikan berada di level type definitions.

---

## Glossary

- **Bug_Condition (C)**: Kondisi yang memicu bug — ketika komponen `tw.*` digunakan dengan callback prop (onChange, onClick, dll.) sehingga parameter event handler bertipe `unknown`.
- **Property (P)**: Perilaku yang diinginkan setelah perbaikan — tipe parameter event handler diinfer secara otomatis dari `React.ComponentPropsWithoutRef<Tag>` sesuai tag HTML.
- **Preservation**: Perilaku existing yang TIDAK BOLEH berubah akibat perbaikan — termasuk variant props, states props, prop `as`, data-* / aria-*, className, children, dan sub-components.
- **Index Signature**: Konstruksi TypeScript `[key: string]: T` yang membuat semua key pada objek bertipe `T`, efektif mengoverride semua definisi prop spesifik.
- **StyledComponentProps**: Interface base props di `types.ts` yang saat ini memiliki index signature penyebab bug.
- **TwStyledComponent**: Tipe utama komponen `tw.*` — callable function + accessor sub-component. Saat ini props-nya di-intersect dengan `StyledComponentProps`.
- **TwTemplateFactory**: Factory yang menghasilkan `TwStyledComponent` dari template literal atau config object. Tipe ini terikat ke `HtmlTagName` via `TwTagFactory`.
- **React.ComponentPropsWithoutRef\<Tag\>**: Tipe React yang mengekspansi semua atribut HTML + event handler yang valid untuk tag HTML tertentu (misalnya `HTMLInputElement` untuk `"input"`).
- **InferVariantProps**: Mapped type yang mengekstrak tipe variant props dari `ComponentConfig`.
- **InferStatesProps**: Mapped type yang mengekstrak tipe states boolean props dari `ComponentConfig.states`.
- **HtmlTagName**: Union type semua tag HTML yang valid, didefinisikan di `@tailwind-styled/shared`.
- **TwSubComponentAccessor**: Tipe sub-component accessor yang sudah menggunakan `React.ComponentPropsWithoutRef<Tag>` dengan benar — menjadi referensi implementasi yang sudah tepat.

---

## Bug Details

### Bug Condition

Bug termanifestasi setiap kali komponen `tw.*` menerima callback prop apa pun. Fungsi call signature pada `TwStyledComponent` menerima `props: StyledComponentProps & InferVariantProps<Config> & ...`. Karena `StyledComponentProps` memiliki `[key: string]: unknown`, TypeScript memperlakukan setiap key yang tidak disebutkan secara eksplisit — termasuk semua event handler dari `React.ComponentPropsWithoutRef<Tag>` — sebagai `unknown`.

**Formal Specification:**

```
FUNCTION isBugCondition(X)
  INPUT: X of type ComponentUsage
  OUTPUT: boolean

  RETURN X.component IS tw-styled-component (dibuat via tw.button, tw.input, dll.)
    AND X.prop IS callback-prop (
          onChange | onClick | onKeyDown | onKeyUp | onKeyPress
        | onFocus | onBlur | onSubmit | onReset
        | onMouseEnter | onMouseLeave | onMouseDown | onMouseUp
        | onPointerDown | onPointerUp | onTouchStart | onTouchEnd
        | ... semua event handler dari React.ComponentPropsWithoutRef<Tag>
        )
    AND typeOf(X.prop parameter) = unknown  // TypeScript inference gagal
END FUNCTION
```

### Contoh Manifestasi Bug

- **Contoh 1 — onChange pada input:**
  ```tsx
  const Input = tw.input`border rounded px-3`
  // Bug: e bertipe unknown, bukan React.ChangeEvent<HTMLInputElement>
  <Input onChange={(e) => e.target.value} />
  //                ^  Error: 'e' is of type 'unknown'
  ```

- **Contoh 2 — onClick pada button:**
  ```tsx
  const Button = tw.button`px-4 py-2 bg-blue-500`
  // Bug: e bertipe unknown, bukan React.MouseEvent<HTMLButtonElement>
  <Button onClick={(e) => e.preventDefault()} />
  //                ^  Error: 'e' is of type 'unknown'
  ```

- **Contoh 3 — onKeyDown pada div:**
  ```tsx
  const Container = tw.div`flex gap-4`
  // Bug: e bertipe unknown, bukan React.KeyboardEvent<HTMLDivElement>
  <Container onKeyDown={(e) => e.key === "Enter"} />
  //                    ^  Error: 'e' is of type 'unknown'
  ```

- **Contoh 4 — type prop tidak divalidasi:**
  ```tsx
  const Btn = tw.button`...`
  // Bug: tidak ada error meski "invalid" bukan nilai type yang valid untuk button
  <Btn type="invalid" />  // ✓ tanpa error (seharusnya error)
  ```

---

## Expected Behavior

### Preservation Requirements

**Perilaku yang TIDAK BOLEH berubah akibat perbaikan:**

- Prop `data-*` dan `aria-*` (misalnya `data-testid="x"`, `aria-label="tutup"`) HARUS tetap diterima tanpa error TypeScript — prop ini di-cover oleh `React.ComponentPropsWithoutRef<Tag>` yang sudah menyertakan `data-*` dan ARIA attributes.
- Prop `className` HARUS tetap bertipe `string | undefined`.
- Prop `children` HARUS tetap bertipe `React.ReactNode`.
- Prop `as` HARUS tetap bertipe `HtmlTagName | undefined` dan tetap mengubah tag yang dirender.
- Variant props yang diinfer dari `ComponentConfig.variants` HARUS tetap berfungsi tanpa konflik.
- States props boolean yang diinfer dari `ComponentConfig.states` HARUS tetap berfungsi tanpa konflik.
- Sub-components (`Card.header`, `Breadcrumb.link`, dll.) HARUS tetap di-tipe-kan dengan `React.ComponentPropsWithoutRef<Tag>` yang sesuai tag-nya.
- Fungsi `.extend()`, `.withVariants()`, `.withSub()` HARUS tetap menghasilkan tipe yang benar.
- Runtime behavior (JavaScript yang diemit) TIDAK BOLEH berubah sama sekali.

**Scope input yang tidak terpengaruh:**
Semua penggunaan komponen `tw.*` yang TIDAK melibatkan callback prop — termasuk penggunaan murni sebagai wrapper layout dengan hanya `className`, `children`, `data-*`, atau variant props — HARUS berjalan persis sama seperti sebelum perbaikan.

**Catatan:** Perilaku yang diinginkan setelah perbaikan (event handler inference yang benar) didefinisikan secara formal di bagian **Correctness Properties** di bawah.

---

## Hypothesized Root Cause

Berdasarkan analisis `types.ts`, penyebab utama bug dan rangkaian implikasinya adalah:

1. **Index Signature pada `StyledComponentProps` (Penyebab Langsung)**

   `StyledComponentProps` mendefinisikan `[key: string]: unknown`. Dalam sistem tipe TypeScript, ketika sebuah interface memiliki index signature, semua properti lain yang di-declare di interface tersebut harus kompatibel dengan tipe index signature. Lebih dari itu, ketika interface ini di-intersect (`&`) dengan `React.ComponentPropsWithoutRef<Tag>`, TypeScript menggunakan index signature sebagai "fallback" untuk semua key yang tidak disebutkan secara eksplisit dalam `StyledComponentProps` — termasuk semua event handler dari `React.ComponentPropsWithoutRef<Tag>`.

   ```typescript
   // Interface bermasalah
   export interface StyledComponentProps {
     className?: string
     as?: HtmlTagName
     children?: React.ReactNode
     [key: string]: unknown  // ← ini yang merusak segalanya
   }
   ```

2. **Call Signature `TwStyledComponent` Menggunakan `StyledComponentProps` Langsung**

   ```typescript
   // Saat ini — Tag tidak diketahui di level call signature
   (props: StyledComponentProps & InferVariantProps<Config> & InferSizeProps<Config> & InferStatesProps<Config>): React.ReactElement | null
   ```

   Karena `Tag` tidak ada sebagai parameter generic di level ini, bahkan jika kita mengganti `StyledComponentProps`, kita tidak bisa meng-inject `React.ComponentPropsWithoutRef<Tag>` — sehingga diperlukan penambahan parameter generic `Tag` di `TwStyledComponent`.

3. **`TwTemplateFactory` Tidak Propagate Tag ke `TwStyledComponent`**

   ```typescript
   // TwTagFactory mengiterasi HtmlTagName, tapi Tag tidak diteruskan ke TwStyledComponent
   export type TwTagFactory = {
     [K in HtmlTagName]: TwTemplateFactory  // TwTemplateFactory tidak punya generic Tag
   }
   ```

   Akibatnya, meski `tw.button` dipanggil, informasi bahwa tagnya adalah `"button"` hilang di level `TwStyledComponent`.

4. **`TwSubComponentAccessor` Sudah Benar — Menjadi Referensi**

   Menariknya, `TwSubComponentAccessor` sudah menggunakan pola yang tepat:
   ```typescript
   export type TwSubComponentAccessor<Tag extends HtmlTagName = "span"> =
     React.FC<Omit<React.ComponentPropsWithoutRef<Tag>, "ref"> & { ... }>
   ```
   Pola ini adalah referensi implementasi yang harus ditiru untuk `TwStyledComponent`.

---

## Correctness Properties

Property 1: Bug Condition — Inferensi Tipe Event Handler

_For any_ penggunaan komponen `tw.*` di mana `isBugCondition(X)` bernilai `true` (yaitu komponen `tw.*` menerima callback prop apa pun), fungsi yang telah diperbaiki SHALL menginfer tipe parameter event handler secara otomatis sebagai subtipe `React.SyntheticEvent` yang sesuai dengan tag HTML komponen — misalnya `React.ChangeEvent<HTMLInputElement>` untuk `tw.input`, `React.MouseEvent<HTMLButtonElement>` untuk `tw.button` — tanpa membutuhkan anotasi tipe manual dari pengguna, sebagaimana dapat diverifikasi oleh `tsc --noEmit` yang tidak menghasilkan error `'e' is of type 'unknown'`.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

Property 2: Preservation — Perilaku Non-Callback Props Tidak Berubah

_For any_ penggunaan komponen `tw.*` di mana `isBugCondition(X)` bernilai `false` (yaitu tidak melibatkan callback prop — hanya `className`, `children`, `data-*`, `aria-*`, variant props, states props, atau prop `as`), kode yang telah diperbaiki SHALL menghasilkan type checking behavior yang identik dengan kode asli, memastikan tidak ada regression pada penerimaan data attributes, variant inference, states inference, sub-component typing, dan runtime behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

---

## Fix Implementation

### Perubahan yang Diperlukan

Pendekatan perbaikan yang dipilih adalah **Pendekatan 3: Mengangkat `Tag` ke `TwStyledComponent` dan menghapus index signature dari `StyledComponentProps`**. Ini adalah pendekatan paling bersih karena:
- Mengikuti pola yang sudah benar di `TwSubComponentAccessor`
- Memungkinkan inferensi end-to-end dari `tw.button` → `TwStyledComponent<Config, S, TagMap, "button">` → props dengan `React.ComponentPropsWithoutRef<"button">`
- Tidak memerlukan conditional type atau mapped type yang kompleks untuk merge props

#### File: `packages/domain/core/src/types.ts`

**Perubahan 1: Hapus index signature dari `StyledComponentProps`**

```typescript
// SEBELUM (buggy)
export interface StyledComponentProps {
  className?: string
  as?: HtmlTagName
  children?: React.ReactNode
  [key: string]: unknown  // ← HAPUS INI
}

// SESUDAH (fixed)
export interface StyledComponentProps {
  className?: string
  as?: HtmlTagName
  children?: React.ReactNode
  // Tidak ada index signature — prop spesifik dari React.ComponentPropsWithoutRef<Tag>
  // akan di-inject via generic Tag di TwStyledComponent
}
```

**Perubahan 2: Tambah parameter generic `Tag` ke `TwStyledComponent`**

```typescript
// SEBELUM
export type TwStyledComponent<
  Config extends ComponentConfig = ComponentConfig,
  S extends string = string,
  TagMap extends Record<string, string> = Record<string, never>
> = {
  (props: StyledComponentProps & InferVariantProps<Config> & InferSizeProps<Config> & InferStatesProps<Config>): React.ReactElement | null
  // ...
}

// SESUDAH
export type TwStyledComponent<
  Config extends ComponentConfig = ComponentConfig,
  S extends string = string,
  TagMap extends Record<string, string> = Record<string, never>,
  Tag extends HtmlTagName = HtmlTagName   // ← parameter baru dengan default HtmlTagName
> = {
  (props:
    Omit<React.ComponentPropsWithoutRef<Tag>, keyof StyledComponentProps | keyof InferVariantProps<Config> | keyof InferSizeProps<Config> | keyof InferStatesProps<Config>>
    & StyledComponentProps
    & InferVariantProps<Config>
    & InferSizeProps<Config>
    & InferStatesProps<Config>
  ): React.ReactElement | null
  // ...
}
```

> **Catatan implementasi**: Penggunaan `Omit<React.ComponentPropsWithoutRef<Tag>, ...>` pada base mencegah konflik tipe antara prop yang sama di dua sumber (misalnya `className` yang ada di `StyledComponentProps` dan di `React.ComponentPropsWithoutRef<Tag>`). Alternatif yang lebih sederhana — langsung menggunakan intersection `React.ComponentPropsWithoutRef<Tag> & StyledComponentProps & ...` — mungkin cukup karena TypeScript menghitung intersection dengan benar selama tidak ada index signature yang ikut campur.

**Perubahan 3: Update `TwTemplateFactory` untuk propagate `Tag`**

`TwTemplateFactory` perlu menjadi generic terhadap `Tag` agar factory yang dibuat oleh `tw.button` dapat menghasilkan `TwStyledComponent<..., "button">`:

```typescript
// SEBELUM
export interface TwTemplateFactory<Config extends ComponentConfig = ComponentConfig> {
  <const T extends string>(strings: readonly [T], ...exprs: []): TwStyledComponent<Config, ExtractSubNames<T>>
  (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<Config, string>
  <C extends ComponentConfig>(config: C): TwStyledComponent<C, InferSubFromConfig<C>, ...>
}

// SESUDAH
export interface TwTemplateFactory<
  Config extends ComponentConfig = ComponentConfig,
  Tag extends HtmlTagName = HtmlTagName   // ← parameter baru
> {
  <const T extends string>(strings: readonly [T], ...exprs: []): TwStyledComponent<Config, ExtractSubNames<T>, Record<string, never>, Tag>
  (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<Config, string, Record<string, never>, Tag>
  <C extends ComponentConfig>(config: C): TwStyledComponent<
    C,
    InferSubFromConfig<C>,
    InferSubTagsFromConfig<C> extends Record<string, string> ? InferSubTagsFromConfig<C> : Record<string, never>,
    Tag
  >
}
```

**Perubahan 4: Update `TwTagFactory` untuk meneruskan `Tag` ke `TwTemplateFactory`**

```typescript
// SEBELUM
export type TwTagFactory = {
  [K in HtmlTagName]: TwTemplateFactory
}

// SESUDAH
export type TwTagFactory = {
  [K in HtmlTagName]: TwTemplateFactory<ComponentConfig, K>  // ← K diteruskan sebagai Tag
}
```

**Perubahan 5: Update return type `.extend()` dan `.withVariants()` di `TwStyledComponent`**

Kedua method ini harus mempertahankan parameter `Tag`:

```typescript
extend: {
  (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<Config, S, TagMap, Tag>
  (config: { ... }): TwStyledComponent<Config, S, TagMap, Tag>
}
withVariants: (config: Partial<Config>) => TwStyledComponent<Config, S, TagMap, Tag>
withSub<NewS extends string>(): TwStyledComponent<Config, NewS, TagMap, Tag>
animate: (opts: AnimateOptions) => Promise<TwStyledComponent<Config, S, TagMap, Tag>>
```

**Perubahan 6: Update `TwTagFactoryAny` (minor)**

```typescript
// TwTagFactoryAny dipakai untuk custom tag (tw(MyComponent)`...`)
// Default HtmlTagName sebagai Tag sudah tepat di sini
export type TwTagFactoryAny = {
  [key: string]: TwTemplateFactory  // tidak perlu propagate Tag — fallback ke default
}
```

### Pertimbangan Kompatibilitas TypeScript 6.0.2

- TypeScript 6.0 mendukung penuh generic default parameters di interfaces — aman digunakan.
- `Omit<React.ComponentPropsWithoutRef<Tag>, ...>` dengan generic `Tag` bekerja via distributive conditional types — sudah tersedia sejak TypeScript 2.8.
- Tidak ada fitur TypeScript >= 6.1 yang digunakan — aman untuk versi project (6.0.2).

### Batasan yang Diketahui

- **Prop `as` polymorphism**: Ketika pengguna menggunakan `<Button as="a" href="...">`, TypeScript masih menggunakan tipe dari tag asli (misalnya `"button"`) untuk inferensi event handler, bukan tipe dari tag `as`. Ini adalah trade-off yang dapat diterima — mendukung `as` polymorphism penuh memerlukan overloaded call signature yang jauh lebih kompleks (lihat implementasi di `styled-components` v6). Perilaku ini SAMA dengan kondisi sebelum perbaikan, jadi tidak ada regression.
- **Template literal tanpa expression**: `ExtractSubNames` sudah berfungsi untuk template tanpa expression — tidak ada perubahan di sini.

---

## Testing Strategy

### Validation Approach

Strategi pengujian mengikuti dua fase: pertama, memastikan bug terdokumentasi dan dapat direproduksi pada kode SEBELUM perbaikan (exploratory), kemudian memverifikasi bahwa perbaikan bekerja dan tidak memperkenalkan regression (fix checking + preservation checking).

Karena bug ini bersifat **type-level murni** (tidak ada runtime behavior yang berubah), semua pengujian dilakukan melalui TypeScript compiler (`tsc --noEmit`). Test yang "lulus" adalah kompilasi tanpa error; test yang "gagal" adalah kompilasi dengan error tipe yang diharapkan pada kasus yang salah, atau tanpa error pada kasus yang seharusnya error.

### Exploratory Bug Condition Checking

**Tujuan**: Mendokumentasikan dan mengonfirmasi bug pada kode yang BELUM diperbaiki. Menjalankan test ini pada kode buggy seharusnya menghasilkan error TypeScript atau nilai tipe yang salah.

**Test Plan**: Buat file TypeScript yang menggunakan komponen `tw.*` dengan callback props, lalu verifikasi bahwa TypeScript melaporkan error `'e' is of type 'unknown'` pada kode yang belum diperbaiki.

**Test Cases**:

1. **Test onChange pada tw.input** (akan gagal pada kode buggy — `e` bertipe `unknown`):
   ```typescript
   const Input = tw.input`border px-3`
   // Pada kode buggy: TypeScript tidak error di sini karena 'unknown'
   // dapat di-assign ke parameter callback
   const handler = (e: React.ChangeEvent<HTMLInputElement>) => e.target.value
   // Tapi ketika parameter TIDAK dianotasi, TypeScript implicitly any error:
   const buggyHandler = (e) => e.target.value  // Error: 'e' implicitly has type 'unknown'
   ;<Input onChange={buggyHandler} />
   ```

2. **Test onClick pada tw.button** (akan gagal pada kode buggy):
   ```typescript
   const Button = tw.button`px-4`
   ;<Button onClick={(e) => e.preventDefault()} />
   // Error pada kode buggy: 'e' is of type 'unknown'
   ```

3. **Test onKeyDown pada tw.div** (akan gagal pada kode buggy):
   ```typescript
   const Div = tw.div`flex`
   ;<Div onKeyDown={(e) => e.key} />
   // Error pada kode buggy: 'e' is of type 'unknown'
   ```

4. **Test prop type yang tidak valid** (harus error bahkan pada kode buggy, tapi tidak error karena index signature):
   ```typescript
   const Btn = tw.button`...`
   ;<Btn type="bukan-nilai-valid" />
   // Pada kode buggy: TIDAK ADA ERROR (seharusnya ada)
   // Setelah fix: HARUS ERROR
   ```

**Counterexample yang Diharapkan dari Kode Buggy**:
- `tsc --noEmit` dengan `noImplicitAny: true` akan melaporkan error pada parameter callback yang tidak dianotasi
- Tanpa `noImplicitAny`, TypeScript akan diam-diam menerima parameter `unknown` — justru lebih berbahaya karena tidak ada error

### Fix Checking

**Tujuan**: Verifikasi bahwa untuk semua input di mana `isBugCondition(X) = true`, kode yang diperbaiki menghasilkan tipe yang benar.

**Pseudocode:**
```
FOR ALL komponen C dari tag T IN HtmlTagName DO
  FOR ALL callback prop E IN React.ComponentPropsWithoutRef<T> DO
    result ← typeOf(parameter callback E pada komponen C)
    ASSERT result IS subtipe dari React.SyntheticEvent (BUKAN unknown)
    ASSERT result = tipe spesifik yang didefinisikan di React.ComponentPropsWithoutRef<T>[E]
  END FOR
END FOR
```

**Test Cases untuk Fix Checking**:

1. **tw.input + onChange**: Parameter harus bertipe `React.ChangeEvent<HTMLInputElement>`
2. **tw.button + onClick**: Parameter harus bertipe `React.MouseEvent<HTMLButtonElement>`
3. **tw.button + type prop**: Nilai `"text" | "submit" | "reset" | "button"` diterima; nilai lain harus error
4. **tw.a + href**: Prop `href` harus bertipe `string | undefined`
5. **tw.select + onChange**: Parameter harus bertipe `React.ChangeEvent<HTMLSelectElement>`
6. **tw.form + onSubmit**: Parameter harus bertipe `React.FormEvent<HTMLFormElement>`
7. **tw.textarea + onInput**: Parameter harus bertipe `React.FormEvent<HTMLTextAreaElement>`

### Preservation Checking

**Tujuan**: Verifikasi bahwa untuk semua input di mana `isBugCondition(X) = false`, kode yang diperbaiki menghasilkan type checking behavior yang identik dengan kode asli.

**Pseudocode:**
```
FOR ALL penggunaan X WHERE NOT isBugCondition(X) DO
  ASSERT typeCheck(tw-component SEBELUM fix)(X) = typeCheck(tw-component SETELAH fix)(X)
  // Artinya: jika sebelumnya tidak ada error, setelah fix juga tidak ada error
  // Jika sebelumnya ada error untuk nilai yang memang salah, setelah fix juga ada error
END FOR
```

**Testing Approach**: Property-based testing pada level TypeScript tidak tersedia secara native. Sebagai gantinya, digunakan kombinasi:
- **Unit type tests** menggunakan `tsc --noEmit` pada file fixture
- **Snapshot type tests** menggunakan `tsd` atau `expect-type` untuk memverifikasi tipe yang diinfer

**Test Cases untuk Preservation Checking**:

1. **data-* props diterima tanpa error** (sebelum dan sesudah fix harus sama — tidak ada error):
   ```typescript
   const Div = tw.div`flex`
   ;<Div data-testid="my-container" data-custom="value" />
   // Harus: tidak ada error TypeScript
   ```

2. **aria-* props diterima tanpa error**:
   ```typescript
   const Button = tw.button`px-4`
   ;<Button aria-label="Tutup dialog" aria-expanded={false} />
   // Harus: tidak ada error TypeScript
   ```

3. **className dan children tetap berfungsi**:
   ```typescript
   const Card = tw.div`rounded shadow`
   ;<Card className="extra-class"><span>isi</span></Card>
   // Harus: tidak ada error TypeScript
   ```

4. **Variant props tetap berfungsi**:
   ```typescript
   const Button = tw.button({ variants: { intent: { primary: "bg-blue-500" } } })
   ;<Button intent="primary" />    // ✓ OK
   ;<Button intent="invalid" />   // ✓ Error (tetap seperti sebelumnya)
   ```

5. **States props tetap berfungsi**:
   ```typescript
   const Button = tw.button({ states: { loading: "opacity-50", fullWidth: "w-full" } })
   ;<Button loading fullWidth />  // ✓ OK — prop boolean
   ```

6. **Prop `as` tetap diterima**:
   ```typescript
   const Button = tw.button`px-4`
   ;<Button as="a" href="/halaman" />  // ✓ OK
   ```

7. **Sub-component typing tetap benar**:
   ```typescript
   const Card = tw.div({ sub: { "a:link": "text-blue-500" } })
   ;<Card.link href="/target" />  // ✓ href dari <a>
   ```

8. **`.extend()` tetap menghasilkan tipe yang benar**:
   ```typescript
   const Base = tw.input`border px-3`
   const Extended = Base.extend`focus:ring-2`
   ;<Extended onChange={(e) => e.target.value} />  // ✓ e: React.ChangeEvent<HTMLInputElement>
   ```

### Unit Tests

- Verifikasi `onChange` pada `tw.input` menginfer `React.ChangeEvent<HTMLInputElement>`
- Verifikasi `onClick` pada `tw.button` menginfer `React.MouseEvent<HTMLButtonElement>`
- Verifikasi `onSubmit` pada `tw.form` menginfer `React.FormEvent<HTMLFormElement>`
- Verifikasi `type` prop pada `tw.button` hanya menerima nilai yang valid
- Verifikasi `href` prop pada `tw.a` bertipe `string | undefined`
- Verifikasi `data-testid` diterima tanpa error
- Verifikasi `aria-label` diterima tanpa error
- Verifikasi variant props tidak konflik dengan event props

### Property-Based Tests

- Untuk setiap tag `T` dalam subset `HtmlTagName`, verifikasi bahwa komponen `tw.T` menerima semua props dari `React.ComponentPropsWithoutRef<T>` tanpa error
- Untuk setiap event handler `E` pada `React.ComponentPropsWithoutRef<T>`, verifikasi parameter callback bertipe `Parameters<NonNullable<React.ComponentPropsWithoutRef<T>[E]>>[0]`
- Verifikasi bahwa untuk setiap kombinasi (variant props ✕ event props ✕ data-* props), tidak ada konflik tipe yang muncul

### Integration Tests

- Test full workflow: membuat komponen `tw.input` dengan variant, states, dan callback — semuanya harus bekerja bersama tanpa konflik
- Test komponen yang menggunakan `.extend()` berantai — tipe event handler harus terpropagasi ke seluruh rantai
- Test contoh penggunaan di `examples/next-js-app` — `tsc --noEmit` pada example harus lulus tanpa error baru
- Test backward compatibility: semua test existing di `packages/domain/core/tests/` harus tetap lulus
