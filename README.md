<!-- markdownlint-disable -->
<div align="center">

# ⚡ tailwind-styled-v4

### Rust-powered Tailwind CSS v4 untuk React

**Build-time compiler · Zero runtime overhead · RSC-aware · Next.js / Vite / Rspack**

[![npm](https://img.shields.io/npm/v/tailwind-styled-v4?color=e8612a&style=flat-square)](https://npmjs.com/package/tailwind-styled-v4)
[![license](https://img.shields.io/npm/l/tailwind-styled-v4?style=flat-square)](LICENSE)
[![Rust](https://img.shields.io/badge/Rust-1.75+-orange?style=flat-square&logo=rust)](https://rust-lang.org)
[![Node](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)](https://nodejs.org)
[![runtime](https://img.shields.io/badge/runtime-~4.5kb-brightgreen?style=flat-square)](https://bundlephobia.com/package/tailwind-styled-v4)

</div>

---

## Apa ini?

`tailwind-styled-v4` adalah library styling untuk React yang menggabungkan **DX styled-components** dengan **performa Tailwind CSS v4** dan **engine berbasis Rust**. Tulis komponen dengan `tw.button` atau `tw.div({ variants })` — compiler extract dan optimasi CSS di build time, bukan runtime.

<style>
/* GitHub-friendly dark/light mode */
:root {
  --tw-bg: #0d1117;
  --tw-bg2: #161b22;
  --tw-border: #30363d;
  --tw-text: #c9d1d9;
  --tw-text2: #8b949e;
  --tw-rust: #e8612a;
  --tw-rust-dim: rgba(232,97,42,0.15);
  --tw-green: #2ea043;
  --tw-red: #f85149;
  --tw-yellow: #d29922;
}
@media (prefers-color-scheme: light) {
  :root {
    --tw-bg: #ffffff;
    --tw-bg2: #f6f8fa;
    --tw-border: #d0d7de;
    --tw-text: #24292f;
    --tw-text2: #57606a;
    --tw-rust: #e8612a;
    --tw-rust-dim: rgba(232,97,42,0.1);
    --tw-green: #2c974b;
    --tw-red: #cf222e;
    --tw-yellow: #9a6700;
  }
}
.tw-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 0;
}
.tw-feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1px;
  background: var(--tw-border);
  border: 1px solid var(--tw-border);
  border-radius: 12px;
  overflow: hidden;
  margin: 1.5rem 0;
}
.tw-feature-card {
  background: var(--tw-bg);
  padding: 1.5rem;
}
.tw-feature-card:hover { background: var(--tw-bg2); }
.tw-feature-icon { font-size: 1.8rem; margin-bottom: 0.5rem; }
.tw-feature-title { font-weight: 700; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--tw-text); }
.tw-feature-desc { font-size: 0.875rem; color: var(--tw-text2); line-height: 1.5; }
.tw-table-wrap { overflow-x: auto; border: 1px solid var(--tw-border); border-radius: 12px; margin: 1rem 0; }
.tw-table { width: 100%; border-collapse: collapse; }
.tw-table th, .tw-table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--tw-border); }
.tw-table th { background: var(--tw-bg2); color: var(--tw-text2); font-weight: 600; font-size: 0.8rem; text-transform: uppercase; }
.tw-table td { color: var(--tw-text2); }
.tw-table td:first-child { color: var(--tw-text); font-weight: 500; }
.tw-check { color: var(--tw-green); font-weight: bold; }
.tw-cross { color: var(--tw-red); font-weight: bold; }
.tw-warn { color: var(--tw-yellow); font-weight: bold; }
.tw-code-block { background: var(--tw-bg2); border: 1px solid var(--tw-border); border-radius: 8px; margin: 1rem 0; overflow-x: auto; }
.tw-code-header { padding: 0.5rem 1rem; border-bottom: 1px solid var(--tw-border); font-family: monospace; font-size: 0.75rem; color: var(--tw-text2); display: flex; justify-content: space-between; }
.tw-code-pre { padding: 1rem; margin: 0; font-family: 'SF Mono', 'JetBrains Mono', monospace; font-size: 0.8rem; line-height: 1.6; color: var(--tw-text); }
.tw-pipeline { margin: 2rem 0; }
.tw-pipeline-step { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
.tw-pipeline-num { width: 2.2rem; height: 2.2rem; background: var(--tw-bg2); border: 1px solid var(--tw-border); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; color: var(--tw-rust); flex-shrink: 0; }
.tw-pipeline-step:first-child .tw-pipeline-num { background: var(--tw-rust); color: #fff; border-color: var(--tw-rust); }
.tw-bench-item { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin: 0.8rem 0; }
.tw-bench-label { width: 160px; font-family: monospace; font-size: 0.8rem; color: var(--tw-text2); }
.tw-bench-bar { flex: 2; height: 8px; background: var(--tw-bg2); border-radius: 10px; overflow: hidden; }
.tw-bench-fill { height: 100%; background: linear-gradient(90deg, var(--tw-rust), #f97316); width: 0%; border-radius: 10px; }
.tw-install-box { background: var(--tw-bg2); border: 1px solid var(--tw-border); border-radius: 12px; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin: 2rem 0; }
.tw-install-cmd { font-family: monospace; font-size: 1rem; background: var(--tw-bg); padding: 0.25rem 0.8rem; border-radius: 6px; border: 1px solid var(--tw-border); }
</style>

<div class="tw-section">

## Perbandingan

| Fitur | tailwind-styled-v4 | styled-components | Tailwind CSS biasa |
|-------|--------------------|-------------------|--------------------|
| Build-time CSS | <span class="tw-check">✓</span> via Rust | <span class="tw-cross">✗</span> runtime inject | <span class="tw-check">✓</span> |
| Runtime overhead | <span class="tw-check">✓</span> ~0 | <span class="tw-cross">✗</span> ~15KB | <span class="tw-check">✓</span> ~0 |
| Variants API | <span class="tw-check">✓</span> type-safe | <span class="tw-warn">⚠</span> terbatas | <span class="tw-cross">✗</span> |
| SSR/RSC support | <span class="tw-check">✓</span> zero config | <span class="tw-warn">⚠</span> butuh ServerStyleSheet | <span class="tw-check">✓</span> manual |
| Hydration mismatch | <span class="tw-check">✓</span> tidak ada | <span class="tw-warn">⚠</span> hash bisa beda | <span class="tw-check">✓</span> tidak ada |
| DevTools readable | <span class="tw-check">✓</span> class jelas | <span class="tw-cross">✗</span> `sc-abc123` | <span class="tw-check">✓</span> |
| Dark mode | <span class="tw-check">✓</span> `dark:` prefix | <span class="tw-warn">⚠</span> manual | <span class="tw-check">✓</span> |
| Engine | 🦀 Rust | JS | JS |

</div>

<hr>

<div class="tw-section">

## Fitur Unggulan

<div class="tw-feature-grid">
<div class="tw-feature-card"><div class="tw-feature-icon">🦀</div><div class="tw-feature-title">Rust Scanner Engine</div><div class="tw-feature-desc">Class scanner berbasis Rust via NAPI-RS — 425× lebih cepat dari scanner JS. Cache persistent antara dev server restart.</div></div>
<div class="tw-feature-card"><div class="tw-feature-icon">🎨</div><div class="tw-feature-title">Variants API</div><div class="tw-feature-desc">Object config dengan `variants`, `defaultVariants`, `compoundVariants`, dan `states` — semua fully typed di TypeScript.</div></div>
<div class="tw-feature-card"><div class="tw-feature-icon">🧩</div><div class="tw-feature-title">Sub-components</div><div class="tw-feature-desc">Definisikan `header`, `main`, `footer` langsung di config. Akses via `Card.header` — TypeScript infer nama otomatis.</div></div>
<div class="tw-feature-card"><div class="tw-feature-icon">⚡</div><div class="tw-feature-title">Real CSS Pipeline</div><div class="tw-feature-desc">Tailwind JS + LightningCSS generate real CSS dari class list — custom `@theme` ikut di-compile, bukan empty rules.</div></div>
<div class="tw-feature-card"><div class="tw-feature-icon">🌙</div><div class="tw-feature-title">Dark Mode</div><div class="tw-feature-desc">Pakai prefix `dark:` langsung — support `prefers-color-scheme` dan custom theme via CSS variables.</div></div>
<div class="tw-feature-card"><div class="tw-feature-icon">🚀</div><div class="tw-feature-title">Next.js App Router</div><div class="tw-feature-desc">Bekerja dengan RSC, Turbopack, dan App Router tanpa konfigurasi tambahan. Auto-detect CSS entry, inject plugin otomatis.</div></div>
</div>

</div>

<hr>

<div class="tw-section">

## Contoh Kode

**Button dengan variants & states**

<div class="tw-code-block">
<div class="tw-code-header"><span>button.tsx</span><span>tsx</span></div>
<pre class="tw-code-pre"><code>import { tw } from "tailwind-styled-v4"

export const Button = tw.button({
  base: `
    inline-flex items-center justify-center gap-2
    font-medium transition-all rounded-full
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  variants: {
    intent: {
      primary:   "bg-foreground text-background hover:bg-[#383838]",
      secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
      outline:   "bg-transparent border-2 border-foreground text-foreground",
      ghost:     "bg-transparent text-foreground hover:bg-gray-100",
    },
    size: { sm: "h-10 px-4 text-sm", md: "h-12 px-5", lg: "h-14 px-6" },
  },
  defaultVariants: { intent: "primary", size: "md" },
  states: { loading: "opacity-60 cursor-wait", fullWidth: "w-full" },
})

// Penggunaan — TypeScript autocomplete ✅
&lt;Button&gt;Default&lt;/Button&gt;
&lt;Button intent="ghost"&gt;Batal&lt;/Button&gt;
&lt;Button intent="outline" size="sm"&gt;Edit&lt;/Button&gt;
&lt;Button loading fullWidth&gt;Memproses...&lt;/Button&gt;</code></pre>
</div>

**Card dengan sub-components**

<div class="tw-code-block">
<div class="tw-code-header"><span>card.tsx</span><span>tsx</span></div>
<pre class="tw-code-pre"><code>const Card = tw.div({
  base: "rounded-xl bg-white shadow-md overflow-hidden",
  sub: {
    header:       "px-6 py-4 border-b font-semibold",
    main:         "px-6 py-4",
    footer:       "px-6 py-4 border-t text-xs text-gray-400",
    "div:action": "px-6 py-4 flex gap-3", // → Card.action
  },
  states: { selected: "ring-2 ring-blue-500" },
})

&lt;Card selected&gt;
  &lt;Card.header&gt;Judul&lt;/Card.header&gt;
  &lt;Card.main&gt;Konten&lt;/Card.main&gt;
  &lt;Card.action&gt;&lt;Button&gt;OK&lt;/Button&gt;&lt;/Card.action&gt;
  &lt;Card.footer&gt;Updated 2 hours ago&lt;/Card.footer&gt;
&lt;/Card&gt;</code></pre>
</div>

**Integrasi Next.js**

<div class="tw-code-block">
<div class="tw-code-header"><span>next.config.ts</span><span>ts</span></div>
<pre class="tw-code-pre"><code>import { withTailwindStyled } from "tailwind-styled-v4/next"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {}
export default withTailwindStyled()(nextConfig)</code></pre>
</div>

<div class="tw-code-block">
<div class="tw-code-header"><span>globals.css</span><span>css</span></div>
<pre class="tw-code-pre"><code>@import "tailwindcss";
@source "../.next/tw-classes/**";

:root { --background: #ffffff; --foreground: #171717; }
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}</code></pre>
</div>

</div>

<hr>

<div class="tw-section">

## Cara Kerja (Pipeline v5)

<div class="tw-pipeline">
<div class="tw-pipeline-step"><div class="tw-pipeline-num">1</div><div><strong>Rust scanner extract classes</strong> – Scan semua file `.tsx/.ts` di `src/`, extract class dari `base`, `variants`, `states`, `sub`.</div></div>
<div class="tw-pipeline-step"><div class="tw-pipeline-num">2</div><div><strong>Tailwind JS compile dengan user theme</strong> – Baca `@theme inline` dari CSS, generate real CSS untuk semua class.</div></div>
<div class="tw-pipeline-step"><div class="tw-pipeline-num">3</div><div><strong>LightningCSS post-process</strong> – Minify, vendor prefix, dead code elimination di production.</div></div>
<div class="tw-pipeline-step"><div class="tw-pipeline-num">4</div><div><strong>Output ke `_initial-scan.css`</strong> – File berisi `@layer utilities` dan di-scan oleh Tailwind via `@source`.</div></div>
<div class="tw-pipeline-step"><div class="tw-pipeline-num">5</div><div><strong>Persistent cache</strong> – Cache disimpan, startup berikutnya &lt;200ms.</div></div>
</div>

</div>

<hr>

<div class="tw-section">

## Benchmark

Diukur di Node.js 22, Rust 1.75.

<div class="tw-bench-item"><div class="tw-bench-label">Scan 1000 files</div><div class="tw-bench-bar"><div class="tw-bench-fill" style="width:100%"></div></div><code>0.8 ms</code> <span style="color:var(--tw-rust)">425× faster</span></div>
<div class="tw-bench-item"><div class="tw-bench-label">Compile 500 classes</div><div class="tw-bench-bar"><div class="tw-bench-fill" style="width:14%"></div></div><code>0.02 ms</code> <span style="color:var(--tw-rust)">60× faster</span></div>
<div class="tw-bench-item"><div class="tw-bench-label">Parse class string</div><div class="tw-bench-bar"><div class="tw-bench-fill" style="width:19%"></div></div><code>0.010 ms</code> <span style="color:var(--tw-rust)">80× faster</span></div>
<div class="tw-bench-item"><div class="tw-bench-label">Cache read/write</div><div class="tw-bench-bar"><div class="tw-bench-fill" style="width:13%"></div></div><code>0.009 ms</code> <span style="color:var(--tw-rust)">55× faster</span></div>
<div class="tw-bench-item"><div class="tw-bench-label">Watch mode rebuild</div><div class="tw-bench-bar"><div class="tw-bench-fill" style="width:4%"></div></div><code>&lt;5 ms</code> <span style="color:var(--tw-rust)">17× faster</span></div>

</div>

<hr>

<div class="tw-section">

## Instalasi

<div class="tw-install-box">
<div>
<div class="tw-install-cmd">npm install tailwind-styled-v4</div>
<div style="margin-top:0.5rem"><div class="tw-install-cmd">npx tw setup</div></div>
</div>
<div><strong>✨ Setup otomatis</strong><br>Deteksi bundler, inject plugin, pre-warm cache.</div>
<a href="https://github.com/Dictionar32/tailwind-styled-v4" target="_blank" rel="noopener" style="background:var(--tw-rust); color:#fff; padding:0.5rem 1rem; border-radius:8px; text-decoration:none;">GitHub →</a>
</div>

</div>

<hr>

<div align="center">
  <sub>© Dictionar32 · Built dengan 🦀 Rust + ⚡ Tailwind CSS v4 · <a href="https://npmjs.com/package/tailwind-styled-v4" target="_blank" rel="noopener">npm</a> · <a href="https://github.com/Dictionar32/tailwind-styled-v4/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a></sub>
</div>