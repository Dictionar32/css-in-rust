/**
 * Smoke Test: Object Config Variant Inference
 * Test object configs with boolean variant keys and defaultVariants work correctly.
 */

import { test } from "node:test"
import assert from "node:assert/strict"
import { tw } from "../../dist/index.mjs"

test("Object Config: Button with disabled variant (boolean keys)", () => {
    const Button = tw.button({
        base: "px-4 py-2 rounded-lg font-medium",
        variants: {
            variant: { primary: "bg-blue-600 text-white", secondary: "bg-gray-200" },
            disabled: { true: "opacity-50 cursor-not-allowed", false: "" },
        },
        defaultVariants: { variant: "primary", disabled: false },
    })
    assert.ok(Button, "Button component created")
})

test("Object Config: TabButton with active variant (boolean keys)", () => {
    const TabButton = tw.button({
        base: "px-4 py-2 text-sm font-medium border-b-2",
        variants: {
            active: { true: "border-blue-600 text-blue-600", false: "text-gray-600" },
        },
        defaultVariants: { active: false },
    })
    assert.ok(TabButton, "TabButton component created")
})

test("Object Config: ToggleButton with multiple boolean variants", () => {
    const ToggleButton = tw.button({
        base: "px-3 py-2 rounded-lg font-medium transition-all border-2",
        "@semantic": "button",
        "@aria": { role: "radio" },
        variants: {
            active: {
                true: "border-primary bg-primary text-white",
                false: "border-gray bg-bg text-fg",
            },
        },
        defaultVariants: { active: false },
    })
    assert.ok(ToggleButton, "ToggleButton component created")
})

test("Object Config: Card with @aria, @semantic, and sub-components", () => {
    const Card = tw.article({
        base: "bg-white rounded-lg p-6 shadow-md",
        "@semantic": "article",
        "@aria": { role: "region" },
        variants: {
            featured: { true: "border-2 border-blue-600", false: "border border-gray-200" },
        },
        defaultVariants: { featured: false },
        sub: { header: "border-b pb-4 mb-4", footer: "border-t pt-4 mt-4" },
    })
    assert.ok(Card, "Card component created")
    assert.ok(Card.header, "Card.header sub-component exists")
    assert.ok(Card.footer, "Card.footer sub-component exists")
})

test("Object Config: TabButton with boolean defaultVariants", () => {
    const TabButton = tw.button({
        base: "px-4 py-2",
        variants: { active: { true: "font-bold", false: "font-normal" } },
        defaultVariants: { active: false },
    })
    assert.ok(TabButton, "TabButton with boolean defaultVariants created")
})

test("Object Config: Multiple variants with mixed value types", () => {
    const Button = tw.button({
        base: "px-4 py-2",
        variants: {
            variant: { primary: "bg-blue-600", secondary: "bg-gray-200" },
            disabled: { true: "opacity-50", false: "" },
            size: { sm: "text-sm", lg: "text-lg" },
        },
        defaultVariants: { variant: "primary", disabled: false, size: "sm" },
    })
    assert.ok(Button, "Button with multiple variants created")
})

test("Object Config: Button with boolean defaultVariants values", () => {
    const configs = [
        { base: "btn", variants: { active: { true: "on", false: "off" } }, defaultVariants: { active: true } },
        { base: "btn", variants: { active: { true: "on", false: "off" } }, defaultVariants: { active: false } },
    ]
    for (const config of configs) {
        const comp = tw.button(config)
        assert.ok(comp, `Component created with defaultVariants: ${JSON.stringify(config.defaultVariants)}`)
    }
})
