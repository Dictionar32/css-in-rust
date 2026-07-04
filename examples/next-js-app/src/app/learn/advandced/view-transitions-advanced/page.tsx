/**
 * CSS Advanced — View Transitions Advanced
 */
"use client"
import { useState } from "react"
import {
  Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
  PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
  CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
  PlaygroundWrap, Chip, ChipRow, SupportBadge,
  TransitionBox, TransitionBtn, ModeButtonsRow, PageContent,
  PlaygroundTransitionBox, PlaygroundHeroSection, PlaygroundPageTitle, PlaygroundPageDesc, TransitionNavButtons,
  BadgeRow,
} from "./styles"

const TOC = [
  { id: "intro", label: "Review: Same-Document VT" },
  { id: "cross-document", label: "Cross-Document View Transitions" },
  { id: "at-view-transition", label: "@view-transition at-rule" },
  { id: "shared-element", label: "Shared Element Transitions" },
  { id: "vt-pseudo", label: "::view-transition-* pseudo-elements" },
  { id: "vt-name", label: "view-transition-name strategies" },
  { id: "next-js", label: "Next.js App Router Integration" },
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

type TransitionMode = "fade" | "slide" | "scale"

function ViewTransitionPlayground() {
  const [page, setPage] = useState<"A" | "B">("A")
  const [mode, setMode] = useState<TransitionMode>("fade")
  const [transitioning, setTransitioning] = useState(false)

  const modes: TransitionMode[] = ["fade", "slide", "scale"]

  const navigate = (target: "A" | "B") => {
    if (target === page || transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setPage(target)
      setTransitioning(false)
    }, 300)
  }

  return (
    <PlaygroundWrap>
      <PlaygroundWrap.controls>
        <PlaygroundWrap.label>🎬 View Transition Playground</PlaygroundWrap.label>
        <ChipRow>
          {modes.map(m => (
            <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
              {m}
            </Chip>
          ))}
        </ChipRow>
        <TransitionNavButtons>
          <TransitionBtn onClick={() => navigate("A")} disabled={page === "A"}>
            Halaman A
          </TransitionBtn>
          <TransitionBtn onClick={() => navigate("B")} disabled={page === "B"}>
            Halaman B
          </TransitionBtn>
        </TransitionNavButtons>
      </PlaygroundWrap.controls>
      <PlaygroundWrap.canvas>
        <PlaygroundTransitionBox visible={!transitioning} transitioning={transitioning}>
          {page === "A" ? (
            <>
              <PlaygroundHeroSection page="a">
                🏠
              </PlaygroundHeroSection>
              <PlaygroundPageTitle>Halaman A — Home</PlaygroundPageTitle>
              <PlaygroundPageDesc>
                Ini konten halaman A. Klik "Halaman B" untuk transisi.
              </PlaygroundPageDesc>
            </>
          ) : (
            <>
              <PlaygroundHeroSection page="b">
                📄
              </PlaygroundHeroSection>
              <PlaygroundPageTitle>Halaman B — Detail</PlaygroundPageTitle>
              <PlaygroundPageDesc>
                Ini konten halaman B. Hero image "terbang" dari halaman A.
              </PlaygroundPageDesc>
            </>
          )}
        </PlaygroundTransitionBox>
      </PlaygroundWrap.canvas>
      <PlaygroundWrap.codeline>
        {mode === "fade"
          ? "document.startViewTransition(() => router.push(url))  // default: cross-fade"
          : mode === "slide"
            ? "::view-transition-new(root) { animation: slide-from-right 300ms; }"
            : "::view-transition-new(root) { animation: scale-in 300ms ease-out; }"}
      </PlaygroundWrap.codeline>
    </PlaygroundWrap>
  )
}

export default function ViewTransitionsAdvancedPage() {
  const [activeSection, setActiveSection] = useState("intro")
  return (
    <Page>
      <TopBar><TopBarInner>
        <Breadcrumb>
          <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.link href="/learn/advandced">Advanced</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
          <Breadcrumb.curr>View Transitions Advanced</Breadcrumb.curr>
        </Breadcrumb>
      </TopBarInner></TopBar>
      <Body>
        <Content>
          <PageTitle>View Transitions Advanced</PageTitle>
          <PageDesc>Cross-document transitions untuk MPA, shared element transitions yang "terbang" antar halaman, dan integrasi dengan Next.js App Router. Level lanjut dari View Transitions API.</PageDesc>

          <Section id="intro" onClick={() => setActiveSection("intro")}>
            <H2>Review: Same-Document View Transitions<H2.anchor href="#intro">#</H2.anchor></H2>
            <P>Same-document view transitions (VT) menggunakan <IC>document.startViewTransition()</IC> untuk animasi saat konten berubah dalam satu halaman. Ini adalah dasar yang sudah dibahas — halaman ini fokus pada fitur lanjutan: cross-document dan shared elements.</P>
            <Code file="same-doc-review.js">{`
// Same-document VT — review singkat
document.startViewTransition(async () => {
  // Mutasi DOM di sini — bisa sync atau async
  updateDOM()
  await fetchAndRender()
})

// Dengan named element — elemen "pakai" view-transition-name
// sehingga bisa dianimasikan terpisah dari root
document.querySelector('.hero').style.viewTransitionName = 'hero'

// CSS untuk animasi custom
::view-transition-old(hero) {
  animation: fade-out 200ms ease;
}
::view-transition-new(hero) {
  animation: fade-in 200ms ease;
}
        `}</Code>
            <BadgeRow>
              <SupportBadge status="supported">✅ Chrome 111+</SupportBadge>
              <SupportBadge status="supported">✅ Edge 111+</SupportBadge>
              <SupportBadge status="supported">✅ Safari 18+</SupportBadge>
              <SupportBadge status="partial">🔶 Firefox (partial)</SupportBadge>
            </BadgeRow>
            <ViewTransitionPlayground />
          </Section>
          <Divider />

          <Section id="cross-document" onClick={() => setActiveSection("cross-document")}>
            <H2>Cross-Document View Transitions<H2.anchor href="#cross-document">#</H2.anchor></H2>
            <P>Cross-document VT menganimasikan transisi antar halaman berbeda (MPA) — tanpa JavaScript! Cukup tambahkan <IC>@view-transition</IC> at-rule di CSS kedua halaman.</P>
            <Code file="cross-document.css">{`
/* cross-document.css */
/* Enable untuk semua navigasi MPA */
@view-transition {
  navigation: auto;
}

/* Atau conditional — hanya same-origin */
@view-transition {
  navigation: auto;
  types: slide, fade;
}

/* Customize berdasarkan tipe transisi */
@keyframes slide-from-right {
  from { transform: translateX(100%); }
}
@keyframes slide-to-left {
  to { transform: translateX(-100%); }
}

:root:active-view-transition-type(slide) {
  &::view-transition-old(root) {
    animation: slide-to-left 400ms ease-in;
  }
  &::view-transition-new(root) {
    animation: slide-from-right 400ms ease-out;
  }
}

/* Shared element — elemen "terbang" antar halaman */
.hero-image {
  view-transition-name: hero-img;  /* nama unik per halaman */
}

/* Halaman A */
.product-card img { view-transition-name: product-img; }

/* Halaman B (detail) */
.detail-hero img { view-transition-name: product-img; }
/* Browser otomatis animasikan dari posisi A ke posisi B */
        `}</Code>
            <Callout type="warning">
              <Callout.icon>⚠️</Callout.icon>
              <Callout.content>
                <Callout.title>Cross-document VT memerlukan same-origin</Callout.title>
                Cross-document view transitions hanya bekerja antara halaman yang same-origin. Tidak bisa digunakan untuk navigasi ke domain berbeda.
              </Callout.content>
            </Callout>
          </Section>
          <Divider />

          <Section id="at-view-transition" onClick={() => setActiveSection("at-view-transition")}>
            <H2>@view-transition at-rule<H2.anchor href="#at-view-transition">#</H2.anchor></H2>
            <P>At-rule <IC>@view-transition</IC> mengaktifkan cross-document transitions. Harus ada di kedua halaman (halaman lama dan baru) agar transisi berjalan.</P>
            <Code file="at-view-transition.css">{`
/* @view-transition — aktifkan di SEMUA halaman yang ikut transisi */

/* Minimal: aktifkan dengan navigation: auto */
@view-transition {
  navigation: auto;
}

/* Dengan tipe kustom untuk styling kondisional */
@view-transition {
  navigation: auto;
  types: fade;  /* akan di-set sebagai active-view-transition-type */
}

/* Kontrol di JavaScript — set tipe per-navigasi */
window.addEventListener('pageswap', (e) => {
  if (e.viewTransition) {
    const url = new URL(e.activation.entry.url)
    if (url.pathname.startsWith('/product/')) {
      e.viewTransition.types.add('product-detail')
    }
  }
})

/* Styling berdasarkan tipe */
:root:active-view-transition-type(product-detail) {
  &::view-transition-old(root) {
    animation: zoom-out 300ms ease;
  }
  &::view-transition-new(root) {
    animation: zoom-in 300ms ease;
  }
}

@keyframes zoom-out { to { scale: 0.95; opacity: 0; } }
@keyframes zoom-in  { from { scale: 1.02; opacity: 0; } }

/* pagereveal event — sisi halaman baru */
window.addEventListener('pagereveal', (e) => {
  if (e.viewTransition) {
    // Tersedia di halaman baru saat transisi masuk
    const vt = e.viewTransition
    vt.types.add('entering')
  }
})
        `}</Code>
          </Section>
          <Divider />

          <Section id="shared-element" onClick={() => setActiveSection("shared-element")}>
            <H2>Shared Element Transitions<H2.anchor href="#shared-element">#</H2.anchor></H2>
            <P>Elemen dengan <IC>view-transition-name</IC> yang sama di halaman A dan B akan "terbang" dari posisi lama ke posisi baru — browser menginterpolasi posisi, ukuran, dan bentuknya secara otomatis.</P>
            <Code file="shared-element.css">{`
/* Halaman daftar produk (list.html) */
.product-card { container-type: inline-size; }

.product-card img {
  /* Nama unik per produk — biasanya pakai ID */
  view-transition-name: product-img-123;
}

.product-card h2 {
  view-transition-name: product-title-123;
}

/* Halaman detail produk (detail.html) */
.hero-img {
  view-transition-name: product-img-123;  /* nama SAMA */
}

.page-title {
  view-transition-name: product-title-123;  /* nama SAMA */
}

/* Browser otomatis animasikan dari thumbnail → hero,
   dan dari card title → page title */

/* Hati-hati: view-transition-name harus unik per halaman */
/* Jika ada duplicate names, transisi akan error/fallback */

/* Untuk list banyak item — generate via CSS counter atau JavaScript */
.product-card:nth-child(1) img { view-transition-name: product-img-1; }
.product-card:nth-child(2) img { view-transition-name: product-img-2; }
/* ... atau via inline style di framework */

/* React/Next.js pattern */
// style={{ viewTransitionName: \`product-\${id}\` }}

/* Custom animasi untuk shared element */
::view-transition-group(product-img-123) {
  animation-duration: 400ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="vt-pseudo" onClick={() => setActiveSection("vt-pseudo")}>
            <H2>::view-transition-* pseudo-elements<H2.anchor href="#vt-pseudo">#</H2.anchor></H2>
            <P>View Transitions membuat pseudo-element tree di <IC>::view-transition</IC>. Setiap named element punya grup dengan old/new snapshot.</P>
            <Code file="vt-pseudos.css">{`
/* Hierarki pseudo-elements: */
::view-transition
  └── ::view-transition-group(root)         /* wrapper per nama */
      └── ::view-transition-image-pair(root)
          ├── ::view-transition-old(root)    /* snapshot halaman lama */
          └── ::view-transition-new(root)    /* snapshot halaman baru */

/* Customize animasi untuk named elements */
::view-transition-old(hero) {
  animation: 300ms ease-out both fade-out;
}

::view-transition-new(hero) {
  animation: 300ms ease-in both fade-in;
}

/* Disable animasi untuk elemen tertentu */
::view-transition-group(header) {
  animation-duration: 0s;
}

/* Koordinasi timing */
::view-transition-old(root) {
  animation: 200ms ease both slide-out;
}

::view-transition-new(root) {
  animation: 200ms 150ms ease both slide-in;  /* delay 150ms */
}

/* Reduce motion */
@media (prefers-reduced-motion) {
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="vt-name" onClick={() => setActiveSection("vt-name")}>
            <H2>view-transition-name strategies<H2.anchor href="#vt-name">#</H2.anchor></H2>
            <P>Penamaan yang tepat sangat penting. Nama harus unik per halaman dan konsisten antar halaman yang ingin dishare.</P>
            <Code file="vt-naming.css">{`
/* STRATEGI 1: Static names — untuk elemen layout tetap */
.site-header  { view-transition-name: site-header; }
.site-footer  { view-transition-name: site-footer; }
.page-sidebar { view-transition-name: sidebar; }

/* STRATEGI 2: ID-based — untuk list items */
/* CSS: tidak bisa dinamis, gunakan style attribute */
/* HTML: <img style="view-transition-name: product-42" /> */

/* React/Next.js: */
// <img style={{ viewTransitionName: \`product-\${product.id}\` }} />

/* STRATEGI 3: CSS custom property — lebih fleksibel */
.card { view-transition-name: var(--vt-name); }
/* Set di parent: style="--vt-name: card-123" */

/* STRATEGI 4: contain isolation */
.isolated-section {
  view-transition-name: none;  /* exclude dari VT */
}

/* GOTCHA: Nama 'none' = tidak berpartisipasi */
.no-transition { view-transition-name: none; }

/* GOTCHA: Duplicate names pada halaman yang SAMA = error */
/* Tapi nama yang sama di HALAMAN BERBEDA = shared element ✓ */
        `}</Code>
          </Section>
          <Divider />

          <Section id="next-js" onClick={() => setActiveSection("next-js")}>
            <H2>Next.js App Router Integration<H2.anchor href="#next-js">#</H2.anchor></H2>
            <P>Next.js App Router menggunakan client-side navigation — bukan MPA full reload. Untuk view transitions, gunakan <IC>document.startViewTransition()</IC> di sekitar <IC>router.push()</IC>.</P>
            <Code file="nextjs-vt.tsx">{`
/* nextjs-vt.tsx */
/* Next.js App Router — experimental ViewTransition */
'use client'
import { unstable_ViewTransition as ViewTransition } from 'react'
import { useRouter } from 'next/navigation'

// Wrap transisi dalam ViewTransition
function navigateWithTransition(url: string) {
  document.startViewTransition(() => {
    router.push(url)
  })
}

// Atau menggunakan komponen ViewTransition (React 19+)
export function TransitionLink({ href, children }) {
  return (
    <ViewTransition>
      <a href={href}>{children}</a>
    </ViewTransition>
  )
}
        `}</Code>
            <Code file="link-with-vt.tsx">{`
// Custom Link komponen dengan View Transition
'use client'
import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

interface VTLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function VTLink({ href, children, className }: VTLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (!document.startViewTransition) {
      // Fallback untuk browser tanpa VT support
      router.push(href)
      return
    }

    document.startViewTransition(() => {
      // React 18: startTransition untuk sync dengan React rendering
      startTransition(() => {
        router.push(href)
      })
    })
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}

// Penggunaan di layout:
// <VTLink href="/products/42">Lihat Detail</VTLink>

// Di page produk — set view-transition-name untuk shared element
// <Image
//   src={product.image}
//   style={{ viewTransitionName: \`product-\${product.id}\` }}
// />
        `}</Code>
          </Section>
          <Divider />

          <Section id="tw-usage" onClick={() => setActiveSection("tw-usage")}>
            <H2>View Transitions di tailwind-styled-v4<H2.anchor href="#tw-usage">#</H2.anchor></H2>
            <Code file="tw-vt.tsx">{`
import { tw } from "tailwind-styled-v4"

/* Komponen dengan view-transition-name via arbitrary CSS */
const HeroImage = tw.img({
  base: [
    "w-full aspect-video object-cover rounded-xl",
    "[view-transition-name:hero-image]",  /* named shared element */
  ].join(" "),
})

/* Untuk ID-based names, gunakan inline style di React */
const ProductThumbnail = tw.img({
  base: "rounded-lg object-cover",
  // view-transition-name set via style prop di component
})

/* Layout yang di-exclude dari VT */
const StaticHeader = tw.header({
  base: "sticky top-0 z-50 [view-transition-name:site-header]",
})

/* Animasi custom di global CSS */
/* tailwind.css */
/*
::view-transition-old(hero-image) {
  animation: scale-down 300ms ease-out;
}

::view-transition-new(hero-image) {
  animation: scale-up 300ms ease-out;
}

@keyframes scale-down { to { scale: 0.95; opacity: 0; } }
@keyframes scale-up   { from { scale: 1.05; opacity: 0; } }
*/

/* Penggunaan */
function ProductCard({ product }: { product: { id: string; image: string; title: string } }) {
  return (
    <article>
      <ProductThumbnail
        src={product.image}
        alt={product.title}
        style={{ viewTransitionName: \`product-\${product.id}\` }}
      />
    </article>
  )
}
        `}</Code>
          </Section>
          <Divider />

          <Section id="exercise" onClick={() => setActiveSection("exercise")}>
            <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Slide navigation di SPA</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat navigasi multi-halaman simulasi dengan <IC>document.startViewTransition()</IC>. Animasi slide: halaman baru masuk dari kanan, halaman lama keluar ke kiri. Deteksi arah navigasi (maju/mundur) dan flip animasi sesuai arah.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Shared element list → detail</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat halaman list produk dan halaman detail. Saat klik produk, thumbnail "terbang" ke posisi hero di halaman detail menggunakan shared element transition (<IC>view-transition-name</IC> dengan ID produk).</p>
                <p>Gunakan <IC>VTLink</IC> component + <IC>startViewTransition()</IC> di Next.js.</p>
              </ExerciseCard.body>
            </ExerciseCard>
            <ExerciseCard>
              <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — MPA dengan cross-document VT</ExerciseCard.title></ExerciseCard.header>
              <ExerciseCard.body>
                <p>Buat dua halaman HTML statis dengan <IC>@view-transition &#123; navigation: auto &#125;</IC>. Tambahkan shared element (gambar hero) di kedua halaman. Navigasikan antar halaman dan lihat transisi terjadi tanpa JavaScript sama sekali.</p>
              </ExerciseCard.body>
            </ExerciseCard>
          </Section>

          <PageNav>
            <NavBtn href="/learn/advandced/popover-api" dir="prev"><NavBtn.hint>← Sebelumnya</NavBtn.hint><NavBtn.label>Popover API</NavBtn.label></NavBtn>
            <NavBtn href="/learn/advandced/css-functions-future" dir="next"><NavBtn.hint>Selanjutnya →</NavBtn.hint><NavBtn.label>CSS Functions & The Future</NavBtn.label></NavBtn>
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
