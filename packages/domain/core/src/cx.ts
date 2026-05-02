/**
 * tailwind-styled-v4 v2 — cx / cn
 *
 * Native-first:
 *   cn() → simple join (no conflict resolution) — delegates ke Rust `resolve_class_names`
 *   cx() → conflict-aware merge — delegates ke Rust `tw_merge` (required)
 *   cxm() → alias cx() untuk backward compat
 */

import { getNativeBinding } from "./native"

type ClassValue = string | undefined | null | false | 0

/**
 * cn — simple class name joiner (no conflict resolution).
 * Native-first: delegates ke Rust `resolve_class_names` yang filter+join
 * dalam satu pass tanpa intermediate allocations.
 *
 * @example cn("p-4", isActive && "opacity-100") → "p-4 opacity-100"
 */
export function cn(...inputs: (ClassValue | ClassValue[])[]): string {
  const native = getNativeBinding()
  if (!native?.resolveClassNames) {
    throw new Error("FATAL: Native binding 'resolveClassNames' is required but not available.")
  }
  const strings = (inputs as unknown[]).flat().filter(Boolean) as string[]
  return native.resolveClassNames(strings)
}

/**
 * cx — conflict-aware class merger.
 * Native-first: delegates ke Rust `tw_merge` (required).
 * Mendukung array inputs — flatten sebelum di-pass ke native.
 *
 * @example cx("p-4 p-8")                        → "p-8"
 * @example cx("bg-red-500", "bg-blue-500")       → "bg-blue-500"
 * @example cx(["flex", "items-center"], "px-4")  → "flex items-center px-4"
 */
export function cx(...inputs: (ClassValue | ClassValue[])[]): string {
  // Flatten arrays + filter falsy in one pass
  const filtered = (inputs as unknown[]).flat().filter(Boolean) as string[]
  if (filtered.length === 0) return ""

  const native = getNativeBinding()
  if (!native?.twMergeMany && !native?.twMerge) {
    throw new Error("FATAL: Native binding 'twMerge' or 'twMergeMany' is required but not available.")
  }
  if (native.twMergeMany) {
    return native.twMergeMany(filtered)
  }
  return native.twMerge!(filtered.join(" "))
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
  const result: string[] = []
  for (const item of inputs) {
    if (typeof item === "string" && item) result.push(item)
    else if (Array.isArray(item)) result.push(...flattenInputs(item as unknown[]))
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
  const native = getNativeBinding()
  if (native?.resolveClassNames) return native.resolveClassNames(flat)
  return flat.join(" ")
}