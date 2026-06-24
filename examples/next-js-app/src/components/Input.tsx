import React from "react"
import { tw } from "tailwind-styled-v4"

/**
 * Input + Textarea — object config API
 *
 * tw.input({ base, variants, defaultVariants })
 * tw.textarea({ base })
 */

// -- Field wrapper -------------------------------------------------------------
const FieldRoot = tw.div({ base: "flex flex-col gap-1.5" })

const Label = tw.label({ base: "text-sm font-medium text-gray-700" })

const HintText = tw.p({ base: "text-xs text-gray-400" })

const ErrorText = tw.p({ base: "text-xs text-red-600" })

// -- Input — variants untuk state ----------------------------------------------
const InputBase = tw.input({
  base: `
    w-full rounded-lg border bg-white px-3 py-2 text-sm
    text-gray-900 placeholder:text-gray-400 transition
    focus:outline-none focus:ring-2
    disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400
  `,
  variants: {
    state: {
      default: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200",
      error:   "border-red-400 focus:border-red-500 focus:ring-red-200",
    },
  },
  defaultVariants: {
    state: "default",
  },
})

// -- Textarea ------------------------------------------------------------------
const TextareaBase = tw.textarea({
  base: `
    w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm
    text-gray-900 placeholder:text-gray-400 resize-y min-h-[80px] transition
    focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200
    disabled:cursor-not-allowed disabled:bg-gray-50
  `,
})

// -- Prefix / Suffix wrappers --------------------------------------------------
const InputWrapper = tw.div({ base: "relative flex items-center" })

const PrefixSlot = tw.span({ base: "absolute left-3 text-gray-400 pointer-events-none" })

const SuffixSlot = tw.span({ base: "absolute right-3 text-gray-400 pointer-events-none" })

// -- Input Props ---------------------------------------------------------------
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string
  hint?: string
  error?: string
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export function Input({ label, hint, error, prefix, suffix, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")

  return (
    <FieldRoot>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <InputWrapper>
        {prefix && <PrefixSlot>{prefix}</PrefixSlot>}
        <InputBase
          id={inputId}
          state={error ? "error" : "default"}
          className={prefix ? "pl-9" : suffix ? "pr-9" : className}
          aria-invalid={!!error}
          {...props}
        />
        {suffix && <SuffixSlot>{suffix}</SuffixSlot>}
      </InputWrapper>
      {error ? <ErrorText>{error}</ErrorText> : hint ? <HintText>{hint}</HintText> : null}
    </FieldRoot>
  )
}

// -- Textarea Props -------------------------------------------------------------
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, id, className, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
  return (
    <FieldRoot>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <TextareaBase
        id={inputId}
        className={className}
        aria-invalid={!!error}
        {...props}
      />
      {error ? <ErrorText>{error}</ErrorText> : hint ? <HintText>{hint}</HintText> : null}
    </FieldRoot>
  )
}
