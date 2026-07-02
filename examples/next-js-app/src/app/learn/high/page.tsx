/**
 * CSS High — Overview
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
const CardBadge = tw.span({
    base: "inline-block mt-3 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
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
        icon: "⚡",
        href: "/learn/high/css-performance",
        title: "CSS Performance",
        desc: "Browser rendering pipeline, contain, content-visibility, will-change, reflow vs repaint, layer promotion, CLS, dan font loading.",
    },
    {
        order: "2 / 6",
        icon: "🪄",
        href: "/learn/high/houdini",
        title: "CSS Houdini",
        desc: "Paint Worklet, CSS Typed OM, Properties & Values API, Layout Worklet, dan @font-palette-values.",
    },
    {
        order: "3 / 6",
        icon: "🏗️",
        href: "/learn/high/css-architecture-patterns",
        title: "CSS Architecture Patterns",
        desc: "BEM, CUBE CSS, utility-first, design tokens, CSS Modules, component-scoped styles, dan scalable CSS di monorepo.",
    },
    {
        order: "4 / 6",
        icon: "♿",
        href: "/learn/high/accessibility-css",
        title: "Accessibility CSS",
        desc: ":focus-visible, color contrast WCAG, forced colors, prefers-reduced-motion, screen reader utilities, dan :aria-* pseudo-classes.",
    },
    {
        order: "5 / 6",
        icon: "🔗",
        href: "/learn/high/css-javascript",
        title: "CSS & JavaScript",
        desc: "CSSOM, Web Animations API, ResizeObserver, IntersectionObserver, matchMedia(), dan Constructable Stylesheet.",
    },
    {
        order: "6 / 6",
        icon: "📐",
        href: "/learn/high/advanced-layout-patterns",
        title: "Advanced Layout Patterns",
        desc: "Sticky footer, full-bleed, holy grail, sidebar patterns, card patterns, center anything, RAM pattern, dan spacing system.",
    },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HighOverviewPage() {
    return (
        <Page>
            <TopBar>
                <TopBarInner>
                    <Breadcrumb>
                        <Breadcrumb.link href="/learn">Learn</Breadcrumb.link>
                        <Breadcrumb.sep>/</Breadcrumb.sep>
                        <Breadcrumb.curr>High</Breadcrumb.curr>
                    </Breadcrumb>
                </TopBarInner>
            </TopBar>

            <Body>
                <PageTitle>CSS High Level</PageTitle>
                <PageDesc>
                    Topik-topik advanced yang membangun pemahaman mendalam tentang CSS —
                    dari cara kerja browser rendering pipeline dan optimasi performa,
                    hingga Houdini APIs, arsitektur CSS yang scalable, aksesibilitas,
                    integrasi dengan JavaScript, dan pola layout kompleks.
                    Cocok setelah kamu menguasai topik intermediate (medium).
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
                    <NavBtn href="/learn/medium" dir="prev">
                        <NavBtn.hint>← Previous</NavBtn.hint>
                        <NavBtn.label>Medium</NavBtn.label>
                    </NavBtn>
                    <NavBtn href="/learn/high/performance" dir="next">
                        <NavBtn.hint>Start →</NavBtn.hint>
                        <NavBtn.label>CSS Performance</NavBtn.label>
                    </NavBtn>
                </NavRow>
            </Body>
        </Page>
    )
}
