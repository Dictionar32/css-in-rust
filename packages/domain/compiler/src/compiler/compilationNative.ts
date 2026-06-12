/**
 * compilationNative.ts
 *
 * Native Rust bindings for CSS compilation and advanced features.
 */

import { getNativeBridge } from "../nativeBridge"
export type {
  ContainerConfig,
  StateCssConfig,
  GeneratedStateCss,
} from "../nativeBridge"

/**
 * Compile Tailwind classes directly to CSS.
 */
export function compileCssNative2(classes: string[], prefix?: string | null) {
  const native = getNativeBridge()
  if (!native?.compileCss) throw new Error("compileCss not available")
  return native.compileCss(classes, prefix)
}

/**
 * Compile CSS using Lightning CSS post-processing.
 */
export function compileCssLightning(classes: string[]): string {
  const native = getNativeBridge()
  if (!native?.compileCssLightning) throw new Error("compileCssLightning not available")
  return native.compileCssLightning(classes)
}

/**
 * Extract Tailwind state configurations from source code.
 */
export function extractTwStateConfigsNative(source: string, filename: string) {
  const native = getNativeBridge()
  if (!native?.extractTwStateConfigs) throw new Error("extractTwStateConfigs not available")
  return native.extractTwStateConfigs(source, filename)
}

/**
 * Generate static state CSS from configuration.
 */
export function generateStaticStateCssNative(
  inputs: Array<{
    tag: string
    componentName: string
    statesJson: string
  }>,
  resolvedCss?: string | null
) {
  const native = getNativeBridge()
  if (!native?.generateStaticStateCss) throw new Error("generateStaticStateCss not available")
  return native.generateStaticStateCss(inputs, resolvedCss ?? null)
}

/**
 * Extract and generate state CSS in one step.
 */
export function extractAndGenerateStateCssNative(source: string, filename: string) {
  const native = getNativeBridge()
  if (!native?.extractAndGenerateStateCss) throw new Error("extractAndGenerateStateCss not available")
  return native.extractAndGenerateStateCss(source, filename)
}

/**
 * Convert layout/utility class string to CSS declarations.
 */
export function layoutClassesToCss(classes: string): string {
  const native = getNativeBridge()
  if (!native?.layoutClassesToCss) throw new Error("layoutClassesToCss not available")
  return native.layoutClassesToCss(classes)
}

/**
 * Hash content for deterministic ID generation.
 */
export function hashContent(input: string, algorithm: string = "sha256", length: number = 8): string {
  const native = getNativeBridge()
  if (!native?.hashContent) throw new Error("hashContent not available")
  return native.hashContent(input, algorithm, length)
}

/**
 * Extract container query configurations from source.
 */
export function extractTwContainerConfigs(source: string) {
  const native = getNativeBridge()
  if (!native?.extractTwContainerConfigs) throw new Error("extractTwContainerConfigs not available")
  return native.extractTwContainerConfigs(source)
}

/**
 * Parse Tailwind class into atomic CSS representation.
 */
export function parseAtomicClass(twClass: string): string | null {
  const native = getNativeBridge()
  if (!native?.parseAtomicClass) throw new Error("parseAtomicClass not available")
  return native.parseAtomicClass(twClass)
}

/**
 * Generate atomic CSS from rules.
 */
export function generateAtomicCss(rulesJson: string): string {
  const native = getNativeBridge()
  if (!native?.generateAtomicCss) throw new Error("generateAtomicCss not available")
  return native.generateAtomicCss(rulesJson)
}

/**
 * Convert Tailwind classes to atomic CSS classes.
 */
export function toAtomicClasses(twClasses: string): string {
  const native = getNativeBridge()
  if (!native?.toAtomicClasses) throw new Error("toAtomicClasses not available")
  return native.toAtomicClasses(twClasses)
}

/**
 * Clear atomic CSS registry.
 */
export function clearAtomicRegistry(): void {
  const native = getNativeBridge()
  if (!native?.clearAtomicRegistry) return
  native.clearAtomicRegistry()
}

/**
 * Get atomic registry size.
 */
export function atomicRegistrySize(): number {
  const native = getNativeBridge()
  if (!native?.atomicRegistrySize) return 0
  return native.atomicRegistrySize()
}

