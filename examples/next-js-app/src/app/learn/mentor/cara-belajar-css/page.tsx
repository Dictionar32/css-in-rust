/**
 * Mentor — Cara Belajar CSS Efektif
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    CheckList, TipCard,
} from "../styles"

const TOC = [
    { id: "mental-model", label: "Mental Model yang Benar" },
    { id: "cascade", label: "Paham Cascade & Inheritance" },
    { id: "kebiasaan", label: "Kebiasaan Belajar Efektif" },
    { id: "devtools", label: "Kuasai DevTools" },
    { id: "baca-docs", label: "Cara Baca MDN" },
    { id: "jebakan", label: "Jebakan Umum Pemula" },
    { id: "mindset", label: "Mindset yang Benar" },
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

export default function CaraBelajarCssPage() {
    const [activeSection, setActiveSection] = useState("mental-model")

    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/mentor">Mentor</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Cara Belajar CSS</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>

            <Body>
                <Content>
                    <PageTitle>Cara Belajar CSS Efektif</PageTitle>
                    <PageDesc>Mental model yang benar, kebiasaan yang produktif, cara membaca dokumentasi, dan jebakan yang harus dihindari — semua yang tidak diajarkan tutorial biasa.</PageDesc>

                    <Section id="mental-model" onClick={() => setActiveSection("mental-model")}>
                        <H2>Mental Model yang Benar<H2.anchor href="#mental-model">#</H2.anchor></H2>
                        <P>Kebanyakan frustasi dengan CSS berasal dari mental model yang salah. CSS bukan kumpulan trik acak — ada sistem yang konsisten di baliknya. Begitu kamu paham sistemnya, perilaku CSS yang sebelumnya "aneh" akan mulai masuk akal.</P>

                        <H3>CSS adalah sistem aturan berlapis</H3>
                        <P>Browser membaca CSS dalam lapisan: origin, specificity, dan order. Setiap property pada setiap elemen ditentukan oleh algoritma cascade yang deterministik. Tidak ada "magic" — hanya aturan yang belum kamu ketahui.</P>

                        <Code file="mental-model.css">{`
/* Pikirkan CSS seperti ini: */

/* 1. Setiap elemen memiliki "computed value" untuk setiap property */
/* 2. Computed value ditentukan oleh cascade */
/* 3. Cascade mempertimbangkan: origin > specificity > order */

/* Contoh: kenapa warna ini tidak berubah? */
.card p { color: blue; }   /* specificity: 0-1-1 */
p { color: red; }          /* specificity: 0-0-1 */
/* .card p menang karena specificity lebih tinggi, bukan karena urutan */

/* Mental model benar: "Siapa yang paling spesifik?" */
/* Mental model salah: "Yang terakhir ditulis yang menang" */
                        `}</Code>

                        <H3>Layout adalah tentang konteks</H3>
                        <P>Banyak property CSS hanya bekerja dalam <IC>formatting context</IC> tertentu. <IC>align-items</IC> tidak bekerja di luar flex/grid container. <IC>z-index</IC> hanya bekerja pada positioned elements. <IC>top/left</IC> hanya berlaku jika position bukan <IC>static</IC>.</P>

                        <Code file="context.css">{`
/* ❌ Kenapa align-items tidak bekerja? */
.container { align-items: center; }   /* tidak ada effect */

/* ✅ Karena perlu formatting context yang tepat */
.container {
  display: flex;          /* atau grid */
  align-items: center;    /* sekarang bekerja */
}

/* ❌ Kenapa z-index tidak bekerja? */
.overlay { z-index: 999; }   /* tidak ada effect */

/* ✅ Karena perlu positioned element */
.overlay {
  position: relative;   /* atau absolute/fixed/sticky */
  z-index: 999;         /* sekarang bekerja */
}
                        `}</Code>

                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <Callout.title>Pertanyaan yang benar</Callout.title>
                                Saat CSS tidak bekerja, jangan tanya "kenapa tidak bisa?" tapi tanya "formatting context apa yang aktif? siapa yang lebih spesifik? apakah property ini inherited?"
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="cascade" onClick={() => setActiveSection("cascade")}>
                        <H2>Paham Cascade & Inheritance<H2.anchor href="#cascade">#</H2.anchor></H2>
                        <P>Dua konsep ini adalah inti dari "CSS" itu sendiri (Cascading Style Sheets). Memahaminya dengan benar akan mengubah cara kamu menulis dan debug CSS selamanya.</P>

                        <H3>Cascade: urutan prioritas</H3>
                        <Code file="cascade.css">{`
/* Urutan prioritas cascade (dari tertinggi ke terendah): */
/* (modern CSS dengan @layer dipertimbangkan) */

/* 1. Transitions (highest) */
/* 2. !important user agent styles */
/* 3. !important user styles */
/* 4. !important author styles  ← hindari ini */
/* 5. @layer author styles (layer terakhir = tertinggi) */
/* 6. Unlayered author styles */
/* 7. User styles */
/* 8. Browser default styles */

/* Dalam author styles (tanpa !important), urutan ditentukan oleh: */
/* a) @layer order (jika pakai @layer) */
/* b) Specificity (0-0-0 sampai 1-0-0) */
/* c) Order (jika specificity sama, yang terakhir menang) */

/* Specificity dihitung sebagai (a-b-c): */
/* a = jumlah ID selectors (#id) */
/* b = jumlah class, attr, pseudo-class selectors */
/* c = jumlah element, pseudo-element selectors */

#nav .item a:hover   /* 1-2-1 */
.nav-item a          /* 0-1-1 */
a                    /* 0-0-1 */

/* @layer — kontrol cascade tanpa naikkan specificity */
@layer base, components, utilities;
@layer base      { a { color: blue; }   }  /* layered — prioritas rendah */
@layer utilities { .text-red { color: red; } }  /* layer terakhir = menang */
                        `}</Code>

                        <H3>Inheritance: property yang mengalir ke bawah</H3>
                        <Code file="inheritance.css">{`
/* Tidak semua property di-inherit! */

/* Inherited by default (umumnya text-related): */
color, font-*, line-height, text-align, visibility,
cursor, list-style-*, letter-spacing, word-spacing

/* NOT inherited by default (umumnya box-related): */
margin, padding, border, background, width, height,
position, display, overflow, z-index

/* Force inherit atau reset: */
.child {
  color: inherit;       /* paksa inherit dari parent */
  margin: initial;      /* reset ke browser default */
  padding: unset;       /* hapus semua — inherited: inherit, non-inherited: initial */
  border: revert;       /* kembalikan ke browser default (ignoring author styles) */
}

/* 'currentColor' memanfaatkan inheritance */
.button {
  color: blue;
  border: 1px solid currentColor;  /* border ikut warna text */
  fill: currentColor;               /* SVG di dalamnya juga ikut */
}
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="kebiasaan" onClick={() => setActiveSection("kebiasaan")}>
                        <H2>Kebiasaan Belajar Efektif<H2.anchor href="#kebiasaan">#</H2.anchor></H2>

                        <TipCard accent="violet">
                            <TipCard.title>🔁 Spaced repetition untuk property CSS</TipCard.title>
                            <TipCard.body>Jangan hapal semua property sekaligus. Gunakan Anki atau buat kartu catatan sederhana. Saat belajar property baru, tulis: nama property, apa yang dilakukan, kapan digunakan, contoh. Review kartu setiap 3 hari selama 2 minggu.</TipCard.body>
                        </TipCard>

                        <TipCard accent="blue">
                            <TipCard.title>🎯 Satu konsep, satu proyek mini</TipCard.title>
                            <TipCard.body>Setelah belajar flexbox, build satu layout sederhana menggunakan HANYA flexbox. Setelah belajar grid, rebuild layout yang sama dengan grid. Perbandingan langsung ini sangat memperkuat pemahaman tentang kapan pakai apa.</TipCard.body>
                        </TipCard>

                        <TipCard accent="emerald">
                            <TipCard.title>📋 Copy website favorit kamu</TipCard.title>
                            <TipCard.body>Pilih website yang kamu suka, coba rebuild bagian-bagiannya dari scratch. Tidak perlu sempurna — tujuannya adalah menghadapi masalah nyata dan problem-solve. Setiap hambatan yang kamu atasi akan masuk ke memori jangka panjang.</TipCard.body>
                        </TipCard>

                        <TipCard accent="amber">
                            <TipCard.title>🗣️ Rubber duck debugging</TipCard.title>
                            <TipCard.body>Saat CSS tidak bekerja, coba jelaskan masalahnya keras-keras (atau ke rubber duck di meja). "Saya mau elemen ini berada di tengah. Saya pakai align-items:center tapi tidak bekerja. Parent-nya punya display:flex? Belum. Itu masalahnya." Seringkali kamu menemukan jawaban sebelum selesai menjelaskan.</TipCard.body>
                        </TipCard>

                        <H3>Rutinitas harian yang disarankan</H3>
                        <Code file="rutinitas.txt">{`
Hari belajar (1–2 jam):
  15 menit  — Review kartu konsep kemarin
  45 menit  — Pelajari 1 topik baru (baca, eksperimen di CodePen)
  30 menit  — Build mini project menggunakan konsep itu
  10 menit  — Tulis catatan / buat kartu baru

Hari latihan (1 jam):
  60 menit  — Rebuild/clone interface yang ada tanpa tutorial

Hari review (30 menit):
  30 menit  — Lihat kembali proyek minggu lalu, refaktor/improve
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="devtools" onClick={() => setActiveSection("devtools")}>
                        <H2>Kuasai DevTools<H2.anchor href="#devtools">#</H2.anchor></H2>
                        <P>DevTools adalah IDE-mu untuk CSS. Mayoritas developer hanya menggunakan 20% kemampuan DevTools — menguasai sisanya akan melipatgandakan produktivitas debugging.</P>

                        <H3>Fitur yang wajib dikuasai</H3>
                        <CheckList>
                            {[
                                "Elements panel → Styles → computed vs authored styles (paham perbedaannya)",
                                "Box model visualizer — klik elemen, lihat margin/padding/border secara visual",
                                "Force element state — :hover, :focus, :active, :visited tanpa harus hover manual",
                                "CSS Overview panel (Chrome) — audit warna, font, dan layout yang digunakan",
                                "Flexbox/Grid overlay — centang checkbox 'grid' atau 'flex' di Elements panel",
                                "Changes panel — lihat semua CSS yang kamu ubah di DevTools",
                                "Responsive mode — test breakpoints dan container queries",
                                "Accessibility tree — verifikasi ARIA roles dan screen reader output",
                            ].map(t => <CheckList.item key={t}><CheckList.icon>🛠️</CheckList.icon><CheckList.text>{t}</CheckList.text></CheckList.item>)}
                        </CheckList>

                        <H3>Shortcut penting</H3>
                        <Code file="devtools-shortcuts.txt">{`
F12 / Ctrl+Shift+I    — Buka DevTools
Ctrl+Shift+C          — Inspector mode (klik elemen)
H                     — Toggle visibility elemen yang dipilih
Delete                — Hapus elemen dari DOM
Ctrl+Z                — Undo perubahan di DevTools

Di Styles panel:
  Tab                 — Cycle antar property
  Shift+Click warna  — Cycle format warna (hex/rgb/hsl)
  Alt+Click arrow    — Ubah value +/- 0.1
  Shift+Click arrow  — Ubah value +/- 10
  Klik computed      — Klik nilai di Computed tab → lompat ke rule yang mendefinisikannya
                        `}</Code>

                        <Callout type="note">
                            <Callout.icon>📌</Callout.icon>
                            <Callout.content>
                                <Callout.title>Workflow debugging CSS terbaik</Callout.title>
                                Jangan langsung edit file CSS saat debugging. Eksperimen dulu di DevTools Styles panel, temukan solusinya, baru copy ke file. Ini 10× lebih cepat karena kamu bisa undo, toggle, dan lihat perubahan real-time tanpa reload.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="baca-docs" onClick={() => setActiveSection("baca-docs")}>
                        <H2>Cara Baca MDN Docs<H2.anchor href="#baca-docs">#</H2.anchor></H2>
                        <P>MDN Web Docs adalah sumber kebenaran untuk CSS. Tapi banyak developer tidak membacanya secara optimal — mereka hanya search snippet lalu pergi. Begini cara yang benar.</P>

                        <H3>Struktur halaman MDN yang perlu kamu baca</H3>
                        <CheckList>
                            {[
                                "Deskripsi singkat di atas — satu kalimat tentang apa yang dilakukan property ini",
                                "Try it playground — eksperimen langsung di browser",
                                "Values section — semua nilai valid dan apa artinya masing-masing",
                                "Formal definition — initial value, applies to, inherited, computed value, animation type",
                                "Formal syntax — grammar lengkap semua kombinasi valid",
                                "Examples — kode contoh yang bisa langsung dicoba",
                                "Browser compatibility — kolom 'Baseline' menunjukkan seberapa aman digunakan",
                            ].map(t => <CheckList.item key={t}><CheckList.icon>📖</CheckList.icon><CheckList.text>{t}</CheckList.text></CheckList.item>)}
                        </CheckList>

                        <H3>Informasi paling berharga</H3>
                        <Code file="mdn-reading.txt">{`
Formal definition → "Applies to: ..."
  → Ini memberitahu di elemen apa property berlaku
  → Contoh: z-index → "positioned elements"
  → Langsung tahu kenapa z-index tidak bekerja: elemen belum positioned

Formal definition → "Inherited: yes/no"
  → Jika "yes" → anak mewarisi dari parent
  → Jika "no" → harus set ulang di setiap elemen

Browser compatibility → "Baseline" kolom
  → "Widely available" (hijau) → aman di semua browser
  → "Newly available" (biru) → aman di browser modern terbaru
  → "Limited availability" (abu) → hati-hati, perlu check

Gunakan MDN, bukan W3Schools
  → MDN ditulis oleh engineers browser (Mozilla, Google, Apple)
  → W3Schools sering outdated dan simplified terlalu jauh
                        `}</Code>
                    </Section>
                    <Divider />

                    <Section id="jebakan" onClick={() => setActiveSection("jebakan")}>
                        <H2>Jebakan Umum Pemula<H2.anchor href="#jebakan">#</H2.anchor></H2>

                        <H3>1. Terlalu bergantung pada !important</H3>
                        <Code file="jebakan-1.css">{`
/* ❌ Jebakan: menambah !important untuk "fix" masalah specificity */
.button { color: blue !important; }
.nav .button { color: red !important; }
/* Hasilnya: !important arms race yang mustahil di-maintain */

/* ✅ Solusi: pahami dan perbaiki specificity */
.nav .button { color: red; }    /* specificity lebih tinggi = menang */
/* Atau gunakan :where() untuk menurunkan specificity */
:where(.nav) .button { color: red; }  /* specificity 0-0-1 */
                        `}</Code>

                        <H3>2. Pakai margin untuk segala hal</H3>
                        <Code file="jebakan-2.css">{`
/* ❌ Jebakan: pakai margin untuk layout/spacing */
.section { margin-top: 80px; }   /* untuk push konten dari nav */
.card + .card { margin-top: 20px; }

/* ✅ Lebih baik: pakai padding di container, gap di flex/grid */
.page { padding-top: 80px; }     /* lebih predictable */
.card-grid { display: flex; gap: 20px; flex-direction: column; }

/* Margin bagusnya untuk: */
/* - Jarak antar elemen yang berdiri sendiri (tidak dalam container) */
/* - Margin auto untuk centering */
.element { margin: 0 auto; }  /* centering horizontal */
                        `}</Code>

                        <H3>3. Mengabaikan stacking context</H3>
                        <Code file="jebakan-3.css">{`
/* ❌ Jebakan: z-index tidak bekerja seperti yang diharapkan */
.modal { z-index: 1000; position: fixed; }
.card  { z-index: 1;    position: relative; transform: scale(1); }
/* Modal terlihat di bawah card! Kenapa? */

/* Karena transform: scale(1) membuat stacking context baru pada .card */
/* Modal adalah child dari stacking context yang berbeda */

/* ✅ Solusi: pahami apa yang menciptakan stacking context */
/* Property yang membuat stacking context: */
/* - position + z-index selain auto */
/* - opacity < 1 */
/* - transform, filter, clip-path */
/* - isolation: isolate */
/* - will-change */

/* Gunakan isolation: isolate untuk mengontrol stacking */
.card { isolation: isolate; }  /* konten card tidak akan bocor ke luar */
                        `}</Code>

                        <H3>4. Tidak paham block formatting context</H3>
                        <Code file="jebakan-4.css">{`
/* ❌ Jebakan: margin collapse yang "unexpected" */
.parent { background: red; }
.child  { margin-top: 20px; }
/* Background parent tidak terlihat di 20px atas? Margin collapse! */

/* Margin top child "bocor" ke parent jika tidak ada: */
/* - padding/border di parent */
/* - overflow selain visible */
/* - display: flex/grid/flow-root */

/* ✅ Solusi: buat block formatting context di parent */
.parent {
  overflow: hidden;      /* atau: */
  display: flow-root;    /* modern solution, tidak ada efek samping */
}
                        `}</Code>

                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Tanda kamu punya mindset yang salah</Callout.title>
                                Jika kamu sering berpikir "CSS ini broken/stupid" atau menambah random properties sampai "kebetulan" bekerja — itu tanda kamu perlu belajar ulang fundamentalnya, bukan menghafal lebih banyak trik.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="mindset" onClick={() => setActiveSection("mindset")}>
                        <H2>Mindset yang Benar<H2.anchor href="#mindset">#</H2.anchor></H2>

                        <TipCard accent="emerald">
                            <TipCard.title>✅ CSS adalah logical system, bukan koleksi trik</TipCard.title>
                            <TipCard.body>Setiap behavior CSS memiliki alasan yang masuk akal. Saat sesuatu tidak bekerja, ada aturan yang menjelaskannya. Tugasmu adalah menemukan aturan itu, bukan "fighting the browser".</TipCard.body>
                        </TipCard>

                        <TipCard accent="blue">
                            <TipCard.title>✅ Embrace constraints, jangan fight them</TipCard.title>
                            <TipCard.body>CSS dirancang untuk dokumen yang bisa dibaca di berbagai ukuran layar, device, dan konteks. Banyak "keterbatasan" CSS adalah fitur bukan bug — misalnya cascade memungkinkan theming, inheritance mengurangi repetisi, flow-based layout bekerja di semua ukuran layar.</TipCard.body>
                        </TipCard>

                        <TipCard accent="violet">
                            <TipCard.title>✅ Prefer composition over complexity</TipCard.title>
                            <TipCard.body>CSS terbaik adalah CSS yang sederhana. Jika satu layout membutuhkan 50+ baris CSS, mungkin ada cara yang lebih baik. Biasanya kamu bisa solve masalah yang sama dengan 5–10 baris jika paham sistem layout yang tepat.</TipCard.body>
                        </TipCard>

                        <TipCard accent="amber">
                            <TipCard.title>✅ Browser adalah partner, bukan musuh</TipCard.title>
                            <TipCard.body>Browser default styles, algoritma cascade, normal flow — semuanya ada untuk alasan yang baik. Daripada override semua default CSS dengan reset besar-besaran, pelajari apa yang dilakukan browser secara default dan manfaatkan. Sering kali solusinya adalah menghapus CSS, bukan menambah.</TipCard.body>
                        </TipCard>
                    </Section>
                    <Divider />

                    <Section id="exercise" onClick={() => setActiveSection("exercise")}>
                        <H2>Latihan<H2.anchor href="#exercise">#</H2.anchor></H2>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 1 — Specificity audit</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buka website kamu atau website mana saja. Di DevTools, klik 10 elemen berbeda. Di Styles panel, lihat berapa banyak <IC>!important</IC> yang ada. Hitung berapa banyak selector dengan specificity tinggi (lebih dari 2 class). Ini adalah "technical debt" CSS yang perlu dibersihkan.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 2 — Inheritance explorer</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buat halaman HTML sederhana dengan nested div. Set <IC>color</IC>, <IC>font-size</IC>, <IC>background</IC>, <IC>padding</IC> di parent. Lihat di DevTools → Computed tab mana yang di-inherit dan mana yang tidak. Kemudian test <IC>inherit</IC>, <IC>initial</IC>, <IC>unset</IC>, <IC>revert</IC> pada child elements.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                        <ExerciseCard>
                            <ExerciseCard.header><span>🏋️</span><ExerciseCard.title>Latihan 3 — DevTools speed run</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Buka website yang sering kamu kunjungi. Dalam 10 menit, gunakan DevTools untuk: (1) toggle dark/light mode lewat CSS variable, (2) force hover state pada navigation, (3) lihat grid overlay pada layout, (4) cek apakah ada CSS yang ter-override (!important), (5) ukur box model setiap elemen header.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/mentor/roadmap" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Roadmap Belajar</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/mentor/project-ideas" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Ide Proyek Latihan</NavBtn.label></NavBtn>
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
