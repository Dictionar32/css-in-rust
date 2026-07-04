# Test: Numeric Variant Type Inference Fix

## Goal
Verify that the library fix for numeric variant type narrowing works correctly. 

## Test Case 1: Numeric Variants (from boolean-variants.md)

### Component Definition (CORRECT)
```typescript
const Alert = tw.div({
  variants: {
    severity: {
      0: "bg-blue-100",
      1: "bg-yellow-100", 
      2: "bg-red-100"
    }
  },
  defaultVariants: { severity: 0 }  // ✅ Number 0, NOT "0"
})
```

### Usage (CORRECT)
```typescript
<Alert severity={0} />     // ✅ Number
<Alert severity={1} />     // ✅ Number
<Alert severity={severity} />  // ✅ Variable of type number
```

### Usage (WRONG - what example app is doing)
```typescript
<Alert severity="0" />     // ❌ String, should be number
<Alert severity="1" />     // ❌ String, should be number
```

## Current Status in Example App

The box-model/page.tsx file has errors like:
```
Type '"0" | "1" | "2"' is not assignable to type '0 | 1 | 2'
Type '"0"' is not assignable to type '0 | 1 | 2'
```

This means:
1. Variant keys are defined as numbers: `0:`, `1:`, `2:` ✅
2. But JSX usage passes strings: `size="0"`, `size="1"` ❌
3. OR the library still isn't reading numeric keys correctly

## Root Cause Analysis

### Possibility 1: Variant Definition Issue
The example uses string keys but should use numeric keys:
```typescript
// WRONG
const Component = tw.div({
  variants: {
    size: {
      "0": "...",   // ❌ String key
      "1": "...",
    }
  }
})

// RIGHT
const Component = tw.div({
  variants: {
    size: {
      0: "...",     // ✅ Numeric key
      1: "...",
    }
  }
})
```

### Possibility 2: Library Type Inference Still Broken
Even though types.ts has the fix, maybe TypeScript isn't properly narrowing numeric literal types from the Object.keys() call.

## Test Plan

1. Create minimal reproduction component with numeric variants
2. Verify types.ts fix works with that component
3. If it works, the example file has APPLICATION bugs (wrong variant definitions)
4. If it fails, the library types need further fixing

## Next Steps

1. Run `npm run build:packages` to ensure library rebuild
2. Create minimal test component
3. Check if numeric variant types work
4. Then systematically fix example app
