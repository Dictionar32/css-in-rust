/**
 * Parser Sub-entry Point
 * 
 * Exports class parsing and extraction functionality.
 * - Tailwind class parsing
 * - Class extraction from source
 * - Class normalization and deduplication
 * - Component analysis
 */

import { getNativeBridge } from '../nativeBridge'

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

export const parseClasses = (raw: string): Array<{ raw: string; type: string }> => {
  const native = getNativeBridge()
  if (!native?.parseClasses) {
    throw new Error('FATAL: Native binding \'parseClasses\' is required but not available.')
  }
  return native.parseClasses(raw) || []
}

export const parseClass = (input: string): Record<string, unknown> => {
  const native = getNativeBridge()
  if (!native?.parseClass) {
    throw new Error('FATAL: Native binding \'parseClass\' is required but not available.')
  }
  const result = native.parseClass(input)
  return typeof result === 'string' ? JSON.parse(result) : result
}

// ============================================================================
// CLASS EXTRACTION
// ============================================================================

export const extractAllClasses = (source: string): string[] => {
  const native = getNativeBridge()
  if (!native?.extractAllClasses) {
    throw new Error('FATAL: Native binding \'extractAllClasses\' is required but not available.')
  }
  return native.extractAllClasses(source) || []
}

export const extractClassesFromSource = (source: string): string => {
  const native = getNativeBridge()
  if (!native?.extractClassesFromSource) {
    throw new Error('FATAL: Native binding \'extractClassesFromSource\' is required but not available.')
  }
  const result = native.extractClassesFromSource(source)
  return Array.isArray(result) ? result.join(' ') : String(result || '')
}

export const astExtractClasses = (source: string, _filename: string) => {
  const native = getNativeBridge()
  if (!native?.extractClassesFromSource) {
    throw new Error('FATAL: Native binding \'extractClassesFromSource\' is required but not available.')
  }
  return native.extractClassesFromSource(source) || []
}

// ============================================================================
// CLASS NORMALIZATION & MERGING
// ============================================================================

export const normalizeClasses = (raw: string): string => {
  const result = normalizeAndDedupClasses(raw)
  return result?.normalized || ''
}

export const mergeClassesStatic = (classes: string): string => {
  const result = normalizeAndDedupClasses(classes)
  return result?.normalized || ''
}

export const normalizeAndDedupClasses = (raw: string) => {
  const native = getNativeBridge()
  if (!native?.normalizeAndDedupClasses) {
    throw new Error('FATAL: Native binding \'normalizeAndDedupClasses\' is required but not available.')
  }
  const result = native.normalizeAndDedupClasses(raw)
  return result || { normalized: '', duplicatesRemoved: 0, uniqueCount: 0 }
}

// ============================================================================
// COMPONENT ANALYSIS
// ============================================================================

export const extractComponentUsage = (source: string): Array<{ component: string; propsJson: string }> => {
  const native = getNativeBridge()
  if (!native?.extractComponentUsage) {
    throw new Error('FATAL: Native binding \'extractComponentUsage\' is required but not available.')
  }
  return native.extractComponentUsage(source) || []
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export const batchExtractClasses = (filePaths: string[]) => {
  const native = getNativeBridge()
  if (!native?.batchExtractClasses) {
    throw new Error('FATAL: Native binding \'batchExtractClasses\' is required but not available.')
  }
  return native.batchExtractClasses(filePaths) || []
}

export const checkAgainstSafelist = (classes: string[], safelist: string[]) => {
  const native = getNativeBridge()
  if (!native?.checkAgainstSafelist) {
    throw new Error('FATAL: Native binding \'checkAgainstSafelist\' is required but not available.')
  }
  return native.checkAgainstSafelist(classes, safelist) || { matched: [], unmatched: [], safelistSize: 0 }
}

// ============================================================================
// DIFF & MERGING
// ============================================================================

export const diffClassLists = (previous: string[], current: string[]) => {
  const native = getNativeBridge()
  if (!native?.diffClassLists) {
    throw new Error('FATAL: Native binding \'diffClassLists\' is required but not available.')
  }
  return native.diffClassLists(previous, current) || { added: [], removed: [], unchanged: [], hasChanges: false }
}

// Re-export types if any
export type { ClassExtractResult, ComponentMetadata } from '../nativeBridge'
