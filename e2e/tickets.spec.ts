import { test, expect, type APIRequestContext } from '@playwright/test';
import { ADMIN_STORAGE } from './helpers/auth-constants';

const WEBHOOK_URL = 'http://localhost:3001/api/webhooks/inbound-email';
const VALID_TOKEN = 'test-webhook-secret';

// ---------------------------------------------------------------------------
// Helper — create a ticket via the webhook API and return its numeric id.
// Using the request fixture avoids a browser round-trip for setup.
// ---------------------------------------------------------------------------

async function createTicket(
  request: APIRequestContext,
  overrides?: { subject?: string; from?: string; text?: string }
): Promise<number> {
  const res = await request.post(WEBHOOK_URL, {
    headers: { 'X-Webhook-Token': VALID_TOKEN },
    multipart: {
      from: overrides?.from ?? 'Jane Doe <jane@example.com>',
      subject: overrides?.subject ?? `Test ticket ${Date.now()}`,
      text: overrides?.text ?? 'This is the ticket body.',
    },
  });
  expect(res.status()).toBe(200);
  const { id } = await res.json();
  expect(typeof id).toBe('number');
  return id as number;
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Ticket detail page', () => {
  test.use({ storageState: ADMIN_STORAGE });

  // -------------------------------------------------------------------------
  // Page load
  // -------------------------------------------------------------------------

  test('shows the subject heading and back link after navigating to a ticket', async ({
    page,
    request,
  }) => {
    const subject = `Page load test ${Date.now()}`;
    const id = await createTicket(request, { subject });

    await page.goto(`/tickets/${id}`);

    await test.step('subject is shown as the page heading', async () => {
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(subject);
    });

    await test.step('"Back to tickets" link is visible', async () => {
      await expect(
        page.getByRole('link', { name: /back to tickets/i })
      ).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Back navigation
  // -------------------------------------------------------------------------

  test('"Back to tickets" link navigates to /tickets', async ({
    page,
    request,
  }) => {
    const id = await createTicket(request);

    await page.goto(`/tickets/${id}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('link', { name: /back to tickets/i }).click();

    await expect(page).toHaveURL('/tickets');
  });

  // -------------------------------------------------------------------------
  // Status update persists across reload
  // -------------------------------------------------------------------------

  test('status change persists after a page reload', async ({
    page,
    request,
  }) => {
    const id = await createTicket(request, { subject: `Status test ${Date.now()}` });

    await page.goto(`/tickets/${id}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await test.step('change status to RESOLVED', async () => {
      // The SelectTrigger renders with aria-label matching the label prop
      await page.getByRole('combobox', { name: 'Status' }).click();
      await page.getByRole('option', { name: 'RESOLVED' }).click();
    });

    await test.step('wait for the mutation to settle', async () => {
      // The trigger should now display the new value
      await expect(
        page.getByRole('combobox', { name: 'Status' })
      ).toContainText('RESOLVED');
    });

    await test.step('reload and verify the status is still RESOLVED', async () => {
      await page.reload();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: 'Status' })
      ).toContainText('RESOLVED');
    });
  });

  // -------------------------------------------------------------------------
  // Category update persists across reload
  // -------------------------------------------------------------------------

  test('category change persists after a page reload', async ({
    page,
    request,
  }) => {
    const id = await createTicket(request, { subject: `Category test ${Date.now()}` });

    await page.goto(`/tickets/${id}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await test.step('change category to Technical Question', async () => {
      await page.getByRole('combobox', { name: 'Category' }).click();
      await page.getByRole('option', { name: 'Technical Question' }).click();
    });

    await test.step('trigger value updates to Technical Question', async () => {
      await expect(
        page.getByRole('combobox', { name: 'Category' })
      ).toContainText('Technical Question');
    });

    await test.step('reload and confirm category is persisted', async () => {
      await page.reload();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(
        page.getByRole('combobox', { name: 'Category' })
      ).toContainText('Technical Question');
    });
  });

  // -------------------------------------------------------------------------
  // Submit a reply — appears in thread without page reload
  // -------------------------------------------------------------------------

  test('submitting a reply adds it to the thread without reloading', async ({
    page,
    request,
  }) => {
    const id = await createTicket(request, { subject: `Reply test ${Date.now()}` });
    const replyText = `This is my reply at ${Date.now()}`;

    await page.goto(`/tickets/${id}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await test.step('type the reply and submit', async () => {
      await page.getByPlaceholder('Write a reply...').fill(replyText);
      await page.getByRole('button', { name: /send reply/i }).click();
    });

    await test.step('reply appears in the thread', async () => {
      // The ReplyThread only renders when replies.length > 0, and each
      // ReplyItem contains the reply body text.
      await expect(page.getByText(replyText)).toBeVisible();
    });

    await test.step('textarea is cleared after successful submission', async () => {
      await expect(page.getByPlaceholder('Write a reply...')).toHaveValue('');
    });

    await test.step('reply count label is now visible', async () => {
      await expect(page.getByText('1 reply')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Non-existent ticket — error state
  // -------------------------------------------------------------------------

  test('navigating to a non-existent ticket shows an error message', async ({
    page,
  }) => {
    await page.goto('/tickets/999999');

    // ErrorMessage renders an Alert with role="alert" containing the error text.
    // The server returns a 404 for unknown ticket ids, which axios converts into
    // a thrown error; the page's error branch renders <ErrorMessage />.
    await expect(page.getByRole('alert')).toBeVisible();
  });
});
