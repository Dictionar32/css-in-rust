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
import { appendStaticStateCssToSafelist } from "create-tailwind-styled/utils/staticStateExtractor" // FIX: pakai nama package asli

import { parseNextAdapterOptions } from "./schemas"

const require = createRequire(import.meta.url)

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


const resolveRuntimeDir = (): string => getDirnameFromUrl(import.meta.url)

const resolveLoaderPath = (basename: string): string => {
  try {
    return sharedResolveLoaderPath(basename, import.meta.url)
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
    // Selalu kecualikan Next.js RSC entry files (layout, page, dll) bahkan jika
    // user menyuplai exclude pattern sendiri — lihat buildExcludePattern.
    exclude: buildExcludePattern(options.exclude),
    enforce: "pre",
    use: [{ loader: loaderPath, options: loaderOptions }],
  }

  config.module = {
    ...(config.module ?? {}),
    rules: [...rules, tailwindStyledRule],
  }

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
        fs.writeFileSync(
          path.join(twClassesDir, "_start.txt"),
          String(Date.now()),
          "utf-8"
        )

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
              // "div:action", "header:topBar" dll — sub-component keys bukan Tailwind class
              const VALID_VARIANT_PREFIXES = new Set([
                "hover","focus","active","disabled","visited","checked","first","last",
                "odd","even","focus-within","focus-visible","placeholder","before","after",
                "dark","sm","md","lg","xl","2xl","motion-reduce","motion-safe",
                "group","peer","aria","data","supports","not","has","is","where",
                "rtl","ltr","open","print","portrait","landscape",
              ])
              const filteredClasses = result.uniqueClasses.filter((cls: string) => {
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
              })
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

              // Generate real CSS via Tailwind JS API + LightningCSS
              // Fire-and-forget — wrap() tidak bisa async (return NextConfig bukan Promise)
              // CSS ditulis sebelum first request karena startup Next.js butuh ~1-2s
              void (async () => {
                try {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const compiler = await import("@tailwind-styled/compiler") as { generateCssForClasses?: (...args: unknown[]) => unknown; [key: string]: unknown }
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

                    // ── Static state CSS pre-generation (QA: eliminasi runtime injection) ──
                    // Setelah Tailwind CSS di-generate, tambahkan state CSS yang di-extract
                    // secara static dari source files. Ini menghilangkan kebutuhan runtime
                    // batchedInject() untuk states yang defined di tw() config.
                    try {
                      const summary = appendStaticStateCssToSafelist(srcDir, initialScanPath, {
                        verbose: options.verbose ?? false,
                      })
                      if (options.verbose) console.log(summary)
                    } catch (stateErr) {
                      // Non-fatal — stateEngine.ts akan fallback ke runtime injection
                      if (options.verbose) {
                        console.warn(
                          "[tailwind-styled] static state CSS pre-generation skipped:",
                          (stateErr as Error).message?.split("\n")[0]
                        )
                      }
                    }
                  }
                } catch (err) {
                  // Fallback ke empty rules kalau Tailwind JS API tidak tersedia
                  console.warn("[tailwind-styled] generateCssForClasses gagal, fallback ke empty rules:", (err as Error).message?.split("\n")[0])
                  const css = [
                    "/* tw-safelist: initial scan — auto-generated by withTailwindStyled (fallback) */",
                    "@layer utilities {",
                    filteredClasses.map((cls: string) => `.${cls.replace(/([^a-zA-Z0-9_-])/g, "\\$1")} {}`).join("\n"),
                    "}",
                  ].join("\n")
                  atomicWriteFile(initialScanPath, css)
                }
              })()
            }
          } catch (e) {
            // Scanner unavailable on this platform — styles will be generated at build time
            console.warn("[tailwind-styled] Initial scan skipped:", (e as Error).message?.split("\n")[0])
          }
        }
      }
    } catch { /* non-fatal */ }

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
        // Production (next build): webpack handle keduanya → transform aman, optimal.
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
      serverExternalPackages: [
        ...new Set([
          ...(nextConfig.serverExternalPackages ?? []),
          "tailwind-styled-v4",
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