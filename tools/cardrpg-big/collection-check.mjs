import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const output = process.env.BIG_COLLECTION_OUT || 'reports/cardrpg-big/meta-followup/screens';
const artifacts = [
  ['before', resolve(process.env.BIG_BEFORE || '/tmp/cardrpg-big-g-index.html')],
  ['after', resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html')],
];
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [sample, artifact] of artifacts) {
    const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
    for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const errors = [], requests = [], captures = [];
      page.on('pageerror', error => errors.push(String(error)));
      page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
      const capture = async name => {
        const layout = await page.evaluate(() => {
          const bounds = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
          const controls = document.querySelector('.dp-miniature-controls')?.getBoundingClientRect();
          return {
            panel: bounds('.dp-detail'), canvas: bounds('.dp-miniature-canvas'),
            controls: controls?.toJSON() ?? null,
            controlsVisible: !!controls && controls.top >= 86 && controls.bottom <= innerHeight,
            scrollTop: document.querySelector('.cr-content').scrollTop,
            pageOverflow: document.documentElement.scrollWidth - innerWidth,
            contentOverflow: document.querySelector('.cr-content').scrollWidth - document.querySelector('.cr-content').clientWidth,
            rightOverflow: [...document.querySelectorAll('.cr-content button, .cr-content select')]
              .filter(element => element.getClientRects().length && element.getBoundingClientRect().right > innerWidth + 1)
              .map(element => element.textContent.slice(0, 80)),
            selected: window.__depthReview.cardId,
            renderedModels: [...window.__depthPreviewScene.puppets.values()].map(puppet => puppet.asset),
          };
        });
        const path = `${output}/${sample}-${width}-${name}.png`;
        await page.screenshot({ path });
        captures.push({ name, path, layout });
      };
      await page.goto('file://' + artifact);
      await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor({ timeout: 120000 });
      await page.getByRole('navigation', { name: 'Cafe screens' }).getByRole('button', { name: 'Companions', exact: true }).click();
      assert.equal(await page.locator('.cr-card-grid .dp-cat').count(), 12);
      await page.getByRole('button', { name: /^Soot, common/ }).click();
      await page.waitForFunction(() => {
        const scene = window.__depthPreviewScene;
        return scene?.ready && scene.view().actors.every(actor => scene.puppets.get(actor.id)?.asset === 'soot');
      }, null, { timeout: 60000 });
      await page.waitForTimeout(500);
      await capture('selected');
      await page.getByRole('button', { name: 'Pause rotation', exact: true }).click();
      await page.locator('.dp-preview-skills button').first().click();
      await page.locator('.dp-preview-note').waitFor();
      await capture('skill');
      await page.getByRole('combobox', { name: 'Role', exact: true }).selectOption('healer');
      const roles = await page.locator('.cr-card-grid .cr-card-caption small').allTextContents();
      assert(roles.length > 0 && roles.every(role => role.startsWith('healer')));
      rows.push({ sample, artifact, sha256, width, height, errors, requests, captures, healerCards: roles.length });
      await writeFile(`${output}/checks.json`, JSON.stringify({ method: 'Fresh offline pages, real collection/card/rotation/skill/filter controls. Screenshots are layout evidence. Browser timing is measured separately.', rows }, null, 2));
      console.log(JSON.stringify({ sample, width, captures: captures.map(row => ({ name: row.name, ...row.layout })) }));
      await context.close();
    }
  }
} finally { await browser.close(); }

for (const row of rows) {
  assert.deepEqual(row.errors, []);
  assert.deepEqual(row.requests, []);
  for (const capture of row.captures) {
    assert.equal(capture.layout.pageOverflow, 0);
    assert.equal(capture.layout.contentOverflow, 0);
    assert.deepEqual(capture.layout.rightOverflow, []);
  }
}
const narrow = sample => rows.find(row => row.sample === sample && row.width === 1024).captures[0].layout;
const delta = narrow('after').canvas.width - narrow('before').canvas.width;
assert(delta >= 60, `Narrow canvas gained ${delta}px, below the predeclared60px minimum`);
assert.equal(narrow('after').canvas.height, 300);
assert(narrow('after').controlsVisible, 'Rotation controls should fit after selecting a card');
await writeFile(`${output}/summary.json`, JSON.stringify({ cases: rows.length, screenshots: rows.reduce((sum, row) => sum + row.captures.length, 0), narrowCanvasWidthDelta: delta, narrowControlsVisible: narrow('after').controlsVisible, errors: 0, externalRequests: 0 }, null, 2));
