import type { TwPluginOptions } from "@tailwind-styled/plugin-api"

import {
  parseTwPluginOptions,
  readToken,
  resolveTokenEngine,
  createPluginRegistry,
  createPluginContext,
  type TwContext,
} from "@tailwind-styled/plugin-api"
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
  subscribeTokens(callback: (tokens: Record<string, string>) => void): () => void
}

// Global plugin registry — shared across all createTwPlugin() calls in same process
let _pluginRegistry = createPluginRegistry()

export function getGlobalPluginRegistry() {
  return _pluginRegistry
}

export function resetGlobalPluginRegistry() {
  _pluginRegistry = createPluginRegistry()
}

export function createTwPlugin(options: TwPluginOptions = {}): TwVitePlugin {
  parseTwPluginOptions(options)

  // Build context using the shared global registry so addVariant/addToken
  // mutations are visible via getGlobalRegistry() in tests
  const ctx = createPluginContext(_pluginRegistry)

  return {
    // ── TwContext methods (plugin API surface) ──────────────────────────
    ...ctx,

    // ── Vite plugin hooks ───────────────────────────────────────────────
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

    // ── Token helpers ───────────────────────────────────────────────────
    getToken(name: string) {
      // Check plugin registry tokens first, then fall through to token engine
      const fromRegistry = _pluginRegistry.tokens.get(name)
      if (fromRegistry !== undefined) return fromRegistry
      const engine = resolveTokenEngine()
      return readToken(engine, name)
    },
    subscribeTokens(callback) {
      const engine = resolveTokenEngine()
      if (!engine) return () => {}
      if (typeof engine.subscribeTokens === "function") return engine.subscribeTokens(callback)
      if (typeof engine.subscribe === "function") return engine.subscribe(callback)
      return () => {}
    },
  }
}