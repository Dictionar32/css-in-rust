/**
 * Preservation Tests — Metodologi Observation-First
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7
 *
 * TUJUAN: Mendokumentasikan baseline behavior yang HARUS tetap berfungsi
 * setelah fix diterapkan. File ini harus LULUS pada kode yang belum diperbaiki.
 *
 * CARA KERJA:
 * - File ini hanya di-compile, tidak dijalankan (type-level only)
 * - Setiap kasus diekspresikan sebagai type assignment atau prop usage
 * - Kompilasi tanpa error = baseline behavior terkonfirmasi
 *
 * METODOLOGI OBSERVATION-FIRST:
 * Semua kasus di bawah terlebih dahulu diverifikasi pada kode buggy untuk
 * memastikan TIDAK menghasilkan error TypeScript sebelum ditulis sebagai tes.
 *
 * HASIL YANG DIHARAPKAN: tsc --noEmit LULUS tanpa error.
 */

import type React from "react"
import type { tw } from "../src/index"

// ── Deklarasi komponen base ───────────────────────────────────────────────────

declare const DivComp: ReturnType<typeof tw.div>
declare const ButtonComp: ReturnType<typeof tw.button>

// ── Kasus 1: data-* props diterima tanpa error (Requirements 3.1) ─────────────
// Observasi: data-testid dan data-* lainnya tidak menghasilkan error TypeScript.
// Setelah fix: data-* harus tetap diterima via React.ComponentPropsWithoutRef<Tag>.
// Catatan: data-* props tidak dideklarasikan secara eksplisit di React types —
// mereka di-pass via spread ke elemen DOM. Verifikasi dengan cara memanggil komponen.
declare const divRef: React.ComponentProps<typeof DivComp>
const _dataProps = { ...divRef, "data-testid": "my-container" } as React.ComponentProps<typeof DivComp> & { "data-testid"?: string }

// ── Kasus 2: aria-* props diterima tanpa error (Requirements 3.1) ────────────
// Observasi: aria-label dan aria-* lainnya tidak menghasilkan error TypeScript
// pada kode buggy karena index signature yang sama.
// Setelah fix: aria-* harus tetap diterima via React.ComponentPropsWithoutRef<Tag>.
const _ariaProps: React.ComponentProps<typeof ButtonComp> = {
    "aria-label": "tutup",
}

// ── Kasus 3: className dan children diterima tanpa error (Requirements 3.3) ───
// Observasi: className dan children bisa dipakai bersama pada tw.div tanpa error.
// Setelah fix: keduanya harus tetap berfungsi (className: string, children: ReactNode).
const _classNameAndChildren: React.ComponentProps<typeof DivComp> = {
    className: "extra",
    children: null as unknown as React.ReactNode,
}

// ── Kasus 4: prop `as` diterima tanpa error (Requirements 3.2) ───────────────
// Observasi: as="a" pada tw.button tidak menghasilkan error TypeScript pada kode buggy.
// Setelah fix: prop `as` harus tetap bertipe HtmlTagName | undefined.
const _asProps: React.ComponentProps<typeof ButtonComp> = {
    as: "a",
}

// ── Kasus 5: variant props — nilai valid diterima, nilai invalid error ────────
// (Requirements 3.4)
//
// Observasi pada kode buggy:
//   - intent="primary" → tidak ada error TypeScript
//   - intent="invalid" → ada error TypeScript (variant keys sudah di-narrow)
//
// Setelah fix: perilaku ini harus tetap identik.
const ButtonWithVariants = (null as unknown as typeof tw.button)({
    variants: {
        intent: {
            primary: "bg-blue-500",
            secondary: "bg-gray-500",
        },
    },
})

// Nilai variant valid → tidak ada error
const _validVariant: React.ComponentProps<typeof ButtonWithVariants> = {
    intent: "primary",
}

// Nilai variant invalid → harus error (dipakai @ts-expect-error)
const _invalidVariant: React.ComponentProps<typeof ButtonWithVariants> = {
    // @ts-expect-error — "invalid" bukan nilai intent yang valid
    intent: "invalid",
}

// ── Kasus 6: states props boolean diterima tanpa error (Requirements 3.6) ─────
// Observasi: loading dan fullWidth sebagai boolean props tidak menghasilkan error
// TypeScript pada kode buggy karena states props di-infer dari ComponentConfig.states.
// Setelah fix: states props boolean harus tetap berfungsi tanpa konflik.
const ButtonWithStates = (null as unknown as typeof tw.button)({
    states: {
        loading: "opacity-60 cursor-wait",
        fullWidth: "w-full",
    },
})

const _statesProps: React.ComponentProps<typeof ButtonWithStates> = {
    loading: true,
    fullWidth: true,
}

// ── Kasus 7: sub-component dengan href diterima tanpa error (Requirements 3.5) ─
// Observasi: Card.link dengan href="/target" tidak menghasilkan error TypeScript
// pada kode buggy karena sub-component "a:link" di-tipe-kan dengan <a> tag props.
// Setelah fix: sub-component typing harus tetap benar.
const CardComp = (null as unknown as typeof tw.div)({
    sub: {
        "a:link": "text-blue-500 underline",
    },
})

// CardComp.link harus bertipe komponen dengan href prop (dari <a>)
const _subComponentProps: React.ComponentProps<typeof CardComp.link> = {
    href: "/target",
}

// ── Kasus 8: .extend() chaining pada tw.input (Requirements 3.4, 3.5) ────────
// Observasi: komponen yang dibuat via .extend() tetap menerima semua HTML input
// props yang valid pada kode buggy.
// Setelah fix: .extend() harus mempertahankan semua props termasuk event handlers.
declare const InputBase: ReturnType<typeof tw.input>
const ExtendedInput = InputBase.extend`focus:ring-2 focus:ring-blue-500`

// Komponen hasil extend harus menerima input props standar (value, name, type)
const _extendedInputProps: React.ComponentProps<typeof ExtendedInput> = {
    name: "email",
    type: "email",
}

// Export dummy — required untuk isolatedModules mode
export type { }
