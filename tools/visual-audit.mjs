// A11y, keyboard and reduced/hidden presentation checks against local candidate fixtures.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, chromium, fixtureData, openView, screens } from './visual-support.mjs';
const base = process.argv[2] ?? 'http://localhost:5381';
const axe = readFileSync(process.env.AXE_PATH ?? '/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js', 'utf8');
const data = await fixtureData(), browser = await chromium.launch(), records = [];
try {
  for (const [width, height] of [[1280,720],[1440,900],[1920,1080]]) for (const screen of screens) {
    const { page, evidence } = await openView(browser, data, { base, screen, width, height });
    await page.addScriptTag({ content: axe });
    await page.clock.resume(); // axe uses timers internally; still captures remain frozen separately.
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
    const keyboard = [];
    for (let i=0; i<8; i++) {
      await page.keyboard.press('Tab');
      keyboard.push(await page.evaluate(() => {
        const e=document.activeElement, r=e.getBoundingClientRect();
        return { tag: e.tagName, name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0,70), visible: r.width>0 && r.height>0 && r.bottom>0 && r.top<innerHeight && r.left>=0 && r.right<=innerWidth+1 };
      }));
    }
    const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    const moving = await page.evaluate(() => document.getAnimations().filter(a => a.playState==='running').length);
    if (reduced) assert.equal(moving, 0, screen + ': reduced motion must be static');
    await page.evaluate(() => { Object.defineProperty(document,'hidden',{ configurable:true, get:()=>true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(100);
    const hiddenMoving = await page.evaluate(() => document.getAnimations().filter(a=>a.playState==='running').length);
    records.push({ ...evidence, violations, keyboard, reduced, moving, hiddenMoving });
    await page.close();
  }
} finally { await browser.close(); }
writeFileSync(resolve(root,'reports/visual/accessibility.json'),'[\n'+records.map(r=>'  '+JSON.stringify(r)).join(',\n')+'\n]\n');
const summary = { views:records.length, axeViolations:records.reduce((n,r)=>n+r.violations.length,0), offscreenFocus:records.flatMap(r=>r.keyboard).filter(k=>!k.visible).length, hiddenMotion:records.filter(r=>r.hiddenMoving>0).length, errors:records.flatMap(r=>r.errors), writes:records.flatMap(r=>r.writes) };
console.log(JSON.stringify(summary));
assert.equal(summary.axeViolations,0);assert.equal(summary.offscreenFocus,0);assert.equal(summary.hiddenMotion,0);assert.deepEqual(summary.errors,[]);assert.deepEqual(summary.writes,[]);
