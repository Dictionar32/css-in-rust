import { withTailwindStyled } from "tailwind-styled-v4/next"
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

export default withTailwindStyled()(nextConfig)