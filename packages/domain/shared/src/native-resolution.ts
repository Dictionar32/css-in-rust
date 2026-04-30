/**
 * Prebuilt binary resolution untuk native NAPI bindings.
 * QA #1: Resolve native binary dari prebuilt packages atau local build.
 *
 * Prioritas:
 * 1. TW_NATIVE_PATH env var (explicit override)
 * 2. Prebuilt binary dari platform-specific npm package
 * 3. Local build dari source (developer mode)
 */

import { createRequire } from "node:module"
import * as fs from "node:fs"
import * as path from "node:path"

const isBrowser = typeof window !== "undefined" || typeof document !== "undefined"

// ESM-safe require — works in both ESM and CJS contexts
const _require = typeof require !== "undefined" ? require : createRequire(import.meta.url)

export interface NativeResolutionResult {
  path: string | null
  source: "env" | "prebuilt" | "local" | "not-found"
  platform: string
  tried: string[]
}

/** Platform key → prebuilt npm package name */
const PLATFORM_MAP: Record<string, string[]> = {
  "linux-x64":    ["@tailwind-styled/native-linux-x64"],
  "linux-arm64":  ["@tailwind-styled/native-linux-arm64"],
  "darwin-x64":   ["@tailwind-styled/native-darwin-x64"],
  "darwin-arm64": ["@tailwind-styled/native-darwin-arm64"],
  "win32-x64":    ["@tailwind-styled/native-win32-x64"],
  "win32-arm64":  ["@tailwind-styled/native-win32-arm64"],
}

function platformKey(): string {
  if (isBrowser) return "browser"
  return `${process.platform}-${process.arch}`
}

/**
 * Resolve native binary path dari semua sumber yang tersedia.
 *
 * @example
 * const result = resolveNativeBinary()
 * if (result.path) {
 *   const binding = require(result.path)
 * } else {
 *   throw new Error("Native binding not found — run npm run build:rust")
 * }
 */
export function resolveNativeBinary(runtimeDir?: string): NativeResolutionResult {
  const platform = platformKey()
  const tried: string[] = []

  if (isBrowser) {
    return { path: null, source: "not-found", platform, tried: ["not available in browser"] }
  }

  // 1. Env var override
  const envPath = process.env.TW_NATIVE_PATH?.trim()
  if (envPath) {
    if (fs.existsSync(envPath)) {
      return { path: envPath, source: "env", platform, tried }
    }
    tried.push(`env:${envPath} (not found)`)
  }

  // 2. Prebuilt binary dari platform-specific npm package
  const prebuiltPkgs = PLATFORM_MAP[platform] ?? []
  for (const pkg of prebuiltPkgs) {
    try {
      const candidate = _require.resolve(`${pkg}/tailwind_styled_parser.node`)
      if (fs.existsSync(candidate)) {
        return { path: candidate, source: "prebuilt", platform, tried }
      }
      tried.push(`prebuilt:${pkg} (resolved but missing)`)
    } catch {
      tried.push(`prebuilt:${pkg} (not installed)`)
    }
  }

  // 3. Local build candidates
  const cwd = process.cwd()
  const base = runtimeDir ?? cwd
  // napi-rs naming: platform key may have -gnu suffix on Linux
  const napiPlatform = platform === "linux-x64" ? "linux-x64-gnu"
    : platform === "linux-arm64" ? "linux-arm64-gnu"
    : platform
  const localCandidates = [
    path.resolve(base, "tailwind_styled_parser.node"),
    path.resolve(base, "..", "tailwind_styled_parser.node"),
    path.resolve(cwd, "native", "tailwind_styled_parser.node"),
    path.resolve(cwd, "native", "target", "release", "tailwind_styled_parser.node"),
    // napi-rs conventional output — platform key
    path.resolve(base, `tailwind_styled_parser.${platform}.node`),
    // napi-rs conventional output — with gnu suffix (Linux)
    path.resolve(base, `tailwind_styled_parser.${napiPlatform}.node`),
    path.resolve(cwd, "native", `tailwind_styled_parser.${platform}.node`),
    path.resolve(cwd, "native", `tailwind_styled_parser.${napiPlatform}.node`),
  ]

  for (const candidate of localCandidates) {
    tried.push(`local:${candidate}`)
    if (fs.existsSync(candidate)) {
      return { path: candidate, source: "local", platform, tried }
    }
  }

  return { path: null, source: "not-found", platform, tried }
}

/**
 * Format human-readable error untuk "binary not found".
 */
export function formatNativeNotFoundError(result: NativeResolutionResult): string {
  const lines = [
    `[tailwind-styled] Native binding not found for ${result.platform}`,
    ``,
    `Tried:`,
    ...result.tried.map(t => `  - ${t}`),
    ``,
    `Solutions:`,
    `  1. Build locally:     npm run build:rust`,
    `  2. Install prebuilt:  npm install @tailwind-styled/native-${result.platform}`,
    `  3. Override path:     TW_NATIVE_PATH=/path/to/parser.node`,
  ]
  return lines.join("\n")
}