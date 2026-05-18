/**
 * tailwind-styled-v4 v2 — cx / cn
 *
 * Native-first:
 *   cn() → simple join (no conflict resolution) — delegates ke Rust `resolve_class_names`
 *   cx() → conflict-aware merge — delegates ke Rust `tw_merge` (preferred)
 *   cxm() → alias cx() untuk backward compat
 *
 * Browser fallback: simple join when native binding unavailable.
 * In browser/client context, classes were already resolved on server during SSR.
 */

import { getNativeBinding } from "./native"

type ClassValue = string | undefined | null | false | 0

/**
 * cn — simple class name joiner (no conflict resolution).
 * Native-first: delegates ke Rust `resolve_class_names` yang filter+join
 * dalam satu pass tanpa intermediate allocations.
 * Browser fallback: flat+filter+join.
 *
 * @example cn("p-4", isActive && "opacity-100") → "p-4 opacity-100"
 */
export function cn(...inputs: (ClassValue | ClassValue[])[]): string {
  // Single-pass flatten+filter: hindari .flat().filter() 2 intermediate arrays
  const strings: string[] = []
  for (const item of inputs) {
    if (Array.isArray(item)) {
      for (const v of item) { if (v) strings.push(String(v)) }
    } else if (item) {
      strings.push(String(item))
    }
  }
  if (strings.length === 0) return ""

  try {
    const native = getNativeBinding()
    if (native?.resolveClassNames) return native.resolveClassNames(strings)
  } catch {
    // getNativeBinding() throw di browser — fall through ke JS fallback
  }

  return strings.join(" ")
}

/**
 * cx — conflict-aware class merger.
 * Native-first: delegates ke Rust `tw_merge` (preferred).
 * Mendukung array inputs — flatten sebelum di-pass ke native.
 * Browser fallback: simple join without conflict resolution.
 *
 * @example cx("p-4 p-8")                        → "p-8"
 * @example cx("bg-red-500", "bg-blue-500")       → "bg-blue-500"
 * @example cx(["flex", "items-center"], "px-4")  → "flex items-center px-4"
 */
export function cx(...inputs: (ClassValue | ClassValue[])[]): string {
  // Flatten arrays + filter falsy in one pass
  const filtered = (inputs as unknown[]).flat().filter(Boolean) as string[]
  if (filtered.length === 0) return ""

  try {
    const native = getNativeBinding()
    if (native?.twMergeMany) return native.twMergeMany(filtered)
    if (native?.twMerge) return native.twMerge(filtered.join(" "))
  } catch {
    // Native binding unavailable in browser — fall through
  }

  // Browser/client fallback: simple join
  return filtered.join(" ")
}

/**
 * cxm — alias untuk cx(), kept for backward compatibility.
 * @deprecated Use cx() instead.
 */
export const cxm = cx

/**
 * cxn — cx() dengan nested array support.
 * Delegates ke Rust cx_nested yang flatten rekursif dalam satu pass.
 *
 * @example cxn(["p-4", ["flex", isActive && "gap-2"], null]) → "p-4 flex gap-2"
 * @example cxn(["p-4", [["flex", "gap-2"]]]) → "p-4 flex gap-2"
 */
/**
 * Flatten nested array ke string[] — recursive.
 * Internal helper untuk cxn().
 */
function flattenInputs(inputs: unknown[]): string[] {
  // Iterative stack — tidak ada risiko stack overflow untuk input deeply nested.
  // Sebelumnya: rekursif dengan spread (...flattenInputs()) → banyak intermediate arrays.
  // Sesudah: satu stack array + satu result array, zero spread overhead.
  const result: string[] = []
  const stack: unknown[] = [...inputs]
  while (stack.length > 0) {
    const item = stack.pop()
    if (typeof item === "string" && item) result.push(item)
    else if (Array.isArray(item)) {
      // Push ke stack dalam urutan terbalik agar pop() menghasilkan urutan asli
      for (let i = item.length - 1; i >= 0; i--) stack.push(item[i])
    }
    // null, false, 0, undefined — skip
  }
  return result
}

/**
 * cxn — cx() dengan nested array support.
 * Flatten di TS lalu delegate ke native resolveClassNames (zero overhead).
 *
 * @example cxn(["p-4", ["flex", isActive && "gap-2"], null]) → "p-4 flex gap-2"
 */
export function cxn(inputs: unknown[]): string {
  const flat = flattenInputs(inputs)
  if (flat.length === 0) return ""
  try {
    const native = getNativeBinding()
    if (native?.resolveClassNames) return native.resolveClassNames(flat)
  } catch {
    // Native binding unavailable in browser
  }
  return flat.join(" ")
}