import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { loadRules } from '../cardrpg-sim/load.mjs';

const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const output = process.env.BIG_GEAR_OUT || 'reports/cardrpg-big/meta/gear';
const angles = [0, -1.1, 1.1];
const minimumVisiblePixels = 8;
const channelThreshold = 8;
const { load, vite } = await loadRules();
let templates, fixtures;
try {
  const rules = await load('packages/game-rules/src/cardrpg/depth/index.ts');
  templates = rules.GEAR;
  fixtures = ['mochi', 'soot', 'clover'].flatMap(cardId => templates.map(template => {
    const state = rules.createDepthAccount(11);
    state.equipment = {};
    state.selectedRelic = null;
    const item = rules.makeGear(state, template.id, 11);
    state.gear = [item];
    state.equipment[cardId] = { [template.slot]: item.id };
    return { cardId, templateId: template.id, state };
  }));
} finally { await vite.close(); }

await mkdir(`${output}/frames`, { recursive: true });
const errors = [], rows = [], captured = new Set();
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  page.on('pageerror', error => errors.push(error.stack ?? String(error)));
  await page.goto('file://' + artifact);
  await page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name: 'Equipment', exact: true }).click();
  await page.getByRole('button', { name: 'Pause rotation', exact: true }).click();
  for (const fixture of fixtures) {
    const template = templates.find(candidate => candidate.id === fixture.templateId);
    await page.evaluate(({ cardId, state }) => {
      const model = window.__depthReview;
      model.state = state;
      model.cardId = cardId;
      model.itemId = state.gear[0].id;
      model.notify(false);
    }, fixture);
    await page.waitForFunction(({ cardId, unique, slot, name }) => {
      const scene = window.__depthPreviewScene;
      if (!scene?.ready) return false;
      const actor = scene.view().actors[0];
      const puppet = actor && scene.puppets.get(actor.id);
      const pieces = puppet?.gear.pieces;
      return actor?.cardRpg?.cardId === cardId && puppet?.asset === cardId && pieces?.length === 1
        && puppet.gear.lastAppearance?.[slot]?.name === name
        && (!unique || pieces[0].group.userData.cardDesign === unique);
    }, { cardId: fixture.cardId, unique: template.unique, slot: template.slot, name: template.name }, { timeout: 60000 });
    const capture = !!template.unique && !captured.has(`${fixture.cardId}-${template.unique}`);
    const samples = [];
    for (const angle of angles) {
      const sample = await page.evaluate(({ angle, channelThreshold, capture }) => {
        const scene = window.__depthPreviewScene;
        const view = scene.view();
        const puppet = scene.puppets.get(view.actors[0].id);
        const pieces = puppet.gear.pieces;
        const fixed = { ...view, frame: null, fixedTime: 10, paused: true, reducedMotion: true,
          model: { ...view.model, angle } };
        scene.render(fixed);
        const width = scene.renderer.domElement.width, height = scene.renderer.domElement.height;
        const context = scene.renderer.getContext();
        const visible = new Uint8Array(width * height * 4);
        context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, visible);
        const visibleImage = capture ? scene.renderer.domElement.toDataURL('image/png') : null;
        for (const piece of pieces) piece.group.visible = false;
        scene.post.render(scene.scene, scene.camera, 0, 0, '#ffe6d2', true);
        const hidden = new Uint8Array(width * height * 4);
        context.readPixels(0, 0, width, height, context.RGBA, context.UNSIGNED_BYTE, hidden);
        const hiddenImage = capture ? scene.renderer.domElement.toDataURL('image/png') : null;
        let changed = 0;
        for (let pixel = 0; pixel < visible.length; pixel += 4) {
          if (Math.max(Math.abs(visible[pixel] - hidden[pixel]), Math.abs(visible[pixel + 1] - hidden[pixel + 1]),
            Math.abs(visible[pixel + 2] - hidden[pixel + 2])) > channelThreshold) changed++;
        }
        for (const piece of pieces) piece.group.visible = true;
        scene.render(fixed);
        return { angle, changed, width, height, socket: pieces[0].group.parent.name,
          design: pieces[0].group.userData.cardDesign ?? null, calls: scene.stats.calls,
          triangles: scene.stats.triangles, visibleImage, hiddenImage };
      }, { angle, channelThreshold, capture });
      if (capture) {
        const name = `${fixture.cardId}-${template.unique}-${angle}`;
        for (const key of ['visibleImage', 'hiddenImage']) {
          const path = `${output}/frames/${name}-${key}.png`;
          await writeFile(path, Buffer.from(sample[key].split(',')[1], 'base64'));
          sample[key] = path;
        }
      }
      samples.push(sample);
    }
    if (capture) captured.add(`${fixture.cardId}-${template.unique}`);
    rows.push({ cardId: fixture.cardId, templateId: template.id, rarity: template.rarity,
      unique: template.unique, slot: template.slot, samples,
      pass: samples.some(sample => sample.changed >= minimumVisiblePixels) });
    await writeFile(`${output}/measurements.json`, JSON.stringify({ artifact,
      minimumVisiblePixels, channelThreshold, angles, errors, rows }, null, 2));
    if (rows.length % 32 === 0) console.log(JSON.stringify({ complete: rows.length, failures: rows.filter(row => !row.pass).length }));
  }
  const summary = { artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
    method: 'Isolated existing-rule equipment fixture in the normal inventory preview. Fixed clock and pose. Per-pixel RGB difference with only the equipped group hidden. At least one of three model angles must meet the declared visibility threshold.',
    minimumVisiblePixels, channelThreshold, angles, cases: rows.length, errors,
    failures: rows.filter(row => !row.pass), captured: [...captured],
    peakCalls: Math.max(...rows.flatMap(row => row.samples.map(sample => sample.calls))),
    peakTriangles: Math.max(...rows.flatMap(row => row.samples.map(sample => sample.triangles))) };
  await writeFile(`${output}/summary.json`, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  assert.equal(errors.length, 0);
  assert.equal(summary.failures.length, 0);
} finally { await browser.close(); }
