# Helpdesk — Claude Instructions

## Project

AI-powered ticket management system. See `projekt-scope.md` for features and decisions, `tech-stack.md` for the chosen stack, and `implementation-plan.md` for the phased roadmap.

## Structure

```
helpdesk/
├── core/     # Shared TypeScript — Zod schemas and inferred types
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

# Component tests (Vitest + React Testing Library)
bun run --cwd client test        # run in watch mode
bun run --cwd client test:run    # single run (CI)

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

**Enums** (defined as TypeScript enums in `@helpdesk/core`, mirrored in the Prisma schema):

- `Role` — `ADMIN | AGENT` (default `AGENT`) — `core/src/schemas/users.ts`
- `TicketCategory` — `GENERAL_QUESTION | TECHNICAL_QUESTION | REFUND_REQUEST` — `core/src/schemas/tickets.ts`
- `TicketStatus` — `OPEN | RESOLVED | CLOSED` (default `OPEN`) — `core/src/schemas/tickets.ts`

**Models:** `User`, `Session`, `Account`, `Verification` (managed by Better Auth) + `Ticket`

**Ticket fields:** `id` (Int, auto-increment), `subject`, `body`, `bodyHtml` (optional), `customerName`, `customerEmail`, `category` (nullable `TicketCategory`), `status` (default `OPEN`), `assignedToId` (optional FK → `User`), `createdAt`, `updatedAt`

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

## Shared Code (`core` package)

The `core` workspace package (`@helpdesk/core`) holds code shared between client and server — primarily Zod schemas and their inferred types.

- **Schemas live in** `core/src/schemas/<feature>.ts`, exported from `core/src/index.ts`
- **Import in either client or server** as `import { mySchema, type MyData } from "@helpdesk/core"`
- **Always define a Zod schema in `core`** when the same shape is validated on the server and used for a form on the client — never duplicate it
- **Entity types also belong in `core`** — if a type describes the shape returned by the API (e.g. `User`), define it once in `core` and import it on both sides; never re-declare it locally in a component or route file
- **Enums belong in `core`** — `Role`, `TicketCategory`, and `TicketStatus` are TypeScript string enums in `core`; import from `@helpdesk/core`, never from the generated Prisma client

```ts
// core/src/schemas/users.ts
import { z } from "zod";

export enum Role { ADMIN = "ADMIN", AGENT = "AGENT" }

export type User = { id: string; name: string; email: string; role: Role; createdAt: string };

export const createUserSchema = z.object({ ... });
export type CreateUserData = z.infer<typeof createUserSchema>;

// core/src/schemas/tickets.ts
export enum TicketCategory { GENERAL_QUESTION = "GENERAL_QUESTION", ... }
export enum TicketStatus { OPEN = "OPEN", RESOLVED = "RESOLVED", CLOSED = "CLOSED" }

export const sendgridInboundSchema = z.object({ from, subject, text, html });
export type SendgridInboundData = z.infer<typeof sendgridInboundSchema>;
```

Note: use `z.email()` not `z.string().email()` — the method form is deprecated in Zod v4.

## Request Validation (Server)

Use the shared schema from `@helpdesk/core` and call `.safeParse(req.body)`, returning the first issue message as a 400 on failure.

```ts
import { createUserSchema } from "@helpdesk/core";

const parsed = createUserSchema.safeParse(req.body);
if (!parsed.success) {
  res.status(400).json({ error: parsed.error.issues[0].message });
  return;
}
```

## API Endpoints

| Method | Path          | Auth     | Description                                          |
| ------ | ------------- | -------- | ---------------------------------------------------- |
| `GET`  | `/api/health` | none     | DB liveness check (`SELECT 1`)                       |
| `GET`  | `/api/me`     | required | Returns `{ id, name, email, role }` for current user |
| `ALL`  | `/api/auth/*` | —        | Better Auth routes (sign-in, sign-out, session)      |

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
- Nest inside `ProtectedRoute` in the route tree; `AdminRoute` checks `session.user.role !== Role.ADMIN`
- To show UI conditionally for admins: `session?.user.role === Role.ADMIN` (import `Role` from `@helpdesk/core`)

## Testing Strategy

**Default to component tests. Only write E2E tests when a real browser, real server, or real database is required to make the assertion meaningful.**

### When to write a component test (Vitest + RTL)

- Rendering: does the component render the right elements?
- Client-side validation: do Zod error messages appear?
- UI state: loading states, empty states, error states, dialog open/close
- Conditional rendering based on props or mocked session/role
- User interactions that call mocked API functions (axios, authClient)
- Route guard behavior (`ProtectedRoute`, `AdminRoute`) with a mocked session

### When to write an E2E test (Playwright)

Only when the test **cannot** avoid hitting a real server or database:

- Auth flows that go through Better Auth (real sign-in, sign-out, session persistence)
- Mutations that must persist to the DB and be reflected in a subsequent page load (create/edit/delete CRUD)
- Webhook and API-level integration tests
- App-level routing behavior that spans `App.tsx` (e.g. the `*` catch-all redirect)

If you find yourself writing an E2E test for something that only uses client-side logic (rendering, validation, mocked API), move it to a component test instead.

---

## Component Testing (Vitest + React Testing Library)

Config: `client/vite.config.ts` (`test` block) — environment `jsdom`, setup file `client/src/test/setup.ts` (imports `@testing-library/jest-dom`).

- Test files live next to the component they test: `UsersPage.tsx` → `UsersPage.test.tsx`
- Mock axios with `vi.mock("axios")` — never make real HTTP calls in component tests
- Mock `authClient` with `vi.mock("@/lib/auth-client")` for components that use `useSession` or `signIn`
- Wrap components that use `useQuery` with `renderWithQuery` from `@/test/render-with-query` — creates a fresh `QueryClient` per test with `retry: false`
- Wrap components that use React Router hooks (`useNavigate`, `Link`) with `renderWithRouter` from `@/test/render-with-query` — wraps in `MemoryRouter`
- Use `waitFor` when asserting on async state (after a query resolves or rejects)

```tsx
import { screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import axios from "axios";
import { renderWithQuery } from "@/test/render-with-query";
import UsersPage from "./UsersPage";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

it("renders users", async () => {
  mockedAxios.get = vi.fn().mockResolvedValue({ data: { users: [...] } });
  renderWithQuery(<UsersPage />);
  await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
});
```

Mocking authClient:

```tsx
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: { email: vi.fn() },
    signOut: vi.fn(),
  },
}));

import { authClient } from "@/lib/auth-client";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as never);
});
```

## Client Component Structure

- Layout components (`AuthenticatedLayout`, `Navbar`) live in `client/src/components/`
- Page components live in `client/src/pages/` — one file per route
- `App.tsx` should contain only the route tree; extract any non-trivial JSX or logic into a dedicated component or page file

## E2E Testing (Playwright)

Config: `playwright.config.ts` — tests in `./e2e/`, base URL `http://localhost:5173`.

- Runs against a **separate test database** — set via `server/.env.test` (copy from `server/.env.test.example`)
- Test server runs on port `3001` (set `PORT=3001` in `.env.test`)
- **Global setup** (`e2e/global-setup.ts`): resets the test DB with `prisma migrate reset --force` before the suite
- **Global teardown** (`e2e/global-teardown.ts`): resets the test DB again after the suite
- Always pass the `.env.test` file when running tests: `bun --env-file=server/.env.test playwright test` (handled by `bun run test`)

**Always run both `bun run --cwd client test:run` and `bun run test` after implementing a new feature** to catch regressions before reporting the work as done.

**E2E helpers** for repeated UI flows live in `e2e/helpers/` (e.g. `createUserViaUI` in `users.ts`). Extract any multi-step UI sequence used in more than one test into a typed helper function rather than duplicating steps inline.

### Writing E2E Tests — use the `e2e-tester` agent

For End2End-Testing use the **`e2e-tester`** agent rather than writing tests inline. The agent has full access to the codebase and Playwright docs.

**How to invoke:** use the Agent tool with `subagent_type: "e2e-tester"`. Brief it with:

- What feature/flow was just implemented
- Relevant file paths (page components, API routes, route guards)
- Any special setup needed (auth state, seeded data, roles)

## Data Fetching (Client)

Use **axios** for HTTP requests and **TanStack Query** (`@tanstack/react-query`) for all server-state management — never use raw `fetch` or manual `useEffect`/`useState` for API calls.

- `QueryClient` and `QueryClientProvider` are set up in `client/src/main.tsx`
- Use `useQuery` for reads: `queryKey` should identify the resource (e.g. `["users"]`), `queryFn` returns the axios promise
- Pass `withCredentials: true` on authenticated endpoints (equivalent to `credentials: "include"`)
- Error messages come from `error.message` (axios throws on non-2xx automatically)

```tsx
const { data, isPending, error } = useQuery({
  queryKey: ['users'],
  queryFn: () =>
    axios
      .get<{ users: User[] }>('/api/users', { withCredentials: true })
      .then((res) => res.data.users),
});
```

## Styling

UI components come from **shadcn/ui** (Tailwind v4, `base-nova` style, neutral base color).

- Add components with `bunx shadcn@latest add <component>` from the `client/` directory
- Components land in `client/src/components/ui/`
- Utilities in `client/src/lib/utils.ts` (`cn()` helper)
- Path alias `@/*` maps to `client/src/*` (configured in `vite.config.ts` and `tsconfig.app.json`)
- shadcn `form` component is **not available** in the `base-nova` style — use `react-hook-form`'s `register` API directly with shadcn `Input`, `Label`, `Button`, and `Card`

**Always prefer shadcn/ui components over custom HTML + Tailwind classes.** If a shadcn component fits the use case (Badge, Table, Dialog, etc.) but isn't installed yet, install it with `bunx shadcn@latest add <component>` — never reach for a raw `<span>` or `<table>` when a shadcn equivalent exists.

Currently installed shadcn components: `alert-dialog`, `button`, `card`, `dialog`, `input`, `label`, `select`, `table`, `badge`, `skeleton`, `textarea`.

## Ticket Display Constants

Enum-to-display-label maps and badge variant maps for tickets live in `client/src/components/ticketColumns.tsx`:

- `STATUS_LABEL: Record<TicketStatus, string>` — human-readable status labels (`Open`, `Resolved`, `Closed`)
- `STATUS_VARIANT: Record<TicketStatus, BadgeVariant>` — shadcn Badge variants per status
- `CATEGORY_LABEL: Record<TicketCategory, string>` — human-readable category labels

Import these wherever status or category must be displayed as text (Select options, Badges, table cells). Never hardcode display strings like `"OPEN"` or use raw enum values as labels.

## Sentinel Values in Select Components

When a Select field must represent a nullable/unset state, define the sentinel string as a named module-level constant rather than an inline literal. Example: `const UNASSIGNED = 'unassigned'` and `const NO_CATEGORY = 'none'`. This prevents the string from diverging across the `value`, `defaultValue`, and comparison callbacks.

## Avoid Shadowing Browser Globals

Local type aliases for form data must include the feature name to avoid shadowing the browser's `FormData` interface. Use `LoginFormData`, `UserFormData`, etc. — never a bare `type FormData`.

## Enum Values as String Literals

Never use enum string values as magic literals in server code (e.g., `authorType: 'AGENT'`). Always reference the enum: `authorType: ReplyAuthorType.AGENT`. This ensures compile-time safety and prevents silent breakage if an enum value is renamed.
