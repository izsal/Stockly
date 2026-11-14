function addThousandDots(wholeDigits: string): string {
  return wholeDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatRupiah(value: string | number): string {
  const raw = typeof value === 'number' ? value.toFixed(2) : value.trim()
  const [wholeRaw = '0', fractionRaw = ''] = raw.split('.')
  const wholeDigits = wholeRaw.replace(/[^\d]/g, '') || '0'
  const formattedWhole = addThousandDots(wholeDigits)
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

export function formatDecimalToRupiahInput(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '0'

  const [wholeRaw = '0', fractionRaw = ''] = trimmed.split('.')
  const wholeDigits = (wholeRaw.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '') || '0').slice(0, 12)
  const formattedWhole = addThousandDots(wholeDigits)
  const fraction = fractionRaw.replace(/[^\d]/g, '').slice(0, 2)

  if (!fraction || /^0+$/.test(fraction)) {
    return formattedWhole
  }

  return `${formattedWhole},${fraction}`
}

export function formatRupiahTyping(input: string): string {
  const cleaned = input.replace(/[^\d,]/g, '')
  if (!cleaned) return ''

  const commaIndex = cleaned.indexOf(',')
  if (commaIndex === -1) {
    const normalizedWhole = cleaned.replace(/^0+(?=\d)/, '').slice(0, 12)
    return normalizedWhole ? addThousandDots(normalizedWhole) : ''
  }

  const wholeRaw = cleaned.slice(0, commaIndex)
  const normalizedWhole = (wholeRaw.replace(/^0+(?=\d)/, '') || '0').slice(0, 12)
  const fractionRaw = cleaned
    .slice(commaIndex + 1)
    .replace(/,/g, '')
    .slice(0, 2)

  return `${addThousandDots(normalizedWhole)},${fractionRaw}`
}

export function parseRupiahInputToDecimal(formatted: string): string {
  const cleaned = formatted.trim().replace(/[^\d,]/g, '')
  if (!cleaned) return '0'

  const commaIndex = cleaned.indexOf(',')
  if (commaIndex === -1) {
    return cleaned.replace(/^0+(?=\d)/, '') || '0'
  }

  const whole = cleaned.slice(0, commaIndex).replace(/^0+(?=\d)/, '') || '0'
  const fraction = cleaned
    .slice(commaIndex + 1)
    .replace(/,/g, '')
    .slice(0, 2)

  return fraction ? `${whole}.${fraction}` : whole
}

export function formatNumberId(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

export function formatCompactRupiah(value: number): string {
  if (value === 0) return 'Rp 0'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) {
    const num = (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')
    return `Rp ${num} M`
  }
  if (abs >= 1_000_000) {
    const num = (value / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',')
    return `Rp ${num} jt`
  }
  if (abs >= 1_000) {
    const num = (value / 1_000).toFixed(0)
    return `Rp ${num} rb`
  }
  return `Rp ${value}`
}

