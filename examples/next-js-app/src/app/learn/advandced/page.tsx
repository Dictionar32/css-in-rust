/**
 * CSS Advanced — Overview
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
const BaselineBadge = tw.span({ base: "inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full mb-10 bg-emerald-100 text-emerald-700 border border-emerald-200" })

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
const StatusBadge = tw.span({
    base: "text-[10px] font-semibold px-2 py-0.5 rounded-full",
    variants: {
        status: {
            baseline: "bg-emerald-100 text-emerald-700",
            newly: "bg-blue-100 text-blue-700",
            experimental: "bg-amber-100 text-amber-700",
        },
    },
    defaultVariants: { status: "baseline" },
})

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
        order: "1 / 6",
        icon: "⚓",
        href: "/learn/advandced/anchor-positioning",
        title: "CSS Anchor Positioning",
        desc: "Posisikan tooltip, popover, dan dropdown relatif ke elemen anchor — tanpa JavaScript positioning. anchor-name, position-anchor, inset-area.",
        status: "baseline" as const,
        statusLabel: "Baseline 2024",
    },
    {
        order: "2 / 6",
        icon: "🏗️",
        href: "/learn/advandced/subgrid",
        title: "CSS Subgrid",
        desc: "Nested grid yang ikut sizing track dari parent grid — solusi sempurna untuk card alignment dan form layout yang simetris.",
        status: "baseline" as const,
        statusLabel: "Baseline 2023",
    },
    {
        order: "3 / 6",
        icon: "📦",
        href: "/learn/advandced/container-style-queries",
        title: "Container & Style Queries",
        desc: "Container queries untuk layout berbasis ukuran container, style queries untuk conditional CSS berdasarkan nilai custom property.",
        status: "baseline" as const,
        statusLabel: "Baseline 2023",
    },
    {
        order: "4 / 6",
        icon: "🪟",
        href: "/learn/advandced/popover-api",
        title: "Popover API",
        desc: "Native popover dengan top-layer, light-dismiss, dan accessibility built-in. Tanpa JS, tanpa z-index hell, tanpa focus trap manual.",
        status: "baseline" as const,
        statusLabel: "Baseline 2024",
    },
    {
        order: "5 / 6",
        icon: "🎬",
        href: "/learn/advandced/view-transitions-advanced",
        title: "View Transitions Advanced",
        desc: "Cross-document view transitions, shared element transitions, @view-transition at-rule, dan integrasi dengan Next.js App Router.",
        status: "newly" as const,
        statusLabel: "Baseline 2024",
    },
    {
        order: "6 / 6",
        icon: "🔮",
        href: "/learn/advandced/css-functions-future",
        title: "CSS Functions & The Future",
        desc: "interpolate-size, light-dark(), field-sizing, @function (coming), if() conditional, dan fitur CSS yang akan datang.",
        status: "newly" as const,
        statusLabel: "Partially Baseline",
    },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdvancedOverviewPage() {
    return (
        <Page>
            <TopBar>
                <TopBarInner>
                    <Breadcrumb>
                        <Breadcrumb.link href="/learn">Learn</Breadcrumb.link>
                        <Breadcrumb.sep>/</Breadcrumb.sep>
                        <Breadcrumb.curr>Advanced</Breadcrumb.curr>
                    </Breadcrumb>
                </TopBarInner>
            </TopBar>

            <Body>
                <PageTitle>CSS Advanced</PageTitle>
                <PageDesc>
                    Fitur-fitur CSS terbaru yang sudah masuk Baseline atau baru saja didukung semua browser modern.
                    Dari anchor positioning, subgrid, container queries, Popover API, view transitions cross-document,
                    hingga CSS functions generasi berikutnya — semua yang perlu kamu tahu untuk CSS di 2024–2025.
                </PageDesc>
                <BaselineBadge>✅ Semua topik mengacu pada fitur Baseline atau Newly Available 2023–2025</BaselineBadge>

                <Grid>
                    {TOPICS.map((topic) => (
                        <Card key={topic.href} href={topic.href}>
                            <CardIcon>{topic.icon}</CardIcon>
                            <CardTitle>{topic.title}</CardTitle>
                            <CardDesc>{topic.desc}</CardDesc>
                            <CardMeta>
                                <CardBadge>{topic.order}</CardBadge>
                                <StatusBadge status={topic.status}>{topic.statusLabel}</StatusBadge>
                            </CardMeta>
                        </Card>
                    ))}
                </Grid>

                <NavRow>
                    <NavBtn href="/learn/high" dir="prev">
                        <NavBtn.hint>← Previous</NavBtn.hint>
                        <NavBtn.label>High Level</NavBtn.label>
                    </NavBtn>
                    <NavBtn href="/learn/advandced/anchor-positioning" dir="next">
                        <NavBtn.hint>Start →</NavBtn.hint>
                        <NavBtn.label>Anchor Positioning</NavBtn.label>
                    </NavBtn>
                </NavRow>
            </Body>
        </Page>
    )
}
