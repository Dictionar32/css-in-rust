# Error Handling & Data Flow Principles

## Core Philosophy

**Ketika menghadapi masalah yang tidak bisa di-resolve:**
1. **Jangan bypass kode** - Hindari quick fixes yang meninggalkan error
2. **Ikuti aturan bahasa** - Hormati constraint TypeScript, Rust, atau bahasa yang digunakan
3. **Biarkan data mengalir** - Jangan suppress atau hide error, propagate dengan benar
4. **Gunakan tools eksternal** - MCP servers, documentation, web search untuk solusi
5. **Fail explicitly** - Error yang transparan lebih baik daripada silent failures

## Principle 1: No Error Suppression

### ❌ SALAH - Bypass dengan casting/any

```typescript
// DON'T: Suppress type error dengan 'as any'
const registry = loadRegistry() as any // ERROR HIDDEN!
registry.unknown.method() // Will fail at runtime
```

### ✅ BENAR - Handle dengan proper typing

```typescript
// DO: Define proper types
interface Registry {
  components: Map<string, ComponentConfig>
  metadata?: Record<string, unknown>
}

const registry = loadRegistry(): Registry {
  // ... implement with type safety
}
```

## Principle 2: Follow Language Rules

### TypeScript/JavaScript
- **No `any` types** tanpa explicit `// @ts-expect-error` dengan reason
- **No duplicate exports** - refactor, jangan hapus secara sembarangan
- **Type safety first** - Use generics, interfaces, unions instead of `any`
- **Strict null checks** - Handle nullability explicitly

### Rust
- **Ownership rules** - Jangan force borrow atau clone without reason
- **Error handling** - Use `Result<T, E>` atau `Option<T>`, jangan `.unwrap()` di production
- **Pattern matching** - Exhaustive, jangan assume values
- **Lifetimes** - Declare explicitly, jangan elide incorrectly

### Build Configuration
- **Don't disable checks** - Jangan remove tsconfig strict flags
- **Don't remove validation** - Build-time checks exist for reasons
- **Respect linting rules** - Fix underlying issues, not the rules

## Principle 3: Data Flow Integrity

### Problem: Data Stream Interrupted

```typescript
// ❌ WRONG: Data lost, error suppressed
try {
  const result = processData(input)
  return result ?? {} // Might be undefined, defaulted silently
} catch (error) {
  return {} // Error swallowed
}

// ✅ RIGHT: Data flows through with explicit error handling
try {
  const result = processData(input)
  if (!result) {
    throw new Error('Processing returned null - check input validity')
  }
  return result
} catch (error) {
  console.error('Data processing failed:', {
    input,
    error: error instanceof Error ? error.message : String(error),
  })
  throw error // Re-throw after logging, don't hide
}
```

### Problem: Multiple Transforms with Type Safety

```typescript
// ❌ WRONG: Lost type info at each step
const data = fetchData() // unknown
const parsed = JSON.parse(data) // unknown
const validated = parsed.config // unknown - could be anything!

// ✅ RIGHT: Type flows explicitly
interface RawData {
  config: ConfigSchema
}

const data = fetchData(): string
const parsed: RawData = JSON.parse(data)
const validated: ConfigSchema = parseConfig(parsed.config)
```

## Principle 4: When Stuck - Escalate, Don't Bypass

### Pattern: Use External Tools

**Stage 1: Search & Documentation**
```bash
# When unsure about API:
- Search package docs via MCP (context7 power)
- Check TypeScript compiler errors for hints
- Look at existing patterns in codebase
```

**Stage 2: Deep Investigation**
```bash
# When pattern unclear:
- Use context-gatherer agent to map related files
- Check git history for similar fixes
- Read test files to understand usage patterns
```

**Stage 3: Ask for Clarification**
```typescript
// Mark clearly when uncertain:
// TODO: [UNCERTAIN] This casting might be wrong - need to verify
// with actual runtime behavior before shipping
const value = input as SpecialType // Explicit concern marked
```

## Principle 5: Error Messages Should Be Actionable

### ❌ Not helpful
```typescript
throw new Error('Failed')
throw new Error('Invalid value')
```

### ✅ Actionable
```typescript
throw new Error(
  'Component registry loading failed: Expected JSON with "components" ' +
  `object but got ${typeof data}. File: ${filePath}`
)

throw new Error(
  'Invalid Tailwind class format in component "Button": ' +
  'Got "invalid-[123]" but expected valid Tailwind class or custom ' +
  'property. See: https://docs.tailwindcss.com'
)
```

## Principle 6: Testing Validates Assumptions

**Jangan assume kode bekerja - test dan verify:**

```typescript
// ❌ Assumption without test
export async function generateTypesFromComponents(
  components: Map<string, ComponentConfig>,
  outputPath: string
): Promise<void> {
  // Assumes components always valid, outputPath always writable
}

// ✅ Tested & validated
export async function generateTypesFromComponents(
  components: Map<string, ComponentConfig>,
  outputPath: string
): Promise<void> {
  if (!components || components.size === 0) {
    throw new Error('Components map is empty')
  }

  const dir = path.dirname(outputPath)
  try {
    fs.mkdirSync(dir, { recursive: true })
  } catch (error) {
    throw new Error(
      `Cannot create output directory ${dir}: ` +
      (error instanceof Error ? error.message : String(error))
    )
  }

  // ... rest of implementation
}

// Test:
test('throws when components empty', async () => {
  await expect(
    generateTypesFromComponents(new Map(), '/tmp/out.d.ts')
  ).rejects.toThrow('empty')
})
```

## Principle 7: Duplicate Code - Refactor, Don't Hide

**Jika menemukan duplicate:**

### ❌ WRONG: Delete salah satu
```typescript
// Deletes second implementation without understanding
export async function generateTypesFromComponents(...) { }
export async function generateTypesFromComponents(...) { } // DELETE!
// But maybe second version has bug fix?
```

### ✅ RIGHT: Investigate & merge
```typescript
// 1. Understand why both exist
// 2. Merge differences into single version
// 3. Run tests to verify
// 4. Delete old one
// 5. Document what changed

// Before:
export async function generateTypesFromComponents(v1) { }
export async function generateTypesFromComponents(v2) { } // Has better error handling

// After: Merged with best of both
export async function generateTypesFromComponents(components, outputPath) {
  // - v1's core logic
  // - v2's error handling
  // - Both tested
}
```

## Principle 8: Breaking Changes Require Decisions

**Jangan silent breaking changes:**

```typescript
// ❌ WRONG: Silent API change
// Was: processData(input: string): string
// Now: processData(input: string | null): string | null
// Caller code breaks without warning

// ✅ RIGHT: Explicit deprecation + migration path
/**
 * @deprecated Use processDataSafe instead
 * This will be removed in v6.0.0
 * Migration: Replace processData(x) with processDataSafe(x)?.value ?? defaultValue
 */
export function processData(input: string): string { }

export function processDataSafe(
  input: string | null
): { value: string } | null { }
```

## Checklist: Before Committing Code

- [ ] No `any` types (unless absolutely necessary with reason documented)
- [ ] No duplicate code (refactored or marked as intentional)
- [ ] No error suppression (all errors either handled or propagated)
- [ ] Error messages are actionable (include context, not just "failed")
- [ ] Types are respected (no casting away type safety without reason)
- [ ] Tests validate assumptions (or tests added if none exist)
- [ ] Breaking changes documented (deprecation, migration guide)
- [ ] Data flows through layers with type safety maintained
- [ ] Configuration changes respect constraints (don't disable strict mode)

## When You Find a Problem

**Follow this flowchart:**

```
Problem found?
  ↓
Can fix with proper code? → YES → Fix it
  ↓ NO
Research via:
  - TypeScript errors (follow hints)
  - Code search (find similar patterns)
  - Package docs (via context7 MCP)
  - Web search (if external dependency)
  - Test files (understand expected behavior)
  ↓
Found pattern/solution? → YES → Implement following pattern
  ↓ NO
Use sub-agent:
  - context-gatherer for architecture understanding
  - general-task-execution for exploration
  ↓
Still stuck? → Document clearly, ask for guidance
  ↓
DO NOT:
  ✗ Use 'as any' to silence errors
  ✗ Delete code to hide problems
  ✗ Disable checks/linting
  ✗ Return undefined/null silently
  ✗ Assume things work
  ✗ Bypass language rules
```

## Related Documentation

- Tech Stack: `.kiro/steering/tech.md`
- Structure: `.kiro/steering/structure.md`
- Product: `.kiro/steering/product.md`
- Build Magic: `.kiro/steering/build-time-magic.md`

## Version

- **Created**: July 3, 2026
- **Status**: Active
- **Applies to**: All code changes in css-in-rust
- **Enforcement**: Manual review + automation where possible

---

**Key Takeaway:** 
*Jangan pernah bypass error. Biarkan data mengalir dengan benar melalui type system, atau fail explicitly dengan pesan yang jelas. Gunakan semua tools yang tersedia (MCP, agents, documentation) sebelum resort ke hack solutions.*
