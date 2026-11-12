# Stockly — Technical Design Document (TDD)

- Product: Stockly
- Version: 1.0
- Status: Draft for MVP implementation
- Stack: Next.js App Router, TypeScript, Neon PostgreSQL, Drizzle ORM, Better Auth, Vercel

## 1. Purpose

This document defines the technical architecture for Stockly, a multi-tenant inventory management SaaS for Indonesian small businesses. It complements `PRD.md`; the PRD defines what the product does, while this document defines how it is implemented.

## 2. MVP scope

Included:
- Authentication and user sessions
- Workspace creation and membership
- Products, categories, suppliers
- One default warehouse per workspace in the MVP
- Stock-in, stock-out, and stock adjustment
- Immutable inventory movement history
- Low-stock indicators
- Dashboard summaries and CSV export

Deferred:
- POS and sales checkout
- Multi-branch UI and stock transfers
- Purchase-order workflow
- Marketplace integrations
- WhatsApp automation
- AI forecasting
- Automated subscription billing

The schema should be extensible for multiple warehouses, but the MVP UI exposes only the default warehouse.

## 3. Architecture decisions

| Area | Decision | Reason |
|---|---|---|
| Web application | Next.js App Router | One deployable application for UI and server endpoints |
| Language | TypeScript strict mode | Safer domain and database code |
| Database | Neon PostgreSQL | Managed PostgreSQL with a low-cost starting tier |
| ORM | Drizzle ORM | Typed schema, SQL-oriented queries, migrations |
| Authentication | Better Auth | Session-based authentication with database adapter |
| Validation | Zod | Shared input validation at server boundaries |
| UI | Tailwind CSS + shadcn/ui | Accessible, composable components |
| Charts | Recharts | Dashboard visualizations |
| Hosting | Vercel | Integrated Next.js deployment |
| File storage | None in MVP | Avoid recurring cost; product images deferred |
| Background jobs | None in MVP | Low-stock status is computed on demand |

Use currently compatible stable package versions and commit the lockfile. Do not blindly upgrade major versions during feature development.

## 4. High-level architecture

```text
Browser
  |
  v
Next.js App Router
  |-- Server Components (read-oriented UI)
  |-- Server Actions (authenticated application mutations)
  |-- Route Handlers (auth endpoints, future webhooks/API)
  |
  v
Application services
  |-- Auth / Workspace access
  |-- Product service
  |-- Supplier service
  |-- Inventory service
  |-- Reporting service
  |
  v
Drizzle ORM
  |
  v
Neon PostgreSQL
```

All database access happens on the server. Never expose `DATABASE_URL`, auth secrets, or privileged credentials to client components.

## 5. Next.js conventions

- Use App Router and route groups `(auth)` and `(dashboard)`.
- Prefer Server Components for pages and data loading.
- Use Client Components only for interactive controls (tables, dialogs, forms, charts where needed).
- Use Server Actions for first-party form mutations when appropriate.
- Use Route Handlers for Better Auth integration and future external APIs/webhooks.
- Add `import "server-only"` to modules that contain database access or secrets.
- Do not call the database directly from Client Components.
- Keep domain logic in `src/services`, not inside UI components.
- Use `loading.tsx`, `error.tsx`, and `not-found.tsx` for appropriate route states.
- Use `revalidatePath` or targeted cache invalidation after mutations. Avoid caching tenant-specific data unless cache keys are tenant-safe.

## 6. Authentication and authorization

### Authentication
- Use Better Auth with its Drizzle adapter and PostgreSQL database.
- Use email/password for MVP.
- Configure secure cookies and production HTTPS.
- Keep Better Auth's user, session, account, and verification tables separate from business tables.
- Do not implement password hashing or session management manually.

### Authorization
MVP roles:
- `OWNER`: full access to the workspace and its settings.
- `STAFF`: can view inventory and create stock movements; cannot manage workspace ownership or sensitive settings.

Every protected server operation must:
1. Resolve the current authenticated user from the server session.
2. Resolve the active workspace from a trusted membership lookup.
3. Verify the user's membership and role.
4. Scope every business-data query by the resolved `workspaceId`.
5. Reject unauthorized requests before reading or mutating data.

Never trust a `workspaceId`, `userId`, role, or owner flag supplied by the browser without verifying it against the authenticated session and database.

## 7. Multi-tenancy

- One workspace represents one shop/business account.
- A user can belong to one or more workspaces in the future.
- `memberships` links users to workspaces and stores the role.
- Every business table must include `workspace_id`.
- Use workspace-scoped unique constraints, e.g. `(workspace_id, sku)`.
- Every query must include a workspace predicate.
- Add tests proving that Workspace A cannot read or mutate Workspace B's records.
- Prefer composite foreign keys where practical to prevent cross-workspace references at the database level.
- Do not rely on obscure client-side filtering as a security boundary.

For the first MVP, workspace switching can be simple. The server must still verify membership on every request.

## 8. Database connection strategy

- Use the Neon pooled `DATABASE_URL` for application runtime.
- Use one server-only `pg.Pool` shared by Drizzle and Better Auth's Drizzle adapter; this keeps auth and application queries on the same transaction-capable PostgreSQL connection strategy.
- Do not use `@neondatabase/serverless` in the Better Auth runtime stack; the selected Better Auth integration uses `pg` with `drizzle-orm/node-postgres`.
- Keep database connection creation in one server-only module and reuse the pool across requests.
- Apply schema DDL through the connected Neon migration integration in this v0 workspace; Drizzle Kit is used to generate and version migration files, not to apply them directly here.
- Set the runtime to Node.js for modules that use `pg`.

Example environment variables:

```dotenv
DATABASE_URL="postgresql://...pooled..."
DATABASE_URL_UNPOOLED="postgresql://...direct..."
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Never commit `.env.local`. Commit only `.env.example` with placeholders.

## 9. Inventory domain rules

### Source of truth
- `inventory_stocks` stores the current balance for fast reads.
- `inventory_movements` is the immutable audit ledger.
- Both must be updated in the same database transaction.
- A stock balance must equal the sum of all signed movement deltas for that product and warehouse, assuming an opening balance is also recorded as a movement.

### Movement rules
- `IN`: positive delta.
- `OUT`: negative delta.
- `ADJUSTMENT`: delta = counted quantity - current quantity.
- User submits a positive quantity for IN/OUT. The service derives the signed delta.
- For adjustment, user submits the physically counted quantity; the service computes the difference.
- Quantity must be a positive integer for IN/OUT.
- A movement with a zero adjustment delta should either be rejected or recorded as a no-op according to a single documented product decision. MVP recommendation: reject zero-delta adjustments.
- Stock must not become negative unless a future workspace setting explicitly allows it. MVP: never allow negative stock.

### Transaction algorithm
1. Validate input with Zod.
2. Resolve and authorize workspace and actor.
3. Begin database transaction.
4. Lock the relevant stock row (`SELECT ... FOR UPDATE`) or use an equivalent atomic conditional update.
5. Read current quantity.
6. Calculate delta and resulting quantity.
7. Reject if resulting quantity is negative.
8. Update `inventory_stocks`.
9. Insert immutable `inventory_movements` with before, delta, after, reason, actor, and reference fields.
10. Commit transaction.
11. Revalidate affected pages.

Use row-level locking to prevent two concurrent stock-outs from both spending the same available quantity. Add concurrency tests.

## 10. Validation and error handling

- Validate all mutation inputs with Zod on the server.
- Normalize SKU and barcode consistently (trim whitespace; define case-sensitivity).
- Return typed domain errors such as `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `INSUFFICIENT_STOCK`, and `CONFLICT`.
- Do not leak SQL errors, secrets, or stack traces to users.
- Log unexpected server errors with a request/correlation ID.
- Show actionable Indonesian error messages in the UI.

## 11. Application structure

```text
src/
  app/
    (auth)/
      login/
      register/
    (dashboard)/
      dashboard/
      products/
      categories/
      suppliers/
      inventory/
      movements/
      reports/
      settings/
    api/
      auth/[...all]/
  components/
    ui/
    layout/
    shared/
  features/
    products/
    categories/
    suppliers/
    inventory/
    reports/
  db/
    schema/
    relations.ts
    index.ts
  lib/
    auth/
    permissions/
    validations/
    utils/
  services/
    workspace.service.ts
    product.service.ts
    supplier.service.ts
    inventory.service.ts
    report.service.ts
```

## 12. Testing strategy

- Unit tests: inventory delta calculations and validation.
- Integration tests: database services and transaction behavior.
- Authorization tests: role permissions and workspace isolation.
- Concurrency tests: simultaneous stock-outs against one stock balance.
- E2E tests: login, create product, stock in, stock out, adjustment, report.
- Run lint, typecheck, and tests before merging each milestone.

## 13. Performance and cost controls

- Use pagination for product and movement tables.
- Add indexes for workspace filters, SKU, barcode, product, warehouse, and movement date.
- Fetch dashboard aggregates in a small number of queries.
- Avoid polling and scheduled jobs in MVP.
- Avoid storing uploaded images in MVP.
- Monitor Neon compute/storage and Vercel usage.
- Confirm current hosting plan terms permit the intended commercial use before accepting paying customers.

## 14. Definition of done

A feature is done when:
- Server-side authorization is implemented.
- Tenant scoping is tested.
- Inputs are validated.
- Loading, empty, success, and error states exist.
- Database migrations are committed.
- Typecheck and relevant tests pass.
- README or relevant documentation is updated.
