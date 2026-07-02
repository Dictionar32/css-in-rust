/**
 * Single source of truth untuk semua navigasi di /learn
 * Dipakai oleh: layout.tsx (sidebar), semua index page (card grid), PageNav (prev/next)
 */

export interface NavItem {
    title: string
    href: string
    /** Short description untuk card grid di index page */
    desc?: string
    icon?: string
}

export interface NavSection {
    label: string
    /** Href index/overview section */
    href: string
    items: NavItem[]
}

export const LEARN_NAV: NavSection[] = [
    {
        label: "🎓 Mentor",
        href: "/learn/mentor",
        items: [
            { title: "Roadmap Belajar", href: "/learn/mentor/roadmap", icon: "🗺️" },
            { title: "Cara Belajar CSS", href: "/learn/mentor/cara-belajar-css", icon: "🧠" },
            { title: "Ide Proyek Latihan", href: "/learn/mentor/project-ideas", icon: "🔨" },
            { title: "Debugging CSS", href: "/learn/mentor/debugging-css", icon: "🐛" },
            { title: "Referensi & Resources", href: "/learn/mentor/resources", icon: "📚" },
        ],
    },
    {
        label: "📦 Dasar CSS",
        href: "/learn/dasar-css",
        items: [
            { title: "Box Model", href: "/learn/dasar-css/box-model", icon: "📦" },
            { title: "Normal Flow", href: "/learn/dasar-css/normal-flow", icon: "🌊" },
            { title: "Positioning", href: "/learn/dasar-css/positioning", icon: "📌" },
            { title: "Flexbox", href: "/learn/dasar-css/flexbox", icon: "💪" },
            { title: "CSS Grid", href: "/learn/dasar-css/css-grid", icon: "🔲" },
            { title: "Responsive & Container Queries", href: "/learn/dasar-css/responsive&&container-queries", icon: "📱" },
        ],
    },
    {
        label: "🎯 Medium",
        href: "/learn/medium",
        items: [
            { title: "Selectors & Specificity", href: "/learn/medium/selectors-specificity", icon: "🎯" },
            { title: "Custom Properties", href: "/learn/medium/custom-properties", icon: "🎨" },
            { title: "Typography", href: "/learn/medium/typography", icon: "✍️" },
            { title: "Colors & Gradients", href: "/learn/medium/colors-gradients", icon: "🌈" },
            { title: "Transitions & Animations", href: "/learn/medium/transitions-animations", icon: "✨" },
            { title: "Transforms", href: "/learn/medium/transforms", icon: "🔄" },
            { title: "Visual Effects", href: "/learn/medium/visual-effects", icon: "🪄" },
            { title: "CSS Architecture", href: "/learn/medium/css-architecture", icon: "🏗️" },
        ],
    },
    {
        label: "⚡ High",
        href: "/learn/high",
        items: [
            { title: "CSS Performance", href: "/learn/high/css-performance", icon: "⚡" },
            { title: "CSS Houdini", href: "/learn/high/houdini", icon: "🪄" },
            { title: "CSS Architecture Patterns", href: "/learn/high/css-architecture-patterns", icon: "🏗️" },
            { title: "Accessibility CSS", href: "/learn/high/accessibility-css", icon: "♿" },
            { title: "CSS & JavaScript", href: "/learn/high/css-javascript", icon: "🔗" },
            { title: "Advanced Layout Patterns", href: "/learn/high/advanced-layout-patterns", icon: "📐" },
        ],
    },
    {
        label: "🔮 Advanced",
        href: "/learn/advandced",
        items: [
            { title: "Anchor Positioning", href: "/learn/advandced/anchor-positioning", icon: "⚓" },
            { title: "CSS Subgrid", href: "/learn/advandced/subgrid", icon: "🏗️" },
            { title: "Container & Style Queries", href: "/learn/advandced/container-style-queries", icon: "📦" },
            { title: "Popover API", href: "/learn/advandced/popover-api", icon: "🪟" },
            { title: "View Transitions Advanced", href: "/learn/advandced/view-transitions-advanced", icon: "🎬" },
            { title: "CSS Functions & The Future", href: "/learn/advandced/css-functions-future", icon: "🔮" },
        ],
    },
]

/** Flatten semua items menjadi array urut untuk prev/next navigation */
export const LEARN_FLAT: NavItem[] = LEARN_NAV.flatMap((section) => [
    // masukkan section index page itu sendiri sebagai item pertama setiap grup
    { title: section.label.replace(/^..\s/, ""), href: section.href },
    ...section.items,
])

/** Cari prev/next berdasarkan pathname */
export function getPrevNext(pathname: string): { prev: NavItem | null; next: NavItem | null } {
    // strip query string dan trailing slash
    const clean = pathname.replace(/\?.*$/, "").replace(/\/$/, "")
    const idx = LEARN_FLAT.findIndex((item) => item.href === clean)
    if (idx === -1) return { prev: null, next: null }
    return {
        prev: idx > 0 ? LEARN_FLAT[idx - 1] : null,
        next: idx < LEARN_FLAT.length - 1 ? LEARN_FLAT[idx + 1] : null,
    }
}
