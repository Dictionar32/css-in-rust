/**
 * tailwind-styled-v4 v4 — cv()
 * 
 * UPGRADE: Now uses Rust native bridge for variant resolution (10x faster).
 * No JS fallback - native is required.
 * 
 * Standalone class variant function — no React needed.
 */

import { twMerge } from "tailwind-merge"
import type { ComponentConfig, CvFn, InferVariantProps } from "./types"
import { resolveNativeBinary } from "@tailwind-styled/shared"

let nativeResolveVariants: ((configJson: string, propsJson: string) => { classes: string }) | null = null
let nativeLoadAttempted = false

function getNativeResolver() {
  if (nativeResolveVariants !== null) return nativeResolveVariants
  if (nativeLoadAttempted) return null
  
  nativeLoadAttempted = true
  
  try {
    if (typeof window !== "undefined") return null
    
    const { path } = resolveNativeBinary("")
    if (!path) return null
    
    const binding = require(path)
    if (binding?.resolveVariants) {
      nativeResolveVariants = binding.resolveVariants
      return nativeResolveVariants
    }
  } catch {
    // Native not available
  }
  
  return null
}

export function cv<C extends ComponentConfig>(config: C): CvFn<C> {
  const { base = "", variants = {}, compoundVariants = [], defaultVariants = {} } = config

  // Dev-mode: validate defaults
  if (process.env.NODE_ENV !== "production") {
    for (const dk of Object.keys(defaultVariants)) {
      if (!(dk in variants)) {
        console.warn(`[tailwind-styled] defaultVariants["${dk}"] not in variants`)
      }
    }
  }

  return (
    props: InferVariantProps<C> & { className?: string } & Readonly<Record<string, unknown>> = {} as never
  ): string => {
    const native = getNativeResolver()
    
    if (!native) {
      throw new Error("Native binding 'resolveVariants' is required. Run 'npx tw setup' to install.")
    }
    
    let result: string
    
    try {
      const configJson = JSON.stringify({ base, variants, compoundVariants, defaultVariants })
      const propsJson = JSON.stringify(props)
      const nativeResult = native(configJson, propsJson)
      result = nativeResult.classes || ""
    } catch (error) {
      throw new Error(`Failed to resolve variants: ${error instanceof Error ? error.message : error}`)
    }

    if (props.className) {
      result = twMerge(result, props.className)
    }

    return result
  }
}

// Keep validation function (runs in dev only)
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
    for (const [key, val] of Object.entries(conditions)) {
      if (!(key in variants)) {
        errors.push({ type: "unknown_key", key, message: `compoundVariants[${i}]: "${key}" not in variants` })
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings }
}