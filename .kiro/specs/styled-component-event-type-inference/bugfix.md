# Dokumen Persyaratan Bugfix

## Introduction

`StyledComponentProps` di `packages/domain/core/src/types.ts` saat ini mendefinisikan index signature `[key: string]: unknown`. Index signature ini memungkinkan forward props arbitrer ke elemen HTML yang mendasarinya, namun sebagai efek samping TypeScript tidak dapat mempersempit tipe callback props seperti `onChange`, `onClick`, `onKeyDown`, dan sejenisnya — karena index signature mengoverride resolusi prop dari `React.ComponentPropsWithoutRef<Tag>`.

Akibatnya, setiap parameter event handler pada komponen `tw.*` memiliki tipe `unknown`, bukan tipe React event yang spesifik sesuai HTML tag (misalnya `React.ChangeEvent<HTMLInputElement>`). Hal ini memaksa pengguna melakukan anotasi tipe manual pada setiap callback, yang merusak pengalaman developer dan menghilangkan nilai utama dari type-safe styled components.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 KETIKA pengguna mendefinisikan komponen `tw` dari tag HTML mana pun yang didukung `HtmlTagName` (termasuk `input`, `button`, `select`, `textarea`) DAN menyediakan callback props seperti `onChange`, `onClick`, `onKeyDown`, `onSubmit`, `onFocus`, atau `onBlur` MAKA sistem SHALL memberikan tipe `unknown` pada parameter event handler tersebut — bukan tipe event React yang dihasilkan oleh `React.ComponentPropsWithoutRef<Tag>` — sebagaimana dapat diverifikasi melalui TypeScript compiler type-check (tsc --noEmit) yang menghasilkan error "Parameter implicitly has an 'unknown' type".

1.2 KETIKA pengguna menulis `<Input onChange={(e) => e.target.value} />` di mana `Input = tw.input\`...\`` MAKA sistem menghasilkan error TypeScript `'e' is of type 'unknown'` sehingga akses ke properti seperti `e.target`, `e.currentTarget`, `e.key`, dan `e.preventDefault()` tidak tersedia tanpa type assertion manual.

1.3 KETIKA pengguna menyediakan props callback yang berasal dari `React.ComponentPropsWithoutRef<Tag>` (misalnya `onFocus`, `onBlur`, `onMouseEnter`) pada komponen `tw.*` MAKA sistem tidak dapat mempersempit tipe parameter callback tersebut karena index signature `[key: string]: unknown` pada `StyledComponentProps` mengoverride inferensi dari union type dengan prop spesifik.

1.4 KETIKA komponen `tw.*` menerima props yang merupakan tipe literal (misalnya `type="submit"` untuk `tw.button`, `href` untuk `tw.a`) MAKA sistem mengizinkan nilai yang tidak valid tanpa error TypeScript karena index signature memungkinkan nilai `unknown` untuk semua key.

### Expected Behavior (Correct)

2.1 KETIKA pengguna mendefinisikan komponen `tw` dari tag HTML mana pun (semua tag dalam `HtmlTagName`) DAN menyediakan callback props MAKA sistem SHALL menginfer tipe parameter event handler secara otomatis berdasarkan `React.ComponentPropsWithoutRef<Tag>` — tanpa membutuhkan anotasi tipe manual dari pengguna — dan perbaikan ini SHALL bersifat murni compile-time (tidak ada perubahan runtime behavior).

2.2 KETIKA pengguna menulis `<Input onChange={(e) => e.target.value} />` di mana `Input = tw.input\`...\`` MAKA sistem SHALL menginfer tipe `e` sebagai persis `React.ChangeEvent<HTMLInputElement>` — yang mencakup akses ke `e.target`, `e.currentTarget`, `e.preventDefault()`, dan semua properti lain dari `React.ChangeEvent<HTMLInputElement>` — tanpa error TypeScript, sebagaimana dapat diverifikasi melalui `tsc --noEmit`.

2.3 KETIKA pengguna menyediakan props callback yang berasal dari `React.ComponentPropsWithoutRef<Tag>` pada komponen `tw.*` MAKA sistem SHALL mempersempit tipe parameter callback tersebut secara penuh sesuai definisi tipe React untuk tag HTML yang bersangkutan.

2.4 KETIKA komponen `tw.*` menerima prop spesifik tag (misalnya `type` untuk `tw.button`, `href` untuk `tw.a`, `src` untuk `tw.img`) MAKA sistem SHALL memvalidasi nilai prop tersebut sesuai `React.ComponentPropsWithoutRef<Tag>` dan melaporkan error TypeScript apabila nilai tidak valid.

2.5 KETIKA pengguna meneruskan props HTML arbitrer (termasuk `data-*`, `aria-*`, dan atribut HTML standar) ke komponen `tw.*` MAKA sistem SHALL CONTINUE TO meneruskan prop tersebut ke elemen yang dirender tanpa error TypeScript compile-time, sehingga kemampuan forward arbitrary props tidak hilang akibat perbaikan ini.

### Unchanged Behavior (Regression Prevention)

3.1 KETIKA pengguna meneruskan prop kustom arbitrer (misalnya `data-testid`, `aria-label`, `data-custom`) ke komponen `tw.*` MAKA sistem SHALL CONTINUE TO meneruskan prop tersebut ke elemen HTML yang mendasarinya tanpa error TypeScript compile-time — dapat diverifikasi dengan `tsc --noEmit` pada file yang menggunakan `data-testid` atau `aria-*` props.

3.2 KETIKA pengguna menggunakan prop `as` untuk mengganti tag HTML yang dirender (misalnya `<Button as="a" href="...">`) MAKA sistem SHALL CONTINUE TO merender elemen dengan tag yang ditentukan dan meneruskan semua props dari `React.ComponentPropsWithoutRef` tag baru tersebut ke elemen yang dirender.

3.3 KETIKA pengguna menggunakan `className` dan `children` sebagai props pada komponen `tw.*` MAKA sistem SHALL CONTINUE TO menerima `className` sebagai `string | undefined` dan `children` sebagai `React.ReactNode`, serta meneruskan keduanya ke elemen HTML yang mendasarinya.

3.4 KETIKA pengguna menggunakan sistem variant (`cv`, `variants`, `defaultVariants`) pada komponen `tw.*` MAKA sistem SHALL CONTINUE TO menginfer tipe variant props dari definisi `variants` config — menerima nilai variant yang terdaftar dan menghasilkan error TypeScript compile-time untuk nilai yang tidak terdaftar — tanpa konflik dengan tipe event handler yang diperbaiki.

3.5 KETIKA pengguna menggunakan sistem sub-component (misalnya `Card.header`, `Breadcrumb.link`) MAKA sistem SHALL CONTINUE TO memberikan tipe `React.ComponentPropsWithoutRef<Tag>` yang sesuai tag yang di-render untuk setiap sub-component, termasuk event handler inference yang benar.

3.6 KETIKA pengguna menggunakan prop `states` berbasis boolean (misalnya `loading`, `fullWidth`) yang didefinisikan dalam `ComponentConfig.states` MAKA sistem SHALL CONTINUE TO menginfer props tersebut sebagai `boolean | undefined` tanpa konflik dengan event handler props dari `React.ComponentPropsWithoutRef<Tag>`.

3.7 KETIKA library digunakan di lingkungan browser (bundle yang tidak menyertakan native Rust binding) MAKA sistem SHALL CONTINUE TO berfungsi secara runtime tanpa error, karena perbaikan ini bersifat murni type-level dan tidak mengubah JavaScript yang diemit.

---

## Derivasi Bug Condition

**Bug Condition Function:**

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type ComponentUsage
  OUTPUT: boolean

  // Bug terpicu saat komponen tw.* digunakan dengan callback prop apa pun
  RETURN X.component IS tw-styled-component
    AND X.prop IS callback-prop (onChange | onClick | onKeyDown | onFocus | onBlur | ...)
END FUNCTION
```

**Property — Fix Checking:**

```pascal
// Property: Inferensi Tipe Event Handler
FOR ALL X WHERE isBugCondition(X) DO
  result ← typeOf(X.prop parameter di TypeScript)
  ASSERT result = React.SyntheticEvent subtype sesuai tag (BUKAN unknown)
END FOR
```

**Property — Preservation Checking:**

```pascal
// Property: Preservasi Perilaku Non-Buggy
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT behavior(tw-component SEBELUM fix)(X) = behavior(tw-component SETELAH fix)(X)
END FOR
```
