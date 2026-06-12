/**
 * Simple Logger Utility
 *
 * Minimal logging untuk RedisManager dan utilities lainnya
 * Respect NODE_ENV dan TWS_LOG_LEVEL environment variables
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LoggerConfig {
  prefix?: string
  level?: LogLevel
}

class Logger {
  private prefix: string
  private level: LogLevel

  constructor(config?: LoggerConfig) {
    this.prefix = config?.prefix || 'CSS-Compiler'

    // Determine log level dari env var atau config
    const envLevel = process.env.TWS_LOG_LEVEL as LogLevel | undefined
    this.level = config?.level || envLevel || 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    }
    return levels[level] <= levels[this.level]
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${this.prefix}:${level.toUpperCase()}]`

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`
    }
    return `${prefix} ${message}`
  }

  error(message: string, data?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data))
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data))
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data))
    }
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data))
    }
  }
}

// Export singleton logger instance
export const createLogger = (config?: LoggerConfig) => new Logger(config)
export const logger = new Logger({ prefix: 'CSS-Compiler' })

export default Logger
