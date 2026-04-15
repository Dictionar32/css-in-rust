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

export const VitePluginOptionsSchema = z.object({
  include: z.instanceof(RegExp).optional(),
  exclude: z.instanceof(RegExp).optional(),
  scanDirs: z.array(z.string()).optional(),
  safelistOutput: z.string().optional(),
  generateSafelist: z.boolean().optional(),
  scanReportOutput: z.string().optional(),
  useEngineBuild: z.boolean().optional(),
  analyze: z.boolean().optional(),
  strict: z.boolean().optional(),
  mode: z.enum(["zero-runtime", "runtime"]).optional(),
  routeCss: z.boolean().optional(),
  deadStyleElimination: z.boolean().optional(),
  addDataAttr: z.boolean().optional(),
  autoClientBoundary: z.boolean().optional(),
  hoist: z.boolean().optional(),
  incremental: z.boolean().optional(),
})

export type VitePluginOptionsInput = z.infer<typeof VitePluginOptionsSchema>

export const parseVitePluginOptions = (options: unknown) =>
  parseWithSchema(VitePluginOptionsSchema, options ?? {}, "vite plugin options are invalid")
