/**
 * tailwind-styled-v4 — Core Types
 *
 * CRITIQUE-20 #1 fix: CvFn dan TwComponentFactory sekarang punya proper generic types
 * bukan `any`. Type safety sudah berlaku di public API.
 */

// ── Shared types (re-exported for backward compatibility) ─────────────────────
import type React from "react"
import type { AnimateOptions } from "@tailwind-styled/animate"
import type { HtmlTagName, VariantMatrix, VariantProps, VariantValue } from "@tailwind-styled/shared"
export type { HtmlTagName, VariantProps, VariantValue, VariantMatrix } from "@tailwind-styled/shared"

// ── Variant Types ────────────────────────────────────────────────────────────
export type VariantLiterals = string | number | boolean

export type InferVariantProps<T extends ComponentConfig> = {
  [K in keyof T["variants"]]?: keyof T["variants"][K]
}

/**
 * Infer boolean props dari states config.
 * Setiap key di states → optional boolean prop di component.
 *
 * @example
 * // states: { loading: "...", fullWidth: "..." }
 * // → { loading?: boolean, fullWidth?: boolean }
 */
export type InferStatesProps<T extends ComponentConfig> = {
  [K in keyof T["states"]]?: boolean
}

// ── Sub-component Config ──────────────────────────────────────────────────────
/**
 * Config object untuk sub-component dengan tag override dan asChild support.
 *
 * @example
 * sub: {
 *   header: { classes: "font-bold text-lg border-b", tag: "header" },
 *   body:   { classes: "text-gray-600 py-2",          tag: "section" },
 *   action: { classes: "mt-4", asChild: true },
 * }
 */
export interface SubComponentConfig {
  /** Tailwind classes untuk sub-component ini — konsisten dengan ComponentConfig.base */
  base: string
  /** HTML tag yang dirender — default: "span" */
  tag?: keyof React.JSX.IntrinsicElements
  /** asChild: merge className + event handlers ke direct child element */
  asChild?: boolean
}

// ── States Config ─────────────────────────────────────────────────────────────
/**
 * Boolean props yang di-resolve via bitmask lookup table (pre-generated di build time).
 * Berbeda dari `state` (CSS data-attribute driven) — ini adalah React props boolean.
 *
 * @example
 * states: {
 *   loading:   "opacity-60 cursor-wait pointer-events-none",
 *   fullWidth: "w-full",
 *   disabled:  "opacity-50 cursor-not-allowed",
 * }
 *
 * // JSX — boolean prop langsung:
 * <Button loading fullWidth>Submit</Button>
 */
export type StatesConfig = Record<string, string>

// ── Component Config ─────────────────────────────────────────────────────────
export interface ComponentConfig {
  base?: string
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
  compoundVariants?: Array<{ class: string; [key: string]: string }>
  state?: Record<string, Record<string, string>>
  container?: Record<string, string>
  containerName?: string
  /**
   * Boolean props — di-resolve via Rust bitmask lookup table di build time.
   * Maksimal 16 states per komponen (2^16 kombinasi).
   */
  states?: StatesConfig
  /** Sub-component definitions — keys di-infer otomatis oleh TypeScript */
  sub?: Record<string, string | SubComponentConfig>
}

// Infer sub-component names dari config object { sub: { icon: "...", footer: "..." } }
// Handle both string value dan SubComponentConfig object value.
type InferSubFromConfig<C extends ComponentConfig> =
  C extends { sub: Record<infer K extends string, string | SubComponentConfig> } ? K : never

// ── Container Config ─────────────────────────────────────────────────────────
export interface ContainerConfig {
  base?: string
  queries?: Record<string, string>
  defaultQuery?: string
}

// ── State Config ─────────────────────────────────────────────────────────────
export interface StateConfig {
  base?: string
  states?: Record<string, Record<string, string>>
  defaultStates?: Record<string, boolean>
}

// ── CV (Class Variant) Function ──────────────────────────────────────────────
// Proper generic type yang mengetahui variant keys dan values
export type CvFn<C extends ComponentConfig> = (
  props?: {
    [K in keyof C["variants"]]?: keyof C["variants"][K]
  } & { class?: string; className?: string }
) => string

// ── Styled Component Props ───────────────────────────────────────────────────
export interface StyledComponentProps {
  className?: string
  as?: HtmlTagName
  children?: React.ReactNode
  [key: string]: unknown
}

// ── Sub Component Map ────────────────────────────────────────────────────────
export type SubComponentMap = Record<string, unknown>

// ── Tw Object ────────────────────────────────────────────────────────────────
// ── Tw Styled Component ──────────────────────────────────────────────────────
// Sub-component accessor — typed untuk registered sub-components
export type TwSubComponentAccessor = React.FC<{ children?: React.ReactNode; className?: string }>

// Sub-component props yang bisa di-extend user
// ── Template Literal Sub-Component Inference ─────────────────────────────────
// Extract sub-component names dari template literal: [icon] { ... }
type TrimLeft<S extends string> =
  S extends ` ${infer R}` | `
${infer R}` | `	${infer R}` | `
${infer R}`
    ? TrimLeft<R>
    : S

type TrimRight<S extends string> =
  S extends `${infer L} ` | `${infer L}
` | `${infer L}	` | `${infer L}
`
    ? TrimRight<L>
    : S

type Trim<S extends string> = TrimLeft<TrimRight<S>>

// Recursively extract sub-component names dari template string.
// Mendukung dua syntax:
//   - Bracket:    `[name] { ... }`
//   - No-bracket: `name { ... }`
type ExtractSubNames<T extends string> =
  T extends `${string}[${infer Name}]${string}{${string}}${infer Rest}`
    ? Trim<Name> | ExtractSubNames<Rest>
    : T extends `${string}\n${infer Name}{${string}}${infer Rest}`
    ? (Trim<Name> extends "" ? never : Trim<Name>) | ExtractSubNames<Rest>
    : never

// ── DetectedSubComponents — di-generate oleh `npx tw generate-types`
// Fallback ke string kalau belum di-generate
export type DetectedSubComponents = string

export interface TwSubComponentProps {
  children?: React.ReactNode
  className?: string
}

// Helper: kalau S = string (belum di-narrow karena TypeScript tidak bisa
// infer nama dari multiline template literal), fallback ke loose index signature.
// Kalau S sudah spesifik ("icon" | "badge"), strict — hanya key terdaftar valid.
// Gunakan .withSub<"icon" | "footer">() untuk opt-in ke strict mode manual.
type SubComponentKeys<S extends string> =
  string extends S
    ? { [key: string]: TwSubComponentAccessor }  // loose — TypeScript gagal infer
    : { [K in S]: TwSubComponentAccessor }        // strict — hanya nama terdaftar

// TwStyledComponent dengan generic Sub untuk nama sub-component
// S = union of sub-component names — di-infer otomatis dari [name] patterns
// di template literal via ExtractSubNames, atau di-declare manual via .withSub<>()
export type TwStyledComponent<
  Config extends ComponentConfig = ComponentConfig,
  S extends string = string
> = {
  (props: StyledComponentProps & InferVariantProps<Config> & InferStatesProps<Config>): React.ReactElement | null
  displayName?: string
  extend: {
    (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<Config, S>
    (config: {
      classes?: string
      variants?: ComponentConfig["variants"]
      defaultVariants?: ComponentConfig["defaultVariants"]
      compoundVariants?: ComponentConfig["compoundVariants"]
    }): TwStyledComponent<Config, S>
  }
  withVariants: (config: Partial<Config>) => TwStyledComponent<Config, S>
  /**
   * Declare sub-component names secara eksplisit untuk autocomplete + type safety.
   *
   * @example
   * export const Button = tw.button`
   *   flex h-12 ...
   *   icon { flex h-4 }
   * `.withSub<"icon" | "footer">()
   *
   * Button.icon   // ✅ autocomplete
   * Button.footer // ✅ autocomplete
   * Button.xyz    // ❌ TypeScript error
   */
  withSub<NewS extends string>(): TwStyledComponent<Config, NewS>
  animate: (opts: AnimateOptions) => Promise<TwStyledComponent<Config, S>>
} & SubComponentKeys<S>

// ── Tw Sub Component ─────────────────────────────────────────────────────────
export interface TwSubComponent<P = unknown> {
  (props: P): React.ReactElement | null
  displayName?: string
}

export interface TwTemplateFactory<Config extends ComponentConfig = ComponentConfig> {
  // Template literal — TypeScript infer sub-component names dari [name] { ... }
  // Catatan: infer hanya works pada template TANPA expression (no ${}).
  // Untuk template kompleks gunakan config object syntax: tw.button({ base: "...", sub: { icon: "..." } })
  <const T extends string>(strings: readonly [T], ...exprs: []): TwStyledComponent<Config, ExtractSubNames<T>>
  (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<Config, string>
  // Config object syntax — TypeScript infer sub names dari object literal key secara sempurna
  <C extends ComponentConfig>(config: C): TwStyledComponent<C, InferSubFromConfig<C>>
}

// ── Tw Tag Factory ───────────────────────────────────────────────────────────
export type TwTagFactory = {
  [K in HtmlTagName]: TwTemplateFactory
}

// ── Tw Tag Factory Any ───────────────────────────────────────────────────────
export type TwTagFactoryAny = {
  [key: string]: TwTemplateFactory
}

// ── Tw Component Factory ────────────────────────────────────────────────────
export type TwComponentFactory<T extends React.ElementType = React.ElementType> = (
  tag: T
) => TwTemplateFactory

// ── Tw Server Object ────────────────────────────────────────────────────────
// Intersection dengan TwTagFactory — server variant yang hanya support static classes
export type TwServerObject = TwTagFactory & {
  [K in HtmlTagName as `${K}`]: TwTemplateFactory
}

export type TwObject = TwComponentFactory & TwTagFactory & {
  server: TwServerObject
}

// ── Storybook utilities ──────────────────────────────────────────────────────
export function enumerateVariantProps(
  matrix: VariantMatrix
): Array<Record<string, string | number | boolean>> {
  const keys = Object.keys(matrix)
  if (keys.length === 0) return [{}]

  const result: Array<Record<string, string | number | boolean>> = []

  function walk(index: number, current: Record<string, string | number | boolean>) {
    if (index >= keys.length) {
      result.push({ ...current })
      return
    }
    const key = keys[index]!
    for (const value of matrix[key] ?? []) {
      current[key] = value
      walk(index + 1, current)
    }
  }

  walk(0, {})
  return result
}

export function generateArgTypes(config: ComponentConfig): Record<string, unknown> {
  if (!config.variants) return {}

  const argTypes: Record<string, unknown> = {}

  for (const [variantKey, variantValues] of Object.entries(config.variants)) {
    const options = Object.keys(variantValues)
    const defaultValue = config.defaultVariants?.[variantKey]

    argTypes[variantKey] = {
      control: { type: "select" },
      options,
      defaultValue,
      description: `Variant: **${variantKey}**`,
      table: {
        type: { summary: options.join(" | ") },
        defaultValue: defaultValue ? { summary: defaultValue } : undefined,
        category: "Variants",
      },
    }
  }

  return argTypes
}

export function generateDefaultArgs(config: ComponentConfig): Record<string, string> {
  return { ...(config.defaultVariants ?? undefined) }
}

export function withTailwindStyled(
  StoryFn: () => unknown,
  context: {
    args?: Record<string, unknown>
    parameters?: { tailwindStyled?: { wrapperClass?: string; padding?: string } }
  }
): unknown {
  const wrapperClass = context.parameters?.tailwindStyled?.wrapperClass ?? ""
  const padding = context.parameters?.tailwindStyled?.padding ?? "p-8"

  if (typeof document !== "undefined") {
    const wrapper = document.createElement("div")
    wrapper.className = [padding, wrapperClass].filter(Boolean).join(" ")
    return wrapper
  }

  return StoryFn()
}

export function createVariantStoryArgs(config: ComponentConfig): {
  combinations: Array<Record<string, string | number | boolean>>
  matrix: VariantMatrix
} {
  if (!config.variants) return { combinations: [{}], matrix: {} }

  const matrix: VariantMatrix = {}
  for (const [key, values] of Object.entries(config.variants)) {
    matrix[key] = Object.keys(values)
  }

  return {
    combinations: enumerateVariantProps(matrix),
    matrix,
  }
}

export function getVariantClass(config: ComponentConfig, props: Record<string, string>): string {
  const classes: string[] = []

  if (config.base) classes.push(config.base)

  if (config.variants) {
    for (const [key, values] of Object.entries(config.variants)) {
      const val = props[key] ?? config.defaultVariants?.[key]
      if (val && values[val]) classes.push(values[val])
    }
  }

  if (config.compoundVariants) {
    for (const compound of config.compoundVariants) {
      const { class: cls, ...conditions } = compound
      if (Object.entries(conditions).every(([k, v]) => props[k] === v)) {
        classes.push(cls)
      }
    }
  }

  return classes.join(" ")
}