/**
 * tailwind-styled-v4 — cv()
 *
 * Runtime: pure JS, browser-safe, zero fs/native.
 *
 * Dua mode:
 * 1. GENERATED (optimal) — import dari variants.generated.ts hasil `npx tw compile-variants`
 *    → O(1) lookup, static, zero runtime computation
 * 2. RUNTIME (fallback) — compute on-the-fly, pure JS
 *    → Tetap browser-safe, tidak ada native binding
 */

import { twMerge } from "tailwind-merge"
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
  defaultVariants?: Record<string, string>
): string | undefined {
  const table = __generatedRegistry[componentId]
  if (!table) return undefined

  // Native-first: build key di Rust (satu allocation, zero intermediate arrays)
  let key: string
  try {
    const binding = getNativeBinding()
    if (binding?.buildVariantLookupKey) {
      key = binding.buildVariantLookupKey(
        JSON.stringify(defaultVariants ?? {}),
        JSON.stringify(props)
      )
    } else {
      throw new Error("no binding")
    }
  } catch {
    // JS fallback — identik dengan sebelumnya
    const merged = { ...defaultVariants, ...props }
    key = Object.keys(merged)
      .sort()
      .filter((k) => k !== "className")
      .map((k) => `${k}:${String(merged[k])}`)
      .join("|")
  }

  return table[key]
}

// Native Rust variant resolution — O(1) HashMap lookup, zero JS allocation
function resolveVariantsNative<C extends ComponentConfig>(
  config: C,
  props: InferVariantProps<C> & { className?: string } & Readonly<Record<string, unknown>>
): string {
  const { base = "", variants = {}, compoundVariants = [], defaultVariants = {} } = config

  const binding = getNativeBinding()
  if (binding?.resolveSimpleVariants) {
    const cleanProps: Record<string, string> = {}
    for (const [k, v] of Object.entries(props)) {
      if (v !== undefined && v !== null && k !== "className") {
        cleanProps[k] = String(v)
      }
    }
    let result = binding.resolveSimpleVariants(
      base || null,
      variants as Record<string, Record<string, string>>,
      defaultVariants as Record<string, string>,
      cleanProps
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

  // binding not available — throw
  throw new Error("FATAL: Native binding 'resolveSimpleVariants' is required but not available.")
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

    // Mode 1: generated lookup table (O(1), hasil compile-variants)
    if (componentId) {
      const generated = lookupGenerated(
        componentId,
        props as Record<string, unknown>,
        config.defaultVariants as Record<string, string>
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
  // Native-first: satu JSON round-trip vs 3× Object.entries loops di JS
  try {
    const binding = getNativeBinding()
    if (binding?.validateVariantConfig) {
      const raw = binding.validateVariantConfig(JSON.stringify({
        variants: config.variants ?? {},
        defaultVariants: config.defaultVariants ?? {},
        compoundVariants: (config.compoundVariants ?? []).map((cv) => {
          // Flatten compound variant — Rust terima flat HashMap<String, String>
          const { class: cls, className, ...conditions } = cv as Record<string, unknown>
          const flat: Record<string, string> = {}
          for (const [k, v] of Object.entries(conditions)) {
            flat[k] = String(v)
          }
          if (cls) flat["class"] = String(cls)
          if (className) flat["className"] = String(className)
          return flat
        }),
      }))
      return {
        valid: raw.valid,
        errors: raw.errors.map((e) => ({
          type: e.errorType as VariantValidationError["type"],
          key: e.key,
          value: e.value,
          message: e.message,
        })),
        warnings: raw.warnings,
      }
    }
  } catch {
    // fall through to JS
  }

  // JS fallback
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