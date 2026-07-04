/**
 * Mentor — Debugging CSS
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    CheckList, DebugStep, TipCard,
} from "../styles"

const TOC = [
    { id: "mindset", label: "Mindset Debugging" },
    { id: "proses", label: "Proses Sistematis" },
    { id: "isolation", label: "Isolation Technique" },
    { id: "devtools", label: "DevTools untuk Debug" },
    { id: "common-bugs", label: "Bug CSS Paling Umum" },
    { id: "specificity-debug", label: "Debug Specificity" },
    { id: "layout-debug", label: "Debug Layout" },
    { id: "responsive-debug", label: "Debug Responsive" },
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

export default function DebuggingCssPage() {
    const [activeSection, setActiveSection] = useState("mindset")

    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/mentor">Mentor</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Debugging CSS</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>

            <Body>
                <Content>
                    <PageTitle>Debugging CSS</PageTitle>
                    <PageDesc>Strategi sistematis untuk menemukan dan memperbaiki bug CSS — dari proses berpikir, teknik isolasi, DevTools yang efektif, sampai solusi bug-bug yang paling sering ditemui.</PageDesc>

                    <Section id="mindset" onClick={() => setActiveSection("mindset")}>
                        <H2>Mindset Debugging<H2.anchor href="#mindset">#</H2.anchor></H2>
                        <P>Bug CSS hampir selalu memiliki penjelasan logis. Sebelum mulai menambah CSS secara acak, luangkan waktu untuk memahami apa yang sebenarnya terjadi. Penambahan CSS acak seringkali membuat masalah lebih kompleks, bukan lebih sederhana.</P>

                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Anti-pattern yang harus dihindari</Callout.title>
                                Menambah <IC>!important</IC>, <IC>z-index: 9999</IC>, atau <IC>position: relative</IC> secara acak tanpa memahami mengapa — ini adalah tanda debugging yang tidak sistematis dan menciptakan technical debt.
                            </Callout.content>
                        </Callout>

                        <TipCard accent="violet">
                            <TipCard.title>🔍 Observe first, fix second</TipCard.title>
                            <TipCard.body>Sebelum mengubah apapun, pastikan kamu benar-benar mengerti apa yang terjadi. Buka DevTools, inspect elemen, baca computed styles, lihat box model. 70% bug CSS bisa di-diagnose hanya dengan melihat — bukan dengan menebak.</TipCard.body>
                        </TipCard>
                    </Section>
                    <Divider />

                    <Section id="proses" onClick={() => setActiveSection("proses")}>
                        <H2>Proses Sistematis<H2.anchor href="#proses">#</H2.anchor></H2>
                        <P>Ikuti langkah-langkah ini secara berurutan. Kebanyakan bug akan ditemukan di langkah 1–3.</P>

                        <DebugStep>
                            <DebugStep.num>1</DebugStep.num>
                            <DebugStep.content>
                                <DebugStep.title>Reproduce bug dengan pasti</DebugStep.title>
                                <DebugStep.desc>Definisikan secara spesifik: "Di Chrome di viewport 768px, card ketiga dalam grid tidak rata dengan dua card pertama." Bukan hanya "layout rusak".</DebugStep.desc>
                            </DebugStep.content>
                        </DebugStep>

                        <DebugStep>
                            <DebugStep.num>2</DebugStep.num>
                            <DebugStep.content>
                                <DebugStep.title>Inspect elemen di DevTools</DebugStep.title>
                                <DebugStep.desc>Buka Styles panel. Lihat computed values. Perhatikan rules yang di-strikethrough (di-override). Cek box model visualizer untuk margin/padding yang tidak terduga.</DebugStep.desc>
                            </DebugStep.content>
                        </DebugStep>

                        <DebugStep>
                            <DebugStep.num>3</DebugStep.num>
                            <DebugStep.content>
                                <DebugStep.title>Cek parent container</DebugStep.title>
                                <DebugStep.desc>Banyak bug berasal dari parent, bukan dari elemen itu sendiri. Cek: display, overflow, position, transform, akan-change pada semua ancestors.</DebugStep.desc>
                            </DebugStep.content>
                        </DebugStep>

                        <DebugStep>
                            <DebugStep.num>4</DebugStep.num>
                            <DebugStep.content>
                                <DebugStep.title>Isolate masalah</DebugStep.title>
                                <DebugStep.desc>Buat reproduction kecil di CodePen atau file baru dengan markup minimal. Hapus CSS yang tidak berhubungan satu per satu sampai hanya tersisa bagian yang bermasalah.</DebugStep.desc>
                            </DebugStep.content>
                        </DebugStep>

                        <DebugStep>
                            <DebugStep.num>5</DebugStep.num>
                            <DebugStep.content>
                                <DebugStep.title>Cari dokumentasi, bukan stack overflow</DebugStep.title>
                                <DebugStep.desc>Buka MDN untuk property yang bermasalah. Baca "Applies to", "Inherited", dan "Formal definition". Seringkali bug berasal dari asumsi yang salah tentang bagaimana property bekerja.</DebugStep.desc>
                            </DebugStep.content>
                        </DebugStep>

                        <DebugStep>
                            <DebugStep.num>6</DebugStep.num>
                            <DebugStep.content>
                                <DebugStep.title>Eksperimen di DevTools, bukan di file</DebugStep.title>
                                <DebugStep.desc>Coba solusi di Styles panel DevTools dulu. Jika berhasil, baru copy ke file. Jika tidak berhasil, undo dan coba pendekatan lain. Ini jauh lebih cepat dari edit-save-reload berulang.</DebugStep.desc>
                            </DebugStep.content>
                        </DebugStep>
                    </Section>
                    <Divider />

                    <Section id="isolation" onClick={() => setActiveSection("isolation")}>
                        <H2>Isolation Technique<H2.anchor href="#isolation">#</H2.anchor></H2>
                        <P>Teknik paling powerful dalam debugging CSS adalah isolasi. Semakin kecil reproduction case, semakin mudah menemukan root cause.</P>

                        <H3>The outline trick</H3>
                        <Code file="debug-outline.css">{`
/* Tambah sementara untuk visualisasi layout */
* { outline: 1px solid red; }

/* Atau lebih spesifik per elemen */
.container { outline: 2px solid blue; }
.container > * { outline: 1px dashed green; }

/* Gunakan background untuk lihat "actual space" */
.mystery-element { background: rgba(255, 0, 0, 0.1); }

/* Jangan pakai border! — border mengubah box size */
/* Outline tidak mempengaruhi layout (tidak ada space) */
                        `}</Code>

                        <H3>Binary search untuk CSS</H3>
                        <Code file="binary-search.txt">{`
Jika CSS file besar dan kamu tidak tahu CSS mana yang menyebabkan bug:

1. Comment out setengah CSS file
2. Bug masih ada? → masalah ada di setengah yang tidak di-comment
   Bug hilang? → masalah ada di setengah yang di-comment

3. Ulangi pada setengah yang bermasalah
4. Lanjutkan sampai kamu menemukan rule yang tepat

Ini lebih efisien dari membaca semua CSS line-by-line.
                        `}</Code>

                        <H3>Minimal reproduction</H3>
                        <Code file="minimal-repro.html">{`
<!-- Buat file baru dengan markup paling minimal -->
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Hanya CSS yang relevan */
    .container { display: flex; }
    .item { flex: 1; }
  </style>
</head>
<body>
  <!-- Hanya markup yang relevan -->
  <div class="container">
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>
  </div>
</body>
</html>

<!-- Jika bug tidak reproduce di sini → masalah ada di CSS lain -->
<!-- Jika bug reproduce → kamu punya minimal case yang mudah di-debug -->
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="devtools" onClick={() => setActiveSection("devtools")}>
                        <H2>DevTools untuk Debug<H2.anchor href="#devtools">#</H2.anchor></H2>

                        <H3>Workflow di Styles panel</H3>
                        <CheckList>
                            {[
                                "Lihat rules yang di-strikethrough → di-override oleh rule lain yang lebih spesifik",
                                "Hover pada rule → lihat source file dan line number",
                                "Klik nilai di Computed panel → highlight rule yang mendefinisikannya",
                                "Toggle checkbox di sebelah property → on/off tanpa hapus",
                                "Klik + icon di Styles panel → tambah CSS rule baru untuk elemen ini",
                                "Filter box di Computed panel → cari computed value property tertentu",
                            ].map(t => <CheckList.item key={t}><CheckList.icon>🔍</CheckList.icon><CheckList.text>{t}</CheckList.text></CheckList.item>)}
                        </CheckList>

                        <H3>Debug layout dengan Grid/Flex overlay</H3>
                        <Code file="devtools-layout.txt">{`
Grid overlay:
  → Elements panel → badge "grid" di sebelah display:grid element
  → Klik badge → muncul visual overlay di halaman
  → Settings: tampilkan track sizes, area names, line numbers

Flex overlay:
  → Elements panel → badge "flex" di sebelah display:flex element
  → Overlay menampilkan direction, wrap, spacing

Container queries overlay:
  → Elements panel → badge "cq" untuk container
  → Lihat ukuran container saat ini

Layout panel (Chrome):
  → DevTools → Layout tab (bukan Elements)
  → List semua grid dan flex containers di halaman
                        `}</Code>

                        <H3>Debug animasi</H3>
                        <Code file="devtools-animation.txt">{`
Animations panel (Chrome):
  → DevTools → ... → More tools → Animations
  → Record, play slow-motion (25%, 10%, 1%)
  → Scrub timeline dengan drag
  → Inspect individual @keyframes

Performance panel:
  → Record → interaksi → Stop
  → Lihat "Rendering" track: paint, layout, composite
  → Frame yang merah = dropped frame (jank)

Coverage tool:
  → DevTools → ... → More tools → Coverage
  → Record dan reload → lihat CSS yang tidak digunakan (warna merah)
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="common-bugs" onClick={() => setActiveSection("common-bugs")}>
                        <H2>Bug CSS Paling Umum<H2.anchor href="#common-bugs">#</H2.anchor></H2>

                        <H3>1. Elemen tidak bisa diklik (pointer-events)</H3>
                        <Code file="bug-pointer.css">{`
/* Gejala: elemen tidak merespons klik/hover */
/* Penyebab umum: */

/* A) Parent memiliki pointer-events: none */
.overlay { pointer-events: none; }
/* → semua children juga tidak bisa diklik */
.overlay .button { pointer-events: auto; } /* ← fix: re-enable di child */

/* B) Elemen pseudo atau absolute di atas elemen lain */
.card::after {
  content: "";
  position: absolute;
  inset: 0; /* memenuhi seluruh card */
  /* → menghalangi click event ke card konten */
}
/* Fix: tambahkan pointer-events: none pada pseudo */
.card::after { pointer-events: none; }

/* C) z-index — elemen di bawah elemen lain yang tidak terlihat */
.hidden-overlay { position: fixed; inset: 0; opacity: 0; z-index: 10; }
/* → cek dengan: outline semua position:fixed elements */
                        `}</Code>

                        <H3>2. Overflow hidden memotong box-shadow</H3>
                        <Code file="bug-overflow.css">{`
/* Gejala: box-shadow terpotong di sisi luar parent */
.container { overflow: hidden; }
.card { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
/* → shadow terpotong oleh overflow: hidden */

/* Fix A: tambah padding di container */
.container { overflow: hidden; padding: 12px; }

/* Fix B: gunakan filter: drop-shadow sebagai gantinya */
/* drop-shadow tidak terpotong oleh overflow */
.card { filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15)); }

/* Fix C: pakai outline sebagai box-shadow alternative */
.card { outline: 1px solid rgba(0,0,0,0.05); } /* tidak terpotong */
                        `}</Code>

                        <H3>3. Sticky tidak bekerja</H3>
                        <Code file="bug-sticky.css">{`
/* Gejala: position: sticky tidak menempel */
/* Penyebab 1: parent memiliki overflow selain visible */
.parent { overflow: hidden; } /* ← sticky tidak bekerja dalam ini */
/* Fix: ubah overflow atau gunakan overflow-clip-margin */

/* Penyebab 2: parent tidak punya height yang cukup */
/* sticky hanya bekerja selama ada "ruang untuk scroll" dalam parent */

/* Penyebab 3: lupa top/bottom value */
.header { position: sticky; } /* tidak ada effect tanpa offset */
.header { position: sticky; top: 0; } /* ← perlu ini */

/* Penyebab 4: parent flex/grid dengan align-stretch */
.grid-parent { display: grid; }
/* → sticky child akan stretch setinggi row */
/* Fix: */
.sticky-child { align-self: start; }
                        `}</Code>

                        <H3>4. Flex child tidak shrink</H3>
                        <Code file="bug-flex-shrink.css">{`
/* Gejala: flex child overflow parent, tidak mau mengecil */
.container { display: flex; }
.sidebar { width: 300px; }
.content { width: 800px; }
/* → total 1100px > container, tapi tidak shrink? */

/* Penyebab: flex-shrink: 1 adalah default, tapi ada min-size */
/* min-width: auto berarti elemen tidak bisa mengecil kurang dari content size */

/* Fix: set min-width: 0 pada flex children yang perlu shrink */
.content { min-width: 0; }

/* Atau pada text yang perlu truncate */
.text-truncate {
  min-width: 0;     /* ← kunci! */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
                        `}</Code>

                        <H3>5. Image tidak fill container</H3>
                        <Code file="bug-image.css">{`
/* Gejala: image overflow atau tidak mengikuti container */

/* Fix 1: object-fit untuk gambar dalam container fixed size */
.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;    /* crop tanpa stretch */
  object-position: top; /* fokus ke bagian atas (wajah) */
}

/* Fix 2: aspect-ratio untuk container responsif */
.image-container {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Fix 3: display: block menghilangkan baseline gap */
img { display: block; }
/* img inline memiliki gap di bawahnya karena baseline alignment */
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="specificity-debug" onClick={() => setActiveSection("specificity-debug")}>
                        <H2>Debug Specificity Conflict<H2.anchor href="#specificity-debug">#</H2.anchor></H2>

                        <H3>Diagnose dengan DevTools</H3>
                        <Code file="specificity-debug.txt">{`
Langkah:
1. Inspect elemen → Styles panel
2. Cari property yang bermasalah
3. Lihat semua rules yang mendefinisikan property itu
4. Rules dengan strikethrough = di-override

Baca specificity dari selector:
  .nav .item a:hover   → 0-3-1  (3 class/pseudo-class, 1 element)
  #sidebar .link       → 1-1-0  (1 id, 1 class)
  a.active             → 0-1-1  (1 class, 1 element)

Tools:
  → specificity.keegan.st — kalkulator specificity visual
  → developer.mozilla.org/en-US/docs/Web/CSS/Specificity

Fix tanpa !important:
  Naikan specificity selector yang harus menang:
    .btn { color: blue; }                → 0-1-0
    .card .btn { color: red; }           → 0-2-0 (menang)

  Atau turunkan yang harusnya kalah:
    :where(.nav) .item { color: blue; }  → 0-1-0 (where = 0 specificity)
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="layout-debug" onClick={() => setActiveSection("layout-debug")}>
                        <H2>Debug Layout Issues<H2.anchor href="#layout-debug">#</H2.anchor></H2>
                        <Code file="layout-debug.css">{`
/* Toolkit debug layout cepat */

/* 1. Visualisasi semua elemen */
* {
  outline: 1px solid hsla(200, 100%, 50%, 0.3);
}

/* 2. Highlight element dengan unexpected size */
* {
  background: rgba(0, 100, 255, 0.05) !important;
}

/* 3. Debug margin — warnai elemen untuk lihat batas */
.debug-margins * {
  outline: 1px solid red !important;
  margin: 0 !important;   /* remove semua margin untuk lihat layout asli */
}

/* 4. Debug overflow — find yang menyebabkan horizontal scroll */
* {
  max-width: 100%;
  word-break: break-word;
}
/* Kemudian buka DevTools → Performance → Layout → check Forced reflows */

/* 5. Debug stacking context */
.debug-stacking * {
  isolation: isolate;    /* buat stacking context baru per element */
  outline: 2px solid purple;
}

/* CSS debug utility yang bisa toggle via class */
.debug { outline: 2px solid red !important; }
.debug-grid { background: rgba(0, 0, 255, 0.05) !important; }
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="responsive-debug" onClick={() => setActiveSection("responsive-debug")}>
                        <H2>Debug Responsive Issues<H2.anchor href="#responsive-debug">#</H2.anchor></H2>
                        <Code file="responsive-debug.txt">{`
Checklist saat layout rusak di ukuran tertentu:

1. Buka DevTools → Responsive mode
   → Cek di ukuran standar: 320px, 375px, 768px, 1024px, 1280px
   → Drag dengan lambat — perhatikan titik tepat di mana layout "break"

2. Cari horizontal overflow
   → document.querySelectorAll('*')
     .forEach(el => {
       if (el.offsetWidth > document.documentElement.clientWidth) {
         el.style.outline = '2px solid red'
         console.log(el)
       }
     })
   → Copy ke DevTools Console

3. Periksa media query yang aktif
   → DevTools → Sources → Ctrl+F → search "@media"
   → Atau: Elements → Computed → filter "width" → lihat nilai aktual

4. Cek min-width dan max-width conflict
   → Elemen dengan min-width yang terlalu besar
   → Image atau video tanpa max-width: 100%

5. Cek font-size relatif
   → rem/em yang tidak terduga karena nested scaling
   → vw font-size yang terlalu besar di layar kecil
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Bug hunt</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat file HTML dengan sengaja memasukkan 5 bug berikut: (1) z-index tidak bekerja karena stacking context, (2) sticky header yang tidak menempel karena overflow:hidden di parent, (3) text tidak truncate karena tidak ada min-width:0, (4) image overflow container, (5) specificity conflict antara dua rules. Debug semuanya menggunakan DevTools tanpa edit file CSS.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Minimal reproduction</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Ambil proyek CSS yang kamu miliki (atau buat baru). Pilih salah satu komponen yang paling kompleks. Buat minimal reproduction di CodePen dengan hanya HTML dan CSS yang esensial — kurang dari 20 baris CSS dan 15 baris HTML. Proses ini melatih kemampuan mengidentifikasi apa yang esensial dan apa yang noise.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — Find the horizontal scroll</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buka website apapun di DevTools responsive mode. Buat viewport menjadi 320px. Jika ada horizontal scroll, gunakan script JavaScript di console untuk highlight semua elemen yang overflow. Identifikasi root cause dan tulis CSS fix-nya. Ini adalah skill debugging yang sangat berguna di dunia nyata.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/mentor/project-ideas" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Ide Proyek</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/mentor/resources" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Referensi & Resources</NavBtn.label></NavBtn>
                    </PageNav>
                </Content>

                <Toc>
                    <TocLabel>On this page</TocLabel>
                    {TOC.map(item => (
                        <TocItem key={item.id} href={`#${item.id}`} active={activeSection === item.id} onClick={() => setActiveSection(item.id)}>
                            {item.label}
                        </TocItem>
                    ))}
                </Toc>
            </Body>
        </Page>
    )
}
