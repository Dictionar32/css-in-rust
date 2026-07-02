/**
 * CSS Medium — Overview
 */
import { tw } from "tailwind-styled-v4"
import Link from "next/link"

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
    base: "inline-block mt-3 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full",
    variants: {
        order: {
            "1": "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
            "2": "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
            "3": "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
            "4": "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
            "5": "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
            "6": "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
            "7": "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
            "8": "bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent)]",
        },
    },
    defaultVariants: { order: "1" },
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
        order: "1" as const,
        icon: "🎯",
        href: "/learn/medium/selectors-specificity",
        title: "Selectors & Specificity",
        desc: "Semua jenis selector CSS, pseudo-class, pseudo-element, combinator, :is() :where() :has(), dan cara kerja specificity cascade.",
    },
    {
        order: "2" as const,
        icon: "🎨",
        href: "/learn/medium/custom-properties",
        title: "Custom Properties",
        desc: "CSS variables, inheritance, scoping, dynamic theming, dan integrasi dengan JavaScript.",
    },
    {
        order: "3" as const,
        icon: "✍️",
        href: "/learn/medium/typography",
        title: "Typography",
        desc: "Font loading, fluid type scale, line-height, letter-spacing, text utilities, dan variable fonts.",
    },
    {
        order: "4" as const,
        icon: "🌈",
        href: "/learn/medium/colors-gradients",
        title: "Colors & Gradients",
        desc: "Color spaces (oklch, hsl), color-mix(), linear/radial/conic gradients, dan modern color functions.",
    },
    {
        order: "5" as const,
        icon: "✨",
        href: "/learn/medium/transitions-animations",
        title: "Transitions & Animations",
        desc: "transition, @keyframes, animation properties, timing functions, dan best practices performa.",
    },
    {
        order: "6" as const,
        icon: "🔄",
        href: "/learn/medium/transforms",
        title: "Transforms",
        desc: "translate, rotate, scale, skew, transform-origin, perspective, dan 3D transforms.",
    },
    {
        order: "7" as const,
        icon: "🪄",
        href: "/learn/medium/visual-effects",
        title: "Visual Effects",
        desc: "filter, backdrop-filter, box-shadow, text-shadow, clip-path, mask, dan blend modes.",
    },
    {
        order: "8" as const,
        icon: "🏗️",
        href: "/learn/medium/css-architecture",
        title: "CSS Architecture",
        desc: "BEM, CUBE CSS, utility-first, design tokens, CSS Modules, component-scoped styles, dan naming strategies.",
    },
] as const

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MediumOverviewPage() {
    return (
        <Page>
            <TopBar>
                <TopBarInner>
                    <Breadcrumb>
                        <Breadcrumb.link href="/learn">Learn</Breadcrumb.link>
                        <Breadcrumb.sep>/</Breadcrumb.sep>
                        <Breadcrumb.curr>Medium</Breadcrumb.curr>
                    </Breadcrumb>
                </TopBarInner>
            </TopBar>

            <Body>
                <PageTitle>CSS Medium</PageTitle>
                <PageDesc>
                    Topik-topik intermediate yang membangun pemahaman lebih dalam tentang CSS — dari cara kerja selector dan cascade,
                    hingga custom properties, tipografi, warna, animasi, transform, efek visual, dan arsitektur CSS yang scalable.
                    Cocok setelah kamu menguasai dasar layout (box model, flexbox, grid, positioning).
                </PageDesc>

                <Grid>
                    {TOPICS.map((topic) => (
                        <Card key={topic.href} href={topic.href}>
                            <CardIcon>{topic.icon}</CardIcon>
                            <CardTitle>{topic.title}</CardTitle>
                            <CardDesc>{topic.desc}</CardDesc>
                            <CardBadge order={topic.order}>{topic.order} / 8</CardBadge>
                        </Card>
                    ))}
                </Grid>

                <NavRow>
                    <NavBtn href="/learn/dasar-css" dir="prev">
                        <NavBtn.hint>← Previous</NavBtn.hint>
                        <NavBtn.label>Dasar CSS</NavBtn.label>
                    </NavBtn>
                    <NavBtn href="/learn/medium/selectors-specificity" dir="next">
                        <NavBtn.hint>Start →</NavBtn.hint>
                        <NavBtn.label>Selectors & Specificity</NavBtn.label>
                    </NavBtn>
                </NavRow>
            </Body>
        </Page>
    )
}
