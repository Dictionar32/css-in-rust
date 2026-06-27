/**
 * tailwind-styled-v4 v2 — cx / cn
 *
 * Native Rust binding dipakai di Node.js/SSR untuk performa maksimal.
 *
 * Browser fallback (Bug 2 — "Native binding 'resolveClassNames' is required
 * but not available." crash di browser):
 *
 * getNativeBinding() return `null` di browser (bukan throw). Ketika itu terjadi
 * kita gunakan pure-TS fallback yang semantiknya identik dengan implementasi Rust:
 * - cn(): filter falsy + join spasi (identik dengan resolve_class_names di Rust)
 * - cx(): conflict-aware merge via twMergeRawJs (port dari tw_merge.rs)
 * - cxn(): flatten nested array + filter falsy + join spasi
 *
 * Server path TIDAK DIUBAH: throw Error tetap dijalankan jika native null di
 * Node.js (menandakan miskonfigurasi). Fallback hanya aktif saat isBrowser=true.
 */

import { getNativeBinding } from "./native"
import { twMergeRawJs } from "./mergeFallback"

type ClassValue = string | undefined | null | false | 0

/**
 * cn — simple class name joiner (no conflict resolution).
 * Node.js: delegates ke Rust `resolve_class_names`.
 * Browser: pure-TS fallback — filter falsy + join spasi.
 *
 * @example cn("p-4", isActive && "opacity-100") → "p-4 opacity-100"
 */
export function cn(...inputs: (ClassValue | ClassValue[])[]): string {
  const strings: string[] = []
  for (const item of inputs) {
    if (Array.isArray(item)) {
      for (const v of item) { if (v) strings.push(String(v)) }
    } else if (item) {
      strings.push(String(item))
    }
  }
  if (strings.length === 0) return ""

  const native = getNativeBinding()
  if (native?.resolveClassNames) {
    // Server/Node.js path — gunakan native Rust binding
    return native.resolveClassNames(strings)
  }
  if (native !== null) {
    // Native tersedia tapi resolveClassNames tidak — Node.js miskonfigurasi
    throw new Error("Native binding 'resolveClassNames' is required but not available.")
  }
  // Browser fallback — native = null (expected di browser)
  // Semantik identik: filter falsy values + join dengan spasi
  return strings.filter(Boolean).join(" ")
}

/**
 * cx — conflict-aware class merger.
 * Node.js: delegates ke Rust `tw_merge_many`.
 * Browser: pure-TS fallback via twMergeRawJs (port algoritma Rust).
 *
 * @example cx("p-4 p-8")                        → "p-8"
 * @example cx("bg-red-500", "bg-blue-500")       → "bg-blue-500"
 * @example cx(["flex", "items-center"], "px-4")  → "flex items-center px-4"
 */
export function cx(...inputs: (ClassValue | ClassValue[])[]): string {
  const filtered = (inputs as unknown[]).flat().filter(Boolean) as string[]
  if (filtered.length === 0) return ""

  const native = getNativeBinding()
  if (native?.twMergeMany) {
    // Server/Node.js path — gunakan native Rust binding
    return native.twMergeMany(filtered)
  }
  if (native !== null) {
    // Native tersedia tapi twMergeMany tidak — Node.js miskonfigurasi
    throw new Error("Native binding 'twMergeMany' is required but not available.")
  }
  // Browser fallback — native = null (expected di browser)
  // Gunakan twMergeRawJs: port pure-TS dari algoritma tw_merge.rs
  return twMergeRawJs(filtered)
}

/** @deprecated Use cx() instead. */
export const cxm = cx

/**
 * cxn — cx() dengan nested array support.
 * Node.js: delegates ke Rust `flatten_and_resolve`.
 * Browser: pure-TS fallback — flatten nested array + filter falsy + join spasi.
 *
 * @example cxn(["p-4", ["flex", isActive && "gap-2"], null]) → "p-4 flex gap-2"
 */
export function cxn(inputs: unknown[]): string {
  if (inputs.length === 0) return ""

  const native = getNativeBinding()
  if (native?.flattenAndResolve) {
    // Server/Node.js path — gunakan native Rust binding
    return native.flattenAndResolve(JSON.stringify(inputs))
  }
  if (native !== null) {
    // Native tersedia tapi flattenAndResolve tidak — Node.js miskonfigurasi
    throw new Error("Native binding 'flattenAndResolve' is required but not available.")
  }
  // Browser fallback — native = null (expected di browser)
  // Flatten nested array secara rekursif, filter falsy, join dengan spasi
  function flattenDeep(arr: unknown[]): string[] {
    const result: string[] = []
    for (const item of arr) {
      if (Array.isArray(item)) {
        const nested = flattenDeep(item)
        for (const v of nested) result.push(v)
      } else if (item) {
        result.push(String(item))
      }
    }
    return result
  }
  return flattenDeep(inputs).join(" ")
}