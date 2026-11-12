import { relations, sql } from 'drizzle-orm'
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'
import { products } from './products'
import { warehouses, workspaces } from './workspaces'

export const inventoryStocks = pgTable(
  'inventory_stocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(),
    warehouseId: uuid('warehouse_id').notNull(),
    quantity: integer('quantity').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('inventory_stocks_workspace_product_warehouse_unique').on(
      table.workspaceId,
      table.productId,
      table.warehouseId,
    ),
    check('inventory_stocks_quantity_non_negative_check', sql`${table.quantity} >= 0`),
    foreignKey({
      name: 'inventory_stocks_workspace_product_fk',
      columns: [table.workspaceId, table.productId],
      foreignColumns: [products.workspaceId, products.id],
    }),
    foreignKey({
      name: 'inventory_stocks_workspace_warehouse_fk',
      columns: [table.workspaceId, table.warehouseId],
      foreignColumns: [warehouses.workspaceId, warehouses.id],
    }),
    index('inventory_stocks_workspace_warehouse_idx').on(table.workspaceId, table.warehouseId),
  ],
)

export const inventoryStockRelations = relations(inventoryStocks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [inventoryStocks.workspaceId],
    references: [workspaces.id],
  }),
  product: one(products, {
    fields: [inventoryStocks.productId],
    references: [products.id],
  }),
  warehouse: one(warehouses, {
    fields: [inventoryStocks.warehouseId],
    references: [warehouses.id],
  }),
}))

