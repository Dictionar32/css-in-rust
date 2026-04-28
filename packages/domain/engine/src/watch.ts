/**
 * watch.ts — File system watcher for tailwind-styled-v4.
 *
 * Native-only: uses Rust `notify`-based watcher via NAPI
 * (`start_watch` / `poll_watch_events` / `stop_watch` from watch_api.rs).
 *
 * Polling interval: 200ms (configurable via `pollIntervalMs`).
 */

// Lazy-load native binding
let _native: {
  startWatch?: (rootDir: string) => { status: string; handleId: number }
  pollWatchEvents?: (handleId: number) => Array<{ kind: string; path: string }>
  stopWatch?: (handleId: number) => boolean
} | null = null

function getNativeWatcher() {
  if (_native !== null) return _native
  try {
    const { resolveNativeBinary } = require("@tailwind-styled/shared")
    const { path: binPath } = resolveNativeBinary(__dirname)
    if (binPath) {
      _native = require(binPath)
    }
  } catch {
    _native = {}
  }
  return _native
}

export interface WatcherOptions {
  /** Delay before emitting change event to reduce noisy bursts (applied in Rust layer). */
  debounceMs?: number
  /** Polling interval in ms for the Rust native watcher (default: 200). */
  pollIntervalMs?: number
  onError?: (error: Error, directory: string) => void
}

export interface WatcherEvent {
  type: "change" | "unlink"
  filePath: string
}

export interface WorkspaceWatcher {
  close(): void
}

// ─────────────────────────────────────────────────────────────────────────────
// Native Rust watcher (notify v6)
// ─────────────────────────────────────────────────────────────────────────────

function watchWorkspaceNative(
  rootDir: string,
  onEvent: (event: WatcherEvent) => void,
  options: WatcherOptions
): WorkspaceWatcher | null {
  const native = getNativeWatcher()
  if (!native?.startWatch || !native?.pollWatchEvents || !native?.stopWatch) {
    return null
  }

  const result = native.startWatch(rootDir)
  if (!result || result.status !== "ok") {
    return null
  }

  const { handleId } = result
  const pollMs = options.pollIntervalMs ?? 200
  const pending = new Map<string, { event: WatcherEvent; timer: NodeJS.Timeout }>()
  const debounceMs = options.debounceMs ?? 100

  function enqueue(event: WatcherEvent) {
    const key = `${event.type}:${event.filePath}`
    const existing = pending.get(key)
    if (existing) clearTimeout(existing.timer)
    const timer = setTimeout(() => {
      pending.delete(key)
      onEvent(event)
    }, debounceMs)
    pending.set(key, { event, timer })
  }

  const intervalId = setInterval(() => {
    try {
      const events = native.pollWatchEvents!(handleId)
      for (const ev of events) {
        const type: WatcherEvent["type"] = ev.kind === "unlink" ? "unlink" : "change"
        enqueue({ type, filePath: ev.path })
      }
    } catch (err) {
      options.onError?.(
        err instanceof Error ? err : new Error(String(err)),
        rootDir
      )
    }
  }, pollMs)

  return {
    close() {
      clearInterval(intervalId)
      for (const { timer } of pending.values()) clearTimeout(timer)
      pending.clear()
      try {
        native.stopWatch!(handleId)
      } catch {
        // ignore
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — native-only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * watchWorkspace — watches `rootDir` recursively for file changes.
 *
 * Requires native Rust watcher. Throws if native binding unavailable.
 */
export function watchWorkspace(
  rootDir: string,
  onEvent: (event: WatcherEvent) => void,
  options: WatcherOptions = {}
): WorkspaceWatcher {
  const nativeWatcher = watchWorkspaceNative(rootDir, onEvent, options)
  if (!nativeWatcher) {
    throw new Error("FATAL: Native watcher is required but not available. Build the native module: npm run build:rust")
  }
  return nativeWatcher
}