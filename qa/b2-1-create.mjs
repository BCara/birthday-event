// Block 2.1 — Create Event: Form Validation (live prod)
// Also creates a real event at the end (covers 2.4 post-creation emails).
import { start, BASE, HOST } from './harness.mjs';

const { page, step, finish } = await start('block2.1-create', { slowMo: 800 });

async function invalidFields() {
  // returns list of required fields currently failing HTML validation
  const out = [];
  for (const [id, label] of [['#ce-childName', 'Child Name'], ['#ce-name', 'Party Name'], ['#ce-date', 'Date']]) {
    const msg = await page.locator(id).evaluate(el => el.validationMessage).catch(() => '');
    if (msg) out.push(`${label} (${msg})`);
  }
  return out;
}

await step('Ensure logged in', async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  if (page.url().includes('/login')) {
    await page.locator('#login-email').fill(HOST.email);
    await page.locator('#login-password').fill(HOST.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 20000 });
  }
  return `at ${page.url().replace(BASE, '')}`;
});

await step('Click + New Party → navigates to /dashboard/create', async () => {
  await page.locator('a, button').filter({ hasText: /new party/i }).first().click();
  await page.waitForURL('**/dashboard/create', { timeout: 10000 });
  return `at ${page.url().replace(BASE, '')}`;
});

await step('Click Create Party with all fields empty → validation blocks', async () => {
  await page.getByRole('button', { name: /create party/i }).click();
  await page.waitForTimeout(500);
  const inv = await invalidFields();
  return `blocked on: ${inv.join(' | ') || 'NOTHING (unexpected)'}`;
});

await step('Fill child name only → click Create Party → which field is flagged next?', async () => {
  await page.locator('#ce-childName').fill('Ella');
  await page.getByRole('button', { name: /create party/i }).click();
  await page.waitForTimeout(500);
  const inv = await invalidFields();
  // Guide expects "date"; code also requires Party Name.
  const note = inv.some(f => f.startsWith('Party Name'))
    ? `DEFECT: guide says date is required next, but form flags Party Name. Flagged: ${inv.join(' | ')}`
    : `flagged: ${inv.join(' | ')}`;
  return note;
});

await step('Fill child name + date (no Party Name) → click → guide expects event created', async () => {
  await page.locator('#ce-date').fill('2026-12-20');
  await page.getByRole('button', { name: /create party/i }).click();
  await page.waitForTimeout(800);
  const inv = await invalidFields();
  const created = /\/dashboard\/event\//.test(page.url());
  if (created) return 'event created (matches guide)';
  return `DEFECT: not created — guide omits required Party Name. Still blocked on: ${inv.join(' | ')}`;
});

await step('Fill Party Name too → click Create Party → event created, redirected to event page', async () => {
  await page.locator('#ce-name').fill('Ella\'s 5th Birthday (QA)');
  await page.getByRole('button', { name: /create party/i }).click();
  await page.waitForURL('**/dashboard/event/**', { timeout: 20000 });
  return `created — redirected to ${page.url().replace(BASE, '')}`;
});

await finish();
console.log('\n>>> Watch arcarliegamer@gmail.com for "Your Birthday Event is Ready! 🎉" and codebertcreations@gmail.com for "New Event Created: ..."');
