/**
 * Fallback Logic Testing (Requirement 8)
 * 
 * Verifies that when the native binary is unavailable (simulated via TWS_NO_NATIVE=1),
 * all 130+ NAPI-exposed wrapper functions behave gracefully—either degrading to JS
 * fallbacks or throwing the detailed, actionable NATIVE_UNAVAILABLE_MESSAGE.
 */

import { test } from "node:test"
import assert from "node:assert"

// Force native resolution failure BEFORE importing packages
process.env.TWS_NO_NATIVE = "1"
process.env.TWS_NO_RUST = "1"

// Helper to assert function throws native unavailable error
function assertThrowsNativeUnavailable(fn, name) {
  assert.throws(
    fn,
    (err) => {
      const isUnavailable = err.message.includes("Native binding is required but not available") || 
                            err.message.includes("Native binding") ||
                            err.message.includes("not available")
      if (!isUnavailable) {
        console.error(`[FAIL] ${name} threw unexpected error:`, err.message)
      }
      return isUnavailable
    },
    `Function '${name}' should throw NATIVE_UNAVAILABLE_MESSAGE`
  )
}

// Helper to assert async function rejects with native unavailable error
async function assertRejectsNativeUnavailable(promiseOrFn, name) {
  const fn = typeof promiseOrFn === "function" ? promiseOrFn : () => promiseOrFn
  await assert.rejects(
    fn,
    (err) => {
      const isUnavailable = err.message.includes("Native binding is required but not available") ||
                            err.message.includes("Native binding") ||
                            err.message.includes("not available")
      if (!isUnavailable) {
        console.error(`[FAIL] ${name} rejected with unexpected error:`, err.message)
      }
      return isUnavailable
    },
    `Async function '${name}' should reject with NATIVE_UNAVAILABLE_MESSAGE`
  )
}

// ── TEST CATEGORY 1: PURE JS UTILITIES (Should NOT throw) ───────────────────

test("Pure JS utilities work without native binary", async () => {
  const { 
    shouldSkipFile, 
    fileToRoute, 
    injectClientDirective, 
    injectServerOnlyComment, 
    loadSafelist, 
    loadTailwindConfig, 
    getContentPaths 
  } = await import("@tailwind-styled/compiler")

  assert.strictEqual(shouldSkipFile("node_modules/react/index.js"), true)
  assert.strictEqual(shouldSkipFile("src/components/Button.tsx"), false)
  
  assert.strictEqual(fileToRoute("app/about/page.tsx"), "/about")
  assert.strictEqual(fileToRoute("app/layout.tsx"), "__global")
  
  assert.strictEqual(injectClientDirective("const x = 1;"), '"use client";\nconst x = 1;')
  assert.strictEqual(injectServerOnlyComment("const x = 1;"), '/* @server-only */\nconst x = 1;')
  
  assert.deepStrictEqual(loadSafelist("non-existent-safelist-file.json"), [])
  assert.deepStrictEqual(loadTailwindConfig("non-existent-dir"), {})
  
  const paths = getContentPaths("project-dir")
  assert.ok(Array.isArray(paths.content), "Content paths should be an array")
})

// ── TEST CATEGORY 2: MAIN ENTRY CORE COMPILER FUNCTIONS ─────────────────────

test("Core compiler functions throw native unavailable error", async () => {
  const { 
    transformSource, 
    hasTwUsage, 
    isAlreadyTransformed, 
    compileCssFromClasses, 
    buildStyleTag, 
    generateCssForClasses, 
    eliminateDeadCss, 
    runElimination, 
    getAllRoutes, 
    getBucketEngine, 
    classifyNode, 
    detectConflicts, 
    bucketSort, 
    analyzeFile, 
    analyzeClasses 
  } = await import("@tailwind-styled/compiler")

  assertThrowsNativeUnavailable(() => transformSource("source"), "transformSource")
  assertThrowsNativeUnavailable(() => hasTwUsage("source"), "hasTwUsage")
  assertThrowsNativeUnavailable(() => isAlreadyTransformed("source"), "isAlreadyTransformed")
  assertThrowsNativeUnavailable(() => compileCssFromClasses(["bg-red-500"]), "compileCssFromClasses")
  assertThrowsNativeUnavailable(() => buildStyleTag(["bg-red-500"]), "buildStyleTag")
  assertThrowsNativeUnavailable(() => eliminateDeadCss(".x { color: red; }", new Set(["x"])), "eliminateDeadCss")
  assertThrowsNativeUnavailable(() => runElimination(".x { color: red; }", {}), "runElimination")
  assertThrowsNativeUnavailable(() => getAllRoutes(), "getAllRoutes")
  assertThrowsNativeUnavailable(() => getBucketEngine(), "getBucketEngine")
  assertThrowsNativeUnavailable(() => classifyNode({}), "classifyNode")
  assertThrowsNativeUnavailable(() => detectConflicts([]), "detectConflicts")
  assertThrowsNativeUnavailable(() => bucketSort([]), "bucketSort")
  assertThrowsNativeUnavailable(() => analyzeFile("source", "file.js"), "analyzeFile")
  assertThrowsNativeUnavailable(() => analyzeClasses("[]", ".", 0), "analyzeClasses")
  
  await assertRejectsNativeUnavailable(generateCssForClasses(["bg-red-500"]), "generateCssForClasses")
})

// ── TEST CATEGORY 3: COMPILER SUB-ENTRY FUNCTIONS ───────────────────────────

test("Compiler sub-entry NAPI wrappers throw native unavailable error", async () => {
  const compiler = await import("@tailwind-styled/compiler/compiler")

  await assertRejectsNativeUnavailable(() => compiler.generateCssNative([], "{}"), "generateCssNative")
  assertThrowsNativeUnavailable(() => compiler.getCacheStats(), "getCacheStats")
  assertThrowsNativeUnavailable(() => compiler.compileCssNative2([], ""), "compileCssNative2")
  assertThrowsNativeUnavailable(() => compiler.compileCssLightning([]), "compileCssLightning")
  assertThrowsNativeUnavailable(() => compiler.extractTwStateConfigsNative(""), "extractTwStateConfigsNative")
  assertThrowsNativeUnavailable(() => compiler.generateStaticStateCssNative([], null), "generateStaticStateCssNative")
  assertThrowsNativeUnavailable(() => compiler.extractAndGenerateStateCssNative(""), "extractAndGenerateStateCssNative")
  assertThrowsNativeUnavailable(() => compiler.layoutClassesToCss(""), "layoutClassesToCss")
  assertThrowsNativeUnavailable(() => compiler.hashContent("", "fnv", 6), "hashContent")
  assertThrowsNativeUnavailable(() => compiler.extractTwContainerConfigs(""), "extractTwContainerConfigs")
  assertThrowsNativeUnavailable(() => compiler.parseAtomicClass(""), "parseAtomicClass")
  assertThrowsNativeUnavailable(() => compiler.generateAtomicCss(""), "generateAtomicCss")
  assertThrowsNativeUnavailable(() => compiler.toAtomicClasses(""), "toAtomicClasses")
  assertThrowsNativeUnavailable(() => compiler.clearAtomicRegistry(), "clearAtomicRegistry")
  assertThrowsNativeUnavailable(() => compiler.atomicRegistrySize(), "atomicRegistrySize")
  
  // Custom API compiler wrappers
  assertThrowsNativeUnavailable(() => compiler.generateCss(""), "generateCss")
  assertThrowsNativeUnavailable(() => compiler.generateCssBatch(""), "generateCssBatch")
  assertThrowsNativeUnavailable(() => compiler.compileClass(""), "compileClass")
  assertThrowsNativeUnavailable(() => compiler.compileClasses([]), "compileClasses")
  assertThrowsNativeUnavailable(() => compiler.compileToCss("", false), "compileToCss")
  assertThrowsNativeUnavailable(() => compiler.compileToCssBatch([], false), "compileToCssBatch")
  assertThrowsNativeUnavailable(() => compiler.minifyCss(""), "minifyCss")
  assertThrowsNativeUnavailable(() => compiler.compileAnimation("", "", ""), "compileAnimation")
  assertThrowsNativeUnavailable(() => compiler.compileKeyframes("", ""), "compileKeyframes")
  assertThrowsNativeUnavailable(() => compiler.compileTheme("", "", ""), "compileTheme")
  assertThrowsNativeUnavailable(() => compiler.twMerge(""), "twMerge")
  assertThrowsNativeUnavailable(() => compiler.twMergeMany([]), "twMergeMany")
  assertThrowsNativeUnavailable(() => compiler.twMergeWithSeparator("", {}), "twMergeWithSeparator")
  assertThrowsNativeUnavailable(() => compiler.twMergeManyWithSeparator([], {}), "twMergeManyWithSeparator")
  assertThrowsNativeUnavailable(() => compiler.twMergeRaw([]), "twMergeRaw")

  // ID Registry wrappers
  assertThrowsNativeUnavailable(() => compiler.idRegistryCreate(), "idRegistryCreate")
  assertThrowsNativeUnavailable(() => compiler.idRegistryGenerate(0, ""), "idRegistryGenerate")
  assertThrowsNativeUnavailable(() => compiler.idRegistryLookup(0, ""), "idRegistryLookup")
  assertThrowsNativeUnavailable(() => compiler.idRegistryNext(0), "idRegistryNext")
  assertThrowsNativeUnavailable(() => compiler.idRegistryDestroy(0), "idRegistryDestroy")
  assertThrowsNativeUnavailable(() => compiler.idRegistryReset(0), "idRegistryReset")
  assertThrowsNativeUnavailable(() => compiler.idRegistrySnapshot(0), "idRegistrySnapshot")
  assertThrowsNativeUnavailable(() => compiler.idRegistryActiveCount(), "idRegistryActiveCount")
  assertThrowsNativeUnavailable(() => compiler.registerPropertyName(""), "registerPropertyName")
  assertThrowsNativeUnavailable(() => compiler.registerValueName(""), "registerValueName")
  assertThrowsNativeUnavailable(() => compiler.propertyIdToString(0), "propertyIdToString")
  assertThrowsNativeUnavailable(() => compiler.valueIdToString(0), "valueIdToString")
  assertThrowsNativeUnavailable(() => compiler.reverseLookupProperty(0), "reverseLookupProperty")
  assertThrowsNativeUnavailable(() => compiler.reverseLookupValue(0), "reverseLookupValue")
  assertThrowsNativeUnavailable(() => compiler.idRegistryExport(0), "idRegistryExport")
  assertThrowsNativeUnavailable(() => compiler.idRegistryImport(""), "idRegistryImport")

  // Streaming wrappers
  assertThrowsNativeUnavailable(() => compiler.processFileChange(""), "processFileChange")
  assertThrowsNativeUnavailable(() => compiler.computeIncrementalDiff("", ""), "computeIncrementalDiff")
  assertThrowsNativeUnavailable(() => compiler.createFingerprint("", ""), "createFingerprint")
  assertThrowsNativeUnavailable(() => compiler.injectStateHash("", ""), "injectStateHash")
  assertThrowsNativeUnavailable(() => compiler.pruneStaleCacheEntries(0, 0), "pruneStaleCacheEntries")
  assertThrowsNativeUnavailable(() => compiler.rebuildWorkspaceResult(""), "rebuildWorkspaceResult")
  assertThrowsNativeUnavailable(() => compiler.scanFileNative("", ""), "scanFileNative")
  assertThrowsNativeUnavailable(() => compiler.scanFilesBatchNative(""), "scanFilesBatchNative")
})

// ── TEST CATEGORY 4: PARSER SUB-ENTRY FUNCTIONS ─────────────────────────────

test("Parser sub-entry NAPI wrappers throw native unavailable error", async () => {
  const parser = await import("@tailwind-styled/compiler/parser")

  assertThrowsNativeUnavailable(() => parser.parseClasses(""), "parseClasses")
  assertThrowsNativeUnavailable(() => parser.extractAllClasses(""), "extractAllClasses")
  assertThrowsNativeUnavailable(() => parser.extractClassesFromSource(""), "extractClassesFromSource")
  assertThrowsNativeUnavailable(() => parser.astExtractClasses("", ""), "astExtractClasses")
  assertThrowsNativeUnavailable(() => parser.normalizeClasses(""), "normalizeClasses")
  assertThrowsNativeUnavailable(() => parser.mergeClassesStatic(""), "mergeClassesStatic")
  assertThrowsNativeUnavailable(() => parser.normalizeAndDedupClasses(""), "normalizeAndDedupClasses")
  assertThrowsNativeUnavailable(() => parser.extractComponentUsage(""), "extractComponentUsage")
  assertThrowsNativeUnavailable(() => parser.batchExtractClasses([]), "batchExtractClasses")
  assertThrowsNativeUnavailable(() => parser.checkAgainstSafelist([], []), "checkAgainstSafelist")
  assertThrowsNativeUnavailable(() => parser.diffClassLists([], []), "diffClassLists")
})

// ── TEST CATEGORY 5: ANALYZER SUB-ENTRY FUNCTIONS ───────────────────────────

test("Analyzer sub-entry NAPI wrappers throw native unavailable error", async () => {
  const analyzer = await import("@tailwind-styled/compiler/analyzer")

  assertThrowsNativeUnavailable(() => analyzer.detectDeadCode("", ""), "detectDeadCode")
  assertThrowsNativeUnavailable(() => analyzer.analyzeClassUsageNative([], "", ""), "analyzeClassUsageNative")
  assertThrowsNativeUnavailable(() => analyzer.analyzeClassesNative("", ""), "analyzeClassesNative")
  assertThrowsNativeUnavailable(() => analyzer.analyzeRscNative("", ""), "analyzeRscNative")
  assertThrowsNativeUnavailable(() => analyzer.optimizeCssNative(""), "optimizeCssNative")
  assertThrowsNativeUnavailable(() => analyzer.processTailwindCssLightning(""), "processTailwindCssLightning")
  assertThrowsNativeUnavailable(() => analyzer.eliminateDeadCssNative("", []), "eliminateDeadCssNative")
  assertThrowsNativeUnavailable(() => analyzer.hoistComponentsNative(""), "hoistComponentsNative")
  assertThrowsNativeUnavailable(() => analyzer.compileVariantTableNative(""), "compileVariantTableNative")
  assertThrowsNativeUnavailable(() => analyzer.classifyAndSortClassesNative([]), "classifyAndSortClassesNative")
  assertThrowsNativeUnavailable(() => analyzer.mergeCssDeclarationsNative([]), "mergeCssDeclarationsNative")

  // Theme resolution
  assertThrowsNativeUnavailable(() => analyzer.resolveVariants(""), "resolveVariants")
  assertThrowsNativeUnavailable(() => analyzer.validateThemeConfig(""), "validateThemeConfig")
  assertThrowsNativeUnavailable(() => analyzer.resolveCascade("", ""), "resolveCascade")
  assertThrowsNativeUnavailable(() => analyzer.resolveClassNames([], ""), "resolveClassNames")
  assertThrowsNativeUnavailable(() => analyzer.resolveConflictGroup("", ""), "resolveConflictGroup")
  assertThrowsNativeUnavailable(() => analyzer.resolveThemeValue("", ""), "resolveThemeValue")
  assertThrowsNativeUnavailable(() => analyzer.resolveSimpleVariants(""), "resolveSimpleVariants")

  // Scanner
  assertThrowsNativeUnavailable(() => analyzer.scanWorkspace(""), "scanWorkspace")
  assertThrowsNativeUnavailable(() => analyzer.extractClassesFromSourceNative(""), "extractClassesFromSourceNative")
  assertThrowsNativeUnavailable(() => analyzer.batchExtractClassesNative([]), "batchExtractClassesNative")
  assertThrowsNativeUnavailable(() => analyzer.checkAgainstSafelistNative([], []), "checkAgainstSafelistNative")
  assertThrowsNativeUnavailable(() => analyzer.scanFile(""), "scanFile")
  assertThrowsNativeUnavailable(() => analyzer.collectFiles(""), "collectFiles")
  assertThrowsNativeUnavailable(() => analyzer.walkAndPrefilterSourceFiles(""), "walkAndPrefilterSourceFiles")
  assertThrowsNativeUnavailable(() => analyzer.generateSubComponentTypes(""), "generateSubComponentTypes")

  // Memory & Week 6 Profiling
  assertThrowsNativeUnavailable(() => analyzer.getWeek6FeaturesStatus(), "getWeek6FeaturesStatus")
  assertThrowsNativeUnavailable(() => analyzer.getMemoryStatsNative(), "getMemoryStatsNative")
  assertThrowsNativeUnavailable(() => analyzer.getMemoryRecommendationsNative(), "getMemoryRecommendationsNative")
  assertThrowsNativeUnavailable(() => analyzer.estimateOptimalCacheConfigNative("typical", 100), "estimateOptimalCacheConfigNative")
  assertThrowsNativeUnavailable(() => analyzer.resetMemoryStats(), "resetMemoryStats")
})

// ── TEST CATEGORY 6: CACHE SUB-ENTRY FUNCTIONS ──────────────────────────────

test("Cache sub-entry NAPI wrappers throw native unavailable error", async () => {
  const cache = await import("@tailwind-styled/compiler/cache")

  assertThrowsNativeUnavailable(() => cache.getCacheStatistics(), "getCacheStatistics")
  assertThrowsNativeUnavailable(() => cache.clearAllCaches(), "clearAllCaches")
  assertThrowsNativeUnavailable(() => cache.clearParseCache(), "clearParseCache")
  assertThrowsNativeUnavailable(() => cache.clearResolveCache(), "clearResolveCache")
  assertThrowsNativeUnavailable(() => cache.clearCompileCache(), "clearCompileCache")
  assertThrowsNativeUnavailable(() => cache.clearCssGenCache(), "clearCssGenCache")
  assertThrowsNativeUnavailable(() => cache.getCacheOptimizationHints(), "getCacheOptimizationHints")
  assertThrowsNativeUnavailable(() => cache.estimateOptimalCacheConfig(0, ""), "estimateOptimalCacheConfig")
  assertThrowsNativeUnavailable(() => cache.cacheRead(""), "cacheRead")
  assertThrowsNativeUnavailable(() => cache.cacheWrite("", []), "cacheWrite")
  assertThrowsNativeUnavailable(() => cache.cachePriority(0, 0, 0), "cachePriority")
  assertThrowsNativeUnavailable(() => cache.getResolverPoolStats(), "getResolverPoolStats")
  assertThrowsNativeUnavailable(() => cache.clearResolverPool(), "clearResolverPool")
  assertThrowsNativeUnavailable(() => cache.resolveColorCached(1, "red", "{}"), "resolveColorCached")
  assertThrowsNativeUnavailable(() => cache.resolveSpacingCached(1, "4", "{}"), "resolveSpacingCached")
  assertThrowsNativeUnavailable(() => cache.resolveFontSizeCached(1, "sm", "{}"), "resolveFontSizeCached")
  assertThrowsNativeUnavailable(() => cache.resetResolverPoolStats(), "resetResolverPoolStats")
})

// ── TEST CATEGORY 7: REDIS SUB-ENTRY FUNCTIONS ──────────────────────────────

test("Redis sub-entry NAPI wrappers throw native unavailable error", async () => {
  const redis = await import("@tailwind-styled/compiler/redis")

  assertThrowsNativeUnavailable(() => redis.redisPing(), "redisPing")
  assertThrowsNativeUnavailable(() => redis.redisGet(""), "redisGet")
  assertThrowsNativeUnavailable(() => redis.redisSet("", ""), "redisSet")
  assertThrowsNativeUnavailable(() => redis.redisDelete(""), "redisDelete")
  assertThrowsNativeUnavailable(() => redis.redisExists(""), "redisExists")
  assertThrowsNativeUnavailable(() => redis.redisMget([]), "redisMget")
  assertThrowsNativeUnavailable(() => redis.redisMset([]), "redisMset")
  assertThrowsNativeUnavailable(() => redis.redisFlushDb(), "redisFlushDb")
  assertThrowsNativeUnavailable(() => redis.redisFlushAll(), "redisFlushAll")
  assertThrowsNativeUnavailable(() => redis.redisPoolConnect("", 0), "redisPoolConnect")
  assertThrowsNativeUnavailable(() => redis.redisPoolStats(), "redisPoolStats")
  assertThrowsNativeUnavailable(() => redis.redisPoolReconnect(), "redisPoolReconnect")
  assertThrowsNativeUnavailable(() => redis.redisEnableCluster([]), "redisEnableCluster")
  assertThrowsNativeUnavailable(() => redis.redisDisableCluster(), "redisDisableCluster")
  assertThrowsNativeUnavailable(() => redis.redisClusterStatus(), "redisClusterStatus")
  assertThrowsNativeUnavailable(() => redis.redisSubscribe(""), "redisSubscribe")
  assertThrowsNativeUnavailable(() => redis.redisPublish("", ""), "redisPublish")
  assertThrowsNativeUnavailable(() => redis.redisExpirationSet("", 0), "redisExpirationSet")
  assertThrowsNativeUnavailable(() => redis.redisExpirationGet(""), "redisExpirationGet")
  assertThrowsNativeUnavailable(() => redis.redisInfo(), "redisInfo")
  assertThrowsNativeUnavailable(() => redis.redisMonitor(), "redisMonitor")
  assertThrowsNativeUnavailable(() => redis.redisCacheSize(), "redisCacheSize")
  assertThrowsNativeUnavailable(() => redis.redisCacheKeyCount(), "redisCacheKeyCount")
  assertThrowsNativeUnavailable(() => redis.redisCacheClear(), "redisCacheClear")
  assertThrowsNativeUnavailable(() => redis.redisCacheHitRate(), "redisCacheHitRate")
  assertThrowsNativeUnavailable(() => redis.redisEnablePersistence(""), "redisEnablePersistence")
  assertThrowsNativeUnavailable(() => redis.redisDisablePersistence(), "redisDisablePersistence")
  assertThrowsNativeUnavailable(() => redis.redisSnapshot(), "redisSnapshot")
  assertThrowsNativeUnavailable(() => redis.redisMemoryStats(), "redisMemoryStats")
  assertThrowsNativeUnavailable(() => redis.redisOptimizeMemory(), "redisOptimizeMemory")
  assertThrowsNativeUnavailable(() => redis.redisSetEvictionPolicy(""), "redisSetEvictionPolicy")
  assertThrowsNativeUnavailable(() => redis.redisGetEvictionPolicy(), "redisGetEvictionPolicy")
  assertThrowsNativeUnavailable(() => redis.redisReplicate("", 0), "redisReplicate")
  assertThrowsNativeUnavailable(() => redis.redisReplicationStatus(), "redisReplicationStatus")
  assertThrowsNativeUnavailable(() => redis.redisCacheSync([]), "redisCacheSync")
  assertThrowsNativeUnavailable(() => redis.redisEnableCacheWarming(""), "redisEnableCacheWarming")
  assertThrowsNativeUnavailable(() => redis.redisDisableCacheWarming(), "redisDisableCacheWarming")
  assertThrowsNativeUnavailable(() => redis.redisDiagnose(), "redisDiagnose")
})

// ── TEST CATEGORY 8: WATCH SUB-ENTRY FUNCTIONS ──────────────────────────────

test("Watch sub-entry NAPI wrappers throw native unavailable error", async () => {
  const watch = await import("@tailwind-styled/compiler/watch")

  assertThrowsNativeUnavailable(() => watch.startWatch(""), "startWatch")
  assertThrowsNativeUnavailable(() => watch.pollWatchEvents(0), "pollWatchEvents")
  assertThrowsNativeUnavailable(() => watch.stopWatch(0), "stopWatch")
  assertThrowsNativeUnavailable(() => watch.watchAddPattern(0, ""), "watchAddPattern")
  assertThrowsNativeUnavailable(() => watch.watchRemovePattern(0, ""), "watchRemovePattern")
  assertThrowsNativeUnavailable(() => watch.watchGetActiveHandles(), "watchGetActiveHandles")
  assertThrowsNativeUnavailable(() => watch.watchClearAll(), "watchClearAll")
  assertThrowsNativeUnavailable(() => watch.watchEventTypeToString(0), "watchEventTypeToString")
  assertThrowsNativeUnavailable(() => watch.isWatchRunning(0), "isWatchRunning")
  assertThrowsNativeUnavailable(() => watch.getWatchStats(), "getWatchStats")
  assertThrowsNativeUnavailable(() => watch.watchPause(0), "watchPause")
  assertThrowsNativeUnavailable(() => watch.watchResume(0), "watchResume")
  assertThrowsNativeUnavailable(() => watch.scanCacheOptimizations(), "scanCacheOptimizations")
  assertThrowsNativeUnavailable(() => watch.getPluginHooks(), "getPluginHooks")
  assertThrowsNativeUnavailable(() => watch.registerPluginHook("", ""), "registerPluginHook")
  assertThrowsNativeUnavailable(() => watch.unregisterPluginHook("", ""), "unregisterPluginHook")
  assertThrowsNativeUnavailable(() => watch.emitPluginHook("", ""), "emitPluginHook")
  assertThrowsNativeUnavailable(() => watch.getCompilationMetrics(), "getCompilationMetrics")
  assertThrowsNativeUnavailable(() => watch.resetCompilationMetrics(), "resetCompilationMetrics")
  assertThrowsNativeUnavailable(() => watch.validateCssOutput(""), "validateCssOutput")
  assertThrowsNativeUnavailable(() => watch.getCompilerDiagnostics(), "getCompilerDiagnostics")
})
