# Stockly

Stockly is an inventory-management app for Indonesian businesses. The current implementation covers the Foundation milestone (email/password authentication, protected workspace dashboard, owner membership, and default warehouse), Milestone 2 (workspace-scoped product and category management), Milestone 3 (supplier CRUD, atomic stock in/out/adjustment movements with row-level locking, current-stock display, and append-only movement history), Milestone 4 (operational dashboard KPIs, movement summaries by date range, stock & movement reports, and CSV export), and Milestone 5 hardening (rate limiting on auth/export endpoints, structured safe server logging, server-only boundary checks, pure movement calculation + transactional concurrency/tenant-isolation tests, demo workspace seed script, and production operations documentation).

## Project structure

- `app/` — Next.js App Router pages and API routes.
- `src/db/` — server-only Drizzle client, schema, migrations, and `seed.ts` demo fixture script.
- `src/lib/auth.ts` — Better Auth configuration, secure cookie settings, and workspace provisioning hook.
- `src/lib/rate-limit.ts`, `src/lib/logger.ts`, `src/lib/env.ts` — Milestone 5 security & operational safeguards.
- `docs/` — technical, database, design, and production operations documentation (`docs/OPERATIONS.md`).
- `PRD.md` — current product scope and acceptance criteria.
- `TASKS.md` — milestone checklist.

## Environment

Set `DATABASE_URL` and a cryptographically random `BETTER_AUTH_SECRET` of at least 32 characters in the project environment. `.env.example` lists the expected names; never commit real credentials. `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are recommended in production for canonical origin validation.

## Development commands

This repository uses pnpm.

- `pnpm dev` — start the Next.js development server.
- `pnpm typecheck` — check TypeScript.
- `pnpm lint` — run ESLint.
- `pnpm test` — run unit, transactional concurrency, security boundary, and tenant isolation tests.
- `pnpm build` — create a production build (`pnpm exec next build --webpack` if Webpack build is needed locally).
- `pnpm db:generate` — generate a Drizzle migration from the schema.
- `pnpm db:check` — verify Drizzle migration snapshot consistency.
- `pnpm db:seed` — seed the idempotent demo workspace (`Toko Berkah Jaya`) into the configured database.
- `pnpm db:studio` — open Drizzle Studio against the configured database.

In this workspace, apply SQL migrations through the connected Neon migration workflow rather than running `drizzle-kit migrate` directly. All MVP schema migrations are checked in under `src/db/migrations/`.

## Authentication and tenant boundaries

Better Auth owns password hashing and session management. The dashboard resolves the user from the server session, then resolves workspace membership using that user ID; it never trusts a workspace ID supplied by the browser. New-user provisioning creates the workspace, owner membership, and default warehouse in one transaction, with compensating user cleanup if setup fails.

## Operations, security, and production readiness

See [`docs/OPERATIONS.md`](docs/OPERATIONS.md) for environment variable checks, cookie/session hardening, rate limiting limits, Neon backup/PITR & pooling guidance, Vercel commercial plan requirements, production deployment steps, demo credentials, and known MVP limitations.
