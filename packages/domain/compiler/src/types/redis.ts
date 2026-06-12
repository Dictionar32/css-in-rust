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
