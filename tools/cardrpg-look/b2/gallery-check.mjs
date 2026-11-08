import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from '../lock.mjs';
const artifact=resolve('docs/cardrpg-look/b2.html'),out='reports/cardrpg-look/b2/v6/gallery';await mkdir(out,{recursive:true});const errors=[],rows=[];
await withTimingLock('B2 ready gallery visual review',async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));await page.goto('file://'+artifact);
  await page.getByRole('button',{name:'Battle gallery',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.look-b2-gallery img')].every(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await page.locator('.look-b2-pairs figure').count(),6);assert.equal(await page.locator('.look-b2-ultimates button').count(),12);
  await page.screenshot({path:`${out}/paired-gallery.png`});
  await page.locator('.look-b2-ultimates button').nth(2).click();
  await page.getByLabel('Preview speed',{exact:true}).selectOption('0.25');
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const only of [false,true]){
   await page.getByLabel('Effect only',{exact:true}).setChecked(only);await page.getByRole('button',{name:'Replay',exact:true}).click();
   await page.waitForFunction(()=>{const m=window.__depthReview;return m.plan&&m.animationAt>=m.plan.duration*.60},null,{timeout:30000});
   await page.getByRole('button',{name:'Pause',exact:true}).click();
   await page.screenshot({path:`${out}/${only?'effect-only':'clover-ready'}.png`});
   rows.push(await page.evaluate(()=>({ready:window.__depthScene.ready,id:window.__depthReview.galleryId,speed:window.__depthReview.gallerySpeed,effectOnly:window.__depthReview.galleryEffectOnly,paused:window.__depthReview.paused})));
  }
 }finally{await browser.close()}
});
assert.deepEqual(errors,[]);await writeFile(`${out}/checks.json`,JSON.stringify({sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),rows,errors},null,2));console.log(JSON.stringify({rows,errors}));
