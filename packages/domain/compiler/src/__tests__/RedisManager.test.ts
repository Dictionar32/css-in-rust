/**
 * RedisManager.test.ts
 * 
 * Tests for Redis distributed caching implementation
 * - Cache operations (get/set/delete/batch)
 * - Cluster mode
 * - Replication and pub/sub
 * - Persistence and cache warming
 * - Diagnostics and eviction policies
 * 
 * **Validates: Requirements 1.3-1.20 (Redis Distributed Caching)**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { RedisManager, type RedisManagerConfig } from "../managers/RedisManager"

// Mock NativeBridge
vi.mock("../nativeBridge", () => {
  const mockBridge = {
    redis_get: (key: string) => (key === "test-key" ? "test-value" : "nil"),
    redis_set: (key: string, value: string, ttl?: number) => "OK",
    redis_delete: (key: string) => 1,
    redis_exists: (key: string) => (key === "test-key" ? 1 : 0),
    redis_mget: (keys: string[]) => JSON.stringify({
      "key1": "value1",
      "key2": "value2",
    }),
    redis_mset: (pairs: Array<[string, string]>) => "OK",
    redis_cache_size: () => 1024,
    redis_cache_key_count: () => 100,
    redis_cache_clear: () => 100,
    redis_cache_hit_rate: () => 75.0,
    redis_pool_connect: (host: string, port: number, poolSize?: number) => JSON.stringify({
      active_connections: 5,
      available_connections: 5,
      pool_size: poolSize || 10,
      total_requests: 1000,
      average_latency_ms: 2.5,
    }),
    redis_pool_stats: () => JSON.stringify({
      active_connections: 5,
      available_connections: 5,
      pool_size: 10,
      total_requests: 1000,
      average_latency_ms: 2.5,
    }),
    redis_pool_reconnect: () => JSON.stringify({ success: true }),
    redis_enable_cluster: (nodes: string[]) => JSON.stringify({
      enabled: true,
      node_count: nodes.length,
      nodes: nodes.map(n => {
        const [host, port] = n.split(":")
        return { host, port: parseInt(port), status: "healthy" }
      }),
      slots_covered: 16384,
    }),
    redis_disable_cluster: () => "OK",
    redis_cluster_status: () => JSON.stringify({
      enabled: false,
      node_count: 0,
      nodes: [],
      slots_covered: 0,
    }),
    redis_replicate: (host: string, port: number) => 1,
    redis_replication_status: () => JSON.stringify({
      enabled: false,
      master: "",
      replicas: [],
      lag_bytes: 0,
      sync_in_progress: false,
    }),
    redis_subscribe: (channel: string) => "SUBSCRIBED",
    redis_publish: (channel: string, message: string) => 1,
    redis_cache_sync: (peers: string[]) => 50,
    redis_enable_persistence: (mode: string) => "OK",
    redis_disable_persistence: () => "OK",
    redis_snapshot: () => "OK",
    redis_enable_cache_warming: (pattern: string) => "OK",
    redis_disable_cache_warming: () => "OK",
    redis_memory_stats: () => JSON.stringify({
      total_bytes: 1073741824,
      used_bytes: 536870912,
      available_bytes: 536870912,
      key_count: 100,
      avg_key_size_bytes: 25,
      avg_value_size_bytes: 512,
      recommendations: [],
    }),
    redis_optimize_memory: () => 10485760,
    redis_diagnose: () => JSON.stringify({
      connection_ok: true,
      latency_p95_ms: 5,
      memory_healthy: true,
      replication_ok: true,
      cluster_healthy: true,
      recommendations: [],
    }),
    redis_set_eviction_policy: (policy: string) => "OK",
    redis_get_eviction_policy: () => "LRU",
    redis_monitor: () => "1:GET key\r\n2:SET key value\r\n",
  }

  return {
    getNativeBridge: () => mockBridge,
  }
})

describe("RedisManager", () => {
  let manager: RedisManager

  beforeEach(() => {
    manager = new RedisManager({
      enabled: true,
      host: "localhost",
      port: 6379,
      poolSize: 10,
      ttlSeconds: 604800,
    })
  })

  afterEach(async () => {
    if (manager) {
      await manager.shutdown()
    }
  })

  describe("Task 2.2: Cache Operations", () => {
    it("should get cache value", async () => {
      const value = await manager.getCacheValue("test-key")
      expect(value).toBe("test-value")
    })

    it("should return null for missing key", async () => {
      const value = await manager.getCacheValue("missing-key")
      expect(value).toBeNull()
    })

    it("should set cache value", async () => {
      await expect(
        manager.setCacheValue("new-key", "new-value", 3600)
      ).resolves.not.toThrow()
    })

    it("should delete cache value", async () => {
      const deleted = await manager.deleteCacheValue("test-key")
      expect(deleted).toBe(true)
    })

    it("should check cache exists", async () => {
      const exists = await manager.cacheExists("test-key")
      expect(exists).toBe(true)

      const notExists = await manager.cacheExists("missing-key")
      expect(notExists).toBe(false)
    })

    it("should get cache size in bytes", async () => {
      const size = await manager.getCacheSize()
      expect(size).toBe(1024)
    })

    it("should get cache key count", async () => {
      const count = await manager.getCacheKeyCount()
      expect(count).toBe(100)
    })

    it("should get cache hit rate", async () => {
      const hitRate = await manager.getCacheHitRate()
      expect(hitRate).toBeGreaterThanOrEqual(0)
      expect(hitRate).toBeLessThanOrEqual(100)
    })

    it("should clear cache", async () => {
      const cleared = await manager.clearCache()
      expect(cleared).toBe(100)
    })
  })

  describe("Task 2.2: Batch Cache Operations", () => {
    it("should get multiple cache values", async () => {
      const results = await manager.getCacheMany(["key1", "key2", "key3"])
      expect(results.size).toBeGreaterThan(0)
      expect(results.get("key1")).toBe("value1")
      expect(results.get("key2")).toBe("value2")
    })

    it("should handle empty key list", async () => {
      const results = await manager.getCacheMany([])
      expect(results.size).toBe(0)
    })

    it("should set multiple cache values", async () => {
      const entries: Array<[string, string, number?]> = [
        ["key1", "value1", 3600],
        ["key2", "value2", 7200],
        ["key3", "value3"],
      ]
      await expect(manager.setCacheMany(entries)).resolves.not.toThrow()
    })

    it("should handle empty entries", async () => {
      await expect(manager.setCacheMany([])).resolves.not.toThrow()
    })
  })

  describe("Task 2.3: Cluster Mode", () => {
    it("should enable cluster mode", async () => {
      const status = await manager.enableCluster([
        "localhost:7000",
        "localhost:7001",
        "localhost:7002",
      ])

      expect(status.enabled).toBe(true)
      expect(status.node_count).toBe(3)
      expect(status.slots_covered).toBe(16384)
    })

    it("should get cluster status", async () => {
      const status = await manager.getClusterStatus()
      expect(status).toHaveProperty("enabled")
      expect(status).toHaveProperty("node_count")
      expect(status).toHaveProperty("nodes")
    })

    it("should disable cluster mode", async () => {
      await manager.enableCluster(["localhost:7000"])
      await expect(manager.disableCluster()).resolves.not.toThrow()

      const status = await manager.getClusterStatus()
      expect(status.enabled).toBe(false)
    })

    it("should reject empty node list", async () => {
      await expect(manager.enableCluster([])).rejects.toThrow()
    })
  })

  describe("Task 2.4: Replication", () => {
    it("should enable replication", async () => {
      await expect(
        manager.enableReplication("replica-host", 6380)
      ).resolves.not.toThrow()
    })

    it("should get replication status", async () => {
      const status = await manager.getReplicationStatus()
      expect(status).toHaveProperty("enabled")
      expect(status).toHaveProperty("master")
      expect(status).toHaveProperty("replicas")
    })

    it("should sync cache with peers", async () => {
      const synced = await manager.cacheSyncWithPeers([
        "peer1:6379",
        "peer2:6379",
      ])
      expect(synced).toBeGreaterThanOrEqual(0)
    })

    it("should handle empty peer list", async () => {
      const synced = await manager.cacheSyncWithPeers([])
      expect(synced).toBe(0)
    })
  })

  describe("Task 2.4: Pub/Sub", () => {
    it("should subscribe to channel", async () => {
      const iterator = await manager.subscribeToChannel("cache-events")
      expect(iterator).toHaveProperty("next")
    })

    it("should publish to channel", async () => {
      const subscribers = await manager.publishToChannel(
        "cache-events",
        "cache-invalidated"
      )
      expect(subscribers).toBeGreaterThanOrEqual(0)
    })
  })

  describe("Task 2.5: Persistence", () => {
    it("should enable AOF persistence", async () => {
      await expect(manager.enablePersistence("AOF")).resolves.not.toThrow()
    })

    it("should enable RDB persistence", async () => {
      await expect(manager.enablePersistence("RDB")).resolves.not.toThrow()
    })

    it("should disable persistence", async () => {
      await manager.enablePersistence("AOF")
      await expect(manager.disablePersistence()).resolves.not.toThrow()
    })

    it("should create snapshot", async () => {
      await expect(manager.createSnapshot()).resolves.not.toThrow()
    })
  })

  describe("Task 2.5: Cache Warming", () => {
    it("should enable cache warming", async () => {
      await expect(
        manager.enableCacheWarming("css-compiler:*:*:*")
      ).resolves.not.toThrow()
    })

    it("should disable cache warming", async () => {
      await manager.enableCacheWarming("css-compiler:*:*:*")
      await expect(manager.disableCacheWarming()).resolves.not.toThrow()
    })
  })

  describe("Task 2.6: Diagnostics", () => {
    it("should run diagnostics", async () => {
      const report = await manager.runDiagnostics()
      expect(report).toHaveProperty("connection_ok")
      expect(report).toHaveProperty("latency_p95_ms")
      expect(report).toHaveProperty("memory_healthy")
      expect(report).toHaveProperty("cluster_healthy")
    })

    it("should get memory stats", async () => {
      const stats = await manager.getMemoryStats()
      expect(stats).toHaveProperty("total_bytes")
      expect(stats).toHaveProperty("used_bytes")
      expect(stats).toHaveProperty("key_count")
      expect(stats.total_bytes).toBeGreaterThan(0)
    })

    it("should optimize memory", async () => {
      const freed = await manager.optimizeMemory()
      expect(freed).toBeGreaterThanOrEqual(0)
    })
  })

  describe("Task 2.6: Eviction Policies", () => {
    it("should set LRU eviction policy", async () => {
      await expect(manager.setEvictionPolicy("LRU")).resolves.not.toThrow()
    })

    it("should set LFU eviction policy", async () => {
      await expect(manager.setEvictionPolicy("LFU")).resolves.not.toThrow()
    })

    it("should set FIFO eviction policy", async () => {
      await expect(manager.setEvictionPolicy("FIFO")).resolves.not.toThrow()
    })

    it("should set RANDOM eviction policy", async () => {
      await expect(
        manager.setEvictionPolicy("RANDOM")
      ).resolves.not.toThrow()
    })

    it("should get eviction policy", async () => {
      await manager.setEvictionPolicy("LRU")
      const policy = await manager.getEvictionPolicy()
      expect(policy).toBe("LRU")
    })

    it("should monitor commands", async () => {
      const monitor = await manager.monitorCommands()
      expect(monitor).toHaveProperty("next")
    })
  })

  describe("Connection Pool", () => {
    it("should connect to pool", async () => {
      const stats = await manager.connectPool({
        host: "localhost",
        port: 6379,
        poolSize: 10,
      })

      expect(stats.pool_size).toBe(10)
      expect(stats.active_connections).toBeGreaterThan(0)
    })

    it("should get pool stats", async () => {
      await manager.connectPool()
      const stats = await manager.getPoolStats()

      expect(stats).toHaveProperty("active_connections")
      expect(stats).toHaveProperty("available_connections")
      expect(stats).toHaveProperty("pool_size")
      expect(stats).toHaveProperty("total_requests")
    })

    it("should reconnect to pool", async () => {
      await manager.connectPool()
      await expect(manager.reconnect()).resolves.not.toThrow()
    })
  })

  describe("Error Handling", () => {
    it("should handle cache miss gracefully", async () => {
      const value = await manager.getCacheValue("nonexistent")
      expect(value).toBeNull()
    })

    it("should track cache hit rate", async () => {
      await manager.getCacheValue("test-key")
      const hitRate = await manager.getCacheHitRate()
      expect(hitRate).toBeGreaterThanOrEqual(0)
    })

    it("should reset state", async () => {
      await manager.reset()
      const hitRate = await manager.getCacheHitRate()
      expect(hitRate).toBe(0)
    })
  })

  describe("Configuration", () => {
    it("should use default configuration", () => {
      const defaultManager = new RedisManager()
      expect(defaultManager).toBeDefined()
    })

    it("should use custom configuration", () => {
      const customConfig: RedisManagerConfig = {
        enabled: true,
        host: "redis.example.com",
        port: 6380,
        poolSize: 20,
        ttlSeconds: 86400,
        clusterMode: true,
        replicationEnabled: true,
        persistenceMode: "AOF",
        evictionPolicy: "LFU",
      }

      const customManager = new RedisManager(customConfig)
      expect(customManager).toBeDefined()
    })
  })
})
