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
): TurboRules => {
  const extensions = ["js", "jsx", "ts", "tsx", "mjs", "cjs"]
  return Object.fromEntries(
    extensions.map((ext) => [
      `*.${ext}`,
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

    return {
      ...nextConfig,
      webpack(
        config: NextWebpackConfig,
        webpackOptions: NextWebpackOptions
      ): ReturnType<NextWebpackFn> {
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