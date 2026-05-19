/**
 * tailwind-styled-v4 — Reactive State Engine
 *
 * Zero-JS CSS state management via data attributes.
 * No React re-render needed for style changes.
 *
 * How it works:
 *   1. tw.button({ state: { active: "bg-blue-500", loading: "opacity-70" } })
 *   2. State engine generates a unique class + injects CSS:
 *      .tw-s-abc123[data-active="true"] { @apply bg-blue-500; }
 *      .tw-s-abc123[data-loading="true"] { @apply opacity-70; }
 *   3. Component renders with the state class
 *   4. User sets data-active="true" directly — no state needed
 *
 * Devtools integration:
 *   All components register to __TW_STATE_REGISTRY__ for devtools inspection.
 */

import type { StateConfig } from "./types"
import { getNativeBinding } from "./native"

// ─────────────────────────────────────────────────────────────────────────────
// Registry — tracks all state-enabled components
// ─────────────────────────────────────────────────────────────────────────────

export interface StateComponentEntry {
  id: string
  tag: string
  states: string[]
  cssInjected: boolean
}

const stateRegistry = new Map<string, StateComponentEntry>()

declare global {
  interface Window {
    __TW_STATE_REGISTRY__?: typeof stateRegistry
  }
}

if (typeof window !== "undefined") {
  window.__TW_STATE_REGISTRY__ = stateRegistry
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic hash — same config → same class (no re-injection on HMR)
// ─────────────────────────────────────────────────────────────────────────────

// Cache untuk hashState — state config tidak berubah antar render,
// hash hanya perlu dihitung sekali per (tag, state) kombinasi.
const _hashStateCache = new Map<string, string>()

function hashState(tag: string, state: StateConfig): string {
  // Key untuk cache: sort untuk determinism (Object.entries order tidak guaranteed)
  const sortedKey = tag + JSON.stringify(Object.entries(state).sort())
  const cached = _hashStateCache.get(sortedKey)
  if (cached) return cached

  let id: string
  try {
    const native = getNativeBinding()
    if (native?.hashContent) {
      // native hashContent: FNV-1a via Rust, ~40x lebih cepat dari JS djb2 loop
      // karena tidak ada .split("") overhead (char array allocation) dan
      // tidak perlu .reduce() closure per-character.
      const raw = native.hashContent(sortedKey, "fnv", 6)
      id = `tw-s-${raw}`
    } else {
      throw new Error("no hashContent")
    }
  } catch {
    // JS djb2 fallback — identik output tidak dijamin dengan native,
    // tapi cukup untuk development / browser context.
    const hash = sortedKey.split("").reduce((h, char) => ((h << 5) + h) ^ char.charCodeAt(0), 5381)
    id = `tw-s-${Math.abs(hash).toString(36).slice(0, 6)}`
  }

  _hashStateCache.set(sortedKey, id)
  return id
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS generator — Tailwind class → plain CSS via Rust (required)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert Tailwind utility classes → semicolon-separated inline CSS declarations.
 * Native-only: delegates ke Rust `tw_classes_to_css` (state_css.rs).
 *
 * @internal — called by injectStateStyles()
 */
// Cache untuk twClassesToCss — classes string dari state config tidak berubah.
// Ini hot path: dipanggil untuk setiap state entry setiap kali injectStateStyles
// dipanggil. Dengan cache, Rust hanya dipanggil sekali per unique class string.
const _twClassesToCssCache = new Map<string, string>()

function twClassesToCss(classes: string): string {
  const cached = _twClassesToCssCache.get(classes)
  if (cached !== undefined) return cached

  const native = getNativeBinding()
  if (!native?.twClassesToCss) {
    throw new Error("FATAL: Native binding 'twClassesToCss' is required but not available.")
  }
  const result = native.twClassesToCss(classes)
  _twClassesToCssCache.set(classes, result)
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// Batched injector — resolve sekali di module load, bukan per injectStateStyles call.
// require() di-cache hasilnya di sini supaya tidak ada module resolution overhead
// setiap kali ada state change di browser.
let _batchedInjectFn: ((css: string) => void) | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("@tailwind-styled/runtime-css/batched") as { batchedInject: (css: string) => void }
  if (typeof mod?.batchedInject === "function") _batchedInjectFn = mod.batchedInject
} catch {
  // runtime-css tidak terinstall — fallback ke per-element style tag
}

// ─────────────────────────────────────────────────────────────────────────────
// Style injection — batched for performance (FIX CSS Rule Batching)
// ─────────────────────────────────────────────────────────────────────────────

function injectStateStyles(id: string, state: StateConfig): void {
  if (typeof document === "undefined") return

  const styleId = `tw-state-${id}`
  if (document.getElementById(styleId)) return // already injected

  // ── Static CSS check ──────────────────────────────────────────────────────
  // Cek apakah CSS untuk component ini sudah ada dari static file
  // (di-generate oleh staticStateExtractor.ts saat build time).
  //
  // Cara detect: cari selector `.{id}[data-` di semua stylesheets yang ada.
  // Kalau ketemu, berarti static pre-generation sudah cover component ini
  // → skip runtime injection sepenuhnya (zero batchedInject call).
  if (typeof document.styleSheets !== "undefined") {
    const selectorPrefix = `.${id}[data-`
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i]
        // sheet.cssRules bisa throw SecurityError untuk cross-origin sheets
        const rules = sheet.cssRules
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j]
          if (rule instanceof CSSStyleRule && rule.selectorText.startsWith(selectorPrefix)) {
            // Static CSS sudah mencakup component ini — tidak perlu inject
            return
          }
        }
      } catch {
        // Cross-origin atau CSSOM tidak accessible — skip sheet ini
        continue
      }
    }
  }

  const rules = Object.entries(state)
    .map(([stateName, classes]) => {
      const css = twClassesToCss(classes)
      return css ? `.${id}[data-${stateName}="true"]{${css}}` : null
    })
    .filter(Boolean) as string[]

  if (rules.length === 0) return

  // Try batched injector first (available when runtime-css is installed).
  // _batchedInjectFn di-resolve sekali di module level — hindari require() dinamis
  // (dynamic require = module resolution + file I/O) setiap kali ada state change.
  if (_batchedInjectFn) {
    for (const rule of rules) _batchedInjectFn(rule)
    return
  }

  const style = document.createElement("style")
  style.id = styleId
  style.setAttribute("data-tw-state", id)
  style.textContent = rules.join("\n")
  document.head.appendChild(style)
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface StateEngineResult {
  /** CSS class to add to the component */
  stateClass: string
  /** Whether this component uses state (for SSR data attributes) */
  hasState: true
  /** List of state names (for devtools) */
  stateNames: string[]
}

/**
 * Process a StateConfig for a component.
 * Returns the state class and injects CSS (client-side only).
 *
 * @param tag HTML tag name
 * @param state State config object
 * @param precomputedHash Optional pre-computed hash dari `inject_state_hash()` Rust transform.
 *   Kalau ada, skip runtime `hashState()` sepenuhnya → zero hashing overhead.
 */
export function processState(
  tag: string,
  state: StateConfig,
  precomputedHash?: string
): StateEngineResult {
  // Pakai pre-computed hash kalau tersedia (di-inject oleh turbopackLoader via Rust)
  // Format: 6-char FNV-1a hex — identik dengan output hashState()
  const id = precomputedHash
    ? `tw-s-${precomputedHash}`
    : hashState(tag, state)
  const stateNames = Object.keys(state)

  // Register for devtools
  if (!stateRegistry.has(id)) {
    stateRegistry.set(id, {
      id,
      tag,
      states: stateNames,
      cssInjected: false,
    })
  }

  // Inject CSS (client only)
  injectStateStyles(id, state)

  // Mark as injected
  const entry = stateRegistry.get(id)!
  entry.cssInjected = true

  return { stateClass: id, hasState: true, stateNames }
}

/**
 * Generate SSR-safe CSS string for a state config.
 * Used by SSR to inject styles into <head>.
 */
export function generateStateCss(tag: string, state: StateConfig): string {
  const id = hashState(tag, state)

  const rules = Object.entries(state)
    .map(([stateName, classes]) => {
      const css = twClassesToCss(classes)
      return css ? `.${id}[data-${stateName}="true"]{${css}}` : null
    })
    .filter(Boolean) as string[]

  return rules.join("\n")
}

/**
 * Get the state registry (for devtools).
 */
export function getStateRegistry(): Map<string, StateComponentEntry> {
  return stateRegistry
}