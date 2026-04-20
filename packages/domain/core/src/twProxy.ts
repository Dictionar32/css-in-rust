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
import type {
  ComponentConfig,
  TwComponentFactory,
  TwObject,
  TwServerObject,
  TwStyledComponent,
  TwTagFactory,
  TwTagFactoryAny,
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

const SUB_RE = /\[([a-zA-Z][a-zA-Z0-9_-]*)\]\s*\{([^}]*)\}/g
const COMMENT_RE = /\/\/[^\n]*/g

function parseTemplate(strings: TemplateStringsArray, exprs: unknown[]): ParsedTemplate {
  const raw = strings.raw.reduce((acc, str, i) => {
    const expr = exprs[i]
    const exprStr = typeof expr === "function" ? "" : (expr ?? "")
    return acc + str + String(exprStr)
  }, "")

  const subs: Record<string, string> = {}
  let base = raw

  // Extract dan hapus semua [name] { ... } blocks dari base
  let match: RegExpExecArray | null
  SUB_RE.lastIndex = 0
  while ((match = SUB_RE.exec(raw)) !== null) {
    const name = match[1]
    const inner = match[2]
      .replace(COMMENT_RE, "")           // strip //comments
      .split("\n").map((l) => l.trim()).filter(Boolean).join(" ")
      .replace(/\s+/g, " ").trim()

    subs[name] = inner
    base = base.replace(match[0], "")
  }

  // Clean base: strip comments, normalize whitespace
  const cleanBase = base
    .replace(COMMENT_RE, "")
    .split("\n").map((l) => l.trim()).filter(Boolean).join(" ")
    .replace(/\s+/g, " ").trim()

  return {
    base: cleanBase,
    subs,
    hasSubs: Object.keys(subs).length > 0,
  }
}

type RuntimeTagFactory = ((
  stringsOrConfig: TemplateStringsArray | ComponentConfig,
  ...exprs: unknown[]
) => TwStyledComponent<Record<string, unknown>>) &
  TwTagFactoryAny

// ─────────────────────────────────────────────────────────────────────────────
// makeTag
// ─────────────────────────────────────────────────────────────────────────────

function makeTag(tag: React.ElementType): RuntimeTagFactory {
  return ((
    stringsOrConfig: TemplateStringsArray | ComponentConfig,
    ...exprs: unknown[]
  ): TwStyledComponent<Record<string, unknown>> => {
    // Object config path
    if (
      !Array.isArray(stringsOrConfig) &&
      typeof stringsOrConfig === "object" &&
      stringsOrConfig !== null &&
      !("raw" in stringsOrConfig)
    ) {
      return createComponent(tag, stringsOrConfig as ComponentConfig)
    }

    // Template literal path
    const parsed = parseTemplate(stringsOrConfig as TemplateStringsArray, exprs)

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
        (component as Record<string, unknown>)[name] = SubComp
      }
    }

    return component
  }) as RuntimeTagFactory
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML tag list
// ─────────────────────────────────────────────────────────────────────────────

const HTML_TAGS = [
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
    ): TwStyledComponent<Record<string, unknown>> => {
      const tagName =
        typeof tag === "string"
          ? tag
          : ((tag as { displayName?: string }).displayName ?? "Component")
      console.warn(
        `[tailwind-styled-v4] tw.server.${tagName} rendered in browser. ` +
          `Ensure withTailwindStyled or Vite plugin is configured.`
      )
      return baseFactory(stringsOrConfig, ...exprs)
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