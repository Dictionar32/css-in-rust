/**
 * Mentor — Ide Proyek Latihan CSS
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    ExerciseCard, PageNav, NavBtn,
    ProjectCard, DifficultyBadge, SkillTag, LevelBadge,
} from "../styles"

const TOC = [
    { id: "cara-pakai", label: "Cara Menggunakan" },
    { id: "beginner", label: "Beginner Projects" },
    { id: "intermediate", label: "Intermediate Projects" },
    { id: "advanced", label: "Advanced Projects" },
    { id: "clone-projects", label: "Clone Projects" },
    { id: "challenge", label: "Daily CSS Challenge" },
]

const BEGINNER_PROJECTS = [
    {
        title: "Profile Card Component",
        desc: "Buat card profil dengan avatar, nama, bio, dan social links. Fokus pada box model, flexbox centering, dan hover effects.",
        skills: ["box-model", "flexbox", "hover", "border-radius"],
        difficulty: "beginner" as const,
        spec: "Avatar bulat 80px, nama font-bold, bio 2 baris truncated, 3 social icon links berjajar. Hover: card naik 4px dengan box-shadow.",
    },
    {
        title: "Navigation Bar Responsive",
        desc: "Nav bar dengan logo, links, dan hamburger menu. Mobile-first approach dengan media query untuk desktop layout.",
        skills: ["flexbox", "positioning", "media-queries", "transitions"],
        difficulty: "beginner" as const,
        spec: "Mobile: hamburger menu dengan slide-down animation. Desktop: links berjajar horizontal. Active link dengan bottom border.",
    },
    {
        title: "Pricing Table",
        desc: "3 kolom pricing card dengan highlighted plan di tengah. Pakai grid untuk layout dan custom properties untuk tema.",
        skills: ["css-grid", "custom-properties", "border", "shadows"],
        difficulty: "beginner" as const,
        spec: "3 card: Basic, Pro (highlighted), Enterprise. Pro card lebih tinggi dengan accent color, badge 'Most Popular'.",
    },
    {
        title: "Button Component Library",
        desc: "Kumpulan button variants: primary, secondary, ghost, danger, dengan ukuran sm/md/lg dan loading state.",
        skills: ["custom-properties", "transitions", "pseudo-classes", "flexbox"],
        difficulty: "beginner" as const,
        spec: "4 variants × 3 ukuran = 12 button. Plus: disabled state, loading spinner, icon button. Semua pakai CSS variables.",
    },
    {
        title: "CSS Art — Simple Icon",
        desc: "Buat icon CSS murni (hamburger menu, close X, atau arrow) tanpa gambar atau SVG. Latihan transform dan positioning.",
        skills: ["positioning", "transforms", "transitions", "pseudo-elements"],
        difficulty: "beginner" as const,
        spec: "Hamburger menu yang transform jadi X saat diklik. Animasi smooth dengan transition.",
    },
    {
        title: "Form UI Components",
        desc: "Input, textarea, select, checkbox, radio, dan switch toggle. Semua dengan focus styles, error state, dan disabled state.",
        skills: ["pseudo-classes", ":focus-visible", "custom-properties", "accessibility"],
        difficulty: "beginner" as const,
        spec: "Label selalu visible (tidak floating-label). Error state: border merah + helper text. Semua focus indicator WCAG compliant.",
    },
]

const INTERMEDIATE_PROJECTS = [
    {
        title: "Dashboard Layout",
        desc: "Dashboard admin dengan sidebar, topbar, dan konten area. Sidebar collapsible, responsif di mobile.",
        skills: ["css-grid", "positioning", "custom-properties", "transitions", "media-queries"],
        difficulty: "intermediate" as const,
        spec: "Grid areas: sidebar + main. Sidebar collapse dengan CSS-only (checkbox hack atau :has()). Dark/light mode toggle.",
    },
    {
        title: "Magazine-style Article",
        desc: "Layout artikel dengan drop cap, pull quote, multi-column text, dan responsive image alignment.",
        skills: ["typography", "css-columns", "float", "css-grid", "line-height"],
        difficulty: "intermediate" as const,
        spec: "Drop cap paragraph pertama, pull quote di tengah artikel, 2-kolom pada desktop, inline image dengan text wrap.",
    },
    {
        title: "Animated Loading States",
        desc: "Skeleton loaders, shimmer effect, progress bar, dan spinner yang smooth. Fokus pada CSS animations dan performance.",
        skills: ["@keyframes", "animations", "performance", "custom-properties"],
        difficulty: "intermediate" as const,
        spec: "Skeleton card dengan shimmer animation. Progress bar dengan easing. Spinner 3 varian: simple, dots, pulse.",
    },
    {
        title: "CSS-only Tabs & Accordion",
        desc: "Tab navigation dan accordion expandable tanpa JavaScript. Gunakan :target, :checked, atau :has() selector.",
        skills: ["selectors", ":has()", ":target", "transitions", "accessibility"],
        difficulty: "intermediate" as const,
        spec: "3 tab dengan URL anchor (:target). Accordion dengan checkbox + sibling selector. Animasi height smooth.",
    },
    {
        title: "Dark Mode Design System",
        desc: "Sistem warna lengkap dengan dark/light mode menggunakan custom properties dan prefers-color-scheme.",
        skills: ["custom-properties", "color-scheme", "oklch", "prefers-color-scheme"],
        difficulty: "intermediate" as const,
        spec: "Definisikan 20+ token warna di :root. Auto switch dengan prefers-color-scheme. Manual toggle dengan data-theme attribute.",
    },
    {
        title: "Responsive Card Grid",
        desc: "Grid kartu yang auto-responsive tanpa media query menggunakan CSS Grid auto-fill dan minmax.",
        skills: ["css-grid", "auto-fill", "minmax", "aspect-ratio", "object-fit"],
        difficulty: "intermediate" as const,
        spec: "Grid 3-kolom yang auto-adjust ke 2, lalu 1 kolom tanpa media query. Card dengan image 16:9, ellipsis title, truncated desc.",
    },
    {
        title: "Sticky Multi-level Navigation",
        desc: "Mega menu dropdown dengan sticky behavior, backdrop blur, dan smooth transitions.",
        skills: ["positioning", "z-index", "backdrop-filter", "transitions", "clip-path"],
        difficulty: "intermediate" as const,
        spec: "Sticky nav dengan backdrop-blur. Mega menu slide-down dengan clip-path animation. Mobile: full-screen overlay.",
    },
]

const ADVANCED_PROJECTS = [
    {
        title: "Scroll-driven Animations",
        desc: "Animasi yang dikendalikan oleh scroll position menggunakan @scroll-timeline atau scroll() function.",
        skills: ["scroll-timeline", "animation-timeline", "@keyframes", "view-transitions"],
        difficulty: "advanced" as const,
        spec: "Progress bar scroll, parallax hero, element fade-in on scroll, header yang mengecil saat scroll — semua CSS-only.",
    },
    {
        title: "CSS Grid Complex Magazine",
        desc: "Layout majalah dengan grid area asimetris, full-bleed images, dan text yang mengelilingi konten.",
        skills: ["css-grid", "subgrid", "named-areas", "spanning"],
        difficulty: "advanced" as const,
        spec: "6-column grid, article cards berbeda ukuran, featured article 3-kolom, sidebar, footer spanning full width.",
    },
    {
        title: "Custom Select Component",
        desc: "Select dropdown yang fully styled dan accessible menggunakan appearance:none, custom arrow, dan :focus-visible.",
        skills: ["forms", "appearance", ":focus-visible", "accessibility", "forced-colors"],
        difficulty: "advanced" as const,
        spec: "Select dengan custom arrow SVG via background-image. Paham keterbatasan CSS styling pada select. HCM-compatible.",
    },
    {
        title: "Animated SVG Dashboard Charts",
        desc: "Chart SVG yang dianimasikan dengan CSS — line chart, bar chart, dan donut chart menggunakan stroke-dasharray.",
        skills: ["SVG", "stroke-dasharray", "@keyframes", "transitions", "CSS-counter"],
        difficulty: "advanced" as const,
        spec: "Donut chart dengan CSS stroke-dasharray, draw-on animation, animated number counter dengan CSS @counter-style.",
    },
    {
        title: "CSS Houdini Paint Worklet",
        desc: "Custom paint worklet untuk pattern background yang bisa dikontrol dengan CSS custom properties.",
        skills: ["houdini", "paint-worklet", "CSS-typed-OM", "@property"],
        difficulty: "advanced" as const,
        spec: "Pattern polkadot/stripes/grid yang fully parametric via custom properties. Animatable dengan @property definition.",
    },
    {
        title: "Full Design System",
        desc: "Design system CSS lengkap dengan tokens, components, layout utilities, dan dokumentasi komponen.",
        skills: ["custom-properties", "architecture", "CSS-layers", "@layer", "design-tokens"],
        difficulty: "advanced" as const,
        spec: "Minimal 20 components. Token system untuk warna/spacing/radius/shadow. @layer untuk specificity management.",
    },
]

const CLONE_PROJECTS = [
    { name: "GitHub Profile Page", skills: ["grid", "flexbox", "responsive"] },
    { name: "Stripe Pricing Page", skills: ["grid", "gradients", "animations"] },
    { name: "Linear App Landing Page", skills: ["typography", "gradients", "scroll-animations"] },
    { name: "Vercel Dashboard", skills: ["dark-mode", "grid", "components"] },
    { name: "Figma Community Page", skills: ["masonry-grid", "filters", "hover-effects"] },
    { name: "Airbnb Search Page", skills: ["map-layout", "sticky", "filters"] },
]

export default function ProjectIdeasPage() {
    const [activeSection, setActiveSection] = useState("cara-pakai")

    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/mentor">Mentor</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Project Ideas</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>

            <Body>
                <Content>
                    <PageTitle>Ide Proyek Latihan CSS</PageTitle>
                    <PageDesc>20+ proyek dari beginner ke advanced — setiap proyek dikurasi untuk melatih konsep CSS spesifik dengan spec yang jelas agar kamu tidak bingung harus mulai dari mana.</PageDesc>

                    <Section id="cara-pakai" onClick={() => setActiveSection("cara-pakai")}>
                        <H2>Cara Menggunakan<H2.anchor href="#cara-pakai">#</H2.anchor></H2>
                        <P>Setiap proyek dilengkapi dengan spec singkat — kerjakan sesuai spec, bukan berdasarkan interpretasi kamu sendiri. Ini melatih kemampuan "translate design ke CSS" yang sangat berharga di dunia kerja.</P>

                        <Callout type="tip">
                            <Callout.icon>💡</Callout.icon>
                            <Callout.content>
                                <Callout.title>Cara kerja terbaik</Callout.title>
                                Sebelum mulai: baca spec, buat sketch kasar di kertas. Kemudian code tanpa lihat tutorial. Jika stuck lebih dari 15 menit, cari solusi — tapi tulis mengapa solusi itu bekerja.
                            </Callout.content>
                        </Callout>

                        <Callout type="note">
                            <Callout.icon>📌</Callout.icon>
                            <Callout.content>
                                <Callout.title>Tools yang disarankan</Callout.title>
                                CodePen atau StackBlitz untuk quick prototyping. VS Code + Live Server untuk proyek yang lebih serius. Jangan pakai framework CSS seperti Bootstrap/Tailwind untuk latihan ini — tujuannya adalah memahami CSS dasar.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="beginner" onClick={() => setActiveSection("beginner")}>
                        <H2>Beginner Projects<H2.anchor href="#beginner">#</H2.anchor></H2>
                        <P>Cocok untuk yang baru selesai belajar dasar-dasar CSS. Fokus pada satu atau dua konsep per proyek.</P>
                        <div className="space-y-3">
                            {BEGINNER_PROJECTS.map(p => (
                                <ProjectCard key={p.title}>
                                    <ProjectCard.header>
                                        <ProjectCard.title>{p.title}</ProjectCard.title>
                                        <DifficultyBadge level={p.difficulty}>Beginner</DifficultyBadge>
                                    </ProjectCard.header>
                                    <ProjectCard.desc>{p.desc}</ProjectCard.desc>
                                    <ProjectCard.tags>
                                        {p.skills.map(s => <SkillTag key={s}>{s}</SkillTag>)}
                                    </ProjectCard.tags>
                                    <ProjectCard.skills>
                                        <span className="font-semibold">Spec: </span>{p.spec}
                                    </ProjectCard.skills>
                                </ProjectCard>
                            ))}
                        </div>
                    </Section>
                    <Divider />

                    <Section id="intermediate" onClick={() => setActiveSection("intermediate")}>
                        <H2>Intermediate Projects<H2.anchor href="#intermediate">#</H2.anchor></H2>
                        <P>Untuk yang sudah selesai level Medium. Mengkombinasikan beberapa konsep CSS secara bersamaan.</P>
                        <div className="space-y-3">
                            {INTERMEDIATE_PROJECTS.map(p => (
                                <ProjectCard key={p.title}>
                                    <ProjectCard.header>
                                        <ProjectCard.title>{p.title}</ProjectCard.title>
                                        <DifficultyBadge level={p.difficulty}>Intermediate</DifficultyBadge>
                                    </ProjectCard.header>
                                    <ProjectCard.desc>{p.desc}</ProjectCard.desc>
                                    <ProjectCard.tags>
                                        {p.skills.map(s => <SkillTag key={s}>{s}</SkillTag>)}
                                    </ProjectCard.tags>
                                    <ProjectCard.skills>
                                        <span className="font-semibold">Spec: </span>{p.spec}
                                    </ProjectCard.skills>
                                </ProjectCard>
                            ))}
                        </div>
                    </Section>
                    <Divider />

                    <Section id="advanced" onClick={() => setActiveSection("advanced")}>
                        <H2>Advanced Projects<H2.anchor href="#advanced">#</H2.anchor></H2>
                        <P>Untuk yang sudah selesai level High dan Advanced. Menggunakan fitur CSS modern dan pattern yang complex.</P>
                        <div className="space-y-3">
                            {ADVANCED_PROJECTS.map(p => (
                                <ProjectCard key={p.title}>
                                    <ProjectCard.header>
                                        <ProjectCard.title>{p.title}</ProjectCard.title>
                                        <DifficultyBadge level={p.difficulty}>Advanced</DifficultyBadge>
                                    </ProjectCard.header>
                                    <ProjectCard.desc>{p.desc}</ProjectCard.desc>
                                    <ProjectCard.tags>
                                        {p.skills.map(s => <SkillTag key={s}>{s}</SkillTag>)}
                                    </ProjectCard.tags>
                                    <ProjectCard.skills>
                                        <span className="font-semibold">Spec: </span>{p.spec}
                                    </ProjectCard.skills>
                                </ProjectCard>
                            ))}
                        </div>
                    </Section>
                    <Divider />

                    <Section id="clone-projects" onClick={() => setActiveSection("clone-projects")}>
                        <H2>Clone Projects<H2.anchor href="#clone-projects">#</H2.anchor></H2>
                        <P>Clone website nyata adalah cara terbaik untuk menghadapi tantangan CSS yang tidak pernah terpikirkan sebelumnya. Kamu tidak akan tahu bahwa kamu tidak tahu sesuatu sampai menemukan masalah itu di dunia nyata.</P>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {CLONE_PROJECTS.map(p => (
                                <div key={p.name} className="rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] p-4">
                                    <p className="text-sm font-semibold mb-2">{p.name}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {p.skills.map(s => <SkillTag key={s}>{s}</SkillTag>)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Callout type="tip">
                            <Callout.icon>🎯</Callout.icon>
                            <Callout.content>
                                <Callout.title>Tips clone project</Callout.title>
                                Jangan lihat source code website aslinya sebelum selesai. Gunakan DevTools hanya untuk ukur spacing dan warna, bukan untuk melihat CSS yang digunakan. Setelah selesai, bandingkan pendekatan kamu dengan implementasi aslinya — pelajaran terbesar biasanya di sini.
                            </Callout.content>
                        </Callout>
                    </Section>
                    <Divider />

                    <Section id="challenge" onClick={() => setActiveSection("challenge")}>
                        <H2>Daily CSS Challenge<H2.anchor href="#challenge">#</H2.anchor></H2>
                        <P>Jika tidak punya banyak waktu, coba tantangan harian ini — 15–30 menit per hari, satu komponen kecil per hari.</P>

                        <div className="space-y-2">
                            {[
                                { day: "Sen", task: "Buat tooltip dengan CSS-only — pure CSS, no JavaScript" },
                                { day: "Sel", task: "Animasi loading dots dengan @keyframes" },
                                { day: "Rab", task: "Custom checkbox dan radio button yang terlihat bagus" },
                                { day: "Kam", task: "Card dengan hover: flip 3D menggunakan perspective" },
                                { day: "Jum", task: "Gradient border yang animated" },
                                { day: "Sab", task: "Layout 'Holy Grail' dengan CSS Grid" },
                                { day: "Min", task: "Rebuild satu section dari website favorit kamu" },
                            ].map(item => (
                                <div key={item.day} className="flex items-center gap-3 p-3 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)]">
                                    <span className="shrink-0 w-10 h-10 rounded-lg bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)] text-xs font-bold flex items-center justify-center">{item.day}</span>
                                    <p className="text-sm">{item.task}</p>
                                </div>
                            ))}
                        </div>

                        <ExerciseCard>
                            <ExerciseCard.header><span>🏆</span><ExerciseCard.title>30-Day CSS Challenge</ExerciseCard.title></ExerciseCard.header>
                            <ExerciseCard.body>
                                <p>Komitmen 30 hari: setiap hari buat satu komponen atau layout CSS. Mulai dari yang sederhana (button, card, badge) lalu tingkatkan kompleksitas setiap minggu. Di hari ke-30, kamu akan punya 30 komponen yang bisa dipakai di portfolio.</p>
                            </ExerciseCard.body>
                        </ExerciseCard>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/mentor/cara-belajar-css" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Cara Belajar CSS</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/mentor/debugging-css" dir="next"><NavBtn.hint>Next →</NavBtn.hint><NavBtn.label>Debugging CSS</NavBtn.label></NavBtn>
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
