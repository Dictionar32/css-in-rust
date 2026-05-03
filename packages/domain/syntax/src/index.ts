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
    // runtimeDir = dist/ → naik 4 level ke repo root
    path.resolve(process.cwd(), "native", "tailwind-styled-native.node"),
    path.resolve(process.cwd(), "native", `tailwind-styled-native.${process.platform}-${process.arch}.node`),
    path.resolve(process.cwd(), "native", `tailwind-styled-native.${process.platform}-${process.arch}-gnu.node`),
    path.resolve(runtimeDir, "..", "..", "..", "..", "native", "tailwind-styled-native.node"),
    path.resolve(runtimeDir, "..", "..", "..", "..", "native", `tailwind-styled-native.${process.platform}-${process.arch}-gnu.node`),
    // 3 level fallback
    path.resolve(runtimeDir, "..", "..", "..", "native", "tailwind-styled-native.node"),
    path.resolve(runtimeDir, "..", "..", "..", "native", `tailwind-styled-native.${process.platform}-${process.arch}-gnu.node`),
    // backward compat
    path.resolve(process.cwd(), "native", "index.mjs"),
    path.resolve(runtimeDir, "..", "..", "..", "..", "native", "index.mjs"),
    path.resolve(runtimeDir, "..", "..", "..", "native", "index.mjs"),
    path.resolve(process.cwd(), "native", "index.node"),
    path.resolve(runtimeDir, "..", "..", "..", "..", "native", "index.node"),
    path.resolve(runtimeDir, "..", "..", "..", "native", "index.node"),
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
  // NAPI kadang return non-Array (misal string JSON) — normalize dulu sebelum sort
  const arr: string[] = Array.isArray(result)
    ? result
    : typeof result === "string"
      ? (JSON.parse(result) as string[])
      : Array.from(result as Iterable<string>)
  return arr.sort()
}

export function parseClasses(raw: string): string[] {
  const bridge = getNativeBridge()
  if (!bridge?.parseClassesFromString) {
    throw new Error("FATAL: Native binding 'parseClassesFromString' is required but not available.")
  }
  return (bridge.parseClassesFromString as (r: string) => string[])(raw)
}