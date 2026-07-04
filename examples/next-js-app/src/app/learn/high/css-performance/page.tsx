/**
 * CSS High — CSS Performance
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow,
  PipelineStep, CostBadge, PropertyRow,
} from "./styles"

const TOC = [
  { id: "pipeline", label: "Rendering Pipeline" },
  { id: "contain", label: "CSS contain" },
  { id: "content-visibility", label: "content-visibility" },
  { id: "render-blocking", label: "Render-blocking CSS" },
  { id: "reflow-repaint", label: "Reflow vs Repaint" },
  { id: "will-change", label: "will-change" },
  { id: "animation-perf", label: "Animation Performance" },
  { id: "layer-promotion", label: "Layer Promotion" },
  { id: "cls", label: "CLS — Layout Shift" },
  { id: "font-loading", label: "Font Loading" },
  { id: "tw-usage", label: "Pakai di tw" },
  { id: "exercise", label: "Latihan" },
]

function Code({ file, children }: { file?: string; children: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <CodeWrap>
      <CodeWrap.header>
        <CodeWrap.filename>{file ?? "css"}</CodeWrap.filename>
        <CopyBtn copied={copied} onClick={() => { navigator.clipboard.writeText(children.trim()); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
          {copied ? "✓ Copied" : "Copy"}
        </CopyBtn>
      </CodeWrap.header>
      <CodeWrap.body>{children.trim()}</CodeWrap.body>
    </CodeWrap>
  )
}

type PipelinePhase = "parse" | "style" | "layout" | "paint" | "composite"

const pipelineInfo: Record<PipelinePhase, { label: string; desc: string; trigger: string }> = {
  parse: { label: "Parse", desc: "Browser mem-parse HTML → DOM, CSS → CSSOM", trigger: "HTML/CSS diterima dari network" },
  style: { label: "Style", desc: "Matching selector ke elemen, hitung computed values", trigger: "DOM/CSSOM berubah" },
  layout: { label: "Layout", desc: "Hitung ukuran & posisi setiap elemen (reflow)", trigger: "width, height, top, margin, padding, dll" },
  paint: { label: "Paint", desc: "Isi pixel di tiap layer: warna, border, shadow", trigger: "color, background, box-shadow, outline" },
  composite: { label: "Composite", desc: "Gabungkan layers di GPU, kirim ke layar", trigger: "transform, opacity (GPU properties)" },
}

function PipelinePlayground() {
  const [active, setActive] = useState<PipelinePhase>("parse")
  const phases: PipelinePhase[] = ["parse", "style", "layout", "paint", "composite"]
  const info = pipelineInfo[active]
  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎛 Rendering Pipeline — klik fase untuk detail</PlaygroundWrap.label>
        <ChipRow>
          {phases.map(p => <Chip key={p} active={active === p} onClick={() => setActive(p)}>{p}</Chip>)}
        </ChipRow>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <div className="flex flex-col gap-2">
          {phases.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <PipelineStep phase={p} onClick={() => setActive(p)} style={{ cursor: "pointer", opacity: active === p ? 1 : 0.5 }}>
                {i + 1}. {pipelineInfo[p].label}
              </PipelineStep>
              {i < phases.length - 1 && <span className="text-xs text-[color-mix(in_srgb,var(--foreground)_30%,transparent)]">→</span>}
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-[var(--surface)] border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
          <p className="text-xs font-semibold mb-1">{info.label}</p>
          <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_65%,transparent)]">{info.desc}</p>
          <p className="text-[10px] mt-1.5 text-[var(--accent)]">Trigger: {info.trigger}</p>
        </div>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>Active phase: {active} → {info.label}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function CssPerformancePage() {
  const [activeSection, setActiveSection] = useState("pipeline")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/high">High</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>CSS Performance</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>CSS Performance</PageTitle>
          <PageDesc>Optimasi rendering: pipeline browser, contain, content-visibility, will-change, layer promotion, CLS, dan font loading — teknik nyata untuk halaman yang cepat.</PageDesc>

          <Section id="pipeline" onClick={() => setActiveSection("pipeline")}>
            <H2>Rendering Pipeline<H2.anchor href="#pipeline">#</H2.anchor></H2>
            <P>Browser memproses halaman melalui pipeline linear: parse → style → layout → paint → composite. Memahami pipeline ini adalah kunci optimasi CSS.</P>
            <PipelinePlayground />
            <Callout type="tip">
              <Callout.icon>⚡</Callout.icon>
              <Callout.content>
                <Callout.title>Fast path</Callout.title>
                Properti yang hanya memengaruhi composite (transform, opacity) adalah yang tercepat — browser skip layout & paint, langsung ke GPU compositing.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="contain" onClick={() => setActiveSection("contain")}>
            <H2>CSS contain<H2.anchor href="#contain">#</H2.anchor></H2>
            <P><IC>contain</IC> memberi tahu browser bahwa perubahan di dalam elemen tidak mempengaruhi luar — memungkinkan optimasi rendering yang agresif.</P>
            <Code file="contain.css">{`
/* Nilai contain */
.widget {
  contain: layout;   /* layout anak tidak mempengaruhi luar */
  contain: paint;    /* tidak ada content yang bisa keluar dari box */
  contain: style;    /* counter/property tidak escape ke luar */
  contain: size;     /* ukuran tidak bergantung pada children */
  contain: strict;   /* = size layout paint style */
  contain: content;  /* = layout paint style (tanpa size) */
}

/* Kapan pakai contain */
/* ✅ Widget independen (feed item, card) */
.feed-item { contain: content; }

/* ✅ Off-screen panels */
.sidebar-panel { contain: strict; }

/* ✅ Heavy komponen dengan banyak animasi internal */
.animation-container { contain: layout paint; }

/* ❌ Jangan pakai contain: size di elemen dengan height auto */
/* ❌ contain: paint membuat overflow hidden — hati-hati dropdown */
`}</Code>
            <H3>contain: layout — contoh nyata</H3>
            <Code file="contain-layout.css">{`
/* Tanpa contain: menambah elemen baru di list bisa trigger reflow seluruh halaman */
/* Dengan contain: layout — reflow dibatasi di dalam .feed-container */
.feed-container { contain: layout; }
.feed-item { padding: 1rem; border-bottom: 1px solid #eee; }

/* Browser bisa mengoptimasi: "tidak perlu re-layout elemen di luar .feed-container" */
`}</Code>
          </Section>
          <Divider />

          <Section id="content-visibility" onClick={() => setActiveSection("content-visibility")}>
            <H2>content-visibility: auto<H2.anchor href="#content-visibility">#</H2.anchor></H2>
            <P><IC>content-visibility: auto</IC> menyuruh browser skip rendering elemen yang off-screen — bisa memberikan speedup 5-7x pada halaman panjang.</P>
            <Code file="content-visibility.css">{`
/* content-visibility: auto — skip rendering kalau off-screen */
.article-section {
  content-visibility: auto;

  /* WAJIB: hint ukuran ke browser agar scrollbar tidak melompat */
  contain-intrinsic-size: 0 600px; /* width height */
  /* atau lebih tepat: */
  contain-intrinsic-size: auto 600px; /* browser ingat ukuran setelah render pertama */
}

/* Nilai lain */
.hidden-panel {
  content-visibility: hidden; /* seperti display:none tapi pertahankan state render */
  /* lebih cepat dari visibility:hidden karena skip rendering */
}

/* Tanpa contain-intrinsic-size — scrollbar akan aneh saat scroll */
/* Browser estimasi 0px untuk konten yang belum di-render */

/* Browser support: Chrome 85+, Firefox 125+, Safari 18+ */
@supports (content-visibility: auto) {
  .long-list-item {
    content-visibility: auto;
    contain-intrinsic-size: auto 80px;
  }
}
`}</Code>
            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Jangan pakai di above-the-fold</Callout.title>
                <IC>content-visibility: auto</IC> hanya optimal untuk konten yang kemungkinan besar off-screen saat load. Pakai di section kedua ke bawah.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="render-blocking" onClick={() => setActiveSection("render-blocking")}>
            <H2>CSS Render-blocking<H2.anchor href="#render-blocking">#</H2.anchor></H2>
            <P>CSS mem-blok rendering sampai semua stylesheet di-download & di-parse. Strategi critical CSS memisahkan CSS penting dari yang tidak.</P>
            <Code file="render-blocking.html">{`
<!-- ❌ Block rendering — semua CSS harus selesai sebelum render -->
<link rel="stylesheet" href="/styles.css">

<!-- ✅ Critical CSS — inline langsung di <head> -->
<style>
  /* Hanya styles untuk above-the-fold */
  body { margin: 0; font-family: system-ui; }
  .hero { padding: 2rem; background: #fff; }
</style>

<!-- ✅ Non-critical CSS — load async dengan media trick -->
<link rel="stylesheet" href="/below-fold.css" media="print" onload="this.media='all'">

<!-- ✅ Preload CSS penting tanpa block rendering -->
<link rel="preload" href="/fonts.css" as="style" onload="this.rel='stylesheet'">

<!-- ✅ media attribute — hanya block kalau kondisi match -->
<link rel="stylesheet" href="/print.css" media="print">
<link rel="stylesheet" href="/mobile.css" media="(max-width: 768px)">
<!-- Mobile CSS tidak blok desktop rendering! -->
`}</Code>
          </Section>
          <Divider />

          <Section id="reflow-repaint" onClick={() => setActiveSection("reflow-repaint")}>
            <H2>Reflow vs Repaint<H2.anchor href="#reflow-repaint">#</H2.anchor></H2>
            <P>Reflow (layout recalculation) jauh lebih mahal dari repaint karena browser harus menghitung ulang posisi semua elemen terdampak.</P>
            <div className="space-y-1 my-4">
              {[
                { prop: "transform", tier: "cheap" as const, note: "GPU only — no reflow/repaint" },
                { prop: "opacity", tier: "cheap" as const, note: "GPU only — no reflow/repaint" },
                { prop: "color, background-color", tier: "medium" as const, note: "Repaint — no reflow" },
                { prop: "box-shadow, outline", tier: "medium" as const, note: "Repaint — no reflow" },
                { prop: "width, height, padding", tier: "expensive" as const, note: "Reflow + repaint" },
                { prop: "top, left, margin", tier: "expensive" as const, note: "Reflow + repaint" },
                { prop: "font-size, line-height", tier: "expensive" as const, note: "Reflow + repaint" },
              ].map(({ prop, tier, note }) => (
                <PropertyRow key={prop} tier={tier}>
                  <span className="font-mono">{prop}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[color-mix(in_srgb,currentColor_70%,transparent)]">{note}</span>
                    <CostBadge cost={tier}>{tier}</CostBadge>
                  </div>
                </PropertyRow>
              ))}
            </div>
            <Code file="layout-thrashing.ts">{`
// ❌ Layout thrashing — baca tulis bergantian memaksa sync reflow
elements.forEach(el => {
  const height = el.offsetHeight       // BACA — paksa reflow
  el.style.height = height + 10 + 'px' // TULIS
  const width = el.offsetWidth         // BACA lagi — reflow lagi!
})

// ✅ Batch reads then writes
const heights = elements.map(el => el.offsetHeight)  // semua baca dulu
elements.forEach((el, i) => { el.style.height = heights[i] + 10 + 'px' })

// ✅ Atau gunakan requestAnimationFrame
requestAnimationFrame(() => {
  const measurements = elements.map(el => el.getBoundingClientRect())
  requestAnimationFrame(() => {
    measurements.forEach((rect, i) => {
      elements[i].style.width = rect.width + 'px'
    })
  })
})
`}</Code>
          </Section>
          <Divider />

          <Section id="will-change" onClick={() => setActiveSection("will-change")}>
            <H2>will-change<H2.anchor href="#will-change">#</H2.anchor></H2>
            <P><IC>will-change</IC> memberi hint ke browser untuk mempromosikan elemen ke layer GPU sebelum animasi dimulai — eliminasi janky frame pertama.</P>
            <Code file="will-change.css">{`
/* ✅ will-change — hint sebelum animasi */
.card {
  transition: transform 0.3s ease;
}
.card:hover {
  will-change: transform; /* ✅ Tambah saat akan dipakai */
  transform: translateY(-4px);
}

/* ✅ Tambah via JS sebelum animasi, hapus setelah selesai */
/* button.addEventListener('mouseenter', () => {
  card.style.willChange = 'transform'
})
button.addEventListener('mouseleave', () => {
  card.style.willChange = 'auto' // hapus setelah selesai
}) */

/* ❌ Jangan pakai di semua elemen */
/* * { will-change: transform; } — sangat buruk! */
/* Tiap layer butuh VRAM — terlalu banyak layer = memory exhaustion */

/* ❌ Jangan biarkan will-change permanen kalau tidak perlu */
.always-animated {
  will-change: transform; /* ✅ ini boleh — elemen memang selalu animasi */
}

/* Nilai valid */
.el {
  will-change: transform;         /* GPU layer untuk transform */
  will-change: opacity;           /* GPU layer untuk opacity */
  will-change: transform, opacity;/* keduanya */
  will-change: scroll-position;   /* scroll acceleration */
  will-change: auto;              /* hapus hint */
}
`}</Code>
          </Section>
          <Divider />

          <Section id="animation-perf" onClick={() => setActiveSection("animation-perf")}>
            <H2>CSS Animation Performance<H2.anchor href="#animation-perf">#</H2.anchor></H2>
            <P>Animasi yang baik hanya menyentuh properti compositor — <IC>transform</IC> dan <IC>opacity</IC>. Animasi yang menyentuh layout properties akan jank.</P>
            <Code file="animation-perf.css">{`
/* ✅ GPU animasi — hanya compositor, 60fps konsisten */
@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}

@keyframes fadeScale {
  from { transform: scale(0.95); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
}

/* ❌ Layout-triggering animasi — jank! */
@keyframes badSlide {
  from { left: -100%; }   /* reflow di setiap frame! */
  to   { left: 0; }
}

@keyframes badFade {
  from { width: 0; }      /* reflow di setiap frame! */
  to   { width: 100%; }
}

/* Trik: animasikan transform BUKAN left/top/width/height */
/* left: 100px  →  translateX(100px)  */
/* top: 50px    →  translateY(50px)   */
/* width grow   →  scaleX()           */

/* ✅ Animasi loading spinner — GPU only */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  animation: spin 1s linear infinite;
  will-change: transform; /* promote ke GPU layer */
}
`}</Code>
          </Section>
          <Divider />

          <Section id="layer-promotion" onClick={() => setActiveSection("layer-promotion")}>
            <H2>Layer Promotion<H2.anchor href="#layer-promotion">#</H2.anchor></H2>
            <Code file="layer-promotion.css">{`
/* Cara promote elemen ke composite layer */

/* 1. translateZ(0) — classic hack */
.promoted { transform: translateZ(0); }

/* 2. will-change: transform */
.promoted2 { will-change: transform; }

/* 3. isolation: isolate — buat stacking context baru */
.stacking-ctx { isolation: isolate; }

/* 4. filter/backdrop-filter */
.glass { backdrop-filter: blur(10px); }

/* Kapan layer promotion berguna: */
/* ✅ Element yang sering animate */
/* ✅ Video / canvas */
/* ✅ Fixed/sticky positioned elements yang scroll */
/* ✅ Element yang sering di-repaint */

/* ❌ Jangan over-promote */
/* Layer = VRAM allocation. Mobile: 256MB VRAM habis = crash */

/* Cek layers di Chrome DevTools: */
/* Rendering panel → Layer borders (warna kuning = promoted layer) */

/* isolation: isolate — kontrol z-index scope tanpa promote ke GPU */
.modal-backdrop {
  isolation: isolate; /* buat stacking context, tidak perlu z-index tinggi */
  z-index: 1; /* cukup 1 karena konteks baru */
}
`}</Code>
          </Section>
          <Divider />

          <Section id="cls" onClick={() => setActiveSection("cls")}>
            <H2>CLS — Cumulative Layout Shift<H2.anchor href="#cls">#</H2.anchor></H2>
            <P>CLS mengukur berapa banyak konten berpindah secara tidak terduga. Target: CLS &lt; 0.1. Penyebab utama: gambar tanpa dimensi, iklan, font swap.</P>
            <Code file="cls-prevention.css">{`
/* ✅ Selalu set aspect-ratio atau dimensi pada gambar */
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9; /* reserve space sebelum gambar load */
}

/* ✅ Explicit width/height di HTML (browser bisa hitung aspect-ratio) */
/* <img width="800" height="450" src="..."> */

/* ✅ Skeleton placeholder — ukuran sama dengan konten akhir */
.card-skeleton {
  width: 100%;
  height: 200px; /* sama dengan card final */
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ✅ Ads/embeds — reserve space */
.ad-slot {
  min-height: 250px; /* standard banner height */
  container-type: inline-size;
}

/* ✅ Avoid inserting content above existing content */
/* ❌ Jangan munculkan banner/notification di atas konten yang sudah ada */
`}</Code>
          </Section>
          <Divider />

          <Section id="font-loading" onClick={() => setActiveSection("font-loading")}>
            <H2>Font Loading & FOUT/FOIT<H2.anchor href="#font-loading">#</H2.anchor></H2>
            <P><strong>FOUT</strong> (Flash of Unstyled Text) = teks muncul dengan fallback font dulu. <strong>FOIT</strong> (Flash of Invisible Text) = teks tidak terlihat sampai font load.</P>
            <Code file="font-display.css">{`
/* font-display — kontrol perilaku font loading */
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2");

  font-display: auto;     /* default browser (biasanya block) */
  font-display: block;    /* FOIT: invisible sampai load (max 3s) */
  font-display: swap;     /* FOUT: fallback dulu, swap kalau font siap */
  font-display: fallback; /* FOIT singkat (100ms), lalu fallback, tidak swap kalau lambat */
  font-display: optional; /* FOIT singkat, pakai jika sudah cache — skip kalau lambat */
}

/* ✅ Rekomendasi untuk teks body: font-display: swap */
/* ✅ Rekomendasi untuk icon font: font-display: block */
/* ✅ Rekomendasi untuk non-critical: font-display: optional */

/* ✅ Preload critical font */
/* <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin> */

/* ✅ size-adjust — kurangi CLS dari FOUT dengan mencocokkan fallback */
@font-face {
  font-family: "Inter-fallback";
  src: local("Arial");
  size-adjust: 107%;     /* sesuaikan agar mendekati Inter */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: "Inter", "Inter-fallback", sans-serif;
}
`}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>CSS Performance di tw<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="perf-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

// Animasi GPU-only — hanya transform/opacity
const FadeIn = tw.div({
  base: "animate-[fadeIn_0.3s_ease]",
})
// CSS: @keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }

// Skeleton loader tanpa layout shift
const Skeleton = tw.div({
  base: "rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] animate-pulse",
  variants: {
    size: {
      sm: "h-4",
      md: "h-6",
      lg: "h-10",
    },
  },
  defaultVariants: { size: "md" },
})

// Contain untuk komponen independen
const FeedCard = tw.article({
  base: "[contain:content] rounded-xl border p-4",
  // contain:content mencegah reflow propagasi ke parent
})

// Aspect ratio untuk gambar — cegah CLS
const Thumbnail = tw.img({
  base: "w-full [aspect-ratio:16/9] object-cover rounded-lg",
})
`}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — GPU-safe animation</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat card yang slide masuk dari kiri menggunakan hanya <IC>transform</IC> dan <IC>opacity</IC>. Bandingkan dengan versi yang menggunakan <IC>left</IC> — ukur FPS di DevTools.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — content-visibility pada daftar panjang</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat list 1000 item, terapkan <IC>content-visibility: auto</IC> dengan <IC>contain-intrinsic-size</IC> yang sesuai. Bandingkan render time di DevTools Performance tab.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — CLS prevention</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat layout dengan gambar yang load lambat (simulasikan dengan lazy load). Pastikan CLS = 0 menggunakan <IC>aspect-ratio</IC> dan skeleton placeholder yang tepat ukurannya.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/high" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>High Level Overview</NavBtn.label></NavBtn>
            <NavBtn href="/learn/high/houdini" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>CSS Houdini</NavBtn.label></NavBtn>
          </PageNav>
        </Content>
        <Toc>
          <TocLabel>On this page</TocLabel>
          {TOC.map(item => <TocItem key={item.id} href={`#${item.id}`} active={activeSection === item.id} onClick={() => setActiveSection(item.id)}>{item.label}</TocItem>)}
        </Toc>
      </Body>
    </Page>
  )
}
