/**
 * REPRODUCTION: Object Config Overload Ambiguity
 * 
 * Error: "Object literal may only specify known properties, and 'base' does not exist in type 'TemplateStringsArray'"
 * 
 * Root Cause:
 * The TwTemplateFactory has 3 overloads:
 * 1. (strings: readonly [T], ...exprs: []) - Template literal with inferred sub-names
 * 2. (strings: TemplateStringsArray, ...exprs: unknown[]) - Template literal with expressions  
 * 3. (config: C) - Object config
 * 
 * When you call tw.div({ base: "...", sub: {...} }), TypeScript tries overloads 1 & 2
 * BEFORE overload 3, because overloads are checked in order.
 * 
 * Since { base: "..." } doesn't match TemplateStringsArray, it fails with confusing error.
 */

import { tw } from "tailwind-styled-v4"

// ✅ Works fine - simple object config
const Simple = tw.div({
    base: "p-4 rounded",
})

// ❌ FAILS - object config with nested sub-component variants
const PlaygroundWrap = tw.div({
    base: "rounded-xl border overflow-hidden",
    sub: {
        controls: "p-4",
        canvas: {
            base: "p-6 flex items-center justify-center",
            variants: {
                layout: {
                    "wrap": "gap-12 flex-wrap",
                    "column": "flex-col gap-0",
                },
            },
            defaultVariants: { layout: "wrap" },
        },
    },
})
// Error: Object literal may only specify known properties, and 'base' does not exist in type 'TemplateStringsArray'

/**
 * WHY IT FAILS:
 *
 * The TwTemplateFactory interface has overloads in this order:
 *
 * interface TwTemplateFactory<Config, Tag> {
 *   // Overload 1: Template literal (const inference)
 *   <const T extends string>(strings: readonly [T], ...exprs: []): TwStyledComponent<...>
 *
 *   // Overload 2: Template literal (with expressions)
 *   (strings: TemplateStringsArray, ...exprs: unknown[]): TwStyledComponent<...>
 *
 *   // Overload 3: Object config ← This should come FIRST!
 *   <C extends ComponentConfig>(config: C): TwStyledComponent<...>
 * }
 *
 * When calling tw.div({ base: "...", sub: {...} }):
 * - TypeScript tries Overload 1: Does { base: "..." } match readonly [string]? NO
 * - TypeScript tries Overload 2: Does { base: "..." } match TemplateStringsArray? NO
 * - TypeScript reports error from Overload 2 (last attempted)
 * - Never reaches Overload 3 (object config)
 *
 * SOLUTION:
 * Move the object config overload BEFORE template literal overloads so it's tried first.
 */

// Workaround (if fix not applied):
// Just use template literals without object config, or move to separate styles.ts file
