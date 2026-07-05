/**
 * fix-numeric-variants.mjs
 *
 * Root-cause fix for the TS2769/TS1110 family of errors caused by
 * InferVariantPropsFromVariantsMap coercing numeric-shaped variant keys
 * ("1", "2", ...) into TypeScript `number` literal types, while call sites
 * throughout examples/next-js-app pass them as quoted strings.
 *
 * What this script does, in two passes over every .ts/.tsx file under
 * next-js-app/src:
 *
 * PASS A — scan every `tw.<tag>({ ... })` config object (and any
 *   `.withVariants({ ... })` call) for `variants` groups. For each group,
 *   record which of its option keys are numeric-shaped (e.g. "1", "42").
 *   TS's `keyof` normalizes those to number literal types no matter how
 *   they're written, so this is a structural property of the variant
 *   config, not a style choice.
 *
 * PASS B — using the component -> variant -> numericKeys map built in
 *   Pass A:
 *   1. Rewrite `defaultVariants: { variant: "N" }` -> `{ variant: N }`
 *      (and the same shape inside `compoundVariants` entries) whenever "N"
 *      is one of that variant's numeric keys.
 *   2. Rewrite JSX usages across the whole app:
 *        <Comp variant="N" />                  -> <Comp variant={N} />
 *        <Comp variant={x as "1" | "2" | ...} />-> <Comp variant={Number(x) as 1 | 2 | ...} />
 *        <Comp variant={String(x) as "1" | ...}/> -> <Comp variant={Number(x) as 1 | ...} />
 *      Only the numeric literal types inside a union are unquoted; a
 *      mixed union (e.g. "1" | "accent") is left with its non-numeric
 *      members quoted, and if an attribute's cast mixes numeric and
 *      non-numeric literal types in a way we can't safely rewrite
 *      mechanically, it is skipped and reported instead of guessed at.
 *
 * Nothing outside JSX attribute values feeding a *known numeric variant
 * prop* is touched — array literals used for unrelated purposes (map keys,
 * displayed text, lookups) are left exactly as-is.
 *
 * Usage:
 *   node fix-numeric-variants.mjs <path-to-next-js-app> [--dry-run]
 */

import { Project, SyntaxKind, Node } from "ts-morph"
import path from "node:path"

const targetDir = process.argv[2]
const dryRun = process.argv.includes("--dry-run")

if (!targetDir) {
  console.error("Usage: node fix-numeric-variants.mjs <path-to-next-js-app> [--dry-run]")
  process.exit(1)
}

const project = new Project({
  compilerOptions: {
    jsx: 4 /* react-jsx */,
    target: 99 /* latest */,
    allowJs: false,
    skipLibCheck: true,
  },
  useInMemoryFileSystem: false,
})

project.addSourceFilesAtPaths([
  path.join(targetDir, "src/**/*.ts"),
  path.join(targetDir, "src/**/*.tsx"),
])

const NUMERIC_KEY = /^\d+$/

/** @type {Map<string, Map<string, Set<string>>>} componentName -> variantName -> numeric keys */
const componentVariantNumericKeys = new Map()

const report = {
  numericGroupsFound: [], // { file, component, variant, keys }
  defaultVariantsFixed: [], // { file, component, variant, from, to }
  compoundVariantsFixed: [], // { file, component, variant, from, to }
  jsxStringFixed: [], // { file, component, attr, from, to }
  jsxCastFixed: [], // { file, component, attr, from, to }
  skipped: [], // { file, line, reason, snippet }
}

function textOfPropertyName(node) {
  if (Node.isIdentifier(node)) return node.getText()
  if (Node.isStringLiteral(node)) return node.getLiteralText()
  if (Node.isNumericLiteral(node)) return node.getText()
  return null
}

function getComponentNameFromTwCallChain(callExpr) {
  // Walk up from `tw.div({...})` (or `tw.div({...}).withVariants({...})`)
  // to the variable it's assigned to, e.g. `const GCell = tw.div({...})`.
  let node = callExpr
  while (node.getParent() && Node.isPropertyAccessExpression(node.getParent()) === false) {
    const parent = node.getParent()
    if (Node.isCallExpression(parent) && parent.getExpression() === node) {
      // shouldn't normally happen since callExpr already is the call
      break
    }
    if (Node.isVariableDeclaration(parent)) {
      return parent.getName()
    }
    if (Node.isPropertyAccessExpression(parent)) {
      // e.g. tw.div({...}).withVariants(...) — keep walking up through the chain
      const grandParent = parent.getParent()
      if (Node.isCallExpression(grandParent)) {
        node = grandParent
        continue
      }
    }
    break
  }
  // fallback: direct search up the ancestor chain for a VariableDeclaration
  const varDecl = callExpr.getFirstAncestor((a) => Node.isVariableDeclaration(a))
  return varDecl ? varDecl.getName() : null
}

function isTwOrWithVariantsCall(callExpr) {
  const expr = callExpr.getExpression()
  if (Node.isPropertyAccessExpression(expr)) {
    const name = expr.getName()
    const objExpr = expr.getExpression()
    if (Node.isIdentifier(objExpr) && objExpr.getText() === "tw") {
      return true // tw.div(...), tw.button(...), etc.
    }
    if (name === "withVariants") {
      return true // someComponent.withVariants(...)
    }
  }
  return false
}

function collectNumericKeysFromVariantsObject(variantsObj) {
  /** @type {Map<string, Set<string>>} */
  const result = new Map()
  for (const prop of variantsObj.getProperties()) {
    if (!Node.isPropertyAssignment(prop)) continue
    const variantName = textOfPropertyName(prop.getNameNode())
    const valueNode = prop.getInitializer()
    if (!variantName || !valueNode || !Node.isObjectLiteralExpression(valueNode)) continue
    const numericKeys = new Set()
    for (const optProp of valueNode.getProperties()) {
      if (!Node.isPropertyAssignment(optProp)) continue
      const keyText = textOfPropertyName(optProp.getNameNode())
      if (keyText && NUMERIC_KEY.test(keyText)) numericKeys.add(keyText)
    }
    if (numericKeys.size > 0) result.set(variantName, numericKeys)
  }
  return result
}

// ─── PASS A: discover numeric variant groups ──────────────────────────────

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath()
  const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
  for (const callExpr of callExprs) {
    if (!isTwOrWithVariantsCall(callExpr)) continue
    const args = callExpr.getArguments()
    if (args.length === 0 || !Node.isObjectLiteralExpression(args[0])) continue
    const configObj = args[0]
    const variantsProp = configObj.getProperty("variants")
    if (!variantsProp || !Node.isPropertyAssignment(variantsProp)) continue
    const variantsObj = variantsProp.getInitializer()
    if (!variantsObj || !Node.isObjectLiteralExpression(variantsObj)) continue

    const numericByVariant = collectNumericKeysFromVariantsObject(variantsObj)
    if (numericByVariant.size === 0) continue

    const componentName = getComponentNameFromTwCallChain(callExpr)
    if (!componentName) {
      report.skipped.push({
        file: filePath,
        line: callExpr.getStartLineNumber(),
        reason: "Found numeric variant group but couldn't resolve component name",
        snippet: callExpr.getText().slice(0, 80),
      })
      continue
    }

    if (!componentVariantNumericKeys.has(componentName)) {
      componentVariantNumericKeys.set(componentName, new Map())
    }
    const existing = componentVariantNumericKeys.get(componentName)
    for (const [variantName, keys] of numericByVariant) {
      const merged = existing.get(variantName) ?? new Set()
      for (const k of keys) merged.add(k)
      existing.set(variantName, merged)
      report.numericGroupsFound.push({
        file: filePath,
        component: componentName,
        variant: variantName,
        keys: [...keys],
      })
    }
  }
}

// ─── PASS B.1: fix defaultVariants / compoundVariants in config objects ───

function fixVariantValueAssignments(sourceFile, componentName, numericByVariant) {
  const filePath = sourceFile.getFilePath()
  const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
  for (const callExpr of callExprs) {
    if (!isTwOrWithVariantsCall(callExpr)) continue
    const args = callExpr.getArguments()
    if (args.length === 0 || !Node.isObjectLiteralExpression(args[0])) continue
    const configObj = args[0]
    const thisComponentName = getComponentNameFromTwCallChain(callExpr)
    if (thisComponentName !== componentName) continue

    // defaultVariants: { variant: "N" }
    const defaultVariantsProp = configObj.getProperty("defaultVariants")
    if (defaultVariantsProp && Node.isPropertyAssignment(defaultVariantsProp)) {
      const dvObj = defaultVariantsProp.getInitializer()
      if (dvObj && Node.isObjectLiteralExpression(dvObj)) {
        for (const prop of dvObj.getProperties()) {
          if (!Node.isPropertyAssignment(prop)) continue
          const variantName = textOfPropertyName(prop.getNameNode())
          const valueNode = prop.getInitializer()
          if (!variantName || !valueNode || !Node.isStringLiteral(valueNode)) continue
          const numericKeys = numericByVariant.get(variantName)
          const valueText = valueNode.getLiteralText()
          if (numericKeys && numericKeys.has(valueText)) {
            const from = valueNode.getText()
            if (!dryRun) valueNode.replaceWithText(valueText)
            report.defaultVariantsFixed.push({
              file: filePath,
              component: componentName,
              variant: variantName,
              from,
              to: valueText,
            })
          }
        }
      }
    }

    // compoundVariants: [{ variant: "N", ... }, ...]
    const compoundProp = configObj.getProperty("compoundVariants")
    if (compoundProp && Node.isPropertyAssignment(compoundProp)) {
      const arr = compoundProp.getInitializer()
      if (arr && Node.isArrayLiteralExpression(arr)) {
        for (const el of arr.getElements()) {
          if (!Node.isObjectLiteralExpression(el)) continue
          for (const prop of el.getProperties()) {
            if (!Node.isPropertyAssignment(prop)) continue
            const variantName = textOfPropertyName(prop.getNameNode())
            const valueNode = prop.getInitializer()
            if (!variantName || !valueNode || !Node.isStringLiteral(valueNode)) continue
            const numericKeys = numericByVariant.get(variantName)
            const valueText = valueNode.getLiteralText()
            if (numericKeys && numericKeys.has(valueText)) {
              const from = valueNode.getText()
              if (!dryRun) valueNode.replaceWithText(valueText)
              report.compoundVariantsFixed.push({
                file: filePath,
                component: componentName,
                variant: variantName,
                from,
                to: valueText,
              })
            }
          }
        }
      }
    }
  }
}

for (const sourceFile of project.getSourceFiles()) {
  for (const [componentName, numericByVariant] of componentVariantNumericKeys) {
    fixVariantValueAssignments(sourceFile, componentName, numericByVariant)
  }
}

// ─── PASS B.2: fix JSX call sites across the whole app ────────────────────

function getJsxTagName(openingLike) {
  const tag = openingLike.getTagNameNode()
  return tag.getText()
}

function fixUnionTypeNodeToNumeric(typeNode, numericKeys) {
  // typeNode is either a single LiteralType or a UnionType of LiteralTypes.
  // Returns { newText, allNumeric, touched } — allNumeric tells the caller
  // whether it's safe to also convert the paired expression (String(x) -> Number(x)).
  const memberNodes = Node.isUnionTypeNode(typeNode) ? typeNode.getTypeNodes() : [typeNode]
  let touchedAny = false
  let allNumeric = true
  const newParts = []
  for (const member of memberNodes) {
    if (Node.isLiteralTypeNode(member)) {
      const lit = member.getLiteral()
      if (Node.isStringLiteral(lit)) {
        const text = lit.getLiteralText()
        if (numericKeys.has(text)) {
          newParts.push(text) // unquoted numeric literal type
          touchedAny = true
          continue
        } else {
          allNumeric = false
          newParts.push(member.getText())
          continue
        }
      }
    }
    allNumeric = false
    newParts.push(member.getText())
  }
  return { newText: newParts.join(" | "), touchedAny, allNumeric }
}

for (const sourceFile of project.getSourceFiles()) {
  const filePath = sourceFile.getFilePath()
  const jsxElements = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
  ]

  for (const el of jsxElements) {
    const tagName = getJsxTagName(el)
    const numericByVariant = componentVariantNumericKeys.get(tagName)
    if (!numericByVariant) continue

    const attributes = el.getAttributes().filter((a) => Node.isJsxAttribute(a))
    for (const attr of attributes) {
      const attrName = attr.getNameNode().getText()
      const numericKeys = numericByVariant.get(attrName)
      if (!numericKeys) continue

      const initializer = attr.getInitializer()
      if (!initializer) continue

      // Case 1: color="1"
      if (Node.isStringLiteral(initializer)) {
        const text = initializer.getLiteralText()
        if (numericKeys.has(text)) {
          const from = initializer.getText()
          if (!dryRun) initializer.replaceWithText(`{${text}}`)
          report.jsxStringFixed.push({ file: filePath, component: tagName, attr: attrName, from, to: `{${text}}` })
        }
        continue
      }

      // Case 2: color={... as "1" | "2" | ...}
      if (Node.isJsxExpression(initializer)) {
        const expr = initializer.getExpression()
        if (!expr) continue

        if (Node.isAsExpression(expr)) {
          const typeNode = expr.getTypeNode()
          const { newText, touchedAny, allNumeric } = fixUnionTypeNodeToNumeric(typeNode, numericKeys)
          if (!touchedAny) continue

          const innerExpr = expr.getExpression()
          const fromText = initializer.getText()

          if (allNumeric) {
            // Safe to also fix the value side: String(x) -> Number(x), or wrap bare exprs.
            if (Node.isCallExpression(innerExpr) && innerExpr.getExpression().getText() === "String") {
              const callArgs = innerExpr.getArguments().map((a) => a.getText()).join(", ")
              const newExprText = `Number(${callArgs})`
              if (!dryRun) {
                expr.getExpression().replaceWithText(newExprText)
                typeNode.replaceWithText(newText)
              }
              report.jsxCastFixed.push({ file: filePath, component: tagName, attr: attrName, from: fromText, to: `{${newExprText} as ${newText}}` })
            } else {
              const innerText = innerExpr.getText()
              const alreadyNumericish = Node.isNumericLiteral(innerExpr) || innerText.startsWith("Number(")
              const newExprText = alreadyNumericish ? innerText : `Number(${innerText})`
              if (!dryRun) {
                expr.getExpression().replaceWithText(newExprText)
                typeNode.replaceWithText(newText)
              }
              report.jsxCastFixed.push({ file: filePath, component: tagName, attr: attrName, from: fromText, to: `{${newExprText} as ${newText}}` })
            }
          } else {
            // Mixed numeric + non-numeric union (e.g. "1" | "accent") — only
            // unquote the numeric members; DON'T touch the value expression,
            // since we can't safely infer whether it'll ever be "accent".
            if (!dryRun) typeNode.replaceWithText(newText)
            report.jsxCastFixed.push({
              file: filePath,
              component: tagName,
              attr: attrName,
              from: fromText,
              to: `{${innerExpr.getText()} as ${newText}} (mixed union — value expression left untouched, please verify)`,
            })
            report.skipped.push({
              file: filePath,
              line: attr.getStartLineNumber(),
              reason: `Mixed numeric/non-numeric union for "${attrName}" — only type literals were unquoted, value expression untouched`,
              snippet: fromText,
            })
          }
          continue
        }

        // Anything else assigned directly (identifier, ternary, etc.) that
        // isn't a plain string or an `as` cast — too risky to guess, flag it.
        report.skipped.push({
          file: filePath,
          line: attr.getStartLineNumber(),
          reason: `Unrecognized expression shape for numeric-variant attribute "${attrName}"`,
          snippet: initializer.getText().slice(0, 100),
        })
      }
    }
  }
}

// ─── Save & report ─────────────────────────────────────────────────────────

if (!dryRun) {
  project.saveSync()
}

function printSection(title, items, formatter) {
  console.log(`\n=== ${title} (${items.length}) ===`)
  for (const item of items) console.log(formatter(item))
}

console.log(`Mode: ${dryRun ? "DRY RUN (no files written)" : "WRITE"}`)

printSection(
  "Numeric variant groups discovered",
  report.numericGroupsFound,
  (i) => `${path.relative(targetDir, i.file)} :: ${i.component}.${i.variant} -> {${i.keys.join(", ")}}`
)

printSection(
  "defaultVariants fixed",
  report.defaultVariantsFixed,
  (i) => `${path.relative(targetDir, i.file)} :: ${i.component}.${i.variant}: ${i.from} -> ${i.to}`
)

printSection(
  "compoundVariants fixed",
  report.compoundVariantsFixed,
  (i) => `${path.relative(targetDir, i.file)} :: ${i.component}.${i.variant}: ${i.from} -> ${i.to}`
)

printSection(
  "JSX string attrs fixed",
  report.jsxStringFixed,
  (i) => `${path.relative(targetDir, i.file)} :: <${i.component} ${i.attr}=${i.from} /> -> ${i.attr}=${i.to}`
)

printSection(
  "JSX cast attrs fixed",
  report.jsxCastFixed,
  (i) => `${path.relative(targetDir, i.file)} :: <${i.component} ${i.attr}=${i.from} /> -> ${i.attr}=${i.to}`
)

printSection(
  "Skipped / needs manual review",
  report.skipped,
  (i) => `${path.relative(targetDir, i.file)}:${i.line} — ${i.reason}\n    ${i.snippet}`
)

console.log(`\nDone. ${report.defaultVariantsFixed.length} defaultVariants, ${report.compoundVariantsFixed.length} compoundVariants, ${report.jsxStringFixed.length + report.jsxCastFixed.length} JSX call sites fixed. ${report.skipped.length} flagged for manual review.`)
