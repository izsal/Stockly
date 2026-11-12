import { describe, expect, it } from 'vitest'
import { DomainError } from '../errors'
import { assertWorkspacePermission, hasWorkspacePermission } from './workspace'

describe('workspace permissions', () => {
  it('allows OWNER to read and write all catalog, supplier, and inventory actions', () => {
    expect(hasWorkspacePermission('OWNER', 'categories:read')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'categories:write')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'products:read')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'products:write')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'suppliers:read')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'suppliers:write')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'inventory:read')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'inventory:write')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'movements:read')).toBe(true)
    expect(hasWorkspacePermission('OWNER', 'reports:read')).toBe(true)
  })

  it('allows STAFF to read catalog/suppliers/movements/reports and create inventory movements, but forbids master-data mutations', () => {
    expect(hasWorkspacePermission('STAFF', 'categories:read')).toBe(true)
    expect(hasWorkspacePermission('STAFF', 'products:read')).toBe(true)
    expect(hasWorkspacePermission('STAFF', 'suppliers:read')).toBe(true)
    expect(hasWorkspacePermission('STAFF', 'inventory:read')).toBe(true)
    expect(hasWorkspacePermission('STAFF', 'inventory:write')).toBe(true)
    expect(hasWorkspacePermission('STAFF', 'movements:read')).toBe(true)
    expect(hasWorkspacePermission('STAFF', 'reports:read')).toBe(true)

    expect(hasWorkspacePermission('STAFF', 'categories:write')).toBe(false)
    expect(hasWorkspacePermission('STAFF', 'products:write')).toBe(false)
    expect(hasWorkspacePermission('STAFF', 'suppliers:write')).toBe(false)

    expect(() =>
      assertWorkspacePermission(
        { userId: 'user-1', workspaceId: 'ws-1', role: 'STAFF' },
        'products:write',
      ),
    ).toThrowError(DomainError)

    expect(() =>
      assertWorkspacePermission(
        { userId: 'user-1', workspaceId: 'ws-1', role: 'STAFF' },
        'suppliers:write',
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
