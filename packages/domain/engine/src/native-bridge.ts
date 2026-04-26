/**
 * Engine — Rust native bridge
 *
 * Uses @tailwind-styled/shared for native binding resolution.
 */
import path from "node:path"
import {
  createDebugLogger,
  getDirname as getEsmDirname,
  loadNativeBinding,
  resolveNativeBindingCandidates,
  TwError,
} from "@tailwind-styled/shared"

const log = createDebugLogger("engine:native")

function getDirname(): string {
  if (typeof __dirname !== "undefined") return __dirname
  if (typeof import.meta !== "undefined" && import.meta.url) {
    return getEsmDirname(import.meta.url)
  }
  return process.cwd()
}

interface NativeEngineBinding {
  computeIncrementalDiff?: (
    previousJson: string,
    currentJson: string
  ) => {
    addedClasses: string[]
    removedClasses: string[]
    changedFiles: string[]
    unchangedFiles: number
  } | null
  hashFileContent?: (content: string) => string | null
  processFileChange?: (
    filepath: string,
    newClasses: string[],
    content: string | null
  ) => { added: string[]; removed: string[] } | null
  // Batch 3 additions
  parseCssRules?: (css: string) => Array<{
    className: string; property: string; value: string
    isImportant: boolean; variants: string[]; specificity: number
  }>
  batchSplitClasses?: (classes: string[]) => Array<{
    variantKey: string; base: string; variants: string[]
    isArbitrary: boolean; hasModifier: boolean; modifier?: string
  }>
  detectClassConflicts?: (usagesJson: string) => {
    conflicts: Array<{ group: string; variantKey: string; classes: string[]; message: string }>
    conflictedClassNames: string[]
  }
  classifyKnownClasses?: (classes: string[], safelist: string[], customUtilities: string[]) => Array<{
    className: string; isKnown: boolean; variantKey: string; baseClass: string
    utilityPrefix: string; isArbitrary: boolean
  }>
  diffClassLists?: (previous: string[], current: string[]) => {
    added: string[]; removed: string[]; unchanged: string[]; hasChanges: boolean
  }
  // Batch 4
  parseCssToRules?: (css: string, prefix?: string | null) => Array<{
    className: string; property: string; value: string; important: boolean
    variants: string[]; pseudoClasses: string[]; mediaQuery: string | null
    specificity: number; layer: string | null
  }>
  calculateBundleContributions?: (classes: string[], css: string) => Array<{
    className: string; sizeBytes: number; variantChains: string[]
    dependencies: string[]; inCss: boolean
  }>
  detectDeadCode?: (scanResultJson: string, css: string) => {
    deadInCss: string[]; deadInSource: string[]; liveClasses: string[]
    totalCssClasses: number; totalSourceClasses: number
  }
  calculateImpactScores?: (
    classes: string[], scanResultJson: string, css: string,
    usageWeight: number, sizeWeight: number
  ) => Array<{
    className: string; usageScore: number; sizeScore: number
    impactScore: number; usageCount: number; sizeBytes: number
  }>
  analyzeClassUsage?: (
    classes: string[], scanResultJson: string, css: string
  ) => Array<{
    className: string; usageCount: number; filesJson: string
    bundleSizeBytes: number; isDeadCode: boolean
  }>
  extractAllClasses?: (css: string) => string[]
  analyzeRouteClassDistribution?: (routeFilesJson: string, scanResultJson: string) => Array<{
    route: string; classes: string[]; exclusiveClasses: string[]; classCount: number
  }>
  /**
   * Resolve CSS cascade for a set of rules — pure Rust computation.
   *
   * Rust #[napi] signature:
   *   pub fn resolve_cascade(rules_json: String) -> String
   *
   * Input JSON: Array<{ id: number, property: number, origin: number,
   *   importance: number, layerOrder: number, specificity: number,
   *   conditionResult: number, insertionOrder: number }>
   *
   * Output JSON: { resolutions: Array<{ id: number, propertyId: number,
   *   winnerId: number, loserIds: number[], stage: number,
   *   finalDecision: string, causes: Array<{ type: string, [key: string]: unknown }> }> }
   */
  resolveCascade?: (rulesJson: string) => string
  /** FNV-1a fingerprint over ordered string parts — replaces createFingerprint() in ir.ts */
  createFingerprint?: (parts: string[]) => string
  /** DashMap-backed CSS reverse lookup — replaces ReverseLookup class */
  reverseLookupFromCss?: (css: string, property: string, value: string) => Array<{
    property: string; value: string
    usedInClasses: Array<{ className: string; specificity: number; isOverride: boolean; variants: string[] }>
  }>
  reverseLookupByProperty?: (css: string, property: string) => Array<{
    property: string; value: string
    usedInClasses: Array<{ className: string; specificity: number; isOverride: boolean; variants: string[] }>
  }>
  reverseLookupFindDependents?: (css: string, className: string) => string[]
  reverseLookupClearCache?: () => void
  reverseLookupCacheSize?: () => number
  // Impact analysis (impact_analysis.rs)
  calculateImpact?: (impactJson: string) => string
  calculateRisk?: (className: string, totalComponents: number) => string
  calculateSavings?: (bundleSizeBytes: number, componentCount: number) => number
}

const isValidEngineBinding = (module: unknown): module is NativeEngineBinding => {
  const candidate = module as Partial<NativeEngineBinding> | null | undefined
  return !!(
    candidate &&
    (candidate.computeIncrementalDiff || candidate.processFileChange || candidate.hashFileContent)
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Native Bridge - Factory Pattern
// ─────────────────────────────────────────────────────────────────────────

const createEngineBindingLoader = () => {
  const _state = {
    binding: undefined as NativeEngineBinding | null | undefined,
    loadError: null as string | null,
    candidatePaths: [] as string[],
  }

  const throwNativeBindingError = (): never => {
    const lines = [
      "FATAL: Native engine binding not found.",
      "",
      "This package requires the Rust native binding 'tailwind_styled_parser.node'.",
      "The binding was not found in any of these paths:",
      ..._state.candidatePaths.map((p) => `  - ${p}`),
      "",
    ]

    if (_state.loadError) {
      lines.push("Load error:", `  ${_state.loadError}`, "")
    }

    lines.push(
      "To fix this, run:",
      "  npm run build:rust",
      "",
      "This will build the native Rust module from the 'native/' directory.",
      "If you're using this package in a CI/CD environment, ensure Rust toolchain is installed",
      "and 'npm run build:rust' is executed before running tests or building."
    )

    throw new TwError("rust", "ENGINE_NATIVE_BINDING_NOT_FOUND", lines.join("\n"))
  }

  const getBinding = (): NativeEngineBinding => {
    const cached = _state.binding
    if (cached !== undefined) {
      if (cached === null) {
        return throwNativeBindingError()
      }
      return cached
    }

    const runtimeDir = getDirname()
    const candidates = resolveNativeBindingCandidates({
      runtimeDir,
      includeDefaultCandidates: true,
    })

    _state.candidatePaths = candidates

    const { binding, loadErrors } = loadNativeBinding<NativeEngineBinding>({
      runtimeDir,
      candidates,
      isValid: isValidEngineBinding,
      invalidExportMessage: "Module loaded but missing expected engine binding functions",
    })

    if (binding) {
      log(`engine native binding loaded successfully`)
      _state.binding = binding
      return binding
    }

    if (loadErrors.length > 0) {
      _state.loadError = loadErrors.map((e) => `${e.path}: ${e.message}`).join("; ")
    }

    _state.binding = null
    return throwNativeBindingError()
  }

  return {
    get: getBinding,
    reset: (): void => {
      _state.binding = undefined
      _state.loadError = null
      _state.candidatePaths = []
    },
  }
}

const engineBindingLoader = createEngineBindingLoader()

export function getNativeEngineBinding(): NativeEngineBinding {
  return engineBindingLoader.get()
}

export function computeIncrementalDiff(
  previousJson: string,
  currentJson: string
): {
  addedClasses: string[]
  removedClasses: string[]
  changedFiles: string[]
  unchangedFiles: number
} {
  const result = getNativeEngineBinding().computeIncrementalDiff?.(previousJson, currentJson)
  if (result === null || result === undefined) {
    throw new TwError(
      "rust",
      "ENGINE_DIFF_FAILED",
      "Native computeIncrementalDiff returned null/undefined"
    )
  }
  return result
}

export function hashFileContent(content: string): string {
  const result = getNativeEngineBinding().hashFileContent?.(content)
  if (result === null || result === undefined) {
    throw new TwError(
      "rust",
      "ENGINE_HASH_FAILED",
      "Native hashFileContent returned null/undefined"
    )
  }
  return result
}

export function processFileChange(
  filepath: string,
  newClasses: string[],
  content: string | null
): { added: string[]; removed: string[] } {
  const result = getNativeEngineBinding().processFileChange?.(filepath, newClasses, content)
  if (result === null || result === undefined) {
    throw new TwError(
      "rust",
      "ENGINE_PROCESS_FAILED",
      "Native processFileChange returned null/undefined"
    )
  }
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Route-level CSS analysis
// ─────────────────────────────────────────────────────────────────────────────

export interface RouteClassMap {
  route: string
  classes: string[]
  exclusiveClasses: string[]
  classCount: number
}

/**
 * Analisis distribusi classes per route — untuk CSS code splitting.
 *
 * @param routeFiles - map { route: filePath[] } menentukan file mana ke route mana
 * @param scanResult - hasil scan workspace
 *
 * @example
 * const routes = analyzeRouteClassDistribution(
 *   { "/": ["src/app/page.tsx"], "/about": ["src/app/about/page.tsx"] },
 *   scanResult
 * )
 */
export function analyzeRouteClassDistribution(
  routeFiles: Record<string, string[]>,
  scanResult: { files: Array<{ file: string; classes: string[] }> }
): RouteClassMap[] {
  const native = getNativeEngineBinding()
  if (!native?.analyzeRouteClassDistribution) {
    throw new Error("FATAL: Native binding 'analyzeRouteClassDistribution' is required but not available.")
  }
  return native.analyzeRouteClassDistribution(
    JSON.stringify(routeFiles),
    JSON.stringify(scanResult)
  ) as RouteClassMap[]
}