/** Browser-only scheduling study: lifecycle, frozen pixels and idle work counts. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
import {installVictoryDemandOverride,hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/V7-F-victory-demand-prototype'));
const modes=(process.env.CXV_VICTORY_MODES??'baseline,demand').split(',');assert(modes.every(mode=>['baseline','demand','native'].includes(mode)));assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));
assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:(modes.every(mode=>mode==='native')?'Native application scheduling on candidate6310; browser-response audit instrumentation only.':'Browser-response scheduling overrides on candidate6310; no application edit.')+' Rule-resolved wave1 result fixture. Captures only outside timing windows. Frozen renderer comparisons are not ordinary gameplay. Historical cpuMs field measures performance.now elapsed instrumented draw duration, not exclusive CPU.',runs:[],errors:[],pass:false};
const backdrop=process.env.CXV_VICTORY_BUFFERED_BACKDROP==='1'?await readFile(resolve(root,'apps/web/public/art/v3-shell/b2/backdrop-garden.webp')):null;
report.bufferedBackdrop=backdrop?{sha256:hash(backdrop),bytes:backdrop.length,method:'Complete original bytes provided before CSS decoding; source-free response buffering to control the proven delivery confound.'}:null;
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
try{
 for(const mode of modes){
  let override;const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{fixedClock:false,setupPage:async page=>{override=await installVictoryDemandOverride(page,{mode});if(backdrop)await page.route('**/backdrop-garden.webp',route=>route.fulfill({status:200,contentType:'image/webp',headers:{'cache-control':'no-store'},body:backdrop}));}});
  const dir=resolve(out,mode);await mkdir(dir,{recursive:true});
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
  await page.evaluate(()=>{const m=window.__depthReview,R=window.__v3a2.R;m.state.settings.reducedMotion=true;R.playBattle(m.battle,'auto');globalThis.__cxvVictoryBattle=structuredClone(m.battle);globalThis.__cxvVictoryLoadDelay=500;m.showResult();});
  await page.waitForSelector('.b3-victory-crew[data-ready=true]');await page.waitForFunction(()=>globalThis.__cxvVictory?.draws>0&&globalThis.__cxvVictory.actors.size===4);
  await page.waitForTimeout(500);
  const run={mode,override,url:page.url(),utc:new Date().toISOString(),cases:[],captures:[],errors,blockedRequests};
  const state=()=>page.evaluate(()=>{const a=globalThis.__cxvVictory;return{draws:a.draws,cpuMs:a.cpuMs,actors:a.actors.size,drawings:a.drawings.size,disposed:a.disposed,width:a.renderer.domElement.width,height:a.renderer.domElement.height,ready:a.element.dataset.ready,loadError:a.element.dataset.loadError};});
  const capture=async name=>{
   const path=resolve(dir,name+'.png'),crewPath=resolve(dir,name+'-crew.png');await page.screenshot({path});await page.locator('.b3-victory-crew').screenshot({path:crewPath});
   const rgb=execFileSync('ffmpeg',['-v','error','-i',crewPath,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
   const row={name,path,crewPath,rgbSha256:hash(rgb),state:await state()};run.captures.push(row);return row;
  };
  await capture('loaded');
  const measure=async(name,ms)=>{const before=await state();await page.waitForTimeout(ms);const after=await state();const row={name,ms,draws:after.draws-before.draws,cpuMs:after.cpuMs-before.cpuMs};run.cases.push(row);return row;};
  const idle=await measure('reduced-steady',5000);if(mode!=='baseline')assert.equal(idle.draws,0);else assert(idle.draws>200);
  await capture('idle');
  await page.locator('.b3-victory-crew').evaluate(e=>{e.style.width='320px';e.style.height='190px';e.style.minHeight='0';});
  await page.waitForFunction(()=>{const a=globalThis.__cxvVictory;return a.renderer.domElement.width===320&&a.renderer.domElement.height===190;});
  await capture('resized');
  await page.locator('.b3-victory-crew').evaluate(e=>{e.style.removeProperty('width');e.style.removeProperty('height');e.style.removeProperty('min-height');});
  await page.waitForTimeout(150);await capture('restored-size');
  const prior=await state();await page.evaluate(()=>globalThis.__cxvVictory.renderer.forceContextLoss());await page.waitForTimeout(250);
  await page.evaluate(()=>globalThis.__cxvVictory.renderer.forceContextRestore());
  await page.waitForFunction(count=>{const a=globalThis.__cxvVictory;return !a.renderer.getContext().isContextLost()&&a.draws>count;},prior.draws);await page.waitForTimeout(250);await capture('restored-context');
  await page.evaluate(()=>{globalThis.__cxvVictoryLoadDelay=0;const m=window.__depthReview;m.state.settings.reducedMotion=false;m.notify(false);});
  await page.waitForFunction(()=>globalThis.__cxvVictory?.draws>0&&globalThis.__cxvVictory.actors.size===4&&!globalThis.__cxvVictory.disposed);await page.waitForTimeout(300);
  const normal=await measure('normal-steady',3000);assert(normal.draws>100);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);const media=await measure('os-reduced-steady',1500);if(mode!=='baseline')assert.equal(media.draws,0);else assert(media.draws>60);
  await capture('os-reduced');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(250);const resumed=await measure('os-normal-resumed',1500);assert(resumed.draws>60);
  for(const at of [1000,1600,2800]){await page.evaluate(at=>globalThis.__cxvVictory.renderAt(at),at);await capture('normal-frozen-'+at);}
  await page.evaluate(()=>{const m=window.__depthReview;m.finish();});await page.waitForTimeout(100);
  const disposed=await page.evaluate(()=>globalThis.__cxvVictoryHistory.map(a=>({draws:a.draws,disposed:a.disposed,connected:a.renderer.domElement.isConnected})));assert(disposed.every(a=>a.disposed&&!a.connected));
  await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>globalThis.__cxvVictoryHistory.map(a=>({draws:a.draws,disposed:a.disposed,connected:a.renderer.domElement.isConnected}))),disposed);
  run.disposed=disposed;
  await page.evaluate(()=>{globalThis.__cxvVictoryLoadDelay=1200;const m=window.__depthReview;m.state.settings.reducedMotion=true;m.tutorialBattle=structuredClone(globalThis.__cxvVictoryBattle);m.showResult();});
  await page.waitForFunction(()=>!globalThis.__cxvVictory.disposed&&globalThis.__cxvVictory.actors.size>=1);
  await page.evaluate(()=>window.__depthReview.finish());await page.waitForTimeout(4000);
  run.pendingUnmount=await state();assert(run.pendingUnmount.disposed&&run.pendingUnmount.actors<4);
  report.runs.push(run);report.errors.push(...errors);await save();await page.close();console.log(JSON.stringify({mode,cases:run.cases,captures:run.captures.length,errors}));
 }
 const oracle=report.runs.length===1?JSON.parse(await readFile(resolve(root,'work/v5/CXV/films/V7-F-victory-demand-prototype/report.json'),'utf8')):null;
 if(oracle){assert(oracle.pass);report.oracle={source:oracle.source,raw:resolve(root,'work/v5/CXV/films/V7-F-victory-demand-prototype/report.json')};report.method+=' Native mode changes no scheduling code in the browser; audit counters only, compared against preserved baseline pixel hashes.';}
 const first=oracle?oracle.runs.find(r=>r.mode==='baseline'):report.runs[0],second=oracle?report.runs[0]:report.runs[1];assert(first.captures.length===second.captures.length);
 report.pixelChecks=first.captures.map((c,i)=>({name:c.name,equal:c.rgbSha256===second.captures[i].rgbSha256,hashes:[c.rgbSha256,second.captures[i].rgbSha256]}));
 report.ended=new Date().toISOString();report.pass=report.pixelChecks.every(p=>p.equal)&&!report.errors.length&&report.runs.every(r=>!r.blockedRequests.length);await save();if(!report.pass)process.exitCode=1;
}catch(error){report.errors.push(String(error));await save();throw error;}finally{await browser.close();}
