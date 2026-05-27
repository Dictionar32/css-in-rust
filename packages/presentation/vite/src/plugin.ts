/**
 * tailwind-styled-v4 - Vite Plugin v5
 *
 * Usage in vite.config.ts:
 *   import { tailwindStyledPlugin } from "@tailwind-styled/vite"
 *   export default defineConfig({
 *     plugins: [react(), tailwindStyledPlugin()]
 *   })
 *
 * v5 Changes:
 * - Simplified API (removed deprecated options)
 * - Uses @tailwind-styled/engine for build orchestration
 * - Mode always zero-runtime
 */

import fs from "node:fs"
import path from "node:path"

import { runLoaderTransform } from "@tailwind-styled/compiler"
import { createEngine } from "@tailwind-styled/engine"
import type { HmrContext, Plugin, ResolvedConfig } from "vite"

import { parseVitePluginOptions } from "./schemas"

export interface VitePluginOptions {
  include?: RegExp
  exclude?: RegExp
  scanDirs?: string[]
  safelistOutput?: string
  generateSafelist?: boolean
  scanReportOutput?: string
  useEngineBuild?: boolean
  analyze?: boolean
  strict?: boolean
  mode?: "zero-runtime" | "runtime"
  routeCss?: boolean
  deadStyleElimination?: boolean
  addDataAttr?: boolean
  autoClientBoundary?: boolean
  hoist?: boolean
  incremental?: boolean
}

interface ViteLoaderOptions extends Record<string, unknown> {
  mode?: "zero-runtime"
  addDataAttr?: boolean
  filename?: string
  preserveImports?: boolean
}

interface ViteLoaderOutput {
  code: string
  changed: boolean
  classes: string[]
  staticCss?: string
}

interface ScanWorkspaceResult {
  files: Array<{ file: string; classes: string[] }>
  totalFiles: number
  uniqueClasses: string[]
}

type ViteTransformRunner = (ctx: {
  filepath: string
  source: string
  options: ViteLoaderOptions
  isDev?: boolean
}) => ViteLoaderOutput

type ViteEngineFacade = {
  scanWorkspace(): Promise<ScanWorkspaceResult>
  build(): Promise<unknown>
}

type ViteEngineFactory = (options: {
  root?: string
  compileCss?: boolean
  analyze?: boolean
  scanner?: {
    includeExtensions?: string[]
  }
}) => Promise<ViteEngineFacade>

type InternalVitePluginOptions = VitePluginOptions & {
  __internalTransformRunner?: ViteTransformRunner
  __internalCreateEngine?: ViteEngineFactory
}

const SCAN_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"]

function warnDeprecated(options: VitePluginOptions, key: keyof VitePluginOptions, message: string) {
  if (options[key] !== undefined) {
    console.warn(`[tailwind-styled-v4] Warning: '${key}' is deprecated in v5. ${message}`)
  }
}

function isInsideDirectory(filePath: string, directory: string): boolean {
  const relative = path.relative(directory, filePath)
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative))
}

function filterScanToDirs(
  scan: ScanWorkspaceResult,
  root: string,
  scanDirs: string[]
): ScanWorkspaceResult {
  const resolvedDirs = scanDirs.map((dir) => path.resolve(root, dir))
  if (resolvedDirs.length === 0) return scan

  const files = scan.files.filter((file) => {
    const absoluteFile = path.resolve(file.file)
    return resolvedDirs.some((directory) => isInsideDirectory(absoluteFile, directory))
  })

  const uniqueClasses = Array.from(new Set(files.flatMap((file) => file.classes))).sort()

  return {
    files,
    totalFiles: files.length,
    uniqueClasses,
  }
}

function writeJsonArtifact(root: string, relativePath: string, value: unknown): void {
  const outputPath = path.resolve(root, relativePath)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, `${JSON.stringify(value, null, 2)}\n`)
}

export function tailwindStyledPlugin(opts: VitePluginOptions = {}): Plugin {
  const rawOptions = opts as InternalVitePluginOptions
  const parsedOptions = parseVitePluginOptions(rawOptions)

  warnDeprecated(parsedOptions, "mode", "Only zero-runtime is supported.")
  warnDeprecated(parsedOptions, "routeCss", "Use engine's analyzing capabilities.")
  warnDeprecated(parsedOptions, "deadStyleElimination", "Use 'analyze: true' option instead.")
  warnDeprecated(parsedOptions, "addDataAttr", "Handled by engine internally.")
  warnDeprecated(parsedOptions, "autoClientBoundary", "Handled by engine internally.")
  warnDeprecated(parsedOptions, "hoist", "Handled by engine internally.")
  warnDeprecated(parsedOptions, "incremental", "Handled by engine internally.")

  const {
    include = /\.(tsx|ts|jsx|js)$/,
    exclude = /node_modules/,
    scanDirs = ["src"],
    safelistOutput = ".tailwind-styled-safelist.json",
    scanReportOutput = ".tailwind-styled-scan-report.json",
    generateSafelist: doSafelist = true,
    useEngineBuild = true,
    analyze = false,
    strict = false,
  } = parsedOptions

  const transformRunner = rawOptions.__internalTransformRunner ?? runLoaderTransform
  const engineFactory = rawOptions.__internalCreateEngine ?? createEngine
  const pluginState = { root: process.cwd(), isDev: true }

  /**
   * staticCssPerFile — Map<filepath, cssString>
   *
   * Dikumpulkan dari setiap `transform()` call. Key adalah filepath sehingga
   * HMR re-transform menimpa entry lama (tidak duplicate).
   * Di `buildEnd`, semua CSS digabung, di-deduplicate per-rule, dan ditulis ke
   * `_tw-state-static.css` di sebelah safelist output.
   */
  const staticCssPerFile = new Map<string, string>()

  /** Deduplicate CSS rules (split by `}`, trim, filter unique) */
  function deduplicateStaticCss(css: string): string {
    const seen = new Set<string>()
    const rules: string[] = []
    // Split on rule boundaries — setiap rule diakhiri `}`
    for (const chunk of css.split(/(?<=\})\s*/)) {
      const rule = chunk.trim()
      if (rule && !seen.has(rule)) {
        seen.add(rule)
        rules.push(rule)
      }
    }
    return rules.join("\n")
  }

  /** Path output untuk static state+container CSS */
  function getStaticCssOutputPath(root: string, safelistOutputPath: string): string {
    return path.resolve(root, path.dirname(safelistOutputPath), "_tw-state-static.css")
  }

  /** Tulis accumulated staticCss ke file output (atomic overwrite) */
  function flushStaticCss(root: string): void {
    if (staticCssPerFile.size === 0) return
    const combined = Array.from(staticCssPerFile.values()).join("\n")
    const deduped = deduplicateStaticCss(combined)
    if (!deduped.trim()) return
    const outPath = getStaticCssOutputPath(root, safelistOutput)
    try {
      fs.mkdirSync(path.dirname(outPath), { recursive: true })
      fs.writeFileSync(
        outPath,
        `/* _tw-state-static.css — Auto-generated by tailwind-styled-v4. DO NOT EDIT.\n` +
        ` * Import this in globals.css: @import "./_tw-state-static.css";\n` +
        ` * Contains: state CSS (.tw-s-*[data-*="true"]) + container queries (@container .tw-cq-*).\n` +
        ` */\n\n${deduped}\n`
      )
    } catch (e) {
      console.warn("[tailwind-styled-v4] Could not write _tw-state-static.css:", e)
    }
  }

  return {
    name: "tailwind-styled-v4",
    enforce: "pre" as const,

    configResolved(config: ResolvedConfig) {
      pluginState.root = config.root
      pluginState.isDev = config.command === "serve"

      // ── Auto-inject @import "_tw-state-static.css" ke CSS entry ──────────
      // Cari CSS entry (src/index.css, src/main.css, src/App.css, dll)
      // dan inject @import kalau belum ada. Idempoten — tidak duplicate.
      try {
        const outPath = getStaticCssOutputPath(config.root, safelistOutput)
        const CSS_CANDIDATES = [
          "src/index.css",
          "src/main.css",
          "src/App.css",
          "src/styles/index.css",
          "src/styles/main.css",
          "src/globals.css",
          "src/style.css",
        ]
        for (const candidate of CSS_CANDIDATES) {
          const candidatePath = path.resolve(config.root, candidate)
          if (!fs.existsSync(candidatePath)) continue

          const content = fs.readFileSync(candidatePath, "utf-8")
          if (content.includes("_tw-state-static.css")) break

          const rel = path.relative(path.dirname(candidatePath), outPath).replace(/\\/g, "/")
          const importLine = `@import "./${rel}";`

          // Inject setelah @import "tailwindcss" jika ada, atau di awal
          const tailwindImportRe = /(@import\s+["']tailwindcss["']\s*;[^\n]*\n?)/
          const updated = tailwindImportRe.test(content)
            ? content.replace(tailwindImportRe, `$1${importLine}\n`)
            : `${importLine}\n${content}`

          fs.writeFileSync(candidatePath, updated, "utf-8")
          break
        }
      } catch { /* non-fatal */ }
    },

    transform(source: string, id: string) {
      const filepath = id.split("?")[0]
      if (!include.test(filepath)) return null
      if (exclude.test(filepath)) return null

      const loaderOptions: ViteLoaderOptions = {
        mode: "zero-runtime",
        addDataAttr: pluginState.isDev,
        filename: filepath,
        preserveImports: true,
      }

      let output: ViteLoaderOutput
      try {
        output = transformRunner({
          filepath,
          source,
          options: loaderOptions,
          isDev: pluginState.isDev,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(`[tailwind-styled-v4] Transform skipped for ${filepath}: ${message}`)
        return null
      }

      if (!output.changed) return null

      // ── Collect static CSS (state + container) ──────────────────────────────
      // Key = filepath supaya HMR re-transform menimpa entry lama (tidak duplicate).
      if (output.staticCss) {
        staticCssPerFile.set(filepath, output.staticCss)
        // Dev mode: tulis langsung agar Vite HMR tidak perlu restart
        if (pluginState.isDev) {
          flushStaticCss(pluginState.root)
        }
      }

      return { code: output.code, map: null }
    },

    async buildEnd() {
      if (pluginState.isDev) return

      const engine = await engineFactory({
        root: pluginState.root,
        compileCss: true,
        analyze,
        scanner: {
          includeExtensions: SCAN_EXTENSIONS,
        },
      })

      try {
        const scan = filterScanToDirs(await engine.scanWorkspace(), pluginState.root, scanDirs)

        if (doSafelist) {
          writeJsonArtifact(pluginState.root, safelistOutput, scan.uniqueClasses)
        }

        // ── Flush accumulated static CSS (state + container) ──────────────────
        // Di production build, tulis SETELAH semua files di-transform
        // supaya file berisi CSS dari seluruh codebase, bukan partial.
        flushStaticCss(pluginState.root)
        console.log(
          `[tailwind-styled-v4] Static CSS: ${staticCssPerFile.size} files → _tw-state-static.css`
        )

        writeJsonArtifact(pluginState.root, scanReportOutput, {
          root: pluginState.root,
          totalFiles: scan.totalFiles,
          uniqueClassCount: scan.uniqueClasses.length,
        })
      } catch (error) {
        console.warn("[tailwind-styled-v4] Engine scan phase failed:", error)
      }

      if (!useEngineBuild) return

      try {
        await engine.build()
        console.log("[tailwind-styled-v4] Engine build complete")
      } catch (error) {
        const msg = `[tailwind-styled-v4] Engine build step failed: ${error}`
        if (strict) {
          throw new Error(msg)
        }
        console.warn(msg)
      }
    },

    handleHotUpdate({ file, server }: HmrContext) {
      if (include.test(file) && !exclude.test(file)) {
        server.ws.send({ type: "full-reload" })
      }
    },
  }
}

export default tailwindStyledPlugin
