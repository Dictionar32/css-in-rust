/**
 * Unit tests for FeaturesConfig - Configuration schema and validation
 *
 * Tests cover:
 * - Configuration schema validation for all 8 domains
 * - Default configuration correctness
 * - Merging user config with defaults
 * - Loading configuration from tailwind.config.js
 * - Error and warning detection
 */

import assert from 'node:assert'
import { test } from 'node:test'
import {
  DEFAULT_FEATURES_CONFIG,
  validateRedisConfig,
  validateWatchConfig,
  validateIDRegistryConfig,
  validateIncrementalConfig,
  validateThemeConfig,
  validateOptimizationConfig,
  validateAtomicCssConfig,
  validateAnalysisConfig,
  validateFeaturesConfig,
  mergeWithDefaults,
  loadFromTailwindConfig,
  createFeaturesConfig,
} from '../FeaturesConfig.ts'

test('FeaturesConfig', async (t) => {
  await t.test('DEFAULT_FEATURES_CONFIG', async (t) => {
    await t.test('should have all features disabled by default (opt-in model)', () => {
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.redis?.enabled, false)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.watch?.enabled, false)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.idRegistry?.enabled, false)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.incremental?.enabled, false)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.theme?.enabled, false)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.optimization?.enabled, false)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.atomicCss?.enabled, false)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.analysis?.enabled, false)
    })

    await t.test('should have sensible defaults for each feature', () => {
      // Redis defaults
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.redis?.host, 'localhost')
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.redis?.port, 6379)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.redis?.poolSize, 10)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.redis?.ttlSeconds, 604800) // 7 days

      // Watch defaults
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.watch?.debounceMs, 100)
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.watch?.gitignoreAware, true)
      assert.ok(DEFAULT_FEATURES_CONFIG.watch?.patterns?.includes('**/*.tsx'))

      // Redis eviction policy
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.redis?.evictionPolicy, 'LRU')

      // Optimization defaults
      assert.strictEqual(DEFAULT_FEATURES_CONFIG.optimization?.minReductionPercent, 5)
    })
  })

  await t.test('validateRedisConfig', async (t) => {
    await t.test('should accept valid Redis configuration', () => {
      const config = {
        enabled: true,
        host: 'redis.example.com',
        port: 6379,
        poolSize: 20,
      }

      const result = validateRedisConfig(config)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.errors.length, 0)
    })

    await t.test('should reject invalid port', () => {
      const config = { port: 70000 }
      const result = validateRedisConfig(config)

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('port must be between 1 and 65535')))
    })

    await t.test('should reject invalid pool size', () => {
      const config = { poolSize: -1 }
      const result = validateRedisConfig(config)

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('poolSize must be between 1 and 1000')))
    })

    await t.test('should reject invalid TTL', () => {
      const config = { ttlSeconds: 0 }
      const result = validateRedisConfig(config)

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('ttlSeconds must be greater than 0')))
    })

    await t.test('should reject invalid persistence mode', () => {
      const config = { persistenceMode: 'INVALID' }
      const result = validateRedisConfig(config)

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes("persistenceMode must be 'AOF' or 'RDB'")))
    })

    await t.test('should reject invalid eviction policy', () => {
      const config = { evictionPolicy: 'INVALID' }
      const result = validateRedisConfig(config)

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('evictionPolicy must be one of')))
    })

    await t.test('should warn when cluster mode enabled without nodes', () => {
      const config = {
        clusterMode: true,
        clusterNodes: [],
      }

      const result = validateRedisConfig(config)
      assert.ok(result.warnings.some((w) => w.includes('clusterNodes is empty')))
    })

    await t.test('should warn when replication enabled without replica host', () => {
      const config = {
        replicationEnabled: true,
      }

      const result = validateRedisConfig(config)
      assert.ok(result.warnings.some((w) => w.includes('replicaHost not specified')))
    })

    await t.test('should handle undefined config', () => {
      const result = validateRedisConfig(undefined)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.errors.length, 0)
    })
  })

  await t.test('validateWatchConfig', async (t) => {
    await t.test('should accept valid Watch configuration', () => {
      const config = {
        enabled: true,
        rootPath: '/project',
        patterns: ['**/*.tsx', '**/*.ts'],
        debounceMs: 100,
      }

      const result = validateWatchConfig(config)
      assert.strictEqual(result.valid, true)
      assert.strictEqual(result.errors.length, 0)
    })

    await t.test('should reject negative debounceMs', () => {
      const config = { debounceMs: -10 }
      const result = validateWatchConfig(config)

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('debounceMs must be >= 0')))
    })

    await t.test('should warn when patterns is empty', () => {
      const config = { patterns: [] }
      const result = validateWatchConfig(config)

      assert.ok(result.warnings.some((w) => w.includes('patterns is empty')))
    })
  })

  await t.test('validateIDRegistryConfig', async (t) => {
    await t.test('should accept valid ID Registry configuration', () => {
      const result = validateIDRegistryConfig({
        enabled: true,
        snapshotIntervalMs: 300000,
      })

      assert.strictEqual(result.valid, true)
    })

    await t.test('should warn when snapshot interval is very small', () => {
      const result = validateIDRegistryConfig({
        snapshotIntervalMs: 500,
      })

      assert.ok(result.warnings.some((w) => w.includes('snapshotIntervalMs is very small')))
    })
  })

  await t.test('validateIncrementalConfig', async (t) => {
    await t.test('should accept valid Incremental configuration', () => {
      const result = validateIncrementalConfig({
        enabled: true,
        maxAgeSeconds: 604800,
        maxCacheEntries: 10000,
      })

      assert.strictEqual(result.valid, true)
    })

    await t.test('should reject invalid maxAgeSeconds', () => {
      const result = validateIncrementalConfig({
        maxAgeSeconds: 0,
      })

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('maxAgeSeconds must be >= 1')))
    })

    await t.test('should reject invalid maxCacheEntries', () => {
      const result = validateIncrementalConfig({
        maxCacheEntries: -5,
      })

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('maxCacheEntries must be >= 1')))
    })
  })

  await t.test('validateThemeConfig', async (t) => {
    await t.test('should accept valid Theme configuration', () => {
      const result = validateThemeConfig({
        enabled: true,
        cacheSize: 1000,
      })

      assert.strictEqual(result.valid, true)
    })

    await t.test('should reject invalid cache size', () => {
      const result = validateThemeConfig({
        cacheSize: 0,
      })

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('cacheSize must be >= 1')))
    })
  })

  await t.test('validateOptimizationConfig', async (t) => {
    await t.test('should accept valid Optimization configuration', () => {
      const result = validateOptimizationConfig({
        enabled: true,
        minReductionPercent: 10,
      })

      assert.strictEqual(result.valid, true)
    })

    await t.test('should reject invalid minReductionPercent', () => {
      const result = validateOptimizationConfig({
        minReductionPercent: 150,
      })

      assert.strictEqual(result.valid, false)
      assert.ok(
        result.errors.some((e) => e.includes('minReductionPercent must be between 0 and 100'))
      )
    })
  })

  await t.test('validateAtomicCssConfig', async (t) => {
    await t.test('should accept valid Atomic CSS configuration', () => {
      const result = validateAtomicCssConfig({
        enabled: true,
        registryCacheSize: 5000,
      })

      assert.strictEqual(result.valid, true)
    })

    await t.test('should reject invalid registry cache size', () => {
      const result = validateAtomicCssConfig({
        registryCacheSize: 0,
      })

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('registryCacheSize must be >= 1')))
    })
  })

  await t.test('validateAnalysisConfig', async (t) => {
    await t.test('should accept valid Analysis configuration', () => {
      const result = validateAnalysisConfig({
        enabled: true,
        minUsageThreshold: 1,
      })

      assert.strictEqual(result.valid, true)
    })

    await t.test('should reject invalid minUsageThreshold', () => {
      const result = validateAnalysisConfig({
        minUsageThreshold: -5,
      })

      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('minUsageThreshold must be >= 0')))
    })
  })

  await t.test('validateFeaturesConfig', async (t) => {
    await t.test('should validate entire configuration', () => {
      const config = {
        redis: { enabled: true, port: 6379 },
        watch: { enabled: true, debounceMs: 100 },
        optimization: { minReductionPercent: 10 },
      }

      const result = validateFeaturesConfig(config)
      assert.strictEqual(result.valid, true)
    })

    await t.test('should collect errors from all domains', () => {
      const config = {
        redis: { port: 99999 },
        watch: { debounceMs: -1 },
        optimization: { minReductionPercent: 150 },
      }

      const result = validateFeaturesConfig(config)
      assert.strictEqual(result.valid, false)
      assert.ok(result.errors.length >= 3)
    })

    await t.test('should handle undefined config', () => {
      const result = validateFeaturesConfig(undefined)
      assert.strictEqual(result.valid, true)
    })
  })

  await t.test('mergeWithDefaults', async (t) => {
    await t.test('should return defaults when user config is undefined', () => {
      const result = mergeWithDefaults(undefined)
      assert.strictEqual(result.redis?.host, DEFAULT_FEATURES_CONFIG.redis?.host)
      assert.strictEqual(result.watch?.debounceMs, DEFAULT_FEATURES_CONFIG.watch?.debounceMs)
    })

    await t.test('should merge user config with defaults', () => {
      const userConfig = {
        redis: {
          host: 'custom-redis.local',
          enabled: true,
        },
      }

      const result = mergeWithDefaults(userConfig)

      assert.strictEqual(result.redis?.host, 'custom-redis.local')
      assert.strictEqual(result.redis?.enabled, true)
      assert.strictEqual(result.redis?.port, DEFAULT_FEATURES_CONFIG.redis?.port)
      assert.strictEqual(result.redis?.poolSize, DEFAULT_FEATURES_CONFIG.redis?.poolSize)
    })

    await t.test('should merge all 8 feature configs', () => {
      const userConfig = {
        redis: { enabled: true },
        watch: { enabled: true },
        idRegistry: { enabled: true },
        incremental: { enabled: true },
        theme: { enabled: true },
        optimization: { enabled: true },
        atomicCss: { enabled: true },
        analysis: { enabled: true },
      }

      const result = mergeWithDefaults(userConfig)

      assert.ok(result.redis)
      assert.ok(result.watch)
      assert.ok(result.idRegistry)
      assert.ok(result.incremental)
      assert.ok(result.theme)
      assert.ok(result.optimization)
      assert.ok(result.atomicCss)
      assert.ok(result.analysis)

      assert.strictEqual(result.redis?.enabled, true)
      assert.strictEqual(result.watch?.enabled, true)
      assert.strictEqual(result.idRegistry?.enabled, true)
      assert.strictEqual(result.incremental?.enabled, true)
      assert.strictEqual(result.theme?.enabled, true)
      assert.strictEqual(result.optimization?.enabled, true)
      assert.strictEqual(result.atomicCss?.enabled, true)
      assert.strictEqual(result.analysis?.enabled, true)
    })
  })

  await t.test('loadFromTailwindConfig', async (t) => {
    await t.test('should load features from tailwind config', () => {
      const tailwindConfig = {
        content: ['./src/**/*.{js,ts,jsx,tsx}'],
        features: {
          redis: { enabled: true, host: 'redis.local' },
          watch: { enabled: true },
        },
      }

      const result = loadFromTailwindConfig(tailwindConfig)
      assert.strictEqual(result?.redis?.enabled, true)
      assert.strictEqual(result?.redis?.host, 'redis.local')
      assert.strictEqual(result?.watch?.enabled, true)
    })

    await t.test('should return undefined when features not in config', () => {
      const tailwindConfig = {
        content: ['./src/**/*.{js,ts,jsx,tsx}'],
      }

      const result = loadFromTailwindConfig(tailwindConfig)
      assert.strictEqual(result, undefined)
    })

    await t.test('should handle undefined config', () => {
      const result = loadFromTailwindConfig(undefined)
      assert.strictEqual(result, undefined)
    })
  })

  await t.test('createFeaturesConfig', async (t) => {
    await t.test('should create config with defaults and validation', () => {
      const result = createFeaturesConfig()

      assert.ok(result.config)
      assert.ok(result.validation)
      assert.strictEqual(result.validation.valid, true)
      assert.strictEqual(result.config.redis?.enabled, false)
    })

    await t.test('should merge user config and validate', () => {
      const userConfig = {
        redis: {
          enabled: true,
          host: 'redis.example.com',
        },
      }

      const result = createFeaturesConfig(userConfig)

      assert.strictEqual(result.config.redis?.enabled, true)
      assert.strictEqual(result.config.redis?.host, 'redis.example.com')
      assert.strictEqual(result.config.redis?.port, DEFAULT_FEATURES_CONFIG.redis?.port)
      assert.strictEqual(result.validation.valid, true)
    })

    await t.test('should detect validation errors', () => {
      const userConfig = {
        redis: {
          port: 99999,
        },
      }

      const result = createFeaturesConfig(userConfig)

      assert.strictEqual(result.validation.valid, false)
      assert.ok(result.validation.errors.length > 0)
    })

    await t.test('should return config even with validation errors', () => {
      const userConfig = {
        redis: {
          port: 99999,
        },
      }

      const result = createFeaturesConfig(userConfig)

      assert.ok(result.config)
      assert.ok(result.config.redis)
    })
  })

  await t.test('Configuration Examples', async (t) => {
    await t.test('should support minimal configuration (only needed options)', () => {
      const minimalConfig = {
        redis: { enabled: true },
      }

      const result = createFeaturesConfig(minimalConfig)
      assert.strictEqual(result.validation.valid, true)
      assert.strictEqual(result.config.redis?.enabled, true)
      assert.strictEqual(result.config.redis?.host, 'localhost')
      assert.strictEqual(result.config.redis?.port, 6379)
    })

    await t.test('should support full configuration with all features enabled', () => {
      const fullConfig = {
        redis: {
          enabled: true,
          host: 'redis.prod.internal',
          port: 6379,
          poolSize: 50,
          clusterMode: true,
          clusterNodes: ['node1:6379', 'node2:6379'],
          replicationEnabled: true,
          replicaHost: 'replica1.prod.internal',
          persistenceEnabled: true,
          evictionPolicy: 'LRU',
        },
        watch: {
          enabled: true,
          patterns: ['**/*.tsx', '**/*.ts', 'tailwind.config.js'],
          debounceMs: 150,
        },
        idRegistry: {
          enabled: true,
          exportEnabled: true,
        },
        incremental: {
          enabled: true,
          fingerprintingEnabled: true,
          streamingEnabled: true,
        },
        theme: {
          enabled: true,
          compositionEnabled: true,
        },
        optimization: {
          enabled: true,
          deadCodeEliminationEnabled: true,
          minificationEnabled: true,
        },
        atomicCss: {
          enabled: true,
        },
        analysis: {
          enabled: true,
          dependencyTrackingEnabled: true,
        },
      }

      const result = createFeaturesConfig(fullConfig)
      assert.strictEqual(result.validation.valid, true)
      assert.strictEqual(result.config.redis?.enabled, true)
      assert.strictEqual(result.config.watch?.enabled, true)
      assert.strictEqual(result.config.optimization?.minificationEnabled, true)
    })
  })
})
