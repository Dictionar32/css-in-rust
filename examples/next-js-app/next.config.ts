import { withTailwindStyled } from "@tailwind-styled/next"
import path from "node:path"
import { fileURLToPath } from "node:url"

const exampleRoot = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(exampleRoot, "..", "..")

const nextConfig = {
  reactCompiler: true,
  turbopack: {
    root: workspaceRoot,
  },
}

export default withTailwindStyled()(nextConfig)
