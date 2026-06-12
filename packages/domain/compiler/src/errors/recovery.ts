/**
 * Recovery Strategies for Transient Failures
 *
 * Provides:
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern for service failures
 * - Graceful degradation when recovery fails
 * - Transient vs permanent error classification
 */

import { CompilerError, isTransientError, ErrorCode } from './index'
import { getLogger } from './logger'

// ─────────────────────────────────────────────────────────────────────────
// Retry Strategy
// ─────────────────────────────────────────────────────────────────────────

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitter: boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true,
}

export class RetryStrategy {
  private config: RetryConfig
  private logger = getLogger()

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config }
  }

  /**
   * Calculate delay for retry attempt
   */
  private calculateDelay(attempt: number): number {
    let delay = this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt)
    delay = Math.min(delay, this.config.maxDelayMs)

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.round(delay)
  }

  /**
   * Wait for specified milliseconds
   */
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Execute operation with retry
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    shouldRetry?: (error: unknown) => boolean
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (err) {
        lastError = err

        // Check if we should retry
        const isRetryable = shouldRetry ? shouldRetry(err) : isTransientError(err)

        if (!isRetryable || attempt >= this.config.maxRetries) {
          throw err
        }

        const delay = this.calculateDelay(attempt)
        this.logger.logWarn(
          'retry',
          `Operation ${operationName} failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`,
          { error: String(err) }
        )

        await this.wait(delay)
      }
    }

    throw lastError
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: unknown): boolean {
    if (isTransientError(error)) {
      return true
    }

    // Additional custom retry logic can be added here
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Circuit Breaker
// ─────────────────────────────────────────────────────────────────────────

export enum CircuitState {
  CLOSED = 'closed',      // Operating normally
  OPEN = 'open',          // Failing, reject calls
  HALF_OPEN = 'half_open', // Testing recovery
}

export interface CircuitBreakerConfig {
  failureThreshold: number      // Failures before opening
  successThreshold: number      // Successes before closing
  resetTimeoutMs: number        // Time before attempting half-open
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 30000, // 30 seconds
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount: number = 0
  private successCount: number = 0
  private lastFailureTime: number = 0
  private config: CircuitBreakerConfig
  private logger = getLogger()

  constructor(
    private serviceName: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config }
  }

  /**
   * Check if call should be allowed
   */
  canCall(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true
    }

    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      const timeSinceFailure = Date.now() - this.lastFailureTime
      if (timeSinceFailure > this.config.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN
        this.successCount = 0
        this.failureCount = 0
        this.logger.logInfo(
          'circuit-breaker',
          `Circuit breaker for ${this.serviceName} transitioned to HALF_OPEN`
        )
        return true
      }

      return false
    }

    // Half-open state
    return true
  }

  /**
   * Record success
   */
  recordSuccess(): void {
    this.failureCount = 0

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++

      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED
        this.logger.logInfo(
          'circuit-breaker',
          `Circuit breaker for ${this.serviceName} transitioned to CLOSED`
        )
      }
    }
  }

  /**
   * Record failure
   */
  recordFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()
    this.successCount = 0

    if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN
        this.logger.logWarn(
          'circuit-breaker',
          `Circuit breaker for ${this.serviceName} transitioned to OPEN after ${this.failureCount} failures`
        )
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN
      this.logger.logWarn(
        'circuit-breaker',
        `Circuit breaker for ${this.serviceName} transitioned back to OPEN`
      )
    }
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    if (!this.canCall()) {
      if (fallback) {
        return await fallback()
      }
      throw new Error(
        `Circuit breaker for ${this.serviceName} is OPEN. Service unavailable.`
      )
    }

    try {
      const result = await operation()
      this.recordSuccess()
      return result
    } catch (err) {
      this.recordFailure()

      if (fallback && this.state === CircuitState.OPEN) {
        return await fallback()
      }

      throw err
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = 0
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): {
    state: CircuitState
    failureCount: number
    successCount: number
    lastFailureTime: number
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Recovery Manager
// ─────────────────────────────────────────────────────────────────────────

export class RecoveryManager {
  private retryStrategies: Map<string, RetryStrategy> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private logger = getLogger()

  /**
   * Get or create retry strategy
   */
  getRetryStrategy(name: string, config?: Partial<RetryConfig>): RetryStrategy {
    if (!this.retryStrategies.has(name)) {
      this.retryStrategies.set(name, new RetryStrategy(config))
    }
    return this.retryStrategies.get(name)!
  }

  /**
   * Get or create circuit breaker
   */
  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, config))
    }
    return this.circuitBreakers.get(name)!
  }

  /**
   * Execute with full recovery strategy
   */
  async executeWithRecovery<T>(
    serviceName: string,
    operation: () => Promise<T>,
    fallback?: () => T | Promise<T>,
    retryConfig?: Partial<RetryConfig>,
    circuitConfig?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(serviceName, circuitConfig)
    const retryStrategy = this.getRetryStrategy(serviceName, retryConfig)

    return circuitBreaker.execute(
      async () => {
        return retryStrategy.executeWithRetry(
          operation,
          serviceName,
          err => isTransientError(err)
        )
      },
      fallback
    )
  }

  /**
   * Get all circuit breakers status
   */
  getCircuitBreakerStatus(): Record<string, any> {
    const status: Record<string, any> = {}

    for (const [name, breaker] of this.circuitBreakers.entries()) {
      status[name] = breaker.getDiagnostics()
    }

    return status
  }

  /**
   * Reset all recovery systems
   */
  resetAll(): void {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset()
    }
    this.logger.logInfo('recovery', 'All circuit breakers reset')
  }

  /**
   * Get recovery diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    return {
      retryStrategies: this.retryStrategies.size,
      circuitBreakers: this.circuitBreakers.size,
      circuitBreakerStatus: this.getCircuitBreakerStatus(),
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────────────────

let globalRecoveryManager: RecoveryManager | null = null

export function getRecoveryManager(): RecoveryManager {
  if (!globalRecoveryManager) {
    globalRecoveryManager = new RecoveryManager()
  }
  return globalRecoveryManager
}

export function resetRecoveryManager(): void {
  if (globalRecoveryManager) {
    globalRecoveryManager.resetAll()
    globalRecoveryManager = null
  }
}
