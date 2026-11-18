/** Inject only WebGL2 constructor failure across an actual result effect restart. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {runtimeEvidence as localEvidence} from './runtime-evidence.mjs';
const root=resolve(import.meta.dirname,'../..'),integration='/Users/bao/taskbar-hero-chain';
const production=process.env.CXV_PRODUCTION==='1',prototype=process.env.CXV_FALLBACK_PROTOTYPE==='1';assert(!(production&&prototype));
const initialReduced=process.env.CXV_FALLBACK_START_REDUCED==='1',expectPass=process.env.CXV_FALLBACK_EXPECT_PASS==='1';
const fixture=await import(production?integration+'/tools/v5int/production-fixture.mjs':'./browser-fixture.mjs');
const {chromium,config,openFixture}=fixture;
const out=resolve(process.env.CXV_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/V7-E-victory-fallback-baseline'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(out));await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...(production?fixture.runtimeEvidence():localEvidence()),production,prototype,viewport:{width:1280,height:720},method:'Seeded wave1 rule-resolved result; inject new WebGL2 context creation failure only while changing reduced-motion preference. Restore method and toggle back, then check a fresh failed mount. Failure frequency and ordinary gameplay performance are not measured. Source identity and any browser-response override are recorded separately.',override:[],captures:[],harnessCompleted:false};
report.initialReduced=initialReduced;report.expectPass=expectPass;report.componentSha256=hash(await readFile(resolve(root,'apps/web/src/game/cardrpg/battle-v3/VictoryCrew.tsx')));report.harnessSha256=hash(await readFile(import.meta.filename));
await writeFile(resolve(out,'harness.mjs'),await readFile(import.meta.filename));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{fixedClock:false,setupPage:prototype?async page=>{
  await page.route('**/VictoryCrew.tsx*',async route=>{
   const response=await route.fetch(),before=await response.text();
   const pattern=/const element = host.current;/;assert.equal([...before.matchAll(new RegExp(pattern,'g'))].length,1);
   const after=before.replace(pattern,'$&\n delete element.dataset.ready; delete element.dataset.drawn; delete element.dataset.loadError;');
   report.override.push({url:route.request().url(),beforeSha256:hash(before),afterSha256:hash(after)});await route.fulfill({response,body:after});
  });
 }:undefined});
 report.url=page.url();report.browser=browser.version();const consoleErrors=[],unhandledPageErrors=[];page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});page.on('pageerror',e=>unhandledPageErrors.push(e.message));
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
 if(production){
  const {loadRules}=await import(integration+'/tools/cardrpg-big/a4-load.mjs'),modules=await loadRules();
  try{const R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts'),battle=await page.evaluate(()=>window.__depthReview.battle);R.playBattle(battle,'auto');assert.equal(battle.result,'party');await page.evaluate(({battle,reduced})=>{const m=window.__depthReview;m.tutorialBattle=battle;m.state.settings.reducedMotion=reduced;m.showResult();},{battle,reduced:initialReduced});}finally{await modules.vite.close();}
 }else await page.evaluate(reduced=>{const m=window.__depthReview,R=window.__v3a2.R;R.playBattle(m.battle,'auto');m.state.settings.reducedMotion=reduced;m.showResult();},initialReduced);
 const ready=()=>page.waitForSelector('.b3-victory-crew[data-ready=true] canvas',{timeout:60000});
 const capture=async name=>{
  await page.waitForFunction(()=>[...document.querySelectorAll('.b3-victory-fallback img')].every(i=>i.complete&&i.naturalWidth>0));
  const state=await page.locator('.b3-victory-crew').evaluate(e=>{const f=e.querySelector('.b3-victory-fallback'),s=getComputedStyle(f),r=f.getBoundingClientRect();return{ready:e.dataset.ready??null,drawn:e.dataset.drawn??null,loadError:e.dataset.loadError??null,canvases:e.querySelectorAll('canvas').length,fallback:{visibility:s.visibility,display:s.display,opacity:s.opacity,width:r.width,height:r.height,visible:s.visibility==='visible'&&s.display!=='none'&&Number(s.opacity)>0&&r.width>0&&r.height>0},images:[...f.querySelectorAll('img')].map(i=>({complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,src:i.currentSrc})),injectedCalls:globalThis.__cxvFailedContexts??0};});
  const path=resolve(out,name+'.png'),utc=new Date().toISOString();await page.screenshot({path});report.captures.push({name,path,utc,state});return state;
 };
 await ready();await page.waitForTimeout(200);await capture('loaded');
 await page.evaluate(initialReduced=>{
  const original=HTMLCanvasElement.prototype.getContext;globalThis.__cxvRestoreContext=()=>{HTMLCanvasElement.prototype.getContext=original;};globalThis.__cxvFailContext=true;globalThis.__cxvFailedContexts=0;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){if(globalThis.__cxvFailContext&&(kind==='webgl2'||kind==='webgl'||kind==='experimental-webgl')){globalThis.__cxvFailedContexts++;return null;}return original.call(this,kind,...args);};
  const m=window.__depthReview;m.state.settings.reducedMotion=!initialReduced;m.notify(false);
 },initialReduced);
 await page.waitForFunction(initialReduced=>globalThis.__cxvFailedContexts>0&&document.querySelector('.c2-result')?.dataset.reduced===String(!initialReduced),initialReduced);await page.waitForTimeout(100);
 const restarted=await capture('restart-failed');assert.equal(restarted.canvases,0);assert(restarted.injectedCalls>0);
 await page.evaluate(initialReduced=>{globalThis.__cxvFailContext=false;const m=window.__depthReview;m.state.settings.reducedMotion=initialReduced;m.notify(false);},initialReduced);
 await ready();await page.waitForTimeout(200);const recovered=await capture('recovered');assert.equal(recovered.canvases,1);assert.equal(recovered.fallback.visible,false);
 await page.evaluate(()=>{const m=window.__depthReview;m.screen='map';m.notify(false);});await page.waitForSelector('.b3-victory-crew',{state:'detached'});
 await page.evaluate(()=>{globalThis.__cxvFailContext=true;window.__depthReview.showResult();});await page.waitForSelector('.b3-victory-crew');await page.waitForTimeout(150);
 const initial=await capture('initial-failed');assert.equal(initial.canvases,0);assert.equal(initial.fallback.visible,true);
 await page.evaluate(()=>globalThis.__cxvRestoreContext());
 report.errors=errors;report.blockedRequests=blockedRequests;report.consoleErrors=consoleErrors;report.initialFallbackVisible=initial.fallback.visible;report.restartFallbackVisible=restarted.fallback.visible;report.reproducedBlankRestart=!restarted.fallback.visible&&restarted.canvases===0;report.recovered=recovered.ready==='true'&&recovered.drawn==='4';
 const expected='THREE.WebGLRenderer: Error creating WebGL context.';
 report.expectedConsoleErrors=consoleErrors.filter(e=>e===expected);report.unexpectedErrors=errors.filter(e=>e!==expected);report.unhandledPageErrors=unhandledPageErrors;
 assert.equal(report.expectedConsoleErrors.length,2,'Exactly two intentional constructor failures');assert.equal(initial.injectedCalls,4,'Two failed getContext attempts per constructor');
 report.identityAfter=production?fixture.runtimeEvidence():localEvidence();if(production)assert.equal(report.identityAfter.indexSha256,report.indexSha256);else{assert.equal(report.identityAfter.runtimePatchSha256,report.runtimePatchSha256);assert.deepEqual(report.identityAfter.runtimeUntrackedSha256,report.runtimeUntrackedSha256);}
 report.harnessCompleted=!report.unexpectedErrors.length&&!unhandledPageErrors.length&&report.recovered&&initial.fallback.visible;report.applicationPass=report.harnessCompleted&&restarted.fallback.visible;
 if(prototype)assert.equal(report.override.length,1);report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,harnessCompleted:report.harnessCompleted,applicationPass:report.applicationPass,reproducedBlankRestart:report.reproducedBlankRestart,errors,consoleErrors}));assert(report.harnessCompleted);if(expectPass)assert(report.applicationPass,'Native failure/recovery must retain visible fallback');
}finally{await browser.close();}
