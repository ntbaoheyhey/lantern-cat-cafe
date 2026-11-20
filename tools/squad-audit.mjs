import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, chromium, openSquad, freezeAt } from './squad-support.mjs';
const browser = await chromium.launch(), rows = [], out = resolve(root, 'reports/squad/screens');
mkdirSync(out, { recursive: true });
const axe = readFileSync(process.env.AXE_PATH ?? '/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js', 'utf8');
try {
  for (const [width, height] of [[1280,720], [1440,900], [1920,1080]]) for (const scene of ['patrol','group','boss']) {
    const { page, errors, writes } = await openSquad(browser, { width, height });
    if (scene !== 'patrol') await page.getByRole('button', { name: scene === 'boss' ? 'Yarn Giant' : 'Training', exact:true }).click();
    await page.evaluate(scene => { const r = window.__squadReview;r.controller.reset({ seed: 11, encounter: scene, preset: 'hearthkeepers' }); }, scene);
    await freezeAt(page, scene === 'boss' ? 46500 : 2600);
    await page.addScriptTag({ content: axe });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } })).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })));
    const geometry = await page.evaluate(() => {
      const box = e => { const r=e.getBoundingClientRect();return { x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right }; };
      return { arena:box(document.querySelector('canvas')),ultimates:[...document.querySelectorAll('.sq-ultimate')].map(box),scrollWidth:document.documentElement.scrollWidth,actors:[...window.__squadReview.scene.rigs].filter(([id])=>window.__squadReview.scene.model.actors[id]?.hp>0).map(([id,r])=>({id,x:r.sprite.x,y:r.sprite.y,barY:r.sprite.y-r.sprite.height+12})),living:window.__squadReview.controller.battle.actors.filter(a=>a.hp>0).length };
    });
    await page.screenshot({ path:resolve(out, `${scene}-${width}.png`) });
    rows.push({ scene,width,height,violations,geometry,errors,writes }); await page.close();
  }
  const { page, errors, writes } = await openSquad(browser, { calm: true });
  await freezeAt(page, 2400); await page.screenshot({ path:resolve(out,'calm-1280.png') });
  const before = await page.evaluate(()=>window.__squadReview.controller.battle.time);
  await page.evaluate(()=>{window.__squadReview.controller.running=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(800);
  const after = await page.evaluate(()=>window.__squadReview.controller.battle.time);
  rows.push({scene:'calm-hidden',before,after,errors,writes,method:'Synthetic visibilitychange with document.hidden override; hidden-time delta must be zero.'});await page.close();
} finally { await browser.close(); }
writeFileSync(resolve(root,'reports/squad/accessibility.json'),JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify({views:rows.length,violations:rows.flatMap(r=>r.violations??[]),errors:rows.flatMap(r=>r.errors),writes:rows.flatMap(r=>r.writes)},null,2));
for(const r of rows){assert.deepEqual(r.violations??[],[]);assert.deepEqual(r.errors,[]);assert.deepEqual(r.writes,[]);if(r.geometry){assert(r.geometry.scrollWidth<=r.width);for(const u of r.geometry.ultimates)assert(u.bottom<=r.height);assert(r.geometry.arena.bottom<=r.height);}else assert.equal(r.before,r.after);}
