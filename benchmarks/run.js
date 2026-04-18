/**
 * cv() Benchmark - Quick Run
 * Run: node benchmarks/run.js
 */

const ITERATIONS = 10000

const config = {
  base: "px-4 py-2 rounded-lg",
  variants: {
    size: { sm: "text-sm", md: "text-base", lg: "text-lg", xl: "text-xl" },
    color: { red: "bg-red-500", blue: "bg-blue-500", green: "bg-green-500", yellow: "bg-yellow-500" },
    state: { hover: "hover:bg-opacity-90", focus: "focus:ring-2" },
  },
  defaultVariants: { size: "md", color: "blue" },
  compoundVariants: [
    { class: "ring-2 ring-offset-2", size: "lg", color: "blue" },
  ],
}

// JS Fallback
function resolveVariantsJs(base, variants, compoundVariants, defaultVariants, props) {
  const classes = base ? base.split(" ").filter(Boolean) : []
  for (const key in variants) {
    const val = props[key] ?? defaultVariants[key]
    if (val !== undefined && variants[key]?.[String(val)]) {
      classes.push(variants[key]![String(val)])
    }
  }
  for (const compound of compoundVariants) {
    const { class: cls, ...conditions } = compound
    const match = Object.entries(conditions).every(([k, v]) => props[k] === v)
    if (match && cls) classes.push(cls)
  }
  return classes.join(" ")
}

// Benchmark
console.log(`\n📊 Running ${ITERATIONS} iterations...\n`)

const testCases = [
  { name: "Single variant", props: { size: "lg" } },
  { name: "Multiple variants", props: { size: "lg", color: "red" } },
  { name: "Compound variant", props: { size: "lg", color: "blue" } }, // triggers compound
]

for (const tc of testCases) {
  const start = performance.now()
  for (let i = 0; i < ITERATIONS; i++) {
    resolveVariantsJs(
      config.base,
      config.variants,
      config.compoundVariants,
      config.defaultVariants,
      tc.props
    )
  }
  const duration = performance.now() - start
  const perCall = (duration / ITERATIONS * 1000).toFixed(3)
  
  console.log(`  ${tc.name}:`)
  console.log(`    Total: ${duration.toFixed(2)}ms`)
  console.log(`    Per call: ${perCall}µs`)
  console.log("")
}

console.log("✅ Benchmark complete")
console.log("\nTo test with Rust native:")
console.log("  1. Build native: cd native && cargo build --release")
console.log("  2. Run benchmark with native loaded")