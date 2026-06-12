/**
 * watchSystemNative.ts
 *
 * Phase 5.4: Watch System & File Monitoring - Real-time CSS recompilation
 * Exposes 12 watch/monitoring functions for hot-reload and incremental compilation
 */

import { getNativeBridge } from "../nativeBridge"

/**
 * File watch event
 */
export interface WatchEvent {
  event_type: "create" | "modify" | "delete" | "rename"
  file_path: string
  timestamp_ms: number
  is_dir: boolean
}

/**
 * Watch handle for tracking active watchers
 */
export interface WatchHandle {
  handle_id: number
  patterns: string[]
  is_running: boolean
  created_at_ms: number
}

/**
 * Watch statistics
 */
export interface WatchStats {
  active_watchers: number
  total_events: number
  events_this_second: number
  average_latency_ms: number
  largest_batch_size: number
}

/**
 * Start file system watcher for directory
 *
 * @param root_path - Directory to watch
 * @param patterns - Glob patterns to match (e.g., ["*.tsx", "*.ts"])
 * @returns Handle ID for the watcher
 *
 * @example
 * ```ts
 * const handle = startWatch('./src', ['*.tsx', '*.ts'])
 * // Watcher is now active
 * ```
 */
export function startWatch(root_path: string, patterns?: string[]): number {
  const native = getNativeBridge()
  if (!native?.start_watch) throw new Error("start_watch not available")
  return native.start_watch(root_path, patterns)
}

/**
 * Poll for watch events (non-blocking)
 *
 * @param handle - Watcher handle from startWatch()
 * @param timeout_ms - Max time to wait for events (default: 100)
 * @returns Array of watch events
 *
 * @example
 * ```ts
 * const handle = startWatch('./src', ['*.tsx'])
 * const events = pollWatchEvents(handle, 100)
 * events.forEach(evt => {
 *   console.log(`${evt.event_type}: ${evt.file_path}`)
 * })
 * ```
 */
export function pollWatchEvents(handle: number, timeout_ms?: number): WatchEvent[] {
  const native = getNativeBridge()
  if (!native?.poll_watch_events) throw new Error("poll_watch_events not available")
  const result = native.poll_watch_events(handle, timeout_ms)
  try {
    return JSON.parse(result)
  } catch {
    return []
  }
}

/**
 * Stop file system watcher
 *
 * @param handle - Watcher handle
 * @returns Number of events processed before stopping
 *
 * @example
 * ```ts
 * const eventsProcessed = stopWatch(handle)
 * console.log(`Watcher processed ${eventsProcessed} events`)
 * ```
 */
export function stopWatch(handle: number): number {
  const native = getNativeBridge()
  if (!native?.stop_watch) throw new Error("stop_watch not available")
  return native.stop_watch(handle)
}

/**
 * Add pattern to active watcher
 *
 * @param handle - Watcher handle
 * @param pattern - Glob pattern to add (e.g., "*.md")
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * watchAddPattern(handle, '*.md')
 * // Now watching markdown files too
 * ```
 */
export function watchAddPattern(handle: number, pattern: string): string {
  const native = getNativeBridge()
  if (!native?.watch_add_pattern) throw new Error("watch_add_pattern not available")
  return native.watch_add_pattern(handle, pattern)
}

/**
 * Remove pattern from watcher
 *
 * @param handle - Watcher handle
 * @param pattern - Pattern to remove
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * watchRemovePattern(handle, '*.md')
 * ```
 */
export function watchRemovePattern(handle: number, pattern: string): string {
  const native = getNativeBridge()
  if (!native?.watch_remove_pattern) throw new Error("watch_remove_pattern not available")
  return native.watch_remove_pattern(handle, pattern)
}

/**
 * Get all active watcher handles
 *
 * @returns Array of active watch handles
 *
 * @example
 * ```ts
 * const handles = watchGetActiveHandles()
 * console.log(`${handles.length} active watchers`)
 * ```
 */
export function watchGetActiveHandles(): WatchHandle[] {
  const native = getNativeBridge()
  if (!native?.watch_get_active_handles) throw new Error("watch_get_active_handles not available")
  const result = native.watch_get_active_handles()
  try {
    return JSON.parse(result)
  } catch {
    return []
  }
}

/**
 * Clear all active watchers
 *
 * @returns Number of watchers cleared
 *
 * @example
 * ```ts
 * const cleared = watchClearAll()
 * console.log(`Cleared ${cleared} watchers`)
 * ```
 */
export function watchClearAll(): number {
  const native = getNativeBridge()
  if (!native?.watch_clear_all) throw new Error("watch_clear_all not available")
  return native.watch_clear_all()
}

/**
 * Convert watch event type to string
 *
 * @param event_type_code - Event type code (0-3)
 * @returns Event type as string
 *
 * @example
 * ```ts
 * const typeStr = watchEventTypeToString(0)
 * console.log(typeStr)  // "create"
 * ```
 */
export function watchEventTypeToString(event_type_code: number): string {
  const native = getNativeBridge()
  if (!native?.watch_event_type_to_string) throw new Error("watch_event_type_to_string not available")
  return native.watch_event_type_to_string(event_type_code)
}

/**
 * Check if watcher is running
 *
 * @param handle - Watcher handle
 * @returns True if running
 *
 * @example
 * ```ts
 * if (isWatchRunning(handle)) {
 *   console.log("Watcher is active")
 * }
 * ```
 */
export function isWatchRunning(handle: number): boolean {
  const native = getNativeBridge()
  if (!native?.is_watch_running) throw new Error("is_watch_running not available")
  return native.is_watch_running(handle)
}

/**
 * Get watch system statistics
 *
 * @returns Watch statistics
 *
 * @example
 * ```ts
 * const stats = getWatchStats()
 * console.log(`Active: ${stats.active_watchers}, Events: ${stats.total_events}`)
 * ```
 */
export function getWatchStats(): WatchStats {
  const native = getNativeBridge()
  if (!native?.get_watch_stats) throw new Error("get_watch_stats not available")
  const result = native.get_watch_stats()
  try {
    return JSON.parse(result)
  } catch {
    return {
      active_watchers: 0,
      total_events: 0,
      events_this_second: 0,
      average_latency_ms: 0,
      largest_batch_size: 0,
    }
  }
}

/**
 * Pause watching (pause event delivery without stopping watcher)
 *
 * @param handle - Watcher handle
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * watchPause(handle)
 * // Events still detected but not delivered
 * ```
 */
export function watchPause(handle: number): string {
  const native = getNativeBridge()
  if (!native?.watch_pause) throw new Error("watch_pause not available")
  return native.watch_pause(handle)
}

/**
 * Resume watching after pause
 *
 * @param handle - Watcher handle
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * watchResume(handle)
 * // Event delivery resumes
 * ```
 */
export function watchResume(handle: number): string {
  const native = getNativeBridge()
  if (!native?.watch_resume) throw new Error("watch_resume not available")
  return native.watch_resume(handle)
}

/**
 * Scan cache and get optimization recommendations
 *
 * @returns Optimization hints JSON
 *
 * @example
 * ```ts
 * const hints = scanCacheOptimizations()
 * console.log(hints)
 * ```
 */
export function scanCacheOptimizations(): string {
  const native = getNativeBridge()
  if (!native?.scan_cache_optimizations) throw new Error("scan_cache_optimizations not available")
  return native.scan_cache_optimizations()
}

/**
 * Get plugin hook list
 *
 * @returns Available plugin hooks
 *
 * @example
 * ```ts
 * const hooks = getPluginHooks()
 * console.log(hooks)
 * ```
 */
export function getPluginHooks(): string[] {
  const native = getNativeBridge()
  if (!native?.get_plugin_hooks) throw new Error("get_plugin_hooks not available")
  const result = native.get_plugin_hooks()
  try {
    return JSON.parse(result)
  } catch {
    return []
  }
}

/**
 * Register plugin hook handler
 *
 * @param hook_name - Hook name
 * @param handler_id - Handler identifier
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * registerPluginHook('compile:before', 'my-handler-1')
 * ```
 */
export function registerPluginHook(hook_name: string, handler_id: string): string {
  const native = getNativeBridge()
  if (!native?.register_plugin_hook) throw new Error("register_plugin_hook not available")
  return native.register_plugin_hook(hook_name, handler_id)
}

/**
 * Unregister plugin hook handler
 *
 * @param hook_name - Hook name
 * @param handler_id - Handler identifier
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * unregisterPluginHook('compile:before', 'my-handler-1')
 * ```
 */
export function unregisterPluginHook(hook_name: string, handler_id: string): string {
  const native = getNativeBridge()
  if (!native?.unregister_plugin_hook) throw new Error("unregister_plugin_hook not available")
  return native.unregister_plugin_hook(hook_name, handler_id)
}

/**
 * Emit plugin hook event
 *
 * @param hook_name - Hook name
 * @param data_json - Event data as JSON
 * @returns Modified data
 *
 * @example
 * ```ts
 * const result = emitPluginHook('compile:before', JSON.stringify({css: '...'}))
 * ```
 */
export function emitPluginHook(hook_name: string, data_json: string): string {
  const native = getNativeBridge()
  if (!native?.emit_plugin_hook) throw new Error("emit_plugin_hook not available")
  return native.emit_plugin_hook(hook_name, data_json)
}

/**
 * Get compilation performance metrics
 *
 * @returns Performance metrics
 *
 * @example
 * ```ts
 * const metrics = getCompilationMetrics()
 * console.log(metrics)
 * ```
 */
export function getCompilationMetrics(): string {
  const native = getNativeBridge()
  if (!native?.get_compilation_metrics) throw new Error("get_compilation_metrics not available")
  return native.get_compilation_metrics()
}

/**
 * Reset compilation performance counters
 *
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * resetCompilationMetrics()
 * ```
 */
export function resetCompilationMetrics(): string {
  const native = getNativeBridge()
  if (!native?.reset_compilation_metrics) throw new Error("reset_compilation_metrics not available")
  return native.reset_compilation_metrics()
}

/**
 * Validate CSS output for errors
 *
 * @param css - CSS to validate
 * @returns Validation result as JSON
 *
 * @example
 * ```ts
 * const result = validateCssOutput('.test { color: red; }')
 * ```
 */
export function validateCssOutput(css: string): string {
  const native = getNativeBridge()
  if (!native?.validate_css_output) throw new Error("validate_css_output not available")
  return native.validate_css_output(css)
}

/**
 * Get compiler diagnostics
 *
 * @returns Diagnostic information
 *
 * @example
 * ```ts
 * const diagnostics = getCompilerDiagnostics()
 * console.log(diagnostics)
 * ```
 */
export function getCompilerDiagnostics(): string {
  const native = getNativeBridge()
  if (!native?.get_compiler_diagnostics) throw new Error("get_compiler_diagnostics not available")
  return native.get_compiler_diagnostics()
}
