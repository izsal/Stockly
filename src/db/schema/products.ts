import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { categories } from './categories'
import { workspaces } from './workspaces'

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id'),
    name: varchar('name', { length: 180 }).notNull(),
    sku: varchar('sku', { length: 80 }).notNull(),
    barcode: varchar('barcode', { length: 100 }),
    description: text('description'),
    unit: varchar('unit', { length: 30 }).notNull().default('pcs'),
    costPrice: numeric('cost_price', { precision: 14, scale: 2 }).notNull().default('0'),
    sellingPrice: numeric('selling_price', { precision: 14, scale: 2 }).notNull().default('0'),
    minimumStock: integer('minimum_stock').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    unique('products_workspace_id_id_unique').on(table.workspaceId, table.id),
    unique('products_workspace_sku_unique').on(table.workspaceId, table.sku),
    uniqueIndex('products_workspace_barcode_unique_idx')
      .on(table.workspaceId, table.barcode)
      .where(sql`${table.barcode} IS NOT NULL`),
    index('products_workspace_name_idx').on(table.workspaceId, table.name),
    index('products_workspace_category_idx').on(table.workspaceId, table.categoryId),
    index('products_workspace_deleted_at_idx').on(table.workspaceId, table.deletedAt),
    index('products_workspace_active_idx').on(table.workspaceId, table.isActive),
    foreignKey({
      name: 'products_workspace_category_fk',
      columns: [table.workspaceId, table.categoryId],
      foreignColumns: [categories.workspaceId, categories.id],
    }),
    check('products_cost_price_non_negative_check', sql`${table.costPrice} >= 0`),
    check('products_selling_price_non_negative_check', sql`${table.sellingPrice} >= 0`),
    check('products_minimum_stock_non_negative_check', sql`${table.minimumStock} >= 0`),
  ],
)

export const productRelations = relations(products, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [products.workspaceId],
    references: [workspaces.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}))

