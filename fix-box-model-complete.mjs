import fs from "fs"
import path from "path"

const filePath = "examples/next-js-app/src/app/learn/dasar-css/box-model/page.tsx"
let content = fs.readFileSync(filePath, "utf-8")

console.log("Starting comprehensive fix for box-model/page.tsx...")

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE 1: Fix Line 191 - Mixed template literal + object config
// Current: tw.div`...` with { base: "..." } inside
// Fix: Use object config syntax properly
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝 Fixing line 191: tw.div mixed syntax...")
content = content.replace(
    /tw\.div\s*`([^`]*?)\s*{[\s\S]*?"base":\s*"([^"]+)"[\s\S]*?}\s*`/,
    (match) => {
        // Extract the base styles and convert to object config
        return `tw.div({
  base: "min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans",
  attrs: { "data-learn-page": "" },
})`
    }
)

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE 2: Convert remaining string variant keys to numbers
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝 Converting string variant keys to numbers...")

// Pattern: "0": -> 0:, "1": -> 1:, etc.
content = content.replace(/(\s+)"(\d+)":\s/g, (match, space, digit) => {
    return `${space}${digit}: `
})

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE 3: Convert defaultVariants string values to numbers
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝 Converting defaultVariants string values to numbers...")
content = content.replace(/defaultVariants:\s*{([^}]*?)(\w+):\s*"(\d+)"([^}]*?)}/g, (match, before, key, digit, after) => {
    return `defaultVariants: {${before}${key}: ${digit}${after}}`
})

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE 4: Fix JSX usage - Convert size="1" to size={1}
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝 Converting JSX prop values from strings to numbers...")

// Match all numeric string props and convert
content = content.replace(/\b(size|margin|padding|neg|depth)="(\d+)"/g, (match, prop, digit) => {
    return `${prop}={${digit}}`
})

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE 5: Add missing sub-components to PlaygroundControls
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝 Adding missing sub-components...")

// Find PlaygroundControls definition and ensure it has sub: { label, controls }
content = content.replace(
    /const PlaygroundControls = tw\.div\(\{\s*base: "[^"]*",\s*sub: \{([^}]*?)\},\s*\}\)/,
    (match) => {
        if (!match.includes("label:") && !match.includes("controls:")) {
            return match.replace(
                /sub: \{([^}]*?)\}/,
                `sub: {
    label: "text-xs font-semibold mb-2 text-gray-600",
    controls: "flex flex-wrap gap-2",
  }`
            )
        }
        return match
    }
)

// Add missing PlaygroundCanvas sub-component if needed
content = content.replace(
    /const PlaygroundCanvas = tw\.div\(\{\s*base: "[^"]*",\s*\}\)/,
    (match) => {
        if (!match.includes("sub:")) {
            return match.replace(
                /\}\)$/,
                `,\n  sub: {\n    codeline: "text-[11px] font-mono text-gray-500 mt-1",\n  },\n})`
            )
        }
        return match
    }
)

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE 6: Fix type annotations for CollapseMargin and NegMarginVal
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝 Fixing type declarations...")

// Change CollapseMargin from string to number
content = content.replace(
    /type CollapseMargin = "[^"]*"/,
    'type CollapseMargin = 2 | 4 | 8 | 12'
)

// Change NegMarginVal from string to number
content = content.replace(
    /type NegMarginVal = "[^"]*"/,
    'type NegMarginVal = 0 | 1 | 2 | 4 | 8 | 12'
)

// ─────────────────────────────────────────────────────────────────────────────
// ISSUE 7: Fix remaining JSX string props to numbers
// ─────────────────────────────────────────────────────────────────────────────
console.log("📝 Final pass: convert remaining string props...")

// Fix active="false" to active={false}
content = content.replace(/active="false"/g, 'active={false}')
content = content.replace(/active="true"/g, 'active={true}')

// Fix depth="2" to depth={2}
content = content.replace(/depth="(\d+)"/g, (match, digit) => {
    return `depth={${digit}}`
})

fs.writeFileSync(filePath, content, "utf-8")
console.log("✅ Fixed box-model/page.tsx comprehensively")
