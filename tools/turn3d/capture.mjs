import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
import {pinExistingFonts} from '../visual-support.mjs';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await fs.mkdir('reports/turn3d/shots/effects',{recursive:true});
await pinExistingFonts(page);
await page.goto('http://127.0.0.1:5511/?demo&squad=1&squad3d=1&squadDebug=1');await page.waitForFunction(()=>window.__turn3dReview?.scene?.stats.loaded>=7);
await page.evaluate(()=>document.fonts.ready);
// Settle the same fixture before the first capture, including all model loads.
await page.evaluate(()=>window.__turn3dReview.controller.inspect('guardianBasic',0));
await page.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene.stats.loaded===r.controller.presenter.state.actors.length});
await page.waitForTimeout(250);
const ids=await page.evaluate(async()=>Object.keys((await import('/src/game/squad/turn3d/effects.ts')).EFFECT_REGISTRY));const captures=[];
for(const id of ids){
 for(let beat=0;beat<5;beat++){
  await page.evaluate(({id,beat})=>{window.__turn3dReview.controller.inspect(id,beat)}, {id,beat});
  await page.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene.stats.loaded===r.controller.presenter.state.actors.length});
  await page.waitForTimeout(65);await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});await page.waitForTimeout(65);
  const file=`reports/turn3d/shots/effects/${id}-${beat}.png`;const buf=await page.locator('.sq-arena-frame').screenshot({path:file});
  const info=await page.evaluate(()=>{const r=window.__turn3dReview,f=r.controller.frame;return {name:f.plan.name,beat:f.beat.kind,stats:r.scene.stats,seq:r.controller.presenter.appliedSeq}});
  captures.push({id,beat,file,sha256:createHash('sha256').update(buf).digest('hex'),...info});
 }
 console.log(id);
}
// Re-render a known fixture twice; compare exact screenshots, without image transformations.
await page.evaluate(()=>window.__turn3dReview.controller.inspect('lanternstorm',2));await page.waitForTimeout(200);await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});await page.waitForTimeout(80);
const first=await page.locator('.sq-arena-frame').screenshot();await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});await page.waitForTimeout(80);const second=await page.locator('.sq-arena-frame').screenshot();
await fs.writeFile('reports/turn3d/effect-captures.json',JSON.stringify({errors,frames:captures.length,records:'effect-captures.jsonl',exactRepeatEqual:first.equals(second)},null,2));await fs.writeFile('reports/turn3d/effect-captures.jsonl',captures.map(x=>JSON.stringify(x)).join('\n')+'\n');await browser.close();console.log(JSON.stringify({actions:ids.length,frames:captures.length,errors,exactRepeatEqual:first.equals(second)}));
