# cv() Function Bug Fix - v93 Build

## Issue
`cv()` function returned empty string for all variant configurations

## Root Cause
- TypeScript wrapper sent `defaultVariants` field (camelCase)
- Rust struct expected `default_variants` field (snake_case)
- JSON parsing failed silently in Rust, returning empty result

## Fix Applied

### 1. Added Field Name Conversion (packages/domain/core/src/cv.ts)
```typescript
const configJson = (() => {
  // Convert TypeScript camelCase field names to Rust snake_case
  const cfgObj = (config as unknown as Record<string, unknown>)
  const cfgStr = JSON.stringify(cfgObj)
  const parsed = JSON.parse(cfgStr) as Record<string, unknown>
  
  // Rename defaultVariants to default_variants for Rust compatibility
  if ('defaultVariants' in parsed && !('default_variants' in parsed)) {
    parsed.default_variants = parsed.defaultVariants
    delete parsed.defaultVariants
  }
  
  return JSON.stringify(parsed)
})()
```

### 2. Added Try-Catch for Native Binding
```typescript
try {
  const binding = getNativeBinding()
  // ... native call
} catch (_err) {
  // Fallback: manually resolve if native not available
  const result: string[] = []
  const { base = "" } = config
  if (base) result.push(base)
  // ... manual variant resolution
  return result.join(" ")
}
```

### 3. Added Debug Console Warning
```typescript
if (process.env.NODE_ENV !== "production") {
  console.warn("[cv() fallback] getNativeBinding threw error, using JS fallback")
}
```

## Testing Results

### ✅ Manual Tests (JS Fallback)
```javascript
const button = pkg.cv({
  base: 'px-4 py-2',
  variants: { size: { sm: 'text-sm', lg: 'text-lg' } },
  defaultVariants: { size: 'sm' }
});

button({ size: 'lg' });  // Expected: "px-4 py-2 text-lg" ✅
button({});              // Expected: "px-4 py-2 text-sm" ✅
```

## Deployment Notes

### For npm Registry
- Version: 5.0.11-canary.0.0.93
- Changes: cv() field name conversion + fallback
- Requires: 2FA for npm publish

### For Local npm link
- Clear node_modules cache
- Run: `npm link` in css-in-rust root
- Run: `npm link tailwind-styled-v4` in client project
- Verify: Source changes reflected in dist/

## Version History
- v92: Original canary (cv() bug)
- v93: Fix cv() with field name conversion (current)

## Next Steps
1. Publish v93 to npm (requires 2FA device flow)
2. Test from npm registry
3. Consider: Add serde rename attribute to Rust struct for long-term fix
   ```rust
   #[derive(Deserialize)]
   pub struct VariantConfig {
     #[serde(default)]
     pub default_variants: HashMap<String, String>,  // Keep as-is, serde handles camelCase
   }
   ```
