import { tw } from './dist/index.mjs'

console.log("=== Test Sub-Component dengan Nested Variants ===\n")

// Test: Sub-component dengan nested variants
try {
    const Card = tw.div({
        base: "bg-white rounded-lg p-4",
        sub: {
            footer: {
                base: "flex gap-2 mt-4 pt-4 border-t",
                variants: {
                    layout: {
                        horizontal: "flex-row justify-end",
                        vertical: "flex-col items-stretch"
                    }
                },
                defaultVariants: { layout: "horizontal" }
            }
        }
    })

    console.log("✅ Card component created")
    console.log("   Card type:", typeof Card)
    console.log("   Card.displayName:", Card.displayName)
    console.log()

    console.log("Footer sub-component:")
    console.log("   Card.footer type:", typeof Card.footer)
    console.log("   Card.footer.displayName:", Card.footer?.displayName)
    console.log()

    // Test render
    const divProps = Card({ className: "test-class" })
    console.log("✅ Card renders successfully")
    console.log("   Props type:", typeof divProps)
    console.log()

    // Test footer variant
    console.log("Testing Card.footer with layout='vertical':")
    const footerProps = Card.footer({ layout: "vertical", children: "Footer content" })
    console.log("✅ Card.footer renders with variant")
    console.log("   Props type:", typeof footerProps)

} catch (error) {
    console.error("❌ ERROR:", error.message)
    console.error(error.stack)
}
