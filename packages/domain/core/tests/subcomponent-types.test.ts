import { tw } from "../src/index"

const NoBracketButton = tw.button`
  inline-flex items-center gap-2
  icon { h-4 w-4 }
  label { truncate }
`

NoBracketButton.icon
NoBracketButton.label
// @ts-expect-error footer is not declared in the template
NoBracketButton.footer

const BracketButton = tw.button`
  inline-flex items-center gap-2
  [icon] { h-4 w-4 }
  [label] { truncate }
`

BracketButton.icon
BracketButton.label
// @ts-expect-error footer is not declared in the template
BracketButton.footer

const ManualButton = tw.button`inline-flex items-center`.withSub<"icon" | "label">()

ManualButton.icon
ManualButton.label
// @ts-expect-error footer was not declared via withSub
ManualButton.footer
