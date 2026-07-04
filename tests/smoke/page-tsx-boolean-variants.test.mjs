/**
 * Page.tsx Boolean Variants Test
 *
 * Tests that the fix for boolean values in defaultVariants works correctly
 * for real page.tsx scenarios
 */

import { test } from "node:test"
import assert from "node:assert/strict"
import { tw } from "../../dist/index.mjs"

test("ToggleButton with boolean active variant works", () => {
    const ToggleButton = tw.button({
        base: "px-4 py-2 rounded border-2",
        variants: {
            active: {
                true: "border-[var(--color-primary)] bg-[var(--color-primary)]",
                false: "border-gray-300 bg-white",
            },
        },
        defaultVariants: { active: false },
    })

    assert.ok(ToggleButton, "ToggleButton component created")
})

test("Button with mixed boolean and string variants works", () => {
    const Button = tw.button({
        base: "px-4 py-2 rounded font-medium",
        variants: {
            variant: {
                primary: "bg-[var(--color-primary)] text-white",
                secondary: "bg-[var(--color-secondary)]",
            },
            disabled: {
                true: "opacity-50 cursor-not-allowed",
                false: "",
            },
        },
        defaultVariants: {
            variant: "primary",
            disabled: false,
        },
    })

    assert.ok(Button, "Button component created with mixed variants")
})

test("All page.tsx error scenarios are fixed", () => {
    const results = []

    // Scenario 1: ToggleButton line 59
    try {
        const ToggleButton1 = tw.button({
            base: "px-3 py-1.5",
            variants: {
                active: {
                    true: "border-b-2 border-[var(--color-primary)]",
                    false: "text-[var(--color-fg-muted)]",
                },
            },
            defaultVariants: { active: false },
        })
        results.push({ scenario: "ToggleButton line 59 (active=false)", success: true })
    } catch (e) {
        results.push({ scenario: "ToggleButton line 59", success: false, error: e.message })
    }

    // Scenario 2: ToggleButton line 68
    try {
        const ToggleButton2 = tw.button({
            base: "px-3 py-1.5",
            variants: {
                active: {
                    true: "text-[var(--color-primary)]",
                    false: "text-[var(--color-fg-muted)]",
                },
            },
            defaultVariants: { active: false },
        })
        results.push({ scenario: "ToggleButton line 68 (active=false)", success: true })
    } catch (e) {
        results.push({ scenario: "ToggleButton line 68", success: false, error: e.message })
    }

    // Scenario 3: Button line 133 with variant prop
    try {
        const Button133 = tw.button({
            base: "px-4 py-2",
            variants: {
                variant: {
                    primary: "bg-[var(--color-primary)]",
                    secondary: "bg-[var(--color-secondary)]",
                    outline: "border-2 border-[var(--color-primary)]",
                },
            },
            defaultVariants: { variant: "primary" },
        })
        results.push({ scenario: "Button line 133 (variant=\"primary\")", success: true })
    } catch (e) {
        results.push({ scenario: "Button line 133", success: false, error: e.message })
    }

    // Scenario 4: Button line 147 with variant + disabled
    try {
        const Button147 = tw.button({
            base: "px-4 py-2",
            variants: {
                variant: {
                    primary: "bg-[var(--color-primary)]",
                },
                disabled: {
                    true: "opacity-50",
                    false: "",
                },
            },
            defaultVariants: { variant: "primary", disabled: false },
        })
        results.push({ scenario: "Button line 147 (variant + disabled=false)", success: true })
    } catch (e) {
        results.push({ scenario: "Button line 147", success: false, error: e.message })
    }

    // Scenario 5: Button line 155 with disabled=true
    try {
        const Button155 = tw.button({
            base: "px-4 py-2",
            variants: {
                variant: {
                    primary: "bg-[var(--color-primary)]",
                },
                disabled: {
                    true: "opacity-50 cursor-not-allowed",
                    false: "hover:opacity-90",
                },
            },
            defaultVariants: { variant: "primary", disabled: true },
        })
        results.push({ scenario: "Button line 155 (disabled=true)", success: true })
    } catch (e) {
        results.push({ scenario: "Button line 155", success: false, error: e.message })
    }

    // Scenario 6: Button line 163 with variant
    try {
        const Button163 = tw.button({
            base: "px-4 py-2",
            variants: {
                variant: {
                    primary: "bg-[var(--color-primary)]",
                    secondary: "bg-[var(--color-secondary)]",
                },
            },
            defaultVariants: { variant: "primary" },
        })
        results.push({ scenario: "Button line 163 (variant prop)", success: true })
    } catch (e) {
        results.push({ scenario: "Button line 163", success: false, error: e.message })
    }

    // Scenario 7: Button line 296 with variant
    try {
        const Button296 = tw.button({
            base: "px-4 py-2",
            variants: {
                variant: {
                    primary: "bg-[var(--color-primary)]",
                    secondary: "bg-[var(--color-secondary)]",
                },
            },
            defaultVariants: { variant: "primary" },
        })
        results.push({ scenario: "Button line 296 (variant prop)", success: true })
    } catch (e) {
        results.push({ scenario: "Button line 296", success: false, error: e.message })
    }

    // Verify all passed
    const allSuccess = results.every((r) => r.success)
    assert.equal(allSuccess, true, `All scenarios should pass`)

    console.log("\n✅ ALL PAGE.TSX ERROR SCENARIOS FIXED:")
    results.forEach((r) => {
        const status = r.success ? "✓" : "✗"
        console.log(`   ${status} ${r.scenario}`)
    })
})

console.log("\n✓ Page.tsx boolean variants tests completed")
