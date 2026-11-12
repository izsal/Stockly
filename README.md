# Stockly

Stockly is an inventory-management app for Indonesian businesses. The current implementation covers the Foundation milestone (email/password authentication, protected workspace dashboard, owner membership, and default warehouse), Milestone 2 (workspace-scoped product and category management), Milestone 3 (supplier CRUD, atomic stock in/out/adjustment movements with row-level locking, current-stock display, and append-only movement history), and Milestone 4 (operational dashboard KPIs, movement summaries by date range, stock & movement reports, and CSV export).

## Project structure

- `app/` — Next.js App Router pages and API routes.
- `src/db/` — server-only Drizzle client and schema.
- `src/lib/auth.ts` — Better Auth configuration and workspace provisioning hook.
- `docs/` — technical, database, and design guidance from the supplied documentation pack.
- `PRD.md` — current product scope and acceptance criteria.
- `TASKS.md` — milestone checklist.

## Environment

Set `DATABASE_URL` and a cryptographically random `BETTER_AUTH_SECRET` of at least 32 characters in the project environment. `.env.example` lists the expected names; never commit real credentials. `BETTER_AUTH_URL` is optional when a stable canonical auth URL is configured.

## Development commands

This repository uses pnpm.

- `pnpm dev` — start the Next.js development server.
- `pnpm typecheck` — check TypeScript.
- `pnpm lint` — run ESLint.
- `pnpm test` — run unit tests.
- `pnpm build` — create a production build.
- `pnpm db:generate` — generate a Drizzle migration from the schema.
- `pnpm db:studio` — open Drizzle Studio against the configured database.

In this v0 workspace, apply SQL migrations through the connected Neon migration workflow rather than running `drizzle-kit migrate` directly. The Foundation schema has already been applied to the connected database and its SQL snapshot is checked in under `src/db/migrations/`.

## Authentication and tenant boundaries

Better Auth owns password hashing and session management. The dashboard resolves the user from the server session, then resolves workspace membership using that user ID; it never trusts a workspace ID supplied by the browser. New-user provisioning creates the workspace, owner membership, and default warehouse in one transaction, with compensating user cleanup if setup fails.

## Product scope

See `PRD.md` for the Foundation acceptance criteria and `TASKS.md` for milestone progress. Milestone 5 covers security review, end-to-end/concurrency testing, and beta release readiness.
