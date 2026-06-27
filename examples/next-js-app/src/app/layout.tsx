import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TwCssInjector } from "tailwind-styled-v4/runtime-css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tailwind-styled v4.5 demo",
  description: "Next.js App Router demo with tailwind-styled-v4.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/*
         * TwCssInjector — inject route-specific CSS inline ke <head>.
         * Server Component async — harus import dari runtime-css (server-safe entry).
         */}
        <TwCssInjector />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
