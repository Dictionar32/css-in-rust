# Known Issues Log — css-in-rust / tailwind-styled-v4

Append-only log of diagnosed issues in this repo, newest first. Format per entry:
**Symptom → Where → Root cause → Fix → Status**

---

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
