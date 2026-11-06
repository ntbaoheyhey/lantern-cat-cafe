import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const output = process.env.BIG_META_OUT || 'reports/cardrpg-big/meta/screens';
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const cases = JSON.parse(process.env.BIG_META_CASES || '[[1280,720],[1440,900],[1024,600]]');
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height] of cases) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [], requests = [], captures = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
    const nav = name => page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name, exact: true }).click();
    const previewReady = () => page.waitForFunction(() => {
      const scene = window.__depthPreviewScene;
      return scene?.ready && scene.view().actors.every(actor =>
        scene.puppets.get(actor.id)?.asset === actor.cardRpg?.cardId);
    }, null, { timeout: 60000 });
    const capture = async name => {
      await page.locator('.cr-content').evaluate(element => element.scrollTo(0, 0));
      await page.waitForTimeout(250);
      const layout = await page.evaluate(() => {
        const elements = [...document.querySelectorAll('.cr-content button,.cr-content select,.cr-content h1')]
          .filter(element => element.getClientRects().length);
        return { overflow: document.documentElement.scrollWidth - window.innerWidth,
          rightOverflow: elements.filter(element => element.getBoundingClientRect().right > innerWidth + 1).map(element => element.textContent?.slice(0, 80)),
          previewModels: window.__depthPreviewScene?.stats.loaded ?? 0,
          previewCalls: window.__depthPreviewScene?.stats.calls ?? 0,
          previewTriangles: window.__depthPreviewScene?.stats.triangles ?? 0,
          teamCards: [...document.querySelectorAll('.dp-formation-card .dp-cat')].map(element => {
            const rect = element.getBoundingClientRect();
            return { name: element.getAttribute('aria-label'), top: rect.top, bottom: rect.bottom,
              visible: rect.top >= 0 && rect.bottom <= innerHeight };
          }) };
      });
      assert.equal(layout.overflow, 0, `${name} page overflow`);
      assert.equal(layout.rightOverflow.length, 0, `${name} controls overflow`);
      if (name === 'team') assert.ok(layout.teamCards.length === 3 && layout.teamCards.every(card => card.visible),
        `${width} team cards must fit in the first viewport`);
      await page.screenshot({ path: `${output}/${width}-${name}.png` });
      captures.push({ name, ...layout });
    };
    await page.goto('file://' + artifact);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    await previewReady();
    assert.equal(await page.evaluate(() => window.__depthPreviewScene.stats.loaded), 3);
    await capture('cafe');

    await nav('Team & cards');
    assert.equal(await page.locator('.dp-formation-card').count(), 3);
    await page.getByRole('button', { name: 'Save shift 1', exact: true }).click();
    await page.getByRole('combobox', { name: 'Soot row', exact: true }).selectOption('front');
    await page.getByRole('button', { name: 'Use shift 1', exact: true }).click();
    assert.equal(await page.getByRole('combobox', { name: 'Soot row', exact: true }).inputValue(), 'rear');
    const dragged = page.locator('.dp-formation-card').filter({ has: page.getByRole('combobox', { name: 'Clover row', exact: true }) });
    await dragged.dragTo(page.getByRole('region', { name: 'front row drop area' }));
    assert.equal(await page.getByRole('combobox', { name: 'Clover row', exact: true }).inputValue(), 'front');
    await page.getByRole('button', { name: 'Use shift 1', exact: true }).click();
    await page.getByRole('button', { name: 'Best team', exact: true }).click();
    await capture('team');

    await nav('Companions');
    await previewReady();
    assert.equal(await page.locator('.dp-collection-layout .cr-card-grid .dp-cat').count(), 12);
    await page.getByRole('combobox', { name: 'Role', exact: true }).selectOption('healer');
    assert.equal(await page.locator('.dp-collection-layout .cr-card-grid .dp-cat').count(), 3);
    await page.getByRole('combobox', { name: 'Role', exact: true }).selectOption('all');
    await page.getByRole('combobox', { name: 'Collection', exact: true }).selectOption('owned');
    assert.equal(await page.locator('.dp-collection-layout .cr-card-grid .dp-cat').count(), 3);
    await page.getByRole('combobox', { name: 'Collection', exact: true }).selectOption('all');
    await page.locator('.cr-card-grid').getByRole('button', { name: /^Soot,/ }).click();
    await previewReady();
    await page.getByRole('button', { name: 'Pause rotation', exact: true }).click();
    await page.getByRole('slider', { name: 'Angle', exact: true }).press('End');
    const angle = await page.evaluate(() => window.__depthPreviewScene.view().model.angle);
    assert.ok(Math.abs(angle - Math.PI) < .001);
    await capture('collection');
    await page.locator('.dp-preview-skills button').nth(3).click();
    await page.waitForFunction(() => window.__depthPreviewScene.view().frame?.plan.skillId === 'soot-4');
    await capture('skill-preview');

    await nav('Save & settings');
    await page.getByRole('button', { name: 'Unlock all cats and build materials', exact: true }).click();
    await nav('Companions');
    await previewReady();
    await page.getByRole('combobox', { name: 'Rarity', exact: true }).selectOption('legendary');
    assert.ok(await page.locator('.cr-card-grid .dp-card-legendary').count() > 0);
    await capture('legendary-cards');

    await nav('Equipment');
    await previewReady();
    await page.getByRole('combobox', { name: 'Equip for', exact: true }).selectOption('mochi');
    await page.getByRole('combobox', { name: 'Template', exact: true }).selectOption('hearthloom-weapon-rare');
    await page.getByRole('button', { name: 'Craft chosen piece', exact: true }).click();
    const crafted = await page.evaluate(() => window.__depthReview.state.gear.at(-1).id);
    await page.getByRole('combobox', { name: 'Rarity', exact: true }).selectOption('rare');
    await page.locator('.dp-gear-grid button').filter({ hasText: 'Hearthloom' }).first().click();
    const selected = await page.evaluate(() => window.__depthReview.itemId);
    await page.getByRole('button', { name: 'Equip selected', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__depthReview.state.equipment.mochi.weapon), selected);
    await page.getByRole('button', { name: 'Enhance equipment', exact: true }).click();
    assert.equal(await page.evaluate(id => window.__depthReview.state.gear.find(gear => gear.id === id).enhancement, selected), 1);
    await page.getByRole('button', { name: 'Reforge · 90 fish / 15 threads', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__depthReview.error), false);
    await capture('equipment');
    await page.getByRole('button', { name: 'Unequip slot', exact: true }).click();
    await page.getByRole('button', { name: 'Salvage', exact: true }).click();
    assert.equal(await page.evaluate(id => window.__depthReview.state.gear.some(gear => gear.id === id), selected), false);
    for (const name of ['Materials', 'Consumables', 'Collectibles', 'Currencies']) {
      await page.getByRole('button', { name, exact: true }).click();
      await capture(name.toLowerCase());
    }
    await nav('Save & settings');
    await page.getByRole('checkbox', { name: 'Reduced motion', exact: true }).check();
    await nav('Companions');
    await previewReady();
    const reduced = await page.evaluate(() => ({ scene: window.__depthPreviewScene.view().reducedMotion,
      animation: getComputedStyle(document.querySelector('.dp-card-legendary')).animationName,
      foil: getComputedStyle(document.querySelector('.dp-card-legendary'), '::after').animationName }));
    assert.deepEqual(reduced, { scene: true, animation: 'none', foil: 'none' });
    await capture('reduced-motion');
    assert.equal(errors.length, 0);
    assert.equal(requests.length, 0);
    rows.push({ width, height, errors, remoteRequests: requests, crafted, draggedRow: 'front', presetRestored: true,
      filters: true, rotation: angle, equipEnhanceReforgeSalvage: true, reduced, captures });
    console.log(JSON.stringify({ width, height, captures: captures.length, errors }));
    await writeFile(`${output}/checks.json`, JSON.stringify({ artifact,
      sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
      method: 'Real UI navigation, filters, drag/drop, presets, model angle, skill loop and gear transactions. Unlock shortcut grants the explicit review fixture. Screenshots are excluded from performance claims.', rows }, null, 2));
    await page.close();
  }
} finally { await browser.close(); }
