import { test as setup } from '@playwright/test';
import path from 'path';
import { execSync } from 'child_process';
import {
  ADMIN_STORAGE,
  AGENT_STORAGE,
  AGENT_EMAIL,
  AGENT_PASSWORD,
} from './helpers/auth-constants';
import { loginAs } from './helpers/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

setup('create agent user', async () => {
  const serverDir = path.resolve(process.cwd(), 'server');
  execSync('bun prisma/seed-agent.ts', {
    cwd: serverDir,
    stdio: 'inherit',
    env: process.env,
  });
});

setup('save admin auth state', async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.context().storageState({ path: ADMIN_STORAGE });
});

setup('save agent auth state', async ({ page }) => {
  await loginAs(page, AGENT_EMAIL, AGENT_PASSWORD);
  await page.context().storageState({ path: AGENT_STORAGE });
});
