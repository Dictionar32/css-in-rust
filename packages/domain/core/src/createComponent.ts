// AnimateOptions loaded dynamically to avoid bundling @tailwind-styled/animate
type AnimateOptions = { from: string; to: string; duration?: number; easing?: string; delay?: number; fill?: string; iterations?: number | "infinite"; direction?: string; name?: string }
import React from "react"

import { processContainer } from "./containerQuery"
import { twMerge } from "./merge"
import { getNativeBinding } from "./native"
import { processState } from "./stateEngine"
import type { ComponentConfig, InferSubFromConfig, SubValue, TwStyledComponent } from "./types"

const ALWAYS_BLOCKED = new Set(["base", "_ref", "state", "container", "containerName"])

// ── Sub-component auto-registration ──────────────────────────────────────────

/**
 * JS fallback: parse sub-component block syntax dari template string.
 * Matches `Name { class1 class2 }` atau `[name] { class1 class2 }`.
 */
function parseSubComponentBlocksJS(template: string): Map<string, string> {
  const map = new Map<string, string>()
  const regex = /((?:\[[a-zA-Z][a-zA-Z0-9_-]*\]|[a-zA-Z][a-zA-Z0-9_-]*))\s*\{([^}]*)\}/g
  let match
  while ((match = regex.exec(template)) !== null) {
    const rawName = match[1]
    const name = rawName.startsWith("[") ? rawName.slice(1, -1) : rawName
    const classes = match[2].trim().replace(/\s+/g, " ")
    if (classes) map.set(name, classes)
  }
  return map
}

/**
 * Extract sub-component blocks dari template → Map<name, classes>
 * Native-first: delegates ke Rust `parse_subcomponent_blocks_napi`.
 * JS fallback: regex-based parser untuk browser/client context.
 */
function parseSubComponentBlocks(template: string): Map<string, string> {
  try {
    const native = getNativeBinding()
    if (native?.parseSubcomponentBlocksNapi) {
      const result = native.parseSubcomponentBlocksNapi(template, "tw")
      const raw = JSON.parse(result.subMapJson) as Record<string, string>
      return new Map(Object.entries(raw))
    }
  } catch {
    // fall through to JS fallback
  }
  return parseSubComponentBlocksJS(template)
}

/**
 * Strip semua sub-component blocks dari template string.
 * Native-first: uses result dari parse_subcomponent_blocks_napi.base_classes.
 * JS fallback: regex strip.
 */
function extractBaseClasses(template: string): string {
  try {
    const native = getNativeBinding()
    if (native?.parseSubcomponentBlocksNapi) {
      const result = native.parseSubcomponentBlocksNapi(template, "tw")
      // Normalize whitespace — JS fallback dan Rust harus produce output identik
      // supaya SSR className === CSR className (no hydration mismatch)
      return result.baseClasses.trim().replace(/\s+/g, " ")
    }
  } catch {
    // fall through
  }

  return template
    .replace(/(?:\[[a-zA-Z][a-zA-Z0-9_-]*\]|[a-zA-Z][a-zA-Z0-9_-]*)\s*\{[^}]*\}/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Valid HTML semantic tags yang otomatis di-detect dari key name
const SEMANTIC_HTML_TAGS = new Set([
  "article", "aside", "details", "figcaption", "figure",
  "footer", "header", "main", "mark", "nav", "section", "summary", "time",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "form", "fieldset", "legend", "label",
  "a", "button", "img", "span", "div",
  "blockquote", "pre", "code", "em", "strong", "small",
])

/**
 * Parse sub-component key — support dua format:
 *
 * 1. "tag:name"  → tag HTML explicit, nama component = name
 *    contoh: "header:topBar" → tag=header, componentName=topBar
 *
 * 2. "name"      → cek apakah nama adalah valid HTML tag
 *    contoh: "header" → tag=header, componentName=header
 *    contoh: "icon"   → tag=span (fallback), componentName=icon
 */
function parseSubKey(key: string): { tag: string; componentName: string } {
  const colonIdx = key.indexOf(":")
  if (colonIdx !== -1) {
    const tag = key.slice(0, colonIdx).trim()
    const componentName = key.slice(colonIdx + 1).trim()
    return { tag: tag || "span", componentName: componentName || tag }
  }
  const isSemanticTag = SEMANTIC_HTML_TAGS.has(key)
  return { tag: isSemanticTag ? key : "span", componentName: key }
}

/**
 * Buat sub-component React FC dengan classes-nya sendiri.
 * Support tag override dan asChild pattern.
 *
 * @param tag - HTML tag yang dirender, default "span"
 * @param asChild - jika true, merge className ke direct child element
 */
function createSubComponentAccessor(
  parentDisplayName: string,
  name: string,
  classes: string,
  tag: string = "span",
  asChild: boolean = false
): React.FC<{ children?: React.ReactNode; className?: string }> {
  const SubComponent: React.FC<{ children?: React.ReactNode; className?: string }> = ({
    children,
    className,
  }) => {
    const mergedClass = className ? `${classes} ${className}` : classes

    // asChild: clone direct child element dan merge className ke dalamnya
    if (asChild && React.isValidElement(children)) {
      const child = React.Children.only(children) as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        className: child.props.className
          ? `${mergedClass} ${child.props.className}`
          : mergedClass,
      })
    }

    return React.createElement(tag, { className: mergedClass }, children)
  }
  SubComponent.displayName = `${parentDisplayName}[${name}]`
  return SubComponent
}

/** Register semua sub-components ke component object.
 * Sumber: (1) config.sub object — prioritas utama, TypeScript infer keys-nya.
 *         (2) parseSubComponentBlocks dari template string — fallback untuk template literal syntax.
 *
 * config.sub value bisa berupa:
 *   - string: "font-bold text-lg" → render sebagai <span>
 *   - SubComponentConfig: { classes: "...", tag: "header", asChild: false }
 */
function registerSubComponents<P extends object>(
  component: TwStyledComponent<P>,
  template: string,
  configSub?: Record<string, SubValue>
): void {
  const displayName = component.displayName ?? "tw"
  const map = component as unknown as Record<string, unknown>

  // Priority 1: config.sub object — explicit, fully typed
  if (configSub) {
    for (const [key, value] of Object.entries(configSub)) {
      if (typeof value === "string") {
        // String value — pakai parseSubKey untuk detect semantic tag dari key
        const { tag, componentName } = parseSubKey(key)
        map[componentName] = createSubComponentAccessor(
          displayName, componentName, value.trim().replace(/\s+/g, " "), tag
        )
      } else {
        // Nested object — key adalah HTML tag, nested keys adalah component names
        // contoh: h2: { title: "text-xl", subtitle: "text-lg" }
        // → Card.title renders <h2>, Card.subtitle renders <h2>
        const tag = key
        for (const [componentName, classes] of Object.entries(value)) {
          map[componentName] = createSubComponentAccessor(
            displayName, componentName, classes.trim().replace(/\s+/g, " "), tag
          )
        }
      }
    }
  }

  // Priority 2: template block parsing — untuk template literal syntax
  const blocks = parseSubComponentBlocks(template)
  for (const [name, classes] of blocks) {
    if (!(name in map)) {
      map[name] = createSubComponentAccessor(displayName, name, classes)
    }
  }
}

import type { InferVariantProps, InferStatesProps } from "./types"

// Props yang diterima component saat render — typed dari config user
type RuntimeProps<TConfig extends ComponentConfig> =
  InferVariantProps<TConfig> &
  InferStatesProps<TConfig> &
  { className?: string; children?: React.ReactNode } &
  Record<string, unknown>  // HTML attrs dan props lainnya tetap diterima

function normalizeClassName(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function makeFilterProps(variantKeys: Set<string>, stateKeys: Set<string> = new Set()) {
  return function filterProps(props: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {}
    for (const key in props) {
      if (variantKeys.has(key)) continue
      if (stateKeys.has(key)) continue   // states dari config user — tidak diteruskan ke DOM
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
  // Only include declared variant keys — prevents non-variant props (e.g. `selected`, `disabled`)
  // from leaking into the resolver and causing SSR/client hydration mismatches.
  // The Rust binding and JS fallback must receive identical, variant-scoped props.
  const variantKeys = Object.keys(variants)
  const cleanProps: Record<string, string> = {}
  for (const k of variantKeys) {
    const v = props[k]
    if (v !== undefined && v !== null) cleanProps[k] = String(v)
  }

  try {
    const binding = getNativeBinding()
    if (binding?.resolveSimpleVariants) {
      const result = binding.resolveSimpleVariants(null, variants, defaults, cleanProps)
      // Normalize whitespace — Rust dan JS fallback harus produce output identik
      // Variant strings dari backtick templates punya newlines yang harus di-collapse
      return result.trim().replace(/\s+/g, " ")
    }
  } catch {
    // Native binding unavailable (browser/client context) — fall through to JS fallback
  }

  // JS fallback for browser/client context
  const resolved = { ...defaults, ...cleanProps }
  const classes: string[] = []
  // Sort keys — Rust HashMap tidak punya insertion order, kita sort alphabetically
  // agar output JS fallback identik dengan Rust output
  const sortedVariantEntries = Object.entries(variants).sort(([a], [b]) => a.localeCompare(b))
  for (const [variantKey, variantMap] of sortedVariantEntries) {
    const selected = resolved[variantKey]
    if (selected !== undefined && variantMap[selected] !== undefined) {
      // Normalize whitespace — Rust strips leading/trailing spaces and collapses
      // newlines in template literals. JS fallback must produce identical output.
      const normalized = variantMap[selected].trim().replace(/\s+/g, " ")
      classes.push(normalized)
    }
  }
  return classes.filter(Boolean).join(" ")
}

/**
 * Resolve states bitmask dari props → lookup class string.
 * O(1) — hitung bitmask dari boolean props, lookup di pre-generated table.
 *
 * Fallback: kalau lookup tidak tersedia, cx() runtime.
 */
function resolveStates(
  statesConfig: Record<string, string>,
  stateKeys: string[],
  statesLookup: Record<number, string> | null,
  props: Record<string, unknown>
): string {
  // Fast path: pre-generated bitmask lookup (Rust) — O(1)
  // Rust binary v5.0.6-canary.0.0.51+ uses join (not twMerge) so ring-2 + ring-blue-500
  // are both preserved correctly.
  if (statesLookup && stateKeys.length > 0) {
    let mask = 0
    for (let i = 0; i < stateKeys.length; i++) {
      if (props[stateKeys[i]]) mask |= (1 << i)
    }
    return statesLookup[mask] ?? ""
  }

  // Fallback: runtime join — additive, no conflict resolution
  const activeClasses = stateKeys
    .filter(k => props[k])
    .map(k => statesConfig[k])
    .filter(Boolean)

  return activeClasses.join(" ")
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

function attachExtend<TConfig extends ComponentConfig>(
  component: TwStyledComponent<TConfig, string>,
  originalTag: React.ElementType,
  base: string,
  config: ComponentConfig
): TwStyledComponent<TConfig, string> {
  /**
   * Extend component dengan extra classes (template literal).
   *
   * @example
   * const PrimaryBtn = Button.extend`bg-blue-500 text-white`
   */
  function extendWithClasses(strings: TemplateStringsArray): TwStyledComponent<TConfig, string>
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
  }): TwStyledComponent<TConfig, string>
  function extendWithClasses(
    stringsOrConfig: TemplateStringsArray | {
      classes?: string
      variants?: ComponentConfig["variants"]
      defaultVariants?: ComponentConfig["defaultVariants"]
      compoundVariants?: ComponentConfig["compoundVariants"]
    }
  ): TwStyledComponent<TConfig, string> {
    // Template literal path
    if (Array.isArray(stringsOrConfig) && "raw" in stringsOrConfig) {
      const rawExtra = (stringsOrConfig as TemplateStringsArray).raw.join("").trim().replace(/\s+/g, " ")
      // Strip sub-blocks from both sides before merging base classes
      const merged = twMerge(extractBaseClasses(base), extractBaseClasses(rawExtra))
      const extended = createComponent(
        originalTag,
        typeof config === "string" ? merged : { ...config, base: merged }
      )
      // Carry over parent sub-components first, then apply overrides from extend template
      carryOverSubComponents(extended as unknown as TwStyledComponent<ComponentConfig, string>, component as unknown as TwStyledComponent<ComponentConfig, string>)
      const extendSubBlocks = parseSubComponentBlocks(rawExtra)
      if (extendSubBlocks.size > 0) {
        const extComp = extended as unknown as Record<string, unknown>
        const displayName = extended.displayName ?? "tw"
        for (const [subName, subClasses] of extendSubBlocks) {
          extComp[subName] = createSubComponentAccessor(displayName, subName, subClasses)
        }
      }
      return extended as unknown as TwStyledComponent<TConfig, string>
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
    const extended = createComponent(originalTag, {
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
    carryOverSubComponents(extended as unknown as TwStyledComponent<ComponentConfig, string>, component as unknown as TwStyledComponent<ComponentConfig, string>)
    return extended as unknown as TwStyledComponent<TConfig, string>
  }

  component.extend = extendWithClasses as TwStyledComponent<TConfig, string>["extend"]

  component.withVariants = (newConfig: Partial<ComponentConfig>) => {
    const existing = typeof config === "object" ? config : {}
    return createComponent(originalTag, {
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
    }) as unknown as TwStyledComponent<TConfig, string>
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
  component.withSub = (() => component) as TwStyledComponent<TConfig, string>["withSub"]

  return component
}

export function createComponent<TConfig extends ComponentConfig>(
  tag: React.ElementType,
  config: TConfig | string
): TwStyledComponent<TConfig, InferSubFromConfig<TConfig>> {
  const isStatic = typeof config === "string"
  const base = typeof config === "string" ? config : (config.base ?? "")
  const variants = typeof config === "string" ? {} : (config.variants ?? {}) as Record<string, Record<string, string>>
  const compoundVariants = typeof config === "string" ? [] : (config.compoundVariants ?? [])
  const defaultVariants = typeof config === "string" ? {} : (config.defaultVariants ?? {})
  const stateConfig = typeof config === "string" ? undefined : config.state
  const containerConfig = typeof config === "string" ? undefined : config.container
  const containerName = typeof config === "string" ? undefined : config.containerName
  const configSub = typeof config === "string" ? undefined : config.sub
  const statesConfig = typeof config === "string" ? undefined : config.states

  // Pre-generate states bitmask lookup via Rust (build time)
  let statesLookup: Record<number, string> | null = null
  let stateKeys: string[] = []
  if (statesConfig && Object.keys(statesConfig).length > 0) {
    // Always populate stateKeys from config — ensures filterProps blocks state
    // props from leaking to DOM even when native binding is unavailable (browser)
    stateKeys = Object.keys(statesConfig)
    try {
      const native = getNativeBinding()
      if (native?.pregenerateStatesNapi) {
        const result = native.pregenerateStatesNapi(statesConfig)
        statesLookup = JSON.parse(result.lookupJson) as Record<number, string>
        stateKeys = result.stateKeys  // use Rust-ordered keys if available
      }
    } catch (e) {
      console.warn("[tailwind-styled-v4] states pre-generation failed, falling back to runtime cx()", e)
    }
  }

  const stateResult = stateConfig
    ? processState(typeof tag === "string" ? tag : "component", stateConfig)
    : null
  const containerResult = containerConfig
    ? processContainer(typeof tag === "string" ? tag : "component", containerConfig, containerName)
    : null

  const engineClasses = [stateResult?.stateClass, containerResult?.containerClass]
    .filter(Boolean)
    .join(" ")

  const filterProps = makeFilterProps(new Set(Object.keys(variants)), new Set(stateKeys))
  const tagLabel =
    typeof tag === "string" ? tag : ((tag as { displayName?: string }).displayName ?? "Component")

  if (isStatic || Object.keys(variants).length === 0) {
    const baseComponent = React.forwardRef<unknown, RuntimeProps<TConfig>>((props, ref) => {
      const { className, ...rest } = props
      const runtimeClassName = normalizeClassName(className)
      const statesClasses = statesConfig
        ? resolveStates(statesConfig, stateKeys, statesLookup, props)
        : ""
      // statesClasses appended AFTER twMerge to prevent conflict resolution
      // from removing valid class combinations like ring-2 + ring-blue-500
      const mergedBase = twMerge(extractBaseClasses(base), engineClasses, runtimeClassName)
      const className2 = statesClasses ? `${mergedBase} ${statesClasses}`.trim() : mergedBase
      return React.createElement(tag, {
        ref,
        ...filterProps(rest),
        className: className2,
      })
    })

    const component = baseComponent as unknown as TwStyledComponent<TConfig, InferSubFromConfig<TConfig>>
    component.displayName = `tw.${tagLabel}`
    const result = attachExtend<TConfig>(component, tag, base, config as ComponentConfig)
    registerSubComponents(result, base, configSub)
    return wrapWithSubProxy(result, tagLabel)
  }

  const baseComponent = React.forwardRef<unknown, RuntimeProps<TConfig>>((props, ref) => {
    const { className, ...rest } = props
    const runtimeClassName = normalizeClassName(className)
    const variantClasses = resolveVariants(variants, props, defaultVariants)
    const compoundClasses = resolveCompound(compoundVariants, props)
    const statesClasses = statesConfig
      ? resolveStates(statesConfig, stateKeys, statesLookup, props)
      : ""

    // statesClasses appended AFTER twMerge — prevents conflict resolution
    // from removing valid combinations like ring-2 + ring-blue-500
    const mergedBase = twMerge(extractBaseClasses(base), variantClasses, compoundClasses, engineClasses, runtimeClassName)
    const className2 = statesClasses ? `${mergedBase} ${statesClasses}`.trim() : mergedBase

    return React.createElement(tag, {
      ref,
      ...filterProps(rest),
      className: className2,
    })
  })

  const component = baseComponent as unknown as TwStyledComponent<TConfig, InferSubFromConfig<TConfig>>
  component.displayName = `tw.${tagLabel}`
  const result = attachExtend<TConfig>(component, tag, base, config as ComponentConfig)
  registerSubComponents(result, base, configSub)
  return wrapWithSubProxy(result, tagLabel)
}

// ── Sub-component fallback proxy ──────────────────────────────────────────────
/**
 * Wrap component dengan Proxy sehingga akses ke sub-component yang tidak
 * terdefinisi (misal Button.footer) tidak mengembalikan undefined dan crash,
 * tapi fallback ke <span> passthrough yang render children-nya saja.
 */
const SKIP_PROXY_KEYS = new Set([
  "extend", "withVariants", "animate", "withSub",
  "displayName", "$$typeof", "render", "prototype",
  "__esModule", "then",
])

function wrapWithSubProxy<P extends object>(
  component: TwStyledComponent<P>,
  tagLabel: string
): TwStyledComponent<P> {
  return new Proxy(component, {
    get(target, prop: string | symbol) {
      const value = (target as unknown as Record<string | symbol, unknown>)[prop]
      // Jika sudah ada (sub-component terdefinisi, method, dll) → pakai langsung
      if (value !== undefined) return value
      // Skip known internal / React symbols
      if (typeof prop === "symbol") return value
      if (SKIP_PROXY_KEYS.has(prop as string)) return value
      // Fallback: buat passthrough <span> untuk sub-component yang tidak terdefinisi
      const Fallback: React.FC<{ children?: React.ReactNode; className?: string }> = ({
        children,
        className,
      }) => React.createElement("span", { className }, children)
      Fallback.displayName = `tw.${tagLabel}.${prop as string}(fallback)`
      return Fallback
    },
  })
}