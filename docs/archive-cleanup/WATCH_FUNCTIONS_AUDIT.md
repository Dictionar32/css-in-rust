# 👁️ Watch System Functions Audit

**Executive Summary**: All 9 file watching functions are exported and wrapped but NOT integrated into WatchManager. This is a critical gap requiring immediate integration.

---

## 📋 Watch Functions Overview

### Module: napi_bridge_watch.rs
**Location**: `native/src/infrastructure/napi_bridge_watch.rs`
**Total Functions**: 9 exported + 3 internal helpers
**Export Status**: ✅ All #[napi] decorated
**Wrapper Status**: ✅ All wrapped in nativeBridgeWrappers.ts
**Manager Integration**: ❌ NONE - Critical gap

---

## 🔴 Critical Status: NOT INTEGRATED

### Current Situation
1. ✅ All 9 functions fully implemented in Rust
2. ✅ All 9 functions exported via NAPI decorators
3. ✅ All 9 functions wrapped in TypeScript wrappers
4. ❌ **ZERO integration** into WatchManager
5. ❌ Watch system appears to be completely non-functional

### Impact
- File watching feature is broken or non-functional
- Change detection depends on polling instead of real-time events
- Development experience degraded (longer recompile cycles)
- Build performance compromised

---

## 📊 Watch Functions Inventory

### Core Watch Control Functions (4)

#### 1. `watch_files()`
```rust
pub fn watch_files(root_dir: String, options_json: Option<String>) -> napi::Result<String>
```

**Purpose**: Start file watching on a directory

**Parameters**:
- `root_dir: String` - Root directory path to start watching
- `options_json: Option<String>` - Optional JSON configuration
  - `recursive: bool` - Watch subdirectories (default: true)
  - `ignored_patterns: string[]` - Glob patterns to ignore
  - `max_queue_size: u32` - Maximum events to queue (default: 1000)

**Returns**: JSON object with:
```json
{
  "status": "ok",
  "handle_id": 0,
  "message": "Watch started for directory: /path",
  "directory": "/path",
  "recursive": true
}
```

**Usage in WatchManager**: ❌ NOT USED
- Should be called in `startWatch()` method
- Should store handle_id for later reference

**TypeScript Wrapper**: ✅ Exists
```typescript
export const start_watch = (rootPath: string, patterns?: string[]): number
```

---

#### 2. `stop_watching()`
```rust
pub fn stop_watching(handle_id: u32) -> napi::Result<String>
```

**Purpose**: Stop file watching for a specific handle

**Parameters**:
- `handle_id: u32` - Watch handle ID returned from watch_files()

**Returns**: JSON object with:
```json
{
  "status": "ok",
  "message": "Watch stopped",
  "handle_id": 0,
  "active_watches_remaining": 0
}
```

**Usage in WatchManager**: ❌ NOT USED
- Should be called in `stopWatch()` method
- Should decrement active watch counter

**TypeScript Wrapper**: ✅ Exists
```typescript
export const stop_watch = (handle: number): number
```

---

#### 3. `get_watch_stats()`
```rust
pub fn get_watch_stats() -> napi::Result<String>
```

**Purpose**: Get current watch system status and statistics

**Returns**: JSON object with:
```json
{
  "status": "ok",
  "is_running": true,
  "active_handles": 2,
  "active_patterns": 15,
  "events_processed": 150,
  "events_dropped": 0,
  "files_watched": 1245,
  "health": "healthy"
}
```

**Metrics Provided**:
- `is_running` - Whether watch system is active
- `active_handles` - Number of active watch handles
- `active_patterns` - Number of active file patterns
- `events_processed` - Total events handled
- `events_dropped` - Events dropped due to queue overflow
- `files_watched` - Total files in all watches
- `health` - System health status ("healthy"/"idle"/"degraded")

**Usage in WatchManager**: ❌ NOT USED
- Should be called in `getStats()` method
- Would provide real-time system diagnostics

**TypeScript Wrapper**: ✅ Exists
```typescript
export const get_watch_stats = (): WatchStats
```

---

#### 4. `clear_watch_stats()`
```rust
pub fn clear_watch_stats() -> napi::Result<String>
```

**Purpose**: Reset watch statistics counters

**Returns**: JSON object with:
```json
{
  "status": "ok",
  "message": "Watch statistics reset successfully"
}
```

**Side Effects**:
- Resets event counters to 0
- Clears statistics without stopping watches
- Useful for benchmarking or performance testing

**Usage in WatchManager**: ❌ NOT USED
- Could be called in `resetStats()` method
- Useful for performance measurements

**TypeScript Wrapper**: ✅ Exists (poll_watch_events)

---

### Event Polling Functions (2)

#### 5. `get_watch_events()`
```rust
pub fn get_watch_events(handle_id: u32, max_events: Option<u32>) -> napi::Result<String>
```

**Purpose**: Poll accumulated file system events from watch

**Parameters**:
- `handle_id: u32` - Watch handle ID to poll events from
- `max_events: Option<u32>` - Maximum events to return (default: 100)

**Returns**: JSON object with:
```json
{
  "status": "ok",
  "handle_id": 0,
  "events": [
    {
      "kind": "modify|create|delete|rename",
      "path": "/path/to/file"
    }
  ],
  "count": 0
}
```

**Event Types**:
- `create` - File/directory created
- `modify` - File modified
- `delete` - File deleted
- `rename` - File renamed

**Usage in WatchManager**: ❌ NOT USED - CRITICAL
- **ESSENTIAL** for file watching to work
- Should be polled regularly in `pollEvents()` method
- Events drive recompilation

**TypeScript Wrapper**: ✅ Exists
```typescript
export const poll_watch_events = (handle: number, timeoutMs?: number): WatchEvent[]
```

**Impact of Non-Integration**: 🔴 **CRITICAL** - Without this, watch system cannot detect changes

---

#### 6. `get_watch_performance()`
```rust
pub fn get_watch_performance() -> napi::Result<String>
```

**Purpose**: Get detailed watch system performance metrics

**Returns**: JSON object with:
```json
{
  "status": "ok",
  "watch_stats": {
    "events_processed": 1500,
    "events_dropped": 0,
    "total_events": 1500,
    "drop_rate_percent": 0.0,
    "files_watched": 2400
  },
  "active_stats": {
    "active_handles": 3,
    "active_patterns": 45,
    "is_running": true
  },
  "efficiency": {
    "avg_events_per_poll": 500.0,
    "health_score": "excellent"
  }
}
```

**Metrics Provided**:
- Event processing statistics
- Drop rate (quality metric)
- Active handles and patterns
- Average events per poll (throughput)
- Health score assessment

**Usage in WatchManager**: ❌ NOT USED
- Could be used in `getPerformanceMetrics()` method
- Provides performance diagnostics

**TypeScript Wrapper**: ✅ Exists
```typescript
// Part of get_watch_stats() return value
```

---

### Configuration Functions (3)

#### 7. `get_active_watches()`
```rust
pub fn get_active_watches() -> napi::Result<u32>
```

**Purpose**: Get number of currently active watch handles

**Returns**: `u32` - Count of active watches

**Usage in WatchManager**: ❌ NOT USED
- Should be called in `getActiveCount()` method
- Provides simple count metric

**TypeScript Wrapper**: ✅ Exists
```typescript
export const watch_get_active_handles = (): number[]
```

---

#### 8. `set_watch_metrics()`
```rust
pub fn set_watch_metrics(metric_name: String, value: String) -> napi::Result<String>
```

**Purpose**: Set watch system metrics

**Parameters**:
- `metric_name: String` - Name of the metric to set
- `value: String` - Value to set (as JSON)

**Supported Metrics**:
- `max_queue_size` - Maximum event queue size
- `poll_timeout` - Poll timeout in milliseconds
- `aggregation_window` - Event aggregation window
- `buffer_size` - Internal buffer size

**Returns**: JSON object with:
```json
{
  "status": "ok",
  "metric": "max_queue_size",
  "value": "5000",
  "message": "Metric updated"
}
```

**Usage in WatchManager**: ❌ NOT USED
- Could be used in `setMetric()` method
- Allows runtime configuration

**TypeScript Wrapper**: ✅ Exists
```typescript
export const set_watch_metrics = (metric_name: String, value: String): String
```

---

#### 9. `set_watch_aggregation()`
```rust
pub fn set_watch_aggregation(aggregation_type: String) -> napi::Result<String>
```

**Purpose**: Set watch event aggregation mode

**Parameters**:
- `aggregation_type: String` - Type of aggregation:
  - `"none"` - No aggregation (all events immediately)
  - `"batched"` - Batch events into groups
  - `"deduped"` - Deduplicate consecutive events

**Returns**: JSON object with:
```json
{
  "status": "ok",
  "aggregation_type": "batched",
  "message": "Aggregation mode set"
}
```

**Aggregation Modes**:
- **none**: Every file change triggers event (high CPU)
- **batched**: Group events by time window (recommended)
- **deduped**: Remove duplicate consecutive changes (compact)

**Usage in WatchManager**: ❌ NOT USED
- Should be called in `setAggregationMode()` method
- Allows tuning for performance vs responsiveness

**TypeScript Wrapper**: ✅ Exists
```typescript
export const set_watch_aggregation = (aggregationMode: String): String
```

---

### Internal Helper Functions (3)

These are utility functions used internally:

#### `track_event_processed()`
```rust
#[inline]
pub fn track_event_processed()
```
Increments event counter - called internally when event is processed

#### `track_event_dropped()`
```rust
#[inline]
pub fn track_event_dropped()
```
Increments dropped event counter - called internally when queue overflows

#### `track_file_watched()`
```rust
#[inline]
pub fn track_file_watched()
```
Increments file counter - called internally when new file is watched

---

## 🗂️ WatchManager Current Status

**Location**: `packages/domain/compiler/src/managers/WatchManager.ts`

### Current Implementation
The WatchManager exists but does NOT call any Rust watch functions. It appears to be a stub or incomplete implementation.

### Methods That Need Integration

| Method | Should Call | Current Status |
|--------|------------|-----------------|
| `startWatch()` | `watch_files()` | ❌ Empty |
| `stopWatch()` | `stop_watching()` | ❌ Empty |
| `getStats()` | `get_watch_stats()` | ❌ Empty |
| `pollEvents()` | `get_watch_events()` | ❌ Empty |
| `getPerformance()` | `get_watch_performance()` | ❌ Empty |
| `resetStats()` | `clear_watch_stats()` | ❌ Empty |
| `setAggregation()` | `set_watch_aggregation()` | ❌ Empty |
| `setMetrics()` | `set_watch_metrics()` | ❌ Empty |

---

## 🎯 Integration Requirements

### Minimum Viable Integration (MVP)
To get file watching working, need to integrate:

1. ✅ `watch_files()` - Start watching
2. ✅ `stop_watching()` - Stop watching
3. ✅ `get_watch_events()` - **CRITICAL** - Poll for changes
4. ✅ `clear_watch_stats()` - Reset stats (optional but recommended)

**Effort**: 1-2 days

### Full Integration
Complete feature-rich implementation:

1. ✅ All 9 functions
2. ✅ Error handling and recovery
3. ✅ Performance monitoring
4. ✅ Configuration tuning
5. ✅ Event aggregation modes

**Effort**: 2-3 days

---

## 🚀 Integration Implementation Plan

### Step 1: Basic Watch Lifecycle (Day 1)

```typescript
// WatchManager method: startWatch()
startWatch(rootDir: string, options?: WatchOptions): WatchHandle {
  const config = JSON.stringify({
    recursive: options?.recursive ?? true,
    ignored_patterns: options?.ignore ?? [],
    max_queue_size: options?.maxQueueSize ?? 1000,
  });
  
  const result = JSON.parse(start_watch(rootDir, config));
  return new WatchHandle(result.handle_id);
}

// WatchManager method: stopWatch()
stopWatch(handle: WatchHandle): void {
  stop_watch(handle.id);
}

// WatchManager method: pollEvents()
async pollEvents(handle: WatchHandle): Promise<WatchEvent[]> {
  return poll_watch_events(handle.id, 100);
}
```

### Step 2: Statistics and Monitoring (Day 1-2)

```typescript
// WatchManager method: getStats()
getStats(): WatchStats {
  return get_watch_stats();
}

// WatchManager method: resetStats()
resetStats(): void {
  clear_watch_stats();
}

// WatchManager method: getPerformance()
getPerformance(): PerformanceMetrics {
  return get_watch_performance();
}
```

### Step 3: Configuration (Day 2)

```typescript
// WatchManager method: setAggregation()
setAggregation(mode: 'none' | 'batched' | 'deduped'): void {
  set_watch_aggregation(mode);
}

// WatchManager method: setMetrics()
setMetrics(metric: string, value: string): void {
  set_watch_metrics(metric, value);
}
```

### Step 4: Error Recovery and Connection Handling (Day 2-3)

```typescript
// WatchManager: Connection management
- Detect watch system disconnection
- Auto-reconnect with exponential backoff
- Graceful degradation if watch fails
- Fallback to polling if watch unavailable
```

---

## 📊 Function Dependency Graph

```
Watch System Initialization
├─ watch_files()          [START WATCH]
│  └─ Sets up file monitoring
│     └─ Returns handle_id
│
├─ set_watch_aggregation()
│  └─ Configures event aggregation
│
├─ set_watch_metrics()
│  └─ Configures system metrics
│
└─ Event Loop (Continuous)
   ├─ get_watch_events()  [POLL EVENTS]
   │  └─ Returns changed files
   │
   ├─ get_watch_stats()   [OPTIONAL STATS]
   │  └─ Returns system status
   │
   └─ get_watch_performance()
      └─ Returns detailed metrics

Watch System Shutdown
└─ stop_watching()        [STOP WATCH]
   └─ Cleanup and release resources
```

---

## 🔍 Testing Requirements

### Unit Tests Needed

1. **Watch Initialization**
   - Test `watch_files()` with valid path
   - Test with invalid path (error handling)
   - Test with options configuration
   - Verify handle_id returned

2. **Event Polling**
   - Create watch, modify file, poll events
   - Verify events contain correct file paths
   - Test with max_events limit
   - Test empty event queue

3. **Stop Watch**
   - Verify `stop_watching()` closes handle
   - Verify no events after stop
   - Verify cleanup

4. **Statistics**
   - Test `get_watch_stats()` tracking
   - Verify event counters increment
   - Test `clear_watch_stats()` reset

5. **Configuration**
   - Test `set_watch_aggregation()` modes
   - Test `set_watch_metrics()` parameters
   - Verify behavior changes with config

### Integration Tests Needed

1. **Full Watch Cycle**
   - Start watch on test directory
   - Create/modify/delete files
   - Poll and verify events
   - Stop watch

2. **Performance**
   - Measure event latency
   - Verify drop rate is acceptable
   - Check memory usage

3. **Error Recovery**
   - Simulate watch failure
   - Verify error handling
   - Test reconnection

---

## 📈 Performance Considerations

### Expected Performance
- **Event latency**: < 100ms from file change to event
- **Drop rate**: < 1% under normal load
- **Memory overhead**: ~1-2 MB per active watch
- **CPU usage**: < 5% per watch handle

### Optimization Opportunities
- Use `set_watch_aggregation("batched")` for high-frequency changes
- Increase `max_queue_size` for large projects
- Use `ignored_patterns` to reduce events
- Monitor `drop_rate_percent` to detect bottlenecks

---

## ⚠️ Known Issues and Considerations

### Current Limitations
1. Watch system is completely non-functional (not integrated)
2. No event queue management in TypeScript
3. No connection resilience or reconnection logic
4. No graceful degradation if watch fails

### Potential Issues During Integration
1. Event buffer overflow under heavy file changes
2. Race conditions between watches
3. Path normalization differences (Windows vs Unix)
4. Memory leaks from un-closed watch handles

### Mitigation Strategies
1. Implement queue overflow detection and alerting
2. Add watch handle tracking and cleanup
3. Normalize paths on all platforms
4. Add resource cleanup on errors

---

## ✅ Integration Checklist

- [ ] Understand all 9 watch functions
- [ ] Review current WatchManager stub
- [ ] Implement basic watch lifecycle (watch_files, stop_watching)
- [ ] Implement event polling (get_watch_events)
- [ ] Add error handling and recovery
- [ ] Implement statistics tracking
- [ ] Add configuration methods
- [ ] Write comprehensive tests
- [ ] Performance benchmarking
- [ ] Documentation update
- [ ] Code review and approval
- [ ] Merge and release

---

## 📚 Related Documents

- Main Audit: `RUST_FUNCTIONS_INTEGRATION_AUDIT.md`
- Implementation Roadmap: `RUST_FUNCTIONS_IMPLEMENTATION_ROADMAP.md`
- Integration Matrix: `INTEGRATION_STATUS_MATRIX.csv`

---

**Status**: 🔴 CRITICAL - Watch system completely non-functional
**Priority**: 🔴 HIGH - Essential for development experience
**Estimated Effort**: 2-3 days for full integration
**Risk**: HIGH - Core functionality missing

**Next Action**: Begin WatchManager integration immediately
