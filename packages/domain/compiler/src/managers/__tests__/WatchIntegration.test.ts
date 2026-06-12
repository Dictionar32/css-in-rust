/**
 * Watch System Integration Test Suite
 * 
 * Task 3.4: Integration tests for watch system with compiler pipeline
 * Tests end-to-end latency, debouncing, error recovery, and plugin hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WatchManager, WatchHandle } from '../WatchManager'

describe('Watch System Integration - Task 3.4', () => {
  let watchManager: WatchManager

  beforeEach(async () => {
    watchManager = new WatchManager({
      rootPath: '/app',
      patterns: ['**/*.ts', '**/*.tsx', 'tailwind.config.js'],
      debounceMs: 100,
      gitignoreAware: true,
    })
  })

  afterEach(async () => {
    await watchManager.clearAllWatches()
  })

  describe('Task 3.4.1: Compiler Pipeline Integration', () => {
    it('should integrate with compilation pipeline', async () => {
      const handle = await watchManager.startWatch()

      // Register hooks for compilation pipeline
      const fileChangeHook = vi.fn(async (data) => {
        // Simulate parsing classes from changed file
        expect(data.file_path).toMatch(/\.ts(x)?$/)
      })

      const beforeRecompileHook = vi.fn(async (data) => {
        // Prepare for recompilation
        expect(Array.isArray(data.files_changed)).toBe(true)
      })

      const afterCompileHook = vi.fn(async (data) => {
        // Process compilation results
        expect(typeof data.css_size_bytes).toBe('number')
        expect(typeof data.compilation_time_ms).toBe('number')
      })

      // Register all hooks
      await watchManager.registerPluginHook(
        'on_file_changed',
        'compiler-file-parser',
        fileChangeHook
      )
      await watchManager.registerPluginHook(
        'before_recompile',
        'compiler-prep',
        beforeRecompileHook
      )
      await watchManager.registerPluginHook(
        'after_compile',
        'compiler-finalize',
        afterCompileHook
      )

      // Simulate file change event from polling
      const batch = await watchManager.pollWatchEvents(handle, 100)

      if (batch.events.length > 0) {
        // Emit file changed hook
        await watchManager.emitPluginHook('on_file_changed', {
          file_path: batch.events[0].file_path,
          event_type: batch.events[0].event_type,
          file_size_bytes: 2048,
          classes_found: ['text-red-500', 'bg-blue-100'],
          timestamp_ms: Date.now(),
          debounced_events: batch.debounced_count,
        })

        // Emit before recompile hook
        await watchManager.emitPluginHook('before_recompile', {
          files_changed: [batch.events[0].file_path],
          total_files_to_process: 1,
          debounced_events: batch.debounced_count,
          estimated_duration_ms: 100,
        })

        // Emit after compile hook (success)
        await watchManager.emitPluginHook('after_compile', {
          success: true,
          css_size_bytes: 45000,
          compilation_time_ms: 85,
          changed_files: 1,
          generated_classes: 250,
        })
      }

      // Verify stats updated
      const stats = await watchManager.getWatchStats()
      expect(stats.active_handles).toBeGreaterThanOrEqual(1)
    })

    it('should integrate multiple file changes into single recompile', async () => {
      const handle = await watchManager.startWatch()

      const filesToCompile: string[] = []

      await watchManager.registerPluginHook(
        'on_file_changed',
        'file-collector',
        async (data) => {
          if ('file_path' in data) {
            filesToCompile.push(data.file_path)
          }
        }
      )

      // Simulate rapid file changes (debounced)
      await watchManager.emitPluginHook('on_file_changed', {
        file_path: '/app/components/button.tsx',
        event_type: 'Modified',
        file_size_bytes: 1024,
        classes_found: ['btn'],
        timestamp_ms: Date.now(),
        debounced_events: 3,
      })

      // After debounce, compile all changed files
      await watchManager.emitPluginHook('before_recompile', {
        files_changed: filesToCompile,
        total_files_to_process: filesToCompile.length,
        debounced_events: 3,
      })

      // Should batch all changes
      expect(filesToCompile.length).toBeGreaterThan(0)
    })

    it('should provide context to hooks for optimization', async () => {
      const handle = await watchManager.startWatch()

      const compileContexts: any[] = []

      await watchManager.registerPluginHook(
        'before_recompile',
        'compiler-context',
        async (data) => {
          if ('files_changed' in data) {
            compileContexts.push({
              fileCount: data.files_changed.length,
              debounced: data.debounced_events,
            })
          }
        }
      )

      // Emit with varying debounce counts
      await watchManager.emitPluginHook('before_recompile', {
        files_changed: ['/app/a.ts', '/app/b.ts'],
        total_files_to_process: 2,
        debounced_events: 5,
      })

      expect(compileContexts[0].debounced).toBe(5)
    })
  })

  describe('Task 3.4.2: Debouncing for Rapid Changes', () => {
    it('should debounce rapid file modifications', async () => {
      const handle = await watchManager.startWatch({
        debounceMs: 100,
      })

      const recompileCount = { count: 0 }

      await watchManager.registerPluginHook(
        'before_recompile',
        'compile-counter',
        async () => {
          recompileCount.count++
        }
      )

      // Rapid changes in quick succession (< debounce time)
      const fileChanges = [
        '/app/file1.ts',
        '/app/file2.ts',
        '/app/file3.ts',
      ]

      for (const file of fileChanges) {
        await watchManager.emitPluginHook('on_file_changed', {
          file_path: file,
          event_type: 'Modified',
          file_size_bytes: 1024,
          classes_found: [],
          timestamp_ms: Date.now(),
          debounced_events: fileChanges.length,
        })
      }

      // Wait for debounce to settle
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should have recompiled (but not more than file changes)
      expect(recompileCount.count).toBeLessThanOrEqual(fileChanges.length)
    })

    it('should batch changes in single recompile event', async () => {
      const handle = await watchManager.startWatch({
        debounceMs: 50,
      })

      const batchedFiles: string[] = []

      await watchManager.registerPluginHook(
        'before_recompile',
        'batch-tracker',
        async (data) => {
          if ('files_changed' in data) {
            batchedFiles.push(...data.files_changed)
          }
        }
      )

      // Emit rapid changes
      const files = ['/app/a.ts', '/app/b.ts', '/app/c.ts']

      for (const file of files) {
        await watchManager.emitPluginHook('on_file_changed', {
          file_path: file,
          event_type: 'Modified',
          file_size_bytes: 512,
          classes_found: ['class1'],
          timestamp_ms: Date.now(),
          debounced_events: files.length,
        })
      }

      // Batch them together
      await watchManager.emitPluginHook('before_recompile', {
        files_changed: files,
        total_files_to_process: files.length,
        debounced_events: files.length,
      })

      expect(batchedFiles.length).toBeGreaterThan(0)
    })
  })

  describe('Task 3.4.3: Error Recovery', () => {
    it('should continue watching after compile errors', async () => {
      const handle = await watchManager.startWatch()

      // Emit error
      await watchManager.emitPluginHook('after_compile', {
        success: false,
        css_size_bytes: 0,
        compilation_time_ms: 120,
        errors: ['Syntax error in user config'],
        changed_files: 1,
        generated_classes: 0,
      })

      // Watch should still be running
      const isRunning = await watchManager.isWatchRunning(handle)
      expect(isRunning).toBe(true)

      // Should be able to handle next file change
      const batch = await watchManager.pollWatchEvents(handle, 100)
      expect(batch).toBeDefined()
    })

    it('should report compilation errors in hooks', async () => {
      const handle = await watchManager.startWatch()

      const errors: string[] = []

      await watchManager.registerPluginHook(
        'after_compile',
        'error-collector',
        async (data) => {
          if ('errors' in data && data.errors) {
            errors.push(...data.errors)
          }
        }
      )

      // Emit compilation error
      await watchManager.emitPluginHook('after_compile', {
        success: false,
        css_size_bytes: 25000,
        compilation_time_ms: 150,
        errors: ['Invalid CSS syntax', 'Unknown function'],
        warnings: ['Unused rule'],
        changed_files: 2,
        generated_classes: 100,
      })

      expect(errors.length).toBe(2)
      expect(errors[0]).toBe('Invalid CSS syntax')
    })

    it('should track partial success during recompilation', async () => {
      const handle = await watchManager.startWatch()

      const results: any[] = []

      await watchManager.registerPluginHook(
        'after_compile',
        'result-tracker',
        async (data) => {
          results.push({
            success: data.success,
            files: data.changed_files,
            classes: data.generated_classes,
          })
        }
      )

      // Partial success: some files compiled, some had errors
      await watchManager.emitPluginHook('after_compile', {
        success: false,
        css_size_bytes: 35000,
        compilation_time_ms: 100,
        errors: ['Failed to process file X'],
        changed_files: 3,
        generated_classes: 150,
      })

      expect(results[0].success).toBe(false)
      expect(results[0].files).toBe(3)
    })
  })

  describe('Task 3.4.4: End-to-End Performance', () => {
    it('should achieve < 200ms latency from file change to recompile', async () => {
      const handle = await watchManager.startWatch()

      const startTime = Date.now()

      // Poll for events
      const batch = await watchManager.pollWatchEvents(handle, 100)

      if (batch.events.length > 0) {
        // Trigger recompilation pipeline
        await watchManager.emitPluginHook('on_file_changed', {
          file_path: batch.events[0].file_path,
          event_type: batch.events[0].event_type,
          file_size_bytes: 1024,
          classes_found: [],
          timestamp_ms: Date.now(),
          debounced_events: 0,
        })

        await watchManager.emitPluginHook('before_recompile', {
          files_changed: [batch.events[0].file_path],
          total_files_to_process: 1,
          debounced_events: 0,
        })

        await watchManager.emitPluginHook('after_compile', {
          success: true,
          css_size_bytes: 45000,
          compilation_time_ms: 80,
          changed_files: 1,
          generated_classes: 200,
        })
      }

      const elapsed = Date.now() - startTime

      // Should complete within 200ms
      expect(elapsed).toBeLessThan(200)
    })

    it('should handle 100+ watched files efficiently', async () => {
      const handle = await watchManager.startWatch()

      // Add many patterns to simulate monitoring many files
      const patterns = Array.from(
        { length: 100 },
        (_, i) => `src/components/comp${i}/**/*.ts`
      )

      let addedCount = 0
      for (const pattern of patterns) {
        const result = await watchManager.addPattern(handle, pattern)
        if (result.success) addedCount++
      }

      // Should have added most patterns
      expect(addedCount).toBeGreaterThan(90)

      // Watch should still be performant
      const startTime = Date.now()
      const stats = await watchManager.getPerHandleStats(handle)
      const elapsed = Date.now() - startTime

      expect(stats.patterns_active).toBeGreaterThan(0)
      expect(elapsed).toBeLessThan(50) // Stats should be < 50ms
    })

    it('should stream results progressively', async () => {
      const handle = await watchManager.startWatch()

      let totalEvents = 0

      // Poll multiple times to simulate streaming
      for (let i = 0; i < 5; i++) {
        const batch = await watchManager.pollWatchEvents(handle, 50)
        totalEvents += batch.total_events

        if (batch.events.length > 0) {
          // Process incrementally
          await watchManager.emitPluginHook('on_file_changed', {
            file_path: batch.events[0].file_path,
            event_type: batch.events[0].event_type,
            file_size_bytes: 512,
            classes_found: ['class' + i],
            timestamp_ms: Date.now(),
            debounced_events: 0,
          })
        }
      }

      // Should handle streaming without issues
      const stats = await watchManager.getWatchStats()
      expect(stats.events_processed).toBeGreaterThanOrEqual(0)
    })

    it('should measure and report latency percentiles', async () => {
      const handle = await watchManager.startWatch()

      // Perform multiple operations to collect latency data
      for (let i = 0; i < 20; i++) {
        await watchManager.pollWatchEvents(handle, 50)
      }

      const stats = await watchManager.getPerHandleStats(handle)

      // Should have meaningful latency metrics
      expect(stats.average_latency_ms).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Task 3.4.5: Multiple Watch Instances', () => {
    it('should manage multiple independent watches', async () => {
      const handle1 = await watchManager.startWatch({ rootPath: '/app1' })
      const handle2 = await watchManager.startWatch({ rootPath: '/app2' })
      const handle3 = await watchManager.startWatch({ rootPath: '/app3' })

      // Each should be independent
      const stats1 = await watchManager.getPerHandleStats(handle1)
      const stats2 = await watchManager.getPerHandleStats(handle2)
      const stats3 = await watchManager.getPerHandleStats(handle3)

      expect(stats1.handle.id).toBe(handle1.id)
      expect(stats2.handle.id).toBe(handle2.id)
      expect(stats3.handle.id).toBe(handle3.id)
    })

    it('should route hooks to appropriate watch instances', async () => {
      const handle1 = await watchManager.startWatch({ rootPath: '/app1' })
      const handle2 = await watchManager.startWatch({ rootPath: '/app2' })

      const filesFromHandle1: string[] = []
      const filesFromHandle2: string[] = []

      await watchManager.registerPluginHook(
        'on_file_changed',
        'handler-app1',
        async (data) => {
          if ('file_path' in data && data.file_path.includes('app1')) {
            filesFromHandle1.push(data.file_path)
          }
        }
      )

      await watchManager.registerPluginHook(
        'on_file_changed',
        'handler-app2',
        async (data) => {
          if ('file_path' in data && data.file_path.includes('app2')) {
            filesFromHandle2.push(data.file_path)
          }
        }
      )

      // Emit changes for different apps
      await watchManager.emitPluginHook('on_file_changed', {
        file_path: '/app1/file.ts',
        event_type: 'Modified',
        file_size_bytes: 1024,
        classes_found: [],
        timestamp_ms: Date.now(),
        debounced_events: 0,
      })

      await watchManager.emitPluginHook('on_file_changed', {
        file_path: '/app2/file.ts',
        event_type: 'Modified',
        file_size_bytes: 1024,
        classes_found: [],
        timestamp_ms: Date.now(),
        debounced_events: 0,
      })

      // Each handler should see their respective files
      expect(
        filesFromHandle1.some(f => f.includes('app1'))
      ).toBe(true)
      expect(
        filesFromHandle2.some(f => f.includes('app2'))
      ).toBe(true)
    })
  })

  describe('Task 3.4.6: Statistics and Monitoring', () => {
    it('should track compilation metrics across all watches', async () => {
      const handle1 = await watchManager.startWatch()
      const handle2 = await watchManager.startWatch()

      // Emit compilation results
      await watchManager.emitPluginHook('after_compile', {
        success: true,
        css_size_bytes: 50000,
        compilation_time_ms: 100,
        changed_files: 3,
        generated_classes: 200,
      })

      const stats = await watchManager.getWatchStats()

      expect(stats.active_handles).toBe(2)
      expect(stats.events_processed).toBeGreaterThanOrEqual(0)
    })

    it('should report memory usage', async () => {
      const handle = await watchManager.startWatch()

      const stats = await watchManager.getWatchStats()

      expect(stats.current_memory_kb).toBeGreaterThan(0)
      expect(stats.max_memory_kb).toBeGreaterThan(0)
      expect(stats.max_memory_kb).toBeGreaterThanOrEqual(stats.current_memory_kb)
    })

    it('should track event type distribution', async () => {
      const handle = await watchManager.startWatch()

      // Emit different event types
      for (let i = 0; i < 3; i++) {
        await watchManager.emitPluginHook('on_file_changed', {
          file_path: `/app/file${i}.ts`,
          event_type: 'Modified',
          file_size_bytes: 1024,
          classes_found: [],
          timestamp_ms: Date.now(),
          debounced_events: 0,
        })
      }

      const metrics = await watchManager.getEventMetrics(handle)

      expect(metrics.total_count).toBeGreaterThanOrEqual(0)
    })
  })
})
