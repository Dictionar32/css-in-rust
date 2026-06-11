# Phase 5.2 API Reference
## CSS Compilation & ID Registry Functions

Quick reference for all 28 new Phase 5.2 functions.

---

## 🎨 CSS Compilation API

### Class Compilation

#### `compileClass(input: string): CompiledCssRule`
Compile a single Tailwind class to CSS rule with full metadata.

```typescript
const rule = compileClass('md:hover:bg-blue-600')
// Returns: {
//   selector: '.md\:hover\:bg-blue-600',
//   declarations: 'background-color: #2563eb;',
//   properties: [{key: 'background-color', value: '#2563eb'}],
//   specificity: 1
// }
```

**Use Cases**: Single class analysis, rule inspection, debugging

---

#### `compileClasses(inputs: string[]): CssCompileResult`
Compile multiple Tailwind classes with batch processing.

```typescript
const result = compileClasses(['px-4', 'bg-blue-600', 'hover:opacity-80'])
// Returns: {
//   css: '.px-4{...} .bg-blue-600{...} .hover\:opacity-80{...}',
//   resolved_classes: ['px-4', 'bg-blue-600', 'hover:opacity-80'],
//   unknown_classes: [],
//   size_bytes: 245,
//   duration_ms: 12
// }
```

**Use Cases**: Batch analysis, performance measurement, validation

---

#### `compileToCss(input: string, minify?: boolean): string`
One-step: Tailwind class to CSS string with optional minification.

```typescript
compileToCss('bg-blue-600')                 // Full CSS
// ".bg-blue-600 { background-color: #2563eb; }"

compileToCss('bg-blue-600', true)           // Minified
// ".bg-blue-600{background-color:#2563eb}"
```

**Use Cases**: Quick CSS generation, inline styles, runtime compilation

---

#### `compileToCssBatch(inputs: string[], minify?: boolean): string`
Batch compile to combined CSS string.

```typescript
compileToCssBatch(['px-4', 'bg-blue-600'], true)
// ".px-4{padding-left:1rem;padding-right:1rem}.bg-blue-600{background-color:#2563eb}"
```

**Use Cases**: Multi-class CSS generation, stylesheet building

---

### CSS Optimization

#### `minifyCss(css: string): string`
Remove unnecessary whitespace, achieving 40-60% size reduction.

```typescript
minifyCss('.px-4 { padding-left: 1rem; padding-right: 1rem; }')
// ".px-4{padding-left:1rem;padding-right:1rem}"
```

**Use Cases**: CSS optimization, bundle size reduction, file compression

---

### Animation & Keyframes

#### `compileAnimation(name: string, from: string, to: string): CompiledAnimation`
Generate @keyframes and animation rule from from/to states.

```typescript
const anim = compileAnimation('fade-in', 'opacity-0', 'opacity-100')
// Returns: {
//   animation_id: 'fade-in',
//   keyframes_css: '@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }',
//   animation_rule: 'animation: fade-in 300ms;',
//   duration_ms: 300
// }
```

**Use Cases**: Animation generation, transition states, motion design

---

#### `compileKeyframes(name: string, stopsJson: string): CompiledAnimation`
Compile keyframes from percentage stops.

```typescript
const stops = [
  { stop: '0%', classes: 'translate-x-full' },
  { stop: '50%', classes: 'translate-x-1/2' },
  { stop: '100%', classes: 'translate-x-0' }
]
const kf = compileKeyframes('slide-in', JSON.stringify(stops))
```

**Use Cases**: Complex animations, multi-stop keyframes, sequenced motion

---

### Theme & Styling

#### `compileTheme(tokensJson: string, themeName: string, prefix: string): CompiledTheme`
Convert token map to CSS custom properties.

```typescript
const tokens = {
  colors: {
    blue: { 600: '#2563eb' },
    red: { 500: '#ef4444' }
  }
}
const theme = compileTheme(JSON.stringify(tokens), 'light', 'tw')
// Returns CSS: :root { --tw-color-blue-600: #2563eb; --tw-color-red-500: #ef4444; }
```

**Use Cases**: Theme generation, design tokens, CSS variables

---

### Class Merging

#### `twMerge(classString: string): string`
Resolve conflicting Tailwind classes intelligently.

```typescript
twMerge('px-4 px-8 bg-red-500 bg-blue-600')
// Returns: "px-8 bg-blue-600" (last-one-wins strategy)

twMerge('hover:opacity-50 hover:opacity-100')
// Returns: "hover:opacity-100"
```

**Use Cases**: Conflict resolution, class deduplication, style merging

---

#### `twMergeMany(classStrings: string[]): string`
Merge multiple class strings with conflict resolution.

```typescript
twMergeMany([
  'px-4 hover:bg-blue-600',
  'px-8 hover:opacity-80'
])
// Returns: "px-8 hover:bg-blue-600 hover:opacity-80"
```

**Use Cases**: Combining component classes, prop overrides

---

#### `twMergeWithSeparator(classString: string, options: TwMergeOptions): string`
Merge with custom class separator.

```typescript
twMergeWithSeparator(
  'px-4,px-8,bg-red,bg-blue',
  { separator: ',' }
)
// Returns: "px-8,bg-blue"
```

**Use Cases**: Non-standard separators, legacy formats

---

#### `twMergeManyWithSeparator(classStrings: string[], options: TwMergeOptions): string`
Batch merge with custom separator.

```typescript
twMergeManyWithSeparator(
  ['px-4,px-8', 'bg-red,bg-blue'],
  { separator: ',' }
)
```

**Use Cases**: Batch processing with custom format

---

#### `twMergeRaw(classLists: string[]): string`
Direct merge without preprocessing.

```typescript
twMergeRaw(['px-4 px-8', 'bg-red bg-blue'])
// Returns: "px-8 bg-blue"
```

**Use Cases**: Raw class merging, minimal overhead

---

## 🔑 ID Registry API

### Registry Lifecycle

#### `idRegistryCreate(): number`
Create a new ID generator, returns handle for subsequent operations.

```typescript
const handle = idRegistryCreate()
// Returns: 1 (handle number)

// Must be paired with destroy
try {
  // Use registry...
} finally {
  idRegistryDestroy(handle)
}
```

**Use Cases**: Component identification, deterministic IDs, session-scoped registries

---

#### `idRegistryDestroy(handle: number): void`
Clean up registry resources.

```typescript
const handle = idRegistryCreate()
// ... use handle ...
idRegistryDestroy(handle)  // Free resources
```

**Use Cases**: Cleanup, resource management, session termination

---

#### `idRegistryReset(handle: number): void`
Clear all entries but reuse handle.

```typescript
const handle = idRegistryCreate()
idRegistryGenerate(handle, 'Component1')
idRegistryGenerate(handle, 'Component2')
idRegistryReset(handle)  // All entries cleared
const id = idRegistryNext(handle)  // Back to 0
```

**Use Cases**: Registry reuse, cache clearing, reset operations

---

### ID Generation & Lookup

#### `idRegistryGenerate(handle: number, name: string): number`
Generate a new ID for a name (deterministic - same name = same ID).

```typescript
const handle = idRegistryCreate()
const id1 = idRegistryGenerate(handle, 'Button')    // Returns 1
const id2 = idRegistryGenerate(handle, 'Button')    // Returns 1 (same)
const id3 = idRegistryGenerate(handle, 'Card')      // Returns 2 (different)
```

**Use Cases**: Component identification, deterministic hashing, cache keys

---

#### `idRegistryLookup(handle: number, name: string): number`
Find existing ID for a name (returns -1 if not found).

```typescript
const handle = idRegistryCreate()
idRegistryGenerate(handle, 'Button')

const id = idRegistryLookup(handle, 'Button')      // Returns 1
const notFound = idRegistryLookup(handle, 'Card')  // Returns -1
```

**Use Cases**: Checking existence, validation, preexistence checking

---

#### `idRegistryNext(handle: number): number`
Get the next ID that would be assigned (useful for counting).

```typescript
const handle = idRegistryCreate()
idRegistryGenerate(handle, 'Button')     // next becomes 1
idRegistryGenerate(handle, 'Card')       // next becomes 2
const next = idRegistryNext(handle)      // Returns 2
// Tells you: 2 components registered, next available is 2
```

**Use Cases**: Counter operations, progress tracking, capacity planning

---

#### `idRegistryActiveCount(): number`
Get count of active registries (useful for monitoring).

```typescript
idRegistryActiveCount()  // Returns number of active handles
// Useful for detecting registry leaks
```

**Use Cases**: Resource monitoring, memory profiling, leak detection

---

### State Management

#### `idRegistrySnapshot(handle: number): RegistrySnapshot`
Get snapshot of current registry state (JSON-serializable).

```typescript
const handle = idRegistryCreate()
idRegistryGenerate(handle, 'Button')
idRegistryGenerate(handle, 'Card')

const snapshot = idRegistrySnapshot(handle)
// Returns: {
//   handle: 1,
//   next_id: 2,
//   entries: [
//     { name: 'Button', id: 1 },
//     { name: 'Card', id: 2 }
//   ],
//   total_entries: 2
// }
```

**Use Cases**: State inspection, debugging, serialization

---

#### `idRegistryExport(handle: number): string`
Export registry state for persistence (returns JSON string).

```typescript
const exported = idRegistryExport(handle)
// Save to file
fs.writeFileSync('registry.json', exported)
```

**Use Cases**: Persistence, backup, sharing state

---

#### `idRegistryImport(importedData: string): number`
Import/restore registry from saved state (returns new handle).

```typescript
const savedData = fs.readFileSync('registry.json', 'utf-8')
const handle = idRegistryImport(savedData)
// Registry restored with same IDs
```

**Use Cases**: Recovery, restoration, loading persisted state

---

### Global Property/Value Registry

#### `registerPropertyName(propertyName: string): number`
Register CSS property with global registry (returns ID).

```typescript
const bgColorId = registerPropertyName('background-color')
const paddingId = registerPropertyName('padding')
const marginId = registerPropertyName('margin')
```

**Use Cases**: CSS property mapping, token registration, schema building

---

#### `registerValueName(valueName: string): number`
Register CSS value with global registry (returns ID).

```typescript
const blueId = registerValueName('blue-600')
const redId = registerValueName('red-500')
const mediumId = registerValueName('medium')
```

**Use Cases**: Value mapping, token registry, color schemes

---

#### `propertyIdToString(propertyId: number): string`
Convert property ID back to name (reverse lookup).

```typescript
const bgColorId = registerPropertyName('background-color')
const name = propertyIdToString(bgColorId)
console.log(name)  // "background-color"
```

**Use Cases**: Deserialization, debugging, data reconstruction

---

#### `valueIdToString(valueId: number): string`
Convert value ID back to name (reverse lookup).

```typescript
const blueId = registerValueName('blue-600')
const value = valueIdToString(blueId)
console.log(value)  // "blue-600"
```

**Use Cases**: Deserialization, debugging, data reconstruction

---

#### `reverseLookupProperty(propertyId: number): string`
Alternative property lookup (same as propertyIdToString).

```typescript
const name = reverseLookupProperty(bgColorId)
```

---

#### `reverseLookupValue(valueId: number): string`
Alternative value lookup (same as valueIdToString).

```typescript
const value = reverseLookupValue(blueId)
```

---

## 📊 Type Definitions

### CSS Compilation Types

```typescript
interface CompiledCssRule {
  selector: string                    // CSS selector (e.g., ".px-4")
  declarations: string                // CSS declarations
  properties: Array<{                 // Property key-value pairs
    key: string
    value: string
  }>
  specificity: number                 // CSS specificity score
}

interface CompiledAnimation {
  animation_id: string                // Animation name
  keyframes_css: string               // @keyframes rule
  animation_rule: string              // animation: rule
  duration_ms: number                 // Duration in milliseconds
}

interface CompiledTheme {
  selector: string                    // CSS selector (:root, etc.)
  variables: Array<{                  // CSS custom properties
    name: string
    value: string
  }>
  variables_css: string               // Full CSS variables rule
  theme_name: string                  // Theme identifier
}

interface CssCompileResult {
  css: string                         // Generated CSS
  resolved_classes: string[]          // Successfully compiled classes
  unknown_classes: string[]           // Unrecognized classes
  size_bytes: number                  // Output size
  duration_ms: number                 // Compilation time
}

interface TwMergeOptions {
  separator?: string                  // Class separator (default: space)
  debug?: boolean                     // Enable debug output
}
```

### ID Registry Types

```typescript
interface RegistrySnapshot {
  handle: number                      // Registry handle
  next_id: number                     // Next available ID
  entries: Array<{                    // All registered entries
    name: string
    id: number
  }>
  total_entries: number               // Total count
}
```

---

## ✨ Common Patterns

### Pattern 1: Class Compilation Pipeline

```typescript
// Parse → Compile → Minify
const classes = ['px-4', 'bg-blue-600', 'hover:opacity-80']
const result = compileClasses(classes)
const css = minifyCss(result.css)
```

### Pattern 2: Theme Generation

```typescript
const tokens = { colors: { blue: { 600: '#2563eb' } } }
const theme = compileTheme(JSON.stringify(tokens), 'light', 'tw')
// CSS vars: --tw-color-blue-600: #2563eb
```

### Pattern 3: Animation Creation

```typescript
const anim = compileAnimation('fade-in', 'opacity-0', 'opacity-100')
// @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
```

### Pattern 4: Class Deduplication

```typescript
const merged = twMerge('px-4 px-8 bg-red bg-blue')
// "px-8 bg-blue" (conflicts resolved)
```

### Pattern 5: Registry Lifecycle

```typescript
const handle = idRegistryCreate()
try {
  const id1 = idRegistryGenerate(handle, 'Component1')
  const snapshot = idRegistrySnapshot(handle)
  const exported = idRegistryExport(handle)
  // Use exported for persistence...
} finally {
  idRegistryDestroy(handle)
}
```

---

## 🚀 Performance Notes

| Operation | Speed | Notes |
|-----------|-------|-------|
| compileClass | ~0.5ms | Single class |
| compileClasses | ~1ms | Batch processing |
| twMerge | ~0.2ms | Conflict resolution |
| minifyCss | ~2ms | 40-60% reduction |
| idRegistryGenerate | <0.1ms | O(1) operation |
| idRegistrySnapshot | ~0.5ms | Includes serialization |

---

## 📖 See Also

- `PHASE_5_2_COMPLETION.md` - Full technical documentation
- `PHASE_5_QUICK_START.md` - Getting started guide
- `PHASE_5_GAP_ANALYSIS.md` - All 195 functions roadmap
- `native/API.md` - Rust API documentation
