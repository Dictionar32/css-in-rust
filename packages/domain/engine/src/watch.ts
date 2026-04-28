/**
 * watch.ts — File system watcher for tailwind-styled-v4.
 *
 * Native-first: delegates ke Rust `notify`-based watcher via NAPI
 * (`start_watch` / `poll_watch_events` / `stop_watch` dari watch_api.rs).
 *
 * JS fallback: Node.js `fs.watch` (cross-platform, tapi lebih banyak syscalls
 * dan kurang reliable di beberapa environment).
 *
 * Polling interval: 200ms (configurable via `pollIntervalMs`).
 */

import fs from "node:fs"
import path from "node:path"

// Lazy-load native binding — engine package bisa dipakai tanpa native (test env)
let _native: {
  startWatch?: (rootDir: string) => { status: string; handleId: number }
  pollWatchEvents?: (handleId: number) => Array<{ kind: string; path: string }>
  stopWatch?: (handleId: number) => boolean
} | null = null

function getNativeWatcher() {
  if (_native !== null) return _native
  try {
    // Shared binding resolver dari @tailwind-styled/shared
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
  ignoreDirectories?: string[]
  /** Delay before emitting change event to reduce noisy bursts (JS fallback only). */
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

const DEFAULT_IGNORES = ["node_modules", ".git", ".next", "dist", "out", ".turbo", ".cache"]

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
  // Pending dedup map (key → last event) for debounce at JS layer
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
// JS fallback watcher (Node.js fs.watch)
// ─────────────────────────────────────────────────────────────────────────────

function watchWorkspaceJS(
  rootDir: string,
  onEvent: (event: WatcherEvent) => void,
  options: WatcherOptions
): WorkspaceWatcher {
  const ignoreDirectories = new Set(options.ignoreDirectories ?? DEFAULT_IGNORES)
  const watchers = new Map<string, fs.FSWatcher>()
  const restartTimers = new Map<string, NodeJS.Timeout>()
  const debounceMs = options.debounceMs ?? 100
  const pending = new Map<string, NodeJS.Timeout>()

  const shouldIgnore = (targetPath: string): boolean => {
    const parts = targetPath.split(path.sep)
    return parts.some((part) => ignoreDirectories.has(part))
  }

  const enqueue = (event: WatcherEvent): void => {
    const key = `${event.type}:${event.filePath}`
    const existing = pending.get(key)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      pending.delete(key)
      onEvent(event)
    }, debounceMs)
    pending.set(key, timer)
  }

  const safeUnwatch = (dir: string): void => {
    const watcher = watchers.get(dir)
    if (!watcher) return
    try { watcher.close() } catch { /* ignore */ }
    watchers.delete(dir)
  }

  const scheduleRestart = (dir: string): void => {
    const previous = restartTimers.get(dir)
    if (previous) clearTimeout(previous)
    const timer = setTimeout(() => {
      restartTimers.delete(dir)
      watchDir(dir)
    }, 250)
    restartTimers.set(dir, timer)
  }

  const watchDir = (dir: string): void => {
    if (watchers.has(dir) || shouldIgnore(dir) || !fs.existsSync(dir)) return
    try {
      const stat = fs.lstatSync(dir)
      if (!stat.isDirectory() || stat.isSymbolicLink()) return
    } catch { return }

    const watcher = fs.watch(dir, { persistent: true }, (_eventType, fileName) => {
      if (!fileName) return
      const fullPath = path.join(dir, fileName.toString())
      if (shouldIgnore(fullPath)) return
      if (fs.existsSync(fullPath)) {
        try {
          const stat = fs.lstatSync(fullPath)
          if (stat.isSymbolicLink()) return
          if (stat.isDirectory()) { watchDir(fullPath); return }
          enqueue({ type: "change", filePath: fullPath })
          return
        } catch { /* ignore transient fs errors */ }
      }
      enqueue({ type: "unlink", filePath: fullPath })
    })

    watcher.on("error", (error) => {
      safeUnwatch(dir)
      options.onError?.(error instanceof Error ? error : new Error(String(error)), dir)
      scheduleRestart(dir)
    })

    watchers.set(dir, watcher)
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      watchDir(path.join(dir, entry.name))
    }
  }

  watchDir(path.resolve(rootDir))

  return {
    close() {
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
      for (const timer of restartTimers.values()) clearTimeout(timer)
      restartTimers.clear()
      for (const watcher of watchers.values()) watcher.close()
      watchers.clear()
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — native-first
// ─────────────────────────────────────────────────────────────────────────────

/**
 * watchWorkspace — watches `rootDir` recursively for file changes.
 *
 * Attempts to use the Rust notify-based watcher first (more efficient,
 * cross-platform, fewer syscalls). Falls back to Node.js `fs.watch` if
 * the native binding is unavailable.
 */
export function watchWorkspace(
  rootDir: string,
  onEvent: (event: WatcherEvent) => void,
  options: WatcherOptions = {}
): WorkspaceWatcher {
  const native = watchWorkspaceNative(rootDir, onEvent, options)
  if (native) return native

  // JS fallback
  return watchWorkspaceJS(rootDir, onEvent, options)
}