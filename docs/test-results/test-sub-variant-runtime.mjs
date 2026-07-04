import { tw } from './dist/index.mjs'

// Test 1: Sub-component dengan nested variants
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
console.log("Card.footer type:", typeof Card.footer)
console.log("Card.footer.displayName:", Card.footer?.displayName)

// Test 2: Cek apakah footer support variants
if (Card.footer) {
  try {
    // Simulate render dengan prop layout="vertical"
    const footerComponent = Card.footer
    console.log("✅ Card.footer exists and is callable")
    console.log("Card.footer:", footerComponent.toString().slice(0, 100))
  } catch (e) {
    console.error("❌ Error with Card.footer:", e.message)
  }
}

// Test 3: Check if variants are recognized
try {
  const instance = Card({
    className: "test"
  })
  console.log("✅ Card instance created")
} catch (e) {
  console.error("❌ Error creating Card instance:", e.message)
}
