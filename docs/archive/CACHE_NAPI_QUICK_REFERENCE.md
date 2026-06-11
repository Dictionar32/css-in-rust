# Cache Configuration NAPI Functions - Quick Reference

**Phase 7.2.7 Implementation**  
**Date:** June 11, 2026

---

## Overview

Three new NAPI functions enable runtime cache configuration from JavaScript. All exported via `#[napi]` macro in `native/src/infrastructure/napi_bridge.rs`.

---

## Function 1: `configureCacheBackend()`

### Purpose
Configure the cache backend type and capacity at runtime.

### Signature
```rust
pub fn configure_cache_backend(
    backend_type: String,
    primary_capacity: u32,
    max_capacity: u32,
    path: Option<String>,
) -> napi::Result<String>
```

### JavaScript Usage
```javascript
// Configure as LRU cache with 5000 items
const result = await napi.configureCacheBackend("lru", 5000, 0, "");
console.log(result);
// Returns: {
//   "status": "configured",
//   "backend": "lru",
//   "capacity": 5000,
//   "stats": {
//     "hits": 0,
//     "misses": 0,
//     "hit_rate": 0.0
//   }
// }

// Configure as Adaptive cache with 5000 initial, 10000 max
await napi.configureCacheBackend("adaptive", 5000, 10000, "");

// Configure as Persistent cache with disk file
await napi.configureCacheBackend("persistent", 20000, 0, "./cache.json");

// Configure as Redis cache
await napi.configureCacheBackend("redis", 10000, 0, "redis://localhost:6379");
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `backend_type` | string | Yes | "lru", "adaptive", "persistent", "redis", "distributed", "lazy" |
| `primary_capacity` | u32 | Yes | Primary cache capacity (number of items) |
| `max_capacity` | u32 | No | Max capacity for adaptive backend |
| `path` | string? | No | File path for persistent cache, Redis URL, coordinator URL |

### Returns
```typescript
{
  "status": "configured",
  "backend": "lru|adaptive|persistent|...",
  "capacity": number,
  "stats": {
    "hits": number,
    "misses": number,
    "hit_rate": number (0.0-1.0)
  }
}
```

### Error Cases
```javascript
// Unknown backend type
try {
  await napi.configureCacheBackend("unknown", 5000, 0, "");
} catch (error) {
  // "Unknown backend type: unknown"
}
```

---

## Function 2: `getCacheStats()`

### Purpose
Get detailed statistics for all 4 internal caches (parse, resolve, compile, css_gen).

### Signature
```rust
pub fn get_cache_stats() -> napi::Result<String>
```

### JavaScript Usage
```javascript
// Get current cache statistics
const stats = await napi.getCacheStats();
console.log(stats);
// Returns:
// {
//   "parse": {
//     "hits": 1234,
//     "misses": 456,
//     "current_size": 892,
//     "capacity": 5000,
//     "evictions": 100,
//     "hit_rate": 0.730
//   },
//   "resolve": { ... },
//   "compile": { ... },
//   "css_gen": { ... },
//   "total": {
//     "global_hits": 5000,
//     "global_misses": 1500,
//     "global_hit_rate": 0.769
//   }
// }
```

### Return Structure
```typescript
interface CacheStats {
  parse: PerCacheStats;
  resolve: PerCacheStats;
  compile: PerCacheStats;
  css_gen: PerCacheStats;
  total: {
    global_hits: number;
    global_misses: number;
    global_hit_rate: number;
  };
}

interface PerCacheStats {
  hits: number;           // Cache hits
  misses: number;         // Cache misses
  current_size: number;   // Current entries in cache
  capacity: number;       // Max capacity
  evictions: number;      // Total evictions
  hit_rate: number;       // Calculated hit_rate (hits / (hits + misses))
}
```

### Example: Monitor Cache Performance
```javascript
// Monitor cache health over time
setInterval(async () => {
  const stats = await napi.getCacheStats();
  const hitRate = (stats.total.global_hit_rate * 100).toFixed(2);
  console.log(`Cache hit rate: ${hitRate}%`);
  
  if (stats.total.global_hit_rate < 0.6) {
    console.warn("Low hit rate detected - cache configuration may need adjustment");
  }
}, 60000); // Check every minute
```

### Example: Cache Warm-up Verification
```javascript
// Verify cache is properly warmed up
async function verifyCacheWarmed() {
  const stats = await napi.getCacheStats();
  const avgSize = (
    stats.parse.current_size + 
    stats.resolve.current_size + 
    stats.compile.current_size + 
    stats.css_gen.current_size
  ) / 4;
  
  return avgSize > (stats.parse.capacity * 0.7); // 70% full
}
```

---

## Function 3: `getRecommendedCacheConfig()`

### Purpose
Get cache configuration recommendations based on workload type.

### Signature
```rust
pub fn get_recommended_cache_config(workload_type: String) -> napi::Result<String>
```

### JavaScript Usage
```javascript
// Get recommendation for small workload
const smallConfig = await napi.getRecommendedCacheConfig("small");
console.log(smallConfig);
// Returns:
// {
//   "backend": "lru",
//   "capacity": 1000,
//   "max_capacity": 2000,
//   "workload": "small",
//   "recommendation": "Recommended for small workload",
//   "features": ["fast", "low-memory"]
// }

// Get recommendation for production
const prodConfig = await napi.getRecommendedCacheConfig("production");
// Returns:
// {
//   "backend": "persistent",
//   "capacity": 20000,
//   "max_capacity": 100000,
//   "workload": "production",
//   "recommendation": "Recommended for production workload",
//   "features": ["persistent", "distributed", "monitoring", "failover"]
// }
```

### Workload Types

| Workload | Backend | Capacity | Max | Features |
|----------|---------|----------|-----|----------|
| **small** | LRU | 1,000 | 2,000 | fast, low-memory |
| **medium** | Adaptive | 5,000 | 10,000 | balanced, adaptive, monitoring |
| **large** | Adaptive | 10,000 | 50,000 | high-performance, adaptive, persistent-backup |
| **production** | Persistent | 20,000 | 100,000 | persistent, distributed, monitoring, failover |

### Return Structure
```typescript
interface RecommendedConfig {
  backend: "lru" | "adaptive" | "persistent" | "redis" | "distributed";
  capacity: number;
  max_capacity: number;
  workload: "small" | "medium" | "large" | "production";
  recommendation: string;
  features: string[];
}
```

### Example: Auto-tune Based on Environment
```javascript
// Auto-configure based on environment
function getEnvironmentWorkload() {
  if (process.env.NODE_ENV === 'production') return 'production';
  if (process.env.NODE_ENV === 'test') return 'small';
  return 'medium';
}

async function autoConfigureCache() {
  const workload = getEnvironmentWorkload();
  const config = await napi.getRecommendedCacheConfig(workload);
  
  console.log(`Configuring for ${workload} workload:`);
  console.log(`  Backend: ${config.backend}`);
  console.log(`  Capacity: ${config.capacity}`);
  console.log(`  Features: ${config.features.join(', ')}`);
  
  // Apply configuration
  await napi.configureCacheBackend(
    config.backend,
    config.capacity,
    config.max_capacity,
    "" // Use default path for persistent
  );
}

autoConfigureCache();
```

---

## Integration Examples

### Example 1: Cache Monitoring Dashboard
```javascript
// Real-time cache statistics
class CacheMonitor {
  async getStats() {
    return await napi.getCacheStats();
  }

  async getHealthStatus() {
    const stats = await this.getStats();
    const hr = stats.total.global_hit_rate;
    
    return {
      hitRate: (hr * 100).toFixed(2) + '%',
      health: hr > 0.8 ? 'excellent' : hr > 0.6 ? 'good' : 'poor',
      timestamp: new Date().toISOString()
    };
  }

  async reportMetrics() {
    const status = await this.getHealthStatus();
    console.log(`[CACHE] Hit rate: ${status.hitRate}, Health: ${status.health}`);
    return status;
  }
}

const monitor = new CacheMonitor();
setInterval(() => monitor.reportMetrics(), 30000);
```

### Example 2: Dynamic Cache Optimization
```javascript
// Adjust cache based on performance metrics
class AdaptiveCacheManager {
  constructor() {
    this.lowHitRateThreshold = 0.6;
    this.highHitRateThreshold = 0.85;
  }

  async checkAndOptimize() {
    const stats = await napi.getCacheStats();
    const hitRate = stats.total.global_hit_rate;

    if (hitRate < this.lowHitRateThreshold) {
      console.log('Hit rate low - increasing capacity');
      await napi.configureCacheBackend('adaptive', 10000, 20000, '');
    } else if (hitRate > this.highHitRateThreshold) {
      console.log('Hit rate excellent - could reduce capacity');
      await napi.configureCacheBackend('adaptive', 3000, 6000, '');
    }
  }
}

const manager = new AdaptiveCacheManager();
setInterval(() => manager.checkAndOptimize(), 60000);
```

### Example 3: Workload-Specific Configuration
```javascript
// Different configs for different scenarios
const cacheProfiles = {
  development: { workload: 'small', features: ['fast-reload'] },
  testing: { workload: 'small', features: ['isolation'] },
  staging: { workload: 'large', features: ['performance-test'] },
  production: { workload: 'production', features: ['high-availability'] }
};

async function initializeCache(environment) {
  const profile = cacheProfiles[environment] || cacheProfiles.development;
  const config = await napi.getRecommendedCacheConfig(profile.workload);

  console.log(`[CACHE] Initializing for ${environment}`);
  console.log(`  Workload: ${profile.workload}`);
  console.log(`  Backend: ${config.backend}`);
  console.log(`  Capacity: ${config.capacity}`);

  await napi.configureCacheBackend(
    config.backend,
    config.capacity,
    config.max_capacity,
    ""
  );
}

// Initialize on startup
initializeCache(process.env.NODE_ENV || 'development');
```

---

## Error Handling

### Common Error Cases
```javascript
try {
  // Unknown backend type
  await napi.configureCacheBackend('invalid', 5000, 0, '');
} catch (error) {
  console.error('Configuration error:', error.message);
  // Error: Unknown backend type: invalid
}

try {
  // Invalid workload type
  const config = await napi.getRecommendedCacheConfig('unknown');
} catch (error) {
  console.error('Config error:', error.message);
  // Falls back to default 'medium'
}
```

### Graceful Degradation
```javascript
async function safeGetStats() {
  try {
    return await napi.getCacheStats();
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return null; // Cache not available
  }
}

async function safeConfigureCache(backend, capacity) {
  try {
    return await napi.configureCacheBackend(backend, capacity, 0, '');
  } catch (error) {
    console.warn(`Failed to configure ${backend} cache, using fallback`);
    return await napi.configureCacheBackend('lru', 5000, 0, '');
  }
}
```

---

## Performance Considerations

### Function Call Overhead
- All three functions are thread-safe and non-blocking
- Lock contention minimal (atomic operations)
- Stats computation: O(1) for aggregation
- Configuration: O(1) factory call

### Best Practices
1. Call `getRecommendedCacheConfig()` once at startup
2. Call `getCacheStats()` periodically (e.g., 30-60 second intervals)
3. Avoid frequent `configureCacheBackend()` calls (can cause hiccups)
4. Cache recommendation results to avoid repeated function calls

---

## TypeScript Type Definitions

```typescript
// Type definitions for cache NAPI functions

declare module '@pkg/compiler' {
  // Function 1: Configure cache
  function configureCacheBackend(
    backend_type: 'lru' | 'adaptive' | 'persistent' | 'redis' | 'distributed' | 'lazy',
    primary_capacity: number,
    max_capacity: number,
    path?: string
  ): Promise<ConfigurationResult>;

  interface ConfigurationResult {
    status: 'configured';
    backend: string;
    capacity: number;
    stats: {
      hits: number;
      misses: number;
      hit_rate: number;
    };
  }

  // Function 2: Get cache stats
  function getCacheStats(): Promise<CacheStatsResult>;

  interface CacheStatsResult {
    parse: CacheMetrics;
    resolve: CacheMetrics;
    compile: CacheMetrics;
    css_gen: CacheMetrics;
    total: {
      global_hits: number;
      global_misses: number;
      global_hit_rate: number;
    };
  }

  interface CacheMetrics {
    hits: number;
    misses: number;
    current_size: number;
    capacity: number;
    evictions: number;
    hit_rate: number;
  }

  // Function 3: Get recommended config
  function getRecommendedCacheConfig(
    workload_type: 'small' | 'medium' | 'large' | 'production'
  ): Promise<RecommendedConfig>;

  interface RecommendedConfig {
    backend: string;
    capacity: number;
    max_capacity: number;
    workload: string;
    recommendation: string;
    features: string[];
  }
}
```

---

## Debugging

### Enable Cache Tracing
```javascript
// Trace all cache operations
async function debugCacheState() {
  console.log('=== CACHE STATE ===');
  
  const stats = await napi.getCacheStats();
  console.log('Parse Cache:', stats.parse);
  console.log('Resolve Cache:', stats.resolve);
  console.log('Compile Cache:', stats.compile);
  console.log('CSS Gen Cache:', stats.css_gen);
  console.log('Global Hit Rate:', (stats.total.global_hit_rate * 100).toFixed(2) + '%');
  
  console.log('');
  
  const config = await napi.getRecommendedCacheConfig('medium');
  console.log('Recommended Config:', config);
}

// Call on demand
process.on('SIGUSR1', debugCacheState);
```

---

**For detailed architecture documentation, see:** `PHASE_7_CACHE_BACKEND_PROGRESS.md`  
**For implementation details, see:** `PHASE_7_2_SESSION_3_SUMMARY.md`
