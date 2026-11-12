import { relations } from 'drizzle-orm'
import { index, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { workspaces } from './workspaces'

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('categories_workspace_id_id_unique').on(table.workspaceId, table.id),
    unique('categories_workspace_name_unique').on(table.workspaceId, table.name),
    index('categories_workspace_name_idx').on(table.workspaceId, table.name),
  ],
)

export const categoryRelations = relations(categories, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [categories.workspaceId],
    references: [workspaces.id],
  }),
}))

