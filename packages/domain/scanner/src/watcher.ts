/**
 * Scanner watcher — incremental file watching untuk tailwind-styled-v4.
 * QA #12: Scan ulang HANYA file yang berubah, bukan seluruh workspace.
 *
 * Strategy: native-first, JS fallback.
 *
 * Native path (preferred):
 *   - `startWatchNative(rootDir)` → Rust `notify` crate, cross-platform, reliable
 *   - `setInterval` → poll `pollWatchEventsNative(handleId)` setiap `pollIntervalMs`
 *   - Debounce di TS side sebelum trigger scan
 *   - `stopWatchNative(handleId)` on close
 *
 * JS fallback (jika native binary tidak tersedia):
 *   - `fs.watch(rootDir, { recursive: true })` — Node.js built-in
 *   - Debounce + incremental scan sama persis
 *
 * Public API (WatchOptions / WatchHandle) identik di kedua path — drop-in.
 */
import fs from "node:fs"
import path from "node:path"
import type { ScanWorkspaceResult, ScanFileResult } from "./types"
import { scanFile, isScannableFile, DEFAULT_EXTENSIONS, DEFAULT_IGNORES } from "./index"
import {
  startWatchNative,
  pollWatchEventsNative,
  stopWatchNative,
  hasNativeWatchBinding,
} from "./native-bridge"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface WatchOptions {
  rootDir: string
  extensions?: string[]
  ignoreDirs?: string[]
  /** Debounce window sebelum onChange dipanggil. Default: 150ms */
  debounceMs?: number
  /**
   * Interval poll ke native queue (hanya dipakai saat native path aktif).
   * Harus <= debounceMs agar debounce efektif. Default: 50ms
   */
  pollIntervalMs?: number
  onChange?: (changedFiles: string[], result: Partial<ScanWorkspaceResult>) => void
  onError?: (err: Error) => void
}

export interface WatchHandle {
  close(): void
  getLastResult(): Partial<ScanWorkspaceResult>
  /** true jika menggunakan native Rust watcher, false jika JS fallback */
  readonly isNative: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared incremental scan logic
// ─────────────────────────────────────────────────────────────────────────────

interface IncrementalState {
  fileCache: Map<string, ScanFileResult>
  allClasses: Set<string>
}

function createIncrementalState(): IncrementalState {
  return {
    fileCache: new Map(),
    allClasses: new Set(),
  }
}

function shouldIgnoreFile(
  filepath: string,
  rootDir: string,
  ignoreDirs: string[]
): boolean {
  const rel = path.relative(rootDir, filepath)
  return ignoreDirs.some((d) => rel.startsWith(d + path.sep) || rel === d)
}

function processChangedFiles(
  changedPaths: string[],
  state: IncrementalState,
  rootDir: string,
  extensions: string[],
  ignoreDirs: string[],
  onChange: WatchOptions["onChange"],
  onError: WatchOptions["onError"]
): void {
  const scannable = changedPaths.filter(
    (f) => isScannableFile(f, extensions) && !shouldIgnoreFile(f, rootDir, ignoreDirs)
  )
  if (scannable.length === 0) return

  for (const filepath of scannable) {
    const prev = state.fileCache.get(filepath)
    if (prev) {
      for (const cls of prev.classes) {
        let stillUsed = false
        for (const [fp, res] of state.fileCache) {
          if (fp !== filepath && res.classes.includes(cls)) {
            stillUsed = true
            break
          }
        }
        if (!stillUsed) state.allClasses.delete(cls)
      }
    }
  }

  const updated: ScanFileResult[] = []
  for (const filepath of scannable) {
    try {
      if (!fs.existsSync(filepath)) {
        state.fileCache.delete(filepath)
        continue
      }
      const result = scanFile(filepath)
      state.fileCache.set(filepath, result)
      for (const cls of result.classes) state.allClasses.add(cls)
      updated.push(result)
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  if (onChange && updated.length > 0) {
    onChange(scannable, {
      files: Array.from(state.fileCache.values()),
      totalFiles: state.fileCache.size,
      uniqueClasses: Array.from(state.allClasses).sort(),
    })
  }
}

function buildLastResult(state: IncrementalState): Partial<ScanWorkspaceResult> {
  return {
    files: Array.from(state.fileCache.values()),
    totalFiles: state.fileCache.size,
    uniqueClasses: Array.from(state.allClasses).sort(),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Native watcher (Rust notify crate via NAPI)
// ─────────────────────────────────────────────────────────────────────────────

function startNativeWatcher(
  rootDir: string,
  extensions: string[],
  ignoreDirs: string[],
  debounceMs: number,
  pollIntervalMs: number,
  onChange: WatchOptions["onChange"],
  onError: WatchOptions["onError"]
): WatchHandle | null {
  const result = startWatchNative(rootDir)
  if (!result || result.status !== "ok") return null

  const { handleId } = result
  const state = createIncrementalState()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const pendingPaths = new Set<string>()

  function flushPending(): void {
    const paths = Array.from(pendingPaths)
    pendingPaths.clear()
    processChangedFiles(paths, state, rootDir, extensions, ignoreDirs, onChange, onError)
  }

  const pollInterval = setInterval(() => {
    const events = pollWatchEventsNative(handleId)
    if (events.length === 0) return

    for (const ev of events) {
      if (ev.path) pendingPaths.add(ev.path)
    }

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(flushPending, debounceMs)
  }, pollIntervalMs)

  return {
    isNative: true,
    close(): void {
      clearInterval(pollInterval)
      if (debounceTimer) clearTimeout(debounceTimer)
      stopWatchNative(handleId)
    },
    getLastResult(): Partial<ScanWorkspaceResult> {
      return buildLastResult(state)
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JS fallback watcher (fs.watch)
// ─────────────────────────────────────────────────────────────────────────────

function startJsFallbackWatcher(
  rootDir: string,
  extensions: string[],
  ignoreDirs: string[],
  debounceMs: number,
  onChange: WatchOptions["onChange"],
  onError: WatchOptions["onError"]
): WatchHandle {
  const state = createIncrementalState()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const pendingChanges = new Set<string>()

  function processChanges(): void {
    const changed = Array.from(pendingChanges)
    pendingChanges.clear()
    processChangedFiles(changed, state, rootDir, extensions, ignoreDirs, onChange, onError)
  }

  function onFsEvent(_event: string, filename: string | null): void {
    if (!filename) return
    const filepath = path.resolve(rootDir, filename)
    pendingChanges.add(filepath)

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(processChanges, debounceMs)
  }

  let watcher: fs.FSWatcher | null = null
  try {
    watcher = fs.watch(rootDir, { recursive: true }, onFsEvent)
    watcher.on("error", (err) => onError?.(err))
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)))
  }

  return {
    isNative: false,
    close(): void {
      if (debounceTimer) clearTimeout(debounceTimer)
      watcher?.close()
    },
    getLastResult(): Partial<ScanWorkspaceResult> {
      return buildLastResult(state)
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Start incremental watcher pada sebuah direktori.
 *
 * Menggunakan Rust native watcher (notify crate) jika binary tersedia —
 * lebih reliable dan cross-platform dibanding fs.watch. Fallback otomatis
 * ke fs.watch Node.js jika native tidak tersedia.
 *
 * @example
 * const handle = watchScanner({
 *   rootDir: "./src",
 *   debounceMs: 150,
 *   onChange(changedFiles, result) {
 *     console.log("Native:", handle.isNative)
 *     console.log("Changed:", changedFiles)
 *     console.log("Updated classes:", result.uniqueClasses)
 *   },
 * })
 *
 * // Later:
 * handle.close()
 */
export function watchScanner(opts: WatchOptions): WatchHandle {
  const extensions = opts.extensions ?? DEFAULT_EXTENSIONS
  const ignoreDirs = opts.ignoreDirs ?? DEFAULT_IGNORES
  const debounceMs = opts.debounceMs ?? 150
  const pollIntervalMs = opts.pollIntervalMs ?? 50

  // Native-first
  if (hasNativeWatchBinding()) {
    const handle = startNativeWatcher(
      opts.rootDir,
      extensions,
      ignoreDirs,
      debounceMs,
      pollIntervalMs,
      opts.onChange,
      opts.onError
    )
    if (handle) return handle
  }

  // JS fallback
  return startJsFallbackWatcher(
    opts.rootDir,
    extensions,
    ignoreDirs,
    debounceMs,
    opts.onChange,
    opts.onError
  )
}