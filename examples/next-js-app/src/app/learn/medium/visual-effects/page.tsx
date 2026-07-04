/**
 * CSS Medium — Visual Effects
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, FilterBox, BlendBox, ClipBox,
} from "./styles"

const TOC = [
  { id: "filter", label: "filter" },
  { id: "backdrop-filter", label: "backdrop-filter" },
  { id: "mix-blend", label: "mix-blend-mode" },
  { id: "bg-blend", label: "background-blend-mode" },
  { id: "clip-path", label: "clip-path" },
  { id: "mask", label: "mask" },
  { id: "shape-outside", label: "shape-outside" },
  { id: "object-fit", label: "object-fit & object-position" },
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

type FilterMode = "none" | "blur" | "brightness" | "contrast" | "saturate" | "huerotate" | "invert" | "sepia" | "dropshadow" | "grayscale"

function FilterPlayground() {
  const [filterMode, setFilterMode] = useState<FilterMode>("none")
  const filters: FilterMode[] = ["none", "blur", "brightness", "contrast", "saturate", "huerotate", "invert", "sepia", "dropshadow", "grayscale"]

  const filterCSS: Record<FilterMode, string> = {
    none: "filter: none",
    blur: "filter: blur(4px)",
    brightness: "filter: brightness(1.5)",
    contrast: "filter: contrast(2)",
    saturate: "filter: saturate(2)",
    huerotate: "filter: hue-rotate(90deg)",
    invert: "filter: invert(1)",
    sepia: "filter: sepia(1)",
    dropshadow: "filter: drop-shadow(4px 4px 8px rgba(99,102,241,0.6))",
    grayscale: "filter: grayscale(1)",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎨 Filter Playground</PlaygroundWrap.label>
        <ChipRow>
          {filters.map(f => <Chip key={f} active={filterMode === f} onClick={() => setFilterMode(f)}>{f}</Chip>)}
        </ChipRow>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <FilterBox filter={filterMode}>
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            CSS
          </div>
        </FilterBox>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>{filterCSS[filterMode]}</PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function VisualEffectsPage() {
  const [activeSection, setActiveSection] = useState("filter")
  const [clipShape, setClipShape] = useState<"circle" | "polygon" | "inset" | "ellipse">("circle")

  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/medium">Medium</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>Visual Effects</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>CSS Visual Effects</PageTitle>
          <PageDesc>filter, backdrop-filter, mix-blend-mode, clip-path, mask, shape-outside — semua tools untuk efek visual non-destructive di CSS modern.</PageDesc>

          <Section id="filter" onClick={() => setActiveSection("filter")}>
            <H2>filter<H2.anchor href="#filter">#</H2.anchor></H2>
            <P><IC>filter</IC> mengaplikasikan efek grafis pada elemen dan semua kontennya — blur, brightness, contrast, dan banyak lagi.</P>
            <FilterPlayground />
            <Code file="filter.css">{`
/* Semua filter functions */
.blur      { filter: blur(4px); }              /* gaussian blur */
.bright    { filter: brightness(1.5); }        /* 1 = normal, >1 = lebih terang */
.contrast  { filter: contrast(2); }            /* 1 = normal */
.saturate  { filter: saturate(2); }            /* 0 = grayscale, >1 = vivid */
.hue       { filter: hue-rotate(90deg); }      /* geser hue roda warna */
.invert    { filter: invert(1); }              /* 0–1 */
.sepia     { filter: sepia(1); }               /* 0 = normal, 1 = full sepia */
.opacity   { filter: opacity(0.5); }           /* sama seperti opacity property */
.gray      { filter: grayscale(1); }           /* 0 = normal, 1 = bw */
.shadow    { filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.3)); }

/* Kombinasi — pisahkan dengan spasi */
.photo-effect {
  filter: contrast(1.2) saturate(1.3) brightness(1.1);
}

/* drop-shadow vs box-shadow */
/* box-shadow: shadow mengikuti bounding box */
/* drop-shadow: shadow mengikuti bentuk aktual (termasuk transparent) */
.png-with-shadow {
  filter: drop-shadow(4px 4px 12px rgba(99,102,241,0.5));
  /* shadow mengikuti kontur gambar PNG, bukan kotak */
}

/* Hover effect */
.img-card img {
  filter: saturate(0.8) brightness(0.9);
  transition: filter 300ms ease;
}
.img-card:hover img {
  filter: saturate(1.2) brightness(1.05);
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="backdrop-filter" onClick={() => setActiveSection("backdrop-filter")}>
            <H2>backdrop-filter<H2.anchor href="#backdrop-filter">#</H2.anchor></H2>
            <P>Seperti <IC>filter</IC> tapi diterapkan ke area di belakang elemen — bukan kontennya. Dipakai untuk glassmorphism, frosted glass, dll.</P>
            <Code file="backdrop-filter.css">{`
/* Frosted glass / glassmorphism */
.glass {
  background: rgba(255, 255, 255, 0.15);   /* semi-transparent */
  backdrop-filter: blur(12px);              /* blur background */
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
}

/* navbar blur */
.navbar {
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  backdrop-filter: blur(16px) saturate(1.5);
}

/* Semua filter functions tersedia di backdrop-filter */
.effect {
  backdrop-filter:
    blur(8px)
    brightness(0.9)
    saturate(1.2)
    contrast(1.1);
}

/* PENTING: elemen parent TIDAK boleh hidden overflow di Firefox */
/* backdrop-filter butuh: overflow: visible atau explicit size */

/* @supports untuk fallback */
@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: rgba(255, 255, 255, 0.8);  /* opaque fallback */
  }
}

/* Dark mode glass */
[data-theme="dark"] .glass {
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="mix-blend" onClick={() => setActiveSection("mix-blend")}>
            <H2>mix-blend-mode<H2.anchor href="#mix-blend">#</H2.anchor></H2>
            <P>Mendefinisikan bagaimana konten elemen di-blend dengan elemen di belakangnya — seperti blending modes di Photoshop.</P>
            <div className="grid grid-cols-4 gap-2 my-4">
              {(["normal", "multiply", "screen", "overlay", "darken", "lighten", "difference", "exclusion"] as const).map(mode => (
                <div key={mode} className="relative h-12 rounded-lg overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-red-500" />
                  <BlendBox blend={mode} className="absolute inset-0 bg-blue-500 opacity-70">
                    <span className="text-[9px] text-white font-mono px-0.5">{mode}</span>
                  </BlendBox>
                </div>
              ))}
            </div>
            <Code file="mix-blend-mode.css">{`
/* Blending modes — seperti layer modes di Photoshop */
.text-over-image {
  mix-blend-mode: overlay;    /* teks blend dengan gambar di bawah */
  color: white;
}

/* Semua nilai tersedia */
.multiply    { mix-blend-mode: multiply; }     /* gelap, seperti cetak */
.screen      { mix-blend-mode: screen; }       /* terang, seperti proyektor */
.overlay     { mix-blend-mode: overlay; }      /* multiply + screen */
.darken      { mix-blend-mode: darken; }       /* ambil piksel lebih gelap */
.lighten     { mix-blend-mode: lighten; }      /* ambil piksel lebih terang */
.color-dodge { mix-blend-mode: color-dodge; }  /* dodge seperti foto */
.color-burn  { mix-blend-mode: color-burn; }   /* burn seperti foto */
.hard-light  { mix-blend-mode: hard-light; }
.soft-light  { mix-blend-mode: soft-light; }
.difference  { mix-blend-mode: difference; }   /* invert di area putih */
.exclusion   { mix-blend-mode: exclusion; }    /* seperti difference tapi softer */
.hue         { mix-blend-mode: hue; }
.saturation  { mix-blend-mode: saturation; }
.color       { mix-blend-mode: color; }        /* tint gambar dengan warna */
.luminosity  { mix-blend-mode: luminosity; }

/* Contoh efek teks duotone */
.duotone-text {
  color: white;
  mix-blend-mode: color;  /* teks mengambil warna dari background */
}

/* isolation: isolate — buat stacking context baru */
/* Prevents blending dengan elemen di luar container */
.blend-container { isolation: isolate; }
        `}</Code>
          </Section>
          <Divider />

          <Section id="bg-blend" onClick={() => setActiveSection("bg-blend")}>
            <H2>background-blend-mode<H2.anchor href="#bg-blend">#</H2.anchor></H2>
            <Code file="bg-blend-mode.css">{`
/* blend multiple backgrounds dengan satu sama lain */
.duotone {
  background-image: url("photo.jpg");
  background-color: #6366f1;
  background-blend-mode: multiply;   /* warna × foto */
}

/* Overlay gradient di atas foto */
.overlay-gradient {
  background-image:
    linear-gradient(135deg, rgba(99,102,241,0.7), rgba(236,72,153,0.7)),
    url("photo.jpg");
  background-blend-mode: multiply, normal;
}

/* Duotone effect — dua warna */
.duotone-effect {
  background-image:
    linear-gradient(#6366f1, #ec4899),
    url("photo.jpg");
  background-blend-mode: luminosity;
  /* Menghasilkan foto dalam palet 2 warna */
}

/* Vintage effect */
.vintage {
  background-image:
    url("photo.jpg"),
    linear-gradient(to right, rgba(255,200,100,0.3), rgba(200,100,50,0.3));
  background-blend-mode: normal, color;
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="clip-path" onClick={() => setActiveSection("clip-path")}>
            <H2>clip-path<H2.anchor href="#clip-path">#</H2.anchor></H2>
            <P><IC>clip-path</IC> memotong tampilan elemen mengikuti bentuk tertentu — area di luar path tidak terlihat.</P>
            <div className="my-4 flex flex-wrap gap-4">
              {([
                { shape: "circle" as const, label: "circle(50%)", clip: "circle(50%)" },
                { shape: "ellipse" as const, label: "ellipse(60% 40%)", clip: "ellipse(60% 40% at 50% 50%)" },
                { shape: "polygon" as const, label: "polygon (star)", clip: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" },
                { shape: "inset" as const, label: "inset(10% round 1rem)", clip: "inset(10% round 1rem)" },
              ]).map(item => (
                <div key={item.label} className="flex flex-col items-center gap-2">
                  <ClipBox style={{ clipPath: item.clip }} />
                  <span className="text-[10px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]">{item.label}</span>
                </div>
              ))}
            </div>
            <Code file="clip-path.css">{`
/* circle(radius at cx cy) */
.avatar    { clip-path: circle(50%); }
.circle-sm { clip-path: circle(40% at center); }

/* ellipse(rx ry at cx cy) */
.oval      { clip-path: ellipse(60% 40% at 50% 50%); }

/* inset(top right bottom left round radius) */
.rounded-clip { clip-path: inset(10% 5% round 20px); }
.card-reveal  { clip-path: inset(0 100% 0 0); }  /* hidden */
.card-full    { clip-path: inset(0 0% 0 0); }     /* revealed */

/* polygon(x1 y1, x2 y2, ...) */
.triangle  { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
.diamond   { clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); }
.hexagon   { clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }
.star      { clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%); }

/* path() — SVG path string */
.custom-shape {
  clip-path: path("M 10 80 Q 52.5 10, 95 80 T 180 80");
}

/* Animatable! */
.reveal {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 500ms ease-out;
}
.reveal.active {
  clip-path: inset(0 0% 0 0);
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="mask" onClick={() => setActiveSection("mask")}>
            <H2>mask<H2.anchor href="#mask">#</H2.anchor></H2>
            <P><IC>mask</IC> seperti clip-path tapi lebih powerful — menggunakan gambar/gradient sebagai alpha channel. Putih = tampil, hitam = tersembunyi, abu-abu = semi-transparan.</P>
            <Code file="mask.css">{`
/* mask-image — gambar atau gradient sebagai mask */
.fade-out {
  mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
}

.vignette {
  mask-image: radial-gradient(ellipse at center, black 60%, transparent 100%);
}

/* mask dengan URL ke SVG atau PNG */
.custom-mask {
  mask-image: url("mask-shape.svg");
  mask-size: cover;
  mask-position: center;
  mask-repeat: no-repeat;
}

/* mask-size, mask-position, mask-repeat — seperti background */
.mask-full {
  mask-size: 100% 100%;
  mask-position: center;
  mask-repeat: no-repeat;
}

/* mask-composite — bagaimana multiple masks digabung */
.multi-mask {
  mask-image:
    linear-gradient(to right, black, transparent),
    url("circle.png");
  mask-composite: intersect;   /* add, subtract, intersect, exclude */
}

/* Circular reveal untuk avatar */
.avatar-reveal {
  mask-image: radial-gradient(circle at center, black 50%, transparent 50%);
  mask-size: 100% 100%;
}

/* Soft edge untuk image */
.soft-image {
  mask-image:
    linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%),
    linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
  mask-composite: intersect;
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="shape-outside" onClick={() => setActiveSection("shape-outside")}>
            <H2>shape-outside<H2.anchor href="#shape-outside">#</H2.anchor></H2>
            <P><IC>shape-outside</IC> membuat teks mengalir mengikuti bentuk elemen float — bukan mengikuti bounding box persegi.</P>
            <Code file="shape-outside.css">{`
/* shape-outside hanya bekerja pada floated elements */
.float-circle {
  float: left;
  width: 150px;
  height: 150px;
  shape-outside: circle(50%);   /* teks wrap mengikuti lingkaran */
  clip-path: circle(50%);       /* tampilan juga lingkaran */
  margin: 0 1rem 1rem 0;
}

/* Ellipse */
.float-ellipse {
  float: right;
  shape-outside: ellipse(40% 50% at 50% 50%);
}

/* Polygon */
.float-chevron {
  float: left;
  width: 100px;
  height: 200px;
  shape-outside: polygon(0 0, 100% 0, 60% 50%, 100% 100%, 0 100%);
}

/* inset — persegi dengan rounded corners */
.float-rounded {
  float: left;
  shape-outside: inset(0 0 0 0 round 50px);
}

/* Gambar dengan alpha channel sebagai shape */
.float-png {
  float: left;
  shape-outside: url("irregular-shape.png");
  shape-image-threshold: 0.5;   /* alpha threshold untuk batas shape */
}

/* shape-margin — tambahkan jarak dari shape */
.with-margin {
  shape-outside: circle(50%);
  shape-margin: 1rem;
}
        `}</Code>
          </Section>
          <Divider />

          {/* ── object-fit & object-position ──────────────────────── */}
          <Section id="object-fit" onClick={() => setActiveSection("object-fit")}>
            <H2>object-fit & object-position<H2.anchor href="#object-fit">#</H2.anchor></H2>
            <P>
              Mengontrol bagaimana konten replaced element (<IC>img</IC>, <IC>video</IC>, <IC>iframe</IC>)
              mengisi container-nya — tanpa merusak aspect ratio atau dengan cropping yang terkontrol.
            </P>
            <div className="grid grid-cols-3 gap-3 my-4">
              {[
                { fit: "fill", label: "fill — stretch (default)", cls: "object-fill" },
                { fit: "contain", label: "contain — letterbox", cls: "object-contain" },
                { fit: "cover", label: "cover — crop tengah", cls: "object-cover" },
                { fit: "none", label: "none — ukuran asli", cls: "object-none" },
                { fit: "scale-down", label: "scale-down — terkecil", cls: "object-scale-down" },
              ].map(item => (
                <div key={item.fit} className="flex flex-col gap-1">
                  <div className="h-20 w-full rounded-lg overflow-hidden border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]">
                    <div className={`w-full h-full bg-gradient-to-br from-indigo-400 to-pink-400 ${item.cls}`}
                      style={{ objectFit: item.fit as React.CSSProperties["objectFit"] }} />
                  </div>
                  <span className="text-[9px] font-mono text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] leading-tight">{item.label}</span>
                </div>
              ))}
            </div>
            <Code file="object-fit.css">{`
/* object-fit — bagaimana konten mengisi container */
img, video {
  object-fit: fill;        /* default — stretch, bisa distorsi */
  object-fit: contain;     /* fit dalam container, letterbox */
  object-fit: cover;       /* isi container, crop kelebihan */
  object-fit: none;        /* ukuran asli, overflow */
  object-fit: scale-down;  /* pilih terkecil antara none dan contain */
}

/* object-position — titik fokus saat crop (object-fit: cover) */
img {
  object-fit: cover;
  object-position: center;         /* default */
  object-position: top;            /* crop bawah */
  object-position: top right;      /* fokus kanan atas */
  object-position: 20% 30%;        /* koordinat custom */
  object-position: left 20px top 10px; /* offset dari edge */
}

/* Pola umum: avatar */
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  object-position: center top;  /* fokus wajah */
}

/* Card hero image */
.hero-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  object-position: center 30%;  /* hindari crop kepala/wajah */
}

/* Responsive 16:9 container dengan object-fit */
.video-thumb {
  aspect-ratio: 16 / 9;
  object-fit: cover;
  width: 100%;
}

/* image-rendering — rendering algorithm untuk upscale/downscale */
.pixel-art  { image-rendering: pixelated; }    /* hard edges, no blur */
.crisp      { image-rendering: crisp-edges; }  /* sharp, browser dependent */
.smooth     { image-rendering: smooth; }       /* default */
.auto       { image-rendering: auto; }
            `}</Code>
            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <IC>object-fit: cover</IC> + <IC>aspect-ratio</IC> adalah kombinasi terbaik
                untuk image gallery yang konsisten. Selalu set juga <IC>width</IC>/<IC>height</IC>
                attribute di HTML untuk mencegah Cumulative Layout Shift (CLS) sebelum gambar loaded.
              </Callout.content>
            </Callout>
          </Section>

          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Visual Effects di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="effects-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Glassmorphism card */
const GlassCard = tw.div({
  base: "rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl",
})

/* Frosted navbar */
const Navbar = tw.nav({
  base: "sticky top-0 z-50 backdrop-blur-md bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
})

/* Image dengan filter via variants */
const Photo = tw.img({
  base: "rounded-xl object-cover transition-filter duration-300",
  variants: {
    mood: {
      normal:   "filter-none",
      grayscale:"grayscale",
      vintage:  "sepia saturate-[0.8] brightness-[0.9]",
      vivid:    "saturate-[1.5] contrast-[1.1]",
    },
  },
  defaultVariants: { mood: "normal" },
})

/* Clip-path shapes */
const CircleAvatar = tw.div({
  base: "w-16 h-16 [clip-path:circle(50%)] overflow-hidden",
})

const DiamondShape = tw.div({
  base: "[clip-path:polygon(50%_0%,100%_50%,50%_100%,0%_50%)] w-24 h-24 bg-indigo-500",
})

/* Drop shadow via filter (better than box-shadow untuk PNG) */
const FloatingIcon = tw.div({
  base: "[filter:drop-shadow(0_8px_16px_rgba(99,102,241,0.4))] transition-[filter] duration-200 hover:[filter:drop-shadow(0_12px_24px_rgba(99,102,241,0.6))]",
})
        `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Glassmorphism UI</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat card glassmorphism dengan <IC>backdrop-filter: blur(16px)</IC>, background semi-transparent, dan border tipis putih semi-transparan. Taruh di atas background gradient yang vivid.</p>
                <p>Tambahkan <IC>@supports not (backdrop-filter: blur(1px))</IC> dengan fallback background yang lebih opaque.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Animated clip-path reveal</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat hero section yang reveal dari kiri ke kanan menggunakan <IC>clip-path: inset(0 100% 0 0)</IC> ke <IC>inset(0 0% 0 0)</IC> dengan transition <IC>ease-out 800ms</IC>.</p>
                <p>Gunakan <IC>IntersectionObserver</IC> di JavaScript untuk trigger saat elemen masuk viewport.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Duotone image effect</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat duotone effect pada gambar menggunakan <IC>background-blend-mode: luminosity</IC> — overlay dua warna gradient di atas gambar foto. Buat juga versi dengan <IC>mix-blend-mode: color</IC>.</p>
                <p>Tambahkan transition yang smooth saat hover mengembalikan warna asli gambar.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/medium/transforms" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Transforms</NavBtn.label></NavBtn>
            <NavBtn href="/learn/medium/css-architecture" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>CSS Architecture</NavBtn.label></NavBtn>
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
