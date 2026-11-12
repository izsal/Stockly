import { DomainError } from '../errors'

export type WorkspaceRole = 'OWNER' | 'STAFF'

export type WorkspaceContext = {
  userId: string
  workspaceId: string
  role: WorkspaceRole
}

export type WorkspaceAction =
  | 'categories:read'
  | 'categories:write'
  | 'products:read'
  | 'products:write'

const WORKSPACE_PERMISSIONS: Record<WorkspaceAction, readonly WorkspaceRole[]> = {
  'categories:read': ['OWNER', 'STAFF'],
  'categories:write': ['OWNER'],
  'products:read': ['OWNER', 'STAFF'],
  'products:write': ['OWNER'],
}

export function hasWorkspacePermission(role: WorkspaceRole, action: WorkspaceAction): boolean {
  return WORKSPACE_PERMISSIONS[action].includes(role)
}

export function assertWorkspacePermission(ctx: WorkspaceContext, action: WorkspaceAction): void {
  if (!ctx.userId || !ctx.workspaceId) {
    throw new DomainError('UNAUTHORIZED', 'Sesi pengguna atau ruang kerja tidak valid.')
  }

  if (!hasWorkspacePermission(ctx.role, action)) {
    throw new DomainError('FORBIDDEN', 'Anda tidak memiliki izin untuk melakukan tindakan ini.')
  }
}

