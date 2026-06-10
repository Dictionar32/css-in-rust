# Troubleshooting Guide - Rust CSS Compiler Engine

**Version**: 1.0  
**Last Updated**: June 9, 2026

---

## Quick Diagnostics

### Enable Debug Logging

```bash
# Enable all compiler debugging
DEBUG=compiler npm run dev

# Enable native binding debugging  
DEBUG=compiler:native npm run dev

# View detailed logs
DEBUG=compiler,compiler:native node app.js
```

### Check Native Binding Status

```bash
# Test if native binding loads
node -e "require('@tailwind-styled/compiler').getNativeBridge()"

# If it fails, you'll see detailed error messages
# If it succeeds, native binding is working
```

---

## Common Issues and Solutions

### 1️⃣ Native Binding Not Found

#### Error Message
```
Error: FATAL: Native binding 'generateCssNative' is required but not available.
This package requires native Rust bindings. There is no JavaScript fallback.
```

#### Root Causes
- Binary not compiled
- NAPI version mismatch  
- Platform mismatch
- Installation incomplete

#### Solutions

**Solution A: Rebuild Binary**
```bash
# Full clean rebuild
npm run clean
npm run build:rust

# Verify binary exists
ls -la native/target/release/*.node
```

**Solution B: Verify Platform Compatibility**
```bash
# Check current platform
node -p "process.platform + '/' + process.arch"

# Expected: win32/x64, linux/x64, darwin/x64, darwin/arm64

# If architecture mismatch, rebuild for your platform:
npm run build:rust  # Uses current platform
```

**Solution C: Check Node.js Version**
```bash
node --version  # Should be v14+

# NAPI 4 support:
# - Node.js 12+: NAPI 7
# - Node.js 14+: NAPI 7
# - Node.js 16+: NAPI 8 (recommended)
# - Node.js 18+: NAPI 9

# If too old, update Node.js
nvm install 18
nvm use 18
```

**Solution D: Verify npm Installation**
```bash
# Check if module installed
npm ls tailwind-styled-v5

# If missing, reinstall
npm install
npm run build:rust

# For fresh install
npm install --force --verbose
```

---

### 2️⃣ Fallback to JavaScript Triggered

#### Warning Message
```
[Compiler] Rust compiler failed, using JavaScript Tailwind: ...
```

#### Causes
- Invalid theme JSON
- Unsupported class syntax
- NAPI bridge crash
- Memory issue

#### Solutions

**Solution A: Validate Theme Object**
```typescript
// Bad - circular reference
const theme = { colors: {} }
theme.colors.self = theme  // Circular!

// Good - plain objects only
const theme = {
  colors: { blue: { "600": "#1e40af" } },
  spacing: { "4": "1rem" }
}

// Test JSON serialization
try {
  const json = JSON.stringify(theme)
  console.log("Theme is JSON-serializable ✓")
} catch (e) {
  console.error("Theme is not JSON-serializable:", e.message)
}
```

**Solution B: Check Class Syntax**
```typescript
// Valid Tailwind classes
const valid = [
  "px-4",
  "hover:bg-blue-600",
  "md:hover:bg-blue/50",
  "[width:200px]",
  "group-hover:text-red-500"
]

// Invalid (will trigger fallback)
const invalid = [
  "px-4-extra",          // Unknown modifier
  "unknown:hover",       // Invalid variant
  "[invalid css]",       // Malformed arbitrary
  "bg-blue-invalid"      // Unknown value
]
```

**Solution C: Enable Debug Logging**
```typescript
const css = await generateCssNative(classes, {
  theme,
  fallbackToJs: true,
  logFallback: true  // ← Logs the actual error
})

// Check console for error details
```

**Solution D: Check Browser/System Memory**
```bash
# Monitor system memory
free -h              # Linux
Get-Process | Measure -Property Memory  # Windows
vm_stat              # macOS

# If memory < 500MB available, increase swap/memory
```

---

### 3️⃣ Cache Not Clearing

#### Symptom
```
Theme updated but old values still used
Config changed but styles didn't update
```

#### Root Cause
LRU cache holding stale values

#### Solution

**Solution A: Manual Cache Clear**
```typescript
import { clearThemeCache } from "@tailwind-styled/compiler"

// After config change
clearThemeCache()

// Then recompile
const css = await generateCssNative(classes, { theme: newTheme })
```

**Solution B: Auto-clear on Config Change**
```typescript
// Watch for config changes
import chokidar from "chokidar"

let currentTheme = loadThemeConfig()

chokidar.watch("tailwind.config.ts").on("change", async () => {
  clearThemeCache()  // ← Auto-clear on change
  currentTheme = loadThemeConfig()
  console.log("Theme reloaded, cache cleared")
})
```

**Solution C: Per-Build Clear**
```bash
# Clear before each build
npm run build && npm run clear-cache

# Or script
"build": "npm run clear-cache && npm run build:css"
```

---

### 4️⃣ Performance Degradation

#### Symptom
```
Slower than expected (>120ms for 100 classes)
```

#### Diagnosis Steps

**Step 1: Check Cache Hit Rate**
```typescript
import { getCacheStats } from "@tailwind-styled/compiler"

const stats = getCacheStats()
const hitRate = stats.hits / (stats.hits + stats.misses)
console.log(`Cache hit rate: ${(hitRate * 100).toFixed(1)}%`)

// Expected: 60-80% in steady state
// If < 50%: Cache is cold or theme frequently changes
// If 0%: Cache not working (investigate)
```

**Step 2: Profile with Chrome DevTools**
```typescript
// Add timing markers
console.time("generate-css")
const css = await generateCssNative(classes, { theme })
console.timeEnd("generate-css")

// In Chrome DevTools:
// 1. Open Performance tab
// 2. Record
// 3. Run your code
// 4. Stop and analyze timeline
```

**Step 3: Check System Load**
```bash
# Linux/macOS
top -bn1 | head -n 20

# Windows
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# If system load high, performance degradation expected
```

#### Solutions

**If Cache Hit Rate Low (<50%)**

```typescript
// Problem: New theme each compilation
// Solution: Reuse theme object

// BAD - creates new theme every time
async function compileCss(classes) {
  const theme = JSON.parse(fs.readFileSync("theme.json"))
  return generateCssNative(classes, { theme })
}

// GOOD - reuse theme
let cachedTheme = null
async function compileCss(classes) {
  if (!cachedTheme) {
    cachedTheme = JSON.parse(fs.readFileSync("theme.json"))
  }
  return generateCssNative(classes, { theme: cachedTheme })
}
```

**If Cache Enabled but Still Slow**

```typescript
// Likely system load or network latency
// Reduce load:

// 1. Batch compile (50 files at once vs 1 per request)
const allClasses = files.flatMap(f => f.classes)
const css = await generateCssNative(allClasses, { theme })

// 2. Use async/await properly (don't await in loop)
// BAD
for (const file of files) {
  const css = await generateCssNative(file.classes, { theme })
}

// GOOD
const promises = files.map(f => generateCssNative(f.classes, { theme }))
const results = await Promise.all(promises)
```

**If System Load High**

```bash
# Reduce concurrent compilations
# Implement queue:

import PQueue from "p-queue"

const queue = new PQueue({ concurrency: 2 })  // Max 2 parallel

// Queue compilations instead of running all at once
await queue.add(() => generateCssNative(classes, { theme }))
```

---

### 5️⃣ Memory Leak

#### Symptom
```
Memory usage keeps increasing over time
Process crashes after many compilations
```

#### Root Cause
- Unclearedcache
- Circular references in theme
- NAPI leak

#### Solutions

**Solution A: Limit Cache Size**
```typescript
// Current: 1000 entries max
// If memory is tight, compile with smaller theme

// Use only necessary theme values
const theme = {
  colors: selectUsedColors(fullTheme),
  spacing: selectUsedSpacing(fullTheme),
}

// Clear cache periodically
setInterval(() => clearThemeCache(), 30 * 60 * 1000)  // Every 30 min
```

**Solution B: Monitor Memory**
```typescript
// Add memory monitoring
setInterval(() => {
  const mem = process.memoryUsage()
  console.log({
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`
  })
}, 10 * 1000)  // Every 10 sec
```

**Solution C: Verify Theme Cleanup**
```typescript
// Check for circular references
const hasCircular = (obj, visited = new Set()) => {
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null) {
      if (visited.has(value)) return true
      visited.add(value)
      if (hasCircular(value, visited)) return true
    }
  }
  return false
}

console.log("Theme has circular refs:", hasCircular(theme))
```

---

### 6️⃣ Type Mismatch in TypeScript

#### Error
```
Type 'string' is not assignable to type 'Theme'
Property 'colors' is missing
```

#### Solution

```typescript
import { CssGeneratorOptions } from "@tailwind-styled/compiler"

// Correct type
const options: CssGeneratorOptions = {
  theme: {  // ← Must match theme structure
    colors: { blue: { "600": "#1e40af" } },
    spacing: { "4": "1rem" }
  }
}

// Or use required type
import type { ThemeConfig } from "@tailwind-styled/compiler"

const theme: ThemeConfig = {
  colors: {},
  spacing: {},
  breakpoints: {},
  // ... other required fields
}
```

---

### 7️⃣ NAPI Version Mismatch

#### Error
```
Error: The module at <path> was compiled against a different Node version using NODE_MODULE_VERSION X.
This version of Node requires NODE_MODULE_VERSION Y.
```

#### Solution

```bash
# Option 1: Rebuild for current Node version
npm run build:rust

# Option 2: Use correct Node version
nvm install 18  # Or appropriate version
nvm use 18

# Option 3: Clear and reinstall node_modules
rm -rf node_modules
npm install

# Verify version match
node --version
npm run build:rust
```

---

## Advanced Debugging

### Enable Rust Debug Output

```bash
# Set RUST_LOG environment variable
RUST_LOG=debug npm run dev

# More detailed
RUST_LOG=trace npm run dev

# Specific module
RUST_LOG=tailwind_styled_parser::application::class_parser=debug npm run dev
```

### Capture NAPI Error Details

```typescript
try {
  const css = await generateCssNative(classes, { theme })
} catch (error) {
  console.error("Full error details:")
  console.error(JSON.stringify(error, null, 2))
  console.error("Stack:", error.stack)
  console.error("Code:", error.code)
}
```

### Run Unit Tests

```bash
# Test Rust compiler directly
cd native
cargo test --lib

# Expected: 439/439 tests passing

# If tests fail, investigate specific test output
cargo test --lib -- --nocapture
```

### Performance Profiling

```typescript
// Detailed timing breakdown
console.time("total")
console.time("parse")
const classes = await parseClasses(input)
console.timeEnd("parse")

console.time("generate")
const css = await generateCssNative(classes, { theme })
console.timeEnd("generate")
console.timeEnd("total")

// Output:
// parse: 10.5ms
// generate: 85.2ms
// total: 95.7ms
```

---

## Getting Help

If you've exhausted these troubleshooting steps:

1. **Collect Diagnostic Info**
   ```bash
   node --version
   npm --version
   npm ls | grep tailwind-styled
   DEBUG=compiler:native node -e "require('@tailwind-styled/compiler').getNativeBridge()"
   ```

2. **Create Minimal Reproduction**
   ```typescript
   const { generateCssNative } = require("@tailwind-styled/compiler")
   
   generateCssNative(["px-4"], {
     theme: { colors: { blue: { "600": "#1e40af" } } }
   }).then(css => console.log(css))
   ```

3. **Report Issue**
   - Include Node version, OS, architecture
   - Include minimal reproduction code
   - Include debug output (DEBUG=compiler:native)
   - Include error stack trace

---

## Performance Tuning Checklist

- [ ] Cache hit rate > 60%
- [ ] Average compile time < 100ms per 100 classes
- [ ] Memory usage stable (not growing over time)
- [ ] No JavaScript fallback triggered
- [ ] Tests passing (439/439)
- [ ] No TypeScript errors

---

**Guide Version**: 1.0  
**Last Updated**: June 9, 2026  
**Status**: Production-Ready
