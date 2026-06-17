import { test, expect } from '@playwright/test';
import { ADMIN_STORAGE } from './helpers/auth-constants';

test.describe('Users — CRUD happy paths', () => {
  test.use({ storageState: ADMIN_STORAGE });

  test.beforeEach(async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // List
  // -------------------------------------------------------------------------

  test('renders the users table with all column headers', async ({ page }) => {
    const header = page.getByRole('row').first();
    await expect(header.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    await expect(header.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(header.getByRole('columnheader', { name: 'Role' })).toBeVisible();
    await expect(header.getByRole('columnheader', { name: 'Joined' })).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Create
  // -------------------------------------------------------------------------

  test('creates a new user and shows them in the table', async ({ page }) => {
    const email = `create-${Date.now()}@example.com`;
    const name = `Test User ${Date.now()}`;

    await test.step('open the Create User dialog', async () => {
      await page.getByRole('button', { name: 'Create User' }).click();
      await expect(
        page.getByRole('heading', { name: 'Create User' })
      ).toBeVisible();
    });

    await test.step('fill in the form', async () => {
      await page.getByLabel('Name').fill(name);
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill('Password123!');
    });

    await test.step('submit and wait for dialog to close', async () => {
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(
        page.getByRole('heading', { name: 'Create User' })
      ).not.toBeVisible();
    });

    await test.step('verify the new user appears in the table', async () => {
      await expect(page.getByRole('cell', { name })).toBeVisible();
      await expect(page.getByRole('cell', { name: email })).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Edit
  // -------------------------------------------------------------------------

  test('edits an existing user and shows the updated name in the table', async ({
    page,
  }) => {
    const email = `edit-${Date.now()}@example.com`;
    const originalName = `Edit Target ${Date.now()}`;
    const updatedName = `Updated Name ${Date.now()}`;

    await test.step('create a user to edit via the UI', async () => {
      await page.getByRole('button', { name: 'Create User' }).click();
      await expect(
        page.getByRole('heading', { name: 'Create User' })
      ).toBeVisible();
      await page.getByLabel('Name').fill(originalName);
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(
        page.getByRole('heading', { name: 'Create User' })
      ).not.toBeVisible();
      await expect(page.getByRole('cell', { name: originalName })).toBeVisible();
    });

    await test.step('click the Edit button for that user', async () => {
      // Find the row containing our user's email and click its Edit button
      const row = page.getByRole('row').filter({ hasText: email });
      await row.getByRole('button', { name: 'Edit user' }).click();
      await expect(
        page.getByRole('heading', { name: 'Edit User' })
      ).toBeVisible();
    });

    await test.step('update the name and submit', async () => {
      const nameInput = page.getByLabel('Name');
      await nameInput.clear();
      await nameInput.fill(updatedName);
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(
        page.getByRole('heading', { name: 'Edit User' })
      ).not.toBeVisible();
    });

    await test.step('verify the updated name appears in the table', async () => {
      await expect(page.getByRole('cell', { name: updatedName })).toBeVisible();
      await expect(
        page.getByRole('cell', { name: originalName })
      ).not.toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  test('deletes a user and removes them from the table', async ({ page }) => {
    const email = `delete-${Date.now()}@example.com`;
    const name = `Delete Target ${Date.now()}`;

    await test.step('create a user to delete via the UI', async () => {
      await page.getByRole('button', { name: 'Create User' }).click();
      await expect(
        page.getByRole('heading', { name: 'Create User' })
      ).toBeVisible();
      await page.getByLabel('Name').fill(name);
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password').fill('Password123!');
      await page.getByRole('button', { name: 'Create' }).click();
      await expect(
        page.getByRole('heading', { name: 'Create User' })
      ).not.toBeVisible();
      await expect(page.getByRole('cell', { name })).toBeVisible();
    });

    await test.step('click the Delete button for that user', async () => {
      const row = page.getByRole('row').filter({ hasText: email });
      await row.getByRole('button', { name: 'Delete user' }).click();
      await expect(
        page.getByRole('heading', { name: 'Delete User' })
      ).toBeVisible();
    });

    await test.step('confirm the deletion and wait for dialog to close', async () => {
      await page.getByRole('button', { name: 'Delete' }).click();
      await expect(
        page.getByRole('heading', { name: 'Delete User' })
      ).not.toBeVisible();
    });

    await test.step('verify the user no longer appears in the table', async () => {
      await expect(page.getByRole('cell', { name })).not.toBeVisible();
      await expect(page.getByRole('cell', { name: email })).not.toBeVisible();
    });
  });
});
