import { z } from 'zod'
import { normalizeOptionalText, uuidSchema } from './catalog'

export const STOCK_OUT_REASONS = ['SALE', 'DAMAGE', 'INTERNAL_USE', 'OTHER'] as const
export type StockOutReason = (typeof STOCK_OUT_REASONS)[number]

export const STOCK_OUT_REASON_LABELS: Record<StockOutReason, string> = {
  SALE: 'Penjualan',
  DAMAGE: 'Rusak / Kedaluwarsa',
  INTERNAL_USE: 'Pemakaian Internal',
  OTHER: 'Lainnya',
}

export const MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUSTMENT'] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

const optionalUuidSchema = z
  .union([uuidSchema, z.literal(''), z.null(), z.undefined()])
  .transform((value) => (value ? value : null))

function optionalBoundedTextSchema(max: number, message: string) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value, ctx) => {
      const normalized = normalizeOptionalText(value)
      if (normalized && normalized.length > max) {
        ctx.addIssue({ code: 'custom', message })
        return z.NEVER
      }
      return normalized
    })
}

export const supplierInputSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, 'Nama supplier wajib diisi.')
        .max(160, 'Nama supplier maksimal 160 karakter.'),
    ),
  phone: optionalBoundedTextSchema(40, 'Nomor telepon maksimal 40 karakter.').optional(),
  email: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value, ctx) => {
      const normalized = normalizeOptionalText(value)
      if (!normalized) return null
      if (normalized.length > 255) {
        ctx.addIssue({ code: 'custom', message: 'Email maksimal 255 karakter.' })
        return z.NEVER
      }
      const emailCheck = z.string().email('Format email tidak valid.').safeParse(normalized)
      if (!emailCheck.success) {
        ctx.addIssue({ code: 'custom', message: 'Format email tidak valid.' })
        return z.NEVER
      }
      return normalized.toLowerCase()
    })
    .optional(),
  address: optionalBoundedTextSchema(1000, 'Alamat maksimal 1000 karakter.').optional(),
  notes: optionalBoundedTextSchema(1000, 'Catatan maksimal 1000 karakter.').optional(),
})

export const listSuppliersQuerySchema = z.object({
  search: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export const stockInSchema = z.object({
  productId: uuidSchema.refine((val) => val.length > 0, 'Produk wajib dipilih.'),
  quantity: z.coerce
    .number()
    .int('Jumlah stok masuk harus berupa bilangan bulat.')
    .min(1, 'Jumlah stok masuk minimal 1.'),
  warehouseId: optionalUuidSchema.optional(),
  supplierId: optionalUuidSchema.optional(),
  referenceNumber: optionalBoundedTextSchema(
    100,
    'Nomor referensi maksimal 100 karakter.',
  ).optional(),
  notes: optionalBoundedTextSchema(500, 'Catatan maksimal 500 karakter.').optional(),
})

export const stockOutSchema = z.object({
  productId: uuidSchema.refine((val) => val.length > 0, 'Produk wajib dipilih.'),
  quantity: z.coerce
    .number()
    .int('Jumlah stok keluar harus berupa bilangan bulat.')
    .min(1, 'Jumlah stok keluar minimal 1.'),
  reason: z.enum(STOCK_OUT_REASONS, {
    message: 'Pilih alasan pengeluaran stok yang valid.',
  }),
  warehouseId: optionalUuidSchema.optional(),
  referenceNumber: optionalBoundedTextSchema(
    100,
    'Nomor referensi maksimal 100 karakter.',
  ).optional(),
  notes: optionalBoundedTextSchema(500, 'Catatan maksimal 500 karakter.').optional(),
})

export const stockAdjustmentSchema = z.object({
  productId: uuidSchema.refine((val) => val.length > 0, 'Produk wajib dipilih.'),
  countedQuantity: z.coerce
    .number()
    .int('Jumlah fisik harus berupa bilangan bulat.')
    .min(0, 'Jumlah fisik tidak boleh negatif.'),
  warehouseId: optionalUuidSchema.optional(),
  reason: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, 'Alasan penyesuaian wajib diisi.')
        .max(80, 'Alasan penyesuaian maksimal 80 karakter.'),
    ),
  notes: optionalBoundedTextSchema(500, 'Catatan maksimal 500 karakter.').optional(),
})

const optionalDateStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    const normalized = normalizeOptionalText(value)
    if (!normalized) return null
    const parsed = new Date(normalized)
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: 'custom', message: 'Format tanggal tidak valid.' })
      return z.NEVER
    }
    return normalized
  })

export const listMovementsQuerySchema = z.object({
  productId: optionalUuidSchema.optional(),
  warehouseId: optionalUuidSchema.optional(),
  type: z
    .union([z.enum(MOVEMENT_TYPES), z.literal(''), z.null(), z.undefined()])
    .transform((value) => (value ? value : null))
    .optional(),
  dateFrom: optionalDateStringSchema.optional(),
  dateTo: optionalDateStringSchema.optional(),
  search: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
})

export type SupplierInput = z.input<typeof supplierInputSchema>
export type ListSuppliersQuery = z.input<typeof listSuppliersQuerySchema>
export type StockInInput = z.input<typeof stockInSchema>
export type StockOutInput = z.input<typeof stockOutSchema>
export type StockAdjustmentInput = z.input<typeof stockAdjustmentSchema>
export type ListMovementsQuery = z.input<typeof listMovementsQuerySchema>

