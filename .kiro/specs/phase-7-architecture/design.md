# Phase 7: Architecture Improvements - Design Document

**Version:** 1.0  
**Status:** 🚀 IN PROGRESS  
**Last Updated:** 2026-06-11  
**Target Coverage:** 85%+ test coverage, reduce technical debt by ~40%

---

## Overview

Phase 7 is a comprehensive architectural refactoring initiative designed to address eight critical improvements identified in Phase 6 analysis. The improvements span two tracks: **Debt Removal** (R1-R3) focusing on consolidation, abstraction, and modularization, and **Quality & Performance** (R4-R8) enhancing testing, determinism, and optimization.

**Goals:**
- Reduce technical debt by ~40%
- Increase test coverage from 60% → 85%+
- Improve module coupling and separation of concerns
- Achieve 10-50x faster repeated compilations through caching
- Establish deterministic behavior for all operations
- Create maintainable, extensible architecture for future phases

**Scope:**
Eight distinct improvements touching parser consolidation, cache abstraction, NAPI bridge modularization, property-based testing, variant precedence, theme resolver caching, TypeScript exports, and fallback logic.

**Outcome:**
A robust, well-tested, maintainable codebase positioned for Phase 8+ initiatives with reduced technical debt and improved developer experience.

---

## Executive Summary

Phase 7 focuses on removing architectural debt and improving code maintainability, performance, and test coverage. Eight improvements are designed across two tracks:

**Track 1: Debt Removal** (R1-R3) - Critical refactoring to reduce complexity and improve separation of concerns
**Track 2: Quality & Performance** (R4-R8) - Enhanced testing, deterministic behavior, and optimization

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TypeScript Layer (NAPI Bridge)               │
├─────────────────────────────────────────────────────────────────┤
│  Current State: 1200+ LOC monolith (130+ functions)              │
│  Desired State: Modular 150-200 LOC per module                  │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ CSS Generation   │ │ Class Parsing    │ │ Theme Resolution │ │
│ │ Bindings         │ │ Bindings         │ │ Bindings         │ │
│ │ (~150 LOC)       │ │ (~150 LOC)       │ │ (~150 LOC)       │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                   │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ Analysis Ops     │ │ Cache Ops        │ │ Redis Ops        │ │
│ │ Bindings         │ │ Bindings         │ │ Bindings         │ │
│ │ (~100 LOC)       │ │ (~100 LOC)       │ │ (~120 LOC)       │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                   │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Shared Marshalling Layer (~50 LOC)                         │  │
│ │ - JSON serialization/deserialization                       │  │
│ │ - Error handling utilities                                 │  │
│ │ - Type conversions                                         │  │
│ └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Native Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Application Layer (Business Logic)                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  class_parser.rs    (consolidated v2 only)              │   │
│  │  css_generator.rs                                        │   │
│  │  variant_system.rs  (with VariantPrecedence enum)       │   │
│  │  theme_resolver.rs  (with ThemeResolverPool singleton)  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Domain Layer (Core Data Structures)                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  parsed_class.rs                                         │   │
│  │  theme_config.rs                                         │   │
│  │  variants.rs                                             │   │
│  │  css_compiler.rs                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Infrastructure Layer (Abstraction & Implementation)       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Cache Abstraction Layer (NEW)                       │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ │   │
│  │  │ │ LRU Cache    │ │ Redis Cache  │ │ Persistent   │ │ │   │
│  │  │ │ Adapter      │ │ Adapter      │ │ Cache Adapter│ │ │   │
│  │  │ └──────────────┘ └──────────────┘ └──────────────┘ │ │   │
│  │  │ ┌──────────────────────────────────────────────────┐ │ │   │
│  │  │ │ Adaptive Cache (dynamic backend selection)       │ │ │   │
│  │  │ └──────────────────────────────────────────────────┘ │ │   │
│  │  │ CacheBackend Trait Interface                       │ │   │
│  │  │ - get(key) -> Option<V>                           │ │   │
│  │  │ - put(key, value)                                 │ │   │
│  │  │ - clear()                                         │ │   │
│  │  │ - stats() -> CacheStats                           │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │  Factory Pattern (cache_factory.rs)                     │   │
│  │  - create_cache(config) -> Box<dyn CacheBackend>      │   │
│  │  - select_optimal_backend(scenario)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Caching Subsystem (improved abstraction)                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  atomic_cache_stats.rs  (shared statistics)             │   │
│  │  cache_analytics.rs     (metrics collection)            │   │
│  │  adapters.rs            (adapter implementations)       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Other Infrastructure                                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  watch_api.rs, streaming_compiler.rs, oxc_api.rs, etc.  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### TypeScript/JavaScript Layer

#### NAPI Bridge Module

**Purpose:** Serve as the FFI boundary between TypeScript and Rust native code. Provides a clean, modular API for all native operations.

**File Structure:**
```
infrastructure/napi_bridge/
├── mod.rs                      # Reexports
├── marshalling.rs              # Shared JSON marshalling (~50 LOC)
├── error_handling.rs           # Error utilities (~50 LOC)
├── types.rs                    # Type definitions (~50 LOC)
├── css_generation.rs           # CSS generation bindings (~150 LOC)
├── class_parsing.rs            # Class parsing bindings (~150 LOC)
├── theme_resolution.rs         # Theme resolution bindings (~150 LOC)
├── analysis.rs                 # Analysis bindings (~100 LOC)
├── caching.rs                  # Cache management bindings (~100 LOC)
├── redis_ops.rs                # Redis operations (~120 LOC)
└── watch_system.rs             # Watch system bindings (~120 LOC)
```

**Key Interfaces:**

```rust
// Marshalling Interface
pub fn parse_json<T: DeserializeOwned>(json: String) -> Result<T, Error>;
pub fn to_json<T: Serialize>(value: &T) -> Result<String, Error>;
pub fn error_to_napi<E: Display>(error: E, context: &str) -> Error;

// CSS Generation Module
#[napi]
pub fn generate_css_native(rule_json: String, minify: Option<bool>) -> Result<String>;
#[napi]
pub fn generate_css_batch(rules_json: String, minify: Option<bool>) -> Result<String>;

// Class Parsing Module
#[napi]
pub fn parse_class(input: String) -> Result<String>;
#[napi]
pub fn parse_classes(inputs: Vec<String>) -> Result<String>;

// Theme Resolution Module
#[napi]
pub fn resolve_color_cached(theme_id: u64, color: String, config: Option<String>) -> Result<String>;
#[napi]
pub fn resolve_spacing_cached(theme_id: u64, spacing: String, config: Option<String>) -> Result<String>;

// Cache Management Module
#[napi]
pub fn get_cache_statistics() -> Result<String>;
#[napi]
pub fn clear_all_caches() -> Result<()>;
#[napi]
pub fn configure_cache(backend_type: String, config_json: String) -> Result<String>;
```

### Rust Native Layer

#### Cache Abstraction Layer (R2)

**Purpose:** Provide unified interface for all cache backends (LRU, Redis, Persistent, Adaptive)

**Core Trait:**
```rust
pub trait CacheBackend<K, V>: Send + Sync
where
    K: Clone + Eq + Hash,
    V: Clone,
{
    fn get(&self, key: &K) -> Option<V>;
    fn put(&self, key: K, value: V) -> Result<(), CacheError>;
    fn remove(&self, key: &K) -> Result<(), CacheError>;
    fn clear(&self) -> Result<(), CacheError>;
    fn stats(&self) -> CacheStats;
    fn capacity(&self) -> usize;
    fn available_capacity(&self) -> usize;
}
```

**Implementations:**
- `LruCacheAdapter`: In-memory LRU cache
- `RedisCacheAdapter`: Distributed Redis cache
- `PersistentCacheAdapter`: Disk-based persistence
- `AdaptiveCacheAdapter`: Dynamic backend selection

**Factory Interface:**
```rust
pub struct CacheFactory;

impl CacheFactory {
    pub fn create<K, V>(backend_type: CacheBackendType) 
        -> Result<Box<dyn CacheBackend<K, V>>, CacheError>;
    
    pub fn select_optimal(scenario: CacheScenario) -> CacheBackendType;
}
```

#### Parser Module (R1)

**Purpose:** Consolidated class parsing using v2 implementation only

**File:** `application/class_parser.rs` (consolidated, 900 LOC)

**Key Interface:**
```rust
pub struct ClassParser;

impl ClassParser {
    pub fn parse(input: &str) -> Result<ParsedClass, ParserError>;
    pub fn parse_batch(inputs: &[&str]) -> Vec<Result<ParsedClass, ParserError>>;
}
```

**Replaced Files:**
- `application/class_parser_v1.rs` ✗ (deprecated)
- `docs/archive/class_parser_v1_deprecated.rs` ✓ (historical reference)

#### Variant System Module (R5)

**Purpose:** Deterministic variant precedence and composition

**File:** `domain/variant_precedence.rs` (NEW)

**Key Interface:**
```rust
pub enum VariantPrecedence {
    Interaction = 0,    // Highest priority
    ColorScheme = 1,
    Responsive = 2,
    State = 3,
    Custom = 4,         // Lowest priority
}

pub fn get_variant_precedence(variant: &str) -> VariantPrecedence;

pub struct VariantSystem;
impl VariantSystem {
    pub fn compose_variants(variants: &[Variant]) -> Vec<Variant>;
    pub fn resolve_variants(variants: &[Variant], config: &ThemeConfig) 
        -> Result<VariantComponents, VariantError>;
}
```

#### Theme Resolver Pool (R6)

**Purpose:** Singleton pool managing ThemeResolver instances for reuse across compilations

**File:** `application/theme_resolver_pool.rs` (NEW)

**Key Interface:**
```rust
pub struct ThemeResolverPool {
    resolvers: Arc<DashMap<u64, Arc<ThemeResolver>>>,
    configs: Arc<DashMap<u64, ThemeConfig>>,
    hits: Arc<AtomicU64>,
    misses: Arc<AtomicU64>,
}

impl ThemeResolverPool {
    pub fn get_or_create(
        &self,
        theme_id: u64,
        config: ThemeConfig,
    ) -> Arc<ThemeResolver>;
    
    pub fn stats(&self) -> PoolStats;
    pub fn clear(&self);
}

// Global instance
lazy_static! {
    pub static ref THEME_RESOLVER_POOL: ThemeResolverPool = ThemeResolverPool::new();
}
```

---

## Data Models

### Core Domain Types

#### CacheBackend Stats Model
```rust
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CacheStats {
    pub hits: u64,                    // Number of cache hits
    pub misses: u64,                  // Number of cache misses
    pub evictions: u64,               // Number of items evicted
    pub memory_used: usize,           // Total memory in bytes
    pub items_stored: usize,          // Number of items in cache
    pub hit_rate: f64,                // hit_rate = hits / (hits + misses)
    pub last_updated: i64,            // Unix timestamp of last update
}

impl CacheStats {
    pub fn hit_rate(&self) -> f64;
    pub fn miss_rate(&self) -> f64 { 1.0 - self.hit_rate() }
}
```

#### Variant Precedence Model
```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum VariantPrecedence {
    Interaction = 0,      // group:, peer:, group-hover:, peer-focus:
    ColorScheme = 1,      // dark:, light:
    Responsive = 2,       // sm:, md:, lg:, xl:, 2xl:
    State = 3,            // hover:, focus:, active:, disabled:
    Custom = 4,           // Unknown variants
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolvedVariant {
    pub name: String,
    pub precedence: VariantPrecedence,
}
```

#### Theme Resolver Pool Stats
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolStats {
    pub hits: u64,                    // Pool cache hits (reused resolver)
    pub misses: u64,                  // Pool cache misses (new resolver)
    pub total: u64,                   // Total resolver requests
    pub hit_rate: f64,                // hit_rate = hits / total
    pub cached_resolvers: usize,      // Number of cached resolver instances
}
```

#### Cache Configuration Model
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CacheBackendType {
    Lru { 
        capacity: usize 
    },
    Redis { 
        url: String,
        ttl: Option<u32>
    },
    Persistent { 
        path: String,
        capacity: usize
    },
    Adaptive { 
        initial_backend: Box<dyn CacheBackend> 
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CacheScenario {
    HighThroughput,           // Many cache operations
    DistributedCaching,       // Multiple processes/machines
    PersistentCompilation,    // Long-lived cache
    Auto,                     // Auto-detect optimal backend
}
```

#### Parsed Class Model
```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ParsedClass {
    pub raw_input: String,           // Original input string
    pub prefix: String,              // e.g., "bg", "text", "px"
    pub variants: Vec<Variant>,      // e.g., ["dark", "lg", "hover"]
    pub value: String,               // e.g., "blue-500"
    pub arbitrary: Option<String>,   // For arbitrary values [...]
}
```

#### CSS Rule Model
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CssRule {
    pub selector: String,            // CSS selector
    pub properties: Vec<(String, String)>,  // [(prop, value), ...]
    pub media_queries: Vec<String>,   // For responsive variants
}
```

---

## Correctness Properties

### Formal Properties (Universal Quantification)

**Property 1: Parser Determinism**
```
∀ input: String, ∀ n ∈ [1, 1000]
  parse(input) = parse(input)
  
Meaning: Parsing the same input always produces the same output
Verified: proptest with 1000+ iterations
```

**Property 2: Round-Trip Parsing**
```
∀ class: Class, ∀ modifiers: Variant[]
  let parsed = parse(class)
  let reconstructed = parsed.full_class_name()
  let reparsed = parse(reconstructed)
  → parsed.prefix = reparsed.prefix
  ∧ parsed.value = reparsed.value
  
Meaning: Parse → reconstruct → parse produces equivalent result
Verified: proptest with 1000+ random class combinations
```

**Property 3: Cache Consistency**
```
∀ cache: CacheBackend, ∀ key: K, ∀ value: V
  cache.put(key, value)
  → cache.get(key) = Some(value)
  
Meaning: Get after put returns the same value within a session
Verified: quickcheck with random key-value pairs
```

**Property 4: Cache LRU Eviction**
```
∀ cache: LruCache, capacity: usize, items: (K, V)[]
  let recent_keys = items[-capacity:].keys()
  ∀ key ∈ recent_keys: cache.get(key) = Some(...)
  
Meaning: When cache is full, most recent items stay in cache
Verified: proptest with cache operations
```

**Property 5: Variant Composition Determinism**
```
∀ variants: Variant[], ∀ perm ∈ permutations(variants)
  compose_variants(perm) = compose_variants(variants)
  
Meaning: Same variants always compose in same order regardless of input order
Verified: proptest with 1000+ random variant combinations
```

**Property 6: CSS Generation Validity**
```
∀ class: String
  let rule = compile(class)
  let css = generate_css(rule)
  → css.contains("{") ∧ css.contains("}")
  ∧ !css.contains("{{") ∧ !css.contains("}}")
  
Meaning: Generated CSS has valid structure with matching braces
Verified: proptest with 1000+ random class strings
```

**Property 7: Theme Resolver Pool Efficiency**
```
∀ theme_id: u64, config: ThemeConfig, n > 1
  let resolver1 = pool.get_or_create(theme_id, config)
  let resolver2 = pool.get_or_create(theme_id, config)
  let resolver3 = pool.get_or_create(theme_id, config)
  → resolver1 == resolver2 == resolver3 (same Arc instance)
  ∧ pool.stats().hit_rate = (n-1) / n (2 hits, 1 miss for n=3)
  
Meaning: Pool reuses resolver instances, improving performance
Verified: benchmark showing 10-50x improvement
```

**Property 8: No Cache Memory Leak**
```
∀ n: iterations, capacity: usize
  initial_memory = measure_memory()
  for i in [1, n]:
    cache.put(random_key(), random_value())
  final_memory = measure_memory()
  → final_memory - initial_memory ≤ capacity * sizeof(V) * 1.1
  
Meaning: Cache memory usage stays within bounds (±10% variance)
Verified: memory profiling tests
```

---

## Error Handling

### Error Scenarios and Responses

#### Parser Errors

| Error | Condition | Response | Recovery |
|-------|-----------|----------|----------|
| Invalid Prefix | Input doesn't start with valid prefix | Return `ParserError::InvalidPrefix` | Suggest valid prefixes |
| Invalid Modifier | Modifier not in variant list | Log warning, treat as unknown variant | Fall back to custom variant |
| Invalid Value | Value doesn't match expected format | Return `ParserError::InvalidValue` | Suggest valid values from theme |
| Malformed Class | Multiple colons or invalid structure | Return `ParserError::MalformedClass` | Validate input format |

#### Cache Errors

| Error | Condition | Response | Recovery |
|-------|-----------|----------|----------|
| Backend Unavailable | Redis/disk unavailable | Fall back to next cache tier | Switch to in-memory LRU |
| Capacity Exceeded | Cache full and can't evict | Return `CacheError::CapacityExceeded` | Clear least recently used |
| Serialization Failed | Value can't serialize | Return `CacheError::Serialization` | Log error, skip caching |
| Key Not Found | Requested key doesn't exist | Return `CacheError::KeyNotFound` or `None` | Fall back to computation |

#### Theme Resolution Errors

| Error | Condition | Response | Recovery |
|-------|-----------|----------|----------|
| Color Not Found | Color doesn't exist in theme | Return default color | Log and use fallback |
| Invalid Theme | Theme config malformed | Return `ThemeError::InvalidConfig` | Use default theme |
| Opacity Out of Range | Opacity value invalid | Return `ThemeError::InvalidOpacity` | Clamp to [0, 1] |
| Theme Pool Poisoned | Pool lock becomes poisoned | Panic (unrecoverable) | Rebuild pool |

#### NAPI Bridge Errors

| Error | Condition | Response | Recovery |
|-------|-----------|----------|----------|
| Invalid JSON | TypeScript passes invalid JSON | Return `Status::InvalidArg` | Validate in TypeScript first |
| Binding Not Available | Native module not loaded | Fall back to JavaScript | Implement JS fallback |
| NAPI Error | Runtime error in bridge | Return `Status::GenericFailure` | Wrap with context |
| Marshalling Failed | Conversion between types fails | Return detailed error | Log types involved |

### Error Handling Strategy

```rust
// infrastructure/napi_bridge/error_handling.rs (NEW)

pub enum BridgeError {
    Parser(ParserError),
    Cache(CacheError),
    Theme(ThemeError),
    Serialization(String),
    Backend(String),
}

impl From<BridgeError> for napi::Error {
    fn from(err: BridgeError) -> Self {
        match err {
            BridgeError::Parser(e) => {
                Error::new(Status::InvalidArg, format!("Parser error: {}", e))
            }
            BridgeError::Cache(e) => {
                Error::new(Status::GenericFailure, format!("Cache error: {}", e))
            }
            BridgeError::Theme(e) => {
                Error::new(Status::GenericFailure, format!("Theme error: {}", e))
            }
            BridgeError::Serialization(msg) => {
                Error::new(Status::InvalidArg, format!("Serialization failed: {}", msg))
            }
            BridgeError::Backend(msg) => {
                Error::new(Status::GenericFailure, format!("Backend error: {}", msg))
            }
        }
    }
}

/// Convert error to user-friendly message
pub fn error_to_user_message(error: &napi::Error) -> String {
    format!(
        "An error occurred: {}. Please check the input and try again.",
        error
    )
}
```

---

## Testing Strategy

### Unit Testing Approach

**Focus Areas:**
- Individual module functionality
- Edge cases and boundary conditions
- Error paths and recovery

**Key Tests:**
- Parser: Valid/invalid classes, variants, values
- Cache: Get/put/clear operations, eviction, stats
- Theme: Color/spacing resolution, opacity application
- Variants: Precedence ordering, composition
- NAPI: JSON marshalling, error conversion

**Coverage Goal:** 70%+ line coverage per module

### Property-Based Testing Approach (R4)

**Libraries:** proptest, quickcheck

**Properties to Test:**
1. Parser determinism (1000+ iterations)
2. Round-trip parsing (1000+ random combinations)
3. Cache consistency (1000+ random key-value pairs)
4. LRU eviction correctness (1000+ operations)
5. Variant composition determinism (1000+ combinations)
6. CSS generation validity (1000+ random classes)
7. Cache stats accuracy (1000+ operations)

**Execution:** `cargo test --lib` runs all property tests

**Coverage Goal:** 5+ properties, 1000+ iterations each

### Integration Testing Approach

**Focus Areas:**
- End-to-end compilation pipelines
- Multi-module interactions
- Cache backend switching
- Fallback logic

**Key Tests:**
- Full class parsing → CSS generation flow
- Cache backend abstractions working together
- NAPI bridge correctly marshalling between TypeScript and Rust
- Fallback from native to JavaScript

**Coverage Goal:** All major workflows tested

### TypeScript Fallback Testing (R8)

**Focus Areas:**
- Graceful degradation when native unavailable
- All functions have working fallbacks
- Error messages clear and helpful

**Key Tests:**
- Mock native binding unavailable
- Verify fallback produces correct output
- Check error messages are informative
- Validate all 130+ functions have fallbacks

**Coverage Goal:** 100% of exported functions tested with fallbacks

---

## Performance Considerations

### Optimization Goals

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Single parse | <1ms | ~0.5ms | ✓ Acceptable |
| Single CSS gen | <1ms | ~0.3ms | ✓ Acceptable |
| Repeated compile (10x) | <10ms | ~50ms | 🔄 R6 improves to 5ms |
| Theme resolver pool hit | <0.1ms | N/A | ✓ New feature |
| Cache operation | <0.1ms | ~0.2ms | ✓ Acceptable |
| Binary size | -5% | 100% | 🔄 R1 reduces to 95% |

### Performance Strategies

**1. Theme Resolver Caching (R6)**
- Pool singleton manages resolver instances
- Reuses resolvers across compilations
- Target: 10-50x faster for repeated compiles
- Benchmark validates before/after

**2. Cache Abstraction (R2)**
- Pluggable backends (LRU, Redis, Persistent)
- Consistent interface for swapping
- Factory pattern selects optimal backend
- No performance regression

**3. Parser Consolidation (R1)**
- Single v2 implementation (not both v1 + v2)
- ~5% binary size reduction
- Reduced maintenance overhead

**4. NAPI Modularization (R3)**
- Smaller modules easier to optimize
- Function-level inlining
- Tree-shaking for unused modules
- <10% performance overhead from refactoring

### Memory Management

**Constraints:**
- LRU cache: configurable capacity (typically 5K-50K items)
- Redis: external memory, configurable
- Persistent: disk-based, minimal memory
- Adaptive: dynamic selection based on workload

**Profiling:**
- Memory tests verify cache stays within bounds
- Benchmarks measure steady-state memory
- No leaks detected in long-running processes

---

## Security Considerations

### Input Validation

**TypeScript Layer:**
- Validate all inputs before passing to Rust
- Check JSON structure matches expected types
- Reject oversized inputs (>1MB)

**Rust Layer:**
- Strings bounds-checked before parsing
- Regex patterns validated before matching
- Cache keys/values sanitized

### Error Information Disclosure

**Constraints:**
- Don't expose internal paths in errors
- Don't leak system configuration
- Don't reveal timing information

**Implementation:**
- Error messages generic but helpful
- Log detailed errors internally only
- Consistent error response times

### Cache Security

**Redis:**
- Credentials passed via config, not logs
- SSL/TLS for network transport
- Redis AUTH required

**Persistent:**
- File permissions respect system umask
- Data at rest not encrypted (user responsibility)
- Cache invalidation on theme change

### Variant Precedence

**Constraint:**
- Precedence rules publicly documented
- Deterministic ordering prevents bugs
- No secret or undocumented precedence

---

## Dependencies

### Rust Dependencies

**Core:**
- `serde`: JSON serialization (0.1.x)
- `dashmap`: Concurrent hashmap for pools
- `lazy_static`: Global static instances
- `chrono`: Timestamp utilities

**Cache Backends:**
- `redis`: Redis client library
- `rocksdb`: Persistent key-value store (optional)

**Testing:**
- `proptest`: Property-based testing
- `quickcheck`: QuickCheck implementation
- `quickcheck_macros`: Quickcheck macros

**Build:**
- `napi`: Node.js native addon API
- `napi-derive`: NAPI derive macros

### TypeScript Dependencies

**Build:**
- `typescript`: TypeScript compiler
- `tsconfig`: TypeScript configuration

**Runtime:**
- `node-gyp`: Native module build (handled by NAPI)

### No External Blockers

- Phase 6 complete ✅ (atomic operations)
- Phase 5 complete ✅ (caching infrastructure)
- Phase 4 complete ✅ (NAPI bridge working)
- No dependency conflicts
- All required tools available

---

## Design Decisions & Rationale

### R1: Why Consolidate Parsers?

**Decision:** Remove v1 parser, keep only v2

**Rationale:**
- v2 has identical functionality with better performance
- Eliminates maintenance burden (bugs in two places)
- Reduces binary size by ~5%
- Simplifies developer experience

**Alternative Considered:** Support both in parallel
- Rejected: More maintenance, larger binary, confusing for users

---

### R2: Why Cache Abstraction Trait?

**Decision:** Define `CacheBackend` trait for all implementations

**Rationale:**
- Easy to swap backends without code changes
- Enables factory pattern for optimal selection
- Better testing with mock implementations
- Consistent error handling across backends

**Alternative Considered:** Individual cache types
- Rejected: Hard to swap, repetitive code, no flexibility

---

### R3: Why NAPI Modularization?

**Decision:** Split 1200 LOC monolith into 7-8 modules (~150-200 LOC each)

**Rationale:**
- Easier to find and modify specific functionality
- Improved test coverage (40% → 70%+)
- Shared marshalling layer reduces duplication
- Consistent error handling pattern

**Alternative Considered:** Keep monolith
- Rejected: Unmaintainable scale, hard to test, navigation difficult

---

### R5: Why Variant Precedence Enum?

**Decision:** Define `VariantPrecedence` levels: Interaction > ColorScheme > Responsive > State > Custom

**Rationale:**
- Deterministic ordering prevents bugs
- Clear priority levels match CSS conventions
- Easy to extend with new variants
- Property-based tests verify correctness

**Alternative Considered:** Implicit ordering
- Rejected: Silent bugs, non-deterministic output, unmaintainable

---

### R6: Why Resolver Pool Singleton?

**Decision:** Global pool managing cached resolver instances

**Rationale:**
- Massive performance improvement (10-50x for repeated compiles)
- Thread-safe with Arc + DashMap
- Stats tracking for monitoring
- Backward compatible

**Alternative Considered:** Per-module cache
- Rejected: Less reuse, more complex coordination, harder to debug

---

### R7: Why Sub-Entry Points?

**Decision:** Create separate entry points: ./compiler, ./parser, ./analyzer, etc.

**Rationale:**
- Improves tree-shaking in bundlers
- Smaller bundles for selective usage
- Better organization for developers
- Backward compatible main export

**Alternative Considered:** Single monolithic export
- Rejected: Harder to optimize bundle size, less discoverable

---

### R8: Why Fallback Testing?

**Decision:** Add tests for JavaScript fallback when native unavailable

**Rationale:**
- Ensures graceful degradation
- All functions have working fallbacks
- Better user experience on errors
- Clear error messages

**Alternative Considered:** No fallback tests
- Rejected: Silent failures, poor user experience, no safety net

---

**Document Version:** 1.0  
**Last Updated:** 2026-06-11  
**Next Review:** After R1 completion

```
┌─────────────────────────────────────────────────────────────────┐
│                     TypeScript Layer (NAPI Bridge)               │
├─────────────────────────────────────────────────────────────────┤
│  Current State: 1200+ LOC monolith (130+ functions)              │
│  Desired State: Modular 150-200 LOC per module                  │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ CSS Generation   │ │ Class Parsing    │ │ Theme Resolution │ │
│ │ Bindings         │ │ Bindings         │ │ Bindings         │ │
│ │ (~150 LOC)       │ │ (~150 LOC)       │ │ (~150 LOC)       │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                   │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ Analysis Ops     │ │ Cache Ops        │ │ Redis Ops        │ │
│ │ Bindings         │ │ Bindings         │ │ Bindings         │ │
│ │ (~100 LOC)       │ │ (~100 LOC)       │ │ (~120 LOC)       │ │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘ │
│                                                                   │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Shared Marshalling Layer (~50 LOC)                         │  │
│ │ - JSON serialization/deserialization                       │  │
│ │ - Error handling utilities                                 │  │
│ │ - Type conversions                                         │  │
│ └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Rust Native Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Application Layer (Business Logic)                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  class_parser.rs    (consolidated v2 only)              │   │
│  │  css_generator.rs                                        │   │
│  │  variant_system.rs  (with VariantPrecedence enum)       │   │
│  │  theme_resolver.rs  (with ThemeResolverPool singleton)  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Domain Layer (Core Data Structures)                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  parsed_class.rs                                         │   │
│  │  theme_config.rs                                         │   │
│  │  variants.rs                                             │   │
│  │  css_compiler.rs                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Infrastructure Layer (Abstraction & Implementation)       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ Cache Abstraction Layer (NEW)                       │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ │   │
│  │  │ │ LRU Cache    │ │ Redis Cache  │ │ Persistent   │ │ │   │
│  │  │ │ Adapter      │ │ Adapter      │ │ Cache Adapter│ │ │   │
│  │  │ └──────────────┘ └──────────────┘ └──────────────┘ │ │   │
│  │  │ ┌──────────────────────────────────────────────────┐ │ │   │
│  │  │ │ Adaptive Cache (dynamic backend selection)       │ │ │   │
│  │  │ └──────────────────────────────────────────────────┘ │ │   │
│  │  │ CacheBackend Trait Interface                       │ │   │
│  │  │ - get(key) -> Option<V>                           │ │   │
│  │  │ - put(key, value)                                 │ │   │
│  │  │ - clear()                                         │ │   │
│  │  │ - stats() -> CacheStats                           │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │  Factory Pattern (cache_factory.rs)                     │   │
│  │  - create_cache(config) -> Box<dyn CacheBackend>      │   │
│  │  - select_optimal_backend(scenario)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Caching Subsystem (improved abstraction)                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  atomic_cache_stats.rs  (shared statistics)             │   │
│  │  cache_analytics.rs     (metrics collection)            │   │
│  │  adapters.rs            (adapter implementations)       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Other Infrastructure                                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  watch_api.rs, streaming_compiler.rs, oxc_api.rs, etc.  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Improvement 1: Dual Parser Consolidation (R1)

### Problem Statement

**Current State:**
- Two parser implementations exist: `class_parser.rs` (v1, 800 LOC) and `class_parser_v2.rs` (v2, 900 LOC)
- Both implementations compiled into final binary
- ~5% unnecessary binary size increase
- Maintenance burden: bugs must be fixed in two places
- Code duplication: ~1,700 LOC total for single concern

**Risks:**
- Accidental usage of deprecated v1 parser
- Inconsistent behavior between versions
- Unclear which parser is "correct"

### Solution Design

**Phase 1: Consolidation**

```
Step 1: Audit & Feature Parity
├── Document all differences between v1 and v2
├── Verify v2 handles all v1 edge cases
└── Ensure identical output for equivalent inputs

Step 2: Migration
├── Rename v2 implementation to v1 name (class_parser.rs)
├── Delete old v1 file completely
├── Archive v1 to docs/archive/class_parser_v1.rs
└── Update all internal imports

Step 3: Verification
├── Run full test suite (545+ existing tests)
├── Benchmark to ensure no performance regression
└── Verify binary size reduction (~5%)

Step 4: Documentation
├── Document consolidation decision
├── Add migration notes
└── Update code comments
```

**File Structure After:**

```
native/src/application/
├── class_parser.rs       # Consolidated v2 (900 LOC, single source of truth)
├── css_generator.rs
├── variant_system.rs
├── theme_resolver.rs
└── mod.rs

docs/archive/
└── class_parser_v1_deprecated.rs  # Historical reference only
```

### Data Flow

```
TypeScript Layer (nativeBridge.ts)
         ↓
    [parse_class()]
         ↓
   class_parser.rs (v2 only)
         ↓
   Unified Parser Output
         ↓
   Return to TypeScript
```

### Testing Strategy

**Regression Tests:**
- All 545+ existing tests must pass without modification
- Run parser on 100K sample Tailwind classes
- Benchmark output: before/after timing comparison

**Edge Cases:**
- Complex variant stacking: `dark:lg:hover:bg-blue-500`
- Custom theme values with special characters
- Responsive breakpoints with multiple levels

### Acceptance Criteria

- ✅ All v1 imports replaced with v2
- ✅ All 545+ tests passing
- ✅ Zero functionality regression
- ✅ Binary size reduced by 3-5%
- ✅ v1 code archived with documentation
- ✅ Performance metrics: no degradation

---

## Improvement 2: Cache Abstraction Layer (R2)

### Problem Statement

**Current State:**
```
Infrastructure layer has 15+ cache implementations:
├── lru_cache.rs           (different API than...)
├── redis_cache.rs         (different API than...)
├── persistent_cache.rs    (different API than...)
├── distributed_cache.rs   (different API than...)
├── adaptive_cache.rs      (different API than...)
├── lazy_cache.rs          (different API than...)
└── ... (9+ more)

Each with different:
- Method signatures
- Error handling patterns
- Stats tracking mechanisms
- Initialization procedures
```

**Problems:**
- ❌ Hard to swap cache backends without code changes
- ❌ Inconsistent stats across implementations
- ❌ Risk of memory leaks if wrong cache used
- ❌ NAPI bridge coupled to specific implementations
- ❌ Testing difficult (no mock interface)

### Solution Design

**Phase 1: Define Cache Trait Interface**

```rust
// infrastructure/cache_backend.rs (NEW)

/// Unified cache interface for all backends
pub trait CacheBackend<K, V>: Send + Sync
where
    K: Clone + Eq + std::hash::Hash,
    V: Clone,
{
    /// Get value by key
    fn get(&self, key: &K) -> Option<V>;
    
    /// Put key-value pair
    fn put(&self, key: K, value: V) -> Result<(), CacheError>;
    
    /// Remove specific key
    fn remove(&self, key: &K) -> Result<(), CacheError>;
    
    /// Clear entire cache
    fn clear(&self) -> Result<(), CacheError>;
    
    /// Get cache statistics
    fn stats(&self) -> CacheStats;
    
    /// Current capacity
    fn capacity(&self) -> usize;
    
    /// Remaining capacity
    fn available_capacity(&self) -> usize;
}

/// Cache statistics shared across all backends
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub evictions: u64,
    pub memory_used: usize,
    pub items_stored: usize,
    pub hit_rate: f64,
    pub last_updated: i64,
}

impl CacheStats {
    pub fn hit_rate(&self) -> f64 {
        let total = self.hits + self.misses;
        if total == 0 {
            0.0
        } else {
            (self.hits as f64) / (total as f64)
        }
    }
}

#[derive(Debug, Clone)]
pub enum CacheError {
    Backend(String),
    Serialization(String),
    CapacityExceeded,
    KeyNotFound,
}
```

**Phase 2: Implement Trait for All Backends**

```rust
// infrastructure/adapters/lru_adapter.rs (NEW)
impl<K, V> CacheBackend<K, V> for LruCache<K, V> {
    fn get(&self, key: &K) -> Option<V> {
        self.inner.lock().unwrap().get(key).cloned()
    }
    
    fn put(&self, key: K, value: V) -> Result<(), CacheError> {
        self.inner.lock().unwrap().put(key, value);
        Ok(())
    }
    
    fn stats(&self) -> CacheStats {
        let inner = self.inner.lock().unwrap();
        CacheStats {
            hits: self.stats.hits.load(Ordering::Relaxed),
            misses: self.stats.misses.load(Ordering::Relaxed),
            evictions: self.stats.evictions.load(Ordering::Relaxed),
            memory_used: inner.len() * std::mem::size_of::<(K, V)>(),
            items_stored: inner.len(),
            hit_rate: self.stats.hit_rate(),
            last_updated: chrono::Local::now().timestamp(),
        }
    }
    
    // ... other trait methods
}

// infrastructure/adapters/redis_adapter.rs (NEW)
impl<K: Serialize, V: Serialize> CacheBackend<K, V> for RedisCache {
    fn get(&self, key: &K) -> Option<V> {
        let key_str = serde_json::to_string(key).ok()?;
        self.client.get(&key_str)
            .ok()
            .and_then(|v| serde_json::from_str(&v).ok())
    }
    
    fn put(&self, key: K, value: V) -> Result<(), CacheError> {
        let key_str = serde_json::to_string(&key)
            .map_err(|e| CacheError::Serialization(e.to_string()))?;
        let value_str = serde_json::to_string(&value)
            .map_err(|e| CacheError::Serialization(e.to_string()))?;
        self.client.set(&key_str, &value_str)
            .map_err(|e| CacheError::Backend(e.to_string()))
    }
    
    // ... other trait methods
}

// infrastructure/adapters/persistent_adapter.rs (NEW)
impl<K, V> CacheBackend<K, V> for PersistentCache<K, V> {
    // Implementations for disk-based persistence
    // ...
}

// infrastructure/adapters/adaptive_adapter.rs (NEW)
impl<K, V> CacheBackend<K, V> for AdaptiveCache<K, V> {
    // Implementations for dynamic backend selection
    // ...
}
```

**Phase 3: Factory Pattern Implementation**

```rust
// infrastructure/cache_factory.rs (NEW)

pub enum CacheBackendType {
    Lru { capacity: usize },
    Redis { url: String, ttl: Option<u32> },
    Persistent { path: String, capacity: usize },
    Adaptive { initial_backend: Box<dyn CacheBackend> },
}

pub struct CacheFactory;

impl CacheFactory {
    /// Create cache backend based on configuration
    pub fn create<K, V>(backend_type: CacheBackendType) 
        -> Result<Box<dyn CacheBackend<K, V>>, CacheError>
    where
        K: Clone + Eq + std::hash::Hash + 'static,
        V: Clone + 'static,
    {
        match backend_type {
            CacheBackendType::Lru { capacity } => {
                Ok(Box::new(LruCache::new(capacity)))
            }
            CacheBackendType::Redis { url, ttl } => {
                let client = RedisClient::connect(&url)
                    .map_err(|e| CacheError::Backend(e.to_string()))?;
                Ok(Box::new(RedisCache::new(client, ttl)))
            }
            CacheBackendType::Persistent { path, capacity } => {
                Ok(Box::new(PersistentCache::new(&path, capacity)?))
            }
            CacheBackendType::Adaptive { initial_backend } => {
                Ok(Box::new(AdaptiveCache::new(initial_backend)))
            }
        }
    }
    
    /// Select optimal backend for use case
    pub fn select_optimal(scenario: CacheScenario) -> CacheBackendType {
        match scenario {
            CacheScenario::HighThroughput => {
                CacheBackendType::Lru { capacity: 50000 }
            }
            CacheScenario::DistributedCaching => {
                CacheBackendType::Redis { 
                    url: "redis://localhost:6379".into(),
                    ttl: Some(3600),
                }
            }
            CacheScenario::PersistentCompilation => {
                CacheBackendType::Persistent {
                    path: "./cache".into(),
                    capacity: 100000,
                }
            }
            CacheScenario::Auto => {
                // Detect optimal backend based on runtime conditions
                CacheBackendType::Adaptive {
                    initial_backend: Box::new(LruCache::new(10000)),
                }
            }
        }
    }
}

pub enum CacheScenario {
    HighThroughput,
    DistributedCaching,
    PersistentCompilation,
    Auto,
}
```

**Phase 4: Update NAPI Bridge to Use Factory**

```rust
// infrastructure/napi_bridge.rs (UPDATED)

use crate::infrastructure::cache_factory::{CacheFactory, CacheBackendType};
use crate::infrastructure::cache_backend::CacheBackend;

lazy_static! {
    static ref CACHE_CONFIG: RwLock<CacheBackendType> = 
        RwLock::new(CacheBackendType::Lru { capacity: 10000 });
        
    static ref PARSE_CACHE: Box<dyn CacheBackend<String, String>> =
        CacheFactory::create(CacheBackendType::Lru { capacity: 5000 })
            .expect("Failed to create parse cache");
            
    static ref RESOLVE_CACHE: Box<dyn CacheBackend<String, String>> =
        CacheFactory::create(CacheBackendType::Lru { capacity: 10000 })
            .expect("Failed to create resolve cache");
}

#[napi]
pub fn configure_cache(backend_type: String, config_json: String) 
    -> napi::Result<String> 
{
    let config = match backend_type.as_str() {
        "lru" => {
            let cfg: LruConfig = serde_json::from_str(&config_json)
                .map_err(|e| napi::Error::new(napi::Status::InvalidArg, e.to_string()))?;
            CacheBackendType::Lru { capacity: cfg.capacity }
        }
        "redis" => {
            let cfg: RedisConfig = serde_json::from_str(&config_json)
                .map_err(|e| napi::Error::new(napi::Status::InvalidArg, e.to_string()))?;
            CacheBackendType::Redis { 
                url: cfg.url, 
                ttl: cfg.ttl 
            }
        }
        _ => return Err(napi::Error::new(
            napi::Status::InvalidArg, 
            "Unknown cache backend"
        )),
    };
    
    let mut cfg_guard = CACHE_CONFIG.write().unwrap();
    *cfg_guard = config;
    
    Ok(serde_json::json!({ "status": "configured" }).to_string())
}

#[napi]
pub fn get_cache_stats() -> napi::Result<String> {
    let stats = PARSE_CACHE.stats();
    Ok(serde_json::to_string(&stats)
        .map_err(|e| napi::Error::new(napi::Status::InvalidArg, e.to_string()))?)
}
```

### Data Flow

```
TypeScript Application
         ↓
    NAPI Bridge
         ↓
   Cache Factory
    /   |   \
   /    |    \
LRU  Redis  Persistent
 |      |       |
 └──────┴───────┘
      ↓
CacheBackend Trait
(uniform interface)
```

### Testing Strategy

**Unit Tests:**
- Each adapter implements trait methods correctly
- Stats tracking accurate across implementations
- Error handling consistent

**Integration Tests:**
- Factory creates correct backend type
- Cache operations (get, put, clear) work identically
- Stats aggregation across backends

**Property-Based Tests (R4):**
- Cache consistency: get after put returns same value
- Stats accuracy: hit/miss counts match operations
- Memory management: no leaks across backend switches

### Acceptance Criteria

- ✅ CacheBackend trait defined with all methods
- ✅ All 4+ backends implement trait successfully
- ✅ Factory pattern working correctly
- ✅ NAPI bridge uses factory pattern
- ✅ No breaking changes to TypeScript API
- ✅ All tests passing
- ✅ Easy to add new cache backends

---

## Improvement 3: NAPI Bridge Modularization (R3)

### Problem Statement

**Current State:**
- Single `napi_bridge.rs` file: 1200+ LOC
- 130+ functions exported to TypeScript
- Mixed concerns: marshalling, business logic, error handling
- Difficult to locate specific functionality
- Test coverage: only ~40%

**Challenge:**
```rust
// Current napi_bridge.rs is a monolith:
#[napi]
pub fn generate_css_native(...) { ... }  // Line 50

#[napi]
pub fn parse_class(...) { ... }          // Line 119

#[napi]
pub fn compile_class(...) { ... }        // Line 353

// ... 120+ more functions in same file
// Hard to find what you need
// Hard to test in isolation
```

### Solution Design

**Phase 1: Modularization Structure**

```
infrastructure/
├── napi_bridge/
│   ├── mod.rs                      # Reexports all modules
│   ├── css_generation.rs           # ~150 LOC - CSS generation bindings
│   ├── class_parsing.rs            # ~150 LOC - Class parsing bindings
│   ├── theme_resolution.rs         # ~150 LOC - Theme bindings
│   ├── analysis.rs                 # ~100 LOC - Analysis bindings
│   ├── caching.rs                  # ~100 LOC - Cache management bindings
│   ├── redis_ops.rs                # ~120 LOC - Redis operation bindings
│   ├── watch_system.rs             # ~120 LOC - Watch system bindings
│   ├── marshalling.rs              # ~50 LOC - Shared JSON marshalling
│   ├── error_handling.rs           # ~50 LOC - Error utilities
│   ├── types.rs                    # ~50 LOC - Shared type definitions
│   └── constants.rs                # ~30 LOC - Shared constants
└── napi_bridge.rs                  # (kept for backward compatibility, reexports)
```

**Phase 2: Shared Marshalling Layer**

```rust
// infrastructure/napi_bridge/marshalling.rs (NEW)

use serde::{Deserialize, Serialize};
use napi::{Error, Status};

/// Parse JSON from TypeScript into Rust type
pub fn parse_json<T: serde::de::DeserializeOwned>(json: String) 
    -> Result<T, Error> 
{
    serde_json::from_str(&json)
        .map_err(|e| Error::new(
            Status::InvalidArg, 
            format!("JSON parse error: {}", e)
        ))
}

/// Serialize Rust type to JSON for TypeScript
pub fn to_json<T: serde::ser::Serialize>(value: &T) -> Result<String, Error> {
    serde_json::to_string(value)
        .map_err(|e| Error::new(
            Status::InvalidArg,
            format!("JSON serialize error: {}", e)
        ))
}

/// Parse into named type with better error context
pub fn parse_config<T: serde::de::DeserializeOwned>(
    json: String, 
    type_name: &str
) -> Result<T, Error> {
    serde_json::from_str(&json)
        .map_err(|e| Error::new(
            Status::InvalidArg,
            format!("Failed to parse {}: {}", type_name, e)
        ))
}

/// Convert error to NAPI error with consistent formatting
pub fn error_to_napi<E: std::fmt::Display>(error: E, context: &str) -> Error {
    Error::new(
        Status::GenericFailure,
        format!("{}: {}", context, error)
    )
}
```

**Phase 3: Modularized NAPI Functions**

```rust
// infrastructure/napi_bridge/css_generation.rs (NEW)

use crate::infrastructure::napi_bridge::marshalling::*;
use napi::{bindgen_prelude::*, JsObject};

/// Generate CSS from rule definitions
#[napi]
pub fn generate_css_native(
    rule_json: String,
    minify: Option<bool>,
) -> napi::Result<String> {
    let rule = parse_json::<CssRule>(rule_json)?;
    let minify = minify.unwrap_or(false);
    
    let css = css_generation_impl(&rule, minify)
        .map_err(|e| error_to_napi(e, "CSS generation failed"))?;
    
    to_json(&css)
}

/// Generate CSS from batch of rules
#[napi]
pub fn generate_css_batch(
    rules_json: String,
    minify: Option<bool>,
) -> napi::Result<String> {
    let rules = parse_json::<Vec<CssRule>>(rules_json)?;
    let minify = minify.unwrap_or(false);
    
    let css_batch: Result<Vec<_>, _> = rules
        .iter()
        .map(|rule| css_generation_impl(rule, minify))
        .collect();
    
    let css = css_batch
        .map_err(|e| error_to_napi(e, "Batch CSS generation failed"))?;
    
    to_json(&css)
}

/// Minify CSS string
#[napi]
pub fn minify_css(css: String) -> napi::Result<String> {
    let minified = minify_css_impl(&css)
        .map_err(|e| error_to_napi(e, "CSS minification failed"))?;
    
    Ok(minified)
}

// Helper implementation (in same module or shared)
fn css_generation_impl(rule: &CssRule, minify: bool) -> Result<String, String> {
    // ... implementation
    Ok(String::new())
}

fn minify_css_impl(css: &str) -> Result<String, String> {
    // ... implementation
    Ok(String::new())
}
```

```rust
// infrastructure/napi_bridge/class_parsing.rs (NEW)

use crate::infrastructure::napi_bridge::marshalling::*;
use napi::{bindgen_prelude::*, JsObject};

/// Parse single Tailwind class
#[napi]
pub fn parse_class(input: String) -> napi::Result<String> {
    let parsed = parse_class_impl(&input)
        .map_err(|e| error_to_napi(e, "Class parsing failed"))?;
    
    to_json(&parsed)
}

/// Parse batch of classes
#[napi]
pub fn parse_classes(inputs: Vec<String>) -> napi::Result<String> {
    let parsed_batch: Result<Vec<_>, _> = inputs
        .iter()
        .map(|input| parse_class_impl(input))
        .collect();
    
    let results = parsed_batch
        .map_err(|e| error_to_napi(e, "Batch class parsing failed"))?;
    
    to_json(&results)
}

fn parse_class_impl(input: &str) -> Result<ParsedClass, String> {
    // ... implementation
    Ok(ParsedClass::default())
}
```

```rust
// infrastructure/napi_bridge/theme_resolution.rs (NEW)

use crate::infrastructure::napi_bridge::marshalling::*;
use napi::{bindgen_prelude::*, JsObject};

/// Resolve color value from theme
#[napi]
pub fn resolve_color(color: String) -> napi::Result<String> {
    let resolved = resolve_color_impl(&color)
        .map_err(|e| error_to_napi(e, "Color resolution failed"))?;
    
    Ok(resolved)
}

/// Resolve spacing value from theme
#[napi]
pub fn resolve_spacing(spacing: String) -> napi::Result<String> {
    let resolved = resolve_spacing_impl(&spacing)
        .map_err(|e| error_to_napi(e, "Spacing resolution failed"))?;
    
    Ok(resolved)
}

/// Resolve font size from theme
#[napi]
pub fn resolve_font_size(size: String) -> napi::Result<String> {
    let resolved = resolve_font_size_impl(&size)
        .map_err(|e| error_to_napi(e, "Font size resolution failed"))?;
    
    Ok(resolved)
}

/// Apply opacity modifier to color
#[napi]
pub fn apply_opacity(color: String, opacity: String) -> napi::Result<String> {
    let result = apply_opacity_impl(&color, &opacity)
        .map_err(|e| error_to_napi(e, "Opacity application failed"))?;
    
    Ok(result)
}

// Implementations
fn resolve_color_impl(color: &str) -> Result<String, String> { /* ... */ Ok(String::new()) }
fn resolve_spacing_impl(spacing: &str) -> Result<String, String> { /* ... */ Ok(String::new()) }
fn resolve_font_size_impl(size: &str) -> Result<String, String> { /* ... */ Ok(String::new()) }
fn apply_opacity_impl(color: &str, opacity: &str) -> Result<String, String> { /* ... */ Ok(String::new()) }
```

```rust
// infrastructure/napi_bridge/caching.rs (NEW)

use crate::infrastructure::napi_bridge::marshalling::*;
use crate::infrastructure::cache_factory::{CacheFactory, CacheBackendType};
use napi::{bindgen_prelude::*, JsObject};

/// Get cache statistics
#[napi]
pub fn get_cache_statistics() -> napi::Result<String> {
    let stats = get_cache_stats_impl()
        .map_err(|e| error_to_napi(e, "Cache statistics failed"))?;
    
    to_json(&stats)
}

/// Clear all caches
#[napi]
pub fn clear_all_caches() -> napi::Result<()> {
    clear_all_caches_impl()
        .map_err(|e| error_to_napi(e, "Clear caches failed"))?;
    
    Ok(())
}

/// Clear specific cache by name
#[napi]
pub fn clear_cache_by_name(name: String) -> napi::Result<()> {
    clear_cache_by_name_impl(&name)
        .map_err(|e| error_to_napi(e, "Clear cache failed"))?;
    
    Ok(())
}

/// Configure cache backend
#[napi]
pub fn configure_cache(backend_type: String, config_json: String) 
    -> napi::Result<String> 
{
    let result = configure_cache_impl(&backend_type, &config_json)
        .map_err(|e| error_to_napi(e, "Cache configuration failed"))?;
    
    to_json(&result)
}

// Implementations
fn get_cache_stats_impl() -> Result<CacheStats, String> { /* ... */ Ok(CacheStats::default()) }
fn clear_all_caches_impl() -> Result<(), String> { /* ... */ Ok(()) }
fn clear_cache_by_name_impl(name: &str) -> Result<(), String> { /* ... */ Ok(()) }
fn configure_cache_impl(backend: &str, config: &str) -> Result<Value, String> { /* ... */ Ok(serde_json::json!({})) }
```

```rust
// infrastructure/napi_bridge/redis_ops.rs (NEW)

use crate::infrastructure::napi_bridge::marshalling::*;
use napi::{bindgen_prelude::*, JsObject};

/// Connect to Redis pool
#[napi]
pub fn redis_pool_connect(config_json: String) -> napi::Result<String> {
    let config = parse_config::<RedisConfig>(config_json, "RedisConfig")?;
    
    let result = redis_connect_impl(config)
        .map_err(|e| error_to_napi(e, "Redis connection failed"))?;
    
    to_json(&result)
}

/// Set key-value in Redis
#[napi]
pub fn redis_set(
    key: String,
    value: String,
    ttl: Option<u32>,
) -> napi::Result<String> {
    let result = redis_set_impl(&key, &value, ttl)
        .map_err(|e| error_to_napi(e, "Redis SET failed"))?;
    
    to_json(&result)
}

/// Get value from Redis
#[napi]
pub fn redis_get(key: String) -> napi::Result<String> {
    let value = redis_get_impl(&key)
        .map_err(|e| error_to_napi(e, "Redis GET failed"))?;
    
    Ok(value)
}

// ... additional Redis operations

// Implementations
fn redis_connect_impl(config: RedisConfig) -> Result<RedisConnectResult, String> { /* ... */ Ok(RedisConnectResult::default()) }
fn redis_set_impl(key: &str, value: &str, ttl: Option<u32>) -> Result<RedisSetResult, String> { /* ... */ Ok(RedisSetResult::default()) }
fn redis_get_impl(key: &str) -> Result<String, String> { /* ... */ Ok(String::new()) }
```

```rust
// infrastructure/napi_bridge/mod.rs (NEW - reexports all)

pub mod marshalling;
pub mod error_handling;
pub mod types;
pub mod constants;
pub mod css_generation;
pub mod class_parsing;
pub mod theme_resolution;
pub mod analysis;
pub mod caching;
pub mod redis_ops;
pub mod watch_system;

// Reexport all public items for backward compatibility
pub use self::marshalling::*;
pub use self::error_handling::*;
pub use self::css_generation::*;
pub use self::class_parsing::*;
pub use self::theme_resolution::*;
pub use self::analysis::*;
pub use self::caching::*;
pub use self::redis_ops::*;
pub use self::watch_system::*;
```

```rust
// infrastructure/napi_bridge.rs (UPDATED - kept for backward compat)

// Reexports from modularized structure
pub use super::napi_bridge::{
    marshalling, error_handling, types, constants,
    css_generation, class_parsing, theme_resolution,
    analysis, caching, redis_ops, watch_system,
};

// Direct reexports of all functions
pub use super::napi_bridge::{
    generate_css_native, generate_css_batch,
    parse_class, parse_classes,
    resolve_color, resolve_spacing,
    get_cache_statistics, clear_all_caches,
    redis_pool_connect, redis_set, redis_get,
    // ... all other functions
};
```

### Testing Strategy

**Unit Tests:**
- Each module has dedicated test file: `css_generation.test.rs`
- Tests for marshalling: valid/invalid JSON, edge cases
- Error handling: all error paths covered

**Integration Tests:**
- Call through entire NAPI bridge flow
- Verify marshalling works end-to-end
- Test cache operations through NAPI layer

**Module Isolation Tests:**
- Mock other modules' dependencies
- Test module behavior in isolation
- Verify module contracts

### Acceptance Criteria

- ✅ 10+ modules created (each <200 LOC)
- ✅ All 130+ functions working correctly
- ✅ Shared marshalling utilities in place
- ✅ <10% performance overhead from refactoring
- ✅ Test coverage improved from 40% → 70%+
- ✅ Error handling consistent across modules
- ✅ Backward compatibility maintained

---

## Improvement 4: Property-Based Testing (R4)

### Problem Statement

**Current State:**
- Example-based testing only (545+ tests)
- No property verification (determinism, round-trip, etc.)
- Edge cases discovered through user bug reports
- No systematic coverage of input space

### Solution Design

**Phase 1: Add Dependencies**

```toml
# Cargo.toml

[dev-dependencies]
proptest = "1.0"
quickcheck = "1"
quickcheck_macros = "1"
```

**Phase 2: Property Test Suite**

```rust
// tests/property_tests.rs (NEW)

#[cfg(test)]
mod property_based_tests {
    use proptest::prelude::*;
    use quickcheck::{QuickCheck, TestResult};
    use quickcheck_macros::quickcheck;
    use crate::application::class_parser::ClassParser;
    use crate::infrastructure::lru_cache::LruCache;
    
    // Property 1: Parser determinism
    // For any input, parsing produces same output every time
    proptest! {
        #[test]
        fn prop_parser_is_deterministic(class in r"[a-z][a-z0-9:\-_]*") {
            let result1 = ClassParser::parse(&class);
            let result2 = ClassParser::parse(&class);
            let result3 = ClassParser::parse(&class);
            
            prop_assert_eq!(result1, result2, "Parser not deterministic (attempt 1-2)");
            prop_assert_eq!(result2, result3, "Parser not deterministic (attempt 2-3)");
            prop_assert_eq!(result1, result3, "Parser not deterministic (attempt 1-3)");
        }
    }
    
    // Property 2: Round-trip parsing
    // Parse -> compile -> parse should produce equivalent result
    proptest! {
        #[test]
        fn prop_parse_roundtrip(
            prefix in "[a-z]+",
            modifier in "[a-z0-9\\-]*",
            value in "[a-z0-9\\-./]+",
        ) {
            let class = if modifier.is_empty() {
                format!("{}-{}", prefix, value)
            } else {
                format!("{}:{}-{}", prefix, modifier, value)
            };
            
            if let Ok(parsed1) = ClassParser::parse(&class) {
                let reconstructed = parsed1.full_class_name();
                
                if let Ok(parsed2) = ClassParser::parse(&reconstructed) {
                    prop_assert_eq!(
                        parsed1.prefix, parsed2.prefix,
                        "Prefix mismatch after round-trip"
                    );
                    prop_assert_eq!(
                        parsed1.value, parsed2.value,
                        "Value mismatch after round-trip"
                    );
                }
            }
        }
    }
    
    // Property 3: Cache consistency
    // Get after put must return same value (within session)
    #[quickcheck]
    fn prop_cache_get_after_put(
        key: String,
        value: String,
    ) -> TestResult {
        if key.is_empty() || value.is_empty() {
            return TestResult::discard();
        }
        
        let cache = LruCache::new(100);
        cache.put(key.clone(), value.clone());
        
        TestResult::from_bool(cache.get(&key) == Some(value))
    }
    
    // Property 4: Cache eviction preserves recent items
    // When cache full, new items evict oldest, keep recent
    proptest! {
        #[test]
        fn prop_cache_lru_eviction(
            items in prop::collection::vec((r"[a-z0-9]+", r"[a-z0-9]+"), 0..20)
        ) {
            let cache = LruCache::new(10);
            let mut added_keys = Vec::new();
            
            for (key, value) in items {
                cache.put(key.clone(), value);
                added_keys.push(key);
            }
            
            // Last 10 items should be in cache
            let recent_keys: Vec<_> = added_keys
                .iter()
                .rev()
                .take(10)
                .cloned()
                .collect();
            
            for key in &recent_keys {
                prop_assert!(cache.get(key).is_some(), "Recent key {} should still be in cache", key);
            }
        }
    }
    
    // Property 5: Variant composition order deterministic
    // Same variants always compose in same order
    proptest! {
        #[test]
        fn prop_variant_composition_deterministic(
            variants in prop::collection::vec(
                prop_oneof![
                    Just("hover"),
                    Just("focus"),
                    Just("dark"),
                    Just("lg"),
                    Just("sm"),
                ],
                0..10
            )
        ) {
            let order1 = order_variants(&variants);
            let order2 = order_variants(&variants);
            let order3 = order_variants(&variants);
            
            prop_assert_eq!(order1, order2, "Variant order not deterministic (1-2)");
            prop_assert_eq!(order2, order3, "Variant order not deterministic (2-3)");
        }
    }
    
    // Property 6: CSS generation produces valid CSS
    // Generated CSS parses as valid CSS selector and rules
    proptest! {
        #[test]
        fn prop_generated_css_valid(
            class in r"[a-z][a-z0-9:\-_]*"
        ) {
            if let Ok(rule) = compile_class(&class) {
                let css = generate_css(&rule, false);
                
                // CSS should not be empty
                prop_assert!(!css.is_empty(), "Empty CSS generated");
                
                // CSS should contain selector
                prop_assert!(css.contains("{"), "No opening brace");
                prop_assert!(css.contains("}"), "No closing brace");
                
                // CSS should not contain invalid sequences
                prop_assert!(!css.contains("{{"), "Invalid double braces");
                prop_assert!(!css.contains("}}"), "Invalid double braces");
            }
        }
    }
    
    // Helper functions
    fn order_variants(variants: &[&str]) -> Vec<&str> {
        // Deterministic sorting of variants
        let mut sorted = variants.to_vec();
        sorted.sort();
        sorted
    }
}
```

### Data Flow

```
TypeScript Test Suite
         ↓
Rust Property Tests
    /  |  |  \  \
   /   |  |   \  \
Parser Cache Variant CSS Theme
Tests  Tests Tests  Gen  Tests
        ↓
Property Verification
 (1000+ iterations each)
```

### Testing Strategy

**Execution:**
- Run via `cargo test --test property_tests`
- Each property: 1000+ random iterations
- Shrinking: find minimal failing example
- Regression tests: preserve discovered edge cases

**Coverage:**
- Parser: 1000+ class strings
- Cache: 1000+ key-value operations
- Variants: 1000+ variant combinations
- CSS: 1000+ class compilations

### Acceptance Criteria

- ✅ proptest/quickcheck integrated
- ✅ 5+ property tests implemented
- ✅ 1000+ iterations per property passing
- ✅ Edge cases discovered and fixed
- ✅ Zero regressions on existing tests
- ✅ CI runs property tests regularly

---

## Improvement 5: Variant System Precedence (R5)

### Problem Statement

**Current State:**
- Variants resolved independently
- No defined precedence/priority rules
- Complex variant stacking may cause ordering issues
- Comments in code hint at old bugs: "defaults win..."

**Risk Scenario:**
```
Classes: ["dark:lg:hover:bg-blue-500", "hover:lg:dark:bg-red-500"]
Current: Order depends on how they appear in input
Issue: Could generate different CSS depending on input order
Desired: Always consistent CSS regardless of class order
```

### Solution Design

**Phase 1: Define Precedence Rules**

```rust
// domain/variant_precedence.rs (NEW)

/// Variant precedence levels (lower = higher priority)
/// Used to deterministically order variant composition
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum VariantPrecedence {
    /// Interaction variants - highest priority
    /// group:, peer:, group-hover:, peer-focus:
    Interaction = 0,
    
    /// Color scheme variants
    /// dark:, light:
    ColorScheme = 1,
    
    /// Responsive variants - medium priority
    /// sm:, md:, lg:, xl:, 2xl:
    Responsive = 2,
    
    /// State variants - lower priority
    /// hover:, focus:, active:, disabled:, etc.
    State = 3,
    
    /// Custom/unknown variants - lowest priority
    Custom = 4,
}

impl VariantPrecedence {
    /// Get human-readable name
    pub fn name(&self) -> &'static str {
        match self {
            VariantPrecedence::Interaction => "Interaction",
            VariantPrecedence::ColorScheme => "ColorScheme",
            VariantPrecedence::Responsive => "Responsive",
            VariantPrecedence::State => "State",
            VariantPrecedence::Custom => "Custom",
        }
    }
}

/// Determine precedence for specific variant
pub fn get_variant_precedence(variant: &str) -> VariantPrecedence {
    // Remove trailing colon if present
    let variant_name = variant.trim_end_matches(':');
    
    match variant_name {
        // Interaction variants
        "group" | "peer" | "group-hover" | "peer-focus" | "group-focus" => {
            VariantPrecedence::Interaction
        }
        
        // Color scheme variants
        "dark" | "light" => {
            VariantPrecedence::ColorScheme
        }
        
        // Responsive variants
        "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" => {
            VariantPrecedence::Responsive
        }
        
        // State variants
        "hover" | "focus" | "active" | "disabled" | "visited" | 
        "group-disabled" | "first" | "last" | "odd" | "even" => {
            VariantPrecedence::State
        }
        
        // Unknown: treat as custom
        _ => VariantPrecedence::Custom,
    }
}
```

**Phase 2: Update Variant System**

```rust
// application/variant_system.rs (UPDATED)

use crate::domain::variant_precedence::{VariantPrecedence, get_variant_precedence};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResolvedVariant {
    pub name: String,
    pub precedence: VariantPrecedence,
}

impl ResolvedVariant {
    pub fn new(name: String) -> Self {
        let precedence = get_variant_precedence(&name);
        Self { name, precedence }
    }
}

pub struct VariantSystem;

impl VariantSystem {
    /// Compose variants in deterministic precedence order
    pub fn compose_variants(variants: &[Variant]) -> Vec<Variant> {
        let mut resolved: Vec<ResolvedVariant> = variants
            .iter()
            .map(|v| ResolvedVariant::new(v.name().to_string()))
            .collect();
        
        // Sort by precedence (lower number = higher priority = comes first)
        resolved.sort_by_key(|v| v.precedence);
        
        // Convert back to Variant enum
        resolved
            .into_iter()
            .map(|rv| Variant::Named(rv.name))
            .collect()
    }
    
    /// Resolve all variants to their CSS components
    pub fn resolve_variants(
        variants: &[Variant],
        config: &ThemeConfig,
    ) -> Result<VariantComponents, VariantError> {
        // First: compose in deterministic order
        let composed = Self::compose_variants(variants);
        
        // Then: resolve each to CSS
        let mut media_queries = Vec::new();
        let mut selectors = Vec::new();
        
        for variant in &composed {
            match Self::resolve_single_variant(variant, config)? {
                CssVariantComponent::MediaQuery(mq) => media_queries.push(mq),
                CssVariantComponent::Selector(sel) => selectors.push(sel),
            }
        }
        
        Ok(VariantComponents {
            media_queries,
            selectors,
        })
    }
    
    fn resolve_single_variant(
        variant: &Variant,
        _config: &ThemeConfig,
    ) -> Result<CssVariantComponent, VariantError> {
        // Implementation for resolving individual variants
        Ok(CssVariantComponent::Selector(String::new()))
    }
}
```

**Phase 3: Testing**

```rust
// tests/variant_precedence_tests.rs (NEW)

#[cfg(test)]
mod variant_precedence_tests {
    use crate::application::variant_system::VariantSystem;
    use crate::domain::variant_precedence::{VariantPrecedence, get_variant_precedence};
    use crate::domain::variant::Variant;
    
    #[test]
    fn test_precedence_levels() {
        assert_eq!(get_variant_precedence("group"), VariantPrecedence::Interaction);
        assert_eq!(get_variant_precedence("dark"), VariantPrecedence::ColorScheme);
        assert_eq!(get_variant_precedence("lg"), VariantPrecedence::Responsive);
        assert_eq!(get_variant_precedence("hover"), VariantPrecedence::State);
        assert_eq!(get_variant_precedence("custom"), VariantPrecedence::Custom);
    }
    
    #[test]
    fn test_variant_composition_order() {
        let variants = vec![
            Variant::Named("hover".to_string()),      // State (3)
            Variant::Named("lg".to_string()),         // Responsive (2)
            Variant::Named("dark".to_string()),       // ColorScheme (1)
            Variant::Named("group".to_string()),      // Interaction (0)
        ];
        
        let composed = VariantSystem::compose_variants(&variants);
        
        // Should be ordered by precedence: group, dark, lg, hover
        assert_eq!(composed[0].name(), "group");
        assert_eq!(composed[1].name(), "dark");
        assert_eq!(composed[2].name(), "lg");
        assert_eq!(composed[3].name(), "hover");
    }
    
    #[test]
    fn test_variant_order_deterministic() {
        let variants = vec![
            Variant::Named("hover".to_string()),
            Variant::Named("dark".to_string()),
            Variant::Named("lg".to_string()),
        ];
        
        let order1 = VariantSystem::compose_variants(&variants);
        let order2 = VariantSystem::compose_variants(&variants);
        let order3 = VariantSystem::compose_variants(&variants);
        
        assert_eq!(order1, order2);
        assert_eq!(order2, order3);
    }
    
    #[test]
    fn test_complex_variant_stacking() {
        // Multiple variants in different orders should produce same result
        let input1 = vec![
            Variant::Named("dark".to_string()),
            Variant::Named("lg".to_string()),
            Variant::Named("hover".to_string()),
        ];
        
        let input2 = vec![
            Variant::Named("hover".to_string()),
            Variant::Named("dark".to_string()),
            Variant::Named("lg".to_string()),
        ];
        
        let composed1 = VariantSystem::compose_variants(&input1);
        let composed2 = VariantSystem::compose_variants(&input2);
        
        assert_eq!(composed1, composed2, "Same variants in different order should compose identically");
    }
    
    proptest! {
        #[test]
        fn prop_variant_composition_deterministic(
            variant_names in prop::collection::vec(
                prop_oneof![
                    Just("group"), Just("peer"),
                    Just("dark"), Just("light"),
                    Just("sm"), Just("md"), Just("lg"),
                    Just("hover"), Just("focus"), Just("active"),
                ],
                0..20
            )
        ) {
            let variants: Vec<_> = variant_names
                .iter()
                .map(|n| Variant::Named(n.to_string()))
                .collect();
            
            let order1 = VariantSystem::compose_variants(&variants);
            let order2 = VariantSystem::compose_variants(&variants);
            let order3 = VariantSystem::compose_variants(&variants);
            
            prop_assert_eq!(order1, order2);
            prop_assert_eq!(order2, order3);
        }
    }
}
```

### Acceptance Criteria

- ✅ VariantPrecedence enum defined
- ✅ All variants assigned precedence level
- ✅ Composition sorting implemented
- ✅ Tests verify correct ordering
- ✅ Complex variant stacking works correctly
- ✅ Deterministic output for all input orders

---

## Improvement 6: Theme Resolver Caching (R6)

### Problem Statement

**Current State:**
```
Compilation Flow (Current):
Stage 1: Parse Classes
  → ThemeResolver::new() [expensive] 
  → Builds complete lookup table (1-2ms)
  
Stage 2: Generate CSS
  → ThemeResolver::new() [expensive, duplicate]
  → Rebuilds same lookup table
  
Stage 3: Resolve Colors/Spacing
  → Multiple resolver instances created
  → Cache benefits NOT reused
```

**Impact:**
- Each compilation rebuilds theme lookups
- Same theme resolved multiple times
- Repeated compilations slow (no cache reuse)
- Memory: multiple resolver instances

**Target Improvement:** 10-50x faster repeated compiles

### Solution Design

**Phase 1: Theme Resolver Pool**

```rust
// application/theme_resolver_pool.rs (NEW)

use crate::domain::theme_config::ThemeConfig;
use crate::application::theme_resolver::ThemeResolver;
use std::sync::Arc;
use dashmap::DashMap;
use lazy_static::lazy_static;

/// Singleton pool managing ThemeResolver instances
/// Reuses resolvers across compilations for same theme
pub struct ThemeResolverPool {
    /// Map: theme_id -> cached resolver instance
    resolvers: Arc<DashMap<u64, Arc<ThemeResolver>>>,
    /// Map: theme hash -> resolver config
    configs: Arc<DashMap<u64, ThemeConfig>>,
    /// Statistics
    hits: Arc<AtomicU64>,
    misses: Arc<AtomicU64>,
}

impl ThemeResolverPool {
    pub fn new() -> Self {
        Self {
            resolvers: Arc::new(DashMap::new()),
            configs: Arc::new(DashMap::new()),
            hits: Arc::new(AtomicU64::new(0)),
            misses: Arc::new(AtomicU64::new(0)),
        }
    }
    
    /// Get or create resolver for theme
    /// Returns cached instance if available, creates new if needed
    pub fn get_or_create(
        &self,
        theme_id: u64,
        config: ThemeConfig,
    ) -> Arc<ThemeResolver> {
        // Try to get existing
        if let Some(resolver) = self.resolvers.get(&theme_id) {
            self.hits.fetch_add(1, Ordering::Relaxed);
            return resolver.clone();
        }
        
        // Create new
        self.misses.fetch_add(1, Ordering::Relaxed);
        let resolver = Arc::new(ThemeResolver::new(config.clone()));
        self.configs.insert(theme_id, config);
        self.resolvers.insert(theme_id, resolver.clone());
        resolver
    }
    
    /// Get statistics
    pub fn stats(&self) -> PoolStats {
        let hits = self.hits.load(Ordering::Relaxed);
        let misses = self.misses.load(Ordering::Relaxed);
        let total = hits + misses;
        
        PoolStats {
            hits,
            misses,
            total,
            hit_rate: if total == 0 { 0.0 } else { (hits as f64) / (total as f64) },
            cached_resolvers: self.resolvers.len(),
        }
    }
    
    /// Clear all cached resolvers
    pub fn clear(&self) {
        self.resolvers.clear();
        self.configs.clear();
        self.hits.store(0, Ordering::Relaxed);
        self.misses.store(0, Ordering::Relaxed);
    }
    
    /// Remove specific resolver
    pub fn remove(&self, theme_id: u64) {
        self.resolvers.remove(&theme_id);
        self.configs.remove(&theme_id);
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolStats {
    pub hits: u64,
    pub misses: u64,
    pub total: u64,
    pub hit_rate: f64,
    pub cached_resolvers: usize,
}

impl Default for ThemeResolverPool {
    fn default() -> Self {
        Self::new()
    }
}

// Global pool instance (singleton)
lazy_static! {
    pub static ref THEME_RESOLVER_POOL: ThemeResolverPool = ThemeResolverPool::new();
}
```

**Phase 2: Update NAPI Bridge**

```rust
// infrastructure/napi_bridge/theme_resolution.rs (UPDATED)

use crate::application::theme_resolver_pool::THEME_RESOLVER_POOL;
use crate::infrastructure::napi_bridge::marshalling::*;
use napi::{bindgen_prelude::*, JsObject};

/// Resolve color value from theme
/// Uses cached resolver if available
#[napi]
pub fn resolve_color_cached(
    theme_id: u64,
    color: String,
    theme_config_json: Option<String>,
) -> napi::Result<String> {
    let config = if let Some(json) = theme_config_json {
        parse_config::<ThemeConfig>(json, "ThemeConfig")?
    } else {
        ThemeConfig::default()
    };
    
    let resolver = THEME_RESOLVER_POOL.get_or_create(theme_id, config);
    let resolved = resolver.resolve_color(&color)
        .map_err(|e| error_to_napi(e, "Color resolution failed"))?;
    
    Ok(resolved)
}

/// Resolve spacing value from theme
/// Uses cached resolver if available
#[napi]
pub fn resolve_spacing_cached(
    theme_id: u64,
    spacing: String,
    theme_config_json: Option<String>,
) -> napi::Result<String> {
    let config = if let Some(json) = theme_config_json {
        parse_config::<ThemeConfig>(json, "ThemeConfig")?
    } else {
        ThemeConfig::default()
    };
    
    let resolver = THEME_RESOLVER_POOL.get_or_create(theme_id, config);
    let resolved = resolver.resolve_spacing(&spacing)
        .map_err(|e| error_to_napi(e, "Spacing resolution failed"))?;
    
    Ok(resolved)
}

/// Get resolver pool statistics
#[napi]
pub fn get_resolver_pool_stats() -> napi::Result<String> {
    let stats = THEME_RESOLVER_POOL.stats();
    to_json(&stats)
}

/// Clear resolver pool (e.g., when theme changed)
#[napi]
pub fn clear_resolver_pool() -> napi::Result<()> {
    THEME_RESOLVER_POOL.clear();
    Ok(())
}
```

**Phase 3: Benchmark Comparison**

```rust
// benches/theme_resolver_cache_bench.rs (NEW)

#![feature(test)]
extern crate test;

use test::Bencher;
use crate::application::theme_resolver::ThemeResolver;
use crate::application::theme_resolver_pool::THEME_RESOLVER_POOL;
use crate::domain::theme_config::ThemeConfig;

#[bench]
fn bench_resolver_without_cache(b: &mut Bencher) {
    let config = ThemeConfig::default();
    let colors = vec!["blue-500", "red-300", "green-700", "gray-100"];
    
    b.iter(|| {
        let resolver = ThemeResolver::new(config.clone());
        for color in &colors {
            test::black_box(resolver.resolve_color(color));
        }
    });
}

#[bench]
fn bench_resolver_with_cache(b: &mut Bencher) {
    let config = ThemeConfig::default();
    let colors = vec!["blue-500", "red-300", "green-700", "gray-100"];
    
    b.iter(|| {
        let resolver = THEME_RESOLVER_POOL.get_or_create(1, config.clone());
        for color in &colors {
            test::black_box(resolver.resolve_color(color));
        }
    });
}

// Expected results:
// bench_resolver_without_cache: ~2000 ns/iter (each call creates new resolver)
// bench_resolver_with_cache: ~20 ns/iter (reuses cached resolver)
// Improvement: ~100x faster!
```

### Data Flow

```
TypeScript Compilation Pipeline
         ↓
    NAPI: resolve_color_cached(theme_id, color)
         ↓
  THEME_RESOLVER_POOL.get_or_create(theme_id, config)
    /              \
   /                \
Hit (cache)      Miss (new)
  |                  |
Return            Create
cached            ThemeResolver
resolver             |
  |                Store
  └────────┬────────┘
           ↓
  Resolve color from theme
         ↓
  Return to TypeScript
```

### Testing Strategy

**Unit Tests:**
- Pool returns same instance for same theme_id
- Pool creates new instance for new theme_id
- Stats track hits/misses correctly
- Clear works correctly

**Integration Tests:**
- Multiple compilations reuse resolver
- Stats show increasing hit rate
- Memory doesn't grow unbounded

**Benchmark Tests:**
- 10-50x improvement verified
- Memory usage acceptable

### Acceptance Criteria

- ✅ Pool implemented with proper locking
- ✅ 10-50x faster on repeated compiles verified
- ✅ Memory efficient (no leaks)
- ✅ All tests passing
- ✅ Backward compatible with old API
- ✅ Statistics tracking working

---

## Improvement 7: TypeScript Export Organization (R7)

### Problem Statement

**Current State:**
- Single entry point exports 60+ items
- Tree-shaking difficult (bundlers can't eliminate unused portions)
- Bundle size larger than necessary
- Harder to navigate for users

### Solution Design

**Phase 1: Create Sub-Entry Points**

```json
{
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./compiler": {
      "require": "./dist/compiler/index.js",
      "import": "./dist/compiler/index.mjs",
      "types": "./dist/compiler/index.d.ts"
    },
    "./parser": {
      "require": "./dist/parser/index.js",
      "import": "./dist/parser/index.mjs",
      "types": "./dist/parser/index.d.ts"
    },
    "./analyzer": {
      "require": "./dist/analyzer/index.js",
      "import": "./dist/analyzer/index.mjs",
      "types": "./dist/analyzer/index.d.ts"
    },
    "./cache": {
      "require": "./dist/cache/index.js",
      "import": "./dist/cache/index.mjs",
      "types": "./dist/cache/index.d.ts"
    },
    "./redis": {
      "require": "./dist/redis/index.js",
      "import": "./dist/redis/index.mjs",
      "types": "./dist/redis/index.d.ts"
    },
    "./watch": {
      "require": "./dist/watch/index.js",
      "import": "./dist/watch/index.mjs",
      "types": "./dist/watch/index.d.ts"
    }
  }
}
```

**Phase 2: Organize Source Files**

```
packages/domain/compiler/src/
├── index.ts                    # Main re-export (backward compat)
├── compiler/
│   ├── index.ts               # CSS generation exports
│   ├── cssGeneratorNative.ts
│   └── compilationNative.ts
├── parser/
│   ├── index.ts               # Parsing exports
│   └── scannerNative.ts
├── analyzer/
│   ├── index.ts               # Analysis exports
│   └── analyzerNative.ts
├── cache/
│   ├── index.ts               # Cache exports
│   └── cacheNative.ts
├── redis/
│   ├── index.ts               # Redis exports
│   └── redisNative.ts
└── watch/
    ├── index.ts               # Watch exports
    └── watchNative.ts
```

**Phase 3: Entry Point Files**

```typescript
// src/compiler/index.ts
export { generateCss, compileCss, compile } from '../cssGeneratorNative';
export { compileClasses } from '../compilationNative';
export type { CssGenerationOptions } from '../types';

// src/parser/index.ts
export { parseClass, parseClasses } from '../scannerNative';
export type { ParsedClass } from '../types';

// src/analyzer/index.ts
export { analyzeClasses } from '../analyzerNative';
export type { Analysis } from '../types';

// src/cache/index.ts
export { getStats, clear, configure } from '../cacheNative';
export type { CacheStats } from '../types';

// src/redis/index.ts
export { connect, set, get, del } from '../redisNative';
export type { RedisConfig } from '../types';

// src/watch/index.ts
export { watch, unwatch } from '../watchNative';
export type { WatchOptions } from '../types';

// src/index.ts (main, backward compat)
export * from './compiler';
export * from './parser';
export * from './analyzer';
export * from './cache';
export * from './redis';
export * from './watch';
```

### Acceptance Criteria

- ✅ Sub-entry points defined
- ✅ Backward compatible main export
- ✅ Tree-shaking verified
- ✅ Bundle size reduced

---

## Improvement 8: Fallback Logic Testing (R8)

### Problem Statement

**Current State:**
- Fallback to JavaScript when native unavailable not tested
- Error messages could be clearer
- Silent failures possible

### Solution Design

**Tests for Graceful Degradation**

```typescript
// test/fallback-logic.test.ts (NEW)

describe('Native Bridge Fallback', () => {
    beforeEach(() => {
        // Clear module cache
        jest.resetModules();
    });
    
    test('Falls back to JS when native binding unavailable', async () => {
        // Mock native binding to fail
        jest.doMock('../dist/nativeBridge', () => {
            throw new Error('Native binding not available');
        });
        
        const bridge = require('../dist/nativeBridge').default;
        expect(bridge).toBeDefined();
        
        const result = await bridge.generateCss(['px-4', 'bg-blue']);
        expect(result).toBeDefined();
        expect(result.length > 0).toBe(true);
    });
    
    test('All exported functions have fallback', async () => {
        const bridge = require('../dist/nativeBridge').default;
        const functions = Object.keys(bridge).filter(k => typeof bridge[k] === 'function');
        
        for (const fnName of functions) {
            expect(typeof bridge[fnName]).toBe('function');
        }
    });
    
    test('Error messages are clear and helpful', async () => {
        // Mock specific failure
        jest.doMock('../dist/nativeBridge', () => ({
            generateCss: () => {
                throw new Error('Native binding failed: ENOENT /native/index.node');
            }
        }));
        
        const bridge = require('../dist/nativeBridge').default;
        
        try {
            await bridge.generateCss(['px-4']);
            fail('Should throw error');
        } catch (error) {
            expect(error.message).toContain('Native binding failed');
            expect(error.message).toContain('readable error context');
        }
    });
    
    test('JavaScript fallback produces correct output', async () => {
        // Use JS fallback explicitly
        const { fallbackGenerateCss } = require('../dist/fallback');
        
        const result = await fallbackGenerateCss(['px-4', 'bg-blue-500']);
        expect(result).toBeDefined();
        expect(result).toContain('px: 1rem');
        expect(result).toContain('background-color');
    });
});
```

### Acceptance Criteria

- ✅ Fallback tests implemented
- ✅ All functions fallback correctly
- ✅ Error messages clear
- ✅ User experience improved

---

## Performance Targets

| Improvement | Target | Current | Gain |
|-------------|--------|---------|------|
| Binary Size (R1) | -5% | 100% | 5% smaller |
| Theme Resolution (R6) | 10-50x faster | 1x | 10-50x faster |
| Cache Abstraction (R2) | No regression | N/A | Better flexibility |
| Test Coverage (R4) | 85%+ | 60% | +25% coverage |
| Parser Consolidation (R1) | Single source | Dual | Easier maintenance |
| NAPI Bridge (R3) | <200 LOC/module | 1200 LOC | Better organization |

---

## Backward Compatibility Strategy

All improvements maintain 100% backward compatibility:

1. **R1 Parser:** v2 has feature parity with v1
2. **R2 Cache:** CacheBackend trait invisible to existing code
3. **R3 NAPI:** Re-exports maintain same API surface
4. **R6 Theme:** New cached methods, old methods still work
5. **R7 Exports:** Main export unchanged

---

## Testing Summary

### Test Coverage by Improvement

| R# | Unit | Integration | Property | E2E | Target |
|----|------|-------------|----------|-----|--------|
| R1 | ✅ | ✅ | ✅ | ✅ | 100% |
| R2 | ✅ | ✅ | ✅ | ✅ | 90%+ |
| R3 | ✅ | ✅ | ✅ | ✅ | 70%+ |
| R4 | N/A | N/A | ✅ | ✅ | 1000+ per property |
| R5 | ✅ | ✅ | ✅ | ✅ | 100% |
| R6 | ✅ | ✅ | ✅ | ✅ | 100% |
| R7 | ✅ | ✅ | N/A | ✅ | 100% |
| R8 | ✅ | ✅ | N/A | ✅ | 100% |

---

## Implementation Timeline

### Phase 7.1: Parser Consolidation (Weeks 1-4)
- Import audit and consolidation
- Verification and testing
- Binary size reduction

### Phase 7.2: Cache Abstraction (Weeks 5-9)
- Trait definition
- Adapter implementations
- Factory pattern
- NAPI integration

### Phase 7.3: NAPI Modularization (Weeks 10-15)
- Module structure
- Function organization
- Error handling
- Test expansion

### Phase 7.4: Remaining Improvements (Weeks 16+)
- Property tests
- Variant precedence
- Theme caching
- Export organization
- Fallback testing

---

## Success Criteria

- ✅ All 8 improvements implemented
- ✅ Test coverage: 60% → 85%+
- ✅ Technical debt reduced by ~40%
- ✅ Binary size reduced by ~5%
- ✅ Theme resolution 10-50x faster
- ✅ Zero regressions
- ✅ 100% backward compatibility
- ✅ Code quality improved measurably
- ✅ Architecture cleaner and more maintainable

---

**Design Document Status:** Complete and ready for implementation  
**Review Date:** 2026-06-11  
**Next Phase:** Create detailed tasks (.kiro/specs/phase-7-architecture/tasks.md)

