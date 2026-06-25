/**
 * /docs — second route untuk test route-specific CSS splitting
 *
 * TwCssInjector hanya inject CSS yang dipakai route ini,
 * bukan semua CSS dari seluruh app.
 */
import { tw } from "tailwind-styled-v4"

const Container = tw.main({
  base: "max-w-3xl mx-auto px-4 py-16 space-y-8",
})

const Heading = tw.h1({
  base: "text-3xl font-bold tracking-tight text-gray-900",
})

const Lead = tw.p({
  base: "text-lg text-gray-500 leading-relaxed",
})

const Card = tw.article({
  base: "rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-2",
})

const CardTitle = tw.h2({
  base: "font-semibold text-gray-900",
})

const CardDesc = tw.p({
  base: "text-sm text-gray-500",
})

const BackLink = tw.a({
  base: `
    inline-flex items-center gap-1.5 text-indigo-600
    hover:underline underline-offset-2 font-medium text-sm
  `,
})

export default function DocsPage() {
  return (
    <Container>
      <BackLink href="/">← Back to showcase</BackLink>

      <div>
        <Heading>Documentation</Heading>
        <Lead>
          Halaman ini adalah contoh route kedua — CSS yang di-inject
          oleh TwCssInjector hanya berisi class yang dipakai di route ini,
          bukan seluruh CSS dari halaman utama.
        </Lead>
      </div>

      <div className="grid gap-4">
        {[
          {
            title: "tw() object config",
            desc: "Buat komponen dengan base, variants, sub, states, container — semua di-compile Rust.",
          },
          {
            title: "cv() class variant",
            desc: "Fungsi untuk menghasilkan className string dari variant config — tanpa komponen React.",
          },
          {
            title: "createStyledSystem()",
            desc: "Design system factory dengan token terpusat sebagai CSS custom properties.",
          },
          {
            title: "liveToken()",
            desc: "Reactive design token yang bisa diupdate runtime dan di-subscribe lewat React hook.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardTitle>{item.title}</CardTitle>
            <CardDesc>{item.desc}</CardDesc>
          </Card>
        ))}
      </div>
    </Container>
  )
}
