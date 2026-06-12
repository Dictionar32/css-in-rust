/**
 * BaseManager - Common infrastructure for all domain managers
 *
 * Provides:
 * - Error handling patterns with fallback logic
 * - Configuration management interface
 * - Initialization/shutdown lifecycle
 * - Rust function availability detection
 * - Comprehensive error tracking and recovery
 */

import { getNativeBridge } from '../nativeBridge'
import {
  CompilerError,
  ErrorCode,
  getLogger,
  getDiagnostics,
  getFallbackManager,
  getRecoveryManager,
} from '../errors'

export enum ManagerState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  ERROR = 'error',
  SHUTDOWN = 'shutdown',
}

export interface ManagerConfig {
  enabled?: boolean
  [key: string]: unknown
}

export class BaseManager {
  protected state: ManagerState = ManagerState.UNINITIALIZED
  protected config: ManagerConfig
  protected nativeBridge: ReturnType<typeof getNativeBridge> | null = null
  protected nativeAvailable: boolean = false
  protected error: Error | null = null
  protected logger = getLogger()
  protected diagnostics = getDiagnostics()
  protected fallbacks = getFallbackManager()
  protected recovery = getRecoveryManager()

  constructor(config: ManagerConfig = {}) {
    this.config = { enabled: false, ...config }
    this.detectNativeAvailability()
  }

  /**
   * Detect if Rust native functions are available
   */
  protected detectNativeAvailability(): void {
    try {
      this.nativeBridge = getNativeBridge()
      this.nativeAvailable = true
      this.logger.logDebug(
        this.constructor.name,
        'Native bridge available'
      )
    } catch (err) {
      this.nativeAvailable = false
      this.error = err instanceof Error ? err : new Error(String(err))
      this.logger.logWarn(
        this.constructor.name,
        'Native bridge not available, will use fallbacks',
        { error: this.error.message }
      )
    }
  }

  /**
   * Initialize the manager - validate configuration and setup
   */
  async initialize(): Promise<void> {
    try {
      this.state = ManagerState.INITIALIZING
      this.logger.logInfo(
        this.constructor.name,
        `Initializing with enabled=${this.config.enabled}`
      )

      if (!this.config.enabled) {
        this.state = ManagerState.READY
        this.logger.logDebug(this.constructor.name, 'Disabled, skipping initialization')
        return
      }

      if (!this.nativeAvailable) {
        this.logger.logWarn(
          this.constructor.name,
          'Native functions not available, will use fallbacks'
        )
      }

      // Subclasses override this for domain-specific initialization
      await this.onInitialize()

      this.state = ManagerState.READY
      this.logger.logInfo(this.constructor.name, 'Initialization complete')
    } catch (err) {
      this.state = ManagerState.ERROR
      this.error = err instanceof Error ? err : new Error(String(err))
      this.logger.logError(
        this.constructor.name,
        'Initialization failed',
        this.error,
        { state: this.state }
      )
      throw this.error
    }
  }

  /**
   * Hook for subclasses to implement domain-specific initialization
   */
  protected async onInitialize(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Shutdown the manager and cleanup resources
   */
  async shutdown(): Promise<void> {
    try {
      await this.onShutdown()
      this.state = ManagerState.SHUTDOWN
    } catch (err) {
      this.error = err instanceof Error ? err : new Error(String(err))
      throw this.error
    }
  }

  /**
   * Hook for subclasses to implement domain-specific cleanup
   */
  protected async onShutdown(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Check if manager is ready
   */
  isReady(): boolean {
    return this.state === ManagerState.READY && this.config.enabled === true
  }

  /**
   * Get current manager state
   */
  getState(): ManagerState {
    return this.state
  }

  /**
   * Get current configuration
   */
  getConfig(): ManagerConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<ManagerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Check if native functions are available
   */
  isNativeAvailable(): boolean {
    return this.nativeAvailable
  }

  /**
   * Get last error if any
   */
  getError(): Error | null {
    return this.error
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error = null
  }

  /**
   * Handle errors with optional fallback
   * Returns true if error was handled, false if it should be thrown
   */
  protected handleError(
    error: Error,
    context: string,
    options: {
      logOnly?: boolean
      fallbackAvailable?: boolean
      subsystem?: string
    } = {}
  ): boolean {
    const {
      logOnly = false,
      fallbackAvailable = false,
      subsystem = this.constructor.name,
    } = options

    const errorMessage = error instanceof CompilerError
      ? error.toString()
      : `${context}: ${error.message}`

    if (fallbackAvailable) {
      this.logger.logWarn(
        subsystem,
        `${errorMessage} (fallback available)`,
        { context }
      )
      this.error = error
      this.diagnostics.recordSlowOperation(subsystem, context, 0)
      return true
    }

    if (logOnly) {
      this.logger.logWarn(
        subsystem,
        `${errorMessage} (logged only)`,
        { context }
      )
      this.error = error
      return true
    }

    this.logger.logError(
      subsystem,
      errorMessage,
      error,
      { context }
    )

    return false
  }

  /**
   * Ensure manager is ready before operations
   */
  protected ensureReady(): void {
    if (!this.isReady()) {
      const msg = (
        `${this.constructor.name} is not ready. State: ${this.state}. ` +
        `Ensure initialize() has been called and config.enabled is true.`
      )
      this.logger.logError(this.constructor.name, msg, new Error(msg))
      throw new Error(msg)
    }
  }

  /**
   * Get manager diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    return {
      name: this.constructor.name,
      state: this.state,
      enabled: this.config.enabled,
      nativeAvailable: this.nativeAvailable,
      hasError: this.error !== null,
      error: this.error?.message,
    }
  }

  /**
   * Get comprehensive diagnostic report
   */
  getDiagnosticReport(): string {
    const diags = this.getDiagnostics()
    return `${this.constructor.name}: ${JSON.stringify(diags)}`
  }

  /**
   * Wrap Rust function calls with error handling
   */
  protected async callRustFunction<T>(
    functionName: string,
    args: unknown[],
    options: {
      fallback?: () => T
      required?: boolean
    } = {}
  ): Promise<T> {
    const { fallback, required = true } = options

    try {
      if (!this.nativeBridge) {
        throw new Error(`Native bridge not available`)
      }

      const fn = (this.nativeBridge as Record<string, any>)[functionName]
      if (typeof fn !== 'function') {
        throw new Error(`Function ${functionName} not found in native bridge`)
      }

      return fn(...args)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))

      if (fallback) {
        if (process.env.DEBUG?.includes('manager')) {
          console.warn(
            `[${this.constructor.name}] Function ${functionName} failed, using fallback:`,
            error.message
          )
        }
        return fallback()
      }

      if (required) {
        throw error
      }

      if (process.env.DEBUG?.includes('manager')) {
        console.warn(
          `[${this.constructor.name}] Function ${functionName} failed (non-required):`,
          error.message
        )
      }

      return undefined as T
    }
  }
}
