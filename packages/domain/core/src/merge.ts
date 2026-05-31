/**
 * tailwind-styled-v4 — createTwMerge()
 * Pure Node.js — requires native Rust binding.
 */

import { getNativeBinding } from "./native"
import type { ThemeConfig } from "./themeReader"

export interface MergeOptions {
  prefix?: string
  separator?: string
  theme?: ThemeConfig
}

export function createTwMerge(_options: MergeOptions = {}) {
  return function twMerge(...classLists: Array<string | undefined | null | false>): string {
    const inputs: string[] = []
    for (let i = 0; i < classLists.length; i++) {
      const v = classLists[i]
      if (v) inputs.push(String(v))
    }
    if (inputs.length === 0) return ""

    const native = getNativeBinding()
    if (!native?.twMergeRaw) {
      throw new Error("Native binding 'twMergeRaw' is required but not available.")
    }
    return native.twMergeRaw(inputs)
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