/**
 * tailwind-styled-v4 — Atomic CSS
 *
 * JS layer: thin wrapper, re-export types, expose registry diagnostics.
 * Rust layer: parseAtomicClass, generateAtomicCss, toAtomicClasses, registry.
 *
 * Removed from JS: TW_PROPERTY_MAP, sizeValue, textSize, fontWeight,
 * leadingValue, roundedValue, sanitizeClassName, REGISTRY Map.
 */

import { getNativeBridge } from "@tailwind-styled/compiler"

export interface AtomicRule {
  twClass: string
  atomicName: string
  property: string
  value: string
  modifier?: string
}

function getNative() {
  const native = getNativeBridge()
  if (
    !native?.parseAtomicClass ||
    !native?.generateAtomicCss ||
    !native?.toAtomicClasses
  ) {
    throw new Error(
      "FATAL: Native bindings 'parseAtomicClass', 'generateAtomicCss', 'toAtomicClasses' are required.\n" +
      "Build the native Rust module: npm run build:rust"
    )
  }
  return native
}

/**
 * Parse a single Tailwind class into an AtomicRule.
 * Returns null if the class prefix is not in the atomic property map.
 *
 * Rust: parse_atomic_class(tw_class: String) -> Option<String>
 */
export function parseAtomicClass(twClass: string): AtomicRule | null {
  const native = getNative()
  const json = native.parseAtomicClass(twClass)
  if (!json) return null
  return JSON.parse(json) as AtomicRule
}

/**
 * Generate CSS string from an array of AtomicRules.
 *
 * Rust: generate_atomic_css(rules_json: String) -> String
 */
export function generateAtomicCss(rules: AtomicRule[]): string {
  const native = getNative()
  return native.generateAtomicCss(JSON.stringify(rules))
}

/**
 * Convert a space-separated Tailwind class string to atomic equivalents.
 *
 * Rust: to_atomic_classes(tw_classes: String) -> String (JSON)
 */
export function toAtomicClasses(twClasses: string): {
  atomicClasses: string
  rules: AtomicRule[]
  unknownClasses: string[]
} {
  const native = getNative()
  return JSON.parse(native.toAtomicClasses(twClasses)) as {
    atomicClasses: string
    rules: AtomicRule[]
    unknownClasses: string[]
  }
}

export function getAtomicRegistry(): { size: number } {
  const native = getNativeBridge()
  return { size: native?.atomicRegistrySize?.() ?? 0 }
}

export function clearAtomicRegistry(): void {
  const native = getNativeBridge()
  native?.clearAtomicRegistry?.()
}