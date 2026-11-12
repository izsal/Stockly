import { z } from 'zod'

export const BETA_FEEDBACK_TYPES = ['USABILITY', 'BUG', 'FEATURE'] as const
export type BetaFeedbackType = (typeof BETA_FEEDBACK_TYPES)[number]

export const BETA_FEEDBACK_TYPE_LABELS: Record<BetaFeedbackType, string> = {
  USABILITY: 'Masukan Kegunaan (UX)',
  BUG: 'Bug Penghambat (Blocking)',
  FEATURE: 'Saran Perbaikan / Fitur',
}

export const BETA_FEEDBACK_RATING_LABELS: Record<number, string> = {
  1: '1 — Sangat sulit digunakan',
  2: '2 — Cukup membingungkan',
  3: '3 — Cukup baik',
  4: '4 — Mudah digunakan',
  5: '5 — Sangat mudah dan lancar',
}

export const betaFeedbackSchema = z.object({
  type: z.enum(BETA_FEEDBACK_TYPES, {
    message: 'Pilih jenis masukan.',
  }),
  rating: z.coerce
    .number()
    .int('Skor kemudahan harus berupa bilangan bulat.')
    .min(1, 'Pilih skor kemudahan 1 sampai 5.')
    .max(5, 'Pilih skor kemudahan 1 sampai 5.'),
  pagePath: z
    .string()
    .trim()
    .min(1, 'Halaman terkait wajib diisi.')
    .max(120, 'Path halaman maksimal 120 karakter.'),
  summary: z
    .string()
    .trim()
    .min(5, 'Ringkasan masukan minimal 5 karakter.')
    .max(120, 'Ringkasan masukan maksimal 120 karakter.'),
  details: z
    .string()
    .trim()
    .min(10, 'Detail masukan minimal 10 karakter.')
    .max(2000, 'Detail masukan maksimal 2000 karakter.'),
  viewportWidth: z.coerce.number().int().min(200).max(10000).optional(),
})

export type BetaFeedbackInput = z.input<typeof betaFeedbackSchema>
export type ParsedBetaFeedback = z.output<typeof betaFeedbackSchema>

