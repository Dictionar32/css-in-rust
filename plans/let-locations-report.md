# Let Locations Report - tailwind-styled-v4

**Generated:** 2026-03-27 09:18:50

```text
Let Locations

Primary metric (package source executable lets): 38
Raw grep hits (secondary): 52

By package:

  cli (1)
    packages/infrastructure/cli/src/createApp.ts:394:  let count = 0

  compiler (6)
    packages/domain/compiler/src/astParser.ts:176:  let idx = 0
    packages/domain/compiler/src/astParser.ts:188:      let j = idx + 1
    packages/domain/compiler/src/astParser.ts:189:      let str = ch
    packages/domain/compiler/src/astParser.ts:245:      let j = idx
    packages/domain/compiler/src/astParser.ts:265:  let i = startIdx
    packages/domain/compiler/src/astParser.ts:320:  let i = startIdx

  core (8)
    packages/domain/core/src/parser.ts:116:  let token = ""
    packages/domain/core/src/parser.ts:117:  let square = 0
    packages/domain/core/src/parser.ts:118:  let round = 0
    packages/domain/core/src/parser.ts:119:  let escaped = false
    packages/domain/core/src/parser.ts:150:  let current = ""
    packages/domain/core/src/parser.ts:151:  let square = 0
    packages/domain/core/src/parser.ts:152:  let round = 0
    packages/domain/core/src/parser.ts:153:  let escaped = false

  next (3)
    packages/presentation/next/src/routeCssMiddleware.ts:124:  let concrete = routePattern
    packages/presentation/next/src/routeCssMiddleware.ts:28:let _manifest: RouteCssManifest | null = null
    packages/presentation/next/src/routeCssMiddleware.ts:29:let _manifestPath: string | null = null

  plugin (1)
    packages/domain/plugin/src/index.ts:195:let _globalRegistry: PluginRegistry = createRegistry()

  plugin-registry (2)
    packages/domain/plugin-registry/src/cli.ts:72:  let registryInstance: PluginRegistry
    packages/domain/plugin-registry/src/index.ts:326:let defaultRegistry: PluginRegistry | null = null

  shared (4)
    packages/domain/shared/src/shared.test.ts:103:  let tempDir: string
    packages/domain/shared/src/shared.test.ts:104:  let tempFile: string
    packages/domain/shared/src/shared.test.ts:231:  let stdout: string
    packages/domain/shared/src/shared.test.ts:232:  let stderr: string

  theme (2)
    packages/domain/theme/src/index.ts:238:    let style = document.getElementById(styleId) as HTMLStyleElement | null
    packages/domain/theme/src/native-bridge.ts:26:  let _binding: NativeThemeBinding | null | undefined

  vite (2)
    packages/presentation/vite/src/plugin.ts:87:  let root = process.cwd()
    packages/presentation/vite/src/plugin.ts:88:  let isDev = true

  vscode (9)
    packages/infrastructure/vscode/src/commands/doctorCommand.ts:16:      let html = `<!DOCTYPE html>
    packages/infrastructure/vscode/src/commands/traceCommand.ts:39:        let html = `<!DOCTYPE html>
    packages/infrastructure/vscode/src/commands/whyCommand.ts:39:        let html = `<!DOCTYPE html>
    packages/infrastructure/vscode/src/providers/inlineDecorationProvider.ts:17:let debounceTimer: NodeJS.Timeout | null = null
    packages/infrastructure/vscode/src/providers/inlineDecorationProvider.ts:24:  let count = 0
    packages/infrastructure/vscode/src/providers/inlineDecorationProvider.ts:44:  let match
    packages/infrastructure/vscode/src/utils/exec-script.ts:37:    let stdout = ""
    packages/infrastructure/vscode/src/utils/exec-script.ts:38:    let stderr = ""
    packages/infrastructure/vscode/src/utils/exec-script.ts:39:    let timedOut = false

All primary locations:
  packages/infrastructure/cli/src/createApp.ts:394:  let count = 0
  packages/domain/compiler/src/astParser.ts:176:  let idx = 0
  packages/domain/compiler/src/astParser.ts:188:      let j = idx + 1
  packages/domain/compiler/src/astParser.ts:189:      let str = ch
  packages/domain/compiler/src/astParser.ts:245:      let j = idx
  packages/domain/compiler/src/astParser.ts:265:  let i = startIdx
  packages/domain/compiler/src/astParser.ts:320:  let i = startIdx
  packages/domain/core/src/parser.ts:116:  let token = ""
  packages/domain/core/src/parser.ts:117:  let square = 0
  packages/domain/core/src/parser.ts:118:  let round = 0
  packages/domain/core/src/parser.ts:119:  let escaped = false
  packages/domain/core/src/parser.ts:150:  let current = ""
  packages/domain/core/src/parser.ts:151:  let square = 0
  packages/domain/core/src/parser.ts:152:  let round = 0
  packages/domain/core/src/parser.ts:153:  let escaped = false
  packages/presentation/next/src/routeCssMiddleware.ts:124:  let concrete = routePattern
  packages/presentation/next/src/routeCssMiddleware.ts:28:let _manifest: RouteCssManifest | null = null
  packages/presentation/next/src/routeCssMiddleware.ts:29:let _manifestPath: string | null = null
  packages/domain/plugin-registry/src/cli.ts:72:  let registryInstance: PluginRegistry
  packages/domain/plugin-registry/src/index.ts:326:let defaultRegistry: PluginRegistry | null = null
  packages/domain/plugin/src/index.ts:195:let _globalRegistry: PluginRegistry = createRegistry()
  packages/domain/shared/src/shared.test.ts:103:  let tempDir: string
  packages/domain/shared/src/shared.test.ts:104:  let tempFile: string
  packages/domain/shared/src/shared.test.ts:231:  let stdout: string
  packages/domain/shared/src/shared.test.ts:232:  let stderr: string
  packages/domain/theme/src/index.ts:238:    let style = document.getElementById(styleId) as HTMLStyleElement | null
  packages/domain/theme/src/native-bridge.ts:26:  let _binding: NativeThemeBinding | null | undefined
  packages/presentation/vite/src/plugin.ts:87:  let root = process.cwd()
  packages/presentation/vite/src/plugin.ts:88:  let isDev = true
  packages/infrastructure/vscode/src/commands/doctorCommand.ts:16:      let html = `<!DOCTYPE html>
  packages/infrastructure/vscode/src/commands/traceCommand.ts:39:        let html = `<!DOCTYPE html>
  packages/infrastructure/vscode/src/commands/whyCommand.ts:39:        let html = `<!DOCTYPE html>
  packages/infrastructure/vscode/src/providers/inlineDecorationProvider.ts:17:let debounceTimer: NodeJS.Timeout | null = null
  packages/infrastructure/vscode/src/providers/inlineDecorationProvider.ts:24:  let count = 0
  packages/infrastructure/vscode/src/providers/inlineDecorationProvider.ts:44:  let match
  packages/infrastructure/vscode/src/utils/exec-script.ts:37:    let stdout = ""
  packages/infrastructure/vscode/src/utils/exec-script.ts:38:    let stderr = ""
  packages/infrastructure/vscode/src/utils/exec-script.ts:39:    let timedOut = false

Secondary-only raw grep hits:
  packages/infrastructure/cli/src/commands/why.ts:22:    for (let i = 0; i < usedIn.length; i++) {
  packages/infrastructure/cli/src/commands/why.ts:36:    for (let i = 0; i < suggestions.length; i++) {
  packages/infrastructure/cli/src/commands/why.ts:46:    for (let i = 0; i < dependents.length; i++) {
  packages/infrastructure/cli/src/utils/args.ts:17:  for (let index = 0; index < argv.length; index++) {
  packages/infrastructure/cli/src/utils/whyService.ts:71:    for (let i = 0; i < file.classes.length; i++) {
  packages/domain/compiler/src/componentHoister.ts:79:  // dan pindahkan ke top of file — using reduce to avoid let (Zero Let!)
  packages/domain/compiler/src/styleBucketSystem.ts:255:    // Use reduce instead of mutable let total
  packages/domain/engine/src/bundleAnalyzer.ts:253:    // Use for...of + matchAll instead of while loop with let match
  packages/domain/engine/src/cssToIr.ts:148:  // Use for...of + matchAll instead of while loop with let match
  packages/domain/engine/src/cssToIr.ts:165:  // Use for...of + matchAll instead of while loop with let match

```
