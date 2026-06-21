// Verify birthday-star photo: crop/compress upload, badge on invite, photo on display.
import { chromium } from 'playwright';
import path from 'node:path';
const BASE = 'https://tinypartyportal.com';
const HOST = { email: 'arcarliegamer@gmail.com', password: 'TppQa2026!' };
const IMG = path.join(process.cwd(), 'src', 'assets', 'hero.png');

const browser = await chromium.launch({ headless: false, slowMo: 400 });
const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
const page = await ctx.newPage();

// Login + open first event
await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.locator('#login-email').fill(HOST.email);
await page.locator('#login-password').fill(HOST.password);
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL('**/dashboard', { timeout: 20000 });
await page.waitForTimeout(1500);
await page.locator('a[href*="/dashboard/event/"]').first().click();
await page.waitForURL('**/dashboard/event/**', { timeout: 15000 });
await page.waitForTimeout(2000);
const slug = (await page.content()).match(/[a-z0-9]+(?:-[a-z0-9]+)*-birthday-\d{4}-[a-z0-9]{3,8}/i)?.[0];
console.log('SLUG:', slug);

// Upload a photo → crop modal
await page.locator('input[type="file"]').first().setInputFiles(IMG);
const savePhoto = page.getByRole('button', { name: /save photo/i });
await savePhoto.waitFor({ timeout: 8000 });
await page.waitForTimeout(1500); // let the cropper init + onCropComplete fire
console.log('crop modal shown:', await savePhoto.isVisible());
await page.screenshot({ path: 'qa/screenshots/photo-crop-modal.png' });
await savePhoto.click();
await page.waitForTimeout(5000); // upload + compress
console.log('modal closed:', !(await savePhoto.isVisible().catch(() => false)));

// Persist the event so photoUrl is saved to Firestore
await page.getByRole('button', { name: /save changes/i }).click();
await page.waitForTimeout(4000);

// Invite page — expect theme illustration + circular photo badge
await page.goto(`${BASE}/${slug}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3500);
console.log('badge on invite:', await page.locator('.elp-star-badge').count());
await page.screenshot({ path: 'qa/screenshots/photo-invite.png', fullPage: true });

// Day-of display — expect the photo (circle), not the illustration fallback
await page.goto(`${BASE}/${slug}/display`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
console.log('photo on display:', await page.locator('img.cd-photo').count());
await page.screenshot({ path: 'qa/screenshots/photo-display.png' });

await browser.close();
console.log('done');
