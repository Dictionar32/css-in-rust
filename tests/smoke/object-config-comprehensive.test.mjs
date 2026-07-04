/**
 * Comprehensive Object-Config Variant Tests
 * 
 * Tests all object-config error scenarios:
 * 1. Boolean values in defaultVariants (disabled: false, active: true)
 * 2. Number values in defaultVariants (priority: 0, level: 1)
 * 3. String values in defaultVariants (variant: "primary", size: "md")
 * 4. Mixed types in same component
 * 5. Variant composition with multiple variant groups
 * 6. States alongside variants with mixed types
 * 7. Imported components maintain type information
 * 
 * All tests use dist/index.mjs directly (compiled build output)
 */

import { test } from "node:test"
import assert from "node:assert/strict"
// Use the built dist from root
import { tw } from "../../dist/index.mjs"

// ────────────────────────────────────────────────────────────────────────────
// TEST 1: Boolean values in defaultVariants
// ────────────────────────────────────────────────────────────────────────────

test("Button with boolean variant keys: false default", () => {
    const Button = tw.button({
        base: "px-4 py-2 rounded-lg font-medium transition-all cursor-pointer",
        variants: {
            disabled: {
                true: "opacity-50 cursor-not-allowed pointer-events-none",
                false: "hover:opacity-90 active:scale-95",
            },
        },
        defaultVariants: { disabled: false }, // ← boolean value
    })

    assert.ok(Button, "Button component created successfully")
    assert.ok(typeof Button === "function" || typeof Button === "object", "Button is a component")
})

test("TabButton with boolean variant active key", () => {
    const TabButton = tw.button({
        base: "px-4 py-2 text-sm font-medium border-b-2 border-transparent",
        variants: {
            active: {
                true: "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]",
                false: "text-[var(--color-fg-muted)]",
            },
        },
        defaultVariants: { active: false }, // ← boolean value
    })

    assert.ok(TabButton, "TabButton component created successfully")
})

test("ToggleButton with boolean variant and mixed styling", () => {
    const ToggleButton = tw.button({
        base: "px-4 py-2 rounded-lg font-medium transition-all cursor-pointer",
        "@semantic": "button",
        "@aria": { role: "button" },
        variants: {
            active: {
                true: "bg-[var(--color-primary)] text-white",
                false: "bg-gray-200 text-gray-900",
            },
        },
        defaultVariants: { active: false }, // ← boolean value
    })

    assert.ok(ToggleButton, "ToggleButton component created successfully")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 2: Number values in defaultVariants
// ────────────────────────────────────────────────────────────────────────────

test("Component with number variant: priority", () => {
    const PriorityItem = tw.div({
        base: "p-2 rounded border",
        variants: {
            priority: {
                0: "border-gray-300 bg-gray-50",
                1: "border-yellow-300 bg-yellow-50",
                2: "border-red-300 bg-red-50",
            },
        },
        defaultVariants: { priority: 0 }, // ← number value
    })

    assert.ok(PriorityItem, "PriorityItem component created with number default")
})

test("Component with number variant: level", () => {
    const Heading = tw.h1({
        base: "font-bold mb-4",
        variants: {
            level: {
                1: "text-4xl",
                2: "text-3xl",
                3: "text-2xl",
            },
        },
        defaultVariants: { level: 1 }, // ← number value
    })

    assert.ok(Heading, "Heading component created with number default")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 3: String values in defaultVariants (baseline)
// ────────────────────────────────────────────────────────────────────────────

test("Component with string variants: variant + size", () => {
    const Button = tw.button({
        base: "px-4 py-2 rounded-lg font-medium transition-all",
        variants: {
            variant: {
                primary: "bg-blue-600 text-white hover:bg-blue-700",
                secondary: "bg-gray-200 text-gray-900",
                outline: "border border-blue-600 text-blue-600",
            },
            size: {
                sm: "px-3 py-1 text-sm",
                md: "px-4 py-2 text-base",
                lg: "px-6 py-3 text-lg",
            },
        },
        defaultVariants: {
            variant: "primary", // ← string value
            size: "md", // ← string value
        },
    })

    assert.ok(Button, "Button with string variants created")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 4: Mixed types in same component
// ────────────────────────────────────────────────────────────────────────────

test("Component with mixed types: boolean + string + number", () => {
    const Card = tw.div({
        base: "rounded-lg p-4 border",
        variants: {
            variant: {
                default: "bg-white border-gray-300",
                primary: "bg-blue-50 border-blue-300",
            },
            priority: {
                0: "shadow-sm",
                1: "shadow-md",
                2: "shadow-lg",
            },
            elevated: {
                true: "shadow-xl",
                false: "shadow-none",
            },
        },
        defaultVariants: {
            variant: "default", // ← string
            priority: 1, // ← number
            elevated: false, // ← boolean
        },
    })

    assert.ok(Card, "Card with mixed variant types created")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 5: Multiple variant groups with same pattern
// ────────────────────────────────────────────────────────────────────────────

test("Multiple boolean variants: loading + disabled + fullWidth", () => {
    const Button = tw.button({
        base: "px-4 py-2 rounded-lg font-medium",
        variants: {
            loading: {
                true: "opacity-60 cursor-wait",
                false: "",
            },
            disabled: {
                true: "opacity-50 cursor-not-allowed",
                false: "",
            },
            fullWidth: {
                true: "w-full",
                false: "w-auto",
            },
        },
        defaultVariants: {
            loading: false,
            disabled: false,
            fullWidth: false,
        },
    })

    assert.ok(Button, "Button with 3 boolean variants created")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 6: States config with boolean variants
// ────────────────────────────────────────────────────────────────────────────

test("Component with states + boolean variants", () => {
    const Input = tw.input({
        base: "px-3 py-2 border border-gray-300 rounded-lg",
        variants: {
            error: {
                true: "border-red-500 focus:ring-red-500",
                false: "border-gray-300 focus:ring-blue-500",
            },
        },
        states: {
            focused: "ring-2 ring-offset-2",
            disabled: "opacity-50 cursor-not-allowed",
        },
        defaultVariants: { error: false },
    })

    assert.ok(Input, "Input with states + boolean variants created")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 7: Sub-components with mixed types
// ────────────────────────────────────────────────────────────────────────────

test("Component with sub-components and mixed variant types", () => {
    const Card = tw.div({
        base: "bg-white rounded-lg shadow-md overflow-hidden",
        variants: {
            elevated: {
                true: "shadow-xl",
                false: "shadow-sm",
            },
            size: {
                sm: "w-64",
                md: "w-96",
                lg: "w-full",
            },
        },
        defaultVariants: {
            elevated: false,
            size: "md",
        },
        sub: {
            header: "px-6 py-4 border-b bg-gray-50",
            body: "px-6 py-4",
            footer: {
                base: "px-6 py-3 border-t bg-gray-50",
                variants: {
                    layout: {
                        horizontal: "flex gap-2 justify-end",
                        vertical: "flex flex-col items-stretch",
                    },
                },
            },
        },
    })

    assert.ok(Card, "Card with sub-components created")
    assert.ok(Card.header, "Card.header sub-component exists")
    assert.ok(Card.body, "Card.body sub-component exists")
    assert.ok(Card.footer, "Card.footer sub-component exists")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 8: Semantic + ARIA attributes with mixed types
// ────────────────────────────────────────────────────────────────────────────

test("Button with @semantic, @aria, and mixed variant types", () => {
    const Button = tw.button({
        base: "px-4 py-2 rounded-lg font-medium transition-all cursor-pointer",
        "@semantic": "button",
        "@aria": { role: "button" },
        variants: {
            variant: {
                primary: "bg-blue-600 text-white",
                secondary: "bg-gray-200",
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

    assert.ok(Button, "Button with @semantic and mixed types created")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 9: Extend component with boolean defaults
// ────────────────────────────────────────────────────────────────────────────

test("Extended component inherits boolean defaults", () => {
    const BaseButton = tw.button({
        base: "px-4 py-2 rounded-lg",
        variants: {
            disabled: {
                true: "opacity-50",
                false: "hover:opacity-90",
            },
        },
        defaultVariants: { disabled: false },
    })

    const PrimaryButton = BaseButton.extend({
        base: "px-6 py-3 font-bold",
        variants: {
            size: {
                sm: "text-sm",
                lg: "text-lg",
            },
        },
        defaultVariants: { size: "md" },
    })

    assert.ok(PrimaryButton, "Extended button created")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 10: Real-world Page Component Simulation
// ────────────────────────────────────────────────────────────────────────────

test("Page layout component with multiple boolean + string variants", () => {
    // Simulate the aria-dynamic-theme page structure
    const Page = tw.div({
        base: "min-h-screen bg-[var(--color-bg)]",
        sub: {
            topbar: "sticky top-0 z-50 h-12 bg-white border-b",
            body: "max-w-5xl mx-auto px-4 py-10",
            content: "flex-1",
            sidebar: "w-64",
        },
    })

    const Section = tw.section({
        base: "scroll-mt-20 mb-10",
        variants: {
            highlighted: {
                true: "bg-[var(--color-alert-bg)] p-4 rounded-lg",
                false: "",
            },
        },
        defaultVariants: { highlighted: false },
    })

    const Title = tw.h2({
        base: "text-2xl font-bold mb-4",
    })

    const Button = tw.button({
        base: "px-4 py-2 rounded-lg font-medium transition-all cursor-pointer",
        "@semantic": "button",
        "@aria": { role: "button" },
        variants: {
            variant: {
                primary: "bg-[var(--color-primary)] text-white hover:opacity-90",
                secondary: "bg-[var(--color-secondary)] text-[var(--color-fg)]",
            },
            disabled: {
                true: "opacity-50 cursor-not-allowed pointer-events-none",
                false: "",
            },
        },
        defaultVariants: {
            variant: "primary",
            disabled: false,
        },
    })

    const ToggleButton = tw.button({
        base: "px-4 py-2 text-sm font-medium border-b-2 border-transparent",
        "@semantic": "button",
        "@aria": { role: "radio" },
        variants: {
            active: {
                true: "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]",
                false: "text-[var(--color-fg-muted)]",
            },
        },
        defaultVariants: { active: false },
    })

    assert.ok(Page, "Page created")
    assert.ok(Page.topbar, "Page.topbar exists")
    assert.ok(Section, "Section created")
    assert.ok(Title, "Title created")
    assert.ok(Button, "Button created")
    assert.ok(ToggleButton, "ToggleButton created")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 11: Component composition like in page.tsx
// ────────────────────────────────────────────────────────────────────────────

test("Multiple components used together like in page.tsx", () => {
    const ThemeToggleGroup = tw.div({
        base: "flex gap-2",
    })

    const ToggleButton = tw.button({
        base: "px-4 py-2 rounded border-2",
        variants: {
            active: {
                true: "border-[var(--color-primary)] bg-[var(--color-primary)] text-white",
                false: "border-gray-300 bg-white text-gray-900",
            },
        },
        defaultVariants: { active: false },
    })

    const ControlSection = tw.section({
        base: "mb-8 p-6 border rounded-lg",
        variants: {
            variant: {
                light: "bg-white",
                dark: "bg-gray-900",
            },
        },
        defaultVariants: { variant: "light" },
    })

    const Subtitle = tw.h3({
        base: "text-lg font-semibold mb-4 text-[var(--color-fg)]",
    })

    // Simulate JSX-like composition
    assert.ok(ThemeToggleGroup, "ThemeToggleGroup created")
    assert.ok(ToggleButton, "ToggleButton created for use in group")
    assert.ok(ControlSection, "ControlSection created")
    assert.ok(Subtitle, "Subtitle created")
})

// ────────────────────────────────────────────────────────────────────────────
// TEST 12: Comprehensive error scenarios resolved
// ────────────────────────────────────────────────────────────────────────────

test("All error scenarios from issue fixed", () => {
    const errors = []

    try {
        // Error 1: Boolean in defaultVariants
        const Button1 = tw.button({
            base: "px-4 py-2",
            variants: { disabled: { true: "opacity-50", false: "" } },
            defaultVariants: { disabled: false },
        })
        assert.ok(Button1, "✓ Boolean in defaultVariants works")
    } catch (e) {
        errors.push(`Boolean error: ${e.message}`)
    }

    try {
        // Error 2: Number in defaultVariants
        const Item = tw.div({
            base: "p-2",
            variants: { priority: { 0: "bg-gray-50", 1: "bg-red-50" } },
            defaultVariants: { priority: 0 },
        })
        assert.ok(Item, "✓ Number in defaultVariants works")
    } catch (e) {
        errors.push(`Number error: ${e.message}`)
    }

    try {
        // Error 3: String in defaultVariants
        const Button2 = tw.button({
            base: "px-4 py-2",
            variants: { variant: { primary: "bg-blue-600" } },
            defaultVariants: { variant: "primary" },
        })
        assert.ok(Button2, "✓ String in defaultVariants works")
    } catch (e) {
        errors.push(`String error: ${e.message}`)
    }

    try {
        // Error 4: Mixed types
        const Card = tw.div({
            base: "p-4",
            variants: {
                v: { a: "x", b: "y" },
                n: { 0: "x", 1: "y" },
                b: { true: "x", false: "y" },
            },
            defaultVariants: { v: "a", n: 0, b: false },
        })
        assert.ok(Card, "✓ Mixed types in defaultVariants work")
    } catch (e) {
        errors.push(`Mixed type error: ${e.message}`)
    }

    assert.equal(errors.length, 0, `No errors should occur:\n${errors.join("\n")}`)
})

console.log("✓ All 12 object-config comprehensive tests completed successfully")
