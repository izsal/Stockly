export type CsvCell = string | number | boolean | null | undefined

const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/

export function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  const sanitized = FORMULA_PREFIX_REGEX.test(value) ? `'${value}` : value
  const needsQuotes = /[",\r\n]/.test(sanitized)
  if (!needsQuotes) {
    return sanitized
  }

  return `"${sanitized.replaceAll('"', '""')}"`
}

export function serializeCsv(
  headers: readonly string[],
  rows: readonly (readonly CsvCell[])[],
  options: { includeBom?: boolean } = {},
): string {
  const headerLine = headers.map((header) => escapeCsvCell(header)).join(',')
  const bodyLines = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
  const content = [headerLine, ...bodyLines].join('\r\n')
  return options.includeBom === false ? content : `\uFEFF${content}`
}

