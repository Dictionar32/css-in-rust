# Implementation Plan: Use All 63 Rust Functions Integration

**Status:** 📋 READY FOR IMPLEMENTATION  
**Feature:** use-all-63-rust-functions  
**Workflow:** Requirements-First  
**Last Updated:** 2026-06-12

---

## Overview

This document breaks down the implementation of 63 unused Rust functions into the TypeScript layer across 8 domains. Tasks are organized by logical dependency and can be executed sequentially or in parallel where noted. Total effort: 127 hours (~4 weeks at 40hrs/week).

---

## Tasks

### Phase 1: Foundation Setup (6 tasks) - 12 hours
Establish core infrastructure and type definitions needed by all phases.

- [x] 1.1 Create TypeScript type definitions for all 63 functions (Requirement 1-8)
  - Create comprehensive TypeScript interfaces in `packages/domain/compiler/src/types/`
  - Add type definitions for Redis, Watch, ID Registry, Incremental, Theme, Optimization, Atomic, and Analysis functions
  - Ensure proper generic support for callback handlers and hooks
  - Estimate: 3 hours
  - Dependencies: None

- [x] 1.2 Update NativeBridge to export all 63 Rust functions (Cross-cutting concern)
  - Map all 63 Rust function names to TypeScript exports in `nativeBridge.ts`
  - Create wrapper functions with proper error handling
  - Add JSDoc documentation for each function
  - Verify all functions are callable from TypeScript
  - Estimate: 4 hours
  - Dependencies: 1.1

- [x] 1.3 Create Manager base classes (RedisManager, WatchManager, etc.) (All Requirements)
  - Create abstract Manager base class with common patterns
  - Implement 8 concrete manager classes with initialization logic
  - Add configuration loading from `tailwind.config.js`
  - Add lifecycle methods (init, destroy, reset)
  - Estimate: 3 hours
  - Dependencies: 1.2

- [x] 1.4 Create comprehensive error handling and fallback system (All Requirements)
  - Implement error types for each subsystem
  - Add graceful degradation when features unavailable
  - Create fallback implementations for critical paths
  - Add error logging and diagnostics
  - Estimate: 2 hours
  - Dependencies: 1.3

### Phase 2: Redis Distributed Caching (6 tasks) - 18 hours
Implement multi-machine cache sharing with connection pool management.

- [x] 2.1 Implement Redis connection pool management (Requirement 1.1-1.2)
  - Integrate `redis_pool_connect` for connection pool creation
  - Add pool statistics tracking with `redis_pool_connect`
  - Implement connection health checks and automatic reconnection
  - Add configurable pool size (default 10)
  - Test connection with mock Redis instance
  - Estimate: 3 hours
  - Dependencies: 1.2, 1.3

- [x] 2.2 Implement Redis cache operations (Requirement 1.3-1.7)
  - Implement cache read/write with TTL support
  - Add `redis_cache_size`, `redis_cache_key_count`, `redis_cache_clear` functions
  - Implement key format: `css-compiler:{file-hash}:{theme-id}:{variant-hash}`
  - Add batch operations for efficiency
  - Test cache hit/miss scenarios
  - Estimate: 3 hours
  - Dependencies: 2.1

- [x] 2.3 Implement Redis cluster mode support (Requirement 1.8-1.9)
  - Integrate `redis_enable_cluster` for cluster mode activation
  - Add automatic failover to healthy nodes on failures
  - Implement cluster health monitoring
  - Add cluster status reporting
  - Test failover scenarios
  - Estimate: 3 hours
  - Dependencies: 2.1

- [x] 2.4 Implement Redis replication and pub/sub (Requirement 1.10, 1.14-1.15, 1.20)
  - Integrate `redis_replicate` for master-replica setup
  - Implement `redis_publish` and `redis_subscribe` for event broadcast
  - Add cache synchronization across peers via `redis_cache_sync`
  - Implement pub/sub for cache invalidation notifications
  - Test replication lag and sync
  - Estimate: 3 hours
  - Dependencies: 2.1

- [x] 2.5 Implement Redis persistence and cache warming (Requirement 1.12-1.13)
  - Integrate `redis_enable_persistence` for AOF/RDB modes
  - Implement `redis_enable_cache_warming` for preloading
  - Add persistence status tracking
  - Implement cache warmup on startup
  - Test persistence across restarts
  - Estimate: 3 hours
  - Dependencies: 2.1

- [x] 2.6 Implement Redis diagnostics and eviction policies (Requirement 1.11, 1.16-1.18)
  - Integrate `redis_diagnostics` for health checks
  - Implement `redis_memory_stats` for memory analysis
  - Add support for eviction policies: LRU, LFU, FIFO, RANDOM
  - Implement memory optimization recommendations
  - Add real-time command monitoring via `redis_monitor`
  - Create diagnostics dashboard
  - Estimate: 3 hours
  - Dependencies: 2.1

### Phase 3: Watch System (4 tasks) - 12 hours
Implement file monitoring with auto-recompile and plugin hooks.

- [x] 3.1 Implement file system watch management (Requirement 2.1-2.5)
  - Integrate `start_watch` and `stop_watch` for lifecycle
  - Implement `poll_watch_events` for event polling
  - Add `watch_add_pattern` and `watch_remove_pattern` for dynamic monitoring
  - Implement automatic `.gitignore` awareness
  - Test file change detection within 100ms
  - Estimate: 3 hours
  - Dependencies: 1.2, 1.3

- [x] 3.2 Implement watch pause/resume and statistics (Requirement 2.8-2.10)
  - Integrate `watch_pause` and `watch_resume` for control
  - Implement `get_watch_stats` for performance metrics
  - Add `watch_get_active_handles` for handle enumeration
  - Implement `watch_clear_all` for cleanup
  - Add performance tracking (latency, file count, event count)
  - Estimate: 2 hours
  - Dependencies: 3.1

- [x] 3.3 Implement plugin hook system (Requirement 2.13-2.17)
  - Integrate `register_plugin_hook` and `emit_plugin_hook`
  - Implement hook types: `on_file_changed`, `before_recompile`, `after_compile`
  - Add hook handler registration with IDs
  - Implement hook data serialization
  - Test hook execution order and data passing
  - Estimate: 3 hours
  - Dependencies: 3.1

- [x] 3.4 Integrate watch with compiler and test end-to-end (Requirement 2.1, 2.18-2.20)
  - Connect watch system to compilation pipeline
  - Implement debouncing for rapid file changes
  - Add error recovery to keep watch running on compile failures
  - Test end-to-end latency < 200ms from file change to recompile
  - Test with 100+ watched files
  - Estimate: 4 hours
  - Dependencies: 3.1, 3.3

### Phase 4: ID Registry (3 tasks) - 9 hours
Implement component ID tracking for reproducible builds.

- [x] 4.1 Implement ID registry creation and lookup (Requirement 3.1-3.3)
  - Integrate `id_registry_create` and `id_registry_lookup`
  - Implement `id_registry_generate` for stable ID generation
  - Add `id_registry_next` for sequential ID allocation
  - Implement O(1) lookup with proper indexing
  - Test idempotence of lookup operations
  - Estimate: 3 hours
  - Dependencies: 1.2, 1.3

- [x] 4.2 Implement property/value mapping (Requirement 3.4-3.10)
  - Integrate `register_property_name` and `register_value_name`
  - Implement reverse lookups: `property_id_to_string`, `value_id_to_string`
  - Add `reverse_lookup_property` and `reverse_lookup_value`
  - Implement stable mapping for CSS properties and values
  - Test round-trip conversions
  - Estimate: 2 hours
  - Dependencies: 4.1

- [x] 4.3 Implement serialization and reproducibility (Requirement 3.11-3.20)
  - Integrate `id_registry_snapshot`, `id_registry_export`, `id_registry_import`
  - Implement JSON export format for portability
  - Add `id_registry_reset` and `id_registry_destroy`
  - Implement `id_registry_active_count` for monitoring
  - Test export/import preserves IDs across processes
  - Test performance with 10K+ entries
  - Test concurrent registry isolation
  - Estimate: 4 hours
  - Dependencies: 4.1

### Phase 5: Incremental Compilation (3 tasks) - 9 hours
Implement change detection and incremental rebuild for fast recompiles.

- [x] 5.1 Implement file fingerprinting and change detection (Requirement 4.1-4.5)
  - Integrate `create_fingerprint` for content hashing
  - Integrate `process_file_change` for change analysis
  - Implement `compute_incremental_diff` for diff computation
  - Add affected class tracking
  - Test change detection accuracy
  - Estimate: 3 hours
  - Dependencies: 1.2, 1.3

- [x] 5.2 Implement incremental rebuild and state management (Requirement 4.6-4.9)
  - Integrate `rebuild_workspace_result` for incremental rebuild
  - Implement `prune_stale_entries` for cache cleanup
  - Add `inject_state_hash` for state tracking
  - Integrate `scan_files_batch_native` for batch processing
  - Test rebuild performance (< 500ms for single file in large project)
  - Estimate: 3 hours
  - Dependencies: 5.1

- [x] 5.3 Implement streaming and memory management (Requirement 4.10-4.15)
  - Implement CSS streaming architecture
  - Add progressive CSS output
  - Ensure memory remains bounded during multiple builds
  - Implement garbage collection triggers
  - Test streaming first chunk < 200ms
  - Test memory stability across 10+ incremental builds
  - Estimate: 3 hours
  - Dependencies: 5.2

### Phase 6: Theme Resolution (2 tasks) - 6 hours
Implement advanced multi-layer theme composition.

- [x] 6.1 Implement theme resolution and validation (Requirement 5.1-5.7)
  - Integrate `resolve_variants` and `validate_variant_config`
  - Integrate `resolve_cascade` for theme merging
  - Integrate `resolve_class_names` for class mapping
  - Implement `resolve_theme_value` for key path lookup
  - Implement `resolve_conflict_group` for conflict resolution
  - Test variant resolution and precedence
  - Estimate: 3 hours
  - Dependencies: 1.2, 1.3

- [x] 6.2 Implement theme caching and composition (Requirement 5.8-5.15)
  - Integrate `resolve_simple_variants` for fast path
  - Add caching layer for resolved themes
  - Implement cache invalidation on theme changes
  - Add circular dependency detection
  - Test batch resolution (1000 classes) < 50ms
  - Test cached lookups < 1ms
  - Test composition with multiple layers
  - Estimate: 3 hours
  - Dependencies: 6.1

### Phase 7: CSS Optimization (3 tasks) - 9 hours
Implement dead code elimination and CSS minification.

- [x] 7.1 Implement dead code detection and elimination (Requirement 6.1-6.5)
  - Integrate `detectDeadCode` for dead code analysis
  - Integrate `eliminateDeadCss` for CSS removal
  - Implement CSS parsing and class extraction
  - Add dead code percentage calculation
  - Test detection accuracy and false positive rate
  - Estimate: 3 hours
  - Dependencies: 1.2, 1.3

- [x] 7.2 Implement CSS optimization pipeline (Requirement 6.6-6.10)
  - Integrate `optimizeCss` for end-to-end optimization
  - Integrate LightningCSS for minification
  - Implement optimization report generation
  - Add incremental optimization support
  - Test typical project: 500KB → 50KB after dead code elimination
  - Test deterministic optimization results
  - Estimate: 3 hours
  - Dependencies: 7.1

- [x] 7.3 Implement atomic CSS generation (Requirement 7.1-7.6)
  - Integrate `parseAtomicClass` for atomic parsing
  - Integrate `toAtomicClasses` for batch conversion
  - Implement atomic registry with `atomicRegistrySize` and `clearAtomicRegistry`
  - Add single-property class generation
  - Test deduplication (30-50% reduction)
  - Estimate: 3 hours
  - Dependencies: 1.2

### Phase 8: Component Analysis (1 task) - 3 hours
Implement usage analytics and impact tracking.

- [x] 8.1 Implement component usage analysis (Requirement 8.1-8.4)
  - Extract component usage statistics from source files
  - Identify unused components
  - Build component dependency graph
  - Calculate bundle impact per component
  - Implement analysis report generation
  - Test accuracy with sample project
  - Estimate: 3 hours
  - Dependencies: 1.2, 1.3

### Phase 9: Integration and Testing (3 tasks) - 20 hours
Integrate all subsystems and create comprehensive tests.

- [x] 9.1 Integrate all subsystems into compiler pipeline (All Requirements)
  - Wire up all 8 managers into main compilation flow
  - Implement feature flags for enabling/disabling features
  - Add configuration loading from `tailwind.config.js`
  - Implement fallback logic when features unavailable
  - Test feature interactions (watch + incremental + optimization)
  - Create integration test suite
  - Estimate: 8 hours
  - Dependencies: 2.6, 3.4, 4.3, 5.3, 6.2, 7.3, 8.1

- [x] 9.2 Create comprehensive property-based tests (All Requirements)
  - Write PBT for all manager classes
  - Test invariants: idempotence, consistency, edge cases
  - Create generators for complex data types
  - Test with representative workloads
  - Verify all acceptance criteria covered
  - Estimate: 7 hours
  - Dependencies: 9.1

- [x] 9.3 Performance verification and benchmarking (All Requirements)
  - Benchmark Redis cache (60-80% build time reduction)
  - Benchmark watch system (< 200ms latency)
  - Benchmark incremental compilation (< 500ms single file)
  - Benchmark theme resolution (< 50ms batch, < 1ms cached)
  - Benchmark CSS optimization (90%+ size reduction)
  - Run benchmarks on representative projects
  - Create performance regression tests
  - Estimate: 5 hours
  - Dependencies: 9.1

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "wave": "Foundation Setup",
      "tasks": ["1.1", "1.2", "1.3", "1.4"],
      "description": "Establish core infrastructure and type definitions",
      "estimatedHours": 12,
      "dependencies": []
    },
    {
      "id": 1,
      "wave": "Redis Distribution",
      "tasks": ["2.1", "2.2", "2.3", "2.4", "2.5", "2.6"],
      "description": "Implement multi-machine cache sharing with Redis",
      "estimatedHours": 18,
      "dependencies": [0]
    },
    {
      "id": 2,
      "wave": "Watch System",
      "tasks": ["3.1", "3.2", "3.3", "3.4"],
      "description": "Implement file monitoring with auto-recompile and hooks",
      "estimatedHours": 12,
      "dependencies": [0]
    },
    {
      "id": 3,
      "wave": "ID Registry",
      "tasks": ["4.1", "4.2", "4.3"],
      "description": "Implement component ID tracking for reproducible builds",
      "estimatedHours": 9,
      "dependencies": [0]
    },
    {
      "id": 4,
      "wave": "Incremental Compilation",
      "tasks": ["5.1", "5.2", "5.3"],
      "description": "Implement change detection and incremental rebuild",
      "estimatedHours": 9,
      "dependencies": [0]
    },
    {
      "id": 5,
      "wave": "Theme Resolution",
      "tasks": ["6.1", "6.2"],
      "description": "Implement advanced multi-layer theme composition",
      "estimatedHours": 6,
      "dependencies": [0]
    },
    {
      "id": 6,
      "wave": "CSS Optimization",
      "tasks": ["7.1", "7.2", "7.3"],
      "description": "Implement dead code elimination and CSS minification",
      "estimatedHours": 9,
      "dependencies": [0]
    },
    {
      "id": 7,
      "wave": "Component Analysis",
      "tasks": ["8.1"],
      "description": "Implement usage analytics and impact tracking",
      "estimatedHours": 3,
      "dependencies": [0]
    },
    {
      "id": 8,
      "wave": "Integration & Testing",
      "tasks": ["9.1", "9.2", "9.3"],
      "description": "Integrate all subsystems and create comprehensive tests",
      "estimatedHours": 20,
      "dependencies": [1, 2, 3, 4, 5, 6, 7]
    }
  ]
}
```

### Parallelization Opportunities

**Parallel Streams (can run simultaneously):**

1. **Stream A: Foundation** (Phases 1)
   - Duration: 12 hours
   - Critical path for all other phases

2. **Stream B: Redis & Watch** (Phases 2-3)
   - Can start after Phase 1 complete
   - No dependencies between Redis and Watch
   - Duration: 30 hours (12 after Phase 1)

3. **Stream C: ID Registry & Incremental** (Phases 4-5)
   - Can start after Phase 1 complete
   - ID Registry independent of Incremental
   - Duration: 18 hours (parallel)

4. **Stream D: Theme & Optimization** (Phases 6-7)
   - Can start after Phase 1 complete
   - Theme independent of Optimization
   - Duration: 15 hours (parallel)

5. **Stream E: Analysis** (Phase 8)
   - Can start after Phase 1 complete
   - Independent of other modules
   - Duration: 3 hours

6. **Stream F: Integration** (Phase 9)
   - Must wait for all other phases
   - Duration: 20 hours
   - Critical final phase

**Recommended Execution Order:**

```
Week 1: Phase 1 (12 hrs) - Foundation
  ↓
Week 2-3: Phases 2-8 in parallel (47 hours)
  - Stream B: Redis (18 hrs) + Watch (12 hrs) = 30 hrs
  - Stream C: ID Registry (9 hrs) + Incremental (9 hrs) = 18 hrs [parallel]
  - Stream D: Theme (6 hrs) + Optimization (9 hrs) = 15 hrs [parallel]
  - Stream E: Analysis (3 hrs) [parallel]
  ↓
Week 4: Phase 9 (20 hrs) - Integration & Testing
  ↓
Total: ~127 hours (~4 weeks at 40hrs/week or 8 weeks at 20hrs/week)
```

**Critical Path:** Phase 1 → Phase 2+3+4+5+6+7+8 → Phase 9 (68 hours minimum)

---

## Effort Estimates Summary

| Phase | Tasks | Hours | Est. Days | Critical? |
|-------|-------|-------|-----------|-----------|
| Phase 1: Foundation | 4 | 12 | 1.5 | 🔴 YES |
| Phase 2: Redis | 6 | 18 | 2.25 | 🔴 YES |
| Phase 3: Watch | 4 | 12 | 1.5 | 🔴 YES |
| Phase 4: ID Registry | 3 | 9 | 1.125 | 🟡 |
| Phase 5: Incremental | 3 | 9 | 1.125 | 🟡 |
| Phase 6: Theme | 2 | 6 | 0.75 | 🟡 |
| Phase 7: Optimization | 3 | 9 | 1.125 | 🟡 |
| Phase 8: Analysis | 1 | 3 | 0.375 | 🟢 |
| Phase 9: Integration | 3 | 20 | 2.5 | 🔴 YES |
| **TOTAL** | **31** | **127** | **12** | |

---

## Notes

### Execution Strategy

**Recommended Development Approach:**

1. **Sequential Foundation** (Week 1, 12 hours)
   - Complete Phase 1 entirely before starting other work
   - Establishes type system and NativeBridge for all downstream work
   - Enables parallel development in Week 2-3

2. **Parallel Modules** (Weeks 2-3, ~47 hours)
   - Assign 2-3 developers to different module streams
   - Stream B: Redis + Watch (high complexity, 30 hrs)
   - Stream C: ID Registry + Incremental (medium complexity, 18 hrs)
   - Stream D: Theme + Optimization (medium complexity, 15 hrs)
   - Stream E: Analysis (low complexity, 3 hrs)
   - All streams work in parallel after Phase 1

3. **Sequential Integration** (Week 4, 20 hours)
   - All modules must be complete before starting
   - Creates integration test harness
   - Runs performance benchmarks
   - Validates cross-module interactions

### Key Constraints

**Build System Dependencies:**
- All TypeScript changes must compile successfully
- NativeBridge updates must match Rust function signatures exactly
- Type definitions must be exported from `packages/domain/compiler/src/index.ts`

**Testing Requirements:**
- All new functions must have unit tests
- Property-based tests required for all managers
- Integration tests for cross-module interactions
- Performance benchmarks to verify targets

**Configuration Management:**
- Redis, watch, and other features must read from `tailwind.config.js`
- Sensible defaults must be provided for all options
- Features must be independently enable/disable-able
- Backward compatibility required (existing configs must work)

**Documentation Requirements:**
- All 63 functions must have JSDoc comments
- Each manager class must have usage examples
- Configuration guide for enabling features
- Migration guide for existing projects

### Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| NativeBridge integration issues | Medium | High | Early testing of function signatures in Phase 1 |
| Redis connection reliability | Medium | High | Comprehensive fallback to local caching |
| Watch system file descriptor limits | Low | Medium | Monitor handle count, add cleanup |
| Performance targets not met | Low | High | Benchmark continuously, optimize incrementally |
| Cross-module integration issues | Medium | Medium | Extensive integration testing in Phase 9 |

### Quality Assurance Checkpoints

**Phase 1 Checkpoint (12 hours):**
- ✓ All type definitions complete and accurate
- ✓ All 63 NativeBridge functions exported
- ✓ Manager base classes working
- ✓ Error handling in place

**Phase 2-8 Checkpoint (each 3-6 hours per module):**
- ✓ Core functions integrated
- ✓ Unit tests passing
- ✓ Performance benchmarks meet targets
- ✓ Documentation complete

**Phase 9 Checkpoint (20 hours):**
- ✓ All modules integrated successfully
- ✓ Cross-module interactions working
- ✓ Comprehensive test suite passing
- ✓ Performance benchmarks verified
- ✓ Documentation complete and examples working

### Success Criteria

The implementation is complete when:

1. **All 63 Rust functions are used** in TypeScript code
2. **Redis caching** reduces distributed build time by 60-80%
3. **Watch system** provides file change detection < 100ms and recompile < 200ms
4. **ID Registry** ensures reproducible builds across machines
5. **Incremental compilation** achieves < 500ms rebuild for single file in large projects
6. **Theme resolution** completes batch of 1000 classes in < 50ms
7. **CSS optimization** reduces output by 90%+ through dead code elimination
8. **All features** are independently enable/disable-able
9. **All acceptance criteria** from requirements.md are satisfied
10. **Comprehensive test suite** passes with 90%+ coverage

### Implementation Tips

- Start with Phase 1 early to unblock parallel work
- Use feature flags to enable/disable new functionality during development
- Create mock Rust functions for early TypeScript development if needed
- Test integration frequently to catch cross-module issues early
- Run performance benchmarks regularly to ensure targets are met
- Document as you go, especially for complex systems like Redis and Watch

---

## Feature Flags

For development and gradual rollout, implement these feature flags in `tailwind.config.js`:

```typescript
// Feature flag configuration
features: {
  redis: {
    enabled: false,           // Default disabled for backward compatibility
    host: 'localhost',
    port: 6379,
    poolSize: 10,
    ttlSeconds: 604800
  },
  watch: {
    enabled: false,           // Default disabled
    debounceMs: 100,
    gitignoreAware: true
  },
  idRegistry: {
    enabled: false,           // Default disabled
    autoExport: false
  },
  incremental: {
    enabled: false,           // Default disabled
    streaming: false
  },
  themeResolution: {
    enabled: false,           // Default disabled
    cacheSize: 1000
  },
  optimization: {
    enabled: true,            // Dead code elimination, default enabled
    atomicCss: false,         // Atomic CSS mode, default disabled
    minify: true              // LightningCSS minification
  },
  analysis: {
    enabled: false,           // Default disabled
    reportPath: './analysis'
  }
}
```

---

## Appendix: Function Reference Map

### Phase 1: Foundation (4 Type Definition Areas)
- Redis functions (40)
- Watch functions (20)
- ID Registry functions (16)
- Incremental functions (8)
- Theme functions (7)
- Optimization functions (12)
- Atomic CSS functions (6)
- Analysis functions (8)

### All 63 Functions Grouped by Phase

**Phase 2 Redis (40 functions):**
`redis_pool_connect`, `redis_cache_get`, `redis_cache_set`, `redis_cache_delete`, `redis_cache_exists`, `redis_cache_size`, `redis_cache_key_count`, `redis_cache_hit_rate`, `redis_cache_clear`, `redis_enable_cluster`, `redis_cache_sync`, `redis_set_eviction_policy`, `redis_enable_persistence`, `redis_enable_cache_warming`, `redis_replicate`, `redis_monitor`, `redis_diagnostics`, `redis_memory_stats`, `redis_expiration_set`, `redis_publish`, `redis_subscribe`, + 19 supporting functions

**Phase 3 Watch (20 functions):**
`start_watch`, `stop_watch`, `poll_watch_events`, `watch_add_pattern`, `watch_remove_pattern`, `watch_pause`, `watch_resume`, `get_watch_stats`, `watch_get_active_handles`, `watch_clear_all`, `register_plugin_hook`, `emit_plugin_hook`, `is_watch_running`, + 7 supporting functions

**Phase 4 ID Registry (16 functions):**
`id_registry_create`, `id_registry_generate`, `id_registry_lookup`, `id_registry_next`, `register_property_name`, `register_value_name`, `property_id_to_string`, `value_id_to_string`, `reverse_lookup_property`, `reverse_lookup_value`, `id_registry_snapshot`, `id_registry_export`, `id_registry_import`, `id_registry_reset`, `id_registry_destroy`, `id_registry_active_count`

**Phase 5 Incremental (8 functions):**
`process_file_change`, `compute_incremental_diff`, `create_fingerprint`, `rebuild_workspace_result`, `prune_stale_entries`, `inject_state_hash`, `scan_files_batch_native`, + 1 supporting function

**Phase 6 Theme (7 functions):**
`resolve_variants`, `validate_variant_config`, `resolve_cascade`, `resolve_class_names`, `resolve_conflict_group`, `resolve_theme_value`, `resolve_simple_variants`

**Phase 7 Optimization (12 functions):**
`detectDeadCode`, `eliminateDeadCss`, `optimizeCss`, `processTailwindCssLightning`, `processTailwindCssWithTargets`, `parseAtomicClass`, `generateAtomicCss`, `toAtomicClasses`, `clearAtomicRegistry`, `getAtomicRegistrySize`, + 2 supporting functions

**Phase 8 Analysis (8 functions):**
`analyzeClassUsage`, `calculateImpact`, `calculateRisk`, `calculateSavings`, `identifyUnused`, `buildDependencyGraph`, + 2 supporting functions

**Phase 9 Integration (no new functions, all 63 are integrated)**

---

## Updates from Design Document

These tasks implement all requirements from `requirements.md` and all architecture patterns from `design.md`:

- ✓ All 9 acceptance criteria categories covered (Phases 1-8)
- ✓ All cross-cutting concerns addressed (Phase 9)
- ✓ All performance requirements validated (Phase 9)
- ✓ All reliability requirements tested (Phase 9)
- ✓ All documentation requirements scheduled (Phase 9)
- ✓ Backward compatibility preserved (all phases)
- ✓ Feature flags for gradual rollout (all phases)
