/**
 * tailwind-styled-v4 — TwCssInjector
 *
 * React Server Component — inject route-specific CSS ke <head>.
 * Zero client JS, no hydration overhead, streaming-friendly.
 *
 * Pipeline:
 *   1. withTailwindStyled (config-eval time, lihat fire-and-forget IIFE di
 *      withTailwindStyled.ts — bukan webpack plugin, supaya jalan terlepas
 *      dari Turbopack/webpack) tulis CSS manifest ke .next/static/css/tw/
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
 * Baca manifest yang ditulis withTailwindStyled (lihat catatan di atas).
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
    warnOnceDev(
      "TwCssInjector dipanggil tapi gak bisa akses 'node:fs'/'node:path' " +
      "(kemungkinan jalan di environment non-Node, misal Edge runtime). " +
      "CSS injection di-skip — komponen tetap render normal, tapi route CSS lo gak ikut inline."
    )
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
    } else {
      warnOnceDev(
        `TwCssInjector aktif tapi manifest gak ketemu di "${manifestPath}". ` +
        `CSS injection di-skip diam-diam — biasanya ini berarti "routeCss: true" ` +
        `belum diset di withTailwindStyled(...) di next.config, atau dev/build server ` +
        `belum sempat generate manifest-nya. Cek konfigurasi sebelum lanjut.`
      )
      return React.createElement(React.Fragment, null)
    }
  } catch (err) {
    warnOnceDev(
      `TwCssInjector gagal parse manifest di "${manifestPath}": ` +
      `${err instanceof Error ? err.message : String(err)}. ` +
      `CSS injection di-skip — manifest mungkin korup atau lagi setengah ditulis saat dibaca.`
    )
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
const warnedKeys = new Set<string>()
function warnOnceDev(message: string): void {
  if (process.env.NODE_ENV === "production") return
  if (warnedKeys.has(message)) return
  warnedKeys.add(message)
  console.warn(`[tailwind-styled-v4] ${message}`)
}

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