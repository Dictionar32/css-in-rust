/**
 * tailwind-styled-v4 — Core Types
 *
 * CRITIQUE-20 #1 fix: CvFn dan TwComponentFactory sekarang punya proper generic types
 * bukan `any`. Type safety sudah berlaku di public API.
 */

// ── Shared types (re-exported for backward compatibility) ─────────────────────
import type React from "react"
import type { HtmlTagName, VariantMatrix } from "@tailwind-styled/shared"
export type { HtmlTagName, VariantMatrix } from "@tailwind-styled/shared"

// AnimateOptions import removed — not used in this file
// Can re-export from @tailwind-styled/animate when needed

// ── Variant Types ────────────────────────────────────────────────────────────
export type VariantLiterals = string | number | boolean

/** Sizes sugar syntax — shorthand untuk variants.size */
export type SizesConfig = Record<string, string>

/**
 * Shared literal-narrowing logic dipakai baik oleh `InferVariantProps` (top-level
 * component variants) maupun `InferSubVariantsFromConfig` (sub-component variants) —
 * supaya kedua tempat itu tidak duplikasi & selalu konsisten.
 */
type InferVariantPropsFromVariantsMap<V> = {
  [K in keyof V as string extends K ? never : number extends K ? never : K]?: V[K] extends Record<infer Key, unknown>
  ? Key extends "true" | "false"
  ? boolean
  : Key extends number
  ? Key
  : Key extends `${infer N extends number}`
  ? N
  : Key
  : never
}

export type InferVariantProps<T extends ComponentConfig> = InferVariantPropsFromVariantsMap<T["variants"]>

/**
 * Infer allowed types for defaultVariants based on variant keys.
 * Supports:
 * - String keys: { variant: "primary" }
 * - Number keys: { priority: 0 }
 * - Boolean keys: { disabled: false } (translates true/false to "true"/"false" keys)
 * 
 * This helper ensures type safety when defaultVariants contains non-string values.
 */
export type InferDefaultVariantsType<T extends ComponentConfig> =
  InferVariantPropsFromVariantsMap<T["variants"]>

export type InferSizeProps<T extends ComponentConfig> =
  T["sizes"] extends Record<string, string>
  ? { size?: keyof T["sizes"] }
  : Record<never, never>

/**
 * Infer boolean props dari states config.
 * Setiap key di states → optional boolean prop di component.
 *
 * @example
 * // states: { loading: "...", fullWidth: "..." }
 * // → { loading?: boolean, fullWidth?: boolean }
 */
export type InferStatesProps<T extends ComponentConfig> = {
  [K in keyof T["states"]as string extends K ? never : number extends K ? never : K]?: boolean
}

// ── Sub-component Config ──────────────────────────────────────────────────────
/**
 * Sub-component config bisa berupa:
 * - string: "font-bold text-lg" → render <span> dengan classes
 * - Record<componentName, string>: nested HTML tag dengan component names dan classes
 * - Record<componentName, SubComponentConfig>: nested HTML tag dengan component names dan full variant config
 *
 * @example
 * sub: {
 *   icon: "w-4 h-4",                        // → <span class="w-4 h-4"> dipanggil Card.icon
 *   header: { topBar: "bg-gray-900" },       // → <header> dipanggil Card.topBar
 *   h2: { title: "text-xl font-bold" },      // → <h2> dipanggil Card.title
 *   section: { content: "px-6 py-4" },       // → <section> dipanggil Card.content
 *   canvas: { base: "p-6", variants: { layout: { wrap: "gap-4", column: "gap-0" } } }  // → <div> dengan variants
 * }
 */
export interface SubComponentConfig {
  base?: string
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string | number | boolean>
  compoundVariants?: Array<{ class: string;[key: string]: string }>
}

export type SubValue = string | SubComponentConfig | Record<string, string | SubComponentConfig>

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
  /** Variants — nested: { intent: { primary: "..." }, size: { sm: "..." } } 
   * Supports string and boolean keys: { disabled: { true: "...", false: "..." } }
   */
  variants?: Record<string, Record<string | "true" | "false" | number, string>>
  /** defaultVariants accepts string | number | boolean to match all possible variant key types */
  defaultVariants?: Record<string, string | number | boolean>
  compoundVariants?: Array<{ class: string;[key: string]: string }>
  state?: Record<string, Record<string, string>>
  container?: Record<string, string>
  containerName?: string
  /** Sugar syntax untuk variants.size — { sm: "...", md: "...", lg: "..." } */
  sizes?: SizesConfig
  /** defaultSize — default ke key pertama kalau tidak diset */
  defaultSize?: string
  /**
   * Boolean props — di-resolve via Rust bitmask lookup table di build time.
   * Maksimal 16 states per komponen (2^16 kombinasi).
   */
  states?: StatesConfig
  /** Sub-component definitions — string atau nested { tag: { name: classes } } */
  sub?: Record<string, SubValue>
  /**
   * Pre-computed hash — di-inject oleh turbopackLoader via `inject_state_hash()` (Rust).
   * Kalau ada, `stateEngine.ts` skip runtime `hashState()` computation sepenuhnya.
   * Format: 6-char FNV-1a hex string, identik dengan output `hashState()`.
   * @internal — jangan set manual, ini di-inject otomatis saat build/dev.
   */
  __hash?: string
  /**
   * Wave 3: Semantic component type untuk auto-generated ARIA metadata.
   * Digunakan oleh build-time ARIA injection plugin untuk determine semantic role.
   * 
   * Common values: 'button', 'link', 'checkbox', 'radio', 'input', 'form', 'dialog',
   *                'navigation', 'heading', 'alert', 'tab', 'section', 'status', 'aside'
   * 
   * @example
   * '@semantic': 'button'  // → auto-inject role="button"
   * '@semantic': 'dialog'  // → auto-inject role="dialog", aria-modal="true"
   */
  '@semantic'?: string
  /**
   * Wave 3: Explicit ARIA attributes untuk semantic component.
   * Merged dengan auto-injected ARIA dari semantic type.
   * User-provided ARIA memiliki precedence lebih tinggi (tidak di-override).
   * 
   * @example
   * '@aria': { role: 'tab', 'aria-selected': 'true' }
   */
  '@aria'?: Record<string, string>
  /**
   * Wave 3: State → ARIA property mapping untuk semantic metadata.
   * Determines mana variant/state yang map ke ARIA properties.
   * 
   * @example
   * '@state': { expanded: 'aria-expanded', disabled: 'aria-disabled' }
   * → When expanded prop true → aria-expanded="true" auto-injected
   */
  '@state'?: Record<string, string>
}

/**
 * Strip tag prefix dari "tag:name" format sub key.
 * "div:action" → "action"
 * "header"     → "header" (tidak berubah)
 */
type ExtractSubName<K extends string> =
  K extends `${string}:${infer Name}` ? Name : K

/**
 * True kalau S[K] adalah SubComponentConfig LANGSUNG (satu sub-component dengan
 * `base`/`variants` sendiri, mis. `canvas: { base: "...", variants: {...} }`) —
 * bukan nested named-group (mis. `header: { topBar: "...", nav: "..." }`).
 *
 * HARUS identik dengan discriminant runtime di createComponent.ts:
 * `"base" in value || "variants" in value`. Kedua bentuk sama-sama tampak sebagai
 * `Record<string, ...>` secara struktural, jadi tidak bisa dibedakan cuma lewat
 * `extends Record<string, string>` — perlu cek keberadaan key `base`/`variants`
 * secara eksplisit seperti runtime-nya.
 */
type IsDirectSubConfig<V> = V extends string
  ? false
  : "variants" extends keyof V
  ? true
  : "base" extends keyof V
  ? true
  : false

/**
 * Infer semua sub-component names dari config.sub:
 * - string value plain     → key langsung: { icon: "..." } → "icon"
 * - string value tag:name  → strip tag: { "div:action": "..." } → "action"
 * - direct SubComponentConfig → key langsung (support "tag:name" juga): { canvas: {base, variants} } → "canvas"
 * - nested named-group     → nested keys: { h2: { title: "..." } } → "title"
 */
export type InferSubFromConfig<C extends ComponentConfig> =
  C extends { sub: infer S extends Record<string, SubValue> }
  ? {
    [K in keyof S]: S[K] extends string
    ? K extends string
    ? ExtractSubName<K>         // strip "tag:name" → "name"
    : never
    : IsDirectSubConfig<S[K]> extends true
    ? K extends string
    ? ExtractSubName<K>         // direct SubComponentConfig, name = key itself
    : never
    : S[K] extends Record<infer N extends string, string>
    ? N                         // nested named-group → nested keys
    : never
  }[keyof S]
  : never

/**
 * HTML tags yang otomatis dikenali sebagai tag dari bare sub-key (tanpa "tag:name" syntax).
 * HARUS identik dengan SEMANTIC_HTML_TAGS di createComponent.ts (parseSubKey) — kalau
 * drift, sub-component bisa di-tipe-kan dengan native attributes yang salah (tag yang
 * benar2 di-render di runtime beda dari yang dipakai untuk inference type-nya).
 */
export type SemanticSubTag =
  | "article" | "aside" | "details" | "figcaption" | "figure"
  | "footer" | "header" | "main" | "mark" | "nav" | "section" | "summary" | "time"
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "p" | "ul" | "ol" | "li" | "dl" | "dt" | "dd"
  | "table" | "thead" | "tbody" | "tfoot" | "tr" | "th" | "td"
  | "form" | "fieldset" | "legend" | "label"
  | "a" | "button" | "img" | "span" | "div"
  | "blockquote" | "pre" | "code" | "em" | "strong" | "small"

/**
 * Resolve tag HTML dari satu sub-key string — mirror logic `parseSubKey()` runtime
 * di createComponent.ts:
 * - "a:link"  → tag eksplisit sebelum colon ("a")
 * - "header"  → bare key, fallback ke key itu sendiri kalau termasuk SemanticSubTag
 * - "icon"    → bare key, bukan semantic tag → fallback "span" (default runtime)
 */
type ResolveSubTag<K extends string> =
  K extends `${infer Tag}:${string}`
  ? Tag extends HtmlTagName ? Tag : "span"
  : K extends SemanticSubTag
  ? K
  : "span"

/** Gabungkan union of object types jadi satu intersection — dipakai untuk merge per-key tag map. */
type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never

/**
 * Infer mapping { subComponentName: htmlTag } dari config.sub — dipakai supaya setiap
 * sub-component (Card.icon, Breadcrumb.link, dst) punya native HTML attributes yang
 * SESUAI tag yang benar2 di-render (href untuk <a>, src untuk <img>, dst), bukan cuma
 * `{ children?, className? }` generik.
 *
 * @example
 * sub: { "a:link": "...", "span:sep": "..." } → { link: "a"; sep: "span" }
 * sub: { header: { topBar: "..." } }          → { topBar: "header" }
 */
export type InferSubTagsFromConfig<C extends ComponentConfig> =
  C extends { sub: infer S extends Record<string, SubValue> }
  ? UnionToIntersection<
    {
      [K in keyof S]: K extends string
      ? S[K] extends string
      ? { [N in ExtractSubName<K>]: ResolveSubTag<K> }
      : IsDirectSubConfig<S[K]> extends true
      ? { [N in ExtractSubName<K>]: ResolveSubTag<K> }
      : S[K] extends Record<string, string>
      ? { [N in keyof S[K]]: K extends HtmlTagName ? K : "span" }
      : never
      : never
    }[keyof S]
  >
  : Record<string, never>

/**
 * Infer mapping { subComponentName: variantProps } dari config.sub — dipakai supaya
 * sub-component yang punya `variants` sendiri (mis. `canvas: { base, variants: { layout: {...} } }`)
 * ikut ke-expose propnya (`layout`) di accessor-nya (`PlaygroundWrap.canvas`), bukan cuma
 * native HTML attributes dari tag-nya.
 *
 * @example
 * sub: { canvas: { variants: { layout: { wrap: "...", column: "..." } } } }
 * → { canvas: { layout?: "wrap" | "column" } }
 */
export type InferSubVariantsFromConfig<C extends ComponentConfig> =
  C extends { sub: infer S extends Record<string, SubValue> }
  ? UnionToIntersection<
    {
      [K in keyof S]: K extends string
      ? IsDirectSubConfig<S[K]> extends true
      ? S[K] extends { variants?: infer V }
      ? { [N in ExtractSubName<K>]: InferVariantPropsFromVariantsMap<V> }
      : Record<never, never>
      : Record<never, never>
      : Record<never, never>
    }[keyof S]
  >
  : Record<never, never>

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
    [K in keyof C["variants"]as string extends K ? never : number extends K ? never : K]?: keyof C["variants"][K]
  } & { class?: string; className?: string }
) => string

// ── Styled Component Props ───────────────────────────────────────────────────
export interface StyledComponentProps {
  className?: string
  as?: HtmlTagName
  children?: React.ReactNode
}

// ── Sub Component Map ────────────────────────────────────────────────────────
export type SubComponentMap = Record<string, unknown>

// ── Tw Object ────────────────────────────────────────────────────────────────
// ── Tw Styled Component ──────────────────────────────────────────────────────
// Sub-component accessor — typed sesuai HTML tag asli yang di-render (href untuk <a>,
// src untuk <img>, dst), bukan cuma children/className generik. `ExtraProps` membawa
// variant props milik sub-component itu sendiri kalau dia dideklarasikan sebagai
// direct SubComponentConfig (mis. `canvas: { base, variants: { layout: {...} } }`
// → ExtraProps = { layout?: "wrap" | "column" | ... }).
export type TwSubComponentAccessor<
  Tag extends HtmlTagName = "span",
  ExtraProps extends Record<string, unknown> = Record<never, never>
> =
  React.FC<Omit<React.ComponentPropsWithoutRef<Tag>, "ref" | keyof ExtraProps> & ExtraProps & {
    children?: React.ReactNode
    className?: string
  }>

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
// Kalau S sudah spesifik ("icon" | "badge"), strict — hanya key terdaftar valid, dan
// setiap key di-tipe-kan sesuai tag asli-nya lewat TagMap (default "span" kalau tidak diketahui).
type SubComponentKeys<
  S extends string,
  TagMap extends Record<string, string> = Record<string, never>,
  SubVariantsMap extends Record<string, Record<string, unknown>> = Record<string, never>
> = {
    [K in S]: TwSubComponentAccessor<
      K extends keyof TagMap
      ? (TagMap[K] extends HtmlTagName ? TagMap[K] : "span")
      : "span",
      K extends keyof SubVariantsMap ? SubVariantsMap[K] : Record<never, never>
    >
  }

// TwStyledComponent dengan generic Sub untuk nama sub-component
// S = union of sub-component names — di-infer otomatis dari [name] patterns
// di template literal via ExtractSubNames, atau di-declare manual via .withSub<>()
// SubVariantsMap = { subName: variantProps } — dipakai kalau sub-component itu sendiri
// punya `variants` (mis. `canvas: { base, variants: { layout: {...} } }`).
export type TwStyledComponent<
  Config extends ComponentConfig = ComponentConfig,
  S extends string = string,
  TagMap extends Record<string, string> = Record<string, never>,
  Tag extends HtmlTagName = HtmlTagName,
  SubVariantsMap extends Record<string, Record<string, unknown>> = Record<string, never>
> = {
  (props: Omit<React.ComponentPropsWithoutRef<Tag>, keyof InferVariantProps<Config> | keyof InferSizeProps<Config> | keyof InferStatesProps<Config>> & StyledComponentProps & InferVariantProps<Config> & InferSizeProps<Config> & InferStatesProps<Config>): React.ReactElement | null
  displayName?: string
  extend: {
    (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<Config, S, TagMap, Tag, SubVariantsMap>
    <EC extends {
      classes?: string
      variants?: ComponentConfig["variants"]
      defaultVariants?: ComponentConfig["defaultVariants"]
      compoundVariants?: ComponentConfig["compoundVariants"]
    }>(config: EC & { defaultVariants?: InferDefaultVariantsType<{ variants: EC["variants"] }> }): TwStyledComponent<Config, S, TagMap, Tag, SubVariantsMap>
  }
  withVariants: (config: Partial<Omit<Config, "defaultVariants">> & { defaultVariants?: InferDefaultVariantsType<Config> }) => TwStyledComponent<Config, S, TagMap, Tag, SubVariantsMap>
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
  withSub<NewS extends string>(): TwStyledComponent<Config, NewS, TagMap, Tag, SubVariantsMap>
} & SubComponentKeys<S, TagMap, SubVariantsMap>

// ── Tw Sub Component ─────────────────────────────────────────────────────────
export interface TwSubComponent<P = unknown> {
  (props: P): React.ReactElement | null
  displayName?: string
}

export interface TwTemplateFactory<
  Config extends ComponentConfig = ComponentConfig,
  Tag extends HtmlTagName = HtmlTagName
> {
  // Config object syntax — TypeScript infer sub names dari object literal key secara sempurna
  // MUST come first so object literals are matched before template literals
  <C extends ComponentConfig>(config: C & { defaultVariants?: InferDefaultVariantsType<C> }): TwStyledComponent<
    C,
    InferSubFromConfig<C>,
    InferSubTagsFromConfig<C> extends Record<string, string> ? InferSubTagsFromConfig<C> : Record<string, never>,
    Tag,
    InferSubVariantsFromConfig<C> extends Record<string, Record<string, unknown>> ? InferSubVariantsFromConfig<C> : Record<string, never>
  >
  // Template literal — TypeScript infer sub-component names dari [name] { ... }
  // Catatan: infer hanya works pada template TANPA expression (no ${}).
  // Untuk template kompleks gunakan config object syntax: tw.button({ base: "...", sub: { icon: "..." } })
  <const T extends string>(strings: readonly [T], ...exprs: []): TwStyledComponent<Config, ExtractSubNames<T>, Record<string, never>, Tag>
  (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<Config, string, Record<string, never>, Tag>
}

// ── Tw Tag Factory ───────────────────────────────────────────────────────────
export type TwTagFactory = {
  [K in HtmlTagName]: TwTemplateFactory<ComponentConfig, K>
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
  [K in HtmlTagName as `${K}`]: TwTemplateFactory<ComponentConfig, K>
}

export type TwObject = TwComponentFactory & TwTagFactory & {
  server: TwServerObject
}

// ── Storybook utilities ──────────────────────────────────────────────────────
/**
 * Enumerate all combinations of variant props from a variant matrix.
 * Uses VariantProps and VariantValue types for type-safe prop inference.
 * 
 * @example
 * const matrix = { intent: ["primary", "secondary"], size: ["sm", "lg"] }
 * const combinations = enumerateVariantProps(matrix)
 * // → [{ intent: "primary", size: "sm" }, { intent: "primary", size: "lg" }, ...]
 */
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
      // matrix values should always be non-undefined (filtered by VariantMatrix type)
      if (value !== undefined) {
        current[key] = value as string | number | boolean
        walk(index + 1, current)
      }
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

export function generateDefaultArgs(config: ComponentConfig): Record<string, string | number | boolean> {
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