export const ALLOWED_PAGE_SIZES = [10, 20, 50] as const
export type AllowedPageSize = (typeof ALLOWED_PAGE_SIZES)[number]

/**
 * Parses a URL `pageSize` query parameter into a supported page size.
 */
export function parsePageSizeParam(
  rawValue: string | string[] | undefined,
  fallback: AllowedPageSize = 20,
): AllowedPageSize {
  if (typeof rawValue !== 'string') return fallback
  const parsed = Number(rawValue)
  if (parsed === 10 || parsed === 20 || parsed === 50) return parsed
  return fallback
}

