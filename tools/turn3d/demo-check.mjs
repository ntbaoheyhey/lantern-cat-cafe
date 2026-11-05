// Real file:// runtime checks. No server, model calls, downloaded art or storage.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch(),rows=[],errors=[],external=[],requests=[],writes=[];
const file=pathToFileURL(resolve('docs/turn3d/index.html')).href;
const build=JSON.parse(await fs.readFile('reports/turn3d/demo-build.json','utf8'));
try{
 for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{requests.push(r.url().slice(0,100));if(!/^(file:|data:|blob:)/.test(r.url()))external.push(r.url())});
  await page.addInitScript(()=>{window.__offlineWrites=[];for(const method of ['setItem','removeItem','clear']){const original=Storage.prototype[method];Storage.prototype[method]=function(...args){window.__offlineWrites.push({method,key:args[0]});return original.apply(this,args)}}});
  await page.goto(file);await page.waitForFunction(()=>window.__turn3dReview?.scene?.stats.loaded>=7);
  const decoded=await page.evaluate(async()=>{const imgs=[...document.images];imgs.forEach(i=>i.loading='eager');await Promise.all(imgs.map(i=>i.decode()));return imgs.length});
  const sizeText=await page.locator('#artifact-size').innerText();assert.equal(Number(sizeText),build.bytes);
  await page.screenshot({path:`reports/turn3d/shots/offline-cover-${width}.png`});
  await page.locator('#play').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));
  await page.getByText('Mochi — your turn',{exact:true}).waitFor();
  const bounds=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelector('canvas').getBoundingClientRect().toJSON(),skills:[...document.querySelectorAll('.t3-skills button')].map(e=>e.getBoundingClientRect().toJSON())}));
  assert.equal(bounds.overflow,false);assert(bounds.canvas.top>=0&&bounds.canvas.bottom<=height);assert(bounds.skills.every(b=>b.top>=0&&b.bottom<=height));
  await page.screenshot({path:`reports/turn3d/shots/offline-play-${width}.png`});
  // Public input must execute the same deterministic rules, not a mock animation.
  await page.keyboard.press('2');await page.getByRole('button',{name:'Target Spool Ram',exact:true}).click();
  await page.getByText('Soot — your turn',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.__turn3dReview.controller.battle.history.at(-1).skillId),'shieldBash');
  assert(await page.evaluate(()=>Object.values(window.__turn3dReview.controller.battle.intents).some(i=>i.interrupted)));
  const row={width,height,decoded,bounds,keyboardBash:true};
  if(width===1280){
   await page.getByRole('button',{name:'Effects',exact:true}).click();
   const effects=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));assert.equal(effects.length,35);
   for(const id of effects){await page.getByLabel('Effect action').selectOption(id);assert.equal(await page.evaluate(()=>window.__turn3dReview.controller.galleryId),id);await page.waitForTimeout(50)}
   await page.getByRole('button',{name:'Miniatures',exact:true}).click();
   const roles=await page.getByLabel('Model',{exact:true}).locator('option').evaluateAll(es=>es.map(e=>e.value));assert.equal(roles.length,12);
   for(const role of roles){await page.getByLabel('Model',{exact:true}).selectOption(role);await page.waitForFunction(role=>!!window.__turn3dReview.scene.scene.getObjectByName(role),role)}
   const clips=await page.getByLabel('Animation clip').locator('option').evaluateAll(es=>es.map(e=>e.value));assert.equal(clips.length,10);
   for(const clip of clips){await page.getByLabel('Animation clip').selectOption(clip);await page.waitForTimeout(80)}
   await page.screenshot({path:'reports/turn3d/shots/offline-models.png'});
   await page.getByRole('button',{name:'Patrol',exact:true}).click();await page.getByLabel('Animation speed').selectOption('4');await page.getByLabel('Auto all cats').check();
   const start=Date.now();await page.getByRole('region',{name:'Encounter result',exact:true}).waitFor({timeout:240000});
   row.campaign=await page.getByRole('region',{name:'Encounter result',exact:true}).innerText();row.campaignWallMs=Date.now()-start;assert(row.campaign.includes('The lantern stays lit.'));
   row.effects=effects.length;row.models=roles.length;row.clips=clips.length;
   await page.screenshot({path:'reports/turn3d/shots/offline-result.png'});
  }
  writes.push(...await page.evaluate(()=>window.__offlineWrites));rows.push(row);await page.close();console.log(JSON.stringify(row));
 }
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual(writes,[]);
}finally{await browser.close();await fs.writeFile('reports/turn3d/demo-check.json',JSON.stringify({date:new Date().toISOString(),runtime:build.runtime,htmlSha256:build.sha256,method:'file://, embedded original GLBs and actual core/UI/renderer; public keyboard input; complete campaign at x4, normal wall clock (not human x1 pacing).',rows,errors,external,writes,requests},null,2)+'\n')}
console.log(JSON.stringify({views:rows.length,external:external.length,writes:writes.length,errors:errors.length}));
