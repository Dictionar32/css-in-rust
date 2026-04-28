import type { ScanWorkspaceResult } from "@tailwind-styled/scanner"
import { getNativeEngineBinding } from "./native-bridge"
import { type BundleAnalysisResult, BundleAnalyzer } from "./bundleAnalyzer"

export interface ImpactReport {
  className: string
  totalComponents: number
  directUsage: number
  indirectUsage: number
  bundleSizeBytes: number
  estimatedSavings: number
  riskLevel: "low" | "medium" | "high"
  suggestions: string[]
}

export interface ComponentImpact {
  file: string
  line: number
  column: number
  usageType: "direct" | "variant" | "component"
  variant?: string
}

interface NativeImpactScore {
  className: string
  usageScore: number
  sizeScore: number
  impactScore: number
  usageCount: number
  sizeBytes: number
}

export class ImpactTracker {
  private bundleAnalyzer: BundleAnalyzer

  constructor() {
    this.bundleAnalyzer = new BundleAnalyzer()
  }

  analyzeWithBundle(
    className: string,
    scanResult: ScanWorkspaceResult,
    css = ""
  ): ImpactReport {
    const normalizedClass = className.startsWith(".") ? className.slice(1) : className

    const native = getNativeEngineBinding()
    if (!native?.calculateImpactScores) {
      throw new Error("FATAL: Native binding 'calculateImpactScores' is required but not available.")
    }

    const scores = native.calculateImpactScores(
      [normalizedClass],
      JSON.stringify(scanResult),
      css,
      0.6,
      0.4
    ) as NativeImpactScore[]

    const score = scores[0]

    const bundleAnalysis: BundleAnalysisResult = {
      className: normalizedClass,
      totalUsage: score?.usageCount ?? 0,
      files: [],
      bundleSizeBytes: score?.sizeBytes ?? 0,
      variantChains: [],
      isDeadCode: (score?.usageCount ?? 0) === 0,
      dependencies: [],
    }

    return this.calculateImpact(normalizedClass, bundleAnalysis, scanResult, score)
  }

  analyzeAll(scanResult: ScanWorkspaceResult, css = ""): Map<string, ImpactReport> {
    const native = getNativeEngineBinding()
    if (!native?.calculateImpactScores) {
      throw new Error("FATAL: Native binding 'calculateImpactScores' is required but not available.")
    }

    const classes = scanResult?.uniqueClasses ?? []
    const scores = native.calculateImpactScores(
      classes,
      JSON.stringify(scanResult),
      css,
      0.6,
      0.4
    ) as NativeImpactScore[]

    const scoreMap = new Map(scores.map((s) => [s.className, s]))
    const results = new Map<string, ImpactReport>()

    for (const cls of classes) {
      const score = scoreMap.get(cls)
      const bundleAnalysis: BundleAnalysisResult = {
        className: cls,
        totalUsage: score?.usageCount ?? 0,
        files: [],
        bundleSizeBytes: score?.sizeBytes ?? 0,
        variantChains: [],
        isDeadCode: (score?.usageCount ?? 0) === 0,
        dependencies: [],
      }
      results.set(cls, this.calculateImpact(cls, bundleAnalysis, scanResult, score))
    }

    return results
  }

  calculateImpact(
    className: string,
    bundleAnalysis: BundleAnalysisResult,
    scanResult: ScanWorkspaceResult | null | undefined,
    nativeScore?: NativeImpactScore
  ): ImpactReport {
    if (!className || className.trim() === "") return this.createEmptyReport(className)
    if (!bundleAnalysis) return this.createEmptyReport(className)

    const normalizedClass = className.startsWith(".") ? className.slice(1) : className
    const totalComponents = nativeScore?.usageCount ?? bundleAnalysis.totalUsage ?? 0
    const directUsage = totalComponents
    const indirectUsage = 0
    const bundleSizeBytes = bundleAnalysis.bundleSizeBytes || 0

    const native = getNativeEngineBinding()

    // ── computeImpactMetadata — risk + savings + suggestions dalam satu call ──
    // Menggantikan 3 call terpisah (calculateRisk, calculateSavings, generateSuggestions).
    // Input: JSON dengan {className, totalComponents, indirectUsage, bundleSizeBytes}.
    // Output: JSON dengan {riskLevel, estimatedSavings, suggestions}.
    if (native?.computeImpactMetadata) {
      const impactJson = JSON.stringify({
        className: normalizedClass,
        totalComponents,
        indirectUsage,
        bundleSizeBytes,
      })
      const result = JSON.parse(native.computeImpactMetadata(normalizedClass, impactJson)) as {
        riskLevel: "low" | "medium" | "high"
        estimatedSavings: number
        suggestions: string[]
      }
      return {
        className: normalizedClass,
        totalComponents,
        directUsage,
        indirectUsage,
        bundleSizeBytes,
        estimatedSavings: result.estimatedSavings,
        riskLevel: result.riskLevel,
        suggestions: result.suggestions,
      }
    }

    // Fallback: calculateImpact (combined JSON — batch sebelumnya)
    if (native?.calculateImpact) {
      const impactJson = JSON.stringify({
        className: normalizedClass,
        totalComponents,
        indirectUsage,
        bundleSizeBytes,
      })
      const result = JSON.parse(native.calculateImpact(impactJson)) as {
        riskLevel: "low" | "medium" | "high"
        estimatedSavings: number
        suggestions: string[]
      }
      return {
        className: normalizedClass,
        totalComponents,
        directUsage,
        indirectUsage,
        bundleSizeBytes,
        estimatedSavings: result.estimatedSavings,
        riskLevel: result.riskLevel,
        suggestions: result.suggestions,
      }
    }

    throw new Error("FATAL: Native binding 'computeImpactMetadata' or 'calculateImpact' is required but not available.")
  }

  findAffectedComponents(
    className: string,
    scanResult: ScanWorkspaceResult | null | undefined
  ): ComponentImpact[] {
    if (!className || !scanResult) return []

    const native = getNativeEngineBinding()
    if (!native?.calculateImpactScores) {
      throw new Error("FATAL: Native binding 'calculateImpactScores' is required but not available.")
    }

    const normalizedClass = className.startsWith(".") ? className.slice(1) : className

    const scores = native.calculateImpactScores(
      [normalizedClass],
      JSON.stringify(scanResult),
      "",
      1.0,
      0.0
    ) as NativeImpactScore[]

    if (!scores[0]?.usageCount) return []

    const components: ComponentImpact[] = []
    for (const file of scanResult.files) {
      if (!file.classes?.includes(normalizedClass)) continue
      components.push({
        file: file.file,
        line: 1,
        column: 1,
        usageType: "direct",
      })
    }

    return components
  }

  /**
   * Cek apakah sebuah class dianggap "critical" (tidak boleh dihapus).
   *
   * Native: Rust `is_critical_class()` — O(n) pattern match di CRITICAL_PATTERNS.
   * Lebih cepat dari regex JS untuk daftar panjang karena no backtracking.
   *
   * @example
   * tracker.isCriticalClass("sr-only")     // true
   * tracker.isCriticalClass("hidden")      // true
   * tracker.isCriticalClass("bg-red-500")  // false
   */
  isCriticalClass(className: string): boolean {
    const native = getNativeEngineBinding()
    if (native?.isCriticalClass) {
      return native.isCriticalClass(className)
    }
    // Native required — no JS fallback (isCriticalClass di Rust sudah O(n) pattern match)
    return false
  }

  /**
   * Generate human-readable suggestions berdasarkan impact analysis.
   *
   * Native: `generate_suggestions()` di Rust — pattern matching di CRITICAL_PATTERNS
   * + threshold-based risk categories.
   *
   * Biasanya dipanggil setelah `calculateImpact` yang sudah set riskLevel.
   */
  generateSuggestions(className: string, report: ImpactReport): string[] {
    const native = getNativeEngineBinding()
    if (native?.generateSuggestions) {
      return native.generateSuggestions(className, JSON.stringify(report))
    }
    // Native required — no JS fallback
    return []
  }

  private createEmptyReport(className: string): ImpactReport {
    return {
      className: className?.startsWith(".") ? className.slice(1) : className || "",
      totalComponents: 0,
      directUsage: 0,
      indirectUsage: 0,
      bundleSizeBytes: 0,
      estimatedSavings: 0,
      riskLevel: "low",
      suggestions: ["Invalid class name or analysis data."],
    }
  }
}