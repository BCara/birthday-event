// Block 1.2 — Duplicate Email Sign Up (live prod)
// Signing up with an already-registered email must error and not redirect.
import { start, BASE } from './harness.mjs';

const EXISTING_EMAIL = 'arcarliegamer@gmail.com'; // created in Block 1.1
const { page, step, finish } = await start('block1.2-duplicate', { slowMo: 800 });

await step('Sign out, then go to /signup — page loads', async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const signOut = page.getByText(/sign out/i).first();
  if (await signOut.isVisible().catch(() => false)) { await signOut.click(); await page.waitForTimeout(1500); }
  await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' });
  const loaded = await page.locator('#signup-email').isVisible();
  return `signup form visible=${loaded}`;
});

await step('Enter an existing email + new password, click Create Account — expect "already exists" error', async () => {
  await page.locator('#signup-name').fill('Dup Test');
  await page.locator('#signup-email').fill(EXISTING_EMAIL);
  await page.locator('#signup-password').fill('NewPassword123');
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForTimeout(2500);
  const err = await page.locator('p').filter({ hasText: /already exists|exists/i }).first().textContent().catch(() => null);
  if (!err) throw new Error('no "already exists" error message appeared');
  return `error shown: "${err.trim()}"`;
});

await step('Page stays on /signup — no account created, no redirect', async () => {
  const url = page.url().replace(BASE, '');
  if (!url.includes('/signup')) throw new Error(`expected to stay on /signup but at ${url}`);
  return `still on ${url}`;
});

await finish();
