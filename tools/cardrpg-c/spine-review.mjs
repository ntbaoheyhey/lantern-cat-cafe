/** Isolated, deterministic renderer checks. No account progression or timing claim. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const output=resolve(root,'reports/cardrpg-c/shots/c3');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const report={method:'Deterministic presentation fixtures; no gameplay/timing claim.',shots:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 for(const [width,height] of [[1280,720],[1440,900]]){
  await page.setViewportSize({width,height});
  for(const [name,id] of [['normal','mochi-1'],['boss','enemy:yarn-giant']]){
   await page.evaluate(async id=>{const m=window.__depthReview;m.inspect(id,-1);const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');m.galleryBattle=R.createBattle({...m.galleryBattle.initial,gameplayV4:true,skillsV5:true,gameplayA6:true});m.state.settings.reducedMotion=true;m.notify(false);},id);
   await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady,null,{timeout:90000});
   await page.waitForTimeout(400);
   const audit=await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:3,paused:true,reducedMotion:true},0);return s.audit();});
   await sharp(await page.screenshot()).webp({quality:88}).toFile(resolve(output,`${name}-${width}.webp`));
   report.shots.push({name,width,height,...audit});
   if(audit.renderer!=='spine-threejs')throw Error('Spine adapter not active');
   if(audit.units.some(a=>a.source!=='placeholder'))throw Error('Unexpected fallback '+JSON.stringify(audit.units));
   const cats=audit.units.filter(a=>a.side==='party');
   if(Math.max(...cats.map(a=>a.ratio))/Math.min(...cats.map(a=>a.ratio))>1.08||cats.some(a=>a.ratio<.22))throw Error('Cat size gate');
   if(audit.units.some(a=>a.kind==='boss'&&a.ratio>.55))throw Error('Boss size gate');
   if(audit.labels.overlaps||audit.labels.missing.length)throw Error('HUD clearance '+JSON.stringify(audit.labels));
  }
 }
 report.cache=await page.evaluate(async()=>{const {loadSpineActor}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/cardrpg/spine/assets.ts');const a=await loadSpineActor('mochi'),b=await loadSpineActor('mochi'),fallback=await loadSpineActor('mochi','puppet');const result={sharedData:a.mesh.skeleton.data===b.mesh.skeleton.data,separateStates:a.mesh.state!==b.mesh.state,mix:a.mesh.state.data.defaultMix,fallback:fallback.source};a.dispose();b.dispose();fallback.dispose();return result;});
 if(!report.cache.sharedData||!report.cache.separateStates||report.cache.mix!==.15||report.cache.fallback!=='puppet')throw Error('Asset cache/fallback contract');
 // Cross an authored hit with a large frame, including repeated sample deduplication.
 report.events=await page.evaluate(()=>{const m=window.__depthReview;m.inspect('mochi-1',0);const s=window.__depthScene;s.render({...s.view(),frame:m.frame},0);m.animationAt=m.plan.beats[2].start-1;s.render({...s.view(),frame:m.frame},0);const before=s.eventAudit.length;m.animationAt+=2;s.render({...s.view(),frame:m.frame},0);s.render({...s.view(),frame:m.frame},0);return s.eventAudit.slice(before);});
 if(report.events.filter(e=>e.name==='hit').length!==1)throw Error('Hit must fire exactly once');
 report.reduced=await page.evaluate(()=>{const m=window.__depthReview;m.inspect('soot-3',.4);const s=window.__depthScene;s.render({...s.view(),frame:m.frame,reducedMotion:true},0);return{zoom:s.camera.zoom,x:s.camera.position.x,y:s.camera.position.y};});
 if(report.reduced.zoom!==1||report.reduced.x!==0)throw Error('Reduced motion camera');
 if(report.errors.length)throw Error(JSON.stringify(report.errors));
 console.log(JSON.stringify({shots:report.shots.map(s=>({name:s.name,width:s.width,draws:s.stats.calls,sizes:s.units.map(u=>[u.asset,u.ratio]),labels:s.labels.overlaps})),events:report.events,errors:report.errors}));
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
