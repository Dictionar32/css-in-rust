import { tw } from 'tailwind-styled-v4'

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

// Test di component
export function Demo() {
  return (
    <>
      {/* Test 1: Pakai Card.footer dengan layout variant */}
      <Card>
        <div>Content</div>
        <Card.footer layout="horizontal">
          <button>Cancel</button>
          <button>Save</button>
        </Card.footer>
      </Card>

      {/* Test 2: Pakai layout="vertical" */}
      <Card>
        <div>Vertical Layout</div>
        <Card.footer layout="vertical">
          <button>Cancel</button>
          <button>Save</button>
        </Card.footer>
      </Card>
    </>
  )
}
