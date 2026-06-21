// Render an HTML email file to a PNG at email width for visual review.
import { chromium } from 'playwright';
import path from 'node:path';

const files = ['current', 'new'];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 680, height: 900 }, deviceScaleFactor: 2 });
for (const f of files) {
  const url = 'file://' + path.join(process.cwd(), 'qa', 'email-preview', `${f}.html`).replace(/\\/g, '/');
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // let webfonts settle
  const out = path.join(process.cwd(), 'qa', 'email-preview', `${f}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log('rendered', out);
}
await browser.close();
