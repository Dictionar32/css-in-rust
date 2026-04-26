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

interface ParsedRule {
  className: string
  property: string
  value: string
  specificity: number
  source: SourceLocation
  isImportant: boolean
  variants: string[]
  isOverride: boolean
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
  private parsedCache: Map<string, ParsedRule[]> = new Map()
  private static readonly MAX_CACHE_SIZE = 1_000
  private cacheSizeBytes = 0
  private static readonly MAX_CACHE_BYTES = 10 * 1024 * 1024

  private parseCSS(css: string): ParsedRule[] {
    const cached = this.parsedCache.get(css)
    if (cached) return cached

    const native = getNativeEngineBinding()
    if (!native?.parseCssRules) {
      throw new Error("FATAL: Native binding 'parseCssRules' is required but not available.")
    }

    const raw = native.parseCssRules(css) as Array<{
      className: string; property: string; value: string
      isImportant: boolean; variants: string[]; specificity: number
    }>
    const rules: ParsedRule[] = (raw ?? []).map((r) => ({
      className: r.className,
      property: r.property,
      value: r.value,
      specificity: r.specificity,
      source: { file: "", line: 0, column: 0 } as SourceLocation,
      isImportant: r.isImportant,
      variants: r.variants,
      isOverride: false,
    }))
    this.pruneCache()
    this.parsedCache.set(css, rules)
    return rules
  }

  fromCSS(cssProperty: string, cssValue: string, css: string): ReverseLookupResult[] {
    if (!css || !cssProperty) return []

    const native = getNativeEngineBinding()
    if (native?.reverseLookupFromCss) {
      return normaliseNativeResults(native.reverseLookupFromCss(css, cssProperty, cssValue))
    }

    const rules = this.parseCSS(css)
    const normalizedProperty = cssProperty.toLowerCase()
    const normalizedValue = cssValue.toLowerCase().trim()
    const usages: ClassUsage[] = []

    for (const rule of rules) {
      if (rule.property.toLowerCase() !== normalizedProperty) continue
      const v = rule.value.toLowerCase().trim()
      if (v !== normalizedValue && !v.includes(normalizedValue)) continue
      usages.push({
        className: rule.className, source: rule.source,
        specificity: rule.specificity, isOverride: rule.isOverride, variants: rule.variants,
      })
    }
    return usages.length === 0
      ? []
      : [{ property: normalizedProperty, value: cssValue, usedInClasses: usages }]
  }

  findByProperty(property: string, css: string): ReverseLookupResult[] {
    if (!css || !property) return []

    const native = getNativeEngineBinding()
    if (native?.reverseLookupByProperty) {
      return normaliseNativeResults(native.reverseLookupByProperty(css, property))
    }

    const rules = this.parseCSS(css)
    const normalizedProperty = property.toLowerCase()
    const valueMap = new Map<string, ClassUsage[]>()

    for (const rule of rules) {
      if (rule.property.toLowerCase() !== normalizedProperty) continue
      const entry: ClassUsage = {
        className: rule.className, source: rule.source,
        specificity: rule.specificity, isOverride: rule.isOverride, variants: rule.variants,
      }
      const bucket = valueMap.get(rule.value)
      if (bucket) bucket.push(entry)
      else valueMap.set(rule.value, [entry])
    }
    return Array.from(valueMap.entries()).map(([value, usedInClasses]) => ({
      property: normalizedProperty, value, usedInClasses,
    }))
  }

  findDependents(className: string, css: string): string[] {
    if (!css || !className) return []

    const native = getNativeEngineBinding()
    if (native?.reverseLookupFindDependents) {
      return native.reverseLookupFindDependents(css, className)
    }

    const rules = this.parseCSS(css)
    const dependents = new Set<string>()
    const baseClass = className.split(":")[0]

    for (const rule of rules) {
      const ruleBase = rule.className.split(":")[0]
      if (ruleBase === baseClass && rule.className !== className) dependents.add(rule.className)
      if (rule.className.includes(baseClass) && rule.className !== className) {
        const isVariant = rule.className.includes(":")
        if (isVariant && !rule.className.startsWith(`${className}:`)) dependents.add(rule.className)
      }
    }
    return Array.from(dependents)
  }

  fromBundle(className: string, css: string): RuleIR[] {
    if (!css || !className) return []
    const rules = this.parseCSS(css)
    const results: RuleIR[] = []
    for (const rule of rules) {
      if (rule.className === className || rule.className.startsWith(`${className}:`)) {
        results.push({
          id: { value: results.length }, selector: { value: 0 },
          variantChain: { value: 0 }, property: { value: 0 }, value: { value: 0 },
          origin: 2, importance: rule.isImportant ? 1 : 0, layer: null, layerOrder: 0,
          specificity: rule.specificity, condition: null, conditionResult: 0,
          insertionOrder: results.length, fingerprint: "", source: rule.source,
        })
      }
    }
    return results
  }

  clearCache(): void {
    const native = getNativeEngineBinding()
    native?.reverseLookupClearCache?.()
    this.parsedCache.clear()
    this.cacheSizeBytes = 0
  }

  get cacheSize(): number {
    const native = getNativeEngineBinding()
    const nativeSize = native?.reverseLookupCacheSize?.() ?? 0
    return nativeSize + this.parsedCache.size
  }

  private pruneCache(): void {
    while (
      (this.parsedCache.size >= ReverseLookup.MAX_CACHE_SIZE ||
        this.cacheSizeBytes >= ReverseLookup.MAX_CACHE_BYTES) &&
      this.parsedCache.size > 0
    ) {
      const firstKey = this.parsedCache.keys().next().value
      if (firstKey === undefined) break
      const removed = this.parsedCache.get(firstKey)
      this.parsedCache.delete(firstKey)
      this.cacheSizeBytes -= firstKey.length + (removed?.length ?? 0) * 100
      if (this.cacheSizeBytes < 0) this.cacheSizeBytes = 0
    }
  }
}