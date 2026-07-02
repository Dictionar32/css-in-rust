/**
 * Mentor — Overview
 */
import { tw } from "tailwind-styled-v4"

// ─── Layout ───────────────────────────────────────────────────────────────────
const Page = tw.div({ base: "min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans", attrs: { "data-learn-page": "" } })
const TopBar = tw.nav({ base: "sticky top-0 z-50 h-12 border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--surface)_85%,transparent)] backdrop-blur-md", attrs: { "data-learn-topbar": "" } })
const TopBarInner = tw.div({ base: "max-w-5xl mx-auto px-4 h-full flex items-center gap-2 text-sm" })
const Breadcrumb = tw.div({
    base: "flex items-center gap-1.5 text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)]",
    sub: {
        "a:link": "hover:text-[var(--foreground)] transition-colors",
        "span:sep": "opacity-40",
        "span:curr": "text-[var(--foreground)] font-medium",
    },
})
const Body = tw.div({ base: "max-w-5xl mx-auto px-4 py-12" })
const PageTitle = tw.h1({ base: "text-3xl font-bold tracking-tight mb-3" })
const PageDesc = tw.p({ base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-4 leading-relaxed max-w-2xl" })
const MentorBadge = tw.span({ base: "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full mb-10 bg-violet-100 text-violet-700 border border-violet-200" })

// ─── Topic card ───────────────────────────────────────────────────────────────
const Grid = tw.div({ base: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" })
const Card = tw.a({
    base: "group block rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] p-5 hover:border-[var(--accent)] hover:shadow-sm transition-all",
})
const CardIcon = tw.div({ base: "text-2xl mb-3" })
const CardTitle = tw.h2({ base: "text-sm font-semibold mb-1 group-hover:text-[var(--accent)] transition-colors" })
const CardDesc = tw.p({ base: "text-xs text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] leading-relaxed" })
const CardMeta = tw.div({ base: "flex items-center gap-2 mt-3" })
const CardBadge = tw.span({ base: "text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]" })
const CardTag = tw.span({
    base: "text-[10px] font-semibold px-2 py-0.5 rounded-full",
    variants: {
        type: {
            guide: "bg-violet-100 text-violet-700",
            roadmap: "bg-blue-100 text-blue-700",
            project: "bg-emerald-100 text-emerald-700",
            debug: "bg-amber-100 text-amber-700",
            resource: "bg-pink-100 text-pink-700",
        },
    },
    defaultVariants: { type: "guide" },
})

// ─── Highlight section ────────────────────────────────────────────────────────
const HighlightRow = tw.div({ base: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 p-6 rounded-2xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)]" })
const Stat = tw.div({ base: "text-center", sub: { "p:value": "text-2xl font-bold text-[var(--accent)]", "p:label": "text-xs text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] mt-0.5" } })

// ─── Nav bottom ───────────────────────────────────────────────────────────────
const NavRow = tw.div({ base: "flex items-center justify-between mt-16 pt-6 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" })
const NavBtn = tw.a({
    base: "flex flex-col gap-0.5 px-4 py-3 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all text-sm",
    variants: { dir: { prev: "items-start", next: "items-end" } },
    defaultVariants: { dir: "next" },
    sub: {
        "span:hint": "text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)] uppercase tracking-wider",
        "span:label": "font-semibold",
    },
})

// ─── Data ─────────────────────────────────────────────────────────────────────
const TOPICS = [
    {
        order: "1 / 5",
        icon: "🗺️",
        href: "/learn/mentor/roadmap",
        title: "Roadmap Belajar CSS",
        desc: "Jalur belajar terstruktur dari nol sampai mahir — urutan topik yang optimal, estimasi waktu, dan milestone yang jelas.",
        type: "roadmap" as const,
        typeLabel: "Roadmap",
    },
    {
        order: "2 / 5",
        icon: "🧠",
        href: "/learn/mentor/cara-belajar-css",
        title: "Cara Belajar CSS Efektif",
        desc: "Mental model yang benar, kebiasaan belajar yang produktif, cara membaca dokumentasi, dan menghindari jebakan umum.",
        type: "guide" as const,
        typeLabel: "Panduan",
    },
    {
        order: "3 / 5",
        icon: "🔨",
        href: "/learn/mentor/project-ideas",
        title: "Ide Proyek Latihan",
        desc: "20+ proyek dari beginner ke advanced — setiap proyek melatih konsep CSS spesifik dengan spec yang jelas.",
        type: "project" as const,
        typeLabel: "Proyek",
    },
    {
        order: "4 / 5",
        icon: "🐛",
        href: "/learn/mentor/debugging-css",
        title: "Debugging CSS",
        desc: "Strategi sistematis untuk menemukan dan memperbaiki bug CSS — DevTools, isolation technique, dan common gotchas.",
        type: "debug" as const,
        typeLabel: "Debug",
    },
    {
        order: "5 / 5",
        icon: "📚",
        href: "/learn/mentor/resources",
        title: "Referensi & Resources",
        desc: "Koleksi referensi terbaik — docs, tools, cheat sheets, games, dan komunitas CSS yang worth following.",
        type: "resource" as const,
        typeLabel: "Referensi",
    },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MentorOverviewPage() {
    return (
        <Page>
            <TopBar>
                <TopBarInner>
                    <Breadcrumb>
                        <Breadcrumb.link href="/learn">Learn</Breadcrumb.link>
                        <Breadcrumb.sep>/</Breadcrumb.sep>
                        <Breadcrumb.curr>Mentor</Breadcrumb.curr>
                    </Breadcrumb>
                </TopBarInner>
            </TopBar>

            <Body>
                <PageTitle>Mentor CSS</PageTitle>
                <PageDesc>
                    Panduan, strategi, dan resources untuk belajar CSS secara efektif.
                    Bukan tentang syntax — tapi tentang cara berpikir, membangun mental model yang benar,
                    debugging yang sistematis, dan proyek nyata yang mengasah skill kamu.
                </PageDesc>
                <MentorBadge>🎓 Panduan belajar & strategi dari praktisi</MentorBadge>

                <HighlightRow>
                    <Stat>
                        <Stat.value>4 Level</Stat.value>
                        <Stat.label>Dasar → Medium → High → Advanced</Stat.label>
                    </Stat>
                    <Stat>
                        <Stat.value>26 Topik</Stat.value>
                        <Stat.label>Materi terstruktur & interaktif</Stat.label>
                    </Stat>
                    <Stat>
                        <Stat.value>20+ Proyek</Stat.value>
                        <Stat.label>Ide latihan dengan spec jelas</Stat.label>
                    </Stat>
                </HighlightRow>

                <Grid>
                    {TOPICS.map((topic) => (
                        <Card key={topic.href} href={topic.href}>
                            <CardIcon>{topic.icon}</CardIcon>
                            <CardTitle>{topic.title}</CardTitle>
                            <CardDesc>{topic.desc}</CardDesc>
                            <CardMeta>
                                <CardBadge>{topic.order}</CardBadge>
                                <CardTag type={topic.type}>{topic.typeLabel}</CardTag>
                            </CardMeta>
                        </Card>
                    ))}
                </Grid>

                <NavRow>
                    <NavBtn href="/learn/advandced" dir="prev">
                        <NavBtn.hint>← Previous</NavBtn.hint>
                        <NavBtn.label>CSS Advanced</NavBtn.label>
                    </NavBtn>
                    <NavBtn href="/learn/mentor/roadmap" dir="next">
                        <NavBtn.hint>Mulai →</NavBtn.hint>
                        <NavBtn.label>Roadmap Belajar</NavBtn.label>
                    </NavBtn>
                </NavRow>
            </Body>
        </Page>
    )
}
