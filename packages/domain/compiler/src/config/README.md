# Configuration Schema Documentation

This directory contains the configuration schema and validation for all 63 integrated Rust functions across 8 feature domains.

## Overview

All features are disabled by default (opt-in model). Users enable features in their `tailwind.config.js` with sensible defaults.

## Configuration Domains

### 1. Redis Distributed Caching (40 functions)

Enable multi-machine cache sharing for 60-80% build time reduction.

```js
// tailwind.config.js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  features: {
    redis: {
      enabled: true,
      host: 'localhost',
      port: 6379,
      poolSize: 10,
      password: undefined,
      ssl: false,
      ttlSeconds: 604800, // 7 days
      clusterMode: false,
      clusterNodes: [],
      replicationEnabled: false,
      replicaHost: undefined,
      replicaPort: 6380,
      persistenceEnabled: false,
      persistenceMode: 'AOF',
      cacheWarmingEnabled: false,
      cacheWarmingPattern: 'css-compiler:*',
      evictionPolicy: 'LRU',
      maxCacheBytes: 1073741824, // 1GB
    },
  },
}
```

**Configuration Options:**

- `enabled` (boolean, default: false) - Enable Redis caching
- `host` (string, default: 'localhost') - Redis server hostname
- `port` (number, default: 6379) - Redis server port (1-65535)
- `poolSize` (number, default: 10) - Connection pool size (1-1000)
- `password` (string, optional) - Redis authentication password
- `ssl` (boolean, default: false) - Use SSL/TLS for connection
- `ttlSeconds` (number, default: 604800) - Cache entry TTL in seconds
- `clusterMode` (boolean, default: false) - Enable Redis cluster mode
- `clusterNodes` (string[], default: []) - Initial cluster nodes (host:port format)
- `replicationEnabled` (boolean, default: false) - Enable replication for HA
- `replicaHost` (string, optional) - Replica target host
- `replicaPort` (number, default: 6380) - Replica target port
- `persistenceEnabled` (boolean, default: false) - Enable AOF/RDB persistence
- `persistenceMode` (enum, default: 'AOF') - Persistence mode: 'AOF' or 'RDB'
- `cacheWarmingEnabled` (boolean, default: false) - Preload cache on startup
- `cacheWarmingPattern` (string, default: 'css-compiler:*') - Pattern for cache warming
- `evictionPolicy` (enum, default: 'LRU') - Eviction policy: LRU | LFU | FIFO | RANDOM
- `maxCacheBytes` (number, default: 1GB) - Maximum cache size before eviction

### 2. Watch System (20 functions)

File system monitoring for instant CSS updates on changes.

```js
export default {
  features: {
    watch: {
      enabled: true,
      rootPath: process.cwd(),
      patterns: ['**/*.tsx', '**/*.ts', 'tailwind.config.js'],
      debounceMs: 100,
      gitignoreAware: true,
      maxFilesWarning: 10000,
      verbose: false,
    },
  },
}
```

**Configuration Options:**

- `enabled` (boolean, default: false) - Enable file system watching
- `rootPath` (string, default: process.cwd()) - Root directory to watch
- `patterns` (string[], default: ['**/*.tsx', '**/*.ts', 'tailwind.config.js']) - Glob patterns to watch
- `debounceMs` (number, default: 100) - Debounce time for rapid changes (milliseconds)
- `gitignoreAware` (boolean, default: true) - Respect .gitignore when watching
- `maxFilesWarning` (number, default: 10000) - Warning threshold for files watched
- `verbose` (boolean, default: false) - Enable verbose logging for watch events

### 3. ID Registry (16 functions)

Component ID tracking for reproducible builds.

```js
export default {
  features: {
    idRegistry: {
      enabled: true,
      snapshotsEnabled: false,
      snapshotIntervalMs: 300000, // 5 minutes
      snapshotDir: './.cache/registry-snapshots',
      exportEnabled: false,
      exportPath: './.cache/registry-export.json',
      importEnabled: false,
      importPath: './.cache/registry-export.json',
    },
  },
}
```

**Configuration Options:**

- `enabled` (boolean, default: false) - Enable component ID registry
- `snapshotsEnabled` (boolean, default: false) - Enable automatic snapshots
- `snapshotIntervalMs` (number, default: 300000) - Snapshot interval in milliseconds
- `snapshotDir` (string, default: './.cache/registry-snapshots') - Snapshot storage directory
- `exportEnabled` (boolean, default: false) - Enable registry export for CI/CD
- `exportPath` (string, default: './.cache/registry-export.json') - Export file path
- `importEnabled` (boolean, default: false) - Import registry on startup
- `importPath` (string, default: './.cache/registry-export.json') - Import file path

### 4. Incremental Compilation (8 functions)

Progressive CSS generation for faster rebuilds.

```js
export default {
  features: {
    incremental: {
      enabled: true,
      fingerprintingEnabled: false,
      cacheDir: './.cache/incremental',
      maxAgeSeconds: 604800, // 7 days
      maxCacheEntries: 10000,
      streamingEnabled: false,
      streamChunkSizeBytes: 65536, // 64KB
      baselineSnapshotsEnabled: false,
    },
  },
}
```

**Configuration Options:**

- `enabled` (boolean, default: false) - Enable incremental compilation
- `fingerprintingEnabled` (boolean, default: false) - Enable change detection via fingerprinting
- `cacheDir` (string, default: './.cache/incremental') - Cache directory for incremental state
- `maxAgeSeconds` (number, default: 604800) - Maximum cache entry age in seconds
- `maxCacheEntries` (number, default: 10000) - Maximum cache entries before pruning
- `streamingEnabled` (boolean, default: false) - Enable streaming CSS output
- `streamChunkSizeBytes` (number, default: 65536) - Chunk size for streamed CSS
- `baselineSnapshotsEnabled` (boolean, default: false) - Enable baseline snapshots

### 5. Theme Resolution (7 functions)

Advanced multi-layer theme composition.

```js
export default {
  features: {
    theme: {
      enabled: true,
      cacheEnabled: true,
      cacheSize: 1000,
      compositionEnabled: false,
      variantPrecedenceEnabled: false,
      conflictGroupsEnabled: false,
      validationEnabled: true,
      persistentCacheEnabled: false,
      persistentCacheDir: './.cache/themes',
    },
  },
}
```

**Configuration Options:**

- `enabled` (boolean, default: false) - Enable advanced theme resolution
- `cacheEnabled` (boolean, default: true) - Cache resolved themes
- `cacheSize` (number, default: 1000) - Theme cache size in entries
- `compositionEnabled` (boolean, default: false) - Enable multi-layer composition
- `variantPrecedenceEnabled` (boolean, default: false) - Track variant precedence
- `conflictGroupsEnabled` (boolean, default: false) - Enable conflict group resolution
- `validationEnabled` (boolean, default: true) - Validate theme on startup
- `persistentCacheEnabled` (boolean, default: false) - Cache themes across compilations
- `persistentCacheDir` (string, default: './.cache/themes') - Persistent cache directory

### 6. CSS Optimization (12 functions)

Dead code elimination and minification.

```js
export default {
  features: {
    optimization: {
      enabled: true,
      deadCodeDetectionEnabled: false,
      deadCodeEliminationEnabled: false,
      minificationEnabled: false,
      minReductionPercent: 5,
      analyticsEnabled: false,
      analyticsReportPath: './.cache/optimization-report.json',
      targetOptimizationEnabled: false,
      targets: 'defaults',
    },
  },
}
```

**Configuration Options:**

- `enabled` (boolean, default: false) - Enable CSS optimization
- `deadCodeDetectionEnabled` (boolean, default: false) - Detect unused CSS
- `deadCodeEliminationEnabled` (boolean, default: false) - Remove unused CSS
- `minificationEnabled` (boolean, default: false) - Enable LightningCSS minification
- `minReductionPercent` (number, default: 5) - Minimum reduction to report (0-100)
- `analyticsEnabled` (boolean, default: false) - Enable optimization analytics
- `analyticsReportPath` (string, default: './.cache/optimization-report.json') - Analytics report path
- `targetOptimizationEnabled` (boolean, default: false) - Target-specific optimization
- `targets` (string, default: 'defaults') - Browser targets (browserslist format)

### 7. Atomic CSS (6 functions)

Single-property class generation for improved reusability.

```js
export default {
  features: {
    atomicCss: {
      enabled: true,
      cacheEnabled: true,
      registryCacheSize: 5000,
      deduplicationEnabled: true,
      preserveOriginalClasses: true,
      classPrefix: '_',
    },
  },
}
```

**Configuration Options:**

- `enabled` (boolean, default: false) - Enable atomic CSS mode
- `cacheEnabled` (boolean, default: true) - Cache atomic class registry
- `registryCacheSize` (number, default: 5000) - Registry cache size in entries
- `deduplicationEnabled` (boolean, default: true) - Deduplicate atomic classes
- `preserveOriginalClasses` (boolean, default: true) - Keep original Tailwind classes
- `classPrefix` (string, default: '_') - Prefix for atomic classes

### 8. Component Analysis (8 functions)

Usage analytics and impact tracking.

```js
export default {
  features: {
    analysis: {
      enabled: true,
      unusedDetectionEnabled: false,
      dependencyTrackingEnabled: false,
      bundleImpactEnabled: false,
      riskAssessmentEnabled: false,
      reportPath: './.cache/component-analysis.json',
      minUsageThreshold: 0,
      detailedImpactEnabled: false,
      includeTransitiveDependencies: true,
    },
  },
}
```

**Configuration Options:**

- `enabled` (boolean, default: false) - Enable component analysis
- `unusedDetectionEnabled` (boolean, default: false) - Detect unused components
- `dependencyTrackingEnabled` (boolean, default: false) - Track component dependencies
- `bundleImpactEnabled` (boolean, default: false) - Calculate bundle impact
- `riskAssessmentEnabled` (boolean, default: false) - Assess change risk
- `reportPath` (string, default: './.cache/component-analysis.json') - Report path
- `minUsageThreshold` (number, default: 0) - Minimum usage to not report as unused
- `detailedImpactEnabled` (boolean, default: false) - Enable detailed impact calculation
- `includeTransitiveDependencies` (boolean, default: true) - Include transitive deps in impact

## Configuration Examples

### Minimal Configuration (Development)

```js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  features: {
    watch: { enabled: true },
  },
}
```

### Production with Caching

```js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  features: {
    redis: {
      enabled: true,
      host: 'redis.prod.internal',
      poolSize: 50,
      ttlSeconds: 604800,
    },
    optimization: {
      enabled: true,
      deadCodeEliminationEnabled: true,
      minificationEnabled: true,
    },
  },
}
```

### Full Featured Configuration

```js
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  features: {
    redis: {
      enabled: true,
      host: 'redis.prod.internal',
      clusterMode: true,
      clusterNodes: ['node1:6379', 'node2:6379'],
      replicationEnabled: true,
      persistenceEnabled: true,
    },
    watch: {
      enabled: true,
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
  },
}
```

## Validation

All configuration is validated at startup. Validation results include:
- `valid` (boolean) - Configuration is valid
- `errors` (string[]) - List of validation errors (prevents startup)
- `warnings` (string[]) - List of warnings (allows startup but may indicate issues)

Invalid configurations will be rejected with clear error messages indicating:
- Which field has the problem
- What the invalid value is
- What the valid range/options are

## Default Values

All features are disabled by default with sensible settings. Users must explicitly enable features by setting `enabled: true`.

When features are enabled, the following defaults apply:

- **Redis**: localhost:6379, pool size 10, 7-day TTL, LRU eviction
- **Watch**: Watch TS/TSX files and tailwind.config.js, 100ms debounce
- **ID Registry**: Snapshots disabled, export/import disabled
- **Incremental**: 7-day cache, 10K max entries, 64KB chunks
- **Theme**: Cache enabled with 1000 entries, validation enabled
- **Optimization**: Dead code detection disabled, minification disabled
- **Atomic CSS**: Cache enabled, deduplication enabled, '_' prefix
- **Analysis**: All analytics disabled except transitive dependency tracking

## TypeScript Support

Full TypeScript types are provided. Import from `FeaturesConfig`:

```ts
import {
  FeaturesConfigSchema,
  RedisConfig,
  WatchConfig,
  createFeaturesConfig,
  validateFeaturesConfig,
} from '@/config/FeaturesConfig'

const config: FeaturesConfigSchema = {
  redis: { enabled: true },
  watch: { enabled: true },
}

const result = createFeaturesConfig(config)
if (!result.validation.valid) {
  console.error('Config errors:', result.validation.errors)
}
```
