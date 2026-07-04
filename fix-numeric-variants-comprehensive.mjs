#!/usr/bin/env node
/**
 * Fix Numeric Variant Type Errors in box-model/page.tsx
 * 
 * This script:
 * 1. Converts string variant keys ("0", "1", etc) to numeric keys (0, 1, etc)
 * 2. Converts string defaultVariants values ("0", "1") to numeric (0, 1)
 * 3. Converts JSX usage from size="1" to size={1}
 * 4. Ensures type alignment between definition and usage
 */

import fs from "fs"
import path from "path"

const filePath = "/home/annas-zen/Documents/css-in-rust/examples/next-js-app/src/app/learn/dasar-css/box-model/page.tsx"

let content = fs.readFileSync(filePath, "utf-8")
const originalContent = content

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Fix variant key definitions (string keys → numeric keys)
// Pattern: "0": "classes" → 0: "classes"
// ─────────────────────────────────────────────────────────────────────────────

console.log("Step 1: Converting string variant keys to numeric keys...")

// Match: "digit": "string" and convert to digit: "string"
content = content.replace(/(\{\s*)"(\d+)"(\s*:\s*"[^"]*"[,\n])/g, (match, open, digit, rest) => {
    return `${open}${digit}${rest}`
})

// Match: "digit": { (multiline) and convert
content = content.replace(/(\{\s*)"(\d+)"(\s*:\s*\{)/g, (match, open, digit, rest) => {
    return `${open}${digit}${rest}`
})

console.log("  ✓ Variant keys converted")

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2: Fix defaultVariants values (string → numeric)
// Pattern: defaultVariants: { size: "0" } → defaultVariants: { size: 0 }
// ─────────────────────────────────────────────────────────────────────────────

console.log("Step 2: Converting defaultVariants values from strings to numbers...")

// Match: key: "digit" within defaultVariants and convert to key: digit
content = content.replace(/defaultVariants:\s*\{([^}]*?)\}/gs, (match) => {
    return match.replace(/(\w+):\s*"(\d+)"/g, (m, key, digit) => {
        return `${key}: ${digit}`
    })
})

console.log("  ✓ defaultVariants values converted")

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3: Fix JSX usage (string props → numeric props)
// Pattern: size="1" → size={1}
// ─────────────────────────────────────────────────────────────────────────────

console.log("Step 3: Converting JSX usage from string props to numeric props...")

// For numeric properties: size="0" → size={0}
const numericProps = ["size", "margin", "padding", "depth", "depth", "gap", "priority", "level", "severity"]

for (const prop of numericProps) {
    // Match: prop="digit" and convert to prop={digit}
    const pattern = new RegExp(`${prop}="(\\d+)"`, "g")
    content = content.replace(pattern, (match, digit) => {
        return `${prop}={${digit}}`
    })
}

console.log("  ✓ JSX numeric props converted")

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4: Handle special cases (CollapseMargin, NegMarginVal type aliases)
// These type aliases should be corrected to expect numbers, not strings
// ─────────────────────────────────────────────────────────────────────────────

console.log("Step 4: Fixing type aliases for numeric variant values...")

// Find and fix CollapseMargin type
content = content.replace(/type\s+CollapseMargin\s*=\s*[^;\n]+;/g, (match) => {
    // If it contains string literals like "2" | "4", convert to number literals
    if (match.includes('"')) {
        return match.replace(/"(\d+)"/g, "$1")
    }
    return match
})

// Find and fix NegMarginVal type
content = content.replace(/type\s+NegMarginVal\s*=\s*[^;\n]+;/g, (match) => {
    // If it contains string literals, convert to number literals or string literals depending on context
    if (match.includes('"') && !match.includes("| string")) {
        return match.replace(/"(\d+)"/g, "$1")
    }
    return match
})

console.log("  ✓ Type aliases fixed")

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5: Report changes
// ─────────────────────────────────────────────────────────────────────────────

const changes = content !== originalContent
console.log("\n" + "=".repeat(80))

if (changes) {
    console.log("✅ Changes detected and applied!")

    // Count replacements
    const stringKeyMatches = originalContent.match(/"(\d+)":\s*"[^"]*"[,\n]/g) || []
    const defaultVarMatches = originalContent.match(/:\s*"(\d+)"(?=\s*[,}])/g) || []
    const jsxMatches = originalContent.match(/\w+="(\d+)"/g) || []

    console.log(`\nEstimated changes:`)
    console.log(`  • Variant keys converted: ~${stringKeyMatches.length}`)
    console.log(`  • defaultVariants values: ~${defaultVarMatches.length}`)
    console.log(`  • JSX prop usages: ~${jsxMatches.length}`)

    // Write the fixed content
    fs.writeFileSync(filePath, content, "utf-8")
    console.log(`\n✓ File saved: ${filePath}`)

    console.log("\n" + "=".repeat(80))
    console.log("Next steps:")
    console.log("  1. Run: npm run check:types (to verify type errors are fixed)")
    console.log("  2. Run: npm run test:smoke (to verify runtime behavior)")
    console.log("  3. Check diagnostics in IDE for remaining application-level errors")

} else {
    console.log("❌ No changes made. The file may already be correct.")
}

console.log("=".repeat(80))
