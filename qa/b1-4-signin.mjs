// Block 1.4 — Email Sign In (live prod)
import { start, BASE, HOST } from './harness.mjs';

const { page, step, finish } = await start('block1.4-signin', { slowMo: 800 });

async function signOutIfNeeded() {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const so = page.getByText(/sign out/i).first();
  if (await so.isVisible().catch(() => false)) { await so.click(); await page.waitForTimeout(1200); }
}

await step('Log out, go to /login — login page loads', async () => {
  await signOutIfNeeded();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  return `login form visible=${await page.locator('#login-email').isVisible()}`;
});

await step('Correct email + password → Sign In → redirect to /dashboard', async () => {
  await page.locator('#login-email').fill(HOST.email);
  await page.locator('#login-password').fill(HOST.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  return `redirected to ${page.url().replace(BASE, '')}`;
});

await step('Log out, correct email + WRONG password → "Invalid email or password."', async () => {
  await signOutIfNeeded();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill(HOST.email);
  await page.locator('#login-password').fill('totallyWrong999');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForTimeout(2500);
  const err = await page.locator('p').filter({ hasText: /invalid email or password/i }).first().textContent().catch(() => null);
  if (!err) throw new Error('expected "Invalid email or password." error not shown');
  return `error: "${err.trim()}", url=${page.url().replace(BASE, '')}`;
});

await step('Made-up email + password → "Invalid email or password."', async () => {
  await page.locator('#login-email').fill('nobody-xyz-12345@example.com');
  await page.locator('#login-password').fill('whatever123');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForTimeout(2500);
  const err = await page.locator('p').filter({ hasText: /invalid email or password/i }).first().textContent().catch(() => null);
  if (!err) throw new Error('expected "Invalid email or password." error not shown');
  return `error: "${err.trim()}", url=${page.url().replace(BASE, '')}`;
});

await finish();
