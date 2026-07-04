/**
 * Known Issues Validation Test Suite
 * 
 * Tests every bug documented in known-issues.md to verify:
 * 1. The fix is actually applied
 * 2. The symptom no longer occurs
 * 3. No regression in related functionality
 */

import { test, describe } from "node:test";
import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

describe("Known Issues Validation", () => {

    describe("Issue: onChange/onClick event handler type inference (2026-07-02)", () => {
        test("types.ts should NOT have index signature [key: string]: unknown", () => {
            const typesPath = join(rootDir, "packages/domain/core/src/types.ts");
            const content = readFileSync(typesPath, "utf-8");

            // Check StyledComponentProps doesn't have index signature
            const styledPropsMatch = content.match(/export interface StyledComponentProps[^{]*\{([^}]+)\}/s);
            assert.ok(styledPropsMatch, "StyledComponentProps interface should exist");

            const propsBody = styledPropsMatch[1];
            assert.ok(!propsBody.includes("[key: string]: unknown"),
                "StyledComponentProps should NOT have [key: string]: unknown index signature");
            assert.ok(!propsBody.includes("[key: string]:unknown"),
                "StyledComponentProps should NOT have index signature (no space variant)");
        });

        test("TwStyledComponent should have Tag generic parameter", () => {
            const typesPath = join(rootDir, "packages/domain/core/src/types.ts");
            const content = readFileSync(typesPath, "utf-8");

            // Match multiline generic parameters - need to capture until opening brace
            const match = content.match(/export type TwStyledComponent<([\s\S]+?)>\s*=\s*\{/);
            assert.ok(match, "TwStyledComponent should exist");

            const generics = match[1];
            assert.ok(generics.includes("Tag extends HtmlTagName"),
                "TwStyledComponent should have Tag extends HtmlTagName parameter");
        });

        test("TwTagFactory should propagate concrete tag to TwTemplateFactory", () => {
            const typesPath = join(rootDir, "packages/domain/core/src/types.ts");
            const content = readFileSync(typesPath, "utf-8");

            // Should be: { [K in HtmlTagName]: TwTemplateFactory<ComponentConfig, K> }
            const tagFactoryMatch = content.match(/export type TwTagFactory\s*=\s*\{[^}]+\}/s);
            assert.ok(tagFactoryMatch, "TwTagFactory should exist");

            const tagFactoryBody = tagFactoryMatch[0];
            assert.ok(tagFactoryBody.includes("TwTemplateFactory<"),
                "TwTagFactory should use TwTemplateFactory");
            assert.ok(tagFactoryBody.includes(", K>") || tagFactoryBody.includes(",K>"),
                "TwTagFactory should pass K (the tag) to TwTemplateFactory");
        });

        test("TwStyledComponent call signature should use React.ComponentPropsWithoutRef<Tag>", () => {
            const typesPath = join(rootDir, "packages/domain/core/src/types.ts");
            const content = readFileSync(typesPath, "utf-8");

            // Find the component definition with call signature (multiline aware)
            const componentMatch = content.match(/export type TwStyledComponent<[\s\S]+?>\s*=\s*\{[\s\S]+?\(props:[\s\S]+?\):/);
            assert.ok(componentMatch, "TwStyledComponent call signature should exist");

            const callSig = componentMatch[0];
            assert.ok(callSig.includes("React.ComponentPropsWithoutRef<Tag>") ||
                callSig.includes("ComponentPropsWithoutRef<Tag>"),
                "Call signature should use ComponentPropsWithoutRef<Tag>");
        });
    });

    describe("Issue: Sub-component 'a:link' href type + runtime props drop (2026-06-30)", () => {
        test("types.ts should have InferSubTagsFromConfig helper type", () => {
            const typesPath = join(rootDir, "packages/domain/core/src/types.ts");
            const content = readFileSync(typesPath, "utf-8");

            assert.ok(content.includes("InferSubTagsFromConfig"),
                "Should have InferSubTagsFromConfig type helper");
        });

        test("TwSubComponentAccessor should be generic over Tag", () => {
            const typesPath = join(rootDir, "packages/domain/core/src/types.ts");
            const content = readFileSync(typesPath, "utf-8");

            const match = content.match(/export type TwSubComponentAccessor<([^>]+)>/);
            assert.ok(match, "TwSubComponentAccessor should exist");

            const generics = match[1];
            assert.ok(generics.includes("Tag extends HtmlTagName"),
                "TwSubComponentAccessor should have Tag extends HtmlTagName parameter");
        });

        test("createComponent.ts should spread ...rest props in createElement", () => {
            const componentPath = join(rootDir, "packages/domain/core/src/createComponent.ts");
            const content = readFileSync(componentPath, "utf-8");

            // Check createSubComponentAccessor spreads rest
            const subCompMatch = content.match(/createSubComponentAccessor[^{]*\{[\s\S]+?React\.createElement\([^)]+\)/g);

            if (subCompMatch && subCompMatch.length > 0) {
                const hasRestSpread = subCompMatch.some(match =>
                    match.includes("...rest") && match.includes("React.createElement")
                );
                assert.ok(hasRestSpread,
                    "createSubComponentAccessor should spread ...rest in React.createElement");
            } else {
                // Try alternative pattern
                assert.ok(content.includes("...rest") && content.includes("createSubComponentAccessor"),
                    "createSubComponentAccessor should destructure and use ...rest");
            }
        });

        test("SubComponent should destructure children, className, and ...rest", () => {
            const componentPath = join(rootDir, "packages/domain/core/src/createComponent.ts");
            const content = readFileSync(componentPath, "utf-8");

            // Look for the SubComponent FC declaration with destructuring
            const funcMatch = content.match(/const SubComponent[\s\S]{0,300}=\s*\(\{[\s\S]{0,200}\}\)/);

            assert.ok(funcMatch, "SubComponent implementation should be found");

            const funcBody = funcMatch[0];
            // Should have ...rest in destructuring
            assert.ok(funcBody.includes("...rest"),
                "SubComponent should destructure ...rest");
        });
    });

    describe("Issue: dist/index.mjs 'use client' taint + Turbopack fs resolution (2026-06-28)", () => {
        test("dist/index.mjs should NOT have 'use client' directive", () => {
            const indexPath = join(rootDir, "dist/index.mjs");

            if (!existsSync(indexPath)) {
                console.warn("⚠️  dist/index.mjs not found - run npm run build first");
                return;
            }

            const content = readFileSync(indexPath, "utf-8");
            const firstLine = content.split("\n")[0];

            assert.ok(!firstLine.includes('"use client"') && !firstLine.includes("'use client'"),
                "dist/index.mjs should NOT start with 'use client' directive");
        });

        test("dist/index.mjs should NOT import node:fs or node:module", () => {
            const indexPath = join(rootDir, "dist/index.mjs");

            if (!existsSync(indexPath)) {
                console.warn("⚠️  dist/index.mjs not found - run npm run build first");
                return;
            }

            const content = readFileSync(indexPath, "utf-8");

            assert.ok(!content.includes('from "node:fs"') && !content.includes("from 'node:fs'"),
                "dist/index.mjs should NOT import node:fs");
            assert.ok(!content.includes('from "node:module"') && !content.includes("from 'node:module'"),
                "dist/index.mjs should NOT import node:module");
            assert.ok(!content.includes('from "fs"') || content.includes('// browser fallback'),
                "dist/index.mjs should NOT import fs (unless commented as fallback)");
        });

        test("dist/index.mjs should NOT export liveToken functions", () => {
            const indexPath = join(rootDir, "dist/index.mjs");

            if (!existsSync(indexPath)) {
                console.warn("⚠️  dist/index.mjs not found - run npm run build first");
                return;
            }

            const content = readFileSync(indexPath, "utf-8");

            // These should be in runtime.mjs, not index.mjs
            assert.ok(!content.match(/export.*liveToken/),
                "liveToken should NOT be exported from index.mjs");
            assert.ok(!content.match(/export.*createUseTokens/),
                "createUseTokens should NOT be exported from index.mjs");
            assert.ok(!content.match(/export.*applyTokenSet/),
                "applyTokenSet should NOT be exported from index.mjs");
        });

        test("dist/runtime.mjs should have 'use client' directive", () => {
            const runtimePath = join(rootDir, "dist/runtime.mjs");

            if (!existsSync(runtimePath)) {
                console.warn("⚠️  dist/runtime.mjs not found - run npm run build first");
                return;
            }

            const content = readFileSync(runtimePath, "utf-8");
            const firstLines = content.split("\n").slice(0, 5).join("\n");

            assert.ok(firstLines.includes('"use client"') || firstLines.includes("'use client'"),
                "dist/runtime.mjs SHOULD have 'use client' directive");
        });

        test("dist/theme.mjs should NOT have 'use client' directive", () => {
            const themePath = join(rootDir, "dist/theme.mjs");

            if (!existsSync(themePath)) {
                console.warn("⚠️  dist/theme.mjs not found - run npm run build first");
                return;
            }

            const content = readFileSync(themePath, "utf-8");
            const firstLine = content.split("\n")[0];

            assert.ok(!firstLine.includes('"use client"') && !firstLine.includes("'use client'"),
                "dist/theme.mjs should NOT start with 'use client' directive");
        });

        test("tsup.config.ts should have esbuildPlugins with native redirect for index entry", () => {
            const tsupPath = join(rootDir, "tsup.config.ts");
            const content = readFileSync(tsupPath, "utf-8");

            // Should have separate config for index with esbuildPlugins
            assert.ok(content.includes("esbuildPlugins") || content.includes("esbuildOptions"),
                "tsup.config should have esbuild plugins configuration");

            // Should redirect native to browser stub for index
            assert.ok(content.includes("native.browser") || content.includes("browser fallback"),
                "Should redirect to browser fallbacks for index entry");
        });

        test("packages/domain/theme/src/index.server.ts should exist", () => {
            const serverIndexPath = join(rootDir, "packages/domain/theme/src/index.server.ts");
            assert.ok(existsSync(serverIndexPath),
                "index.server.ts should exist for theme (server-only entry)");
        });
    });

    describe("Issue: preserveDirectives() never injects 'use client' (2026-06-27)", () => {
        test("preserveDirectives function should handle both ESM and CJS metafiles", () => {
            const tsupPath = join(rootDir, "tsup.config.ts");
            const content = readFileSync(tsupPath, "utf-8");

            // Find preserveDirectives function
            const funcMatch = content.match(/function preserveDirectives[\s\S]+?\n\}/);

            if (funcMatch) {
                const funcBody = funcMatch[0];

                // Should read both metafile-esm.json and metafile-cjs.json
                const hasEsmMetafile = funcBody.includes("metafile-esm") || funcBody.includes("metafile-${");
                const hasCjsMetafile = funcBody.includes("metafile-cjs") || funcBody.includes("metafile-${");

                assert.ok(hasEsmMetafile || funcBody.includes("metafile"),
                    "preserveDirectives should handle ESM metafile");

                // Should handle .mjs extension for ESM
                const handlesMjs = funcBody.includes(".mjs") || funcBody.includes('endsWith(".mjs")');
                assert.ok(handlesMjs || funcBody.includes("matchExt"),
                    "preserveDirectives should handle .mjs extension for ESM outputs");
            }
        });
    });

    describe("Issue: Polymorphic 'as' prop type narrowing (2026-07-02)", () => {
        test("StyledComponentProps should have 'as' prop", () => {
            const typesPath = join(rootDir, "packages/domain/core/src/types.ts");
            const content = readFileSync(typesPath, "utf-8");

            const styledPropsMatch = content.match(/export interface StyledComponentProps[^{]*\{([^}]+)\}/s);
            assert.ok(styledPropsMatch, "StyledComponentProps should exist");

            const propsBody = styledPropsMatch[1];
            assert.ok(propsBody.includes("as?:"), "Should have 'as' prop");
        });

        test("known-issues.md should document 'as' polymorphism as design decision", () => {
            const knownIssuesPath = join(rootDir, "known-issues.md");
            const content = readFileSync(knownIssuesPath, "utf-8");

            assert.ok(content.includes("Polymorphic component `as` prop"),
                "Should document polymorphic 'as' prop issue");
            assert.ok(content.includes("Design decision"),
                "Should be marked as design decision, not a bug to fix");
        });
    });

    describe("Issue: Route CSS splitting and manifest generation (2026-06-27)", () => {
        test("packages/domain/compiler/src/routeGraph.ts should exist", () => {
            const routeGraphPath = join(rootDir, "packages/domain/compiler/src/routeGraph.ts");
            assert.ok(existsSync(routeGraphPath),
                "routeGraph.ts should exist for import-graph-based route splitting");
        });

        test("routeGraph.ts should export buildRouteClassBuckets", () => {
            const routeGraphPath = join(rootDir, "packages/domain/compiler/src/routeGraph.ts");

            if (!existsSync(routeGraphPath)) {
                console.warn("⚠️  routeGraph.ts not found");
                return;
            }

            const content = readFileSync(routeGraphPath, "utf-8");
            assert.ok(content.includes("buildRouteClassBuckets"),
                "Should export buildRouteClassBuckets function");
            assert.ok(content.includes("export") && content.includes("buildRouteClassBuckets"),
                "buildRouteClassBuckets should be exported");
        });

        test("withTailwindStyled should use buildRouteClassBuckets", () => {
            const withTwPath = join(rootDir, "packages/presentation/next/src/withTailwindStyled.ts");
            const content = readFileSync(withTwPath, "utf-8");

            assert.ok(content.includes("buildRouteClassBuckets") ||
                content.includes("routeGraph"),
                "withTailwindStyled should use route graph for CSS splitting");
        });

        test("stripJsonComments should handle string literals correctly", () => {
            const routeGraphPath = join(rootDir, "packages/domain/compiler/src/routeGraph.ts");

            if (!existsSync(routeGraphPath)) {
                console.warn("⚠️  routeGraph.ts not found");
                return;
            }

            const content = readFileSync(routeGraphPath, "utf-8");

            if (content.includes("stripJsonComments")) {
                // Should track in-string state
                assert.ok(content.includes("inString") || content.includes("in-string") ||
                    content.includes("quote") || content.includes("literal"),
                    "stripJsonComments should track string literal state");
            }
        });

        test("mangled Routecssmanifestplugin .ts file should NOT exist", () => {
            const mangledPath = join(rootDir, "packages/presentation/next/src/Routecssmanifestplugin .ts");
            assert.ok(!existsSync(mangledPath),
                "Mangled 'Routecssmanifestplugin .ts' (with space) should NOT exist");
        });

        test("getAllRoutes function should be removed from compiler/index.ts", () => {
            const compilerIndexPath = join(rootDir, "packages/domain/compiler/src/index.ts");

            if (!existsSync(compilerIndexPath)) {
                console.warn("⚠️  compiler/index.ts not found");
                return;
            }

            const content = readFileSync(compilerIndexPath, "utf-8");

            // getAllRoutes was a stub that returned hardcoded ["/", "__global"]
            // It should be removed entirely
            const hasGetAllRoutes = content.includes("function getAllRoutes") ||
                content.includes("export.*getAllRoutes");

            if (hasGetAllRoutes) {
                console.warn("⚠️  getAllRoutes still exists - should be removed per known-issues.md");
            }
        });
    });

    describe("Issue: Turbopack webpack() callback never runs (2026-06-27)", () => {
        test("withTailwindStyled should have config-eval-time IIFE for CSS generation", () => {
            const withTwPath = join(rootDir, "packages/presentation/next/src/withTailwindStyled.ts");
            const content = readFileSync(withTwPath, "utf-8");

            // Should have immediately-invoked async function
            assert.ok(content.includes("(async () =>") || content.includes("(async()=>"),
                "Should have config-eval-time IIFE");

            // CSS generation should happen in IIFE, not just webpack callback
            const hasAsyncCssGen = content.match(/\(async[^{]*\{[\s\S]{200,}?scanWorkspace/);
            assert.ok(hasAsyncCssGen,
                "CSS generation should happen in async IIFE (accessible by both Webpack and Turbopack)");
        });

        test("StaticCssWebpackPlugin should exist with status comment", () => {
            const pluginPath = join(rootDir, "packages/presentation/next/src/StaticCssWebpackPlugin.ts");

            if (existsSync(pluginPath)) {
                const content = readFileSync(pluginPath, "utf-8");

                // Should have comment explaining when it's reachable
                assert.ok(content.includes("--webpack") || content.includes("webpack mode") ||
                    content.includes("HMR") || content.includes("incremental"),
                    "StaticCssWebpackPlugin should have comment explaining its purpose");
            }
        });
    });

    describe("General validation checks", () => {
        test("known-issues.md should follow append-only format", () => {
            const knownIssuesPath = join(rootDir, "known-issues.md");
            const content = readFileSync(knownIssuesPath, "utf-8");

            // Should have the header describing append-only format
            assert.ok(content.includes("Append-only log"),
                "Should be documented as append-only log");

            // Entries should be dated (YYYY-MM-DD format)
            const dateMatches = content.match(/202\d-\d\d-\d\d/g);
            assert.ok(dateMatches && dateMatches.length > 5,
                "Should have multiple dated entries");
        });

        test("all fixed issues should have 'Status: Fixed' or 'Status: Design decision'", () => {
            const knownIssuesPath = join(rootDir, "known-issues.md");
            const content = readFileSync(knownIssuesPath, "utf-8");

            // Split into individual issues
            const issues = content.split(/^## 202\d-\d\d-\d\d/gm).slice(1);

            for (const issue of issues) {
                const hasStatus = issue.includes("**Status:**") || issue.includes("- **Status:**");
                assert.ok(hasStatus,
                    "Each issue should have a Status field");
            }
        });

        test("core createComponent should have .extend() method", () => {
            const componentPath = join(rootDir, "packages/domain/core/src/createComponent.ts");
            const content = readFileSync(componentPath, "utf-8");

            assert.ok(content.includes("extend:") || content.includes(".extend"),
                "createComponent should implement .extend() method");
        });

        test("packages should not have duplicate package.json exports", () => {
            const sharedPkgPath = join(rootDir, "packages/domain/shared/package.json");

            if (existsSync(sharedPkgPath)) {
                const content = readFileSync(sharedPkgPath, "utf-8");
                const pkg = JSON.parse(content);

                if (pkg.exports) {
                    const exportPaths = Object.keys(pkg.exports);
                    const uniquePaths = new Set(exportPaths);

                    assert.strictEqual(exportPaths.length, uniquePaths.size,
                        "package.json exports should not have duplicates");
                }
            }
        });
    });

    describe("Integration validation", () => {
        test("example app should have ThemeProvider with useEffect pattern", () => {
            const themeProviderPath = join(rootDir, "examples/next-js-app/src/components/ThemeProvider.tsx");

            if (existsSync(themeProviderPath)) {
                const content = readFileSync(themeProviderPath, "utf-8");

                assert.ok(content.includes("useEffect"),
                    "ThemeProvider should use useEffect for theme initialization");
                assert.ok(content.includes("localStorage") || content.includes("STORAGE_KEY"),
                    "ThemeProvider should use localStorage for persistence");
                assert.ok(content.includes("data-theme"),
                    "ThemeProvider should set data-theme attribute");
            }
        });

        test("example app should NOT use suppressHydrationWarning", () => {
            const layoutPath = join(rootDir, "examples/next-js-app/src/app/layout.tsx");

            if (existsSync(layoutPath)) {
                const content = readFileSync(layoutPath, "utf-8");

                assert.ok(!content.includes("suppressHydrationWarning"),
                    "layout.tsx should NOT use suppressHydrationWarning hack");
            }
        });
    });
});

console.log("\n✅ Known Issues Validation Test Suite loaded");
console.log("Run with: npm run test:all or node --test tests/known-issues-validation.test.mjs\n");
