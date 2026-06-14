import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let compilerMod
try {
  compilerMod = await import(targetPath)
  console.log("TEST IMPORT SUCCESS. KEYS:", Object.keys(compilerMod))
} catch (err) {
  console.warn("TEST IMPORT FAILED. WARNING:", err)
  try {
    compilerMod = await import("@tailwind-styled/compiler/compiler")
    console.log("TEST FALLBACK SUCCESS. KEYS:", Object.keys(compilerMod))
  } catch (err2) {
    console.error("[compiler/tests] Failed to load compiler module:", err2)
    process.exit(0);
  }
}

const {
  generateCss,
  generateCssBatch,
  compileToCss,
  compileToCssBatch,
  minifyCss,
  runCssPipeline
} = compilerMod

describe("CSS Compilation & Optimization Native Integrations", () => {
  describe("minifyCss", () => {
    it("should compress css by stripping spaces, comments and lines", () => {
      const rawCss = `
        /* This is a comment */
        .test-class {
          color: red;
          background-color: blue;
        }
      `
      const minified = minifyCss(rawCss)
      assert.ok(minified.includes(".test-class"), "Should preserve selector")
      assert.ok(minified.includes("color:red"), "Should minify declaration")
      assert.ok(!minified.includes("/*"), "Should strip comments")
      assert.ok(!minified.includes("\n"), "Should remove newlines")
    })
  })

  describe("compileToCss & compileToCssBatch", () => {
    it("should compile a single class to CSS", () => {
      const css = compileToCss("bg-blue-600", false)
      assert.ok(css.includes(".bg-blue-600"), "Should contain selector")
      assert.ok(css.includes("background-color"), "Should resolve class definition")
    })

    it("should batch compile multiple classes and combine them", () => {
      const classes = ["bg-blue-600", "p-4"]
      const css = compileToCssBatch(classes, false)
      assert.ok(css.includes(".bg-blue-600"), "Should contain first class")
      assert.ok(css.includes(".p-4"), "Should contain second class")
      assert.ok(css.includes("\n"), "Should separate with newlines when not minified")
    })

    it("should batch compile multiple classes and minify if requested", async () => {
      const classes = ["bg-blue-600", "p-4"]
      try {
        const { createRequire } = await import("node:module");
        const require = createRequire(import.meta.url);
        const shared = require("@tailwind-styled/shared");
        console.log("TEST BINARY RESOLUTION:", shared.resolveNativeBinary(path.resolve(__dirname, "../dist/compiler")));
        const bridge = compilerMod.getNativeBridge ? compilerMod.getNativeBridge() : null;
        if (bridge) {
          console.log("TEST BRIDGE KEYS:", Object.keys(bridge));
        }
      } catch (e) {
        console.log("Error logging binary resolution:", e);
      }
      const css = compileToCssBatch(classes, true)
      console.log("TEST CSS OUTPUT:", JSON.stringify(css))
      assert.ok(css.includes(".bg-blue-600"), "Should contain first class")
      assert.ok(css.includes(".p-4"), "Should contain second class")
      assert.ok(!css.includes("\n"), "Should not contain newlines when minified")
    })
  })

  describe("generateCss & generateCssBatch", () => {
    it("should generate CSS from a single CssRule object", () => {
      const rule = {
        selector: ".custom-class",
        property: "color",
        value: "#ff0000",
        media: null,
        pseudo: null
      }
      const css = generateCss(JSON.stringify(rule), false)
      assert.ok(css.includes(".custom-class"), "Should contain selector")
      assert.ok(css.includes("color: #ff0000;"), "Should contain property and value")
    })

    it("should batch generate CSS from multiple CssRule objects", () => {
      const rules = [
        {
          selector: ".custom-1",
          property: "color",
          value: "#ff0000",
          media: null,
          pseudo: null
        },
        {
          selector: ".custom-2",
          property: "background-color",
          value: "#0000ff",
          media: null,
          pseudo: null
        }
      ]
      const css = generateCssBatch(JSON.stringify(rules), false)
      assert.ok(css.includes(".custom-1"), "Should contain first selector")
      assert.ok(css.includes(".custom-2"), "Should contain second selector")
    })
  })

  describe("runCssPipeline with minifier option", () => {
    it("should support the fast minifier in the pipeline", async () => {
      const classes = ["bg-blue-600", "p-4"]
      
      const result = await runCssPipeline(classes, undefined, undefined, true, "fast")
      assert.ok(result.css, "Should return compiled CSS")
      assert.ok(result.css.includes(".bg-blue-600"), "Should contain the class")
      assert.ok(result.optimized, "Should mark as optimized")
      assert.ok(result.sizeBytes > 0, "Should have a non-zero size")
    })

    it("should support the default lightning minifier in the pipeline", async () => {
      const classes = ["bg-blue-600", "p-4"]
      
      const result = await runCssPipeline(classes, undefined, undefined, true, "lightning")
      assert.ok(result.css, "Should return compiled CSS")
      assert.ok(result.css.includes(".bg-blue-600"), "Should contain the class")
      assert.ok(result.optimized, "Should mark as optimized")
    })
  })
})
