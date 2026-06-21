// Block 1.1 — Email Sign Up (live production, fresh account)
// Tests the automatable steps 1-4. Steps 5-6 (welcome email) are verified
// manually by watching the gmail inbox.
import { start, BASE, HOST } from './harness.mjs';

const { page, step, finish } = await start('block1.1-signup', { slowMo: 800 });

await step('Go to /signup — page loads with logo, Google button, email/password form', async () => {
  await page.goto(`${BASE}/signup`, { waitUntil: 'networkidle' });
  const logo = await page.getByText('Tiny Party').first().isVisible();
  const google = await page.getByRole('button', { name: /google/i }).isVisible();
  const fields =
    (await page.locator('#signup-name').count()) +
    (await page.locator('#signup-email').count()) +
    (await page.locator('#signup-password').count());
  return `logo=${logo}, googleBtn=${google}, formFields=${fields}/3`;
});

await step('Leave all fields blank and click Create Account — browser validation blocks submit', async () => {
  await page.getByRole('button', { name: /create account/i }).click();
  const stillOnSignup = page.url().includes('/signup');
  const validationMsg = await page.locator('#signup-name').evaluate(el => el.validationMessage);
  return `url=${page.url().replace(BASE, '')}, nameField.validationMessage="${validationMsg}", blocked=${stillOnSignup && !!validationMsg}`;
});

await step('Enter name + valid email + 5-char password, click Create Account — expect short-password error', async () => {
  await page.locator('#signup-name').fill(HOST.name);
  await page.locator('#signup-email').fill(HOST.email);
  await page.locator('#signup-password').fill('12345');
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForTimeout(800);
  const err = await page.locator('p').filter({ hasText: /password/i }).first().textContent().catch(() => null);
  // Guide expects "at least 6 characters"; live code enforces 8.
  const note = err && /8 characters/.test(err)
    ? `DEFECT: guide says "6 characters" but live error is "${err.trim()}"`
    : `error shown: "${(err || '').trim()}"`;
  return note;
});

await step('Change password to 8+ chars, click Create Account — account created, redirect to /dashboard', async () => {
  await page.locator('#signup-password').fill(HOST.password);
  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  return `redirected to ${page.url().replace(BASE, '')}`;
});

await finish();
