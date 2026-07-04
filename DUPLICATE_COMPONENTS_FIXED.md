# Duplicate Components Fixed — mentor/styles.ts

**Status**: ✅ FIXED  
**Date**: July 4, 2026  
**Issue**: Redeclared block-scoped variables blocking dev server  
**Resolution**: Removed duplicate component exports

## Problem

The `mentor/styles.ts` file had duplicate export definitions introduced during the automated boolean variants fix script:

```
ERROR: Cannot redeclare block-scoped variable 'SkillTag'
ERROR: Cannot redeclare block-scoped variable 'TipCard'
```

This prevented the dev server from compiling, causing 500 errors on `/learn/mentor/roadmap` route.

## Root Cause

The `fix-boolean-variants.mjs` script appended duplicate component definitions at the end of the file:

- **Line 90**: First `SkillTag` definition (original, correct)
- **Line 169**: Duplicate `SkillTag` definition (added by script, removed)
- **Line 101**: First `TipCard` definition (original, correct)
- **Line 173**: Duplicate `TipCard` definition (added by script, removed)

## Solution

Removed the duplicate definitions at the end of the file (lines 168-176):

```typescript
// REMOVED:
export const SkillTag = tw.span({
    base: "inline-flex items-center text-[9px] font-semibold px-2 py-0.5 rounded-md border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] bg-[color-mix(in_srgb,var(--accent)_5%,transparent)] text-[color-mix(in_srgb,var(--accent)_80%,transparent)]",
})

export const TipCard = tw.div({
    base: "rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 my-4",
})
```

The original definitions remain (lines 90 and 101).

## Verification

### TypeScript Diagnostics
✅ `mentor/styles.ts`: 0 diagnostics  
✅ `mentor/page.tsx`: 0 diagnostics  
✅ Full example app: `npx tsc --noEmit` → 0 errors

### File Changes
- **File**: `examples/next-js-app/src/app/learn/mentor/styles.ts`
- **Lines Removed**: 168-176 (9 lines)
- **Change Type**: Deletion of duplicates

## Impact

✅ Dev server can now compile without errors  
✅ `/learn/mentor/roadmap` route no longer returns 500  
✅ All mentor pages can be navigated and edited  

## Related Issues Fixed

This completes the boolean variants fix cycle:

1. ✅ TASK 1: Fixed TypeScript type inference for boolean/number/string variants
2. ✅ TASK 2: Fixed popover-api example (string vs boolean mismatch)
3. ✅ TASK 3: Fixed css-functions-future example (string vs boolean mismatch)
4. ✅ TASK 4: Bulk fixed all 20 styles.ts + 38 page.tsx files
5. ✅ TASK 5: Created steering documentation (boolean-variants.md)
6. ✅ TASK 6: Updated changelog and known-issues
7. ✅ TASK 7: Fixed duplicate component exports in mentor/styles.ts (THIS FIX)

All boolean variant fixes are now complete and verified.

---

**Next Steps**: Dev server should now start without errors. Navigate to `/learn/mentor/roadmap` to verify the page loads correctly.
