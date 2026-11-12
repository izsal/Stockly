import 'server-only'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { normalizeDatabaseUrl } from './connection-string'
import * as schema from './schema'

const globalForDatabase = globalThis as typeof globalThis & {
  stocklyPool?: Pool
}

export const pool =
  globalForDatabase.stocklyPool ??
  new Pool({
    connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL),
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDatabase.stocklyPool = pool
}

export const db = drizzle(pool, { schema })
