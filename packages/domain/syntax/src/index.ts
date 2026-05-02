import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

interface NativeSyntaxBridge {
  extractClassesFromSource?: (source: string) => string[] | null
  parseClassesFromString?: (raw: string) => string[]
}

const VALID_CLASS_RE = /^[-a-z0-9:/[\]!.()+%]+$/

function getRuntimeDir(): string {
  if (typeof __dirname !== "undefined") return __dirname
  if (typeof import.meta !== "undefined" && import.meta.url) {
    return path.dirname(fileURLToPath(import.meta.url))
  }
  return process.cwd()
}

function tryRequire(id: string): NativeSyntaxBridge | null {
  try {
    const runtimeDir = getRuntimeDir()
    const requireFromRuntime =
      typeof module !== "undefined" && typeof module.require === "function"
        ? module.require.bind(module)
        : createRequire(path.join(runtimeDir, "noop.cjs"))
    const loaded = requireFromRuntime(id) as NativeSyntaxBridge
    return loaded ?? null
  } catch {
    return null
  }
}

const bridgeState = { current: undefined as NativeSyntaxBridge | null | undefined }

function getNativeBridge(): NativeSyntaxBridge {
  if (bridgeState.current !== undefined) {
    if (bridgeState.current === null) {
      throw new Error(
        "[tailwind-styled/syntax] Native syntax binding is required but not available."
      )
    }
    return bridgeState.current
  }

  const runtimeDir = getRuntimeDir()
  const candidates = [
    "@tailwind-styled/native",
    path.resolve(process.cwd(), "native", "index.mjs"),
    path.resolve(runtimeDir, "..", "..", "..", "native", "index.mjs"),
    path.resolve(runtimeDir, "..", "..", "..", "..", "native", "index.mjs"),
    path.resolve(process.cwd(), "native", "index.node"),
    path.resolve(runtimeDir, "..", "..", "..", "native", "index.node"),
    path.resolve(runtimeDir, "..", "..", "..", "..", "native", "index.node"),
  ]

  for (const candidate of candidates) {
    const loaded = tryRequire(candidate)
    if (loaded?.extractClassesFromSource) {
      bridgeState.current = loaded
      return bridgeState.current
    }
  }

  bridgeState.current = null
  throw new Error(
    "[tailwind-styled/syntax] Native syntax binding not found. Run `npm run build:rust` first."
  )
}

export function extractAllClasses(source: string): string[] {
  const result = getNativeBridge().extractClassesFromSource?.(source)
  if (result === null || result === undefined) {
    throw new Error("[tailwind-styled/syntax] Native extractClassesFromSource returned null.")
  }
  return result.sort()
}

export function parseClasses(raw: string): string[] {
  // JS fallback — works without native binding
  // Split on whitespace, filter by valid class regex
  const tokens = raw.split(/\s+/).filter(t => t.length > 0)
  const valid = tokens.filter(t => VALID_CLASS_RE.test(t))

  // Attempt to use native for speed, fall back to JS result if unavailable
  try {
    const bridge = getNativeBridge()
    if (bridge?.parseClassesFromString) {
      return (bridge.parseClassesFromString as (r: string) => string[])(raw)
    }
  } catch {
    // native not available — return JS fallback result
  }

  return valid
}