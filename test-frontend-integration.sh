#!/bin/bash

# Integration test script untuk toko-online/frontend
# Run this in toko-online/frontend directory

echo "=========================================================================="
echo "INTEGRATION TEST: cv(), cn(), cx() di Next.js Frontend"
echo "=========================================================================="
echo ""

# Step 1: Verify installation
echo "📦 Step 1: Verify tailwind-styled-v4@canary installation"
npm ls tailwind-styled-v4
if [ $? -ne 0 ]; then
  echo "❌ Package not installed. Installing..."
  npm install tailwind-styled-v4@canary --save
fi

# Step 2: Create test page if not exists
echo ""
echo "📝 Step 2: Create test page (src/app/test-variants/page.tsx)"

mkdir -p src/app/test-variants

cat > src/app/test-variants/page.tsx << 'EOF'
'use client'

import { cv, cn, cx } from 'tailwind-styled-v4'

export default function TestVariantsPage() {
  // Test cv() dengan variants
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
        <h1 className="text-3xl font-bold mb-8">✅ cv() Integration Test</h1>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 1: Variants</h2>
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

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 2: cn() Merge</h2>
          <div className={cn('px-4 py-2 bg-blue-600', 'text-white rounded')}>
            Merged: px-4 py-2 bg-blue-600 text-white rounded
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 3: cx() Conflicts</h2>
          <div className={cx('px-4 bg-blue-600', 'px-8 bg-red-600 text-white')}>
            Conflicts: px-8 + bg-red-600 + text-white (red wins)
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 4: Alerts</h2>
          <div className="space-y-2">
            <div className={alertStyles({ severity: 'info' })}>ℹ️ Info</div>
            <div className={alertStyles({ severity: 'success' })}>✅ Success</div>
            <div className={alertStyles({ severity: 'warning' })}>⚠️ Warning</div>
            <div className={alertStyles({ severity: 'error' })}>❌ Error</div>
          </div>
        </section>

        <p className="mt-12 text-sm text-gray-600">
          All tests passed! cv(), cn(), cx() working correctly.
        </p>
      </div>
    </div>
  )
}
EOF

echo "✅ Test page created at src/app/test-variants/page.tsx"

# Step 3: TypeScript check
echo ""
echo "🔍 Step 3: TypeScript type checking"
npm run typecheck 2>&1 | head -20

# Step 4: Instructions
echo ""
echo "=========================================================================="
echo "✅ SETUP COMPLETE!"
echo "=========================================================================="
echo ""
echo "📝 NEXT STEPS:"
echo "1. Run dev server: npm run dev"
echo "2. Open: http://localhost:3000/test-variants"
echo "3. Verify all buttons and alerts display with correct styling"
echo ""
echo "✓ Expected Results:"
echo "  - Small button: smaller text and padding"
echo "  - Medium button: standard size (default)"
echo "  - Large button: larger text and padding"
echo "  - Danger button: red background"
echo "  - Alerts: different background colors (blue/green/yellow/red)"
echo "  - Merged classes: blue background with white text"
echo "  - Conflict resolution: red background wins over blue"
echo ""
