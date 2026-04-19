import { z } from "zod"
import { TwError } from "@tailwind-styled/shared"

const formatIssuePath = (path: readonly PropertyKey[]): string =>
  path.length > 0
    ? path
        .map((segment) =>
          typeof segment === "symbol" ? segment.description ?? segment.toString() : String(segment)
        )
        .join(".")
    : "<root>"

const formatIssues = (error: z.ZodError): string =>
  error.issues
    .map((issue) => {
      const p = formatIssuePath(issue.path)
      return `${p}: ${issue.message}`
    })
    .join("; ")

const parseWithSchema = <T>(schema: z.ZodType<T>, data: unknown, label: string): T => {
  const parsed = schema.safeParse(data)
  if (parsed.success) return parsed.data
  const details = formatIssues(parsed.error)
  throw new TwError(
    "validation",
    "SCHEMA_VALIDATION_FAILED",
    details ? `${label}: ${details}` : label,
    parsed.error
  )
}

export const RspackPluginOptionsSchema = z.object({
  include: z.instanceof(RegExp).optional(),
  exclude: z.instanceof(RegExp).optional(),
  addDataAttr: z.boolean().optional(),
  analyze: z.boolean().optional(),
  cssEntry: z.string().optional(),
})

export type RspackPluginOptionsInput = z.infer<typeof RspackPluginOptionsSchema>

export const parseRspackPluginOptions = (options: unknown) =>
  parseWithSchema(RspackPluginOptionsSchema, options ?? {}, "rspack plugin options are invalid")
