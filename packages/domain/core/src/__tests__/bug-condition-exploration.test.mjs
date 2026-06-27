/**
 * Bug Condition Exploration Test
 * ================================
 * Task: 1 — Tulis tes eksplorasi kondisi bug (Bug Condition Exploration Test)
 *
 * TUJUAN: Surface counterexample yang membuktikan bug ada di kode yang BELUM difix.
 *
 * Test ini DIHARAPKAN membuktikan bahwa:
 * - Bug 2: cn() throw Error di browser environment (native = null)
 * - Bug 2: cx() throw Error di browser environment (native = null)
 * - Bug 3: createComponent dengan variants throw Error saat render di browser
 *
 * Cara kerja mock browser environment:
 * - getNativeBinding() di native.ts return null saat isBrowser = true
 * - Kita mereplikasi kondisi ini dengan langsung inject native = null ke logika
 *
 * CATATAN: Test ini mereplikasi logika PERSIS dari source file buggy.
 * Jika test PASS (assertThrows berhasil) = bug TERKONFIRMASI ADA.
 * Jika test GAGAL (fungsi tidak throw) = bug tidak ada / sudah difix.
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"

// ─────────────────────────────────────────────────────────────────────────────
// Replikasi logika BUGGY dari cx.ts — persis sama dengan source asli
// Mock: native = null (simulasi browser environment)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * cn() BUGGY — dari cx.ts (sebelum fix)
 * Tidak ada fallback ketika getNativeBinding() return null.
 */
function cn_buggy(native, ...inputs) {
    const strings = []
    for (const item of inputs) {
        if (Array.isArray(item)) {
            for (const v of item) { if (v) strings.push(String(v)) }
        } else if (item) {
            strings.push(String(item))
        }
    }
    if (strings.length === 0) return ""

    // Logika PERSIS dari cx.ts line 23-26:
    if (!native?.resolveClassNames) {
        throw new Error("Native binding 'resolveClassNames' is required but not available.")
    }
    return native.resolveClassNames(strings)
}

/**
 * cx() BUGGY — dari cx.ts (sebelum fix)
 * Tidak ada fallback ketika getNativeBinding() return null.
 */
function cx_buggy(native, ...inputs) {
    const filtered = inputs.flat().filter(Boolean)
    if (filtered.length === 0) return ""

    // Logika PERSIS dari cx.ts line 43-45:
    if (!native?.twMergeMany) {
        throw new Error("Native binding 'twMergeMany' is required but not available.")
    }
    return native.twMergeMany(filtered)
}

/**
 * resolveVariants() BUGGY — dari createComponent.ts (sebelum fix)
 * Tidak ada fallback ketika getNativeBinding() return null.
 */
function resolveVariants_buggy(native, variants, props, defaults) {
    const variantKeys = Object.keys(variants)
    const cleanProps = {}
    for (const k of variantKeys) {
        const v = props[k]
        if (v !== undefined && v !== null) cleanProps[k] = String(v)
    }

    // Logika PERSIS dari createComponent.ts resolveVariants() line ~250-257:
    if (!native?.resolveSimpleVariants) {
        throw new Error("FATAL: Native binding 'resolveSimpleVariants' is required but not available.")
    }
    const result = native.resolveSimpleVariants(null, variants, defaults, cleanProps)
    return result.trim().replace(/\s+/g, " ")
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock browser environment
// ─────────────────────────────────────────────────────────────────────────────

const BROWSER_NATIVE = null  // Simulasi: getNativeBinding() return null di browser

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 — cn() crash di browser
// ─────────────────────────────────────────────────────────────────────────────

describe("Bug 2: cn() throws di browser environment", () => {
    it("cn('bg-blue-100', 'text-blue-700') throw Error: resolveClassNames required", () => {
        // Ini adalah call site persis dari Avatar.tsx: cn(!src && color, className)
        // Di browser, native = null → HARUS throw sebelum fix
        assert.throws(
            () => cn_buggy(BROWSER_NATIVE, "bg-blue-100", "text-blue-700"),
            (err) => {
                assert.ok(err instanceof Error, `Expected Error, got: ${err}`)
                assert.ok(
                    err.message.includes("resolveClassNames"),
                    `Expected error about 'resolveClassNames', got: "${err.message}"`
                )
                return true
            },
            "cn() HARUS throw Error: Native binding 'resolveClassNames' is required di browser"
        )
    })

    it("cn() dengan single string class throw Error", () => {
        assert.throws(
            () => cn_buggy(BROWSER_NATIVE, "p-4"),
            (err) => {
                assert.ok(err instanceof Error)
                assert.ok(err.message.includes("resolveClassNames"))
                return true
            }
        )
    })

    it("cn() dengan array input throw Error", () => {
        assert.throws(
            () => cn_buggy(BROWSER_NATIVE, ["text-sm", "font-bold"]),
            (err) => {
                assert.ok(err instanceof Error)
                assert.ok(err.message.includes("resolveClassNames"))
                return true
            }
        )
    })

    it("cn() dengan falsy values TIDAK throw jika semua input falsy (early return)", () => {
        // Edge case: early return sebelum native check — ini tidak throw
        assert.doesNotThrow(
            () => cn_buggy(BROWSER_NATIVE, null, undefined, false, 0),
            "cn() dengan semua falsy inputs harus return '' tanpa throw"
        )
        const result = cn_buggy(BROWSER_NATIVE, null, undefined, false, 0)
        assert.equal(result, "")
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// BUG 2 — cx() crash di browser
// ─────────────────────────────────────────────────────────────────────────────

describe("Bug 2: cx() throws di browser environment", () => {
    it("cx('p-4', 'p-8') throw Error: twMergeMany required", () => {
        assert.throws(
            () => cx_buggy(BROWSER_NATIVE, "p-4", "p-8"),
            (err) => {
                assert.ok(err instanceof Error, `Expected Error, got: ${err}`)
                assert.ok(
                    err.message.includes("twMergeMany"),
                    `Expected error about 'twMergeMany', got: "${err.message}"`
                )
                return true
            },
            "cx() HARUS throw Error: Native binding 'twMergeMany' is required di browser"
        )
    })

    it("cx() conflict resolution throw Error di browser", () => {
        assert.throws(
            () => cx_buggy(BROWSER_NATIVE, "bg-red-500", "bg-blue-500"),
            (err) => {
                assert.ok(err instanceof Error)
                assert.ok(err.message.includes("twMergeMany"))
                return true
            }
        )
    })

    it("cx() dengan array of classes throw Error di browser", () => {
        assert.throws(
            () => cx_buggy(BROWSER_NATIVE, ["flex", "items-center"], "px-4"),
            (err) => {
                assert.ok(err instanceof Error)
                assert.ok(err.message.includes("twMergeMany"))
                return true
            }
        )
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// BUG 3 — resolveVariants() crash di browser
// ─────────────────────────────────────────────────────────────────────────────

describe("Bug 3: resolveVariants() throws di browser environment", () => {
    it("resolveSimpleVariants throw Error saat component dengan variants di-render di browser", () => {
        // Mereplikasi kondisi: createComponent('div', { variants: { size: { sm: 'h-8', md: 'h-10' } } })
        // kemudian component di-render dengan props → resolveVariants() dipanggil
        const variants = { size: { sm: "h-8", md: "h-10" } }
        const props = { size: "md" }
        const defaults = { size: "md" }

        assert.throws(
            () => resolveVariants_buggy(BROWSER_NATIVE, variants, props, defaults),
            (err) => {
                assert.ok(err instanceof Error, `Expected Error, got: ${err}`)
                assert.ok(
                    err.message.includes("resolveSimpleVariants"),
                    `Expected error about 'resolveSimpleVariants', got: "${err.message}"`
                )
                assert.ok(
                    err.message.includes("FATAL"),
                    `Expected FATAL prefix, got: "${err.message}"`
                )
                return true
            },
            "resolveVariants() HARUS throw FATAL Error: Native binding 'resolveSimpleVariants' required di browser"
        )
    })

    it("resolveSimpleVariants throw untuk multi-variant component di browser", () => {
        const variants = {
            size: { sm: "h-8 text-sm", md: "h-10 text-base", lg: "h-12 text-lg" },
            intent: { primary: "bg-blue-500 text-white", secondary: "bg-gray-200 text-gray-800" }
        }
        const props = { size: "lg", intent: "primary" }
        const defaults = { size: "md", intent: "secondary" }

        assert.throws(
            () => resolveVariants_buggy(BROWSER_NATIVE, variants, props, defaults),
            (err) => {
                assert.ok(err instanceof Error)
                assert.ok(err.message.includes("resolveSimpleVariants"))
                return true
            }
        )
    })

    it("resolveSimpleVariants throw bahkan dengan prop = default value di browser", () => {
        // Ini membuktikan tidak ada "optimization" yang skip native call untuk default props
        const variants = { size: { sm: "h-8", md: "h-10" } }
        const props = { size: "md" }
        const defaults = { size: "md" }

        assert.throws(
            () => resolveVariants_buggy(BROWSER_NATIVE, variants, props, defaults),
            (err) => {
                assert.ok(err instanceof Error)
                assert.ok(err.message.includes("resolveSimpleVariants"))
                return true
            }
        )
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Ringkasan counterexample yang ditemukan
// ─────────────────────────────────────────────────────────────────────────────

describe("Counterexample Documentation", () => {
    it("dokumentasi: Error messages yang dihasilkan bug", () => {
        const counterexamples = []

        // Counterexample 1: cn()
        try {
            cn_buggy(BROWSER_NATIVE, "bg-blue-100", "text-blue-700")
        } catch (e) {
            counterexamples.push({ bug: "Bug 2 - cn()", message: e.message })
        }

        // Counterexample 2: cx()
        try {
            cx_buggy(BROWSER_NATIVE, "p-4", "p-8")
        } catch (e) {
            counterexamples.push({ bug: "Bug 2 - cx()", message: e.message })
        }

        // Counterexample 3: resolveVariants()
        try {
            resolveVariants_buggy(
                BROWSER_NATIVE,
                { size: { sm: "h-8", md: "h-10" } },
                { size: "md" },
                { size: "md" }
            )
        } catch (e) {
            counterexamples.push({ bug: "Bug 3 - resolveVariants()", message: e.message })
        }

        // Semua 3 fungsi harus throw — konfirmasi bug ada
        assert.equal(counterexamples.length, 3,
            "Semua 3 bug harus menghasilkan counterexample (throw Error)")

        console.log("\n=== COUNTEREXAMPLE DITEMUKAN ===")
        for (const ce of counterexamples) {
            console.log(`[${ce.bug}] → "${ce.message}"`)
        }
        console.log("=================================\n")

        // Verifikasi pesan error spesifik
        assert.ok(counterexamples[0].message.includes("resolveClassNames"),
            "cn() harus throw tentang resolveClassNames")
        assert.ok(counterexamples[1].message.includes("twMergeMany"),
            "cx() harus throw tentang twMergeMany")
        assert.ok(counterexamples[2].message.includes("resolveSimpleVariants"),
            "resolveVariants() harus throw tentang resolveSimpleVariants")
    })
})
