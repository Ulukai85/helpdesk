import { test, expect } from '@playwright/test';

// The Express server runs on port 3001 in the test environment.
// These tests call it directly — no browser or Vite proxy involved.
const WEBHOOK_URL = 'http://localhost:3001/api/webhooks/inbound-email';
const VALID_TOKEN = 'test-webhook-secret';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid multipart payload that should always create a ticket. */
function validPayload(overrides?: Record<string, string>) {
  return {
    from: 'Jane Doe <jane@example.com>',
    subject: 'Help needed',
    text: 'Please help me with my order.',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/inbound-email — happy paths', () => {
  test('text body: creates a ticket and returns { id }', async ({
    request,
  }) => {
    const response = await request.post(`${WEBHOOK_URL}?token=${VALID_TOKEN}`, {
      multipart: validPayload(),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.id).toBe('number');
  });

  test('html-only body: creates a ticket and returns { id }', async ({
    request,
  }) => {
    // When `text` is absent, the server strips HTML tags and uses that as the body.
    const response = await request.post(`${WEBHOOK_URL}?token=${VALID_TOKEN}`, {
      multipart: {
        from: 'Jane Doe <jane@example.com>',
        subject: 'HTML-only email',
        html: '<p>Please <strong>help</strong> me!</p>',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.id).toBe('number');
  });

  test('from without display name: creates a ticket and returns { id }', async ({
    request,
  }) => {
    // "jane@example.com" — no angle brackets; server derives customerName from the email prefix.
    const response = await request.post(`${WEBHOOK_URL}?token=${VALID_TOKEN}`, {
      multipart: validPayload({ from: 'jane@example.com' }),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.id).toBe('number');
  });

  test('each successful request returns a unique ticket id', async ({
    request,
  }) => {
    // Sanity check that two calls create two distinct tickets, not the same one.
    const [r1, r2] = await Promise.all([
      request.post(`${WEBHOOK_URL}?token=${VALID_TOKEN}`, {
        multipart: validPayload({ subject: 'Ticket A' }),
      }),
      request.post(`${WEBHOOK_URL}?token=${VALID_TOKEN}`, {
        multipart: validPayload({ subject: 'Ticket B' }),
      }),
    ]);

    const [b1, b2] = await Promise.all([r1.json(), r2.json()]);
    expect(b1.id).not.toBe(b2.id);
  });
});

// ---------------------------------------------------------------------------
// Token validation (silent-accept behaviour)
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/inbound-email — token validation', () => {
  test('wrong token: responds 200 {} without creating a ticket', async ({
    request,
  }) => {
    const response = await request.post(`${WEBHOOK_URL}?token=wrong-secret`, {
      multipart: validPayload(),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    // No `id` field — ticket was not created
    expect(body).toEqual({});
  });

  test('missing token: responds 200 {} without creating a ticket', async ({
    request,
  }) => {
    const response = await request.post(WEBHOOK_URL, {
      // No token query param at all
      multipart: validPayload(),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Payload validation (silent-accept behaviour)
// ---------------------------------------------------------------------------

test.describe('POST /api/webhooks/inbound-email — payload validation', () => {
  test('missing `from` field: responds 200 {}', async ({ request }) => {
    const response = await request.post(`${WEBHOOK_URL}?token=${VALID_TOKEN}`, {
      multipart: {
        subject: 'No sender',
        text: 'Body text',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({});
  });

  test('missing `subject` field: responds 200 {}', async ({ request }) => {
    const response = await request.post(`${WEBHOOK_URL}?token=${VALID_TOKEN}`, {
      multipart: {
        from: 'Jane Doe <jane@example.com>',
        text: 'Body text',
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({});
  });

  test('completely empty payload: responds 200 {}', async ({ request }) => {
    const response = await request.post(`${WEBHOOK_URL}?token=${VALID_TOKEN}`, {
      multipart: {},
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({});
  });
});
