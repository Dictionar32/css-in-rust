/**
 * tailwind-styled-v4 — Route class attribution via static import graph
 *
 * Per-route CSS splitting yang sesungguhnya: bukan cuma "semua classes jadi
 * satu bucket __global", tapi exclusive-per-route classes vs shared classes.
 *
 * KENAPA INI BISA DIBANGUN SEKARANG (sebelumnya ditandai "butuh import-graph
 * tracing yang belum ada"): scanWorkspace() Rust SUDAH balikin classes
 * per-file (ScannedFile { file, classes, hash }) — yang belum ada cuma
 * relasi "file A import file B"-nya. Itu yang dibangun di sini, di sisi TS,
 * pakai static regex-based import extractor + resolusi tsconfig `paths`.
 * Tidak perlu native binding baru / rebuild Rust.
 *
 * ALGORITMA:
 *   1. Build adjacency list (file -> Set<file yang di-import>), regex-based,
 *      dibatasi ke file yang ada di dalam srcDir saja (bare/node_modules
 *      imports diabaikan — di luar scope atribusi route).
 *   2. Entry point per route = file yang match `app/.../page.{tsx,ts,jsx,js}`
 *      (sama heuristik dengan fileToRoute() di index.ts).
 *   3. BFS dari tiap entry -> reachable file set untuk route itu.
 *   4. Reverse: untuk tiap file, hitung berapa route yang bisa menjangkaunya.
 *      - Tepat 1 route -> classes file itu eksklusif ke route tersebut.
 *      - 0 atau 2+ route (termasuk layout/loading/error/template/
 *        not-found/default, dan file yang gak ke-reach sama sekali —
 *        misal dead code atau import yang gak ke-detect static parser
 *        ini, contoh: import dinamis berbasis variable) -> fallback ke
 *        "__global". Default selalu aman (gak pernah salah atribusi ke
 *        route yang salah), cuma bisa under-split di dynamic-import edge
 *        case.
 *
 * KETERBATASAN YANG DISADARI (belum di-handle, scope sengaja dibatasi):
 *   - Nested layout HARUSNYA cuma global utk subtree-nya (bukan whole app),
 *     tapi di sini SEMUA layout/loading/error/template selalu -> __global.
 *     Konservatif (over-share ke global), tidak pernah salah, tapi belum
 *     "true" subtree-scoped splitting.
 *   - Dynamic import dengan path non-literal (`import(someVar)`) tidak bisa
 *     di-resolve static parser ini — file tujuan jadi unreachable -> jatuh
 *     ke __global (aman, tapi gak ke-split).
 *   - Hanya resolve alias dari tsconfig.json/jsconfig.json root project
 *     (compilerOptions.paths + baseUrl). Alias yang didefinisikan di tempat
 *     lain (custom resolver webpack/turbopack) tidak ke-detect.
 */

import fs from "node:fs"
import path from "node:path"

export interface ScannedFileInput {
  file: string
  classes: string[]
}

export interface RouteClassBuckets {
  /** route path ("/", "/docs", "/blog/[slug]", ...) -> classes eksklusif route itu */
  routes: Map<string, Set<string>>
  /** classes shared 2+ route, layout/loading/error/template, atau unresolved */
  global: Set<string>
}

const CODE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs"]
const SHARED_SEGMENT_RE = /(?:^|[\\/])(layout|loading|error|template|not-found|default)\.(?:tsx|ts|jsx|js)$/
const PAGE_RE = /(?:^|[\\/])app[\\/](.*?)[\\/]page\.(?:tsx|ts|jsx|js)$/
const ROOT_PAGE_RE = /(?:^|[\\/])app[\\/]page\.(?:tsx|ts|jsx|js)$/

/** Derive route path dari path file page.tsx App Router. Sama heuristik dengan fileToRoute() di index.ts. */
function deriveRouteFromPageFile(normalizedFile: string): string | null {
  const rootMatch = normalizedFile.match(ROOT_PAGE_RE)
  if (rootMatch) return "/"
  const match = normalizedFile.match(PAGE_RE)
  if (!match) return null
  // Strip Next.js route group segments seperti "(marketing)" — tidak masuk URL.
  const segments = match[1]!.split("/").filter((s) => !(s.startsWith("(") && s.endsWith(")")))
  return `/${segments.join("/")}`
}

interface TsconfigAliasInfo {
  baseDir: string
  paths: Array<{ prefix: string; targets: string[] }>
}

/**
 * Strip // dan /* *\/ comment dari tsconfig.json/jsconfig.json, TANPA merusak
 * string literal. Naive `input.replace(/\/\*...*\//, "")` salah: tsconfig
 * path alias umum kayak "@/*" mengandung literal "/*", dan glob pattern di
 * "include" kayak "**\/*.ts" mengandung literal "*\/" — regex buta bakal
 * ngira itu comment delimiter dan makan sebagian JSON di antaranya, bikin
 * parse error. Tokenizer ini lacak in-string state (termasuk escape \") jadi
 * cuma strip comment yang BENERAN di luar string.
 */
function stripJsonComments(input: string): string {
  let out = ""
  let i = 0
  let inString = false
  let stringChar = ""
  while (i < input.length) {
    const ch = input[i]!
    if (inString) {
      out += ch
      if (ch === "\\" && i + 1 < input.length) {
        out += input[i + 1]
        i += 2
        continue
      }
      if (ch === stringChar) inString = false
      i++
      continue
    }
    if (ch === '"' || ch === "'") {
      inString = true
      stringChar = ch
      out += ch
      i++
      continue
    }
    if (ch === "/" && input[i + 1] === "/") {
      while (i < input.length && input[i] !== "\n") i++
      continue
    }
    if (ch === "/" && input[i + 1] === "*") {
      i += 2
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) i++
      i += 2
      continue
    }
    out += ch
    i++
  }
  return out
}

function loadTsconfigAliases(root: string): TsconfigAliasInfo | null {
  for (const candidate of ["tsconfig.json", "jsconfig.json"]) {
    const configPath = path.join(root, candidate)
    if (!fs.existsSync(configPath)) continue
    try {
      const raw = stripJsonComments(fs.readFileSync(configPath, "utf-8"))
      const parsed = JSON.parse(raw) as {
        compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> }
      }
      const co = parsed.compilerOptions
      if (!co?.paths) continue
      const baseDir = path.join(root, co.baseUrl ?? ".")
      const paths = Object.entries(co.paths).map(([prefix, targets]) => ({
        prefix: prefix.replace(/\*$/, ""),
        targets: targets.map((t) => t.replace(/\*$/, "")),
      }))
      return { baseDir, paths }
    } catch {
      // Tsconfig korup/gak valid JSON — skip, fallback ke relative-only.
      continue
    }
  }
  return null
}

/** Resolve satu module specifier ke absolute file path, atau null kalau gak bisa/di luar scope. */
function resolveSpecifier(
  specifier: string,
  fromFile: string,
  aliasInfo: TsconfigAliasInfo | null
): string | null {
  let candidate: string | null = null

  if (specifier.startsWith(".")) {
    candidate = path.resolve(path.dirname(fromFile), specifier)
  } else if (aliasInfo) {
    for (const { prefix, targets } of aliasInfo.paths) {
      if (specifier.startsWith(prefix)) {
        const rest = specifier.slice(prefix.length)
        candidate = path.join(aliasInfo.baseDir, targets[0] ?? "", rest)
        break
      }
    }
  }

  if (!candidate) return null // bare specifier (node_modules/framework) — di luar scope

  // Asset non-kode (css, image, dll) — bukan node graph, biarin gak ke-resolve.
  if (/\.(css|scss|sass|less|svg|png|jpe?g|gif|webp|json|woff2?|ttf|eot)$/i.test(candidate)) return null

  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate
  for (const ext of CODE_EXTENSIONS) {
    if (fs.existsSync(candidate + ext)) return candidate + ext
  }
  for (const ext of CODE_EXTENSIONS) {
    const indexPath = path.join(candidate, `index${ext}`)
    if (fs.existsSync(indexPath)) return indexPath
  }
  return null
}

const IMPORT_FROM_RE = /(?:import|export)(?:[^'"`;]*?)from\s+["']([^"']+)["']/g
const SIDE_EFFECT_IMPORT_RE = /^\s*import\s+["']([^"']+)["']/gm
const DYNAMIC_IMPORT_RE = /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g

function extractImportSpecifiers(source: string): string[] {
  const specs = new Set<string>()
  for (const re of [IMPORT_FROM_RE, SIDE_EFFECT_IMPORT_RE, DYNAMIC_IMPORT_RE]) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(source))) {
      if (m[1]) specs.add(m[1])
    }
  }
  return [...specs]
}

/**
 * Build route -> exclusive-classes map + global fallback bucket, dari hasil
 * scanWorkspace() (files[].classes) plus static import graph antar file.
 */
export function buildRouteClassBuckets(root: string, srcDir: string, files: ScannedFileInput[]): RouteClassBuckets {
  const aliasInfo = loadTsconfigAliases(root)
  const classesByFile = new Map<string, string[]>()
  const adjacency = new Map<string, Set<string>>()

  for (const f of files) {
    const normalized = path.normalize(f.file)
    classesByFile.set(normalized, f.classes)
    if (!adjacency.has(normalized)) adjacency.set(normalized, new Set())
  }

  for (const f of files) {
    const normalized = path.normalize(f.file)
    let source: string
    try {
      source = fs.readFileSync(normalized, "utf-8")
    } catch {
      continue // file mungkin udah kehapus/HMR race — skip, classes-nya tetap masuk ke __global lewat fallback unreachable
    }
    const edges = adjacency.get(normalized)!
    for (const spec of extractImportSpecifiers(source)) {
      const resolved = resolveSpecifier(spec, normalized, aliasInfo)
      if (resolved && classesByFile.has(resolved)) edges.add(resolved)
    }
  }

  // Entry point per route.
  const routeEntries: Array<{ route: string; file: string }> = []
  for (const f of files) {
    const normalized = path.normalize(f.file).replace(/\\/g, "/")
    const route = deriveRouteFromPageFile(normalized)
    if (route) routeEntries.push({ route, file: path.normalize(f.file) })
  }

  // BFS per route -> set file yang reachable.
  const reachableByRoute = new Map<string, Set<string>>()
  for (const { route, file } of routeEntries) {
    const visited = new Set<string>()
    const queue = [file]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) queue.push(next)
      }
    }
    reachableByRoute.set(route, visited)
  }

  // Reverse: file -> routes yang menjangkaunya.
  const routesByFile = new Map<string, Set<string>>()
  for (const [route, fileSet] of reachableByRoute) {
    for (const file of fileSet) {
      if (!routesByFile.has(file)) routesByFile.set(file, new Set())
      routesByFile.get(file)!.add(route)
    }
  }

  const result: RouteClassBuckets = { routes: new Map(), global: new Set() }
  for (const [file, classes] of classesByFile) {
    const normalizedSlash = file.replace(/\\/g, "/")
    const isSharedSegment = SHARED_SEGMENT_RE.test(normalizedSlash)
    const reachingRoutes = isSharedSegment ? new Set<string>() : routesByFile.get(file)

    if (!isSharedSegment && reachingRoutes && reachingRoutes.size === 1) {
      const [route] = reachingRoutes
      if (!result.routes.has(route!)) result.routes.set(route!, new Set())
      const bucket = result.routes.get(route!)!
      for (const cls of classes) bucket.add(cls)
    } else {
      for (const cls of classes) result.global.add(cls)
    }
  }

  return result
}

/** Slugify route path jadi nama file CSS yang aman. "/" -> "root", "/blog/[slug]" -> "blog__slug_". */
export function routeToCssFilename(route: string): string {
  const slug = route
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
  return `route_${slug || "root"}.css`
}
