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

import { parseNextAdapterOptions } from "./schemas"
import { getAllRouteClasses, buildStyleTag } from "@tailwind-styled/compiler/internal"

const require = createRequire(import.meta.url)

interface TailwindStyledLoaderOptions {
  mode?: "zero-runtime"
  autoClientBoundary?: boolean
  addDataAttr?: boolean
  hoist?: boolean
  routeCss?: boolean
  incremental?: boolean
  verbose?: boolean
  preserveImports?: boolean
}

export interface TailwindStyledNextOptions
  extends Pick<
    TailwindStyledLoaderOptions,
    "mode" | "autoClientBoundary" | "addDataAttr" | "hoist" | "routeCss" | "incremental" | "verbose"
  > {
  include?: RegExp
  exclude?: RegExp
}

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

interface NextWebpackConfig {
  module?: {
    rules?: NextWebpackRule[]
  }
  [key: string]: unknown
}

interface NextWebpackOptions {
  buildId: string
  dev: boolean
  isServer: boolean
  nextRuntime?: "nodejs" | "edge"
  defaultLoaders: { babel: unknown }
  webpack: unknown
  dir: string
  config: Record<string, unknown>
  totalPages: number
}

interface NextConfigWithTurbopack {
  webpack?:
    | ((
        config: NextWebpackConfig,
        options: NextWebpackOptions
      ) => NextWebpackConfig | Promise<NextWebpackConfig>)
    | null
    | undefined
  turbopack?: Record<string, unknown>
  [key: string]: unknown
}

interface TurbopackLoaderRule {
  loaders: Array<{ loader: string; options: TailwindStyledLoaderOptions }>
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

const createLoaderOptions = (options: TailwindStyledNextOptions): Readonly<TailwindStyledLoaderOptions> => {
  const opts: TailwindStyledLoaderOptions = {
    mode: options.mode ?? "zero-runtime",
    autoClientBoundary: options.autoClientBoundary ?? true,
    preserveImports: true,
  }
  if (options.addDataAttr !== undefined) opts.addDataAttr = options.addDataAttr
  if (options.hoist !== undefined) opts.hoist = options.hoist
  if (options.routeCss !== undefined) opts.routeCss = options.routeCss
  if (options.incremental !== undefined) opts.incremental = options.incremental
  if (options.verbose !== undefined) opts.verbose = options.verbose
  return Object.freeze(opts)
}

const buildTurbopackRules = (
  loaderPath: string,
  loaderOptions: TailwindStyledLoaderOptions
): Record<string, TurbopackLoaderRule> => {
  const extensions = ["js", "jsx", "ts", "tsx", "mjs", "cjs"]
  return Object.fromEntries(
    extensions.map((ext) => [
      `*.${ext}`,
      { loaders: [{ loader: loaderPath, options: loaderOptions }] },
    ])
  ) as Record<string, TurbopackLoaderRule>
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
    (rule) =>
      Array.isArray(rule?.use) &&
      rule.use.some(
        (entry) =>
          typeof entry.loader === "string" &&
          normalizeLoaderPath(entry.loader) === normalizedLoaderPath
      )
  )

  if (alreadyRegistered) return config

  const tailwindStyledRule: NextWebpackRule = {
    test: options.include ?? DEFAULT_INCLUDE,
    exclude: options.exclude ?? DEFAULT_EXCLUDE,
    enforce: "pre",
    use: [{ loader: loaderPath, options: loaderOptions }],
  }

  config.module = {
    ...(config.module ?? {}),
    rules: [...rules, tailwindStyledRule],
  }

  const externalPackages = [
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

  const configAny = config as any

  if (!configAny.externals) {
    configAny.externals = []
  }

const ext = configAny.externals
  if (Array.isArray(ext)) {
    externalPackages.forEach((pkg) => {
      const found = ext.find((e: any) => 
        (typeof e === "string" && e.includes(pkg)) ||
        (typeof e === "object" && e !== null && Object.keys(e).some((k) => k.includes(pkg)))
      )
      if (!found) {
        ext.push(pkg)
      }
    })
  }

  return config
}

const mergeTurbopackRules = (
  existingRules: Record<string, unknown>,
  nextRules: Record<string, TurbopackLoaderRule>
): Record<string, unknown> => {
  const merged = { ...existingRules }

  for (const [pattern, incomingRule] of Object.entries(nextRules)) {
    const current = merged[pattern]
    if (current == null) {
      merged[pattern] = incomingRule
      continue
    }

    if (typeof current === "object" && current !== null && "loaders" in current) {
      const typedCurrent = current as { loaders?: unknown }
      if (Array.isArray(typedCurrent.loaders)) {
        merged[pattern] = {
          ...(current as Record<string, unknown>),
          loaders: [...typedCurrent.loaders, ...incomingRule.loaders],
        }
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

/**
 * Webpack plugin yang emit CSS manifest per-route setelah build selesai.
 * Output ke .next/static/css/tw/ — dibaca oleh TwCssInjector.
 */
/**
 * Plugin untuk dev mode — tulis safelist.css setiap kali webpack selesai compile.
 * Tailwind CSS scanner akan pick up file ini sehingga semua class yang di-extract
 * dari tw`...` template literals ter-include di output CSS.
 *
 * File ditulis ke: <cwd>/.next/tailwind-styled-safelist.css
 * Format: satu class per baris, dibungkus selector dummy agar Tailwind scan-nya
 */
class TwSafelistDevPlugin {
  private readonly outputPath: string
  private lastHash = ""

  constructor(cwd: string) {
    this.outputPath = path.resolve(cwd, ".next", "tailwind-styled-safelist.css")
  }

  apply(compiler: any): void {
    // afterCompile — jalan di setiap HMR cycle, bukan hanya emit
    compiler.hooks.afterCompile.tap("TwSafelistDevPlugin", () => {
      try {
        const routeMap = getAllRouteClasses()
        const allClasses = new Set<string>()
        for (const classes of routeMap.values()) {
          for (const cls of classes) allClasses.add(cls)
        }

        if (allClasses.size === 0) return

        // Hash check — skip write jika tidak ada perubahan
        const sorted = [...allClasses].sort()
        const hash = sorted.join(",")
        if (hash === this.lastHash) return
        this.lastHash = hash

        // Format: dummy selector agar Tailwind CSS v4 scanner mengenali class-nya
        const css = [
          "/* tailwind-styled-v4 safelist — auto-generated, do not edit */",
          "/* @tw-safelist */",
          ".tw-safelist {",
          sorted.map((cls) => `  /* ${cls} */`).join("
"),
          "}",
          // Juga emit sebagai @layer utilities agar v4 langsung generate
          "@layer utilities {",
          sorted.map((cls) => `.${CSS.escape?.(cls) ?? cls} {}`).join("
"),
          "}",
        ].join("
")

        // Pastikan .next/ dir ada
        const dir = path.dirname(this.outputPath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

        fs.writeFileSync(this.outputPath, css, "utf-8")
      } catch {
        // Non-fatal
      }
    })
  }
}

class TwCssManifestPlugin {
  apply(compiler: any): void {
    compiler.hooks.emit.tapAsync("TwCssManifestPlugin", async (compilation: any, callback: () => void) => {
      try {
        const routeMap = getAllRouteClasses()
        if (routeMap.size === 0) {
          callback()
          return
        }

        const manifest: Record<string, string> = {}

        for (const [route, classes] of routeMap.entries()) {
          if (classes.size === 0) continue

          // Compile classes → CSS via Rust
          let css = ""
          try {
            css = buildStyleTag(Array.from(classes))
              .replace(/<style[^>]*>/, "")
              .replace(/<\/style>/, "")
              .trim()
          } catch {
            // Native binding not available — skip
          }

          if (!css) continue

          const filename = route === "/" ? "index.css"
            : route === "__global" ? "_global.css"
            : `${route.replace(/^\//, "").replace(/\//g, "_")}.css`

          const outputPath = `static/css/tw/${filename}`
          compilation.assets[outputPath] = {
            source: () => css,
            size: () => css.length,
          }
          manifest[route] = filename
        }

        // Emit manifest
        const manifestJson = JSON.stringify({ routes: manifest }, null, 2)
        compilation.assets["static/css/tw/css-manifest.json"] = {
          source: () => manifestJson,
          size: () => manifestJson.length,
        }
      } catch {
        // Non-fatal — app still works without route CSS
      }
      callback()
    })
  }
}

export function withTailwindStyled(options: TailwindStyledNextOptions = {}) {
  checkNextVersion()
  const normalizedOptions = parseNextAdapterOptions(options)
  const webpackLoaderPath = resolveLoaderPath("webpackLoader")
  const turbopackLoaderPath = resolveLoaderPath("turbopackLoader")

return function wrap(nextConfig: NextConfigWithTurbopack = {}): NextConfigWithTurbopack {
    const previousWebpack = nextConfig.webpack
    const loaderOptions = createLoaderOptions(normalizedOptions)

    return {
      ...nextConfig,
      webpack(
        config: NextWebpackConfig,
        webpackOptions: NextWebpackOptions
      ): NextConfigWithTurbopack | Promise<NextConfigWithTurbopack> {
        const apply = (resolvedConfig: NextConfigWithTurbopack) => {
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
          // Tambah CSS manifest plugin (build) + safelist dev plugin (dev/HMR)
          if (!(finalConfig as any)._twCssPluginAdded) {
            const plugins = (finalConfig as any).plugins as unknown[] ?? []
            plugins.push(new TwCssManifestPlugin())
            if (webpackOptions.dev) {
              plugins.push(new TwSafelistDevPlugin(webpackOptions.dir))
            }
            ;(finalConfig as any).plugins = plugins
            ;(finalConfig as any)._twCssPluginAdded = true
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
      turbopack: {
        ...(nextConfig.turbopack ?? {}),
        rules: mergeTurbopackRules(
          (nextConfig.turbopack?.rules as Record<string, unknown>) ?? {},
          buildTurbopackRules(turbopackLoaderPath, loaderOptions)
        ),
      },
    }
  }
}