import 'server-only'

import { asc, eq } from 'drizzle-orm'
import { db } from '@/src/db'
import { memberships, workspaces } from '@/src/db/schema'

export async function getCurrentWorkspaceForUser(userId: string) {
  const [workspace] = await db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(workspaces, eq(memberships.workspaceId, workspaces.id))
    .where(eq(memberships.userId, userId))
    .orderBy(asc(memberships.createdAt))
    .limit(1)

  return workspace ?? null
}
