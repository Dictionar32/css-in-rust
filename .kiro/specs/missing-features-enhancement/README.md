# Spec: Implementasi 5 Fitur Enhancement untuk tailwind-styled-v4

## 📋 Overview

Spec ini merencanakan implementasi 5 fitur enhancement yang akan meningkatkan developer experience dan functionality tailwind-styled-v4:

1. **Figma Plugin Sync Publishing** - CLI untuk sync design tokens dari Figma
2. **Console Debug Visual Utility** - Browser console helper untuk inspect Tailwind class breakdown
3. **Plugin Hook System** - Lifecycle hooks untuk plugin ecosystem
4. **Accessibility Auto-ARIA** - Auto-generate ARIA attributes based on semantic intent
5. **Polymorphism Documentation** - Research + guide untuk `as` prop type narrowing limitations

## 🎯 Quick Links

- **[requirements.md](./requirements.md)** - User stories, acceptance criteria, scope per feature
- **[design.md](./design.md)** - Technical architecture, implementation patterns, integration points
- **[tasks.md](./tasks.md)** - Breakdown task-by-task dengan wave scheduling

## ⏱️ Timeline

**Total Effort**: ~2 minggu work

- **Week 1 (5 hari)**: Quick wins (Figma, Console Debug, Polymorphism Docs) - parallel execution
- **Week 2 (5 hari)**: Medium-term (Plugin System Day 1-2, Auto-ARIA Day 3-5)

### Wave Structure
```
Wave 1: Figma Sync, Console Debug, Polymorphism Docs (Parallel - Day 1-5)
Wave 2: Plugin Hook System Foundation (Day 6-7)
Wave 3: ARIA Plugin Implementation (Day 8-10)
Wave 4: Testing, Docs, Release prep (Day 11-12)
```

## 🏗️ Architecture

### Dependency Graph
```
Independent:
  ✅ Figma Sync Publishing
  ✅ Console Debug Utility  
  ✅ Polymorphism Documentation

Sequential:
  ✅ Plugin Hook System → ✅ Auto-ARIA Plugin
```

### File Changes Summary
```
NEW PACKAGES:
  packages/domain/plugin-accessibility/  (ARIA plugin)

NEW MODULES:
  packages/infrastructure/cli/src/commands/figma.ts
  packages/domain/runtime/src/debugConsole.ts
  packages/domain/plugin-api/src/hooks.ts
  packages/domain/plugin-api/src/pluginEngine.ts
  native/src/infrastructure/napi_bridge_debug.rs

MODIFIED:
  packages/domain/core/src/createComponent.ts (add hook calls)
  packages/domain/core/src/types.ts (add @semantic/@aria/@state)
  known-issues.md (polymorphism entry)

DOCUMENTATION:
  docs/POLYMORPHISM_GUIDE.md
  docs/POLYMORPHISM_TYPESCRIPT_6_RESEARCH.md
  docs/ACCESSIBILITY_GUIDE.md
  docs/NEW_FEATURES_v5.1.md
```

## 📊 Feature Comparison

| Feature | Effort | Impact | Blocker | Priority |
|---------|--------|--------|---------|----------|
| Figma Sync | 1 day | HIGH | ❌ None | 🔴 High |
| Console Debug | 1 day | MEDIUM | ❌ None | 🟡 Medium |
| Polymorphism Docs | 1 day | MEDIUM | ❌ None | 🟡 Medium |
| Plugin Hook System | 2 days | HIGH | ✅ For ARIA | 🔴 High |
| Auto-ARIA | 3 days | HIGH | ✅ Needs #3 | 🔴 High |

## 🚀 Getting Started

### For Implementation
1. Review [requirements.md](./requirements.md) for acceptance criteria
2. Review [design.md](./design.md) for architecture details
3. Start with [tasks.md](./tasks.md) - execute Wave 1 tasks first
4. Each task has clear acceptance criteria and references

### For Code Review
1. Check Wave completion checklist in [tasks.md](./tasks.md)
2. Verify each task against acceptance criteria
3. Run: `npm run test:all`, `npm run check:types`, `npm run lint`
4. Review documentation updates

## 📝 Files Structure

```
.kiro/specs/missing-features-enhancement/
├── README.md              (this file)
├── .config.kiro           (spec metadata)
├── requirements.md        (user stories + acceptance)
├── design.md              (technical architecture)
└── tasks.md               (implementation tasks)
```

## ✅ Success Metrics

### By Feature
- **Figma Sync**: `tw figma pull/push/diff` commands work end-to-end
- **Console Debug**: `tw.debug.inspect()` outputs readable breakdown
- **Plugin Hooks**: Example plugins execute without errors
- **Auto-ARIA**: Screen reader recognizes injected ARIA roles
- **Polymorphism Docs**: Clear patterns documented with working examples

### Overall
- [ ] All tests pass (existing + new)
- [ ] TypeScript validation clean
- [ ] Zero breaking changes to public API
- [ ] Documentation complete and helpful
- [ ] Ready for release

## 🔗 Related

- **Previous Work**: Theme Persistence feature (packages/domain/theme/)
- **Event Type Inference**: Bugfix for polymorphic component types (styled-component-event-type-inference spec)
- **Known Issues**: polymorphic component `as` prop limitation (known-issues.md)

## 📌 Notes

- **Polymorphism is a design decision**: The `as` prop limitation is documented as a trade-off, not a bug. Full type-safe polymorphism requires overloads or complex types - not worth the complexity.
- **Plugin system is foundation**: Once formalized, it enables many future enhancements (tokens, logging, validation, etc.)
- **ARIA plugin is first use case**: Demonstrates plugin system power and provides immediate accessibility benefit
- **Figma sync is plug-n-play**: Script already mature, just needs move to CLI + testing

## 🤔 FAQ

**Q: Why not implement polymorphism type safety now?**
A: It requires either 100+ overloads or complex conditional types (TS 6.0+). Current design (patterns approach) is clearer and less maintenance burden. Can revisit with future TS versions.

**Q: Can features be done out of order?**
A: Figma, Console Debug, and Polymorphism Docs are independent. Plugin System + Auto-ARIA must be sequential (ARIA depends on hooks). Don't start ARIA before plugin system is complete.

**Q: What's the breaking change risk?**
A: Very low. All features are additive (new exports, new commands, new packages). `@semantic/@aria/@state` metadata on ComponentConfig is optional. No existing code breaks.

**Q: How's performance impact?**
A: Negligible. Plugin hooks run at build-time (component creation), zero runtime overhead. Console debug is dev-only. Native bridge calls (ARIA, inspect) use existing infrastructure.

---

**Spec Created**: 2026-07-02  
**Status**: Ready for implementation  
**Next Steps**: Start Wave 1 tasks (Figma Sync, Console Debug, Polymorphism Docs parallel)
