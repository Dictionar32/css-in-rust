/**
 * Tests for Comprehensive Error Handling System
 *
 * Validates:
 * - Error types for each subsystem
 * - Error context with file paths and operation details
 * - Graceful fallback mechanisms
 * - Error logging and diagnostics
 * - Recovery strategies
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  CompilerError,
  ErrorCode,
  RedisError,
  WatchError,
  RegistryError,
  IncrementalError,
  ThemeError,
  OptimizationError,
  AnalysisError,
  isCompilerError,
  isRecoverable,
  isTransientError,
  createFallbackResult,
  createFallbackError,
} from './index'
import {
  LocalLRUCache,
  WatchFallback,
  ThemeFallback,
  IncrementalFallback,
  OptimizationFallback,
  FallbackManager,
  getFallbackManager,
  resetFallbackManager,
} from './fallbacks'
import {
  DiagnosticLogger,
  LogLevel,
  DiagnosticsManager,
  getLogger,
  getDiagnostics,
  resetLoggers,
} from './logger'
import {
  RetryStrategy,
  CircuitBreaker,
  CircuitState,
  RecoveryManager,
  getRecoveryManager,
  resetRecoveryManager,
} from './recovery'

describe('Error Handling System', () => {
  // ─────────────────────────────────────────────────────────────────
  // Error Types
  // ─────────────────────────────────────────────────────────────────

  describe('CompilerError', () => {
    it('should create error with code and context', () => {
      const error = new CompilerError(
        ErrorCode.REDIS_CONNECTION_FAILED,
        'Connection timeout',
        { subsystem: 'redis', operation: 'connect', filePath: '/path/to/file' }
      )

      expect(error.code).toBe(ErrorCode.REDIS_CONNECTION_FAILED)
      expect(error.message).toBe('Connection timeout')
      expect(error.context.subsystem).toBe('redis')
      expect(error.context.filePath).toBe('/path/to/file')
      expect(error.isRecoverable).toBe(false)
    })

    it('should support recoverable errors', () => {
      const error = new CompilerError(
        ErrorCode.REDIS_TIMEOUT,
        'Operation timed out',
        { subsystem: 'redis' },
        true // recoverable
      )

      expect(error.isRecoverable).toBe(true)
    })

    it('should convert to JSON', () => {
      const error = new CompilerError(
        ErrorCode.REDIS_CONNECTION_FAILED,
        'Connection failed',
        { subsystem: 'redis' }
      )

      const json = error.toJSON()
      expect(json.code).toBe(ErrorCode.REDIS_CONNECTION_FAILED)
      expect(json.message).toBe('Connection failed')
      expect(json.isRecoverable).toBe(false)
    })

    it('should format error string with context', () => {
      const error = new CompilerError(
        ErrorCode.REDIS_CONNECTION_FAILED,
        'Connection failed',
        { subsystem: 'redis', filePath: '/src/index.ts', lineNumber: 42 }
      )

      const str = error.toString()
      expect(str).toContain('REDIS_CONNECTION_FAILED')
      expect(str).toContain('/src/index.ts:42')
    })
  })

  describe('Subsystem-Specific Errors', () => {
    it('should create RedisError', () => {
      const error = new RedisError('Connection failed', { operation: 'connect' })
      expect(error.name).toBe('RedisError')
      expect(error.context.subsystem).toBe('redis')
    })

    it('should create WatchError', () => {
      const error = new WatchError('Watch failed', { operation: 'poll' })
      expect(error.name).toBe('WatchError')
      expect(error.context.subsystem).toBe('watch')
    })

    it('should create RegistryError', () => {
      const error = new RegistryError('Registry not found', { operation: 'lookup' })
      expect(error.name).toBe('RegistryError')
      expect(error.context.subsystem).toBe('id-registry')
    })

    it('should create all error types', () => {
      expect(new IncrementalError('test').name).toBe('IncrementalError')
      expect(new ThemeError('test').name).toBe('ThemeError')
      expect(new OptimizationError('test').name).toBe('OptimizationError')
      expect(new AnalysisError('test').name).toBe('AnalysisError')
    })
  })

  describe('Error Type Guards', () => {
    it('should identify compiler errors', () => {
      const error = new CompilerError(
        ErrorCode.REDIS_CONNECTION_FAILED,
        'test',
        { subsystem: 'redis' }
      )
      expect(isCompilerError(error)).toBe(true)
      expect(isCompilerError(new Error('test'))).toBe(false)
    })

    it('should check if error is recoverable', () => {
      const recoverable = new CompilerError(
        ErrorCode.REDIS_TIMEOUT,
        'test',
        { subsystem: 'redis' },
        true
      )
      const notRecoverable = new CompilerError(
        ErrorCode.REDIS_CONNECTION_FAILED,
        'test',
        { subsystem: 'redis' },
        false
      )

      expect(isRecoverable(recoverable)).toBe(true)
      expect(isRecoverable(notRecoverable)).toBe(false)
    })

    it('should identify transient errors', () => {
      const transient = new CompilerError(
        ErrorCode.REDIS_TIMEOUT,
        'test',
        { subsystem: 'redis' },
        true
      )
      expect(isTransientError(transient)).toBe(true)

      const nonTransient = new CompilerError(
        ErrorCode.INVALID_CONFIG,
        'test',
        { subsystem: 'redis' },
        false
      )
      expect(isTransientError(nonTransient)).toBe(false)
    })
  })

  describe('Fallback Results', () => {
    it('should create success fallback result', () => {
      const result = createFallbackResult('test-value', true, 'Using cache')
      expect(result.success).toBe(true)
      expect(result.result).toBe('test-value')
      expect(result.fallbackUsed).toBe(true)
      expect(result.fallbackReason).toBe('Using cache')
    })

    it('should create error fallback result', () => {
      const error = new Error('test error')
      const result = createFallbackError(error, true, 'Fallback enabled')
      expect(result.success).toBe(false)
      expect(result.error).toBe(error)
      expect(result.fallbackUsed).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // Fallback Systems
  // ─────────────────────────────────────────────────────────────────

  describe('LocalLRUCache', () => {
    let cache: LocalLRUCache

    beforeEach(() => {
      cache = new LocalLRUCache(3) // Small size for testing
    })

    afterEach(() => {
      cache.shutdown()
    })

    it('should store and retrieve values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should handle expired entries', async () => {
      cache.set('key1', 'value1', 100) // 100ms TTL
      expect(cache.get('key1')).toBe('value1')

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(cache.get('key1')).toBeNull()
    })

    it('should enforce max size', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      cache.set('key4', 'value4') // Should evict key1

      expect(cache.get('key1')).toBeNull() // Evicted
      expect(cache.get('key2')).toBe('value2')
    })

    it('should support delete', () => {
      cache.set('key1', 'value1')
      expect(cache.delete('key1')).toBe(true)
      expect(cache.get('key1')).toBeNull()
    })

    it('should clear all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBeNull()
    })

    it('should report statistics', () => {
      cache.set('key1', 'value1')
      const stats = cache.getStats()
      expect(stats.size).toBe(1)
      expect(stats.maxSize).toBe(3)
    })
  })

  describe('WatchFallback', () => {
    let fallback: WatchFallback

    beforeEach(() => {
      fallback = new WatchFallback()
    })

    it('should indicate manual recompile required', () => {
      expect(fallback.requiresManualRecompile()).toBe(true)
    })

    it('should track checked files', () => {
      fallback.markFileChecked('/src/index.ts')
      const status = fallback.getStatus()
      expect(status.filesChecked.has('/src/index.ts')).toBe(true)
    })

    it('should clear checked files', () => {
      fallback.markFileChecked('/src/index.ts')
      fallback.clearChecked()
      const status = fallback.getStatus()
      expect(status.filesChecked.size).toBe(0)
    })

    it('should provide helpful message', () => {
      const msg = fallback.getMessage()
      expect(msg).toContain('Watch system unavailable')
      expect(msg).toContain('manual recompilation')
    })
  })

  describe('ThemeFallback', () => {
    let fallback: ThemeFallback

    beforeEach(() => {
      fallback = new ThemeFallback()
    })

    it('should return default theme colors', () => {
      const black = fallback.getThemeValue('colors.black')
      expect(black).toBe('#000000')
    })

    it('should return default spacing', () => {
      const spacing = fallback.getThemeValue('spacing.4')
      expect(spacing).toBe('1rem')
    })

    it('should return null for missing values', () => {
      const missing = fallback.getThemeValue('colors.nonexistent')
      expect(missing).toBeNull()
    })

    it('should get theme categories', () => {
      const colors = fallback.getThemeCategory('colors')
      expect(colors.black).toBe('#000000')
      expect(colors.white).toBe('#ffffff')
    })
  })

  describe('IncrementalFallback', () => {
    let fallback: IncrementalFallback

    beforeEach(() => {
      fallback = new IncrementalFallback()
    })

    it('should trigger full rebuild', () => {
      const result = fallback.triggerFullRebuild()
      expect(result.useFullRebuild).toBe(true)
      expect(result.reason).toContain('Incremental compilation failed')
    })

    it('should track rebuild time', () => {
      const before = fallback.getTimeSinceLastRebuild()
      fallback.markFullRebuild()
      const after = fallback.getTimeSinceLastRebuild()
      expect(after).toBeLessThan(before)
    })
  })

  describe('OptimizationFallback', () => {
    let fallback: OptimizationFallback

    beforeEach(() => {
      fallback = new OptimizationFallback()
    })

    it('should return unoptimized CSS', () => {
      const css = 'body { margin: 0; }'
      const result = fallback.getUnoptimizedCss(css)
      expect(result.css).toBe(css)
      expect(result.unoptimized).toBe(true)
      expect(result.sizeBytes).toBeGreaterThan(0)
    })

    it('should provide helpful message', () => {
      const msg = fallback.getMessage()
      expect(msg).toContain('optimization failed')
      expect(msg).toContain('unoptimized')
    })
  })

  describe('FallbackManager', () => {
    let manager: FallbackManager

    beforeEach(() => {
      manager = new FallbackManager()
    })

    afterEach(() => {
      manager.shutdown()
    })

    it('should provide all fallback systems', () => {
      expect(manager.getRedisCache()).toBeInstanceOf(LocalLRUCache)
      expect(manager.getWatch()).toBeInstanceOf(WatchFallback)
      expect(manager.getTheme()).toBeInstanceOf(ThemeFallback)
      expect(manager.getIncremental()).toBeInstanceOf(IncrementalFallback)
      expect(manager.getOptimization()).toBeInstanceOf(OptimizationFallback)
    })

    it('should provide diagnostics', () => {
      const diags = manager.getDiagnostics()
      expect(diags).toHaveProperty('redis')
      expect(diags).toHaveProperty('watch')
      expect(diags).toHaveProperty('incremental')
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // Logging and Diagnostics
  // ─────────────────────────────────────────────────────────────────

  describe('DiagnosticLogger', () => {
    let logger: DiagnosticLogger

    beforeEach(() => {
      resetLoggers()
      logger = new DiagnosticLogger(100, false, false)
    })

    afterEach(() => {
      resetLoggers()
    })

    it('should log messages with context', () => {
      logger.log(LogLevel.INFO, 'test', 'Test message', undefined, { key: 'value' })
      const logs = logger.getLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('Test message')
      expect(logs[0].context?.key).toBe('value')
    })

    it('should filter logs by subsystem', () => {
      logger.log(LogLevel.INFO, 'redis', 'Redis msg')
      logger.log(LogLevel.INFO, 'watch', 'Watch msg')
      const redisLogs = logger.getSubsystemLogs('redis')
      expect(redisLogs).toHaveLength(1)
    })

    it('should filter logs by level', () => {
      logger.log(LogLevel.ERROR, 'test', 'Error')
      logger.log(LogLevel.WARN, 'test', 'Warning')
      const errors = logger.getLogsByLevel(LogLevel.ERROR)
      expect(errors).toHaveLength(1)
    })

    it('should provide summary', () => {
      logger.log(LogLevel.ERROR, 'test', 'Error')
      logger.log(LogLevel.WARN, 'test', 'Warning')
      logger.log(LogLevel.INFO, 'test', 'Info')

      const summary = logger.getSummary()
      expect(summary).toContain('3 total')
      expect(summary).toContain('Errors: 1')
      expect(summary).toContain('Warnings: 1')
    })

    it('should enforce max logs', () => {
      logger = new DiagnosticLogger(5)
      for (let i = 0; i < 10; i++) {
        logger.log(LogLevel.INFO, 'test', `Message ${i}`)
      }
      expect(logger.getLogs()).toHaveLength(5)
    })
  })

  describe('DiagnosticsManager', () => {
    let logger: DiagnosticLogger
    let manager: DiagnosticsManager

    beforeEach(() => {
      resetLoggers()
      logger = new DiagnosticLogger(100, false, false)
      manager = new DiagnosticsManager(logger)
    })

    afterEach(() => {
      resetLoggers()
    })

    it('should record slow operations', () => {
      manager.recordSlowOperation('test', 'operation', 2000, 1000)
      const report = manager.generateReport()
      expect(report.performance.slowOperations).toHaveLength(1)
    })

    it('should generate diagnostic report', () => {
      logger.logError('redis', 'Connection failed', new Error('test'))
      const report = manager.generateReport()
      expect(report.errors.total).toBe(1)
      expect(report.errors.bySubsystem.redis).toBe(1)
    })

    it('should provide recommendations', () => {
      for (let i = 0; i < 10; i++) {
        logger.logError('redis', 'Error', new Error('test'))
      }
      const report = manager.generateReport()
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('should format report as string', () => {
      logger.logError('test', 'Error', new Error('test'))
      const str = manager.getReportAsString()
      expect(str).toContain('DIAGNOSTICS REPORT')
      expect(str).toContain('Timestamp')
      expect(str).toContain('ERRORS')
    })

    it('should export report as JSON', () => {
      logger.logError('test', 'Error', new Error('test'))
      const json = manager.exportAsJson()
      const report = JSON.parse(json)
      expect(report.errors.total).toBe(1)
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // Recovery Strategies
  // ─────────────────────────────────────────────────────────────────

  describe('RetryStrategy', () => {
    let strategy: RetryStrategy

    beforeEach(() => {
      strategy = new RetryStrategy({
        maxRetries: 2,
        initialDelayMs: 10,
        maxDelayMs: 100,
      })
    })

    it('should retry successful operations', async () => {
      let attempts = 0
      const result = await strategy.executeWithRetry(async () => {
        attempts++
        return 'success'
      }, 'test')

      expect(result).toBe('success')
      expect(attempts).toBe(1)
    })

    it('should retry failing operations', async () => {
      let attempts = 0
      const operation = async () => {
        attempts++
        if (attempts < 3) {
          throw new CompilerError(
            ErrorCode.REDIS_TIMEOUT,
            'Timeout',
            { subsystem: 'redis' },
            true
          )
        }
        return 'success'
      }

      const result = await strategy.executeWithRetry(operation, 'test')
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should throw after max retries', async () => {
      const operation = async () => {
        throw new Error('Always fails')
      }

      await expect(
        strategy.executeWithRetry(operation, 'test', () => true)
      ).rejects.toThrow()
    })
  })

  describe('CircuitBreaker', () => {
    let breaker: CircuitBreaker

    beforeEach(() => {
      breaker = new CircuitBreaker('test-service', {
        failureThreshold: 2,
        successThreshold: 1,
        resetTimeoutMs: 100,
      })
    })

    it('should allow calls in closed state', () => {
      expect(breaker.canCall()).toBe(true)
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('should open after failures', () => {
      breaker.recordFailure()
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
      breaker.recordFailure()
      expect(breaker.getState()).toBe(CircuitState.OPEN)
    })

    it('should deny calls in open state', () => {
      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.canCall()).toBe(false)
    })

    it('should transition to half-open after reset timeout', async () => {
      breaker.recordFailure()
      breaker.recordFailure()
      expect(breaker.getState()).toBe(CircuitState.OPEN)

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(breaker.canCall()).toBe(true)
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN)
    })

    it('should close on success in half-open', async () => {
      breaker.recordFailure()
      breaker.recordFailure()

      await new Promise(resolve => setTimeout(resolve, 150))
      breaker.recordSuccess()
      expect(breaker.getState()).toBe(CircuitState.CLOSED)
    })

    it('should execute with fallback', async () => {
      const result = await breaker.execute(
        async () => 'success',
        async () => 'fallback'
      )
      expect(result).toBe('success')
    })

    it('should use fallback when open', async () => {
      breaker.recordFailure()
      breaker.recordFailure()

      const result = await breaker.execute(
        async () => 'success',
        async () => 'fallback'
      )
      expect(result).toBe('fallback')
    })
  })

  describe('RecoveryManager', () => {
    let manager: RecoveryManager

    beforeEach(() => {
      resetRecoveryManager()
      manager = getRecoveryManager()
    })

    afterEach(() => {
      resetRecoveryManager()
    })

    it('should create retry strategies', () => {
      const strategy1 = manager.getRetryStrategy('test1')
      const strategy2 = manager.getRetryStrategy('test1')
      expect(strategy1).toBe(strategy2)
    })

    it('should create circuit breakers', () => {
      const breaker1 = manager.getCircuitBreaker('service1')
      const breaker2 = manager.getCircuitBreaker('service1')
      expect(breaker1).toBe(breaker2)
    })

    it('should execute with full recovery', async () => {
      let attempts = 0
      const result = await manager.executeWithRecovery(
        'test',
        async () => {
          attempts++
          return 'success'
        }
      )

      expect(result).toBe('success')
      expect(attempts).toBe(1)
    })

    it('should provide circuit breaker status', () => {
      manager.getCircuitBreaker('service1')
      const status = manager.getCircuitBreakerStatus()
      expect(status).toHaveProperty('service1')
    })
  })

  // ─────────────────────────────────────────────────────────────────
  // Singleton Instances
  // ─────────────────────────────────────────────────────────────────

  describe('Singleton Instances', () => {
    beforeEach(() => {
      resetFallbackManager()
      resetLoggers()
      resetRecoveryManager()
    })

    afterEach(() => {
      resetFallbackManager()
      resetLoggers()
      resetRecoveryManager()
    })

    it('should provide global fallback manager', () => {
      const manager1 = getFallbackManager()
      const manager2 = getFallbackManager()
      expect(manager1).toBe(manager2)
    })

    it('should provide global logger', () => {
      const logger1 = getLogger()
      const logger2 = getLogger()
      expect(logger1).toBe(logger2)
    })

    it('should provide global diagnostics', () => {
      const diags1 = getDiagnostics()
      const diags2 = getDiagnostics()
      expect(diags1).toBe(diags2)
    })

    it('should provide global recovery manager', () => {
      const manager1 = getRecoveryManager()
      const manager2 = getRecoveryManager()
      expect(manager1).toBe(manager2)
    })
  })
})
