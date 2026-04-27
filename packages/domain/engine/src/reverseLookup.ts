/**
 * tailwind-styled-v4 — Reverse Lookup
 *
 * JS layer: thin wrapper, cache management.
 * Rust layer: reverseLookupFromCss, reverseLookupByProperty,
 *             reverseLookupFindDependents (DashMap-backed).
 *
 * Removed from JS: parseCSS(), JS filter loops, pruneCache().
 * All lookup computation is now in native.
 */

import type { RuleIR, SourceLocation } from "./ir"
import { getNativeEngineBinding } from "./native-bridge"

export interface ClassUsage {
  className: string
  source: SourceLocation
  specificity: number
  isOverride: boolean
  variants: string[]
}

export interface ReverseLookupResult {
  property: string
  value: string
  usedInClasses: ClassUsage[]
}

function getNative() {
  const native = getNativeEngineBinding()
  if (
    !native?.reverseLookupFromCss ||
    !native?.reverseLookupByProperty ||
    !native?.reverseLookupFindDependents
  ) {
    throw new Error(
      "FATAL: Native bindings 'reverseLookupFromCss', 'reverseLookupByProperty', " +
      "'reverseLookupFindDependents' are required but not available.\n" +
      "Build the native Rust module: npm run build:rust"
    )
  }
  return native
}

function normaliseNativeResults(
  raw: Array<{
    property: string
    value: string
    usedInClasses: Array<{ className: string; specificity: number; isOverride: boolean; variants: string[] }>
  }>
): ReverseLookupResult[] {
  return raw.map((r) => ({
    property: r.property,
    value: r.value,
    usedInClasses: r.usedInClasses.map((u) => ({
      className: u.className,
      source: { file: "", line: 0, column: 0 } as SourceLocation,
      specificity: u.specificity,
      isOverride: u.isOverride,
      variants: u.variants,
    })),
  }))
}

export class ReverseLookup {
  fromCSS(cssProperty: string, cssValue: string, css: string): ReverseLookupResult[] {
    if (!css || !cssProperty) return []
    return normaliseNativeResults(getNative().reverseLookupFromCss!(css, cssProperty, cssValue))
  }

  findByProperty(property: string, css: string): ReverseLookupResult[] {
    if (!css || !property) return []
    return normaliseNativeResults(getNative().reverseLookupByProperty!(css, property))
  }

  findDependents(className: string, css: string): string[] {
    if (!css || !className) return []
    return getNative().reverseLookupFindDependents!(css, className)
  }

  fromBundle(className: string, css: string): RuleIR[] {
    if (!css || !className) return []
    const native = getNativeEngineBinding()
    if (!native?.parseCssRules) {
      throw new Error("FATAL: Native binding 'parseCssRules' is required but not available.")
    }
    const raw = native.parseCssRules(css) as Array<{
      className: string; property: string; value: string
      isImportant: boolean; variants: string[]; specificity: number
    }>
    const results: RuleIR[] = []
    for (const rule of raw ?? []) {
      if (rule.className !== className && !rule.className.startsWith(`${className}:`)) continue
      results.push({
        id: { value: results.length },
        selector: { value: 0 },
        variantChain: { value: 0 },
        property: { value: 0 },
        value: { value: 0 },
        origin: 2,
        importance: rule.isImportant ? 1 : 0,
        layer: null,
        layerOrder: 0,
        specificity: rule.specificity,
        condition: null,
        conditionResult: 0,
        insertionOrder: results.length,
        fingerprint: "",
        source: { file: "", line: 0, column: 0 },
      })
    }
    return results
  }

  clearCache(): void {
    getNativeEngineBinding()?.reverseLookupClearCache?.()
  }

  get cacheSize(): number {
    return getNativeEngineBinding()?.reverseLookupCacheSize?.() ?? 0
  }
}
