/**
 * tailwind-styled-v4 — Vite Example
 *
 * Menunjukkan fitur utama:
 *  1. tw template literal
 *  2. tw object config + variants
 *  3. .extend() inheritance
 *  4. cx() merge utility
 *  5. Live token engine
 */

import { useState } from "react"
import { tw, cx } from "tailwind-styled-v4"

// ── 1. Template literal ─────────────────────────────────────────────────────
const Badge = tw.span`
  inline-flex items-center rounded-full px-2.5 py-0.5
  text-xs font-medium bg-blue-100 text-blue-800
`

// ── 2. Object config dengan variants ────────────────────────────────────────
const Button = tw.button({
  base: "inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400",
      danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    },
    size: {
      sm: "text-sm px-3 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-6 py-3",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
})

// ── 3. .extend() — turunan dari Button ──────────────────────────────────────
const IconButton = Button.extend`
  aspect-square justify-center rounded-full p-2
`

// ── 4. Card compound layout ──────────────────────────────────────────────────
const Card = tw.div`
  rounded-xl border border-gray-200 bg-white shadow-sm
  transition hover:shadow-md
`
const CardHeader = tw.div`px-6 py-4 border-b border-gray-100`
const CardBody = tw.div`px-6 py-4`
const CardFooter = tw.div`px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl`

// ── 5. Layout & Typography ────────────────────────────────────────────────────
const Header = tw.div({
  base: ""
})

const Title = tw.h1({
  base: "text-3xl font-bold text-gray-900"
})

const Subtitle = tw.p({
  base: "mt-1 text-gray-500"
})

const MainLayout = tw.main({
  base: "min-h-screen bg-gray-50 p-8"
})

const ContentWrapper = tw.div({
  base: "mx-auto max-w-2xl space-y-8"
})

const CardHeaderContent = tw.div({
  base: "flex items-center justify-between"
})

const CardHeaderTitle = tw.h2({
  base: "font-semibold text-gray-900"
})

const ButtonGrid = tw.div({
  base: "flex flex-wrap gap-3"
})

const CounterContainer = tw.div({
  base: "flex items-center gap-4"
})

const CounterDisplay = tw.span({
  base: "w-12 text-center text-2xl font-bold"
})

const CodeBlock = tw.code({
  base: "rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs"
})

const CounterNote = tw.p({
  base: "mt-3 text-sm text-gray-500"
})

const StatusContainer = tw.div({
  base: "flex items-center gap-3"
})

const StatusText = tw.span({
  base: "text-sm text-gray-700"
})

// ── 6. cx() conditional merge ────────────────────────────────────────────────
const StatusDot = tw.span({
  base: "h-2.5 w-2.5 rounded-full",
  variants: {
    online: {
      true: "bg-green-500",
      false: "bg-gray-300",
    },
  },
  defaultVariants: { online: "true" },
})

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [count, setCount] = useState(0)
  const [online, setOnline] = useState(true)

  return (
    <MainLayout>
      <ContentWrapper>

        {/* Header */}
        <Header>
          <Title>tailwind-styled-v4</Title>
          <Subtitle>Vite example — template literal, variants, extend, cx</Subtitle>
        </Header>

        {/* Card dengan semua fitur */}
        <Card>
          <CardHeader>
            <CardHeaderContent>
              <CardHeaderTitle>Button Variants</CardHeaderTitle>
              <Badge>tw.button()</Badge>
            </CardHeaderContent>
          </CardHeader>
          <CardBody>
            <ButtonGrid>
              <Button intent="primary">Primary</Button>
              <Button intent="secondary">Secondary</Button>
              <Button intent="danger">Danger</Button>
              <Button intent="primary" size="sm">Small</Button>
              <Button intent="primary" size="lg">Large</Button>
            </ButtonGrid>
          </CardBody>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Object config + variants — pilih kombinasi intent &amp; size
            </p>
          </CardFooter>
        </Card>

        {/* Counter dengan IconButton */}
        <Card>
          <CardHeader>
            <CardHeaderTitle>Counter + extend()</CardHeaderTitle>
          </CardHeader>
          <CardBody>
            <CounterContainer>
              <IconButton intent="secondary" onClick={() => setCount(c => c - 1)}>
                −
              </IconButton>
              <CounterDisplay>{count}</CounterDisplay>
              <IconButton intent="primary" onClick={() => setCount(c => c + 1)}>
                +
              </IconButton>
            </CounterContainer>
            <CounterNote>
              <CodeBlock>
                IconButton = Button.extend`...`
              </CodeBlock>
            </CounterNote>
          </CardBody>
        </Card>

        {/* StatusDot demo */}
        <Card>
          <CardHeader>
            <CardHeaderTitle>Variants conditional</CardHeaderTitle>
          </CardHeader>
          <CardBody>
            <StatusContainer>
              <StatusDot online={online ? "true" : "false"} />
              <StatusText>
                Status: <strong>{online ? "Online" : "Offline"}</strong>
              </StatusText>
              <Button
                intent="secondary"
                size="sm"
                onClick={() => setOnline(v => !v)}
              >
                Toggle
              </Button>
            </StatusContainer>
          </CardBody>
        </Card>

      </ContentWrapper>
    </MainLayout>
  )
}
