/**
 * Redis Configuration Parser
 *
 * Menangani parsing dan validasi Redis config dari berbagai sumber:
 * - TailwindConfig object
 * - REDIS_URL environment variable
 * - Individual Redis environment variables
 * - Default fallback values
 *
 * Phase 1 - Task 1.1.2: Redis Config Parsing
 */

import {
  RedisConfig,
  RedisEnvVars,
  CompilerConfig,
  TailwindConfig,
  ConfigValidationResult,
  RedisConnectionConfig,
  RedisPoolConfig,
  DEFAULT_REDIS_CONFIG,
  REDIS_VALIDATION_RULES,
} from '../types/redis'

/**
 * Parse Redis config dari TailwindConfig
 *
 * Prioritas:
 * 1. TailwindConfig.compiler.cache.redis jika ada
 * 2. Default config jika tidak ada
 *
 * @param config - TailwindConfig object
 * @returns RedisConfig yang sudah di-merge dengan defaults
 */
export function parseRedisConfig(config?: TailwindConfig): RedisConfig {
  if (!config?.compiler?.cache?.redis) {
    return structuredClone(DEFAULT_REDIS_CONFIG)
  }

  const userConfig = config.compiler.cache.redis

  // Merge user config dengan defaults
  return mergeRedisConfigs(DEFAULT_REDIS_CONFIG, userConfig)
}

/**
 * Parse REDIS_URL environment variable ke RedisConfig
 *
 * Format yang didukung:
 * - redis://[:password@]host:port[/db]
 * - rediss://[:password@]host:port[/db] (dengan TLS)
 *
 * @param url - REDIS_URL value
 * @returns RedisConnectionConfig dari URL
 * @throws Error jika URL tidak valid
 */
export function parseRedisUrl(url: string): Partial<RedisConfig> {
  try {
    const parsedUrl = new URL(url)

    if (!['redis:', 'rediss:'].includes(parsedUrl.protocol)) {
      throw new Error(`Invalid Redis URL protocol: ${parsedUrl.protocol}`)
    }

    const host = parsedUrl.hostname || 'localhost'
    const port = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 6379
    const password = parsedUrl.password || undefined
    const username = parsedUrl.username || undefined
    const db = parsedUrl.pathname ? parseInt(parsedUrl.pathname.slice(1), 10) : 0
    const tls = parsedUrl.protocol === 'rediss:'

    // Validasi port
    if (port < 1 || port > 65535) {
      throw new Error(`Invalid port number: ${port}`)
    }

    // Validasi db (Redis supports 0-15 by default)
    if (db < 0 || db > 15) {
      throw new Error(`Invalid database number: ${db}`)
    }

    const connectionConfig: RedisConnectionConfig = {
      host,
      port,
      db,
      tls,
    }

    if (password) {
      connectionConfig.password = password
    }

    if (username) {
      connectionConfig.username = username
    }

    return {
      enabled: true,
      connection: connectionConfig,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Failed to parse REDIS_URL: ${String(error)}`
    throw new Error(message)
  }
}

/**
 * Parse individual Redis environment variables
 *
 * Environment variables yang didukung:
 * - REDIS_URL
 * - REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, REDIS_USERNAME
 * - REDIS_POOL_SIZE
 * - REDIS_TLS (true/false)
 * - REDIS_CLUSTER_ENABLED (true/false)
 * - REDIS_PERSISTENCE_ENABLED (true/false)
 *
 * @param envVars - Object dengan environment variables (default: process.env)
 * @returns Partial<RedisConfig> dari environment variables
 */
export function parseRedisEnvVars(
  envVars: RedisEnvVars = process.env as RedisEnvVars
): Partial<RedisConfig> {
  // Jika REDIS_URL ada, parse dari URL dulu
  if (envVars.REDIS_URL) {
    try {
      return parseRedisUrl(envVars.REDIS_URL)
    } catch (error) {
      console.warn('Failed to parse REDIS_URL, falling back to individual env vars:', error)
    }
  }

  // Fallback ke individual env vars
  const config: Partial<RedisConfig> = {}

  // Parse connection config
  const connectionConfig: Partial<RedisConnectionConfig> = {}

  if (envVars.REDIS_HOST) {
    connectionConfig.host = envVars.REDIS_HOST
  }

  if (envVars.REDIS_PORT) {
    const port = parseInt(envVars.REDIS_PORT, 10)
    if (isNaN(port) || port < 1 || port > 65535) {
      console.warn(`Invalid REDIS_PORT: ${envVars.REDIS_PORT}`)
    } else {
      connectionConfig.port = port
    }
  }

  if (envVars.REDIS_PASSWORD) {
    connectionConfig.password = envVars.REDIS_PASSWORD
  }

  if (envVars.REDIS_USERNAME) {
    connectionConfig.username = envVars.REDIS_USERNAME
  }

  if (envVars.REDIS_DB) {
    const db = parseInt(envVars.REDIS_DB, 10)
    if (isNaN(db) || db < 0 || db > 15) {
      console.warn(`Invalid REDIS_DB: ${envVars.REDIS_DB}`)
    } else {
      connectionConfig.db = db
    }
  }

  if (envVars.REDIS_TLS) {
    connectionConfig.tls = envVars.REDIS_TLS.toLowerCase() === 'true'
  }

  if (Object.keys(connectionConfig).length > 0) {
    config.connection = connectionConfig as RedisConnectionConfig
    config.enabled = true
  }

  // Parse pool config
  if (envVars.REDIS_POOL_SIZE) {
    const poolSize = parseInt(envVars.REDIS_POOL_SIZE, 10)
    if (isNaN(poolSize) || poolSize < 1) {
      console.warn(`Invalid REDIS_POOL_SIZE: ${envVars.REDIS_POOL_SIZE}`)
    } else {
      if (!config.pool) {
        config.pool = { size: DEFAULT_REDIS_CONFIG.pool?.size ?? 10 }
      }
      config.pool.size = poolSize
    }
  }

  // Parse cluster config
  if (envVars.REDIS_CLUSTER_ENABLED) {
    if (!config.cluster) {
      config.cluster = { enabled: false }
    }
    config.cluster.enabled = envVars.REDIS_CLUSTER_ENABLED.toLowerCase() === 'true'
  }

  // Parse persistence config
  if (envVars.REDIS_PERSISTENCE_ENABLED) {
    if (!config.persistence) {
      config.persistence = { enabled: false, mode: 'RDB' }
    }
    config.persistence.enabled = envVars.REDIS_PERSISTENCE_ENABLED.toLowerCase() === 'true'
  }

  return config
}

/**
 * Validasi Redis configuration
 *
 * Checks:
 * - Host harus valid (1-255 karakter)
 * - Port harus 1-65535
 * - Database harus 0-15
 * - Pool size harus 1-100
 * - TTL harus 1 second - 1 year
 * - Connection config tidak boleh null
 *
 * @param config - RedisConfig untuk divalidasi
 * @returns ConfigValidationResult dengan status dan pesan error/warning
 */
export function validateRedisConfig(config: RedisConfig): ConfigValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validasi connection config
  if (!config.connection) {
    errors.push('Connection config is required')
    return { valid: false, errors, warnings }
  }

  // Validasi host
  if (!config.connection.host) {
    errors.push('Redis host is required')
  } else if (config.connection.host.length < 1 || config.connection.host.length > 255) {
    errors.push(
      `Redis host length must be between 1 and 255 characters, got ${config.connection.host.length}`
    )
  }

  // Validasi port
  const portRules = REDIS_VALIDATION_RULES.connection.port
  if (config.connection.port < portRules.min || config.connection.port > portRules.max) {
    errors.push(
      `Redis port must be between ${portRules.min} and ${portRules.max}, got ${config.connection.port}`
    )
  }

  // Validasi database
  const dbRules = REDIS_VALIDATION_RULES.connection.db
  if (
    config.connection.db !== undefined &&
    (config.connection.db < dbRules.min || config.connection.db > dbRules.max)
  ) {
    errors.push(
      `Redis database must be between ${dbRules.min} and ${dbRules.max}, got ${config.connection.db}`
    )
  }

  // Validasi pool config
  if (config.pool) {
    const poolSizeRules = REDIS_VALIDATION_RULES.pool.size
    if (config.pool.size < poolSizeRules.min || config.pool.size > poolSizeRules.max) {
      errors.push(
        `Pool size must be between ${poolSizeRules.min} and ${poolSizeRules.max}, got ${config.pool.size}`
      )
    }

    const minIdleRules = REDIS_VALIDATION_RULES.pool.minIdleConnections
    if (
      config.pool.minIdleConnections !== undefined &&
      (config.pool.minIdleConnections < minIdleRules.min ||
        config.pool.minIdleConnections > minIdleRules.max)
    ) {
      errors.push(
        `Min idle connections must be between ${minIdleRules.min} and ${minIdleRules.max}, got ${config.pool.minIdleConnections}`
      )
    }

    if (
      config.pool.minIdleConnections !== undefined &&
      config.pool.minIdleConnections > config.pool.size
    ) {
      errors.push(
        `Min idle connections (${config.pool.minIdleConnections}) cannot exceed pool size (${config.pool.size})`
      )
    }
  }

  // Validasi TTL
  if (config.ttl !== undefined) {
    const ttlRules = REDIS_VALIDATION_RULES.ttl
    if (config.ttl < ttlRules.min || config.ttl > ttlRules.max) {
      errors.push(
        `TTL must be between ${ttlRules.min} and ${ttlRules.max} seconds, got ${config.ttl}`
      )
    }
  }

  // Validasi cluster config
  if (config.cluster?.enabled && (!config.cluster.nodes || config.cluster.nodes.length === 0)) {
    warnings.push('Cluster is enabled but no nodes are configured')
  }

  // Validasi persistence config
  if (config.persistence?.enabled && !config.persistence.mode) {
    errors.push('Persistence mode is required when persistence is enabled')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Merge dua Redis configurations dengan override logic
 *
 * Prioritas:
 * 1. Override config (user-provided)
 * 2. Base config (defaults)
 *
 * Deep merge untuk nested objects (connection, pool, cluster, etc)
 *
 * @param base - Base/default configuration
 * @param override - User-provided override configuration
 * @returns Merged RedisConfig
 */
export function mergeRedisConfigs(
  base: RedisConfig,
  override: Partial<RedisConfig>
): RedisConfig {
  const merged = structuredClone(base)

  if (override.enabled !== undefined) {
    merged.enabled = override.enabled
  }

  // Merge connection config
  if (override.connection) {
    merged.connection = {
      ...merged.connection,
      ...override.connection,
    }
  }

  // Merge pool config
  if (override.pool) {
    merged.pool = {
      ...merged.pool,
      ...override.pool,
    }
  }

  // Merge cluster config
  if (override.cluster) {
    merged.cluster = {
      ...merged.cluster,
      ...override.cluster,
    }
  }

  // Merge persistence config
  if (override.persistence) {
    merged.persistence = {
      ...merged.persistence,
      ...override.persistence,
    }
  }

  // Merge replication config
  if (override.replication) {
    merged.replication = {
      ...merged.replication,
      ...override.replication,
    }
  }

  // Override simple fields
  if (override.ttl !== undefined) {
    merged.ttl = override.ttl
  }

  if (override.keyPrefix !== undefined) {
    merged.keyPrefix = override.keyPrefix
  }

  if (override.monitoring) {
    merged.monitoring = {
      ...merged.monitoring,
      ...override.monitoring,
    }
  }

  return merged
}

/**
 * Resolve final Redis configuration dari semua sumber
 *
 * Urutan priority (tertinggi ke terendah):
 * 1. Environment variables (REDIS_*)
 * 2. TailwindConfig.compiler.cache.redis
 * 3. Default config
 *
 * @param tailwindConfig - TailwindConfig object (optional)
 * @param envVars - Environment variables (optional, default: process.env)
 * @returns Final RedisConfig dengan validation result
 */
export interface ResolvedConfig {
  config: RedisConfig
  validation: ConfigValidationResult
  source: 'env-vars' | 'tailwind-config' | 'defaults'
}

export function resolveRedisConfig(
  tailwindConfig?: TailwindConfig,
  envVars?: RedisEnvVars
): ResolvedConfig {
  let config: RedisConfig
  let source: 'env-vars' | 'tailwind-config' | 'defaults'

  // Check env vars first (highest priority)
  const envConfig = parseRedisEnvVars(envVars)
  if (Object.keys(envConfig).length > 0) {
    config = mergeRedisConfigs(DEFAULT_REDIS_CONFIG, envConfig)
    source = 'env-vars'
  } else if (tailwindConfig?.compiler?.cache?.redis) {
    config = parseRedisConfig(tailwindConfig)
    source = 'tailwind-config'
  } else {
    config = structuredClone(DEFAULT_REDIS_CONFIG)
    source = 'defaults'
  }

  // Validasi final config
  const validation = validateRedisConfig(config)

  return { config, validation, source }
}
