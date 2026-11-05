// Three separate normal-clock guest profiles. No fast-forward, grants or outcome injection.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, root, sampleData, openSample, sampleNav } from './gameplay2-support.mjs';
const data = await sampleData(), browser = await chromium.launch(), out = resolve(root, 'reports/gameplay2');
mkdirSync(out, { recursive: true });
try {
  for (const [seed, style] of [[11, 'idle'], [29, 'active'], [47, 'minmax']]) {
    const { page, evidence } = await openSample(browser, data, { state: data.game.createCafe(seed), debug: true, width: 1440, height: 900, motion: 'no-preference' });
    const start = Date.now(), actions = [], timeline = [], samples = [], eventKeys = new Set(); let lastWorkshop = -1, lastMinute = -1, attempts = 0;
    const read = () => page.evaluate(() => window.__cafeDebug.snapshot()); // Read only; all mutations below use visible controls.
    const act = async (name, fn) => {
      const before = await read();
      try { await fn(); const after = await read(); actions.push({ at: (Date.now() - start) / 1000, name, ok: true, changed: JSON.stringify(before) !== JSON.stringify(after) }); }
      catch (e) { actions.push({ at: (Date.now() - start) / 1000, name, ok: false, error: String(e).slice(0, 180) }); }
    };
    console.log(JSON.stringify({ style, seed, start }));
    while (Date.now() - start < 600000) {
      let s = await read(), t = (Date.now() - start) / 1000;
      for (const e of s.events) { const key = JSON.stringify(e); if (!eventKeys.has(key)) { timeline.push({ ...e, observedAt: t }); eventKeys.add(key); } }
      samples.push({ at: t, seconds: s.seconds, chapter: s.chapter, encounters: s.encounters, items: s.inventory.length, patches: s.patches, stats: data.game.cafeStats(s), lastBoss: s.lastBoss, boss: s.boss && { phase: s.boss.phase, elapsed: s.boss.elapsed, hp: s.boss.hp, catHp: s.boss.catHp } });
      if (s.boss) {
        if (style !== 'idle') {
          if (s.boss.stage === 'windup' && s.boss.chosen === null && (style === 'minmax' || s.boss.move % 3 !== 2)) await act('Counter ' + s.boss.counter, () => page.getByRole('region', { name: 'Boss counterplay' }).getByRole('button', { name: new RegExp('^' + s.boss.counter, 'i') }).click());
          if (s.boss.stage === 'recovery' && s.boss.elapsed >= s.boss.pounceAt) await act('Pounce in recovery', () => page.getByRole('button', { name: /^Pounce/ }).click());
        }
      } else {
        if (s.clears.includes(s.chapter) && s.chapter < 5) await act('Open next room', () => page.getByRole('button', { name: /^Explore .* →/ }).click());
        s = await read();
        if (style !== 'idle' && Math.floor(t / 32) > lastWorkshop) {
          lastWorkshop = Math.floor(t / 32); const set = style === 'minmax' ? 'ember' : 'moss';
          const missing = data.game.SLOTS.find(slot => !s.inventory.some(i => i.set === set && i.slot === slot));
          if (missing && s.patches >= data.C.forge.craftCost) await act('Craft missing ' + set + ' ' + missing, async () => {
            await sampleNav(page, 'Workshop'); await page.getByLabel('Set', { exact: true }).selectOption(set); await page.getByLabel('Slot', { exact: true }).selectOption(missing);
            await page.getByRole('button', { name: /^Craft / }).click();
          });
          await act('Choose ' + set + ' kit', async () => { await sampleNav(page, 'Wardrobe'); await page.getByRole('button', { name: new RegExp('^' + set + ' /', 'i') }).click(); });
          s = await read(); const item = s.inventory.filter(i => Object.values(s.equipped).includes(i.id)).sort((a, b) => a.level - b.level)[0];
          const kind = style === 'minmax' ? 'Spark' : 'Steady', cost = style === 'minmax' ? data.C.forge.sparkCost : data.C.forge.steadyCost;
          if (!missing && item.level < data.C.gear.maxLevel && s.patches >= cost) await act(kind + ' stitch', async () => {
            await sampleNav(page, 'Workshop'); await page.getByLabel('Piece to stitch').selectOption(item.id); await page.getByRole('button', { name: new RegExp('^' + kind + ' stitch') }).click();
          });
          await act('Choose mastery', async () => { await sampleNav(page, 'Cafe'); await page.getByRole('button', { name: new RegExp(style === 'minmax' ? '^Brave paws' : '^Warm hearth') }).click(); });
          await sampleNav(page, 'Patrol');
        }
        s = await read();
        if (s.encounter && style !== 'idle') await act('Route choice', () => page.getByRole('button', { name: s.insight < data.C.maxInsight || s.encounter.kind === 'splitter' ? /^Study/ : style === 'minmax' ? /^(Explore|Chase)/ : /^Gather/ }).first().click());
        s = await read();
        if (data.game.bossReady(s) && !s.clears.includes(s.chapter) && (s.lastBoss?.won !== false || Math.floor(t) % 60 === 0)) {
          await act('Attempt room ' + s.chapter + ' boss', () => page.getByRole('button', { name: /^Challenge boss/ }).click()); attempts++;
        }
      }
      const minute = Math.floor(t / 60);
      if (minute > lastMinute) { lastMinute = minute; await page.screenshot({ path: resolve(out, `sample-${style}-${seed}-minute-${minute}.png`) }); }
      writeFileSync(resolve(out, `sample-${style}-${seed}.json`), JSON.stringify({ seed, style, duration: t, clock: 'normal wall clock', method: 'Fresh Sample save; visible UI actions; developer snapshot is read-only; idle only attempts bosses and advances cleared rooms.', actions, timeline, samples, attempts, ...evidence }));
      await page.waitForTimeout(500);
    }
    console.log(JSON.stringify({ style, seed, duration: (Date.now() - start) / 1000, errors: evidence.errors, failedActions: actions.filter(a => !a.ok).length })); await page.close();
  }
} finally { await browser.close(); }
