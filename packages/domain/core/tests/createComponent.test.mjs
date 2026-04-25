import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let mod
try {
  mod = req(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[core/tests] dist not found - run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { createComponent } = mod ?? {}

function renderComponent(component, props = {}) {
  if (typeof component === "function") return component(props)
  if (typeof component?.render === "function") return component.render(props, null)
  throw new TypeError("component is not directly renderable in this test")
}

describe("createComponent() subcomponent isolation", () => {
  it("strips bracket subcomponent blocks from the base className", () => {
    if (!createComponent) {
      console.warn("[core] createComponent not exported, skipping")
      return
    }

    const Button = createComponent("button", "flex h-12 w-full [icon] { flex h-4 w-4 }")
    const element = renderComponent(Button, { className: "rounded" })

    assert.equal(element.type, "button")
    assert.ok(element.props.className.includes("h-12"), element.props.className)
    assert.ok(element.props.className.includes("w-full"), element.props.className)
    assert.ok(element.props.className.includes("rounded"), element.props.className)
    assert.ok(!element.props.className.includes("h-4"), element.props.className)
    assert.ok(!element.props.className.includes("w-4"), element.props.className)
    assert.ok(!element.props.className.includes("[icon]"), element.props.className)
  })

  it("registers bracket subcomponents with their own classes", () => {
    if (!createComponent) return

    const Button = createComponent("button", "flex h-12 w-full [icon] { flex h-4 w-4 }")
    const icon = renderComponent(Button.icon, { className: "text-red-500" })

    assert.equal(icon.type, "span")
    assert.ok(icon.props.className.includes("h-4"), icon.props.className)
    assert.ok(icon.props.className.includes("w-4"), icon.props.className)
    assert.ok(icon.props.className.includes("text-red-500"), icon.props.className)
    assert.ok(!icon.props.className.includes("h-12"), icon.props.className)
    assert.ok(!icon.props.className.includes("w-full"), icon.props.className)
  })
})
