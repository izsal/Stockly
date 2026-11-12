import { relations, sql } from 'drizzle-orm'
import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { workspaces } from './workspaces'

export const suppliers = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 160 }).notNull(),
    phone: varchar('phone', { length: 40 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    unique('suppliers_workspace_id_id_unique').on(table.workspaceId, table.id),
    uniqueIndex('suppliers_workspace_name_unique_idx')
      .on(table.workspaceId, table.name)
      .where(sql`${table.deletedAt} IS NULL`),
    index('suppliers_workspace_name_idx').on(table.workspaceId, table.name),
    index('suppliers_workspace_deleted_at_idx').on(table.workspaceId, table.deletedAt),
  ],
)

export const supplierRelations = relations(suppliers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [suppliers.workspaceId],
    references: [workspaces.id],
  }),
}))

