/**
 * tailwind-styled-v4 — createTwMerge()
 *
 * Native Rust binding (twMergeRaw) is used when available (Node.js, build
 * time, SSR) for maximum performance/parity with the rest of the pipeline.
 *
 * FIX (Bug C — "Uncaught Error: Native binding 'twMergeRaw' is required but
 * not available." crashing in the browser):
 *
 * This function used to THROW whenever the native binding was missing,
 * documented as "Pure Node.js — requires native Rust binding". That's true
 * of the binding itself, but NOT of how this function is actually used:
 * createComponent.ts calls twMerge() unconditionally inside the React render
 * function for EVERY tw.* component, on EVERY render — including the very
 * first client-side render of any component that runs/re-renders in the
 * browser. A `.node` native addon can never load inside a browser JS engine,
 * so throwing here means ANY tw.* component crashes the instant it has to
 * render client-side (mount, hydration, re-render, .extend() at module
 * scope, etc.) — this isn't a rare edge case, it's unconditional.
 *
 * Fallback: pure-JS conflict-aware merge via `tailwind-merge` — the same
 * reference implementation `twMergeRaw`/`twMerge` in native.ts was explicitly
 * built to port (see comment there: "conflict-aware Tailwind class merger —
 * port of tailwind-merge"). Using the canonical library itself as the
 * fallback (rather than a hand-rolled approximation) keeps merge semantics
 * consistent with the Rust path instead of risking subtly-wrong CSS output.
 */

import { getNativeBinding } from "./native"
import type { ThemeConfig } from "./themeReader"

export interface MergeOptions {
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
        "(normal di browser) — pakai pure-JS fallback (tailwind-merge). " +
        "Hasil className tetap benar; ini cuma informasi, bukan error."
    )
  }
}

// Lazy + cached per-prefix JS fallback instance — extendTailwindMerge()
// builds a config object that's relatively expensive to construct, jadi
// jangan dipanggil ulang setiap render.
const jsFallbackCache = new Map<string, (...args: string[]) => string>()

function getJsFallback(prefix?: string): (...args: string[]) => string {
  const key = prefix ?? ""
  const cached = jsFallbackCache.get(key)
  if (cached) return cached

  // require() dipakai (bukan static import) supaya bundler browser-target
  // tetap tree-shake "tailwind-merge" kalau native binding SELALU tersedia
  // di environment itu (mis. custom Node-only consumer) — tapi untuk build
  // browser package ini, dependency-nya memang dibundle langsung (lihat
  // tsup.config.ts: noExternal tidak include "tailwind-merge", jadi default
  // behavior tsup adalah bundle dependency biasa kecuali di-external-kan).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { twMerge: twMergeJs, extendTailwindMerge } = require("tailwind-merge") as typeof import("tailwind-merge")

  const fn = prefix ? extendTailwindMerge({ prefix }) : twMergeJs
  jsFallbackCache.set(key, fn)
  return fn
}

export function createTwMerge(options: MergeOptions = {}) {
  return function twMerge(...classLists: Array<string | undefined | null | false>): string {
    const inputs: string[] = []
    for (let i = 0; i < classLists.length; i++) {
      const v = classLists[i]
      if (v) inputs.push(String(v))
    }
    if (inputs.length === 0) return ""

    const native = getNativeBinding()
    if (native?.twMergeRaw) {
      return native.twMergeRaw(inputs)
    }

    warnFallbackOnce()
    return getJsFallback(options.prefix)(...inputs)
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