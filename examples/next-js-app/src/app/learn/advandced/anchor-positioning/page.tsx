/**
 * CSS Advanced — Anchor Positioning
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, SupportBadge, BadgeRow,
  AnchorDemo, AnchorTarget, AnchorPopup, AnchorDemoWrapper,
} from "./styles"

type AnchorPos = "top" | "bottom" | "left" | "right"

const TOC = [
  { id: "intro", label: "Apa itu Anchor Positioning" },
  { id: "anchor-name", label: "anchor-name & position-anchor" },
  { id: "position-area", label: "position-area (dulunya position-area)" },
  { id: "anchor-function", label: "anchor() function" },
  { id: "position-try", label: "@position-try & fallback" },
  { id: "anchor-size", label: "anchor-size()" },
  { id: "use-cases", label: "Use Cases Nyata" },
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

function AnchorPlayground() {
  const [pos, setPos] = useState<AnchorPos>("top")
  const positions: AnchorPos[] = ["top", "bottom", "left", "right"]

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>⚓ Anchor Positioning Playground</PlaygroundWrap.label>
        <ChipRow>
          {positions.map(p => <Chip key={p} active={pos === p} onClick={() => setPos(p)}>{p}</Chip>)}
        </ChipRow>
        <P>Simulasi tooltip mengikuti anchor element</P>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <AnchorDemo>
          <AnchorDemoWrapper>
            <AnchorTarget>Anchor Button</AnchorTarget>
            {/* ✅ FIX: Using AnchorPopup variant instead of style={{}} */}
            <AnchorPopup position={pos}>
              Tooltip — posisi: {pos}
            </AnchorPopup>
          </AnchorDemoWrapper>
        </AnchorDemo>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {`position-anchor: --btn; position-area: ${pos === "top" ? "top span-all" : pos === "bottom" ? "bottom span-all" : pos === "left" ? "left span-all" : "right span-all"};`}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function AnchorPositioningPage() {
  const [activeSection, setActiveSection] = useState("intro")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/advandced">Advanced</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>Anchor Positioning</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>CSS Anchor Positioning</PageTitle>
          <PageDesc>Posisikan elemen relatif ke elemen lain tanpa JavaScript — tooltip, dropdown, popover yang otomatis flip saat keluar viewport. Baseline 2024.</PageDesc>

          <Section id="intro" onClick={() => setActiveSection("intro")}>
            <H2>Apa itu CSS Anchor Positioning<H2.anchor href="#intro">#</H2.anchor></H2>
            <P>CSS Anchor Positioning adalah API yang memungkinkan elemen CSS di-posisikan relatif ke elemen lain (anchor) secara deklaratif — tanpa perlu menghitung offset dengan JavaScript. Ini menyelesaikan masalah klasik: tooltip, dropdown, dan popover yang harus mengikuti posisi elemen trigger.</P>
            <BadgeRow>
              <SupportBadge status="supported">✅ Chrome 125+</SupportBadge>
              <SupportBadge status="supported">✅ Edge 125+</SupportBadge>
              <SupportBadge status="supported">✅ Safari 18.2+</SupportBadge>
              <SupportBadge status="supported">✅ Firefox 130+</SupportBadge>
            </BadgeRow>
            <Callout type="tip">
              <Callout.icon>⚓</Callout.icon>
              <Callout.content><Callout.title>Baseline 2024 — Newly Available</Callout.title>CSS Anchor Positioning sudah Baseline 2024 — didukung semua browser modern. Aman dipakai dengan progressive enhancement.</Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="anchor-name" onClick={() => setActiveSection("anchor-name")}>
            <H2>anchor-name & position-anchor<H2.anchor href="#anchor-name">#</H2.anchor></H2>
            <P>Dua properti utama: <IC>anchor-name</IC> mendaftarkan elemen sebagai anchor, <IC>position-anchor</IC> di elemen positioned memberi tahu browser anchor mana yang diikuti.</P>
            <Code file="anchor-basic.css">{`
/* 1. Daftarkan anchor */
.btn {
  anchor-name: --my-btn;   /* nama harus dimulai dengan -- */
}

/* 2. Posisikan elemen lain relatif ke anchor */
.tooltip {
  position: absolute;           /* atau fixed */
  position-anchor: --my-btn;    /* ikut anchor ini */

  /* Kemudian gunakan position-area atau anchor() untuk posisi */
  position-area: top;              /* cara modern — lebih mudah */
}

/* HTML tidak perlu parent-child relationship! */
/* Anchor dan positioned element bisa di mana saja di DOM */
<button class="btn">Hover me</button>
<div class="tooltip">Tooltip content</div>

/* Kelebihan utama: tooltip TIDAK perlu berada di dalam button */
/* Ini menghindari masalah overflow:hidden yang memotong tooltip */
        `}</Code>
            <AnchorPlayground />
          </Section>
          <Divider />

          <Section id="position-area" onClick={() => setActiveSection("position-area")}>
            <H2>position-area<H2.anchor href="#position-area">#</H2.anchor></H2>
            <P><IC>position-area</IC> adalah cara paling mudah memposisikan elemen relatif ke anchor — menggunakan grid 3×3 konseptual di sekitar anchor.</P>
            <Code file="position-area.css">{`
/* Grid 3×3 konseptual di sekitar anchor: */
/*           top                          */
/* left   [anchor]   right               */
/*           bottom                       */

.tooltip {
  position: fixed;
  position-anchor: --btn;

  /* Single value — posisi di satu sisi */
  position-area: top;         /* di atas anchor, di tengah horizontal */
  position-area: bottom;      /* di bawah anchor */
  position-area: left;        /* di kiri anchor */
  position-area: right;       /* di kanan anchor */

  /* Dua nilai — row column */
  position-area: top right;   /* di sudut kanan atas */
  position-area: bottom left; /* di sudut kiri bawah */

  /* span-all — span ke seluruh sisi yang sama */
  position-area: top span-all;    /* di atas, span penuh horizontal */
  position-area: bottom span-all; /* di bawah, span penuh horizontal */

  /* center — di tengah anchor (overlap) */
  position-area: center;
  position-area: top center;  /* di atas, di tengah */
}

/* Nilai yang lebih spesifik */
.dropdown {
  position: fixed;
  position-anchor: --trigger;
  position-area: bottom span-all;  /* dropdown di bawah button, selebar button */
  width: anchor-size(width);    /* lebar = lebar anchor */
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="anchor-function" onClick={() => setActiveSection("anchor-function")}>
            <H2>anchor() function<H2.anchor href="#anchor-function">#</H2.anchor></H2>
            <P>Fungsi <IC>anchor()</IC> memberikan kontrol lebih presisi — referensi edge tertentu dari anchor untuk menghitung posisi.</P>
            <Code file="anchor-fn.css">{`
/* anchor(--name, edge) — referensi edge dari anchor */
/* Edge values: top, right, bottom, left, center, start, end */

.tooltip {
  position: fixed;
  position-anchor: --btn;

  /* Letakkan top tooltip = bottom anchor + 8px gap */
  top: calc(anchor(bottom) + 8px);

  /* Tengahkan secara horizontal */
  left: anchor(center);
  translate: -50% 0;  /* adjust karena referensi dari kiri */
}

/* Contoh dropdown yang rata kiri dengan anchor */
.dropdown {
  position: fixed;
  position-anchor: --select-btn;

  top: calc(anchor(bottom) + 4px);
  left: anchor(left);     /* rata kiri dengan anchor */
  right: anchor(right);   /* rata kanan dengan anchor → lebar sama */
}

/* Tooltip di atas dengan arrow */
.tooltip-arrow {
  position: fixed;
  position-anchor: --target;

  bottom: calc(anchor(top) - 4px);  /* di atas anchor, -4 untuk arrow */
  left: anchor(center);
  translate: -50% 0;
}

/* Tanpa nama spesifik — pakai default anchor */
.tooltip {
  position: fixed;
  position-anchor: --btn;  /* set default anchor */
  top: calc(anchor(top) + 8px);  /* anchor() tanpa nama = default anchor */
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="position-try" onClick={() => setActiveSection("position-try")}>
            <H2>@position-try — Auto Flip Fallback<H2.anchor href="#position-try">#</H2.anchor></H2>
            <P>Masalah klasik tooltip: kalau anchor terlalu dekat edge viewport, tooltip keluar layar. <IC>@position-try</IC> mendefinisikan posisi alternatif yang dicoba secara otomatis.</P>
            <Code file="position-try.css">{`
/* @position-try — definisikan alternative positions */
@position-try --flip-bottom {
  position-area: bottom;
}

@position-try --flip-left {
  position-area: left;
}

@position-try --flip-right {
  position-area: right;
}

.tooltip {
  position: fixed;
  position-anchor: --btn;
  position-area: top;   /* posisi pertama — di atas */

  /* position-try-fallbacks — urutan fallback kalau tidak muat */
  position-try-fallbacks:
    --flip-bottom,   /* coba di bawah */
    --flip-left,     /* coba di kiri */
    --flip-right;    /* coba di kanan */

  /* position-try-order — strategi pilih fallback */
  position-try-order: normal;           /* default — coba secara urutan */
  position-try-order: most-block-size;  /* pilih yang punya block size terbesar */
  position-try-order: most-inline-size; /* pilih yang punya inline size terbesar */
}

/* Shorthand: position-try = order + fallbacks */
.tooltip {
  position-try: --flip-bottom --flip-left;  /* tanpa order */
  position-try: most-block-size --flip-bottom --flip-left;
}

/* Built-in flip keywords (lebih mudah!) */
.tooltip {
  position-try-fallbacks: flip-block;       /* flip atas ↔ bawah */
  position-try-fallbacks: flip-inline;      /* flip kiri ↔ kanan */
  position-try-fallbacks: flip-start;       /* flip start/end logic */
  position-try-fallbacks: flip-block, flip-inline; /* keduanya */
}
        `}</Code>
            <Callout type="tip">
              <Callout.icon>💡</Callout.icon>
              <Callout.content><Callout.title>flip-block shorthand</Callout.title>Untuk kebanyakan tooltip, <IC>position-try-fallbacks: flip-block, flip-inline</IC> sudah cukup — browser otomatis flip ke posisi yang paling fit di viewport tanpa perlu mendefinisikan <IC>@position-try</IC> manual.</Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="anchor-size" onClick={() => setActiveSection("anchor-size")}>
            <H2>anchor-size() — Match Ukuran Anchor<H2.anchor href="#anchor-size">#</H2.anchor></H2>
            <P>Fungsi <IC>anchor-size()</IC> memungkinkan elemen positioned mengambil ukuran dari anchor-nya.</P>
            <Code file="anchor-size.css">{`
/* anchor-size(dimension) */
/* Dimensions: width, height, block, inline, self-block, self-inline */

.dropdown {
  position: fixed;
  position-anchor: --select;

  position-area: bottom span-all;

  /* Lebar dropdown = lebar select button */
  width: anchor-size(width);

  /* Min-width = lebar anchor, tapi bisa lebih lebar */
  min-width: anchor-size(width);
}

/* Tooltip yang tingginya dibatasi setengah anchor */
.tooltip {
  position: fixed;
  position-anchor: --target;
  position-area: top;
  max-height: anchor-size(height);  /* tidak lebih tinggi dari anchor */
}

/* Kalkulasi lebih kompleks dengan calc() */
.panel {
  position: fixed;
  position-anchor: --btn;
  width: calc(anchor-size(width) * 3);  /* 3x lebar button */
}

/* anchor-size() tanpa nama — pakai default anchor */
.tooltip {
  position-anchor: --my-anchor;
  width: anchor-size();  /* = width dari --my-anchor */
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="use-cases" onClick={() => setActiveSection("use-cases")}>
            <H2>Use Cases Nyata<H2.anchor href="#use-cases">#</H2.anchor></H2>
            <Code file="tooltip.css">{`
/* ── Tooltip sederhana ── */
[data-tooltip] {
  anchor-name: --tooltip-anchor;
}

.tooltip {
  position: fixed;
  position-anchor: --tooltip-anchor;
  position-area: top;
  margin-bottom: 8px;

  position-try-fallbacks: flip-block;

  background: oklch(20% 0 0);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
}

/* ── Select dropdown ── */
.custom-select { anchor-name: --select; }

.select-dropdown {
  position: fixed;
  position-anchor: --select;
  position-area: bottom span-all;
  width: anchor-size(width);
  position-try-fallbacks: flip-block;

  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* ── Context menu ── */
.context-trigger { anchor-name: --ctx; }

.context-menu {
  position: fixed;
  position-anchor: --ctx;
  position-area: bottom right;
  position-try-fallbacks: flip-block, flip-inline;

  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 0.25rem;
  min-width: 160px;
}

/* ── Popover + Anchor (kombinasi) ── */
.btn { anchor-name: --popover-anchor; }

.popover[popover] {
  position-anchor: --popover-anchor;
  position-area: bottom;
  position-try-fallbacks: flip-block;
  margin: 8px 0;
}
        `}</Code>
            <Code file="anchor-tw.tsx">{`
/* React component menggunakan CSS anchor positioning */
import { tw } from "tailwind-styled-v4"

const TriggerBtn = tw.button({
  base: "px-3 py-1.5 rounded-lg text-sm bg-indigo-500 text-white [anchor-name:--tooltip-anchor]",
})

/* Tooltip menggunakan arbitrary values untuk anchor CSS */
const Tooltip = tw.div({
  base: [
    "fixed text-xs px-2 py-1 rounded-md bg-gray-900 text-white whitespace-nowrap",
    "[position-anchor:--tooltip-anchor]",
    "[position-area:top]",
    "[position-try-fallbacks:flip-block]",
    "[margin-bottom:6px]",
  ].join(" "),
})

export function TooltipExample() {
  return (
    <>
      <TriggerBtn>Hover</TriggerBtn>
      <Tooltip>Ini tooltip CSS native!</Tooltip>
    </>
  )
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Anchor Positioning di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="anchor-tw-full.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Daftarkan anchor via arbitrary CSS property */
const MenuButton = tw.button({
  base: "px-4 py-2 rounded-lg border text-sm [anchor-name:--menu-btn]",
})

/* Dropdown yang ikut anchor */
const DropdownMenu = tw.div({
  base: [
    "fixed z-50 rounded-xl border bg-[var(--surface)] shadow-xl py-1 min-w-[160px]",
    "[position-anchor:--menu-btn]",
    "[position-area:bottom_span-all]",
    "[width:anchor-size(width)]",
    "[position-try-fallbacks:flip-block]",
    "[margin-top:4px]",
  ].join(" "),
})

/* Tooltip generik — bisa dipakai ulang dengan CSS variable */
const TooltipWrap = tw.div({
  base: [
    "fixed z-[9999] px-2 py-1 rounded-md text-xs",
    "bg-[oklch(15%_0_0)] text-white whitespace-nowrap pointer-events-none",
    "[position-anchor:var(--tooltip-for)]",
    "[position-area:top]",
    "[position-try-fallbacks:flip-block,flip-inline]",
    "[margin-bottom:6px]",
  ].join(" "),
})

/* Penggunaan */
function App() {
  return (
    <>
      {/* ✅ EXCEPTION: Demonstrating CSS Anchor Positioning API usage */}
      {/* anchorName must be set via inline style for anchor positioning to work */}
      <MenuButton style={{ anchorName: "--menu-btn" } as React.CSSProperties}>
        Open Menu
      </MenuButton>
      <DropdownMenu>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </DropdownMenu>
    </>
  )
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Tooltip yang auto-flip</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat tooltip yang muncul di atas anchor secara default, tapi otomatis flip ke bawah kalau anchor terlalu dekat top viewport. Gunakan <IC>position-try-fallbacks: flip-block</IC>.</p>
                <p>Tambahkan animasi masuk menggunakan <IC>@starting-style</IC> dan <IC>transition: opacity 200ms, transform 200ms</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Custom select dropdown</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat custom select dropdown menggunakan <IC>anchor-name</IC> dan <IC>position-area: bottom span-all</IC>. Lebar dropdown harus sama dengan tombol trigger menggunakan <IC>width: anchor-size(width)</IC>.</p>
                <p>Kombinasikan dengan Popover API (<IC>popover</IC> attribute) untuk light-dismiss gratis.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Context menu</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat context menu yang muncul di sudut kanan bawah anchor, tapi flip ke kiri atau atas kalau ada clipping. Gunakan <IC>@position-try</IC> custom dengan empat posisi fallback.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/advandced" dir="prev"><NavBtn.hint>← Back</NavBtn.hint><NavBtn.label>Advanced Overview</NavBtn.label></NavBtn>
            <NavBtn href="/learn/advandced/subgrid" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>CSS Subgrid</NavBtn.label></NavBtn>
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
