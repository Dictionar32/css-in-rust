# Track A: Source Transform

**Status:** ✅ Production-ready  
**Track:** A  
**Labels:** `track/A`, `status/production`

## Scope

Transform tw.tag\`classes\` and tw.tag({ config }) to static components.

## Gate Checklist

- [x] Build: compiler builds clean
- [x] Test: `packages/domain/compiler/tests/` passes (5 test files)
- [x] Docs: `docs/api/engine.md` updated
- [x] RSC analysis: QA #3 enhanced with hooks, events, browser APIs
- [x] Type safety: CRITIQUE-20 #1 — no `any` in CvFn/TwComponentFactory

## Implementation

- **Location:** `native/src/lib.rs` — `transform_source()`
- **TypeScript:** `packages/domain/compiler/src/astTransform.ts`
- **Mode:** zero-runtime only (mode option deprecated)
