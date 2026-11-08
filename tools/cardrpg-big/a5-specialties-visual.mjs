// REFERENCE: PROMPT-A5 C1. Supplemental copy captures; original functional receipts stay intact.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';

const width = Number(process.argv[2]), mode = process.argv[3];
assert([1280, 1440, 1024].includes(width)); assert(['on', 'off'].includes(mode));
const height = width === 1440 ? 900 : width === 1024 ? 600 : 720;
const root = 'reports/cardrpg-big/a5/c1-specialties';
const attempt = process.env.A5_SPECIALTIES_ATTEMPT || '1';
const out = `${root}/visual-${mode}-${width}-attempt-${attempt}`;
await mkdir(out, { recursive: false });
const artifact = `/tmp/cardrpg-a5-specialties-${mode}/index.html`;
const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
const errors = [], captures = [];
page.on('pageerror', error => errors.push(String(error)));
const nav = name => page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name, exact: true }).click();
let passed = false;
try {
  await page.goto(pathToFileURL(artifact).href + '?dev=1');
  await page.getByRole('navigation', { name: 'Cafe screens' }).waitFor({ timeout: 120000 });
  await nav('Save & settings');
  await page.getByLabel('Save code', { exact: true }).fill(await readFile(`${root}/fixtures/all-set-tooltips.save`, 'utf8'));
  await page.getByRole('button', { name: 'Import save code', exact: true }).click();
  for (const look of ['baseline', 'look']) {
    if (look === 'look') await page.getByRole('button', { name: 'Look A/B', exact: true }).click();
    await nav('Companions');
    await page.getByRole('button', { name: /^Marigold,/ }).click();
    await page.locator('.dp-detail .dp-miniature-loading').waitFor({ state: 'hidden', timeout: 30000 });
    await page.locator('.dp-detail header').evaluate(node => {
      node.scrollIntoView({ block: 'start', behavior: 'instant' });
      let parent = node.parentElement;
      while (parent && parent !== document.documentElement && !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) parent = parent.parentElement;
      const top = node.getBoundingClientRect().top;
      (parent ?? document.documentElement).scrollTop += top - 120;
    });
    await page.evaluate(async () => { await document.fonts.ready; await new Promise(requestAnimationFrame); });
    const metrics = await page.evaluate(enabled => {
      const heading = document.querySelector('.dp-detail h2'), job = document.querySelector('.dp-detail [data-companion-specialty]');
      const bounds = node => { const r = node.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }; };
      const visible = node => { const r = bounds(node); return r.top >= 90 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; };
      return { heading: heading.textContent, headingVisible: visible(heading), job: job?.textContent ?? null,
        jobVisible: enabled ? !!job && visible(job) : job === null,
        jobBounds: job ? bounds(job) : null, overflow: document.documentElement.scrollWidth - innerWidth,
        loading: document.querySelectorAll('.dp-detail .dp-miniature-loading').length };
    }, mode === 'on');
    const path = `${out}/${look}-collection.png`;
    await page.screenshot({ path });
    captures.push({ look, path, ...metrics, sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
    assert.equal(metrics.heading, 'Marigold'); assert(metrics.headingVisible, JSON.stringify(metrics)); assert(metrics.jobVisible);
    assert.equal(metrics.overflow, 0); assert.equal(metrics.loading, 0);
    if (mode === 'on') assert.equal(metrics.job, 'Best at: Keeping several allies healthy over long fights.');
  }
  assert.deepEqual(errors, []); passed = true;
} finally {
  await writeFile(`${out}/checks.json`, JSON.stringify({ passed, width, height, mode, artifact,
    sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), captures, errors,
    method: 'Supplemental Collection captures after original images centered the tall detail panel below its job text. Same immutable mode artifacts; wait for preview and frame the heading and job. Reviewer dev controls are intentionally enabled.' }, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ passed, width, mode, captures: captures.length }));
