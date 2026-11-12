import { z } from 'zod'

const DECIMAL_MONEY_REGEX = /^\d{1,12}(?:\.\d{1,2})?$/

export function normalizeCategoryName(value: string): string {
  return value.trim()
}

export function normalizeSku(value: string): string {
  return value.trim().toUpperCase()
}

export function normalizeBarcode(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Formats integer or decimal string into fixed 2-decimal string for PostgreSQL numeric(14, 2)
 * without using binary floating-point arithmetic.
 */
export function normalizeMoneyDecimal(value: string | number): string | null {
  const raw = typeof value === 'number' ? (Number.isFinite(value) ? String(value) : '') : value.trim()
  if (!DECIMAL_MONEY_REGEX.test(raw)) return null

  const [wholePart, fractionPart = ''] = raw.split('.')
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '')
  const normalizedFraction = fractionPart.padEnd(2, '0')
  return `${normalizedWhole}.${normalizedFraction}`
}

export const uuidSchema = z.string().uuid('ID tidak valid.')

const optionalDescriptionSchema = z
  .union([z.string().max(1000, 'Deskripsi maksimal 1000 karakter.'), z.null(), z.undefined()])
  .transform((value) => normalizeOptionalText(value))

const moneySchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const normalized = normalizeMoneyDecimal(value)
    if (normalized === null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Nominal harus berupa angka non-negatif dengan maksimal 2 desimal.',
      })
      return z.NEVER
    }
    return normalized
  })

export const categoryInputSchema = z.object({
  name: z
    .string()
    .transform((value) => normalizeCategoryName(value))
    .pipe(
      z
        .string()
        .min(1, 'Nama kategori wajib diisi.')
        .max(100, 'Nama kategori maksimal 100 karakter.'),
    ),
  description: optionalDescriptionSchema.optional(),
})

export const listCategoriesQuerySchema = z.object({
  search: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value)),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
})

const productBaseFields = {
  name: z
    .string()
    .trim()
    .min(1, 'Nama produk wajib diisi.')
    .max(180, 'Nama produk maksimal 180 karakter.'),
  sku: z
    .string()
    .transform((value) => normalizeSku(value))
    .pipe(z.string().min(1, 'SKU wajib diisi.').max(80, 'SKU maksimal 80 karakter.')),
  barcode: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value, ctx) => {
      const normalized = normalizeBarcode(value)
      if (normalized && normalized.length > 100) {
        ctx.addIssue({
          code: 'custom',
          message: 'Barcode maksimal 100 karakter.',
        })
        return z.NEVER
      }
      return normalized
    })
    .optional(),
  categoryId: z
    .union([uuidSchema, z.literal(''), z.null(), z.undefined()])
    .transform((value) => (value ? value : null))
    .optional(),
  description: optionalDescriptionSchema.optional(),
  unit: z
    .string()
    .trim()
    .min(1, 'Satuan wajib diisi.')
    .max(30, 'Satuan maksimal 30 karakter.'),
  costPrice: moneySchema,
  sellingPrice: moneySchema,
  minimumStock: z.coerce
    .number()
    .int('Stok minimum harus berupa bilangan bulat.')
    .min(0, 'Stok minimum tidak boleh negatif.'),
}

export const createProductSchema = z.object({
  ...productBaseFields,
  unit: productBaseFields.unit.default('pcs'),
  costPrice: productBaseFields.costPrice.default('0.00'),
  sellingPrice: productBaseFields.sellingPrice.default('0.00'),
  minimumStock: productBaseFields.minimumStock.default(0),
})

export const updateProductSchema = z.object(productBaseFields).partial()

export const productStatusFilterSchema = z.enum(['active', 'archived', 'all']).default('active')

export const listProductsQuerySchema = z.object({
  search: z
    .string()
    .optional()
    .transform((value) => normalizeOptionalText(value)),
  categoryId: z
    .union([uuidSchema, z.literal(''), z.null(), z.undefined()])
    .transform((value) => (value ? value : null))
    .optional(),
  status: productStatusFilterSchema.optional().default('active'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CategoryInput = z.input<typeof categoryInputSchema>
export type ValidatedCategoryInput = z.output<typeof categoryInputSchema>
export type ListCategoriesQuery = z.input<typeof listCategoriesQuerySchema>

export type CreateProductInput = z.input<typeof createProductSchema>
export type UpdateProductInput = z.input<typeof updateProductSchema>
export type ListProductsQuery = z.input<typeof listProductsQuerySchema>
