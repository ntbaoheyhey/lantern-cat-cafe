import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,config,openFixture} from './browser-fixture.mjs';

const baseline=process.argv.includes('--baseline'),phase=baseline?'before':'after';
const out=resolve(root,'reports/v3-battle/a2/P10');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const rows=[];
try{
 for(const fixture of config.fixtures)for(const quality of ['high','low']){
  const {page,errors}=await openFixture(browser,fixture,{fixedClock:false});
  const cdp=await page.context().newCDPSession(page),throttle=quality==='low'?4:1;
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:throttle});
  const row=await page.evaluate(async({quality})=>{
   const m=window.__depthReview,s=window.__depthScene;
   m.state.settings.quality=quality;cancelAnimationFrame(s.raf);
   const initial=structuredClone(m.battle),intervals=[],costs=[];
   let previous=performance.now(),start=previous,frames=0,started=false,peakParticles=0,peakGround=0;
   await new Promise(resolve=>{
    const tick=now=>{
     const delta=now-previous;previous=now;const began=performance.now();
     m.paused=false;if(!m.plan&&!m.battle.result)m.step();m.tick(delta,now);m.paused=true;
     s.render({...s.view(),fixedTime:10+(now-start)/1000,quality,paused:true},delta/1000);
     if(now-start>1000&&!started){started=true;intervals.length=0;costs.length=0;frames=0;}
     if(started){intervals.push(delta);costs.push(performance.now()-began);frames++;}
     peakParticles=Math.max(peakParticles,s.effects.field.audit.particles);peakGround=Math.max(peakGround,s.effects.field.audit.groundCount);
     if(now-start<13000)requestAnimationFrame(tick);else resolve();
    };requestAnimationFrame(tick);
   });
   const R=window.__v3a2.R,actual=structuredClone(m.battle);R.playBattle(initial,'auto');R.playBattle(actual,'auto');
   const quantile=(xs,q)=>[...xs].sort((a,b)=>a-b)[Math.min(xs.length-1,Math.floor(xs.length*q))];
   const elapsed=intervals.reduce((a,b)=>a+b,0),images=s.effects.layered.images;
   const pages=new Set([...images.values()].map(image=>image.image??image));
   const decodedPixels=[...pages].reduce((sum,image)=>sum+image.width*image.height,0);
   return {frames,seconds:elapsed/1000,fps:frames/elapsed*1000,p95FrameMs:quantile(intervals,.95),p95RenderMs:quantile(costs,.95),over33ms:intervals.filter(n=>n>33.5).length,units:s.actors.size,stats:{...s.stats},painted:{...s.effects.stats},field:{...s.effects.field.audit},peakParticles,peakGround,texturePages:pages.size,decodedMiB:decodedPixels*4/2**20,atlasEntries:images.size,parity:JSON.stringify(initial)===JSON.stringify(actual)};
  },{quality});
  if(fixture.id==='wave3'){
   await page.evaluate(()=>{const m=window.__depthReview;m.inspect('soot-2',0);window.__depthScene.prepare();});
   await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;s.prepare();return s.ready&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});
   await page.evaluate(quality=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=m.plan.beats[2].start+100;m.paused=true;s.render({...s.view(),quality,fixedTime:20,paused:true},0);},quality);
   await page.screenshot({path:resolve(out,`${phase}-${quality}.png`)});
  }
  rows.push({fixture:fixture.id,quality,cpuThrottle:throttle,...row,errors});
  console.log(`${phase} ${fixture.id} ${quality} CPU${throttle}x: ${row.fps.toFixed(2)} FPS; render p95 ${row.p95RenderMs.toFixed(1)}ms; ${row.texturePages} image pages; parity ${row.parity}`);
  assert.deepEqual(errors,[]);assert.ok(row.parity);
  await page.close();
 }
}finally{await browser.close();}
await writeFile(resolve(out,`${phase}.json`),JSON.stringify({_meta:evidenceMeta(),profile:'1280×720, device scale 1; Chrome CDP 4x CPU slowdown for Low (proxy, not a physical 2019 laptop)',rows},null,2)+'\n');
if(!baseline)for(const row of rows)assert.ok(row.fps>=(row.quality==='low'?30:50),`${row.fixture} ${row.quality}: ${row.fps} FPS`);
