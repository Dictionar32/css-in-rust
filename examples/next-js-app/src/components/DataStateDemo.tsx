"use client"
/**
 * DataStateDemo — demo state API (CSS data-attribute, zero JS re-render)
 *
 * tw.div({ state }) — generates CSS rules via Rust:
 *   .tw-s-abc123[data-open="true"] { max-height: 200px; }
 * Toggle style via setAttribute("data-open", "true") — tidak butuh useState.
 */
import React, { useRef } from "react"
import { tw } from "tailwind-styled-v4"

const Accordion = tw.div({
  base: "rounded-xl border border-gray-200 bg-white overflow-hidden",
  state: {
    open: {
      true:  "border-indigo-300",
      false: "",
    },
  },
})

const AccordionHeader = tw.button({
  base: `
    w-full flex items-center justify-between px-5 py-4
    font-medium text-left transition-colors
    hover:bg-gray-50 focus:outline-none
  `,
})

const AccordionContent = tw.div({
  base: "overflow-hidden transition-all duration-300",
  state: {
    open: {
      true:  "max-h-48 opacity-100",
      false: "max-h-0 opacity-0",
    },
  },
})

const AccordionInner = tw.div({ base: "px-5 pb-5 pt-2 text-sm text-gray-500 leading-relaxed" })

const ChevronIcon = tw.span({
  base: "transition-transform duration-300 text-gray-400",
  state: {
    open: {
      true:  "rotate-180",
      false: "rotate-0",
    },
  },
})

interface AccordionItemProps {
  title: string
  children: React.ReactNode
}

export function AccordionItem({ title, children }: AccordionItemProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const chevronRef = useRef<HTMLSpanElement>(null)

  function toggle() {
    const el = containerRef.current
    const content = contentRef.current
    const chevron = chevronRef.current
    if (!el || !content || !chevron) return

    const isOpen = el.getAttribute("data-open") === "true"
    const next = String(!isOpen)

    // Set data attribute langsung — tidak butuh React state
    el.setAttribute("data-open", next)
    content.setAttribute("data-open", next)
    chevron.setAttribute("data-open", next)
  }

  return (
    <Accordion ref={containerRef} data-open="false">
      <AccordionHeader type="button" onClick={toggle}>
        <span>{title}</span>
        <ChevronIcon ref={chevronRef} data-open="false" aria-hidden>
          ▾
        </ChevronIcon>
      </AccordionHeader>
      <AccordionContent ref={contentRef} data-open="false">
        <AccordionInner>{children}</AccordionInner>
      </AccordionContent>
    </Accordion>
  )
}
