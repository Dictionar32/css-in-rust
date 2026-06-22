/**
 * Redis Configuration Types
 *
 * Type definitions untuk Redis configuration dan validation
 * Phase 1 - Task 1.1.2: Redis Config Parsing
 */

/**
 * Redis connection configuration
 */
export interface RedisConnectionConfig {
  host: string
  port: number
  password?: string
  db?: number
  username?: string
  tls?: boolean
}

/**
 * Redis pool configuration
 */
export interface RedisPoolConfig {
  size: number
  minIdleConnections?: number
  maxIdleTime?: number // seconds
  connectionTimeout?: number // seconds
  acquireTimeout?: number // seconds
}

/**
 * Redis cluster configuration
 */
export interface RedisClusterConfig {
  enabled: boolean
  nodes?: string[]
  options?: {
    enableOfflineQueue?: boolean
    maxRedirections?: number
    retryDelayOnFailover?: number
    retryDelayOnClusterDown?: number
  }
}

/**
 * Redis persistence configuration
 */
export interface RedisPersistenceConfig {
  enabled: boolean
  mode: 'RDB' | 'AOF' | 'BOTH'
  savePath?: string
  snapshotFrequency?: number // seconds
}

/**
 * Redis replication configuration
 */
export interface RedisReplicationConfig {
  enabled: boolean
  mode: 'master' | 'slave' | 'sentinel'
  targetHost?: string
  targetPort?: number
  sentinelNodes?: string[]
}

/**
 * Complete Redis configuration
 */
export interface RedisConfig {
  enabled: boolean
  connection: RedisConnectionConfig
  pool?: RedisPoolConfig
  cluster?: RedisClusterConfig
  persistence?: RedisPersistenceConfig
  replication?: RedisReplicationConfig
  ttl?: number // default TTL in seconds
  keyPrefix?: string // prefix for all keys
  monitoring?: {
    enabled: boolean
    metricsInterval?: number // seconds
  }
}

/**
 * Redis configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Tailwind compiler configuration with Redis
 */
export interface CompilerConfig {
  cache?: {
    backend?: 'auto' | 'lru' | 'redis' | 'persistent'
    redis?: RedisConfig
    lru?: {
      capacity: number
    }
  }
  watch?: {
    enabled: boolean
    patterns?: string[]
    debounce?: number
  }
  optimization?: {
    deadCodeElimination?: boolean
    minification?: boolean
  }
}

/**
 * Full Tailwind configuration
 */
export interface TailwindConfig {
  compiler?: CompilerConfig
  content?: string[]
  theme?: Record<string, any>
  plugins?: any[]
  [key: string]: any
}

/**
 * Environment variables for Redis
 */
export interface RedisEnvVars {
  REDIS_URL?: string
  REDIS_HOST?: string
  REDIS_PORT?: string
  REDIS_PASSWORD?: string
  REDIS_USERNAME?: string
  REDIS_DB?: string
  REDIS_POOL_SIZE?: string
  REDIS_TLS?: string
  REDIS_CLUSTER_ENABLED?: string
  REDIS_PERSISTENCE_ENABLED?: string
}

/**
 * Default Redis configuration
 */
export const DEFAULT_REDIS_CONFIG: RedisConfig = {
  enabled: false,
  connection: {
    host: 'localhost',
    port: 6379,
    db: 0,
  },
  pool: {
    size: 10,
    minIdleConnections: 2,
    maxIdleTime: 300,
    connectionTimeout: 5,
    acquireTimeout: 5,
  },
  ttl: 604800, // 7 days
  keyPrefix: 'css-compiler:',
  monitoring: {
    enabled: false,
    metricsInterval: 60,
  },
}

/**
 * Validation constraints
 */
export const REDIS_VALIDATION_RULES = {
  connection: {
    host: { min: 1, max: 255 },
    port: { min: 1, max: 65535 },
    db: { min: 0, max: 15 },
  },
  pool: {
    size: { min: 1, max: 100 },
    minIdleConnections: { min: 0, max: 50 },
  },
  ttl: { min: 1, max: 31536000 }, // 1 second to 1 year
}

// ============================================================================
// Legacy Redis operation contracts
// ============================================================================

export type PoolStats = import('../managers/RedisManager').PoolStats
export type CacheEntry = import('../managers/RedisManager').CacheEntry
export type ClusterStatus = import('../managers/RedisManager').ClusterStatus
export type ClusterNode = ClusterStatus['nodes'][number]
export type ReplicationStatus = import('../managers/RedisManager').ReplicationStatus
export type MemoryStats = import('../managers/RedisManager').MemoryStats
export type DiagnosticsReport = import('../managers/RedisManager').DiagnosticsReport
export type RedisManager = import('../managers/RedisManager').RedisManager

export interface CacheGetResult {
  key: string
  value: string | null
  hit: boolean
  ttlSeconds?: number
}

export interface CacheSetResult {
  key: string
  success: boolean
  ttlSeconds?: number
}

export interface CacheDeleteResult {
  key: string
  deleted: boolean
}

export interface BatchGetResult {
  entries: CacheGetResult[]
  hits: number
  misses: number
}

export type BatchSetEntry = CacheEntry

export interface BatchSetResult {
  success: boolean
  entries: number
  errors: string[]
}

export interface CacheStatistics {
  requests: number
  hits: number
  misses: number
  hitRate: number
  keyCount?: number
  memoryBytes?: number
}

export interface EvictionStats {
  policy: EvictionPolicy
  evictions: number
  memoryFreedBytes: number
}

export interface MonitorEntry {
  timestamp_ms: number
  command: string
  key?: string
  duration_ms?: number
}

export interface ClusterHealthCheck {
  healthy: boolean
  nodes: ClusterNode[]
  checkedAtMs: number
}

export type ReplicationConfig = RedisReplicationConfig

export interface PubSubMessage {
  channel: string
  message: string
  timestamp_ms: number
  subscriber_count?: number
}

export interface PubSubStats {
  channels: number
  subscribers: number
  messagesPublished: number
  messagesReceived: number
}

export type PersistenceConfig = RedisPersistenceConfig

export interface PersistenceStatus {
  enabled: boolean
  mode: PersistenceMode
  lastSnapshotAtMs?: number
  savePath?: string
}

export interface CacheWarmingConfig {
  enabled: boolean
  pattern?: string
  maxKeys?: number
}

export interface CacheWarmingResult {
  warmedKeys: number
  durationMs: number
  errors: string[]
}

export interface MemoryOptimization {
  beforeBytes: number
  afterBytes: number
  freedBytes: number
  recommendations: string[]
}

export interface LatencyProfile {
  p50_ms: number
  p95_ms: number
  p99_ms: number
}

export interface ExpirationInfo {
  key: string
  ttlSeconds: number
  expiresAtMs?: number
}

export interface ExpirationStats {
  expiringKeys: number
  persistentKeys: number
}

export interface CacheSyncConfig {
  sourceNode?: string
  targetNodes: string[]
  pattern?: string
}

export interface CacheSyncResult {
  syncedKeys: number
  skippedKeys: number
  errors: string[]
}

export interface CompilerCacheKey {
  className: string
  themeHash?: string
  configHash?: string
}

export interface CSSCompilerCacheEntry {
  key: CompilerCacheKey
  css: string
  createdAtMs: number
  ttlSeconds?: number
}

export const EvictionPolicy = {
  LRU: 'LRU',
  LFU: 'LFU',
  FIFO: 'FIFO',
  RANDOM: 'RANDOM',
} as const

export type EvictionPolicy = (typeof EvictionPolicy)[keyof typeof EvictionPolicy]

export const PersistenceMode = {
  AOF: 'AOF',
  RDB: 'RDB',
  BOTH: 'BOTH',
  NONE: 'none',
} as const

export type PersistenceMode = (typeof PersistenceMode)[keyof typeof PersistenceMode]

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isEvictionPolicy = (value: unknown): value is EvictionPolicy =>
  typeof value === 'string' &&
  Object.values(EvictionPolicy).includes(value as EvictionPolicy)

export const isPersistenceMode = (value: unknown): value is PersistenceMode =>
  typeof value === 'string' &&
  Object.values(PersistenceMode).includes(value as PersistenceMode)

export const isClusterStatus = (value: unknown): value is ClusterStatus =>
  isRecord(value) &&
  typeof value.enabled === 'boolean' &&
  typeof value.node_count === 'number' &&
  Array.isArray(value.nodes) &&
  typeof value.slots_covered === 'number'

export const isDiagnosticsReport = (value: unknown): value is DiagnosticsReport =>
  isRecord(value) &&
  typeof value.connection_ok === 'boolean' &&
  typeof value.latency_p95_ms === 'number' &&
  typeof value.memory_healthy === 'boolean' &&
  typeof value.replication_ok === 'boolean' &&
  typeof value.cluster_healthy === 'boolean' &&
  Array.isArray(value.recommendations)
