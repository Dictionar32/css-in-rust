// Simulate browser BEFORE requiring the bundle, so native.ts's top-level
// `isBrowser` check evaluates to true.
global.window = {}
global.document = {}

const mod = require("/home/claude/proj/css-in-rust-tailwnd-js-css/packages/domain/core/dist/index.cjs")

console.log("Has twMerge:", typeof mod.twMerge === "function")

let threw = false
let result
try {
  result = mod.twMerge("p-4 bg-red-500", "p-2", "hover:bg-blue-500")
} catch (e) {
  threw = true
  console.error("THREW:", e.message)
}

console.log("threw:", threw)
console.log("result:", JSON.stringify(result))

const expected = "p-2 bg-red-500 hover:bg-blue-500"
console.log(result === expected ? "PASS — matches expected" : `FAIL — expected ${JSON.stringify(expected)}`)