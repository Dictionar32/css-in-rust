/**
 * tailwind-styled-v4 v2 — cx / cn
 * Pure Node.js — requires native Rust binding.
 */

import { getNativeBinding } from "./native"

type ClassValue = string | undefined | null | false | 0

/**
 * cn — simple class name joiner (no conflict resolution).
 * Delegates ke Rust `resolve_class_names`.
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
  if (!native?.resolveClassNames) {
    throw new Error("Native binding 'resolveClassNames' is required but not available.")
  }
  return native.resolveClassNames(strings)
}

/**
 * cx — conflict-aware class merger.
 * Delegates ke Rust `tw_merge_many`.
 *
 * @example cx("p-4 p-8")                        → "p-8"
 * @example cx("bg-red-500", "bg-blue-500")       → "bg-blue-500"
 * @example cx(["flex", "items-center"], "px-4")  → "flex items-center px-4"
 */
export function cx(...inputs: (ClassValue | ClassValue[])[]): string {
  const filtered = (inputs as unknown[]).flat().filter(Boolean) as string[]
  if (filtered.length === 0) return ""

  const native = getNativeBinding()
  if (!native?.twMergeMany) {
    throw new Error("Native binding 'twMergeMany' is required but not available.")
  }
  return native.twMergeMany(filtered)
}

/** @deprecated Use cx() instead. */
export const cxm = cx

/**
 * cxn — cx() dengan nested array support.
 * Delegates ke Rust `flatten_and_resolve`.
 *
 * @example cxn(["p-4", ["flex", isActive && "gap-2"], null]) → "p-4 flex gap-2"
 */
export function cxn(inputs: unknown[]): string {
  if (inputs.length === 0) return ""

  const native = getNativeBinding()
  if (!native?.flattenAndResolve) {
    throw new Error("Native binding 'flattenAndResolve' is required but not available.")
  }
  return native.flattenAndResolve(JSON.stringify(inputs))
}