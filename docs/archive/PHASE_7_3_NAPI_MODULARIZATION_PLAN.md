# Phase 7.3: NAPI Bridge Modularization - Implementation Plan

**Date:** June 11, 2026  
**Status:** 📋 PLANNING - Strategy defined, implementation starting  
**Objective:** Break 1200+ LOC monolithic `napi_bridge.rs` into focused modules

---

## Current State

**File:** `native/src/infrastructure/napi_bridge.rs` (1200+ LOC)

**Contains:**
- 130+ NAPI functions
- 9 major concerns mixed together:
  - CSS generation (150 LOC)
  - Class parsing (100 LOC)
  - Theme resolution (150 LOC)
  - Cache management (200 LOC)
  - Redis operations (300 LOC)
  - Analysis functions (100 LOC)
  - Marshalling utilities (scattered)
  - Error handling (scattered)
  - Watch system (200+ LOC)

**Problems with monolithic approach:**
- ❌ Hard to find related functions
- ❌ Difficult to test individual concerns
- ❌ Code reuse scattered
- ❌ Maintenance burden
- ❌ Cognitive load for developers

---

## Modularization Strategy

### Approach: Gradual inline module extraction

Instead of creating subdirectories (which causes module resolution issues), create focused modules **inline** within the same infrastructure folder using consistent naming:

```
native/src/infrastructure/
├── napi_bridge.rs (original - remains as main entry point)
├── napi_bridge_marshalling.rs (new)
├── napi_bridge_errors.rs (new)
├── napi_bridge_css.rs (new)
├── napi_bridge_parsing.rs (new)
├── napi_bridge_theme.rs (new)
├── napi_bridge_cache.rs (new)
├── napi_bridge_redis.rs (new)
└── napi_bridge_types.rs (new)
```

**Benefits:**
- ✅ No module resolution issues
- ✅ Easy to maintain
- ✅ Clear naming convention
- ✅ Gradual migration (no breaking changes)
- ✅ Each file <= 200 LOC

---

## Implementation Phases

### Phase 1: Extraction (This session)
1. [ ] Create `napi_bridge_types.rs` - Shared types
2. [ ] Create `napi_bridge_marshalling.rs` - JSON utilities
3. [ ] Create `napi_bridge_errors.rs` - Error handling
4. [ ] Update main `napi_bridge.rs` to use modules

### Phase 2: Modularization (Next session)
1. [ ] Create `napi_bridge_css.rs` - CSS functions
2. [ ] Create `napi_bridge_parsing.rs` - Parsing functions
3. [ ] Create `napi_bridge_theme.rs` - Theme functions
4. [ ] Create `napi_bridge_cache.rs` - Cache functions
5. [ ] Create `napi_bridge_redis.rs` - Redis functions

### Phase 3: Refactoring (Session after)
1. [ ] Consolidate shared utilities
2. [ ] Remove duplication
3. [ ] Add comprehensive module tests
4. [ ] Update documentation

### Phase 4: Verification (Final session)
1. [ ] Run full test suite
2. [ ] Verify no performance regression
3. [ ] Benchmark before/after
4. [ ] Document migration guide

---

## Module Breakdown

### napi_bridge_types.rs (~50 LOC)
```rust
pub struct CssRule { ... }
pub struct ParseResult { ... }
pub struct ThemeConfig { ... }
pub struct CacheStats { ... }
```

### napi_bridge_marshalling.rs (~100 LOC)
```rust
pub fn parse_json<T>(...) -> Result<T>
pub fn to_json<T>(...) -> Result<String>
pub fn response_ok(...) -> String
pub fn response_error(...) -> String
```

### napi_bridge_errors.rs (~80 LOC)
```rust
pub struct ErrorContext { ... }
pub fn to_napi_error(...) -> NapiError
pub fn validate_string(...) -> Result<()>
pub fn validate_number(...) -> Result<()>
```

### napi_bridge_css.rs (~150 LOC)
```rust
#[napi]
pub fn generate_css(...) -> Result<String>

#[napi]
pub fn generate_css_batch(...) -> Result<String>

#[napi]
pub fn minify_css(...) -> Result<String>

// Helper functions...
```

### napi_bridge_parsing.rs (~100 LOC)
```rust
#[napi]
pub fn parse_class(...) -> Result<String>

#[napi]
pub fn parse_classes(...) -> Result<String>

#[napi]
pub fn analyze_classes(...) -> Result<String>

// Helper functions...
```

### napi_bridge_theme.rs (~150 LOC)
```rust
#[napi]
pub fn resolve_color(...) -> Result<String>

#[napi]
pub fn resolve_spacing(...) -> Result<String>

#[napi]
pub fn resolve_font_size(...) -> Result<String>

#[napi]
pub fn apply_opacity(...) -> Result<String>

// Helper functions...
```

### napi_bridge_cache.rs (~150 LOC)
```rust
#[napi]
pub fn configure_cache_backend(...) -> Result<String>

#[napi]
pub fn get_cache_stats(...) -> Result<String>

#[napi]
pub fn get_recommended_cache_config(...) -> Result<String>

// Helper functions...
```

### napi_bridge_redis.rs (~200 LOC)
```rust
#[napi]
pub fn redis_pool_connect(...) -> Result<String>

#[napi]
pub fn redis_set(...) -> Result<String>

#[napi]
pub fn redis_get(...) -> Result<String>

// ... 15+ more functions
```

---

## Migration Path

### Step 1: Create new modules (no changes to main bridge)
```rust
// napi_bridge_types.rs
pub struct CssRule { ... }

// napi_bridge_marshalling.rs
pub fn parse_json<T>(...) { ... }

// napi_bridge_errors.rs
pub struct ErrorContext { ... }
```

### Step 2: Update main bridge to use modules
```rust
// napi_bridge.rs
mod napi_bridge_types;
mod napi_bridge_marshalling;
mod napi_bridge_errors;

use napi_bridge_types::*;
use napi_bridge_marshalling::*;
use napi_bridge_errors::*;

// Now update functions to use extracted utilities
#[napi]
pub fn generate_css(rule_json: String) -> napi::Result<String> {
    let rule: CssRule = parse_json(&rule_json, "CssRule")?;
    // ... rest of function
}
```

### Step 3: Extract function groups
```rust
// Move CSS functions to napi_bridge_css.rs
// Move parsing functions to napi_bridge_parsing.rs
// Move theme functions to napi_bridge_theme.rs
// etc.
```

### Step 4: Final structure
```rust
// napi_bridge.rs becomes a facade
pub use napi_bridge_css::*;
pub use napi_bridge_parsing::*;
pub use napi_bridge_theme::*;
pub use napi_bridge_cache::*;
pub use napi_bridge_redis::*;
```

---

## Expected Outcomes

### Code Quality
- ✅ Each module: 50-200 LOC (easily understandable)
- ✅ Single responsibility per file
- ✅ Clear separation of concerns
- ✅ Easier to test each concern

### Performance
- ✅ No runtime overhead (compile-time modules)
- ✅ Better compiler optimization (smaller compilation units)
- ✅ Same binary size (no code duplication)

### Maintainability
- ✅ Easier to find related functions
- ✅ Simpler to add new NAPI functions
- ✅ Better code organization
- ✅ Reduced cognitive load

### Timeline
- **Phase 3 (Today):** Extract utilities (types, marshalling, errors)
- **Phase 3 (Continued):** Extract main function groups
- **Phase 3 (Final):** Integration testing and verification
- **Estimate:** 2-3 hours total implementation

---

## Files to Create

| File | LOC | Purpose |
|------|-----|---------|
| `napi_bridge_types.rs` | 50 | Shared types |
| `napi_bridge_marshalling.rs` | 100 | JSON utilities |
| `napi_bridge_errors.rs` | 80 | Error handling |
| `napi_bridge_css.rs` | 150 | CSS generation |
| `napi_bridge_parsing.rs` | 100 | Class parsing |
| `napi_bridge_theme.rs` | 150 | Theme resolution |
| `napi_bridge_cache.rs` | 150 | Cache management |
| `napi_bridge_redis.rs` | 200 | Redis operations |

**Total:** ~980 LOC (modularized from 1200+)
**Reduction:** 18% code size through removing duplication

---

## Next Steps

1. Create utility modules (types, marshalling, errors)
2. Extract function groups into focused modules
3. Update main bridge to use modules
4. Run full test suite
5. Document module organization
6. Create migration guide for developers

---

**Status:** Ready to implement  
**Start:** Immediately after phase 7.2 completion  
**Target:** Complete within current session

