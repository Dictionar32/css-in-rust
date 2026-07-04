import { withTailwindStyled } from "tailwind-styled-v4/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    // Wave 5: Prepare for semantic type generation
    // Enable if using TypeScript 6.0+ with strict mode
  },
};

export default withTailwindStyled({
  // routeCss: true — generate css-manifest.json ke .next/static/css/tw/
  // Dibutuhkan oleh TwCssInjector untuk inject route-specific CSS inline di <head>.
  // Tanpa ini, TwCssInjector diam-diam return kosong karena manifest tidak ada.
  routeCss: true,

  // Wave 5: Build-time plugin configuration (optional)
  // Uncomment to enable plugin system dan type generation
  /*
  plugins: [
    // Wave 3: ARIA Injection Plugin
    {
      name: 'aria-injection',
      priority: 100,  // Run first (pre-component phase)
      config: {
        requireExplicitSemantic: false,  // Inject semua semantic components
        respectUserAria: true,           // Don't override user ARIA
        verbose: false,
      },
    },
    
    // Wave 2: Type Generation Plugin
    {
      name: 'semantic-type-gen',
      priority: 90,  // Run after ARIA injection
      config: {
        outputDir: './.next/types/tw',
        includeMetadata: true,
      },
    },
  ],
  
  // Wave 5: Type generation config
  typeGeneration: {
    enabled: true,
    outputDir: './.next/types/tw',
    includeMetadata: true,
  },
  */
})(nextConfig)
