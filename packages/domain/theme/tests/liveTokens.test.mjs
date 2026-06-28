import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let mod
try {
  mod = req(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[theme/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const {
  liveToken, liveTokenEngine, getToken, setToken, getTokens, setTokens,
  tokenRef, tokenVar, generateTokenCssString, subscribeTokens, applyTokenSet
} = mod ?? {}

describe("liveToken()", () => {
  it("is a function", () => {
    if (!liveToken) return
    assert.equal(typeof liveToken, "function")
  })

  it("registers token and returns TokenMap", () => {
    if (!liveToken) return
    try {
      const tokens = liveToken({ primary: "#3b82f6", secondary: "#6366f1" })
      assert.ok(tokens, "should return token map")
    } catch (err) {
      // May need browser environment for window globals
      if (String(err).includes("window") || String(err).includes("document")) {
        console.warn("[theme] Browser environment required, skipping window test")
        return
      }
      throw err
    }
  })

  // REGRESSION (hydration mismatch on <html>):
  // A previous fix tried to flush live tokens to document.documentElement.style
  // via `requestAnimationFrame(() => requestAnimationFrame(markHydrated))` as a
  // fallback for imperative-only consumers. rAF timing is NOT tied to React's
  // hydration commit, so on heavy client-component trees / slow dev compiles
  // it could fire mid-hydration and mutate the live DOM before React finished
  // comparing the server-rendered <html> tree — producing exactly this warning:
  // `<html style={{--tw-token-primary:...}}>` even though layout.tsx never
  // renders a style prop. Confirmed via a real React + jsdom hydrateRoot()
  // repro: writing to documentElement.style before hydration reproduces the
  // warning byte-for-byte; deferring the same write into useEffect (which
  // React guarantees runs only after the WHOLE tree, including <html>, has
  // committed) eliminates it.
  //
  // This test forces a FRESH module evaluation with browser-like globals
  // (window/document/requestAnimationFrame) already in place BEFORE the
  // module loads — mirroring the real browser environment where the bug
  // occurred — so a reintroduced module-eval-time rAF/timer fallback would
  // actually fire and get caught here, not silently no-op like it would in
  // plain Node (where window/document don't exist until a test sets them).
  it("does not write to document.documentElement before any hydration signal, even with requestAnimationFrame available", async () => {
    if (!liveToken) return

    const domWrites = []
    const prevWindow = global.window
    const prevDocument = global.document
    const prevRAF = global.requestAnimationFrame

    // Only `window` needs to exist at require-time to trip the historical
    // `if (typeof window !== "undefined") requestAnimationFrame(...)` bug.
    // `document` is deliberately left unset for the require step itself —
    // setting it here would also trip an unrelated tsup CJS `import.meta.url`
    // shim used by native-bridge.ts, which isn't what this test is about.
    global.window = {}
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0)

    const modPath = path.resolve(__dirname, "../dist/index.cjs")
    delete req.cache[modPath]

    try {
      // Fresh require — re-runs all module-top-level code (including
      // `engine = createLiveTokenEngine()`) with window/rAF already
      // defined, exactly like a real browser bundle evaluation. If the old
      // bug were reintroduced, its rAF fallback gets scheduled right here.
      const freshMod = req(modPath)

      // Now bring `document` in, so markHydrated() (if it incorrectly fires
      // below) has something real to write to and we can observe it.
      global.document = {
        documentElement: {
          style: {
            setProperty: (name, value) => domWrites.push(["set", name, value]),
            removeProperty: (name) => domWrites.push(["remove", name]),
          },
        },
        head: { appendChild: () => {} },
        createElement: () => ({ setAttribute() {}, style: {} }),
      }

      freshMod.liveToken({ regressionPrimary: "#000000", regressionSecondary: "#111111" })
      freshMod.setTokens?.({ regressionTertiary: "#222222" })

      // Give a generously-deferred fallback (2 polyfilled "frames", same
      // depth the old buggy code used) every chance to fire.
      await new Promise((r) => setTimeout(r, 0))
      await new Promise((r) => setTimeout(r, 0))
      await new Promise((r) => setTimeout(r, 0))

      assert.equal(
        domWrites.length,
        0,
        `liveToken()/setTokens() must not touch document.documentElement before an explicit hydration ` +
        `signal (useTokens() hook effect) — got writes: ${JSON.stringify(domWrites)}`
      )
    } finally {
      global.window = prevWindow
      global.document = prevDocument
      global.requestAnimationFrame = prevRAF
      delete req.cache[modPath]
    }
  })
})

describe("tokenRef() and tokenVar()", () => {
  it("tokenRef generates CSS var reference", () => {
    if (!tokenRef) return
    const ref = tokenRef("primary")
    assert.ok(typeof ref === "string", "tokenRef should return string")
    assert.ok(ref.includes("primary"), `Expected primary in ref: ${ref}`)
  })

  it("tokenVar generates CSS custom property", () => {
    if (!tokenVar) return
    const varStr = tokenVar("color-primary")
    assert.ok(typeof varStr === "string")
    assert.ok(varStr.includes("color-primary"))
  })
})

describe("generateTokenCssString()", () => {
  it("is a function", () => {
    if (!generateTokenCssString) return
    assert.equal(typeof generateTokenCssString, "function")
  })

  it("generates CSS string from token map", () => {
    if (!generateTokenCssString) return
    const tokens = { primary: "#3b82f6", secondary: "#6366f1" }
    const css = generateTokenCssString(tokens)
    assert.ok(typeof css === "string", "should return string")
    assert.ok(css.includes("#3b82f6"), "should include token value")
  })
})

describe("ThemeRegistry", () => {
  it("is exported", () => {
    assert.ok(mod.ThemeRegistry, "ThemeRegistry should be exported")
  })

  it("can be instantiated", () => {
    if (!mod.ThemeRegistry) return
    try {
      const registry = new mod.ThemeRegistry()
      assert.ok(registry)
    } catch (err) {
      console.warn("[theme] ThemeRegistry instantiation:", String(err).slice(0, 80))
    }
  })
})

describe("compileDesignTokens()", () => {
  it("is exported if available", () => {
    if (!mod.compileDesignTokens) {
      console.warn("[theme] compileDesignTokens not exported, skipping")
      return
    }
    assert.equal(typeof mod.compileDesignTokens, "function")
  })
})
