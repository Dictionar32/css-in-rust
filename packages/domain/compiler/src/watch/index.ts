/**
 * Watch Sub-entry Point
 * 
 * Exports file watching and compilation monitoring functionality.
 * - File system watching
 * - Watch event polling and management
 * - Watch statistics
 * - Plugin hooks
 * - Compilation metrics
 */

export {
  startWatch,
  pollWatchEvents,
  stopWatch,
  watchAddPattern,
  watchRemovePattern,
  watchGetActiveHandles,
  watchClearAll,
  watchEventTypeToString,
  isWatchRunning,
  getWatchStats,
  watchPause,
  watchResume,
  scanCacheOptimizations,
  getPluginHooks,
  registerPluginHook,
  unregisterPluginHook,
  emitPluginHook,
  getCompilationMetrics,
  resetCompilationMetrics,
  validateCssOutput,
  getCompilerDiagnostics,
  type WatchEvent,
  type WatchHandle,
  type WatchStats,
} from './watchSystemNative'
