# Kilo Agent Instructions

This project uses native-first architecture for CSS-in-Rust (tailwind-styled-v4).

## Architecture

- Native Rust parser engine with napi-rs bindings
- Zero-runtime CSS compilation - static extraction at build time
- Variant system with compound variants (cva-style)
- Styled-components integration with Tailwind CSS v4
- Plugin ecosystem for extensibility

## Build & Check Commands

- `npm run build` - Full build (rust + packages + tsup)
- `npm run check` - Type check, boundaries, umbrella exports
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Fix code style

## Source Structure

- `src/` - Main source entry points
- `packages/domain/` - Core logic, types, validation
- `packages/infrastructure/` - Native bindings, Rust integration
- `packages/presentation/` - Runtime, styling, CSS generation
- `native/` - Rust native modules

## Rules

- Never edit `dist/` or generated output
- Fix generators, not generated files
- Prioritize native Rust implementations over JS fallbacks
- Run `npm run check` before completing work