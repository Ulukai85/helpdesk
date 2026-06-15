# Helpdesk — Claude Instructions

## Project

AI-powered ticket management system. See `projekt-scope.md` for features and decisions, `tech-stack.md` for the chosen stack, and `implementation-plan.md` for the phased roadmap.

## Structure

```
helpdesk/
├── client/   # Vite + React + TypeScript + Tailwind CSS v4 + React Router v7
└── server/   # Node.js + Express 5 + TypeScript (runs via Bun)
```

## Commands

```bash
bun run dev:client    # start Vite dev server on :5173
bun run dev:server    # start Express server on :3000 (with --watch)
bun install           # install all workspace dependencies from root
```

## Conventions

- All API routes are prefixed with `/api`
- The Vite dev server proxies `/api/*` to `http://localhost:3000`
- Environment variables: copy `.env.example` → `.env` in both `client/` and `server/`
- Use Bun as the runtime and package manager (not npm/yarn)
- Use TypeScript throughout
- Always use **Context7 MCP** to fetch current documentation before writing code that involves any library or framework used in this project

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

## Styling

UI components come from **shadcn/ui** (Tailwind v4, `base-nova` style, neutral base color).

- Add components with `bunx shadcn@latest add <component>` from the `client/` directory
- Components land in `client/src/components/ui/`
- Utilities in `client/src/lib/utils.ts` (`cn()` helper)
- Path alias `@/*` maps to `client/src/*` (configured in `vite.config.ts` and `tsconfig.app.json`)
- shadcn `form` component is **not available** in the `base-nova` style — use `react-hook-form`'s `register` API directly with shadcn `Input`, `Label`, `Button`, and `Card`
