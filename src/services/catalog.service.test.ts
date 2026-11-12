import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { DomainError } from '@/src/lib/errors'
import type { WorkspaceContext } from '@/src/lib/permissions/workspace'
import { CategoryService } from './category.service'
import type { AppDatabase } from './helpers'
import { ProductService } from './product.service'

const OWNER_CTX: WorkspaceContext = {
  userId: 'user-owner',
  workspaceId: '11111111-1111-4111-8111-111111111111',
  role: 'OWNER',
}

const STAFF_CTX: WorkspaceContext = {
  userId: 'user-staff',
  workspaceId: '11111111-1111-4111-8111-111111111111',
  role: 'STAFF',
}

describe('CategoryService', () => {
  it('forbids STAFF from creating a category before touching the database', async () => {
    const fakeDb = {} as AppDatabase

    await expect(
      CategoryService.createCategory(STAFF_CTX, { name: 'Minuman' }, fakeDb),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
  })

  it('maps duplicate workspace category name to CONFLICT', async () => {
    const returning = vi.fn().mockRejectedValue({
      code: '23505',
      constraint: 'categories_workspace_name_unique',
    })
    const values = vi.fn(() => ({ returning }))
    const insert = vi.fn(() => ({ values }))
    const fakeDb = { insert } as unknown as AppDatabase

    await expect(
      CategoryService.createCategory(OWNER_CTX, { name: 'Minuman' }, fakeDb),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'Nama kategori sudah digunakan di ruang kerja ini.',
    })
  })

  it('throws NOT_FOUND when category is outside the authenticated workspace', async () => {
    const limit = vi.fn().mockResolvedValue([])
    const where = vi.fn(() => ({ limit }))
    const from = vi.fn(() => ({ where }))
    const select = vi.fn(() => ({ from }))
    const fakeDb = { select } as unknown as AppDatabase

    await expect(
      CategoryService.getCategoryById(
        OWNER_CTX,
        '22222222-2222-4222-8222-222222222222',
        fakeDb,
      ),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

describe('ProductService', () => {
  it('rejects cross-workspace category references before inserting product', async () => {
    const limit = vi.fn().mockResolvedValue([])
    const where = vi.fn(() => ({ limit }))
    const from = vi.fn(() => ({ where }))
    const select = vi.fn(() => ({ from }))
    const insert = vi.fn()
    const fakeDb = { select, insert } as unknown as AppDatabase

    await expect(
      ProductService.createProduct(
        OWNER_CTX,
        {
          name: 'Air Mineral',
          sku: 'air-600',
          categoryId: '33333333-3333-4333-8333-333333333333',
        },
        fakeDb,
      ),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Kategori tidak ditemukan di ruang kerja ini.',
    })

    expect(insert).not.toHaveBeenCalled()
  })

  it('maps duplicate SKU within a workspace to CONFLICT', async () => {
    const returning = vi.fn().mockRejectedValue({
      code: '23505',
      constraint: 'products_workspace_sku_unique',
    })
    const values = vi.fn(() => ({ returning }))
    const insert = vi.fn(() => ({ values }))
    const fakeDb = { insert } as unknown as AppDatabase

    await expect(
      ProductService.createProduct(
        OWNER_CTX,
        {
          name: 'Kopi Hitam',
          sku: 'kopi-01',
        },
        fakeDb,
      ),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'SKU sudah digunakan oleh produk lain di ruang kerja ini.',
    })
  })

  it('rejects empty product update payloads with VALIDATION_ERROR', async () => {
    const fakeDb = {} as AppDatabase

    await expect(
      ProductService.updateProduct(
        OWNER_CTX,
        '44444444-4444-4444-8444-444444444444',
        {},
        fakeDb,
      ),
    ).rejects.toBeInstanceOf(DomainError)
  })

  it('archives a product using soft-delete fields scoped to workspace', async () => {
    const archivedRecord = {
      id: '44444444-4444-4444-8444-444444444444',
      workspaceId: OWNER_CTX.workspaceId,
      isActive: false,
      deletedAt: new Date(),
    }
    const returning = vi.fn().mockResolvedValue([archivedRecord])
    const where = vi.fn(() => ({ returning }))
    const set = vi.fn(() => ({ where }))
    const update = vi.fn(() => ({ set }))
    const fakeDb = { update } as unknown as AppDatabase

    const result = await ProductService.archiveProduct(
      OWNER_CTX,
      '44444444-4444-4444-8444-444444444444',
      fakeDb,
    )

    expect(result.isActive).toBe(false)
    expect(result.deletedAt).toBeInstanceOf(Date)
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        deletedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    )
  })
})

