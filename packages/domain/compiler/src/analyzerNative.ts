/**
 * analyzerNative.ts
 *
 * Native Rust bindings for CSS analysis and optimization.
 */

import { getNativeBridge } from "./nativeBridge"
export type {
  DeadCodeResult,
  ClassUsageItem,
  ContainerConfig,
  HoistResult,
  VariantTableResult,
  ClassifyResult,
  MergeResult,
  ProcessedCssResult,
} from "./nativeBridge"

/**
 * Detect dead CSS selectors in generated CSS.
 */
export function detectDeadCode(scanResultJson: string, css: string) {
  const native = getNativeBridge()
  if (!native?.detectDeadCode) throw new Error("detectDeadCode not available")
  return native.detectDeadCode(scanResultJson, css)
}

/**
 * Analyze class usage across scanned files.
 */
export function analyzeClassUsageNative(classes: string[], scanResultJson: string, css: string) {
  const native = getNativeBridge()
  if (!native?.analyzeClassUsage) throw new Error("analyzeClassUsage not available")
  return native.analyzeClassUsage(classes, scanResultJson, css)
}

/**
 * Analyze entire class list and generate CSS.
 */
export function analyzeClassesNative(filesJson: string, cwd: string, flags?: number) {
  const native = getNativeBridge()
  if (!native?.analyzeClasses) throw new Error("analyzeClasses not available")
  return native.analyzeClasses(filesJson, cwd, flags ?? 0)
}

/**
 * Analyze React Server Component requirements.
 */
export function analyzeRscNative(source: string, filename: string) {
  const native = getNativeBridge()
  if (!native?.analyzeRsc) throw new Error("analyzeRsc not available")
  return native.analyzeRsc(source, filename)
}

/**
 * Optimize CSS by removing dead code and minifying.
 */
export function optimizeCssNative(css: string) {
  const native = getNativeBridge()
  if (!native?.processTailwindCssLightning) throw new Error("processTailwindCssLightning not available")
  const result = native.processTailwindCssLightning(css)
  return {
    css: result.css,
    originalSize: css.length,
    optimizedSize: result.size_bytes,
    reductionPercentage: ((css.length - result.size_bytes) / css.length) * 100,
  }
}

/**
 * Process Tailwind CSS with Lightning CSS post-processing.
 */
export function processTailwindCssLightning(css: string) {
  const native = getNativeBridge()
  if (!native?.processTailwindCssLightning) throw new Error("processTailwindCssLightning not available")
  return native.processTailwindCssLightning(css)
}

/**
 * Eliminate dead CSS selectors.
 */
export function eliminateDeadCssNative(css: string, deadClasses: string[]): string {
  const native = getNativeBridge()
  if (!native?.eliminateDeadCss) throw new Error("eliminateDeadCss not available")
  return native.eliminateDeadCss(css, deadClasses)
}

/**
 * Hoist components from source code.
 */
export function hoistComponentsNative(source: string) {
  const native = getNativeBridge()
  if (!native?.hoistComponents) throw new Error("hoistComponents not available")
  return native.hoistComponents(source)
}

/**
 * Compile variant configuration table.
 */
export function compileVariantTableNative(configJson: string) {
  const native = getNativeBridge()
  if (!native?.compileVariantTable) throw new Error("compileVariantTable not available")
  return native.compileVariantTable(configJson)
}

/**
 * Classify and sort classes by bucket.
 */
export function classifyAndSortClassesNative(classes: string[]) {
  const native = getNativeBridge()
  if (!native?.classifyAndSortClasses) throw new Error("classifyAndSortClasses not available")
  return native.classifyAndSortClasses(classes)
}

/**
 * Merge CSS declarations from multiple chunks.
 */
export function mergeCssDeclarationsNative(cssChunks: string[]) {
  const native = getNativeBridge()
  if (!native?.mergeCssDeclarations) throw new Error("mergeCssDeclarations not available")
  return native.mergeCssDeclarations(cssChunks)
}
