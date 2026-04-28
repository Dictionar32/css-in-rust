import { twMerge as twMergeOriginal } from "tailwind-merge"
import { getNativeBinding } from "./native"

import type { ThemeConfig } from "./themeReader"

export interface MergeOptions {
  prefix?: string
  separator?: string
  theme?: ThemeConfig
}

function normalizeClassInput(classLists: Array<string | undefined | null | false>): string[] {
  return classLists
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0)
}

/**
 * tailwind-styled-v4 — createTwMerge()
 *
 * Native-first: uses Rust `tw_merge_many`; requires native binding.
 * No JS fallback — tailwind-merge removed from bundle.
 */

import { getNativeBinding } from "./native"

import type { ThemeConfig } from "./themeReader"

export interface MergeOptions {
  prefix?: string
  separator?: string
  theme?: ThemeConfig
}

function normalizeClassInput(classLists: Array<string | undefined | null | false>): string[] {
  return classLists
    .filter(Boolean)
    .map((v) => String(v).trim())
    .filter((v) => v.length > 0)
}

/**
 * createTwMerge — returns a conflict-aware merge function.
 * Native-only: uses Rust `tw_merge_many`; throws if native binding unavailable.
 *
 * Note: `prefix` and `separator` options are not supported in native mode
 * (Tailwind v3/v4 defaults are used).
 */
export function createTwMerge(_options: MergeOptions = {}) {
  return function twMerge(...classLists: Array<string | undefined | null | false>): string {
    const clean = normalizeClassInput(classLists)
    if (clean.length === 0) return ""

    const native = getNativeBinding()
    if (!native?.twMergeMany) {
      throw new Error("FATAL: Native binding 'twMergeMany' is required but not available.")
    }
    return native.twMergeMany(clean)
  }
}

export const twMerge = createTwMerge()

export function mergeWithRules(
  rules: Record<string, (classes: string[]) => string>,
  ...classLists: string[]
): string {
  const base = twMerge(...classLists)
  const classes = Object.values(rules).reduce(
    (acc, rule) => twMerge(rule(acc)).split(/\s+/).filter(Boolean),
    base.split(/\s+/).filter(Boolean)
  )

  return classes.join(" ")
}
      if (native?.twMerge) {
        return native.twMerge(clean.join(" "))
      }
    } catch {
      // Native binding not available — fall through to JS
    }

    return twMergeOriginal(clean.join(" "))
  }
}

export const twMerge = createTwMerge()

export function mergeWithRules(
  rules: Record<string, (classes: string[]) => string>,
  ...classLists: string[]
): string {
  const base = twMerge(...classLists)
  const classes = Object.values(rules).reduce(
    (acc, rule) => twMerge(rule(acc)).split(/\s+/).filter(Boolean),
    base.split(/\s+/).filter(Boolean)
  )

  return classes.join(" ")
}