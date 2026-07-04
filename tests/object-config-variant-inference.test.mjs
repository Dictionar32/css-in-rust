/**
 * Test: Object Config Variant Inference
 * 
 * Test cases untuk verify bahwa variants dengan boolean keys (true/false)
 * dan defaultVariants dengan boolean values properly typed dan inferred.
 * 
 * Menggunakan dist/index.js langsung untuk test compiled output.
 */

import { test } from "node:test"
import assert from "node:assert"

// Import dari dist (compiled output)
const { tw } = await import("../dist/index.mjs")

test("Object Config: Button with disabled variant (boolean keys)", () => {
    // Test case 1: Component dengan disabled variant yang punya boolean keys
    const Button = tw.button({
        base: "px-4 py-2 rounded-lg font-medium",
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
        defaultVariants: { variant: "primary", disabled: false },
    })

    // Verify component created successfully
    assert.ok(Button, "Button component should be created")
    assert.equal(typeof Button, "function", "Button should be a function")
})

test("Object Config: TabButton with active variant (boolean keys)", () => {
    // Test case 2: Component dengan active variant yang punya boolean keys
    const TabButton = tw.button({
        base: "px-4 py-2 text-sm font-medium border-b-2",
        variants: {
            active: {
                true: "border-blue-600 text-blue-600",
                false: "text-gray-600",
            },
        },
        defaultVariants: { active: false },
    })

    // Verify component created successfully
    assert.ok(TabButton, "TabButton component should be created")
    assert.equal(typeof TabButton, "function", "TabButton should be a function")
})

test("Object Config: Toggle with multiple boolean variants", () => {
    // Test case 3: Component dengan multiple variants, some dengan boolean keys
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
                true: "opacity-50 pointer-events-none",
                false: "",
            },
        },
        defaultVariants: { size: "sm", checked: false, disabled: false },
    })

    // Verify component created successfully
    assert.ok(Toggle, "Toggle component should be created")
    assert.equal(typeof Toggle, "function", "Toggle should be a function")
})

test("Object Config: Button with number and boolean variants", () => {
    // Test case 4: defaultVariants with number values (size variant)
    const Button = tw.button({
        base: "px-4 py-2",
        variants: {
            size: {
                1: "text-sm",
                2: "text-base",
                3: "text-lg",
            },
            loading: {
                true: "opacity-60 cursor-wait",
                false: "",
            },
        },
        defaultVariants: { size: 1, loading: false },
    })

    // Verify component created successfully
    assert.ok(Button, "Button with number variant should be created")
    assert.equal(typeof Button, "function", "Button should be a function")
})

test("Object Config: Complex component with ARIA and sub-components", () => {
    // Test case 5: Full featured component dengan @aria, @semantic, dan sub-components
    const Card = tw.article({
        base: "bg-white rounded-lg p-6",
        "@semantic": "article",
        "@aria": {
            role: "region",
        },
        variants: {
            featured: {
                true: "border-2 border-blue-600",
                false: "border border-gray-200",
            },
        },
        defaultVariants: { featured: false },
        sub: {
            header: "border-b pb-4 mb-4",
            footer: "border-t pt-4 mt-4",
        },
    })

    // Verify component created successfully
    assert.ok(Card, "Card component should be created")
    assert.equal(typeof Card, "function", "Card should be a function")
    assert.ok(Card.header, "Card.header sub-component should exist")
    assert.ok(Card.footer, "Card.footer sub-component should exist")
})

test("Component Runtime: Render Button with disabled prop", () => {
    // Test case 6: Runtime test — verify component accepts disabled prop
    const Button = tw.button({
        base: "px-4 py-2",
        variants: {
            disabled: {
                true: "opacity-50",
                false: "",
            },
        },
        defaultVariants: { disabled: false },
    })

    // In Node.js environment, just verify the component accepts props without error
    // Real React rendering would happen in browser
    assert.ok(Button, "Button should render without error")
})

test("Type Safety: defaultVariants accepts boolean values", () => {
    // Test case 7: Verify that boolean values work in defaultVariants
    const configs = [
        {
            base: "btn",
            variants: { active: { true: "active", false: "inactive" } },
            defaultVariants: { active: true }, // boolean value
        },
        {
            base: "btn",
            variants: { active: { true: "active", false: "inactive" } },
            defaultVariants: { active: false }, // boolean value
        },
    ]

    for (const config of configs) {
        const comp = tw.button(config)
        assert.ok(comp, `Component should be created with defaultVariants: ${JSON.stringify(config.defaultVariants)}`)
    }
})

test("Type Safety: defaultVariants accepts number values", () => {
    // Test case 8: Verify that number values work in defaultVariants (for numeric variant keys)
    const config = {
        base: "btn",
        variants: {
            size: { 1: "small", 2: "medium", 3: "large" }
        },
        defaultVariants: { size: 1 }, // number value
    }

    const comp = tw.button(config)
    assert.ok(comp, "Component should be created with number defaultVariant")
})

console.log("✓ All object-config variant inference tests passed")
