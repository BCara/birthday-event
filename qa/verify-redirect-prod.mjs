// Verify RedirectIfAuth on PROD using a fresh, uncached context.
import { chromium } from 'playwright';
const BASE = 'https://tinypartyportal.com';
const HOST = { email: 'arcarliegamer@gmail.com', password: 'TppQa2026!' };

const browser = await chromium.launch({ headless: false, slowMo: 600 });
const context = await browser.newContext({ viewport: { width: 1280, height: 860 }, bypassCSP: true });
await context.clearCookies();
const page = await context.newPage();

await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.locator('#login-email').fill(HOST.email);
await page.locator('#login-password').fill(HOST.password);
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL('**/dashboard', { timeout: 20000 });
console.log('signed in ->', new URL(page.url()).pathname);

for (const route of ['/login', '/signup']) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' });
  let res;
  try { await page.waitForURL('**/dashboard', { timeout: 8000 }); res = `PASS — ${route} redirected to /dashboard`; }
  catch { res = `FAIL — ${route} stayed on ${new URL(page.url()).pathname}`; }
  await page.screenshot({ path: `qa/screenshots/proof-loggedin${route.replace('/', '-')}.png` });
  console.log(res, '| requested', route, '-> landed', new URL(page.url()).pathname);
}
await browser.close();
