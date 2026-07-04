/**
 * tailwind-styled-v4 v2 — tw
 *
 * API:
 *   tw.div`p-4 bg-zinc-900`
 *   tw.button`px-4 [icon] { h-4 w-4 }`   ← sub-components inline
 *   tw.button({ base: "px-4", variants: { size: { sm: "text-sm" } } })
 *   tw(Link)`underline text-blue-400`
 *   tw.server.div`p-4`   ← server-only, compiler enforced + runtime dev warning
 */

import React from "react"
import { createComponent } from "./createComponent"
import { getNativeBinding } from "./native"
import { parseTemplateJs } from "./parseTemplateFallback"
import type {
  ComponentConfig,
  TwComponentFactory,
  TwObject,
  TwServerObject,
  TwStyledComponent,
  TwTagFactory,
  TwTagFactoryAny,
  InferSubFromConfig,
} from "./types"

// types.ts is single source of truth — re-export for consumers
export type { TwComponentFactory, TwObject, TwServerObject, TwTagFactory }

// ─────────────────────────────────────────────────────────────────────────────
// Template parser
// ─────────────────────────────────────────────────────────────────────────────

interface ParsedTemplate {
  /** Base classes — tanpa sub-component blocks */
  base: string
  /** Sub-component map: { icon: "h-4 w-4 ...", badge: "px-2 ..." } */
  subs: Record<string, string>
  /** Ada sub-component atau tidak */
  hasSubs: boolean
}

// Cache untuk parseTemplate — raw template string tidak berubah antar hot reloads
const _parsedTemplateCache = new Map<string, ParsedTemplate>()

/**
 * parseTemplate — native-only. Selalu di-handle compiler Rust untuk static
 * template literals. Dynamic template (${...}) tetap butuh native binding
 * di server; di browser bukan valid use case.
 */
function parseTemplate(strings: TemplateStringsArray, exprs: unknown[]): ParsedTemplate {
  const raw = strings.raw.reduce((acc, str, i) => {
    const expr = exprs[i]
    const exprStr = typeof expr === "function" ? "" : (expr ?? "")
    return acc + str + String(exprStr)
  }, "")

  const cached = _parsedTemplateCache.get(raw)
  if (cached) return cached

  const binding = getNativeBinding()
  if (!binding?.parseTemplate) {
    // Browser fallback — pure-TS parser untuk template literal
    const fb = parseTemplateJs(raw)
    const result: ParsedTemplate = { base: fb.base, subs: fb.subs, hasSubs: fb.hasSubs }
    _parsedTemplateCache.set(raw, result)
    return result
  }

  const r = binding.parseTemplate(raw)
  const subs: Record<string, string> = r.hasSubs ? JSON.parse(r.subsJson) : {}
  const result: ParsedTemplate = { base: r.base, subs, hasSubs: r.hasSubs }

  _parsedTemplateCache.set(raw, result)
  return result
}

type RuntimeTagFactory = {
  // Template literal overload
  (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<ComponentConfig, string, Record<string, never>, any>
  // Object config overload — properly typed dengan config object literal inference
  <C extends ComponentConfig>(config: C): TwStyledComponent<
    C,
    InferSubFromConfig<C>,
    any,
    any
  >
} & TwTagFactoryAny

// ─────────────────────────────────────────────────────────────────────────────
// makeTag
// ─────────────────────────────────────────────────────────────────────────────

function makeTag(tag: React.ElementType): RuntimeTagFactory {
  // Function implementation yang handle both overloads
  const impl = ((
    stringsOrConfig: TemplateStringsArray | ComponentConfig,
    ...exprs: unknown[]
  ): any => {
    // Object config path
    if (
      !Array.isArray(stringsOrConfig) &&
      typeof stringsOrConfig === "object" &&
      stringsOrConfig !== null &&
      !("raw" in stringsOrConfig)
    ) {
      // Config object — createComponent properly infer TConfig
      return createComponent(tag, stringsOrConfig as ComponentConfig)
    }

    // Template literal path — TypeScript now knows it's TemplateStringsArray
    // because we eliminated the config branch above via type guard
    const strings = stringsOrConfig as TemplateStringsArray
    const parsed = parseTemplate(strings, exprs)

    // Buat component dari base classes
    const component = createComponent(tag, parsed.base)

    // Attach sub-components sebagai React.FC dari classes yang di-extract
    if (parsed.hasSubs) {
      for (const [name, classes] of Object.entries(parsed.subs)) {
        // Setiap sub-component adalah styled span/div dengan classesnya
        const SubComp = React.forwardRef<
          HTMLSpanElement,
          { children?: React.ReactNode; className?: string }
        >(({ children, className }, ref) =>
          React.createElement("span", {
            ref,
            className: className ? `${classes} ${className}` : classes,
          }, children)
        )
        SubComp.displayName = `tw.${typeof tag === "string" ? tag : "component"}.${name}`;
        ; (component as unknown as Record<string, unknown>)[name] = SubComp
      }
    }

    return component
  }) as RuntimeTagFactory

  return impl
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML tag list
// ─────────────────────────────────────────────────────────────────────────────

const HTML_TAGS = [
  "html", "head", "body",
  "div", "section", "article", "aside", "header", "footer", "main", "nav",
  "figure", "figcaption", "details", "summary",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "span", "strong", "em", "b", "i", "s", "u", "small", "mark",
  "abbr", "cite", "code", "kbd", "samp", "var", "time", "address",
  "blockquote", "q", "del", "ins", "sub", "sup",
  "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "colgroup", "col",
  "img", "picture", "video", "audio", "source", "track",
  "canvas", "svg", "path", "circle", "rect", "line",
  "polyline", "polygon", "g", "defs", "use", "symbol",
  "form", "input", "textarea", "select", "option", "optgroup",
  "button", "label", "fieldset", "legend", "output",
  "progress", "meter", "datalist",
  "a", "area", "map", "iframe", "embed", "object",
  "pre", "hr", "br", "wbr", "dialog", "menu", "template", "slot",
] as const

// ─────────────────────────────────────────────────────────────────────────────
// tw.server — server-only namespace with dev warning
// ─────────────────────────────────────────────────────────────────────────────

function makeServerTag(tag: React.ElementType): RuntimeTagFactory {
  const baseFactory = makeTag(tag)
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    return ((
      stringsOrConfig: TemplateStringsArray | ComponentConfig,
      ...exprs: unknown[]
    ): TwStyledComponent<ComponentConfig, string> => {
      const tagName =
        typeof tag === "string"
          ? tag
          : ((tag as { displayName?: string }).displayName ?? "Component")
      console.warn(
        `[tailwind-styled-v4] tw.server.${tagName} rendered in browser. ` +
        `Ensure withTailwindStyled or Vite plugin is configured.`
      )
      // Call baseFactory dengan proper type narrowing — both overloads supported
      return (baseFactory as any)(stringsOrConfig, ...exprs)
    }) as RuntimeTagFactory
  }
  return baseFactory
}

const serverFactories: Record<string, RuntimeTagFactory> = {}
for (const tag of HTML_TAGS) {
  serverFactories[tag] = makeServerTag(tag as React.ElementType)
}

export const server: TwServerObject = serverFactories as unknown as TwServerObject

// ─────────────────────────────────────────────────────────────────────────────
// tw — main export
// ─────────────────────────────────────────────────────────────────────────────

const tagFactories: Record<string, RuntimeTagFactory> = {}
for (const tag of HTML_TAGS) {
  tagFactories[tag] = makeTag(tag as React.ElementType)
}

function twCallable(component: React.ComponentType<unknown>) {
  return makeTag(component)
}

export const tw: TwObject = Object.assign(twCallable, tagFactories, {
  server,
}) as unknown as TwObject