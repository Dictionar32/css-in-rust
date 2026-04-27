/**
 * tailwind-styled-v5 — Native Bridge Loader
 *
 * Uses @tailwind-styled/shared for native binding resolution.
 * All functions require native Rust binding - no JS fallback.
 */

import { resolveNativeBinary, resolveRuntimeDir } from "@tailwind-styled/shared"
import { createRequire } from "node:module"

export interface ComponentMetadata {
  component: string
  tag: string
  baseClass: string
  subComponents: Record<string, { tag?: string; class: string }>
}

export interface NativeRscResult {
  isServer: boolean
  needsClientDirective: boolean
  clientReasons: string[]
}

const log = (...args: unknown[]) => {
  if (process.env.DEBUG?.includes("compiler:native")) {
    console.log("[compiler:native]", ...args)
  }
}

// ── Type Exports ────────────────────────────────────────────────────────────────

export interface NativeBridge {
  // Core transform
  transformSource?: (source: string, opts?: Record<string, string>) => NativeTransformResult | null
  extractClassesFromSource?: (source: string) => string[]
  hasTwUsage?: (source: string) => boolean
  isAlreadyTransformed?: (source: string) => boolean
  // Class Extractor
  extractAllClasses?: (source: string) => string[]
  parseClasses?: (raw: string) => Array<{ raw: string; type: string }>
  // Application functions
  extractComponentUsage?: (source: string) => Array<{ component: string; propsJson: string }>
  normalizeAndDedupClasses?: (raw: string) => { normalized: string; duplicatesRemoved: number; uniqueCount: number }
  diffClassLists?: (previous: string[], current: string[]) => { added: string[]; removed: string[]; unchanged: string[]; hasChanges: boolean }
  batchExtractClasses?: (filePaths: string[]) => Array<{ file: string; classes: string[]; contentHash: string; ok: boolean; error?: string }>
  checkAgainstSafelist?: (classes: string[], safelist: string[]) => { matched: string[]; unmatched: string[]; safelistSize: number }
  // Batch 2
  hoistComponents?: (source: string) => { code: string; hoisted: string[]; warnings: string[] }
  compileVariantTable?: (configJson: string) => { id: string; tableJson: string; keys: string[]; defaultKey: string; combinations: number }
  classifyAndSortClasses?: (classes: string[]) => Array<{ className: string; bucket: string; sortOrder: number }>
  mergeCssDeclarations?: (cssChunks: string[]) => { declarationsJson: string; declarationString: string; count: number }
  analyzeClassUsage?: (classes: string[], scanResultJson: string, css: string) => Array<{ className: string; usageCount: number; filesJson: string; bundleSizeBytes: number; isDeadCode: boolean }>
  analyzeRsc?: (source: string, filename: string) => {
    isServer: boolean
    needsClientDirective: boolean
    clientReasons: string[]
  }
  analyzeClasses?: (
    filesJson: string,
    cwd: string,
    flags: number
  ) => {
    css?: string
    code: string
    classes: string[]
    changed: boolean
    rscJson?: string
    metadataJson?: string
    safelist?: string[]
  } | null
  // CSS compilation
  compileCss?: (classes: string[], prefix?: string | null) => { css: string; classes: string[] }
  compileCssLightning?: (classes: string[]) => string
  /** Post-process raw Tailwind-generated CSS dengan LightningCSS di Rust */
  detectDeadCode?: (scanResultJson: string, css: string) => {
    deadInCss: string[]
    deadInSource: string[]
    liveClasses: string[]
    totalCssClasses: number
    totalSourceClasses: number
  }
  processTailwindCssLightning?: (css: string) => { css: string; size_bytes: number; resolved_classes: string[]; unknown_classes: string[] }
  processTailwindCssWithTargets?: (css: string, targets: string | null) => { css: string; size_bytes: number }
  // Atomic CSS (atomic.rs)
  parseAtomicClass?: (twClass: string) => string | null
  generateAtomicCss?: (rulesJson: string) => string
  toAtomicClasses?: (twClasses: string) => string
  clearAtomicRegistry?: () => void
  atomicRegistrySize?: () => number
  // Impact analysis (impact_analysis.rs)
  calculateImpact?: (impactJson: string) => string
  calculateRisk?: (className: string, totalComponents: number) => string
  calculateSavings?: (bundleSizeBytes: number, componentCount: number) => number
}

export interface NativeTransformResult {
  code: string
  classes: string[]
  changed: boolean
  rscJson?: string
  metadataJson?: string
}

export interface ClassExtractResult {
  classes: string[]
  component_names: string[]
  has_tw_usage: boolean
  has_use_client: boolean
  imports: string[]
}

const NATIVE_UNAVAILABLE_MESSAGE =
  "[tailwind-styled/compiler v5] Native binding is required but not available.\n" +
  "This package requires native Rust bindings. There is no JavaScript fallback.\n" +
  "Please ensure:\n" +
  "  1. The native module is properly installed\n" +
  "  2. You have run: npm run build:rust (or use prebuilt binary)\n" +
  "\n" +
  "For help, see: https://tailwind-styled.dev/docs/install"

// ── Native Bridge - Factory Pattern
// ─────────────────────────────────────────────────────────────────────────────

let nativeBridge: NativeBridge | null = null
let bridgeLoadAttempted = false
let bridgeLoadError: Error | null = null

const isValidNativeBridge = (mod: unknown): mod is NativeBridge => {
  const m = mod as Partial<NativeBridge>
  return !!(
    typeof m.transformSource === "function" ||
    typeof m.extractAllClasses === "function" ||
    typeof m.hasTwUsage === "function"
  )
}

export const getNativeBridge = (): NativeBridge => {
  if (nativeBridge) {
    return nativeBridge
  }

  if (bridgeLoadAttempted) {
    if (bridgeLoadError) {
      throw bridgeLoadError
    }
    throw new Error(NATIVE_UNAVAILABLE_MESSAGE)
  }

  bridgeLoadAttempted = true

  try {
    const runtimeDir = resolveRuntimeDir(undefined, import.meta.url)
    const require = createRequire(import.meta.url)
    
    // Use shared's native resolution
    const result = resolveNativeBinary(runtimeDir)

    if (result.path && result.path.endsWith(".node")) {
      try {
        const binding = require(result.path) as NativeBridge
        if (isValidNativeBridge(binding)) {
          nativeBridge = binding
          log("Native bridge loaded successfully from:", result.path)
          return nativeBridge
        }
      } catch (e) {
        log("Failed to require native binding:", e)
      }
    }

    throw new Error(`${NATIVE_UNAVAILABLE_MESSAGE}\n\nTried paths: ${result.tried.join("\n")}`)
  } catch (err) {
    bridgeLoadError = err instanceof Error ? err : new Error(String(err))
    log("Failed to load native bridge:", bridgeLoadError.message)
    throw bridgeLoadError
  }
}

export const resetNativeBridgeCache = (): void => {
  nativeBridge = null
  bridgeLoadAttempted = false
  bridgeLoadError = null
  log("Native bridge cache reset")
}

// ── Adaptor for native results
// ─────────────────────────────────────────────────────────────────────────────

export const adaptNativeResult = (
  raw: NativeTransformResult
): {
  code: string
  classes: string[]
  changed: boolean
  rsc?: NativeRscResult
  metadata?: ComponentMetadata[]
} => {
  return {
    code: raw.code ?? "",
    classes: raw.classes ?? [],
    changed: raw.changed ?? false,
    rsc: raw.rscJson ? JSON.parse(raw.rscJson) : undefined,
    metadata: raw.metadataJson ? JSON.parse(raw.metadataJson) : undefined,
  }
}

// ── Eager init — load native bridge saat module dimuat, bukan saat request pertama
// Mencegah crash di Turbopack dev mode karena lazy init mid-request
// ─────────────────────────────────────────────────────────────────────────────
if (typeof process !== "undefined" && !bridgeLoadAttempted) {
  try {
    getNativeBridge()
  } catch {
    // Sudah di-capture di bridgeLoadError — akan di-throw saat dipanggil pertama kali
  }
}
