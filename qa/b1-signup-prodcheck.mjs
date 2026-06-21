// Production email confirmation: fresh signup via the live app to confirm the
// deployed onUserCreated function actually sends the welcome email now that the
// Resend domain is verified. Uses a +alias so it lands in the same gmail inbox.
import { start, BASE } from './harness.mjs';

const EMAIL = 'arcarliegamer+tpp4@gmail.com';
const PASSWORD = 'TppQa2026!';
const NAME = 'Carlie QA4';

const { page, step, finish } = await start('block1.1d-prodcheck', { slowMo: 700 });

await step('Sign out if currently logged in', async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const signOut = page.getByText(/sign out/i).first();
  if (await signOut.isVisible().catch(() => false)) {
    await signOut.click();
    await page.waitForTimeout(1500);
    return `signed out, now at ${page.url().replace(BASE, '')}`;
  }
  return 'INFO: was not logged in';
});

await step('Go to /signup and create a fresh account', async () => {
  await page.goto(`${BASE}/signup`, { waitUntil: 'domcontentloaded' });
  await page.locator('#signup-name').fill(NAME);
  await page.locator('#signup-email').fill(EMAIL);
  await page.locator('#signup-password').fill(PASSWORD);
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  return `account ${EMAIL} created, redirected to ${page.url().replace(BASE, '')}`;
});

await finish();
console.log(`\n>>> Now watch ${EMAIL} (same inbox as arcarliegamer) for the "Welcome to Tiny Party Portal! 🎉" email within ~2 min.`);
