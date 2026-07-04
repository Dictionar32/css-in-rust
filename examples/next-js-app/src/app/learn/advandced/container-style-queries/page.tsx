/**
 * CSS Advanced — Container & Style Queries
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, SupportBadge, BadgeRow,
  ContainerBox, ContainerLabel, ControlsRow, WidthValue, CardIcon, CardContent, CardMeta,
  ComparisonTable, CompTable, CompTableHead, CompTableHeadRow, CompTableHeadCell, CompTableBody, CompTableRow, CompTableCell,
  PlaygroundWidthContainer, CardContainer, CardImage, CardTitleNormal, CardTitleLarge, CompTableCellBold, RangeSlider, SmallText, SmallDescription,
} from "./styles"

const TOC = [
  { id: "intro", label: "Container Queries vs Media Queries" },
  { id: "container-type", label: "container-type & container-name" },
  { id: "size-queries", label: "Size Queries" },
  { id: "style-queries", label: "Style Queries" },
  { id: "container-units", label: "Container Units (cqw, cqh, cqi, cqb)" },
  { id: "nested", label: "Nested Containers" },
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

function ContainerQueryPlayground() {
  const [width, setWidth] = useState(300)

  const isWide = width >= 400
  const isVeryWide = width >= 560

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>📦 Container Query Playground</PlaygroundWrap.label>
        <ControlsRow>
          <SmallText>Lebar container:</SmallText>
          <RangeSlider
            type="range"
            min={180}
            max={640}
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
          />
          <WidthValue>{width}px</WidthValue>
        </ControlsRow>
        <ChipRow>
          <Chip active={!isWide} onClick={() => setWidth(300)}>{"< 400px"}</Chip>
          <Chip active={isWide && !isVeryWide} onClick={() => setWidth(480)}>400–559px</Chip>
          <Chip active={isVeryWide} onClick={() => setWidth(600)}>{"≥ 560px"}</Chip>
        </ChipRow>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        {/* ✅ EXCEPTION: Dynamic width state for container query demo */}
        {/* Cannot be extracted to tw() because width depends on React state */}
        <PlaygroundWidthContainer style={{ width: `${width}px` }}>
          <ContainerBox>
            <ContainerLabel>container-type: inline-size | {width}px</ContainerLabel>
            {/* Simulasi card yang berubah layout berdasarkan container width */}
            <CardContainer layout={isWide ? "row" : "column"}>
              <CardImage layout={isWide ? "row" : "column"}>
                <CardIcon>🖼️</CardIcon>
              </CardImage>
              <CardContent>
                {isVeryWide ? (
                  <CardTitleLarge>Judul Artikel</CardTitleLarge>
                ) : (
                  <CardTitleNormal>Judul Artikel</CardTitleNormal>
                )}
                <SmallDescription>
                  {isWide ? "Deskripsi artikel ini tampil karena container cukup lebar." : "Deskripsi singkat."}
                </SmallDescription>
                {isVeryWide && (
                  <CardMeta>
                    Tag • Kategori • 5 menit baca
                  </CardMeta>
                )}
              </CardContent>
            </CardContainer>
          </ContainerBox>
        </PlaygroundWidthContainer>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {isVeryWide
          ? "@container (min-width: 560px) { /* layout row + title besar + meta */ }"
          : isWide
            ? "@container (min-width: 400px) { .card { flex-direction: row; } }"
            : "@container { /* layout vertikal default */ }"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function ContainerStyleQueriesPage() {
  const [activeSection, setActiveSection] = useState("intro")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/advandced">Advanced</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>Container & Style Queries</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>Container & Style Queries</PageTitle>
          <PageDesc>Buat komponen yang responsif terhadap ukuran container-nya sendiri — bukan viewport. Plus style queries yang bereaksi terhadap nilai CSS custom property.</PageDesc>

          <Section id="intro" onClick={() => setActiveSection("intro")}>
            <H2>Container Queries vs Media Queries<H2.anchor href="#intro">#</H2.anchor></H2>
            <P>Media queries bereaksi terhadap viewport. Container queries bereaksi terhadap ukuran elemen container tempat komponen berada. Ini memungkinkan komponen yang benar-benar reusable — berubah layout berdasarkan ruang yang tersedia, bukan ukuran layar.</P>
            <ComparisonTable>
              <CompTable>
                <CompTableHead>
                  <CompTableHeadRow>
                    <CompTableHeadCell>Aspek</CompTableHeadCell>
                    <CompTableHeadCell>Media Query</CompTableHeadCell>
                    <CompTableHeadCell>Container Query</CompTableHeadCell>
                  </CompTableHeadRow>
                </CompTableHead>
                <CompTableBody>
                  <CompTableRow>
                    <CompTableCellBold>Referensi</CompTableCellBold>
                    <CompTableCell>Viewport (window)</CompTableCell>
                    <CompTableCell>Container element</CompTableCell>
                  </CompTableRow>
                  <CompTableRow>
                    <CompTableCellBold>Reusability</CompTableCellBold>
                    <CompTableCell>Terikat layout halaman</CompTableCell>
                    <CompTableCell>Komponen mandiri</CompTableCell>
                  </CompTableRow>
                  <CompTableRow>
                    <CompTableCellBold>Sidebar card</CompTableCellBold>
                    <CompTableCell>Perlu tahu konteks halaman</CompTableCell>
                    <CompTableCell>Otomatis menyesuaikan</CompTableCell>
                  </CompTableRow>
                  <CompTableRow>
                    <CompTableCellBold>Support</CompTableCellBold>
                    <CompTableCell>Semua browser</CompTableCell>
                    <CompTableCell>Chrome 105+, Safari 16+, FF 110+</CompTableCell>
                  </CompTableRow>
                </CompTableBody>
              </CompTable>
            </ComparisonTable>
            <BadgeRow>
              <SupportBadge status="supported">✅ Chrome 105+</SupportBadge>
              <SupportBadge status="supported">✅ Edge 105+</SupportBadge>
              <SupportBadge status="supported">✅ Safari 16+</SupportBadge>
              <SupportBadge status="supported">✅ Firefox 110+</SupportBadge>
            </BadgeRow>
          </Section>
          <Divider />

          <Section id="container-type" onClick={() => setActiveSection("container-type")}>
            <H2>container-type & container-name<H2.anchor href="#container-type">#</H2.anchor></H2>
            <P>Untuk menggunakan container query, elemen harus didaftarkan sebagai container menggunakan <IC>container-type</IC>. Opsional, beri nama dengan <IC>container-name</IC> agar bisa di-query secara spesifik.</P>
            <Code file="container-setup.css">{`
/* container-type values: */
/* inline-size — track width (paling umum) */
/* size         — track width + height */
/* normal       — hanya style queries, tidak size */

.card-wrapper {
  container-type: inline-size;  /* hanya track inline/width */
  container-name: card;          /* nama opsional */
}

/* Shorthand: container = name / type */
.sidebar {
  container: sidebar / inline-size;
}

.widget {
  container: widget / size;  /* track width dan height */
}

/* container-type: normal — untuk style queries saja */
.theme-provider {
  container-type: normal;
  container-name: theme;
  --variant: primary;  /* bisa di-query oleh style query */
}

/* Penting: container tidak bisa query dirinya sendiri */
/* Query hanya mempengaruhi descendants */
        `}</Code>
            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>containment side effect</Callout.title>
                <IC>container-type: size</IC> menerapkan <IC>contain: size</IC> yang menyebabkan elemen tidak lagi mendapat ukuran dari kontennya. Pakai <IC>inline-size</IC> untuk menghindari ini — paling aman untuk kebanyakan kasus.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="size-queries" onClick={() => setActiveSection("size-queries")}>
            <H2>Size Queries<H2.anchor href="#size-queries">#</H2.anchor></H2>
            <P>Size queries menggunakan sintaks mirip media queries tapi di dalam <IC>@container</IC>. Bisa query <IC>width</IC>, <IC>height</IC>, <IC>inline-size</IC>, <IC>block-size</IC>, <IC>aspect-ratio</IC>, dan <IC>orientation</IC>.</P>
            <Code file="container-queries.css">{`
/* container-queries.css */
/* Definisikan container */
.card-wrapper {
  container-type: inline-size;  /* hanya track inline/width */
  container-name: card;          /* nama opsional */
}

/* Query berdasarkan ukuran container (bukan viewport) */
@container (min-width: 400px) {
  .card { flex-direction: row; }
}

@container card (min-width: 600px) {
  .card-title { font-size: 1.5rem; }
}

/* Container units */
.title { font-size: 5cqw; }   /* 5% dari container width */
.icon  { width: 10cqi; }       /* 10% dari container inline size */

/* Style queries — berdasarkan nilai custom property */
@container style(--variant: primary) {
  .btn { background: blue; }
}

.btn-primary { --variant: primary; }
        `}</Code>
            <ContainerQueryPlayground />
            <Code file="size-query-examples.css">{`
/* Range syntax (modern, lebih ekspresif) */
@container (200px <= inline-size <= 500px) {
  .card { /* layout untuk container medium */ }
}

@container (inline-size > 600px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
  }
}

/* Query height — butuh container-type: size */
.panel { container: panel / size; }

@container panel (height > 400px) {
  .panel-content { overflow-y: auto; }
}

/* Query berdasarkan aspect-ratio */
@container (aspect-ratio > 1) {
  .media { /* landscape orientation */ }
}

/* Multiple conditions */
@container card (min-width: 400px) and (max-width: 800px) {
  .card-body { padding: 1.5rem; }
}

/* Nested container queries */
.outer { container: outer / inline-size; }
.inner { container: inner / inline-size; }

@container outer (min-width: 600px) {
  @container inner (min-width: 200px) {
    .deeply-nested { color: red; }
  }
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="style-queries" onClick={() => setActiveSection("style-queries")}>
            <H2>Style Queries<H2.anchor href="#style-queries">#</H2.anchor></H2>
            <P>Style queries memungkinkan styling berdasarkan nilai CSS custom property pada container. Ini membuka pola baru: komponen yang bisa berubah tampilan berdasarkan "tema" yang ditetapkan parent-nya.</P>
            <Code file="style-queries.css">{`
/* Style query — @container style(--property: value) */
/* Perlu container-type: normal (atau container-type lain) */

.card-wrapper {
  container-type: normal;     /* cukup untuk style queries */
  container-name: card-ctx;
}

/* Variasi kartu berdasarkan custom property */
.card-wrapper[data-variant="featured"] {
  --card-variant: featured;
}

@container card-ctx style(--card-variant: featured) {
  .card {
    border-color: oklch(65% 0.2 250);
    background: oklch(97% 0.02 250);
  }
  .card-title { color: oklch(40% 0.2 250); }
}

/* Dark mode via style query */
.theme-provider {
  container-type: normal;
  container-name: theme;
}

[data-theme="dark"] .theme-provider {
  --color-scheme: dark;
}

@container theme style(--color-scheme: dark) {
  .card { background: oklch(15% 0 0); color: white; }
}

/* Variasi button */
.btn-context {
  container-type: normal;
  --btn-variant: default;
}

.btn-context.primary   { --btn-variant: primary; }
.btn-context.danger    { --btn-variant: danger; }

@container style(--btn-variant: primary) {
  .btn { background: blue; color: white; }
}

@container style(--btn-variant: danger) {
  .btn { background: red; color: white; }
}
        `}</Code>
            <Callout type="note">
              <Callout.icon>🧪</Callout.icon>
              <Callout.content>
                <Callout.title>Style queries — partial support</Callout.title>
                Style queries untuk custom properties didukung Chrome 111+ dan Safari 18+. Firefox masih dalam pengembangan. Gunakan dengan progressive enhancement.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="container-units" onClick={() => setActiveSection("container-units")}>
            <H2>Container Units (cqw, cqh, cqi, cqb)<H2.anchor href="#container-units">#</H2.anchor></H2>
            <P>Container units mirip viewport units tapi relatif terhadap container terdekat yang punya containment. Sangat berguna untuk tipografi dan sizing yang fluid.</P>
            <Code file="container-units.css">{`
/* Container Query Units */
/* cqw  — 1% dari container width */
/* cqh  — 1% dari container height */
/* cqi  — 1% dari container inline size (= cqw di horizontal) */
/* cqb  — 1% dari container block size (= cqh di horizontal) */
/* cqmin — min(cqi, cqb) */
/* cqmax — max(cqi, cqb) */

.container { container-type: inline-size; }

/* Tipografi yang fluid berdasarkan container, bukan viewport */
.card-title {
  font-size: clamp(1rem, 5cqi + 0.5rem, 2rem);
  /* Fluid dari 1rem ke 2rem berdasarkan container width */
}

/* Icon yang proporsional dengan container */
.card-icon {
  width: 15cqi;
  height: 15cqi;
  max-width: 48px;  /* batasi agar tidak terlalu besar */
}

/* Padding yang scalable */
.card-body {
  padding: clamp(0.75rem, 3cqi, 2rem);
}

/* Vs viewport units (vw/vh) — perbedaan kunci: */
/* vw = % dari viewport, sama di semua konteks */
/* cqw = % dari container, berbeda per-komponen */

.widget {
  container: widget / inline-size;
  width: 33vw;  /* 1/3 layar */
}

.widget-content {
  font-size: 4cqi;  /* 4% dari 33vw — proporsional dengan widget */
  /* Bukan 4vw yang akan terlalu besar di desktop */
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="nested" onClick={() => setActiveSection("nested")}>
            <H2>Nested Containers<H2.anchor href="#nested">#</H2.anchor></H2>
            <P>Container bisa bersarang. Query akan mencari container terdekat yang match dengan nama (jika disebutkan) atau container apapun yang terdekat.</P>
            <Code file="nested-containers.css">{`
/* Hierarki container */
.page-layout {
  container: page / inline-size;  /* outermost */
}

.sidebar {
  container: sidebar / inline-size;
}

.widget {
  container: widget / inline-size;  /* innermost */
}

/* @container tanpa nama — match container terdekat */
@container (min-width: 300px) {
  .widget-content { /* bereaksi ke .widget container */ }
}

/* @container dengan nama — match container bernama itu */
@container sidebar (min-width: 240px) {
  .widget-content { /* bereaksi ke .sidebar, bukan .widget */ }
}

@container page (min-width: 1024px) {
  .widget-content { /* bereaksi ke .page-layout */ }
}

/* Gunakan named containers untuk kontrol eksplisit */
/* Terutama berguna kalau ada multiple levels nesting */

/* Pattern: komponen yang bisa bereaksi ke berbagai level */
.card {
  container: card / inline-size;
}

/* Query ke container bernama dari luar card */
@container sidebar (min-width: 200px) {
  .card { border-radius: 0.5rem; }
}

@container page (min-width: 800px) {
  .card { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Container Queries di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <P>Tailwind CSS v4 punya dukungan native container queries. Gunakan prefix <IC>@</IC> untuk container queries dan <IC>@[Xpx]</IC> untuk arbitrary sizes.</P>
            <Code file="tw-container.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Definisikan container */
const CardWrapper = tw.div({
  base: "@container",  /* container-type: inline-size */
})

/* Atau dengan nama */
const SidebarWidget = tw.div({
  base: "@container/sidebar",  /* container: sidebar / inline-size */
})

/* Komponen yang responsif terhadap container */
const Card = tw.div({
  base: [
    "flex flex-col gap-3 p-4 rounded-xl border",
    /* Di atas 400px container → layout row */
    "@[400px]:flex-row @[400px]:items-center",
    /* Di atas 600px container → tambah padding */
    "@[600px]:p-6",
  ].join(" "),
})

/* Dengan named container */
const WidgetContent = tw.div({
  base: [
    "text-sm",
    /* Query ke container bernama "sidebar" */
    "@[200px]/sidebar:text-base",
    "@[300px]/sidebar:text-lg",
  ].join(" "),
})

/* Container units di Tailwind v4 */
const FluidTitle = tw.h2({
  base: "text-[clamp(1rem,5cqi,2rem)] font-bold",
})

/* Style queries dengan arbitrary CSS */
const ThemedCard = tw.div({
  base: [
    "rounded-xl p-4",
    /* Style query via arbitrary container query */
    "[@container_style(--variant:featured)]:border-indigo-400",
    "[@container_style(--variant:featured)]:bg-indigo-50",
  ].join(" "),
})

/* Penggunaan */
function ProductCard({ featured = false }) {
  return (
    <div style={{ containerType: "normal" } as React.CSSProperties}
      className={featured ? "[--variant:featured]" : ""}
    >
      <CardWrapper>
        <Card>
          <div>Gambar</div>
          <div>
            <FluidTitle>Judul Produk</FluidTitle>
            <p>Deskripsi...</p>
          </div>
        </Card>
      </CardWrapper>
    </div>
  )
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Responsive card component</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat card komponen yang pakai <IC>@container</IC>. Saat container sempit ({'< 350px'}): tampilkan hanya gambar dan judul. Saat medium (350–550px): tambahkan deskripsi. Saat lebar ({'> 550px'}): layout horizontal dengan semua detail.</p>
                <p>Tempatkan card yang sama di main content (lebar) dan sidebar (sempit) untuk melihat container query bekerja.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Container units untuk tipografi fluid</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat hero section di dalam container. Gunakan <IC>cqi</IC> units untuk font-size heading agar proporsional dengan container, bukan viewport. Tambahkan <IC>clamp()</IC> agar ada batas minimum dan maksimum.</p>
                <p>Uji dengan menempatkan hero di berbagai lebar container (fullwidth vs sidebar).</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Style queries untuk variasi tema</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat sistem button yang bereaksi terhadap style query. Parent component set <IC>--context: danger</IC> atau <IC>--context: success</IC>, dan semua button di dalamnya otomatis berubah warna menggunakan <IC>@container style(--context: danger)</IC>.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/advandced/anchor-positioning" dir="prev"><NavBtn.hint>← Sebelumnya</NavBtn.hint><NavBtn.label>Anchor Positioning</NavBtn.label></NavBtn>
            <NavBtn href="/learn/advandced/popover-api" dir="next"><NavBtn.hint>Selanjutnya →</NavBtn.hint><NavBtn.label>Popover API</NavBtn.label></NavBtn>
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
