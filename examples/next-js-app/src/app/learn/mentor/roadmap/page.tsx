/**
 * Mentor — Roadmap Belajar CSS
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    CodeWrap, CopyBtn, ExerciseCard, PageNav, NavBtn,
    RoadmapStep, RoadmapDot, LevelBadge, CheckList, TipCard,
} from "../styles"

const TOC = [
    { id: "overview", label: "Gambaran Umum" },
    { id: "dasar", label: "Level Dasar" },
    { id: "medium", label: "Level Medium" },
    { id: "high", label: "Level High" },
    { id: "advanced", label: "Level Advanced" },
    { id: "timeline", label: "Estimasi Waktu" },
    { id: "milestone", label: "Milestone Check" },
    { id: "tips", label: "Tips Perjalanan" },
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

const ROADMAP = [
    {
        num: "01",
        status: "done" as const,
        level: "dasar" as const,
        levelLabel: "Dasar",
        title: "Fondasi Layout CSS",
        duration: "2–4 minggu",
        href: "/learn/dasar-css",
        topics: [
            "Box Model — content, padding, border, margin, box-sizing",
            "Normal Flow — block vs inline, display, formatting context",
            "Positioning — static, relative, absolute, fixed, sticky",
            "Flexbox — container & item properties, alignment, flex shorthand",
            "CSS Grid — tracks, template areas, auto-placement, fr unit",
            "Responsive & Container Queries — media queries, viewport units",
        ],
        milestone: "Bisa rebuild layout halaman nyata tanpa lihat tutorial",
    },
    {
        num: "02",
        status: "current" as const,
        level: "medium" as const,
        levelLabel: "Medium",
        title: "CSS Intermediate",
        duration: "3–5 minggu",
        href: "/learn/medium",
        topics: [
            "Selectors & Specificity — :is(), :where(), :has(), cascade",
            "Custom Properties — CSS variables, theming, dynamic values",
            "Typography — font loading, fluid type, variable fonts",
            "Colors & Gradients — oklch, hsl, color-mix(), modern gradients",
            "Transitions & Animations — @keyframes, timing functions, performance",
            "Transforms — 2D/3D transforms, perspective",
            "Visual Effects — filter, backdrop-filter, clip-path, blend modes",
            "CSS Architecture — BEM, design tokens, CSS Modules",
        ],
        milestone: "Bisa build komponen UI lengkap dengan animasi dan tema",
    },
    {
        num: "03",
        status: "upcoming" as const,
        level: "high" as const,
        levelLabel: "High",
        title: "CSS High Level",
        duration: "3–4 minggu",
        href: "/learn/high",
        topics: [
            "CSS Performance — rendering pipeline, contain, content-visibility",
            "CSS Houdini — Paint Worklet, CSS Typed OM",
            "CSS Architecture Patterns — CUBE CSS, scalable systems",
            "Accessibility CSS — :focus-visible, WCAG, forced-colors",
            "CSS & JavaScript — CSSOM, Web Animations API, matchMedia",
            "Advanced Layout Patterns — holy grail, RAM pattern, spacing system",
        ],
        milestone: "Bisa optimasi, bikin design system, dan paham a11y di CSS",
    },
    {
        num: "04",
        status: "upcoming" as const,
        level: "advanced" as const,
        levelLabel: "Advanced",
        title: "CSS Advanced (Baseline 2023–2025)",
        duration: "2–3 minggu",
        href: "/learn/advandced",
        topics: [
            "Anchor Positioning — tooltip/popover tanpa JS positioning",
            "CSS Subgrid — nested grid yang sinkron dengan parent tracks",
            "Container & Style Queries — layout berbasis container size",
            "Popover API — native popover dengan top-layer & light-dismiss",
            "View Transitions Advanced — cross-document, shared elements",
            "CSS Functions & The Future — interpolate-size, light-dark(), if()",
        ],
        milestone: "Bisa pakai fitur modern CSS tanpa polyfill di semua browser",
    },
]

export default function RoadmapPage() {
    const [activeSection, setActiveSection] = useState("overview")

    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/mentor">Mentor</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Roadmap</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>

            <Body>
                <Content>
                    <PageTitle>Roadmap Belajar CSS</PageTitle>
                    <PageDesc>Jalur belajar terstruktur dari nol sampai mahir — urutan topik yang optimal, estimasi waktu, dan milestone yang bisa kamu ukur sendiri.</PageDesc>

                    <Section id="overview" onClick={() => setActiveSection("overview")}>
                        <H2>Gambaran Umum<H2.anchor href="#overview">#</H2.anchor></H2>
                        <P>Roadmap ini terbagi menjadi 4 level yang disusun secara progresif. Setiap level membangun di atas fondasi level sebelumnya. Urutan ini bukan satu-satunya cara belajar, tapi merupakan jalur yang paling efisien berdasarkan dependensi antar konsep.</P>

                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <Callout.title>Jangan skip level</Callout.title>
                                Godaan terbesar adalah loncat ke Flexbox/Grid tanpa paham Box Model. Ini menyebabkan banyak "black magic" — kamu tahu hasilnya tapi tidak tahu kenapa. Investasi waktu di dasar akan menghemat berjam-jam debugging di masa depan.
                            </Callout.content>
                        </Callout>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
                            {[
                                { level: "dasar" as const, label: "Dasar", topics: "6 topik", time: "2–4 mgg" },
                                { level: "medium" as const, label: "Medium", topics: "8 topik", time: "3–5 mgg" },
                                { level: "high" as const, label: "High", topics: "6 topik", time: "3–4 mgg" },
                                { level: "advanced" as const, label: "Advanced", topics: "6 topik", time: "2–3 mgg" },
                            ].map(item => (
                                <div key={item.level} className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] p-3 text-center">
                                    <LevelBadge level={item.level}>{item.label}</LevelBadge>
                                    <p className="text-sm font-semibold mt-2">{item.topics}</p>
                                    <p className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] mt-0.5">{item.time}</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                    <Divider />

                    {ROADMAP.map((step, i) => (
                        <div key={step.num}>
                            <Section id={["dasar", "medium", "high", "advanced"][i]} onClick={() => setActiveSection(["dasar", "medium", "high", "advanced"][i])}>
                                <div className="flex items-start gap-4 mb-6">
                                    <RoadmapDot status={step.status}>{step.num}</RoadmapDot>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <H2 className="mb-0">
                                                {step.title}
                                                <H2.anchor href={`#${["dasar", "medium", "high", "advanced"][i]}`}>#</H2.anchor>
                                            </H2>
                                            <LevelBadge level={step.level}>{step.levelLabel}</LevelBadge>
                                            <span className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] font-mono">⏱ {step.duration}</span>
                                        </div>
                                    </div>
                                </div>

                                <H3>Topik yang dipelajari</H3>
                                <CheckList>
                                    {step.topics.map(t => (
                                        <CheckList.item key={t}>
                                            <CheckList.icon>{step.status === "done" ? "✅" : step.status === "current" ? "🔵" : "⬜"}</CheckList.icon>
                                            <CheckList.text>{t}</CheckList.text>
                                        </CheckList.item>
                                    ))}
                                </CheckList>

                                <Callout type="note">
                                    <Callout.icon>🎯</Callout.icon>
                                    <Callout.content>
                                        <Callout.title>Milestone</Callout.title>
                                        {step.milestone}
                                    </Callout.content>
                                </Callout>
                            </Section>
                            {i < ROADMAP.length - 1 && <Divider />}
                        </div>
                    ))}

                    <Divider />

                    <Section id="timeline" onClick={() => setActiveSection("timeline")}>
                        <H2>Estimasi Waktu<H2.anchor href="#timeline">#</H2.anchor></H2>
                        <P>Estimasi berikut mengasumsikan belajar <IC>1–2 jam per hari</IC>, termasuk latihan. Waktu aktual bergantung pada latar belakang, intensitas, dan apakah kamu langsung mempraktikkan di proyek nyata.</P>

                        <Code file="timeline.txt">{`
Belajar 1 jam/hari:
  Dasar CSS    →  4–8 minggu
  Medium       →  6–10 minggu
  High         →  6–8 minggu
  Advanced     →  4–6 minggu
  Total        →  ~5–8 bulan

Belajar 2 jam/hari:
  Dasar CSS    →  2–4 minggu
  Medium       →  3–5 minggu
  High         →  3–4 minggu
  Advanced     →  2–3 minggu
  Total        →  ~2.5–4 bulan

Belajar 4+ jam/hari (bootcamp style):
  Total        →  ~6–10 minggu
                        `}</Code>

                        <Callout type="warning">
                            <Callout.icon>⚠️</Callout.icon>
                            <Callout.content>
                                <Callout.title>Jangan terburu-buru</Callout.title>
                                Estimasi waktu di atas bukan target yang harus dikejar. Lebih baik paham benar satu topik daripada rush semua level tapi tidak ada yang melekat. Tanda kamu siap lanjut: bisa menjelaskan konsep dengan kata-kata sendiri, bukan hanya bisa mengetik kodenya.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="milestone" onClick={() => setActiveSection("milestone")}>
                        <H2>Milestone Check<H2.anchor href="#milestone">#</H2.anchor></H2>
                        <P>Gunakan checklist ini untuk menilai apakah kamu sudah siap lanjut ke level berikutnya. Jawab jujur — jika lebih dari 2 item belum bisa, pertimbangkan untuk review dulu.</P>

                        <H3>✅ Siap lanjut dari Dasar ke Medium jika:</H3>
                        <CheckList>
                            {[
                                "Bisa menjelaskan perbedaan margin-collapse dan kapan terjadi",
                                "Tahu perbedaan position absolute vs fixed vs sticky tanpa lihat docs",
                                "Bisa bikin layout 3-column dengan flexbox DAN dengan grid",
                                "Bisa bikin layout responsif tanpa framework",
                                "Tidak perlu Google 'how to center a div' lagi",
                            ].map(t => <CheckList.item key={t}><CheckList.icon>☑️</CheckList.icon><CheckList.text>{t}</CheckList.text></CheckList.item>)}
                        </CheckList>

                        <H3>✅ Siap lanjut dari Medium ke High jika:</H3>
                        <CheckList>
                            {[
                                "Bisa debug specificity conflict tanpa panik",
                                "Bisa build dark mode dengan CSS custom properties",
                                "Bisa bikin animasi yang smooth tanpa jank",
                                "Paham kenapa beberapa CSS property lebih mahal dari lainnya",
                                "Bisa memilih antara BEM, utility-first, dan CSS Modules sesuai konteks",
                            ].map(t => <CheckList.item key={t}><CheckList.icon>☑️</CheckList.icon><CheckList.text>{t}</CheckList.text></CheckList.item>)}
                        </CheckList>

                        <H3>✅ Siap lanjut dari High ke Advanced jika:</H3>
                        <CheckList>
                            {[
                                "Bisa profile dan fix CSS performance bottleneck di DevTools",
                                "Paham accessibility tree dan bagaimana CSS mempengaruhinya",
                                "Bisa bikin design system CSS yang scalable untuk tim",
                                "Bisa integrasi CSS dengan JavaScript secara idiomatis",
                                "Paham kapan pakai layout pattern mana untuk kasus nyata",
                            ].map(t => <CheckList.item key={t}><CheckList.icon>☑️</CheckList.icon><CheckList.text>{t}</CheckList.text></CheckList.item>)}
                        </CheckList>
                    </Section>
                    <Divider />

                    <Section id="tips" onClick={() => setActiveSection("tips")}>
                        <H2>Tips Perjalanan<H2.anchor href="#tips">#</H2.anchor></H2>

                        <TipCard accent="violet">
                            <TipCard.title>🔨 Build, bukan baca</TipCard.title>
                            <TipCard.body>Setiap topik harus diakhiri dengan membangun sesuatu yang menggunakan konsep itu. Tidak perlu besar — card component, nav bar, atau hero section sudah cukup. Otak mengingat jauh lebih baik lewat pembuatan daripada konsumsi.</TipCard.body>
                        </TipCard>

                        <TipCard accent="blue">
                            <TipCard.title>📖 Baca spec, bukan hanya tutorial</TipCard.title>
                            <TipCard.body>MDN Web Docs adalah teman terbaik. Setiap kali kamu belajar property baru, baca halaman MDN-nya lengkap — termasuk bagian "Formal definition" dan "Browser compatibility". Ini membangun intuisi yang tidak bisa didapat dari tutorial.</TipCard.body>
                        </TipCard>

                        <TipCard accent="emerald">
                            <TipCard.title>🧪 Isolate dan eksperimen</TipCard.title>
                            <TipCard.body>Buka CodePen atau jsfiddle, buat file HTML kosong, dan eksperimen. Ubah satu property, lihat hasilnya. Ini jauh lebih efektif dari copy-paste kode yang sudah jadi. Rasa ingin tahu adalah skill paling valuable dalam CSS.</TipCard.body>
                        </TipCard>

                        <TipCard accent="amber">
                            <TipCard.title>🤝 Ajarkan orang lain</TipCard.title>
                            <TipCard.body>Cara tercepat untuk mengetahui apakah kamu benar-benar paham adalah mencoba menjelaskannya. Tulis blog post, rekam video pendek, atau jelaskan ke teman. Jika kamu tidak bisa menjelaskan dengan sederhana, kamu belum benar-benar paham.</TipCard.body>
                        </TipCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/mentor" dir="prev"><NavBtn.hint>← Back</NavBtn.hint><NavBtn.label>Mentor Overview</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/mentor/cara-belajar-css" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Cara Belajar CSS</NavBtn.label></NavBtn>
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
