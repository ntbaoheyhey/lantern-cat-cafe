import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { auditContrast } from './accessibility.mjs';
const file = resolve('docs/cardrpg2/index.html');
const output = process.env.DEPTH_PATH_OUT || 'reports/cardrpg-depth/path';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const errors = [], requests = [], writes = [], rows = [];
try {
  for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', e => { if (e.type() === 'error') errors.push(e.text()); });
    page.on('request', request => { if (!/^(file:|blob:|data:)/.test(request.url())) requests.push(request.url()); });
    await page.exposeFunction('__recordWrite', kind => writes.push(kind));
    await page.addInitScript(() => {
      for (const key of ['setItem', 'removeItem', 'clear']) Storage.prototype[key] = function () { window.__recordWrite(key); throw Error('Demo storage write'); };
      indexedDB.open = () => { window.__recordWrite('indexedDB'); throw Error('Demo database write'); };
      Object.defineProperty(document, 'cookie', { get() { return ''; }, set() { window.__recordWrite('cookie'); throw Error('Demo cookie write'); } });
    });
    await page.goto('file://' + file);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    const screens = [], encountersPlayed = [];
    const capture = async name => {
      await page.waitForTimeout(200);
      if (await page.evaluate(() => !!window.__depthReview.battle)) {
        await page.waitForFunction(() => window.__depthScene?.ready);
        const frame = await page.evaluate(() => window.__depthScene.stats.frames);
        await page.waitForFunction(frame => window.__depthScene.stats.frames >= frame + 2, frame);
      }
      const layout = await page.evaluate(() => ({
        document: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
        viewport: [innerWidth, innerHeight],
        horizontalOverflow: [...document.querySelectorAll('.cr-content, .cr-panel, .dp-battle, .dp-decision, .dp-map')]
          .filter(e => e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden' && e.scrollWidth > e.clientWidth + 2)
          .map(e => ({ class: e.className, client: e.clientWidth, scroll: e.scrollWidth })),
        clippedControls: [...document.querySelectorAll('button,select,summary')]
          .filter(e => e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden'
            && !e.closest('[inert]') && e.scrollHeight > e.clientHeight + 2)
          .map(e => ({ text: e.textContent.trim().slice(0, 100), client: e.clientHeight, scroll: e.scrollHeight })),
        panelHeights: [...document.querySelectorAll('.cr-content,.cr-panel,.dp-battle,.dp-decision,.dp-map')]
          .filter(e => e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden')
          .map(e => ({ class: e.className, client: e.clientHeight, scroll: e.scrollHeight, overflow: getComputedStyle(e).overflowY })),
      }));
      assert.deepEqual(layout.document, layout.viewport, `${width} ${name} document overflow`);
      assert.deepEqual(layout.horizontalOverflow, [], `${width} ${name} panel overflow`);
      assert.deepEqual(layout.clippedControls, [], `${width} ${name} clipped controls`);
      const contrast = await auditContrast(page);
      assert.deepEqual(contrast.failures, [], `${width} ${name} settled text contrast`);
      assert.deepEqual(contrast.unresolved, [], `${width} ${name} unsupported background`);
      screens.push({ name, layout, contrast });
      await page.screenshot({ path: `${output}/${width}-${name}.png` });
    };
    const battle = async () => {
      await page.waitForFunction(() => window.__depthScene?.ready || window.__depthReview.sceneError);
      assert.equal(await page.evaluate(() => window.__depthReview.sceneError), '');
      let turns = 0;
      while (!await page.evaluate(() => window.__depthReview.battle?.result)) {
        await page.evaluate(() => { const m = window.__depthReview; m.plan = null; m.step('smart'); });
        if (++turns > 900) throw Error('Battle stalled');
      }
      await page.evaluate(() => { window.__depthReview.plan = null; window.__depthReview.notify(false); });
      encountersPlayed.push(await page.evaluate(() => {
        const battle = window.__depthReview.battle;
        return { chapter: battle.chapter, turns: battle.choices.length, winner: battle.result,
          breaks: battle.log.filter(event => event.kind === 'break').length,
          statuses: battle.log.filter(event => event.kind === 'status').length };
      }));
      await page.getByRole('button', { name: /Complete lesson|Collect encounter rewards/ }).click();
      assert.equal(await page.evaluate(() => window.__depthReview.error), false);
      return turns;
    };
    await capture('hub');
    await page.getByRole('button', { name: 'Try the practice table' }).click();
    await page.waitForFunction(() => window.__depthScene?.ready);
    await capture('tutorial');
    await page.getByRole('button', { name: /Door knock/ }).click();
    await page.getByRole('button', { name: /Practice Cushion garden/ }).click();
    await page.getByRole('button', { name: 'Play card →' }).click();
    const tutorialTurns = await battle();
    await page.getByRole('button', { name: 'Open free welcome invitation' }).click();
    await capture('invite');
    await page.getByRole('button', { name: 'Save & settings', exact: false }).click();
    await page.getByRole('button', { name: 'Unlock all cats and build materials' }).click();
    await page.getByRole('button', { name: 'Unlock chapters and Tower' }).click();
    await page.getByRole('button', { name: 'Export save code' }).click();
    const save = await page.getByLabel('Save code', { exact: true }).inputValue();
    assert.ok(save.startsWith('THC5.'));
    await page.getByRole('button', { name: 'Import save code' }).click();
    assert.equal(await page.evaluate(() => window.__depthReview.error), false);
    await capture('save');
    await page.getByLabel('Reduced motion', { exact: true }).check();
    assert.equal(await page.evaluate(() => window.__depthReview.state.settings.reducedMotion), true);
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
    await page.getByLabel('Reduced motion', { exact: true }).uncheck();
    await page.getByRole('button', { name: 'Team & cards', exact: false }).click();
    const cards = page.getByLabel('Mochi card 3', { exact: true });
    await cards.first().selectOption('mochi-4');
    assert.equal(await cards.first().inputValue(), 'mochi-4');
    await cards.first().selectOption('mochi-3');
    assert.ok(await page.locator('.dp-combos .active').count());
    await capture('team');
    await page.getByRole('button', { name: 'Begin Rooftop Orchard', exact: true }).click();
    await capture('map');
    let encounters = 0, events = 0, steps = 0;
    while (!await page.evaluate(() => window.__depthReview.state.run.complete)) {
      const state = await page.evaluate(() => {
        const m = window.__depthReview, r = m.state.run;
        return { battle: !!r.battle, reward: r.rewardChoices.length > 0, current: r.nodes.find(n => n.id === r.current)?.kind };
      });
      if (state.battle) { if (!encounters) await capture('battle'); await battle(); encounters++; }
      else if (state.reward) await page.locator('.dp-reward').first().click();
      else if (state.current === 'event') { await capture('event'); await page.locator('.cr-panel .dp-three button:enabled').first().click(); events++; }
      else if (state.current === 'treasure') await page.getByRole('button', { name: 'Take 70 run points' }).click();
      else if (state.current === 'shop') await page.getByRole('button', { name: 'Save your points and leave' }).click();
      else if (state.current === 'campfire') await page.getByRole('button', { name: 'Heal the team · 35% HP' }).click();
      else await page.locator('.dp-node:enabled').first().click();
      if (++steps > 50) throw Error('Run stalled');
    }
    assert.equal(await page.evaluate(() => window.__depthReview.state.run.won), true);
    await capture('rewards');
    await page.getByRole('button', { name: 'Equip your rewards' }).click();
    const set = await page.evaluate(() => window.__depthReview.state.gear.filter(g => g.templateId.startsWith('bellsteel-')).map(g => g.id));
    for (const id of set) {
      await page.evaluate(id => { window.__depthReview.itemId = id; window.__depthReview.notify(false); }, id);
      await page.getByRole('button', { name: 'Equip selected', exact: true }).click();
    }
    await capture('equipment');
    await page.getByRole('button', { name: 'Companions', exact: false }).click();
    await page.getByRole('button', { name: 'Awaken', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__depthReview.state.awakened.mochi), 1);
    await capture('collection');
    await page.getByRole('button', { name: 'Field guide', exact: false }).click();
    await capture('keywords');
    await page.getByRole('button', { name: 'enemies', exact: true }).click();
    await capture('enemies');
    await page.getByRole('button', { name: 'Fuji Relics', exact: false }).click();
    await page.getByRole('button', { name: 'Load fixture holdings' }).click();
    await page.getByRole('button', { name: /Epic ringing cup/ }).click();
    await capture('relics');
    await page.getByRole('button', { name: 'Before / after', exact: false }).click();
    await capture('census');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement && !document.activeElement.closest('[inert]')), true);
    assert.ok(encountersPlayed.some(encounter => encounter.breaks > 0));
    assert.ok(encountersPlayed.some(encounter => encounter.statuses > 0));
    rows.push({ width, height, screens, tutorialTurns, encounters, encountersPlayed, events, saveBytes: save.length });
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/check.json`, JSON.stringify({ artifactSha256: createHash('sha256').update(await readFile(file)).digest('hex'), date: new Date().toISOString(), rows, errors, requests, writes,
    method: 'Real UI controls and public smart policy. Animation completion accelerated. Later content uses the visible reviewer shortcuts. No HP or combat-result editing.' }, null, 2));
}
assert.deepEqual(errors, []); assert.deepEqual(requests, []); assert.deepEqual(writes, []);
console.log(JSON.stringify({ widths: rows.map(r => r.width), screens: rows.reduce((n, r) => n + r.screens.length, 0), errors, requests, writes }));
