/**
 * CSS Medium — Transforms
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, TransformBox, SceneWrap,
  PlaygroundDemoContainer, PlaygroundDemoBox, PlaygroundRefBox,
  PlaygroundFlipCard, PlaygroundFlipHint,
} from "./styles"

const TOC = [
  { id: "2d-transforms", label: "2D Transforms" },
  { id: "transform-origin", label: "transform-origin" },
  { id: "3d-transforms", label: "3D Transforms" },
  { id: "perspective", label: "perspective & perspective-origin" },
  { id: "backface", label: "backface-visibility" },
  { id: "preserve-3d", label: "transform-style: preserve-3d" },
  { id: "will-change", label: "will-change" },
  { id: "individual", label: "Individual Transform Properties" },
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

type TransformPreset = "translate" | "rotate" | "scale" | "skew" | "combined"

function TransformPlayground() {
  const [preset, setPreset] = useState<TransformPreset>("translate")
  const presets: TransformPreset[] = ["translate", "rotate", "scale", "skew", "combined"]

  const transformValues: Record<TransformPreset, string> = {
    translate: "translateX(60px) translateY(-20px)",
    rotate: "rotate(45deg)",
    scale: "scale(1.4)",
    skew: "skewX(20deg) skewY(5deg)",
    combined: "translateX(30px) rotate(30deg) scale(1.2)",
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎯 Transform Playground — hover kotak untuk melihat transform</PlaygroundWrap.label>
        <ChipRow>
          {presets.map(p => <Chip key={p} active={preset === p} onClick={() => setPreset(p)}>{p}</Chip>)}
        </ChipRow>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <PlaygroundDemoContainer>
          <PlaygroundDemoBox
            style={{ transform: transformValues[preset] }}
          >
            Box
          </PlaygroundDemoBox>
          <PlaygroundRefBox />
        </PlaygroundDemoContainer>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {`transform: ${transformValues[preset]};`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function TransformsPage() {
  const [activeSection, setActiveSection] = useState("2d-transforms")
  const [flipped, setFlipped] = useState(false)

  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/medium">Medium</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>Transforms</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>CSS Transforms</PageTitle>
          <PageDesc>Translate, rotate, scale, skew — 2D dan 3D transforms, perspective, will-change, sampai CSS Level 5 individual transform properties.</PageDesc>

          <Section id="2d-transforms" onClick={() => setActiveSection("2d-transforms")}>
            <H2>2D Transforms<H2.anchor href="#2d-transforms">#</H2.anchor></H2>
            <TransformPlayground />
            <Code file="2d-transforms.css">{`
/* translate — pindah posisi tanpa mengubah layout */
.move-right  { transform: translateX(50px); }
.move-up     { transform: translateY(-20px); }
.move-both   { transform: translate(50px, -20px); }
.move-percent{ transform: translateX(50%); }   /* % dari lebar elemen sendiri */

/* rotate — putar searah jarum jam */
.rotate-45   { transform: rotate(45deg); }
.rotate-back { transform: rotate(-90deg); }
.rotate-full { transform: rotate(1turn); }    /* 1 putaran penuh */
.rotate-rad  { transform: rotate(1.57rad); }  /* radians */

/* scale — ubah ukuran tanpa mengubah layout */
.scale-up    { transform: scale(1.5); }          /* seragam */
.scale-x     { transform: scaleX(2); }           /* hanya horizontal */
.scale-y     { transform: scaleY(0.5); }         /* hanya vertikal */
.scale-flip  { transform: scaleX(-1); }          /* mirror horizontal */

/* skew — miringkan elemen */
.skew-x      { transform: skewX(15deg); }
.skew-y      { transform: skewY(10deg); }
.skew-both   { transform: skew(10deg, 5deg); }

/* Kombinasi — urutan penting! */
/* Rotasi lalu translate ≠ translate lalu rotasi */
.combined { transform: translateX(50px) rotate(45deg) scale(1.2); }
        `}</Code>
          </Section>
          <Divider />

          <Section id="transform-origin" onClick={() => setActiveSection("transform-origin")}>
            <H2>transform-origin<H2.anchor href="#transform-origin">#</H2.anchor></H2>
            <P>Titik asal transform — dari mana rotasi, scale, dan skew dihitung. Default: <IC>center center</IC> (tengah elemen).</P>
            <Code file="transform-origin.css">{`
/* Keywords */
.center      { transform-origin: center; }          /* default */
.top-left    { transform-origin: top left; }
.bottom      { transform-origin: bottom center; }
.right       { transform-origin: right center; }

/* Nilai pixel / persen */
.custom-px   { transform-origin: 20px 30px; }
.custom-pct  { transform-origin: 25% 75%; }

/* 3D — tambahkan z-axis */
.origin-3d   { transform-origin: 50% 50% -50px; }

/* Efek berbeda dengan origin berbeda */
.rotate-corner {
  transform-origin: top left;
  transform: rotate(45deg);   /* putar dari sudut kiri atas */
}

/* Spin dari tengah bawah (seperti jam) */
.clock-hand {
  transform-origin: center bottom;
  animation: tick 60s steps(60, end) infinite;
}
@keyframes tick {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="3d-transforms" onClick={() => setActiveSection("3d-transforms")}>
            <H2>3D Transforms<H2.anchor href="#3d-transforms">#</H2.anchor></H2>
            <Code file="3d-transforms.css">{`
/* 3D translate */
.translate-z  { transform: translateZ(50px); }    /* mendekat ke viewer */
.translate-3d { transform: translate3d(20px, 10px, 30px); }

/* 3D rotate */
.rotate-x  { transform: rotateX(45deg); }   /* flip vertikal */
.rotate-y  { transform: rotateY(45deg); }   /* flip horizontal */
.rotate-z  { transform: rotateZ(45deg); }   /* sama seperti rotate() */
.rotate-3d { transform: rotate3d(1, 1, 0, 45deg); }  /* sumbu custom */

/* 3D scale */
.scale-z { transform: scaleZ(2); }
.scale-3d { transform: scale3d(1.2, 1.2, 1); }

/* matrix3d — transformasi 3D lengkap dalam satu fungsi (16 nilai) */
/* Biasanya dihasilkan oleh tools/library, tidak ditulis manual */
.matrix { transform: matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 50,0,0,1); }
        `}</Code>
          </Section>
          <Divider />

          <Section id="perspective" onClick={() => setActiveSection("perspective")}>
            <H2>perspective & perspective-origin<H2.anchor href="#perspective">#</H2.anchor></H2>
            <P><IC>perspective</IC> menentukan jarak viewer dari layar — semakin kecil nilainya, semakin dramatis efek 3D-nya. Bisa dipasang di parent atau sebagai fungsi transform.</P>
            <SceneWrap>
              <PlaygroundFlipCard
                style={{
                  perspective: "400px",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
                onClick={() => setFlipped(f => !f)}
              >
                {flipped ? "Back" : "Front"}
              </PlaygroundFlipCard>
              <PlaygroundFlipHint>Klik untuk flip</PlaygroundFlipHint>
            </SceneWrap>
            <Code file="perspective.css">{`
/* perspective di parent — satu titik vanish untuk semua children */
.scene {
  perspective: 800px;          /* jarak viewer, lebih kecil = lebih dramatis */
  perspective-origin: 50% 50%; /* posisi viewer, default center */
}

.scene .card {
  transform: rotateY(30deg);   /* terlihat 3D karena ada perspective di parent */
}

/* perspective() sebagai transform function — per-elemen sendiri */
/* Setiap elemen punya titik vanish sendiri */
.card {
  transform: perspective(800px) rotateY(30deg);
}

/* Contoh perspective-origin berbeda */
.top-view    { perspective-origin: 50% 0%; }     /* dari atas */
.left-view   { perspective-origin: 0% 50%; }      /* dari kiri */
.corner-view { perspective-origin: 0% 0%; }       /* dari sudut kiri atas */
        `}</Code>
          </Section>
          <Divider />

          <Section id="backface" onClick={() => setActiveSection("backface")}>
            <H2>backface-visibility<H2.anchor href="#backface">#</H2.anchor></H2>
            <P>Mengontrol apakah sisi belakang elemen terlihat saat di-flip 180°. Penting untuk card flip animations.</P>
            <Code file="backface-visibility.css">{`
/* Card flip — contoh klasik backface-visibility */
.card-container {
  perspective: 800px;
}

.card {
  position: relative;
  width: 200px;
  height: 120px;
  transform-style: preserve-3d;
  transition: transform 600ms ease;
}

.card:hover { transform: rotateY(180deg); }

.card-front,
.card-back {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;   /* sembunyikan sisi belakang */
  -webkit-backface-visibility: hidden;  /* Safari prefix */
  border-radius: 12px;
}

.card-front {
  background: #6366f1;
  color: white;
}

.card-back {
  background: #ec4899;
  color: white;
  transform: rotateY(180deg);    /* balik ke belakang sejak awal */
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="preserve-3d" onClick={() => setActiveSection("preserve-3d")}>
            <H2>transform-style: preserve-3d<H2.anchor href="#preserve-3d">#</H2.anchor></H2>
            <Code file="preserve-3d.css">{`
/* transform-style: flat (default) — children di-flatten ke 2D */
/* transform-style: preserve-3d — children ikut 3D space parent */

/* Tanpa preserve-3d — card flip tidak kerja */
.broken-card {
  transform-style: flat;   /* default */
  transform: rotateY(180deg);
  /* .card-back ikut berputar tapi di 2D — looks broken */
}

/* Dengan preserve-3d — card flip benar */
.card {
  transform-style: preserve-3d;
  transition: transform 600ms;
}
.card:hover { transform: rotateY(180deg); }

/* Cube 3D */
.cube {
  width: 100px;
  height: 100px;
  transform-style: preserve-3d;
  transform: rotateX(-20deg) rotateY(30deg);
  animation: rotate-cube 8s linear infinite;
}

.cube-face {
  position: absolute;
  width: 100px;
  height: 100px;
  border: 2px solid white;
  opacity: 0.9;
}

.front  { transform: translateZ(50px); background: rgba(99,102,241,0.7); }
.back   { transform: translateZ(-50px) rotateY(180deg); background: rgba(236,72,153,0.7); }
.left   { transform: translateX(-50px) rotateY(-90deg); background: rgba(16,185,129,0.7); }
.right  { transform: translateX(50px) rotateY(90deg); background: rgba(245,158,11,0.7); }
.top    { transform: translateY(-50px) rotateX(90deg); background: rgba(239,68,68,0.7); }
.bottom { transform: translateY(50px) rotateX(-90deg); background: rgba(99,102,241,0.4); }
        `}</Code>
          </Section>
          <Divider />

          <Section id="will-change" onClick={() => setActiveSection("will-change")}>
            <H2>will-change<H2.anchor href="#will-change">#</H2.anchor></H2>
            <P><IC>will-change</IC> memberi tahu browser properti apa yang akan berubah, sehingga browser bisa mempromosikan elemen ke layer terpisah di GPU — menghasilkan animasi yang lebih smooth.</P>
            <Code file="will-change.css">{`
/* Hint ke browser sebelum animasi dimulai */
.animated-card {
  will-change: transform, opacity;
}

/* Tambahkan via JS saat hover — lebih efisien */
card.addEventListener('mouseenter', () => {
  card.style.willChange = 'transform';
});
card.addEventListener('mouseleave', () => {
  card.style.willChange = 'auto';    /* reset setelah selesai */
});

/* Jangan overuse! */
/* ❌ Buruk — selalu aktif, memakan memori GPU */
* { will-change: transform; }

/* ✅ Baik — hanya saat animasi akan segera dimulai */
.will-animate-soon { will-change: transform; }

/* Nilai yang tersedia */
.scroll    { will-change: scroll-position; }
.transform { will-change: transform; }
.opacity   { will-change: opacity; }
.contents  { will-change: contents; }
.multi     { will-change: transform, opacity; }
.reset     { will-change: auto; }    /* remove hint */

/* Alternatif yang sama efektifnya */
/* transform: translateZ(0) — creates GPU layer */
.gpu-layer { transform: translateZ(0); }
        `}</Code>
            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Gunakan will-change dengan bijak</Callout.title>
                Setiap elemen dengan <IC>will-change: transform</IC> dialokasikan di memori GPU. Terlalu banyak bisa habiskan VRAM dan justru memperlambat — gunakan hanya sesaat sebelum animasi dimulai, lalu reset ke <IC>auto</IC>.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="individual" onClick={() => setActiveSection("individual")}>
            <H2>Individual Transform Properties (CSS Level 5)<H2.anchor href="#individual">#</H2.anchor></H2>
            <P>CSS Level 5 memperkenalkan <IC>translate</IC>, <IC>rotate</IC>, dan <IC>scale</IC> sebagai properti tersendiri — memudahkan animasi yang hanya mengubah satu aspek tanpa override transform lain.</P>
            <Code file="individual-transforms.css">{`
/* CSS Level 5 — individual transform properties */
/* Urutan aplikasi: translate → rotate → scale → transform */

.el {
  translate: 50px 20px;    /* x y (optional) z */
  rotate: 45deg;           /* angle, atau: axis angle */
  scale: 1.2;              /* uniform, atau: x y (optional z) */
}

/* Keunggulan: bisa animate satu tanpa reset lainnya */
/* Sebelumnya: */
.old {
  transform: translateX(50px) rotate(0deg);
  transition: transform 300ms;
}
.old:hover {
  transform: translateX(50px) rotate(45deg); /* harus tulis ulang translate! */
}

/* Sekarang: */
.new {
  translate: 50px 0;
  rotate: 0deg;
  transition: rotate 300ms;  /* hanya rotate yang berubah */
}
.new:hover { rotate: 45deg; }  /* translate tidak tersentuh */

/* 3D dengan individual properties */
.el-3d {
  translate: 20px 0 50px;   /* x y z */
  rotate: y 30deg;           /* axis (x/y/z atau vector) + angle */
  scale: 1.5 1 1;            /* x y z */
}

/* Animasi yang bisa dikomposisikan */
@keyframes spin-only { from { rotate: 0deg; } to { rotate: 360deg; } }
@keyframes float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -20px; } }

.floating-spinner {
  animation: spin-only 2s linear infinite, float 3s ease-in-out infinite;
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Transforms di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="transforms-tw.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Hover transforms via Tailwind */
const Card = tw.div({
  base: "rounded-xl p-4 bg-[var(--surface)] transition-transform duration-200 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]",
})

/* 3D card flip — butuh arbitrary values */
const FlipCard = tw.div({
  base: "relative [transform-style:preserve-3d] transition-transform duration-500 cursor-pointer hover:[transform:rotateY(180deg)]",
})

const CardFace = tw.div({
  base: "absolute inset-0 rounded-xl [backface-visibility:hidden]",
  variants: {
    face: {
      front: "bg-indigo-500",
      back:  "bg-pink-500 [transform:rotateY(180deg)]",
    },
  },
  defaultVariants: { face: "front" },
})

/* GPU optimization */
const AnimatedEl = tw.div({
  base: "[will-change:transform] hover:scale-110 transition-transform duration-200",
})

/* Individual transform properties via arbitrary */
const Spinner = tw.div({
  base: "w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent [rotate:0deg] animate-spin",
})
        `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Card flip 3D</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat card flip 3D yang menampilkan sisi depan (info produk) dan sisi belakang (detail) saat hover. Gunakan <IC>transform-style: preserve-3d</IC>, <IC>backface-visibility: hidden</IC>, dan <IC>perspective</IC>.</p>
                <p>Pastikan transisi smooth 600ms dengan <IC>ease-in-out</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — CSS Cube</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat cube 3D dengan 6 sisi menggunakan 6 elemen <IC>div</IC>. Posisikan masing-masing sisi dengan <IC>translateZ</IC> dan <IC>rotateX/Y</IC>, bungkus dalam parent dengan <IC>transform-style: preserve-3d</IC>.</p>
                <p>Animasikan cube berputar terus menggunakan <IC>@keyframes</IC> yang mengubah <IC>rotateX</IC> dan <IC>rotateY</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Individual transform composition</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat elemen yang punya dua animasi berjalan bersamaan menggunakan CSS Level 5 individual properties: <IC>translate</IC> untuk float naik-turun, dan <IC>rotate</IC> untuk berputar terus.</p>
                <p>Pastikan kedua animasi independen — mengubah durasi salah satu tidak mempengaruhi yang lain.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/medium/transitions-animations" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Transitions & Animations</NavBtn.label></NavBtn>
            <NavBtn href="/learn/medium/visual-effects" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Visual Effects</NavBtn.label></NavBtn>
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
