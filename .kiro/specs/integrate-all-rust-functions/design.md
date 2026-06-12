# Design: Integration Architecture for 110+ Rust Functions

**Status:** 📐 DESIGN PHASE  
**Last Updated:** 2026-06-12

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    tailwind.config.js                       │
│        (Redis config, watch patterns, optimization)         │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐  ┌──────────┐  ┌──────────────┐
    │ Redis   │  │ Watch    │  │ Theme        │
    │ Manager │  │ Manager  │  │ Resolution   │
    └────┬────┘  └────┬─────┘  └──────┬───────┘
         │            │               │
         └────────────┼───────────────┘
                      │
         ┌────────────▼────────────┐
         │  Compiler Pipeline      │
         ├─────────────────────────┤
         │ 1. Cache Check (Redis)  │
         │ 2. File Fingerprint     │
         │ 3. Incremental Diff     │
         │ 4. Theme Resolution     │
         │ 5. CSS Generation       │
         │ 6. Dead Code Elim       │
         │ 7. Optimization         │
         │ 8. Cache Store (Redis)  │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │   Rust NAPI Bridge      │
         │    (110+ functions)     │
         └────────────┬────────────┘
                      │
         ┌────────────▼────────────┐
         │   Rust Runtime          │
         │  (Parser, Compiler,     │
         │   Cache Backends)       │
         └────────────────────────┘
```

---

## Manager Classes & Responsibilities

### 1. RedisManager

```typescript
// packages/domain/compiler/src/managers/RedisManager.ts

interface RedisConfig {
  enabled: boolean
  host: string
  port: number
  poolSize?: number
  ttl?: number
  cluster?: { enabled: boolean; nodes?: string[] }
  persistence?: { enabled: boolean; mode: 'RDB' | 'AOF' }
  replication?: { enabled: boolean; targetHost: string; targetPort: number }
}

class RedisManager {
  // Initialization
  initialize(config: RedisConfig): Promise<void>
  
  // Cache operations
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl?: number): Promise<boolean>
  del(key: string): Promise<boolean>
  mget(keys: string[]): Promise<Record<string, string>>
  mset(pairs: Array<[string, string]>, ttl?: number): Promise<boolean>
  
  // Key expiration
  expire(key: string, ttlSeconds: number): Promise<boolean>
  ttl(key: string): Promise<number>
  
  // Batch operations
  flushDb(): Promise<number>
  flushAll(): Promise<number>
  
  // Cluster
  enableCluster(nodes: string[]): Promise<boolean>
  disableCluster(): Promise<void>
  
  // Persistence
  enablePersistence(mode: 'RDB' | 'AOF'): Promise<boolean>
  disablePersistence(): Promise<void>
  
  // Replication
  enableReplication(targetHost: string, targetPort: number): Promise<boolean>
  syncNodes(): Promise<boolean>
  
  // Monitoring
  ping(): Promise<boolean>
  getStats(): Promise<CacheStats>
  getMemoryStats(): Promise<MemoryStats>
  diagnose(): Promise<DiagnosticsReport>
  
  // Cleanup
  shutdown(): Promise<void>
}
```

**Integration Points:**
- Called dari compiler startup untuk initialize cache
- Used di CSS generation untuk cache lookups
- Used di cache invalidation untuk cleanup

---

### 2. WatchManager

```typescript
// packages/domain/compiler/src/managers/WatchManager.ts

interface WatchConfig {
  enabled: boolean
  patterns: string[]  // e.g., ["**/*.tsx", "**/*.ts"]
  debounce: number    // milliseconds
  ignore?: string[]   // gitignore patterns
  onFileChange?: (event: FileChangeEvent) => Promise<void>
}

interface FileChangeEvent {
  path: string
  type: 'Created' | 'Modified' | 'Deleted'
  timestamp: number
}

class WatchManager {
  // Initialization
  initialize(config: WatchConfig): Promise<void>
  
  // Watch management
  startWatch(rootPath: string, patterns?: string[]): Promise<number>
  stopWatch(handle: number): Promise<void>
  
  // Pattern management
  addPattern(handle: number, pattern: string): Promise<void>
  removePattern(handle: number, pattern: string): Promise<void>
  
  // Event polling
  pollEvents(handle: number, timeoutMs?: number): Promise<FileChangeEvent[]>
  getPerformance(): Promise<WatchPerformanceStats>
  
  // Pause/resume
  pause(handle: number): Promise<void>
  resume(handle: number): Promise<void>
  isRunning(handle: number): Promise<boolean>
  
  // Plugin hooks
  registerHook(hookName: string, handler: Function): void
  emitHook(hookName: string, data: any): Promise<any>
  
  // Monitoring
  getStats(): Promise<WatchStats>
  getActiveHandles(): Promise<number[]>
  
  // Cleanup
  clearAll(): Promise<void>
}
```

**Hook Names:**
- `on_file_changed` - File diubah (path, type)
- `before_recompile` - Sebelum recompile
- `after_compile` - Setelah compile selesai

---

### 3. IDRegistryManager

```typescript
// packages/domain/compiler/src/idRegistryNative.ts

interface RegistryEntry {
  id: number
  name: string
  type: 'component' | 'property' | 'value'
}

class IDRegistryManager {
  // Registry lifecycle
  create(): Promise<number>        // Returns handle
  destroy(handle: number): Promise<void>
  reset(handle: number): Promise<void>
  
  // ID generation
  generate(handle: number, name: string): Promise<number>
  lookup(handle: number, name: string): Promise<number>
  next(handle: number): Promise<number>
  
  // Property/value tracking
  registerProperty(propertyName: string): Promise<number>
  registerValue(valueName: string): Promise<number>
  propertyIdToString(propertyId: number): Promise<string>
  valueIdToString(valueId: number): Promise<string>
  reverseLookupProperty(propertyId: number): Promise<string>
  reverseLookupValue(valueId: number): Promise<string>
  
  // Serialization
  snapshot(handle: number): Promise<Record<string, any>>
  export(handle: number): Promise<string>
  import(data: string): Promise<number>
  
  // Inspection
  activeCount(): Promise<number>
}
```

**Usage Pattern:**
```typescript
// Per compilation session
const registryHandle = await idRegistry.create()
try {
  const buttonId = await idRegistry.generate(registryHandle, 'Button')
  const primaryId = await idRegistry.generate(registryHandle, 'Button.primary')
  // Use IDs dalam CSS selector generation
  // ...
  const exported = await idRegistry.export(registryHandle)
  // Store untuk future builds
} finally {
  await idRegistry.destroy(registryHandle)
}
```

---

### 4. ThemeResolutionManager

```typescript
// packages/domain/compiler/src/themeResolutionNative.ts

interface ThemeConfig {
  colors?: Record<string, string>
  spacing?: Record<string, string>
  fontSize?: Record<string, string>
  lineHeight?: Record<string, string>
  breakpoints?: Record<string, string>
  opacity?: Record<string, string>
  fontFamily?: Record<string, string>
}

class ThemeResolutionManager {
  // Theme setup
  loadTheme(config: ThemeConfig): Promise<void>
  validateConfig(config: ThemeConfig): Promise<ValidationResult>
  
  // Resolution
  resolveColor(color: string): Promise<string>
  resolveSpacing(spacing: string): Promise<string>
  resolveFontSize(size: string): Promise<string>
  resolveBreakpoint(breakpoint: string): Promise<string>
  resolveFontFamily(family: string): Promise<string>
  resolveOpacity(opacity: string): Promise<string>
  resolveLineHeight(height: string): Promise<string>
  
  // Advanced
  resolveVariants(config: VariantConfig): Promise<VariantResolution>
  resolveCascade(base: ThemeConfig, overrides: ThemeConfig): Promise<ThemeConfig>
  resolveClassNames(names: string[], theme: ThemeConfig): Promise<Record<string, string>>
  resolveConflictGroup(groupName: string): Promise<string[]>
  resolveThemeValue(keyPath: string): Promise<string | null>
  
  // Caching
  clearCache(): Promise<void>
  getCacheStats(): Promise<CacheStats>
}
```

**Caching Strategy:**
- First lookup: Rust resolves & caches
- Subsequent lookups: < 1ms dari cache
- Clear on theme change

---

### 5. IncrementalManager

```typescript
// packages/domain/compiler/src/managers/IncrementalManager.ts

interface FileFingerprint {
  path: string
  hash: string
  timestamp: number
}

interface IncrementalDiff {
  added: string[]
  removed: string[]
  modified: string[]
  unchanged: string[]
}

class IncrementalManager {
  // Fingerprinting
  createFingerprint(filePath: string, content: string): Promise<string>
  processFileChange(change: FileChangeEvent): Promise<ProcessedChange>
  
  // Diff computation
  computeDiff(oldScan: ScanResult, newScan: ScanResult): Promise<IncrementalDiff>
  
  // Workspace rebuild
  rebuildWorkspaceResult(
    rootDir: string,
    extensions?: string[]
  ): Promise<WorkspaceResult>
  
  // Batch operations
  scanFilesBatch(files: string[]): Promise<ScanResult>
  
  // Optimization hints
  getOptimizationHints(): Promise<OptimizationHints>
  estimateStreamingBatchSize(targetMemoryMb: number): Promise<number>
  
  // State management
  injectStateHash(css: string, stateHash: string): Promise<string>
  pruneStalEntries(maxAgeSeconds: number, maxEntries: number): Promise<number>
}
```

---

### 6. OptimizationManager

```typescript
// packages/domain/compiler/src/managers/OptimizationManager.ts

interface OptimizationResult {
  originalSize: number
  optimizedSize: number
  reduction: number
  reductionPercent: number
  deadClassesRemoved: number
  rulesRemoved: number
}

class OptimizationManager {
  // CSS compilation
  compileToCss(input: string, minify?: boolean): Promise<string>
  compileToCssBatch(inputs: string[], minify?: boolean): Promise<string>
  generateCss(rule: string, minify?: boolean): Promise<string>
  generateCssBatch(rules: CssRule[], minify?: boolean): Promise<string>
  
  // Optimization
  detectDeadCode(scanResult: ScanResult, css: string): Promise<string[]>
  eliminateDeadCss(css: string, deadClasses: string[]): Promise<string>
  optimizeCss(css: string): Promise<string>
  minifyCss(css: string): Promise<string>
  
  // Pipeline
  processViaLightningCSS(css: string, targets?: string): Promise<ProcessedCssResult>
  
  // Atomic CSS (optional)
  parseAtomicClass(twClass: string): Promise<string | null>
  generateAtomicCss(rules: CssRule[]): Promise<string>
  toAtomicClasses(twClasses: string): Promise<string>
  clearAtomicRegistry(): Promise<void>
  getAtomicRegistrySize(): Promise<number>
  
  // Analysis
  analyzeClassUsage(
    classes: string[],
    scanResult: ScanResult,
    css: string
  ): Promise<ClassUsageAnalysis>
}
```

---

### 7. CacheManager

```typescript
// packages/domain/compiler/src/managers/CacheManager.ts

type CacheBackend = 'lru' | 'redis' | 'persistent' | 'auto'

interface CacheStrategy {
  backend: CacheBackend
  lru?: { capacity: number }
  redis?: RedisConfig
  persistent?: { directory: string }
}

class CacheManager {
  // Configuration
  configureCacheBackend(strategy: CacheStrategy): Promise<void>
  getRecommendedConfig(workloadType: string): Promise<CacheStrategy>
  
  // Stats
  getCacheStats(): Promise<CacheStats>
  getResolverPoolStats(): Promise<ResolverPoolStats>
  getOptimizationHints(): Promise<OptimizationHints>
  
  // Clear operations
  clearAllCaches(): Promise<void>
  clearParseCache(): Promise<void>
  clearResolveCache(): Promise<void>
  clearCompileCache(): Promise<void>
  clearCssGenCache(): Promise<void>
  clearResolverPool(): Promise<void>
  
  // Streaming
  estimateStreamingBatchSize(targetMemoryMb: number): Promise<number>
}
```

---

## Integration Flow (Compiler Lifecycle)

```
1. STARTUP
   ├─ Load config dari tailwind.config.js
   ├─ Initialize RedisManager (if enabled)
   ├─ Initialize WatchManager (if dev mode)
   ├─ Initialize CacheManager (auto-detect backend)
   ├─ Load ThemeResolution
   └─ Create IDRegistry per session

2. WATCH FOR CHANGES (if dev mode)
   ├─ WatchManager.pollEvents()
   ├─ FileChangeEvent callbacks
   ├─ Trigger recompilation
   └─ Plugin hooks: on_file_changed

3. RECOMPILATION TRIGGERED
   ├─ Plugin hook: before_recompile
   ├─ Create FileFingerprints
   ├─ Compute IncrementalDiff
   ├─ Determine changed files
   └─ If all unchanged: return cached result

4. COMPILATION PROCESS
   ├─ Redis cache check (hit?)
   │  ├─ YES: return cached CSS ✅ (FAST PATH)
   │  └─ NO: continue
   ├─ IDRegistry.generate() untuk components
   ├─ ThemeResolution.loadTheme()
   ├─ ScanFilesBatch() untuk classes
   ├─ CSS generation
   ├─ OptimizationManager.optimizeCss()
   │  ├─ Detect dead code
   │  ├─ Eliminate dead code
   │  ├─ Minify via LightningCSS
   │  └─ ~85% size reduction
   ├─ Redis cache store (if enabled)
   └─ Plugin hook: after_compile

5. MONITORING & STATS
   ├─ RedisManager.getStats() → cache hit rate
   ├─ WatchManager.getPerformance() → latency
   ├─ OptimizationManager.analyzeClassUsage()
   ├─ CacheManager.getCacheStats()
   └─ Memory tracking

6. SHUTDOWN
   ├─ RedisManager.shutdown()
   ├─ WatchManager.clearAll()
   ├─ IDRegistry.export() → save state
   └─ CacheManager.clearCache()
```

---

## Configuration Schema

```json
{
  "compiler": {
    "cache": {
      "backend": "auto",
      "redis": {
        "enabled": false,
        "host": "localhost",
        "port": 6379,
        "poolSize": 10,
        "ttl": 604800,
        "cluster": {
          "enabled": false,
          "nodes": ["localhost:6379"]
        },
        "persistence": {
          "enabled": false,
          "mode": "RDB"
        }
      }
    },
    "watch": {
      "enabled": true,
      "patterns": [
        "**/*.tsx",
        "**/*.ts",
        "**/*.jsx",
        "**/*.js",
        "tailwind.config.js"
      ],
      "debounce": 300,
      "ignore": [
        ".git/**",
        "node_modules/**",
        ".next/**",
        "dist/**"
      ]
    },
    "theme": {
      "validation": true,
      "caching": true,
      "customTheme": {}
    },
    "optimization": {
      "deadCodeElimination": true,
      "minification": true,
      "lightningCss": true,
      "atomic": false
    },
    "incremental": {
      "enabled": true,
      "fingerprinting": true
    },
    "analysis": {
      "enabled": false,
      "reportMemory": false,
      "trackComponentUsage": false
    }
  }
}
```

---

## Error Handling & Fallbacks

### Redis Unavailable
```
Redis Cache → FALLBACK → LRU Cache → FALLBACK → No Cache (recompile)
```

### Watch System Fails
```
Watch Error → Log + Continue → Recompile triggered manually or check files
```

### Theme Resolution Fails
```
Invalid Theme → Clear error message → Use default theme → Continue
```

### Optimization Fails
```
Optimization error → Skip optimization → Use original CSS → Continue
```

---

## Performance Characteristics

| Operation | Target | Notes |
|-----------|--------|-------|
| Redis cache hit | < 50ms | Network latency + retrieval |
| Redis cache miss | < 200ms | Recompile + store |
| File change detection | < 100ms | Watch debouncing |
| Theme lookup (cached) | < 1ms | In-memory |
| Incremental diff (100 files) | < 500ms | Per-file fingerprinting |
| Dead code elimination | < 1s | For typical CSS |
| Minification | < 100ms | LightningCSS |
| ID registry lookup | < 1us | Hash-based |

---

## Testing Strategy

### Unit Tests
- Each manager class isolated
- Mock Rust functions
- Test error cases

### Integration Tests
- Multiple managers together
- Real Rust functions
- Config variations

### Performance Tests
- Benchmark each operation
- Verify targets met
- Memory profiling

### E2E Tests
- Full compilation pipeline
- Build verification
- Smoke tests

---

**Next: Create tasks.md for detailed implementation tasks** ✅
