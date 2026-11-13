import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,openFixture,config} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/P2');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),rows=[];
try{
 const {page,errors}=await openFixture(browser,config.fixtures[0]);
 const owners=['mochi','soot','clover','panko','biscuit','mallow','sorrel','inkcap','cinnamon','brioche','velvet','marigold'];
 for(const owner of owners){
  await page.evaluate(owner=>{window.__depthReview.inspect(owner+'-4',0);window.__depthScene.prepare();},owner);
  for(let i=0;i<400;i++){
   if(await page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview;s.prepare();return s.ready&&s.actors.size===m.battle.actors.length&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);}))break;
   await page.clock.runFor(34);await new Promise(r=>setTimeout(r,20));if(i===399)throw Error('Loading '+owner);
  }
  const start=await page.evaluate(()=>window.__depthReview.plan.sequence.plate.start),shots=[],takes=[];
  for(let take=0;take<2;take++){
   if(take)await page.evaluate(()=>{const m=window.__depthReview;m.plan=structuredClone(m.plan);});
   for(const seconds of [.4,1.15,1.8]){
    const render=()=>page.evaluate(t=>{const s=window.__depthScene,m=window.__depthReview;m.animationAt=t;s.render({...s.view(),frame:m.frame,fixedTime:10+t/1000,paused:true},0);},start+seconds*1000);
    await render();await page.waitForFunction(()=>document.querySelector('video.b3-plate')?.readyState>=1);
    await render();await page.waitForFunction(seconds=>{const v=document.querySelector('video.b3-plate');return v.readyState>=2&&!v.seeking&&Math.abs(v.currentTime-seconds)<.05;},seconds);
    shots.push(await sharp(await page.locator('.b3-cinema').screenshot()).resize(640,276).png().toBuffer());
    takes.push(await page.evaluate(()=>({...window.__depthScene.cinema.audit,transform:document.querySelector('video.b3-plate').style.transform})));
   }
  }
  assert.ok(takes.slice(0,3).every(t=>t.cameraTake==='original'));
  assert.ok(takes.slice(3).every(t=>t.cameraTake!=='original'));
  const reduced=await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),reducedMotion:true,fixedTime:12,paused:true},0);return document.querySelector('video.b3-plate').style.transform;});
  assert.equal(reduced,'none');
  await sharp({create:{width:1280,height:864,channels:3,background:'#171620'}}).composite([
   {input:Buffer.from(`<svg width="1280" height="36"><text x="12" y="25" fill="white" font-size="18">${owner} — original take</text><text x="652" y="25" fill="white" font-size="18">${takes[3].cameraTake} — alternate take</text></svg>`),left:0,top:0},
   ...shots.map((input,i)=>({input,left:i<3?0:640,top:36+i%3*276}))
  ]).png().toFile(resolve(out,'compare-'+owner+'.png'));
  rows.push({owner,takes,reducedTransform:reduced});console.log(owner+': original / alternate / reduced PASS');
 }
 assert.deepEqual(errors,[]);await writeFile(resolve(out,'metrics.json'),JSON.stringify({_meta:evidenceMeta(),variants:rows.length,rows,errors},null,2)+'\n');
}finally{await browser.close();}
