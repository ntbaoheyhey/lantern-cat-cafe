// Verify the shipped file directly: embedded runtime, equipment, galleries and a complete run.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';
const out='reports/turn3d-polish',browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),rows=[],errors=[],external=[],writes=[];
const build=JSON.parse(await fs.readFile(`${out}/demo-build.json`,'utf8'));
try{
 for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(!/^(file:|data:|blob:)/.test(r.url()))external.push(r.url())});
  await page.addInitScript(()=>{window.__writes=[];for(const method of ['setItem','removeItem','clear']){const old=Storage.prototype[method];Storage.prototype[method]=function(...args){window.__writes.push({method,key:args[0]});return old.apply(this,args)}}});
  await page.goto(pathToFileURL(resolve('docs/turn3d-polish/index.html')).href);await page.getByRole('button',{name:'Begin patrol'}).waitFor();
  const decoded=await page.evaluate(async()=>{const imgs=[...document.images];imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.map(i=>i.decode()));return imgs.length});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`${out}/shots/review/offline-cover-${width}.png`});
  await page.locator('#play').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));
  await page.getByRole('button',{name:'Mochi Weapon',exact:true}).click();await page.getByRole('button',{name:'Unequip · empty slot',exact:true}).click();await page.getByRole('button',{name:'Unequip',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__turn3dReview.controller.battle.actors[0].equipment.weapon),undefined);await page.getByRole('button',{name:'Auto-equip best',exact:true}).click();
  await page.screenshot({path:`${out}/shots/review/offline-loadout-${width}.png`});
  await page.getByRole('button',{name:'Begin patrol'}).click();await page.waitForFunction(()=>window.__turn3dReview?.scene?.stats.loaded>=7&&window.__turn3dReview.controller.canChoose);
  await page.locator('#play').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));
  await page.keyboard.press('2');await page.getByRole('button',{name:'Target Spool Ram',exact:true}).click();await page.waitForFunction(()=>window.__turn3dReview.controller.battle.history.some(h=>h.skillId==='shieldBash'));
  await page.screenshot({path:`${out}/shots/review/offline-play-${width}.png`});
  const row={width,height,decoded,equip:true,keyboardBash:true};
  if(width===1280){
   await page.getByRole('button',{name:'Effects',exact:true}).click();const ids=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));assert.equal(ids.length,43);
   for(const id of ids){await page.getByLabel('Effect action').selectOption(id);assert.equal(await page.evaluate(()=>window.__turn3dReview.controller.galleryId),id)}
   await page.getByRole('button',{name:'Miniatures',exact:true}).click();const roles=await page.getByLabel('Model',{exact:true}).locator('option').evaluateAll(es=>es.map(e=>e.value));assert.equal(roles.length,12);
   for(const role of roles){await page.getByLabel('Model',{exact:true}).selectOption(role);await page.waitForFunction(r=>!!window.__turn3dReview.scene.scene.getObjectByName(r),role)}
   const clips=await page.getByLabel('Animation clip').locator('option').evaluateAll(es=>es.map(e=>e.value));assert.equal(clips.length,22);for(const clip of clips)await page.getByLabel('Animation clip').selectOption(clip);
   for(const tier of ['off','starter','high'])await page.getByLabel('Model gear').selectOption(tier);
   const items=await page.locator('#catalog-select option').evaluateAll(es=>es.map(e=>e.value));assert.equal(items.length,30);for(const item of items)await page.locator('#catalog-select').selectOption(item);
   await page.getByRole('button',{name:'Patrol',exact:true}).click();await page.getByRole('button',{name:'Begin patrol'}).click();await page.evaluate(()=>{const c=window.__turn3dReview.controller;c.autoAll(true);c.policy='active'});
   const transitions=[];
   for(let step=0;step<2000;step++){
    const r=await page.evaluate(()=>{const c=window.__turn3dReview.controller;for(let i=0;i<6;i++){c.skip();c.tick(100)}return {stage:c.battle.run.stage,result:c.battle.result,busy:c.presenter.busy}});
    if(r.stage==='loot'&&!r.busy){await page.getByRole('button',{name:/^Keep /}).first().click();transitions.push('loot')}
    if(r.stage==='rest'&&!r.busy){await page.getByRole('button',{name:'Auto-equip best',exact:true}).click();await page.getByRole('button',{name:/Continue patrol|Face the Yarn Giant/}).click();transitions.push('rest')}
    if(r.result){await page.evaluate(()=>{const c=window.__turn3dReview.controller;while(c.presenter.busy)c.skip()});row.result=r.result;row.transitions=transitions;await page.screenshot({path:`${out}/shots/review/offline-summary.png`});break}
    if(step===1999)throw Error('Offline run did not finish');
   }
   assert.equal(transitions.length,6);Object.assign(row,{effects:ids.length,models:roles.length,clips:clips.length,items:items.length});
  }
  writes.push(...await page.evaluate(()=>window.__writes));rows.push(row);await page.close();console.log(JSON.stringify(row));
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(writes,[]);
}finally{await browser.close();await fs.writeFile(`${out}/demo-check.json`,JSON.stringify({date:new Date().toISOString(),runtime:build.runtime,htmlSha256:build.sha256,method:'file:// public equipment/keyboard/gallery controls; full run uses explicit presentation skip, not a human pacing measurement.',rows,errors,external,writes},null,2)+'\n')}
