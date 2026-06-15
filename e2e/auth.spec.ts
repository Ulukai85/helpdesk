import { test, expect } from '@playwright/test';
import { ADMIN_STORAGE, AGENT_STORAGE } from './helpers/auth-constants';
import { loginAs } from './helpers/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

// ---------------------------------------------------------------------------
// Login page rendering
// ---------------------------------------------------------------------------

test.describe('Login page', () => {
  test('renders sign in form with all fields', async ({ page }) => {
    await page.goto('/login');
    // CardTitle renders as a <div data-slot="card-title">, not a heading element
    await expect(page.locator('[data-slot="card-title"]')).toHaveText('Sign in');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Sign in' })
    ).toBeVisible();
  });

  test('submit button shows loading state while signing in', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(ADMIN_EMAIL);
    await page.getByLabel('Password').fill(ADMIN_PASSWORD);

    // Intercept the auth request to keep it pending long enough to observe loading
    await page.route('**/api/auth/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.continue();
    });

    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('button', { name: 'Signing in…' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Client-side validation (Zod)
// ---------------------------------------------------------------------------

test.describe('Form validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows email error when email field is empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
  });

  test('shows password error when password field is empty', async ({
    page,
  }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('shows both errors when both fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Enter a valid email')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });
});

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
  test('/ redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('/users redirects to /login', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL('/login');
  });

  test('unknown route redirects to /login (via / guard)', async ({ page }) => {
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

  test('Users link is visible in the navbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
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

  test('Users link is not visible in the navbar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Users' })).not.toBeVisible();
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
