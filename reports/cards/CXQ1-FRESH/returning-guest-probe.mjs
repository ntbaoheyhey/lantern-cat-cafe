import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { guestCheckpoint } from './guest-checkpoint.mjs';
const [root, savePath, proofPath, out, size = '1280x720'] = process.argv.slice(2);
assert.ok(['1280x720', '1600x900'].includes(size));
const [width, height] = size.split('x').map(Number);
const site = 'https://taskbarhero-eight.vercel.app';
const proof = JSON.parse(await readFile(proofPath, 'utf8'));
assert.equal(proof.status, 'ARTIFACT_MATCH');
const save = guestCheckpoint(JSON.parse(await readFile(savePath, 'utf8')), site);
const { chromium } = createRequire(root + '/apps/web/package.json')('@playwright/test');
await mkdir(out, { recursive: false });
const browser = await chromium.launch({ headless: true });
const result = { sourceHead: proof.expectedHead, viewport: { width, height }, scope: 'Returning guest route diagnostic using unmodified UI-earned storage', startedAt: new Date().toISOString(), writesAttempted: 0, phases: [] };
try {
  const context = await browser.newContext({ viewport: { width, height }, storageState: save, serviceWorkers: 'block' });
  await context.route('**/*', async route => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.continue();
    result.writesAttempted++; await route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(5000);
  const snap = async name => {
    const phase = { name, landing: await page.getByTestId('landing-hero').isVisible(), classPicker: await page.getByTestId('class-picker').isVisible(), home: await page.getByTestId('home-dashboard').isVisible() };
    result.phases.push(phase); await page.screenshot({ path: out + '/' + name + '.png' });
    console.log(name, JSON.stringify(phase));
  };
  const response = await page.goto(site + '/#landing', { waitUntil: 'networkidle' });
  assert.equal(createHash('sha256').update(await response.text()).digest('hex'), proof.htmlStartSha256);
  await snap('earned-initial-landing');
  // Use the app's published hash router, without changing state or source.
  await page.goto(site + '/#hero'); await page.goto(site + '/#landing');
  await page.getByTestId('landing-hero').waitFor({ state: 'visible' });
  await snap('earned-explicit-landing');
  await page.getByTestId('landing-start').click();
  await page.waitForTimeout(1200);
  await snap('earned-start-click');
  const last = result.phases.at(-1);
  result.status = !last.home && !last.classPicker ? 'RETURNING_GUEST_BLANK_ROUTE' : 'RETURNING_GUEST_CONTINUES';
  if (result.status === 'RETURNING_GUEST_BLANK_ROUTE') process.exitCode = 1;
} catch (error) {
  result.status = 'PROBE_INCOMPLETE'; result.error = String(error.message).split('\n')[0].slice(0,180); process.exitCode = 2;
} finally {
  result.endedAt = new Date().toISOString(); await writeFile(out + '/result.json', JSON.stringify(result, null, 2) + '\n'); await browser.close();
}
