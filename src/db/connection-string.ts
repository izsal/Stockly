const LEGACY_STRICT_SSL_MODES = new Set(['prefer', 'require', 'verify-ca'])

/**
 * Upgrades pg-connection-string legacy SSL mode aliases to `verify-full`
 * so TLS behavior stays strict without triggering pg v8 deprecation warnings.
 */
export function normalizeDatabaseUrl(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString

  try {
    const url = new URL(connectionString)
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase()
    const useLibpqCompat = url.searchParams.get('uselibpqcompat')?.toLowerCase() === 'true'

    if (sslMode && LEGACY_STRICT_SSL_MODES.has(sslMode) && !useLibpqCompat) {
      url.searchParams.set('sslmode', 'verify-full')
      return url.toString()
    }
  } catch {
    return connectionString
  }

  return connectionString
}

