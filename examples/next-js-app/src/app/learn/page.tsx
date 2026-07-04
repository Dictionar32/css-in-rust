/**
 * /learn — Overview landing page
 */
import { tw } from "tailwind-styled-v4"
import { LEARN_NAV } from "./nav"
import * as s from "./styles"

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
                        <s.LevelStripLink key={section.href} href={section.href}>
                            <span>{icon}</span>
                            <span>{label}</span>
                            <span>{section.items.length} topik</span>
                        </s.LevelStripLink>
                    )
                })}
            </StripRow>

            {/* ── Per-section topic list ── */}
            {LEARN_NAV.map((section) => (
                <SectionBlock key={section.href}>
                    <s.SectionHeadingLink href={section.href}>
                        {section.label}
                        <span>→</span>
                    </s.SectionHeadingLink>
                    <CardGrid>
                        {section.items.map((item) => (
                            <s.CardItemLink key={item.href} href={item.href}>
                                {item.icon && (
                                    <span>{item.icon}</span>
                                )}
                                <span>{item.title}</span>
                            </s.CardItemLink>
                        ))}
                    </CardGrid>
                </SectionBlock>
            ))}
        </Body>
    )
}
