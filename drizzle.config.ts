import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import { normalizeDatabaseUrl } from './src/db/connection-string'

config({ path: ['.env.development.local', '.env.local', '.env'] })

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: normalizeDatabaseUrl(process.env.DATABASE_URL)!,
  },
  strict: true,
  verbose: true,
})
