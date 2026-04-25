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

export class ReverseLookup {
  private parsedCache: Map<string, ParsedRule[]> = new Map()
  private static readonly MAX_CACHE_SIZE = 1000
  /** Jumlah karakter total yang disimpan di cache (approx) */
  private cacheSizeBytes = 0
  private static readonly MAX_CACHE_BYTES = 10 * 1024 * 1024 // 10MB

  private parseCSS(css: string): ParsedRule[] {
    const cached = this.parsedCache.get(css)
    if (cached) {
      return cached
    }

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
      source: { file: "", line: 0, column: 0 },
      isImportant: r.isImportant,
      variants: r.variants,
      isOverride: false,
    }))
    this.pruneCache()
    this.parsedCache.set(css, rules)
    return rules
  }

  fromCSS(cssProperty: string, cssValue: string, css: string): ReverseLookupResult[] {
    if (!css || !cssProperty) {
      return []
    }

    const rules = this.parseCSS(css)
    const normalizedProperty = cssProperty.toLowerCase()
    const normalizedValue = cssValue.toLowerCase().trim()
    const usages: ClassUsage[] = []

    for (const rule of rules) {
      if (rule.property.toLowerCase() !== normalizedProperty) {
        continue
      }

      const ruleValueLower = rule.value.toLowerCase().trim()
      if (ruleValueLower !== normalizedValue && !ruleValueLower.includes(normalizedValue)) {
        continue
      }

      usages.push({
        className: rule.className,
        source: rule.source,
        specificity: rule.specificity,
        isOverride: rule.isOverride || false,
        variants: rule.variants,
      })
    }

    if (usages.length === 0) {
      return []
    }

    return [{ property: normalizedProperty, value: cssValue, usedInClasses: usages }]
  }

  fromBundle(className: string, css: string): RuleIR[] {
    if (!css || !className) {
      return []
    }

    const rules = this.parseCSS(css)
    const results: RuleIR[] = []

    for (const rule of rules) {
      if (rule.className === className || rule.className.startsWith(`${className}:`)) {
        const ruleIR: RuleIR = {
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
          source: rule.source,
        }
        results.push(ruleIR)
      }
    }

    return results
  }

  findDependents(className: string, css: string): string[] {
    if (!css || !className) {
      return []
    }

    const rules = this.parseCSS(css)
    const dependents = new Set<string>()

    const classParts = className.split(":")
    const baseClass = classParts[0]

    for (const rule of rules) {
      const ruleBaseClass = rule.className.split(":")[0]

      if (ruleBaseClass === baseClass && rule.className !== className) {
        dependents.add(rule.className)
      }

      if (rule.className.includes(baseClass) && rule.className !== className) {
        const isVariant = rule.className.includes(":")
        if (isVariant && !rule.className.startsWith(`${className}:`)) {
          dependents.add(rule.className)
        }
      }
    }

    return Array.from(dependents)
  }

  findByProperty(property: string, css: string): ReverseLookupResult[] {
    if (!css || !property) {
      return []
    }

    const rules = this.parseCSS(css)
    const normalizedProperty = property.toLowerCase()

    const valueMap = new Map<string, ClassUsage[]>()

    for (const rule of rules) {
      if (rule.property.toLowerCase() !== normalizedProperty) {
        continue
      }

      const classUsage: ClassUsage = {
        className: rule.className,
        source: rule.source,
        specificity: rule.specificity,
        isOverride: rule.isOverride || false,
        variants: rule.variants,
      }

      let usages = valueMap.get(rule.value)
      if (!usages) {
        usages = []
        valueMap.set(rule.value, usages)
      }
      usages.push(classUsage)
    }

    const results: ReverseLookupResult[] = []
    for (const [value, usedInClasses] of valueMap) {
      results.push({ property: normalizedProperty, value, usedInClasses })
    }

    return results
  }

  /**
   * Kosongkan seluruh parsed cache.
   * Panggil ini saat CSS berubah (watch mode) atau saat memory pressure.
   */
  clearCache(): void {
    this.parsedCache.clear()
    this.cacheSizeBytes = 0
  }

  /**
   * Hapus entri cache lama sampai di bawah threshold.
   * Dipakai oleh parseCSS secara internal.
   */
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
      // Approximate bytes freed
      this.cacheSizeBytes -= firstKey.length + (removed?.length ?? 0) * 100
      if (this.cacheSizeBytes < 0) this.cacheSizeBytes = 0
    }
  }

  /** Cache size untuk observability/diagnostics */
  get cacheSize(): number {
    return this.parsedCache.size
  }
}
