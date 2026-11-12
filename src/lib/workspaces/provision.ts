import 'server-only'

import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '@/src/db'
import { memberships, users, warehouses, workspaces } from '@/src/db/schema'
import { logServerError } from '@/src/lib/logger'
import { slugifyWorkspaceName } from './slug'

type NewAuthUser = {
  id: string
  name: string
}

export async function provisionWorkspaceForUser(user: NewAuthUser) {
  try {
    await db.transaction(async (tx) => {
      const existingMembership = await tx
        .select({ workspaceId: memberships.workspaceId })
        .from(memberships)
        .where(eq(memberships.userId, user.id))
        .limit(1)

      if (existingMembership.length > 0) return

      const workspaceName = `Ruang kerja ${user.name.trim()}`
      const slug = `${slugifyWorkspaceName(workspaceName)}-${randomUUID().slice(0, 8)}`
      const [workspace] = await tx
        .insert(workspaces)
        .values({ name: workspaceName, slug })
        .returning({ id: workspaces.id })

      await tx.insert(memberships).values({
        workspaceId: workspace.id,
        userId: user.id,
        role: 'OWNER',
      })

      await tx.insert(warehouses).values({
        workspaceId: workspace.id,
        name: 'Gudang Utama',
        isDefault: true,
      })
    })
  } catch (error) {
    try {
      await db.delete(users).where(eq(users.id, user.id))
    } catch (cleanupError) {
      logServerError('auth-provision-cleanup', cleanupError, { userId: user.id })
    }

    logServerError('auth-provision', error, { userId: user.id })
    throw error
  }
}
