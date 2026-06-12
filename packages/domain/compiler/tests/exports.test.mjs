/**
 * Export Organization Tests (R7)
 * 
 * Verify that all sub-entry points are properly exported and accessible.
 */

import { test } from "node:test"
import assert from "node:assert"

test("Main entry point exports all functions", async () => {
  const main = await import("@tailwind-styled/compiler")
  
  // Verify main entry has the key functions
  assert(typeof main.getNativeBridge === "function", "Should export getNativeBridge")
  assert(typeof main.transformSource === "function", "Should export transformSource")
  assert(typeof main.parseClasses === "function", "Should export parseClasses")
  assert(typeof main.extractAllClasses === "function", "Should export extractAllClasses")
})

test("Compiler sub-entry exports CSS generation functions", async () => {
  const compiler = await import("@tailwind-styled/compiler/compiler")
  
  assert(typeof compiler.generateCssNative === "function", "Should export generateCssNative")
  assert(typeof compiler.compileCssNative2 === "function", "Should export compileCssNative2")
})

test("Parser sub-entry exports parsing functions", async () => {
  const parser = await import("@tailwind-styled/compiler/parser")
  
  assert(typeof parser.parseClasses === "function", "Should export parseClasses")
  assert(typeof parser.extractClassesFromSource === "function", "Should export extractClassesFromSource")
  assert(typeof parser.normalizeClasses === "function", "Should export normalizeClasses")
})

test("Analyzer sub-entry exports analysis functions", async () => {
  const analyzer = await import("@tailwind-styled/compiler/analyzer")
  
  assert(typeof analyzer.detectDeadCode === "function", "Should export detectDeadCode")
  assert(typeof analyzer.analyzeClassesNative === "function", "Should export analyzeClassesNative")
  assert(typeof analyzer.resolveVariants === "function", "Should export resolveVariants")
})

test("Cache sub-entry exports cache functions", async () => {
  const cache = await import("@tailwind-styled/compiler/cache")
  
  assert(typeof cache.getCacheStatistics === "function", "Should export getCacheStatistics")
  assert(typeof cache.clearAllCaches === "function", "Should export clearAllCaches")
})

test("Redis sub-entry exports Redis functions", async () => {
  const redis = await import("@tailwind-styled/compiler/redis")
  
  assert(typeof redis.redisPing === "function", "Should export redisPing")
  assert(typeof redis.redisGet === "function", "Should export redisGet")
  assert(typeof redis.redisSet === "function", "Should export redisSet")
})

test("Watch sub-entry exports watch functions", async () => {
  const watch = await import("@tailwind-styled/compiler/watch")
  
  assert(typeof watch.startWatch === "function", "Should export startWatch")
  assert(typeof watch.stopWatch === "function", "Should export stopWatch")
  assert(typeof watch.getWatchStats === "function", "Should export getWatchStats")
})

test("Internal entry point re-exports functions", async () => {
  const internal = await import("@tailwind-styled/compiler/internal")
  
  assert(typeof internal.transformSource === "function", "Should export transformSource")
  assert(typeof internal.extractClassesFromSource === "function", "Should export extractClassesFromSource")
  assert(typeof internal.parseClasses === "function", "Should export parseClasses")
})
