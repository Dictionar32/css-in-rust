import pc from "picocolors"

import type { CliOutput } from "./output"

export interface CliLogger {
  ok: (message: string) => void
  skip: (message: string) => void
  warn: (message: string) => void
  info: (message: string) => void
  dry: (message: string) => void
}

export type CliLogLevel = "ok" | "skip" | "warn" | "info" | "dry"

export interface CliLogEvent {
  level: CliLogLevel
  message: string
}

export interface CreateCliLoggerOptions {
  silent?: boolean
  useStderr?: boolean
  onEvent?: (event: CliLogEvent) => void
  output?: CliOutput
}

export function createCliLogger(options: CreateCliLoggerOptions = {}): CliLogger {
  function emit(level: CliLogLevel, icon: string, colorize: (s: string) => string, message: string): void {
    options.onEvent?.({ level, message })
    if (options.silent) return

    const line = `    ${colorize(icon)} ${message}`

    if (options.output) {
      options.output.writeText(line, { stderr: options.useStderr })
      return
    }

    const writeLine = options.useStderr ? console.error : console.log
    writeLine(line)
  }

  return {
    ok(message: string) {
      emit("ok", "✓", pc.green, pc.dim(message))
    },
    skip(message: string) {
      emit("skip", "–", pc.dim, pc.dim(message))
    },
    warn(message: string) {
      emit("warn", "⚠", pc.yellow, message)
    },
    info(message: string) {
      emit("info", "→", pc.cyan, pc.dim(message))
    },
    dry(message: string) {
      emit("dry", "○", pc.cyan, pc.dim(`[dry] ${message}`))
    },
  }
}
