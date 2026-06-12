/**
 * redisNative.ts
 *
 * Phase 5.3: Redis Integration - Distributed caching and cluster support
 * Exposes 40 Redis functions for high-performance distributed CSS compilation caching
 */

import { getNativeBridge } from "../nativeBridge"

/**
 * Redis pool configuration
 */
export interface RedisCacheConfig {
  host: string
  port: number
  database: number
  password?: string
  pool_size: number
  connection_timeout_ms: number
}

/**
 * Redis pool statistics
 */
export interface RedisPoolStats {
  connected_count: number
  idle_count: number
  waiting_count: number
  total_requests: number
  total_errors: number
}

/**
 * Redis cluster node information
 */
export interface RedisClusterNode {
  node_id: string
  host: string
  port: number
  is_master: boolean
  slot_range: Array<{ start: number; end: number }>
  connected: boolean
}

/**
 * Redis cluster status
 */
export interface RedisClusterStatus {
  enabled: boolean
  cluster_state: string
  nodes: RedisClusterNode[]
  slots_assigned: number
  slots_ok: number
  slots_fail: number
}

/**
 * Key expiration information
 */
export interface KeyExpiration {
  key: string
  ttl_seconds: number
  expiration_timestamp: number
  is_persistent: boolean
}

/**
 * Pub/Sub message
 */
export interface PubSubMessage {
  channel: string
  message: string
  timestamp_ms: number
  subscriber_count: number
}

/**
 * Connection pool information
 */
export interface PoolInfo {
  host: string
  port: number
  pool_size: number
  active_connections: number
  idle_connections: number
  average_latency_ms: number
}

/**
 * Ping Redis server for connectivity check
 *
 * @returns "PONG" if connected, error message otherwise
 *
 * @example
 * ```ts
 * const response = redisPing()
 * if (response === "PONG") console.log("Connected")
 * ```
 */
export function redisPing(): string {
  const native = getNativeBridge()
  if (!native?.redis_ping) throw new Error("redis_ping not available")
  return native.redis_ping()
}

/**
 * Get value from Redis
 *
 * @param key - Cache key
 * @returns Value if found, null if not found
 *
 * @example
 * ```ts
 * const value = redisGet('compiled:bg-blue-600')
 * if (value) console.log(JSON.parse(value))
 * ```
 */
export function redisGet(key: string): string | null {
  const native = getNativeBridge()
  if (!native?.redis_get) throw new Error("redis_get not available")
  const result = native.redis_get(key)
  return result === "nil" ? null : result
}

/**
 * Set value in Redis
 *
 * @param key - Cache key
 * @param value - Value to store
 * @param ttl_seconds - Time to live in seconds (optional)
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * redisSet('compiled:bg-blue-600', JSON.stringify(css), 3600)
 * ```
 */
export function redisSet(key: string, value: string, ttl_seconds?: number): string {
  const native = getNativeBridge()
  if (!native?.redis_set) throw new Error("redis_set not available")
  return native.redis_set(key, value, ttl_seconds)
}

/**
 * Delete key from Redis
 *
 * @param key - Cache key
 * @returns Number of keys deleted
 *
 * @example
 * ```ts
 * const deleted = redisDelete('compiled:bg-blue-600')
 * console.log(`Deleted ${deleted} keys`)
 * ```
 */
export function redisDelete(key: string): number {
  const native = getNativeBridge()
  if (!native?.redis_delete) throw new Error("redis_delete not available")
  return native.redis_delete(key)
}

/**
 * Check if key exists in Redis
 *
 * @param key - Cache key
 * @returns 1 if exists, 0 if not
 *
 * @example
 * ```ts
 * if (redisExists('compiled:bg-blue-600')) {
 *   console.log('Cache hit')
 * }
 * ```
 */
export function redisExists(key: string): number {
  const native = getNativeBridge()
  if (!native?.redis_exists) throw new Error("redis_exists not available")
  return native.redis_exists(key)
}

/**
 * Get multiple values from Redis (atomic operation)
 *
 * @param keys - Array of cache keys
 * @returns Array of values (null for missing keys)
 *
 * @example
 * ```ts
 * const values = redisMget(['key1', 'key2', 'key3'])
 * ```
 */
export function redisMget(keys: string[]): Array<string | null> {
  const native = getNativeBridge()
  if (!native?.redis_mget) throw new Error("redis_mget not available")
  const result = native.redis_mget(keys)
  try {
    return JSON.parse(result)
  } catch {
    return keys.map(() => null)
  }
}

/**
 * Set multiple key-value pairs in Redis (atomic operation)
 *
 * @param pairs - Array of [key, value] tuples
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * redisMset([
 *   ['key1', 'value1'],
 *   ['key2', 'value2']
 * ])
 * ```
 */
export function redisMset(pairs: Array<[string, string]>): string {
  const native = getNativeBridge()
  if (!native?.redis_mset) throw new Error("redis_mset not available")
  return native.redis_mset(pairs)
}

/**
 * Flush all keys from current Redis database
 *
 * @returns Number of keys deleted
 *
 * @example
 * ```ts
 * const flushed = redisFlushDb()
 * console.log(`Flushed ${flushed} keys from database`)
 * ```
 */
export function redisFlushDb(): number {
  const native = getNativeBridge()
  if (!native?.redis_flush_db) throw new Error("redis_flush_db not available")
  return native.redis_flush_db()
}

/**
 * Flush all keys from all Redis databases (cluster-wide)
 *
 * @returns Number of keys deleted
 *
 * @example
 * ```ts
 * const flushed = redisFlushAll()
 * console.log(`Flushed ${flushed} keys from all databases`)
 * ```
 */
export function redisFlushAll(): number {
  const native = getNativeBridge()
  if (!native?.redis_flush_all) throw new Error("redis_flush_all not available")
  return native.redis_flush_all()
}

/**
 * Initialize Redis connection pool
 *
 * @param host - Redis host (e.g., "localhost")
 * @param port - Redis port (default: 6379)
 * @param pool_size - Connection pool size (default: 32)
 * @returns Pool info JSON
 *
 * @example
 * ```ts
 * const info = redisPoolConnect('localhost', 6379, 32)
 * console.log(info)
 * ```
 */
export function redisPoolConnect(host: string, port: number, pool_size?: number): string {
  const native = getNativeBridge()
  if (!native?.redis_pool_connect) throw new Error("redis_pool_connect not available")
  return native.redis_pool_connect(host, port, pool_size)
}

/**
 * Get Redis pool statistics
 *
 * @returns Pool stats as JSON string
 *
 * @example
 * ```ts
 * const stats = redisPoolStats()
 * const parsed: RedisPoolStats = JSON.parse(stats)
 * console.log(`Connected: ${parsed.connected_count}`)
 * ```
 */
export function redisPoolStats(): RedisPoolStats {
  const native = getNativeBridge()
  if (!native?.redis_pool_stats) throw new Error("redis_pool_stats not available")
  const result = native.redis_pool_stats()
  try {
    return JSON.parse(result)
  } catch {
    return {
      connected_count: 0,
      idle_count: 0,
      waiting_count: 0,
      total_requests: 0,
      total_errors: 0,
    }
  }
}

/**
 * Reconnect Redis pool after disconnect
 *
 * @returns "OK" if reconnected
 *
 * @example
 * ```ts
 * const result = redisPoolReconnect()
 * console.log(result)
 * ```
 */
export function redisPoolReconnect(): string {
  const native = getNativeBridge()
  if (!native?.redis_pool_reconnect) throw new Error("redis_pool_reconnect not available")
  return native.redis_pool_reconnect()
}

/**
 * Enable Redis cluster mode
 *
 * @param initial_nodes - Initial cluster nodes (host:port format)
 * @returns Cluster status JSON
 *
 * @example
 * ```ts
 * const status = redisEnableCluster(['localhost:6379', 'localhost:6380'])
 * ```
 */
export function redisEnableCluster(initial_nodes: string[]): RedisClusterStatus {
  const native = getNativeBridge()
  if (!native?.redis_enable_cluster) throw new Error("redis_enable_cluster not available")
  const result = native.redis_enable_cluster(initial_nodes)
  try {
    return JSON.parse(result)
  } catch {
    return {
      enabled: false,
      cluster_state: "error",
      nodes: [],
      slots_assigned: 0,
      slots_ok: 0,
      slots_fail: 0,
    }
  }
}

/**
 * Disable Redis cluster mode
 *
 * @returns "OK" when disabled
 *
 * @example
 * ```ts
 * const result = redisDisableCluster()
 * ```
 */
export function redisDisableCluster(): string {
  const native = getNativeBridge()
  if (!native?.redis_disable_cluster) throw new Error("redis_disable_cluster not available")
  return native.redis_disable_cluster()
}

/**
 * Get current Redis cluster status
 *
 * @returns Cluster status information
 *
 * @example
 * ```ts
 * const status = redisClusterStatus()
 * if (status.enabled) console.log(`Cluster has ${status.nodes.length} nodes`)
 * ```
 */
export function redisClusterStatus(): RedisClusterStatus {
  const native = getNativeBridge()
  if (!native?.redis_cluster_status) throw new Error("redis_cluster_status not available")
  const result = native.redis_cluster_status()
  try {
    return JSON.parse(result)
  } catch {
    return {
      enabled: false,
      cluster_state: "unknown",
      nodes: [],
      slots_assigned: 0,
      slots_ok: 0,
      slots_fail: 0,
    }
  }
}

/**
 * Subscribe to Redis pub/sub channel
 *
 * @param channel - Channel name
 * @param callback - Function to call on message (optional)
 * @returns Subscription ID
 *
 * @example
 * ```ts
 * const id = redisSubscribe('cache:updates', (msg) => {
 *   console.log(`Update: ${msg.message}`)
 * })
 * ```
 */
export function redisSubscribe(channel: string): string {
  const native = getNativeBridge()
  if (!native?.redis_subscribe) throw new Error("redis_subscribe not available")
  return native.redis_subscribe(channel)
}

/**
 * Publish message to Redis pub/sub channel
 *
 * @param channel - Channel name
 * @param message - Message to publish
 * @returns Number of subscribers that received the message
 *
 * @example
 * ```ts
 * const count = redisPublish('cache:updates', 'CSS compiled')
 * console.log(`Delivered to ${count} subscribers`)
 * ```
 */
export function redisPublish(channel: string, message: string): number {
  const native = getNativeBridge()
  if (!native?.redis_publish) throw new Error("redis_publish not available")
  return native.redis_publish(channel, message)
}

/**
 * Set expiration on key
 *
 * @param key - Cache key
 * @param ttl_seconds - Time to live in seconds
 * @returns 1 if timeout set, 0 if key doesn't exist
 *
 * @example
 * ```ts
 * redisExpirationSet('compiled:bg-blue-600', 3600)
 * ```
 */
export function redisExpirationSet(key: string, ttl_seconds: number): number {
  const native = getNativeBridge()
  if (!native?.redis_expiration_set) throw new Error("redis_expiration_set not available")
  return native.redis_expiration_set(key, ttl_seconds)
}

/**
 * Get expiration info for key
 *
 * @param key - Cache key
 * @returns Expiration information
 *
 * @example
 * ```ts
 * const info = redisExpirationGet('compiled:bg-blue-600')
 * console.log(`TTL: ${info.ttl_seconds} seconds`)
 * ```
 */
export function redisExpirationGet(key: string): KeyExpiration {
  const native = getNativeBridge()
  if (!native?.redis_expiration_get) throw new Error("redis_expiration_get not available")
  const result = native.redis_expiration_get(key)
  try {
    return JSON.parse(result)
  } catch {
    return {
      key,
      ttl_seconds: -1,
      expiration_timestamp: 0,
      is_persistent: true,
    }
  }
}

/**
 * Get Redis server info
 *
 * @returns Server information JSON
 *
 * @example
 * ```ts
 * const info = redisInfo()
 * ```
 */
export function redisInfo(): string {
  const native = getNativeBridge()
  if (!native?.redis_info) throw new Error("redis_info not available")
  return native.redis_info()
}

/**
 * Monitor Redis operations in real-time (for debugging)
 *
 * @returns Monitor output stream
 *
 * @example
 * ```ts
 * const monitor = redisMonitor()
 * // Logs all Redis operations
 * ```
 */
export function redisMonitor(): string {
  const native = getNativeBridge()
  if (!native?.redis_monitor) throw new Error("redis_monitor not available")
  return native.redis_monitor()
}

/**
 * Get size of cache in bytes
 *
 * @returns Total memory usage in bytes
 *
 * @example
 * ```ts
 * const bytes = redisCacheSize()
 * console.log(`Cache: ${bytes / 1024 / 1024} MB`)
 * ```
 */
export function redisCacheSize(): number {
  const native = getNativeBridge()
  if (!native?.redis_cache_size) throw new Error("redis_cache_size not available")
  return native.redis_cache_size()
}

/**
 * Get number of keys in cache
 *
 * @returns Total key count
 *
 * @example
 * ```ts
 * const count = redisCacheKeyCount()
 * console.log(`Cached keys: ${count}`)
 * ```
 */
export function redisCacheKeyCount(): number {
  const native = getNativeBridge()
  if (!native?.redis_cache_key_count) throw new Error("redis_cache_key_count not available")
  return native.redis_cache_key_count()
}

/**
 * Clear Redis cache and reset statistics
 *
 * @returns Number of keys cleared
 *
 * @example
 * ```ts
 * const cleared = redisCacheClear()
 * console.log(`Cleared ${cleared} keys`)
 * ```
 */
export function redisCacheClear(): number {
  const native = getNativeBridge()
  if (!native?.redis_cache_clear) throw new Error("redis_cache_clear not available")
  return native.redis_cache_clear()
}

/**
 * Get Redis cache hit rate statistics
 *
 * @returns Hit rate percentage (0-100)
 *
 * @example
 * ```ts
 * const hitRate = redisCacheHitRate()
 * console.log(`Hit rate: ${hitRate}%`)
 * ```
 */
export function redisCacheHitRate(): number {
  const native = getNativeBridge()
  if (!native?.redis_cache_hit_rate) throw new Error("redis_cache_hit_rate not available")
  return native.redis_cache_hit_rate()
}

/**
 * Enable Redis persistence (AOF/RDB)
 *
 * @param mode - "aof" or "rdb"
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * redisEnablePersistence('aof')
 * ```
 */
export function redisEnablePersistence(mode: string): string {
  const native = getNativeBridge()
  if (!native?.redis_enable_persistence) throw new Error("redis_enable_persistence not available")
  return native.redis_enable_persistence(mode)
}

/**
 * Disable Redis persistence
 *
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * redisDisablePersistence()
 * ```
 */
export function redisDisablePersistence(): string {
  const native = getNativeBridge()
  if (!native?.redis_disable_persistence) throw new Error("redis_disable_persistence not available")
  return native.redis_disable_persistence()
}

/**
 * Save Redis data to disk (snapshot)
 *
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * redisSnapshot()
 * ```
 */
export function redisSnapshot(): string {
  const native = getNativeBridge()
  if (!native?.redis_snapshot) throw new Error("redis_snapshot not available")
  return native.redis_snapshot()
}

/**
 * Get Redis memory statistics and recommendations
 *
 * @returns Memory info JSON
 *
 * @example
 * ```ts
 * const memory = redisMemoryStats()
 * console.log(memory)
 * ```
 */
export function redisMemoryStats(): string {
  const native = getNativeBridge()
  if (!native?.redis_memory_stats) throw new Error("redis_memory_stats not available")
  return native.redis_memory_stats()
}

/**
 * Optimize Redis memory usage
 *
 * @returns Number of keys optimized
 *
 * @example
 * ```ts
 * const optimized = redisOptimizeMemory()
 * console.log(`Optimized ${optimized} keys`)
 * ```
 */
export function redisOptimizeMemory(): number {
  const native = getNativeBridge()
  if (!native?.redis_optimize_memory) throw new Error("redis_optimize_memory not available")
  return native.redis_optimize_memory()
}

/**
 * Set Redis key eviction policy
 *
 * @param policy - LRU, LFU, TTL, RANDOM, etc.
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * redisSetEvictionPolicy('allkeys-lru')
 * ```
 */
export function redisSetEvictionPolicy(policy: string): string {
  const native = getNativeBridge()
  if (!native?.redis_set_eviction_policy) throw new Error("redis_set_eviction_policy not available")
  return native.redis_set_eviction_policy(policy)
}

/**
 * Get current Redis eviction policy
 *
 * @returns Current policy name
 *
 * @example
 * ```ts
 * const policy = redisGetEvictionPolicy()
 * console.log(`Eviction policy: ${policy}`)
 * ```
 */
export function redisGetEvictionPolicy(): string {
  const native = getNativeBridge()
  if (!native?.redis_get_eviction_policy) throw new Error("redis_get_eviction_policy not available")
  return native.redis_get_eviction_policy()
}

/**
 * Replicate data to another Redis instance
 *
 * @param target_host - Target host
 * @param target_port - Target port
 * @returns Number of keys replicated
 *
 * @example
 * ```ts
 * const replicated = redisReplicate('replica.example.com', 6379)
 * console.log(`Replicated ${replicated} keys`)
 * ```
 */
export function redisReplicate(target_host: string, target_port: number): number {
  const native = getNativeBridge()
  if (!native?.redis_replicate) throw new Error("redis_replicate not available")
  return native.redis_replicate(target_host, target_port)
}

/**
 * Get replication status
 *
 * @returns Replication info JSON
 *
 * @example
 * ```ts
 * const status = redisReplicationStatus()
 * console.log(status)
 * ```
 */
export function redisReplicationStatus(): string {
  const native = getNativeBridge()
  if (!native?.redis_replication_status) throw new Error("redis_replication_status not available")
  return native.redis_replication_status()
}

/**
 * Sync cache between Redis instances (distributed cache sync)
 *
 * @param peers - Array of peer Redis addresses
 * @returns Number of keys synced
 *
 * @example
 * ```ts
 * const synced = redisCacheSync(['redis1:6379', 'redis2:6379'])
 * console.log(`Synced ${synced} keys`)
 * ```
 */
export function redisCacheSync(peers: string[]): number {
  const native = getNativeBridge()
  if (!native?.redis_cache_sync) throw new Error("redis_cache_sync not available")
  return native.redis_cache_sync(peers)
}

/**
 * Enable automatic cache warming
 *
 * @param key_pattern - Glob pattern for keys to warm (e.g., "compiled:*")
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * redisEnableCacheWarming('compiled:*')
 * ```
 */
export function redisEnableCacheWarming(key_pattern: string): string {
  const native = getNativeBridge()
  if (!native?.redis_enable_cache_warming) throw new Error("redis_enable_cache_warming not available")
  return native.redis_enable_cache_warming(key_pattern)
}

/**
 * Disable cache warming
 *
 * @returns "OK" on success
 *
 * @example
 * ```ts
 * redisDisableCacheWarming()
 * ```
 */
export function redisDisableCacheWarming(): string {
  const native = getNativeBridge()
  if (!native?.redis_disable_cache_warming) throw new Error("redis_disable_cache_warming not available")
  return native.redis_disable_cache_warming()
}

/**
 * Diagnose Redis connection issues
 *
 * @returns Diagnostic report
 *
 * @example
 * ```ts
 * const diagnosis = redisDiagnose()
 * console.log(diagnosis)
 * ```
 */
export function redisDiagnose(): string {
  const native = getNativeBridge()
  if (!native?.redis_diagnose) throw new Error("redis_diagnose not available")
  return native.redis_diagnose()
}
