# Design Document — 5 Features Enhancement (100% Build-Time Architecture)

## Overview

Design spesifikasi untuk implementasi 5 fitur enhancement di tailwind-styled-v4 dengan **strict zero-runtime architecture**. Semua fitur adalah pure build-time operations — tidak ada runtime JS overhead.

**Core Principle**: All features execute during `npm run build`. Generated output is 100% static code with zero runtime cost.

---

## Architecture

### Architecture: Build-Time Pipeline

### High-Level System Design

```
Build-Time Enhancement Pipeline (Zero-Runtime)
================================================

1. Figma Design Token Sync (CLI Command)
   ├─ CLI: tw figma pull/push/diff (executed during build)
   ├─ I/O: tokens.sync.json ↔ Figma REST API
   └─ Output: Static token definitions

2. Semantic Component Type Inference (Build-Time Analyzer)
   ├─ Input: Component config (@semantic, @aria, @state metadata)
   ├─ Process: Extract → Analyze → Generate TypeScript stubs
   ├─ Output: .d.ts files with semantic type information
   └─ Integration: Part of tsup build pipeline

3. Build-Time Plugin System (Composition Engine)
   ├─ Timing: PRE component generation → POST (still build-time)
   ├─ Execution: Hooks execute in defined order
   ├─ Output: Modified component code (static .js)
   └─ NO runtime execution (all build-time)

4. Static ARIA Attribute Injection (Build-Time Plugin)
   ├─ Input: Component config + semantic metadata
   ├─ Process: Analyze tag → Pre-compute ARIA properties
   ├─ Output: Component code with ARIA pre-embedded
   └─ Integration: Implemented as Feature #3 plugin

5. Polymorphism Patterns Guide (Documentation)
   ├─ Research: Ecosystem analysis (Radix, Chakra, Panda)
   ├─ Output: docs/ + known-issues.md entry
   └─ Type: Pure documentation (zero code)
```

### Build Pipeline Integration Flow

```
npm run build
  ↓
[Figma Sync (if configured)]
  Read FIGMA_* env vars → Fetch tokens → Write tokens.sync.json
  ↓
[Compiler: Scan & Extract]
  Scan source files → Extract component configs
  ↓
[Semantic Analysis Pass (NEW)]
  Analyze @semantic, @aria, @state metadata
  ↓
[Plugin System Pre-Phase (NEW)]
  Load plugin registry → Execute preComponent hooks
  ↓
[Component Code Generation]
  Generate .js, .d.ts files (modified by plugins)
  ↓
[Plugin System Post-Phase (NEW)]
  Execute postComponent hooks (still build-time)
  ↓
[Type Generation (NEW)]
  Generate .d.ts with semantic information
  ↓
Output: dist/ artifacts
  ├─ *.js (static component code)
  ├─ *.d.ts (type definitions with semantic info)
  ├─ tokens.sync.json (design tokens)
  └─ Zero runtime code added
```

---

## Components and Interfaces

### 1. Figma Sync CLI Component (Build-Time)

**File Structure**:
- CLI command: `packages/infrastructure/cli/src/commands/figma.ts`
- API client: `packages/infrastructure/cli/src/utils/figmaApi.ts`
- Token utils: `packages/infrastructure/cli/src/utils/tokenUtils.ts`

**Execution Model**:
- CLI commands execute during build (if configured)
- Environment variables: FIGMA_TOKEN, FIGMA_FILE_KEY
- Output: Static tokens.sync.json file
- No runtime code involved

**Command Structure**:
```
tw figma pull [--dry-run]     # Fetch from Figma → Write tokens.sync.json
tw figma push [--dry-run]     # Read tokens.sync.json → Push to Figma
tw figma diff                  # Compare local vs Figma
```

---

### 2. Semantic Component Type Inference (Build-Time Analyzer)

**File Structure**:
- Analyzer: `packages/domain/compiler/src/semanticComponentAnalyzer.ts`
- Type generator: `packages/domain/compiler/src/typeGeneratorFromMetadata.ts`
- Integration: Part of tsup config

**Execution Model** (during build):
```typescript
1. Scan component config files
2. Extract metadata:
   - @semantic: semantic intent (e.g., "button", "link")
   - @aria: explicit ARIA attributes
   - @state: state-to-aria mappings
3. Generate TypeScript .d.ts files
4. Output to dist/ directory
```

**Type Generation Example**:
```typescript
// Input (component config with metadata)
const Button = tw.button({
  "@semantic": "button",
  "@aria": { role: "button", "aria-pressed": "aria-pressed" }
})

// Output (.d.ts file generated at build-time)
export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  /** Semantic intent: button */
  // TypeScript knows this is a button with full type safety
}
```

---

### 3. Build-Time Plugin System (Composition Engine)

**File Structure**:
- Plugin API: `packages/domain/plugin-api/src/buildTimePluginSystem.ts`
- Plugin registry: `packages/domain/plugin-api/src/pluginRegistry.ts`
- Integration: Into component code generation pipeline

**Execution Model** (BUILD-TIME only):
```
For each component:
  1. preComponent hook
     └─ Analyze config, prepare modifications
  2. Component Code Generation
     └─ Generate .js file (potentially modified by plugins)
  3. postComponent hook
     └─ Post-process generated code (still build-time)
```

**Key Difference**:
- **NO `preComponentRender` hook** (that would be runtime)
- **Only** `preComponent` (before code gen) and `postComponent` (after code gen)
- All hooks are **synchronous** and execute during build
- Output is **static .js files** with zero runtime

**Plugin Context** (Build-Time):
```typescript
interface BuildTimePluginContext {
  phase: "pre" | "post"
  component: {
    name: string
    tag: HtmlTagName
    config: ComponentConfig
    metadata: Record<string, unknown>
  }
  codeGen: {
    // Build-time specific: code generation state
    computedProps: Record<string, unknown>
    injectedAttributes: Record<string, unknown>
  }
}

interface BuildTimePluginHook {
  name: "preComponent" | "postComponent"
  handler: (ctx: BuildTimePluginContext) => void // synchronous, build-time
  priority?: number
}
```

---

### 4. Static ARIA Attribute Injection (Build-Time Plugin)

**File Structure**:
- ARIA maps: `packages/domain/plugin-accessibility/src/semanticAriaMaps.ts`
- Plugin: `packages/domain/plugin-accessibility/src/ariaPlugin.ts`

**Execution Model** (during build, via plugin system):
```typescript
preComponent hook:
  1. Analyze component tag + @semantic metadata
  2. Pre-compute ARIA role and properties
  3. Store in context.codeGen.injectedAttributes

Component Code Generation:
  1. Normal component code generation
  2. Merge pre-computed ARIA attributes

postComponent hook:
  1. Verify no conflicts (user props always win)
```

**Example Output** (static component with pre-computed ARIA):
```typescript
// Generated component code (static)
export const Button = (props) => {
  // ARIA pre-computed at build-time
  const computedAria = {
    role: "button",
    "aria-pressed": props.variant === "toggle" ? "true" : undefined
  }
  
  // Merge: user props override computed ARIA
  const finalProps = { ...computedAria, ...props }
  
  return <button {...finalProps}>{props.children}</button>
}
```

---

### 5. Polymorphism Patterns Guide (Documentation)

**File Structure**:
- Research: `docs/POLYMORPHISM_TYPESCRIPT_6_RESEARCH.md`
- Patterns: `docs/POLYMORPHISM_GUIDE.md`
- Known issues: `known-issues.md` (already updated per context)

**Content**:
- Document current `as` prop type narrowing limitation
- 3 recommended patterns with code examples
- TypeScript 6.0+ feasibility assessment
- Design decision rationale

---

## Data Models

### Figma Token Data
```typescript
interface TokenFile {
  filename: string
  tokens: W3cToken[]
  lastSynced?: string
}

interface W3cToken {
  name: string
  value: string | number | boolean
  type: "color" | "dimension" | "font" | "duration" | string
  group?: string
}
```

### Build-Time Plugin Context
```typescript
interface BuildTimePluginContext {
  phase: "pre" | "post"
  component: {
    name: string
    tag: HtmlTagName
    config: ComponentConfig
    metadata: Record<string, unknown>
  }
  codeGen: {
    computedProps: Record<string, unknown>
    injectedAttributes: Record<string, unknown>
    typeAnnotations: Record<string, unknown>
  }
}
```

### Semantic Metadata
```typescript
interface SemanticComponentMetadata {
  "@semantic"?: string // e.g., "button", "link", "navigation"
  "@aria"?: Record<string, string> // ARIA attributes
  "@state"?: Record<string, string> // state → aria-* mappings
}
```

---

## Correctness Properties

### Property 1: Plugin Determinism
- **Claim**: For identical input (config + plugin registry), plugin execution produces identical output
- **Why**: Build reproducibility, caching correctness, deterministic deployment
- **Test**: Run plugin system 2×, compare generated code (must be identical)
- **Validates: Requirements 3**

### Property 2: ARIA Non-Regression
- **Claim**: Components without @semantic metadata render identically before/after
- **Why**: Backward compatibility, no breaking changes
- **Test**: Build both old code + new code, compare dist/ artifacts
- **Validates: Requirements 4**

### Property 3: Token Format Fidelity
- **Claim**: Pull → Serialize → Push → Pull produces identical tokens
- **Why**: Bidirectional sync reliability
- **Test**: Pull tokens → push → pull again → compare (must be identical)
- **Validates: Requirements 1**

### Property 4: Zero-Runtime Overhead
- **Claim**: Generated code contains NO new runtime imports/execution for features
- **Why**: Core value proposition (zero-runtime CSS-in-JS)
- **Test**: Grep generated .js for feature runtime calls (must be zero)
- **Validates: All Requirements**

---

## Error Handling

### Figma Sync Errors
- Missing FIGMA_TOKEN: Clear message with setup instructions
- API errors: Retry + exponential backoff, then informative error
- Invalid format: Validation errors with line numbers

### Plugin System Errors
- Plugin load error: Log warning, skip plugin, continue
- Hook execution error: Catch exception, log, proceed
- Non-blocking: Build completes successfully even if plugin error

### Type Inference Errors
- Invalid metadata: Use sensible defaults, emit warning
- Type generation failure: Fallback to basic types
- Non-blocking: Missing semantic info doesn't break build

---

## Testing Strategy

| Feature | Unit | Integration | E2E |
|---------|------|-------------|-----|
| Figma Sync | ✅ Parse | ✅ CLI flow | ✅ Real Figma |
| Semantic Inference | ✅ Metadata extract | ✅ Type gen | ✅ Generated .d.ts |
| Plugin System | ✅ Hook exec | ✅ Plugin chain | ✅ Multi-plugin |
| Static ARIA | ✅ ARIA map | ✅ Plugin exec | ✅ Generated code ARIA |
| Polymorphism | N/A | N/A | ✅ Doc examples |

---

## Success Criteria

- [ ] All 5 features execute at build-time only (zero runtime code)
- [ ] Generated .js and .d.ts files are 100% static
- [ ] Plugin system has zero runtime overhead
- [ ] ARIA attributes pre-computed in generated code
- [ ] Type inference produces correct type stubs
- [ ] Backward compatibility (existing code unchanged)
- [ ] Tests pass for all 4 core properties (determinism, non-regression, fidelity, zero-runtime)
- [ ] Documentation complete with examples