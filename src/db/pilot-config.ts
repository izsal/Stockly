import { z } from 'zod'

export const pilotBusinessSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(3, 'Nama usaha minimal 3 karakter.')
    .max(120, 'Nama usaha maksimal 120 karakter.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.')
    .min(3)
    .max(80)
    .optional(),
  ownerName: z
    .string()
    .trim()
    .min(2, 'Nama pemilik minimal 2 karakter.')
    .max(120),
  ownerEmail: z.string().trim().toLowerCase().email('Email pemilik tidak valid.'),
  staffName: z.string().trim().min(2).max(120).optional(),
  staffEmail: z.string().trim().toLowerCase().email('Email staf tidak valid.').optional(),
  warehouseName: z.string().trim().min(2).max(120).default('Gudang Utama'),
  starterCategories: z.array(z.string().trim().min(2).max(100)).max(20).default([]),
})

export const pilotBatchSchema = z
  .array(pilotBusinessSchema)
  .min(1, 'Minimal 1 bisnis pilot diperlukan.')
  .max(10, 'Maksimal 10 bisnis pilot dalam satu batch.')
  .superRefine((businesses, ctx) => {
    const seenEmails = new Set<string>()
    businesses.forEach((biz, index) => {
      if (seenEmails.has(biz.ownerEmail)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'ownerEmail'],
          message: `Email pemilik duplikat di batch: ${biz.ownerEmail}`,
        })
      }
      seenEmails.add(biz.ownerEmail)

      if (biz.staffEmail) {
        if (seenEmails.has(biz.staffEmail)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, 'staffEmail'],
            message: `Email staf duplikat di batch: ${biz.staffEmail}`,
          })
        }
        seenEmails.add(biz.staffEmail)
      }
    })
  })

export type PilotBusinessConfig = z.output<typeof pilotBusinessSchema>

export function buildPilotWorkspaceSlug(businessName: string, explicitSlug?: string): string {
  if (explicitSlug) return explicitSlug

  const normalized = businessName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

  return normalized || 'pilot-workspace'
}

export const SAMPLE_PILOT_BUSINESSES = [
  {
    businessName: 'Warung Maju Bersama',
    slug: 'pilot-warung-maju-bersama',
    ownerName: 'Hendra Kusuma',
    ownerEmail: 'owner@warungmaju.pilot.id',
    staffName: 'Rina Marlina',
    staffEmail: 'staf@warungmaju.pilot.id',
    warehouseName: 'Gudang Utama',
    starterCategories: ['Sembako', 'Minuman', 'Kebutuhan Rumah Tangga'],
  },
  {
    businessName: 'Apotek Sehat Sentosa',
    slug: 'pilot-apotek-sehat-sentosa',
    ownerName: 'dr. Nadia Putri',
    ownerEmail: 'owner@apoteksehat.pilot.id',
    staffName: 'Agus Pratama',
    staffEmail: 'staf@apoteksehat.pilot.id',
    warehouseName: 'Gudang Farmasi Utama',
    starterCategories: ['Obat Bebas', 'Vitamin & Suplemen', 'Alat Kesehatan'],
  },
  {
    businessName: 'Toko Bangunan Karya Jaya',
    slug: 'pilot-tb-karya-jaya',
    ownerName: 'Bambang Suryadi',
    ownerEmail: 'owner@karyajaya.pilot.id',
    warehouseName: 'Gudang Material Utama',
    starterCategories: ['Cat & Pelapis', 'Perkakas', 'Material Listrik'],
  },
] as const

