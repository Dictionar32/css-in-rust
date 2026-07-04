/**
 * Build-Time Plugin System Types
 */
/**
 * Plugin execution phase
 */
export type PluginPhase = 'preComponent' | 'postComponent';
/**
 * Build-time plugin context
 */
export interface BuildTimePluginContext {
    phase: PluginPhase;
    component: {
        name: string;
        tag: string;
        config: Record<string, unknown>;
        metadata: Record<string, unknown>;
    };
    codeGen: {
        computedProps: Record<string, unknown>;
        injectedAttributes: Record<string, unknown>;
        typeAnnotations: Record<string, unknown>;
    };
}
/**
 * Build-time plugin hook
 */
export interface BuildTimePluginHook {
    name: PluginPhase;
    handler: (ctx: BuildTimePluginContext) => void | Promise<void>;
    priority?: number;
}
/**
 * Build-time plugin definition
 */
export interface BuildTimePlugin {
    name: string;
    phase: PluginPhase;
    priority?: number;
    execute: (ctx: BuildTimePluginContext) => void | Promise<void>;
}
