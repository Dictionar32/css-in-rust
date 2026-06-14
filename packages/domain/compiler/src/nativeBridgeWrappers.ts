/**
 * Native Bridge Wrapper Functions - Part of NativeBridge exports
 * 
 * This file provides typed wrapper functions for all 63 Rust functions exposed via the native bridge.
 * Each wrapper includes:
 * - Comprehensive JSDoc documentation
 * - Error handling with contextual messages
 * - JSON parsing for functions that return JSON
 * - Type safety through TypeScript generics
 */

import { getNativeBridge, DeadCodeResult, ProcessedCssResult, ClassUsageItem } from "./nativeBridge"

/**
 * Creates a safe wrapper for calling native bridge functions with error handling
 * @param functionName The name of the function being called (for error messages)
 * @param fn The function to execute
 * @returns The result of the function or throws with context-specific error
 */
const safeCallNative = <T>(functionName: string, fn: () => T): T => {
  try {
    return fn()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`[nativeBridge.${functionName}] ${message}`)
  }
}

/**
 * Unwraps JSON results from native functions and parses them
 * @param jsonResult The JSON string from native function
 * @param context The context name for error messages
 * @returns Parsed JSON object
 */
const parseNativeJson = <T>(jsonResult: string, context: string): T => {
  try {
    return JSON.parse(jsonResult) as T
  } catch (err) {
    throw new Error(`[nativeBridge.${context}] Failed to parse JSON result: ${err}`)
  }
}

// ── TYPE DEFINITIONS FOR DATA STRUCTURES ────────────────────────────────────

export interface WatchEvent {
  file_path: string
  event_type: string
  timestamp_ms: number
}

export interface WatchStats {
  active_handles: number
  total_files_watched: number
  events_processed: number
  average_latency_ms: number
  uptime_seconds: number
}

export interface PoolStats {
  active_connections: number
  available_connections: number
  pool_size: number
  total_requests: number
  average_latency_ms: number
}

export interface ClusterStatus {
  enabled: boolean
  node_count: number
  nodes: Array<{ host: string; port: number; status: string }>
  slots_covered: number
}

export interface ReplicationStatus {
  enabled: boolean
  master: string
  replicas: string[]
  lag_bytes: number
  sync_in_progress: boolean
}

export interface MemoryStats {
  total_bytes: number
  used_bytes: number
  available_bytes: number
  key_count: number
  avg_key_size_bytes: number
  avg_value_size_bytes: number
  recommendations: string[]
}

export interface DiagnosticsReport {
  connection_ok: boolean
  latency_p95_ms: number
  memory_healthy: boolean
  replication_ok: boolean
  cluster_healthy: boolean
  recommendations: string[]
}

// ── REDIS CACHE FUNCTIONS (40 total) ────────────────────────────────────────

/**
 * Connects to Redis server and initializes connection pool
 * @param host Redis server hostname
 * @param port Redis server port
 * @param poolSize Optional pool size (default 10)
 * @returns Connection pool stats as JSON string
 */
export const redis_pool_connect = (host: string, port: number, poolSize?: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_pool_connect) throw new Error("redis_pool_connect not available")
  return safeCallNative("redis_pool_connect", () => bridge.redis_pool_connect!(host, port, poolSize))
}

/**
 * Gets current Redis connection pool statistics
 * @returns Pool stats including connection count and latency
 */
export const redis_pool_stats = (): PoolStats => {
  const bridge = getNativeBridge()
  if (!bridge.redis_pool_stats) throw new Error("redis_pool_stats not available")
  const result = safeCallNative("redis_pool_stats", () => bridge.redis_pool_stats!())
  return parseNativeJson<PoolStats>(result, "redis_pool_stats")
}

/**
 * Manually reconnects Redis pool to server
 * @returns Status message
 */
export const redis_pool_reconnect = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_pool_reconnect) throw new Error("redis_pool_reconnect not available")
  return safeCallNative("redis_pool_reconnect", () => bridge.redis_pool_reconnect!())
}

/**
 * Pings Redis server to verify connectivity
 * @returns Ping response message
 */
export const redis_ping = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_ping) throw new Error("redis_ping not available")
  return safeCallNative("redis_ping", () => bridge.redis_ping!())
}

/**
 * Gets value from Redis cache by key
 * @param key Cache key to retrieve
 * @returns Cached value or null if not found
 */
export const redis_get = (key: string): string | null => {
  const bridge = getNativeBridge()
  if (!bridge.redis_get) throw new Error("redis_get not available")
  const result = safeCallNative("redis_get", () => bridge.redis_get!(key))
  return result || null
}

/**
 * Sets value in Redis cache with optional TTL
 * @param key Cache key
 * @param value Value to cache
 * @param ttlSeconds Optional TTL in seconds (default: 7 days)
 * @returns Status message
 */
export const redis_set = (key: string, value: string, ttlSeconds?: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_set) throw new Error("redis_set not available")
  return safeCallNative("redis_set", () => bridge.redis_set!(key, value, ttlSeconds))
}

/**
 * Deletes key from Redis cache
 * @param key Key to delete
 * @returns Number of keys deleted (0 or 1)
 */
export const redis_delete = (key: string): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_delete) throw new Error("redis_delete not available")
  return safeCallNative("redis_delete", () => bridge.redis_delete!(key))
}

/**
 * Checks if key exists in Redis cache
 * @param key Key to check
 * @returns 1 if exists, 0 if not
 */
export const redis_exists = (key: string): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_exists) throw new Error("redis_exists not available")
  return safeCallNative("redis_exists", () => bridge.redis_exists!(key))
}

/**
 * Gets multiple values from Redis cache
 * @param keys Array of cache keys
 * @returns JSON string with key-value mapping
 */
export const redis_mget = (keys: string[]): Record<string, string> => {
  const bridge = getNativeBridge()
  if (!bridge.redis_mget) throw new Error("redis_mget not available")
  const result = safeCallNative("redis_mget", () => bridge.redis_mget!(keys))
  return parseNativeJson<Record<string, string>>(result, "redis_mget")
}

/**
 * Sets multiple key-value pairs in Redis cache
 * @param pairs Array of [key, value, ttl?] tuples
 * @returns Status message
 */
export const redis_mset = (pairs: Array<[string, string]>): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_mset) throw new Error("redis_mset not available")
  return safeCallNative("redis_mset", () => bridge.redis_mset!(pairs))
}

/**
 * Flushes current Redis database
 * @returns Number of keys flushed
 */
export const redis_flush_db = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_flush_db) throw new Error("redis_flush_db not available")
  return safeCallNative("redis_flush_db", () => bridge.redis_flush_db!())
}

/**
 * Flushes all Redis databases
 * @returns Number of keys flushed
 */
export const redis_flush_all = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_flush_all) throw new Error("redis_flush_all not available")
  return safeCallNative("redis_flush_all", () => bridge.redis_flush_all!())
}

/**
 * Gets total size of all cache entries in bytes
 * @returns Total size in bytes
 */
export const redis_cache_size = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_cache_size) throw new Error("redis_cache_size not available")
  return safeCallNative("redis_cache_size", () => bridge.redis_cache_size!())
}

/**
 * Gets count of cache entries
 * @returns Number of cache entries
 */
export const redis_cache_key_count = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_cache_key_count) throw new Error("redis_cache_key_count not available")
  return safeCallNative("redis_cache_key_count", () => bridge.redis_cache_key_count!())
}

/**
 * Clears all css-compiler:* cache entries
 * @returns Number of entries cleared
 */
export const redis_cache_clear = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_cache_clear) throw new Error("redis_cache_clear not available")
  return safeCallNative("redis_cache_clear", () => bridge.redis_cache_clear!())
}

/**
 * Gets cache hit rate percentage
 * @returns Hit rate as percentage (0-100)
 */
export const redis_cache_hit_rate = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_cache_hit_rate) throw new Error("redis_cache_hit_rate not available")
  return safeCallNative("redis_cache_hit_rate", () => bridge.redis_cache_hit_rate!())
}

/**
 * Gets Redis server info
 * @returns Server info string
 */
export const redis_info = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_info) throw new Error("redis_info not available")
  return safeCallNative("redis_info", () => bridge.redis_info!())
}

/**
 * Monitors real-time Redis commands (streaming)
 * @returns Stream of command data
 */
export const redis_monitor = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_monitor) throw new Error("redis_monitor not available")
  return safeCallNative("redis_monitor", () => bridge.redis_monitor!())
}

/**
 * Enables Redis cluster mode with initial nodes
 * @param initialNodes Array of cluster node addresses
 * @returns Cluster status as JSON
 */
export const redis_enable_cluster = (initialNodes: string[]): ClusterStatus => {
  const bridge = getNativeBridge()
  if (!bridge.redis_enable_cluster) throw new Error("redis_enable_cluster not available")
  const result = safeCallNative("redis_enable_cluster", () => bridge.redis_enable_cluster!(initialNodes))
  return parseNativeJson<ClusterStatus>(result, "redis_enable_cluster")
}

/**
 * Disables Redis cluster mode
 * @returns Status message
 */
export const redis_disable_cluster = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_disable_cluster) throw new Error("redis_disable_cluster not available")
  return safeCallNative("redis_disable_cluster", () => bridge.redis_disable_cluster!())
}

/**
 * Gets Redis cluster status
 * @returns Cluster status as JSON
 */
export const redis_cluster_status = (): ClusterStatus => {
  const bridge = getNativeBridge()
  if (!bridge.redis_cluster_status) throw new Error("redis_cluster_status not available")
  const result = safeCallNative("redis_cluster_status", () => bridge.redis_cluster_status!())
  return parseNativeJson<ClusterStatus>(result, "redis_cluster_status")
}

/**
 * Sets TTL/expiration for cache key
 * @param key Cache key
 * @param ttlSeconds TTL in seconds
 * @returns 1 if timeout was set, 0 if key does not exist
 */
export const redis_expiration_set = (key: string, ttlSeconds: number): number => {
  const bridge = getNativeBridge()
  if (bridge.redisExpire) {
    const result = safeCallNative("redisExpire", () => bridge.redisExpire!(key, ttlSeconds))
    try {
      const parsed = JSON.parse(result)
      return parsed.status === "ok" ? 1 : 0
    } catch {
      return 0
    }
  } else if (bridge.redis_expiration_set) {
    const result = safeCallNative("redis_expiration_set", () => bridge.redis_expiration_set!(key, ttlSeconds))
    return result
  }
  throw new Error("redisExpire not available")
}

/**
 * Gets TTL/expiration info for cache key
 * @param key Cache key
 * @returns Expiration info as JSON
 */
export const redis_expiration_get = (key: string): Record<string, unknown> => {
  const bridge = getNativeBridge()
  const fn = bridge.redisTtl || bridge.redis_expiration_get
  if (!fn) throw new Error("redisTtl not available")
  const result = safeCallNative("redisTtl", () => fn(key))
  return parseNativeJson<Record<string, unknown>>(result, "redisTtl")
}

/**
 * Subscribes to Redis channel for events
 * @param channel Channel name to subscribe to
 * @returns Subscription response
 */
export const redis_subscribe = (channel: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_subscribe) throw new Error("redis_subscribe not available")
  return safeCallNative("redis_subscribe", () => bridge.redis_subscribe!(channel))
}

/**
 * Publishes message to Redis channel
 * @param channel Channel name
 * @param message Message to publish
 * @returns Number of subscribers that received message
 */
export const redis_publish = (channel: string, message: string): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_publish) throw new Error("redis_publish not available")
  return safeCallNative("redis_publish", () => bridge.redis_publish!(channel, message))
}

/**
 * Enables Redis persistence (AOF or RDB mode)
 * @param mode Persistence mode: 'AOF' or 'RDB'
 * @returns Status message
 */
export const redis_enable_persistence = (mode: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_enable_persistence) throw new Error("redis_enable_persistence not available")
  return safeCallNative("redis_enable_persistence", () => bridge.redis_enable_persistence!(mode))
}

/**
 * Disables Redis persistence
 * @returns Status message
 */
export const redis_disable_persistence = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_disable_persistence) throw new Error("redis_disable_persistence not available")
  return safeCallNative("redis_disable_persistence", () => bridge.redis_disable_persistence!())
}

/**
 * Creates manual Redis snapshot
 * @returns Status message
 */
export const redis_snapshot = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_snapshot) throw new Error("redis_snapshot not available")
  return safeCallNative("redis_snapshot", () => bridge.redis_snapshot!())
}

/**
 * Enables master-replica replication to target host
 * @param targetHost Target host for replication
 * @param targetPort Target port for replication
 * @returns Number of replicas configured
 */
export const redis_replicate = (targetHost: string, targetPort: number): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_replicate) throw new Error("redis_replicate not available")
  return safeCallNative("redis_replicate", () => bridge.redis_replicate!(targetHost, targetPort))
}

/**
 * Gets replication status
 * @returns Replication status as JSON string
 */
export const redis_replication_status = (): ReplicationStatus => {
  const bridge = getNativeBridge()
  if (!bridge.redis_replication_status) throw new Error("redis_replication_status not available")
  const result = safeCallNative("redis_replication_status", () => bridge.redis_replication_status!())
  return parseNativeJson<ReplicationStatus>(result, "redis_replication_status")
}

/**
 * Enables cache warming: preload entries matching pattern
 * @param keyPattern Key pattern to preload (e.g., "css-compiler:*")
 * @returns Status message
 */
export const redis_enable_cache_warming = (keyPattern: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_enable_cache_warming) throw new Error("redis_enable_cache_warming not available")
  return safeCallNative("redis_enable_cache_warming", () => bridge.redis_enable_cache_warming!(keyPattern))
}

/**
 * Disables cache warming
 * @returns Status message
 */
export const redis_disable_cache_warming = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_disable_cache_warming) throw new Error("redis_disable_cache_warming not available")
  return safeCallNative("redis_disable_cache_warming", () => bridge.redis_disable_cache_warming!())
}

/**
 * Synchronizes cache across peer nodes
 * @param peers Array of peer node addresses
 * @returns Number of peers synced
 */
export const redis_cache_sync = (peers: string[]): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_cache_sync) throw new Error("redis_cache_sync not available")
  return safeCallNative("redis_cache_sync", () => bridge.redis_cache_sync!(peers))
}

/**
 * Sets cache eviction policy (LRU, LFU, FIFO, RANDOM)
 * @param policy Eviction policy name
 * @returns Status message
 */
export const redis_set_eviction_policy = (policy: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_set_eviction_policy) throw new Error("redis_set_eviction_policy not available")
  return safeCallNative("redis_set_eviction_policy", () => bridge.redis_set_eviction_policy!(policy))
}

/**
 * Gets current cache eviction policy
 * @returns Current eviction policy name
 */
export const redis_get_eviction_policy = (): string => {
  const bridge = getNativeBridge()
  if (!bridge.redis_get_eviction_policy) throw new Error("redis_get_eviction_policy not available")
  return safeCallNative("redis_get_eviction_policy", () => bridge.redis_get_eviction_policy!())
}

/**
 * Gets Redis memory statistics and optimization recommendations
 * @returns Memory stats as JSON
 */
export const redis_memory_stats = (): MemoryStats => {
  const bridge = getNativeBridge()
  if (!bridge.redis_memory_stats) throw new Error("redis_memory_stats not available")
  const result = safeCallNative("redis_memory_stats", () => bridge.redis_memory_stats!())
  return parseNativeJson<MemoryStats>(result, "redis_memory_stats")
}

/**
 * Optimizes Redis memory usage
 * @returns Number of optimizations applied
 */
export const redis_optimize_memory = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.redis_optimize_memory) throw new Error("redis_optimize_memory not available")
  return safeCallNative("redis_optimize_memory", () => bridge.redis_optimize_memory!())
}

/**
 * Runs comprehensive diagnostics on Redis connection
 * @returns Diagnostics report as JSON string
 */
export const redis_diagnose = (): DiagnosticsReport => {
  const bridge = getNativeBridge()
  if (!bridge.redis_diagnose) throw new Error("redis_diagnose not available")
  const result = safeCallNative("redis_diagnose", () => bridge.redis_diagnose!())
  return parseNativeJson<DiagnosticsReport>(result, "redis_diagnose")
}

// ── WATCH SYSTEM FUNCTIONS (20 total) ──────────────────────────────────────

/**
 * Starts file system watcher on root path with patterns
 * @param rootPath Root directory to watch
 * @param patterns Optional file patterns to watch (default: patterns including tsx and ts files)
 * @returns Watch handle for management
 */
export const start_watch = (rootPath: string, patterns?: string[]): number => {
  const bridge = getNativeBridge()
  if (!bridge.start_watch) throw new Error("start_watch not available")
  return safeCallNative("start_watch", () => bridge.start_watch!(rootPath, patterns))
}

/**
 * Polls for file system watch events with timeout
 * @param handle Watch handle returned from start_watch
 * @param timeoutMs Optional timeout in milliseconds
 * @returns Array of watch events
 */
export const poll_watch_events = (handle: number, timeoutMs?: number): WatchEvent[] => {
  const bridge = getNativeBridge()
  if (!bridge.poll_watch_events) throw new Error("poll_watch_events not available")
  const result = safeCallNative("poll_watch_events", () => bridge.poll_watch_events!(handle, timeoutMs))
  return parseNativeJson<WatchEvent[]>(result, "poll_watch_events")
}

/**
 * Stops file system watcher
 * @param handle Watch handle to stop
 * @returns Status code
 */
export const stop_watch = (handle: number): number => {
  const bridge = getNativeBridge()
  if (!bridge.stop_watch) throw new Error("stop_watch not available")
  return safeCallNative("stop_watch", () => bridge.stop_watch!(handle))
}

/**
 * Adds file pattern to active watch
 * @param handle Watch handle
 * @param pattern File pattern to add
 * @returns Status message
 */
export const watch_add_pattern = (handle: number, pattern: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.watch_add_pattern) throw new Error("watch_add_pattern not available")
  return safeCallNative("watch_add_pattern", () => bridge.watch_add_pattern!(handle, pattern))
}

/**
 * Removes file pattern from active watch
 * @param handle Watch handle
 * @param pattern Pattern to remove
 * @returns Status message
 */
export const watch_remove_pattern = (handle: number, pattern: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.watch_remove_pattern) throw new Error("watch_remove_pattern not available")
  return safeCallNative("watch_remove_pattern", () => bridge.watch_remove_pattern!(handle, pattern))
}

/**
 * Pauses file watching without stopping watcher
 * @param handle Watch handle
 * @returns Status message
 */
export const watch_pause = (handle: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.watch_pause) throw new Error("watch_pause not available")
  return safeCallNative("watch_pause", () => bridge.watch_pause!(handle))
}

/**
 * Resumes paused file watching
 * @param handle Watch handle
 * @returns Status message
 */
export const watch_resume = (handle: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.watch_resume) throw new Error("watch_resume not available")
  return safeCallNative("watch_resume", () => bridge.watch_resume!(handle))
}

/**
 * Checks if watch is currently running
 * @param handle Watch handle
 * @returns True if watch is running, false otherwise
 */
export const is_watch_running = (handle: number): boolean => {
  const bridge = getNativeBridge()
  if (!bridge.is_watch_running) throw new Error("is_watch_running not available")
  return safeCallNative("is_watch_running", () => bridge.is_watch_running!(handle))
}

/**
 * Gets watch system statistics
 * @returns Watch statistics as JSON
 */
export const get_watch_stats = (): WatchStats => {
  const bridge = getNativeBridge()
  if (!bridge.get_watch_stats) throw new Error("get_watch_stats not available")
  const result = safeCallNative("get_watch_stats", () => bridge.get_watch_stats!())
  return parseNativeJson<WatchStats>(result, "get_watch_stats")
}

/**
 * Gets list of all active watch handles
 * @returns Array of active watch handles
 */
export const watch_get_active_handles = (): number[] => {
  const bridge = getNativeBridge()
  if (!bridge.watch_get_active_handles) throw new Error("watch_get_active_handles not available")
  const result = safeCallNative("watch_get_active_handles", () => bridge.watch_get_active_handles!())
  return parseNativeJson<number[]>(result, "watch_get_active_handles")
}

/**
 * Stops all active watches and clears resources
 * @returns Number of watches cleared
 */
export const watch_clear_all = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.watch_clear_all) throw new Error("watch_clear_all not available")
  return safeCallNative("watch_clear_all", () => bridge.watch_clear_all!())
}

/**
 * Registers plugin hook handler
 * @param hookName Hook name (on_file_changed, before_recompile, after_compile)
 * @param handlerId Unique handler identifier
 * @returns Status message
 */
export const register_plugin_hook = (hookName: string, handlerId: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.register_plugin_hook) throw new Error("register_plugin_hook not available")
  return safeCallNative("register_plugin_hook", () => bridge.register_plugin_hook!(hookName, handlerId))
}

/**
 * Unregisters plugin hook handler
 * @param hookName Hook name
 * @param handlerId Handler identifier
 * @returns Status message
 */
export const unregister_plugin_hook = (hookName: string, handlerId: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.unregister_plugin_hook) throw new Error("unregister_plugin_hook not available")
  return safeCallNative("unregister_plugin_hook", () => bridge.unregister_plugin_hook!(hookName, handlerId))
}

/**
 * Emits plugin hook to all registered handlers
 * @param hookName Hook name
 * @param dataJson Hook data as JSON string
 * @returns Combined results from all handlers as JSON
 */
export const emit_plugin_hook = (hookName: string, dataJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.emit_plugin_hook) throw new Error("emit_plugin_hook not available")
  return safeCallNative("emit_plugin_hook", () => bridge.emit_plugin_hook!(hookName, dataJson))
}

/**
 * Gets list of all registered plugin hooks
 * @returns Registered hooks as JSON
 */
export const get_plugin_hooks = (): Record<string, string[]> => {
  const bridge = getNativeBridge()
  if (!bridge.get_plugin_hooks) throw new Error("get_plugin_hooks not available")
  const result = safeCallNative("get_plugin_hooks", () => bridge.get_plugin_hooks!())
  return parseNativeJson<Record<string, string[]>>(result, "get_plugin_hooks")
}

// ── ID REGISTRY FUNCTIONS (16 total) ───────────────────────────────────────

/**
 * Creates new ID registry and returns handle
 * @returns Registry handle for management
 */
export const id_registry_create = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_create) throw new Error("id_registry_create not available")
  return safeCallNative("id_registry_create", () => bridge.id_registry_create!())
}

/**
 * Generates stable numeric ID for component name
 * @param handle Registry handle
 * @param name Component name
 * @returns Numeric component ID
 */
export const id_registry_generate = (handle: number, name: string): number => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_generate) throw new Error("id_registry_generate not available")
  return safeCallNative("id_registry_generate", () => bridge.id_registry_generate!(handle, name))
}

/**
 * Looks up numeric ID for component name (idempotent)
 * @param handle Registry handle
 * @param name Component name
 * @returns Numeric component ID
 */
export const id_registry_lookup = (handle: number, name: string): number => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_lookup) throw new Error("id_registry_lookup not available")
  return safeCallNative("id_registry_lookup", () => bridge.id_registry_lookup!(handle, name))
}

/**
 * Gets next available ID in sequence
 * @param handle Registry handle
 * @returns Next available numeric ID
 */
export const id_registry_next = (handle: number): number => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_next) throw new Error("id_registry_next not available")
  return safeCallNative("id_registry_next", () => bridge.id_registry_next!(handle))
}

/**
 * Destroys registry and releases resources
 * @param handle Registry handle
 */
export const id_registry_destroy = (handle: number): void => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_destroy) throw new Error("id_registry_destroy not available")
  safeCallNative("id_registry_destroy", () => bridge.id_registry_destroy!(handle))
}

/**
 * Resets registry: clears all entries and restarts from ID 1
 * @param handle Registry handle
 */
export const id_registry_reset = (handle: number): void => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_reset) throw new Error("id_registry_reset not available")
  safeCallNative("id_registry_reset", () => bridge.id_registry_reset!(handle))
}

/**
 * Creates JSON snapshot of all registered IDs and mappings
 * @param handle Registry handle
 * @returns Snapshot as JSON string
 */
export const id_registry_snapshot = (handle: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_snapshot) throw new Error("id_registry_snapshot not available")
  return safeCallNative("id_registry_snapshot", () => bridge.id_registry_snapshot!(handle))
}

/**
 * Gets count of currently active registry handles
 * @returns Number of active registries
 */
export const id_registry_active_count = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_active_count) throw new Error("id_registry_active_count not available")
  return safeCallNative("id_registry_active_count", () => bridge.id_registry_active_count!())
}

/**
 * Registers CSS property name and returns numeric ID
 * @param propertyName CSS property name (e.g., "backgroundColor")
 * @returns Numeric property ID
 */
export const register_property_name = (propertyName: string): number => {
  const bridge = getNativeBridge()
  if (!bridge.register_property_name) throw new Error("register_property_name not available")
  return safeCallNative("register_property_name", () => bridge.register_property_name!(propertyName))
}

/**
 * Registers CSS value and returns numeric ID
 * @param valueName CSS value (e.g., "#2563eb")
 * @returns Numeric value ID
 */
export const register_value_name = (valueName: string): number => {
  const bridge = getNativeBridge()
  if (!bridge.register_value_name) throw new Error("register_value_name not available")
  return safeCallNative("register_value_name", () => bridge.register_value_name!(valueName))
}

/**
 * Converts property ID back to property name string
 * @param propertyId Numeric property ID
 * @returns Property name string
 */
export const property_id_to_string = (propertyId: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.property_id_to_string) throw new Error("property_id_to_string not available")
  return safeCallNative("property_id_to_string", () => bridge.property_id_to_string!(propertyId))
}

/**
 * Converts value ID back to value string
 * @param valueId Numeric value ID
 * @returns Value string
 */
export const value_id_to_string = (valueId: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.value_id_to_string) throw new Error("value_id_to_string not available")
  return safeCallNative("value_id_to_string", () => bridge.value_id_to_string!(valueId))
}

/**
 * Reverse lookup property name from property ID
 * @param propertyId Numeric property ID
 * @returns Property name string
 */
export const reverse_lookup_property = (propertyId: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.reverse_lookup_property) throw new Error("reverse_lookup_property not available")
  return safeCallNative("reverse_lookup_property", () => bridge.reverse_lookup_property!(propertyId))
}

/**
 * Reverse lookup value from value ID
 * @param valueId Numeric value ID
 * @returns Value string
 */
export const reverse_lookup_value = (valueId: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.reverse_lookup_value) throw new Error("reverse_lookup_value not available")
  return safeCallNative("reverse_lookup_value", () => bridge.reverse_lookup_value!(valueId))
}

/**
 * Exports registry state to portable JSON format
 * @param handle Registry handle
 * @returns Exported registry data as JSON string
 */
export const id_registry_export = (handle: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_export) throw new Error("id_registry_export not available")
  return safeCallNative("id_registry_export", () => bridge.id_registry_export!(handle))
}

/**
 * Imports registry from exported JSON data
 * @param importedData Exported registry data
 * @returns New registry handle with imported data
 */
export const id_registry_import = (importedData: string): number => {
  const bridge = getNativeBridge()
  if (!bridge.id_registry_import) throw new Error("id_registry_import not available")
  return safeCallNative("id_registry_import", () => bridge.id_registry_import!(importedData))
}

// ── INCREMENTAL COMPILATION FUNCTIONS (8 total) ───────────────────────────

/**
 * Processes single file change: detects affected/removed/new classes
 * @param fileChangeJson File change data as JSON string
 * @returns File change diff as JSON string
 */
export const process_file_change = (fileChangeJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.process_file_change) throw new Error("process_file_change not available")
  return safeCallNative("process_file_change", () => bridge.process_file_change!(fileChangeJson))
}

/**
 * Computes incremental diff between two workspace scans
 * @param oldScanJson Old scan result as JSON
 * @param newScanJson New scan result as JSON
 * @returns Diff as JSON string
 */
export const compute_incremental_diff = (oldScanJson: string, newScanJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.compute_incremental_diff) throw new Error("compute_incremental_diff not available")
  return safeCallNative("compute_incremental_diff", () => bridge.compute_incremental_diff!(oldScanJson, newScanJson))
}

/**
 * Creates stable fingerprint for file content (for change detection)
 * @param filePath File path
 * @param fileContent File content
 * @returns Fingerprint as JSON string
 */
export const create_fingerprint = (filePath: string, fileContent: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.create_fingerprint) throw new Error("create_fingerprint not available")
  return safeCallNative("create_fingerprint", () => bridge.create_fingerprint!(filePath, fileContent))
}

/**
 * Injects state hash comment into CSS for cache invalidation tracking
 * @param css CSS content
 * @param stateHash State hash to inject
 * @returns CSS with injected hash as JSON string
 */
export const inject_state_hash = (css: string, stateHash: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.inject_state_hash) throw new Error("inject_state_hash not available")
  return safeCallNative("inject_state_hash", () => bridge.inject_state_hash!(css, stateHash))
}

/**
 * Prunes stale entries from incremental cache by age or count
 * @param maxAgeSeconds Maximum age in seconds
 * @param maxEntries Optional maximum entry count
 * @returns Prune result as JSON string
 */
export const prune_stale_entries = (maxAgeSeconds: number, maxEntries: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.prune_stale_entries) throw new Error("prune_stale_entries not available")
  return safeCallNative("prune_stale_entries", () => bridge.prune_stale_entries!(maxAgeSeconds, maxEntries))
}

/**
 * Rebuilds workspace result from baseline and incremental changes
 * @param rootDir Root directory
 * @param extensions Optional file extensions to scan
 * @returns Incremental build result as JSON string
 */
export const rebuild_workspace_result = (rootDir: string, extensions?: string[]): string => {
  const bridge = getNativeBridge()
  if (!bridge.rebuild_workspace_result) throw new Error("rebuild_workspace_result not available")
  return safeCallNative("rebuild_workspace_result", () => bridge.rebuild_workspace_result!(rootDir, extensions))
}

/**
 * Scans files in batch: extracts classes from array of files
 * @param filesJson Array of {path, content} objects as JSON string
 * @returns Batch scan result as JSON string
 */
export const scan_files_batch_native = (filesJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.scan_files_batch_native) throw new Error("scan_files_batch_native not available")
  return safeCallNative("scan_files_batch_native", () => bridge.scan_files_batch_native!(filesJson))
}

// ── THEME RESOLUTION FUNCTIONS (7 total) ──────────────────────────────────

/**
 * Resolves variant definitions with precedence information
 * @param configJson Theme variant config as JSON
 * @returns Resolved variants as JSON string
 */
export const resolve_variants = (configJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolve_variants) throw new Error("resolve_variants not available")
  return safeCallNative("resolve_variants", () => bridge.resolve_variants!(configJson))
}

/**
 * Validates variant configuration for errors and warnings
 * @param configJson Variant config to validate as JSON
 * @returns Validation result as JSON string
 */
export const validate_variant_config = (configJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.validate_variant_config) throw new Error("validate_variant_config not available")
  return safeCallNative("validate_variant_config", () => bridge.validate_variant_config!(configJson))
}

/**
 * Resolves theme cascade: merges base with overrides using cascade rules
 * @param baseThemeJson Base theme as JSON
 * @param overridesJson Theme overrides as JSON
 * @returns Merged theme as JSON string
 */
export const resolve_cascade = (baseThemeJson: string, overridesJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolve_cascade) throw new Error("resolve_cascade not available")
  return safeCallNative("resolve_cascade", () => bridge.resolve_cascade!(baseThemeJson, overridesJson))
}

/**
 * Resolves class names to theme values: maps each class to its resolved value
 * @param classNames Array of class names
 * @param themeJson Theme as JSON
 * @returns Class to value mapping as JSON string
 */
export const resolve_class_names = (classNames: string[], themeJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolve_class_names) throw new Error("resolve_class_names not available")
  return safeCallNative("resolve_class_names", () => bridge.resolve_class_names!(classNames, themeJson))
}

/**
 * Resolves conflict group: gets all classes in a conflict group (e.g., "colors")
 * @param groupName Conflict group name
 * @param themeJson Theme as JSON
 * @returns Array of class names in group as JSON string
 */
export const resolve_conflict_group = (groupName: string, themeJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolve_conflict_group) throw new Error("resolve_conflict_group not available")
  return safeCallNative("resolve_conflict_group", () => bridge.resolve_conflict_group!(groupName, themeJson))
}

/**
 * Resolves single theme value by key path (e.g., "colors.blue.600")
 * @param keyPath Dot-separated key path
 * @param themeJson Theme as JSON
 * @returns Resolved value or null if not found
 */
export const resolve_theme_value = (keyPath: string, themeJson: string): string | null => {
  const bridge = getNativeBridge()
  if (!bridge.resolve_theme_value) throw new Error("resolve_theme_value not available")
  return safeCallNative("resolve_theme_value", () => bridge.resolve_theme_value!(keyPath, themeJson))
}

/**
 * Resolves simple variants (fast path without full config processing)
 * @param configJson Simple variant config as JSON
 * @returns Resolved variants as JSON string
 */
export const resolve_simple_variants = (configJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolve_simple_variants) throw new Error("resolve_simple_variants not available")
  return safeCallNative("resolve_simple_variants", () => bridge.resolve_simple_variants!(configJson))
}


/**
 * Generates CSS from a single CSS rule
 * @param ruleJson JSON representation of CssRule
 * @param minify Whether to minify the CSS output
 * @returns Generated CSS string
 */
export const generate_css = (ruleJson: string, minify?: boolean | null): string => {
  const bridge = getNativeBridge()
  if (!bridge.generate_css) throw new Error("generate_css not available")
  return safeCallNative("generate_css", () => bridge.generate_css!(ruleJson, minify))
}

/**
 * Generates CSS from multiple CSS rules in batch
 * @param rulesJson JSON array of CssRule objects
 * @param minify Whether to minify the CSS output
 * @returns Combined CSS string
 */
export const generate_css_batch = (rulesJson: string, minify?: boolean | null): string => {
  const bridge = getNativeBridge()
  if (!bridge.generate_css_batch) throw new Error("generate_css_batch not available")
  return safeCallNative("generate_css_batch", () => bridge.generate_css_batch!(rulesJson, minify))
}

// ── CSS OPTIMIZATION FUNCTIONS (12 total) ──────────────────────────────────

/**
 * Detects dead CSS: identifies unused rules from generated CSS
 * @param scanResultJson Scan result as JSON
 * @param css Generated CSS content
 * @returns Dead code analysis as JSON string
 */
export const detect_dead_code = (scanResultJson: string, css: string): DeadCodeResult => {
  const bridge = getNativeBridge()
  if (!bridge.detectDeadCode) throw new Error("detectDeadCode not available")
  return safeCallNative("detectDeadCode", () => bridge.detectDeadCode!(scanResultJson, css))
}

/**
 * Eliminates dead CSS: removes unused rules from CSS output
 * @param css CSS content
 * @param deadClasses Array of dead class names to remove
 * @returns Optimized CSS
 */
export const eliminate_dead_css = (css: string, deadClasses: string[]): string => {
  const bridge = getNativeBridge()
  if (!bridge.eliminateDeadCss) throw new Error("eliminateDeadCss not available")
  return safeCallNative("eliminateDeadCss", () => bridge.eliminateDeadCss!(css, deadClasses))
}

/**
 * Optimizes CSS: end-to-end optimization including dead code and minification
 * @param css CSS content to optimize
 * @returns Optimized CSS
 */
export const optimize_css = (css: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.optimizeCss) throw new Error("optimizeCss not available")
  return safeCallNative("optimizeCss", () => bridge.optimizeCss!(css))
}

/**
 * Processes Tailwind CSS with LightningCSS for minification
 * @param css CSS content
 * @returns Processed CSS result as JSON string
 */
export const process_tailwind_css_lightning = (css: string): ProcessedCssResult => {
  const bridge = getNativeBridge()
  if (!bridge.processTailwindCssLightning) throw new Error("processTailwindCssLightning not available")
  return safeCallNative("processTailwindCssLightning", () => bridge.processTailwindCssLightning!(css))
}

/**
 * Processes Tailwind CSS with targets (for targeted minification)
 * @param css CSS content
 * @param targets Optional target browsers string
 * @returns Processed CSS result as JSON string
 */
export const process_tailwind_css_with_targets = (css: string, targets?: string | null): ProcessedCssResult => {
  const bridge = getNativeBridge()
  if (!bridge.processTailwindCssWithTargets) throw new Error("processTailwindCssWithTargets not available")
  const result = safeCallNative("processTailwindCssWithTargets", () => bridge.processTailwindCssWithTargets!(css, targets ?? null))
  // Cast to ProcessedCssResult - bridge returns partial shape
  return {
    ...result,
    resolved_classes: [],
    unknown_classes: [],
  }
}

/**
 * Parses Tailwind class into atomic form
 * @param twClass Tailwind class name
 * @returns Atomic CSS rule or null if not parseable
 */
export const parse_atomic_class = (twClass: string): string | null => {
  const bridge = getNativeBridge()
  if (!bridge.parseAtomicClass) throw new Error("parseAtomicClass not available")
  return safeCallNative("parseAtomicClass", () => bridge.parseAtomicClass!(twClass))
}

/**
 * Generates atomic CSS from rules
 * @param rulesJson Array of CSS rules as JSON
 * @returns Generated CSS
 */
export const generate_atomic_css = (rulesJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.generateAtomicCss) throw new Error("generateAtomicCss not available")
  return safeCallNative("generateAtomicCss", () => bridge.generateAtomicCss!(rulesJson))
}

/**
 * Converts Tailwind classes to atomic form
 * @param twClasses Space-separated Tailwind classes
 * @returns Atomic class list
 */
export const to_atomic_classes = (twClasses: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.toAtomicClasses) throw new Error("toAtomicClasses not available")
  return safeCallNative("toAtomicClasses", () => bridge.toAtomicClasses!(twClasses))
}

/**
 * Clears atomic CSS registry
 */
export const clear_atomic_registry = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.clearAtomicRegistry) throw new Error("clearAtomicRegistry not available")
  safeCallNative("clearAtomicRegistry", () => bridge.clearAtomicRegistry!())
}

/**
 * Gets atomic CSS registry size
 * @returns Number of atomic classes in registry
 */
export const get_atomic_registry_size = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.atomicRegistrySize) throw new Error("atomicRegistrySize not available")
  return safeCallNative("atomicRegistrySize", () => bridge.atomicRegistrySize!())
}

// ── ANALYSIS FUNCTIONS (8 total) ───────────────────────────────────────────

/**
 * Analyzes component class usage from scan results
 * @param classes Array of class names to analyze
 * @param scanResultJson Scan result as JSON
 * @param css Generated CSS
 * @returns Array of class usage items as JSON string
 */
export const analyze_class_usage = (classes: string[], scanResultJson: string, css: string): ClassUsageItem[] => {
  const bridge = getNativeBridge()
  if (!bridge.analyzeClassUsage) throw new Error("analyzeClassUsage not available")
  return safeCallNative("analyzeClassUsage", () => bridge.analyzeClassUsage!(classes, scanResultJson, css))
}

/**
 * Calculates impact of class changes
 * @param impactJson Impact data as JSON
 * @returns Impact analysis as JSON string
 */
export const calculate_impact = (impactJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.calculateImpact) throw new Error("calculateImpact not available")
  return safeCallNative("calculateImpact", () => bridge.calculateImpact!(impactJson))
}

/**
 * Calculates risk of removing a class
 * @param className Class to analyze
 * @param totalComponents Total number of components in project
 * @returns Risk assessment as JSON string
 */
export const calculate_risk = (className: string, totalComponents: number): string => {
  const bridge = getNativeBridge()
  if (!bridge.calculateRisk) throw new Error("calculateRisk not available")
  return safeCallNative("calculateRisk", () => bridge.calculateRisk!(className, totalComponents))
}

/**
 * Calculates bundle savings from optimization
 * @param bundleSizeBytes Current bundle size in bytes
 * @param componentCount Number of components
 * @returns Savings estimate in bytes
 */
export const calculate_savings = (bundleSizeBytes: number, componentCount: number): number => {
  const bridge = getNativeBridge()
  if (!bridge.calculateSavings) throw new Error("calculateSavings not available")
  return safeCallNative("calculateSavings", () => bridge.calculateSavings!(bundleSizeBytes, componentCount))
}

// ── TYPE DEFINITIONS: Cache ──────────────────────────────────────────────────

export interface CacheStatsResult {
  status: "ok"
  data: {
    total_hits: number
    total_misses: number
    hit_rate: number
    cache_backends: Record<string, unknown>
    theme_resolver_pool: {
      hits: number
      misses: number
      total: number
      hit_rate: number
      cached_resolvers: number
    }
  }
}

export interface RecommendedCacheConfig {
  parse_cache_size: number
  resolve_cache_size: number
  compile_cache_size: number
  css_gen_cache_size: number
  recommended_eviction_policy: string
  ttl_seconds: number
  expected_hit_rate_percent: number
}

export interface ResolverPoolStatsResult {
  hits: number
  misses: number
  total: number
  hit_rate: number
  cached_resolvers: number
}

export interface CacheOptimizationHintsResult {
  current_strategy: string
  recommended_strategy: string
  estimated_improvement_percent: number
  suggested_memory_mb: number
  notes: string[]
}

export interface StreamingBatchSizeResult {
  recommended_batch_size: number
  target_memory_mb: number
  estimated_memory_per_item_bytes: number
  notes: string
}

// ── TYPE DEFINITIONS: Parsing ────────────────────────────────────────────────

export interface ParsedClassResult {
  prefix: string
  value: string
  variants: string[]
  modifier?: string
  arbitrary_declaration?: string
}

export interface CompiledClassResult {
  prefix: string
  value: string
  resolved: string
  variants: string[]
  modifier?: string
}

export interface ClassAnalysisResult {
  total: number
  unique_prefixes: number
  prefixes: string[]
  variant_distribution: Record<string, number>
  error_count: number
  errors: string[]
}

export interface ParseStatsResult {
  hits: number
  misses: number
  total: number
  hit_rate: number
}

// ── TYPE DEFINITIONS: Watch (infrastructure) ────────────────────────────────

export interface WatchHandleResult {
  status: string
  handle_id: number
}

export interface WatchFileEvent {
  kind: string
  path: string
  timestamp_ms: number
}

export interface WatchPerformanceResult {
  avg_event_latency_ms: number
  max_event_latency_ms: number
  min_event_latency_ms: number
  total_processed: number
}

// ── TYPE DEFINITIONS: Week 6 ─────────────────────────────────────────────────

export interface OptimizationRecommendationsResult {
  recommendations: string[]
  priority: "low" | "medium" | "high"
  estimated_improvement_percent: number
}

export interface CachingStrategyResult {
  strategy: string
  rationale: string
  settings: Record<string, unknown>
}

export interface BenchmarkResult {
  streaming_ops_per_sec: number
  buffered_ops_per_sec: number
  winner: "streaming" | "buffered"
  notes: string
}

export interface Week6StatusResult {
  features_enabled: string[]
  optimization_level: string
  memory_pressure: "low" | "medium" | "high"
}

// ── TYPE DEFINITIONS: Scan Cache ─────────────────────────────────────────────

export interface ScanCacheStatsResult {
  size: number
}

// ── CACHE WRAPPERS ────────────────────────────────────────────────────────────

/**
 * Configure the global cache backend.
 * @param config - { backend, maxCapacity?, redisUrl?, persistDir? }
 */
export const configure_cache_backend = (config: {
  backend: "lru" | "redis" | "persistent" | "adaptive"
  max_capacity?: number
  redis_url?: string
  persist_dir?: string
}): { status: string; backend: string } => {
  const bridge = getNativeBridge()
  if (!bridge.configureCacheBackend) throw new Error("configureCacheBackend not available")
  const result = safeCallNative("configureCacheBackend", () =>
    bridge.configureCacheBackend!(JSON.stringify(config))
  )
  return parseNativeJson(result, "configureCacheBackend")
}

/**
 * Get comprehensive cache statistics including resolver pool.
 */
export const get_cache_stats = (): CacheStatsResult => {
  const bridge = getNativeBridge()
  if (!bridge.getCacheStats) throw new Error("getCacheStats not available")
  const result = safeCallNative("getCacheStats", () => bridge.getCacheStats!())
  // Handle [number, number] tuple return type from native bridge
  if (Array.isArray(result) && result.length === 2) {
    return parseNativeJson(JSON.stringify(result), "getCacheStats")
  }
  return parseNativeJson(String(result), "getCacheStats")
}

/**
 * Get recommended cache config for a workload type.
 * @param workloadType - "build" | "dev" | "test" | "production"
 */
export const get_recommended_cache_config = (workloadType: string): RecommendedCacheConfig => {
  const bridge = getNativeBridge()
  if (!bridge.getRecommendedCacheConfig) throw new Error("getRecommendedCacheConfig not available")
  const result = safeCallNative("getRecommendedCacheConfig", () =>
    bridge.getRecommendedCacheConfig!(workloadType)
  )
  return parseNativeJson(result, "getRecommendedCacheConfig")
}

/** Clear all caches (parse, resolve, compile, css-gen). */
export const clear_all_caches_napi = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.clearAllCachesNapi) throw new Error("clearAllCachesNapi not available")
  safeCallNative("clearAllCachesNapi", () => bridge.clearAllCachesNapi!())
}

/** Clear only the resolve cache. */
export const clear_resolve_cache_napi = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.clearResolveCacheNapi) throw new Error("clearResolveCacheNapi not available")
  safeCallNative("clearResolveCacheNapi", () => bridge.clearResolveCacheNapi!())
}

/** Clear only the compile cache. */
export const clear_compile_cache_napi = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.clearCompileCacheNapi) throw new Error("clearCompileCacheNapi not available")
  safeCallNative("clearCompileCacheNapi", () => bridge.clearCompileCacheNapi!())
}

/** Clear only the CSS generation cache. */
export const clear_css_gen_cache_napi = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.clearCssGenCacheNapi) throw new Error("clearCssGenCacheNapi not available")
  safeCallNative("clearCssGenCacheNapi", () => bridge.clearCssGenCacheNapi!())
}

/** Get theme resolver pool statistics. */
export const get_resolver_pool_stats = (): ResolverPoolStatsResult => {
  const bridge = getNativeBridge()
  if (!bridge.getResolverPoolStats) throw new Error("getResolverPoolStats not available")
  const result = safeCallNative("getResolverPoolStats", () => bridge.getResolverPoolStats!())
  return parseNativeJson(result, "getResolverPoolStats")
}

/** Clear and reset the resolver pool. */
export const clear_resolver_pool = (): { status: string } => {
  const bridge = getNativeBridge()
  if (!bridge.clearResolverPool) throw new Error("clearResolverPool not available")
  const result = safeCallNative("clearResolverPool", () => bridge.clearResolverPool!())
  return parseNativeJson(result, "clearResolverPool")
}

/**
 * Resolves a color value using the resolver pool (cached per themeId)
 * @param themeId Unique identifier for the theme configuration
 * @param color Color name or reference (e.g., "blue-600")
 * @param configJson Theme configuration as JSON string
 * @returns Resolved color value
 */
export const resolve_color_cached = (themeId: number, color: string, configJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolveColorCached) throw new Error("resolveColorCached not available")
  return safeCallNative("resolveColorCached", () => bridge.resolveColorCached!(themeId, color, configJson))
}

/**
 * Resolves a spacing value using the resolver pool (cached per themeId)
 * @param themeId Unique identifier for the theme configuration
 * @param spacing Spacing key (e.g., "4", "px")
 * @param configJson Theme configuration as JSON string
 * @returns Resolved spacing value
 */
export const resolve_spacing_cached = (themeId: number, spacing: string, configJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolveSpacingCached) throw new Error("resolveSpacingCached not available")
  return safeCallNative("resolveSpacingCached", () => bridge.resolveSpacingCached!(themeId, spacing, configJson))
}

/**
 * Resolves a font size value using the resolver pool (cached per themeId)
 * @param themeId Unique identifier for the theme configuration
 * @param size Font size key (e.g., "sm", "lg")
 * @param configJson Theme configuration as JSON string
 * @returns Resolved font size value
 */
export const resolve_font_size_cached = (themeId: number, size: string, configJson: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolveFontSizeCached) throw new Error("resolveFontSizeCached not available")
  return safeCallNative("resolveFontSizeCached", () => bridge.resolveFontSizeCached!(themeId, size, configJson))
}

/**
 * Resets resolver pool statistics while keeping cached resolvers
 */
export const reset_resolver_pool_stats = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.resetResolverPoolStats) throw new Error("resetResolverPoolStats not available")
  safeCallNative("resetResolverPoolStats", () => bridge.resetResolverPoolStats!())
}

/** Get cache optimization hints based on current stats. */
export const get_cache_optimization_hints = (): CacheOptimizationHintsResult => {
  const bridge = getNativeBridge()
  if (!bridge.getCacheOptimizationHints) throw new Error("getCacheOptimizationHints not available")
  const result = safeCallNative("getCacheOptimizationHints", () => bridge.getCacheOptimizationHints!())
  return parseNativeJson(result, "getCacheOptimizationHints")
}

/**
 * Estimate streaming batch size for a given memory target.
 * @param targetMemoryMb - Target memory budget in MB
 */
export const estimate_streaming_batch_size = (targetMemoryMb: number): StreamingBatchSizeResult => {
  const bridge = getNativeBridge()
  if (!bridge.estimateStreamingBatchSize) throw new Error("estimateStreamingBatchSize not available")
  const result = safeCallNative("estimateStreamingBatchSize", () =>
    bridge.estimateStreamingBatchSize!(targetMemoryMb)
  )
  return parseNativeJson(result, "estimateStreamingBatchSize")
}

// ── PARSING WRAPPERS ──────────────────────────────────────────────────────────

/**
 * Parse a single Tailwind class into its components.
 * @param input - e.g. "md:hover:bg-blue-600/50"
 */
export const parse_class = (input: string): ParsedClassResult => {
  const bridge = getNativeBridge()
  if (!bridge.parseClass) throw new Error("parseClass not available")
  const result = safeCallNative("parseClass", () => bridge.parseClass!(input))
  return parseNativeJson(result, "parseClass")
}

/**
 * Parse multiple Tailwind classes in batch (parallelised in Rust via rayon).
 * @param inputs - Array of class strings
 */
export const parse_classes = (inputs: string[]): ParsedClassResult[] => {
  const bridge = getNativeBridge()
  if (!bridge.parseClasses) throw new Error("parseClasses not available")
  const result = safeCallNative("parseClasses", () => bridge.parseClasses!(JSON.stringify(inputs)))
  // parseClasses returns an array of parsed class objects
  if (Array.isArray(result)) {
    return result as unknown as ParsedClassResult[]
  }
  return parseNativeJson(String(result), "parseClasses")
}

/**
 * Analyze a set of classes for variant distribution and prefix stats.
 * @param classes - Array of class strings
 */
export const analyze_classes = (classes: string[]): ClassAnalysisResult => {
  const bridge = getNativeBridge()
  if (!bridge.analyzeClasses) throw new Error("analyzeClasses not available")
  const cwd = typeof process !== 'undefined' ? process.cwd() : '.'
  const result = safeCallNative("analyzeClasses", () =>
    bridge.analyzeClasses!(JSON.stringify(classes), cwd, 0)
  )
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result as unknown as ClassAnalysisResult
  }
  return parseNativeJson(String(result), "analyzeClasses")
}

/**
 * Run parse → resolve → generate pipeline for a single class.
 * @param input - Tailwind class string
 */
export const compile_class_napi = (input: string): CompiledClassResult => {
  const bridge = getNativeBridge()
  if (!bridge.compileClassNapi) throw new Error("compileClassNapi not available")
  const result = safeCallNative("compileClassNapi", () => bridge.compileClassNapi!(input))
  return parseNativeJson(result, "compileClassNapi")
}

/** Get parse cache hit/miss statistics. */
export const get_parse_stats = (): ParseStatsResult => {
  const bridge = getNativeBridge()
  if (!bridge.getParseStats) throw new Error("getParseStats not available")
  const result = safeCallNative("getParseStats", () => bridge.getParseStats!())
  return parseNativeJson(result, "getParseStats")
}

/** Clear the parse cache and reset its statistics. */
export const clear_parse_cache_napi = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.clearParseCacheNapi) throw new Error("clearParseCacheNapi not available")
  safeCallNative("clearParseCacheNapi", () => bridge.clearParseCacheNapi!())
}

// ── WATCH WRAPPERS (infrastructure) ──────────────────────────────────────────

/**
 * Start watching a directory using the Rust `notify` crate.
 * Different from `start_watch` — uses a handle_id-based API from napi_bridge_watch.rs.
 * @param rootDir - Root directory to watch
 * @param options - Optional JSON config (patterns, debounceMs)
 */
export const watch_files = (
  rootDir: string,
  options?: { patterns?: string[]; debounce_ms?: number }
): WatchHandleResult => {
  const bridge = getNativeBridge()
  if (!bridge.watchFiles) throw new Error("watchFiles not available")
  const result = safeCallNative("watchFiles", () =>
    bridge.watchFiles!(rootDir, options ? JSON.stringify(options) : null)
  )
  return parseNativeJson(result, "watchFiles")
}

/**
 * Stop a watcher started by `watch_files`.
 * @param handleId - Handle ID from watchFiles result
 */
export const stop_watching = (handleId: number): { status: string } => {
  const bridge = getNativeBridge()
  if (!bridge.stopWatching) throw new Error("stopWatching not available")
  const result = safeCallNative("stopWatching", () => bridge.stopWatching!(handleId))
  return parseNativeJson(result, "stopWatching")
}

/**
 * Drain queued file events for a watch handle.
 * @param handleId - Handle ID from watchFiles
 * @param maxEvents - Max events to return (default: all)
 */
export const get_watch_events = (handleId: number, maxEvents?: number): WatchFileEvent[] => {
  const bridge = getNativeBridge()
  if (!bridge.getWatchEvents) throw new Error("getWatchEvents not available")
  const result = safeCallNative("getWatchEvents", () =>
    bridge.getWatchEvents!(handleId, maxEvents ?? null)
  )
  return parseNativeJson(result, "getWatchEvents")
}

/** Get watcher latency and throughput performance metrics. */
export const get_watch_performance = (): WatchPerformanceResult => {
  const bridge = getNativeBridge()
  if (!bridge.getWatchPerformance) throw new Error("getWatchPerformance not available")
  const result = safeCallNative("getWatchPerformance", () => bridge.getWatchPerformance!())
  return parseNativeJson(result, "getWatchPerformance")
}

/** Reset all watch statistics counters. */
export const clear_watch_stats = (): { status: string } => {
  const bridge = getNativeBridge()
  if (!bridge.clearWatchStats) throw new Error("clearWatchStats not available")
  const result = safeCallNative("clearWatchStats", () => bridge.clearWatchStats!())
  return parseNativeJson(result, "clearWatchStats")
}

/** Returns the number of currently active watch handles. */
export const get_active_watches = (): number => {
  const bridge = getNativeBridge()
  if (!bridge.getActiveWatches) throw new Error("getActiveWatches not available")
  return safeCallNative("getActiveWatches", () => bridge.getActiveWatches!())
}

/**
 * Set a custom metric on the watcher.
 * @param metricName - Metric key
 * @param value - Metric value as string
 */
export const set_watch_metrics = (metricName: string, value: string): { status: string; metric: string; value: string } => {
  const bridge = getNativeBridge()
  if (!bridge.setWatchMetrics) throw new Error("setWatchMetrics not available")
  const result = safeCallNative("setWatchMetrics", () => bridge.setWatchMetrics!(metricName, value))
  return parseNativeJson(result, "setWatchMetrics")
}

/**
 * Set event aggregation strategy.
 * @param aggregationType - "debounce" | "throttle" | "batch" | "immediate"
 */
export const set_watch_aggregation = (aggregationType: string): { status: string; aggregation_type: string } => {
  const bridge = getNativeBridge()
  if (!bridge.setWatchAggregation) throw new Error("setWatchAggregation not available")
  const result = safeCallNative("setWatchAggregation", () => bridge.setWatchAggregation!(aggregationType))
  return parseNativeJson(result, "setWatchAggregation")
}

// ── WEEK 6 WRAPPERS ───────────────────────────────────────────────────────────

/**
 * Get optimization recommendations based on runtime metrics.
 * @param hitRate - Cache hit rate as integer percent (0-100)
 * @param memoryMb - Current memory usage in MB
 * @param classCount - Number of unique classes being processed
 */
export const get_optimization_recommendations = (
  hitRate: number,
  memoryMb: number,
  classCount: number
): OptimizationRecommendationsResult => {
  const bridge = getNativeBridge()
  if (!bridge.getOptimizationRecommendations) throw new Error("getOptimizationRecommendations not available")
  const result = safeCallNative("getOptimizationRecommendations", () =>
    bridge.getOptimizationRecommendations!(hitRate, memoryMb, classCount)
  )
  return parseNativeJson(result, "getOptimizationRecommendations")
}

/**
 * Estimate optimal batch size given memory constraints.
 * @param totalClasses - Total number of classes to process
 * @param memoryAvailableMb - Available memory in MB
 */
export const estimate_optimal_batch_size = (
  totalClasses: number,
  memoryAvailableMb: number
): number => {
  const bridge = getNativeBridge()
  if (!bridge.estimateOptimalBatchSize) throw new Error("estimateOptimalBatchSize not available")
  return safeCallNative("estimateOptimalBatchSize", () =>
    bridge.estimateOptimalBatchSize!(totalClasses, memoryAvailableMb)
  )
}

/**
 * Predict memory usage for a given class set size.
 * @param uniqueClasses - Number of unique class names
 * @param avgClassSizeBytes - Average byte size per class
 * @returns Predicted memory usage in bytes
 */
export const predict_memory_usage = (
  uniqueClasses: number,
  avgClassSizeBytes: number
): number => {
  const bridge = getNativeBridge()
  if (!bridge.predictMemoryUsage) throw new Error("predictMemoryUsage not available")
  return safeCallNative("predictMemoryUsage", () =>
    bridge.predictMemoryUsage!(uniqueClasses, avgClassSizeBytes)
  )
}

/**
 * Get caching strategy recommendation.
 * @param isSsr - Whether running in SSR context
 * @param memoryConstraintMb - Available memory budget in MB
 */
export const recommend_caching_strategy = (
  isSsr: boolean,
  memoryConstraintMb: number
): CachingStrategyResult => {
  const bridge = getNativeBridge()
  if (!bridge.recommendCachingStrategy) throw new Error("recommendCachingStrategy not available")
  const result = safeCallNative("recommendCachingStrategy", () =>
    bridge.recommendCachingStrategy!(isSsr, memoryConstraintMb)
  )
  return parseNativeJson(result, "recommendCachingStrategy")
}

/**
 * Benchmark streaming vs buffered processing.
 * @param classCount - Number of classes to benchmark
 */
export const benchmark_streaming_vs_buffered = (classCount: number): BenchmarkResult => {
  const bridge = getNativeBridge()
  if (!bridge.benchmarkStreamingVsBuffered) throw new Error("benchmarkStreamingVsBuffered not available")
  const result = safeCallNative("benchmarkStreamingVsBuffered", () =>
    bridge.benchmarkStreamingVsBuffered!(classCount)
  )
  return parseNativeJson(result, "benchmarkStreamingVsBuffered")
}

/** Get Week 6 optimization feature status and memory pressure level. */
export const get_week6_optimization_status = (): Week6StatusResult => {
  const bridge = getNativeBridge()
  if (!bridge.getWeek6OptimizationStatus) throw new Error("getWeek6OptimizationStatus not available")
  const result = safeCallNative("getWeek6OptimizationStatus", () => bridge.getWeek6OptimizationStatus!())
  return parseNativeJson(result, "getWeek6OptimizationStatus")
}

// ── SCAN CACHE WRAPPERS ───────────────────────────────────────────────────────

/**
 * Get cached classes for a file by content hash. Returns null on miss.
 * @param filePath - Absolute file path
 * @param contentHash - Hash of file content
 */
export const scan_cache_get = (filePath: string, contentHash: string): string[] | null => {
  const bridge = getNativeBridge()
  if (!bridge.scanCacheGet) throw new Error("scanCacheGet not available")
  return safeCallNative("scanCacheGet", () => bridge.scanCacheGet!(filePath, contentHash)) ?? null
}

/**
 * Store class extraction result in the scan cache.
 * @param filePath - Absolute file path
 * @param contentHash - Hash of file content
 * @param classes - Extracted class names
 * @param mtimeMs - File modification time in ms
 * @param size - File size in bytes
 */
export const scan_cache_put = (
  filePath: string,
  contentHash: string,
  classes: string[],
  mtimeMs: number,
  size: number
): void => {
  const bridge = getNativeBridge()
  if (!bridge.scanCachePut) throw new Error("scanCachePut not available")
  safeCallNative("scanCachePut", () =>
    bridge.scanCachePut!(filePath, contentHash, classes, mtimeMs, size)
  )
}

/**
 * Invalidate a single cache entry (e.g. file deleted or renamed).
 * @param filePath - Absolute file path
 */
export const scan_cache_invalidate = (filePath: string): void => {
  const bridge = getNativeBridge()
  if (!bridge.scanCacheInvalidate) throw new Error("scanCacheInvalidate not available")
  safeCallNative("scanCacheInvalidate", () => bridge.scanCacheInvalidate!(filePath))
}

/** Return number of entries currently in the scan cache. */
export const scan_cache_stats = (): ScanCacheStatsResult => {
  const bridge = getNativeBridge()
  if (!bridge.scanCacheStats) throw new Error("scanCacheStats not available")
  return safeCallNative("scanCacheStats", () => bridge.scanCacheStats!())
}

// ── TYPE DEFINITIONS: Analysis & Memory Profiling ───────────────────────────

export interface MemoryStatsResult {
  status: string
  memory: {
    allocated_bytes: number
    freed_bytes: number
    in_use_bytes: number
    allocated_mb: number
    freed_mb: number
    in_use_mb: number
  }
  system: {
    cache_entries: number
    active_operations: number
  }
}

export interface MemoryRecommendationsResult {
  status: string
  current_memory_mb: number
  recommendation: string
  priority: string
  suggestions: string[]
}

export interface OptimalCacheConfigResult {
  status: string
  workload_type: string
  expected_entries: number
  recommended_backend: string
  recommended_capacity: number
  estimated_memory_mb: number
  ttl_seconds: number
  details: {
    backend_explanation: string
    capacity_explanation: string
    memory_estimate: string
  }
}

export interface Week6FeaturesStatusResult {
  status: string
  week: number
  features: Record<string, {
    implemented: boolean
    status: string
    capacity?: string
    hit_rate_optimization?: boolean
    metrics?: string[]
  }>
  optimization_hints: Record<string, string>
}

// ── ANALYSIS & MEMORY PROFILING WRAPPERS ────────────────────────────────────

/** Get Week 6 features status */
export const get_week6_features_status = (): Week6FeaturesStatusResult => {
  const bridge = getNativeBridge()
  if (!bridge.getWeek6FeaturesStatus) throw new Error("getWeek6FeaturesStatus not available")
  const result = safeCallNative("getWeek6FeaturesStatus", () => bridge.getWeek6FeaturesStatus!())
  return parseNativeJson(result, "getWeek6FeaturesStatus")
}

/** Get current memory statistics */
export const get_memory_stats_native = (): MemoryStatsResult => {
  const bridge = getNativeBridge()
  if (!bridge.getMemoryStatsNative) throw new Error("getMemoryStatsNative not available")
  const result = safeCallNative("getMemoryStatsNative", () => bridge.getMemoryStatsNative!())
  return parseNativeJson(result, "getMemoryStatsNative")
}

/** Get memory recommendations */
export const get_memory_recommendations_native = (): MemoryRecommendationsResult => {
  const bridge = getNativeBridge()
  if (!bridge.getMemoryRecommendationsNative) throw new Error("getMemoryRecommendationsNative not available")
  const result = safeCallNative("getMemoryRecommendationsNative", () => bridge.getMemoryRecommendationsNative!())
  return parseNativeJson(result, "getMemoryRecommendationsNative")
}

/** Estimate optimal cache configuration from analysis */
export const estimate_optimal_cache_config_native = (
  workloadType: string,
  expectedEntries: number
): OptimalCacheConfigResult => {
  const bridge = getNativeBridge()
  if (!bridge.estimateOptimalCacheConfigNative) throw new Error("estimateOptimalCacheConfigNative not available")
  const result = safeCallNative("estimateOptimalCacheConfigNative", () =>
    bridge.estimateOptimalCacheConfigNative!(workloadType, expectedEntries)
  )
  return parseNativeJson(result, "estimateOptimalCacheConfigNative")
}

/** Reset memory statistics */
export const reset_memory_stats = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.resetMemoryStats) throw new Error("resetMemoryStats not available")
  safeCallNative("resetMemoryStats", () => bridge.resetMemoryStats!())
}

/** Resolve a color value from the theme without cache */
export const resolve_color = (color: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolveColor) throw new Error("resolveColor not available")
  return safeCallNative("resolveColor", () => bridge.resolveColor!(color))
}

/** Resolve a spacing value from the theme without cache */
export const resolve_spacing = (spacing: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolveSpacing) throw new Error("resolveSpacing not available")
  return safeCallNative("resolveSpacing", () => bridge.resolveSpacing!(spacing))
}

/** Resolve a font size value from the theme without cache */
export const resolve_font_size = (size: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolveFontSize) throw new Error("resolveFontSize not available")
  return safeCallNative("resolveFontSize", () => bridge.resolveFontSize!(size))
}

/** Resolve a breakpoint value from the theme without cache */
export const resolve_breakpoint = (breakpoint: string): string => {
  const bridge = getNativeBridge()
  if (!bridge.resolveBreakpoint) throw new Error("resolveBreakpoint not available")
  return safeCallNative("resolveBreakpoint", () => bridge.resolveBreakpoint!(breakpoint))
}

/** Gets Redis configuration info from native client */
export const redis_get_config = (): Record<string, unknown> => {
  const bridge = getNativeBridge()
  if (!bridge.redisGetConfig) throw new Error("redisGetConfig not available")
  const result = safeCallNative("redisGetConfig", () => bridge.redisGetConfig!())
  return parseNativeJson<Record<string, unknown>>(result, "redisGetConfig")
}

/** Shutdown Redis connection from native client */
export const redis_shutdown = (): { status: string; message: string } => {
  const bridge = getNativeBridge()
  if (!bridge.redisShutdown) throw new Error("redisShutdown not available")
  const result = safeCallNative("redisShutdown", () => bridge.redisShutdown!())
  return parseNativeJson<{ status: string; message: string }>(result, "redisShutdown")
}

/** Synchronizes Redis cluster nodes manually */
export const redis_sync_nodes = (): { status: string; message: string } => {
  const bridge = getNativeBridge()
  if (!bridge.redisSyncNodes) throw new Error("redisSyncNodes not available")
  const result = safeCallNative("redisSyncNodes", () => bridge.redisSyncNodes!())
  return parseNativeJson<{ status: string; message: string }>(result, "redisSyncNodes")
}

/** Reset native compiler caches statistics */
export const reset_cache_stats = (): void => {
  const bridge = getNativeBridge()
  if (!bridge.resetCacheStats) throw new Error("resetCacheStats not available")
  safeCallNative("resetCacheStats", () => bridge.resetCacheStats!())
}