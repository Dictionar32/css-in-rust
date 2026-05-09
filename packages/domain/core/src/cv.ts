/**
 * tailwind-styled-v4 — cv()
 *
 * Runtime: native-first with fallback to generated variant tables.
 *
 * Dua mode:
 * 1. GENERATED (optimal) — import dari variants.generated.ts hasil `npx tw compile-variants`
 *    → O(1) lookup, static, zero runtime computation
 * 2. RUNTIME (fallback) — compute on-the-fly via native binding
 *    → Requires native Rust binding for variant resolution
 */

import { twMerge } from "./merge"
import type { ComponentConfig, CvFn, InferVariantProps } from "./types"
import { getNativeBinding } from "./native"

// Registry untuk generated lookup tables
// Diisi oleh cv.register() dari generated file
const __generatedRegistry: Record<string, Record<string, string>> = {}

/**
 * Register pre-computed variant table dari generated file.
 * Dipanggil otomatis saat import variants.generated.ts
 */
export function registerVariantTable(
  componentId: string,
  table: Record<string, string>
): void {
  __generatedRegistry[componentId] = table
}

function lookupGenerated(
  componentId: string,
  props: Record<string, unknown>,
  defaultVariants?: Record<string, string>,
  variantKeys?: string[]
): string | undefined {
  const table = __generatedRegistry[componentId]
  if (!table) return undefined

  const merged = { ...defaultVariants, ...props }
  // Filter to declared variant keys only to prevent non-variant props (e.g. onClick, selected)
  // from corrupting the lookup key and causing cache misses.
  const keysToUse = variantKeys
    ? variantKeys
    : Object.keys(merged).filter((k) => k !== "className")
  const key = keysToUse
    .sort()
    .map((k) => `${k}:${String(merged[k])}`)
    .join("|")

  return table[key]
}

// Native Rust variant resolution — O(1) HashMap lookup, zero JS allocation
function resolveVariantsNative<C extends ComponentConfig>(
  config: C,
  props: InferVariantProps<C> & { className?: string } & Readonly<Record<string, unknown>>
): string {
  const { base = "", variants = {}, compoundVariants = [], defaultVariants = {} } = config

  // Only pass declared variant keys to the resolver — prevents non-variant props
  // (e.g. selected, disabled, onClick) from leaking into Rust and causing
  // SSR/client hydration mismatches. Mirrors the JS fallback scope exactly.
  const variantKeys = Object.keys(variants as Record<string, Record<string, string>>)

  const binding = getNativeBinding()
  if (binding?.resolveSimpleVariants) {
    // Pre-merge di JS: defaultVariants sebagai base, user props override
    // Filter to declared variant keys only — ensures Rust and JS produce identical output.
    const mergedProps: Record<string, string> = {}
    for (const k of variantKeys) {
      const dv = (defaultVariants as Record<string, string>)[k]
      if (dv !== undefined && dv !== null) mergedProps[k] = String(dv)
    }
    for (const k of variantKeys) {
      const v = (props as Record<string, unknown>)[k]
      if (v !== undefined && v !== null) mergedProps[k] = String(v)
    }

    let result = binding.resolveSimpleVariants(
      base || null,
      variants as Record<string, Record<string, string>>,
      {}, // already merged into mergedProps
      mergedProps
    )

    // compound variants — still resolved in JS (Rust resolveSimpleVariants tidak handle compound)
    const resolved: Record<string, unknown> = { ...defaultVariants, ...props }
    const extra: string[] = []
    for (const compound of compoundVariants) {
      const { class: compoundClass, className: compoundClassName, ...conditions } = compound as Record<string, unknown>
      const matches = Object.entries(conditions).every(([key, val]) => resolved[key] === val)
      if (matches) {
        if (compoundClass) extra.push(String(compoundClass))
        if (compoundClassName) extra.push(String(compoundClassName))
      }
    }

    if (extra.length > 0) result = `${result} ${extra.join(" ")}`.trim()
    return result
  }

  // JS fallback — used in browser where Rust native binding is unavailable.
  // Must produce output identical to the Rust path for SSR hydration to succeed.
  const resolved: Record<string, string> = {}
  for (const k of variantKeys) {
    const dv = (defaultVariants as Record<string, string>)[k]
    if (dv !== undefined) resolved[k] = dv
  }
  for (const k of variantKeys) {
    const v = (props as Record<string, unknown>)[k]
    if (v !== undefined && v !== null) resolved[k] = String(v)
  }

  const classes: string[] = []
  if (base) classes.push(base)
  for (const k of variantKeys) {
    const variantMap = (variants as Record<string, Record<string, string>>)[k]
    const selected = resolved[k]
    if (selected !== undefined && variantMap?.[selected] !== undefined) {
      classes.push(variantMap[selected])
    }
  }

  // compound variants
  const resolvedFull: Record<string, unknown> = { ...defaultVariants, ...props }
  for (const compound of compoundVariants) {
    const { class: compoundClass, className: compoundClassName, ...conditions } = compound as Record<string, unknown>
    const matches = Object.entries(conditions).every(([key, val]) => resolvedFull[key] === val)
    if (matches) {
      if (compoundClass) classes.push(String(compoundClass))
      if (compoundClassName) classes.push(String(compoundClassName))
    }
  }

  return classes.filter(Boolean).join(" ")
}

export function cv<C extends ComponentConfig>(config: C, componentId?: string): CvFn<C> {
  if (process.env.NODE_ENV !== "production") {
    const { variants = {}, defaultVariants = {} } = config
    for (const dk of Object.keys(defaultVariants)) {
      if (!(dk in variants)) {
        console.warn(`[tailwind-styled] defaultVariants["${dk}"] not in variants`)
      }
    }
  }

  return (
    props: InferVariantProps<C> & { className?: string } & Readonly<Record<string, unknown>> = {} as never
  ): string => {
    let result: string
    const variantKeys = Object.keys(config.variants ?? {})

    // Mode 1: generated lookup table (O(1), hasil compile-variants)
    if (componentId) {
      const generated = lookupGenerated(
        componentId,
        props as Record<string, unknown>,
        config.defaultVariants as Record<string, string>,
        variantKeys
      )
      result = generated ?? resolveVariantsNative(config, props)
    } else {
      // Mode 2: pure JS fallback
      result = resolveVariantsNative(config, props)
    }

    return props.className ? twMerge(result, props.className) : result
  }
}

export interface VariantValidationError {
  type: "unknown_key" | "unknown_value" | "missing_default" | "compound_condition_missing"
  key: string
  value?: string
  message: string
}

export interface VariantValidationResult {
  valid: boolean
  errors: VariantValidationError[]
  warnings: string[]
}

export function validateVariantConfig(config: ComponentConfig): VariantValidationResult {
  const errors: VariantValidationError[] = []
  const warnings: string[] = []
  const { variants = {}, defaultVariants = {}, compoundVariants = [] } = config

  for (const [key, val] of Object.entries(defaultVariants)) {
    if (!(key in variants)) {
      errors.push({ type: "unknown_key", key, message: `defaultVariants["${key}"] not in variants` })
    } else if (val && !((variants[key] ?? {})[val])) {
      errors.push({ type: "unknown_value", key, value: val, message: `invalid value "${val}"` })
    }
  }

  for (const [i, compound] of compoundVariants.entries()) {
    const { class: _cls, ...conditions } = compound
    for (const [key] of Object.entries(conditions)) {
      if (!(key in variants)) {
        errors.push({ type: "unknown_key", key, message: `compoundVariants[${i}]: "${key}" not in variants` })
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}