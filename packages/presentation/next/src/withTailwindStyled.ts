import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"

function getDirnameFromUrl(importMetaUrl: string): string {
  if (typeof importMetaUrl !== 'string') return ''
  // Simple URL parsing without Node.js modules
  if (importMetaUrl.startsWith('file://')) {
    let withoutFile = importMetaUrl.slice(7)
    // On Windows, file URLs can be like file:///C:/path
    if (withoutFile[0] === '/' && withoutFile[2] === ':') {
      withoutFile = withoutFile.slice(1)  // Remove leading / from C:/
    }
    const lastSlash = Math.max(withoutFile.lastIndexOf('/'), withoutFile.lastIndexOf('\\'))
    return lastSlash > 0 ? withoutFile.slice(0, lastSlash) : '/'
  }
  // Fallback for other URL types
  const lastSlash = Math.max(importMetaUrl.lastIndexOf('/'), importMetaUrl.lastIndexOf('\\'))
  return lastSlash > 0 ? importMetaUrl.slice(0, lastSlash) : ''
}

import { resolveLoaderPath as sharedResolveLoaderPath } from "@tailwind-styled/shared"
import { scanWorkspace } from "@tailwind-styled/scanner"
import { appendStaticStateCssToSafelist, TW_STATE_STATIC_FILENAME, setGlobalLogFile } from "@tailwind-styled/shared"
import { hasSourceChanged, isIncrementalEnabled } from "./incrementalOrchestrator"

import { parseNextAdapterOptions } from "./schemas"
import { StaticCssWebpackPlugin } from "./staticCssWebpackPlugin"

const require = createRequire(
  typeof import.meta !== "undefined" && import.meta.url
    ? import.meta.url
    : (typeof __filename !== "undefined" ? `file://${__filename}` : "file://unknown")
)

interface TailwindStyledLoaderOptions {
  /** @deprecated — handled by engine internally */
  mode?: "zero-runtime"
  /** @deprecated — handled by engine internally */
  autoClientBoundary?: boolean
  /** @deprecated — handled by engine internally */
  addDataAttr?: boolean
  /** @deprecated — handled by engine internally */
  hoist?: boolean
  /** @deprecated — handled by engine internally */
  routeCss?: boolean
  /** @deprecated — handled by engine internally */
  incremental?: boolean
  verbose?: boolean
  preserveImports?: boolean
  safelistPath?: string
}

export interface TailwindStyledNextOptions {
  /** @deprecated — handled by engine internally */
  mode?: "zero-runtime"
  /** @deprecated — handled by engine internally */
  autoClientBoundary?: boolean
  /** @deprecated — handled by engine internally */
  addDataAttr?: boolean
  /** @deprecated — handled by engine internally */
  hoist?: boolean
  /** @deprecated — handled by engine internally */
  routeCss?: boolean
  /** @deprecated — handled by engine internally */
  incremental?: boolean
  /** Show detailed loader output */
  verbose?: boolean
  /** Path to generated safelist CSS file. Default: <cwd>/__tw_safelist.css */
  safelistPath?: string
  include?: RegExp
  exclude?: RegExp
}

import type { NextConfig } from "next"

// Derive webpack types directly from Next.js — always in sync with installed version
type NextWebpackFn = NonNullable<NextConfig["webpack"]>
type NextWebpackConfig = Parameters<NextWebpackFn>[0]
type NextWebpackOptions = Parameters<NextWebpackFn>[1]

// Derive turbopack rule types from NextConfig
type TurboRules = NonNullable<NonNullable<NextConfig["turbopack"]>["rules"]>
type TurbopackLoaderRule = TurboRules[string]

// Derive webpack module rule type for safe iteration
type ModuleRule = NonNullable<NonNullable<NextWebpackConfig["module"]>["rules"]>[number]
type RuleUseEntry = { loader?: string; options?: unknown }

interface NextWebpackUseEntry {
  loader: string
  options?: TailwindStyledLoaderOptions
}

interface NextWebpackRule {
  test?: RegExp
  exclude?: RegExp
  enforce?: "pre" | "post"
  use?: NextWebpackUseEntry[]
}


const _importMetaUrl = typeof import.meta !== "undefined" && import.meta.url
  ? import.meta.url
  : (typeof __filename !== "undefined" ? `file://${__filename}` : undefined)

const resolveRuntimeDir = (): string => _importMetaUrl ? getDirnameFromUrl(_importMetaUrl) : __dirname

const resolveLoaderPath = (basename: string): string => {
  try {
    return sharedResolveLoaderPath(basename, _importMetaUrl ?? `file://${__filename}`)
  } catch {
    const runtimeDir = resolveRuntimeDir()
    const candidates = [
      path.resolve(runtimeDir, `${basename}.mjs`),
      path.resolve(runtimeDir, `${basename}.js`),
      path.resolve(runtimeDir, `${basename}.cjs`),
    ]

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate
      }
    }

    throw new Error(
      `[tailwind-styled] Loader not found for '${basename}'. Checked: ${candidates.join(", ")}`
    )
  }
}

function checkNextVersion(): void {
  try {
    const pkgPath = require.resolve("next/package.json")
    const { version } = require(pkgPath)
    const major = Number.parseInt(version.split(".")[0], 10)
    if (major < 15) {
      console.warn(
        `[tailwind-styled] Next.js ${version} detected. Recommended: 15+ for full Turbopack support.`
      )
    }
  } catch {
    // next not resolvable — skip check
  }
}

const DEFAULT_INCLUDE = /\.[jt]sx?$/
const DEFAULT_EXCLUDE = /node_modules/

/**
 * Next.js App Router entry-point files yang TIDAK boleh diproses oleh TW loader.
 *
 * Mengapa: file-file ini adalah RSC boundary points yang dikelola Next.js secara khusus.
 * Jika loader menginjeksi TRANSFORM_MARKER atau memodifikasi source-nya—bahkan ketika
 * `changed: false`—Next.js/React Compiler kehilangan sinyal bahwa file adalah pure RSC,
 * sehingga locale injection dari Accept-Language header (Next.js 16+) tidak konsisten
 * antara SSR pass (server: lang="id") dan hydration pass (client: lang="en").
 *
 * File yang dikecualikan: layout, page, loading, error, not-found, template, default
 * semuanya adalah Next.js segment conventions yang tidak boleh disentuh loader pihak ketiga.
 */
const NEXT_RSC_ENTRIES =
  /(?:^|[\\\/])(?:layout|page|loading|error|not-found|template|default)\.[jt]sx?$/

/**
 * Gabungkan user-supplied exclude dengan NEXT_RSC_ENTRIES.
 * Menggunakan non-capturing group agar tidak interferensi dengan capture group lain.
 */
const buildExcludePattern = (userExclude?: RegExp): RegExp => {
  if (!userExclude) return new RegExp(`(?:${DEFAULT_EXCLUDE.source})|(?:${NEXT_RSC_ENTRIES.source})`)
  return new RegExp(`(?:${userExclude.source})|(?:${NEXT_RSC_ENTRIES.source})`)
}

const createLoaderOptions = (options: TailwindStyledNextOptions): Readonly<TailwindStyledLoaderOptions> => {
  // Deprecated options — still passed for loader backward compat but engine ignores them
  const opts: TailwindStyledLoaderOptions = {
    mode: "zero-runtime",              // only supported mode
    autoClientBoundary: true,          // always on (engine handles it)
    preserveImports: true,
  }
  if (options.verbose !== undefined) opts.verbose = options.verbose
  opts.safelistPath = options.safelistPath ?? path.join(process.cwd(), ".next", "tailwind-styled-safelist.css")
  return Object.freeze(opts)
}

const buildTurbopackRules = (
  loaderPath: string,
  loaderOptions: TailwindStyledLoaderOptions
): TurboRules => {
  const extensions = ["js", "jsx", "ts", "tsx", "mjs", "cjs"]
  return Object.fromEntries(
    extensions.map((ext) => [
      `**/*.${ext}`,  // ← recursive glob: match semua subdirectory, bukan hanya root
      { loaders: [{ loader: loaderPath, options: loaderOptions }] },
    ])
  ) as TurboRules
}

const normalizeLoaderPath = (loaderPath: string): string => path.resolve(loaderPath)

const applyWebpackRule = (
  config: NextWebpackConfig,
  options: TailwindStyledNextOptions,
  loaderPath: string
): NextWebpackConfig => {
  const loaderOptions = createLoaderOptions(options)
  const rules = config.module?.rules ?? []
  const normalizedLoaderPath = normalizeLoaderPath(loaderPath)

  const alreadyRegistered = rules.some(
    (rule: ModuleRule) =>
      Array.isArray(rule?.use) &&
      (rule.use as RuleUseEntry[]).some(
        (entry: RuleUseEntry) =>
          typeof entry.loader === "string" &&
          normalizeLoaderPath(entry.loader) === normalizedLoaderPath
      )
  )

  if (alreadyRegistered) return config

  const tailwindStyledRule: NextWebpackRule = {
    test: options.include ?? DEFAULT_INCLUDE,
    exclude: buildExcludePattern(options.exclude),
    enforce: "pre",
    use: [{ loader: loaderPath, options: loaderOptions }],
  }

  // ── Register StaticCssWebpackPlugin ────────────────────────────────────────
  // Plugin ini rebuild _tw-state-static.css di setiap `compiler.hooks.done`.
  // Dengan cara ini, HMR yang menghapus / mengubah state config di file
  // otomatis ter-reflect di output CSS — tidak ada stale rules.
  const safelistPath =
    loaderOptions.safelistPath ?? path.join(process.cwd(), ".next", "tailwind-styled-safelist.css")

  const pluginAlreadyRegistered = (config.plugins ?? []).some(
    (p: { constructor?: { name?: string } } | null | undefined) =>
      p?.constructor?.name === StaticCssWebpackPlugin.PLUGIN_NAME
  )

  const plugins = pluginAlreadyRegistered
    ? (config.plugins ?? [])
    : [...(config.plugins ?? []), new StaticCssWebpackPlugin(safelistPath)]

  config.module = {
    ...(config.module ?? {}),
    rules: [...rules, tailwindStyledRule],
  }

  config.plugins = plugins

  const externalPackages = [
    "tailwind-styled-v4",
    "@tailwind-styled/shared",
    "@tailwind-styled/compiler",
    "@tailwind-styled/engine",
    "@tailwind-styled/plugin",
    "@tailwind-styled/core",
    "@tailwind-styled/runtime-css",
    "@tailwind-styled/runtime",
    "@tailwind-styled/scanner",
    "@tailwind-styled/analyzer",
    "@tailwind-styled/theme",
    "@tailwind-styled/preset",
  ]

  type ExternalsArray = Extract<NonNullable<NextWebpackConfig["externals"]>, readonly unknown[]>
  type ExternalItem = ExternalsArray[number]

  if (!config.externals) {
    config.externals = []
  }

  const ext = config.externals
  if (Array.isArray(ext)) {
    externalPackages.forEach((pkg) => {
      const found = (ext as ExternalItem[]).find((e: ExternalItem) =>
        (typeof e === "string" && e.includes(pkg)) ||
        (typeof e === "object" && e !== null && !Array.isArray(e) &&
          Object.keys(e as object).some((k) => k.includes(pkg)))
      )
      if (!found) {
        (ext as string[]).push(pkg)
      }
    })
  }

  return config
}

const mergeTurbopackRules = (
  existingRules: TurboRules,
  nextRules: TurboRules
): TurboRules => {
  const merged: TurboRules = { ...existingRules }

  for (const [pattern, incomingRule] of Object.entries(nextRules)) {
    const current = merged[pattern]
    if (current == null) {
      merged[pattern] = incomingRule
      continue
    }

    if (typeof current === "object" && current !== null && "loaders" in current) {
      const typedCurrent = current as { loaders?: unknown }
      if (Array.isArray(typedCurrent.loaders)) {
        const incomingLoaders = (incomingRule as { loaders?: unknown[] }).loaders ?? []
        merged[pattern] = {
          ...(current as TurbopackLoaderRule),
          loaders: [...typedCurrent.loaders, ...incomingLoaders],
        } as TurbopackLoaderRule
        console.warn(
          `[tailwind-styled] Turbopack rule '${pattern}' already exists. Appending tailwind-styled loader.`
        )
        continue
      }
    }

    merged[pattern] = incomingRule
    console.warn(
      `[tailwind-styled] Turbopack rule '${pattern}' has incompatible shape. Replacing with tailwind-styled rule.`
    )
  }

  return merged
}

export function withTailwindStyled(options: TailwindStyledNextOptions = {}) {
  checkNextVersion()
  const normalizedOptions = parseNextAdapterOptions(options)
  const webpackLoaderPath = resolveLoaderPath("webpackLoader")
  const turbopackLoaderPath = resolveLoaderPath("turbopackLoader")

return function wrap(nextConfig: NextConfig = {}): NextConfig {
    const previousWebpack = nextConfig.webpack
    const loaderOptions = createLoaderOptions(normalizedOptions)

    // Write _start.txt sentinel so turbopackLoader can detect new dev server starts
    // and clear stale tw-classes/ files from previous sessions.
    // Also perform initial scan of source files to generate safelist immediately —
    // Turbopack custom loaders are unreliable for .tsx files in Next.js 16+.
    try {
      const safelistPath = loaderOptions.safelistPath
      if (safelistPath) {
        const twClassesDir = path.join(path.dirname(safelistPath), "tw-classes")
        fs.mkdirSync(twClassesDir, { recursive: true })
        // Arahkan semua logger output ke file di .next/tw-classes/
        setGlobalLogFile(path.join(twClassesDir, "_tw-build.log"))
        fs.writeFileSync(
          path.join(twClassesDir, "_start.txt"),
          String(Date.now()),
          "utf-8"
        )

        // Selalu timpa _tw-state-static.css dengan placeholder saat startup.
        // PENTING: jangan pakai !fs.existsSync — file stale dari build sebelumnya
        // yang berisi class name mentah (e.g. "w-full") harus segera ditimpa SEBELUM
        // Turbopack sempat membaca dan memproses globals.css.
        // Placeholder berisi komentar CSS yang valid → tidak menyebabkan PostCSS error.
        // File akan ditimpa lagi dengan CSS yang benar oleh async block di bawah.
        const stateStaticPath = path.join(twClassesDir, TW_STATE_STATIC_FILENAME)
        try {
          fs.writeFileSync(
            stateStaticPath,
            "/* tw-state-static.css — placeholder, akan di-generate setelah scan */\n",
            "utf-8"
          )
        } catch { /* non-fatal — jika gagal, tetap lanjut */ }

        // ── Auto-inject @import "_tw-state-static.css" ke globals.css ─────────
        // Kalau globals.css belum import file ini, inject otomatis supaya
        // state + container CSS statis benar-benar di-load oleh browser.
        // Injeksi HANYA terjadi sekali — idempoten, tidak duplicate.
        try {
          const CSS_CANDIDATES = [
            "src/app/globals.css",
            "src/globals.css",
            "src/styles/globals.css",
            "src/tailwind.css",
            "src/index.css",
            "styles/globals.css",
          ]
          // Resolve import path relatif terhadap safelistPath → globals.css
          const safelistDir = path.dirname(safelistPath)

          for (const candidate of CSS_CANDIDATES) {
            const candidatePath = path.join(process.cwd(), candidate)
            if (!fs.existsSync(candidatePath)) continue

            const content = fs.readFileSync(candidatePath, "utf-8")

            // Sudah ada @import untuk _tw-state-static? Skip.
            if (content.includes("_tw-state-static.css")) break

            // Hitung relative path dari globals.css → _tw-state-static.css
            const globalsDir = path.dirname(candidatePath)
            const rel = path.relative(globalsDir, stateStaticPath).replace(/\\/g, "/")
            const importLine = `@import "./${rel}";`

            // Inject SETELAH baris @import "tailwindcss" jika ada, atau di awal file
            const tailwindImportRe = /(@import\s+["']tailwindcss["']\s*;[^\n]*\n?)/
            let updated: string
            if (tailwindImportRe.test(content)) {
              updated = content.replace(
                tailwindImportRe,
                `$1${importLine}\n`
              )
            } else {
              updated = `${importLine}\n${content}`
            }

            fs.writeFileSync(candidatePath, updated, "utf-8")
            if (options.verbose) {
              console.log(
                `[tailwind-styled] Auto-injected "${importLine}" into ${candidate}`
              )
            }
            break
          }
        } catch { /* non-fatal — user bisa tambah manual */ }

        // Pastikan scanner bisa menemukan native binary — set TW_NATIVE_PATH
        // dari runtimeDir withTailwindStyled (tailwind-styled-v4/dist/) sebelum
        // scanWorkspace dipanggil, karena scanner memakai getDirname() sendiri
        // yang mungkin resolve berbeda.
        if (!process.env.TW_NATIVE_PATH) {
          const runtimeDir = resolveRuntimeDir()
          const nativePath = path.resolve(runtimeDir, "..", "native", "tailwind-styled-native.node")
          if (fs.existsSync(nativePath)) {
            process.env.TW_NATIVE_PATH = nativePath
          }
        }

        // Helper: ambil hanya @layer utilities dari full Tailwind CSS output
        // Base, properties, theme sudah ada di globals.css via @import "tailwindcss"
        function extractUtilitiesLayer(fullCss: string): string {
          // Support both minified "@layer utilities{" dan unminified "@layer utilities {"
          const minified = fullCss.indexOf("@layer utilities{")
          const spaced = fullCss.indexOf("@layer utilities {")
          const startIdx = minified !== -1 ? minified
            : spaced !== -1 ? spaced
            : -1

          if (startIdx === -1) return ""

          // Track brace depth untuk cari closing } yang benar
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

        // Initial scan using Rust scanner — walk src/ and extract tw classes
        const srcDir = path.join(process.cwd(), "src")
        if (fs.existsSync(srcDir)) {
          try {
            const result = scanWorkspace(srcDir)
            if (result.uniqueClasses.length > 0) {
              // Filter false positives yang lolos dari scanner (sebelum ast_extract.rs fix di-build)
              // "div:action", "header:topBar" dll — sub-component keys bukan Tailwind class.
              // Fungsi ini dipakai dobel: filter flat uniqueClasses (initial-scan) DAN filter
              // per-file classes (route attribution) — supaya konsisten, false positive yang
              // sama gak nyelip lewat salah satu jalur doang.
              const VALID_VARIANT_PREFIXES = new Set([
                "hover","focus","active","disabled","visited","checked","first","last",
                "odd","even","focus-within","focus-visible","placeholder","before","after",
                "dark","sm","md","lg","xl","2xl","motion-reduce","motion-safe",
                "group","peer","aria","data","supports","not","has","is","where",
                "rtl","ltr","open","print","portrait","landscape",
              ])
              const isValidTwClass = (cls: string): boolean => {
                // Filter variant prefix yang tidak valid
                if (cls.includes(":")) {
                  const prefix = cls.split(":")[0]
                  if (!VALID_VARIANT_PREFIXES.has(prefix ?? "")) return false
                }

                // Filter arbitrary values dengan float precision tinggi — ini computed values
                // dari binary/build artifacts yang ter-scan oleh mistake, bukan class yang
                // ditulis tangan. Float dengan 2+ desimal tidak mungkin ditulis manual.
                // Contoh: top-[205.64px], w-[1075.7px], left-[328.36px]
                // Pattern ini menyebabkan _initial-scan.css membengkak dan sering berubah
                // → Tailwind re-scan lebih sering → dev server lambat + flicker
                if (/\[[\d]+\.[\d]{2,}(?:px|rem|em|vh|vw|%)\]/.test(cls)) return false

                // Filter classes dengan nilai sangat besar (> 9999px) — pasti computed, bukan manual
                if (/\[[\d]{5,}(?:px|rem|em)?\]/.test(cls)) return false

                return true
              }
              const filteredClasses = result.uniqueClasses.filter(isValidTwClass)
              // Baca globals.css user — auto-detect tanpa bergantung tailwind-styled.config.json
              // supaya custom @theme (warna, font, dll) ikut di-generate oleh Tailwind
              let cssEntryContent: string | null = null
              const CSS_CANDIDATES = [
                "src/app/globals.css",
                "src/globals.css",
                "src/styles/globals.css",
                "src/tailwind.css",
                "src/index.css",
                "styles/globals.css",
              ]
              // Prioritas 1: baca dari tailwind-styled.config.json
              try {
                const twConfigPath = path.join(process.cwd(), "tailwind-styled.config.json")
                if (fs.existsSync(twConfigPath)) {
                  const twConfig = JSON.parse(fs.readFileSync(twConfigPath, "utf-8")) as {
                    css?: { entry?: string }
                  }
                  const cssEntry = twConfig.css?.entry
                  if (cssEntry) {
                    const cssEntryPath = path.join(process.cwd(), cssEntry)
                    if (fs.existsSync(cssEntryPath)) {
                      cssEntryContent = fs.readFileSync(cssEntryPath, "utf-8")
                    }
                  }
                }
              } catch { /* ignore */ }
              // Prioritas 2: auto-detect dari kandidat umum
              if (!cssEntryContent) {
                for (const candidate of CSS_CANDIDATES) {
                  const candidatePath = path.join(process.cwd(), candidate)
                  if (fs.existsSync(candidatePath)) {
                    cssEntryContent = fs.readFileSync(candidatePath, "utf-8")
                    break
                  }
                }
              }
              // Strip @source directive dan teks non-CSS dari globals.css
              // sebelum pass ke Tailwind compile()
              if (cssEntryContent) {
                cssEntryContent = cssEntryContent
                  .replace(/@source\s+["'][^"']+["']\s*;?\s*/g, "")
                  .replace(/←[^\n]*/g, "")  // strip inline comments seperti "← ini yang benar"
                  .trim()
              }

              // Helper: atomic write — tulis ke .tmp dulu, baru rename ke path final.
              // Ini mencegah Tailwind scanner membaca file yang sedang ditulis (partial read)
              // yang akan menghasilkan CSS incomplete → FLICKER di browser.
              function atomicWriteFile(filePath: string, content: string): void {
                const tmpPath = `${filePath}.tmp`
                try {
                  fs.writeFileSync(tmpPath, content, "utf-8")
                  fs.renameSync(tmpPath, filePath)
                } catch {
                  try { fs.unlinkSync(tmpPath) } catch { /* ignore */ }
                  fs.writeFileSync(filePath, content, "utf-8")
                }
              }

              // Tulis placeholder SEBELUM generate dimulai agar Tailwind tidak scan
              // file lama yang stale atau mendapat "file not found"
              const initialScanPath = path.join(twClassesDir, "_initial-scan.css")
              if (!fs.existsSync(initialScanPath)) {
                atomicWriteFile(
                  initialScanPath,
                  "/* tw-classes: initial scan — generating... */\n@layer utilities {}\n"
                )
              }

              // Incremental: skip regenerate kalau tidak ada file yang berubah
              const sourceFiles = result.files?.map((f: { file: string }) => f.file) ?? []
              const incremental = isIncrementalEnabled(process.cwd())
              if (incremental && fs.existsSync(initialScanPath) && !hasSourceChanged(sourceFiles)) {
                if (options.verbose) console.log("[tailwind-styled] Incremental: tidak ada perubahan, skip regenerate CSS")
              } else {

              // Generate real CSS via Tailwind JS API + LightningCSS
              // Fire-and-forget — wrap() tidak bisa async (return NextConfig bukan Promise)
              // CSS ditulis sebelum first request karena startup Next.js butuh ~1-2s
              void (async () => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const compiler = await import("@tailwind-styled/compiler") as {
                    generateCssForClasses?: (...args: unknown[]) => unknown
                    buildRouteClassBuckets?: (...args: unknown[]) => unknown
                    routeToCssFilename?: (...args: unknown[]) => unknown
                    [key: string]: unknown
                  }
                  const generateCssForClasses = compiler.generateCssForClasses as (
                    classes: string[],
                    config?: Record<string, unknown>,
                    root?: string,
                    cssEntryContent?: string,
                    minify?: boolean
                  ) => Promise<string>
                  const css = await generateCssForClasses(
                    filteredClasses,
                    {},
                    process.cwd(),
                    cssEntryContent ?? undefined,
                    process.env.NODE_ENV === "production"  // minify hanya di production
                  )
                  if (css) {
                    // Strip @layer base, @layer properties, @layer theme — sudah ada di globals.css
                    // via @import "tailwindcss". Hanya @layer utilities yang diperlukan di sini
                    // supaya tidak ada duplikasi yang merusak layout.
                    const utilitiesOnly = extractUtilitiesLayer(css)
                    atomicWriteFile(
                      initialScanPath,
                      `/* tw-classes: initial scan — auto-generated by withTailwindStyled */\n${utilitiesOnly}`
                    )

                    // ── Static state CSS pre-generation (build-time, no fallback) ──
                    // Wajib berhasil — runtime injection sudah dihapus.
                    // Kalau gagal di sini, build harus berhenti supaya bug tidak tersembunyi.
                    const summary = appendStaticStateCssToSafelist(srcDir, safelistPath, {
                      verbose: options.verbose ?? false,
                      resolvedCss: css,
                    })
                    if (options.verbose) console.log(summary)

                    // ── Route CSS manifest — per-route splitting asli, opsi `routeCss: true` ──
                    //
                    // SENGAJA ditulis di sini (config-eval time, fire-and-forget IIFE yang sama
                    // dengan _initial-scan.css di atas), BUKAN sebagai webpack plugin terpisah
                    // di compiler.hooks.done. Next.js 16 default-nya Turbopack untuk `next dev`
                    // MAUPUN `next build` — fungsi webpack(config, options) di bawah TIDAK PERNAH
                    // dipanggil sama sekali kalau Turbopack aktif (sudah divalidasi empiris,
                    // lihat known-issues.md). Plugin compiler.hooks.done apa pun — termasuk
                    // StaticCssWebpackPlugin yang sudah ada — jadi dead code di kondisi default.
                    // Nulis di sini aman terlepas dari bundler mana yang dipakai.
                    //
                    // SENGAJA pakai `result.files` (hasil scanWorkspace() di atas, classes per
                    // file) + buildRouteClassBuckets() (static import-graph), BUKAN
                    // getAllRegisteredClasses() dari @tailwind-styled/compiler/internal. Registry
                    // itu ke-isi progresif lewat registerFileClasses() yang dipanggil dari
                    // webpackLoader.ts/turbopackLoader.ts SAAT bundler benar-benar meng-compile
                    // tiap file — proses yang baru mulai SETELAH next.config.ts selesai di-eval.
                    // IIFE ini jalan sekali, di awal, SEBELUM bundler menyentuh satu file pun —
                    // baca registry di titik ini akan selalu dapat set kosong.
                    //
                    // buildRouteClassBuckets() bener-bener nge-split: file yang exclusively
                    // ke-reach dari satu route (lewat static import graph dari page.tsx) masuk
                    // bucket route itu; file yang shared 2+ route, layout/loading/error/template,
                    // atau gak ke-reach sama sekali (misal dynamic import non-literal) jatuh ke
                    // "__global" — selalu aman, gak pernah salah atribusi, cuma bisa under-split
                    // di edge case tertentu. Lihat routeGraph.ts utk detail + keterbatasan.
                    if (normalizedOptions.routeCss) {
                      try {
                        const buildRouteClassBuckets = compiler.buildRouteClassBuckets as (
                          root: string,
                          srcDir: string,
                          files: Array<{ file: string; classes: string[] }>
                        ) => { routes: Map<string, Set<string>>; global: Set<string> }
                        const routeToCssFilename = compiler.routeToCssFilename as (route: string) => string
                        if (typeof buildRouteClassBuckets !== "function" || typeof routeToCssFilename !== "function") {
                          throw new Error(
                            "buildRouteClassBuckets/routeToCssFilename tidak tersedia di @tailwind-styled/compiler"
                          )
                        }

                        const filesForGraph = result.files.map((f: { file: string; classes: string[] }) => ({
                          file: f.file,
                          classes: f.classes.filter(isValidTwClass),
                        }))
                        const buckets = buildRouteClassBuckets(process.cwd(), srcDir, filesForGraph)

                        const cssManifestDir = path.join(process.cwd(), ".next", "static", "css", "tw")
                        fs.mkdirSync(cssManifestDir, { recursive: true })
                        const manifestRoutes: Record<string, string> = {}
                        const usedFilenames = new Set<string>(["_global.css"])
                        const minifyManifestCss = process.env.NODE_ENV === "production"

                        if (buckets.global.size > 0) {
                          const globalCss = await generateCssForClasses(
                            Array.from(buckets.global), {}, process.cwd(), cssEntryContent ?? undefined, minifyManifestCss
                          )
                          const globalUtilities = extractUtilitiesLayer(globalCss)
                          if (globalUtilities.trim()) {
                            const filename = "_global.css"
                            atomicWriteFile(path.join(cssManifestDir, filename), globalUtilities)
                            manifestRoutes.__global = filename
                          }
                        }

                        for (const [route, classSet] of buckets.routes) {
                          if (classSet.size === 0) continue
                          const routeCss = await generateCssForClasses(
                            Array.from(classSet), {}, process.cwd(), cssEntryContent ?? undefined, minifyManifestCss
                          )
                          const routeUtilities = extractUtilitiesLayer(routeCss)
                          if (!routeUtilities.trim()) continue
                          // Slugify bisa collision (mis. dynamic "/blog/[slug]" vs literal
                          // "/blog/slug" — keduanya valid route Next.js yang bisa coexist).
                          // Disambiguasi dengan suffix angka supaya gak ada yang ke-overwrite.
                          let filename = routeToCssFilename(route)
                          let suffix = 2
                          while (usedFilenames.has(filename)) {
                            filename = routeToCssFilename(route).replace(/\.css$/, `_${suffix}.css`)
                            suffix++
                          }
                          usedFilenames.add(filename)
                          atomicWriteFile(path.join(cssManifestDir, filename), routeUtilities)
                          manifestRoutes[route] = filename
                        }

                        atomicWriteFile(
                          path.join(cssManifestDir, "css-manifest.json"),
                          JSON.stringify({ routes: manifestRoutes }, null, 2)
                        )

                        if (options.verbose) {
                          console.log(
                            `[tailwind-styled] css-manifest.json ditulis di ${cssManifestDir} — ` +
                            `${buckets.routes.size} route eksklusif + ${manifestRoutes.__global ? "1" : "0"} global bucket.`
                          )
                        }
                      } catch (err) {
                        // Non-fatal — TwCssInjector sudah fallback ke <></> kalau manifest gak
                        // ada/gagal dibaca. Tidak ada alasan untuk gagalkan seluruh build karena
                        // fitur opsional ini gagal nulis.
                        console.warn(
                          "[tailwind-styled] Gagal tulis css-manifest.json:",
                          err instanceof Error ? err.message : err
                        )
                      }
                    }
                  }
                } catch (err) {
                  throw new Error(
                    `[tailwind-styled] generateCssForClasses gagal — build-time CSS generation wajib berhasil.\n${(err as Error).message}`,
                    { cause: err }
                  )
                }
              })()
              } // end else (incremental skip)
            }
          } catch (e) {
            throw new Error(
              `[tailwind-styled] Scanner gagal — Rust native binary tidak tersedia. Build tidak bisa dilanjutkan.\n${(e as Error).message}`,
              { cause: e }
            )
          }
        }
      }
    } catch (err) {
      throw new Error(
        `[tailwind-styled] Build-time CSS generation gagal.\n${(err as Error).message}`,
        { cause: err }
      )
    }

    return {
      ...nextConfig,
      webpack(
        config: NextWebpackConfig,
        webpackOptions: NextWebpackOptions
      ): ReturnType<NextWebpackFn> {
        // ── Dev mode guard ──────────────────────────────────────────────────────
        // Next.js 15+ default: Turbopack bundling client, webpack hanya SSR.
        // Custom loaders Turbopack tidak support .tsx → transform hanya jalan di SSR.
        // Hasil: className static di server, raw proxy di client → hydration mismatch.
        //
        // Fix: skip webpack transform di dev mode sepenuhnya.
        // Proxy runtime handle SSR + client secara seragam → identical output → no mismatch.
        //
        // KOREKSI (sebelumnya komentar ini bilang "Production (next build): webpack handle
        // keduanya → transform aman, optimal" — itu SALAH untuk Next.js 16+). Sudah divalidasi
        // empiris: kalau Turbopack aktif (default Next.js 16 untuk `next build` JUGA, bukan
        // cuma `next dev`), fungsi webpack(config, options) ini TIDAK PERNAH dipanggil sama
        // sekali oleh Next.js — bukan cuma hook done-nya, seluruh body fungsi ini dead code.
        // Konsumer yang gak pasang `--webpack` flag secara eksplisit gak akan pernah kena
        // cabang ini sama sekali di production. Lihat known-issues.md. Implikasi: apa pun yang
        // logic-nya HARUS jalan terlepas dari bundler (CSS generation, manifest, dll) sebaiknya
        // ditaruh di IIFE config-eval-time di atas (lihat blok `void (async () => {...})()`),
        // bukan di sini.
        if (webpackOptions.dev) {
          if (typeof previousWebpack !== "function") return config
          try {
            const r = previousWebpack(config, webpackOptions)
            return r instanceof Promise ? r : r
          } catch { return config }
        }

        const apply = (resolvedConfig: NextWebpackConfig) => {
          const finalConfig = applyWebpackRule(resolvedConfig, normalizedOptions, webpackLoaderPath)
          if (!finalConfig.externals) {
            finalConfig.externals = []
          }
          const externals = finalConfig.externals
          if (Array.isArray(externals)) {
            externals.push({
              "@tailwind-styled/shared": "commonjs2 @tailwind-styled/shared",
              "@tailwind-styled/compiler": "commonjs2 @tailwind-styled/compiler",
              "@tailwind-styled/engine": "commonjs2 @tailwind-styled/engine",
              "@tailwind-styled/plugin": "commonjs2 @tailwind-styled/plugin",
            })
          }
          return finalConfig
        }

        if (typeof previousWebpack !== "function") {
          return apply(config)
        }

        try {
          const result = previousWebpack(config, webpackOptions)
          return result instanceof Promise ? result.then(apply) : apply(result)
        } catch (error) {
          throw new Error("[tailwind-styled] Failed while executing existing Next webpack config.", {
            cause: error,
          })
        }
      },
      // FIX (Bug A — SSR 500 / "Cannot read properties of null (reading
      // 'useState')"): "tailwind-styled-v4" SENGAJA DIKELUARKAN dari list ini.
      //
      // Sebelumnya package utama ini ikut di-externalize bareng subpackage
      // Node-only lainnya. Akibatnya Next.js TIDAK pernah melewatkan resolusi-nya
      // lewat bundler sendiri (webpack/Turbopack) — melainkan lewat raw Node
      // require()/import() yang cuma tahu package.json "exports" conditions,
      // dan SAMA SEKALI tidak mengerti directive "use client". Di package.json
      // root, condition "react-server" dan "node" untuk "." menunjuk ke FILE
      // YANG SAMA (dist/index.mjs) — yang juga berisi implementasi hook asli
      // (createUseTokens / useBrandTokens). Begitu resolusi murni-Node ini
      // terjadi di context yang punya active condition "react-server" (RSC
      // layer-nya Next), import React di dalam file itu ikut ke-resolve ke
      // build "react-server" React sendiri (yang hook-nya sengaja di-null-kan
      // karena Server Component tidak boleh punya hook) → tokens jadi null →
      // "Cannot read properties of null (reading 'useState')".
      //
      // "tailwind-styled-v4" sebenarnya SUDAH didesain untuk dibundle normal:
      // ada dist/index.browser.mjs terpisah (exports["."].browser) yang bebas
      // Node built-ins, dan dist/index.mjs sekarang sudah benar diawali
      // directive "use client" (lihat fix preserveDirectives() di
      // tsup.config.ts). Begitu Next.js memproses file ini lewat bundler-nya
      // sendiri (bukan raw require), "use client" itu dibaca SEBAGAI directive
      // boundary asli — Next generate client reference yang benar untuk
      // Server Component, dan tetap bundle implementasi React-nya yang asli
      // untuk SSR Client Component (yang resolve "react" via condition normal,
      // BUKAN "react-server") — jadi tidak ada lagi collision.
      //
      // Subpackage Node-only lain (shared/compiler/engine/dll) TETAP di
      // externalize — mereka tidak punya varian browser sama sekali dan
      // memang tidak pernah seharusnya masuk ke client bundle.
      serverExternalPackages: [
        ...new Set([
          ...(nextConfig.serverExternalPackages ?? []),
          "@tailwind-styled/core",
          "@tailwind-styled/shared",
          "@tailwind-styled/compiler",
          "@tailwind-styled/engine",
          "@tailwind-styled/analyzer",
          "@tailwind-styled/scanner",
          "@tailwind-styled/plugin",
          "@tailwind-styled/runtime-css",
        ]),
      ],
      turbopack: {
        ...(nextConfig.turbopack ?? {}),
        rules: mergeTurbopackRules(
          (nextConfig.turbopack?.rules ?? {}) as TurboRules,
          buildTurbopackRules(turbopackLoaderPath, loaderOptions)
        ),
      },
    }
  }
}