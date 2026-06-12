# Use All 63 Rust Functions - Design Document

**Version:** 1.0  
**Status:** 🚀 DESIGN PHASE  
**Last Updated:** 2026-06-12  
**Feature Name:** use-all-63-rust-functions  
**Workflow:** Requirements-First

---

## Overview

This design document outlines the complete integration of 63 unused Rust functions into the CSS-in-Rust compiler's TypeScript layer. These functions, already exposed via NativeBridge but currently unused, provide critical capabilities across eight domains:

1. **Redis Distributed Caching** (40 functions) - Multi-machine cache sharing
2. **Watch System** (20 functions) - File monitoring and auto-recompile
3. **ID Registry** (16 functions) - Component tracking and reproducible builds
4. **Incremental Compilation** (8 functions) - Progressive CSS generation
5. **Theme Resolution** (7 functions) - Advanced theme composition
6. **CSS Optimization** (12 functions) - Dead code elimination
7. **Atomic CSS** (6 functions) - Single-property class generation
8. **Component Analysis** (8 functions) - Usage analytics and impact tracking

**Strategic Goals:**
- Reduce distributed build times by 60-80% via Redis caching
- Improve developer experience with instant file-change compilation
- Enable reproducible builds across machines via ID registry
- Optimize final CSS by 90%+ through dead code elimination
- Support advanced design system workflows

---

## Architecture

### System Diagram: Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TypeScript Application Layer                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Compiler Orchestrator (compiler/tailwindEngine.ts)                  │  │
│  │ - Route function calls to appropriate subsystem                      │  │
│  │ - Manage compilation pipeline state                                 │  │
│  │ - Handle fallback logic when features unavailable                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │
│  │ Watch Manager   │ │ Redis Manager    │ │ ID Registry Manager          │ │
│  │                 │ │                  │ │                              │ │
│  │ - init_watch()  │ │ - pool_connect() │ │ - create_registry()          │ │
│  │ - poll_events() │ │ - cache_ops()    │ │ - lookup()                   │ │
│  │ - plugin_hooks()│ │ - stats()        │ │ - export/import()            │ │
│  │ - debounce()    │ │ - diagnostics()  │ │ - snapshot()                 │ │
│  └─────────────────┘ └──────────────────┘ └──────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────┐ ┌──────────────────────────────────────────────┐ │
│  │ CSS Optimizer        │ │ Incremental Compiler                        │ │
│  │                      │ │                                              │ │
│  │ - detectDeadCode()   │ │ - process_file_change()                     │ │
│  │ - eliminateDeadCss() │ │ - compute_incremental_diff()                │ │
│  │ - optimizeCss()      │ │ - create_fingerprint()                      │ │
│  │ - generateAtomicCss()│ │ - rebuild_workspace_result()                │ │
│  └──────────────────────┘ │ - prune_stale_entries()                     │ │
│                           └──────────────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Theme Resolution Manager                                             │  │
│  │ - resolve_variants()      - resolve_cascade()                       │  │
│  │ - validate_variant_config() - resolve_class_names()                 │  │
│  │ - resolve_conflict_group()  - resolve_theme_value()                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Component Analysis Engine                                            │  │
│  │ - analyzeClassUsage()     - calculateImpact()                        │  │
│  │ - calculateRisk()          - calculateSavings()                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│              NAPI Bridge Layer (packages/domain/compiler)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Updated nativeBridge.ts exports ALL 63 functions:                           │
│  - Redis functions: redis_pool_connect, redis_cache_*, etc.                 │
│  - Watch functions: start_watch, poll_watch_events, register_plugin_hook    │
│  - ID Registry functions: id_registry_create, lookup, export/import         │
│  - Incremental functions: process_file_change, compute_incremental_diff     │
│  - Theme functions: resolve_variants, resolve_cascade, etc.                 │
│  - Optimization functions: detectDeadCode, eliminateDeadCss, etc.           │
│  - Analysis functions: analyzeClassUsage, calculateImpact, etc.             │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Rust Native Layer                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │
│  │ Redis Subsystem  │ │ Watch Subsystem  │ │ ID Registry Subsystem        │ │
│  │                  │ │                  │ │                              │ │
│  │ napi_bridge_     │ │ watch_api.rs     │ │ id_registry.rs               │ │
│  │ redis.rs         │ │                  │ │                              │ │
│  │                  │ │ Impl:            │ │ Impl:                        │ │
│  │ Impl:            │ │ - RedisPool      │ │ - RegistryHandle             │ │
│  │ - RedisPool      │ │ - FileWatcher    │ │ - ComponentID                │ │
│  │ - Connection     │ │ - PluginHook     │ │ - Registry                   │ │
│  │ - Replication    │ │ - Debouncer      │ │ - Serialization              │ │
│  │ - Pub/Sub        │ │                  │ │                              │ │
│  └──────────────────┘ └──────────────────┘ └──────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────┐ ┌────────────────────────────────────────────┐ │
│  │ Optimization Subsystem   │ │ Theme Resolution Subsystem                 │ │
│  │                          │ │                                            │ │
│  │ - detect_dead_code()     │ │ - resolve_variants()                      │ │
│  │ - eliminate_dead_css()   │ │ - resolve_cascade()                       │ │
│  │ - optimize_css()         │ │ - variant_precedence system               │ │
│  │ - atomic_registry.rs     │ │ - theme_cache.rs                          │ │
│  │                          │ │ - ThemeResolverPool (singleton)            │ │
│  └──────────────────────────┘ └────────────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Incremental Compilation Subsystem                                        │ │
│  │ - fingerprinting for change detection                                    │ │
│  │ - incremental diff computation                                           │ │
│  │ - workspace rebuilding from baseline                                     │ │
│  │ - streaming CSS architecture                                             │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │ Analysis & Impact Subsystem                                              │ │
│  │ - usage tracking and metrics                                             │ │
│  │ - impact calculation                                                     │ │
│  │ - risk assessment                                                        │ │
│  │ - bundle optimization                                                    │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Organization

**Rust Side (`native/src`):**
```
infrastructure/
├── redis/
│   ├── pool.rs                 # Connection pool management
│   ├── cache_ops.rs            # Cache read/write/clear
│   ├── replication.rs          # Master-replica setup
│   ├── pub_sub.rs              # Event broadcasting
│   └── diagnostics.rs          # Health checks & monitoring
├── watch/
│   ├── watcher.rs              # File system monitoring
│   ├── debouncer.rs            # Event debouncing
│   ├── plugin_hooks.rs         # Hook registration & emission
│   └── stats.rs                # Performance metrics
├── id_registry/
│   ├── registry.rs             # Core registry implementation
│   ├── serialization.rs        # Export/import logic
│   └── lookup.rs               # O(1) ID lookup
├── incremental/
│   ├── fingerprinting.rs       # File content hashing
│   ├── diff.rs                 # Change detection
│   ├── rebuild.rs              # Workspace rebuilding
│   └── streaming.rs            # Progressive CSS output
├── optimization/
│   ├── dead_code.rs            # Dead CSS detection
│   ├── atomic.rs               # Atomic CSS generation
│   ├── lightning_css.rs        # LightningCSS integration
│   └── dead_code_elimination.rs
└── analysis/
    ├── usage.rs                # Component usage tracking
    ├── impact.rs               # Impact calculation
    └── risk.rs                 # Risk assessment

application/
├── theme_resolver_pool.rs      # Advanced theme composition
└── theme_cache.rs              # Caching layer
```

**TypeScript Side (`packages/domain/compiler/src`):**
```
managers/
├── RedisManager.ts             # Distributed caching orchestration
├── WatchManager.ts             # File monitoring orchestration
├── IDRegistryManager.ts        # Component ID tracking
├── IncrementalManager.ts       # Progressive compilation
├── ThemeManager.ts             # Advanced theme resolution
├── OptimizationManager.ts      # CSS optimization
└── AnalysisManager.ts          # Component analysis

nativeBridge.ts                # Updated with all 63 functions
```

---

## Components and Interfaces

### 1. Redis Distributed Caching (40 Functions)

**Purpose:** Enable cache sharing across multiple machines/CI pipelines for 60-80% build time reduction

**Key Responsibilities:**
- Connection pool management with configurable size
- Cache read/write with TTL support
- Cluster mode for redundancy
- Replication for high availability
- Pub/Sub for cache invalidation events
- Health monitoring and diagnostics

**Core Interface:**

```typescript
// RedisManager.ts
export class RedisManager {
  // Connection Management
  async connectPool(config: {
    host: string
    port: number
    poolSize?: number        // default: 10
    password?: string
    ssl?: boolean
  }): Promise<PoolStats>
  
  async getPoolStats(): Promise<PoolStats>
  async reconnect(): Promise<void>
  
  // Cache Operations
  async getCacheValue(key: string): Promise<string | null>
  async setCacheValue(
    key: string,
    value: string,
    ttlSeconds?: number     // default: 604800 (7 days)
  ): Promise<void>
  
  async deleteCacheValue(key: string): Promise<boolean>
  async cacheExists(key: string): Promise<boolean>
  
  // Batch Operations
  async getCacheMany(keys: string[]): Promise<Map<string, string>>
  async setCacheMany(entries: Array<[string, string, number?]>): Promise<void>
  
  // Cache Statistics
  async getCacheSize(): Promise<number>
  async getCacheKeyCount(): Promise<number>
  async getCacheHitRate(): Promise<number>
  async clearCache(): Promise<number>
  
  // Cluster Mode
  async enableCluster(initialNodes: string[]): Promise<ClusterStatus>
  async disableCluster(): Promise<void>
  async getClusterStatus(): Promise<ClusterStatus>
  
  // Replication
  async enableReplication(targetHost: string, targetPort: number): Promise<void>
  async getReplicationStatus(): Promise<ReplicationStatus>
  
  // Pub/Sub
  async subscribeToChannel(channel: string): Promise<AsyncIterator<string>>
  async publishToChannel(channel: string, message: string): Promise<number>
  
  // Persistence
  async enablePersistence(mode: 'AOF' | 'RDB'): Promise<void>
  async disablePersistence(): Promise<void>
  async createSnapshot(): Promise<void>
  
  // Cache Warming
  async enableCacheWarming(keyPattern: string): Promise<void>
  async disableCacheWarming(): Promise<void>
  
  // Diagnostics
  async getMemoryStats(): Promise<MemoryStats>
  async optimizeMemory(): Promise<number>
  async runDiagnostics(): Promise<DiagnosticsReport>
  async setEvictionPolicy(policy: 'LRU' | 'LFU' | 'FIFO' | 'RANDOM'): Promise<void>
}
```

**Data Models:**

```typescript
interface PoolStats {
  active_connections: number
  available_connections: number
  pool_size: number
  total_requests: number
  average_latency_ms: number
}

interface ClusterStatus {
  enabled: boolean
  node_count: number
  nodes: Array<{ host: string; port: number; status: 'healthy' | 'down' }>
  slots_covered: number
}

interface ReplicationStatus {
  enabled: boolean
  master: string
  replicas: string[]
  lag_bytes: number
  sync_in_progress: boolean
}

interface MemoryStats {
  total_bytes: number
  used_bytes: number
  available_bytes: number
  key_count: number
  avg_key_size_bytes: number
  avg_value_size_bytes: number
  recommendations: string[]
}

interface DiagnosticsReport {
  connection_ok: boolean
  latency_p95_ms: number
  memory_healthy: boolean
  replication_ok: boolean
  cluster_healthy: boolean
  recommendations: string[]
}
```

**Cache Key Strategy:**

```
css-compiler:{file-hash}:{theme-id}:{variant-hash}:{build-id}

Example:
css-compiler:sha256(content):1:hash(variant):build123

TTL Strategy:
- Default: 604800 seconds (7 days)
- User-configurable per feature
- Invalidated on: theme change, config change, dependency update
```

**Integration Points:**
- Configuration: `tailwind.config.js` → `redis.enabled`, `redis.host`, `redis.port`
- Cache invalidation: Watch system triggers pub/sub broadcast
- Multi-machine builds: All builders connect to same Redis instance

---

### 2. Watch System (20 Functions)

**Purpose:** Enable instant CSS updates on file changes with debouncing and plugin hooks

**Key Responsibilities:**
- File system monitoring with pattern matching
- Event debouncing for rapid changes
- Plugin hook registration and emission
- Performance metrics and statistics

**Core Interface:**

```typescript
// WatchManager.ts
export class WatchManager {
  // Watch Lifecycle
  async startWatch(config: {
    rootPath: string
    patterns?: string[]        // default: ['**/*.tsx', '**/*.ts']
    debounceMs?: number        // default: 100
    gitignoreAware?: boolean   // default: true
  }): Promise<WatchHandle>
  
  async stopWatch(handle: WatchHandle): Promise<void>
  async pauseWatch(handle: WatchHandle): Promise<void>
  async resumeWatch(handle: WatchHandle): Promise<void>
  
  // Pattern Management
  async addPattern(handle: WatchHandle, pattern: string): Promise<void>
  async removePattern(handle: WatchHandle, pattern: string): Promise<void>
  
  // Event Polling
  async pollWatchEvents(
    handle: WatchHandle,
    timeoutMs?: number        // default: 1000
  ): Promise<WatchEvent[]>
  
  // Plugin Hooks
  async registerPluginHook(
    hookName: 'on_file_changed' | 'before_recompile' | 'after_compile',
    handlerId: string,
    handler: (data: any) => Promise<void>
  ): Promise<void>
  
  async unregisterPluginHook(hookName: string, handlerId: string): Promise<void>
  
  async emitPluginHook(
    hookName: string,
    data: Record<string, unknown>
  ): Promise<unknown[]>
  
  // Metadata
  async getWatchStats(): Promise<WatchStats>
  async getActiveHandles(): Promise<WatchHandle[]>
  async clearAllWatches(): Promise<void>
  async isWatchRunning(handle: WatchHandle): Promise<boolean>
}
```

**Data Models:**

```typescript
type WatchEventType = 'Modified' | 'Created' | 'Deleted'

interface WatchEvent {
  file_path: string
  event_type: WatchEventType
  timestamp_ms: number
}

interface WatchStats {
  active_handles: number
  total_files_watched: number
  events_processed: number
  average_latency_ms: number
  uptime_seconds: number
}

interface WatchHandle {
  __brand: 'WatchHandle'
  id: number
}
```

**Plugin Hooks:**

```typescript
// Hook: on_file_changed
interface FileChangeHookData {
  file_path: string
  event_type: WatchEventType
  file_size_bytes: number
  classes_found: string[]
  timestamp_ms: number
}

// Hook: before_recompile
interface BeforeRecompileHookData {
  files_changed: string[]
  total_files_to_process: number
  debounced_events: number
}

// Hook: after_compile
interface AfterCompileHookData {
  success: boolean
  css_size_bytes: number
  compilation_time_ms: number
  errors?: string[]
}
```

**Performance Targets:**
- File change detection: < 100ms
- Debounce handling: 100ms (configurable)
- Average latency: < 200ms from file change to recompile trigger
- Memory for 1000+ files: < 100MB

---

### 3. ID Registry (16 Functions)

**Purpose:** Track component IDs for reproducible builds and consistent selectors across machines

**Key Responsibilities:**
- Stable ID generation for named components
- Property/value mapping for CSS properties and values
- Serialization/deserialization for reproducibility
- Multi-registry support with isolation

**Core Interface:**

```typescript
// IDRegistryManager.ts
export class IDRegistryManager {
  // Registry Lifecycle
  createRegistry(): RegistryHandle
  destroyRegistry(handle: RegistryHandle): void
  
  // ID Generation & Lookup
  generateId(handle: RegistryHandle, name: string): ComponentID
  lookupId(handle: RegistryHandle, name: string): ComponentID
  getNextId(handle: RegistryHandle): ComponentID
  
  // Property/Value Mapping
  registerPropertyName(propertyName: string): PropertyID
  registerValueName(valueName: string): ValueID
  
  propertyIdToString(propertyId: PropertyID): string
  valueIdToString(valueId: ValueID): string
  
  reverseLookupProperty(propertyId: PropertyID): string
  reverseLookupValue(valueId: ValueID): string
  
  // Serialization
  snapshot(handle: RegistryHandle): RegistrySnapshot
  export(handle: RegistryHandle): string             // JSON
  import(importedData: string): RegistryHandle
  
  // Metadata
  reset(handle: RegistryHandle): void
  getActiveCount(): number
}
```

**Data Models:**

```typescript
type ComponentID = number & { __brand: 'ComponentID' }
type PropertyID = number & { __brand: 'PropertyID' }
type ValueID = number & { __brand: 'ValueID' }
type RegistryHandle = number & { __brand: 'RegistryHandle' }

interface RegistrySnapshot {
  components: Map<string, ComponentID>
  properties: Map<string, PropertyID>
  values: Map<string, ValueID>
  timestamp: number
}

interface ExportedRegistry {
  version: 1
  components: Array<{ name: string; id: ComponentID }>
  properties: Array<{ name: string; id: PropertyID }>
  values: Array<{ name: string; id: ValueID }>
  timestamp: number
}
```

**Reproducibility Guarantee:**

```typescript
// Same names always generate same IDs
const reg1 = manager.createRegistry()
const id1a = manager.generateId(reg1, 'Button.primary')
const id1b = manager.generateId(reg1, 'Button.primary')
assert(id1a === id1b)  // ✓ Idempotent

// Export/import preserves IDs
const exported = manager.export(reg1)
const reg2 = manager.import(exported)
const id2 = manager.generateId(reg2, 'Button.primary')
assert(id1a === id2)   // ✓ Reproducible across processes
```

**Performance Targets:**
- ID lookup: O(1) constant time
- Snapshot with 10K entries: < 100ms
- Export with 10K entries: < 100ms
- Import with 10K entries: < 100ms

---

### 4. Incremental Compilation (8 Functions)

**Purpose:** Detect changes and compile only affected CSS for 10x faster rebuilds

**Key Responsibilities:**
- File fingerprinting for change detection
- Incremental diff computation
- Workspace rebuilding from baseline
- Streaming CSS architecture

**Core Interface:**

```typescript
// IncrementalManager.ts
export class IncrementalManager {
  // Change Detection
  async processFileChange(fileChange: {
    file_path: string
    old_content?: string
    new_content: string
    event_type: 'Modified' | 'Created' | 'Deleted'
  }): Promise<FileChangeDiff>
  
  async computeIncrementalDiff(
    oldScan: ScanWorkspaceResult,
    newScan: ScanWorkspaceResult
  ): Promise<IncrementalDiff>
  
  // Fingerprinting
  createFingerprint(
    filePath: string,
    fileContent: string
  ): FileFingerprint
  
  // Incremental Rebuild
  async rebuildWorkspaceResult(
    rootDir: string,
    extensions?: string[]
  ): Promise<IncrementalBuildResult>
  
  // Cache Pruning
  async pruneStaleEntries(
    maxAgeSeconds: number,
    maxEntries?: number
  ): Promise<PruneResult>
  
  // State Injection
  injectStateHash(css: string, stateHash: string): string
  
  // Batch Processing
  async scanFilesNative(
    files: Array<{ path: string; content: string }>
  ): Promise<BatchScanResult>
}
```

**Data Models:**

```typescript
interface FileChangeDiff {
  file_path: string
  affected_classes: string[]
  removed_classes: string[]
  new_classes: string[]
  change_impact: 'low' | 'medium' | 'high'
}

interface IncrementalDiff {
  files_changed: string[]
  classes_added: string[]
  classes_removed: string[]
  classes_modified: string[]
  total_changes: number
  rebuild_required: boolean
}

interface FileFingerprint {
  file_path: string
  content_hash: string        // SHA-256 first 16 chars
  timestamp_ms: number
  size_bytes: number
}

interface IncrementalBuildResult {
  success: boolean
  baseline_hash: string
  changes_detected: number
  files_processed: number
  css_size_bytes: number
  build_time_ms: number
}

interface PruneResult {
  entries_removed: number
  bytes_reclaimed: number
  entries_remaining: number
}

interface BatchScanResult {
  total_files: number
  classes_found: string[]
  unique_classes: number
  errors: Array<{ file: string; error: string }>
}
```

**Compilation Flow:**

```
File Change Detected
       ↓
   Create Fingerprint
       ↓
   Compute Diff vs Previous Build
       ↓
   Identify Affected Classes
       ↓
   Compile Only Affected CSS
       ↓
   Merge with Non-Affected CSS
       ↓
   Prune Stale Entries
       ↓
   Inject State Hash
       ↓
   Stream to Client
```

**Performance Targets:**
- Single file change detection: < 50ms
- Incremental diff for 10K file project: < 200ms
- Rebuild 100 changed files: < 500ms (vs 5+ seconds full rebuild)
- Streaming first CSS chunk: < 200ms

---

### 5. Theme Resolution (7 Functions)

**Purpose:** Enable advanced multi-layer theme composition with deterministic precedence

**Key Responsibilities:**
- Variant resolution with precedence information
- Multi-layer theme cascade
- Class name to theme value mapping
- Conflict group resolution

**Core Interface:**

```typescript
// ThemeManager.ts
export class ThemeManager {
  // Variant Resolution
  async resolveVariants(config: ThemeVariantConfig): Promise<ResolvedVariants>
  async validateVariantConfig(config: ThemeVariantConfig): Promise<ValidationResult>
  async resolveSimpleVariants(config: SimpleVariantConfig): Promise<ResolvedVariants>
  
  // Theme Cascade
  async resolveCascade(
    baseTheme: ThemeConfig,
    overrides: ThemeConfig
  ): Promise<MergedTheme>
  
  // Value Resolution
  async resolveClassNames(
    classNames: string[],
    theme: ThemeConfig
  ): Promise<Map<string, string>>
  
  async resolveThemeValue(keyPath: string, theme: ThemeConfig): Promise<string | null>
  
  // Conflict Groups
  async resolveConflictGroup(
    groupName: string,
    theme: ThemeConfig
  ): Promise<string[]>
}
```

**Data Models:**

```typescript
interface ThemeVariantConfig {
  responsive?: Record<string, string>
  dark?: Record<string, string>
  state?: Record<string, string>
  custom?: Record<string, string>
}

interface SimpleVariantConfig {
  variants: Record<string, string>
  skipNesting?: boolean
}

interface ResolvedVariants {
  variants: Array<{
    name: string
    precedence: VariantPrecedence
    rules: string[]
  }>
  precedenceInfo: {
    interaction: number
    colorScheme: number
    responsive: number
    state: number
    custom: number
  }
}

enum VariantPrecedence {
  Interaction = 0,      // group:, peer:
  ColorScheme = 1,      // dark:, light:
  Responsive = 2,       // sm:, md:, lg:
  State = 3,            // hover:, focus:, active:
  Custom = 4            // User-defined
}

interface MergedTheme {
  colors?: Record<string, string>
  spacing?: Record<string, string>
  typography?: Record<string, unknown>
  custom?: Record<string, unknown>
  precedenceOrder: VariantPrecedence[]
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

**Theme Composition Example:**

```typescript
const brandTheme = { colors: { primary: '#0066cc' } }
const userTheme = { colors: { primary: '#ff6600' } }
const dynamicTheme = { colors: { primary: '#00ff00' } }

const merged = await themeManager.resolveCascade(
  brandTheme,
  { ...userTheme, ...dynamicTheme }
)
// Result: primary = '#00ff00' (dynamic > user > brand)
```

**Performance Targets:**
- Theme validation: < 50ms
- Variant resolution for 1000 variants: < 100ms
- Batch class name resolution (1000 classes): < 50ms
- Cached lookups: < 1ms

---

### 6. CSS Optimization (12 Functions)

**Purpose:** Eliminate dead CSS and minify output for 90%+ size reduction

**Key Responsibilities:**
- Dead code detection from scan results
- Dead CSS elimination from generated CSS
- LightningCSS integration for minification
- Optimization analytics

**Core Interface:**

```typescript
// OptimizationManager.ts
export class OptimizationManager {
  // Dead Code Analysis
  async detectDeadCode(
    scanResult: ScanWorkspaceResult,
    css: string
  ): Promise<DeadCodeAnalysis>
  
  async eliminateDeadCss(
    css: string,
    deadClasses: string[]
  ): Promise<string>
  
  // Full Optimization Pipeline
  async optimizeCss(css: string): Promise<OptimizationResult>
  
  // Process CSS with LightningCSS
  async processTailwindCssLightning(css: string): Promise<ProcessedCssResult>
  async processTailwindCssWithTargets(
    css: string,
    targets?: string
  ): Promise<ProcessedCssResult>
  
  // Atomic CSS
  async parseAtomicClass(twClass: string): Promise<string | null>
  async generateAtomicCss(rules: Array<{ selector: string; properties: Record<string, string> }>): Promise<string>
  async toAtomicClasses(twClasses: string): Promise<string>
  async clearAtomicRegistry(): Promise<void>
  async getAtomicRegistrySize(): Promise<number>
}
```

**Data Models:**

```typescript
interface DeadCodeAnalysis {
  dead_in_css: string[]
  dead_in_source: string[]
  live_classes: string[]
  total_css_classes: number
  total_source_classes: number
  dead_code_percentage: number
}

interface OptimizationResult {
  success: boolean
  original_size_bytes: number
  optimized_size_bytes: number
  reduction_percent: number
  dead_classes_removed: number
  rules_removed: number
  minification_savings_percent: number
}

interface ProcessedCssResult {
  css: string
  size_bytes: number
  resolved_classes: string[]
  unknown_classes: string[]
}
```

**Optimization Pipeline:**

```
Generated CSS (500KB)
       ↓
   Detect Dead Code
       ↓
   Eliminate Dead CSS (450KB → 50KB)
       ↓
   LightningCSS Minification
       ↓
   Optimize Media Queries & Selectors
       ↓
   Final CSS (50KB → 42KB)
```

**Performance Targets:**
- Dead code detection: < 100ms for typical project
- CSS elimination: < 50ms
- LightningCSS minification: < 100ms
- Total optimization: < 300ms
- Output reduction: 90%+ for typical projects

---

### 7. Component Analysis (8 Functions)

**Purpose:** Track component usage and calculate optimization impact

**Key Responsibilities:**
- Component usage extraction from source
- Bundle size impact calculation
- Risk assessment for changes
- Savings calculation

**Core Interface:**

```typescript
// AnalysisManager.ts
export class AnalysisManager {
  // Usage Analysis
  async analyzeClassUsage(
    classes: string[],
    scanResult: ScanWorkspaceResult,
    css: string
  ): Promise<ClassUsageItem[]>
  
  // Impact Calculation
  async calculateImpact(impact: {
    className: string
    usageCount: number
    bundleSizeBytes: number
  }): Promise<ImpactMetrics>
  
  async calculateRisk(
    className: string,
    totalComponents: number
  ): Promise<RiskMetrics>
  
  async calculateSavings(
    bundleSizeBytes: number,
    componentCount: number
  ): Promise<SavingsMetrics>
  
  // RSC Analysis
  async analyzeRsc(
    source: string,
    filename: string
  ): Promise<RscAnalysisResult>
}
```

**Data Models:**

```typescript
interface ClassUsageItem {
  className: string
  usageCount: number
  filesJson: string                // Array<{ file: string; lineNumber: number }>
  bundleSizeBytes: number
  isDeadCode: boolean
}

interface ImpactMetrics {
  impact_score: number              // 0-100
  usage_frequency: 'low' | 'medium' | 'high'
  bundle_impact_percent: number
  recommendation: string
}

interface RiskMetrics {
  risk_score: number                // 0-100
  affected_components: number
  risk_level: 'low' | 'medium' | 'high'
  breaking_change_probability: number
}

interface SavingsMetrics {
  potential_savings_bytes: number
  potential_savings_percent: number
  optimization_priority: number
}

interface RscAnalysisResult {
  isServer: boolean
  needsClientDirective: boolean
  clientReasons: string[]
}
```

---

## Data Models

All data models used across the eight subsystems are defined in their respective component sections above. Key models include:

- **Redis**: PoolStats, ClusterStatus, ReplicationStatus, MemoryStats, DiagnosticsReport
- **Watch**: WatchEvent, WatchStats, WatchHandle
- **ID Registry**: ComponentID, PropertyID, ValueID, RegistryHandle, RegistrySnapshot, ExportedRegistry
- **Incremental**: FileChangeDiff, IncrementalDiff, FileFingerprint, IncrementalBuildResult, PruneResult, BatchScanResult
- **Theme**: ThemeVariantConfig, SimpleVariantConfig, ResolvedVariants, MergedTheme, ValidationResult, VariantPrecedence
- **Optimization**: DeadCodeAnalysis, OptimizationResult, ProcessedCssResult
- **Analysis**: ClassUsageItem, ImpactMetrics, RiskMetrics, SavingsMetrics, RscAnalysisResult

These data models ensure type safety across the TypeScript and Rust layers through NAPI serialization.

---

## Correctness Properties

### Property 1: Redis Cache Consistency

For any set of keys and values, when cached via multi-set, subsequent multi-get operations SHALL return the exact same values in the same order.

**Validates: Requirements 1.3, 1.6**

**Test Strategy:** Generate random key-value pairs, perform mset/mget operations, verify consistency across multiple iterations and Redis connection states.

### Property 2: Incremental Diff Determinism

*For any* pair of workspace scans, computing the incremental diff SHALL always produce identical results when given the same inputs.

**Validates: Requirements 4.2, 4.9**

**Test Strategy:** Generate random file changes, compute diffs multiple times, verify results are byte-identical. Test with various project sizes (100 to 10K files).

### Property 3: ID Registry Reproducibility

*For any* component names, exporting and importing a registry SHALL preserve ID mappings such that all lookups return identical IDs.

**Validates: Requirements 3.2, 3.13, 3.14**

**Test Strategy:** Generate random component names, create registry, export to JSON, import into new registry, verify all IDs match original registry.

### Property 4: Theme Cascade Determinism

*For any* set of theme layers, resolving the cascade order SHALL always produce identical variant precedence ordering regardless of resolution order.

**Validates: Requirements 5.3, 5.9**

**Test Strategy:** Generate random theme configurations with overlapping values, resolve cascades in different orders, verify precedence results are identical.

### Property 5: Dead Code Detection Accuracy

*For any* scan result and generated CSS, all classes detected as dead code SHALL not appear in the source scan results.

**Validates: Requirements 6.1, 6.4**

**Test Strategy:** Generate random source files, produce CSS, detect dead code, verify all detected dead classes are absent from source scan.

---

## Integration with Existing Architecture

### How These 63 Functions Integrate with 87 Existing Functions

```
Existing 87 Functions (Phase 6)
├── Class Parser v2              (1 function)
├── CSS Generator                (5+ functions)
├── Theme Resolver               (3+ functions)
├── Cache Abstraction (LRU)       (4+ functions)
├── NAPI Bridge Core             (30+ functions)
├── Scanner/File Analysis        (20+ functions)
└── Utilities & Helpers          (24+ functions)

New 63 Functions (This Phase)
├── Redis Functions              (40 functions) → New capability
├── Watch System                 (20 functions) → New capability
├── ID Registry                  (16 functions) → Enhancement
├── Incremental Compilation      (8 functions) → Enhancement
├── Theme Resolution Advanced    (7 functions) → Enhancement
├── CSS Optimization             (12 functions) → Enhancement
├── Atomic CSS                   (6 functions) → Enhancement
└── Component Analysis           (8 functions) → New capability

Total: 87 + 63 = 150 functions
```

### Update Strategy for nativeBridge.ts

**Phase 1: Type Definitions**
- Add all 63 function signatures to `NativeBridge` interface
- Add supporting type definitions (Redis, Watch, Registry, etc.)
- Maintain backward compatibility with existing types

**Phase 2: Function Exports**
- Export all 63 functions from nativeBridge via getNativeBridge()
- Add manager classes in TypeScript for easier consumption
- Keep existing function exports unchanged

**Phase 3: Documentation**
- Update inline JSDoc for all 63 functions
- Add usage examples in comments
- Link to design documentation

**Phase 4: Fallback Handling**
- Add graceful degradation when functions unavailable
- Implement feature flags for opt-in features
- Log clear error messages

### Configuration Management

**tailwind.config.js Integration:**

```javascript
export default {
  // Existing config
  theme: { ... },
  plugins: [ ... ],
  
  // New: Redis Configuration
  redis: {
    enabled: true,
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    poolSize: 10,
    password: process.env.REDIS_PASSWORD,
    ttl: 604800,                // 7 days default
    evictionPolicy: 'LRU'
  },
  
  // New: Watch Configuration
  watch: {
    enabled: true,
    patterns: ['**/*.tsx', '**/*.ts', 'tailwind.config.js'],
    debounceMs: 100,
    gitignoreAware: true
  },
  
  // New: Incremental Compilation
  incremental: {
    enabled: true,
    fingerprinting: true,
    streaming: true
  },
  
  // New: Theme Composition
  themeComposition: {
    enabled: true,
    caching: true,
    precedenceStrict: true
  },
  
  // New: CSS Optimization
  optimization: {
    deadCodeElimination: true,
    atomicCss: false,
    minification: true
  }
}
```

---

## Error Handling

The Error Handling section encompasses fallback patterns, error classification, and graceful degradation strategies.

### Error Classification

**Tier 1: Critical (Stop Compilation)**
- Native binding unavailable
- Invalid configuration
- Redis cluster unreachable
- Corrupted registry

**Tier 2: Non-Critical (Log Warning, Continue)**
- Redis cache miss (fall back to local)
- Watch system timeout (retry)
- Theme resolution cache miss (recompute)

**Tier 3: Informational**
- Cache hit rate below threshold
- Slow performance detected
- Optimization recommendations

### Fallback Strategy

```typescript
// Example: Cache operations with fallback
async function getCachedValue(key: string): Promise<string | null> {
  try {
    // Try Redis first
    const value = await redisManager.getCacheValue(key)
    if (value) return value
    
    // Fall back to local LRU cache
    const localValue = localCacheBackend.get(key)
    if (localValue) return localValue
    
    // No cache hit
    return null
  } catch (err) {
    // Redis unavailable, use local cache only
    console.warn('Redis unavailable, using local cache:', err.message)
    return localCacheBackend.get(key) || null
  }
}

// Example: Watch system with graceful degradation
async function startFileWatching(): Promise<void> {
  try {
    watchManager.startWatch({ rootPath: process.cwd() })
  } catch (err) {
    if (process.env.WATCH_REQUIRED) {
      throw err
    }
    console.warn('Watch system unavailable, manual refresh required:', err.message)
  }
}
```

---

## Data Flow Examples

### Redis Caching Flow

```
TypeScript Layer
    ↓
User requests CSS compilation
    ↓
Check Redis cache: redis_cache_hit_rate()
    ↓
If hit: return cached CSS
    ↓
If miss: compile CSS
    ↓
Store in Redis with key format: css-compiler:{hash}:{theme}:{variant}
    ↓
Emit pub/sub event: 'cache-updated'
    ↓
Other developers receive cache-updated event
    ↓
Their watch system triggers recompile
    ↓
They hit Redis cache (instant hit)
```

### Watch System Flow

```
File system
    ↓
User saves file: components/Button.tsx
    ↓
File watcher detects: Modified event
    ↓
Debouncer accumulates events (100ms)
    ↓
Emit plugin_hook: on_file_changed
    ↓
Plugin handler: extract_classes_from_source
    ↓
Compute incremental diff
    ↓
Emit plugin_hook: before_recompile
    ↓
Compile only affected classes
    ↓
Emit plugin_hook: after_compile
    ↓
Stream CSS to browser
    ↓
Browser receives CSS update in < 200ms
```

### Incremental Build Flow

```
Baseline: Project builds successfully, cache created
    ↓
Developer modifies: src/components/Button.tsx
    ↓
create_fingerprint(Button.tsx) → fingerprint_v2
    ↓
Compare with baseline fingerprint_v1
    ↓
compute_incremental_diff: identify changed classes
    ↓
Classes changed: ['btn-primary', 'btn-secondary']
    ↓
Compile only changed classes + dependencies
    ↓
rebuild_workspace_result: merge with baseline CSS
    ↓
prune_stale_entries: remove unused CSS
    ↓
inject_state_hash: add cache buster
    ↓
Output CSS 500ms (vs 5+ seconds full rebuild)
```

---

## Testing Strategy

### Property-Based Tests

### Property 1: Redis Cache Consistency

```
∀ keys: string[], values: string[]
  cache.mset(keys, values)
  → cache.mget(keys) = values
  
Meaning: Multi-set followed by multi-get returns same values
```

### Property 2: Incremental Diff Determinism

```
∀ scan1, scan2: ScanResult
  compute_incremental_diff(scan1, scan2) = compute_incremental_diff(scan1, scan2)
  
Meaning: Same scans always produce same diff
```

### Property 3: ID Registry Reproducibility

```
∀ names: string[]
  export(reg1) = data1
  reg2 = import(data1)
  → [lookupId(reg2, n) for n in names] = [lookupId(reg1, n) for n in names]
  
Meaning: Exported registry can be imported and produces identical IDs
```

### Property 4: Theme Cascade Determinism

```
∀ themes: Theme[]
  resolve_cascade(themes[0], themes[1]) = resolve_cascade(themes[0], themes[1])
  
Meaning: Theme merging is deterministic
```

### Property 5: Dead Code Detection Accuracy

```
∀ scan: ScanResult, css: string
  dead_classes = detect_dead_code(scan, css)
  → ∀ class ∈ dead_classes: class ∉ scan.classes
  
Meaning: All detected dead classes are actually not in source
```

### Unit Tests

**Redis Manager Tests:**
- Connection pool creation and cleanup
- Cache get/set/delete operations
- Cluster failover handling
- Replication status
- Pub/Sub message delivery

**Watch Manager Tests:**
- File watching with pattern matching
- Event debouncing
- Plugin hook registration and emission
- Resource cleanup on stop

**ID Registry Tests:**
- ID generation consistency
- Property/value mapping
- Export/import round-trip
- Multi-registry isolation

**Incremental Manager Tests:**
- Fingerprint generation and comparison
- Diff computation accuracy
- Workspace rebuilding from baseline
- Stale entry pruning

**Theme Manager Tests:**
- Variant precedence ordering
- Theme cascade merging
- Conflict group resolution
- Caching behavior

**Optimization Manager Tests:**
- Dead code detection accuracy
- CSS elimination without breakage
- Atomic class generation
- Minification correctness

### Integration Tests

- Full Redis setup with multiple clients
- Watch system triggering recompile end-to-end
- Incremental build with 1000+ file project
- Theme resolution with complex config
- Complete optimization pipeline

### E2E Tests

- Developer workflow: Edit file → CSS updates in browser within 200ms
- Distributed build: 5+ developers sharing Redis cache with 60% time savings
- Theme system: Switch themes, verify CSS updates correctly
- Incremental build: 10,000 files, single change rebuilds in < 500ms

---

## Performance Targets & Optimization

### Response Time Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Redis cache hit | < 10ms | Network + deserialization |
| Redis cache miss + recompile | < 500ms | Full compile from source |
| Watch event detection | < 100ms | From file change to event fired |
| Watch debounce settle time | 100ms | Configurable |
| Incremental diff computation | < 200ms | For 10K file project |
| Incremental rebuild | < 500ms | Single file change |
| Theme resolution lookup | < 1ms (cached), < 50ms (computed) | With/without cache |
| Dead code detection | < 100ms | For typical project |
| Final CSS size | 50-100KB | From 500KB+ generated |

### Memory Targets

| Component | Target | Notes |
|-----------|--------|-------|
| Redis connection pool | < 50MB | For 10 connections |
| Watch system (1000 files) | < 100MB | File metadata + events |
| ID registry (10K entries) | < 20MB | Lookup tables |
| Local cache (5K items) | < 100MB | LRU cache capacity |
| Total memory | < 300MB | Typical configuration |

### Scalability Targets

| Metric | Requirement |
|--------|------------|
| Redis cluster nodes | Up to 100 nodes supported |
| Watch patterns | Up to 1000 patterns |
| Theme tokens | Up to 10K tokens per theme |
| Cached IDs | Up to 100K IDs in registry |
| Simultaneous watch handles | Up to 100 active watches |

---

## Security Considerations

### Redis Security

**Credential Management:**
- Connection passwords passed via `tailwind.config.js` or environment
- Never logged or exposed in error messages
- SSL/TLS encryption for network transport
- Redis AUTH protocol required

**Access Control:**
- Redis credentials scoped to application
- No hardcoded passwords in code
- Environment variable defaults

### File Watching Security

**Path Validation:**
- Watch patterns validated against root path
- No access to paths outside project root
- Symlink resolution controlled
- Permission checking before access

### Registry Export/Import Security

**Data Format:**
- JSON format for portability
- No sensitive data in registry (only IDs)
- Version field for compatibility
- Integrity check on import

### Cache Key Sanitization

**Key Format:**
```
css-compiler:{content-hash}:{theme-id}:{variant-hash}:{build-id}
```
- All components safely hashable
- No user input in key
- Consistent across machines

---

## Compatibility & Migration

### Backward Compatibility Guarantees

- **Existing 87 functions**: No changes to signatures or behavior
- **New functions**: Completely additive
- **Optional features**: Watch/Redis/Optimization opt-in
- **Defaults**: No existing behavior changes

### Migration Path

**Phase 1: No Action Required**
- All 63 functions available but unused
- Existing code works unchanged

**Phase 2: Gradual Adoption**
- Enable Redis: Set `redis.enabled: true` in config
- Enable Watch: Set `watch.enabled: true` in config
- Enable Optimization: Set `optimization.deadCodeElimination: true`

**Phase 3: Full Integration**
- All features working together
- Distributed builds with 60%+ time savings
- Developer experience significantly improved

### Deprecation Strategy

- No deprecations in this phase
- Phase 7 satisfied all requirements for existing code
- This phase is purely additive

---

## Dependencies & Prerequisites

### Rust Side
- `redis` crate for Redis client
- `notify` crate for file watching (already used)
- `dashmap` for concurrent maps (phase 7 standard)
- `serde` for serialization (existing)
- `tokio` for async (existing)

### TypeScript Side
- No new npm dependencies (uses existing setup)
- All 63 functions already exported from native bridge
- Manager classes added to compiler package

### External Services
- Redis server (optional but recommended for multi-machine builds)
- File system watcher (OS-level, built-in)

### Platform Support
- Linux: ✅ Full support
- macOS: ✅ Full support
- Windows: ✅ Full support (via notify crate)
- CI/CD: ✅ Full support (Redis recommended)

---

## Success Metrics

### Build Performance

- **Distributed builds**: 60-80% time savings with Redis caching
- **Incremental builds**: 10x speedup for single-file changes
- **Watch latency**: < 200ms from file change to CSS update
- **CSS optimization**: 90% size reduction for typical projects

### Developer Experience

- **Setup time**: < 5 minutes with defaults
- **Configuration**: Optional (sensible defaults included)
- **Error messages**: Clear and actionable
- **Documentation**: Complete with examples

### Code Quality

- **Test coverage**: 85%+ for new code
- **Property tests**: 5+ comprehensive properties
- **Integration tests**: All major workflows tested
- **Performance tests**: Benchmarks show targets met

### Adoption

- **Feature adoption**: 80%+ of users enable Redis by month 2
- **Watch usage**: 90%+ of developers use watch system
- **Performance improvement**: Average build 50% faster

---

## Open Questions & Future Considerations

### Questions for Product/Design Review

1. Should watch system be enabled by default or opt-in?
2. What's the recommended Redis deployment pattern (managed service vs self-hosted)?
3. Should ID registry be auto-exported to gitignore'd file or manual?
4. For atomic CSS, should this be opt-in due to CSS model change?

### Future Enhancements (Phase 8+)

- Distributed theme caching across machines
- Component usage analytics dashboard
- Automated optimization recommendations
- Integration with build tools (webpack, vite, turbopack)
- Cloud-based cache service
- Mobile app for monitoring build metrics

---

## Conclusion

This design provides a comprehensive blueprint for integrating all 63 unused Rust functions into the CSS-in-Rust compiler. By combining distributed caching, file monitoring, incremental compilation, advanced theming, and CSS optimization, we unlock significant performance improvements and developer experience enhancements.

The modular architecture ensures each subsystem can be adopted independently, with sensible defaults allowing zero-configuration usage for basic scenarios. Extensive property-based testing ensures correctness across all components.

Implementation should proceed in the following order:
1. Redis Manager (highest impact)
2. Watch Manager (high impact on DX)
3. Incremental Compiler (high impact on rebuild time)
4. Theme Manager (medium impact, enables advanced workflows)
5. Optimization Manager (medium impact, reduces output size)
6. ID Registry Manager (low impact individually, high impact for reproducibility)
7. Analysis Manager (nice-to-have for insights)

---

## Appendix: Quick Reference

### All 63 Functions by Category

**Redis (40):**
`redis_ping`, `redis_get`, `redis_set`, `redis_delete`, `redis_exists`, `redis_mget`, `redis_mset`, `redis_flush_db`, `redis_flush_all`, `redis_pool_connect`, `redis_pool_stats`, `redis_pool_reconnect`, `redis_enable_cluster`, `redis_disable_cluster`, `redis_cluster_status`, `redis_subscribe`, `redis_publish`, `redis_expiration_set`, `redis_expiration_get`, `redis_info`, `redis_monitor`, `redis_cache_size`, `redis_cache_key_count`, `redis_cache_clear`, `redis_cache_hit_rate`, `redis_enable_persistence`, `redis_disable_persistence`, `redis_snapshot`, `redis_memory_stats`, `redis_optimize_memory`, `redis_set_eviction_policy`, `redis_get_eviction_policy`, `redis_replicate`, `redis_replication_status`, `redis_cache_sync`, `redis_enable_cache_warming`, `redis_disable_cache_warming`, `redis_diagnose`, and related utility functions

**Watch (20):**
`start_watch`, `poll_watch_events`, `stop_watch`, `watch_add_pattern`, `watch_remove_pattern`, `watch_get_active_handles`, `watch_clear_all`, `watch_event_type_to_string`, `is_watch_running`, `get_watch_stats`, `watch_pause`, `watch_resume`, `scan_cache_optimizations`, `get_plugin_hooks`, `register_plugin_hook`, `unregister_plugin_hook`, `emit_plugin_hook`, `get_compilation_metrics`, `reset_compilation_metrics`, `validate_css_output`

**ID Registry (16):**
`id_registry_create`, `id_registry_generate`, `id_registry_lookup`, `id_registry_next`, `id_registry_destroy`, `id_registry_reset`, `id_registry_snapshot`, `id_registry_active_count`, `register_property_name`, `register_value_name`, `property_id_to_string`, `value_id_to_string`, `reverse_lookup_property`, `reverse_lookup_value`, `id_registry_export`, `id_registry_import`

**Incremental (8):**
`process_file_change`, `compute_incremental_diff`, `create_fingerprint`, `inject_state_hash`, `prune_stale_entries`, `rebuild_workspace_result`, `scan_file_native`, `scan_files_batch_native`

**Theme Resolution (7):**
`resolve_variants`, `validate_variant_config`, `resolve_cascade`, `resolve_class_names`, `resolve_conflict_group`, `resolve_theme_value`, `resolve_simple_variants`

**CSS Optimization (12):**
`detectDeadCode`, `eliminateDeadCss`, `optimizeCss`, `processTailwindCssLightning`, `processTailwindCssWithTargets`, `parseAtomicClass`, `generateAtomicCss`, `toAtomicClasses`, `clearAtomicRegistry`, `atomicRegistrySize`, `compile_css_minify`, related minification functions

**Component Analysis (8):**
`analyzeClassUsage`, `calculateImpact`, `calculateRisk`, `calculateSavings`, `analyzeRsc`, and related analysis functions

---

**Document Status:** Ready for Implementation ✅
