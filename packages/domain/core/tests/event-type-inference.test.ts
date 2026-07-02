/**
 * Bug Condition Exploration Test — Event Handler Type Inference
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 *
 * TUJUAN: Membuktikan bug ada pada kode SEBELUM diperbaiki.
 * File ini adalah type-level only test — tidak ada runtime assertions.
 *
 * CARA KERJA:
 * - Kasus 1–3: assignment tipe event handler spesifik ke variabel bertipe spesifik.
 *   Pada kode buggy: tsc error karena prop parameter bertipe `unknown` tidak
 *   kompatibel dengan tipe event React yang spesifik.
 *   Setelah fix: tsc lulus karena tipe sudah diinfer dengan benar.
 *
 * - Kasus 4: @ts-expect-error sebelum `type="invalid-value-not-allowed"` pada tw.button.
 *   Pada kode buggy: tidak ada error TypeScript (index signature mengizinkan semua key),
 *   sehingga @ts-expect-error menjadi "unused" → tsc error "Unused '@ts-expect-error' directive".
 *   Setelah fix: type="invalid-value-not-allowed" memang error → @ts-expect-error digunakan
 *   dengan benar → tsc lulus.
 *
 * HASIL YANG DIHARAPKAN pada kode buggy: tsc melaporkan error (GAGAL = BUG ADA).
 * HASIL YANG DIHARAPKAN setelah fix: tsc lulus tanpa error (LULUS = BUG FIXED).
 */

import type React from "react"
import type { tw } from "../src/index"

// ── Deklarasi tipe komponen dari masing-masing tag ────────────────────────────

declare const InputComp: ReturnType<typeof tw.input>
declare const ButtonComp: ReturnType<typeof tw.button>
declare const DivComp: ReturnType<typeof tw.div>

// ── Kasus 1: tw.input + onChange ─────────────────────────────────────────────
// Bug: prop `onChange` pada tw.input memiliki tipe `unknown` karena index signature
// `[key: string]: unknown` pada StyledComponentProps mengoverride semua prop spesifik.
//
// Baris di bawah akan ERROR pada kode buggy karena:
//   Type 'unknown' is not assignable to type
//   'ChangeEventHandler<HTMLInputElement> | undefined'
//
// Setelah fix: onChange bertipe sesuai React.ComponentPropsWithoutRef<"input">
// sehingga assignment ini valid dan tidak ada error.
const _testOnChange: React.ComponentPropsWithoutRef<"input">["onChange"] =
    (null as unknown as React.ComponentProps<typeof InputComp>)["onChange"]

// ── Kasus 2: tw.button + onClick ─────────────────────────────────────────────
// Bug: prop `onClick` pada tw.button bertipe `unknown`.
//
// Baris di bawah akan ERROR pada kode buggy dengan alasan yang sama.
// Setelah fix: onClick bertipe React.MouseEventHandler<HTMLButtonElement>.
const _testOnClick: React.ComponentPropsWithoutRef<"button">["onClick"] =
    (null as unknown as React.ComponentProps<typeof ButtonComp>)["onClick"]

// ── Kasus 3: tw.div + onKeyDown ──────────────────────────────────────────────
// Bug: prop `onKeyDown` pada tw.div bertipe `unknown`.
//
// Baris di bawah akan ERROR pada kode buggy.
// Setelah fix: onKeyDown bertipe React.KeyboardEventHandler<HTMLDivElement>.
const _testOnKeyDown: React.ComponentPropsWithoutRef<"div">["onKeyDown"] =
    (null as unknown as React.ComponentProps<typeof DivComp>)["onKeyDown"]

// ── Kasus 4: tw.button + type="invalid" seharusnya error ─────────────────────
// Bug: index signature [key: string]: unknown mengizinkan nilai apapun untuk
// setiap prop, termasuk type="invalid-value-not-allowed" yang seharusnya ditolak.
//
// Directive di bawah DIHARAPKAN menjadi "unused" pada kode buggy
// (karena tidak ada error TypeScript — index signature memperbolehkan value apapun),
// sehingga tsc melaporkan: "Unused ts-expect-error directive"
//
// Setelah fix: type="invalid-value-not-allowed" memang error TypeScript, sehingga
// directive digunakan dengan benar dan tsc lulus.
// @ts-expect-error — Bug: pada kode buggy, nilai ini TIDAK menghasilkan error (seharusnya error)
const _invalidButton = ButtonComp({ type: "invalid-value-not-allowed" })

// Export dummy — required untuk isolatedModules mode
export type { }
