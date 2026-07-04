const native = require('./native/index.js');

console.log('=== DEBUGGING cv() resolveVariants ISSUE ===\n');

// Test 1: Using snake_case (default_variants) - what Rust expects
const rsConfig = {
  base: 'px-4 py-2 rounded',
  variants: {
    size: { sm: 'text-sm px-2', lg: 'text-lg px-6' },
    color: { primary: 'bg-blue-500', secondary: 'bg-gray-200' }
  },
  default_variants: { size: 'sm', color: 'primary' }  // SNAKE_CASE
};

const rsProps = { size: 'lg', color: 'secondary' };

console.log('Rust config (snake_case default_variants):');
console.log(JSON.stringify(rsConfig, null, 2));

const result1 = native.resolveVariants(JSON.stringify(rsConfig), JSON.stringify(rsProps));
console.log('\nResult with snake_case:');
console.log(result1);
console.log('Expected classes: px-4 py-2 rounded text-lg px-6 bg-gray-200');
console.log('');

// Test 2: Just base
console.log('--- Test 2: Just base ---');
const baseConfig = {
  base: 'base-class'
};

const result2 = native.resolveVariants(JSON.stringify(baseConfig), JSON.stringify({}));
console.log('Base result:', result2);
console.log('Expected: base-class');
