/** Retained-page native fallback controls and real context-loss recovery. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {hash,victoryModule} from './victory-demand-source.mjs';
import {installVictoryContextPrototype,victoryContextSource} from './victory-context-source.mjs';

const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CONTEXT_INPUT??resolve(root,'work/v5/CXV/films/V7-E-victory-context-prototype'));assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));await mkdir(out,{recursive:true});
const original=await readFile(resolve(root,victoryModule),'utf8'),candidate=victoryContextSource(original);await writeFile(resolve(out,'candidate-VictoryCrew.tsx'),candidate);
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),url:'http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3',viewport:{width:1280,height:720},
 baselineModuleSha256:hash(original),candidateModuleSha256:hash(candidate),method:'Browser-response prototype only; same retained result/decoded background. Real WEBGL_lose_context events. Native control exposes existing fallback with its data-ready flag while lost. Compare loaded/fallback/restored full-frame RGB exactly at fixed750ms normal pose or native reduced pose. Separate real-RAF lifecycle covers resize,density,motion and cleanup; no speedup or hardware-incidence claim.',runs:[],captures:[],reviewGroups:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
report.toolSnapshots=[];
for(const name of ['probe-victory-context-prototype.mjs','victory-context-source.mjs','victory-demand-source.mjs','browser-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);report.toolSnapshots.push({name,sha256:hash(bytes)});}
const backdrop=await readFile(resolve(root,'apps/web/public/art/v3-shell/b2/backdrop-garden.webp'));
const state=page=>page.evaluate(()=>{const a=globalThis.__cxvVictory,e=a.element,c=a.renderer.domElement,f=e.querySelector('.b3-victory-fallback');return{ready:e.dataset.ready??null,drawn:e.dataset.drawn??null,contextLost:a.renderer.getContext().isContextLost(),draws:a.draws,rect:e.getBoundingClientRect().toJSON(),canvas:{width:c.width,height:c.height},ratio:a.renderer.getPixelRatio(),fallbackVisible:getComputedStyle(f).visibility==='visible',actors:[...a.actors].map(([i,x])=>({i,position:x.root.position.toArray(),scale:x.root.scale.toArray(),rotation:x.root.rotation.toArray()})),battle:window.__depthReview.battle};});
const capture=async(page,cdp,mode,name)=>{
 const before=await state(page),path=resolve(out,mode+'-'+name+'.png'),dpr=await page.evaluate(()=>devicePixelRatio);
 const bytes=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/dpr}})).data,'base64');assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);await writeFile(path,bytes);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
 const row={mode,name,path,utc:new Date().toISOString(),sha256:hash(bytes),rgbSha256:hash(rgb),before,after:await state(page)};report.captures.push(row);return row;
};
try{
 for(const reduced of [false,true]){
  const mode=reduced?'reduced':'normal';let override;
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{fixedClock:false,setupPage:async p=>{
   await p.addInitScript(()=>{Math.random=()=>.5;globalThis.__cxvContextEnabled=false;});override=await installVictoryContextPrototype(p);
   for(const origin of ['https://fonts.googleapis.com/**','https://fonts.gstatic.com/**'])await p.route(origin,route=>{assert.equal(route.request().method(),'GET');return route.continue();});
   await p.route('**/backdrop-garden.webp',route=>route.fulfill({status:200,contentType:'image/webp',body:backdrop}));
  }});
  const cdp=await page.context().newCDPSession(page);
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
  await page.evaluate(reduced=>{const m=window.__depthReview;window.__v3a2.R.playBattle(m.battle,'auto');m.state.settings.reducedMotion=reduced;m.showResult();},reduced);
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForFunction(()=>globalThis.__cxvVictory?.draws>0);await page.waitForTimeout(500);
  await page.evaluate(()=>{for(const a of document.getAnimations())a.pause();const a=globalThis.__cxvVictory;a.renderAt(1750);a.lossExtension=a.renderer.getContext().getExtension('WEBGL_lose_context');a.losses=0;a.restores=0;a.renderer.domElement.addEventListener('webglcontextlost',()=>a.losses++);a.renderer.domElement.addEventListener('webglcontextrestored',()=>a.restores++);});
  const lose=async()=>{const count=await page.evaluate(()=>{const a=globalThis.__cxvVictory;a.lossExtension.loseContext();return a.losses;});await page.waitForFunction(count=>globalThis.__cxvVictory.losses>count,count);};
  const restore=async()=>{const count=await page.evaluate(()=>{const a=globalThis.__cxvVictory;a.lossExtension.restoreContext();return a.restores;});await page.waitForFunction(count=>globalThis.__cxvVictory.restores>count,count);await page.waitForTimeout(150);};
  const controls=[],rows=[];
  for(const variant of ['control','prototype']){
   const first=report.captures.length;await page.evaluate(variant=>{globalThis.__cxvContextEnabled=variant==='prototype';globalThis.__cxvVictory.renderAt(1750);},variant);
   const loaded=await capture(page,cdp,mode,variant+'-loaded');assert(loaded.after.ready==='true'&&!loaded.after.fallbackVisible);
   await lose();const naturalLost=await state(page);assert(naturalLost.contextLost);assert.equal(naturalLost.fallbackVisible,variant==='prototype');
   if(variant==='control')await page.evaluate(()=>{const a=globalThis.__cxvVictory;a.element.dataset.ready='false';a.renderer.domElement.style.visibility='hidden';});
   const fallback=await capture(page,cdp,mode,variant+'-fallback');assert(fallback.after.fallbackVisible);
   assert.equal(await page.evaluate(()=>getComputedStyle(globalThis.__cxvVictory.renderer.domElement).visibility),'hidden');
   assert(await page.evaluate(()=>[...globalThis.__cxvVictory.element.querySelectorAll('.b3-victory-fallback img')].every(i=>i.complete&&i.naturalWidth>100&&i.getBoundingClientRect().width>0)));
   if(variant==='control')await page.evaluate(()=>{globalThis.__cxvVictory.element.dataset.ready='true';});
   await restore();await page.evaluate(variant=>{const a=globalThis.__cxvVictory;a.renderAt(1750);if(variant==='control')a.renderer.domElement.style.visibility='';},variant);
   const recovered=await capture(page,cdp,mode,variant+'-restored');assert(!recovered.after.contextLost&&recovered.after.ready==='true'&&!recovered.after.fallbackVisible);
   assert.equal(await page.evaluate(()=>getComputedStyle(globalThis.__cxvVictory.renderer.domElement).visibility),'visible');
   const shots=[loaded,fallback,recovered];
   if(variant==='control')controls.push(...shots);else for(const [i,shot]of shots.entries()){
    assert.equal(shot.rgbSha256,controls[i].rgbSha256,'Exact native fallback/loaded/restored RGB');
    for(const key of ['rect','canvas','actors','battle'])assert.deepEqual(shot.after[key],controls[i].after[key]);
    rows.push({phase:['loaded','fallback','restored'][i],nativeRgbExact:true,geometryAndRulesExact:true,control:controls[i].path,prototype:shot.path});
   }
   report.reviewGroups.push([first,first+1,first+2]);
  }
  await page.evaluate(()=>globalThis.__cxvVictory.requestDraw());await page.waitForTimeout(200);
  await lose();const lost=await state(page);await page.waitForTimeout(200);const idle=await state(page);assert.equal(idle.draws,lost.draws);
  await page.evaluate(()=>{const a=globalThis.__cxvVictory;a.element.style.width=a.element.clientWidth+17+'px';});
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:2,mobile:false});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);const changedLost=await state(page);assert.equal(changedLost.draws,lost.draws);assert(changedLost.fallbackVisible);
  await restore();const recovered=await state(page);assert.equal(recovered.draws,lost.draws+1);assert.equal(recovered.ratio,1.5);assert.equal(recovered.ready,'true');
  assert.equal(recovered.canvas.width,Math.floor(recovered.rect.width*1.5));assert.equal(recovered.canvas.height,Math.floor(recovered.rect.height*1.5));
  await page.waitForTimeout(200);assert.equal((await state(page)).draws,recovered.draws);
  await lose();await page.evaluate(()=>{globalThis.__cxvOldVictory=globalThis.__cxvVictory;const m=window.__depthReview;m.screen='map';m.notify(false);});
  await page.waitForFunction(()=>globalThis.__cxvOldVictory.disposed);
  const cleanup=await page.evaluate(()=>{const a=globalThis.__cxvOldVictory,before=a.draws;a.contextLostHandler(new Event('webglcontextlost'));a.contextRestored();a.requestDraw();a.renderAt(1750);return{before,after:a.draws,disposed:a.disposed,connected:a.renderer.domElement.isConnected};});assert.equal(cleanup.after,cleanup.before);assert(cleanup.disposed&&!cleanup.connected);
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push({mode,override,rows,lifecycle:{lostDraws:idle.draws-lost.draws,notificationsWhileLostDraws:changedLost.draws-lost.draws,restoredDraws:recovered.draws-lost.draws,latestDensity:recovered.ratio,cleanup},errors,blockedRequests});await page.close();
 }
 report.pass=true;
}catch(error){report.failure=String(error);throw error;}
finally{report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({out,pass:report.pass,captures:report.captures.length,exactPairs:report.runs.reduce((n,r)=>n+r.rows.length,0)}));
