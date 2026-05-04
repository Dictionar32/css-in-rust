/**
 * Browser-safe entry point untuk tailwind-styled-v4.
 * Tidak mengandung node built-ins (fs, module, crypto, path, url).
 * Native Rust binding tidak diload — semua class resolution sudah
 * di-pre-compute di build time oleh server/compiler.
 *
 * PENTING: pakai relative import langsung ke TS source, BUKAN package import
 * "@tailwind-styled/core/browser". Package import akan lewat exports map di
 * core/package.json -> resolve ke dist compiled yang sudah mengandung
 * `import * as fs from 'fs'`. Relative import bypass exports map sepenuhnya.
 */
export * from "../../packages/domain/core/src/index.browser"