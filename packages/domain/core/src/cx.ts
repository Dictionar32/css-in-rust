/**
 * tailwind-styled-v4 v2 — cx / cn
 *
 * Native-first:
 *   cn() → simple join (no conflict resolution) — delegates ke Rust `resolve_class_names`
 *   cx() → conflict-aware merge — delegates ke Rust `tw_merge`, fallback ke tailwind-merge JS
 *   cxm() → alias cx() untuk backward compat
 */

import { twMerge } from "tailwind-merge"
import { getNativeBinding } from "./native"

type ClassValue = string | undefined | null | false | 0

/**
 * cn — simple class name joiner (no conflict resolution).
 * Native-first: delegates ke Rust `resolve_class_names` yang filter+join
 * dalam satu pass tanpa intermediate allocations.
 * JS fallback: `filter(Boolean).join(" ").replace(/\s+/g, " ").trim()`
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
 * cx — conflict-aware class merger.
 * Native-first: delegates ke Rust `tw_merge`.
 * JS fallback: tailwind-merge library.
 *
 * @example cx("p-4 p-8")            → "p-8"
 * @example cx("bg-red-500", "bg-blue-500") → "bg-blue-500"
 * @example cx("p-4", "hover:p-8")   → "p-4 hover:p-8"  (no conflict)
 */
export function cx(...inputs: ClassValue[]): string {
  const filtered = inputs.filter(Boolean) as string[]
  if (filtered.length === 0) return ""

  try {
    const native = getNativeBinding()
    if (native?.twMergeMany) {
      return native.twMergeMany(filtered)
    }
    if (native?.twMerge) {
      return native.twMerge(filtered.join(" "))
    }
  } catch {
    // Native binding not available — fall through to JS
  }

  // JS fallback via tailwind-merge
  return twMerge(...filtered)
}

/**
 * cxm — alias untuk cx(), kept for backward compatibility.
 * @deprecated Use cx() instead.
 */
export const cxm = cx