// Verify the new Memory Capsule day-of display on prod (fresh, uncached context).
import { chromium } from 'playwright';
const BASE = 'https://tinypartyportal.com';
const HOST = { email: 'arcarliegamer@gmail.com', password: 'TppQa2026!' };

const browser = await chromium.launch({ headless: false, slowMo: 400 });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();

// Log in and open an event to discover its slug.
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.locator('#login-email').fill(HOST.email);
await page.locator('#login-password').fill(HOST.password);
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL('**/dashboard', { timeout: 20000 });
await page.waitForTimeout(2000);

await page.locator('a[href*="/dashboard/event/"]').first().click();
await page.waitForURL('**/dashboard/event/**', { timeout: 15000 });
await page.waitForTimeout(2000);

const html = await page.content();
const m = html.match(/[a-z0-9]+(?:-[a-z0-9]+)*-birthday-\d{4}-[a-z0-9]{3,8}/i);
const slug = m ? m[0] : null;
console.log('SLUG:', slug);
if (!slug) { await browser.close(); throw new Error('could not find a slug on the event page'); }

// Landscape tablet
await page.setViewportSize({ width: 1024, height: 768 });
await page.goto(`${BASE}/${slug}/display`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
console.log('TITLE:', await page.locator('.cd-title').textContent().catch(() => null));
console.log('CTA  :', await page.locator('.cd-cta').textContent().catch(() => null));
console.log('URL  :', await page.locator('.cd-url').textContent().catch(() => null));
console.log('QR svg count:', await page.locator('svg.cd-qr').count());
console.log('Fullscreen btn:', await page.locator('.cd-fs-btn').count());
console.log('Count pill:', await page.locator('.cd-count').textContent().catch(() => '(none yet)'));
await page.screenshot({ path: 'qa/screenshots/display-landscape.png' });

// Portrait tablet
await page.setViewportSize({ width: 768, height: 1024 });
await page.waitForTimeout(900);
await page.screenshot({ path: 'qa/screenshots/display-portrait.png' });

await browser.close();
console.log('\nDone. Screenshots: qa/screenshots/display-landscape.png, display-portrait.png');
