// Shared Playwright harness for Tiny Party Portal functional testing.
// Headed + slow-motion so the run is watchable; persistent profile so login
// survives between block scripts; a screenshot is saved after every step.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const QA = path.join(process.cwd(), 'qa');
const PROFILE = path.join(QA, '.profile');
const SHOTS = path.join(QA, 'screenshots');
export const BASE = 'https://tinypartyportal.com';

// Test host account (fresh signup target). Kept out of git via qa/.gitignore.
export const HOST = {
  name: 'Carlie QA',
  email: 'arcarliegamer@gmail.com',
  password: 'TppQa2026!', // meets the live 8-char minimum
};

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 44).replace(/^-|-$/g, '');
}

export async function start(blockId, { slowMo = 700 } = {}) {
  fs.mkdirSync(PROFILE, { recursive: true });
  const shotDir = path.join(SHOTS, blockId);
  fs.mkdirSync(shotDir, { recursive: true });

  const context = await chromium.launchPersistentContext(PROFILE, {
    headless: false,
    slowMo,
    viewport: { width: 1280, height: 860 },
  });
  const page = context.pages()[0] || (await context.newPage());

  // Disable the HTTP cache so freshly-deployed frontend changes are always seen
  // (the persistent profile otherwise caches old JS bundles → false negatives).
  try {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  } catch { /* CDP unavailable — non-fatal */ }

  let i = 0;
  const results = [];

  // step(label, fn) — fn returns a short "observed" string. Throw to mark FAIL.
  // Return the string "INFO: ..." from fn to mark a non-pass/fail note.
  async function step(label, fn) {
    i++;
    const id = String(i).padStart(2, '0');
    let status = 'PASS';
    let observed = '';
    try {
      const r = await fn();
      observed = r == null ? '' : String(r);
      if (observed.startsWith('INFO:')) status = 'INFO';
      if (observed.startsWith('DEFECT:')) status = 'DEFECT';
    } catch (e) {
      status = 'FAIL';
      observed = e.message.split('\n')[0];
    }
    try {
      await page.screenshot({ path: path.join(shotDir, `${id}-${slug(label)}.png`) });
    } catch { /* page may be navigating */ }
    console.log(`[${blockId} #${id}] ${status} — ${label}${observed ? `\n    -> ${observed}` : ''}`);
    results.push({ id, label, status, observed });
    return observed;
  }

  async function finish() {
    console.log(`\n===== ${blockId} SUMMARY =====`);
    const counts = { PASS: 0, FAIL: 0, INFO: 0, DEFECT: 0 };
    for (const r of results) {
      counts[r.status] = (counts[r.status] || 0) + 1;
      console.log(`#${r.id} [${r.status}] ${r.label}${r.observed ? ` :: ${r.observed}` : ''}`);
    }
    console.log(
      `\nPASS ${counts.PASS} | FAIL ${counts.FAIL} | DEFECT ${counts.DEFECT} | INFO ${counts.INFO}` +
        `\nScreenshots: qa/screenshots/${blockId}/`,
    );
    await context.close();
    return results;
  }

  return { context, page, step, finish, results };
}
