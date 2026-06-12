/**
 * Watch System Type Definitions
 * 
 * Comprehensive type definitions for file system monitoring and auto-recompile.
 * Supports: file watching, pattern matching, debouncing, plugin hooks, and statistics.
 * 
 * Requirement 2: Watch System for Auto-Recompile
 * 20 Rust functions exposed via NativeBridge
 */

// =============================================================================
// WATCH CONFIGURATION & LIFECYCLE
// =============================================================================

export interface WatchConfig {
  readonly rootPath: string
  readonly patterns?: string[]        // default: ['**/*.tsx', '**/*.ts', 'tailwind.config.js']
  readonly debounceMs?: number        // default: 100ms
  readonly gitignoreAware?: boolean   // default: true - respect .gitignore
  readonly ignoreDotfiles?: boolean   // default: true - ignore .* files
  readonly followSymlinks?: boolean   // default: false
  readonly depth?: number             // optional max directory depth
}

export interface WatchHandle {
  readonly __brand: 'WatchHandle'
  readonly id: number
}

// =============================================================================
// FILE WATCH EVENTS
// =============================================================================

export type WatchEventType = 'Modified' | 'Created' | 'Deleted' | 'Renamed'

export interface WatchEvent {
  readonly file_path: string
  readonly event_type: WatchEventType
  readonly timestamp_ms: number
  readonly file_size_bytes?: number
  readonly previous_path?: string  // For renamed events
}

export interface WatchEventBatch {
  readonly events: WatchEvent[]
  readonly batch_timestamp_ms: number
  readonly total_events: number
  readonly debounced_count: number
}

// =============================================================================
// WATCH PATTERNS & MANAGEMENT
// =============================================================================

export interface PatternAddResult {
  readonly success: boolean
  readonly pattern: string
  readonly matched_files: number
}

export interface PatternRemoveResult {
  readonly success: boolean
  readonly pattern: string
  readonly unmatched_files: number
}

export interface PatternInfo {
  readonly pattern: string
  readonly matched_files: number
  readonly active: boolean
  readonly added_at: number
}

export interface ActivePattern {
  readonly pattern: string
  readonly file_count: number
  readonly last_match: number
}

// =============================================================================
// WATCH CONTROL & STATE
// =============================================================================

export interface WatchControlResult {
  readonly success: boolean
  readonly handle: WatchHandle
  readonly message?: string
}

export interface WatchStateInfo {
  readonly handle: WatchHandle
  readonly is_running: boolean
  readonly is_paused: boolean
  readonly patterns: ActivePattern[]
  readonly uptime_ms: number
}

// =============================================================================
// WATCH STATISTICS
// =============================================================================

export interface WatchStats {
  readonly active_handles: number
  readonly total_files_watched: number
  readonly events_processed: number
  readonly average_latency_ms: number
  readonly uptime_seconds: number
  readonly total_events_all_time: number
  readonly debounced_events_all_time: number
  readonly current_memory_kb: number
  readonly max_memory_kb: number
}

export interface PerHandleStats {
  readonly handle: WatchHandle
  readonly files_watched: number
  readonly events_processed: number
  readonly average_latency_ms: number
  readonly uptime_seconds: number
  readonly patterns_active: number
  readonly is_paused: boolean
}

export interface EventMetrics {
  readonly created_count: number
  readonly modified_count: number
  readonly deleted_count: number
  readonly renamed_count: number
  readonly total_count: number
  readonly avg_time_between_events_ms: number
  readonly peak_events_per_second: number
}

// =============================================================================
// PLUGIN HOOKS
// =============================================================================

export type PluginHookName = 'on_file_changed' | 'before_recompile' | 'after_compile'

export interface FileChangeHookData {
  readonly file_path: string
  readonly event_type: WatchEventType
  readonly file_size_bytes: number
  readonly classes_found: string[]
  readonly timestamp_ms: number
  readonly debounced_events: number
}

export interface BeforeRecompileHookData {
  readonly files_changed: string[]
  readonly total_files_to_process: number
  readonly debounced_events: number
  readonly estimated_duration_ms: number
}

export interface AfterCompileHookData {
  readonly success: boolean
  readonly css_size_bytes: number
  readonly compilation_time_ms: number
  readonly errors?: string[]
  readonly warnings?: string[]
  readonly changed_files: number
  readonly generated_classes: number
}

export type PluginHookData = 
  | FileChangeHookData 
  | BeforeRecompileHookData 
  | AfterCompileHookData

export interface PluginHookHandler {
  readonly id: string
  readonly hook_name: PluginHookName
  readonly priority?: number  // 0-100, higher = earlier execution
  readonly async: boolean
}

export interface PluginHookRegistration {
  readonly hook_name: PluginHookName
  readonly handler_id: string
  readonly registered_at: number
}

export interface PluginHookEmitResult {
  readonly hook_name: PluginHookName
  readonly handlers_executed: number
  readonly handlers_failed: number
  readonly total_duration_ms: number
  readonly handler_results: Array<{
    readonly handler_id: string
    readonly success: boolean
    readonly duration_ms: number
    readonly error?: string
  }>
}

export interface PluginHooksInfo {
  readonly total_hooks: number
  readonly by_hook_name: Record<PluginHookName, number>
  readonly registered: PluginHookRegistration[]
}

// =============================================================================
// EVENT DEBOUNCING
// =============================================================================

export interface DebouncerConfig {
  readonly debounce_ms: number
  readonly max_wait_ms?: number  // Maximum wait even with continuous events
  readonly leading?: boolean     // Emit immediately on first event
  readonly trailing?: boolean    // Emit after debounce delay (default: true)
}

export interface DebounceState {
  readonly pending_count: number
  readonly last_event_timestamp: number
  readonly next_emit_timestamp?: number
}

// =============================================================================
// WATCH ERROR HANDLING
// =============================================================================

export enum WatchErrorType {
  InvalidPattern = 'InvalidPattern',
  PermissionDenied = 'PermissionDenied',
  TooManyWatches = 'TooManyWatches',
  InternalError = 'InternalError',
  HandleNotFound = 'HandleNotFound',
}

export interface WatchError {
  readonly type: WatchErrorType
  readonly message: string
  readonly handle?: WatchHandle
  readonly file_path?: string
  readonly recoverable: boolean
}

// =============================================================================
// WATCH PERFORMANCE TRACKING
// =============================================================================

export interface LatencyHistogram {
  readonly p50_ms: number
  readonly p75_ms: number
  readonly p90_ms: number
  readonly p95_ms: number
  readonly p99_ms: number
  readonly max_ms: number
  readonly min_ms: number
  readonly avg_ms: number
}

export interface PerformanceProfile {
  readonly handle: WatchHandle
  readonly detection_latency: LatencyHistogram
  readonly event_processing_latency: LatencyHistogram
  readonly total_events: number
  readonly uptime_seconds: number
}

// =============================================================================
// WATCH MANAGER INTERFACE
// =============================================================================

export interface WatchManager {
  // Watch Lifecycle
  startWatch(config: WatchConfig): Promise<WatchHandle>
  stopWatch(handle: WatchHandle): Promise<void>
  pauseWatch(handle: WatchHandle): Promise<void>
  resumeWatch(handle: WatchHandle): Promise<void>
  isWatchRunning(handle: WatchHandle): Promise<boolean>
  
  // Pattern Management
  addPattern(handle: WatchHandle, pattern: string): Promise<PatternAddResult>
  removePattern(handle: WatchHandle, pattern: string): Promise<PatternRemoveResult>
  getPatterns(handle: WatchHandle): Promise<ActivePattern[]>
  
  // Event Polling
  pollWatchEvents(handle: WatchHandle, timeoutMs?: number): Promise<WatchEventBatch>
  
  // Watch Metadata
  getWatchStats(): Promise<WatchStats>
  getPerHandleStats(handle: WatchHandle): Promise<PerHandleStats>
  getWatchState(handle: WatchHandle): Promise<WatchStateInfo>
  getActiveHandles(): Promise<WatchHandle[]>
  
  // Cleanup
  stopAllWatches(): Promise<number>  // Returns count of stopped handles
  clearAllWatches(): Promise<void>
  
  // Plugin Hooks
  registerPluginHook(
    hookName: PluginHookName,
    handlerId: string,
    priority?: number
  ): Promise<void>
  
  unregisterPluginHook(hookName: PluginHookName, handlerId: string): Promise<void>
  
  emitPluginHook(
    hookName: PluginHookName,
    data: PluginHookData
  ): Promise<PluginHookEmitResult>
  
  getPluginHooks(): Promise<PluginHooksInfo>
  
  // Debouncing Control
  setDebounceDelay(handle: WatchHandle, delayMs: number): Promise<void>
  getDebounceState(handle: WatchHandle): Promise<DebounceState>
  
  // Performance Monitoring
  getPerformanceProfile(handle: WatchHandle): Promise<PerformanceProfile>
  getEventMetrics(handle: WatchHandle): Promise<EventMetrics>
  resetMetrics(handle: WatchHandle): Promise<void>
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isWatchEventType = (value: unknown): value is WatchEventType => {
  return ['Modified', 'Created', 'Deleted', 'Renamed'].includes(value as string)
}

export const isPluginHookName = (value: unknown): value is PluginHookName => {
  return ['on_file_changed', 'before_recompile', 'after_compile'].includes(value as string)
}

export const isWatchEvent = (value: unknown): value is WatchEvent => {
  const v = value as Partial<WatchEvent>
  return (
    typeof v.file_path === 'string' &&
    isWatchEventType(v.event_type) &&
    typeof v.timestamp_ms === 'number'
  )
}

export const isWatchHandle = (value: unknown): value is WatchHandle => {
  const v = value as Partial<WatchHandle>
  return (
    typeof (v as any).__brand === 'string' &&
    (v as any).__brand === 'WatchHandle' &&
    typeof v.id === 'number'
  )
}

export const isWatchStats = (value: unknown): value is WatchStats => {
  const v = value as Partial<WatchStats>
  return (
    typeof v.active_handles === 'number' &&
    typeof v.total_files_watched === 'number' &&
    typeof v.events_processed === 'number' &&
    typeof v.average_latency_ms === 'number'
  )
}

export const isWatchError = (value: unknown): value is WatchError => {
  const v = value as Partial<WatchError>
  return (
    Object.values(WatchErrorType).includes(v.type as WatchErrorType) &&
    typeof v.message === 'string' &&
    typeof v.recoverable === 'boolean'
  )
}
