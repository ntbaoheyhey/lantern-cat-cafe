/** Exercise asynchronous backdrop loading in the actual paused battle scene. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const output=resolve(root,'reports/cardrpg-c/shots/c11-stage-loading');await mkdir(output,{recursive:true});
const report={method:'Controlled image delivery in separate reviewer pages; no account progression.',shots:[],checks:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const url='http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1';
async function shot(page,name,width,height){const file=`${width}-${name}.webp`;await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(output,file));report.shots.push({name,width,height,file});}
async function inspect(page){
 await page.evaluate(async()=>{const m=window.__depthReview;m.inspect('mochi-1',-1);const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');m.galleryBattle=R.createBattle({...m.galleryBattle.initial,gameplayV4:true,skillsV5:true,gameplayA6:true});m.state.settings.reducedMotion=true;m.notify(false);});
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
}
try {
 for(const [width,height] of [[1280,720],[1440,900]]) for(const mode of ['delayed','corrupt','disposed']) {
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  let release,corrupt=mode==='corrupt',requests=0;
  const pending=new Promise(resolve=>release=resolve);
  await page.route('**/painted-cafe-c11-v1.webp*',async route=>{
   if(route.request().resourceType()!=='image')return route.continue();requests++;
   if(corrupt)return route.fulfill({status:200,contentType:'image/webp',headers:{'cache-control':'no-store'},body:'deliberately invalid image fixture'});
   if(requests===1)await pending;return route.continue();
  });
  await page.goto(url);await page.waitForFunction(()=>window.__depthReview);await inspect(page);
  if(mode==='corrupt') {
   await page.waitForFunction(()=>window.__depthScene.audit().stage.source==='procedural');
   await shot(page,'decode-fallback',width,height);
   corrupt=false;release();await page.evaluate(()=>{const m=window.__depthReview;m.closeGallery();m.go('hub');});await page.waitForFunction(()=>!window.__depthScene);await inspect(page);
   await page.waitForFunction(()=>window.__depthScene.audit().stage.source==='painted');
   if(requests!==2)throw Error('Failed decode did not retry on next scene');
   await shot(page,'retry-painted',width,height);report.checks.push({mode,width,requests,recovered:true});
  } else {
   const before=await page.evaluate(()=>{
    const s=window.__depthScene;window.loadingScene=s;window.disposedMaps=0;
    for(const t of s.stage.textures)t.addEventListener('dispose',()=>window.disposedMaps++);
    const view=s.view.bind(s);s.view=()=>({...view(),paused:true,reducedMotion:true,frame:null});s.render(s.view(),0);
    return{frames:s.stats.frames,source:s.audit().stage.source,maps:s.stage.textures.map(t=>t.uuid)};
   });
   if(before.source!=='loading')throw Error('Image was not held');
   if(mode==='disposed') {await page.evaluate(()=>{const m=window.__depthReview;m.closeGallery();m.go('hub');});await page.waitForFunction(()=>!window.__depthScene);}
   release();
   if(mode==='disposed') {
    // Another scene shares the pending decode; the old scene must remain disposed.
    await inspect(page);await page.waitForFunction(()=>window.__depthScene.audit().stage.source==='painted');
    const old=await page.evaluate(()=>({source:window.loadingScene.audit().stage.source,disposed:window.loadingScene.disposed,maps:window.disposedMaps,canvases:document.querySelectorAll('canvas[data-look-spine]').length}));
    if(old.source!=='loading'||!old.disposed||old.maps!==3||old.canvases!==1||requests!==1)throw Error('Late decode changed disposed scene '+JSON.stringify(old));
    report.checks.push({mode,width,requests,...old});
   } else {
    await page.waitForFunction(frames=>window.__depthScene.audit().stage.source==='painted'&&window.__depthScene.stats.frames>frames,before.frames);
    const after=await page.evaluate(()=>({frames:window.__depthScene.stats.frames,disposedMaps:window.disposedMaps,stage:window.__depthScene.audit().stage,newMaps:window.__depthScene.stage.textures.map(t=>t.uuid)}));
    if(after.disposedMaps!==3||after.newMaps.some(id=>before.maps.includes(id))||after.stage.offsets.some(x=>x!==0))throw Error('Paused image replacement '+JSON.stringify(after));
    report.checks.push({mode,width,requests,before,after});await shot(page,'paused-painted',width,height);
   }
  }
  if(await page.evaluate(()=>window.__depthScene.labelAudit.overlaps))throw Error('HUD overlap');
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
 console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors}));
} finally {await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
