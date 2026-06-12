# Comprehensive Error Handling and Fallback System

This guide describes the error handling infrastructure for the CSS-in-Rust compiler, including error types, fallback strategies, logging, and recovery mechanisms.

## Overview

The error handling system provides:

1. **Subsystem-Specific Error Types** - Dedicated error classes for each subsystem (Redis, Watch, Registry, etc.)
2. **Graceful Fallback Mechanisms** - Automatic degradation when features become unavailable
3. **Error Logging and Diagnostics** - Comprehensive logging with structured context
4. **Recovery Strategies** - Retry logic and circuit breaker patterns for transient failures

## Error Types

### Base Error Class

All errors extend `CompilerError`:

```typescript
import { CompilerError, ErrorCode } from '@tailwind-styled/compiler/errors'

const error = new CompilerError(
  ErrorCode.REDIS_CONNECTION_FAILED,
  'Could not connect to Redis',
  {
    subsystem: 'redis',
    operation: 'connect',
    filePath: '/src/index.ts',
    lineNumber: 42,
  }
)
```

### Subsystem-Specific Errors

Each subsystem has a dedicated error class:

```typescript
import {
  RedisError,
  WatchError,
  RegistryError,
  IncrementalError,
  ThemeError,
  OptimizationError,
  AnalysisError,
} from '@tailwind-styled/compiler/errors'

// Redis errors
const redisError = new RedisError('Connection timeout', { operation: 'set' }, true)

// Watch system errors
const watchError = new WatchError('Failed to start watcher', { filePath: '/src' })

// ID Registry errors
const registryError = new RegistryError('Registry not found', { operation: 'lookup' })

// Theme resolution errors
const themeError = new ThemeError('Invalid theme config', { filePath: 'tailwind.config.js' })
```

### Error Codes

Use `ErrorCode` enum for categorized errors:

```typescript
import { ErrorCode } from '@tailwind-styled/compiler/errors'

// Redis errors
ErrorCode.REDIS_CONNECTION_FAILED
ErrorCode.REDIS_TIMEOUT
ErrorCode.REDIS_POOL_EXHAUSTED
ErrorCode.REDIS_CLUSTER_FAILED
ErrorCode.REDIS_MEMORY_EXHAUSTED

// Watch system errors
ErrorCode.WATCH_START_FAILED
ErrorCode.WATCH_POLL_FAILED
ErrorCode.WATCH_TOO_MANY_FILES

// ID Registry errors
ErrorCode.REGISTRY_NOT_FOUND
ErrorCode.REGISTRY_FULL

// Incremental compilation errors
ErrorCode.INCREMENTAL_DIFF_FAILED
ErrorCode.REBUILD_FAILED

// Theme resolution errors
ErrorCode.THEME_RESOLUTION_FAILED
ErrorCode.THEME_CIRCULAR_DEPENDENCY

// Optimization errors
ErrorCode.OPTIMIZATION_FAILED
ErrorCode.DEAD_CODE_DETECTION_FAILED
```

## Fallback Strategies

### Redis Failures → Local LRU Cache

When Redis becomes unavailable, fall back to local LRU cache:

```typescript
import { getFallbackManager } from '@tailwind-styled/compiler/errors'

const fallbacks = getFallbackManager()
const cache = fallbacks.getRedisCache()

// Store value
cache.set('my-key', 'my-value', 604800000) // 7 day TTL

// Retrieve value
const value = cache.get('my-key')

// Get statistics
const stats = cache.getStats()
console.log(`Cache: ${stats.size}/${stats.maxSize} entries`)
```

### Watch Unavailable → Manual Recompile

When watch system fails, indicate manual recompile is required:

```typescript
const fallbacks = getFallbackManager()
const watch = fallbacks.getWatch()

if (!watch.requiresManualRecompile()) {
  console.log('File watching is active')
} else {
  console.log(watch.getMessage())
  // Output: "Watch system unavailable. Use manual recompilation..."
}
```

### Theme Resolution Failures → Default Theme

Use default theme when resolution fails:

```typescript
const fallbacks = getFallbackManager()
const theme = fallbacks.getTheme()

// Get specific theme value
const color = theme.getThemeValue('colors.blue')

// Get entire theme category
const colors = theme.getThemeCategory('colors')

// Use with fallback
const value = theme.getThemeValue('colors.primary') || fallbackValue
```

### Incremental Compilation Failures → Full Rebuild

Fall back to full rebuild when incremental fails:

```typescript
const fallbacks = getFallbackManager()
const incremental = fallbacks.getIncremental()

const result = incremental.triggerFullRebuild()
console.log(result.reason)
// Output: "Incremental compilation failed, falling back to full rebuild"
```

### Optimization Failures → Unoptimized CSS

Output unoptimized but functional CSS when optimization fails:

```typescript
const fallbacks = getFallbackManager()
const optimization = fallbacks.getOptimization()

const result = optimization.getUnoptimizedCss(css)
console.log(`CSS: ${result.sizeBytes} bytes (unoptimized: ${result.unoptimized})`)
```

## Error Context

Errors include detailed context for debugging:

```typescript
const error = new CompilerError(
  ErrorCode.REDIS_TIMEOUT,
  'Operation timed out',
  {
    subsystem: 'redis',
    operation: 'cache_set',
    filePath: '/src/styles/button.tsx',
    lineNumber: 42,
    details: {
      timeout: 5000,
      key: 'css-compiler:abc123:def456:ghi789',
      size: 1024,
    },
  }
)

console.log(error.context.filePath) // '/src/styles/button.tsx'
console.log(error.context.details?.timeout) // 5000
```

## Logging and Diagnostics

### Structured Logging

```typescript
import { getLogger } from '@tailwind-styled/compiler/errors'

const logger = getLogger()

logger.logError('redis', 'Connection failed', error, { host: 'localhost', port: 6379 })
logger.logWarn('watch', 'Too many file descriptors', { count: 1024 })
logger.logInfo('incremental', 'Incremental build completed', { duration: 245 })
logger.logDebug('theme', 'Theme cache hit', { key: 'theme:primary' })
```

### Diagnostic Reports

```typescript
import { getDiagnostics } from '@tailwind-styled/compiler/errors'

const diagnostics = getDiagnostics()

// Generate full report
const report = diagnostics.generateReport()
console.log(report.errors.total) // 5
console.log(report.errors.bySubsystem) // { redis: 2, watch: 1, theme: 2 }
console.log(report.recommendations) // ["Redis errors detected..."]

// Format as string
console.log(diagnostics.getReportAsString())

// Export as JSON
const json = diagnostics.exportAsJson()
```

### Performance Tracking

```typescript
const diagnostics = getDiagnostics()

// Record slow operation
const start = Date.now()
// ... operation ...
const duration = Date.now() - start
diagnostics.recordSlowOperation('redis', 'cache_get', duration, 100)

// Automatically warns if duration > threshold
```

## Recovery Strategies

### Retry with Exponential Backoff

```typescript
import { getRecoveryManager } from '@tailwind-styled/compiler/errors'

const recovery = getRecoveryManager()
const retryStrategy = recovery.getRetryStrategy('redis', {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true,
})

const result = await retryStrategy.executeWithRetry(async () => {
  return await redisClient.get(key)
}, 'redis_get')
```

### Circuit Breaker Pattern

```typescript
const recovery = getRecoveryManager()
const breaker = recovery.getCircuitBreaker('redis', {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 30000,
})

const result = await breaker.execute(
  async () => redisClient.get(key),
  async () => localCache.get(key) // Fallback
)
```

### Full Recovery Strategy

```typescript
const recovery = getRecoveryManager()

const result = await recovery.executeWithRecovery(
  'redis-cache',
  async () => {
    // Main operation
    return await redisClient.set(key, value)
  },
  async () => {
    // Fallback operation
    return getFallbackManager().getRedisCache().set(key, value)
  },
  {
    maxRetries: 3,
    initialDelayMs: 100,
  },
  {
    failureThreshold: 5,
    resetTimeoutMs: 30000,
  }
)
```

## Error Type Guards

```typescript
import { isCompilerError, isRecoverable, isTransientError } from '@tailwind-styled/compiler/errors'

const error = new RedisError('Connection failed')

if (isCompilerError(error)) {
  console.log('Compiler error:', error.code)
}

if (isRecoverable(error)) {
  console.log('Error is recoverable, will retry')
}

if (isTransientError(error)) {
  console.log('Transient error, retrying immediately')
}
```

## Integration with Managers

All managers use the error handling system:

```typescript
import { RedisManager } from '@tailwind-styled/compiler/managers'

const redis = new RedisManager({ enabled: true })
await redis.initialize()

try {
  await redis.connectPool({
    host: 'localhost',
    port: 6379,
  })
} catch (error) {
  if (isCompilerError(error)) {
    console.log(`Redis error [${error.code}]:`, error.message)
    
    // Use fallback
    const cache = getFallbackManager().getRedisCache()
    // ... continue with local cache ...
  }
}
```

## Best Practices

1. **Always include context** - Provide file path, line number, and operation details
2. **Use specific error codes** - Don't use UNKNOWN unless necessary
3. **Mark recoverable errors** - Set third parameter to true for transient failures
4. **Log at appropriate levels** - Use ERROR for failures, WARN for degradation, INFO for operations
5. **Implement fallbacks** - Always have a fallback for critical features
6. **Record diagnostics** - Use `recordSlowOperation` for performance monitoring
7. **Check diagnostics regularly** - Review error counts and recommendations
8. **Test error paths** - Ensure fallbacks work correctly in production

## Environment Variables

```bash
# Enable debug logging
DEBUG=compiler:errors

# Enable verbose console output
VERBOSE=true

# These affect the global logger automatically
```

## Example: Redis Manager with Error Handling

```typescript
import { RedisManager } from '@tailwind-styled/compiler/managers'
import {
  isRecoverable,
  getRecoveryManager,
  getFallbackManager,
} from '@tailwind-styled/compiler/errors'

const redis = new RedisManager({
  enabled: true,
  host: 'localhost',
  port: 6379,
})

try {
  await redis.initialize()

  const recovery = getRecoveryManager()
  const stats = await recovery.executeWithRecovery(
    'redis-pool-connect',
    async () => redis.connectPool({ host: 'localhost', port: 6379 }),
    async () => {
      // Fallback to local cache
      return { pool_size: 0, active_connections: 0 }
    }
  )

  console.log('Redis pool:', stats)
} catch (error) {
  if (isRecoverable(error)) {
    console.log('Using fallback for:', error.message)
    const fallbacks = getFallbackManager()
    const cache = fallbacks.getRedisCache()
    // ... continue with local cache ...
  } else {
    console.error('Fatal error:', error)
    throw error
  }
}
```

## API Reference

### Error Classes

- `CompilerError` - Base error class
- `RedisError` - Redis subsystem errors
- `WatchError` - Watch system errors
- `RegistryError` - ID Registry errors
- `IncrementalError` - Incremental compilation errors
- `ThemeError` - Theme resolution errors
- `OptimizationError` - CSS optimization errors
- `AnalysisError` - Component analysis errors

### Fallback Classes

- `LocalLRUCache` - Local caching fallback
- `WatchFallback` - Watch system fallback
- `ThemeFallback` - Theme resolution fallback
- `IncrementalFallback` - Incremental compilation fallback
- `OptimizationFallback` - Optimization fallback
- `FallbackManager` - Unified fallback manager

### Logging Classes

- `DiagnosticLogger` - Structured logging
- `DiagnosticsManager` - Diagnostic reporting

### Recovery Classes

- `RetryStrategy` - Retry with exponential backoff
- `CircuitBreaker` - Circuit breaker pattern
- `RecoveryManager` - Unified recovery manager

### Functions

- `getLogger()` - Get global logger instance
- `getDiagnostics()` - Get global diagnostics instance
- `getFallbackManager()` - Get global fallback manager
- `getRecoveryManager()` - Get global recovery manager
- `isCompilerError(err)` - Check if error is CompilerError
- `isRecoverable(err)` - Check if error is recoverable
- `isTransientError(err)` - Check if error is transient

