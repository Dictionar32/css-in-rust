/**
 * @tailwind-styled/plugin-accessibility
 * 
 * Build-time ARIA injection plugin
 * Automatically injects ARIA attributes berdasarkan semantic metadata
 */

export * from './semanticAriaMaps'
export * from './ariaPlugin'
export type { BuildTimePluginContext, BuildTimePlugin, PluginPhase } from '../types/plugin'
