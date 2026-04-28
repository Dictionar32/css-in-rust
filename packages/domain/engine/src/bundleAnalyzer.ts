import type { ScanWorkspaceResult } from "@tailwind-styled/scanner"
import { getNativeEngineBinding } from "./native-bridge"
import type { SourceLocation } from "./ir"

export interface ClassBundleInfo {
  className: string
  usageCount: number
  usedInFiles: SourceLocation[]
  bundleSize: number
  componentsAffected: number
  variantChain: string[]
  isDeadCode: boolean
  dependencies: string[]
}

export interface BundleAnalysisResult {
  className: string
  totalUsage: number
  files: SourceLocation[]
  bundleSizeBytes: number
  variantChains: string[]
  isDeadCode: boolean
  dependencies: string[]
}

interface NativeClassBundleInfo {
  className: string
  usageCount: number
  filesJson: string        // JSON: string[]
  bundleSizeBytes: number
  isDeadCode: boolean
}

export class BundleAnalyzer {
  analyzeClass(
    className: string,
    scanResult: ScanWorkspaceResult,
    css: string
  ): BundleAnalysisResult {
    if (!className || className.trim() === "") throw new Error("Class name cannot be empty")
    if (!scanResult) throw new Error("Scan result is required for analysis")
    if (typeof css !== "string") throw new Error("CSS string is required for analysis")

    const normalizedClass = className.startsWith(".") ? className.slice(1) : className

    const native = getNativeEngineBinding()
    if (!native.analyzeClassUsage) {
      throw new Error("FATAL: Native binding 'analyzeClassUsage' is required but not available.")
    }

    const results = native.analyzeClassUsage(
      [normalizedClass],
      JSON.stringify(scanResult),
      css
    ) as NativeClassBundleInfo[]

    const info = results[0]
    const files: SourceLocation[] = info
      ? (JSON.parse(info.filesJson) as string[]).map((f) => ({ file: f, line: 1, column: 1 }))
      : []

    const dependencies = native.buildDependencyChain
      ? native.buildDependencyChain(normalizedClass)
      : []

    return {
      className: normalizedClass,
      totalUsage: info?.usageCount ?? 0,
      files,
      bundleSizeBytes: info?.bundleSizeBytes ?? 0,
      variantChains: [],
      isDeadCode: info?.isDeadCode ?? true,
      dependencies,
    }
  }

  analyzeAll(scanResult: ScanWorkspaceResult, css: string): Map<string, BundleAnalysisResult> {
    if (!scanResult) throw new Error("Scan result is required for analysis")
    if (typeof css !== "string") throw new Error("CSS string is required for analysis")

    const native = getNativeEngineBinding()
    if (!native.analyzeClassUsage) {
      throw new Error("FATAL: Native binding 'analyzeClassUsage' is required but not available.")
    }

    // Extract all CSS classes natively too
    const allClasses = Array.from(new Set([
      ...scanResult.uniqueClasses,
      ...(native.extractAllClasses ? (native.extractAllClasses(css) as string[]) : []),
    ]))

    const results = native.analyzeClassUsage(
      allClasses,
      JSON.stringify(scanResult),
      css
    ) as NativeClassBundleInfo[]

    const map = new Map<string, BundleAnalysisResult>()
    for (const info of results) {
      const files: SourceLocation[] = (JSON.parse(info.filesJson) as string[]).map((f) => ({
        file: f, line: 1, column: 1,
      }))
      const dependencies = native.buildDependencyChain
        ? native.buildDependencyChain(info.className)
        : []

      map.set(info.className, {
        className: info.className,
        totalUsage: info.usageCount,
        files,
        bundleSizeBytes: info.bundleSizeBytes,
        variantChains: [],
        isDeadCode: info.isDeadCode,
        dependencies,
      })
    }

    return map
  }

  calculateBundleContribution(className: string, css: string): number {
    if (!className || className.trim() === "") throw new Error("Class name cannot be empty")
    if (typeof css !== "string") throw new Error("CSS string is required")

    const native = getNativeEngineBinding()
    if (!native.calculateBundleContributions) {
      throw new Error("FATAL: Native binding 'calculateBundleContributions' is required but not available.")
    }
    const r = native.calculateBundleContributions([className], css)
    return r?.[0]?.sizeBytes ?? 0
  }

  detectDeadCode(scanResult: ScanWorkspaceResult, css: string): string[] {
    if (!scanResult) throw new Error("Scan result is required for dead code detection")
    if (typeof css !== "string") throw new Error("CSS string is required for dead code detection")

    const native = getNativeEngineBinding()
    if (!native.detectDeadCode) {
      throw new Error("FATAL: Native binding 'detectDeadCode' is required but not available.")
    }
    const r = native.detectDeadCode(JSON.stringify(scanResult), css)
    return r?.deadInCss ?? []
  }
}