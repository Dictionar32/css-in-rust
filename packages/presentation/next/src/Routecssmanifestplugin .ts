/**
 * RouteCssManifestPlugin
 *
 * FIX — produsen yang dari awal gak pernah ada untuk css-manifest.json.
 *
 * Sebelum fix ini: webpackLoader.ts SUDAH benar memanggil
 * registerFileClasses(filepath, output.classes) per file, tapi fungsi itu
 * adalah no-op stub di @tailwind-styled/compiler (lihat index.ts) — jadi
 * classes yang dikumpulkan jatuh ke lubang hitam. Tidak ada satupun kode,
 * di webpack plugin manapun, yang pernah menulis
 * ".next/static/css/tw/css-manifest.json". Akibatnya TwCssInjector
 * (packages/domain/runtime-css/src/CssInjector.tsx) SELALU warn "manifest
 * gak ketemu" dan return <></> — walau "routeCss: true" sudah diset di
 * withTailwindStyled(...).
 *
 * Plugin ini menutup lubang itu: di compiler.hooks.done (sekali per build —
 * lihat dev-mode guard di withTailwindStyled.ts, plugin ini cuma pernah
 * didaftarkan utk production `next build`, bukan `next dev`/Turbopack),
 * baca semua classes yang ke-register lewat getAllRegisteredClasses(),
 * compile jadi CSS asli via generateCssForClasses() (Tailwind JS API yang
 * sama dipakai initial-scan safelist), lalu tulis:
 *   - {outDir}/_global.css         → CSS hasil compile
 *   - {outDir}/css-manifest.json   → { routes: { __global: "_global.css" } }
 *
 * KETERBATASAN YANG DISENGAJA (belum diselesaikan di fix ini):
 * Semua classes dibundle jadi SATU bucket "__global" — belum ada per-route
 * code splitting yang sesungguhnya (classes eksklusif per halaman). Itu
 * butuh import-graph tracing (file mana di-import oleh page mana, secara
 * transitif) yang belum ada di compiler ini sama sekali. Ada native
 * `analyze_route_class_distribution` (dipakai CLI `tw split`) yang
 * MENDEKATI ini, tapi itu jalur terpisah yang juga belum tersambung ke
 * build Next.js dan punya shape manifest yang berbeda. Menyambung itu
 * adalah kerja terpisah yang lebih besar daripada bug "manifest gak pernah
 * ada" yang di-fix di sini.
 */

import fs from "node:fs"
import path from "node:path"

interface WebpackCompiler {
  hooks: {
    done: {
      tap(pluginName: string, callback: () => void): void
    }
  }
}

export interface RouteCssManifestPluginOptions {
  /** Output dir — default-nya HARUS sama dengan yang dibaca CssInjector.tsx: .next/static/css/tw */
  outDir: string
  /** Root project — dipakai untuk auto-detect globals.css (sama heuristik dengan initial-scan) */
  root: string
  verbose?: boolean
}

const CSS_CANDIDATES = [
  "src/app/globals.css",
  "src/globals.css",
  "src/styles/globals.css",
  "src/tailwind.css",
  "src/index.css",
  "styles/globals.css",
]

function findGlobalsCssContent(root: string): string | undefined {
  for (const candidate of CSS_CANDIDATES) {
    const candidatePath = path.join(root, candidate)
    if (fs.existsSync(candidatePath)) {
      return fs.readFileSync(candidatePath, "utf-8")
        .replace(/@source\s+["'][^"']+["']\s*;?\s*/g, "")
        .trim()
    }
  }
  return undefined
}

/**
 * Duplikasi sengaja dari extractUtilitiesLayer() lokal di withTailwindStyled.ts.
 * Base/properties/theme Tailwind sudah masuk lewat @import "tailwindcss" di
 * globals.css normal Next.js — kalau ikut di-inline lagi di sini, bisa
 * duplikasi/konflik @layer ordering di <head>. Hanya @layer utilities yang
 * perlu di-inject TwCssInjector.
 */
function extractUtilitiesLayer(fullCss: string): string {
  const minified = fullCss.indexOf("@layer utilities{")
  const spaced = fullCss.indexOf("@layer utilities {")
  const startIdx = minified !== -1 ? minified : spaced !== -1 ? spaced : -1
  if (startIdx === -1) return ""

  let depth = 0
  let endIdx = startIdx
  for (let i = startIdx; i < fullCss.length; i++) {
    if (fullCss[i] === "{") depth++
    else if (fullCss[i] === "}") {
      depth--
      if (depth === 0) { endIdx = i; break }
    }
  }
  return fullCss.slice(startIdx, endIdx + 1)
}

export class RouteCssManifestPlugin {
  static readonly PLUGIN_NAME = "TailwindStyledRouteCssManifest"

  private readonly options: RouteCssManifestPluginOptions

  constructor(options: RouteCssManifestPluginOptions) {
    this.options = options
  }

  apply(compiler: WebpackCompiler): void {
    compiler.hooks.done.tap(RouteCssManifestPlugin.PLUGIN_NAME, () => {
      void this.flush()
    })
  }

  private async flush(): Promise<void> {
    const { verbose, outDir, root } = this.options

    try {
      const { getAllRegisteredClasses, generateCssForClasses } =
        await import("@tailwind-styled/compiler/internal")

      const classes = Array.from(getAllRegisteredClasses())
      if (classes.length === 0) {
        if (verbose) {
          console.log(
            "[tailwind-styled] RouteCssManifestPlugin: tidak ada classes ke-register, skip manifest."
          )
        }
        return
      }

      const cssEntryContent = findGlobalsCssContent(root)
      const fullCss = await generateCssForClasses(
        classes,
        {},
        root,
        cssEntryContent,
        true // minify — manifest ini di-inline langsung ke <head>, selalu minify
      )
      const utilitiesOnly = extractUtilitiesLayer(fullCss) || fullCss
      if (!utilitiesOnly.trim()) return

      fs.mkdirSync(outDir, { recursive: true })

      const GLOBAL_CSS_FILENAME = "_global.css"
      fs.writeFileSync(path.join(outDir, GLOBAL_CSS_FILENAME), utilitiesOnly, "utf-8")

      const manifest = { routes: { __global: GLOBAL_CSS_FILENAME } }
      fs.writeFileSync(
        path.join(outDir, "css-manifest.json"),
        JSON.stringify(manifest, null, 2),
        "utf-8"
      )

      if (verbose) {
        console.log(
          `[tailwind-styled] css-manifest.json written — ${classes.length} classes ` +
          `(__global bucket only; per-route splitting belum diimplementasi).`
        )
      }
    } catch (err) {
      // Non-fatal — kalau manifest gagal ditulis, TwCssInjector tetap fallback
      // ke <></> seperti sebelumnya. Tidak ada alasan untuk gagalkan seluruh build.
      console.warn(
        "[tailwind-styled] RouteCssManifestPlugin gagal generate css-manifest.json:",
        err instanceof Error ? err.message : err
      )
    }
  }
}