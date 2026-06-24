# CSS Pipeline Guard — Reference

## The bug class, precisely

Rust resolves Tailwind utility classes into real CSS declarations (e.g. `w-full` → `width: 100%`). When it can resolve a class fully, you get a clean declaration. When it can't — because the theme context passed in was incomplete, or the class isn't in scope, or resolution partially failed — some code paths return the **raw class name itself** as if it were the declaration. `w-full` is not valid CSS as a declaration; it has no colon. If that string reaches a `.css` file on disk untouched, PostCSS / Tailwind v4 throws at build time:

```
CssSyntaxError: Invalid declaration: 'w-full'
```

This already happened in this codebase, and it was fixed — but only in one place.

## Where the fix lives, and what it actually does

`packages/domain/shared/src/staticStateExtractor.ts` (around line 318 onward) calls `native.generateStaticStateCss(...)`, then **before writing anything to disk**, runs every returned rule through two checks:

- `isFullyUnresolved` — `rule.declarations.trim().length > 0 && !rule.declarations.includes(":")`. If every declaration in the rule is just a bare class name, skip the whole rule (and encode the class names into a comment so Tailwind's `@source` scanner doesn't pick them up as real selectors either).
- `sanitizeCssRule` — handles the *mixed* case, where some declarations resolved and some didn't (e.g. `"width: 100%\nw-full"`). It splits on `;`/newline, keeps only segments containing `:`, and rebuilds the rule from just the valid ones. Returns `null` if nothing valid remains.

This is the canonical pattern for this entire class of bug: **never assume a declaration string from Rust is valid CSS — check for `:` before it touches disk.** Read the actual code before you write a new guard anywhere else; don't reinvent it slightly differently.

## Why one fix in one file isn't actually a system-level fix

The project's own `CLAUDE.md` says: *"Prioritaskan solusi yang memperbaiki sistem daripada kasus tunggal"* (prioritize fixes that fix the system, not a single case). The `isFullyUnresolved` / `sanitizeCssRule` logic is excellent — but it's a private, unexported pair of functions inside one file. Any *other* code path that writes Rust-generated CSS to disk has to either know this pattern exists and reimplement it, or skip it entirely. At last check, this codebase has at least one other site that does the latter:

`packages/presentation/next/src/withTailwindStyled.ts` (~line 570–606) calls `generateCssForClasses(...)`, strips `@layer` blocks via `extractUtilitiesLayer`, and writes the result with `atomicWriteFile` — with no `:`-style validation in between. If `generateCssForClasses` ever returns a partially-unresolved declaration (the same root cause as the original bug, just reached through a different call path), this site will reproduce the exact same `CssSyntaxError`, and whoever debugs it next won't find a reference to look at unless they already know about `staticStateExtractor.ts`.

This is the actual takeaway, not just "go fix that one line": **the guard should be a shared, exported utility in `packages/domain/shared/src`** (e.g. `cssDeclarationGuard.ts` exporting `isFullyUnresolved` and `sanitizeCssRule`), imported by every site that writes Rust-resolved CSS to disk. This skill doesn't make that change for you — it's a real source-code edit with real tradeoffs (do you want to skip-and-comment, like the current behavior, or fail the build loudly when resolution is incomplete? that's a product decision, not a mechanical refactor) — but it tells you exactly where to look and what shape the fix should take.

## Procedure for a new `CssSyntaxError: Invalid declaration` (or similar)

1. **Read the error message for the file path.** It tells you which generated `.css` (or `.css`-adjacent) file has the bad content — usually something under a `tw-classes/` directory.
2. **Find what wrote that file.** `grep -rn "writeFileSync\|atomicWriteFile" packages/` and match by directory/filename convention, or just look at which loader/plugin owns that build step (Next webpack/turbopack loader, Vite plugin, Rspack loader, or the CLI).
3. **Trace upstream from the write to the nearest Rust call** (`generateCss*`, `compileToCss*`, `generateStaticStateCss`, `generateAtomicCss`, `generateCssForClasses`, `processTailwindCss*`). Check whether anything between that call and the write validates declarations contain `:`.
4. **If there's no guard:** that's your root cause location — not the line that threw. Per `CLAUDE.md`: fix the generator/writer, don't hand-patch the bad output file.
5. **Decide the right fix at that location:**
   - If classes *shouldn't* be unresolved here (missing theme token, scan gap) — fix the resolution upstream in Rust or the scan config.
   - If partial resolution is an expected, valid runtime state for this pipeline stage — add the same sanitize-before-write guard (ideally the shared version, see above).
6. **Never edit the generated `.css` output directly** to make the immediate error go away — it'll just regenerate wrong again on the next build.

## Using the bundled scanner

```bash
node scripts/scan_unsafe_css_writes.mjs --root <repo>
```

This is a heuristic, not a real data-flow analyzer. It looks for a `fs.writeFileSync` / `writeFileSync` / `atomicWriteFile` call, finds the nearest *preceding* call to a Rust CSS-generation function in the same file, and checks whether anything in between contains guard evidence (`includes(":")`, `isFullyUnresolved`, `sanitizeCssRule`, `isUnresolved`). A clean result narrows down where to look manually — it is not proof of safety, and a flagged result is not proof of a bug. Read the flagged site yourself before concluding anything.

At last audit, this correctly distinguishes:
- `staticStateExtractor.ts` (2 write sites) → **guarded**, evidence found.
- `withTailwindStyled.ts:590` → **unguarded candidate**, no evidence found in between the `generateCssForClasses` call and the write.
- The safelist writer in `turbopackLoader.ts` → correctly **not flagged at all**, because it builds CSS locally from a class list with empty rule bodies (`.foo {}`) rather than writing Rust-resolved declarations — there's nothing to validate there.

If you add a new pipeline stage that writes Rust-generated CSS to disk, run this script afterward to confirm it either shows up as guarded or you've consciously decided it doesn't need to be.
