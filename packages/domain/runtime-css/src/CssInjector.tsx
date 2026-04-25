/**
 * tailwind-styled-v4 — TwCssInjector
 *
 * React Server Component — inject route-specific CSS ke <head>.
 * Zero client JS, no hydration overhead, streaming-friendly.
 *
 * Pipeline:
 *   1. withTailwindStyled webpack plugin emit CSS manifest ke .next/static/css/tw/
 *   2. TwCssInjector baca manifest → inject <style> inline per route
 *
 * Usage:
 *   // app/layout.tsx
 *   import { TwCssInjector } from "tailwind-styled-v4/runtime-css"
 *
 *   export default function Layout({ children }) {
 *     return (
 *       <html>
 *         <head><TwCssInjector /></head>
 *         <body>{children}</body>
 *       </html>
 *     )
 *   }
 */

import React from "react"

interface CssInjectorProps {
  /** Route spesifik. Default: auto-detect */
  route?: string
  /** Inject global CSS juga. Default: true */
  includeGlobal?: boolean
  /** Minify inline CSS. Default: true */
  minify?: boolean
  /** CSS directory. Default: .next/static/css/tw */
  cssDir?: string
}

/**
 * Server Component — inject CSS per route ke <head>.
 * Baca dari manifest yang di-emit oleh TwCssManifestPlugin.
 */
export async function TwCssInjector(props: CssInjectorProps = {}): Promise<React.ReactElement> {
  const { route, includeGlobal = true, minify = true, cssDir } = props

  // Dynamic import fs — hanya jalan di server
  let fs: typeof import("node:fs") | null = null
  let path: typeof import("node:path") | null = null
  try {
    fs = await import("node:fs")
    path = await import("node:path")
  } catch {
    return React.createElement(React.Fragment, null)
  }

  const resolvedDir = cssDir
    ?? path.join(process.cwd(), ".next", "static", "css", "tw")

  const manifestPath = path.join(resolvedDir, "css-manifest.json")

  // Baca manifest
  let manifest: { routes?: Record<string, string> } = {}
  try {
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
    }
  } catch {
    // Manifest tidak ada — mungkin belum build atau native binding belum ready
    return React.createElement(React.Fragment, null)
  }

  const cssChunks: string[] = []

  // Global CSS (_global.css)
  if (includeGlobal && manifest.routes?.["__global"]) {
    const globalPath = path.join(resolvedDir, manifest.routes["__global"])
    const css = readFile(fs, globalPath)
    if (css) cssChunks.push(css)
  }

  // Route-specific CSS
  const targetRoute = route ?? "/"
  if (manifest.routes?.[targetRoute]) {
    const routePath = path.join(resolvedDir, manifest.routes[targetRoute])
    const css = readFile(fs, routePath)
    if (css) cssChunks.push(css)
  }

  if (cssChunks.length === 0) return React.createElement(React.Fragment, null)

  const combined = cssChunks.join("\n")
  const final = minify ? minifyCss(combined) : combined

  return React.createElement("style", {
    dangerouslySetInnerHTML: { __html: final },
    "data-tw-route": targetRoute,
    "data-tw-injector": "true",
  })
}

/**
 * Hook untuk client components — CSS sudah di-handle TwCssInjector di server.
 */
export function useTwClasses(classes: string): string {
  return classes
}

// Helpers
function readFile(fs: typeof import("node:fs"), filepath: string): string | null {
  try {
    if (fs.existsSync(filepath)) return fs.readFileSync(filepath, "utf-8")
  } catch {}
  return null
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*;\s*/g, ";")
    .trim()
}
