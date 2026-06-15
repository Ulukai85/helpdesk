---
name: audit-1-findings
description: Findings and security control inventory from the first full audit (June 2026). Covers auth, middleware, routes, env handling, and client guards.
metadata:
  type: project
---

## Controls confirmed working
- `requireAuth` middleware correctly calls `auth.api.getSession()` and returns 401 if no session. Applied to `/api/me`.
- Better Auth `disableSignUp: true` prevents self-registration.
- `role` field has `input: false` — cannot be set by users via Better Auth's own API.
- `trustedOrigins` is locked to `CLIENT_URL` env var — CORS handled by Better Auth for auth routes.
- No `dangerouslySetInnerHTML` or raw HTML injection in client code.
- No sensitive data in `localStorage` or `sessionStorage`.
- Client-side `ProtectedRoute` and `AdminRoute` components exist; `AdminRoute` is nested inside `ProtectedRoute` in the route tree.
- Prisma enum `Role` (ADMIN | AGENT) enforced at DB level.
- Session cascade-deletes on user deletion (FK `onDelete: Cascade`).

## Open risks (see full audit report)
- `BETTER_AUTH_SECRET` is not passed explicitly in `server/src/auth.ts`; Better Auth reads it from env automatically, but in dev the value is committed to `server/.env` — treat as LOW risk in dev, ensure `.env` is never committed to a shared repo.
- `server/.env` contains real credentials (`BETTER_AUTH_SECRET`, `ADMIN_PASSWORD=password123`) — currently in `.gitignore`, not tracked, acceptable for local dev only.
- `server/.env.example` has `ADMIN_PASSWORD=password123` as a placeholder — inform operators to change this.
- No Helmet.js or equivalent security headers middleware.
- No rate limiting on `/api/auth/sign-in` (login) — brute-force possible.
- `/api/me` returns the full Better Auth session object including `session.session.token` (the raw session token string). This is over-exposure if not needed by the client.
- No explicit request body size limit set in `express.json()`.
- No CORS middleware for non-auth API routes (relies on Vite proxy in dev; production needs explicit CORS config).
- `UsersPage` is a stub — no API routes for user management exist yet; risk area to watch when implemented.
- Seed script uses `betterAuth({ emailAndPassword: { enabled: true } })` without `disableSignUp`, which is fine since it only runs locally.
- No `NODE_ENV` guard on error responses in Express — if errors bubble up unhandled, Express 5 may expose stack traces.

## Architecture notes
- Only two server API routes exist: `/api/health` (public, no auth) and `/api/me` (requireAuth).
- No ticket routes exist yet in server — scope is auth scaffolding only at this stage.
- Better Auth handles `/api/auth/*` itself via `toNodeHandler`; those routes are not Express middleware.
- Prisma adapter with `@prisma/adapter-pg` (edge-compatible) — no raw SQL in app code.
- Bun runtime; `better-auth` v1.6.18, Express 5.1.0.

**Why:** Recorded to avoid re-reading the entire codebase on the next security pass — focus new reviews on newly added routes and the user-management feature.
**How to apply:** On next audit, diff against this inventory: check that new routes have `requireAuth`, new admin routes have role checks, and that `/api/me` response scope is trimmed once the client's needs are clearer.
