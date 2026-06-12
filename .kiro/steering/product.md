# Product Overview

## What is tailwind-styled-v4?

**tailwind-styled-v4** is a Rust-powered CSS-in-JS library for React that combines the developer experience of styled-components with the performance of Tailwind CSS v4.

### Core Value Proposition

- **Zero Runtime CSS Injection**: CSS generated at build time via Rust engine, not at runtime
- **Type-Safe Variants**: Full TypeScript inference for component variants and states
- **Styled-Components DX**: Familiar syntax (`tw.button`, template literals, object config)
- **Tailwind v4 Engine**: Full Tailwind CSS v4 compatibility
- **Framework Agnostic**: Works with Next.js, Vite, Rspack, Vue, Svelte
- **No SSR Mismatch**: Deterministic output prevents hydration warnings

### Key Features

1. **Component Creation APIs**
   - Template literals: `tw.button\`px-4 py-2\``
   - Object config with variants: `tw.button({ variants, defaultVariants })`
   - Sub-components: `Card.header`, `Card.footer`
   - `.extend()` inheritance: `PrimaryButton = Button.extend(...)`

2. **Advanced Type System**
   - Variant type inference from config
   - Sub-component name extraction (tag prefix stripping)
   - Strict TypeScript for template literals via `.withSub<T>()`
   - No `any` types in public API

3. **Performance**
   - Rust parser: ~425× faster than JS-based scanning
   - Cache backends: LRU, Redis, adaptive, persistent
   - Streaming CSS generation
   - ~4.5KB runtime (browser bundle)

4. **Enterprise Ready**
   - Monorepo structure with 17+ packages
   - Comprehensive test coverage (545+ tests passing)
   - Property-based testing for correctness
   - Multi-tier caching infrastructure

### Target Users

- **React developers** wanting better DX than Tailwind utility classes
- **Design system teams** building component libraries
- **Teams migrating** from styled-components to Tailwind
- **Performance-conscious** projects (zero runtime overhead)

### Competitive Position

| Aspect | tailwind-styled-v4 | styled-components | Tailwind | Panda CSS |
|--------|---|---|---|---|
| Build-time CSS | ✅ | ❌ | ✅ | ✅ |
| Runtime JS | ~0 | ~15KB | ~0 | ~0 |
| Variants API | ✅ | Limited | ❌ | ✅ |
| SSR/RSC Support | ✅ | ⚠️ | ✅ | ✅ |
| TypeScript Support | ✅ Full | Partial | ✅ | ✅ |
| Rust Engine | ✅ | ❌ | ❌ | ❌ |
| DevTools Readable | ✅ | ❌ | ✅ | ✅ |

### Current Phase (Phase 7)

Focus on modularization, testing, and export organization:
- Modularized NAPI bridges (11 focused modules)
- Property-based testing framework (6 core properties)
- Variant precedence system with caching
- Theme resolver pool with multi-tier caching
- Comprehensive integration test coverage

### Version Info

- **Current Version**: 5.0.12
- **Node Requirement**: >=20
- **Rust Requirement**: >=1.75 (for building from source)
- **Package Manager**: npm 11.11.1
