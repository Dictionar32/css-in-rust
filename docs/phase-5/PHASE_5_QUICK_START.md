# Phase 5: Quick Start Guide - Using Native Rust Functions

**For**: Developers integrating Phase 5 functions into their code
**Status**: ✅ Production Ready
**Last Updated**: June 11, 2026

---

## 🚀 Quick Import

```typescript
// Import scanner functions
import {
  scanWorkspace,
  extractClassesFromSourceNative,
  type ScanWorkspaceResult,
} from '@tailwind-styled/compiler'

// Import analyzer functions
import {
  detectDeadCode,
  analyzeClassUsageNative,
  type DeadCodeResult,
} from '@tailwind-styled/compiler'

// Import compilation functions
import {
  compileCssNative2,
  generateStaticStateCssNative,
  type ContainerConfig,
} from '@tailwind-styled/compiler'
```

---

## 📋 Scanner Functions

### 1. Scan Entire Workspace
```typescript
import { scanWorkspace, type ScanWorkspaceResult } from '@tailwind-styled/compiler'

const result: ScanWorkspaceResult = scanWorkspace(
  './src',           // root directory
  ['.tsx', '.ts']    // file extensions (optional)
)

console.log(result)
// {
//   files: ['src/App.tsx', 'src/Button.tsx', ...],
//   total_files: 42,
//   classes: ['px-4', 'bg-blue-600', ...],
//   unique_classes: 156,
//   duration_ms: 234,
//   errors: []
// }
```

### 2. Extract Classes from Source
```typescript
import { extractClassesFromSourceNative } from '@tailwind-styled/compiler'

const source = `
  <div className="px-4 hover:bg-blue-600 md:text-lg">
    Hello World
  </div>
`

const classes: string[] = extractClassesFromSourceNative(source)
// Result: ['px-4', 'hover:bg-blue-600', 'md:text-lg']
```

### 3. Batch Extract from Multiple Files
```typescript
import { batchExtractClassesNative, type BatchExtractResult } from '@tailwind-styled/compiler'

const files = [
  'src/components/Button.tsx',
  'src/components/Card.tsx',
  'src/pages/Home.tsx'
]

const results: BatchExtractResult[] = batchExtractClassesNative(files)

results.forEach(result => {
  console.log(`${result.file}: ${result.classes.length} classes found`)
  if (result.error) console.error(`Error: ${result.error}`)
})
```

### 4. Check Against Safelist
```typescript
import { checkAgainstSafelistNative, type SafelistCheckResult } from '@tailwind-styled/compiler'

const classes = ['px-4', 'bg-red-500', 'custom-class']
const safelist = ['px-4', 'bg-red-500', 'bg-blue-600']

const result: SafelistCheckResult = checkAgainstSafelistNative(classes, safelist)

console.log(result)
// {
//   matched: ['px-4', 'bg-red-500'],
//   unmatched: ['custom-class'],
//   safelistSize: 3
// }
```

### 5. Scan Single File
```typescript
import { scanFile, type ScanFileResult } from '@tailwind-styled/compiler'

const result: ScanFileResult = scanFile('src/App.tsx')

console.log(result)
// {
//   file: 'src/App.tsx',
//   classes: ['px-4', 'hover:bg-blue-600', ...],
//   class_count: 24,
//   has_tw_usage: true,
//   size_bytes: 2048,
//   duration_ms: 45
// }
```

---

## 🔍 Analyzer Functions

### 1. Detect Dead CSS
```typescript
import { detectDeadCode, type DeadCodeResult } from '@tailwind-styled/compiler'

const scanResult = { /* from scanWorkspace */ }
const generatedCss = `.px-4 { padding: 0 1rem; } ...`

const result: DeadCodeResult = detectDeadCode(
  JSON.stringify(scanResult),
  generatedCss
)

console.log(result)
// {
//   deadInCss: ['hidden', 'sr-only', 'deprecated-class'],
//   deadInSource: [],
//   liveClasses: ['px-4', 'bg-blue-600', ...],
//   totalCssClasses: 156,
//   totalSourceClasses: 142
// }
```

### 2. Analyze Class Usage
```typescript
import { analyzeClassUsageNative, type ClassUsageItem } from '@tailwind-styled/compiler'

const classes = ['px-4', 'bg-blue-600', 'hover:opacity-80']
const scanResult = { /* workspace scan result */ }
const css = `.px-4 { ... } ...`

const usage: ClassUsageItem[] = analyzeClassUsageNative(
  classes,
  JSON.stringify(scanResult),
  css
)

usage.forEach(item => {
  console.log(`${item.className}: used in ${item.usageCount} places`)
  console.log(`  Is dead code: ${item.isDeadCode}`)
  console.log(`  Bundle impact: ${item.bundleSizeBytes} bytes`)
})
```

### 3. Optimize CSS (Remove Dead + Minify)
```typescript
import { optimizeCssNative } from '@tailwind-styled/compiler'

const css = `.px-4 { padding: 0 1rem; } .unused { color: red; } ...`

const result = optimizeCssNative(css)

console.log(result)
// {
//   css: '.px-4{padding:0 1rem}...',  // minified
//   originalSize: 2048,
//   optimizedSize: 1024,
//   reductionPercentage: 50
// }
```

### 4. Eliminate Dead CSS
```typescript
import { eliminateDeadCssNative } from '@tailwind-styled/compiler'

const css = `.px-4 { padding: 0 1rem; } .unused { color: red; } ...`
const deadClasses = ['unused', 'deprecated']

const cleanCss: string = eliminateDeadCssNative(css, deadClasses)
```

---

## 🎨 Compilation Functions

### 1. Compile Tailwind Classes to CSS
```typescript
import { compileCssNative2 } from '@tailwind-styled/compiler'

const classes = ['px-4', 'hover:bg-blue-600', 'md:text-lg']
const prefix = 'tw-' // optional

const result = compileCssNative2(classes, prefix)
console.log(result.css)  // Generated CSS string
console.log(result.classes)  // Resolved classes
```

### 2. Generate Static State CSS
```typescript
import { generateStaticStateCssNative, type GeneratedStateCss } from '@tailwind-styled/compiler'

const inputs = [
  {
    tag: 'Button',
    componentName: 'PrimaryButton',
    statesJson: JSON.stringify({
      default: 'bg-blue-600 text-white',
      hover: 'bg-blue-700',
      disabled: 'opacity-50 cursor-not-allowed'
    })
  },
  {
    tag: 'Input',
    componentName: 'TextInput',
    statesJson: JSON.stringify({
      default: 'border border-gray-300',
      focus: 'border-blue-500 ring-blue-500'
    })
  }
]

const results: GeneratedStateCss[] = generateStaticStateCssNative(inputs)

results.forEach(rule => {
  console.log(`${rule.componentName}:${rule.stateName}`)
  console.log(`  Selector: ${rule.selector}`)
  console.log(`  CSS: ${rule.cssRule}`)
})
```

### 3. Layout Classes to CSS
```typescript
import { layoutClassesToCss } from '@tailwind-styled/compiler'

const classes = 'flex gap-4 p-8'
const css: string = layoutClassesToCss(classes)
// Result: ".flex { display: flex; } .gap-4 { gap: 1rem; } ..."
```

### 4. Parse Atomic Class
```typescript
import { parseAtomicClass } from '@tailwind-styled/compiler'

const atomicCss = parseAtomicClass('px-4')
console.log(atomicCss)
// Result: ".px-4 { padding-left: 1rem; padding-right: 1rem; }"
```

### 5. Generate Atomic CSS
```typescript
import { generateAtomicCss } from '@tailwind-styled/compiler'

const rules = [
  { selector: 'px-4', declarations: 'padding-left: 1rem; padding-right: 1rem;' },
  { selector: 'text-lg', declarations: 'font-size: 1.125rem;' }
]

const css: string = generateAtomicCss(JSON.stringify(rules))
```

---

## 📊 CSS Generator (with Fallback)

### Generate CSS with Theme
```typescript
import { generateCssNative } from '@tailwind-styled/compiler'

const css = await generateCssNative(
  ['px-4', 'bg-blue-600', 'hover:opacity-80'],
  {
    theme: {
      colors: { blue: { '600': '#2563eb' } },
      spacing: { '4': '1rem' }
    },
    fallbackToJs: true,        // Fall back to JS if Rust unavailable
    logFallback: process.env.DEBUG  // Log if fallback used
  }
)
```

### Get Cache Statistics
```typescript
import { getCacheStats } from '@tailwind-styled/compiler'

const stats = getCacheStats()
if (stats) {
  console.log(`Cache hits: ${stats.hits}`)
  console.log(`Cache misses: ${stats.misses}`)
  const hitRate = (stats.hits / (stats.hits + stats.misses) * 100).toFixed(1)
  console.log(`Hit rate: ${hitRate}%`)
}
```

### Clear Theme Cache
```typescript
import { clearThemeCache } from '@tailwind-styled/compiler'

// Before switching themes
clearThemeCache()
const css = await generateCssNative(classes, { theme: newTheme })
```

---

## 🛠️ Error Handling

All functions throw errors with descriptive messages if the native binding is not available:

```typescript
import { scanWorkspace } from '@tailwind-styled/compiler'

try {
  const result = scanWorkspace('./src')
} catch (error) {
  if (error instanceof Error) {
    console.error(`Scan failed: ${error.message}`)
    // Possible errors:
    // - "scan_workspace not available" (native binding not compiled)
    // - File system errors
    // - Permission errors
  }
}
```

---

## ⚡ Performance Tips

### 1. Use Batch Functions When Possible
```typescript
// ❌ Slow - multiple calls
files.forEach(file => extractClassesFromSourceNative(readFileSync(file, 'utf-8')))

// ✅ Fast - single batch call
batchExtractClassesNative(files)
```

### 2. Cache Scan Results
```typescript
let cachedScanResult: ScanWorkspaceResult | null = null

function getOrScanWorkspace() {
  if (!cachedScanResult) {
    cachedScanResult = scanWorkspace('./src')
  }
  return cachedScanResult
}

// Use cachedScanResult multiple times
```

### 3. Monitor Cache Statistics
```typescript
const stats = getCacheStats()
if (stats && stats.misses > stats.hits) {
  console.warn('Low cache hit rate - consider clearing and rebuilding')
  clearThemeCache()
}
```

---

## 📖 Type Safety

All functions are **100% typed** with no `any` types:

```typescript
// ✅ Full type inference
const result = scanWorkspace('./src')
// result type: ScanWorkspaceResult

// ✅ Type checking on usage
result.unique_classes  // ✅ property exists, type: number
result.unknown_prop    // ❌ TypeScript error - property doesn't exist

// ✅ Function parameters are typed
extractClassesFromSourceNative('valid source')  // ✅
compileCssNative2(['px-4'], 'prefix')          // ✅
```

---

## 🔧 Common Patterns

### Pattern 1: Scan → Analyze → Optimize
```typescript
import {
  scanWorkspace,
  detectDeadCode,
  optimizeCssNative
} from '@tailwind-styled/compiler'

const scanResult = scanWorkspace('./src')
const css = compileCss(scanResult.classes)
const deadCode = detectDeadCode(JSON.stringify(scanResult), css)
const optimized = optimizeCssNative(css)
```

### Pattern 2: Extract and Compile
```typescript
import {
  extractClassesFromSourceNative,
  compileCssNative2
} from '@tailwind-styled/compiler'

const source = readFileSync('Component.tsx', 'utf-8')
const classes = extractClassesFromSourceNative(source)
const css = compileCssNative2(classes)
```

### Pattern 3: Batch Process
```typescript
import { batchExtractClassesNative } from '@tailwind-styled/compiler'

const results = batchExtractClassesNative(glob.sync('src/**/*.tsx'))
const allClasses = new Set<string>()

results.forEach(result => {
  if (result.ok) {
    result.classes.forEach(cls => allClasses.add(cls))
  }
})
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Function not available" error | Ensure native binary is built: `npm run build:rust` |
| Type errors with imports | Check file is exported from index.ts |
| Performance slower than expected | Check cache hit rate with `getCacheStats()` |
| JSON parsing errors | Ensure you're passing valid JSON strings to JSON-expecting functions |

---

## 📚 Related Documentation

- Full API: `native/API.md`
- Type Definitions: `packages/domain/compiler/src/nativeBridge.ts`
- Implementation Details: `PHASE_5_INTEGRATION_COMPLETE.md`

---

**Status**: ✅ All 65+ functions working with full type safety
**Next**: Run `npm run build` to compile everything
