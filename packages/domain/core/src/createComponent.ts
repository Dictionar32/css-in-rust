// AnimateOptions loaded dynamically to avoid bundling @tailwind-styled/animate
type AnimateOptions = { from: string; to: string; duration?: number; easing?: string; delay?: number; fill?: string; iterations?: number | "infinite"; direction?: string; name?: string }
import React from "react"

import { processContainer } from "./containerQuery"
import { twMerge } from "./merge"
import { processState } from "./stateEngine"
import type { ComponentConfig, TwStyledComponent } from "./types"

const ALWAYS_BLOCKED = new Set(["base", "_ref", "state", "container", "containerName"])

// ── Sub-component auto-registration ──────────────────────────────────────────

/**
 * Extract subcomponent names dari template string.
 * Support dua syntax:
 *   - Bracket  : `[icon] { ... }` → "icon"
 *   - Bare-word: `icon { ... }`   → "icon"
 *
 * FIX: sebelumnya hanya handle bracket syntax `[name]`,
 * sehingga bare-word blocks tidak dikenali → kelas dari block
 * ikut masuk ke twMerge bersama base classes → conflict.
 */
function parseSubComponentNames(template: string): string[] {
  const bracketMatches = [...template.matchAll(/\[(\w+)\]\s*\{/g)].map((m) => m[1]!)
  const bareMatches = [...template.matchAll(/(?<![\[\w])([a-z][a-zA-Z0-9_-]*)\s*\{/g)].map((m) => m[1]!)
  return [...new Set([...bracketMatches, ...bareMatches])]
}

/**
 * Strip semua subcomponent blocks dari template string sehingga
 * twMerge hanya menerima base classes (outer scope).
 *
 * Support dua syntax:
 *   - Bracket  : `[name] { classes }` — syntax lama
 *   - Bare-word: `name { classes }`   — syntax baru di examples/
 *
 * FIX: sebelumnya hanya strip `[name] { }`. Bare-word blocks tidak di-strip
 * → `icon { flex h-4 w-4 }` terbaca flat oleh twMerge bersama base
 * `flex h-12 w-full` → conflict h-12/h-4 dan w-full/w-4.
 */
function extractBaseClasses(template: string): string {
  return template
    .replace(/\[\w+\]\s*\{[^}]*\}/g, "")
    .replace(/(?<![\[\w])[a-z][a-zA-Z0-9_-]*\s*\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Buat sub-component React FC untuk setiap name yang ditemukan di template.
 * Sub-component meneruskan className ke elemen wrapper agar bisa di-style.
 */
function createSubComponentAccessor(
  parentDisplayName: string,
  name: string
): React.FC<{ children?: React.ReactNode; className?: string }> {
  const SubComponent: React.FC<{ children?: React.ReactNode; className?: string }> = ({
    children,
    className,
  }) => React.createElement(React.Fragment, null, children)
  SubComponent.displayName = `${parentDisplayName}[${name}]`
  return SubComponent
}

/** Register semua sub-components yang di-parse dari template ke component object. */
function registerSubComponents<P extends object>(
  component: TwStyledComponent<P>,
  template: string
): void {
  const names = parseSubComponentNames(template)
  const displayName = component.displayName ?? "tw"
  const map = component as unknown as Record<string, unknown>
  for (const name of names) {
    if (!(name in map)) {
      map[name] = createSubComponentAccessor(displayName, name)
    }
  }
}

type RuntimeProps = Record<string, unknown> & { className?: string }

function normalizeClassName(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function makeFilterProps(variantKeys: Set<string>) {
  return function filterProps(props: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const key in props) {
      if (variantKeys.has(key)) continue
      if (key.startsWith("$")) continue
      if (ALWAYS_BLOCKED.has(key)) continue
      out[key] = props[key]
    }
    return out
  }
}

function resolveVariants(
  variants: Record<string, Record<string, string>>,
  props: Record<string, unknown>,
  defaults: Record<string, string>
): string {
  const classes: string[] = []
  for (const key in variants) {
    const value = props[key] ?? defaults[key]
    if (value !== undefined && variants[key][String(value)]) {
      classes.push(variants[key][String(value)])
    }
  }
  return classes.join(" ")
}

function resolveCompound(
  compounds: ReadonlyArray<{ readonly class: string; readonly [key: string]: unknown }>,
  props: Record<string, unknown>
): string {
  const classes: string[] = []
  for (const compound of compounds) {
    const { class: compoundClass, ...conditions } = compound as {
      class: string
      [key: string]: unknown
    }
    const matches = Object.entries(conditions).every(([key, value]) => props[key] === value)
    if (matches) {
      classes.push(compoundClass)
    }
  }
  return classes.join(" ")
}

/** Carry over subcomponent keys from source to target (exclude internal methods) */
function carryOverSubComponents<P extends object>(
  target: TwStyledComponent<P>,
  source: TwStyledComponent<P>
): void {
  const INTERNAL_KEYS = new Set(["extend", "withVariants", "animate", "withSub", "displayName"])
  for (const key of Object.keys(source)) {
    if (!INTERNAL_KEYS.has(key)) {
      ;(target as unknown as Record<string, unknown>)[key] = (source as unknown as Record<string, unknown>)[key]
    }
  }
}

function attachExtend<P extends object>(
  component: TwStyledComponent<P>,
  originalTag: React.ElementType,
  base: string,
  config: string | ComponentConfig
): TwStyledComponent<P> {
  /**
   * Extend component dengan extra classes (template literal).
   *
   * @example
   * const PrimaryBtn = Button.extend`bg-blue-500 text-white`
   */
  function extendWithClasses(strings: TemplateStringsArray): TwStyledComponent<P>
  /**
   * Extend component dengan extra classes + variant overrides (object).
   * Ini menyelesaikan gap desain yang disebutkan di CRITIQUE-20 #2.
   *
   * @example
   * // Extend classes DAN tambah variant sekaligus
   * const BigDangerBtn = Button.extend({
   *   classes: "text-lg px-8",
   *   variants: { loading: { true: "opacity-50" } },
   *   defaultVariants: { loading: "false" }
   * })
   */
  function extendWithClasses(extendConfig: {
    classes?: string
    variants?: ComponentConfig["variants"]
    defaultVariants?: ComponentConfig["defaultVariants"]
    compoundVariants?: ComponentConfig["compoundVariants"]
  }): TwStyledComponent<P>
  function extendWithClasses(
    stringsOrConfig: TemplateStringsArray | {
      classes?: string
      variants?: ComponentConfig["variants"]
      defaultVariants?: ComponentConfig["defaultVariants"]
      compoundVariants?: ComponentConfig["compoundVariants"]
    }
  ): TwStyledComponent<P> {
    // Template literal path
    if (Array.isArray(stringsOrConfig) && "raw" in stringsOrConfig) {
      const extra = (stringsOrConfig as TemplateStringsArray).raw.join("").trim().replace(/\s+/g, " ")
      const merged = twMerge(extractBaseClasses(base), extra)
      const extended = createComponent<P>(
        originalTag,
        typeof config === "string" ? merged : { ...config, base: merged }
      )
      carryOverSubComponents(extended, component)
      return extended
    }

    // Object config path — support extend + withVariants in one call
    const extCfg = stringsOrConfig as {
      classes?: string
      variants?: ComponentConfig["variants"]
      defaultVariants?: ComponentConfig["defaultVariants"]
      compoundVariants?: ComponentConfig["compoundVariants"]
    }
    const extraClasses = extCfg.classes ?? ""
    const merged = twMerge(extractBaseClasses(base), extraClasses)
    const existing = typeof config === "object" ? config : {}
    const extended = createComponent<P>(originalTag, {
      ...existing,
      base: merged,
      variants: { ...(existing.variants ?? {}), ...(extCfg.variants ?? {}) },
      compoundVariants: [
        ...(existing.compoundVariants ?? []),
        ...(extCfg.compoundVariants ?? []),
      ],
      defaultVariants: {
        ...(existing.defaultVariants ?? {}),
        ...(extCfg.defaultVariants ?? {}),
      },
    })
    carryOverSubComponents(extended, component)
    return extended
  }

  component.extend = extendWithClasses as TwStyledComponent<P>["extend"]

  component.withVariants = (newConfig: Partial<ComponentConfig>) => {
    const existing = typeof config === "object" ? config : {}
    return createComponent<P>(originalTag, {
      ...existing,
      base,
      variants: { ...(existing.variants ?? {}), ...(newConfig.variants ?? {}) },
      compoundVariants: [
        ...(existing.compoundVariants ?? []),
        ...(newConfig.compoundVariants ?? []),
      ],
      defaultVariants: {
        ...(existing.defaultVariants ?? {}),
        ...(newConfig.defaultVariants ?? {}),
      },
    })
  }

  // .animate() dipindah ke tailwind-styled-v4/animate agar tidak bundle @tailwind-styled/animate
  // ke dalam main browser bundle (animate butuh Rust native binding → Node.js only)
  component.animate = async (_opts: AnimateOptions) => {
    console.warn(
      "[tailwind-styled-v4] .animate() tidak tersedia di main bundle.\n" +
      "Gunakan: import { animate } from \"tailwind-styled-v4/animate\""
    )
    return component
  }

  // .withSub<"icon" | "badge">() — declare sub-component names untuk TypeScript
  // Runtime: no-op, hanya untuk type inference
  component.withSub = (() => component) as TwStyledComponent<P>["withSub"]

  return component
}

export function createComponent<P extends object = Record<string, unknown>>(
  tag: React.ElementType,
  config: string | ComponentConfig
): TwStyledComponent<P> {
  const isStatic = typeof config === "string"
  const base = typeof config === "string" ? config : (config.base ?? "")
  const variants = typeof config === "string" ? {} : (config.variants ?? {})
  const compoundVariants = typeof config === "string" ? [] : (config.compoundVariants ?? [])
  const defaultVariants = typeof config === "string" ? {} : (config.defaultVariants ?? {})
  const stateConfig = typeof config === "string" ? undefined : config.state
  const containerConfig = typeof config === "string" ? undefined : config.container
  const containerName = typeof config === "string" ? undefined : config.containerName

  const stateResult = stateConfig
    ? processState(typeof tag === "string" ? tag : "component", stateConfig)
    : null
  const containerResult = containerConfig
    ? processContainer(typeof tag === "string" ? tag : "component", containerConfig, containerName)
    : null

  const engineClasses = [stateResult?.stateClass, containerResult?.containerClass]
    .filter(Boolean)
    .join(" ")

  const filterProps = makeFilterProps(new Set(Object.keys(variants)))
  const tagLabel =
    typeof tag === "string" ? tag : ((tag as { displayName?: string }).displayName ?? "Component")

  if (isStatic || Object.keys(variants).length === 0) {
    const baseComponent = React.forwardRef<unknown, RuntimeProps>((props, ref) => {
      const { className, ...rest } = props
      const runtimeClassName = normalizeClassName(className)
      return React.createElement(tag, {
        ref,
        ...filterProps(rest),
        className: twMerge(extractBaseClasses(base), engineClasses, runtimeClassName),
      })
    })

    const component = baseComponent as unknown as TwStyledComponent<P>
    component.displayName = `tw.${tagLabel}`
    const result = attachExtend<P>(component, tag, base, config)
    registerSubComponents(result, base)
    return result
  }

  const baseComponent = React.forwardRef<unknown, RuntimeProps>((props, ref) => {
    const { className, ...rest } = props
    const runtimeClassName = normalizeClassName(className)
    const variantClasses = resolveVariants(variants, props, defaultVariants)
    const compoundClasses = resolveCompound(compoundVariants, props)

    return React.createElement(tag, {
      ref,
      ...filterProps(rest),
      className: twMerge(extractBaseClasses(base), variantClasses, compoundClasses, engineClasses, runtimeClassName),
    })
  })

  const component = baseComponent as unknown as TwStyledComponent<P>
  component.displayName = `tw.${tagLabel}`
  const result = attachExtend<P>(component, tag, base, config)
  registerSubComponents(result, base)
  return result
}