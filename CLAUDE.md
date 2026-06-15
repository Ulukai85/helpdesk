# Helpdesk — Claude Instructions

## Project

AI-powered ticket management system. See `projekt-scope.md` for features and decisions, `tech-stack.md` for the chosen stack, and `implementation-plan.md` for the phased roadmap.

## Structure

```
helpdesk/
├── client/   # Vite + React + TypeScript + Tailwind CSS v4 + React Router v7
├── server/   # Node.js + Express 5 + TypeScript (runs via Bun)
└── e2e/      # Playwright end-to-end tests
```

## Commands

```bash
# Dev
bun run dev:client          # start Vite dev server on :5173
bun run dev:server          # start Express server on :3000 (with --watch)
bun install                 # install all workspace dependencies from root

# Database
bun run db:studio           # open Prisma Studio (prod DB)
bun run db:studio:test      # open Prisma Studio (test DB)
bun run db:migrate:test     # reset test database (prisma migrate reset --force)

# Seed (run from server/ or via workspace)
bun run --cwd server seed   # seed the database (creates admin user)

# E2E tests
bun run test                # run Playwright tests (uses server/.env.test)
bun run test:ui             # run Playwright tests with interactive UI
```

## Conventions

- All API routes are prefixed with `/api`
- The Vite dev server proxies `/api/*` to `http://localhost:3000`
- Environment variables: copy `.env.example` → `.env` in both `client/` and `server/`; copy `server/.env.test.example` → `server/.env.test` for E2E tests
- Use Bun as the runtime and package manager (not npm/yarn)
- Use TypeScript throughout
- Always use **Context7 MCP** to fetch current documentation before writing code that involves any library or framework used in this project

## Database (Prisma + PostgreSQL)

Prisma client is generated to `server/src/generated/prisma` (non-default path). Prisma instance: `server/src/lib/prisma.ts`.

**Schema location:** `server/prisma/schema.prisma`

**Enums:**
- `Role` — `ADMIN | AGENT` (default `AGENT`)
- `TicketCategory` — `GENERAL_QUESTION | TECHNICAL_QUESTION | REFUND_REQUEST`
- `TicketStatus` — `OPEN | RESOLVED | CLOSED` (default `OPEN`)

**Models:** `User`, `Session`, `Account`, `Verification` (managed by Better Auth) + `Ticket`

**Ticket fields:** `id`, `subject`, `body`, `customerEmail`, `category` (nullable), `status`, `createdAt`, `updatedAt`

**Seed:** `server/prisma/seed.ts` — creates the initial admin user (credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars).

## Security Middleware

Applied in `server/src/index.ts` in this order:

1. `helmet()` — security headers
2. `cors()` — allows `CLIENT_URL` origin with credentials
3. `loginLimiter` — rate-limits `/api/auth/sign-in`: 10 req / 15 min (production only)
4. Better Auth handler (`/api/auth/*`) — **must be before `express.json()`**
5. `express.json({ limit: "50kb" })` — body parsing with size cap
6. `healthLimiter` — rate-limits `/api/health`: 20 req / min (production only)
7. Global error handler — returns opaque `"Internal server error"` in production, full `err.message` in dev

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | none | DB liveness check (`SELECT 1`) |
| `GET` | `/api/me` | required | Returns `{ id, name, email, role }` for current user |
| `ALL` | `/api/auth/*` | — | Better Auth routes (sign-in, sign-out, session) |

## Authorization

Authentication is handled by **Better Auth** (`better-auth` package).

- **Sign-up is disabled** — users are managed by admins and seeded via a seed script (creates an admin user)
- Email/password auth only
- Trusted origin: `process.env.CLIENT_URL` (defaults to `http://localhost:5173`)

**Roles** (`ADMIN` | `AGENT`, Prisma enum, default `AGENT`):
- Stored as a custom `role` field on the User model — not user-settable (`input: false`)

**Server files:**
- `server/src/auth.ts` — Better Auth config with Prisma adapter (PostgreSQL)
- `server/src/middleware/requireAuth.ts` — middleware that calls `auth.api.getSession()`, attaches result to `req.session`, returns 401 if missing
- Auth routes mounted at `/api/auth/*` via `toNodeHandler(auth)` — **must be registered before `express.json()`**

**Client:**
- `client/src/lib/auth-client.ts` — `createAuthClient` with `inferAdditionalFields` plugin to expose `role` on the client-side user type
- Sign in: `authClient.signIn.email(data, { onSuccess, onError })`

**Adding protected routes:** apply `requireAuth` middleware; check role with `req.session.user.role`.

**Client-side route guards:**
- `client/src/components/ProtectedRoute.tsx` — redirects to `/login` if no session
- `client/src/components/AdminRoute.tsx` — redirects to `/` if role is not `ADMIN`
- Nest inside `ProtectedRoute` in the route tree; `AdminRoute` checks `session.user.role !== "ADMIN"`
- To show UI conditionally for admins: `session?.user.role === "ADMIN"`

## E2E Testing (Playwright)

Config: `playwright.config.ts` — tests in `./e2e/`, base URL `http://localhost:5173`.

- Runs against a **separate test database** — set via `server/.env.test` (copy from `server/.env.test.example`)
- Test server runs on port `3001` (set `PORT=3001` in `.env.test`)
- **Global setup** (`e2e/global-setup.ts`): resets the test DB with `prisma migrate reset --force` before the suite
- **Global teardown** (`e2e/global-teardown.ts`): resets the test DB again after the suite
- Always pass the `.env.test` file when running tests: `bun --env-file=server/.env.test playwright test` (handled by `bun run test`)

## Styling

UI components come from **shadcn/ui** (Tailwind v4, `base-nova` style, neutral base color).

- Add components with `bunx shadcn@latest add <component>` from the `client/` directory
- Components land in `client/src/components/ui/`
- Utilities in `client/src/lib/utils.ts` (`cn()` helper)
- Path alias `@/*` maps to `client/src/*` (configured in `vite.config.ts` and `tsconfig.app.json`)
- shadcn `form` component is **not available** in the `base-nova` style — use `react-hook-form`'s `register` API directly with shadcn `Input`, `Label`, `Button`, and `Card`
