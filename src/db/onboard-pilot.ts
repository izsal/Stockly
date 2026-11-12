import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { hashPassword } from 'better-auth/crypto'
import { config as loadEnv } from 'dotenv'
import { Pool, type PoolClient } from 'pg'
import { normalizeDatabaseUrl } from './connection-string.ts'
import {
  buildPilotWorkspaceSlug,
  pilotBatchSchema,
  SAMPLE_PILOT_BUSINESSES,
  type PilotBusinessConfig,
} from './pilot-config.ts'

loadEnv({ path: '.env.local' })
loadEnv()

async function ensureUser(
  client: PoolClient,
  input: { name: string; email: string; passwordHash: string },
): Promise<string> {
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
    [input.email],
  )
  if (existing.rows[0]) return existing.rows[0].id

  const userId = randomUUID()
  await client.query(
    'INSERT INTO "user" (id, name, email, "emailVerified") VALUES ($1, $2, $3, true)',
    [userId, input.name, input.email],
  )
  await client.query(
    'INSERT INTO "account" (id, "accountId", "providerId", "userId", password) VALUES ($1, $2, $3, $4, $5)',
    [randomUUID(), userId, 'credential', userId, input.passwordHash],
  )
  return userId
}

async function onboardOneBusiness(
  client: PoolClient,
  biz: PilotBusinessConfig,
  passwordHash: string,
) {
  const slug = buildPilotWorkspaceSlug(biz.businessName, biz.slug)
  const existing = await client.query<{ id: string }>(
    'SELECT id FROM workspaces WHERE slug = $1 LIMIT 1',
    [slug],
  )

  if (existing.rows[0]) {
    return { slug, status: 'skipped' as const, workspaceId: existing.rows[0].id }
  }

  const ownerId = await ensureUser(client, {
    name: biz.ownerName,
    email: biz.ownerEmail,
    passwordHash,
  })

  const workspaceRes = await client.query<{ id: string }>(
    'INSERT INTO workspaces (name, slug) VALUES ($1, $2) RETURNING id',
    [biz.businessName, slug],
  )
  const workspaceId = workspaceRes.rows[0].id

  await client.query(
    'INSERT INTO memberships (workspace_id, user_id, role) VALUES ($1, $2, $3)',
    [workspaceId, ownerId, 'OWNER'],
  )

  if (biz.staffEmail) {
    const staffId = await ensureUser(client, {
      name: biz.staffName ?? `Staf ${biz.businessName}`,
      email: biz.staffEmail,
      passwordHash,
    })
    await client.query(
      'INSERT INTO memberships (workspace_id, user_id, role) VALUES ($1, $2, $3)',
      [workspaceId, staffId, 'STAFF'],
    )
  }

  await client.query(
    'INSERT INTO warehouses (workspace_id, name, is_default) VALUES ($1, $2, true)',
    [workspaceId, biz.warehouseName],
  )

  for (const catName of biz.starterCategories) {
    await client.query(
      'INSERT INTO categories (workspace_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [workspaceId, catName],
    )
  }

  return { slug, status: 'created' as const, workspaceId }
}

async function main() {
  const args = process.argv.slice(2)
  const fileIndex = args.indexOf('--file')
  const useSample = args.includes('--sample') || fileIndex === -1

  let rawBatch: unknown = SAMPLE_PILOT_BUSINESSES
  if (!useSample && fileIndex !== -1) {
    const filePath = args[fileIndex + 1]
    if (!filePath) {
      throw new Error('Gunakan: pnpm pilot:onboard -- --file ./pilot-businesses.json')
    }
    rawBatch = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'))
  }

  const parsed = pilotBatchSchema.safeParse(rawBatch)
  if (!parsed.success) {
    throw new Error(
      `Konfigurasi bisnis pilot tidak valid: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
    )
  }

  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)
  if (!databaseUrl) {
    throw new Error('DATABASE_URL belum diatur di environment (.env.local).')
  }

  const defaultPassword =
    process.env.PILOT_DEFAULT_PASSWORD?.trim() ||
    process.env.DEMO_SEED_PASSWORD?.trim() ||
    'StocklyPilot2026!'
  const passwordHash = await hashPassword(defaultPassword)

  const pool = new Pool({ connectionString: databaseUrl, max: 2 })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const results = []
    for (const biz of parsed.data) {
      results.push(await onboardOneBusiness(client, biz, passwordHash))
    }
    await client.query('COMMIT')

    for (const item of results) {
      console.info(`[${item.status.toUpperCase()}] ${item.slug} (${item.workspaceId})`)
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error('Failed to onboard pilot businesses:', error instanceof Error ? error.message : error)
  process.exit(1)
})

