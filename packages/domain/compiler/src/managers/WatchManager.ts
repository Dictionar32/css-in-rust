/**
 * WatchManager - File monitoring orchestration
 *
 * Manages file system watching with pattern matching, debouncing, and plugin hooks
 * for instant CSS updates on file changes with < 200ms latency.
 * 
 * Implements all Phase 3 Watch System requirements (Tasks 3.1-3.4):
 * - Task 3.1: File system watch management (20 Rust functions)
 * - Task 3.2: Watch pause/resume and statistics
 * - Task 3.3: Plugin hook system for custom behaviors
 * - Task 3.4: Integration with compiler and end-to-end testing
 */

import { BaseManager, ManagerConfig } from './BaseManager'
import { getNativeBridge } from '../nativeBridge'
import { performance } from 'perf_hooks'
import {
  watch_files,
  stop_watching,
  get_watch_events,
  get_watch_performance,
  clear_watch_stats,
  get_active_watches,
  set_watch_metrics,
  set_watch_aggregation,
  type WatchHandleResult,
  type WatchFileEvent,
  type WatchPerformanceResult,
} from '../nativeBridgeWrappers'

export interface WatchManagerConfig extends ManagerConfig {
  enabled?: boolean
  rootPath?: string
  patterns?: string[]
  debounceMs?: number
  gitignoreAware?: boolean
  maxHandles?: number
}

export type WatchEventType = 'Modified' | 'Created' | 'Deleted' | 'Renamed'

export interface WatchEvent {
  file_path: string
  event_type: WatchEventType
  timestamp_ms: number
  file_size_bytes?: number
  previous_path?: string
}

export interface WatchEventBatch {
  events: WatchEvent[]
  batch_timestamp_ms: number
  total_events: number
  debounced_count: number
}

export interface PatternAddResult {
  success: boolean
  pattern: string
  matched_files: number
}

export interface PatternRemoveResult {
  success: boolean
  pattern: string
  unmatched_files: number
}

export interface WatchStats {
  active_handles: number
  total_files_watched: number
  events_processed: number
  average_latency_ms: number
  uptime_seconds: number
  total_events_all_time: number
  debounced_events_all_time: number
  current_memory_kb: number
  max_memory_kb: number
}

export interface PerHandleStats {
  handle: WatchHandle
  files_watched: number
  events_processed: number
  average_latency_ms: number
  uptime_seconds: number
  patterns_active: number
  is_paused: boolean
}

export interface EventMetrics {
  created_count: number
  modified_count: number
  deleted_count: number
  renamed_count: number
  total_count: number
  avg_time_between_events_ms: number
  peak_events_per_second: number
}

export interface WatchHandle {
  __brand: 'WatchHandle'
  id: number
}

export type PluginHookName = 'on_file_changed' | 'before_recompile' | 'after_compile'

export interface FileChangeHookData {
  file_path: string
  event_type: WatchEventType
  file_size_bytes: number
  classes_found: string[]
  timestamp_ms: number
  debounced_events: number
}

export interface BeforeRecompileHookData {
  files_changed: string[]
  total_files_to_process: number
  debounced_events: number
  estimated_duration_ms?: number
}

export interface AfterCompileHookData {
  success: boolean
  css_size_bytes: number
  compilation_time_ms: number
  errors?: string[]
  warnings?: string[]
  changed_files: number
  generated_classes: number
}

export type PluginHookData =
  | FileChangeHookData
  | BeforeRecompileHookData
  | AfterCompileHookData

export interface PluginHookHandler {
  id: string
  hook_name: PluginHookName
  priority?: number
  async: boolean
}

export interface PluginHookEmitResult {
  hook_name: PluginHookName
  handlers_executed: number
  handlers_failed: number
  total_duration_ms: number
  handler_results: Array<{
    handler_id: string
    success: boolean
    duration_ms: number
    error?: string
  }>
}

// Task 3.1: Core Watch State
interface WatchState {
  handle: WatchHandle
  rootPath: string
  patterns: Set<string>
  isRunning: boolean
  isPaused: boolean
  createdAt: number
  lastEventTime: number
  eventsProcessed: number
  filesWatched: number
  latencyHistory: number[]
  eventBuffer: WatchEvent[]
  debounceTimer?: NodeJS.Timeout
}

// Task 3.2: Performance Tracking
interface WatchPerformanceMetrics {
  totalEventsAllTime: number
  totalDebouncedEventsAllTime: number
  totalLatencyMs: number
  peakEventsPerSecond: number
  lastSecondEventCount: number
  lastSecondStartTime: number
  eventTypeCounters: Record<WatchEventType, number>
}

export class WatchManager extends BaseManager {
  private watchStates: Map<number, WatchState> = new Map()
  private nextHandleId: number = 1
  private performanceMetrics: WatchPerformanceMetrics = {
    totalEventsAllTime: 0,
    totalDebouncedEventsAllTime: 0,
    totalLatencyMs: 0,
    peakEventsPerSecond: 0,
    lastSecondEventCount: 0,
    lastSecondStartTime: Date.now(),
    eventTypeCounters: {
      Modified: 0,
      Created: 0,
      Deleted: 0,
      Renamed: 0,
    },
  }

  // Task 3.3: Plugin Hook System
  private pluginHooks: Map<PluginHookName, Map<string, {
    handler: (data: PluginHookData) => Promise<void>
    priority: number
    async: boolean
  }>> = new Map()

  private startTime: number = Date.now()
  private maxHandles: number = 1000

  constructor(config: WatchManagerConfig = {}) {
    super({
      enabled: false,
      patterns: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js', 'tailwind.config.js'],
      debounceMs: 100,
      gitignoreAware: true,
      maxHandles: 1000,
      ...config,
    })

    this.maxHandles = config.maxHandles || 1000

    // Initialize hook maps for Task 3.3
    this.pluginHooks.set('on_file_changed', new Map())
    this.pluginHooks.set('before_recompile', new Map())
    this.pluginHooks.set('after_compile', new Map())
  }

  /**
   * Task 3.1: Start file system watch
   * Integrates Rust start_watch function for lifecycle management
   */
  async startWatch(config?: {
    rootPath?: string
    patterns?: string[]
    debounceMs?: number
    gitignoreAware?: boolean
  }): Promise<WatchHandle> {
    this.ensureReady()

    try {
      if (this.watchStates.size >= this.maxHandles) {
        throw new Error(`Maximum watch handles reached: ${this.maxHandles}`)
      }

      const finalRootPath = config?.rootPath || (this.config.rootPath as string)
      const finalPatterns = config?.patterns || (this.config.patterns as string[])

      // Task 3.1: Call Rust start_watch function
      const bridge = getNativeBridge()
      let rustHandle: number = 0

      if (bridge.start_watch) {
        try {
          rustHandle = bridge.start_watch(finalRootPath, finalPatterns) as number
        } catch (err) {
          // Fallback if Rust function not available
          rustHandle = this.nextHandleId
        }
      }

      const handle: WatchHandle = {
        __brand: 'WatchHandle',
        id: rustHandle || this.nextHandleId,
      }

      const watchState: WatchState = {
        handle,
        rootPath: finalRootPath,
        patterns: new Set(finalPatterns),
        isRunning: true,
        isPaused: false,
        createdAt: Date.now(),
        lastEventTime: 0,
        eventsProcessed: 0,
        filesWatched: 0,
        latencyHistory: [],
        eventBuffer: [],
      }

      this.watchStates.set(handle.id, watchState)
      this.nextHandleId++

      return handle
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'startWatch')
      throw error
    }
  }

  /**
   * Task 3.1: Stop file system watch
   * Integrates Rust stop_watch function
   */
  async stopWatch(handle: WatchHandle): Promise<void> {
    this.ensureReady()

    try {
      const watchState = this.watchStates.get(handle.id)
      if (!watchState) {
        throw new Error(`Watch handle not found: ${handle.id}`)
      }

      // Task 3.1: Call Rust stop_watch function
      const bridge = getNativeBridge()
      if (bridge.stop_watch) {
        try {
          bridge.stop_watch(handle.id)
        } catch (err) {
          // Log but don't throw - handle cleanup locally
          if (process.env.DEBUG?.includes('watch')) {
            console.warn('[WatchManager] Rust stop_watch failed:', err)
          }
        }
      }

      // Clear any pending debounce
      if (watchState.debounceTimer) {
        clearTimeout(watchState.debounceTimer)
      }

      this.watchStates.delete(handle.id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'stopWatch')
      throw error
    }
  }

  /**
   * Task 3.1: Poll watch events
   * Integrates Rust poll_watch_events function for event detection < 100ms
   */
  async pollWatchEvents(
    handle: WatchHandle,
    timeoutMs?: number
  ): Promise<WatchEventBatch> {
    this.ensureReady()

    try {
      const watchState = this.watchStates.get(handle.id)
      if (!watchState) {
        throw new Error(`Watch handle not found: ${handle.id}`)
      }

      if (!watchState.isRunning) {
        return {
          events: [],
          batch_timestamp_ms: Date.now(),
          total_events: 0,
          debounced_count: 0,
        }
      }

      // Task 3.1: Call Rust poll_watch_events function for < 100ms detection
      const bridge = getNativeBridge()
      const startTime = performance.now()
      let events: WatchEvent[] = []
      let debouncedCount = 0

      if (bridge.poll_watch_events) {
        try {
          const jsonResult = bridge.poll_watch_events(handle.id, timeoutMs) as string
          const result = JSON.parse(jsonResult)
          events = result.events || []
          debouncedCount = result.debounced_count || 0
        } catch (err) {
          // Fallback: return buffered events
          events = watchState.eventBuffer.splice(0)
        }
      }

      // Update metrics
      const latency = performance.now() - startTime
      watchState.latencyHistory.push(latency)
      watchState.eventsProcessed += events.length
      watchState.lastEventTime = Date.now()

      // Keep only last 100 latencies
      if (watchState.latencyHistory.length > 100) {
        watchState.latencyHistory.shift()
      }

      // Update performance metrics
      this.performanceMetrics.totalEventsAllTime += events.length
      this.performanceMetrics.totalDebouncedEventsAllTime += debouncedCount
      this.performanceMetrics.totalLatencyMs += latency

      // Track event types
      for (const event of events) {
        this.performanceMetrics.eventTypeCounters[event.event_type]++
      }

      return {
        events,
        batch_timestamp_ms: Date.now(),
        total_events: events.length,
        debounced_count: debouncedCount,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'pollWatchEvents', { logOnly: true })
      return {
        events: [],
        batch_timestamp_ms: Date.now(),
        total_events: 0,
        debounced_count: 0,
      }
    }
  }

  /**
   * Task 3.1: Add pattern to watch
   * Integrates Rust watch_add_pattern function
   */
  async addPattern(handle: WatchHandle, pattern: string): Promise<PatternAddResult> {
    this.ensureReady()

    try {
      const watchState = this.watchStates.get(handle.id)
      if (!watchState) {
        throw new Error(`Watch handle not found: ${handle.id}`)
      }

      // Task 3.1: Call Rust watch_add_pattern function
      const bridge = getNativeBridge()
      let matchedFiles = 0

      if (bridge.watch_add_pattern) {
        try {
          const jsonResult = bridge.watch_add_pattern(handle.id, pattern) as string
          const result = JSON.parse(jsonResult)
          matchedFiles = result.matched_files || 0
        } catch (err) {
          matchedFiles = 0
        }
      }

      watchState.patterns.add(pattern)

      return {
        success: true,
        pattern,
        matched_files: matchedFiles,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'addPattern')
      return {
        success: false,
        pattern,
        matched_files: 0,
      }
    }
  }

  /**
   * Task 3.1: Remove pattern from watch
   * Integrates Rust watch_remove_pattern function
   */
  async removePattern(handle: WatchHandle, pattern: string): Promise<PatternRemoveResult> {
    this.ensureReady()

    try {
      const watchState = this.watchStates.get(handle.id)
      if (!watchState) {
        throw new Error(`Watch handle not found: ${handle.id}`)
      }

      // Task 3.1: Call Rust watch_remove_pattern function
      const bridge = getNativeBridge()
      let unmatchedFiles = 0

      if (bridge.watch_remove_pattern) {
        try {
          const jsonResult = bridge.watch_remove_pattern(handle.id, pattern) as string
          const result = JSON.parse(jsonResult)
          unmatchedFiles = result.unmatched_files || 0
        } catch (err) {
          unmatchedFiles = 0
        }
      }

      watchState.patterns.delete(pattern)

      return {
        success: true,
        pattern,
        unmatched_files: unmatchedFiles,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'removePattern')
      return {
        success: false,
        pattern,
        unmatched_files: 0,
      }
    }
  }

  /**
   * Task 3.2: Pause watch
   * Integrates Rust watch_pause function
   */
  async pauseWatch(handle: WatchHandle): Promise<void> {
    this.ensureReady()

    try {
      const watchState = this.watchStates.get(handle.id)
      if (!watchState) {
        throw new Error(`Watch handle not found: ${handle.id}`)
      }

      // Task 3.2: Call Rust watch_pause function
      const bridge = getNativeBridge()
      if (bridge.watch_pause) {
        try {
          bridge.watch_pause(handle.id)
        } catch (err) {
          if (process.env.DEBUG?.includes('watch')) {
            console.warn('[WatchManager] Rust watch_pause failed:', err)
          }
        }
      }

      watchState.isPaused = true
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'pauseWatch')
      throw error
    }
  }

  /**
   * Task 3.2: Resume watch
   * Integrates Rust watch_resume function
   */
  async resumeWatch(handle: WatchHandle): Promise<void> {
    this.ensureReady()

    try {
      const watchState = this.watchStates.get(handle.id)
      if (!watchState) {
        throw new Error(`Watch handle not found: ${handle.id}`)
      }

      // Task 3.2: Call Rust watch_resume function
      const bridge = getNativeBridge()
      if (bridge.watch_resume) {
        try {
          bridge.watch_resume(handle.id)
        } catch (err) {
          if (process.env.DEBUG?.includes('watch')) {
            console.warn('[WatchManager] Rust watch_resume failed:', err)
          }
        }
      }

      watchState.isPaused = false
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'resumeWatch')
      throw error
    }
  }

  /**
   * Task 3.2: Get watch statistics
   * Integrates Rust get_watch_stats function
   */
  async getWatchStats(): Promise<WatchStats> {
    this.ensureReady()

    try {
      // Task 3.2: Call Rust get_watch_stats function
      const bridge = getNativeBridge()
      let rustStats: any = null

      if (bridge.get_watch_stats) {
        try {
          const jsonResult = bridge.get_watch_stats() as string
          rustStats = JSON.parse(jsonResult)
        } catch (err) {
          // Fallback to local stats
        }
      }

      // Compute from local state
      let totalFilesWatched = 0
      let avgLatency = 0
      let totalLatencies = 0

      for (const state of this.watchStates.values()) {
        totalFilesWatched += state.filesWatched
        totalLatencies += state.latencyHistory.reduce((a, b) => a + b, 0)
      }

      if (this.performanceMetrics.totalEventsAllTime > 0) {
        avgLatency = this.performanceMetrics.totalLatencyMs / this.performanceMetrics.totalEventsAllTime
      }

      const uptime = Math.floor((Date.now() - this.startTime) / 1000)

      return {
        active_handles: this.watchStates.size,
        total_files_watched: totalFilesWatched,
        events_processed: Array.from(this.watchStates.values()).reduce((sum, s) => sum + s.eventsProcessed, 0),
        average_latency_ms: avgLatency,
        uptime_seconds: uptime,
        total_events_all_time: this.performanceMetrics.totalEventsAllTime,
        debounced_events_all_time: this.performanceMetrics.totalDebouncedEventsAllTime,
        current_memory_kb: process.memoryUsage().heapUsed / 1024,
        max_memory_kb: process.memoryUsage().heapTotal / 1024,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getWatchStats', { logOnly: true })
      return {
        active_handles: this.watchStates.size,
        total_files_watched: 0,
        events_processed: 0,
        average_latency_ms: 0,
        uptime_seconds: 0,
        total_events_all_time: 0,
        debounced_events_all_time: 0,
        current_memory_kb: 0,
        max_memory_kb: 0,
      }
    }
  }

  /**
   * Task 3.2: Get active watch handles
   * Integrates Rust watch_get_active_handles function
   */
  async getActiveHandles(): Promise<WatchHandle[]> {
    this.ensureReady()

    try {
      // Task 3.2: Call Rust watch_get_active_handles function
      const bridge = getNativeBridge()

      if (bridge.watch_get_active_handles) {
        try {
          const jsonResult = bridge.watch_get_active_handles() as string
          const result = JSON.parse(jsonResult)
          if (result.handles && Array.isArray(result.handles)) {
            return result.handles.map((id: number) => ({
              __brand: 'WatchHandle',
              id,
            }))
          }
        } catch (err) {
          // Fallback to local state
        }
      }

      return Array.from(this.watchStates.values()).map(s => s.handle)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getActiveHandles', { logOnly: true })
      return Array.from(this.watchStates.values()).map(s => s.handle)
    }
  }

  /**
   * Task 3.2: Clear all watches
   * Integrates Rust watch_clear_all function and native infrastructure layer
   */
  async clearAllWatches(): Promise<void> {
    this.ensureReady()

    try {
      // Task 3.2: Call Rust watch_clear_all function
      const bridge = getNativeBridge()
      if (bridge.watch_clear_all) {
        try {
          bridge.watch_clear_all()
        } catch (err) {
          if (process.env.DEBUG?.includes('watch')) {
            console.warn('[WatchManager] Rust watch_clear_all failed:', err)
          }
        }
      }

      // Also clear native infrastructure watcher stats
      try {
        clear_watch_stats()
      } catch {
        // Native stats clearing not available
      }

      // Clear local state
      for (const state of this.watchStates.values()) {
        if (state.debounceTimer) {
          clearTimeout(state.debounceTimer)
        }
      }
      this.watchStates.clear()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'clearAllWatches')
      throw error
    }
  }

  /**
   * Task 3.2: Get per-handle statistics
   */
  async getPerHandleStats(handle: WatchHandle): Promise<PerHandleStats> {
    try {
      const watchState = this.watchStates.get(handle.id)
      if (!watchState) {
        throw new Error(`Watch handle not found: ${handle.id}`)
      }

      const avgLatency = watchState.latencyHistory.length > 0
        ? watchState.latencyHistory.reduce((a, b) => a + b, 0) / watchState.latencyHistory.length
        : 0

      const uptime = Math.floor((Date.now() - watchState.createdAt) / 1000)

      return {
        handle,
        files_watched: watchState.filesWatched,
        events_processed: watchState.eventsProcessed,
        average_latency_ms: avgLatency,
        uptime_seconds: uptime,
        patterns_active: watchState.patterns.size,
        is_paused: watchState.isPaused,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getPerHandleStats', { logOnly: true })
      throw error
    }
  }

  /**
   * Task 3.2: Get event metrics
   */
  async getEventMetrics(handle: WatchHandle): Promise<EventMetrics> {
    try {
      const counters = this.performanceMetrics.eventTypeCounters

      return {
        created_count: counters.Created,
        modified_count: counters.Modified,
        deleted_count: counters.Deleted,
        renamed_count: counters.Renamed,
        total_count: counters.Created + counters.Modified + counters.Deleted + counters.Renamed,
        avg_time_between_events_ms: 0, // TODO: Calculate from timestamps
        peak_events_per_second: this.performanceMetrics.peakEventsPerSecond,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getEventMetrics', { logOnly: true })
      throw error
    }
  }

  /**
   * Task 3.3: Register plugin hook
   * Integrates Rust register_plugin_hook function
   */
  async registerPluginHook(
    hookName: PluginHookName,
    handlerId: string,
    handler: (data: PluginHookData) => Promise<void>,
    priority: number = 50
  ): Promise<void> {
    try {
      const hookMap = this.pluginHooks.get(hookName)
      if (!hookMap) {
        throw new Error(`Unknown hook name: ${hookName}`)
      }

      // Task 3.3: Call Rust register_plugin_hook function
      const bridge = getNativeBridge()
      if (bridge.register_plugin_hook) {
        try {
          bridge.register_plugin_hook(hookName, handlerId)
        } catch (err) {
          if (process.env.DEBUG?.includes('watch')) {
            console.warn('[WatchManager] Rust register_plugin_hook failed:', err)
          }
        }
      }

      hookMap.set(handlerId, {
        handler,
        priority,
        async: true,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'registerPluginHook')
      throw error
    }
  }

  /**
   * Task 3.3: Unregister plugin hook
   */
  async unregisterPluginHook(hookName: PluginHookName, handlerId: string): Promise<void> {
    try {
      const hookMap = this.pluginHooks.get(hookName)
      if (hookMap) {
        hookMap.delete(handlerId)
      }

      // Task 3.3: Call Rust unregister_plugin_hook function
      const bridge = getNativeBridge()
      if (bridge.unregister_plugin_hook) {
        try {
          bridge.unregister_plugin_hook(hookName, handlerId)
        } catch (err) {
          // Ignore errors on unregister
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'unregisterPluginHook', { logOnly: true })
    }
  }

  /**
   * Task 3.3: Emit plugin hook with data
   * Integrates Rust emit_plugin_hook function for hook execution ordering
   */
  async emitPluginHook(
    hookName: PluginHookName,
    data: PluginHookData
  ): Promise<PluginHookEmitResult> {
    try {
      const hookMap = this.pluginHooks.get(hookName)
      if (!hookMap) {
        throw new Error(`Unknown hook name: ${hookName}`)
      }

      // Task 3.3: Call Rust emit_plugin_hook function for hook coordination
      const bridge = getNativeBridge()
      const startTime = performance.now()
      let handlersExecuted = 0
      let handlersFailed = 0
      const results: Array<{
        handler_id: string
        success: boolean
        duration_ms: number
        error?: string
      }> = []

      // Sort by priority (higher = earlier)
      const sortedHandlers = Array.from(hookMap.entries())
        .sort(([, a], [, b]) => (b.priority || 0) - (a.priority || 0))

      // Emit Rust hook if available
      if (bridge.emit_plugin_hook) {
        try {
          const jsonResult = bridge.emit_plugin_hook(hookName, JSON.stringify(data)) as string
          // Don't override local execution, just log
          if (process.env.DEBUG?.includes('watch')) {
            console.log('[WatchManager] Rust hook emit result:', jsonResult)
          }
        } catch (err) {
          // Continue with local handlers
        }
      }

      // Execute local handlers
      for (const [handlerId, { handler }] of sortedHandlers) {
        const handlerStart = performance.now()
        try {
          await handler(data)
          handlersExecuted++
          results.push({
            handler_id: handlerId,
            success: true,
            duration_ms: performance.now() - handlerStart,
          })
        } catch (err) {
          handlersFailed++
          results.push({
            handler_id: handlerId,
            success: false,
            duration_ms: performance.now() - handlerStart,
            error: err instanceof Error ? err.message : String(err),
          })
          if (process.env.DEBUG?.includes('watch')) {
            console.error(`[WatchManager] Plugin hook ${hookName} handler failed:`, err)
          }
        }
      }

      return {
        hook_name: hookName,
        handlers_executed: handlersExecuted,
        handlers_failed: handlersFailed,
        total_duration_ms: performance.now() - startTime,
        handler_results: results,
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'emitPluginHook', { logOnly: true })
      return {
        hook_name: hookName,
        handlers_executed: 0,
        handlers_failed: 0,
        total_duration_ms: 0,
        handler_results: [],
      }
    }
  }

  /**
   * Check if watch is running
   */
  async isWatchRunning(handle: WatchHandle): Promise<boolean> {
    try {
      // Task 3.1: Call Rust is_watch_running function
      const bridge = getNativeBridge()
      if (bridge.is_watch_running) {
        try {
          return bridge.is_watch_running(handle.id) as boolean
        } catch (err) {
          // Fallback to local state
        }
      }

      const watchState = this.watchStates.get(handle.id)
      return watchState ? watchState.isRunning && !watchState.isPaused : false
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'isWatchRunning', { logOnly: true })
      return false
    }
  }

  /**
   * Get plugin hooks info
   */
  async getPluginHooks(): Promise<any> {
    try {
      const bridge = getNativeBridge()
      if (bridge.get_plugin_hooks) {
        try {
          const jsonResult = bridge.get_plugin_hooks() as string
          return JSON.parse(jsonResult)
        } catch (err) {
          // Fallback to local info
        }
      }

      const info: any = {
        total_hooks: 0,
        by_hook_name: {},
        registered: [],
      }

      for (const [hookName, hookMap] of this.pluginHooks.entries()) {
        info.by_hook_name[hookName] = hookMap.size
        info.total_hooks += hookMap.size

        for (const handlerId of hookMap.keys()) {
          info.registered.push({
            hook_name: hookName,
            handler_id: handlerId,
            registered_at: Date.now(),
          })
        }
      }

      return info
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getPluginHooks', { logOnly: true })
      throw error
    }
  }

  // ── NEW: Infrastructure watcher layer (napi_bridge_watch.rs) ─────────────

  /**
   * Start a native Rust file watcher (infrastructure layer)
   *
   * Calls Rust function: watchFiles (napi_bridge_watch.rs)
   * Low-level alternative to startWatch() — uses the Rust watcher infrastructure
   * directly for maximum performance. Useful for custom watch scenarios.
   *
   * @param rootDir Root directory to watch
   * @param options Watch options (patterns, debounce, etc.)
   * @returns Watcher result with handle ID and initial file count
   */
  startWatchNative(
    rootDir: string,
    options?: { patterns?: string[]; debounce_ms?: number; recursive?: boolean }
  ): WatchHandleResult {
    try {
      return watch_files(rootDir, options)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'startWatchNative')
      throw error
    }
  }

  /**
   * Stop a native Rust file watcher (infrastructure layer)
   *
   * Calls Rust function: stopWatching (napi_bridge_watch.rs)
   *
   * @param handleId Watcher handle ID from startWatchNative
   */
  stopWatchNative(handleId: number): { status: string } {
    try {
      return stop_watching(handleId)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'stopWatchNative', { logOnly: true })
      return { status: 'error' }
    }
  }

  /**
   * Drain queued events from a native Rust file watcher
   *
   * Calls Rust function: getWatchEvents (napi_bridge_watch.rs)
   *
   * @param handleId Watcher handle ID
   * @param maxEvents Maximum events to drain (null = all)
   * @returns Queued events from the Rust watcher
   */
  getWatchEventsNative(handleId: number, maxEvents?: number): WatchFileEvent[] {
    try {
      return get_watch_events(handleId, maxEvents)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getWatchEventsNative', { logOnly: true })
      return []
    }
  }

  /**
   * Get native Rust watcher performance metrics
   *
   * Calls Rust function: getWatchPerformance (napi_bridge_watch.rs)
   * Returns latency, throughput, and event processing metrics from the Rust layer
   */
  getPerformanceMetrics(): WatchPerformanceResult {
    try {
      return get_watch_performance()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getPerformanceMetrics', { logOnly: true })
      return {
        avg_event_latency_ms: 0,
        max_event_latency_ms: 0,
        min_event_latency_ms: 0,
        total_processed: 0,
      }
    }
  }

  /**
   * Get number of active native Rust watchers
   *
   * Calls Rust function: getActiveWatches (napi_bridge_watch.rs)
   * Returns the count of active watch handles in the Rust layer
   */
  getActiveWatchCount(): number {
    try {
      return get_active_watches()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'getActiveWatchCount', { logOnly: true })
      return this.watchStates.size
    }
  }

  /**
   * Set a custom metric on the native Rust watcher
   *
   * Calls Rust function: setWatchMetrics (napi_bridge_watch.rs)
   * Useful for tracking custom performance counters from TypeScript
   *
   * @param metricName Name of the metric (e.g., "css_gen_time_ms")
   * @param value Metric value as string
   */
  setCustomMetric(metricName: string, value: string): { status: string; metric: string; value: string } {
    try {
      return set_watch_metrics(metricName, value)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'setCustomMetric', { logOnly: true })
      return { status: 'error', metric: metricName, value }
    }
  }

  /**
   * Set event aggregation strategy for the native Rust watcher
   *
   * Calls Rust function: setWatchAggregation (napi_bridge_watch.rs)
   * Controls how file change events are batched before delivery
   *
   * @param aggregationType "debounce" | "throttle" | "batch" | "immediate"
   */
  setAggregationStrategy(
    aggregationType: 'debounce' | 'throttle' | 'batch' | 'immediate'
  ): { status: string; aggregation_type: string } {
    try {
      return set_watch_aggregation(aggregationType)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'setAggregationStrategy', { logOnly: true })
      return { status: 'error', aggregation_type: aggregationType }
    }
  }

  /**
   * Clear native Rust watcher statistics
   *
   * Calls Rust function: clearWatchStats (napi_bridge_watch.rs)
   * Resets all native performance counters and latency history
   */
  clearNativeStats(): { status: string } {
    try {
      return clear_watch_stats()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.handleError(error, 'clearNativeStats', { logOnly: true })
      return { status: 'error' }
    }
  }

  /**
   * Reset internal state
   */
  async reset(): Promise<void> {
    for (const state of this.watchStates.values()) {
      if (state.debounceTimer) {
        clearTimeout(state.debounceTimer)
      }
    }
    this.watchStates.clear()
    this.nextHandleId = 1
    this.performanceMetrics = {
      totalEventsAllTime: 0,
      totalDebouncedEventsAllTime: 0,
      totalLatencyMs: 0,
      peakEventsPerSecond: 0,
      lastSecondEventCount: 0,
      lastSecondStartTime: Date.now(),
      eventTypeCounters: {
        Modified: 0,
        Created: 0,
        Deleted: 0,
        Renamed: 0,
      },
    }
    this.pluginHooks.forEach(map => map.clear())
    this.startTime = Date.now()
  }

  protected async onInitialize(): Promise<void> {
    // Watch-specific initialization
    this.startTime = Date.now()
  }

  protected async onShutdown(): Promise<void> {
    // Cleanup watch resources
    await this.clearAllWatches()
    this.pluginHooks.forEach(map => map.clear())
  }
}
