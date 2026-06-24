/**
 * Plugin hooks for tailwind-styled-v4
 * 
 * Hooks allow plugins to intercept and modify the CSS generation pipeline.
 */

export interface PluginHookContext {
  source: string
  filename: string
  extractedConfigs?: unknown[]
  cssOutput?: string
}

export type PluginHook = (ctx: PluginHookContext) => PluginHookContext | Promise<PluginHookContext>

export interface PluginHooks {
  beforeExtract?: PluginHook
  afterExtract?: PluginHook
  beforeGenerate?: PluginHook
  afterGenerate?: PluginHook
}

// Global hook registry
let registeredHooks: PluginHooks = {}

export function registerPluginHooks(hooks: PluginHooks): void {
  registeredHooks = { ...registeredHooks, ...hooks }
}

export function getPluginHooks(): PluginHooks {
  return registeredHooks
}

// Wrapper functions that apply hooks
export async function applyHooks(
  hookName: keyof PluginHooks,
  ctx: PluginHookContext
): Promise<PluginHookContext> {
  const hook = registeredHooks[hookName]
  if (!hook) return ctx
  return hook(ctx)
}