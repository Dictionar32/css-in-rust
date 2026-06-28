import { defineConfig } from "tsup"
import { existsSync } from "fs"
import { readFile, writeFile, rm } from "node:fs/promises"
import path from "node:path"

const projectRoot = new URL(".", import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, "$1")
const root = (p: string) => `${projectRoot}${p}`

const entries = {
  webpackLoader: "packages/presentation/next/src/webpackLoader.ts",
  turbopackLoader: "packages/presentation/next/src/turbopackLoader.ts",
  animate: "src/umbrella/animate.ts",
  analyzer: "src/umbrella/analyzer.ts",
  atomic: "src/umbrella/atomic.ts",
  cli: "src/umbrella/cli.ts",
  compiler: "src/umbrella/compiler.ts",
  dashboard: "src/umbrella/dashboard.ts",
  devtools: "src/umbrella/devtools.ts",
  engine: "src/umbrella/engine.ts",
  next: "src/umbrella/next.ts",
  plugin: "src/umbrella/plugin.ts",
  "plugin-api": "src/umbrella/plugin-api.ts",
  "plugin-registry": "src/umbrella/plugin-registry.ts",
  preset: "src/umbrella/preset.ts",
  rspack: "src/umbrella/rspack.ts",
  runtime: "src/umbrella/runtime.ts",
  "runtime-css": "src/umbrella/runtime-css.ts",
  scanner: "src/umbrella/scanner.ts",
  shared: "src/umbrella/shared.ts",
  "storybook-addon": "src/umbrella/storybook-addon.ts",
  svelte: "src/umbrella/svelte.ts",
  syntax: "src/umbrella/syntax.ts",
  testing: "src/umbrella/testing.ts",
  theme: "src/umbrella/theme.ts",
  tw: "src/umbrella/tw.ts",
  vite: "src/umbrella/vite.ts",
  vue: "src/umbrella/vue.ts",
}

// "index" (the "." export) di-build TERPISAH dari entries di atas — lihat
// alasannya di komentar dekat nativeBrowserPlugin / defineConfig di bawah.
const indexEntry = { index: "src/umbrella/index.ts" }

const sharedExternal = [
  "react", "react-dom", "react/jsx-runtime",
  "next", "vite", "webpack", "@rspack/core",
  "vue", "svelte",
  "zod", "tailwindcss", "postcss", "inversify",
  "reflect-metadata", "@clack/prompts", "ts-pattern",
  "@storybook/types", "@storybook/core-events",
]

const nodeBuiltins = [
  "fs", "path", "os", "url", "crypto", "module",
  "child_process", "worker_threads", "stream", "events", "util",
  "node:fs", "node:path", "node:os", "node:url", "node:crypto",
  "node:module", "node:child_process", "node:worker_threads",
  "node:stream", "node:events", "node:util",
]

// ─── Preserve RSC directives via metafile ────────────────────────────────────
// esbuild strips leading directives ("use client", "use server") ketika
// directive ada di *imported* module, bukan di bundle entry point.
//
// Solusi: setelah tsup selesai tulis dist/, baca metafile-{format}.json untuk
// tau input → output mapping, lalu trace balik: kalau ada input file yang
// mulai dengan directive → prepend directive ke output chunk tersebut.
//
// Pattern ini zero-dependency, granular (hanya inject ke chunk yang relevan),
// dan robust terhadap code splitting. Ref: github.com/azex-ai/ledger
//
// FIX (2026-06-27): function ini sebelumnya cuma baca "metafile-esm.json" lalu
// filter output dengan `outPath.endsWith(".js")`. tsup nulis SATU metafile per
// format — `metafile-${format}.json` (lihat tsup@8.5.0 dist/index.js:628) —
// dan karena package.json di sini TIDAK punya "type":"module", output esm-nya
// berekstensi ".mjs", bukan ".js". Jadi filter lama itu skip SEMUA entry di
// metafile-esm.json (".mjs".endsWith(".js") === false), dan metafile-cjs.json
// (yang outputnya emang ".js") tidak pernah ikut dibaca sama sekali — net
// effect: directive TIDAK PERNAH ke-inject ke dist mana pun, walau source-nya
// sudah benar punya "use client" (lihat known-issues.md 2026-06-27). Sekarang
// loop kedua metafile, masing-masing dicocokkan ke ekstensi format-nya sendiri.
// ─────────────────────────────────────────────────────────────────────────────
const DIRECTIVE_RE = /^\s*["'](use (?:client|server))["']\s*[;\n]/

const FORMAT_EXTENSIONS: Record<string, string> = {
  esm: ".mjs",
  cjs: ".js",
}

interface Metafile {
  outputs: Record<string, { inputs: Record<string, unknown> }>
}

async function preserveDirectives(distDir: string): Promise<void> {
  const cwd = process.cwd()
  const cache = new Map<string, string | null>()

  const directiveOf = async (input: string): Promise<string | null> => {
    if (cache.has(input)) return cache.get(input)!
    try {
      const src = await readFile(path.resolve(cwd, input), "utf8")
      const directive = DIRECTIVE_RE.exec(src)?.[1] ?? null
      cache.set(input, directive)
      return directive
    } catch {
      cache.set(input, null)
      return null
    }
  }

  for (const [format, ext] of Object.entries(FORMAT_EXTENSIONS)) {
    const metaPath = path.resolve(distDir, `metafile-${format}.json`)

    let meta: Metafile
    try {
      meta = JSON.parse(await readFile(metaPath, "utf8")) as Metafile
    } catch {
      // metafile tidak ada (format ini tidak di-build di config ini) — skip
      continue
    }

    await Promise.all(
      Object.entries(meta.outputs).map(async ([outPath, output]) => {
        // Hanya proses output dengan ekstensi format ini (.mjs untuk esm,
        // .js untuk cjs) — skip .map, .d.ts, dan output format lain.
        if (!outPath.endsWith(ext)) return

        // Cari directive dari semua input files yang masuk ke chunk ini
        let directive: string | null = null
        for (const input of Object.keys(output.inputs)) {
          directive = await directiveOf(input)
          if (directive) break
        }
        if (!directive) return

        // Prepend directive ke output file jika belum ada
        const abs = path.resolve(cwd, outPath)
        const text = await readFile(abs, "utf8")
        if (text.startsWith(`"${directive}"`)) return
        await writeFile(abs, `"${directive}";\n${text}`)
      })
    )

    // Hapus metafile — build artifact only, jangan ikut ke-publish
    await rm(metaPath, { force: true })
  }
}

const sharedConfig = {
  clean: false,
  dts: false,
  tsconfig: "./tsconfig.json",
  outDir: "dist",
  splitting: false,
  noExternal: [/^@tailwind-styled\//] as RegExp[],
  sourcemap: true,
  treeshake: false,
  minify: false,
  // Ref: tsup docs — shims:true otomatis polyfill import.meta.url di CJS
  // dan __dirname/__filename di ESM. Menggantikan manual banner "file://unknown"
  // yang crash di Next.js Turbopack ESM context.
  // https://tsup.egoist.dev/#inject-cjs-and-esm-shims
  shims: true,
  // footer bukan banner — supaya tidak push "use client" ke baris ke-2.
  // preserveDirectives() akan inject directive di baris 1 via onSuccess.
  footer: {
    js: "/* tailwind-styled-v4 v5.1.9 | MIT | https://github.com/dictionar32/tailwind-styled-v4 */",
  },
  esbuildOptions(options: import("esbuild").BuildOptions, _context: { format: string }) {
    // The compiler package's native-bridge chunk is split out as a shared
    // chunk and marked sideEffects:false. When other packages bundle it in
    // (via noExternal above) but only use a subset of its exports, esbuild
    // correctly drops the now-unused bare import — but still warns about it.
    // Confirmed harmless: that chunk only contains top-level declarations
    // (no code actually runs at import time), so silence just this warning
    // code instead of changing tree-shaking/sideEffects behaviour repo-wide.
    options.logOverride = {
      ...options.logOverride,
      "ignored-bare-import": "silent",
    }
  },
}

const hasBrowserEntry = existsSync("src/umbrella/index.browser.ts")

// Path ke native.browser.ts — stub tanpa Node built-ins.
const nativeBrowserPath = root("packages/domain/core/src/native.browser.ts")
  .replace(/\\/g, "/")

// Path ke shared.browser.ts — stub untuk @tailwind-styled/shared (Node-only).
const sharedBrowserStubPath = root("src/stubs/shared.browser.ts")
  .replace(/\\/g, "/")

// Plugin ini di-inject via esbuildPlugins (bukan esbuildOptions) supaya
// jalan SEBELUM tsup's internal noExternal resolver.
//
// Kenapa esbuildPlugins, bukan esbuildOptions?
// - esbuildOptions dipanggil setelah tsup sudah setup internal plugins-nya.
//   Append/prepend di sana tidak cukup karena tsup bisa override lagi.
// - esbuildPlugins adalah tsup top-level option yang inject plugin sebelum
//   tsup mendaftarkan internal resolver-nya.
//
// Fix #3: ./native -> native.browser.ts
//   cv.ts, twProxy.ts, createComponent.ts, stateEngine.ts semua import
//   "./native" tanpa ekstensi. Harus di-redirect ke stub agar fs/module
//   tidak ikut terbundle.
//
// Fix #5: @tailwind-styled/shared -> shared.browser.ts
//   Shared import fs/crypto/module di top-level. Kalau ikut terbundle
//   ke browser output, Next.js langsung error "Can't resolve 'fs'".
//   index.browser.ts sudah pakai relative import langsung ke TS source
//   (bukan package import), jadi shared tidak masuk lewat @tailwind-styled/core.
//   Tapi kalau ada file lain yang import shared, plugin ini menangkapnya.
const nativeBrowserPlugin = {
  name: "native-to-browser-alias",
  setup(build: { onResolve: Function }) {
    // Fix #5: @tailwind-styled/shared -> no-op browser stub.
    build.onResolve(
      { filter: /^@tailwind-styled\/shared$/ },
      (_args: { path: string }) => ({ path: sharedBrowserStubPath })
    )

    // Fix #3: ./native dan ./compatibility -> native.browser.ts.
    build.onResolve(
      { filter: /(?:^|\/)(?:native|compatibility)(?:\.ts)?$/ },
      (args: { path: string; resolveDir: string }) => {
        const abs = path.resolve(args.resolveDir, args.path).replace(/\\/g, "/")
        if (
          abs.includes("packages/domain/core/src/native") ||
          abs.includes("packages/domain/core/src/compatibility")
        ) {
          return { path: nativeBrowserPath }
        }
      }
    )
  },
}

// ─── Kenapa "index" punya build config sendiri ───────────────────────────────
// Bug (2026-06-28): `tailwind-styled-v4`'s main "." export ("dist/index.mjs")
// di-tag "use client" oleh preserveDirectives() di atas — bukan karena
// index.ts sendiri punya directive itu, tapi karena dia re-export
// liveTokenEngine dari @tailwind-styled/theme/live-tokens, dan FILE ITU
// (packages/domain/theme/src/liveTokenEngine.ts) punya "use client" di baris
// pertama. preserveDirectives() benar mem-propagate directive itu ke SELURUH
// chunk index.mjs (karena splitting:false → satu file, satu directive untuk
// semuanya) — itu sendiri bukan bug, itu correct.
//
// Masalahnya: index.ts JUGA (transitif, lewat cv/cx/createComponent/merge/
// stateEngine/containerQuery/styledSystem/twProxy → ./native →
// @tailwind-styled/shared) bawa native.ts yang punya top-level
// `import { createRequire } from "node:module"` dkk — dan config Node di
// bawah ini sengaja set `external: nodeBuiltins` supaya import itu TIDAK
// di-inline, tetap sebagai `import ... from "fs"` literal di output (benar
// untuk konsumsi Node.js murni). Begitu file yang sama juga ke-tag
// "use client", Next.js/Turbopack mem-bundle dia sebagai bagian dari
// app-client chunking layer — dan layer itu (sudah divalidasi via repro
// minimal terpisah, lihat catatan investigasi) TIDAK BISA punya import Node
// builtin dalam bentuk APA PUN (bare "fs", "node:fs", maupun dynamic
// require() — sudah dicoba ketiganya). Makanya Turbopack build gagal dengan
// "Module not found: Can't resolve 'fs'/'module'" persis di dist/index.mjs.
//
// Fix: pisah "index" jadi config sendiri (tetap platform:"node", tetap
// format esm+cjs, tetap external nodeBuiltins — SAMA seperti config Node di
// bawah) tapi pasang nativeBrowserPlugin yang SAMA dengan yang browser build
// sudah pakai. Plugin ini redirect ./native + ./compatibility +
// @tailwind-styled/shared ke stub (native.browser.ts / shared.browser.ts)
// yang getNativeBinding()-nya selalu return null.
//
// Ini AMAN, bukan cuma nutup symptom: SEMUA pemanggil getNativeBinding() di
// cv.ts/cx.ts/createComponent.ts/merge.ts/stateEngine.ts/containerQuery.ts/
// styledSystem.ts/themeReader.ts/twProxy.ts sudah handle null dengan
// graceful JS fallback (mergeFallback.ts dkk) — pattern yang SAMA yang
// sudah jalan production hari ini di dist/index.browser.mjs. Konsekuensinya
// cuma: render SSR-pertama dari Client Component yang pakai tw.*/cv/cx via
// entry "." ini kehilangan akselerasi native Rust (jatuh ke JS fallback,
// sama seperti di browser) — bukan masalah korektnes, cuma sedikit lebih
// lambat di render SSR pertama saja. Build-time scanner/compiler (entry
// terpisah, tidak kena redirect ini) tetap full native.
//
// CATATAN (2026-06-28, UPDATE): dist/theme.mjs SUDAH di-fix dengan pattern
// yang sama persis seperti dijelaskan di atas — lihat
// packages/domain/theme/src/index.server.ts (cuma createTheme/
// compileDesignTokens/ThemeRegistry dkk, TANPA liveTokenEngine sama sekali)
// dan src/umbrella/theme.ts (sekarang import relative ke index.server, bukan
// "@tailwind-styled/theme" full barrel). native-bridge.ts TETAP penuh/real,
// TIDAK di-redirect ke stub — sudah divalidasi: dist/theme.mjs tidak
// "use client", masih bawa node:path/node:url asli, getNativeThemeBinding()
// adalah fungsi asli (bukan stub null).
//
// TEMUAN LEBIH DALAM (2026-06-28): bahkan SETELAH index.mjs lolos Turbopack
// BUILD (fix di atas), ternyata ada bug RUNTIME terpisah yang baru kelihatan
// pas benar-benar render: begitu SATU file ke-tag "use client", React/Next
// RSC mengubah SEMUA export dari file itu jadi "client reference" ketika
// di-import dari Server Component — bukan cuma export yang React component.
// Karena index.ts re-export liveTokenEngine (legit butuh "use client" —
// createUseTokens pakai React.useState/useEffect) ke DALAM bundle yang sama
// dengan tw/cv/cx/createComponent (splitting:false → satu file, satu
// directive untuk semua), Server Component manapun yang pakai `tw.div` di
// module scope (pattern yang SAMA dengan docs/page.tsx kamu) akan dapat
// `TypeError: tw.div is not a function` — BUKAN error build, baru muncul di
// fase "Collecting page data"/static generation. Dibuktikan empiris: strip
// manual "use client" dari dist/index.mjs → seluruh build (Server + Client
// Component) langsung lolos total.
//
// Fix: hapus re-export liveTokenEngine dari src/umbrella/index.ts (lihat
// file itu). Live-token functions (applyTokenSet, liveToken, tokenVar,
// createUseTokens, dkk — plus alias containerRef yang sebelumnya cuma ada
// di main entry, sekarang dipindah ke sini juga) sudah lengkap tersedia
// lewat "tailwind-styled-v4/runtime" (packages/domain/runtime/src/index.ts)
// — subpath itu SUDAH benar terisolasi sejak awal (dist/runtime.mjs "use
// client" tapi nol native builtin leak). Konsumen yang sebelumnya import
// live-token functions dari "tailwind-styled-v4" (main entry) — termasuk
// examples/next-js-app/src/components/LiveTokenDemo.tsx, sudah di-update di
// patch ini — perlu pindah ke "tailwind-styled-v4/runtime". Ini breaking
// change kecil untuk public API, catat di CHANGELOG.

const indexBuildConfig = {
  ...sharedConfig,
  entry: indexEntry,
  target: "node20" as const,
  platform: "node" as const,
  format: ["esm", "cjs"] as ["esm", "cjs"],
  external: [...sharedExternal, ...nodeBuiltins],
  esbuildPlugins: [nativeBrowserPlugin],
  metafile: true,
  async onSuccess() {
    await preserveDirectives("dist")
  },
}

export default defineConfig([
  // "." export — lihat blok komentar panjang di atas kenapa ini terpisah.
  indexBuildConfig,

  // Server / Node.js bundle — untuk tools, CLI, compiler (bukan SSR Next.js)
  {
    ...sharedConfig,
    entry: entries,
    target: "node20" as const,
    platform: "node" as const,
    format: ["esm", "cjs"] as const,
    external: [...sharedExternal, ...nodeBuiltins],
    // metafile: true wajib untuk preserveDirectives() — tsup tulis
    // metafile-esm.json yang kita pakai buat trace input → output mapping.
    metafile: true,
    async onSuccess() {
      await preserveDirectives("dist")
    },
  },

  // Browser bundle — zero Node built-ins, safe untuk Next.js Client Components.
  // index.browser.ts pakai relative import langsung ke TS source core
  // (bukan "@tailwind-styled/core/browser") sehingga tidak lewat exports map
  // dan dist compiled. Plugin ./native lalu bisa redirect dengan benar.
  ...(hasBrowserEntry
    ? [{
        ...sharedConfig,
        entry: { "index.browser": "src/umbrella/index.browser.ts" },
        target: "es2020" as const,
        platform: "browser" as const,
        format: ["esm" as const],
        external: [...sharedExternal, ...nodeBuiltins],
        esbuildPlugins: [nativeBrowserPlugin],
        // treeshake false untuk browser — pastikan semua exports (cv, cn, dll)
        // tidak di-drop oleh esbuild tree-shaking agresif yang melihat
        // native binding calls sebagai dead code karena return null.
        treeshake: false,
        esbuildOptions(options: import("esbuild").BuildOptions) {
          // ignoreAnnotations: abaikan /*#__PURE__*/ dan sideEffects:false
          // supaya cv dan fungsi lain tidak di-drop di browser bundle
          options.ignoreAnnotations = true
        },
      }]
    : []),
])