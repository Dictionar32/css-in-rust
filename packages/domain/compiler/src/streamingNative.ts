/**
 * streamingNative.ts
 *
 * Phase 5.1: Streaming & Incremental Processing - Handle file changes efficiently
 * Exposes 8 functions for real-time incremental compilation
 */

import { getNativeBridge } from "./nativeBridge"

/**
 * File change notification
 */
export interface FileChangeEvent {
  file_path: string
  event_type: "added" | "modified" | "deleted"
  old_content?: string
  new_content?: string
  timestamp_ms: number
}

/**
 * Processed file change result
 */
export interface ProcessedFileChange {
  file_path: string
  status: "processed" | "skipped" | "error"
  old_classes: string[]
  new_classes: string[]
  added_classes: string[]
  removed_classes: string[]
  changed: boolean
  fingerprint: string
  error?: string
}

/**
 * Diff between two scan results
 */
export interface FileDiff {
  added_files: string[]
  removed_files: string[]
  modified_files: string[]
  added_classes: string[]
  removed_classes: string[]
  total_changes: number
}

/**
 * File fingerprint for change detection
 */
export interface FileFingerprint {
  file_path: string
  content_hash: string
  size_bytes: number
  mtime_ms: number
  class_hash: string
  signature: string
}

/**
 * Incremental diff result
 */
export interface IncrementalDiffResult {
  is_changed: boolean
  changes_count: number
  diff: FileDiff
  processing_time_ms: number
}

/**
 * State injection result
 */
export interface StateInjectionResult {
  injected: boolean
  state_hash: string
  affected_files: number
  total_injected_bytes: number
}

/**
 * Stale entry pruning result
 */
export interface PruneResult {
  entries_before: number
  entries_after: number
  entries_removed: number
  freed_bytes: number
}

/**
 * Rebuilt workspace result
 */
export interface RebuildWorkspaceResult {
  total_files_scanned: number
  total_classes_found: number
  unique_classes: number
  build_time_ms: number
  files_with_changes: number
}

/**
 * Process a single file change event
 * Called when a file is added, modified, or deleted
 *
 * @param fileChangeJson - JSON string describing the file change
 * @returns Processing result with class changes
 *
 * @example
 * ```ts
 * const change = processFileChange(JSON.stringify({
 *   file_path: 'src/Button.tsx',
 *   event_type: 'modified',
 *   new_content: 'export const Button = ...',
 *   timestamp_ms: Date.now()
 * }))
 *
 * console.log('Added classes:', change.added_classes)
 * console.log('Removed classes:', change.removed_classes)
 * ```
 */
export function processFileChange(fileChangeJson: string): ProcessedFileChange {
  const native = getNativeBridge()
  if (!native?.process_file_change) throw new Error("process_file_change not available")
  const resultJson = native.process_file_change(fileChangeJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      file_path: "",
      status: "error",
      old_classes: [],
      new_classes: [],
      added_classes: [],
      removed_classes: [],
      changed: false,
      fingerprint: "",
      error: "Failed to parse result",
    }
  }
}

/**
 * Compute incremental diff between old and new scan results
 * Efficient way to identify only what changed
 *
 * @param oldScanJson - JSON string of previous scan result
 * @param newScanJson - JSON string of new scan result
 * @returns Diff showing what changed
 *
 * @example
 * ```ts
 * const oldResult = scanWorkspace('./src')
 * // ... files changed ...
 * const newResult = scanWorkspace('./src')
 *
 * const diff = computeIncrementalDiff(
 *   JSON.stringify(oldResult),
 *   JSON.stringify(newResult)
 * )
 *
 * if (diff.is_changed) {
 *   console.log(`${diff.changes_count} files changed`)
 *   console.log('Added:', diff.diff.added_classes)
 *   console.log('Removed:', diff.diff.removed_classes)
 * }
 * ```
 */
export function computeIncrementalDiff(
  oldScanJson: string,
  newScanJson: string
): IncrementalDiffResult {
  const native = getNativeBridge()
  if (!native?.compute_incremental_diff)
    throw new Error("compute_incremental_diff not available")
  const resultJson = native.compute_incremental_diff(oldScanJson, newScanJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      is_changed: false,
      changes_count: 0,
      diff: {
        added_files: [],
        removed_files: [],
        modified_files: [],
        added_classes: [],
        removed_classes: [],
        total_changes: 0,
      },
      processing_time_ms: 0,
    }
  }
}

/**
 * Create a fingerprint of a file for change detection
 * Use fingerprints to quickly check if file needs reprocessing
 *
 * @param filePath - Path to file
 * @param fileContent - File content
 * @returns File fingerprint
 *
 * @example
 * ```ts
 * const fingerprint = createFingerprint('src/Button.tsx', fileContent)
 * // Store fingerprint, check later if content changed
 * const newFingerprint = createFingerprint('src/Button.tsx', newContent)
 * if (fingerprint.signature !== newFingerprint.signature) {
 *   // Content changed, needs reprocessing
 * }
 * ```
 */
export function createFingerprint(filePath: string, fileContent: string): FileFingerprint {
  const native = getNativeBridge()
  if (!native?.create_fingerprint) throw new Error("create_fingerprint not available")
  const fingerprintJson = native.create_fingerprint(filePath, fileContent)
  try {
    return JSON.parse(fingerprintJson)
  } catch {
    return {
      file_path: filePath,
      content_hash: "",
      size_bytes: fileContent.length,
      mtime_ms: Date.now(),
      class_hash: "",
      signature: "",
    }
  }
}

/**
 * Inject state hash into compiled CSS
 * Marks CSS with version/state hash for cache busting
 *
 * @param css - Raw CSS string
 * @param stateHash - State hash to inject
 * @returns Modified CSS with injected state
 *
 * @example
 * ```ts
 * const css = compileCssNative2(['px-4', 'bg-blue-600'])
 * const withState = injectStateHash(css, 'v5-hash-123')
 * // CSS now includes version marker for cache control
 * ```
 */
export function injectStateHash(css: string, stateHash: string): StateInjectionResult {
  const native = getNativeBridge()
  if (!native?.inject_state_hash) throw new Error("inject_state_hash not available")
  const resultJson = native.inject_state_hash(css, stateHash)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      injected: false,
      state_hash: stateHash,
      affected_files: 0,
      total_injected_bytes: 0,
    }
  }
}

/**
 * Prune stale entries from cache
 * Removes old/unused cache entries to free memory
 *
 * @param maxAgeSeconds - Remove entries older than this many seconds
 * @param maxEntries - Keep only this many most-recent entries
 * @returns Result of pruning operation
 *
 * @example
 * ```ts
 * // Remove cache entries older than 1 hour, keep max 10000 entries
 * const result = pruneStaleCacheEntries(3600, 10000)
 * console.log(`Freed ${result.freed_bytes / 1024}KB`)
 * ```
 */
export function pruneStaleCacheEntries(maxAgeSeconds: number, maxEntries: number): PruneResult {
  const native = getNativeBridge()
  if (!native?.prune_stale_entries) throw new Error("prune_stale_entries not available")
  const resultJson = native.prune_stale_entries(maxAgeSeconds, maxEntries)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      entries_before: 0,
      entries_after: 0,
      entries_removed: 0,
      freed_bytes: 0,
    }
  }
}

/**
 * Rebuild workspace result from scratch
 * Useful after major configuration changes
 *
 * @param rootDir - Root directory to scan
 * @param extensions - File extensions to scan (e.g., [".tsx", ".ts"])
 * @returns Rebuilt workspace result
 *
 * @example
 * ```ts
 * const result = rebuildWorkspaceResult('./src', ['.tsx', '.ts'])
 * console.log(`Found ${result.unique_classes} unique classes`)
 * console.log(`${result.files_with_changes} files had changes`)
 * ```
 */
export function rebuildWorkspaceResult(
  rootDir: string,
  extensions?: string[]
): RebuildWorkspaceResult {
  const native = getNativeBridge()
  if (!native?.rebuild_workspace_result)
    throw new Error("rebuild_workspace_result not available")
  const resultJson = native.rebuild_workspace_result(rootDir, extensions || [])
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      total_files_scanned: 0,
      total_classes_found: 0,
      unique_classes: 0,
      build_time_ms: 0,
      files_with_changes: 0,
    }
  }
}

/**
 * Scan a single file with incremental state
 * Returns only new/changed classes since last scan
 *
 * @param filePath - Path to file
 * @param fileContent - File content
 * @returns Updated classes and change status
 *
 * @example
 * ```ts
 * // On file change, get only what changed
 * const file = scanFileNative('src/Button.tsx', newContent)
 * if (file.changed) {
 *   console.log('Added:', file.added_classes)
 *   console.log('Removed:', file.removed_classes)
 * }
 * ```
 */
export function scanFileNative(
  filePath: string,
  fileContent: string
): {
  file: string
  classes: string[]
  added_classes: string[]
  removed_classes: string[]
  changed: boolean
} {
  const native = getNativeBridge()
  if (!native?.scan_file_native) throw new Error("scan_file_native not available")
  const resultJson = native.scan_file_native(filePath, fileContent)
  try {
    return JSON.parse(resultJson)
  } catch {
    return {
      file: filePath,
      classes: [],
      added_classes: [],
      removed_classes: [],
      changed: false,
    }
  }
}

/**
 * Scan multiple files in batch with incremental state
 * Efficient batch processing of file changes
 *
 * @param filesJson - JSON array of {file, content} objects
 * @returns Results for each file
 *
 * @example
 * ```ts
 * const files = [
 *   { file: 'src/Button.tsx', content: newButtonContent },
 *   { file: 'src/Card.tsx', content: newCardContent }
 * ]
 * const results = scanFilesBatchNative(JSON.stringify(files))
 * ```
 */
export function scanFilesBatchNative(
  filesJson: string
): Array<{
  file: string
  classes: string[]
  changed: boolean
}> {
  const native = getNativeBridge()
  if (!native?.scan_files_batch_native)
    throw new Error("scan_files_batch_native not available")
  const resultJson = native.scan_files_batch_native(filesJson)
  try {
    return JSON.parse(resultJson)
  } catch {
    return []
  }
}
