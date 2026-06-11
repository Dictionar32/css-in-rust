# Native Bindings Quick Reference - Phase 5

**All Rust → TypeScript functions wrapped and type-safe**

## 📦 Import Everything

```typescript
import {
  // Scanner
  scanWorkspace,
  extractClassesFromSourceNative,
  batchExtractClassesNative,
  checkAgainstSafelistNative,
  scanFile,
  collectFiles,
  walkAndPrefilterSourceFiles,
  generateSubComponentTypes,
  
  // Analyzer
  detectDeadCode,
  analyzeClassUsageNative,
  analyzeClassesNative,
  analyzeRscNative,
  optimizeCssNative,
  processTailwindCssLightning,
  eliminateDeadCssNative,
  hoistComponentsNative,
  compileVariantTableNative,
  classifyAndSortClassesNative,
  mergeCssDeclarationsNative,
  
  // Compilation
  compileCssNative2,
  compileCssLightning,
  extractTwStateConfigsNative,
  generateStaticStateCssNative,
  extractAndGenerateStateCssNative,
  layoutClassesToCss,
  hashContent,
  extractTwContainerConfigs,
  parseAtomicClass,
  generateAtomicCss,
  toAtomicClasses,
  clearAtomicRegistry,
  atomicRegistrySize,
  
  // CSS Generation
  generateCssNative,
  getCacheStats,
  clearThemeCache,
  
  // Utilities
  checkNativeBindingsAvailable,
  getNativeBindingsDiagnostics,
  NATIVE_BINDINGS_INFO,
} from '@tailwind-styled/compiler'
```

---

## 🔍 Scanner Functions

### Scan Entire Workspace
```typescript
const result = scanWorkspace(process.cwd(), ['ts', 'tsx'])
// Returns: { files, total_files, classes, unique_classes, duration_ms, errors }
```

### Extract from Source
```typescript
const classes = extractClassesFromSourceNative(sourceCode)
// Returns: ["px-4", "hover:bg-blue-600", "md:text-lg", ...]
```

### Batch Process Files
```typescript
const results = batchExtractClassesNative(['/src/a.tsx', '/src/b.tsx'])
// Returns: [{ file, classes, contentHash, ok, error? }, ...]
```

### Check Against Safelist
```typescript
const result = checkAgainstSafelistNative(
  ['px-4', 'custom-class'],
  ['px-4', 'text-lg']  // safelist
)
// Returns: { matched: ["px-4"], unmatched: ["custom-class"], matchPercentage: 50 }
```

---

## 🔎 Analyzer Functions

### Detect Dead CSS
```typescript
const deadCode = detectDeadCode(scanResultJson, css)
// Returns: { 
//   deadInCss: [], 
//   deadInSource: [], 
//   liveClasses: [],
//   reductionPercentage: 15.5
// }
```

### Analyze All Classes
```typescript
const analysis = analyzeClassesNative(filesJson, process.cwd(), 0)
// Returns: { css, code, classes, changed, rscJson?, metadataJson?, safelist? }
```

### Analyze React Server Component
```typescript
const result = analyzeRscNative(source, 'Button.tsx')
// Returns: { isServer, needsClientDirective, clientReasons }
```

### Optimize CSS
```typescript
const optimized = optimizeCssNative(rawCss)
// Returns: { css, originalSize, optimizedSize, reductionPercentage }
```

---

## 🛠️ Compilation Functions

### Direct CSS Compilation
```typescript
const result = compileCssNative2(['px-4', 'hover:bg-blue-600'])
// Returns: { css: "...", classes: [...] }
```

### Fast Lightning CSS
```typescript
const css = compileCssLightning(['px-4', 'text-lg'])
// Returns: optimized CSS string
```

### Extract State Configs
```typescript
const configs = extractTwStateConfigsNative(source, 'Button.tsx')
// Returns: [{ tag, componentName, statesJson, sourceFile }, ...]
```

### Generate State CSS
```typescript
const stateCss = generateStaticStateCssNative(configs, baseCSS)
// Returns: [{ selector, declarations, cssRule, componentName, stateName }, ...]
```

### Container Queries
```typescript
const configs = extractTwContainerConfigs(source)
// Returns: [{ tag, containerJson, containerName?, breakpoints }, ...]
```

---

## ⚡ Performance Tips

### Use Batch Operations
```typescript
// ❌ Slow
for (const file of files) {
  extractClassesFromSourceNative(readFile(file))
}

// ✅ Fast
const results = batchExtractClassesNative(files)
```

### Cache Results
```typescript
// Get cache stats
const stats = getCacheStats()
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`)

// Clear cache between builds
clearThemeCache()
```

### Parallel Processing
```typescript
// Walk and prefilter in parallel
const results = walkAndPrefilterSourceFiles(
  process.cwd(),
  ['ts', 'tsx'],
  true  // parallel
)
```

---

## 🔧 Diagnostics

### Check Availability
```typescript
if (!checkNativeBindingsAvailable()) {
  console.error('Native bindings not available!')
}
```

### Get Diagnostics
```typescript
const diag = getNativeBindingsDiagnostics()
console.log(diag.features)  // { scanner: true, analyzer: true, ... }
console.log(diag.available)  // true/false
```

### Version Info
```typescript
console.log(NATIVE_BINDINGS_INFO)
// {
//   version: "5.0.11-canary.0.0.93",
//   phase: "Phase 5",
//   features: { scanner: true, analyzer: true, ... },
//   totalFunctions: 65,
// }
```

---

## 📊 Common Workflows

### Full Analysis Pipeline
```typescript
// 1. Scan workspace
const scan = scanWorkspace(cwd)

// 2. Detect dead code
const deadCode = detectDeadCode(JSON.stringify(scan), css)

// 3. Optimize CSS
const optimized = optimizeCssNative(css)

// 4. Report results
console.log(`
  Dead CSS: ${deadCode.deadInCss.length} selectors
  Size reduction: ${(optimized.reductionPercentage).toFixed(1)}%
`)
```

### Build Integration
```typescript
// 1. Extract classes from source files
const results = batchExtractClassesNative(sourceFiles)

// 2. Compile CSS
const compiled = compileCssNative(
  results.flatMap(r => r.classes)
)

// 3. Optimize
const final = optimizeCssNative(compiled.css)

// 4. Return to build
return final.css
```

### Development Workflow
```typescript
// 1. Watch for changes
onFileChange((file) => {
  // 2. Extract new classes
  const classes = extractClassesFromSourceNative(readFile(file))
  
  // 3. Compile
  const result = compileCssNative(classes)
  
  // 4. Update dev server
  emitCSS(result.css)
})
```

---

## ❌ Error Handling

```typescript
try {
  const result = scanWorkspace(cwd)
} catch (error) {
  if (error instanceof Error) {
    console.error('Scan failed:', error.message)
  }
}

// Or check availability first
if (checkNativeBindingsAvailable()) {
  const result = scanWorkspace(cwd)
}
```

---

## 📚 Learn More

- Full API docs: See `NATIVE_BINDINGS_INTEGRATION_COMPLETE.md`
- Rust implementations: `native/src/**/*.rs`
- TypeScript wrappers: `packages/domain/compiler/src/*Native.ts`
- Bridge interface: `packages/domain/compiler/src/nativeBridge.ts`

---

**Status**: ✅ All functions production-ready  
**Type Safety**: ✅ 100% TypeScript support  
**Performance**: ✅ Optimized Rust implementation  

