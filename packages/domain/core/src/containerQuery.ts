/**
 * tailwind-styled-v4 — Container Query Engine
 *
 * Generates @container rules from a simple breakpoint config.
 *
 * Usage:
 *   const Card = tw.div({
 *     base: "p-4",
 *     container: {
 *       sm: "flex-col",      // @container (min-width: 320px)
 *       md: "flex-row",      // @container (min-width: 640px)
 *       lg: "grid-cols-3",   // @container (min-width: 1024px)
 *     },
 *     containerName: "card",
 *   })
 *
 *   // Wrap with container context:
 *   const CardWrapper = tw.div`@container`
 *
 * Named containers:
 *   const SidebarCard = tw.div({
 *     base: "p-2",
 *     container: { lg: "text-sm" },
 *     containerName: "sidebar",
 *   })
 *   // Generates: @container sidebar (min-width: 1024px) { ... }
 */

import type { ContainerConfig } from "./types"
import { getNativeBinding } from "./native"

// ─────────────────────────────────────────────────────────────────────────────
// Breakpoint map — matches Tailwind defaults
// ─────────────────────────────────────────────────────────────────────────────

const CONTAINER_BREAKPOINTS: Record<string, string> = {
  xs: "240px",
  sm: "320px",
  md: "640px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

export interface ContainerEntry {
  id: string
  tag: string
  containerName?: string
  breakpoints: Array<{ minWidth: string; classes: string }>
  cssInjected: boolean
}

const containerRegistry = new Map<string, ContainerEntry>()

declare global {
  interface Window {
    __TW_CONTAINER_REGISTRY__?: typeof containerRegistry
  }
}

if (typeof window !== "undefined") {
  window.__TW_CONTAINER_REGISTRY__ = containerRegistry
}

// ─────────────────────────────────────────────────────────────────────────────
// Hash
// ─────────────────────────────────────────────────────────────────────────────

// Cache untuk hashContainer — container config tidak berubah antar render.
// Sama dengan _hashStateCache di stateEngine.ts.
const _hashContainerCache = new Map<string, string>()

/**
 * Pure-TS FNV-1a 32-bit hash — mirrors Rust fnv implementation.
 * Used as browser fallback for hashContent("fnv", 6).
 */
function _fnvHash6(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (Math.imul(h, 0x01000193) >>> 0)
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 6)
}

function hashContainer(tag: string, container: ContainerConfig, name?: string): string {
  const sortedKey = tag + (name ?? "") + JSON.stringify(Object.entries(container).sort())
  const cached = _hashContainerCache.get(sortedKey)
  if (cached) return cached

  const native = getNativeBinding()
  const id = native?.hashContent
    ? `tw-cq-${native.hashContent(sortedKey, "fnv", 6)}`
    : `tw-cq-${_fnvHash6(sortedKey)}`   // browser fallback

  _hashContainerCache.set(sortedKey, id)
  return id
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Konversi layout class string → inline CSS declarations.
 * Native-only: Rust static lookup table (zero alloc) + split_whitespace.
 */
function layoutClassesToCss(classes: string): string {
  const native = getNativeBinding()
  if (!native?.layoutClassesToCss) {
    // Browser fallback: container CSS is injected from build-time static file.
    // Runtime generation is not needed — return empty so buildContainerRules
    // produces no rules (injectContainerStyles becomes a no-op).
    return ""
  }
  return native.layoutClassesToCss(classes)
}

function buildContainerRules(
  id: string,
  container: ContainerConfig,
  containerName?: string
): string {
  const rules = Object.entries(container)
    .map(([key, value]) => {
      const minWidth =
        typeof value === "string"
          ? (CONTAINER_BREAKPOINTS[key] ?? key)
          : (value.minWidth ?? CONTAINER_BREAKPOINTS[key] ?? key)
      const classes = typeof value === "string" ? value : value.classes

      const css = layoutClassesToCss(classes)
      if (!css) return null

      const query = containerName
        ? `@container ${containerName} (min-width: ${minWidth})`
        : `@container (min-width: ${minWidth})`

      return `${query}{.${id}{${css}}}`
    })
    .filter(Boolean) as string[]

  return rules.join("\n")
}

// ─────────────────────────────────────────────────────────────────────────────
// Batched injector — resolve sekali di module load
let _cqBatchedInjectFn: ((css: string) => void) | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@tailwind-styled/runtime-css/batched") as { batchedInject: (css: string) => void }
  if (typeof mod?.batchedInject === "function") _cqBatchedInjectFn = mod.batchedInject
} catch { /* runtime-css tidak terinstall */ }

// Static CSS detection cache — skip injection kalau @container rule sudah ada di stylesheet
const _cqStaticDetected = new Set<string>()

// Style injection
// ─────────────────────────────────────────────────────────────────────────────

function injectContainerStyles(
  id: string,
  container: ContainerConfig,
  containerName?: string
): void {
  if (typeof document === "undefined") return
  const styleId = `tw-cq-${id}`
  if (document.getElementById(styleId)) return

  // ── Static CSS guard ─────────────────────────────────────────────────────
  // Skip injection kalau @container rule untuk ID ini sudah ada di stylesheet statis.
  if (_cqStaticDetected.has(id)) return
  if (typeof document.styleSheets !== "undefined") {
    // Cari @container rule yang mengandung selector `.{id}` di dalamnya
    const selectorTarget = `.${id}`
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const rules = document.styleSheets[i].cssRules
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j]
          // CSSContainerRule (instanceof CSSRule type 12) atau CSSMediaRule
          if (rule.cssText.includes(selectorTarget)) {
            _cqStaticDetected.add(id)
            return
          }
        }
      } catch { continue }
    }
  }

  const css = buildContainerRules(id, container, containerName)
  if (!css) return

  // _batchedInjectFn di-resolve sekali di module level (lihat deklarasi di atas)
  if (_cqBatchedInjectFn) {
    for (const rule of css.split("\n").filter(Boolean)) _cqBatchedInjectFn(rule)
    return
  }

  const style = document.createElement("style")
  style.id = styleId
  style.setAttribute("data-tw-container", id)
  style.textContent = css
  document.head.appendChild(style)
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface ContainerQueryResult {
  containerClass: string
  hasContainer: true
}

export function processContainer(
  tag: string,
  container: ContainerConfig,
  containerName?: string
): ContainerQueryResult {
  const id = hashContainer(tag, container, containerName)

  if (!containerRegistry.has(id)) {
    const breakpoints = Object.entries(container).map(([key, value]) => ({
      minWidth: CONTAINER_BREAKPOINTS[key] ?? key,
      classes: typeof value === "string" ? value : value.classes,
    }))
    containerRegistry.set(id, {
      id,
      tag,
      containerName,
      breakpoints,
      cssInjected: false,
    })
  }

  injectContainerStyles(id, container, containerName)
  containerRegistry.get(id)!.cssInjected = true

  return { containerClass: id, hasContainer: true }
}

/**
 * Generate @container CSS rules dari breakpoint config.
 *
 * Native-only: Rust string building tanpa intermediate allocations.
 */
export function generateContainerCss(
  tag: string,
  container: ContainerConfig,
  containerName?: string
): string {
  const id = hashContainer(tag, container, containerName)

  const native = getNativeBinding()
  if (!native?.buildContainerRules) {
    throw new Error("FATAL: Native binding 'buildContainerRules' is required but not available.")
  }
  const breakpoints = Object.entries(container).map(([key, value]) => ({
    key,
    classes: typeof value === "string" ? value : value.classes,
  }))
  return native.buildContainerRules(id, breakpoints, containerName ?? null)
}

export function getContainerRegistry(): Map<string, ContainerEntry> {
  return containerRegistry
}