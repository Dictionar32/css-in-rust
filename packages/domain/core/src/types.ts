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

// ── Component Config ─────────────────────────────────────────────────────────
export interface ComponentConfig {
  base?: string
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
  compoundVariants?: Array<{ class: string; [key: string]: string }>
  state?: Record<string, Record<string, string>>
  container?: Record<string, string>
  containerName?: string
}

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

// Recursively extract [name] patterns dari template string
type ExtractSubNames<T extends string> =
  T extends `${infer _}[${infer Name}]${infer Rest}`
    ? (Trim<Name> extends string ? Trim<Name> : never) | ExtractSubNames<Rest>
    : never

// ── DetectedSubComponents — di-generate oleh `npx tw generate-types`
// Fallback ke string kalau belum di-generate
export type DetectedSubComponents = string

export interface TwSubComponentProps {
  children?: React.ReactNode
  className?: string
}

// TwStyledComponent dengan generic Sub untuk nama sub-component
// S = union of sub-component names yang user deklarasi, default string
export interface TwStyledComponent<
  Config extends ComponentConfig = ComponentConfig,
  S extends string = string
> {
  (props: StyledComponentProps & InferVariantProps<Config>): React.ReactElement | null
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
  withSub<NewS extends string>(): TwStyledComponent<Config, S | NewS>
  animate: (opts: AnimateOptions) => Promise<TwStyledComponent<Config, S>>
} & {
  // Sub-components — di-infer dari [name] patterns di template literal
  [K in S]: TwSubComponentAccessor
} & {
  [key: string]:
    | TwSubComponentAccessor
    | ((strings: TemplateStringsArray) => TwStyledComponent<Config, S>)
    | ((config: Partial<Config>) => TwStyledComponent<Config, S>)
    | ((props: StyledComponentProps) => unknown)
    | ((opts: AnimateOptions) => Promise<TwStyledComponent<Config, S>>)
    | string
}

// ── Tw Sub Component ─────────────────────────────────────────────────────────
export interface TwSubComponent<P = unknown> {
  (props: P): React.ReactElement | null
  displayName?: string
}

export interface TwTemplateFactory<Config extends ComponentConfig = ComponentConfig> {
  // Template literal — TypeScript infer sub-component names dari [name] { ... }
  <const T extends string>(strings: readonly [T, ...unknown[]], ...exprs: unknown[]): TwStyledComponent<Config, ExtractSubNames<T>>
  (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<Config, string>
  <C extends ComponentConfig>(config: C): TwStyledComponent<C, string>
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