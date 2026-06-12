/**
 * Comprehensive Error Handling System
 *
 * Provides:
 * - Error types for each subsystem (Redis, Watch, Registry, etc.)
 * - Error context with file paths and operation details
 * - Graceful fallback mechanisms for critical paths
 * - Error logging and diagnostics
 * - Recovery strategies for transient failures
 */

// ─────────────────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────────────────

export enum ErrorCode {
  // Generic errors
  UNKNOWN = 'UNKNOWN',
  NOT_READY = 'NOT_READY',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // Redis errors
  REDIS_CONNECTION_FAILED = 'REDIS_CONNECTION_FAILED',
  REDIS_TIMEOUT = 'REDIS_TIMEOUT',
  REDIS_POOL_EXHAUSTED = 'REDIS_POOL_EXHAUSTED',
  REDIS_CLUSTER_FAILED = 'REDIS_CLUSTER_FAILED',
  REDIS_REPLICATION_FAILED = 'REDIS_REPLICATION_FAILED',
  REDIS_PERSISTENCE_FAILED = 'REDIS_PERSISTENCE_FAILED',
  REDIS_MEMORY_EXHAUSTED = 'REDIS_MEMORY_EXHAUSTED',
  REDIS_OPERATION_FAILED = 'REDIS_OPERATION_FAILED',

  // Watch system errors
  WATCH_START_FAILED = 'WATCH_START_FAILED',
  WATCH_POLL_FAILED = 'WATCH_POLL_FAILED',
  WATCH_PATTERN_INVALID = 'WATCH_PATTERN_INVALID',
  WATCH_STOPPED = 'WATCH_STOPPED',
  WATCH_TOO_MANY_FILES = 'WATCH_TOO_MANY_FILES',

  // ID Registry errors
  REGISTRY_NOT_FOUND = 'REGISTRY_NOT_FOUND',
  REGISTRY_FULL = 'REGISTRY_FULL',
  REGISTRY_IMPORT_FAILED = 'REGISTRY_IMPORT_FAILED',
  REGISTRY_EXPORT_FAILED = 'REGISTRY_EXPORT_FAILED',

  // Incremental compilation errors
  INCREMENTAL_DIFF_FAILED = 'INCREMENTAL_DIFF_FAILED',
  FINGERPRINT_FAILED = 'FINGERPRINT_FAILED',
  REBUILD_FAILED = 'REBUILD_FAILED',

  // Theme resolution errors
  THEME_RESOLUTION_FAILED = 'THEME_RESOLUTION_FAILED',
  THEME_VALIDATION_FAILED = 'THEME_VALIDATION_FAILED',
  THEME_CIRCULAR_DEPENDENCY = 'THEME_CIRCULAR_DEPENDENCY',

  // Optimization errors
  OPTIMIZATION_FAILED = 'OPTIMIZATION_FAILED',
  DEAD_CODE_DETECTION_FAILED = 'DEAD_CODE_DETECTION_FAILED',

  // Analysis errors
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
}

// ─────────────────────────────────────────────────────────────────────────
// Error Context
// ─────────────────────────────────────────────────────────────────────────

export interface ErrorContext {
  subsystem: string
  operation: string
  filePath?: string
  lineNumber?: number
  timestamp: number
  details?: Record<string, unknown>
  originalError?: Error
  retryCount?: number
  transient?: boolean
}

// ─────────────────────────────────────────────────────────────────────────
// Base Compiler Error
// ─────────────────────────────────────────────────────────────────────────

export class CompilerError extends Error {
  readonly code: ErrorCode
  readonly context: ErrorContext
  readonly isRecoverable: boolean

  constructor(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext>,
    isRecoverable: boolean = false
  ) {
    super(message)
    this.name = 'CompilerError'
    this.code = code
    this.isRecoverable = isRecoverable
    this.context = {
      subsystem: 'compiler',
      operation: 'unknown',
      timestamp: Date.now(),
      ...context,
    }

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, CompilerError.prototype)
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      isRecoverable: this.isRecoverable,
    }
  }

  toString(): string {
    const details = this.context.filePath
      ? ` (${this.context.filePath}${this.context.lineNumber ? `:${this.context.lineNumber}` : ''})`
      : ''

    return `${this.name} [${this.code}]: ${this.message}${details}`
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Subsystem-Specific Error Classes
// ─────────────────────────────────────────────────────────────────────────

export class RedisError extends CompilerError {
  constructor(message: string, context: Partial<ErrorContext> = {}, isRecoverable = true) {
    super(
      ErrorCode.REDIS_OPERATION_FAILED,
      message,
      { subsystem: 'redis', ...context },
      isRecoverable
    )
    this.name = 'RedisError'
    Object.setPrototypeOf(this, RedisError.prototype)
  }
}

export class WatchError extends CompilerError {
  constructor(message: string, context: Partial<ErrorContext> = {}, isRecoverable = true) {
    super(
      ErrorCode.WATCH_START_FAILED,
      message,
      { subsystem: 'watch', ...context },
      isRecoverable
    )
    this.name = 'WatchError'
    Object.setPrototypeOf(this, WatchError.prototype)
  }
}

export class RegistryError extends CompilerError {
  constructor(message: string, context: Partial<ErrorContext> = {}, isRecoverable = false) {
    super(
      ErrorCode.REGISTRY_NOT_FOUND,
      message,
      { subsystem: 'id-registry', ...context },
      isRecoverable
    )
    this.name = 'RegistryError'
    Object.setPrototypeOf(this, RegistryError.prototype)
  }
}

export class IncrementalError extends CompilerError {
  constructor(message: string, context: Partial<ErrorContext> = {}, isRecoverable = true) {
    super(
      ErrorCode.INCREMENTAL_DIFF_FAILED,
      message,
      { subsystem: 'incremental', ...context },
      isRecoverable
    )
    this.name = 'IncrementalError'
    Object.setPrototypeOf(this, IncrementalError.prototype)
  }
}

export class ThemeError extends CompilerError {
  constructor(message: string, context: Partial<ErrorContext> = {}, isRecoverable = false) {
    super(
      ErrorCode.THEME_RESOLUTION_FAILED,
      message,
      { subsystem: 'theme', ...context },
      isRecoverable
    )
    this.name = 'ThemeError'
    Object.setPrototypeOf(this, ThemeError.prototype)
  }
}

export class OptimizationError extends CompilerError {
  constructor(message: string, context: Partial<ErrorContext> = {}, isRecoverable = true) {
    super(
      ErrorCode.OPTIMIZATION_FAILED,
      message,
      { subsystem: 'optimization', ...context },
      isRecoverable
    )
    this.name = 'OptimizationError'
    Object.setPrototypeOf(this, OptimizationError.prototype)
  }
}

export class AnalysisError extends CompilerError {
  constructor(message: string, context: Partial<ErrorContext> = {}, isRecoverable = true) {
    super(
      ErrorCode.ANALYSIS_FAILED,
      message,
      { subsystem: 'analysis', ...context },
      isRecoverable
    )
    this.name = 'AnalysisError'
    Object.setPrototypeOf(this, AnalysisError.prototype)
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Error Type Guards
// ─────────────────────────────────────────────────────────────────────────

export function isCompilerError(err: unknown): err is CompilerError {
  return err instanceof CompilerError
}

export function isRecoverable(err: unknown): boolean {
  return isCompilerError(err) && err.isRecoverable
}

export function isTransientError(err: unknown): boolean {
  if (!isCompilerError(err)) return false

  // Transient errors are those that might succeed on retry
  const transientCodes = [
    ErrorCode.REDIS_TIMEOUT,
    ErrorCode.REDIS_CONNECTION_FAILED,
    ErrorCode.WATCH_POLL_FAILED,
    ErrorCode.INCREMENTAL_DIFF_FAILED,
  ]

  return transientCodes.includes(err.code)
}

// ─────────────────────────────────────────────────────────────────────────
// Fallback Result Type
// ─────────────────────────────────────────────────────────────────────────

export interface FallbackResult<T> {
  success: boolean
  result?: T
  error?: Error
  fallbackUsed: boolean
  fallbackReason?: string
}

export function createFallbackResult<T>(
  result: T,
  fallbackUsed: boolean = false,
  fallbackReason?: string
): FallbackResult<T> {
  return {
    success: true,
    result,
    fallbackUsed,
    fallbackReason,
  }
}

export function createFallbackError<T>(
  error: Error,
  fallbackUsed: boolean = false,
  fallbackReason?: string
): FallbackResult<T> {
  return {
    success: false,
    error,
    fallbackUsed,
    fallbackReason,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Re-export all error utilities
// ─────────────────────────────────────────────────────────────────────────

export * from './fallbacks'
export * from './logger'
export * from './recovery'
