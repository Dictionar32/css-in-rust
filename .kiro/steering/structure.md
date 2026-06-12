# Project Structure & Organization

## Root Layout

```
css-in-rust/
├── .kiro/                          # Kiro spec & steering files
│   ├── specs/                      # Feature specifications
│   │   ├── phase-7-architecture/   # Phase 7 modularization specs
│   │   ├── rust-css-compiler-engine/
│   │   └── use-all-63-rust-functions/
│   └── steering/                   # AI guidance documents
│       ├── product.md
│       ├── tech.md
│       └── structure.md (this file)
│
├── .github/                        # GitHub workflows & templates
│   ├── workflows/                  # CI/CD pipelines (ci, publish, benchmark, etc.)
│   └── ISSUE_TEMPLATE/             # Bug reports, feature requests
│
├── config/                         # Centralized configuration (Phase 7+)
│   ├── tsconfig.base.json
│   ├── biome.json
│   ├── turbo.json
│   └── ...
│
├── docs/                           # Documentation
│   ├── archive/                    # Phase summaries, session notes
│   └── README.md
│
├── native/                         # 🦀 Rust native engine
│   ├── src/
│   │   ├── domain/                 # Core business logic
│   │   │   ├── variants.rs         # Variant resolution
│   │   │   ├── variant_precedence.rs
│   │   │   ├── parsed_class.rs     # Class data structures
│   │   │   ├── theme_config.rs
│   │   │   ├── error.rs
│   │   │   ├── css_compiler.rs
│   │   │   └── mod.rs
│   │   │
│   │   ├── application/            # High-level operations
│   │   │   ├── class_parser_v2.rs  # Main parser (production)
│   │   │   ├── class_parser.rs     # Legacy parser (deprecated)
│   │   │   ├── css_generator.rs    # CSS generation
│   │   │   ├── variant_system.rs   # Variant composition
│   │   │   ├── theme_resolver.rs   # Theme token resolution
│   │   │   ├── theme_resolver_pool.rs # Multi-tier caching
│   │   │   └── mod.rs
│   │   │
│   │   ├── infrastructure/         # External integrations & I/O
│   │   │   ├── napi_bridge.rs      # Facade (re-exports all modules)
│   │   │   ├── napi_bridge_types.rs
│   │   │   ├── napi_bridge_marshalling.rs
│   │   │   ├── napi_bridge_errors.rs
│   │   │   ├── napi_bridge_css.rs
│   │   │   ├── napi_bridge_parsing.rs
│   │   │   ├── napi_bridge_theme.rs
│   │   │   ├── napi_bridge_cache.rs
│   │   │   ├── napi_bridge_redis.rs
│   │   │   ├── napi_bridge_analysis.rs
│   │   │   ├── napi_bridge_watch.rs
│   │   │   ├── cache_backend.rs    # Cache strategy selection
│   │   │   ├── lru_cache.rs        # LRU cache implementation
│   │   │   ├── lazy_cache.rs       # Lazy initialization
│   │   │   ├── persistent_cache.rs # File-based cache
│   │   │   ├── redis_cache.rs      # Redis backend
│   │   │   ├── distributed_cache.rs
│   │   │   ├── atomic_cache_stats.rs
│   │   │   ├── streaming_compiler.rs
│   │   │   ├── adapters.rs
│   │   │   ├── mod.rs
│   │   │   └── regex_patterns.rs
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.rs
│   │   │   └── mod.rs
│   │   │
│   │   ├── legacy_root_part.rs     # Deprecated legacy code
│   │   ├── tests.rs                # Unit tests
│   │   └── lib.rs                  # Crate root
│   │
│   ├── tests/                      # Integration tests
│   │   ├── integration_tests.rs
│   │   ├── css_generator_tests.rs
│   │   ├── napi_bridge_integration_tests.rs
│   │   ├── property_*.rs           # Property-based tests (R4 Phase 7)
│   │   │   ├── property_parser_determinism.rs
│   │   │   ├── property_round_trip_parsing.rs
│   │   │   ├── property_variant_composition.rs
│   │   │   ├── property_cache_consistency.rs
│   │   │   ├── property_cache_eviction.rs
│   │   │   └── property_css_validity.rs
│   │   ├── resolver_pool_*.rs
│   │   └── variant_precedence_integration_tests.rs
│   │
│   ├── benches/                    # Performance benchmarks
│   │   ├── performance_bench.rs
│   │   ├── class_parser_v2_bench.rs
│   │   ├── cache_backends_bench.rs
│   │   ├── phase2_performance_bench.rs
│   │   ├── week8_memory_profiling.rs
│   │   └── ...
│   │
│   ├── src/bin/
│   │   └── export_schemas.rs       # Schema export utility
│   │
│   ├── Cargo.toml                  # Rust dependencies & profiles
│   ├── Cargo.lock
│   ├── build.rs                    # Build script for NAPI
│   ├── index.ts                    # TypeScript bridge
│   ├── index.d.ts                  # Type definitions for Node
│   ├── tsconfig.json
│   ├── index.test.ts
│   ├── API.md                      # NAPI function documentation
│   ├── ARCHITECTURE_MODULAR_GUIDE.md
│   └── .node files (generated)
│
├── packages/                       # npm workspace packages
│   ├── domain/                     # Core business logic packages
│   │   ├── core/                   # tw, cx, cv, cn APIs
│   │   │   ├── src/
│   │   │   │   ├── cv.ts           # Variant composition (runtime)
│   │   │   │   ├── native.ts       # Native module integration
│   │   │   │   ├── index.ts
│   │   │   │   └── ...
│   │   │   ├── tests/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   │
│   │   ├── compiler/               # Tailwind CSS v4 + LightningCSS pipeline
│   │   │   ├── src/
│   │   │   │   ├── nativeBridge.ts
│   │   │   │   ├── nativeBridgeWrappers.ts
│   │   │   │   ├── cssGeneratorNative.ts
│   │   │   │   ├── analyzerNative.ts
│   │   │   │   ├── scannerNative.ts
│   │   │   │   ├── compilationNative.ts
│   │   │   │   ├── themeResolutionNative.ts
│   │   │   │   ├── idRegistryNative.ts
│   │   │   │   ├── tailwindEngine.ts
│   │   │   │   ├── managers/
│   │   │   │   │   ├── OptimizationManager.ts
│   │   │   │   │   ├── WatchManager.ts
│   │   │   │   │   ├── IncrementalManager.ts
│   │   │   │   │   ├── RedisManager.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── types/
│   │   │   │   │   ├── redis.ts
│   │   │   │   │   └── id-registry.ts
│   │   │   │   ├── errors/
│   │   │   │   │   └── ERROR_HANDLING_GUIDE.md
│   │   │   │   ├── internal.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── __tests__/
│   │   │   ├── tsup.config.ts
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   │
│   │   ├── scanner/                # File scanning + AST extraction
│   │   │   ├── src/
│   │   │   └── ...
│   │   │
│   │   ├── engine/                 # CSS engine orchestration
│   │   │   ├── src/
│   │   │   └── ...
│   │   │
│   │   ├── theme/                  # Theme configuration
│   │   │   ├── src/
│   │   │   └── ...
│   │   │
│   │   ├── shared/                 # Shared utilities & types
│   │   │   ├── src/
│   │   │   │   ├── hash.ts
│   │   │   │   ├── generated/       # Auto-generated schemas
│   │   │   │   └── ...
│   │   │   └── ...
│   │   │
│   │   ├── preset/                 # Tailwind CSS presets
│   │   ├── animate/                # Animation utilities
│   │   ├── analyzer/               # CSS analysis
│   │   ├── plugin/                 # Plugin system
│   │   ├── plugin-api/
│   │   ├── plugin-registry/
│   │   ├── runtime/                # Runtime utilities
│   │   ├── runtime-css/            # Browser-safe CSS runtime
│   │   ├── syntax/                 # Syntax validation
│   │   └── testing/                # Test utilities
│   │
│   ├── infrastructure/             # Integration & tooling
│   │   ├── cli/                    # Command-line tool
│   │   │   ├── src/
│   │   │   │   ├── utils/
│   │   │   │   │   └── traceService.ts
│   │   │   │   ├── commands/
│   │   │   │   └── index.ts
│   │   │   └── ...
│   │   └── ...
│   │
│   ├── presentation/               # Framework integrations
│   │   ├── next/                   # Next.js plugin
│   │   │   └── withTailwindStyled
│   │   ├── vite/                   # Vite plugin
│   │   ├── rspack/                 # Rspack plugin
│   │   ├── vue/                    # Vue integration
│   │   ├── svelte/                 # Svelte integration
│   │   └── ...
│   │
│   ├── archive/                    # Deprecated packages (kept for reference)
│   └── shared/                     # (if separate from domain/shared)
│
├── scripts/                        # Build & validation scripts
│   ├── benchmark-engine.ts
│   ├── benchmark/
│   ├── generate-json-schemas.ts
│   ├── check-umbrella-exports.ts
│   ├── validate/
│   │   ├── final-report.ts
│   │   ├── health-summary.ts
│   │   ├── dependency-matrix-check.ts
│   │   └── rust-ts-drift.mjs
│   ├── graph/
│   │   └── monorepo-file-deps.ts
│   ├── check-*.ts
│   └── ...
│
├── tests/                          # Root-level test suites
│   ├── smoke/                      # Smoke tests
│   │   ├── umbrella-thin.test.mjs
│   │   ├── adapters.test.mjs
│   │   ├── root-imports.test.mjs
│   │   ├── pipeline.test.mjs
│   │   └── ...
│   └── ...
│
├── examples/                       # Example applications
│   └── next-js-app/                # Next.js 16 with Turbopack
│       ├── app/
│       ├── public/
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── package.json
│       └── ...
│
├── benchmarks/                     # Performance measurement
│   ├── hotpath.bench.mjs
│   ├── native-parser-bench.ts
│   └── run.js
│
├── .blackbox/                      # Project context (assistant memory)
├── .claude/                        # Claude settings
├── .vscode/                        # VS Code workspace settings
├── .turbo/                         # Turbo cache
├── node_modules/
├── dist/                           # Build output (generated)
├── package.json                    # Root workspace definition
├── package-lock.json
├── tsconfig.base.json              # Root TypeScript config
├── tsconfig.json
├── tsconfig.dts.json               # Type definition config
├── tsup.config.ts                  # Root bundler config
├── tsup.dts.config.ts
├── turbo.json                      # Turbo orchestration
├── biome.json                      # Linter config (via config/)
├── dependency-cruiser.cjs          # Dependency checking
├── README.md                       # Main documentation
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

## Key Directories Explained

### `/native` - Rust Engine

The performance-critical core:
- **Domain**: Business logic (variants, CSS, theme resolution)
- **Application**: High-level operations (parsers, generators)
- **Infrastructure**: NAPI bridges, caching backends, I/O
- **Tests**: Comprehensive integration + property-based testing
- **Benches**: Performance profiling

See `native/ARCHITECTURE_MODULAR_GUIDE.md` for detailed breakdown of 11 NAPI bridge modules.

### `/packages/domain` - Core Packages

Business logic as separate, testable npm packages:
- **core**: Main API (`tw`, `cx`, `cv`, `cn`)
- **compiler**: Tailwind CSS v4 + LightningCSS pipeline
- **scanner**: File scanning + AST-based class extraction
- **engine**: Orchestration layer
- **theme**: Theme resolution
- **shared**: Common utilities + generated schemas
- **Others**: Specialized features (animate, preset, plugin, etc.)

Each package is independently buildable with `tsup`.

### `/packages/infrastructure` - Integration

- **cli**: Command-line tool (`tw setup`, `tw audit`, etc.)
- Bundler-specific integrations

### `/packages/presentation` - Framework Plugins

Framework-specific plugins and adapters:
- **next**: Next.js integration via `withTailwindStyled`
- **vite**: Vite plugin
- **rspack**: Rspack plugin
- **vue/svelte**: Framework wrappers

### `/config` - Centralized Configuration

All configuration files moved here in Phase 7+:
- TypeScript configs
- Biome linting rules
- Turbo task orchestration
- Build profiles

### `/docs` - Documentation

- **README.md**: Main product docs
- **archive/**: Phase summaries, reference guides, session notes
- **api/**: API documentation

### `/scripts` - Build & Validation

Build-time scripts for:
- Benchmarking
- Schema generation
- Umbrella export validation
- Dependency analysis
- Rust-TS drift checking

### `/tests` - Root Smoke Tests

Quick integration tests across the entire monorepo:
- Import path validation
- Bundler adapter checks
- Pipeline verification

## Dependency Graph

### Package Dependencies

```
examples/next-js-app
  ↓
presentation/next (withTailwindStyled)
  ↓ depends on ↓
domain/core (tw, cx, cv, cn)
domain/compiler (CSS generation)
domain/scanner (File scanning)
  ↓ all depend on ↓
domain/shared (Types, utilities)
domain/theme (Theme resolution)
  ↓ all delegate to ↓
native (Rust NAPI bindings)
```

### Boundary Enforcement

- **dependency-cruiser** validates no circular dependencies
- **Type boundaries**: TypeScript strict mode prevents cross-package type pollution
- **Exports**: Carefully controlled via `exports` field in package.json

## Build Output Structure

After `npm run build`:

```
dist/
├── index.js                 # CommonJS main
├── index.mjs                # ES module main
├── index.d.ts               # Type definitions
├── compiler.js
├── compiler.mjs
├── compiler.d.ts
├── scanner.js
├── scanner.mjs
├── ... (30+ named exports)
├── package.json             # Distribution metadata
├── native/
│   ├── index.node           # Platform-specific binary
│   ├── index.d.ts
│   └── ...
└── README.md
```

## Configuration Inheritance

```
tsconfig.base.json (root, shared)
  ↓ extended by ↓
packages/*/tsconfig.json (per-package)
  ↓ used by ↓
packages/*/src/
```

## Testing Hierarchy

```
Unit Tests
  ├── native/src/**/*.rs (#[cfg(test)])
  └── packages/**/src/**/*.test.mjs

Integration Tests
  ├── native/tests/*.rs (cross-module)
  ├── packages/**/tests/*.test.mjs
  └── tests/smoke/*.test.mjs (cross-package)

Property Tests
  └── native/tests/property_*.rs (correctness properties)

Benchmarks
  ├── native/benches/*.rs
  └── benchmarks/*.mjs
```

## Phase 7 Architecture Updates

Recent restructuring in Phase 7:

1. **Config Centralization**: All configs moved to `config/` directory
2. **NAPI Modularization**: 11 focused modules instead of monolithic bridge
3. **Property Testing**: R4 added 6 core properties across 53 test cases
4. **Multi-Tier Caching**: Theme resolver pool with adaptive strategies
5. **Variant System**: Precedence calculation, compound variant support

See `.kiro/specs/phase-7-architecture/` for detailed specs.

## Typical File Organization Patterns

### TypeScript Package Structure

```
packages/domain/example/
├── src/
│   ├── __tests__/           # Test files
│   │   └── example.test.mjs
│   ├── types.ts             # Type definitions
│   ├── utils.ts
│   ├── index.ts             # Main export
│   └── ...
├── tests/                   # Alternative test location
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

### Rust Module Organization

```
native/src/
├── domain/               # Models & core logic
│   └── mod.rs           # Module re-exports
├── application/         # Use cases & orchestration
├── infrastructure/      # External integrations
├── utils/              # Utilities
├── lib.rs              # Crate root
└── tests.rs            # Unit tests
```

## Naming Conventions

- **Packages**: kebab-case (`domain/scanner`, `presentation/next`)
- **Rust modules**: snake_case (`napi_bridge_cache.rs`)
- **TypeScript files**: camelCase (`tailwindEngine.ts`)
- **Components**: PascalCase (`OptimizationManager.ts`)
- **Directories**: lowercase (`domain`, `src`, `tests`)

## Asset Organization

- **Generated schemas**: `packages/domain/shared/src/generated/`
- **Cache files**: `.turbo/cache/` (build artifacts), `node_modules/.cache/`
- **Documentation**: `docs/archive/` (summaries), `native/ARCHITECTURE_*.md`
- **Examples**: `examples/next-js-app/`

This structure balances monorepo clarity with per-package independence, enabling rapid development while maintaining strong boundaries.
