import 'server-only'

export type EnvValidationIssue = {
  key: string
  message: string
}

export type ServerEnvSummary = {
  databaseUrl: string
  databaseUrlUnpooled?: string
  betterAuthSecret: string
  betterAuthUrl?: string
  appUrl?: string
  isProduction: boolean
}

const MIN_AUTH_SECRET_LENGTH = 32
const PLACEHOLDER_SECRETS = new Set([
  'replace-with-a-cryptographically-random-secret-min-32-chars',
  'replace-with-a-long-random-secret',
  'changeme',
  'secret',
])

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isValidPostgresUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'postgres:' || url.protocol === 'postgresql:'
  } catch {
    return false
  }
}

export function validateServerEnv(
  env: Record<string, string | undefined> = process.env,
): { ok: true; value: ServerEnvSummary } | { ok: false; issues: EnvValidationIssue[] } {
  const issues: EnvValidationIssue[] = []
  const isProduction = env.NODE_ENV === 'production'

  const databaseUrl = env.DATABASE_URL?.trim() ?? ''
  if (!databaseUrl) {
    issues.push({ key: 'DATABASE_URL', message: 'DATABASE_URL wajib diisi.' })
  } else if (!isValidPostgresUrl(databaseUrl)) {
    issues.push({
      key: 'DATABASE_URL',
      message: 'DATABASE_URL harus menggunakan skema postgres:// atau postgresql://.',
    })
  }

  const databaseUrlUnpooled = env.DATABASE_URL_UNPOOLED?.trim() || undefined
  if (databaseUrlUnpooled && !isValidPostgresUrl(databaseUrlUnpooled)) {
    issues.push({
      key: 'DATABASE_URL_UNPOOLED',
      message: 'DATABASE_URL_UNPOOLED harus menggunakan skema postgres:// atau postgresql://.',
    })
  }

  const betterAuthSecret = env.BETTER_AUTH_SECRET?.trim() ?? ''
  if (!betterAuthSecret) {
    issues.push({ key: 'BETTER_AUTH_SECRET', message: 'BETTER_AUTH_SECRET wajib diisi.' })
  } else if (betterAuthSecret.length < MIN_AUTH_SECRET_LENGTH) {
    issues.push({
      key: 'BETTER_AUTH_SECRET',
      message: `BETTER_AUTH_SECRET minimal ${MIN_AUTH_SECRET_LENGTH} karakter.`,
    })
  } else if (isProduction && PLACEHOLDER_SECRETS.has(betterAuthSecret.toLowerCase())) {
    issues.push({
      key: 'BETTER_AUTH_SECRET',
      message: 'BETTER_AUTH_SECRET tidak boleh menggunakan nilai placeholder di produksi.',
    })
  }

  const betterAuthUrl = env.BETTER_AUTH_URL?.trim() || undefined
  if (betterAuthUrl && !isValidHttpUrl(betterAuthUrl)) {
    issues.push({
      key: 'BETTER_AUTH_URL',
      message: 'BETTER_AUTH_URL harus berupa URL http:// atau https:// yang valid.',
    })
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim() || undefined
  if (appUrl && !isValidHttpUrl(appUrl)) {
    issues.push({
      key: 'NEXT_PUBLIC_APP_URL',
      message: 'NEXT_PUBLIC_APP_URL harus berupa URL http:// atau https:// yang valid.',
    })
  }

  if (issues.length > 0) {
    return { ok: false, issues }
  }

  return {
    ok: true,
    value: {
      databaseUrl,
      databaseUrlUnpooled,
      betterAuthSecret,
      betterAuthUrl,
      appUrl,
      isProduction,
    },
  }
}

export function assertValidServerEnv(
  env: Record<string, string | undefined> = process.env,
): ServerEnvSummary {
  const result = validateServerEnv(env)
  if (!result.ok) {
    const summary = result.issues.map((issue) => `${issue.key}: ${issue.message}`).join('; ')
    throw new Error(`Konfigurasi environment server tidak valid: ${summary}`)
  }
  return result.value
}

