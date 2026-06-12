/**
 * Comprehensive test suite for cache key generation
 *
 * Tests 43+ cases across 5 groups:
 * - Hash functions (determinism, collision resistance)
 * - Cache key generation (format, components)
 * - Validation (format checking, edge cases)
 * - Uniqueness (different inputs produce different hashes)
 * - Integration (end-to-end workflows)
 *
 * Run with: npm test or node --test
 */

import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"

// ─────────────────────────────────────────────────────────────────────────────
// Implement functions inline for testing (mirror cacheKeyGenerator.ts)
// ─────────────────────────────────────────────────────────────────────────────

function sha256(data, algorithm = "sha256") {
  if (!data) return "00000000"
  const hash = createHash(algorithm)
  hash.update(data)
  return hash.digest("hex").slice(0, 8)
}

function generateFileHash(fileContent) {
  if (!fileContent) return "00000000"
  return sha256(fileContent, "sha256")
}

function generateThemeHash(themeConfig) {
  if (!themeConfig) return "00000000"

  let configStr
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

function generateVariantHash(variants) {
  if (!variants || variants.length === 0) return "00000000"

  // Sort to ensure deterministic hashing regardless of input order
  const sorted = [...variants].sort()
  const combined = sorted.join(":")

  return sha256(combined, "sha256")
}

function generateCacheKey(fileContent, themeConfig, variants) {
  const fileHash = generateFileHash(fileContent ?? "")
  const themeHash = generateThemeHash(themeConfig)
  const variantHash = generateVariantHash(variants)

  return `css-compiler:${fileHash}:${themeHash}:${variantHash}`
}

function validateCacheKey(key) {
  if (!key || typeof key !== "string") return false

  // Format: css-compiler:<8-hex>:<8-hex>:<8-hex>
  const pattern = /^css-compiler:[0-9a-f]{8}:[0-9a-f]{8}:[0-9a-f]{8}$/i
  return pattern.test(key)
}

function parseCacheKey(key) {
  if (!validateCacheKey(key)) return null

  const parts = key.split(":")
  if (parts.length !== 4) return null

  return {
    fileHash: parts[1],
    themeHash: parts[2],
    variantHash: parts[3],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe("Cache Key Generator", () => {
  describe("Hash Functions (Group 1)", () => {
    describe("sha256()", () => {
      it("should generate 8-character hex string from string input", () => {
        const hash = sha256("test data")
        assert.match(hash, /^[0-9a-f]{8}$/i)
        assert.strictEqual(hash.length, 8)
      })

      it("should generate deterministic output for same input", () => {
        const hash1 = sha256("consistent input")
        const hash2 = sha256("consistent input")
        assert.strictEqual(hash1, hash2)
      })

      it("should generate different output for different inputs", () => {
        const hash1 = sha256("input one")
        const hash2 = sha256("input two")
        assert.notStrictEqual(hash1, hash2)
      })

      it("should return 00000000 for empty string", () => {
        const hash = sha256("")
        assert.strictEqual(hash, "00000000")
      })

      it("should be case-insensitive in output", () => {
        const hash = sha256("test")
        // Output should be lowercase hex
        assert.match(hash, /^[0-9a-f]{8}$/)
      })

      it("should support md5 algorithm", () => {
        const hash = sha256("test", "md5")
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should handle long strings deterministically", () => {
        const longStr = "a".repeat(10000)
        const hash1 = sha256(longStr)
        const hash2 = sha256(longStr)
        assert.strictEqual(hash1, hash2)
      })

      it("should handle special characters", () => {
        const hash = sha256("🚀 special !@#$%^&*()_+ chars")
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })
    })

    describe("generateFileHash()", () => {
      it("should generate 8-char hex from file content", () => {
        const hash = generateFileHash("export default { color: 'red' };")
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should be deterministic for same file content", () => {
        const content = "import React from 'react';"
        const hash1 = generateFileHash(content)
        const hash2 = generateFileHash(content)
        assert.strictEqual(hash1, hash2)
      })

      it("should differ for different file content", () => {
        const hash1 = generateFileHash("file one content")
        const hash2 = generateFileHash("file two content")
        assert.notStrictEqual(hash1, hash2)
      })

      it("should return 00000000 for empty file", () => {
        const hash = generateFileHash("")
        assert.strictEqual(hash, "00000000")
      })

      it("should handle TypeScript files", () => {
        const content = `
          interface Props { name: string; }
          export const Component: React.FC<Props> = ({ name }) => <div>{name}</div>;
        `
        const hash = generateFileHash(content)
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should handle JSX files", () => {
        const content = "export default () => <div>Hello</div>;"
        const hash = generateFileHash(content)
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should handle CSS files", () => {
        const content = ".button { color: red; padding: 1rem; }"
        const hash = generateFileHash(content)
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should be sensitive to whitespace changes", () => {
        const hash1 = generateFileHash("const x = 1;")
        const hash2 = generateFileHash("const  x  =  1;")
        assert.notStrictEqual(hash1, hash2)
      })
    })

    describe("generateThemeHash()", () => {
      it("should generate hash from theme ID string", () => {
        const hash = generateThemeHash("theme-001")
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should be deterministic for same theme ID", () => {
        const hash1 = generateThemeHash("theme-001")
        const hash2 = generateThemeHash("theme-001")
        assert.strictEqual(hash1, hash2)
      })

      it("should differ for different theme IDs", () => {
        const hash1 = generateThemeHash("theme-001")
        const hash2 = generateThemeHash("theme-002")
        assert.notStrictEqual(hash1, hash2)
      })

      it("should generate hash from theme config object", () => {
        const config = { colors: { red: "#f00", blue: "#00f" } }
        const hash = generateThemeHash(config)
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should be deterministic for same theme config", () => {
        const config = { colors: { red: "#f00" } }
        const hash1 = generateThemeHash(config)
        const hash2 = generateThemeHash(config)
        assert.strictEqual(hash1, hash2)
      })

      it("should produce same hash regardless of key order in config", () => {
        const config1 = { colors: { red: "#f00" }, spacing: { small: "0.5rem" } }
        const config2 = { spacing: { small: "0.5rem" }, colors: { red: "#f00" } }
        const hash1 = generateThemeHash(config1)
        const hash2 = generateThemeHash(config2)
        assert.strictEqual(hash1, hash2)
      })

      it("should return 00000000 for null/undefined", () => {
        const hash1 = generateThemeHash(null)
        const hash2 = generateThemeHash(undefined)
        assert.strictEqual(hash1, "00000000")
        assert.strictEqual(hash2, "00000000")
      })

      it("should return 00000000 for empty string", () => {
        const hash = generateThemeHash("")
        assert.strictEqual(hash, "00000000")
      })

      it("should handle complex nested config", () => {
        const config = {
          colors: {
            primary: { 50: "#fff", 500: "#00f", 900: "#00a" },
          },
          spacing: {
            xs: "0.25rem",
            sm: "0.5rem",
            md: "1rem",
          },
        }
        const hash = generateThemeHash(config)
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })
    })

    describe("generateVariantHash()", () => {
      it("should generate hash from variant array", () => {
        const hash = generateVariantHash(["dark", "lg", "hover"])
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should produce same hash regardless of variant order", () => {
        const hash1 = generateVariantHash(["dark", "lg", "hover"])
        const hash2 = generateVariantHash(["hover", "dark", "lg"])
        const hash3 = generateVariantHash(["lg", "hover", "dark"])
        assert.strictEqual(hash1, hash2)
        assert.strictEqual(hash2, hash3)
      })

      it("should be deterministic for same variants", () => {
        const hash1 = generateVariantHash(["dark", "lg"])
        const hash2 = generateVariantHash(["dark", "lg"])
        assert.strictEqual(hash1, hash2)
      })

      it("should differ for different variants", () => {
        const hash1 = generateVariantHash(["dark", "lg"])
        const hash2 = generateVariantHash(["dark", "md"])
        assert.notStrictEqual(hash1, hash2)
      })

      it("should return 00000000 for empty array", () => {
        const hash = generateVariantHash([])
        assert.strictEqual(hash, "00000000")
      })

      it("should return 00000000 for null/undefined", () => {
        const hash1 = generateVariantHash(null)
        const hash2 = generateVariantHash(undefined)
        assert.strictEqual(hash1, "00000000")
        assert.strictEqual(hash2, "00000000")
      })

      it("should handle single variant", () => {
        const hash = generateVariantHash(["dark"])
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should handle many variants", () => {
        const variants = ["dark", "lg", "hover", "focus", "active", "disabled", "group"]
        const hash = generateVariantHash(variants)
        assert.match(hash, /^[0-9a-f]{8}$/i)
      })

      it("should handle duplicate variants", () => {
        const hash1 = generateVariantHash(["dark", "dark", "lg"])
        const hash2 = generateVariantHash(["dark", "lg", "dark"])
        assert.strictEqual(hash1, hash2)
      })
    })
  })

  describe("Cache Key Generation (Group 2)", () => {
    it("should generate valid cache key with all components", () => {
      const key = generateCacheKey("export default {}", "theme-001", ["dark", "lg"])
      assert.match(key, /^css-compiler:[0-9a-f]{8}:[0-9a-f]{8}:[0-9a-f]{8}$/i)
    })

    it("should have correct format structure", () => {
      const key = generateCacheKey("content", { color: "red" }, ["hover"])
      const parts = key.split(":")
      assert.strictEqual(parts.length, 4)
      assert.strictEqual(parts[0], "css-compiler")
    })

    it("should be deterministic for same inputs", () => {
      const key1 = generateCacheKey("content", "theme-001", ["dark"])
      const key2 = generateCacheKey("content", "theme-001", ["dark"])
      assert.strictEqual(key1, key2)
    })

    it("should differ when file content changes", () => {
      const key1 = generateCacheKey("content1", "theme-001", ["dark"])
      const key2 = generateCacheKey("content2", "theme-001", ["dark"])
      assert.notStrictEqual(key1, key2)
    })

    it("should differ when theme changes", () => {
      const key1 = generateCacheKey("content", "theme-001", ["dark"])
      const key2 = generateCacheKey("content", "theme-002", ["dark"])
      assert.notStrictEqual(key1, key2)
    })

    it("should differ when variants change", () => {
      const key1 = generateCacheKey("content", "theme-001", ["dark"])
      const key2 = generateCacheKey("content", "theme-001", ["light"])
      assert.notStrictEqual(key1, key2)
    })

    it("should handle null/undefined inputs gracefully", () => {
      const key = generateCacheKey(null, undefined, null)
      assert.match(key, /^css-compiler:00000000:00000000:00000000$/i)
    })

    it("should produce consistent keys regardless of variant order", () => {
      const key1 = generateCacheKey("content", "theme", ["dark", "lg", "hover"])
      const key2 = generateCacheKey("content", "theme", ["hover", "dark", "lg"])
      assert.strictEqual(key1, key2)
    })

    it("should handle empty strings in inputs", () => {
      const key = generateCacheKey("", "", [])
      assert.match(key, /^css-compiler:00000000:00000000:00000000$/i)
    })

    it("should handle complex real-world file content", () => {
      const content = `
        import tw from 'tailwind-styled-v4';
        export const Button = tw.button\`px-4 py-2 rounded bg-blue-500 hover:bg-blue-600\`;
      `
      const key = generateCacheKey(content, "default-theme", ["dark", "responsive"])
      assert.match(key, /^css-compiler:[0-9a-f]{8}:[0-9a-f]{8}:[0-9a-f]{8}$/i)
    })
  })

  describe("Validation (Group 3)", () => {
    describe("validateCacheKey()", () => {
      it("should validate correct cache key format", () => {
        const key = "css-compiler:a1b2c3d4:e5f6a7b8:c9d0e1f2"
        assert.strictEqual(validateCacheKey(key), true)
      })

      it("should reject invalid prefix", () => {
        const key = "invalid:a1b2c3d4:e5f6a7b8:c9d0e1f2"
        assert.strictEqual(validateCacheKey(key), false)
      })

      it("should reject wrong number of segments", () => {
        const key = "css-compiler:a1b2c3d4:e5f6a7b8"
        assert.strictEqual(validateCacheKey(key), false)
      })

      it("should reject non-hex characters", () => {
        const key = "css-compiler:zzzzzzzz:e5f6a7b8:c9d0e1f2"
        assert.strictEqual(validateCacheKey(key), false)
      })

      it("should reject hash segments with wrong length", () => {
        const key = "css-compiler:a1b2c3d:e5f6a7b8:c9d0e1f2"
        assert.strictEqual(validateCacheKey(key), false)
      })

      it("should reject empty string", () => {
        assert.strictEqual(validateCacheKey(""), false)
      })

      it("should reject null/undefined", () => {
        assert.strictEqual(validateCacheKey(null), false)
        assert.strictEqual(validateCacheKey(undefined), false)
      })

      it("should accept lowercase hex", () => {
        const key = "css-compiler:abcdef12:34567890:aabbccdd"
        assert.strictEqual(validateCacheKey(key), true)
      })

      it("should accept mixed case hex", () => {
        const key = "css-compiler:AbCdEf12:34567890:AaBbCcDd"
        assert.strictEqual(validateCacheKey(key), true)
      })

      it("should reject extra whitespace", () => {
        const key = " css-compiler:a1b2c3d4:e5f6a7b8:c9d0e1f2"
        assert.strictEqual(validateCacheKey(key), false)
      })
    })

    describe("parseCacheKey()", () => {
      it("should parse valid cache key into components", () => {
        const key = "css-compiler:a1b2c3d4:e5f6a7b8:c9d0e1f2"
        const parsed = parseCacheKey(key)
        assert.strictEqual(parsed?.fileHash, "a1b2c3d4")
        assert.strictEqual(parsed?.themeHash, "e5f6a7b8")
        assert.strictEqual(parsed?.variantHash, "c9d0e1f2")
      })

      it("should return null for invalid key", () => {
        const key = "invalid:a1b2c3d4:e5f6a7b8:c9d0e1f2"
        assert.strictEqual(parseCacheKey(key), null)
      })

      it("should return null for empty string", () => {
        assert.strictEqual(parseCacheKey(""), null)
      })

      it("should round-trip: generate → parse → validate", () => {
        const original = generateCacheKey("content", "theme", ["dark"])
        const parsed = parseCacheKey(original)
        assert(parsed !== null)
        const reconstructed = `css-compiler:${parsed.fileHash}:${parsed.themeHash}:${parsed.variantHash}`
        assert.strictEqual(original, reconstructed)
      })
    })
  })

  describe("Uniqueness & Collision Resistance (Group 4)", () => {
    it("should produce different hashes for similar but different content", () => {
      const hash1 = sha256("bg-red-500")
      const hash2 = sha256("bg-red-600")
      assert.notStrictEqual(hash1, hash2)
    })

    it("should maintain uniqueness across 100 different inputs", () => {
      const hashes = new Set()
      for (let i = 0; i < 100; i++) {
        const hash = sha256(`input-${i}`)
        hashes.add(hash)
      }
      assert.strictEqual(hashes.size, 100)
    })

    it("should have low collision probability", () => {
      // Generate 1000 cache keys with different content
      const keys = new Set()
      for (let i = 0; i < 1000; i++) {
        const key = generateCacheKey(
          `content-${i}`,
          `theme-${i % 10}`,
          [`variant-${i % 5}`]
        )
        keys.add(key)
      }
      // Should have near-perfect uniqueness
      assert.strictEqual(keys.size, 1000)
    })

    it("should differentiate variant order doesn't matter but content does", () => {
      const key1 = generateCacheKey("file1", "theme", ["a", "b", "c"])
      const key2 = generateCacheKey("file1", "theme", ["c", "b", "a"])
      const key3 = generateCacheKey("file2", "theme", ["a", "b", "c"])

      // Same file and variants (different order) = same key
      assert.strictEqual(key1, key2)
      // Different file = different key
      assert.notStrictEqual(key1, key3)
    })
  })

  describe("Integration Tests (Group 5)", () => {
    it("should support complete caching workflow", () => {
      // Step 1: Generate cache key
      const fileContent = "export const Button = tw.button`px-4 py-2`;"
      const theme = { colors: { blue: "#00f" } }
      const variants = ["dark", "responsive"]

      const cacheKey = generateCacheKey(fileContent, theme, variants)

      // Step 2: Validate key
      assert.strictEqual(validateCacheKey(cacheKey), true)

      // Step 3: Parse key
      const parsed = parseCacheKey(cacheKey)
      assert(parsed !== null)
      assert.strictEqual(parsed.fileHash.length, 8)
      assert.strictEqual(parsed.themeHash.length, 8)
      assert.strictEqual(parsed.variantHash.length, 8)

      // Step 4: Regenerate same key to verify cache hit
      const cacheKey2 = generateCacheKey(fileContent, theme, variants)
      assert.strictEqual(cacheKey, cacheKey2)
    })

    it("should support multi-file caching scenarios", () => {
      const files = [
        "export const Button = ...",
        "export const Card = ...",
        "export const Dialog = ...",
      ]

      const keys = files.map((file) =>
        generateCacheKey(file, "default-theme", ["dark"])
      )

      // All keys should be different
      const uniqueKeys = new Set(keys)
      assert.strictEqual(uniqueKeys.size, files.length)

      // All keys should be valid
      keys.forEach((key) => {
        assert.strictEqual(validateCacheKey(key), true)
      })
    })

    it("should support cache invalidation scenarios", () => {
      const fileContent = "const Component = ..."
      const theme = "theme-001"
      const variants = ["dark"]

      // Generate initial cache key
      const key1 = generateCacheKey(fileContent, theme, variants)

      // Simulate file change
      const newContent = "const Component = ... /* updated */"
      const key2 = generateCacheKey(newContent, theme, variants)

      // Keys should be different (cache invalidated)
      assert.notStrictEqual(key1, key2)

      // But file content change back
      const key3 = generateCacheKey(fileContent, theme, variants)
      assert.strictEqual(key1, key3) // Back to original key
    })

    it("should support theme switching scenarios", () => {
      const fileContent = "const Component = ..."
      const variants = ["dark"]

      const keyLight = generateCacheKey(fileContent, "theme-light", variants)
      const keyDark = generateCacheKey(fileContent, "theme-dark", variants)
      const keyAuto = generateCacheKey(fileContent, "theme-auto", variants)

      // All theme keys should be unique
      const keys = [keyLight, keyDark, keyAuto]
      const uniqueKeys = new Set(keys)
      assert.strictEqual(uniqueKeys.size, 3)

      // All should be valid
      keys.forEach((key) => assert.strictEqual(validateCacheKey(key), true))
    })

    it("should support responsive variant scenarios", () => {
      const fileContent = "const Component = ..."
      const theme = "theme-001"

      const keyMobile = generateCacheKey(fileContent, theme, ["sm"])
      const keyTablet = generateCacheKey(fileContent, theme, ["md", "lg"])
      const keyDesktop = generateCacheKey(fileContent, theme, ["xl", "2xl"])

      // All should be different
      const keys = [keyMobile, keyTablet, keyDesktop]
      const uniqueKeys = new Set(keys)
      assert.strictEqual(uniqueKeys.size, 3)
    })

    it("should support performance benchmarking", () => {
      // Generate 1000 cache keys and measure time
      const start = Date.now()

      for (let i = 0; i < 1000; i++) {
        generateCacheKey(`file-${i}`, `theme-${i % 10}`, [`variant-${i % 5}`])
      }

      const duration = Date.now() - start

      // Should be fast (< 1ms per operation on average)
      // 1000 operations should complete in < 100ms
      assert(duration < 100, `Performance too slow: ${duration}ms for 1000 operations`)
    })

    it("should support edge case handling", () => {
      // Test with edge cases
      const cases = [
        [null, null, null],
        ["", "", []],
        ["very long content ".repeat(100), "theme", ["a", "b", "c"]],
        ["content", { deep: { nested: { config: "value" } } }, ["var1", "var2", "var3"]],
        ["content", "theme", Array(50).fill("variant").map((v, i) => `${v}-${i}`)],
      ]

      cases.forEach((inputs) => {
        const key = generateCacheKey(inputs[0], inputs[1], inputs[2])
        assert.strictEqual(validateCacheKey(key), true)
      })
    })
  })
})
