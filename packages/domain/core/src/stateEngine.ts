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

function hashState(tag: string, state: StateConfig): string {
  const key = tag + JSON.stringify(Object.entries(state).sort())
  const hash = key.split("").reduce((h, char) => ((h << 5) + h) ^ char.charCodeAt(0), 5381)
  return `tw-s-${Math.abs(hash).toString(36).slice(0, 6)}`
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
function twClassesToCss(classes: string): string {
  const native = getNativeBinding()
  if (!native?.twClassesToCss) {
    throw new Error("FATAL: Native binding 'twClassesToCss' is required but not available.")
  }
  return native.twClassesToCss(classes)
}

// ─────────────────────────────────────────────────────────────────────────────
// Style injection — batched for performance (FIX CSS Rule Batching)
// ─────────────────────────────────────────────────────────────────────────────

function injectStateStyles(id: string, state: StateConfig): void {
  if (typeof document === "undefined") return

  const styleId = `tw-state-${id}`
  if (document.getElementById(styleId)) return // already injected

  const rules = Object.entries(state)
    .map(([stateName, classes]) => {
      const css = twClassesToCss(classes)
      return css ? `.${id}[data-${stateName}="true"]{${css}}` : null
    })
    .filter(Boolean) as string[]

  if (rules.length === 0) return

  // Try batched injector first (available when runtime-css is installed)
  try {
    const { batchedInject } = require("@tailwind-styled/runtime-css/batched") as {
      batchedInject: (css: string) => void
    }
    for (const rule of rules) batchedInject(rule)
    return
  } catch {
    // Fallback: per-element style tag (original behavior)
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
 */
export function processState(tag: string, state: StateConfig): StateEngineResult {
  const id = hashState(tag, state)
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