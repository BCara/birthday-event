// Block 1.5 — Auth Guards (live prod)
import { start, BASE, HOST } from './harness.mjs';

const { page, step, finish } = await start('block1.5-guards', { slowMo: 700 });

async function signOutIfNeeded() {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const so = page.getByText(/sign out/i).first();
  if (await so.isVisible().catch(() => false)) { await so.click(); await page.waitForTimeout(1200); }
}

await step('Ensure logged OUT', async () => {
  await signOutIfNeeded();
  return 'logged out';
});

for (const route of ['/dashboard', '/dashboard/create', '/dashboard/event/FAKEID']) {
  await step(`Logged out → ${route} → should redirect to /login`, async () => {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/login', { timeout: 10000 });
    return `redirected to ${page.url().replace(BASE, '')}`;
  });
}

await step('Logged IN → /login → should redirect to /dashboard', async () => {
  // sign in first
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill(HOST.email);
  await page.locator('#login-password').fill(HOST.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  // now hit /login while authenticated
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  return `redirected to ${page.url().replace(BASE, '')}`;
});

await finish();
