"use client"
/**
 * LiveTokenDemo — demo liveToken() API
 *
 * Reactive design tokens yang bisa diupdate runtime.
 * Semua komponen yang subscribe otomatis re-render.
 */
import React, { useState } from "react"
import { tw } from "tailwind-styled-v4"
import { liveToken, tokenVar, createUseTokens } from "tailwind-styled-v4/runtime"

// -- Deklarasi live tokens -----------------------------------------------------
const brandTokens = liveToken({
  primary: "#6366f1",
  secondary: "#8b5cf6",
  background: "#f5f7fb",
  surface: "#ffffff",
  text: "#111827",
})

// -- Hook untuk subscribe ------------------------------------------------------
const useBrandTokens = createUseTokens()

// -- Token reference untuk className ------------------------------------------
const TokenCard = tw.div({
  base: `
    rounded-xl p-5 border transition-colors duration-300
    border-[var(--tw-live-primary)]
    bg-[var(--tw-live-surface)]
  `,
})

const TokenHeading = tw.h3({
  base: "text-lg font-bold transition-colors duration-300",
})

const TokenText = tw.p({
  base: "text-sm mt-1 transition-colors duration-300",
})

const ColorSwatch = tw.div({
  base: "w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer transition-transform hover:scale-110",
})

const DemoContainer = tw.div({
  base: "space-y-4",
})

const ColorPickerWrapper = tw.div({
  base: "flex flex-wrap items-center gap-2",
})

const ColorPickerLabel = tw.span({
  base: "text-sm font-medium text-gray-600 mr-1",
})

const ColorPreviewContainer = tw.div({
  base: "flex items-center gap-3 mb-3",
})

const ColorPreviewSwatch = tw.div({
  base: "w-8 h-8 rounded-full flex-shrink-0 transition-colors duration-300",
})

const TokenCode = tw.code({
  base: "font-mono text-xs",
})

const ActionButtonsWrapper = tw.div({
  base: "mt-4 flex gap-2",
})

const PrimaryActionBtn = tw.button({
  base: "px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors duration-300",
})

const OutlineActionBtn = tw.button({
  base: "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300 border-2",
})

const colorOptions = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Green", value: "#22c55e" },
  { label: "Pink", value: "#ec4899" },
  { label: "Orange", value: "#f97316" },
]

export function LiveTokenDemo() {
  const tokens = useBrandTokens()
  const [active, setActive] = useState("#6366f1")

  function changePrimary(color: string) {
    setActive(color)
    // Update token langsung — semua subscriber re-render otomatis
    brandTokens.set("primary", color)
  }

  return (
    <DemoContainer>
      {/* Color picker */}
      <ColorPickerWrapper>
        <ColorPickerLabel>Primary color:</ColorPickerLabel>
        {colorOptions.map((c) => (
          <ColorSwatch
            key={c.value}
            style={{ backgroundColor: c.value }}
            title={c.label}
            onClick={() => changePrimary(c.value)}
            className={active === c.value ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}
          />
        ))}
      </ColorPickerWrapper>

      {/* Live preview */}
      <TokenCard>
        <ColorPreviewContainer>
          <ColorPreviewSwatch
            style={{ backgroundColor: tokens.primary }}
          />
          <TokenHeading style={{ color: tokens.primary }}>
            Live Token Preview
          </TokenHeading>
        </ColorPreviewContainer>
        <TokenText style={{ color: tokens.text }}>
          Token berubah realtime — semua komponen yang subscribe ikut update
          tanpa rebuild. Current primary: <TokenCode>{tokens.primary}</TokenCode>
        </TokenText>
        <ActionButtonsWrapper>
          <PrimaryActionBtn
            type="button"
            style={{ backgroundColor: tokens.primary }}
          >
            Primary action
          </PrimaryActionBtn>
          <OutlineActionBtn
            type="button"
            style={{ borderColor: tokens.primary, color: tokens.primary }}
          >
            Outline
          </OutlineActionBtn>
        </ActionButtonsWrapper>
      </TokenCard>
    </DemoContainer>
  )
}
