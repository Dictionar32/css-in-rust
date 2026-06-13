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

// Cache untuk sorted variant keys per componentId — sort() hanya dilakukan sekali
// per componentId karena variantKeys tidak berubah selama runtime
const _sortedVariantKeysCache = new Map<string, string[]>()

function lookupGenerated(
  componentId: string,
  props: Record<string, unknown>,
  defaultVariants?: Record<string, string>,
  variantKeys?: string[]
): string | undefined {
  const table = __generatedRegistry[componentId]
  if (!table) return undefined

  const merged = { ...defaultVariants, ...props }

  // Cached sorted keys — sort() hanya dilakukan sekali per componentId
  let sortedKeys = _sortedVariantKeysCache.get(componentId)
  if (!sortedKeys) {
    const keysToUse = variantKeys
      ? variantKeys
      : Object.keys(merged).filter((k) => k !== "className")
    sortedKeys = [...keysToUse].sort()
    _sortedVariantKeysCache.set(componentId, sortedKeys)
  }

  // buildVariantLookupKey di Rust — satu NAPI call, eliminasi JS string concat loop
  const binding = getNativeBinding()
  if (!binding?.buildVariantLookupKey) {
    throw new Error("FATAL: Native binding 'buildVariantLookupKey' is required but not available.")
  }
  const relevantDefaults: Record<string, string> = {}
  const relevantProps: Record<string, string> = {}
  for (const k of sortedKeys) {
    const dv = defaultVariants?.[k]
    if (dv !== undefined) relevantDefaults[k] = String(dv)
    const pv = (props as Record<string, unknown>)[k]
    if (pv !== undefined && pv !== null) relevantProps[k] = String(pv)
  }
  const key = binding.buildVariantLookupKey(
    JSON.stringify(relevantDefaults),
    JSON.stringify(relevantProps)
  )
  return table[key]
}

// Cache config JSON per config object reference — menghindari JSON.stringify ulang
// untuk config yang sama. WeakMap dipakai agar GC bisa collect config jika
// komponen di-unmount (tidak ada strong reference leak).
const _configJsonCache = new WeakMap<object, string>()

function _getConfigJson(config: object): string {
  let json = _configJsonCache.get(config)
  if (!json) {
    // Convert TypeScript camelCase field names to Rust snake_case
    const cfgObj = (config as unknown as Record<string, unknown>)
    const cfgStr = JSON.stringify(cfgObj)
    const parsed = JSON.parse(cfgStr) as Record<string, unknown>

    // Rename defaultVariants to default_variants for Rust compatibility
    if ('defaultVariants' in parsed && !('default_variants' in parsed)) {
      parsed.default_variants = parsed.defaultVariants
      delete parsed.defaultVariants
    }

    // Rename compoundVariants to compound_variants. The Rust VariantConfig has
    // no serde alias for this field (unlike default_variants), so without the
    // rename Rust silently falls back to an empty vec and drops every compound.
    if ('compoundVariants' in parsed && !('compound_variants' in parsed)) {
      parsed.compound_variants = parsed.compoundVariants
      delete parsed.compoundVariants
    }

    // Rust requires a `variants` field (it is not #[serde(default)]); a base-only
    // or compound-only config omits it, which makes deserialization fail.
    if (!('variants' in parsed) || parsed.variants == null) {
      parsed.variants = {}
    }

    json = JSON.stringify(parsed)
    _configJsonCache.set(config, json)
  }
  return json
}

// Native Rust variant resolution
function resolveVariantsNative<C extends ComponentConfig>(
  config: C,
  props: InferVariantProps<C> & { className?: string } & Readonly<Record<string, unknown>>
): string {
  const { variants = {}, defaultVariants = {} } = config

  const binding = getNativeBinding()
  if (!binding?.resolveVariants) {
    throw new Error("FATAL: Native binding 'resolveVariants' is required but not available. Build cannot continue.")
  }

  const variantKeys = Object.keys(variants as Record<string, Record<string, string>>)
  const configJson = _getConfigJson(config as object)
  const cleanProps: Record<string, string> = {}
  for (const k of variantKeys) {
    const dv = (defaultVariants as Record<string, string>)[k]
    if (dv !== undefined && dv !== null) cleanProps[k] = String(dv)
  }
  for (const k of variantKeys) {
    const v = (props as Record<string, unknown>)[k]
    if (v !== undefined && v !== null) cleanProps[k] = String(v)
  }
  const propsJson = JSON.stringify(cleanProps)
  const result = binding.resolveVariants(configJson, propsJson)
  // NAPI returns VariantResult object with .classes property
  return (result as unknown as { classes: string }).classes
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
      // Mode 2: runtime resolution via native binding
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
        errors.push({
          type: "unknown_key",
          key,
          message: `compoundVariants[${i}]: "${key}" not in variants`,
        })
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}