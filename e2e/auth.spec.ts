import { test, expect } from '@playwright/test';
import { ADMIN_STORAGE, AGENT_STORAGE } from './helpers/auth-constants';
import { loginAs } from './helpers/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

// ---------------------------------------------------------------------------
// Server-side login failures
// ---------------------------------------------------------------------------

test.describe('Login failures', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows error for incorrect password', async ({ page }) => {
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill('wrong-password-9999');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('shows error for non-existent email', async ({ page }) => {
    await page.getByLabel('Email').fill('nobody@nowhere.example.com');
    await page.getByLabel('Password').fill('somepassword123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});

// ---------------------------------------------------------------------------
// Successful login
// ---------------------------------------------------------------------------

test.describe('Successful login', () => {
  test('admin is redirected to home after sign in', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(
      page.getByRole('heading', { name: 'Helpdesk' })
    ).toBeVisible();
  });

  test('navbar shows signed-in user name', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page.getByText('Admin')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Route guards — unauthenticated
// ---------------------------------------------------------------------------

test.describe('Route guards — unauthenticated', () => {
  test('unknown route redirects to /login (via / catch-all)', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page).toHaveURL('/login');
  });
});

// ---------------------------------------------------------------------------
// Route guards — admin
// ---------------------------------------------------------------------------

test.describe('Route guards — admin', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('can access home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Helpdesk' })
    ).toBeVisible();
  });

  test('can access /users page', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Route guards — agent (non-admin)
// ---------------------------------------------------------------------------

test.describe('Route guards — agent', () => {
  test.use({ storageState: AGENT_STORAGE });

  test('can access home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Helpdesk' })
    ).toBeVisible();
  });

  test('/users redirects to / for non-admin', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/');
  });
});

// ---------------------------------------------------------------------------
// Sign-out flow
// ---------------------------------------------------------------------------

test.describe('Sign out', () => {
  // Log in fresh for each test — signing out invalidates the server-side session,
  // so we must not reuse the shared storageState session here or it breaks other tests.
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('sign out redirects to /login', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('protected routes redirect to /login after sign out', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');

    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('admin route redirects to /login after sign out', async ({ page }) => {
    await page.goto('/users');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');

    await page.goto('/users');
    await expect(page).toHaveURL('/login');
  });
});

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

test.describe('Session persistence', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('session persists after a hard page reload', async ({ page }) => {
    await page.goto('/');
    await page.reload();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Helpdesk' })
    ).toBeVisible();
  });

  test('session persists across navigations', async ({ page }) => {
    await page.goto('/');
    await page.goto('/users');
    await expect(page).toHaveURL('/users');
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });
});

// ---------------------------------------------------------------------------
// Already authenticated
// ---------------------------------------------------------------------------

test.describe('Already authenticated', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test('/login is still accessible when authenticated', async ({ page }) => {
    // The app currently has no redirect-if-authenticated guard on /login.
    // This test documents the current behavior.
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-slot="card-title"]')).toHaveText('Sign in');
  });
});
