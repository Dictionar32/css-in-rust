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

  const merged = { ...defaultVariants, ...props }
  const key = Object.keys(merged)
    .sort()
    .filter((k) => k !== "className")
    .map((k) => `${k}:${String(merged[k])}`)
    .join("|")

  return table[key]
}

// Pure JS fallback — compute on-the-fly
function resolveVariantsJS<C extends ComponentConfig>(
  config: C,
  props: InferVariantProps<C> & { className?: string } & Readonly<Record<string, unknown>>
): string {
  const { base = "", variants = {}, compoundVariants = [], defaultVariants = {} } = config
  const classes: string[] = []

  if (base) classes.push(...base.split(" ").filter(Boolean))

  const resolved: Record<string, unknown> = { ...defaultVariants, ...props }

  for (const [key, variantMap] of Object.entries(variants)) {
    const value = resolved[key]
    if (value !== undefined && value !== null) {
      const variantClass = (variantMap as Record<string, string>)[String(value)]
      if (variantClass) classes.push(...variantClass.split(" ").filter(Boolean))
    }
  }

  for (const compound of compoundVariants) {
    const { class: compoundClass, className: compoundClassName, ...conditions } = compound as Record<string, unknown>
    const matches = Object.entries(conditions).every(([key, val]) => resolved[key] === val)
    if (matches) {
      if (compoundClass) classes.push(...String(compoundClass).split(" ").filter(Boolean))
      if (compoundClassName) classes.push(...String(compoundClassName).split(" ").filter(Boolean))
    }
  }

  return [...new Set(classes)].join(" ")
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
      result = generated ?? resolveVariantsJS(config, props)
    } else {
      // Mode 2: pure JS fallback
      result = resolveVariantsJS(config, props)
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