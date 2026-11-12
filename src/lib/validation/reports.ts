import { z } from 'zod'
import { normalizeOptionalText, uuidSchema } from './catalog'
import { MOVEMENT_TYPES } from './inventory'

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/
const JAKARTA_OFFSET = '+07:00'

export const REPORT_TABS = ['current-stock', 'low-stock', 'movements'] as const
export type ReportTab = (typeof REPORT_TABS)[number]

export const STOCK_STATUS_FILTERS = ['all', 'normal', 'low', 'out'] as const
export type StockStatusFilter = (typeof STOCK_STATUS_FILTERS)[number]

const optionalUuidSchema = z
  .union([uuidSchema, z.literal(''), z.null(), z.undefined()])
  .transform((value) => (value ? value : null))

const optionalDateOnlySchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    const normalized = normalizeOptionalText(value)
    if (!normalized) return null
    if (!DATE_ONLY_REGEX.test(normalized)) {
      ctx.addIssue({ code: 'custom', message: 'Format tanggal harus YYYY-MM-DD.' })
      return z.NEVER
    }
    const parsed = new Date(`${normalized}T00:00:00${JAKARTA_OFFSET}`)
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Tanggal tidak valid.' })
      return z.NEVER
    }
    return normalized
  })

export function formatJakartaDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((p) => p.type === 'year')?.value ?? '2026'
  const month = parts.find((p) => p.type === 'month')?.value ?? '01'
  const day = parts.find((p) => p.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

export function getDefaultDateRange(days = 7, now: Date = new Date()): {
  dateFrom: string
  dateTo: string
} {
  const safeDays = Math.max(1, days)
  const dateTo = formatJakartaDateKey(now)
  const endMidnight = new Date(`${dateTo}T00:00:00${JAKARTA_OFFSET}`)
  const start = new Date(endMidnight.getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000)
  return {
    dateFrom: formatJakartaDateKey(start),
    dateTo,
  }
}

export function resolveJakartaDateBounds(dateFrom?: string | null, dateTo?: string | null) {
  let normalizedFrom = dateFrom ?? null
  let normalizedTo = dateTo ?? null

  if (normalizedFrom && normalizedTo && normalizedFrom > normalizedTo) {
    const swap = normalizedFrom
    normalizedFrom = normalizedTo
    normalizedTo = swap
  }

  return {
    dateFrom: normalizedFrom,
    dateTo: normalizedTo,
    startDate: normalizedFrom ? new Date(`${normalizedFrom}T00:00:00.000${JAKARTA_OFFSET}`) : null,
    endDate: normalizedTo ? new Date(`${normalizedTo}T23:59:59.999${JAKARTA_OFFSET}`) : null,
  }
}

export const dashboardSummaryQuerySchema = z.object({
  dateFrom: optionalDateOnlySchema.optional(),
  dateTo: optionalDateOnlySchema.optional(),
})

export const currentStockReportQuerySchema = z.object({
  search: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value)),
  categoryId: optionalUuidSchema.optional(),
  stockStatus: z.enum(STOCK_STATUS_FILTERS).optional().default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export const lowStockReportQuerySchema = z.object({
  search: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value)),
  categoryId: optionalUuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export const movementReportQuerySchema = z.object({
  productId: optionalUuidSchema.optional(),
  type: z
    .union([z.enum(MOVEMENT_TYPES), z.literal(''), z.null(), z.undefined()])
    .transform((value) => (value ? value : null))
    .optional(),
  dateFrom: optionalDateOnlySchema.optional(),
  dateTo: optionalDateOnlySchema.optional(),
  search: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export const reportExportQuerySchema = z.object({
  report: z.enum(REPORT_TABS),
  search: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value)),
  categoryId: optionalUuidSchema.optional(),
  stockStatus: z.enum(STOCK_STATUS_FILTERS).optional().default('all'),
  productId: optionalUuidSchema.optional(),
  type: z
    .union([z.enum(MOVEMENT_TYPES), z.literal(''), z.null(), z.undefined()])
    .transform((value) => (value ? value : null))
    .optional(),
  dateFrom: optionalDateOnlySchema.optional(),
  dateTo: optionalDateOnlySchema.optional(),
})

export type DashboardSummaryQuery = z.input<typeof dashboardSummaryQuerySchema>
export type CurrentStockReportQuery = z.input<typeof currentStockReportQuerySchema>
export type LowStockReportQuery = z.input<typeof lowStockReportQuerySchema>
export type MovementReportQuery = z.input<typeof movementReportQuerySchema>
export type ReportExportQuery = z.input<typeof reportExportQuerySchema>

