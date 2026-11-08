// REFERENCE: PROMPT-A5 B2/C1; targeted copy/selection checks, not the Z screenshot pack.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const width = Number(process.argv[2] || 1280), mode = process.argv[3] || 'on';
assert([1024, 1280, 1440].includes(width)); assert(['on', 'off'].includes(mode));
const enabled = mode === 'on', height = width === 1440 ? 900 : width === 1024 ? 600 : 720;
const artifact = `/tmp/cardrpg-a5-specialties-${mode}/index.html`;
const root = 'reports/cardrpg-big/a5/c1-specialties';
const attempt = process.env.A5_SPECIALTIES_ATTEMPT || '1';
const out = `${root}/browser-${mode}-${width}-attempt-${attempt}`;
await mkdir(out, { recursive: false });
const fixture = JSON.parse(await readFile(`${root}/fixtures/checks.json`, 'utf8'));
const browser = await chromium.launch({ channel: 'chromium', headless: true, args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
const checks = [], captures = [], errors = [], remote = [];
page.on('pageerror', error => errors.push(String(error)));
page.on('request', request => { if (/^https?:/.test(request.url())) remote.push(request.url()); });
const button = name => page.getByRole('button', { name, exact: true });
const nav = name => page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name, exact: true }).click();
const read = () => page.evaluate(() => ({ state: window.__depthReview.state, screen: window.__depthReview.screen,
  battle: window.__depthReview.battle }));
async function importSave(code) {
  await nav('Save & settings');
  await page.getByLabel('Save code', { exact: true }).fill(code);
  await button('Import save code').click();
  assert.match(await page.locator('.cr-status').innerText(), /checksum verified/);
  assert.equal((await read()).state.gameplayV4 === true, enabled);
}
async function capture(name, selector) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  const metrics = await page.evaluate(selector => {
    const root = document.querySelector(selector);
    const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
    const luma = c => c.slice(0, 3).map(x => x / 255).map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4)
      .reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
    const contrast = [...root.querySelectorAll('[data-companion-specialty], [data-companion-specialty] b, .dp-team-set')]
      .concat(root.matches('[data-companion-specialty]') ? [root] : []).filter(e => e.getClientRects().length).map(e => {
        let p = e, bgs;
        const r = e.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
        while (p) {
          const box = p.getBoundingClientRect();
          if (x < box.left || x > box.right || y < box.top || y > box.bottom) { p = p.parentElement; continue; }
          const style = getComputedStyle(p), stops = [...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m => rgb(m[0]));
          if (stops.length && stops.every(c => c.length === 3 || c[3] === 1)) { bgs = stops; break; }
          const color = rgb(style.backgroundColor);
          if (color.length === 3 || color[3] === 1) { bgs = [color]; break; }
          p = p.parentElement;
        }
        const a = luma(rgb(getComputedStyle(e).color)), ls = (bgs || [[29, 27, 40]]).map(luma);
        const b = Math.max(Math.min(...ls), Math.min(Math.max(...ls), a));
        return { text: e.textContent.trim(), ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
      });
    return { overflow: document.documentElement.scrollWidth - innerWidth, contrast };
  }, selector);
  const path = `${out}/${name}.png`;
  await page.screenshot({ path }); captures.push({ name, path, ...metrics });
  assert.equal(metrics.overflow, 0, name);
  assert(metrics.contrast.every(row => row.ratio >= 4.5), JSON.stringify(metrics.contrast));
}
let passed = false;
try {
  await page.goto(pathToFileURL(artifact).href + '?dev=1');
  await page.getByRole('navigation', { name: 'Cafe screens' }).waitFor({ timeout: 120000 });
  assert.equal((await read()).state.gameplayV4 === true, enabled);
  await importSave(await readFile(fixture.historical.path, 'utf8'));
  const historical = (await read()).state;
  assert.deepEqual(historical.account.currencies, fixture.historical.currencies);
  assert.deepEqual(historical.team, fixture.historical.team);
  assert.equal(historical.account.day, fixture.historical.day);
  checks.push(`${fixture.historical.prefix} imports without losing currencies, team or day; build mode ${mode}`);
  await importSave(await readFile(`${root}/fixtures/all-set-tooltips.save`, 'utf8'));
  for (const look of ['baseline', 'look']) {
    if (look === 'look') await button('Look A/B').click();
    await nav('Companions');
    for (const cat of fixture.cats) {
      await page.getByRole('button', { name: new RegExp(`^${cat.name},`) }).click();
      await page.locator('.dp-detail h2').filter({ hasText: cat.name }).waitFor();
      const job = page.locator('.dp-detail [data-companion-specialty]');
      if (enabled) {
        assert.equal(await job.count(), 1); assert.equal(await job.getAttribute('data-companion-specialty'), cat.id);
        assert.equal(await job.innerText(), `Best at: ${cat.job}`);
        assert(cat.job.split(/\s+/).length <= 18);
      } else assert.equal(await job.count(), 0);
    }
    checks.push(`${look}: all twelve Collection selections show the correct ${mode} description`);
    await capture(`${look}-collection`, '.dp-detail');
    await nav('Team & cards');
    await page.getByRole('heading', { name: 'Automatic kits', exact: true }).waitFor();
    const jobs = await page.locator('[data-companion-specialty]').evaluateAll(nodes => nodes.map(e => ({ id: e.dataset.companionSpecialty, text: e.innerText })));
    assert.equal(jobs.length, enabled ? 3 : 0);
    for (const job of jobs) assert.equal(job.text, `Best at: ${fixture.cats.find(cat => cat.id === job.id).job}`);
    const titles = await page.locator('.dp-team-set').evaluateAll(nodes => nodes.map(e => ({ text: e.textContent.trim(), title: e.title })));
    for (const set of fixture.tooltips) {
      const actual = titles.find(row => row.text.startsWith(set.name + ' ·'));
      assert(actual, set.name); assert.equal(actual.title, set[mode], `${look} ${set.name} ${mode}`);
    }
    await capture(`${look}-team-sets`, '.dp-formation');
    if (enabled) await capture(`${look}-team-jobs`, '[data-companion-specialty="mochi"]');
    checks.push(`${look}: all eight set tooltips follow ${mode}; Team jobs ${enabled ? 'visible' : 'absent'}`);
    await nav('Cafe');
    await page.getByRole('button', { name: /^Try the practice table/ }).click();
    if (enabled) {
      for (const cat of fixture.team) {
        const name = fixture.cats.find(row => row.id === cat).name;
        await button(`Select ${name} for placement`).focus(); await page.keyboard.press('Space');
        assert.equal(await page.locator('.dp-v4-prepare [data-companion-specialty]').getAttribute('data-companion-specialty'), cat);
      }
      await button('Select Soot for placement').focus(); await page.keyboard.press('Enter');
      await button('Place Soot in Front').focus(); await page.keyboard.press('Enter');
      assert.equal((await read()).battle.actors.find(cat => cat.id === 'soot').row, 'front');
      await capture(`${look}-prepare`, '.dp-v4-prepare');
    } else {
      assert.equal(await page.locator('[data-companion-specialty]').count(), 0);
      assert.equal(await page.locator('.dp-v4-prepare').count(), 0);
      await capture(`${look}-prepare`, '.cr-content');
    }
    checks.push(`${look}: Prepare ${enabled ? 'keyboard selection and placement preserve selected job' : 'has no V4 job panel'}`);
    // Discard only this synthetic, unplayed practice before the next look.
    await importSave(await readFile(`${root}/fixtures/all-set-tooltips.save`, 'utf8'));
  }
  assert.deepEqual(errors, []); assert.deepEqual(remote, []); passed = true;
} finally {
  await writeFile(`${out}/checks.json`, JSON.stringify({ passed, width, height, mode, artifact,
    sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
    method: 'Headless real clicks and keyboard input; synthetic UI equipment, no earned-path claim; separate ON/OFF builds.',
    checks, captures, errors, remote }, null, 2) + '\n');
  await browser.close();
}
console.log(JSON.stringify({ passed, width, mode, checks: checks.length, captures: captures.length }));
