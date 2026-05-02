import { initAnimate as initAnimateBackend } from "./binding"
import { createAnimationPresets } from "./preset"
import { type AnimationRegistry, createAnimationRegistry } from "./registry"
import type { AnimateOptions, CompiledAnimation, KeyframesDefinition } from "./types"

export type {
  AnimateOptions,
  AnimationRegistryOptions,
  CompiledAnimation,
  CSSDirection,
  CSSEasing,
  CSSFillMode,
  CSSIterationCount,
  CubicBezierEasing,
  KeyframesDefinition,
  PresetEasing,
  StepsEasing,
} from "./types"

const defaultRegistry = createAnimationRegistry()

export async function initAnimate(): Promise<void> {
  await initAnimateBackend()
}

export function getDefaultAnimationRegistry(): AnimationRegistry {
  return defaultRegistry
}

export async function compileAnimation(
  optsOrName: AnimateOptions | string,
  secondArg?: AnimationRegistry | Partial<AnimateOptions>
): Promise<CompiledAnimation> {
  // Overload: compileAnimation(name, partialOpts?)
  if (typeof optsOrName === "string") {
    const partialOpts =
      secondArg && typeof (secondArg as AnimationRegistry).compileAnimation !== "function"
        ? (secondArg as Partial<AnimateOptions>)
        : {}
    const opts: AnimateOptions = { from: "", to: "", ...partialOpts, name: optsOrName }
    return defaultRegistry.compileAnimation(opts)
  }
  // Original: compileAnimation(opts, registry?)
  const registry =
    secondArg && typeof (secondArg as AnimationRegistry).compileAnimation === "function"
      ? (secondArg as AnimationRegistry)
      : defaultRegistry
  return registry.compileAnimation(optsOrName)
}

export async function compileKeyframes(
  name: string,
  stops: KeyframesDefinition,
  registry: AnimationRegistry = defaultRegistry
): Promise<CompiledAnimation> {
  return registry.compileKeyframes(name, stops)
}

export async function animate(
  opts: AnimateOptions,
  registry: AnimationRegistry = defaultRegistry
): Promise<string> {
  return (await registry.compileAnimation(opts)).className
}

export async function keyframes(
  name: string,
  stops: KeyframesDefinition,
  registry: AnimationRegistry = defaultRegistry
): Promise<string> {
  return (await registry.compileKeyframes(name, stops)).className
}

export function extractAnimationCss(registry: AnimationRegistry = defaultRegistry): string {
  return registry.extractCss()
}

export function resetAnimationRegistry(registry: AnimationRegistry = defaultRegistry): void {
  registry.reset()
}

export interface InjectAnimationCssOptions {
  document?: Document
  styleId?: string
  silent?: boolean
}

export function injectAnimationCss(
  registry: AnimationRegistry = defaultRegistry,
  options: InjectAnimationCssOptions = {}
): void {
  const targetDocument =
    options.document ?? (typeof document !== "undefined" ? document : undefined)

  if (!targetDocument) {
    if (options.silent) return
    throw new Error("injectAnimationCss requires a browser Document.")
  }

  const styleId = options.styleId ?? "__tw_animate_styles__"

  // Check if style element already exists
  const existingStyleEl = targetDocument.getElementById(styleId) as HTMLStyleElement | null

  // Use existing or create new
  const styleEl = (() => {
    if (existingStyleEl) return existingStyleEl

    if (!targetDocument.head) {
      if (options.silent) return null
      throw new Error("injectAnimationCss requires document.head to exist.")
    }

    const newStyleEl = targetDocument.createElement("style")
    newStyleEl.id = styleId
    targetDocument.head.appendChild(newStyleEl)
    return newStyleEl
  })()

  if (!styleEl) return

  styleEl.textContent = registry.extractCss()
}

export { createAnimationRegistry } from "./registry"

// Export createAnimationRegistry as AnimationRegistry for consumers that use
// `new AnimationRegistry()` or import { AnimationRegistry } as a value
export { createAnimationRegistry as AnimationRegistry } from "./registry"

// Re-export the type separately for type-only imports
export type { AnimationRegistry as AnimationRegistryType } from "./registry"

export const animations = createAnimationPresets(defaultRegistry)