/**
 * tailwind-styled-v4 — createTwMerge()
 *
 * Native Rust binding (twMergeRaw) is used when available (Node.js, build
 * time, SSR) for maximum performance/parity with the rest of the pipeline.
 *
 * Browser fallback (Bug C — "Uncaught Error: Native binding 'twMergeRaw' is
 * required but not available." crashing in the browser):
 *
 * createComponent.ts calls twMerge() unconditionally inside the React render
 * function for EVERY tw.* component, on EVERY render — including the very
 * first client-side render of any component that runs/re-renders in the
 * browser. A `.node` native addon can never load inside a browser JS engine,
 * so this isn't a rare edge case, it's unconditional: any tw.* component
 * rendering client-side needs a working fallback path.
 *
 * getNativeBinding() returns `null` (not a throw) when running in the
 * browser — see native.ts. When that happens we use mergeFallback.ts, a
 * hand-written pure-TS port of the SAME algorithm as `tw_merge_raw` in
 * tw_merge.rs (conflict_group / split_variants / merge_class_string),
 * instead of the third-party `tailwind-merge` package. This keeps merge
 * behavior defined by one algorithm — ours — rather than risking the
 * browser and the server silently disagreeing on merged className output
 * because two different implementations drifted apart. The cost: when
 * tw_merge.rs's conflict_group() changes, mergeFallback.ts must be updated
 * by hand to match (see comments there).
 */

import { getNativeBinding } from "./native"
import { twMergeRawJs } from "./mergeFallback"
import type { ThemeConfig } from "./themeReader"

export interface MergeOptions {
  /**
   * NOTE: not currently applied — matches the native path, which calls
   * `native.twMergeRaw(inputs)` without ever forwarding a prefix either.
   * Kept on the type for API stability; wire it through conflictGroup()
   * in mergeFallback.ts (and tw_merge_raw on the Rust side) together if a
   * custom Tailwind prefix needs to be supported correctly end-to-end.
   */
  prefix?: string
  separator?: string
  theme?: ThemeConfig
}

let warnedFallback = false
function warnFallbackOnce(): void {
  if (warnedFallback) return
  warnedFallback = true
  if (typeof console !== "undefined") {
    console.warn(
      "[tailwind-styled-v4] Native binding 'twMergeRaw' tidak tersedia " +
      "(normal di browser) — pakai pure-TS port dari algoritma Rust-nya. " +
      "Hasil className tetap benar; ini cuma informasi, bukan error."
    )
  }
}

export function createTwMerge(options: MergeOptions = {}) {
  const prefix = options.prefix ?? ""
  return function twMerge(...classLists: Array<string | undefined | null | false>): string {
    const inputs: string[] = []
    for (let i = 0; i < classLists.length; i++) {
      const v = classLists[i]
      if (v) inputs.push(String(v))
    }
    if (inputs.length === 0) return ""

    const native = getNativeBinding()
    if (native) {
      // Gunakan twMergeRawWithOptions jika prefix tersedia, twMergeRaw jika tidak
      if (prefix && native.twMergeRawWithOptions) {
        return native.twMergeRawWithOptions(inputs, { prefix })
      }
      if (native.twMergeRaw) {
        return native.twMergeRaw(inputs)
      }
    }

    warnFallbackOnce()
    return twMergeRawJs(inputs, prefix)
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