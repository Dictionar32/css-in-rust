/**
 * Incremental Compilation & Streaming Type Definitions
 * 
 * Comprehensive type definitions for change detection, incremental diff computation,
 * and progressive CSS generation and streaming.
 * 
 * Requirement 4: Incremental Compilation & Streaming
 * 8 Rust functions exposed via NativeBridge
 */

// =============================================================================
// FINGERPRINTING & CHANGE DETECTION
// =============================================================================

export interface FileFingerprint {
  readonly file_path: string
  readonly content_hash: string      // SHA-256 first 16 chars
  readonly timestamp_ms: number
  readonly size_bytes: number
  readonly encoding?: string
}

export interface FingerprintComparison {
  readonly same_content: boolean
  readonly old_hash: string
  readonly new_hash: string
  readonly size_changed: boolean
  readonly size_diff_bytes: number
}

// =============================================================================
// FILE CHANGE TRACKING
// =============================================================================

export type FileChangeType = 'Modified' | 'Created' | 'Deleted'

export interface FileChange {
  readonly file_path: string
  readonly event_type: FileChangeType
  readonly old_content?: string
  readonly new_content: string
  readonly timestamp_ms: number
}

export interface FileChangeDiff {
  readonly file_path: string
  readonly event_type: FileChangeType
  readonly affected_classes: string[]
  readonly removed_classes: string[]
  readonly new_classes: string[]
  readonly change_impact: 'low' | 'medium' | 'high'
  readonly requires_full_rebuild: boolean
}

// =============================================================================
// INCREMENTAL DIFF COMPUTATION
// =============================================================================

export interface ScanDifference {
  readonly files_changed: string[]
  readonly files_added: string[]
  readonly files_removed: string[]
  readonly total_changes: number
}

export interface ClassDifference {
  readonly classes_added: string[]
  readonly classes_removed: string[]
  readonly classes_modified: string[]
  readonly total_class_changes: number
}

export interface IncrementalDiff {
  readonly files: ScanDifference
  readonly classes: ClassDifference
  readonly total_changes: number
  readonly rebuild_required: boolean
  readonly estimated_impact_percent: number
  readonly computed_at: number
  readonly baseline_hash: string
  readonly current_hash: string
}

export interface DiffMetrics {
  readonly files_analyzed: number
  readonly changes_detected: number
  readonly computation_time_ms: number
  readonly unchanged_files: number
  readonly cache_hits: number
}

// =============================================================================
// WORKSPACE SCAN RESULTS
// =============================================================================

export interface WorkspaceScanResult {
  readonly files: string[]
  readonly total_files: number
  readonly classes: string[]
  readonly unique_classes: number
  readonly duration_ms: number
  readonly errors: string[]
  readonly scan_hash: string
  readonly timestamp_ms: number
}

export interface FileScanResult {
  readonly file: string
  readonly classes: string[]
  readonly class_count: number
  readonly has_tw_usage: boolean
  readonly size_bytes: number
  readonly duration_ms: number
  readonly fingerprint: string
}

export interface BatchScanResult {
  readonly total_files: number
  readonly files_scanned: number
  readonly classes_found: string[]
  readonly unique_classes: number
  readonly duration_ms: number
  readonly errors: Array<{
    readonly file: string
    readonly error: string
  }>
  readonly batch_hash: string
}

// =============================================================================
// INCREMENTAL BUILD
// =============================================================================

export interface IncrementalBuildConfig {
  readonly root_dir: string
  readonly extensions?: string[]    // default: ['.ts', '.tsx', '.js', '.jsx']
  readonly use_cache?: boolean      // default: true
  readonly max_age_seconds?: number // max age for cached results
}

export interface IncrementalBuildResult {
  readonly success: boolean
  readonly baseline_hash: string
  readonly changes_detected: number
  readonly files_processed: number
  readonly css_size_bytes: number
  readonly build_time_ms: number
  readonly cache_hit_count: number
  readonly cache_miss_count: number
  readonly incremental: boolean     // true if incremental, false if full rebuild
  readonly classes_generated: number
  readonly errors?: string[]
}

export interface BuildArtifact {
  readonly css: string
  readonly classes_used: string[]
  readonly metadata: Record<string, unknown>
  readonly generated_at: number
  readonly generation_time_ms: number
}

// =============================================================================
// WORKSPACE REBUILD
// =============================================================================

export interface WorkspaceRebuildConfig {
  readonly root_dir: string
  readonly extensions?: string[]
  readonly use_baseline?: boolean
}

export interface WorkspaceRebuildResult {
  readonly success: boolean
  readonly baseline_hash: string
  readonly current_hash: string
  readonly files_processed: number
  readonly changes: {
    readonly added: string[]
    readonly modified: string[]
    readonly removed: string[]
  }
  readonly css_size_bytes: number
  readonly compilation_time_ms: number
  readonly build_artifact: BuildArtifact
}

// =============================================================================
// CACHE PRUNING & MAINTENANCE
// =============================================================================

export interface PruneConfig {
  readonly max_age_seconds: number
  readonly max_entries?: number
  readonly dry_run?: boolean        // Simulate without deleting
}

export interface PruneResult {
  readonly entries_removed: number
  readonly bytes_reclaimed: number
  readonly entries_remaining: number
  readonly pruning_time_ms: number
  readonly pruned_keys?: string[]    // Only if dry_run = true
}

export interface CacheMaintenanceResult {
  readonly success: boolean
  readonly defragmented: boolean
  readonly vacuumed: boolean
  readonly fragmentation_reduced: number
  readonly space_reclaimed_mb: number
  readonly maintenance_time_ms: number
}

// =============================================================================
// STATE MANAGEMENT & INJECTION
// =============================================================================

export interface StateHashConfig {
  readonly include_theme?: boolean
  readonly include_config?: boolean
  readonly include_build_info?: boolean
  readonly algorithm?: 'sha256' | 'md5'
}

export interface StateHash {
  readonly hash: string
  readonly components: Record<string, string>
  readonly created_at: number
}

export interface StateInjectionResult {
  readonly success: boolean
  readonly css_with_hash: string
  readonly hash_comment: string
  readonly original_size_bytes: number
  readonly final_size_bytes: number
}

// =============================================================================
// CSS STREAMING ARCHITECTURE
// =============================================================================

export interface StreamingChunk {
  readonly chunk_index: number
  readonly total_chunks: number
  readonly css: string
  readonly chunk_size_bytes: number
  readonly classes_in_chunk: string[]
  readonly timestamp_ms: number
  readonly is_final: boolean
}

export interface StreamingConfig {
  readonly chunk_size_bytes?: number  // default: 16KB
  readonly min_chunk_size?: number    // Minimum chunk size
  readonly priority?: 'latency' | 'throughput'
  readonly compression?: boolean
}

export interface StreamingResult {
  readonly success: boolean
  readonly total_chunks: number
  readonly total_css_bytes: number
  readonly first_chunk_delay_ms: number
  readonly total_streaming_time_ms: number
  readonly average_chunk_time_ms: number
}

// =============================================================================
// INCREMENTAL CACHE
// =============================================================================

export interface IncrementalCacheEntry {
  readonly key: string
  readonly file_path: string
  readonly content_hash: string
  readonly mtime_ms: number
  readonly size_bytes: number
  readonly classes: string[]
  readonly created_at: number
  readonly accessed_at: number
  readonly hit_count: number
}

export interface IncrementalCache {
  readonly entries: Map<string, IncrementalCacheEntry>
  readonly total_size_bytes: number
  readonly entry_count: number
  readonly hit_rate: number
  readonly last_cleanup: number
}

// =============================================================================
// PERFORMANCE METRICS
// =============================================================================

export interface IncrementalMetrics {
  readonly full_rebuild_time_ms: number
  readonly incremental_rebuild_time_ms: number
  readonly speedup_factor: number
  readonly cache_hit_rate: number
  readonly average_change_detection_ms: number
  readonly average_diff_computation_ms: number
}

export interface StreamingMetrics {
  readonly time_to_first_chunk_ms: number
  readonly total_streaming_time_ms: number
  readonly chunks_per_second: number
  readonly bytes_per_second: number
  readonly compression_ratio?: number
}

// =============================================================================
// INCREMENTAL MANAGER INTERFACE
// =============================================================================

export interface IncrementalManager {
  // Change Detection
  processFileChange(fileChange: FileChange): Promise<FileChangeDiff>
  
  computeIncrementalDiff(
    oldScan: WorkspaceScanResult,
    newScan: WorkspaceScanResult
  ): Promise<IncrementalDiff>
  
  // Fingerprinting
  createFingerprint(filePath: string, fileContent: string): Promise<FileFingerprint>
  compareFingerprints(fp1: FileFingerprint, fp2: FileFingerprint): Promise<FingerprintComparison>
  
  // Workspace Scanning
  scanFile(filePath: string, fileContent: string): Promise<FileScanResult>
  scanFilesBatch(files: Array<{ path: string; content: string }>): Promise<BatchScanResult>
  
  // Incremental Rebuild
  rebuildWorkspaceResult(config: IncrementalBuildConfig): Promise<IncrementalBuildResult>
  rebuildWorkspaceIncremental(config: WorkspaceRebuildConfig): Promise<WorkspaceRebuildResult>
  
  // Cache Pruning
  pruneStaleEntries(config: PruneConfig): Promise<PruneResult>
  maintainCache(): Promise<CacheMaintenanceResult>
  
  // State Management
  injectStateHash(css: string, stateHash: StateHash): Promise<StateInjectionResult>
  createStateHash(config?: StateHashConfig): Promise<StateHash>
  
  // Streaming
  streamCss(css: string, config?: StreamingConfig): AsyncIterable<StreamingChunk>
  getStreamingMetrics(): Promise<StreamingMetrics>
  
  // Metrics & Diagnostics
  getIncrementalMetrics(): Promise<IncrementalMetrics>
  getCache(): Promise<IncrementalCache>
  clearCache(): Promise<void>
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

export const isFileChangeType = (value: unknown): value is FileChangeType => {
  return ['Modified', 'Created', 'Deleted'].includes(value as string)
}

export const isFileFingerprint = (value: unknown): value is FileFingerprint => {
  const v = value as Partial<FileFingerprint>
  return (
    typeof v.file_path === 'string' &&
    typeof v.content_hash === 'string' &&
    typeof v.timestamp_ms === 'number' &&
    typeof v.size_bytes === 'number'
  )
}

export const isFileChangeDiff = (value: unknown): value is FileChangeDiff => {
  const v = value as Partial<FileChangeDiff>
  return (
    typeof v.file_path === 'string' &&
    isFileChangeType(v.event_type) &&
    Array.isArray(v.affected_classes) &&
    Array.isArray(v.removed_classes) &&
    Array.isArray(v.new_classes)
  )
}

export const isIncrementalDiff = (value: unknown): value is IncrementalDiff => {
  const v = value as Partial<IncrementalDiff>
  return (
    typeof v.total_changes === 'number' &&
    typeof v.rebuild_required === 'boolean' &&
    typeof v.computed_at === 'number'
  )
}

export const isWorkspaceScanResult = (value: unknown): value is WorkspaceScanResult => {
  const v = value as Partial<WorkspaceScanResult>
  return (
    Array.isArray(v.files) &&
    typeof v.total_files === 'number' &&
    Array.isArray(v.classes) &&
    typeof v.unique_classes === 'number'
  )
}

export const isIncrementalBuildResult = (value: unknown): value is IncrementalBuildResult => {
  const v = value as Partial<IncrementalBuildResult>
  return (
    typeof v.success === 'boolean' &&
    typeof v.baseline_hash === 'string' &&
    typeof v.css_size_bytes === 'number' &&
    typeof v.build_time_ms === 'number'
  )
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Estimate impact level based on percentage of changes
 */
export const estimateImpactLevel = (changePercent: number): 'low' | 'medium' | 'high' => {
  if (changePercent < 5) return 'low'
  if (changePercent < 25) return 'medium'
  return 'high'
}

/**
 * Calculate speedup factor from rebuild times
 */
export const calculateSpeedup = (fullTime: number, incrementalTime: number): number => {
  if (incrementalTime === 0) return Infinity
  return fullTime / incrementalTime
}

/**
 * Determine if incremental rebuild is worthwhile
 */
export const shouldUseIncremental = (changePercent: number, minThreshold = 5): boolean => {
  return changePercent < minThreshold
}
