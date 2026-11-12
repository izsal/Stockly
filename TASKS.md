# Stockly — Development Task Breakdown

This task list converts the PRD and technical documents into an implementation sequence. Complete one milestone at a time. Do not start later milestones while the current milestone has failing checks.

## Project rules

- Read the root `PRD.md`, `docs/TDD.md`, `docs/DATABASE.md`, and `docs/DESIGN_SYSTEM.md` before implementation.
- Use TypeScript strict mode.
- Use Server Components by default.
- Keep database access server-only.
- Scope all business data by authenticated workspace.
- Route all stock mutations through `InventoryService`.
- Update this file as tasks are completed.
- Do not implement deferred Phase 2/3 features.

## Milestone 0 — Repository and project setup

- [ ] Create Next.js App Router project with TypeScript.
- [ ] Configure ESLint and formatting.
- [ ] Configure Tailwind CSS and shadcn/ui.
- [ ] Add Zod.
- [ ] Add Drizzle ORM and Drizzle Kit; use a shared `pg.Pool` for the Better Auth-compatible adapter.
- [ ] Add Better Auth and its Drizzle adapter.
- [ ] Create `.env.example`.
- [ ] Add `server-only` to database modules.
- [ ] Add scripts: `dev`, `build`, `lint`, `typecheck`, `db:generate`, and `db:studio`; apply DDL through the connected Neon migration integration and defer seeding until feature milestones require fixtures.
- [ ] Verify local app starts and production build succeeds.

Acceptance:
- `npm run dev` works.
- `npm run typecheck` passes.
- `npm run lint` passes.
- No secrets are committed.

## Milestone 1 — Foundation and authentication

### Database
- [x] Configure Neon connection.
- [x] Configure Drizzle.
- [x] Add Better Auth schema using the selected version's supported schema.
- [x] Add workspaces table.
- [x] Add memberships table.
- [x] Add required indexes and constraints.
- [x] Generate and run migrations.

### Authentication
- [x] Configure Better Auth.
- [x] Implement registration.
- [x] Implement login.
- [x] Implement logout.
- [x] Implement protected dashboard layout.
- [x] Add server-side session helper.
- [x] Add workspace access helper.
- [x] On first registration, create a workspace, OWNER membership, and default warehouse in a safe transaction.

### UI
- [x] Build auth layout.
- [x] Build login page.
- [x] Build registration page.
- [x] Build dashboard shell.
- [x] Build sidebar and header.
- [x] Add workspace context.

Acceptance:
- User can register, log in, and log out.
- Authenticated user gets a workspace.
- Protected routes redirect unauthenticated users.
- A user cannot access another workspace by changing a URL or submitted ID.

Verification note: Sign-up, sign-in, and sign-out are implemented; full session verification remains pending because Better Auth reports the configured `BETTER_AUTH_SECRET` is too short or low-entropy. Replace it with a cryptographically random value of at least 32 characters before testing authenticated flows.

## Milestone 2 — Product and category management

### Database
- [x] Add categories.
- [x] Add products.
- [x] Add workspace-scoped SKU uniqueness.
- [x] Add optional workspace-scoped barcode uniqueness.
- [x] Add soft-delete fields and indexes.

### Services and validation
- [x] Create product schemas with Zod.
- [x] Create category schemas with Zod.
- [x] Implement ProductService.
- [x] Implement CategoryService.
- [x] Enforce workspace scoping and role checks.
- [x] Normalize SKU and barcode consistently.

### UI
- [x] Product list with pagination.
- [x] Product search by name/SKU/barcode.
- [x] Category filter.
- [x] Create product form.
- [x] Edit product form.
- [x] Archive/deactivate product.
- [x] Category CRUD.
- [x] Empty, loading, and error states.

Acceptance:
- Product CRUD works.
- Duplicate SKU is rejected within a workspace.
- The same SKU may exist in a different workspace.
- Product form cannot directly change current stock.
- Archived products with movement history remain auditable.

## Milestone 3 — Supplier and inventory core

### Database
- [ ] Add suppliers.
- [ ] Add warehouses (one default warehouse per workspace in MVP).
- [ ] Add inventory_stocks.
- [ ] Add inventory_movements.
- [ ] Add constraints and indexes.
- [ ] Add composite tenant-safe foreign keys where practical.

### Inventory service
- [ ] Implement `createStockIn`.
- [ ] Implement `createStockOut`.
- [ ] Implement `createAdjustment`.
- [ ] Lock stock rows or use safe atomic conditional updates.
- [ ] Update balance and insert movement in one transaction.
- [ ] Reject negative stock.
- [ ] Store before/delta/after quantities.
- [ ] Record actor and reason.
- [ ] Prevent editing/deleting movement history.

### UI
- [ ] Supplier CRUD.
- [ ] Stock In form.
- [ ] Stock Out form.
- [ ] Stock Adjustment form.
- [ ] Movement history table.
- [ ] Product current-stock display.
- [ ] Confirmation dialogs and toast feedback.

Acceptance:
- Stock in increases stock.
- Stock out decreases stock.
- Adjustment sets stock to counted quantity through a delta movement.
- Negative stock is rejected.
- Two concurrent stock-outs cannot overspend the same balance.
- Movement ledger and stock balance remain consistent.
- Cross-workspace product/supplier/warehouse references are rejected.

## Milestone 4 — Dashboard and reports

- [ ] Total active products.
- [ ] Total stock units with clear label.
- [ ] Low-stock products.
- [ ] Out-of-stock products.
- [ ] Recent movements.
- [ ] Movement summary by date range.
- [ ] Current stock report.
- [ ] Low-stock report.
- [ ] Movement report with filters.
- [ ] CSV export.
- [ ] Paginate large datasets.
- [ ] Verify dashboard aggregates are workspace-scoped.

Acceptance:
- Dashboard numbers match database records.
- Reports respect date range and workspace.
- CSV export contains only the current workspace's data.
- Low-stock means quantity <= minimum_stock.
- Out-of-stock means quantity = 0.

## Milestone 5 — Quality, security, and beta release

### Testing
- [ ] Unit tests for movement calculations.
- [ ] Integration tests for inventory transactions.
- [ ] Tenant isolation tests.
- [ ] Role authorization tests.
- [ ] Negative-stock tests.
- [ ] Concurrency tests.
- [ ] E2E test for registration to stock reporting.
- [ ] Responsive tests at 375px, 768px, 1024px, and 1440px.

### Security and operations
- [ ] Review environment variables.
- [ ] Review auth cookie/session configuration.
- [ ] Verify server-only database access.
- [ ] Add rate limiting to sensitive endpoints where appropriate.
- [ ] Add safe error handling and server logging.
- [ ] Confirm database backup/recovery approach.
- [ ] Verify Vercel plan terms for intended commercial use.
- [ ] Verify Neon quota and connection usage.
- [ ] Add production deployment instructions.

### Beta
- [ ] Create demo workspace and seed data.
- [ ] Onboard 3–5 pilot businesses.
- [ ] Collect usability feedback.
- [ ] Fix blocking bugs.
- [ ] Document known limitations.

Acceptance:
- Build, lint, typecheck, and tests pass.
- No critical tenant isolation issue remains.
- Inventory balance reconciles with movement ledger.
- Pilot users can complete daily stock workflows.

## Deferred backlog (do not build in MVP)

- [ ] Multi-branch management UI.
- [ ] Inter-warehouse transfers.
- [ ] Product variants (size/color).
- [ ] Purchase orders.
- [ ] POS and sales checkout.
- [ ] Barcode camera scanning.
- [ ] Excel import.
- [ ] WhatsApp notifications.
- [ ] Subscription billing automation.
- [ ] Marketplace integrations.
- [ ] AI stock forecasting.

## Codex execution protocol

For each task:
1. Inspect the existing repository and relevant docs.
2. State a concise implementation plan.
3. Implement only the current task or small related group.
4. Add/update tests.
5. Run lint, typecheck, and relevant tests.
6. Fix failures before declaring completion.
7. Update this file and README.
8. Do not silently change product scope or database design; explain proposed changes first.
