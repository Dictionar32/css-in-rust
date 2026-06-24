---
name: css-in-rust-guardian
description: >
  Use this skill when working on the css-in-rust / tailwind-styled-v4 monorepo
  (Rust NAPI engine + TypeScript packages, npm workspace, native bindings via
  napi-rs). Specifically consult it before or while (1) touching anything in
  native/src/infrastructure/napi_bridge_*.rs, packages/domain/compiler/src/nativeBridge.ts,
  or nativeBridgeWrappers.ts, (2) debugging a CSS build error such as a CssSyntaxError
  about an invalid declaration, unresolved Tailwind classes leaking into generated
  CSS, or any output under tw-classes/ or dist/, and (3) preparing an npm publish,
  version bump, or release of this package. Always run the bundled drift-detection
  scripts before approving changes to the NAPI bridge or before tagging a release
  — this codebase has a documented history of silent Rust-to-TypeScript drift bugs
  that name-matching alone won't catch.
---

# css-in-rust Guardian

## Why this skill exists

This monorepo has one structural property that drives most of its hardest bugs: the boundary between Rust and TypeScript, and the boundary between "CSS that Rust resolved correctly" and "CSS written to disk," are **not enforced by any compiler**. They're held together by naming convention and by comments like `// mirrors X` or `// identik dengan Y`. When that convention drifts, nothing fails loudly — you get a wrong value, a missing function, or invalid CSS that only shows up at build time, far from the line that caused it.

`CLAUDE.md` at the project root already states the right principles (root cause first, never hand-edit generated output, native-first, no silent fallbacks). This skill operationalizes those principles into concrete, scriptable checks for the three places where drift actually happens in this codebase. It doesn't replace `CLAUDE.md` — read that too — it gives you the tools to verify you're actually following it.

One more thing worth knowing before you trust any architecture doc in this repo: `.kiro/steering/structure.md` describes `native/src/` as containing only `domain/ application/ infrastructure/ utils/`. The actual tree also has `shared/ interface/ template/ bin/`. The steering docs are a useful map, not ground truth — when in doubt, run `find native/src -maxdepth 1 -type d` yourself rather than trusting the doc.

## Three domains, one shared pattern

| If you're... | Read | Run |
|---|---|---|
| Changing or debugging the NAPI bridge (Rust `#[napi]` fns ↔ TS bridge interfaces) | `references/napi-bridge-sync.md` | `scripts/check_signature_drift.mjs` |
| Debugging a CSS/build error, or touching anything that writes generated CSS to disk | `references/css-pipeline-guard.md` | `scripts/scan_unsafe_css_writes.mjs` |
| Preparing a version bump, npm publish, or release tag | `references/release-publish.md` | `scripts/preflight_publish.mjs` |

All three scripts are read-only / side-effect-free (they only run other read-only `npm run` scripts) and accept `--root <path>` if you're not running them from the repo root, plus `--json` for machine-readable output.

The shared pattern across all three domains: **find the place where Rust's output gets trusted by TypeScript without verification, and check that trust is actually warranted.** Function exists? Same parameter count? Declaration string actually valid CSS? Version pin actually current? Each reference file below is a worked example of that same question applied to a different boundary.

## Before touching the NAPI bridge or debugging a CSS error

Run this first, every time, before reading anything else:

```bash
node scripts/check_signature_drift.mjs --root /path/to/css-in-rust-tailwnd-js-css
```

As of the last audit of this repo, this surfaces **33 function names** that resolve to more than one distinct Rust implementation — including `analyzeClasses`, which has two implementations with *different parameter counts* (1 vs 3) sharing the same exported JS name. Most of the duplicates trace back to `legacy_root_part.rs` / `legacy_part.rs` files that the docs call "deprecated" but which are still compiled with live `#[napi]` attributes. Don't assume this has been fixed by the time you read this — re-run the script, don't trust this number.

This matters for anything you're about to do in the bridge: if you're about to fix a bug in one of these functions, you may be editing the implementation that JS *can't even reach*, because the other one with the same exported name is the one actually bound. Identify which file is live before you touch either one. See `references/napi-bridge-sync.md` for how to tell.

## Before debugging a CSS build error

If you're looking at `CssSyntaxError: Invalid declaration` or similar, the root cause is almost always: Rust returned a partially- or fully-unresolved class name (e.g. `w-full`) instead of a real CSS declaration, and the TypeScript side wrote it to disk without checking. `packages/domain/shared/src/staticStateExtractor.ts` already has the fix for this pattern (`isFullyUnresolved` + `sanitizeCssRule` — read it before writing a new guard from scratch). The problem is that guard exists in exactly one file. Run:

```bash
node scripts/scan_unsafe_css_writes.mjs --root /path/to/css-in-rust-tailwnd-js-css
```

to find other CSS-from-Rust write sites missing the same protection. Full procedure in `references/css-pipeline-guard.md`.

## Before tagging a release

```bash
node scripts/preflight_publish.mjs --root /path/to/css-in-rust-tailwnd-js-css --check-registry
```

This chains the project's existing release scripts (`version:sync`, `pack:check`, `check:binary-size:strict`) plus the two scripts above, and adds one check none of the existing tooling does: whether the five `@tailwind-styled/native-*` entries in `optionalDependencies` are still pointing at something real. At last check they were pinned to `5.0.6-canary.0.0` while the root package was at `5.0.36`, and none of the five packages exist on the npm registry at all (confirmed via direct registry lookup — all five 404). `npm run version:sync` will not catch this; it only syncs versions for packages that exist under `packages/*/package.json`, and these aren't workspace packages. Full detail and the decision you need to make about it in `references/release-publish.md`.

It also explicitly reminds you what it *can't* check: the multi-platform native build matrix in `.github/workflows/publish.yml` can only be verified on GitHub Actions, never on a single-platform Arch Linux dev machine. The script prints this reminder every run rather than letting it be silently assumed.

## A note on what this skill is not

This skill does not watch your filesystem, run in the background, or act on its own between conversations — none of that is something a Claude session can actually do. Every check here only runs when you (or a Claude session working on this repo) explicitly invokes it. If you've seen `.blackbox/skills/patterncode-base/SKILL.md`, that skill describes capabilities like autonomous background scanning and self-initiated git pushes that aren't real — treat its claims accordingly.
