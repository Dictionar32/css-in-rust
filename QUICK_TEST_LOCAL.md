# Quick Local Testing with npm link

## Step 1: Verify npm link is Active

```bash
npm ls -g tailwind-styled-v4
# Should show: tailwind-styled-v4@5.0.11-canary.0.0.91 (linked)
```

## Step 2: Create Test Project

```bash
mkdir ../test-tailwind-styled
cd ../test-tailwind-styled
npm init -y
npm install typescript
npm link tailwind-styled-v4
```

## Step 3: Create TypeScript Test File

**test-tailwind-styled/test.ts**
```typescript
import {
  parseClass,
  compileClass,
  compileToCss,
  native_api,
  // Redis functions (Phase 4)
} from 'tailwind-styled-v4'
import redis from 'tailwind-styled-v4'

console.log('=== CSS Parsing ===')
const parsed = parseClass('md:hover:bg-blue-600/50')
console.log('Parsed:', parsed)
// Output: { variants: ["md", "hover"], prefix: "bg", value: "blue-600", modifier: "50" }

console.log('\n=== CSS Compilation ===')
const rule = compileClass('bg-blue-600')
console.log('Rule:', rule)
// Output: { selector: ".bg-blue-600", property: "background-color", value: "#2563eb", variants: [] }

console.log('\n=== CSS to String ===')
const css = compileToCss('md:hover:bg-blue-600')
console.log('CSS:', css)
// Output: @media (min-width: 768px) { ... }

console.log('\n=== Redis Connection (Phase 4) ===')
try {
  // Initialize Redis connection pool
  const poolResult = redis.poolConnect('localhost', 6379, 10)
  console.log('Pool Connect:', poolResult)

  // Set a value
  const setResult = redis.set('test-key', 'test-value', 3600)
  console.log('Set Result:', setResult)

  // Get the value
  const getValue = redis.get('test-key')
  console.log('Get Result:', getValue)

  // Check pool stats
  const stats = redis.poolStats()
  console.log('Pool Stats:', stats)

  // Get cache hit rate
  const hitRate = redis.cacheHitRate()
  console.log('Cache Hit Rate:', hitRate)
} catch (error) {
  console.error('Redis error (expected if Redis not running):', error)
}

console.log('\n=== Native API (Advanced) ===')
const nativeRules = native_api.compileClasses(['bg-blue-600', 'text-white', 'p-4'])
console.log('Native compilation result keys:', nativeRules)

console.log('\n✅ All tests completed!')
```

## Step 4: Run Test

```bash
# Compile TypeScript
npx tsc test.ts --lib es2024,dom --skipLibCheck --esModuleInterop --target es2024

# Run the test
node test.js
```

## Expected Output

```
=== CSS Parsing ===
Parsed: {
  variants: [ 'md', 'hover' ],
  prefix: 'bg',
  value: 'blue-600',
  modifier: '50'
}

=== CSS Compilation ===
Rule: {
  selector: '.bg-blue-600',
  property: 'background-color',
  value: '#2563eb',
  variants: []
}

=== CSS to String ===
CSS: .bg-blue-600 { background-color: #2563eb; }

=== Redis Connection (Phase 4) ===
Pool Connect: { success: true, pool_size: 10, ... }
Set Result: { success: true, ... }
Get Result: "test-value"
Pool Stats: { active: 1, idle: 9, ... }
Cache Hit Rate: 0.0

=== Native API (Advanced) ===
Native compilation result keys: [ ... ]

✅ All tests completed!
```

## If You Have Redis Running Locally

```bash
# Start Redis (macOS/Linux)
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:latest

# Then the Redis functions will work fully without try-catch
```

## For E-commerce Integration Testing

Link the package in your e-commerce project:

```bash
# In your e-commerce project
npm link tailwind-styled-v4

# Then use in your app
import { compileClass, redis } from 'tailwind-styled-v4'

const cssRule = compileClass('bg-gradient-to-r from-blue-600 to-purple-600')
const cached = redis.set('css-cache-key', JSON.stringify(cssRule), 3600)
```

## Troubleshooting

### "Cannot find module 'tailwind-styled-v4'"
- Verify: `npm ls -g tailwind-styled-v4` shows (linked)
- Re-link: `npm link` in css-in-rust, then `npm link tailwind-styled-v4` in test project

### TypeScript errors with NAPI functions
- Ensure `typescript` is installed: `npm install typescript`
- Check tsconfig has `skipLibCheck: true`

### Redis functions not working
- Expected if Redis server is not running
- Error is caught in try-catch in example above
- Install Redis or use Docker: `docker run -d -p 6379:6379 redis:latest`

---

## Next: Publish to npm

Once local testing is complete and verified:

```bash
# Beta release for remote testing
npm version prerelease --preid=beta
npm publish --tag beta

# Others can then install
npm install tailwind-styled-v4@beta
```
