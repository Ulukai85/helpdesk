import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Creates a user through the UI by clicking "Create User", filling in the
 * form, and waiting for the dialog to close.
 *
 * Assumes the caller is already on the /users page.
 */
export async function createUserViaUI(
  page: Page,
  name: string,
  email: string
): Promise<void> {
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
}
