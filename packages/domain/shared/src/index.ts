import { createHash } from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

// Native-only: Node.js is always available. No browser fallback.

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TokenMap = Record<string, string>

export type VariantValue = string | number | boolean | undefined

export type VariantProps = Record<string, VariantValue>

export type HtmlTagName = keyof HTMLElementTagNameMap

export type CompoundCondition = Record<string, string | number | boolean>

export type VariantMatrix = Record<string, Array<string | number | boolean>>

// ─────────────────────────────────────────────────────────────────────────────
// Logging
// ─────────────────────────────────────────────────────────────────────────────

export interface Logger {
  warn(...args: unknown[]): void
  debug(...args: unknown[]): void
  error(...args: unknown[]): void
  log(...args: unknown[]): void
}

export function createLogger(namespace: string): Logger {
  const prefix = `[${namespace}]`
  return {
    warn(...args: unknown[]) {
      process.stderr.write(`${prefix} ${args.map(a => typeof a === "string" ? a : String(a)).join(" ")}\n`)
    },
    debug(...args: unknown[]) {
      process.stderr.write(`${prefix} ${args.map(a => typeof a === "string" ? a : String(a)).join(" ")}\n`)
    },
    error(...args: unknown[]) {
      process.stderr.write(`${prefix} ${args.map(a => typeof a === "string" ? a : String(a)).join(" ")}\n`)
    },
    log(...args: unknown[]) {
      process.stderr.write(`${prefix} ${args.map(a => typeof a === "string" ? a : String(a)).join(" ")}\n`)
    },
  }
}

export function createDebugLogger(namespace: string, label?: string): (msg: string) => void {
  const prefix = label ? `[${namespace}:${label}]` : `[${namespace}]`
  return (msg: string) => {
    if (process.env.DEBUG?.includes(namespace) || process.env.TW_DEBUG) {
      console.debug(prefix, msg)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────────────────────────────────────

export type ErrorSource = "rust" | "validation" | "compile" | "io" | "config" | "unknown"

type ZodLikeIssue = {
  path?: readonly PropertyKey[]
  message?: string
}

function formatIssuePath(path?: readonly PropertyKey[]): string {
  if (!path || path.length === 0) return "(root)"
  return path
    .map((segment) =>
      typeof segment === "symbol" ? segment.description ?? segment.toString() : String(segment)
    )
    .join(".")
}

export class TwError extends Error {
  /** @deprecated Gunakan source */
  public readonly domain: string
  public readonly source: ErrorSource
  public readonly code: string
  public readonly originalCause?: unknown

  constructor(domainOrSource: string, code: string, message: string, cause?: unknown) {
    super(message)
    this.name = "TwError"
    this.domain = domainOrSource
    this.source = domainOrSource as ErrorSource
    this.code = code
    this.originalCause = cause
    if (Error.captureStackTrace) Error.captureStackTrace(this, TwError)
  }

  static fromIo(code: string, message: string): TwError {
    return new TwError("io", code, message)
  }

  static fromCompile(code: string, message: string): TwError {
    return new TwError("compile", code, message)
  }

  static fromRust(err: { code?: string; message?: string } | Error | unknown): TwError {
    if (err instanceof TwError) return err
    if (err instanceof Error) return new TwError("rust", "RUST_ERROR", err.message, err)
    if (err && typeof err === "object") {
      const e = err as { code?: string; message?: string }
      return new TwError("rust", e.code ?? "RUST_ERROR", e.message ?? String(err), err)
    }
    return new TwError("rust", "RUST_ERROR", String(err), err)
  }

  /** Buat TwError dari ZodError — dukung shape Zod v3 (`errors`) dan v4 (`issues`). */
  static fromZod(err: { issues?: ZodLikeIssue[]; errors?: ZodLikeIssue[] }): TwError {
    const first = err.issues?.[0] ?? err.errors?.[0]
    const path = formatIssuePath(first?.path)
    const message = first ? `${path}: ${first.message}` : "Schema validation failed"
    return new TwError("validation", "SCHEMA_VALIDATION_FAILED", message, err)
  }

  static wrap(source: string, code: string, err: unknown): TwError {
    if (err instanceof TwError) return err
    if (err instanceof Error) return new TwError(source, code, err.message, err)
    return new TwError(source, code, String(err), err)
  }

  override toString(): string {
    return `TwError [${this.source}:${this.code}] ${this.message}`
  }

  toJSON(): { name: string; source: string; code: string; message: string } {
    return { name: this.name, source: this.source, code: this.code, message: this.message }
  }

  toCliMessage(): string {
    return `[${this.source.toUpperCase()}:${this.code}] ${this.message}`
  }
}

export function wrapUnknownError(domain: string, code: string, error: unknown): TwError {
  return TwError.wrap(domain, code, error)
}

export function isTwError(err: unknown): err is TwError {
  return err instanceof TwError
}

// ─────────────────────────────────────────────────────────────────────────────
// Native binding resolution
// ─────────────────────────────────────────────────────────────────────────────

export interface LoadNativeBindingOptions<T> {
  runtimeDir: string
  candidates: string[]
  isValid: (module: unknown) => module is T
  invalidExportMessage: string
}

export interface LoadNativeBindingResult<T> {
  binding: T | null
  loadErrors: Array<{ path: string; message: string }>
  loadedPath?: string
}

export function loadNativeBinding<T>(options: LoadNativeBindingOptions<T>): LoadNativeBindingResult<T> {
  const { runtimeDir, candidates, isValid } = options
  const loadErrors: Array<{ path: string; message: string }> = []

  for (const candidate of candidates) {
    const candidatePath = path.resolve(runtimeDir, candidate)
    try {
      if (!fs.existsSync(candidatePath) && !fs.existsSync(candidatePath + ".node")) {
        continue
      }
      const mod = requireNativeModule(candidatePath)
      if (mod && isValid(mod)) {
        return { binding: mod, loadErrors, loadedPath: candidatePath }
      }
      loadErrors.push({ path: candidatePath, message: options.invalidExportMessage })
    } catch (e) {
      loadErrors.push({ path: candidatePath, message: e instanceof Error ? e.message : String(e) })
    }
  }

  return { binding: null, loadErrors }
}

const _require = createRequire(import.meta.url)

function requireNativeModule(p: string): unknown {
  return _require(p)
}

export interface ResolveCandidatesOptions {
  runtimeDir: string
  envVarNames?: string[]
  includeDefaultCandidates?: boolean
  enforceNodeExtensionForEnvPath?: boolean
}

export function resolveNativeBindingCandidates(options: ResolveCandidatesOptions): string[] {
  const { runtimeDir, envVarNames = [], includeDefaultCandidates = true, enforceNodeExtensionForEnvPath = false } = options
  const candidates: string[] = []

  for (const envVar of envVarNames) {
    const envPath = process.env[envVar]
    if (envPath) {
      candidates.push(enforceNodeExtensionForEnvPath && !envPath.endsWith(".node") ? envPath + ".node" : envPath)
    }
  }

  if (!includeDefaultCandidates) return candidates

  if (fs.existsSync(runtimeDir)) {
    try {
      for (const entry of fs.readdirSync(runtimeDir)) {
        if (entry.endsWith(".node")) candidates.push(entry)
      }
    } catch { /* ignore read errors */ }
  }

  const ext = process.platform === "win32" ? ".dll" : process.platform === "darwin" ? ".dylib" : ".so"
  const defaultBindingName = `tailwind_styled_parser${ext}`
  candidates.push(path.resolve(runtimeDir, "..", "..", "..", "native", defaultBindingName))
  candidates.push(path.resolve(runtimeDir, "..", "..", "..", "..", "native", defaultBindingName))
  candidates.push(path.resolve(process.cwd(), "native", defaultBindingName))

  return Array.from(new Set(candidates))
}

export function resolveRuntimeDir(dir: string | undefined, importMetaUrl: string): string {
  if (dir) return path.resolve(dir)
  try {
    return path.dirname(fileURLToPath(importMetaUrl))
  } catch {
    return process.cwd()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hashing
// ─────────────────────────────────────────────────────────────────────────────

export function hashContent(content: string, algorithm: string = "md5", length?: number): string {
  const hash = createHash(algorithm).update(content).digest("hex")
  return length ? hash.slice(0, length) : hash
}

// ─────────────────────────────────────────────────────────────────────────────
// Error formatting
// ─────────────────────────────────────────────────────────────────────────────

export function formatErrorMessage(error: unknown): string {
  if (error instanceof TwError) return error.toString()
  if (error instanceof Error) return error.message
  return String(error)
}

// ─────────────────────────────────────────────────────────────────────────────
// LRU Cache
// ─────────────────────────────────────────────────────────────────────────────

export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>

  constructor(capacity: number) {
    this.capacity = capacity
    this.cache = new Map()
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined
    const value = this.cache.get(key)!
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  clear(): void {
    this.cache.clear()
  }

  entries(): IterableIterator<[K, V]> {
    return this.cache.entries()
  }

  get size(): number {
    return this.cache.size
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Trace Utilities
// ─────────────────────────────────────────────────────────────────────────────

export type { TraceSnapshot, TraceSummary } from "./trace"
export {
  getHealthColor,
  getModeColor,
  formatMemory,
  formatDuration,
  calculateHealth,
  getBuildTimeColor,
  getMemoryColor,
  createTraceSnapshot,
  getPipelinePercentages,
} from "./trace"

// ─────────────────────────────────────────────────────────────────────────────
// Performance Telemetry
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// Error Codes
// ─────────────────────────────────────────────────────────────────────────────

export type { ErrorCode } from "./error-codes"
export { ERROR_CODES, getSuggestion, formatErrorCode } from "./error-codes"

// ─────────────────────────────────────────────────────────────────────────────
// Tailwind Compatibility
// ─────────────────────────────────────────────────────────────────────────────

export type { TailwindInfo } from "./compatibility"
export { detectTailwind, assertTailwindV4, getTailwindVersion, isTailwindV4 } from "./compatibility"

// ── Native binding schemas (Zod boundary validation)
export {
  NativeScanFileSchema, NativeScanResultSchema,
  NativeAnalyzerReportSchema, NativeTransformResultSchema,
  NativeCssCompileResultSchema, NativeWatchResultSchema,
  NativeCacheEntrySchema, NativeCacheReadResultSchema,
  safeParseNative, parseNative,
} from './native-schemas'

// ── ESM-safe runtime helpers ──────────────────────────────────────────────
export {
  createEsmRequire,
  getDirname,
  getFilename,
  resolveFromRoot,
  tryRequire,
  resolveNativeNodePath,
} from "./esmHelpers"

// ── Performance telemetry ────────────────────────────────────────────────────
export {
  TelemetryCollector,
  getGlobalTelemetry,
  resetGlobalTelemetry,
  createBuildTimer,
  type BuildTelemetry,
  type TelemetrySummary,
  type BuildPhases,
} from "./telemetry"

// ── Config/JSON schema validation ─────────────────────────────────────────────
export {
  ScanCacheSchema,
  ScanCacheClassEntrySchema,
  TailwindConfigSchema,
  RegistryPluginEntrySchema,
  RegistryFileSchema,
  PackageJsonSchema,
  parseJsonWithSchema,
  parseJsonFileWithSchema,
  type ScanCache,
  type ScanCacheClassEntry,
  type TailwindConfig,
  type RegistryPluginEntry,
  type RegistryFile,
  type PackageJson,
} from "./configSchemas"

// ── Worker/bootstrap path resolution ─────────────────────────────────────────
export {
  resolveWorkerPath,
  resolveLoaderPath,
  type WorkerPathOptions,
  type WorkerPathResult,
} from "./workerResolver"

// ── Codegen helpers ───────────────────────────────────────────────────────────
export {
  generateComponentCode,
  generateStorybookStory,
  generateClassRenameCodemod,
  generateBarrelFile,
  type ComponentCodegenOptions,
} from "./codegen"

// ── Native binary resolution (QA #1) ─────────────────────────────────────────
export {
  resolveNativeBinary,
  formatNativeNotFoundError,
  type NativeResolutionResult,
} from "./native-resolution"

// ── Shared observability contract ────────────────────────────────────────────
export {
  createObservabilityClient,
  type ClassInspection,
  type ClassProperty,
  type ClassUsageLocation,
  type BuildTrace,
  type BuildPhaseTrace,
  type DashboardMetrics,
  type DashboardSummary,
  type ObservabilityClient,
} from "./observability"