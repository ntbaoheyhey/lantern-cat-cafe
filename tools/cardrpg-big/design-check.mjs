import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const output = process.env.BIG_DESIGN_OUT || 'reports/cardrpg-big/items/screens';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height] of [[1280, 720], [1440, 900], [1024, 600]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [], requests = [], captures = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
    const capture = async name => {
      await page.locator('.cr-content').evaluate(element => element.scrollTo(0, 0));
      const layout = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - innerWidth,
        articles: [...document.querySelectorAll('.dp-design-grid article')].map(element => {
          const rect = element.getBoundingClientRect();
          return { name: element.getAttribute('aria-label'), x: rect.x, right: rect.right, width: rect.width };
        }) }));
      assert.equal(layout.overflow, 0);
      assert(layout.articles.every(article => article.x >= 0 && article.right <= width));
      const path = `${output}/${width}x${height}-${name}.png`;
      await page.screenshot({ path });
      captures.push({ name, path, layout });
    };
    await page.goto('file://' + artifact);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    await page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name: 'Equipment', exact: true }).click();
    await page.getByRole('button', { name: 'Collectibles', exact: true }).click();
    const moon = page.getByRole('article', { name: 'Moon Collar' });
    const maneki = page.getByRole('article', { name: 'Golden Maneki' });
    assert(await moon.getByText('0 / 2400', { exact: true }).count());
    assert(await maneki.getByText('0 / 60', { exact: true }).count());
    assert(await moon.getByRole('button').isDisabled());
    assert(await maneki.getByRole('button').isDisabled());
    await capture('effort-locked');
    await page.getByText('How effort and supply create rarity', { exact: true }).click();
    assert(await page.getByText(/The prototype tracks these counters/).isVisible());
    await capture('help');
    await page.getByText('How effort and supply create rarity', { exact: true }).click();
    await page.evaluate(() => {
      const model = window.__depthReview;
      model.state.seals = 3;
      model.state.cleared = [1];
      model.notify();
    });
    const powerBefore = await page.evaluate(() => JSON.stringify(window.__depthReview.state.account.cards));
    await moon.getByRole('button', { name: 'Reserve with 3 seals' }).click();
    assert(await moon.getByText('1 / 2400', { exact: true }).count());
    assert(await moon.getByText('1 / 400', { exact: true }).count());
    assert(await moon.getByRole('button', { name: 'Design reserved' }).isDisabled());
    assert.equal(await page.evaluate(() => window.__depthReview.state.seals), 0);
    assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state.account.cards)), powerBefore);
    await capture('moon-reserved');
    await page.evaluate(() => {
      const model = window.__depthReview;
      model.state.seals = 10;
      model.state.masteries = [1, 2, 3];
      const counter = model.state.account.scarcity['golden-maneki'];
      counter.issuedDesign = 359;
      counter.seasonIssuedDesign = 59;
      model.notify();
    });
    await maneki.getByRole('button', { name: 'Reserve with 10 seals' }).click();
    assert(await maneki.getByText('360 / 360', { exact: true }).count());
    assert(await maneki.getByText('60 / 60', { exact: true }).count());
    assert(await maneki.getByRole('button', { name: 'Design reserved' }).isDisabled());
    assert.equal(await page.evaluate(() => window.__depthReview.state.seals), 0);
    await capture('last-supply-reserved');
    assert.equal(errors.length, 0);
    assert.equal(requests.length, 0);
    rows.push({ width, height, errors, remoteRequests: requests, captures,
      checks: { initialEffortLocked: true, help: true, moonBothCounters: true, exactSealSpend: true,
        finalGlobalAndSeasonPlace: true, duplicateAccountLocked: true } });
    await writeFile(`${output}/checks.json`, JSON.stringify({ artifact,
      sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
      method: 'Real navigation and reservation clicks. Explicit reviewer fixtures set effort and local counters. Screenshots support UI claims. Rules boundary tests separately verify unchanged battle stats.', rows }, null, 2));
    console.log(JSON.stringify({ width, height, captures: captures.length, errors }));
    await page.close();
  }
} finally { await browser.close(); }
