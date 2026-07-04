/**
 * CSS Advanced — Subgrid
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, SupportBadge,
  SubgridDemo, GridCell, PlaygroundGridContainer, PlaygroundCard, PlaygroundCardHeader, PlaygroundCardBody, PlaygroundCardFooter, HintText, BadgeRow,
} from "./styles"

const TOC = [
  { id: "intro", label: "Apa itu Subgrid" },
  { id: "grid-subgrid", label: "grid-template-rows/columns: subgrid" },
  { id: "alignment", label: "Item Alignment dengan Subgrid" },
  { id: "named-lines", label: "Named Grid Lines di Subgrid" },
  { id: "use-cases", label: "Use Cases: Card, Form, Table" },
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

function SubgridPlayground() {
  const [useSubgrid, setUseSubgrid] = useState(false)

  const cards = [
    { header: "Card Pendek", body: "Ini konten card yang relatif singkat.", footer: "Aksi" },
    { header: "Card dengan Judul Panjang", body: "Konten card ini lebih panjang dari card lain karena ada lebih banyak teks di sini.", footer: "Lihat Detail" },
    { header: "Card Medium", body: "Konten medium length untuk demonstrasi.", footer: "Edit" },
  ]

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>📐 Subgrid Playground</PlaygroundWrap.label>
        <ChipRow>
          <Chip active={!useSubgrid} onClick={() => setUseSubgrid(false)}>Tanpa Subgrid</Chip>
          <Chip active={useSubgrid} onClick={() => setUseSubgrid(true)}>Dengan Subgrid</Chip>
        </ChipRow>
        <HintText>
          Perhatikan alignment header, body, dan footer antar card
        </HintText>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <PlaygroundGridContainer columns="three" rows="three">
          {cards.map((card, i) => (
            <PlaygroundCard key={i} layout={useSubgrid ? "subgrid" : "flex"}>
              <PlaygroundCardHeader>{card.header}</PlaygroundCardHeader>
              <PlaygroundCardBody>{card.body}</PlaygroundCardBody>
              <PlaygroundCardFooter>{card.footer}</PlaygroundCardFooter>
            </PlaygroundCard>
          ))}
        </PlaygroundGridContainer>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {useSubgrid
          ? "grid-row: span 3; display: grid; grid-template-rows: subgrid;"
          : "display: flex; flex-direction: column; /* header/footer tidak ter-align antar card */"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function SubgridPage() {
  const [activeSection, setActiveSection] = useState("intro")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/advandced">Advanced</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>Subgrid</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>CSS Subgrid</PageTitle>
          <PageDesc>Buat children ikut track grid parent — selesaikan masalah alignment card, form, dan table yang selama ini butuh JavaScript atau hack CSS. Baseline 2023.</PageDesc>

          <Section id="intro" onClick={() => setActiveSection("intro")}>
            <H2>Apa itu Subgrid<H2.anchor href="#intro">#</H2.anchor></H2>
            <P>Subgrid memungkinkan elemen di dalam grid item untuk ikut track kolom atau baris dari grid parent. Sebelum subgrid, alignment antar children dari grid item yang berbeda tidak mungkin dilakukan secara CSS murni.</P>
            <P>Masalah klasik: tiga card di grid, masing-masing punya header, body, dan footer. Tanpa subgrid, tinggi header tidak otomatis sama — harus pakai JavaScript untuk mengukur dan menyamakan tinggi.</P>
            <BadgeRow>
              <SupportBadge status="supported">✅ Chrome 117+</SupportBadge>
              <SupportBadge status="supported">✅ Edge 117+</SupportBadge>
              <SupportBadge status="supported">✅ Safari 16+</SupportBadge>
              <SupportBadge status="supported">✅ Firefox 71+</SupportBadge>
            </BadgeRow>
            <Callout type="tip">
              <Callout.icon>📐</Callout.icon>
              <Callout.content>
                <Callout.title>Baseline 2023 — Widely Available</Callout.title>
                CSS Subgrid sudah Baseline 2023 dan didukung semua browser modern. Aman dipakai sekarang.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="grid-subgrid" onClick={() => setActiveSection("grid-subgrid")}>
            <H2>grid-template-rows/columns: subgrid<H2.anchor href="#grid-subgrid">#</H2.anchor></H2>
            <P>Nilai <IC>subgrid</IC> bisa dipakai pada <IC>grid-template-columns</IC> atau <IC>grid-template-rows</IC>. Grid item yang jadi subgrid akan menggunakan track dari parent-nya, bukan mendefinisikan track baru.</P>
            <Code file="subgrid-basic.css">{`
/* subgrid-basic.css */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 1rem;
}

/* Child menggunakan subgrid — ikut track parent */
.grid-item {
  grid-column: span 3;           /* span 3 kolom */
  display: grid;
  grid-template-columns: subgrid; /* ikut 3 kolom parent */
  /* Sekarang children dari .grid-item ter-align ke track parent */
}

/* subgrid untuk rows */
.card {
  grid-row: span 3;
  display: grid;
  grid-template-rows: subgrid;   /* ikut 3 row parent */
}
/* header, body, footer card sekarang ter-align antar card */

/* Named lines di subgrid */
.parent {
  grid-template-columns: [start] 1fr [mid] 1fr [end];
}
.child {
  display: grid;
  grid-template-columns: subgrid;
  /* Nama [start], [mid], [end] tersedia di child */
}
        `}</Code>
            <SubgridPlayground />
            {/* ✅ EXCEPTION: Educational subgrid demo with static layout values */}
            {/* These inline styles demonstrate actual CSS subgrid behavior and cannot be abstracted to tw() */}
            <SubgridDemo style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              <GridCell style={{ gridColumn: "span 3", display: "grid", gridTemplateColumns: "subgrid", gap: "0.5rem" }}>
                <GridCell>col 1 (subgrid)</GridCell>
                <GridCell>col 2 (subgrid)</GridCell>
                <GridCell>col 3 (subgrid)</GridCell>
              </GridCell>
              <GridCell>track 1</GridCell>
              <GridCell>track 2</GridCell>
              <GridCell>track 3</GridCell>
            </SubgridDemo>
          </Section>
          <Divider />

          <Section id="alignment" onClick={() => setActiveSection("alignment")}>
            <H2>Item Alignment dengan Subgrid<H2.anchor href="#alignment">#</H2.anchor></H2>
            <P>Keuntungan utama subgrid adalah elemen di dalam subgrid item bisa ter-align ke track parent. Ini sangat berguna untuk card layouts di mana setiap card punya struktur header–body–footer.</P>
            <Code file="subgrid-alignment.css">{`
/* Container grid — 3 kolom, 3 baris */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: auto 1fr auto;  /* header | body | footer */
  gap: 1rem;
  align-items: stretch;
}

/* Setiap card span 3 baris dan pakai subgrid */
.card {
  grid-row: span 3;          /* span semua 3 baris */
  display: grid;
  grid-template-rows: subgrid; /* ikut 3 baris parent */

  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Children card otomatis align ke baris parent */
.card-header {
  /* Otomatis di baris 1 — sama tinggi dengan card lain */
  padding: 1rem;
  background: #f9fafb;
  font-weight: 600;
}

.card-body {
  /* Otomatis di baris 2 — flex untuk mengisi sisa ruang */
  padding: 1rem;
}

.card-footer {
  /* Otomatis di baris 3 — selalu di bawah, sejajar */
  padding: 0.75rem 1rem;
  border-top: 1px solid #e5e7eb;
}

/* Hasilnya: semua header sejajar, semua footer sejajar */
/* Tidak perlu min-height atau JavaScript! */
        `}</Code>
            <Callout type="note">
              <Callout.icon>💡</Callout.icon>
              <Callout.content>
                <Callout.title>Grid rows vs columns</Callout.title>
                Subgrid bisa diterapkan pada kolom saja, baris saja, atau keduanya sekaligus. Paling umum adalah <IC>grid-template-rows: subgrid</IC> untuk alignment header/footer antar card.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="named-lines" onClick={() => setActiveSection("named-lines")}>
            <H2>Named Grid Lines di Subgrid<H2.anchor href="#named-lines">#</H2.anchor></H2>
            <P>Named lines yang didefinisikan di parent grid tersedia di dalam subgrid. Ini memungkinkan positioning yang lebih ekspresif menggunakan nama bukan angka.</P>
            <Code file="subgrid-named.css">{`
/* Parent mendefinisikan named lines */
.layout {
  display: grid;
  grid-template-columns:
    [sidebar-start] 220px [sidebar-end content-start] 1fr [content-end];
  grid-template-rows:
    [header-start] 60px [header-end main-start] 1fr [main-end footer-start] 48px [footer-end];
}

/* Child yang jadi subgrid mewarisi nama tersebut */
.page-section {
  grid-column: sidebar-start / content-end;  /* span seluruh lebar */
  grid-row: main-start / main-end;
  display: grid;
  grid-template-columns: subgrid;  /* [sidebar-start], [sidebar-end content-start], [content-end] tersedia */
}

/* Children dari page-section bisa pakai named lines parent */
.section-sidebar {
  grid-column: sidebar-start / sidebar-end;  /* pakai nama dari grandparent! */
}

.section-content {
  grid-column: content-start / content-end;
}

/* Tambah implicit named lines di subgrid */
.card {
  grid-row: span 3;
  display: grid;
  grid-template-rows: subgrid;

  /* Named lines dari subgrid sendiri JUGA bisa ditambah */
  /* (ini menambah, bukan mengganti, nama dari parent) */
}
        `}</Code>
            <H3>Subgrid Gap</H3>
            <P>Subgrid mewarisi gap dari parent secara default. Gap bisa di-override di subgrid jika perlu spacing yang berbeda antar level.</P>
            <Code file="subgrid-gap.css">{`
.parent {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;  /* gap di level parent */
}

.child {
  grid-column: span 3;
  display: grid;
  grid-template-columns: subgrid;
  /* gap: mewarisi 1rem dari parent secara default */

  /* Override gap untuk level ini: */
  gap: 0.5rem;  /* gap berbeda di subgrid */
}

/* gap pada subgrid hanya mempengaruhi children langsung subgrid tersebut */
/* bukan gap antar grid item di parent */
        `}</Code>
          </Section>
          <Divider />

          <Section id="use-cases" onClick={() => setActiveSection("use-cases")}>
            <H2>Use Cases: Card, Form, Table<H2.anchor href="#use-cases">#</H2.anchor></H2>
            <H3>Card Grid</H3>
            <Code file="card-grid.css">{`
/* Card grid — header/footer ter-align antar card */
.products {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-template-rows: auto 1fr auto auto; /* img | title | desc | price+cta */
  gap: 1.5rem;
}

.product-card {
  grid-row: span 4;
  display: grid;
  grid-template-rows: subgrid;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid #e5e7eb;
}

.product-image  { aspect-ratio: 4/3; object-fit: cover; width: 100%; }
.product-title  { padding: 1rem 1rem 0; font-weight: 600; }
.product-desc   { padding: 0.5rem 1rem; font-size: 0.875rem; color: #6b7280; }
.product-footer { padding: 1rem; display: flex; justify-content: space-between; align-items: center; }
        `}</Code>
            <H3>Form Layout</H3>
            <Code file="form-subgrid.css">{`
/* Form dengan label dan input ter-align */
.form-grid {
  display: grid;
  grid-template-columns: max-content 1fr;  /* [label] [input] */
  gap: 0.75rem 1rem;
  align-items: center;
}

/* Field group (label + input + error) */
.field-group {
  display: contents;  /* children langsung masuk ke grid parent */
  /* ATAU gunakan subgrid: */
}

.field-group-subgrid {
  grid-column: span 2;
  display: grid;
  grid-template-columns: subgrid;  /* ikut 2 kolom parent */
  gap: inherit;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: right;
  color: #374151;
}

.field-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  width: 100%;
}

/* Error message di bawah input — tetap dalam grid */
.field-error {
  grid-column: 2;  /* hanya di kolom input */
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: -0.5rem;
}
        `}</Code>
            <H3>Data Table</H3>
            <Code file="table-subgrid.css">{`
/* Table-like layout dengan subgrid */
.data-table {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;  /* nama | harga | stok | kategori | aksi */
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* Header row */
.table-header {
  display: contents;
}

.table-header > * {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

/* Setiap baris */
.table-row {
  display: contents;  /* atau subgrid */
}

.table-row > * {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #f3f4f6;
  align-self: center;
}

/* Zebra stripes dengan :nth-child — tricky dengan display: contents */
/* Gunakan CSS @layer atau custom property untuk workaround */
        `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>Subgrid di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <P>Tailwind CSS v4 mendukung <IC>subgrid</IC> sebagai nilai grid template. Gunakan <IC>grid-rows-subgrid</IC> dan <IC>grid-cols-subgrid</IC> untuk mengaktifkan subgrid.</P>
            <Code file="tw-subgrid.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Parent grid — definisikan track dan baris */
const CardGrid = tw.div({
  base: "grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-6",
  // Definisikan rows untuk header | body | footer | cta
  // Tailwind v4: grid-rows-[auto_1fr_auto_auto]
})

/* Card yang pakai subgrid */
const ProductCard = tw.article({
  base: [
    "row-span-4",          // span 4 baris di parent
    "grid",
    "grid-rows-subgrid",   // ikut track baris parent
    "rounded-xl border border-gray-200 overflow-hidden",
  ].join(" "),
})

/* Dengan tw object config + sub-components */
const Card = tw.div({
  base: "row-span-3 grid grid-rows-subgrid rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] overflow-hidden",
  sub: {
    header: "px-4 py-3 font-semibold bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]",
    body: "px-4 py-3 text-sm text-[color-mix(in_srgb,var(--foreground)_70%,transparent)]",
    footer: "px-4 py-2 text-xs border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]",
  },
})

/* Penggunaan */
function ProductList() {
  return (
    <CardGrid>
      {/* Row template: auto 1fr auto */}
      <Card>
        <Card.header>Produk A</Card.header>
        <Card.body>Deskripsi singkat produk A yang mungkin berbeda panjangnya.</Card.body>
        <Card.footer>Rp 150.000</Card.footer>
      </Card>
      <Card>
        <Card.header>Produk B dengan Nama Lebih Panjang</Card.header>
        <Card.body>Deskripsi.</Card.body>
        <Card.footer>Rp 75.000</Card.footer>
      </Card>
    </CardGrid>
  )
}
        `}</Code>
            <Callout type="tip">
              <Callout.icon>✨</Callout.icon>
              <Callout.content>
                <Callout.title>grid-rows-subgrid di Tailwind v4</Callout.title>
                Tailwind v4 menambahkan utilitas <IC>grid-rows-subgrid</IC> dan <IC>grid-cols-subgrid</IC>. Untuk Tailwind v3, gunakan arbitrary value: <IC>[grid-template-rows:subgrid]</IC>.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Card grid dengan subgrid</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat grid 3 kolom berisi product card. Setiap card punya gambar, judul, deskripsi, dan tombol CTA. Gunakan subgrid agar semua CTA selalu sejajar di bagian bawah meski konten berbeda panjang.</p>
                <p>Hint: <IC>grid-template-rows: auto 1fr auto</IC> di parent, <IC>grid-row: span 3; grid-template-rows: subgrid</IC> di card.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Form layout dengan subgrid</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat form login dengan label kiri dan input kanan yang rata menggunakan <IC>grid-template-columns: max-content 1fr</IC>. Tambahkan pesan error di bawah input menggunakan <IC>display: contents</IC> atau subgrid.</p>
                <p>Pastikan field email, password, dan checkbox "ingat saya" semua ter-align dengan rapi.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Data table dengan subgrid</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat tabel data sederhana (nama, harga, stok, kategori) menggunakan <IC>display: grid</IC> + subgrid. Header dan body harus ter-align ke kolom yang sama. Tambahkan hover state dan zebra stripes.</p>
                <p>Bonus: buat kolom terakhir berisi tombol aksi (Edit, Hapus) yang selalu rata kanan.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/advandced/anchor-positioning" dir="prev"><NavBtn.hint>← Sebelumnya</NavBtn.hint><NavBtn.label>Anchor Positioning</NavBtn.label></NavBtn>
            <NavBtn href="/learn/advandced/container-style-queries" dir="next"><NavBtn.hint>Selanjutnya →</NavBtn.hint><NavBtn.label>Container & Style Queries</NavBtn.label></NavBtn>
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
