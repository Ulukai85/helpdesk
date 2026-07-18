---
name: project-ticket-detail-tests
description: e2e test patterns for the ticket detail page — selectors, select interaction, reply flow
metadata:
  type: project
---

`e2e/tickets.spec.ts` covers the ticket detail page (`/tickets/:id`).

**Ticket creation helper:** POST to `http://localhost:3001/api/webhooks/inbound-email` with `X-Webhook-Token: test-webhook-secret` and a multipart body. Returns `{ id: number }`. Same pattern as `webhooks.spec.ts`.

**Key selectors:**
- Subject heading: `page.getByRole('heading', { level: 1 })`
- Back link: `page.getByRole('link', { name: /back to tickets/i })`
- Status combobox: `page.getByRole('combobox', { name: 'Status' })` — `aria-label` is set on `SelectTrigger` in `TicketSelectField`
- Category combobox: `page.getByRole('combobox', { name: 'Category' })`
- shadcn Select option: `page.getByRole('option', { name: '...' })` — rendered in a portal by SelectContent
- Reply textarea: `page.getByPlaceholder('Write a reply...')`
- Send button: `page.getByRole('button', { name: /send reply/i })`
- Error alert: `page.getByRole('alert')` — `Alert` from shadcn always has `role="alert"`

**Category display labels** (from `CATEGORY_LABEL` in `ticketColumns.tsx`):
- `TECHNICAL_QUESTION` → `'Technical Question'`
- `GENERAL_QUESTION` → `'General Question'`
- `REFUND_REQUEST` → `'Refund Request'`

**shadcn Select interaction pattern:**
```ts
await page.getByRole('combobox', { name: 'Status' }).click();
await page.getByRole('option', { name: 'RESOLVED' }).click();
```
After clicking an option, verify via `toContainText` on the trigger before reloading to confirm the mutation settled.

**Reply test pattern:** fill textarea → click Send → assert reply text is visible (ReplyThread renders only when `replies.length > 0`) → assert textarea cleared to `''`.

See [[project-webhook-secret]] for the WEBHOOK_SECRET requirement.
