import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { config as loadEnv } from 'dotenv'
import { Pool, type PoolClient } from 'pg'
import { normalizeDatabaseUrl } from './connection-string.ts'
import {
  buildDemoMovementsForProduct,
  DEMO_CATEGORIES,
  DEMO_PRODUCTS,
  DEMO_SUPPLIERS,
  DEMO_USERS,
  DEMO_WORKSPACE,
} from './seed-data.ts'

loadEnv({ path: '.env.local' })
loadEnv()

async function ensureDemoUser(
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

async function seedDemoWorkspace(client: PoolClient, passwordHash: string) {
  const existingWorkspace = await client.query<{ id: string }>(
    'SELECT id FROM workspaces WHERE slug = $1 LIMIT 1',
    [DEMO_WORKSPACE.slug],
  )
  if (existingWorkspace.rows[0]) {
    return { created: false, workspaceId: existingWorkspace.rows[0].id }
  }

  const ownerId = await ensureDemoUser(client, {
    name: DEMO_USERS.owner.name,
    email: DEMO_USERS.owner.email,
    passwordHash,
  })
  const staffId = await ensureDemoUser(client, {
    name: DEMO_USERS.staff.name,
    email: DEMO_USERS.staff.email,
    passwordHash,
  })

  const workspaceRes = await client.query<{ id: string }>(
    'INSERT INTO workspaces (name, slug) VALUES ($1, $2) RETURNING id',
    [DEMO_WORKSPACE.name, DEMO_WORKSPACE.slug],
  )
  const workspaceId = workspaceRes.rows[0].id

  await client.query(
    'INSERT INTO memberships (workspace_id, user_id, role) VALUES ($1, $2, $3), ($1, $4, $5)',
    [workspaceId, ownerId, 'OWNER', staffId, 'STAFF'],
  )

  const warehouseRes = await client.query<{ id: string }>(
    'INSERT INTO warehouses (workspace_id, name, code, address, is_default) VALUES ($1, $2, $3, $4, true) RETURNING id',
    [
      workspaceId,
      DEMO_WORKSPACE.warehouseName,
      DEMO_WORKSPACE.warehouseCode,
      DEMO_WORKSPACE.warehouseAddress,
    ],
  )
  const warehouseId = warehouseRes.rows[0].id

  const categoryMap = new Map<string, string>()
  for (const cat of DEMO_CATEGORIES) {
    const res = await client.query<{ id: string }>(
      'INSERT INTO categories (workspace_id, name, description) VALUES ($1, $2, $3) RETURNING id',
      [workspaceId, cat.name, cat.description],
    )
    categoryMap.set(cat.name, res.rows[0].id)
  }

  const supplierMap = new Map<string, string>()
  for (const sup of DEMO_SUPPLIERS) {
    const res = await client.query<{ id: string }>(
      'INSERT INTO suppliers (workspace_id, name, phone, email, address, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [workspaceId, sup.name, sup.phone, sup.email, sup.address, sup.notes],
    )
    supplierMap.set(sup.name, res.rows[0].id)
  }

  for (const prod of DEMO_PRODUCTS) {
    const productRes = await client.query<{ id: string }>(
      `INSERT INTO products (
        workspace_id, category_id, name, sku, barcode, unit, cost_price, selling_price, minimum_stock, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true) RETURNING id`,
      [
        workspaceId,
        categoryMap.get(prod.categoryName) ?? null,
        prod.name,
        prod.sku,
        prod.barcode,
        prod.unit,
        prod.costPrice,
        prod.sellingPrice,
        prod.minimumStock,
      ],
    )
    const productId = productRes.rows[0].id

    const movements = buildDemoMovementsForProduct(prod)
    const finalBalance = movements[movements.length - 1]?.quantityAfter ?? 0

    await client.query(
      `INSERT INTO inventory_stocks (workspace_id, product_id, warehouse_id, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (workspace_id, product_id, warehouse_id)
       DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()`,
      [workspaceId, productId, warehouseId, finalBalance],
    )

    for (const [idx, move] of movements.entries()) {
      await client.query(
        `INSERT INTO inventory_movements (
          workspace_id, product_id, warehouse_id, supplier_id, created_by,
          type, quantity_delta, quantity_before, quantity_after,
          reason, reference_number, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          workspaceId,
          productId,
          warehouseId,
          move.supplierName ? (supplierMap.get(move.supplierName) ?? null) : null,
          idx % 2 === 0 ? ownerId : staffId,
          move.type,
          move.quantityDelta,
          move.quantityBefore,
          move.quantityAfter,
          move.reason,
          move.referenceNumber ?? null,
          move.notes ?? null,
        ],
      )
    }
  }

  return { created: true, workspaceId }
}

async function main() {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)
  if (!databaseUrl) {
    throw new Error('DATABASE_URL belum diatur di environment (.env.local).')
  }

  const demoPassword = process.env.DEMO_SEED_PASSWORD?.trim() || 'StocklyDemo2026!'
  const passwordHash = await hashPassword(demoPassword)

  const pool = new Pool({ connectionString: databaseUrl, max: 2 })
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const summary = await seedDemoWorkspace(client, passwordHash)
    await client.query('COMMIT')

    if (summary.created) {
      console.info(
        `Demo workspace seeded (${summary.workspaceId}). Demo accounts: ${DEMO_USERS.owner.email} (OWNER), ${DEMO_USERS.staff.email} (STAFF).`,
      )
    } else {
      console.info(`Demo workspace already exists (${summary.workspaceId}). Skipping seed.`)
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
  console.error('Failed to seed demo workspace:', error instanceof Error ? error.message : error)
  process.exit(1)
})
