import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { users } from './auth'

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    slug: varchar('slug', { length: 80 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('workspaces_slug_key').on(table.slug)],
)

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').$type<'OWNER' | 'STAFF'>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('memberships_role_check', sql`${table.role} in ('OWNER', 'STAFF')`),
    unique('memberships_workspace_user_unique').on(table.workspaceId, table.userId),
    index('memberships_user_workspace_idx').on(table.userId, table.workspaceId),
    uniqueIndex('memberships_one_owner_per_workspace_idx')
      .on(table.workspaceId)
      .where(sql`${table.role} = 'OWNER'`),
  ],
)

export const warehouses = pgTable(
  'warehouses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 120 }).notNull(),
    code: varchar('code', { length: 40 }),
    address: text('address'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('warehouses_workspace_id_id_unique').on(table.workspaceId, table.id),
    uniqueIndex('warehouses_workspace_code_unique_idx')
      .on(table.workspaceId, table.code)
      .where(sql`${table.code} IS NOT NULL`),
    uniqueIndex('warehouses_one_default_per_workspace_idx')
      .on(table.workspaceId)
      .where(sql`${table.isDefault} = true`),
  ],
)

export const workspaceRelations = relations(workspaces, ({ many }) => ({
  memberships: many(memberships),
  warehouses: many(warehouses),
}))

export const membershipRelations = relations(memberships, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [memberships.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}))

export const warehouseRelations = relations(warehouses, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [warehouses.workspaceId],
    references: [workspaces.id],
  }),
}))
