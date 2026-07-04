#!/usr/bin/env node
/**
 * Test: Object Config with Nested Sub-Component Variants
 * 
 * This test verifies that the library properly supports object config syntax
 * with nested sub-components that have their own variants and defaultVariants.
 * 
 * This is the real-world pattern used in box-model/page.tsx
 */

import { tw } from "tailwind-styled-v4"
import assert from "assert"

console.log("Testing object config with nested sub-component variants...\n")

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Simple Object Config (baseline)
// ─────────────────────────────────────────────────────────────────────────────

try {
    const Simple = tw.div({
        base: "p-4 rounded-lg",
    })
    console.log("✓ TEST 1: Simple object config works")
} catch (e) {
    console.error("✗ TEST 1 FAILED:", e.message)
    process.exit(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Object Config with Simple Sub-Components (no variants)
// ─────────────────────────────────────────────────────────────────────────────

try {
    const CardSimple = tw.div({
        base: "bg-white rounded-lg shadow",
        sub: {
            header: "px-6 py-4 border-b",
            body: "px-6 py-4",
            footer: "px-6 py-3 border-t",
        },
    })
    console.log("✓ TEST 2: Object config with simple sub-components works")
} catch (e) {
    console.error("✗ TEST 2 FAILED:", e.message)
    process.exit(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Object Config with Sub-Component That Has Variants (THE REAL TEST)
// ─────────────────────────────────────────────────────────────────────────────

try {
    const PlaygroundWrap = tw.div({
        base: "rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden my-5",
        sub: {
            controls: "p-4 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] space-y-3",
            "p:label": "text-[10px] font-semibold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)]",
            canvas: {
                base: "p-6 bg-[color-mix(in_srgb,var(--accent)_4%,transparent)] flex items-center justify-center min-h-52",
                variants: {
                    layout: {
                        "wrap": "gap-12 flex-wrap",
                        "wrap-sm": "gap-4 flex-wrap",
                        "column": "flex-col gap-0",
                        "column-center": "flex-col gap-0 items-center",
                        "column-stretch": "flex-col items-stretch",
                        "gap-flex": "gap-3 flex-col items-center",
                    },
                },
                defaultVariants: { layout: "wrap" },
            },
            codeline: "px-4 py-3 border-t border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] bg-[var(--surface)] font-mono text-[11px] text-[var(--accent)]",
        },
    })

    // Verify that PlaygroundWrap is created successfully
    assert(PlaygroundWrap, "PlaygroundWrap component should be defined")

    // Verify that sub-components are accessible
    assert(PlaygroundWrap.controls, "PlaygroundWrap.controls should exist")
    assert(PlaygroundWrap.label, "PlaygroundWrap.label should exist")
    assert(PlaygroundWrap.canvas, "PlaygroundWrap.canvas should exist")
    assert(PlaygroundWrap.codeline, "PlaygroundWrap.codeline should exist")

    console.log("✓ TEST 3: Object config with nested sub-component variants works")
    console.log("  ✓ PlaygroundWrap created successfully")
    console.log("  ✓ All sub-components accessible (.controls, .label, .canvas, .codeline)")

} catch (e) {
    console.error("✗ TEST 3 FAILED:", e.message)
    console.error("   Stack:", e.stack)
    process.exit(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Sub-Component Variant Access
// ─────────────────────────────────────────────────────────────────────────────

try {
    const CardWithVariants = tw.div({
        base: "bg-white rounded-lg",
        sub: {
            header: {
                base: "px-6 py-4 border-b",
                variants: {
                    featured: {
                        true: "bg-blue-50 border-blue-200",
                        false: "bg-gray-50 border-gray-200"
                    }
                },
                defaultVariants: { featured: false }
            },
            body: "px-6 py-4",
        },
    })

    assert(CardWithVariants.header, "CardWithVariants.header should exist")
    console.log("✓ TEST 4: Sub-component with variants works")

} catch (e) {
    console.error("✗ TEST 4 FAILED:", e.message)
    process.exit(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Multiple Nested Sub-Components with Mixed Configs
// ─────────────────────────────────────────────────────────────────────────────

try {
    const ComplexComponent = tw.div({
        base: "p-4",
        sub: {
            // Simple string sub-component
            simple: "bg-white p-4",

            // Tagged string sub-component
            "section:content": "px-6 py-4",

            // Sub-component with variants
            advanced: {
                base: "rounded-lg border",
                variants: {
                    state: {
                        active: "border-blue-500 bg-blue-50",
                        inactive: "border-gray-300 bg-gray-50"
                    }
                },
                defaultVariants: { state: "inactive" }
            }
        },
    })

    assert(ComplexComponent.simple, "ComplexComponent.simple should exist")
    assert(ComplexComponent.content, "ComplexComponent.content should exist")
    assert(ComplexComponent.advanced, "ComplexComponent.advanced should exist")

    console.log("✓ TEST 5: Multiple nested sub-components with mixed configs works")

} catch (e) {
    console.error("✗ TEST 5 FAILED:", e.message)
    process.exit(1)
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n" + "=".repeat(80))
console.log("✅ ALL TESTS PASSED!")
console.log("=".repeat(80))
console.log("\nThe library properly supports:")
console.log("  • Object config syntax")
console.log("  • Nested sub-components with variants")
console.log("  • Complex component trees")
console.log("  • Mixed sub-component configurations")
console.log("\nThe 'Object literal may only specify known properties' error should be FIXED")
console.log("when object config overload comes BEFORE template literal overloads.\n")
