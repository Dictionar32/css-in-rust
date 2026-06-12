# Tech Stack & Build System

## Overview

This is a hybrid TypeScript/Rust monorepo using npm workspaces with a Rust native engine (NAPI-RS) compiled to Node.js N-API bindings.

## Languages & Runtimes

- **TypeScript**: Primary language for 17+ npm packages
- **Rust**: Native engine for performance-critical parsing and CSS generation
- **JavaScript**: Some scripts and utilities (Node.js 20+)
- **CSS**: Input format processed through Tailwind CSS v4

## Build Tools

### Root Level Build

```bash
npm run build              # Full build: Rust + packages + bundle
npm run build:rust        # Compile Rust to .node binary
npm run build:packages    # Build all packages via turbo
npm run build:fast        # Skip example build
npm run build:release     # Production optimized build
npm run build:dev         # Watch mode with sourcemaps
```

### Workspace Package Builds

Each package uses **tsup** (TypeScript bundler):
- Configuration: Individual `tsup.config.ts` per package
- Outputs: ESM (`.mjs`), CommonJS (`.js`), TypeScript declarations (`.d.ts`)
- Shared root: `tsup.config.ts` and `tsup.dts.config.ts`

### Rust Build

- **Build Tool**: napi-build (NAPI-RS CLI)
- **Profile**: Release with LTO, size optimization (`opt-level = "z"`)
- **Output**: Platform-specific `.node` binary (darwin-arm64, darwin-x64, linux-x64-gnu, linux-arm64-gnu, win32-x64-msvc)
- **Cargo.toml**: `native/Cargo.toml` with feature flags and dependencies

## Key Dependencies

### Core Frameworks & Libraries

- **@napi-rs/cli**: Native addon binding generator
- **napi**: NAPI bindings
- **turbo**: Monorepo task orchestration
- **TypeScript**: v6.0.2
- **React**: Peer dependency (>=18)

### Build & Bundling

- **tsup**: Fast TypeScript bundler
- **vite**: Dev bundler
- **@vitejs/plugin-react**: React plugin for Vite
- **lightningcss**: CSS processing (v1.0.0-alpha.60 with default features)
- **oxc-parser/transform**: AST parsing and transformation

### Code Quality

- **@biomejs/biome**: Linter and formatter (replaces ESLint/Prettier)
- **dependency-cruiser**: Dependency boundary checking
- **tsx**: TypeScript executor for scripts
- **typescript**: Type checking

### Testing & Benchmarking

- **node:test**: Native Node.js test runner
- **c8**: Code coverage reporting
- **criterion**: Rust benchmarking
- **proptest**: Rust property-based testing
- **quickcheck**: Rust shrinking-based testing

### Optional & Platform-Specific

- **oxc-minify**: Minification (optional)
- **@tailwind-styled/native-***: Platform-specific NAPI bindings (darwin-arm64, darwin-x64, linux-x64-gnu, linux-arm64-gnu, win32-x64-msvc)

## Test Frameworks

### TypeScript Tests

```bash
npm run test:all           # Run all .test.mjs files
npm run test:smoke         # Quick smoke tests
npm run test:ci            # CI-optimized test run
npm run test:coverage      # Generate coverage reports
npm run test:coverage:check # Verify coverage thresholds (60% lines, 55% branches)
```

- **Test Runner**: Node.js native `--test` flag
- **Coverage**: c8
- **Test Patterns**: `**/*.test.mjs`, `**/__tests__/*.test.mjs`
- **Location**: Distributed across packages

### Rust Tests

```bash
cargo test                 # Run all Rust tests
cargo test --test <name>   # Run specific integration test
cargo bench                # Run benchmarks
```

- **Integration Tests**: `native/tests/*.rs`
- **Property Tests**: proptest + quickcheck
- **Benchmarks**: `native/benches/*.rs`
- **Unit Tests**: `#[cfg(test)]` modules within source files

## Linting & Formatting

```bash
npm run lint               # Check and fix with Biome
npm run lint:fix           # Auto-fix issues
npm run check:types        # TypeScript type checking
npm run check:boundaries   # Dependency boundary validation
```

- **Tool**: Biome (unified linter/formatter)
- **Config**: `config/biome.json` (centralized)
- **Scope**: TypeScript/JavaScript across all packages

## Monorepo Structure

### Workspace Package Setup

```bash
npm run build:packages     # Uses turbo to orchestrate builds
```

- **Orchestrator**: Turbo v2.9.3
- **Config**: `turbo.json` in root
- **Workspaces**: npm workspaces (defined in `package.json`)

```json
"workspaces": [
  "packages/domain/*",
  "packages/infrastructure/*",
  "packages/presentation/*"
]
```

### Verification & Validation

```bash
npm run check              # Full check suite
npm run validate           # Final health report
npm run validate:json      # JSON format validation
npm run health:summary     # Health summary report
npm run pack:check         # Check distribution artifacts
npm run version:sync       # Sync versions across workspace
npm run generate:schemas   # Generate JSON schemas
npm run schemas:check      # Verify schemas match source
```

## Build Output

### Distribution

- **Main Entry**: `dist/index.js` (CommonJS), `dist/index.mjs` (ESM)
- **Types**: `dist/index.d.ts`
- **Sub-exports**: 30+ named exports (compiler, scanner, engine, theme, etc.)
- **Native Binary**: `native/*.node` (included in distribution files)

### Watch Mode Development

```bash
npm run dev                # Watch mode with sourcemaps (tsup)
npm run build:dev          # Alternative watch setup
npm run bench:watch        # Benchmark watch mode
```

- Uses **tsup** `--watch` flag
- Generates sourcemaps for debugging
- No rebuild of Rust (manual `npm run build:rust` if needed)

## Performance Tools

```bash
npm run bench              # Run hot-path benchmarks
npm run bench:full         # Full benchmark suite
npm run bench:native       # Rust native parser benchmark
npm run check:binary-size  # Check bundle size limits
npm run check:binary-size:strict  # Strict size check (max 15MB)
```

## Configuration Files

All centralized in `config/` directory:

- **tsconfig.base.json**: Root TypeScript configuration
- **tsconfig.json**: Shared config reference
- **biome.json**: Linter and formatter rules
- **turbo.json**: Build orchestration
- Other shared configs (babel, etc.)

## Continuous Integration

CI workflows in `.github/workflows/`:

- **ci.yml**: Main CI pipeline
- **benchmark.yml**: Performance benchmarking
- **publish.yml**: Release automation
- **dependencies.yml**: Dependency checks
- **cli-test.yml**: CLI-specific tests

### CI Test Command

```bash
npm run test:ci            # Optimized CI test run
npm run test:smoke:pipeline # Pipeline-specific smoke tests
npm run validate:canary:ci # Canary validation for CI
```

## Fallback & Compatibility

```bash
npm run test:smoke:fallback        # Tests without native module
npm run test:fallback              # All tests without Rust
npm run validate:canary            # Canary without native
TWS_NO_NATIVE=1 npm run test       # Disable native at runtime
TWS_NO_RUST=1 npm run test         # Disable Rust fallback
```

Environment variables disable native module at runtime for compatibility testing.

## Example Application

```bash
npm run example:build              # Build Next.js example
npm run example:dev                # Dev server for example
npm run example:typecheck          # Type check example
cd examples/next-js-app && npm install && npx next dev  # Manual example dev
```

- **Framework**: Next.js 16.2.2 with Turbopack
- **Location**: `examples/next-js-app/`
- **Used For**: Integration testing, demo purposes

## Common Development Workflows

### Initial Setup

```bash
npm install
npm run build:rust        # Compile Rust first
npm run build:packages    # Build all packages
npm run build             # Full bundle
```

### Active Development

```bash
npm run build:dev         # Start watch mode
# In another terminal:
npm run test:smoke        # Quick tests
npm run lint              # Check code quality
```

### Before Commit

```bash
npm run check             # Full validation
npm run lint              # Format and lint
npm run test:all          # Complete test suite
npm run schemas:check     # Verify generated schemas
```

### Release Process

```bash
npm run version:sync      # Synchronize versions
npm run generate:schemas  # Update schemas
npm run pack:check        # Verify artifacts
npm run build:release     # Production build
npm run validate          # Final validation
```

## Debugging & Analysis

- **Binary Size**: `npm run check:binary-size:strict`
- **Dependency Graph**: `npm run graph:file-deps`
- **Schema Drift**: `npm run wave4:schema-drift`
- **Rust-TS Drift**: `npm run validate:drift`
- **Memory Stats**: Rust engine tracks via atomic counters

## Rust-Specific Configuration

### Cargo.toml Profiles

```toml
[profile.release]
opt-level = "z"           # Size optimization
lto = true                # Link-time optimization
strip = true              # Strip debug symbols
codegen-units = 1         # Single codegen unit (slower compile, smaller binary)
panic = "abort"           # Abort on panic (smaller binary)

[profile.dev]
opt-level = 1             # Speed for faster iteration

[profile.test]
opt-level = 1             # Faster test builds
```

### NAPI Bridge Modules

Rust functions are organized into 11 modularized NAPI bridge modules:
- `napi_bridge_types.rs` - Type definitions
- `napi_bridge_marshalling.rs` - JSON I/O
- `napi_bridge_errors.rs` - Error handling
- `napi_bridge_css.rs` - CSS generation (7 functions)
- `napi_bridge_parsing.rs` - Class parsing (6 functions)
- `napi_bridge_theme.rs` - Theme resolution (7 functions)
- `napi_bridge_cache.rs` - Cache management (6 functions)
- `napi_bridge_redis.rs` - Redis operations (17 functions)
- `napi_bridge_analysis.rs` - Performance metrics (5 functions)
- `napi_bridge_watch.rs` - File watching (9 functions)
- `napi_bridge.rs` - Facade (re-exports all)

See `native/ARCHITECTURE_MODULAR_GUIDE.md` for detailed module breakdown.

## Version Management

- **Node**: >=20
- **npm**: 11.11.1 (pinned in package.json)
- **Rust**: >=1.75
- **TypeScript**: 6.0.2
- **React**: >=18 (peer, optional)

All critical dependencies use exact versions (no caret/tilde for production libraries).
