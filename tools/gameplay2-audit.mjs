// New views, all requested desktops, original image decoding, axe, keyboard and visibility.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, root, sampleData, openSample, sampleNav } from './gameplay2-support.mjs';
const data = await sampleData(), browser = await chromium.launch(), out = resolve(root, 'reports/gameplay2/screens');
mkdirSync(out, { recursive: true });
const axe = readFileSync(process.env.AXE_PATH ?? '/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js', 'utf8'), records = [];
const base = process.argv[2] ?? 'http://127.0.0.1:5391';
const supplemental = process.argv.includes('--results');
try {
  for (const [width, height] of [[1280,720],[1440,900],[1920,1080]]) {
    for (const screen of supplemental ? ['Victory', 'Retry', 'Tour'] : ['Patrol', 'Boss', 'Wardrobe', 'Workshop', 'Journal', 'Cafe', 'Away']) {
      let state = data.game.advanceCafe(data.game.createCafe(29), 140);
      if (screen === 'Boss') state = data.game.actCafe(state, { type: 'fight' });
      if (screen === 'Cafe' || screen === 'Tour') { state.chapter = 3; state.clears = [1,2,3]; }
      if (screen === 'Victory') state = data.game.advanceCafe(data.game.actCafe(state, { type: 'fight' }), 90);
      if (screen === 'Retry') { state.chapter = 2; state.encounters = data.C.bossGate * 2; state = data.game.advanceCafe(data.game.actCafe(state, { type: 'fight' }), 90); }
      const { page, evidence } = await openSample(browser, data, { base, width, height, state, away: screen === 'Away' ? 86400000 : 0 });
      if (!['Patrol', 'Boss', 'Away', 'Victory', 'Retry'].includes(screen)) await sampleNav(page, screen === 'Tour' ? 'Cafe' : screen);
      if (screen === 'Tour') await page.getByRole('button', { name: 'Preview a new tour', exact: true }).click();
      await page.locator('.cafe-shell img').evaluateAll(nodes => Promise.all(nodes.map(n => n.decode())));
      await page.locator('.cafe-sprite').evaluateAll(nodes => Promise.all(nodes.map(n => new Promise((ok, fail) => {
        const image = new Image(); image.onload = ok; image.onerror = fail;
        image.src = getComputedStyle(n).backgroundImage.slice(5, -2);
      }))));
      await page.addScriptTag({ content: axe });
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
      const view = page.getByRole('region', { name: `${['Boss','Away','Victory','Retry'].includes(screen) ? 'Patrol' : screen === 'Tour' ? 'Cafe' : screen} page`, exact: true });
      await view.focus(); const keyboard = [];
      for (let i = 0; i < 160; i++) {
        await page.keyboard.press('Tab'); const focused = await page.evaluate(() => { const e = document.activeElement, r = e.getBoundingClientRect(); return { name: (e.getAttribute('aria-label') || e.textContent).trim().slice(0,80), inSample: !!e.closest('.cafe-shell'), visible: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth }; });
        if (!focused.inSample) break;
        keyboard.push(focused);
      }
      await view.focus();
      await page.locator('.cafe-scroll,.cafe-sidebar,.cafe-patrol').evaluateAll(nodes => nodes.forEach(n => n.scrollTop = 0));
      // Pause only after axe, so its internal timers can run. Synthetic hidden QA is labeled.
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
      const before = await page.evaluate(() => JSON.parse(localStorage.getItem('taskbar-hero:cafe-sample:1')).state.seconds);
      await page.waitForTimeout(1100);
      const after = await page.evaluate(() => JSON.parse(localStorage.getItem('taskbar-hero:cafe-sample:1')).state.seconds);
      const animations = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);
      await page.screenshot({ path: resolve(out, `${screen.toLowerCase()}-${width}.png`) });
      records.push({ screen, ...evidence, violations, overflow, keyboard, hiddenSecondsAdvanced: after - before, reducedRunningAnimations: animations });
      await page.close();
    }
  }
} finally { await browser.close(); }
writeFileSync(resolve(root, `reports/gameplay2/accessibility${supplemental ? '-results' : ''}.json`), JSON.stringify(records, null, 2));
const summary = { views: records.length, violations: records.flatMap(r => r.violations), overflows: records.filter(r => r.overflow).length, offscreenFocus: records.flatMap(r => r.keyboard).filter(k => !k.visible), errors: records.flatMap(r => r.errors), writes: records.flatMap(r => r.writes), hiddenAdvances: records.filter(r => r.hiddenSecondsAdvanced), runningAnimations: records.filter(r => r.reducedRunningAnimations) };
console.log(JSON.stringify(summary, null, 2));
assert.deepEqual(summary.violations, []); assert.equal(summary.overflows, 0); assert.deepEqual(summary.offscreenFocus, []); assert.deepEqual(summary.errors, []); assert.deepEqual(summary.writes, []); assert.deepEqual(summary.hiddenAdvances, []); assert.deepEqual(summary.runningAnimations, []);
