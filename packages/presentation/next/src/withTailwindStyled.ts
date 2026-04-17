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
      ): NextWebpackConfig | Promise<NextWebpackConfig> {
        const apply = (resolvedConfig: NextWebpackConfig) =>
          applyWebpackRule(resolvedConfig, normalizedOptions, webpackLoaderPath)

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
