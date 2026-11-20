import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const output = process.env.BIG_SCREEN_OUT || 'reports/cardrpg-big/effects/screens';
const artifact = resolve('docs/cardrpg3/index.html');
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height] of [[1280, 720], [1440, 900], [1024, 600]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    const images = [];
    const capture = async name => {
      const path = `${output}/${width}-${name}.png`;
      await page.screenshot({ path });
      images.push(path);
    };
    await page.goto('file://' + artifact);
    await page.getByRole('button', { name: 'Watch a battle now', exact: true }).waitFor();
    await capture('hub');
    await page.getByRole('button', { name: /Tangled Cafe/ }).click();
    await page.locator('.dp-node:enabled').first().click();
    await capture('prepare');
    await page.getByRole('button', { name: 'Fight', exact: true }).click();
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
    await capture('battle');
    for (const id of ['mochi-4', 'soot-4', 'clover-4', 'enemy:yarn-giant']) {
      await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
      await page.getByLabel('Preview action', { exact: false }).selectOption(id);
      await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
      await page.waitForFunction(() => window.__depthReview.battle.actors.every(actor =>
        window.__depthScene.puppets.get(actor.id)?.asset === actor.catalogId));
      await page.evaluate(() => {
        const model = window.__depthReview;
        const scene = window.__depthScene;
        model.animationAt = model.plan.duration * .6;
        model.notify(false);
        scene.render({ ...scene.view(), frame: model.frame, fixedTime: 10 });
      });
      await capture(id.replace(':', '-'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    await page.getByRole('button', { name: 'Feel lab', exact: true }).click();
    await page.getByRole('button', { name: 'Return to battle', exact: true }).click();
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    await page.getByRole('button', { name: /Continue to rewards|Return to camp/ }).waitFor();
    await capture('result');
    assert.deepEqual(errors, []);
    rows.push({ width, height, images, errors });
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/checks.json`, JSON.stringify({
    artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
    method: 'Real UI clicks through hub, Prepare, Fight, Pause, gallery and result. Paused gallery frames use a fixed progress0.6 and time10 for reproducible screenshots. No frame-time claims use screenshots.',
    rows,
  }, null, 2));
}
