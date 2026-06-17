---
name: project-e2e-conventions
description: Established e2e test conventions, folder structure, auth fixtures, and seeded credentials for the helpdesk project
metadata:
  type: project
---

## Folder & file structure
- All e2e tests live in `e2e/` at the repo root
- Helpers live in `e2e/helpers/`
- Auth constants: `e2e/helpers/auth-constants.ts` — exports `ADMIN_STORAGE`, `AGENT_STORAGE`, `AGENT_EMAIL`, `AGENT_PASSWORD`
- Auth setup writes storage state to `playwright/.auth/admin.json` and `playwright/.auth/agent.json`
- Reference spec for style/patterns: `e2e/auth.spec.ts`

## Seeded credentials
- Admin: email from `process.env.ADMIN_EMAIL` (default `admin@example.com`), password from `process.env.ADMIN_PASSWORD`
- Agent: `AGENT_EMAIL = 'agent@example.com'`, `AGENT_PASSWORD = 'agentpassword123'`

## Auth in tests
- Use `test.use({ storageState: ADMIN_STORAGE })` or `AGENT_STORAGE` at the `describe` level — never log in inside individual tests unless testing the login flow itself
- Sign-out tests must NOT reuse storageState (signing out invalidates the server session)

## Test isolation for CRUD tests
- For create/edit/delete tests, generate unique emails per test using `Date.now()` (e.g. `create-${Date.now()}@example.com`)
- Edit and delete tests create their own user via the UI first (no shared fixture users), then operate on it

## Key UI selectors confirmed working
- Column headers: `getByRole('columnheader', { name: '...' })`
- Table rows filtered by content: `page.getByRole('row').filter({ hasText: email })`
- Edit button: `getByRole('button', { name: 'Edit user' })` (aria-label on the pencil icon button)
- Delete button: `getByRole('button', { name: 'Delete user' })` (aria-label on the trash icon button)
- Dialog title (shadcn DialogTitle): `getByRole('heading', { name: '...' })`
- AlertDialog title: also `getByRole('heading', { name: 'Delete User' })`

## Waiting strategy
- After form submit: wait for dialog heading to `not.toBeVisible()` — signals mutation completed and dialog closed
- After delete confirm: same pattern on the AlertDialog heading
- No `waitForTimeout` anywhere — rely on Playwright auto-waiting assertions

**Why:** Test DB is reset before/after the suite via global setup/teardown in `e2e/global-setup.ts` and `e2e/global-teardown.ts`. Tests run against port 3001 (`.env.test` sets `PORT=3001`).
**How to apply:** Always target port 5173 (Vite) in baseURL; server runs on 3001 in test mode, proxied transparently.
