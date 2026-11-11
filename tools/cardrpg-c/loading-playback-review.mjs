/** Does a warm scene wait for the current roster before advancing action time? */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),tag='c11-loading-clock-'+(baseline?'before':'after');
const out=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const report={method:'Previously ready, paused practice fixture. Hold one new actor image, start a public playing preview or a controlled replacement encounter, observe 500ms, then release. No acceptance seeds, account progression cohort or frame-time claim.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const kind of ['gallery','battle']){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));
  let release,held=false;const gate=new Promise(r=>release=r),asset=kind==='gallery'?'inkcap':'yarn-giant';
  await page.route(`**/${asset}.png*`,async route=>{if(route.request().resourceType()!=='image')return route.continue();held=true;await gate;await route.continue();});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{const m=window.__depthReview;m.tutorial();m.fight();m.paused=true;m.notify(false);window.loadingOriginal=JSON.stringify(m.tutorialBattle);});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
  await page.evaluate(async kind=>{
   const m=window.__depthReview;
   if(kind==='gallery')m.inspect('inkcap-4',0,true);
   else {const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');m.tutorialBattle=R.createBattle({...m.tutorialBattle.initial,seed:73,enemies:['yarn-giant']});m.plan=null;m.paused=false;m.notify(false);}
   window.loadingPlan=m.plan;window.loadingBattle=JSON.stringify(m.tutorialBattle);
  },kind);
  for(let n=0;n<100&&!held;n++)await page.waitForTimeout(20);if(!held)throw Error('Actor image was not held');
  const before=await page.evaluate(()=>({animationAt:window.__depthReview.animationAt,playbackAt:window.__depthReview.playbackAt,sceneTime:window.__depthScene.time}));
  await page.waitForTimeout(500);
  const heldState=await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;return{sceneReady:s.ready,modelReady:m.sceneReady,loadingVisible:!!document.querySelector('.dp-loading')?.getClientRects().length,animationAt:m.animationAt,playbackAt:m.playbackAt,sceneTime:s.time,planUnchanged:m.plan===window.loadingPlan,battleUnchanged:JSON.stringify(m.tutorialBattle)===window.loadingBattle};});
  const pass=!heldState.sceneReady&&!heldState.modelReady&&heldState.loadingVisible&&heldState.animationAt===before.animationAt&&heldState.playbackAt===before.playbackAt&&heldState.sceneTime===before.sceneTime&&heldState.planUnchanged&&heldState.battleUnchanged;
  if(kind==='gallery'){
   const file=`waiting-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});
  }
  release();await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
  await page.waitForFunction(()=>window.__depthReview.animationAt>0);
  await page.waitForFunction(()=>window.__depthScene.eventAudit.some(e=>e.name==='hit'));
  await page.evaluate(()=>{window.__depthReview.paused=true;window.__depthReview.notify(false);});
  const resumed=await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene;return{sceneReady:s.ready,modelReady:m.sceneReady,animationAt:m.animationAt,loadingVisible:!!document.querySelector('.dp-loading')?.getClientRects().length,hits:s.eventAudit.filter(e=>e.name==='hit').length,overlaps:s.labelAudit.overlaps,original:window.loadingOriginal===JSON.stringify(m.tutorialBattle),sceneError:m.sceneError};});
  const file=`${kind}-resumed-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});
  report.cases.push({width,height,kind,before,held:heldState,resumed,pass});
  if(!baseline&&(!pass||resumed.loadingVisible||resumed.hits!==1||resumed.overlaps||resumed.sceneError||kind==='gallery'&&!resumed.original))throw Error('Loading clock '+JSON.stringify(report.cases.at(-1)));
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,errors:report.errors}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
