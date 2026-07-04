import { tw } from './dist/index.mjs'

console.log("=== Test Simple Card (no sub) ===\n")

try {
    const SimpleCard = tw.div({
        base: "bg-white rounded-lg p-4",
    })

    console.log("✅ SimpleCard created")
    console.log("   type:", typeof SimpleCard)
    console.log("   displayName:", SimpleCard?.displayName)
    console.log()

    // Try to render
    const result = SimpleCard({ className: "test" })
    console.log("✅ SimpleCard renders")
    console.log("   result type:", typeof result)

} catch (error) {
    console.error("❌ ERROR:", error.message)
    console.error(error.stack)
}

console.log("\n=== Test Card with String Sub (working) ===\n")

try {
    const CardWithSub = tw.div({
        base: "bg-white rounded-lg p-4",
        sub: {
            footer: "flex gap-2 mt-4 pt-4 border-t"
        }
    })

    console.log("✅ CardWithSub created")
    console.log("   type:", typeof CardWithSub)
    console.log("   CardWithSub.footer type:", typeof CardWithSub.footer)
    console.log()

    const result = CardWithSub({ className: "test" })
    console.log("✅ CardWithSub renders")

} catch (error) {
    console.error("❌ ERROR:", error.message)
}
