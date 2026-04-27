/**
 * tailwind-styled-v4 v2 — cx / cn
 *
 * FIX #09: Rename for clarity — behavior was confusing with two near-identical utils.
 *
 * BEFORE:
 *   cx()  → simple join, no conflict resolution → cx("p-4", "p-8") = "p-4 p-8" (WRONG)
 *   cxm() → twMerge, correct — but obscure name
 *
 * AFTER:
 *   cn()  → simple join (for cases where you know there's no conflict)
 *   cx()  → twMerge-powered, conflict-aware (recommended for most use cases)
 *   cxm() → kept as alias for cx() for backward compat
 */

import { twMerge } from "tailwind-merge"
import { getNativeBinding } from "./native"

type ClassValue = string | undefined | null | false | 0

/**
 * cn — simple class name joiner (no conflict resolution).
 * Use when you know classes don't conflict.
 *
 * Native-first: delegates ke Rust `resolve_class_names` yang filter+join
 * dalam satu pass tanpa intermediate allocations.
 * JS fallback: `filter(Boolean).join(" ").replace(/\s+/g, " ").trim()`
 *
 * FIX #09: Previously named `cx`. Renamed to `cn` for clarity.
 *
 * @example cn("p-4", isActive && "opacity-100") → "p-4 opacity-100"
 */
export function cn(...inputs: ClassValue[]): string {
  try {
    const native = getNativeBinding()
    if (native?.resolveClassNames) {
      const strings = inputs.filter(Boolean) as string[]
      return native.resolveClassNames(strings)
    }
  } catch {
    // Native binding not available — fall through to JS
  }
  return inputs.filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
}

/**
 * cx — conflict-aware class merger using tailwind-merge.
 * Recommended for combining Tailwind classes where conflicts are possible.
 *
 * FIX #09: Previously named `cxm`. Renamed to `cx` as the primary utility.
 *
 * @example cx("p-4 p-8") → "p-8"  (conflict resolved, last wins)
 * @example cx("bg-red-500", "bg-blue-500") → "bg-blue-500"
 */
export function cx(...inputs: ClassValue[]): string {
  return twMerge(...(inputs.filter(Boolean) as string[]))
}

/**
 * cxm — alias for cx(), kept for backward compatibility.
 * @deprecated Use cx() instead.
 */
export const cxm = cx