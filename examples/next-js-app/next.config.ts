import { withTailwindStyled } from "tailwind-styled-v4/next";
import type { NextConfig } from "next";
import path from "path";

const localDist = path.resolve(__dirname, "../../dist").replace(/\\/g, "/");

const subpaths = [
  "animate", "analyzer", "atomic", "cli", "compiler", "dashboard", "devtools",
  "engine", "next", "plugin", "plugin-api", "plugin-registry", "preset",
  "rspack", "runtime", "runtime-css", "scanner", "shared", "storybook-addon",
  "svelte", "syntax", "testing", "theme", "vite", "vue",
];

const resolveAlias: Record<string, string> = {
  "tailwind-styled-v4": `${localDist}/index.mjs`,
};
for (const sub of subpaths) {
  resolveAlias[`tailwind-styled-v4/${sub}`] = `${localDist}/${sub}.mjs`;
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
    resolveAlias,
  },
};

export default withTailwindStyled()(nextConfig)