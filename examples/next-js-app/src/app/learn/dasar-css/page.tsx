/**
 * CSS Dasar — Overview
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
const PageDesc = tw.p({ base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-12 leading-relaxed max-w-2xl" })

// ─── Topic card ───────────────────────────────────────────────────────────────
const Grid = tw.div({ base: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" })
const Card = tw.a({
    base: "group block rounded-xl border border-[color-mix(in_srgb,var(--foreground)_10%,transparent)] bg-[var(--surface)] p-5 hover:border-[var(--accent)] hover:shadow-sm transition-all",
})
const CardIcon = tw.div({ base: "text-2xl mb-3" })
const CardTitle = tw.h2({ base: "text-sm font-semibold mb-1 group-hover:text-[var(--accent)] transition-colors" })
const CardDesc = tw.p({ base: "text-xs text-[color-mix(in_srgb,var(--foreground)_50%,transparent)] leading-relaxed" })
const CardBadge = tw.span({ base: "inline-block mt-3 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]" })

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
        icon: "📦",
        href: "/learn/dasar-css/box-model",
        title: "Box Model",
        desc: "content, padding, border, margin — cara browser menghitung ukuran elemen. box-sizing, margin collapse, dan visual formatting model.",
    },
    {
        order: "2 / 6",
        icon: "🌊",
        href: "/learn/dasar-css/normal-flow",
        title: "Normal Flow",
        desc: "Block vs inline, display property, flow konteks, dan bagaimana browser menempatkan elemen secara default.",
    },
    {
        order: "3 / 6",
        icon: "📌",
        href: "/learn/dasar-css/positioning",
        title: "Positioning",
        desc: "static, relative, absolute, fixed, sticky — cara mengontrol posisi elemen di luar normal flow.",
    },
    {
        order: "4 / 6",
        icon: "💪",
        href: "/learn/dasar-css/flexbox",
        title: "Flexbox",
        desc: "1D layout — container dan item properties, main/cross axis, alignment, flex-grow/shrink/basis, dan order.",
    },
    {
        order: "5 / 6",
        icon: "🔲",
        href: "/learn/dasar-css/css-grid",
        title: "CSS Grid",
        desc: "2D layout — grid tracks, template areas, auto-placement, subgrid, dan kombinasi grid + flexbox.",
    },
    {
        order: "6 / 6",
        icon: "📱",
        href: "/learn/dasar-css/responsive&&container-queries",
        title: "Responsive & Container Queries",
        desc: "Media queries, breakpoints, viewport units, @container queries, dan strategi mobile-first design.",
    },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DasarCssOverviewPage() {
    return (
        <Page>
            <TopBar>
                <TopBarInner>
                    <Breadcrumb>
                        <Breadcrumb.link href="/learn">Learn</Breadcrumb.link>
                        <Breadcrumb.sep>/</Breadcrumb.sep>
                        <Breadcrumb.curr>Dasar CSS</Breadcrumb.curr>
                    </Breadcrumb>
                </TopBarInner>
            </TopBar>

            <Body>
                <PageTitle>CSS Dasar</PageTitle>
                <PageDesc>
                    Fondasi layout CSS — mulai dari cara browser menghitung ukuran elemen (box model),
                    normal flow, positioning, hingga sistem layout modern Flexbox dan CSS Grid,
                    serta cara membangun desain yang responsif. Topik-topik ini adalah prasyarat
                    sebelum melanjutkan ke level medium dan high.
                </PageDesc>

                <Grid>
                    {TOPICS.map((topic) => (
                        <Card key={topic.href} href={topic.href}>
                            <CardIcon>{topic.icon}</CardIcon>
                            <CardTitle>{topic.title}</CardTitle>
                            <CardDesc>{topic.desc}</CardDesc>
                            <CardBadge>{topic.order}</CardBadge>
                        </Card>
                    ))}
                </Grid>

                <NavRow>
                    <NavBtn href="/learn" dir="prev">
                        <NavBtn.hint>← Back</NavBtn.hint>
                        <NavBtn.label>Learn</NavBtn.label>
                    </NavBtn>
                    <NavBtn href="/learn/dasar-css/box-model" dir="next">
                        <NavBtn.hint>Start →</NavBtn.hint>
                        <NavBtn.label>Box Model</NavBtn.label>
                    </NavBtn>
                </NavRow>
            </Body>
        </Page>
    )
}
