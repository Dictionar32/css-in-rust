/**
 * Browser-safe entry point untuk tailwind-styled-v4.
 * Tidak mengandung node built-ins (fs, module, crypto, path, url).
 * Native Rust binding tidak diload — semua class resolution sudah
 * di-pre-compute di build time oleh server/compiler.
 */
export * from "@tailwind-styled/core/browser"