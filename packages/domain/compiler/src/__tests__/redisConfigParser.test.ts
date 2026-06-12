/**
 * Redis Configuration Parser Tests
 *
 * Test coverage untuk semua fungsi parsing dan validasi Redis config
 * 80%+ coverage target per spec requirement
 *
 * Phase 1 - Task 1.1.2: Redis Config Parsing
 */

import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  parseRedisConfig,
  parseRedisUrl,
  parseRedisEnvVars,
  validateRedisConfig,
  mergeRedisConfigs,
  resolveRedisConfig,
  type RedisConfig,
  type TailwindConfig,
  type ConfigValidationResult,
} from '../utils/redisConfigParser'
import { DEFAULT_REDIS_CONFIG } from '../types/redis'

// ============================================================================
// TEST: parseRedisConfig
// ============================================================================

test('parseRedisConfig - returns default config when no TailwindConfig provided', () => {
  const result = parseRedisConfig()
  assert.deepEqual(result, DEFAULT_REDIS_CONFIG)
})

test('parseRedisConfig - returns default config when TailwindConfig is empty', () => {
  const config: TailwindConfig = {}
  const result = parseRedisConfig(config)
  assert.deepEqual(result, DEFAULT_REDIS_CONFIG)
})

test('parseRedisConfig - returns default config when no compiler config', () => {
  const config: TailwindConfig = { content: ['./src/**/*.tsx'] }
  const result = parseRedisConfig(config)
  assert.deepEqual(result, DEFAULT_REDIS_CONFIG)
})

test('parseRedisConfig - merges provided config with defaults', () => {
  const config: TailwindConfig = {
    compiler: {
      cache: {
        redis: {
          enabled: true,
          connection: {
            host: 'custom.redis.com',
            port: 6380,
          },
        },
      },
    },
  }

  const result = parseRedisConfig(config)
  assert.equal(result.enabled, true)
  assert.equal(result.connection.host, 'custom.redis.com')
  assert.equal(result.connection.port, 6380)
  // Should keep defaults for other fields
  assert.equal(result.connection.db, 0)
  assert.equal(result.pool?.size, 10)
})

test('parseRedisConfig - deeply merges nested config', () => {
  const config: TailwindConfig = {
    compiler: {
      cache: {
        redis: {
          enabled: true,
          connection: {
            host: 'redis.example.com',
          },
          pool: {
            size: 20,
          },
        },
      },
    },
  }

  const result = parseRedisConfig(config)
  assert.equal(result.connection.host, 'redis.example.com')
  assert.equal(result.pool?.size, 20)
  // Defaults for unspecified values
  assert.equal(result.connection.port, 6379)
  assert.equal(result.pool?.minIdleConnections, 2)
})

// ============================================================================
// TEST: parseRedisUrl
// ============================================================================

test('parseRedisUrl - parses basic redis:// URL', () => {
  const url = 'redis://localhost:6379/0'
  const result = parseRedisUrl(url)

  assert.equal(result.enabled, true)
  assert.equal(result.connection?.host, 'localhost')
  assert.equal(result.connection?.port, 6379)
  assert.equal(result.connection?.db, 0)
  assert.equal(result.connection?.tls, false)
})

test('parseRedisUrl - parses rediss:// URL with TLS', () => {
  const url = 'rediss://redis.example.com:6380/1'
  const result = parseRedisUrl(url)

  assert.equal(result.connection?.host, 'redis.example.com')
  assert.equal(result.connection?.port, 6380)
  assert.equal(result.connection?.tls, true)
  assert.equal(result.connection?.db, 1)
})

test('parseRedisUrl - parses URL with password', () => {
  const url = 'redis://:mypassword@localhost:6379/0'
  const result = parseRedisUrl(url)

  assert.equal(result.connection?.password, 'mypassword')
  assert.equal(result.connection?.host, 'localhost')
})

test('parseRedisUrl - parses URL with username and password', () => {
  const url = 'redis://user:password@localhost:6379/2'
  const result = parseRedisUrl(url)

  assert.equal(result.connection?.username, 'user')
  assert.equal(result.connection?.password, 'password')
  assert.equal(result.connection?.db, 2)
})

test('parseRedisUrl - uses default port when not specified', () => {
  const url = 'redis://localhost/0'
  const result = parseRedisUrl(url)

  assert.equal(result.connection?.port, 6379)
})

test('parseRedisUrl - uses default database when not specified', () => {
  const url = 'redis://localhost:6379'
  const result = parseRedisUrl(url)

  assert.equal(result.connection?.db, 0)
})

test('parseRedisUrl - throws error on invalid protocol', () => {
  const url = 'http://localhost:6379'
  assert.throws(() => parseRedisUrl(url), /Invalid Redis URL protocol/)
})

test('parseRedisUrl - throws error on invalid port number', () => {
  const url = 'redis://localhost:99999/0'
  assert.throws(() => parseRedisUrl(url), /Invalid port number/)
})

test('parseRedisUrl - throws error on invalid database number', () => {
  const url = 'redis://localhost:6379/16'
  assert.throws(() => parseRedisUrl(url), /Invalid database number/)
})

test('parseRedisUrl - throws error on negative database', () => {
  const url = 'redis://localhost:6379/-1'
  assert.throws(() => parseRedisUrl(url), /Invalid database number/)
})

// ============================================================================
// TEST: parseRedisEnvVars
// ============================================================================

test('parseRedisEnvVars - returns empty object when no env vars', () => {
  const result = parseRedisEnvVars({})
  assert.deepEqual(result, {})
})

test('parseRedisEnvVars - parses REDIS_URL if provided', () => {
  const envVars = {
    REDIS_URL: 'redis://custom.host:6380/1',
  }
  const result = parseRedisEnvVars(envVars)

  assert.equal(result.enabled, true)
  assert.equal(result.connection?.host, 'custom.host')
  assert.equal(result.connection?.port, 6380)
  assert.equal(result.connection?.db, 1)
})

test('parseRedisEnvVars - parses individual REDIS_* env vars', () => {
  const envVars = {
    REDIS_HOST: 'myhost.com',
    REDIS_PORT: '6380',
    REDIS_PASSWORD: 'secret',
    REDIS_DB: '2',
  }
  const result = parseRedisEnvVars(envVars)

  assert.equal(result.enabled, true)
  assert.equal(result.connection?.host, 'myhost.com')
  assert.equal(result.connection?.port, 6380)
  assert.equal(result.connection?.password, 'secret')
  assert.equal(result.connection?.db, 2)
})

test('parseRedisEnvVars - parses REDIS_USERNAME', () => {
  const envVars = {
    REDIS_HOST: 'localhost',
    REDIS_USERNAME: 'admin',
    REDIS_PASSWORD: 'pass123',
  }
  const result = parseRedisEnvVars(envVars)

  assert.equal(result.connection?.username, 'admin')
})

test('parseRedisEnvVars - parses REDIS_TLS flag', () => {
  const envVars = {
    REDIS_HOST: 'localhost',
    REDIS_TLS: 'true',
  }
  const result = parseRedisEnvVars(envVars)

  assert.equal(result.connection?.tls, true)
})

test('parseRedisEnvVars - handles REDIS_TLS false', () => {
  const envVars = {
    REDIS_HOST: 'localhost',
    REDIS_TLS: 'false',
  }
  const result = parseRedisEnvVars(envVars)

  assert.equal(result.connection?.tls, false)
})

test('parseRedisEnvVars - parses REDIS_POOL_SIZE', () => {
  const envVars = {
    REDIS_HOST: 'localhost',
    REDIS_POOL_SIZE: '20',
  }
  const result = parseRedisEnvVars(envVars)

  assert.equal(result.pool?.size, 20)
})

test('parseRedisEnvVars - parses REDIS_CLUSTER_ENABLED', () => {
  const envVars = {
    REDIS_HOST: 'localhost',
    REDIS_CLUSTER_ENABLED: 'true',
  }
  const result = parseRedisEnvVars(envVars)

  assert.equal(result.cluster?.enabled, true)
})

test('parseRedisEnvVars - parses REDIS_PERSISTENCE_ENABLED', () => {
  const envVars = {
    REDIS_HOST: 'localhost',
    REDIS_PERSISTENCE_ENABLED: 'true',
  }
  const result = parseRedisEnvVars(envVars)

  assert.equal(result.persistence?.enabled, true)
})

test('parseRedisEnvVars - warns on invalid REDIS_PORT', () => {
  const envVars = {
    REDIS_HOST: 'localhost',
    REDIS_PORT: 'invalid',
  }
  const result = parseRedisEnvVars(envVars)

  // Should not include port
  assert.equal(result.connection?.port, undefined)
})

test('parseRedisEnvVars - warns on invalid REDIS_DB', () => {
  const envVars = {
    REDIS_HOST: 'localhost',
    REDIS_DB: 'invalid',
  }
  const result = parseRedisEnvVars(envVars)

  // Should not include db
  assert.equal(result.connection?.db, undefined)
})

test('parseRedisEnvVars - prioritizes REDIS_URL over individual vars', () => {
  const envVars = {
    REDIS_URL: 'redis://from-url:6380/1',
    REDIS_HOST: 'from-host',
    REDIS_PORT: '6381',
  }
  const result = parseRedisEnvVars(envVars)

  // Should use REDIS_URL
  assert.equal(result.connection?.host, 'from-url')
  assert.equal(result.connection?.port, 6380)
  assert.equal(result.connection?.db, 1)
})

// ============================================================================
// TEST: validateRedisConfig
// ============================================================================

test('validateRedisConfig - validates valid config', () => {
  const config = DEFAULT_REDIS_CONFIG
  const result = validateRedisConfig(config)

  assert.equal(result.valid, true)
  assert.equal(result.errors.length, 0)
})

test('validateRedisConfig - errors on missing connection', () => {
  const config: RedisConfig = {
    enabled: true,
    connection: null as any,
  }
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(result.errors.some((e) => e.includes('Connection config is required')))
})

test('validateRedisConfig - errors on missing host', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  config.connection.host = ''
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(result.errors.some((e) => e.includes('Redis host is required')))
})

test('validateRedisConfig - errors on host too long', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  config.connection.host = 'a'.repeat(256)
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(result.errors.some((e) => e.includes('host length')))
})

test('validateRedisConfig - errors on invalid port', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  config.connection.port = 99999
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(result.errors.some((e) => e.includes('port')))
})

test('validateRedisConfig - errors on invalid database', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  config.connection.db = 20
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(result.errors.some((e) => e.includes('database')))
})

test('validateRedisConfig - errors on invalid pool size', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  if (config.pool) {
    config.pool.size = 200
  }
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(result.errors.some((e) => e.includes('Pool size')))
})

test('validateRedisConfig - errors when minIdleConnections > pool size', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  if (config.pool) {
    config.pool.size = 5
    config.pool.minIdleConnections = 10
  }
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(
    result.errors.some((e) => e.includes('Min idle connections') && e.includes('exceed'))
  )
})

test('validateRedisConfig - errors on invalid TTL', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  config.ttl = 999999999
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(result.errors.some((e) => e.includes('TTL')))
})

test('validateRedisConfig - warns on cluster enabled without nodes', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  config.cluster = { enabled: true }
  const result = validateRedisConfig(config)

  assert(result.warnings.some((w) => w.includes('Cluster is enabled')))
})

test('validateRedisConfig - errors on persistence enabled without mode', () => {
  const config = structuredClone(DEFAULT_REDIS_CONFIG)
  config.persistence = { enabled: true } as any
  const result = validateRedisConfig(config)

  assert.equal(result.valid, false)
  assert(result.errors.some((e) => e.includes('Persistence mode')))
})

// ============================================================================
// TEST: mergeRedisConfigs
// ============================================================================

test('mergeRedisConfigs - returns base when override is empty', () => {
  const base = DEFAULT_REDIS_CONFIG
  const result = mergeRedisConfigs(base, {})

  assert.deepEqual(result, base)
})

test('mergeRedisConfigs - overrides enabled flag', () => {
  const base = DEFAULT_REDIS_CONFIG
  const result = mergeRedisConfigs(base, { enabled: true })

  assert.equal(result.enabled, true)
})

test('mergeRedisConfigs - merges connection config', () => {
  const base = DEFAULT_REDIS_CONFIG
  const result = mergeRedisConfigs(base, {
    connection: {
      host: 'custom.host',
      port: 6380,
    } as any,
  })

  assert.equal(result.connection.host, 'custom.host')
  assert.equal(result.connection.port, 6380)
  // Should keep other defaults
  assert.equal(result.connection.db, 0)
})

test('mergeRedisConfigs - merges pool config', () => {
  const base = DEFAULT_REDIS_CONFIG
  const result = mergeRedisConfigs(base, {
    pool: { size: 25 },
  })

  assert.equal(result.pool?.size, 25)
  assert.equal(result.pool?.minIdleConnections, 2) // from base
})

test('mergeRedisConfigs - deep clones base to avoid mutation', () => {
  const base = structuredClone(DEFAULT_REDIS_CONFIG)
  const originalPort = base.connection.port
  const result = mergeRedisConfigs(base, {
    connection: { port: 6380 } as any,
  })

  // Original base should not be modified
  assert.equal(base.connection.port, originalPort)
  assert.equal(result.connection.port, 6380)
})

test('mergeRedisConfigs - merges cluster config', () => {
  const base = DEFAULT_REDIS_CONFIG
  const result = mergeRedisConfigs(base, {
    cluster: { enabled: true, nodes: ['node1', 'node2'] },
  })

  assert.equal(result.cluster?.enabled, true)
  assert.deepEqual(result.cluster?.nodes, ['node1', 'node2'])
})

test('mergeRedisConfigs - merges persistence config', () => {
  const base = DEFAULT_REDIS_CONFIG
  const result = mergeRedisConfigs(base, {
    persistence: { enabled: true, mode: 'AOF' },
  })

  assert.equal(result.persistence?.enabled, true)
  assert.equal(result.persistence?.mode, 'AOF')
})

test('mergeRedisConfigs - overrides ttl', () => {
  const base = DEFAULT_REDIS_CONFIG
  const result = mergeRedisConfigs(base, { ttl: 86400 })

  assert.equal(result.ttl, 86400)
})

test('mergeRedisConfigs - overrides keyPrefix', () => {
  const base = DEFAULT_REDIS_CONFIG
  const result = mergeRedisConfigs(base, { keyPrefix: 'custom:' })

  assert.equal(result.keyPrefix, 'custom:')
})

// ============================================================================
// TEST: resolveRedisConfig (Integration Tests)
// ============================================================================

test('resolveRedisConfig - uses env vars with highest priority', () => {
  const tailwindConfig: TailwindConfig = {
    compiler: {
      cache: {
        redis: {
          enabled: true,
          connection: {
            host: 'from-tailwind',
            port: 6379,
          },
        },
      },
    },
  }

  const envVars = {
    REDIS_HOST: 'from-env',
    REDIS_PORT: '6380',
  }

  const result = resolveRedisConfig(tailwindConfig, envVars)

  assert.equal(result.config.connection.host, 'from-env')
  assert.equal(result.config.connection.port, 6380)
  assert.equal(result.source, 'env-vars')
})

test('resolveRedisConfig - uses tailwind config when no env vars', () => {
  const tailwindConfig: TailwindConfig = {
    compiler: {
      cache: {
        redis: {
          enabled: true,
          connection: {
            host: 'from-tailwind',
            port: 6379,
          },
        },
      },
    },
  }

  const result = resolveRedisConfig(tailwindConfig, {})

  assert.equal(result.config.connection.host, 'from-tailwind')
  assert.equal(result.source, 'tailwind-config')
})

test('resolveRedisConfig - uses defaults when no config provided', () => {
  const result = resolveRedisConfig(undefined, {})

  assert.deepEqual(result.config, DEFAULT_REDIS_CONFIG)
  assert.equal(result.source, 'defaults')
})

test('resolveRedisConfig - validates resolved config', () => {
  const tailwindConfig: TailwindConfig = {
    compiler: {
      cache: {
        redis: {
          enabled: true,
          connection: {
            host: 'localhost',
            port: 99999, // invalid port
          },
        },
      },
    },
  }

  const result = resolveRedisConfig(tailwindConfig, {})

  assert.equal(result.validation.valid, false)
  assert(result.validation.errors.some((e) => e.includes('port')))
})

test('resolveRedisConfig - returns validation with valid config', () => {
  const result = resolveRedisConfig()

  assert.equal(result.validation.valid, true)
  assert.equal(result.validation.errors.length, 0)
})
