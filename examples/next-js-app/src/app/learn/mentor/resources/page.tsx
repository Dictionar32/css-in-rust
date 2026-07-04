/**
 * Mentor — Referensi & Resources CSS
 */
"use client"
import { useState } from "react"
import {
    Page, TopBar, TopBarInner, Breadcrumb, Body, Content, Toc, TocLabel, TocItem,
    PageTitle, PageDesc, Divider, Section, H2, H3, P, IC, Callout,
    PageNav, NavBtn,
    ResourceLink, SkillTag, TipCard,
    GameGrid, GameCard, GameIconBox, GameContent, GameTitle, GameDesc, GameTagContainer,
} from "../styles"

const TOC = [
    { id: "docs", label: "Dokumentasi Resmi" },
    { id: "tools", label: "Tools & Utilities" },
    { id: "games", label: "Games Belajar CSS" },
    { id: "references", label: "Cheat Sheets" },
    { id: "blogs", label: "Blog & Newsletter" },
    { id: "communities", label: "Komunitas" },
    { id: "youtube", label: "YouTube Channels" },
]

const DOCS = [
    { icon: "📖", title: "MDN Web Docs — CSS", desc: "Referensi CSS paling komprehensif dan akurat, ditulis oleh browser engineers", href: "https://developer.mozilla.org/en-US/docs/Web/CSS", tags: ["reference", "spec"] },
    { icon: "🔬", title: "CSS Specification (W3C)", desc: "Spec CSS resmi W3C — untuk memahami perilaku yang paling detail dan edge cases", href: "https://www.w3.org/Style/CSS/specs.en.html", tags: ["spec", "advanced"] },
    { icon: "🌐", title: "Can I Use", desc: "Browser compatibility table untuk setiap fitur CSS — selalu cek sebelum pakai fitur baru", href: "https://caniuse.com", tags: ["compatibility", "browsers"] },
    { icon: "📊", title: "Baseline Web Features", desc: "Fitur yang sudah aman digunakan di semua browser modern — dari web.dev", href: "https://web.dev/baseline", tags: ["compatibility", "baseline"] },
    { icon: "📚", title: "CSS-Tricks", desc: "Referensi praktis dengan contoh code lengkap — khususnya Flexbox dan Grid guides legendaris", href: "https://css-tricks.com", tags: ["tutorials", "reference"] },
    { icon: "🦊", title: "web.dev (Google)", desc: "Best practices dan guides dari Google Chrome team — performa, aksesibilitas, dan CSS modern", href: "https://web.dev/learn/css", tags: ["guides", "performance"] },
]

const TOOLS = [
    { icon: "✏️", title: "CodePen", desc: "Online CSS playground terbaik — untuk prototyping dan sharing code snippets", href: "https://codepen.io", tags: ["playground"] },
    { icon: "🎨", title: "CSS Gradient Generator", desc: "Buat linear, radial, dan conic gradient secara visual — cssgradient.io", href: "https://cssgradient.io", tags: ["generator", "gradients"] },
    { icon: "📐", title: "Cubic Bezier", desc: "Generator visual untuk cubic-bezier timing function — lihat preview animasi realtime", href: "https://cubic-bezier.com", tags: ["animation", "generator"] },
    { icon: "🔲", title: "CSS Grid Generator", desc: "Grid layout builder visual — set rows/columns dan copy kode hasilnya", href: "https://cssgrid-generator.netlify.app", tags: ["grid", "generator"] },
    { icon: "💧", title: "Haikei", desc: "Generator SVG shapes, waves, dan blobs untuk background dekoratif", href: "https://haikei.app", tags: ["generator", "svg"] },
    { icon: "🔑", title: "Specificity Calculator", desc: "Kalkulator specificity CSS — paste selector, lihat nilai (a-b-c) secara visual", href: "https://specificity.keegan.st", tags: ["specificity", "debug"] },
    { icon: "🌈", title: "OKLCH Color Picker", desc: "Color picker untuk oklch color space — perceptually uniform, bagus untuk design system", href: "https://oklch.com", tags: ["color", "oklch"] },
    { icon: "♿", title: "Colour Contrast Checker", desc: "Cek WCAG color contrast ratio antara dua warna — leaveawebsite.com", href: "https://webaim.org/resources/contrastchecker", tags: ["accessibility", "a11y"] },
    { icon: "🔤", title: "Font Style Matcher", desc: "Match font metrics antara system font dan web font untuk mengurangi CLS", href: "https://meowni.ca/font-style-matcher", tags: ["typography", "performance"] },
    { icon: "📏", title: "CSS Clamp Calculator", desc: "Generate clamp() values untuk fluid typography dan spacing dari dua breakpoint", href: "https://utopia.fyi/type/calculator", tags: ["typography", "fluid"] },
]

const GAMES = [
    { icon: "🐸", title: "Flexbox Froggy", desc: "Belajar Flexbox dengan menggerakkan katak ke lily pad — 24 level", href: "https://flexboxfroggy.com", tags: ["flexbox", "beginner"] },
    { icon: "🏡", title: "Grid Garden", desc: "Belajar CSS Grid dengan berkebun — 28 level", href: "https://cssgridgarden.com", tags: ["grid", "beginner"] },
    { icon: "🌮", title: "Flexbox Zombies", desc: "Game RPG untuk belajar flexbox yang sangat detail — 12 chapter, 25 level", href: "https://flexboxzombies.com", tags: ["flexbox", "intermediate"] },
    { icon: "🎯", title: "CSS Diner", desc: "Belajar CSS selectors dengan memilih makanan — 32 level dari basic ke advanced", href: "https://flukeout.github.io", tags: ["selectors", "beginner"] },
    { icon: "🎨", title: "CSS Battle", desc: "Kompetisi CSS — reproduce target gambar dengan CSS sesingkat mungkin", href: "https://cssbattle.dev", tags: ["challenge", "intermediate"] },
    { icon: "🏆", title: "100 Days of CSS", desc: "100 tantangan CSS harian — dari sederhana ke complex, bagus untuk konsistensi", href: "https://100dayscss.com", tags: ["challenge", "all-levels"] },
]

const CHEAT_SHEETS = [
    { icon: "📋", title: "Flexbox Cheatsheet — CSS-Tricks", desc: "Guide visual lengkap semua flexbox properties dengan ilustrasi", href: "https://css-tricks.com/snippets/css/a-guide-to-flexbox", tags: ["flexbox"] },
    { icon: "📋", title: "Grid Cheatsheet — CSS-Tricks", desc: "Guide visual lengkap semua CSS Grid properties — selalu buka ini saat coding", href: "https://css-tricks.com/snippets/css/complete-guide-grid", tags: ["grid"] },
    { icon: "📋", title: "Selectors Reference — MDN", desc: "Semua CSS selector dengan contoh dan browser support", href: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors", tags: ["selectors"] },
    { icon: "📋", title: "Easing Functions Cheatsheet", desc: "Visual preview semua easing functions yang umum digunakan", href: "https://easings.net", tags: ["animation"] },
    { icon: "📋", title: "CSS Scroll Snap", desc: "Guide lengkap CSS scroll snapping dengan playground interaktif", href: "https://css-tricks.com/practical-css-scroll-snapping", tags: ["scroll-snap"] },
]

const BLOGS = [
    { icon: "✍️", title: "Josh Comeau's CSS Blog", desc: "Artikel CSS mendalam dengan penjelasan visual yang exceptional", href: "https://www.joshwcomeau.com", tags: ["articles", "visual"] },
    { icon: "✍️", title: "Ahmad Shadeed", desc: "Artikel CSS praktis dengan focus pada debugging dan edge cases", href: "https://ishadeed.com", tags: ["articles", "debugging"] },
    { icon: "✍️", title: "Lea Verou", desc: "CSS deep dives dari spec editor — sangat technical dan mendalam", href: "https://lea.verou.me", tags: ["articles", "advanced"] },
    { icon: "✍️", title: "Smashing Magazine CSS", desc: "Artikel CSS berkualitas tinggi dari praktisi industri", href: "https://www.smashingmagazine.com/category/css", tags: ["articles"] },
    { icon: "📰", title: "CSS Weekly Newsletter", desc: "Rangkuman artikel, tutorial, dan tools CSS terbaru setiap minggu", href: "https://css-weekly.com", tags: ["newsletter"] },
    { icon: "📰", title: "Piccalilli Newsletter", desc: "Newsletter CSS modern dari Andy Bell — fokus ke CSS terbaru", href: "https://piccalil.li", tags: ["newsletter", "modern-css"] },
]

export default function ResourcesPage() {
    const [activeSection, setActiveSection] = useState("docs")

    return (
        <Page>
            <TopBar><TopBarInner>
                <Breadcrumb>
                    <Breadcrumb.link href="/learn">Learn</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.link href="/learn/mentor">Mentor</Breadcrumb.link><Breadcrumb.sep>/</Breadcrumb.sep>
                    <Breadcrumb.curr>Resources</Breadcrumb.curr>
                </Breadcrumb>
            </TopBarInner></TopBar>

            <Body>
                <Content>
                    <PageTitle>Referensi & Resources CSS</PageTitle>
                    <PageDesc>Koleksi referensi terkurasi — dokumentasi, tools, games, cheat sheets, blog, dan komunitas CSS yang worth following. Quality over quantity.</PageDesc>

                    <Callout type="tip">
                        <Callout.icon>💡</Callout.icon>
                        <Callout.content>
                            <Callout.title>Prioritas referensi</Callout.title>
                            MDN Web Docs adalah sumber utama — selalu percayai MDN di atas sumber lainnya. Untuk belajar konsep: Josh Comeau dan Ahmad Shadeed. Untuk games: mulai dari CSS Diner dan Flexbox Froggy.
                        </Callout.content>
                    </Callout>

                    <Section id="docs" onClick={() => setActiveSection("docs")}>
                        <H2>Dokumentasi Resmi<H2.anchor href="#docs">#</H2.anchor></H2>
                        <P>Referensi primer yang harus selalu kamu buka saat belajar atau debugging.</P>
                        {DOCS.map(r => (
                            <ResourceLink key={r.href} href={r.href} target="_blank" rel="noopener noreferrer">
                                <ResourceLink.icon>{r.icon}</ResourceLink.icon>
                                <ResourceLink.body>
                                    <ResourceLink.title>{r.title}</ResourceLink.title>
                                    <ResourceLink.desc>{r.desc}</ResourceLink.desc>
                                </ResourceLink.body>
                                <ResourceLink.arrow>→</ResourceLink.arrow>
                            </ResourceLink>
                        ))}
                    </Section>
                    <Divider />

                    <Section id="tools" onClick={() => setActiveSection("tools")}>
                        <H2>Tools & Utilities<H2.anchor href="#tools">#</H2.anchor></H2>
                        <P>Tools yang menghemat waktu dan membuat proses belajar lebih interaktif.</P>
                        {TOOLS.map(r => (
                            <ResourceLink key={r.href} href={r.href} target="_blank" rel="noopener noreferrer">
                                <ResourceLink.icon>{r.icon}</ResourceLink.icon>
                                <ResourceLink.body>
                                    <ResourceLink.title>{r.title}</ResourceLink.title>
                                    <ResourceLink.desc>{r.desc}</ResourceLink.desc>
                                </ResourceLink.body>
                                <ResourceLink.arrow>→</ResourceLink.arrow>
                            </ResourceLink>
                        ))}
                    </Section>
                    <Divider />

                    <Section id="games" onClick={() => setActiveSection("games")}>
                        <H2>Games Belajar CSS<H2.anchor href="#games">#</H2.anchor></H2>
                        <P>Belajar CSS lewat games — sangat efektif untuk topik tertentu seperti flexbox, grid, dan selectors.</P>
                        <GameGrid>
                            {GAMES.map(g => (
                                <GameCard
                                    key={g.href}
                                    href={g.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <GameIconBox>{g.icon}</GameIconBox>
                                    <GameContent>
                                        <GameTitle>{g.title}</GameTitle>
                                        <GameDesc>{g.desc}</GameDesc>
                                        <GameTagContainer>
                                            {g.tags.map(t => <SkillTag key={t}>{t}</SkillTag>)}
                                        </GameTagContainer>
                                    </GameContent>
                                </GameCard>
                            ))}
                        </GameGrid>
                    </Section>
                    <Divider />

                    <Section id="references" onClick={() => setActiveSection("references")}>
                        <H2>Cheat Sheets<H2.anchor href="#references">#</H2.anchor></H2>
                        <P>Bookmark semua ini — referensi cepat yang sering dibuka saat coding.</P>
                        {CHEAT_SHEETS.map(r => (
                            <ResourceLink key={r.href} href={r.href} target="_blank" rel="noopener noreferrer">
                                <ResourceLink.icon>{r.icon}</ResourceLink.icon>
                                <ResourceLink.body>
                                    <ResourceLink.title>{r.title}</ResourceLink.title>
                                    <ResourceLink.desc>{r.desc}</ResourceLink.desc>
                                </ResourceLink.body>
                                <ResourceLink.arrow>→</ResourceLink.arrow>
                            </ResourceLink>
                        ))}
                    </Section>
                    <Divider />

                    <Section id="blogs" onClick={() => setActiveSection("blogs")}>
                        <H2>Blog & Newsletter<H2.anchor href="#blogs">#</H2.anchor></H2>
                        <P>Penulis dan sumber yang secara konsisten menghasilkan konten CSS berkualitas tinggi.</P>

                        <TipCard accent="violet">
                            <TipCard.title>🏆 Rekomendasi utama</TipCard.title>
                            <TipCard.body>Jika hanya bisa follow satu penulis CSS: <strong>Josh Comeau</strong>. Artikelnya memiliki penjelasan visual interaktif yang tidak ada tandingannya. Artikel "Interactive Guide to Flexbox" dan "CSS Custom Properties" wajib baca.</TipCard.body>
                        </TipCard>

                        {BLOGS.map(r => (
                            <ResourceLink key={r.href} href={r.href} target="_blank" rel="noopener noreferrer">
                                <ResourceLink.icon>{r.icon}</ResourceLink.icon>
                                <ResourceLink.body>
                                    <ResourceLink.title>{r.title}</ResourceLink.title>
                                    <ResourceLink.desc>{r.desc}</ResourceLink.desc>
                                </ResourceLink.body>
                                <ResourceLink.arrow>→</ResourceLink.arrow>
                            </ResourceLink>
                        ))}
                    </Section>
                    <Divider />

                    <Section id="communities" onClick={() => setActiveSection("communities")}>
                        <H2>Komunitas<H2.anchor href="#communities">#</H2.anchor></H2>
                        <P>Bergabung dengan komunitas untuk bertanya, berdiskusi, dan tetap update dengan perkembangan CSS.</P>

                        <div className="space-y-2">
                            {[
                                { name: "CSS subreddit (r/css)", desc: "Komunitas aktif untuk bertanya dan berbagi CSS. Bagus untuk inspiration dan code review", tags: ["general"] },
                                { name: "Frontend Developer Discord", desc: "Server Discord besar untuk frontend developers — ada channel khusus CSS", tags: ["chat"] },
                                { name: "Twitter/X #css hashtag", desc: "Follow @css, @csswg, @joshwcomeau, @shadeed9, @leaverou untuk update terbaru", tags: ["social"] },
                                { name: "CodePen Community", desc: "Lihat dan fork CSS pens dari developer lain — inspirasi dan belajar dari kode nyata", tags: ["playground", "inspiration"] },
                                { name: "Stack Overflow CSS tag", desc: "Untuk pertanyaan spesifik dengan expected answer. Selalu include minimal reproduction", tags: ["qa"] },
                            ].map(c => (
                                <div key={c.name} className="p-3 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)]">
                                    <p className="text-sm font-semibold mb-1">{c.name}</p>
                                    <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{c.desc}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {c.tags.map(t => <SkillTag key={t}>{t}</SkillTag>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                    <Divider />

                    <Section id="youtube" onClick={() => setActiveSection("youtube")}>
                        <H2>YouTube Channels<H2.anchor href="#youtube">#</H2.anchor></H2>
                        <div className="space-y-2">
                            {[
                                { name: "Kevin Powell", desc: "\"The King of CSS\" — video tutorial CSS terbaik di YouTube, sangat practical", tags: ["tutorials", "beginner-friendly"] },
                                { name: "Fireship", desc: "Video singkat dan padat tentang berbagai topik web — CSS in 100 Seconds series", tags: ["quick", "overview"] },
                                { name: "Web Dev Simplified", desc: "Tutorial CSS yang jelas dan mudah diikuti — bagus untuk beginner ke intermediate", tags: ["tutorials", "beginner"] },
                                { name: "Theo — t3.gg", desc: "Opinionated takes tentang CSS modern dan web dev — bagus untuk wawasan industri", tags: ["opinion", "advanced"] },
                            ].map(c => (
                                <div key={c.name} className="p-3 rounded-lg border border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] bg-[var(--surface)]">
                                    <p className="text-sm font-semibold mb-1">{c.name}</p>
                                    <p className="text-xs text-[color-mix(in_srgb,var(--foreground)_55%,transparent)]">{c.desc}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {c.tags.map(t => <SkillTag key={t}>{t}</SkillTag>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <PageNav>
                        <NavBtn href="/learn/mentor/debugging-css" dir="prev"><NavBtn.hint>← Previous</NavBtn.hint><NavBtn.label>Debugging CSS</NavBtn.label></NavBtn>
                        <NavBtn href="/learn/mentor" dir="next"><NavBtn.hint>Back →</NavBtn.hint><NavBtn.label>Mentor Overview</NavBtn.label></NavBtn>
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
