import { classToCss } from "@tailwind-styled/analyzer"
import { formatErrorMessage, LRUCache } from "@tailwind-styled/shared"

import { getAnimateBinding } from "./binding"
import type {
  AnimateOptions,
  AnimationRegistryOptions,
  CompiledAnimation,
  KeyframesDefinition,
} from "./types"

const DEFAULT_DURATION = 300
const DEFAULT_EASING = "ease-out"
const DEFAULT_DELAY = 0
const DEFAULT_FILL = "both"
const DEFAULT_ITERATIONS = 1
const DEFAULT_DIRECTION = "normal"
const DEFAULT_CACHE_LIMIT = 512

function normalizeNumber(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, Math.trunc(value as number))
}

function normalizeCacheLimit(value: number | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_CACHE_LIMIT
  return Math.max(1, Math.trunc(value as number))
}

function normalizeIterations(value: AnimateOptions["iterations"]): string {
  if (value === "infinite") return "infinite"
  if (!Number.isFinite(value)) return String(DEFAULT_ITERATIONS)
  return String(Math.max(0, Math.trunc(value as number)))
}

function stableKeyframesEntries(
  stops: KeyframesDefinition
): Array<{ offset: string; classes: string }> {
  return Object.entries(stops)
    .map(([offset, classes]) => ({ offset, classes }))
    .sort((left, right) => left.offset.localeCompare(right.offset))
}

function animationCacheKey(opts: AnimateOptions): string {
  const normalized = {
    from: (opts.from ?? "").trim(),
    to: (opts.to ?? "").trim(),
    duration: normalizeNumber(opts.duration as number | undefined, DEFAULT_DURATION),
    easing: (opts.easing ?? DEFAULT_EASING).trim(),
    delay: normalizeNumber(opts.delay as number | undefined, DEFAULT_DELAY),
    fill: opts.fill ?? DEFAULT_FILL,
    iterations: normalizeIterations(opts.iterations),
    direction: opts.direction ?? DEFAULT_DIRECTION,
    name: opts.name ?? "",
  }
  return JSON.stringify(normalized)
}

function keyframesCacheKey(name: string, stops: KeyframesDefinition): string {
  return `${name}::${JSON.stringify(stableKeyframesEntries(stops))}`
}

/**
 * Split class list string → individual tokens.
 *
 * Native-first: `splitAnimateClasses` di Rust pakai `split_whitespace()` —
 * satu pass, tanpa RegExp overhead, tanpa `.map(trim).filter(len>0)`.
 *
 * JS fallback: behavior identik, dipakai kalau binding belum load.
 *
 * Catatan: binding di-pass sebagai parameter untuk menghindari await
 * (fungsi ini dipanggil dalam konteks sync setelah binding sudah resolve).
 */
function splitClasses(classList: string, binding?: { splitAnimateClasses?: (s: string) => string[] }): string[] {
  if (binding?.splitAnimateClasses) {
    return binding.splitAnimateClasses(classList)
  }
  // JS fallback
  return classList
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

async function validateTailwindClasses(
  entries: Array<{ classList: string; context: string }>
): Promise<void> {
  const binding = await getAnimateBinding()
  const unknownByContext = new Map<string, Set<string>>()
  const failures: string[] = []

  for (const entry of entries) {
    const classes = splitClasses(entry.classList, binding)
    if (classes.length === 0) continue

    const result = await classToCss(classes)
    if (result.unknownClasses.length > 0) {
      unknownByContext.set(entry.context, new Set(result.unknownClasses))
    }
  }

  for (const [context, unknownSet] of unknownByContext.entries()) {
    failures.push(`[${context}] unknown classes: ${Array.from(unknownSet).join(", ")}`)
  }

  if (failures.length > 0) {
    throw new Error(`Animation validation failed:\n${failures.join("\n")}`)
  }
}

export interface AnimationRegistry {
  compileAnimation(opts: AnimateOptions): Promise<CompiledAnimation>
  compileKeyframes(name: string, stops: KeyframesDefinition): Promise<CompiledAnimation>
  extractCss(): string
  reset(): void
  /** Check apakah className sudah terdaftar di registry */
  has(className: string): boolean
}

export function createAnimationRegistry(
  options: AnimationRegistryOptions = {}
): AnimationRegistry {
  const cacheLimit = normalizeCacheLimit(options.cacheLimit)
  const cache = new LRUCache<string, CompiledAnimation>(cacheLimit)
  const cssChunks: string[] = []
  const classNames = new Set<string>()

  return {
    async compileAnimation(opts: AnimateOptions): Promise<CompiledAnimation> {
      const key = animationCacheKey(opts)
      const cached = cache.get(key)
      if (cached) return cached

      const binding = await getAnimateBinding()

      // Only validate if from/to are non-empty strings
      const classesToValidate = [
        { classList: opts.from ?? "", context: "from" },
        { classList: opts.to ?? "", context: "to" },
      ].filter((entry) => entry.classList.trim().length > 0)

      if (classesToValidate.length > 0) {
        await validateTailwindClasses(classesToValidate)
      }

      if (!binding.compileAnimation) {
        throw new Error("FATAL: Native binding 'compileAnimation' is required but not available.")
      }

      const result = binding.compileAnimation(
        opts.from,
        opts.to,
        opts.name ?? null,
        normalizeNumber(opts.duration, DEFAULT_DURATION),
        (opts.easing ?? DEFAULT_EASING) as string,
        normalizeNumber(opts.delay, DEFAULT_DELAY),
        opts.fill ?? DEFAULT_FILL,
        normalizeIterations(opts.iterations),
        opts.direction ?? DEFAULT_DIRECTION
      )

      if (!result) {
        throw new Error(`compileAnimation returned null for opts: ${JSON.stringify(opts)}`)
      }

      const compiled: CompiledAnimation = {
        className: result.className,
        keyframesCss: result.keyframesCss,
        animationCss: result.animationCss,
      }

      cache.set(key, compiled)
      if (result.keyframesCss) cssChunks.push(result.keyframesCss)
      if (result.animationCss) cssChunks.push(result.animationCss)

      return compiled
    },

    async compileKeyframes(name: string, stops: KeyframesDefinition): Promise<CompiledAnimation> {
      const key = keyframesCacheKey(name, stops)
      const cached = cache.get(key)
      if (cached) return cached

      const binding = await getAnimateBinding()
      const stopsJson = JSON.stringify(stableKeyframesEntries(stops))

      if (!binding.compileKeyframes) {
        throw new Error("FATAL: Native binding 'compileKeyframes' is required but not available.")
      }

      const result = binding.compileKeyframes(name, stopsJson)

      if (!result) {
        throw new Error(`compileKeyframes returned null for name: ${name}`)
      }

      const compiled: CompiledAnimation = {
        className: result.className,
        keyframesCss: result.keyframesCss,
        animationCss: result.animationCss,
      }

      cache.set(key, compiled)
      if (result.keyframesCss) cssChunks.push(result.keyframesCss)
      if (result.animationCss) cssChunks.push(result.animationCss)

      return compiled
    },

    extractCss(): string {
      return cssChunks.join("\n")
    },

    reset(): void {
      cache.clear?.()
      cssChunks.length = 0
      classNames.clear()
    },

    has(className: string): boolean {
      return classNames.has(className)
    },
  }
}