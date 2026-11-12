import { relations, sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { products } from './products'
import { suppliers } from './suppliers'
import { warehouses, workspaces } from './workspaces'

export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(),
    warehouseId: uuid('warehouse_id').notNull(),
    supplierId: uuid('supplier_id'),
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    type: text('type').$type<'IN' | 'OUT' | 'ADJUSTMENT'>().notNull(),
    quantityDelta: integer('quantity_delta').notNull(),
    quantityBefore: integer('quantity_before').notNull(),
    quantityAfter: integer('quantity_after').notNull(),
    reason: varchar('reason', { length: 80 }),
    referenceNumber: varchar('reference_number', { length: 100 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'inventory_movements_type_check',
      sql`${table.type} in ('IN', 'OUT', 'ADJUSTMENT')`,
    ),
    check(
      'inventory_movements_quantity_consistency_check',
      sql`${table.quantityAfter} = ${table.quantityBefore} + ${table.quantityDelta}`,
    ),
    check(
      'inventory_movements_quantity_before_non_negative_check',
      sql`${table.quantityBefore} >= 0`,
    ),
    check(
      'inventory_movements_quantity_after_non_negative_check',
      sql`${table.quantityAfter} >= 0`,
    ),
    foreignKey({
      name: 'inventory_movements_workspace_product_fk',
      columns: [table.workspaceId, table.productId],
      foreignColumns: [products.workspaceId, products.id],
    }),
    foreignKey({
      name: 'inventory_movements_workspace_warehouse_fk',
      columns: [table.workspaceId, table.warehouseId],
      foreignColumns: [warehouses.workspaceId, warehouses.id],
    }),
    foreignKey({
      name: 'inventory_movements_workspace_supplier_fk',
      columns: [table.workspaceId, table.supplierId],
      foreignColumns: [suppliers.workspaceId, suppliers.id],
    }),
    index('inventory_movements_workspace_created_at_idx').on(
      table.workspaceId,
      table.createdAt.desc(),
    ),
    index('inventory_movements_workspace_product_idx').on(
      table.workspaceId,
      table.productId,
      table.createdAt.desc(),
    ),
    index('inventory_movements_workspace_warehouse_idx').on(
      table.workspaceId,
      table.warehouseId,
      table.createdAt.desc(),
    ),
  ],
)

export const inventoryMovementRelations = relations(inventoryMovements, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [inventoryMovements.workspaceId],
    references: [workspaces.id],
  }),
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryMovements.warehouseId],
    references: [warehouses.id],
  }),
  supplier: one(suppliers, {
    fields: [inventoryMovements.supplierId],
    references: [suppliers.id],
  }),
  creator: one(users, {
    fields: [inventoryMovements.createdBy],
    references: [users.id],
  }),
}))

