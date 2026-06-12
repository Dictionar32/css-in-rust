/**
 * Cache Key Generation for Phase 1 Redis Integration
 *
 * Generates deterministic cache keys for CSS compilation results.
 * Format: css-compiler:<file-hash>:<theme-id>:<variant-hash>
 *
 * All hash functions produce 8-character hex strings for efficient key sizing.
 * SHA256 provides excellent collision resistance and determinism.
 */

import { createHash } from "node:crypto"

/**
 * Hash utility using Node.js crypto
 *
 * @param data - String data to hash
 * @param algorithm - Hash algorithm (default: sha256)
 * @returns 8-character hex string
 *
 * @example
 * sha256("bg-red-500") // "a1b2c3d4"
 */
export function sha256(data: string, algorithm: "sha256" | "md5" = "sha256"): string {
  if (!data) return "00000000"
  const hash = createHash(algorithm)
  hash.update(data)
  return hash.digest("hex").slice(0, 8)
}

/**
 * Generate 8-character hash from file content
 *
 * Used to detect when source files change. If file is not read or is empty,
 * returns "00000000" to maintain consistent key format.
 *
 * @param fileContent - Content of the file being compiled
 * @returns 8-character hex string
 *
 * @example
 * generateFileHash("export default { color: 'red' };")  // "f1e2d3c4"
 */
export function generateFileHash(fileContent: string): string {
  if (!fileContent) return "00000000"
  return sha256(fileContent, "sha256")
}

/**
 * Generate 8-character hash from theme configuration
 *
 * Captures the theme ID or theme config to ensure cache keys differ
 * when different themes are used. Handles both theme IDs and full configs.
 *
 * @param themeConfig - Theme ID or theme configuration object/string
 * @returns 8-character hex string
 *
 * @example
 * generateThemeHash("theme-001")            // "c3b4a5f6"
 * generateThemeHash({ colors: { red: "#f00" } })  // Different hash
 */
export function generateThemeHash(
  themeConfig: string | Record<string, unknown> | null | undefined
): string {
  if (!themeConfig) return "00000000"

  let configStr: string
  if (typeof themeConfig === "string") {
    configStr = themeConfig
  } else if (typeof themeConfig === "object") {
    // Sort keys for deterministic output
    configStr = JSON.stringify(themeConfig, Object.keys(themeConfig).sort())
  } else {
    return "00000000"
  }

  return sha256(configStr, "sha256")
}

/**
 * Generate hash from sorted variants
 *
 * Takes an array of variant modifiers and produces a consistent hash
 * regardless of input order. Variants are sorted before hashing to ensure
 * "dark:lg:hover" and "hover:dark:lg" produce the same hash.
 *
 * @param variants - Array of variant strings (e.g., ["dark", "lg", "hover"])
 * @returns 8-character hex string
 *
 * @example
 * generateVariantHash(["dark", "lg", "hover"])  // "b2c3d4e5"
 * generateVariantHash(["hover", "dark", "lg"])  // "b2c3d4e5" (same hash)
 */
export function generateVariantHash(variants: string[] | null | undefined): string {
  if (!variants || variants.length === 0) return "00000000"

  // Sort to ensure deterministic hashing regardless of input order
  const sorted = [...variants].sort()
  const combined = sorted.join(":")

  return sha256(combined, "sha256")
}

/**
 * Main cache key generator
 *
 * Produces the final cache key in format: css-compiler:<file>:<theme>:<variant>
 *
 * @param fileContent - Content of the source file being compiled
 * @param themeConfig - Theme configuration (ID, object, or string)
 * @param variants - Array of CSS variants (responsive, state, etc.)
 * @returns Cache key string
 *
 * @example
 * const key = generateCacheKey(
 *   "export default { button: 'px-4 py-2' }",
 *   "theme-001",
 *   ["dark", "lg", "hover"]
 * )
 * // Returns: "css-compiler:a1b2c3d4:c3b4a5f6:b2c3d4e5"
 */
export function generateCacheKey(
  fileContent: string | null | undefined,
  themeConfig: string | Record<string, unknown> | null | undefined,
  variants: string[] | null | undefined
): string {
  const fileHash = generateFileHash(fileContent ?? "")
  const themeHash = generateThemeHash(themeConfig)
  const variantHash = generateVariantHash(variants)

  return `css-compiler:${fileHash}:${themeHash}:${variantHash}`
}

/**
 * Validate cache key format
 *
 * Ensures a cache key follows the expected format: css-compiler:<8-hex>:<8-hex>:<8-hex>
 * Useful for verifying cache keys before lookup or debugging.
 *
 * @param key - Cache key to validate
 * @returns true if key matches expected format, false otherwise
 *
 * @example
 * validateCacheKey("css-compiler:a1b2c3d4:c3b4a5f6:b2c3d4e5")  // true
 * validateCacheKey("css-compiler:invalid")                     // false
 * validateCacheKey("")                                         // false
 */
export function validateCacheKey(key: string): boolean {
  if (!key || typeof key !== "string") return false

  // Format: css-compiler:<8-hex>:<8-hex>:<8-hex>
  const pattern = /^css-compiler:[0-9a-f]{8}:[0-9a-f]{8}:[0-9a-f]{8}$/i
  return pattern.test(key)
}

/**
 * Extract components from a cache key
 *
 * Parses a valid cache key and returns its components.
 * Returns null if key is invalid or doesn't match expected format.
 *
 * @param key - Cache key to parse
 * @returns Object with fileHash, themeHash, variantHash or null
 *
 * @example
 * const components = parseCacheKey("css-compiler:a1b2c3d4:c3b4a5f6:b2c3d4e5")
 * // { fileHash: "a1b2c3d4", themeHash: "c3b4a5f6", variantHash: "b2c3d4e5" }
 */
export function parseCacheKey(
  key: string
): { fileHash: string; themeHash: string; variantHash: string } | null {
  if (!validateCacheKey(key)) return null

  const parts = key.split(":")
  if (parts.length !== 4) return null

  return {
    fileHash: parts[1],
    themeHash: parts[2],
    variantHash: parts[3],
  }
}
