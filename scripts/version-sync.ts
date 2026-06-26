import fs from "node:fs"
import path from "node:path"

const rootDir = process.cwd()
const rootPackagePath = path.join(rootDir, "package.json")
const rootPackage = JSON.parse(fs.readFileSync(rootPackagePath, "utf8"))
const version = rootPackage.version
const dependencySections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
]
const bannerFiles = [
  path.join(rootDir, "tsup.config.ts"),
  path.join(rootDir, "packages/domain/core/tsup.config.ts"),
  path.join(rootDir, "packages/domain/engine/tsup.config.ts"),
]

// Derive workspace package paths from the root `workspaces` field itself — this is the
// single source of truth npm uses to resolve workspace members. Previously this hardcoded
// `packages/*` (one level deep), which silently stopped matching anything after the
// monorepo-restructure-v2 move to `packages/{domain,infrastructure,presentation}/*` (two
// levels deep). That made this whole script a no-op for years without ever erroring —
// see plans/monorepo-restructure-v2-*.md and references/known-issues.md in the
// css-in-rust-debugger skill for the version-drift fallout this caused.
const workspaceGlobs: string[] = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : []

const workspacePackagePaths = workspaceGlobs.flatMap((glob) => {
  if (!glob.endsWith("/*")) {
    console.warn(`version-sync: unsupported workspace glob "${glob}" — skipping (only "<dir>/*" is supported)`)
    return []
  }
  const baseDir = path.join(rootDir, glob.slice(0, -2))
  if (!fs.existsSync(baseDir)) return []
  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(baseDir, entry.name, "package.json"))
    .filter((packagePath) => fs.existsSync(packagePath))
})

const workspacePackageNames = new Set()
for (const packagePath of workspacePackagePaths) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"))
  workspacePackageNames.add(pkg.name)
}

const changedFiles = []

for (const packagePath of [rootPackagePath, ...workspacePackagePaths]) {
  const isRoot = packagePath === rootPackagePath
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"))
  let changed = false

  if (!isRoot && pkg.version !== version) {
    pkg.version = version
    changed = true
  }

  for (const section of dependencySections) {
    const deps = pkg[section]
    if (!deps) continue
    for (const [dependencyName, dependencyVersion] of Object.entries(deps)) {
      if (!workspacePackageNames.has(dependencyName)) continue
      const nextVersion = `^${version}`
      if (dependencyVersion !== nextVersion) {
        deps[dependencyName] = nextVersion
        changed = true
      }
    }
  }

  if (!changed) continue

  fs.writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`)
  changedFiles.push(path.relative(rootDir, packagePath))
}

for (const bannerFile of bannerFiles) {
  if (!fs.existsSync(bannerFile)) continue
  const current = fs.readFileSync(bannerFile, "utf8")
  const next = current.replace(/v\d+\.\d+\.\d+/g, `v${version}`)
  if (next === current) continue
  fs.writeFileSync(bannerFile, next)
  changedFiles.push(path.relative(rootDir, bannerFile))
}

if (changedFiles.length === 0) {
  console.log(`versions already synced at ${version}`)
} else {
  console.log(`synced ${version} across:`)
  for (const changedFile of changedFiles) {
    console.log(`- ${changedFile}`)
  }
}