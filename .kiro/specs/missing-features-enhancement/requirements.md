# Requirements Document

## Introduction

Spesifikasi requirement untuk implementasi 5 fitur enhancement di tailwind-styled-v4 dengan **strict zero-runtime architecture constraint**. Semua fitur dirancang sebagai pure build-time operations — tidak ada runtime overhead.

**Fitur yang akan diimplementasikan:**

1. **Figma Design Token Sync CLI** - Sync design tokens dari Figma ke codebase via CLI commands (build-time integration)
2. **Semantic Component Type Inference** - Build-time component config analyzer yang auto-generate TypeScript type stubs untuk semantic components
3. **Build-Time Plugin System** - Compose dan generate components at build-time (not runtime)
4. **Static ARIA Attribute Injection** - Analyze component config at build-time, pre-compute ARIA props into generated component files
5. **Polymorphic Component Patterns Guide** - Research & document recommended patterns + add to known-issues.md

**Timeline Estimasi**: 2-3 minggu work (build-time architecture requires careful design)

---

## Glossary

| Term | Definition |
|------|--------|
| Build-Time | Code execution during npm run build (not at runtime) |
| W3C DTCG | Design Tokens Community Group specification for token format |
| Component Config Metadata | Static TypeScript annotations on component (e.g., `@semantic`, `@aria`) |
| Cascade Resolver | Rust-based resolver untuk menentukan final CSS dari class cascade |
| Type Inference | TypeScript compiler feature untuk infer types dari component config |
| Semantic HTML | HTML tag choice that reflects meaning (button, link, nav, etc.) |
| ARIA Attribute | Accessibility markup injected into component props at build-time |

---

## Requirements

### Feature 1: Figma Design Token Sync CLI

**User Story:**
Sebagai design engineer, saya ingin sync Figma design tokens ke codebase saya sehingga component styling tetap in-sync dengan design system (build-time operation).

**Acceptance Criteria:**
1. ✅ Figma CLI commands (`tw figma pull`, `tw figma push`, `tw figma diff`) tersedia via main CLI
2. ✅ Token format mengikuti W3C DTCG specification
3. ✅ Dry-run mode (`--dry-run`) untuk preview sebelum write
4. ✅ Error handling untuk missing env vars (FIGMA_TOKEN, FIGMA_FILE_KEY) jelas
5. ✅ Fallback ke manual token file jika Figma API tidak tersedia
6. ✅ Commands terdaftar di `tw --help` output
7. ✅ Tested dengan real Figma file (E2E smoke test)
8. ✅ **Build-time only**: Executes during build, no runtime JS

**Scope:**
- Move `scripts/v45/figma-sync.ts` → `packages/infrastructure/cli/src/commands/figma.ts`
- Integrate ke CLI command registration
- E2E tests untuk pull/push flows
- Documentation dalam CLI help + README

**Out of Scope:**
- Bidirectional real-time sync (can be added later)
- Figma plugin UI (CLI-only)
- Token transform pipelines (use tokens as-is)

---

### Feature 2: Semantic Component Type Inference

**User Story:**
Sebagai component library author, saya ingin semantic component metadata auto-generate TypeScript type definitions sehingga type safety tetap intact tanpa manual work.

**Acceptance Criteria:**
1. ✅ Build-time analyzer yang extract component config (tag, semantic intent, ARIA metadata)
2. ✅ Generate TypeScript type stub files untuk components dengan correct prop types
3. ✅ Support for component config metadata: `@semantic`, `@aria`, `@state` fields
4. ✅ Zero runtime overhead — all processing at build-time
5. ✅ Type stubs include semantic information untuk IDE intellisense
6. ✅ Works with existing `.extend()` and sub-component patterns
7. ✅ Documentation + examples

**Scope:**
- Create build-time analyzer: `packages/domain/compiler/src/semanticComponentAnalyzer.ts`
- Generate `.d.ts` files alongside `.js` output for semantic components
- Integrate into bundler/tsup pipeline (build-time only)
- Test with real component library examples

**Out of Scope:**
- Runtime type narrowing for `as` prop (separate concern, documented in known-issues)
- Automatic component discovery (user must explicitly mark components)

---

### Feature 3: Build-Time Plugin System

**User Story:**
Sebagai library author, saya ingin compose components at build-time dengan plugin system sehingga dapat auto-inject functionality (ARIA, tokens, logging) tanpa runtime overhead.

**Acceptance Criteria:**
1. ✅ Plugin system dengan build-time lifecycle hooks:
   - `preComponent` - before component code generation
   - `postComponent` - after component created (still build-time)
   - Option untuk attach ke specific component tags
2. ✅ Plugin API jelas dengan TypeScript definitions
3. ✅ Plugins dapat modify component config, metadata sebelum code generation
4. ✅ Multiple plugins dapat chain tanpa conflict
5. ✅ Error handling & validation untuk malformed plugins
6. ✅ Documentation dengan example plugins
7. ✅ Tested dengan 2+ example plugins (accessibility, logging)
8. ✅ **Zero runtime**: All plugin execution at build-time, generated code is static

**Scope:**
- Plugin registration API: `packages/domain/plugin-api/src/buildTimeHooks.ts`
- Plugin engine: `packages/domain/plugin-api/src/pluginEngine.ts`
- Integration into component code generation pipeline
- Example plugins: accessibility, component metadata logging
- Documentation + test fixtures

**Out of Scope:**
- Runtime hooks (pure build-time only)
- Plugin hot-reload
- Plugin marketplace

---

### Feature 4: Static ARIA Attribute Injection

**User Story:**
Sebagai accessible-first developer, saya ingin component saya automatically include correct ARIA attributes berdasarkan semantic intent (injected at build-time).

**Acceptance Criteria:**
1. ✅ Build-time static analysis: semantic tag → ARIA role mapping
   - `button` → `role="button"`, `aria-pressed` for toggle states
   - `input[type=checkbox]` → `role="checkbox"`, `aria-checked`
   - `nav` → `role="navigation"`, `aria-label` from component name
   - Link components → `role="link"`, `aria-current` untuk active state
2. ✅ Component config metadata support:
   - `@semantic: "button"` → auto-set ARIA role
   - `@state: { checked: "aria-checked" }` → auto-set aria-* properties
3. ✅ Do not override explicit ARIA props (user-provided ARIA wins)
4. ✅ Implemented via plugin system (Feature 3)
5. ✅ Documentation + WCAG 2.1 best practices guide
6. ✅ **Build-time only**: All ARIA props pre-computed and embedded in generated component files

**Scope:**
- ARIA semantic mapping module: `packages/domain/plugin-accessibility/src/semanticAriaMaps.ts`
- Build-time ARIA injection plugin: `packages/domain/plugin-accessibility/src/ariaPlugin.ts`
- Component config extension support (@semantic, @aria, @state)
- Integration tests dengan example components
- WCAG best practices documentation

**Out of Scope:**
- Full WCAG audit automation
- Keyboard interaction handlers
- Runtime ARIA state updates (all static)

---

### Feature 5: Polymorphic Component Patterns Guide

**User Story:**
Sebagai component library author, saya ingin understand polymorphic limitations dan best patterns sehingga dapat recommend ke users.

**Acceptance Criteria:**
1. ✅ Research complete: document polymorphic patterns dari Radix UI, Chakra UI, Panda CSS
2. ✅ Document current limitation: `as` prop cannot narrow event handler types (design decision, not bug)
3. ✅ Create 3+ recommended patterns dengan code examples:
   - Pattern 1: `.extend()` for explicit polymorphic variants (recommended)
   - Pattern 2: Semantic component wrappers (Button, ButtonLink, etc.)
   - Pattern 3: `as any` escape hatch with JSDoc (last resort)
4. ✅ TypeScript 6.0+ feasibility assessment
5. ✅ Add documentation: `docs/POLYMORPHISM_GUIDE.md`
6. ✅ Add to known-issues.md as design decision
7. ✅ Code examples per pattern + playground test

**Scope:**
- Research document: TS 6.0 capabilities untuk polymorphic types
- Pattern documentation: 3 recommended alternatives dengan trade-offs
- Code examples: working demos
- known-issues.md entry (already complete per context)

**Out of Scope:**
- Full polymorphic type narrowing implementation (requires major TS refactor)
- Breaking API changes
- Proprietary solution development

---

## Non-Functional Requirements

### Performance
- **Figma sync**: Complete dalam < 5 seconds untuk typical design token file
- **Semantic inference**: < 500ms untuk 100 components
- **ARIA injection**: < 100ms per component (build-time batch operation)
- **Plugin system**: No measurable overhead (all at build-time)

### Compatibility
- Node 20+
- TypeScript 6.0.2+
- npm 11.11.1+

### Build System Integration
- **No runtime JS added**: All features execute at build-time only
- **Tree-shakeable**: Generated code can be dead-code eliminated
- **Type-safe**: Full TypeScript support, zero `any` types in public API
- **Existing build pipeline**: Integrate with existing tsup/turbo setup

### Testing
- Unit tests untuk logic (build-time operations)
- Integration tests untuk plugin system
- E2E tests untuk CLI commands (Figma sync)
- Type checking: `npm run check:types` pass 100%

### Documentation
- JSDoc untuk semua public APIs
- README sections per feature
- Example code dalam docs/
- WCAG accessibility guide

---

## Dependencies & Blocking

| Feature | Dependencies | Blockers |
|---------|--------------|----------|
| Figma Sync | None | ❌ None |
| Semantic Inference | None | ❌ None |
| Build-Time Plugin System | None | ❌ None |
| Static ARIA Injection | Plugin System (#3) | ✅ #3 perlu selesai dulu |
| Polymorphic Guide | Documentation only | ❌ None |

---

## Success Metrics

1. **Figma Sync**: CLI command registered, E2E tested dengan real Figma file
2. **Semantic Inference**: Type stubs generated correctly untuk 5+ components
3. **Plugin System**: 2+ example plugins working, < 100ms overhead per component batch
4. **Static ARIA**: Components render dengan correct ARIA attributes, screen reader recognizes roles
5. **Polymorphism Docs**: Clear patterns documented, devs understand tradeoffs + limitations

---

## Timeline (Estimated)

- **Week 1 (Build-Time Foundation)**:
  - Day 1-2: Figma Sync publishing (CLI integration + tests)
  - Day 3-4: Semantic Type Inference (analyzer + type generation)
  - Day 5: Polymorphism research + documentation

- **Week 2 (Plugin Architecture)**:
  - Day 1-2: Build-Time Plugin System (hooks, engine, integration)
  - Day 3-5: Static ARIA Injection (semantic mapping + plugin + testing)

- **Week 3 (Integration & Polish)**:
  - Day 1-2: Full monorepo testing, integration validation
  - Day 3: Documentation cleanup, CHANGELOG entry
  - Day 4-5: Buffer for refinement

---

## Definition of Done (per Feature)

For each feature:
- [ ] Code written & reviewed (build-time focused)
- [ ] TypeScript checks clean (npm run check:types)
- [ ] Tests pass (unit + integration, zero runtime failures)
- [ ] Documentation complete (README, JSDoc, examples, guides)
- [ ] Build-time integration verified (no runtime JS added)
- [ ] CHANGELOG entry added
- [ ] No regressions in existing tests
- [ ] Zero runtime overhead validated
