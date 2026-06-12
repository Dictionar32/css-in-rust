/**
 * Fallback Implementations for Critical Paths
 *
 * Provides fallback strategies when features become unavailable:
 * - Redis failures → local LRU cache
 * - Watch unavailable → manual recompile only
 * - Theme resolution failures → default theme
 * - Incremental compilation failures → full rebuild
 * - Optimization failures → output unoptimized CSS
 */

// ─────────────────────────────────────────────────────────────────────────
// Local LRU Cache Fallback
// ─────────────────────────────────────────────────────────────────────────

export interface CacheEntry {
  key: string
  value: string
  timestamp: number
  ttlMs: number
}

export class LocalLRUCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly maxSize: number
  private readonly cleanupInterval: number
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(maxSize: number = 1000, cleanupIntervalMs: number = 60000) {
    this.maxSize = maxSize
    this.cleanupInterval = cleanupIntervalMs
    this.startCleanupTimer()
  }

  /**
   * Get value from cache
   */
  get(key: string): string | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  /**
   * Set value in cache with TTL
   */
  set(key: string, value: string, ttlMs: number = 604800000): void {
    // Enforce max size with simple eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttlMs,
    })
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; entries: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: this.cache.size,
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.cleanupInterval)

    // Unref so it doesn't keep process alive
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttlMs) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
  }

  /**
   * Shutdown cache
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.cache.clear()
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Watch System Fallback
// ─────────────────────────────────────────────────────────────────────────

export interface WatchFallbackConfig {
  requireManualRecompile: boolean
  lastCheckTime: number
  filesChecked: Set<string>
}

export class WatchFallback {
  private config: WatchFallbackConfig = {
    requireManualRecompile: true,
    lastCheckTime: Date.now(),
    filesChecked: new Set(),
  }

  /**
   * Get fallback status
   */
  getStatus(): WatchFallbackConfig {
    return { ...this.config }
  }

  /**
   * Record that manual recompile is required
   */
  requiresManualRecompile(): boolean {
    return this.config.requireManualRecompile
  }

  /**
   * Mark file as checked for manual recompile
   */
  markFileChecked(filePath: string): void {
    this.config.filesChecked.add(filePath)
  }

  /**
   * Clear checked files
   */
  clearChecked(): void {
    this.config.filesChecked.clear()
  }

  /**
   * Get message about manual recompile requirement
   */
  getMessage(): string {
    return (
      'Watch system unavailable. Use manual recompilation. ' +
      'Rebuild when you want changes to take effect.'
    )
  }

  /**
   * Reset fallback
   */
  reset(): void {
    this.config.requireManualRecompile = true
    this.config.lastCheckTime = Date.now()
    this.config.filesChecked.clear()
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Theme Resolution Fallback
// ─────────────────────────────────────────────────────────────────────────

export interface DefaultTheme {
  colors: Record<string, string>
  spacing: Record<string, string>
  fontSize: Record<string, string>
}

export function getDefaultTheme(): DefaultTheme {
  return {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#000000',
      white: '#ffffff',
      gray: '#6b7280',
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      purple: '#a855f7',
      pink: '#ec4899',
    },
    spacing: {
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '6': '1.5rem',
      '8': '2rem',
      '12': '3rem',
      '16': '4rem',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
    },
  }
}

export class ThemeFallback {
  private defaultTheme: DefaultTheme = getDefaultTheme()

  /**
   * Get default theme value
   */
  getThemeValue(keyPath: string): string | null {
    const parts = keyPath.split('.')
    let current: any = this.defaultTheme

    for (const part of parts) {
      current = current?.[part]
      if (current === undefined) return null
    }

    return current
  }

  /**
   * Get all default theme values for a category
   */
  getThemeCategory(category: 'colors' | 'spacing' | 'fontSize'): Record<string, string> {
    return this.defaultTheme[category]
  }

  /**
   * Get fallback message
   */
  getMessage(): string {
    return 'Theme resolution failed, using default theme. Check your theme configuration.'
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Incremental Compilation Fallback
// ─────────────────────────────────────────────────────────────────────────

export class IncrementalFallback {
  private lastFullRebuild: number = Date.now()

  /**
   * Trigger full rebuild as fallback
   */
  triggerFullRebuild(): { useFullRebuild: boolean; reason: string } {
    return {
      useFullRebuild: true,
      reason: 'Incremental compilation failed, falling back to full rebuild',
    }
  }

  /**
   * Get time since last full rebuild
   */
  getTimeSinceLastRebuild(): number {
    return Date.now() - this.lastFullRebuild
  }

  /**
   * Mark full rebuild time
   */
  markFullRebuild(): void {
    this.lastFullRebuild = Date.now()
  }

  /**
   * Get fallback message
   */
  getMessage(): string {
    return (
      'Incremental compilation failed. Performing full rebuild. ' +
      'This may take longer than incremental updates.'
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Optimization Fallback
// ─────────────────────────────────────────────────────────────────────────

export interface UnoptimizedCssResult {
  css: string
  sizeBytes: number
  unoptimized: boolean
  reason: string
}

export class OptimizationFallback {
  /**
   * Output unoptimized CSS when optimization fails
   */
  getUnoptimizedCss(css: string): UnoptimizedCssResult {
    return {
      css,
      sizeBytes: Buffer.byteLength(css, 'utf-8'),
      unoptimized: true,
      reason: 'Optimization failed, outputting unoptimized CSS (still fully functional)',
    }
  }

  /**
   * Get fallback message
   */
  getMessage(): string {
    return (
      'CSS optimization failed. CSS output is unoptimized but fully functional. ' +
      'Check your optimization configuration.'
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Global Fallback Manager
// ─────────────────────────────────────────────────────────────────────────

export class FallbackManager {
  private redis: LocalLRUCache = new LocalLRUCache()
  private watch: WatchFallback = new WatchFallback()
  private theme: ThemeFallback = new ThemeFallback()
  private incremental: IncrementalFallback = new IncrementalFallback()
  private optimization: OptimizationFallback = new OptimizationFallback()

  /**
   * Get Redis cache fallback
   */
  getRedisCache(): LocalLRUCache {
    return this.redis
  }

  /**
   * Get watch fallback
   */
  getWatch(): WatchFallback {
    return this.watch
  }

  /**
   * Get theme fallback
   */
  getTheme(): ThemeFallback {
    return this.theme
  }

  /**
   * Get incremental fallback
   */
  getIncremental(): IncrementalFallback {
    return this.incremental
  }

  /**
   * Get optimization fallback
   */
  getOptimization(): OptimizationFallback {
    return this.optimization
  }

  /**
   * Shutdown all fallback systems
   */
  shutdown(): void {
    this.redis.shutdown()
    this.watch.reset()
  }

  /**
   * Get fallback diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    return {
      redis: this.redis.getStats(),
      watch: this.watch.getStatus(),
      incremental: {
        lastFullRebuild: this.incremental.getTimeSinceLastRebuild(),
      },
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Singleton Instance
// ─────────────────────────────────────────────────────────────────────────

let globalFallbackManager: FallbackManager | null = null

export function getFallbackManager(): FallbackManager {
  if (!globalFallbackManager) {
    globalFallbackManager = new FallbackManager()
  }
  return globalFallbackManager
}

export function resetFallbackManager(): void {
  if (globalFallbackManager) {
    globalFallbackManager.shutdown()
    globalFallbackManager = null
  }
}
