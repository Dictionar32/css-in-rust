/**
 * Centralized hash utilities — Rust-only via NAPI binding.
 *
 * Uses Rust FNV/MD5/SHA256 for superior performance.
 * No Node.js crypto fallback - fail fast if native binding unavailable.
 *
 * Native functions:
 *   hashContent → native/src/application/hashing.rs :: hash_content()
 *   hashFile    → native/src/application/hashing.rs :: hash_file()
 */

import { loadNativeBinding, resolveNativeBindingCandidates, resolveRuntimeDir } from "./nativeBinding"

// ─────────────────────────────────────────────────────────────────────────────
// Native binding type
// ─────────────────────────────────────────────────────────────────────────────

interface NativeHashBinding {
  hashContent(content: string, algorithm: "md5" | "sha256" | "fnv" | null, length: number | null): string
  hashFile(filePath: string, algorithm: "md5" | "sha256" | "fnv" | null, length: number | null): string
}

const isHashBinding = (mod: unknown): mod is NativeHashBinding => {
  const m = mod as Partial<NativeHashBinding> | null | undefined
  return typeof m?.hashContent === "function" && typeof m?.hashFile === "function"
}

// ─────────────────────────────────────────────────────────────────────────────
// Lazy singleton
// ─────────────────────────────────────────────────────────────────────────────

let _bindingCache: NativeHashBinding | null | "unloaded" = "unloaded"

function getNativeHashBinding(): NativeHashBinding | null {
  if (_bindingCache !== "unloaded") return _bindingCache
  try {
    const runtimeDir = resolveRuntimeDir(
      typeof __dirname === "string" ? __dirname : undefined,
      import.meta.url
    )
    const candidates = resolveNativeBindingCandidates({
      runtimeDir,
      envVarNames: ["TWS_NATIVE_PATH"],
    })
    const { binding } = loadNativeBinding<NativeHashBinding>({
      runtimeDir,
      candidates,
      isValid: isHashBinding,
      invalidExportMessage: "Module loaded but missing `hashContent` / `hashFile` exports.",
    })
    _bindingCache = binding ?? null
  } catch {
    _bindingCache = null
  }
  return _bindingCache
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API - Rust-only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hash sebuah string konten → hex string pendek.
 *
 * @param content   String yang akan di-hash
 * @param algorithm "md5" (default) | "sha256" | "fnv"
 * @param length    Panjang output (default 8)
 *
 * @example
 * hashContent("bg-red-500 p-4")        // "a1b2c3d4"
 * hashContent("bg-red-500", "fnv", 16) // full 16-char FNV-1a hex
 */
export function hashContent(content: string, algorithm = "md5", length = 8): string {
  const native = getNativeHashBinding()
  if (!native) {
    throw new Error(
      "FATAL: Rust hash binding (hashContent) is required but not available. " +
      "Ensure native binding is properly loaded. Check that native/.node binary exists."
    )
  }
  return native.hashContent(content, algorithm as "md5" | "sha256" | "fnv", length)
}

/**
 * Hash isi sebuah file → hex string pendek.
 *
 * Returns `"00000000"` jika file tidak bisa dibaca.
 *
 * @example
 * hashFile("/project/src/app/page.tsx")       // "a1b2c3d4"
 * hashFile("/project/theme.ts", "fnv", 16)    // full FNV-1a hex
 */
export function hashFile(filePath: string, algorithm = "md5", length = 8): string {
  const native = getNativeHashBinding()
  if (!native) {
    throw new Error(
      "FATAL: Rust hash binding (hashFile) is required but not available. " +
      "Ensure native binding is properly loaded. Check that native/.node binary exists."
    )
  }
  return native.hashFile(filePath, algorithm as "md5" | "sha256" | "fnv", length)
}