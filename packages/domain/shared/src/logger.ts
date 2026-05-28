/**
 * Centralized logger — replaces scattered console.log/warn/error calls
 * across packages.
 *
 * Mendukung file output ke `.next/tw-classes/_tw-build.log` via `setLogFile()`.
 */
import fs from "node:fs"
import path from "node:path"

export type LogLevel = "silent" | "error" | "warn" | "info" | "debug"

const LEVELS: Record<LogLevel, number> = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 }

function getEnvLevel(): LogLevel {
  const env = process.env.TWS_LOG_LEVEL?.toLowerCase()
  if (env && env in LEVELS) return env as LogLevel
  return process.env.TWS_DEBUG_SCANNER === "1" ? "debug" : "info"
}

export interface Logger {
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  info(...args: unknown[]): void
  debug(...args: unknown[]): void
  setLevel(level: LogLevel): void
  setLogFile(filePath: string): void
}

// Global log file path — diset dari withTailwindStyled.ts saat startup
let _globalLogFile: string | null = null
let _logFileInitialized = false

export function setGlobalLogFile(filePath: string): void {
  _globalLogFile = filePath
  _logFileInitialized = false
  // Buat/reset file saat pertama kali di-set (tiap dev server start)
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(
      filePath,
      `# tailwind-styled build log — ${new Date().toISOString()}\n`,
      "utf-8"
    )
    _logFileInitialized = true
  } catch { /* non-fatal */ }
}

function writeToFile(line: string): void {
  if (!_globalLogFile || !_logFileInitialized) return
  try {
    fs.appendFileSync(_globalLogFile, line)
  } catch { /* non-fatal */ }
}

export function createLogger(prefix: string, level?: LogLevel): Logger {
  const loggerState = {
    currentLevel: level ?? getEnvLevel(),
    setLevel(l: LogLevel) {
      this.currentLevel = l
    },
  }

  const log = (msgLevel: LogLevel, stream: "stdout" | "stderr", args: unknown[]) => {
    if (LEVELS[msgLevel] > LEVELS[loggerState.currentLevel]) return
    const line = `[${prefix}] ${args.map(String).join(" ")}\n`
    process[stream].write(line)
    writeToFile(line)
  }

  return {
    error: (...a) => log("error", "stderr", a),
    warn: (...a) => log("warn", "stderr", a),
    info: (...a) => log("info", "stdout", a),
    debug: (...a) => log("debug", "stderr", a),
    setLevel: loggerState.setLevel,
    setLogFile: (filePath: string) => setGlobalLogFile(filePath),
  }
}

export const logger = createLogger("tailwind-styled")