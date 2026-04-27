import { requireNativeCssCompiler } from "./binding"
import { parseClassToCssOptions, parseNativeCssCompileResult } from "./schemas"
import type { ClassToCssOptions, ClassToCssResult } from "./types"
import { formatErrorMessage } from "./utils"

export const normalizeClassInput = (input: string | string[], _binding?: { normalizeClassInput?: (s: string) => string[] }): string[] => {
  // Native-first: untuk single string, delegate ke Rust yang lebih cepat
  if (typeof input === "string") {
    if (_binding?.normalizeClassInput) {
      return _binding.normalizeClassInput(input)
    }
    return input
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
  }

  if (!Array.isArray(input)) {
    throw new TypeError("classToCss input must be a string or an array of strings.")
  }

  const out: string[] = []
  for (const item of input) {
    if (typeof item !== "string") {
      throw new TypeError("classToCss input array must contain only strings.")
    }
    const value = item.trim()
    if (value.length > 0) out.push(value)
  }
  return out
}

const normalizeClassToCssOptions = (
  options: ClassToCssOptions
): {
  prefix: string | null
  strict: boolean
} => {
  const parsed = parseClassToCssOptions(options)
  const strict = parsed.strict ?? false
  const prefix = parsed.prefix ?? null

  return { prefix, strict }
}

const mergeDeclarationMap = (
  target: Map<string, string>,
  css: string,
  binding: { parseCssRules?: (css: string) => Array<{ property: string; value: string; isImportant: boolean }> }
): void => {
  if (!binding.parseCssRules) {
    throw new Error("FATAL: Native binding 'parseCssRules' is required but not available.")
  }
  const rules = binding.parseCssRules(css)
  for (const rule of rules) {
    if (target.has(rule.property)) target.delete(rule.property)
    target.set(rule.property, rule.isImportant ? `${rule.value} !important` : rule.value)
  }
}

const declarationMapToString = (
  declarationMap: Map<string, string>,
  binding?: { declarationMapToString?: (entries: Array<{ property: string; value: string }>) => string }
): string => {
  // Native-first: serialize entries via Rust (satu allocation vs JS multiple)
  const entries = Array.from(declarationMap.entries()).map(([property, value]) => ({ property, value }))
  if (binding?.declarationMapToString) {
    return binding.declarationMapToString(entries)
  }
  // JS fallback
  return entries.map(({ property, value }) => `${property}: ${value}`).join("; ")
}

/**
 * Convert Tailwind class input into atomic CSS output via native binding.
 * @example
 * const css = await classToCss("opacity-0 translate-y-2", { strict: true })
 */
export const classToCss = async (
  input: string | string[],
  options: ClassToCssOptions = {}
): Promise<ClassToCssResult> => {
  const binding = await requireNativeCssCompiler()
  const inputClasses = normalizeClassInput(input, binding)
  const normalizedOptions = normalizeClassToCssOptions(options)

  if (inputClasses.length === 0) {
    return {
      inputClasses: [],
      css: "",
      declarations: "",
      resolvedClasses: [],
      unknownClasses: [],
      sizeBytes: 0,
    }
  }

  const prefix = normalizedOptions.prefix

  const results = await Promise.all(
    inputClasses.map(async (className) => {
      const compiled = (() => {
        try {
          return binding.compileCss([className], prefix)
        } catch (error) {
          throw new Error(
            `Native analyzer failed while compiling class "${className}": ${formatErrorMessage(error)}`,
            { cause: error }
          )
        }
      })()

      if (!compiled) {
        throw new Error(`Native analyzer returned no result for class "${className}".`)
      }

      const validated = parseNativeCssCompileResult(compiled, className)

      return {
        className,
        css: validated.css,
        resolvedClasses: validated.resolvedClasses,
        unknownClasses: validated.unknownClasses,
        sizeBytes: validated.sizeBytes,
      }
    })
  )

  const cssChunks = results.map((r) => r.css)
  const resolvedClasses = results.flatMap((r) => r.resolvedClasses)
  const unknownClasses = results.flatMap((r) => r.unknownClasses)
  const sizeBytes = results.reduce((sum, r) => sum + r.sizeBytes, 0)

  const declarationMap = new Map<string, string>()
  for (const result of results) {
    mergeDeclarationMap(declarationMap, result.css, binding)
  }

  const uniqueUnknown = Array.from(new Set(unknownClasses))
  if (normalizedOptions.strict && uniqueUnknown.length > 0) {
    throw new Error(`Unknown Tailwind classes: ${uniqueUnknown.join(", ")}`)
  }

  return {
    inputClasses,
    css: cssChunks.filter((chunk) => chunk.length > 0).join("\n"),
    declarations: declarationMapToString(declarationMap, binding),
    resolvedClasses: Array.from(new Set(resolvedClasses)),
    unknownClasses: uniqueUnknown,
    sizeBytes,
  }
}