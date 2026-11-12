import 'server-only'

import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/src/db'
import { memberships } from '@/src/db/schema'
import { getSession } from '@/src/lib/auth-session'
import { DomainError } from '@/src/lib/errors'
import {
  assertWorkspacePermission,
  type WorkspaceAction,
  type WorkspaceContext,
} from '@/src/lib/permissions/workspace'

export async function requireWorkspaceContext(
  action?: WorkspaceAction,
  requestedWorkspaceId?: string,
): Promise<WorkspaceContext> {
  const session = await getSession()
  if (!session?.user) {
    throw new DomainError('UNAUTHORIZED', 'Silakan masuk terlebih dahulu.')
  }

  const membershipQuery = requestedWorkspaceId
    ? and(eq(memberships.userId, session.user.id), eq(memberships.workspaceId, requestedWorkspaceId))
    : eq(memberships.userId, session.user.id)

  const [membership] = await db
    .select({
      workspaceId: memberships.workspaceId,
      role: memberships.role,
    })
    .from(memberships)
    .where(membershipQuery)
    .orderBy(asc(memberships.createdAt))
    .limit(1)

  if (!membership) {
    throw new DomainError(
      'FORBIDDEN',
      'Anda tidak memiliki akses ke ruang kerja ini.',
    )
  }

  const ctx: WorkspaceContext = {
    userId: session.user.id,
    workspaceId: membership.workspaceId,
    role: membership.role,
  }

  if (action) {
    assertWorkspacePermission(ctx, action)
  }

  return ctx
}

