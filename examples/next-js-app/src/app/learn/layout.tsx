/**
 * /learn layout — sidebar nav + konten area
 * Berlaku untuk semua route di bawah /learn/*
 */
import Link from "next/link"
import { headers } from "next/headers"
import { tw } from "tailwind-styled-v4"
import { LEARN_NAV } from "./nav"

// ─── Shell ────────────────────────────────────────────────────────────────────

const Shell = tw.div({ base: "min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col" })

// ─── Top bar ──────────────────────────────────────────────────────────────────

const TopBar = tw.header({
    base: "sticky top-0 z-50 h-12 flex items-center border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--surface)_90%,transparent)] backdrop-blur-md shrink-0",
})

const TopBarInner = tw.div({ base: "max-w-screen-2xl mx-auto px-4 w-full flex items-center gap-4" })

// ─── Body (sidebar + main) ────────────────────────────────────────────────────

const BodyRow = tw.div({ base: "flex flex-1 max-w-screen-2xl mx-auto w-full" })

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const Sidebar = tw.nav({
    base: "hidden md:flex flex-col w-60 shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto border-r border-[color-mix(in_srgb,var(--foreground)_6%,transparent)] bg-[var(--surface)] py-6 gap-5",
    attrs: { "aria-label": "Dokumentasi navigasi" },
})

const SidebarSection = tw.div({ base: "px-3 flex flex-col gap-0.5" })

// ─── Main content ─────────────────────────────────────────────────────────────

const Main = tw.main({
    base: "flex-1 min-w-0",
    attrs: { "data-learn-layout": "" },
})

// ─── Mobile nav bar (bottom) ──────────────────────────────────────────────────

const MobileNav = tw.nav({
    base: "md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] backdrop-blur-md flex h-14",
    attrs: { "aria-label": "Navigasi mobile" },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPathname(): Promise<string> {
    try {
        const h = await headers()
        return h.get("x-pathname") ?? "/"
    } catch {
        return "/"
    }
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
    const pathname = await getPathname()

    return (
        <Shell>
            {/* ── Top bar ── */}
            <TopBar>
                <TopBarInner>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm font-semibold hover:text-[var(--accent)] transition-colors shrink-0"
                    >
                        <span>🦀</span>
                        <span>tailwind-styled-v4</span>
                    </Link>
                    <span className="text-[color-mix(in_srgb,var(--foreground)_20%,transparent)] select-none">/</span>
                    <span className="text-sm text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">Learn</span>
                    <div className="flex-1" />
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)] transition-colors hidden sm:block"
                    >
                        GitHub ↗
                    </a>
                </TopBarInner>
            </TopBar>

            <BodyRow>
                {/* ── Sidebar ── */}
                <Sidebar>
                    {/* Overview */}
                    <SidebarSection>
                        <Link
                            href="/learn"
                            className={[
                                "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                                pathname === "/learn"
                                    ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] font-semibold"
                                    : "text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] hover:text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                            ].join(" ")}
                        >
                            <span className="text-sm shrink-0 w-5 text-center">🏠</span>
                            Overview
                        </Link>
                    </SidebarSection>

                    {/* Sections */}
                    {LEARN_NAV.map((section) => (
                        <SidebarSection key={section.href}>
                            {/* Group label */}
                            <Link
                                href={section.href}
                                className="text-[10px] font-bold uppercase tracking-widest text-[color-mix(in_srgb,var(--foreground)_35%,transparent)] mb-1.5 hover:text-[var(--accent)] transition-colors block px-2"
                            >
                                {section.label}
                            </Link>
                            {/* Items */}
                            {section.items.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={[
                                            "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
                                            isActive
                                                ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] font-semibold"
                                                : "text-[color-mix(in_srgb,var(--foreground)_65%,transparent)] hover:text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]",
                                        ].join(" ")}
                                    >
                                        {item.icon && (
                                            <span className="text-sm shrink-0 w-5 text-center">{item.icon}</span>
                                        )}
                                        {item.title}
                                    </Link>
                                )
                            })}
                        </SidebarSection>
                    ))}
                </Sidebar>

                {/* ── Content ── */}
                <Main>{children}</Main>
            </BodyRow>

            {/* ── Mobile bottom nav ── */}
            <MobileNav>
                {LEARN_NAV.map((section) => {
                    const isActive = pathname.startsWith(section.href)
                    const icon = section.label.split(" ")[0]
                    const shortLabel = section.label.replace(/^..\s/, "").split(" ")[0]
                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            className={[
                                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                                isActive
                                    ? "text-[var(--accent)]"
                                    : "text-[color-mix(in_srgb,var(--foreground)_45%,transparent)] hover:text-[var(--foreground)]",
                            ].join(" ")}
                        >
                            <span>{icon}</span>
                            <span>{shortLabel}</span>
                        </Link>
                    )
                })}
            </MobileNav>
        </Shell>
    )
}
