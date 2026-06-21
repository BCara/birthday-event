import { chromium } from 'playwright';
const BASE = 'https://tinypartyportal.com';
const HOST = { email: 'arcarliegamer@gmail.com', password: 'TppQa2026!' };

const browser = await chromium.launch({ headless: false, slowMo: 500 });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();

const logs = [];
page.on('console', m => logs.push(`[console.${m.type()}] ${m.text()}`));
page.on('pageerror', e => logs.push(`[pageerror] ${e.message}`));
page.on('requestfailed', r => logs.push(`[requestfailed] ${r.url()} :: ${r.failure()?.errorText}`));

await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.locator('#login-email').fill(HOST.email);
await page.locator('#login-password').fill(HOST.password);
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL('**/dashboard', { timeout: 20000 });

await page.goto(`${BASE}/dashboard/create`, { waitUntil: 'domcontentloaded' });
await page.locator('#ce-childName').fill('Ella');
await page.locator('#ce-name').fill('Ella 5th Birthday QA');
await page.locator('#ce-date').fill('2026-12-20');
logs.length = 0; // only capture from the submit onwards
await page.getByRole('button', { name: /create party/i }).click();
await page.waitForTimeout(7000);

// grab any visible toast text
const toasts = await page.locator('[role="status"], .go2072408551, div').filter({ hasText: /party|required|failed|error/i }).allInnerTexts().catch(() => []);
console.log('FINAL URL:', page.url());
console.log('TOASTS:', JSON.stringify(toasts.slice(0, 5)));
console.log('LOGS:\n' + logs.join('\n'));
await browser.close();
