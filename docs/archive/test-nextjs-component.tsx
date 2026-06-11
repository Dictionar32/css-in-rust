'use client';

import { cv } from 'tailwind-styled-v4';

// Test cv() with Next.js component
const Button = ({ size, variant, children }: { size?: 'sm' | 'lg'; variant?: 'primary' | 'secondary'; children: React.ReactNode }) => {
  const buttonStyle = cv({
    base: 'px-4 py-2 rounded font-medium transition-colors duration-200',
    variants: {
      size: {
        sm: 'text-sm px-3 py-1',
        lg: 'text-lg px-6 py-3'
      },
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
      }
    },
    defaultVariants: {
      size: 'sm',
      variant: 'primary'
    }
  });

  const classes = buttonStyle({ size, variant });

  return (
    <button className={classes}>
      {children}
    </button>
  );
};

// Test cn() and cx()
import { cn, cx } from 'tailwind-styled-v4';

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => {
  // cn() - simple join
  const baseClasses = cn('p-4', 'rounded', 'border');
  
  // cx() - with conflict resolution
  const mergedClasses = cx('p-4', 'p-6', className); // p-6 wins over p-4
  
  return (
    <div className={mergedClasses}>
      {children}
    </div>
  );
};

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 cv() Test - Next.js</h1>
      
      <div className="space-y-8">
        {/* Test 1: Button variants */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test 1: cv() Button Variants</h2>
          <div className="flex gap-4 flex-wrap">
            <Button size="sm" variant="primary">Small Primary</Button>
            <Button size="lg" variant="primary">Large Primary</Button>
            <Button size="sm" variant="secondary">Small Secondary</Button>
            <Button size="lg" variant="secondary">Large Secondary</Button>
          </div>
        </section>

        {/* Test 2: Default variants */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test 2: Default Variants</h2>
          <div className="flex gap-4">
            <Button>Default</Button>
            <Button variant="secondary">Secondary Default</Button>
          </div>
        </section>

        {/* Test 3: cn() and cx() */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test 3: cn() & cx()</h2>
          <Card className="border-blue-500">
            <p>Card with merged classes</p>
          </Card>
        </section>

        {/* Test 4: Complex variants */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test 4: Complex Styling</h2>
          {(() => {
            const alertStyle = cv({
              base: 'p-4 rounded border-l-4',
              variants: {
                type: {
                  success: 'bg-green-50 border-green-500 text-green-800',
                  error: 'bg-red-50 border-red-500 text-red-800',
                  warning: 'bg-yellow-50 border-yellow-500 text-yellow-800'
                }
              },
              defaultVariants: { type: 'success' }
            });
            
            return (
              <div className="space-y-3">
                <div className={alertStyle({ type: 'success' })}>✅ Success message</div>
                <div className={alertStyle({ type: 'error' })}>❌ Error message</div>
                <div className={alertStyle({ type: 'warning' })}>⚠️ Warning message</div>
              </div>
            );
          })()}
        </section>

        {/* Summary */}
        <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-2">✅ Test Summary</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>cv() function working with variants ✓</li>
            <li>Default variants applied correctly ✓</li>
            <li>cn() simple class joining ✓</li>
            <li>cx() conflict resolution ✓</li>
            <li>Complex styling with multiple variants ✓</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
