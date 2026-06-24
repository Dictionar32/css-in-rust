import { withTailwindStyled } from "tailwind-styled-v4/next";
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Batasi root ke folder example — cegah Turbopack scan monorepo root
    root: path.resolve(__dirname),
  },
};

export default withTailwindStyled({
  // routeCss: true — generate css-manifest.json ke .next/static/css/tw/
  // Dibutuhkan oleh TwCssInjector untuk inject route-specific CSS inline di <head>.
  // Tanpa ini, TwCssInjector diam-diam return kosong karena manifest tidak ada.
  routeCss: true,
})(nextConfig)
