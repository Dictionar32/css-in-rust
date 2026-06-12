/**
 * RedisManager Tests
 *
 * Unit tests untuk RedisManager core functionality
 * Phase 1 - Task 1.1: Redis Integration Foundation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RedisManager } from './RedisManager'
import * as nativeBridge from '../nativeBridgeWrappers'

// Mock native bridge
vi.mock('../nativeBridgeWrappers', () => ({
  redis_pool_connect: vi.fn(),
  redis_ping: vi.fn(),
  redis_get: vi.fn(),
  redis_set: vi.fn(),
  redis_delete: vi.fn(),
  redis_mget: vi.fn(),
  redis_mset: vi.fn(),
  redis_expire: vi.fn(),
  redis_ttl: vi.fn(),
  redis_pool_stats: vi.fn(),
  redis_memory_stats: vi.fn(),
  redis_flush_db: vi.fn(),
  redis_enable_cluster: vi.fn(),
  redis_sync_nodes: vi.fn(),
  redis_info: vi.fn(),
  redis_shutdown: vi.fn(),
}))

describe('RedisManager', () => {
  let manager: RedisManager

  beforeEach(() => {
    // Reset singleton
    ;(RedisManager as any).instance = null
    manager = RedisManager.getInstance()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = RedisManager.getInstance()
      const instance2 = RedisManager.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe('initialize', () => {
    it('should initialize with disabled Redis', async () => {
      await manager.initialize({
        compiler: {
          cache: {
            redis: {
              enabled: false,
              host: 'localhost',
              port: 6379,
            },
          },
        },
      } as any)

      expect(manager.isReady()).toBe(false)
    })

    it('should parse config with defaults', async () => {
      vi.mocked(nativeBridge.redis_pool_connect).mockResolvedValueOnce('OK')
      vi.mocked(nativeBridge.redis_ping).mockResolvedValueOnce('PONG')

      await manager.initialize({
        compiler: {
          cache: {
            redis: {
              enabled: true,
              host: 'localhost',
              port: 6379,
              poolSize: 10,
            },
          },
        },
      } as any)

      expect(vi.mocked(nativeBridge.redis_pool_connect)).toHaveBeenCalled()
    })

    it('should read REDIS_URL from environment', async () => {
      vi.mocked(nativeBridge.redis_pool_connect).mockResolvedValueOnce('OK')
      vi.mocked(nativeBridge.redis_ping).mockResolvedValueOnce('PONG')

      process.env.REDIS_URL = 'redis://myhost:6380'

      await manager.initialize()

      expect(vi.mocked(nativeBridge.redis_pool_connect)).toHaveBeenCalled()
      const callArg = vi.mocked(nativeBridge.redis_pool_connect).mock.calls[0]?.[0]
      expect(callArg).toContain('myhost')

      delete process.env.REDIS_URL
    })
  })

  describe('ping', () => {
    it('should return true on successful ping', async () => {
      vi.mocked(nativeBridge.redis_ping).mockResolvedValueOnce('PONG')
      ;(manager as any).isConnected = true

      const result = await manager.ping()
      expect(result).toBe(true)
    })

    it('should return false if not connected', async () => {
      ;(manager as any).isConnected = false

      const result = await manager.ping()
      expect(result).toBe(false)
    })

    it('should set connected to false on ping failure', async () => {
      vi.mocked(nativeBridge.redis_ping).mockRejectedValueOnce(new Error('Connection failed'))
      ;(manager as any).isConnected = true

      await manager.ping()
      expect(manager.isReady()).toBe(false)
    })
  })

  describe('cache operations', () => {
    beforeEach(() => {
      ;(manager as any).isConnected = true
      ;(manager as any).config = {
        enabled: true,
        host: 'localhost',
        port: 6379,
        ttl: 604800,
      }
    })

    describe('get', () => {
      it('should get value from cache', async () => {
        vi.mocked(nativeBridge.redis_get).mockResolvedValueOnce('cached-value')

        const result = await manager.get('test-key')
        expect(result).toBe('cached-value')
        expect(vi.mocked(nativeBridge.redis_get)).toHaveBeenCalledWith('test-key')
      })

      it('should return null on cache miss', async () => {
        vi.mocked(nativeBridge.redis_get).mockResolvedValueOnce(null)

        const result = await manager.get('missing-key')
        expect(result).toBeNull()
      })

      it('should return null if not connected', async () => {
        ;(manager as any).isConnected = false

        const result = await manager.get('test-key')
        expect(result).toBeNull()
      })

      it('should handle errors gracefully', async () => {
        vi.mocked(nativeBridge.redis_get).mockRejectedValueOnce(new Error('Redis error'))

        const result = await manager.get('test-key')
        expect(result).toBeNull()
      })
    })

    describe('set', () => {
      it('should set value in cache', async () => {
        vi.mocked(nativeBridge.redis_set).mockResolvedValueOnce('OK')

        const result = await manager.set('test-key', 'test-value')
        expect(result).toBe(true)
        expect(vi.mocked(nativeBridge.redis_set)).toHaveBeenCalledWith('test-key', 'test-value', 604800)
      })

      it('should use custom TTL if provided', async () => {
        vi.mocked(nativeBridge.redis_set).mockResolvedValueOnce('OK')

        await manager.set('test-key', 'test-value', 3600)
        expect(vi.mocked(nativeBridge.redis_set)).toHaveBeenCalledWith('test-key', 'test-value', 3600)
      })

      it('should return false if not connected', async () => {
        ;(manager as any).isConnected = false

        const result = await manager.set('test-key', 'test-value')
        expect(result).toBe(false)
      })

      it('should return false on error', async () => {
        vi.mocked(nativeBridge.redis_set).mockRejectedValueOnce(new Error('Redis error'))

        const result = await manager.set('test-key', 'test-value')
        expect(result).toBe(false)
      })
    })

    describe('del', () => {
      it('should delete key from cache', async () => {
        vi.mocked(nativeBridge.redis_delete).mockResolvedValueOnce('1')

        const result = await manager.del('test-key')
        expect(result).toBe(true)
        expect(vi.mocked(nativeBridge.redis_delete)).toHaveBeenCalledWith('test-key')
      })

      it('should return false if key not found', async () => {
        vi.mocked(nativeBridge.redis_delete).mockResolvedValueOnce('0')

        const result = await manager.del('missing-key')
        expect(result).toBe(false)
      })

      it('should return false if not connected', async () => {
        ;(manager as any).isConnected = false

        const result = await manager.del('test-key')
        expect(result).toBe(false)
      })
    })

    describe('mget', () => {
      it('should get multiple values', async () => {
        const mockResult = { 'key1': 'value1', 'key2': 'value2' }
        vi.mocked(nativeBridge.redis_mget).mockResolvedValueOnce(JSON.stringify(mockResult))

        const result = await manager.mget(['key1', 'key2'])
        expect(result).toEqual(mockResult)
      })

      it('should return empty object if not connected', async () => {
        ;(manager as any).isConnected = false

        const result = await manager.mget(['key1', 'key2'])
        expect(result).toEqual({})
      })

      it('should return empty object on error', async () => {
        vi.mocked(nativeBridge.redis_mget).mockRejectedValueOnce(new Error('Redis error'))

        const result = await manager.mget(['key1', 'key2'])
        expect(result).toEqual({})
      })
    })

    describe('mset', () => {
      it('should set multiple values', async () => {
        vi.mocked(nativeBridge.redis_mset).mockResolvedValueOnce('OK')

        const pairs: Array<[string, string]> = [
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]
        const result = await manager.mset(pairs)
        expect(result).toBe(true)
      })

      it('should return false if not connected', async () => {
        ;(manager as any).isConnected = false

        const result = await manager.mset([['key1', 'value1']])
        expect(result).toBe(false)
      })
    })

    describe('expire', () => {
      it('should set expiration on key', async () => {
        vi.mocked(nativeBridge.redis_expire).mockResolvedValueOnce('1')

        const result = await manager.expire('test-key', 3600)
        expect(result).toBe(true)
        expect(vi.mocked(nativeBridge.redis_expire)).toHaveBeenCalledWith('test-key', 3600)
      })

      it('should return false if key not found', async () => {
        vi.mocked(nativeBridge.redis_expire).mockResolvedValueOnce('0')

        const result = await manager.expire('missing-key', 3600)
        expect(result).toBe(false)
      })
    })

    describe('ttl', () => {
      it('should return TTL for key', async () => {
        vi.mocked(nativeBridge.redis_ttl).mockResolvedValueOnce('3600')

        const result = await manager.ttl('test-key')
        expect(result).toBe(3600)
      })

      it('should return -1 if key not found', async () => {
        vi.mocked(nativeBridge.redis_ttl).mockResolvedValueOnce('-1')

        const result = await manager.ttl('missing-key')
        expect(result).toBe(-1)
      })

      it('should return -2 if not connected', async () => {
        ;(manager as any).isConnected = false

        const result = await manager.ttl('test-key')
        expect(result).toBe(-2)
      })
    })
  })

  describe('monitoring', () => {
    beforeEach(() => {
      ;(manager as any).isConnected = true
      ;(manager as any).config = { enabled: true }
    })

    describe('getStats', () => {
      it('should get cache statistics', async () => {
        const mockStats = {
          hits: 1000,
          misses: 250,
          hitRate: 0.8,
          totalSize: 1024000,
          keyCount: 150,
          evictions: 10,
          avgLatencyMs: 5,
        }
        vi.mocked(nativeBridge.redis_pool_stats).mockResolvedValueOnce(JSON.stringify(mockStats))

        const result = await manager.getStats()
        expect(result).toEqual(mockStats)
      })

      it('should return default stats if not connected', async () => {
        ;(manager as any).isConnected = false

        const result = await manager.getStats()
        expect(result.hits).toBe(0)
        expect(result.hitRate).toBe(0)
      })
    })

    describe('getMemoryStats', () => {
      it('should get memory statistics', async () => {
        const mockMemory = {
          usedMemory: 1024000,
          maxMemory: 2048000,
          memoryPercent: 50,
          allocatedMemory: 1024000,
          fragmentation: 1.1,
        }
        vi.mocked(nativeBridge.redis_memory_stats).mockResolvedValueOnce(JSON.stringify(mockMemory))

        const result = await manager.getMemoryStats()
        expect(result).toEqual(mockMemory)
      })
    })

    describe('flushDb', () => {
      it('should flush all keys', async () => {
        vi.mocked(nativeBridge.redis_flush_db).mockResolvedValueOnce('100')

        const result = await manager.flushDb()
        expect(result).toBe(100)
      })

      it('should return 0 if not connected', async () => {
        ;(manager as any).isConnected = false

        const result = await manager.flushDb()
        expect(result).toBe(0)
      })
    })
  })

  describe('cluster operations', () => {
    beforeEach(() => {
      ;(manager as any).isConnected = true
      ;(manager as any).config = { enabled: true }
    })

    it('should enable cluster mode', async () => {
      vi.mocked(nativeBridge.redis_enable_cluster).mockResolvedValueOnce(
        JSON.stringify({ status: 'ok' })
      )

      const result = await manager.enableCluster(['node1:6379', 'node2:6379'])
      expect(result).toBe(true)
    })

    it('should sync cluster nodes', async () => {
      vi.mocked(nativeBridge.redis_sync_nodes).mockResolvedValueOnce(
        JSON.stringify({ status: 'ok' })
      )

      const result = await manager.syncNodes()
      expect(result).toBe(true)
    })
  })

  describe('diagnostics', () => {
    beforeEach(() => {
      ;(manager as any).isConnected = true
      ;(manager as any).config = { enabled: true }
    })

    it('should generate diagnostic report', async () => {
      vi.mocked(nativeBridge.redis_ping).mockResolvedValueOnce('PONG')
      vi.mocked(nativeBridge.redis_pool_stats).mockResolvedValueOnce(
        JSON.stringify({
          hits: 100,
          misses: 10,
          hitRate: 0.91,
          totalSize: 1024,
          keyCount: 50,
          evictions: 0,
          avgLatencyMs: 2,
        })
      )
      vi.mocked(nativeBridge.redis_memory_stats).mockResolvedValueOnce(
        JSON.stringify({
          usedMemory: 512,
          maxMemory: 1024,
          memoryPercent: 50,
          allocatedMemory: 512,
          fragmentation: 1.0,
        })
      )

      const result = await manager.diagnose()
      expect(result.connected).toBe(true)
      expect(result.stats.hitRate).toBe(0.91)
      expect(result.memory.memoryPercent).toBe(50)
    })

    it('should identify high memory usage', async () => {
      vi.mocked(nativeBridge.redis_ping).mockResolvedValueOnce('PONG')
      vi.mocked(nativeBridge.redis_pool_stats).mockResolvedValueOnce(
        JSON.stringify({
          hits: 100,
          misses: 100,
          hitRate: 0.5,
          totalSize: 1024,
          keyCount: 50,
          evictions: 0,
          avgLatencyMs: 2,
        })
      )
      vi.mocked(nativeBridge.redis_memory_stats).mockResolvedValueOnce(
        JSON.stringify({
          usedMemory: 950,
          maxMemory: 1000,
          memoryPercent: 95,
          allocatedMemory: 950,
          fragmentation: 1.1,
        })
      )

      const result = await manager.diagnose()
      expect(result.issues).toContain('Redis memory usage > 90%')
    })
  })

  describe('getConfig', () => {
    it('should return current config', async () => {
      const config = {
        enabled: true,
        host: 'localhost',
        port: 6379,
      }
      ;(manager as any).config = config

      expect(manager.getConfig()).toEqual(config)
    })

    it('should return null if not initialized', () => {
      ;(manager as any).config = null

      expect(manager.getConfig()).toBeNull()
    })
  })

  describe('isReady', () => {
    it('should return true if connected and enabled', () => {
      ;(manager as any).isConnected = true
      ;(manager as any).config = { enabled: true }

      expect(manager.isReady()).toBe(true)
    })

    it('should return false if not connected', () => {
      ;(manager as any).isConnected = false

      expect(manager.isReady()).toBe(false)
    })

    it('should return false if disabled', () => {
      ;(manager as any).isConnected = true
      ;(manager as any).config = { enabled: false }

      expect(manager.isReady()).toBe(false)
    })
  })

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      vi.mocked(nativeBridge.redis_shutdown).mockResolvedValueOnce('OK')
      ;(manager as any).isConnected = true

      await manager.shutdown()
      expect(manager.isReady()).toBe(false)
    })

    it('should handle shutdown errors', async () => {
      vi.mocked(nativeBridge.redis_shutdown).mockRejectedValueOnce(new Error('Shutdown failed'))

      await expect(manager.shutdown()).resolves.not.toThrow()
    })
  })
})
