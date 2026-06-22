---
name: webhook-secret-test-env
description: WEBHOOK_SECRET must be set in server/.env.test for token-validation e2e tests to work
metadata:
  type: project
---

`server/.env.test` requires `WEBHOOK_SECRET=test-webhook-secret` for webhook token-validation e2e tests to exercise the actual middleware.

**Why:** The `requireWebhookToken` middleware skips all checks when `WEBHOOK_SECRET` is unset in non-production. Without the secret in `.env.test`, wrong-token and missing-token tests pass through and create tickets, making the security assertions impossible.

**How to apply:** When writing or debugging webhook token tests, verify `.env.test` includes `WEBHOOK_SECRET`. The `.env.test.example` already documents this value — it simply wasn't in the actual file until added during the webhook e2e test session.
