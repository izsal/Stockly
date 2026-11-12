import { describe, expect, it } from 'vitest'
import { DomainError } from '../errors'
import { assertWorkspacePermission, hasWorkspacePermission } from './workspace'

describe('workspace permissions', () => {
  it('allows OWNER to read and write categories and products', () => {
    expect(hasWorkspacePermission('OWNER', 'categories:read')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'categories:write')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'products:read')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'products:write')).toBe(true)
  })

  it('allows STAFF to read catalog but forbids catalog mutations', () => {
    expect(hasWorkspacePermission('STAFF', 'categories:read')).toBe(true)
    expect(hasWorkspacePermission('STAFF', 'products:read')).toBe(true)
    expect(hasWorkspacePermission('STAFF', 'categories:write')).toBe(false)
    expect(hasWorkspacePermission('STAFF', 'products:write')).toBe(false)

    expect(() =>
      assertWorkspacePermission(
        { userId: 'user-1', workspaceId: 'ws-1', role: 'STAFF' },
        'products:write',
      ),
    ).toThrowError(DomainError)
  })

  it('throws UNAUTHORIZED when context is missing userId or workspaceId', () => {
    try {
      assertWorkspacePermission(
        { userId: '', workspaceId: 'ws-1', role: 'OWNER' },
        'products:read',
      )
      expect.fail('Expected DomainError')
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError)
      expect((error as DomainError).code).toBe('UNAUTHORIZED')
    }
  })
})

