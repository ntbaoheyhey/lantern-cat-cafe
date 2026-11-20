import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const output = 'reports/cardrpg-big/flow/action-screens';
const artifact = resolve('docs/cardrpg3/index.html');
const rows = [];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
try {
  for (const [width, height] of [[1280, 720], [1440, 900], [1024, 600]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto('file://' + artifact);
    await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
    for (const cat of ['mochi', 'soot', 'clover']) {
      await page.waitForFunction(cat => {
        const model = window.__depthReview;
        return model.plan && model.battle.actors.find(actor => actor.id === model.plan.actorId)?.catalogId === cat
          && model.animationAt > 30 && model.animationAt < 350;
      }, cat, { timeout: 60000 });
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      const id = await page.evaluate(() => window.__depthReview.plan.id);
      for (const phase of ['anticipation', 'impact']) {
        if (phase === 'impact') {
          await page.getByRole('button', { name: 'Resume', exact: true }).click();
          await page.waitForFunction(id => {
            const model = window.__depthReview;
            return model.plan?.id === id && model.impactVisible;
          }, id);
          await page.getByRole('button', { name: 'Pause', exact: true }).click();
        }
        const sample = await page.evaluate(({ cat, phase, id }) => {
          const model = window.__depthReview;
          const battle = model.visualBattle;
          return { cat, phase, id, observedId: model.plan?.id, elapsed: model.animationAt,
            impactStart: model.plan.beats[2].start, skill: model.plan.skillId,
            stageFraction: document.querySelector('.dp-canvas').getBoundingClientRect().height / innerHeight,
            hp: battle.actors.map(actor => {
              const progress = document.querySelector(`progress[aria-label="${actor.name} health"]`);
              return { id: actor.id, expected: actor.hp, dom: progress ? Number(progress.value) : null };
            }), results: document.querySelector('.dp-result-chips')?.textContent ?? '',
            overflow: document.documentElement.scrollWidth > innerWidth };
        }, { cat, phase, id });
        assert.equal(sample.observedId, id);
        assert.equal(sample.overflow, false);
        if (phase === 'anticipation') assert.ok(sample.elapsed < sample.impactStart);
        else { assert.ok(sample.elapsed >= sample.impactStart); assert.ok(sample.results.length > 0); }
        for (const hp of sample.hp) if (hp.expected > 0 || hp.dom !== null) assert.equal(hp.dom, hp.expected);
        const image = `${output}/${width}-${cat}-${phase}.png`;
        await page.screenshot({ path: image });
        rows.push({ width, height, image, ...sample });
      }
      await page.getByRole('button', { name: 'Resume', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Skip to result', exact: true }).click();
    await page.getByRole('button', { name: 'Continue to rewards', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `${output}/${width}-result.png` });
    await page.close();
  }
} finally {
  await writeFile(`${output}/checks.json`, JSON.stringify({ artifact,
    sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'),
    method: 'Normal first encounter with real Watch/Pause/Resume/Skip clicks. Read-only observation selects each starter anticipation and impact. Assert DOM health equals the presentation snapshot. Screenshots stay outside frame-time runs.', rows }, null, 2));
  await browser.close();
}
