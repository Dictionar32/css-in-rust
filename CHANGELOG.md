# Changelog

Semua perubahan signifikan pada project ini didokumentasikan di file ini.

---

## [5.0.6-canary] — 2026-04-24

> Rilis canary terkini. Versi ini mencerminkan state aktual dari source code.

### 📦 Packages (26 total)

| Domain | Package |
|---|---|
| Core | `@tailwind-styled/core`, `@tailwind-styled/runtime`, `@tailwind-styled/shared` |
| Compiler | `@tailwind-styled/compiler`, `@tailwind-styled/syntax`, `@tailwind-styled/atomic` |
| Build | `@tailwind-styled/engine`, `@tailwind-styled/scanner`, `@tailwind-styled/analyzer` |
| Adapters | `@tailwind-styled/next`, `@tailwind-styled/vite`, `@tailwind-styled/rspack` |
| Styling | `@tailwind-styled/animate`, `@tailwind-styled/theme`, `@tailwind-styled/preset`, `@tailwind-styled/runtime-css` |
| Plugins | `@tailwind-styled/plugin`, `@tailwind-styled/plugin-api`, `@tailwind-styled/plugin-registry` |
| Infra | `@tailwind-styled/dashboard`, `@tailwind-styled/devtools`, `@tailwind-styled/studio-desktop` |
| Framework | `@tailwind-styled/vue`, `@tailwind-styled/svelte` |
| DX | `@tailwind-styled/testing`, `@tailwind-styled/storybook-addon` |

### 🦀 Rust Native Engine

- **92 NAPI functions** tersedia via `napi-rs` — scan, cache, parse, normalize, diff, analyze, minify, lint
- **137 Rust `pub fn`** di `native/src/` — termasuk internal helpers
- **LightningCSS** sebagai post-processor: minify, vendor prefix, dead-code strip
- Pipeline: `Tailwind JS compile()` → `Rust processTailwindCssLightning()` → final CSS
- Persistent DashMap cache — cold start scan `<10ms`, incremental `~0ms`
- `callOptional` pattern — native-first, JS fallback jika binary tidak tersedia

### 🧪 Testing

- **52 test files**, **675+ test cases** total
- Coverage: core, compiler, engine, scanner, analyzer, adapter Next/Vite/Rspack, Vue, Svelte, testing utils, storybook-addon, theme, animate, plugin-registry, CLI, devtools, dashboard
- `packages/domain/testing/` — custom matchers: `expectClasses()`, `expectEngineMetrics()`, `toHaveEngineMetrics()`, `expandVariantMatrix()`
- Test pipeline: Vitest + `.mjs` integration tests

### ✅ Resolved (vs styled-components)

| Kekurangan styled-components | Status |
|---|---|
| Runtime overhead ~15KB | ✅ ~4.5KB runtime, CSS di-extract build time |
| SSR complexity (`ServerStyleSheet`) | ✅ Tidak diperlukan — RSC entries dikecualikan dari loader otomatis |
| Class name tidak deterministik | ✅ Pakai Tailwind class asli langsung, zero hash |
| RSC tidak support | ✅ `tw.server.*` namespace + auto RSC boundary detection di loader |
| TypeScript verbose (`$prop`) | ✅ Variants API di config object, generics otomatis |
| Tidak tree-shakeable | ✅ DSE (Dead Style Eliminator) terintegrasi di pipeline |

### ⚠️ Catatan

- `stateEngine.ts` menggunakan runtime `<style>` injection di dev mode / fallback — tidak aktif di production build
- `TW_MAP` di `stateEngine.ts` hanya dipakai saat compiler tidak tersedia (`TWS_NO_NATIVE=1`) — tidak relevan di production
- E2E tests belum ada — 52 test files semuanya unit/integration level
- HMR belum ada di adapter Next.js (sudah ada di Vite)

---

## [4.5.0-alpha.1] — 2026-04-18

### 🚀 Performance (Rust Native)

- **10x** variant resolution via `resolve_variants` di Rust
- **23x** class deduplication via `normalizeAndDedupClasses` di Rust
- **30x** class parsing via `parseClasses` di Rust

### 🛡️ Reliability

- Health check monitoring untuk native bridge
- Auto-fallback dengan exponential backoff
- Telemetry: Prometheus / JSON / Console exporters
- Error message jelas jika native binary tidak ditemukan

### 🧪 Testing & Quality

- Integration tests untuk semua core functions
- Unit tests untuk health check & telemetry
- Benchmark suite untuk performance regression

### ⚠️ Breaking

- JS fallbacks dihapus — native binary sekarang required
- Jalankan `npx tw setup` setelah install

### 📊 Benchmark

| Operasi | v4.4 (JS) | v4.5 (Rust) | Peningkatan |
|---|---|---|---|
| Variant resolution | 0.52ms | 0.048ms | **10.8×** |
| Class deduplication | 2.1ms | 0.09ms | **23.3×** |
| Class parsing | 3.0ms | 0.10ms | **30×** |

---

## [4.5.0] — Sprint 6–10 Platform Overhaul — 2026-03-21

### Sprint 6 — Error Handling & Logging

- `cache_read` dan `scan_workspace` sekarang return `napi::Result` — error dipropagasi ke JS dengan pesan deskriptif
- Scanner logging terpusat via `createLogger("scanner")` dari `@tailwind-styled/shared`
- Cache HIT/MISS/write-fail dikontrol via `TWS_LOG_LEVEL`
- Plugin `onError` hook dipanggil sebelum error propagasi — plugin tidak bisa crash engine
- `watch()` emit `{ type: "error" }` saat watcher atau transform gagal
- `TWS_LOG_LEVEL=debug|info|warn|error|silent` + `TWS_DEBUG_SCANNER=1`

### Sprint 7 — Platform Adapters

- Next.js, Vite, Rspack: compiler di-bundle inline — tidak perlu install `@tailwind-styled/compiler` terpisah
- `preserveImports: true` di semua loaders — `cv`, `cx`, `cn` dijamin tidak distrip
- Rspack `tsup.config.ts` dibuat dari scratch
- RSC Auto-inject: `detectRSCBoundary()` dan `autoInjectClientBoundary()` sebagai public API
- `webpackLoader.ts` dan `turbopackLoader.ts` auto-inject `"use client"` berdasarkan `analyzeFile()`

### Sprint 8 — Developer Tooling

- CLI: `tw analyze --json` dan `tw stats --json` output clean parseable (suppress `console.log`)
- DevTools: hapus "Run Rust Workspace Scan" — ganti panel **Engine Metrics** dari `localhost:3000/metrics`
- VSCode: `startLspServer` cek `dist/lsp.mjs` bundled dulu, `postbuild.cjs` otomatis copy
- Tambah keybindings (`Ctrl+Shift+T/N/S`), `configuration` settings, `menus` context

### Sprint 9 — Studio Desktop (Electron)

- Engine IPC handlers: `engine-scan`, `engine-build`, `engine-watch-start`, `engine-watch-stop`, `engine-reset`
- `createEngine` lazy-load per project, reset otomatis saat `change-project`
- Engine events di-forward ke renderer via `mainWindow.webContents.send("engine-event")`
- `contextBridge` ekspos: `engineScan`, `engineBuild`, `engineWatchStart`, `engineWatchStop`, `onEngineEvent`
- Studio Desktop: `loading-error.html` fallback dengan auto-retry
- Auto-updater via `electron-updater` — check 10 detik setelah startup, manual via Tools menu
- Tray icon: toggle window, double-click focus, context menu (Open, Browser, Quit)

### Sprint 10 — Testing & Documentation

- `EngineMetricsSnapshot` interface + `expectEngineMetrics()` + `toHaveEngineMetrics()` + `tailwindMatchersWithMetrics`
- `sprint9-platform.test.mjs` — 23 tests: adapter configs, preserveImports, studio IPC
- `sprint10-integration.test.mjs` — 28 tests: error handling, logging, DevTools safety, VSCode LSP, metrics
- **84/86 tests pass** — 2 failing pre-existing (unrelated `twMerge/cn`)

---

## [4.3.0–4.5.0] — 2026-03-16

### Fitur Baru

- **`tw ai`** — Anthropic API untuk component generation, multi-provider (`anthropic|openai|ollama`), fallback ke static templates
- **`tw studio`** — Web-based component studio: scan project, search, AI generator endpoint
- **`tw cluster`** — `worker_threads` pool: distribusi scan ke CPU cores
- **`tw registry`** — Local/team HTTP registry, npm-compatible packument protocol, tarball publish/install
- **`tw sync`** — W3C DTCG design token sync: pull/push HTTP/HTTPS, S3 protocol, Figma multi-mode
- **`tw preflight`** — 8 checks: Node version, bundler, Tailwind config, deprecated patterns, TypeScript, auto-fix
- **`tw audit`** — Deprecated class scanner, a11y checks, npm audit security, `--scope` dan `--json`
- **`@tailwind-styled/shared`** — Package baru: `LRUCache` (TTL), `createLogger`, `hashContent/File`, `debounce/throttle`, `parseVersion`

### tw parse — Multi-format

- `.vue/.svelte/.mdx/.html` — regex-direct strategy, skip Babel (lebih cepat)
- `.js/.jsx/.ts/.tsx` — Oxc-first → Babel → regex
- Native Rust Tier 0: coba `native/index.mjs` (.node binding) sebelum Oxc
- Parse chain: **native → oxc → babel → regex**

### Next.js Route CSS

- `routeCssMiddleware.ts` — `getRouteCssLinks()`, `injectRouteCssIntoHtml()`
- `withTailwindStyled` write `css-manifest.json` ke `.next/static/css/tw/`
- Dynamic route CSS: `[id]`, `[...slug]` dengan cache per params kombinasi

### Tests

- `v43-v45.test.mjs` — 28 tests: shared package, audit, AI provider, preflight
- `sprint7.test.mjs` — 30 tests, semua pass

---

## [4.2.0] — Sprint 1 & 2 — 2026-03-15

### Packages Baru

- **`@tailwind-styled/vue`** — Vue 3: `tw()`, `cv()`, `extend()`, `TailwindStyledPlugin`
- **`@tailwind-styled/svelte`** — Svelte 4/5: `cv()`, `tw()`, `use:styled`, `createVariants()` (Svelte 5 runes)
- **`@tailwind-styled/testing`** — `expectClasses()`, `expandVariantMatrix()`, `testAllVariants()`, Jest/Vitest matchers
- **`@tailwind-styled/storybook-addon`** — `generateArgTypes()`, `withTailwindStyled()` decorator
- **`@tailwind-styled/dashboard`** — Live metrics server, file-watch IPC, HTML UI dengan build history chart
- **`@tailwind-styled/plugin-registry`** — `tw-plugin search/install/list` CLI, 4 official + 2 community plugins

### Fitur Compiler

- `tw parse <file>` — 3-tier AST: `oxc-parser` → `@babel/parser` → regex. Extract dari JSX, template literal, `twMerge()`, `cn()`, `clsx()`
- `tw shake <css>` — Real tree shaking berbasis CSS selector analysis, support `@layer`, `@media`
- `tw optimize <file>` — Constant folding, class deduplication, `twMerge` literal pre-computation
- LSP server (`tw lsp`) — hover, completion (Tailwind autocomplete), diagnostics via `vscode-languageserver`
- `tw cluster build` — `worker_threads` pool, throughput report (files/sec)

### Tests

- 6 test suites baru, 78 unit tests + 9 integration tests
- `scripts/benchmark/sprint2-bench.mjs` — parse/shake/cluster metrics ke `docs/benchmark/sprint2-results.json`

---

## [4.5.0] — Implementation Session — 2026-04

### Bug Fixes

- VSCode Extension: `extension.ts` pakai `completionProvider.ts` dan `hoverProvider.ts` yang benar (sebelumnya inline hardcoded)
- CLI scan: flag `--save` menulis `.tailwind-styled/scan-cache.json` format lengkap untuk VSCode EngineService
- `TWS_DISABLE_NATIVE` env var dikenali di `nativeBridge.ts` dan `nativeBinding.ts`
- `TwError` upgrade: `fromZod()`, `source`, `originalCause`, `toJSON()`, `toCliMessage()`
- `ReverseLookup`: `clearCache()`, `pruneCache()`, `MAX_CACHE_BYTES` untuk mencegah memory leak
- `cssToIr`: `createIdGenerator()` factory — eliminasi race condition
- DSE: `runDeadStyleElimination()` sekarang memanggil `eliminateDeadCss` + `optimizeCss`
- `CvFn/TwComponentFactory`: eliminasi `any`, proper generics dengan `InferVariantProps<C>`
- `extend()`: overload baru support `extend({ classes, variants })` dalam satu call
- `astTransform`: `mode` option dihapus dari destructuring

### Added

- Zod schemas untuk semua native binding responses (`native-schemas.ts`)
- Engine facade: `scanWorkspace()`, `analyzeWorkspace()`, `generateSafelist()`, `build()`
- `CONTRIBUTING.md`: section "Berkontribusi tanpa Rust"
- `docs/api/engine.md`, `analyzer.md`, `cli.md`
- `.github/workflows/plugin-registry-test.yml` matrix CI
- `tsconfig.build.json` + `tsconfig.dev.json` — separation of concerns

### Tests Ditambah

- **39 test files baru**, **318 test cases** baru
- Coverage: semua domain packages, semua adapters, Vue, Svelte, CLI, infrastructure

---

## [2.0.0] — Major Upgrade (Compiler-Driven)

### Breaking Changes

- Hapus dependency `styled-components`
- Hapus `styledFactory`, `shouldForwardProp`, `blockProp`, `allowProp`
- Hapus `propEngine`, `responsiveEngine` — dipindahkan ke compiler
- Hapus `ThemeContext`

### Features

- **Zero-runtime output** — `tw.div\`...\`` dikompilasi ke pure `React.forwardRef`
- **Compiler-driven variants** — dikompilasi ke static lookup table
- **RSC-aware** — auto detect server vs client components
- **`withTailwindStyled()`** — Next.js plugin dengan Turbopack + Webpack support
- **`tailwindStyledPlugin()`** — Vite 5+ support

---

## Roadmap

### v5 (target: ~8 minggu)

Berdasarkan `compiler-v5-upgrade-plan.md`:

- [ ] Hapus semua JS fallback — Rust native only wajib
- [ ] Pangkas 120+ exports compiler → ~20 public API
- [ ] Hapus `mode` option — zero-runtime only
- [ ] Hapus Tailwind v3 support — v4 only
- [ ] Integrasikan DSE ke pipeline utama (sekarang masih standalone)
- [ ] Pisahkan atomic CSS ke `@tailwind-styled/atomic` (sudah ada packagenya)
- [ ] E2E + integration tests

### v6 (setelah v5 stabil)

- [ ] Docs website
- [ ] HMR di adapter Next.js (sudah ada di Vite)
- [ ] macOS & Windows binary publish ke npm (CI matrix sudah ready)
- [ ] Plugin starter/codegen
- [ ] devtools traces lintas tooling