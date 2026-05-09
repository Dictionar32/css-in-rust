/**
 * tailwind-styled-v4 — createTwMerge()
 *
 * Native-first: uses Rust `tw_merge_many` when available.
 * Browser fallback: simple join (no conflict resolution).
 * In browser/client context, classes were already resolved on the server during SSR.
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
 * Native-first: uses Rust `tw_merge_many` when available.
 * Browser fallback: simple join without conflict resolution.
 * Classes passed in browser context are already conflict-resolved from SSR.
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
      // Browser/client fallback: no Rust native in browser.
      // Classes are already conflict-resolved from server SSR pass.
      // Simple join is safe here.
      return clean.join(" ")
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