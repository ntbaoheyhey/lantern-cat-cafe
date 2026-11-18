/** Counterfactual failure branches on one retained page and decoded background. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-E-victory-fallback-retained-page'),hash=x=>createHash('sha256').update(x).digest('hex');assert(!existsSync(out));await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Diagnostic browser-response switch restores old readiness placement only when explicitly enabled. Compare old and native failed restarts on one retained result host and decoded background. Native branch follows actual local component. Does not resolve independent cross-browser background pixels.',overrides:[],captures:[],pass:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{fixedClock:false,setupPage:async page=>{
  await page.route('**/VictoryCrew.tsx*',async route=>{const response=await route.fetch(),before=await response.text(),reset=/delete element\.dataset\.ready;\s*delete element\.dataset\.drawn;\s*delete element\.dataset\.loadError;/g;assert.equal([...before.matchAll(reset)].length,1);
   const after=before.replace(reset,'if(!globalThis.__cxvOldReadiness){$&}').replace('renderer.setPixelRatio(','if(globalThis.__cxvOldReadiness){delete element.dataset.ready;delete element.dataset.loadError;} renderer.setPixelRatio(');report.overrides.push({url:route.request().url(),before:hash(before),after:hash(after)});await route.fulfill({response,body:after});
  });
 }});
 report.url=page.url();report.browser=browser.version();report.harnessSha256=hash(await readFile(import.meta.filename));report.componentSha256=hash(await readFile(resolve(root,'apps/web/src/game/cardrpg/battle-v3/VictoryCrew.tsx')));const consoleErrors=[];page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
 await page.evaluate(()=>{const m=window.__depthReview;window.__v3a2.R.playBattle(m.battle,'auto');m.state.settings.reducedMotion=true;m.showResult();});
 const ready=()=>page.waitForSelector('.b3-victory-crew[data-ready=true] canvas',{timeout:60000});
 const capture=async name=>{await page.waitForTimeout(200);const state=await page.locator('.b3-victory-crew').evaluate(e=>{const fallback=e.querySelector('.b3-victory-fallback'),s=getComputedStyle(fallback);return{ready:e.dataset.ready??null,drawn:e.dataset.drawn??null,canvases:e.querySelectorAll('canvas').length,crewRect:e.getBoundingClientRect().toJSON(),fallbackVisible:s.visibility==='visible'&&s.display!=='none'&&Number(s.opacity)>0,failedCalls:globalThis.__cxvFailedCalls??0};});const path=resolve(out,name+'.png');await page.screenshot({path});report.captures.push({name,path,utc:new Date().toISOString(),sha256:hash(await readFile(path)),state});return state;};
 await ready();await capture('native-loaded');
 await page.evaluate(()=>{globalThis.__cxvFailedCalls=0;const original=HTMLCanvasElement.prototype.getContext;globalThis.__cxvRestore=()=>{HTMLCanvasElement.prototype.getContext=original;};HTMLCanvasElement.prototype.getContext=function(kind,...args){if(globalThis.__cxvFail&&kind==='webgl2'){globalThis.__cxvFailedCalls++;return null;}return original.call(this,kind,...args);};globalThis.__cxvOldReadiness=true;globalThis.__cxvFail=true;const m=window.__depthReview;m.state.settings.reducedMotion=false;m.notify(false);});
 await page.waitForFunction(()=>globalThis.__cxvFailedCalls===2);const old=await capture('old-restart-failed');assert(!old.fallbackVisible&&old.canvases===0&&old.ready==='true');
 await page.evaluate(()=>{globalThis.__cxvFail=false;globalThis.__cxvOldReadiness=false;const m=window.__depthReview;m.state.settings.reducedMotion=true;m.notify(false);});await ready();await capture('native-recovered');
 await page.evaluate(()=>{globalThis.__cxvFail=true;const m=window.__depthReview;m.state.settings.reducedMotion=false;m.notify(false);});await page.waitForFunction(()=>globalThis.__cxvFailedCalls===4);const fixed=await capture('native-restart-failed');assert(fixed.fallbackVisible&&fixed.canvases===0&&fixed.ready===null&&fixed.drawn===null);
 await page.evaluate(()=>globalThis.__cxvRestore());report.errors=errors;report.blockedRequests=blockedRequests;report.consoleErrors=consoleErrors;assert.deepEqual(consoleErrors,Array(2).fill('THREE.WebGLRenderer: Error creating WebGL context.'));assert(!errors.length);assert.equal(report.overrides.length,1);assert.equal(runtimeEvidence().runtimePatchSha256,report.runtimePatchSha256);report.pass=true;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,pass:report.pass,old,fixed,errors}));
}finally{await browser.close();}
