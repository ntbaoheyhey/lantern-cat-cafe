import {returningGuest} from './review-guest.mjs';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const out=resolve(root,'reports/v3-battle/A2');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await returningGuest(page);await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 await page.evaluate(async()=>{
  const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
  m.state.tutorial=4;m.galleryBattle=R.createBattle({seed:71,chapter:1,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,cats:R.battleCats(m.state),enemies:['button-guard','sock-skipper','teacup-healer','needle-moth']});
  m.galleryBattle.v4.committed=true;m.galleryAction=null;m.watching=true;m.paused=true;m.sceneStarted=true;m.screen='map';m.plan=null;
  const ids=['scald','bitter','drowsy','snag','cozy','brittle','steep','scald'];
  m.galleryBattle.actors.forEach((a,i)=>{a.statuses=[{id:ids[i],stacks:2,remaining:3,source:a.id,appliedRound:1}];a.hp=Math.round(a.maxHp*.7);a.charge=i%2?55:100;});
  m.galleryBattle.actors[0].shield=180;m.notify(false);
 });
 await page.waitForFunction(()=>window.__depthScene?.ready&&document.querySelector('.b3-hud'),null,{timeout:90000});await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:10,paused:true,frame:null},0);});
 await page.waitForTimeout(250);await page.screenshot({path:resolve(out,'statuses-1280.png')});
 const layout=await page.evaluate(()=>({bars:[...document.querySelectorAll('.b3-world')].map(el=>({id:el.dataset.actor,box:el.getBoundingClientRect().toJSON(),visible:!el.hidden})),fonts:[...new Set([...document.querySelectorAll('.b3-hud *')].map(el=>getComputedStyle(el).fontFamily))]}));
 const perf=await page.evaluate(async()=>{
  const s=window.__depthScene;const start=performance.now();let frames=0,previous=start,long=0;
  await new Promise(resolve=>{const tick=now=>{s.render({...s.view(),fixedTime:10+(now-start)/1000,paused:true,frame:null},1/60);frames++;if(now-previous>25)long++;previous=now;if(now-start<10000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
  return {frames,seconds:(performance.now()-start)/1000,fps:frames/((performance.now()-start)/1000),longFrames:long};
 });
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(200);await page.screenshot({path:resolve(out,'statuses-1440.png')});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);await page.screenshot({path:resolve(out,'phone.png')});
 const phone=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('.b3-bottom button')].map(e=>({name:e.getAttribute('aria-label'),box:e.getBoundingClientRect().toJSON()}))}));
 const report={errors,layout,perf,phone};await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({errors,fonts:layout.fonts,perf,phoneOverflow:phone.scroll>phone.width}));
 if(errors.length||perf.fps<50)process.exitCode=1;
}finally{await browser.close();}
