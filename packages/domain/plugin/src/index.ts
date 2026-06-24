import type { TwPluginOptions, TwContext } from "@tailwind-styled/plugin-api"

import { createGlobalPluginContext, parseTwPluginOptions } from "@tailwind-styled/plugin-api"
import type { LoadResult, PartialResolvedId, PluginContext, TransformResult } from "rollup"

// Type-only re-exports — emitted as `export type { }` so Turbopack ESM tracing
// does not try to resolve them as runtime exports from plugin-api.mjs
export type {
  TwClassResult,
  DesignTokens,
  TwPluginOptions,
  VariantResolver,
  UtilityDefinition,
  ComponentConfig,
  TransformMeta,
  TransformFn,
  CssHook,
  TwContext,
  TwPlugin,
  PluginRegistry,
  TokenEngineAPI,
  TransformContext,
  TwGlobalRegistry,
  CompoundCondition,
  TokenMap,
  PluginManifestInput,
  TokenRegistrationInput,
  TwPluginOptionsInput,
} from "@tailwind-styled/plugin-api"

// Runtime value re-exports
export {
  resolveTokenEngine,
  readToken,
  getGlobalRegistry,
  registerTransform,
  registerToken,
  createPluginRegistry,
  resetGlobalRegistry,
  createPluginContext,
  createTw,
  createGlobalPluginContext,
  use,
  presetTokens,
  presetVariants,
  presetScrollbar,
  PluginManifestSchema,
  parsePluginManifest,
  parseTokenRegistration,
  parseTwPluginOptions,
  TokenRegistrationSchema,
  TransformRegistrationSchema,
  TwPluginOptionsSchema,
} from "@tailwind-styled/plugin-api"

export {
  applyHooks,
  getPluginHooks,
  registerPluginHooks,
  type PluginHookContext,
  type PluginHook,
  type PluginHooks,
} from "./hooks"

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