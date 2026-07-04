# 🔴 BUG REPORT: Sub-Component Nested Variants

## Status
**CRITICAL BUG FOUND** - `tw()` return value is OBJECT, not FUNCTION

## Test Results

### Test 1: Simple Card (no sub-component)
```javascript
const SimpleCard = tw.div({ base: "bg-white rounded-lg p-4" })
```

**Result:**
- ✅ Component created
- ❌ `typeof SimpleCard` = **"object"** (should be "function")
- ❌ Cannot call: `SimpleCard({ className: "test" })` → "SimpleCard is not a function"

### Test 2: Card with String Sub (works somehow)
```javascript
const CardWithSub = tw.div({
  base: "bg-white rounded-lg p-4",
  sub: {
    footer: "flex gap-2 mt-4 pt-4 border-t"
  }
})
```

**Result:**
- ✅ Component created
- ❌ `typeof CardWithSub` = **"object"** (should be "function")
- ✅ `typeof CardWithSub.footer` = **"function"** (correct)

### Test 3: Card with Nested Variants (after fix)
```javascript
const Card = tw.div({
  base: "bg-white rounded-lg p-4",
  sub: {
    footer: {
      base: "flex gap-2",
      variants: { layout: { horizontal: "...", vertical: "..." } }
    }
  }
})
```

**Result:**
- ✅ Component created
- ❌ `typeof Card` = **"object"** (should be "function")
- ✅ `Card.footer` created with `tw.div` (good after fix!)
- ❌ `typeof Card.footer` = **"object"** (sub-component should be function)

## Root Cause

**Issue**: `wrapWithSubProxy()` mengembalikan Proxy yang bukan callable

**Evidence**:
```
Card.displayName: tw.div  ← Component sudah terbuat
Card type: object         ← Tapi bukan function!
```

Component React.forwardRef seharusnya callable (function), tapi setelah di-wrap dengan Proxy, menjadi object dan tidak bisa di-call.

**Location**: Di `createComponent.ts` - fungsi `wrapWithSubProxy()` atau return statement di `createComponent`

## Impact

- ✅ Sub-component dengan nested variants STRUKTUR benar (akan work setelah bug ini diperbaiki)
- ❌ Tapi parent component tidak bisa di-render
- ❌ Semua component `tw()` jadi tidak bisa dipakai

## Files Affected

- `packages/domain/core/src/createComponent.ts` - line ~550+ (wrapWithSubProxy logic)

## Proposed Fix

Proxy wrapper perlu:
1. Forward `call` trap jika component dipanggil sebagai function
2. Atau return component langsung, bukan Proxy untuk simple case
3. Atau implement proper callable Proxy

## Tests Created

- `/home/annas-zen/Documents/css-in-rust/test-simple-card.mjs` - Test simple + with string sub
- `/home/annas-zen/Documents/css-in-rust/test-sub-variant-fixed.mjs` - Test nested variants
- `/home/annas-zen/Documents/css-in-rust/sub-variant-test-result.txt` - Results

## Next Steps

1. Investigate `wrapWithSubProxy()` logic
2. Fix Proxy to allow function calls
3. Test all component types
4. Verify sub-component nested variants work correctly
