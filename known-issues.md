# Known Issues Log — css-in-rust / tailwind-styled-v4

Append-only log of diagnosed issues in this repo, newest first. Format per entry:
**Symptom → Where → Root cause → Fix → Status**

---

## 2026-06-27 — Removed `getAllRoutes()` — claimed a native-binding dependency, then ignored its result

- **Symptom:** none observed — found while reviewing `compiler/index.ts` for the per-route
  splitting work below, not via a bug report.
- **Where:** `packages/domain/compiler/src/index.ts` (definition), `internal.ts` (re-export).
- **Root cause:** `getAllRoutes()` threw `FATAL` if the native `analyzeClasses` binding was
  missing, then — even when the binding *was* present — completely ignored whatever it returned
  and gave back a hardcoded `["/", "__global"]` regardless. So it never did real route discovery
  in either branch; it just looked like it depended on something real. Confirmed zero call sites
  anywhere in the repo (internal or in `examples/`).
- **Fix:** Removed the function and its two re-export lines in `internal.ts` (import + export
  list). `fileToRoute()` (genuinely used, by the per-route splitting work below) is untouched. No
  other code touches `getAllRoutes`, so this has no behavioral effect on anything that currently
  runs — it only removes a misleading, unused public export.
- **Status:** Fixed (removed). If real route enumeration is ever needed from outside
  `withTailwindStyled.ts`'s build-time pipeline, `routeGraph.ts`'s `buildRouteClassBuckets()` (see
  entry below) is the actual working mechanism to build on, not this.

## 2026-06-27 — Real per-route CSS splitting implemented (supersedes "`__global`-only" from the entry below)

- **Context:** The entry below ("`css-manifest.json` had no producer") shipped a `__global`-only
  fix and explicitly deferred true per-route splitting as future work requiring import-graph
  tracing. That follow-up was done in the same day — see below. The `__global`-only behavior no
  longer reflects what's in the repo; kept for history.
- **What was built:** `packages/domain/compiler/src/routeGraph.ts` — `buildRouteClassBuckets(root,
  srcDir, files)`. Pure TS, no native binding changes needed: `scanWorkspace()` already returns
  per-file classes (`ScannedFile { file, classes, hash }`), the only missing piece was the
  file-to-file import graph, which this module builds via a regex-based static import extractor
  (`import ... from "..."`, side-effect `import "..."`, dynamic `import("...")` with literal
  string paths) + tsconfig `paths`/`baseUrl` alias resolution. Entry points = files matching
  `app/.../page.{tsx,ts,jsx,js}`; BFS from each entry over the import graph gives the reachable
  file set per route; a file reachable by exactly one route gets its classes attributed
  exclusively to that route, anything reachable by 2+ routes (or 0, or a
  layout/loading/error/template/not-found/default file) falls back to `"__global"`. Wired into
  `withTailwindStyled.ts`'s existing config-eval IIFE (same place as the `__global`-only version),
  writing one CSS file per non-empty bucket + `css-manifest.json` mapping every populated route.
- **Bug found and fixed during validation (would have silently broken every consumer using
  tsconfig path aliases — i.e. most Next.js apps):** the first version of
  `loadTsconfigAliases()` stripped `//` and `/* */` comments from `tsconfig.json` with a naive
  regex before `JSON.parse`. That regex doesn't respect string literal boundaries: the alias
  `"@/*"` itself contains the literal substring `/*`, and `"include": ["**/*.ts", ...]` glob
  entries contain the literal substring `*/`. The naive stripper matched `/*` inside `"@/*"` as a
  comment open and ate everything up to the next `*/` it found — which landed inside one of the
  `**/*.ts` glob strings — corrupting the JSON and throwing on `JSON.parse`. Caught by an empirical
  smoke test against the real `examples/next-js-app` (expected components to attribute to `/`;
  instead everything fell through to `__global` because alias resolution silently failed).
  Replaced with a string-literal-aware tokenizer (`stripJsonComments()`) that tracks in-string
  state (incl. `\"` escapes) and only treats `//`/`/* */` as comments when outside a string.
- **Validated empirically (not just unit-shaped):**
  1. Real `examples/next-js-app`: 14 `src/components/*` files correctly attributed exclusively to
     `/` (root page imports them directly); `/docs` page (self-contained, no shared imports) got
     its own exclusive bucket; `layout.tsx` correctly fell to `__global`; `DevToolsClient.tsx` —
     discovered to be genuinely unused/orphaned (not imported anywhere in `src/`) — correctly fell
     to `__global` via the "unreachable by any route" safe-fallback path, not the shared-segment
     path. Good incidental catch: another small piece of dead code, not logged separately since
     it's harmless and the fallback already handles it correctly.
  2. Synthetic fixture: component imported by exactly one of two routes → attributed correctly to
     that route; component imported by both → correctly fell to `__global`; relative imports
     (`./circularA`) resolved correctly; a deliberate circular import pair (`circularA` ⇄
     `circularB`, both only reachable from `/`) terminated correctly (no infinite loop) and both
     landed in `/`'s bucket.
  3. Synthetic fixture: dynamic segment `app/blog/[slug]/page.tsx` → route `/blog/[slug]`
     (brackets preserved in the route key, slugified separately for the filename); route group
     `app/(marketing)/pricing/page.tsx` → route `/pricing` (group segment correctly stripped from
     the URL, per Next.js convention).
- **Known limitations (by design, documented in `routeGraph.ts`):** nested layouts always fall to
  `__global` rather than being scoped to their actual subtree (conservative — never mis-attributes,
  just over-shares to global for that case); a dynamic `import(someVariable)` with a non-literal
  path can't be statically resolved, so the imported file becomes unreachable and falls to
  `__global` (same safe-but-under-split behavior). Filename collisions between a slugified dynamic
  route and a literal one with the same slug (e.g. `/blog/[slug]` vs `/blog/slug`) are disambiguated
  with a numeric suffix at write time in `withTailwindStyled.ts` — `routeToCssFilename()` itself is
  not collision-proof on its own.
- **Status:** Fixed and validated against both a real example app and synthetic edge-case
  fixtures. `getAllRegisteredClasses()`/`getRouteClasses()`/`fileToRoute()` in
  `packages/domain/compiler/src/index.ts` remain unused by this pipeline (kept for other
  consumers, e.g. the `tw split` CLI) — doc comments there and in `upstream-modules.d.ts` updated
  to stop describing per-route splitting as nonexistent.

## 2026-06-27 — Next.js 16 default Turbopack build means `withTailwindStyled()`'s `webpack(config, options)` callback never runs at all

- **Symptom:** Nothing wired through the `webpack()` callback in `withTailwindStyled.ts` (dev-mode
  guard, `applyWebpackRule`, `StaticCssWebpackPlugin` registration, the `externals` patch, and any
  `compiler.hooks.done`-based plugin) ever executes — no error, no warning, build just succeeds
  without ever invoking that code path.
- **Where:** `packages/presentation/next/src/withTailwindStyled.ts`, the returned `webpack(config,
  webpackOptions)` function.
- **Root cause:** Confirmed empirically (minimal Next.js 16.2.4 probe app, App Router, custom
  webpack plugin tapping `compiler.hooks.done`) and against a known community report
  (vercel/next.js discussion #14330): Next.js 16 stable defaults **both** `next dev` and `next
  build` to Turbopack, not just dev as in 15.x. `process.env.TURBOPACK` is `"auto"` whenever
  Turbopack is active (default, or explicit `--turbopack`) and is unset only when `--webpack` is
  passed explicitly. When Turbopack is active, Next.js does **not call the `webpack()` config
  function at all** — confirmed by adding a top-level `console.log`/throw at the very start of the
  function body, which never fired. This is more fundamental than "the done-hook doesn't fire" —
  the entire function body is dead code under default settings, for both dev and prod.
  - Correction to an earlier theory: `withTailwindStyled()` already sets a non-empty `turbopack:
    {rules: ...}` key unconditionally in its returned config, so the separate Next.js "build is
    using Turbopack with a webpack config and no turbopack config" hard-error does **not** apply
    to this codebase's actual exported config (it only reproduces in an isolated probe that omits
    the `turbopack` key entirely).
  - Also confirmed: `_tw-state-static.css` (supposedly produced by `StaticCssWebpackPlugin` at
    `compiler.hooks.done`) is **not** actually orphaned under default Turbopack —
    `appendStaticStateCssToSafelist()` (`packages/domain/shared/src/staticStateExtractor.ts`)
    writes a real initial version directly from the fire-and-forget async IIFE in
    `withTailwindStyled.ts`'s outer body, which runs unconditionally at config-eval time
    regardless of bundler.
  - **Correction (same day, caught before acting on it):** initially classified
    `StaticCssWebpackPlugin` as pure vestigial dead weight safe to delete outright. That's wrong —
    it's only *unreachable* under default Turbopack; under explicit `--webpack` it still provides
    something the startup-only IIFE genuinely does not: incremental/HMR-aware updates to
    `_tw-state-static.css` as files change *during* an active dev session (via
    `setFileStaticCss()` called per-file from `webpackLoader.ts`, flushed on every
    `compiler.hooks.done`). The IIFE only runs once, at server startup — editing a component's
    `states` config mid-session and seeing it reflected without restarting `next dev` currently
    only works in `--webpack` mode, and only because of this plugin. Kept in place; added a
    status comment in the file itself instead of removing it.
- **Fix:** Any logic that must run regardless of which bundler ends up active (CSS generation,
  manifest writing, etc.) belongs in the config-eval-time IIFE in the outer body of `wrap()`, not
  in the `webpack()` callback. Applied for the CSS-manifest pipeline — see next entry.
  `StaticCssWebpackPlugin` left in place deliberately (not a cleanup candidate after all — see
  correction above), with a comment added explaining when it's actually reachable.
- **Status:** root cause confirmed empirically; worked around for the CSS-manifest path (next
  entry). `StaticCssWebpackPlugin` kept as-is; no further action needed unless/until there's a
  Turbopack-compatible way to get incremental rebuild notifications (no such hook currently
  exposed via `next.config`).

## 2026-06-27 — `css-manifest.json` for `routeCss: true` had no producer at all; recovered draft fix had a mangled filename and a dead-on-arrival design

- **Symptom:** `TwCssInjector` (`packages/domain/runtime-css/src/CssInjector.tsx`) always warned
  manifest not found and rendered `<></>`, even with `routeCss: true` set in
  `withTailwindStyled(...)`.
- **Where:** `packages/domain/compiler/src/index.ts` (registry), `packages/presentation/next/src/withTailwindStyled.ts`.
- **Root cause (layered):**
  1. `registerFileClasses`/`registerGlobalClasses`/`getRouteClasses` were no-op stubs — already
     fixed to a real in-memory registry (`_fileClassesMap`/`_globalClasses` in `compiler/index.ts`)
     in a prior pass.
  2. No code anywhere ever wrote `css-manifest.json`. A draft fix (`RouteCssManifestPlugin`, a
     `compiler.hooks.done`-based webpack plugin) was written in a prior session but the file landed
     in this repo as `Routecssmanifestplugin .ts` — wrong case, trailing space before the
     extension — i.e. it never actually existed as an importable module under its intended name.
     Likely cause: manual copy of `create_file` output from a separate, ephemeral session
     environment into the real repo before re-zipping; nothing else in that session's edits (all
     `str_replace` on existing files) was affected, only this one `create_file`.
  3. Independent of the filename bug: that draft's `compiler.hooks.done` design would have been
     dead-on-arrival anyway per the entry above — it never executes under default Turbopack
     builds.
  4. The `routeCss` option itself was declared in both `NextAdapterOptionsSchema` and
     `withTailwindStyled.ts`'s option types but never actually **read** anywhere in
     `withTailwindStyled.ts` — so even with a working producer wired in, the feature had no gate.
  5. A second, more subtle issue found while fixing this: the validated fix location (the
     config-eval-time IIFE, immune to the Turbopack issue above) runs **once, at startup, before
     the bundler has compiled a single file**. `getAllRegisteredClasses()` only gets populated
     progressively by `registerFileClasses()` calls from `webpackLoader.ts`/`turbopackLoader.ts`
     *during* compilation — which starts strictly after config-eval. Reading that registry from
     the startup IIFE would always observe an empty set. Separately, `getRouteClasses()`'s
     `fileToRoute()` only recognizes `page.tsx`/`layout.tsx`/`loading.tsx`/`error.tsx` directly —
     classes from shared components (most real styling) fall through to `"__global"` anyway via
     the `fileToRoute(filepath) ?? "__global"` fallback. So even setting the timing issue aside,
     the registry doesn't currently buy real per-route splitting — true per-route splitting needs
     import-graph tracing (which file is transitively imported by which route) that doesn't exist
     in this compiler yet. The separate native `analyze_route_class_distribution` (used by `tw
     split` CLI) is closer to this but is a disconnected pipeline with a different manifest shape.
- **Fix:** Removed the mangled `Routecssmanifestplugin .ts` file entirely (abandoning the
  webpack-hook design). Implemented the `__global`-only manifest write directly inside the
  existing config-eval-time IIFE in `withTailwindStyled.ts`, gated behind `normalizedOptions.routeCss`,
  sourced from `filteredClasses`/`utilitiesOnly` (the same `scanWorkspace()` result already used
  for `_initial-scan.css` — synchronously available, no registry-timing dependency). Writes
  `.next/static/css/tw/_global.css` and `.next/static/css/tw/css-manifest.json` (`{ routes:
  { __global: "_global.css" } }`) via the existing `atomicWriteFile()` helper. Updated the stale
  `withTailwindStyled.ts` comment that claimed "production: webpack handles both" (contradicted by
  the entry above), and the doc comments in `upstream-modules.d.ts` / `compiler/index.ts` that
  referenced the now-removed `RouteCssManifestPlugin` class.
- **Status:** `__global`-bucket manifest generation fixed and wired end-to-end (dev + any build
  bundler) — **superseded same day**, see the newer entry above: real per-route splitting was
  implemented via `routeGraph.ts` (import-graph tracing), not deferred after all.
  `getAllRegisteredClasses()`/`fileToRoute()` registry was NOT used for that — kept for other
  consumers (e.g. `tw split` CLI). Also noted but not addressed: `getAllRoutes()` in
  `compiler/index.ts` throws if the native `analyzeClasses` binding is missing, but then ignores
  its result and returns a hardcoded `["/", "__global"]` regardless — unused anywhere currently,
  flagged as a minor code-hygiene item (see item #2 in the per-route-splitting entry's follow-up
  list if tackled later).


## 2026-06-27 — `preserveDirectives()` in `tsup.config.ts` never actually injects "use client" (silently no-op)

- **Symptom:** `withTailwindStyled.ts` carries a comment (lines ~688-718) claiming Bug A (SSR 500,
  "Cannot read properties of null (reading 'useState')") is fixed because `dist/index.mjs` is now
  correctly prefixed with `"use client"`. Direct inspection of the **published**
  `tailwind-styled-v4@5.1.11` tarball shows `dist/index.mjs`, `dist/theme.mjs`, `dist/runtime.mjs`
  (and their `.js` CJS counterparts) have **no** `"use client"` anywhere — only the `.map` files
  reference it (because sourcemaps embed original source).
- **Where:** `tsup.config.ts`, `preserveDirectives()` (~line 76) + its call site `onSuccess()`
  (~line 230).
- **Root cause:** Two compounding bugs in `preserveDirectives()`:
  1. It hardcodes reading only `metafile-esm.json`, never `metafile-cjs.json`. tsup (confirmed in
     `tsup@8.5.0` source, `dist/index.js:628`) writes one metafile per format:
     `metafile-${format}.json`.
  2. Its output filter is `if (!outPath.endsWith(".js")) return`. Since root `package.json` has no
     `"type": "module"`, tsup's ESM outputs are named `*.mjs` (confirmed against the published
     tarball, which ships matching `.js`/`.mjs` pairs per entry) — `"index.mjs".endsWith(".js")` is
     `false`, so **every** output listed in `metafile-esm.json` is skipped by this filter.
  Net effect: the function reads a metafile whose outputs are all filtered out, and never reads the
  one metafile whose outputs would pass the filter. It is currently a complete no-op for both
  formats — the directive is never written to any dist file, regardless of what the source-level
  `"use client"` in `packages/domain/theme/src/liveTokenEngine.ts` says.
- **Fix:** Not yet applied. Needs `preserveDirectives()` to loop over both `metafile-esm.json` and
  `metafile-cjs.json` and match each one's outputs against its own format's real extension (`.mjs`
  for esm, `.js` for cjs) — e.g. parameterize by `{ metaFile, matchExt }` per format instead of
  hardcoding `"metafile-esm.json"` + `.js`.
- **Status:** root cause fully identified (verified against actual tsup source + published tarball
  bytes). Bug A's `serverExternalPackages` fix (removing `tailwind-styled-v4` from that list) is
  confirmed already applied in both local source **and** the published `5.1.11` — but per the
  `withTailwindStyled.ts` comment's own reasoning, that fix depends on the directive actually being
  present in `dist/index.mjs`. Until this `preserveDirectives()` bug is fixed and a new version is
  published, Bug A should be assumed **not actually resolved** end-to-end, despite the confident
  comment in `withTailwindStyled.ts` claiming otherwise.

## 2026-06-27 — `FATAL: Native binding 'parseTemplate' is required but not available` thrown in browser at `ExtendDemo.tsx` module evaluation

- **Symptom:** Uncaught browser error at module evaluation, not just a console warning — crashes
  the page. Stack points at `ExtendDemo.tsx`, the `` tw.nav`...`.withSub<...>() `` declaration
  (template-literal call, not object-config).
- **Where:** `examples/next-js-app/src/components/ExtendDemo.tsx`, the `NavBar` export.
- **Investigation:** Matches SKILL.md Pattern C: template-literal `tw.*` calls need the Rust AST
  transform to run at build time (rewriting them to static object-config) — if it doesn't, the raw
  template-literal call ships as-is and calls native `parseTemplate()` at runtime, which can never
  exist in a browser bundle by definition. The native binary itself is confirmed healthy on this
  machine (same log shows `[scanner] [native] using native parser from .../tailwind-styled-native.node`
  succeeding), so this isn't binary-load failure (Pattern B) — it's specifically the Turbopack
  loader not transforming this file/expression.
- **Root cause:** Not yet pinned down. Open questions for next reproduction: does the Turbopack rule
  actually run on `ExtendDemo.tsx` at all (add temporary logging in `turbopackLoader.ts`'s
  `isSkippable()`); does `runLoaderTransform()`'s AST matcher handle a template-literal immediately
  chained with `.withSub<...>()` the same as a bare `` tw.nav`...` ``; and confirm examples/next-js-app
  is even resolving the Next adapter version that contains the current Turbopack rule logic (it
  installs `tailwind-styled-v4` from the registry, not local source — version skew is possible, see
  architecture.md).
- **Fix:** Not yet applied — needs reproduction with the above narrowed before proposing one.
- **Status:** open — pattern identified (Pattern C), exact trigger not yet isolated.

## 2026-06-26 — `FATAL: Native binding 'generateSystemTokenCss' is required but not available`

- **Symptom:** Uncaught error in browser console at module evaluation of a component calling
  `createStyledSystem({...})` (e.g. `DesignSystem.tsx`).
- **Where:** `packages/domain/core/src/native.ts` / `styledSystem.ts`, thrown when
  `getNativeBinding()?.generateSystemTokenCss` is undefined.
- **Root cause:** Confirmed version drift between the published `tailwind-styled-v4` main package
  and its native platform `optionalDependencies` — see `architecture.md` "Confirmed version drift"
  table (4 different version numbers found across root/`core`/`native`/published-optionalDeps).
  If `generateSystemTokenCss` was added to the JS after the pinned native version, the loaded
  binary simply doesn't export it.
- **Fix:** Re-sync/republish `@tailwind-styled/native-*` optionalDependency pins to match the
  native code actually shipped for the current main-package version. Not yet applied — flagged for
  the maintainer to fix in the release pipeline.
- **Status:** root cause identified, fix not yet applied.

## 2026-06-26 — `TypeError: BaseCard.extend is not a function`

- **Symptom:** Build-time/SSR `TypeError` at module evaluation of `ExtendDemo.tsx`, calling
  `.extend()` on a `tw.div({...})`-created component.
- **Where:** `examples/next-js-app` (installs `tailwind-styled-v4` from the public npm registry —
  `examples/*` is not a workspace member, see `architecture.md`).
- **Investigation:** `createComponent.ts` always attaches `.extend` regardless of native binding
  state (object-config path doesn't touch native at all). Pulled the actual published
  `tailwind-styled-v4@5.1.4` tarball and called `tw.div({base:''}).extend(...)` directly in Node —
  `.extend` **was** present and callable there. So the published bundle itself is not obviously
  broken for this symbol.
- **Root cause:** Not fully pinned down for the user's exact machine/run. Leading suspects, in
  order: (1) stale/partial `node_modules/tailwind-styled-v4` from a previous install (the `npm i`
  log showed "changed 1 package" — consistent with a partial refresh), (2) dual module instance /
  stale Turbopack cache serving an older chunk for the SSR bundle specifically.
- **Fix:** Not yet applied. Verification steps to run before concluding: `rm -rf .next
  node_modules/.cache`, then re-run `node -e "console.log(typeof require('tailwind-styled-v4')
  .tw.div({base:''}).extend)"` from inside `examples/next-js-app` against the *exact* installed
  copy, before re-testing in the Next dev server.
- **Status:** open — needs reproduction with a clean cache to narrow further.

## 2026-06-26 — `[tailwind-styled-v4] tw.server.div rendered in browser...` warning fires despite correct config

- **Symptom:** Console warning suggesting `withTailwindStyled`/Vite plugin isn't configured, even
  though `examples/next-js-app/next.config.ts` does wrap `withTailwindStyled({ routeCss: true })`.
- **Where:** `packages/domain/core/src/twProxy.ts`, `makeServerTag()`.
- **Root cause:** The warning condition is `typeof window !== "undefined" && process.env.NODE_ENV
  !== "production"` — it fires on **every** client-side render of a `tw.server.*` component in dev,
  unconditionally. It does not actually check whether the compiler/plugin transformed the
  component or not, so it's not a reliable signal of misconfiguration.
- **Fix:** Not yet applied — the real fix belongs in `twProxy.ts`: the condition should check
  whether this specific component was actually compiler-transformed (e.g. via a marker the
  transform sets) rather than firing for every client render unconditionally.
- **Status:** root cause identified (warning logic itself is the bug), fix not yet applied.
