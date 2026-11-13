import {returningGuest} from './review-guest.mjs';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),out=resolve(root,'reports/v3-battle/A5');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await returningGuest(page);await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 await page.evaluate(async()=>{
  const m=window.__depthReview;m.inspect('marigold-4',0);
  const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
  const replacement=['panko','mallow','velvet'];let i=0;
  for(const actor of m.galleryBattle.actors)if(actor.side==='party'&&actor.catalogId!=='marigold'){actor.catalogId=replacement[i++];actor.name=R.CAT_BY_ID[actor.catalogId].name;}
  const extra=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,cats:R.battleCats(m.state),enemies:['button-guard']}).actors.find(a=>a.side==='enemy');
  extra.id='enemy:perf-extra';m.galleryBattle.actors.push(extra);m.paused=true;m.notify(false);
 });
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===8,null,{timeout:90000});await page.evaluate(()=>document.fonts.ready);
 const sources=await page.evaluate(()=>[...window.__depthScene.actors.values()].map(e=>({id:e.asset,source:e.actor.source})));
 const perf=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,start=performance.now();let frames=0,long=0,prev=start;
  await new Promise(resolve=>{const tick=now=>{m.animationAt=(now-start)%3600;s.render({...s.view(),frame:m.frame,fixedTime:10+(now-start)/1000,quality:'high'},1/60);frames++;if(now-prev>25)long++;prev=now;if(now-start<10000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
  return {frames,seconds:(performance.now()-start)/1000,fps:frames/((performance.now()-start)/1000),longFrames:long};
 });
 await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=3200;s.render({...s.view(),frame:m.frame,fixedTime:13.2,quality:'high'},0);});await page.screenshot({path:resolve(out,'eight-rigs-impact.png')});
 const freeze=await page.evaluate(()=>{
  const s=window.__depthScene,m=window.__depthReview,view={...s.view(),frame:null,fixedTime:14,cardStatuses:{}};
  s.render(view,0);const entry=[...s.actors.values()][0],id=[...s.actors.keys()][0],positions=()=>Array.from(entry.actor.mesh.children[0].geometry.attributes.position.array);
  const first=positions();s.render({...view,fixedTime:15,cardStatuses:{[id]:[{id:'freeze'}]}},1);const second=positions();s.render({...view,fixedTime:16,cardStatuses:{[id]:[{id:'freeze'}]}},1);const third=positions();
  return{frozen:first.every((v,i)=>v===second[i])&&second.every((v,i)=>v===third[i]),clock:entry.actor.mesh.proceduralTime};
 });
 await writeFile(resolve(out,'browser-review.json'),JSON.stringify({errors,sources,perf,freeze},null,2)+'\n');console.log(JSON.stringify({errors,sources,perf,freeze}));
 if(errors.length||sources.some(s=>s.source!=='template')||perf.fps<50||!freeze.frozen)process.exitCode=1;
}finally{await browser.close();}
