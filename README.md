<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>tailwind-styled-v4 — Rust-powered Tailwind CSS for React</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0a0a0b;
    --bg2: #111113;
    --bg3: #18181b;
    --border: #27272a;
    --border2: #3f3f46;
    --rust: #e8612a;
    --rust2: #f97316;
    --rust-dim: #e8612a22;
    --text: #fafafa;
    --text2: #a1a1aa;
    --text3: #71717a;
    --green: #22c55e;
    --red: #ef4444;
    --blue: #3b82f6;
    --yellow: #eab308;
    --code-bg: #0d0d10;
    --token-keyword: #f97316;
    --token-string: #86efac;
    --token-comment: #52525b;
    --token-fn: #93c5fd;
    --token-type: #fde68a;
    --token-num: #c4b5fd;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    line-height: 1.7;
    -webkit-font-smoothing: antialiased;
  }

  /* ── NAV ── */
  nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(10,10,11,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0 2rem;
    height: 56px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-logo {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.05rem;
    color: var(--text);
    text-decoration: none;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .nav-logo .rust-dot { color: var(--rust); }
  .nav-links { display: flex; gap: 2rem; }
  .nav-links a {
    color: var(--text2);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: color 0.15s;
  }
  .nav-links a:hover { color: var(--text); }
  .nav-npm {
    background: var(--rust);
    color: #fff;
    padding: 0.375rem 1rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s;
    font-family: 'DM Mono', monospace;
  }
  .nav-npm:hover { opacity: 0.85; }

  /* ── HERO ── */
  .hero {
    min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center;
    padding: 7rem 2rem 4rem;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(232,97,42,0.15), transparent),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(249,115,22,0.08), transparent);
    pointer-events: none;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--rust-dim);
    border: 1px solid rgba(232,97,42,0.3);
    color: var(--rust2);
    padding: 0.35rem 1rem;
    border-radius: 100px;
    font-size: 0.78rem;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.03em;
    margin-bottom: 2rem;
    animation: fadeUp 0.6s ease both;
  }
  .hero h1 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(2.8rem, 7vw, 5.5rem);
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin-bottom: 1.25rem;
    animation: fadeUp 0.6s 0.1s ease both;
  }
  .hero h1 .rust { color: var(--rust); }
  .hero h1 .dim { color: var(--text3); }
  .hero-sub {
    font-size: clamp(1rem, 2vw, 1.2rem);
    color: var(--text2);
    max-width: 600px;
    margin-bottom: 2.5rem;
    font-weight: 300;
    animation: fadeUp 0.6s 0.2s ease both;
  }
  .hero-actions {
    display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
    margin-bottom: 4rem;
    animation: fadeUp 0.6s 0.3s ease both;
  }
  .btn-primary {
    background: var(--rust);
    color: #fff;
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    transition: all 0.15s;
    display: inline-flex; align-items: center; gap: 0.5rem;
  }
  .btn-primary:hover { background: var(--rust2); transform: translateY(-1px); }
  .btn-secondary {
    background: transparent;
    border: 1px solid var(--border2);
    color: var(--text);
    padding: 0.75rem 2rem;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.95rem;
    text-decoration: none;
    transition: all 0.15s;
    font-family: 'DM Mono', monospace;
    font-size: 0.85rem;
  }
  .btn-secondary:hover { border-color: var(--text3); background: var(--bg3); }

  /* ── STATS ── */
  .stats {
    display: flex; gap: 3rem; flex-wrap: wrap; justify-content: center;
    animation: fadeUp 0.6s 0.4s ease both;
  }
  .stat { text-align: center; }
  .stat-val {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 2rem;
    color: var(--rust);
    line-height: 1;
    margin-bottom: 0.25rem;
  }
  .stat-label { font-size: 0.78rem; color: var(--text3); font-weight: 500; text-transform: uppercase; letter-spacing: 0.08em; }

  /* ── SECTION ── */
  section { padding: 6rem 2rem; max-width: 1100px; margin: 0 auto; }
  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--rust);
    margin-bottom: 0.75rem;
  }
  h2 {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    letter-spacing: -0.02em;
    line-height: 1.1;
    margin-bottom: 1rem;
  }
  .section-desc { color: var(--text2); max-width: 600px; margin-bottom: 3rem; font-size: 1.05rem; }

  /* ── CODE BLOCK ── */
  .code-wrap {
    background: var(--code-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    position: relative;
  }
  .code-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.75rem 1.25rem;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.02);
  }
  .code-dots { display: flex; gap: 0.4rem; }
  .code-dots span {
    width: 11px; height: 11px; border-radius: 50%;
  }
  .code-dots .r { background: #ff5f56; }
  .code-dots .y { background: #ffbd2e; }
  .code-dots .g { background: #27c93f; }
  .code-fname {
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    color: var(--text3);
  }
  .code-lang {
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    color: var(--text3);
    background: var(--bg3);
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    border: 1px solid var(--border);
  }
  pre {
    padding: 1.5rem;
    overflow-x: auto;
    font-family: 'DM Mono', monospace;
    font-size: 0.845rem;
    line-height: 1.75;
    tab-size: 2;
  }
  code { font-family: inherit; }

  /* Syntax tokens */
  .k { color: var(--token-keyword); }
  .s { color: var(--token-string); }
  .c { color: var(--token-comment); font-style: italic; }
  .f { color: var(--token-fn); }
  .t { color: var(--token-type); }
  .n { color: var(--token-num); }
  .p { color: var(--text2); }
  .w { color: var(--text); }

  /* ── COMPARISON TABLE ── */
  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: 12px;
  }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: var(--bg3);
    padding: 0.85rem 1.25rem;
    text-align: left;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  td {
    padding: 0.85rem 1.25rem;
    border-bottom: 1px solid var(--border);
    font-size: 0.9rem;
    color: var(--text2);
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.01); }
  td:first-child { color: var(--text); font-weight: 500; }
  .check { color: var(--green); font-size: 1.1rem; }
  .cross { color: var(--red); font-size: 1.1rem; }
  .warn { color: var(--yellow); font-size: 1.1rem; }
  td code {
    background: var(--bg3);
    border: 1px solid var(--border);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    color: var(--text);
  }

  /* ── FEATURE GRID ── */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .feature-card {
    background: var(--bg);
    padding: 2rem;
    transition: background 0.15s;
  }
  .feature-card:hover { background: var(--bg2); }
  .feature-icon {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }
  .feature-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: var(--text);
  }
  .feature-desc { font-size: 0.875rem; color: var(--text2); line-height: 1.6; }

  /* ── BENCHMARK ── */
  .bench-list { display: flex; flex-direction: column; gap: 1rem; }
  .bench-item {
    display: flex; align-items: center; gap: 1.5rem;
  }
  .bench-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.8rem;
    color: var(--text2);
    width: 180px;
    flex-shrink: 0;
  }
  .bench-bar-wrap {
    flex: 1;
    height: 8px;
    background: var(--bg3);
    border-radius: 100px;
    overflow: hidden;
    position: relative;
  }
  .bench-bar {
    height: 100%;
    border-radius: 100px;
    background: linear-gradient(90deg, var(--rust), var(--rust2));
    animation: barGrow 1s ease both;
    transform-origin: left;
  }
  @keyframes barGrow {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  .bench-val {
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    color: var(--rust);
    font-weight: 500;
    width: 90px;
    text-align: right;
    flex-shrink: 0;
  }
  .bench-speedup {
    font-size: 0.72rem;
    color: var(--text3);
    width: 60px;
    flex-shrink: 0;
  }

  /* ── PIPELINE ── */
  .pipeline {
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
  }
  .pipeline::before {
    content: '';
    position: absolute;
    left: 1.25rem;
    top: 2.5rem;
    bottom: 2.5rem;
    width: 1px;
    background: linear-gradient(to bottom, var(--rust), var(--border), var(--border));
  }
  .pipeline-step {
    display: flex;
    gap: 1.5rem;
    padding: 1.25rem 0;
  }
  .pipeline-num {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--bg3);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Mono', monospace;
    font-size: 0.78rem;
    color: var(--rust);
    font-weight: 600;
    flex-shrink: 0;
    z-index: 1;
    position: relative;
  }
  .pipeline-step:first-child .pipeline-num {
    background: var(--rust);
    color: #fff;
    border-color: var(--rust);
  }
  .pipeline-content { padding-top: 0.4rem; }
  .pipeline-title {
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.25rem;
    font-size: 0.95rem;
  }
  .pipeline-desc { font-size: 0.85rem; color: var(--text2); }
  .pipeline-tag {
    display: inline-block;
    background: var(--rust-dim);
    color: var(--rust2);
    padding: 0.1rem 0.5rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-family: 'DM Mono', monospace;
    margin-left: 0.5rem;
    border: 1px solid rgba(232,97,42,0.2);
  }

  /* ── INSTALL BOX ── */
  .install-box {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    flex-wrap: wrap;
  }
  .install-cmd {
    font-family: 'DM Mono', monospace;
    font-size: 1.1rem;
    color: var(--text);
    display: flex; align-items: center; gap: 1rem;
  }
  .install-prompt { color: var(--rust); }
  .install-desc { color: var(--text2); font-size: 0.875rem; max-width: 300px; }

  /* ── FOOTER ── */
  footer {
    border-top: 1px solid var(--border);
    padding: 3rem 2rem;
    text-align: center;
    color: var(--text3);
    font-size: 0.825rem;
    max-width: 1100px;
    margin: 0 auto;
  }
  footer a { color: var(--text2); text-decoration: none; }
  footer a:hover { color: var(--rust); }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ── TWO COL ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
  @media (max-width: 768px) {
    .two-col { grid-template-columns: 1fr; }
    .stats { gap: 2rem; }
    .bench-label { width: 120px; font-size: 0.72rem; }
    .install-box { flex-direction: column; }
    .nav-links { display: none; }
  }

  /* ── BADGE ROW ── */
  .badge-row {
    display: flex; gap: 0.5rem; flex-wrap: wrap;
    margin-bottom: 3rem;
    animation: fadeUp 0.6s 0.35s ease both;
  }
  .badge-row img { height: 20px; }

  /* ── INLINE CODE ── */
  p code, li code {
    background: var(--bg3);
    border: 1px solid var(--border);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.82em;
    font-family: 'DM Mono', monospace;
    color: var(--text);
  }
  ul { padding-left: 1.5rem; }
  li { margin-bottom: 0.4rem; color: var(--text2); font-size: 0.925rem; }
  li strong { color: var(--text); }

  /* ── DIVIDER ── */
  .divider {
    border: none;
    border-top: 1px solid var(--border);
    max-width: 1100px;
    margin: 0 auto;
  }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <a href="#" class="nav-logo">
    <span class="rust-dot">⚡</span> tailwind-styled<span class="rust-dot">-v4</span>
  </a>
  <div class="nav-links">
    <a href="#features">Features</a>
    <a href="#how-it-works">How it works</a>
    <a href="#examples">Examples</a>
    <a href="#benchmark">Benchmark</a>
    <a href="https://github.com/Dictionar32/tailwind-styled-v4">GitHub</a>
  </div>
  <a href="https://npmjs.com/package/tailwind-styled-v4" class="nav-npm">npm install</a>
</nav>

<!-- HERO -->
<div class="hero">
  <div class="hero-badge">🦀 Powered by Rust · Tailwind CSS v4</div>
  <h1>
    styled-components DX<br>
    <span class="rust">Tailwind performance</span><br>
    <span class="dim">zero runtime overhead</span>
  </h1>
  <p class="hero-sub">
    Tulis komponen React dengan API seperti styled-components —
    tapi CSS di-generate di build time oleh Rust, bukan di-inject ke DOM saat runtime.
  </p>
  <div class="badge-row">
    <img src="https://img.shields.io/npm/v/tailwind-styled-v4?color=e8612a&label=npm&style=flat-square" alt="npm">
    <img src="https://img.shields.io/badge/Rust-1.75+-orange?style=flat-square&logo=rust" alt="Rust">
    <img src="https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js" alt="Node">
    <img src="https://img.shields.io/badge/runtime-~4.5kb-brightgreen?style=flat-square" alt="bundle">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license">
  </div>
  <div class="hero-actions">
    <a href="#examples" class="btn-primary">Lihat Contoh →</a>
    <a href="#" class="btn-secondary">$ npm install tailwind-styled-v4</a>
  </div>
  <div class="stats">
    <div class="stat">
      <div class="stat-val">425×</div>
      <div class="stat-label">Faster scan</div>
    </div>
    <div class="stat">
      <div class="stat-val">~0</div>
      <div class="stat-label">Runtime overhead</div>
    </div>
    <div class="stat">
      <div class="stat-val">100%</div>
      <div class="stat-label">TypeScript</div>
    </div>
    <div class="stat">
      <div class="stat-val">4.5kb</div>
      <div class="stat-label">Bundle size</div>
    </div>
  </div>
</div>

<hr class="divider">

<!-- COMPARISON -->
<section>
  <div class="section-label">Perbandingan</div>
  <h2>Kenapa bukan styled-components?</h2>
  <p class="section-desc">
    styled-components inject CSS ke DOM saat runtime — artinya browser harus generate class name, parse CSS, dan inject <code>&lt;style&gt;</code> tag setiap render.
  </p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Fitur</th>
          <th>tailwind-styled-v4</th>
          <th>styled-components</th>
          <th>Tailwind CSS biasa</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Build-time CSS</td>
          <td><span class="check">✓</span> via Rust compiler</td>
          <td><span class="cross">✗</span> runtime inject</td>
          <td><span class="check">✓</span></td>
        </tr>
        <tr>
          <td>Runtime overhead</td>
          <td><span class="check">✓</span> ~0</td>
          <td><span class="cross">✗</span> ~15KB</td>
          <td><span class="check">✓</span> ~0</td>
        </tr>
        <tr>
          <td>Variants API</td>
          <td><span class="check">✓</span> type-safe</td>
          <td><span class="warn">⚠</span> terbatas</td>
          <td><span class="cross">✗</span></td>
        </tr>
        <tr>
          <td>SSR/RSC support</td>
          <td><span class="check">✓</span> zero config</td>
          <td><span class="warn">⚠</span> butuh ServerStyleSheet</td>
          <td><span class="check">✓</span> manual</td>
        </tr>
        <tr>
          <td>Hydration mismatch</td>
          <td><span class="check">✓</span> tidak ada</td>
          <td><span class="warn">⚠</span> hash bisa berbeda</td>
          <td><span class="check">✓</span> tidak ada</td>
        </tr>
        <tr>
          <td>DevTools readable</td>
          <td><span class="check">✓</span> class name jelas</td>
          <td><span class="cross">✗</span> <code>sc-abc123</code></td>
          <td><span class="check">✓</span></td>
        </tr>
        <tr>
          <td>Dark mode</td>
          <td><span class="check">✓</span> <code>dark:</code> prefix</td>
          <td><span class="warn">⚠</span> manual</td>
          <td><span class="check">✓</span></td>
        </tr>
        <tr>
          <td>Engine</td>
          <td>🦀 Rust</td>
          <td>JS</td>
          <td>JS</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<hr class="divider">

<!-- FEATURES -->
<section id="features">
  <div class="section-label">Features</div>
  <h2>Semua yang kamu butuhkan</h2>
  <p class="section-desc">Dibangun untuk React modern — App Router, RSC, TypeScript, dark mode, semua sudah built-in.</p>
  <div class="feature-grid">
    <div class="feature-card">
      <div class="feature-icon">🦀</div>
      <div class="feature-title">Rust Scanner Engine</div>
      <div class="feature-desc">Class scanner berbasis Rust via NAPI-RS — 425× lebih cepat dari scanner JS. Cache persistent antara dev server restart.</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🎨</div>
      <div class="feature-title">Variants API</div>
      <div class="feature-desc">Object config dengan <code>variants</code>, <code>defaultVariants</code>, <code>compoundVariants</code>, dan <code>states</code> — semua fully typed di TypeScript.</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🧩</div>
      <div class="feature-title">Sub-components</div>
      <div class="feature-desc">Definisikan <code>header</code>, <code>main</code>, <code>footer</code> langsung di config. Akses via <code>Card.header</code> — TypeScript infer nama otomatis.</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">⚡</div>
      <div class="feature-title">Real CSS Pipeline</div>
      <div class="feature-desc">Tailwind JS + LightningCSS generate real CSS dari class list — custom <code>@theme</code> ikut di-compile, bukan empty rules.</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🌙</div>
      <div class="feature-title">Dark Mode</div>
      <div class="feature-desc">Pakai prefix <code>dark:</code> langsung — support <code>prefers-color-scheme</code> dan custom theme via CSS variables.</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🚀</div>
      <div class="feature-title">Next.js App Router</div>
      <div class="feature-desc">Bekerja dengan RSC, Turbopack, dan App Router tanpa konfigurasi tambahan. Auto-detect CSS entry, inject plugin otomatis.</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🔧</div>
      <div class="feature-title">CLI Setup</div>
      <div class="feature-desc"><code>npx tw setup</code> — detect bundler, patch config, create <code>tailwind-styled.config.json</code>, dan pre-warm scanner cache.</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">📦</div>
      <div class="feature-title">Multi-bundler</div>
      <div class="feature-desc">Support Next.js, Vite, dan Rspack — adapter terpisah untuk setiap bundler dengan optimasi spesifik.</div>
    </div>
    <div class="feature-card">
      <div class="feature-icon">🎯</div>
      <div class="feature-title">Zero Hydration Mismatch</div>
      <div class="feature-desc">SSR dan CSR generate className yang identik — props override defaultVariants dengan benar di kedua environment.</div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- EXAMPLES -->
<section id="examples">
  <div class="section-label">Examples</div>
  <h2>Mulai dalam 2 menit</h2>
  <p class="section-desc">Dari template literal sederhana sampai component system yang kompleks.</p>

  <div style="margin-bottom: 2rem;">
    <div class="code-wrap">
      <div class="code-header">
        <div class="code-dots"><span class="r"></span><span class="y"></span><span class="g"></span></div>
        <div class="code-fname">button.tsx</div>
        <div class="code-lang">tsx</div>
      </div>
      <pre><code><span class="k">import</span> <span class="p">{ </span><span class="w">tw</span><span class="p"> }</span> <span class="k">from</span> <span class="s">"tailwind-styled-v4"</span>

<span class="k">export const</span> <span class="f">Button</span> <span class="p">= </span><span class="w">tw</span><span class="p">.</span><span class="w">button</span><span class="p">({</span>
  <span class="w">base</span><span class="p">: </span><span class="s">`
    inline-flex items-center justify-center gap-2
    font-medium transition-all rounded-full
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
    active:scale-95
  `</span><span class="p">,</span>
  <span class="w">variants</span><span class="p">: {</span>
    <span class="w">intent</span><span class="p">: {</span>
      <span class="w">primary</span><span class="p">:   </span><span class="s">"bg-foreground text-background hover:bg-[#383838]"</span><span class="p">,</span>
      <span class="w">secondary</span><span class="p">: </span><span class="s">"bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"</span><span class="p">,</span>
      <span class="w">outline</span><span class="p">:   </span><span class="s">"bg-transparent border-2 border-foreground text-foreground"</span><span class="p">,</span>
      <span class="w">ghost</span><span class="p">:     </span><span class="s">"bg-transparent text-foreground hover:bg-gray-100"</span><span class="p">,</span>
    <span class="p">},</span>
    <span class="w">size</span><span class="p">: {</span>
      <span class="w">sm</span><span class="p">: </span><span class="s">"h-10 px-4 text-sm rounded-lg"</span><span class="p">,</span>
      <span class="w">md</span><span class="p">: </span><span class="s">"h-12 px-5 text-base"</span><span class="p">,</span>
      <span class="w">lg</span><span class="p">: </span><span class="s">"h-14 px-6 text-lg"</span><span class="p">,</span>
    <span class="p">},</span>
  <span class="p">},</span>
  <span class="w">defaultVariants</span><span class="p">: { </span><span class="w">intent</span><span class="p">: </span><span class="s">"primary"</span><span class="p">, </span><span class="w">size</span><span class="p">: </span><span class="s">"md"</span><span class="p"> },</span>
  <span class="w">states</span><span class="p">: {</span>
    <span class="w">loading</span><span class="p">:   </span><span class="s">"opacity-60 cursor-wait pointer-events-none"</span><span class="p">,</span>
    <span class="w">fullWidth</span><span class="p">: </span><span class="s">"w-full"</span><span class="p">,</span>
  <span class="p">},</span>
<span class="p">})</span>

<span class="c">// Penggunaan — TypeScript autocomplete ✅</span>
<span class="p">&lt;</span><span class="t">Button</span><span class="p">&gt;</span>Default<span class="p">&lt;/</span><span class="t">Button</span><span class="p">&gt;</span>
<span class="p">&lt;</span><span class="t">Button</span> <span class="f">intent</span><span class="p">=</span><span class="s">"ghost"</span><span class="p">&gt;</span>Batal<span class="p">&lt;/</span><span class="t">Button</span><span class="p">&gt;</span>
<span class="p">&lt;</span><span class="t">Button</span> <span class="f">intent</span><span class="p">=</span><span class="s">"outline"</span> <span class="f">size</span><span class="p">=</span><span class="s">"sm"</span><span class="p">&gt;</span>Edit<span class="p">&lt;/</span><span class="t">Button</span><span class="p">&gt;</span>
<span class="p">&lt;</span><span class="t">Button</span> <span class="f">loading</span> <span class="f">fullWidth</span><span class="p">&gt;</span>Memproses...<span class="p">&lt;/</span><span class="t">Button</span><span class="p">&gt;</span>
<span class="p">&lt;</span><span class="t">Button</span> <span class="f">intent</span><span class="p">=</span><span class="s">"invalid"</span><span class="p"> /&gt;</span> <span class="c">// ❌ TypeScript error</span></code></pre>
    </div>
  </div>

  <div class="two-col">
    <div class="code-wrap">
      <div class="code-header">
        <div class="code-dots"><span class="r"></span><span class="y"></span><span class="g"></span></div>
        <div class="code-fname">card.tsx</div>
        <div class="code-lang">tsx</div>
      </div>
      <pre><code><span class="k">const</span> <span class="f">Card</span> <span class="p">= </span><span class="w">tw</span><span class="p">.</span><span class="w">div</span><span class="p">({</span>
  <span class="w">base</span><span class="p">: </span><span class="s">"rounded-xl bg-white shadow-md overflow-hidden"</span><span class="p">,</span>
  <span class="w">sub</span><span class="p">: {</span>
    <span class="w">header</span><span class="p">:       </span><span class="s">"px-6 py-4 border-b font-semibold"</span><span class="p">,</span>
    <span class="w">main</span><span class="p">:         </span><span class="s">"px-6 py-4"</span><span class="p">,</span>
    <span class="w">footer</span><span class="p">:       </span><span class="s">"px-6 py-4 border-t text-xs text-gray-400"</span><span class="p">,</span>
    <span class="s">"div:action"</span><span class="p">: </span><span class="s">"px-6 py-4 flex gap-3"</span><span class="p">,</span> <span class="c">// → Card.action</span>
  <span class="p">},</span>
  <span class="w">states</span><span class="p">: {</span>
    <span class="w">selected</span><span class="p">: </span><span class="s">"ring-2 ring-blue-500"</span><span class="p">,</span>
    <span class="w">disabled</span><span class="p">: </span><span class="s">"opacity-50 pointer-events-none"</span><span class="p">,</span>
  <span class="p">},</span>
<span class="p">})</span>

<span class="c">// Sub-components typed otomatis</span>
<span class="p">&lt;</span><span class="t">Card</span> <span class="f">selected</span><span class="p">&gt;</span>
  <span class="p">&lt;</span><span class="t">Card</span><span class="p">.</span><span class="t">header</span><span class="p">&gt;</span>Judul<span class="p">&lt;/</span><span class="t">Card</span><span class="p">.</span><span class="t">header</span><span class="p">&gt;</span>
  <span class="p">&lt;</span><span class="t">Card</span><span class="p">.</span><span class="t">main</span><span class="p">&gt;</span>Konten<span class="p">&lt;/</span><span class="t">Card</span><span class="p">.</span><span class="t">main</span><span class="p">&gt;</span>
  <span class="p">&lt;</span><span class="t">Card</span><span class="p">.</span><span class="t">action</span><span class="p">&gt;</span>
    <span class="p">&lt;</span><span class="t">Button</span><span class="p">&gt;</span>OK<span class="p">&lt;/</span><span class="t">Button</span><span class="p">&gt;</span>
  <span class="p">&lt;/</span><span class="t">Card</span><span class="p">.</span><span class="t">action</span><span class="p">&gt;</span>
  <span class="p">&lt;</span><span class="t">Card</span><span class="p">.</span><span class="t">footer</span><span class="p">&gt;</span>Updated 2 hours ago<span class="p">&lt;/</span><span class="t">Card</span><span class="p">.</span><span class="t">footer</span><span class="p">&gt;</span>
<span class="p">&lt;/</span><span class="t">Card</span><span class="p">&gt;</span></code></pre>
    </div>

    <div class="code-wrap">
      <div class="code-header">
        <div class="code-dots"><span class="r"></span><span class="y"></span><span class="g"></span></div>
        <div class="code-fname">next.config.ts</div>
        <div class="code-lang">ts</div>
      </div>
      <pre><code><span class="k">import</span> <span class="p">{ </span><span class="w">withTailwindStyled</span><span class="p"> }</span>
  <span class="k">from</span> <span class="s">"tailwind-styled-v4/next"</span>
<span class="k">import type</span> <span class="p">{ </span><span class="t">NextConfig</span><span class="p"> }</span> <span class="k">from</span> <span class="s">"next"</span>

<span class="k">const</span> <span class="w">nextConfig</span><span class="p">: </span><span class="t">NextConfig</span><span class="p"> = {}</span>

<span class="k">export default</span> <span class="f">withTailwindStyled</span><span class="p">()(</span><span class="w">nextConfig</span><span class="p">)</span></code></pre>

      <div style="margin-top: 1px;">
      <div class="code-header" style="border-top: 1px solid var(--border);">
        <div class="code-dots"><span class="r"></span><span class="y"></span><span class="g"></span></div>
        <div class="code-fname">globals.css</div>
        <div class="code-lang">css</div>
      </div>
      <pre><code><span class="k">@import</span> <span class="s">"tailwindcss"</span><span class="p">;</span>
<span class="k">@source</span> <span class="s">"../.next/tw-classes/**"</span><span class="p">;</span>

<span class="p">:root {</span>
  <span class="w">--background</span><span class="p">: </span><span class="n">#ffffff</span><span class="p">;</span>
  <span class="w">--foreground</span><span class="p">: </span><span class="n">#171717</span><span class="p">;</span>
<span class="p">}</span>

<span class="k">@theme inline</span> <span class="p">{</span>
  <span class="w">--color-background</span><span class="p">: </span><span class="f">var</span><span class="p">(--background);</span>
  <span class="w">--color-foreground</span><span class="p">: </span><span class="f">var</span><span class="p">(--foreground);</span>
<span class="p">}</span></code></pre>
      </div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- HOW IT WORKS -->
<section id="how-it-works">
  <div class="section-label">How it works</div>
  <h2>CSS pipeline baru di v5</h2>
  <p class="section-desc">Tidak lagi pakai empty rules — Tailwind JS + LightningCSS generate real CSS dari class list yang di-extract oleh Rust scanner.</p>
  <div class="pipeline">
    <div class="pipeline-step">
      <div class="pipeline-num">1</div>
      <div class="pipeline-content">
        <div class="pipeline-title">Rust scanner extract classes <span class="pipeline-tag">ast_extract.rs</span></div>
        <div class="pipeline-desc">Saat <code>npm run dev</code> start, Rust scan semua file <code>.tsx/.ts</code> di <code>src/</code> — extract semua class dari <code>base</code>, <code>variants</code>, <code>states</code>, <code>sub</code> menggunakan regex pipeline yang bracket-aware.</div>
      </div>
    </div>
    <div class="pipeline-step">
      <div class="pipeline-num">2</div>
      <div class="pipeline-content">
        <div class="pipeline-title">Tailwind JS compile dengan user theme <span class="pipeline-tag">tailwindEngine.ts</span></div>
        <div class="pipeline-desc"><code>tw.compile(globals.css, { loadStylesheet })</code> — baca <code>@theme inline</code> dari file CSS user, generate real CSS untuk semua class yang ditemukan termasuk custom colors seperti <code>text-foreground</code>.</div>
      </div>
    </div>
    <div class="pipeline-step">
      <div class="pipeline-num">3</div>
      <div class="pipeline-content">
        <div class="pipeline-title">LightningCSS post-process <span class="pipeline-tag">Rust</span></div>
        <div class="pipeline-desc">Di production, LightningCSS minify output — vendor prefix otomatis, dead code elimination. Di dev mode, output readable tanpa minify untuk kemudahan debugging.</div>
      </div>
    </div>
    <div class="pipeline-step">
      <div class="pipeline-num">4</div>
      <div class="pipeline-content">
        <div class="pipeline-title">Output ke <code>_initial-scan.css</code></div>
        <div class="pipeline-desc">File berisi hanya <code>@layer utilities</code> — base styles tidak duplikat dengan <code>globals.css</code>. Tailwind scan via <code>@source</code> dan include di bundle final browser.</div>
      </div>
    </div>
    <div class="pipeline-step">
      <div class="pipeline-num">5</div>
      <div class="pipeline-content">
        <div class="pipeline-title">Persistent cache <span class="pipeline-tag">cache_store.rs</span></div>
        <div class="pipeline-desc">Cache di <code>.cache/tailwind-styled/scanner-cache.json</code> — survive antara dev server restart. Run kedua: semua file cache HIT, startup <code>&lt;200ms</code>.</div>
      </div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- BENCHMARK -->
<section id="benchmark">
  <div class="section-label">Benchmark</div>
  <h2>Rust makes it fast</h2>
  <p class="section-desc">Diukur di Node.js 22, Rust 1.75 — dibandingkan dengan implementasi JavaScript.</p>
  <div class="bench-list">
    <div class="bench-item">
      <div class="bench-label">Scan 1000 files</div>
      <div class="bench-bar-wrap"><div class="bench-bar" style="width:100%"></div></div>
      <div class="bench-val">0.8 ms</div>
      <div class="bench-speedup">425× faster</div>
    </div>
    <div class="bench-item">
      <div class="bench-label">Compile 500 classes</div>
      <div class="bench-bar-wrap"><div class="bench-bar" style="width:85%"></div></div>
      <div class="bench-val">0.02 ms</div>
      <div class="bench-speedup">60× faster</div>
    </div>
    <div class="bench-item">
      <div class="bench-label">Parse class string</div>
      <div class="bench-bar-wrap"><div class="bench-bar" style="width:75%"></div></div>
      <div class="bench-val">0.010 ms</div>
      <div class="bench-speedup">80× faster</div>
    </div>
    <div class="bench-item">
      <div class="bench-label">Cache read/write</div>
      <div class="bench-bar-wrap"><div class="bench-bar" style="width:65%"></div></div>
      <div class="bench-val">0.009 ms</div>
      <div class="bench-speedup">55× faster</div>
    </div>
    <div class="bench-item">
      <div class="bench-label">Watch mode rebuild</div>
      <div class="bench-bar-wrap"><div class="bench-bar" style="width:45%"></div></div>
      <div class="bench-val">&lt; 5 ms</div>
      <div class="bench-speedup">17× faster</div>
    </div>
  </div>
</section>

<hr class="divider">

<!-- INSTALL -->
<section>
  <div class="install-box">
    <div>
      <div class="install-cmd">
        <span class="install-prompt">$</span>
        npm install tailwind-styled-v4
      </div>
      <div style="margin-top: 0.75rem;">
        <div class="install-cmd" style="font-size: 0.9rem; color: var(--text2);">
          <span class="install-prompt">$</span>
          npx tw setup
        </div>
      </div>
    </div>
    <div class="install-desc">
      <strong style="color: var(--text);">Setup selesai dalam 30 detik.</strong><br>
      Auto-detect bundler, inject plugin, dan pre-warm cache — tidak ada konfigurasi manual.
    </div>
    <a href="https://github.com/Dictionar32/tailwind-styled-v4" class="btn-primary">
      GitHub →
    </a>
  </div>
</section>

<footer>
  <div style="margin-bottom: 1rem;">
    <a href="https://npmjs.com/package/tailwind-styled-v4">npm</a> ·
    <a href="https://github.com/Dictionar32/tailwind-styled-v4">GitHub</a> ·
    <a href="https://github.com/Dictionar32/tailwind-styled-v4/blob/main/LICENSE">MIT License</a>
  </div>
  <div>© Dictionar32 · Built with 🦀 Rust + ⚡ Tailwind CSS v4</div>
</footer>

</body>
</html>