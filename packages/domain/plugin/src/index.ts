import type { TwPluginOptions, TwContext } from "@tailwind-styled/plugin-api"

import { createGlobalPluginContext, parseTwPluginOptions } from "@tailwind-styled/plugin-api"
import type { LoadResult, PartialResolvedId, PluginContext, TransformResult } from "rollup"

export * from "@tailwind-styled/plugin-api"

export interface TwVitePlugin extends TwContext {
  resolveId(
    this: PluginContext,
    source: string,
    importer: string
  ): Promise<PartialResolvedId | null>
  load(this: PluginContext, id: string): Promise<LoadResult | null>
  transform(this: PluginContext, code: string, id: string): Promise<TransformResult | null>
}

export function createTwPlugin(options: TwPluginOptions = {}): TwVitePlugin {
  parseTwPluginOptions(options)

  const ctx = createGlobalPluginContext(options as Record<string, unknown>)

  return {
    ...ctx,
    async resolveId(source, importer) {
      if (!source.startsWith("tw.") && !source.startsWith("tw:")) return null
      const importPath = source.replace(/^tw[.:]/, "")
      const resolved = await this.resolve(importPath, importer, { skipSelf: true })
      if (resolved) return { id: resolved.id }
      return null
    },
    async load(_id) {
      return null
    },
    async transform(_code, _id) {
      return null
    },
  }
}