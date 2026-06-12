/**
 * scannerNative.ts
 *
 * Native Rust bindings for workspace scanning and class extraction.
 */

import { getNativeBridge } from "./nativeBridge"

export type {
  ScanWorkspaceResult,
  ScanFileResult,
  BatchExtractResult,
  SafelistCheckResult,
  PrefilterFileResult,
} from "./nativeBridge"

/**
 * Scan entire workspace for Tailwind classes.
 * @returns Result with files and classes found
 */
export function scanWorkspace(root: string, extensions?: string[]) {
  const native = getNativeBridge()
  if (!native?.scan_workspace) throw new Error("scan_workspace not available")
  return native.scan_workspace(root, extensions)
}

/**
 * Extract Tailwind classes from source code.
 */
export function extractClassesFromSourceNative(source: string): string[] {
  const native = getNativeBridge()
  if (!native?.extract_classes_from_source) throw new Error("extract_classes_from_source not available")
  return native.extract_classes_from_source(source)
}

/**
 * Batch extract classes from multiple files.
 */
export function batchExtractClassesNative(filePaths: string[]) {
  const native = getNativeBridge()
  if (!native?.batch_extract_classes) throw new Error("batch_extract_classes not available")
  return native.batch_extract_classes(filePaths)
}

/**
 * Check classes against a safelist.
 */
export function checkAgainstSafelistNative(classes: string[], safelist: string[]) {
  const native = getNativeBridge()
  if (!native?.check_against_safelist) throw new Error("check_against_safelist not available")
  return native.check_against_safelist(classes, safelist)
}

/**
 * Scan a single file for Tailwind classes.
 */
export function scanFile(filePath: string) {
  const native = getNativeBridge()
  if (!native?.scan_file) throw new Error("scan_file not available")
  return native.scan_file(filePath)
}

/**
 * Collect files from directory with extension filtering.
 */
export function collectFiles(root: string, extensions?: string[]) {
  const native = getNativeBridge()
  if (!native?.collect_files) throw new Error("collect_files not available")
  return native.collect_files(root, extensions)
}

/**
 * Walk and pre-filter source files for Tailwind usage.
 */
export function walkAndPrefilterSourceFiles(root: string, extensions?: string[], _parallel?: boolean) {
  const native = getNativeBridge()
  if (!native?.walk_and_prefilter_source_files) throw new Error("walk_and_prefilter_source_files not available")
  return native.walk_and_prefilter_source_files(root, extensions)
}

/**
 * Generate TypeScript type definitions for sub-components.
 */
export function generateSubComponentTypes(root: string, outputPath?: string): string {
  const native = getNativeBridge()
  if (!native?.generate_sub_component_types) throw new Error("generate_sub_component_types not available")
  return native.generate_sub_component_types(root, outputPath)
}
