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

  // Build lookup key — hot path, hindari array allocation dengan string concat
  let key = ""
  for (let i = 0; i < sortedKeys.length; i++) {
    if (i > 0) key += "|"
    key += sortedKeys[i] + ":" + String(merged[sortedKeys[i]])
  }

  return table[key]
}

// Cache config JSON per config object reference — menghindari JSON.stringify ulang
// untuk config yang sama. WeakMap dipakai agar GC bisa collect config jika
// komponen di-unmount (tidak ada strong reference leak).
const _configJsonCache = new WeakMap<object, string>()

function _getConfigJson(config: object): string {
  let json = _configJsonCache.get(config)
  if (!json) {
    json = JSON.stringify(config)
    _configJsonCache.set(config, json)
  }
  return json
}

// Native Rust variant resolution
// Path 1 (optimal): resolveVariants — full resolution termasuk compound variants di Rust
// Path 2 (fallback): resolveSimpleVariants + JS compound variants
// Path 3 (browser): pure JS fallback
function resolveVariantsNative<C extends ComponentConfig>(
  config: C,
  props: InferVariantProps<C> & { className?: string } & Readonly<Record<string, unknown>>
): string {
  const { base = "", variants = {}, compoundVariants = [], defaultVariants = {} } = config
  const variantKeys = Object.keys(variants as Record<string, Record<string, string>>)

  try {
    const binding = getNativeBinding()

    // Path 1: resolveVariants — full resolution termasuk compound variants
    // Lebih cepat dari resolveSimpleVariants + JS compound loop karena
    // tidak ada round-trip JS untuk compound resolution
    if (binding?.resolveVariants) {
      const configJson = _getConfigJson(config as object)
      // Build props JSON hanya dari variant keys yang relevan — hindari mengirim
      // semua props (onClick, ref, dll) ke Rust yang akan diabaikan
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
      return result.classes
    }

    // Path 2: resolveSimpleVariants + JS compound variants (fallback)
    if (binding?.resolveSimpleVariants) {
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
        {},
        mergedProps
      )

      // Compound variants — JS loop (hanya masuk sini jika resolveVariants tidak tersedia)
      if (compoundVariants.length > 0) {
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
      }

      return result
    }
  } catch {
    // Native binding unavailable — browser context, fall through ke JS
  }

  // Path 3: pure JS fallback (browser)
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