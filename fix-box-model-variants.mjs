import fs from "fs"
import path from "path"

const filePath = "examples/next-js-app/src/app/learn/dasar-css/box-model/page.tsx"
let content = fs.readFileSync(filePath, "utf-8")

// Pattern 1: Fix size variants with string keys to numeric keys
// "0": -> 0:, "1": -> 1:, etc.
content = content.replace(/(\s+)"(\d+)":\s/g, (match, space, digit) => {
  return `${space}${digit}: `
})

// Pattern 2: Fix defaultVariants with string values to numeric values
// defaultVariants: { size: "6" } -> defaultVariants: { size: 6 }
content = content.replace(/defaultVariants:\s*{([^}]*?)(\w+):\s*"(\d+)"([^}]*?)}/g, (match, before, key, digit, after) => {
  return `defaultVariants: {${before}${key}: ${digit}${after}}`
})

// Pattern 3: Fix margin, padding, neg variants similarly
// For margin: { "2": "my-2", "4": "my-4" } -> margin: { 2: "my-2", 4: "my-4" }
content = content.replace(/(\w+):\s*{\s*"(\d+)":/g, (match, variantName, digit) => {
  return `${variantName}: {\n      ${digit}:`
})

// Pattern 4: Fix usage in JSX - convert size="1" to size={1}
content = content.replace(/size="(\d+)"/g, (match, digit) => {
  return `size={${digit}}`
})

content = content.replace(/margin="(\d+)"/g, (match, digit) => {
  return `margin={${digit}}`
})

content = content.replace(/padding="(\d+)"/g, (match, digit) => {
  return `padding={${digit}}`
})

content = content.replace(/neg="([^"]+)"/g, (match, value) => {
  // neg can be numeric or string, check if numeric
  if (/^\d+$/.test(value)) {
    return `neg={${value}}`
  }
  return `neg="${value}"`
})

content = content.replace(/depth="(\d+)"/g, (match, digit) => {
  return `depth={${digit}}`
})

fs.writeFileSync(filePath, content, "utf-8")
console.log("✅ Fixed box-model/page.tsx variant types")
