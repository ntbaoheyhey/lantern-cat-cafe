/** Cold actor removal/return through public preview actions; no progression sample. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const baseline=process.argv.includes('--baseline'),tag='c11-pending-'+(baseline?'before':'after');
const out=resolve(root,'reports/cardrpg-c/shots',tag);await mkdir(out,{recursive:true});
const report={method:'Cold isolated pages: delay only Practice Cushion image, switch public previews before completion; inspect current actors, lane reservations, readiness and disposal. No combat balance or performance claim.',cases:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const mode of ['removed','returned','disposed']){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>report.errors.push(e.message));
  let release,held=false;const gate=new Promise(r=>release=r);
  await page.route('**/practice-cushion.png*',async route=>{if(route.request().resourceType()!=='image')return route.continue();held=true;await gate;await route.continue();});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{const m=window.__depthReview;m.tutorial();m.fight();m.paused=true;m.notify(false);window.pendingPractice=JSON.stringify(m.tutorialBattle);});
  for(let n=0;n<100&&!held;n++)await page.waitForTimeout(20);if(!held)throw Error('Practice Cushion image not intercepted');
  await page.waitForFunction(()=>window.__depthScene?.actors.size>=3);
  await page.evaluate(()=>{window.pendingOldScene=window.__depthScene;window.__depthReview.inspect('inkcap-4',.7);});
  await page.waitForFunction(()=>{const s=window.__depthScene,m=window.__depthReview;return m.visualBattle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId)&&s.actors.size===m.visualBattle.actors.length;});
  const before=await page.evaluate(()=>{
   const s=window.__depthScene;s.prepare(s.view());s.render(s.view(),0);const current=new Set(s.view().actors.map(a=>a.id));
   return{ready:s.ready,modelReady:window.__depthReview.sceneReady,total:s.loading.total,completed:s.loading.completed,current:current.size,pending:s.pending.size,ghostLanes:[...s.lanes.keys()].filter(id=>!current.has(id)),enemyLanes:[...s.actors].filter(([id])=>s.view().actors.some(a=>a.id===id&&a.side==='enemy')).map(([,e])=>e.lane)};
  });
  if(mode==='returned'){
   await page.evaluate(()=>window.__depthReview.closeGallery());
   await page.waitForFunction(()=>{const s=window.__depthScene;return !s.actors.has('foe-0-button-guard')&&s.view().actors.some(a=>a.id==='foe-0-practice-cushion');});
  }else if(mode==='disposed'){
   await page.evaluate(()=>{const m=window.__depthReview;m.closeGallery();m.go('hub');});await page.waitForFunction(()=>!window.__depthScene);
  }
  release();
  if(mode==='disposed'){
   await page.evaluate(()=>window.__depthReview.inspect('inkcap-4',.7));
   await page.waitForFunction(()=>window.__depthScene?.ready);
  }else await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.pending.size===0);
  const after=await page.evaluate(()=>{
   const s=window.__depthScene;s.prepare(s.view());s.render(s.view(),0);const current=new Set(s.view().actors.map(a=>a.id));
   return{ready:s.ready,total:s.loading.total,completed:s.loading.completed,current:current.size,ghostLanes:[...s.lanes.keys()].filter(id=>!current.has(id)),enemyLanes:[...s.actors].filter(([id])=>s.view().actors.some(a=>a.id===id&&a.side==='enemy')).map(([,e])=>e.lane),original:window.pendingPractice===JSON.stringify(window.__depthReview.tutorialBattle),oldDisposed:window.pendingOldScene.disposed,oldActors:window.pendingOldScene.actors.size,oldPending:window.pendingOldScene.pending.size,oldLanes:window.pendingOldScene.lanes.size,canvases:document.querySelectorAll('canvas[data-look-spine]').length,overlaps:s.labelAudit.overlaps};
  });
  const pass=before.ready&&before.total===before.current&&before.completed===before.current&&before.pending===0&&!before.ghostLanes.length&&before.enemyLanes[0]===0&&after.ready&&after.total===after.current&&after.completed===after.current&&!after.ghostLanes.length&&after.enemyLanes[0]===0&&after.original&&after.canvases===1&&!after.overlaps&&(mode!=='disposed'||after.oldDisposed&&after.oldActors===0&&after.oldPending===0&&after.oldLanes===0);
  report.cases.push({width,height,mode,before,after,pass});
  if(mode==='removed'){
   const file=`removed-${width}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(out,file));report.shots.push({file,width,height});
  }
  if(!baseline&&!pass)throw Error('Pending actor lifecycle '+JSON.stringify(report.cases.at(-1)));
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;console.log(JSON.stringify({cases:report.cases.length,failed:report.cases.filter(c=>!c.pass).length,errors:report.errors}));
}catch(error){report.failure=String(error);throw error;}finally{await writeFile(resolve(out,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
