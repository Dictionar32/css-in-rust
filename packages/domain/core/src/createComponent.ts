// AnimateOptions loaded dynamically to avoid bundling @tailwind-styled/animate
type AnimateOptions = { from: string; to: string; duration?: number; easing?: string; delay?: number; fill?: string; iterations?: number | "infinite"; direction?: string; name?: string }
import React from "react"

import { processContainer } from "./containerQuery"
import { twMerge } from "./merge"
import { getNativeBinding } from "./native"
import { parseTemplateJs } from "./parseTemplateFallback"
import { processState } from "./stateEngine"
import type { ComponentConfig, InferSubFromConfig, SubValue, TwStyledComponent } from "./types"

const ALWAYS_BLOCKED = new Set(["base", "_ref", "state", "container", "containerName"])

// ── Template parse cache ──────────────────────────────────────────────────────
// parseSubcomponentBlocksNapi + JSON.parse sebelumnya dipanggil ulang setiap
// render (extractBaseClasses + parseSubComponentBlocks dipanggil dari render path).
// Cache ini memastikan Rust hanya dipanggil SEKALI per unique template string.
// Template string dari tw.div({ base: "..." }) tidak berubah antar render,
// jadi cache ini practically never evicted selama app berjalan.
interface _ParsedTemplate {
  baseClasses: string
  subMap: Map<string, string>
}
const _templateParseCache = new Map<string, _ParsedTemplate>()

// Cache untuk statesLookup — key: JSON.stringify(statesConfig sorted)
// Menghindari Rust pregenerateStatesNapi + JSON.parse ulang untuk config identik
interface _StatesLookupEntry { lookup: Record<number, string>; keys: string[] }
const _statesLookupCache = new Map<string, _StatesLookupEntry>()

// Regex untuk detect sub-component block syntax: [name] { ... }
// Berbeda dari arbitrary Tailwind values (word-[value]) karena tidak ada hyphen sebelum [
const _SUB_BLOCK_RE = /(?:^|[\s])(\[\w[\w-]*\])\s*\{/

function _getParsedTemplate(template: string): _ParsedTemplate {
  const cached = _templateParseCache.get(template)
  if (cached) return cached

  // Fast path: tidak ada sub-component block syntax — skip native entirely.
  // Template literal Tailwind biasa (bg-blue-500, w-[100px], dll) tidak akan match.
  // Path ini aman di browser karena tidak butuh native.
  if (!_SUB_BLOCK_RE.test(template)) {
    const result: _ParsedTemplate = {
      baseClasses: template.trim().replace(/\s+/g, " "),
      subMap: new Map(),
    }
    _templateParseCache.set(template, result)
    return result
  }

  // Template punya sub-block syntax → prefer native Rust, fallback ke pure-TS
  const native = getNativeBinding()
  if (!native?.parseSubcomponentBlocksNapi) {
    // Browser fallback — pure-TS parser (mirrors Rust output)
    const fb = parseTemplateJs(template)
    const result: _ParsedTemplate = {
      baseClasses: fb.base,
      subMap: new Map(Object.entries(fb.subs)),
    }
    _templateParseCache.set(template, result)
    return result
  }
  const r = native.parseSubcomponentBlocksNapi(template, "tw")
  const raw = JSON.parse(r.subMapJson) as Record<string, string>
  const result: _ParsedTemplate = {
    baseClasses: r.baseClasses.trim().replace(/\s+/g, " "),
    subMap: new Map(Object.entries(raw)),
  }
  _templateParseCache.set(template, result)
  return result
}

/**
 * Extract sub-component blocks dari template → Map<name, classes>
 * Cache-first: Rust + JSON.parse hanya dipanggil SEKALI per template string.
 */
function parseSubComponentBlocks(template: string): Map<string, string> {
  return _getParsedTemplate(template).subMap
}

/**
 * Strip semua sub-component blocks dari template string → base class string.
 * Cache-first: Rust hanya dipanggil SEKALI per template string.
 */
function extractBaseClasses(template: string): string {
  return _getParsedTemplate(template).baseClasses
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
): React.FC<{ children?: React.ReactNode; className?: string;[key: string]: unknown }> {
  const SubComponent: React.FC<{ children?: React.ReactNode; className?: string;[key: string]: unknown }> = ({
    children,
    className,
    ...rest  // tangkap semua native HTML props (href, onClick, src, alt, dll)
  }) => {
    const mergedClass = className ? `${classes} ${className}` : classes

    // asChild: clone direct child element dan merge className + rest ke dalamnya
    if (asChild && React.isValidElement(children)) {
      const child = React.Children.only(children) as React.ReactElement<{ className?: string }>
      return React.cloneElement(child, {
        ...rest,
        className: child.props.className
          ? `${mergedClass} ${child.props.className}`
          : mergedClass,
      })
    }

    // Teruskan semua extra props ke elemen DOM (href, onClick, target, src, dll)
    return React.createElement(tag, { ...rest, className: mergedClass }, children)
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
      } else if ("base" in value || "variants" in value) {
        // SubComponentConfig dengan potentially variants — direct nested component
        // value sendiri yang adalah ComponentConfig, bukan map lagi
        map[key] = createComponent("div", value as ComponentConfig)
      } else {
        // Plain nested object — key adalah HTML tag, nested keys adalah component names
        // contoh: h2: { title: "text-xl", subtitle: "text-lg" }
        // → Card.title renders <h2>, Card.subtitle renders <h2>
        const tag = key
        for (const [componentName, classesOrConfig] of Object.entries(value)) {
          if (typeof classesOrConfig === "string") {
            map[componentName] = createSubComponentAccessor(
              displayName, componentName, classesOrConfig.trim().replace(/\s+/g, " "), tag
            )
          } else {
            // SubComponentConfig nested di dalam nested object
            map[componentName] = createComponent(tag as React.ElementType, classesOrConfig as ComponentConfig)
          }
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
type RuntimeProps<TConfig extends ComponentConfig, TTag extends React.ElementType> =
  InferVariantProps<TConfig> &
  InferStatesProps<TConfig> &
  React.ComponentPropsWithoutRef<TTag> &  // All native HTML props + ARIA from React's types
  Record<string, unknown>  // Allow any other props (forward ke DOM)

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
  variants: Record<string, Record<string | "true" | "false", string>>,
  props: Record<string, unknown>,
  defaults: Record<string, string | number | boolean>
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

  // TAMBAHKAN: pure-TS fallback untuk browser
  const binding = getNativeBinding()
  if (!binding?.resolveSimpleVariants) {
    // Browser fallback: manual variant lookup
    const classes: string[] = []
    for (const key of Object.keys(variants)) {
      const propValue = cleanProps[key] ?? String(defaults[key])
      if (propValue !== undefined && variants[key]?.[propValue]) {
        classes.push(variants[key][propValue])
      }
    }
    return classes.join(" ").trim().replace(/\s+/g, " ")
  }
  // Server path — TIDAK DIUBAH: tetap call native
  return binding.resolveSimpleVariants(null, variants as Record<string, Record<string, string>>, defaults as Record<string, string>, cleanProps).trim().replace(/\s+/g, " ")
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
      ; (target as unknown as Record<string, unknown>)[key] = (source as unknown as Record<string, unknown>)[key]
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

  component.withVariants = ((newConfig: Partial<ComponentConfig>) => {
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
  }) as TwStyledComponent<TConfig, string>["withVariants"]

  // .animate() dipindah ke tailwind-styled-v4/animate agar tidak bundle @tailwind-styled/animate
  // ke dalam main browser bundle (animate butuh Rust native binding → Node.js only)
  // Note: animate functionality removed from core, use @tailwind-styled/animate package instead

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

  // Pre-generate states bitmask lookup via Rust (build time).
  // Cache key: sorted JSON dari statesConfig — statesConfig tidak berubah antar
  // createComponent calls dengan config yang sama (mis. HMR), jadi cache ini
  // menghindari JSON.parse + Rust call ulang untuk config identik.
  let statesLookup: Record<number, string> | null = null
  let stateKeys: string[] = []
  if (statesConfig && Object.keys(statesConfig).length > 0) {
    stateKeys = Object.keys(statesConfig)
    const statesCacheKey = JSON.stringify(statesConfig, Object.keys(statesConfig).sort())
    const cachedStates = _statesLookupCache.get(statesCacheKey)
    if (cachedStates) {
      statesLookup = cachedStates.lookup
      stateKeys = cachedStates.keys
    } else {
      try {
        const native = getNativeBinding()
        if (native?.pregenerateStatesNapi) {
          const result = native.pregenerateStatesNapi(statesConfig)
          // JSON.parse sekali — disimpan di cache, tidak pernah di-parse ulang
          statesLookup = JSON.parse(result.lookupJson) as Record<number, string>
          stateKeys = result.stateKeys
          _statesLookupCache.set(statesCacheKey, { lookup: statesLookup, keys: stateKeys })
        }
      } catch (e) {
        console.warn("[tailwind-styled-v4] states pre-generation failed, falling back to runtime cx()", e)
      }
    }
  }

  const stateResult = stateConfig
    ? processState(
      typeof tag === "string" ? tag : "component",
      stateConfig,
      // Pakai pre-computed hash dari turbopackLoader (Rust inject_state_hash)
      // kalau tersedia — skip runtime hashState() computation sepenuhnya
      (config as { __hash?: string }).__hash
    )
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
    const baseComponent = React.forwardRef<unknown, RuntimeProps<TConfig, typeof tag>>((props, ref) => {
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
    const result = attachExtend<TConfig>(component as unknown as TwStyledComponent<TConfig, string>, tag, base, config as ComponentConfig)
    registerSubComponents(result, base, configSub)
    return wrapWithSubProxy(result, tagLabel)
  }

  const baseComponent = React.forwardRef<unknown, RuntimeProps<TConfig, typeof tag>>((props, ref) => {
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
  const result = attachExtend<TConfig>(component as unknown as TwStyledComponent<TConfig, string>, tag, base, config as ComponentConfig)
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
    // Forward function calls to target component
    apply(target, thisArg, args) {
      return Reflect.apply(target as Function, thisArg, args)
    },
    get(target, prop: string | symbol) {
      const value = (target as unknown as Record<string | symbol, unknown>)[prop]
      // Jika sudah ada (sub-component terdefinisi, method, dll) → pakai langsung
      if (value !== undefined) return value
      // Skip known internal / React symbols
      if (typeof prop === "symbol") return value
      if (SKIP_PROXY_KEYS.has(prop as string)) return value
      // Fallback: buat passthrough <span> untuk sub-component yang tidak terdefinisi
      const Fallback: React.FC<{ children?: React.ReactNode; className?: string;[key: string]: unknown }> = ({
        children,
        className,
        ...rest
      }) => React.createElement("span", { ...rest, className }, children)
      Fallback.displayName = `tw.${tagLabel}.${prop as string}(fallback)`
      return Fallback
    },
  })
}