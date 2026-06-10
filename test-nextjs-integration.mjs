#!/usr/bin/env node
/**
 * Integration Test untuk cv(), cn(), cx() di Next.js Frontend
 * 
 * Instruksi untuk toko-online/frontend:
 * 1. Pastikan sudah install: npm install tailwind-styled-v4@canary --save
 * 2. Buat file: src/app/test-variants/page.tsx
 * 3. Copy component code di bawah ke file tersebut
 * 4. Run: npm run dev
 * 5. Buka: http://localhost:3000/test-variants
 * 
 * Expected hasil: Semua button menampilkan styling yang benar
 */

// ============================================================================
// STEP 1: Component Code untuk toko-online/frontend/src/app/test-variants/page.tsx
// ============================================================================

const ComponentCode = `
'use client'

import { cv, cn, cx } from 'tailwind-styled-v4'

export default function TestVariantsPage() {
  // Test 1: cv() dengan variants sederhana
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
      icon: {
        show: 'pl-10',
        hide: 'pl-4',
      },
    },
    defaultVariants: {
      severity: 'info',
      icon: 'hide',
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
            <button className={buttonStyles({ size: 'md' })}>
              Default Variant + Custom Size
            </button>
            <button className={buttonStyles({})}>
              All Defaults
            </button>
          </div>
        </section>

        {/* Test 2: cn() - Class Name Merge */}
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
              Button + Additional Ring
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
              Larger Padding + Red Background (Red wins)
            </div>
            <div
              className={cx(
                'text-sm font-normal',
                'text-lg font-bold',
                'text-gray-900'
              )}
            >
              Text Size & Weight Conflict (lg + bold wins)
            </div>
          </div>
        </section>

        {/* Test 4: Alerts with Alerts Variants */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 4: Alert Variants</h2>
          <div className="space-y-2">
            <div className={alertStyles({ severity: 'info' })}>
              ℹ️ Information Alert
            </div>
            <div className={alertStyles({ severity: 'success' })}>
              ✅ Success Alert
            </div>
            <div className={alertStyles({ severity: 'warning' })}>
              ⚠️ Warning Alert
            </div>
            <div className={alertStyles({ severity: 'error' })}>
              ❌ Error Alert
            </div>
          </div>
        </section>

        {/* Test 5: Default Variants Override */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 5: Override Defaults</h2>
          <div className="space-y-2">
            <div className={alertStyles({ severity: 'info', icon: 'hide' })}>
              Info with no icon (default)
            </div>
            <div className={alertStyles({ severity: 'warning', icon: 'show' })}>
              Warning with icon (overridden)
            </div>
          </div>
        </section>

        {/* Test 6: Complex Styling */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 6: Complex Cases</h2>
          <div className="space-y-4">
            <button
              className={cn(
                buttonStyles({ variant: 'primary', size: 'lg' }),
                'w-full'
              )}
            >
              Full Width Primary Button
            </button>
            <div
              className={cx(
                'px-4 py-2 rounded',
                buttonStyles({ variant: 'secondary' }),
                'border-2 border-gray-400'
              )}
            >
              Styled div with button classes + border
            </div>
          </div>
        </section>

        {/* Test 7: ClassName Prop */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Test 7: className Prop</h2>
          <button
            className={cn(
              buttonStyles({ variant: 'primary' }),
              'shadow-lg hover:shadow-xl'
            )}
          >
            Button with Custom className Prop
          </button>
        </section>
      </div>
    </div>
  )
}
`;

// ============================================================================
// STEP 2: Test Cases untuk verify di console
// ============================================================================

const TestCases = {
  test_cv_simple: {
    name: 'cv() - Simple Variants',
    code: 'buttonStyles({ variant: "primary", size: "md" })',
    expected: 'Contains: px-4, py-2, bg-blue-600, text-white, rounded-md',
  },
  test_cv_defaults: {
    name: 'cv() - Using Defaults',
    code: 'buttonStyles({})',
    expected: 'Should use variant:primary + size:md (defaults)',
  },
  test_cv_override: {
    name: 'cv() - Override Defaults',
    code: 'buttonStyles({ size: "lg" })',
    expected: 'variant=primary (default) + size=lg (override)',
  },
  test_cn_merge: {
    name: 'cn() - Merge Classes',
    code: 'cn("px-4 py-2", "text-white rounded")',
    expected: 'All classes combined: px-4 py-2 text-white rounded',
  },
  test_cx_conflict: {
    name: 'cx() - Conflict Resolution',
    code: 'cx("bg-blue-600", "bg-red-600")',
    expected: 'bg-red-600 wins (last one)',
  },
};

// ============================================================================
// STEP 3: Manual Testing Instructions
// ============================================================================

const Instructions = \`
SETUP INSTRUCTIONS:
===================

1. Di toko-online/frontend, install package terbaru:
   $ npm install tailwind-styled-v4@canary --save

2. Buat file baru: src/app/test-variants/page.tsx
   Copy paste ComponentCode di atas ke file tersebut

3. Run dev server:
   $ npm run dev

4. Buka browser: http://localhost:3000/test-variants

5. Verify semua styling muncul dengan benar:
   ✅ Buttons dengan variant dan size yang berbeda
   ✅ Alert dengan severity warna yang berbeda
   ✅ cn() merge classes
   ✅ cx() conflict resolution
   ✅ Default variants applied correctly

MANUAL TEST CHECKLIST:
======================

[ ] Small Primary button: px-3 py-1.5 text-sm bg-blue-600
[ ] Medium Secondary button: px-4 py-2 text-base bg-gray-200
[ ] Large Danger button: px-6 py-3 text-lg bg-red-600
[ ] Info Alert: bg-blue-50 border-blue-200
[ ] Success Alert: bg-green-50 border-green-200
[ ] Warning Alert: bg-yellow-50 border-yellow-200
[ ] Error Alert: bg-red-50 border-red-200
[ ] Merged classes: button + ring-2 ring-blue-300
[ ] Conflict resolution: correct color/padding wins
[ ] Full width button: w-full applied

TYPESCRIPT VALIDATION:
======================

Verify no TypeScript errors:
$ npm run typecheck

Expected: 0 errors

NATIVE BINDING CHECK:
======================

Di browser console, import dan test:
import { cv, cn, cx } from 'tailwind-styled-v4'

// Test cv() returns string (not empty)
const styles = cv({
  base: 'px-4',
  variants: { size: { lg: 'text-lg' } }
})({ size: 'lg' })
console.log('cv() result:', styles)  // Should print: "px-4 text-lg"

// Test cn()
const merged = cn('px-4', 'text-white')
console.log('cn() result:', merged)  // Should print: "px-4 text-white"

// Test cx()
const conflict = cx('bg-blue-600', 'bg-red-600')
console.log('cx() result:', conflict)  // Should print: "bg-red-600"

SUCCESS CRITERIA:
=================

✅ All buttons render with correct styles
✅ All alerts show correct colors
✅ No TypeScript errors
✅ No console errors
✅ Native binding works (classes returned, not empty)
✅ cv(), cn(), cx() return expected strings
✅ defaultVariants applied automatically
✅ Props override defaults correctly

DEBUGGING:
==========

If cv() returns empty string:
1. Check native binding is loaded: console.log(require('tailwind-styled-v4/native'))
2. Check config JSON is valid
3. Check Rust function resolve_variants is callable
4. Check package.json has correct optionalDependencies

If TypeScript errors in page.tsx:
1. Verify installed: npm ls tailwind-styled-v4
2. Clear node_modules: rm -rf node_modules && npm install
3. Regenerate types: npm run typecheck

\`;

console.log('='.repeat(80));
console.log('INTEGRATION TEST: cv(), cn(), cx() in Next.js');
console.log('='.repeat(80));
console.log('\n📋 SETUP INSTRUCTIONS:\n');
console.log(Instructions);

console.log('\n📝 TEST CASES:\n');
Object.entries(TestCases).forEach(([key, test]) => {
  console.log(\`  \${test.name}\);
  console.log(\`  Code: \${test.code}\);
  console.log(\`  Expected: \${test.expected}\);
  console.log();
});

console.log('='.repeat(80));
console.log('✅ Instructions generated. Copy to toko-online/frontend and follow steps.');
console.log('='.repeat(80));
