# Release / Publish Guardian — Reference

## The constraint that shapes everything in this section

The development machine for this project is Arch Linux — one platform. The published package targets five: `darwin-arm64`, `darwin-x64`, `linux-arm64-gnu`, `linux-x64-gnu`, `win32-x64-msvc`. This means a meaningful fraction of "did the release actually work" questions are **structurally unanswerable from the dev machine** — they can only be answered by reading the GitHub Actions run for the tag you just pushed. Anything in this reference that can be checked locally, check locally. Anything that can't, the bundled script says so explicitly rather than pretending it checked.

## A live finding: `optionalDependencies` native binary pins are stale, and the existing sync tooling won't catch it

The root `package.json` declares:

```json
"optionalDependencies": {
  "@tailwind-styled/native-darwin-arm64": "5.0.6-canary.0.0",
  "@tailwind-styled/native-darwin-x64": "5.0.6-canary.0.0",
  "@tailwind-styled/native-linux-arm64-gnu": "5.0.6-canary.0.0",
  "@tailwind-styled/native-linux-x64-gnu": "5.0.6-canary.0.0",
  "@tailwind-styled/native-win32-x64-msvc": "5.0.6-canary.0.0",
  ...
}
```

At last check, the root package version was `5.0.36`. The pins above are stuck at `5.0.6-canary.0.0`. Worse: a direct query against the npm registry (`https://registry.npmjs.org/@tailwind-styled%2Fnative-darwin-arm64`, and the same for all five) returns **404 for every single one** — none of these packages have ever been published. This is independently confirmed, not inferred from the version string alone.

**Why `npm run version:sync` doesn't catch this.** Read `scripts/version-sync.ts`: it iterates `dependencySections` (including `optionalDependencies`), but for each dependency it checks `if (!workspacePackageNames.has(dependencyName)) continue` — it only updates a dependency's version if that name matches a package under `packages/*/package.json`. The five `@tailwind-styled/native-*` names are not workspace packages (they're meant to be published externally), so the sync script silently skips them on every run. This isn't a bug in version-sync.ts exactly — it's doing what it was built to do — but it means there is currently **no tooling in this repo that keeps these pins current**, and that gap isn't visible unless you read the script's filter logic line by line.

**What this means practically:** since the packages don't exist on the registry, `npm install` of the main package silently no-ops on these five (optional dependencies that fail to resolve don't break the install) — so this isn't currently breaking anyone's install. But it does mean:
- Anyone reading `package.json` to understand binary distribution strategy will reasonably conclude there's a per-platform-package mechanism in place. There isn't, currently.
- Cross-reference with the `files` field: `"native/tailwind-styled-native*.node"` is listed there, and `.github/workflows/publish.yml` downloads all five platform binaries into `native/` before running `npm publish` — meaning the **actual, working distribution mechanism is bundling all five binaries directly into the main package's tarball**, not separate optional packages. The `optionalDependencies` entries look like the start of a more standard per-platform-package distribution scheme (the pattern used by e.g. esbuild, swc) that was begun and abandoned.

**The decision this requires (not a mechanical fix — flag it to a human):**
- (a) If the bundled-tarball approach is the intended permanent strategy: remove the five `optionalDependencies` entries entirely. They currently do nothing but add five guaranteed-404 lookups to every install.
- (b) If per-platform packages were the intended end state: someone needs to actually build and publish them, and wire that into `publish.yml`, and decide whether `version-sync.ts` should be extended to cover non-workspace optional dependencies that match a known naming pattern.

Either is a legitimate call — this reference isn't telling you which. It's telling you the current state is neither: declared but non-functional.

## Pre-publish checklist

Run in this order. Steps 1–6 are local and safe to re-run. Step 7 cannot be done locally.

1. `npm run build:rust` — fresh native build, regenerates `native/index.d.ts`. Skip only if you're certain no Rust source changed since the last build.
2. `node scripts/check_signature_drift.mjs --root .` — no duplicate NAPI exports, `.d.ts` not stale. See `references/napi-bridge-sync.md` if this fails.
3. `node scripts/scan_unsafe_css_writes.mjs --root .` — no new unguarded CSS write sites. See `references/css-pipeline-guard.md` if this fails.
4. `npm run version:sync` — syncs workspace package versions. Remember: this does **not** cover the `optionalDependencies` native-* pins (see above) — check those separately, manually, until that gap is closed.
5. `npm run pack:check` — verifies what actually ends up in the npm tarball.
6. `npm run check:binary-size:strict` — enforces the 15MB ceiling. Requires `dist/` to exist; run `npm run build:release` first if it doesn't.
7. `npm run validate` — the project's own final health report.
8. **Cannot be done locally:** after pushing the release tag, open the Actions tab on GitHub and confirm the `build-native` matrix job succeeded for all five targets before considering the release real. A failed `windows-latest` or `macos-latest` job in that matrix means the published tarball is missing a binary for that platform, and nothing in steps 1–7 would have told you that.

## Using the bundled script

```bash
node scripts/preflight_publish.mjs --root <repo> --check-registry
```

Runs steps 1–7 above automatically (skipping `build:rust` itself, since it's slow and you may not want it run unconditionally — run it yourself first if needed) and prints a pass/fail summary. `--check-registry` adds a live lookup against `registry.npmjs.org` for each `optionalDependencies` native-* package and reports whether it actually resolves — this requires network access and is off by default so the script stays usable offline. It always ends by printing the reminder about step 8, because that's the step most likely to get silently assumed rather than actually checked.
