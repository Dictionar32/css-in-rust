/**
 * tailwind-styled-v4 - Webpack Loader
 */

import {
  type LoaderOutput,
  runLoaderTransform,
  shouldSkipFile,
} from "@tailwind-styled/compiler/internal"
import path from "node:path"
import { z } from "zod"

interface WebpackLoaderOptions {
  mode?: "zero-runtime"
  autoClientBoundary?: boolean
  addDataAttr?: boolean
  hoist?: boolean
  routeCss?: boolean
  incremental?: boolean
  verbose?: boolean
  preserveImports?: boolean
}

interface WebpackContext {
  resourcePath: string
  getOptions(): WebpackLoaderOptions
  async?(): ((err: Error | null, result?: string) => void) | undefined
  cacheable?(flag?: boolean): void
}

const WebpackLoaderOptionsSchema = z.object({
  mode: z.literal("zero-runtime").optional(),
  autoClientBoundary: z.boolean().optional(),
  addDataAttr: z.boolean().optional(),
  hoist: z.boolean().optional(),
  routeCss: z.boolean().optional(),
  incremental: z.boolean().optional(),
  verbose: z.boolean().optional(),
  preserveImports: z.boolean().optional(),
})

const isNextBuildArtifact = (filepath: string): boolean =>
  filepath.includes(`${path.sep}.next${path.sep}`)

export default function webpackLoader(this: WebpackContext, source: string): void {
  const callback = this.async?.()
  if (!callback) {
    throw new Error("[tailwind-styled] Async loader callback is not available.")
  }

  this.cacheable?.(true)
  const filepath = this.resourcePath

  if (shouldSkipFile(filepath) || isNextBuildArtifact(filepath)) {
    callback(null, source)
    return
  }

  try {
    const options = WebpackLoaderOptionsSchema.parse(this.getOptions())

    const output: LoaderOutput = runLoaderTransform({
      filepath,
      source,
      options: {
        mode: options.mode,
        autoClientBoundary: options.autoClientBoundary ?? true,
        addDataAttr: options.addDataAttr,
        hoist: options.hoist,
        filename: filepath,
        routeCss: options.routeCss,
        incremental: options.incremental,
        verbose: options.verbose,
        preserveImports: options.preserveImports ?? true,
      },
    })

    if (typeof output.code !== "string") {
      throw new TypeError(`[tailwind-styled] Invalid transform output for ${filepath}: code is not a string`)
    }

    if (options.verbose && output.changed) {
      const rsc = (output as any).rsc
      const engine = (output as any).engine ?? "js"
      const env = rsc?.isServer ? "server" : "client"
      const name = path.basename(filepath)
      process.stdout.write(
        `[tailwind-styled/webpack] ${name} -> ${output.classes.length} classes (${env}) [${engine}]\n`
      )
    }

    callback(null, output.code)
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      callback(err instanceof Error ? err : new Error(String(err)))
      return
    }

    console.warn(`[tailwind-styled-v4] Webpack transform failed for ${filepath}:`, err)
    callback(null, source)
  }
}
