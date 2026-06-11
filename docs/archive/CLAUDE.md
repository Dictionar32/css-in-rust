# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`tailwind-styled-v4` (npm name; repo `css-in-rust`) is a build-time, zero-runtime styling library for React that combines a styled-components-style DX (`tw.button\`...\``, `tw.div({ variants })`) with Tailwind CSS v4. The hot paths (class parsing, variant resolution, theme extraction, file scanning, caching) run in a **Rust engine via NAPI-RS**; TypeScript orchestrates and provides the public API and bundler adapters (Next.js / Vite / Rspack / Vue / Svelte).

## Commands

```bash
# Full build: Rust binary → workspace packages (turbo) → umbrella bundle (tsup) → example build
npm run build
npm run build:fast      # skip Rust + example: just turbo packages + tsup
npm run build:rust      # only the native crate: cd native && napi build --release

npm run lint            # biome check --write (whole repo)
npm run lint:fix        # biome on packages/ only
npm run typecheck       # tsc --noEmit -p tsconfig.dev.json
npm run check           # turbo check + types + boundaries + umbrella + file-deps

# Tests — NOTE: `npm run test` only typechecks the example app, it does NOT run the suite.
npm run test:smoke                              # node --test tests/smoke/*.test.mjs
npm run test:all                                # all package + smoke tests
node --test tests/smoke/pipeline.test.mjs       # run a single test file
npm run test:smoke:fallback                     # run with native disabled (TWS_NO_NATIVE=1 TWS_NO_RUST=1)

npm run check:boundaries   # dependency-cruiser — enforces the layer DAG (see Architecture)
npm run bench              # benchmarks/hotpath.bench.mjs
```

The CLI ships as the `tw` bin (`dist/tw.js`): `npx tw setup` (detect bundler, patch config, pre-warm cache), `npx tw preflight`, `npx tw audit`, `npx tw benchmark`.

**Requirements:** Node 20+, Rust 1.75+ (only needed to build the native crate from source). `tsx` runs the TS tooling scripts; `biome` is the linter/formatter; `turbo` drives per-package builds; `tsup` produces the published bundle.

## Architecture

### Monorepo: DDD layering + umbrella publish

npm workspaces under `packages/`, organized into DDD layers (this layering is the load-bearing structure):

- `packages/domain/*` — pure logic: `core` (the `tw`/`cx`/`cv`/`cn` API + `createComponent`), `compiler` (Tailwind JS + LightningCSS pipeline), `scanner` (Rust-backed file scan), `engine` (orchestrator), plus `analyzer`, `theme`, `preset`, `syntax`, `shared`, `runtime`, etc. Internal names are `@tailwind-styled/*`.
- `packages/infrastructure/*` — `cli`, `devtools`, `dashboard`, `storybook-addon`, `studio-desktop`, `vscode`.
- `packages/presentation/*` — bundler adapters: `next`, `vite`, `rspack`, `vue`, `svelte`.

The **published package is a single bundle**, not the workspace packages. Each public subpath export (`.`, `./compiler`, `./next`, `./vite`, …) maps to a thin re-export file in `src/umbrella/*.ts`. `tsup.config.ts` bundles these umbrella entries into `dist/` with `noExternal: [/^@tailwind-styled\//]`, so all workspace packages are inlined. When adding or changing a public entry point you must touch **both** the `exports` map in `package.json` **and** `src/umbrella/` + the `entries` map in `tsup.config.ts`; `npm run check:umbrella` validates they stay in sync.

A separate **browser bundle** (`index.browser.ts`, `platform: browser`) uses an esbuild `onResolve` plugin to alias `./native` → `native.browser.ts` and `@tailwind-styled/shared` → `src/stubs/shared.browser.ts`, stripping all Node built-ins so Client Components don't pull in `fs`/`crypto`/`module`.

### Layer boundary rules (enforced)

`config/dependency-cruiser.cjs` enforces a strict pipeline DAG — violating it fails `npm run check`:

- Pipeline direction: `syntax` (lowest) → `scanner` → `analyzer`/`compiler` → `engine` (orchestrator, highest). Lower layers must never import higher ones (e.g. `scanner` and `compiler` must not import `engine`; `syntax`/`shared` must not import any pipeline package).
- `compiler` may depend on `plugin-api` (the contract) but not on the `plugin` implementation package.
- Bundler **adapters** (`next`/`vite`/`rspack`/`vue`/`svelte`) may only import other packages through their public `@tailwind-styled/*` entry — never internal `src/` files.

### Native Rust engine (`native/`)

A NAPI-RS crate (`@tailwind-styled/native`), itself DDD-layered: `src/{domain,application,infrastructure,interface,shared}` (mirrors the TS layering; `lib.rs` is the entry, `pub use`-ing functions from each layer). Built with `napi build --release` into a `.node` binary. The TS type definitions are **auto-generated** to `packages/domain/shared/src/generated/native.d.ts` — do not hand-edit; regenerate by rebuilding the crate.

`@tailwind-styled/core/src/native.ts` is the binding loader: it resolves the `.node` file via `resolveNativeBinary` from `@tailwind-styled/shared` and wraps every Rust function. The native binding is **required** at runtime for the Node build — these functions throw if it's missing (`npm run build:rust` to produce it). `TWS_NO_NATIVE=1 TWS_NO_RUST=1` force JS-only paths for fallback testing.

### What runs in Rust vs JS

The Rust migration is intentional and partial — do not assume all logic lives in Rust.

- **In Rust (hot path):** class parsing/splitting (`batchSplitClasses`), variant resolution (`resolveVariants`), class merging (`twMerge`/`resolveClassNames`), content hashing (`hashContent`), state/container CSS generation, template + sub-component parsing, theme extraction (`extractThemeFromCssClassified`), file scanning, and caching. The `@tailwind-styled/core/src/*.ts` files mostly delegate to `native.ts`.
- **Stays in JS by design** (do not try to port these):
  - **Actual Tailwind CSS compilation** — `packages/domain/compiler/src/tailwindEngine.ts` calls the `tailwindcss` v4 npm package to generate raw CSS, then LightningCSS post-processes (production). This is what "Tailwind JS + LightningCSS pipeline" means; Rust does not compile Tailwind itself.
  - **Browser DOM work** — runtime `<style>` injection and `document.styleSheets` traversal in `stateEngine.ts` / `containerQuery.ts`.
  - **React component construction** — `createComponent.ts` (sub-component factories, props filtering, `asChild`), plus lightweight glue in `styled.ts` / `styledSystem.ts` / `compatibility.ts`.
- **Hybrid (Rust-first with a weaker JS fallback):** some functions keep a pure-JS path used when the native binding fails to load — e.g. `cv.ts` (logs `[cv() fallback]`) and `stateEngine.ts` (the fallback join is *additive, with no conflict resolution*, unlike the Rust path). Prefer fixing the native path; treat these fallbacks as degraded.

### Runtime env vars

`TWS_LOG_LEVEL` (`debug|info|warn|error|silent`, default `info`), `TWS_DEBUG_SCANNER` (`1` enables scanner debug logs), `STUDIO_PORT` (default `3030`).

## Notes

- The repo root holds many `PHASE_*.md` / `*_REPORT*.md` / `STATUS*.md` working documents from past sessions — these are historical session notes, not authoritative specs. Trust the code, `README.md`, and this file.
- Specs under `.kiro/specs/rust-css-compiler-engine/` (`requirements.md`, `design.md`, `tasks.md`) describe the intended Rust engine design.
- Much of the inline documentation and commit history is in Indonesian; match the surrounding language when editing comments in a given file.
