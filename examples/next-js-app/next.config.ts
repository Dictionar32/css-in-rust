import { withTailwindStyled } from "tailwind-styled-v4/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default withTailwindStyled({
  // routeCss: true — generate css-manifest.json ke .next/static/css/tw/
  // Dibutuhkan oleh TwCssInjector untuk inject route-specific CSS inline di <head>.
  // Tanpa ini, TwCssInjector diam-diam return kosong karena manifest tidak ada.
  routeCss: true,
})(nextConfig)
