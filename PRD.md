# Stockly Product Requirements

## Status

Foundation milestone in progress. The supplied documentation pack describes the product and implementation conventions, but it does not include a separate PRD. This file records only the scope explicitly present in the supplied brief and milestone documentation; later product decisions remain open.

## Product intent

Stockly is an inventory-management application for Indonesian businesses. The product is intended to provide a clear, workspace-based home for operational inventory work.

## Foundation milestone scope

- Email and password registration and sign-in.
- A protected dashboard for authenticated users.
- A workspace created for each new registrant.
- The registrant receives the `OWNER` role in that workspace.
- A default warehouse is created with the workspace.
- User-owned queries are scoped to the authenticated user and workspace.

## Out of scope for this milestone

Product catalogs, categories, stock movements, purchasing, sales, reports, team invitations, and integrations are not implemented as part of the foundation milestone.

## Acceptance criteria

- A user can register and sign in with email and password.
- Registration validates input on the server.
- Successful registration provisions a workspace, owner membership, and default warehouse in one database transaction; failures use compensating cleanup for the newly created auth user.
- Anonymous users cannot access the dashboard.
- Authenticated users can reload the dashboard without losing their session and can sign out.
