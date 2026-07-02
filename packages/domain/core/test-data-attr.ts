import type React from "react"
type A = React.ComponentPropsWithoutRef<"div">
type B = A["data-testid"]  // should be string
