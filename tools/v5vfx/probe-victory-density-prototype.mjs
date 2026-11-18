/** Retained-page exact native-API controls and nonpolling outcome-density lifecycle. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {hash,victoryModule} from './victory-demand-source.mjs';
import {installVictoryDensityPrototype,victoryDensitySource} from './victory-density-source.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_VICTORY_DENSITY_OUT??resolve(root,'work/v5/CXV/films/V7-E-victory-density-prototype'));assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));await mkdir(out,{recursive:true});
const original=await readFile(resolve(root,victoryModule),'utf8'),candidate=victoryDensitySource(original);await writeFile(resolve(out,'candidate-VictoryCrew.tsx'),candidate);
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),url:'http://127.0.0.1:6310/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3',viewport:{width:1280,height:720},
 baselineModuleSha256:hash(original),candidateModuleSha256:hash(candidate),method:'Browser-response prototype only. Rule-resolved result, same retained page and decoded assets for native renderer-API control and candidate; exact same capped-density sequence and preconditioning. Normal pose fixed at750ms; reduced native static pose. Full1280x720 RGB and geometry compared exactly. Live lifecycle uses real RAF; explicit synthetic resolution change events exercise handlers because CDP delivered zero native media events. No physical monitor or production-performance claim.',runs:[],captures:[],reviewGroups:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const backdrop=await readFile(resolve(root,'apps/web/public/art/v3-shell/b2/backdrop-garden.webp'));
const capture=async(page,cdp,mode,name)=>{
 const before=await page.evaluate(()=>({dpr:devicePixelRatio,sets:[...globalThis.__cxvVictory.ratioSets]})),path=resolve(out,mode+'-'+name+'.png');
 const bytes=Buffer.from((await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false,clip:{x:0,y:0,width:1280,height:720,scale:1/before.dpr}})).data,'base64');assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);await writeFile(path,bytes);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
 const after=await page.evaluate(()=>({dpr:devicePixelRatio,sets:[...globalThis.__cxvVictory.ratioSets]}));assert.deepEqual(after,before);
 const row={mode,name,path,utc:new Date().toISOString(),sha256:hash(bytes),rgbSha256:hash(rgb)};report.captures.push(row);return row;
};
const geometry=page=>page.evaluate(()=>{const a=globalThis.__cxvVictory;return{rect:a.element.getBoundingClientRect().toJSON(),actors:[...a.actors].map(([i,x])=>({i,bounds:x.bounds,position:x.root.position.toArray(),scale:x.root.scale.toArray(),rotation:x.root.rotation.toArray()})),battle:window.__depthReview.battle};});
try{
 for(const initial of [1,2])for(const reduced of [false,true]){
  const mode=initial+'-'+(reduced?'reduced':'normal');let override;
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{fixedClock:false,setupPage:async p=>{
   await p.addInitScript(()=>{Math.random=()=>.5;globalThis.__cxvEnableDensity=false;});override=await installVictoryDensityPrototype(p);
   // The generic development fixture blocks external resources; permit only the
   // existing page's read-only font origins, as the native production fixture does.
   for(const origin of ['https://fonts.googleapis.com/**','https://fonts.gstatic.com/**'])await p.route(origin,route=>{assert.equal(route.request().method(),'GET');return route.continue();});
   await p.route('**/backdrop-garden.webp',route=>route.fulfill({status:200,contentType:'image/webp',body:backdrop}));
  }});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:initial,mobile:false});
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
  await page.evaluate(reduced=>{const m=window.__depthReview;window.__v3a2.R.playBattle(m.battle,'auto');m.state.settings.reducedMotion=reduced;m.showResult();},reduced);
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForFunction(()=>globalThis.__cxvVictory?.draws>0);await page.waitForTimeout(500);
  await page.evaluate(()=>{for(const a of document.getAnimations())a.pause();globalThis.__cxvVictory.renderAt(1750);});
  const first=report.captures.length,sequence=initial===1?[1,2,1.5,1]:[2,1,1.5,2],controls=[],rows=[];let origin;
  for(const variant of ['control','prototype']){
   await page.evaluate(({initial,variant})=>{const a=globalThis.__cxvVictory;globalThis.__cxvEnableDensity=false;a.renderer.setPixelRatio(initial===1?1.5:1);a.renderer.setPixelRatio(Math.min(initial,1.5));a.renderAt(1750);globalThis.__cxvEnableDensity=variant==='prototype';},{initial,variant});
   for(const [step,ratio]of sequence.entries()){
    await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:ratio,mobile:false});
    await page.evaluate(({variant,ratio})=>{const a=globalThis.__cxvVictory;if(variant==='control'&&a.renderer.getPixelRatio()!==Math.min(ratio,1.5))a.renderer.setPixelRatio(Math.min(ratio,1.5));a.renderAt(1750);},{variant,ratio});
    const g=await geometry(page);if(!origin)origin=g;assert.deepEqual(g,origin);
    const state=await page.evaluate(()=>{const a=globalThis.__cxvVictory,c=a.renderer.domElement;return{ratio:a.renderer.getPixelRatio(),width:a.element.clientWidth,height:a.element.clientHeight,canvas:{width:c.width,height:c.height}};});
    assert.equal(state.ratio,Math.min(ratio,1.5));assert.deepEqual(state.canvas,{width:Math.floor(state.width*state.ratio),height:Math.floor(state.height*state.ratio)});
    const shot=await capture(page,cdp,mode,variant+'-'+step);
    if(variant==='control')controls.push(shot);else{assert.equal(shot.rgbSha256,controls[step].rgbSha256,'Matched native buffer history differs');rows.push({step,ratio,state,geometryExact:true,nativeRgbExact:true,control:controls[step].path,prototype:shot.path});}
   }
  }
  report.reviewGroups.push([first,first+3,first+4,first+7]);
  const before=await page.evaluate(()=>{const a=globalThis.__cxvVictory;return{draws:a.draws,sets:a.ratioSets.length};});
  const changed=initial===1?2:1;
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:changed,mobile:false});
  await page.evaluate(()=>{const a=globalThis.__cxvVictory;for(let i=0;i<3;i++)a.resolutionQuery().dispatchEvent(new Event('change'));});
  await page.waitForTimeout(250);
  const after=await page.evaluate(()=>{const a=globalThis.__cxvVictory;return{draws:a.draws,sets:a.ratioSets.length,ratio:a.renderer.getPixelRatio()};});
  assert.equal(after.ratio,Math.min(changed,1.5));assert.equal(after.sets-before.sets,1);if(reduced)assert.equal(after.draws-before.draws,1);else assert(after.draws-before.draws>=3);
  const settled=await page.evaluate(()=>{const a=globalThis.__cxvVictory;a.renderAt(1750);return{draws:a.draws,sets:a.ratioSets.length};});
  await page.waitForTimeout(250);const idle=await page.evaluate(()=>({draws:globalThis.__cxvVictory.draws,sets:globalThis.__cxvVictory.ratioSets.length}));assert.deepEqual(idle,settled);
  await page.evaluate(()=>{globalThis.__cxvOldVictory=globalThis.__cxvVictory;const m=window.__depthReview;m.screen='map';m.notify(false);});
  await page.waitForFunction(()=>globalThis.__cxvOldVictory.disposed);
  const cleanup=await page.evaluate(()=>{const a=globalThis.__cxvOldVictory,before={draws:a.draws,sets:a.ratioSets.length};a.notifyDensity();a.requestDraw();a.renderAt(1750);a.resolutionQuery().dispatchEvent(new Event('change'));return{before,after:{draws:a.draws,sets:a.ratioSets.length},disposed:a.disposed,connected:a.renderer.domElement.isConnected};});assert.deepEqual(cleanup.after,cleanup.before);assert(cleanup.disposed&&!cleanup.connected);
  assert.deepEqual(errors,[]);assert.deepEqual(blockedRequests,[]);report.runs.push({mode,initial,reduced,override,rows,lifecycle:{coalescedDraws:after.draws-before.draws,ratioSets:after.sets-before.sets,idle,cleanup},errors,blockedRequests});await page.close();
 }
 report.pass=true;
}catch(error){report.failure=String(error);throw error;}
finally{report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({out,pass:report.pass,captures:report.captures.length,exactPairs:report.runs.reduce((n,r)=>n+r.rows.length,0)}));
