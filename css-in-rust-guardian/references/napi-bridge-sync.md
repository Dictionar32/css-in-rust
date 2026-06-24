# NAPI Bridge Sync — Reference

## The two kinds of "bridge" in this codebase, and why they carry different risk

Every value that crosses from Rust into TypeScript in this project falls into one of two categories, and they fail in different ways.

**1. True NAPI-bound functions.** These are `#[napi]` (or `#[napi(js_name = "...")]`) functions in `native/src/infrastructure/napi_bridge_*.rs` and elsewhere. napi-rs generates `native/index.d.ts` directly from these at build time (`npm run build:rust`). The FFI boundary itself is real and enforced — if you call a function that doesn't exist, you get a hard error, not silent `undefined`. The risk here isn't "does the function exist," it's:
- **Duplicate exports.** Two different Rust functions, in two different files, both annotated `#[napi]`, both converting to the same JS name. napi-rs doesn't warn about this — it just emits both declarations into `index.d.ts`, and one implementation becomes effectively unreachable from JS (or worse, behavior depends on link order). This is real and currently present in this codebase — see below.
- **Stale `index.d.ts`.** If Rust source changed but `npm run build:rust` wasn't re-run, the `.d.ts` you're reading doesn't reflect the code that's actually compiled. Per the project's own `CLAUDE.md`: never hand-edit generated output, regenerate from source. The same applies to *trusting* generated output — verify it's fresh before you read it as ground truth.

**2. "Mirrored" types.** Some Rust code doesn't go through `#[napi(object)]` at all — it just produces a value that's meant to *structurally match* a TypeScript interface defined and maintained independently, with the only link between them being a comment. Examples actually present in this codebase right now:

```
native/src/application/analyzer.rs:28   // This mirrors the ScanWorkspaceResult shape from @tailwind-styled/scanner.
native/src/application/incremental.rs:31 // Output `rebuildWorkspaceResult` — identik dengan `ScanWorkspaceResult` di TS.
native/src/legacy_root_part.rs:946       // This mirrors the ScanWorkspaceResult shape from @tailwind-styled/scanner.
```

There is **no compiler anywhere** that checks these comments are still true. If someone renames a field in the TS `ScanWorkspaceResult` interface, or changes a Rust struct that's supposed to produce a matching shape, nothing fails until a value silently comes back missing a property at runtime. This is the highest-risk category in the entire bridge, and it's also the one the bundled script *can't* check for you — there's no name collision or count mismatch to detect, just a claim in a comment. When you touch a struct anywhere near one of these comments, manually open the file on the other side of the "mirrors" claim and check it by eye. Don't skip this because the script came back clean — the script doesn't cover this category at all.

## A naming-convention trap already in this codebase

`packages/domain/compiler/src/nativeBridge.ts` defines result interfaces with inconsistent field casing in the same file:

```ts
export interface ScanWorkspaceResult {
  total_files: number      // snake_case
  unique_classes: number
  duration_ms: number
}

export interface BatchExtractResult {
  contentHash: string      // camelCase
  ok: boolean
}
```

This isn't necessarily a bug by itself — it can correctly reflect that one value comes from raw `serde_json` (snake_case by default) and another from a `#[napi(object)]` struct (which napi-rs auto-converts to camelCase). But it means **you cannot assume a casing convention when adding a new field** — you have to check, for each individual result type, which serialization path actually produced it. Guessing wrong gives you `undefined`, not a type error, because TypeScript trusts the interface declaration whether or not it matches what Rust actually sends.

## Procedure

1. **Run `npm run build:rust` if you suspect Rust source changed since the last build.** Don't trust `native/index.d.ts` otherwise.
2. **Run the bundled script:**
   ```bash
   node scripts/check_signature_drift.mjs --root <repo>
   ```
   This reads `native/src/**/*.rs` directly (not just the generated `.d.ts`), so it works even if you haven't rebuilt yet, and it cross-checks both. It reports three things — read all three, they catch different failure modes:
   - **Duplicate JS-exported names** (different Rust source locations producing the same exported name) — high confidence, this is a real name collision, not a heuristic.
   - **Stale `.d.ts`** — names present in source but missing from `index.d.ts`, or vice versa.
   - **Param-count mismatches** against the TS bridge files — this one *is* a heuristic (simple regex, not a real TS parser), treat a hit as "go look," not as a confirmed bug.
3. **For any duplicate found:** open every listed file. Figure out which one is actually live (check if the "legacy" file is even included in the module tree being compiled — `grep` for `mod legacy_part` / `mod legacy_root_part` in the relevant `mod.rs` / `lib.rs`). Don't fix a bug in the file that isn't reachable.
4. **For anything you change that's a "mirrored" type:** grep for the type name across `native/src` and the TS package it's mirrored from, manually diff the fields. The script won't do this part for you.

## What was found in this codebase at last audit (re-verify, don't trust this list forever)

33 JS-exported names resolve to more than one Rust definition. A representative sample (run the script for the current full list):

- `analyzeClasses` — `napi_bridge_parsing.rs` (1 param) vs `legacy_root_part.rs` (3 params). Different arities sharing one name — this is the most dangerous kind of duplicate in the list, not just redundant.
- `atomicRegistrySize` / `clearAtomicRegistry` / `generateAtomicCss` / `parseAtomicClass` / `toAtomicClasses` — every one of these exists once in `native/src/application/atomic.rs` (backed by a registry called `REGISTRY`) and once in `native/src/application/atomic_parser.rs` (backed by a *separate* registry called `ATOMIC_REGISTRY`). These are two parallel, independently-stateful implementations of the same concept. Calling `clearAtomicRegistry()` from JS only clears one of the two registries — whichever one is actually bound. The other accumulates entries with no way to inspect or clear it from JS.
- A long tail of duplicates between the modular `infrastructure/napi_bridge_*.rs` files and `legacy_part.rs` / `legacy_root_part.rs` files, which the project's own `structure.md` describes as "deprecated legacy code" but which are still compiled with active `#[napi]` attributes.

If this list is empty when you run the script, that's good news — it means someone already cleaned this up. Verify, don't assume either way.
