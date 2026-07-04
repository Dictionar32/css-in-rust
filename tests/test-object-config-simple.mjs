import { tw } from "../dist/index.mjs"

console.log("Testing object-config variant inference...")

// Test 1: Button with disabled variant (boolean keys)
console.log("\n1. Button with disabled variant...")
const Button = tw.button({
    base: "px-4 py-2 rounded-lg",
    variants: {
        variant: {
            primary: "bg-blue-600",
            secondary: "bg-gray-200",
        },
        disabled: {
            true: "opacity-50 cursor-not-allowed",
            false: "",
        },
    },
    defaultVariants: { variant: "primary", disabled: false },
})
console.log("✓ Button created:", typeof Button)

// Test 2: TabButton with active variant (boolean keys)
console.log("\n2. TabButton with active variant...")
const TabButton = tw.button({
    base: "px-4 py-2 text-sm font-medium",
    variants: {
        active: {
            true: "border-blue-600",
            false: "text-gray-600",
        },
    },
    defaultVariants: { active: false },
})
console.log("✓ TabButton created:", typeof TabButton)

// Test 3: Toggle with multiple boolean variants
console.log("\n3. Toggle with multiple boolean variants...")
const Toggle = tw.div({
    base: "inline-flex",
    variants: {
        size: {
            sm: "h-6 w-6",
            lg: "h-8 w-8",
        },
        checked: {
            true: "bg-blue-600",
            false: "bg-gray-300",
        },
        disabled: {
            true: "opacity-50",
            false: "",
        },
    },
    defaultVariants: { size: "sm", checked: false, disabled: false },
})
console.log("✓ Toggle created:", typeof Toggle)

// Test 4: Component with ARIA and sub-components
console.log("\n4. Component with @aria and sub-components...")
const Card = tw.article({
    base: "bg-white rounded-lg p-6",
    "@semantic": "article",
    "@aria": { role: "region" },
    variants: {
        featured: {
            true: "border-2 border-blue-600",
            false: "border border-gray-200",
        },
    },
    defaultVariants: { featured: false },
    sub: {
        header: "border-b pb-4",
        footer: "border-t pt-4",
    },
})
console.log("✓ Card created:", typeof Card)
console.log("  - Card.header:", typeof Card.header)
console.log("  - Card.footer:", typeof Card.footer)

// Test 5: Component with number variant keys
console.log("\n5. Component with number variant keys...")
const NumButton = tw.button({
    base: "btn",
    variants: {
        size: {
            1: "text-sm",
            2: "text-base",
            3: "text-lg",
        },
        loading: {
            true: "opacity-60",
            false: "",
        },
    },
    defaultVariants: { size: 1, loading: false },
})
console.log("✓ NumButton created:", typeof NumButton)

console.log("\n✓ All tests passed!")
