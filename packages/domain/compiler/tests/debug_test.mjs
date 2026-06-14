import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const targetPath = pathToFileURL(path.resolve(__dirname, "../dist/compiler/index.js")).href
console.log("Loading targetPath:", targetPath)
const compilerMod = await import(targetPath)

const { compileToCssBatch } = compilerMod
console.log("compileToCssBatch:", compileToCssBatch.toString())

const classes = ["bg-blue-600", "p-4"]
const css = compileToCssBatch(classes, true)
console.log("CSS Output:", JSON.stringify(css))
