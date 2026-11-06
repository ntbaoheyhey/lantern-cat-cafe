import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const captureScreenshots = process.env.BIG_CAPTURE !== '0';
const output = process.env.BIG_INVITE_OUT || 'reports/cardrpg-big/invitations/screens';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height, cpu] of [[1280, 720, 1], [1440, 900, 1], [1024, 600, 1], [1280, 720, 4]]) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    const errors = [], requests = [], captures = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
    await page.addInitScript(() => {
      window.__invitePerf = { frames: [], marks: [], last: 0 };
      requestAnimationFrame(function sample(now) {
        const data = window.__invitePerf;
        if (data.last) data.frames.push({ at: now, ms: now - data.last });
        data.last = now;
        requestAnimationFrame(sample);
      });
    });
    const mark = label => page.evaluate(label => window.__invitePerf.marks.push({ label, at: performance.now() }), label);
    const capture = async name => {
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        rightOverflow: [...document.querySelectorAll('.cr-content button, .cr-content table')]
          .filter(element => element.getClientRects().length && element.getBoundingClientRect().right > innerWidth + 1)
          .map(element => element.textContent.slice(0, 90)),
        phase: document.querySelector('.dp-ceremony')?.className ?? 'summary',
        results: document.querySelector('.dp-batch-results')?.getBoundingClientRect().toJSON(),
        firstResult: document.querySelector('.dp-batch-grid article')?.getBoundingClientRect().toJSON(),
        fairness: document.querySelector('.dp-invitation-fairness')?.getBoundingClientRect().toJSON(),
      }));
      assert.equal(layout.overflow, 0, `${name} document overflow`);
      assert.deepEqual(layout.rightOverflow, [], `${name} content overflow`);
      const path = `${output}/${width}x${height}-cpu${cpu}-${name}.png`;
      if (captureScreenshots) await page.screenshot({ path });
      captures.push({ name, path: captureScreenshots ? path : null, layout });
      await writeFile(`${output}/${width}x${height}-cpu${cpu}-${name}-layout.json`,
        JSON.stringify({ artifact, width, height, cpu, name, layout }, null, 2));
      if (name === 'ten-pull-results' || name === 'welcome-result') {
        assert(layout.results && layout.results.top >= layout.fairness.bottom && layout.results.top < height,
          'Completed invitation results appear below the fairness summary');
        assert(layout.firstResult && layout.firstResult.top < height && layout.firstResult.bottom <= height,
          'The first earned result is visible after the ceremony');
      }
    };
    const once = () => page.getByRole('button', { name: 'Invite once · 150 stamps', exact: true });
    const ten = () => page.getByRole('button', { name: 'Invite ten · 1500 stamps', exact: true });
    const skip = () => page.getByRole('button', { name: 'Skip reveal', exact: true }).click();
    const state = () => page.evaluate(() => window.__depthReview.state);
    await page.goto('file://' + artifact);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 120000 });
    await mark('hub-interactive');
    await page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name: 'Invitations', exact: true }).click();
    await page.waitForFunction(() => window.__depthPreviewScene?.ready, null, { timeout: 60000 });
    await capture('standard');
    const initial = await state();
    await mark('welcome-click');
    await page.getByRole('button', { name: 'Open free welcome invitation' }).click();
    assert.equal((await state()).account.currencies.stamps, initial.account.currencies.stamps);
    assert.equal((await state()).account.history.length, 1);
    await capture('sealed');
    const welcome = await state();
    await skip();
    assert.deepEqual(await state(), welcome);
    await mark('welcome-skipped');
    await capture('welcome-result');

    await page.evaluate(() => {
      const model = window.__depthReview;
      model.shortcut('unlock');
      model.state.account.currencies.stamps = 6000;
      model.state.account.pity['cats-standard'].sinceLegendary = 59;
      model.notify();
    });
    await mark('ten-pull-click');
    await ten().click();
    await page.locator('.dp-flip-result').waitFor();
    assert.equal((await state()).account.history.at(-10).rarity, 'legendary');
    assert.equal((await state()).account.currencies.stamps, 4500);
    await capture('ten-pull-legendary');
    const batch = await state();
    await skip();
    assert.deepEqual(await state(), batch);
    assert.equal(await page.locator('.dp-batch-grid > article').count(), 10);
    assert((await state()).account.history.slice(-10).every(result => result.duplicate && result.shards > 0));
    await mark('ten-pull-skipped');
    await capture('ten-pull-results');

    await page.getByRole('button', { name: 'Marigold at Closing Time', exact: true }).click();
    await page.evaluate(() => {
      const model = window.__depthReview;
      model.state.account.pity['cats-featured'] = { sinceLegendary: 59, featuredGuaranteed: true, totalPulls: 59 };
      model.notify();
    });
    assert(await page.getByText('Legendary guaranteed in 1', { exact: true }).count());
    await mark('featured-click');
    await once().click();
    await page.locator('.dp-flip-result').waitFor();
    assert.equal((await state()).account.history.at(-1).cardId, 'marigold');
    await capture('featured-guarantee');
    await skip();
    await mark('featured-skipped');

    await page.getByRole('button', { name: 'Mending Basket', exact: true }).click();
    const gearBefore = (await state()).gear.length;
    await once().click();
    await skip();
    assert.equal((await state()).gear.length, gearBefore + 1);
    assert.equal((await state()).account.history.at(-1).bannerId, 'equipment');
    await capture('equipment');

    await page.getByRole('button', { name: 'Cafe Guestbook', exact: true }).click();
    await page.evaluate(() => {
      const model = window.__depthReview;
      model.state.account.pity['cats-standard'].sinceLegendary = 40;
      model.notify();
    });
    assert(await page.getByText('4.00%', { exact: true }).count());
    await capture('soft-pity');
    await page.evaluate(() => {
      window.__depthReview.state.account.currencies.stamps = 149;
      window.__depthReview.notify();
    });
    assert(await once().isDisabled());
    assert(await ten().isDisabled());
    await page.evaluate(() => {
      const model = window.__depthReview;
      model.state.account.currencies.stamps = 3000;
      model.state.account.daily.draws = 30;
      model.notify();
    });
    assert(await once().isDisabled());
    assert(await ten().isDisabled());

    await page.evaluate(() => {
      const model = window.__depthReview;
      const result = model.state.account.history[0];
      model.state.account.history = Array.from({ length: 200 }, (_, index) => ({ ...result, index: index + 1 }));
      model.state.account.daily.draws = 0;
      model.state.settings.reducedMotion = true;
      model.notify();
    });
    await mark('reduced-ten-click');
    await ten().click();
    assert.equal(await page.getByRole('button', { name: 'Skip reveal' }).count(), 0);
    assert.equal((await state()).account.history.length, 200);
    assert.equal(await page.locator('.dp-batch-grid > article').count(), 10);
    assert.equal(await page.locator('.dp-history-scroll tbody tr').count(), 200);
    assert((await state()).account.history.every(result => result.soulbound && !result.tradeable));
    await capture('reduced-history');
    await mark('complete');
    await page.waitForTimeout(250);
    const timing = await page.evaluate(() => window.__invitePerf);
    const sorted = timing.frames.map(frame => frame.ms).sort((left, right) => left - right);
    const summary = { max: sorted.at(-1), p95: sorted[Math.floor(sorted.length * .95)],
      above25: sorted.filter(time => time > 25).length, above50: sorted.filter(time => time > 50).length,
      within20: sorted.filter(time => time <= 20).length / sorted.length };
    assert.equal(errors.length, 0);
    assert.equal(requests.length, 0);
    const rawPath = `${output}/${width}x${height}-cpu${cpu}.json`;
    await writeFile(rawPath, JSON.stringify({ width, height, cpu, captureScreenshots, errors, requests, captures,
      timing, summary }, null, 2));
    rows.push({ width, height, cpu, rawPath, summary, errors, captures });
    await writeFile(`${output}/checks.json`, JSON.stringify({ artifact,
      sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), captureScreenshots,
      method: 'Fresh file opening and real invitation clicks. Explicit fixtures set hard/soft pity, owned companions, funds and history. All frame intervals retained. Screenshot-enabled runs are visual evidence only.', rows }, null, 2));
    console.log(JSON.stringify({ width, height, cpu, captures: captures.length, summary, errors }));
    await context.close();
  }
} finally { await browser.close(); }
