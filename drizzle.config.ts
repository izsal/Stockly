import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.development.local' })

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
})
