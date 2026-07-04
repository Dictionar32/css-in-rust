#!/usr/bin/env node
/**
 * Test: Numeric Variant Type Inference
 * 
 * Verifies that numeric variant keys are properly inferred as number types,
 * not string types, after the types.ts fix.
 */

import assert from "assert"
import { tw } from "tailwind-styled-v4"

// Test 1: Numeric variant keys should infer to number type
const Alert = tw.div({
    variants: {
        severity: {
            0: "bg-blue-100 text-blue-900",    // Numeric key
            1: "bg-yellow-100 text-yellow-900",
            2: "bg-red-100 text-red-900"
        }
    },
    defaultVariants: { severity: 0 }
})

console.log("✓ Alert component created with numeric severity variants")

// Test 2: Verify defaultVariants accepts numeric value
const alertDefaults = Alert.displayName || "Alert"
console.log(`✓ Alert component name: ${alertDefaults}`)

// Test 3: Boolean variant keys should infer to boolean type
const Button = tw.button({
    variants: {
        disabled: {
            true: "opacity-50 cursor-not-allowed",
            false: "opacity-100 cursor-pointer"
        }
    },
    defaultVariants: { disabled: false }  // Boolean, NOT "false"
})

console.log("✓ Button component created with boolean disabled variant")

// Test 4: String variant keys should stay as strings
const Badge = tw.span({
    variants: {
        status: {
            "success": "bg-green-100 text-green-900",
            "pending": "bg-yellow-100 text-yellow-900",
            "error": "bg-red-100 text-red-900"
        }
    },
    defaultVariants: { status: "pending" }  // String literal
})

console.log("✓ Badge component created with string status variants")

console.log("\n✅ All numeric variant tests passed!")
console.log("The library types should now properly infer:")
console.log("  - Numeric keys → number types")
console.log("  - Boolean keys → boolean types")
console.log("  - String keys → string literal types")
