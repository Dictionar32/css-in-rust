/**
 * Public type contracts for @tailwind-styled/analyzer.
 * Keep this file aligned with the runtime report shape exposed by src/index.ts.
 */
import type { ScanWorkspaceOptions } from "@tailwind-styled/scanner"

export interface ClassUsage {
  readonly name: string
  readonly count: number
  readonly isUnused?: boolean
  readonly isConflict?: boolean
}

export interface ClassConflict {
  readonly className: string
  readonly variants: readonly string[]
  readonly classes: readonly string[]
  readonly message: string
}

export interface AnalyzerClassStats {
  readonly all: readonly ClassUsage[]
  readonly top: readonly ClassUsage[]
  readonly frequent: readonly ClassUsage[]
  readonly unique: readonly ClassUsage[]
  readonly distribution: Readonly<Record<string, number>>
}

export interface TailwindConfigSummary {
  readonly path: string
  readonly loaded: boolean
  readonly safelistCount: number
  readonly customUtilityCount: number
  readonly warning?: string
}

export interface AnalyzerSemanticReport {
  readonly unusedClasses: readonly ClassUsage[]
  readonly unknownClasses: readonly ClassUsage[]
  readonly conflicts: readonly ClassConflict[]
  readonly tailwindConfig?: TailwindConfigSummary
}

export interface AnalyzerReport {
  readonly root: string
  readonly totalFiles: number
  readonly uniqueClassCount: number
  readonly totalClassOccurrences: number
  readonly classStats: AnalyzerClassStats
  readonly safelist: readonly string[]
  readonly semantic?: AnalyzerSemanticReport
}

export interface AnalyzerOptions {
  readonly scanner?: ScanWorkspaceOptions
  readonly classStats?: {
    readonly top?: number
    readonly frequentThreshold?: number
  }
  readonly includeClass?: (className: string) => boolean
  readonly semantic?:
    | boolean
    | {
        readonly tailwindConfigPath?: string
      }
}

export interface ClassToCssOptions {
  readonly prefix?: string | null
  readonly strict?: boolean
}

export interface ClassToCssResult {
  readonly inputClasses: readonly string[]
  readonly css: string
  readonly declarations: string
  readonly resolvedClasses: readonly string[]
  readonly unknownClasses: readonly string[]
  readonly sizeBytes: number
}

export interface LoadedTailwindConfig {
  readonly path: string
  readonly loaded: boolean
  readonly warning?: string
  readonly safelist: Set<string>
  readonly customUtilities: Set<string>
}

export interface TailwindConfigCacheEntry {
  readonly mtimeMs: number
  readonly size: number
  readonly config: LoadedTailwindConfig
}

export interface NativeAnalyzerBinding {
  analyzeClasses(filesJson: string, cwd: string, flags: number): unknown
  compileCss?: (classes: string[], prefix: string | null) => unknown
}

export interface NativeCssCompilerBinding extends NativeAnalyzerBinding {
  compileCss(classes: string[], prefix: string | null): unknown
  parseCssRules?(css: string): Array<{
    className: string; property: string; value: string
    isImportant: boolean; variants: string[]; specificity: number
  }>
}