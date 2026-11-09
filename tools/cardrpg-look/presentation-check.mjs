// Read-only A4 fixture compatibility on the B renderer; no A rules adoption.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { withTimingLock } from './lock.mjs';
const out = process.env.LOOK_OUT || 'reports/cardrpg-look/closure/presentation';
await mkdir(out, { recursive: true });
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg-look/index.html');
const fixtures = await Promise.all(['events', 'boss', 'earned'].map(async name => JSON.parse(await readFile(`tools/cardrpg-look/fixtures/a4-${name}.json`))));
const [crewFixture, bossFixture, earnedFixture] = fixtures;
const receipt = { method: 'Published A version1 fixture events injected into a paused B battle. Checks real UI/rendering, not integrated A combat or invitation wiring.',
  artifact, sha256: createHash('sha256').update(await readFile(artifact)).digest('hex'), rows: [] };
for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
  await withTimingLock(`LOOK closure A4 presentation ${width}x${height}`, async () => {
    const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
    const row = { width, height, errors: [], cues: [] };
    try {
      const page = await browser.newPage({ viewport: { width, height } });
      page.on('pageerror', error => row.errors.push(String(error)));
      await page.goto('file://' + artifact);
      await page.getByRole('button', { name: 'Watch a battle now', exact: true }).click();
      await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await page.waitForFunction(() => window.__depthScene?.ready, null, { timeout: 120000 });
      assert.equal(await page.locator('.dp-charge').count(), 3);
      assert.equal(await page.locator('.dp-v4-plan').count(), 0);
      await page.screenshot({ path: `${out}/${width}-legacy.png` });
      await page.evaluate(fixture => {
        const m = window.__depthReview;
        m.battle.v4 = { version: 1, plan: fixture.initial.plan, events: fixture.events.filter(e => e.kind === 'crew-active') };
        for (const cat of fixture.initial.cats) {
          const actor = m.battle.actors.find(a => a.catalogId === cat.id);
          actor.skills = [...cat.skills]; actor.row = cat.row;
        }
        m.notify(false);
      }, crewFixture);
      await page.getByLabel('Crew and standing plan', { exact: true }).waitFor();
      assert.equal(await page.locator('.dp-charge').count(), 0);
      assert.equal(await page.locator('.dp-v4-readiness').count(), 3);
      assert.match(await page.locator('.dp-v4-plan').innerText(), /Focus support.*Protect the crew/s);
      assert.match(await page.locator('.dp-v4-readiness').first().innerText(), /Front row/);
      row.layout = await page.evaluate(() => {
        const box = s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.right }; };
        return { battle: box('.dp-battle'), arena: box('.dp-arena'), party: box('.dp-party'),
          overflow: document.documentElement.scrollWidth > innerWidth,
          readinessOutsideCards: [...document.querySelectorAll('.dp-v4-readiness')].some(e => {
            const b = e.getBoundingClientRect(), p = e.parentElement.getBoundingClientRect();
            return b.left < p.left - 1 || b.right > p.right + 1 || b.bottom > p.bottom + 1 || b.bottom > innerHeight
              || [...e.children].some(child => child.getBoundingClientRect().bottom > b.bottom + 1);
          }), readinessRows: [...document.querySelectorAll('.dp-v4-readiness>span')].length };
      });
      assert.equal(row.layout.overflow, false); assert.equal(row.layout.readinessOutsideCards, false);
      assert.equal(row.layout.readinessRows, 12);
      await page.screenshot({ path: `${out}/${width}-cooldowns.png` });
      for (const event of bossFixture) {
        const plan = await page.evaluate(event => {
          const m = window.__depthReview;
          while (m.plan) m.finishMoment();
          m.paused = false; m.step(); m.paused = true;
          m.battle.v4.events.push({ ...event, sequence: m.battle.v4.events.length });
          m.notify(false);
          return { impact: m.plan.beats[2].start, duration: m.plan.duration };
        }, event);
        const cue = page.getByLabel('Boss event', { exact: true });
        await page.waitForFunction(() => document.querySelector('.dp-v4-boss-cue')?.hidden);
        await page.evaluate(impact => { const m = window.__depthReview; m.animationAt = impact; m.notify(false); }, plan.impact);
        await cue.waitFor({ state: 'visible' }); assert.equal(await cue.innerText(), event.text);
        await page.screenshot({ path: `${out}/${width}-${event.kind}.png` });
        const stateBefore = await page.evaluate(() => JSON.stringify(window.__depthReview.state));
        await page.getByRole('button', { name: 'Resume', exact: true }).evaluate(button => {
          // Remain paused while observing multiple RAF callbacks: cue cannot consume time.
          button.dataset.pauseProbe = 'true';
        });
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => window.__depthReview.animationAt), plan.impact);
        const end = Math.min(plan.duration, plan.impact + (event.kind === 'boss-phase' ? 400 : 800));
        await page.evaluate(end => { const m = window.__depthReview; m.animationAt = end; m.notify(false); }, end);
        await page.waitForFunction(() => document.querySelector('.dp-v4-boss-cue')?.hidden);
        assert.equal(await page.evaluate(() => JSON.stringify(window.__depthReview.state)), stateBefore);
        row.cues.push({ kind: event.kind, actionDuration: plan.duration, impact: plan.impact, endsAt: end, cueDuration: end - plan.impact, stateUnchanged: true });
      }
      await page.evaluate(() => { window.__depthReview.finishMoment(); window.__depthReview.inspect('sorrel-1', -1); });
      await page.waitForFunction(() => window.__depthReview.battle.actors.every(a => window.__depthScene.puppets.get(a.id)?.asset === a.catalogId));
      row.earned = await page.evaluate(async event => {
        const scene = window.__depthScene, m = window.__depthReview, account = JSON.stringify(m.state);
        const first = await scene.playEntrance(event.itemId, event), startedAt = scene.entrance?.startedAt;
        const repeat = await scene.playEntrance(event.itemId, event);
        const future = await scene.playEntrance(event.itemId, { ...event, version: 2 });
        const mismatch = await scene.playEntrance('mochi', event);
        return { first, repeat, future, mismatch, sameStart: scene.entrance?.startedAt === startedAt,
          count: document.querySelectorAll('.dp-earned-receipt').length, text: document.querySelector('.dp-earned-receipt')?.textContent,
          accountUnchanged: JSON.stringify(m.state) === account };
      }, earnedFixture.events[0]);
      assert.deepEqual(row.earned, { first: true, repeat: true, future: false, mismatch: false, sameStart: true, count: 1, text: earnedFixture.events[0].text, accountUnchanged: true });
      await page.screenshot({ path: `${out}/${width}-earned.png` });
      await page.evaluate(() => { const s = window.__depthScene; s.render({ ...s.view(), fixedTime: s.entrance.startedAt + 2 }); });
      assert.equal(await page.locator('.dp-earned-receipt').isVisible(), false);
      await page.evaluate(async event => {
        const s = window.__depthScene; await s.playEntrance(event.itemId, { ...event, sequence: event.sequence + 10 });
        window.__depthReview.inspect('mochi-1', -1);
      }, earnedFixture.events[0]);
      await page.waitForFunction(() => document.querySelector('.dp-earned-receipt')?.hidden);
      assert.deepEqual(row.errors, []);
      row.passed = true;
    } finally { await browser.close(); receipt.rows.push(row); await writeFile(`${out}/checks.json`, JSON.stringify(receipt, null, 2)); }
  });
}
console.log(JSON.stringify({ sizes: receipt.rows.length, passed: receipt.rows.every(row => row.passed) }));
