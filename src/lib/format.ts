export function formatRupiah(value: string | number): string {
  const raw = typeof value === 'number' ? value.toFixed(2) : value.trim()
  const [wholeRaw = '0', fractionRaw = ''] = raw.split('.')
  const wholeDigits = wholeRaw.replace(/[^\d]/g, '') || '0'
  const formattedWhole = wholeDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const fraction = fractionRaw.slice(0, 2).padEnd(2, '0')

  if (fraction === '00' || fraction === '') {
    return `Rp ${formattedWhole}`
  }

  return `Rp ${formattedWhole},${fraction}`
}

export function formatDecimalInputValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '0'
  return trimmed.endsWith('.00') ? trimmed.slice(0, -3) : trimmed
}

