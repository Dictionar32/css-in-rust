/**
 * /learn — Overview landing page
 */
import Link from "next/link"
import { tw } from "tailwind-styled-v4"
import { LEARN_NAV } from "./nav"

// ─── Layout ───────────────────────────────────────────────────────────────────

const Body = tw.div({ base: "max-w-3xl mx-auto px-6 py-12 pb-24" })
const PageTitle = tw.h1({ base: "text-3xl font-bold tracking-tight mb-3" })
const PageDesc = tw.p({ base: "text-base text-[color-mix(in_srgb,var(--foreground)_60%,transparent)] mb-10 leading-relaxed max-w-2xl" })

// ─── Level strips ─────────────────────────────────────────────────────────────

const StripRow = tw.div({ base: "grid grid-cols-2 sm:grid-cols-5 gap-3 mb-12" })

// ─── Section card grid ────────────────────────────────────────────────────────

const SectionBlock = tw.div({ base: "mb-10" })
const CardGrid = tw.div({ base: "grid grid-cols-1 sm:grid-cols-2 gap-2" })

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LearnPage() {
    const totalTopics = LEARN_NAV.reduce((sum, s) => sum + s.items.length, 0)

    return (
        <Body>
            <PageTitle>Belajar CSS & tailwind-styled-v4</PageTitle>
            <PageDesc>
                {totalTopics} topik terstruktur — dari fondasi CSS sampai fitur terbaru Baseline 2024.
                Setiap topik dilengkapi contoh interaktif, code snippets, dan latihan.
            </PageDesc>

            {/* ── Level strips ── */}
            <StripRow>
                {LEARN_NAV.map((section) => {
                    const icon = section.label.split(" ")[0]
                    const label = section.label.replace(/^..\s/, "")
                    return (
                        <Link
                            key={section.href}
                            href={section.href}
                            className="group flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all text-center"
                        >
                            <span className="text-2xl">{icon}</span>
                            <span className="text-[11px] font-semibold group-hover:text-[var(--accent)] transition-colors">{label}</span>
                            <span className="text-[10px] text-[color-mix(in_srgb,var(--foreground)_40%,transparent)]">{section.items.length} topik</span>
                        </Link>
                    )
                })}
            </StripRow>

            {/* ── Per-section topic list ── */}
            {LEARN_NAV.map((section) => (
                <SectionBlock key={section.href}>
                    <Link
                        href={section.href}
                        className="flex items-center gap-2 text-lg font-bold mb-3 hover:text-[var(--accent)] transition-colors group"
                    >
                        {section.label}
                        <span className="opacity-0 group-hover:opacity-100 text-[var(--accent)] transition-opacity">→</span>
                    </Link>
                    <CardGrid>
                        {section.items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)] hover:border-[var(--accent)] hover:shadow-sm transition-all"
                            >
                                {item.icon && (
                                    <span className="text-base shrink-0 w-6 text-center">{item.icon}</span>
                                )}
                                <span className="text-sm font-medium group-hover:text-[var(--accent)] transition-colors">
                                    {item.title}
                                </span>
                            </Link>
                        ))}
                    </CardGrid>
                </SectionBlock>
            ))}
        </Body>
    )
}
