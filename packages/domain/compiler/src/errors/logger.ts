/**
 * Error Logging and Diagnostics System
 *
 * Provides:
 * - Structured logging with context
 * - Debug output for troubleshooting
 * - Error history tracking
 * - Diagnostic reports
 */

import { CompilerError, ErrorCode, ErrorContext } from './index'

// ─────────────────────────────────────────────────────────────────────────
// Log Levels
// ─────────────────────────────────────────────────────────────────────────

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// ─────────────────────────────────────────────────────────────────────────
// Log Entry
// ─────────────────────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: number
  level: LogLevel
  subsystem: string
  message: string
  error?: Error
  context?: Record<string, unknown>
  stack?: string
}

// ─────────────────────────────────────────────────────────────────────────
// Logger
// ─────────────────────────────────────────────────────────────────────────

export class DiagnosticLogger {
  private logs: LogEntry[] = []
  private readonly maxLogs: number
  private enableDebug: boolean
  private enableConsole: boolean

  constructor(
    maxLogs: number = 1000,
    enableDebug: boolean = false,
    enableConsole: boolean = false
  ) {
    this.maxLogs = maxLogs
    this.enableDebug = enableDebug
    this.enableConsole = enableConsole

    // Check environment variables
    if (process.env.DEBUG?.includes('compiler:errors')) {
      this.enableDebug = true
    }
    if (process.env.VERBOSE?.includes('true')) {
      this.enableConsole = true
    }
  }

  /**
   * Log a message
   */
  log(
    level: LogLevel,
    subsystem: string,
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      subsystem,
      message,
      error,
      context,
      stack: error?.stack,
    }

    // Add to history
    this.logs.push(entry)

    // Enforce max size with circular buffer
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output
    if (this.enableConsole || level === LogLevel.ERROR) {
      this.writeToConsole(entry)
    }

    // Debug output
    if (this.enableDebug && level === LogLevel.DEBUG) {
      console.debug(`[${subsystem}] ${message}`, context)
    }
  }

  /**
   * Log error
   */
  logError(
    subsystem: string,
    message: string,
    error: Error,
    context?: Record<string, unknown>
  ): void {
    this.log(LogLevel.ERROR, subsystem, message, error, context)
  }

  /**
   * Log warning
   */
  logWarn(
    subsystem: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log(LogLevel.WARN, subsystem, message, undefined, context)
  }

  /**
   * Log info
   */
  logInfo(
    subsystem: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log(LogLevel.INFO, subsystem, message, undefined, context)
  }

  /**
   * Log debug
   */
  logDebug(
    subsystem: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (this.enableDebug) {
      this.log(LogLevel.DEBUG, subsystem, message, undefined, context)
    }
  }

  /**
   * Write entry to console
   */
  private writeToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${entry.subsystem}] [${entry.level}]`

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`)
        if (entry.error) {
          console.error(entry.error)
        }
        break
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`)
        break
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`)
        break
      case LogLevel.DEBUG:
        if (this.enableDebug) {
          console.debug(`${prefix} ${entry.message}`)
        }
        break
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * Get logs for specific subsystem
   */
  getSubsystemLogs(subsystem: string): LogEntry[] {
    return this.logs.filter(log => log.subsystem === subsystem)
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level)
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count)
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = []
  }

  /**
   * Get formatted log summary
   */
  getSummary(): string {
    const errorCount = this.logs.filter(l => l.level === LogLevel.ERROR).length
    const warnCount = this.logs.filter(l => l.level === LogLevel.WARN).length
    const infoCount = this.logs.filter(l => l.level === LogLevel.INFO).length

    return `Logs: ${this.logs.length} total | Errors: ${errorCount} | Warnings: ${warnCount} | Info: ${infoCount}`
  }

  /**
   * Enable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.enableDebug = enabled
  }

  /**
   * Enable console output
   */
  setConsoleMode(enabled: boolean): void {
    this.enableConsole = enabled
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Diagnostics Report
// ─────────────────────────────────────────────────────────────────────────

export interface DiagnosticsReport {
  timestamp: number
  uptime: number
  errors: {
    total: number
    bySubsystem: Record<string, number>
    byCode: Record<string, number>
    recent: LogEntry[]
  }
  warnings: {
    total: number
    recent: LogEntry[]
  }
  performance: {
    slowOperations: Array<{
      subsystem: string
      operation: string
      durationMs: number
    }>
  }
  recommendations: string[]
}

// ─────────────────────────────────────────────────────────────────────────
// Diagnostics Manager
// ─────────────────────────────────────────────────────────────────────────

export class DiagnosticsManager {
  private logger: DiagnosticLogger
  private startTime: number = Date.now()
  private slowOperations: Array<{
    subsystem: string
    operation: string
    durationMs: number
  }> = []

  constructor(logger: DiagnosticLogger) {
    this.logger = logger
  }

  /**
   * Record slow operation
   */
  recordSlowOperation(
    subsystem: string,
    operation: string,
    durationMs: number,
    thresholdMs: number = 1000
  ): void {
    if (durationMs > thresholdMs) {
      this.slowOperations.push({ subsystem, operation, durationMs })

      // Keep only recent ones
      if (this.slowOperations.length > 100) {
        this.slowOperations.shift()
      }

      this.logger.logWarn(subsystem, `Slow operation: ${operation} took ${durationMs}ms`)
    }
  }

  /**
   * Generate full diagnostics report
   */
  generateReport(): DiagnosticsReport {
    const logs = this.logger.getLogs()
    const errors = logs.filter(l => l.level === LogLevel.ERROR)
    const warnings = logs.filter(l => l.level === LogLevel.WARN)

    // Group errors by subsystem
    const errorsBySubsystem: Record<string, number> = {}
    for (const error of errors) {
      errorsBySubsystem[error.subsystem] = (errorsBySubsystem[error.subsystem] || 0) + 1
    }

    // Group errors by code (from CompilerError)
    const errorsByCode: Record<string, number> = {}
    for (const error of errors) {
      if (error.context?.code) {
        const code = String(error.context.code)
        errorsByCode[code] = (errorsByCode[code] || 0) + 1
      }
    }

    // Generate recommendations
    const recommendations: string[] = []

    if (errorsBySubsystem['redis']) {
      recommendations.push('Redis errors detected. Check Redis connection and health.')
    }

    if (errorsBySubsystem['watch'] && errorsBySubsystem['watch'] > 5) {
      recommendations.push('Multiple watch errors. Consider disabling watch and using manual recompile.')
    }

    if (this.slowOperations.length > 0) {
      recommendations.push(
        `${this.slowOperations.length} slow operations detected. Consider optimizing or increasing resource allocation.`
      )
    }

    if (errors.length > 50) {
      recommendations.push('High error rate detected. Review logs and system configuration.')
    }

    return {
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime,
      errors: {
        total: errors.length,
        bySubsystem: errorsBySubsystem,
        byCode: errorsByCode,
        recent: errors.slice(-10),
      },
      warnings: {
        total: warnings.length,
        recent: warnings.slice(-10),
      },
      performance: {
        slowOperations: this.slowOperations.slice(-10),
      },
      recommendations,
    }
  }

  /**
   * Get report as formatted string
   */
  getReportAsString(): string {
    const report = this.generateReport()
    const lines: string[] = []

    lines.push('='.repeat(60))
    lines.push('DIAGNOSTICS REPORT')
    lines.push('='.repeat(60))
    lines.push('')

    lines.push(`Timestamp: ${new Date(report.timestamp).toISOString()}`)
    lines.push(`Uptime: ${Math.round(report.uptime / 1000)}s`)
    lines.push('')

    lines.push('ERRORS:')
    lines.push(`  Total: ${report.errors.total}`)
    lines.push('  By Subsystem:')
    for (const [subsystem, count] of Object.entries(report.errors.bySubsystem)) {
      lines.push(`    ${subsystem}: ${count}`)
    }
    lines.push('')

    lines.push('WARNINGS:')
    lines.push(`  Total: ${report.warnings.total}`)
    lines.push('')

    if (report.performance.slowOperations.length > 0) {
      lines.push('SLOW OPERATIONS:')
      for (const op of report.performance.slowOperations) {
        lines.push(`  ${op.subsystem}/${op.operation}: ${op.durationMs}ms`)
      }
      lines.push('')
    }

    if (report.recommendations.length > 0) {
      lines.push('RECOMMENDATIONS:')
      for (const rec of report.recommendations) {
        lines.push(`  - ${rec}`)
      }
      lines.push('')
    }

    lines.push('='.repeat(60))

    return lines.join('\n')
  }

  /**
   * Export diagnostics as JSON
   */
  exportAsJson(): string {
    const report = this.generateReport()
    return JSON.stringify(report, null, 2)
  }

  /**
   * Reset slow operations history
   */
  resetSlowOperations(): void {
    this.slowOperations = []
  }

  /**
   * Get number of errors
   */
  getErrorCount(): number {
    return this.logger.getLogsByLevel(LogLevel.ERROR).length
  }

  /**
   * Get number of warnings
   */
  getWarningCount(): number {
    return this.logger.getLogsByLevel(LogLevel.WARN).length
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Singleton Instances
// ─────────────────────────────────────────────────────────────────────────

let globalLogger: DiagnosticLogger | null = null
let globalDiagnostics: DiagnosticsManager | null = null

export function getLogger(): DiagnosticLogger {
  if (!globalLogger) {
    globalLogger = new DiagnosticLogger()
  }
  return globalLogger
}

export function getDiagnostics(): DiagnosticsManager {
  if (!globalDiagnostics) {
    globalDiagnostics = new DiagnosticsManager(getLogger())
  }
  return globalDiagnostics
}

export function resetLoggers(): void {
  if (globalLogger) {
    globalLogger.clearLogs()
    globalLogger = null
  }
  if (globalDiagnostics) {
    globalDiagnostics.resetSlowOperations()
    globalDiagnostics = null
  }
}
