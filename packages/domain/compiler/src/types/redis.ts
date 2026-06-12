/**
 * Redis Distributed Caching Type Definitions
 * 
 * Comprehensive type definitions for Redis distributed cache integration.
 * Supports: connection pools, cluster mode, replication, pub/sub, persistence,
 * cache warming, diagnostics, and eviction policies.
 * 
 * Requirement 1: Redis Distributed Caching Integration
 * 40 Rust functions exposed via NativeBridge
 */

// =============================================================================
// CONNECTION POOL MANAGEMENT
// =============================================================================

export interface RedisConnectionConfig {
  readonly host: string
  readonly port: number
  readonly poolSize?: number        // default: 10
  readonly password?: string
  readonly ssl?: boolean
  readonly timeout?: number         // milliseconds
  readonly retryAttempts?: number
  readonly retryDelay?: number      // milliseconds
}

export interface PoolStats {
  readonly active_connections: number
  readonly available_connections: number
  readonly pool_size: number
  readonly total_requests: number
  readonly average_latency_ms: number
  readonly uptime_seconds: number
  readonly last_error?: string
}

// =============================================================================
// BASIC CACHE OPERATIONS
// =============================================================================

export interface CacheEntry {
  readonly key: string
  readonly value: string
  readonly ttl_seconds?: number
  readonly created_at: number
  readonly accessed_at: number
}

export interface CacheGetResult {
  readonly value: string | null
  readonly exists: boolean
  readonly ttl_remaining?: number
}

export interface CacheSetResult {
  readonly success: boolean
  readonly key: string
  readonly size_bytes: number
  readonly timestamp_ms: number
}

export interface CacheDeleteResult {
  readonly success: boolean
  readonly key: string
  readonly existed: boolean
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

export interface BatchGetResult {
  readonly entries: Map<string, string>
  readonly missing_keys: string[]
  readonly retrieved_count: number
}

export interface BatchSetEntry {
  readonly key: string
  readonly value: string
  readonly ttl_seconds?: number
}

export interface BatchSetResult {
  readonly success: boolean
  readonly set_count: number
  readonly failed_count: number
  readonly errors?: Record<string, string>
}

// =============================================================================
// CACHE STATISTICS & MONITORING
// =============================================================================

export interface CacheStatistics {
  readonly total_size_bytes: number
  readonly entry_count: number
  readonly hit_count: number
  readonly miss_count: number
  readonly hit_rate_percent: number
  readonly average_entry_size_bytes: number
  readonly oldest_entry_age_ms: number
  readonly newest_entry_age_ms: number
}

export interface EvictionStats {
  readonly policy: EvictionPolicy
  readonly evicted_entries: number
  readonly eviction_events: number
  readonly last_eviction_timestamp?: number
}

export enum EvictionPolicy {
  LRU = 'LRU',      // Least Recently Used
  LFU = 'LFU',      // Least Frequently Used
  FIFO = 'FIFO',    // First In First Out
  RANDOM = 'RANDOM' // Random eviction
}

export interface MonitorEntry {
  readonly command: string
  readonly key?: string
  readonly arguments: string[]
  readonly timestamp_ms: number
  readonly duration_ms: number
}

// =============================================================================
// CLUSTER MODE
// =============================================================================

export interface ClusterNode {
  readonly host: string
  readonly port: number
  readonly status: 'healthy' | 'down' | 'unknown'
  readonly last_check: number
}

export interface ClusterStatus {
  readonly enabled: boolean
  readonly node_count: number
  readonly nodes: ClusterNode[]
  readonly slots_covered: number
  readonly total_slots: number
  readonly cluster_healthy: boolean
  readonly last_error?: string
}

export interface ClusterHealthCheck {
  readonly nodes_reachable: number
  readonly nodes_total: number
  readonly slots_ok: boolean
  readonly migration_in_progress: boolean
}

// =============================================================================
// REPLICATION
// =============================================================================

export interface ReplicationStatus {
  readonly enabled: boolean
  readonly master: string
  readonly replicas: string[]
  readonly lag_bytes?: number
  readonly sync_in_progress: boolean
  readonly total_syncs: number
  readonly failed_syncs: number
  readonly last_sync_time?: number
}

export interface ReplicationConfig {
  readonly target_host: string
  readonly target_port: number
  readonly read_replicas?: boolean
  readonly sync_strategy?: 'full' | 'partial'
}

// =============================================================================
// PUB/SUB
// =============================================================================

export interface PubSubMessage {
  readonly channel: string
  readonly message: string
  readonly timestamp_ms: number
  readonly pattern?: string
}

export interface PubSubStats {
  readonly channels_subscribed: number
  readonly patterns_subscribed: number
  readonly total_messages: number
  readonly average_latency_ms: number
}

// =============================================================================
// PERSISTENCE
// =============================================================================

export enum PersistenceMode {
  AOF = 'AOF',     // Append-Only File
  RDB = 'RDB',     // Snapshot
  HYBRID = 'HYBRID' // Both AOF and RDB
}

export interface PersistenceConfig {
  readonly mode: PersistenceMode
  readonly backup_path: string
  readonly fsync_strategy?: 'always' | 'everysec' | 'no'
  readonly compression?: boolean
}

export interface PersistenceStatus {
  readonly enabled: boolean
  readonly mode: PersistenceMode
  readonly last_save_time?: number
  readonly unsaved_changes: number
  readonly backup_size_bytes?: number
}

// =============================================================================
// CACHE WARMING
// =============================================================================

export interface CacheWarmingConfig {
  readonly key_pattern: string
  readonly batch_size?: number
  readonly priority?: 'low' | 'normal' | 'high'
  readonly schedule?: 'on_startup' | 'periodic' | 'manual'
  readonly period_ms?: number
}

export interface CacheWarmingResult {
  readonly success: boolean
  readonly keys_preloaded: number
  readonly bytes_loaded: number
  readonly duration_ms: number
  readonly next_scheduled?: number
}

// =============================================================================
// MEMORY MANAGEMENT
// =============================================================================

export interface MemoryStats {
  readonly total_bytes: number
  readonly used_bytes: number
  readonly available_bytes: number
  readonly key_count: number
  readonly avg_key_size_bytes: number
  readonly avg_value_size_bytes: number
  readonly fragmentation_ratio: number
  readonly evicted_keys: number
  readonly expired_keys: number
  readonly recommendations: string[]
}

export interface MemoryOptimization {
  readonly current_usage_mb: number
  readonly optimized_usage_mb: number
  readonly savings_percent: number
  readonly strategies_applied: string[]
}

// =============================================================================
// DIAGNOSTICS & HEALTH
// =============================================================================

export interface DiagnosticsReport {
  readonly timestamp_ms: number
  readonly status: 'healthy' | 'degraded' | 'unhealthy'
  readonly connection_ok: boolean
  readonly latency_p50_ms: number
  readonly latency_p95_ms: number
  readonly latency_p99_ms: number
  readonly memory_healthy: boolean
  readonly replication_ok?: boolean
  readonly cluster_healthy?: boolean
  readonly cache_hit_rate_percent: number
  readonly total_commands: number
  readonly failed_commands: number
  readonly errors: string[]
  readonly recommendations: string[]
  readonly uptime_seconds: number
}

export interface LatencyProfile {
  readonly min_ms: number
  readonly max_ms: number
  readonly avg_ms: number
  readonly median_ms: number
  readonly p95_ms: number
  readonly p99_ms: number
  readonly stddev_ms: number
  readonly sample_count: number
}

// =============================================================================
// TTL & EXPIRATION
// =============================================================================

export interface ExpirationInfo {
  readonly key: string
  readonly ttl_seconds: number
  readonly created_at: number
  readonly expires_at: number
  readonly time_remaining_seconds: number
}

export interface ExpirationStats {
  readonly total_keys_with_ttl: number
  readonly total_keys_without_ttl: number
  readonly avg_ttl_seconds: number
  readonly expiring_soon: number  // expiring within 1 minute
}

// =============================================================================
// CACHE SYNC
// =============================================================================

export interface CacheSyncConfig {
  readonly peers: string[]
  readonly strategy?: 'full' | 'incremental' | 'differential'
  readonly conflict_resolution?: 'latest' | 'size' | 'hash'
  readonly timeout_ms?: number
}

export interface CacheSyncResult {
  readonly success: boolean
  readonly synced_keys: number
  readonly conflicts_resolved: number
  readonly duration_ms: number
  readonly failed_peers?: string[]
}

// =============================================================================
// CSS COMPILER CACHE KEY STRATEGY
// =============================================================================

/**
 * Standard cache key format for CSS compiler results:
 * css-compiler:{file-hash}:{theme-id}:{variant-hash}:{build-id}
 * 
 * Example:
 * css-compiler:a1b2c3d4e5f6:1:x9y8z7w6:build-123
 */
export interface CompilerCacheKey {
  readonly prefix: 'css-compiler'
  readonly file_hash: string      // SHA-256 first 16 chars
  readonly theme_id: string       // Theme identifier
  readonly variant_hash: string   // Variant combination hash
  readonly build_id: string       // Build session identifier
}

export interface CSSCompilerCacheEntry {
  readonly key: string
  readonly css: string
  readonly classes_used: string[]
  readonly theme_version: number
  readonly compiled_at: number
  readonly ttl_seconds: number
  readonly size_bytes: number
}

// =============================================================================
// REDIS MANAGER INTERFACE
// =============================================================================

export interface RedisManager {
  // Connection Management
  connect(config: RedisConnectionConfig): Promise<PoolStats>
  disconnect(): Promise<void>
  reconnect(): Promise<void>
  getPoolStats(): Promise<PoolStats>
  healthCheck(): Promise<DiagnosticsReport>
  
  // Basic Cache Operations
  get(key: string): Promise<CacheGetResult>
  set(key: string, value: string, ttlSeconds?: number): Promise<CacheSetResult>
  delete(key: string): Promise<CacheDeleteResult>
  exists(key: string): Promise<boolean>
  
  // Batch Operations
  getMany(keys: string[]): Promise<BatchGetResult>
  setMany(entries: BatchSetEntry[]): Promise<BatchSetResult>
  
  // Cache Management
  clearCache(): Promise<number>  // Returns number of cleared entries
  flushDatabase(): Promise<number>
  flushAll(): Promise<number>
  
  // Statistics
  getCacheStatistics(): Promise<CacheStatistics>
  getCacheSize(): Promise<number>
  getCacheKeyCount(): Promise<number>
  getCacheHitRate(): Promise<number>
  getEvictionStats(): Promise<EvictionStats>
  
  // Cluster Mode
  enableCluster(initialNodes: string[]): Promise<ClusterStatus>
  disableCluster(): Promise<void>
  getClusterStatus(): Promise<ClusterStatus>
  getClusterHealth(): Promise<ClusterHealthCheck>
  
  // Replication
  enableReplication(config: ReplicationConfig): Promise<ReplicationStatus>
  disableReplication(): Promise<void>
  getReplicationStatus(): Promise<ReplicationStatus>
  
  // Pub/Sub
  subscribe(channel: string): Promise<AsyncIterable<PubSubMessage>>
  publish(channel: string, message: string): Promise<number>  // Returns subscribers count
  getPubSubStats(): Promise<PubSubStats>
  
  // Persistence
  enablePersistence(mode: PersistenceMode): Promise<PersistenceStatus>
  disablePersistence(): Promise<void>
  createSnapshot(): Promise<PersistenceStatus>
  getPersistenceStatus(): Promise<PersistenceStatus>
  
  // Cache Warming
  enableCacheWarming(config: CacheWarmingConfig): Promise<CacheWarmingResult>
  disableCacheWarming(): Promise<void>
  
  // Memory Management
  getMemoryStats(): Promise<MemoryStats>
  optimizeMemory(): Promise<MemoryOptimization>
  setEvictionPolicy(policy: EvictionPolicy): Promise<void>
  getEvictionPolicy(): Promise<EvictionPolicy>
  
  // Cache Sync
  syncCache(config: CacheSyncConfig): Promise<CacheSyncResult>
  
  // TTL & Expiration
  setExpiration(key: string, ttlSeconds: number): Promise<boolean>
  getExpiration(key: string): Promise<ExpirationInfo | null>
  getExpirationStats(): Promise<ExpirationStats>
  
  // Diagnostics
  getDiagnostics(): Promise<DiagnosticsReport>
  getLatencyProfile(): Promise<LatencyProfile>
  monitorCommands(timeout?: number): Promise<AsyncIterable<MonitorEntry>>
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isEvictionPolicy = (value: unknown): value is EvictionPolicy => {
  return Object.values(EvictionPolicy).includes(value as EvictionPolicy)
}

export const isPersistenceMode = (value: unknown): value is PersistenceMode => {
  return Object.values(PersistenceMode).includes(value as PersistenceMode)
}

export const isClusterStatus = (value: unknown): value is ClusterStatus => {
  const v = value as Partial<ClusterStatus>
  return (
    typeof v.enabled === 'boolean' &&
    typeof v.node_count === 'number' &&
    Array.isArray(v.nodes) &&
    typeof v.slots_covered === 'number'
  )
}

export const isDiagnosticsReport = (value: unknown): value is DiagnosticsReport => {
  const v = value as Partial<DiagnosticsReport>
  return (
    typeof v.timestamp_ms === 'number' &&
    (v.status === 'healthy' || v.status === 'degraded' || v.status === 'unhealthy') &&
    typeof v.connection_ok === 'boolean'
  )
}
