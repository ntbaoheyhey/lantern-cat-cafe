import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { loadRules } from '../cardrpg-sim/load.mjs';

const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const output = process.env.BIG_REVEAL_OUT || 'reports/cardrpg-big/integration/reveal/screens';
const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
const { load, vite } = await loadRules();
let epicSeed;
try {
  const rules = await load('packages/game-rules/src/cardrpg/depth/index.ts');
  const state = rules.createDepthAccount(11, 0);
  state.account.currencies.stamps = 3000;
  for (let seed = 1; seed <= 1000; seed++) {
    const result = rules.metaCommand(state, { type: 'pull', bannerId: 'standard', count: 1, seed: seed + 39 });
    if (result.ok && result.state.account.history.at(-1).rarity === 'epic') { epicSeed = seed; break; }
  }
  assert(epicSeed, 'Find an ordinary epic-result fixture through the existing rules');
} finally { await vite.close(); }

await mkdir(output, { recursive: true });
const rows = [];
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height, cpu] of [[1024, 600, 1], [1280, 720, 1], [1440, 900, 1], [1280, 720, 4]]) {
    for (const rarity of ['epic', 'legendary']) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      const errors = [], requests = [], captures = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
      await page.goto('file://' + artifact);
      await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 120000 });
      await page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name: 'Invitations', exact: true }).click();
      if (rarity === 'legendary') await page.getByRole('button', { name: 'Marigold at Closing Time', exact: true }).click();
      await page.evaluate(({ rarity, epicSeed }) => {
        const m = window.__depthReview;
        m.state.freeInvite = true;
        m.state.account.currencies.stamps = 3000;
        m.state.account.seed = epicSeed;
        if (rarity === 'legendary') m.state.account.pity['cats-featured'] = { sinceLegendary: 59, totalPulls: 59, featuredGuaranteed: true };
        m.notify();
      }, { rarity, epicSeed });
      await page.waitForFunction(() => window.__depthPreviewScene?.ready, null, { timeout: 60000 });
      await page.evaluate(() => {
        const scene = window.__depthPreviewScene;
        window.__revealScene = scene;
        window.__revealCalls = [];
        const original = scene.playEntrance.bind(scene);
        scene.playEntrance = async id => {
          const played = await original(id);
          window.__revealCalls.push({ id, played, at: performance.now() });
          return played;
        };
      });
      const capture = async name => {
        const layout = await page.evaluate(() => {
          const fairness = document.querySelector('.dp-invitation-fairness');
          const bounds = fairness.getBoundingClientRect();
          return { fairness: bounds.toJSON(), text: fairness.textContent,
            overflow: document.documentElement.scrollWidth - innerWidth,
            canvas: document.querySelector('.dp-invitation-preview canvas')?.getBoundingClientRect().toJSON() };
        });
        assert.equal(layout.overflow, 0);
        assert(layout.fairness.top >= 0 && layout.fairness.bottom <= height, 'Fairness summary stays in the viewport');
        const path = `${output}/${width}-cpu${cpu}-${rarity}-${name}.png`;
        await page.screenshot({ path });
        captures.push({ name, path, layout });
      };
      await capture('before');
      await page.getByRole('button', { name: 'Invite once · 150 stamps', exact: true }).click();
      await page.waitForFunction(() => window.__revealCalls.some(call => call.played), null, { timeout: 10000 });
      const entrance = await page.evaluate(() => {
        const scene = window.__depthPreviewScene;
        return { result: window.__depthReview.state.account.history.at(-1),
          calls: window.__revealCalls, sameScene: scene === window.__revealScene,
          active: scene.entrance, models: [...scene.puppets.values()].map(puppet => puppet.asset) };
      });
      assert.equal(entrance.result.rarity, rarity);
      assert.equal(entrance.sameScene, true);
      assert.equal(entrance.calls.filter(call => call.played).length, 1);
      assert.equal(entrance.active?.asset, entrance.result.cardId);
      assert(entrance.models.includes(entrance.result.cardId));
      await capture('entrance');
      const committed = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
      await page.getByRole('button', { name: 'Skip reveal', exact: true }).click();
      assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), committed);
      assert.equal(await page.evaluate(() => window.__depthPreviewScene === window.__revealScene), true);
      await page.getByRole('region', { name: 'Invitation fairness' }).getByRole('link').click();
      await capture('history');
      assert.deepEqual(errors, []);
      assert.deepEqual(requests, []);
      rows.push({ width, height, cpu, rarity, epicSeed, entrance, captures, errors, requests });
      await writeFile(`${output}/checks.json`, JSON.stringify({ artifact, sha256,
        method: 'Fresh offline pages. Explicit funds, seed and hard-pity fixtures, then real invitation and skip clicks. The existing entrance API is observed without changing its result. Screenshots verify layout and carry screenshot overhead.', rows }, null, 2));
      console.log(JSON.stringify({ width, cpu, rarity, cat: entrance.result.cardId, calls: entrance.calls.length, captures: captures.length }));
      await context.close();
    }
  }
} finally { await browser.close(); }
