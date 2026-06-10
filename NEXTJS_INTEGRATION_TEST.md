# Integration Test: cv(), cn(), cx() di Next.js Frontend

## Status
✅ **v5.0.11-canary.0.0.93** berhasil publish ke npm dengan tag `canary`
✅ **Installed** di toko-online/frontend

## Setup Steps

### 1. Install Package Terbaru
```bash
cd c:\Users\User\toko-online\frontend
npm install tailwind-styled-v4@canary --save
```

### 2. Buat Test Page
File: `src/app/test-variants/page.tsx`

```typescript
'use client'

import { cv, cn, cx } from 'tailwind-styled-v4'

export default function TestVariantsPage() {
  // Test 1: cv() dengan variants
  const buttonStyles = cv({
    base: 'px-4 py-2 rounded-md font-medium transition-colors',
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
      },
      size: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  })

  // Test 2: cv() dengan compound variants
  const alertStyles = cv({
    base: 'p-4 rounded-lg',
    variants: {
      severity: {
        info: 'bg-blue-50 text-blue-900 border border-blue-200',
        warning: 'bg-yellow-50 text-yellow-900 border border-yellow-200',
        error: 'bg-red-50 text-red-900 border border-red-200',
        success: 'bg-green-50 text-green-900 border border-green-200',
      },
    },
    defaultVariants: {
      severity: 'info',
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">cv() Integration Test</h1>

        {/* Test 1: Basic Variants */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 1: Basic Variants</h2>
          <div className="space-y-2">
            <button className={buttonStyles({ variant: 'primary', size: 'sm' })}>
              Small Primary
            </button>
            <button className={buttonStyles({ variant: 'secondary', size: 'md' })}>
              Medium Secondary
            </button>
            <button className={buttonStyles({ variant: 'danger', size: 'lg' })}>
              Large Danger
            </button>
            <button className={buttonStyles({})}>
              All Defaults
            </button>
          </div>
        </section>

        {/* Test 2: cn() - Class Merge */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 2: cn() Merge</h2>
          <div className="space-y-2">
            <div className={cn('px-4 py-2 bg-blue-600', 'text-white rounded')}>
              Merged Classes
            </div>
            <div
              className={cn(
                buttonStyles({ variant: 'primary' }),
                'ring-2 ring-blue-300'
              )}
            >
              Button + Ring
            </div>
          </div>
        </section>

        {/* Test 3: cx() - Conflict Resolution */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 3: cx() Conflicts</h2>
          <div className="space-y-2">
            <div
              className={cx('px-4 py-2 bg-blue-600', 'px-8 bg-red-600 text-white')}
            >
              bg-red-600 wins (conflicts resolved)
            </div>
          </div>
        </section>

        {/* Test 4: Alerts */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 4: Alerts</h2>
          <div className="space-y-2">
            <div className={alertStyles({ severity: 'info' })}>
              Info Alert
            </div>
            <div className={alertStyles({ severity: 'success' })}>
              Success Alert
            </div>
            <div className={alertStyles({ severity: 'warning' })}>
              Warning Alert
            </div>
            <div className={alertStyles({ severity: 'error' })}>
              Error Alert
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
```

### 3. Run Dev Server
```bash
npm run dev
```

### 4. Verify di Browser
- Open: http://localhost:3000/test-variants
- Check semua buttons render dengan styling benar
- Check alerts punya warna yang berbeda sesuai severity

## Browser Console Test

```javascript
// Import functions
import { cv, cn, cx } from 'tailwind-styled-v4'

// Test 1: cv() returns non-empty string
const styles = cv({
  base: 'px-4 py-2',
  variants: { size: { lg: 'text-lg' } }
})({ size: 'lg' })
console.log('cv() result:', styles)  // Expected: "px-4 py-2 text-lg"

// Test 2: cn() merge
const merged = cn('px-4', 'text-white')
console.log('cn() result:', merged)  // Expected: "px-4 text-white"

// Test 3: cx() conflict
const conflict = cx('bg-blue-600', 'bg-red-600')
console.log('cx() result:', conflict)  // Expected: "bg-red-600"
```

## Success Criteria

- ✅ All buttons visible dengan styling berbeda
- ✅ All alerts punya warna background berbeda
- ✅ No TypeScript errors: `npm run typecheck` → 0 errors
- ✅ No console errors di browser
- ✅ cv(), cn(), cx() return strings (not empty)
- ✅ defaultVariants applied automatically
- ✅ Props correctly override defaults

## Expected Results

| Test | Expected Output |
|------|-----------------|
| Small Primary | px-3 py-1.5 text-sm bg-blue-600 |
| Medium Secondary | px-4 py-2 text-base bg-gray-200 |
| Large Danger | px-6 py-3 text-lg bg-red-600 |
| All Defaults | px-4 py-2 text-base bg-blue-600 (primary + md) |
| Merged Classes | px-4 py-2 bg-blue-600 text-white rounded |
| Conflict Resolution | px-8 bg-red-600 text-white (px-8 + red wins) |
| Info Alert | bg-blue-50 border-blue-200 |
| Success Alert | bg-green-50 border-green-200 |
| Warning Alert | bg-yellow-50 border-yellow-200 |
| Error Alert | bg-red-50 border-red-200 |

## If Issues Occur

### cv() returns empty string
1. Check native binding loaded: `console.log(require('tailwind-styled-v4/native'))`
2. Check config JSON: `JSON.stringify(config)` valid
3. Clear cache: `rm -rf .next node_modules && npm install`

### TypeScript errors
1. Verify installation: `npm ls tailwind-styled-v4`
2. Run typecheck: `npm run typecheck`
3. Clear cache: `rm -rf node_modules .next && npm install`

### Colors not showing
1. Check Tailwind CSS configured correctly
2. Verify CSS builds: Check if `styles.css` generates
3. Check browser DevTools → Elements, inspect class attribute

## What Was Fixed

✅ **Root Cause (v92 → v93)**:
- Rust struct `VariantConfig` expected `default_variants` (snake_case)
- TypeScript sent `defaultVariants` (camelCase)
- Rust field `compound_variants` required but TS tidak send saat empty

✅ **Solution**:
- Added `#[serde(alias = "defaultVariants")]` to accept both camelCase + snake_case
- Added `#[serde(default)]` to `compound_variants` untuk handle missing field
- TypeScript wrapper convert field names sebelum kirim ke Rust (defensive)

## Package Info

- **Name**: tailwind-styled-v4
- **Version**: 5.0.11-canary.0.0.93
- **Tag**: canary
- **Size**: 7.7 MB gzipped
- **Functions**: 40 NAPI (20 CSS + 20 Redis Phase 4)

## Next Steps

1. ✅ Test di toko-online/frontend
2. Verify semua use cases works
3. If OK → bump ke stable version
4. Deploy ke production
